/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/overlay-directives.ts
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
import { FlexibleConnectedPositionStrategy, } from './position/flexible-connected-position-strategy';
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
        const positionStrategy = this._position =
            this.positionStrategy || this._createPositionStrategy();
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
            .withLockedPosition(this.lockPosition)
            .withTransformOriginOn(this.transformOriginSelector);
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
    positionStrategy: [{ type: Input, args: ['cdkConnectedOverlayPositionStrategy',] }],
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
    transformOriginSelector: [{ type: Input, args: ['cdkConnectedOverlayTransformOriginOn',] }],
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
     * This input overrides the positions input if specified. It lets users pass
     * in arbitrary positioning strategies.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.positionStrategy;
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
     * CSS selector which to set the transform origin.
     * @type {?}
     */
    CdkConnectedOverlay.prototype.transformOriginSelector;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1kaXJlY3RpdmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L292ZXJsYXktZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBRU4sV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRy9DLE9BQU8sRUFFTCxpQ0FBaUMsR0FDbEMsTUFBTSxpREFBaUQsQ0FBQzs7Ozs7TUFTbkQsbUJBQW1CLEdBQXdCO0lBQy9DO1FBQ0UsT0FBTyxFQUFFLE9BQU87UUFDaEIsT0FBTyxFQUFFLFFBQVE7UUFDakIsUUFBUSxFQUFFLE9BQU87UUFDakIsUUFBUSxFQUFFLEtBQUs7S0FDaEI7SUFDRDtRQUNFLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLE9BQU87UUFDakIsUUFBUSxFQUFFLFFBQVE7S0FDbkI7SUFDRDtRQUNFLE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxF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T0FBTyxDQUFDO0lBQ2YsVUFBVSxFQUFFLHNEQUFzRDtDQUNuRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtFU0NBUEUsIGhhc01vZGlmaWVyS2V5fSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge092ZXJsYXl9IGZyb20gJy4vb3ZlcmxheSc7XG5pbXBvcnQge092ZXJsYXlDb25maWd9IGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuaW1wb3J0IHtPdmVybGF5UmVmfSBmcm9tICcuL292ZXJsYXktcmVmJztcbmltcG9ydCB7Q29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlfSBmcm9tICcuL3Bvc2l0aW9uL2Nvbm5lY3RlZC1wb3NpdGlvbic7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRQb3NpdGlvbixcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LFxufSBmcm9tICcuL3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge1xuICBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3ksXG4gIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZyxcbiAgU2Nyb2xsU3RyYXRlZ3ksXG59IGZyb20gJy4vc2Nyb2xsL2luZGV4JztcblxuXG4vKiogRGVmYXVsdCBzZXQgb2YgcG9zaXRpb25zIGZvciB0aGUgb3ZlcmxheS4gRm9sbG93cyB0aGUgYmVoYXZpb3Igb2YgYSBkcm9wZG93bi4gKi9cbmNvbnN0IGRlZmF1bHRQb3NpdGlvbkxpc3Q6IENvbm5lY3RlZFBvc2l0aW9uW10gPSBbXG4gIHtcbiAgICBvcmlnaW5YOiAnc3RhcnQnLFxuICAgIG9yaWdpblk6ICdib3R0b20nLFxuICAgIG92ZXJsYXlYOiAnc3RhcnQnLFxuICAgIG92ZXJsYXlZOiAndG9wJ1xuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ3N0YXJ0JyxcbiAgICBvcmlnaW5ZOiAndG9wJyxcbiAgICBvdmVybGF5WDogJ3N0YXJ0JyxcbiAgICBvdmVybGF5WTogJ2JvdHRvbSdcbiAgfSxcbiAge1xuICAgIG9yaWdpblg6ICdlbmQnLFxuICAgIG9yaWdpblk6ICd0b3AnLFxuICAgIG92ZXJsYXlYOiAnZW5kJyxcbiAgICBvdmVybGF5WTogJ2JvdHRvbSdcbiAgfSxcbiAge1xuICAgIG9yaWdpblg6ICdlbmQnLFxuICAgIG9yaWdpblk6ICdib3R0b20nLFxuICAgIG92ZXJsYXlYOiAnZW5kJyxcbiAgICBvdmVybGF5WTogJ3RvcCdcbiAgfVxuXTtcblxuLyoqIEluamVjdGlvbiB0b2tlbiB0aGF0IGRldGVybWluZXMgdGhlIHNjcm9sbCBoYW5kbGluZyB3aGlsZSB0aGUgY29ubmVjdGVkIG92ZXJsYXkgaXMgb3Blbi4gKi9cbmV4cG9ydCBjb25zdCBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48KCkgPT4gU2Nyb2xsU3RyYXRlZ3k+KCdjZGstY29ubmVjdGVkLW92ZXJsYXktc2Nyb2xsLXN0cmF0ZWd5Jyk7XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX0ZBQ1RPUlkob3ZlcmxheTogT3ZlcmxheSk6XG4gICgpID0+IFNjcm9sbFN0cmF0ZWd5IHtcbiAgcmV0dXJuIChjb25maWc/OiBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3lDb25maWcpID0+IG92ZXJsYXkuc2Nyb2xsU3RyYXRlZ2llcy5yZXBvc2l0aW9uKGNvbmZpZyk7XG59XG5cbi8qKlxuICogRGlyZWN0aXZlIGFwcGxpZWQgdG8gYW4gZWxlbWVudCB0byBtYWtlIGl0IHVzYWJsZSBhcyBhbiBvcmlnaW4gZm9yIGFuIE92ZXJsYXkgdXNpbmcgYVxuICogQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1vdmVybGF5LW9yaWdpbl0sIFtvdmVybGF5LW9yaWdpbl0sIFtjZGtPdmVybGF5T3JpZ2luXScsXG4gIGV4cG9ydEFzOiAnY2RrT3ZlcmxheU9yaWdpbicsXG59KVxuZXhwb3J0IGNsYXNzIENka092ZXJsYXlPcmlnaW4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgb24gd2hpY2ggdGhlIGRpcmVjdGl2ZSBpcyBhcHBsaWVkLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHsgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRvIGZhY2lsaXRhdGUgZGVjbGFyYXRpdmUgY3JlYXRpb24gb2YgYW5cbiAqIE92ZXJsYXkgdXNpbmcgYSBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstY29ubmVjdGVkLW92ZXJsYXldLCBbY29ubmVjdGVkLW92ZXJsYXldLCBbY2RrQ29ubmVjdGVkT3ZlcmxheV0nLFxuICBleHBvcnRBczogJ2Nka0Nvbm5lY3RlZE92ZXJsYXknXG59KVxuZXhwb3J0IGNsYXNzIENka0Nvbm5lY3RlZE92ZXJsYXkgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG4gIHByaXZhdGUgX292ZXJsYXlSZWY6IE92ZXJsYXlSZWY7XG4gIHByaXZhdGUgX3RlbXBsYXRlUG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDtcbiAgcHJpdmF0ZSBfaGFzQmFja2Ryb3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfbG9ja1Bvc2l0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgX2dyb3dBZnRlck9wZW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmxleGlibGVEaW1lbnNpb25zID0gZmFsc2U7XG4gIHByaXZhdGUgX3B1c2ggPSBmYWxzZTtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX29mZnNldFg6IG51bWJlcjtcbiAgcHJpdmF0ZSBfb2Zmc2V0WTogbnVtYmVyO1xuICBwcml2YXRlIF9wb3NpdGlvbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5O1xuICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneUZhY3Rvcnk6ICgpID0+IFNjcm9sbFN0cmF0ZWd5O1xuXG4gIC8qKiBPcmlnaW4gZm9yIHRoZSBjb25uZWN0ZWQgb3ZlcmxheS4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T3JpZ2luJykgb3JpZ2luOiBDZGtPdmVybGF5T3JpZ2luO1xuXG4gIC8qKiBSZWdpc3RlcmVkIGNvbm5lY3RlZCBwb3NpdGlvbiBwYWlycy4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25zJykgcG9zaXRpb25zOiBDb25uZWN0ZWRQb3NpdGlvbltdO1xuXG4gIC8qKlxuICAgKiBUaGlzIGlucHV0IG92ZXJyaWRlcyB0aGUgcG9zaXRpb25zIGlucHV0IGlmIHNwZWNpZmllZC4gSXQgbGV0cyB1c2VycyBwYXNzXG4gICAqIGluIGFyYml0cmFyeSBwb3NpdGlvbmluZyBzdHJhdGVnaWVzLlxuICAgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25TdHJhdGVneScpIHBvc2l0aW9uU3RyYXRlZ3k6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneTtcblxuICAvKiogVGhlIG9mZnNldCBpbiBwaXhlbHMgZm9yIHRoZSBvdmVybGF5IGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHgtYXhpcyAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPZmZzZXRYJylcbiAgZ2V0IG9mZnNldFgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX29mZnNldFg7IH1cbiAgc2V0IG9mZnNldFgob2Zmc2V0WDogbnVtYmVyKSB7XG4gICAgdGhpcy5fb2Zmc2V0WCA9IG9mZnNldFg7XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uU3RyYXRlZ3kodGhpcy5fcG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBUaGUgb2Zmc2V0IGluIHBpeGVscyBmb3IgdGhlIG92ZXJsYXkgY29ubmVjdGlvbiBwb2ludCBvbiB0aGUgeS1heGlzICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU9mZnNldFknKVxuICBnZXQgb2Zmc2V0WSgpIHsgcmV0dXJuIHRoaXMuX29mZnNldFk7IH1cbiAgc2V0IG9mZnNldFkob2Zmc2V0WTogbnVtYmVyKSB7XG4gICAgdGhpcy5fb2Zmc2V0WSA9IG9mZnNldFk7XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uU3RyYXRlZ3kodGhpcy5fcG9zaXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBUaGUgd2lkdGggb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVdpZHRoJykgd2lkdGg6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIGhlaWdodCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5SGVpZ2h0JykgaGVpZ2h0OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4gd2lkdGggb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU1pbldpZHRoJykgbWluV2lkdGg6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIG1pbiBoZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU1pbkhlaWdodCcpIG1pbkhlaWdodDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgY3VzdG9tIGNsYXNzIHRvIGJlIHNldCBvbiB0aGUgYmFja2Ryb3AgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5QmFja2Ryb3BDbGFzcycpIGJhY2tkcm9wQ2xhc3M6IHN0cmluZztcblxuICAvKiogVGhlIGN1c3RvbSBjbGFzcyB0byBhZGQgdG8gdGhlIG92ZXJsYXkgcGFuZSBlbGVtZW50LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQYW5lbENsYXNzJykgcGFuZWxDbGFzczogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqIE1hcmdpbiBiZXR3ZWVuIHRoZSBvdmVybGF5IGFuZCB0aGUgdmlld3BvcnQgZWRnZXMuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVZpZXdwb3J0TWFyZ2luJykgdmlld3BvcnRNYXJnaW46IG51bWJlciA9IDA7XG5cbiAgLyoqIFN0cmF0ZWd5IHRvIGJlIHVzZWQgd2hlbiBoYW5kbGluZyBzY3JvbGwgZXZlbnRzIHdoaWxlIHRoZSBvdmVybGF5IGlzIG9wZW4uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVNjcm9sbFN0cmF0ZWd5Jykgc2Nyb2xsU3RyYXRlZ3k6IFNjcm9sbFN0cmF0ZWd5O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGlzIG9wZW4uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU9wZW4nKSBvcGVuOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIENTUyBzZWxlY3RvciB3aGljaCB0byBzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVRyYW5zZm9ybU9yaWdpbk9uJykgdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3I6IHN0cmluZztcblxuICAvKiogV2hldGhlciBvciBub3QgdGhlIG92ZXJsYXkgc2hvdWxkIGF0dGFjaCBhIGJhY2tkcm9wLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlIYXNCYWNrZHJvcCcpXG4gIGdldCBoYXNCYWNrZHJvcCgpIHsgcmV0dXJuIHRoaXMuX2hhc0JhY2tkcm9wOyB9XG4gIHNldCBoYXNCYWNrZHJvcCh2YWx1ZTogYW55KSB7IHRoaXMuX2hhc0JhY2tkcm9wID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgb3ZlcmxheSBzaG91bGQgYmUgbG9ja2VkIHdoZW4gc2Nyb2xsaW5nLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlMb2NrUG9zaXRpb24nKVxuICBnZXQgbG9ja1Bvc2l0aW9uKCkgeyByZXR1cm4gdGhpcy5fbG9ja1Bvc2l0aW9uOyB9XG4gIHNldCBsb2NrUG9zaXRpb24odmFsdWU6IGFueSkgeyB0aGlzLl9sb2NrUG9zaXRpb24gPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5RmxleGlibGVEaW1lbnNpb25zJylcbiAgZ2V0IGZsZXhpYmxlRGltZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX2ZsZXhpYmxlRGltZW5zaW9uczsgfVxuICBzZXQgZmxleGlibGVEaW1lbnNpb25zKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZmxleGlibGVEaW1lbnNpb25zID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IGFmdGVyIHRoZSBpbml0aWFsIG9wZW4gd2hlbiBmbGV4aWJsZSBwb3NpdGlvbmluZyBpcyB0dXJuZWQgb24uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUdyb3dBZnRlck9wZW4nKVxuICBnZXQgZ3Jvd0FmdGVyT3BlbigpIHsgcmV0dXJuIHRoaXMuX2dyb3dBZnRlck9wZW47IH1cbiAgc2V0IGdyb3dBZnRlck9wZW4odmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fZ3Jvd0FmdGVyT3BlbiA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBjYW4gYmUgcHVzaGVkIG9uLXNjcmVlbiBpZiBub25lIG9mIHRoZSBwcm92aWRlZCBwb3NpdGlvbnMgZml0LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQdXNoJylcbiAgZ2V0IHB1c2goKSB7IHJldHVybiB0aGlzLl9wdXNoOyB9XG4gIHNldCBwdXNoKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX3B1c2ggPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgYmFja2Ryb3AgaXMgY2xpY2tlZC4gKi9cbiAgQE91dHB1dCgpIGJhY2tkcm9wQ2xpY2sgPSBuZXcgRXZlbnRFbWl0dGVyPE1vdXNlRXZlbnQ+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgcG9zaXRpb24gaGFzIGNoYW5nZWQuICovXG4gIEBPdXRwdXQoKSBwb3NpdGlvbkNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Q29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlPigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gYXR0YWNoZWQuICovXG4gIEBPdXRwdXQoKSBhdHRhY2ggPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBkZXRhY2hlZC4gKi9cbiAgQE91dHB1dCgpIGRldGFjaCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGVyZSBhcmUga2V5Ym9hcmQgZXZlbnRzIHRoYXQgYXJlIHRhcmdldGVkIGF0IHRoZSBvdmVybGF5LiAqL1xuICBAT3V0cHV0KCkgb3ZlcmxheUtleWRvd24gPSBuZXcgRXZlbnRFbWl0dGVyPEtleWJvYXJkRXZlbnQ+KCk7XG5cbiAgLy8gVE9ETyhqZWxib3Vybik6IGlucHV0cyBmb3Igc2l6ZSwgc2Nyb2xsIGJlaGF2aW9yLCBhbmltYXRpb24sIGV0Yy5cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX292ZXJsYXk6IE92ZXJsYXksXG4gICAgICB0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8YW55PixcbiAgICAgIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgICBASW5qZWN0KENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1kpIHNjcm9sbFN0cmF0ZWd5RmFjdG9yeTogYW55LFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSkge1xuICAgIHRoaXMuX3RlbXBsYXRlUG9ydGFsID0gbmV3IFRlbXBsYXRlUG9ydGFsKHRlbXBsYXRlUmVmLCB2aWV3Q29udGFpbmVyUmVmKTtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneUZhY3RvcnkgPSBzY3JvbGxTdHJhdGVneUZhY3Rvcnk7XG4gICAgdGhpcy5zY3JvbGxTdHJhdGVneSA9IHRoaXMuX3Njcm9sbFN0cmF0ZWd5RmFjdG9yeSgpO1xuICB9XG5cbiAgLyoqIFRoZSBhc3NvY2lhdGVkIG92ZXJsYXkgcmVmZXJlbmNlLiAqL1xuICBnZXQgb3ZlcmxheVJlZigpOiBPdmVybGF5UmVmIHtcbiAgICByZXR1cm4gdGhpcy5fb3ZlcmxheVJlZjtcbiAgfVxuXG4gIC8qKiBUaGUgZWxlbWVudCdzIGxheW91dCBkaXJlY3Rpb24uICovXG4gIGdldCBkaXIoKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyID8gdGhpcy5fZGlyLnZhbHVlIDogJ2x0cic7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAodGhpcy5fcG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uU3RyYXRlZ3kodGhpcy5fcG9zaXRpb24pO1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi51cGRhdGVTaXplKHtcbiAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgIG1pbldpZHRoOiB0aGlzLm1pbldpZHRoLFxuICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICBtaW5IZWlnaHQ6IHRoaXMubWluSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChjaGFuZ2VzWydvcmlnaW4nXSAmJiB0aGlzLm9wZW4pIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb24uYXBwbHkoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlc1snb3BlbiddKSB7XG4gICAgICB0aGlzLm9wZW4gPyB0aGlzLl9hdHRhY2hPdmVybGF5KCkgOiB0aGlzLl9kZXRhY2hPdmVybGF5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gb3ZlcmxheSAqL1xuICBwcml2YXRlIF9jcmVhdGVPdmVybGF5KCkge1xuICAgIGlmICghdGhpcy5wb3NpdGlvbnMgfHwgIXRoaXMucG9zaXRpb25zLmxlbmd0aCkge1xuICAgICAgdGhpcy5wb3NpdGlvbnMgPSBkZWZhdWx0UG9zaXRpb25MaXN0O1xuICAgIH1cblxuICAgIHRoaXMuX292ZXJsYXlSZWYgPSB0aGlzLl9vdmVybGF5LmNyZWF0ZSh0aGlzLl9idWlsZENvbmZpZygpKTtcblxuICAgIHRoaXMuX292ZXJsYXlSZWYua2V5ZG93bkV2ZW50cygpLnN1YnNjcmliZSgoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIHRoaXMub3ZlcmxheUtleWRvd24ubmV4dChldmVudCk7XG5cbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBFU0NBUEUgJiYgIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLl9kZXRhY2hPdmVybGF5KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKiogQnVpbGRzIHRoZSBvdmVybGF5IGNvbmZpZyBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgaW5wdXRzICovXG4gIHByaXZhdGUgX2J1aWxkQ29uZmlnKCk6IE92ZXJsYXlDb25maWcge1xuICAgIGNvbnN0IHBvc2l0aW9uU3RyYXRlZ3kgPSB0aGlzLl9wb3NpdGlvbiA9XG4gICAgICB0aGlzLnBvc2l0aW9uU3RyYXRlZ3kgfHwgdGhpcy5fY3JlYXRlUG9zaXRpb25TdHJhdGVneSgpO1xuICAgIGNvbnN0IG92ZXJsYXlDb25maWcgPSBuZXcgT3ZlcmxheUNvbmZpZyh7XG4gICAgICBkaXJlY3Rpb246IHRoaXMuX2RpcixcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3ksXG4gICAgICBzY3JvbGxTdHJhdGVneTogdGhpcy5zY3JvbGxTdHJhdGVneSxcbiAgICAgIGhhc0JhY2tkcm9wOiB0aGlzLmhhc0JhY2tkcm9wXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLndpZHRoID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWlnaHQgfHwgdGhpcy5oZWlnaHQgPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWluV2lkdGggfHwgdGhpcy5taW5XaWR0aCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy5taW5XaWR0aCA9IHRoaXMubWluV2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWluSGVpZ2h0IHx8IHRoaXMubWluSGVpZ2h0ID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLm1pbkhlaWdodCA9IHRoaXMubWluSGVpZ2h0O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmJhY2tkcm9wQ2xhc3MpIHtcbiAgICAgIG92ZXJsYXlDb25maWcuYmFja2Ryb3BDbGFzcyA9IHRoaXMuYmFja2Ryb3BDbGFzcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYW5lbENsYXNzKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLnBhbmVsQ2xhc3MgPSB0aGlzLnBhbmVsQ2xhc3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIG92ZXJsYXlDb25maWc7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgc3RhdGUgb2YgYSBwb3NpdGlvbiBzdHJhdGVneSwgYmFzZWQgb24gdGhlIHZhbHVlcyBvZiB0aGUgZGlyZWN0aXZlIGlucHV0cy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlUG9zaXRpb25TdHJhdGVneShwb3NpdGlvblN0cmF0ZWd5OiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICBjb25zdCBwb3NpdGlvbnM6IENvbm5lY3RlZFBvc2l0aW9uW10gPSB0aGlzLnBvc2l0aW9ucy5tYXAoY3VycmVudFBvc2l0aW9uID0+ICh7XG4gICAgICBvcmlnaW5YOiBjdXJyZW50UG9zaXRpb24ub3JpZ2luWCxcbiAgICAgIG9yaWdpblk6IGN1cnJlbnRQb3NpdGlvbi5vcmlnaW5ZLFxuICAgICAgb3ZlcmxheVg6IGN1cnJlbnRQb3NpdGlvbi5vdmVybGF5WCxcbiAgICAgIG92ZXJsYXlZOiBjdXJyZW50UG9zaXRpb24ub3ZlcmxheVksXG4gICAgICBvZmZzZXRYOiBjdXJyZW50UG9zaXRpb24ub2Zmc2V0WCB8fCB0aGlzLm9mZnNldFgsXG4gICAgICBvZmZzZXRZOiBjdXJyZW50UG9zaXRpb24ub2Zmc2V0WSB8fCB0aGlzLm9mZnNldFksXG4gICAgICBwYW5lbENsYXNzOiBjdXJyZW50UG9zaXRpb24ucGFuZWxDbGFzcyB8fCB1bmRlZmluZWQsXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9uU3RyYXRlZ3lcbiAgICAgIC5zZXRPcmlnaW4odGhpcy5vcmlnaW4uZWxlbWVudFJlZilcbiAgICAgIC53aXRoUG9zaXRpb25zKHBvc2l0aW9ucylcbiAgICAgIC53aXRoRmxleGlibGVEaW1lbnNpb25zKHRoaXMuZmxleGlibGVEaW1lbnNpb25zKVxuICAgICAgLndpdGhQdXNoKHRoaXMucHVzaClcbiAgICAgIC53aXRoR3Jvd0FmdGVyT3Blbih0aGlzLmdyb3dBZnRlck9wZW4pXG4gICAgICAud2l0aFZpZXdwb3J0TWFyZ2luKHRoaXMudmlld3BvcnRNYXJnaW4pXG4gICAgICAud2l0aExvY2tlZFBvc2l0aW9uKHRoaXMubG9ja1Bvc2l0aW9uKVxuICAgICAgLndpdGhUcmFuc2Zvcm1PcmlnaW5Pbih0aGlzLnRyYW5zZm9ybU9yaWdpblNlbGVjdG9yKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBvZiB0aGUgb3ZlcmxheSB0byBiZSBzZXQgb24gdGhlIG92ZXJsYXkgY29uZmlnICovXG4gIHByaXZhdGUgX2NyZWF0ZVBvc2l0aW9uU3RyYXRlZ3koKTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuX292ZXJsYXkucG9zaXRpb24oKS5mbGV4aWJsZUNvbm5lY3RlZFRvKHRoaXMub3JpZ2luLmVsZW1lbnRSZWYpO1xuXG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneShzdHJhdGVneSk7XG4gICAgc3RyYXRlZ3kucG9zaXRpb25DaGFuZ2VzLnN1YnNjcmliZShwID0+IHRoaXMucG9zaXRpb25DaGFuZ2UuZW1pdChwKSk7XG5cbiAgICByZXR1cm4gc3RyYXRlZ3k7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgdGhlIG92ZXJsYXkgYW5kIHN1YnNjcmliZXMgdG8gYmFja2Ryb3AgY2xpY2tzIGlmIGJhY2tkcm9wIGV4aXN0cyAqL1xuICBwcml2YXRlIF9hdHRhY2hPdmVybGF5KCkge1xuICAgIGlmICghdGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fY3JlYXRlT3ZlcmxheSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIG92ZXJsYXkgc2l6ZSwgaW4gY2FzZSB0aGUgZGlyZWN0aXZlJ3MgaW5wdXRzIGhhdmUgY2hhbmdlZFxuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5oYXNCYWNrZHJvcCA9IHRoaXMuaGFzQmFja2Ryb3A7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuYXR0YWNoKHRoaXMuX3RlbXBsYXRlUG9ydGFsKTtcbiAgICAgIHRoaXMuYXR0YWNoLmVtaXQoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNCYWNrZHJvcCkge1xuICAgICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24gPSB0aGlzLl9vdmVybGF5UmVmLmJhY2tkcm9wQ2xpY2soKS5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICB0aGlzLmJhY2tkcm9wQ2xpY2suZW1pdChldmVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIG92ZXJsYXkgYW5kIHVuc3Vic2NyaWJlcyB0byBiYWNrZHJvcCBjbGlja3MgaWYgYmFja2Ryb3AgZXhpc3RzICovXG4gIHByaXZhdGUgX2RldGFjaE92ZXJsYXkoKSB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuZGV0YWNoKCk7XG4gICAgICB0aGlzLmRldGFjaC5lbWl0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNCYWNrZHJvcDogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9sb2NrUG9zaXRpb246IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZmxleGlibGVEaW1lbnNpb25zOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2dyb3dBZnRlck9wZW46IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcHVzaDogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG59XG5cblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX1BST1ZJREVSX0ZBQ1RPUlkob3ZlcmxheTogT3ZlcmxheSk6XG4gICAgKCkgPT4gUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5IHtcbiAgcmV0dXJuICgpID0+IG92ZXJsYXkuc2Nyb2xsU3RyYXRlZ2llcy5yZXBvc2l0aW9uKCk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgY29uc3QgQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUiA9IHtcbiAgcHJvdmlkZTogQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWSxcbiAgZGVwczogW092ZXJsYXldLFxuICB1c2VGYWN0b3J5OiBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX1BST1ZJREVSX0ZBQ1RPUlksXG59O1xuIl19