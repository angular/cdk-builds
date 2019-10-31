/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, EventEmitter, Inject, InjectionToken, Input, Optional, Output, TemplateRef, ViewContainerRef, } from '@angular/core';
import { Subscription } from 'rxjs';
import { Overlay } from './overlay';
import { OverlayConfig } from './overlay-config';
/**
 * Default set of positions for the overlay. Follows the behavior of a dropdown.
 * @type {?}
 */
const defaultPositionList = [
    {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
    },
    {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
    },
    {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom'
    },
    {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top'
    }
];
/**
 * Injection token that determines the scroll handling while the connected overlay is open.
 * @type {?}
 */
export const CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY = new InjectionToken('cdk-connected-overlay-scroll-strategy');
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @param {?} overlay
 * @return {?}
 */
export function CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_FACTORY(overlay) {
    return (/**
     * @param {?=} config
     * @return {?}
     */
    (config) => overlay.scrollStrategies.reposition(config));
}
/**
 * Directive applied to an element to make it usable as an origin for an Overlay using a
 * ConnectedPositionStrategy.
 */
export class CdkOverlayOrigin {
    /**
     * @param {?} elementRef
     */
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
}
CdkOverlayOrigin.decorators = [
    { type: Directive, args: [{
                selector: '[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]',
                exportAs: 'cdkOverlayOrigin',
            },] }
];
/** @nocollapse */
CdkOverlayOrigin.ctorParameters = () => [
    { type: ElementRef }
];
if (false) {
    /**
     * Reference to the element on which the directive is applied.
     * @type {?}
     */
    CdkOverlayOrigin.prototype.elementRef;
}
/**
 * Directive to facilitate declarative creation of an
 * Overlay using a FlexibleConnectedPositionStrategy.
 */
