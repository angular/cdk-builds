/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { ESCAPE, hasModifierKey } from '@angular/cdk/keycodes';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, EventEmitter, Inject, InjectionToken, Input, Optional, Output, TemplateRef, ViewContainerRef, booleanAttribute, } from '@angular/core';
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
        overlayY: 'top',
    },
    {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
    },
    {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
    },
    {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
    },
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkOverlayOrigin, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkOverlayOrigin, isStandalone: true, selector: "[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]", exportAs: ["cdkOverlayOrigin"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkOverlayOrigin, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]',
                    exportAs: 'cdkOverlayOrigin',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }] });
/**
 * Directive to facilitate declarative creation of an
 * Overlay using a FlexibleConnectedPositionStrategy.
 */
export class CdkConnectedOverlay {
    /** The offset in pixels for the overlay connection point on the x-axis */
    get offsetX() {
        return this._offsetX;
    }
    set offsetX(offsetX) {
        this._offsetX = offsetX;
        if (this._position) {
            this._updatePositionStrategy(this._position);
        }
    }
    /** The offset in pixels for the overlay connection point on the y-axis */
    get offsetY() {
        return this._offsetY;
    }
    set offsetY(offsetY) {
        this._offsetY = offsetY;
        if (this._position) {
            this._updatePositionStrategy(this._position);
        }
    }
    /** Whether the overlay should be disposed of when the user goes backwards/forwards in history. */
    get disposeOnNavigation() {
        return this._disposeOnNavigation;
    }
    set disposeOnNavigation(value) {
        this._disposeOnNavigation = value;
    }
    // TODO(jelbourn): inputs for size, scroll behavior, animation, etc.
    constructor(_overlay, templateRef, viewContainerRef, scrollStrategyFactory, _dir) {
        this._overlay = _overlay;
        this._dir = _dir;
        this._backdropSubscription = Subscription.EMPTY;
        this._attachSubscription = Subscription.EMPTY;
        this._detachSubscription = Subscription.EMPTY;
        this._positionSubscription = Subscription.EMPTY;
        this._disposeOnNavigation = false;
        /** Margin between the overlay and the viewport edges. */
        this.viewportMargin = 0;
        /** Whether the overlay is open. */
        this.open = false;
        /** Whether the overlay can be closed by user interaction. */
        this.disableClose = false;
        /** Whether or not the overlay should attach a backdrop. */
        this.hasBackdrop = false;
        /** Whether or not the overlay should be locked when scrolling. */
        this.lockPosition = false;
        /** Whether the overlay's width and height can be constrained to fit within the viewport. */
        this.flexibleDimensions = false;
        /** Whether the overlay can grow after the initial open when flexible positioning is turned on. */
        this.growAfterOpen = false;
        /** Whether the overlay can be pushed on-screen if none of the provided positions fit. */
        this.push = false;
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
        const overlayRef = (this._overlayRef = this._overlay.create(this._buildConfig()));
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
        const positionStrategy = (this._position =
            this.positionStrategy || this._createPositionStrategy());
        const overlayConfig = new OverlayConfig({
            direction: this._dir,
            positionStrategy,
            scrollStrategy: this.scrollStrategy,
            hasBackdrop: this.hasBackdrop,
            disposeOnNavigation: this.disposeOnNavigation,
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
            .setOrigin(this._getFlexibleConnectedPositionStrategyOrigin())
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
        const strategy = this._overlay
            .position()
            .flexibleConnectedTo(this._getFlexibleConnectedPositionStrategyOrigin());
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkConnectedOverlay, deps: [{ token: i1.Overlay }, { token: i0.TemplateRef }, { token: i0.ViewContainerRef }, { token: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0", type: CdkConnectedOverlay, isStandalone: true, selector: "[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]", inputs: { origin: ["cdkConnectedOverlayOrigin", "origin"], positions: ["cdkConnectedOverlayPositions", "positions"], positionStrategy: ["cdkConnectedOverlayPositionStrategy", "positionStrategy"], offsetX: ["cdkConnectedOverlayOffsetX", "offsetX"], offsetY: ["cdkConnectedOverlayOffsetY", "offsetY"], width: ["cdkConnectedOverlayWidth", "width"], height: ["cdkConnectedOverlayHeight", "height"], minWidth: ["cdkConnectedOverlayMinWidth", "minWidth"], minHeight: ["cdkConnectedOverlayMinHeight", "minHeight"], backdropClass: ["cdkConnectedOverlayBackdropClass", "backdropClass"], panelClass: ["cdkConnectedOverlayPanelClass", "panelClass"], viewportMargin: ["cdkConnectedOverlayViewportMargin", "viewportMargin"], scrollStrategy: ["cdkConnectedOverlayScrollStrategy", "scrollStrategy"], open: ["cdkConnectedOverlayOpen", "open"], disableClose: ["cdkConnectedOverlayDisableClose", "disableClose"], transformOriginSelector: ["cdkConnectedOverlayTransformOriginOn", "transformOriginSelector"], hasBackdrop: ["cdkConnectedOverlayHasBackdrop", "hasBackdrop", booleanAttribute], lockPosition: ["cdkConnectedOverlayLockPosition", "lockPosition", booleanAttribute], flexibleDimensions: ["cdkConnectedOverlayFlexibleDimensions", "flexibleDimensions", booleanAttribute], growAfterOpen: ["cdkConnectedOverlayGrowAfterOpen", "growAfterOpen", booleanAttribute], push: ["cdkConnectedOverlayPush", "push", booleanAttribute], disposeOnNavigation: ["cdkConnectedOverlayDisposeOnNavigation", "disposeOnNavigation", booleanAttribute] }, outputs: { backdropClick: "backdropClick", positionChange: "positionChange", attach: "attach", detach: "detach", overlayKeydown: "overlayKeydown", overlayOutsideClick: "overlayOutsideClick" }, exportAs: ["cdkConnectedOverlay"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkConnectedOverlay, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]',
                    exportAs: 'cdkConnectedOverlay',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i1.Overlay }, { type: i0.TemplateRef }, { type: i0.ViewContainerRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY]
                }] }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }], propDecorators: { origin: [{
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
                args: [{ alias: 'cdkConnectedOverlayHasBackdrop', transform: booleanAttribute }]
            }], lockPosition: [{
                type: Input,
                args: [{ alias: 'cdkConnectedOverlayLockPosition', transform: booleanAttribute }]
            }], flexibleDimensions: [{
                type: Input,
                args: [{ alias: 'cdkConnectedOverlayFlexibleDimensions', transform: booleanAttribute }]
            }], growAfterOpen: [{
                type: Input,
                args: [{ alias: 'cdkConnectedOverlayGrowAfterOpen', transform: booleanAttribute }]
            }], push: [{
                type: Input,
                args: [{ alias: 'cdkConnectedOverlayPush', transform: booleanAttribute }]
            }], disposeOnNavigation: [{
                type: Input,
                args: [{ alias: 'cdkConnectedOverlayDisposeOnNavigation', transform: booleanAttribute }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1kaXJlY3RpdmVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L292ZXJsYXktZGlyZWN0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBRU4sV0FBVyxFQUNYLGdCQUFnQixFQUNoQixnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFHL0MsT0FBTyxFQUVMLGlDQUFpQyxHQUVsQyxNQUFNLGlEQUFpRCxDQUFDOzs7O0FBR3pELG9GQUFvRjtBQUNwRixNQUFNLG1CQUFtQixHQUF3QjtJQUMvQztRQUNFLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLFFBQVEsRUFBRSxLQUFLO0tBQ2hCO0lBQ0Q7UUFDRSxPQUFPLEVBQUUsT0FBTztRQUNoQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLFFBQVEsRUFBRSxRQUFRO0tBQ25CO0lBQ0Q7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O0FBQ3BCLE1BQU0sVUFBVSxzREFBc0QsQ0FDcEUsT0FBZ0I7SUFFaEIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDckQsQ0FBQztBQUVELG9CQUFvQjtBQUNwQixNQUFNLENBQUMsTUFBTSw4Q0FBOEMsR0FBRztJQUM1RCxPQUFPLEVBQUUscUNBQXFDO0lBQzlDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQztJQUNmLFVBQVUsRUFBRSxzREFBc0Q7Q0FDbkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7RVNDQVBFLCBoYXNNb2RpZmllcktleX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7VGVtcGxhdGVQb3J0YWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIGJvb2xlYW5BdHRyaWJ1dGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlV2hpbGV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7T3ZlcmxheX0gZnJvbSAnLi9vdmVybGF5JztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge092ZXJsYXlSZWZ9IGZyb20gJy4vb3ZlcmxheS1yZWYnO1xuaW1wb3J0IHtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25DaGFuZ2V9IGZyb20gJy4vcG9zaXRpb24vY29ubmVjdGVkLXBvc2l0aW9uJztcbmltcG9ydCB7XG4gIENvbm5lY3RlZFBvc2l0aW9uLFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG4gIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbixcbn0gZnJvbSAnLi9wb3NpdGlvbi9mbGV4aWJsZS1jb25uZWN0ZWQtcG9zaXRpb24tc3RyYXRlZ3knO1xuaW1wb3J0IHtSZXBvc2l0aW9uU2Nyb2xsU3RyYXRlZ3ksIFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3Njcm9sbC9pbmRleCc7XG5cbi8qKiBEZWZhdWx0IHNldCBvZiBwb3NpdGlvbnMgZm9yIHRoZSBvdmVybGF5LiBGb2xsb3dzIHRoZSBiZWhhdmlvciBvZiBhIGRyb3Bkb3duLiAqL1xuY29uc3QgZGVmYXVsdFBvc2l0aW9uTGlzdDogQ29ubmVjdGVkUG9zaXRpb25bXSA9IFtcbiAge1xuICAgIG9yaWdpblg6ICdzdGFydCcsXG4gICAgb3JpZ2luWTogJ2JvdHRvbScsXG4gICAgb3ZlcmxheVg6ICdzdGFydCcsXG4gICAgb3ZlcmxheVk6ICd0b3AnLFxuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ3N0YXJ0JyxcbiAgICBvcmlnaW5ZOiAndG9wJyxcbiAgICBvdmVybGF5WDogJ3N0YXJ0JyxcbiAgICBvdmVybGF5WTogJ2JvdHRvbScsXG4gIH0sXG4gIHtcbiAgICBvcmlnaW5YOiAnZW5kJyxcbiAgICBvcmlnaW5ZOiAndG9wJyxcbiAgICBvdmVybGF5WDogJ2VuZCcsXG4gICAgb3ZlcmxheVk6ICdib3R0b20nLFxuICB9LFxuICB7XG4gICAgb3JpZ2luWDogJ2VuZCcsXG4gICAgb3JpZ2luWTogJ2JvdHRvbScsXG4gICAgb3ZlcmxheVg6ICdlbmQnLFxuICAgIG92ZXJsYXlZOiAndG9wJyxcbiAgfSxcbl07XG5cbi8qKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBkZXRlcm1pbmVzIHRoZSBzY3JvbGwgaGFuZGxpbmcgd2hpbGUgdGhlIGNvbm5lY3RlZCBvdmVybGF5IGlzIG9wZW4uICovXG5leHBvcnQgY29uc3QgQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWSA9IG5ldyBJbmplY3Rpb25Ub2tlbjwoKSA9PiBTY3JvbGxTdHJhdGVneT4oXG4gICdjZGstY29ubmVjdGVkLW92ZXJsYXktc2Nyb2xsLXN0cmF0ZWd5Jyxcbik7XG5cbi8qKlxuICogRGlyZWN0aXZlIGFwcGxpZWQgdG8gYW4gZWxlbWVudCB0byBtYWtlIGl0IHVzYWJsZSBhcyBhbiBvcmlnaW4gZm9yIGFuIE92ZXJsYXkgdXNpbmcgYVxuICogQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1vdmVybGF5LW9yaWdpbl0sIFtvdmVybGF5LW9yaWdpbl0sIFtjZGtPdmVybGF5T3JpZ2luXScsXG4gIGV4cG9ydEFzOiAnY2RrT3ZlcmxheU9yaWdpbicsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka092ZXJsYXlPcmlnaW4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAvKiogUmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBkaXJlY3RpdmUgaXMgYXBwbGllZC4gKi9cbiAgICBwdWJsaWMgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgKSB7fVxufVxuXG4vKipcbiAqIERpcmVjdGl2ZSB0byBmYWNpbGl0YXRlIGRlY2xhcmF0aXZlIGNyZWF0aW9uIG9mIGFuXG4gKiBPdmVybGF5IHVzaW5nIGEgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLWNvbm5lY3RlZC1vdmVybGF5XSwgW2Nvbm5lY3RlZC1vdmVybGF5XSwgW2Nka0Nvbm5lY3RlZE92ZXJsYXldJyxcbiAgZXhwb3J0QXM6ICdjZGtDb25uZWN0ZWRPdmVybGF5JyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29ubmVjdGVkT3ZlcmxheSBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgcHJpdmF0ZSBfb3ZlcmxheVJlZjogT3ZlcmxheVJlZjtcbiAgcHJpdmF0ZSBfdGVtcGxhdGVQb3J0YWw6IFRlbXBsYXRlUG9ydGFsO1xuICBwcml2YXRlIF9iYWNrZHJvcFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfYXR0YWNoU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9kZXRhY2hTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX3Bvc2l0aW9uU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9vZmZzZXRYOiBudW1iZXI7XG4gIHByaXZhdGUgX29mZnNldFk6IG51bWJlcjtcbiAgcHJpdmF0ZSBfcG9zaXRpb246IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneTtcbiAgcHJpdmF0ZSBfc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5OiAoKSA9PiBTY3JvbGxTdHJhdGVneTtcbiAgcHJpdmF0ZSBfZGlzcG9zZU9uTmF2aWdhdGlvbiA9IGZhbHNlO1xuXG4gIC8qKiBPcmlnaW4gZm9yIHRoZSBjb25uZWN0ZWQgb3ZlcmxheS4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T3JpZ2luJylcbiAgb3JpZ2luOiBDZGtPdmVybGF5T3JpZ2luIHwgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luO1xuXG4gIC8qKiBSZWdpc3RlcmVkIGNvbm5lY3RlZCBwb3NpdGlvbiBwYWlycy4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25zJykgcG9zaXRpb25zOiBDb25uZWN0ZWRQb3NpdGlvbltdO1xuXG4gIC8qKlxuICAgKiBUaGlzIGlucHV0IG92ZXJyaWRlcyB0aGUgcG9zaXRpb25zIGlucHV0IGlmIHNwZWNpZmllZC4gSXQgbGV0cyB1c2VycyBwYXNzXG4gICAqIGluIGFyYml0cmFyeSBwb3NpdGlvbmluZyBzdHJhdGVnaWVzLlxuICAgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5UG9zaXRpb25TdHJhdGVneScpIHBvc2l0aW9uU3RyYXRlZ3k6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneTtcblxuICAvKiogVGhlIG9mZnNldCBpbiBwaXhlbHMgZm9yIHRoZSBvdmVybGF5IGNvbm5lY3Rpb24gcG9pbnQgb24gdGhlIHgtYXhpcyAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlPZmZzZXRYJylcbiAgZ2V0IG9mZnNldFgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fb2Zmc2V0WDtcbiAgfVxuICBzZXQgb2Zmc2V0WChvZmZzZXRYOiBudW1iZXIpIHtcbiAgICB0aGlzLl9vZmZzZXRYID0gb2Zmc2V0WDtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvbikge1xuICAgICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneSh0aGlzLl9wb3NpdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSBvZmZzZXQgaW4gcGl4ZWxzIGZvciB0aGUgb3ZlcmxheSBjb25uZWN0aW9uIHBvaW50IG9uIHRoZSB5LWF4aXMgKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5T2Zmc2V0WScpXG4gIGdldCBvZmZzZXRZKCkge1xuICAgIHJldHVybiB0aGlzLl9vZmZzZXRZO1xuICB9XG4gIHNldCBvZmZzZXRZKG9mZnNldFk6IG51bWJlcikge1xuICAgIHRoaXMuX29mZnNldFkgPSBvZmZzZXRZO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uKSB7XG4gICAgICB0aGlzLl91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHRoaXMuX3Bvc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvKiogVGhlIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlXaWR0aCcpIHdpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUhlaWdodCcpIGhlaWdodDogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5XaWR0aCcpIG1pbldpZHRoOiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4gaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlNaW5IZWlnaHQnKSBtaW5IZWlnaHQ6IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIGN1c3RvbSBjbGFzcyB0byBiZSBzZXQgb24gdGhlIGJhY2tkcm9wIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheUJhY2tkcm9wQ2xhc3MnKSBiYWNrZHJvcENsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXTtcblxuICAvKiogVGhlIGN1c3RvbSBjbGFzcyB0byBhZGQgdG8gdGhlIG92ZXJsYXkgcGFuZSBlbGVtZW50LiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlQYW5lbENsYXNzJykgcGFuZWxDbGFzczogc3RyaW5nIHwgc3RyaW5nW107XG5cbiAgLyoqIE1hcmdpbiBiZXR3ZWVuIHRoZSBvdmVybGF5IGFuZCB0aGUgdmlld3BvcnQgZWRnZXMuICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVZpZXdwb3J0TWFyZ2luJykgdmlld3BvcnRNYXJnaW46IG51bWJlciA9IDA7XG5cbiAgLyoqIFN0cmF0ZWd5IHRvIGJlIHVzZWQgd2hlbiBoYW5kbGluZyBzY3JvbGwgZXZlbnRzIHdoaWxlIHRoZSBvdmVybGF5IGlzIG9wZW4uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheVNjcm9sbFN0cmF0ZWd5Jykgc2Nyb2xsU3RyYXRlZ3k6IFNjcm9sbFN0cmF0ZWd5O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGlzIG9wZW4uICovXG4gIEBJbnB1dCgnY2RrQ29ubmVjdGVkT3ZlcmxheU9wZW4nKSBvcGVuOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGJlIGNsb3NlZCBieSB1c2VyIGludGVyYWN0aW9uLiAqL1xuICBASW5wdXQoJ2Nka0Nvbm5lY3RlZE92ZXJsYXlEaXNhYmxlQ2xvc2UnKSBkaXNhYmxlQ2xvc2U6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQ1NTIHNlbGVjdG9yIHdoaWNoIHRvIHNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbi4gKi9cbiAgQElucHV0KCdjZGtDb25uZWN0ZWRPdmVybGF5VHJhbnNmb3JtT3JpZ2luT24nKSB0cmFuc2Zvcm1PcmlnaW5TZWxlY3Rvcjogc3RyaW5nO1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgb3ZlcmxheSBzaG91bGQgYXR0YWNoIGEgYmFja2Ryb3AuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtDb25uZWN0ZWRPdmVybGF5SGFzQmFja2Ryb3AnLCB0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBoYXNCYWNrZHJvcDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgb3ZlcmxheSBzaG91bGQgYmUgbG9ja2VkIHdoZW4gc2Nyb2xsaW5nLiAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrQ29ubmVjdGVkT3ZlcmxheUxvY2tQb3NpdGlvbicsIHRyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGxvY2tQb3NpdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5J3Mgd2lkdGggYW5kIGhlaWdodCBjYW4gYmUgY29uc3RyYWluZWQgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnQuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtDb25uZWN0ZWRPdmVybGF5RmxleGlibGVEaW1lbnNpb25zJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZmxleGlibGVEaW1lbnNpb25zOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgY2FuIGdyb3cgYWZ0ZXIgdGhlIGluaXRpYWwgb3BlbiB3aGVuIGZsZXhpYmxlIHBvc2l0aW9uaW5nIGlzIHR1cm5lZCBvbi4gKi9cbiAgQElucHV0KHthbGlhczogJ2Nka0Nvbm5lY3RlZE92ZXJsYXlHcm93QWZ0ZXJPcGVuJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ3Jvd0FmdGVyT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGNhbiBiZSBwdXNoZWQgb24tc2NyZWVuIGlmIG5vbmUgb2YgdGhlIHByb3ZpZGVkIHBvc2l0aW9ucyBmaXQuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtDb25uZWN0ZWRPdmVybGF5UHVzaCcsIHRyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pIHB1c2g6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBzaG91bGQgYmUgZGlzcG9zZWQgb2Ygd2hlbiB0aGUgdXNlciBnb2VzIGJhY2t3YXJkcy9mb3J3YXJkcyBpbiBoaXN0b3J5LiAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrQ29ubmVjdGVkT3ZlcmxheURpc3Bvc2VPbk5hdmlnYXRpb24nLCB0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgZGlzcG9zZU9uTmF2aWdhdGlvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzcG9zZU9uTmF2aWdhdGlvbjtcbiAgfVxuICBzZXQgZGlzcG9zZU9uTmF2aWdhdGlvbih2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc3Bvc2VPbk5hdmlnYXRpb24gPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGJhY2tkcm9wIGlzIGNsaWNrZWQuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBiYWNrZHJvcENsaWNrID0gbmV3IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHBvc2l0aW9uIGhhcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgcG9zaXRpb25DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPENvbm5lY3RlZE92ZXJsYXlQb3NpdGlvbkNoYW5nZT4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGF0dGFjaGVkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgYXR0YWNoID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gZGV0YWNoZWQuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBkZXRhY2ggPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlcmUgYXJlIGtleWJvYXJkIGV2ZW50cyB0aGF0IGFyZSB0YXJnZXRlZCBhdCB0aGUgb3ZlcmxheS4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IG92ZXJsYXlLZXlkb3duID0gbmV3IEV2ZW50RW1pdHRlcjxLZXlib2FyZEV2ZW50PigpO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZXJlIGFyZSBtb3VzZSBvdXRzaWRlIGNsaWNrIGV2ZW50cyB0aGF0IGFyZSB0YXJnZXRlZCBhdCB0aGUgb3ZlcmxheS4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IG92ZXJsYXlPdXRzaWRlQ2xpY2sgPSBuZXcgRXZlbnRFbWl0dGVyPE1vdXNlRXZlbnQ+KCk7XG5cbiAgLy8gVE9ETyhqZWxib3Vybik6IGlucHV0cyBmb3Igc2l6ZSwgc2Nyb2xsIGJlaGF2aW9yLCBhbmltYXRpb24sIGV0Yy5cblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9vdmVybGF5OiBPdmVybGF5LFxuICAgIHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxhbnk+LFxuICAgIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYsXG4gICAgQEluamVjdChDREtfQ09OTkVDVEVEX09WRVJMQVlfU0NST0xMX1NUUkFURUdZKSBzY3JvbGxTdHJhdGVneUZhY3Rvcnk6IGFueSxcbiAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LFxuICApIHtcbiAgICB0aGlzLl90ZW1wbGF0ZVBvcnRhbCA9IG5ldyBUZW1wbGF0ZVBvcnRhbCh0ZW1wbGF0ZVJlZiwgdmlld0NvbnRhaW5lclJlZik7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5ID0gc2Nyb2xsU3RyYXRlZ3lGYWN0b3J5O1xuICAgIHRoaXMuc2Nyb2xsU3RyYXRlZ3kgPSB0aGlzLl9zY3JvbGxTdHJhdGVneUZhY3RvcnkoKTtcbiAgfVxuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBvdmVybGF5IHJlZmVyZW5jZS4gKi9cbiAgZ2V0IG92ZXJsYXlSZWYoKTogT3ZlcmxheVJlZiB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlSZWY7XG4gIH1cblxuICAvKiogVGhlIGVsZW1lbnQncyBsYXlvdXQgZGlyZWN0aW9uLiAqL1xuICBnZXQgZGlyKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RpciA/IHRoaXMuX2Rpci52YWx1ZSA6ICdsdHInO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fYXR0YWNoU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fZGV0YWNoU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9wb3NpdGlvblN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuXG4gICAgaWYgKHRoaXMuX292ZXJsYXlSZWYpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuZGlzcG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAodGhpcy5fcG9zaXRpb24pIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uU3RyYXRlZ3kodGhpcy5fcG9zaXRpb24pO1xuICAgICAgdGhpcy5fb3ZlcmxheVJlZi51cGRhdGVTaXplKHtcbiAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgIG1pbldpZHRoOiB0aGlzLm1pbldpZHRoLFxuICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICBtaW5IZWlnaHQ6IHRoaXMubWluSGVpZ2h0LFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChjaGFuZ2VzWydvcmlnaW4nXSAmJiB0aGlzLm9wZW4pIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb24uYXBwbHkoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlc1snb3BlbiddKSB7XG4gICAgICB0aGlzLm9wZW4gPyB0aGlzLl9hdHRhY2hPdmVybGF5KCkgOiB0aGlzLl9kZXRhY2hPdmVybGF5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENyZWF0ZXMgYW4gb3ZlcmxheSAqL1xuICBwcml2YXRlIF9jcmVhdGVPdmVybGF5KCkge1xuICAgIGlmICghdGhpcy5wb3NpdGlvbnMgfHwgIXRoaXMucG9zaXRpb25zLmxlbmd0aCkge1xuICAgICAgdGhpcy5wb3NpdGlvbnMgPSBkZWZhdWx0UG9zaXRpb25MaXN0O1xuICAgIH1cblxuICAgIGNvbnN0IG92ZXJsYXlSZWYgPSAodGhpcy5fb3ZlcmxheVJlZiA9IHRoaXMuX292ZXJsYXkuY3JlYXRlKHRoaXMuX2J1aWxkQ29uZmlnKCkpKTtcbiAgICB0aGlzLl9hdHRhY2hTdWJzY3JpcHRpb24gPSBvdmVybGF5UmVmLmF0dGFjaG1lbnRzKCkuc3Vic2NyaWJlKCgpID0+IHRoaXMuYXR0YWNoLmVtaXQoKSk7XG4gICAgdGhpcy5fZGV0YWNoU3Vic2NyaXB0aW9uID0gb3ZlcmxheVJlZi5kZXRhY2htZW50cygpLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRldGFjaC5lbWl0KCkpO1xuICAgIG92ZXJsYXlSZWYua2V5ZG93bkV2ZW50cygpLnN1YnNjcmliZSgoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIHRoaXMub3ZlcmxheUtleWRvd24ubmV4dChldmVudCk7XG5cbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBFU0NBUEUgJiYgIXRoaXMuZGlzYWJsZUNsb3NlICYmICFoYXNNb2RpZmllcktleShldmVudCkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5fZGV0YWNoT3ZlcmxheSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fb3ZlcmxheVJlZi5vdXRzaWRlUG9pbnRlckV2ZW50cygpLnN1YnNjcmliZSgoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIHRoaXMub3ZlcmxheU91dHNpZGVDbGljay5uZXh0KGV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBCdWlsZHMgdGhlIG92ZXJsYXkgY29uZmlnIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBpbnB1dHMgKi9cbiAgcHJpdmF0ZSBfYnVpbGRDb25maWcoKTogT3ZlcmxheUNvbmZpZyB7XG4gICAgY29uc3QgcG9zaXRpb25TdHJhdGVneSA9ICh0aGlzLl9wb3NpdGlvbiA9XG4gICAgICB0aGlzLnBvc2l0aW9uU3RyYXRlZ3kgfHwgdGhpcy5fY3JlYXRlUG9zaXRpb25TdHJhdGVneSgpKTtcbiAgICBjb25zdCBvdmVybGF5Q29uZmlnID0gbmV3IE92ZXJsYXlDb25maWcoe1xuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXIsXG4gICAgICBwb3NpdGlvblN0cmF0ZWd5LFxuICAgICAgc2Nyb2xsU3RyYXRlZ3k6IHRoaXMuc2Nyb2xsU3RyYXRlZ3ksXG4gICAgICBoYXNCYWNrZHJvcDogdGhpcy5oYXNCYWNrZHJvcCxcbiAgICAgIGRpc3Bvc2VPbk5hdmlnYXRpb246IHRoaXMuZGlzcG9zZU9uTmF2aWdhdGlvbixcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMud2lkdGggPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcud2lkdGggPSB0aGlzLndpZHRoO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlaWdodCB8fCB0aGlzLmhlaWdodCA9PT0gMCkge1xuICAgICAgb3ZlcmxheUNvbmZpZy5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5XaWR0aCB8fCB0aGlzLm1pbldpZHRoID09PSAwKSB7XG4gICAgICBvdmVybGF5Q29uZmlnLm1pbldpZHRoID0gdGhpcy5taW5XaWR0aDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5taW5IZWlnaHQgfHwgdGhpcy5taW5IZWlnaHQgPT09IDApIHtcbiAgICAgIG92ZXJsYXlDb25maWcubWluSGVpZ2h0ID0gdGhpcy5taW5IZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYmFja2Ryb3BDbGFzcykge1xuICAgICAgb3ZlcmxheUNvbmZpZy5iYWNrZHJvcENsYXNzID0gdGhpcy5iYWNrZHJvcENsYXNzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBhbmVsQ2xhc3MpIHtcbiAgICAgIG92ZXJsYXlDb25maWcucGFuZWxDbGFzcyA9IHRoaXMucGFuZWxDbGFzcztcbiAgICB9XG5cbiAgICByZXR1cm4gb3ZlcmxheUNvbmZpZztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBzdGF0ZSBvZiBhIHBvc2l0aW9uIHN0cmF0ZWd5LCBiYXNlZCBvbiB0aGUgdmFsdWVzIG9mIHRoZSBkaXJlY3RpdmUgaW5wdXRzLiAqL1xuICBwcml2YXRlIF91cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHBvc2l0aW9uU3RyYXRlZ3k6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSkge1xuICAgIGNvbnN0IHBvc2l0aW9uczogQ29ubmVjdGVkUG9zaXRpb25bXSA9IHRoaXMucG9zaXRpb25zLm1hcChjdXJyZW50UG9zaXRpb24gPT4gKHtcbiAgICAgIG9yaWdpblg6IGN1cnJlbnRQb3NpdGlvbi5vcmlnaW5YLFxuICAgICAgb3JpZ2luWTogY3VycmVudFBvc2l0aW9uLm9yaWdpblksXG4gICAgICBvdmVybGF5WDogY3VycmVudFBvc2l0aW9uLm92ZXJsYXlYLFxuICAgICAgb3ZlcmxheVk6IGN1cnJlbnRQb3NpdGlvbi5vdmVybGF5WSxcbiAgICAgIG9mZnNldFg6IGN1cnJlbnRQb3NpdGlvbi5vZmZzZXRYIHx8IHRoaXMub2Zmc2V0WCxcbiAgICAgIG9mZnNldFk6IGN1cnJlbnRQb3NpdGlvbi5vZmZzZXRZIHx8IHRoaXMub2Zmc2V0WSxcbiAgICAgIHBhbmVsQ2xhc3M6IGN1cnJlbnRQb3NpdGlvbi5wYW5lbENsYXNzIHx8IHVuZGVmaW5lZCxcbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcG9zaXRpb25TdHJhdGVneVxuICAgICAgLnNldE9yaWdpbih0aGlzLl9nZXRGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4oKSlcbiAgICAgIC53aXRoUG9zaXRpb25zKHBvc2l0aW9ucylcbiAgICAgIC53aXRoRmxleGlibGVEaW1lbnNpb25zKHRoaXMuZmxleGlibGVEaW1lbnNpb25zKVxuICAgICAgLndpdGhQdXNoKHRoaXMucHVzaClcbiAgICAgIC53aXRoR3Jvd0FmdGVyT3Blbih0aGlzLmdyb3dBZnRlck9wZW4pXG4gICAgICAud2l0aFZpZXdwb3J0TWFyZ2luKHRoaXMudmlld3BvcnRNYXJnaW4pXG4gICAgICAud2l0aExvY2tlZFBvc2l0aW9uKHRoaXMubG9ja1Bvc2l0aW9uKVxuICAgICAgLndpdGhUcmFuc2Zvcm1PcmlnaW5Pbih0aGlzLnRyYW5zZm9ybU9yaWdpblNlbGVjdG9yKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBvZiB0aGUgb3ZlcmxheSB0byBiZSBzZXQgb24gdGhlIG92ZXJsYXkgY29uZmlnICovXG4gIHByaXZhdGUgX2NyZWF0ZVBvc2l0aW9uU3RyYXRlZ3koKTogRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5IHtcbiAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuX292ZXJsYXlcbiAgICAgIC5wb3NpdGlvbigpXG4gICAgICAuZmxleGlibGVDb25uZWN0ZWRUbyh0aGlzLl9nZXRGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3lPcmlnaW4oKSk7XG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb25TdHJhdGVneShzdHJhdGVneSk7XG4gICAgcmV0dXJuIHN0cmF0ZWd5O1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5T3JpZ2luKCk6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbiB7XG4gICAgaWYgKHRoaXMub3JpZ2luIGluc3RhbmNlb2YgQ2RrT3ZlcmxheU9yaWdpbikge1xuICAgICAgcmV0dXJuIHRoaXMub3JpZ2luLmVsZW1lbnRSZWY7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLm9yaWdpbjtcbiAgICB9XG4gIH1cblxuICAvKiogQXR0YWNoZXMgdGhlIG92ZXJsYXkgYW5kIHN1YnNjcmliZXMgdG8gYmFja2Ryb3AgY2xpY2tzIGlmIGJhY2tkcm9wIGV4aXN0cyAqL1xuICBwcml2YXRlIF9hdHRhY2hPdmVybGF5KCkge1xuICAgIGlmICghdGhpcy5fb3ZlcmxheVJlZikge1xuICAgICAgdGhpcy5fY3JlYXRlT3ZlcmxheSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIG92ZXJsYXkgc2l6ZSwgaW4gY2FzZSB0aGUgZGlyZWN0aXZlJ3MgaW5wdXRzIGhhdmUgY2hhbmdlZFxuICAgICAgdGhpcy5fb3ZlcmxheVJlZi5nZXRDb25maWcoKS5oYXNCYWNrZHJvcCA9IHRoaXMuaGFzQmFja2Ryb3A7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9vdmVybGF5UmVmLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHRoaXMuX292ZXJsYXlSZWYuYXR0YWNoKHRoaXMuX3RlbXBsYXRlUG9ydGFsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNCYWNrZHJvcCkge1xuICAgICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24gPSB0aGlzLl9vdmVybGF5UmVmLmJhY2tkcm9wQ2xpY2soKS5zdWJzY3JpYmUoZXZlbnQgPT4ge1xuICAgICAgICB0aGlzLmJhY2tkcm9wQ2xpY2suZW1pdChldmVudCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYmFja2Ryb3BTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wb3NpdGlvblN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuXG4gICAgLy8gT25seSBzdWJzY3JpYmUgdG8gYHBvc2l0aW9uQ2hhbmdlc2AgaWYgcmVxdWVzdGVkLCBiZWNhdXNlIHB1dHRpbmdcbiAgICAvLyB0b2dldGhlciBhbGwgdGhlIGluZm9ybWF0aW9uIGZvciBpdCBjYW4gYmUgZXhwZW5zaXZlLlxuICAgIGlmICh0aGlzLnBvc2l0aW9uQ2hhbmdlLm9ic2VydmVycy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN1YnNjcmlwdGlvbiA9IHRoaXMuX3Bvc2l0aW9uLnBvc2l0aW9uQ2hhbmdlc1xuICAgICAgICAucGlwZSh0YWtlV2hpbGUoKCkgPT4gdGhpcy5wb3NpdGlvbkNoYW5nZS5vYnNlcnZlcnMubGVuZ3RoID4gMCkpXG4gICAgICAgIC5zdWJzY3JpYmUocG9zaXRpb24gPT4ge1xuICAgICAgICAgIHRoaXMucG9zaXRpb25DaGFuZ2UuZW1pdChwb3NpdGlvbik7XG5cbiAgICAgICAgICBpZiAodGhpcy5wb3NpdGlvbkNoYW5nZS5vYnNlcnZlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9wb3NpdGlvblN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBvdmVybGF5IGFuZCB1bnN1YnNjcmliZXMgdG8gYmFja2Ryb3AgY2xpY2tzIGlmIGJhY2tkcm9wIGV4aXN0cyAqL1xuICBwcml2YXRlIF9kZXRhY2hPdmVybGF5KCkge1xuICAgIGlmICh0aGlzLl9vdmVybGF5UmVmKSB7XG4gICAgICB0aGlzLl9vdmVybGF5UmVmLmRldGFjaCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2JhY2tkcm9wU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fcG9zaXRpb25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVJfRkFDVE9SWShcbiAgb3ZlcmxheTogT3ZlcmxheSxcbik6ICgpID0+IFJlcG9zaXRpb25TY3JvbGxTdHJhdGVneSB7XG4gIHJldHVybiAoKSA9PiBvdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpO1xufVxuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuZXhwb3J0IGNvbnN0IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1lfUFJPVklERVIgPSB7XG4gIHByb3ZpZGU6IENES19DT05ORUNURURfT1ZFUkxBWV9TQ1JPTExfU1RSQVRFR1ksXG4gIGRlcHM6IFtPdmVybGF5XSxcbiAgdXNlRmFjdG9yeTogQ0RLX0NPTk5FQ1RFRF9PVkVSTEFZX1NDUk9MTF9TVFJBVEVHWV9QUk9WSURFUl9GQUNUT1JZLFxufTtcbiJdfQ==