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
 * Regex used to split a string on its CSS units.
 * @type {?}
 */
const cssUnitPattern = /([A-Za-z%]+)$/;
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
            const minHeight = getPixelValue(this._overlayRef.getConfig().minHeight);
            /** @type {?} */
            const minWidth = getPixelValue(this._overlayRef.getConfig().minWidth);
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
        let styles = (/** @type {?} */ ({ top: '', bottom: '' }));
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
        let styles = (/** @type {?} */ ({ left: '', right: '' }));
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
        // Check for Element so SVG elements are also supported.
        if (origin instanceof Element) {
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
 * @param {?} destination
 * @param {?} source
 * @return {?}
 */
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
 * @param {?} input
 * @return {?}
 */
function getPixelValue(input) {
    if (typeof input !== 'number' && input != null) {
        const [value, units] = input.split(cssUnitPattern);
        return (!units || units === 'px') ? parseFloat(value) : null;
    }
    return input || null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE9BQU8sRUFDTCw4QkFBOEIsRUFHOUIsMEJBQTBCLEVBQzFCLHdCQUF3QixHQUN6QixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBYSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRXZELE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RixPQUFPLEVBQUMsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7TUFRakUsZ0JBQWdCLEdBQUcsNkNBQTZDOzs7OztNQUdoRSxjQUFjLEdBQUcsZUFBZTs7Ozs7Ozs7QUFldEMsTUFBTSxPQUFPLGlDQUFpQzs7Ozs7Ozs7SUEyRjVDLFlBQ0ksV0FBb0QsRUFBVSxjQUE2QixFQUNuRixTQUFtQixFQUFVLFNBQW1CLEVBQ2hELGlCQUFtQztRQUZtQixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUNuRixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNoRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCOzs7O1FBdEZ2Qyx5QkFBb0IsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQyxDQUFDOzs7O1FBRzdDLGNBQVMsR0FBRyxLQUFLLENBQUM7Ozs7UUFHbEIsYUFBUSxHQUFHLElBQUksQ0FBQzs7OztRQUdoQixtQkFBYyxHQUFHLEtBQUssQ0FBQzs7OztRQUd2QiwyQkFBc0IsR0FBRyxJQUFJLENBQUM7Ozs7UUFHOUIsb0JBQWUsR0FBRyxLQUFLLENBQUM7Ozs7UUFZeEIsb0JBQWUsR0FBRyxDQUFDLENBQUM7Ozs7UUFHcEIsaUJBQVksR0FBb0IsRUFBRSxDQUFDOzs7O1FBRzNDLHdCQUFtQixHQUE2QixFQUFFLENBQUM7Ozs7UUFxQjNDLHFCQUFnQixHQUFHLElBQUksT0FBTyxFQUFrQyxDQUFDOzs7O1FBR2pFLHdCQUFtQixHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7Ozs7UUFHekMsYUFBUSxHQUFHLENBQUMsQ0FBQzs7OztRQUdiLGFBQVEsR0FBRyxDQUFDLENBQUM7Ozs7UUFNYix5QkFBb0IsR0FBYSxFQUFFLENBQUM7Ozs7UUFNNUMsb0JBQWUsR0FDWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLENBQUM7UUFXdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM5QixDQUFDOzs7OztJQVRELElBQUksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO0lBQ2xDLENBQUM7Ozs7OztJQVVELE1BQU0sQ0FBQyxVQUE0QjtRQUNqQyxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksVUFBVSxLQUFLLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDdkQsTUFBTSxLQUFLLENBQUMsMERBQTBELENBQUMsQ0FBQztTQUN6RTtRQUVELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBRTFCLFVBQVUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXZELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztRQUMzQyxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUM7UUFDdkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDekIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsU0FBUzs7O1FBQUMsR0FBRyxFQUFFO1lBQ3JFLDhFQUE4RTtZQUM5RSxtRkFBbUY7WUFDbkYsbUVBQW1FO1lBQ25FLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2YsQ0FBQyxFQUFDLENBQUM7SUFDTCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JELEtBQUs7UUFDSCxnRkFBZ0Y7UUFDaEYsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDakQsT0FBTztTQUNSO1FBRUQsc0ZBQXNGO1FBQ3RGLG9GQUFvRjtRQUNwRiwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDeEUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDM0IsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFL0IseUZBQXlGO1FBQ3pGLHNDQUFzQztRQUN0QyxnRkFBZ0Y7UUFDaEYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNyRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsQ0FBQzs7Y0FFakQsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXOztjQUM3QixXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVk7O2NBQy9CLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYTs7O2NBR2pDLFlBQVksR0FBa0IsRUFBRTs7O1lBR2xDLFFBQXNDO1FBRTFDLHFFQUFxRTtRQUNyRSwwREFBMEQ7UUFDMUQsS0FBSyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7OztnQkFFcEMsV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQzs7Ozs7Z0JBS25ELFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUM7OztnQkFHbkUsVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDO1lBRWxGLHVGQUF1RjtZQUN2RixJQUFJLFVBQVUsQ0FBQywwQkFBMEIsRUFBRTtnQkFDekMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN0QyxPQUFPO2FBQ1I7WUFFRCxtRUFBbUU7WUFDbkUsOERBQThEO1lBQzlELElBQUksSUFBSSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQUU7Z0JBQzlFLHdGQUF3RjtnQkFDeEYsOERBQThEO2dCQUM5RCxZQUFZLENBQUMsSUFBSSxDQUFDO29CQUNoQixRQUFRLEVBQUUsR0FBRztvQkFDYixNQUFNLEVBQUUsV0FBVztvQkFDbkIsV0FBVztvQkFDWCxlQUFlLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUM7aUJBQ2xFLENBQUMsQ0FBQztnQkFFSCxTQUFTO2FBQ1Y7WUFFRCxzRkFBc0Y7WUFDdEYseUZBQXlGO1lBQ3pGLFlBQVk7WUFDWixJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ3pFLFFBQVEsR0FBRyxFQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFDLENBQUM7YUFDaEY7U0FDRjtRQUVELDhGQUE4RjtRQUM5Riw2RUFBNkU7UUFDN0UsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFOztnQkFDbkIsT0FBTyxHQUF1QixJQUFJOztnQkFDbEMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNsQixLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksRUFBRTs7c0JBQ3hCLEtBQUssR0FDUCxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztnQkFDdkYsSUFBSSxLQUFLLEdBQUcsU0FBUyxFQUFFO29CQUNyQixTQUFTLEdBQUcsS0FBSyxDQUFDO29CQUNsQixPQUFPLEdBQUcsR0FBRyxDQUFDO2lCQUNmO2FBQ0Y7WUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFBLE9BQU8sRUFBQyxDQUFDLFFBQVEsRUFBRSxtQkFBQSxPQUFPLEVBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RCxPQUFPO1NBQ1I7UUFFRCxrRkFBa0Y7UUFDbEYsbUVBQW1FO1FBQ25FLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQiw4RkFBOEY7WUFDOUYsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDdEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxtQkFBQSxRQUFRLEVBQUMsQ0FBQyxRQUFRLEVBQUUsbUJBQUEsUUFBUSxFQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0QsT0FBTztTQUNSO1FBRUQsOEZBQThGO1FBQzlGLDJDQUEyQztRQUMzQyxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFBLFFBQVEsRUFBQyxDQUFDLFFBQVEsRUFBRSxtQkFBQSxRQUFRLEVBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNqRSxDQUFDOzs7O0lBRUQsTUFBTTtRQUNKLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzFCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7UUFDaEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3pDLENBQUM7Ozs7O0lBR0QsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixPQUFPO1NBQ1I7UUFFRCxpRUFBaUU7UUFDakUsc0RBQXNEO1FBQ3RELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNyQixZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsbUJBQUE7Z0JBQ3BDLEdBQUcsRUFBRSxFQUFFO2dCQUNQLElBQUksRUFBRSxFQUFFO2dCQUNSLEtBQUssRUFBRSxFQUFFO2dCQUNULE1BQU0sRUFBRSxFQUFFO2dCQUNWLE1BQU0sRUFBRSxFQUFFO2dCQUNWLEtBQUssRUFBRSxFQUFFO2dCQUNULFVBQVUsRUFBRSxFQUFFO2dCQUNkLGNBQWMsRUFBRSxFQUFFO2FBQ25CLEVBQXVCLENBQUMsQ0FBQztTQUMzQjtRQUVELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1NBQ25DO1FBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUNqRTtRQUVELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsbUJBQUEsSUFBSSxFQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQzs7Ozs7OztJQU9ELG1CQUFtQjtRQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3RFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3ZELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7O2tCQUUvQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDOztrQkFDaEUsV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUM7WUFFeEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDaEQ7SUFDSCxDQUFDOzs7Ozs7Ozs7O0lBT0Qsd0JBQXdCLENBQUMsV0FBNEI7UUFDbkQsbUJBQUEsSUFBSSxFQUFBLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztRQUNoQyxPQUFPLG1CQUFBLElBQUksRUFBQSxDQUFDO0lBQ2QsQ0FBQzs7Ozs7Ozs7SUFNRCxhQUFhLENBQUMsU0FBOEI7UUFDMUMsbUJBQUEsSUFBSSxFQUFBLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDO1FBRXJDLG9GQUFvRjtRQUNwRiw2RUFBNkU7UUFDN0UsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLG1CQUFBLG1CQUFBLElBQUksRUFBQSxDQUFDLGFBQWEsRUFBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDakQsbUJBQUEsSUFBSSxFQUFBLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUMzQjtRQUVELG1CQUFBLElBQUksRUFBQSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsT0FBTyxtQkFBQSxJQUFJLEVBQUEsQ0FBQztJQUNkLENBQUM7Ozs7Ozs7O0lBTUQsa0JBQWtCLENBQUMsTUFBYztRQUMvQixtQkFBQSxJQUFJLEVBQUEsQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDO1FBQzlCLE9BQU8sbUJBQUEsSUFBSSxFQUFBLENBQUM7SUFDZCxDQUFDOzs7Ozs7OztJQUdELHNCQUFzQixDQUFDLGtCQUFrQixHQUFHLElBQUk7UUFDOUMsbUJBQUEsSUFBSSxFQUFBLENBQUMsc0JBQXNCLEdBQUcsa0JBQWtCLENBQUM7UUFDakQsT0FBTyxtQkFBQSxJQUFJLEVBQUEsQ0FBQztJQUNkLENBQUM7Ozs7Ozs7O0lBR0QsaUJBQWlCLENBQUMsYUFBYSxHQUFHLElBQUk7UUFDcEMsbUJBQUEsSUFBSSxFQUFBLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztRQUNwQyxPQUFPLG1CQUFBLElBQUksRUFBQSxDQUFDO0lBQ2QsQ0FBQzs7Ozs7Ozs7SUFHRCxRQUFRLENBQUMsT0FBTyxHQUFHLElBQUk7UUFDckIsbUJBQUEsSUFBSSxFQUFBLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixPQUFPLG1CQUFBLElBQUksRUFBQSxDQUFDO0lBQ2QsQ0FBQzs7Ozs7Ozs7OztJQVFELGtCQUFrQixDQUFDLFFBQVEsR0FBRyxJQUFJO1FBQ2hDLG1CQUFBLElBQUksRUFBQSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUM7UUFDaEMsT0FBTyxtQkFBQSxJQUFJLEVBQUEsQ0FBQztJQUNkLENBQUM7Ozs7Ozs7Ozs7O0lBU0QsU0FBUyxDQUFDLE1BQStDO1FBQ3ZELG1CQUFBLElBQUksRUFBQSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEIsT0FBTyxtQkFBQSxJQUFJLEVBQUEsQ0FBQztJQUNkLENBQUM7Ozs7Ozs7O0lBTUQsa0JBQWtCLENBQUMsTUFBYztRQUMvQixtQkFBQSxJQUFJLEVBQUEsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLE9BQU8sbUJBQUEsSUFBSSxFQUFBLENBQUM7SUFDZCxDQUFDOzs7Ozs7OztJQU1ELGtCQUFrQixDQUFDLE1BQWM7UUFDL0IsbUJBQUEsSUFBSSxFQUFBLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztRQUN2QixPQUFPLG1CQUFBLElBQUksRUFBQSxDQUFDO0lBQ2QsQ0FBQzs7Ozs7Ozs7Ozs7O0lBVUQscUJBQXFCLENBQUMsUUFBZ0I7UUFDcEMsbUJBQUEsSUFBSSxFQUFBLENBQUMsd0JBQXdCLEdBQUcsUUFBUSxDQUFDO1FBQ3pDLE9BQU8sbUJBQUEsSUFBSSxFQUFBLENBQUM7SUFDZCxDQUFDOzs7Ozs7OztJQUtPLGVBQWUsQ0FBQyxVQUFzQixFQUFFLEdBQXNCOztZQUNoRSxDQUFTO1FBQ2IsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLFFBQVEsRUFBRTtZQUMzQix1REFBdUQ7WUFDdkQsdURBQXVEO1lBQ3ZELENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM5QzthQUFNOztrQkFDQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSTs7a0JBQzNELElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLO1lBQy9ELENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDNUM7O1lBRUcsQ0FBUztRQUNiLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxRQUFRLEVBQUU7WUFDM0IsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzlDO2FBQU07WUFDTCxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7U0FDL0Q7UUFFRCxPQUFPLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDO0lBQ2hCLENBQUM7Ozs7Ozs7Ozs7SUFPTyxnQkFBZ0IsQ0FDcEIsV0FBa0IsRUFDbEIsV0FBdUIsRUFDdkIsR0FBc0I7Ozs7WUFJcEIsYUFBcUI7UUFDekIsSUFBSSxHQUFHLENBQUMsUUFBUSxJQUFJLFFBQVEsRUFBRTtZQUM1QixhQUFhLEdBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztTQUN4QzthQUFNLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUU7WUFDbkMsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEQ7YUFBTTtZQUNMLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1NBQ3hEOztZQUVHLGFBQXFCO1FBQ3pCLElBQUksR0FBRyxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUU7WUFDNUIsYUFBYSxHQUFHLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7U0FDekM7YUFBTTtZQUNMLGFBQWEsR0FBRyxHQUFHLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7U0FDakU7UUFFRCx5Q0FBeUM7UUFDekMsT0FBTztZQUNMLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxHQUFHLGFBQWE7WUFDaEMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLEdBQUcsYUFBYTtTQUNqQyxDQUFDO0lBQ0osQ0FBQzs7Ozs7Ozs7OztJQUdPLGNBQWMsQ0FBQyxLQUFZLEVBQUUsT0FBbUIsRUFBRSxRQUFvQixFQUM1RSxRQUEyQjtZQUV2QixFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsR0FBRyxLQUFLOztZQUNkLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUM7O1lBQ3hDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUM7UUFFNUMsaUZBQWlGO1FBQ2pGLElBQUksT0FBTyxFQUFFO1lBQ1gsQ0FBQyxJQUFJLE9BQU8sQ0FBQztTQUNkO1FBRUQsSUFBSSxPQUFPLEVBQUU7WUFDWCxDQUFDLElBQUksT0FBTyxDQUFDO1NBQ2Q7OztZQUdHLFlBQVksR0FBRyxDQUFDLEdBQUcsQ0FBQzs7WUFDcEIsYUFBYSxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSzs7WUFDcEQsV0FBVyxHQUFHLENBQUMsR0FBRyxDQUFDOztZQUNuQixjQUFjLEdBQUcsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNOzs7WUFHdkQsWUFBWSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUM7O1lBQ2xGLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDOztZQUNwRixXQUFXLEdBQUcsWUFBWSxHQUFHLGFBQWE7UUFFOUMsT0FBTztZQUNMLFdBQVc7WUFDWCwwQkFBMEIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFdBQVc7WUFDNUUsd0JBQXdCLEVBQUUsYUFBYSxLQUFLLE9BQU8sQ0FBQyxNQUFNO1lBQzFELDBCQUEwQixFQUFFLFlBQVksSUFBSSxPQUFPLENBQUMsS0FBSztTQUMxRCxDQUFDO0lBQ0osQ0FBQzs7Ozs7Ozs7O0lBUU8sNkJBQTZCLENBQUMsR0FBZSxFQUFFLEtBQVksRUFBRSxRQUFvQjtRQUN2RixJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRTs7a0JBQ3pCLGVBQWUsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDOztrQkFDM0MsY0FBYyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUM7O2tCQUN6QyxTQUFTLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDOztrQkFDakUsUUFBUSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQzs7a0JBRS9ELFdBQVcsR0FBRyxHQUFHLENBQUMsd0JBQXdCO2dCQUM1QyxDQUFDLFNBQVMsSUFBSSxJQUFJLElBQUksU0FBUyxJQUFJLGVBQWUsQ0FBQzs7a0JBQ2pELGFBQWEsR0FBRyxHQUFHLENBQUMsMEJBQTBCO2dCQUNoRCxDQUFDLFFBQVEsSUFBSSxJQUFJLElBQUksUUFBUSxJQUFJLGNBQWMsQ0FBQztZQUVwRCxPQUFPLFdBQVcsSUFBSSxhQUFhLENBQUM7U0FDckM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Ozs7Ozs7Ozs7Ozs7SUFhTyxvQkFBb0IsQ0FBQyxLQUFZLEVBQ1osT0FBbUIsRUFDbkIsY0FBc0M7UUFDakUsMEZBQTBGO1FBQzFGLDBGQUEwRjtRQUMxRixnR0FBZ0c7UUFDaEcsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUNwRCxPQUFPO2dCQUNMLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQzthQUN4QyxDQUFDO1NBQ0g7O2NBRUssUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhOzs7O2NBSTdCLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzs7Y0FDckUsY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDOztjQUN4RSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLGNBQWMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7O2NBQ3RFLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7O1lBRzNFLEtBQUssR0FBRyxDQUFDOztZQUNULEtBQUssR0FBRyxDQUFDO1FBRWIsMkZBQTJGO1FBQzNGLHlGQUF5RjtRQUN6Riw4RUFBOEU7UUFDOUUsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUU7WUFDbkMsS0FBSyxHQUFHLFlBQVksSUFBSSxDQUFDLGFBQWEsQ0FBQztTQUN4QzthQUFNO1lBQ0wsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDOUY7UUFFRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUNyQyxLQUFLLEdBQUcsV0FBVyxJQUFJLENBQUMsY0FBYyxDQUFDO1NBQ3hDO2FBQU07WUFDTCxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM1RjtRQUVELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxFQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBQyxDQUFDO1FBRWhELE9BQU87WUFDTCxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLO1lBQ2xCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUs7U0FDbkIsQ0FBQztJQUNKLENBQUM7Ozs7Ozs7O0lBT08sY0FBYyxDQUFDLFFBQTJCLEVBQUUsV0FBa0I7UUFDcEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVsRCxJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUU7WUFDdkIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUM1QztRQUVELG1GQUFtRjtRQUNuRixJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztRQUU5Qiw4RUFBOEU7UUFDOUUsNkVBQTZFO1FBQzdFLDJDQUEyQztRQUMzQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFOztrQkFDcEMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFOztrQkFDdEQsV0FBVyxHQUFHLElBQUksOEJBQThCLENBQUMsUUFBUSxFQUFFLHdCQUF3QixDQUFDO1lBQzFGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDekM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLENBQUM7Ozs7Ozs7SUFHTyxtQkFBbUIsQ0FBQyxRQUEyQjtRQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFO1lBQ2xDLE9BQU87U0FDUjs7Y0FFSyxRQUFRLEdBQ1YsbUJBQUEsSUFBSSxDQUFDLFlBQVksRUFBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQzs7WUFDbEUsT0FBb0M7O1lBQ3BDLE9BQU8sR0FBZ0MsUUFBUSxDQUFDLFFBQVE7UUFFNUQsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUNsQyxPQUFPLEdBQUcsUUFBUSxDQUFDO1NBQ3BCO2FBQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDeEIsT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztTQUM1RDthQUFNO1lBQ0wsT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztTQUM1RDtRQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDO1NBQzdEO0lBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7SUFRTyx5QkFBeUIsQ0FBQyxNQUFhLEVBQUUsUUFBMkI7O2NBQ3BFLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYTs7Y0FDN0IsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7O1lBQ3ZCLE1BQWM7O1lBQUUsR0FBVzs7WUFBRSxNQUFjO1FBRS9DLElBQUksUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7WUFDL0IsK0VBQStFO1lBQy9FLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2YsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDdkQ7YUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQ3pDLHlGQUF5RjtZQUN6Rix3RkFBd0Y7WUFDeEYsaUZBQWlGO1lBQ2pGLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFDL0QsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDMUQ7YUFBTTs7Ozs7O2tCQUtDLDhCQUE4QixHQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7O2tCQUUzRCxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU07WUFFdkQsTUFBTSxHQUFHLDhCQUE4QixHQUFHLENBQUMsQ0FBQztZQUM1QyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyw4QkFBOEIsQ0FBQztZQUVoRCxJQUFJLE1BQU0sR0FBRyxjQUFjLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUM3RSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN2QztTQUNGOzs7Y0FHSyw0QkFBNEIsR0FDOUIsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssS0FBSyxJQUFJLEtBQUssQ0FBQzs7O2NBR3BDLDJCQUEyQixHQUM3QixDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3ZDLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDOztZQUV4QyxLQUFhOztZQUFFLElBQVk7O1lBQUUsS0FBYTtRQUU5QyxJQUFJLDJCQUEyQixFQUFFO1lBQy9CLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUN6RCxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1NBQ3pDO2FBQU0sSUFBSSw0QkFBNEIsRUFBRTtZQUN2QyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNoQixLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1NBQ25DO2FBQU07Ozs7OztrQkFLQyw4QkFBOEIsR0FDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDOztrQkFDM0QsYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLO1lBRXJELEtBQUssR0FBRyw4QkFBOEIsR0FBRyxDQUFDLENBQUM7WUFDM0MsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsOEJBQThCLENBQUM7WUFFakQsSUFBSSxLQUFLLEdBQUcsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFDM0UsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDdkM7U0FDRjtRQUVELE9BQU8sRUFBQyxHQUFHLEVBQUUsbUJBQUEsR0FBRyxFQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFBLElBQUksRUFBQyxFQUFFLE1BQU0sRUFBRSxtQkFBQSxNQUFNLEVBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQUEsS0FBSyxFQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDO0lBQ2pGLENBQUM7Ozs7Ozs7Ozs7SUFTTyxxQkFBcUIsQ0FBQyxNQUFhLEVBQUUsUUFBMkI7O2NBQ2hFLGVBQWUsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztRQUV4RSwyRkFBMkY7UUFDM0YsNEJBQTRCO1FBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ2xELGVBQWUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1RixlQUFlLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDMUY7O2NBRUssTUFBTSxHQUFHLG1CQUFBLEVBQUUsRUFBdUI7UUFFeEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtZQUM1QixNQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7U0FDdkM7YUFBTTs7a0JBQ0MsU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsU0FBUzs7a0JBQ2xELFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVE7WUFFdEQsTUFBTSxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLEdBQUcsR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFMUQsc0RBQXNEO1lBQ3RELElBQUksUUFBUSxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBQ2xDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO2FBQzlCO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO2FBQzdFO1lBRUQsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDbEMsTUFBTSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUM7YUFDbEM7aUJBQU07Z0JBQ0wsTUFBTSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7YUFDcEY7WUFFRCxJQUFJLFNBQVMsRUFBRTtnQkFDYixNQUFNLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ25EO1lBRUQsSUFBSSxRQUFRLEVBQUU7Z0JBQ1osTUFBTSxDQUFDLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNqRDtTQUNGO1FBRUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGVBQWUsQ0FBQztRQUU1QyxZQUFZLENBQUMsbUJBQUEsSUFBSSxDQUFDLFlBQVksRUFBQyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqRCxDQUFDOzs7Ozs7SUFHTyx1QkFBdUI7UUFDN0IsWUFBWSxDQUFDLG1CQUFBLElBQUksQ0FBQyxZQUFZLEVBQUMsQ0FBQyxLQUFLLEVBQUUsbUJBQUE7WUFDckMsR0FBRyxFQUFFLEdBQUc7WUFDUixJQUFJLEVBQUUsR0FBRztZQUNULEtBQUssRUFBRSxHQUFHO1lBQ1YsTUFBTSxFQUFFLEdBQUc7WUFDWCxNQUFNLEVBQUUsRUFBRTtZQUNWLEtBQUssRUFBRSxFQUFFO1lBQ1QsVUFBVSxFQUFFLEVBQUU7WUFDZCxjQUFjLEVBQUUsRUFBRTtTQUNuQixFQUF1QixDQUFDLENBQUM7SUFDNUIsQ0FBQzs7Ozs7O0lBR08sMEJBQTBCO1FBQ2hDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxtQkFBQTtZQUM3QixHQUFHLEVBQUUsRUFBRTtZQUNQLElBQUksRUFBRSxFQUFFO1lBQ1IsTUFBTSxFQUFFLEVBQUU7WUFDVixLQUFLLEVBQUUsRUFBRTtZQUNULFFBQVEsRUFBRSxFQUFFO1lBQ1osU0FBUyxFQUFFLEVBQUU7U0FDZCxFQUF1QixDQUFDLENBQUM7SUFDNUIsQ0FBQzs7Ozs7Ozs7SUFHTyx3QkFBd0IsQ0FBQyxXQUFrQixFQUFFLFFBQTJCOztjQUN4RSxNQUFNLEdBQUcsbUJBQUEsRUFBRSxFQUF1Qjs7Y0FDbEMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFOztjQUMzQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCOztjQUNuRCxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUU7UUFFM0MsSUFBSSxnQkFBZ0IsRUFBRTs7a0JBQ2QsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMseUJBQXlCLEVBQUU7WUFDdEUsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztTQUNyRjthQUFNO1lBQ0wsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDNUI7Ozs7Ozs7WUFPRyxlQUFlLEdBQUcsRUFBRTs7WUFDcEIsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQzs7WUFDeEMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQztRQUU1QyxJQUFJLE9BQU8sRUFBRTtZQUNYLGVBQWUsSUFBSSxjQUFjLE9BQU8sTUFBTSxDQUFDO1NBQ2hEO1FBRUQsSUFBSSxPQUFPLEVBQUU7WUFDWCxlQUFlLElBQUksY0FBYyxPQUFPLEtBQUssQ0FBQztTQUMvQztRQUVELE1BQU0sQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTFDLDZGQUE2RjtRQUM3RiwyRkFBMkY7UUFDM0YsNEZBQTRGO1FBQzVGLDJGQUEyRjtRQUMzRiwrREFBK0Q7UUFDL0QsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFO1lBQ3BCLElBQUksZ0JBQWdCLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzFEO2lCQUFNLElBQUkscUJBQXFCLEVBQUU7Z0JBQ2hDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO2FBQ3ZCO1NBQ0Y7UUFFRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDbkIsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDcEIsTUFBTSxDQUFDLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDeEQ7aUJBQU0sSUFBSSxxQkFBcUIsRUFBRTtnQkFDaEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7YUFDdEI7U0FDRjtRQUVELFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6QyxDQUFDOzs7Ozs7Ozs7SUFHTyxpQkFBaUIsQ0FBQyxRQUEyQixFQUMzQixXQUFrQixFQUNsQixjQUFzQzs7OztZQUcxRCxNQUFNLEdBQUcsbUJBQUEsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUMsRUFBdUI7O1lBQ3JELFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDO1FBRWxGLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQzNGOztZQUVHLHFCQUFxQixHQUNyQixJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEdBQUc7UUFFNUUsNEZBQTRGO1FBQzVGLCtGQUErRjtRQUMvRixnR0FBZ0c7UUFDaEcsZ0RBQWdEO1FBQ2hELFlBQVksQ0FBQyxDQUFDLElBQUkscUJBQXFCLENBQUM7UUFFeEMsdUZBQXVGO1FBQ3ZGLGdGQUFnRjtRQUNoRixJQUFJLFFBQVEsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFOzs7O2tCQUc1QixjQUFjLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUMsQ0FBQyxZQUFZO1lBQ25FLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxjQUFjLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNyRjthQUFNO1lBQ0wsTUFBTSxDQUFDLEdBQUcsR0FBRyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbEQ7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDOzs7Ozs7Ozs7SUFHTyxpQkFBaUIsQ0FBQyxRQUEyQixFQUMzQixXQUFrQixFQUNsQixjQUFzQzs7OztZQUcxRCxNQUFNLEdBQUcsbUJBQUEsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsRUFBdUI7O1lBQ3JELFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDO1FBRWxGLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQzNGOzs7Ozs7WUFNRyx1QkFBeUM7UUFFN0MsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDakIsdUJBQXVCLEdBQUcsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1NBQzFFO2FBQU07WUFDTCx1QkFBdUIsR0FBRyxRQUFRLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7U0FDMUU7UUFFRCxvRkFBb0Y7UUFDcEYsaUVBQWlFO1FBQ2pFLElBQUksdUJBQXVCLEtBQUssT0FBTyxFQUFFOztrQkFDakMsYUFBYSxHQUFHLG1CQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFDLENBQUMsV0FBVztZQUNqRSxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsYUFBYSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7U0FDbEY7YUFBTTtZQUNMLE1BQU0sQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ25EO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQzs7Ozs7OztJQU1PLG9CQUFvQjs7O2NBRXBCLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFOztjQUNwQyxhQUFhLEdBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRTs7Ozs7Y0FLbkQscUJBQXFCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHOzs7O1FBQUMsVUFBVSxDQUFDLEVBQUU7WUFDL0QsT0FBTyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDMUUsQ0FBQyxFQUFDO1FBRUYsT0FBTztZQUNMLGVBQWUsRUFBRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUscUJBQXFCLENBQUM7WUFDakYsbUJBQW1CLEVBQUUsNEJBQTRCLENBQUMsWUFBWSxFQUFFLHFCQUFxQixDQUFDO1lBQ3RGLGdCQUFnQixFQUFFLDJCQUEyQixDQUFDLGFBQWEsRUFBRSxxQkFBcUIsQ0FBQztZQUNuRixvQkFBb0IsRUFBRSw0QkFBNEIsQ0FBQyxhQUFhLEVBQUUscUJBQXFCLENBQUM7U0FDekYsQ0FBQztJQUNKLENBQUM7Ozs7Ozs7O0lBR08sa0JBQWtCLENBQUMsTUFBYyxFQUFFLEdBQUcsU0FBbUI7UUFDL0QsT0FBTyxTQUFTLENBQUMsTUFBTTs7Ozs7UUFBQyxDQUFDLFlBQW9CLEVBQUUsZUFBdUIsRUFBRSxFQUFFO1lBQ3hFLE9BQU8sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JELENBQUMsR0FBRSxNQUFNLENBQUMsQ0FBQztJQUNiLENBQUM7Ozs7OztJQUdPLHdCQUF3Qjs7Ozs7OztjQU14QixLQUFLLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUMsQ0FBQyxXQUFXOztjQUNuRCxNQUFNLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUMsQ0FBQyxZQUFZOztjQUNyRCxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRTtRQUV0RSxPQUFPO1lBQ0wsR0FBRyxFQUFLLGNBQWMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWU7WUFDakQsSUFBSSxFQUFJLGNBQWMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWU7WUFDbEQsS0FBSyxFQUFHLGNBQWMsQ0FBQyxJQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlO1lBQzFELE1BQU0sRUFBRSxjQUFjLENBQUMsR0FBRyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZTtZQUMxRCxLQUFLLEVBQUcsS0FBSyxHQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDM0MsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1NBQzVDLENBQUM7SUFDSixDQUFDOzs7Ozs7SUFHTyxNQUFNO1FBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxLQUFLLEtBQUssQ0FBQztJQUNuRCxDQUFDOzs7Ozs7SUFHTyxpQkFBaUI7UUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hELENBQUM7Ozs7Ozs7O0lBR08sVUFBVSxDQUFDLFFBQTJCLEVBQUUsSUFBZTtRQUM3RCxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7WUFDaEIsNERBQTREO1lBQzVELDJEQUEyRDtZQUMzRCxPQUFPLFFBQVEsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO1NBQ3BFO1FBRUQsT0FBTyxRQUFRLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztJQUNyRSxDQUFDOzs7Ozs7SUFHTyxrQkFBa0I7UUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUU7WUFDcEMsTUFBTSxLQUFLLENBQUMsdUVBQXVFLENBQUMsQ0FBQztTQUN0RjtRQUVELDREQUE0RDtRQUM1RCxvREFBb0Q7UUFDcEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU87Ozs7UUFBQyxJQUFJLENBQUMsRUFBRTtZQUN0QywwQkFBMEIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3BELHdCQUF3QixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEQsMEJBQTBCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RCx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7OztJQUdPLGdCQUFnQixDQUFDLFVBQTZCO1FBQ3BELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPOzs7O1lBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3pDLElBQUksUUFBUSxLQUFLLEVBQUUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO29CQUN6RSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3BDO1lBQ0gsQ0FBQyxFQUFDLENBQUM7U0FDSjtJQUNILENBQUM7Ozs7OztJQUdPLGtCQUFrQjtRQUN4QixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZCxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTzs7OztZQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEMsQ0FBQyxFQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQzs7Ozs7O0lBR08sY0FBYzs7Y0FDZCxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU87UUFFM0IsSUFBSSxNQUFNLFlBQVksVUFBVSxFQUFFO1lBQ2hDLE9BQU8sTUFBTSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1NBQ3JEO1FBRUQsd0RBQXdEO1FBQ3hELElBQUksTUFBTSxZQUFZLE9BQU8sRUFBRTtZQUM3QixPQUFPLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1NBQ3ZDOztjQUVLLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUM7O2NBQ3pCLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUM7UUFFakMsMEZBQTBGO1FBQzFGLE9BQU87WUFDTCxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDYixNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNO1lBQ3pCLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNkLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUs7WUFDdkIsTUFBTTtZQUNOLEtBQUs7U0FDTixDQUFDO0lBQ0osQ0FBQztDQUNGOzs7Ozs7O0lBempDQyx3REFBc0M7Ozs7OztJQUd0Qyw2REFBa0M7Ozs7OztJQUdsQyxpRUFBcUQ7Ozs7OztJQUdyRCxzREFBMEI7Ozs7OztJQUcxQixxREFBd0I7Ozs7OztJQUd4QiwyREFBK0I7Ozs7OztJQUcvQixtRUFBc0M7Ozs7OztJQUd0Qyw0REFBZ0M7Ozs7OztJQUdoQyx3REFBZ0M7Ozs7OztJQUdoQyx5REFBaUM7Ozs7OztJQUdqQywwREFBa0M7Ozs7OztJQUdsQyw0REFBNEI7Ozs7OztJQUc1Qix5REFBMkM7Ozs7O0lBRzNDLGdFQUFtRDs7Ozs7O0lBR25ELG9EQUF5RDs7Ozs7O0lBR3pELGtEQUEyQjs7Ozs7O0lBRzNCLHdEQUE2Qjs7Ozs7OztJQU03Qix5REFBeUM7Ozs7OztJQUd6QywwREFBZ0Q7Ozs7OztJQUdoRCw2REFBeUU7Ozs7OztJQUd6RSxnRUFBaUQ7Ozs7OztJQUdqRCxxREFBcUI7Ozs7OztJQUdyQixxREFBcUI7Ozs7OztJQUdyQixxRUFBeUM7Ozs7OztJQUd6QyxpRUFBNEM7Ozs7OztJQUc1QyxnRUFBMkQ7Ozs7O0lBRzNELDREQUN5Qzs7Ozs7SUFRaUIsMkRBQXFDOzs7OztJQUMzRixzREFBMkI7Ozs7O0lBQUUsc0RBQTJCOzs7OztJQUN4RCw4REFBMkM7Ozs7OztBQWcrQmpELG9CQUdDOzs7SUFGQyxrQkFBVTs7SUFDVixrQkFBVTs7Ozs7O0FBSVoseUJBWUM7Ozs7OztJQVZDLGdEQUFvQzs7Ozs7SUFHcEMsOENBQWtDOzs7OztJQUdsQyxnREFBb0M7Ozs7O0lBR3BDLGlDQUFvQjs7Ozs7O0FBSXRCLCtCQU1DOzs7SUFMQyxvQ0FBNEI7O0lBQzVCLHVDQUFtQjs7SUFDbkIsd0NBQW9COztJQUNwQixzQ0FBdUI7O0lBQ3ZCLHVDQUF3Qjs7Ozs7O0FBSTFCLDhCQU9DOzs7SUFOQyw4QkFBWTs7SUFDWiwrQkFBYTs7SUFDYixpQ0FBZTs7SUFDZixnQ0FBYzs7SUFDZCxpQ0FBZTs7SUFDZixnQ0FBYzs7Ozs7O0FBSWhCLDBCQUtDOzs7SUFKQywrQkFBNEI7O0lBQzVCLDZCQUFjOztJQUNkLGtDQUF3Qjs7SUFDeEIsc0NBQWlDOzs7Ozs7QUFJbkMsdUNBV0M7OztJQVZDLG9DQUFvQzs7SUFDcEMsb0NBQXFDOztJQUVyQyxxQ0FBcUM7O0lBQ3JDLHFDQUFzQzs7SUFFdEMsbUNBQWdCOztJQUNoQixvQ0FBaUI7O0lBQ2pCLG9DQUFpQjs7SUFDakIsdUNBQStCOzs7Ozs7OztBQUlqQyxTQUFTLFlBQVksQ0FBQyxXQUFnQyxFQUNoQyxNQUEyQjtJQUMvQyxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtRQUN0QixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNoQztLQUNGO0lBRUQsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQzs7Ozs7OztBQU9ELFNBQVMsYUFBYSxDQUFDLEtBQW1DO0lBQ3hELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7Y0FDeEMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUM7UUFDbEQsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDOUQ7SUFFRCxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Bvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vcG9zaXRpb24tc3RyYXRlZ3knO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlciwgQ2RrU2Nyb2xsYWJsZSwgVmlld3BvcnRTY3JvbGxQb3NpdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2UsXG4gIENvbm5lY3Rpb25Qb3NpdGlvblBhaXIsXG4gIFNjcm9sbGluZ1Zpc2liaWxpdHksXG4gIHZhbGlkYXRlSG9yaXpvbnRhbFBvc2l0aW9uLFxuICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24sXG59IGZyb20gJy4vY29ubmVjdGVkLXBvc2l0aW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9uLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7T3ZlcmxheVJlZmVyZW5jZX0gZnJvbSAnLi4vb3ZlcmxheS1yZWZlcmVuY2UnO1xuaW1wb3J0IHtpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3LCBpc0VsZW1lbnRDbGlwcGVkQnlTY3JvbGxpbmd9IGZyb20gJy4vc2Nyb2xsLWNsaXAnO1xuaW1wb3J0IHtjb2VyY2VDc3NQaXhlbFZhbHVlLCBjb2VyY2VBcnJheX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4uL292ZXJsYXktY29udGFpbmVyJztcblxuLy8gVE9ETzogcmVmYWN0b3IgY2xpcHBpbmcgZGV0ZWN0aW9uIGludG8gYSBzZXBhcmF0ZSB0aGluZyAocGFydCBvZiBzY3JvbGxpbmcgbW9kdWxlKVxuLy8gVE9ETzogZG9lc24ndCBoYW5kbGUgYm90aCBmbGV4aWJsZSB3aWR0aCBhbmQgaGVpZ2h0IHdoZW4gaXQgaGFzIHRvIHNjcm9sbCBhbG9uZyBib3RoIGF4aXMuXG5cbi8qKiBDbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgb3ZlcmxheSBib3VuZGluZyBib3guICovXG5jb25zdCBib3VuZGluZ0JveENsYXNzID0gJ2Nkay1vdmVybGF5LWNvbm5lY3RlZC1wb3NpdGlvbi1ib3VuZGluZy1ib3gnO1xuXG4vKiogUmVnZXggdXNlZCB0byBzcGxpdCBhIHN0cmluZyBvbiBpdHMgQ1NTIHVuaXRzLiAqL1xuY29uc3QgY3NzVW5pdFBhdHRlcm4gPSAvKFtBLVphLXolXSspJC87XG5cbi8qKiBQb3NzaWJsZSB2YWx1ZXMgdGhhdCBjYW4gYmUgc2V0IGFzIHRoZSBvcmlnaW4gb2YgYSBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kuICovXG5leHBvcnQgdHlwZSBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4gPSBFbGVtZW50UmVmIHwgSFRNTEVsZW1lbnQgfCBQb2ludCAmIHtcbiAgd2lkdGg/OiBudW1iZXI7XG4gIGhlaWdodD86IG51bWJlcjtcbn07XG5cbi8qKlxuICogQSBzdHJhdGVneSBmb3IgcG9zaXRpb25pbmcgb3ZlcmxheXMuIFVzaW5nIHRoaXMgc3RyYXRlZ3ksIGFuIG92ZXJsYXkgaXMgZ2l2ZW4gYW5cbiAqIGltcGxpY2l0IHBvc2l0aW9uIHJlbGF0aXZlIHNvbWUgb3JpZ2luIGVsZW1lbnQuIFRoZSByZWxhdGl2ZSBwb3NpdGlvbiBpcyBkZWZpbmVkIGluIHRlcm1zIG9mXG4gKiBhIHBvaW50IG9uIHRoZSBvcmlnaW4gZWxlbWVudCB0aGF0IGlzIGNvbm5lY3RlZCB0byBhIHBvaW50IG9uIHRoZSBvdmVybGF5IGVsZW1lbnQuIEZvciBleGFtcGxlLFxuICogYSBiYXNpYyBkcm9wZG93biBpcyBjb25uZWN0aW5nIHRoZSBib3R0b20tbGVmdCBjb3JuZXIgb2YgdGhlIG9yaWdpbiB0byB0aGUgdG9wLWxlZnQgY29ybmVyXG4gKiBvZiB0aGUgb3ZlcmxheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSBpbXBsZW1lbnRzIFBvc2l0aW9uU3RyYXRlZ3kge1xuICAvKiogVGhlIG92ZXJsYXkgdG8gd2hpY2ggdGhpcyBzdHJhdGVneSBpcyBhdHRhY2hlZC4gKi9cbiAgcHJpdmF0ZSBfb3ZlcmxheVJlZjogT3ZlcmxheVJlZmVyZW5jZTtcblxuICAvKiogV2hldGhlciB3ZSdyZSBwZXJmb3JtaW5nIHRoZSB2ZXJ5IGZpcnN0IHBvc2l0aW9uaW5nIG9mIHRoZSBvdmVybGF5LiAqL1xuICBwcml2YXRlIF9pc0luaXRpYWxSZW5kZXI6IGJvb2xlYW47XG5cbiAgLyoqIExhc3Qgc2l6ZSB1c2VkIGZvciB0aGUgYm91bmRpbmcgYm94LiBVc2VkIHRvIGF2b2lkIHJlc2l6aW5nIHRoZSBvdmVybGF5IGFmdGVyIG9wZW4uICovXG4gIHByaXZhdGUgX2xhc3RCb3VuZGluZ0JveFNpemUgPSB7d2lkdGg6IDAsIGhlaWdodDogMH07XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgd2FzIHB1c2hlZCBpbiBhIHByZXZpb3VzIHBvc2l0aW9uaW5nLiAqL1xuICBwcml2YXRlIF9pc1B1c2hlZCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIG9uIHRoZSBpbml0aWFsIG9wZW4uICovXG4gIHByaXZhdGUgX2NhblB1c2ggPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IHZpYSBmbGV4aWJsZSB3aWR0aC9oZWlnaHQgYWZ0ZXIgdGhlIGluaXRpYWwgb3Blbi4gKi9cbiAgcHJpdmF0ZSBfZ3Jvd0FmdGVyT3BlbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5J3Mgd2lkdGggYW5kIGhlaWdodCBjYW4gYmUgY29uc3RyYWluZWQgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX2hhc0ZsZXhpYmxlRGltZW5zaW9ucyA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgcG9zaXRpb24gaXMgbG9ja2VkLiAqL1xuICBwcml2YXRlIF9wb3NpdGlvbkxvY2tlZCA9IGZhbHNlO1xuXG4gIC8qKiBDYWNoZWQgb3JpZ2luIGRpbWVuc2lvbnMgKi9cbiAgcHJpdmF0ZSBfb3JpZ2luUmVjdDogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIG92ZXJsYXkgZGltZW5zaW9ucyAqL1xuICBwcml2YXRlIF9vdmVybGF5UmVjdDogQ2xpZW50UmVjdDtcblxuICAvKiogQ2FjaGVkIHZpZXdwb3J0IGRpbWVuc2lvbnMgKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRSZWN0OiBDbGllbnRSZWN0O1xuXG4gIC8qKiBBbW91bnQgb2Ygc3BhY2UgdGhhdCBtdXN0IGJlIG1haW50YWluZWQgYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF92aWV3cG9ydE1hcmdpbiA9IDA7XG5cbiAgLyoqIFRoZSBTY3JvbGxhYmxlIGNvbnRhaW5lcnMgdXNlZCB0byBjaGVjayBzY3JvbGxhYmxlIHZpZXcgcHJvcGVydGllcyBvbiBwb3NpdGlvbiBjaGFuZ2UuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVzOiBDZGtTY3JvbGxhYmxlW10gPSBbXTtcblxuICAvKiogT3JkZXJlZCBsaXN0IG9mIHByZWZlcnJlZCBwb3NpdGlvbnMsIGZyb20gbW9zdCB0byBsZWFzdCBkZXNpcmFibGUuICovXG4gIF9wcmVmZXJyZWRQb3NpdGlvbnM6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSA9IFtdO1xuXG4gIC8qKiBUaGUgb3JpZ2luIGVsZW1lbnQgYWdhaW5zdCB3aGljaCB0aGUgb3ZlcmxheSB3aWxsIGJlIHBvc2l0aW9uZWQuICovXG4gIHByaXZhdGUgX29yaWdpbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luO1xuXG4gIC8qKiBUaGUgb3ZlcmxheSBwYW5lIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3BhbmU6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBzdHJhdGVneSBoYXMgYmVlbiBkaXNwb3NlZCBvZiBhbHJlYWR5LiAqL1xuICBwcml2YXRlIF9pc0Rpc3Bvc2VkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBQYXJlbnQgZWxlbWVudCBmb3IgdGhlIG92ZXJsYXkgcGFuZWwgdXNlZCB0byBjb25zdHJhaW4gdGhlIG92ZXJsYXkgcGFuZWwncyBzaXplIHRvIGZpdFxuICAgKiB3aXRoaW4gdGhlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYm91bmRpbmdCb3g6IEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAvKiogVGhlIGxhc3QgcG9zaXRpb24gdG8gaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgYXMgdGhlIGJlc3QgZml0IHBvc2l0aW9uLiAqL1xuICBwcml2YXRlIF9sYXN0UG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uIHwgbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSBwb3NpdGlvbiBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF9wb3NpdGlvbkNoYW5nZXMgPSBuZXcgU3ViamVjdDxDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2U+KCk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB2aWV3cG9ydCBzaXplIGNoYW5nZXMuICovXG4gIHByaXZhdGUgX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogRGVmYXVsdCBvZmZzZXQgZm9yIHRoZSBvdmVybGF5IGFsb25nIHRoZSB4IGF4aXMuICovXG4gIHByaXZhdGUgX29mZnNldFggPSAwO1xuXG4gIC8qKiBEZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkgYWxvbmcgdGhlIHkgYXhpcy4gKi9cbiAgcHJpdmF0ZSBfb2Zmc2V0WSA9IDA7XG5cbiAgLyoqIFNlbGVjdG9yIHRvIGJlIHVzZWQgd2hlbiBmaW5kaW5nIHRoZSBlbGVtZW50cyBvbiB3aGljaCB0byBzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4uICovXG4gIHByaXZhdGUgX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBDU1MgY2xhc3NlcyB0aGF0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBoYXMgYXBwbGllZCBvbiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfYXBwbGllZFBhbmVsQ2xhc3Nlczogc3RyaW5nW10gPSBbXTtcblxuICAvKiogQW1vdW50IGJ5IHdoaWNoIHRoZSBvdmVybGF5IHdhcyBwdXNoZWQgaW4gZWFjaCBheGlzIGR1cmluZyB0aGUgbGFzdCB0aW1lIGl0IHdhcyBwb3NpdGlvbmVkLiAqL1xuICBwcml2YXRlIF9wcmV2aW91c1B1c2hBbW91bnQ6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0gfCBudWxsO1xuXG4gIC8qKiBPYnNlcnZhYmxlIHNlcXVlbmNlIG9mIHBvc2l0aW9uIGNoYW5nZXMuICovXG4gIHBvc2l0aW9uQ2hhbmdlczogT2JzZXJ2YWJsZTxDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2U+ID1cbiAgICAgIHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5hc09ic2VydmFibGUoKTtcblxuICAvKiogT3JkZXJlZCBsaXN0IG9mIHByZWZlcnJlZCBwb3NpdGlvbnMsIGZyb20gbW9zdCB0byBsZWFzdCBkZXNpcmFibGUuICovXG4gIGdldCBwb3NpdGlvbnMoKTogQ29ubmVjdGlvblBvc2l0aW9uUGFpcltdIHtcbiAgICByZXR1cm4gdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb25uZWN0ZWRUbzogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luLCBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyLFxuICAgICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LCBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyKSB7XG4gICAgdGhpcy5zZXRPcmlnaW4oY29ubmVjdGVkVG8pO1xuICB9XG5cbiAgLyoqIEF0dGFjaGVzIHRoaXMgcG9zaXRpb24gc3RyYXRlZ3kgdG8gYW4gb3ZlcmxheS4gKi9cbiAgYXR0YWNoKG92ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZiAmJiBvdmVybGF5UmVmICE9PSB0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aHJvdyBFcnJvcignVGhpcyBwb3NpdGlvbiBzdHJhdGVneSBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGFuIG92ZXJsYXknKTtcbiAgICB9XG5cbiAgICB0aGlzLl92YWxpZGF0ZVBvc2l0aW9ucygpO1xuXG4gICAgb3ZlcmxheVJlZi5ob3N0RWxlbWVudC5jbGFzc0xpc3QuYWRkKGJvdW5kaW5nQm94Q2xhc3MpO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IG92ZXJsYXlSZWY7XG4gICAgdGhpcy5fYm91bmRpbmdCb3ggPSBvdmVybGF5UmVmLmhvc3RFbGVtZW50O1xuICAgIHRoaXMuX3BhbmUgPSBvdmVybGF5UmVmLm92ZXJsYXlFbGVtZW50O1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pc0luaXRpYWxSZW5kZXIgPSB0cnVlO1xuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlci5jaGFuZ2UoKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgLy8gV2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWQsIHdlIHdhbnQgdG8gdHJpZ2dlciB0aGUgbmV4dCByZXBvc2l0aW9uIGFzIGlmIGl0XG4gICAgICAvLyB3YXMgYW4gaW5pdGlhbCByZW5kZXIsIGluIG9yZGVyIGZvciB0aGUgc3RyYXRlZ3kgdG8gcGljayBhIG5ldyBvcHRpbWFsIHBvc2l0aW9uLFxuICAgICAgLy8gb3RoZXJ3aXNlIHBvc2l0aW9uIGxvY2tpbmcgd2lsbCBjYXVzZSBpdCB0byBzdGF5IGF0IHRoZSBvbGQgb25lLlxuICAgICAgdGhpcy5faXNJbml0aWFsUmVuZGVyID0gdHJ1ZTtcbiAgICAgIHRoaXMuYXBwbHkoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheSBlbGVtZW50LCB1c2luZyB3aGljaGV2ZXIgcHJlZmVycmVkIHBvc2l0aW9uIHJlbGF0aXZlXG4gICAqIHRvIHRoZSBvcmlnaW4gYmVzdCBmaXRzIG9uLXNjcmVlbi5cbiAgICpcbiAgICogVGhlIHNlbGVjdGlvbiBvZiBhIHBvc2l0aW9uIGdvZXMgYXMgZm9sbG93czpcbiAgICogIC0gSWYgYW55IHBvc2l0aW9ucyBmaXQgY29tcGxldGVseSB3aXRoaW4gdGhlIHZpZXdwb3J0IGFzLWlzLFxuICAgKiAgICAgIGNob29zZSB0aGUgZmlyc3QgcG9zaXRpb24gdGhhdCBkb2VzIHNvLlxuICAgKiAgLSBJZiBmbGV4aWJsZSBkaW1lbnNpb25zIGFyZSBlbmFibGVkIGFuZCBhdCBsZWFzdCBvbmUgc2F0aWZpZXMgdGhlIGdpdmVuIG1pbmltdW0gd2lkdGgvaGVpZ2h0LFxuICAgKiAgICAgIGNob29zZSB0aGUgcG9zaXRpb24gd2l0aCB0aGUgZ3JlYXRlc3QgYXZhaWxhYmxlIHNpemUgbW9kaWZpZWQgYnkgdGhlIHBvc2l0aW9ucycgd2VpZ2h0LlxuICAgKiAgLSBJZiBwdXNoaW5nIGlzIGVuYWJsZWQsIHRha2UgdGhlIHBvc2l0aW9uIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdCBhbmQgcHVzaCBpdFxuICAgKiAgICAgIG9uLXNjcmVlbi5cbiAgICogIC0gSWYgbm9uZSBvZiB0aGUgcHJldmlvdXMgY3JpdGVyaWEgd2VyZSBtZXQsIHVzZSB0aGUgcG9zaXRpb24gdGhhdCBnb2VzIG9mZi1zY3JlZW4gdGhlIGxlYXN0LlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBhcHBseSgpOiB2b2lkIHtcbiAgICAvLyBXZSBzaG91bGRuJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHN0cmF0ZWd5IHdhcyBkaXNwb3NlZCBvciB3ZSdyZSBvbiB0aGUgc2VydmVyLlxuICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkIHx8ICF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgcG9zaXRpb24gaGFzIGJlZW4gYXBwbGllZCBhbHJlYWR5IChlLmcuIHdoZW4gdGhlIG92ZXJsYXkgd2FzIG9wZW5lZCkgYW5kIHRoZVxuICAgIC8vIGNvbnN1bWVyIG9wdGVkIGludG8gbG9ja2luZyBpbiB0aGUgcG9zaXRpb24sIHJlLXVzZSB0aGUgb2xkIHBvc2l0aW9uLCBpbiBvcmRlciB0b1xuICAgIC8vIHByZXZlbnQgdGhlIG92ZXJsYXkgZnJvbSBqdW1waW5nIGFyb3VuZC5cbiAgICBpZiAoIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiB0aGlzLl9wb3NpdGlvbkxvY2tlZCAmJiB0aGlzLl9sYXN0UG9zaXRpb24pIHtcbiAgICAgIHRoaXMucmVhcHBseUxhc3RQb3NpdGlvbigpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NsZWFyUGFuZWxDbGFzc2VzKCk7XG4gICAgdGhpcy5fcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpO1xuICAgIHRoaXMuX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXMoKTtcblxuICAgIC8vIFdlIG5lZWQgdGhlIGJvdW5kaW5nIHJlY3RzIGZvciB0aGUgb3JpZ2luIGFuZCB0aGUgb3ZlcmxheSB0byBkZXRlcm1pbmUgaG93IHRvIHBvc2l0aW9uXG4gICAgLy8gdGhlIG92ZXJsYXkgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbi5cbiAgICAvLyBXZSB1c2UgdGhlIHZpZXdwb3J0IHJlY3QgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBwb3NpdGlvbiB3b3VsZCBnbyBvZmYtc2NyZWVuLlxuICAgIHRoaXMuX3ZpZXdwb3J0UmVjdCA9IHRoaXMuX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk7XG4gICAgdGhpcy5fb3JpZ2luUmVjdCA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICB0aGlzLl9vdmVybGF5UmVjdCA9IHRoaXMuX3BhbmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zdCBvcmlnaW5SZWN0ID0gdGhpcy5fb3JpZ2luUmVjdDtcbiAgICBjb25zdCBvdmVybGF5UmVjdCA9IHRoaXMuX292ZXJsYXlSZWN0O1xuICAgIGNvbnN0IHZpZXdwb3J0UmVjdCA9IHRoaXMuX3ZpZXdwb3J0UmVjdDtcblxuICAgIC8vIFBvc2l0aW9ucyB3aGVyZSB0aGUgb3ZlcmxheSB3aWxsIGZpdCB3aXRoIGZsZXhpYmxlIGRpbWVuc2lvbnMuXG4gICAgY29uc3QgZmxleGlibGVGaXRzOiBGbGV4aWJsZUZpdFtdID0gW107XG5cbiAgICAvLyBGYWxsYmFjayBpZiBub25lIG9mIHRoZSBwcmVmZXJyZWQgcG9zaXRpb25zIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LlxuICAgIGxldCBmYWxsYmFjazogRmFsbGJhY2tQb3NpdGlvbiB8IHVuZGVmaW5lZDtcblxuICAgIC8vIEdvIHRocm91Z2ggZWFjaCBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBsb29raW5nIGZvciBhIGdvb2QgZml0LlxuICAgIC8vIElmIGEgZ29vZCBmaXQgaXMgZm91bmQsIGl0IHdpbGwgYmUgYXBwbGllZCBpbW1lZGlhdGVseS5cbiAgICBmb3IgKGxldCBwb3Mgb2YgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zKSB7XG4gICAgICAvLyBHZXQgdGhlIGV4YWN0ICh4LCB5KSBjb29yZGluYXRlIGZvciB0aGUgcG9pbnQtb2Ytb3JpZ2luIG9uIHRoZSBvcmlnaW4gZWxlbWVudC5cbiAgICAgIGxldCBvcmlnaW5Qb2ludCA9IHRoaXMuX2dldE9yaWdpblBvaW50KG9yaWdpblJlY3QsIHBvcyk7XG5cbiAgICAgIC8vIEZyb20gdGhhdCBwb2ludC1vZi1vcmlnaW4sIGdldCB0aGUgZXhhY3QgKHgsIHkpIGNvb3JkaW5hdGUgZm9yIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlXG4gICAgICAvLyBvdmVybGF5IGluIHRoaXMgcG9zaXRpb24uIFdlIHVzZSB0aGUgdG9wLWxlZnQgY29ybmVyIGZvciBjYWxjdWxhdGlvbnMgYW5kIGxhdGVyIHRyYW5zbGF0ZVxuICAgICAgLy8gdGhpcyBpbnRvIGFuIGFwcHJvcHJpYXRlICh0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQpIHN0eWxlLlxuICAgICAgbGV0IG92ZXJsYXlQb2ludCA9IHRoaXMuX2dldE92ZXJsYXlQb2ludChvcmlnaW5Qb2ludCwgb3ZlcmxheVJlY3QsIHBvcyk7XG5cbiAgICAgIC8vIENhbGN1bGF0ZSBob3cgd2VsbCB0aGUgb3ZlcmxheSB3b3VsZCBmaXQgaW50byB0aGUgdmlld3BvcnQgd2l0aCB0aGlzIHBvaW50LlxuICAgICAgbGV0IG92ZXJsYXlGaXQgPSB0aGlzLl9nZXRPdmVybGF5Rml0KG92ZXJsYXlQb2ludCwgb3ZlcmxheVJlY3QsIHZpZXdwb3J0UmVjdCwgcG9zKTtcblxuICAgICAgLy8gSWYgdGhlIG92ZXJsYXksIHdpdGhvdXQgYW55IGZ1cnRoZXIgd29yaywgZml0cyBpbnRvIHRoZSB2aWV3cG9ydCwgdXNlIHRoaXMgcG9zaXRpb24uXG4gICAgICBpZiAob3ZlcmxheUZpdC5pc0NvbXBsZXRlbHlXaXRoaW5WaWV3cG9ydCkge1xuICAgICAgICB0aGlzLl9pc1B1c2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKHBvcywgb3JpZ2luUG9pbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBvdmVybGF5IGhhcyBmbGV4aWJsZSBkaW1lbnNpb25zLCB3ZSBjYW4gdXNlIHRoaXMgcG9zaXRpb25cbiAgICAgIC8vIHNvIGxvbmcgYXMgdGhlcmUncyBlbm91Z2ggc3BhY2UgZm9yIHRoZSBtaW5pbXVtIGRpbWVuc2lvbnMuXG4gICAgICBpZiAodGhpcy5fY2FuRml0V2l0aEZsZXhpYmxlRGltZW5zaW9ucyhvdmVybGF5Rml0LCBvdmVybGF5UG9pbnQsIHZpZXdwb3J0UmVjdCkpIHtcbiAgICAgICAgLy8gU2F2ZSBwb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLiBXZSB3aWxsIHVzZSB0aGVzZVxuICAgICAgICAvLyBpZiBub25lIG9mIHRoZSBwb3NpdGlvbnMgZml0ICp3aXRob3V0KiBmbGV4aWJsZSBkaW1lbnNpb25zLlxuICAgICAgICBmbGV4aWJsZUZpdHMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICBvcmlnaW46IG9yaWdpblBvaW50LFxuICAgICAgICAgIG92ZXJsYXlSZWN0LFxuICAgICAgICAgIGJvdW5kaW5nQm94UmVjdDogdGhpcy5fY2FsY3VsYXRlQm91bmRpbmdCb3hSZWN0KG9yaWdpblBvaW50LCBwb3MpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY3VycmVudCBwcmVmZXJyZWQgcG9zaXRpb24gZG9lcyBub3QgZml0IG9uIHRoZSBzY3JlZW4sIHJlbWVtYmVyIHRoZSBwb3NpdGlvblxuICAgICAgLy8gaWYgaXQgaGFzIG1vcmUgdmlzaWJsZSBhcmVhIG9uLXNjcmVlbiB0aGFuIHdlJ3ZlIHNlZW4gYW5kIG1vdmUgb250byB0aGUgbmV4dCBwcmVmZXJyZWRcbiAgICAgIC8vIHBvc2l0aW9uLlxuICAgICAgaWYgKCFmYWxsYmFjayB8fCBmYWxsYmFjay5vdmVybGF5Rml0LnZpc2libGVBcmVhIDwgb3ZlcmxheUZpdC52aXNpYmxlQXJlYSkge1xuICAgICAgICBmYWxsYmFjayA9IHtvdmVybGF5Rml0LCBvdmVybGF5UG9pbnQsIG9yaWdpblBvaW50LCBwb3NpdGlvbjogcG9zLCBvdmVybGF5UmVjdH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBwb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd291bGQgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucywgY2hvb3NlIHRoZVxuICAgIC8vIG9uZSB0aGF0IGhhcyB0aGUgZ3JlYXRlc3QgYXJlYSBhdmFpbGFibGUgbW9kaWZpZWQgYnkgdGhlIHBvc2l0aW9uJ3Mgd2VpZ2h0XG4gICAgaWYgKGZsZXhpYmxlRml0cy5sZW5ndGgpIHtcbiAgICAgIGxldCBiZXN0Rml0OiBGbGV4aWJsZUZpdCB8IG51bGwgPSBudWxsO1xuICAgICAgbGV0IGJlc3RTY29yZSA9IC0xO1xuICAgICAgZm9yIChjb25zdCBmaXQgb2YgZmxleGlibGVGaXRzKSB7XG4gICAgICAgIGNvbnN0IHNjb3JlID1cbiAgICAgICAgICAgIGZpdC5ib3VuZGluZ0JveFJlY3Qud2lkdGggKiBmaXQuYm91bmRpbmdCb3hSZWN0LmhlaWdodCAqIChmaXQucG9zaXRpb24ud2VpZ2h0IHx8IDEpO1xuICAgICAgICBpZiAoc2NvcmUgPiBiZXN0U2NvcmUpIHtcbiAgICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgICBiZXN0Rml0ID0gZml0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2lzUHVzaGVkID0gZmFsc2U7XG4gICAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGJlc3RGaXQhLnBvc2l0aW9uLCBiZXN0Rml0IS5vcmlnaW4pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdoZW4gbm9uZSBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCwgdGFrZSB0aGUgcG9zaXRpb25cbiAgICAvLyB0aGF0IHdlbnQgb2ZmLXNjcmVlbiB0aGUgbGVhc3QgYW5kIGF0dGVtcHQgdG8gcHVzaCBpdCBvbi1zY3JlZW4uXG4gICAgaWYgKHRoaXMuX2NhblB1c2gpIHtcbiAgICAgIC8vIFRPRE8oamVsYm91cm4pOiBhZnRlciBwdXNoaW5nLCB0aGUgb3BlbmluZyBcImRpcmVjdGlvblwiIG9mIHRoZSBvdmVybGF5IG1pZ2h0IG5vdCBtYWtlIHNlbnNlLlxuICAgICAgdGhpcy5faXNQdXNoZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihmYWxsYmFjayEucG9zaXRpb24sIGZhbGxiYWNrIS5vcmlnaW5Qb2ludCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWxsIG9wdGlvbnMgZm9yIGdldHRpbmcgdGhlIG92ZXJsYXkgd2l0aGluIHRoZSB2aWV3cG9ydCBoYXZlIGJlZW4gZXhoYXVzdGVkLCBzbyBnbyB3aXRoIHRoZVxuICAgIC8vIHBvc2l0aW9uIHRoYXQgd2VudCBvZmYtc2NyZWVuIHRoZSBsZWFzdC5cbiAgICB0aGlzLl9hcHBseVBvc2l0aW9uKGZhbGxiYWNrIS5wb3NpdGlvbiwgZmFsbGJhY2shLm9yaWdpblBvaW50KTtcbiAgfVxuXG4gIGRldGFjaCgpOiB2b2lkIHtcbiAgICB0aGlzLl9jbGVhclBhbmVsQ2xhc3NlcygpO1xuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ID0gbnVsbDtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKiBDbGVhbnVwIGFmdGVyIHRoZSBlbGVtZW50IGdldHMgZGVzdHJveWVkLiAqL1xuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pc0Rpc3Bvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgY2FuJ3QgdXNlIGBfcmVzZXRCb3VuZGluZ0JveFN0eWxlc2AgaGVyZSwgYmVjYXVzZSBpdCByZXNldHNcbiAgICAvLyBzb21lIHByb3BlcnRpZXMgdG8gemVybywgcmF0aGVyIHRoYW4gcmVtb3ZpbmcgdGhlbS5cbiAgICBpZiAodGhpcy5fYm91bmRpbmdCb3gpIHtcbiAgICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveC5zdHlsZSwge1xuICAgICAgICB0b3A6ICcnLFxuICAgICAgICBsZWZ0OiAnJyxcbiAgICAgICAgcmlnaHQ6ICcnLFxuICAgICAgICBib3R0b206ICcnLFxuICAgICAgICBoZWlnaHQ6ICcnLFxuICAgICAgICB3aWR0aDogJycsXG4gICAgICAgIGFsaWduSXRlbXM6ICcnLFxuICAgICAgICBqdXN0aWZ5Q29udGVudDogJycsXG4gICAgICB9IGFzIENTU1N0eWxlRGVjbGFyYXRpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl9yZXNldE92ZXJsYXlFbGVtZW50U3R5bGVzKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuaG9zdEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShib3VuZGluZ0JveENsYXNzKTtcbiAgICB9XG5cbiAgICB0aGlzLmRldGFjaCgpO1xuICAgIHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX292ZXJsYXlSZWYgPSB0aGlzLl9ib3VuZGluZ0JveCA9IG51bGwhO1xuICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgcmUtYWxpZ25zIHRoZSBvdmVybGF5IGVsZW1lbnQgd2l0aCB0aGUgdHJpZ2dlciBpbiBpdHMgbGFzdCBjYWxjdWxhdGVkIHBvc2l0aW9uLFxuICAgKiBldmVuIGlmIGEgcG9zaXRpb24gaGlnaGVyIGluIHRoZSBcInByZWZlcnJlZCBwb3NpdGlvbnNcIiBsaXN0IHdvdWxkIG5vdyBmaXQuIFRoaXNcbiAgICogYWxsb3dzIG9uZSB0byByZS1hbGlnbiB0aGUgcGFuZWwgd2l0aG91dCBjaGFuZ2luZyB0aGUgb3JpZW50YXRpb24gb2YgdGhlIHBhbmVsLlxuICAgKi9cbiAgcmVhcHBseUxhc3RQb3NpdGlvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzRGlzcG9zZWQgJiYgKCF0aGlzLl9wbGF0Zm9ybSB8fCB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpKSB7XG4gICAgICB0aGlzLl9vcmlnaW5SZWN0ID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgICAgdGhpcy5fb3ZlcmxheVJlY3QgPSB0aGlzLl9wYW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgdGhpcy5fdmlld3BvcnRSZWN0ID0gdGhpcy5fZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTtcblxuICAgICAgY29uc3QgbGFzdFBvc2l0aW9uID0gdGhpcy5fbGFzdFBvc2l0aW9uIHx8IHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9uc1swXTtcbiAgICAgIGNvbnN0IG9yaWdpblBvaW50ID0gdGhpcy5fZ2V0T3JpZ2luUG9pbnQodGhpcy5fb3JpZ2luUmVjdCwgbGFzdFBvc2l0aW9uKTtcblxuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihsYXN0UG9zaXRpb24sIG9yaWdpblBvaW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbGlzdCBvZiBTY3JvbGxhYmxlIGNvbnRhaW5lcnMgdGhhdCBob3N0IHRoZSBvcmlnaW4gZWxlbWVudCBzbyB0aGF0XG4gICAqIG9uIHJlcG9zaXRpb24gd2UgY2FuIGV2YWx1YXRlIGlmIGl0IG9yIHRoZSBvdmVybGF5IGhhcyBiZWVuIGNsaXBwZWQgb3Igb3V0c2lkZSB2aWV3LiBFdmVyeVxuICAgKiBTY3JvbGxhYmxlIG11c3QgYmUgYW4gYW5jZXN0b3IgZWxlbWVudCBvZiB0aGUgc3RyYXRlZ3kncyBvcmlnaW4gZWxlbWVudC5cbiAgICovXG4gIHdpdGhTY3JvbGxhYmxlQ29udGFpbmVycyhzY3JvbGxhYmxlczogQ2RrU2Nyb2xsYWJsZVtdKTogdGhpcyB7XG4gICAgdGhpcy5fc2Nyb2xsYWJsZXMgPSBzY3JvbGxhYmxlcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5ldyBwcmVmZXJyZWQgcG9zaXRpb25zLlxuICAgKiBAcGFyYW0gcG9zaXRpb25zIExpc3Qgb2YgcG9zaXRpb25zIG9wdGlvbnMgZm9yIHRoaXMgb3ZlcmxheS5cbiAgICovXG4gIHdpdGhQb3NpdGlvbnMocG9zaXRpb25zOiBDb25uZWN0ZWRQb3NpdGlvbltdKTogdGhpcyB7XG4gICAgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zID0gcG9zaXRpb25zO1xuXG4gICAgLy8gSWYgdGhlIGxhc3QgY2FsY3VsYXRlZCBwb3NpdGlvbiBvYmplY3QgaXNuJ3QgcGFydCBvZiB0aGUgcG9zaXRpb25zIGFueW1vcmUsIGNsZWFyXG4gICAgLy8gaXQgaW4gb3JkZXIgdG8gYXZvaWQgaXQgYmVpbmcgcGlja2VkIHVwIGlmIHRoZSBjb25zdW1lciB0cmllcyB0byByZS1hcHBseS5cbiAgICBpZiAocG9zaXRpb25zLmluZGV4T2YodGhpcy5fbGFzdFBvc2l0aW9uISkgPT09IC0xKSB7XG4gICAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbGlkYXRlUG9zaXRpb25zKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbWluaW11bSBkaXN0YW5jZSB0aGUgb3ZlcmxheSBtYXkgYmUgcG9zaXRpb25lZCB0byB0aGUgZWRnZSBvZiB0aGUgdmlld3BvcnQuXG4gICAqIEBwYXJhbSBtYXJnaW4gUmVxdWlyZWQgbWFyZ2luIGJldHdlZW4gdGhlIG92ZXJsYXkgYW5kIHRoZSB2aWV3cG9ydCBlZGdlIGluIHBpeGVscy5cbiAgICovXG4gIHdpdGhWaWV3cG9ydE1hcmdpbihtYXJnaW46IG51bWJlcik6IHRoaXMge1xuICAgIHRoaXMuX3ZpZXdwb3J0TWFyZ2luID0gbWFyZ2luO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSdzIHdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGNvbnN0cmFpbmVkIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICB3aXRoRmxleGlibGVEaW1lbnNpb25zKGZsZXhpYmxlRGltZW5zaW9ucyA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMgPSBmbGV4aWJsZURpbWVuc2lvbnM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IGFmdGVyIHRoZSBpbml0aWFsIG9wZW4gdmlhIGZsZXhpYmxlIHdpZHRoL2hlaWdodC4gKi9cbiAgd2l0aEdyb3dBZnRlck9wZW4oZ3Jvd0FmdGVyT3BlbiA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9ncm93QWZ0ZXJPcGVuID0gZ3Jvd0FmdGVyT3BlbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gaWYgbm9uZSBvZiB0aGUgcHJvdmlkZWQgcG9zaXRpb25zIGZpdC4gKi9cbiAgd2l0aFB1c2goY2FuUHVzaCA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9jYW5QdXNoID0gY2FuUHVzaDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkncyBwb3NpdGlvbiBzaG91bGQgYmUgbG9ja2VkIGluIGFmdGVyIGl0IGlzIHBvc2l0aW9uZWRcbiAgICogaW5pdGlhbGx5LiBXaGVuIGFuIG92ZXJsYXkgaXMgbG9ja2VkIGluLCBpdCB3b24ndCBhdHRlbXB0IHRvIHJlcG9zaXRpb24gaXRzZWxmXG4gICAqIHdoZW4gdGhlIHBvc2l0aW9uIGlzIHJlLWFwcGxpZWQgKGUuZy4gd2hlbiB0aGUgdXNlciBzY3JvbGxzIGF3YXkpLlxuICAgKiBAcGFyYW0gaXNMb2NrZWQgV2hldGhlciB0aGUgb3ZlcmxheSBzaG91bGQgbG9ja2VkIGluLlxuICAgKi9cbiAgd2l0aExvY2tlZFBvc2l0aW9uKGlzTG9ja2VkID0gdHJ1ZSk6IHRoaXMge1xuICAgIHRoaXMuX3Bvc2l0aW9uTG9ja2VkID0gaXNMb2NrZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgb3JpZ2luLCByZWxhdGl2ZSB0byB3aGljaCB0byBwb3NpdGlvbiB0aGUgb3ZlcmxheS5cbiAgICogVXNpbmcgYW4gZWxlbWVudCBvcmlnaW4gaXMgdXNlZnVsIGZvciBidWlsZGluZyBjb21wb25lbnRzIHRoYXQgbmVlZCB0byBiZSBwb3NpdGlvbmVkXG4gICAqIHJlbGF0aXZlbHkgdG8gYSB0cmlnZ2VyIChlLmcuIGRyb3Bkb3duIG1lbnVzIG9yIHRvb2x0aXBzKSwgd2hlcmVhcyB1c2luZyBhIHBvaW50IGNhbiBiZVxuICAgKiB1c2VkIGZvciBjYXNlcyBsaWtlIGNvbnRleHR1YWwgbWVudXMgd2hpY2ggb3BlbiByZWxhdGl2ZSB0byB0aGUgdXNlcidzIHBvaW50ZXIuXG4gICAqIEBwYXJhbSBvcmlnaW4gUmVmZXJlbmNlIHRvIHRoZSBuZXcgb3JpZ2luLlxuICAgKi9cbiAgc2V0T3JpZ2luKG9yaWdpbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luKTogdGhpcyB7XG4gICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSdzIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHgtYXhpcy5cbiAgICogQHBhcmFtIG9mZnNldCBOZXcgb2Zmc2V0IGluIHRoZSBYIGF4aXMuXG4gICAqL1xuICB3aXRoRGVmYXVsdE9mZnNldFgob2Zmc2V0OiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9vZmZzZXRYID0gb2Zmc2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSdzIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHktYXhpcy5cbiAgICogQHBhcmFtIG9mZnNldCBOZXcgb2Zmc2V0IGluIHRoZSBZIGF4aXMuXG4gICAqL1xuICB3aXRoRGVmYXVsdE9mZnNldFkob2Zmc2V0OiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl9vZmZzZXRZID0gb2Zmc2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhhdCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgc2hvdWxkIHNldCBhIGB0cmFuc2Zvcm0tb3JpZ2luYCBvbiBzb21lIGVsZW1lbnRzXG4gICAqIGluc2lkZSB0aGUgb3ZlcmxheSwgZGVwZW5kaW5nIG9uIHRoZSBjdXJyZW50IHBvc2l0aW9uIHRoYXQgaXMgYmVpbmcgYXBwbGllZC4gVGhpcyBpc1xuICAgKiB1c2VmdWwgZm9yIHRoZSBjYXNlcyB3aGVyZSB0aGUgb3JpZ2luIG9mIGFuIGFuaW1hdGlvbiBjYW4gY2hhbmdlIGRlcGVuZGluZyBvbiB0aGVcbiAgICogYWxpZ25tZW50IG9mIHRoZSBvdmVybGF5LlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgQ1NTIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZpbmQgdGhlIHRhcmdldFxuICAgKiAgICBlbGVtZW50cyBvbnRvIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi5cbiAgICovXG4gIHdpdGhUcmFuc2Zvcm1PcmlnaW5PbihzZWxlY3Rvcjogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSAoeCwgeSkgY29vcmRpbmF0ZSBvZiBhIGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIG9yaWdpbiBiYXNlZCBvbiBhIHJlbGF0aXZlIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3JpZ2luUG9pbnQob3JpZ2luUmVjdDogQ2xpZW50UmVjdCwgcG9zOiBDb25uZWN0ZWRQb3NpdGlvbik6IFBvaW50IHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGlmIChwb3Mub3JpZ2luWCA9PSAnY2VudGVyJykge1xuICAgICAgLy8gTm90ZTogd2hlbiBjZW50ZXJpbmcgd2Ugc2hvdWxkIGFsd2F5cyB1c2UgdGhlIGBsZWZ0YFxuICAgICAgLy8gb2Zmc2V0LCBvdGhlcndpc2UgdGhlIHBvc2l0aW9uIHdpbGwgYmUgd3JvbmcgaW4gUlRMLlxuICAgICAgeCA9IG9yaWdpblJlY3QubGVmdCArIChvcmlnaW5SZWN0LndpZHRoIC8gMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YXJ0WCA9IHRoaXMuX2lzUnRsKCkgPyBvcmlnaW5SZWN0LnJpZ2h0IDogb3JpZ2luUmVjdC5sZWZ0O1xuICAgICAgY29uc3QgZW5kWCA9IHRoaXMuX2lzUnRsKCkgPyBvcmlnaW5SZWN0LmxlZnQgOiBvcmlnaW5SZWN0LnJpZ2h0O1xuICAgICAgeCA9IHBvcy5vcmlnaW5YID09ICdzdGFydCcgPyBzdGFydFggOiBlbmRYO1xuICAgIH1cblxuICAgIGxldCB5OiBudW1iZXI7XG4gICAgaWYgKHBvcy5vcmlnaW5ZID09ICdjZW50ZXInKSB7XG4gICAgICB5ID0gb3JpZ2luUmVjdC50b3AgKyAob3JpZ2luUmVjdC5oZWlnaHQgLyAyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeSA9IHBvcy5vcmlnaW5ZID09ICd0b3AnID8gb3JpZ2luUmVjdC50b3AgOiBvcmlnaW5SZWN0LmJvdHRvbTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3gsIHl9O1xuICB9XG5cblxuICAvKipcbiAgICogR2V0cyB0aGUgKHgsIHkpIGNvb3JkaW5hdGUgb2YgdGhlIHRvcC1sZWZ0IGNvcm5lciBvZiB0aGUgb3ZlcmxheSBnaXZlbiBhIGdpdmVuIHBvc2l0aW9uIGFuZFxuICAgKiBvcmlnaW4gcG9pbnQgdG8gd2hpY2ggdGhlIG92ZXJsYXkgc2hvdWxkIGJlIGNvbm5lY3RlZC5cbiAgICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlQb2ludChcbiAgICAgIG9yaWdpblBvaW50OiBQb2ludCxcbiAgICAgIG92ZXJsYXlSZWN0OiBDbGllbnRSZWN0LFxuICAgICAgcG9zOiBDb25uZWN0ZWRQb3NpdGlvbik6IFBvaW50IHtcblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgKG92ZXJsYXlTdGFydFgsIG92ZXJsYXlTdGFydFkpLCB0aGUgc3RhcnQgb2YgdGhlXG4gICAgLy8gcG90ZW50aWFsIG92ZXJsYXkgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIG9yaWdpbiBwb2ludC5cbiAgICBsZXQgb3ZlcmxheVN0YXJ0WDogbnVtYmVyO1xuICAgIGlmIChwb3Mub3ZlcmxheVggPT0gJ2NlbnRlcicpIHtcbiAgICAgIG92ZXJsYXlTdGFydFggPSAtb3ZlcmxheVJlY3Qud2lkdGggLyAyO1xuICAgIH0gZWxzZSBpZiAocG9zLm92ZXJsYXlYID09PSAnc3RhcnQnKSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IC1vdmVybGF5UmVjdC53aWR0aCA6IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJsYXlTdGFydFggPSB0aGlzLl9pc1J0bCgpID8gMCA6IC1vdmVybGF5UmVjdC53aWR0aDtcbiAgICB9XG5cbiAgICBsZXQgb3ZlcmxheVN0YXJ0WTogbnVtYmVyO1xuICAgIGlmIChwb3Mub3ZlcmxheVkgPT0gJ2NlbnRlcicpIHtcbiAgICAgIG92ZXJsYXlTdGFydFkgPSAtb3ZlcmxheVJlY3QuaGVpZ2h0IC8gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgb3ZlcmxheVN0YXJ0WSA9IHBvcy5vdmVybGF5WSA9PSAndG9wJyA/IDAgOiAtb3ZlcmxheVJlY3QuaGVpZ2h0O1xuICAgIH1cblxuICAgIC8vIFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXkuXG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9yaWdpblBvaW50LnggKyBvdmVybGF5U3RhcnRYLFxuICAgICAgeTogb3JpZ2luUG9pbnQueSArIG92ZXJsYXlTdGFydFksXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBHZXRzIGhvdyB3ZWxsIGFuIG92ZXJsYXkgYXQgdGhlIGdpdmVuIHBvaW50IHdpbGwgZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlGaXQocG9pbnQ6IFBvaW50LCBvdmVybGF5OiBDbGllbnRSZWN0LCB2aWV3cG9ydDogQ2xpZW50UmVjdCxcbiAgICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiBPdmVybGF5Rml0IHtcblxuICAgIGxldCB7eCwgeX0gPSBwb2ludDtcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIC8vIEFjY291bnQgZm9yIHRoZSBvZmZzZXRzIHNpbmNlIHRoZXkgY291bGQgcHVzaCB0aGUgb3ZlcmxheSBvdXQgb2YgdGhlIHZpZXdwb3J0LlxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB4ICs9IG9mZnNldFg7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldFkpIHtcbiAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvLyBIb3cgbXVjaCB0aGUgb3ZlcmxheSB3b3VsZCBvdmVyZmxvdyBhdCB0aGlzIHBvc2l0aW9uLCBvbiBlYWNoIHNpZGUuXG4gICAgbGV0IGxlZnRPdmVyZmxvdyA9IDAgLSB4O1xuICAgIGxldCByaWdodE92ZXJmbG93ID0gKHggKyBvdmVybGF5LndpZHRoKSAtIHZpZXdwb3J0LndpZHRoO1xuICAgIGxldCB0b3BPdmVyZmxvdyA9IDAgLSB5O1xuICAgIGxldCBib3R0b21PdmVyZmxvdyA9ICh5ICsgb3ZlcmxheS5oZWlnaHQpIC0gdmlld3BvcnQuaGVpZ2h0O1xuXG4gICAgLy8gVmlzaWJsZSBwYXJ0cyBvZiB0aGUgZWxlbWVudCBvbiBlYWNoIGF4aXMuXG4gICAgbGV0IHZpc2libGVXaWR0aCA9IHRoaXMuX3N1YnRyYWN0T3ZlcmZsb3dzKG92ZXJsYXkud2lkdGgsIGxlZnRPdmVyZmxvdywgcmlnaHRPdmVyZmxvdyk7XG4gICAgbGV0IHZpc2libGVIZWlnaHQgPSB0aGlzLl9zdWJ0cmFjdE92ZXJmbG93cyhvdmVybGF5LmhlaWdodCwgdG9wT3ZlcmZsb3csIGJvdHRvbU92ZXJmbG93KTtcbiAgICBsZXQgdmlzaWJsZUFyZWEgPSB2aXNpYmxlV2lkdGggKiB2aXNpYmxlSGVpZ2h0O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZpc2libGVBcmVhLFxuICAgICAgaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQ6IChvdmVybGF5LndpZHRoICogb3ZlcmxheS5oZWlnaHQpID09PSB2aXNpYmxlQXJlYSxcbiAgICAgIGZpdHNJblZpZXdwb3J0VmVydGljYWxseTogdmlzaWJsZUhlaWdodCA9PT0gb3ZlcmxheS5oZWlnaHQsXG4gICAgICBmaXRzSW5WaWV3cG9ydEhvcml6b250YWxseTogdmlzaWJsZVdpZHRoID09IG92ZXJsYXkud2lkdGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydCB3aGVuIGl0IG1heSByZXNpemUgZWl0aGVyIGl0cyB3aWR0aCBvciBoZWlnaHQuXG4gICAqIEBwYXJhbSBmaXQgSG93IHdlbGwgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvaW50IFRoZSAoeCwgeSkgY29vcmRpbmF0ZXMgb2YgdGhlIG92ZXJsYXQgYXQgc29tZSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHZpZXdwb3J0IFRoZSBnZW9tZXRyeSBvZiB0aGUgdmlld3BvcnQuXG4gICAqL1xuICBwcml2YXRlIF9jYW5GaXRXaXRoRmxleGlibGVEaW1lbnNpb25zKGZpdDogT3ZlcmxheUZpdCwgcG9pbnQ6IFBvaW50LCB2aWV3cG9ydDogQ2xpZW50UmVjdCkge1xuICAgIGlmICh0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IHZpZXdwb3J0LmJvdHRvbSAtIHBvaW50Lnk7XG4gICAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gcG9pbnQueDtcbiAgICAgIGNvbnN0IG1pbkhlaWdodCA9IGdldFBpeGVsVmFsdWUodGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5taW5IZWlnaHQpO1xuICAgICAgY29uc3QgbWluV2lkdGggPSBnZXRQaXhlbFZhbHVlKHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWluV2lkdGgpO1xuXG4gICAgICBjb25zdCB2ZXJ0aWNhbEZpdCA9IGZpdC5maXRzSW5WaWV3cG9ydFZlcnRpY2FsbHkgfHxcbiAgICAgICAgICAobWluSGVpZ2h0ICE9IG51bGwgJiYgbWluSGVpZ2h0IDw9IGF2YWlsYWJsZUhlaWdodCk7XG4gICAgICBjb25zdCBob3Jpem9udGFsRml0ID0gZml0LmZpdHNJblZpZXdwb3J0SG9yaXpvbnRhbGx5IHx8XG4gICAgICAgICAgKG1pbldpZHRoICE9IG51bGwgJiYgbWluV2lkdGggPD0gYXZhaWxhYmxlV2lkdGgpO1xuXG4gICAgICByZXR1cm4gdmVydGljYWxGaXQgJiYgaG9yaXpvbnRhbEZpdDtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBvaW50IGF0IHdoaWNoIHRoZSBvdmVybGF5IGNhbiBiZSBcInB1c2hlZFwiIG9uLXNjcmVlbi4gSWYgdGhlIG92ZXJsYXkgaXMgbGFyZ2VyIHRoYW5cbiAgICogdGhlIHZpZXdwb3J0LCB0aGUgdG9wLWxlZnQgY29ybmVyIHdpbGwgYmUgcHVzaGVkIG9uLXNjcmVlbiAod2l0aCBvdmVyZmxvdyBvY2N1cmluZyBvbiB0aGVcbiAgICogcmlnaHQgYW5kIGJvdHRvbSkuXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydCBTdGFydGluZyBwb2ludCBmcm9tIHdoaWNoIHRoZSBvdmVybGF5IGlzIHB1c2hlZC5cbiAgICogQHBhcmFtIG92ZXJsYXkgRGltZW5zaW9ucyBvZiB0aGUgb3ZlcmxheS5cbiAgICogQHBhcmFtIHNjcm9sbFBvc2l0aW9uIEN1cnJlbnQgdmlld3BvcnQgc2Nyb2xsIHBvc2l0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgcG9pbnQgYXQgd2hpY2ggdG8gcG9zaXRpb24gdGhlIG92ZXJsYXkgYWZ0ZXIgcHVzaGluZy4gVGhpcyBpcyBlZmZlY3RpdmVseSBhIG5ld1xuICAgKiAgICAgb3JpZ2luUG9pbnQuXG4gICAqL1xuICBwcml2YXRlIF9wdXNoT3ZlcmxheU9uU2NyZWVuKHN0YXJ0OiBQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdmVybGF5OiBDbGllbnRSZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKTogUG9pbnQge1xuICAgIC8vIElmIHRoZSBwb3NpdGlvbiBpcyBsb2NrZWQgYW5kIHdlJ3ZlIHB1c2hlZCB0aGUgb3ZlcmxheSBhbHJlYWR5LCByZXVzZSB0aGUgcHJldmlvdXMgcHVzaFxuICAgIC8vIGFtb3VudCwgcmF0aGVyIHRoYW4gcHVzaGluZyBpdCBhZ2Fpbi4gSWYgd2Ugd2VyZSB0byBjb250aW51ZSBwdXNoaW5nLCB0aGUgZWxlbWVudCB3b3VsZFxuICAgIC8vIHJlbWFpbiBpbiB0aGUgdmlld3BvcnQsIHdoaWNoIGdvZXMgYWdhaW5zdCB0aGUgZXhwZWN0YXRpb25zIHdoZW4gcG9zaXRpb24gbG9ja2luZyBpcyBlbmFibGVkLlxuICAgIGlmICh0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQgJiYgdGhpcy5fcG9zaXRpb25Mb2NrZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHN0YXJ0LnggKyB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQueCxcbiAgICAgICAgeTogc3RhcnQueSArIHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudC55XG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuXG4gICAgLy8gRGV0ZXJtaW5lIGhvdyBtdWNoIHRoZSBvdmVybGF5IGdvZXMgb3V0c2lkZSB0aGUgdmlld3BvcnQgb24gZWFjaFxuICAgIC8vIHNpZGUsIHdoaWNoIHdlJ2xsIHVzZSB0byBkZWNpZGUgd2hpY2ggZGlyZWN0aW9uIHRvIHB1c2ggaXQuXG4gICAgY29uc3Qgb3ZlcmZsb3dSaWdodCA9IE1hdGgubWF4KHN0YXJ0LnggKyBvdmVybGF5LndpZHRoIC0gdmlld3BvcnQucmlnaHQsIDApO1xuICAgIGNvbnN0IG92ZXJmbG93Qm90dG9tID0gTWF0aC5tYXgoc3RhcnQueSArIG92ZXJsYXkuaGVpZ2h0IC0gdmlld3BvcnQuYm90dG9tLCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd1RvcCA9IE1hdGgubWF4KHZpZXdwb3J0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcCAtIHN0YXJ0LnksIDApO1xuICAgIGNvbnN0IG92ZXJmbG93TGVmdCA9IE1hdGgubWF4KHZpZXdwb3J0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0IC0gc3RhcnQueCwgMCk7XG5cbiAgICAvLyBBbW91bnQgYnkgd2hpY2ggdG8gcHVzaCB0aGUgb3ZlcmxheSBpbiBlYWNoIGF4aXMgc3VjaCB0aGF0IGl0IHJlbWFpbnMgb24tc2NyZWVuLlxuICAgIGxldCBwdXNoWCA9IDA7XG4gICAgbGV0IHB1c2hZID0gMDtcblxuICAgIC8vIElmIHRoZSBvdmVybGF5IGZpdHMgY29tcGxldGVseSB3aXRoaW4gdGhlIGJvdW5kcyBvZiB0aGUgdmlld3BvcnQsIHB1c2ggaXQgZnJvbSB3aGljaGV2ZXJcbiAgICAvLyBkaXJlY3Rpb24gaXMgZ29lcyBvZmYtc2NyZWVuLiBPdGhlcndpc2UsIHB1c2ggdGhlIHRvcC1sZWZ0IGNvcm5lciBzdWNoIHRoYXQgaXRzIGluIHRoZVxuICAgIC8vIHZpZXdwb3J0IGFuZCBhbGxvdyBmb3IgdGhlIHRyYWlsaW5nIGVuZCBvZiB0aGUgb3ZlcmxheSB0byBnbyBvdXQgb2YgYm91bmRzLlxuICAgIGlmIChvdmVybGF5LndpZHRoIDw9IHZpZXdwb3J0LndpZHRoKSB7XG4gICAgICBwdXNoWCA9IG92ZXJmbG93TGVmdCB8fCAtb3ZlcmZsb3dSaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHVzaFggPSBzdGFydC54IDwgdGhpcy5fdmlld3BvcnRNYXJnaW4gPyAodmlld3BvcnQubGVmdCAtIHNjcm9sbFBvc2l0aW9uLmxlZnQpIC0gc3RhcnQueCA6IDA7XG4gICAgfVxuXG4gICAgaWYgKG92ZXJsYXkuaGVpZ2h0IDw9IHZpZXdwb3J0LmhlaWdodCkge1xuICAgICAgcHVzaFkgPSBvdmVyZmxvd1RvcCB8fCAtb3ZlcmZsb3dCb3R0b207XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hZID0gc3RhcnQueSA8IHRoaXMuX3ZpZXdwb3J0TWFyZ2luID8gKHZpZXdwb3J0LnRvcCAtIHNjcm9sbFBvc2l0aW9uLnRvcCkgLSBzdGFydC55IDogMDtcbiAgICB9XG5cbiAgICB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQgPSB7eDogcHVzaFgsIHk6IHB1c2hZfTtcblxuICAgIHJldHVybiB7XG4gICAgICB4OiBzdGFydC54ICsgcHVzaFgsXG4gICAgICB5OiBzdGFydC55ICsgcHVzaFksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGEgY29tcHV0ZWQgcG9zaXRpb24gdG8gdGhlIG92ZXJsYXkgYW5kIGVtaXRzIGEgcG9zaXRpb24gY2hhbmdlLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIHByZWZlcmVuY2VcbiAgICogQHBhcmFtIG9yaWdpblBvaW50IFRoZSBwb2ludCBvbiB0aGUgb3JpZ2luIGVsZW1lbnQgd2hlcmUgdGhlIG92ZXJsYXkgaXMgY29ubmVjdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbHlQb3NpdGlvbihwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sIG9yaWdpblBvaW50OiBQb2ludCkge1xuICAgIHRoaXMuX3NldFRyYW5zZm9ybU9yaWdpbihwb3NpdGlvbik7XG4gICAgdGhpcy5fc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMob3JpZ2luUG9pbnQsIHBvc2l0aW9uKTtcbiAgICB0aGlzLl9zZXRCb3VuZGluZ0JveFN0eWxlcyhvcmlnaW5Qb2ludCwgcG9zaXRpb24pO1xuXG4gICAgaWYgKHBvc2l0aW9uLnBhbmVsQ2xhc3MpIHtcbiAgICAgIHRoaXMuX2FkZFBhbmVsQ2xhc3Nlcyhwb3NpdGlvbi5wYW5lbENsYXNzKTtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHRoZSBsYXN0IGNvbm5lY3RlZCBwb3NpdGlvbiBpbiBjYXNlIHRoZSBwb3NpdGlvbiBuZWVkcyB0byBiZSByZS1jYWxjdWxhdGVkLlxuICAgIHRoaXMuX2xhc3RQb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG4gICAgLy8gTm90aWZ5IHRoYXQgdGhlIHBvc2l0aW9uIGhhcyBiZWVuIGNoYW5nZWQgYWxvbmcgd2l0aCBpdHMgY2hhbmdlIHByb3BlcnRpZXMuXG4gICAgLy8gV2Ugb25seSBlbWl0IGlmIHdlJ3ZlIGdvdCBhbnkgc3Vic2NyaXB0aW9ucywgYmVjYXVzZSB0aGUgc2Nyb2xsIHZpc2liaWxpdHlcbiAgICAvLyBjYWxjdWxjYXRpb25zIGNhbiBiZSBzb21ld2hhdCBleHBlbnNpdmUuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uQ2hhbmdlcy5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzY3JvbGxhYmxlVmlld1Byb3BlcnRpZXMgPSB0aGlzLl9nZXRTY3JvbGxWaXNpYmlsaXR5KCk7XG4gICAgICBjb25zdCBjaGFuZ2VFdmVudCA9IG5ldyBDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2UocG9zaXRpb24sIHNjcm9sbGFibGVWaWV3UHJvcGVydGllcyk7XG4gICAgICB0aGlzLl9wb3NpdGlvbkNoYW5nZXMubmV4dChjaGFuZ2VFdmVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5faXNJbml0aWFsUmVuZGVyID0gZmFsc2U7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgdHJhbnNmb3JtIG9yaWdpbiBiYXNlZCBvbiB0aGUgY29uZmlndXJlZCBzZWxlY3RvciBhbmQgdGhlIHBhc3NlZC1pbiBwb3NpdGlvbi4gICovXG4gIHByaXZhdGUgX3NldFRyYW5zZm9ybU9yaWdpbihwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pIHtcbiAgICBpZiAoIXRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgdGhpcy5fYm91bmRpbmdCb3ghLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5fdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpO1xuICAgIGxldCB4T3JpZ2luOiAnbGVmdCcgfCAncmlnaHQnIHwgJ2NlbnRlcic7XG4gICAgbGV0IHlPcmlnaW46ICd0b3AnIHwgJ2JvdHRvbScgfCAnY2VudGVyJyA9IHBvc2l0aW9uLm92ZXJsYXlZO1xuXG4gICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnY2VudGVyJykge1xuICAgICAgeE9yaWdpbiA9ICdjZW50ZXInO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faXNSdGwoKSkge1xuICAgICAgeE9yaWdpbiA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICB9IGVsc2Uge1xuICAgICAgeE9yaWdpbiA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlbGVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSBgJHt4T3JpZ2lufSAke3lPcmlnaW59YDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIG92ZXJsYXkncyBzaXppbmcgY29udGFpbmVyLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBkb2VzIG5vIG1lYXN1cmluZyBhbmQgYXBwbGllcyBubyBzdHlsZXMgc28gdGhhdCB3ZSBjYW4gY2hlYXBseSBjb21wdXRlIHRoZVxuICAgKiBib3VuZHMgZm9yIGFsbCBwb3NpdGlvbnMgYW5kIGNob29zZSB0aGUgYmVzdCBmaXQgYmFzZWQgb24gdGhlc2UgcmVzdWx0cy5cbiAgICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZUJvdW5kaW5nQm94UmVjdChvcmlnaW46IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiBCb3VuZGluZ0JveFJlY3Qge1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy5fdmlld3BvcnRSZWN0O1xuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5faXNSdGwoKTtcbiAgICBsZXQgaGVpZ2h0OiBudW1iZXIsIHRvcDogbnVtYmVyLCBib3R0b206IG51bWJlcjtcblxuICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ3RvcCcpIHtcbiAgICAgIC8vIE92ZXJsYXkgaXMgb3BlbmluZyBcImRvd253YXJkXCIgYW5kIHRodXMgaXMgYm91bmQgYnkgdGhlIGJvdHRvbSB2aWV3cG9ydCBlZGdlLlxuICAgICAgdG9wID0gb3JpZ2luLnk7XG4gICAgICBoZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQgLSB0b3AgKyB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAnYm90dG9tJykge1xuICAgICAgLy8gT3ZlcmxheSBpcyBvcGVuaW5nIFwidXB3YXJkXCIgYW5kIHRodXMgaXMgYm91bmQgYnkgdGhlIHRvcCB2aWV3cG9ydCBlZGdlLiBXZSBuZWVkIHRvIGFkZFxuICAgICAgLy8gdGhlIHZpZXdwb3J0IG1hcmdpbiBiYWNrIGluLCBiZWNhdXNlIHRoZSB2aWV3cG9ydCByZWN0IGlzIG5hcnJvd2VkIGRvd24gdG8gcmVtb3ZlIHRoZVxuICAgICAgLy8gbWFyZ2luLCB3aGVyZWFzIHRoZSBgb3JpZ2luYCBwb3NpdGlvbiBpcyBjYWxjdWxhdGVkIGJhc2VkIG9uIGl0cyBgQ2xpZW50UmVjdGAuXG4gICAgICBib3R0b20gPSB2aWV3cG9ydC5oZWlnaHQgLSBvcmlnaW4ueSArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luICogMjtcbiAgICAgIGhlaWdodCA9IHZpZXdwb3J0LmhlaWdodCAtIGJvdHRvbSArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBuZWl0aGVyIHRvcCBub3IgYm90dG9tLCBpdCBtZWFucyB0aGF0IHRoZSBvdmVybGF5IGlzIHZlcnRpY2FsbHkgY2VudGVyZWQgb24gdGhlXG4gICAgICAvLyBvcmlnaW4gcG9pbnQuIE5vdGUgdGhhdCB3ZSB3YW50IHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQsIHJhdGhlciB0aGFuXG4gICAgICAvLyB0aGUgcGFnZSwgd2hpY2ggaXMgd2h5IHdlIGRvbid0IHVzZSBzb21ldGhpbmcgbGlrZSBgdmlld3BvcnQuYm90dG9tIC0gb3JpZ2luLnlgIGFuZFxuICAgICAgLy8gYG9yaWdpbi55IC0gdmlld3BvcnQudG9wYC5cbiAgICAgIGNvbnN0IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSA9XG4gICAgICAgICAgTWF0aC5taW4odmlld3BvcnQuYm90dG9tIC0gb3JpZ2luLnkgKyB2aWV3cG9ydC50b3AsIG9yaWdpbi55KTtcblxuICAgICAgY29uc3QgcHJldmlvdXNIZWlnaHQgPSB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLmhlaWdodDtcblxuICAgICAgaGVpZ2h0ID0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlICogMjtcbiAgICAgIHRvcCA9IG9yaWdpbi55IC0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlO1xuXG4gICAgICBpZiAoaGVpZ2h0ID4gcHJldmlvdXNIZWlnaHQgJiYgIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiAhdGhpcy5fZ3Jvd0FmdGVyT3Blbikge1xuICAgICAgICB0b3AgPSBvcmlnaW4ueSAtIChwcmV2aW91c0hlaWdodCAvIDIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBvdmVybGF5IGlzIG9wZW5pbmcgJ3JpZ2h0LXdhcmQnICh0aGUgY29udGVudCBmbG93cyB0byB0aGUgcmlnaHQpLlxuICAgIGNvbnN0IGlzQm91bmRlZEJ5UmlnaHRWaWV3cG9ydEVkZ2UgPVxuICAgICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgJiYgIWlzUnRsKSB8fFxuICAgICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnICYmIGlzUnRsKTtcblxuICAgIC8vIFRoZSBvdmVybGF5IGlzIG9wZW5pbmcgJ2xlZnQtd2FyZCcgKHRoZSBjb250ZW50IGZsb3dzIHRvIHRoZSBsZWZ0KS5cbiAgICBjb25zdCBpc0JvdW5kZWRCeUxlZnRWaWV3cG9ydEVkZ2UgPVxuICAgICAgICAocG9zaXRpb24ub3ZlcmxheVggPT09ICdlbmQnICYmICFpc1J0bCkgfHxcbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnICYmIGlzUnRsKTtcblxuICAgIGxldCB3aWR0aDogbnVtYmVyLCBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXI7XG5cbiAgICBpZiAoaXNCb3VuZGVkQnlMZWZ0Vmlld3BvcnRFZGdlKSB7XG4gICAgICByaWdodCA9IHZpZXdwb3J0LndpZHRoIC0gb3JpZ2luLnggKyB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICAgIHdpZHRoID0gb3JpZ2luLnggLSB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICB9IGVsc2UgaWYgKGlzQm91bmRlZEJ5UmlnaHRWaWV3cG9ydEVkZ2UpIHtcbiAgICAgIGxlZnQgPSBvcmlnaW4ueDtcbiAgICAgIHdpZHRoID0gdmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgbmVpdGhlciBzdGFydCBub3IgZW5kLCBpdCBtZWFucyB0aGF0IHRoZSBvdmVybGF5IGlzIGhvcml6b250YWxseSBjZW50ZXJlZCBvbiB0aGVcbiAgICAgIC8vIG9yaWdpbiBwb2ludC4gTm90ZSB0aGF0IHdlIHdhbnQgdGhlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCwgcmF0aGVyIHRoYW5cbiAgICAgIC8vIHRoZSBwYWdlLCB3aGljaCBpcyB3aHkgd2UgZG9uJ3QgdXNlIHNvbWV0aGluZyBsaWtlIGB2aWV3cG9ydC5yaWdodCAtIG9yaWdpbi54YCBhbmRcbiAgICAgIC8vIGBvcmlnaW4ueCAtIHZpZXdwb3J0LmxlZnRgLlxuICAgICAgY29uc3Qgc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlID1cbiAgICAgICAgICBNYXRoLm1pbih2aWV3cG9ydC5yaWdodCAtIG9yaWdpbi54ICsgdmlld3BvcnQubGVmdCwgb3JpZ2luLngpO1xuICAgICAgY29uc3QgcHJldmlvdXNXaWR0aCA9IHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUud2lkdGg7XG5cbiAgICAgIHdpZHRoID0gc21hbGxlc3REaXN0YW5jZVRvVmlld3BvcnRFZGdlICogMjtcbiAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKHdpZHRoID4gcHJldmlvdXNXaWR0aCAmJiAhdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICAgIGxlZnQgPSBvcmlnaW4ueCAtIChwcmV2aW91c1dpZHRoIC8gMik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt0b3A6IHRvcCEsIGxlZnQ6IGxlZnQhLCBib3R0b206IGJvdHRvbSEsIHJpZ2h0OiByaWdodCEsIHdpZHRoLCBoZWlnaHR9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBvdmVybGF5J3Mgc2l6aW5nIHdyYXBwZXIuIFRoZSB3cmFwcGVyIGlzIHBvc2l0aW9uZWQgb24gdGhlXG4gICAqIG9yaWdpbidzIGNvbm5lY3Rpb24gcG9pbnQgYW5kIHN0ZXRjaGVzIHRvIHRoZSBib3VuZHMgb2YgdGhlIHZpZXdwb3J0LlxuICAgKlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBwb2ludCBvbiB0aGUgb3JpZ2luIGVsZW1lbnQgd2hlcmUgdGhlIG92ZXJsYXkgaXMgY29ubmVjdGVkLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIHByZWZlcmVuY2VcbiAgICovXG4gIHByaXZhdGUgX3NldEJvdW5kaW5nQm94U3R5bGVzKG9yaWdpbjogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IGJvdW5kaW5nQm94UmVjdCA9IHRoaXMuX2NhbGN1bGF0ZUJvdW5kaW5nQm94UmVjdChvcmlnaW4sIHBvc2l0aW9uKTtcblxuICAgIC8vIEl0J3Mgd2VpcmQgaWYgdGhlIG92ZXJsYXkgKmdyb3dzKiB3aGlsZSBzY3JvbGxpbmcsIHNvIHdlIHRha2UgdGhlIGxhc3Qgc2l6ZSBpbnRvIGFjY291bnRcbiAgICAvLyB3aGVuIGFwcGx5aW5nIGEgbmV3IHNpemUuXG4gICAgaWYgKCF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgIXRoaXMuX2dyb3dBZnRlck9wZW4pIHtcbiAgICAgIGJvdW5kaW5nQm94UmVjdC5oZWlnaHQgPSBNYXRoLm1pbihib3VuZGluZ0JveFJlY3QuaGVpZ2h0LCB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLmhlaWdodCk7XG4gICAgICBib3VuZGluZ0JveFJlY3Qud2lkdGggPSBNYXRoLm1pbihib3VuZGluZ0JveFJlY3Qud2lkdGgsIHRoaXMuX2xhc3RCb3VuZGluZ0JveFNpemUud2lkdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlcyA9IHt9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG5cbiAgICBpZiAodGhpcy5faGFzRXhhY3RQb3NpdGlvbigpKSB7XG4gICAgICBzdHlsZXMudG9wID0gc3R5bGVzLmxlZnQgPSAnMCc7XG4gICAgICBzdHlsZXMuYm90dG9tID0gc3R5bGVzLnJpZ2h0ID0gc3R5bGVzLm1heEhlaWdodCA9IHN0eWxlcy5tYXhXaWR0aCA9ICcnO1xuICAgICAgc3R5bGVzLndpZHRoID0gc3R5bGVzLmhlaWdodCA9ICcxMDAlJztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5tYXhIZWlnaHQ7XG4gICAgICBjb25zdCBtYXhXaWR0aCA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWF4V2lkdGg7XG5cbiAgICAgIHN0eWxlcy5oZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5oZWlnaHQpO1xuICAgICAgc3R5bGVzLnRvcCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LnRvcCk7XG4gICAgICBzdHlsZXMuYm90dG9tID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QuYm90dG9tKTtcbiAgICAgIHN0eWxlcy53aWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LndpZHRoKTtcbiAgICAgIHN0eWxlcy5sZWZ0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QubGVmdCk7XG4gICAgICBzdHlsZXMucmlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5yaWdodCk7XG5cbiAgICAgIC8vIFB1c2ggdGhlIHBhbmUgY29udGVudCB0b3dhcmRzIHRoZSBwcm9wZXIgZGlyZWN0aW9uLlxuICAgICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnY2VudGVyJykge1xuICAgICAgICBzdHlsZXMuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVzLmFsaWduSXRlbXMgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAnZmxleC1lbmQnIDogJ2ZsZXgtc3RhcnQnO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdjZW50ZXInKSB7XG4gICAgICAgIHN0eWxlcy5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVzLmp1c3RpZnlDb250ZW50ID0gcG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nID8gJ2ZsZXgtZW5kJyA6ICdmbGV4LXN0YXJ0JztcbiAgICAgIH1cblxuICAgICAgaWYgKG1heEhlaWdodCkge1xuICAgICAgICBzdHlsZXMubWF4SGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShtYXhIZWlnaHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF4V2lkdGgpIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShtYXhXaWR0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZSA9IGJvdW5kaW5nQm94UmVjdDtcblxuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveCEuc3R5bGUsIHN0eWxlcyk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdHlsZXMgZm9yIHRoZSBib3VuZGluZyBib3ggc28gdGhhdCBhIG5ldyBwb3NpdGlvbmluZyBjYW4gYmUgY29tcHV0ZWQuICovXG4gIHByaXZhdGUgX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXMoKSB7XG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX2JvdW5kaW5nQm94IS5zdHlsZSwge1xuICAgICAgdG9wOiAnMCcsXG4gICAgICBsZWZ0OiAnMCcsXG4gICAgICByaWdodDogJzAnLFxuICAgICAgYm90dG9tOiAnMCcsXG4gICAgICBoZWlnaHQ6ICcnLFxuICAgICAgd2lkdGg6ICcnLFxuICAgICAgYWxpZ25JdGVtczogJycsXG4gICAgICBqdXN0aWZ5Q29udGVudDogJycsXG4gICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0eWxlcyBmb3IgdGhlIG92ZXJsYXkgcGFuZSBzbyB0aGF0IGEgbmV3IHBvc2l0aW9uaW5nIGNhbiBiZSBjb21wdXRlZC4gKi9cbiAgcHJpdmF0ZSBfcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpIHtcbiAgICBleHRlbmRTdHlsZXModGhpcy5fcGFuZS5zdHlsZSwge1xuICAgICAgdG9wOiAnJyxcbiAgICAgIGxlZnQ6ICcnLFxuICAgICAgYm90dG9tOiAnJyxcbiAgICAgIHJpZ2h0OiAnJyxcbiAgICAgIHBvc2l0aW9uOiAnJyxcbiAgICAgIHRyYW5zZm9ybTogJycsXG4gICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHBvc2l0aW9uaW5nIHN0eWxlcyB0byB0aGUgb3ZlcmxheSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zZXRPdmVybGF5RWxlbWVudFN0eWxlcyhvcmlnaW5Qb2ludDogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IHN0eWxlcyA9IHt9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgY29uc3QgaGFzRXhhY3RQb3NpdGlvbiA9IHRoaXMuX2hhc0V4YWN0UG9zaXRpb24oKTtcbiAgICBjb25zdCBoYXNGbGV4aWJsZURpbWVuc2lvbnMgPSB0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnM7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKTtcblxuICAgIGlmIChoYXNFeGFjdFBvc2l0aW9uKSB7XG4gICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgZXh0ZW5kU3R5bGVzKHN0eWxlcywgdGhpcy5fZ2V0RXhhY3RPdmVybGF5WShwb3NpdGlvbiwgb3JpZ2luUG9pbnQsIHNjcm9sbFBvc2l0aW9uKSk7XG4gICAgICBleHRlbmRTdHlsZXMoc3R5bGVzLCB0aGlzLl9nZXRFeGFjdE92ZXJsYXlYKHBvc2l0aW9uLCBvcmlnaW5Qb2ludCwgc2Nyb2xsUG9zaXRpb24pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLnBvc2l0aW9uID0gJ3N0YXRpYyc7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgdHJhbnNmb3JtIHRvIGFwcGx5IHRoZSBvZmZzZXRzLiBXZSBkbyB0aGlzIGJlY2F1c2UgdGhlIGBjZW50ZXJgIHBvc2l0aW9ucyByZWx5IG9uXG4gICAgLy8gYmVpbmcgaW4gdGhlIG5vcm1hbCBmbGV4IGZsb3cgYW5kIHNldHRpbmcgYSBgdG9wYCAvIGBsZWZ0YCBhdCBhbGwgd2lsbCBjb21wbGV0ZWx5IHRocm93XG4gICAgLy8gb2ZmIHRoZSBwb3NpdGlvbi4gV2UgYWxzbyBjYW4ndCB1c2UgbWFyZ2lucywgYmVjYXVzZSB0aGV5IHdvbid0IGhhdmUgYW4gZWZmZWN0IGluIHNvbWVcbiAgICAvLyBjYXNlcyB3aGVyZSB0aGUgZWxlbWVudCBkb2Vzbid0IGhhdmUgYW55dGhpbmcgdG8gXCJwdXNoIG9mZiBvZlwiLiBGaW5hbGx5LCB0aGlzIHdvcmtzXG4gICAgLy8gYmV0dGVyIGJvdGggd2l0aCBmbGV4aWJsZSBhbmQgbm9uLWZsZXhpYmxlIHBvc2l0aW9uaW5nLlxuICAgIGxldCB0cmFuc2Zvcm1TdHJpbmcgPSAnJztcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gYHRyYW5zbGF0ZVgoJHtvZmZzZXRYfXB4KSBgO1xuICAgIH1cblxuICAgIGlmIChvZmZzZXRZKSB7XG4gICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gYHRyYW5zbGF0ZVkoJHtvZmZzZXRZfXB4KWA7XG4gICAgfVxuXG4gICAgc3R5bGVzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybVN0cmluZy50cmltKCk7XG5cbiAgICAvLyBJZiBhIG1heFdpZHRoIG9yIG1heEhlaWdodCBpcyBzcGVjaWZpZWQgb24gdGhlIG92ZXJsYXksIHdlIHJlbW92ZSB0aGVtLiBXZSBkbyB0aGlzIGJlY2F1c2VcbiAgICAvLyB3ZSBuZWVkIHRoZXNlIHZhbHVlcyB0byBib3RoIGJlIHNldCB0byBcIjEwMCVcIiBmb3IgdGhlIGF1dG9tYXRpYyBmbGV4aWJsZSBzaXppbmcgdG8gd29yay5cbiAgICAvLyBUaGUgbWF4SGVpZ2h0IGFuZCBtYXhXaWR0aCBhcmUgc2V0IG9uIHRoZSBib3VuZGluZ0JveCBpbiBvcmRlciB0byBlbmZvcmNlIHRoZSBjb25zdHJhaW50LlxuICAgIC8vIE5vdGUgdGhhdCB0aGlzIGRvZXNuJ3QgYXBwbHkgd2hlbiB3ZSBoYXZlIGFuIGV4YWN0IHBvc2l0aW9uLCBpbiB3aGljaCBjYXNlIHdlIGRvIHdhbnQgdG9cbiAgICAvLyBhcHBseSB0aGVtIGJlY2F1c2UgdGhleSdsbCBiZSBjbGVhcmVkIGZyb20gdGhlIGJvdW5kaW5nIGJveC5cbiAgICBpZiAoY29uZmlnLm1heEhlaWdodCkge1xuICAgICAgaWYgKGhhc0V4YWN0UG9zaXRpb24pIHtcbiAgICAgICAgc3R5bGVzLm1heEhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoY29uZmlnLm1heEhlaWdodCk7XG4gICAgICB9IGVsc2UgaWYgKGhhc0ZsZXhpYmxlRGltZW5zaW9ucykge1xuICAgICAgICBzdHlsZXMubWF4SGVpZ2h0ID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5tYXhXaWR0aCkge1xuICAgICAgaWYgKGhhc0V4YWN0UG9zaXRpb24pIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShjb25maWcubWF4V2lkdGgpO1xuICAgICAgfSBlbHNlIGlmIChoYXNGbGV4aWJsZURpbWVuc2lvbnMpIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX3BhbmUuc3R5bGUsIHN0eWxlcyk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZXhhY3QgdG9wL2JvdHRvbSBmb3IgdGhlIG92ZXJsYXkgd2hlbiBub3QgdXNpbmcgZmxleGlibGUgc2l6aW5nIG9yIHdoZW4gcHVzaGluZy4gKi9cbiAgcHJpdmF0ZSBfZ2V0RXhhY3RPdmVybGF5WShwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKSB7XG4gICAgLy8gUmVzZXQgYW55IGV4aXN0aW5nIHN0eWxlcy4gVGhpcyBpcyBuZWNlc3NhcnkgaW4gY2FzZSB0aGVcbiAgICAvLyBwcmVmZXJyZWQgcG9zaXRpb24gaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgYGFwcGx5YC5cbiAgICBsZXQgc3R5bGVzID0ge3RvcDogJycsIGJvdHRvbTogJyd9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG4gICAgbGV0IG92ZXJsYXlQb2ludCA9IHRoaXMuX2dldE92ZXJsYXlQb2ludChvcmlnaW5Qb2ludCwgdGhpcy5fb3ZlcmxheVJlY3QsIHBvc2l0aW9uKTtcblxuICAgIGlmICh0aGlzLl9pc1B1c2hlZCkge1xuICAgICAgb3ZlcmxheVBvaW50ID0gdGhpcy5fcHVzaE92ZXJsYXlPblNjcmVlbihvdmVybGF5UG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBzY3JvbGxQb3NpdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IHZpcnR1YWxLZXlib2FyZE9mZnNldCA9XG4gICAgICAgIHRoaXMuX292ZXJsYXlDb250YWluZXIuZ2V0Q29udGFpbmVyRWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcblxuICAgIC8vIE5vcm1hbGx5IHRoaXMgd291bGQgYmUgemVybywgaG93ZXZlciB3aGVuIHRoZSBvdmVybGF5IGlzIGF0dGFjaGVkIHRvIGFuIGlucHV0IChlLmcuIGluIGFuXG4gICAgLy8gYXV0b2NvbXBsZXRlKSwgbW9iaWxlIGJyb3dzZXJzIHdpbGwgc2hpZnQgZXZlcnl0aGluZyBpbiBvcmRlciB0byBwdXQgdGhlIGlucHV0IGluIHRoZSBtaWRkbGVcbiAgICAvLyBvZiB0aGUgc2NyZWVuIGFuZCB0byBtYWtlIHNwYWNlIGZvciB0aGUgdmlydHVhbCBrZXlib2FyZC4gV2UgbmVlZCB0byBhY2NvdW50IGZvciB0aGlzIG9mZnNldCxcbiAgICAvLyBvdGhlcndpc2Ugb3VyIHBvc2l0aW9uaW5nIHdpbGwgYmUgdGhyb3duIG9mZi5cbiAgICBvdmVybGF5UG9pbnQueSAtPSB2aXJ0dWFsS2V5Ym9hcmRPZmZzZXQ7XG5cbiAgICAvLyBXZSB3YW50IHRvIHNldCBlaXRoZXIgYHRvcGAgb3IgYGJvdHRvbWAgYmFzZWQgb24gd2hldGhlciB0aGUgb3ZlcmxheSB3YW50cyB0byBhcHBlYXJcbiAgICAvLyBhYm92ZSBvciBiZWxvdyB0aGUgb3JpZ2luIGFuZCB0aGUgZGlyZWN0aW9uIGluIHdoaWNoIHRoZSBlbGVtZW50IHdpbGwgZXhwYW5kLlxuICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIC8vIFdoZW4gdXNpbmcgYGJvdHRvbWAsIHdlIGFkanVzdCB0aGUgeSBwb3NpdGlvbiBzdWNoIHRoYXQgaXQgaXMgdGhlIGRpc3RhbmNlXG4gICAgICAvLyBmcm9tIHRoZSBib3R0b20gb2YgdGhlIHZpZXdwb3J0IHJhdGhlciB0aGFuIHRoZSB0b3AuXG4gICAgICBjb25zdCBkb2N1bWVudEhlaWdodCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuY2xpZW50SGVpZ2h0O1xuICAgICAgc3R5bGVzLmJvdHRvbSA9IGAke2RvY3VtZW50SGVpZ2h0IC0gKG92ZXJsYXlQb2ludC55ICsgdGhpcy5fb3ZlcmxheVJlY3QuaGVpZ2h0KX1weGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy50b3AgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKG92ZXJsYXlQb2ludC55KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGV4YWN0IGxlZnQvcmlnaHQgZm9yIHRoZSBvdmVybGF5IHdoZW4gbm90IHVzaW5nIGZsZXhpYmxlIHNpemluZyBvciB3aGVuIHB1c2hpbmcuICovXG4gIHByaXZhdGUgX2dldEV4YWN0T3ZlcmxheVgocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblBvaW50OiBQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbjogVmlld3BvcnRTY3JvbGxQb3NpdGlvbikge1xuICAgIC8vIFJlc2V0IGFueSBleGlzdGluZyBzdHlsZXMuIFRoaXMgaXMgbmVjZXNzYXJ5IGluIGNhc2UgdGhlIHByZWZlcnJlZCBwb3NpdGlvbiBoYXNcbiAgICAvLyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGBhcHBseWAuXG4gICAgbGV0IHN0eWxlcyA9IHtsZWZ0OiAnJywgcmlnaHQ6ICcnfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBwb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5faXNQdXNoZWQpIHtcbiAgICAgIG92ZXJsYXlQb2ludCA9IHRoaXMuX3B1c2hPdmVybGF5T25TY3JlZW4ob3ZlcmxheVBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgc2Nyb2xsUG9zaXRpb24pO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gc2V0IGVpdGhlciBgbGVmdGAgb3IgYHJpZ2h0YCBiYXNlZCBvbiB3aGV0aGVyIHRoZSBvdmVybGF5IHdhbnRzIHRvIGFwcGVhciBcImJlZm9yZVwiXG4gICAgLy8gb3IgXCJhZnRlclwiIHRoZSBvcmlnaW4sIHdoaWNoIGRldGVybWluZXMgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgZWxlbWVudCB3aWxsIGV4cGFuZC5cbiAgICAvLyBGb3IgdGhlIGhvcml6b250YWwgYXhpcywgdGhlIG1lYW5pbmcgb2YgXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiIGNoYW5nZSBiYXNlZCBvbiB3aGV0aGVyIHRoZVxuICAgIC8vIHBhZ2UgaXMgaW4gUlRMIG9yIExUUi5cbiAgICBsZXQgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHk6ICdsZWZ0JyB8ICdyaWdodCc7XG5cbiAgICBpZiAodGhpcy5faXNSdGwoKSkge1xuICAgICAgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAnbGVmdCcgOiAncmlnaHQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBob3Jpem9udGFsU3R5bGVQcm9wZXJ0eSA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB3ZSdyZSBzZXR0aW5nIGByaWdodGAsIHdlIGFkanVzdCB0aGUgeCBwb3NpdGlvbiBzdWNoIHRoYXQgaXQgaXMgdGhlIGRpc3RhbmNlXG4gICAgLy8gZnJvbSB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgdmlld3BvcnQgcmF0aGVyIHRoYW4gdGhlIGxlZnQgZWRnZS5cbiAgICBpZiAoaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPT09ICdyaWdodCcpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50V2lkdGggPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudFdpZHRoO1xuICAgICAgc3R5bGVzLnJpZ2h0ID0gYCR7ZG9jdW1lbnRXaWR0aCAtIChvdmVybGF5UG9pbnQueCArIHRoaXMuX292ZXJsYXlSZWN0LndpZHRoKX1weGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5sZWZ0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShvdmVybGF5UG9pbnQueCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3IHByb3BlcnRpZXMgb2YgdGhlIHRyaWdnZXIgYW5kIG92ZXJsYXksIGluY2x1ZGluZyB3aGV0aGVyIHRoZXkgYXJlIGNsaXBwZWRcbiAgICogb3IgY29tcGxldGVseSBvdXRzaWRlIHRoZSB2aWV3IG9mIGFueSBvZiB0aGUgc3RyYXRlZ3kncyBzY3JvbGxhYmxlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNjcm9sbFZpc2liaWxpdHkoKTogU2Nyb2xsaW5nVmlzaWJpbGl0eSB7XG4gICAgLy8gTm90ZTogbmVlZHMgZnJlc2ggcmVjdHMgc2luY2UgdGhlIHBvc2l0aW9uIGNvdWxkJ3ZlIGNoYW5nZWQuXG4gICAgY29uc3Qgb3JpZ2luQm91bmRzID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgIGNvbnN0IG92ZXJsYXlCb3VuZHMgPSAgdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIFRPRE8oamVsYm91cm4pOiBpbnN0ZWFkIG9mIG5lZWRpbmcgYWxsIG9mIHRoZSBjbGllbnQgcmVjdHMgZm9yIHRoZXNlIHNjcm9sbGluZyBjb250YWluZXJzXG4gICAgLy8gZXZlcnkgdGltZSwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gdXNlIHRoZSBzY3JvbGxUb3Agb2YgdGhlIGNvbnRhaW5lcnMgaWYgdGhlIHNpemUgb2YgdGhvc2VcbiAgICAvLyBjb250YWluZXJzIGhhc24ndCBjaGFuZ2VkLlxuICAgIGNvbnN0IHNjcm9sbENvbnRhaW5lckJvdW5kcyA9IHRoaXMuX3Njcm9sbGFibGVzLm1hcChzY3JvbGxhYmxlID0+IHtcbiAgICAgIHJldHVybiBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzT3JpZ2luQ2xpcHBlZDogaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nKG9yaWdpbkJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICAgIGlzT3JpZ2luT3V0c2lkZVZpZXc6IGlzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcob3JpZ2luQm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgICAgaXNPdmVybGF5Q2xpcHBlZDogaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nKG92ZXJsYXlCb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgICBpc092ZXJsYXlPdXRzaWRlVmlldzogaXNFbGVtZW50U2Nyb2xsZWRPdXRzaWRlVmlldyhvdmVybGF5Qm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgIH07XG4gIH1cblxuICAvKiogU3VidHJhY3RzIHRoZSBhbW91bnQgdGhhdCBhbiBlbGVtZW50IGlzIG92ZXJmbG93aW5nIG9uIGFuIGF4aXMgZnJvbSBpdHMgbGVuZ3RoLiAqL1xuICBwcml2YXRlIF9zdWJ0cmFjdE92ZXJmbG93cyhsZW5ndGg6IG51bWJlciwgLi4ub3ZlcmZsb3dzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIG92ZXJmbG93cy5yZWR1Y2UoKGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50T3ZlcmZsb3c6IG51bWJlcikgPT4ge1xuICAgICAgcmV0dXJuIGN1cnJlbnRWYWx1ZSAtIE1hdGgubWF4KGN1cnJlbnRPdmVyZmxvdywgMCk7XG4gICAgfSwgbGVuZ3RoKTtcbiAgfVxuXG4gIC8qKiBOYXJyb3dzIHRoZSBnaXZlbiB2aWV3cG9ydCByZWN0IGJ5IHRoZSBjdXJyZW50IF92aWV3cG9ydE1hcmdpbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTogQ2xpZW50UmVjdCB7XG4gICAgLy8gV2UgcmVjYWxjdWxhdGUgdGhlIHZpZXdwb3J0IHJlY3QgaGVyZSBvdXJzZWx2ZXMsIHJhdGhlciB0aGFuIHVzaW5nIHRoZSBWaWV3cG9ydFJ1bGVyLFxuICAgIC8vIGJlY2F1c2Ugd2Ugd2FudCB0byB1c2UgdGhlIGBjbGllbnRXaWR0aGAgYW5kIGBjbGllbnRIZWlnaHRgIGFzIHRoZSBiYXNlLiBUaGUgZGlmZmVyZW5jZVxuICAgIC8vIGJlaW5nIHRoYXQgdGhlIGNsaWVudCBwcm9wZXJ0aWVzIGRvbid0IGluY2x1ZGUgdGhlIHNjcm9sbGJhciwgYXMgb3Bwb3NlZCB0byBgaW5uZXJXaWR0aGBcbiAgICAvLyBhbmQgYGlubmVySGVpZ2h0YCB0aGF0IGRvLiBUaGlzIGlzIG5lY2Vzc2FyeSwgYmVjYXVzZSB0aGUgb3ZlcmxheSBjb250YWluZXIgdXNlc1xuICAgIC8vIDEwMCUgYHdpZHRoYCBhbmQgYGhlaWdodGAgd2hpY2ggZG9uJ3QgaW5jbHVkZSB0aGUgc2Nyb2xsYmFyIGVpdGhlci5cbiAgICBjb25zdCB3aWR0aCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuY2xpZW50V2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6ICAgIHNjcm9sbFBvc2l0aW9uLnRvcCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgbGVmdDogICBzY3JvbGxQb3NpdGlvbi5sZWZ0ICsgdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICByaWdodDogIHNjcm9sbFBvc2l0aW9uLmxlZnQgKyB3aWR0aCAtIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgYm90dG9tOiBzY3JvbGxQb3NpdGlvbi50b3AgKyBoZWlnaHQgLSB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIHdpZHRoOiAgd2lkdGggIC0gKDIgKiB0aGlzLl92aWV3cG9ydE1hcmdpbiksXG4gICAgICBoZWlnaHQ6IGhlaWdodCAtICgyICogdGhpcy5fdmlld3BvcnRNYXJnaW4pLFxuICAgIH07XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgd2UncmUgZGVhbGluZyB3aXRoIGFuIFJUTCBjb250ZXh0ICovXG4gIHByaXZhdGUgX2lzUnRsKCkge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5UmVmLmdldERpcmVjdGlvbigpID09PSAncnRsJztcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG92ZXJsYXkgdXNlcyBleGFjdCBvciBmbGV4aWJsZSBwb3NpdGlvbmluZy4gKi9cbiAgcHJpdmF0ZSBfaGFzRXhhY3RQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gIXRoaXMuX2hhc0ZsZXhpYmxlRGltZW5zaW9ucyB8fCB0aGlzLl9pc1B1c2hlZDtcbiAgfVxuXG4gIC8qKiBSZXRyaWV2ZXMgdGhlIG9mZnNldCBvZiBhIHBvc2l0aW9uIGFsb25nIHRoZSB4IG9yIHkgYXhpcy4gKi9cbiAgcHJpdmF0ZSBfZ2V0T2Zmc2V0KHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbiwgYXhpczogJ3gnIHwgJ3knKSB7XG4gICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgLy8gV2UgZG9uJ3QgZG8gc29tZXRoaW5nIGxpa2UgYHBvc2l0aW9uWydvZmZzZXQnICsgYXhpc11gIGluXG4gICAgICAvLyBvcmRlciB0byBhdm9pZCBicmVraW5nIG1pbmlmaWVycyB0aGF0IHJlbmFtZSBwcm9wZXJ0aWVzLlxuICAgICAgcmV0dXJuIHBvc2l0aW9uLm9mZnNldFggPT0gbnVsbCA/IHRoaXMuX29mZnNldFggOiBwb3NpdGlvbi5vZmZzZXRYO1xuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbi5vZmZzZXRZID09IG51bGwgPyB0aGlzLl9vZmZzZXRZIDogcG9zaXRpb24ub2Zmc2V0WTtcbiAgfVxuXG4gIC8qKiBWYWxpZGF0ZXMgdGhhdCB0aGUgY3VycmVudCBwb3NpdGlvbiBtYXRjaCB0aGUgZXhwZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF92YWxpZGF0ZVBvc2l0aW9ucygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKCdGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k6IEF0IGxlYXN0IG9uZSBwb3NpdGlvbiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogcmVtb3ZlIHRoZXNlIG9uY2UgQW5ndWxhcidzIHRlbXBsYXRlIHR5cGVcbiAgICAvLyBjaGVja2luZyBpcyBhZHZhbmNlZCBlbm91Z2ggdG8gY2F0Y2ggdGhlc2UgY2FzZXMuXG4gICAgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zLmZvckVhY2gocGFpciA9PiB7XG4gICAgICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbignb3JpZ2luWCcsIHBhaXIub3JpZ2luWCk7XG4gICAgICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24oJ29yaWdpblknLCBwYWlyLm9yaWdpblkpO1xuICAgICAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24oJ292ZXJsYXlYJywgcGFpci5vdmVybGF5WCk7XG4gICAgICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24oJ292ZXJsYXlZJywgcGFpci5vdmVybGF5WSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQWRkcyBhIHNpbmdsZSBDU1MgY2xhc3Mgb3IgYW4gYXJyYXkgb2YgY2xhc3NlcyBvbiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfYWRkUGFuZWxDbGFzc2VzKGNzc0NsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIGNvZXJjZUFycmF5KGNzc0NsYXNzZXMpLmZvckVhY2goY3NzQ2xhc3MgPT4ge1xuICAgICAgICBpZiAoY3NzQ2xhc3MgIT09ICcnICYmIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMuaW5kZXhPZihjc3NDbGFzcykgPT09IC0xKSB7XG4gICAgICAgICAgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3Nlcy5wdXNoKGNzc0NsYXNzKTtcbiAgICAgICAgICB0aGlzLl9wYW5lLmNsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIHRoZSBjbGFzc2VzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGhhcyBhcHBsaWVkIGZyb20gdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX2NsZWFyUGFuZWxDbGFzc2VzKCkge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzLmZvckVhY2goY3NzQ2xhc3MgPT4ge1xuICAgICAgICB0aGlzLl9wYW5lLmNsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIENsaWVudFJlY3Qgb2YgdGhlIGN1cnJlbnQgb3JpZ2luLiAqL1xuICBwcml2YXRlIF9nZXRPcmlnaW5SZWN0KCk6IENsaWVudFJlY3Qge1xuICAgIGNvbnN0IG9yaWdpbiA9IHRoaXMuX29yaWdpbjtcblxuICAgIGlmIChvcmlnaW4gaW5zdGFuY2VvZiBFbGVtZW50UmVmKSB7XG4gICAgICByZXR1cm4gb3JpZ2luLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIEVsZW1lbnQgc28gU1ZHIGVsZW1lbnRzIGFyZSBhbHNvIHN1cHBvcnRlZC5cbiAgICBpZiAob3JpZ2luIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgcmV0dXJuIG9yaWdpbi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9XG5cbiAgICBjb25zdCB3aWR0aCA9IG9yaWdpbi53aWR0aCB8fCAwO1xuICAgIGNvbnN0IGhlaWdodCA9IG9yaWdpbi5oZWlnaHQgfHwgMDtcblxuICAgIC8vIElmIHRoZSBvcmlnaW4gaXMgYSBwb2ludCwgcmV0dXJuIGEgY2xpZW50IHJlY3QgYXMgaWYgaXQgd2FzIGEgMHgwIGVsZW1lbnQgYXQgdGhlIHBvaW50LlxuICAgIHJldHVybiB7XG4gICAgICB0b3A6IG9yaWdpbi55LFxuICAgICAgYm90dG9tOiBvcmlnaW4ueSArIGhlaWdodCxcbiAgICAgIGxlZnQ6IG9yaWdpbi54LFxuICAgICAgcmlnaHQ6IG9yaWdpbi54ICsgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICB3aWR0aFxuICAgIH07XG4gIH1cbn1cblxuLyoqIEEgc2ltcGxlICh4LCB5KSBjb29yZGluYXRlLiAqL1xuaW50ZXJmYWNlIFBvaW50IHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG59XG5cbi8qKiBSZWNvcmQgb2YgbWVhc3VyZW1lbnRzIGZvciBob3cgYW4gb3ZlcmxheSAoYXQgYSBnaXZlbiBwb3NpdGlvbikgZml0cyBpbnRvIHRoZSB2aWV3cG9ydC4gKi9cbmludGVyZmFjZSBPdmVybGF5Rml0IHtcbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgZml0cyBjb21wbGV0ZWx5IGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQ6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgb24gdGhlIHktYXhpcy4gKi9cbiAgZml0c0luVmlld3BvcnRWZXJ0aWNhbGx5OiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGZpdHMgaW4gdGhlIHZpZXdwb3J0IG9uIHRoZSB4LWF4aXMuICovXG4gIGZpdHNJblZpZXdwb3J0SG9yaXpvbnRhbGx5OiBib29sZWFuO1xuXG4gIC8qKiBUaGUgdG90YWwgdmlzaWJsZSBhcmVhIChpbiBweF4yKSBvZiB0aGUgb3ZlcmxheSBpbnNpZGUgdGhlIHZpZXdwb3J0LiAqL1xuICB2aXNpYmxlQXJlYTogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIHRoZSBtZWFzdXJtZW50cyBkZXRlcm1pbmluZyB3aGV0aGVyIGFuIG92ZXJsYXkgd2lsbCBmaXQgaW4gYSBzcGVjaWZpYyBwb3NpdGlvbi4gKi9cbmludGVyZmFjZSBGYWxsYmFja1Bvc2l0aW9uIHtcbiAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uO1xuICBvcmlnaW5Qb2ludDogUG9pbnQ7XG4gIG92ZXJsYXlQb2ludDogUG9pbnQ7XG4gIG92ZXJsYXlGaXQ6IE92ZXJsYXlGaXQ7XG4gIG92ZXJsYXlSZWN0OiBDbGllbnRSZWN0O1xufVxuXG4vKiogUG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIG92ZXJsYXkgc2l6aW5nIHdyYXBwZXIgZm9yIGEgc3BlY2lmaWMgcG9zaXRpb24uICovXG5pbnRlcmZhY2UgQm91bmRpbmdCb3hSZWN0IHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgYm90dG9tOiBudW1iZXI7XG4gIHJpZ2h0OiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xufVxuXG4vKiogUmVjb3JkIG9mIG1lYXN1cmVzIGRldGVybWluaW5nIGhvdyB3ZWxsIGEgZ2l2ZW4gcG9zaXRpb24gd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLiAqL1xuaW50ZXJmYWNlIEZsZXhpYmxlRml0IHtcbiAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uO1xuICBvcmlnaW46IFBvaW50O1xuICBvdmVybGF5UmVjdDogQ2xpZW50UmVjdDtcbiAgYm91bmRpbmdCb3hSZWN0OiBCb3VuZGluZ0JveFJlY3Q7XG59XG5cbi8qKiBBIGNvbm5lY3RlZCBwb3NpdGlvbiBhcyBzcGVjaWZpZWQgYnkgdGhlIHVzZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RlZFBvc2l0aW9uIHtcbiAgb3JpZ2luWDogJ3N0YXJ0JyB8ICdjZW50ZXInIHwgJ2VuZCc7XG4gIG9yaWdpblk6ICd0b3AnIHwgJ2NlbnRlcicgfCAnYm90dG9tJztcblxuICBvdmVybGF5WDogJ3N0YXJ0JyB8ICdjZW50ZXInIHwgJ2VuZCc7XG4gIG92ZXJsYXlZOiAndG9wJyB8ICdjZW50ZXInIHwgJ2JvdHRvbSc7XG5cbiAgd2VpZ2h0PzogbnVtYmVyO1xuICBvZmZzZXRYPzogbnVtYmVyO1xuICBvZmZzZXRZPzogbnVtYmVyO1xuICBwYW5lbENsYXNzPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbi8qKiBTaGFsbG93LWV4dGVuZHMgYSBzdHlsZXNoZWV0IG9iamVjdCB3aXRoIGFub3RoZXIgc3R5bGVzaGVldCBvYmplY3QuICovXG5mdW5jdGlvbiBleHRlbmRTdHlsZXMoZGVzdGluYXRpb246IENTU1N0eWxlRGVjbGFyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBDU1NTdHlsZURlY2xhcmF0aW9uKTogQ1NTU3R5bGVEZWNsYXJhdGlvbiB7XG4gIGZvciAobGV0IGtleSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGRlc3RpbmF0aW9uW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVzdGluYXRpb247XG59XG5cblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgcGl4ZWwgdmFsdWUgYXMgYSBudW1iZXIgZnJvbSBhIHZhbHVlLCBpZiBpdCdzIGEgbnVtYmVyXG4gKiBvciBhIENTUyBwaXhlbCBzdHJpbmcgKGUuZy4gYDEzMzdweGApLiBPdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICovXG5mdW5jdGlvbiBnZXRQaXhlbFZhbHVlKGlucHV0OiBudW1iZXJ8c3RyaW5nfG51bGx8dW5kZWZpbmVkKTogbnVtYmVyfG51bGwge1xuICBpZiAodHlwZW9mIGlucHV0ICE9PSAnbnVtYmVyJyAmJiBpbnB1dCAhPSBudWxsKSB7XG4gICAgY29uc3QgW3ZhbHVlLCB1bml0c10gPSBpbnB1dC5zcGxpdChjc3NVbml0UGF0dGVybik7XG4gICAgcmV0dXJuICghdW5pdHMgfHwgdW5pdHMgPT09ICdweCcpID8gcGFyc2VGbG9hdCh2YWx1ZSkgOiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGlucHV0IHx8IG51bGw7XG59XG4iXX0=