export class CdkConnectedOverlay {
    // TODO(jelbourn): inputs for size, scroll behavior, animation, etc.
    /**
     * @param {?} _overlay
     * @param {?} templateRef
     * @param {?} viewContainerRef
     * @param {?} scrollStrategyFactory
     * @param {?} _dir
     */
    constructor(_overlay, templateRef, viewContainerRef, scrollStrategyFactory, _dir) {
        this._overlay = _overlay;
        this._dir = _dir;
        this._hasBackdrop = false;
        this._lockPosition = false;
        this._growAfterOpen = false;
        this._flexibleDimensions = false;
        this._push = false;
        this._backdropSubscription = Subscription.EMPTY;
        /**
         * Margin between the overlay and the viewport edges.
         */
        this.viewportMargin = 0;
        /**
         * Whether the overlay is open.
         */
        this.open = false;
        /**
         * Event emitted when the backdrop is clicked.
         */
        this.backdropClick = new EventEmitter();
        /**
         * Event emitted when the position has changed.
         */
        this.positionChange = new EventEmitter();
        /**
         * Event emitted when the overlay has been attached.
         */
        this.attach = new EventEmitter();
        /**
         * Event emitted when the overlay has been detached.
         */
        this.detach = new EventEmitter();
        /**
         * Emits when there are keyboard events that are targeted at the overlay.
         */
        this.overlayKeydown = new EventEmitter();
        this._templatePortal = new TemplatePortal(templateRef, viewContainerRef);
        this._scrollStrategyFactory = scrollStrategyFactory;
        this.scrollStrategy = this._scrollStrategyFactory();
    }
    /**
     * The offset in pixels for the overlay connection point on the x-axis
     * @return {?}
     */
    get offsetX() { return this._offsetX; }
    /**
     * @param {?} offsetX
     * @return {?}
     */
    set offsetX(offsetX) {
        this._offsetX = offsetX;
        if (this._position) {
            this._updatePositionStrategy(this._position);
        }
    }
    /**
     * The offset in pixels for the overlay connection point on the y-axis
     * @return {?}
     */
    get offsetY() { return this._offsetY; }
    /**
     * @param {?} offsetY
     * @return {?}
     */
    set offsetY(offsetY) {
        this._offsetY = offsetY;
        if (this._position) {
            this._updatePositionStrategy(this._position);
        }
    }
    /**
     * Whether or not the overlay should attach a backdrop.
     * @return {?}
     */
    get hasBackdrop() { return this._hasBackdrop; }
    /**
     * @param {?} value
     * @return {?}
     */
    set hasBackdrop(value) { this._hasBackdrop = coerceBooleanProperty(value); }
    /**
     * Whether or not the overlay should be locked when scrolling.
     * @return {?}
     */
    get lockPosition() { return this._lockPosition; }
    /**
     * @param {?} value
     * @return {?}
     */
    set lockPosition(value) { this._lockPosition = coerceBooleanProperty(value); }
    /**
     * Whether the overlay's width and height can be constrained to fit within the viewport.
     * @return {?}
     */
    get flexibleDimensions() { return this._flexibleDimensions; }
    /**
     * @param {?} value
     * @return {?}
     */
    set flexibleDimensions(value) {
        this._flexibleDimensions = coerceBooleanProperty(value);
    }
    /**
     * Whether the overlay can grow after the initial open when flexible positioning is turned on.
     * @return {?}
     */
    get growAfterOpen() { return this._growAfterOpen; }
    /**
     * @param {?} value
     * @return {?}
     */
    set growAfterOpen(value) { this._growAfterOpen = coerceBooleanProperty(value); }
    /**
     * Whether the overlay can be pushed on-screen if none of the provided positions fit.
     * @return {?}
     */
    get push() { return this._push; }
    /**
     * @param {?} value
     * @return {?}
     */
    set push(value) { this._push = coerceBooleanProperty(value); }
    /**
     * The associated overlay reference.
     * @return {?}
     */
    get overlayRef() {
        return this._overlayRef;
    }
    /**
     * The element's layout direction.
     * @return {?}
     */
    get dir() {
        return this._dir ? this._dir.value : 'ltr';
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        if (this._overlayRef) {
            this._overlayRef.dispose();
        }
        this._backdropSubscription.unsubscribe();
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        if (this._position) {
            this._updatePositionStrategy(this._position);
            this._overlayRef.updateSize({
                width: this.width,
                minWidth: this.minWidth,
                height: this.height,
                minHeight: this.minHeight,
            });
            if (changes['origin'] && this.open) {
                this._position.apply();
            }
        }
        if (changes['open']) {
            this.open ? this._attachOverlay() : this._detachOverlay();
        }
    }
    /**
     * Creates an overlay
     * @private
     * @return {?}
     */
    _createOverlay() {
        if (!this.positions || !this.positions.length) {
            this.positions = defaultPositionList;
        }
        this._overlayRef = this._overlay.create(this._buildConfig());
        this._overlayRef.keydownEvents().subscribe((/**
         * @param {?} event
         * @return {?}
         */
        (event) => {
            this.overlayKeydown.next(event);
            if (event.keyCode === ESCAPE && !hasModifierKey(event)) {
                event.preventDefault();
                this._detachOverlay();
            }
        }));
    }
    /**
     * Builds the overlay config based on the directive's inputs
     * @private
     * @return {?}
     */
    _buildConfig() {
        /** @type {?} */
        const positionStrategy = this._position = this._createPositionStrategy();
        /** @type {?} */
        const overlayConfig = new OverlayConfig({
            direction: this._dir,
            positionStrategy,
            scrollStrategy: this.scrollStrategy,
            hasBackdrop: this.hasBackdrop
        });
        if (this.width || this.width === 0) {
            overlayConfig.width = this.width;
        }
        if (this.height || this.height === 0) {
            overlayConfig.height = this.height;
        }
        if (this.minWidth || this.minWidth === 0) {
            overlayConfig.minWidth = this.minWidth;
        }
        if (this.minHeight || this.minHeight === 0) {
            overlayConfig.minHeight = this.minHeight;
        }
        if (this.backdropClass) {
            overlayConfig.backdropClass = this.backdropClass;
        }
        if (this.panelClass) {
            overlayConfig.panelClass = this.panelClass;
        }
        return overlayConfig;
    }
    /**
     * Updates the state of a position strategy, based on the values of the directive inputs.
     * @private
     * @param {?} positionStrategy
     * @return {?}
     */
    _updatePositionStrategy(positionStrategy) {
        /** @type {?} */
        const positions = this.positions.map((/**
         * @param {?} currentPosition
         * @return {?}
         */
        currentPosition => ({
            originX: currentPosition.originX,
            originY: currentPosition.originY,
            overlayX: currentPosition.overlayX,
            overlayY: currentPosition.overlayY,
            offsetX: currentPosition.offsetX || this.offsetX,
            offsetY: currentPosition.offsetY || this.offsetY,
            panelClass: currentPosition.panelClass || undefined,
        })));
        return positionStrategy
            .setOrigin(this.origin.elementRef)
            .withPositions(positions)
            .withFlexibleDimensions(this.flexibleDimensions)
            .withPush(this.push)
            .withGrowAfterOpen(this.growAfterOpen)
            .withViewportMargin(this.viewportMargin)
            .withLockedPosition(this.lockPosition);
    }
    /**
     * Returns the position strategy of the overlay to be set on the overlay config
     * @private
     * @return {?}
     */
    _createPositionStrategy() {
        /** @type {?} */
        const strategy = this._overlay.position().flexibleConnectedTo(this.origin.elementRef);
        this._updatePositionStrategy(strategy);
        strategy.positionChanges.subscribe((/**
         * @param {?} p
         * @return {?}
         */
        p => this.positionChange.emit(p)));
        return strategy;
    }
    /**
     * Attaches the overlay and subscribes to backdrop clicks if backdrop exists
     * @private
     * @return {?}
     */
    _attachOverlay() {
        if (!this._overlayRef) {
            this._createOverlay();
        }
        else {
            // Update the overlay size, in case the directive's inputs have changed
            this._overlayRef.getConfig().hasBackdrop = this.hasBackdrop;
        }
        if (!this._overlayRef.hasAttached()) {
            this._overlayRef.attach(this._templatePortal);
            this.attach.emit();
        }
        if (this.hasBackdrop) {
            this._backdropSubscription = this._overlayRef.backdropClick().subscribe((/**
             * @param {?} event
             * @return {?}
             */
            event => {
                this.backdropClick.emit(event);
            }));
        }
        else {
            this._backdropSubscription.unsubscribe();
        }
    }
    /**
     * Detaches the overlay and unsubscribes to backdrop clicks if backdrop exists
     * @private
     * @return {?}
     */
    _detachOverlay() {
        if (this._overlayRef) {
            this._overlayRef.detach();
            this.detach.emit();
        }
        this._backdropSubscription.unsubscribe();
    }
}
CdkConnectedOverlay.decorators = [
    { type: Directive, args: [{
                selector: '[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]',
                exportAs: 'cdkConnectedOverlay'
            },] }
];
/** @nocollapse */
CdkConnectedOverlay.ctorParameters = () => [
    { type: Overlay },
    { type: TemplateRef },
    { type: ViewContainerRef },
    { type: undefined, decorators: [{ type: Inject, args: [CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY,] }] },
    { type: Directionality, decorators: [{ type: Optional }] }
];
CdkConnectedOverlay.propDecorators = {
    origin: [{ type: Input, args: ['cdkConnectedOverlayOrigin',] }],
    positions: [{ type: Input, args: ['cdkConnectedOverlayPositions',] }],
    offsetX: [{ type: Input, args: ['cdkConnectedOverlayOffsetX',] }],
    offsetY: [{ type: Input, args: ['cdkConnectedOverlayOffsetY',] }],
    width: [{ type: Input, args: ['cdkConnectedOverlayWidth',] }],
    height: [{ type: Input, args: ['cdkConnectedOverlayHeight',] }],
    minWidth: [{ type: Input, args: ['cdkConnectedOverlayMinWidth',] }],
    minHeight: [{ type: Input, args: ['cdkConnectedOverlayMinHeight',] }],
    backdropClass: [{ type: Input, args: ['cdkConnectedOverlayBackdropClass',] }],
    panelClass: [{ type: Input, args: ['cdkConnectedOverlayPanelClass',] }],
    viewportMargin: [{ type: Input, args: ['cdkConnectedOverlayViewportMargin',] }],
    scrollStrategy: [{ type: Input, args: ['cdkConnectedOverlayScrollStrategy',] }],
    open: [{ type: Input, args: ['cdkConnectedOverlayOpen',] }],
    hasBackdrop: [{ type: Input, args: ['cdkConnectedOverlayHasBackdrop',] }],
    lockPosition: [{ type: Input, args: ['cdkConnectedOverlayLockPosition',] }],
    flexibleDimensions: [{ type: Input, args: ['cdkConnectedOverlayFlexibleDimensions',] }],
    growAfterOpen: [{ type: Input, args: ['cdkConnectedOverlayGrowAfterOpen',] }],
    push: [{ type: Input, args: ['cdkConnectedOverlayPush',] }],
    backdropClick: [{ type: Output }],
    positionChange: [{ type: Output }],
    attach: [{ type: Output }],
    detach: [{ type: Output }],
    overlayKeydown: [{ type: Output }]
};
if (false) {
    /** @type {?} */
    CdkConnectedOverlay.ngAcceptInputType_hasBackdrop;
    /** @type {?} */
    CdkConnectedOverlay.ngAcceptInputType_lockPosition;
    /** @type {?} */
    CdkConnectedOverlay.ngAcceptInputType_flexibleDimensions;
    /** @type {?} */
    CdkConnectedOverlay.ngAcceptInputType_growAfterOpen;
    /** @type {?} */
    CdkConnectedOverlay.ngAcceptInputType_push;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._overlayRef;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._templatePortal;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._hasBackdrop;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._lockPosition;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._growAfterOpen;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._flexibleDimensions;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._push;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._backdropSubscription;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._offsetX;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._offsetY;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._position;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._scrollStrategyFactory;
    /**
     * Origin for the connected overlay.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.origin;
    /**
     * Registered connected position pairs.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.positions;
    /**
     * The width of the overlay panel.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.width;
    /**
     * The height of the overlay panel.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.height;
    /**
     * The min width of the overlay panel.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.minWidth;
    /**
     * The min height of the overlay panel.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.minHeight;
    /**
     * The custom class to be set on the backdrop element.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.backdropClass;
    /**
     * The custom class to add to the overlay pane element.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.panelClass;
    /**
     * Margin between the overlay and the viewport edges.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.viewportMargin;
    /**
     * Strategy to be used when handling scroll events while the overlay is open.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.scrollStrategy;
    /**
     * Whether the overlay is open.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.open;
    /**
     * Event emitted when the backdrop is clicked.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.backdropClick;
    /**
     * Event emitted when the position has changed.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.positionChange;
    /**
     * Event emitted when the overlay has been attached.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.attach;
    /**
     * Event emitted when the overlay has been detached.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.detach;
    /**
     * Emits when there are keyboard events that are targeted at the overlay.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.overlayKeydown;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._overlay;
    /**
     * @type {?}
     * @private
     */
    CdkConnectedOverlay.prototype._dir;
}
/**
 * \@docs-private
 * @param {?} overlay
 * @return {?}
 */
