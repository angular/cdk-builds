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
import { takeWhile } from 'rxjs/operators';
import { Overlay } from './overlay';
import { OverlayConfig } from './overlay-config';
import { FlexibleConnectedPositionStrategy, } from './position/flexible-connected-position-strategy';
import * as i0 from "@angular/core";
import * as i1 from "./overlay";
import * as i2 from "@angular/cdk/bidi";
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
CdkOverlayOrigin.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkOverlayOrigin, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
CdkOverlayOrigin.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkOverlayOrigin, selector: "[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]", exportAs: ["cdkOverlayOrigin"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkOverlayOrigin, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]',
                    exportAs: 'cdkOverlayOrigin',
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; } });
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
        this._positionSubscription = Subscription.EMPTY;
        /** Margin between the overlay and the viewport edges. */
        this.viewportMargin = 0;
        /** Whether the overlay is open. */
        this.open = false;
        /** Whether the overlay can be closed by user interaction. */
        this.disableClose = false;
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
        this._attachSubscription.unsubscribe();
        this._detachSubscription.unsubscribe();
        this._backdropSubscription.unsubscribe();
        this._positionSubscription.unsubscribe();
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
            if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
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
        return positionStrategy.setOrigin(this._getFlexibleConnectedPositionStrategyOrigin())
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
        const strategy = this._overlay.position().flexibleConnectedTo(this._getFlexibleConnectedPositionStrategyOrigin());
        this._updatePositionStrategy(strategy);
        return strategy;
    }
    _getFlexibleConnectedPositionStrategyOrigin() {
        if (this.origin instanceof CdkOverlayOrigin) {
            return this.origin.elementRef;
        }
        else {
            return this.origin;
        }
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
        this._positionSubscription.unsubscribe();
        // Only subscribe to `positionChanges` if requested, because putting
        // together all the information for it can be expensive.
        if (this.positionChange.observers.length > 0) {
            this._positionSubscription = this._position.positionChanges
                .pipe(takeWhile(() => this.positionChange.observers.length > 0))
                .subscribe(position => {
                this.positionChange.emit(position);
                if (this.positionChange.observers.length === 0) {
                    this._positionSubscription.unsubscribe();
                }
            });
        }
    }
    /** Detaches the overlay and unsubscribes to backdrop clicks if backdrop exists */
    _detachOverlay() {
        if (this._overlayRef) {
            this._overlayRef.detach();
        }
        this._backdropSubscription.unsubscribe();
        this._positionSubscription.unsubscribe();
    }
}
CdkConnectedOverlay.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkConnectedOverlay, deps: [{ token: i1.Overlay }, { token: i0.TemplateRef }, { token: i0.ViewContainerRef }, { token: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkConnectedOverlay.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkConnectedOverlay, selector: "[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]", inputs: { origin: ["cdkConnectedOverlayOrigin", "origin"], positions: ["cdkConnectedOverlayPositions", "positions"], positionStrategy: ["cdkConnectedOverlayPositionStrategy", "positionStrategy"], offsetX: ["cdkConnectedOverlayOffsetX", "offsetX"], offsetY: ["cdkConnectedOverlayOffsetY", "offsetY"], width: ["cdkConnectedOverlayWidth", "width"], height: ["cdkConnectedOverlayHeight", "height"], minWidth: ["cdkConnectedOverlayMinWidth", "minWidth"], minHeight: ["cdkConnectedOverlayMinHeight", "minHeight"], backdropClass: ["cdkConnectedOverlayBackdropClass", "backdropClass"], panelClass: ["cdkConnectedOverlayPanelClass", "panelClass"], viewportMargin: ["cdkConnectedOverlayViewportMargin", "viewportMargin"], scrollStrategy: ["cdkConnectedOverlayScrollStrategy", "scrollStrategy"], open: ["cdkConnectedOverlayOpen", "open"], disableClose: ["cdkConnectedOverlayDisableClose", "disableClose"], transformOriginSelector: ["cdkConnectedOverlayTransformOriginOn", "transformOriginSelector"], hasBackdrop: ["cdkConnectedOverlayHasBackdrop", "hasBackdrop"], lockPosition: ["cdkConnectedOverlayLockPosition", "lockPosition"], flexibleDimensions: ["cdkConnectedOverlayFlexibleDimensions", "flexibleDimensions"], growAfterOpen: ["cdkConnectedOverlayGrowAfterOpen", "growAfterOpen"], push: ["cdkConnectedOverlayPush", "push"] }, outputs: { backdropClick: "backdropClick", positionChange: "positionChange", attach: "attach", detach: "detach", overlayKeydown: "overlayKeydown", overlayOutsideClick: "overlayOutsideClick" }, exportAs: ["cdkConnectedOverlay"], usesOnChanges: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkConnectedOverlay, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]',
                    exportAs: 'cdkConnectedOverlay'
                }]
        }], ctorParameters: function () { return [{ type: i1.Overlay }, { type: i0.TemplateRef }, { type: i0.ViewContainerRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY]
                }] }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }]; }, propDecorators: { origin: [{
                type: Input,
                args: ['cdkConnectedOverlayOrigin']
            }], positions: [{
                type: Input,
                args: ['cdkConnectedOverlayPositions']
            }], positionStrategy: [{
                type: Input,
                args: ['cdkConnectedOverlayPositionStrategy']
            }], offsetX: [{
                type: Input,
                args: ['cdkConnectedOverlayOffsetX']
            }], offsetY: [{
                type: Input,
                args: ['cdkConnectedOverlayOffsetY']
            }], width: [{
                type: Input,
                args: ['cdkConnectedOverlayWidth']
            }], height: [{
                type: Input,
                args: ['cdkConnectedOverlayHeight']
            }], minWidth: [{
                type: Input,
                args: ['cdkConnectedOverlayMinWidth']
            }], minHeight: [{
                type: Input,
                args: ['cdkConnectedOverlayMinHeight']
            }], backdropClass: [{
                type: Input,
                args: ['cdkConnectedOverlayBackdropClass']
            }], panelClass: [{
                type: Input,
                args: ['cdkConnectedOverlayPanelClass']
            }], viewportMargin: [{
                type: Input,
                args: ['cdkConnectedOverlayViewportMargin']
            }], scrollStrategy: [{
                type: Input,
                args: ['cdkConnectedOverlayScrollStrategy']
            }], open: [{
                type: Input,
                args: ['cdkConnectedOverlayOpen']
            }], disableClose: [{
                type: Input,
                args: ['cdkConnectedOverlayDisableClose']
            }], transformOriginSelector: [{
                type: Input,
                args: ['cdkConnectedOverlayTransformOriginOn']
            }], hasBackdrop: [{
                type: Input,
                args: ['cdkConnectedOverlayHasBackdrop']
            }], lockPosition: [{
                type: Input,
                args: ['cdkConnectedOverlayLockPosition']
            }], flexibleDimensions: [{
                type: Input,
                args: ['cdkConnectedOverlayFlexibleDimensions']
            }], growAfterOpen: [{
                type: Input,
                args: ['cdkConnectedOverlayGrowAfterOpen']
            }], push: [{
                type: Input,
                args: ['cdkConnectedOverlayPush']
            }], backdropClick: [{
                type: Output
            }], positionChange: [{
                type: Output
            }], attach: [{
                type: Output
            }], detach: [{
                type: Output
            }], overlayKeydown: [{
                type: Output
            }], overlayOutsideClick: [{
                type: Output
            }] } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1kaXJlY3RpdmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L292ZXJsYXktZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBRU4sV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUcvQyxPQUFPLEVBRUwsaUNBQWlDLEdBRWxDLE1BQU0saURBQWlELENBQUM7Ozs7QUFPekQsb0ZBQW9GO0FBQ3BGLE1BQU0sbUJBQW1CLEdBQXdCO0lBQy9DO1FBQ0UsT0FBTyxFQUFFLE9BQU87UUFDaEIsT0FBTyxFQUFFLFFBQVE7UUFDakIsUUFBUSxFQUFFLE9BQU87UUFDakIsUUFBUSxFQUFFLEtBQUs7S0FDaEI7SUFDRDtRQUNFLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLE9BQU87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QU07Z0JBR1ksTUFBTTtzQkFBeEIsTUFBTTtnQkFHWSxNQUFNO3NCQUF4QixNQUFNO2dCQUdZLGNBQWM7c0JBQWhDLE1BQU07Z0JBR1ksbUJBQW1CO3NCQUFyQyxNQUFNOztBQWtOVCxvQkFBb0I7QUFDcEIsTUFBTSxVQUFVLHNEQUFzRCxDQUFDLE9BQWdCO0lBRXJGLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3JELENBQUM7QUFFRCxvQkFBb0I7QUFDcEIsTUFBTSxDQUFDLE1BQU0sOENBQThDLEdBQUc7SUFDNUQsT0FBTyxFQUFFLHFDQUFxQztJQUM5QyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUM7SUFDZixVQUFVLEVBQUUsc0RBQXNEO0NBQ25FLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtFU0NBUEUsIGhhc01vZGlmaWVyS2V5fSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NvbnRhaW5lclJlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VXaGlsZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtPdmVybGF5fSBmcm9tICcuL292ZXJsYXknO1xuaW1wb3J0IHtPdmVybGF5Q29uZmlnfSBmcm9tICcuL292ZXJsYXktY29uZmlnJztcbmltcG9ydCB7T3ZlcmxheVJlZn0gZnJvbSAnLi9vdmVybGF5LXJlZic7XG5pbXBvcnQge0Nvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZX0gZnJvbSAnLi9wb3NpdGlvbi9jb25uZWN0ZWQtcG9zaXRpb24nO1xuaW1wb3J0IHtcbiAgQ29ubmVjdGVkUG9zaXRpb24sXG4gIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSxcbiAgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luLFxufSBmcm9tICcuL3Bvc2l0aW9uL2ZsZXhpYmxlLWNvbm5lY3RlZC1wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge1xuICBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3ksXG4gIFNjcm9sbFN0cmF0ZWd5LFxufSBmcm9tICcuL3Njcm9sbC9pbmRleCc7XG5cblxuLyoqIERlZmF1bHQgc2V0IG9mIHBvc2l0aW9ucyBmb3IgdGhlIG92ZXJsYXkuIEZvbGxvd3MgdGhlIGJlaGF2aW9yIG9mIGEgZHJvcGRvd24uICovXG5jb25zdCBkZWZhdWx0UG9zaXRpb25MaXN0OiBDb25uZWN0ZWRQb3NpdGlvbltdID0gW1xuICB7XG4gICAgb3JpZ2luWDogJ3N0YXJ0JyxcbiAgICBvcmlnaW5ZOiAnYm90dG9tJyxcbiAgICBvdmVybGF5WDogJ3N0YXJ0JyxcbiAgICBvdmVybGF5WTogJ3RvcCdcbiAgfSxcbiAge1xuICAgIG9yaWdpblg6ICdzdGFydCcsXG4gICAgb3JpZ2luWTogJ3RvcCcsXG4gICAgb3ZlcmxheVg6ICdzdGFydCcsXG4gICAgb3ZlcmxheVk6ICdib3R0b20nXG4gIH0sXG4gIHtcbiAgICBvcmlnaW5YOiAnZW5kJyxcbiAgICBvcmlnaW5ZOiAndG9wJyxcbiAgICBvdmVybGF5WDogJ2VuZCcsXG4gICAgb3ZlcmxheVk6ICdib3R0b20nXG4gIH0sXG4gIHtcbiAgICBvcmlnaW5YOiAnZW5kJyxcbiAgICBvcmlnaW5ZOiAnYm90dG9tJyxcbiAgICBvdmVybGF5WDogJ2VuZCcsXG4gICAgb3ZlcmxheVk6ICd0b3AnXG4gIH1cbl07XG5cbi8qKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBkZXRlcm1pbmVzIHRoZSBzY3JvbGwgaGFuZGxpbmcgd2hpbGUgdGhlIGNvbm5lY3RlZCBvdmVybGF5IGlzIG9wZW4uICovXG5leHBvcnQgY29uc3QgQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWSA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPCgpID0+IFNjcm9sbFN0cmF0ZWd5PignY2RrLWNvbm5lY3RlZC1vdmVybGF5LXNjcm9sbC1zdHJhdGVneScpO1xuXG4vKipcbiAqIERpcmVjdGl2ZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdG8gbWFrZSBpdCB1c2FibGUgYXMgYW4gb3JpZ2luIGZvciBhbiBPdmVybGF5IHVzaW5nIGFcbiAqIENvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstb3ZlcmxheS1vcmlnaW5dLCBbb3ZlcmxheS1vcmlnaW5dLCBbY2RrT3ZlcmxheU9yaWdpbl0nLFxuICBleHBvcnRBczogJ2Nka092ZXJsYXlPcmlnaW4nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtPdmVybGF5T3JpZ2luIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogUmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBkaXJlY3RpdmUgaXMgYXBwbGllZC4gKi9cbiAgICAgIHB1YmxpYyBlbGVtZW50UmVmOiBFbGVtZW50UmVmKSB7IH1cbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0byBmYWNpbGl0YXRlIGRlY2xhcmF0aXZlIGNyZWF0aW9uIG9mIGFuXG4gKiBPdmVybGF5IHVzaW5nIGEgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLWNvbm5lY3RlZC1vdmVybGF5XSwgW2Nvbm5lY3RlZC1vdmVybGF5XSwgW2Nka0Nvbm5lY3RlZE92ZXJsYXldJyxcbiAgZXhwb3J0QXM6ICdjZGtDb25uZWN0ZWRPdmVybGF5J1xufSlcbmV4cG9ydCBjbGFzcyBDZGtDb25uZWN0ZWRPdmVybGF5IGltcGxlbWVudHMgT25EZXN0cm95LCBPbkNoYW5nZXMge1xuICBwcml2YXRlIF9vdmVybGF5UmVmOiBPdmVybGF5UmVmO1xuICBwcml2YXRlIF90ZW1wbGF0ZVBvcnRhbDogVGVtcGxhdGVQb3J0YWw7XG4gIHByaXZhdGUgX2hhc0JhY2tkcm9wID0gZmFsc2U7XG4gIHByaXZhdGUgX2xvY2tQb3NpdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIF9ncm93QWZ0ZXJPcGVuID0gZmFsc2U7XG4gIHByaXZhdGUgX2ZsZXhpYmxlRGltZW5zaW9ucyA9IGZhbHNlO1xuICBwcml2YXRlIF9wdXNoID0gZmFsc2U7XG4gIHByaXZhdGUgX2JhY2tkcm9wU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9hdHRhY2hTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX2RldGFjaFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfcG9zaXRpb25TdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX29mZnNldFg6IG51bWJlcjtcbiAgcHJpdmF0ZSBfb2Zmc2V0WTogbnVtYmVyO1xuICBwcml2YXRlIF9wb3NpdGlvbjogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5O1xuICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneUZhY3Rvcnk6ICgpID0+IFNjcm9sbFN0cmF0ZWd5O1xuXG4gIC8qKiBPcmlnaW4gZm9yIHRoZSBjb25uZWN0ZWQgb3ZlcmxheS4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T3JpZ2luJylcbiAgb3JpZ2luOiBDZGtPdmVybGF5T3JpZ2lufEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbjtcblxuICAvKiogUmVnaXN0ZXJlZCBjb25uZWN0ZWQgcG9zaXRpb24gcGFpcnMuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9ucycpIHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXTtcblxuICAvKipcbiAgICogVGhpcyBpbnB1dCBvdmVycmlkZXMgdGhlIHBvc2l0aW9ucyBpbnB1dCBpZiBzcGVjaWZpZWQuIEl0IGxldHMgdXNlcnMgcGFzc1xuICAgKiBpbiBhcmJpdHJhcnkgcG9zaXRpb25pbmcgc3RyYXRlZ2llcy5cbiAgICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3knKSBwb3NpdGlvblN0cmF0ZWd5OiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3k7XG5cbiAgLyoqIFRoZSBvZmZzZXQgaW4gcGl4ZWxzIGZvciB0aGUgb3ZlcmxheSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB4LWF4aXMgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T2Zmc2V0WCcpXG4gIGdldCBvZmZzZXRYKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9vZmZzZXRYOyB9XG4gIHNldCBvZmZzZXRYKG9mZnNldFg6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFggPSBvZmZzZXRYO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIG9mZnNldCBpbiBwaXhlbHMgZm9yIHRoZSBvdmVybGF5IGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHktYXhpcyAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPZmZzZXRZJylcbiAgZ2V0IG9mZnNldFkoKSB7IHJldHVybiB0aGlzLl9vZmZzZXRZOyB9XG4gIHNldCBvZmZzZXRZKG9mZnNldFk6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFkgPSBvZmZzZXRZO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlXaWR0aCcpIHdpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUhlaWdodCcpIGhlaWdodDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5XaWR0aCcpIG1pbldpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4gaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5IZWlnaHQnKSBtaW5IZWlnaHQ6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIGN1c3RvbSBjbGFzcyB0byBiZSBzZXQgb24gdGhlIGJhY2tkcm9wIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUJhY2tkcm9wQ2xhc3MnKSBiYWNrZHJvcENsYXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBjdXN0b20gY2xhc3MgdG8gYWRkIHRvIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UGFuZWxDbGFzcycpIHBhbmVsQ2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdO1xuXG4gIC8qKiBNYXJnaW4gYmV0d2VlbiB0aGUgb3ZlcmxheSBhbmQgdGhlIHZpZXdwb3J0IGVkZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlWaWV3cG9ydE1hcmdpbicpIHZpZXdwb3J0TWFyZ2luOiBudW1iZXIgPSAwO1xuXG4gIC8qKiBTdHJhdGVneSB0byBiZSB1c2VkIHdoZW4gaGFuZGxpbmcgc2Nyb2xsIGV2ZW50cyB3aGlsZSB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlTY3JvbGxTdHJhdGVneScpIHNjcm9sbFN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPcGVuJykgb3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBjbG9zZWQgYnkgdXNlciBpbnRlcmFjdGlvbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5RGlzYWJsZUNsb3NlJykgZGlzYWJsZUNsb3NlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIENTUyBzZWxlY3RvciB3aGljaCB0byBzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVRyYW5zZm9ybU9yaWdpbk9uJykgdHJhbnNmb3JtT3JpZ2luU2VsZWN0b3I6IHN0cmluZztcblxuICAvKiogV2hldGhlciBvciBub3QgdGhlIG92ZXJsYXkgc2hvdWxkIGF0dGFjaCBhIGJhY2tkcm9wLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlIYXNCYWNrZHJvcCcpXG4gIGdldCBoYXNCYWNrZHJvcCgpIHsgcmV0dXJuIHRoaXMuX2hhc0JhY2tkcm9wOyB9XG4gIHNldCBoYXNCYWNrZHJvcCh2YWx1ZTogYW55KSB7IHRoaXMuX2hhc0JhY2tkcm9wID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgb3ZlcmxheSBzaG91bGQgYmUgbG9ja2VkIHdoZW4gc2Nyb2xsaW5nLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlMb2NrUG9zaXRpb24nKVxuICBnZXQgbG9ja1Bvc2l0aW9uKCkgeyByZXR1cm4gdGhpcy5fbG9ja1Bvc2l0aW9uOyB9XG4gIHNldCBsb2NrUG9zaXRpb24odmFsdWU6IGFueSkgeyB0aGlzLl9sb2NrUG9zaXRpb24gPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkncyB3aWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBjb25zdHJhaW5lZCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydC4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5RmxleGlibGVEaW1lbnNpb25zJylcbiAgZ2V0IGZsZXhpYmxlRGltZW5zaW9ucygpIHsgcmV0dXJuIHRoaXMuX2ZsZXhpYmxlRGltZW5zaW9uczsgfVxuICBzZXQgZmxleGlibGVEaW1lbnNpb25zKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZmxleGlibGVEaW1lbnNpb25zID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBncm93IGFmdGVyIHRoZSBpbml0aWFsIG9wZW4gd2hlbiBmbGV4aWJsZSBwb3NpdGlvbmluZyBpcyB0dXJuZWQgb24uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUdyb3dBZnRlck9wZW4nKVxuICBnZXQgZ3Jvd0FmdGVyT3BlbigpIHsgcmV0dXJuIHRoaXMuX2dyb3dBZnRlck9wZW47IH1cbiAgc2V0IGdyb3dBZnRlck9wZW4odmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fZ3Jvd0FmdGVyT3BlbiA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBjYW4gYmUgcHVzaGVkIG9uLXNjcmVlbiBpZiBub25lIG9mIHRoZSBwcm92aWRlZCBwb3NpdGlvbnMgZml0LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQdXNoJylcbiAgZ2V0IHB1c2goKSB7IHJldHVybiB0aGlzLl9wdXNoOyB9XG4gIHNldCBwdXNoKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX3B1c2ggPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgYmFja2Ryb3AgaXMgY2xpY2tlZC4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGJhY2tkcm9wQ2xpY2sgPSBuZXcgRXZlbnRFbWl0dGVyPE1vdXNlRXZlbnQ+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgcG9zaXRpb24gaGFzIGNoYW5nZWQuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBwb3NpdGlvbkNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Q29ubmVjdGVkT3ZlcmxheVBvc2l0aW9uQ2hhbmdlPigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gYXR0YWNoZWQuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBhdHRhY2ggPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBkZXRhY2hlZC4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRldGFjaCA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGVyZSBhcmUga2V5Ym9hcmQgZXZlbnRzIHRoYXQgYXJlIHRhcmdldGVkIGF0IHRoZSBvdmVybGF5LiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgb3ZlcmxheUtleWRvd24gPSBuZXcgRXZlbnRFbWl0dGVyPEtleWJvYXJkRXZlbnQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlcmUgYXJlIG1vdXNlIG91dHNpZGUgY2xpY2sgZXZlbnRzIHRoYXQgYXJlIHRhcmdldGVkIGF0IHRoZSBvdmVybGF5LiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgb3ZlcmxheU91dHNpZGVDbGljayA9IG5ldyBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4oKTtcblxuICAvLyBUT0RPKGplbGJvdXJuKTogaW5wdXRzIGZvciBzaXplLCBzY3JvbGwgYmVoYXZpb3IsIGFuaW1hdGlvbiwgZXRjLlxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfb3ZlcmxheTogT3ZlcmxheSxcbiAgICAgIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+LFxuICAgICAgdmlld0NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZixcbiAgICAgIEBJbmplY3QoQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWSkgc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5OiBhbnksXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5KSB7XG4gICAgdGhpcy5fdGVtcGxhdGVQb3J0YWwgPSBuZXcgVGVtcGxhdGVQb3J0YWwodGVtcGxhdGVSZWYsIHZpZXdDb250YWluZXJSZWYpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5RmFjdG9yeSA9IHNjcm9sbFN0cmF0ZWd5RmFjdG9yeTtcbiAgICB0aGlzLnNjcm9sbFN0cmF0ZWd5ID0gdGhpcy5fc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5KCk7XG4gIH1cblxuICAvKiogVGhlIGFzc29jaWF0ZWQgb3ZlcmxheSByZWZlcmVuY2UuICovXG4gIGdldCBvdmVybGF5UmVmKCk6IE92ZXJsYXlSZWYge1xuICAgIHJldHVybiB0aGlzLl9vdmVybGF5UmVmO1xuICB9XG5cbiAgLyoqIFRoZSBlbGVtZW50J3MgbGF5b3V0IGRpcmVjdGlvbi4gKi9cbiAgZ2V0IGRpcigpOiBEaXJlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9kaXIgPyB0aGlzLl9kaXIudmFsdWUgOiAnbHRyJztcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2F0dGFjaFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX2RldGFjaFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX2JhY2tkcm9wU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcG9zaXRpb25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcblxuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmRpc3Bvc2UoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYudXBkYXRlU2l6ZSh7XG4gICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICBtaW5XaWR0aDogdGhpcy5taW5XaWR0aCxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgbWluSGVpZ2h0OiB0aGlzLm1pbkhlaWdodCxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY2hhbmdlc1snb3JpZ2luJ10gJiYgdGhpcy5vcGVuKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXNbJ29wZW4nXSkge1xuICAgICAgdGhpcy5vcGVuID8gdGhpcy5fYXR0YWNoT3ZlcmxheSgpIDogdGhpcy5fZGV0YWNoT3ZlcmxheSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGFuIG92ZXJsYXkgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlT3ZlcmxheSgpIHtcbiAgICBpZiAoIXRoaXMucG9zaXRpb25zIHx8ICF0aGlzLnBvc2l0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucG9zaXRpb25zID0gZGVmYXVsdFBvc2l0aW9uTGlzdDtcbiAgICB9XG5cbiAgICBjb25zdCBvdmVybGF5UmVmID0gdGhpcy5fb3ZlcmxheVJlZiA9IHRoaXMuX292ZXJsYXkuY3JlYXRlKHRoaXMuX2J1aWxkQ29uZmlnKCkpO1xuICAgIHRoaXMuX2F0dGFjaFN1YnNjcmlwdGlvbiA9IG92ZXJsYXlSZWYuYXR0YWNobWVudHMoKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5hdHRhY2guZW1pdCgpKTtcbiAgICB0aGlzLl9kZXRhY2hTdWJzY3JpcHRpb24gPSBvdmVybGF5UmVmLmRldGFjaG1lbnRzKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuZGV0YWNoLmVtaXQoKSk7XG4gICAgb3ZlcmxheVJlZi5rZXlkb3duRXZlbnRzKCkuc3Vic2NyaWJlKChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgdGhpcy5vdmVybGF5S2V5ZG93bi5uZXh0KGV2ZW50KTtcblxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IEVTQ0FQRSAmJiAhdGhpcy5kaXNhYmxlQ2xvc2UgJiYgIWhhc01vZGlmaWVyS2V5KGV2ZW50KSkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLl9kZXRhY2hPdmVybGF5KCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vdmVybGF5UmVmLm91dHNpZGVQb2ludGVyRXZlbnRzKCkuc3Vic2NyaWJlKChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgdGhpcy5vdmVybGF5T3V0c2lkZUNsaWNrLm5leHQoZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEJ1aWxkcyB0aGUgb3ZlcmxheSBjb25maWcgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGlucHV0cyAqL1xuICBwcml2YXRlIF9idWlsZENvbmZpZygpOiBPdmVybGF5Q29uZmlnIHtcbiAgICBjb25zdCBwb3NpdGlvblN0cmF0ZWd5ID0gdGhpcy5fcG9zaXRpb24gPVxuICAgICAgdGhpcy5wb3NpdGlvblN0cmF0ZWd5IHx8IHRoaXMuX2NyZWF0ZVBvc2l0aW9uU3RyYXRlZ3koKTtcbiAgICBjb25zdCBvdmVybGF5Q29uZmlnID0gbmV3IE92ZXJsYXlDb25maWcoe1xuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXIsXG4gICAgICBwb3NpdGlvblN0cmF0ZWd5LFxuICAgICAgc2Nyb2xsU3RyYXRlZ3k6IHRoaXMuc2Nyb2xsU3RyYXRlZ3ksXG4gICAgICBoYXNCYWNrZHJvcDogdGhpcy5oYXNCYWNrZHJvcFxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy53aWR0aCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0ID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLmhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1pbldpZHRoIHx8IHRoaXMubWluV2lkdGggPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcubWluV2lkdGggPSB0aGlzLm1pbldpZHRoO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1pbkhlaWdodCB8fCB0aGlzLm1pbkhlaWdodCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy5taW5IZWlnaHQgPSB0aGlzLm1pbkhlaWdodDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5iYWNrZHJvcENsYXNzKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLmJhY2tkcm9wQ2xhc3MgPSB0aGlzLmJhY2tkcm9wQ2xhc3M7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGFuZWxDbGFzcykge1xuICAgICAgb3ZlcmxheUNvbmZpZy5wYW5lbENsYXNzID0gdGhpcy5wYW5lbENsYXNzO1xuICAgIH1cblxuICAgIHJldHVybiBvdmVybGF5Q29uZmlnO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHN0YXRlIG9mIGEgcG9zaXRpb24gc3RyYXRlZ3ksIGJhc2VkIG9uIHRoZSB2YWx1ZXMgb2YgdGhlIGRpcmVjdGl2ZSBpbnB1dHMuICovXG4gIHByaXZhdGUgX3VwZGF0ZVBvc2l0aW9uU3RyYXRlZ3kocG9zaXRpb25TdHJhdGVneTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBDb25uZWN0ZWRQb3NpdGlvbltdID0gdGhpcy5wb3NpdGlvbnMubWFwKGN1cnJlbnRQb3NpdGlvbiA9PiAoe1xuICAgICAgb3JpZ2luWDogY3VycmVudFBvc2l0aW9uLm9yaWdpblgsXG4gICAgICBvcmlnaW5ZOiBjdXJyZW50UG9zaXRpb24ub3JpZ2luWSxcbiAgICAgIG92ZXJsYXlYOiBjdXJyZW50UG9zaXRpb24ub3ZlcmxheVgsXG4gICAgICBvdmVybGF5WTogY3VycmVudFBvc2l0aW9uLm92ZXJsYXlZLFxuICAgICAgb2Zmc2V0WDogY3VycmVudFBvc2l0aW9uLm9mZnNldFggfHwgdGhpcy5vZmZzZXRYLFxuICAgICAgb2Zmc2V0WTogY3VycmVudFBvc2l0aW9uLm9mZnNldFkgfHwgdGhpcy5vZmZzZXRZLFxuICAgICAgcGFuZWxDbGFzczogY3VycmVudFBvc2l0aW9uLnBhbmVsQ2xhc3MgfHwgdW5kZWZpbmVkLFxuICAgIH0pKTtcblxuICAgIHJldHVybiBwb3NpdGlvblN0cmF0ZWd5LnNldE9yaWdpbih0aGlzLl9nZXRGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4oKSlcbiAgICAgICAgLndpdGhQb3NpdGlvbnMocG9zaXRpb25zKVxuICAgICAgICAud2l0aEZsZXhpYmxlRGltZW5zaW9ucyh0aGlzLmZsZXhpYmxlRGltZW5zaW9ucylcbiAgICAgICAgLndpdGhQdXNoKHRoaXMucHVzaClcbiAgICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKHRoaXMuZ3Jvd0FmdGVyT3BlbilcbiAgICAgICAgLndpdGhWaWV3cG9ydE1hcmdpbih0aGlzLnZpZXdwb3J0TWFyZ2luKVxuICAgICAgICAud2l0aExvY2tlZFBvc2l0aW9uKHRoaXMubG9ja1Bvc2l0aW9uKVxuICAgICAgICAud2l0aFRyYW5zZm9ybU9yaWdpbk9uKHRoaXMudHJhbnNmb3JtT3JpZ2luU2VsZWN0b3IpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IG9mIHRoZSBvdmVybGF5IHRvIGJlIHNldCBvbiB0aGUgb3ZlcmxheSBjb25maWcgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlUG9zaXRpb25TdHJhdGVneSgpOiBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5fb3ZlcmxheS5wb3NpdGlvbigpLmZsZXhpYmxlQ29ubmVjdGVkVG8oXG4gICAgICAgIHRoaXMuX2dldEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbigpKTtcbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHN0cmF0ZWd5KTtcbiAgICByZXR1cm4gc3RyYXRlZ3k7XG4gIH1cblxuICBwcml2YXRlIF9nZXRGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4oKTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luIHtcbiAgICBpZiAodGhpcy5vcmlnaW4gaW5zdGFuY2VvZiBDZGtPdmVybGF5T3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcmlnaW4uZWxlbWVudFJlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMub3JpZ2luO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGUgb3ZlcmxheSBhbmQgc3Vic2NyaWJlcyB0byBiYWNrZHJvcCBjbGlja3MgaWYgYmFja2Ryb3AgZXhpc3RzICovXG4gIHByaXZhdGUgX2F0dGFjaE92ZXJsYXkoKSB7XG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9jcmVhdGVPdmVybGF5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgb3ZlcmxheSBzaXplLCBpbiBjYXNlIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgaGF2ZSBjaGFuZ2VkXG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmdldENvbmZpZygpLmhhc0JhY2tkcm9wID0gdGhpcy5oYXNCYWNrZHJvcDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX292ZXJsYXlSZWYuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5hdHRhY2godGhpcy5fdGVtcGxhdGVQb3J0YWwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0JhY2tkcm9wKSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbiA9IHRoaXMuX292ZXJsYXlSZWYuYmFja2Ryb3BDbGljaygpLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgIHRoaXMuYmFja2Ryb3BDbGljay5lbWl0KGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3Bvc2l0aW9uU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG5cbiAgICAvLyBPbmx5IHN1YnNjcmliZSB0byBgcG9zaXRpb25DaGFuZ2VzYCBpZiByZXF1ZXN0ZWQsIGJlY2F1c2UgcHV0dGluZ1xuICAgIC8vIHRvZ2V0aGVyIGFsbCB0aGUgaW5mb3JtYXRpb24gZm9yIGl0IGNhbiBiZSBleHBlbnNpdmUuXG4gICAgaWYgKHRoaXMucG9zaXRpb25DaGFuZ2Uub2JzZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3Vic2NyaXB0aW9uID0gdGhpcy5fcG9zaXRpb24ucG9zaXRpb25DaGFuZ2VzXG4gICAgICAgIC5waXBlKHRha2VXaGlsZSgoKSA9PiB0aGlzLnBvc2l0aW9uQ2hhbmdlLm9ic2VydmVycy5sZW5ndGggPiAwKSlcbiAgICAgICAgLnN1YnNjcmliZShwb3NpdGlvbiA9PiB7XG4gICAgICAgICAgdGhpcy5wb3NpdGlvbkNoYW5nZS5lbWl0KHBvc2l0aW9uKTtcblxuICAgICAgICAgIGlmICh0aGlzLnBvc2l0aW9uQ2hhbmdlLm9ic2VydmVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3Bvc2l0aW9uU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIG92ZXJsYXkgYW5kIHVuc3Vic2NyaWJlcyB0byBiYWNrZHJvcCBjbGlja3MgaWYgYmFja2Ryb3AgZXhpc3RzICovXG4gIHByaXZhdGUgX2RldGFjaE92ZXJsYXkoKSB7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuZGV0YWNoKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wb3NpdGlvblN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2hhc0JhY2tkcm9wOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9sb2NrUG9zaXRpb246IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2ZsZXhpYmxlRGltZW5zaW9uczogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZ3Jvd0FmdGVyT3BlbjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcHVzaDogQm9vbGVhbklucHV0O1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVJfRkFDVE9SWShvdmVybGF5OiBPdmVybGF5KTpcbiAgICAoKSA9PiBSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3kge1xuICByZXR1cm4gKCkgPT4gb3ZlcmxheS5zY3JvbGxTdHJhdGVnaWVzLnJlcG9zaXRpb24oKTtcbn1cblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBjb25zdCBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZX1BST1ZJREVSID0ge1xuICBwcm92aWRlOiBDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZLFxuICBkZXBzOiBbT3ZlcmxheV0sXG4gIHVzZUZhY3Rvcnk6IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVJfRkFDVE9SWSxcbn07XG4iXX0=