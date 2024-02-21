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
    /** Ordered list of preferred positions, from most to least desirable. */
    get positions() {
        return this._preferredPositions;
    }
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
     *  - If flexible dimensions are enabled and at least one satisfies the given minimum width/height,
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
        // We need the bounding rects for the origin, the overlay and the container to determine how to position
        // the overlay relative to the origin.
        // We use the viewport rect to determine whether a position would go off-screen.
        this._viewportRect = this._getNarrowedViewportRect();
        this._originRect = this._getOriginRect();
        this._overlayRect = this._pane.getBoundingClientRect();
        this._containerRect = this._overlayContainer.getContainerElement().getBoundingClientRect();
        const originRect = this._originRect;
        const overlayRect = this._overlayRect;
        const viewportRect = this._viewportRect;
        const containerRect = this._containerRect;
        // Positions where the overlay will fit with flexible dimensions.
        const flexibleFits = [];
        // Fallback if none of the preferred positions fit within the viewport.
        let fallback;
        // Go through each of the preferred positions looking for a good fit.
        // If a good fit is found, it will be applied immediately.
        for (let pos of this._preferredPositions) {
            // Get the exact (x, y) coordinate for the point-of-origin on the origin element.
            let originPoint = this._getOriginPoint(originRect, containerRect, pos);
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
        if (this._isDisposed || !this._platform.isBrowser) {
            return;
        }
        const lastPosition = this._lastPosition;
        if (lastPosition) {
            this._originRect = this._getOriginRect();
            this._overlayRect = this._pane.getBoundingClientRect();
            this._viewportRect = this._getNarrowedViewportRect();
            this._containerRect = this._overlayContainer.getContainerElement().getBoundingClientRect();
            const originPoint = this._getOriginPoint(this._originRect, this._containerRect, lastPosition);
            this._applyPosition(lastPosition, originPoint);
        }
        else {
            this.apply();
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
    _getOriginPoint(originRect, containerRect, pos) {
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
        // When zooming in Safari the container rectangle contains negative values for the position
        // and we need to re-add them to the calculated coordinates.
        if (containerRect.left < 0) {
            x -= containerRect.left;
        }
        let y;
        if (pos.originY == 'center') {
            y = originRect.top + originRect.height / 2;
        }
        else {
            y = pos.originY == 'top' ? originRect.top : originRect.bottom;
        }
        // Normally the containerRect's top value would be zero, however when the overlay is attached to an input
        // (e.g. in an autocomplete), mobile browsers will shift everything in order to put the input in the middle
        // of the screen and to make space for the virtual keyboard. We need to account for this offset,
        // otherwise our positioning will be thrown off.
        // Additionally, when zooming in Safari this fixes the vertical position.
        if (containerRect.top < 0) {
            y -= containerRect.top;
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
     * @param point The (x, y) coordinates of the overlay at some position.
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
     * the viewport, the top-left corner will be pushed on-screen (with overflow occurring on the
     * right and bottom).
     *
     * @param start Starting point from which the overlay is pushed.
     * @param rawOverlayRect Dimensions of the overlay.
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
        // Notify that the position has been changed along with its change properties.
        // We only emit if we've got any subscriptions, because the scroll visibility
        // calculations can be somewhat expensive.
        if (this._positionChanges.observers.length) {
            const scrollVisibility = this._getScrollVisibility();
            // We're recalculating on scroll, but we only want to emit if anything
            // changed since downstream code might be hitting the `NgZone`.
            if (position !== this._lastPosition ||
                !this._lastScrollVisibility ||
                !compareScrollVisibility(this._lastScrollVisibility, scrollVisibility)) {
                const changeEvent = new ConnectedOverlayPositionChange(position, scrollVisibility);
                this._positionChanges.next(changeEvent);
            }
            this._lastScrollVisibility = scrollVisibility;
        }
        // Save the last connected position in case the position needs to be re-calculated.
        this._lastPosition = position;
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
            // margin, whereas the `origin` position is calculated based on its `DOMRect`.
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
     * origin's connection point and stretches to the bounds of the viewport.
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
            // order to avoid breaking minifiers that rename properties.
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
    /** Returns the DOMRect of the current origin. */
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
 * Gets a version of an element's bounding `DOMRect` where all the values are rounded down to
 * the nearest pixel. This allows us to account for the cases where there may be sub-pixel
 * deviations in the `DOMRect` returned by the browser (e.g. when zoomed in with a percentage
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
/** Returns whether two `ScrollingVisibility` objects are identical. */
function compareScrollVisibility(a, b) {
    if (a === b) {
        return true;
    }
    return (a.isOriginClipped === b.isOriginClipped &&
        a.isOriginOutsideView === b.isOriginOutsideView &&
        a.isOverlayClipped === b.isOverlayClipped &&
        a.isOverlayOutsideView === b.isOverlayOutsideView);
}
export const STANDARD_DROPDOWN_BELOW_POSITIONS = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];
export const STANDARD_DROPDOWN_ADJACENT_POSITIONS = [
    { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top' },
    { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom' },
    { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' },
    { originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'bottom' },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFDTCw4QkFBOEIsRUFHOUIsMEJBQTBCLEVBQzFCLHdCQUF3QixHQUN6QixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBYSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3ZELE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RixPQUFPLEVBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFLdkUscUZBQXFGO0FBQ3JGLDZGQUE2RjtBQUU3RixxREFBcUQ7QUFDckQsTUFBTSxnQkFBZ0IsR0FBRyw2Q0FBNkMsQ0FBQztBQUV2RSxxREFBcUQ7QUFDckQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBY3ZDOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxpQ0FBaUM7SUEyRjVDLHlFQUF5RTtJQUN6RSxJQUFJLFNBQVM7UUFDWCxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztJQUNsQyxDQUFDO0lBRUQsWUFDRSxXQUFvRCxFQUM1QyxjQUE2QixFQUM3QixTQUFtQixFQUNuQixTQUFtQixFQUNuQixpQkFBbUM7UUFIbkMsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0IsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7UUE5RjdD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QUFFLFFBQVEsRUFBRSxLQUFLLEVBQUM7SUFDckUsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDO0NBQ3RFLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSxvQ0FBb0MsR0FBd0I7SUFDdkUsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDO0lBQ3BFLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQztJQUMxRSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUM7SUFDcEUsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDO0NBQzNFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQb3NpdGlvblN0cmF0ZWd5fSBmcm9tICcuL3Bvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXIsIENka1Njcm9sbGFibGUsIFZpZXdwb3J0U2Nyb2xsUG9zaXRpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtcbiAgQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlLFxuICBDb25uZWN0aW9uUG9zaXRpb25QYWlyLFxuICBTY3JvbGxpbmdWaXNpYmlsaXR5LFxuICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbixcbiAgdmFsaWRhdGVWZXJ0aWNhbFBvc2l0aW9uLFxufSBmcm9tICcuL2Nvbm5lY3RlZC1wb3NpdGlvbic7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YnNjcmlwdGlvbiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2lzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcsIGlzRWxlbWVudENsaXBwZWRCeVNjcm9sbGluZ30gZnJvbSAnLi9zY3JvbGwtY2xpcCc7XG5pbXBvcnQge2NvZXJjZUNzc1BpeGVsVmFsdWUsIGNvZXJjZUFycmF5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7T3ZlcmxheUNvbnRhaW5lcn0gZnJvbSAnLi4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtPdmVybGF5UmVmfSBmcm9tICcuLi9vdmVybGF5LXJlZic7XG5cbi8vIFRPRE86IHJlZmFjdG9yIGNsaXBwaW5nIGRldGVjdGlvbiBpbnRvIGEgc2VwYXJhdGUgdGhpbmcgKHBhcnQgb2Ygc2Nyb2xsaW5nIG1vZHVsZSlcbi8vIFRPRE86IGRvZXNuJ3QgaGFuZGxlIGJvdGggZmxleGlibGUgd2lkdGggYW5kIGhlaWdodCB3aGVuIGl0IGhhcyB0byBzY3JvbGwgYWxvbmcgYm90aCBheGlzLlxuXG4vKiogQ2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIG92ZXJsYXkgYm91bmRpbmcgYm94LiAqL1xuY29uc3QgYm91bmRpbmdCb3hDbGFzcyA9ICdjZGstb3ZlcmxheS1jb25uZWN0ZWQtcG9zaXRpb24tYm91bmRpbmctYm94JztcblxuLyoqIFJlZ2V4IHVzZWQgdG8gc3BsaXQgYSBzdHJpbmcgb24gaXRzIENTUyB1bml0cy4gKi9cbmNvbnN0IGNzc1VuaXRQYXR0ZXJuID0gLyhbQS1aYS16JV0rKSQvO1xuXG4vKiogUG9zc2libGUgdmFsdWVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgb3JpZ2luIG9mIGEgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LiAqL1xuZXhwb3J0IHR5cGUgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luID1cbiAgfCBFbGVtZW50UmVmXG4gIHwgRWxlbWVudFxuICB8IChQb2ludCAmIHtcbiAgICAgIHdpZHRoPzogbnVtYmVyO1xuICAgICAgaGVpZ2h0PzogbnVtYmVyO1xuICAgIH0pO1xuXG4vKiogRXF1aXZhbGVudCBvZiBgRE9NUmVjdGAgd2l0aG91dCBzb21lIG9mIHRoZSBwcm9wZXJ0aWVzIHdlIGRvbid0IGNhcmUgYWJvdXQuICovXG50eXBlIERpbWVuc2lvbnMgPSBPbWl0PERPTVJlY3QsICd4JyB8ICd5JyB8ICd0b0pTT04nPjtcblxuLyoqXG4gKiBBIHN0cmF0ZWd5IGZvciBwb3NpdGlvbmluZyBvdmVybGF5cy4gVXNpbmcgdGhpcyBzdHJhdGVneSwgYW4gb3ZlcmxheSBpcyBnaXZlbiBhblxuICogaW1wbGljaXQgcG9zaXRpb24gcmVsYXRpdmUgc29tZSBvcmlnaW4gZWxlbWVudC4gVGhlIHJlbGF0aXZlIHBvc2l0aW9uIGlzIGRlZmluZWQgaW4gdGVybXMgb2ZcbiAqIGEgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHRoYXQgaXMgY29ubmVjdGVkIHRvIGEgcG9pbnQgb24gdGhlIG92ZXJsYXkgZWxlbWVudC4gRm9yIGV4YW1wbGUsXG4gKiBhIGJhc2ljIGRyb3Bkb3duIGlzIGNvbm5lY3RpbmcgdGhlIGJvdHRvbS1sZWZ0IGNvcm5lciBvZiB0aGUgb3JpZ2luIHRvIHRoZSB0b3AtbGVmdCBjb3JuZXJcbiAqIG9mIHRoZSBvdmVybGF5LlxuICovXG5leHBvcnQgY2xhc3MgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IGltcGxlbWVudHMgUG9zaXRpb25TdHJhdGVneSB7XG4gIC8qKiBUaGUgb3ZlcmxheSB0byB3aGljaCB0aGlzIHN0cmF0ZWd5IGlzIGF0dGFjaGVkLiAqL1xuICBwcml2YXRlIF9vdmVybGF5UmVmOiBPdmVybGF5UmVmO1xuXG4gIC8qKiBXaGV0aGVyIHdlJ3JlIHBlcmZvcm1pbmcgdGhlIHZlcnkgZmlyc3QgcG9zaXRpb25pbmcgb2YgdGhlIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2lzSW5pdGlhbFJlbmRlcjogYm9vbGVhbjtcblxuICAvKiogTGFzdCBzaXplIHVzZWQgZm9yIHRoZSBib3VuZGluZyBib3guIFVzZWQgdG8gYXZvaWQgcmVzaXppbmcgdGhlIG92ZXJsYXkgYWZ0ZXIgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdEJvdW5kaW5nQm94U2l6ZSA9IHt3aWR0aDogMCwgaGVpZ2h0OiAwfTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSB3YXMgcHVzaGVkIGluIGEgcHJldmlvdXMgcG9zaXRpb25pbmcuICovXG4gIHByaXZhdGUgX2lzUHVzaGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gb24gdGhlIGluaXRpYWwgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfY2FuUHVzaCA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgdmlhIGZsZXhpYmxlIHdpZHRoL2hlaWdodCBhZnRlciB0aGUgaW5pdGlhbCBvcGVuLiAqL1xuICBwcml2YXRlIF9ncm93QWZ0ZXJPcGVuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfaGFzRmxleGlibGVEaW1lbnNpb25zID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBwb3NpdGlvbiBpcyBsb2NrZWQuICovXG4gIHByaXZhdGUgX3Bvc2l0aW9uTG9ja2VkID0gZmFsc2U7XG5cbiAgLyoqIENhY2hlZCBvcmlnaW4gZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF9vcmlnaW5SZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBDYWNoZWQgb3ZlcmxheSBkaW1lbnNpb25zICovXG4gIHByaXZhdGUgX292ZXJsYXlSZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBDYWNoZWQgdmlld3BvcnQgZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF92aWV3cG9ydFJlY3Q6IERpbWVuc2lvbnM7XG5cbiAgLyoqIENhY2hlZCBjb250YWluZXIgZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF9jb250YWluZXJSZWN0OiBEaW1lbnNpb25zO1xuXG4gIC8qKiBBbW91bnQgb2Ygc3BhY2UgdGhhdCBtdXN0IGJlIG1haW50YWluZWQgYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF92aWV3cG9ydE1hcmdpbiA9IDA7XG5cbiAgLyoqIFRoZSBTY3JvbGxhYmxlIGNvbnRhaW5lcnMgdXNlZCB0byBjaGVjayBzY3JvbGxhYmxlIHZpZXcgcHJvcGVydGllcyBvbiBwb3NpdGlvbiBjaGFuZ2UuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVzOiBDZGtTY3JvbGxhYmxlW10gPSBbXTtcblxuICAvKiogT3JkZXJlZCBsaXN0IG9mIHByZWZlcnJlZCBwb3NpdGlvbnMsIGZyb20gbW9zdCB0byBsZWFzdCBkZXNpcmFibGUuICovXG4gIF9wcmVmZXJyZWRQb3NpdGlvbnM6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSA9IFtdO1xuXG4gIC8qKiBUaGUgb3JpZ2luIGVsZW1lbnQgYWdhaW5zdCB3aGljaCB0aGUgb3ZlcmxheSB3aWxsIGJlIHBvc2l0aW9uZWQuICovXG4gIF9vcmlnaW46IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbjtcblxuICAvKiogVGhlIG92ZXJsYXkgcGFuZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wYW5lOiBIVE1MRWxlbWVudDtcblxuICAvKiogV2hldGhlciB0aGUgc3RyYXRlZ3kgaGFzIGJlZW4gZGlzcG9zZWQgb2YgYWxyZWFkeS4gKi9cbiAgcHJpdmF0ZSBfaXNEaXNwb3NlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogUGFyZW50IGVsZW1lbnQgZm9yIHRoZSBvdmVybGF5IHBhbmVsIHVzZWQgdG8gY29uc3RyYWluIHRoZSBvdmVybGF5IHBhbmVsJ3Mgc2l6ZSB0byBmaXRcbiAgICogd2l0aGluIHRoZSB2aWV3cG9ydC5cbiAgICovXG4gIHByaXZhdGUgX2JvdW5kaW5nQm94OiBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgLyoqIFRoZSBsYXN0IHBvc2l0aW9uIHRvIGhhdmUgYmVlbiBjYWxjdWxhdGVkIGFzIHRoZSBiZXN0IGZpdCBwb3NpdGlvbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdFBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbiB8IG51bGw7XG5cbiAgLyoqIFRoZSBsYXN0IGNhbGN1bGF0ZWQgc2Nyb2xsIHZpc2liaWxpdHkuIE9ubHkgdHJhY2tlZCAgKi9cbiAgcHJpdmF0ZSBfbGFzdFNjcm9sbFZpc2liaWxpdHk6IFNjcm9sbGluZ1Zpc2liaWxpdHkgfCBudWxsO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIHBvc2l0aW9uIGNoYW5nZXMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3Bvc2l0aW9uQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4oKTtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHZpZXdwb3J0IHNpemUgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuXG4gIC8qKiBEZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkgYWxvbmcgdGhlIHggYXhpcy4gKi9cbiAgcHJpdmF0ZSBfb2Zmc2V0WCA9IDA7XG5cbiAgLyoqIERlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSBhbG9uZyB0aGUgeSBheGlzLiAqL1xuICBwcml2YXRlIF9vZmZzZXRZID0gMDtcblxuICAvKiogU2VsZWN0b3IgdG8gYmUgdXNlZCB3aGVuIGZpbmRpbmcgdGhlIGVsZW1lbnRzIG9uIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi4gKi9cbiAgcHJpdmF0ZSBfdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3I6IHN0cmluZztcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIENTUyBjbGFzc2VzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGhhcyBhcHBsaWVkIG9uIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9hcHBsaWVkUGFuZWxDbGFzc2VzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8qKiBBbW91bnQgYnkgd2hpY2ggdGhlIG92ZXJsYXkgd2FzIHB1c2hlZCBpbiBlYWNoIGF4aXMgZHVyaW5nIHRoZSBsYXN0IHRpbWUgaXQgd2FzIHBvc2l0aW9uZWQuICovXG4gIHByaXZhdGUgX3ByZXZpb3VzUHVzaEFtb3VudDoge3g6IG51bWJlcjsgeTogbnVtYmVyfSB8IG51bGw7XG5cbiAgLyoqIE9ic2VydmFibGUgc2VxdWVuY2Ugb2YgcG9zaXRpb24gY2hhbmdlcy4gKi9cbiAgcG9zaXRpb25DaGFuZ2VzOiBPYnNlcnZhYmxlPENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4gPSB0aGlzLl9wb3NpdGlvbkNoYW5nZXM7XG5cbiAgLyoqIE9yZGVyZWQgbGlzdCBvZiBwcmVmZXJyZWQgcG9zaXRpb25zLCBmcm9tIG1vc3QgdG8gbGVhc3QgZGVzaXJhYmxlLiAqL1xuICBnZXQgcG9zaXRpb25zKCk6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucztcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbm5lY3RlZFRvOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4sXG4gICAgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgX292ZXJsYXlDb250YWluZXI6IE92ZXJsYXlDb250YWluZXIsXG4gICkge1xuICAgIHRoaXMuc2V0T3JpZ2luKGNvbm5lY3RlZFRvKTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGlzIHBvc2l0aW9uIHN0cmF0ZWd5IHRvIGFuIG92ZXJsYXkuICovXG4gIGF0dGFjaChvdmVybGF5UmVmOiBPdmVybGF5UmVmKTogdm9pZCB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fb3ZlcmxheVJlZiAmJlxuICAgICAgb3ZlcmxheVJlZiAhPT0gdGhpcy5fb3ZlcmxheVJlZiAmJlxuICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSlcbiAgICApIHtcbiAgICAgIHRocm93IEVycm9yKCdUaGlzIHBvc2l0aW9uIHN0cmF0ZWd5IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYW4gb3ZlcmxheScpO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlUG9zaXRpb25zKCk7XG5cbiAgICBvdmVybGF5UmVmLmhvc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoYm91bmRpbmdCb3hDbGFzcyk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gb3ZlcmxheVJlZjtcbiAgICB0aGlzLl9ib3VuZGluZ0JveCA9IG92ZXJsYXlSZWYuaG9zdEVsZW1lbnQ7XG4gICAgdGhpcy5fcGFuZSA9IG92ZXJsYXlSZWYub3ZlcmxheUVsZW1lbnQ7XG4gICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2lzSW5pdGlhbFJlbmRlciA9IHRydWU7XG4gICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmNoYW5nZSgpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAvLyBXaGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZCwgd2Ugd2FudCB0byB0cmlnZ2VyIHRoZSBuZXh0IHJlcG9zaXRpb24gYXMgaWYgaXRcbiAgICAgIC8vIHdhcyBhbiBpbml0aWFsIHJlbmRlciwgaW4gb3JkZXIgZm9yIHRoZSBzdHJhdGVneSB0byBwaWNrIGEgbmV3IG9wdGltYWwgcG9zaXRpb24sXG4gICAgICAvLyBvdGhlcndpc2UgcG9zaXRpb24gbG9ja2luZyB3aWxsIGNhdXNlIGl0IHRvIHN0YXkgYXQgdGhlIG9sZCBvbmUuXG4gICAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSB0cnVlO1xuICAgICAgdGhpcy5hcHBseSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBvdmVybGF5IGVsZW1lbnQsIHVzaW5nIHdoaWNoZXZlciBwcmVmZXJyZWQgcG9zaXRpb24gcmVsYXRpdmVcbiAgICogdG8gdGhlIG9yaWdpbiBiZXN0IGZpdHMgb24tc2NyZWVuLlxuICAgKlxuICAgKiBUaGUgc2VsZWN0aW9uIG9mIGEgcG9zaXRpb24gZ29lcyBhcyBmb2xsb3dzOlxuICAgKiAgLSBJZiBhbnkgcG9zaXRpb25zIGZpdCBjb21wbGV0ZWx5IHdpdGhpbiB0aGUgdmlld3BvcnQgYXMtaXMsXG4gICAqICAgICAgY2hvb3NlIHRoZSBmaXJzdCBwb3NpdGlvbiB0aGF0IGRvZXMgc28uXG4gICAqICAtIElmIGZsZXhpYmxlIGRpbWVuc2lvbnMgYXJlIGVuYWJsZWQgYW5kIGF0IGxlYXN0IG9uZSBzYXRpc2ZpZXMgdGhlIGdpdmVuIG1pbmltdW0gd2lkdGgvaGVpZ2h0LFxuICAgKiAgICAgIGNob29zZSB0aGUgcG9zaXRpb24gd2l0aCB0aGUgZ3JlYXRlc3QgYXZhaWxhYmxlIHNpemUgbW9kaWZpZWQgYnkgdGhlIHBvc2l0aW9ucycgd2VpZ2h0LlxuICAgKiAgLSBJZiBwdXNoaW5nIGlzIGVuYWJsZWQsIHRha2UgdGhlIHBvc2l0aW9uIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdCBhbmQgcHVzaCBpdFxuICAgKiAgICAgIG9uLXNjcmVlbi5cbiAgICogIC0gSWYgbm9uZSBvZiB0aGUgcHJldmlvdXMgY3JpdGVyaWEgd2VyZSBtZXQsIHVzZSB0aGUgcG9zaXRpb24gdGhhdCBnb2VzIG9mZi1zY3JlZW4gdGhlIGxlYXN0LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBhcHBseSgpOiB2b2lkIHtcbiAgICAvLyBXZSBzaG91bGRuJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHN0cmF0ZWd5IHdhcyBkaXNwb3NlZCBvciB3ZSdyZSBvbiB0aGUgc2VydmVyLlxuICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkIHx8ICF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcG9zaXRpb24gaGFzIGJlZW4gYXBwbGllZCBhbHJlYWR5IChlLmcuIHdoZW4gdGhlIG92ZXJsYXkgd2FzIG9wZW5lZCkgYW5kIHRoZVxuICAgIC8vIGNvbnN1bWVyIG9wdGVkIGludG8gbG9ja2luZyBpbiB0aGUgcG9zaXRpb24sIHJlLXVzZSB0aGUgb2xkIHBvc2l0aW9uLCBpbiBvcmRlciB0b1xuICAgIC8vIHByZXZlbnQgdGhlIG92ZXJsYXkgZnJvbSBqdW1waW5nIGFyb3VuZC5cbiAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiB0aGlzLl9wb3NpdGlvbkxvY2tlZCAmJiB0aGlzLl9sYXN0UG9zaXRpb24pIHtcbiAgICAgIHRoaXMucmVhcHBseUxhc3RQb3NpdGlvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyUGFuZWxDbGFzc2VzKCk7XG4gICAgdGhpcy5fcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpO1xuICAgIHRoaXMuX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXMoKTtcblxuICAgIC8vIFdlIG5lZWQgdGhlIGJvdW5kaW5nIHJlY3RzIGZvciB0aGUgb3JpZ2luLCB0aGUgb3ZlcmxheSBhbmQgdGhlIGNvbnRhaW5lciB0byBkZXRlcm1pbmUgaG93IHRvIHBvc2l0aW9uXG4gICAgLy8gdGhlIG92ZXJsYXkgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbi5cbiAgICAvLyBXZSB1c2UgdGhlIHZpZXdwb3J0IHJlY3QgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBwb3NpdGlvbiB3b3VsZCBnbyBvZmYtc2NyZWVuLlxuICAgIHRoaXMuX3ZpZXdwb3J0UmVjdCA9IHRoaXMuX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk7XG4gICAgdGhpcy5fb3JpZ2luUmVjdCA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICB0aGlzLl9vdmVybGF5UmVjdCA9IHRoaXMuX3BhbmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdGhpcy5fY29udGFpbmVyUmVjdCA9IHRoaXMuX292ZXJsYXlDb250YWluZXIuZ2V0Q29udGFpbmVyRWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgY29uc3Qgb3JpZ2luUmVjdCA9IHRoaXMuX29yaWdpblJlY3Q7XG4gICAgY29uc3Qgb3ZlcmxheVJlY3QgPSB0aGlzLl9vdmVybGF5UmVjdDtcbiAgICBjb25zdCB2aWV3cG9ydFJlY3QgPSB0aGlzLl92aWV3cG9ydFJlY3Q7XG4gICAgY29uc3QgY29udGFpbmVyUmVjdCA9IHRoaXMuX2NvbnRhaW5lclJlY3Q7XG5cbiAgICAvLyBQb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLlxuICAgIGNvbnN0IGZsZXhpYmxlRml0czogRmxleGlibGVGaXRbXSA9IFtdO1xuXG4gICAgLy8gRmFsbGJhY2sgaWYgbm9uZSBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC5cbiAgICBsZXQgZmFsbGJhY2s6IEZhbGxiYWNrUG9zaXRpb24gfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGVhY2ggb2YgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgbG9va2luZyBmb3IgYSBnb29kIGZpdC5cbiAgICAvLyBJZiBhIGdvb2QgZml0IGlzIGZvdW5kLCBpdCB3aWxsIGJlIGFwcGxpZWQgaW1tZWRpYXRlbHkuXG4gICAgZm9yIChsZXQgcG9zIG9mIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucykge1xuICAgICAgLy8gR2V0IHRoZSBleGFjdCAoeCwgeSkgY29vcmRpbmF0ZSBmb3IgdGhlIHBvaW50LW9mLW9yaWdpbiBvbiB0aGUgb3JpZ2luIGVsZW1lbnQuXG4gICAgICBsZXQgb3JpZ2luUG9pbnQgPSB0aGlzLl9nZXRPcmlnaW5Qb2ludChvcmlnaW5SZWN0LCBjb250YWluZXJSZWN0LCBwb3MpO1xuXG4gICAgICAvLyBGcm9tIHRoYXQgcG9pbnQtb2Ytb3JpZ2luLCBnZXQgdGhlIGV4YWN0ICh4LCB5KSBjb29yZGluYXRlIGZvciB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIHRoZVxuICAgICAgLy8gb3ZlcmxheSBpbiB0aGlzIHBvc2l0aW9uLiBXZSB1c2UgdGhlIHRvcC1sZWZ0IGNvcm5lciBmb3IgY2FsY3VsYXRpb25zIGFuZCBsYXRlciB0cmFuc2xhdGVcbiAgICAgIC8vIHRoaXMgaW50byBhbiBhcHByb3ByaWF0ZSAodG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0KSBzdHlsZS5cbiAgICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIG92ZXJsYXlSZWN0LCBwb3MpO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgaG93IHdlbGwgdGhlIG92ZXJsYXkgd291bGQgZml0IGludG8gdGhlIHZpZXdwb3J0IHdpdGggdGhpcyBwb2ludC5cbiAgICAgIGxldCBvdmVybGF5Rml0ID0gdGhpcy5fZ2V0T3ZlcmxheUZpdChvdmVybGF5UG9pbnQsIG92ZXJsYXlSZWN0LCB2aWV3cG9ydFJlY3QsIHBvcyk7XG5cbiAgICAgIC8vIElmIHRoZSBvdmVybGF5LCB3aXRob3V0IGFueSBmdXJ0aGVyIHdvcmssIGZpdHMgaW50byB0aGUgdmlld3BvcnQsIHVzZSB0aGlzIHBvc2l0aW9uLlxuICAgICAgaWYgKG92ZXJsYXlGaXQuaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQpIHtcbiAgICAgICAgdGhpcy5faXNQdXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihwb3MsIG9yaWdpblBvaW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgb3ZlcmxheSBoYXMgZmxleGlibGUgZGltZW5zaW9ucywgd2UgY2FuIHVzZSB0aGlzIHBvc2l0aW9uXG4gICAgICAvLyBzbyBsb25nIGFzIHRoZXJlJ3MgZW5vdWdoIHNwYWNlIGZvciB0aGUgbWluaW11bSBkaW1lbnNpb25zLlxuICAgICAgaWYgKHRoaXMuX2NhbkZpdFdpdGhGbGV4aWJsZURpbWVuc2lvbnMob3ZlcmxheUZpdCwgb3ZlcmxheVBvaW50LCB2aWV3cG9ydFJlY3QpKSB7XG4gICAgICAgIC8vIFNhdmUgcG9zaXRpb25zIHdoZXJlIHRoZSBvdmVybGF5IHdpbGwgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucy4gV2Ugd2lsbCB1c2UgdGhlc2VcbiAgICAgICAgLy8gaWYgbm9uZSBvZiB0aGUgcG9zaXRpb25zIGZpdCAqd2l0aG91dCogZmxleGlibGUgZGltZW5zaW9ucy5cbiAgICAgICAgZmxleGlibGVGaXRzLnB1c2goe1xuICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgb3JpZ2luOiBvcmlnaW5Qb2ludCxcbiAgICAgICAgICBvdmVybGF5UmVjdCxcbiAgICAgICAgICBib3VuZGluZ0JveFJlY3Q6IHRoaXMuX2NhbGN1bGF0ZUJvdW5kaW5nQm94UmVjdChvcmlnaW5Qb2ludCwgcG9zKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBjdXJyZW50IHByZWZlcnJlZCBwb3NpdGlvbiBkb2VzIG5vdCBmaXQgb24gdGhlIHNjcmVlbiwgcmVtZW1iZXIgdGhlIHBvc2l0aW9uXG4gICAgICAvLyBpZiBpdCBoYXMgbW9yZSB2aXNpYmxlIGFyZWEgb24tc2NyZWVuIHRoYW4gd2UndmUgc2VlbiBhbmQgbW92ZSBvbnRvIHRoZSBuZXh0IHByZWZlcnJlZFxuICAgICAgLy8gcG9zaXRpb24uXG4gICAgICBpZiAoIWZhbGxiYWNrIHx8IGZhbGxiYWNrLm92ZXJsYXlGaXQudmlzaWJsZUFyZWEgPCBvdmVybGF5Rml0LnZpc2libGVBcmVhKSB7XG4gICAgICAgIGZhbGxiYWNrID0ge292ZXJsYXlGaXQsIG92ZXJsYXlQb2ludCwgb3JpZ2luUG9pbnQsIHBvc2l0aW9uOiBwb3MsIG92ZXJsYXlSZWN0fTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgYW55IHBvc2l0aW9ucyB3aGVyZSB0aGUgb3ZlcmxheSB3b3VsZCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLCBjaG9vc2UgdGhlXG4gICAgLy8gb25lIHRoYXQgaGFzIHRoZSBncmVhdGVzdCBhcmVhIGF2YWlsYWJsZSBtb2RpZmllZCBieSB0aGUgcG9zaXRpb24ncyB3ZWlnaHRcbiAgICBpZiAoZmxleGlibGVGaXRzLmxlbmd0aCkge1xuICAgICAgbGV0IGJlc3RGaXQ6IEZsZXhpYmxlRml0IHwgbnVsbCA9IG51bGw7XG4gICAgICBsZXQgYmVzdFNjb3JlID0gLTE7XG4gICAgICBmb3IgKGNvbnN0IGZpdCBvZiBmbGV4aWJsZUZpdHMpIHtcbiAgICAgICAgY29uc3Qgc2NvcmUgPVxuICAgICAgICAgIGZpdC5ib3VuZGluZ0JveFJlY3Qud2lkdGggKiBmaXQuYm91bmRpbmdCb3hSZWN0LmhlaWdodCAqIChmaXQucG9zaXRpb24ud2VpZ2h0IHx8IDEpO1xuICAgICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgICBiZXN0Rml0ID0gZml0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2lzUHVzaGVkID0gZmFsc2U7XG4gICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGJlc3RGaXQhLnBvc2l0aW9uLCBiZXN0Rml0IS5vcmlnaW4pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdoZW4gbm9uZSBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCwgdGFrZSB0aGUgcG9zaXRpb25cbiAgICAvLyB0aGF0IHdlbnQgb2ZmLXNjcmVlbiB0aGUgbGVhc3QgYW5kIGF0dGVtcHQgdG8gcHVzaCBpdCBvbi1zY3JlZW4uXG4gICAgaWYgKHRoaXMuX2NhblB1c2gpIHtcbiAgICAgIC8vIFRPRE8oamVsYm91cm4pOiBhZnRlciBwdXNoaW5nLCB0aGUgb3BlbmluZyBcImRpcmVjdGlvblwiIG9mIHRoZSBvdmVybGF5IG1pZ2h0IG5vdCBtYWtlIHNlbnNlLlxuICAgICAgdGhpcy5faXNQdXNoZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihmYWxsYmFjayEucG9zaXRpb24sIGZhbGxiYWNrIS5vcmlnaW5Qb2ludCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWxsIG9wdGlvbnMgZm9yIGdldHRpbmcgdGhlIG92ZXJsYXkgd2l0aGluIHRoZSB2aWV3cG9ydCBoYXZlIGJlZW4gZXhoYXVzdGVkLCBzbyBnbyB3aXRoIHRoZVxuICAgIC8vIHBvc2l0aW9uIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdC5cbiAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGZhbGxiYWNrIS5wb3NpdGlvbiwgZmFsbGJhY2shLm9yaWdpblBvaW50KTtcbiAgfVxuXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLl9jbGVhclBhbmVsQ2xhc3NlcygpO1xuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ID0gbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBDbGVhbnVwIGFmdGVyIHRoZSBlbGVtZW50IGdldHMgZGVzdHJveWVkLiAqL1xuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgY2FuJ3QgdXNlIGBfcmVzZXRCb3VuZGluZ0JveFN0eWxlc2AgaGVyZSwgYmVjYXVzZSBpdCByZXNldHNcbiAgICAvLyBzb21lIHByb3BlcnRpZXMgdG8gemVybywgcmF0aGVyIHRoYW4gcmVtb3ZpbmcgdGhlbS5cbiAgICBpZiAodGhpcy5fYm91bmRpbmdCb3gpIHtcbiAgICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveC5zdHlsZSwge1xuICAgICAgICB0b3A6ICcnLFxuICAgICAgICBsZWZ0OiAnJyxcbiAgICAgICAgcmlnaHQ6ICcnLFxuICAgICAgICBib3R0b206ICcnLFxuICAgICAgICBoZWlnaHQ6ICcnLFxuICAgICAgICB3aWR0aDogJycsXG4gICAgICAgIGFsaWduSXRlbXM6ICcnLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJycsXG4gICAgICB9IGFzIENTU1N0eWxlRGVjbGFyYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl9yZXNldE92ZXJsYXlFbGVtZW50U3R5bGVzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuaG9zdEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShib3VuZGluZ0JveENsYXNzKTtcbiAgICB9XG5cbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX292ZXJsYXlSZWYgPSB0aGlzLl9ib3VuZGluZ0JveCA9IG51bGwhO1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgcmUtYWxpZ25zIHRoZSBvdmVybGF5IGVsZW1lbnQgd2l0aCB0aGUgdHJpZ2dlciBpbiBpdHMgbGFzdCBjYWxjdWxhdGVkIHBvc2l0aW9uLFxuICAgKiBldmVuIGlmIGEgcG9zaXRpb24gaGlnaGVyIGluIHRoZSBcInByZWZlcnJlZCBwb3NpdGlvbnNcIiBsaXN0IHdvdWxkIG5vdyBmaXQuIFRoaXNcbiAgICogYWxsb3dzIG9uZSB0byByZS1hbGlnbiB0aGUgcGFuZWwgd2l0aG91dCBjaGFuZ2luZyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIHBhbmVsLlxuICAgKi9cbiAgcmVhcHBseUxhc3RQb3NpdGlvbigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faXNEaXNwb3NlZCB8fCAhdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGFzdFBvc2l0aW9uID0gdGhpcy5fbGFzdFBvc2l0aW9uO1xuXG4gICAgaWYgKGxhc3RQb3NpdGlvbikge1xuICAgICAgdGhpcy5fb3JpZ2luUmVjdCA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWN0ID0gdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHRoaXMuX3ZpZXdwb3J0UmVjdCA9IHRoaXMuX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk7XG4gICAgICB0aGlzLl9jb250YWluZXJSZWN0ID0gdGhpcy5fb3ZlcmxheUNvbnRhaW5lci5nZXRDb250YWluZXJFbGVtZW50KCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgIGNvbnN0IG9yaWdpblBvaW50ID0gdGhpcy5fZ2V0T3JpZ2luUG9pbnQodGhpcy5fb3JpZ2luUmVjdCwgdGhpcy5fY29udGFpbmVyUmVjdCwgbGFzdFBvc2l0aW9uKTtcbiAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24obGFzdFBvc2l0aW9uLCBvcmlnaW5Qb2ludCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXBwbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbGlzdCBvZiBTY3JvbGxhYmxlIGNvbnRhaW5lcnMgdGhhdCBob3N0IHRoZSBvcmlnaW4gZWxlbWVudCBzbyB0aGF0XG4gICAqIG9uIHJlcG9zaXRpb24gd2UgY2FuIGV2YWx1YXRlIGlmIGl0IG9yIHRoZSBvdmVybGF5IGhhcyBiZWVuIGNsaXBwZWQgb3Igb3V0c2lkZSB2aWV3LiBFdmVyeVxuICAgKiBTY3JvbGxhYmxlIG11c3QgYmUgYW4gYW5jZXN0b3IgZWxlbWVudCBvZiB0aGUgc3RyYXRlZ3kncyBvcmlnaW4gZWxlbWVudC5cbiAgICovXG4gIHdpdGhTY3JvbGxhYmxlQ29udGFpbmVycyhzY3JvbGxhYmxlczogQ2RrU2Nyb2xsYWJsZVtdKTogdGhpcyB7XG4gICAgdGhpcy5fc2Nyb2xsYWJsZXMgPSBzY3JvbGxhYmxlcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5ldyBwcmVmZXJyZWQgcG9zaXRpb25zLlxuICAgKiBAcGFyYW0gcG9zaXRpb25zIExpc3Qgb2YgcG9zaXRpb25zIG9wdGlvbnMgZm9yIHRoaXMgb3ZlcmxheS5cbiAgICovXG4gIHdpdGhQb3NpdGlvbnMocG9zaXRpb25zOiBDb25uZWN0ZWRQb3NpdGlvbltdKTogdGhpcyB7XG4gICAgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zID0gcG9zaXRpb25zO1xuXG4gICAgLy8gSWYgdGhlIGxhc3QgY2FsY3VsYXRlZCBwb3NpdGlvbiBvYmplY3QgaXNuJ3QgcGFydCBvZiB0aGUgcG9zaXRpb25zIGFueW1vcmUsIGNsZWFyXG4gICAgLy8gaXQgaW4gb3JkZXIgdG8gYXZvaWQgaXQgYmVpbmcgcGlja2VkIHVwIGlmIHRoZSBjb25zdW1lciB0cmllcyB0byByZS1hcHBseS5cbiAgICBpZiAocG9zaXRpb25zLmluZGV4T2YodGhpcy5fbGFzdFBvc2l0aW9uISkgPT09IC0xKSB7XG4gICAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlUG9zaXRpb25zKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbWluaW11bSBkaXN0YW5jZSB0aGUgb3ZlcmxheSBtYXkgYmUgcG9zaXRpb25lZCB0byB0aGUgZWRnZSBvZiB0aGUgdmlld3BvcnQuXG4gICAqIEBwYXJhbSBtYXJnaW4gUmVxdWlyZWQgbWFyZ2luIGJldHdlZW4gdGhlIG92ZXJsYXkgYW5kIHRoZSB2aWV3cG9ydCBlZGdlIGluIHBpeGVscy5cbiAgICovXG4gIHdpdGhWaWV3cG9ydE1hcmdpbihtYXJnaW46IG51bWJlcik6IHRoaXMge1xuICAgIHRoaXMuX3ZpZXdwb3J0TWFyZ2luID0gbWFyZ2luO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSdzIHdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGNvbnN0cmFpbmVkIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICB3aXRoRmxleGlibGVEaW1lbnNpb25zKGZsZXhpYmxlRGltZW5zaW9ucyA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMgPSBmbGV4aWJsZURpbWVuc2lvbnM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IGFmdGVyIHRoZSBpbml0aWFsIG9wZW4gdmlhIGZsZXhpYmxlIHdpZHRoL2hlaWdodC4gKi9cbiAgd2l0aEdyb3dBZnRlck9wZW4oZ3Jvd0FmdGVyT3BlbiA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9ncm93QWZ0ZXJPcGVuID0gZ3Jvd0FmdGVyT3BlbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gaWYgbm9uZSBvZiB0aGUgcHJvdmlkZWQgcG9zaXRpb25zIGZpdC4gKi9cbiAgd2l0aFB1c2goY2FuUHVzaCA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9jYW5QdXNoID0gY2FuUHVzaDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkncyBwb3NpdGlvbiBzaG91bGQgYmUgbG9ja2VkIGluIGFmdGVyIGl0IGlzIHBvc2l0aW9uZWRcbiAgICogaW5pdGlhbGx5LiBXaGVuIGFuIG92ZXJsYXkgaXMgbG9ja2VkIGluLCBpdCB3b24ndCBhdHRlbXB0IHRvIHJlcG9zaXRpb24gaXRzZWxmXG4gICAqIHdoZW4gdGhlIHBvc2l0aW9uIGlzIHJlLWFwcGxpZWQgKGUuZy4gd2hlbiB0aGUgdXNlciBzY3JvbGxzIGF3YXkpLlxuICAgKiBAcGFyYW0gaXNMb2NrZWQgV2hldGhlciB0aGUgb3ZlcmxheSBzaG91bGQgbG9ja2VkIGluLlxuICAgKi9cbiAgd2l0aExvY2tlZFBvc2l0aW9uKGlzTG9ja2VkID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX3Bvc2l0aW9uTG9ja2VkID0gaXNMb2NrZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luLCByZWxhdGl2ZSB0byB3aGljaCB0byBwb3NpdGlvbiB0aGUgb3ZlcmxheS5cbiAgICogVXNpbmcgYW4gZWxlbWVudCBvcmlnaW4gaXMgdXNlZnVsIGZvciBidWlsZGluZyBjb21wb25lbnRzIHRoYXQgbmVlZCB0byBiZSBwb3NpdGlvbmVkXG4gICAqIHJlbGF0aXZlbHkgdG8gYSB0cmlnZ2VyIChlLmcuIGRyb3Bkb3duIG1lbnVzIG9yIHRvb2x0aXBzKSwgd2hlcmVhcyB1c2luZyBhIHBvaW50IGNhbiBiZVxuICAgKiB1c2VkIGZvciBjYXNlcyBsaWtlIGNvbnRleHR1YWwgbWVudXMgd2hpY2ggb3BlbiByZWxhdGl2ZSB0byB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBvcmlnaW4gUmVmZXJlbmNlIHRvIHRoZSBuZXcgb3JpZ2luLlxuICAgKi9cbiAgc2V0T3JpZ2luKG9yaWdpbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSdzIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHgtYXhpcy5cbiAgICogQHBhcmFtIG9mZnNldCBOZXcgb2Zmc2V0IGluIHRoZSBYIGF4aXMuXG4gICAqL1xuICB3aXRoRGVmYXVsdE9mZnNldFgob2Zmc2V0OiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9vZmZzZXRYID0gb2Zmc2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSdzIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHktYXhpcy5cbiAgICogQHBhcmFtIG9mZnNldCBOZXcgb2Zmc2V0IGluIHRoZSBZIGF4aXMuXG4gICAqL1xuICB3aXRoRGVmYXVsdE9mZnNldFkob2Zmc2V0OiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9vZmZzZXRZID0gb2Zmc2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhhdCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgc2hvdWxkIHNldCBhIGB0cmFuc2Zvcm0tb3JpZ2luYCBvbiBzb21lIGVsZW1lbnRzXG4gICAqIGluc2lkZSB0aGUgb3ZlcmxheSwgZGVwZW5kaW5nIG9uIHRoZSBjdXJyZW50IHBvc2l0aW9uIHRoYXQgaXMgYmVpbmcgYXBwbGllZC4gVGhpcyBpc1xuICAgKiB1c2VmdWwgZm9yIHRoZSBjYXNlcyB3aGVyZSB0aGUgb3JpZ2luIG9mIGFuIGFuaW1hdGlvbiBjYW4gY2hhbmdlIGRlcGVuZGluZyBvbiB0aGVcbiAgICogYWxpZ25tZW50IG9mIHRoZSBvdmVybGF5LlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgQ1NTIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZpbmQgdGhlIHRhcmdldFxuICAgKiAgICBlbGVtZW50cyBvbnRvIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi5cbiAgICovXG4gIHdpdGhUcmFuc2Zvcm1PcmlnaW5PbihzZWxlY3Rvcjogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSAoeCwgeSkgY29vcmRpbmF0ZSBvZiBhIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIG9yaWdpbiBiYXNlZCBvbiBhIHJlbGF0aXZlIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3JpZ2luUG9pbnQoXG4gICAgb3JpZ2luUmVjdDogRGltZW5zaW9ucyxcbiAgICBjb250YWluZXJSZWN0OiBEaW1lbnNpb25zLFxuICAgIHBvczogQ29ubmVjdGVkUG9zaXRpb24sXG4gICk6IFBvaW50IHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGlmIChwb3Mub3JpZ2luWCA9PSAnY2VudGVyJykge1xuICAgICAgLy8gTm90ZTogd2hlbiBjZW50ZXJpbmcgd2Ugc2hvdWxkIGFsd2F5cyB1c2UgdGhlIGBsZWZ0YFxuICAgICAgLy8gb2Zmc2V0LCBvdGhlcndpc2UgdGhlIHBvc2l0aW9uIHdpbGwgYmUgd3JvbmcgaW4gUlRMLlxuICAgICAgeCA9IG9yaWdpblJlY3QubGVmdCArIG9yaWdpblJlY3Qud2lkdGggLyAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdGFydFggPSB0aGlzLl9pc1J0bCgpID8gb3JpZ2luUmVjdC5yaWdodCA6IG9yaWdpblJlY3QubGVmdDtcbiAgICAgIGNvbnN0IGVuZFggPSB0aGlzLl9pc1J0bCgpID8gb3JpZ2luUmVjdC5sZWZ0IDogb3JpZ2luUmVjdC5yaWdodDtcbiAgICAgIHggPSBwb3Mub3JpZ2luWCA9PSAnc3RhcnQnID8gc3RhcnRYIDogZW5kWDtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHpvb21pbmcgaW4gU2FmYXJpIHRoZSBjb250YWluZXIgcmVjdGFuZ2xlIGNvbnRhaW5zIG5lZ2F0aXZlIHZhbHVlcyBmb3IgdGhlIHBvc2l0aW9uXG4gICAgLy8gYW5kIHdlIG5lZWQgdG8gcmUtYWRkIHRoZW0gdG8gdGhlIGNhbGN1bGF0ZWQgY29vcmRpbmF0ZXMuXG4gICAgaWYgKGNvbnRhaW5lclJlY3QubGVmdCA8IDApIHtcbiAgICAgIHggLT0gY29udGFpbmVyUmVjdC5sZWZ0O1xuICAgIH1cblxuICAgIGxldCB5OiBudW1iZXI7XG4gICAgaWYgKHBvcy5vcmlnaW5ZID09ICdjZW50ZXInKSB7XG4gICAgICB5ID0gb3JpZ2luUmVjdC50b3AgKyBvcmlnaW5SZWN0LmhlaWdodCAvIDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHkgPSBwb3Mub3JpZ2luWSA9PSAndG9wJyA/IG9yaWdpblJlY3QudG9wIDogb3JpZ2luUmVjdC5ib3R0b207XG4gICAgfVxuXG4gICAgLy8gTm9ybWFsbHkgdGhlIGNvbnRhaW5lclJlY3QncyB0b3AgdmFsdWUgd291bGQgYmUgemVybywgaG93ZXZlciB3aGVuIHRoZSBvdmVybGF5IGlzIGF0dGFjaGVkIHRvIGFuIGlucHV0XG4gICAgLy8gKGUuZy4gaW4gYW4gYXV0b2NvbXBsZXRlKSwgbW9iaWxlIGJyb3dzZXJzIHdpbGwgc2hpZnQgZXZlcnl0aGluZyBpbiBvcmRlciB0byBwdXQgdGhlIGlucHV0IGluIHRoZSBtaWRkbGVcbiAgICAvLyBvZiB0aGUgc2NyZWVuIGFuZCB0byBtYWtlIHNwYWNlIGZvciB0aGUgdmlydHVhbCBrZXlib2FyZC4gV2UgbmVlZCB0byBhY2NvdW50IGZvciB0aGlzIG9mZnNldCxcbiAgICAvLyBvdGhlcndpc2Ugb3VyIHBvc2l0aW9uaW5nIHdpbGwgYmUgdGhyb3duIG9mZi5cbiAgICAvLyBBZGRpdGlvbmFsbHksIHdoZW4gem9vbWluZyBpbiBTYWZhcmkgdGhpcyBmaXhlcyB0aGUgdmVydGljYWwgcG9zaXRpb24uXG4gICAgaWYgKGNvbnRhaW5lclJlY3QudG9wIDwgMCkge1xuICAgICAgeSAtPSBjb250YWluZXJSZWN0LnRvcDtcbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlICh4LCB5KSBjb29yZGluYXRlIG9mIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlIG92ZXJsYXkgZ2l2ZW4gYSBnaXZlbiBwb3NpdGlvbiBhbmRcbiAgICogb3JpZ2luIHBvaW50IHRvIHdoaWNoIHRoZSBvdmVybGF5IHNob3VsZCBiZSBjb25uZWN0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5UG9pbnQoXG4gICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgIG92ZXJsYXlSZWN0OiBEaW1lbnNpb25zLFxuICAgIHBvczogQ29ubmVjdGVkUG9zaXRpb24sXG4gICk6IFBvaW50IHtcbiAgICAvLyBDYWxjdWxhdGUgdGhlIChvdmVybGF5U3RhcnRYLCBvdmVybGF5U3RhcnRZKSwgdGhlIHN0YXJ0IG9mIHRoZVxuICAgIC8vIHBvdGVudGlhbCBvdmVybGF5IHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW4gcG9pbnQuXG4gICAgbGV0IG92ZXJsYXlTdGFydFg6IG51bWJlcjtcbiAgICBpZiAocG9zLm92ZXJsYXlYID09ICdjZW50ZXInKSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gLW92ZXJsYXlSZWN0LndpZHRoIC8gMjtcbiAgICB9IGVsc2UgaWYgKHBvcy5vdmVybGF5WCA9PT0gJ3N0YXJ0Jykge1xuICAgICAgb3ZlcmxheVN0YXJ0WCA9IHRoaXMuX2lzUnRsKCkgPyAtb3ZlcmxheVJlY3Qud2lkdGggOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IDAgOiAtb3ZlcmxheVJlY3Qud2lkdGg7XG4gICAgfVxuXG4gICAgbGV0IG92ZXJsYXlTdGFydFk6IG51bWJlcjtcbiAgICBpZiAocG9zLm92ZXJsYXlZID09ICdjZW50ZXInKSB7XG4gICAgICBvdmVybGF5U3RhcnRZID0gLW92ZXJsYXlSZWN0LmhlaWdodCAvIDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJsYXlTdGFydFkgPSBwb3Mub3ZlcmxheVkgPT0gJ3RvcCcgPyAwIDogLW92ZXJsYXlSZWN0LmhlaWdodDtcbiAgICB9XG5cbiAgICAvLyBUaGUgKHgsIHkpIGNvb3JkaW5hdGVzIG9mIHRoZSBvdmVybGF5LlxuICAgIHJldHVybiB7XG4gICAgICB4OiBvcmlnaW5Qb2ludC54ICsgb3ZlcmxheVN0YXJ0WCxcbiAgICAgIHk6IG9yaWdpblBvaW50LnkgKyBvdmVybGF5U3RhcnRZLFxuICAgIH07XG4gIH1cblxuICAvKiogR2V0cyBob3cgd2VsbCBhbiBvdmVybGF5IGF0IHRoZSBnaXZlbiBwb2ludCB3aWxsIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Rml0KFxuICAgIHBvaW50OiBQb2ludCxcbiAgICByYXdPdmVybGF5UmVjdDogRGltZW5zaW9ucyxcbiAgICB2aWV3cG9ydDogRGltZW5zaW9ucyxcbiAgICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sXG4gICk6IE92ZXJsYXlGaXQge1xuICAgIC8vIFJvdW5kIHRoZSBvdmVybGF5IHJlY3Qgd2hlbiBjb21wYXJpbmcgYWdhaW5zdCB0aGVcbiAgICAvLyB2aWV3cG9ydCwgYmVjYXVzZSB0aGUgdmlld3BvcnQgaXMgYWx3YXlzIHJvdW5kZWQuXG4gICAgY29uc3Qgb3ZlcmxheSA9IGdldFJvdW5kZWRCb3VuZGluZ0NsaWVudFJlY3QocmF3T3ZlcmxheVJlY3QpO1xuICAgIGxldCB7eCwgeX0gPSBwb2ludDtcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIC8vIEFjY291bnQgZm9yIHRoZSBvZmZzZXRzIHNpbmNlIHRoZXkgY291bGQgcHVzaCB0aGUgb3ZlcmxheSBvdXQgb2YgdGhlIHZpZXdwb3J0LlxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB4ICs9IG9mZnNldFg7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldFkpIHtcbiAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvLyBIb3cgbXVjaCB0aGUgb3ZlcmxheSB3b3VsZCBvdmVyZmxvdyBhdCB0aGlzIHBvc2l0aW9uLCBvbiBlYWNoIHNpZGUuXG4gICAgbGV0IGxlZnRPdmVyZmxvdyA9IDAgLSB4O1xuICAgIGxldCByaWdodE92ZXJmbG93ID0geCArIG92ZXJsYXkud2lkdGggLSB2aWV3cG9ydC53aWR0aDtcbiAgICBsZXQgdG9wT3ZlcmZsb3cgPSAwIC0geTtcbiAgICBsZXQgYm90dG9tT3ZlcmZsb3cgPSB5ICsgb3ZlcmxheS5oZWlnaHQgLSB2aWV3cG9ydC5oZWlnaHQ7XG5cbiAgICAvLyBWaXNpYmxlIHBhcnRzIG9mIHRoZSBlbGVtZW50IG9uIGVhY2ggYXhpcy5cbiAgICBsZXQgdmlzaWJsZVdpZHRoID0gdGhpcy5fc3VidHJhY3RPdmVyZmxvd3Mob3ZlcmxheS53aWR0aCwgbGVmdE92ZXJmbG93LCByaWdodE92ZXJmbG93KTtcbiAgICBsZXQgdmlzaWJsZUhlaWdodCA9IHRoaXMuX3N1YnRyYWN0T3ZlcmZsb3dzKG92ZXJsYXkuaGVpZ2h0LCB0b3BPdmVyZmxvdywgYm90dG9tT3ZlcmZsb3cpO1xuICAgIGxldCB2aXNpYmxlQXJlYSA9IHZpc2libGVXaWR0aCAqIHZpc2libGVIZWlnaHQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdmlzaWJsZUFyZWEsXG4gICAgICBpc0NvbXBsZXRlbHlXaXRoaW5WaWV3cG9ydDogb3ZlcmxheS53aWR0aCAqIG92ZXJsYXkuaGVpZ2h0ID09PSB2aXNpYmxlQXJlYSxcbiAgICAgIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogdmlzaWJsZUhlaWdodCA9PT0gb3ZlcmxheS5oZWlnaHQsXG4gICAgICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogdmlzaWJsZVdpZHRoID09IG92ZXJsYXkud2lkdGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCB3aGVuIGl0IG1heSByZXNpemUgZWl0aGVyIGl0cyB3aWR0aCBvciBoZWlnaHQuXG4gICAqIEBwYXJhbSBmaXQgSG93IHdlbGwgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvaW50IFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXkgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSBnZW9tZXRyeSBvZiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKGZpdDogT3ZlcmxheUZpdCwgcG9pbnQ6IFBvaW50LCB2aWV3cG9ydDogRGltZW5zaW9ucykge1xuICAgIGlmICh0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IHZpZXdwb3J0LmJvdHRvbSAtIHBvaW50Lnk7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gcG9pbnQueDtcbiAgICAgIGNvbnN0IG1pbkhlaWdodCA9IGdldFBpeGVsVmFsdWUodGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5taW5IZWlnaHQpO1xuICAgICAgY29uc3QgbWluV2lkdGggPSBnZXRQaXhlbFZhbHVlKHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWluV2lkdGgpO1xuXG4gICAgICBjb25zdCB2ZXJ0aWNhbEZpdCA9XG4gICAgICAgIGZpdC5maXRzSW5WaWV3cG9ydFZlcnRpY2FsbHkgfHwgKG1pbkhlaWdodCAhPSBudWxsICYmIG1pbkhlaWdodCA8PSBhdmFpbGFibGVIZWlnaHQpO1xuICAgICAgY29uc3QgaG9yaXpvbnRhbEZpdCA9XG4gICAgICAgIGZpdC5maXRzSW5WaWV3cG9ydEhvcml6b250YWxseSB8fCAobWluV2lkdGggIT0gbnVsbCAmJiBtaW5XaWR0aCA8PSBhdmFpbGFibGVXaWR0aCk7XG5cbiAgICAgIHJldHVybiB2ZXJ0aWNhbEZpdCAmJiBob3Jpem9udGFsRml0O1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcG9pbnQgYXQgd2hpY2ggdGhlIG92ZXJsYXkgY2FuIGJlIFwicHVzaGVkXCIgb24tc2NyZWVuLiBJZiB0aGUgb3ZlcmxheSBpcyBsYXJnZXIgdGhhblxuICAgKiB0aGUgdmlld3BvcnQsIHRoZSB0b3AtbGVmdCBjb3JuZXIgd2lsbCBiZSBwdXNoZWQgb24tc2NyZWVuICh3aXRoIG92ZXJmbG93IG9jY3VycmluZyBvbiB0aGVcbiAgICogcmlnaHQgYW5kIGJvdHRvbSkuXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydCBTdGFydGluZyBwb2ludCBmcm9tIHdoaWNoIHRoZSBvdmVybGF5IGlzIHB1c2hlZC5cbiAgICogQHBhcmFtIHJhd092ZXJsYXlSZWN0IERpbWVuc2lvbnMgb2YgdGhlIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBzY3JvbGxQb3NpdGlvbiBDdXJyZW50IHZpZXdwb3J0IHNjcm9sbCBwb3NpdGlvbi5cbiAgICogQHJldHVybnMgVGhlIHBvaW50IGF0IHdoaWNoIHRvIHBvc2l0aW9uIHRoZSBvdmVybGF5IGFmdGVyIHB1c2hpbmcuIFRoaXMgaXMgZWZmZWN0aXZlbHkgYSBuZXdcbiAgICogICAgIG9yaWdpblBvaW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHVzaE92ZXJsYXlPblNjcmVlbihcbiAgICBzdGFydDogUG9pbnQsXG4gICAgcmF3T3ZlcmxheVJlY3Q6IERpbWVuc2lvbnMsXG4gICAgc2Nyb2xsUG9zaXRpb246IFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24sXG4gICk6IFBvaW50IHtcbiAgICAvLyBJZiB0aGUgcG9zaXRpb24gaXMgbG9ja2VkIGFuZCB3ZSd2ZSBwdXNoZWQgdGhlIG92ZXJsYXkgYWxyZWFkeSwgcmV1c2UgdGhlIHByZXZpb3VzIHB1c2hcbiAgICAvLyBhbW91bnQsIHJhdGhlciB0aGFuIHB1c2hpbmcgaXQgYWdhaW4uIElmIHdlIHdlcmUgdG8gY29udGludWUgcHVzaGluZywgdGhlIGVsZW1lbnQgd291bGRcbiAgICAvLyByZW1haW4gaW4gdGhlIHZpZXdwb3J0LCB3aGljaCBnb2VzIGFnYWluc3QgdGhlIGV4cGVjdGF0aW9ucyB3aGVuIHBvc2l0aW9uIGxvY2tpbmcgaXMgZW5hYmxlZC5cbiAgICBpZiAodGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ICYmIHRoaXMuX3Bvc2l0aW9uTG9ja2VkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBzdGFydC54ICsgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50LngsXG4gICAgICAgIHk6IHN0YXJ0LnkgKyB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQueSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUm91bmQgdGhlIG92ZXJsYXkgcmVjdCB3aGVuIGNvbXBhcmluZyBhZ2FpbnN0IHRoZVxuICAgIC8vIHZpZXdwb3J0LCBiZWNhdXNlIHRoZSB2aWV3cG9ydCBpcyBhbHdheXMgcm91bmRlZC5cbiAgICBjb25zdCBvdmVybGF5ID0gZ2V0Um91bmRlZEJvdW5kaW5nQ2xpZW50UmVjdChyYXdPdmVybGF5UmVjdCk7XG4gICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLl92aWV3cG9ydFJlY3Q7XG5cbiAgICAvLyBEZXRlcm1pbmUgaG93IG11Y2ggdGhlIG92ZXJsYXkgZ29lcyBvdXRzaWRlIHRoZSB2aWV3cG9ydCBvbiBlYWNoXG4gICAgLy8gc2lkZSwgd2hpY2ggd2UnbGwgdXNlIHRvIGRlY2lkZSB3aGljaCBkaXJlY3Rpb24gdG8gcHVzaCBpdC5cbiAgICBjb25zdCBvdmVyZmxvd1JpZ2h0ID0gTWF0aC5tYXgoc3RhcnQueCArIG92ZXJsYXkud2lkdGggLSB2aWV3cG9ydC53aWR0aCwgMCk7XG4gICAgY29uc3Qgb3ZlcmZsb3dCb3R0b20gPSBNYXRoLm1heChzdGFydC55ICsgb3ZlcmxheS5oZWlnaHQgLSB2aWV3cG9ydC5oZWlnaHQsIDApO1xuICAgIGNvbnN0IG92ZXJmbG93VG9wID0gTWF0aC5tYXgodmlld3BvcnQudG9wIC0gc2Nyb2xsUG9zaXRpb24udG9wIC0gc3RhcnQueSwgMCk7XG4gICAgY29uc3Qgb3ZlcmZsb3dMZWZ0ID0gTWF0aC5tYXgodmlld3BvcnQubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQgLSBzdGFydC54LCAwKTtcblxuICAgIC8vIEFtb3VudCBieSB3aGljaCB0byBwdXNoIHRoZSBvdmVybGF5IGluIGVhY2ggYXhpcyBzdWNoIHRoYXQgaXQgcmVtYWlucyBvbi1zY3JlZW4uXG4gICAgbGV0IHB1c2hYID0gMDtcbiAgICBsZXQgcHVzaFkgPSAwO1xuXG4gICAgLy8gSWYgdGhlIG92ZXJsYXkgZml0cyBjb21wbGV0ZWx5IHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSB2aWV3cG9ydCwgcHVzaCBpdCBmcm9tIHdoaWNoZXZlclxuICAgIC8vIGRpcmVjdGlvbiBpcyBnb2VzIG9mZi1zY3JlZW4uIE90aGVyd2lzZSwgcHVzaCB0aGUgdG9wLWxlZnQgY29ybmVyIHN1Y2ggdGhhdCBpdHMgaW4gdGhlXG4gICAgLy8gdmlld3BvcnQgYW5kIGFsbG93IGZvciB0aGUgdHJhaWxpbmcgZW5kIG9mIHRoZSBvdmVybGF5IHRvIGdvIG91dCBvZiBib3VuZHMuXG4gICAgaWYgKG92ZXJsYXkud2lkdGggPD0gdmlld3BvcnQud2lkdGgpIHtcbiAgICAgIHB1c2hYID0gb3ZlcmZsb3dMZWZ0IHx8IC1vdmVyZmxvd1JpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBwdXNoWCA9IHN0YXJ0LnggPCB0aGlzLl92aWV3cG9ydE1hcmdpbiA/IHZpZXdwb3J0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0IC0gc3RhcnQueCA6IDA7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJsYXkuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkge1xuICAgICAgcHVzaFkgPSBvdmVyZmxvd1RvcCB8fCAtb3ZlcmZsb3dCb3R0b207XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hZID0gc3RhcnQueSA8IHRoaXMuX3ZpZXdwb3J0TWFyZ2luID8gdmlld3BvcnQudG9wIC0gc2Nyb2xsUG9zaXRpb24udG9wIC0gc3RhcnQueSA6IDA7XG4gICAgfVxuXG4gICAgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ID0ge3g6IHB1c2hYLCB5OiBwdXNoWX07XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogc3RhcnQueCArIHB1c2hYLFxuICAgICAgeTogc3RhcnQueSArIHB1c2hZLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGNvbXB1dGVkIHBvc2l0aW9uIHRvIHRoZSBvdmVybGF5IGFuZCBlbWl0cyBhIHBvc2l0aW9uIGNoYW5nZS5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBwcmVmZXJlbmNlXG4gICAqIEBwYXJhbSBvcmlnaW5Qb2ludCBUaGUgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHdoZXJlIHRoZSBvdmVybGF5IGlzIGNvbm5lY3RlZC5cbiAgICovXG4gIHByaXZhdGUgX2FwcGx5UG9zaXRpb24ocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLCBvcmlnaW5Qb2ludDogUG9pbnQpIHtcbiAgICB0aGlzLl9zZXRUcmFuc2Zvcm1PcmlnaW4ocG9zaXRpb24pO1xuICAgIHRoaXMuX3NldE92ZXJsYXlFbGVtZW50U3R5bGVzKG9yaWdpblBvaW50LCBwb3NpdGlvbik7XG4gICAgdGhpcy5fc2V0Qm91bmRpbmdCb3hTdHlsZXMob3JpZ2luUG9pbnQsIHBvc2l0aW9uKTtcblxuICAgIGlmIChwb3NpdGlvbi5wYW5lbENsYXNzKSB7XG4gICAgICB0aGlzLl9hZGRQYW5lbENsYXNzZXMocG9zaXRpb24ucGFuZWxDbGFzcyk7XG4gICAgfVxuXG4gICAgLy8gTm90aWZ5IHRoYXQgdGhlIHBvc2l0aW9uIGhhcyBiZWVuIGNoYW5nZWQgYWxvbmcgd2l0aCBpdHMgY2hhbmdlIHByb3BlcnRpZXMuXG4gICAgLy8gV2Ugb25seSBlbWl0IGlmIHdlJ3ZlIGdvdCBhbnkgc3Vic2NyaXB0aW9ucywgYmVjYXVzZSB0aGUgc2Nyb2xsIHZpc2liaWxpdHlcbiAgICAvLyBjYWxjdWxhdGlvbnMgY2FuIGJlIHNvbWV3aGF0IGV4cGVuc2l2ZS5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25DaGFuZ2VzLm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHNjcm9sbFZpc2liaWxpdHkgPSB0aGlzLl9nZXRTY3JvbGxWaXNpYmlsaXR5KCk7XG5cbiAgICAgIC8vIFdlJ3JlIHJlY2FsY3VsYXRpbmcgb24gc2Nyb2xsLCBidXQgd2Ugb25seSB3YW50IHRvIGVtaXQgaWYgYW55dGhpbmdcbiAgICAgIC8vIGNoYW5nZWQgc2luY2UgZG93bnN0cmVhbSBjb2RlIG1pZ2h0IGJlIGhpdHRpbmcgdGhlIGBOZ1pvbmVgLlxuICAgICAgaWYgKFxuICAgICAgICBwb3NpdGlvbiAhPT0gdGhpcy5fbGFzdFBvc2l0aW9uIHx8XG4gICAgICAgICF0aGlzLl9sYXN0U2Nyb2xsVmlzaWJpbGl0eSB8fFxuICAgICAgICAhY29tcGFyZVNjcm9sbFZpc2liaWxpdHkodGhpcy5fbGFzdFNjcm9sbFZpc2liaWxpdHksIHNjcm9sbFZpc2liaWxpdHkpXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgY2hhbmdlRXZlbnQgPSBuZXcgQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uLCBzY3JvbGxWaXNpYmlsaXR5KTtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25DaGFuZ2VzLm5leHQoY2hhbmdlRXZlbnQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9sYXN0U2Nyb2xsVmlzaWJpbGl0eSA9IHNjcm9sbFZpc2liaWxpdHk7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSB0aGUgbGFzdCBjb25uZWN0ZWQgcG9zaXRpb24gaW4gY2FzZSB0aGUgcG9zaXRpb24gbmVlZHMgdG8gYmUgcmUtY2FsY3VsYXRlZC5cbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSB0cmFuc2Zvcm0gb3JpZ2luIGJhc2VkIG9uIHRoZSBjb25maWd1cmVkIHNlbGVjdG9yIGFuZCB0aGUgcGFzc2VkLWluIHBvc2l0aW9uLiAgKi9cbiAgcHJpdmF0ZSBfc2V0VHJhbnNmb3JtT3JpZ2luKHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbikge1xuICAgIGlmICghdGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50czogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gPSB0aGlzLl9ib3VuZGluZ0JveCEucXVlcnlTZWxlY3RvckFsbChcbiAgICAgIHRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yLFxuICAgICk7XG4gICAgbGV0IHhPcmlnaW46ICdsZWZ0JyB8ICdyaWdodCcgfCAnY2VudGVyJztcbiAgICBsZXQgeU9yaWdpbjogJ3RvcCcgfCAnYm90dG9tJyB8ICdjZW50ZXInID0gcG9zaXRpb24ub3ZlcmxheVk7XG5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVggPT09ICdjZW50ZXInKSB7XG4gICAgICB4T3JpZ2luID0gJ2NlbnRlcic7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9pc1J0bCgpKSB7XG4gICAgICB4T3JpZ2luID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgIH0gZWxzZSB7XG4gICAgICB4T3JpZ2luID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgPyAnbGVmdCcgOiAncmlnaHQnO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsZW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9IGAke3hPcmlnaW59ICR7eU9yaWdpbn1gO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSdzIHNpemluZyBjb250YWluZXIuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGRvZXMgbm8gbWVhc3VyaW5nIGFuZCBhcHBsaWVzIG5vIHN0eWxlcyBzbyB0aGF0IHdlIGNhbiBjaGVhcGx5IGNvbXB1dGUgdGhlXG4gICAqIGJvdW5kcyBmb3IgYWxsIHBvc2l0aW9ucyBhbmQgY2hvb3NlIHRoZSBiZXN0IGZpdCBiYXNlZCBvbiB0aGVzZSByZXN1bHRzLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FsY3VsYXRlQm91bmRpbmdCb3hSZWN0KG9yaWdpbjogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IEJvdW5kaW5nQm94UmVjdCB7XG4gICAgY29uc3Qgdmlld3BvcnQgPSB0aGlzLl92aWV3cG9ydFJlY3Q7XG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLl9pc1J0bCgpO1xuICAgIGxldCBoZWlnaHQ6IG51bWJlciwgdG9wOiBudW1iZXIsIGJvdHRvbTogbnVtYmVyO1xuXG4gICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAndG9wJykge1xuICAgICAgLy8gT3ZlcmxheSBpcyBvcGVuaW5nIFwiZG93bndhcmRcIiBhbmQgdGh1cyBpcyBib3VuZCBieSB0aGUgYm90dG9tIHZpZXdwb3J0IGVkZ2UuXG4gICAgICB0b3AgPSBvcmlnaW4ueTtcbiAgICAgIGhlaWdodCA9IHZpZXdwb3J0LmhlaWdodCAtIHRvcCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nKSB7XG4gICAgICAvLyBPdmVybGF5IGlzIG9wZW5pbmcgXCJ1cHdhcmRcIiBhbmQgdGh1cyBpcyBib3VuZCBieSB0aGUgdG9wIHZpZXdwb3J0IGVkZ2UuIFdlIG5lZWQgdG8gYWRkXG4gICAgICAvLyB0aGUgdmlld3BvcnQgbWFyZ2luIGJhY2sgaW4sIGJlY2F1c2UgdGhlIHZpZXdwb3J0IHJlY3QgaXMgbmFycm93ZWQgZG93biB0byByZW1vdmUgdGhlXG4gICAgICAvLyBtYXJnaW4sIHdoZXJlYXMgdGhlIGBvcmlnaW5gIHBvc2l0aW9uIGlzIGNhbGN1bGF0ZWQgYmFzZWQgb24gaXRzIGBET01SZWN0YC5cbiAgICAgIGJvdHRvbSA9IHZpZXdwb3J0LmhlaWdodCAtIG9yaWdpbi55ICsgdGhpcy5fdmlld3BvcnRNYXJnaW4gKiAyO1xuICAgICAgaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0IC0gYm90dG9tICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5laXRoZXIgdG9wIG5vciBib3R0b20sIGl0IG1lYW5zIHRoYXQgdGhlIG92ZXJsYXkgaXMgdmVydGljYWxseSBjZW50ZXJlZCBvbiB0aGVcbiAgICAgIC8vIG9yaWdpbiBwb2ludC4gTm90ZSB0aGF0IHdlIHdhbnQgdGhlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCwgcmF0aGVyIHRoYW5cbiAgICAgIC8vIHRoZSBwYWdlLCB3aGljaCBpcyB3aHkgd2UgZG9uJ3QgdXNlIHNvbWV0aGluZyBsaWtlIGB2aWV3cG9ydC5ib3R0b20gLSBvcmlnaW4ueWAgYW5kXG4gICAgICAvLyBgb3JpZ2luLnkgLSB2aWV3cG9ydC50b3BgLlxuICAgICAgY29uc3Qgc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlID0gTWF0aC5taW4oXG4gICAgICAgIHZpZXdwb3J0LmJvdHRvbSAtIG9yaWdpbi55ICsgdmlld3BvcnQudG9wLFxuICAgICAgICBvcmlnaW4ueSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHByZXZpb3VzSGVpZ2h0ID0gdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQ7XG5cbiAgICAgIGhlaWdodCA9IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSAqIDI7XG4gICAgICB0b3AgPSBvcmlnaW4ueSAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKGhlaWdodCA+IHByZXZpb3VzSGVpZ2h0ICYmICF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgIXRoaXMuX2dyb3dBZnRlck9wZW4pIHtcbiAgICAgICAgdG9wID0gb3JpZ2luLnkgLSBwcmV2aW91c0hlaWdodCAvIDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIG92ZXJsYXkgaXMgb3BlbmluZyAncmlnaHQtd2FyZCcgKHRoZSBjb250ZW50IGZsb3dzIHRvIHRoZSByaWdodCkuXG4gICAgY29uc3QgaXNCb3VuZGVkQnlSaWdodFZpZXdwb3J0RWRnZSA9XG4gICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgJiYgIWlzUnRsKSB8fCAocG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnICYmIGlzUnRsKTtcblxuICAgIC8vIFRoZSBvdmVybGF5IGlzIG9wZW5pbmcgJ2xlZnQtd2FyZCcgKHRoZSBjb250ZW50IGZsb3dzIHRvIHRoZSBsZWZ0KS5cbiAgICBjb25zdCBpc0JvdW5kZWRCeUxlZnRWaWV3cG9ydEVkZ2UgPVxuICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyAmJiAhaXNSdGwpIHx8IChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyAmJiBpc1J0bCk7XG5cbiAgICBsZXQgd2lkdGg6IG51bWJlciwgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyO1xuXG4gICAgaWYgKGlzQm91bmRlZEJ5TGVmdFZpZXdwb3J0RWRnZSkge1xuICAgICAgcmlnaHQgPSB2aWV3cG9ydC53aWR0aCAtIG9yaWdpbi54ICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgICB3aWR0aCA9IG9yaWdpbi54IC0gdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIGlmIChpc0JvdW5kZWRCeVJpZ2h0Vmlld3BvcnRFZGdlKSB7XG4gICAgICBsZWZ0ID0gb3JpZ2luLng7XG4gICAgICB3aWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gb3JpZ2luLng7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5laXRoZXIgc3RhcnQgbm9yIGVuZCwgaXQgbWVhbnMgdGhhdCB0aGUgb3ZlcmxheSBpcyBob3Jpem9udGFsbHkgY2VudGVyZWQgb24gdGhlXG4gICAgICAvLyBvcmlnaW4gcG9pbnQuIE5vdGUgdGhhdCB3ZSB3YW50IHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQsIHJhdGhlciB0aGFuXG4gICAgICAvLyB0aGUgcGFnZSwgd2hpY2ggaXMgd2h5IHdlIGRvbid0IHVzZSBzb21ldGhpbmcgbGlrZSBgdmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueGAgYW5kXG4gICAgICAvLyBgb3JpZ2luLnggLSB2aWV3cG9ydC5sZWZ0YC5cbiAgICAgIGNvbnN0IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSA9IE1hdGgubWluKFxuICAgICAgICB2aWV3cG9ydC5yaWdodCAtIG9yaWdpbi54ICsgdmlld3BvcnQubGVmdCxcbiAgICAgICAgb3JpZ2luLngsXG4gICAgICApO1xuICAgICAgY29uc3QgcHJldmlvdXNXaWR0aCA9IHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUud2lkdGg7XG5cbiAgICAgIHdpZHRoID0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlICogMjtcbiAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKHdpZHRoID4gcHJldmlvdXNXaWR0aCAmJiAhdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIHByZXZpb3VzV2lkdGggLyAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7dG9wOiB0b3AhLCBsZWZ0OiBsZWZ0ISwgYm90dG9tOiBib3R0b20hLCByaWdodDogcmlnaHQhLCB3aWR0aCwgaGVpZ2h0fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSdzIHNpemluZyB3cmFwcGVyLiBUaGUgd3JhcHBlciBpcyBwb3NpdGlvbmVkIG9uIHRoZVxuICAgKiBvcmlnaW4ncyBjb25uZWN0aW9uIHBvaW50IGFuZCBzdHJldGNoZXMgdG8gdGhlIGJvdW5kcyBvZiB0aGUgdmlld3BvcnQuXG4gICAqXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIHBvaW50IG9uIHRoZSBvcmlnaW4gZWxlbWVudCB3aGVyZSB0aGUgb3ZlcmxheSBpcyBjb25uZWN0ZWQuXG4gICAqIEBwYXJhbSBwb3NpdGlvbiBUaGUgcG9zaXRpb24gcHJlZmVyZW5jZVxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Qm91bmRpbmdCb3hTdHlsZXMob3JpZ2luOiBQb2ludCwgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKTogdm9pZCB7XG4gICAgY29uc3QgYm91bmRpbmdCb3hSZWN0ID0gdGhpcy5fY2FsY3VsYXRlQm91bmRpbmdCb3hSZWN0KG9yaWdpbiwgcG9zaXRpb24pO1xuXG4gICAgLy8gSXQncyB3ZWlyZCBpZiB0aGUgb3ZlcmxheSAqZ3Jvd3MqIHdoaWxlIHNjcm9sbGluZywgc28gd2UgdGFrZSB0aGUgbGFzdCBzaXplIGludG8gYWNjb3VudFxuICAgIC8vIHdoZW4gYXBwbHlpbmcgYSBuZXcgc2l6ZS5cbiAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiAhdGhpcy5fZ3Jvd0FmdGVyT3Blbikge1xuICAgICAgYm91bmRpbmdCb3hSZWN0LmhlaWdodCA9IE1hdGgubWluKGJvdW5kaW5nQm94UmVjdC5oZWlnaHQsIHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUuaGVpZ2h0KTtcbiAgICAgIGJvdW5kaW5nQm94UmVjdC53aWR0aCA9IE1hdGgubWluKGJvdW5kaW5nQm94UmVjdC53aWR0aCwgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS53aWR0aCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3R5bGVzID0ge30gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbjtcblxuICAgIGlmICh0aGlzLl9oYXNFeGFjdFBvc2l0aW9uKCkpIHtcbiAgICAgIHN0eWxlcy50b3AgPSBzdHlsZXMubGVmdCA9ICcwJztcbiAgICAgIHN0eWxlcy5ib3R0b20gPSBzdHlsZXMucmlnaHQgPSBzdHlsZXMubWF4SGVpZ2h0ID0gc3R5bGVzLm1heFdpZHRoID0gJyc7XG4gICAgICBzdHlsZXMud2lkdGggPSBzdHlsZXMuaGVpZ2h0ID0gJzEwMCUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtYXhIZWlnaHQgPSB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLm1heEhlaWdodDtcbiAgICAgIGNvbnN0IG1heFdpZHRoID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5tYXhXaWR0aDtcblxuICAgICAgc3R5bGVzLmhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LmhlaWdodCk7XG4gICAgICBzdHlsZXMudG9wID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QudG9wKTtcbiAgICAgIHN0eWxlcy5ib3R0b20gPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5ib3R0b20pO1xuICAgICAgc3R5bGVzLndpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3Qud2lkdGgpO1xuICAgICAgc3R5bGVzLmxlZnQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5sZWZ0KTtcbiAgICAgIHN0eWxlcy5yaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LnJpZ2h0KTtcblxuICAgICAgLy8gUHVzaCB0aGUgcGFuZSBjb250ZW50IHRvd2FyZHMgdGhlIHByb3BlciBkaXJlY3Rpb24uXG4gICAgICBpZiAocG9zaXRpb24ub3ZlcmxheVggPT09ICdjZW50ZXInKSB7XG4gICAgICAgIHN0eWxlcy5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZXMuYWxpZ25JdGVtcyA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyA/ICdmbGV4LWVuZCcgOiAnZmxleC1zdGFydCc7XG4gICAgICB9XG5cbiAgICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgc3R5bGVzLmp1c3RpZnlDb250ZW50ID0gJ2NlbnRlcic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZXMuanVzdGlmeUNvbnRlbnQgPSBwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ2JvdHRvbScgPyAnZmxleC1lbmQnIDogJ2ZsZXgtc3RhcnQnO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICAgIHN0eWxlcy5tYXhIZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKG1heEhlaWdodCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXhXaWR0aCkge1xuICAgICAgICBzdHlsZXMubWF4V2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKG1heFdpZHRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplID0gYm91bmRpbmdCb3hSZWN0O1xuXG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX2JvdW5kaW5nQm94IS5zdHlsZSwgc3R5bGVzKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0eWxlcyBmb3IgdGhlIGJvdW5kaW5nIGJveCBzbyB0aGF0IGEgbmV3IHBvc2l0aW9uaW5nIGNhbiBiZSBjb21wdXRlZC4gKi9cbiAgcHJpdmF0ZSBfcmVzZXRCb3VuZGluZ0JveFN0eWxlcygpIHtcbiAgICBleHRlbmRTdHlsZXModGhpcy5fYm91bmRpbmdCb3ghLnN0eWxlLCB7XG4gICAgICB0b3A6ICcwJyxcbiAgICAgIGxlZnQ6ICcwJyxcbiAgICAgIHJpZ2h0OiAnMCcsXG4gICAgICBib3R0b206ICcwJyxcbiAgICAgIGhlaWdodDogJycsXG4gICAgICB3aWR0aDogJycsXG4gICAgICBhbGlnbkl0ZW1zOiAnJyxcbiAgICAgIGp1c3RpZnlDb250ZW50OiAnJyxcbiAgICB9IGFzIENTU1N0eWxlRGVjbGFyYXRpb24pO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3R5bGVzIGZvciB0aGUgb3ZlcmxheSBwYW5lIHNvIHRoYXQgYSBuZXcgcG9zaXRpb25pbmcgY2FuIGJlIGNvbXB1dGVkLiAqL1xuICBwcml2YXRlIF9yZXNldE92ZXJsYXlFbGVtZW50U3R5bGVzKCkge1xuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9wYW5lLnN0eWxlLCB7XG4gICAgICB0b3A6ICcnLFxuICAgICAgbGVmdDogJycsXG4gICAgICBib3R0b206ICcnLFxuICAgICAgcmlnaHQ6ICcnLFxuICAgICAgcG9zaXRpb246ICcnLFxuICAgICAgdHJhbnNmb3JtOiAnJyxcbiAgICB9IGFzIENTU1N0eWxlRGVjbGFyYXRpb24pO1xuICB9XG5cbiAgLyoqIFNldHMgcG9zaXRpb25pbmcgc3R5bGVzIHRvIHRoZSBvdmVybGF5IGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3NldE92ZXJsYXlFbGVtZW50U3R5bGVzKG9yaWdpblBvaW50OiBQb2ludCwgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKTogdm9pZCB7XG4gICAgY29uc3Qgc3R5bGVzID0ge30gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICBjb25zdCBoYXNFeGFjdFBvc2l0aW9uID0gdGhpcy5faGFzRXhhY3RQb3NpdGlvbigpO1xuICAgIGNvbnN0IGhhc0ZsZXhpYmxlRGltZW5zaW9ucyA9IHRoaXMuX2hhc0ZsZXhpYmxlRGltZW5zaW9ucztcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpO1xuXG4gICAgaWYgKGhhc0V4YWN0UG9zaXRpb24pIHtcbiAgICAgIGNvbnN0IHNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlci5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgICBleHRlbmRTdHlsZXMoc3R5bGVzLCB0aGlzLl9nZXRFeGFjdE92ZXJsYXlZKHBvc2l0aW9uLCBvcmlnaW5Qb2ludCwgc2Nyb2xsUG9zaXRpb24pKTtcbiAgICAgIGV4dGVuZFN0eWxlcyhzdHlsZXMsIHRoaXMuX2dldEV4YWN0T3ZlcmxheVgocG9zaXRpb24sIG9yaWdpblBvaW50LCBzY3JvbGxQb3NpdGlvbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMucG9zaXRpb24gPSAnc3RhdGljJztcbiAgICB9XG5cbiAgICAvLyBVc2UgYSB0cmFuc2Zvcm0gdG8gYXBwbHkgdGhlIG9mZnNldHMuIFdlIGRvIHRoaXMgYmVjYXVzZSB0aGUgYGNlbnRlcmAgcG9zaXRpb25zIHJlbHkgb25cbiAgICAvLyBiZWluZyBpbiB0aGUgbm9ybWFsIGZsZXggZmxvdyBhbmQgc2V0dGluZyBhIGB0b3BgIC8gYGxlZnRgIGF0IGFsbCB3aWxsIGNvbXBsZXRlbHkgdGhyb3dcbiAgICAvLyBvZmYgdGhlIHBvc2l0aW9uLiBXZSBhbHNvIGNhbid0IHVzZSBtYXJnaW5zLCBiZWNhdXNlIHRoZXkgd29uJ3QgaGF2ZSBhbiBlZmZlY3QgaW4gc29tZVxuICAgIC8vIGNhc2VzIHdoZXJlIHRoZSBlbGVtZW50IGRvZXNuJ3QgaGF2ZSBhbnl0aGluZyB0byBcInB1c2ggb2ZmIG9mXCIuIEZpbmFsbHksIHRoaXMgd29ya3NcbiAgICAvLyBiZXR0ZXIgYm90aCB3aXRoIGZsZXhpYmxlIGFuZCBub24tZmxleGlibGUgcG9zaXRpb25pbmcuXG4gICAgbGV0IHRyYW5zZm9ybVN0cmluZyA9ICcnO1xuICAgIGxldCBvZmZzZXRYID0gdGhpcy5fZ2V0T2Zmc2V0KHBvc2l0aW9uLCAneCcpO1xuICAgIGxldCBvZmZzZXRZID0gdGhpcy5fZ2V0T2Zmc2V0KHBvc2l0aW9uLCAneScpO1xuXG4gICAgaWYgKG9mZnNldFgpIHtcbiAgICAgIHRyYW5zZm9ybVN0cmluZyArPSBgdHJhbnNsYXRlWCgke29mZnNldFh9cHgpIGA7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldFkpIHtcbiAgICAgIHRyYW5zZm9ybVN0cmluZyArPSBgdHJhbnNsYXRlWSgke29mZnNldFl9cHgpYDtcbiAgICB9XG5cbiAgICBzdHlsZXMudHJhbnNmb3JtID0gdHJhbnNmb3JtU3RyaW5nLnRyaW0oKTtcblxuICAgIC8vIElmIGEgbWF4V2lkdGggb3IgbWF4SGVpZ2h0IGlzIHNwZWNpZmllZCBvbiB0aGUgb3ZlcmxheSwgd2UgcmVtb3ZlIHRoZW0uIFdlIGRvIHRoaXMgYmVjYXVzZVxuICAgIC8vIHdlIG5lZWQgdGhlc2UgdmFsdWVzIHRvIGJvdGggYmUgc2V0IHRvIFwiMTAwJVwiIGZvciB0aGUgYXV0b21hdGljIGZsZXhpYmxlIHNpemluZyB0byB3b3JrLlxuICAgIC8vIFRoZSBtYXhIZWlnaHQgYW5kIG1heFdpZHRoIGFyZSBzZXQgb24gdGhlIGJvdW5kaW5nQm94IGluIG9yZGVyIHRvIGVuZm9yY2UgdGhlIGNvbnN0cmFpbnQuXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgZG9lc24ndCBhcHBseSB3aGVuIHdlIGhhdmUgYW4gZXhhY3QgcG9zaXRpb24sIGluIHdoaWNoIGNhc2Ugd2UgZG8gd2FudCB0b1xuICAgIC8vIGFwcGx5IHRoZW0gYmVjYXVzZSB0aGV5J2xsIGJlIGNsZWFyZWQgZnJvbSB0aGUgYm91bmRpbmcgYm94LlxuICAgIGlmIChjb25maWcubWF4SGVpZ2h0KSB7XG4gICAgICBpZiAoaGFzRXhhY3RQb3NpdGlvbikge1xuICAgICAgICBzdHlsZXMubWF4SGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShjb25maWcubWF4SGVpZ2h0KTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzRmxleGlibGVEaW1lbnNpb25zKSB7XG4gICAgICAgIHN0eWxlcy5tYXhIZWlnaHQgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLm1heFdpZHRoKSB7XG4gICAgICBpZiAoaGFzRXhhY3RQb3NpdGlvbikge1xuICAgICAgICBzdHlsZXMubWF4V2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGNvbmZpZy5tYXhXaWR0aCk7XG4gICAgICB9IGVsc2UgaWYgKGhhc0ZsZXhpYmxlRGltZW5zaW9ucykge1xuICAgICAgICBzdHlsZXMubWF4V2lkdGggPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBleHRlbmRTdHlsZXModGhpcy5fcGFuZS5zdHlsZSwgc3R5bGVzKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBleGFjdCB0b3AvYm90dG9tIGZvciB0aGUgb3ZlcmxheSB3aGVuIG5vdCB1c2luZyBmbGV4aWJsZSBzaXppbmcgb3Igd2hlbiBwdXNoaW5nLiAqL1xuICBwcml2YXRlIF9nZXRFeGFjdE92ZXJsYXlZKFxuICAgIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbixcbiAgICBvcmlnaW5Qb2ludDogUG9pbnQsXG4gICAgc2Nyb2xsUG9zaXRpb246IFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24sXG4gICkge1xuICAgIC8vIFJlc2V0IGFueSBleGlzdGluZyBzdHlsZXMuIFRoaXMgaXMgbmVjZXNzYXJ5IGluIGNhc2UgdGhlXG4gICAgLy8gcHJlZmVycmVkIHBvc2l0aW9uIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGBhcHBseWAuXG4gICAgbGV0IHN0eWxlcyA9IHt0b3A6ICcnLCBib3R0b206ICcnfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBwb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5faXNQdXNoZWQpIHtcbiAgICAgIG92ZXJsYXlQb2ludCA9IHRoaXMuX3B1c2hPdmVybGF5T25TY3JlZW4ob3ZlcmxheVBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgc2Nyb2xsUG9zaXRpb24pO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gc2V0IGVpdGhlciBgdG9wYCBvciBgYm90dG9tYCBiYXNlZCBvbiB3aGV0aGVyIHRoZSBvdmVybGF5IHdhbnRzIHRvIGFwcGVhclxuICAgIC8vIGFib3ZlIG9yIGJlbG93IHRoZSBvcmlnaW4gYW5kIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGVsZW1lbnQgd2lsbCBleHBhbmQuXG4gICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAnYm90dG9tJykge1xuICAgICAgLy8gV2hlbiB1c2luZyBgYm90dG9tYCwgd2UgYWRqdXN0IHRoZSB5IHBvc2l0aW9uIHN1Y2ggdGhhdCBpdCBpcyB0aGUgZGlzdGFuY2VcbiAgICAgIC8vIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlld3BvcnQgcmF0aGVyIHRoYW4gdGhlIHRvcC5cbiAgICAgIGNvbnN0IGRvY3VtZW50SGVpZ2h0ID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRIZWlnaHQ7XG4gICAgICBzdHlsZXMuYm90dG9tID0gYCR7ZG9jdW1lbnRIZWlnaHQgLSAob3ZlcmxheVBvaW50LnkgKyB0aGlzLl9vdmVybGF5UmVjdC5oZWlnaHQpfXB4YDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLnRvcCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUob3ZlcmxheVBvaW50LnkpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZXhhY3QgbGVmdC9yaWdodCBmb3IgdGhlIG92ZXJsYXkgd2hlbiBub3QgdXNpbmcgZmxleGlibGUgc2l6aW5nIG9yIHdoZW4gcHVzaGluZy4gKi9cbiAgcHJpdmF0ZSBfZ2V0RXhhY3RPdmVybGF5WChcbiAgICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sXG4gICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uLFxuICApIHtcbiAgICAvLyBSZXNldCBhbnkgZXhpc3Rpbmcgc3R5bGVzLiBUaGlzIGlzIG5lY2Vzc2FyeSBpbiBjYXNlIHRoZSBwcmVmZXJyZWQgcG9zaXRpb24gaGFzXG4gICAgLy8gY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBgYXBwbHlgLlxuICAgIGxldCBzdHlsZXMgPSB7bGVmdDogJycsIHJpZ2h0OiAnJ30gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICBsZXQgb3ZlcmxheVBvaW50ID0gdGhpcy5fZ2V0T3ZlcmxheVBvaW50KG9yaWdpblBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgcG9zaXRpb24pO1xuXG4gICAgaWYgKHRoaXMuX2lzUHVzaGVkKSB7XG4gICAgICBvdmVybGF5UG9pbnQgPSB0aGlzLl9wdXNoT3ZlcmxheU9uU2NyZWVuKG92ZXJsYXlQb2ludCwgdGhpcy5fb3ZlcmxheVJlY3QsIHNjcm9sbFBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBXZSB3YW50IHRvIHNldCBlaXRoZXIgYGxlZnRgIG9yIGByaWdodGAgYmFzZWQgb24gd2hldGhlciB0aGUgb3ZlcmxheSB3YW50cyB0byBhcHBlYXIgXCJiZWZvcmVcIlxuICAgIC8vIG9yIFwiYWZ0ZXJcIiB0aGUgb3JpZ2luLCB3aGljaCBkZXRlcm1pbmVzIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGVsZW1lbnQgd2lsbCBleHBhbmQuXG4gICAgLy8gRm9yIHRoZSBob3Jpem9udGFsIGF4aXMsIHRoZSBtZWFuaW5nIG9mIFwiYmVmb3JlXCIgYW5kIFwiYWZ0ZXJcIiBjaGFuZ2UgYmFzZWQgb24gd2hldGhlciB0aGVcbiAgICAvLyBwYWdlIGlzIGluIFJUTCBvciBMVFIuXG4gICAgbGV0IGhvcml6b250YWxTdHlsZVByb3BlcnR5OiAnbGVmdCcgfCAncmlnaHQnO1xuXG4gICAgaWYgKHRoaXMuX2lzUnRsKCkpIHtcbiAgICAgIGhvcml6b250YWxTdHlsZVByb3BlcnR5ID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICB9IGVsc2Uge1xuICAgICAgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgIH1cblxuICAgIC8vIFdoZW4gd2UncmUgc2V0dGluZyBgcmlnaHRgLCB3ZSBhZGp1c3QgdGhlIHggcG9zaXRpb24gc3VjaCB0aGF0IGl0IGlzIHRoZSBkaXN0YW5jZVxuICAgIC8vIGZyb20gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIHZpZXdwb3J0IHJhdGhlciB0aGFuIHRoZSBsZWZ0IGVkZ2UuXG4gICAgaWYgKGhvcml6b250YWxTdHlsZVByb3BlcnR5ID09PSAncmlnaHQnKSB7XG4gICAgICBjb25zdCBkb2N1bWVudFdpZHRoID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRXaWR0aDtcbiAgICAgIHN0eWxlcy5yaWdodCA9IGAke2RvY3VtZW50V2lkdGggLSAob3ZlcmxheVBvaW50LnggKyB0aGlzLl9vdmVybGF5UmVjdC53aWR0aCl9cHhgO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMubGVmdCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUob3ZlcmxheVBvaW50LngpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlldyBwcm9wZXJ0aWVzIG9mIHRoZSB0cmlnZ2VyIGFuZCBvdmVybGF5LCBpbmNsdWRpbmcgd2hldGhlciB0aGV5IGFyZSBjbGlwcGVkXG4gICAqIG9yIGNvbXBsZXRlbHkgb3V0c2lkZSB0aGUgdmlldyBvZiBhbnkgb2YgdGhlIHN0cmF0ZWd5J3Mgc2Nyb2xsYWJsZXMuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTY3JvbGxWaXNpYmlsaXR5KCk6IFNjcm9sbGluZ1Zpc2liaWxpdHkge1xuICAgIC8vIE5vdGU6IG5lZWRzIGZyZXNoIHJlY3RzIHNpbmNlIHRoZSBwb3NpdGlvbiBjb3VsZCd2ZSBjaGFuZ2VkLlxuICAgIGNvbnN0IG9yaWdpbkJvdW5kcyA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICBjb25zdCBvdmVybGF5Qm91bmRzID0gdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIFRPRE8oamVsYm91cm4pOiBpbnN0ZWFkIG9mIG5lZWRpbmcgYWxsIG9mIHRoZSBjbGllbnQgcmVjdHMgZm9yIHRoZXNlIHNjcm9sbGluZyBjb250YWluZXJzXG4gICAgLy8gZXZlcnkgdGltZSwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gdXNlIHRoZSBzY3JvbGxUb3Agb2YgdGhlIGNvbnRhaW5lcnMgaWYgdGhlIHNpemUgb2YgdGhvc2VcbiAgICAvLyBjb250YWluZXJzIGhhc24ndCBjaGFuZ2VkLlxuICAgIGNvbnN0IHNjcm9sbENvbnRhaW5lckJvdW5kcyA9IHRoaXMuX3Njcm9sbGFibGVzLm1hcChzY3JvbGxhYmxlID0+IHtcbiAgICAgIHJldHVybiBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzT3JpZ2luQ2xpcHBlZDogaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nKG9yaWdpbkJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICAgIGlzT3JpZ2luT3V0c2lkZVZpZXc6IGlzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcob3JpZ2luQm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgICAgaXNPdmVybGF5Q2xpcHBlZDogaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nKG92ZXJsYXlCb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgICBpc092ZXJsYXlPdXRzaWRlVmlldzogaXNFbGVtZW50U2Nyb2xsZWRPdXRzaWRlVmlldyhvdmVybGF5Qm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgIH07XG4gIH1cblxuICAvKiogU3VidHJhY3RzIHRoZSBhbW91bnQgdGhhdCBhbiBlbGVtZW50IGlzIG92ZXJmbG93aW5nIG9uIGFuIGF4aXMgZnJvbSBpdHMgbGVuZ3RoLiAqL1xuICBwcml2YXRlIF9zdWJ0cmFjdE92ZXJmbG93cyhsZW5ndGg6IG51bWJlciwgLi4ub3ZlcmZsb3dzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIG92ZXJmbG93cy5yZWR1Y2UoKGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50T3ZlcmZsb3c6IG51bWJlcikgPT4ge1xuICAgICAgcmV0dXJuIGN1cnJlbnRWYWx1ZSAtIE1hdGgubWF4KGN1cnJlbnRPdmVyZmxvdywgMCk7XG4gICAgfSwgbGVuZ3RoKTtcbiAgfVxuXG4gIC8qKiBOYXJyb3dzIHRoZSBnaXZlbiB2aWV3cG9ydCByZWN0IGJ5IHRoZSBjdXJyZW50IF92aWV3cG9ydE1hcmdpbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTogRGltZW5zaW9ucyB7XG4gICAgLy8gV2UgcmVjYWxjdWxhdGUgdGhlIHZpZXdwb3J0IHJlY3QgaGVyZSBvdXJzZWx2ZXMsIHJhdGhlciB0aGFuIHVzaW5nIHRoZSBWaWV3cG9ydFJ1bGVyLFxuICAgIC8vIGJlY2F1c2Ugd2Ugd2FudCB0byB1c2UgdGhlIGBjbGllbnRXaWR0aGAgYW5kIGBjbGllbnRIZWlnaHRgIGFzIHRoZSBiYXNlLiBUaGUgZGlmZmVyZW5jZVxuICAgIC8vIGJlaW5nIHRoYXQgdGhlIGNsaWVudCBwcm9wZXJ0aWVzIGRvbid0IGluY2x1ZGUgdGhlIHNjcm9sbGJhciwgYXMgb3Bwb3NlZCB0byBgaW5uZXJXaWR0aGBcbiAgICAvLyBhbmQgYGlubmVySGVpZ2h0YCB0aGF0IGRvLiBUaGlzIGlzIG5lY2Vzc2FyeSwgYmVjYXVzZSB0aGUgb3ZlcmxheSBjb250YWluZXIgdXNlc1xuICAgIC8vIDEwMCUgYHdpZHRoYCBhbmQgYGhlaWdodGAgd2hpY2ggZG9uJ3QgaW5jbHVkZSB0aGUgc2Nyb2xsYmFyIGVpdGhlci5cbiAgICBjb25zdCB3aWR0aCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuY2xpZW50V2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHNjcm9sbFBvc2l0aW9uLnRvcCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgbGVmdDogc2Nyb2xsUG9zaXRpb24ubGVmdCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgcmlnaHQ6IHNjcm9sbFBvc2l0aW9uLmxlZnQgKyB3aWR0aCAtIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgYm90dG9tOiBzY3JvbGxQb3NpdGlvbi50b3AgKyBoZWlnaHQgLSB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIHdpZHRoOiB3aWR0aCAtIDIgKiB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIGhlaWdodDogaGVpZ2h0IC0gMiAqIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgIH07XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgd2UncmUgZGVhbGluZyB3aXRoIGFuIFJUTCBjb250ZXh0ICovXG4gIHByaXZhdGUgX2lzUnRsKCkge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5UmVmLmdldERpcmVjdGlvbigpID09PSAncnRsJztcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG92ZXJsYXkgdXNlcyBleGFjdCBvciBmbGV4aWJsZSBwb3NpdGlvbmluZy4gKi9cbiAgcHJpdmF0ZSBfaGFzRXhhY3RQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gIXRoaXMuX2hhc0ZsZXhpYmxlRGltZW5zaW9ucyB8fCB0aGlzLl9pc1B1c2hlZDtcbiAgfVxuXG4gIC8qKiBSZXRyaWV2ZXMgdGhlIG9mZnNldCBvZiBhIHBvc2l0aW9uIGFsb25nIHRoZSB4IG9yIHkgYXhpcy4gKi9cbiAgcHJpdmF0ZSBfZ2V0T2Zmc2V0KHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbiwgYXhpczogJ3gnIHwgJ3knKSB7XG4gICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgLy8gV2UgZG9uJ3QgZG8gc29tZXRoaW5nIGxpa2UgYHBvc2l0aW9uWydvZmZzZXQnICsgYXhpc11gIGluXG4gICAgICAvLyBvcmRlciB0byBhdm9pZCBicmVha2luZyBtaW5pZmllcnMgdGhhdCByZW5hbWUgcHJvcGVydGllcy5cbiAgICAgIHJldHVybiBwb3NpdGlvbi5vZmZzZXRYID09IG51bGwgPyB0aGlzLl9vZmZzZXRYIDogcG9zaXRpb24ub2Zmc2V0WDtcbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb24ub2Zmc2V0WSA9PSBudWxsID8gdGhpcy5fb2Zmc2V0WSA6IHBvc2l0aW9uLm9mZnNldFk7XG4gIH1cblxuICAvKiogVmFsaWRhdGVzIHRoYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24gbWF0Y2ggdGhlIGV4cGVjdGVkIHZhbHVlcy4gKi9cbiAgcHJpdmF0ZSBfdmFsaWRhdGVQb3NpdGlvbnMoKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKCF0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k6IEF0IGxlYXN0IG9uZSBwb3NpdGlvbiBpcyByZXF1aXJlZC4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IHJlbW92ZSB0aGVzZSBvbmNlIEFuZ3VsYXIncyB0ZW1wbGF0ZSB0eXBlXG4gICAgICAvLyBjaGVja2luZyBpcyBhZHZhbmNlZCBlbm91Z2ggdG8gY2F0Y2ggdGhlc2UgY2FzZXMuXG4gICAgICB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMuZm9yRWFjaChwYWlyID0+IHtcbiAgICAgICAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24oJ29yaWdpblgnLCBwYWlyLm9yaWdpblgpO1xuICAgICAgICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24oJ29yaWdpblknLCBwYWlyLm9yaWdpblkpO1xuICAgICAgICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbignb3ZlcmxheVgnLCBwYWlyLm92ZXJsYXlYKTtcbiAgICAgICAgdmFsaWRhdGVWZXJ0aWNhbFBvc2l0aW9uKCdvdmVybGF5WScsIHBhaXIub3ZlcmxheVkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFkZHMgYSBzaW5nbGUgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgb24gdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX2FkZFBhbmVsQ2xhc3Nlcyhjc3NDbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICBjb2VyY2VBcnJheShjc3NDbGFzc2VzKS5mb3JFYWNoKGNzc0NsYXNzID0+IHtcbiAgICAgICAgaWYgKGNzc0NsYXNzICE9PSAnJyAmJiB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzLmluZGV4T2YoY3NzQ2xhc3MpID09PSAtMSkge1xuICAgICAgICAgIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMucHVzaChjc3NDbGFzcyk7XG4gICAgICAgICAgdGhpcy5fcGFuZS5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENsZWFycyB0aGUgY2xhc3NlcyB0aGF0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBoYXMgYXBwbGllZCBmcm9tIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9jbGVhclBhbmVsQ2xhc3NlcygpIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3Nlcy5mb3JFYWNoKGNzc0NsYXNzID0+IHtcbiAgICAgICAgdGhpcy5fcGFuZS5jbGFzc0xpc3QucmVtb3ZlKGNzc0NsYXNzKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3NlcyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBET01SZWN0IG9mIHRoZSBjdXJyZW50IG9yaWdpbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0T3JpZ2luUmVjdCgpOiBEaW1lbnNpb25zIHtcbiAgICBjb25zdCBvcmlnaW4gPSB0aGlzLl9vcmlnaW47XG5cbiAgICBpZiAob3JpZ2luIGluc3RhbmNlb2YgRWxlbWVudFJlZikge1xuICAgICAgcmV0dXJuIG9yaWdpbi5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBFbGVtZW50IHNvIFNWRyBlbGVtZW50cyBhcmUgYWxzbyBzdXBwb3J0ZWQuXG4gICAgaWYgKG9yaWdpbiBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBvcmlnaW4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lkdGggPSBvcmlnaW4ud2lkdGggfHwgMDtcbiAgICBjb25zdCBoZWlnaHQgPSBvcmlnaW4uaGVpZ2h0IHx8IDA7XG5cbiAgICAvLyBJZiB0aGUgb3JpZ2luIGlzIGEgcG9pbnQsIHJldHVybiBhIGNsaWVudCByZWN0IGFzIGlmIGl0IHdhcyBhIDB4MCBlbGVtZW50IGF0IHRoZSBwb2ludC5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBvcmlnaW4ueSxcbiAgICAgIGJvdHRvbTogb3JpZ2luLnkgKyBoZWlnaHQsXG4gICAgICBsZWZ0OiBvcmlnaW4ueCxcbiAgICAgIHJpZ2h0OiBvcmlnaW4ueCArIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgd2lkdGgsXG4gICAgfTtcbiAgfVxufVxuXG4vKiogQSBzaW1wbGUgKHgsIHkpIGNvb3JkaW5hdGUuICovXG5pbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqIFJlY29yZCBvZiBtZWFzdXJlbWVudHMgZm9yIGhvdyBhbiBvdmVybGF5IChhdCBhIGdpdmVuIHBvc2l0aW9uKSBmaXRzIGludG8gdGhlIHZpZXdwb3J0LiAqL1xuaW50ZXJmYWNlIE92ZXJsYXlGaXQge1xuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBmaXRzIGNvbXBsZXRlbHkgaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBpc0NvbXBsZXRlbHlXaXRoaW5WaWV3cG9ydDogYm9vbGVhbjtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBmaXRzIGluIHRoZSB2aWV3cG9ydCBvbiB0aGUgeS1heGlzLiAqL1xuICBmaXRzSW5WaWV3cG9ydFZlcnRpY2FsbHk6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgb24gdGhlIHgtYXhpcy4gKi9cbiAgZml0c0luVmlld3BvcnRIb3Jpem9udGFsbHk6IGJvb2xlYW47XG5cbiAgLyoqIFRoZSB0b3RhbCB2aXNpYmxlIGFyZWEgKGluIHB4XjIpIG9mIHRoZSBvdmVybGF5IGluc2lkZSB0aGUgdmlld3BvcnQuICovXG4gIHZpc2libGVBcmVhOiBudW1iZXI7XG59XG5cbi8qKiBSZWNvcmQgb2YgdGhlIG1lYXN1cmVtZW50cyBkZXRlcm1pbmluZyB3aGV0aGVyIGFuIG92ZXJsYXkgd2lsbCBmaXQgaW4gYSBzcGVjaWZpYyBwb3NpdGlvbi4gKi9cbmludGVyZmFjZSBGYWxsYmFja1Bvc2l0aW9uIHtcbiAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uO1xuICBvcmlnaW5Qb2ludDogUG9pbnQ7XG4gIG92ZXJsYXlQb2ludDogUG9pbnQ7XG4gIG92ZXJsYXlGaXQ6IE92ZXJsYXlGaXQ7XG4gIG92ZXJsYXlSZWN0OiBEaW1lbnNpb25zO1xufVxuXG4vKiogUG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIG92ZXJsYXkgc2l6aW5nIHdyYXBwZXIgZm9yIGEgc3BlY2lmaWMgcG9zaXRpb24uICovXG5pbnRlcmZhY2UgQm91bmRpbmdCb3hSZWN0IHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgYm90dG9tOiBudW1iZXI7XG4gIHJpZ2h0OiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIG1lYXN1cmVzIGRldGVybWluaW5nIGhvdyB3ZWxsIGEgZ2l2ZW4gcG9zaXRpb24gd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLiAqL1xuaW50ZXJmYWNlIEZsZXhpYmxlRml0IHtcbiAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uO1xuICBvcmlnaW46IFBvaW50O1xuICBvdmVybGF5UmVjdDogRGltZW5zaW9ucztcbiAgYm91bmRpbmdCb3hSZWN0OiBCb3VuZGluZ0JveFJlY3Q7XG59XG5cbi8qKiBBIGNvbm5lY3RlZCBwb3NpdGlvbiBhcyBzcGVjaWZpZWQgYnkgdGhlIHVzZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RlZFBvc2l0aW9uIHtcbiAgb3JpZ2luWDogJ3N0YXJ0JyB8ICdjZW50ZXInIHwgJ2VuZCc7XG4gIG9yaWdpblk6ICd0b3AnIHwgJ2NlbnRlcicgfCAnYm90dG9tJztcblxuICBvdmVybGF5WDogJ3N0YXJ0JyB8ICdjZW50ZXInIHwgJ2VuZCc7XG4gIG92ZXJsYXlZOiAndG9wJyB8ICdjZW50ZXInIHwgJ2JvdHRvbSc7XG5cbiAgd2VpZ2h0PzogbnVtYmVyO1xuICBvZmZzZXRYPzogbnVtYmVyO1xuICBvZmZzZXRZPzogbnVtYmVyO1xuICBwYW5lbENsYXNzPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbi8qKiBTaGFsbG93LWV4dGVuZHMgYSBzdHlsZXNoZWV0IG9iamVjdCB3aXRoIGFub3RoZXIgc3R5bGVzaGVldCBvYmplY3QuICovXG5mdW5jdGlvbiBleHRlbmRTdHlsZXMoXG4gIGRlc3RpbmF0aW9uOiBDU1NTdHlsZURlY2xhcmF0aW9uLFxuICBzb3VyY2U6IENTU1N0eWxlRGVjbGFyYXRpb24sXG4pOiBDU1NTdHlsZURlY2xhcmF0aW9uIHtcbiAgZm9yIChsZXQga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgZGVzdGluYXRpb25ba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0aW5hdGlvbjtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgcGl4ZWwgdmFsdWUgYXMgYSBudW1iZXIgZnJvbSBhIHZhbHVlLCBpZiBpdCdzIGEgbnVtYmVyXG4gKiBvciBhIENTUyBwaXhlbCBzdHJpbmcgKGUuZy4gYDEzMzdweGApLiBPdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICovXG5mdW5jdGlvbiBnZXRQaXhlbFZhbHVlKGlucHV0OiBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgaW5wdXQgIT09ICdudW1iZXInICYmIGlucHV0ICE9IG51bGwpIHtcbiAgICBjb25zdCBbdmFsdWUsIHVuaXRzXSA9IGlucHV0LnNwbGl0KGNzc1VuaXRQYXR0ZXJuKTtcbiAgICByZXR1cm4gIXVuaXRzIHx8IHVuaXRzID09PSAncHgnID8gcGFyc2VGbG9hdCh2YWx1ZSkgOiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGlucHV0IHx8IG51bGw7XG59XG5cbi8qKlxuICogR2V0cyBhIHZlcnNpb24gb2YgYW4gZWxlbWVudCdzIGJvdW5kaW5nIGBET01SZWN0YCB3aGVyZSBhbGwgdGhlIHZhbHVlcyBhcmUgcm91bmRlZCBkb3duIHRvXG4gKiB0aGUgbmVhcmVzdCBwaXhlbC4gVGhpcyBhbGxvd3MgdXMgdG8gYWNjb3VudCBmb3IgdGhlIGNhc2VzIHdoZXJlIHRoZXJlIG1heSBiZSBzdWItcGl4ZWxcbiAqIGRldmlhdGlvbnMgaW4gdGhlIGBET01SZWN0YCByZXR1cm5lZCBieSB0aGUgYnJvd3NlciAoZS5nLiB3aGVuIHpvb21lZCBpbiB3aXRoIGEgcGVyY2VudGFnZVxuICogc2l6ZSwgc2VlICMyMTM1MCkuXG4gKi9cbmZ1bmN0aW9uIGdldFJvdW5kZWRCb3VuZGluZ0NsaWVudFJlY3QoY2xpZW50UmVjdDogRGltZW5zaW9ucyk6IERpbWVuc2lvbnMge1xuICByZXR1cm4ge1xuICAgIHRvcDogTWF0aC5mbG9vcihjbGllbnRSZWN0LnRvcCksXG4gICAgcmlnaHQ6IE1hdGguZmxvb3IoY2xpZW50UmVjdC5yaWdodCksXG4gICAgYm90dG9tOiBNYXRoLmZsb29yKGNsaWVudFJlY3QuYm90dG9tKSxcbiAgICBsZWZ0OiBNYXRoLmZsb29yKGNsaWVudFJlY3QubGVmdCksXG4gICAgd2lkdGg6IE1hdGguZmxvb3IoY2xpZW50UmVjdC53aWR0aCksXG4gICAgaGVpZ2h0OiBNYXRoLmZsb29yKGNsaWVudFJlY3QuaGVpZ2h0KSxcbiAgfTtcbn1cblxuLyoqIFJldHVybnMgd2hldGhlciB0d28gYFNjcm9sbGluZ1Zpc2liaWxpdHlgIG9iamVjdHMgYXJlIGlkZW50aWNhbC4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVTY3JvbGxWaXNpYmlsaXR5KGE6IFNjcm9sbGluZ1Zpc2liaWxpdHksIGI6IFNjcm9sbGluZ1Zpc2liaWxpdHkpOiBib29sZWFuIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgYS5pc09yaWdpbkNsaXBwZWQgPT09IGIuaXNPcmlnaW5DbGlwcGVkICYmXG4gICAgYS5pc09yaWdpbk91dHNpZGVWaWV3ID09PSBiLmlzT3JpZ2luT3V0c2lkZVZpZXcgJiZcbiAgICBhLmlzT3ZlcmxheUNsaXBwZWQgPT09IGIuaXNPdmVybGF5Q2xpcHBlZCAmJlxuICAgIGEuaXNPdmVybGF5T3V0c2lkZVZpZXcgPT09IGIuaXNPdmVybGF5T3V0c2lkZVZpZXdcbiAgKTtcbn1cblxuZXhwb3J0IGNvbnN0IFNUQU5EQVJEX0RST1BET1dOX0JFTE9XX1BPU0lUSU9OUzogQ29ubmVjdGVkUG9zaXRpb25bXSA9IFtcbiAge29yaWdpblg6ICdzdGFydCcsIG9yaWdpblk6ICdib3R0b20nLCBvdmVybGF5WDogJ3N0YXJ0Jywgb3ZlcmxheVk6ICd0b3AnfSxcbiAge29yaWdpblg6ICdzdGFydCcsIG9yaWdpblk6ICd0b3AnLCBvdmVybGF5WDogJ3N0YXJ0Jywgb3ZlcmxheVk6ICdib3R0b20nfSxcbiAge29yaWdpblg6ICdlbmQnLCBvcmlnaW5ZOiAnYm90dG9tJywgb3ZlcmxheVg6ICdlbmQnLCBvdmVybGF5WTogJ3RvcCd9LFxuICB7b3JpZ2luWDogJ2VuZCcsIG9yaWdpblk6ICd0b3AnLCBvdmVybGF5WDogJ2VuZCcsIG92ZXJsYXlZOiAnYm90dG9tJ30sXG5dO1xuXG5leHBvcnQgY29uc3QgU1RBTkRBUkRfRFJPUERPV05fQURKQUNFTlRfUE9TSVRJT05TOiBDb25uZWN0ZWRQb3NpdGlvbltdID0gW1xuICB7b3JpZ2luWDogJ2VuZCcsIG9yaWdpblk6ICd0b3AnLCBvdmVybGF5WDogJ3N0YXJ0Jywgb3ZlcmxheVk6ICd0b3AnfSxcbiAge29yaWdpblg6ICdlbmQnLCBvcmlnaW5ZOiAnYm90dG9tJywgb3ZlcmxheVg6ICdzdGFydCcsIG92ZXJsYXlZOiAnYm90dG9tJ30sXG4gIHtvcmlnaW5YOiAnc3RhcnQnLCBvcmlnaW5ZOiAndG9wJywgb3ZlcmxheVg6ICdlbmQnLCBvdmVybGF5WTogJ3RvcCd9LFxuICB7b3JpZ2luWDogJ3N0YXJ0Jywgb3JpZ2luWTogJ2JvdHRvbScsIG92ZXJsYXlYOiAnZW5kJywgb3ZlcmxheVk6ICdib3R0b20nfSxcbl07XG4iXX0=