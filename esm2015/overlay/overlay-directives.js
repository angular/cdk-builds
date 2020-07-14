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
        this._attachSubscription = Subscription.EMPTY;
        this._detachSubscription = Subscription.EMPTY;
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
        this._attachSubscription.unsubscribe();
        this._detachSubscription.unsubscribe();
        this._backdropSubscription.unsubscribe();
        if (this._overlayRef) {
            this._overlayRef.dispose();
        }
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
        const overlayRef = this._overlayRef = this._overlay.create(this._buildConfig());
        this._attachSubscription = overlayRef.attachments().subscribe(() => this.attach.emit());
        this._detachSubscription = overlayRef.detachments().subscribe(() => this.detach.emit());
        overlayRef.keydownEvents().subscribe((event) => {
            this.overlayKeydown.next(event);
            if (event.keyCode === ESCAPE && !hasModifierKey(event)) {
                event.preventDefault();
                this._detachOverlay();
            }
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
    overlayKeydown: [{ type: Output }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1kaXJlY3RpdmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L292ZXJsYXktZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBRU4sV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRy9DLE9BQU8sRUFFTCxpQ0FBaUMsR0FDbEMsTUFBTSxpREFBaUQsQ0FBQztBQVF6RCxvRkFBb0Y7QUFDcEYsTUFBTSxtQkFBbUIsR0FBd0I7SUFDL0M7UUFDRSxPQUFPLEVBQUUsT0FBTztRQUNoQixPQUFPLEVBQUUsUUFBUTtRQUNqQixRQUFRLEVBQUUsT0FBTztRQUNqQixRQUFRLEVBQUUsS0FBSztLQUNoQjtJQUNEO1FBQ0UsT0FBTyxFQUFFLE9BQU87UUFDaEIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsT0FBTztRQUNqQixRQUFRLEVBQUUsUUFBUTtLQUNuQjtJQUNEO1FBQ0UsT0FBTyxFQUFF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LENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtFU0NBUEUsIGhhc01vZGlmaWVyS2V5fSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge092ZXJsYXl9IGZyb20gJy4vb3ZlcmxheSc7XG5pbXBvcnQge092ZXJsYXlDb25maWd9IGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuaW1wb3J0IHtPdmVybGF5UmVmfSBmcm9tICcuL292ZXJsYXktcmVmJztcbmltcG9ydCB7Q29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlfSBmcm9tICcuL3Bvc2l0aW9uL2Nvbm5lY3RlZC1wb3NpdGlvbic7XG5pbXBvcnQge1xuICBDb25uZWN0ZWRQb3NpdGlvbixcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LFxufSBmcm9tICcuL3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge1xuICBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3ksXG4gIFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneUNvbmZpZyxcbiAgU2Nyb2xsU3RyYXRlZ3ksXG59IGZyb20gJy4vc2Nyb2xsL2luZGV4JztcblxuXG4vKiogRGVmYXVsdCBzZXQgb2YgcG9zaXRpb25zIGZvciB0aGUgb3ZlcmxheS4gRm9sbG93cyB0aGUgYmVoYXZpb3Igb2YgYSBkcm9wZG93bi4gKi9cbmNvbnN0IGRlZmF1bHRQb3NpdGlvbkxpc3Q6IENvbm5lY3RlZFBvc2l0aW9uW10gPSBbXG4gIHtcbiAgICBvcmlnaW5YOiAnc3RhcnQnLFxuICAgIG9yaWdpblk6ICdib3R0b20nLFxuICAgIG92ZXJsYXlYOiAnc3RhcnQnLFxuICAgIG92ZXJsYXlZOiAndG9wJ1xuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ3N0YXJ0JyxcbiAgICBvcmlnaW5ZOiAndG9wJyxcbiAgICBvdmVybGF5WDogJ3N0YXJ0JyxcbiAgICBvdmVybGF5WTogJ2JvdHRvbSdcbiAgfSxcbiAge1xuICAgIG9yaWdpblg6ICdlbmQnLFxuICAgIG9yaWdpblk6ICd0b3AnLFxuICAgIG92ZXJsYXlYOiAnZW5kJyxcbiAgICBvdmVybGF5WTogJ2JvdHRvbSdcbiAgfSxcbiAge1xuICAgIG9yaWdpblg6ICdlbmQnLFxuICAgIG9yaWdpblk6ICdib3R0b20nLFxuICAgIG92ZXJsYXlYOiAnZW5kJyxcbiAgICBvdmVybGF5WTogJ3RvcCdcbiAgfVxuXTtcblxuLyoqIEluamVjdGlvbiB0b2tlbiB0aGF0IGRldGVybWluZXMgdGhlIHNjcm9sbCBoYW5kbGluZyB3aGlsZSB0aGUgY29ubmVjdGVkIG92ZXJsYXkgaXMgb3Blbi4gKi9cbmV4cG9ydCBjb25zdCBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48KCkgPT4gU2Nyb2xsU3RyYXRlZ3k+KCdjZGstY29ubmVjdGVkLW92ZXJsYXktc2Nyb2xsLXN0cmF0ZWd5Jyk7XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX0ZBQ1RPUlkob3ZlcmxheTogT3ZlcmxheSk6XG4gICgpID0+IFNjcm9sbFN0cmF0ZWd5IHtcbiAgcmV0dXJuIChjb25maWc/OiBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3lDb25maWcpID0+IG92ZXJsYXkuc2Nyb2xsU3RyYXRlZ2llcy5yZXBvc2l0aW9uKGNvbmZpZyk7XG59XG5cbi8qKlxuICogRGlyZWN0aXZlIGFwcGxpZWQgdG8gYW4gZWxlbWVudCB0byBtYWtlIGl0IHVzYWJsZSBhcyBhbiBvcmlnaW4gZm9yIGFuIE92ZXJsYXkgdXNpbmcgYVxuICogQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1vdmVybGF5LW9yaWdpbl0sIFtvdmVybGF5LW9yaWdpbl0sIFtjZGtPdmVybGF5T3JpZ2luXScsXG4gIGV4cG9ydEFzOiAnY2RrT3ZlcmxheU9yaWdpbicsXG59KVxuZXhwb3J0IGNsYXNzIENka092ZXJsYXlPcmlnaW4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKiBSZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgb24gd2hpY2ggdGhlIGRpcmVjdGl2ZSBpcyBhcHBsaWVkLiAqL1xuICAgICAgcHVibGljIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHsgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRvIGZhY2lsaXRhdGUgZGVjbGFyYXRpdmUgY3JlYXRpb24gb2YgYW5cbiAqIE92ZXJsYXkgdXNpbmcgYSBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstY29ubmVjdGVkLW92ZXJsYXldLCBbY29ubmVjdGVkLW92ZXJsYXldLCBbY2RrQ29ubmVjdGVkT3ZlcmxheV0nLFxuICBleHBvcnRBczogJ2Nka0Nvbm5lY3RlZE92ZXJsYXknXG59KVxuZXhwb3J0IGNsYXNzIENka0Nvbm5lY3RlZE92ZXJsYXkgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG4gIHByaXZhdGUgX292ZXJsYXlSZWY6IE92ZXJsYXlSZWY7XG4gIHByaXZhdGUgX3RlbXBsYXRlUG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDtcbiAgcHJpdmF0ZSBfaGFzQmFja2Ryb3AgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfbG9ja1Bvc2l0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgX2dyb3dBZnRlck9wZW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmxleGlibGVEaW1lbnNpb25zID0gZmFsc2U7XG4gIHByaXZhdGUgX3B1c2ggPSBmYWxzZTtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX2F0dGFjaFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfZGV0YWNoU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9vZmZzZXRYOiBudW1iZXI7XG4gIHByaXZhdGUgX29mZnNldFk6IG51bWJlcjtcbiAgcHJpdmF0ZSBfcG9zaXRpb246IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneTtcbiAgcHJpdmF0ZSBfc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5OiAoKSA9PiBTY3JvbGxTdHJhdGVneTtcblxuICAvKiogT3JpZ2luIGZvciB0aGUgY29ubmVjdGVkIG92ZXJsYXkuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU9yaWdpbicpIG9yaWdpbjogQ2RrT3ZlcmxheU9yaWdpbjtcblxuICAvKiogUmVnaXN0ZXJlZCBjb25uZWN0ZWQgcG9zaXRpb24gcGFpcnMuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9ucycpIHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXTtcblxuICAvKipcbiAgICogVGhpcyBpbnB1dCBvdmVycmlkZXMgdGhlIHBvc2l0aW9ucyBpbnB1dCBpZiBzcGVjaWZpZWQuIEl0IGxldHMgdXNlcnMgcGFzc1xuICAgKiBpbiBhcmJpdHJhcnkgcG9zaXRpb25pbmcgc3RyYXRlZ2llcy5cbiAgICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3knKSBwb3NpdGlvblN0cmF0ZWd5OiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k7XG5cbiAgLyoqIFRoZSBvZmZzZXQgaW4gcGl4ZWxzIGZvciB0aGUgb3ZlcmxheSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB4LWF4aXMgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T2Zmc2V0WCcpXG4gIGdldCBvZmZzZXRYKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9vZmZzZXRYOyB9XG4gIHNldCBvZmZzZXRYKG9mZnNldFg6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFggPSBvZmZzZXRYO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIG9mZnNldCBpbiBwaXhlbHMgZm9yIHRoZSBvdmVybGF5IGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHktYXhpcyAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPZmZzZXRZJylcbiAgZ2V0IG9mZnNldFkoKSB7IHJldHVybiB0aGlzLl9vZmZzZXRZOyB9XG4gIHNldCBvZmZzZXRZKG9mZnNldFk6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFkgPSBvZmZzZXRZO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlXaWR0aCcpIHdpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUhlaWdodCcpIGhlaWdodDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5XaWR0aCcpIG1pbldpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4gaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5IZWlnaHQnKSBtaW5IZWlnaHQ6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIGN1c3RvbSBjbGFzcyB0byBiZSBzZXQgb24gdGhlIGJhY2tkcm9wIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUJhY2tkcm9wQ2xhc3MnKSBiYWNrZHJvcENsYXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXN0b20gY2xhc3MgdG8gYWRkIHRvIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UGFuZWxDbGFzcycpIHBhbmVsQ2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKiBNYXJnaW4gYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIHZpZXdwb3J0IGVkZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlWaWV3cG9ydE1hcmdpbicpIHZpZXdwb3J0TWFyZ2luOiBudW1iZXIgPSAwO1xuXG4gIC8qKiBTdHJhdGVneSB0byBiZSB1c2VkIHdoZW4gaGFuZGxpbmcgc2Nyb2xsIGV2ZW50cyB3aGlsZSB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlTY3JvbGxTdHJhdGVneScpIHNjcm9sbFN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPcGVuJykgb3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBDU1Mgc2VsZWN0b3Igd2hpY2ggdG8gc2V0IHRoZSB0cmFuc2Zvcm0gb3JpZ2luLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlUcmFuc2Zvcm1PcmlnaW5PbicpIHRyYW5zZm9ybU9yaWdpblNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoZSBvdmVybGF5IHNob3VsZCBhdHRhY2ggYSBiYWNrZHJvcC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5SGFzQmFja2Ryb3AnKVxuICBnZXQgaGFzQmFja2Ryb3AoKSB7IHJldHVybiB0aGlzLl9oYXNCYWNrZHJvcDsgfVxuICBzZXQgaGFzQmFja2Ryb3AodmFsdWU6IGFueSkgeyB0aGlzLl9oYXNCYWNrZHJvcCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogV2hldGhlciBvciBub3QgdGhlIG92ZXJsYXkgc2hvdWxkIGJlIGxvY2tlZCB3aGVuIHNjcm9sbGluZy4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5TG9ja1Bvc2l0aW9uJylcbiAgZ2V0IGxvY2tQb3NpdGlvbigpIHsgcmV0dXJuIHRoaXMuX2xvY2tQb3NpdGlvbjsgfVxuICBzZXQgbG9ja1Bvc2l0aW9uKHZhbHVlOiBhbnkpIHsgdGhpcy5fbG9ja1Bvc2l0aW9uID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5J3Mgd2lkdGggYW5kIGhlaWdodCBjYW4gYmUgY29uc3RyYWluZWQgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUZsZXhpYmxlRGltZW5zaW9ucycpXG4gIGdldCBmbGV4aWJsZURpbWVuc2lvbnMoKSB7IHJldHVybiB0aGlzLl9mbGV4aWJsZURpbWVuc2lvbnM7IH1cbiAgc2V0IGZsZXhpYmxlRGltZW5zaW9ucyh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2ZsZXhpYmxlRGltZW5zaW9ucyA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBjYW4gZ3JvdyBhZnRlciB0aGUgaW5pdGlhbCBvcGVuIHdoZW4gZmxleGlibGUgcG9zaXRpb25pbmcgaXMgdHVybmVkIG9uLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlHcm93QWZ0ZXJPcGVuJylcbiAgZ2V0IGdyb3dBZnRlck9wZW4oKSB7IHJldHVybiB0aGlzLl9ncm93QWZ0ZXJPcGVuOyB9XG4gIHNldCBncm93QWZ0ZXJPcGVuKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX2dyb3dBZnRlck9wZW4gPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIHB1c2hlZCBvbi1zY3JlZW4gaWYgbm9uZSBvZiB0aGUgcHJvdmlkZWQgcG9zaXRpb25zIGZpdC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UHVzaCcpXG4gIGdldCBwdXNoKCkgeyByZXR1cm4gdGhpcy5fcHVzaDsgfVxuICBzZXQgcHVzaCh2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9wdXNoID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGJhY2tkcm9wIGlzIGNsaWNrZWQuICovXG4gIEBPdXRwdXQoKSBiYWNrZHJvcENsaWNrID0gbmV3IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KCkgcG9zaXRpb25DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGF0dGFjaGVkLiAqL1xuICBAT3V0cHV0KCkgYXR0YWNoID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gZGV0YWNoZWQuICovXG4gIEBPdXRwdXQoKSBkZXRhY2ggPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlcmUgYXJlIGtleWJvYXJkIGV2ZW50cyB0aGF0IGFyZSB0YXJnZXRlZCBhdCB0aGUgb3ZlcmxheS4gKi9cbiAgQE91dHB1dCgpIG92ZXJsYXlLZXlkb3duID0gbmV3IEV2ZW50RW1pdHRlcjxLZXlib2FyZEV2ZW50PigpO1xuXG4gIC8vIFRPRE8oamVsYm91cm4pOiBpbnB1dHMgZm9yIHNpemUsIHNjcm9sbCBiZWhhdmlvciwgYW5pbWF0aW9uLCBldGMuXG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9vdmVybGF5OiBPdmVybGF5LFxuICAgICAgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPGFueT4sXG4gICAgICB2aWV3Q29udGFpbmVyUmVmOiBWaWV3Q29udGFpbmVyUmVmLFxuICAgICAgQEluamVjdChDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZKSBzY3JvbGxTdHJhdGVneUZhY3Rvcnk6IGFueSxcbiAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHkpIHtcbiAgICB0aGlzLl90ZW1wbGF0ZVBvcnRhbCA9IG5ldyBUZW1wbGF0ZVBvcnRhbCh0ZW1wbGF0ZVJlZiwgdmlld0NvbnRhaW5lclJlZik7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5ID0gc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5O1xuICAgIHRoaXMuc2Nyb2xsU3RyYXRlZ3kgPSB0aGlzLl9zY3JvbGxTdHJhdGVneUZhY3RvcnkoKTtcbiAgfVxuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBvdmVybGF5IHJlZmVyZW5jZS4gKi9cbiAgZ2V0IG92ZXJsYXlSZWYoKTogT3ZlcmxheVJlZiB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlSZWY7XG4gIH1cblxuICAvKiogVGhlIGVsZW1lbnQncyBsYXlvdXQgZGlyZWN0aW9uLiAqL1xuICBnZXQgZGlyKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RpciA/IHRoaXMuX2Rpci52YWx1ZSA6ICdsdHInO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fYXR0YWNoU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fZGV0YWNoU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcblxuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmRpc3Bvc2UoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlU2l6ZSh7XG4gICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICBtaW5XaWR0aDogdGhpcy5taW5XaWR0aCxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgbWluSGVpZ2h0OiB0aGlzLm1pbkhlaWdodCxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY2hhbmdlc1snb3JpZ2luJ10gJiYgdGhpcy5vcGVuKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXNbJ29wZW4nXSkge1xuICAgICAgdGhpcy5vcGVuID8gdGhpcy5fYXR0YWNoT3ZlcmxheSgpIDogdGhpcy5fZGV0YWNoT3ZlcmxheSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIG92ZXJsYXkgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlT3ZlcmxheSgpIHtcbiAgICBpZiAoIXRoaXMucG9zaXRpb25zIHx8ICF0aGlzLnBvc2l0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucG9zaXRpb25zID0gZGVmYXVsdFBvc2l0aW9uTGlzdDtcbiAgICB9XG5cbiAgICBjb25zdCBvdmVybGF5UmVmID0gdGhpcy5fb3ZlcmxheVJlZiA9IHRoaXMuX292ZXJsYXkuY3JlYXRlKHRoaXMuX2J1aWxkQ29uZmlnKCkpO1xuICAgIHRoaXMuX2F0dGFjaFN1YnNjcmlwdGlvbiA9IG92ZXJsYXlSZWYuYXR0YWNobWVudHMoKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5hdHRhY2guZW1pdCgpKTtcbiAgICB0aGlzLl9kZXRhY2hTdWJzY3JpcHRpb24gPSBvdmVybGF5UmVmLmRldGFjaG1lbnRzKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuZGV0YWNoLmVtaXQoKSk7XG4gICAgb3ZlcmxheVJlZi5rZXlkb3duRXZlbnRzKCkuc3Vic2NyaWJlKChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgdGhpcy5vdmVybGF5S2V5ZG93bi5uZXh0KGV2ZW50KTtcblxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IEVTQ0FQRSAmJiAhaGFzTW9kaWZpZXJLZXkoZXZlbnQpKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuX2RldGFjaE92ZXJsYXkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBCdWlsZHMgdGhlIG92ZXJsYXkgY29uZmlnIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgKi9cbiAgcHJpdmF0ZSBfYnVpbGRDb25maWcoKTogT3ZlcmxheUNvbmZpZyB7XG4gICAgY29uc3QgcG9zaXRpb25TdHJhdGVneSA9IHRoaXMuX3Bvc2l0aW9uID1cbiAgICAgIHRoaXMucG9zaXRpb25TdHJhdGVneSB8fCB0aGlzLl9jcmVhdGVQb3NpdGlvblN0cmF0ZWd5KCk7XG4gICAgY29uc3Qgb3ZlcmxheUNvbmZpZyA9IG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyLFxuICAgICAgcG9zaXRpb25TdHJhdGVneSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLnNjcm9sbFN0cmF0ZWd5LFxuICAgICAgaGFzQmFja2Ryb3A6IHRoaXMuaGFzQmFja2Ryb3BcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMud2lkdGggPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcud2lkdGggPSB0aGlzLndpZHRoO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlaWdodCB8fCB0aGlzLmhlaWdodCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5XaWR0aCB8fCB0aGlzLm1pbldpZHRoID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLm1pbldpZHRoID0gdGhpcy5taW5XaWR0aDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5IZWlnaHQgfHwgdGhpcy5taW5IZWlnaHQgPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcubWluSGVpZ2h0ID0gdGhpcy5taW5IZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYmFja2Ryb3BDbGFzcykge1xuICAgICAgb3ZlcmxheUNvbmZpZy5iYWNrZHJvcENsYXNzID0gdGhpcy5iYWNrZHJvcENsYXNzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBhbmVsQ2xhc3MpIHtcbiAgICAgIG92ZXJsYXlDb25maWcucGFuZWxDbGFzcyA9IHRoaXMucGFuZWxDbGFzcztcbiAgICB9XG5cbiAgICByZXR1cm4gb3ZlcmxheUNvbmZpZztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBhIHBvc2l0aW9uIHN0cmF0ZWd5LCBiYXNlZCBvbiB0aGUgdmFsdWVzIG9mIHRoZSBkaXJlY3RpdmUgaW5wdXRzLiAqL1xuICBwcml2YXRlIF91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHBvc2l0aW9uU3RyYXRlZ3k6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSkge1xuICAgIGNvbnN0IHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXSA9IHRoaXMucG9zaXRpb25zLm1hcChjdXJyZW50UG9zaXRpb24gPT4gKHtcbiAgICAgIG9yaWdpblg6IGN1cnJlbnRQb3NpdGlvbi5vcmlnaW5YLFxuICAgICAgb3JpZ2luWTogY3VycmVudFBvc2l0aW9uLm9yaWdpblksXG4gICAgICBvdmVybGF5WDogY3VycmVudFBvc2l0aW9uLm92ZXJsYXlYLFxuICAgICAgb3ZlcmxheVk6IGN1cnJlbnRQb3NpdGlvbi5vdmVybGF5WSxcbiAgICAgIG9mZnNldFg6IGN1cnJlbnRQb3NpdGlvbi5vZmZzZXRYIHx8IHRoaXMub2Zmc2V0WCxcbiAgICAgIG9mZnNldFk6IGN1cnJlbnRQb3NpdGlvbi5vZmZzZXRZIHx8IHRoaXMub2Zmc2V0WSxcbiAgICAgIHBhbmVsQ2xhc3M6IGN1cnJlbnRQb3NpdGlvbi5wYW5lbENsYXNzIHx8IHVuZGVmaW5lZCxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcG9zaXRpb25TdHJhdGVneVxuICAgICAgLnNldE9yaWdpbih0aGlzLm9yaWdpbi5lbGVtZW50UmVmKVxuICAgICAgLndpdGhQb3NpdGlvbnMocG9zaXRpb25zKVxuICAgICAgLndpdGhGbGV4aWJsZURpbWVuc2lvbnModGhpcy5mbGV4aWJsZURpbWVuc2lvbnMpXG4gICAgICAud2l0aFB1c2godGhpcy5wdXNoKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKHRoaXMuZ3Jvd0FmdGVyT3BlbilcbiAgICAgIC53aXRoVmlld3BvcnRNYXJnaW4odGhpcy52aWV3cG9ydE1hcmdpbilcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24odGhpcy5sb2NrUG9zaXRpb24pXG4gICAgICAud2l0aFRyYW5zZm9ybU9yaWdpbk9uKHRoaXMudHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IG9mIHRoZSBvdmVybGF5IHRvIGJlIHNldCBvbiB0aGUgb3ZlcmxheSBjb25maWcgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUG9zaXRpb25TdHJhdGVneSgpOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fb3ZlcmxheS5wb3NpdGlvbigpLmZsZXhpYmxlQ29ubmVjdGVkVG8odGhpcy5vcmlnaW4uZWxlbWVudFJlZik7XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHN0cmF0ZWd5KTtcbiAgICBzdHJhdGVneS5wb3NpdGlvbkNoYW5nZXMuc3Vic2NyaWJlKHAgPT4gdGhpcy5wb3NpdGlvbkNoYW5nZS5lbWl0KHApKTtcblxuICAgIHJldHVybiBzdHJhdGVneTtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGUgb3ZlcmxheSBhbmQgc3Vic2NyaWJlcyB0byBiYWNrZHJvcCBjbGlja3MgaWYgYmFja2Ryb3AgZXhpc3RzICovXG4gIHByaXZhdGUgX2F0dGFjaE92ZXJsYXkoKSB7XG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9jcmVhdGVPdmVybGF5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgb3ZlcmxheSBzaXplLCBpbiBjYXNlIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgaGF2ZSBjaGFuZ2VkXG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLmhhc0JhY2tkcm9wID0gdGhpcy5oYXNCYWNrZHJvcDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX292ZXJsYXlSZWYuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5hdHRhY2godGhpcy5fdGVtcGxhdGVQb3J0YWwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0JhY2tkcm9wKSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbiA9IHRoaXMuX292ZXJsYXlSZWYuYmFja2Ryb3BDbGljaygpLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgIHRoaXMuYmFja2Ryb3BDbGljay5lbWl0KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgb3ZlcmxheSBhbmQgdW5zdWJzY3JpYmVzIHRvIGJhY2tkcm9wIGNsaWNrcyBpZiBiYWNrZHJvcCBleGlzdHMgKi9cbiAgcHJpdmF0ZSBfZGV0YWNoT3ZlcmxheSgpIHtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5kZXRhY2goKTtcbiAgICB9XG5cbiAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2hhc0JhY2tkcm9wOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9sb2NrUG9zaXRpb246IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2ZsZXhpYmxlRGltZW5zaW9uczogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZ3Jvd0FmdGVyT3BlbjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcHVzaDogQm9vbGVhbklucHV0O1xufVxuXG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgZnVuY3Rpb24gQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZKG92ZXJsYXk6IE92ZXJsYXkpOlxuICAgICgpID0+IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSB7XG4gIHJldHVybiAoKSA9PiBvdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGNvbnN0IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIgPSB7XG4gIHByb3ZpZGU6IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1ksXG4gIGRlcHM6IFtPdmVybGF5XSxcbiAgdXNlRmFjdG9yeTogQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZLFxufTtcbiJdfQ==