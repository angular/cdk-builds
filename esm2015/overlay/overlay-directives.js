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
/** Default set of positions for the overlay. Follows the behavior of a dropdown. */
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
/** Injection token that determines the scroll handling while the connected overlay is open. */
export const CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY = new InjectionToken('cdk-connected-overlay-scroll-strategy');
/** @docs-private @deprecated @breaking-change 8.0.0 */
export function CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_FACTORY(overlay) {
    return (config) => overlay.scrollStrategies.reposition(config);
}
/**
 * Directive applied to an element to make it usable as an origin for an Overlay using a
 * ConnectedPositionStrategy.
 */
export class CdkOverlayOrigin {
    constructor(
    /** Reference to the element on which the directive is applied. */
    elementRef) {
        this.elementRef = elementRef;
    }
}
CdkOverlayOrigin.decorators = [
    { type: Directive, args: [{
                selector: '[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]',
                exportAs: 'cdkOverlayOrigin',
            },] }
];
CdkOverlayOrigin.ctorParameters = () => [
    { type: ElementRef }
];
/**
 * Directive to facilitate declarative creation of an
 * Overlay using a FlexibleConnectedPositionStrategy.
 */
export class CdkConnectedOverlay {
    // TODO(jelbourn): inputs for size, scroll behavior, animation, etc.
    constructor(_overlay, templateRef, viewContainerRef, scrollStrategyFactory, _dir) {
        this._overlay = _overlay;
        this._dir = _dir;
        this._hasBackdrop = false;
        this._lockPosition = false;
        this._growAfterOpen = false;
        this._flexibleDimensions = false;
        this._push = false;
        this._backdropSubscription = Subscription.EMPTY;
        /** Margin between the overlay and the viewport edges. */
        this.viewportMargin = 0;
        /** Whether the overlay is open. */
        this.open = false;
        /** Event emitted when the backdrop is clicked. */
        this.backdropClick = new EventEmitter();
        /** Event emitted when the position has changed. */
        this.positionChange = new EventEmitter();
        /** Event emitted when the overlay has been attached. */
        this.attach = new EventEmitter();
        /** Event emitted when the overlay has been detached. */
        this.detach = new EventEmitter();
        /** Emits when there are keyboard events that are targeted at the overlay. */
        this.overlayKeydown = new EventEmitter();
        /** Emits when there are mouse outside click events that are targeted at the overlay. */
        this.overlayOutsideClick = new EventEmitter();
        this._templatePortal = new TemplatePortal(templateRef, viewContainerRef);
        this._scrollStrategyFactory = scrollStrategyFactory;
        this.scrollStrategy = this._scrollStrategyFactory();
    }
    /** The offset in pixels for the overlay connection point on the x-axis */
    get offsetX() { return this._offsetX; }
    set offsetX(offsetX) {
        this._offsetX = offsetX;
        if (this._position) {
            this._updatePositionStrategy(this._position);
        }
    }
    /** The offset in pixels for the overlay connection point on the y-axis */
    get offsetY() { return this._offsetY; }
    set offsetY(offsetY) {
        this._offsetY = offsetY;
        if (this._position) {
            this._updatePositionStrategy(this._position);
        }
    }
    /** Whether or not the overlay should attach a backdrop. */
    get hasBackdrop() { return this._hasBackdrop; }
    set hasBackdrop(value) { this._hasBackdrop = coerceBooleanProperty(value); }
    /** Whether or not the overlay should be locked when scrolling. */
    get lockPosition() { return this._lockPosition; }
    set lockPosition(value) { this._lockPosition = coerceBooleanProperty(value); }
    /** Whether the overlay's width and height can be constrained to fit within the viewport. */
    get flexibleDimensions() { return this._flexibleDimensions; }
    set flexibleDimensions(value) {
        this._flexibleDimensions = coerceBooleanProperty(value);
    }
    /** Whether the overlay can grow after the initial open when flexible positioning is turned on. */
    get growAfterOpen() { return this._growAfterOpen; }
    set growAfterOpen(value) { this._growAfterOpen = coerceBooleanProperty(value); }
    /** Whether the overlay can be pushed on-screen if none of the provided positions fit. */
    get push() { return this._push; }
    set push(value) { this._push = coerceBooleanProperty(value); }
    /** The associated overlay reference. */
    get overlayRef() {
        return this._overlayRef;
    }
    /** The element's layout direction. */
    get dir() {
        return this._dir ? this._dir.value : 'ltr';
    }
    ngOnDestroy() {
        if (this._overlayRef) {
            this._overlayRef.dispose();
        }
        this._backdropSubscription.unsubscribe();
    }
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
    /** Creates an overlay */
    _createOverlay() {
        if (!this.positions || !this.positions.length) {
            this.positions = defaultPositionList;
        }
        this._overlayRef = this._overlay.create(this._buildConfig());
        this._overlayRef.keydownEvents().subscribe((event) => {
            this.overlayKeydown.next(event);
            if (event.keyCode === ESCAPE && !hasModifierKey(event)) {
                event.preventDefault();
                this._detachOverlay();
            }
        });
        this._overlayRef.outsidePointerEvents().subscribe((event) => {
            this.overlayOutsideClick.next(event);
        });
    }
    /** Builds the overlay config based on the directive's inputs */
    _buildConfig() {
        const positionStrategy = this._position =
            this.positionStrategy || this._createPositionStrategy();
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
    /** Updates the state of a position strategy, based on the values of the directive inputs. */
    _updatePositionStrategy(positionStrategy) {
        const positions = this.positions.map(currentPosition => ({
            originX: currentPosition.originX,
            originY: currentPosition.originY,
            overlayX: currentPosition.overlayX,
            overlayY: currentPosition.overlayY,
            offsetX: currentPosition.offsetX || this.offsetX,
            offsetY: currentPosition.offsetY || this.offsetY,
            panelClass: currentPosition.panelClass || undefined,
        }));
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
    /** Returns the position strategy of the overlay to be set on the overlay config */
    _createPositionStrategy() {
        const strategy = this._overlay.position().flexibleConnectedTo(this.origin.elementRef);
        this._updatePositionStrategy(strategy);
        strategy.positionChanges.subscribe(p => this.positionChange.emit(p));
        return strategy;
    }
    /** Attaches the overlay and subscribes to backdrop clicks if backdrop exists */
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
            this._backdropSubscription = this._overlayRef.backdropClick().subscribe(event => {
                this.backdropClick.emit(event);
            });
        }
        else {
            this._backdropSubscription.unsubscribe();
        }
    }
    /** Detaches the overlay and unsubscribes to backdrop clicks if backdrop exists */
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
    overlayKeydown: [{ type: Output }],
    overlayOutsideClick: [{ type: Output }]
};
/** @docs-private */
export function CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay) {
    return () => overlay.scrollStrategies.reposition();
}
/** @docs-private */
export const CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER = {
    provide: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY,
    deps: [Overlay],
    useFactory: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1kaXJlY3RpdmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L292ZXJsYXktZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBRU4sV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRy9DLE9BQU8sRUFFTCxpQ0FBaUMsR0FDbEMsTUFBTSxpREFBaUQsQ0FBQztBQVF6RCxvRkFBb0Y7QUFDcEYsTUFBTSxtQkFBbUIsR0FBd0I7SUFDL0M7UUFDRSxPQUFPLEVBQUUsT0FBTztRQUNoQixPQUFPLEVBQUUsUUFBUTtRQUNqQixRQUFRLEVBQUUsT0FBTztRQUNqQixRQUFRLEVBQUUsS0FBSztLQUNoQjtJQUNEO1FBQ0UsT0FBTyxFQUFFLE9BQU87UUFDaEIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsT0FBTztRQUNqQixRQUFRLEVBQUUsUUFBUTtLQUNuQjtJQUNEO1FBQ0UsT0FBTyxFQUFF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S0FBSyxTQUFDLDJCQUEyQjt3QkFHakMsS0FBSyxTQUFDLDhCQUE4QjsrQkFNcEMsS0FBSyxTQUFDLHFDQUFxQztzQkFHM0MsS0FBSyxTQUFDLDRCQUE0QjtzQkFXbEMsS0FBSyxTQUFDLDRCQUE0QjtvQkFXbEMsS0FBSyxTQUFDLDBCQUEwQjtxQkFHaEMsS0FBSyxTQUFDLDJCQUEyQjt1QkFHakMsS0FBSyxTQUFDLDZCQUE2Qjt3QkFHbkMsS0FBSyxTQUFDLDhCQUE4Qjs0QkFHcEMsS0FBSyxTQUFDLGtDQUFrQzt5QkFHeEMsS0FBSyxTQUFDLCtCQUErQjs2QkFHckMsS0FBSyxTQUFDLG1DQUFtQzs2QkFHekMsS0FBSyxTQUFDLG1DQUFtQzttQkFHekMsS0FBSyxTQUFDLHlCQUF5QjtzQ0FHL0IsS0FBSyxTQUFDLHNDQUFzQzswQkFHNUMsS0FBSyxTQUFDLGdDQUFnQzsyQkFLdEMsS0FBSyxTQUFDLGlDQUFpQztpQ0FLdkMsS0FBSyxTQUFDLHVDQUF1Qzs0QkFPN0MsS0FBSyxTQUFDLGtDQUFrQzttQkFLeEMsS0FBSyxTQUFDLHlCQUF5Qjs0QkFLL0IsTUFBTTs2QkFHTixNQUFNO3FCQUdOLE1BQU07cUJBR04sTUFBTTs2QkFHTixNQUFNO2tDQUdOLE1BQU07O0FBMkxULG9CQUFvQjtBQUNwQixNQUFNLFVBQVUsc0RBQXNELENBQUMsT0FBZ0I7SUFFckYsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDckQsQ0FBQztBQUVELG9CQUFvQjtBQUNwQixNQUFNLENBQUMsTUFBTSw4Q0FBOEMsR0FBRztJQUM1RCxPQUFPLEVBQUUscUNBQXFDO0lBQzlDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQztJQUNmLFVBQVUsRUFBRSxzREFBc0Q7Q0FDbkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0VTQ0FQRSwgaGFzTW9kaWZpZXJLZXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1RlbXBsYXRlUG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q29udGFpbmVyUmVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7T3ZlcmxheX0gZnJvbSAnLi9vdmVybGF5JztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge092ZXJsYXlSZWZ9IGZyb20gJy4vb3ZlcmxheS1yZWYnO1xuaW1wb3J0IHtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2V9IGZyb20gJy4vcG9zaXRpb24vY29ubmVjdGVkLXBvc2l0aW9uJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZFBvc2l0aW9uLFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG59IGZyb20gJy4vcG9zaXRpb24vZmxleGlibGUtY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7XG4gIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSxcbiAgUmVwb3NpdGlvblNjcm9sbFN0cmF0ZWd5Q29uZmlnLFxuICBTY3JvbGxTdHJhdGVneSxcbn0gZnJvbSAnLi9zY3JvbGwvaW5kZXgnO1xuXG5cbi8qKiBEZWZhdWx0IHNldCBvZiBwb3NpdGlvbnMgZm9yIHRoZSBvdmVybGF5LiBGb2xsb3dzIHRoZSBiZWhhdmlvciBvZiBhIGRyb3Bkb3duLiAqL1xuY29uc3QgZGVmYXVsdFBvc2l0aW9uTGlzdDogQ29ubmVjdGVkUG9zaXRpb25bXSA9IFtcbiAge1xuICAgIG9yaWdpblg6ICdzdGFydCcsXG4gICAgb3JpZ2luWTogJ2JvdHRvbScsXG4gICAgb3ZlcmxheVg6ICdzdGFydCcsXG4gICAgb3ZlcmxheVk6ICd0b3AnXG4gIH0sXG4gIHtcbiAgICBvcmlnaW5YOiAnc3RhcnQnLFxuICAgIG9yaWdpblk6ICd0b3AnLFxuICAgIG92ZXJsYXlYOiAnc3RhcnQnLFxuICAgIG92ZXJsYXlZOiAnYm90dG9tJ1xuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ2VuZCcsXG4gICAgb3JpZ2luWTogJ3RvcCcsXG4gICAgb3ZlcmxheVg6ICdlbmQnLFxuICAgIG92ZXJsYXlZOiAnYm90dG9tJ1xuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ2VuZCcsXG4gICAgb3JpZ2luWTogJ2JvdHRvbScsXG4gICAgb3ZlcmxheVg6ICdlbmQnLFxuICAgIG92ZXJsYXlZOiAndG9wJ1xuICB9XG5dO1xuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgZGV0ZXJtaW5lcyB0aGUgc2Nyb2xsIGhhbmRsaW5nIHdoaWxlIHRoZSBjb25uZWN0ZWQgb3ZlcmxheSBpcyBvcGVuLiAqL1xuZXhwb3J0IGNvbnN0IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1kgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwoKSA9PiBTY3JvbGxTdHJhdGVneT4oJ2Nkay1jb25uZWN0ZWQtb3ZlcmxheS1zY3JvbGwtc3RyYXRlZ3knKTtcblxuLyoqIEBkb2NzLXByaXZhdGUgQGRlcHJlY2F0ZWQgQGJyZWFraW5nLWNoYW5nZSA4LjAuMCAqL1xuZXhwb3J0IGZ1bmN0aW9uIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfRkFDVE9SWShvdmVybGF5OiBPdmVybGF5KTpcbiAgKCkgPT4gU2Nyb2xsU3RyYXRlZ3kge1xuICByZXR1cm4gKGNvbmZpZz86IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZykgPT4gb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oY29uZmlnKTtcbn1cblxuLyoqXG4gKiBEaXJlY3RpdmUgYXBwbGllZCB0byBhbiBlbGVtZW50IHRvIG1ha2UgaXQgdXNhYmxlIGFzIGFuIG9yaWdpbiBmb3IgYW4gT3ZlcmxheSB1c2luZyBhXG4gKiBDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLW92ZXJsYXktb3JpZ2luXSwgW292ZXJsYXktb3JpZ2luXSwgW2Nka092ZXJsYXlPcmlnaW5dJyxcbiAgZXhwb3J0QXM6ICdjZGtPdmVybGF5T3JpZ2luJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT3ZlcmxheU9yaWdpbiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCBvbiB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGFwcGxpZWQuICovXG4gICAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZikgeyB9XG59XG5cblxuLyoqXG4gKiBEaXJlY3RpdmUgdG8gZmFjaWxpdGF0ZSBkZWNsYXJhdGl2ZSBjcmVhdGlvbiBvZiBhblxuICogT3ZlcmxheSB1c2luZyBhIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1jb25uZWN0ZWQtb3ZlcmxheV0sIFtjb25uZWN0ZWQtb3ZlcmxheV0sIFtjZGtDb25uZWN0ZWRPdmVybGF5XScsXG4gIGV4cG9ydEFzOiAnY2RrQ29ubmVjdGVkT3ZlcmxheSdcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29ubmVjdGVkT3ZlcmxheSBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgcHJpdmF0ZSBfb3ZlcmxheVJlZjogT3ZlcmxheVJlZjtcbiAgcHJpdmF0ZSBfdGVtcGxhdGVQb3J0YWw6IFRlbXBsYXRlUG9ydGFsO1xuICBwcml2YXRlIF9oYXNCYWNrZHJvcCA9IGZhbHNlO1xuICBwcml2YXRlIF9sb2NrUG9zaXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZ3Jvd0FmdGVyT3BlbiA9IGZhbHNlO1xuICBwcml2YXRlIF9mbGV4aWJsZURpbWVuc2lvbnMgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcHVzaCA9IGZhbHNlO1xuICBwcml2YXRlIF9iYWNrZHJvcFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfb2Zmc2V0WDogbnVtYmVyO1xuICBwcml2YXRlIF9vZmZzZXRZOiBudW1iZXI7XG4gIHByaXZhdGUgX3Bvc2l0aW9uOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k7XG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5RmFjdG9yeTogKCkgPT4gU2Nyb2xsU3RyYXRlZ3k7XG5cbiAgLyoqIE9yaWdpbiBmb3IgdGhlIGNvbm5lY3RlZCBvdmVybGF5LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPcmlnaW4nKSBvcmlnaW46IENka092ZXJsYXlPcmlnaW47XG5cbiAgLyoqIFJlZ2lzdGVyZWQgY29ubmVjdGVkIHBvc2l0aW9uIHBhaXJzLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbnMnKSBwb3NpdGlvbnM6IENvbm5lY3RlZFBvc2l0aW9uW107XG5cbiAgLyoqXG4gICAqIFRoaXMgaW5wdXQgb3ZlcnJpZGVzIHRoZSBwb3NpdGlvbnMgaW5wdXQgaWYgc3BlY2lmaWVkLiBJdCBsZXRzIHVzZXJzIHBhc3NcbiAgICogaW4gYXJiaXRyYXJ5IHBvc2l0aW9uaW5nIHN0cmF0ZWdpZXMuXG4gICAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5JykgcG9zaXRpb25TdHJhdGVneTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5O1xuXG4gIC8qKiBUaGUgb2Zmc2V0IGluIHBpeGVscyBmb3IgdGhlIG92ZXJsYXkgY29ubmVjdGlvbiBwb2ludCBvbiB0aGUgeC1heGlzICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU9mZnNldFgnKVxuICBnZXQgb2Zmc2V0WCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fb2Zmc2V0WDsgfVxuICBzZXQgb2Zmc2V0WChvZmZzZXRYOiBudW1iZXIpIHtcbiAgICB0aGlzLl9vZmZzZXRYID0gb2Zmc2V0WDtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvbikge1xuICAgICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneSh0aGlzLl9wb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSBvZmZzZXQgaW4gcGl4ZWxzIGZvciB0aGUgb3ZlcmxheSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB5LWF4aXMgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T2Zmc2V0WScpXG4gIGdldCBvZmZzZXRZKCkgeyByZXR1cm4gdGhpcy5fb2Zmc2V0WTsgfVxuICBzZXQgb2Zmc2V0WShvZmZzZXRZOiBudW1iZXIpIHtcbiAgICB0aGlzLl9vZmZzZXRZID0gb2Zmc2V0WTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvbikge1xuICAgICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneSh0aGlzLl9wb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSB3aWR0aCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5V2lkdGgnKSB3aWR0aDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlIZWlnaHQnKSBoZWlnaHQ6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIG1pbiB3aWR0aCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5TWluV2lkdGgnKSBtaW5XaWR0aDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluIGhlaWdodCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5TWluSGVpZ2h0JykgbWluSGVpZ2h0OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXN0b20gY2xhc3MgdG8gYmUgc2V0IG9uIHRoZSBiYWNrZHJvcCBlbGVtZW50LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlCYWNrZHJvcENsYXNzJykgYmFja2Ryb3BDbGFzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUgY3VzdG9tIGNsYXNzIHRvIGFkZCB0byB0aGUgb3ZlcmxheSBwYW5lIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVBhbmVsQ2xhc3MnKSBwYW5lbENsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiogTWFyZ2luIGJldHdlZW4gdGhlIG92ZXJsYXkgYW5kIHRoZSB2aWV3cG9ydCBlZGdlcy4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5Vmlld3BvcnRNYXJnaW4nKSB2aWV3cG9ydE1hcmdpbjogbnVtYmVyID0gMDtcblxuICAvKiogU3RyYXRlZ3kgdG8gYmUgdXNlZCB3aGVuIGhhbmRsaW5nIHNjcm9sbCBldmVudHMgd2hpbGUgdGhlIG92ZXJsYXkgaXMgb3Blbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5U2Nyb2xsU3RyYXRlZ3knKSBzY3JvbGxTdHJhdGVneTogU2Nyb2xsU3RyYXRlZ3k7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgaXMgb3Blbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T3BlbicpIG9wZW46IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQ1NTIHNlbGVjdG9yIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5VHJhbnNmb3JtT3JpZ2luT24nKSB0cmFuc2Zvcm1PcmlnaW5TZWxlY3Rvcjogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgb3ZlcmxheSBzaG91bGQgYXR0YWNoIGEgYmFja2Ryb3AuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUhhc0JhY2tkcm9wJylcbiAgZ2V0IGhhc0JhY2tkcm9wKCkgeyByZXR1cm4gdGhpcy5faGFzQmFja2Ryb3A7IH1cbiAgc2V0IGhhc0JhY2tkcm9wKHZhbHVlOiBhbnkpIHsgdGhpcy5faGFzQmFja2Ryb3AgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoZSBvdmVybGF5IHNob3VsZCBiZSBsb2NrZWQgd2hlbiBzY3JvbGxpbmcuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUxvY2tQb3NpdGlvbicpXG4gIGdldCBsb2NrUG9zaXRpb24oKSB7IHJldHVybiB0aGlzLl9sb2NrUG9zaXRpb247IH1cbiAgc2V0IGxvY2tQb3NpdGlvbih2YWx1ZTogYW55KSB7IHRoaXMuX2xvY2tQb3NpdGlvbiA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSdzIHdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGNvbnN0cmFpbmVkIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlGbGV4aWJsZURpbWVuc2lvbnMnKVxuICBnZXQgZmxleGlibGVEaW1lbnNpb25zKCkgeyByZXR1cm4gdGhpcy5fZmxleGlibGVEaW1lbnNpb25zOyB9XG4gIHNldCBmbGV4aWJsZURpbWVuc2lvbnModmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9mbGV4aWJsZURpbWVuc2lvbnMgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgYWZ0ZXIgdGhlIGluaXRpYWwgb3BlbiB3aGVuIGZsZXhpYmxlIHBvc2l0aW9uaW5nIGlzIHR1cm5lZCBvbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5R3Jvd0FmdGVyT3BlbicpXG4gIGdldCBncm93QWZ0ZXJPcGVuKCkgeyByZXR1cm4gdGhpcy5fZ3Jvd0FmdGVyT3BlbjsgfVxuICBzZXQgZ3Jvd0FmdGVyT3Blbih2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9ncm93QWZ0ZXJPcGVuID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIGlmIG5vbmUgb2YgdGhlIHByb3ZpZGVkIHBvc2l0aW9ucyBmaXQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVB1c2gnKVxuICBnZXQgcHVzaCgpIHsgcmV0dXJuIHRoaXMuX3B1c2g7IH1cbiAgc2V0IHB1c2godmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fcHVzaCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBiYWNrZHJvcCBpcyBjbGlja2VkLiAqL1xuICBAT3V0cHV0KCkgYmFja2Ryb3BDbGljayA9IG5ldyBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBwb3NpdGlvbiBoYXMgY2hhbmdlZC4gKi9cbiAgQE91dHB1dCgpIHBvc2l0aW9uQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2U+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBhdHRhY2hlZC4gKi9cbiAgQE91dHB1dCgpIGF0dGFjaCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGRldGFjaGVkLiAqL1xuICBAT3V0cHV0KCkgZGV0YWNoID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZXJlIGFyZSBrZXlib2FyZCBldmVudHMgdGhhdCBhcmUgdGFyZ2V0ZWQgYXQgdGhlIG92ZXJsYXkuICovXG4gIEBPdXRwdXQoKSBvdmVybGF5S2V5ZG93biA9IG5ldyBFdmVudEVtaXR0ZXI8S2V5Ym9hcmRFdmVudD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGVyZSBhcmUgbW91c2Ugb3V0c2lkZSBjbGljayBldmVudHMgdGhhdCBhcmUgdGFyZ2V0ZWQgYXQgdGhlIG92ZXJsYXkuICovXG4gIEBPdXRwdXQoKSBvdmVybGF5T3V0c2lkZUNsaWNrID0gbmV3IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PigpO1xuXG4gIC8vIFRPRE8oamVsYm91cm4pOiBpbnB1dHMgZm9yIHNpemUsIHNjcm9sbCBiZWhhdmlvciwgYW5pbWF0aW9uLCBldGMuXG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9vdmVybGF5OiBPdmVybGF5LFxuICAgICAgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPGFueT4sXG4gICAgICB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgQEluamVjdChDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZKSBzY3JvbGxTdHJhdGVneUZhY3Rvcnk6IGFueSxcbiAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHkpIHtcbiAgICB0aGlzLl90ZW1wbGF0ZVBvcnRhbCA9IG5ldyBUZW1wbGF0ZVBvcnRhbCh0ZW1wbGF0ZVJlZiwgdmlld0NvbnRhaW5lclJlZik7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5ID0gc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5O1xuICAgIHRoaXMuc2Nyb2xsU3RyYXRlZ3kgPSB0aGlzLl9zY3JvbGxTdHJhdGVneUZhY3RvcnkoKTtcbiAgfVxuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBvdmVybGF5IHJlZmVyZW5jZS4gKi9cbiAgZ2V0IG92ZXJsYXlSZWYoKTogT3ZlcmxheVJlZiB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlSZWY7XG4gIH1cblxuICAvKiogVGhlIGVsZW1lbnQncyBsYXlvdXQgZGlyZWN0aW9uLiAqL1xuICBnZXQgZGlyKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RpciA/IHRoaXMuX2Rpci52YWx1ZSA6ICdsdHInO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX2JhY2tkcm9wU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlU2l6ZSh7XG4gICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICBtaW5XaWR0aDogdGhpcy5taW5XaWR0aCxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgbWluSGVpZ2h0OiB0aGlzLm1pbkhlaWdodCxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY2hhbmdlc1snb3JpZ2luJ10gJiYgdGhpcy5vcGVuKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXNbJ29wZW4nXSkge1xuICAgICAgdGhpcy5vcGVuID8gdGhpcy5fYXR0YWNoT3ZlcmxheSgpIDogdGhpcy5fZGV0YWNoT3ZlcmxheSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIG92ZXJsYXkgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlT3ZlcmxheSgpIHtcbiAgICBpZiAoIXRoaXMucG9zaXRpb25zIHx8ICF0aGlzLnBvc2l0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucG9zaXRpb25zID0gZGVmYXVsdFBvc2l0aW9uTGlzdDtcbiAgICB9XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmID0gdGhpcy5fb3ZlcmxheS5jcmVhdGUodGhpcy5fYnVpbGRDb25maWcoKSk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmLmtleWRvd25FdmVudHMoKS5zdWJzY3JpYmUoKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICB0aGlzLm92ZXJsYXlLZXlkb3duLm5leHQoZXZlbnQpO1xuXG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gRVNDQVBFICYmICFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5fZGV0YWNoT3ZlcmxheSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZi5vdXRzaWRlUG9pbnRlckV2ZW50cygpLnN1YnNjcmliZSgoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIHRoaXMub3ZlcmxheU91dHNpZGVDbGljay5uZXh0KGV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBCdWlsZHMgdGhlIG92ZXJsYXkgY29uZmlnIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgKi9cbiAgcHJpdmF0ZSBfYnVpbGRDb25maWcoKTogT3ZlcmxheUNvbmZpZyB7XG4gICAgY29uc3QgcG9zaXRpb25TdHJhdGVneSA9IHRoaXMuX3Bvc2l0aW9uID1cbiAgICAgIHRoaXMucG9zaXRpb25TdHJhdGVneSB8fCB0aGlzLl9jcmVhdGVQb3NpdGlvblN0cmF0ZWd5KCk7XG4gICAgY29uc3Qgb3ZlcmxheUNvbmZpZyA9IG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyLFxuICAgICAgcG9zaXRpb25TdHJhdGVneSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLnNjcm9sbFN0cmF0ZWd5LFxuICAgICAgaGFzQmFja2Ryb3A6IHRoaXMuaGFzQmFja2Ryb3BcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMud2lkdGggPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcud2lkdGggPSB0aGlzLndpZHRoO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlaWdodCB8fCB0aGlzLmhlaWdodCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5XaWR0aCB8fCB0aGlzLm1pbldpZHRoID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLm1pbldpZHRoID0gdGhpcy5taW5XaWR0aDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5IZWlnaHQgfHwgdGhpcy5taW5IZWlnaHQgPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcubWluSGVpZ2h0ID0gdGhpcy5taW5IZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYmFja2Ryb3BDbGFzcykge1xuICAgICAgb3ZlcmxheUNvbmZpZy5iYWNrZHJvcENsYXNzID0gdGhpcy5iYWNrZHJvcENsYXNzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBhbmVsQ2xhc3MpIHtcbiAgICAgIG92ZXJsYXlDb25maWcucGFuZWxDbGFzcyA9IHRoaXMucGFuZWxDbGFzcztcbiAgICB9XG5cbiAgICByZXR1cm4gb3ZlcmxheUNvbmZpZztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBhIHBvc2l0aW9uIHN0cmF0ZWd5LCBiYXNlZCBvbiB0aGUgdmFsdWVzIG9mIHRoZSBkaXJlY3RpdmUgaW5wdXRzLiAqL1xuICBwcml2YXRlIF91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHBvc2l0aW9uU3RyYXRlZ3k6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSkge1xuICAgIGNvbnN0IHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXSA9IHRoaXMucG9zaXRpb25zLm1hcChjdXJyZW50UG9zaXRpb24gPT4gKHtcbiAgICAgIG9yaWdpblg6IGN1cnJlbnRQb3NpdGlvbi5vcmlnaW5YLFxuICAgICAgb3JpZ2luWTogY3VycmVudFBvc2l0aW9uLm9yaWdpblksXG4gICAgICBvdmVybGF5WDogY3VycmVudFBvc2l0aW9uLm92ZXJsYXlYLFxuICAgICAgb3ZlcmxheVk6IGN1cnJlbnRQb3NpdGlvbi5vdmVybGF5WSxcbiAgICAgIG9mZnNldFg6IGN1cnJlbnRQb3NpdGlvbi5vZmZzZXRYIHx8IHRoaXMub2Zmc2V0WCxcbiAgICAgIG9mZnNldFk6IGN1cnJlbnRQb3NpdGlvbi5vZmZzZXRZIHx8IHRoaXMub2Zmc2V0WSxcbiAgICAgIHBhbmVsQ2xhc3M6IGN1cnJlbnRQb3NpdGlvbi5wYW5lbENsYXNzIHx8IHVuZGVmaW5lZCxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcG9zaXRpb25TdHJhdGVneVxuICAgICAgLnNldE9yaWdpbih0aGlzLm9yaWdpbi5lbGVtZW50UmVmKVxuICAgICAgLndpdGhQb3NpdGlvbnMocG9zaXRpb25zKVxuICAgICAgLndpdGhGbGV4aWJsZURpbWVuc2lvbnModGhpcy5mbGV4aWJsZURpbWVuc2lvbnMpXG4gICAgICAud2l0aFB1c2godGhpcy5wdXNoKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKHRoaXMuZ3Jvd0FmdGVyT3BlbilcbiAgICAgIC53aXRoVmlld3BvcnRNYXJnaW4odGhpcy52aWV3cG9ydE1hcmdpbilcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24odGhpcy5sb2NrUG9zaXRpb24pXG4gICAgICAud2l0aFRyYW5zZm9ybU9yaWdpbk9uKHRoaXMudHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IG9mIHRoZSBvdmVybGF5IHRvIGJlIHNldCBvbiB0aGUgb3ZlcmxheSBjb25maWcgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUG9zaXRpb25TdHJhdGVneSgpOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fb3ZlcmxheS5wb3NpdGlvbigpLmZsZXhpYmxlQ29ubmVjdGVkVG8odGhpcy5vcmlnaW4uZWxlbWVudFJlZik7XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHN0cmF0ZWd5KTtcbiAgICBzdHJhdGVneS5wb3NpdGlvbkNoYW5nZXMuc3Vic2NyaWJlKHAgPT4gdGhpcy5wb3NpdGlvbkNoYW5nZS5lbWl0KHApKTtcblxuICAgIHJldHVybiBzdHJhdGVneTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGUgb3ZlcmxheSBhbmQgc3Vic2NyaWJlcyB0byBiYWNrZHJvcCBjbGlja3MgaWYgYmFja2Ryb3AgZXhpc3RzICovXG4gIHByaXZhdGUgX2F0dGFjaE92ZXJsYXkoKSB7XG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9jcmVhdGVPdmVybGF5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgb3ZlcmxheSBzaXplLCBpbiBjYXNlIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgaGF2ZSBjaGFuZ2VkXG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLmhhc0JhY2tkcm9wID0gdGhpcy5oYXNCYWNrZHJvcDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX292ZXJsYXlSZWYuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5hdHRhY2godGhpcy5fdGVtcGxhdGVQb3J0YWwpO1xuICAgICAgdGhpcy5hdHRhY2guZW1pdCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0JhY2tkcm9wKSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbiA9IHRoaXMuX292ZXJsYXlSZWYuYmFja2Ryb3BDbGljaygpLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgIHRoaXMuYmFja2Ryb3BDbGljay5lbWl0KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgb3ZlcmxheSBhbmQgdW5zdWJzY3JpYmVzIHRvIGJhY2tkcm9wIGNsaWNrcyBpZiBiYWNrZHJvcCBleGlzdHMgKi9cbiAgcHJpdmF0ZSBfZGV0YWNoT3ZlcmxheSgpIHtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5kZXRhY2goKTtcbiAgICAgIHRoaXMuZGV0YWNoLmVtaXQoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2hhc0JhY2tkcm9wOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9sb2NrUG9zaXRpb246IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2ZsZXhpYmxlRGltZW5zaW9uczogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZ3Jvd0FmdGVyT3BlbjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcHVzaDogQm9vbGVhbklucHV0O1xufVxuXG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgZnVuY3Rpb24gQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZKG92ZXJsYXk6IE92ZXJsYXkpOlxuICAgICgpID0+IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSB7XG4gIHJldHVybiAoKSA9PiBvdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGNvbnN0IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIgPSB7XG4gIHByb3ZpZGU6IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1ksXG4gIGRlcHM6IFtPdmVybGF5XSxcbiAgdXNlRmFjdG9yeTogQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZLFxufTtcbiJdfQ==