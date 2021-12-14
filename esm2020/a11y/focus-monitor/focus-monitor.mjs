/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions, _getShadowRoot, _getEventTarget, } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Inject, Injectable, InjectionToken, NgZone, Optional, Output, } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { coerceElement } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import { InputModalityDetector, TOUCH_BUFFER_MS } from '../input-modality/input-modality-detector';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "../input-modality/input-modality-detector";
/** InjectionToken for FocusMonitorOptions. */
export const FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken('cdk-focus-monitor-default-options');
/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
    passive: true,
    capture: true,
});
/** Monitors mouse and keyboard events to determine the cause of focus events. */
export class FocusMonitor {
    constructor(_ngZone, _platform, _inputModalityDetector, 
    /** @breaking-change 11.0.0 make document required */
    document, options) {
        this._ngZone = _ngZone;
        this._platform = _platform;
        this._inputModalityDetector = _inputModalityDetector;
        /** The focus origin that the next focus event is a result of. */
        this._origin = null;
        /** Whether the window has just been focused. */
        this._windowFocused = false;
        /**
         * Whether the origin was determined via a touch interaction. Necessary as properly attributing
         * focus events to touch interactions requires special logic.
         */
        this._originFromTouchInteraction = false;
        /** Map of elements being monitored to their info. */
        this._elementInfo = new Map();
        /** The number of elements currently being monitored. */
        this._monitoredElementCount = 0;
        /**
         * Keeps track of the root nodes to which we've currently bound a focus/blur handler,
         * as well as the number of monitored elements that they contain. We have to treat focus/blur
         * handlers differently from the rest of the events, because the browser won't emit events
         * to the document when focus moves inside of a shadow root.
         */
        this._rootNodeFocusListenerCount = new Map();
        /**
         * Event listener for `focus` events on the window.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._windowFocusListener = () => {
            // Make a note of when the window regains focus, so we can
            // restore the origin info for the focused element.
            this._windowFocused = true;
            this._windowFocusTimeoutId = setTimeout(() => (this._windowFocused = false));
        };
        /** Subject for stopping our InputModalityDetector subscription. */
        this._stopInputModalityDetector = new Subject();
        /**
         * Event listener for `focus` and 'blur' events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._rootNodeFocusAndBlurListener = (event) => {
            const target = _getEventTarget(event);
            const handler = event.type === 'focus' ? this._onFocus : this._onBlur;
            // We need to walk up the ancestor chain in order to support `checkChildren`.
            for (let element = target; element; element = element.parentElement) {
                handler.call(this, event, element);
            }
        };
        this._document = document;
        this._detectionMode = options?.detectionMode || 0 /* IMMEDIATE */;
    }
    monitor(element, checkChildren = false) {
        const nativeElement = coerceElement(element);
        // Do nothing if we're not on the browser platform or the passed in node isn't an element.
        if (!this._platform.isBrowser || nativeElement.nodeType !== 1) {
            return observableOf(null);
        }
        // If the element is inside the shadow DOM, we need to bind our focus/blur listeners to
        // the shadow root, rather than the `document`, because the browser won't emit focus events
        // to the `document`, if focus is moving within the same shadow root.
        const rootNode = _getShadowRoot(nativeElement) || this._getDocument();
        const cachedInfo = this._elementInfo.get(nativeElement);
        // Check if we're already monitoring this element.
        if (cachedInfo) {
            if (checkChildren) {
                // TODO(COMP-318): this can be problematic, because it'll turn all non-checkChildren
                // observers into ones that behave as if `checkChildren` was turned on. We need a more
                // robust solution.
                cachedInfo.checkChildren = true;
            }
            return cachedInfo.subject;
        }
        // Create monitored element info.
        const info = {
            checkChildren: checkChildren,
            subject: new Subject(),
            rootNode,
        };
        this._elementInfo.set(nativeElement, info);
        this._registerGlobalListeners(info);
        return info.subject;
    }
    stopMonitoring(element) {
        const nativeElement = coerceElement(element);
        const elementInfo = this._elementInfo.get(nativeElement);
        if (elementInfo) {
            elementInfo.subject.complete();
            this._setClasses(nativeElement);
            this._elementInfo.delete(nativeElement);
            this._removeGlobalListeners(elementInfo);
        }
    }
    focusVia(element, origin, options) {
        const nativeElement = coerceElement(element);
        const focusedElement = this._getDocument().activeElement;
        // If the element is focused already, calling `focus` again won't trigger the event listener
        // which means that the focus classes won't be updated. If that's the case, update the classes
        // directly without waiting for an event.
        if (nativeElement === focusedElement) {
            this._getClosestElementsInfo(nativeElement).forEach(([currentElement, info]) => this._originChanged(currentElement, origin, info));
        }
        else {
            this._setOrigin(origin);
            // `focus` isn't available on the server
            if (typeof nativeElement.focus === 'function') {
                nativeElement.focus(options);
            }
        }
    }
    ngOnDestroy() {
        this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
    }
    /** Access injected document if available or fallback to global document reference */
    _getDocument() {
        return this._document || document;
    }
    /** Use defaultView of injected document if available or fallback to global window reference */
    _getWindow() {
        const doc = this._getDocument();
        return doc.defaultView || window;
    }
    _getFocusOrigin(focusEventTarget) {
        if (this._origin) {
            // If the origin was realized via a touch interaction, we need to perform additional checks
            // to determine whether the focus origin should be attributed to touch or program.
            if (this._originFromTouchInteraction) {
                return this._shouldBeAttributedToTouch(focusEventTarget) ? 'touch' : 'program';
            }
            else {
                return this._origin;
            }
        }
        // If the window has just regained focus, we can restore the most recent origin from before the
        // window blurred. Otherwise, we've reached the point where we can't identify the source of the
        // focus. This typically means one of two things happened:
        //
        // 1) The element was programmatically focused, or
        // 2) The element was focused via screen reader navigation (which generally doesn't fire
        //    events).
        //
        // Because we can't distinguish between these two cases, we default to setting `program`.
        return this._windowFocused && this._lastFocusOrigin ? this._lastFocusOrigin : 'program';
    }
    /**
     * Returns whether the focus event should be attributed to touch. Recall that in IMMEDIATE mode, a
     * touch origin isn't immediately reset at the next tick (see _setOrigin). This means that when we
     * handle a focus event following a touch interaction, we need to determine whether (1) the focus
     * event was directly caused by the touch interaction or (2) the focus event was caused by a
     * subsequent programmatic focus call triggered by the touch interaction.
     * @param focusEventTarget The target of the focus event under examination.
     */
    _shouldBeAttributedToTouch(focusEventTarget) {
        // Please note that this check is not perfect. Consider the following edge case:
        //
        // <div #parent tabindex="0">
        //   <div #child tabindex="0" (click)="#parent.focus()"></div>
        // </div>
        //
        // Suppose there is a FocusMonitor in IMMEDIATE mode attached to #parent. When the user touches
        // #child, #parent is programmatically focused. This code will attribute the focus to touch
        // instead of program. This is a relatively minor edge-case that can be worked around by using
        // focusVia(parent, 'program') to focus #parent.
        return (this._detectionMode === 1 /* EVENTUAL */ ||
            !!focusEventTarget?.contains(this._inputModalityDetector._mostRecentTarget));
    }
    /**
     * Sets the focus classes on the element based on the given focus origin.
     * @param element The element to update the classes on.
     * @param origin The focus origin.
     */
    _setClasses(element, origin) {
        element.classList.toggle('cdk-focused', !!origin);
        element.classList.toggle('cdk-touch-focused', origin === 'touch');
        element.classList.toggle('cdk-keyboard-focused', origin === 'keyboard');
        element.classList.toggle('cdk-mouse-focused', origin === 'mouse');
        element.classList.toggle('cdk-program-focused', origin === 'program');
    }
    /**
     * Updates the focus origin. If we're using immediate detection mode, we schedule an async
     * function to clear the origin at the end of a timeout. The duration of the timeout depends on
     * the origin being set.
     * @param origin The origin to set.
     * @param isFromInteraction Whether we are setting the origin from an interaction event.
     */
    _setOrigin(origin, isFromInteraction = false) {
        this._ngZone.runOutsideAngular(() => {
            this._origin = origin;
            this._originFromTouchInteraction = origin === 'touch' && isFromInteraction;
            // If we're in IMMEDIATE mode, reset the origin at the next tick (or in `TOUCH_BUFFER_MS` ms
            // for a touch event). We reset the origin at the next tick because Firefox focuses one tick
            // after the interaction event. We wait `TOUCH_BUFFER_MS` ms before resetting the origin for
            // a touch event because when a touch event is fired, the associated focus event isn't yet in
            // the event queue. Before doing so, clear any pending timeouts.
            if (this._detectionMode === 0 /* IMMEDIATE */) {
                clearTimeout(this._originTimeoutId);
                const ms = this._originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
                this._originTimeoutId = setTimeout(() => (this._origin = null), ms);
            }
        });
    }
    /**
     * Handles focus events on a registered element.
     * @param event The focus event.
     * @param element The monitored element.
     */
    _onFocus(event, element) {
        // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
        // focus event affecting the monitored element. If we want to use the origin of the first event
        // instead we should check for the cdk-focused class here and return if the element already has
        // it. (This only matters for elements that have includesChildren = true).
        // If we are not counting child-element-focus as focused, make sure that the event target is the
        // monitored element itself.
        const elementInfo = this._elementInfo.get(element);
        const focusEventTarget = _getEventTarget(event);
        if (!elementInfo || (!elementInfo.checkChildren && element !== focusEventTarget)) {
            return;
        }
        this._originChanged(element, this._getFocusOrigin(focusEventTarget), elementInfo);
    }
    /**
     * Handles blur events on a registered element.
     * @param event The blur event.
     * @param element The monitored element.
     */
    _onBlur(event, element) {
        // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
        // order to focus another child of the monitored element.
        const elementInfo = this._elementInfo.get(element);
        if (!elementInfo ||
            (elementInfo.checkChildren &&
                event.relatedTarget instanceof Node &&
                element.contains(event.relatedTarget))) {
            return;
        }
        this._setClasses(element);
        this._emitOrigin(elementInfo.subject, null);
    }
    _emitOrigin(subject, origin) {
        this._ngZone.run(() => subject.next(origin));
    }
    _registerGlobalListeners(elementInfo) {
        if (!this._platform.isBrowser) {
            return;
        }
        const rootNode = elementInfo.rootNode;
        const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;
        if (!rootNodeFocusListeners) {
            this._ngZone.runOutsideAngular(() => {
                rootNode.addEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
                rootNode.addEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
            });
        }
        this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);
        // Register global listeners when first element is monitored.
        if (++this._monitoredElementCount === 1) {
            // Note: we listen to events in the capture phase so we
            // can detect them even if the user stops propagation.
            this._ngZone.runOutsideAngular(() => {
                const window = this._getWindow();
                window.addEventListener('focus', this._windowFocusListener);
            });
            // The InputModalityDetector is also just a collection of global listeners.
            this._inputModalityDetector.modalityDetected
                .pipe(takeUntil(this._stopInputModalityDetector))
                .subscribe(modality => {
                this._setOrigin(modality, true /* isFromInteraction */);
            });
        }
    }
    _removeGlobalListeners(elementInfo) {
        const rootNode = elementInfo.rootNode;
        if (this._rootNodeFocusListenerCount.has(rootNode)) {
            const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode);
            if (rootNodeFocusListeners > 1) {
                this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
            }
            else {
                rootNode.removeEventListener('focus', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
                rootNode.removeEventListener('blur', this._rootNodeFocusAndBlurListener, captureEventListenerOptions);
                this._rootNodeFocusListenerCount.delete(rootNode);
            }
        }
        // Unregister global listeners when last element is unmonitored.
        if (!--this._monitoredElementCount) {
            const window = this._getWindow();
            window.removeEventListener('focus', this._windowFocusListener);
            // Equivalently, stop our InputModalityDetector subscription.
            this._stopInputModalityDetector.next();
            // Clear timeouts for all potentially pending timeouts to prevent the leaks.
            clearTimeout(this._windowFocusTimeoutId);
            clearTimeout(this._originTimeoutId);
        }
    }
    /** Updates all the state on an element once its focus origin has changed. */
    _originChanged(element, origin, elementInfo) {
        this._setClasses(element, origin);
        this._emitOrigin(elementInfo.subject, origin);
        this._lastFocusOrigin = origin;
    }
    /**
     * Collects the `MonitoredElementInfo` of a particular element and
     * all of its ancestors that have enabled `checkChildren`.
     * @param element Element from which to start the search.
     */
    _getClosestElementsInfo(element) {
        const results = [];
        this._elementInfo.forEach((info, currentElement) => {
            if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
                results.push([currentElement, info]);
            }
        });
        return results;
    }
}
FocusMonitor.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: FocusMonitor, deps: [{ token: i0.NgZone }, { token: i1.Platform }, { token: i2.InputModalityDetector }, { token: DOCUMENT, optional: true }, { token: FOCUS_MONITOR_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
FocusMonitor.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: FocusMonitor, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: FocusMonitor, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i1.Platform }, { type: i2.InputModalityDetector }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [FOCUS_MONITOR_DEFAULT_OPTIONS]
                }] }]; } });
