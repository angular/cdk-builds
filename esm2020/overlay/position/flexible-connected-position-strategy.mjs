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
        if (this._overlayRef && overlayRef !== this._overlayRef &&
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
                    boundingBoxRect: this._calculateBoundingBoxRect(originPoint, pos)
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
            x = originRect.left + (originRect.width / 2);
        }
        else {
            const startX = this._isRtl() ? originRect.right : originRect.left;
            const endX = this._isRtl() ? originRect.left : originRect.right;
            x = pos.originX == 'start' ? startX : endX;
        }
        let y;
        if (pos.originY == 'center') {
            y = originRect.top + (originRect.height / 2);
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
        let rightOverflow = (x + overlay.width) - viewport.width;
        let topOverflow = 0 - y;
        let bottomOverflow = (y + overlay.height) - viewport.height;
        // Visible parts of the element on each axis.
        let visibleWidth = this._subtractOverflows(overlay.width, leftOverflow, rightOverflow);
        let visibleHeight = this._subtractOverflows(overlay.height, topOverflow, bottomOverflow);
        let visibleArea = visibleWidth * visibleHeight;
        return {
            visibleArea,
            isCompletelyWithinViewport: (overlay.width * overlay.height) === visibleArea,
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
            const verticalFit = fit.fitsInViewportVertically ||
                (minHeight != null && minHeight <= availableHeight);
            const horizontalFit = fit.fitsInViewportHorizontally ||
                (minWidth != null && minWidth <= availableWidth);
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
                y: start.y + this._previousPushAmount.y
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
            pushX = start.x < this._viewportMargin ? (viewport.left - scrollPosition.left) - start.x : 0;
        }
        if (overlay.height <= viewport.height) {
            pushY = overflowTop || -overflowBottom;
        }
        else {
            pushY = start.y < this._viewportMargin ? (viewport.top - scrollPosition.top) - start.y : 0;
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
                top = origin.y - (previousHeight / 2);
            }
        }
        // The overlay is opening 'right-ward' (the content flows to the right).
        const isBoundedByRightViewportEdge = (position.overlayX === 'start' && !isRtl) ||
            (position.overlayX === 'end' && isRtl);
        // The overlay is opening 'left-ward' (the content flows to the left).
        const isBoundedByLeftViewportEdge = (position.overlayX === 'end' && !isRtl) ||
            (position.overlayX === 'start' && isRtl);
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
                left = origin.x - (previousWidth / 2);
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
        let virtualKeyboardOffset = this._overlayContainer.getContainerElement().getBoundingClientRect().top;
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
            width: width - (2 * this._viewportMargin),
            height: height - (2 * this._viewportMargin),
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
            width
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
        return (!units || units === 'px') ? parseFloat(value) : null;
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
        height: Math.floor(clientRect.height)
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFDTCw4QkFBOEIsRUFHOUIsMEJBQTBCLEVBQzFCLHdCQUF3QixHQUN6QixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBYSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRXZELE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RixPQUFPLEVBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFJdkUscUZBQXFGO0FBQ3JGLDZGQUE2RjtBQUU3RixxREFBcUQ7QUFDckQsTUFBTSxnQkFBZ0IsR0FBRyw2Q0FBNkMsQ0FBQztBQUV2RSxxREFBcUQ7QUFDckQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBV3ZDOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxpQ0FBaUM7SUEwRjVDLFlBQ0ksV0FBb0QsRUFBVSxjQUE2QixFQUNuRixTQUFtQixFQUFVLFNBQW1CLEVBQ2hELGlCQUFtQztRQUZtQixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUNuRixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNoRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBdEYvQywwRkFBMEY7UUFDbEYseUJBQW9CLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUMsQ0FB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QUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDdkUsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztTQUN2QzthQUFNO1lBQ0wsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLENBQUM7WUFDekQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFFdkQsTUFBTSxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLEdBQUcsR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFMUQsc0RBQXNEO1lBQ3RELElBQUksUUFBUSxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQ2xDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO2FBQzlCO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO2FBQzdFO1lBRUQsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEs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QUFXLENBQUM7QUFDckIsQ0FBQztBQUdEOzs7R0FHRztBQUNILFNBQVMsYUFBYSxDQUFDLEtBQW1DO0lBQ3hELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDOUMsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQzlEO0lBRUQsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsNEJBQTRCLENBQUMsVUFBc0I7SUFDMUQsT0FBTztRQUNMLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7UUFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUNuQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBQ3JDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDakMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUNuQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO0tBQ3RDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyLCBDZGtTY3JvbGxhYmxlLCBWaWV3cG9ydFNjcm9sbFBvc2l0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZSxcbiAgQ29ubmVjdGlvblBvc2l0aW9uUGFpcixcbiAgU2Nyb2xsaW5nVmlzaWJpbGl0eSxcbiAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24sXG4gIHZhbGlkYXRlVmVydGljYWxQb3NpdGlvbixcbn0gZnJvbSAnLi9jb25uZWN0ZWQtcG9zaXRpb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb24sIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtPdmVybGF5UmVmZXJlbmNlfSBmcm9tICcuLi9vdmVybGF5LXJlZmVyZW5jZSc7XG5pbXBvcnQge2lzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcsIGlzRWxlbWVudENsaXBwZWRCeVNjcm9sbGluZ30gZnJvbSAnLi9zY3JvbGwtY2xpcCc7XG5pbXBvcnQge2NvZXJjZUNzc1BpeGVsVmFsdWUsIGNvZXJjZUFycmF5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7T3ZlcmxheUNvbnRhaW5lcn0gZnJvbSAnLi4vb3ZlcmxheS1jb250YWluZXInO1xuXG4vLyBUT0RPOiByZWZhY3RvciBjbGlwcGluZyBkZXRlY3Rpb24gaW50byBhIHNlcGFyYXRlIHRoaW5nIChwYXJ0IG9mIHNjcm9sbGluZyBtb2R1bGUpXG4vLyBUT0RPOiBkb2Vzbid0IGhhbmRsZSBib3RoIGZsZXhpYmxlIHdpZHRoIGFuZCBoZWlnaHQgd2hlbiBpdCBoYXMgdG8gc2Nyb2xsIGFsb25nIGJvdGggYXhpcy5cblxuLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBvdmVybGF5IGJvdW5kaW5nIGJveC4gKi9cbmNvbnN0IGJvdW5kaW5nQm94Q2xhc3MgPSAnY2RrLW92ZXJsYXktY29ubmVjdGVkLXBvc2l0aW9uLWJvdW5kaW5nLWJveCc7XG5cbi8qKiBSZWdleCB1c2VkIHRvIHNwbGl0IGEgc3RyaW5nIG9uIGl0cyBDU1MgdW5pdHMuICovXG5jb25zdCBjc3NVbml0UGF0dGVybiA9IC8oW0EtWmEteiVdKykkLztcblxuLyoqIFBvc3NpYmxlIHZhbHVlcyB0aGF0IGNhbiBiZSBzZXQgYXMgdGhlIG9yaWdpbiBvZiBhIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneS4gKi9cbmV4cG9ydCB0eXBlIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbiA9IEVsZW1lbnRSZWYgfCBFbGVtZW50IHwgUG9pbnQgJiB7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59O1xuXG4vKiogRXF1aXZhbGVudCBvZiBgQ2xpZW50UmVjdGAgd2l0aG91dCBzb21lIG9mIHRoZSBwcm9wZXJ0aWVzIHdlIGRvbid0IGNhcmUgYWJvdXQuICovXG50eXBlIERpbWVuc2lvbnMgPSBPbWl0PENsaWVudFJlY3QsICd4JyB8ICd5JyB8ICd0b0pTT04nPjtcblxuLyoqXG4gKiBBIHN0cmF0ZWd5IGZvciBwb3NpdGlvbmluZyBvdmVybGF5cy4gVXNpbmcgdGhpcyBzdHJhdGVneSwgYW4gb3ZlcmxheSBpcyBnaXZlbiBhblxuICogaW1wbGljaXQgcG9zaXRpb24gcmVsYXRpdmUgc29tZSBvcmlnaW4gZWxlbWVudC4gVGhlIHJlbGF0aXZlIHBvc2l0aW9uIGlzIGRlZmluZWQgaW4gdGVybXMgb2ZcbiAqIGEgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHRoYXQgaXMgY29ubmVjdGVkIHRvIGEgcG9pbnQgb24gdGhlIG92ZXJsYXkgZWxlbWVudC4gRm9yIGV4YW1wbGUsXG4gKiBhIGJhc2ljIGRyb3Bkb3duIGlzIGNvbm5lY3RpbmcgdGhlIGJvdHRvbS1sZWZ0IGNvcm5lciBvZiB0aGUgb3JpZ2luIHRvIHRoZSB0b3AtbGVmdCBjb3JuZXJcbiAqIG9mIHRoZSBvdmVybGF5LlxuICovXG5leHBvcnQgY2xhc3MgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IGltcGxlbWVudHMgUG9zaXRpb25TdHJhdGVneSB7XG4gIC8qKiBUaGUgb3ZlcmxheSB0byB3aGljaCB0aGlzIHN0cmF0ZWd5IGlzIGF0dGFjaGVkLiAqL1xuICBwcml2YXRlIF9vdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlO1xuXG4gIC8qKiBXaGV0aGVyIHdlJ3JlIHBlcmZvcm1pbmcgdGhlIHZlcnkgZmlyc3QgcG9zaXRpb25pbmcgb2YgdGhlIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbFJlbmRlcjogYm9vbGVhbjtcblxuICAvKiogTGFzdCBzaXplIHVzZWQgZm9yIHRoZSBib3VuZGluZyBib3guIFVzZWQgdG8gYXZvaWQgcmVzaXppbmcgdGhlIG92ZXJsYXkgYWZ0ZXIgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdEJvdW5kaW5nQm94U2l6ZSA9IHt3aWR0aDogMCwgaGVpZ2h0OiAwfTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSB3YXMgcHVzaGVkIGluIGEgcHJldmlvdXMgcG9zaXRpb25pbmcuICovXG4gIHByaXZhdGUgX2lzUHVzaGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gb24gdGhlIGluaXRpYWwgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfY2FuUHVzaCA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgdmlhIGZsZXhpYmxlIHdpZHRoL2hlaWdodCBhZnRlciB0aGUgaW5pdGlhbCBvcGVuLiAqL1xuICBwcml2YXRlIF9ncm93QWZ0ZXJPcGVuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfaGFzRmxleGlibGVEaW1lbnNpb25zID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBwb3NpdGlvbiBpcyBsb2NrZWQuICovXG4gIHByaXZhdGUgX3Bvc2l0aW9uTG9ja2VkID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlZCBvcmlnaW4gZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF9vcmlnaW5SZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBDYWNoZWQgb3ZlcmxheSBkaW1lbnNpb25zICovXG4gIHByaXZhdGUgX292ZXJsYXlSZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBDYWNoZWQgdmlld3BvcnQgZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF92aWV3cG9ydFJlY3Q6IERpbWVuc2lvbnM7XG5cbiAgLyoqIEFtb3VudCBvZiBzcGFjZSB0aGF0IG11c3QgYmUgbWFpbnRhaW5lZCBiZXR3ZWVuIHRoZSBvdmVybGF5IGFuZCB0aGUgZWRnZSBvZiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0TWFyZ2luID0gMDtcblxuICAvKiogVGhlIFNjcm9sbGFibGUgY29udGFpbmVycyB1c2VkIHRvIGNoZWNrIHNjcm9sbGFibGUgdmlldyBwcm9wZXJ0aWVzIG9uIHBvc2l0aW9uIGNoYW5nZS4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZXM6IENka1Njcm9sbGFibGVbXSA9IFtdO1xuXG4gIC8qKiBPcmRlcmVkIGxpc3Qgb2YgcHJlZmVycmVkIHBvc2l0aW9ucywgZnJvbSBtb3N0IHRvIGxlYXN0IGRlc2lyYWJsZS4gKi9cbiAgX3ByZWZlcnJlZFBvc2l0aW9uczogQ29ubmVjdGlvblBvc2l0aW9uUGFpcltdID0gW107XG5cbiAgLyoqIFRoZSBvcmlnaW4gZWxlbWVudCBhZ2FpbnN0IHdoaWNoIHRoZSBvdmVybGF5IHdpbGwgYmUgcG9zaXRpb25lZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW47XG5cbiAgLyoqIFRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfcGFuZTogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHN0cmF0ZWd5IGhhcyBiZWVuIGRpc3Bvc2VkIG9mIGFscmVhZHkuICovXG4gIHByaXZhdGUgX2lzRGlzcG9zZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFBhcmVudCBlbGVtZW50IGZvciB0aGUgb3ZlcmxheSBwYW5lbCB1c2VkIHRvIGNvbnN0cmFpbiB0aGUgb3ZlcmxheSBwYW5lbCdzIHNpemUgdG8gZml0XG4gICAqIHdpdGhpbiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9ib3VuZGluZ0JveDogSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gIC8qKiBUaGUgbGFzdCBwb3NpdGlvbiB0byBoYXZlIGJlZW4gY2FsY3VsYXRlZCBhcyB0aGUgYmVzdCBmaXQgcG9zaXRpb24uICovXG4gIHByaXZhdGUgX2xhc3RQb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24gfCBudWxsO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHBvc2l0aW9uIGNoYW5nZXMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3Bvc2l0aW9uQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4oKTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHZpZXdwb3J0IHNpemUgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBEZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkgYWxvbmcgdGhlIHggYXhpcy4gKi9cbiAgcHJpdmF0ZSBfb2Zmc2V0WCA9IDA7XG5cbiAgLyoqIERlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSBhbG9uZyB0aGUgeSBheGlzLiAqL1xuICBwcml2YXRlIF9vZmZzZXRZID0gMDtcblxuICAvKiogU2VsZWN0b3IgdG8gYmUgdXNlZCB3aGVuIGZpbmRpbmcgdGhlIGVsZW1lbnRzIG9uIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi4gKi9cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3I6IHN0cmluZztcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIENTUyBjbGFzc2VzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGhhcyBhcHBsaWVkIG9uIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9hcHBsaWVkUGFuZWxDbGFzc2VzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIG92ZXJsYXkgd2FzIHB1c2hlZCBpbiBlYWNoIGF4aXMgZHVyaW5nIHRoZSBsYXN0IHRpbWUgaXQgd2FzIHBvc2l0aW9uZWQuICovXG4gIHByaXZhdGUgX3ByZXZpb3VzUHVzaEFtb3VudDoge3g6IG51bWJlciwgeTogbnVtYmVyfSB8IG51bGw7XG5cbiAgLyoqIE9ic2VydmFibGUgc2VxdWVuY2Ugb2YgcG9zaXRpb24gY2hhbmdlcy4gKi9cbiAgcG9zaXRpb25DaGFuZ2VzOiBPYnNlcnZhYmxlPENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4gPSB0aGlzLl9wb3NpdGlvbkNoYW5nZXM7XG5cbiAgLyoqIE9yZGVyZWQgbGlzdCBvZiBwcmVmZXJyZWQgcG9zaXRpb25zLCBmcm9tIG1vc3QgdG8gbGVhc3QgZGVzaXJhYmxlLiAqL1xuICBnZXQgcG9zaXRpb25zKCk6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucztcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29ubmVjdGVkVG86IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbiwgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCwgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgcHJpdmF0ZSBfb3ZlcmxheUNvbnRhaW5lcjogT3ZlcmxheUNvbnRhaW5lcikge1xuICAgIHRoaXMuc2V0T3JpZ2luKGNvbm5lY3RlZFRvKTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGlzIHBvc2l0aW9uIHN0cmF0ZWd5IHRvIGFuIG92ZXJsYXkuICovXG4gIGF0dGFjaChvdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYgJiYgb3ZlcmxheVJlZiAhPT0gdGhpcy5fb3ZlcmxheVJlZiAmJlxuICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdUaGlzIHBvc2l0aW9uIHN0cmF0ZWd5IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYW4gb3ZlcmxheScpO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlUG9zaXRpb25zKCk7XG5cbiAgICBvdmVybGF5UmVmLmhvc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoYm91bmRpbmdCb3hDbGFzcyk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gb3ZlcmxheVJlZjtcbiAgICB0aGlzLl9ib3VuZGluZ0JveCA9IG92ZXJsYXlSZWYuaG9zdEVsZW1lbnQ7XG4gICAgdGhpcy5fcGFuZSA9IG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQ7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2lzSW5pdGlhbFJlbmRlciA9IHRydWU7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmNoYW5nZSgpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAvLyBXaGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZCwgd2Ugd2FudCB0byB0cmlnZ2VyIHRoZSBuZXh0IHJlcG9zaXRpb24gYXMgaWYgaXRcbiAgICAgIC8vIHdhcyBhbiBpbml0aWFsIHJlbmRlciwgaW4gb3JkZXIgZm9yIHRoZSBzdHJhdGVneSB0byBwaWNrIGEgbmV3IG9wdGltYWwgcG9zaXRpb24sXG4gICAgICAvLyBvdGhlcndpc2UgcG9zaXRpb24gbG9ja2luZyB3aWxsIGNhdXNlIGl0IHRvIHN0YXkgYXQgdGhlIG9sZCBvbmUuXG4gICAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSB0cnVlO1xuICAgICAgdGhpcy5hcHBseSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBvdmVybGF5IGVsZW1lbnQsIHVzaW5nIHdoaWNoZXZlciBwcmVmZXJyZWQgcG9zaXRpb24gcmVsYXRpdmVcbiAgICogdG8gdGhlIG9yaWdpbiBiZXN0IGZpdHMgb24tc2NyZWVuLlxuICAgKlxuICAgKiBUaGUgc2VsZWN0aW9uIG9mIGEgcG9zaXRpb24gZ29lcyBhcyBmb2xsb3dzOlxuICAgKiAgLSBJZiBhbnkgcG9zaXRpb25zIGZpdCBjb21wbGV0ZWx5IHdpdGhpbiB0aGUgdmlld3BvcnQgYXMtaXMsXG4gICAqICAgICAgY2hvb3NlIHRoZSBmaXJzdCBwb3NpdGlvbiB0aGF0IGRvZXMgc28uXG4gICAqICAtIElmIGZsZXhpYmxlIGRpbWVuc2lvbnMgYXJlIGVuYWJsZWQgYW5kIGF0IGxlYXN0IG9uZSBzYXRpZmllcyB0aGUgZ2l2ZW4gbWluaW11bSB3aWR0aC9oZWlnaHQsXG4gICAqICAgICAgY2hvb3NlIHRoZSBwb3NpdGlvbiB3aXRoIHRoZSBncmVhdGVzdCBhdmFpbGFibGUgc2l6ZSBtb2RpZmllZCBieSB0aGUgcG9zaXRpb25zJyB3ZWlnaHQuXG4gICAqICAtIElmIHB1c2hpbmcgaXMgZW5hYmxlZCwgdGFrZSB0aGUgcG9zaXRpb24gdGhhdCB3ZW50IG9mZi1zY3JlZW4gdGhlIGxlYXN0IGFuZCBwdXNoIGl0XG4gICAqICAgICAgb24tc2NyZWVuLlxuICAgKiAgLSBJZiBub25lIG9mIHRoZSBwcmV2aW91cyBjcml0ZXJpYSB3ZXJlIG1ldCwgdXNlIHRoZSBwb3NpdGlvbiB0aGF0IGdvZXMgb2ZmLXNjcmVlbiB0aGUgbGVhc3QuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIGFwcGx5KCk6IHZvaWQge1xuICAgIC8vIFdlIHNob3VsZG4ndCBkbyBhbnl0aGluZyBpZiB0aGUgc3RyYXRlZ3kgd2FzIGRpc3Bvc2VkIG9yIHdlJ3JlIG9uIHRoZSBzZXJ2ZXIuXG4gICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQgfHwgIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBwb3NpdGlvbiBoYXMgYmVlbiBhcHBsaWVkIGFscmVhZHkgKGUuZy4gd2hlbiB0aGUgb3ZlcmxheSB3YXMgb3BlbmVkKSBhbmQgdGhlXG4gICAgLy8gY29uc3VtZXIgb3B0ZWQgaW50byBsb2NraW5nIGluIHRoZSBwb3NpdGlvbiwgcmUtdXNlIHRoZSBvbGQgcG9zaXRpb24sIGluIG9yZGVyIHRvXG4gICAgLy8gcHJldmVudCB0aGUgb3ZlcmxheSBmcm9tIGp1bXBpbmcgYXJvdW5kLlxuICAgIGlmICghdGhpcy5faXNJbml0aWFsUmVuZGVyICYmIHRoaXMuX3Bvc2l0aW9uTG9ja2VkICYmIHRoaXMuX2xhc3RQb3NpdGlvbikge1xuICAgICAgdGhpcy5yZWFwcGx5TGFzdFBvc2l0aW9uKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYXJQYW5lbENsYXNzZXMoKTtcbiAgICB0aGlzLl9yZXNldE92ZXJsYXlFbGVtZW50U3R5bGVzKCk7XG4gICAgdGhpcy5fcmVzZXRCb3VuZGluZ0JveFN0eWxlcygpO1xuXG4gICAgLy8gV2UgbmVlZCB0aGUgYm91bmRpbmcgcmVjdHMgZm9yIHRoZSBvcmlnaW4gYW5kIHRoZSBvdmVybGF5IHRvIGRldGVybWluZSBob3cgdG8gcG9zaXRpb25cbiAgICAvLyB0aGUgb3ZlcmxheSByZWxhdGl2ZSB0byB0aGUgb3JpZ2luLlxuICAgIC8vIFdlIHVzZSB0aGUgdmlld3BvcnQgcmVjdCB0byBkZXRlcm1pbmUgd2hldGhlciBhIHBvc2l0aW9uIHdvdWxkIGdvIG9mZi1zY3JlZW4uXG4gICAgdGhpcy5fdmlld3BvcnRSZWN0ID0gdGhpcy5fZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTtcbiAgICB0aGlzLl9vcmlnaW5SZWN0ID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgIHRoaXMuX292ZXJsYXlSZWN0ID0gdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnN0IG9yaWdpblJlY3QgPSB0aGlzLl9vcmlnaW5SZWN0O1xuICAgIGNvbnN0IG92ZXJsYXlSZWN0ID0gdGhpcy5fb3ZlcmxheVJlY3Q7XG4gICAgY29uc3Qgdmlld3BvcnRSZWN0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuXG4gICAgLy8gUG9zaXRpb25zIHdoZXJlIHRoZSBvdmVybGF5IHdpbGwgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucy5cbiAgICBjb25zdCBmbGV4aWJsZUZpdHM6IEZsZXhpYmxlRml0W10gPSBbXTtcblxuICAgIC8vIEZhbGxiYWNrIGlmIG5vbmUgb2YgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuXG4gICAgbGV0IGZhbGxiYWNrOiBGYWxsYmFja1Bvc2l0aW9uIHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gR28gdGhyb3VnaCBlYWNoIG9mIHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGxvb2tpbmcgZm9yIGEgZ29vZCBmaXQuXG4gICAgLy8gSWYgYSBnb29kIGZpdCBpcyBmb3VuZCwgaXQgd2lsbCBiZSBhcHBsaWVkIGltbWVkaWF0ZWx5LlxuICAgIGZvciAobGV0IHBvcyBvZiB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMpIHtcbiAgICAgIC8vIEdldCB0aGUgZXhhY3QgKHgsIHkpIGNvb3JkaW5hdGUgZm9yIHRoZSBwb2ludC1vZi1vcmlnaW4gb24gdGhlIG9yaWdpbiBlbGVtZW50LlxuICAgICAgbGV0IG9yaWdpblBvaW50ID0gdGhpcy5fZ2V0T3JpZ2luUG9pbnQob3JpZ2luUmVjdCwgcG9zKTtcblxuICAgICAgLy8gRnJvbSB0aGF0IHBvaW50LW9mLW9yaWdpbiwgZ2V0IHRoZSBleGFjdCAoeCwgeSkgY29vcmRpbmF0ZSBmb3IgdGhlIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGVcbiAgICAgIC8vIG92ZXJsYXkgaW4gdGhpcyBwb3NpdGlvbi4gV2UgdXNlIHRoZSB0b3AtbGVmdCBjb3JuZXIgZm9yIGNhbGN1bGF0aW9ucyBhbmQgbGF0ZXIgdHJhbnNsYXRlXG4gICAgICAvLyB0aGlzIGludG8gYW4gYXBwcm9wcmlhdGUgKHRvcCwgbGVmdCwgYm90dG9tLCByaWdodCkgc3R5bGUuXG4gICAgICBsZXQgb3ZlcmxheVBvaW50ID0gdGhpcy5fZ2V0T3ZlcmxheVBvaW50KG9yaWdpblBvaW50LCBvdmVybGF5UmVjdCwgcG9zKTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGhvdyB3ZWxsIHRoZSBvdmVybGF5IHdvdWxkIGZpdCBpbnRvIHRoZSB2aWV3cG9ydCB3aXRoIHRoaXMgcG9pbnQuXG4gICAgICBsZXQgb3ZlcmxheUZpdCA9IHRoaXMuX2dldE92ZXJsYXlGaXQob3ZlcmxheVBvaW50LCBvdmVybGF5UmVjdCwgdmlld3BvcnRSZWN0LCBwb3MpO1xuXG4gICAgICAvLyBJZiB0aGUgb3ZlcmxheSwgd2l0aG91dCBhbnkgZnVydGhlciB3b3JrLCBmaXRzIGludG8gdGhlIHZpZXdwb3J0LCB1c2UgdGhpcyBwb3NpdGlvbi5cbiAgICAgIGlmIChvdmVybGF5Rml0LmlzQ29tcGxldGVseVdpdGhpblZpZXdwb3J0KSB7XG4gICAgICAgIHRoaXMuX2lzUHVzaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24ocG9zLCBvcmlnaW5Qb2ludCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIG92ZXJsYXkgaGFzIGZsZXhpYmxlIGRpbWVuc2lvbnMsIHdlIGNhbiB1c2UgdGhpcyBwb3NpdGlvblxuICAgICAgLy8gc28gbG9uZyBhcyB0aGVyZSdzIGVub3VnaCBzcGFjZSBmb3IgdGhlIG1pbmltdW0gZGltZW5zaW9ucy5cbiAgICAgIGlmICh0aGlzLl9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKG92ZXJsYXlGaXQsIG92ZXJsYXlQb2ludCwgdmlld3BvcnRSZWN0KSkge1xuICAgICAgICAvLyBTYXZlIHBvc2l0aW9ucyB3aGVyZSB0aGUgb3ZlcmxheSB3aWxsIGZpdCB3aXRoIGZsZXhpYmxlIGRpbWVuc2lvbnMuIFdlIHdpbGwgdXNlIHRoZXNlXG4gICAgICAgIC8vIGlmIG5vbmUgb2YgdGhlIHBvc2l0aW9ucyBmaXQgKndpdGhvdXQqIGZsZXhpYmxlIGRpbWVuc2lvbnMuXG4gICAgICAgIGZsZXhpYmxlRml0cy5wdXNoKHtcbiAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgIG9yaWdpbjogb3JpZ2luUG9pbnQsXG4gICAgICAgICAgb3ZlcmxheVJlY3QsXG4gICAgICAgICAgYm91bmRpbmdCb3hSZWN0OiB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luUG9pbnQsIHBvcylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBjdXJyZW50IHByZWZlcnJlZCBwb3NpdGlvbiBkb2VzIG5vdCBmaXQgb24gdGhlIHNjcmVlbiwgcmVtZW1iZXIgdGhlIHBvc2l0aW9uXG4gICAgICAvLyBpZiBpdCBoYXMgbW9yZSB2aXNpYmxlIGFyZWEgb24tc2NyZWVuIHRoYW4gd2UndmUgc2VlbiBhbmQgbW92ZSBvbnRvIHRoZSBuZXh0IHByZWZlcnJlZFxuICAgICAgLy8gcG9zaXRpb24uXG4gICAgICBpZiAoIWZhbGxiYWNrIHx8IGZhbGxiYWNrLm92ZXJsYXlGaXQudmlzaWJsZUFyZWEgPCBvdmVybGF5Rml0LnZpc2libGVBcmVhKSB7XG4gICAgICAgIGZhbGxiYWNrID0ge292ZXJsYXlGaXQsIG92ZXJsYXlQb2ludCwgb3JpZ2luUG9pbnQsIHBvc2l0aW9uOiBwb3MsIG92ZXJsYXlSZWN0fTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgYW55IHBvc2l0aW9ucyB3aGVyZSB0aGUgb3ZlcmxheSB3b3VsZCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLCBjaG9vc2UgdGhlXG4gICAgLy8gb25lIHRoYXQgaGFzIHRoZSBncmVhdGVzdCBhcmVhIGF2YWlsYWJsZSBtb2RpZmllZCBieSB0aGUgcG9zaXRpb24ncyB3ZWlnaHRcbiAgICBpZiAoZmxleGlibGVGaXRzLmxlbmd0aCkge1xuICAgICAgbGV0IGJlc3RGaXQ6IEZsZXhpYmxlRml0IHwgbnVsbCA9IG51bGw7XG4gICAgICBsZXQgYmVzdFNjb3JlID0gLTE7XG4gICAgICBmb3IgKGNvbnN0IGZpdCBvZiBmbGV4aWJsZUZpdHMpIHtcbiAgICAgICAgY29uc3Qgc2NvcmUgPVxuICAgICAgICAgICAgZml0LmJvdW5kaW5nQm94UmVjdC53aWR0aCAqIGZpdC5ib3VuZGluZ0JveFJlY3QuaGVpZ2h0ICogKGZpdC5wb3NpdGlvbi53ZWlnaHQgfHwgMSk7XG4gICAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICAgIGJlc3RGaXQgPSBmaXQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5faXNQdXNoZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24oYmVzdEZpdCEucG9zaXRpb24sIGJlc3RGaXQhLm9yaWdpbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2hlbiBub25lIG9mIHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LCB0YWtlIHRoZSBwb3NpdGlvblxuICAgIC8vIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdCBhbmQgYXR0ZW1wdCB0byBwdXNoIGl0IG9uLXNjcmVlbi5cbiAgICBpZiAodGhpcy5fY2FuUHVzaCkge1xuICAgICAgLy8gVE9ETyhqZWxib3Vybik6IGFmdGVyIHB1c2hpbmcsIHRoZSBvcGVuaW5nIFwiZGlyZWN0aW9uXCIgb2YgdGhlIG92ZXJsYXkgbWlnaHQgbm90IG1ha2Ugc2Vuc2UuXG4gICAgICB0aGlzLl9pc1B1c2hlZCA9IHRydWU7XG4gICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGZhbGxiYWNrIS5wb3NpdGlvbiwgZmFsbGJhY2shLm9yaWdpblBvaW50KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBBbGwgb3B0aW9ucyBmb3IgZ2V0dGluZyB0aGUgb3ZlcmxheSB3aXRoaW4gdGhlIHZpZXdwb3J0IGhhdmUgYmVlbiBleGhhdXN0ZWQsIHNvIGdvIHdpdGggdGhlXG4gICAgLy8gcG9zaXRpb24gdGhhdCB3ZW50IG9mZi1zY3JlZW4gdGhlIGxlYXN0LlxuICAgIHRoaXMuX2FwcGx5UG9zaXRpb24oZmFsbGJhY2shLnBvc2l0aW9uLCBmYWxsYmFjayEub3JpZ2luUG9pbnQpO1xuICB9XG5cbiAgZGV0YWNoKCk6IHZvaWQge1xuICAgIHRoaXMuX2NsZWFyUGFuZWxDbGFzc2VzKCk7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQgPSBudWxsO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqIENsZWFudXAgYWZ0ZXIgdGhlIGVsZW1lbnQgZ2V0cyBkZXN0cm95ZWQuICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2lzRGlzcG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXZSBjYW4ndCB1c2UgYF9yZXNldEJvdW5kaW5nQm94U3R5bGVzYCBoZXJlLCBiZWNhdXNlIGl0IHJlc2V0c1xuICAgIC8vIHNvbWUgcHJvcGVydGllcyB0byB6ZXJvLCByYXRoZXIgdGhhbiByZW1vdmluZyB0aGVtLlxuICAgIGlmICh0aGlzLl9ib3VuZGluZ0JveCkge1xuICAgICAgZXh0ZW5kU3R5bGVzKHRoaXMuX2JvdW5kaW5nQm94LnN0eWxlLCB7XG4gICAgICAgIHRvcDogJycsXG4gICAgICAgIGxlZnQ6ICcnLFxuICAgICAgICByaWdodDogJycsXG4gICAgICAgIGJvdHRvbTogJycsXG4gICAgICAgIGhlaWdodDogJycsXG4gICAgICAgIHdpZHRoOiAnJyxcbiAgICAgICAgYWxpZ25JdGVtczogJycsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnJyxcbiAgICAgIH0gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIHRoaXMuX3Jlc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5ob3N0RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGJvdW5kaW5nQm94Q2xhc3MpO1xuICAgIH1cblxuICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgdGhpcy5fcG9zaXRpb25DaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IHRoaXMuX2JvdW5kaW5nQm94ID0gbnVsbCE7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyByZS1hbGlnbnMgdGhlIG92ZXJsYXkgZWxlbWVudCB3aXRoIHRoZSB0cmlnZ2VyIGluIGl0cyBsYXN0IGNhbGN1bGF0ZWQgcG9zaXRpb24sXG4gICAqIGV2ZW4gaWYgYSBwb3NpdGlvbiBoaWdoZXIgaW4gdGhlIFwicHJlZmVycmVkIHBvc2l0aW9uc1wiIGxpc3Qgd291bGQgbm93IGZpdC4gVGhpc1xuICAgKiBhbGxvd3Mgb25lIHRvIHJlLWFsaWduIHRoZSBwYW5lbCB3aXRob3V0IGNoYW5naW5nIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgcGFuZWwuXG4gICAqL1xuICByZWFwcGx5TGFzdFBvc2l0aW9uKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNEaXNwb3NlZCAmJiAoIXRoaXMuX3BsYXRmb3JtIHx8IHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlcikpIHtcbiAgICAgIHRoaXMuX29yaWdpblJlY3QgPSB0aGlzLl9nZXRPcmlnaW5SZWN0KCk7XG4gICAgICB0aGlzLl9vdmVybGF5UmVjdCA9IHRoaXMuX3BhbmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB0aGlzLl92aWV3cG9ydFJlY3QgPSB0aGlzLl9nZXROYXJyb3dlZFZpZXdwb3J0UmVjdCgpO1xuXG4gICAgICBjb25zdCBsYXN0UG9zaXRpb24gPSB0aGlzLl9sYXN0UG9zaXRpb24gfHwgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zWzBdO1xuICAgICAgY29uc3Qgb3JpZ2luUG9pbnQgPSB0aGlzLl9nZXRPcmlnaW5Qb2ludCh0aGlzLl9vcmlnaW5SZWN0LCBsYXN0UG9zaXRpb24pO1xuXG4gICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGxhc3RQb3NpdGlvbiwgb3JpZ2luUG9pbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsaXN0IG9mIFNjcm9sbGFibGUgY29udGFpbmVycyB0aGF0IGhvc3QgdGhlIG9yaWdpbiBlbGVtZW50IHNvIHRoYXRcbiAgICogb24gcmVwb3NpdGlvbiB3ZSBjYW4gZXZhbHVhdGUgaWYgaXQgb3IgdGhlIG92ZXJsYXkgaGFzIGJlZW4gY2xpcHBlZCBvciBvdXRzaWRlIHZpZXcuIEV2ZXJ5XG4gICAqIFNjcm9sbGFibGUgbXVzdCBiZSBhbiBhbmNlc3RvciBlbGVtZW50IG9mIHRoZSBzdHJhdGVneSdzIG9yaWdpbiBlbGVtZW50LlxuICAgKi9cbiAgd2l0aFNjcm9sbGFibGVDb250YWluZXJzKHNjcm9sbGFibGVzOiBDZGtTY3JvbGxhYmxlW10pOiB0aGlzIHtcbiAgICB0aGlzLl9zY3JvbGxhYmxlcyA9IHNjcm9sbGFibGVzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgbmV3IHByZWZlcnJlZCBwb3NpdGlvbnMuXG4gICAqIEBwYXJhbSBwb3NpdGlvbnMgTGlzdCBvZiBwb3NpdGlvbnMgb3B0aW9ucyBmb3IgdGhpcyBvdmVybGF5LlxuICAgKi9cbiAgd2l0aFBvc2l0aW9ucyhwb3NpdGlvbnM6IENvbm5lY3RlZFBvc2l0aW9uW10pOiB0aGlzIHtcbiAgICB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMgPSBwb3NpdGlvbnM7XG5cbiAgICAvLyBJZiB0aGUgbGFzdCBjYWxjdWxhdGVkIHBvc2l0aW9uIG9iamVjdCBpc24ndCBwYXJ0IG9mIHRoZSBwb3NpdGlvbnMgYW55bW9yZSwgY2xlYXJcbiAgICAvLyBpdCBpbiBvcmRlciB0byBhdm9pZCBpdCBiZWluZyBwaWNrZWQgdXAgaWYgdGhlIGNvbnN1bWVyIHRyaWVzIHRvIHJlLWFwcGx5LlxuICAgIGlmIChwb3NpdGlvbnMuaW5kZXhPZih0aGlzLl9sYXN0UG9zaXRpb24hKSA9PT0gLTEpIHtcbiAgICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsaWRhdGVQb3NpdGlvbnMoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBtaW5pbXVtIGRpc3RhbmNlIHRoZSBvdmVybGF5IG1heSBiZSBwb3NpdGlvbmVkIHRvIHRoZSBlZGdlIG9mIHRoZSB2aWV3cG9ydC5cbiAgICogQHBhcmFtIG1hcmdpbiBSZXF1aXJlZCBtYXJnaW4gYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIHZpZXdwb3J0IGVkZ2UgaW4gcGl4ZWxzLlxuICAgKi9cbiAgd2l0aFZpZXdwb3J0TWFyZ2luKG1hcmdpbjogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5fdmlld3BvcnRNYXJnaW4gPSBtYXJnaW47XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5J3Mgd2lkdGggYW5kIGhlaWdodCBjYW4gYmUgY29uc3RyYWluZWQgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIHdpdGhGbGV4aWJsZURpbWVuc2lvbnMoZmxleGlibGVEaW1lbnNpb25zID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX2hhc0ZsZXhpYmxlRGltZW5zaW9ucyA9IGZsZXhpYmxlRGltZW5zaW9ucztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgYWZ0ZXIgdGhlIGluaXRpYWwgb3BlbiB2aWEgZmxleGlibGUgd2lkdGgvaGVpZ2h0LiAqL1xuICB3aXRoR3Jvd0FmdGVyT3Blbihncm93QWZ0ZXJPcGVuID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX2dyb3dBZnRlck9wZW4gPSBncm93QWZ0ZXJPcGVuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSBjYW4gYmUgcHVzaGVkIG9uLXNjcmVlbiBpZiBub25lIG9mIHRoZSBwcm92aWRlZCBwb3NpdGlvbnMgZml0LiAqL1xuICB3aXRoUHVzaChjYW5QdXNoID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX2NhblB1c2ggPSBjYW5QdXNoO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSdzIHBvc2l0aW9uIHNob3VsZCBiZSBsb2NrZWQgaW4gYWZ0ZXIgaXQgaXMgcG9zaXRpb25lZFxuICAgKiBpbml0aWFsbHkuIFdoZW4gYW4gb3ZlcmxheSBpcyBsb2NrZWQgaW4sIGl0IHdvbid0IGF0dGVtcHQgdG8gcmVwb3NpdGlvbiBpdHNlbGZcbiAgICogd2hlbiB0aGUgcG9zaXRpb24gaXMgcmUtYXBwbGllZCAoZS5nLiB3aGVuIHRoZSB1c2VyIHNjcm9sbHMgYXdheSkuXG4gICAqIEBwYXJhbSBpc0xvY2tlZCBXaGV0aGVyIHRoZSBvdmVybGF5IHNob3VsZCBsb2NrZWQgaW4uXG4gICAqL1xuICB3aXRoTG9ja2VkUG9zaXRpb24oaXNMb2NrZWQgPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fcG9zaXRpb25Mb2NrZWQgPSBpc0xvY2tlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4sIHJlbGF0aXZlIHRvIHdoaWNoIHRvIHBvc2l0aW9uIHRoZSBvdmVybGF5LlxuICAgKiBVc2luZyBhbiBlbGVtZW50IG9yaWdpbiBpcyB1c2VmdWwgZm9yIGJ1aWxkaW5nIGNvbXBvbmVudHMgdGhhdCBuZWVkIHRvIGJlIHBvc2l0aW9uZWRcbiAgICogcmVsYXRpdmVseSB0byBhIHRyaWdnZXIgKGUuZy4gZHJvcGRvd24gbWVudXMgb3IgdG9vbHRpcHMpLCB3aGVyZWFzIHVzaW5nIGEgcG9pbnQgY2FuIGJlXG4gICAqIHVzZWQgZm9yIGNhc2VzIGxpa2UgY29udGV4dHVhbCBtZW51cyB3aGljaCBvcGVuIHJlbGF0aXZlIHRvIHRoZSB1c2VyJ3MgcG9pbnRlci5cbiAgICogQHBhcmFtIG9yaWdpbiBSZWZlcmVuY2UgdG8gdGhlIG5ldyBvcmlnaW4uXG4gICAqL1xuICBzZXRPcmlnaW4ob3JpZ2luOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4pOiB0aGlzIHtcbiAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGVmYXVsdCBvZmZzZXQgZm9yIHRoZSBvdmVybGF5J3MgY29ubmVjdGlvbiBwb2ludCBvbiB0aGUgeC1heGlzLlxuICAgKiBAcGFyYW0gb2Zmc2V0IE5ldyBvZmZzZXQgaW4gdGhlIFggYXhpcy5cbiAgICovXG4gIHdpdGhEZWZhdWx0T2Zmc2V0WChvZmZzZXQ6IG51bWJlcik6IHRoaXMge1xuICAgIHRoaXMuX29mZnNldFggPSBvZmZzZXQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGVmYXVsdCBvZmZzZXQgZm9yIHRoZSBvdmVybGF5J3MgY29ubmVjdGlvbiBwb2ludCBvbiB0aGUgeS1heGlzLlxuICAgKiBAcGFyYW0gb2Zmc2V0IE5ldyBvZmZzZXQgaW4gdGhlIFkgYXhpcy5cbiAgICovXG4gIHdpdGhEZWZhdWx0T2Zmc2V0WShvZmZzZXQ6IG51bWJlcik6IHRoaXMge1xuICAgIHRoaXMuX29mZnNldFkgPSBvZmZzZXQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGF0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBzaG91bGQgc2V0IGEgYHRyYW5zZm9ybS1vcmlnaW5gIG9uIHNvbWUgZWxlbWVudHNcbiAgICogaW5zaWRlIHRoZSBvdmVybGF5LCBkZXBlbmRpbmcgb24gdGhlIGN1cnJlbnQgcG9zaXRpb24gdGhhdCBpcyBiZWluZyBhcHBsaWVkLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCBmb3IgdGhlIGNhc2VzIHdoZXJlIHRoZSBvcmlnaW4gb2YgYW4gYW5pbWF0aW9uIGNhbiBjaGFuZ2UgZGVwZW5kaW5nIG9uIHRoZVxuICAgKiBhbGlnbm1lbnQgb2YgdGhlIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBzZWxlY3RvciBDU1Mgc2VsZWN0b3IgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZmluZCB0aGUgdGFyZ2V0XG4gICAqICAgIGVsZW1lbnRzIG9udG8gd2hpY2ggdG8gc2V0IHRoZSB0cmFuc2Zvcm0gb3JpZ2luLlxuICAgKi9cbiAgd2l0aFRyYW5zZm9ybU9yaWdpbk9uKHNlbGVjdG9yOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLl90cmFuc2Zvcm1PcmlnaW5TZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlICh4LCB5KSBjb29yZGluYXRlIG9mIGEgY29ubmVjdGlvbiBwb2ludCBvbiB0aGUgb3JpZ2luIGJhc2VkIG9uIGEgcmVsYXRpdmUgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9nZXRPcmlnaW5Qb2ludChvcmlnaW5SZWN0OiBEaW1lbnNpb25zLCBwb3M6IENvbm5lY3RlZFBvc2l0aW9uKTogUG9pbnQge1xuICAgIGxldCB4OiBudW1iZXI7XG4gICAgaWYgKHBvcy5vcmlnaW5YID09ICdjZW50ZXInKSB7XG4gICAgICAvLyBOb3RlOiB3aGVuIGNlbnRlcmluZyB3ZSBzaG91bGQgYWx3YXlzIHVzZSB0aGUgYGxlZnRgXG4gICAgICAvLyBvZmZzZXQsIG90aGVyd2lzZSB0aGUgcG9zaXRpb24gd2lsbCBiZSB3cm9uZyBpbiBSVEwuXG4gICAgICB4ID0gb3JpZ2luUmVjdC5sZWZ0ICsgKG9yaWdpblJlY3Qud2lkdGggLyAyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IG9yaWdpblJlY3QucmlnaHQgOiBvcmlnaW5SZWN0LmxlZnQ7XG4gICAgICBjb25zdCBlbmRYID0gdGhpcy5faXNSdGwoKSA/IG9yaWdpblJlY3QubGVmdCA6IG9yaWdpblJlY3QucmlnaHQ7XG4gICAgICB4ID0gcG9zLm9yaWdpblggPT0gJ3N0YXJ0JyA/IHN0YXJ0WCA6IGVuZFg7XG4gICAgfVxuXG4gICAgbGV0IHk6IG51bWJlcjtcbiAgICBpZiAocG9zLm9yaWdpblkgPT0gJ2NlbnRlcicpIHtcbiAgICAgIHkgPSBvcmlnaW5SZWN0LnRvcCArIChvcmlnaW5SZWN0LmhlaWdodCAvIDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB5ID0gcG9zLm9yaWdpblkgPT0gJ3RvcCcgPyBvcmlnaW5SZWN0LnRvcCA6IG9yaWdpblJlY3QuYm90dG9tO1xuICAgIH1cblxuICAgIHJldHVybiB7eCwgeX07XG4gIH1cblxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSAoeCwgeSkgY29vcmRpbmF0ZSBvZiB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIHRoZSBvdmVybGF5IGdpdmVuIGEgZ2l2ZW4gcG9zaXRpb24gYW5kXG4gICAqIG9yaWdpbiBwb2ludCB0byB3aGljaCB0aGUgb3ZlcmxheSBzaG91bGQgYmUgY29ubmVjdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvaW50KFxuICAgICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgICAgb3ZlcmxheVJlY3Q6IERpbWVuc2lvbnMsXG4gICAgICBwb3M6IENvbm5lY3RlZFBvc2l0aW9uKTogUG9pbnQge1xuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSAob3ZlcmxheVN0YXJ0WCwgb3ZlcmxheVN0YXJ0WSksIHRoZSBzdGFydCBvZiB0aGVcbiAgICAvLyBwb3RlbnRpYWwgb3ZlcmxheSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgb3JpZ2luIHBvaW50LlxuICAgIGxldCBvdmVybGF5U3RhcnRYOiBudW1iZXI7XG4gICAgaWYgKHBvcy5vdmVybGF5WCA9PSAnY2VudGVyJykge1xuICAgICAgb3ZlcmxheVN0YXJ0WCA9IC1vdmVybGF5UmVjdC53aWR0aCAvIDI7XG4gICAgfSBlbHNlIGlmIChwb3Mub3ZlcmxheVggPT09ICdzdGFydCcpIHtcbiAgICAgIG92ZXJsYXlTdGFydFggPSB0aGlzLl9pc1J0bCgpID8gLW92ZXJsYXlSZWN0LndpZHRoIDogMDtcbiAgICB9IGVsc2Uge1xuICAgICAgb3ZlcmxheVN0YXJ0WCA9IHRoaXMuX2lzUnRsKCkgPyAwIDogLW92ZXJsYXlSZWN0LndpZHRoO1xuICAgIH1cblxuICAgIGxldCBvdmVybGF5U3RhcnRZOiBudW1iZXI7XG4gICAgaWYgKHBvcy5vdmVybGF5WSA9PSAnY2VudGVyJykge1xuICAgICAgb3ZlcmxheVN0YXJ0WSA9IC1vdmVybGF5UmVjdC5oZWlnaHQgLyAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVybGF5U3RhcnRZID0gcG9zLm92ZXJsYXlZID09ICd0b3AnID8gMCA6IC1vdmVybGF5UmVjdC5oZWlnaHQ7XG4gICAgfVxuXG4gICAgLy8gVGhlICh4LCB5KSBjb29yZGluYXRlcyBvZiB0aGUgb3ZlcmxheS5cbiAgICByZXR1cm4ge1xuICAgICAgeDogb3JpZ2luUG9pbnQueCArIG92ZXJsYXlTdGFydFgsXG4gICAgICB5OiBvcmlnaW5Qb2ludC55ICsgb3ZlcmxheVN0YXJ0WSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEdldHMgaG93IHdlbGwgYW4gb3ZlcmxheSBhdCB0aGUgZ2l2ZW4gcG9pbnQgd2lsbCBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheUZpdChwb2ludDogUG9pbnQsIHJhd092ZXJsYXlSZWN0OiBEaW1lbnNpb25zLCB2aWV3cG9ydDogRGltZW5zaW9ucyxcbiAgICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiBPdmVybGF5Rml0IHtcblxuICAgIC8vIFJvdW5kIHRoZSBvdmVybGF5IHJlY3Qgd2hlbiBjb21wYXJpbmcgYWdhaW5zdCB0aGVcbiAgICAvLyB2aWV3cG9ydCwgYmVjYXVzZSB0aGUgdmlld3BvcnQgaXMgYWx3YXlzIHJvdW5kZWQuXG4gICAgY29uc3Qgb3ZlcmxheSA9IGdldFJvdW5kZWRCb3VuZGluZ0NsaWVudFJlY3QocmF3T3ZlcmxheVJlY3QpO1xuICAgIGxldCB7eCwgeX0gPSBwb2ludDtcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIC8vIEFjY291bnQgZm9yIHRoZSBvZmZzZXRzIHNpbmNlIHRoZXkgY291bGQgcHVzaCB0aGUgb3ZlcmxheSBvdXQgb2YgdGhlIHZpZXdwb3J0LlxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB4ICs9IG9mZnNldFg7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldFkpIHtcbiAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvLyBIb3cgbXVjaCB0aGUgb3ZlcmxheSB3b3VsZCBvdmVyZmxvdyBhdCB0aGlzIHBvc2l0aW9uLCBvbiBlYWNoIHNpZGUuXG4gICAgbGV0IGxlZnRPdmVyZmxvdyA9IDAgLSB4O1xuICAgIGxldCByaWdodE92ZXJmbG93ID0gKHggKyBvdmVybGF5LndpZHRoKSAtIHZpZXdwb3J0LndpZHRoO1xuICAgIGxldCB0b3BPdmVyZmxvdyA9IDAgLSB5O1xuICAgIGxldCBib3R0b21PdmVyZmxvdyA9ICh5ICsgb3ZlcmxheS5oZWlnaHQpIC0gdmlld3BvcnQuaGVpZ2h0O1xuXG4gICAgLy8gVmlzaWJsZSBwYXJ0cyBvZiB0aGUgZWxlbWVudCBvbiBlYWNoIGF4aXMuXG4gICAgbGV0IHZpc2libGVXaWR0aCA9IHRoaXMuX3N1YnRyYWN0T3ZlcmZsb3dzKG92ZXJsYXkud2lkdGgsIGxlZnRPdmVyZmxvdywgcmlnaHRPdmVyZmxvdyk7XG4gICAgbGV0IHZpc2libGVIZWlnaHQgPSB0aGlzLl9zdWJ0cmFjdE92ZXJmbG93cyhvdmVybGF5LmhlaWdodCwgdG9wT3ZlcmZsb3csIGJvdHRvbU92ZXJmbG93KTtcbiAgICBsZXQgdmlzaWJsZUFyZWEgPSB2aXNpYmxlV2lkdGggKiB2aXNpYmxlSGVpZ2h0O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZpc2libGVBcmVhLFxuICAgICAgaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQ6IChvdmVybGF5LndpZHRoICogb3ZlcmxheS5oZWlnaHQpID09PSB2aXNpYmxlQXJlYSxcbiAgICAgIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogdmlzaWJsZUhlaWdodCA9PT0gb3ZlcmxheS5oZWlnaHQsXG4gICAgICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogdmlzaWJsZVdpZHRoID09IG92ZXJsYXkud2lkdGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCB3aGVuIGl0IG1heSByZXNpemUgZWl0aGVyIGl0cyB3aWR0aCBvciBoZWlnaHQuXG4gICAqIEBwYXJhbSBmaXQgSG93IHdlbGwgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvaW50IFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSBnZW9tZXRyeSBvZiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKGZpdDogT3ZlcmxheUZpdCwgcG9pbnQ6IFBvaW50LCB2aWV3cG9ydDogRGltZW5zaW9ucykge1xuICAgIGlmICh0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IHZpZXdwb3J0LmJvdHRvbSAtIHBvaW50Lnk7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gcG9pbnQueDtcbiAgICAgIGNvbnN0IG1pbkhlaWdodCA9IGdldFBpeGVsVmFsdWUodGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5taW5IZWlnaHQpO1xuICAgICAgY29uc3QgbWluV2lkdGggPSBnZXRQaXhlbFZhbHVlKHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWluV2lkdGgpO1xuXG4gICAgICBjb25zdCB2ZXJ0aWNhbEZpdCA9IGZpdC5maXRzSW5WaWV3cG9ydFZlcnRpY2FsbHkgfHxcbiAgICAgICAgICAobWluSGVpZ2h0ICE9IG51bGwgJiYgbWluSGVpZ2h0IDw9IGF2YWlsYWJsZUhlaWdodCk7XG4gICAgICBjb25zdCBob3Jpem9udGFsRml0ID0gZml0LmZpdHNJblZpZXdwb3J0SG9yaXpvbnRhbGx5IHx8XG4gICAgICAgICAgKG1pbldpZHRoICE9IG51bGwgJiYgbWluV2lkdGggPD0gYXZhaWxhYmxlV2lkdGgpO1xuXG4gICAgICByZXR1cm4gdmVydGljYWxGaXQgJiYgaG9yaXpvbnRhbEZpdDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBvaW50IGF0IHdoaWNoIHRoZSBvdmVybGF5IGNhbiBiZSBcInB1c2hlZFwiIG9uLXNjcmVlbi4gSWYgdGhlIG92ZXJsYXkgaXMgbGFyZ2VyIHRoYW5cbiAgICogdGhlIHZpZXdwb3J0LCB0aGUgdG9wLWxlZnQgY29ybmVyIHdpbGwgYmUgcHVzaGVkIG9uLXNjcmVlbiAod2l0aCBvdmVyZmxvdyBvY2N1cmluZyBvbiB0aGVcbiAgICogcmlnaHQgYW5kIGJvdHRvbSkuXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydCBTdGFydGluZyBwb2ludCBmcm9tIHdoaWNoIHRoZSBvdmVybGF5IGlzIHB1c2hlZC5cbiAgICogQHBhcmFtIG92ZXJsYXkgRGltZW5zaW9ucyBvZiB0aGUgb3ZlcmxheS5cbiAgICogQHBhcmFtIHNjcm9sbFBvc2l0aW9uIEN1cnJlbnQgdmlld3BvcnQgc2Nyb2xsIHBvc2l0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgcG9pbnQgYXQgd2hpY2ggdG8gcG9zaXRpb24gdGhlIG92ZXJsYXkgYWZ0ZXIgcHVzaGluZy4gVGhpcyBpcyBlZmZlY3RpdmVseSBhIG5ld1xuICAgKiAgICAgb3JpZ2luUG9pbnQuXG4gICAqL1xuICBwcml2YXRlIF9wdXNoT3ZlcmxheU9uU2NyZWVuKHN0YXJ0OiBQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdPdmVybGF5UmVjdDogRGltZW5zaW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbjogVmlld3BvcnRTY3JvbGxQb3NpdGlvbik6IFBvaW50IHtcbiAgICAvLyBJZiB0aGUgcG9zaXRpb24gaXMgbG9ja2VkIGFuZCB3ZSd2ZSBwdXNoZWQgdGhlIG92ZXJsYXkgYWxyZWFkeSwgcmV1c2UgdGhlIHByZXZpb3VzIHB1c2hcbiAgICAvLyBhbW91bnQsIHJhdGhlciB0aGFuIHB1c2hpbmcgaXQgYWdhaW4uIElmIHdlIHdlcmUgdG8gY29udGludWUgcHVzaGluZywgdGhlIGVsZW1lbnQgd291bGRcbiAgICAvLyByZW1haW4gaW4gdGhlIHZpZXdwb3J0LCB3aGljaCBnb2VzIGFnYWluc3QgdGhlIGV4cGVjdGF0aW9ucyB3aGVuIHBvc2l0aW9uIGxvY2tpbmcgaXMgZW5hYmxlZC5cbiAgICBpZiAodGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ICYmIHRoaXMuX3Bvc2l0aW9uTG9ja2VkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBzdGFydC54ICsgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50LngsXG4gICAgICAgIHk6IHN0YXJ0LnkgKyB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQueVxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBSb3VuZCB0aGUgb3ZlcmxheSByZWN0IHdoZW4gY29tcGFyaW5nIGFnYWluc3QgdGhlXG4gICAgLy8gdmlld3BvcnQsIGJlY2F1c2UgdGhlIHZpZXdwb3J0IGlzIGFsd2F5cyByb3VuZGVkLlxuICAgIGNvbnN0IG92ZXJsYXkgPSBnZXRSb3VuZGVkQm91bmRpbmdDbGllbnRSZWN0KHJhd092ZXJsYXlSZWN0KTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMuX3ZpZXdwb3J0UmVjdDtcblxuICAgIC8vIERldGVybWluZSBob3cgbXVjaCB0aGUgb3ZlcmxheSBnb2VzIG91dHNpZGUgdGhlIHZpZXdwb3J0IG9uIGVhY2hcbiAgICAvLyBzaWRlLCB3aGljaCB3ZSdsbCB1c2UgdG8gZGVjaWRlIHdoaWNoIGRpcmVjdGlvbiB0byBwdXNoIGl0LlxuICAgIGNvbnN0IG92ZXJmbG93UmlnaHQgPSBNYXRoLm1heChzdGFydC54ICsgb3ZlcmxheS53aWR0aCAtIHZpZXdwb3J0LndpZHRoLCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd0JvdHRvbSA9IE1hdGgubWF4KHN0YXJ0LnkgKyBvdmVybGF5LmhlaWdodCAtIHZpZXdwb3J0LmhlaWdodCwgMCk7XG4gICAgY29uc3Qgb3ZlcmZsb3dUb3AgPSBNYXRoLm1heCh2aWV3cG9ydC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3AgLSBzdGFydC55LCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd0xlZnQgPSBNYXRoLm1heCh2aWV3cG9ydC5sZWZ0IC0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIHN0YXJ0LngsIDApO1xuXG4gICAgLy8gQW1vdW50IGJ5IHdoaWNoIHRvIHB1c2ggdGhlIG92ZXJsYXkgaW4gZWFjaCBheGlzIHN1Y2ggdGhhdCBpdCByZW1haW5zIG9uLXNjcmVlbi5cbiAgICBsZXQgcHVzaFggPSAwO1xuICAgIGxldCBwdXNoWSA9IDA7XG5cbiAgICAvLyBJZiB0aGUgb3ZlcmxheSBmaXRzIGNvbXBsZXRlbHkgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIHZpZXdwb3J0LCBwdXNoIGl0IGZyb20gd2hpY2hldmVyXG4gICAgLy8gZGlyZWN0aW9uIGlzIGdvZXMgb2ZmLXNjcmVlbi4gT3RoZXJ3aXNlLCBwdXNoIHRoZSB0b3AtbGVmdCBjb3JuZXIgc3VjaCB0aGF0IGl0cyBpbiB0aGVcbiAgICAvLyB2aWV3cG9ydCBhbmQgYWxsb3cgZm9yIHRoZSB0cmFpbGluZyBlbmQgb2YgdGhlIG92ZXJsYXkgdG8gZ28gb3V0IG9mIGJvdW5kcy5cbiAgICBpZiAob3ZlcmxheS53aWR0aCA8PSB2aWV3cG9ydC53aWR0aCkge1xuICAgICAgcHVzaFggPSBvdmVyZmxvd0xlZnQgfHwgLW92ZXJmbG93UmlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hYID0gc3RhcnQueCA8IHRoaXMuX3ZpZXdwb3J0TWFyZ2luID8gKHZpZXdwb3J0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0KSAtIHN0YXJ0LnggOiAwO1xuICAgIH1cblxuICAgIGlmIChvdmVybGF5LmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHtcbiAgICAgIHB1c2hZID0gb3ZlcmZsb3dUb3AgfHwgLW92ZXJmbG93Qm90dG9tO1xuICAgIH0gZWxzZSB7XG4gICAgICBwdXNoWSA9IHN0YXJ0LnkgPCB0aGlzLl92aWV3cG9ydE1hcmdpbiA/ICh2aWV3cG9ydC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3ApIC0gc3RhcnQueSA6IDA7XG4gICAgfVxuXG4gICAgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ID0ge3g6IHB1c2hYLCB5OiBwdXNoWX07XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogc3RhcnQueCArIHB1c2hYLFxuICAgICAgeTogc3RhcnQueSArIHB1c2hZLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGNvbXB1dGVkIHBvc2l0aW9uIHRvIHRoZSBvdmVybGF5IGFuZCBlbWl0cyBhIHBvc2l0aW9uIGNoYW5nZS5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBwcmVmZXJlbmNlXG4gICAqIEBwYXJhbSBvcmlnaW5Qb2ludCBUaGUgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHdoZXJlIHRoZSBvdmVybGF5IGlzIGNvbm5lY3RlZC5cbiAgICovXG4gIHByaXZhdGUgX2FwcGx5UG9zaXRpb24ocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLCBvcmlnaW5Qb2ludDogUG9pbnQpIHtcbiAgICB0aGlzLl9zZXRUcmFuc2Zvcm1PcmlnaW4ocG9zaXRpb24pO1xuICAgIHRoaXMuX3NldE92ZXJsYXlFbGVtZW50U3R5bGVzKG9yaWdpblBvaW50LCBwb3NpdGlvbik7XG4gICAgdGhpcy5fc2V0Qm91bmRpbmdCb3hTdHlsZXMob3JpZ2luUG9pbnQsIHBvc2l0aW9uKTtcblxuICAgIGlmIChwb3NpdGlvbi5wYW5lbENsYXNzKSB7XG4gICAgICB0aGlzLl9hZGRQYW5lbENsYXNzZXMocG9zaXRpb24ucGFuZWxDbGFzcyk7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSB0aGUgbGFzdCBjb25uZWN0ZWQgcG9zaXRpb24gaW4gY2FzZSB0aGUgcG9zaXRpb24gbmVlZHMgdG8gYmUgcmUtY2FsY3VsYXRlZC5cbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBwb3NpdGlvbjtcblxuICAgIC8vIE5vdGlmeSB0aGF0IHRoZSBwb3NpdGlvbiBoYXMgYmVlbiBjaGFuZ2VkIGFsb25nIHdpdGggaXRzIGNoYW5nZSBwcm9wZXJ0aWVzLlxuICAgIC8vIFdlIG9ubHkgZW1pdCBpZiB3ZSd2ZSBnb3QgYW55IHN1YnNjcmlwdGlvbnMsIGJlY2F1c2UgdGhlIHNjcm9sbCB2aXNpYmlsaXR5XG4gICAgLy8gY2FsY3VsY2F0aW9ucyBjYW4gYmUgc29tZXdoYXQgZXhwZW5zaXZlLlxuICAgIGlmICh0aGlzLl9wb3NpdGlvbkNoYW5nZXMub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgc2Nyb2xsYWJsZVZpZXdQcm9wZXJ0aWVzID0gdGhpcy5fZ2V0U2Nyb2xsVmlzaWJpbGl0eSgpO1xuICAgICAgY29uc3QgY2hhbmdlRXZlbnQgPSBuZXcgQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uLCBzY3JvbGxhYmxlVmlld1Byb3BlcnRpZXMpO1xuICAgICAgdGhpcy5fcG9zaXRpb25DaGFuZ2VzLm5leHQoY2hhbmdlRXZlbnQpO1xuICAgIH1cblxuICAgIHRoaXMuX2lzSW5pdGlhbFJlbmRlciA9IGZhbHNlO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIHRyYW5zZm9ybSBvcmlnaW4gYmFzZWQgb24gdGhlIGNvbmZpZ3VyZWQgc2VsZWN0b3IgYW5kIHRoZSBwYXNzZWQtaW4gcG9zaXRpb24uICAqL1xuICBwcml2YXRlIF9zZXRUcmFuc2Zvcm1PcmlnaW4ocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0aGlzLl90cmFuc2Zvcm1PcmlnaW5TZWxlY3Rvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94IS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yKTtcbiAgICBsZXQgeE9yaWdpbjogJ2xlZnQnIHwgJ3JpZ2h0JyB8ICdjZW50ZXInO1xuICAgIGxldCB5T3JpZ2luOiAndG9wJyB8ICdib3R0b20nIHwgJ2NlbnRlcicgPSBwb3NpdGlvbi5vdmVybGF5WTtcblxuICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgIHhPcmlnaW4gPSAnY2VudGVyJztcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2lzUnRsKCkpIHtcbiAgICAgIHhPcmlnaW4gPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHhPcmlnaW4gPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgZWxlbWVudHNbaV0uc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gYCR7eE9yaWdpbn0gJHt5T3JpZ2lufWA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBvdmVybGF5J3Mgc2l6aW5nIGNvbnRhaW5lci5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZG9lcyBubyBtZWFzdXJpbmcgYW5kIGFwcGxpZXMgbm8gc3R5bGVzIHNvIHRoYXQgd2UgY2FuIGNoZWFwbHkgY29tcHV0ZSB0aGVcbiAgICogYm91bmRzIGZvciBhbGwgcG9zaXRpb25zIGFuZCBjaG9vc2UgdGhlIGJlc3QgZml0IGJhc2VkIG9uIHRoZXNlIHJlc3VsdHMuXG4gICAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luOiBQb2ludCwgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKTogQm91bmRpbmdCb3hSZWN0IHtcbiAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMuX3ZpZXdwb3J0UmVjdDtcbiAgICBjb25zdCBpc1J0bCA9IHRoaXMuX2lzUnRsKCk7XG4gICAgbGV0IGhlaWdodDogbnVtYmVyLCB0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXI7XG5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICd0b3AnKSB7XG4gICAgICAvLyBPdmVybGF5IGlzIG9wZW5pbmcgXCJkb3dud2FyZFwiIGFuZCB0aHVzIGlzIGJvdW5kIGJ5IHRoZSBib3R0b20gdmlld3BvcnQgZWRnZS5cbiAgICAgIHRvcCA9IG9yaWdpbi55O1xuICAgICAgaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0IC0gdG9wICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIC8vIE92ZXJsYXkgaXMgb3BlbmluZyBcInVwd2FyZFwiIGFuZCB0aHVzIGlzIGJvdW5kIGJ5IHRoZSB0b3Agdmlld3BvcnQgZWRnZS4gV2UgbmVlZCB0byBhZGRcbiAgICAgIC8vIHRoZSB2aWV3cG9ydCBtYXJnaW4gYmFjayBpbiwgYmVjYXVzZSB0aGUgdmlld3BvcnQgcmVjdCBpcyBuYXJyb3dlZCBkb3duIHRvIHJlbW92ZSB0aGVcbiAgICAgIC8vIG1hcmdpbiwgd2hlcmVhcyB0aGUgYG9yaWdpbmAgcG9zaXRpb24gaXMgY2FsY3VsYXRlZCBiYXNlZCBvbiBpdHMgYENsaWVudFJlY3RgLlxuICAgICAgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0IC0gb3JpZ2luLnkgKyB0aGlzLl92aWV3cG9ydE1hcmdpbiAqIDI7XG4gICAgICBoZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQgLSBib3R0b20gKyB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgbmVpdGhlciB0b3Agbm9yIGJvdHRvbSwgaXQgbWVhbnMgdGhhdCB0aGUgb3ZlcmxheSBpcyB2ZXJ0aWNhbGx5IGNlbnRlcmVkIG9uIHRoZVxuICAgICAgLy8gb3JpZ2luIHBvaW50LiBOb3RlIHRoYXQgd2Ugd2FudCB0aGUgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LCByYXRoZXIgdGhhblxuICAgICAgLy8gdGhlIHBhZ2UsIHdoaWNoIGlzIHdoeSB3ZSBkb24ndCB1c2Ugc29tZXRoaW5nIGxpa2UgYHZpZXdwb3J0LmJvdHRvbSAtIG9yaWdpbi55YCBhbmRcbiAgICAgIC8vIGBvcmlnaW4ueSAtIHZpZXdwb3J0LnRvcGAuXG4gICAgICBjb25zdCBzbWFsbGVzdERpc3RhbmNlVG9WaWV3cG9ydEVkZ2UgPVxuICAgICAgICAgIE1hdGgubWluKHZpZXdwb3J0LmJvdHRvbSAtIG9yaWdpbi55ICsgdmlld3BvcnQudG9wLCBvcmlnaW4ueSk7XG5cbiAgICAgIGNvbnN0IHByZXZpb3VzSGVpZ2h0ID0gdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQ7XG5cbiAgICAgIGhlaWdodCA9IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSAqIDI7XG4gICAgICB0b3AgPSBvcmlnaW4ueSAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKGhlaWdodCA+IHByZXZpb3VzSGVpZ2h0ICYmICF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgIXRoaXMuX2dyb3dBZnRlck9wZW4pIHtcbiAgICAgICAgdG9wID0gb3JpZ2luLnkgLSAocHJldmlvdXNIZWlnaHQgLyAyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgb3ZlcmxheSBpcyBvcGVuaW5nICdyaWdodC13YXJkJyAodGhlIGNvbnRlbnQgZmxvd3MgdG8gdGhlIHJpZ2h0KS5cbiAgICBjb25zdCBpc0JvdW5kZWRCeVJpZ2h0Vmlld3BvcnRFZGdlID1cbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnICYmICFpc1J0bCkgfHxcbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyAmJiBpc1J0bCk7XG5cbiAgICAvLyBUaGUgb3ZlcmxheSBpcyBvcGVuaW5nICdsZWZ0LXdhcmQnICh0aGUgY29udGVudCBmbG93cyB0byB0aGUgbGVmdCkuXG4gICAgY29uc3QgaXNCb3VuZGVkQnlMZWZ0Vmlld3BvcnRFZGdlID1cbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyAmJiAhaXNSdGwpIHx8XG4gICAgICAgIChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyAmJiBpc1J0bCk7XG5cbiAgICBsZXQgd2lkdGg6IG51bWJlciwgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyO1xuXG4gICAgaWYgKGlzQm91bmRlZEJ5TGVmdFZpZXdwb3J0RWRnZSkge1xuICAgICAgcmlnaHQgPSB2aWV3cG9ydC53aWR0aCAtIG9yaWdpbi54ICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgICB3aWR0aCA9IG9yaWdpbi54IC0gdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIGlmIChpc0JvdW5kZWRCeVJpZ2h0Vmlld3BvcnRFZGdlKSB7XG4gICAgICBsZWZ0ID0gb3JpZ2luLng7XG4gICAgICB3aWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gb3JpZ2luLng7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5laXRoZXIgc3RhcnQgbm9yIGVuZCwgaXQgbWVhbnMgdGhhdCB0aGUgb3ZlcmxheSBpcyBob3Jpem9udGFsbHkgY2VudGVyZWQgb24gdGhlXG4gICAgICAvLyBvcmlnaW4gcG9pbnQuIE5vdGUgdGhhdCB3ZSB3YW50IHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQsIHJhdGhlciB0aGFuXG4gICAgICAvLyB0aGUgcGFnZSwgd2hpY2ggaXMgd2h5IHdlIGRvbid0IHVzZSBzb21ldGhpbmcgbGlrZSBgdmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueGAgYW5kXG4gICAgICAvLyBgb3JpZ2luLnggLSB2aWV3cG9ydC5sZWZ0YC5cbiAgICAgIGNvbnN0IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSA9XG4gICAgICAgICAgTWF0aC5taW4odmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueCArIHZpZXdwb3J0LmxlZnQsIG9yaWdpbi54KTtcbiAgICAgIGNvbnN0IHByZXZpb3VzV2lkdGggPSB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLndpZHRoO1xuXG4gICAgICB3aWR0aCA9IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSAqIDI7XG4gICAgICBsZWZ0ID0gb3JpZ2luLnggLSBzbWFsbGVzdERpc3RhbmNlVG9WaWV3cG9ydEVkZ2U7XG5cbiAgICAgIGlmICh3aWR0aCA+IHByZXZpb3VzV2lkdGggJiYgIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiAhdGhpcy5fZ3Jvd0FmdGVyT3Blbikge1xuICAgICAgICBsZWZ0ID0gb3JpZ2luLnggLSAocHJldmlvdXNXaWR0aCAvIDIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7dG9wOiB0b3AhLCBsZWZ0OiBsZWZ0ISwgYm90dG9tOiBib3R0b20hLCByaWdodDogcmlnaHQhLCB3aWR0aCwgaGVpZ2h0fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSdzIHNpemluZyB3cmFwcGVyLiBUaGUgd3JhcHBlciBpcyBwb3NpdGlvbmVkIG9uIHRoZVxuICAgKiBvcmlnaW4ncyBjb25uZWN0aW9uIHBvaW50IGFuZCBzdGV0Y2hlcyB0byB0aGUgYm91bmRzIG9mIHRoZSB2aWV3cG9ydC5cbiAgICpcbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHdoZXJlIHRoZSBvdmVybGF5IGlzIGNvbm5lY3RlZC5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBwcmVmZXJlbmNlXG4gICAqL1xuICBwcml2YXRlIF9zZXRCb3VuZGluZ0JveFN0eWxlcyhvcmlnaW46IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiB2b2lkIHtcbiAgICBjb25zdCBib3VuZGluZ0JveFJlY3QgPSB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luLCBwb3NpdGlvbik7XG5cbiAgICAvLyBJdCdzIHdlaXJkIGlmIHRoZSBvdmVybGF5ICpncm93cyogd2hpbGUgc2Nyb2xsaW5nLCBzbyB3ZSB0YWtlIHRoZSBsYXN0IHNpemUgaW50byBhY2NvdW50XG4gICAgLy8gd2hlbiBhcHBseWluZyBhIG5ldyBzaXplLlxuICAgIGlmICghdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICBib3VuZGluZ0JveFJlY3QuaGVpZ2h0ID0gTWF0aC5taW4oYm91bmRpbmdCb3hSZWN0LmhlaWdodCwgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQpO1xuICAgICAgYm91bmRpbmdCb3hSZWN0LndpZHRoID0gTWF0aC5taW4oYm91bmRpbmdCb3hSZWN0LndpZHRoLCB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLndpZHRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdHlsZXMgPSB7fSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuXG4gICAgaWYgKHRoaXMuX2hhc0V4YWN0UG9zaXRpb24oKSkge1xuICAgICAgc3R5bGVzLnRvcCA9IHN0eWxlcy5sZWZ0ID0gJzAnO1xuICAgICAgc3R5bGVzLmJvdHRvbSA9IHN0eWxlcy5yaWdodCA9IHN0eWxlcy5tYXhIZWlnaHQgPSBzdHlsZXMubWF4V2lkdGggPSAnJztcbiAgICAgIHN0eWxlcy53aWR0aCA9IHN0eWxlcy5oZWlnaHQgPSAnMTAwJSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1heEhlaWdodCA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWF4SGVpZ2h0O1xuICAgICAgY29uc3QgbWF4V2lkdGggPSB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLm1heFdpZHRoO1xuXG4gICAgICBzdHlsZXMuaGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QuaGVpZ2h0KTtcbiAgICAgIHN0eWxlcy50b3AgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC50b3ApO1xuICAgICAgc3R5bGVzLmJvdHRvbSA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LmJvdHRvbSk7XG4gICAgICBzdHlsZXMud2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC53aWR0aCk7XG4gICAgICBzdHlsZXMubGVmdCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LmxlZnQpO1xuICAgICAgc3R5bGVzLnJpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QucmlnaHQpO1xuXG4gICAgICAvLyBQdXNoIHRoZSBwYW5lIGNvbnRlbnQgdG93YXJkcyB0aGUgcHJvcGVyIGRpcmVjdGlvbi5cbiAgICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgc3R5bGVzLmFsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlcy5hbGlnbkl0ZW1zID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnID8gJ2ZsZXgtZW5kJyA6ICdmbGV4LXN0YXJ0JztcbiAgICAgIH1cblxuICAgICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAnY2VudGVyJykge1xuICAgICAgICBzdHlsZXMuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlcy5qdXN0aWZ5Q29udGVudCA9IHBvc2l0aW9uLm92ZXJsYXlZID09PSAnYm90dG9tJyA/ICdmbGV4LWVuZCcgOiAnZmxleC1zdGFydCc7XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXhIZWlnaHQpIHtcbiAgICAgICAgc3R5bGVzLm1heEhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUobWF4SGVpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1heFdpZHRoKSB7XG4gICAgICAgIHN0eWxlcy5tYXhXaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUobWF4V2lkdGgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUgPSBib3VuZGluZ0JveFJlY3Q7XG5cbiAgICBleHRlbmRTdHlsZXModGhpcy5fYm91bmRpbmdCb3ghLnN0eWxlLCBzdHlsZXMpO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3R5bGVzIGZvciB0aGUgYm91bmRpbmcgYm94IHNvIHRoYXQgYSBuZXcgcG9zaXRpb25pbmcgY2FuIGJlIGNvbXB1dGVkLiAqL1xuICBwcml2YXRlIF9yZXNldEJvdW5kaW5nQm94U3R5bGVzKCkge1xuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveCEuc3R5bGUsIHtcbiAgICAgIHRvcDogJzAnLFxuICAgICAgbGVmdDogJzAnLFxuICAgICAgcmlnaHQ6ICcwJyxcbiAgICAgIGJvdHRvbTogJzAnLFxuICAgICAgaGVpZ2h0OiAnJyxcbiAgICAgIHdpZHRoOiAnJyxcbiAgICAgIGFsaWduSXRlbXM6ICcnLFxuICAgICAganVzdGlmeUNvbnRlbnQ6ICcnLFxuICAgIH0gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbik7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdHlsZXMgZm9yIHRoZSBvdmVybGF5IHBhbmUgc28gdGhhdCBhIG5ldyBwb3NpdGlvbmluZyBjYW4gYmUgY29tcHV0ZWQuICovXG4gIHByaXZhdGUgX3Jlc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMoKSB7XG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX3BhbmUuc3R5bGUsIHtcbiAgICAgIHRvcDogJycsXG4gICAgICBsZWZ0OiAnJyxcbiAgICAgIGJvdHRvbTogJycsXG4gICAgICByaWdodDogJycsXG4gICAgICBwb3NpdGlvbjogJycsXG4gICAgICB0cmFuc2Zvcm06ICcnLFxuICAgIH0gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbik7XG4gIH1cblxuICAvKiogU2V0cyBwb3NpdGlvbmluZyBzdHlsZXMgdG8gdGhlIG92ZXJsYXkgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMob3JpZ2luUG9pbnQ6IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiB2b2lkIHtcbiAgICBjb25zdCBzdHlsZXMgPSB7fSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGNvbnN0IGhhc0V4YWN0UG9zaXRpb24gPSB0aGlzLl9oYXNFeGFjdFBvc2l0aW9uKCk7XG4gICAgY29uc3QgaGFzRmxleGlibGVEaW1lbnNpb25zID0gdGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zO1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCk7XG5cbiAgICBpZiAoaGFzRXhhY3RQb3NpdGlvbikge1xuICAgICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICAgIGV4dGVuZFN0eWxlcyhzdHlsZXMsIHRoaXMuX2dldEV4YWN0T3ZlcmxheVkocG9zaXRpb24sIG9yaWdpblBvaW50LCBzY3JvbGxQb3NpdGlvbikpO1xuICAgICAgZXh0ZW5kU3R5bGVzKHN0eWxlcywgdGhpcy5fZ2V0RXhhY3RPdmVybGF5WChwb3NpdGlvbiwgb3JpZ2luUG9pbnQsIHNjcm9sbFBvc2l0aW9uKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5wb3NpdGlvbiA9ICdzdGF0aWMnO1xuICAgIH1cblxuICAgIC8vIFVzZSBhIHRyYW5zZm9ybSB0byBhcHBseSB0aGUgb2Zmc2V0cy4gV2UgZG8gdGhpcyBiZWNhdXNlIHRoZSBgY2VudGVyYCBwb3NpdGlvbnMgcmVseSBvblxuICAgIC8vIGJlaW5nIGluIHRoZSBub3JtYWwgZmxleCBmbG93IGFuZCBzZXR0aW5nIGEgYHRvcGAgLyBgbGVmdGAgYXQgYWxsIHdpbGwgY29tcGxldGVseSB0aHJvd1xuICAgIC8vIG9mZiB0aGUgcG9zaXRpb24uIFdlIGFsc28gY2FuJ3QgdXNlIG1hcmdpbnMsIGJlY2F1c2UgdGhleSB3b24ndCBoYXZlIGFuIGVmZmVjdCBpbiBzb21lXG4gICAgLy8gY2FzZXMgd2hlcmUgdGhlIGVsZW1lbnQgZG9lc24ndCBoYXZlIGFueXRoaW5nIHRvIFwicHVzaCBvZmYgb2ZcIi4gRmluYWxseSwgdGhpcyB3b3Jrc1xuICAgIC8vIGJldHRlciBib3RoIHdpdGggZmxleGlibGUgYW5kIG5vbi1mbGV4aWJsZSBwb3NpdGlvbmluZy5cbiAgICBsZXQgdHJhbnNmb3JtU3RyaW5nID0gJyc7XG4gICAgbGV0IG9mZnNldFggPSB0aGlzLl9nZXRPZmZzZXQocG9zaXRpb24sICd4Jyk7XG4gICAgbGV0IG9mZnNldFkgPSB0aGlzLl9nZXRPZmZzZXQocG9zaXRpb24sICd5Jyk7XG5cbiAgICBpZiAob2Zmc2V0WCkge1xuICAgICAgdHJhbnNmb3JtU3RyaW5nICs9IGB0cmFuc2xhdGVYKCR7b2Zmc2V0WH1weCkgYDtcbiAgICB9XG5cbiAgICBpZiAob2Zmc2V0WSkge1xuICAgICAgdHJhbnNmb3JtU3RyaW5nICs9IGB0cmFuc2xhdGVZKCR7b2Zmc2V0WX1weClgO1xuICAgIH1cblxuICAgIHN0eWxlcy50cmFuc2Zvcm0gPSB0cmFuc2Zvcm1TdHJpbmcudHJpbSgpO1xuXG4gICAgLy8gSWYgYSBtYXhXaWR0aCBvciBtYXhIZWlnaHQgaXMgc3BlY2lmaWVkIG9uIHRoZSBvdmVybGF5LCB3ZSByZW1vdmUgdGhlbS4gV2UgZG8gdGhpcyBiZWNhdXNlXG4gICAgLy8gd2UgbmVlZCB0aGVzZSB2YWx1ZXMgdG8gYm90aCBiZSBzZXQgdG8gXCIxMDAlXCIgZm9yIHRoZSBhdXRvbWF0aWMgZmxleGlibGUgc2l6aW5nIHRvIHdvcmsuXG4gICAgLy8gVGhlIG1heEhlaWdodCBhbmQgbWF4V2lkdGggYXJlIHNldCBvbiB0aGUgYm91bmRpbmdCb3ggaW4gb3JkZXIgdG8gZW5mb3JjZSB0aGUgY29uc3RyYWludC5cbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IGFwcGx5IHdoZW4gd2UgaGF2ZSBhbiBleGFjdCBwb3NpdGlvbiwgaW4gd2hpY2ggY2FzZSB3ZSBkbyB3YW50IHRvXG4gICAgLy8gYXBwbHkgdGhlbSBiZWNhdXNlIHRoZXknbGwgYmUgY2xlYXJlZCBmcm9tIHRoZSBib3VuZGluZyBib3guXG4gICAgaWYgKGNvbmZpZy5tYXhIZWlnaHQpIHtcbiAgICAgIGlmIChoYXNFeGFjdFBvc2l0aW9uKSB7XG4gICAgICAgIHN0eWxlcy5tYXhIZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGNvbmZpZy5tYXhIZWlnaHQpO1xuICAgICAgfSBlbHNlIGlmIChoYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgICAgc3R5bGVzLm1heEhlaWdodCA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb25maWcubWF4V2lkdGgpIHtcbiAgICAgIGlmIChoYXNFeGFjdFBvc2l0aW9uKSB7XG4gICAgICAgIHN0eWxlcy5tYXhXaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoY29uZmlnLm1heFdpZHRoKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzRmxleGlibGVEaW1lbnNpb25zKSB7XG4gICAgICAgIHN0eWxlcy5tYXhXaWR0aCA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9wYW5lLnN0eWxlLCBzdHlsZXMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGV4YWN0IHRvcC9ib3R0b20gZm9yIHRoZSBvdmVybGF5IHdoZW4gbm90IHVzaW5nIGZsZXhpYmxlIHNpemluZyBvciB3aGVuIHB1c2hpbmcuICovXG4gIHByaXZhdGUgX2dldEV4YWN0T3ZlcmxheVkocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblBvaW50OiBQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbjogVmlld3BvcnRTY3JvbGxQb3NpdGlvbikge1xuICAgIC8vIFJlc2V0IGFueSBleGlzdGluZyBzdHlsZXMuIFRoaXMgaXMgbmVjZXNzYXJ5IGluIGNhc2UgdGhlXG4gICAgLy8gcHJlZmVycmVkIHBvc2l0aW9uIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGBhcHBseWAuXG4gICAgbGV0IHN0eWxlcyA9IHt0b3A6ICcnLCBib3R0b206ICcnfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBwb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5faXNQdXNoZWQpIHtcbiAgICAgIG92ZXJsYXlQb2ludCA9IHRoaXMuX3B1c2hPdmVybGF5T25TY3JlZW4ob3ZlcmxheVBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgc2Nyb2xsUG9zaXRpb24pO1xuICAgIH1cblxuICAgIGxldCB2aXJ0dWFsS2V5Ym9hcmRPZmZzZXQgPVxuICAgICAgICB0aGlzLl9vdmVybGF5Q29udGFpbmVyLmdldENvbnRhaW5lckVsZW1lbnQoKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG5cbiAgICAvLyBOb3JtYWxseSB0aGlzIHdvdWxkIGJlIHplcm8sIGhvd2V2ZXIgd2hlbiB0aGUgb3ZlcmxheSBpcyBhdHRhY2hlZCB0byBhbiBpbnB1dCAoZS5nLiBpbiBhblxuICAgIC8vIGF1dG9jb21wbGV0ZSksIG1vYmlsZSBicm93c2VycyB3aWxsIHNoaWZ0IGV2ZXJ5dGhpbmcgaW4gb3JkZXIgdG8gcHV0IHRoZSBpbnB1dCBpbiB0aGUgbWlkZGxlXG4gICAgLy8gb2YgdGhlIHNjcmVlbiBhbmQgdG8gbWFrZSBzcGFjZSBmb3IgdGhlIHZpcnR1YWwga2V5Ym9hcmQuIFdlIG5lZWQgdG8gYWNjb3VudCBmb3IgdGhpcyBvZmZzZXQsXG4gICAgLy8gb3RoZXJ3aXNlIG91ciBwb3NpdGlvbmluZyB3aWxsIGJlIHRocm93biBvZmYuXG4gICAgb3ZlcmxheVBvaW50LnkgLT0gdmlydHVhbEtleWJvYXJkT2Zmc2V0O1xuXG4gICAgLy8gV2Ugd2FudCB0byBzZXQgZWl0aGVyIGB0b3BgIG9yIGBib3R0b21gIGJhc2VkIG9uIHdoZXRoZXIgdGhlIG92ZXJsYXkgd2FudHMgdG8gYXBwZWFyXG4gICAgLy8gYWJvdmUgb3IgYmVsb3cgdGhlIG9yaWdpbiBhbmQgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgZWxlbWVudCB3aWxsIGV4cGFuZC5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nKSB7XG4gICAgICAvLyBXaGVuIHVzaW5nIGBib3R0b21gLCB3ZSBhZGp1c3QgdGhlIHkgcG9zaXRpb24gc3VjaCB0aGF0IGl0IGlzIHRoZSBkaXN0YW5jZVxuICAgICAgLy8gZnJvbSB0aGUgYm90dG9tIG9mIHRoZSB2aWV3cG9ydCByYXRoZXIgdGhhbiB0aGUgdG9wLlxuICAgICAgY29uc3QgZG9jdW1lbnRIZWlnaHQgPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudEhlaWdodDtcbiAgICAgIHN0eWxlcy5ib3R0b20gPSBgJHtkb2N1bWVudEhlaWdodCAtIChvdmVybGF5UG9pbnQueSArIHRoaXMuX292ZXJsYXlSZWN0LmhlaWdodCl9cHhgO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMudG9wID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShvdmVybGF5UG9pbnQueSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBleGFjdCBsZWZ0L3JpZ2h0IGZvciB0aGUgb3ZlcmxheSB3aGVuIG5vdCB1c2luZyBmbGV4aWJsZSBzaXppbmcgb3Igd2hlbiBwdXNoaW5nLiAqL1xuICBwcml2YXRlIF9nZXRFeGFjdE92ZXJsYXlYKHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5Qb2ludDogUG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb246IFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24pIHtcbiAgICAvLyBSZXNldCBhbnkgZXhpc3Rpbmcgc3R5bGVzLiBUaGlzIGlzIG5lY2Vzc2FyeSBpbiBjYXNlIHRoZSBwcmVmZXJyZWQgcG9zaXRpb24gaGFzXG4gICAgLy8gY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBgYXBwbHlgLlxuICAgIGxldCBzdHlsZXMgPSB7bGVmdDogJycsIHJpZ2h0OiAnJ30gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICBsZXQgb3ZlcmxheVBvaW50ID0gdGhpcy5fZ2V0T3ZlcmxheVBvaW50KG9yaWdpblBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgcG9zaXRpb24pO1xuXG4gICAgaWYgKHRoaXMuX2lzUHVzaGVkKSB7XG4gICAgICBvdmVybGF5UG9pbnQgPSB0aGlzLl9wdXNoT3ZlcmxheU9uU2NyZWVuKG92ZXJsYXlQb2ludCwgdGhpcy5fb3ZlcmxheVJlY3QsIHNjcm9sbFBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBXZSB3YW50IHRvIHNldCBlaXRoZXIgYGxlZnRgIG9yIGByaWdodGAgYmFzZWQgb24gd2hldGhlciB0aGUgb3ZlcmxheSB3YW50cyB0byBhcHBlYXIgXCJiZWZvcmVcIlxuICAgIC8vIG9yIFwiYWZ0ZXJcIiB0aGUgb3JpZ2luLCB3aGljaCBkZXRlcm1pbmVzIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGVsZW1lbnQgd2lsbCBleHBhbmQuXG4gICAgLy8gRm9yIHRoZSBob3Jpem9udGFsIGF4aXMsIHRoZSBtZWFuaW5nIG9mIFwiYmVmb3JlXCIgYW5kIFwiYWZ0ZXJcIiBjaGFuZ2UgYmFzZWQgb24gd2hldGhlciB0aGVcbiAgICAvLyBwYWdlIGlzIGluIFJUTCBvciBMVFIuXG4gICAgbGV0IGhvcml6b250YWxTdHlsZVByb3BlcnR5OiAnbGVmdCcgfCAncmlnaHQnO1xuXG4gICAgaWYgKHRoaXMuX2lzUnRsKCkpIHtcbiAgICAgIGhvcml6b250YWxTdHlsZVByb3BlcnR5ID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICB9IGVsc2Uge1xuICAgICAgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgIH1cblxuICAgIC8vIFdoZW4gd2UncmUgc2V0dGluZyBgcmlnaHRgLCB3ZSBhZGp1c3QgdGhlIHggcG9zaXRpb24gc3VjaCB0aGF0IGl0IGlzIHRoZSBkaXN0YW5jZVxuICAgIC8vIGZyb20gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIHZpZXdwb3J0IHJhdGhlciB0aGFuIHRoZSBsZWZ0IGVkZ2UuXG4gICAgaWYgKGhvcml6b250YWxTdHlsZVByb3BlcnR5ID09PSAncmlnaHQnKSB7XG4gICAgICBjb25zdCBkb2N1bWVudFdpZHRoID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRXaWR0aDtcbiAgICAgIHN0eWxlcy5yaWdodCA9IGAke2RvY3VtZW50V2lkdGggLSAob3ZlcmxheVBvaW50LnggKyB0aGlzLl9vdmVybGF5UmVjdC53aWR0aCl9cHhgO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMubGVmdCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUob3ZlcmxheVBvaW50LngpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlldyBwcm9wZXJ0aWVzIG9mIHRoZSB0cmlnZ2VyIGFuZCBvdmVybGF5LCBpbmNsdWRpbmcgd2hldGhlciB0aGV5IGFyZSBjbGlwcGVkXG4gICAqIG9yIGNvbXBsZXRlbHkgb3V0c2lkZSB0aGUgdmlldyBvZiBhbnkgb2YgdGhlIHN0cmF0ZWd5J3Mgc2Nyb2xsYWJsZXMuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTY3JvbGxWaXNpYmlsaXR5KCk6IFNjcm9sbGluZ1Zpc2liaWxpdHkge1xuICAgIC8vIE5vdGU6IG5lZWRzIGZyZXNoIHJlY3RzIHNpbmNlIHRoZSBwb3NpdGlvbiBjb3VsZCd2ZSBjaGFuZ2VkLlxuICAgIGNvbnN0IG9yaWdpbkJvdW5kcyA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICBjb25zdCBvdmVybGF5Qm91bmRzID0gIHRoaXMuX3BhbmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBUT0RPKGplbGJvdXJuKTogaW5zdGVhZCBvZiBuZWVkaW5nIGFsbCBvZiB0aGUgY2xpZW50IHJlY3RzIGZvciB0aGVzZSBzY3JvbGxpbmcgY29udGFpbmVyc1xuICAgIC8vIGV2ZXJ5IHRpbWUsIHdlIHNob3VsZCBiZSBhYmxlIHRvIHVzZSB0aGUgc2Nyb2xsVG9wIG9mIHRoZSBjb250YWluZXJzIGlmIHRoZSBzaXplIG9mIHRob3NlXG4gICAgLy8gY29udGFpbmVycyBoYXNuJ3QgY2hhbmdlZC5cbiAgICBjb25zdCBzY3JvbGxDb250YWluZXJCb3VuZHMgPSB0aGlzLl9zY3JvbGxhYmxlcy5tYXAoc2Nyb2xsYWJsZSA9PiB7XG4gICAgICByZXR1cm4gc2Nyb2xsYWJsZS5nZXRFbGVtZW50UmVmKCkubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBpc09yaWdpbkNsaXBwZWQ6IGlzRWxlbWVudENsaXBwZWRCeVNjcm9sbGluZyhvcmlnaW5Cb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgICBpc09yaWdpbk91dHNpZGVWaWV3OiBpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3KG9yaWdpbkJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICAgIGlzT3ZlcmxheUNsaXBwZWQ6IGlzRWxlbWVudENsaXBwZWRCeVNjcm9sbGluZyhvdmVybGF5Qm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgICAgaXNPdmVybGF5T3V0c2lkZVZpZXc6IGlzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcob3ZlcmxheUJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIFN1YnRyYWN0cyB0aGUgYW1vdW50IHRoYXQgYW4gZWxlbWVudCBpcyBvdmVyZmxvd2luZyBvbiBhbiBheGlzIGZyb20gaXRzIGxlbmd0aC4gKi9cbiAgcHJpdmF0ZSBfc3VidHJhY3RPdmVyZmxvd3MobGVuZ3RoOiBudW1iZXIsIC4uLm92ZXJmbG93czogbnVtYmVyW10pOiBudW1iZXIge1xuICAgIHJldHVybiBvdmVyZmxvd3MucmVkdWNlKChjdXJyZW50VmFsdWU6IG51bWJlciwgY3VycmVudE92ZXJmbG93OiBudW1iZXIpID0+IHtcbiAgICAgIHJldHVybiBjdXJyZW50VmFsdWUgLSBNYXRoLm1heChjdXJyZW50T3ZlcmZsb3csIDApO1xuICAgIH0sIGxlbmd0aCk7XG4gIH1cblxuICAvKiogTmFycm93cyB0aGUgZ2l2ZW4gdmlld3BvcnQgcmVjdCBieSB0aGUgY3VycmVudCBfdmlld3BvcnRNYXJnaW4uICovXG4gIHByaXZhdGUgX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk6IERpbWVuc2lvbnMge1xuICAgIC8vIFdlIHJlY2FsY3VsYXRlIHRoZSB2aWV3cG9ydCByZWN0IGhlcmUgb3Vyc2VsdmVzLCByYXRoZXIgdGhhbiB1c2luZyB0aGUgVmlld3BvcnRSdWxlcixcbiAgICAvLyBiZWNhdXNlIHdlIHdhbnQgdG8gdXNlIHRoZSBgY2xpZW50V2lkdGhgIGFuZCBgY2xpZW50SGVpZ2h0YCBhcyB0aGUgYmFzZS4gVGhlIGRpZmZlcmVuY2VcbiAgICAvLyBiZWluZyB0aGF0IHRoZSBjbGllbnQgcHJvcGVydGllcyBkb24ndCBpbmNsdWRlIHRoZSBzY3JvbGxiYXIsIGFzIG9wcG9zZWQgdG8gYGlubmVyV2lkdGhgXG4gICAgLy8gYW5kIGBpbm5lckhlaWdodGAgdGhhdCBkby4gVGhpcyBpcyBuZWNlc3NhcnksIGJlY2F1c2UgdGhlIG92ZXJsYXkgY29udGFpbmVyIHVzZXNcbiAgICAvLyAxMDAlIGB3aWR0aGAgYW5kIGBoZWlnaHRgIHdoaWNoIGRvbid0IGluY2x1ZGUgdGhlIHNjcm9sbGJhciBlaXRoZXIuXG4gICAgY29uc3Qgd2lkdGggPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuY2xpZW50SGVpZ2h0O1xuICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiAgICBzY3JvbGxQb3NpdGlvbi50b3AgKyB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIGxlZnQ6ICAgc2Nyb2xsUG9zaXRpb24ubGVmdCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgcmlnaHQ6ICBzY3JvbGxQb3NpdGlvbi5sZWZ0ICsgd2lkdGggLSB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIGJvdHRvbTogc2Nyb2xsUG9zaXRpb24udG9wICsgaGVpZ2h0IC0gdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICB3aWR0aDogIHdpZHRoICAtICgyICogdGhpcy5fdmlld3BvcnRNYXJnaW4pLFxuICAgICAgaGVpZ2h0OiBoZWlnaHQgLSAoMiAqIHRoaXMuX3ZpZXdwb3J0TWFyZ2luKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdlJ3JlIGRlYWxpbmcgd2l0aCBhbiBSVEwgY29udGV4dCAqL1xuICBwcml2YXRlIF9pc1J0bCgpIHtcbiAgICByZXR1cm4gdGhpcy5fb3ZlcmxheVJlZi5nZXREaXJlY3Rpb24oKSA9PT0gJ3J0bCc7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBvdmVybGF5IHVzZXMgZXhhY3Qgb3IgZmxleGlibGUgcG9zaXRpb25pbmcuICovXG4gIHByaXZhdGUgX2hhc0V4YWN0UG9zaXRpb24oKSB7XG4gICAgcmV0dXJuICF0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMgfHwgdGhpcy5faXNQdXNoZWQ7XG4gIH1cblxuICAvKiogUmV0cmlldmVzIHRoZSBvZmZzZXQgb2YgYSBwb3NpdGlvbiBhbG9uZyB0aGUgeCBvciB5IGF4aXMuICovXG4gIHByaXZhdGUgX2dldE9mZnNldChwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sIGF4aXM6ICd4JyB8ICd5Jykge1xuICAgIGlmIChheGlzID09PSAneCcpIHtcbiAgICAgIC8vIFdlIGRvbid0IGRvIHNvbWV0aGluZyBsaWtlIGBwb3NpdGlvblsnb2Zmc2V0JyArIGF4aXNdYCBpblxuICAgICAgLy8gb3JkZXIgdG8gYXZvaWQgYnJla2luZyBtaW5pZmllcnMgdGhhdCByZW5hbWUgcHJvcGVydGllcy5cbiAgICAgIHJldHVybiBwb3NpdGlvbi5vZmZzZXRYID09IG51bGwgPyB0aGlzLl9vZmZzZXRYIDogcG9zaXRpb24ub2Zmc2V0WDtcbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb24ub2Zmc2V0WSA9PSBudWxsID8gdGhpcy5fb2Zmc2V0WSA6IHBvc2l0aW9uLm9mZnNldFk7XG4gIH1cblxuICAvKiogVmFsaWRhdGVzIHRoYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24gbWF0Y2ggdGhlIGV4cGVjdGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfdmFsaWRhdGVQb3NpdGlvbnMoKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKCF0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k6IEF0IGxlYXN0IG9uZSBwb3NpdGlvbiBpcyByZXF1aXJlZC4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGVzZSBvbmNlIEFuZ3VsYXIncyB0ZW1wbGF0ZSB0eXBlXG4gICAgICAvLyBjaGVja2luZyBpcyBhZHZhbmNlZCBlbm91Z2ggdG8gY2F0Y2ggdGhlc2UgY2FzZXMuXG4gICAgICB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMuZm9yRWFjaChwYWlyID0+IHtcbiAgICAgICAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24oJ29yaWdpblgnLCBwYWlyLm9yaWdpblgpO1xuICAgICAgICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24oJ29yaWdpblknLCBwYWlyLm9yaWdpblkpO1xuICAgICAgICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbignb3ZlcmxheVgnLCBwYWlyLm92ZXJsYXlYKTtcbiAgICAgICAgdmFsaWRhdGVWZXJ0aWNhbFBvc2l0aW9uKCdvdmVybGF5WScsIHBhaXIub3ZlcmxheVkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFkZHMgYSBzaW5nbGUgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgb24gdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX2FkZFBhbmVsQ2xhc3Nlcyhjc3NDbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICBjb2VyY2VBcnJheShjc3NDbGFzc2VzKS5mb3JFYWNoKGNzc0NsYXNzID0+IHtcbiAgICAgICAgaWYgKGNzc0NsYXNzICE9PSAnJyAmJiB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzLmluZGV4T2YoY3NzQ2xhc3MpID09PSAtMSkge1xuICAgICAgICAgIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMucHVzaChjc3NDbGFzcyk7XG4gICAgICAgICAgdGhpcy5fcGFuZS5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENsZWFycyB0aGUgY2xhc3NlcyB0aGF0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBoYXMgYXBwbGllZCBmcm9tIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9jbGVhclBhbmVsQ2xhc3NlcygpIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3Nlcy5mb3JFYWNoKGNzc0NsYXNzID0+IHtcbiAgICAgICAgdGhpcy5fcGFuZS5jbGFzc0xpc3QucmVtb3ZlKGNzc0NsYXNzKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3NlcyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBDbGllbnRSZWN0IG9mIHRoZSBjdXJyZW50IG9yaWdpbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3JpZ2luUmVjdCgpOiBEaW1lbnNpb25zIHtcbiAgICBjb25zdCBvcmlnaW4gPSB0aGlzLl9vcmlnaW47XG5cbiAgICBpZiAob3JpZ2luIGluc3RhbmNlb2YgRWxlbWVudFJlZikge1xuICAgICAgcmV0dXJuIG9yaWdpbi5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBFbGVtZW50IHNvIFNWRyBlbGVtZW50cyBhcmUgYWxzbyBzdXBwb3J0ZWQuXG4gICAgaWYgKG9yaWdpbiBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBvcmlnaW4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lkdGggPSBvcmlnaW4ud2lkdGggfHwgMDtcbiAgICBjb25zdCBoZWlnaHQgPSBvcmlnaW4uaGVpZ2h0IHx8IDA7XG5cbiAgICAvLyBJZiB0aGUgb3JpZ2luIGlzIGEgcG9pbnQsIHJldHVybiBhIGNsaWVudCByZWN0IGFzIGlmIGl0IHdhcyBhIDB4MCBlbGVtZW50IGF0IHRoZSBwb2ludC5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBvcmlnaW4ueSxcbiAgICAgIGJvdHRvbTogb3JpZ2luLnkgKyBoZWlnaHQsXG4gICAgICBsZWZ0OiBvcmlnaW4ueCxcbiAgICAgIHJpZ2h0OiBvcmlnaW4ueCArIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgd2lkdGhcbiAgICB9O1xuICB9XG59XG5cbi8qKiBBIHNpbXBsZSAoeCwgeSkgY29vcmRpbmF0ZS4gKi9cbmludGVyZmFjZSBQb2ludCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIG1lYXN1cmVtZW50cyBmb3IgaG93IGFuIG92ZXJsYXkgKGF0IGEgZ2l2ZW4gcG9zaXRpb24pIGZpdHMgaW50byB0aGUgdmlld3BvcnQuICovXG5pbnRlcmZhY2UgT3ZlcmxheUZpdCB7XG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGZpdHMgY29tcGxldGVseSBpbiB0aGUgdmlld3BvcnQuICovXG4gIGlzQ29tcGxldGVseVdpdGhpblZpZXdwb3J0OiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGZpdHMgaW4gdGhlIHZpZXdwb3J0IG9uIHRoZSB5LWF4aXMuICovXG4gIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogYm9vbGVhbjtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBmaXRzIGluIHRoZSB2aWV3cG9ydCBvbiB0aGUgeC1heGlzLiAqL1xuICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogYm9vbGVhbjtcblxuICAvKiogVGhlIHRvdGFsIHZpc2libGUgYXJlYSAoaW4gcHheMikgb2YgdGhlIG92ZXJsYXkgaW5zaWRlIHRoZSB2aWV3cG9ydC4gKi9cbiAgdmlzaWJsZUFyZWE6IG51bWJlcjtcbn1cblxuLyoqIFJlY29yZCBvZiB0aGUgbWVhc3VybWVudHMgZGV0ZXJtaW5pbmcgd2hldGhlciBhbiBvdmVybGF5IHdpbGwgZml0IGluIGEgc3BlY2lmaWMgcG9zaXRpb24uICovXG5pbnRlcmZhY2UgRmFsbGJhY2tQb3NpdGlvbiB7XG4gIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbjtcbiAgb3JpZ2luUG9pbnQ6IFBvaW50O1xuICBvdmVybGF5UG9pbnQ6IFBvaW50O1xuICBvdmVybGF5Rml0OiBPdmVybGF5Rml0O1xuICBvdmVybGF5UmVjdDogRGltZW5zaW9ucztcbn1cblxuLyoqIFBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBvdmVybGF5IHNpemluZyB3cmFwcGVyIGZvciBhIHNwZWNpZmljIHBvc2l0aW9uLiAqL1xuaW50ZXJmYWNlIEJvdW5kaW5nQm94UmVjdCB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG4gIGJvdHRvbTogbnVtYmVyO1xuICByaWdodDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgd2lkdGg6IG51bWJlcjtcbn1cblxuLyoqIFJlY29yZCBvZiBtZWFzdXJlcyBkZXRlcm1pbmluZyBob3cgd2VsbCBhIGdpdmVuIHBvc2l0aW9uIHdpbGwgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucy4gKi9cbmludGVyZmFjZSBGbGV4aWJsZUZpdCB7XG4gIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbjtcbiAgb3JpZ2luOiBQb2ludDtcbiAgb3ZlcmxheVJlY3Q6IERpbWVuc2lvbnM7XG4gIGJvdW5kaW5nQm94UmVjdDogQm91bmRpbmdCb3hSZWN0O1xufVxuXG4vKiogQSBjb25uZWN0ZWQgcG9zaXRpb24gYXMgc3BlY2lmaWVkIGJ5IHRoZSB1c2VyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0ZWRQb3NpdGlvbiB7XG4gIG9yaWdpblg6ICdzdGFydCcgfCAnY2VudGVyJyB8ICdlbmQnO1xuICBvcmlnaW5ZOiAndG9wJyB8ICdjZW50ZXInIHwgJ2JvdHRvbSc7XG5cbiAgb3ZlcmxheVg6ICdzdGFydCcgfCAnY2VudGVyJyB8ICdlbmQnO1xuICBvdmVybGF5WTogJ3RvcCcgfCAnY2VudGVyJyB8ICdib3R0b20nO1xuXG4gIHdlaWdodD86IG51bWJlcjtcbiAgb2Zmc2V0WD86IG51bWJlcjtcbiAgb2Zmc2V0WT86IG51bWJlcjtcbiAgcGFuZWxDbGFzcz86IHN0cmluZyB8IHN0cmluZ1tdO1xufVxuXG4vKiogU2hhbGxvdy1leHRlbmRzIGEgc3R5bGVzaGVldCBvYmplY3Qgd2l0aCBhbm90aGVyIHN0eWxlc2hlZXQgb2JqZWN0LiAqL1xuZnVuY3Rpb24gZXh0ZW5kU3R5bGVzKGRlc3RpbmF0aW9uOiBDU1NTdHlsZURlY2xhcmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogQ1NTU3R5bGVEZWNsYXJhdGlvbik6IENTU1N0eWxlRGVjbGFyYXRpb24ge1xuICBmb3IgKGxldCBrZXkgaW4gc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBkZXN0aW5hdGlvbltrZXldID0gc291cmNlW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xufVxuXG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIHBpeGVsIHZhbHVlIGFzIGEgbnVtYmVyIGZyb20gYSB2YWx1ZSwgaWYgaXQncyBhIG51bWJlclxuICogb3IgYSBDU1MgcGl4ZWwgc3RyaW5nIChlLmcuIGAxMzM3cHhgKS4gT3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cbiAqL1xuZnVuY3Rpb24gZ2V0UGl4ZWxWYWx1ZShpbnB1dDogbnVtYmVyfHN0cmluZ3xudWxsfHVuZGVmaW5lZCk6IG51bWJlcnxudWxsIHtcbiAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ251bWJlcicgJiYgaW5wdXQgIT0gbnVsbCkge1xuICAgIGNvbnN0IFt2YWx1ZSwgdW5pdHNdID0gaW5wdXQuc3BsaXQoY3NzVW5pdFBhdHRlcm4pO1xuICAgIHJldHVybiAoIXVuaXRzIHx8IHVuaXRzID09PSAncHgnKSA/IHBhcnNlRmxvYXQodmFsdWUpIDogbnVsbDtcbiAgfVxuXG4gIHJldHVybiBpbnB1dCB8fCBudWxsO1xufVxuXG4vKipcbiAqIEdldHMgYSB2ZXJzaW9uIG9mIGFuIGVsZW1lbnQncyBib3VuZGluZyBgQ2xpZW50UmVjdGAgd2hlcmUgYWxsIHRoZSB2YWx1ZXMgYXJlIHJvdW5kZWQgZG93biB0b1xuICogdGhlIG5lYXJlc3QgcGl4ZWwuIFRoaXMgYWxsb3dzIHVzIHRvIGFjY291bnQgZm9yIHRoZSBjYXNlcyB3aGVyZSB0aGVyZSBtYXkgYmUgc3ViLXBpeGVsXG4gKiBkZXZpYXRpb25zIGluIHRoZSBgQ2xpZW50UmVjdGAgcmV0dXJuZWQgYnkgdGhlIGJyb3dzZXIgKGUuZy4gd2hlbiB6b29tZWQgaW4gd2l0aCBhIHBlcmNlbnRhZ2VcbiAqIHNpemUsIHNlZSAjMjEzNTApLlxuICovXG5mdW5jdGlvbiBnZXRSb3VuZGVkQm91bmRpbmdDbGllbnRSZWN0KGNsaWVudFJlY3Q6IERpbWVuc2lvbnMpOiBEaW1lbnNpb25zIHtcbiAgcmV0dXJuIHtcbiAgICB0b3A6IE1hdGguZmxvb3IoY2xpZW50UmVjdC50b3ApLFxuICAgIHJpZ2h0OiBNYXRoLmZsb29yKGNsaWVudFJlY3QucmlnaHQpLFxuICAgIGJvdHRvbTogTWF0aC5mbG9vcihjbGllbnRSZWN0LmJvdHRvbSksXG4gICAgbGVmdDogTWF0aC5mbG9vcihjbGllbnRSZWN0LmxlZnQpLFxuICAgIHdpZHRoOiBNYXRoLmZsb29yKGNsaWVudFJlY3Qud2lkdGgpLFxuICAgIGhlaWdodDogTWF0aC5mbG9vcihjbGllbnRSZWN0LmhlaWdodClcbiAgfTtcbn1cbiJdfQ==