/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef } from '@angular/core';
import { ConnectedOverlayPositionChange, validateHorizontalPosition, validateVerticalPosition, } from './connected-position';
import { Subscription, Subject } from 'rxjs';
import { isElementScrolledOutsideView, isElementClippedByScrolling } from './scroll-clip';
import { coerceCssPixelValue, coerceArray } from '@angular/cdk/coercion';
// TODO: refactor clipping detection into a separate thing (part of scrolling module)
// TODO: doesn't handle both flexible width and height when it has to scroll along both axis.
/** Class to be added to the overlay bounding box. */
const boundingBoxClass = 'cdk-overlay-connected-position-bounding-box';
/** Regex used to split a string on its CSS units. */
const cssUnitPattern = /([A-Za-z%]+)$/;
/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * implicit position relative some origin element. The relative position is defined in terms of
 * a point on the origin element that is connected to a point on the overlay element. For example,
 * a basic dropdown is connecting the bottom-left corner of the origin to the top-left corner
 * of the overlay.
 */
export class FlexibleConnectedPositionStrategy {
    constructor(connectedTo, _viewportRuler, _document, _platform, _overlayContainer) {
        this._viewportRuler = _viewportRuler;
        this._document = _document;
        this._platform = _platform;
        this._overlayContainer = _overlayContainer;
        /** Last size used for the bounding box. Used to avoid resizing the overlay after open. */
        this._lastBoundingBoxSize = { width: 0, height: 0 };
        /** Whether the overlay was pushed in a previous positioning. */
        this._isPushed = false;
        /** Whether the overlay can be pushed on-screen on the initial open. */
        this._canPush = true;
        /** Whether the overlay can grow via flexible width/height after the initial open. */
        this._growAfterOpen = false;
        /** Whether the overlay's width and height can be constrained to fit within the viewport. */
        this._hasFlexibleDimensions = true;
        /** Whether the overlay position is locked. */
        this._positionLocked = false;
        /** Amount of space that must be maintained between the overlay and the edge of the viewport. */
        this._viewportMargin = 0;
        /** The Scrollable containers used to check scrollable view properties on position change. */
        this._scrollables = [];
        /** Ordered list of preferred positions, from most to least desirable. */
        this._preferredPositions = [];
        /** Subject that emits whenever the position changes. */
        this._positionChanges = new Subject();
        /** Subscription to viewport size changes. */
        this._resizeSubscription = Subscription.EMPTY;
        /** Default offset for the overlay along the x axis. */
        this._offsetX = 0;
        /** Default offset for the overlay along the y axis. */
        this._offsetY = 0;
        /** Keeps track of the CSS classes that the position strategy has applied on the overlay panel. */
        this._appliedPanelClasses = [];
        /** Observable sequence of position changes. */
        this.positionChanges = this._positionChanges;
        this.setOrigin(connectedTo);
    }
    /** Ordered list of preferred positions, from most to least desirable. */
    get positions() {
        return this._preferredPositions;
    }
    /** Attaches this position strategy to an overlay. */
    attach(overlayRef) {
        if (this._overlayRef &&
            overlayRef !== this._overlayRef &&
            (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw Error('This position strategy is already attached to an overlay');
        }
        this._validatePositions();
        overlayRef.hostElement.classList.add(boundingBoxClass);
        this._overlayRef = overlayRef;
        this._boundingBox = overlayRef.hostElement;
        this._pane = overlayRef.overlayElement;
        this._isDisposed = false;
        this._isInitialRender = true;
        this._lastPosition = null;
        this._resizeSubscription.unsubscribe();
        this._resizeSubscription = this._viewportRuler.change().subscribe(() => {
            // When the window is resized, we want to trigger the next reposition as if it
            // was an initial render, in order for the strategy to pick a new optimal position,
            // otherwise position locking will cause it to stay at the old one.
            this._isInitialRender = true;
            this.apply();
        });
    }
    /**
     * Updates the position of the overlay element, using whichever preferred position relative
     * to the origin best fits on-screen.
     *
     * The selection of a position goes as follows:
     *  - If any positions fit completely within the viewport as-is,
     *      choose the first position that does so.
     *  - If flexible dimensions are enabled and at least one satifies the given minimum width/height,
     *      choose the position with the greatest available size modified by the positions' weight.
     *  - If pushing is enabled, take the position that went off-screen the least and push it
     *      on-screen.
     *  - If none of the previous criteria were met, use the position that goes off-screen the least.
     * @docs-private
     */
    apply() {
        // We shouldn't do anything if the strategy was disposed or we're on the server.
        if (this._isDisposed || !this._platform.isBrowser) {
            return;
        }
        // If the position has been applied already (e.g. when the overlay was opened) and the
        // consumer opted into locking in the position, re-use the old position, in order to
        // prevent the overlay from jumping around.
        if (!this._isInitialRender && this._positionLocked && this._lastPosition) {
            this.reapplyLastPosition();
            return;
        }
        this._clearPanelClasses();
        this._resetOverlayElementStyles();
        this._resetBoundingBoxStyles();
        // We need the bounding rects for the origin and the overlay to determine how to position
        // the overlay relative to the origin.
        // We use the viewport rect to determine whether a position would go off-screen.
        this._viewportRect = this._getNarrowedViewportRect();
        this._originRect = this._getOriginRect();
        this._overlayRect = this._pane.getBoundingClientRect();
        const originRect = this._originRect;
        const overlayRect = this._overlayRect;
        const viewportRect = this._viewportRect;
        // Positions where the overlay will fit with flexible dimensions.
        const flexibleFits = [];
        // Fallback if none of the preferred positions fit within the viewport.
        let fallback;
        // Go through each of the preferred positions looking for a good fit.
        // If a good fit is found, it will be applied immediately.
        for (let pos of this._preferredPositions) {
            // Get the exact (x, y) coordinate for the point-of-origin on the origin element.
            let originPoint = this._getOriginPoint(originRect, pos);
            // From that point-of-origin, get the exact (x, y) coordinate for the top-left corner of the
            // overlay in this position. We use the top-left corner for calculations and later translate
            // this into an appropriate (top, left, bottom, right) style.
            let overlayPoint = this._getOverlayPoint(originPoint, overlayRect, pos);
            // Calculate how well the overlay would fit into the viewport with this point.
            let overlayFit = this._getOverlayFit(overlayPoint, overlayRect, viewportRect, pos);
            // If the overlay, without any further work, fits into the viewport, use this position.
            if (overlayFit.isCompletelyWithinViewport) {
                this._isPushed = false;
                this._applyPosition(pos, originPoint);
                return;
            }
            // If the overlay has flexible dimensions, we can use this position
            // so long as there's enough space for the minimum dimensions.
            if (this._canFitWithFlexibleDimensions(overlayFit, overlayPoint, viewportRect)) {
                // Save positions where the overlay will fit with flexible dimensions. We will use these
                // if none of the positions fit *without* flexible dimensions.
                flexibleFits.push({
                    position: pos,
                    origin: originPoint,
                    overlayRect,
                    boundingBoxRect: this._calculateBoundingBoxRect(originPoint, pos),
                });
                continue;
            }
            // If the current preferred position does not fit on the screen, remember the position
            // if it has more visible area on-screen than we've seen and move onto the next preferred
            // position.
            if (!fallback || fallback.overlayFit.visibleArea < overlayFit.visibleArea) {
                fallback = { overlayFit, overlayPoint, originPoint, position: pos, overlayRect };
            }
        }
        // If there are any positions where the overlay would fit with flexible dimensions, choose the
        // one that has the greatest area available modified by the position's weight
        if (flexibleFits.length) {
            let bestFit = null;
            let bestScore = -1;
            for (const fit of flexibleFits) {
                const score = fit.boundingBoxRect.width * fit.boundingBoxRect.height * (fit.position.weight || 1);
                if (score > bestScore) {
                    bestScore = score;
                    bestFit = fit;
                }
            }
            this._isPushed = false;
            this._applyPosition(bestFit.position, bestFit.origin);
            return;
        }
        // When none of the preferred positions fit within the viewport, take the position
        // that went off-screen the least and attempt to push it on-screen.
        if (this._canPush) {
            // TODO(jelbourn): after pushing, the opening "direction" of the overlay might not make sense.
            this._isPushed = true;
            this._applyPosition(fallback.position, fallback.originPoint);
            return;
        }
        // All options for getting the overlay within the viewport have been exhausted, so go with the
        // position that went off-screen the least.
        this._applyPosition(fallback.position, fallback.originPoint);
    }
    detach() {
        this._clearPanelClasses();
        this._lastPosition = null;
        this._previousPushAmount = null;
        this._resizeSubscription.unsubscribe();
    }
    /** Cleanup after the element gets destroyed. */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        // We can't use `_resetBoundingBoxStyles` here, because it resets
        // some properties to zero, rather than removing them.
        if (this._boundingBox) {
            extendStyles(this._boundingBox.style, {
                top: '',
                left: '',
                right: '',
                bottom: '',
                height: '',
                width: '',
                alignItems: '',
                justifyContent: '',
            });
        }
        if (this._pane) {
            this._resetOverlayElementStyles();
        }
        if (this._overlayRef) {
            this._overlayRef.hostElement.classList.remove(boundingBoxClass);
        }
        this.detach();
        this._positionChanges.complete();
        this._overlayRef = this._boundingBox = null;
        this._isDisposed = true;
    }
    /**
     * This re-aligns the overlay element with the trigger in its last calculated position,
     * even if a position higher in the "preferred positions" list would now fit. This
     * allows one to re-align the panel without changing the orientation of the panel.
     */
    reapplyLastPosition() {
        if (!this._isDisposed && (!this._platform || this._platform.isBrowser)) {
            this._originRect = this._getOriginRect();
            this._overlayRect = this._pane.getBoundingClientRect();
            this._viewportRect = this._getNarrowedViewportRect();
            const lastPosition = this._lastPosition || this._preferredPositions[0];
            const originPoint = this._getOriginPoint(this._originRect, lastPosition);
            this._applyPosition(lastPosition, originPoint);
        }
    }
    /**
     * Sets the list of Scrollable containers that host the origin element so that
     * on reposition we can evaluate if it or the overlay has been clipped or outside view. Every
     * Scrollable must be an ancestor element of the strategy's origin element.
     */
    withScrollableContainers(scrollables) {
        this._scrollables = scrollables;
        return this;
    }
    /**
     * Adds new preferred positions.
     * @param positions List of positions options for this overlay.
     */
    withPositions(positions) {
        this._preferredPositions = positions;
        // If the last calculated position object isn't part of the positions anymore, clear
        // it in order to avoid it being picked up if the consumer tries to re-apply.
        if (positions.indexOf(this._lastPosition) === -1) {
            this._lastPosition = null;
        }
        this._validatePositions();
        return this;
    }
    /**
     * Sets a minimum distance the overlay may be positioned to the edge of the viewport.
     * @param margin Required margin between the overlay and the viewport edge in pixels.
     */
    withViewportMargin(margin) {
        this._viewportMargin = margin;
        return this;
    }
    /** Sets whether the overlay's width and height can be constrained to fit within the viewport. */
    withFlexibleDimensions(flexibleDimensions = true) {
        this._hasFlexibleDimensions = flexibleDimensions;
        return this;
    }
    /** Sets whether the overlay can grow after the initial open via flexible width/height. */
    withGrowAfterOpen(growAfterOpen = true) {
        this._growAfterOpen = growAfterOpen;
        return this;
    }
    /** Sets whether the overlay can be pushed on-screen if none of the provided positions fit. */
    withPush(canPush = true) {
        this._canPush = canPush;
        return this;
    }
    /**
     * Sets whether the overlay's position should be locked in after it is positioned
     * initially. When an overlay is locked in, it won't attempt to reposition itself
     * when the position is re-applied (e.g. when the user scrolls away).
     * @param isLocked Whether the overlay should locked in.
     */
    withLockedPosition(isLocked = true) {
        this._positionLocked = isLocked;
        return this;
    }
    /**
     * Sets the origin, relative to which to position the overlay.
     * Using an element origin is useful for building components that need to be positioned
     * relatively to a trigger (e.g. dropdown menus or tooltips), whereas using a point can be
     * used for cases like contextual menus which open relative to the user's pointer.
     * @param origin Reference to the new origin.
     */
    setOrigin(origin) {
        this._origin = origin;
        return this;
    }
    /**
     * Sets the default offset for the overlay's connection point on the x-axis.
     * @param offset New offset in the X axis.
     */
    withDefaultOffsetX(offset) {
        this._offsetX = offset;
        return this;
    }
    /**
     * Sets the default offset for the overlay's connection point on the y-axis.
     * @param offset New offset in the Y axis.
     */
    withDefaultOffsetY(offset) {
        this._offsetY = offset;
        return this;
    }
    /**
     * Configures that the position strategy should set a `transform-origin` on some elements
     * inside the overlay, depending on the current position that is being applied. This is
     * useful for the cases where the origin of an animation can change depending on the
     * alignment of the overlay.
     * @param selector CSS selector that will be used to find the target
     *    elements onto which to set the transform origin.
     */
    withTransformOriginOn(selector) {
        this._transformOriginSelector = selector;
        return this;
    }
    /**
     * Gets the (x, y) coordinate of a connection point on the origin based on a relative position.
     */
    _getOriginPoint(originRect, pos) {
        let x;
        if (pos.originX == 'center') {
            // Note: when centering we should always use the `left`
            // offset, otherwise the position will be wrong in RTL.
            x = originRect.left + originRect.width / 2;
        }
        else {
            const startX = this._isRtl() ? originRect.right : originRect.left;
            const endX = this._isRtl() ? originRect.left : originRect.right;
            x = pos.originX == 'start' ? startX : endX;
        }
        let y;
        if (pos.originY == 'center') {
            y = originRect.top + originRect.height / 2;
        }
        else {
            y = pos.originY == 'top' ? originRect.top : originRect.bottom;
        }
        return { x, y };
    }
    /**
     * Gets the (x, y) coordinate of the top-left corner of the overlay given a given position and
     * origin point to which the overlay should be connected.
     */
    _getOverlayPoint(originPoint, overlayRect, pos) {
        // Calculate the (overlayStartX, overlayStartY), the start of the
        // potential overlay position relative to the origin point.
        let overlayStartX;
        if (pos.overlayX == 'center') {
            overlayStartX = -overlayRect.width / 2;
        }
        else if (pos.overlayX === 'start') {
            overlayStartX = this._isRtl() ? -overlayRect.width : 0;
        }
        else {
            overlayStartX = this._isRtl() ? 0 : -overlayRect.width;
        }
        let overlayStartY;
        if (pos.overlayY == 'center') {
            overlayStartY = -overlayRect.height / 2;
        }
        else {
            overlayStartY = pos.overlayY == 'top' ? 0 : -overlayRect.height;
        }
        // The (x, y) coordinates of the overlay.
        return {
            x: originPoint.x + overlayStartX,
            y: originPoint.y + overlayStartY,
        };
    }
    /** Gets how well an overlay at the given point will fit within the viewport. */
    _getOverlayFit(point, rawOverlayRect, viewport, position) {
        // Round the overlay rect when comparing against the
        // viewport, because the viewport is always rounded.
        const overlay = getRoundedBoundingClientRect(rawOverlayRect);
        let { x, y } = point;
        let offsetX = this._getOffset(position, 'x');
        let offsetY = this._getOffset(position, 'y');
        // Account for the offsets since they could push the overlay out of the viewport.
        if (offsetX) {
            x += offsetX;
        }
        if (offsetY) {
            y += offsetY;
        }
        // How much the overlay would overflow at this position, on each side.
        let leftOverflow = 0 - x;
        let rightOverflow = x + overlay.width - viewport.width;
        let topOverflow = 0 - y;
        let bottomOverflow = y + overlay.height - viewport.height;
        // Visible parts of the element on each axis.
        let visibleWidth = this._subtractOverflows(overlay.width, leftOverflow, rightOverflow);
        let visibleHeight = this._subtractOverflows(overlay.height, topOverflow, bottomOverflow);
        let visibleArea = visibleWidth * visibleHeight;
        return {
            visibleArea,
            isCompletelyWithinViewport: overlay.width * overlay.height === visibleArea,
            fitsInViewportVertically: visibleHeight === overlay.height,
            fitsInViewportHorizontally: visibleWidth == overlay.width,
        };
    }
    /**
     * Whether the overlay can fit within the viewport when it may resize either its width or height.
     * @param fit How well the overlay fits in the viewport at some position.
     * @param point The (x, y) coordinates of the overlat at some position.
     * @param viewport The geometry of the viewport.
     */
    _canFitWithFlexibleDimensions(fit, point, viewport) {
        if (this._hasFlexibleDimensions) {
            const availableHeight = viewport.bottom - point.y;
            const availableWidth = viewport.right - point.x;
            const minHeight = getPixelValue(this._overlayRef.getConfig().minHeight);
            const minWidth = getPixelValue(this._overlayRef.getConfig().minWidth);
            const verticalFit = fit.fitsInViewportVertically || (minHeight != null && minHeight <= availableHeight);
            const horizontalFit = fit.fitsInViewportHorizontally || (minWidth != null && minWidth <= availableWidth);
            return verticalFit && horizontalFit;
        }
        return false;
    }
    /**
     * Gets the point at which the overlay can be "pushed" on-screen. If the overlay is larger than
     * the viewport, the top-left corner will be pushed on-screen (with overflow occuring on the
     * right and bottom).
     *
     * @param start Starting point from which the overlay is pushed.
     * @param overlay Dimensions of the overlay.
     * @param scrollPosition Current viewport scroll position.
     * @returns The point at which to position the overlay after pushing. This is effectively a new
     *     originPoint.
     */
    _pushOverlayOnScreen(start, rawOverlayRect, scrollPosition) {
        // If the position is locked and we've pushed the overlay already, reuse the previous push
        // amount, rather than pushing it again. If we were to continue pushing, the element would
        // remain in the viewport, which goes against the expectations when position locking is enabled.
        if (this._previousPushAmount && this._positionLocked) {
            return {
                x: start.x + this._previousPushAmount.x,
                y: start.y + this._previousPushAmount.y,
            };
        }
        // Round the overlay rect when comparing against the
        // viewport, because the viewport is always rounded.
        const overlay = getRoundedBoundingClientRect(rawOverlayRect);
        const viewport = this._viewportRect;
        // Determine how much the overlay goes outside the viewport on each
        // side, which we'll use to decide which direction to push it.
        const overflowRight = Math.max(start.x + overlay.width - viewport.width, 0);
        const overflowBottom = Math.max(start.y + overlay.height - viewport.height, 0);
        const overflowTop = Math.max(viewport.top - scrollPosition.top - start.y, 0);
        const overflowLeft = Math.max(viewport.left - scrollPosition.left - start.x, 0);
        // Amount by which to push the overlay in each axis such that it remains on-screen.
        let pushX = 0;
        let pushY = 0;
        // If the overlay fits completely within the bounds of the viewport, push it from whichever
        // direction is goes off-screen. Otherwise, push the top-left corner such that its in the
        // viewport and allow for the trailing end of the overlay to go out of bounds.
        if (overlay.width <= viewport.width) {
            pushX = overflowLeft || -overflowRight;
        }
        else {
            pushX = start.x < this._viewportMargin ? viewport.left - scrollPosition.left - start.x : 0;
        }
        if (overlay.height <= viewport.height) {
            pushY = overflowTop || -overflowBottom;
        }
        else {
            pushY = start.y < this._viewportMargin ? viewport.top - scrollPosition.top - start.y : 0;
        }
        this._previousPushAmount = { x: pushX, y: pushY };
        return {
            x: start.x + pushX,
            y: start.y + pushY,
        };
    }
    /**
     * Applies a computed position to the overlay and emits a position change.
     * @param position The position preference
     * @param originPoint The point on the origin element where the overlay is connected.
     */
    _applyPosition(position, originPoint) {
        this._setTransformOrigin(position);
        this._setOverlayElementStyles(originPoint, position);
        this._setBoundingBoxStyles(originPoint, position);
        if (position.panelClass) {
            this._addPanelClasses(position.panelClass);
        }
        // Save the last connected position in case the position needs to be re-calculated.
        this._lastPosition = position;
        // Notify that the position has been changed along with its change properties.
        // We only emit if we've got any subscriptions, because the scroll visibility
        // calculcations can be somewhat expensive.
        if (this._positionChanges.observers.length) {
            const scrollableViewProperties = this._getScrollVisibility();
            const changeEvent = new ConnectedOverlayPositionChange(position, scrollableViewProperties);
            this._positionChanges.next(changeEvent);
        }
        this._isInitialRender = false;
    }
    /** Sets the transform origin based on the configured selector and the passed-in position.  */
    _setTransformOrigin(position) {
        if (!this._transformOriginSelector) {
            return;
        }
        const elements = this._boundingBox.querySelectorAll(this._transformOriginSelector);
        let xOrigin;
        let yOrigin = position.overlayY;
        if (position.overlayX === 'center') {
            xOrigin = 'center';
        }
        else if (this._isRtl()) {
            xOrigin = position.overlayX === 'start' ? 'right' : 'left';
        }
        else {
            xOrigin = position.overlayX === 'start' ? 'left' : 'right';
        }
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.transformOrigin = `${xOrigin} ${yOrigin}`;
        }
    }
    /**
     * Gets the position and size of the overlay's sizing container.
     *
     * This method does no measuring and applies no styles so that we can cheaply compute the
     * bounds for all positions and choose the best fit based on these results.
     */
    _calculateBoundingBoxRect(origin, position) {
        const viewport = this._viewportRect;
        const isRtl = this._isRtl();
        let height, top, bottom;
        if (position.overlayY === 'top') {
            // Overlay is opening "downward" and thus is bound by the bottom viewport edge.
            top = origin.y;
            height = viewport.height - top + this._viewportMargin;
        }
        else if (position.overlayY === 'bottom') {
            // Overlay is opening "upward" and thus is bound by the top viewport edge. We need to add
            // the viewport margin back in, because the viewport rect is narrowed down to remove the
            // margin, whereas the `origin` position is calculated based on its `ClientRect`.
            bottom = viewport.height - origin.y + this._viewportMargin * 2;
            height = viewport.height - bottom + this._viewportMargin;
        }
        else {
            // If neither top nor bottom, it means that the overlay is vertically centered on the
            // origin point. Note that we want the position relative to the viewport, rather than
            // the page, which is why we don't use something like `viewport.bottom - origin.y` and
            // `origin.y - viewport.top`.
            const smallestDistanceToViewportEdge = Math.min(viewport.bottom - origin.y + viewport.top, origin.y);
            const previousHeight = this._lastBoundingBoxSize.height;
            height = smallestDistanceToViewportEdge * 2;
            top = origin.y - smallestDistanceToViewportEdge;
            if (height > previousHeight && !this._isInitialRender && !this._growAfterOpen) {
                top = origin.y - previousHeight / 2;
            }
        }
        // The overlay is opening 'right-ward' (the content flows to the right).
        const isBoundedByRightViewportEdge = (position.overlayX === 'start' && !isRtl) || (position.overlayX === 'end' && isRtl);
        // The overlay is opening 'left-ward' (the content flows to the left).
        const isBoundedByLeftViewportEdge = (position.overlayX === 'end' && !isRtl) || (position.overlayX === 'start' && isRtl);
        let width, left, right;
        if (isBoundedByLeftViewportEdge) {
            right = viewport.width - origin.x + this._viewportMargin;
            width = origin.x - this._viewportMargin;
        }
        else if (isBoundedByRightViewportEdge) {
            left = origin.x;
            width = viewport.right - origin.x;
        }
        else {
            // If neither start nor end, it means that the overlay is horizontally centered on the
            // origin point. Note that we want the position relative to the viewport, rather than
            // the page, which is why we don't use something like `viewport.right - origin.x` and
            // `origin.x - viewport.left`.
            const smallestDistanceToViewportEdge = Math.min(viewport.right - origin.x + viewport.left, origin.x);
            const previousWidth = this._lastBoundingBoxSize.width;
            width = smallestDistanceToViewportEdge * 2;
            left = origin.x - smallestDistanceToViewportEdge;
            if (width > previousWidth && !this._isInitialRender && !this._growAfterOpen) {
                left = origin.x - previousWidth / 2;
            }
        }
        return { top: top, left: left, bottom: bottom, right: right, width, height };
    }
    /**
     * Sets the position and size of the overlay's sizing wrapper. The wrapper is positioned on the
     * origin's connection point and stetches to the bounds of the viewport.
     *
     * @param origin The point on the origin element where the overlay is connected.
     * @param position The position preference
     */
    _setBoundingBoxStyles(origin, position) {
        const boundingBoxRect = this._calculateBoundingBoxRect(origin, position);
        // It's weird if the overlay *grows* while scrolling, so we take the last size into account
        // when applying a new size.
        if (!this._isInitialRender && !this._growAfterOpen) {
            boundingBoxRect.height = Math.min(boundingBoxRect.height, this._lastBoundingBoxSize.height);
            boundingBoxRect.width = Math.min(boundingBoxRect.width, this._lastBoundingBoxSize.width);
        }
        const styles = {};
        if (this._hasExactPosition()) {
            styles.top = styles.left = '0';
            styles.bottom = styles.right = styles.maxHeight = styles.maxWidth = '';
            styles.width = styles.height = '100%';
        }
        else {
            const maxHeight = this._overlayRef.getConfig().maxHeight;
            const maxWidth = this._overlayRef.getConfig().maxWidth;
            styles.height = coerceCssPixelValue(boundingBoxRect.height);
            styles.top = coerceCssPixelValue(boundingBoxRect.top);
            styles.bottom = coerceCssPixelValue(boundingBoxRect.bottom);
            styles.width = coerceCssPixelValue(boundingBoxRect.width);
            styles.left = coerceCssPixelValue(boundingBoxRect.left);
            styles.right = coerceCssPixelValue(boundingBoxRect.right);
            // Push the pane content towards the proper direction.
            if (position.overlayX === 'center') {
                styles.alignItems = 'center';
            }
            else {
                styles.alignItems = position.overlayX === 'end' ? 'flex-end' : 'flex-start';
            }
            if (position.overlayY === 'center') {
                styles.justifyContent = 'center';
            }
            else {
                styles.justifyContent = position.overlayY === 'bottom' ? 'flex-end' : 'flex-start';
            }
            if (maxHeight) {
                styles.maxHeight = coerceCssPixelValue(maxHeight);
            }
            if (maxWidth) {
                styles.maxWidth = coerceCssPixelValue(maxWidth);
            }
        }
        this._lastBoundingBoxSize = boundingBoxRect;
        extendStyles(this._boundingBox.style, styles);
    }
    /** Resets the styles for the bounding box so that a new positioning can be computed. */
    _resetBoundingBoxStyles() {
        extendStyles(this._boundingBox.style, {
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            height: '',
            width: '',
            alignItems: '',
            justifyContent: '',
        });
    }
    /** Resets the styles for the overlay pane so that a new positioning can be computed. */
    _resetOverlayElementStyles() {
        extendStyles(this._pane.style, {
            top: '',
            left: '',
            bottom: '',
            right: '',
            position: '',
            transform: '',
        });
    }
    /** Sets positioning styles to the overlay element. */
    _setOverlayElementStyles(originPoint, position) {
        const styles = {};
        const hasExactPosition = this._hasExactPosition();
        const hasFlexibleDimensions = this._hasFlexibleDimensions;
        const config = this._overlayRef.getConfig();
        if (hasExactPosition) {
            const scrollPosition = this._viewportRuler.getViewportScrollPosition();
            extendStyles(styles, this._getExactOverlayY(position, originPoint, scrollPosition));
            extendStyles(styles, this._getExactOverlayX(position, originPoint, scrollPosition));
        }
        else {
            styles.position = 'static';
        }
        // Use a transform to apply the offsets. We do this because the `center` positions rely on
        // being in the normal flex flow and setting a `top` / `left` at all will completely throw
        // off the position. We also can't use margins, because they won't have an effect in some
        // cases where the element doesn't have anything to "push off of". Finally, this works
        // better both with flexible and non-flexible positioning.
        let transformString = '';
        let offsetX = this._getOffset(position, 'x');
        let offsetY = this._getOffset(position, 'y');
        if (offsetX) {
            transformString += `translateX(${offsetX}px) `;
        }
        if (offsetY) {
            transformString += `translateY(${offsetY}px)`;
        }
        styles.transform = transformString.trim();
        // If a maxWidth or maxHeight is specified on the overlay, we remove them. We do this because
        // we need these values to both be set to "100%" for the automatic flexible sizing to work.
        // The maxHeight and maxWidth are set on the boundingBox in order to enforce the constraint.
        // Note that this doesn't apply when we have an exact position, in which case we do want to
        // apply them because they'll be cleared from the bounding box.
        if (config.maxHeight) {
            if (hasExactPosition) {
                styles.maxHeight = coerceCssPixelValue(config.maxHeight);
            }
            else if (hasFlexibleDimensions) {
                styles.maxHeight = '';
            }
        }
        if (config.maxWidth) {
            if (hasExactPosition) {
                styles.maxWidth = coerceCssPixelValue(config.maxWidth);
            }
            else if (hasFlexibleDimensions) {
                styles.maxWidth = '';
            }
        }
        extendStyles(this._pane.style, styles);
    }
    /** Gets the exact top/bottom for the overlay when not using flexible sizing or when pushing. */
    _getExactOverlayY(position, originPoint, scrollPosition) {
        // Reset any existing styles. This is necessary in case the
        // preferred position has changed since the last `apply`.
        let styles = { top: '', bottom: '' };
        let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
        if (this._isPushed) {
            overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
        }
        let virtualKeyboardOffset = this._overlayContainer
            .getContainerElement()
            .getBoundingClientRect().top;
        // Normally this would be zero, however when the overlay is attached to an input (e.g. in an
        // autocomplete), mobile browsers will shift everything in order to put the input in the middle
        // of the screen and to make space for the virtual keyboard. We need to account for this offset,
        // otherwise our positioning will be thrown off.
        overlayPoint.y -= virtualKeyboardOffset;
        // We want to set either `top` or `bottom` based on whether the overlay wants to appear
        // above or below the origin and the direction in which the element will expand.
        if (position.overlayY === 'bottom') {
            // When using `bottom`, we adjust the y position such that it is the distance
            // from the bottom of the viewport rather than the top.
            const documentHeight = this._document.documentElement.clientHeight;
            styles.bottom = `${documentHeight - (overlayPoint.y + this._overlayRect.height)}px`;
        }
        else {
            styles.top = coerceCssPixelValue(overlayPoint.y);
        }
        return styles;
    }
    /** Gets the exact left/right for the overlay when not using flexible sizing or when pushing. */
    _getExactOverlayX(position, originPoint, scrollPosition) {
        // Reset any existing styles. This is necessary in case the preferred position has
        // changed since the last `apply`.
        let styles = { left: '', right: '' };
        let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
        if (this._isPushed) {
            overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
        }
        // We want to set either `left` or `right` based on whether the overlay wants to appear "before"
        // or "after" the origin, which determines the direction in which the element will expand.
        // For the horizontal axis, the meaning of "before" and "after" change based on whether the
        // page is in RTL or LTR.
        let horizontalStyleProperty;
        if (this._isRtl()) {
            horizontalStyleProperty = position.overlayX === 'end' ? 'left' : 'right';
        }
        else {
            horizontalStyleProperty = position.overlayX === 'end' ? 'right' : 'left';
        }
        // When we're setting `right`, we adjust the x position such that it is the distance
        // from the right edge of the viewport rather than the left edge.
        if (horizontalStyleProperty === 'right') {
            const documentWidth = this._document.documentElement.clientWidth;
            styles.right = `${documentWidth - (overlayPoint.x + this._overlayRect.width)}px`;
        }
        else {
            styles.left = coerceCssPixelValue(overlayPoint.x);
        }
        return styles;
    }
    /**
     * Gets the view properties of the trigger and overlay, including whether they are clipped
     * or completely outside the view of any of the strategy's scrollables.
     */
    _getScrollVisibility() {
        // Note: needs fresh rects since the position could've changed.
        const originBounds = this._getOriginRect();
        const overlayBounds = this._pane.getBoundingClientRect();
        // TODO(jelbourn): instead of needing all of the client rects for these scrolling containers
        // every time, we should be able to use the scrollTop of the containers if the size of those
        // containers hasn't changed.
        const scrollContainerBounds = this._scrollables.map(scrollable => {
            return scrollable.getElementRef().nativeElement.getBoundingClientRect();
        });
        return {
            isOriginClipped: isElementClippedByScrolling(originBounds, scrollContainerBounds),
            isOriginOutsideView: isElementScrolledOutsideView(originBounds, scrollContainerBounds),
            isOverlayClipped: isElementClippedByScrolling(overlayBounds, scrollContainerBounds),
            isOverlayOutsideView: isElementScrolledOutsideView(overlayBounds, scrollContainerBounds),
        };
    }
    /** Subtracts the amount that an element is overflowing on an axis from its length. */
    _subtractOverflows(length, ...overflows) {
        return overflows.reduce((currentValue, currentOverflow) => {
            return currentValue - Math.max(currentOverflow, 0);
        }, length);
    }
    /** Narrows the given viewport rect by the current _viewportMargin. */
    _getNarrowedViewportRect() {
        // We recalculate the viewport rect here ourselves, rather than using the ViewportRuler,
        // because we want to use the `clientWidth` and `clientHeight` as the base. The difference
        // being that the client properties don't include the scrollbar, as opposed to `innerWidth`
        // and `innerHeight` that do. This is necessary, because the overlay container uses
        // 100% `width` and `height` which don't include the scrollbar either.
        const width = this._document.documentElement.clientWidth;
        const height = this._document.documentElement.clientHeight;
        const scrollPosition = this._viewportRuler.getViewportScrollPosition();
        return {
            top: scrollPosition.top + this._viewportMargin,
            left: scrollPosition.left + this._viewportMargin,
            right: scrollPosition.left + width - this._viewportMargin,
            bottom: scrollPosition.top + height - this._viewportMargin,
            width: width - 2 * this._viewportMargin,
            height: height - 2 * this._viewportMargin,
        };
    }
    /** Whether the we're dealing with an RTL context */
    _isRtl() {
        return this._overlayRef.getDirection() === 'rtl';
    }
    /** Determines whether the overlay uses exact or flexible positioning. */
    _hasExactPosition() {
        return !this._hasFlexibleDimensions || this._isPushed;
    }
    /** Retrieves the offset of a position along the x or y axis. */
    _getOffset(position, axis) {
        if (axis === 'x') {
            // We don't do something like `position['offset' + axis]` in
            // order to avoid breking minifiers that rename properties.
            return position.offsetX == null ? this._offsetX : position.offsetX;
        }
        return position.offsetY == null ? this._offsetY : position.offsetY;
    }
    /** Validates that the current position match the expected values. */
    _validatePositions() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (!this._preferredPositions.length) {
                throw Error('FlexibleConnectedPositionStrategy: At least one position is required.');
            }
            // TODO(crisbeto): remove these once Angular's template type
            // checking is advanced enough to catch these cases.
            this._preferredPositions.forEach(pair => {
                validateHorizontalPosition('originX', pair.originX);
                validateVerticalPosition('originY', pair.originY);
                validateHorizontalPosition('overlayX', pair.overlayX);
                validateVerticalPosition('overlayY', pair.overlayY);
            });
        }
    }
    /** Adds a single CSS class or an array of classes on the overlay panel. */
    _addPanelClasses(cssClasses) {
        if (this._pane) {
            coerceArray(cssClasses).forEach(cssClass => {
                if (cssClass !== '' && this._appliedPanelClasses.indexOf(cssClass) === -1) {
                    this._appliedPanelClasses.push(cssClass);
                    this._pane.classList.add(cssClass);
                }
            });
        }
    }
    /** Clears the classes that the position strategy has applied from the overlay panel. */
    _clearPanelClasses() {
        if (this._pane) {
            this._appliedPanelClasses.forEach(cssClass => {
                this._pane.classList.remove(cssClass);
            });
            this._appliedPanelClasses = [];
        }
    }
    /** Returns the ClientRect of the current origin. */
    _getOriginRect() {
        const origin = this._origin;
        if (origin instanceof ElementRef) {
            return origin.nativeElement.getBoundingClientRect();
        }
        // Check for Element so SVG elements are also supported.
        if (origin instanceof Element) {
            return origin.getBoundingClientRect();
        }
        const width = origin.width || 0;
        const height = origin.height || 0;
        // If the origin is a point, return a client rect as if it was a 0x0 element at the point.
        return {
            top: origin.y,
            bottom: origin.y + height,
            left: origin.x,
            right: origin.x + width,
            height,
            width,
        };
    }
}
/** Shallow-extends a stylesheet object with another stylesheet object. */
function extendStyles(destination, source) {
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            destination[key] = source[key];
        }
    }
    return destination;
}
/**
 * Extracts the pixel value as a number from a value, if it's a number
 * or a CSS pixel string (e.g. `1337px`). Otherwise returns null.
 */