export function CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay) {
    return (/**
     * @return {?}
     */
    () => overlay.scrollStrategies.reposition());
}
/**
 * \@docs-private
 * @type {?}
 */
export const CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER = {
    provide: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY,
    deps: [Overlay],
    useFactory: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1kaXJlY3RpdmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L292ZXJsYXktZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBWSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLGNBQWMsRUFDZCxLQUFLLEVBR0wsUUFBUSxFQUNSLE1BQU0sRUFFTixXQUFXLEVBQ1gsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7O01BZXpDLG1CQUFtQixHQUF3QjtJQUMvQztRQUNFLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLFFBQVEsRUFBRSxLQUFLO0tBQ2hCO0lBQ0Q7UUFDRSxPQUFPLEVBQUUsT0FBTztRQUNoQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLFFBQVEsRUFBRSxRQUFRO0tBQ25CO0lBQ0Q7UUFDRSxPQUFPLEVBQUUsS0FBSztRQUNkLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLEtBQUs7UUFDZixRQUFRLEVBQUUsUUFB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RDs7Ozs7SUE3UmhELDBDQUFnQzs7Ozs7SUFDaEMsOENBQXdDOzs7OztJQUN4QywyQ0FBNkI7Ozs7O0lBQzdCLDRDQUE4Qjs7Ozs7SUFDOUIsNkNBQStCOzs7OztJQUMvQixrREFBb0M7Ozs7O0lBQ3BDLG9DQUFzQjs7Ozs7SUFDdEIsb0RBQW1EOzs7OztJQUNuRCx1Q0FBeUI7Ozs7O0lBQ3pCLHVDQUF5Qjs7Ozs7SUFDekIsd0NBQXFEOzs7OztJQUNyRCxxREFBcUQ7Ozs7O0lBR3JELHFDQUE2RDs7Ozs7SUFHN0Qsd0NBQXNFOzs7OztJQXlCdEUsb0NBQTBEOzs7OztJQUcxRCxxQ0FBNEQ7Ozs7O0lBRzVELHVDQUFnRTs7Ozs7SUFHaEUsd0NBQWtFOzs7OztJQUdsRSw0Q0FBaUU7Ozs7O0lBR2pFLHlDQUFzRTs7Ozs7SUFHdEUsNkNBQXVFOzs7OztJQUd2RSw2Q0FBMkU7Ozs7O0lBRzNFLG1DQUF3RDs7Ozs7SUE4QnhELDRDQUF5RDs7Ozs7SUFHekQsNkNBQThFOzs7OztJQUc5RSxxQ0FBNEM7Ozs7O0lBRzVDLHFDQUE0Qzs7Ozs7SUFHNUMsNkNBQTZEOzs7OztJQUt6RCx1Q0FBeUI7Ozs7O0lBSXpCLG1DQUF3Qzs7Ozs7OztBQTZLOUMsTUFBTSxVQUFVLHNEQUFzRCxDQUFDLE9BQWdCO0lBRXJGOzs7SUFBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUM7QUFDckQsQ0FBQzs7Ozs7QUFHRCxNQUFNLE9BQU8sOENBQThDLEdBQUc7SUFDNUQsT0FBTyxFQUFFLHFDQUFxQztJQUM5QyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUM7SUFDZixVQUFVLEVBQUUsc0RBQXNEO0NBQ25FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0VTQ0FQRSwgaGFzTW9kaWZpZXJLZXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1RlbXBsYXRlUG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7T3ZlcmxheX0gZnJvbSAnLi9vdmVybGF5JztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge092ZXJsYXlSZWZ9IGZyb20gJy4vb3ZlcmxheS1yZWYnO1xuaW1wb3J0IHtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2V9IGZyb20gJy4vcG9zaXRpb24vY29ubmVjdGVkLXBvc2l0aW9uJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZFBvc2l0aW9uLFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG59IGZyb20gJy4vcG9zaXRpb24vZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7XG4gIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSxcbiAgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5Q29uZmlnLFxuICBTY3JvbGxTdHJhdGVneSxcbn0gZnJvbSAnLi9zY3JvbGwvaW5kZXgnO1xuXG5cbi8qKiBEZWZhdWx0IHNldCBvZiBwb3NpdGlvbnMgZm9yIHRoZSBvdmVybGF5LiBGb2xsb3dzIHRoZSBiZWhhdmlvciBvZiBhIGRyb3Bkb3duLiAqL1xuY29uc3QgZGVmYXVsdFBvc2l0aW9uTGlzdDogQ29ubmVjdGVkUG9zaXRpb25bXSA9IFtcbiAge1xuICAgIG9yaWdpblg6ICdzdGFydCcsXG4gICAgb3JpZ2luWTogJ2JvdHRvbScsXG4gICAgb3ZlcmxheVg6ICdzdGFydCcsXG4gICAgb3ZlcmxheVk6ICd0b3AnXG4gIH0sXG4gIHtcbiAgICBvcmlnaW5YOiAnc3RhcnQnLFxuICAgIG9yaWdpblk6ICd0b3AnLFxuICAgIG92ZXJsYXlYOiAnc3RhcnQnLFxuICAgIG92ZXJsYXlZOiAnYm90dG9tJ1xuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ2VuZCcsXG4gICAgb3JpZ2luWTogJ3RvcCcsXG4gICAgb3ZlcmxheVg6ICdlbmQnLFxuICAgIG92ZXJsYXlZOiAnYm90dG9tJ1xuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ2VuZCcsXG4gICAgb3JpZ2luWTogJ2JvdHRvbScsXG4gICAgb3ZlcmxheVg6ICdlbmQnLFxuICAgIG92ZXJsYXlZOiAndG9wJ1xuICB9XG5dO1xuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgZGV0ZXJtaW5lcyB0aGUgc2Nyb2xsIGhhbmRsaW5nIHdoaWxlIHRoZSBjb25uZWN0ZWQgb3ZlcmxheSBpcyBvcGVuLiAqL1xuZXhwb3J0IGNvbnN0IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1kgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwoKSA9PiBTY3JvbGxTdHJhdGVneT4oJ2Nkay1jb25uZWN0ZWQtb3ZlcmxheS1zY3JvbGwtc3RyYXRlZ3knKTtcblxuLyoqIEBkb2NzLXByaXZhdGUgQGRlcHJlY2F0ZWQgQGJyZWFraW5nLWNoYW5nZSA4LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWShvdmVybGF5OiBPdmVybGF5KTpcbiAgKCkgPT4gU2Nyb2xsU3RyYXRlZ3kge1xuICByZXR1cm4gKGNvbmZpZz86IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZykgPT4gb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oY29uZmlnKTtcbn1cblxuLyoqXG4gKiBEaXJlY3RpdmUgYXBwbGllZCB0byBhbiBlbGVtZW50IHRvIG1ha2UgaXQgdXNhYmxlIGFzIGFuIG9yaWdpbiBmb3IgYW4gT3ZlcmxheSB1c2luZyBhXG4gKiBDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLW92ZXJsYXktb3JpZ2luXSwgW292ZXJsYXktb3JpZ2luXSwgW2Nka092ZXJsYXlPcmlnaW5dJyxcbiAgZXhwb3J0QXM6ICdjZGtPdmVybGF5T3JpZ2luJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT3ZlcmxheU9yaWdpbiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCBvbiB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGFwcGxpZWQuICovXG4gICAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikgeyB9XG59XG5cblxuLyoqXG4gKiBEaXJlY3RpdmUgdG8gZmFjaWxpdGF0ZSBkZWNsYXJhdGl2ZSBjcmVhdGlvbiBvZiBhblxuICogT3ZlcmxheSB1c2luZyBhIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1jb25uZWN0ZWQtb3ZlcmxheV0sIFtjb25uZWN0ZWQtb3ZlcmxheV0sIFtjZGtDb25uZWN0ZWRPdmVybGF5XScsXG4gIGV4cG9ydEFzOiAnY2RrQ29ubmVjdGVkT3ZlcmxheSdcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29ubmVjdGVkT3ZlcmxheSBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgcHJpdmF0ZSBfb3ZlcmxheVJlZjogT3ZlcmxheVJlZjtcbiAgcHJpdmF0ZSBfdGVtcGxhdGVQb3J0YWw6IFRlbXBsYXRlUG9ydGFsO1xuICBwcml2YXRlIF9oYXNCYWNrZHJvcCA9IGZhbHNlO1xuICBwcml2YXRlIF9sb2NrUG9zaXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZ3Jvd0FmdGVyT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIF9mbGV4aWJsZURpbWVuc2lvbnMgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcHVzaCA9IGZhbHNlO1xuICBwcml2YXRlIF9iYWNrZHJvcFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfb2Zmc2V0WDogbnVtYmVyO1xuICBwcml2YXRlIF9vZmZzZXRZOiBudW1iZXI7XG4gIHByaXZhdGUgX3Bvc2l0aW9uOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k7XG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5RmFjdG9yeTogKCkgPT4gU2Nyb2xsU3RyYXRlZ3k7XG5cbiAgLyoqIE9yaWdpbiBmb3IgdGhlIGNvbm5lY3RlZCBvdmVybGF5LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPcmlnaW4nKSBvcmlnaW46IENka092ZXJsYXlPcmlnaW47XG5cbiAgLyoqIFJlZ2lzdGVyZWQgY29ubmVjdGVkIHBvc2l0aW9uIHBhaXJzLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbnMnKSBwb3NpdGlvbnM6IENvbm5lY3RlZFBvc2l0aW9uW107XG5cbiAgLyoqIFRoZSBvZmZzZXQgaW4gcGl4ZWxzIGZvciB0aGUgb3ZlcmxheSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB4LWF4aXMgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T2Zmc2V0WCcpXG4gIGdldCBvZmZzZXRYKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9vZmZzZXRYOyB9XG4gIHNldCBvZmZzZXRYKG9mZnNldFg6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFggPSBvZmZzZXRYO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIG9mZnNldCBpbiBwaXhlbHMgZm9yIHRoZSBvdmVybGF5IGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHktYXhpcyAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPZmZzZXRZJylcbiAgZ2V0IG9mZnNldFkoKSB7IHJldHVybiB0aGlzLl9vZmZzZXRZOyB9XG4gIHNldCBvZmZzZXRZKG9mZnNldFk6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFkgPSBvZmZzZXRZO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlXaWR0aCcpIHdpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUhlaWdodCcpIGhlaWdodDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5XaWR0aCcpIG1pbldpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4gaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5IZWlnaHQnKSBtaW5IZWlnaHQ6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIGN1c3RvbSBjbGFzcyB0byBiZSBzZXQgb24gdGhlIGJhY2tkcm9wIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUJhY2tkcm9wQ2xhc3MnKSBiYWNrZHJvcENsYXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXN0b20gY2xhc3MgdG8gYWRkIHRvIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UGFuZWxDbGFzcycpIHBhbmVsQ2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKiBNYXJnaW4gYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIHZpZXdwb3J0IGVkZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlWaWV3cG9ydE1hcmdpbicpIHZpZXdwb3J0TWFyZ2luOiBudW1iZXIgPSAwO1xuXG4gIC8qKiBTdHJhdGVneSB0byBiZSB1c2VkIHdoZW4gaGFuZGxpbmcgc2Nyb2xsIGV2ZW50cyB3aGlsZSB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlTY3JvbGxTdHJhdGVneScpIHNjcm9sbFN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPcGVuJykgb3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgb3ZlcmxheSBzaG91bGQgYXR0YWNoIGEgYmFja2Ryb3AuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUhhc0JhY2tkcm9wJylcbiAgZ2V0IGhhc0JhY2tkcm9wKCkgeyByZXR1cm4gdGhpcy5faGFzQmFja2Ryb3A7IH1cbiAgc2V0IGhhc0JhY2tkcm9wKHZhbHVlOiBhbnkpIHsgdGhpcy5faGFzQmFja2Ryb3AgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoZSBvdmVybGF5IHNob3VsZCBiZSBsb2NrZWQgd2hlbiBzY3JvbGxpbmcuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUxvY2tQb3NpdGlvbicpXG4gIGdldCBsb2NrUG9zaXRpb24oKSB7IHJldHVybiB0aGlzLl9sb2NrUG9zaXRpb247IH1cbiAgc2V0IGxvY2tQb3NpdGlvbih2YWx1ZTogYW55KSB7IHRoaXMuX2xvY2tQb3NpdGlvbiA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSdzIHdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGNvbnN0cmFpbmVkIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlGbGV4aWJsZURpbWVuc2lvbnMnKVxuICBnZXQgZmxleGlibGVEaW1lbnNpb25zKCkgeyByZXR1cm4gdGhpcy5fZmxleGlibGVEaW1lbnNpb25zOyB9XG4gIHNldCBmbGV4aWJsZURpbWVuc2lvbnModmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9mbGV4aWJsZURpbWVuc2lvbnMgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgYWZ0ZXIgdGhlIGluaXRpYWwgb3BlbiB3aGVuIGZsZXhpYmxlIHBvc2l0aW9uaW5nIGlzIHR1cm5lZCBvbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5R3Jvd0FmdGVyT3BlbicpXG4gIGdldCBncm93QWZ0ZXJPcGVuKCkgeyByZXR1cm4gdGhpcy5fZ3Jvd0FmdGVyT3BlbjsgfVxuICBzZXQgZ3Jvd0FmdGVyT3Blbih2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9ncm93QWZ0ZXJPcGVuID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIGlmIG5vbmUgb2YgdGhlIHByb3ZpZGVkIHBvc2l0aW9ucyBmaXQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVB1c2gnKVxuICBnZXQgcHVzaCgpIHsgcmV0dXJuIHRoaXMuX3B1c2g7IH1cbiAgc2V0IHB1c2godmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fcHVzaCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBiYWNrZHJvcCBpcyBjbGlja2VkLiAqL1xuICBAT3V0cHV0KCkgYmFja2Ryb3BDbGljayA9IG5ldyBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBwb3NpdGlvbiBoYXMgY2hhbmdlZC4gKi9cbiAgQE91dHB1dCgpIHBvc2l0aW9uQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2U+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBhdHRhY2hlZC4gKi9cbiAgQE91dHB1dCgpIGF0dGFjaCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGRldGFjaGVkLiAqL1xuICBAT3V0cHV0KCkgZGV0YWNoID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZXJlIGFyZSBrZXlib2FyZCBldmVudHMgdGhhdCBhcmUgdGFyZ2V0ZWQgYXQgdGhlIG92ZXJsYXkuICovXG4gIEBPdXRwdXQoKSBvdmVybGF5S2V5ZG93biA9IG5ldyBFdmVudEVtaXR0ZXI8S2V5Ym9hcmRFdmVudD4oKTtcblxuICAvLyBUT0RPKGplbGJvdXJuKTogaW5wdXRzIGZvciBzaXplLCBzY3JvbGwgYmVoYXZpb3IsIGFuaW1hdGlvbiwgZXRjLlxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfb3ZlcmxheTogT3ZlcmxheSxcbiAgICAgIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+LFxuICAgICAgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIEBJbmplY3QoQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWSkgc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5OiBhbnksXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5KSB7XG4gICAgdGhpcy5fdGVtcGxhdGVQb3J0YWwgPSBuZXcgVGVtcGxhdGVQb3J0YWwodGVtcGxhdGVSZWYsIHZpZXdDb250YWluZXJSZWYpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5RmFjdG9yeSA9IHNjcm9sbFN0cmF0ZWd5RmFjdG9yeTtcbiAgICB0aGlzLnNjcm9sbFN0cmF0ZWd5ID0gdGhpcy5fc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5KCk7XG4gIH1cblxuICAvKiogVGhlIGFzc29jaWF0ZWQgb3ZlcmxheSByZWZlcmVuY2UuICovXG4gIGdldCBvdmVybGF5UmVmKCk6IE92ZXJsYXlSZWYge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5UmVmO1xuICB9XG5cbiAgLyoqIFRoZSBlbGVtZW50J3MgbGF5b3V0IGRpcmVjdGlvbi4gKi9cbiAgZ2V0IGRpcigpOiBEaXJlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9kaXIgPyB0aGlzLl9kaXIudmFsdWUgOiAnbHRyJztcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIGlmICh0aGlzLl9wb3NpdGlvbikge1xuICAgICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneSh0aGlzLl9wb3NpdGlvbik7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLnVwZGF0ZVNpemUoe1xuICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgbWluV2lkdGg6IHRoaXMubWluV2lkdGgsXG4gICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICAgIG1pbkhlaWdodDogdGhpcy5taW5IZWlnaHQsXG4gICAgICB9KTtcblxuICAgICAgaWYgKGNoYW5nZXNbJ29yaWdpbiddICYmIHRoaXMub3Blbikge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbi5hcHBseSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjaGFuZ2VzWydvcGVuJ10pIHtcbiAgICAgIHRoaXMub3BlbiA/IHRoaXMuX2F0dGFjaE92ZXJsYXkoKSA6IHRoaXMuX2RldGFjaE92ZXJsYXkoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhbiBvdmVybGF5ICovXG4gIHByaXZhdGUgX2NyZWF0ZU92ZXJsYXkoKSB7XG4gICAgaWYgKCF0aGlzLnBvc2l0aW9ucyB8fCAhdGhpcy5wb3NpdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLnBvc2l0aW9ucyA9IGRlZmF1bHRQb3NpdGlvbkxpc3Q7XG4gICAgfVxuXG4gICAgdGhpcy5fb3ZlcmxheVJlZiA9IHRoaXMuX292ZXJsYXkuY3JlYXRlKHRoaXMuX2J1aWxkQ29uZmlnKCkpO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZi5rZXlkb3duRXZlbnRzKCkuc3Vic2NyaWJlKChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgdGhpcy5vdmVybGF5S2V5ZG93bi5uZXh0KGV2ZW50KTtcblxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IEVTQ0FQRSAmJiAhaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuX2RldGFjaE92ZXJsYXkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBCdWlsZHMgdGhlIG92ZXJsYXkgY29uZmlnIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgKi9cbiAgcHJpdmF0ZSBfYnVpbGRDb25maWcoKTogT3ZlcmxheUNvbmZpZyB7XG4gICAgY29uc3QgcG9zaXRpb25TdHJhdGVneSA9IHRoaXMuX3Bvc2l0aW9uID0gdGhpcy5fY3JlYXRlUG9zaXRpb25TdHJhdGVneSgpO1xuICAgIGNvbnN0IG92ZXJsYXlDb25maWcgPSBuZXcgT3ZlcmxheUNvbmZpZyh7XG4gICAgICBkaXJlY3Rpb246IHRoaXMuX2RpcixcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3ksXG4gICAgICBzY3JvbGxTdHJhdGVneTogdGhpcy5zY3JvbGxTdHJhdGVneSxcbiAgICAgIGhhc0JhY2tkcm9wOiB0aGlzLmhhc0JhY2tkcm9wXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLndpZHRoID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWlnaHQgfHwgdGhpcy5oZWlnaHQgPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWluV2lkdGggfHwgdGhpcy5taW5XaWR0aCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy5taW5XaWR0aCA9IHRoaXMubWluV2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWluSGVpZ2h0IHx8IHRoaXMubWluSGVpZ2h0ID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLm1pbkhlaWdodCA9IHRoaXMubWluSGVpZ2h0O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmJhY2tkcm9wQ2xhc3MpIHtcbiAgICAgIG92ZXJsYXlDb25maWcuYmFja2Ryb3BDbGFzcyA9IHRoaXMuYmFja2Ryb3BDbGFzcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYW5lbENsYXNzKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLnBhbmVsQ2xhc3MgPSB0aGlzLnBhbmVsQ2xhc3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIG92ZXJsYXlDb25maWc7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYSBwb3NpdGlvbiBzdHJhdGVneSwgYmFzZWQgb24gdGhlIHZhbHVlcyBvZiB0aGUgZGlyZWN0aXZlIGlucHV0cy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUG9zaXRpb25TdHJhdGVneShwb3NpdGlvblN0cmF0ZWd5OiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICBjb25zdCBwb3NpdGlvbnM6IENvbm5lY3RlZFBvc2l0aW9uW10gPSB0aGlzLnBvc2l0aW9ucy5tYXAoY3VycmVudFBvc2l0aW9uID0+ICh7XG4gICAgICBvcmlnaW5YOiBjdXJyZW50UG9zaXRpb24ub3JpZ2luWCxcbiAgICAgIG9yaWdpblk6IGN1cnJlbnRQb3NpdGlvbi5vcmlnaW5ZLFxuICAgICAgb3ZlcmxheVg6IGN1cnJlbnRQb3NpdGlvbi5vdmVybGF5WCxcbiAgICAgIG92ZXJsYXlZOiBjdXJyZW50UG9zaXRpb24ub3ZlcmxheVksXG4gICAgICBvZmZzZXRYOiBjdXJyZW50UG9zaXRpb24ub2Zmc2V0WCB8fCB0aGlzLm9mZnNldFgsXG4gICAgICBvZmZzZXRZOiBjdXJyZW50UG9zaXRpb24ub2Zmc2V0WSB8fCB0aGlzLm9mZnNldFksXG4gICAgICBwYW5lbENsYXNzOiBjdXJyZW50UG9zaXRpb24ucGFuZWxDbGFzcyB8fCB1bmRlZmluZWQsXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9uU3RyYXRlZ3lcbiAgICAgIC5zZXRPcmlnaW4odGhpcy5vcmlnaW4uZWxlbWVudFJlZilcbiAgICAgIC53aXRoUG9zaXRpb25zKHBvc2l0aW9ucylcbiAgICAgIC53aXRoRmxleGlibGVEaW1lbnNpb25zKHRoaXMuZmxleGlibGVEaW1lbnNpb25zKVxuICAgICAgLndpdGhQdXNoKHRoaXMucHVzaClcbiAgICAgIC53aXRoR3Jvd0FmdGVyT3Blbih0aGlzLmdyb3dBZnRlck9wZW4pXG4gICAgICAud2l0aFZpZXdwb3J0TWFyZ2luKHRoaXMudmlld3BvcnRNYXJnaW4pXG4gICAgICAud2l0aExvY2tlZFBvc2l0aW9uKHRoaXMubG9ja1Bvc2l0aW9uKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBvZiB0aGUgb3ZlcmxheSB0byBiZSBzZXQgb24gdGhlIG92ZXJsYXkgY29uZmlnICovXG4gIHByaXZhdGUgX2NyZWF0ZVBvc2l0aW9uU3RyYXRlZ3koKTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuX292ZXJsYXkucG9zaXRpb24oKS5mbGV4aWJsZUNvbm5lY3RlZFRvKHRoaXMub3JpZ2luLmVsZW1lbnRSZWYpO1xuXG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneShzdHJhdGVneSk7XG4gICAgc3RyYXRlZ3kucG9zaXRpb25DaGFuZ2VzLnN1YnNjcmliZShwID0+IHRoaXMucG9zaXRpb25DaGFuZ2UuZW1pdChwKSk7XG5cbiAgICByZXR1cm4gc3RyYXRlZ3k7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgdGhlIG92ZXJsYXkgYW5kIHN1YnNjcmliZXMgdG8gYmFja2Ryb3AgY2xpY2tzIGlmIGJhY2tkcm9wIGV4aXN0cyAqL1xuICBwcml2YXRlIF9hdHRhY2hPdmVybGF5KCkge1xuICAgIGlmICghdGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fY3JlYXRlT3ZlcmxheSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIG92ZXJsYXkgc2l6ZSwgaW4gY2FzZSB0aGUgZGlyZWN0aXZlJ3MgaW5wdXRzIGhhdmUgY2hhbmdlZFxuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5oYXNCYWNrZHJvcCA9IHRoaXMuaGFzQmFja2Ryb3A7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuYXR0YWNoKHRoaXMuX3RlbXBsYXRlUG9ydGFsKTtcbiAgICAgIHRoaXMuYXR0YWNoLmVtaXQoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNCYWNrZHJvcCkge1xuICAgICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24gPSB0aGlzLl9vdmVybGF5UmVmLmJhY2tkcm9wQ2xpY2soKS5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICB0aGlzLmJhY2tkcm9wQ2xpY2suZW1pdChldmVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIG92ZXJsYXkgYW5kIHVuc3Vic2NyaWJlcyB0byBiYWNrZHJvcCBjbGlja3MgaWYgYmFja2Ryb3AgZXhpc3RzICovXG4gIHByaXZhdGUgX2RldGFjaE92ZXJsYXkoKSB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuZGV0YWNoKCk7XG4gICAgICB0aGlzLmRldGFjaC5lbWl0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNCYWNrZHJvcDogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2xvY2tQb3NpdGlvbjogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2ZsZXhpYmxlRGltZW5zaW9uczogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2dyb3dBZnRlck9wZW46IGJvb2xlYW4gfCBzdHJpbmc7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9wdXNoOiBib29sZWFuIHwgc3RyaW5nO1xufVxuXG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgZnVuY3Rpb24gQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZKG92ZXJsYXk6IE92ZXJsYXkpOlxuICAgICgpID0+IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSB7XG4gIHJldHVybiAoKSA9PiBvdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGNvbnN0IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIgPSB7XG4gIHByb3ZpZGU6IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1ksXG4gIGRlcHM6IFtPdmVybGF5XSxcbiAgdXNlRmFjdG9yeTogQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZLFxufTtcbiJdfQ==