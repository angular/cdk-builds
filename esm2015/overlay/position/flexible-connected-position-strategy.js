/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/position/flexible-connected-position-strategy.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * Class to be added to the overlay bounding box.
 * @type {?}
 */
const boundingBoxClass = 'cdk-overlay-connected-position-bounding-box';
/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * implicit position relative some origin element. The relative position is defined in terms of
 * a point on the origin element that is connected to a point on the overlay element. For example,
 * a basic dropdown is connecting the bottom-left corner of the origin to the top-left corner
 * of the overlay.
 */
export class FlexibleConnectedPositionStrategy {
    /**
     * @param {?} connectedTo
     * @param {?} _viewportRuler
     * @param {?} _document
     * @param {?} _platform
     * @param {?} _overlayContainer
     */
    constructor(connectedTo, _viewportRuler, _document, _platform, _overlayContainer) {
        this._viewportRuler = _viewportRuler;
        this._document = _document;
        this._platform = _platform;
        this._overlayContainer = _overlayContainer;
        /**
         * Last size used for the bounding box. Used to avoid resizing the overlay after open.
         */
        this._lastBoundingBoxSize = { width: 0, height: 0 };
        /**
         * Whether the overlay was pushed in a previous positioning.
         */
        this._isPushed = false;
        /**
         * Whether the overlay can be pushed on-screen on the initial open.
         */
        this._canPush = true;
        /**
         * Whether the overlay can grow via flexible width/height after the initial open.
         */
        this._growAfterOpen = false;
        /**
         * Whether the overlay's width and height can be constrained to fit within the viewport.
         */
        this._hasFlexibleDimensions = true;
        /**
         * Whether the overlay position is locked.
         */
        this._positionLocked = false;
        /**
         * Amount of space that must be maintained between the overlay and the edge of the viewport.
         */
        this._viewportMargin = 0;
        /**
         * The Scrollable containers used to check scrollable view properties on position change.
         */
        this._scrollables = [];
        /**
         * Ordered list of preferred positions, from most to least desirable.
         */
        this._preferredPositions = [];
        /**
         * Subject that emits whenever the position changes.
         */
        this._positionChanges = new Subject();
        /**
         * Subscription to viewport size changes.
         */
        this._resizeSubscription = Subscription.EMPTY;
        /**
         * Default offset for the overlay along the x axis.
         */
        this._offsetX = 0;
        /**
         * Default offset for the overlay along the y axis.
         */
        this._offsetY = 0;
        /**
         * Keeps track of the CSS classes that the position strategy has applied on the overlay panel.
         */
        this._appliedPanelClasses = [];
        /**
         * Observable sequence of position changes.
         */
        this.positionChanges = this._positionChanges.asObservable();
        this.setOrigin(connectedTo);
    }
    /**
     * Ordered list of preferred positions, from most to least desirable.
     * @return {?}
     */
    get positions() {
        return this._preferredPositions;
    }
    /**
     * Attaches this position strategy to an overlay.
     * @param {?} overlayRef
     * @return {?}
     */
    attach(overlayRef) {
        if (this._overlayRef && overlayRef !== this._overlayRef) {
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
        this._resizeSubscription = this._viewportRuler.change().subscribe((/**
         * @return {?}
         */
        () => {
            // When the window is resized, we want to trigger the next reposition as if it
            // was an initial render, in order for the strategy to pick a new optimal position,
            // otherwise position locking will cause it to stay at the old one.
            this._isInitialRender = true;
            this.apply();
        }));
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
     * \@docs-private
     * @return {?}
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
        /** @type {?} */
        const originRect = this._originRect;
        /** @type {?} */
        const overlayRect = this._overlayRect;
        /** @type {?} */
        const viewportRect = this._viewportRect;
        // Positions where the overlay will fit with flexible dimensions.
        /** @type {?} */
        const flexibleFits = [];
        // Fallback if none of the preferred positions fit within the viewport.
        /** @type {?} */
        let fallback;
        // Go through each of the preferred positions looking for a good fit.
        // If a good fit is found, it will be applied immediately.
        for (let pos of this._preferredPositions) {
            // Get the exact (x, y) coordinate for the point-of-origin on the origin element.
            /** @type {?} */
            let originPoint = this._getOriginPoint(originRect, pos);
            // From that point-of-origin, get the exact (x, y) coordinate for the top-left corner of the
            // overlay in this position. We use the top-left corner for calculations and later translate
            // this into an appropriate (top, left, bottom, right) style.
            /** @type {?} */
            let overlayPoint = this._getOverlayPoint(originPoint, overlayRect, pos);
            // Calculate how well the overlay would fit into the viewport with this point.
            /** @type {?} */
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
            /** @type {?} */
            let bestFit = null;
            /** @type {?} */
            let bestScore = -1;
            for (const fit of flexibleFits) {
                /** @type {?} */
                const score = fit.boundingBoxRect.width * fit.boundingBoxRect.height * (fit.position.weight || 1);
                if (score > bestScore) {
                    bestScore = score;
                    bestFit = fit;
                }
            }
            this._isPushed = false;
            this._applyPosition((/** @type {?} */ (bestFit)).position, (/** @type {?} */ (bestFit)).origin);
            return;
        }
        // When none of the preferred positions fit within the viewport, take the position
        // that went off-screen the least and attempt to push it on-screen.
        if (this._canPush) {
            // TODO(jelbourn): after pushing, the opening "direction" of the overlay might not make sense.
            this._isPushed = true;
            this._applyPosition((/** @type {?} */ (fallback)).position, (/** @type {?} */ (fallback)).originPoint);
            return;
        }
        // All options for getting the overlay within the viewport have been exhausted, so go with the
        // position that went off-screen the least.
        this._applyPosition((/** @type {?} */ (fallback)).position, (/** @type {?} */ (fallback)).originPoint);
    }
    /**
     * @return {?}
     */
    detach() {
        this._clearPanelClasses();
        this._lastPosition = null;
        this._previousPushAmount = null;
        this._resizeSubscription.unsubscribe();
    }
    /**
     * Cleanup after the element gets destroyed.
     * @return {?}
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        // We can't use `_resetBoundingBoxStyles` here, because it resets
        // some properties to zero, rather than removing them.
        if (this._boundingBox) {
            extendStyles(this._boundingBox.style, (/** @type {?} */ ({
                top: '',
                left: '',
                right: '',
                bottom: '',
                height: '',
                width: '',
                alignItems: '',
                justifyContent: '',
            })));
        }
        if (this._pane) {
            this._resetOverlayElementStyles();
        }
        if (this._overlayRef) {
            this._overlayRef.hostElement.classList.remove(boundingBoxClass);
        }
        this.detach();
        this._positionChanges.complete();
        this._overlayRef = this._boundingBox = (/** @type {?} */ (null));
        this._isDisposed = true;
    }
    /**
     * This re-aligns the overlay element with the trigger in its last calculated position,
     * even if a position higher in the "preferred positions" list would now fit. This
     * allows one to re-align the panel without changing the orientation of the panel.
     * @return {?}
     */
    reapplyLastPosition() {
        if (!this._isDisposed && (!this._platform || this._platform.isBrowser)) {
            this._originRect = this._getOriginRect();
            this._overlayRect = this._pane.getBoundingClientRect();
            this._viewportRect = this._getNarrowedViewportRect();
            /** @type {?} */
            const lastPosition = this._lastPosition || this._preferredPositions[0];
            /** @type {?} */
            const originPoint = this._getOriginPoint(this._originRect, lastPosition);
            this._applyPosition(lastPosition, originPoint);
        }
    }
    /**
     * Sets the list of Scrollable containers that host the origin element so that
     * on reposition we can evaluate if it or the overlay has been clipped or outside view. Every
     * Scrollable must be an ancestor element of the strategy's origin element.
     * @template THIS
     * @this {THIS}
     * @param {?} scrollables
     * @return {THIS}
     */
    withScrollableContainers(scrollables) {
        (/** @type {?} */ (this))._scrollables = scrollables;
        return (/** @type {?} */ (this));
    }
    /**
     * Adds new preferred positions.
     * @template THIS
     * @this {THIS}
     * @param {?} positions List of positions options for this overlay.
     * @return {THIS}
     */
    withPositions(positions) {
        (/** @type {?} */ (this))._preferredPositions = positions;
        // If the last calculated position object isn't part of the positions anymore, clear
        // it in order to avoid it being picked up if the consumer tries to re-apply.
        if (positions.indexOf((/** @type {?} */ ((/** @type {?} */ (this))._lastPosition))) === -1) {
            (/** @type {?} */ (this))._lastPosition = null;
        }
        (/** @type {?} */ (this))._validatePositions();
        return (/** @type {?} */ (this));
    }
    /**
     * Sets a minimum distance the overlay may be positioned to the edge of the viewport.
     * @template THIS
     * @this {THIS}
     * @param {?} margin Required margin between the overlay and the viewport edge in pixels.
     * @return {THIS}
     */
    withViewportMargin(margin) {
        (/** @type {?} */ (this))._viewportMargin = margin;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets whether the overlay's width and height can be constrained to fit within the viewport.
     * @template THIS
     * @this {THIS}
     * @param {?=} flexibleDimensions
     * @return {THIS}
     */
    withFlexibleDimensions(flexibleDimensions = true) {
        (/** @type {?} */ (this))._hasFlexibleDimensions = flexibleDimensions;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets whether the overlay can grow after the initial open via flexible width/height.
     * @template THIS
     * @this {THIS}
     * @param {?=} growAfterOpen
     * @return {THIS}
     */
    withGrowAfterOpen(growAfterOpen = true) {
        (/** @type {?} */ (this))._growAfterOpen = growAfterOpen;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets whether the overlay can be pushed on-screen if none of the provided positions fit.
     * @template THIS
     * @this {THIS}
     * @param {?=} canPush
     * @return {THIS}
     */
    withPush(canPush = true) {
        (/** @type {?} */ (this))._canPush = canPush;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets whether the overlay's position should be locked in after it is positioned
     * initially. When an overlay is locked in, it won't attempt to reposition itself
     * when the position is re-applied (e.g. when the user scrolls away).
     * @template THIS
     * @this {THIS}
     * @param {?=} isLocked Whether the overlay should locked in.
     * @return {THIS}
     */
    withLockedPosition(isLocked = true) {
        (/** @type {?} */ (this))._positionLocked = isLocked;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the origin, relative to which to position the overlay.
     * Using an element origin is useful for building components that need to be positioned
     * relatively to a trigger (e.g. dropdown menus or tooltips), whereas using a point can be
     * used for cases like contextual menus which open relative to the user's pointer.
     * @template THIS
     * @this {THIS}
     * @param {?} origin Reference to the new origin.
     * @return {THIS}
     */
    setOrigin(origin) {
        (/** @type {?} */ (this))._origin = origin;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the default offset for the overlay's connection point on the x-axis.
     * @template THIS
     * @this {THIS}
     * @param {?} offset New offset in the X axis.
     * @return {THIS}
     */
    withDefaultOffsetX(offset) {
        (/** @type {?} */ (this))._offsetX = offset;
        return (/** @type {?} */ (this));
    }
    /**
     * Sets the default offset for the overlay's connection point on the y-axis.
     * @template THIS
     * @this {THIS}
     * @param {?} offset New offset in the Y axis.
     * @return {THIS}
     */
    withDefaultOffsetY(offset) {
        (/** @type {?} */ (this))._offsetY = offset;
        return (/** @type {?} */ (this));
    }
    /**
     * Configures that the position strategy should set a `transform-origin` on some elements
     * inside the overlay, depending on the current position that is being applied. This is
     * useful for the cases where the origin of an animation can change depending on the
     * alignment of the overlay.
     * @template THIS
     * @this {THIS}
     * @param {?} selector CSS selector that will be used to find the target
     *    elements onto which to set the transform origin.
     * @return {THIS}
     */
    withTransformOriginOn(selector) {
        (/** @type {?} */ (this))._transformOriginSelector = selector;
        return (/** @type {?} */ (this));
    }
    /**
     * Gets the (x, y) coordinate of a connection point on the origin based on a relative position.
     * @private
     * @param {?} originRect
     * @param {?} pos
     * @return {?}
     */
    _getOriginPoint(originRect, pos) {
        /** @type {?} */
        let x;
        if (pos.originX == 'center') {
            // Note: when centering we should always use the `left`
            // offset, otherwise the position will be wrong in RTL.
            x = originRect.left + (originRect.width / 2);
        }
        else {
            /** @type {?} */
            const startX = this._isRtl() ? originRect.right : originRect.left;
            /** @type {?} */
            const endX = this._isRtl() ? originRect.left : originRect.right;
            x = pos.originX == 'start' ? startX : endX;
        }
        /** @type {?} */
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
     * @private
     * @param {?} originPoint
     * @param {?} overlayRect
     * @param {?} pos
     * @return {?}
     */
    _getOverlayPoint(originPoint, overlayRect, pos) {
        // Calculate the (overlayStartX, overlayStartY), the start of the
        // potential overlay position relative to the origin point.
        /** @type {?} */
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
        /** @type {?} */
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
    /**
     * Gets how well an overlay at the given point will fit within the viewport.
     * @private
     * @param {?} point
     * @param {?} overlay
     * @param {?} viewport
     * @param {?} position
     * @return {?}
     */
    _getOverlayFit(point, overlay, viewport, position) {
        let { x, y } = point;
        /** @type {?} */
        let offsetX = this._getOffset(position, 'x');
        /** @type {?} */
        let offsetY = this._getOffset(position, 'y');
        // Account for the offsets since they could push the overlay out of the viewport.
        if (offsetX) {
            x += offsetX;
        }
        if (offsetY) {
            y += offsetY;
        }
        // How much the overlay would overflow at this position, on each side.
        /** @type {?} */
        let leftOverflow = 0 - x;
        /** @type {?} */
        let rightOverflow = (x + overlay.width) - viewport.width;
        /** @type {?} */
        let topOverflow = 0 - y;
        /** @type {?} */
        let bottomOverflow = (y + overlay.height) - viewport.height;
        // Visible parts of the element on each axis.
        /** @type {?} */
        let visibleWidth = this._subtractOverflows(overlay.width, leftOverflow, rightOverflow);
        /** @type {?} */
        let visibleHeight = this._subtractOverflows(overlay.height, topOverflow, bottomOverflow);
        /** @type {?} */
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
     * @private
     * @param {?} fit How well the overlay fits in the viewport at some position.
     * @param {?} point The (x, y) coordinates of the overlat at some position.
     * @param {?} viewport The geometry of the viewport.
     * @return {?}
     */
    _canFitWithFlexibleDimensions(fit, point, viewport) {
        if (this._hasFlexibleDimensions) {
            /** @type {?} */
            const availableHeight = viewport.bottom - point.y;
            /** @type {?} */
            const availableWidth = viewport.right - point.x;
            /** @type {?} */
            const minHeight = this._overlayRef.getConfig().minHeight;
            /** @type {?} */
            const minWidth = this._overlayRef.getConfig().minWidth;
            /** @type {?} */
            const verticalFit = fit.fitsInViewportVertically ||
                (minHeight != null && minHeight <= availableHeight);
            /** @type {?} */
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
     * @private
     * @param {?} start Starting point from which the overlay is pushed.
     * @param {?} overlay Dimensions of the overlay.
     * @param {?} scrollPosition Current viewport scroll position.
     * @return {?} The point at which to position the overlay after pushing. This is effectively a new
     *     originPoint.
     */
    _pushOverlayOnScreen(start, overlay, scrollPosition) {
        // If the position is locked and we've pushed the overlay already, reuse the previous push
        // amount, rather than pushing it again. If we were to continue pushing, the element would
        // remain in the viewport, which goes against the expectations when position locking is enabled.
        if (this._previousPushAmount && this._positionLocked) {
            return {
                x: start.x + this._previousPushAmount.x,
                y: start.y + this._previousPushAmount.y
            };
        }
        /** @type {?} */
        const viewport = this._viewportRect;
        // Determine how much the overlay goes outside the viewport on each
        // side, which we'll use to decide which direction to push it.
        /** @type {?} */
        const overflowRight = Math.max(start.x + overlay.width - viewport.right, 0);
        /** @type {?} */
        const overflowBottom = Math.max(start.y + overlay.height - viewport.bottom, 0);
        /** @type {?} */
        const overflowTop = Math.max(viewport.top - scrollPosition.top - start.y, 0);
        /** @type {?} */
        const overflowLeft = Math.max(viewport.left - scrollPosition.left - start.x, 0);
        // Amount by which to push the overlay in each axis such that it remains on-screen.
        /** @type {?} */
        let pushX = 0;
        /** @type {?} */
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
     * @private
     * @param {?} position The position preference
     * @param {?} originPoint The point on the origin element where the overlay is connected.
     * @return {?}
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
            /** @type {?} */
            const scrollableViewProperties = this._getScrollVisibility();
            /** @type {?} */
            const changeEvent = new ConnectedOverlayPositionChange(position, scrollableViewProperties);
            this._positionChanges.next(changeEvent);
        }
        this._isInitialRender = false;
    }
    /**
     * Sets the transform origin based on the configured selector and the passed-in position.
     * @private
     * @param {?} position
     * @return {?}
     */
    _setTransformOrigin(position) {
        if (!this._transformOriginSelector) {
            return;
        }
        /** @type {?} */
        const elements = (/** @type {?} */ (this._boundingBox)).querySelectorAll(this._transformOriginSelector);
        /** @type {?} */
        let xOrigin;
        /** @type {?} */
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
     * @private
     * @param {?} origin
     * @param {?} position
     * @return {?}
     */
    _calculateBoundingBoxRect(origin, position) {
        /** @type {?} */
        const viewport = this._viewportRect;
        /** @type {?} */
        const isRtl = this._isRtl();
        /** @type {?} */
        let height;
        /** @type {?} */
        let top;
        /** @type {?} */
        let bottom;
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
            /** @type {?} */
            const smallestDistanceToViewportEdge = Math.min(viewport.bottom - origin.y + viewport.top, origin.y);
            /** @type {?} */
            const previousHeight = this._lastBoundingBoxSize.height;
            height = smallestDistanceToViewportEdge * 2;
            top = origin.y - smallestDistanceToViewportEdge;
            if (height > previousHeight && !this._isInitialRender && !this._growAfterOpen) {
                top = origin.y - (previousHeight / 2);
            }
        }
        // The overlay is opening 'right-ward' (the content flows to the right).
        /** @type {?} */
        const isBoundedByRightViewportEdge = (position.overlayX === 'start' && !isRtl) ||
            (position.overlayX === 'end' && isRtl);
        // The overlay is opening 'left-ward' (the content flows to the left).
        /** @type {?} */
        const isBoundedByLeftViewportEdge = (position.overlayX === 'end' && !isRtl) ||
            (position.overlayX === 'start' && isRtl);
        /** @type {?} */
        let width;
        /** @type {?} */
        let left;
        /** @type {?} */
        let right;
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
            /** @type {?} */
            const smallestDistanceToViewportEdge = Math.min(viewport.right - origin.x + viewport.left, origin.x);
            /** @type {?} */
            const previousWidth = this._lastBoundingBoxSize.width;
            width = smallestDistanceToViewportEdge * 2;
            left = origin.x - smallestDistanceToViewportEdge;
            if (width > previousWidth && !this._isInitialRender && !this._growAfterOpen) {
                left = origin.x - (previousWidth / 2);
            }
        }
        return { top: (/** @type {?} */ (top)), left: (/** @type {?} */ (left)), bottom: (/** @type {?} */ (bottom)), right: (/** @type {?} */ (right)), width, height };
    }
    /**
     * Sets the position and size of the overlay's sizing wrapper. The wrapper is positioned on the
     * origin's connection point and stetches to the bounds of the viewport.
     *
     * @private
     * @param {?} origin The point on the origin element where the overlay is connected.
     * @param {?} position The position preference
     * @return {?}
     */
    _setBoundingBoxStyles(origin, position) {
        /** @type {?} */
        const boundingBoxRect = this._calculateBoundingBoxRect(origin, position);
        // It's weird if the overlay *grows* while scrolling, so we take the last size into account
        // when applying a new size.
        if (!this._isInitialRender && !this._growAfterOpen) {
            boundingBoxRect.height = Math.min(boundingBoxRect.height, this._lastBoundingBoxSize.height);
            boundingBoxRect.width = Math.min(boundingBoxRect.width, this._lastBoundingBoxSize.width);
        }
        /** @type {?} */
        const styles = (/** @type {?} */ ({}));
        if (this._hasExactPosition()) {
            styles.top = styles.left = '0';
            styles.bottom = styles.right = styles.maxHeight = styles.maxWidth = '';
            styles.width = styles.height = '100%';
        }
        else {
            /** @type {?} */
            const maxHeight = this._overlayRef.getConfig().maxHeight;
            /** @type {?} */
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
        extendStyles((/** @type {?} */ (this._boundingBox)).style, styles);
    }
    /**
     * Resets the styles for the bounding box so that a new positioning can be computed.
     * @private
     * @return {?}
     */
    _resetBoundingBoxStyles() {
        extendStyles((/** @type {?} */ (this._boundingBox)).style, (/** @type {?} */ ({
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            height: '',
            width: '',
            alignItems: '',
            justifyContent: '',
        })));
    }
    /**
     * Resets the styles for the overlay pane so that a new positioning can be computed.
     * @private
     * @return {?}
     */
    _resetOverlayElementStyles() {
        extendStyles(this._pane.style, (/** @type {?} */ ({
            top: '',
            left: '',
            bottom: '',
            right: '',
            position: '',
            transform: '',
        })));
    }
    /**
     * Sets positioning styles to the overlay element.
     * @private
     * @param {?} originPoint
     * @param {?} position
     * @return {?}
     */
    _setOverlayElementStyles(originPoint, position) {
        /** @type {?} */
        const styles = (/** @type {?} */ ({}));
        /** @type {?} */
        const hasExactPosition = this._hasExactPosition();
        /** @type {?} */
        const hasFlexibleDimensions = this._hasFlexibleDimensions;
        /** @type {?} */
        const config = this._overlayRef.getConfig();
        if (hasExactPosition) {
            /** @type {?} */
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
        /** @type {?} */
        let transformString = '';
        /** @type {?} */
        let offsetX = this._getOffset(position, 'x');
        /** @type {?} */
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
    /**
     * Gets the exact top/bottom for the overlay when not using flexible sizing or when pushing.
     * @private
     * @param {?} position
     * @param {?} originPoint
     * @param {?} scrollPosition
     * @return {?}
     */
    _getExactOverlayY(position, originPoint, scrollPosition) {
        // Reset any existing styles. This is necessary in case the
        // preferred position has changed since the last `apply`.
        /** @type {?} */
        let styles = (/** @type {?} */ ({ top: null, bottom: null }));
        /** @type {?} */
        let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
        if (this._isPushed) {
            overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
        }
        /** @type {?} */
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
            /** @type {?} */
            const documentHeight = (/** @type {?} */ (this._document.documentElement)).clientHeight;
            styles.bottom = `${documentHeight - (overlayPoint.y + this._overlayRect.height)}px`;
        }
        else {
            styles.top = coerceCssPixelValue(overlayPoint.y);
        }
        return styles;
    }
    /**
     * Gets the exact left/right for the overlay when not using flexible sizing or when pushing.
     * @private
     * @param {?} position
     * @param {?} originPoint
     * @param {?} scrollPosition
     * @return {?}
     */
    _getExactOverlayX(position, originPoint, scrollPosition) {
        // Reset any existing styles. This is necessary in case the preferred position has
        // changed since the last `apply`.
        /** @type {?} */
        let styles = (/** @type {?} */ ({ left: null, right: null }));
        /** @type {?} */
        let overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
        if (this._isPushed) {
            overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
        }
        // We want to set either `left` or `right` based on whether the overlay wants to appear "before"
        // or "after" the origin, which determines the direction in which the element will expand.
        // For the horizontal axis, the meaning of "before" and "after" change based on whether the
        // page is in RTL or LTR.
        /** @type {?} */
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
            /** @type {?} */
            const documentWidth = (/** @type {?} */ (this._document.documentElement)).clientWidth;
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
     * @private
     * @return {?}
     */
    _getScrollVisibility() {
        // Note: needs fresh rects since the position could've changed.
        /** @type {?} */
        const originBounds = this._getOriginRect();
        /** @type {?} */
        const overlayBounds = this._pane.getBoundingClientRect();
        // TODO(jelbourn): instead of needing all of the client rects for these scrolling containers
        // every time, we should be able to use the scrollTop of the containers if the size of those
        // containers hasn't changed.
        /** @type {?} */
        const scrollContainerBounds = this._scrollables.map((/**
         * @param {?} scrollable
         * @return {?}
         */
        scrollable => {
            return scrollable.getElementRef().nativeElement.getBoundingClientRect();
        }));
        return {
            isOriginClipped: isElementClippedByScrolling(originBounds, scrollContainerBounds),
            isOriginOutsideView: isElementScrolledOutsideView(originBounds, scrollContainerBounds),
            isOverlayClipped: isElementClippedByScrolling(overlayBounds, scrollContainerBounds),
            isOverlayOutsideView: isElementScrolledOutsideView(overlayBounds, scrollContainerBounds),
        };
    }
    /**
     * Subtracts the amount that an element is overflowing on an axis from its length.
     * @private
     * @param {?} length
     * @param {...?} overflows
     * @return {?}
     */
    _subtractOverflows(length, ...overflows) {
        return overflows.reduce((/**
         * @param {?} currentValue
         * @param {?} currentOverflow
         * @return {?}
         */
        (currentValue, currentOverflow) => {
            return currentValue - Math.max(currentOverflow, 0);
        }), length);
    }
    /**
     * Narrows the given viewport rect by the current _viewportMargin.
     * @private
     * @return {?}
     */
    _getNarrowedViewportRect() {
        // We recalculate the viewport rect here ourselves, rather than using the ViewportRuler,
        // because we want to use the `clientWidth` and `clientHeight` as the base. The difference
        // being that the client properties don't include the scrollbar, as opposed to `innerWidth`
        // and `innerHeight` that do. This is necessary, because the overlay container uses
        // 100% `width` and `height` which don't include the scrollbar either.
        /** @type {?} */
        const width = (/** @type {?} */ (this._document.documentElement)).clientWidth;
        /** @type {?} */
        const height = (/** @type {?} */ (this._document.documentElement)).clientHeight;
        /** @type {?} */
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
    /**
     * Whether the we're dealing with an RTL context
     * @private
     * @return {?}
     */
    _isRtl() {
        return this._overlayRef.getDirection() === 'rtl';
    }
    /**
     * Determines whether the overlay uses exact or flexible positioning.
     * @private
     * @return {?}
     */
    _hasExactPosition() {
        return !this._hasFlexibleDimensions || this._isPushed;
    }
    /**
     * Retrieves the offset of a position along the x or y axis.
     * @private
     * @param {?} position
     * @param {?} axis
     * @return {?}
     */
    _getOffset(position, axis) {
        if (axis === 'x') {
            // We don't do something like `position['offset' + axis]` in
            // order to avoid breking minifiers that rename properties.
            return position.offsetX == null ? this._offsetX : position.offsetX;
        }
        return position.offsetY == null ? this._offsetY : position.offsetY;
    }
    /**
     * Validates that the current position match the expected values.
     * @private
     * @return {?}
     */
    _validatePositions() {
        if (!this._preferredPositions.length) {
            throw Error('FlexibleConnectedPositionStrategy: At least one position is required.');
        }
        // TODO(crisbeto): remove these once Angular's template type
        // checking is advanced enough to catch these cases.
        this._preferredPositions.forEach((/**
         * @param {?} pair
         * @return {?}
         */
        pair => {
            validateHorizontalPosition('originX', pair.originX);
            validateVerticalPosition('originY', pair.originY);
            validateHorizontalPosition('overlayX', pair.overlayX);
            validateVerticalPosition('overlayY', pair.overlayY);
        }));
    }
    /**
     * Adds a single CSS class or an array of classes on the overlay panel.
     * @private
     * @param {?} cssClasses
     * @return {?}
     */
    _addPanelClasses(cssClasses) {
        if (this._pane) {
            coerceArray(cssClasses).forEach((/**
             * @param {?} cssClass
             * @return {?}
             */
            cssClass => {
                if (cssClass !== '' && this._appliedPanelClasses.indexOf(cssClass) === -1) {
                    this._appliedPanelClasses.push(cssClass);
                    this._pane.classList.add(cssClass);
                }
            }));
        }
    }
    /**
     * Clears the classes that the position strategy has applied from the overlay panel.
     * @private
     * @return {?}
     */
    _clearPanelClasses() {
        if (this._pane) {
            this._appliedPanelClasses.forEach((/**
             * @param {?} cssClass
             * @return {?}
             */
            cssClass => {
                this._pane.classList.remove(cssClass);
            }));
            this._appliedPanelClasses = [];
        }
    }
    /**
     * Returns the ClientRect of the current origin.
     * @private
     * @return {?}
     */
    _getOriginRect() {
        /** @type {?} */
        const origin = this._origin;
        if (origin instanceof ElementRef) {
            return origin.nativeElement.getBoundingClientRect();
        }
        if (origin instanceof HTMLElement) {
            return origin.getBoundingClientRect();
        }
        /** @type {?} */
        const width = origin.width || 0;
        /** @type {?} */
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
if (false) {
    /**
     * The overlay to which this strategy is attached.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._overlayRef;
    /**
     * Whether we're performing the very first positioning of the overlay.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._isInitialRender;
    /**
     * Last size used for the bounding box. Used to avoid resizing the overlay after open.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._lastBoundingBoxSize;
    /**
     * Whether the overlay was pushed in a previous positioning.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._isPushed;
    /**
     * Whether the overlay can be pushed on-screen on the initial open.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._canPush;
    /**
     * Whether the overlay can grow via flexible width/height after the initial open.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._growAfterOpen;
    /**
     * Whether the overlay's width and height can be constrained to fit within the viewport.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._hasFlexibleDimensions;
    /**
     * Whether the overlay position is locked.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._positionLocked;
    /**
     * Cached origin dimensions
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._originRect;
    /**
     * Cached overlay dimensions
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._overlayRect;
    /**
     * Cached viewport dimensions
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._viewportRect;
    /**
     * Amount of space that must be maintained between the overlay and the edge of the viewport.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._viewportMargin;
    /**
     * The Scrollable containers used to check scrollable view properties on position change.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._scrollables;
    /**
     * Ordered list of preferred positions, from most to least desirable.
     * @type {?}
     */
    FlexibleConnectedPositionStrategy.prototype._preferredPositions;
    /**
     * The origin element against which the overlay will be positioned.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._origin;
    /**
     * The overlay pane element.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._pane;
    /**
     * Whether the strategy has been disposed of already.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._isDisposed;
    /**
     * Parent element for the overlay panel used to constrain the overlay panel's size to fit
     * within the viewport.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._boundingBox;
    /**
     * The last position to have been calculated as the best fit position.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._lastPosition;
    /**
     * Subject that emits whenever the position changes.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._positionChanges;
    /**
     * Subscription to viewport size changes.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._resizeSubscription;
    /**
     * Default offset for the overlay along the x axis.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._offsetX;
    /**
     * Default offset for the overlay along the y axis.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._offsetY;
    /**
     * Selector to be used when finding the elements on which to set the transform origin.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._transformOriginSelector;
    /**
     * Keeps track of the CSS classes that the position strategy has applied on the overlay panel.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._appliedPanelClasses;
    /**
     * Amount by which the overlay was pushed in each axis during the last time it was positioned.
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._previousPushAmount;
    /**
     * Observable sequence of position changes.
     * @type {?}
     */
    FlexibleConnectedPositionStrategy.prototype.positionChanges;
    /**
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._viewportRuler;
    /**
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._document;
    /**
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._platform;
    /**
     * @type {?}
     * @private
     */
    FlexibleConnectedPositionStrategy.prototype._overlayContainer;
}
/**
 * A simple (x, y) coordinate.
 * @record
 */
function Point() { }
if (false) {
    /** @type {?} */
    Point.prototype.x;
    /** @type {?} */
    Point.prototype.y;
}
/**
 * Record of measurements for how an overlay (at a given position) fits into the viewport.
 * @record
 */
function OverlayFit() { }
if (false) {
    /**
     * Whether the overlay fits completely in the viewport.
     * @type {?}
     */
    OverlayFit.prototype.isCompletelyWithinViewport;
    /**
     * Whether the overlay fits in the viewport on the y-axis.
     * @type {?}
     */
    OverlayFit.prototype.fitsInViewportVertically;
    /**
     * Whether the overlay fits in the viewport on the x-axis.
     * @type {?}
     */
    OverlayFit.prototype.fitsInViewportHorizontally;
    /**
     * The total visible area (in px^2) of the overlay inside the viewport.
     * @type {?}
     */
    OverlayFit.prototype.visibleArea;
}
/**
 * Record of the measurments determining whether an overlay will fit in a specific position.
 * @record
 */
function FallbackPosition() { }
if (false) {
    /** @type {?} */
    FallbackPosition.prototype.position;
    /** @type {?} */
    FallbackPosition.prototype.originPoint;
    /** @type {?} */
    FallbackPosition.prototype.overlayPoint;
    /** @type {?} */
    FallbackPosition.prototype.overlayFit;
    /** @type {?} */
    FallbackPosition.prototype.overlayRect;
}
/**
 * Position and size of the overlay sizing wrapper for a specific position.
 * @record
 */
function BoundingBoxRect() { }
if (false) {
    /** @type {?} */
    BoundingBoxRect.prototype.top;
    /** @type {?} */
    BoundingBoxRect.prototype.left;
    /** @type {?} */
    BoundingBoxRect.prototype.bottom;
    /** @type {?} */
    BoundingBoxRect.prototype.right;
    /** @type {?} */
    BoundingBoxRect.prototype.height;
    /** @type {?} */
    BoundingBoxRect.prototype.width;
}
/**
 * Record of measures determining how well a given position will fit with flexible dimensions.
 * @record
 */
function FlexibleFit() { }
if (false) {
    /** @type {?} */
    FlexibleFit.prototype.position;
    /** @type {?} */
    FlexibleFit.prototype.origin;
    /** @type {?} */
    FlexibleFit.prototype.overlayRect;
    /** @type {?} */
    FlexibleFit.prototype.boundingBoxRect;
}
/**
 * A connected position as specified by the user.
 * @record
 */
export function ConnectedPosition() { }
if (false) {
    /** @type {?} */
    ConnectedPosition.prototype.originX;
    /** @type {?} */
    ConnectedPosition.prototype.originY;
    /** @type {?} */
    ConnectedPosition.prototype.overlayX;
    /** @type {?} */
    ConnectedPosition.prototype.overlayY;
    /** @type {?|undefined} */
    ConnectedPosition.prototype.weight;
    /** @type {?|undefined} */
    ConnectedPosition.prototype.offsetX;
    /** @type {?|undefined} */
    ConnectedPosition.prototype.offsetY;
    /** @type {?|undefined} */
    ConnectedPosition.prototype.panelClass;
}
/**
 * Shallow-extends a stylesheet object with another stylesheet object.
 * @param {?} dest
 * @param {?} source
 * @return {?}
 */
function extendStyles(dest, source) {
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            dest[key] = source[key];
        }
    }
    return dest;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFDTCw4QkFBOEIsRUFHOUIsMEJBQTBCLEVBQzFCLHdCQUF3QixHQUN6QixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBYSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRXZELE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RixPQUFPLEVBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7TUFRakUsZ0JBQWdCLEdBQUcsNkNBQTZDOzs7Ozs7OztBQWV0RSxNQUFNLE9BQU8saUNBQWlDOzs7Ozs7OztJQTJGNUMsWUFDSSxXQUFvRCxFQUFVLGNBQTZCLEVBQ25GLFNBQW1CLEVBQVUsU0FBbUIsRUFDaEQsaUJBQW1DO1FBRm1CLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBQ25GLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ2hELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7Ozs7UUF0RnZDLHlCQUFvQixHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFDLENBQUM7Ozs7UUFHN0MsY0FBUyxHQUFHLEtBQUssQ0FBQzs7OztRQUdsQixhQUFRLEdBQUcsSUFBSSxDQUFDOzs7O1FBR2hCLG1CQUFjLEdBQUcsS0FBSyxDQUFDOzs7O1FBR3ZCLDJC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O0lBQ2YsZ0NBQWM7O0lBQ2QsaUNBQWU7O0lBQ2YsZ0NBQWM7Ozs7OztBQUloQiwwQkFLQzs7O0lBSkMsK0JBQTRCOztJQUM1Qiw2QkFBYzs7SUFDZCxrQ0FBd0I7O0lBQ3hCLHNDQUFpQzs7Ozs7O0FBSW5DLHVDQVdDOzs7SUFWQyxvQ0FBb0M7O0lBQ3BDLG9DQUFxQzs7SUFFckMscUNBQXFDOztJQUNyQyxxQ0FBc0M7O0lBRXRDLG1DQUFnQjs7SUFDaEIsb0NBQWlCOztJQUNqQixvQ0FBaUI7O0lBQ2pCLHVDQUErQjs7Ozs7Ozs7QUFJakMsU0FBUyxZQUFZLENBQUMsSUFBeUIsRUFBRSxNQUEyQjtJQUMxRSxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtRQUN0QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN6QjtLQUNGO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyLCBDZGtTY3JvbGxhYmxlLCBWaWV3cG9ydFNjcm9sbFBvc2l0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZSxcbiAgQ29ubmVjdGlvblBvc2l0aW9uUGFpcixcbiAgU2Nyb2xsaW5nVmlzaWJpbGl0eSxcbiAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24sXG4gIHZhbGlkYXRlVmVydGljYWxQb3NpdGlvbixcbn0gZnJvbSAnLi9jb25uZWN0ZWQtcG9zaXRpb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb24sIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtPdmVybGF5UmVmZXJlbmNlfSBmcm9tICcuLi9vdmVybGF5LXJlZmVyZW5jZSc7XG5pbXBvcnQge2lzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcsIGlzRWxlbWVudENsaXBwZWRCeVNjcm9sbGluZ30gZnJvbSAnLi9zY3JvbGwtY2xpcCc7XG5pbXBvcnQge2NvZXJjZUNzc1BpeGVsVmFsdWUsIGNvZXJjZUFycmF5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7T3ZlcmxheUNvbnRhaW5lcn0gZnJvbSAnLi4vb3ZlcmxheS1jb250YWluZXInO1xuXG4vLyBUT0RPOiByZWZhY3RvciBjbGlwcGluZyBkZXRlY3Rpb24gaW50byBhIHNlcGFyYXRlIHRoaW5nIChwYXJ0IG9mIHNjcm9sbGluZyBtb2R1bGUpXG4vLyBUT0RPOiBkb2Vzbid0IGhhbmRsZSBib3RoIGZsZXhpYmxlIHdpZHRoIGFuZCBoZWlnaHQgd2hlbiBpdCBoYXMgdG8gc2Nyb2xsIGFsb25nIGJvdGggYXhpcy5cblxuLyoqIENsYXNzIHRvIGJlIGFkZGVkIHRvIHRoZSBvdmVybGF5IGJvdW5kaW5nIGJveC4gKi9cbmNvbnN0IGJvdW5kaW5nQm94Q2xhc3MgPSAnY2RrLW92ZXJsYXktY29ubmVjdGVkLXBvc2l0aW9uLWJvdW5kaW5nLWJveCc7XG5cbi8qKiBQb3NzaWJsZSB2YWx1ZXMgdGhhdCBjYW4gYmUgc2V0IGFzIHRoZSBvcmlnaW4gb2YgYSBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kuICovXG5leHBvcnQgdHlwZSBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4gPSBFbGVtZW50UmVmIHwgSFRNTEVsZW1lbnQgfCBQb2ludCAmIHtcbiAgd2lkdGg/OiBudW1iZXI7XG4gIGhlaWdodD86IG51bWJlcjtcbn07XG5cbi8qKlxuICogQSBzdHJhdGVneSBmb3IgcG9zaXRpb25pbmcgb3ZlcmxheXMuIFVzaW5nIHRoaXMgc3RyYXRlZ3ksIGFuIG92ZXJsYXkgaXMgZ2l2ZW4gYW5cbiAqIGltcGxpY2l0IHBvc2l0aW9uIHJlbGF0aXZlIHNvbWUgb3JpZ2luIGVsZW1lbnQuIFRoZSByZWxhdGl2ZSBwb3NpdGlvbiBpcyBkZWZpbmVkIGluIHRlcm1zIG9mXG4gKiBhIHBvaW50IG9uIHRoZSBvcmlnaW4gZWxlbWVudCB0aGF0IGlzIGNvbm5lY3RlZCB0byBhIHBvaW50IG9uIHRoZSBvdmVybGF5IGVsZW1lbnQuIEZvciBleGFtcGxlLFxuICogYSBiYXNpYyBkcm9wZG93biBpcyBjb25uZWN0aW5nIHRoZSBib3R0b20tbGVmdCBjb3JuZXIgb2YgdGhlIG9yaWdpbiB0byB0aGUgdG9wLWxlZnQgY29ybmVyXG4gKiBvZiB0aGUgb3ZlcmxheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSBpbXBsZW1lbnRzIFBvc2l0aW9uU3RyYXRlZ3kge1xuICAvKiogVGhlIG92ZXJsYXkgdG8gd2hpY2ggdGhpcyBzdHJhdGVneSBpcyBhdHRhY2hlZC4gKi9cbiAgcHJpdmF0ZSBfb3ZlcmxheVJlZjogT3ZlcmxheVJlZmVyZW5jZTtcblxuICAvKiogV2hldGhlciB3ZSdyZSBwZXJmb3JtaW5nIHRoZSB2ZXJ5IGZpcnN0IHBvc2l0aW9uaW5nIG9mIHRoZSBvdmVybGF5LiAqL1xuICBwcml2YXRlIF9pc0luaXRpYWxSZW5kZXI6IGJvb2xlYW47XG5cbiAgLyoqIExhc3Qgc2l6ZSB1c2VkIGZvciB0aGUgYm91bmRpbmcgYm94LiBVc2VkIHRvIGF2b2lkIHJlc2l6aW5nIHRoZSBvdmVybGF5IGFmdGVyIG9wZW4uICovXG4gIHByaXZhdGUgX2xhc3RCb3VuZGluZ0JveFNpemUgPSB7d2lkdGg6IDAsIGhlaWdodDogMH07XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgd2FzIHB1c2hlZCBpbiBhIHByZXZpb3VzIHBvc2l0aW9uaW5nLiAqL1xuICBwcml2YXRlIF9pc1B1c2hlZCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIG9uIHRoZSBpbml0aWFsIG9wZW4uICovXG4gIHByaXZhdGUgX2NhblB1c2ggPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IHZpYSBmbGV4aWJsZSB3aWR0aC9oZWlnaHQgYWZ0ZXIgdGhlIGluaXRpYWwgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfZ3Jvd0FmdGVyT3BlbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5J3Mgd2lkdGggYW5kIGhlaWdodCBjYW4gYmUgY29uc3RyYWluZWQgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX2hhc0ZsZXhpYmxlRGltZW5zaW9ucyA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgcG9zaXRpb24gaXMgbG9ja2VkLiAqL1xuICBwcml2YXRlIF9wb3NpdGlvbkxvY2tlZCA9IGZhbHNlO1xuXG4gIC8qKiBDYWNoZWQgb3JpZ2luIGRpbWVuc2lvbnMgKi9cbiAgcHJpdmF0ZSBfb3JpZ2luUmVjdDogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIG92ZXJsYXkgZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF9vdmVybGF5UmVjdDogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIHZpZXdwb3J0IGRpbWVuc2lvbnMgKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRSZWN0OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBBbW91bnQgb2Ygc3BhY2UgdGhhdCBtdXN0IGJlIG1haW50YWluZWQgYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF92aWV3cG9ydE1hcmdpbiA9IDA7XG5cbiAgLyoqIFRoZSBTY3JvbGxhYmxlIGNvbnRhaW5lcnMgdXNlZCB0byBjaGVjayBzY3JvbGxhYmxlIHZpZXcgcHJvcGVydGllcyBvbiBwb3NpdGlvbiBjaGFuZ2UuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVzOiBDZGtTY3JvbGxhYmxlW10gPSBbXTtcblxuICAvKiogT3JkZXJlZCBsaXN0IG9mIHByZWZlcnJlZCBwb3NpdGlvbnMsIGZyb20gbW9zdCB0byBsZWFzdCBkZXNpcmFibGUuICovXG4gIF9wcmVmZXJyZWRQb3NpdGlvbnM6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSA9IFtdO1xuXG4gIC8qKiBUaGUgb3JpZ2luIGVsZW1lbnQgYWdhaW5zdCB3aGljaCB0aGUgb3ZlcmxheSB3aWxsIGJlIHBvc2l0aW9uZWQuICovXG4gIHByaXZhdGUgX29yaWdpbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luO1xuXG4gIC8qKiBUaGUgb3ZlcmxheSBwYW5lIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BhbmU6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBzdHJhdGVneSBoYXMgYmVlbiBkaXNwb3NlZCBvZiBhbHJlYWR5LiAqL1xuICBwcml2YXRlIF9pc0Rpc3Bvc2VkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBQYXJlbnQgZWxlbWVudCBmb3IgdGhlIG92ZXJsYXkgcGFuZWwgdXNlZCB0byBjb25zdHJhaW4gdGhlIG92ZXJsYXkgcGFuZWwncyBzaXplIHRvIGZpdFxuICAgKiB3aXRoaW4gdGhlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYm91bmRpbmdCb3g6IEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAvKiogVGhlIGxhc3QgcG9zaXRpb24gdG8gaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgYXMgdGhlIGJlc3QgZml0IHBvc2l0aW9uLiAqL1xuICBwcml2YXRlIF9sYXN0UG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uIHwgbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSBwb3NpdGlvbiBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF9wb3NpdGlvbkNoYW5nZXMgPSBuZXcgU3ViamVjdDxDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2U+KCk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB2aWV3cG9ydCBzaXplIGNoYW5nZXMuICovXG4gIHByaXZhdGUgX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogRGVmYXVsdCBvZmZzZXQgZm9yIHRoZSBvdmVybGF5IGFsb25nIHRoZSB4IGF4aXMuICovXG4gIHByaXZhdGUgX29mZnNldFggPSAwO1xuXG4gIC8qKiBEZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkgYWxvbmcgdGhlIHkgYXhpcy4gKi9cbiAgcHJpdmF0ZSBfb2Zmc2V0WSA9IDA7XG5cbiAgLyoqIFNlbGVjdG9yIHRvIGJlIHVzZWQgd2hlbiBmaW5kaW5nIHRoZSBlbGVtZW50cyBvbiB3aGljaCB0byBzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4uICovXG4gIHByaXZhdGUgX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBDU1MgY2xhc3NlcyB0aGF0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBoYXMgYXBwbGllZCBvbiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfYXBwbGllZFBhbmVsQ2xhc3Nlczogc3RyaW5nW10gPSBbXTtcblxuICAvKiogQW1vdW50IGJ5IHdoaWNoIHRoZSBvdmVybGF5IHdhcyBwdXNoZWQgaW4gZWFjaCBheGlzIGR1cmluZyB0aGUgbGFzdCB0aW1lIGl0IHdhcyBwb3NpdGlvbmVkLiAqL1xuICBwcml2YXRlIF9wcmV2aW91c1B1c2hBbW91bnQ6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0gfCBudWxsO1xuXG4gIC8qKiBPYnNlcnZhYmxlIHNlcXVlbmNlIG9mIHBvc2l0aW9uIGNoYW5nZXMuICovXG4gIHBvc2l0aW9uQ2hhbmdlczogT2JzZXJ2YWJsZTxDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2U+ID1cbiAgICAgIHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5hc09ic2VydmFibGUoKTtcblxuICAvKiogT3JkZXJlZCBsaXN0IG9mIHByZWZlcnJlZCBwb3NpdGlvbnMsIGZyb20gbW9zdCB0byBsZWFzdCBkZXNpcmFibGUuICovXG4gIGdldCBwb3NpdGlvbnMoKTogQ29ubmVjdGlvblBvc2l0aW9uUGFpcltdIHtcbiAgICByZXR1cm4gdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb25uZWN0ZWRUbzogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luLCBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LCBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyKSB7XG4gICAgdGhpcy5zZXRPcmlnaW4oY29ubmVjdGVkVG8pO1xuICB9XG5cbiAgLyoqIEF0dGFjaGVzIHRoaXMgcG9zaXRpb24gc3RyYXRlZ3kgdG8gYW4gb3ZlcmxheS4gKi9cbiAgYXR0YWNoKG92ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZiAmJiBvdmVybGF5UmVmICE9PSB0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aHJvdyBFcnJvcignVGhpcyBwb3NpdGlvbiBzdHJhdGVneSBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGFuIG92ZXJsYXknKTtcbiAgICB9XG5cbiAgICB0aGlzLl92YWxpZGF0ZVBvc2l0aW9ucygpO1xuXG4gICAgb3ZlcmxheVJlZi5ob3N0RWxlbWVudC5jbGFzc0xpc3QuYWRkKGJvdW5kaW5nQm94Q2xhc3MpO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IG92ZXJsYXlSZWY7XG4gICAgdGhpcy5fYm91bmRpbmdCb3ggPSBvdmVybGF5UmVmLmhvc3RFbGVtZW50O1xuICAgIHRoaXMuX3BhbmUgPSBvdmVybGF5UmVmLm92ZXJsYXlFbGVtZW50O1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSB0cnVlO1xuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlci5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgLy8gV2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWQsIHdlIHdhbnQgdG8gdHJpZ2dlciB0aGUgbmV4dCByZXBvc2l0aW9uIGFzIGlmIGl0XG4gICAgICAvLyB3YXMgYW4gaW5pdGlhbCByZW5kZXIsIGluIG9yZGVyIGZvciB0aGUgc3RyYXRlZ3kgdG8gcGljayBhIG5ldyBvcHRpbWFsIHBvc2l0aW9uLFxuICAgICAgLy8gb3RoZXJ3aXNlIHBvc2l0aW9uIGxvY2tpbmcgd2lsbCBjYXVzZSBpdCB0byBzdGF5IGF0IHRoZSBvbGQgb25lLlxuICAgICAgdGhpcy5faXNJbml0aWFsUmVuZGVyID0gdHJ1ZTtcbiAgICAgIHRoaXMuYXBwbHkoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheSBlbGVtZW50LCB1c2luZyB3aGljaGV2ZXIgcHJlZmVycmVkIHBvc2l0aW9uIHJlbGF0aXZlXG4gICAqIHRvIHRoZSBvcmlnaW4gYmVzdCBmaXRzIG9uLXNjcmVlbi5cbiAgICpcbiAgICogVGhlIHNlbGVjdGlvbiBvZiBhIHBvc2l0aW9uIGdvZXMgYXMgZm9sbG93czpcbiAgICogIC0gSWYgYW55IHBvc2l0aW9ucyBmaXQgY29tcGxldGVseSB3aXRoaW4gdGhlIHZpZXdwb3J0IGFzLWlzLFxuICAgKiAgICAgIGNob29zZSB0aGUgZmlyc3QgcG9zaXRpb24gdGhhdCBkb2VzIHNvLlxuICAgKiAgLSBJZiBmbGV4aWJsZSBkaW1lbnNpb25zIGFyZSBlbmFibGVkIGFuZCBhdCBsZWFzdCBvbmUgc2F0aWZpZXMgdGhlIGdpdmVuIG1pbmltdW0gd2lkdGgvaGVpZ2h0LFxuICAgKiAgICAgIGNob29zZSB0aGUgcG9zaXRpb24gd2l0aCB0aGUgZ3JlYXRlc3QgYXZhaWxhYmxlIHNpemUgbW9kaWZpZWQgYnkgdGhlIHBvc2l0aW9ucycgd2VpZ2h0LlxuICAgKiAgLSBJZiBwdXNoaW5nIGlzIGVuYWJsZWQsIHRha2UgdGhlIHBvc2l0aW9uIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdCBhbmQgcHVzaCBpdFxuICAgKiAgICAgIG9uLXNjcmVlbi5cbiAgICogIC0gSWYgbm9uZSBvZiB0aGUgcHJldmlvdXMgY3JpdGVyaWEgd2VyZSBtZXQsIHVzZSB0aGUgcG9zaXRpb24gdGhhdCBnb2VzIG9mZi1zY3JlZW4gdGhlIGxlYXN0LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBhcHBseSgpOiB2b2lkIHtcbiAgICAvLyBXZSBzaG91bGRuJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHN0cmF0ZWd5IHdhcyBkaXNwb3NlZCBvciB3ZSdyZSBvbiB0aGUgc2VydmVyLlxuICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkIHx8ICF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcG9zaXRpb24gaGFzIGJlZW4gYXBwbGllZCBhbHJlYWR5IChlLmcuIHdoZW4gdGhlIG92ZXJsYXkgd2FzIG9wZW5lZCkgYW5kIHRoZVxuICAgIC8vIGNvbnN1bWVyIG9wdGVkIGludG8gbG9ja2luZyBpbiB0aGUgcG9zaXRpb24sIHJlLXVzZSB0aGUgb2xkIHBvc2l0aW9uLCBpbiBvcmRlciB0b1xuICAgIC8vIHByZXZlbnQgdGhlIG92ZXJsYXkgZnJvbSBqdW1waW5nIGFyb3VuZC5cbiAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiB0aGlzLl9wb3NpdGlvbkxvY2tlZCAmJiB0aGlzLl9sYXN0UG9zaXRpb24pIHtcbiAgICAgIHRoaXMucmVhcHBseUxhc3RQb3NpdGlvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyUGFuZWxDbGFzc2VzKCk7XG4gICAgdGhpcy5fcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpO1xuICAgIHRoaXMuX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXMoKTtcblxuICAgIC8vIFdlIG5lZWQgdGhlIGJvdW5kaW5nIHJlY3RzIGZvciB0aGUgb3JpZ2luIGFuZCB0aGUgb3ZlcmxheSB0byBkZXRlcm1pbmUgaG93IHRvIHBvc2l0aW9uXG4gICAgLy8gdGhlIG92ZXJsYXkgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbi5cbiAgICAvLyBXZSB1c2UgdGhlIHZpZXdwb3J0IHJlY3QgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBwb3NpdGlvbiB3b3VsZCBnbyBvZmYtc2NyZWVuLlxuICAgIHRoaXMuX3ZpZXdwb3J0UmVjdCA9IHRoaXMuX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk7XG4gICAgdGhpcy5fb3JpZ2luUmVjdCA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICB0aGlzLl9vdmVybGF5UmVjdCA9IHRoaXMuX3BhbmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCBvcmlnaW5SZWN0ID0gdGhpcy5fb3JpZ2luUmVjdDtcbiAgICBjb25zdCBvdmVybGF5UmVjdCA9IHRoaXMuX292ZXJsYXlSZWN0O1xuICAgIGNvbnN0IHZpZXdwb3J0UmVjdCA9IHRoaXMuX3ZpZXdwb3J0UmVjdDtcblxuICAgIC8vIFBvc2l0aW9ucyB3aGVyZSB0aGUgb3ZlcmxheSB3aWxsIGZpdCB3aXRoIGZsZXhpYmxlIGRpbWVuc2lvbnMuXG4gICAgY29uc3QgZmxleGlibGVGaXRzOiBGbGV4aWJsZUZpdFtdID0gW107XG5cbiAgICAvLyBGYWxsYmFjayBpZiBub25lIG9mIHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LlxuICAgIGxldCBmYWxsYmFjazogRmFsbGJhY2tQb3NpdGlvbiB8IHVuZGVmaW5lZDtcblxuICAgIC8vIEdvIHRocm91Z2ggZWFjaCBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBsb29raW5nIGZvciBhIGdvb2QgZml0LlxuICAgIC8vIElmIGEgZ29vZCBmaXQgaXMgZm91bmQsIGl0IHdpbGwgYmUgYXBwbGllZCBpbW1lZGlhdGVseS5cbiAgICBmb3IgKGxldCBwb3Mgb2YgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zKSB7XG4gICAgICAvLyBHZXQgdGhlIGV4YWN0ICh4LCB5KSBjb29yZGluYXRlIGZvciB0aGUgcG9pbnQtb2Ytb3JpZ2luIG9uIHRoZSBvcmlnaW4gZWxlbWVudC5cbiAgICAgIGxldCBvcmlnaW5Qb2ludCA9IHRoaXMuX2dldE9yaWdpblBvaW50KG9yaWdpblJlY3QsIHBvcyk7XG5cbiAgICAgIC8vIEZyb20gdGhhdCBwb2ludC1vZi1vcmlnaW4sIGdldCB0aGUgZXhhY3QgKHgsIHkpIGNvb3JkaW5hdGUgZm9yIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlXG4gICAgICAvLyBvdmVybGF5IGluIHRoaXMgcG9zaXRpb24uIFdlIHVzZSB0aGUgdG9wLWxlZnQgY29ybmVyIGZvciBjYWxjdWxhdGlvbnMgYW5kIGxhdGVyIHRyYW5zbGF0ZVxuICAgICAgLy8gdGhpcyBpbnRvIGFuIGFwcHJvcHJpYXRlICh0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQpIHN0eWxlLlxuICAgICAgbGV0IG92ZXJsYXlQb2ludCA9IHRoaXMuX2dldE92ZXJsYXlQb2ludChvcmlnaW5Qb2ludCwgb3ZlcmxheVJlY3QsIHBvcyk7XG5cbiAgICAgIC8vIENhbGN1bGF0ZSBob3cgd2VsbCB0aGUgb3ZlcmxheSB3b3VsZCBmaXQgaW50byB0aGUgdmlld3BvcnQgd2l0aCB0aGlzIHBvaW50LlxuICAgICAgbGV0IG92ZXJsYXlGaXQgPSB0aGlzLl9nZXRPdmVybGF5Rml0KG92ZXJsYXlQb2ludCwgb3ZlcmxheVJlY3QsIHZpZXdwb3J0UmVjdCwgcG9zKTtcblxuICAgICAgLy8gSWYgdGhlIG92ZXJsYXksIHdpdGhvdXQgYW55IGZ1cnRoZXIgd29yaywgZml0cyBpbnRvIHRoZSB2aWV3cG9ydCwgdXNlIHRoaXMgcG9zaXRpb24uXG4gICAgICBpZiAob3ZlcmxheUZpdC5pc0NvbXBsZXRlbHlXaXRoaW5WaWV3cG9ydCkge1xuICAgICAgICB0aGlzLl9pc1B1c2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKHBvcywgb3JpZ2luUG9pbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBvdmVybGF5IGhhcyBmbGV4aWJsZSBkaW1lbnNpb25zLCB3ZSBjYW4gdXNlIHRoaXMgcG9zaXRpb25cbiAgICAgIC8vIHNvIGxvbmcgYXMgdGhlcmUncyBlbm91Z2ggc3BhY2UgZm9yIHRoZSBtaW5pbXVtIGRpbWVuc2lvbnMuXG4gICAgICBpZiAodGhpcy5fY2FuRml0V2l0aEZsZXhpYmxlRGltZW5zaW9ucyhvdmVybGF5Rml0LCBvdmVybGF5UG9pbnQsIHZpZXdwb3J0UmVjdCkpIHtcbiAgICAgICAgLy8gU2F2ZSBwb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLiBXZSB3aWxsIHVzZSB0aGVzZVxuICAgICAgICAvLyBpZiBub25lIG9mIHRoZSBwb3NpdGlvbnMgZml0ICp3aXRob3V0KiBmbGV4aWJsZSBkaW1lbnNpb25zLlxuICAgICAgICBmbGV4aWJsZUZpdHMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICBvcmlnaW46IG9yaWdpblBvaW50LFxuICAgICAgICAgIG92ZXJsYXlSZWN0LFxuICAgICAgICAgIGJvdW5kaW5nQm94UmVjdDogdGhpcy5fY2FsY3VsYXRlQm91bmRpbmdCb3hSZWN0KG9yaWdpblBvaW50LCBwb3MpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY3VycmVudCBwcmVmZXJyZWQgcG9zaXRpb24gZG9lcyBub3QgZml0IG9uIHRoZSBzY3JlZW4sIHJlbWVtYmVyIHRoZSBwb3NpdGlvblxuICAgICAgLy8gaWYgaXQgaGFzIG1vcmUgdmlzaWJsZSBhcmVhIG9uLXNjcmVlbiB0aGFuIHdlJ3ZlIHNlZW4gYW5kIG1vdmUgb250byB0aGUgbmV4dCBwcmVmZXJyZWRcbiAgICAgIC8vIHBvc2l0aW9uLlxuICAgICAgaWYgKCFmYWxsYmFjayB8fCBmYWxsYmFjay5vdmVybGF5Rml0LnZpc2libGVBcmVhIDwgb3ZlcmxheUZpdC52aXNpYmxlQXJlYSkge1xuICAgICAgICBmYWxsYmFjayA9IHtvdmVybGF5Rml0LCBvdmVybGF5UG9pbnQsIG9yaWdpblBvaW50LCBwb3NpdGlvbjogcG9zLCBvdmVybGF5UmVjdH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBwb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd291bGQgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucywgY2hvb3NlIHRoZVxuICAgIC8vIG9uZSB0aGF0IGhhcyB0aGUgZ3JlYXRlc3QgYXJlYSBhdmFpbGFibGUgbW9kaWZpZWQgYnkgdGhlIHBvc2l0aW9uJ3Mgd2VpZ2h0XG4gICAgaWYgKGZsZXhpYmxlRml0cy5sZW5ndGgpIHtcbiAgICAgIGxldCBiZXN0Rml0OiBGbGV4aWJsZUZpdCB8IG51bGwgPSBudWxsO1xuICAgICAgbGV0IGJlc3RTY29yZSA9IC0xO1xuICAgICAgZm9yIChjb25zdCBmaXQgb2YgZmxleGlibGVGaXRzKSB7XG4gICAgICAgIGNvbnN0IHNjb3JlID1cbiAgICAgICAgICAgIGZpdC5ib3VuZGluZ0JveFJlY3Qud2lkdGggKiBmaXQuYm91bmRpbmdCb3hSZWN0LmhlaWdodCAqIChmaXQucG9zaXRpb24ud2VpZ2h0IHx8IDEpO1xuICAgICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgICBiZXN0Rml0ID0gZml0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2lzUHVzaGVkID0gZmFsc2U7XG4gICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGJlc3RGaXQhLnBvc2l0aW9uLCBiZXN0Rml0IS5vcmlnaW4pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdoZW4gbm9uZSBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCwgdGFrZSB0aGUgcG9zaXRpb25cbiAgICAvLyB0aGF0IHdlbnQgb2ZmLXNjcmVlbiB0aGUgbGVhc3QgYW5kIGF0dGVtcHQgdG8gcHVzaCBpdCBvbi1zY3JlZW4uXG4gICAgaWYgKHRoaXMuX2NhblB1c2gpIHtcbiAgICAgIC8vIFRPRE8oamVsYm91cm4pOiBhZnRlciBwdXNoaW5nLCB0aGUgb3BlbmluZyBcImRpcmVjdGlvblwiIG9mIHRoZSBvdmVybGF5IG1pZ2h0IG5vdCBtYWtlIHNlbnNlLlxuICAgICAgdGhpcy5faXNQdXNoZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihmYWxsYmFjayEucG9zaXRpb24sIGZhbGxiYWNrIS5vcmlnaW5Qb2ludCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWxsIG9wdGlvbnMgZm9yIGdldHRpbmcgdGhlIG92ZXJsYXkgd2l0aGluIHRoZSB2aWV3cG9ydCBoYXZlIGJlZW4gZXhoYXVzdGVkLCBzbyBnbyB3aXRoIHRoZVxuICAgIC8vIHBvc2l0aW9uIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdC5cbiAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGZhbGxiYWNrIS5wb3NpdGlvbiwgZmFsbGJhY2shLm9yaWdpblBvaW50KTtcbiAgfVxuXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLl9jbGVhclBhbmVsQ2xhc3NlcygpO1xuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ID0gbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBDbGVhbnVwIGFmdGVyIHRoZSBlbGVtZW50IGdldHMgZGVzdHJveWVkLiAqL1xuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgY2FuJ3QgdXNlIGBfcmVzZXRCb3VuZGluZ0JveFN0eWxlc2AgaGVyZSwgYmVjYXVzZSBpdCByZXNldHNcbiAgICAvLyBzb21lIHByb3BlcnRpZXMgdG8gemVybywgcmF0aGVyIHRoYW4gcmVtb3ZpbmcgdGhlbS5cbiAgICBpZiAodGhpcy5fYm91bmRpbmdCb3gpIHtcbiAgICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveC5zdHlsZSwge1xuICAgICAgICB0b3A6ICcnLFxuICAgICAgICBsZWZ0OiAnJyxcbiAgICAgICAgcmlnaHQ6ICcnLFxuICAgICAgICBib3R0b206ICcnLFxuICAgICAgICBoZWlnaHQ6ICcnLFxuICAgICAgICB3aWR0aDogJycsXG4gICAgICAgIGFsaWduSXRlbXM6ICcnLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJycsXG4gICAgICB9IGFzIENTU1N0eWxlRGVjbGFyYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl9yZXNldE92ZXJsYXlFbGVtZW50U3R5bGVzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuaG9zdEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShib3VuZGluZ0JveENsYXNzKTtcbiAgICB9XG5cbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX292ZXJsYXlSZWYgPSB0aGlzLl9ib3VuZGluZ0JveCA9IG51bGwhO1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgcmUtYWxpZ25zIHRoZSBvdmVybGF5IGVsZW1lbnQgd2l0aCB0aGUgdHJpZ2dlciBpbiBpdHMgbGFzdCBjYWxjdWxhdGVkIHBvc2l0aW9uLFxuICAgKiBldmVuIGlmIGEgcG9zaXRpb24gaGlnaGVyIGluIHRoZSBcInByZWZlcnJlZCBwb3NpdGlvbnNcIiBsaXN0IHdvdWxkIG5vdyBmaXQuIFRoaXNcbiAgICogYWxsb3dzIG9uZSB0byByZS1hbGlnbiB0aGUgcGFuZWwgd2l0aG91dCBjaGFuZ2luZyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIHBhbmVsLlxuICAgKi9cbiAgcmVhcHBseUxhc3RQb3NpdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzRGlzcG9zZWQgJiYgKCF0aGlzLl9wbGF0Zm9ybSB8fCB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpKSB7XG4gICAgICB0aGlzLl9vcmlnaW5SZWN0ID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgICAgdGhpcy5fb3ZlcmxheVJlY3QgPSB0aGlzLl9wYW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgdGhpcy5fdmlld3BvcnRSZWN0ID0gdGhpcy5fZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTtcblxuICAgICAgY29uc3QgbGFzdFBvc2l0aW9uID0gdGhpcy5fbGFzdFBvc2l0aW9uIHx8IHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9uc1swXTtcbiAgICAgIGNvbnN0IG9yaWdpblBvaW50ID0gdGhpcy5fZ2V0T3JpZ2luUG9pbnQodGhpcy5fb3JpZ2luUmVjdCwgbGFzdFBvc2l0aW9uKTtcblxuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihsYXN0UG9zaXRpb24sIG9yaWdpblBvaW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbGlzdCBvZiBTY3JvbGxhYmxlIGNvbnRhaW5lcnMgdGhhdCBob3N0IHRoZSBvcmlnaW4gZWxlbWVudCBzbyB0aGF0XG4gICAqIG9uIHJlcG9zaXRpb24gd2UgY2FuIGV2YWx1YXRlIGlmIGl0IG9yIHRoZSBvdmVybGF5IGhhcyBiZWVuIGNsaXBwZWQgb3Igb3V0c2lkZSB2aWV3LiBFdmVyeVxuICAgKiBTY3JvbGxhYmxlIG11c3QgYmUgYW4gYW5jZXN0b3IgZWxlbWVudCBvZiB0aGUgc3RyYXRlZ3kncyBvcmlnaW4gZWxlbWVudC5cbiAgICovXG4gIHdpdGhTY3JvbGxhYmxlQ29udGFpbmVycyhzY3JvbGxhYmxlczogQ2RrU2Nyb2xsYWJsZVtdKTogdGhpcyB7XG4gICAgdGhpcy5fc2Nyb2xsYWJsZXMgPSBzY3JvbGxhYmxlcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5ldyBwcmVmZXJyZWQgcG9zaXRpb25zLlxuICAgKiBAcGFyYW0gcG9zaXRpb25zIExpc3Qgb2YgcG9zaXRpb25zIG9wdGlvbnMgZm9yIHRoaXMgb3ZlcmxheS5cbiAgICovXG4gIHdpdGhQb3NpdGlvbnMocG9zaXRpb25zOiBDb25uZWN0ZWRQb3NpdGlvbltdKTogdGhpcyB7XG4gICAgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zID0gcG9zaXRpb25zO1xuXG4gICAgLy8gSWYgdGhlIGxhc3QgY2FsY3VsYXRlZCBwb3NpdGlvbiBvYmplY3QgaXNuJ3QgcGFydCBvZiB0aGUgcG9zaXRpb25zIGFueW1vcmUsIGNsZWFyXG4gICAgLy8gaXQgaW4gb3JkZXIgdG8gYXZvaWQgaXQgYmVpbmcgcGlja2VkIHVwIGlmIHRoZSBjb25zdW1lciB0cmllcyB0byByZS1hcHBseS5cbiAgICBpZiAocG9zaXRpb25zLmluZGV4T2YodGhpcy5fbGFzdFBvc2l0aW9uISkgPT09IC0xKSB7XG4gICAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlUG9zaXRpb25zKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbWluaW11bSBkaXN0YW5jZSB0aGUgb3ZlcmxheSBtYXkgYmUgcG9zaXRpb25lZCB0byB0aGUgZWRnZSBvZiB0aGUgdmlld3BvcnQuXG4gICAqIEBwYXJhbSBtYXJnaW4gUmVxdWlyZWQgbWFyZ2luIGJldHdlZW4gdGhlIG92ZXJsYXkgYW5kIHRoZSB2aWV3cG9ydCBlZGdlIGluIHBpeGVscy5cbiAgICovXG4gIHdpdGhWaWV3cG9ydE1hcmdpbihtYXJnaW46IG51bWJlcik6IHRoaXMge1xuICAgIHRoaXMuX3ZpZXdwb3J0TWFyZ2luID0gbWFyZ2luO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSdzIHdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGNvbnN0cmFpbmVkIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICB3aXRoRmxleGlibGVEaW1lbnNpb25zKGZsZXhpYmxlRGltZW5zaW9ucyA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMgPSBmbGV4aWJsZURpbWVuc2lvbnM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IGFmdGVyIHRoZSBpbml0aWFsIG9wZW4gdmlhIGZsZXhpYmxlIHdpZHRoL2hlaWdodC4gKi9cbiAgd2l0aEdyb3dBZnRlck9wZW4oZ3Jvd0FmdGVyT3BlbiA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9ncm93QWZ0ZXJPcGVuID0gZ3Jvd0FmdGVyT3BlbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gaWYgbm9uZSBvZiB0aGUgcHJvdmlkZWQgcG9zaXRpb25zIGZpdC4gKi9cbiAgd2l0aFB1c2goY2FuUHVzaCA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9jYW5QdXNoID0gY2FuUHVzaDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkncyBwb3NpdGlvbiBzaG91bGQgYmUgbG9ja2VkIGluIGFmdGVyIGl0IGlzIHBvc2l0aW9uZWRcbiAgICogaW5pdGlhbGx5LiBXaGVuIGFuIG92ZXJsYXkgaXMgbG9ja2VkIGluLCBpdCB3b24ndCBhdHRlbXB0IHRvIHJlcG9zaXRpb24gaXRzZWxmXG4gICAqIHdoZW4gdGhlIHBvc2l0aW9uIGlzIHJlLWFwcGxpZWQgKGUuZy4gd2hlbiB0aGUgdXNlciBzY3JvbGxzIGF3YXkpLlxuICAgKiBAcGFyYW0gaXNMb2NrZWQgV2hldGhlciB0aGUgb3ZlcmxheSBzaG91bGQgbG9ja2VkIGluLlxuICAgKi9cbiAgd2l0aExvY2tlZFBvc2l0aW9uKGlzTG9ja2VkID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX3Bvc2l0aW9uTG9ja2VkID0gaXNMb2NrZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luLCByZWxhdGl2ZSB0byB3aGljaCB0byBwb3NpdGlvbiB0aGUgb3ZlcmxheS5cbiAgICogVXNpbmcgYW4gZWxlbWVudCBvcmlnaW4gaXMgdXNlZnVsIGZvciBidWlsZGluZyBjb21wb25lbnRzIHRoYXQgbmVlZCB0byBiZSBwb3NpdGlvbmVkXG4gICAqIHJlbGF0aXZlbHkgdG8gYSB0cmlnZ2VyIChlLmcuIGRyb3Bkb3duIG1lbnVzIG9yIHRvb2x0aXBzKSwgd2hlcmVhcyB1c2luZyBhIHBvaW50IGNhbiBiZVxuICAgKiB1c2VkIGZvciBjYXNlcyBsaWtlIGNvbnRleHR1YWwgbWVudXMgd2hpY2ggb3BlbiByZWxhdGl2ZSB0byB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBvcmlnaW4gUmVmZXJlbmNlIHRvIHRoZSBuZXcgb3JpZ2luLlxuICAgKi9cbiAgc2V0T3JpZ2luKG9yaWdpbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSdzIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHgtYXhpcy5cbiAgICogQHBhcmFtIG9mZnNldCBOZXcgb2Zmc2V0IGluIHRoZSBYIGF4aXMuXG4gICAqL1xuICB3aXRoRGVmYXVsdE9mZnNldFgob2Zmc2V0OiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9vZmZzZXRYID0gb2Zmc2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSdzIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHktYXhpcy5cbiAgICogQHBhcmFtIG9mZnNldCBOZXcgb2Zmc2V0IGluIHRoZSBZIGF4aXMuXG4gICAqL1xuICB3aXRoRGVmYXVsdE9mZnNldFkob2Zmc2V0OiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9vZmZzZXRZID0gb2Zmc2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhhdCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgc2hvdWxkIHNldCBhIGB0cmFuc2Zvcm0tb3JpZ2luYCBvbiBzb21lIGVsZW1lbnRzXG4gICAqIGluc2lkZSB0aGUgb3ZlcmxheSwgZGVwZW5kaW5nIG9uIHRoZSBjdXJyZW50IHBvc2l0aW9uIHRoYXQgaXMgYmVpbmcgYXBwbGllZC4gVGhpcyBpc1xuICAgKiB1c2VmdWwgZm9yIHRoZSBjYXNlcyB3aGVyZSB0aGUgb3JpZ2luIG9mIGFuIGFuaW1hdGlvbiBjYW4gY2hhbmdlIGRlcGVuZGluZyBvbiB0aGVcbiAgICogYWxpZ25tZW50IG9mIHRoZSBvdmVybGF5LlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgQ1NTIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZpbmQgdGhlIHRhcmdldFxuICAgKiAgICBlbGVtZW50cyBvbnRvIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi5cbiAgICovXG4gIHdpdGhUcmFuc2Zvcm1PcmlnaW5PbihzZWxlY3Rvcjogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSAoeCwgeSkgY29vcmRpbmF0ZSBvZiBhIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIG9yaWdpbiBiYXNlZCBvbiBhIHJlbGF0aXZlIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3JpZ2luUG9pbnQob3JpZ2luUmVjdDogQ2xpZW50UmVjdCwgcG9zOiBDb25uZWN0ZWRQb3NpdGlvbik6IFBvaW50IHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGlmIChwb3Mub3JpZ2luWCA9PSAnY2VudGVyJykge1xuICAgICAgLy8gTm90ZTogd2hlbiBjZW50ZXJpbmcgd2Ugc2hvdWxkIGFsd2F5cyB1c2UgdGhlIGBsZWZ0YFxuICAgICAgLy8gb2Zmc2V0LCBvdGhlcndpc2UgdGhlIHBvc2l0aW9uIHdpbGwgYmUgd3JvbmcgaW4gUlRMLlxuICAgICAgeCA9IG9yaWdpblJlY3QubGVmdCArIChvcmlnaW5SZWN0LndpZHRoIC8gMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YXJ0WCA9IHRoaXMuX2lzUnRsKCkgPyBvcmlnaW5SZWN0LnJpZ2h0IDogb3JpZ2luUmVjdC5sZWZ0O1xuICAgICAgY29uc3QgZW5kWCA9IHRoaXMuX2lzUnRsKCkgPyBvcmlnaW5SZWN0LmxlZnQgOiBvcmlnaW5SZWN0LnJpZ2h0O1xuICAgICAgeCA9IHBvcy5vcmlnaW5YID09ICdzdGFydCcgPyBzdGFydFggOiBlbmRYO1xuICAgIH1cblxuICAgIGxldCB5OiBudW1iZXI7XG4gICAgaWYgKHBvcy5vcmlnaW5ZID09ICdjZW50ZXInKSB7XG4gICAgICB5ID0gb3JpZ2luUmVjdC50b3AgKyAob3JpZ2luUmVjdC5oZWlnaHQgLyAyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeSA9IHBvcy5vcmlnaW5ZID09ICd0b3AnID8gb3JpZ2luUmVjdC50b3AgOiBvcmlnaW5SZWN0LmJvdHRvbTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cblxuICAvKipcbiAgICogR2V0cyB0aGUgKHgsIHkpIGNvb3JkaW5hdGUgb2YgdGhlIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGUgb3ZlcmxheSBnaXZlbiBhIGdpdmVuIHBvc2l0aW9uIGFuZFxuICAgKiBvcmlnaW4gcG9pbnQgdG8gd2hpY2ggdGhlIG92ZXJsYXkgc2hvdWxkIGJlIGNvbm5lY3RlZC5cbiAgICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlQb2ludChcbiAgICAgIG9yaWdpblBvaW50OiBQb2ludCxcbiAgICAgIG92ZXJsYXlSZWN0OiBDbGllbnRSZWN0LFxuICAgICAgcG9zOiBDb25uZWN0ZWRQb3NpdGlvbik6IFBvaW50IHtcblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgKG92ZXJsYXlTdGFydFgsIG92ZXJsYXlTdGFydFkpLCB0aGUgc3RhcnQgb2YgdGhlXG4gICAgLy8gcG90ZW50aWFsIG92ZXJsYXkgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIG9yaWdpbiBwb2ludC5cbiAgICBsZXQgb3ZlcmxheVN0YXJ0WDogbnVtYmVyO1xuICAgIGlmIChwb3Mub3ZlcmxheVggPT0gJ2NlbnRlcicpIHtcbiAgICAgIG92ZXJsYXlTdGFydFggPSAtb3ZlcmxheVJlY3Qud2lkdGggLyAyO1xuICAgIH0gZWxzZSBpZiAocG9zLm92ZXJsYXlYID09PSAnc3RhcnQnKSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IC1vdmVybGF5UmVjdC53aWR0aCA6IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJsYXlTdGFydFggPSB0aGlzLl9pc1J0bCgpID8gMCA6IC1vdmVybGF5UmVjdC53aWR0aDtcbiAgICB9XG5cbiAgICBsZXQgb3ZlcmxheVN0YXJ0WTogbnVtYmVyO1xuICAgIGlmIChwb3Mub3ZlcmxheVkgPT0gJ2NlbnRlcicpIHtcbiAgICAgIG92ZXJsYXlTdGFydFkgPSAtb3ZlcmxheVJlY3QuaGVpZ2h0IC8gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgb3ZlcmxheVN0YXJ0WSA9IHBvcy5vdmVybGF5WSA9PSAndG9wJyA/IDAgOiAtb3ZlcmxheVJlY3QuaGVpZ2h0O1xuICAgIH1cblxuICAgIC8vIFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXkuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9yaWdpblBvaW50LnggKyBvdmVybGF5U3RhcnRYLFxuICAgICAgeTogb3JpZ2luUG9pbnQueSArIG92ZXJsYXlTdGFydFksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBHZXRzIGhvdyB3ZWxsIGFuIG92ZXJsYXkgYXQgdGhlIGdpdmVuIHBvaW50IHdpbGwgZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlGaXQocG9pbnQ6IFBvaW50LCBvdmVybGF5OiBDbGllbnRSZWN0LCB2aWV3cG9ydDogQ2xpZW50UmVjdCxcbiAgICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiBPdmVybGF5Rml0IHtcblxuICAgIGxldCB7eCwgeX0gPSBwb2ludDtcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIC8vIEFjY291bnQgZm9yIHRoZSBvZmZzZXRzIHNpbmNlIHRoZXkgY291bGQgcHVzaCB0aGUgb3ZlcmxheSBvdXQgb2YgdGhlIHZpZXdwb3J0LlxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB4ICs9IG9mZnNldFg7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldFkpIHtcbiAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvLyBIb3cgbXVjaCB0aGUgb3ZlcmxheSB3b3VsZCBvdmVyZmxvdyBhdCB0aGlzIHBvc2l0aW9uLCBvbiBlYWNoIHNpZGUuXG4gICAgbGV0IGxlZnRPdmVyZmxvdyA9IDAgLSB4O1xuICAgIGxldCByaWdodE92ZXJmbG93ID0gKHggKyBvdmVybGF5LndpZHRoKSAtIHZpZXdwb3J0LndpZHRoO1xuICAgIGxldCB0b3BPdmVyZmxvdyA9IDAgLSB5O1xuICAgIGxldCBib3R0b21PdmVyZmxvdyA9ICh5ICsgb3ZlcmxheS5oZWlnaHQpIC0gdmlld3BvcnQuaGVpZ2h0O1xuXG4gICAgLy8gVmlzaWJsZSBwYXJ0cyBvZiB0aGUgZWxlbWVudCBvbiBlYWNoIGF4aXMuXG4gICAgbGV0IHZpc2libGVXaWR0aCA9IHRoaXMuX3N1YnRyYWN0T3ZlcmZsb3dzKG92ZXJsYXkud2lkdGgsIGxlZnRPdmVyZmxvdywgcmlnaHRPdmVyZmxvdyk7XG4gICAgbGV0IHZpc2libGVIZWlnaHQgPSB0aGlzLl9zdWJ0cmFjdE92ZXJmbG93cyhvdmVybGF5LmhlaWdodCwgdG9wT3ZlcmZsb3csIGJvdHRvbU92ZXJmbG93KTtcbiAgICBsZXQgdmlzaWJsZUFyZWEgPSB2aXNpYmxlV2lkdGggKiB2aXNpYmxlSGVpZ2h0O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZpc2libGVBcmVhLFxuICAgICAgaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQ6IChvdmVybGF5LndpZHRoICogb3ZlcmxheS5oZWlnaHQpID09PSB2aXNpYmxlQXJlYSxcbiAgICAgIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogdmlzaWJsZUhlaWdodCA9PT0gb3ZlcmxheS5oZWlnaHQsXG4gICAgICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogdmlzaWJsZVdpZHRoID09IG92ZXJsYXkud2lkdGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCB3aGVuIGl0IG1heSByZXNpemUgZWl0aGVyIGl0cyB3aWR0aCBvciBoZWlnaHQuXG4gICAqIEBwYXJhbSBmaXQgSG93IHdlbGwgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvaW50IFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSBnZW9tZXRyeSBvZiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKGZpdDogT3ZlcmxheUZpdCwgcG9pbnQ6IFBvaW50LCB2aWV3cG9ydDogQ2xpZW50UmVjdCkge1xuICAgIGlmICh0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IHZpZXdwb3J0LmJvdHRvbSAtIHBvaW50Lnk7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gcG9pbnQueDtcbiAgICAgIGNvbnN0IG1pbkhlaWdodCA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWluSGVpZ2h0O1xuICAgICAgY29uc3QgbWluV2lkdGggPSB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLm1pbldpZHRoO1xuXG4gICAgICBjb25zdCB2ZXJ0aWNhbEZpdCA9IGZpdC5maXRzSW5WaWV3cG9ydFZlcnRpY2FsbHkgfHxcbiAgICAgICAgICAobWluSGVpZ2h0ICE9IG51bGwgJiYgbWluSGVpZ2h0IDw9IGF2YWlsYWJsZUhlaWdodCk7XG4gICAgICBjb25zdCBob3Jpem9udGFsRml0ID0gZml0LmZpdHNJblZpZXdwb3J0SG9yaXpvbnRhbGx5IHx8XG4gICAgICAgICAgKG1pbldpZHRoICE9IG51bGwgJiYgbWluV2lkdGggPD0gYXZhaWxhYmxlV2lkdGgpO1xuXG4gICAgICByZXR1cm4gdmVydGljYWxGaXQgJiYgaG9yaXpvbnRhbEZpdDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBvaW50IGF0IHdoaWNoIHRoZSBvdmVybGF5IGNhbiBiZSBcInB1c2hlZFwiIG9uLXNjcmVlbi4gSWYgdGhlIG92ZXJsYXkgaXMgbGFyZ2VyIHRoYW5cbiAgICogdGhlIHZpZXdwb3J0LCB0aGUgdG9wLWxlZnQgY29ybmVyIHdpbGwgYmUgcHVzaGVkIG9uLXNjcmVlbiAod2l0aCBvdmVyZmxvdyBvY2N1cmluZyBvbiB0aGVcbiAgICogcmlnaHQgYW5kIGJvdHRvbSkuXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydCBTdGFydGluZyBwb2ludCBmcm9tIHdoaWNoIHRoZSBvdmVybGF5IGlzIHB1c2hlZC5cbiAgICogQHBhcmFtIG92ZXJsYXkgRGltZW5zaW9ucyBvZiB0aGUgb3ZlcmxheS5cbiAgICogQHBhcmFtIHNjcm9sbFBvc2l0aW9uIEN1cnJlbnQgdmlld3BvcnQgc2Nyb2xsIHBvc2l0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgcG9pbnQgYXQgd2hpY2ggdG8gcG9zaXRpb24gdGhlIG92ZXJsYXkgYWZ0ZXIgcHVzaGluZy4gVGhpcyBpcyBlZmZlY3RpdmVseSBhIG5ld1xuICAgKiAgICAgb3JpZ2luUG9pbnQuXG4gICAqL1xuICBwcml2YXRlIF9wdXNoT3ZlcmxheU9uU2NyZWVuKHN0YXJ0OiBQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVybGF5OiBDbGllbnRSZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKTogUG9pbnQge1xuICAgIC8vIElmIHRoZSBwb3NpdGlvbiBpcyBsb2NrZWQgYW5kIHdlJ3ZlIHB1c2hlZCB0aGUgb3ZlcmxheSBhbHJlYWR5LCByZXVzZSB0aGUgcHJldmlvdXMgcHVzaFxuICAgIC8vIGFtb3VudCwgcmF0aGVyIHRoYW4gcHVzaGluZyBpdCBhZ2Fpbi4gSWYgd2Ugd2VyZSB0byBjb250aW51ZSBwdXNoaW5nLCB0aGUgZWxlbWVudCB3b3VsZFxuICAgIC8vIHJlbWFpbiBpbiB0aGUgdmlld3BvcnQsIHdoaWNoIGdvZXMgYWdhaW5zdCB0aGUgZXhwZWN0YXRpb25zIHdoZW4gcG9zaXRpb24gbG9ja2luZyBpcyBlbmFibGVkLlxuICAgIGlmICh0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQgJiYgdGhpcy5fcG9zaXRpb25Mb2NrZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHN0YXJ0LnggKyB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQueCxcbiAgICAgICAgeTogc3RhcnQueSArIHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudC55XG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuXG4gICAgLy8gRGV0ZXJtaW5lIGhvdyBtdWNoIHRoZSBvdmVybGF5IGdvZXMgb3V0c2lkZSB0aGUgdmlld3BvcnQgb24gZWFjaFxuICAgIC8vIHNpZGUsIHdoaWNoIHdlJ2xsIHVzZSB0byBkZWNpZGUgd2hpY2ggZGlyZWN0aW9uIHRvIHB1c2ggaXQuXG4gICAgY29uc3Qgb3ZlcmZsb3dSaWdodCA9IE1hdGgubWF4KHN0YXJ0LnggKyBvdmVybGF5LndpZHRoIC0gdmlld3BvcnQucmlnaHQsIDApO1xuICAgIGNvbnN0IG92ZXJmbG93Qm90dG9tID0gTWF0aC5tYXgoc3RhcnQueSArIG92ZXJsYXkuaGVpZ2h0IC0gdmlld3BvcnQuYm90dG9tLCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd1RvcCA9IE1hdGgubWF4KHZpZXdwb3J0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcCAtIHN0YXJ0LnksIDApO1xuICAgIGNvbnN0IG92ZXJmbG93TGVmdCA9IE1hdGgubWF4KHZpZXdwb3J0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0IC0gc3RhcnQueCwgMCk7XG5cbiAgICAvLyBBbW91bnQgYnkgd2hpY2ggdG8gcHVzaCB0aGUgb3ZlcmxheSBpbiBlYWNoIGF4aXMgc3VjaCB0aGF0IGl0IHJlbWFpbnMgb24tc2NyZWVuLlxuICAgIGxldCBwdXNoWCA9IDA7XG4gICAgbGV0IHB1c2hZID0gMDtcblxuICAgIC8vIElmIHRoZSBvdmVybGF5IGZpdHMgY29tcGxldGVseSB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgdmlld3BvcnQsIHB1c2ggaXQgZnJvbSB3aGljaGV2ZXJcbiAgICAvLyBkaXJlY3Rpb24gaXMgZ29lcyBvZmYtc2NyZWVuLiBPdGhlcndpc2UsIHB1c2ggdGhlIHRvcC1sZWZ0IGNvcm5lciBzdWNoIHRoYXQgaXRzIGluIHRoZVxuICAgIC8vIHZpZXdwb3J0IGFuZCBhbGxvdyBmb3IgdGhlIHRyYWlsaW5nIGVuZCBvZiB0aGUgb3ZlcmxheSB0byBnbyBvdXQgb2YgYm91bmRzLlxuICAgIGlmIChvdmVybGF5LndpZHRoIDw9IHZpZXdwb3J0LndpZHRoKSB7XG4gICAgICBwdXNoWCA9IG92ZXJmbG93TGVmdCB8fCAtb3ZlcmZsb3dSaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHVzaFggPSBzdGFydC54IDwgdGhpcy5fdmlld3BvcnRNYXJnaW4gPyAodmlld3BvcnQubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQpIC0gc3RhcnQueCA6IDA7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJsYXkuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkge1xuICAgICAgcHVzaFkgPSBvdmVyZmxvd1RvcCB8fCAtb3ZlcmZsb3dCb3R0b207XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hZID0gc3RhcnQueSA8IHRoaXMuX3ZpZXdwb3J0TWFyZ2luID8gKHZpZXdwb3J0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcCkgLSBzdGFydC55IDogMDtcbiAgICB9XG5cbiAgICB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQgPSB7eDogcHVzaFgsIHk6IHB1c2hZfTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiBzdGFydC54ICsgcHVzaFgsXG4gICAgICB5OiBzdGFydC55ICsgcHVzaFksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgY29tcHV0ZWQgcG9zaXRpb24gdG8gdGhlIG92ZXJsYXkgYW5kIGVtaXRzIGEgcG9zaXRpb24gY2hhbmdlLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIHByZWZlcmVuY2VcbiAgICogQHBhcmFtIG9yaWdpblBvaW50IFRoZSBwb2ludCBvbiB0aGUgb3JpZ2luIGVsZW1lbnQgd2hlcmUgdGhlIG92ZXJsYXkgaXMgY29ubmVjdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlQb3NpdGlvbihwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sIG9yaWdpblBvaW50OiBQb2ludCkge1xuICAgIHRoaXMuX3NldFRyYW5zZm9ybU9yaWdpbihwb3NpdGlvbik7XG4gICAgdGhpcy5fc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMob3JpZ2luUG9pbnQsIHBvc2l0aW9uKTtcbiAgICB0aGlzLl9zZXRCb3VuZGluZ0JveFN0eWxlcyhvcmlnaW5Qb2ludCwgcG9zaXRpb24pO1xuXG4gICAgaWYgKHBvc2l0aW9uLnBhbmVsQ2xhc3MpIHtcbiAgICAgIHRoaXMuX2FkZFBhbmVsQ2xhc3Nlcyhwb3NpdGlvbi5wYW5lbENsYXNzKTtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHRoZSBsYXN0IGNvbm5lY3RlZCBwb3NpdGlvbiBpbiBjYXNlIHRoZSBwb3NpdGlvbiBuZWVkcyB0byBiZSByZS1jYWxjdWxhdGVkLlxuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG4gICAgLy8gTm90aWZ5IHRoYXQgdGhlIHBvc2l0aW9uIGhhcyBiZWVuIGNoYW5nZWQgYWxvbmcgd2l0aCBpdHMgY2hhbmdlIHByb3BlcnRpZXMuXG4gICAgLy8gV2Ugb25seSBlbWl0IGlmIHdlJ3ZlIGdvdCBhbnkgc3Vic2NyaXB0aW9ucywgYmVjYXVzZSB0aGUgc2Nyb2xsIHZpc2liaWxpdHlcbiAgICAvLyBjYWxjdWxjYXRpb25zIGNhbiBiZSBzb21ld2hhdCBleHBlbnNpdmUuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzY3JvbGxhYmxlVmlld1Byb3BlcnRpZXMgPSB0aGlzLl9nZXRTY3JvbGxWaXNpYmlsaXR5KCk7XG4gICAgICBjb25zdCBjaGFuZ2VFdmVudCA9IG5ldyBDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2UocG9zaXRpb24sIHNjcm9sbGFibGVWaWV3UHJvcGVydGllcyk7XG4gICAgICB0aGlzLl9wb3NpdGlvbkNoYW5nZXMubmV4dChjaGFuZ2VFdmVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5faXNJbml0aWFsUmVuZGVyID0gZmFsc2U7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgdHJhbnNmb3JtIG9yaWdpbiBiYXNlZCBvbiB0aGUgY29uZmlndXJlZCBzZWxlY3RvciBhbmQgdGhlIHBhc3NlZC1pbiBwb3NpdGlvbi4gICovXG4gIHByaXZhdGUgX3NldFRyYW5zZm9ybU9yaWdpbihwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pIHtcbiAgICBpZiAoIXRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgdGhpcy5fYm91bmRpbmdCb3ghLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpO1xuICAgIGxldCB4T3JpZ2luOiAnbGVmdCcgfCAncmlnaHQnIHwgJ2NlbnRlcic7XG4gICAgbGV0IHlPcmlnaW46ICd0b3AnIHwgJ2JvdHRvbScgfCAnY2VudGVyJyA9IHBvc2l0aW9uLm92ZXJsYXlZO1xuXG4gICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnY2VudGVyJykge1xuICAgICAgeE9yaWdpbiA9ICdjZW50ZXInO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faXNSdGwoKSkge1xuICAgICAgeE9yaWdpbiA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICB9IGVsc2Uge1xuICAgICAgeE9yaWdpbiA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlbGVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSBgJHt4T3JpZ2lufSAke3lPcmlnaW59YDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIG92ZXJsYXkncyBzaXppbmcgY29udGFpbmVyLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBkb2VzIG5vIG1lYXN1cmluZyBhbmQgYXBwbGllcyBubyBzdHlsZXMgc28gdGhhdCB3ZSBjYW4gY2hlYXBseSBjb21wdXRlIHRoZVxuICAgKiBib3VuZHMgZm9yIGFsbCBwb3NpdGlvbnMgYW5kIGNob29zZSB0aGUgYmVzdCBmaXQgYmFzZWQgb24gdGhlc2UgcmVzdWx0cy5cbiAgICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZUJvdW5kaW5nQm94UmVjdChvcmlnaW46IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiBCb3VuZGluZ0JveFJlY3Qge1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5faXNSdGwoKTtcbiAgICBsZXQgaGVpZ2h0OiBudW1iZXIsIHRvcDogbnVtYmVyLCBib3R0b206IG51bWJlcjtcblxuICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ3RvcCcpIHtcbiAgICAgIC8vIE92ZXJsYXkgaXMgb3BlbmluZyBcImRvd253YXJkXCIgYW5kIHRodXMgaXMgYm91bmQgYnkgdGhlIGJvdHRvbSB2aWV3cG9ydCBlZGdlLlxuICAgICAgdG9wID0gb3JpZ2luLnk7XG4gICAgICBoZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQgLSB0b3AgKyB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAnYm90dG9tJykge1xuICAgICAgLy8gT3ZlcmxheSBpcyBvcGVuaW5nIFwidXB3YXJkXCIgYW5kIHRodXMgaXMgYm91bmQgYnkgdGhlIHRvcCB2aWV3cG9ydCBlZGdlLiBXZSBuZWVkIHRvIGFkZFxuICAgICAgLy8gdGhlIHZpZXdwb3J0IG1hcmdpbiBiYWNrIGluLCBiZWNhdXNlIHRoZSB2aWV3cG9ydCByZWN0IGlzIG5hcnJvd2VkIGRvd24gdG8gcmVtb3ZlIHRoZVxuICAgICAgLy8gbWFyZ2luLCB3aGVyZWFzIHRoZSBgb3JpZ2luYCBwb3NpdGlvbiBpcyBjYWxjdWxhdGVkIGJhc2VkIG9uIGl0cyBgQ2xpZW50UmVjdGAuXG4gICAgICBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgLSBvcmlnaW4ueSArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luICogMjtcbiAgICAgIGhlaWdodCA9IHZpZXdwb3J0LmhlaWdodCAtIGJvdHRvbSArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBuZWl0aGVyIHRvcCBub3IgYm90dG9tLCBpdCBtZWFucyB0aGF0IHRoZSBvdmVybGF5IGlzIHZlcnRpY2FsbHkgY2VudGVyZWQgb24gdGhlXG4gICAgICAvLyBvcmlnaW4gcG9pbnQuIE5vdGUgdGhhdCB3ZSB3YW50IHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQsIHJhdGhlciB0aGFuXG4gICAgICAvLyB0aGUgcGFnZSwgd2hpY2ggaXMgd2h5IHdlIGRvbid0IHVzZSBzb21ldGhpbmcgbGlrZSBgdmlld3BvcnQuYm90dG9tIC0gb3JpZ2luLnlgIGFuZFxuICAgICAgLy8gYG9yaWdpbi55IC0gdmlld3BvcnQudG9wYC5cbiAgICAgIGNvbnN0IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSA9XG4gICAgICAgICAgTWF0aC5taW4odmlld3BvcnQuYm90dG9tIC0gb3JpZ2luLnkgKyB2aWV3cG9ydC50b3AsIG9yaWdpbi55KTtcblxuICAgICAgY29uc3QgcHJldmlvdXNIZWlnaHQgPSB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLmhlaWdodDtcblxuICAgICAgaGVpZ2h0ID0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlICogMjtcbiAgICAgIHRvcCA9IG9yaWdpbi55IC0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlO1xuXG4gICAgICBpZiAoaGVpZ2h0ID4gcHJldmlvdXNIZWlnaHQgJiYgIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiAhdGhpcy5fZ3Jvd0FmdGVyT3Blbikge1xuICAgICAgICB0b3AgPSBvcmlnaW4ueSAtIChwcmV2aW91c0hlaWdodCAvIDIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBvdmVybGF5IGlzIG9wZW5pbmcgJ3JpZ2h0LXdhcmQnICh0aGUgY29udGVudCBmbG93cyB0byB0aGUgcmlnaHQpLlxuICAgIGNvbnN0IGlzQm91bmRlZEJ5UmlnaHRWaWV3cG9ydEVkZ2UgPVxuICAgICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgJiYgIWlzUnRsKSB8fFxuICAgICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnICYmIGlzUnRsKTtcblxuICAgIC8vIFRoZSBvdmVybGF5IGlzIG9wZW5pbmcgJ2xlZnQtd2FyZCcgKHRoZSBjb250ZW50IGZsb3dzIHRvIHRoZSBsZWZ0KS5cbiAgICBjb25zdCBpc0JvdW5kZWRCeUxlZnRWaWV3cG9ydEVkZ2UgPVxuICAgICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnICYmICFpc1J0bCkgfHxcbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnICYmIGlzUnRsKTtcblxuICAgIGxldCB3aWR0aDogbnVtYmVyLCBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXI7XG5cbiAgICBpZiAoaXNCb3VuZGVkQnlMZWZ0Vmlld3BvcnRFZGdlKSB7XG4gICAgICByaWdodCA9IHZpZXdwb3J0LndpZHRoIC0gb3JpZ2luLnggKyB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICAgIHdpZHRoID0gb3JpZ2luLnggLSB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICB9IGVsc2UgaWYgKGlzQm91bmRlZEJ5UmlnaHRWaWV3cG9ydEVkZ2UpIHtcbiAgICAgIGxlZnQgPSBvcmlnaW4ueDtcbiAgICAgIHdpZHRoID0gdmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgbmVpdGhlciBzdGFydCBub3IgZW5kLCBpdCBtZWFucyB0aGF0IHRoZSBvdmVybGF5IGlzIGhvcml6b250YWxseSBjZW50ZXJlZCBvbiB0aGVcbiAgICAgIC8vIG9yaWdpbiBwb2ludC4gTm90ZSB0aGF0IHdlIHdhbnQgdGhlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCwgcmF0aGVyIHRoYW5cbiAgICAgIC8vIHRoZSBwYWdlLCB3aGljaCBpcyB3aHkgd2UgZG9uJ3QgdXNlIHNvbWV0aGluZyBsaWtlIGB2aWV3cG9ydC5yaWdodCAtIG9yaWdpbi54YCBhbmRcbiAgICAgIC8vIGBvcmlnaW4ueCAtIHZpZXdwb3J0LmxlZnRgLlxuICAgICAgY29uc3Qgc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlID1cbiAgICAgICAgICBNYXRoLm1pbih2aWV3cG9ydC5yaWdodCAtIG9yaWdpbi54ICsgdmlld3BvcnQubGVmdCwgb3JpZ2luLngpO1xuICAgICAgY29uc3QgcHJldmlvdXNXaWR0aCA9IHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUud2lkdGg7XG5cbiAgICAgIHdpZHRoID0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlICogMjtcbiAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKHdpZHRoID4gcHJldmlvdXNXaWR0aCAmJiAhdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIChwcmV2aW91c1dpZHRoIC8gMik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt0b3A6IHRvcCEsIGxlZnQ6IGxlZnQhLCBib3R0b206IGJvdHRvbSEsIHJpZ2h0OiByaWdodCEsIHdpZHRoLCBoZWlnaHR9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBvdmVybGF5J3Mgc2l6aW5nIHdyYXBwZXIuIFRoZSB3cmFwcGVyIGlzIHBvc2l0aW9uZWQgb24gdGhlXG4gICAqIG9yaWdpbidzIGNvbm5lY3Rpb24gcG9pbnQgYW5kIHN0ZXRjaGVzIHRvIHRoZSBib3VuZHMgb2YgdGhlIHZpZXdwb3J0LlxuICAgKlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBwb2ludCBvbiB0aGUgb3JpZ2luIGVsZW1lbnQgd2hlcmUgdGhlIG92ZXJsYXkgaXMgY29ubmVjdGVkLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIHByZWZlcmVuY2VcbiAgICovXG4gIHByaXZhdGUgX3NldEJvdW5kaW5nQm94U3R5bGVzKG9yaWdpbjogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IGJvdW5kaW5nQm94UmVjdCA9IHRoaXMuX2NhbGN1bGF0ZUJvdW5kaW5nQm94UmVjdChvcmlnaW4sIHBvc2l0aW9uKTtcblxuICAgIC8vIEl0J3Mgd2VpcmQgaWYgdGhlIG92ZXJsYXkgKmdyb3dzKiB3aGlsZSBzY3JvbGxpbmcsIHNvIHdlIHRha2UgdGhlIGxhc3Qgc2l6ZSBpbnRvIGFjY291bnRcbiAgICAvLyB3aGVuIGFwcGx5aW5nIGEgbmV3IHNpemUuXG4gICAgaWYgKCF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgIXRoaXMuX2dyb3dBZnRlck9wZW4pIHtcbiAgICAgIGJvdW5kaW5nQm94UmVjdC5oZWlnaHQgPSBNYXRoLm1pbihib3VuZGluZ0JveFJlY3QuaGVpZ2h0LCB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLmhlaWdodCk7XG4gICAgICBib3VuZGluZ0JveFJlY3Qud2lkdGggPSBNYXRoLm1pbihib3VuZGluZ0JveFJlY3Qud2lkdGgsIHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUud2lkdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlcyA9IHt9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG5cbiAgICBpZiAodGhpcy5faGFzRXhhY3RQb3NpdGlvbigpKSB7XG4gICAgICBzdHlsZXMudG9wID0gc3R5bGVzLmxlZnQgPSAnMCc7XG4gICAgICBzdHlsZXMuYm90dG9tID0gc3R5bGVzLnJpZ2h0ID0gc3R5bGVzLm1heEhlaWdodCA9IHN0eWxlcy5tYXhXaWR0aCA9ICcnO1xuICAgICAgc3R5bGVzLndpZHRoID0gc3R5bGVzLmhlaWdodCA9ICcxMDAlJztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5tYXhIZWlnaHQ7XG4gICAgICBjb25zdCBtYXhXaWR0aCA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWF4V2lkdGg7XG5cbiAgICAgIHN0eWxlcy5oZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5oZWlnaHQpO1xuICAgICAgc3R5bGVzLnRvcCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LnRvcCk7XG4gICAgICBzdHlsZXMuYm90dG9tID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QuYm90dG9tKTtcbiAgICAgIHN0eWxlcy53aWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LndpZHRoKTtcbiAgICAgIHN0eWxlcy5sZWZ0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QubGVmdCk7XG4gICAgICBzdHlsZXMucmlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5yaWdodCk7XG5cbiAgICAgIC8vIFB1c2ggdGhlIHBhbmUgY29udGVudCB0b3dhcmRzIHRoZSBwcm9wZXIgZGlyZWN0aW9uLlxuICAgICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnY2VudGVyJykge1xuICAgICAgICBzdHlsZXMuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVzLmFsaWduSXRlbXMgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAnZmxleC1lbmQnIDogJ2ZsZXgtc3RhcnQnO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdjZW50ZXInKSB7XG4gICAgICAgIHN0eWxlcy5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVzLmp1c3RpZnlDb250ZW50ID0gcG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nID8gJ2ZsZXgtZW5kJyA6ICdmbGV4LXN0YXJ0JztcbiAgICAgIH1cblxuICAgICAgaWYgKG1heEhlaWdodCkge1xuICAgICAgICBzdHlsZXMubWF4SGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShtYXhIZWlnaHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF4V2lkdGgpIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShtYXhXaWR0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZSA9IGJvdW5kaW5nQm94UmVjdDtcblxuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveCEuc3R5bGUsIHN0eWxlcyk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdHlsZXMgZm9yIHRoZSBib3VuZGluZyBib3ggc28gdGhhdCBhIG5ldyBwb3NpdGlvbmluZyBjYW4gYmUgY29tcHV0ZWQuICovXG4gIHByaXZhdGUgX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXMoKSB7XG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX2JvdW5kaW5nQm94IS5zdHlsZSwge1xuICAgICAgdG9wOiAnMCcsXG4gICAgICBsZWZ0OiAnMCcsXG4gICAgICByaWdodDogJzAnLFxuICAgICAgYm90dG9tOiAnMCcsXG4gICAgICBoZWlnaHQ6ICcnLFxuICAgICAgd2lkdGg6ICcnLFxuICAgICAgYWxpZ25JdGVtczogJycsXG4gICAgICBqdXN0aWZ5Q29udGVudDogJycsXG4gICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0eWxlcyBmb3IgdGhlIG92ZXJsYXkgcGFuZSBzbyB0aGF0IGEgbmV3IHBvc2l0aW9uaW5nIGNhbiBiZSBjb21wdXRlZC4gKi9cbiAgcHJpdmF0ZSBfcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpIHtcbiAgICBleHRlbmRTdHlsZXModGhpcy5fcGFuZS5zdHlsZSwge1xuICAgICAgdG9wOiAnJyxcbiAgICAgIGxlZnQ6ICcnLFxuICAgICAgYm90dG9tOiAnJyxcbiAgICAgIHJpZ2h0OiAnJyxcbiAgICAgIHBvc2l0aW9uOiAnJyxcbiAgICAgIHRyYW5zZm9ybTogJycsXG4gICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHBvc2l0aW9uaW5nIHN0eWxlcyB0byB0aGUgb3ZlcmxheSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zZXRPdmVybGF5RWxlbWVudFN0eWxlcyhvcmlnaW5Qb2ludDogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IHN0eWxlcyA9IHt9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgY29uc3QgaGFzRXhhY3RQb3NpdGlvbiA9IHRoaXMuX2hhc0V4YWN0UG9zaXRpb24oKTtcbiAgICBjb25zdCBoYXNGbGV4aWJsZURpbWVuc2lvbnMgPSB0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnM7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKTtcblxuICAgIGlmIChoYXNFeGFjdFBvc2l0aW9uKSB7XG4gICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgZXh0ZW5kU3R5bGVzKHN0eWxlcywgdGhpcy5fZ2V0RXhhY3RPdmVybGF5WShwb3NpdGlvbiwgb3JpZ2luUG9pbnQsIHNjcm9sbFBvc2l0aW9uKSk7XG4gICAgICBleHRlbmRTdHlsZXMoc3R5bGVzLCB0aGlzLl9nZXRFeGFjdE92ZXJsYXlYKHBvc2l0aW9uLCBvcmlnaW5Qb2ludCwgc2Nyb2xsUG9zaXRpb24pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLnBvc2l0aW9uID0gJ3N0YXRpYyc7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgdHJhbnNmb3JtIHRvIGFwcGx5IHRoZSBvZmZzZXRzLiBXZSBkbyB0aGlzIGJlY2F1c2UgdGhlIGBjZW50ZXJgIHBvc2l0aW9ucyByZWx5IG9uXG4gICAgLy8gYmVpbmcgaW4gdGhlIG5vcm1hbCBmbGV4IGZsb3cgYW5kIHNldHRpbmcgYSBgdG9wYCAvIGBsZWZ0YCBhdCBhbGwgd2lsbCBjb21wbGV0ZWx5IHRocm93XG4gICAgLy8gb2ZmIHRoZSBwb3NpdGlvbi4gV2UgYWxzbyBjYW4ndCB1c2UgbWFyZ2lucywgYmVjYXVzZSB0aGV5IHdvbid0IGhhdmUgYW4gZWZmZWN0IGluIHNvbWVcbiAgICAvLyBjYXNlcyB3aGVyZSB0aGUgZWxlbWVudCBkb2Vzbid0IGhhdmUgYW55dGhpbmcgdG8gXCJwdXNoIG9mZiBvZlwiLiBGaW5hbGx5LCB0aGlzIHdvcmtzXG4gICAgLy8gYmV0dGVyIGJvdGggd2l0aCBmbGV4aWJsZSBhbmQgbm9uLWZsZXhpYmxlIHBvc2l0aW9uaW5nLlxuICAgIGxldCB0cmFuc2Zvcm1TdHJpbmcgPSAnJztcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gYHRyYW5zbGF0ZVgoJHtvZmZzZXRYfXB4KSBgO1xuICAgIH1cblxuICAgIGlmIChvZmZzZXRZKSB7XG4gICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gYHRyYW5zbGF0ZVkoJHtvZmZzZXRZfXB4KWA7XG4gICAgfVxuXG4gICAgc3R5bGVzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybVN0cmluZy50cmltKCk7XG5cbiAgICAvLyBJZiBhIG1heFdpZHRoIG9yIG1heEhlaWdodCBpcyBzcGVjaWZpZWQgb24gdGhlIG92ZXJsYXksIHdlIHJlbW92ZSB0aGVtLiBXZSBkbyB0aGlzIGJlY2F1c2VcbiAgICAvLyB3ZSBuZWVkIHRoZXNlIHZhbHVlcyB0byBib3RoIGJlIHNldCB0byBcIjEwMCVcIiBmb3IgdGhlIGF1dG9tYXRpYyBmbGV4aWJsZSBzaXppbmcgdG8gd29yay5cbiAgICAvLyBUaGUgbWF4SGVpZ2h0IGFuZCBtYXhXaWR0aCBhcmUgc2V0IG9uIHRoZSBib3VuZGluZ0JveCBpbiBvcmRlciB0byBlbmZvcmNlIHRoZSBjb25zdHJhaW50LlxuICAgIC8vIE5vdGUgdGhhdCB0aGlzIGRvZXNuJ3QgYXBwbHkgd2hlbiB3ZSBoYXZlIGFuIGV4YWN0IHBvc2l0aW9uLCBpbiB3aGljaCBjYXNlIHdlIGRvIHdhbnQgdG9cbiAgICAvLyBhcHBseSB0aGVtIGJlY2F1c2UgdGhleSdsbCBiZSBjbGVhcmVkIGZyb20gdGhlIGJvdW5kaW5nIGJveC5cbiAgICBpZiAoY29uZmlnLm1heEhlaWdodCkge1xuICAgICAgaWYgKGhhc0V4YWN0UG9zaXRpb24pIHtcbiAgICAgICAgc3R5bGVzLm1heEhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoY29uZmlnLm1heEhlaWdodCk7XG4gICAgICB9IGVsc2UgaWYgKGhhc0ZsZXhpYmxlRGltZW5zaW9ucykge1xuICAgICAgICBzdHlsZXMubWF4SGVpZ2h0ID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5tYXhXaWR0aCkge1xuICAgICAgaWYgKGhhc0V4YWN0UG9zaXRpb24pIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShjb25maWcubWF4V2lkdGgpO1xuICAgICAgfSBlbHNlIGlmIChoYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX3BhbmUuc3R5bGUsIHN0eWxlcyk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZXhhY3QgdG9wL2JvdHRvbSBmb3IgdGhlIG92ZXJsYXkgd2hlbiBub3QgdXNpbmcgZmxleGlibGUgc2l6aW5nIG9yIHdoZW4gcHVzaGluZy4gKi9cbiAgcHJpdmF0ZSBfZ2V0RXhhY3RPdmVybGF5WShwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKSB7XG4gICAgLy8gUmVzZXQgYW55IGV4aXN0aW5nIHN0eWxlcy4gVGhpcyBpcyBuZWNlc3NhcnkgaW4gY2FzZSB0aGVcbiAgICAvLyBwcmVmZXJyZWQgcG9zaXRpb24gaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgYGFwcGx5YC5cbiAgICBsZXQgc3R5bGVzID0ge3RvcDogbnVsbCwgYm90dG9tOiBudWxsfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBwb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5faXNQdXNoZWQpIHtcbiAgICAgIG92ZXJsYXlQb2ludCA9IHRoaXMuX3B1c2hPdmVybGF5T25TY3JlZW4ob3ZlcmxheVBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgc2Nyb2xsUG9zaXRpb24pO1xuICAgIH1cblxuICAgIGxldCB2aXJ0dWFsS2V5Ym9hcmRPZmZzZXQgPVxuICAgICAgICB0aGlzLl9vdmVybGF5Q29udGFpbmVyLmdldENvbnRhaW5lckVsZW1lbnQoKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG5cbiAgICAvLyBOb3JtYWxseSB0aGlzIHdvdWxkIGJlIHplcm8sIGhvd2V2ZXIgd2hlbiB0aGUgb3ZlcmxheSBpcyBhdHRhY2hlZCB0byBhbiBpbnB1dCAoZS5nLiBpbiBhblxuICAgIC8vIGF1dG9jb21wbGV0ZSksIG1vYmlsZSBicm93c2VycyB3aWxsIHNoaWZ0IGV2ZXJ5dGhpbmcgaW4gb3JkZXIgdG8gcHV0IHRoZSBpbnB1dCBpbiB0aGUgbWlkZGxlXG4gICAgLy8gb2YgdGhlIHNjcmVlbiBhbmQgdG8gbWFrZSBzcGFjZSBmb3IgdGhlIHZpcnR1YWwga2V5Ym9hcmQuIFdlIG5lZWQgdG8gYWNjb3VudCBmb3IgdGhpcyBvZmZzZXQsXG4gICAgLy8gb3RoZXJ3aXNlIG91ciBwb3NpdGlvbmluZyB3aWxsIGJlIHRocm93biBvZmYuXG4gICAgb3ZlcmxheVBvaW50LnkgLT0gdmlydHVhbEtleWJvYXJkT2Zmc2V0O1xuXG4gICAgLy8gV2Ugd2FudCB0byBzZXQgZWl0aGVyIGB0b3BgIG9yIGBib3R0b21gIGJhc2VkIG9uIHdoZXRoZXIgdGhlIG92ZXJsYXkgd2FudHMgdG8gYXBwZWFyXG4gICAgLy8gYWJvdmUgb3IgYmVsb3cgdGhlIG9yaWdpbiBhbmQgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgZWxlbWVudCB3aWxsIGV4cGFuZC5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nKSB7XG4gICAgICAvLyBXaGVuIHVzaW5nIGBib3R0b21gLCB3ZSBhZGp1c3QgdGhlIHkgcG9zaXRpb24gc3VjaCB0aGF0IGl0IGlzIHRoZSBkaXN0YW5jZVxuICAgICAgLy8gZnJvbSB0aGUgYm90dG9tIG9mIHRoZSB2aWV3cG9ydCByYXRoZXIgdGhhbiB0aGUgdG9wLlxuICAgICAgY29uc3QgZG9jdW1lbnRIZWlnaHQgPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudEhlaWdodDtcbiAgICAgIHN0eWxlcy5ib3R0b20gPSBgJHtkb2N1bWVudEhlaWdodCAtIChvdmVybGF5UG9pbnQueSArIHRoaXMuX292ZXJsYXlSZWN0LmhlaWdodCl9cHhgO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXMudG9wID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShvdmVybGF5UG9pbnQueSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBleGFjdCBsZWZ0L3JpZ2h0IGZvciB0aGUgb3ZlcmxheSB3aGVuIG5vdCB1c2luZyBmbGV4aWJsZSBzaXppbmcgb3Igd2hlbiBwdXNoaW5nLiAqL1xuICBwcml2YXRlIF9nZXRFeGFjdE92ZXJsYXlYKHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5Qb2ludDogUG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb246IFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24pIHtcbiAgICAvLyBSZXNldCBhbnkgZXhpc3Rpbmcgc3R5bGVzLiBUaGlzIGlzIG5lY2Vzc2FyeSBpbiBjYXNlIHRoZSBwcmVmZXJyZWQgcG9zaXRpb24gaGFzXG4gICAgLy8gY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBgYXBwbHlgLlxuICAgIGxldCBzdHlsZXMgPSB7bGVmdDogbnVsbCwgcmlnaHQ6IG51bGx9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgbGV0IG92ZXJsYXlQb2ludCA9IHRoaXMuX2dldE92ZXJsYXlQb2ludChvcmlnaW5Qb2ludCwgdGhpcy5fb3ZlcmxheVJlY3QsIHBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9pc1B1c2hlZCkge1xuICAgICAgb3ZlcmxheVBvaW50ID0gdGhpcy5fcHVzaE92ZXJsYXlPblNjcmVlbihvdmVybGF5UG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBzY3JvbGxQb3NpdGlvbik7XG4gICAgfVxuXG4gICAgLy8gV2Ugd2FudCB0byBzZXQgZWl0aGVyIGBsZWZ0YCBvciBgcmlnaHRgIGJhc2VkIG9uIHdoZXRoZXIgdGhlIG92ZXJsYXkgd2FudHMgdG8gYXBwZWFyIFwiYmVmb3JlXCJcbiAgICAvLyBvciBcImFmdGVyXCIgdGhlIG9yaWdpbiwgd2hpY2ggZGV0ZXJtaW5lcyB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBlbGVtZW50IHdpbGwgZXhwYW5kLlxuICAgIC8vIEZvciB0aGUgaG9yaXpvbnRhbCBheGlzLCB0aGUgbWVhbmluZyBvZiBcImJlZm9yZVwiIGFuZCBcImFmdGVyXCIgY2hhbmdlIGJhc2VkIG9uIHdoZXRoZXIgdGhlXG4gICAgLy8gcGFnZSBpcyBpbiBSVEwgb3IgTFRSLlxuICAgIGxldCBob3Jpem9udGFsU3R5bGVQcm9wZXJ0eTogJ2xlZnQnIHwgJ3JpZ2h0JztcblxuICAgIGlmICh0aGlzLl9pc1J0bCgpKSB7XG4gICAgICBob3Jpem9udGFsU3R5bGVQcm9wZXJ0eSA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhvcml6b250YWxTdHlsZVByb3BlcnR5ID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICB9XG5cbiAgICAvLyBXaGVuIHdlJ3JlIHNldHRpbmcgYHJpZ2h0YCwgd2UgYWRqdXN0IHRoZSB4IHBvc2l0aW9uIHN1Y2ggdGhhdCBpdCBpcyB0aGUgZGlzdGFuY2VcbiAgICAvLyBmcm9tIHRoZSByaWdodCBlZGdlIG9mIHRoZSB2aWV3cG9ydCByYXRoZXIgdGhhbiB0aGUgbGVmdCBlZGdlLlxuICAgIGlmIChob3Jpem9udGFsU3R5bGVQcm9wZXJ0eSA9PT0gJ3JpZ2h0Jykge1xuICAgICAgY29uc3QgZG9jdW1lbnRXaWR0aCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuY2xpZW50V2lkdGg7XG4gICAgICBzdHlsZXMucmlnaHQgPSBgJHtkb2N1bWVudFdpZHRoIC0gKG92ZXJsYXlQb2ludC54ICsgdGhpcy5fb3ZlcmxheVJlY3Qud2lkdGgpfXB4YDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLmxlZnQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKG92ZXJsYXlQb2ludC54KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZpZXcgcHJvcGVydGllcyBvZiB0aGUgdHJpZ2dlciBhbmQgb3ZlcmxheSwgaW5jbHVkaW5nIHdoZXRoZXIgdGhleSBhcmUgY2xpcHBlZFxuICAgKiBvciBjb21wbGV0ZWx5IG91dHNpZGUgdGhlIHZpZXcgb2YgYW55IG9mIHRoZSBzdHJhdGVneSdzIHNjcm9sbGFibGVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0U2Nyb2xsVmlzaWJpbGl0eSgpOiBTY3JvbGxpbmdWaXNpYmlsaXR5IHtcbiAgICAvLyBOb3RlOiBuZWVkcyBmcmVzaCByZWN0cyBzaW5jZSB0aGUgcG9zaXRpb24gY291bGQndmUgY2hhbmdlZC5cbiAgICBjb25zdCBvcmlnaW5Cb3VuZHMgPSB0aGlzLl9nZXRPcmlnaW5SZWN0KCk7XG4gICAgY29uc3Qgb3ZlcmxheUJvdW5kcyA9ICB0aGlzLl9wYW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgLy8gVE9ETyhqZWxib3Vybik6IGluc3RlYWQgb2YgbmVlZGluZyBhbGwgb2YgdGhlIGNsaWVudCByZWN0cyBmb3IgdGhlc2Ugc2Nyb2xsaW5nIGNvbnRhaW5lcnNcbiAgICAvLyBldmVyeSB0aW1lLCB3ZSBzaG91bGQgYmUgYWJsZSB0byB1c2UgdGhlIHNjcm9sbFRvcCBvZiB0aGUgY29udGFpbmVycyBpZiB0aGUgc2l6ZSBvZiB0aG9zZVxuICAgIC8vIGNvbnRhaW5lcnMgaGFzbid0IGNoYW5nZWQuXG4gICAgY29uc3Qgc2Nyb2xsQ29udGFpbmVyQm91bmRzID0gdGhpcy5fc2Nyb2xsYWJsZXMubWFwKHNjcm9sbGFibGUgPT4ge1xuICAgICAgcmV0dXJuIHNjcm9sbGFibGUuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXNPcmlnaW5DbGlwcGVkOiBpc0VsZW1lbnRDbGlwcGVkQnlTY3JvbGxpbmcob3JpZ2luQm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgICAgaXNPcmlnaW5PdXRzaWRlVmlldzogaXNFbGVtZW50U2Nyb2xsZWRPdXRzaWRlVmlldyhvcmlnaW5Cb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgICBpc092ZXJsYXlDbGlwcGVkOiBpc0VsZW1lbnRDbGlwcGVkQnlTY3JvbGxpbmcob3ZlcmxheUJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICAgIGlzT3ZlcmxheU91dHNpZGVWaWV3OiBpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3KG92ZXJsYXlCb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBTdWJ0cmFjdHMgdGhlIGFtb3VudCB0aGF0IGFuIGVsZW1lbnQgaXMgb3ZlcmZsb3dpbmcgb24gYW4gYXhpcyBmcm9tIGl0cyBsZW5ndGguICovXG4gIHByaXZhdGUgX3N1YnRyYWN0T3ZlcmZsb3dzKGxlbmd0aDogbnVtYmVyLCAuLi5vdmVyZmxvd3M6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgICByZXR1cm4gb3ZlcmZsb3dzLnJlZHVjZSgoY3VycmVudFZhbHVlOiBudW1iZXIsIGN1cnJlbnRPdmVyZmxvdzogbnVtYmVyKSA9PiB7XG4gICAgICByZXR1cm4gY3VycmVudFZhbHVlIC0gTWF0aC5tYXgoY3VycmVudE92ZXJmbG93LCAwKTtcbiAgICB9LCBsZW5ndGgpO1xuICB9XG5cbiAgLyoqIE5hcnJvd3MgdGhlIGdpdmVuIHZpZXdwb3J0IHJlY3QgYnkgdGhlIGN1cnJlbnQgX3ZpZXdwb3J0TWFyZ2luLiAqL1xuICBwcml2YXRlIF9nZXROYXJyb3dlZFZpZXdwb3J0UmVjdCgpOiBDbGllbnRSZWN0IHtcbiAgICAvLyBXZSByZWNhbGN1bGF0ZSB0aGUgdmlld3BvcnQgcmVjdCBoZXJlIG91cnNlbHZlcywgcmF0aGVyIHRoYW4gdXNpbmcgdGhlIFZpZXdwb3J0UnVsZXIsXG4gICAgLy8gYmVjYXVzZSB3ZSB3YW50IHRvIHVzZSB0aGUgYGNsaWVudFdpZHRoYCBhbmQgYGNsaWVudEhlaWdodGAgYXMgdGhlIGJhc2UuIFRoZSBkaWZmZXJlbmNlXG4gICAgLy8gYmVpbmcgdGhhdCB0aGUgY2xpZW50IHByb3BlcnRpZXMgZG9uJ3QgaW5jbHVkZSB0aGUgc2Nyb2xsYmFyLCBhcyBvcHBvc2VkIHRvIGBpbm5lcldpZHRoYFxuICAgIC8vIGFuZCBgaW5uZXJIZWlnaHRgIHRoYXQgZG8uIFRoaXMgaXMgbmVjZXNzYXJ5LCBiZWNhdXNlIHRoZSBvdmVybGF5IGNvbnRhaW5lciB1c2VzXG4gICAgLy8gMTAwJSBgd2lkdGhgIGFuZCBgaGVpZ2h0YCB3aGljaCBkb24ndCBpbmNsdWRlIHRoZSBzY3JvbGxiYXIgZWl0aGVyLlxuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRXaWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogICAgc2Nyb2xsUG9zaXRpb24udG9wICsgdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICBsZWZ0OiAgIHNjcm9sbFBvc2l0aW9uLmxlZnQgKyB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIHJpZ2h0OiAgc2Nyb2xsUG9zaXRpb24ubGVmdCArIHdpZHRoIC0gdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICBib3R0b206IHNjcm9sbFBvc2l0aW9uLnRvcCArIGhlaWdodCAtIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgd2lkdGg6ICB3aWR0aCAgLSAoMiAqIHRoaXMuX3ZpZXdwb3J0TWFyZ2luKSxcbiAgICAgIGhlaWdodDogaGVpZ2h0IC0gKDIgKiB0aGlzLl92aWV3cG9ydE1hcmdpbiksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSB3ZSdyZSBkZWFsaW5nIHdpdGggYW4gUlRMIGNvbnRleHQgKi9cbiAgcHJpdmF0ZSBfaXNSdGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlSZWYuZ2V0RGlyZWN0aW9uKCkgPT09ICdydGwnO1xuICB9XG5cbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGUgb3ZlcmxheSB1c2VzIGV4YWN0IG9yIGZsZXhpYmxlIHBvc2l0aW9uaW5nLiAqL1xuICBwcml2YXRlIF9oYXNFeGFjdFBvc2l0aW9uKCkge1xuICAgIHJldHVybiAhdGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zIHx8IHRoaXMuX2lzUHVzaGVkO1xuICB9XG5cbiAgLyoqIFJldHJpZXZlcyB0aGUgb2Zmc2V0IG9mIGEgcG9zaXRpb24gYWxvbmcgdGhlIHggb3IgeSBheGlzLiAqL1xuICBwcml2YXRlIF9nZXRPZmZzZXQocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLCBheGlzOiAneCcgfCAneScpIHtcbiAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgICAvLyBXZSBkb24ndCBkbyBzb21ldGhpbmcgbGlrZSBgcG9zaXRpb25bJ29mZnNldCcgKyBheGlzXWAgaW5cbiAgICAgIC8vIG9yZGVyIHRvIGF2b2lkIGJyZWtpbmcgbWluaWZpZXJzIHRoYXQgcmVuYW1lIHByb3BlcnRpZXMuXG4gICAgICByZXR1cm4gcG9zaXRpb24ub2Zmc2V0WCA9PSBudWxsID8gdGhpcy5fb2Zmc2V0WCA6IHBvc2l0aW9uLm9mZnNldFg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9uLm9mZnNldFkgPT0gbnVsbCA/IHRoaXMuX29mZnNldFkgOiBwb3NpdGlvbi5vZmZzZXRZO1xuICB9XG5cbiAgLyoqIFZhbGlkYXRlcyB0aGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uIG1hdGNoIHRoZSBleHBlY3RlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX3ZhbGlkYXRlUG9zaXRpb25zKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zLmxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0ZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneTogQXQgbGVhc3Qgb25lIHBvc2l0aW9uIGlzIHJlcXVpcmVkLicpO1xuICAgIH1cblxuICAgIC8vIFRPRE8oY3Jpc2JldG8pOiByZW1vdmUgdGhlc2Ugb25jZSBBbmd1bGFyJ3MgdGVtcGxhdGUgdHlwZVxuICAgIC8vIGNoZWNraW5nIGlzIGFkdmFuY2VkIGVub3VnaCB0byBjYXRjaCB0aGVzZSBjYXNlcy5cbiAgICB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnMuZm9yRWFjaChwYWlyID0+IHtcbiAgICAgIHZhbGlkYXRlSG9yaXpvbnRhbFBvc2l0aW9uKCdvcmlnaW5YJywgcGFpci5vcmlnaW5YKTtcbiAgICAgIHZhbGlkYXRlVmVydGljYWxQb3NpdGlvbignb3JpZ2luWScsIHBhaXIub3JpZ2luWSk7XG4gICAgICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbignb3ZlcmxheVgnLCBwYWlyLm92ZXJsYXlYKTtcbiAgICAgIHZhbGlkYXRlVmVydGljYWxQb3NpdGlvbignb3ZlcmxheVknLCBwYWlyLm92ZXJsYXlZKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgc2luZ2xlIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIG9uIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF9hZGRQYW5lbENsYXNzZXMoY3NzQ2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgY29lcmNlQXJyYXkoY3NzQ2xhc3NlcykuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG4gICAgICAgIGlmIChjc3NDbGFzcyAhPT0gJycgJiYgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3Nlcy5pbmRleE9mKGNzc0NsYXNzKSA9PT0gLTEpIHtcbiAgICAgICAgICB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzLnB1c2goY3NzQ2xhc3MpO1xuICAgICAgICAgIHRoaXMuX3BhbmUuY2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhcnMgdGhlIGNsYXNzZXMgdGhhdCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgaGFzIGFwcGxpZWQgZnJvbSB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfY2xlYXJQYW5lbENsYXNzZXMoKSB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMuZm9yRWFjaChjc3NDbGFzcyA9PiB7XG4gICAgICAgIHRoaXMuX3BhbmUuY2xhc3NMaXN0LnJlbW92ZShjc3NDbGFzcyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgQ2xpZW50UmVjdCBvZiB0aGUgY3VycmVudCBvcmlnaW4uICovXG4gIHByaXZhdGUgX2dldE9yaWdpblJlY3QoKTogQ2xpZW50UmVjdCB7XG4gICAgY29uc3Qgb3JpZ2luID0gdGhpcy5fb3JpZ2luO1xuXG4gICAgaWYgKG9yaWdpbiBpbnN0YW5jZW9mIEVsZW1lbnRSZWYpIHtcbiAgICAgIHJldHVybiBvcmlnaW4ubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9XG5cbiAgICBpZiAob3JpZ2luIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBvcmlnaW4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuXG4gICAgY29uc3Qgd2lkdGggPSBvcmlnaW4ud2lkdGggfHwgMDtcbiAgICBjb25zdCBoZWlnaHQgPSBvcmlnaW4uaGVpZ2h0IHx8IDA7XG5cbiAgICAvLyBJZiB0aGUgb3JpZ2luIGlzIGEgcG9pbnQsIHJldHVybiBhIGNsaWVudCByZWN0IGFzIGlmIGl0IHdhcyBhIDB4MCBlbGVtZW50IGF0IHRoZSBwb2ludC5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBvcmlnaW4ueSxcbiAgICAgIGJvdHRvbTogb3JpZ2luLnkgKyBoZWlnaHQsXG4gICAgICBsZWZ0OiBvcmlnaW4ueCxcbiAgICAgIHJpZ2h0OiBvcmlnaW4ueCArIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgd2lkdGhcbiAgICB9O1xuICB9XG59XG5cbi8qKiBBIHNpbXBsZSAoeCwgeSkgY29vcmRpbmF0ZS4gKi9cbmludGVyZmFjZSBQb2ludCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIG1lYXN1cmVtZW50cyBmb3IgaG93IGFuIG92ZXJsYXkgKGF0IGEgZ2l2ZW4gcG9zaXRpb24pIGZpdHMgaW50byB0aGUgdmlld3BvcnQuICovXG5pbnRlcmZhY2UgT3ZlcmxheUZpdCB7XG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGZpdHMgY29tcGxldGVseSBpbiB0aGUgdmlld3BvcnQuICovXG4gIGlzQ29tcGxldGVseVdpdGhpblZpZXdwb3J0OiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGZpdHMgaW4gdGhlIHZpZXdwb3J0IG9uIHRoZSB5LWF4aXMuICovXG4gIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogYm9vbGVhbjtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBmaXRzIGluIHRoZSB2aWV3cG9ydCBvbiB0aGUgeC1heGlzLiAqL1xuICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogYm9vbGVhbjtcblxuICAvKiogVGhlIHRvdGFsIHZpc2libGUgYXJlYSAoaW4gcHheMikgb2YgdGhlIG92ZXJsYXkgaW5zaWRlIHRoZSB2aWV3cG9ydC4gKi9cbiAgdmlzaWJsZUFyZWE6IG51bWJlcjtcbn1cblxuLyoqIFJlY29yZCBvZiB0aGUgbWVhc3VybWVudHMgZGV0ZXJtaW5pbmcgd2hldGhlciBhbiBvdmVybGF5IHdpbGwgZml0IGluIGEgc3BlY2lmaWMgcG9zaXRpb24uICovXG5pbnRlcmZhY2UgRmFsbGJhY2tQb3NpdGlvbiB7XG4gIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbjtcbiAgb3JpZ2luUG9pbnQ6IFBvaW50O1xuICBvdmVybGF5UG9pbnQ6IFBvaW50O1xuICBvdmVybGF5Rml0OiBPdmVybGF5Rml0O1xuICBvdmVybGF5UmVjdDogQ2xpZW50UmVjdDtcbn1cblxuLyoqIFBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBvdmVybGF5IHNpemluZyB3cmFwcGVyIGZvciBhIHNwZWNpZmljIHBvc2l0aW9uLiAqL1xuaW50ZXJmYWNlIEJvdW5kaW5nQm94UmVjdCB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG4gIGJvdHRvbTogbnVtYmVyO1xuICByaWdodDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgd2lkdGg6IG51bWJlcjtcbn1cblxuLyoqIFJlY29yZCBvZiBtZWFzdXJlcyBkZXRlcm1pbmluZyBob3cgd2VsbCBhIGdpdmVuIHBvc2l0aW9uIHdpbGwgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucy4gKi9cbmludGVyZmFjZSBGbGV4aWJsZUZpdCB7XG4gIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbjtcbiAgb3JpZ2luOiBQb2ludDtcbiAgb3ZlcmxheVJlY3Q6IENsaWVudFJlY3Q7XG4gIGJvdW5kaW5nQm94UmVjdDogQm91bmRpbmdCb3hSZWN0O1xufVxuXG4vKiogQSBjb25uZWN0ZWQgcG9zaXRpb24gYXMgc3BlY2lmaWVkIGJ5IHRoZSB1c2VyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0ZWRQb3NpdGlvbiB7XG4gIG9yaWdpblg6ICdzdGFydCcgfCAnY2VudGVyJyB8ICdlbmQnO1xuICBvcmlnaW5ZOiAndG9wJyB8ICdjZW50ZXInIHwgJ2JvdHRvbSc7XG5cbiAgb3ZlcmxheVg6ICdzdGFydCcgfCAnY2VudGVyJyB8ICdlbmQnO1xuICBvdmVybGF5WTogJ3RvcCcgfCAnY2VudGVyJyB8ICdib3R0b20nO1xuXG4gIHdlaWdodD86IG51bWJlcjtcbiAgb2Zmc2V0WD86IG51bWJlcjtcbiAgb2Zmc2V0WT86IG51bWJlcjtcbiAgcGFuZWxDbGFzcz86IHN0cmluZyB8IHN0cmluZ1tdO1xufVxuXG4vKiogU2hhbGxvdy1leHRlbmRzIGEgc3R5bGVzaGVldCBvYmplY3Qgd2l0aCBhbm90aGVyIHN0eWxlc2hlZXQgb2JqZWN0LiAqL1xuZnVuY3Rpb24gZXh0ZW5kU3R5bGVzKGRlc3Q6IENTU1N0eWxlRGVjbGFyYXRpb24sIHNvdXJjZTogQ1NTU3R5bGVEZWNsYXJhdGlvbik6IENTU1N0eWxlRGVjbGFyYXRpb24ge1xuICBmb3IgKGxldCBrZXkgaW4gc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBkZXN0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdDtcbn1cbiJdfQ==