function getPixelValue(input) {
    if (typeof input !== 'number' && input != null) {
        const [value, units] = input.split(cssUnitPattern);
        return !units || units === 'px' ? parseFloat(value) : null;
    }
    return input || null;
}
/**
 * Gets a version of an element's bounding `ClientRect` where all the values are rounded down to
 * the nearest pixel. This allows us to account for the cases where there may be sub-pixel
 * deviations in the `ClientRect` returned by the browser (e.g. when zoomed in with a percentage
 * size, see #21350).
 */
function getRoundedBoundingClientRect(clientRect) {
    return {
        top: Math.floor(clientRect.top),
        right: Math.floor(clientRect.right),
        bottom: Math.floor(clientRect.bottom),
        left: Math.floor(clientRect.left),
        width: Math.floor(clientRect.width),
        height: Math.floor(clientRect.height),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFDTCw4QkFBOEIsRUFHOUIsMEJBQTBCLEVBQzFCLHdCQUF3QixHQUN6QixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBYSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRXZELE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RixPQUFPLEVBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFJdkUscUZBQXFGO0FBQ3JGLDZGQUE2RjtBQUU3RixxREFBcUQ7QUFDckQsTUFBTSxnQkFBZ0IsR0FBRyw2Q0FBNkMsQ0FBQztBQUV2RSxxREFBcUQ7QUFDckQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBY3ZDOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxpQ0FBaUM7SUEwRjVDLFlBQ0UsV0FBb0QsRUFDNUMsY0FBNkIsRUFDN0IsU0FBbUIsRUFDbkIsU0FBbUIsRUFDbkIsaUJBQW1DO1FBSG5DLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBQzdCLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBeEY3QywwRkFBMEY7UUFDbEYseUJBQW9CLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUMs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SSxJQUFJLEVBQUU7UUFDOUMsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDNUQ7SUFFRCxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyw0QkFBNEIsQ0FBQyxVQUFzQjtJQUMxRCxPQUFPO1FBQ0wsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQ25DLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7UUFDckMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztRQUNqQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQ25DLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7S0FDdEMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQb3NpdGlvblN0cmF0ZWd5fSBmcm9tICcuL3Bvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXIsIENka1Njcm9sbGFibGUsIFZpZXdwb3J0U2Nyb2xsUG9zaXRpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtcbiAgQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlLFxuICBDb25uZWN0aW9uUG9zaXRpb25QYWlyLFxuICBTY3JvbGxpbmdWaXNpYmlsaXR5LFxuICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbixcbiAgdmFsaWRhdGVWZXJ0aWNhbFBvc2l0aW9uLFxufSBmcm9tICcuL2Nvbm5lY3RlZC1wb3NpdGlvbic7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YnNjcmlwdGlvbiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4uL292ZXJsYXktcmVmZXJlbmNlJztcbmltcG9ydCB7aXNFbGVtZW50U2Nyb2xsZWRPdXRzaWRlVmlldywgaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nfSBmcm9tICcuL3Njcm9sbC1jbGlwJztcbmltcG9ydCB7Y29lcmNlQ3NzUGl4ZWxWYWx1ZSwgY29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtPdmVybGF5Q29udGFpbmVyfSBmcm9tICcuLi9vdmVybGF5LWNvbnRhaW5lcic7XG5cbi8vIFRPRE86IHJlZmFjdG9yIGNsaXBwaW5nIGRldGVjdGlvbiBpbnRvIGEgc2VwYXJhdGUgdGhpbmcgKHBhcnQgb2Ygc2Nyb2xsaW5nIG1vZHVsZSlcbi8vIFRPRE86IGRvZXNuJ3QgaGFuZGxlIGJvdGggZmxleGlibGUgd2lkdGggYW5kIGhlaWdodCB3aGVuIGl0IGhhcyB0byBzY3JvbGwgYWxvbmcgYm90aCBheGlzLlxuXG4vKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIG92ZXJsYXkgYm91bmRpbmcgYm94LiAqL1xuY29uc3QgYm91bmRpbmdCb3hDbGFzcyA9ICdjZGstb3ZlcmxheS1jb25uZWN0ZWQtcG9zaXRpb24tYm91bmRpbmctYm94JztcblxuLyoqIFJlZ2V4IHVzZWQgdG8gc3BsaXQgYSBzdHJpbmcgb24gaXRzIENTUyB1bml0cy4gKi9cbmNvbnN0IGNzc1VuaXRQYXR0ZXJuID0gLyhbQS1aYS16JV0rKSQvO1xuXG4vKiogUG9zc2libGUgdmFsdWVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgb3JpZ2luIG9mIGEgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LiAqL1xuZXhwb3J0IHR5cGUgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luID1cbiAgfCBFbGVtZW50UmVmXG4gIHwgRWxlbWVudFxuICB8IChQb2ludCAmIHtcbiAgICAgIHdpZHRoPzogbnVtYmVyO1xuICAgICAgaGVpZ2h0PzogbnVtYmVyO1xuICAgIH0pO1xuXG4vKiogRXF1aXZhbGVudCBvZiBgQ2xpZW50UmVjdGAgd2l0aG91dCBzb21lIG9mIHRoZSBwcm9wZXJ0aWVzIHdlIGRvbid0IGNhcmUgYWJvdXQuICovXG50eXBlIERpbWVuc2lvbnMgPSBPbWl0PENsaWVudFJlY3QsICd4JyB8ICd5JyB8ICd0b0pTT04nPjtcblxuLyoqXG4gKiBBIHN0cmF0ZWd5IGZvciBwb3NpdGlvbmluZyBvdmVybGF5cy4gVXNpbmcgdGhpcyBzdHJhdGVneSwgYW4gb3ZlcmxheSBpcyBnaXZlbiBhblxuICogaW1wbGljaXQgcG9zaXRpb24gcmVsYXRpdmUgc29tZSBvcmlnaW4gZWxlbWVudC4gVGhlIHJlbGF0aXZlIHBvc2l0aW9uIGlzIGRlZmluZWQgaW4gdGVybXMgb2ZcbiAqIGEgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHRoYXQgaXMgY29ubmVjdGVkIHRvIGEgcG9pbnQgb24gdGhlIG92ZXJsYXkgZWxlbWVudC4gRm9yIGV4YW1wbGUsXG4gKiBhIGJhc2ljIGRyb3Bkb3duIGlzIGNvbm5lY3RpbmcgdGhlIGJvdHRvbS1sZWZ0IGNvcm5lciBvZiB0aGUgb3JpZ2luIHRvIHRoZSB0b3AtbGVmdCBjb3JuZXJcbiAqIG9mIHRoZSBvdmVybGF5LlxuICovXG5leHBvcnQgY2xhc3MgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IGltcGxlbWVudHMgUG9zaXRpb25TdHJhdGVneSB7XG4gIC8qKiBUaGUgb3ZlcmxheSB0byB3aGljaCB0aGlzIHN0cmF0ZWd5IGlzIGF0dGFjaGVkLiAqL1xuICBwcml2YXRlIF9vdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlO1xuXG4gIC8qKiBXaGV0aGVyIHdlJ3JlIHBlcmZvcm1pbmcgdGhlIHZlcnkgZmlyc3QgcG9zaXRpb25pbmcgb2YgdGhlIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbFJlbmRlcjogYm9vbGVhbjtcblxuICAvKiogTGFzdCBzaXplIHVzZWQgZm9yIHRoZSBib3VuZGluZyBib3guIFVzZWQgdG8gYXZvaWQgcmVzaXppbmcgdGhlIG92ZXJsYXkgYWZ0ZXIgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdEJvdW5kaW5nQm94U2l6ZSA9IHt3aWR0aDogMCwgaGVpZ2h0OiAwfTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSB3YXMgcHVzaGVkIGluIGEgcHJldmlvdXMgcG9zaXRpb25pbmcuICovXG4gIHByaXZhdGUgX2lzUHVzaGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gb24gdGhlIGluaXRpYWwgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfY2FuUHVzaCA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgdmlhIGZsZXhpYmxlIHdpZHRoL2hlaWdodCBhZnRlciB0aGUgaW5pdGlhbCBvcGVuLiAqL1xuICBwcml2YXRlIF9ncm93QWZ0ZXJPcGVuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfaGFzRmxleGlibGVEaW1lbnNpb25zID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBwb3NpdGlvbiBpcyBsb2NrZWQuICovXG4gIHByaXZhdGUgX3Bvc2l0aW9uTG9ja2VkID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlZCBvcmlnaW4gZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF9vcmlnaW5SZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBDYWNoZWQgb3ZlcmxheSBkaW1lbnNpb25zICovXG4gIHByaXZhdGUgX292ZXJsYXlSZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBDYWNoZWQgdmlld3BvcnQgZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF92aWV3cG9ydFJlY3Q6IERpbWVuc2lvbnM7XG5cbiAgLyoqIEFtb3VudCBvZiBzcGFjZSB0aGF0IG11c3QgYmUgbWFpbnRhaW5lZCBiZXR3ZWVuIHRoZSBvdmVybGF5IGFuZCB0aGUgZWRnZSBvZiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0TWFyZ2luID0gMDtcblxuICAvKiogVGhlIFNjcm9sbGFibGUgY29udGFpbmVycyB1c2VkIHRvIGNoZWNrIHNjcm9sbGFibGUgdmlldyBwcm9wZXJ0aWVzIG9uIHBvc2l0aW9uIGNoYW5nZS4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZXM6IENka1Njcm9sbGFibGVbXSA9IFtdO1xuXG4gIC8qKiBPcmRlcmVkIGxpc3Qgb2YgcHJlZmVycmVkIHBvc2l0aW9ucywgZnJvbSBtb3N0IHRvIGxlYXN0IGRlc2lyYWJsZS4gKi9cbiAgX3ByZWZlcnJlZFBvc2l0aW9uczogQ29ubmVjdGlvblBvc2l0aW9uUGFpcltdID0gW107XG5cbiAgLyoqIFRoZSBvcmlnaW4gZWxlbWVudCBhZ2FpbnN0IHdoaWNoIHRoZSBvdmVybGF5IHdpbGwgYmUgcG9zaXRpb25lZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW47XG5cbiAgLyoqIFRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGFuZTogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHN0cmF0ZWd5IGhhcyBiZWVuIGRpc3Bvc2VkIG9mIGFscmVhZHkuICovXG4gIHByaXZhdGUgX2lzRGlzcG9zZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFBhcmVudCBlbGVtZW50IGZvciB0aGUgb3ZlcmxheSBwYW5lbCB1c2VkIHRvIGNvbnN0cmFpbiB0aGUgb3ZlcmxheSBwYW5lbCdzIHNpemUgdG8gZml0XG4gICAqIHdpdGhpbiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9ib3VuZGluZ0JveDogSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gIC8qKiBUaGUgbGFzdCBwb3NpdGlvbiB0byBoYXZlIGJlZW4gY2FsY3VsYXRlZCBhcyB0aGUgYmVzdCBmaXQgcG9zaXRpb24uICovXG4gIHByaXZhdGUgX2xhc3RQb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24gfCBudWxsO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHBvc2l0aW9uIGNoYW5nZXMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3Bvc2l0aW9uQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4oKTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHZpZXdwb3J0IHNpemUgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBEZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkgYWxvbmcgdGhlIHggYXhpcy4gKi9cbiAgcHJpdmF0ZSBfb2Zmc2V0WCA9IDA7XG5cbiAgLyoqIERlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSBhbG9uZyB0aGUgeSBheGlzLiAqL1xuICBwcml2YXRlIF9vZmZzZXRZID0gMDtcblxuICAvKiogU2VsZWN0b3IgdG8gYmUgdXNlZCB3aGVuIGZpbmRpbmcgdGhlIGVsZW1lbnRzIG9uIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi4gKi9cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3I6IHN0cmluZztcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIENTUyBjbGFzc2VzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGhhcyBhcHBsaWVkIG9uIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9hcHBsaWVkUGFuZWxDbGFzc2VzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIG92ZXJsYXkgd2FzIHB1c2hlZCBpbiBlYWNoIGF4aXMgZHVyaW5nIHRoZSBsYXN0IHRpbWUgaXQgd2FzIHBvc2l0aW9uZWQuICovXG4gIHByaXZhdGUgX3ByZXZpb3VzUHVzaEFtb3VudDoge3g6IG51bWJlcjsgeTogbnVtYmVyfSB8IG51bGw7XG5cbiAgLyoqIE9ic2VydmFibGUgc2VxdWVuY2Ugb2YgcG9zaXRpb24gY2hhbmdlcy4gKi9cbiAgcG9zaXRpb25DaGFuZ2VzOiBPYnNlcnZhYmxlPENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4gPSB0aGlzLl9wb3NpdGlvbkNoYW5nZXM7XG5cbiAgLyoqIE9yZGVyZWQgbGlzdCBvZiBwcmVmZXJyZWQgcG9zaXRpb25zLCBmcm9tIG1vc3QgdG8gbGVhc3QgZGVzaXJhYmxlLiAqL1xuICBnZXQgcG9zaXRpb25zKCk6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucztcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbm5lY3RlZFRvOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4sXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgX292ZXJsYXlDb250YWluZXI6IE92ZXJsYXlDb250YWluZXIsXG4gICkge1xuICAgIHRoaXMuc2V0T3JpZ2luKGNvbm5lY3RlZFRvKTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGlzIHBvc2l0aW9uIHN0cmF0ZWd5IHRvIGFuIG92ZXJsYXkuICovXG4gIGF0dGFjaChvdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlKTogdm9pZCB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fb3ZlcmxheVJlZiAmJlxuICAgICAgb3ZlcmxheVJlZiAhPT0gdGhpcy5fb3ZlcmxheVJlZiAmJlxuICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSlcbiAgICApIHtcbiAgICAgIHRocm93IEVycm9yKCdUaGlzIHBvc2l0aW9uIHN0cmF0ZWd5IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYW4gb3ZlcmxheScpO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlUG9zaXRpb25zKCk7XG5cbiAgICBvdmVybGF5UmVmLmhvc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoYm91bmRpbmdCb3hDbGFzcyk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gb3ZlcmxheVJlZjtcbiAgICB0aGlzLl9ib3VuZGluZ0JveCA9IG92ZXJsYXlSZWYuaG9zdEVsZW1lbnQ7XG4gICAgdGhpcy5fcGFuZSA9IG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQ7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2lzSW5pdGlhbFJlbmRlciA9IHRydWU7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmNoYW5nZSgpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAvLyBXaGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZCwgd2Ugd2FudCB0byB0cmlnZ2VyIHRoZSBuZXh0IHJlcG9zaXRpb24gYXMgaWYgaXRcbiAgICAgIC8vIHdhcyBhbiBpbml0aWFsIHJlbmRlciwgaW4gb3JkZXIgZm9yIHRoZSBzdHJhdGVneSB0byBwaWNrIGEgbmV3IG9wdGltYWwgcG9zaXRpb24sXG4gICAgICAvLyBvdGhlcndpc2UgcG9zaXRpb24gbG9ja2luZyB3aWxsIGNhdXNlIGl0IHRvIHN0YXkgYXQgdGhlIG9sZCBvbmUuXG4gICAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSB0cnVlO1xuICAgICAgdGhpcy5hcHBseSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBvdmVybGF5IGVsZW1lbnQsIHVzaW5nIHdoaWNoZXZlciBwcmVmZXJyZWQgcG9zaXRpb24gcmVsYXRpdmVcbiAgICogdG8gdGhlIG9yaWdpbiBiZXN0IGZpdHMgb24tc2NyZWVuLlxuICAgKlxuICAgKiBUaGUgc2VsZWN0aW9uIG9mIGEgcG9zaXRpb24gZ29lcyBhcyBmb2xsb3dzOlxuICAgKiAgLSBJZiBhbnkgcG9zaXRpb25zIGZpdCBjb21wbGV0ZWx5IHdpdGhpbiB0aGUgdmlld3BvcnQgYXMtaXMsXG4gICAqICAgICAgY2hvb3NlIHRoZSBmaXJzdCBwb3NpdGlvbiB0aGF0IGRvZXMgc28uXG4gICAqICAtIElmIGZsZXhpYmxlIGRpbWVuc2lvbnMgYXJlIGVuYWJsZWQgYW5kIGF0IGxlYXN0IG9uZSBzYXRpZmllcyB0aGUgZ2l2ZW4gbWluaW11bSB3aWR0aC9oZWlnaHQsXG4gICAqICAgICAgY2hvb3NlIHRoZSBwb3NpdGlvbiB3aXRoIHRoZSBncmVhdGVzdCBhdmFpbGFibGUgc2l6ZSBtb2RpZmllZCBieSB0aGUgcG9zaXRpb25zJyB3ZWlnaHQuXG4gICAqICAtIElmIHB1c2hpbmcgaXMgZW5hYmxlZCwgdGFrZSB0aGUgcG9zaXRpb24gdGhhdCB3ZW50IG9mZi1zY3JlZW4gdGhlIGxlYXN0IGFuZCBwdXNoIGl0XG4gICAqICAgICAgb24tc2NyZWVuLlxuICAgKiAgLSBJZiBub25lIG9mIHRoZSBwcmV2aW91cyBjcml0ZXJpYSB3ZXJlIG1ldCwgdXNlIHRoZSBwb3NpdGlvbiB0aGF0IGdvZXMgb2ZmLXNjcmVlbiB0aGUgbGVhc3QuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIGFwcGx5KCk6IHZvaWQge1xuICAgIC8vIFdlIHNob3VsZG4ndCBkbyBhbnl0aGluZyBpZiB0aGUgc3RyYXRlZ3kgd2FzIGRpc3Bvc2VkIG9yIHdlJ3JlIG9uIHRoZSBzZXJ2ZXIuXG4gICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQgfHwgIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBwb3NpdGlvbiBoYXMgYmVlbiBhcHBsaWVkIGFscmVhZHkgKGUuZy4gd2hlbiB0aGUgb3ZlcmxheSB3YXMgb3BlbmVkKSBhbmQgdGhlXG4gICAgLy8gY29uc3VtZXIgb3B0ZWQgaW50byBsb2NraW5nIGluIHRoZSBwb3NpdGlvbiwgcmUtdXNlIHRoZSBvbGQgcG9zaXRpb24sIGluIG9yZGVyIHRvXG4gICAgLy8gcHJldmVudCB0aGUgb3ZlcmxheSBmcm9tIGp1bXBpbmcgYXJvdW5kLlxuICAgIGlmICghdGhpcy5faXNJbml0aWFsUmVuZGVyICYmIHRoaXMuX3Bvc2l0aW9uTG9ja2VkICYmIHRoaXMuX2xhc3RQb3NpdGlvbikge1xuICAgICAgdGhpcy5yZWFwcGx5TGFzdFBvc2l0aW9uKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYXJQYW5lbENsYXNzZXMoKTtcbiAgICB0aGlzLl9yZXNldE92ZXJsYXlFbGVtZW50U3R5bGVzKCk7XG4gICAgdGhpcy5fcmVzZXRCb3VuZGluZ0JveFN0eWxlcygpO1xuXG4gICAgLy8gV2UgbmVlZCB0aGUgYm91bmRpbmcgcmVjdHMgZm9yIHRoZSBvcmlnaW4gYW5kIHRoZSBvdmVybGF5IHRvIGRldGVybWluZSBob3cgdG8gcG9zaXRpb25cbiAgICAvLyB0aGUgb3ZlcmxheSByZWxhdGl2ZSB0byB0aGUgb3JpZ2luLlxuICAgIC8vIFdlIHVzZSB0aGUgdmlld3BvcnQgcmVjdCB0byBkZXRlcm1pbmUgd2hldGhlciBhIHBvc2l0aW9uIHdvdWxkIGdvIG9mZi1zY3JlZW4uXG4gICAgdGhpcy5fdmlld3BvcnRSZWN0ID0gdGhpcy5fZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTtcbiAgICB0aGlzLl9vcmlnaW5SZWN0ID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgIHRoaXMuX292ZXJsYXlSZWN0ID0gdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IG9yaWdpblJlY3QgPSB0aGlzLl9vcmlnaW5SZWN0O1xuICAgIGNvbnN0IG92ZXJsYXlSZWN0ID0gdGhpcy5fb3ZlcmxheVJlY3Q7XG4gICAgY29uc3Qgdmlld3BvcnRSZWN0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuXG4gICAgLy8gUG9zaXRpb25zIHdoZXJlIHRoZSBvdmVybGF5IHdpbGwgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucy5cbiAgICBjb25zdCBmbGV4aWJsZUZpdHM6IEZsZXhpYmxlRml0W10gPSBbXTtcblxuICAgIC8vIEZhbGxiYWNrIGlmIG5vbmUgb2YgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuXG4gICAgbGV0IGZhbGxiYWNrOiBGYWxsYmFja1Bvc2l0aW9uIHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gR28gdGhyb3VnaCBlYWNoIG9mIHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGxvb2tpbmcgZm9yIGEgZ29vZCBmaXQuXG4gICAgLy8gSWYgYSBnb29kIGZpdCBpcyBmb3VuZCwgaXQgd2lsbCBiZSBhcHBsaWVkIGltbWVkaWF0ZWx5LlxuICAgIGZvciAobGV0IHBvcyBvZiB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMpIHtcbiAgICAgIC8vIEdldCB0aGUgZXhhY3QgKHgsIHkpIGNvb3JkaW5hdGUgZm9yIHRoZSBwb2ludC1vZi1vcmlnaW4gb24gdGhlIG9yaWdpbiBlbGVtZW50LlxuICAgICAgbGV0IG9yaWdpblBvaW50ID0gdGhpcy5fZ2V0T3JpZ2luUG9pbnQob3JpZ2luUmVjdCwgcG9zKTtcblxuICAgICAgLy8gRnJvbSB0aGF0IHBvaW50LW9mLW9yaWdpbiwgZ2V0IHRoZSBleGFjdCAoeCwgeSkgY29vcmRpbmF0ZSBmb3IgdGhlIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGVcbiAgICAgIC8vIG92ZXJsYXkgaW4gdGhpcyBwb3NpdGlvbi4gV2UgdXNlIHRoZSB0b3AtbGVmdCBjb3JuZXIgZm9yIGNhbGN1bGF0aW9ucyBhbmQgbGF0ZXIgdHJhbnNsYXRlXG4gICAgICAvLyB0aGlzIGludG8gYW4gYXBwcm9wcmlhdGUgKHRvcCwgbGVmdCwgYm90dG9tLCByaWdodCkgc3R5bGUuXG4gICAgICBsZXQgb3ZlcmxheVBvaW50ID0gdGhpcy5fZ2V0T3ZlcmxheVBvaW50KG9yaWdpblBvaW50LCBvdmVybGF5UmVjdCwgcG9zKTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGhvdyB3ZWxsIHRoZSBvdmVybGF5IHdvdWxkIGZpdCBpbnRvIHRoZSB2aWV3cG9ydCB3aXRoIHRoaXMgcG9pbnQuXG4gICAgICBsZXQgb3ZlcmxheUZpdCA9IHRoaXMuX2dldE92ZXJsYXlGaXQob3ZlcmxheVBvaW50LCBvdmVybGF5UmVjdCwgdmlld3BvcnRSZWN0LCBwb3MpO1xuXG4gICAgICAvLyBJZiB0aGUgb3ZlcmxheSwgd2l0aG91dCBhbnkgZnVydGhlciB3b3JrLCBmaXRzIGludG8gdGhlIHZpZXdwb3J0LCB1c2UgdGhpcyBwb3NpdGlvbi5cbiAgICAgIGlmIChvdmVybGF5Rml0LmlzQ29tcGxldGVseVdpdGhpblZpZXdwb3J0KSB7XG4gICAgICAgIHRoaXMuX2lzUHVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24ocG9zLCBvcmlnaW5Qb2ludCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIG92ZXJsYXkgaGFzIGZsZXhpYmxlIGRpbWVuc2lvbnMsIHdlIGNhbiB1c2UgdGhpcyBwb3NpdGlvblxuICAgICAgLy8gc28gbG9uZyBhcyB0aGVyZSdzIGVub3VnaCBzcGFjZSBmb3IgdGhlIG1pbmltdW0gZGltZW5zaW9ucy5cbiAgICAgIGlmICh0aGlzLl9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKG92ZXJsYXlGaXQsIG92ZXJsYXlQb2ludCwgdmlld3BvcnRSZWN0KSkge1xuICAgICAgICAvLyBTYXZlIHBvc2l0aW9ucyB3aGVyZSB0aGUgb3ZlcmxheSB3aWxsIGZpdCB3aXRoIGZsZXhpYmxlIGRpbWVuc2lvbnMuIFdlIHdpbGwgdXNlIHRoZXNlXG4gICAgICAgIC8vIGlmIG5vbmUgb2YgdGhlIHBvc2l0aW9ucyBmaXQgKndpdGhvdXQqIGZsZXhpYmxlIGRpbWVuc2lvbnMuXG4gICAgICAgIGZsZXhpYmxlRml0cy5wdXNoKHtcbiAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgIG9yaWdpbjogb3JpZ2luUG9pbnQsXG4gICAgICAgICAgb3ZlcmxheVJlY3QsXG4gICAgICAgICAgYm91bmRpbmdCb3hSZWN0OiB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luUG9pbnQsIHBvcyksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY3VycmVudCBwcmVmZXJyZWQgcG9zaXRpb24gZG9lcyBub3QgZml0IG9uIHRoZSBzY3JlZW4sIHJlbWVtYmVyIHRoZSBwb3NpdGlvblxuICAgICAgLy8gaWYgaXQgaGFzIG1vcmUgdmlzaWJsZSBhcmVhIG9uLXNjcmVlbiB0aGFuIHdlJ3ZlIHNlZW4gYW5kIG1vdmUgb250byB0aGUgbmV4dCBwcmVmZXJyZWRcbiAgICAgIC8vIHBvc2l0aW9uLlxuICAgICAgaWYgKCFmYWxsYmFjayB8fCBmYWxsYmFjay5vdmVybGF5Rml0LnZpc2libGVBcmVhIDwgb3ZlcmxheUZpdC52aXNpYmxlQXJlYSkge1xuICAgICAgICBmYWxsYmFjayA9IHtvdmVybGF5Rml0LCBvdmVybGF5UG9pbnQsIG9yaWdpblBvaW50LCBwb3NpdGlvbjogcG9zLCBvdmVybGF5UmVjdH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBwb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd291bGQgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucywgY2hvb3NlIHRoZVxuICAgIC8vIG9uZSB0aGF0IGhhcyB0aGUgZ3JlYXRlc3QgYXJlYSBhdmFpbGFibGUgbW9kaWZpZWQgYnkgdGhlIHBvc2l0aW9uJ3Mgd2VpZ2h0XG4gICAgaWYgKGZsZXhpYmxlRml0cy5sZW5ndGgpIHtcbiAgICAgIGxldCBiZXN0Rml0OiBGbGV4aWJsZUZpdCB8IG51bGwgPSBudWxsO1xuICAgICAgbGV0IGJlc3RTY29yZSA9IC0xO1xuICAgICAgZm9yIChjb25zdCBmaXQgb2YgZmxleGlibGVGaXRzKSB7XG4gICAgICAgIGNvbnN0IHNjb3JlID1cbiAgICAgICAgICBmaXQuYm91bmRpbmdCb3hSZWN0LndpZHRoICogZml0LmJvdW5kaW5nQm94UmVjdC5oZWlnaHQgKiAoZml0LnBvc2l0aW9uLndlaWdodCB8fCAxKTtcbiAgICAgICAgaWYgKHNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgYmVzdEZpdCA9IGZpdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9pc1B1c2hlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihiZXN0Rml0IS5wb3NpdGlvbiwgYmVzdEZpdCEub3JpZ2luKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXaGVuIG5vbmUgb2YgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgZml0IHdpdGhpbiB0aGUgdmlld3BvcnQsIHRha2UgdGhlIHBvc2l0aW9uXG4gICAgLy8gdGhhdCB3ZW50IG9mZi1zY3JlZW4gdGhlIGxlYXN0IGFuZCBhdHRlbXB0IHRvIHB1c2ggaXQgb24tc2NyZWVuLlxuICAgIGlmICh0aGlzLl9jYW5QdXNoKSB7XG4gICAgICAvLyBUT0RPKGplbGJvdXJuKTogYWZ0ZXIgcHVzaGluZywgdGhlIG9wZW5pbmcgXCJkaXJlY3Rpb25cIiBvZiB0aGUgb3ZlcmxheSBtaWdodCBub3QgbWFrZSBzZW5zZS5cbiAgICAgIHRoaXMuX2lzUHVzaGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24oZmFsbGJhY2shLnBvc2l0aW9uLCBmYWxsYmFjayEub3JpZ2luUG9pbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFsbCBvcHRpb25zIGZvciBnZXR0aW5nIHRoZSBvdmVybGF5IHdpdGhpbiB0aGUgdmlld3BvcnQgaGF2ZSBiZWVuIGV4aGF1c3RlZCwgc28gZ28gd2l0aCB0aGVcbiAgICAvLyBwb3NpdGlvbiB0aGF0IHdlbnQgb2ZmLXNjcmVlbiB0aGUgbGVhc3QuXG4gICAgdGhpcy5fYXBwbHlQb3NpdGlvbihmYWxsYmFjayEucG9zaXRpb24sIGZhbGxiYWNrIS5vcmlnaW5Qb2ludCk7XG4gIH1cblxuICBkZXRhY2goKTogdm9pZCB7XG4gICAgdGhpcy5fY2xlYXJQYW5lbENsYXNzZXMoKTtcbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudCA9IG51bGw7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogQ2xlYW51cCBhZnRlciB0aGUgZWxlbWVudCBnZXRzIGRlc3Ryb3llZC4gKi9cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faXNEaXNwb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdlIGNhbid0IHVzZSBgX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXNgIGhlcmUsIGJlY2F1c2UgaXQgcmVzZXRzXG4gICAgLy8gc29tZSBwcm9wZXJ0aWVzIHRvIHplcm8sIHJhdGhlciB0aGFuIHJlbW92aW5nIHRoZW0uXG4gICAgaWYgKHRoaXMuX2JvdW5kaW5nQm94KSB7XG4gICAgICBleHRlbmRTdHlsZXModGhpcy5fYm91bmRpbmdCb3guc3R5bGUsIHtcbiAgICAgICAgdG9wOiAnJyxcbiAgICAgICAgbGVmdDogJycsXG4gICAgICAgIHJpZ2h0OiAnJyxcbiAgICAgICAgYm90dG9tOiAnJyxcbiAgICAgICAgaGVpZ2h0OiAnJyxcbiAgICAgICAgd2lkdGg6ICcnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICcnLFxuICAgICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmhvc3RFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYm91bmRpbmdCb3hDbGFzcyk7XG4gICAgfVxuXG4gICAgdGhpcy5kZXRhY2goKTtcbiAgICB0aGlzLl9wb3NpdGlvbkNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vdmVybGF5UmVmID0gdGhpcy5fYm91bmRpbmdCb3ggPSBudWxsITtcbiAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIHJlLWFsaWducyB0aGUgb3ZlcmxheSBlbGVtZW50IHdpdGggdGhlIHRyaWdnZXIgaW4gaXRzIGxhc3QgY2FsY3VsYXRlZCBwb3NpdGlvbixcbiAgICogZXZlbiBpZiBhIHBvc2l0aW9uIGhpZ2hlciBpbiB0aGUgXCJwcmVmZXJyZWQgcG9zaXRpb25zXCIgbGlzdCB3b3VsZCBub3cgZml0LiBUaGlzXG4gICAqIGFsbG93cyBvbmUgdG8gcmUtYWxpZ24gdGhlIHBhbmVsIHdpdGhvdXQgY2hhbmdpbmcgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBwYW5lbC5cbiAgICovXG4gIHJlYXBwbHlMYXN0UG9zaXRpb24oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0Rpc3Bvc2VkICYmICghdGhpcy5fcGxhdGZvcm0gfHwgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSkge1xuICAgICAgdGhpcy5fb3JpZ2luUmVjdCA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWN0ID0gdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHRoaXMuX3ZpZXdwb3J0UmVjdCA9IHRoaXMuX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk7XG5cbiAgICAgIGNvbnN0IGxhc3RQb3NpdGlvbiA9IHRoaXMuX2xhc3RQb3NpdGlvbiB8fCB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnNbMF07XG4gICAgICBjb25zdCBvcmlnaW5Qb2ludCA9IHRoaXMuX2dldE9yaWdpblBvaW50KHRoaXMuX29yaWdpblJlY3QsIGxhc3RQb3NpdGlvbik7XG5cbiAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24obGFzdFBvc2l0aW9uLCBvcmlnaW5Qb2ludCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxpc3Qgb2YgU2Nyb2xsYWJsZSBjb250YWluZXJzIHRoYXQgaG9zdCB0aGUgb3JpZ2luIGVsZW1lbnQgc28gdGhhdFxuICAgKiBvbiByZXBvc2l0aW9uIHdlIGNhbiBldmFsdWF0ZSBpZiBpdCBvciB0aGUgb3ZlcmxheSBoYXMgYmVlbiBjbGlwcGVkIG9yIG91dHNpZGUgdmlldy4gRXZlcnlcbiAgICogU2Nyb2xsYWJsZSBtdXN0IGJlIGFuIGFuY2VzdG9yIGVsZW1lbnQgb2YgdGhlIHN0cmF0ZWd5J3Mgb3JpZ2luIGVsZW1lbnQuXG4gICAqL1xuICB3aXRoU2Nyb2xsYWJsZUNvbnRhaW5lcnMoc2Nyb2xsYWJsZXM6IENka1Njcm9sbGFibGVbXSk6IHRoaXMge1xuICAgIHRoaXMuX3Njcm9sbGFibGVzID0gc2Nyb2xsYWJsZXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBuZXcgcHJlZmVycmVkIHBvc2l0aW9ucy5cbiAgICogQHBhcmFtIHBvc2l0aW9ucyBMaXN0IG9mIHBvc2l0aW9ucyBvcHRpb25zIGZvciB0aGlzIG92ZXJsYXkuXG4gICAqL1xuICB3aXRoUG9zaXRpb25zKHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXSk6IHRoaXMge1xuICAgIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucyA9IHBvc2l0aW9ucztcblxuICAgIC8vIElmIHRoZSBsYXN0IGNhbGN1bGF0ZWQgcG9zaXRpb24gb2JqZWN0IGlzbid0IHBhcnQgb2YgdGhlIHBvc2l0aW9ucyBhbnltb3JlLCBjbGVhclxuICAgIC8vIGl0IGluIG9yZGVyIHRvIGF2b2lkIGl0IGJlaW5nIHBpY2tlZCB1cCBpZiB0aGUgY29uc3VtZXIgdHJpZXMgdG8gcmUtYXBwbHkuXG4gICAgaWYgKHBvc2l0aW9ucy5pbmRleE9mKHRoaXMuX2xhc3RQb3NpdGlvbiEpID09PSAtMSkge1xuICAgICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl92YWxpZGF0ZVBvc2l0aW9ucygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG1pbmltdW0gZGlzdGFuY2UgdGhlIG92ZXJsYXkgbWF5IGJlIHBvc2l0aW9uZWQgdG8gdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0LlxuICAgKiBAcGFyYW0gbWFyZ2luIFJlcXVpcmVkIG1hcmdpbiBiZXR3ZWVuIHRoZSBvdmVybGF5IGFuZCB0aGUgdmlld3BvcnQgZWRnZSBpbiBwaXhlbHMuXG4gICAqL1xuICB3aXRoVmlld3BvcnRNYXJnaW4obWFyZ2luOiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl92aWV3cG9ydE1hcmdpbiA9IG1hcmdpbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgd2l0aEZsZXhpYmxlRGltZW5zaW9ucyhmbGV4aWJsZURpbWVuc2lvbnMgPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zID0gZmxleGlibGVEaW1lbnNpb25zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSBjYW4gZ3JvdyBhZnRlciB0aGUgaW5pdGlhbCBvcGVuIHZpYSBmbGV4aWJsZSB3aWR0aC9oZWlnaHQuICovXG4gIHdpdGhHcm93QWZ0ZXJPcGVuKGdyb3dBZnRlck9wZW4gPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fZ3Jvd0FmdGVyT3BlbiA9IGdyb3dBZnRlck9wZW47XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIGlmIG5vbmUgb2YgdGhlIHByb3ZpZGVkIHBvc2l0aW9ucyBmaXQuICovXG4gIHdpdGhQdXNoKGNhblB1c2ggPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fY2FuUHVzaCA9IGNhblB1c2g7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5J3MgcG9zaXRpb24gc2hvdWxkIGJlIGxvY2tlZCBpbiBhZnRlciBpdCBpcyBwb3NpdGlvbmVkXG4gICAqIGluaXRpYWxseS4gV2hlbiBhbiBvdmVybGF5IGlzIGxvY2tlZCBpbiwgaXQgd29uJ3QgYXR0ZW1wdCB0byByZXBvc2l0aW9uIGl0c2VsZlxuICAgKiB3aGVuIHRoZSBwb3NpdGlvbiBpcyByZS1hcHBsaWVkIChlLmcuIHdoZW4gdGhlIHVzZXIgc2Nyb2xscyBhd2F5KS5cbiAgICogQHBhcmFtIGlzTG9ja2VkIFdoZXRoZXIgdGhlIG92ZXJsYXkgc2hvdWxkIGxvY2tlZCBpbi5cbiAgICovXG4gIHdpdGhMb2NrZWRQb3NpdGlvbihpc0xvY2tlZCA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9wb3NpdGlvbkxvY2tlZCA9IGlzTG9ja2VkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiwgcmVsYXRpdmUgdG8gd2hpY2ggdG8gcG9zaXRpb24gdGhlIG92ZXJsYXkuXG4gICAqIFVzaW5nIGFuIGVsZW1lbnQgb3JpZ2luIGlzIHVzZWZ1bCBmb3IgYnVpbGRpbmcgY29tcG9uZW50cyB0aGF0IG5lZWQgdG8gYmUgcG9zaXRpb25lZFxuICAgKiByZWxhdGl2ZWx5IHRvIGEgdHJpZ2dlciAoZS5nLiBkcm9wZG93biBtZW51cyBvciB0b29sdGlwcyksIHdoZXJlYXMgdXNpbmcgYSBwb2ludCBjYW4gYmVcbiAgICogdXNlZCBmb3IgY2FzZXMgbGlrZSBjb250ZXh0dWFsIG1lbnVzIHdoaWNoIG9wZW4gcmVsYXRpdmUgdG8gdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKiBAcGFyYW0gb3JpZ2luIFJlZmVyZW5jZSB0byB0aGUgbmV3IG9yaWdpbi5cbiAgICovXG4gIHNldE9yaWdpbihvcmlnaW46IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbik6IHRoaXMge1xuICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkncyBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB4LWF4aXMuXG4gICAqIEBwYXJhbSBvZmZzZXQgTmV3IG9mZnNldCBpbiB0aGUgWCBheGlzLlxuICAgKi9cbiAgd2l0aERlZmF1bHRPZmZzZXRYKG9mZnNldDogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5fb2Zmc2V0WCA9IG9mZnNldDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkncyBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB5LWF4aXMuXG4gICAqIEBwYXJhbSBvZmZzZXQgTmV3IG9mZnNldCBpbiB0aGUgWSBheGlzLlxuICAgKi9cbiAgd2l0aERlZmF1bHRPZmZzZXRZKG9mZnNldDogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5fb2Zmc2V0WSA9IG9mZnNldDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IHNob3VsZCBzZXQgYSBgdHJhbnNmb3JtLW9yaWdpbmAgb24gc29tZSBlbGVtZW50c1xuICAgKiBpbnNpZGUgdGhlIG92ZXJsYXksIGRlcGVuZGluZyBvbiB0aGUgY3VycmVudCBwb3NpdGlvbiB0aGF0IGlzIGJlaW5nIGFwcGxpZWQuIFRoaXMgaXNcbiAgICogdXNlZnVsIGZvciB0aGUgY2FzZXMgd2hlcmUgdGhlIG9yaWdpbiBvZiBhbiBhbmltYXRpb24gY2FuIGNoYW5nZSBkZXBlbmRpbmcgb24gdGhlXG4gICAqIGFsaWdubWVudCBvZiB0aGUgb3ZlcmxheS5cbiAgICogQHBhcmFtIHNlbGVjdG9yIENTUyBzZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBmaW5kIHRoZSB0YXJnZXRcbiAgICogICAgZWxlbWVudHMgb250byB3aGljaCB0byBzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4uXG4gICAqL1xuICB3aXRoVHJhbnNmb3JtT3JpZ2luT24oc2VsZWN0b3I6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgKHgsIHkpIGNvb3JkaW5hdGUgb2YgYSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSBvcmlnaW4gYmFzZWQgb24gYSByZWxhdGl2ZSBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2dldE9yaWdpblBvaW50KG9yaWdpblJlY3Q6IERpbWVuc2lvbnMsIHBvczogQ29ubmVjdGVkUG9zaXRpb24pOiBQb2ludCB7XG4gICAgbGV0IHg6IG51bWJlcjtcbiAgICBpZiAocG9zLm9yaWdpblggPT0gJ2NlbnRlcicpIHtcbiAgICAgIC8vIE5vdGU6IHdoZW4gY2VudGVyaW5nIHdlIHNob3VsZCBhbHdheXMgdXNlIHRoZSBgbGVmdGBcbiAgICAgIC8vIG9mZnNldCwgb3RoZXJ3aXNlIHRoZSBwb3NpdGlvbiB3aWxsIGJlIHdyb25nIGluIFJUTC5cbiAgICAgIHggPSBvcmlnaW5SZWN0LmxlZnQgKyBvcmlnaW5SZWN0LndpZHRoIC8gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IG9yaWdpblJlY3QucmlnaHQgOiBvcmlnaW5SZWN0LmxlZnQ7XG4gICAgICBjb25zdCBlbmRYID0gdGhpcy5faXNSdGwoKSA/IG9yaWdpblJlY3QubGVmdCA6IG9yaWdpblJlY3QucmlnaHQ7XG4gICAgICB4ID0gcG9zLm9yaWdpblggPT0gJ3N0YXJ0JyA/IHN0YXJ0WCA6IGVuZFg7XG4gICAgfVxuXG4gICAgbGV0IHk6IG51bWJlcjtcbiAgICBpZiAocG9zLm9yaWdpblkgPT0gJ2NlbnRlcicpIHtcbiAgICAgIHkgPSBvcmlnaW5SZWN0LnRvcCArIG9yaWdpblJlY3QuaGVpZ2h0IC8gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgeSA9IHBvcy5vcmlnaW5ZID09ICd0b3AnID8gb3JpZ2luUmVjdC50b3AgOiBvcmlnaW5SZWN0LmJvdHRvbTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlICh4LCB5KSBjb29yZGluYXRlIG9mIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlIG92ZXJsYXkgZ2l2ZW4gYSBnaXZlbiBwb3NpdGlvbiBhbmRcbiAgICogb3JpZ2luIHBvaW50IHRvIHdoaWNoIHRoZSBvdmVybGF5IHNob3VsZCBiZSBjb25uZWN0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5UG9pbnQoXG4gICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgIG92ZXJsYXlSZWN0OiBEaW1lbnNpb25zLFxuICAgIHBvczogQ29ubmVjdGVkUG9zaXRpb24sXG4gICk6IFBvaW50IHtcbiAgICAvLyBDYWxjdWxhdGUgdGhlIChvdmVybGF5U3RhcnRYLCBvdmVybGF5U3RhcnRZKSwgdGhlIHN0YXJ0IG9mIHRoZVxuICAgIC8vIHBvdGVudGlhbCBvdmVybGF5IHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW4gcG9pbnQuXG4gICAgbGV0IG92ZXJsYXlTdGFydFg6IG51bWJlcjtcbiAgICBpZiAocG9zLm92ZXJsYXlYID09ICdjZW50ZXInKSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gLW92ZXJsYXlSZWN0LndpZHRoIC8gMjtcbiAgICB9IGVsc2UgaWYgKHBvcy5vdmVybGF5WCA9PT0gJ3N0YXJ0Jykge1xuICAgICAgb3ZlcmxheVN0YXJ0WCA9IHRoaXMuX2lzUnRsKCkgPyAtb3ZlcmxheVJlY3Qud2lkdGggOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IDAgOiAtb3ZlcmxheVJlY3Qud2lkdGg7XG4gICAgfVxuXG4gICAgbGV0IG92ZXJsYXlTdGFydFk6IG51bWJlcjtcbiAgICBpZiAocG9zLm92ZXJsYXlZID09ICdjZW50ZXInKSB7XG4gICAgICBvdmVybGF5U3RhcnRZID0gLW92ZXJsYXlSZWN0LmhlaWdodCAvIDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJsYXlTdGFydFkgPSBwb3Mub3ZlcmxheVkgPT0gJ3RvcCcgPyAwIDogLW92ZXJsYXlSZWN0LmhlaWdodDtcbiAgICB9XG5cbiAgICAvLyBUaGUgKHgsIHkpIGNvb3JkaW5hdGVzIG9mIHRoZSBvdmVybGF5LlxuICAgIHJldHVybiB7XG4gICAgICB4OiBvcmlnaW5Qb2ludC54ICsgb3ZlcmxheVN0YXJ0WCxcbiAgICAgIHk6IG9yaWdpblBvaW50LnkgKyBvdmVybGF5U3RhcnRZLFxuICAgIH07XG4gIH1cblxuICAvKiogR2V0cyBob3cgd2VsbCBhbiBvdmVybGF5IGF0IHRoZSBnaXZlbiBwb2ludCB3aWxsIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Rml0KFxuICAgIHBvaW50OiBQb2ludCxcbiAgICByYXdPdmVybGF5UmVjdDogRGltZW5zaW9ucyxcbiAgICB2aWV3cG9ydDogRGltZW5zaW9ucyxcbiAgICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sXG4gICk6IE92ZXJsYXlGaXQge1xuICAgIC8vIFJvdW5kIHRoZSBvdmVybGF5IHJlY3Qgd2hlbiBjb21wYXJpbmcgYWdhaW5zdCB0aGVcbiAgICAvLyB2aWV3cG9ydCwgYmVjYXVzZSB0aGUgdmlld3BvcnQgaXMgYWx3YXlzIHJvdW5kZWQuXG4gICAgY29uc3Qgb3ZlcmxheSA9IGdldFJvdW5kZWRCb3VuZGluZ0NsaWVudFJlY3QocmF3T3ZlcmxheVJlY3QpO1xuICAgIGxldCB7eCwgeX0gPSBwb2ludDtcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIC8vIEFjY291bnQgZm9yIHRoZSBvZmZzZXRzIHNpbmNlIHRoZXkgY291bGQgcHVzaCB0aGUgb3ZlcmxheSBvdXQgb2YgdGhlIHZpZXdwb3J0LlxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB4ICs9IG9mZnNldFg7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldFkpIHtcbiAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvLyBIb3cgbXVjaCB0aGUgb3ZlcmxheSB3b3VsZCBvdmVyZmxvdyBhdCB0aGlzIHBvc2l0aW9uLCBvbiBlYWNoIHNpZGUuXG4gICAgbGV0IGxlZnRPdmVyZmxvdyA9IDAgLSB4O1xuICAgIGxldCByaWdodE92ZXJmbG93ID0geCArIG92ZXJsYXkud2lkdGggLSB2aWV3cG9ydC53aWR0aDtcbiAgICBsZXQgdG9wT3ZlcmZsb3cgPSAwIC0geTtcbiAgICBsZXQgYm90dG9tT3ZlcmZsb3cgPSB5ICsgb3ZlcmxheS5oZWlnaHQgLSB2aWV3cG9ydC5oZWlnaHQ7XG5cbiAgICAvLyBWaXNpYmxlIHBhcnRzIG9mIHRoZSBlbGVtZW50IG9uIGVhY2ggYXhpcy5cbiAgICBsZXQgdmlzaWJsZVdpZHRoID0gdGhpcy5fc3VidHJhY3RPdmVyZmxvd3Mob3ZlcmxheS53aWR0aCwgbGVmdE92ZXJmbG93LCByaWdodE92ZXJmbG93KTtcbiAgICBsZXQgdmlzaWJsZUhlaWdodCA9IHRoaXMuX3N1YnRyYWN0T3ZlcmZsb3dzKG92ZXJsYXkuaGVpZ2h0LCB0b3BPdmVyZmxvdywgYm90dG9tT3ZlcmZsb3cpO1xuICAgIGxldCB2aXNpYmxlQXJlYSA9IHZpc2libGVXaWR0aCAqIHZpc2libGVIZWlnaHQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdmlzaWJsZUFyZWEsXG4gICAgICBpc0NvbXBsZXRlbHlXaXRoaW5WaWV3cG9ydDogb3ZlcmxheS53aWR0aCAqIG92ZXJsYXkuaGVpZ2h0ID09PSB2aXNpYmxlQXJlYSxcbiAgICAgIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogdmlzaWJsZUhlaWdodCA9PT0gb3ZlcmxheS5oZWlnaHQsXG4gICAgICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogdmlzaWJsZVdpZHRoID09IG92ZXJsYXkud2lkdGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCB3aGVuIGl0IG1heSByZXNpemUgZWl0aGVyIGl0cyB3aWR0aCBvciBoZWlnaHQuXG4gICAqIEBwYXJhbSBmaXQgSG93IHdlbGwgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvaW50IFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSBnZW9tZXRyeSBvZiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKGZpdDogT3ZlcmxheUZpdCwgcG9pbnQ6IFBvaW50LCB2aWV3cG9ydDogRGltZW5zaW9ucykge1xuICAgIGlmICh0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IHZpZXdwb3J0LmJvdHRvbSAtIHBvaW50Lnk7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gcG9pbnQueDtcbiAgICAgIGNvbnN0IG1pbkhlaWdodCA9IGdldFBpeGVsVmFsdWUodGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5taW5IZWlnaHQpO1xuICAgICAgY29uc3QgbWluV2lkdGggPSBnZXRQaXhlbFZhbHVlKHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWluV2lkdGgpO1xuXG4gICAgICBjb25zdCB2ZXJ0aWNhbEZpdCA9XG4gICAgICAgIGZpdC5maXRzSW5WaWV3cG9ydFZlcnRpY2FsbHkgfHwgKG1pbkhlaWdodCAhPSBudWxsICYmIG1pbkhlaWdodCA8PSBhdmFpbGFibGVIZWlnaHQpO1xuICAgICAgY29uc3QgaG9yaXpvbnRhbEZpdCA9XG4gICAgICAgIGZpdC5maXRzSW5WaWV3cG9ydEhvcml6b250YWxseSB8fCAobWluV2lkdGggIT0gbnVsbCAmJiBtaW5XaWR0aCA8PSBhdmFpbGFibGVXaWR0aCk7XG5cbiAgICAgIHJldHVybiB2ZXJ0aWNhbEZpdCAmJiBob3Jpem9udGFsRml0O1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcG9pbnQgYXQgd2hpY2ggdGhlIG92ZXJsYXkgY2FuIGJlIFwicHVzaGVkXCIgb24tc2NyZWVuLiBJZiB0aGUgb3ZlcmxheSBpcyBsYXJnZXIgdGhhblxuICAgKiB0aGUgdmlld3BvcnQsIHRoZSB0b3AtbGVmdCBjb3JuZXIgd2lsbCBiZSBwdXNoZWQgb24tc2NyZWVuICh3aXRoIG92ZXJmbG93IG9jY3VyaW5nIG9uIHRoZVxuICAgKiByaWdodCBhbmQgYm90dG9tKS5cbiAgICpcbiAgICogQHBhcmFtIHN0YXJ0IFN0YXJ0aW5nIHBvaW50IGZyb20gd2hpY2ggdGhlIG92ZXJsYXkgaXMgcHVzaGVkLlxuICAgKiBAcGFyYW0gb3ZlcmxheSBEaW1lbnNpb25zIG9mIHRoZSBvdmVybGF5LlxuICAgKiBAcGFyYW0gc2Nyb2xsUG9zaXRpb24gQ3VycmVudCB2aWV3cG9ydCBzY3JvbGwgcG9zaXRpb24uXG4gICAqIEByZXR1cm5zIFRoZSBwb2ludCBhdCB3aGljaCB0byBwb3NpdGlvbiB0aGUgb3ZlcmxheSBhZnRlciBwdXNoaW5nLiBUaGlzIGlzIGVmZmVjdGl2ZWx5IGEgbmV3XG4gICAqICAgICBvcmlnaW5Qb2ludC5cbiAgICovXG4gIHByaXZhdGUgX3B1c2hPdmVybGF5T25TY3JlZW4oXG4gICAgc3RhcnQ6IFBvaW50LFxuICAgIHJhd092ZXJsYXlSZWN0OiBEaW1lbnNpb25zLFxuICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uLFxuICApOiBQb2ludCB7XG4gICAgLy8gSWYgdGhlIHBvc2l0aW9uIGlzIGxvY2tlZCBhbmQgd2UndmUgcHVzaGVkIHRoZSBvdmVybGF5IGFscmVhZHksIHJldXNlIHRoZSBwcmV2aW91cyBwdXNoXG4gICAgLy8gYW1vdW50LCByYXRoZXIgdGhhbiBwdXNoaW5nIGl0IGFnYWluLiBJZiB3ZSB3ZXJlIHRvIGNvbnRpbnVlIHB1c2hpbmcsIHRoZSBlbGVtZW50IHdvdWxkXG4gICAgLy8gcmVtYWluIGluIHRoZSB2aWV3cG9ydCwgd2hpY2ggZ29lcyBhZ2FpbnN0IHRoZSBleHBlY3RhdGlvbnMgd2hlbiBwb3NpdGlvbiBsb2NraW5nIGlzIGVuYWJsZWQuXG4gICAgaWYgKHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudCAmJiB0aGlzLl9wb3NpdGlvbkxvY2tlZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc3RhcnQueCArIHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudC54LFxuICAgICAgICB5OiBzdGFydC55ICsgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50LnksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFJvdW5kIHRoZSBvdmVybGF5IHJlY3Qgd2hlbiBjb21wYXJpbmcgYWdhaW5zdCB0aGVcbiAgICAvLyB2aWV3cG9ydCwgYmVjYXVzZSB0aGUgdmlld3BvcnQgaXMgYWx3YXlzIHJvdW5kZWQuXG4gICAgY29uc3Qgb3ZlcmxheSA9IGdldFJvdW5kZWRCb3VuZGluZ0NsaWVudFJlY3QocmF3T3ZlcmxheVJlY3QpO1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuXG4gICAgLy8gRGV0ZXJtaW5lIGhvdyBtdWNoIHRoZSBvdmVybGF5IGdvZXMgb3V0c2lkZSB0aGUgdmlld3BvcnQgb24gZWFjaFxuICAgIC8vIHNpZGUsIHdoaWNoIHdlJ2xsIHVzZSB0byBkZWNpZGUgd2hpY2ggZGlyZWN0aW9uIHRvIHB1c2ggaXQuXG4gICAgY29uc3Qgb3ZlcmZsb3dSaWdodCA9IE1hdGgubWF4KHN0YXJ0LnggKyBvdmVybGF5LndpZHRoIC0gdmlld3BvcnQud2lkdGgsIDApO1xuICAgIGNvbnN0IG92ZXJmbG93Qm90dG9tID0gTWF0aC5tYXgoc3RhcnQueSArIG92ZXJsYXkuaGVpZ2h0IC0gdmlld3BvcnQuaGVpZ2h0LCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd1RvcCA9IE1hdGgubWF4KHZpZXdwb3J0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcCAtIHN0YXJ0LnksIDApO1xuICAgIGNvbnN0IG92ZXJmbG93TGVmdCA9IE1hdGgubWF4KHZpZXdwb3J0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0IC0gc3RhcnQueCwgMCk7XG5cbiAgICAvLyBBbW91bnQgYnkgd2hpY2ggdG8gcHVzaCB0aGUgb3ZlcmxheSBpbiBlYWNoIGF4aXMgc3VjaCB0aGF0IGl0IHJlbWFpbnMgb24tc2NyZWVuLlxuICAgIGxldCBwdXNoWCA9IDA7XG4gICAgbGV0IHB1c2hZID0gMDtcblxuICAgIC8vIElmIHRoZSBvdmVybGF5IGZpdHMgY29tcGxldGVseSB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgdmlld3BvcnQsIHB1c2ggaXQgZnJvbSB3aGljaGV2ZXJcbiAgICAvLyBkaXJlY3Rpb24gaXMgZ29lcyBvZmYtc2NyZWVuLiBPdGhlcndpc2UsIHB1c2ggdGhlIHRvcC1sZWZ0IGNvcm5lciBzdWNoIHRoYXQgaXRzIGluIHRoZVxuICAgIC8vIHZpZXdwb3J0IGFuZCBhbGxvdyBmb3IgdGhlIHRyYWlsaW5nIGVuZCBvZiB0aGUgb3ZlcmxheSB0byBnbyBvdXQgb2YgYm91bmRzLlxuICAgIGlmIChvdmVybGF5LndpZHRoIDw9IHZpZXdwb3J0LndpZHRoKSB7XG4gICAgICBwdXNoWCA9IG92ZXJmbG93TGVmdCB8fCAtb3ZlcmZsb3dSaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHVzaFggPSBzdGFydC54IDwgdGhpcy5fdmlld3BvcnRNYXJnaW4gPyB2aWV3cG9ydC5sZWZ0IC0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIHN0YXJ0LnggOiAwO1xuICAgIH1cblxuICAgIGlmIChvdmVybGF5LmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHtcbiAgICAgIHB1c2hZID0gb3ZlcmZsb3dUb3AgfHwgLW92ZXJmbG93Qm90dG9tO1xuICAgIH0gZWxzZSB7XG4gICAgICBwdXNoWSA9IHN0YXJ0LnkgPCB0aGlzLl92aWV3cG9ydE1hcmdpbiA/IHZpZXdwb3J0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcCAtIHN0YXJ0LnkgOiAwO1xuICAgIH1cblxuICAgIHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudCA9IHt4OiBwdXNoWCwgeTogcHVzaFl9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHN0YXJ0LnggKyBwdXNoWCxcbiAgICAgIHk6IHN0YXJ0LnkgKyBwdXNoWSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBjb21wdXRlZCBwb3NpdGlvbiB0byB0aGUgb3ZlcmxheSBhbmQgZW1pdHMgYSBwb3NpdGlvbiBjaGFuZ2UuXG4gICAqIEBwYXJhbSBwb3NpdGlvbiBUaGUgcG9zaXRpb24gcHJlZmVyZW5jZVxuICAgKiBAcGFyYW0gb3JpZ2luUG9pbnQgVGhlIHBvaW50IG9uIHRoZSBvcmlnaW4gZWxlbWVudCB3aGVyZSB0aGUgb3ZlcmxheSBpcyBjb25uZWN0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9hcHBseVBvc2l0aW9uKHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbiwgb3JpZ2luUG9pbnQ6IFBvaW50KSB7XG4gICAgdGhpcy5fc2V0VHJhbnNmb3JtT3JpZ2luKHBvc2l0aW9uKTtcbiAgICB0aGlzLl9zZXRPdmVybGF5RWxlbWVudFN0eWxlcyhvcmlnaW5Qb2ludCwgcG9zaXRpb24pO1xuICAgIHRoaXMuX3NldEJvdW5kaW5nQm94U3R5bGVzKG9yaWdpblBvaW50LCBwb3NpdGlvbik7XG5cbiAgICBpZiAocG9zaXRpb24ucGFuZWxDbGFzcykge1xuICAgICAgdGhpcy5fYWRkUGFuZWxDbGFzc2VzKHBvc2l0aW9uLnBhbmVsQ2xhc3MpO1xuICAgIH1cblxuICAgIC8vIFNhdmUgdGhlIGxhc3QgY29ubmVjdGVkIHBvc2l0aW9uIGluIGNhc2UgdGhlIHBvc2l0aW9uIG5lZWRzIHRvIGJlIHJlLWNhbGN1bGF0ZWQuXG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gcG9zaXRpb247XG5cbiAgICAvLyBOb3RpZnkgdGhhdCB0aGUgcG9zaXRpb24gaGFzIGJlZW4gY2hhbmdlZCBhbG9uZyB3aXRoIGl0cyBjaGFuZ2UgcHJvcGVydGllcy5cbiAgICAvLyBXZSBvbmx5IGVtaXQgaWYgd2UndmUgZ290IGFueSBzdWJzY3JpcHRpb25zLCBiZWNhdXNlIHRoZSBzY3JvbGwgdmlzaWJpbGl0eVxuICAgIC8vIGNhbGN1bGNhdGlvbnMgY2FuIGJlIHNvbWV3aGF0IGV4cGVuc2l2ZS5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25DaGFuZ2VzLm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHNjcm9sbGFibGVWaWV3UHJvcGVydGllcyA9IHRoaXMuX2dldFNjcm9sbFZpc2liaWxpdHkoKTtcbiAgICAgIGNvbnN0IGNoYW5nZUV2ZW50ID0gbmV3IENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZShwb3NpdGlvbiwgc2Nyb2xsYWJsZVZpZXdQcm9wZXJ0aWVzKTtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5uZXh0KGNoYW5nZUV2ZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSB0cmFuc2Zvcm0gb3JpZ2luIGJhc2VkIG9uIHRoZSBjb25maWd1cmVkIHNlbGVjdG9yIGFuZCB0aGUgcGFzc2VkLWluIHBvc2l0aW9uLiAgKi9cbiAgcHJpdmF0ZSBfc2V0VHJhbnNmb3JtT3JpZ2luKHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbikge1xuICAgIGlmICghdGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50czogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gPSB0aGlzLl9ib3VuZGluZ0JveCEucXVlcnlTZWxlY3RvckFsbChcbiAgICAgIHRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yLFxuICAgICk7XG4gICAgbGV0IHhPcmlnaW46ICdsZWZ0JyB8ICdyaWdodCcgfCAnY2VudGVyJztcbiAgICBsZXQgeU9yaWdpbjogJ3RvcCcgfCAnYm90dG9tJyB8ICdjZW50ZXInID0gcG9zaXRpb24ub3ZlcmxheVk7XG5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVggPT09ICdjZW50ZXInKSB7XG4gICAgICB4T3JpZ2luID0gJ2NlbnRlcic7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9pc1J0bCgpKSB7XG4gICAgICB4T3JpZ2luID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgIH0gZWxzZSB7XG4gICAgICB4T3JpZ2luID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgPyAnbGVmdCcgOiAncmlnaHQnO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsZW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9IGAke3hPcmlnaW59ICR7eU9yaWdpbn1gO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSdzIHNpemluZyBjb250YWluZXIuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGRvZXMgbm8gbWVhc3VyaW5nIGFuZCBhcHBsaWVzIG5vIHN0eWxlcyBzbyB0aGF0IHdlIGNhbiBjaGVhcGx5IGNvbXB1dGUgdGhlXG4gICAqIGJvdW5kcyBmb3IgYWxsIHBvc2l0aW9ucyBhbmQgY2hvb3NlIHRoZSBiZXN0IGZpdCBiYXNlZCBvbiB0aGVzZSByZXN1bHRzLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FsY3VsYXRlQm91bmRpbmdCb3hSZWN0KG9yaWdpbjogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IEJvdW5kaW5nQm94UmVjdCB7XG4gICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLl92aWV3cG9ydFJlY3Q7XG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLl9pc1J0bCgpO1xuICAgIGxldCBoZWlnaHQ6IG51bWJlciwgdG9wOiBudW1iZXIsIGJvdHRvbTogbnVtYmVyO1xuXG4gICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAndG9wJykge1xuICAgICAgLy8gT3ZlcmxheSBpcyBvcGVuaW5nIFwiZG93bndhcmRcIiBhbmQgdGh1cyBpcyBib3VuZCBieSB0aGUgYm90dG9tIHZpZXdwb3J0IGVkZ2UuXG4gICAgICB0b3AgPSBvcmlnaW4ueTtcbiAgICAgIGhlaWdodCA9IHZpZXdwb3J0LmhlaWdodCAtIHRvcCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nKSB7XG4gICAgICAvLyBPdmVybGF5IGlzIG9wZW5pbmcgXCJ1cHdhcmRcIiBhbmQgdGh1cyBpcyBib3VuZCBieSB0aGUgdG9wIHZpZXdwb3J0IGVkZ2UuIFdlIG5lZWQgdG8gYWRkXG4gICAgICAvLyB0aGUgdmlld3BvcnQgbWFyZ2luIGJhY2sgaW4sIGJlY2F1c2UgdGhlIHZpZXdwb3J0IHJlY3QgaXMgbmFycm93ZWQgZG93biB0byByZW1vdmUgdGhlXG4gICAgICAvLyBtYXJnaW4sIHdoZXJlYXMgdGhlIGBvcmlnaW5gIHBvc2l0aW9uIGlzIGNhbGN1bGF0ZWQgYmFzZWQgb24gaXRzIGBDbGllbnRSZWN0YC5cbiAgICAgIGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAtIG9yaWdpbi55ICsgdGhpcy5fdmlld3BvcnRNYXJnaW4gKiAyO1xuICAgICAgaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0IC0gYm90dG9tICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5laXRoZXIgdG9wIG5vciBib3R0b20sIGl0IG1lYW5zIHRoYXQgdGhlIG92ZXJsYXkgaXMgdmVydGljYWxseSBjZW50ZXJlZCBvbiB0aGVcbiAgICAgIC8vIG9yaWdpbiBwb2ludC4gTm90ZSB0aGF0IHdlIHdhbnQgdGhlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCwgcmF0aGVyIHRoYW5cbiAgICAgIC8vIHRoZSBwYWdlLCB3aGljaCBpcyB3aHkgd2UgZG9uJ3QgdXNlIHNvbWV0aGluZyBsaWtlIGB2aWV3cG9ydC5ib3R0b20gLSBvcmlnaW4ueWAgYW5kXG4gICAgICAvLyBgb3JpZ2luLnkgLSB2aWV3cG9ydC50b3BgLlxuICAgICAgY29uc3Qgc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlID0gTWF0aC5taW4oXG4gICAgICAgIHZpZXdwb3J0LmJvdHRvbSAtIG9yaWdpbi55ICsgdmlld3BvcnQudG9wLFxuICAgICAgICBvcmlnaW4ueSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHByZXZpb3VzSGVpZ2h0ID0gdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQ7XG5cbiAgICAgIGhlaWdodCA9IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSAqIDI7XG4gICAgICB0b3AgPSBvcmlnaW4ueSAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKGhlaWdodCA+IHByZXZpb3VzSGVpZ2h0ICYmICF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgIXRoaXMuX2dyb3dBZnRlck9wZW4pIHtcbiAgICAgICAgdG9wID0gb3JpZ2luLnkgLSBwcmV2aW91c0hlaWdodCAvIDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIG92ZXJsYXkgaXMgb3BlbmluZyAncmlnaHQtd2FyZCcgKHRoZSBjb250ZW50IGZsb3dzIHRvIHRoZSByaWdodCkuXG4gICAgY29uc3QgaXNCb3VuZGVkQnlSaWdodFZpZXdwb3J0RWRnZSA9XG4gICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgJiYgIWlzUnRsKSB8fCAocG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnICYmIGlzUnRsKTtcblxuICAgIC8vIFRoZSBvdmVybGF5IGlzIG9wZW5pbmcgJ2xlZnQtd2FyZCcgKHRoZSBjb250ZW50IGZsb3dzIHRvIHRoZSBsZWZ0KS5cbiAgICBjb25zdCBpc0JvdW5kZWRCeUxlZnRWaWV3cG9ydEVkZ2UgPVxuICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyAmJiAhaXNSdGwpIHx8IChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyAmJiBpc1J0bCk7XG5cbiAgICBsZXQgd2lkdGg6IG51bWJlciwgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyO1xuXG4gICAgaWYgKGlzQm91bmRlZEJ5TGVmdFZpZXdwb3J0RWRnZSkge1xuICAgICAgcmlnaHQgPSB2aWV3cG9ydC53aWR0aCAtIG9yaWdpbi54ICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgICB3aWR0aCA9IG9yaWdpbi54IC0gdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIGlmIChpc0JvdW5kZWRCeVJpZ2h0Vmlld3BvcnRFZGdlKSB7XG4gICAgICBsZWZ0ID0gb3JpZ2luLng7XG4gICAgICB3aWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gb3JpZ2luLng7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5laXRoZXIgc3RhcnQgbm9yIGVuZCwgaXQgbWVhbnMgdGhhdCB0aGUgb3ZlcmxheSBpcyBob3Jpem9udGFsbHkgY2VudGVyZWQgb24gdGhlXG4gICAgICAvLyBvcmlnaW4gcG9pbnQuIE5vdGUgdGhhdCB3ZSB3YW50IHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQsIHJhdGhlciB0aGFuXG4gICAgICAvLyB0aGUgcGFnZSwgd2hpY2ggaXMgd2h5IHdlIGRvbid0IHVzZSBzb21ldGhpbmcgbGlrZSBgdmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueGAgYW5kXG4gICAgICAvLyBgb3JpZ2luLnggLSB2aWV3cG9ydC5sZWZ0YC5cbiAgICAgIGNvbnN0IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSA9IE1hdGgubWluKFxuICAgICAgICB2aWV3cG9ydC5yaWdodCAtIG9yaWdpbi54ICsgdmlld3BvcnQubGVmdCxcbiAgICAgICAgb3JpZ2luLngsXG4gICAgICApO1xuICAgICAgY29uc3QgcHJldmlvdXNXaWR0aCA9IHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUud2lkdGg7XG5cbiAgICAgIHdpZHRoID0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlICogMjtcbiAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKHdpZHRoID4gcHJldmlvdXNXaWR0aCAmJiAhdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIHByZXZpb3VzV2lkdGggLyAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7dG9wOiB0b3AhLCBsZWZ0OiBsZWZ0ISwgYm90dG9tOiBib3R0b20hLCByaWdodDogcmlnaHQhLCB3aWR0aCwgaGVpZ2h0fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSdzIHNpemluZyB3cmFwcGVyLiBUaGUgd3JhcHBlciBpcyBwb3NpdGlvbmVkIG9uIHRoZVxuICAgKiBvcmlnaW4ncyBjb25uZWN0aW9uIHBvaW50IGFuZCBzdGV0Y2hlcyB0byB0aGUgYm91bmRzIG9mIHRoZSB2aWV3cG9ydC5cbiAgICpcbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHdoZXJlIHRoZSBvdmVybGF5IGlzIGNvbm5lY3RlZC5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBwcmVmZXJlbmNlXG4gICAqL1xuICBwcml2YXRlIF9zZXRCb3VuZGluZ0JveFN0eWxlcyhvcmlnaW46IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiB2b2lkIHtcbiAgICBjb25zdCBib3VuZGluZ0JveFJlY3QgPSB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luLCBwb3NpdGlvbik7XG5cbiAgICAvLyBJdCdzIHdlaXJkIGlmIHRoZSBvdmVybGF5ICpncm93cyogd2hpbGUgc2Nyb2xsaW5nLCBzbyB3ZSB0YWtlIHRoZSBsYXN0IHNpemUgaW50byBhY2NvdW50XG4gICAgLy8gd2hlbiBhcHBseWluZyBhIG5ldyBzaXplLlxuICAgIGlmICghdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICBib3VuZGluZ0JveFJlY3QuaGVpZ2h0ID0gTWF0aC5taW4oYm91bmRpbmdCb3hSZWN0LmhlaWdodCwgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQpO1xuICAgICAgYm91bmRpbmdCb3hSZWN0LndpZHRoID0gTWF0aC5taW4oYm91bmRpbmdCb3hSZWN0LndpZHRoLCB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLndpZHRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdHlsZXMgPSB7fSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuXG4gICAgaWYgKHRoaXMuX2hhc0V4YWN0UG9zaXRpb24oKSkge1xuICAgICAgc3R5bGVzLnRvcCA9IHN0eWxlcy5sZWZ0ID0gJzAnO1xuICAgICAgc3R5bGVzLmJvdHRvbSA9IHN0eWxlcy5yaWdodCA9IHN0eWxlcy5tYXhIZWlnaHQgPSBzdHlsZXMubWF4V2lkdGggPSAnJztcbiAgICAgIHN0eWxlcy53aWR0aCA9IHN0eWxlcy5oZWlnaHQgPSAnMTAwJSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1heEhlaWdodCA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWF4SGVpZ2h0O1xuICAgICAgY29uc3QgbWF4V2lkdGggPSB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLm1heFdpZHRoO1xuXG4gICAgICBzdHlsZXMuaGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QuaGVpZ2h0KTtcbiAgICAgIHN0eWxlcy50b3AgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC50b3ApO1xuICAgICAgc3R5bGVzLmJvdHRvbSA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LmJvdHRvbSk7XG4gICAgICBzdHlsZXMud2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC53aWR0aCk7XG4gICAgICBzdHlsZXMubGVmdCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LmxlZnQpO1xuICAgICAgc3R5bGVzLnJpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QucmlnaHQpO1xuXG4gICAgICAvLyBQdXNoIHRoZSBwYW5lIGNvbnRlbnQgdG93YXJkcyB0aGUgcHJvcGVyIGRpcmVjdGlvbi5cbiAgICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgc3R5bGVzLmFsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlcy5hbGlnbkl0ZW1zID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnID8gJ2ZsZXgtZW5kJyA6ICdmbGV4LXN0YXJ0JztcbiAgICAgIH1cblxuICAgICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAnY2VudGVyJykge1xuICAgICAgICBzdHlsZXMuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlcy5qdXN0aWZ5Q29udGVudCA9IHBvc2l0aW9uLm92ZXJsYXlZID09PSAnYm90dG9tJyA/ICdmbGV4LWVuZCcgOiAnZmxleC1zdGFydCc7XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXhIZWlnaHQpIHtcbiAgICAgICAgc3R5bGVzLm1heEhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUobWF4SGVpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1heFdpZHRoKSB7XG4gICAgICAgIHN0eWxlcy5tYXhXaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUobWF4V2lkdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUgPSBib3VuZGluZ0JveFJlY3Q7XG5cbiAgICBleHRlbmRTdHlsZXModGhpcy5fYm91bmRpbmdCb3ghLnN0eWxlLCBzdHlsZXMpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3R5bGVzIGZvciB0aGUgYm91bmRpbmcgYm94IHNvIHRoYXQgYSBuZXcgcG9zaXRpb25pbmcgY2FuIGJlIGNvbXB1dGVkLiAqL1xuICBwcml2YXRlIF9yZXNldEJvdW5kaW5nQm94U3R5bGVzKCkge1xuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveCEuc3R5bGUsIHtcbiAgICAgIHRvcDogJzAnLFxuICAgICAgbGVmdDogJzAnLFxuICAgICAgcmlnaHQ6ICcwJyxcbiAgICAgIGJvdHRvbTogJzAnLFxuICAgICAgaGVpZ2h0OiAnJyxcbiAgICAgIHdpZHRoOiAnJyxcbiAgICAgIGFsaWduSXRlbXM6ICcnLFxuICAgICAganVzdGlmeUNvbnRlbnQ6ICcnLFxuICAgIH0gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbik7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdHlsZXMgZm9yIHRoZSBvdmVybGF5IHBhbmUgc28gdGhhdCBhIG5ldyBwb3NpdGlvbmluZyBjYW4gYmUgY29tcHV0ZWQuICovXG4gIHByaXZhdGUgX3Jlc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMoKSB7XG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX3BhbmUuc3R5bGUsIHtcbiAgICAgIHRvcDogJycsXG4gICAgICBsZWZ0OiAnJyxcbiAgICAgIGJvdHRvbTogJycsXG4gICAgICByaWdodDogJycsXG4gICAgICBwb3NpdGlvbjogJycsXG4gICAgICB0cmFuc2Zvcm06ICcnLFxuICAgIH0gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbik7XG4gIH1cblxuICAvKiogU2V0cyBwb3NpdGlvbmluZyBzdHlsZXMgdG8gdGhlIG92ZXJsYXkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMob3JpZ2luUG9pbnQ6IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiB2b2lkIHtcbiAgICBjb25zdCBzdHlsZXMgPSB7fSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGNvbnN0IGhhc0V4YWN0UG9zaXRpb24gPSB0aGlzLl9oYXNFeGFjdFBvc2l0aW9uKCk7XG4gICAgY29uc3QgaGFzRmxleGlibGVEaW1lbnNpb25zID0gdGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zO1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCk7XG5cbiAgICBpZiAoaGFzRXhhY3RQb3NpdGlvbikge1xuICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICAgIGV4dGVuZFN0eWxlcyhzdHlsZXMsIHRoaXMuX2dldEV4YWN0T3ZlcmxheVkocG9zaXRpb24sIG9yaWdpblBvaW50LCBzY3JvbGxQb3NpdGlvbikpO1xuICAgICAgZXh0ZW5kU3R5bGVzKHN0eWxlcywgdGhpcy5fZ2V0RXhhY3RPdmVybGF5WChwb3NpdGlvbiwgb3JpZ2luUG9pbnQsIHNjcm9sbFBvc2l0aW9uKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5wb3NpdGlvbiA9ICdzdGF0aWMnO1xuICAgIH1cblxuICAgIC8vIFVzZSBhIHRyYW5zZm9ybSB0byBhcHBseSB0aGUgb2Zmc2V0cy4gV2UgZG8gdGhpcyBiZWNhdXNlIHRoZSBgY2VudGVyYCBwb3NpdGlvbnMgcmVseSBvblxuICAgIC8vIGJlaW5nIGluIHRoZSBub3JtYWwgZmxleCBmbG93IGFuZCBzZXR0aW5nIGEgYHRvcGAgLyBgbGVmdGAgYXQgYWxsIHdpbGwgY29tcGxldGVseSB0aHJvd1xuICAgIC8vIG9mZiB0aGUgcG9zaXRpb24uIFdlIGFsc28gY2FuJ3QgdXNlIG1hcmdpbnMsIGJlY2F1c2UgdGhleSB3b24ndCBoYXZlIGFuIGVmZmVjdCBpbiBzb21lXG4gICAgLy8gY2FzZXMgd2hlcmUgdGhlIGVsZW1lbnQgZG9lc24ndCBoYXZlIGFueXRoaW5nIHRvIFwicHVzaCBvZmYgb2ZcIi4gRmluYWxseSwgdGhpcyB3b3Jrc1xuICAgIC8vIGJldHRlciBib3RoIHdpdGggZmxleGlibGUgYW5kIG5vbi1mbGV4aWJsZSBwb3NpdGlvbmluZy5cbiAgICBsZXQgdHJhbnNmb3JtU3RyaW5nID0gJyc7XG4gICAgbGV0IG9mZnNldFggPSB0aGlzLl9nZXRPZmZzZXQocG9zaXRpb24sICd4Jyk7XG4gICAgbGV0IG9mZnNldFkgPSB0aGlzLl9nZXRPZmZzZXQocG9zaXRpb24sICd5Jyk7XG5cbiAgICBpZiAob2Zmc2V0WCkge1xuICAgICAgdHJhbnNmb3JtU3RyaW5nICs9IGB0cmFuc2xhdGVYKCR7b2Zmc2V0WH1weCkgYDtcbiAgICB9XG5cbiAgICBpZiAob2Zmc2V0WSkge1xuICAgICAgdHJhbnNmb3JtU3RyaW5nICs9IGB0cmFuc2xhdGVZKCR7b2Zmc2V0WX1weClgO1xuICAgIH1cblxuICAgIHN0eWxlcy50cmFuc2Zvcm0gPSB0cmFuc2Zvcm1TdHJpbmcudHJpbSgpO1xuXG4gICAgLy8gSWYgYSBtYXhXaWR0aCBvciBtYXhIZWlnaHQgaXMgc3BlY2lmaWVkIG9uIHRoZSBvdmVybGF5LCB3ZSByZW1vdmUgdGhlbS4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gICAgLy8gd2UgbmVlZCB0aGVzZSB2YWx1ZXMgdG8gYm90aCBiZSBzZXQgdG8gXCIxMDAlXCIgZm9yIHRoZSBhdXRvbWF0aWMgZmxleGlibGUgc2l6aW5nIHRvIHdvcmsuXG4gICAgLy8gVGhlIG1heEhlaWdodCBhbmQgbWF4V2lkdGggYXJlIHNldCBvbiB0aGUgYm91bmRpbmdCb3ggaW4gb3JkZXIgdG8gZW5mb3JjZSB0aGUgY29uc3RyYWludC5cbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IGFwcGx5IHdoZW4gd2UgaGF2ZSBhbiBleGFjdCBwb3NpdGlvbiwgaW4gd2hpY2ggY2FzZSB3ZSBkbyB3YW50IHRvXG4gICAgLy8gYXBwbHkgdGhlbSBiZWNhdXNlIHRoZXknbGwgYmUgY2xlYXJlZCBmcm9tIHRoZSBib3VuZGluZyBib3guXG4gICAgaWYgKGNvbmZpZy5tYXhIZWlnaHQpIHtcbiAgICAgIGlmIChoYXNFeGFjdFBvc2l0aW9uKSB7XG4gICAgICAgIHN0eWxlcy5tYXhIZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGNvbmZpZy5tYXhIZWlnaHQpO1xuICAgICAgfSBlbHNlIGlmIChoYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgICAgc3R5bGVzLm1heEhlaWdodCA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb25maWcubWF4V2lkdGgpIHtcbiAgICAgIGlmIChoYXNFeGFjdFBvc2l0aW9uKSB7XG4gICAgICAgIHN0eWxlcy5tYXhXaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoY29uZmlnLm1heFdpZHRoKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzRmxleGlibGVEaW1lbnNpb25zKSB7XG4gICAgICAgIHN0eWxlcy5tYXhXaWR0aCA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9wYW5lLnN0eWxlLCBzdHlsZXMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGV4YWN0IHRvcC9ib3R0b20gZm9yIHRoZSBvdmVybGF5IHdoZW4gbm90IHVzaW5nIGZsZXhpYmxlIHNpemluZyBvciB3aGVuIHB1c2hpbmcuICovXG4gIHByaXZhdGUgX2dldEV4YWN0T3ZlcmxheVkoXG4gICAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLFxuICAgIG9yaWdpblBvaW50OiBQb2ludCxcbiAgICBzY3JvbGxQb3NpdGlvbjogVmlld3BvcnRTY3JvbGxQb3NpdGlvbixcbiAgKSB7XG4gICAgLy8gUmVzZXQgYW55IGV4aXN0aW5nIHN0eWxlcy4gVGhpcyBpcyBuZWNlc3NhcnkgaW4gY2FzZSB0aGVcbiAgICAvLyBwcmVmZXJyZWQgcG9zaXRpb24gaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgYGFwcGx5YC5cbiAgICBsZXQgc3R5bGVzID0ge3RvcDogJycsIGJvdHRvbTogJyd9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgbGV0IG92ZXJsYXlQb2ludCA9IHRoaXMuX2dldE92ZXJsYXlQb2ludChvcmlnaW5Qb2ludCwgdGhpcy5fb3ZlcmxheVJlY3QsIHBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9pc1B1c2hlZCkge1xuICAgICAgb3ZlcmxheVBvaW50ID0gdGhpcy5fcHVzaE92ZXJsYXlPblNjcmVlbihvdmVybGF5UG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBzY3JvbGxQb3NpdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IHZpcnR1YWxLZXlib2FyZE9mZnNldCA9IHRoaXMuX292ZXJsYXlDb250YWluZXJcbiAgICAgIC5nZXRDb250YWluZXJFbGVtZW50KClcbiAgICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG5cbiAgICAvLyBOb3JtYWxseSB0aGlzIHdvdWxkIGJlIHplcm8sIGhvd2V2ZXIgd2hlbiB0aGUgb3ZlcmxheSBpcyBhdHRhY2hlZCB0byBhbiBpbnB1dCAoZS5nLiBpbiBhblxuICAgIC8vIGF1dG9jb21wbGV0ZSksIG1vYmlsZSBicm93c2VycyB3aWxsIHNoaWZ0IGV2ZXJ5dGhpbmcgaW4gb3JkZXIgdG8gcHV0IHRoZSBpbnB1dCBpbiB0aGUgbWlkZGxlXG4gICAgLy8gb2YgdGhlIHNjcmVlbiBhbmQgdG8gbWFrZSBzcGFjZSBmb3IgdGhlIHZpcnR1YWwga2V5Ym9hcmQuIFdlIG5lZWQgdG8gYWNjb3VudCBmb3IgdGhpcyBvZmZzZXQsXG4gICAgLy8gb3RoZXJ3aXNlIG91ciBwb3NpdGlvbmluZyB3aWxsIGJlIHRocm93biBvZmYuXG4gICAgb3ZlcmxheVBvaW50LnkgLT0gdmlydHVhbEtleWJvYXJkT2Zmc2V0O1xuXG4gICAgLy8gV2Ugd2FudCB0byBzZXQgZWl0aGVyIGB0b3BgIG9yIGBib3R0b21gIGJhc2VkIG9uIHdoZXRoZXIgdGhlIG92ZXJsYXkgd2FudHMgdG8gYXBwZWFyXG4gICAgLy8gYWJvdmUgb3IgYmVsb3cgdGhlIG9yaWdpbiBhbmQgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgZWxlbWVudCB3aWxsIGV4cGFuZC5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nKSB7XG4gICAgICAvLyBXaGVuIHVzaW5nIGBib3R0b21gLCB3ZSBhZGp1c3QgdGhlIHkgcG9zaXRpb24gc3VjaCB0aGF0IGl0IGlzIHRoZSBkaXN0YW5jZVxuICAgICAgLy8gZnJvbSB0aGUgYm90dG9tIG9mIHRoZSB2aWV3cG9ydCByYXRoZXIgdGhhbiB0aGUgdG9wLlxuICAgICAgY29uc3QgZG9jdW1lbnRIZWlnaHQgPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudEhlaWdodDtcbiAgICAgIHN0eWxlcy5ib3R0b20gPSBgJHtkb2N1bWVudEhlaWdodCAtIChvdmVybGF5UG9pbnQueSArIHRoaXMuX292ZXJsYXlSZWN0LmhlaWdodCl9cHhgO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMudG9wID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShvdmVybGF5UG9pbnQueSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBleGFjdCBsZWZ0L3JpZ2h0IGZvciB0aGUgb3ZlcmxheSB3aGVuIG5vdCB1c2luZyBmbGV4aWJsZSBzaXppbmcgb3Igd2hlbiBwdXNoaW5nLiAqL1xuICBwcml2YXRlIF9nZXRFeGFjdE92ZXJsYXlYKFxuICAgIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbixcbiAgICBvcmlnaW5Qb2ludDogUG9pbnQsXG4gICAgc2Nyb2xsUG9zaXRpb246IFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24sXG4gICkge1xuICAgIC8vIFJlc2V0IGFueSBleGlzdGluZyBzdHlsZXMuIFRoaXMgaXMgbmVjZXNzYXJ5IGluIGNhc2UgdGhlIHByZWZlcnJlZCBwb3NpdGlvbiBoYXNcbiAgICAvLyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGBhcHBseWAuXG4gICAgbGV0IHN0eWxlcyA9IHtsZWZ0OiAnJywgcmlnaHQ6ICcnfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBwb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5faXNQdXNoZWQpIHtcbiAgICAgIG92ZXJsYXlQb2ludCA9IHRoaXMuX3B1c2hPdmVybGF5T25TY3JlZW4ob3ZlcmxheVBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgc2Nyb2xsUG9zaXRpb24pO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gc2V0IGVpdGhlciBgbGVmdGAgb3IgYHJpZ2h0YCBiYXNlZCBvbiB3aGV0aGVyIHRoZSBvdmVybGF5IHdhbnRzIHRvIGFwcGVhciBcImJlZm9yZVwiXG4gICAgLy8gb3IgXCJhZnRlclwiIHRoZSBvcmlnaW4sIHdoaWNoIGRldGVybWluZXMgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgZWxlbWVudCB3aWxsIGV4cGFuZC5cbiAgICAvLyBGb3IgdGhlIGhvcml6b250YWwgYXhpcywgdGhlIG1lYW5pbmcgb2YgXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiIGNoYW5nZSBiYXNlZCBvbiB3aGV0aGVyIHRoZVxuICAgIC8vIHBhZ2UgaXMgaW4gUlRMIG9yIExUUi5cbiAgICBsZXQgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHk6ICdsZWZ0JyB8ICdyaWdodCc7XG5cbiAgICBpZiAodGhpcy5faXNSdGwoKSkge1xuICAgICAgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAnbGVmdCcgOiAncmlnaHQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBob3Jpem9udGFsU3R5bGVQcm9wZXJ0eSA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB3ZSdyZSBzZXR0aW5nIGByaWdodGAsIHdlIGFkanVzdCB0aGUgeCBwb3NpdGlvbiBzdWNoIHRoYXQgaXQgaXMgdGhlIGRpc3RhbmNlXG4gICAgLy8gZnJvbSB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgdmlld3BvcnQgcmF0aGVyIHRoYW4gdGhlIGxlZnQgZWRnZS5cbiAgICBpZiAoaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPT09ICdyaWdodCcpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50V2lkdGggPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudFdpZHRoO1xuICAgICAgc3R5bGVzLnJpZ2h0ID0gYCR7ZG9jdW1lbnRXaWR0aCAtIChvdmVybGF5UG9pbnQueCArIHRoaXMuX292ZXJsYXlSZWN0LndpZHRoKX1weGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5sZWZ0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShvdmVybGF5UG9pbnQueCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3IHByb3BlcnRpZXMgb2YgdGhlIHRyaWdnZXIgYW5kIG92ZXJsYXksIGluY2x1ZGluZyB3aGV0aGVyIHRoZXkgYXJlIGNsaXBwZWRcbiAgICogb3IgY29tcGxldGVseSBvdXRzaWRlIHRoZSB2aWV3IG9mIGFueSBvZiB0aGUgc3RyYXRlZ3kncyBzY3JvbGxhYmxlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNjcm9sbFZpc2liaWxpdHkoKTogU2Nyb2xsaW5nVmlzaWJpbGl0eSB7XG4gICAgLy8gTm90ZTogbmVlZHMgZnJlc2ggcmVjdHMgc2luY2UgdGhlIHBvc2l0aW9uIGNvdWxkJ3ZlIGNoYW5nZWQuXG4gICAgY29uc3Qgb3JpZ2luQm91bmRzID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgIGNvbnN0IG92ZXJsYXlCb3VuZHMgPSB0aGlzLl9wYW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gVE9ETyhqZWxib3Vybik6IGluc3RlYWQgb2YgbmVlZGluZyBhbGwgb2YgdGhlIGNsaWVudCByZWN0cyBmb3IgdGhlc2Ugc2Nyb2xsaW5nIGNvbnRhaW5lcnNcbiAgICAvLyBldmVyeSB0aW1lLCB3ZSBzaG91bGQgYmUgYWJsZSB0byB1c2UgdGhlIHNjcm9sbFRvcCBvZiB0aGUgY29udGFpbmVycyBpZiB0aGUgc2l6ZSBvZiB0aG9zZVxuICAgIC8vIGNvbnRhaW5lcnMgaGFzbid0IGNoYW5nZWQuXG4gICAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyQm91bmRzID0gdGhpcy5fc2Nyb2xsYWJsZXMubWFwKHNjcm9sbGFibGUgPT4ge1xuICAgICAgcmV0dXJuIHNjcm9sbGFibGUuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXNPcmlnaW5DbGlwcGVkOiBpc0VsZW1lbnRDbGlwcGVkQnlTY3JvbGxpbmcob3JpZ2luQm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgICAgaXNPcmlnaW5PdXRzaWRlVmlldzogaXNFbGVtZW50U2Nyb2xsZWRPdXRzaWRlVmlldyhvcmlnaW5Cb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgICBpc092ZXJsYXlDbGlwcGVkOiBpc0VsZW1lbnRDbGlwcGVkQnlTY3JvbGxpbmcob3ZlcmxheUJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICAgIGlzT3ZlcmxheU91dHNpZGVWaWV3OiBpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3KG92ZXJsYXlCb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBTdWJ0cmFjdHMgdGhlIGFtb3VudCB0aGF0IGFuIGVsZW1lbnQgaXMgb3ZlcmZsb3dpbmcgb24gYW4gYXhpcyBmcm9tIGl0cyBsZW5ndGguICovXG4gIHByaXZhdGUgX3N1YnRyYWN0T3ZlcmZsb3dzKGxlbmd0aDogbnVtYmVyLCAuLi5vdmVyZmxvd3M6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgICByZXR1cm4gb3ZlcmZsb3dzLnJlZHVjZSgoY3VycmVudFZhbHVlOiBudW1iZXIsIGN1cnJlbnRPdmVyZmxvdzogbnVtYmVyKSA9PiB7XG4gICAgICByZXR1cm4gY3VycmVudFZhbHVlIC0gTWF0aC5tYXgoY3VycmVudE92ZXJmbG93LCAwKTtcbiAgICB9LCBsZW5ndGgpO1xuICB9XG5cbiAgLyoqIE5hcnJvd3MgdGhlIGdpdmVuIHZpZXdwb3J0IHJlY3QgYnkgdGhlIGN1cnJlbnQgX3ZpZXdwb3J0TWFyZ2luLiAqL1xuICBwcml2YXRlIF9nZXROYXJyb3dlZFZpZXdwb3J0UmVjdCgpOiBEaW1lbnNpb25zIHtcbiAgICAvLyBXZSByZWNhbGN1bGF0ZSB0aGUgdmlld3BvcnQgcmVjdCBoZXJlIG91cnNlbHZlcywgcmF0aGVyIHRoYW4gdXNpbmcgdGhlIFZpZXdwb3J0UnVsZXIsXG4gICAgLy8gYmVjYXVzZSB3ZSB3YW50IHRvIHVzZSB0aGUgYGNsaWVudFdpZHRoYCBhbmQgYGNsaWVudEhlaWdodGAgYXMgdGhlIGJhc2UuIFRoZSBkaWZmZXJlbmNlXG4gICAgLy8gYmVpbmcgdGhhdCB0aGUgY2xpZW50IHByb3BlcnRpZXMgZG9uJ3QgaW5jbHVkZSB0aGUgc2Nyb2xsYmFyLCBhcyBvcHBvc2VkIHRvIGBpbm5lcldpZHRoYFxuICAgIC8vIGFuZCBgaW5uZXJIZWlnaHRgIHRoYXQgZG8uIFRoaXMgaXMgbmVjZXNzYXJ5LCBiZWNhdXNlIHRoZSBvdmVybGF5IGNvbnRhaW5lciB1c2VzXG4gICAgLy8gMTAwJSBgd2lkdGhgIGFuZCBgaGVpZ2h0YCB3aGljaCBkb24ndCBpbmNsdWRlIHRoZSBzY3JvbGxiYXIgZWl0aGVyLlxuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRXaWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogc2Nyb2xsUG9zaXRpb24udG9wICsgdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICBsZWZ0OiBzY3JvbGxQb3NpdGlvbi5sZWZ0ICsgdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICByaWdodDogc2Nyb2xsUG9zaXRpb24ubGVmdCArIHdpZHRoIC0gdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICBib3R0b206IHNjcm9sbFBvc2l0aW9uLnRvcCArIGhlaWdodCAtIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgd2lkdGg6IHdpZHRoIC0gMiAqIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAyICogdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSB3ZSdyZSBkZWFsaW5nIHdpdGggYW4gUlRMIGNvbnRleHQgKi9cbiAgcHJpdmF0ZSBfaXNSdGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlSZWYuZ2V0RGlyZWN0aW9uKCkgPT09ICdydGwnO1xuICB9XG5cbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGUgb3ZlcmxheSB1c2VzIGV4YWN0IG9yIGZsZXhpYmxlIHBvc2l0aW9uaW5nLiAqL1xuICBwcml2YXRlIF9oYXNFeGFjdFBvc2l0aW9uKCkge1xuICAgIHJldHVybiAhdGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zIHx8IHRoaXMuX2lzUHVzaGVkO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyB0aGUgb2Zmc2V0IG9mIGEgcG9zaXRpb24gYWxvbmcgdGhlIHggb3IgeSBheGlzLiAqL1xuICBwcml2YXRlIF9nZXRPZmZzZXQocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLCBheGlzOiAneCcgfCAneScpIHtcbiAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgICAvLyBXZSBkb24ndCBkbyBzb21ldGhpbmcgbGlrZSBgcG9zaXRpb25bJ29mZnNldCcgKyBheGlzXWAgaW5cbiAgICAgIC8vIG9yZGVyIHRvIGF2b2lkIGJyZWtpbmcgbWluaWZpZXJzIHRoYXQgcmVuYW1lIHByb3BlcnRpZXMuXG4gICAgICByZXR1cm4gcG9zaXRpb24ub2Zmc2V0WCA9PSBudWxsID8gdGhpcy5fb2Zmc2V0WCA6IHBvc2l0aW9uLm9mZnNldFg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9uLm9mZnNldFkgPT0gbnVsbCA/IHRoaXMuX29mZnNldFkgOiBwb3NpdGlvbi5vZmZzZXRZO1xuICB9XG5cbiAgLyoqIFZhbGlkYXRlcyB0aGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uIG1hdGNoIHRoZSBleHBlY3RlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX3ZhbGlkYXRlUG9zaXRpb25zKCk6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICghdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBFcnJvcignRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5OiBBdCBsZWFzdCBvbmUgcG9zaXRpb24gaXMgcmVxdWlyZWQuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE8oY3Jpc2JldG8pOiByZW1vdmUgdGhlc2Ugb25jZSBBbmd1bGFyJ3MgdGVtcGxhdGUgdHlwZVxuICAgICAgLy8gY2hlY2tpbmcgaXMgYWR2YW5jZWQgZW5vdWdoIHRvIGNhdGNoIHRoZXNlIGNhc2VzLlxuICAgICAgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zLmZvckVhY2gocGFpciA9PiB7XG4gICAgICAgIHZhbGlkYXRlSG9yaXpvbnRhbFBvc2l0aW9uKCdvcmlnaW5YJywgcGFpci5vcmlnaW5YKTtcbiAgICAgICAgdmFsaWRhdGVWZXJ0aWNhbFBvc2l0aW9uKCdvcmlnaW5ZJywgcGFpci5vcmlnaW5ZKTtcbiAgICAgICAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24oJ292ZXJsYXlYJywgcGFpci5vdmVybGF5WCk7XG4gICAgICAgIHZhbGlkYXRlVmVydGljYWxQb3NpdGlvbignb3ZlcmxheVknLCBwYWlyLm92ZXJsYXlZKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBZGRzIGEgc2luZ2xlIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIG9uIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9hZGRQYW5lbENsYXNzZXMoY3NzQ2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgY29lcmNlQXJyYXkoY3NzQ2xhc3NlcykuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG4gICAgICAgIGlmIChjc3NDbGFzcyAhPT0gJycgJiYgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3Nlcy5pbmRleE9mKGNzc0NsYXNzKSA9PT0gLTEpIHtcbiAgICAgICAgICB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzLnB1c2goY3NzQ2xhc3MpO1xuICAgICAgICAgIHRoaXMuX3BhbmUuY2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhcnMgdGhlIGNsYXNzZXMgdGhhdCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgaGFzIGFwcGxpZWQgZnJvbSB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfY2xlYXJQYW5lbENsYXNzZXMoKSB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG4gICAgICAgIHRoaXMuX3BhbmUuY2xhc3NMaXN0LnJlbW92ZShjc3NDbGFzcyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgQ2xpZW50UmVjdCBvZiB0aGUgY3VycmVudCBvcmlnaW4uICovXG4gIHByaXZhdGUgX2dldE9yaWdpblJlY3QoKTogRGltZW5zaW9ucyB7XG4gICAgY29uc3Qgb3JpZ2luID0gdGhpcy5fb3JpZ2luO1xuXG4gICAgaWYgKG9yaWdpbiBpbnN0YW5jZW9mIEVsZW1lbnRSZWYpIHtcbiAgICAgIHJldHVybiBvcmlnaW4ubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgRWxlbWVudCBzbyBTVkcgZWxlbWVudHMgYXJlIGFsc28gc3VwcG9ydGVkLlxuICAgIGlmIChvcmlnaW4gaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICByZXR1cm4gb3JpZ2luLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH1cblxuICAgIGNvbnN0IHdpZHRoID0gb3JpZ2luLndpZHRoIHx8IDA7XG4gICAgY29uc3QgaGVpZ2h0ID0gb3JpZ2luLmhlaWdodCB8fCAwO1xuXG4gICAgLy8gSWYgdGhlIG9yaWdpbiBpcyBhIHBvaW50LCByZXR1cm4gYSBjbGllbnQgcmVjdCBhcyBpZiBpdCB3YXMgYSAweDAgZWxlbWVudCBhdCB0aGUgcG9pbnQuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogb3JpZ2luLnksXG4gICAgICBib3R0b206IG9yaWdpbi55ICsgaGVpZ2h0LFxuICAgICAgbGVmdDogb3JpZ2luLngsXG4gICAgICByaWdodDogb3JpZ2luLnggKyB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHdpZHRoLFxuICAgIH07XG4gIH1cbn1cblxuLyoqIEEgc2ltcGxlICh4LCB5KSBjb29yZGluYXRlLiAqL1xuaW50ZXJmYWNlIFBvaW50IHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG59XG5cbi8qKiBSZWNvcmQgb2YgbWVhc3VyZW1lbnRzIGZvciBob3cgYW4gb3ZlcmxheSAoYXQgYSBnaXZlbiBwb3NpdGlvbikgZml0cyBpbnRvIHRoZSB2aWV3cG9ydC4gKi9cbmludGVyZmFjZSBPdmVybGF5Rml0IHtcbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgZml0cyBjb21wbGV0ZWx5IGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQ6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgb24gdGhlIHktYXhpcy4gKi9cbiAgZml0c0luVmlld3BvcnRWZXJ0aWNhbGx5OiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGZpdHMgaW4gdGhlIHZpZXdwb3J0IG9uIHRoZSB4LWF4aXMuICovXG4gIGZpdHNJblZpZXdwb3J0SG9yaXpvbnRhbGx5OiBib29sZWFuO1xuXG4gIC8qKiBUaGUgdG90YWwgdmlzaWJsZSBhcmVhIChpbiBweF4yKSBvZiB0aGUgb3ZlcmxheSBpbnNpZGUgdGhlIHZpZXdwb3J0LiAqL1xuICB2aXNpYmxlQXJlYTogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIHRoZSBtZWFzdXJtZW50cyBkZXRlcm1pbmluZyB3aGV0aGVyIGFuIG92ZXJsYXkgd2lsbCBmaXQgaW4gYSBzcGVjaWZpYyBwb3NpdGlvbi4gKi9cbmludGVyZmFjZSBGYWxsYmFja1Bvc2l0aW9uIHtcbiAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uO1xuICBvcmlnaW5Qb2ludDogUG9pbnQ7XG4gIG92ZXJsYXlQb2ludDogUG9pbnQ7XG4gIG92ZXJsYXlGaXQ6IE92ZXJsYXlGaXQ7XG4gIG92ZXJsYXlSZWN0OiBEaW1lbnNpb25zO1xufVxuXG4vKiogUG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIG92ZXJsYXkgc2l6aW5nIHdyYXBwZXIgZm9yIGEgc3BlY2lmaWMgcG9zaXRpb24uICovXG5pbnRlcmZhY2UgQm91bmRpbmdCb3hSZWN0IHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgYm90dG9tOiBudW1iZXI7XG4gIHJpZ2h0OiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIG1lYXN1cmVzIGRldGVybWluaW5nIGhvdyB3ZWxsIGEgZ2l2ZW4gcG9zaXRpb24gd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLiAqL1xuaW50ZXJmYWNlIEZsZXhpYmxlRml0IHtcbiAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uO1xuICBvcmlnaW46IFBvaW50O1xuICBvdmVybGF5UmVjdDogRGltZW5zaW9ucztcbiAgYm91bmRpbmdCb3hSZWN0OiBCb3VuZGluZ0JveFJlY3Q7XG59XG5cbi8qKiBBIGNvbm5lY3RlZCBwb3NpdGlvbiBhcyBzcGVjaWZpZWQgYnkgdGhlIHVzZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RlZFBvc2l0aW9uIHtcbiAgb3JpZ2luWDogJ3N0YXJ0JyB8ICdjZW50ZXInIHwgJ2VuZCc7XG4gIG9yaWdpblk6ICd0b3AnIHwgJ2NlbnRlcicgfCAnYm90dG9tJztcblxuICBvdmVybGF5WDogJ3N0YXJ0JyB8ICdjZW50ZXInIHwgJ2VuZCc7XG4gIG92ZXJsYXlZOiAndG9wJyB8ICdjZW50ZXInIHwgJ2JvdHRvbSc7XG5cbiAgd2VpZ2h0PzogbnVtYmVyO1xuICBvZmZzZXRYPzogbnVtYmVyO1xuICBvZmZzZXRZPzogbnVtYmVyO1xuICBwYW5lbENsYXNzPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbi8qKiBTaGFsbG93LWV4dGVuZHMgYSBzdHlsZXNoZWV0IG9iamVjdCB3aXRoIGFub3RoZXIgc3R5bGVzaGVldCBvYmplY3QuICovXG5mdW5jdGlvbiBleHRlbmRTdHlsZXMoXG4gIGRlc3RpbmF0aW9uOiBDU1NTdHlsZURlY2xhcmF0aW9uLFxuICBzb3VyY2U6IENTU1N0eWxlRGVjbGFyYXRpb24sXG4pOiBDU1NTdHlsZURlY2xhcmF0aW9uIHtcbiAgZm9yIChsZXQga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgZGVzdGluYXRpb25ba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0aW5hdGlvbjtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgcGl4ZWwgdmFsdWUgYXMgYSBudW1iZXIgZnJvbSBhIHZhbHVlLCBpZiBpdCdzIGEgbnVtYmVyXG4gKiBvciBhIENTUyBwaXhlbCBzdHJpbmcgKGUuZy4gYDEzMzdweGApLiBPdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICovXG5mdW5jdGlvbiBnZXRQaXhlbFZhbHVlKGlucHV0OiBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgaW5wdXQgIT09ICdudW1iZXInICYmIGlucHV0ICE9IG51bGwpIHtcbiAgICBjb25zdCBbdmFsdWUsIHVuaXRzXSA9IGlucHV0LnNwbGl0KGNzc1VuaXRQYXR0ZXJuKTtcbiAgICByZXR1cm4gIXVuaXRzIHx8IHVuaXRzID09PSAncHgnID8gcGFyc2VGbG9hdCh2YWx1ZSkgOiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGlucHV0IHx8IG51bGw7XG59XG5cbi8qKlxuICogR2V0cyBhIHZlcnNpb24gb2YgYW4gZWxlbWVudCdzIGJvdW5kaW5nIGBDbGllbnRSZWN0YCB3aGVyZSBhbGwgdGhlIHZhbHVlcyBhcmUgcm91bmRlZCBkb3duIHRvXG4gKiB0aGUgbmVhcmVzdCBwaXhlbC4gVGhpcyBhbGxvd3MgdXMgdG8gYWNjb3VudCBmb3IgdGhlIGNhc2VzIHdoZXJlIHRoZXJlIG1heSBiZSBzdWItcGl4ZWxcbiAqIGRldmlhdGlvbnMgaW4gdGhlIGBDbGllbnRSZWN0YCByZXR1cm5lZCBieSB0aGUgYnJvd3NlciAoZS5nLiB3aGVuIHpvb21lZCBpbiB3aXRoIGEgcGVyY2VudGFnZVxuICogc2l6ZSwgc2VlICMyMTM1MCkuXG4gKi9cbmZ1bmN0aW9uIGdldFJvdW5kZWRCb3VuZGluZ0NsaWVudFJlY3QoY2xpZW50UmVjdDogRGltZW5zaW9ucyk6IERpbWVuc2lvbnMge1xuICByZXR1cm4ge1xuICAgIHRvcDogTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCksXG4gICAgcmlnaHQ6IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodCksXG4gICAgYm90dG9tOiBNYXRoLmZsb29yKGNsaWVudFJlY3QuYm90dG9tKSxcbiAgICBsZWZ0OiBNYXRoLmZsb29yKGNsaWVudFJlY3QubGVmdCksXG4gICAgd2lkdGg6IE1hdGguZmxvb3IoY2xpZW50UmVjdC53aWR0aCksXG4gICAgaGVpZ2h0OiBNYXRoLmZsb29yKGNsaWVudFJlY3QuaGVpZ2h0KSxcbiAgfTtcbn1cbiJdfQ==