/**
 * Directive that determines how a particular element was focused (via keyboard, mouse, touch, or
 * programmatically) and adds corresponding classes to the element.
 *
 * There are two variants of this directive:
 * 1) cdkMonitorElementFocus: does not consider an element to be focused if one of its children is
 *    focused.
 * 2) cdkMonitorSubtreeFocus: considers an element focused if it or any of its children are focused.
 */
export class CdkMonitorFocus {
    constructor(_elementRef, _focusMonitor) {
        this._elementRef = _elementRef;
        this._focusMonitor = _focusMonitor;
        this.cdkFocusChange = new EventEmitter();
    }
    ngAfterViewInit() {
        const element = this._elementRef.nativeElement;
        this._monitorSubscription = this._focusMonitor
            .monitor(element, element.nodeType === 1 && element.hasAttribute('cdkMonitorSubtreeFocus'))
            .subscribe(origin => this.cdkFocusChange.emit(origin));
    }
    ngOnDestroy() {
        this._focusMonitor.stopMonitoring(this._elementRef);
        if (this._monitorSubscription) {
            this._monitorSubscription.unsubscribe();
        }
    }
}
CdkMonitorFocus.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkMonitorFocus, deps: [{ token: i0.ElementRef }, { token: FocusMonitor }], target: i0.ɵɵFactoryTarget.Directive });
CdkMonitorFocus.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: CdkMonitorFocus, selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]", outputs: { cdkFocusChange: "cdkFocusChange" }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: CdkMonitorFocus, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: FocusMonitor }]; }, propDecorators: { cdkFocusChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFFBQVEsRUFDUiwrQkFBK0IsRUFDL0IsY0FBYyxFQUNkLGVBQWUsR0FDaEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQzs7OztBQWlDakcsOENBQThDO0FBQzlDLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUFHLElBQUksY0FBYyxDQUM3RCxtQ0FBbUMsQ0FDcEMsQ0FBQztBQVFGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUVILGlGQUFpRjtBQUVqRixNQUFNLE9BQU8sWUFBWTtJQTJEdkIsWUFDVSxPQUFlLEVBQ2YsU0FBbUIsRUFDVixzQkFBNkM7SUFDOUQscURBQXFEO0lBQ3ZCLFFBQW9CLEVB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LENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVwRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDekM7SUFDSCxDQUFDOzs0R0FuQlUsZUFBZSw0Q0FJdUQsWUFBWTtnR0FKbEYsZUFBZTsyRkFBZixlQUFlO2tCQUgzQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvREFBb0Q7aUJBQy9EO21GQUtrRixZQUFZLDBCQUYxRSxjQUFjO3NCQUFoQyxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFBsYXRmb3JtLFxuICBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLFxuICBfZ2V0U2hhZG93Um9vdCxcbiAgX2dldEV2ZW50VGFyZ2V0LFxufSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0lucHV0TW9kYWxpdHlEZXRlY3RvciwgVE9VQ0hfQlVGRkVSX01TfSBmcm9tICcuLi9pbnB1dC1tb2RhbGl0eS9pbnB1dC1tb2RhbGl0eS1kZXRlY3Rvcic7XG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxuLyoqIERldGVjdGlvbiBtb2RlIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1cyBldmVudC4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogQW55IG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCB0aGF0IGhhcHBlbmVkIGluIHRoZSBwcmV2aW91c1xuICAgKiB0aWNrIG9yIHRoZSBjdXJyZW50IHRpY2sgd2lsbCBiZSB1c2VkIHRvIGFzc2lnbiBhIGZvY3VzIGV2ZW50J3Mgb3JpZ2luICh0b1xuICAgKiBlaXRoZXIgbW91c2UsIGtleWJvYXJkLCBvciB0b3VjaCkuIFRoaXMgaXMgdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgKi9cbiAgSU1NRURJQVRFLFxuICAvKipcbiAgICogQSBmb2N1cyBldmVudCdzIG9yaWdpbiBpcyBhbHdheXMgYXR0cmlidXRlZCB0byB0aGUgbGFzdCBjb3JyZXNwb25kaW5nXG4gICAqIG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCwgbm8gbWF0dGVyIGhvdyBsb25nIGFnbyBpdCBvY2N1cnJlZC5cbiAgICovXG4gIEVWRU5UVUFMLFxufVxuXG4vKiogSW5qZWN0YWJsZSBzZXJ2aWNlLWxldmVsIG9wdGlvbnMgZm9yIEZvY3VzTW9uaXRvci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNNb25pdG9yT3B0aW9ucyB7XG4gIGRldGVjdGlvbk1vZGU/OiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xufVxuXG4vKiogSW5qZWN0aW9uVG9rZW4gZm9yIEZvY3VzTW9uaXRvck9wdGlvbnMuICovXG5leHBvcnQgY29uc3QgRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oXG4gICdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnLFxuKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj47XG4gIHJvb3ROb2RlOiBIVE1MRWxlbWVudCB8IFNoYWRvd1Jvb3QgfCBEb2N1bWVudDtcbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlLFxufSk7XG5cbi8qKiBNb25pdG9ycyBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzIHRvIGRldGVybWluZSB0aGUgY2F1c2Ugb2YgZm9jdXMgZXZlbnRzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNNb25pdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBmb2N1cyBvcmlnaW4gdGhhdCB0aGUgbmV4dCBmb2N1cyBldmVudCBpcyBhIHJlc3VsdCBvZi4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgLyoqIFRoZSBGb2N1c09yaWdpbiBvZiB0aGUgbGFzdCBmb2N1cyBldmVudCB0cmFja2VkIGJ5IHRoZSBGb2N1c01vbml0b3IuICovXG4gIHByaXZhdGUgX2xhc3RGb2N1c09yaWdpbjogRm9jdXNPcmlnaW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdpbmRvdyBoYXMganVzdCBiZWVuIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZTtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvcmlnaW4gd2FzIGRldGVybWluZWQgdmlhIGEgdG91Y2ggaW50ZXJhY3Rpb24uIE5lY2Vzc2FyeSBhcyBwcm9wZXJseSBhdHRyaWJ1dGluZ1xuICAgKiBmb2N1cyBldmVudHMgdG8gdG91Y2ggaW50ZXJhY3Rpb25zIHJlcXVpcmVzIHNwZWNpYWwgbG9naWMuXG4gICAqL1xuICBwcml2YXRlIF9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA9IGZhbHNlO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHJvb3Qgbm9kZXMgdG8gd2hpY2ggd2UndmUgY3VycmVudGx5IGJvdW5kIGEgZm9jdXMvYmx1ciBoYW5kbGVyLFxuICAgKiBhcyB3ZWxsIGFzIHRoZSBudW1iZXIgb2YgbW9uaXRvcmVkIGVsZW1lbnRzIHRoYXQgdGhleSBjb250YWluLiBXZSBoYXZlIHRvIHRyZWF0IGZvY3VzL2JsdXJcbiAgICogaGFuZGxlcnMgZGlmZmVyZW50bHkgZnJvbSB0aGUgcmVzdCBvZiB0aGUgZXZlbnRzLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZXZlbnRzXG4gICAqIHRvIHRoZSBkb2N1bWVudCB3aGVuIGZvY3VzIG1vdmVzIGluc2lkZSBvZiBhIHNoYWRvdyByb290LlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQgPSBuZXcgTWFwPEhUTUxFbGVtZW50IHwgRG9jdW1lbnQgfCBTaGFkb3dSb290LCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gKHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZSkpO1xuICB9O1xuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgLyoqIFN1YmplY3QgZm9yIHN0b3BwaW5nIG91ciBJbnB1dE1vZGFsaXR5RGV0ZWN0b3Igc3Vic2NyaXB0aW9uLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zdG9wSW5wdXRNb2RhbGl0eURldGVjdG9yID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgcHJpdmF0ZSByZWFkb25seSBfaW5wdXRNb2RhbGl0eURldGVjdG9yOiBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IsXG4gICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIG1ha2UgZG9jdW1lbnQgcmVxdWlyZWQgKi9cbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55IHwgbnVsbCxcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TKSBvcHRpb25zOiBGb2N1c01vbml0b3JPcHRpb25zIHwgbnVsbCxcbiAgKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLl9kZXRlY3Rpb25Nb2RlID0gb3B0aW9ucz8uZGV0ZWN0aW9uTW9kZSB8fCBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURTtcbiAgfVxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgYW5kICdibHVyJyBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudD4oZXZlbnQpO1xuICAgIGNvbnN0IGhhbmRsZXIgPSBldmVudC50eXBlID09PSAnZm9jdXMnID8gdGhpcy5fb25Gb2N1cyA6IHRoaXMuX29uQmx1cjtcblxuICAgIC8vIFdlIG5lZWQgdG8gd2FsayB1cCB0aGUgYW5jZXN0b3IgY2hhaW4gaW4gb3JkZXIgdG8gc3VwcG9ydCBgY2hlY2tDaGlsZHJlbmAuXG4gICAgZm9yIChsZXQgZWxlbWVudCA9IHRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50IGFzIEZvY3VzRXZlbnQsIGVsZW1lbnQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIG1vbml0b3IoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBjaGVja0NoaWxkcmVuOiBib29sZWFuID0gZmFsc2UsXG4gICk6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgd2UncmUgbm90IG9uIHRoZSBicm93c2VyIHBsYXRmb3JtIG9yIHRoZSBwYXNzZWQgaW4gbm9kZSBpc24ndCBhbiBlbGVtZW50LlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyIHx8IG5hdGl2ZUVsZW1lbnQubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobnVsbCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIHRoZSBzaGFkb3cgRE9NLCB3ZSBuZWVkIHRvIGJpbmQgb3VyIGZvY3VzL2JsdXIgbGlzdGVuZXJzIHRvXG4gICAgLy8gdGhlIHNoYWRvdyByb290LCByYXRoZXIgdGhhbiB0aGUgYGRvY3VtZW50YCwgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGZvY3VzIGV2ZW50c1xuICAgIC8vIHRvIHRoZSBgZG9jdW1lbnRgLCBpZiBmb2N1cyBpcyBtb3Zpbmcgd2l0aGluIHRoZSBzYW1lIHNoYWRvdyByb290LlxuICAgIGNvbnN0IHJvb3ROb2RlID0gX2dldFNoYWRvd1Jvb3QobmF0aXZlRWxlbWVudCkgfHwgdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICBjb25zdCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAoY2FjaGVkSW5mbykge1xuICAgICAgaWYgKGNoZWNrQ2hpbGRyZW4pIHtcbiAgICAgICAgLy8gVE9ETyhDT01QLTMxOCk6IHRoaXMgY2FuIGJlIHByb2JsZW1hdGljLCBiZWNhdXNlIGl0J2xsIHR1cm4gYWxsIG5vbi1jaGVja0NoaWxkcmVuXG4gICAgICAgIC8vIG9ic2VydmVycyBpbnRvIG9uZXMgdGhhdCBiZWhhdmUgYXMgaWYgYGNoZWNrQ2hpbGRyZW5gIHdhcyB0dXJuZWQgb24uIFdlIG5lZWQgYSBtb3JlXG4gICAgICAgIC8vIHJvYnVzdCBzb2x1dGlvbi5cbiAgICAgICAgY2FjaGVkSW5mby5jaGVja0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZEluZm8uc3ViamVjdDtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBjb25zdCBpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgICAgIGNoZWNrQ2hpbGRyZW46IGNoZWNrQ2hpbGRyZW4sXG4gICAgICBzdWJqZWN0OiBuZXcgU3ViamVjdDxGb2N1c09yaWdpbj4oKSxcbiAgICAgIHJvb3ROb2RlLFxuICAgIH07XG4gICAgdGhpcy5fZWxlbWVudEluZm8uc2V0KG5hdGl2ZUVsZW1lbnQsIGluZm8pO1xuICAgIHRoaXMuX3JlZ2lzdGVyR2xvYmFsTGlzdGVuZXJzKGluZm8pO1xuXG4gICAgcmV0dXJuIGluZm8uc3ViamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICBlbGVtZW50SW5mby5zdWJqZWN0LmNvbXBsZXRlKCk7XG5cbiAgICAgIHRoaXMuX3NldENsYXNzZXMobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9lbGVtZW50SW5mby5kZWxldGUobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIGZvY3VzVmlhKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICBvcHRpb25zPzogRm9jdXNPcHRpb25zLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IHRoaXMuX2dldERvY3VtZW50KCkuYWN0aXZlRWxlbWVudDtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGZvY3VzZWQgYWxyZWFkeSwgY2FsbGluZyBgZm9jdXNgIGFnYWluIHdvbid0IHRyaWdnZXIgdGhlIGV2ZW50IGxpc3RlbmVyXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhhdCB0aGUgZm9jdXMgY2xhc3NlcyB3b24ndCBiZSB1cGRhdGVkLiBJZiB0aGF0J3MgdGhlIGNhc2UsIHVwZGF0ZSB0aGUgY2xhc3Nlc1xuICAgIC8vIGRpcmVjdGx5IHdpdGhvdXQgd2FpdGluZyBmb3IgYW4gZXZlbnQuXG4gICAgaWYgKG5hdGl2ZUVsZW1lbnQgPT09IGZvY3VzZWRFbGVtZW50KSB7XG4gICAgICB0aGlzLl9nZXRDbG9zZXN0RWxlbWVudHNJbmZvKG5hdGl2ZUVsZW1lbnQpLmZvckVhY2goKFtjdXJyZW50RWxlbWVudCwgaW5mb10pID0+XG4gICAgICAgIHRoaXMuX29yaWdpbkNoYW5nZWQoY3VycmVudEVsZW1lbnQsIG9yaWdpbiwgaW5mbyksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZXRPcmlnaW4ob3JpZ2luKTtcblxuICAgICAgLy8gYGZvY3VzYCBpc24ndCBhdmFpbGFibGUgb24gdGhlIHNlcnZlclxuICAgICAgaWYgKHR5cGVvZiBuYXRpdmVFbGVtZW50LmZvY3VzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG5hdGl2ZUVsZW1lbnQuZm9jdXMob3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoX2luZm8sIGVsZW1lbnQpID0+IHRoaXMuc3RvcE1vbml0b3JpbmcoZWxlbWVudCkpO1xuICB9XG5cbiAgLyoqIEFjY2VzcyBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIGRvY3VtZW50IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXREb2N1bWVudCgpOiBEb2N1bWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvY3VtZW50IHx8IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqIFVzZSBkZWZhdWx0VmlldyBvZiBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIHdpbmRvdyByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0V2luZG93KCk6IFdpbmRvdyB7XG4gICAgY29uc3QgZG9jID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICByZXR1cm4gZG9jLmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgfVxuXG4gIHByaXZhdGUgX2dldEZvY3VzT3JpZ2luKGZvY3VzRXZlbnRUYXJnZXQ6IEhUTUxFbGVtZW50IHwgbnVsbCk6IEZvY3VzT3JpZ2luIHtcbiAgICBpZiAodGhpcy5fb3JpZ2luKSB7XG4gICAgICAvLyBJZiB0aGUgb3JpZ2luIHdhcyByZWFsaXplZCB2aWEgYSB0b3VjaCBpbnRlcmFjdGlvbiwgd2UgbmVlZCB0byBwZXJmb3JtIGFkZGl0aW9uYWwgY2hlY2tzXG4gICAgICAvLyB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgZm9jdXMgb3JpZ2luIHNob3VsZCBiZSBhdHRyaWJ1dGVkIHRvIHRvdWNoIG9yIHByb2dyYW0uXG4gICAgICBpZiAodGhpcy5fb3JpZ2luRnJvbVRvdWNoSW50ZXJhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Nob3VsZEJlQXR0cmlidXRlZFRvVG91Y2goZm9jdXNFdmVudFRhcmdldCkgPyAndG91Y2gnIDogJ3Byb2dyYW0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29yaWdpbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgd2luZG93IGhhcyBqdXN0IHJlZ2FpbmVkIGZvY3VzLCB3ZSBjYW4gcmVzdG9yZSB0aGUgbW9zdCByZWNlbnQgb3JpZ2luIGZyb20gYmVmb3JlIHRoZVxuICAgIC8vIHdpbmRvdyBibHVycmVkLiBPdGhlcndpc2UsIHdlJ3ZlIHJlYWNoZWQgdGhlIHBvaW50IHdoZXJlIHdlIGNhbid0IGlkZW50aWZ5IHRoZSBzb3VyY2Ugb2YgdGhlXG4gICAgLy8gZm9jdXMuIFRoaXMgdHlwaWNhbGx5IG1lYW5zIG9uZSBvZiB0d28gdGhpbmdzIGhhcHBlbmVkOlxuICAgIC8vXG4gICAgLy8gMSkgVGhlIGVsZW1lbnQgd2FzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCwgb3JcbiAgICAvLyAyKSBUaGUgZWxlbWVudCB3YXMgZm9jdXNlZCB2aWEgc2NyZWVuIHJlYWRlciBuYXZpZ2F0aW9uICh3aGljaCBnZW5lcmFsbHkgZG9lc24ndCBmaXJlXG4gICAgLy8gICAgZXZlbnRzKS5cbiAgICAvL1xuICAgIC8vIEJlY2F1c2Ugd2UgY2FuJ3QgZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVzZSB0d28gY2FzZXMsIHdlIGRlZmF1bHQgdG8gc2V0dGluZyBgcHJvZ3JhbWAuXG4gICAgcmV0dXJuIHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luID8gdGhpcy5fbGFzdEZvY3VzT3JpZ2luIDogJ3Byb2dyYW0nO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgZm9jdXMgZXZlbnQgc2hvdWxkIGJlIGF0dHJpYnV0ZWQgdG8gdG91Y2guIFJlY2FsbCB0aGF0IGluIElNTUVESUFURSBtb2RlLCBhXG4gICAqIHRvdWNoIG9yaWdpbiBpc24ndCBpbW1lZGlhdGVseSByZXNldCBhdCB0aGUgbmV4dCB0aWNrIChzZWUgX3NldE9yaWdpbikuIFRoaXMgbWVhbnMgdGhhdCB3aGVuIHdlXG4gICAqIGhhbmRsZSBhIGZvY3VzIGV2ZW50IGZvbGxvd2luZyBhIHRvdWNoIGludGVyYWN0aW9uLCB3ZSBuZWVkIHRvIGRldGVybWluZSB3aGV0aGVyICgxKSB0aGUgZm9jdXNcbiAgICogZXZlbnQgd2FzIGRpcmVjdGx5IGNhdXNlZCBieSB0aGUgdG91Y2ggaW50ZXJhY3Rpb24gb3IgKDIpIHRoZSBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGFcbiAgICogc3Vic2VxdWVudCBwcm9ncmFtbWF0aWMgZm9jdXMgY2FsbCB0cmlnZ2VyZWQgYnkgdGhlIHRvdWNoIGludGVyYWN0aW9uLlxuICAgKiBAcGFyYW0gZm9jdXNFdmVudFRhcmdldCBUaGUgdGFyZ2V0IG9mIHRoZSBmb2N1cyBldmVudCB1bmRlciBleGFtaW5hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEJlQXR0cmlidXRlZFRvVG91Y2goZm9jdXNFdmVudFRhcmdldDogSFRNTEVsZW1lbnQgfCBudWxsKTogYm9vbGVhbiB7XG4gICAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGNoZWNrIGlzIG5vdCBwZXJmZWN0LiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGVkZ2UgY2FzZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIj5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIHRhYmluZGV4PVwiMFwiIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIFN1cHBvc2UgdGhlcmUgaXMgYSBGb2N1c01vbml0b3IgaW4gSU1NRURJQVRFIG1vZGUgYXR0YWNoZWQgdG8gI3BhcmVudC4gV2hlbiB0aGUgdXNlciB0b3VjaGVzXG4gICAgLy8gI2NoaWxkLCAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZC4gVGhpcyBjb2RlIHdpbGwgYXR0cmlidXRlIHRoZSBmb2N1cyB0byB0b3VjaFxuICAgIC8vIGluc3RlYWQgb2YgcHJvZ3JhbS4gVGhpcyBpcyBhIHJlbGF0aXZlbHkgbWlub3IgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnQsICdwcm9ncmFtJykgdG8gZm9jdXMgI3BhcmVudC5cbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9PT0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5FVkVOVFVBTCB8fFxuICAgICAgISFmb2N1c0V2ZW50VGFyZ2V0Py5jb250YWlucyh0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IuX21vc3RSZWNlbnRUYXJnZXQpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2Nkay1mb2N1c2VkJywgISFvcmlnaW4pO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLXRvdWNoLWZvY3VzZWQnLCBvcmlnaW4gPT09ICd0b3VjaCcpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLW1vdXNlLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdtb3VzZScpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLXByb2dyYW0tZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3Byb2dyYW0nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBmb2N1cyBvcmlnaW4uIElmIHdlJ3JlIHVzaW5nIGltbWVkaWF0ZSBkZXRlY3Rpb24gbW9kZSwgd2Ugc2NoZWR1bGUgYW4gYXN5bmNcbiAgICogZnVuY3Rpb24gdG8gY2xlYXIgdGhlIG9yaWdpbiBhdCB0aGUgZW5kIG9mIGEgdGltZW91dC4gVGhlIGR1cmF0aW9uIG9mIHRoZSB0aW1lb3V0IGRlcGVuZHMgb25cbiAgICogdGhlIG9yaWdpbiBiZWluZyBzZXQuXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIG9yaWdpbiB0byBzZXQuXG4gICAqIEBwYXJhbSBpc0Zyb21JbnRlcmFjdGlvbiBXaGV0aGVyIHdlIGFyZSBzZXR0aW5nIHRoZSBvcmlnaW4gZnJvbSBhbiBpbnRlcmFjdGlvbiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgX3NldE9yaWdpbihvcmlnaW46IEZvY3VzT3JpZ2luLCBpc0Zyb21JbnRlcmFjdGlvbiA9IGZhbHNlKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICAgIHRoaXMuX29yaWdpbkZyb21Ub3VjaEludGVyYWN0aW9uID0gb3JpZ2luID09PSAndG91Y2gnICYmIGlzRnJvbUludGVyYWN0aW9uO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBpbiBJTU1FRElBVEUgbW9kZSwgcmVzZXQgdGhlIG9yaWdpbiBhdCB0aGUgbmV4dCB0aWNrIChvciBpbiBgVE9VQ0hfQlVGRkVSX01TYCBtc1xuICAgICAgLy8gZm9yIGEgdG91Y2ggZXZlbnQpLiBXZSByZXNldCB0aGUgb3JpZ2luIGF0IHRoZSBuZXh0IHRpY2sgYmVjYXVzZSBGaXJlZm94IGZvY3VzZXMgb25lIHRpY2tcbiAgICAgIC8vIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudC4gV2Ugd2FpdCBgVE9VQ0hfQlVGRkVSX01TYCBtcyBiZWZvcmUgcmVzZXR0aW5nIHRoZSBvcmlnaW4gZm9yXG4gICAgICAvLyBhIHRvdWNoIGV2ZW50IGJlY2F1c2Ugd2hlbiBhIHRvdWNoIGV2ZW50IGlzIGZpcmVkLCB0aGUgYXNzb2NpYXRlZCBmb2N1cyBldmVudCBpc24ndCB5ZXQgaW5cbiAgICAgIC8vIHRoZSBldmVudCBxdWV1ZS4gQmVmb3JlIGRvaW5nIHNvLCBjbGVhciBhbnkgcGVuZGluZyB0aW1lb3V0cy5cbiAgICAgIGlmICh0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICAgICAgY29uc3QgbXMgPSB0aGlzLl9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA/IFRPVUNIX0JVRkZFUl9NUyA6IDE7XG4gICAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gKHRoaXMuX29yaWdpbiA9IG51bGwpLCBtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmb2N1cyBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX29uRm9jdXMoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gTk9URShtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBzZXQgdGhlIGNsYXNzZXMgYmFzZWQgb24gdGhlIGZvY3VzIG9yaWdpbiBvZiB0aGUgbW9zdCByZWNlbnRcbiAgICAvLyBmb2N1cyBldmVudCBhZmZlY3RpbmcgdGhlIG1vbml0b3JlZCBlbGVtZW50LiBJZiB3ZSB3YW50IHRvIHVzZSB0aGUgb3JpZ2luIG9mIHRoZSBmaXJzdCBldmVudFxuICAgIC8vIGluc3RlYWQgd2Ugc2hvdWxkIGNoZWNrIGZvciB0aGUgY2RrLWZvY3VzZWQgY2xhc3MgaGVyZSBhbmQgcmV0dXJuIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzXG4gICAgLy8gaXQuIChUaGlzIG9ubHkgbWF0dGVycyBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGluY2x1ZGVzQ2hpbGRyZW4gPSB0cnVlKS5cblxuICAgIC8vIElmIHdlIGFyZSBub3QgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB0aGUgZXZlbnQgdGFyZ2V0IGlzIHRoZVxuICAgIC8vIG1vbml0b3JlZCBlbGVtZW50IGl0c2VsZi5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcbiAgICBjb25zdCBmb2N1c0V2ZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0PEhUTUxFbGVtZW50PihldmVudCk7XG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoIWVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZWxlbWVudCAhPT0gZm9jdXNFdmVudFRhcmdldCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vcmlnaW5DaGFuZ2VkKGVsZW1lbnQsIHRoaXMuX2dldEZvY3VzT3JpZ2luKGZvY3VzRXZlbnRUYXJnZXQpLCBlbGVtZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBibHVyIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBibHVyIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBfb25CbHVyKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHdlIGFyZSBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZW4ndCBqdXN0IGJsdXJyaW5nIGluXG4gICAgLy8gb3JkZXIgdG8gZm9jdXMgYW5vdGhlciBjaGlsZCBvZiB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoXG4gICAgICAhZWxlbWVudEluZm8gfHxcbiAgICAgIChlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmXG4gICAgICAgIGV2ZW50LnJlbGF0ZWRUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIGVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50KTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdE9yaWdpbihzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPiwgb3JpZ2luOiBGb2N1c09yaWdpbikge1xuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gc3ViamVjdC5uZXh0KG9yaWdpbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVnaXN0ZXJHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnRJbmZvLnJvb3ROb2RlO1xuICAgIGNvbnN0IHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPSB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5nZXQocm9vdE5vZGUpIHx8IDA7XG5cbiAgICBpZiAoIXJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ2ZvY3VzJyxcbiAgICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAnYmx1cicsXG4gICAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgKyAxKTtcblxuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT09IDEpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFRoZSBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IgaXMgYWxzbyBqdXN0IGEgY29sbGVjdGlvbiBvZiBnbG9iYWwgbGlzdGVuZXJzLlxuICAgICAgdGhpcy5faW5wdXRNb2RhbGl0eURldGVjdG9yLm1vZGFsaXR5RGV0ZWN0ZWRcbiAgICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX3N0b3BJbnB1dE1vZGFsaXR5RGV0ZWN0b3IpKVxuICAgICAgICAuc3Vic2NyaWJlKG1vZGFsaXR5ID0+IHtcbiAgICAgICAgICB0aGlzLl9zZXRPcmlnaW4obW9kYWxpdHksIHRydWUgLyogaXNGcm9tSW50ZXJhY3Rpb24gKi8pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcblxuICAgIGlmICh0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5oYXMocm9vdE5vZGUpKSB7XG4gICAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSE7XG5cbiAgICAgIGlmIChyb290Tm9kZUZvY3VzTGlzdGVuZXJzID4gMSkge1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgLSAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ2ZvY3VzJyxcbiAgICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgICAgcm9vdE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAnYmx1cicsXG4gICAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmRlbGV0ZShyb290Tm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVW5yZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gbGFzdCBlbGVtZW50IGlzIHVubW9uaXRvcmVkLlxuICAgIGlmICghLS10aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQpIHtcbiAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG5cbiAgICAgIC8vIEVxdWl2YWxlbnRseSwgc3RvcCBvdXIgSW5wdXRNb2RhbGl0eURldGVjdG9yIHN1YnNjcmlwdGlvbi5cbiAgICAgIHRoaXMuX3N0b3BJbnB1dE1vZGFsaXR5RGV0ZWN0b3IubmV4dCgpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX29yaWdpblRpbWVvdXRJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZXMgYWxsIHRoZSBzdGF0ZSBvbiBhbiBlbGVtZW50IG9uY2UgaXRzIGZvY3VzIG9yaWdpbiBoYXMgY2hhbmdlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luQ2hhbmdlZChcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgIGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyxcbiAgKSB7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgdGhlIGBNb25pdG9yZWRFbGVtZW50SW5mb2Agb2YgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgYW5kXG4gICAqIGFsbCBvZiBpdHMgYW5jZXN0b3JzIHRoYXQgaGF2ZSBlbmFibGVkIGBjaGVja0NoaWxkcmVuYC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmcm9tIHdoaWNoIHRvIHN0YXJ0IHRoZSBzZWFyY2guXG4gICAqL1xuICBwcml2YXRlIF9nZXRDbG9zZXN0RWxlbWVudHNJbmZvKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSB7XG4gICAgY29uc3QgcmVzdWx0czogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSA9IFtdO1xuXG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoaW5mbywgY3VycmVudEVsZW1lbnQpID0+IHtcbiAgICAgIGlmIChjdXJyZW50RWxlbWVudCA9PT0gZWxlbWVudCB8fCAoaW5mby5jaGVja0NoaWxkcmVuICYmIGN1cnJlbnRFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnQpKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goW2N1cnJlbnRFbGVtZW50LCBpbmZvXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcikge31cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yXG4gICAgICAubW9uaXRvcihlbGVtZW50LCBlbGVtZW50Lm5vZGVUeXBlID09PSAxICYmIGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB0aGlzLmNka0ZvY3VzQ2hhbmdlLmVtaXQob3JpZ2luKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9mb2N1c01vbml0b3Iuc3RvcE1vbml0b3JpbmcodGhpcy5fZWxlbWVudFJlZik7XG5cbiAgICBpZiAodGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuIl19