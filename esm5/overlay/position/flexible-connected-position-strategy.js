/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __values } from "tslib";
import { ElementRef } from '@angular/core';
import { ConnectedOverlayPositionChange, validateHorizontalPosition, validateVerticalPosition, } from './connected-position';
import { Subscription, Subject } from 'rxjs';
import { isElementScrolledOutsideView, isElementClippedByScrolling } from './scroll-clip';
import { coerceCssPixelValue, coerceArray } from '@angular/cdk/coercion';
// TODO: refactor clipping detection into a separate thing (part of scrolling module)
// TODO: doesn't handle both flexible width and height when it has to scroll along both axis.
/** Class to be added to the overlay bounding box. */
var boundingBoxClass = 'cdk-overlay-connected-position-bounding-box';
/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * implicit position relative some origin element. The relative position is defined in terms of
 * a point on the origin element that is connected to a point on the overlay element. For example,
 * a basic dropdown is connecting the bottom-left corner of the origin to the top-left corner
 * of the overlay.
 */
var FlexibleConnectedPositionStrategy = /** @class */ (function () {
    function FlexibleConnectedPositionStrategy(connectedTo, _viewportRuler, _document, _platform, _overlayContainer) {
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
        this.positionChanges = this._positionChanges.asObservable();
        this.setOrigin(connectedTo);
    }
    Object.defineProperty(FlexibleConnectedPositionStrategy.prototype, "positions", {
        /** Ordered list of preferred positions, from most to least desirable. */
        get: function () {
            return this._preferredPositions;
        },
        enumerable: true,
        configurable: true
    });
    /** Attaches this position strategy to an overlay. */
    FlexibleConnectedPositionStrategy.prototype.attach = function (overlayRef) {
        var _this = this;
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
        this._resizeSubscription = this._viewportRuler.change().subscribe(function () {
            // When the window is resized, we want to trigger the next reposition as if it
            // was an initial render, in order for the strategy to pick a new optimal position,
            // otherwise position locking will cause it to stay at the old one.
            _this._isInitialRender = true;
            _this.apply();
        });
    };
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
    FlexibleConnectedPositionStrategy.prototype.apply = function () {
        var e_1, _a, e_2, _b;
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
        var originRect = this._originRect;
        var overlayRect = this._overlayRect;
        var viewportRect = this._viewportRect;
        // Positions where the overlay will fit with flexible dimensions.
        var flexibleFits = [];
        // Fallback if none of the preferred positions fit within the viewport.
        var fallback;
        try {
            // Go through each of the preferred positions looking for a good fit.
            // If a good fit is found, it will be applied immediately.
            for (var _c = __values(this._preferredPositions), _d = _c.next(); !_d.done; _d = _c.next()) {
                var pos = _d.value;
                // Get the exact (x, y) coordinate for the point-of-origin on the origin element.
                var originPoint = this._getOriginPoint(originRect, pos);
                // From that point-of-origin, get the exact (x, y) coordinate for the top-left corner of the
                // overlay in this position. We use the top-left corner for calculations and later translate
                // this into an appropriate (top, left, bottom, right) style.
                var overlayPoint = this._getOverlayPoint(originPoint, overlayRect, pos);
                // Calculate how well the overlay would fit into the viewport with this point.
                var overlayFit = this._getOverlayFit(overlayPoint, overlayRect, viewportRect, pos);
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
                        overlayRect: overlayRect,
                        boundingBoxRect: this._calculateBoundingBoxRect(originPoint, pos)
                    });
                    continue;
                }
                // If the current preferred position does not fit on the screen, remember the position
                // if it has more visible area on-screen than we've seen and move onto the next preferred
                // position.
                if (!fallback || fallback.overlayFit.visibleArea < overlayFit.visibleArea) {
                    fallback = { overlayFit: overlayFit, overlayPoint: overlayPoint, originPoint: originPoint, position: pos, overlayRect: overlayRect };
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // If there are any positions where the overlay would fit with flexible dimensions, choose the
        // one that has the greatest area available modified by the position's weight
        if (flexibleFits.length) {
            var bestFit = null;
            var bestScore = -1;
            try {
                for (var flexibleFits_1 = __values(flexibleFits), flexibleFits_1_1 = flexibleFits_1.next(); !flexibleFits_1_1.done; flexibleFits_1_1 = flexibleFits_1.next()) {
                    var fit = flexibleFits_1_1.value;
                    var score = fit.boundingBoxRect.width * fit.boundingBoxRect.height * (fit.position.weight || 1);
                    if (score > bestScore) {
                        bestScore = score;
                        bestFit = fit;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (flexibleFits_1_1 && !flexibleFits_1_1.done && (_b = flexibleFits_1.return)) _b.call(flexibleFits_1);
                }
                finally { if (e_2) throw e_2.error; }
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
    };
    FlexibleConnectedPositionStrategy.prototype.detach = function () {
        this._clearPanelClasses();
        this._lastPosition = null;
        this._previousPushAmount = null;
        this._resizeSubscription.unsubscribe();
    };
    /** Cleanup after the element gets destroyed. */
    FlexibleConnectedPositionStrategy.prototype.dispose = function () {
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
    };
    /**
     * This re-aligns the overlay element with the trigger in its last calculated position,
     * even if a position higher in the "preferred positions" list would now fit. This
     * allows one to re-align the panel without changing the orientation of the panel.
     */
    FlexibleConnectedPositionStrategy.prototype.reapplyLastPosition = function () {
        if (!this._isDisposed && (!this._platform || this._platform.isBrowser)) {
            this._originRect = this._getOriginRect();
            this._overlayRect = this._pane.getBoundingClientRect();
            this._viewportRect = this._getNarrowedViewportRect();
            var lastPosition = this._lastPosition || this._preferredPositions[0];
            var originPoint = this._getOriginPoint(this._originRect, lastPosition);
            this._applyPosition(lastPosition, originPoint);
        }
    };
    /**
     * Sets the list of Scrollable containers that host the origin element so that
     * on reposition we can evaluate if it or the overlay has been clipped or outside view. Every
     * Scrollable must be an ancestor element of the strategy's origin element.
     */
    FlexibleConnectedPositionStrategy.prototype.withScrollableContainers = function (scrollables) {
        this._scrollables = scrollables;
        return this;
    };
    /**
     * Adds new preferred positions.
     * @param positions List of positions options for this overlay.
     */
    FlexibleConnectedPositionStrategy.prototype.withPositions = function (positions) {
        this._preferredPositions = positions;
        // If the last calculated position object isn't part of the positions anymore, clear
        // it in order to avoid it being picked up if the consumer tries to re-apply.
        if (positions.indexOf(this._lastPosition) === -1) {
            this._lastPosition = null;
        }
        this._validatePositions();
        return this;
    };
    /**
     * Sets a minimum distance the overlay may be positioned to the edge of the viewport.
     * @param margin Required margin between the overlay and the viewport edge in pixels.
     */
    FlexibleConnectedPositionStrategy.prototype.withViewportMargin = function (margin) {
        this._viewportMargin = margin;
        return this;
    };
    /** Sets whether the overlay's width and height can be constrained to fit within the viewport. */
    FlexibleConnectedPositionStrategy.prototype.withFlexibleDimensions = function (flexibleDimensions) {
        if (flexibleDimensions === void 0) { flexibleDimensions = true; }
        this._hasFlexibleDimensions = flexibleDimensions;
        return this;
    };
    /** Sets whether the overlay can grow after the initial open via flexible width/height. */
    FlexibleConnectedPositionStrategy.prototype.withGrowAfterOpen = function (growAfterOpen) {
        if (growAfterOpen === void 0) { growAfterOpen = true; }
        this._growAfterOpen = growAfterOpen;
        return this;
    };
    /** Sets whether the overlay can be pushed on-screen if none of the provided positions fit. */
    FlexibleConnectedPositionStrategy.prototype.withPush = function (canPush) {
        if (canPush === void 0) { canPush = true; }
        this._canPush = canPush;
        return this;
    };
    /**
     * Sets whether the overlay's position should be locked in after it is positioned
     * initially. When an overlay is locked in, it won't attempt to reposition itself
     * when the position is re-applied (e.g. when the user scrolls away).
     * @param isLocked Whether the overlay should locked in.
     */
    FlexibleConnectedPositionStrategy.prototype.withLockedPosition = function (isLocked) {
        if (isLocked === void 0) { isLocked = true; }
        this._positionLocked = isLocked;
        return this;
    };
    /**
     * Sets the origin, relative to which to position the overlay.
     * Using an element origin is useful for building components that need to be positioned
     * relatively to a trigger (e.g. dropdown menus or tooltips), whereas using a point can be
     * used for cases like contextual menus which open relative to the user's pointer.
     * @param origin Reference to the new origin.
     */
    FlexibleConnectedPositionStrategy.prototype.setOrigin = function (origin) {
        this._origin = origin;
        return this;
    };
    /**
     * Sets the default offset for the overlay's connection point on the x-axis.
     * @param offset New offset in the X axis.
     */
    FlexibleConnectedPositionStrategy.prototype.withDefaultOffsetX = function (offset) {
        this._offsetX = offset;
        return this;
    };
    /**
     * Sets the default offset for the overlay's connection point on the y-axis.
     * @param offset New offset in the Y axis.
     */
    FlexibleConnectedPositionStrategy.prototype.withDefaultOffsetY = function (offset) {
        this._offsetY = offset;
        return this;
    };
    /**
     * Configures that the position strategy should set a `transform-origin` on some elements
     * inside the overlay, depending on the current position that is being applied. This is
     * useful for the cases where the origin of an animation can change depending on the
     * alignment of the overlay.
     * @param selector CSS selector that will be used to find the target
     *    elements onto which to set the transform origin.
     */
    FlexibleConnectedPositionStrategy.prototype.withTransformOriginOn = function (selector) {
        this._transformOriginSelector = selector;
        return this;
    };
    /**
     * Gets the (x, y) coordinate of a connection point on the origin based on a relative position.
     */
    FlexibleConnectedPositionStrategy.prototype._getOriginPoint = function (originRect, pos) {
        var x;
        if (pos.originX == 'center') {
            // Note: when centering we should always use the `left`
            // offset, otherwise the position will be wrong in RTL.
            x = originRect.left + (originRect.width / 2);
        }
        else {
            var startX = this._isRtl() ? originRect.right : originRect.left;
            var endX = this._isRtl() ? originRect.left : originRect.right;
            x = pos.originX == 'start' ? startX : endX;
        }
        var y;
        if (pos.originY == 'center') {
            y = originRect.top + (originRect.height / 2);
        }
        else {
            y = pos.originY == 'top' ? originRect.top : originRect.bottom;
        }
        return { x: x, y: y };
    };
    /**
     * Gets the (x, y) coordinate of the top-left corner of the overlay given a given position and
     * origin point to which the overlay should be connected.
     */
    FlexibleConnectedPositionStrategy.prototype._getOverlayPoint = function (originPoint, overlayRect, pos) {
        // Calculate the (overlayStartX, overlayStartY), the start of the
        // potential overlay position relative to the origin point.
        var overlayStartX;
        if (pos.overlayX == 'center') {
            overlayStartX = -overlayRect.width / 2;
        }
        else if (pos.overlayX === 'start') {
            overlayStartX = this._isRtl() ? -overlayRect.width : 0;
        }
        else {
            overlayStartX = this._isRtl() ? 0 : -overlayRect.width;
        }
        var overlayStartY;
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
    };
    /** Gets how well an overlay at the given point will fit within the viewport. */
    FlexibleConnectedPositionStrategy.prototype._getOverlayFit = function (point, overlay, viewport, position) {
        var x = point.x, y = point.y;
        var offsetX = this._getOffset(position, 'x');
        var offsetY = this._getOffset(position, 'y');
        // Account for the offsets since they could push the overlay out of the viewport.
        if (offsetX) {
            x += offsetX;
        }
        if (offsetY) {
            y += offsetY;
        }
        // How much the overlay would overflow at this position, on each side.
        var leftOverflow = 0 - x;
        var rightOverflow = (x + overlay.width) - viewport.width;
        var topOverflow = 0 - y;
        var bottomOverflow = (y + overlay.height) - viewport.height;
        // Visible parts of the element on each axis.
        var visibleWidth = this._subtractOverflows(overlay.width, leftOverflow, rightOverflow);
        var visibleHeight = this._subtractOverflows(overlay.height, topOverflow, bottomOverflow);
        var visibleArea = visibleWidth * visibleHeight;
        return {
            visibleArea: visibleArea,
            isCompletelyWithinViewport: (overlay.width * overlay.height) === visibleArea,
            fitsInViewportVertically: visibleHeight === overlay.height,
            fitsInViewportHorizontally: visibleWidth == overlay.width,
        };
    };
    /**
     * Whether the overlay can fit within the viewport when it may resize either its width or height.
     * @param fit How well the overlay fits in the viewport at some position.
     * @param point The (x, y) coordinates of the overlat at some position.
     * @param viewport The geometry of the viewport.
     */
    FlexibleConnectedPositionStrategy.prototype._canFitWithFlexibleDimensions = function (fit, point, viewport) {
        if (this._hasFlexibleDimensions) {
            var availableHeight = viewport.bottom - point.y;
            var availableWidth = viewport.right - point.x;
            var minHeight = this._overlayRef.getConfig().minHeight;
            var minWidth = this._overlayRef.getConfig().minWidth;
            var verticalFit = fit.fitsInViewportVertically ||
                (minHeight != null && minHeight <= availableHeight);
            var horizontalFit = fit.fitsInViewportHorizontally ||
                (minWidth != null && minWidth <= availableWidth);
            return verticalFit && horizontalFit;
        }
        return false;
    };
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
    FlexibleConnectedPositionStrategy.prototype._pushOverlayOnScreen = function (start, overlay, scrollPosition) {
        // If the position is locked and we've pushed the overlay already, reuse the previous push
        // amount, rather than pushing it again. If we were to continue pushing, the element would
        // remain in the viewport, which goes against the expectations when position locking is enabled.
        if (this._previousPushAmount && this._positionLocked) {
            return {
                x: start.x + this._previousPushAmount.x,
                y: start.y + this._previousPushAmount.y
            };
        }
        var viewport = this._viewportRect;
        // Determine how much the overlay goes outside the viewport on each
        // side, which we'll use to decide which direction to push it.
        var overflowRight = Math.max(start.x + overlay.width - viewport.right, 0);
        var overflowBottom = Math.max(start.y + overlay.height - viewport.bottom, 0);
        var overflowTop = Math.max(viewport.top - scrollPosition.top - start.y, 0);
        var overflowLeft = Math.max(viewport.left - scrollPosition.left - start.x, 0);
        // Amount by which to push the overlay in each axis such that it remains on-screen.
        var pushX = 0;
        var pushY = 0;
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
    };
    /**
     * Applies a computed position to the overlay and emits a position change.
     * @param position The position preference
     * @param originPoint The point on the origin element where the overlay is connected.
     */
    FlexibleConnectedPositionStrategy.prototype._applyPosition = function (position, originPoint) {
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
            var scrollableViewProperties = this._getScrollVisibility();
            var changeEvent = new ConnectedOverlayPositionChange(position, scrollableViewProperties);
            this._positionChanges.next(changeEvent);
        }
        this._isInitialRender = false;
    };
    /** Sets the transform origin based on the configured selector and the passed-in position.  */
    FlexibleConnectedPositionStrategy.prototype._setTransformOrigin = function (position) {
        if (!this._transformOriginSelector) {
            return;
        }
        var elements = this._boundingBox.querySelectorAll(this._transformOriginSelector);
        var xOrigin;
        var yOrigin = position.overlayY;
        if (position.overlayX === 'center') {
            xOrigin = 'center';
        }
        else if (this._isRtl()) {
            xOrigin = position.overlayX === 'start' ? 'right' : 'left';
        }
        else {
            xOrigin = position.overlayX === 'start' ? 'left' : 'right';
        }
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.transformOrigin = xOrigin + " " + yOrigin;
        }
    };
    /**
     * Gets the position and size of the overlay's sizing container.
     *
     * This method does no measuring and applies no styles so that we can cheaply compute the
     * bounds for all positions and choose the best fit based on these results.
     */
    FlexibleConnectedPositionStrategy.prototype._calculateBoundingBoxRect = function (origin, position) {
        var viewport = this._viewportRect;
        var isRtl = this._isRtl();
        var height, top, bottom;
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
            var smallestDistanceToViewportEdge = Math.min(viewport.bottom - origin.y + viewport.top, origin.y);
            var previousHeight = this._lastBoundingBoxSize.height;
            height = smallestDistanceToViewportEdge * 2;
            top = origin.y - smallestDistanceToViewportEdge;
            if (height > previousHeight && !this._isInitialRender && !this._growAfterOpen) {
                top = origin.y - (previousHeight / 2);
            }
        }
        // The overlay is opening 'right-ward' (the content flows to the right).
        var isBoundedByRightViewportEdge = (position.overlayX === 'start' && !isRtl) ||
            (position.overlayX === 'end' && isRtl);
        // The overlay is opening 'left-ward' (the content flows to the left).
        var isBoundedByLeftViewportEdge = (position.overlayX === 'end' && !isRtl) ||
            (position.overlayX === 'start' && isRtl);
        var width, left, right;
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
            var smallestDistanceToViewportEdge = Math.min(viewport.right - origin.x + viewport.left, origin.x);
            var previousWidth = this._lastBoundingBoxSize.width;
            width = smallestDistanceToViewportEdge * 2;
            left = origin.x - smallestDistanceToViewportEdge;
            if (width > previousWidth && !this._isInitialRender && !this._growAfterOpen) {
                left = origin.x - (previousWidth / 2);
            }
        }
        return { top: top, left: left, bottom: bottom, right: right, width: width, height: height };
    };
    /**
     * Sets the position and size of the overlay's sizing wrapper. The wrapper is positioned on the
     * origin's connection point and stetches to the bounds of the viewport.
     *
     * @param origin The point on the origin element where the overlay is connected.
     * @param position The position preference
     */
    FlexibleConnectedPositionStrategy.prototype._setBoundingBoxStyles = function (origin, position) {
        var boundingBoxRect = this._calculateBoundingBoxRect(origin, position);
        // It's weird if the overlay *grows* while scrolling, so we take the last size into account
        // when applying a new size.
        if (!this._isInitialRender && !this._growAfterOpen) {
            boundingBoxRect.height = Math.min(boundingBoxRect.height, this._lastBoundingBoxSize.height);
            boundingBoxRect.width = Math.min(boundingBoxRect.width, this._lastBoundingBoxSize.width);
        }
        var styles = {};
        if (this._hasExactPosition()) {
            styles.top = styles.left = '0';
            styles.bottom = styles.right = '';
            styles.width = styles.height = '100%';
        }
        else {
            var maxHeight = this._overlayRef.getConfig().maxHeight;
            var maxWidth = this._overlayRef.getConfig().maxWidth;
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
    };
    /** Resets the styles for the bounding box so that a new positioning can be computed. */
    FlexibleConnectedPositionStrategy.prototype._resetBoundingBoxStyles = function () {
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
    };
    /** Resets the styles for the overlay pane so that a new positioning can be computed. */
    FlexibleConnectedPositionStrategy.prototype._resetOverlayElementStyles = function () {
        extendStyles(this._pane.style, {
            top: '',
            left: '',
            bottom: '',
            right: '',
            position: '',
            transform: '',
        });
    };
    /** Sets positioning styles to the overlay element. */
    FlexibleConnectedPositionStrategy.prototype._setOverlayElementStyles = function (originPoint, position) {
        var styles = {};
        if (this._hasExactPosition()) {
            var scrollPosition = this._viewportRuler.getViewportScrollPosition();
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
        var transformString = '';
        var offsetX = this._getOffset(position, 'x');
        var offsetY = this._getOffset(position, 'y');
        if (offsetX) {
            transformString += "translateX(" + offsetX + "px) ";
        }
        if (offsetY) {
            transformString += "translateY(" + offsetY + "px)";
        }
        styles.transform = transformString.trim();
        // If a maxWidth or maxHeight is specified on the overlay, we remove them. We do this because
        // we need these values to both be set to "100%" for the automatic flexible sizing to work.
        // The maxHeight and maxWidth are set on the boundingBox in order to enforce the constraint.
        if (this._hasFlexibleDimensions && this._overlayRef.getConfig().maxHeight) {
            styles.maxHeight = '';
        }
        if (this._hasFlexibleDimensions && this._overlayRef.getConfig().maxWidth) {
            styles.maxWidth = '';
        }
        extendStyles(this._pane.style, styles);
    };
    /** Gets the exact top/bottom for the overlay when not using flexible sizing or when pushing. */
    FlexibleConnectedPositionStrategy.prototype._getExactOverlayY = function (position, originPoint, scrollPosition) {
        // Reset any existing styles. This is necessary in case the
        // preferred position has changed since the last `apply`.
        var styles = { top: null, bottom: null };
        var overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
        if (this._isPushed) {
            overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
        }
        var virtualKeyboardOffset = this._overlayContainer.getContainerElement().getBoundingClientRect().top;
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
            var documentHeight = this._document.documentElement.clientHeight;
            styles.bottom = documentHeight - (overlayPoint.y + this._overlayRect.height) + "px";
        }
        else {
            styles.top = coerceCssPixelValue(overlayPoint.y);
        }
        return styles;
    };
    /** Gets the exact left/right for the overlay when not using flexible sizing or when pushing. */
    FlexibleConnectedPositionStrategy.prototype._getExactOverlayX = function (position, originPoint, scrollPosition) {
        // Reset any existing styles. This is necessary in case the preferred position has
        // changed since the last `apply`.
        var styles = { left: null, right: null };
        var overlayPoint = this._getOverlayPoint(originPoint, this._overlayRect, position);
        if (this._isPushed) {
            overlayPoint = this._pushOverlayOnScreen(overlayPoint, this._overlayRect, scrollPosition);
        }
        // We want to set either `left` or `right` based on whether the overlay wants to appear "before"
        // or "after" the origin, which determines the direction in which the element will expand.
        // For the horizontal axis, the meaning of "before" and "after" change based on whether the
        // page is in RTL or LTR.
        var horizontalStyleProperty;
        if (this._isRtl()) {
            horizontalStyleProperty = position.overlayX === 'end' ? 'left' : 'right';
        }
        else {
            horizontalStyleProperty = position.overlayX === 'end' ? 'right' : 'left';
        }
        // When we're setting `right`, we adjust the x position such that it is the distance
        // from the right edge of the viewport rather than the left edge.
        if (horizontalStyleProperty === 'right') {
            var documentWidth = this._document.documentElement.clientWidth;
            styles.right = documentWidth - (overlayPoint.x + this._overlayRect.width) + "px";
        }
        else {
            styles.left = coerceCssPixelValue(overlayPoint.x);
        }
        return styles;
    };
    /**
     * Gets the view properties of the trigger and overlay, including whether they are clipped
     * or completely outside the view of any of the strategy's scrollables.
     */
    FlexibleConnectedPositionStrategy.prototype._getScrollVisibility = function () {
        // Note: needs fresh rects since the position could've changed.
        var originBounds = this._getOriginRect();
        var overlayBounds = this._pane.getBoundingClientRect();
        // TODO(jelbourn): instead of needing all of the client rects for these scrolling containers
        // every time, we should be able to use the scrollTop of the containers if the size of those
        // containers hasn't changed.
        var scrollContainerBounds = this._scrollables.map(function (scrollable) {
            return scrollable.getElementRef().nativeElement.getBoundingClientRect();
        });
        return {
            isOriginClipped: isElementClippedByScrolling(originBounds, scrollContainerBounds),
            isOriginOutsideView: isElementScrolledOutsideView(originBounds, scrollContainerBounds),
            isOverlayClipped: isElementClippedByScrolling(overlayBounds, scrollContainerBounds),
            isOverlayOutsideView: isElementScrolledOutsideView(overlayBounds, scrollContainerBounds),
        };
    };
    /** Subtracts the amount that an element is overflowing on an axis from its length. */
    FlexibleConnectedPositionStrategy.prototype._subtractOverflows = function (length) {
        var overflows = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            overflows[_i - 1] = arguments[_i];
        }
        return overflows.reduce(function (currentValue, currentOverflow) {
            return currentValue - Math.max(currentOverflow, 0);
        }, length);
    };
    /** Narrows the given viewport rect by the current _viewportMargin. */
    FlexibleConnectedPositionStrategy.prototype._getNarrowedViewportRect = function () {
        // We recalculate the viewport rect here ourselves, rather than using the ViewportRuler,
        // because we want to use the `clientWidth` and `clientHeight` as the base. The difference
        // being that the client properties don't include the scrollbar, as opposed to `innerWidth`
        // and `innerHeight` that do. This is necessary, because the overlay container uses
        // 100% `width` and `height` which don't include the scrollbar either.
        var width = this._document.documentElement.clientWidth;
        var height = this._document.documentElement.clientHeight;
        var scrollPosition = this._viewportRuler.getViewportScrollPosition();
        return {
            top: scrollPosition.top + this._viewportMargin,
            left: scrollPosition.left + this._viewportMargin,
            right: scrollPosition.left + width - this._viewportMargin,
            bottom: scrollPosition.top + height - this._viewportMargin,
            width: width - (2 * this._viewportMargin),
            height: height - (2 * this._viewportMargin),
        };
    };
    /** Whether the we're dealing with an RTL context */
    FlexibleConnectedPositionStrategy.prototype._isRtl = function () {
        return this._overlayRef.getDirection() === 'rtl';
    };
    /** Determines whether the overlay uses exact or flexible positioning. */
    FlexibleConnectedPositionStrategy.prototype._hasExactPosition = function () {
        return !this._hasFlexibleDimensions || this._isPushed;
    };
    /** Retrieves the offset of a position along the x or y axis. */
    FlexibleConnectedPositionStrategy.prototype._getOffset = function (position, axis) {
        if (axis === 'x') {
            // We don't do something like `position['offset' + axis]` in
            // order to avoid breking minifiers that rename properties.
            return position.offsetX == null ? this._offsetX : position.offsetX;
        }
        return position.offsetY == null ? this._offsetY : position.offsetY;
    };
    /** Validates that the current position match the expected values. */
    FlexibleConnectedPositionStrategy.prototype._validatePositions = function () {
        if (!this._preferredPositions.length) {
            throw Error('FlexibleConnectedPositionStrategy: At least one position is required.');
        }
        // TODO(crisbeto): remove these once Angular's template type
        // checking is advanced enough to catch these cases.
        this._preferredPositions.forEach(function (pair) {
            validateHorizontalPosition('originX', pair.originX);
            validateVerticalPosition('originY', pair.originY);
            validateHorizontalPosition('overlayX', pair.overlayX);
            validateVerticalPosition('overlayY', pair.overlayY);
        });
    };
    /** Adds a single CSS class or an array of classes on the overlay panel. */
    FlexibleConnectedPositionStrategy.prototype._addPanelClasses = function (cssClasses) {
        var _this = this;
        if (this._pane) {
            coerceArray(cssClasses).forEach(function (cssClass) {
                if (cssClass !== '' && _this._appliedPanelClasses.indexOf(cssClass) === -1) {
                    _this._appliedPanelClasses.push(cssClass);
                    _this._pane.classList.add(cssClass);
                }
            });
        }
    };
    /** Clears the classes that the position strategy has applied from the overlay panel. */
    FlexibleConnectedPositionStrategy.prototype._clearPanelClasses = function () {
        var _this = this;
        if (this._pane) {
            this._appliedPanelClasses.forEach(function (cssClass) {
                _this._pane.classList.remove(cssClass);
            });
            this._appliedPanelClasses = [];
        }
    };
    /** Returns the ClientRect of the current origin. */
    FlexibleConnectedPositionStrategy.prototype._getOriginRect = function () {
        var origin = this._origin;
        if (origin instanceof ElementRef) {
            return origin.nativeElement.getBoundingClientRect();
        }
        if (origin instanceof HTMLElement) {
            return origin.getBoundingClientRect();
        }
        var width = origin.width || 0;
        var height = origin.height || 0;
        // If the origin is a point, return a client rect as if it was a 0x0 element at the point.
        return {
            top: origin.y,
            bottom: origin.y + height,
            left: origin.x,
            right: origin.x + width,
            height: height,
            width: width
        };
    };
    return FlexibleConnectedPositionStrategy;
}());
export { FlexibleConnectedPositionStrategy };
/** Shallow-extends a stylesheet object with another stylesheet object. */
function extendStyles(dest, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            dest[key] = source[key];
        }
    }
    return dest;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV6QyxPQUFPLEVBQ0wsOEJBQThCLEVBRzlCLDBCQUEwQixFQUMxQix3QkFBd0IsR0FDekIsTUFBTSxzQkFBc0IsQ0FBQztBQUM5QixPQUFPLEVBQWEsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUV2RCxPQUFPLEVBQUMsNEJBQTRCLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEYsT0FBTyxFQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBSXZFLHFGQUFxRjtBQUNyRiw2RkFBNkY7QUFFN0YscURBQXFEO0FBQ3JELElBQU0sZ0JBQWdCLEdBQUcsNkNBQTZDLENBQUM7QUFRdkU7Ozs7OztHQU1HO0FBQ0g7SUEyRkUsMkNBQ0ksV0FBb0QsRUFBVSxjQUE2QixFQUNuRixTQUFtQixFQUFVLFNBQW1CLEVBQ2hELGlCQUFtQztRQUZtQixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUNuRixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNoRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBdkYvQywwRkFBMEY7UUFDbEYseUJBQW9CLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUMsQ0FBQztRQUVyRCxnRUFBZ0U7UUFDeEQsY0FBUyxHQUFHLEtBQUssQ0FBQztRQUUxQix1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R0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBRTVCLElBQUksTUFBTSxZQUFZLFVBQVUsRUFBRTtZQUNoQyxPQUFPLE1BQU0sQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsQ0FBQztTQUNyRDtRQUVELElBQUksTUFBTSxZQUFZLFdBQVcsRUFBRTtZQUNqQyxPQUFPLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1NBQ3ZDO1FBRUQsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7UUFDaEMsSUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFFbEMsMEZBQTBGO1FBQzFGLE9BQU87WUFDTCxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDYixNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNO1lBQ3pCLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNkLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUs7WUFDdkIsTUFBTSxRQUFBO1lBQ04sS0FBSyxPQUFBO1NBQ04sQ0FBQztJQUNKLENBQUM7SUFDSCx3Q0FBQztBQUFELENBQUMsQUE3aUNELElBNmlDQzs7QUFnRUQsMEVBQTBFO0FBQzFFLFNBQVMsWUFBWSxDQUFDLElBQXlCLEVBQUUsTUFBMkI7SUFDMUUsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7UUFDdEIsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7S0FDRjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Bvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vcG9zaXRpb24tc3RyYXRlZ3knO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Vmlld3BvcnRSdWxlciwgQ2RrU2Nyb2xsYWJsZSwgVmlld3BvcnRTY3JvbGxQb3NpdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3Njcm9sbGluZyc7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2UsXG4gIENvbm5lY3Rpb25Qb3NpdGlvblBhaXIsXG4gIFNjcm9sbGluZ1Zpc2liaWxpdHksXG4gIHZhbGlkYXRlSG9yaXpvbnRhbFBvc2l0aW9uLFxuICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24sXG59IGZyb20gJy4vY29ubmVjdGVkLXBvc2l0aW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9uLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7T3ZlcmxheVJlZmVyZW5jZX0gZnJvbSAnLi4vb3ZlcmxheS1yZWZlcmVuY2UnO1xuaW1wb3J0IHtpc0VsZW1lbnRTY3JvbGxlZE91dHNpZGVWaWV3LCBpc0VsZW1lbnRDbGlwcGVkQnlTY3JvbGxpbmd9IGZyb20gJy4vc2Nyb2xsLWNsaXAnO1xuaW1wb3J0IHtjb2VyY2VDc3NQaXhlbFZhbHVlLCBjb2VyY2VBcnJheX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4uL292ZXJsYXktY29udGFpbmVyJztcblxuLy8gVE9ETzogcmVmYWN0b3IgY2xpcHBpbmcgZGV0ZWN0aW9uIGludG8gYSBzZXBhcmF0ZSB0aGluZyAocGFydCBvZiBzY3JvbGxpbmcgbW9kdWxlKVxuLy8gVE9ETzogZG9lc24ndCBoYW5kbGUgYm90aCBmbGV4aWJsZSB3aWR0aCBhbmQgaGVpZ2h0IHdoZW4gaXQgaGFzIHRvIHNjcm9sbCBhbG9uZyBib3RoIGF4aXMuXG5cbi8qKiBDbGFzcyB0byBiZSBhZGRlZCB0byB0aGUgb3ZlcmxheSBib3VuZGluZyBib3guICovXG5jb25zdCBib3VuZGluZ0JveENsYXNzID0gJ2Nkay1vdmVybGF5LWNvbm5lY3RlZC1wb3NpdGlvbi1ib3VuZGluZy1ib3gnO1xuXG4vKiogUG9zc2libGUgdmFsdWVzIHRoYXQgY2FuIGJlIHNldCBhcyB0aGUgb3JpZ2luIG9mIGEgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LiAqL1xuZXhwb3J0IHR5cGUgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luID0gRWxlbWVudFJlZiB8IEhUTUxFbGVtZW50IHwgUG9pbnQgJiB7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59O1xuXG4vKipcbiAqIEEgc3RyYXRlZ3kgZm9yIHBvc2l0aW9uaW5nIG92ZXJsYXlzLiBVc2luZyB0aGlzIHN0cmF0ZWd5LCBhbiBvdmVybGF5IGlzIGdpdmVuIGFuXG4gKiBpbXBsaWNpdCBwb3NpdGlvbiByZWxhdGl2ZSBzb21lIG9yaWdpbiBlbGVtZW50LiBUaGUgcmVsYXRpdmUgcG9zaXRpb24gaXMgZGVmaW5lZCBpbiB0ZXJtcyBvZlxuICogYSBwb2ludCBvbiB0aGUgb3JpZ2luIGVsZW1lbnQgdGhhdCBpcyBjb25uZWN0ZWQgdG8gYSBwb2ludCBvbiB0aGUgb3ZlcmxheSBlbGVtZW50LiBGb3IgZXhhbXBsZSxcbiAqIGEgYmFzaWMgZHJvcGRvd24gaXMgY29ubmVjdGluZyB0aGUgYm90dG9tLWxlZnQgY29ybmVyIG9mIHRoZSBvcmlnaW4gdG8gdGhlIHRvcC1sZWZ0IGNvcm5lclxuICogb2YgdGhlIG92ZXJsYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kgaW1wbGVtZW50cyBQb3NpdGlvblN0cmF0ZWd5IHtcbiAgLyoqIFRoZSBvdmVybGF5IHRvIHdoaWNoIHRoaXMgc3RyYXRlZ3kgaXMgYXR0YWNoZWQuICovXG4gIHByaXZhdGUgX292ZXJsYXlSZWY6IE92ZXJsYXlSZWZlcmVuY2U7XG5cbiAgLyoqIFdoZXRoZXIgd2UncmUgcGVyZm9ybWluZyB0aGUgdmVyeSBmaXJzdCBwb3NpdGlvbmluZyBvZiB0aGUgb3ZlcmxheS4gKi9cbiAgcHJpdmF0ZSBfaXNJbml0aWFsUmVuZGVyOiBib29sZWFuO1xuXG4gIC8qKiBMYXN0IHNpemUgdXNlZCBmb3IgdGhlIGJvdW5kaW5nIGJveC4gVXNlZCB0byBhdm9pZCByZXNpemluZyB0aGUgb3ZlcmxheSBhZnRlciBvcGVuLiAqL1xuICBwcml2YXRlIF9sYXN0Qm91bmRpbmdCb3hTaXplID0ge3dpZHRoOiAwLCBoZWlnaHQ6IDB9O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IHdhcyBwdXNoZWQgaW4gYSBwcmV2aW91cyBwb3NpdGlvbmluZy4gKi9cbiAgcHJpdmF0ZSBfaXNQdXNoZWQgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBjYW4gYmUgcHVzaGVkIG9uLXNjcmVlbiBvbiB0aGUgaW5pdGlhbCBvcGVuLiAqL1xuICBwcml2YXRlIF9jYW5QdXNoID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBjYW4gZ3JvdyB2aWEgZmxleGlibGUgd2lkdGgvaGVpZ2h0IGFmdGVyIHRoZSBpbml0aWFsIG9wZW4uICovXG4gIHByaXZhdGUgX2dyb3dBZnRlck9wZW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSdzIHdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGNvbnN0cmFpbmVkIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9oYXNGbGV4aWJsZURpbWVuc2lvbnMgPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IHBvc2l0aW9uIGlzIGxvY2tlZC4gKi9cbiAgcHJpdmF0ZSBfcG9zaXRpb25Mb2NrZWQgPSBmYWxzZTtcblxuICAvKiogQ2FjaGVkIG9yaWdpbiBkaW1lbnNpb25zICovXG4gIHByaXZhdGUgX29yaWdpblJlY3Q6IENsaWVudFJlY3Q7XG5cbiAgLyoqIENhY2hlZCBvdmVybGF5IGRpbWVuc2lvbnMgKi9cbiAgcHJpdmF0ZSBfb3ZlcmxheVJlY3Q6IENsaWVudFJlY3Q7XG5cbiAgLyoqIENhY2hlZCB2aWV3cG9ydCBkaW1lbnNpb25zICovXG4gIHByaXZhdGUgX3ZpZXdwb3J0UmVjdDogQ2xpZW50UmVjdDtcblxuICAvKiogQW1vdW50IG9mIHNwYWNlIHRoYXQgbXVzdCBiZSBtYWludGFpbmVkIGJldHdlZW4gdGhlIG92ZXJsYXkgYW5kIHRoZSBlZGdlIG9mIHRoZSB2aWV3cG9ydC4gKi9cbiAgcHJpdmF0ZSBfdmlld3BvcnRNYXJnaW4gPSAwO1xuXG4gIC8qKiBUaGUgU2Nyb2xsYWJsZSBjb250YWluZXJzIHVzZWQgdG8gY2hlY2sgc2Nyb2xsYWJsZSB2aWV3IHByb3BlcnRpZXMgb24gcG9zaXRpb24gY2hhbmdlLiAqL1xuICBwcml2YXRlIF9zY3JvbGxhYmxlczogQ2RrU2Nyb2xsYWJsZVtdID0gW107XG5cbiAgLyoqIE9yZGVyZWQgbGlzdCBvZiBwcmVmZXJyZWQgcG9zaXRpb25zLCBmcm9tIG1vc3QgdG8gbGVhc3QgZGVzaXJhYmxlLiAqL1xuICBfcHJlZmVycmVkUG9zaXRpb25zOiBDb25uZWN0aW9uUG9zaXRpb25QYWlyW10gPSBbXTtcblxuICAvKiogVGhlIG9yaWdpbiBlbGVtZW50IGFnYWluc3Qgd2hpY2ggdGhlIG92ZXJsYXkgd2lsbCBiZSBwb3NpdGlvbmVkLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbjtcblxuICAvKiogVGhlIG92ZXJsYXkgcGFuZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wYW5lOiBIVE1MRWxlbWVudDtcblxuICAvKiogV2hldGhlciB0aGUgc3RyYXRlZ3kgaGFzIGJlZW4gZGlzcG9zZWQgb2YgYWxyZWFkeS4gKi9cbiAgcHJpdmF0ZSBfaXNEaXNwb3NlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogUGFyZW50IGVsZW1lbnQgZm9yIHRoZSBvdmVybGF5IHBhbmVsIHVzZWQgdG8gY29uc3RyYWluIHRoZSBvdmVybGF5IHBhbmVsJ3Mgc2l6ZSB0byBmaXRcbiAgICogd2l0aGluIHRoZSB2aWV3cG9ydC5cbiAgICovXG4gIHByaXZhdGUgX2JvdW5kaW5nQm94OiBIVE1MRWxlbWVudCB8IG51bGw7XG5cbiAgLyoqIFRoZSBsYXN0IHBvc2l0aW9uIHRvIGhhdmUgYmVlbiBjYWxjdWxhdGVkIGFzIHRoZSBiZXN0IGZpdCBwb3NpdGlvbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdFBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbiB8IG51bGw7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuZXZlciB0aGUgcG9zaXRpb24gY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfcG9zaXRpb25DaGFuZ2VzID0gbmV3IFN1YmplY3Q8Q29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlPigpO1xuXG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gdmlld3BvcnQgc2l6ZSBjaGFuZ2VzLiAqL1xuICBwcml2YXRlIF9yZXNpemVTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIERlZmF1bHQgb2Zmc2V0IGZvciB0aGUgb3ZlcmxheSBhbG9uZyB0aGUgeCBheGlzLiAqL1xuICBwcml2YXRlIF9vZmZzZXRYID0gMDtcblxuICAvKiogRGVmYXVsdCBvZmZzZXQgZm9yIHRoZSBvdmVybGF5IGFsb25nIHRoZSB5IGF4aXMuICovXG4gIHByaXZhdGUgX29mZnNldFkgPSAwO1xuXG4gIC8qKiBTZWxlY3RvciB0byBiZSB1c2VkIHdoZW4gZmluZGluZyB0aGUgZWxlbWVudHMgb24gd2hpY2ggdG8gc2V0IHRoZSB0cmFuc2Zvcm0gb3JpZ2luLiAqL1xuICBwcml2YXRlIF90cmFuc2Zvcm1PcmlnaW5TZWxlY3Rvcjogc3RyaW5nO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgQ1NTIGNsYXNzZXMgdGhhdCB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgaGFzIGFwcGxpZWQgb24gdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX2FwcGxpZWRQYW5lbENsYXNzZXM6IHN0cmluZ1tdID0gW107XG5cbiAgLyoqIEFtb3VudCBieSB3aGljaCB0aGUgb3ZlcmxheSB3YXMgcHVzaGVkIGluIGVhY2ggYXhpcyBkdXJpbmcgdGhlIGxhc3QgdGltZSBpdCB3YXMgcG9zaXRpb25lZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNQdXNoQW1vdW50OiB7eDogbnVtYmVyLCB5OiBudW1iZXJ9IHwgbnVsbDtcblxuICAvKiogT2JzZXJ2YWJsZSBzZXF1ZW5jZSBvZiBwb3NpdGlvbiBjaGFuZ2VzLiAqL1xuICBwb3NpdGlvbkNoYW5nZXM6IE9ic2VydmFibGU8Q29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlPiA9XG4gICAgICB0aGlzLl9wb3NpdGlvbkNoYW5nZXMuYXNPYnNlcnZhYmxlKCk7XG5cbiAgLyoqIE9yZGVyZWQgbGlzdCBvZiBwcmVmZXJyZWQgcG9zaXRpb25zLCBmcm9tIG1vc3QgdG8gbGVhc3QgZGVzaXJhYmxlLiAqL1xuICBnZXQgcG9zaXRpb25zKCk6IENvbm5lY3Rpb25Qb3NpdGlvblBhaXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucztcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29ubmVjdGVkVG86IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbiwgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcixcbiAgICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCwgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgcHJpdmF0ZSBfb3ZlcmxheUNvbnRhaW5lcjogT3ZlcmxheUNvbnRhaW5lcikge1xuICAgIHRoaXMuc2V0T3JpZ2luKGNvbm5lY3RlZFRvKTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGlzIHBvc2l0aW9uIHN0cmF0ZWd5IHRvIGFuIG92ZXJsYXkuICovXG4gIGF0dGFjaChvdmVybGF5UmVmOiBPdmVybGF5UmVmZXJlbmNlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYgJiYgb3ZlcmxheVJlZiAhPT0gdGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhyb3cgRXJyb3IoJ1RoaXMgcG9zaXRpb24gc3RyYXRlZ3kgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhbiBvdmVybGF5Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsaWRhdGVQb3NpdGlvbnMoKTtcblxuICAgIG92ZXJsYXlSZWYuaG9zdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChib3VuZGluZ0JveENsYXNzKTtcblxuICAgIHRoaXMuX292ZXJsYXlSZWYgPSBvdmVybGF5UmVmO1xuICAgIHRoaXMuX2JvdW5kaW5nQm94ID0gb3ZlcmxheVJlZi5ob3N0RWxlbWVudDtcbiAgICB0aGlzLl9wYW5lID0gb3ZlcmxheVJlZi5vdmVybGF5RWxlbWVudDtcbiAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gZmFsc2U7XG4gICAgdGhpcy5faXNJbml0aWFsUmVuZGVyID0gdHJ1ZTtcbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuY2hhbmdlKCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIC8vIFdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkLCB3ZSB3YW50IHRvIHRyaWdnZXIgdGhlIG5leHQgcmVwb3NpdGlvbiBhcyBpZiBpdFxuICAgICAgLy8gd2FzIGFuIGluaXRpYWwgcmVuZGVyLCBpbiBvcmRlciBmb3IgdGhlIHN0cmF0ZWd5IHRvIHBpY2sgYSBuZXcgb3B0aW1hbCBwb3NpdGlvbixcbiAgICAgIC8vIG90aGVyd2lzZSBwb3NpdGlvbiBsb2NraW5nIHdpbGwgY2F1c2UgaXQgdG8gc3RheSBhdCB0aGUgb2xkIG9uZS5cbiAgICAgIHRoaXMuX2lzSW5pdGlhbFJlbmRlciA9IHRydWU7XG4gICAgICB0aGlzLmFwcGx5KCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgcG9zaXRpb24gb2YgdGhlIG92ZXJsYXkgZWxlbWVudCwgdXNpbmcgd2hpY2hldmVyIHByZWZlcnJlZCBwb3NpdGlvbiByZWxhdGl2ZVxuICAgKiB0byB0aGUgb3JpZ2luIGJlc3QgZml0cyBvbi1zY3JlZW4uXG4gICAqXG4gICAqIFRoZSBzZWxlY3Rpb24gb2YgYSBwb3NpdGlvbiBnb2VzIGFzIGZvbGxvd3M6XG4gICAqICAtIElmIGFueSBwb3NpdGlvbnMgZml0IGNvbXBsZXRlbHkgd2l0aGluIHRoZSB2aWV3cG9ydCBhcy1pcyxcbiAgICogICAgICBjaG9vc2UgdGhlIGZpcnN0IHBvc2l0aW9uIHRoYXQgZG9lcyBzby5cbiAgICogIC0gSWYgZmxleGlibGUgZGltZW5zaW9ucyBhcmUgZW5hYmxlZCBhbmQgYXQgbGVhc3Qgb25lIHNhdGlmaWVzIHRoZSBnaXZlbiBtaW5pbXVtIHdpZHRoL2hlaWdodCxcbiAgICogICAgICBjaG9vc2UgdGhlIHBvc2l0aW9uIHdpdGggdGhlIGdyZWF0ZXN0IGF2YWlsYWJsZSBzaXplIG1vZGlmaWVkIGJ5IHRoZSBwb3NpdGlvbnMnIHdlaWdodC5cbiAgICogIC0gSWYgcHVzaGluZyBpcyBlbmFibGVkLCB0YWtlIHRoZSBwb3NpdGlvbiB0aGF0IHdlbnQgb2ZmLXNjcmVlbiB0aGUgbGVhc3QgYW5kIHB1c2ggaXRcbiAgICogICAgICBvbi1zY3JlZW4uXG4gICAqICAtIElmIG5vbmUgb2YgdGhlIHByZXZpb3VzIGNyaXRlcmlhIHdlcmUgbWV0LCB1c2UgdGhlIHBvc2l0aW9uIHRoYXQgZ29lcyBvZmYtc2NyZWVuIHRoZSBsZWFzdC5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgYXBwbHkoKTogdm9pZCB7XG4gICAgLy8gV2Ugc2hvdWxkbid0IGRvIGFueXRoaW5nIGlmIHRoZSBzdHJhdGVneSB3YXMgZGlzcG9zZWQgb3Igd2UncmUgb24gdGhlIHNlcnZlci5cbiAgICBpZiAodGhpcy5faXNEaXNwb3NlZCB8fCAhdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHBvc2l0aW9uIGhhcyBiZWVuIGFwcGxpZWQgYWxyZWFkeSAoZS5nLiB3aGVuIHRoZSBvdmVybGF5IHdhcyBvcGVuZWQpIGFuZCB0aGVcbiAgICAvLyBjb25zdW1lciBvcHRlZCBpbnRvIGxvY2tpbmcgaW4gdGhlIHBvc2l0aW9uLCByZS11c2UgdGhlIG9sZCBwb3NpdGlvbiwgaW4gb3JkZXIgdG9cbiAgICAvLyBwcmV2ZW50IHRoZSBvdmVybGF5IGZyb20ganVtcGluZyBhcm91bmQuXG4gICAgaWYgKCF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgdGhpcy5fcG9zaXRpb25Mb2NrZWQgJiYgdGhpcy5fbGFzdFBvc2l0aW9uKSB7XG4gICAgICB0aGlzLnJlYXBwbHlMYXN0UG9zaXRpb24oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jbGVhclBhbmVsQ2xhc3NlcygpO1xuICAgIHRoaXMuX3Jlc2V0T3ZlcmxheUVsZW1lbnRTdHlsZXMoKTtcbiAgICB0aGlzLl9yZXNldEJvdW5kaW5nQm94U3R5bGVzKCk7XG5cbiAgICAvLyBXZSBuZWVkIHRoZSBib3VuZGluZyByZWN0cyBmb3IgdGhlIG9yaWdpbiBhbmQgdGhlIG92ZXJsYXkgdG8gZGV0ZXJtaW5lIGhvdyB0byBwb3NpdGlvblxuICAgIC8vIHRoZSBvdmVybGF5IHJlbGF0aXZlIHRvIHRoZSBvcmlnaW4uXG4gICAgLy8gV2UgdXNlIHRoZSB2aWV3cG9ydCByZWN0IHRvIGRldGVybWluZSB3aGV0aGVyIGEgcG9zaXRpb24gd291bGQgZ28gb2ZmLXNjcmVlbi5cbiAgICB0aGlzLl92aWV3cG9ydFJlY3QgPSB0aGlzLl9nZXROYXJyb3dlZFZpZXdwb3J0UmVjdCgpO1xuICAgIHRoaXMuX29yaWdpblJlY3QgPSB0aGlzLl9nZXRPcmlnaW5SZWN0KCk7XG4gICAgdGhpcy5fb3ZlcmxheVJlY3QgPSB0aGlzLl9wYW5lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgY29uc3Qgb3JpZ2luUmVjdCA9IHRoaXMuX29yaWdpblJlY3Q7XG4gICAgY29uc3Qgb3ZlcmxheVJlY3QgPSB0aGlzLl9vdmVybGF5UmVjdDtcbiAgICBjb25zdCB2aWV3cG9ydFJlY3QgPSB0aGlzLl92aWV3cG9ydFJlY3Q7XG5cbiAgICAvLyBQb3NpdGlvbnMgd2hlcmUgdGhlIG92ZXJsYXkgd2lsbCBmaXQgd2l0aCBmbGV4aWJsZSBkaW1lbnNpb25zLlxuICAgIGNvbnN0IGZsZXhpYmxlRml0czogRmxleGlibGVGaXRbXSA9IFtdO1xuXG4gICAgLy8gRmFsbGJhY2sgaWYgbm9uZSBvZiB0aGUgcHJlZmVycmVkIHBvc2l0aW9ucyBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC5cbiAgICBsZXQgZmFsbGJhY2s6IEZhbGxiYWNrUG9zaXRpb24gfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGVhY2ggb2YgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgbG9va2luZyBmb3IgYSBnb29kIGZpdC5cbiAgICAvLyBJZiBhIGdvb2QgZml0IGlzIGZvdW5kLCBpdCB3aWxsIGJlIGFwcGxpZWQgaW1tZWRpYXRlbHkuXG4gICAgZm9yIChsZXQgcG9zIG9mIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucykge1xuICAgICAgLy8gR2V0IHRoZSBleGFjdCAoeCwgeSkgY29vcmRpbmF0ZSBmb3IgdGhlIHBvaW50LW9mLW9yaWdpbiBvbiB0aGUgb3JpZ2luIGVsZW1lbnQuXG4gICAgICBsZXQgb3JpZ2luUG9pbnQgPSB0aGlzLl9nZXRPcmlnaW5Qb2ludChvcmlnaW5SZWN0LCBwb3MpO1xuXG4gICAgICAvLyBGcm9tIHRoYXQgcG9pbnQtb2Ytb3JpZ2luLCBnZXQgdGhlIGV4YWN0ICh4LCB5KSBjb29yZGluYXRlIGZvciB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIHRoZVxuICAgICAgLy8gb3ZlcmxheSBpbiB0aGlzIHBvc2l0aW9uLiBXZSB1c2UgdGhlIHRvcC1sZWZ0IGNvcm5lciBmb3IgY2FsY3VsYXRpb25zIGFuZCBsYXRlciB0cmFuc2xhdGVcbiAgICAgIC8vIHRoaXMgaW50byBhbiBhcHByb3ByaWF0ZSAodG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0KSBzdHlsZS5cbiAgICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIG92ZXJsYXlSZWN0LCBwb3MpO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgaG93IHdlbGwgdGhlIG92ZXJsYXkgd291bGQgZml0IGludG8gdGhlIHZpZXdwb3J0IHdpdGggdGhpcyBwb2ludC5cbiAgICAgIGxldCBvdmVybGF5Rml0ID0gdGhpcy5fZ2V0T3ZlcmxheUZpdChvdmVybGF5UG9pbnQsIG92ZXJsYXlSZWN0LCB2aWV3cG9ydFJlY3QsIHBvcyk7XG5cbiAgICAgIC8vIElmIHRoZSBvdmVybGF5LCB3aXRob3V0IGFueSBmdXJ0aGVyIHdvcmssIGZpdHMgaW50byB0aGUgdmlld3BvcnQsIHVzZSB0aGlzIHBvc2l0aW9uLlxuICAgICAgaWYgKG92ZXJsYXlGaXQuaXNDb21wbGV0ZWx5V2l0aGluVmlld3BvcnQpIHtcbiAgICAgICAgdGhpcy5faXNQdXNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihwb3MsIG9yaWdpblBvaW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgb3ZlcmxheSBoYXMgZmxleGlibGUgZGltZW5zaW9ucywgd2UgY2FuIHVzZSB0aGlzIHBvc2l0aW9uXG4gICAgICAvLyBzbyBsb25nIGFzIHRoZXJlJ3MgZW5vdWdoIHNwYWNlIGZvciB0aGUgbWluaW11bSBkaW1lbnNpb25zLlxuICAgICAgaWYgKHRoaXMuX2NhbkZpdFdpdGhGbGV4aWJsZURpbWVuc2lvbnMob3ZlcmxheUZpdCwgb3ZlcmxheVBvaW50LCB2aWV3cG9ydFJlY3QpKSB7XG4gICAgICAgIC8vIFNhdmUgcG9zaXRpb25zIHdoZXJlIHRoZSBvdmVybGF5IHdpbGwgZml0IHdpdGggZmxleGlibGUgZGltZW5zaW9ucy4gV2Ugd2lsbCB1c2UgdGhlc2VcbiAgICAgICAgLy8gaWYgbm9uZSBvZiB0aGUgcG9zaXRpb25zIGZpdCAqd2l0aG91dCogZmxleGlibGUgZGltZW5zaW9ucy5cbiAgICAgICAgZmxleGlibGVGaXRzLnB1c2goe1xuICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgb3JpZ2luOiBvcmlnaW5Qb2ludCxcbiAgICAgICAgICBvdmVybGF5UmVjdCxcbiAgICAgICAgICBib3VuZGluZ0JveFJlY3Q6IHRoaXMuX2NhbGN1bGF0ZUJvdW5kaW5nQm94UmVjdChvcmlnaW5Qb2ludCwgcG9zKVxuICAgICAgICB9KTtcblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgcHJlZmVycmVkIHBvc2l0aW9uIGRvZXMgbm90IGZpdCBvbiB0aGUgc2NyZWVuLCByZW1lbWJlciB0aGUgcG9zaXRpb25cbiAgICAgIC8vIGlmIGl0IGhhcyBtb3JlIHZpc2libGUgYXJlYSBvbi1zY3JlZW4gdGhhbiB3ZSd2ZSBzZWVuIGFuZCBtb3ZlIG9udG8gdGhlIG5leHQgcHJlZmVycmVkXG4gICAgICAvLyBwb3NpdGlvbi5cbiAgICAgIGlmICghZmFsbGJhY2sgfHwgZmFsbGJhY2sub3ZlcmxheUZpdC52aXNpYmxlQXJlYSA8IG92ZXJsYXlGaXQudmlzaWJsZUFyZWEpIHtcbiAgICAgICAgZmFsbGJhY2sgPSB7b3ZlcmxheUZpdCwgb3ZlcmxheVBvaW50LCBvcmlnaW5Qb2ludCwgcG9zaXRpb246IHBvcywgb3ZlcmxheVJlY3R9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgcG9zaXRpb25zIHdoZXJlIHRoZSBvdmVybGF5IHdvdWxkIGZpdCB3aXRoIGZsZXhpYmxlIGRpbWVuc2lvbnMsIGNob29zZSB0aGVcbiAgICAvLyBvbmUgdGhhdCBoYXMgdGhlIGdyZWF0ZXN0IGFyZWEgYXZhaWxhYmxlIG1vZGlmaWVkIGJ5IHRoZSBwb3NpdGlvbidzIHdlaWdodFxuICAgIGlmIChmbGV4aWJsZUZpdHMubGVuZ3RoKSB7XG4gICAgICBsZXQgYmVzdEZpdDogRmxleGlibGVGaXQgfCBudWxsID0gbnVsbDtcbiAgICAgIGxldCBiZXN0U2NvcmUgPSAtMTtcbiAgICAgIGZvciAoY29uc3QgZml0IG9mIGZsZXhpYmxlRml0cykge1xuICAgICAgICBjb25zdCBzY29yZSA9XG4gICAgICAgICAgICBmaXQuYm91bmRpbmdCb3hSZWN0LndpZHRoICogZml0LmJvdW5kaW5nQm94UmVjdC5oZWlnaHQgKiAoZml0LnBvc2l0aW9uLndlaWdodCB8fCAxKTtcbiAgICAgICAgaWYgKHNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgICAgYmVzdEZpdCA9IGZpdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9pc1B1c2hlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fYXBwbHlQb3NpdGlvbihiZXN0Rml0IS5wb3NpdGlvbiwgYmVzdEZpdCEub3JpZ2luKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXaGVuIG5vbmUgb2YgdGhlIHByZWZlcnJlZCBwb3NpdGlvbnMgZml0IHdpdGhpbiB0aGUgdmlld3BvcnQsIHRha2UgdGhlIHBvc2l0aW9uXG4gICAgLy8gdGhhdCB3ZW50IG9mZi1zY3JlZW4gdGhlIGxlYXN0IGFuZCBhdHRlbXB0IHRvIHB1c2ggaXQgb24tc2NyZWVuLlxuICAgIGlmICh0aGlzLl9jYW5QdXNoKSB7XG4gICAgICAvLyBUT0RPKGplbGJvdXJuKTogYWZ0ZXIgcHVzaGluZywgdGhlIG9wZW5pbmcgXCJkaXJlY3Rpb25cIiBvZiB0aGUgb3ZlcmxheSBtaWdodCBub3QgbWFrZSBzZW5zZS5cbiAgICAgIHRoaXMuX2lzUHVzaGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24oZmFsbGJhY2shLnBvc2l0aW9uLCBmYWxsYmFjayEub3JpZ2luUG9pbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFsbCBvcHRpb25zIGZvciBnZXR0aW5nIHRoZSBvdmVybGF5IHdpdGhpbiB0aGUgdmlld3BvcnQgaGF2ZSBiZWVuIGV4aGF1c3RlZCwgc28gZ28gd2l0aCB0aGVcbiAgICAvLyBwb3NpdGlvbiB0aGF0IHdlbnQgb2ZmLXNjcmVlbiB0aGUgbGVhc3QuXG4gICAgdGhpcy5fYXBwbHlQb3NpdGlvbihmYWxsYmFjayEucG9zaXRpb24sIGZhbGxiYWNrIS5vcmlnaW5Qb2ludCk7XG4gIH1cblxuICBkZXRhY2goKTogdm9pZCB7XG4gICAgdGhpcy5fY2xlYXJQYW5lbENsYXNzZXMoKTtcbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3ByZXZpb3VzUHVzaEFtb3VudCA9IG51bGw7XG4gICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogQ2xlYW51cCBhZnRlciB0aGUgZWxlbWVudCBnZXRzIGRlc3Ryb3llZC4gKi9cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faXNEaXNwb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdlIGNhbid0IHVzZSBgX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXNgIGhlcmUsIGJlY2F1c2UgaXQgcmVzZXRzXG4gICAgLy8gc29tZSBwcm9wZXJ0aWVzIHRvIHplcm8sIHJhdGhlciB0aGFuIHJlbW92aW5nIHRoZW0uXG4gICAgaWYgKHRoaXMuX2JvdW5kaW5nQm94KSB7XG4gICAgICBleHRlbmRTdHlsZXModGhpcy5fYm91bmRpbmdCb3guc3R5bGUsIHtcbiAgICAgICAgdG9wOiAnJyxcbiAgICAgICAgbGVmdDogJycsXG4gICAgICAgIHJpZ2h0OiAnJyxcbiAgICAgICAgYm90dG9tOiAnJyxcbiAgICAgICAgaGVpZ2h0OiAnJyxcbiAgICAgICAgd2lkdGg6ICcnLFxuICAgICAgICBhbGlnbkl0ZW1zOiAnJyxcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6ICcnLFxuICAgICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmhvc3RFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYm91bmRpbmdCb3hDbGFzcyk7XG4gICAgfVxuXG4gICAgdGhpcy5kZXRhY2goKTtcbiAgICB0aGlzLl9wb3NpdGlvbkNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vdmVybGF5UmVmID0gdGhpcy5fYm91bmRpbmdCb3ggPSBudWxsITtcbiAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIHJlLWFsaWducyB0aGUgb3ZlcmxheSBlbGVtZW50IHdpdGggdGhlIHRyaWdnZXIgaW4gaXRzIGxhc3QgY2FsY3VsYXRlZCBwb3NpdGlvbixcbiAgICogZXZlbiBpZiBhIHBvc2l0aW9uIGhpZ2hlciBpbiB0aGUgXCJwcmVmZXJyZWQgcG9zaXRpb25zXCIgbGlzdCB3b3VsZCBub3cgZml0LiBUaGlzXG4gICAqIGFsbG93cyBvbmUgdG8gcmUtYWxpZ24gdGhlIHBhbmVsIHdpdGhvdXQgY2hhbmdpbmcgdGhlIG9yaWVudGF0aW9uIG9mIHRoZSBwYW5lbC5cbiAgICovXG4gIHJlYXBwbHlMYXN0UG9zaXRpb24oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0Rpc3Bvc2VkICYmICghdGhpcy5fcGxhdGZvcm0gfHwgdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSkge1xuICAgICAgdGhpcy5fb3JpZ2luUmVjdCA9IHRoaXMuX2dldE9yaWdpblJlY3QoKTtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWN0ID0gdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHRoaXMuX3ZpZXdwb3J0UmVjdCA9IHRoaXMuX2dldE5hcnJvd2VkVmlld3BvcnRSZWN0KCk7XG5cbiAgICAgIGNvbnN0IGxhc3RQb3NpdGlvbiA9IHRoaXMuX2xhc3RQb3NpdGlvbiB8fCB0aGlzLl9wcmVmZXJyZWRQb3NpdGlvbnNbMF07XG4gICAgICBjb25zdCBvcmlnaW5Qb2ludCA9IHRoaXMuX2dldE9yaWdpblBvaW50KHRoaXMuX29yaWdpblJlY3QsIGxhc3RQb3NpdGlvbik7XG5cbiAgICAgIHRoaXMuX2FwcGx5UG9zaXRpb24obGFzdFBvc2l0aW9uLCBvcmlnaW5Qb2ludCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxpc3Qgb2YgU2Nyb2xsYWJsZSBjb250YWluZXJzIHRoYXQgaG9zdCB0aGUgb3JpZ2luIGVsZW1lbnQgc28gdGhhdFxuICAgKiBvbiByZXBvc2l0aW9uIHdlIGNhbiBldmFsdWF0ZSBpZiBpdCBvciB0aGUgb3ZlcmxheSBoYXMgYmVlbiBjbGlwcGVkIG9yIG91dHNpZGUgdmlldy4gRXZlcnlcbiAgICogU2Nyb2xsYWJsZSBtdXN0IGJlIGFuIGFuY2VzdG9yIGVsZW1lbnQgb2YgdGhlIHN0cmF0ZWd5J3Mgb3JpZ2luIGVsZW1lbnQuXG4gICAqL1xuICB3aXRoU2Nyb2xsYWJsZUNvbnRhaW5lcnMoc2Nyb2xsYWJsZXM6IENka1Njcm9sbGFibGVbXSk6IHRoaXMge1xuICAgIHRoaXMuX3Njcm9sbGFibGVzID0gc2Nyb2xsYWJsZXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBuZXcgcHJlZmVycmVkIHBvc2l0aW9ucy5cbiAgICogQHBhcmFtIHBvc2l0aW9ucyBMaXN0IG9mIHBvc2l0aW9ucyBvcHRpb25zIGZvciB0aGlzIG92ZXJsYXkuXG4gICAqL1xuICB3aXRoUG9zaXRpb25zKHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXSk6IHRoaXMge1xuICAgIHRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucyA9IHBvc2l0aW9ucztcblxuICAgIC8vIElmIHRoZSBsYXN0IGNhbGN1bGF0ZWQgcG9zaXRpb24gb2JqZWN0IGlzbid0IHBhcnQgb2YgdGhlIHBvc2l0aW9ucyBhbnltb3JlLCBjbGVhclxuICAgIC8vIGl0IGluIG9yZGVyIHRvIGF2b2lkIGl0IGJlaW5nIHBpY2tlZCB1cCBpZiB0aGUgY29uc3VtZXIgdHJpZXMgdG8gcmUtYXBwbHkuXG4gICAgaWYgKHBvc2l0aW9ucy5pbmRleE9mKHRoaXMuX2xhc3RQb3NpdGlvbiEpID09PSAtMSkge1xuICAgICAgdGhpcy5fbGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl92YWxpZGF0ZVBvc2l0aW9ucygpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG1pbmltdW0gZGlzdGFuY2UgdGhlIG92ZXJsYXkgbWF5IGJlIHBvc2l0aW9uZWQgdG8gdGhlIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0LlxuICAgKiBAcGFyYW0gbWFyZ2luIFJlcXVpcmVkIG1hcmdpbiBiZXR3ZWVuIHRoZSBvdmVybGF5IGFuZCB0aGUgdmlld3BvcnQgZWRnZSBpbiBwaXhlbHMuXG4gICAqL1xuICB3aXRoVmlld3BvcnRNYXJnaW4obWFyZ2luOiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLl92aWV3cG9ydE1hcmdpbiA9IG1hcmdpbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBTZXRzIHdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgd2l0aEZsZXhpYmxlRGltZW5zaW9ucyhmbGV4aWJsZURpbWVuc2lvbnMgPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zID0gZmxleGlibGVEaW1lbnNpb25zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFNldHMgd2hldGhlciB0aGUgb3ZlcmxheSBjYW4gZ3JvdyBhZnRlciB0aGUgaW5pdGlhbCBvcGVuIHZpYSBmbGV4aWJsZSB3aWR0aC9oZWlnaHQuICovXG4gIHdpdGhHcm93QWZ0ZXJPcGVuKGdyb3dBZnRlck9wZW4gPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fZ3Jvd0FmdGVyT3BlbiA9IGdyb3dBZnRlck9wZW47XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIGlmIG5vbmUgb2YgdGhlIHByb3ZpZGVkIHBvc2l0aW9ucyBmaXQuICovXG4gIHdpdGhQdXNoKGNhblB1c2ggPSB0cnVlKTogdGhpcyB7XG4gICAgdGhpcy5fY2FuUHVzaCA9IGNhblB1c2g7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRoZSBvdmVybGF5J3MgcG9zaXRpb24gc2hvdWxkIGJlIGxvY2tlZCBpbiBhZnRlciBpdCBpcyBwb3NpdGlvbmVkXG4gICAqIGluaXRpYWxseS4gV2hlbiBhbiBvdmVybGF5IGlzIGxvY2tlZCBpbiwgaXQgd29uJ3QgYXR0ZW1wdCB0byByZXBvc2l0aW9uIGl0c2VsZlxuICAgKiB3aGVuIHRoZSBwb3NpdGlvbiBpcyByZS1hcHBsaWVkIChlLmcuIHdoZW4gdGhlIHVzZXIgc2Nyb2xscyBhd2F5KS5cbiAgICogQHBhcmFtIGlzTG9ja2VkIFdoZXRoZXIgdGhlIG92ZXJsYXkgc2hvdWxkIGxvY2tlZCBpbi5cbiAgICovXG4gIHdpdGhMb2NrZWRQb3NpdGlvbihpc0xvY2tlZCA9IHRydWUpOiB0aGlzIHtcbiAgICB0aGlzLl9wb3NpdGlvbkxvY2tlZCA9IGlzTG9ja2VkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiwgcmVsYXRpdmUgdG8gd2hpY2ggdG8gcG9zaXRpb24gdGhlIG92ZXJsYXkuXG4gICAqIFVzaW5nIGFuIGVsZW1lbnQgb3JpZ2luIGlzIHVzZWZ1bCBmb3IgYnVpbGRpbmcgY29tcG9uZW50cyB0aGF0IG5lZWQgdG8gYmUgcG9zaXRpb25lZFxuICAgKiByZWxhdGl2ZWx5IHRvIGEgdHJpZ2dlciAoZS5nLiBkcm9wZG93biBtZW51cyBvciB0b29sdGlwcyksIHdoZXJlYXMgdXNpbmcgYSBwb2ludCBjYW4gYmVcbiAgICogdXNlZCBmb3IgY2FzZXMgbGlrZSBjb250ZXh0dWFsIG1lbnVzIHdoaWNoIG9wZW4gcmVsYXRpdmUgdG8gdGhlIHVzZXIncyBwb2ludGVyLlxuICAgKiBAcGFyYW0gb3JpZ2luIFJlZmVyZW5jZSB0byB0aGUgbmV3IG9yaWdpbi5cbiAgICovXG4gIHNldE9yaWdpbihvcmlnaW46IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbik6IHRoaXMge1xuICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkncyBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB4LWF4aXMuXG4gICAqIEBwYXJhbSBvZmZzZXQgTmV3IG9mZnNldCBpbiB0aGUgWCBheGlzLlxuICAgKi9cbiAgd2l0aERlZmF1bHRPZmZzZXRYKG9mZnNldDogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5fb2Zmc2V0WCA9IG9mZnNldDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkZWZhdWx0IG9mZnNldCBmb3IgdGhlIG92ZXJsYXkncyBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB5LWF4aXMuXG4gICAqIEBwYXJhbSBvZmZzZXQgTmV3IG9mZnNldCBpbiB0aGUgWSBheGlzLlxuICAgKi9cbiAgd2l0aERlZmF1bHRPZmZzZXRZKG9mZnNldDogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5fb2Zmc2V0WSA9IG9mZnNldDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IHNob3VsZCBzZXQgYSBgdHJhbnNmb3JtLW9yaWdpbmAgb24gc29tZSBlbGVtZW50c1xuICAgKiBpbnNpZGUgdGhlIG92ZXJsYXksIGRlcGVuZGluZyBvbiB0aGUgY3VycmVudCBwb3NpdGlvbiB0aGF0IGlzIGJlaW5nIGFwcGxpZWQuIFRoaXMgaXNcbiAgICogdXNlZnVsIGZvciB0aGUgY2FzZXMgd2hlcmUgdGhlIG9yaWdpbiBvZiBhbiBhbmltYXRpb24gY2FuIGNoYW5nZSBkZXBlbmRpbmcgb24gdGhlXG4gICAqIGFsaWdubWVudCBvZiB0aGUgb3ZlcmxheS5cbiAgICogQHBhcmFtIHNlbGVjdG9yIENTUyBzZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBmaW5kIHRoZSB0YXJnZXRcbiAgICogICAgZWxlbWVudHMgb250byB3aGljaCB0byBzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4uXG4gICAqL1xuICB3aXRoVHJhbnNmb3JtT3JpZ2luT24oc2VsZWN0b3I6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgKHgsIHkpIGNvb3JkaW5hdGUgb2YgYSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSBvcmlnaW4gYmFzZWQgb24gYSByZWxhdGl2ZSBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2dldE9yaWdpblBvaW50KG9yaWdpblJlY3Q6IENsaWVudFJlY3QsIHBvczogQ29ubmVjdGVkUG9zaXRpb24pOiBQb2ludCB7XG4gICAgbGV0IHg6IG51bWJlcjtcbiAgICBpZiAocG9zLm9yaWdpblggPT0gJ2NlbnRlcicpIHtcbiAgICAgIC8vIE5vdGU6IHdoZW4gY2VudGVyaW5nIHdlIHNob3VsZCBhbHdheXMgdXNlIHRoZSBgbGVmdGBcbiAgICAgIC8vIG9mZnNldCwgb3RoZXJ3aXNlIHRoZSBwb3NpdGlvbiB3aWxsIGJlIHdyb25nIGluIFJUTC5cbiAgICAgIHggPSBvcmlnaW5SZWN0LmxlZnQgKyAob3JpZ2luUmVjdC53aWR0aCAvIDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdGFydFggPSB0aGlzLl9pc1J0bCgpID8gb3JpZ2luUmVjdC5yaWdodCA6IG9yaWdpblJlY3QubGVmdDtcbiAgICAgIGNvbnN0IGVuZFggPSB0aGlzLl9pc1J0bCgpID8gb3JpZ2luUmVjdC5sZWZ0IDogb3JpZ2luUmVjdC5yaWdodDtcbiAgICAgIHggPSBwb3Mub3JpZ2luWCA9PSAnc3RhcnQnID8gc3RhcnRYIDogZW5kWDtcbiAgICB9XG5cbiAgICBsZXQgeTogbnVtYmVyO1xuICAgIGlmIChwb3Mub3JpZ2luWSA9PSAnY2VudGVyJykge1xuICAgICAgeSA9IG9yaWdpblJlY3QudG9wICsgKG9yaWdpblJlY3QuaGVpZ2h0IC8gMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHkgPSBwb3Mub3JpZ2luWSA9PSAndG9wJyA/IG9yaWdpblJlY3QudG9wIDogb3JpZ2luUmVjdC5ib3R0b207XG4gICAgfVxuXG4gICAgcmV0dXJuIHt4LCB5fTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlICh4LCB5KSBjb29yZGluYXRlIG9mIHRoZSB0b3AtbGVmdCBjb3JuZXIgb2YgdGhlIG92ZXJsYXkgZ2l2ZW4gYSBnaXZlbiBwb3NpdGlvbiBhbmRcbiAgICogb3JpZ2luIHBvaW50IHRvIHdoaWNoIHRoZSBvdmVybGF5IHNob3VsZCBiZSBjb25uZWN0ZWQuXG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5UG9pbnQoXG4gICAgICBvcmlnaW5Qb2ludDogUG9pbnQsXG4gICAgICBvdmVybGF5UmVjdDogQ2xpZW50UmVjdCxcbiAgICAgIHBvczogQ29ubmVjdGVkUG9zaXRpb24pOiBQb2ludCB7XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIChvdmVybGF5U3RhcnRYLCBvdmVybGF5U3RhcnRZKSwgdGhlIHN0YXJ0IG9mIHRoZVxuICAgIC8vIHBvdGVudGlhbCBvdmVybGF5IHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW4gcG9pbnQuXG4gICAgbGV0IG92ZXJsYXlTdGFydFg6IG51bWJlcjtcbiAgICBpZiAocG9zLm92ZXJsYXlYID09ICdjZW50ZXInKSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gLW92ZXJsYXlSZWN0LndpZHRoIC8gMjtcbiAgICB9IGVsc2UgaWYgKHBvcy5vdmVybGF5WCA9PT0gJ3N0YXJ0Jykge1xuICAgICAgb3ZlcmxheVN0YXJ0WCA9IHRoaXMuX2lzUnRsKCkgPyAtb3ZlcmxheVJlY3Qud2lkdGggOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdmVybGF5U3RhcnRYID0gdGhpcy5faXNSdGwoKSA/IDAgOiAtb3ZlcmxheVJlY3Qud2lkdGg7XG4gICAgfVxuXG4gICAgbGV0IG92ZXJsYXlTdGFydFk6IG51bWJlcjtcbiAgICBpZiAocG9zLm92ZXJsYXlZID09ICdjZW50ZXInKSB7XG4gICAgICBvdmVybGF5U3RhcnRZID0gLW92ZXJsYXlSZWN0LmhlaWdodCAvIDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJsYXlTdGFydFkgPSBwb3Mub3ZlcmxheVkgPT0gJ3RvcCcgPyAwIDogLW92ZXJsYXlSZWN0LmhlaWdodDtcbiAgICB9XG5cbiAgICAvLyBUaGUgKHgsIHkpIGNvb3JkaW5hdGVzIG9mIHRoZSBvdmVybGF5LlxuICAgIHJldHVybiB7XG4gICAgICB4OiBvcmlnaW5Qb2ludC54ICsgb3ZlcmxheVN0YXJ0WCxcbiAgICAgIHk6IG9yaWdpblBvaW50LnkgKyBvdmVybGF5U3RhcnRZLFxuICAgIH07XG4gIH1cblxuICAvKiogR2V0cyBob3cgd2VsbCBhbiBvdmVybGF5IGF0IHRoZSBnaXZlbiBwb2ludCB3aWxsIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Rml0KHBvaW50OiBQb2ludCwgb3ZlcmxheTogQ2xpZW50UmVjdCwgdmlld3BvcnQ6IENsaWVudFJlY3QsXG4gICAgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKTogT3ZlcmxheUZpdCB7XG5cbiAgICBsZXQge3gsIHl9ID0gcG9pbnQ7XG4gICAgbGV0IG9mZnNldFggPSB0aGlzLl9nZXRPZmZzZXQocG9zaXRpb24sICd4Jyk7XG4gICAgbGV0IG9mZnNldFkgPSB0aGlzLl9nZXRPZmZzZXQocG9zaXRpb24sICd5Jyk7XG5cbiAgICAvLyBBY2NvdW50IGZvciB0aGUgb2Zmc2V0cyBzaW5jZSB0aGV5IGNvdWxkIHB1c2ggdGhlIG92ZXJsYXkgb3V0IG9mIHRoZSB2aWV3cG9ydC5cbiAgICBpZiAob2Zmc2V0WCkge1xuICAgICAgeCArPSBvZmZzZXRYO1xuICAgIH1cblxuICAgIGlmIChvZmZzZXRZKSB7XG4gICAgICB5ICs9IG9mZnNldFk7XG4gICAgfVxuXG4gICAgLy8gSG93IG11Y2ggdGhlIG92ZXJsYXkgd291bGQgb3ZlcmZsb3cgYXQgdGhpcyBwb3NpdGlvbiwgb24gZWFjaCBzaWRlLlxuICAgIGxldCBsZWZ0T3ZlcmZsb3cgPSAwIC0geDtcbiAgICBsZXQgcmlnaHRPdmVyZmxvdyA9ICh4ICsgb3ZlcmxheS53aWR0aCkgLSB2aWV3cG9ydC53aWR0aDtcbiAgICBsZXQgdG9wT3ZlcmZsb3cgPSAwIC0geTtcbiAgICBsZXQgYm90dG9tT3ZlcmZsb3cgPSAoeSArIG92ZXJsYXkuaGVpZ2h0KSAtIHZpZXdwb3J0LmhlaWdodDtcblxuICAgIC8vIFZpc2libGUgcGFydHMgb2YgdGhlIGVsZW1lbnQgb24gZWFjaCBheGlzLlxuICAgIGxldCB2aXNpYmxlV2lkdGggPSB0aGlzLl9zdWJ0cmFjdE92ZXJmbG93cyhvdmVybGF5LndpZHRoLCBsZWZ0T3ZlcmZsb3csIHJpZ2h0T3ZlcmZsb3cpO1xuICAgIGxldCB2aXNpYmxlSGVpZ2h0ID0gdGhpcy5fc3VidHJhY3RPdmVyZmxvd3Mob3ZlcmxheS5oZWlnaHQsIHRvcE92ZXJmbG93LCBib3R0b21PdmVyZmxvdyk7XG4gICAgbGV0IHZpc2libGVBcmVhID0gdmlzaWJsZVdpZHRoICogdmlzaWJsZUhlaWdodDtcblxuICAgIHJldHVybiB7XG4gICAgICB2aXNpYmxlQXJlYSxcbiAgICAgIGlzQ29tcGxldGVseVdpdGhpblZpZXdwb3J0OiAob3ZlcmxheS53aWR0aCAqIG92ZXJsYXkuaGVpZ2h0KSA9PT0gdmlzaWJsZUFyZWEsXG4gICAgICBmaXRzSW5WaWV3cG9ydFZlcnRpY2FsbHk6IHZpc2libGVIZWlnaHQgPT09IG92ZXJsYXkuaGVpZ2h0LFxuICAgICAgZml0c0luVmlld3BvcnRIb3Jpem9udGFsbHk6IHZpc2libGVXaWR0aCA9PSBvdmVybGF5LndpZHRoLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgb3ZlcmxheSBjYW4gZml0IHdpdGhpbiB0aGUgdmlld3BvcnQgd2hlbiBpdCBtYXkgcmVzaXplIGVpdGhlciBpdHMgd2lkdGggb3IgaGVpZ2h0LlxuICAgKiBAcGFyYW0gZml0IEhvdyB3ZWxsIHRoZSBvdmVybGF5IGZpdHMgaW4gdGhlIHZpZXdwb3J0IGF0IHNvbWUgcG9zaXRpb24uXG4gICAqIEBwYXJhbSBwb2ludCBUaGUgKHgsIHkpIGNvb3JkaW5hdGVzIG9mIHRoZSBvdmVybGF0IGF0IHNvbWUgcG9zaXRpb24uXG4gICAqIEBwYXJhbSB2aWV3cG9ydCBUaGUgZ2VvbWV0cnkgb2YgdGhlIHZpZXdwb3J0LlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FuRml0V2l0aEZsZXhpYmxlRGltZW5zaW9ucyhmaXQ6IE92ZXJsYXlGaXQsIHBvaW50OiBQb2ludCwgdmlld3BvcnQ6IENsaWVudFJlY3QpIHtcbiAgICBpZiAodGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zKSB7XG4gICAgICBjb25zdCBhdmFpbGFibGVIZWlnaHQgPSB2aWV3cG9ydC5ib3R0b20gLSBwb2ludC55O1xuICAgICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPSB2aWV3cG9ydC5yaWdodCAtIHBvaW50Lng7XG4gICAgICBjb25zdCBtaW5IZWlnaHQgPSB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLm1pbkhlaWdodDtcbiAgICAgIGNvbnN0IG1pbldpZHRoID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5taW5XaWR0aDtcblxuICAgICAgY29uc3QgdmVydGljYWxGaXQgPSBmaXQuZml0c0luVmlld3BvcnRWZXJ0aWNhbGx5IHx8XG4gICAgICAgICAgKG1pbkhlaWdodCAhPSBudWxsICYmIG1pbkhlaWdodCA8PSBhdmFpbGFibGVIZWlnaHQpO1xuICAgICAgY29uc3QgaG9yaXpvbnRhbEZpdCA9IGZpdC5maXRzSW5WaWV3cG9ydEhvcml6b250YWxseSB8fFxuICAgICAgICAgIChtaW5XaWR0aCAhPSBudWxsICYmIG1pbldpZHRoIDw9IGF2YWlsYWJsZVdpZHRoKTtcblxuICAgICAgcmV0dXJuIHZlcnRpY2FsRml0ICYmIGhvcml6b250YWxGaXQ7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwb2ludCBhdCB3aGljaCB0aGUgb3ZlcmxheSBjYW4gYmUgXCJwdXNoZWRcIiBvbi1zY3JlZW4uIElmIHRoZSBvdmVybGF5IGlzIGxhcmdlciB0aGFuXG4gICAqIHRoZSB2aWV3cG9ydCwgdGhlIHRvcC1sZWZ0IGNvcm5lciB3aWxsIGJlIHB1c2hlZCBvbi1zY3JlZW4gKHdpdGggb3ZlcmZsb3cgb2NjdXJpbmcgb24gdGhlXG4gICAqIHJpZ2h0IGFuZCBib3R0b20pLlxuICAgKlxuICAgKiBAcGFyYW0gc3RhcnQgU3RhcnRpbmcgcG9pbnQgZnJvbSB3aGljaCB0aGUgb3ZlcmxheSBpcyBwdXNoZWQuXG4gICAqIEBwYXJhbSBvdmVybGF5IERpbWVuc2lvbnMgb2YgdGhlIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBzY3JvbGxQb3NpdGlvbiBDdXJyZW50IHZpZXdwb3J0IHNjcm9sbCBwb3NpdGlvbi5cbiAgICogQHJldHVybnMgVGhlIHBvaW50IGF0IHdoaWNoIHRvIHBvc2l0aW9uIHRoZSBvdmVybGF5IGFmdGVyIHB1c2hpbmcuIFRoaXMgaXMgZWZmZWN0aXZlbHkgYSBuZXdcbiAgICogICAgIG9yaWdpblBvaW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHVzaE92ZXJsYXlPblNjcmVlbihzdGFydDogUG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxheTogQ2xpZW50UmVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbjogVmlld3BvcnRTY3JvbGxQb3NpdGlvbik6IFBvaW50IHtcbiAgICAvLyBJZiB0aGUgcG9zaXRpb24gaXMgbG9ja2VkIGFuZCB3ZSd2ZSBwdXNoZWQgdGhlIG92ZXJsYXkgYWxyZWFkeSwgcmV1c2UgdGhlIHByZXZpb3VzIHB1c2hcbiAgICAvLyBhbW91bnQsIHJhdGhlciB0aGFuIHB1c2hpbmcgaXQgYWdhaW4uIElmIHdlIHdlcmUgdG8gY29udGludWUgcHVzaGluZywgdGhlIGVsZW1lbnQgd291bGRcbiAgICAvLyByZW1haW4gaW4gdGhlIHZpZXdwb3J0LCB3aGljaCBnb2VzIGFnYWluc3QgdGhlIGV4cGVjdGF0aW9ucyB3aGVuIHBvc2l0aW9uIGxvY2tpbmcgaXMgZW5hYmxlZC5cbiAgICBpZiAodGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ICYmIHRoaXMuX3Bvc2l0aW9uTG9ja2VkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBzdGFydC54ICsgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50LngsXG4gICAgICAgIHk6IHN0YXJ0LnkgKyB0aGlzLl9wcmV2aW91c1B1c2hBbW91bnQueVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMuX3ZpZXdwb3J0UmVjdDtcblxuICAgIC8vIERldGVybWluZSBob3cgbXVjaCB0aGUgb3ZlcmxheSBnb2VzIG91dHNpZGUgdGhlIHZpZXdwb3J0IG9uIGVhY2hcbiAgICAvLyBzaWRlLCB3aGljaCB3ZSdsbCB1c2UgdG8gZGVjaWRlIHdoaWNoIGRpcmVjdGlvbiB0byBwdXNoIGl0LlxuICAgIGNvbnN0IG92ZXJmbG93UmlnaHQgPSBNYXRoLm1heChzdGFydC54ICsgb3ZlcmxheS53aWR0aCAtIHZpZXdwb3J0LnJpZ2h0LCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd0JvdHRvbSA9IE1hdGgubWF4KHN0YXJ0LnkgKyBvdmVybGF5LmhlaWdodCAtIHZpZXdwb3J0LmJvdHRvbSwgMCk7XG4gICAgY29uc3Qgb3ZlcmZsb3dUb3AgPSBNYXRoLm1heCh2aWV3cG9ydC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3AgLSBzdGFydC55LCAwKTtcbiAgICBjb25zdCBvdmVyZmxvd0xlZnQgPSBNYXRoLm1heCh2aWV3cG9ydC5sZWZ0IC0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIHN0YXJ0LngsIDApO1xuXG4gICAgLy8gQW1vdW50IGJ5IHdoaWNoIHRvIHB1c2ggdGhlIG92ZXJsYXkgaW4gZWFjaCBheGlzIHN1Y2ggdGhhdCBpdCByZW1haW5zIG9uLXNjcmVlbi5cbiAgICBsZXQgcHVzaFggPSAwO1xuICAgIGxldCBwdXNoWSA9IDA7XG5cbiAgICAvLyBJZiB0aGUgb3ZlcmxheSBmaXRzIGNvbXBsZXRlbHkgd2l0aGluIHRoZSBib3VuZHMgb2YgdGhlIHZpZXdwb3J0LCBwdXNoIGl0IGZyb20gd2hpY2hldmVyXG4gICAgLy8gZGlyZWN0aW9uIGlzIGdvZXMgb2ZmLXNjcmVlbi4gT3RoZXJ3aXNlLCBwdXNoIHRoZSB0b3AtbGVmdCBjb3JuZXIgc3VjaCB0aGF0IGl0cyBpbiB0aGVcbiAgICAvLyB2aWV3cG9ydCBhbmQgYWxsb3cgZm9yIHRoZSB0cmFpbGluZyBlbmQgb2YgdGhlIG92ZXJsYXkgdG8gZ28gb3V0IG9mIGJvdW5kcy5cbiAgICBpZiAob3ZlcmxheS53aWR0aCA8PSB2aWV3cG9ydC53aWR0aCkge1xuICAgICAgcHVzaFggPSBvdmVyZmxvd0xlZnQgfHwgLW92ZXJmbG93UmlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hYID0gc3RhcnQueCA8IHRoaXMuX3ZpZXdwb3J0TWFyZ2luID8gKHZpZXdwb3J0LmxlZnQgLSBzY3JvbGxQb3NpdGlvbi5sZWZ0KSAtIHN0YXJ0LnggOiAwO1xuICAgIH1cblxuICAgIGlmIChvdmVybGF5LmhlaWdodCA8PSB2aWV3cG9ydC5oZWlnaHQpIHtcbiAgICAgIHB1c2hZID0gb3ZlcmZsb3dUb3AgfHwgLW92ZXJmbG93Qm90dG9tO1xuICAgIH0gZWxzZSB7XG4gICAgICBwdXNoWSA9IHN0YXJ0LnkgPCB0aGlzLl92aWV3cG9ydE1hcmdpbiA/ICh2aWV3cG9ydC50b3AgLSBzY3JvbGxQb3NpdGlvbi50b3ApIC0gc3RhcnQueSA6IDA7XG4gICAgfVxuXG4gICAgdGhpcy5fcHJldmlvdXNQdXNoQW1vdW50ID0ge3g6IHB1c2hYLCB5OiBwdXNoWX07XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogc3RhcnQueCArIHB1c2hYLFxuICAgICAgeTogc3RhcnQueSArIHB1c2hZLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGNvbXB1dGVkIHBvc2l0aW9uIHRvIHRoZSBvdmVybGF5IGFuZCBlbWl0cyBhIHBvc2l0aW9uIGNoYW5nZS5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBwcmVmZXJlbmNlXG4gICAqIEBwYXJhbSBvcmlnaW5Qb2ludCBUaGUgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHdoZXJlIHRoZSBvdmVybGF5IGlzIGNvbm5lY3RlZC5cbiAgICovXG4gIHByaXZhdGUgX2FwcGx5UG9zaXRpb24ocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLCBvcmlnaW5Qb2ludDogUG9pbnQpIHtcbiAgICB0aGlzLl9zZXRUcmFuc2Zvcm1PcmlnaW4ocG9zaXRpb24pO1xuICAgIHRoaXMuX3NldE92ZXJsYXlFbGVtZW50U3R5bGVzKG9yaWdpblBvaW50LCBwb3NpdGlvbik7XG4gICAgdGhpcy5fc2V0Qm91bmRpbmdCb3hTdHlsZXMob3JpZ2luUG9pbnQsIHBvc2l0aW9uKTtcblxuICAgIGlmIChwb3NpdGlvbi5wYW5lbENsYXNzKSB7XG4gICAgICB0aGlzLl9hZGRQYW5lbENsYXNzZXMocG9zaXRpb24ucGFuZWxDbGFzcyk7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSB0aGUgbGFzdCBjb25uZWN0ZWQgcG9zaXRpb24gaW4gY2FzZSB0aGUgcG9zaXRpb24gbmVlZHMgdG8gYmUgcmUtY2FsY3VsYXRlZC5cbiAgICB0aGlzLl9sYXN0UG9zaXRpb24gPSBwb3NpdGlvbjtcblxuICAgIC8vIE5vdGlmeSB0aGF0IHRoZSBwb3NpdGlvbiBoYXMgYmVlbiBjaGFuZ2VkIGFsb25nIHdpdGggaXRzIGNoYW5nZSBwcm9wZXJ0aWVzLlxuICAgIC8vIFdlIG9ubHkgZW1pdCBpZiB3ZSd2ZSBnb3QgYW55IHN1YnNjcmlwdGlvbnMsIGJlY2F1c2UgdGhlIHNjcm9sbCB2aXNpYmlsaXR5XG4gICAgLy8gY2FsY3VsY2F0aW9ucyBjYW4gYmUgc29tZXdoYXQgZXhwZW5zaXZlLlxuICAgIGlmICh0aGlzLl9wb3NpdGlvbkNoYW5nZXMub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgc2Nyb2xsYWJsZVZpZXdQcm9wZXJ0aWVzID0gdGhpcy5fZ2V0U2Nyb2xsVmlzaWJpbGl0eSgpO1xuICAgICAgY29uc3QgY2hhbmdlRXZlbnQgPSBuZXcgQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uLCBzY3JvbGxhYmxlVmlld1Byb3BlcnRpZXMpO1xuICAgICAgdGhpcy5fcG9zaXRpb25DaGFuZ2VzLm5leHQoY2hhbmdlRXZlbnQpO1xuICAgIH1cblxuICAgIHRoaXMuX2lzSW5pdGlhbFJlbmRlciA9IGZhbHNlO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIHRyYW5zZm9ybSBvcmlnaW4gYmFzZWQgb24gdGhlIGNvbmZpZ3VyZWQgc2VsZWN0b3IgYW5kIHRoZSBwYXNzZWQtaW4gcG9zaXRpb24uICAqL1xuICBwcml2YXRlIF9zZXRUcmFuc2Zvcm1PcmlnaW4ocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0aGlzLl90cmFuc2Zvcm1PcmlnaW5TZWxlY3Rvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnRzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9XG4gICAgICAgIHRoaXMuX2JvdW5kaW5nQm94IS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuX3RyYW5zZm9ybU9yaWdpblNlbGVjdG9yKTtcbiAgICBsZXQgeE9yaWdpbjogJ2xlZnQnIHwgJ3JpZ2h0JyB8ICdjZW50ZXInO1xuICAgIGxldCB5T3JpZ2luOiAndG9wJyB8ICdib3R0b20nIHwgJ2NlbnRlcicgPSBwb3NpdGlvbi5vdmVybGF5WTtcblxuICAgIGlmIChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgIHhPcmlnaW4gPSAnY2VudGVyJztcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2lzUnRsKCkpIHtcbiAgICAgIHhPcmlnaW4gPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHhPcmlnaW4gPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgZWxlbWVudHNbaV0uc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gYCR7eE9yaWdpbn0gJHt5T3JpZ2lufWA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSBvdmVybGF5J3Mgc2l6aW5nIGNvbnRhaW5lci5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZG9lcyBubyBtZWFzdXJpbmcgYW5kIGFwcGxpZXMgbm8gc3R5bGVzIHNvIHRoYXQgd2UgY2FuIGNoZWFwbHkgY29tcHV0ZSB0aGVcbiAgICogYm91bmRzIGZvciBhbGwgcG9zaXRpb25zIGFuZCBjaG9vc2UgdGhlIGJlc3QgZml0IGJhc2VkIG9uIHRoZXNlIHJlc3VsdHMuXG4gICAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luOiBQb2ludCwgcG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uKTogQm91bmRpbmdCb3hSZWN0IHtcbiAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMuX3ZpZXdwb3J0UmVjdDtcbiAgICBjb25zdCBpc1J0bCA9IHRoaXMuX2lzUnRsKCk7XG4gICAgbGV0IGhlaWdodDogbnVtYmVyLCB0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXI7XG5cbiAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICd0b3AnKSB7XG4gICAgICAvLyBPdmVybGF5IGlzIG9wZW5pbmcgXCJkb3dud2FyZFwiIGFuZCB0aHVzIGlzIGJvdW5kIGJ5IHRoZSBib3R0b20gdmlld3BvcnQgZWRnZS5cbiAgICAgIHRvcCA9IG9yaWdpbi55O1xuICAgICAgaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0IC0gdG9wICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIC8vIE92ZXJsYXkgaXMgb3BlbmluZyBcInVwd2FyZFwiIGFuZCB0aHVzIGlzIGJvdW5kIGJ5IHRoZSB0b3Agdmlld3BvcnQgZWRnZS4gV2UgbmVlZCB0byBhZGRcbiAgICAgIC8vIHRoZSB2aWV3cG9ydCBtYXJnaW4gYmFjayBpbiwgYmVjYXVzZSB0aGUgdmlld3BvcnQgcmVjdCBpcyBuYXJyb3dlZCBkb3duIHRvIHJlbW92ZSB0aGVcbiAgICAgIC8vIG1hcmdpbiwgd2hlcmVhcyB0aGUgYG9yaWdpbmAgcG9zaXRpb24gaXMgY2FsY3VsYXRlZCBiYXNlZCBvbiBpdHMgYENsaWVudFJlY3RgLlxuICAgICAgYm90dG9tID0gdmlld3BvcnQuaGVpZ2h0IC0gb3JpZ2luLnkgKyB0aGlzLl92aWV3cG9ydE1hcmdpbiAqIDI7XG4gICAgICBoZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQgLSBib3R0b20gKyB0aGlzLl92aWV3cG9ydE1hcmdpbjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgbmVpdGhlciB0b3Agbm9yIGJvdHRvbSwgaXQgbWVhbnMgdGhhdCB0aGUgb3ZlcmxheSBpcyB2ZXJ0aWNhbGx5IGNlbnRlcmVkIG9uIHRoZVxuICAgICAgLy8gb3JpZ2luIHBvaW50LiBOb3RlIHRoYXQgd2Ugd2FudCB0aGUgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LCByYXRoZXIgdGhhblxuICAgICAgLy8gdGhlIHBhZ2UsIHdoaWNoIGlzIHdoeSB3ZSBkb24ndCB1c2Ugc29tZXRoaW5nIGxpa2UgYHZpZXdwb3J0LmJvdHRvbSAtIG9yaWdpbi55YCBhbmRcbiAgICAgIC8vIGBvcmlnaW4ueSAtIHZpZXdwb3J0LnRvcGAuXG4gICAgICBjb25zdCBzbWFsbGVzdERpc3RhbmNlVG9WaWV3cG9ydEVkZ2UgPVxuICAgICAgICAgIE1hdGgubWluKHZpZXdwb3J0LmJvdHRvbSAtIG9yaWdpbi55ICsgdmlld3BvcnQudG9wLCBvcmlnaW4ueSk7XG5cbiAgICAgIGNvbnN0IHByZXZpb3VzSGVpZ2h0ID0gdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQ7XG5cbiAgICAgIGhlaWdodCA9IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSAqIDI7XG4gICAgICB0b3AgPSBvcmlnaW4ueSAtIHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZTtcblxuICAgICAgaWYgKGhlaWdodCA+IHByZXZpb3VzSGVpZ2h0ICYmICF0aGlzLl9pc0luaXRpYWxSZW5kZXIgJiYgIXRoaXMuX2dyb3dBZnRlck9wZW4pIHtcbiAgICAgICAgdG9wID0gb3JpZ2luLnkgLSAocHJldmlvdXNIZWlnaHQgLyAyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgb3ZlcmxheSBpcyBvcGVuaW5nICdyaWdodC13YXJkJyAodGhlIGNvbnRlbnQgZmxvd3MgdG8gdGhlIHJpZ2h0KS5cbiAgICBjb25zdCBpc0JvdW5kZWRCeVJpZ2h0Vmlld3BvcnRFZGdlID1cbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnc3RhcnQnICYmICFpc1J0bCkgfHxcbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyAmJiBpc1J0bCk7XG5cbiAgICAvLyBUaGUgb3ZlcmxheSBpcyBvcGVuaW5nICdsZWZ0LXdhcmQnICh0aGUgY29udGVudCBmbG93cyB0byB0aGUgbGVmdCkuXG4gICAgY29uc3QgaXNCb3VuZGVkQnlMZWZ0Vmlld3BvcnRFZGdlID1cbiAgICAgICAgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyAmJiAhaXNSdGwpIHx8XG4gICAgICAgIChwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyAmJiBpc1J0bCk7XG5cbiAgICBsZXQgd2lkdGg6IG51bWJlciwgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyO1xuXG4gICAgaWYgKGlzQm91bmRlZEJ5TGVmdFZpZXdwb3J0RWRnZSkge1xuICAgICAgcmlnaHQgPSB2aWV3cG9ydC53aWR0aCAtIG9yaWdpbi54ICsgdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgICB3aWR0aCA9IG9yaWdpbi54IC0gdGhpcy5fdmlld3BvcnRNYXJnaW47XG4gICAgfSBlbHNlIGlmIChpc0JvdW5kZWRCeVJpZ2h0Vmlld3BvcnRFZGdlKSB7XG4gICAgICBsZWZ0ID0gb3JpZ2luLng7XG4gICAgICB3aWR0aCA9IHZpZXdwb3J0LnJpZ2h0IC0gb3JpZ2luLng7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIG5laXRoZXIgc3RhcnQgbm9yIGVuZCwgaXQgbWVhbnMgdGhhdCB0aGUgb3ZlcmxheSBpcyBob3Jpem9udGFsbHkgY2VudGVyZWQgb24gdGhlXG4gICAgICAvLyBvcmlnaW4gcG9pbnQuIE5vdGUgdGhhdCB3ZSB3YW50IHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQsIHJhdGhlciB0aGFuXG4gICAgICAvLyB0aGUgcGFnZSwgd2hpY2ggaXMgd2h5IHdlIGRvbid0IHVzZSBzb21ldGhpbmcgbGlrZSBgdmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueGAgYW5kXG4gICAgICAvLyBgb3JpZ2luLnggLSB2aWV3cG9ydC5sZWZ0YC5cbiAgICAgIGNvbnN0IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSA9XG4gICAgICAgICAgTWF0aC5taW4odmlld3BvcnQucmlnaHQgLSBvcmlnaW4ueCArIHZpZXdwb3J0LmxlZnQsIG9yaWdpbi54KTtcbiAgICAgIGNvbnN0IHByZXZpb3VzV2lkdGggPSB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLndpZHRoO1xuXG4gICAgICB3aWR0aCA9IHNtYWxsZXN0RGlzdGFuY2VUb1ZpZXdwb3J0RWRnZSAqIDI7XG4gICAgICBsZWZ0ID0gb3JpZ2luLnggLSBzbWFsbGVzdERpc3RhbmNlVG9WaWV3cG9ydEVkZ2U7XG5cbiAgICAgIGlmICh3aWR0aCA+IHByZXZpb3VzV2lkdGggJiYgIXRoaXMuX2lzSW5pdGlhbFJlbmRlciAmJiAhdGhpcy5fZ3Jvd0FmdGVyT3Blbikge1xuICAgICAgICBsZWZ0ID0gb3JpZ2luLnggLSAocHJldmlvdXNXaWR0aCAvIDIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7dG9wOiB0b3AhLCBsZWZ0OiBsZWZ0ISwgYm90dG9tOiBib3R0b20hLCByaWdodDogcmlnaHQhLCB3aWR0aCwgaGVpZ2h0fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSdzIHNpemluZyB3cmFwcGVyLiBUaGUgd3JhcHBlciBpcyBwb3NpdGlvbmVkIG9uIHRoZVxuICAgKiBvcmlnaW4ncyBjb25uZWN0aW9uIHBvaW50IGFuZCBzdGV0Y2hlcyB0byB0aGUgYm91bmRzIG9mIHRoZSB2aWV3cG9ydC5cbiAgICpcbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgcG9pbnQgb24gdGhlIG9yaWdpbiBlbGVtZW50IHdoZXJlIHRoZSBvdmVybGF5IGlzIGNvbm5lY3RlZC5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBwcmVmZXJlbmNlXG4gICAqL1xuICBwcml2YXRlIF9zZXRCb3VuZGluZ0JveFN0eWxlcyhvcmlnaW46IFBvaW50LCBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24pOiB2b2lkIHtcbiAgICBjb25zdCBib3VuZGluZ0JveFJlY3QgPSB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0JveFJlY3Qob3JpZ2luLCBwb3NpdGlvbik7XG5cbiAgICAvLyBJdCdzIHdlaXJkIGlmIHRoZSBvdmVybGF5ICpncm93cyogd2hpbGUgc2Nyb2xsaW5nLCBzbyB3ZSB0YWtlIHRoZSBsYXN0IHNpemUgaW50byBhY2NvdW50XG4gICAgLy8gd2hlbiBhcHBseWluZyBhIG5ldyBzaXplLlxuICAgIGlmICghdGhpcy5faXNJbml0aWFsUmVuZGVyICYmICF0aGlzLl9ncm93QWZ0ZXJPcGVuKSB7XG4gICAgICBib3VuZGluZ0JveFJlY3QuaGVpZ2h0ID0gTWF0aC5taW4oYm91bmRpbmdCb3hSZWN0LmhlaWdodCwgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZS5oZWlnaHQpO1xuICAgICAgYm91bmRpbmdCb3hSZWN0LndpZHRoID0gTWF0aC5taW4oYm91bmRpbmdCb3hSZWN0LndpZHRoLCB0aGlzLl9sYXN0Qm91bmRpbmdCb3hTaXplLndpZHRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdHlsZXMgPSB7fSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuXG4gICAgaWYgKHRoaXMuX2hhc0V4YWN0UG9zaXRpb24oKSkge1xuICAgICAgc3R5bGVzLnRvcCA9IHN0eWxlcy5sZWZ0ID0gJzAnO1xuICAgICAgc3R5bGVzLmJvdHRvbSA9IHN0eWxlcy5yaWdodCA9ICcnO1xuICAgICAgc3R5bGVzLndpZHRoID0gc3R5bGVzLmhlaWdodCA9ICcxMDAlJztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5tYXhIZWlnaHQ7XG4gICAgICBjb25zdCBtYXhXaWR0aCA9IHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWF4V2lkdGg7XG5cbiAgICAgIHN0eWxlcy5oZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5oZWlnaHQpO1xuICAgICAgc3R5bGVzLnRvcCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LnRvcCk7XG4gICAgICBzdHlsZXMuYm90dG9tID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QuYm90dG9tKTtcbiAgICAgIHN0eWxlcy53aWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUoYm91bmRpbmdCb3hSZWN0LndpZHRoKTtcbiAgICAgIHN0eWxlcy5sZWZ0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShib3VuZGluZ0JveFJlY3QubGVmdCk7XG4gICAgICBzdHlsZXMucmlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKGJvdW5kaW5nQm94UmVjdC5yaWdodCk7XG5cbiAgICAgIC8vIFB1c2ggdGhlIHBhbmUgY29udGVudCB0b3dhcmRzIHRoZSBwcm9wZXIgZGlyZWN0aW9uLlxuICAgICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlYID09PSAnY2VudGVyJykge1xuICAgICAgICBzdHlsZXMuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVzLmFsaWduSXRlbXMgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAnZmxleC1lbmQnIDogJ2ZsZXgtc3RhcnQnO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9zaXRpb24ub3ZlcmxheVkgPT09ICdjZW50ZXInKSB7XG4gICAgICAgIHN0eWxlcy5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGVzLmp1c3RpZnlDb250ZW50ID0gcG9zaXRpb24ub3ZlcmxheVkgPT09ICdib3R0b20nID8gJ2ZsZXgtZW5kJyA6ICdmbGV4LXN0YXJ0JztcbiAgICAgIH1cblxuICAgICAgaWYgKG1heEhlaWdodCkge1xuICAgICAgICBzdHlsZXMubWF4SGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShtYXhIZWlnaHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF4V2lkdGgpIHtcbiAgICAgICAgc3R5bGVzLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShtYXhXaWR0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdEJvdW5kaW5nQm94U2l6ZSA9IGJvdW5kaW5nQm94UmVjdDtcblxuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9ib3VuZGluZ0JveCEuc3R5bGUsIHN0eWxlcyk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdHlsZXMgZm9yIHRoZSBib3VuZGluZyBib3ggc28gdGhhdCBhIG5ldyBwb3NpdGlvbmluZyBjYW4gYmUgY29tcHV0ZWQuICovXG4gIHByaXZhdGUgX3Jlc2V0Qm91bmRpbmdCb3hTdHlsZXMoKSB7XG4gICAgZXh0ZW5kU3R5bGVzKHRoaXMuX2JvdW5kaW5nQm94IS5zdHlsZSwge1xuICAgICAgdG9wOiAnMCcsXG4gICAgICBsZWZ0OiAnMCcsXG4gICAgICByaWdodDogJzAnLFxuICAgICAgYm90dG9tOiAnMCcsXG4gICAgICBoZWlnaHQ6ICcnLFxuICAgICAgd2lkdGg6ICcnLFxuICAgICAgYWxpZ25JdGVtczogJycsXG4gICAgICBqdXN0aWZ5Q29udGVudDogJycsXG4gICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0eWxlcyBmb3IgdGhlIG92ZXJsYXkgcGFuZSBzbyB0aGF0IGEgbmV3IHBvc2l0aW9uaW5nIGNhbiBiZSBjb21wdXRlZC4gKi9cbiAgcHJpdmF0ZSBfcmVzZXRPdmVybGF5RWxlbWVudFN0eWxlcygpIHtcbiAgICBleHRlbmRTdHlsZXModGhpcy5fcGFuZS5zdHlsZSwge1xuICAgICAgdG9wOiAnJyxcbiAgICAgIGxlZnQ6ICcnLFxuICAgICAgYm90dG9tOiAnJyxcbiAgICAgIHJpZ2h0OiAnJyxcbiAgICAgIHBvc2l0aW9uOiAnJyxcbiAgICAgIHRyYW5zZm9ybTogJycsXG4gICAgfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHBvc2l0aW9uaW5nIHN0eWxlcyB0byB0aGUgb3ZlcmxheSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9zZXRPdmVybGF5RWxlbWVudFN0eWxlcyhvcmlnaW5Qb2ludDogUG9pbnQsIHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbik6IHZvaWQge1xuICAgIGNvbnN0IHN0eWxlcyA9IHt9IGFzIENTU1N0eWxlRGVjbGFyYXRpb247XG5cbiAgICBpZiAodGhpcy5faGFzRXhhY3RQb3NpdGlvbigpKSB7XG4gICAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgZXh0ZW5kU3R5bGVzKHN0eWxlcywgdGhpcy5fZ2V0RXhhY3RPdmVybGF5WShwb3NpdGlvbiwgb3JpZ2luUG9pbnQsIHNjcm9sbFBvc2l0aW9uKSk7XG4gICAgICBleHRlbmRTdHlsZXMoc3R5bGVzLCB0aGlzLl9nZXRFeGFjdE92ZXJsYXlYKHBvc2l0aW9uLCBvcmlnaW5Qb2ludCwgc2Nyb2xsUG9zaXRpb24pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLnBvc2l0aW9uID0gJ3N0YXRpYyc7XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgdHJhbnNmb3JtIHRvIGFwcGx5IHRoZSBvZmZzZXRzLiBXZSBkbyB0aGlzIGJlY2F1c2UgdGhlIGBjZW50ZXJgIHBvc2l0aW9ucyByZWx5IG9uXG4gICAgLy8gYmVpbmcgaW4gdGhlIG5vcm1hbCBmbGV4IGZsb3cgYW5kIHNldHRpbmcgYSBgdG9wYCAvIGBsZWZ0YCBhdCBhbGwgd2lsbCBjb21wbGV0ZWx5IHRocm93XG4gICAgLy8gb2ZmIHRoZSBwb3NpdGlvbi4gV2UgYWxzbyBjYW4ndCB1c2UgbWFyZ2lucywgYmVjYXVzZSB0aGV5IHdvbid0IGhhdmUgYW4gZWZmZWN0IGluIHNvbWVcbiAgICAvLyBjYXNlcyB3aGVyZSB0aGUgZWxlbWVudCBkb2Vzbid0IGhhdmUgYW55dGhpbmcgdG8gXCJwdXNoIG9mZiBvZlwiLiBGaW5hbGx5LCB0aGlzIHdvcmtzXG4gICAgLy8gYmV0dGVyIGJvdGggd2l0aCBmbGV4aWJsZSBhbmQgbm9uLWZsZXhpYmxlIHBvc2l0aW9uaW5nLlxuICAgIGxldCB0cmFuc2Zvcm1TdHJpbmcgPSAnJztcbiAgICBsZXQgb2Zmc2V0WCA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3gnKTtcbiAgICBsZXQgb2Zmc2V0WSA9IHRoaXMuX2dldE9mZnNldChwb3NpdGlvbiwgJ3knKTtcblxuICAgIGlmIChvZmZzZXRYKSB7XG4gICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gYHRyYW5zbGF0ZVgoJHtvZmZzZXRYfXB4KSBgO1xuICAgIH1cblxuICAgIGlmIChvZmZzZXRZKSB7XG4gICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gYHRyYW5zbGF0ZVkoJHtvZmZzZXRZfXB4KWA7XG4gICAgfVxuXG4gICAgc3R5bGVzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybVN0cmluZy50cmltKCk7XG5cbiAgICAvLyBJZiBhIG1heFdpZHRoIG9yIG1heEhlaWdodCBpcyBzcGVjaWZpZWQgb24gdGhlIG92ZXJsYXksIHdlIHJlbW92ZSB0aGVtLiBXZSBkbyB0aGlzIGJlY2F1c2VcbiAgICAvLyB3ZSBuZWVkIHRoZXNlIHZhbHVlcyB0byBib3RoIGJlIHNldCB0byBcIjEwMCVcIiBmb3IgdGhlIGF1dG9tYXRpYyBmbGV4aWJsZSBzaXppbmcgdG8gd29yay5cbiAgICAvLyBUaGUgbWF4SGVpZ2h0IGFuZCBtYXhXaWR0aCBhcmUgc2V0IG9uIHRoZSBib3VuZGluZ0JveCBpbiBvcmRlciB0byBlbmZvcmNlIHRoZSBjb25zdHJhaW50LlxuICAgIGlmICh0aGlzLl9oYXNGbGV4aWJsZURpbWVuc2lvbnMgJiYgdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5tYXhIZWlnaHQpIHtcbiAgICAgIHN0eWxlcy5tYXhIZWlnaHQgPSAnJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faGFzRmxleGlibGVEaW1lbnNpb25zICYmIHRoaXMuX292ZXJsYXlSZWYuZ2V0Q29uZmlnKCkubWF4V2lkdGgpIHtcbiAgICAgIHN0eWxlcy5tYXhXaWR0aCA9ICcnO1xuICAgIH1cblxuICAgIGV4dGVuZFN0eWxlcyh0aGlzLl9wYW5lLnN0eWxlLCBzdHlsZXMpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGV4YWN0IHRvcC9ib3R0b20gZm9yIHRoZSBvdmVybGF5IHdoZW4gbm90IHVzaW5nIGZsZXhpYmxlIHNpemluZyBvciB3aGVuIHB1c2hpbmcuICovXG4gIHByaXZhdGUgX2dldEV4YWN0T3ZlcmxheVkocG9zaXRpb246IENvbm5lY3RlZFBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblBvaW50OiBQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbjogVmlld3BvcnRTY3JvbGxQb3NpdGlvbikge1xuICAgIC8vIFJlc2V0IGFueSBleGlzdGluZyBzdHlsZXMuIFRoaXMgaXMgbmVjZXNzYXJ5IGluIGNhc2UgdGhlXG4gICAgLy8gcHJlZmVycmVkIHBvc2l0aW9uIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGBhcHBseWAuXG4gICAgbGV0IHN0eWxlcyA9IHt0b3A6IG51bGwsIGJvdHRvbTogbnVsbH0gYXMgQ1NTU3R5bGVEZWNsYXJhdGlvbjtcbiAgICBsZXQgb3ZlcmxheVBvaW50ID0gdGhpcy5fZ2V0T3ZlcmxheVBvaW50KG9yaWdpblBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgcG9zaXRpb24pO1xuXG4gICAgaWYgKHRoaXMuX2lzUHVzaGVkKSB7XG4gICAgICBvdmVybGF5UG9pbnQgPSB0aGlzLl9wdXNoT3ZlcmxheU9uU2NyZWVuKG92ZXJsYXlQb2ludCwgdGhpcy5fb3ZlcmxheVJlY3QsIHNjcm9sbFBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBsZXQgdmlydHVhbEtleWJvYXJkT2Zmc2V0ID1cbiAgICAgICAgdGhpcy5fb3ZlcmxheUNvbnRhaW5lci5nZXRDb250YWluZXJFbGVtZW50KCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuXG4gICAgLy8gTm9ybWFsbHkgdGhpcyB3b3VsZCBiZSB6ZXJvLCBob3dldmVyIHdoZW4gdGhlIG92ZXJsYXkgaXMgYXR0YWNoZWQgdG8gYW4gaW5wdXQgKGUuZy4gaW4gYW5cbiAgICAvLyBhdXRvY29tcGxldGUpLCBtb2JpbGUgYnJvd3NlcnMgd2lsbCBzaGlmdCBldmVyeXRoaW5nIGluIG9yZGVyIHRvIHB1dCB0aGUgaW5wdXQgaW4gdGhlIG1pZGRsZVxuICAgIC8vIG9mIHRoZSBzY3JlZW4gYW5kIHRvIG1ha2Ugc3BhY2UgZm9yIHRoZSB2aXJ0dWFsIGtleWJvYXJkLiBXZSBuZWVkIHRvIGFjY291bnQgZm9yIHRoaXMgb2Zmc2V0LFxuICAgIC8vIG90aGVyd2lzZSBvdXIgcG9zaXRpb25pbmcgd2lsbCBiZSB0aHJvd24gb2ZmLlxuICAgIG92ZXJsYXlQb2ludC55IC09IHZpcnR1YWxLZXlib2FyZE9mZnNldDtcblxuICAgIC8vIFdlIHdhbnQgdG8gc2V0IGVpdGhlciBgdG9wYCBvciBgYm90dG9tYCBiYXNlZCBvbiB3aGV0aGVyIHRoZSBvdmVybGF5IHdhbnRzIHRvIGFwcGVhclxuICAgIC8vIGFib3ZlIG9yIGJlbG93IHRoZSBvcmlnaW4gYW5kIHRoZSBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGVsZW1lbnQgd2lsbCBleHBhbmQuXG4gICAgaWYgKHBvc2l0aW9uLm92ZXJsYXlZID09PSAnYm90dG9tJykge1xuICAgICAgLy8gV2hlbiB1c2luZyBgYm90dG9tYCwgd2UgYWRqdXN0IHRoZSB5IHBvc2l0aW9uIHN1Y2ggdGhhdCBpdCBpcyB0aGUgZGlzdGFuY2VcbiAgICAgIC8vIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlld3BvcnQgcmF0aGVyIHRoYW4gdGhlIHRvcC5cbiAgICAgIGNvbnN0IGRvY3VtZW50SGVpZ2h0ID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRIZWlnaHQ7XG4gICAgICBzdHlsZXMuYm90dG9tID0gYCR7ZG9jdW1lbnRIZWlnaHQgLSAob3ZlcmxheVBvaW50LnkgKyB0aGlzLl9vdmVybGF5UmVjdC5oZWlnaHQpfXB4YDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGVzLnRvcCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUob3ZlcmxheVBvaW50LnkpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgZXhhY3QgbGVmdC9yaWdodCBmb3IgdGhlIG92ZXJsYXkgd2hlbiBub3QgdXNpbmcgZmxleGlibGUgc2l6aW5nIG9yIHdoZW4gcHVzaGluZy4gKi9cbiAgcHJpdmF0ZSBfZ2V0RXhhY3RPdmVybGF5WChwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luUG9pbnQ6IFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uOiBWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKSB7XG4gICAgLy8gUmVzZXQgYW55IGV4aXN0aW5nIHN0eWxlcy4gVGhpcyBpcyBuZWNlc3NhcnkgaW4gY2FzZSB0aGUgcHJlZmVycmVkIHBvc2l0aW9uIGhhc1xuICAgIC8vIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgYGFwcGx5YC5cbiAgICBsZXQgc3R5bGVzID0ge2xlZnQ6IG51bGwsIHJpZ2h0OiBudWxsfSBhcyBDU1NTdHlsZURlY2xhcmF0aW9uO1xuICAgIGxldCBvdmVybGF5UG9pbnQgPSB0aGlzLl9nZXRPdmVybGF5UG9pbnQob3JpZ2luUG9pbnQsIHRoaXMuX292ZXJsYXlSZWN0LCBwb3NpdGlvbik7XG5cbiAgICBpZiAodGhpcy5faXNQdXNoZWQpIHtcbiAgICAgIG92ZXJsYXlQb2ludCA9IHRoaXMuX3B1c2hPdmVybGF5T25TY3JlZW4ob3ZlcmxheVBvaW50LCB0aGlzLl9vdmVybGF5UmVjdCwgc2Nyb2xsUG9zaXRpb24pO1xuICAgIH1cblxuICAgIC8vIFdlIHdhbnQgdG8gc2V0IGVpdGhlciBgbGVmdGAgb3IgYHJpZ2h0YCBiYXNlZCBvbiB3aGV0aGVyIHRoZSBvdmVybGF5IHdhbnRzIHRvIGFwcGVhciBcImJlZm9yZVwiXG4gICAgLy8gb3IgXCJhZnRlclwiIHRoZSBvcmlnaW4sIHdoaWNoIGRldGVybWluZXMgdGhlIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgZWxlbWVudCB3aWxsIGV4cGFuZC5cbiAgICAvLyBGb3IgdGhlIGhvcml6b250YWwgYXhpcywgdGhlIG1lYW5pbmcgb2YgXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiIGNoYW5nZSBiYXNlZCBvbiB3aGV0aGVyIHRoZVxuICAgIC8vIHBhZ2UgaXMgaW4gUlRMIG9yIExUUi5cbiAgICBsZXQgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHk6ICdsZWZ0JyB8ICdyaWdodCc7XG5cbiAgICBpZiAodGhpcy5faXNSdGwoKSkge1xuICAgICAgaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ2VuZCcgPyAnbGVmdCcgOiAncmlnaHQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBob3Jpem9udGFsU3R5bGVQcm9wZXJ0eSA9IHBvc2l0aW9uLm92ZXJsYXlYID09PSAnZW5kJyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB3ZSdyZSBzZXR0aW5nIGByaWdodGAsIHdlIGFkanVzdCB0aGUgeCBwb3NpdGlvbiBzdWNoIHRoYXQgaXQgaXMgdGhlIGRpc3RhbmNlXG4gICAgLy8gZnJvbSB0aGUgcmlnaHQgZWRnZSBvZiB0aGUgdmlld3BvcnQgcmF0aGVyIHRoYW4gdGhlIGxlZnQgZWRnZS5cbiAgICBpZiAoaG9yaXpvbnRhbFN0eWxlUHJvcGVydHkgPT09ICdyaWdodCcpIHtcbiAgICAgIGNvbnN0IGRvY3VtZW50V2lkdGggPSB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhLmNsaWVudFdpZHRoO1xuICAgICAgc3R5bGVzLnJpZ2h0ID0gYCR7ZG9jdW1lbnRXaWR0aCAtIChvdmVybGF5UG9pbnQueCArIHRoaXMuX292ZXJsYXlSZWN0LndpZHRoKX1weGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlcy5sZWZ0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZShvdmVybGF5UG9pbnQueCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3IHByb3BlcnRpZXMgb2YgdGhlIHRyaWdnZXIgYW5kIG92ZXJsYXksIGluY2x1ZGluZyB3aGV0aGVyIHRoZXkgYXJlIGNsaXBwZWRcbiAgICogb3IgY29tcGxldGVseSBvdXRzaWRlIHRoZSB2aWV3IG9mIGFueSBvZiB0aGUgc3RyYXRlZ3kncyBzY3JvbGxhYmxlcy5cbiAgICovXG4gIHByaXZhdGUgX2dldFNjcm9sbFZpc2liaWxpdHkoKTogU2Nyb2xsaW5nVmlzaWJpbGl0eSB7XG4gICAgLy8gTm90ZTogbmVlZHMgZnJlc2ggcmVjdHMgc2luY2UgdGhlIHBvc2l0aW9uIGNvdWxkJ3ZlIGNoYW5nZWQuXG4gICAgY29uc3Qgb3JpZ2luQm91bmRzID0gdGhpcy5fZ2V0T3JpZ2luUmVjdCgpO1xuICAgIGNvbnN0IG92ZXJsYXlCb3VuZHMgPSAgdGhpcy5fcGFuZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIFRPRE8oamVsYm91cm4pOiBpbnN0ZWFkIG9mIG5lZWRpbmcgYWxsIG9mIHRoZSBjbGllbnQgcmVjdHMgZm9yIHRoZXNlIHNjcm9sbGluZyBjb250YWluZXJzXG4gICAgLy8gZXZlcnkgdGltZSwgd2Ugc2hvdWxkIGJlIGFibGUgdG8gdXNlIHRoZSBzY3JvbGxUb3Agb2YgdGhlIGNvbnRhaW5lcnMgaWYgdGhlIHNpemUgb2YgdGhvc2VcbiAgICAvLyBjb250YWluZXJzIGhhc24ndCBjaGFuZ2VkLlxuICAgIGNvbnN0IHNjcm9sbENvbnRhaW5lckJvdW5kcyA9IHRoaXMuX3Njcm9sbGFibGVzLm1hcChzY3JvbGxhYmxlID0+IHtcbiAgICAgIHJldHVybiBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzT3JpZ2luQ2xpcHBlZDogaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nKG9yaWdpbkJvdW5kcywgc2Nyb2xsQ29udGFpbmVyQm91bmRzKSxcbiAgICAgIGlzT3JpZ2luT3V0c2lkZVZpZXc6IGlzRWxlbWVudFNjcm9sbGVkT3V0c2lkZVZpZXcob3JpZ2luQm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgICAgaXNPdmVybGF5Q2xpcHBlZDogaXNFbGVtZW50Q2xpcHBlZEJ5U2Nyb2xsaW5nKG92ZXJsYXlCb3VuZHMsIHNjcm9sbENvbnRhaW5lckJvdW5kcyksXG4gICAgICBpc092ZXJsYXlPdXRzaWRlVmlldzogaXNFbGVtZW50U2Nyb2xsZWRPdXRzaWRlVmlldyhvdmVybGF5Qm91bmRzLCBzY3JvbGxDb250YWluZXJCb3VuZHMpLFxuICAgIH07XG4gIH1cblxuICAvKiogU3VidHJhY3RzIHRoZSBhbW91bnQgdGhhdCBhbiBlbGVtZW50IGlzIG92ZXJmbG93aW5nIG9uIGFuIGF4aXMgZnJvbSBpdHMgbGVuZ3RoLiAqL1xuICBwcml2YXRlIF9zdWJ0cmFjdE92ZXJmbG93cyhsZW5ndGg6IG51bWJlciwgLi4ub3ZlcmZsb3dzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIG92ZXJmbG93cy5yZWR1Y2UoKGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50T3ZlcmZsb3c6IG51bWJlcikgPT4ge1xuICAgICAgcmV0dXJuIGN1cnJlbnRWYWx1ZSAtIE1hdGgubWF4KGN1cnJlbnRPdmVyZmxvdywgMCk7XG4gICAgfSwgbGVuZ3RoKTtcbiAgfVxuXG4gIC8qKiBOYXJyb3dzIHRoZSBnaXZlbiB2aWV3cG9ydCByZWN0IGJ5IHRoZSBjdXJyZW50IF92aWV3cG9ydE1hcmdpbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0TmFycm93ZWRWaWV3cG9ydFJlY3QoKTogQ2xpZW50UmVjdCB7XG4gICAgLy8gV2UgcmVjYWxjdWxhdGUgdGhlIHZpZXdwb3J0IHJlY3QgaGVyZSBvdXJzZWx2ZXMsIHJhdGhlciB0aGFuIHVzaW5nIHRoZSBWaWV3cG9ydFJ1bGVyLFxuICAgIC8vIGJlY2F1c2Ugd2Ugd2FudCB0byB1c2UgdGhlIGBjbGllbnRXaWR0aGAgYW5kIGBjbGllbnRIZWlnaHRgIGFzIHRoZSBiYXNlLiBUaGUgZGlmZmVyZW5jZVxuICAgIC8vIGJlaW5nIHRoYXQgdGhlIGNsaWVudCBwcm9wZXJ0aWVzIGRvbid0IGluY2x1ZGUgdGhlIHNjcm9sbGJhciwgYXMgb3Bwb3NlZCB0byBgaW5uZXJXaWR0aGBcbiAgICAvLyBhbmQgYGlubmVySGVpZ2h0YCB0aGF0IGRvLiBUaGlzIGlzIG5lY2Vzc2FyeSwgYmVjYXVzZSB0aGUgb3ZlcmxheSBjb250YWluZXIgdXNlc1xuICAgIC8vIDEwMCUgYHdpZHRoYCBhbmQgYGhlaWdodGAgd2hpY2ggZG9uJ3QgaW5jbHVkZSB0aGUgc2Nyb2xsYmFyIGVpdGhlci5cbiAgICBjb25zdCB3aWR0aCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCEuY2xpZW50V2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6ICAgIHNjcm9sbFBvc2l0aW9uLnRvcCArIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgbGVmdDogICBzY3JvbGxQb3NpdGlvbi5sZWZ0ICsgdGhpcy5fdmlld3BvcnRNYXJnaW4sXG4gICAgICByaWdodDogIHNjcm9sbFBvc2l0aW9uLmxlZnQgKyB3aWR0aCAtIHRoaXMuX3ZpZXdwb3J0TWFyZ2luLFxuICAgICAgYm90dG9tOiBzY3JvbGxQb3NpdGlvbi50b3AgKyBoZWlnaHQgLSB0aGlzLl92aWV3cG9ydE1hcmdpbixcbiAgICAgIHdpZHRoOiAgd2lkdGggIC0gKDIgKiB0aGlzLl92aWV3cG9ydE1hcmdpbiksXG4gICAgICBoZWlnaHQ6IGhlaWdodCAtICgyICogdGhpcy5fdmlld3BvcnRNYXJnaW4pLFxuICAgIH07XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgd2UncmUgZGVhbGluZyB3aXRoIGFuIFJUTCBjb250ZXh0ICovXG4gIHByaXZhdGUgX2lzUnRsKCkge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5UmVmLmdldERpcmVjdGlvbigpID09PSAncnRsJztcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG92ZXJsYXkgdXNlcyBleGFjdCBvciBmbGV4aWJsZSBwb3NpdGlvbmluZy4gKi9cbiAgcHJpdmF0ZSBfaGFzRXhhY3RQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gIXRoaXMuX2hhc0ZsZXhpYmxlRGltZW5zaW9ucyB8fCB0aGlzLl9pc1B1c2hlZDtcbiAgfVxuXG4gIC8qKiBSZXRyaWV2ZXMgdGhlIG9mZnNldCBvZiBhIHBvc2l0aW9uIGFsb25nIHRoZSB4IG9yIHkgYXhpcy4gKi9cbiAgcHJpdmF0ZSBfZ2V0T2Zmc2V0KHBvc2l0aW9uOiBDb25uZWN0ZWRQb3NpdGlvbiwgYXhpczogJ3gnIHwgJ3knKSB7XG4gICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgLy8gV2UgZG9uJ3QgZG8gc29tZXRoaW5nIGxpa2UgYHBvc2l0aW9uWydvZmZzZXQnICsgYXhpc11gIGluXG4gICAgICAvLyBvcmRlciB0byBhdm9pZCBicmVraW5nIG1pbmlmaWVycyB0aGF0IHJlbmFtZSBwcm9wZXJ0aWVzLlxuICAgICAgcmV0dXJuIHBvc2l0aW9uLm9mZnNldFggPT0gbnVsbCA/IHRoaXMuX29mZnNldFggOiBwb3NpdGlvbi5vZmZzZXRYO1xuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbi5vZmZzZXRZID09IG51bGwgPyB0aGlzLl9vZmZzZXRZIDogcG9zaXRpb24ub2Zmc2V0WTtcbiAgfVxuXG4gIC8qKiBWYWxpZGF0ZXMgdGhhdCB0aGUgY3VycmVudCBwb3NpdGlvbiBtYXRjaCB0aGUgZXhwZWN0ZWQgdmFsdWVzLiAqL1xuICBwcml2YXRlIF92YWxpZGF0ZVBvc2l0aW9ucygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3ByZWZlcnJlZFBvc2l0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKCdGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k6IEF0IGxlYXN0IG9uZSBwb3NpdGlvbiBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogcmVtb3ZlIHRoZXNlIG9uY2UgQW5ndWxhcidzIHRlbXBsYXRlIHR5cGVcbiAgICAvLyBjaGVja2luZyBpcyBhZHZhbmNlZCBlbm91Z2ggdG8gY2F0Y2ggdGhlc2UgY2FzZXMuXG4gICAgdGhpcy5fcHJlZmVycmVkUG9zaXRpb25zLmZvckVhY2gocGFpciA9PiB7XG4gICAgICB2YWxpZGF0ZUhvcml6b250YWxQb3NpdGlvbignb3JpZ2luWCcsIHBhaXIub3JpZ2luWCk7XG4gICAgICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24oJ29yaWdpblknLCBwYWlyLm9yaWdpblkpO1xuICAgICAgdmFsaWRhdGVIb3Jpem9udGFsUG9zaXRpb24oJ292ZXJsYXlYJywgcGFpci5vdmVybGF5WCk7XG4gICAgICB2YWxpZGF0ZVZlcnRpY2FsUG9zaXRpb24oJ292ZXJsYXlZJywgcGFpci5vdmVybGF5WSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQWRkcyBhIHNpbmdsZSBDU1MgY2xhc3Mgb3IgYW4gYXJyYXkgb2YgY2xhc3NlcyBvbiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfYWRkUGFuZWxDbGFzc2VzKGNzc0NsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIGNvZXJjZUFycmF5KGNzc0NsYXNzZXMpLmZvckVhY2goY3NzQ2xhc3MgPT4ge1xuICAgICAgICBpZiAoY3NzQ2xhc3MgIT09ICcnICYmIHRoaXMuX2FwcGxpZWRQYW5lbENsYXNzZXMuaW5kZXhPZihjc3NDbGFzcykgPT09IC0xKSB7XG4gICAgICAgICAgdGhpcy5fYXBwbGllZFBhbmVsQ2xhc3Nlcy5wdXNoKGNzc0NsYXNzKTtcbiAgICAgICAgICB0aGlzLl9wYW5lLmNsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXJzIHRoZSBjbGFzc2VzIHRoYXQgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGhhcyBhcHBsaWVkIGZyb20gdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX2NsZWFyUGFuZWxDbGFzc2VzKCkge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzLmZvckVhY2goY3NzQ2xhc3MgPT4ge1xuICAgICAgICB0aGlzLl9wYW5lLmNsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9hcHBsaWVkUGFuZWxDbGFzc2VzID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIENsaWVudFJlY3Qgb2YgdGhlIGN1cnJlbnQgb3JpZ2luLiAqL1xuICBwcml2YXRlIF9nZXRPcmlnaW5SZWN0KCk6IENsaWVudFJlY3Qge1xuICAgIGNvbnN0IG9yaWdpbiA9IHRoaXMuX29yaWdpbjtcblxuICAgIGlmIChvcmlnaW4gaW5zdGFuY2VvZiBFbGVtZW50UmVmKSB7XG4gICAgICByZXR1cm4gb3JpZ2luLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxuXG4gICAgaWYgKG9yaWdpbiBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICByZXR1cm4gb3JpZ2luLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH1cblxuICAgIGNvbnN0IHdpZHRoID0gb3JpZ2luLndpZHRoIHx8IDA7XG4gICAgY29uc3QgaGVpZ2h0ID0gb3JpZ2luLmhlaWdodCB8fCAwO1xuXG4gICAgLy8gSWYgdGhlIG9yaWdpbiBpcyBhIHBvaW50LCByZXR1cm4gYSBjbGllbnQgcmVjdCBhcyBpZiBpdCB3YXMgYSAweDAgZWxlbWVudCBhdCB0aGUgcG9pbnQuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogb3JpZ2luLnksXG4gICAgICBib3R0b206IG9yaWdpbi55ICsgaGVpZ2h0LFxuICAgICAgbGVmdDogb3JpZ2luLngsXG4gICAgICByaWdodDogb3JpZ2luLnggKyB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHdpZHRoXG4gICAgfTtcbiAgfVxufVxuXG4vKiogQSBzaW1wbGUgKHgsIHkpIGNvb3JkaW5hdGUuICovXG5pbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuLyoqIFJlY29yZCBvZiBtZWFzdXJlbWVudHMgZm9yIGhvdyBhbiBvdmVybGF5IChhdCBhIGdpdmVuIHBvc2l0aW9uKSBmaXRzIGludG8gdGhlIHZpZXdwb3J0LiAqL1xuaW50ZXJmYWNlIE92ZXJsYXlGaXQge1xuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBmaXRzIGNvbXBsZXRlbHkgaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBpc0NvbXBsZXRlbHlXaXRoaW5WaWV3cG9ydDogYm9vbGVhbjtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBmaXRzIGluIHRoZSB2aWV3cG9ydCBvbiB0aGUgeS1heGlzLiAqL1xuICBmaXRzSW5WaWV3cG9ydFZlcnRpY2FsbHk6IGJvb2xlYW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgZml0cyBpbiB0aGUgdmlld3BvcnQgb24gdGhlIHgtYXhpcy4gKi9cbiAgZml0c0luVmlld3BvcnRIb3Jpem9udGFsbHk6IGJvb2xlYW47XG5cbiAgLyoqIFRoZSB0b3RhbCB2aXNpYmxlIGFyZWEgKGluIHB4XjIpIG9mIHRoZSBvdmVybGF5IGluc2lkZSB0aGUgdmlld3BvcnQuICovXG4gIHZpc2libGVBcmVhOiBudW1iZXI7XG59XG5cbi8qKiBSZWNvcmQgb2YgdGhlIG1lYXN1cm1lbnRzIGRldGVybWluaW5nIHdoZXRoZXIgYW4gb3ZlcmxheSB3aWxsIGZpdCBpbiBhIHNwZWNpZmljIHBvc2l0aW9uLiAqL1xuaW50ZXJmYWNlIEZhbGxiYWNrUG9zaXRpb24ge1xuICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb247XG4gIG9yaWdpblBvaW50OiBQb2ludDtcbiAgb3ZlcmxheVBvaW50OiBQb2ludDtcbiAgb3ZlcmxheUZpdDogT3ZlcmxheUZpdDtcbiAgb3ZlcmxheVJlY3Q6IENsaWVudFJlY3Q7XG59XG5cbi8qKiBQb3NpdGlvbiBhbmQgc2l6ZSBvZiB0aGUgb3ZlcmxheSBzaXppbmcgd3JhcHBlciBmb3IgYSBzcGVjaWZpYyBwb3NpdGlvbi4gKi9cbmludGVyZmFjZSBCb3VuZGluZ0JveFJlY3Qge1xuICB0b3A6IG51bWJlcjtcbiAgbGVmdDogbnVtYmVyO1xuICBib3R0b206IG51bWJlcjtcbiAgcmlnaHQ6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIHdpZHRoOiBudW1iZXI7XG59XG5cbi8qKiBSZWNvcmQgb2YgbWVhc3VyZXMgZGV0ZXJtaW5pbmcgaG93IHdlbGwgYSBnaXZlbiBwb3NpdGlvbiB3aWxsIGZpdCB3aXRoIGZsZXhpYmxlIGRpbWVuc2lvbnMuICovXG5pbnRlcmZhY2UgRmxleGlibGVGaXQge1xuICBwb3NpdGlvbjogQ29ubmVjdGVkUG9zaXRpb247XG4gIG9yaWdpbjogUG9pbnQ7XG4gIG92ZXJsYXlSZWN0OiBDbGllbnRSZWN0O1xuICBib3VuZGluZ0JveFJlY3Q6IEJvdW5kaW5nQm94UmVjdDtcbn1cblxuLyoqIEEgY29ubmVjdGVkIHBvc2l0aW9uIGFzIHNwZWNpZmllZCBieSB0aGUgdXNlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdGVkUG9zaXRpb24ge1xuICBvcmlnaW5YOiAnc3RhcnQnIHwgJ2NlbnRlcicgfCAnZW5kJztcbiAgb3JpZ2luWTogJ3RvcCcgfCAnY2VudGVyJyB8ICdib3R0b20nO1xuXG4gIG92ZXJsYXlYOiAnc3RhcnQnIHwgJ2NlbnRlcicgfCAnZW5kJztcbiAgb3ZlcmxheVk6ICd0b3AnIHwgJ2NlbnRlcicgfCAnYm90dG9tJztcblxuICB3ZWlnaHQ/OiBudW1iZXI7XG4gIG9mZnNldFg/OiBudW1iZXI7XG4gIG9mZnNldFk/OiBudW1iZXI7XG4gIHBhbmVsQ2xhc3M/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbn1cblxuLyoqIFNoYWxsb3ctZXh0ZW5kcyBhIHN0eWxlc2hlZXQgb2JqZWN0IHdpdGggYW5vdGhlciBzdHlsZXNoZWV0IG9iamVjdC4gKi9cbmZ1bmN0aW9uIGV4dGVuZFN0eWxlcyhkZXN0OiBDU1NTdHlsZURlY2xhcmF0aW9uLCBzb3VyY2U6IENTU1N0eWxlRGVjbGFyYXRpb24pOiBDU1NTdHlsZURlY2xhcmF0aW9uIHtcbiAgZm9yIChsZXQga2V5IGluIHNvdXJjZSkge1xuICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgZGVzdFtrZXldID0gc291cmNlW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRlc3Q7XG59XG4iXX0=