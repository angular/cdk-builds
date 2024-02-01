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
            this._windowFocusTimeoutId = window.setTimeout(() => (this._windowFocused = false));
        };
        /** Subject for stopping our InputModalityDetector subscription. */
        this._stopInputModalityDetector = new Subject();
        /**
         * Event listener for `focus` and 'blur' events on the document.
         * Needs to be an arrow function in order to preserve the context when it gets bound.
         */
        this._rootNodeFocusAndBlurListener = (event) => {
            const target = _getEventTarget(event);
            // We need to walk up the ancestor chain in order to support `checkChildren`.
            for (let element = target; element; element = element.parentElement) {
                if (event.type === 'focus') {
                    this._onFocus(event, element);
                }
                else {
                    this._onBlur(event, element);
                }
            }
        };
        this._document = document;
        this._detectionMode = options?.detectionMode || 0 /* FocusMonitorDetectionMode.IMMEDIATE */;
    }
    monitor(element, checkChildren = false) {
        const nativeElement = coerceElement(element);
        // Do nothing if we're not on the browser platform or the passed in node isn't an element.
        if (!this._platform.isBrowser || nativeElement.nodeType !== 1) {
            // Note: we don't want the observable to emit at all so we don't pass any parameters.
            return observableOf();
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
        if (this._windowFocused && this._lastFocusOrigin) {
            return this._lastFocusOrigin;
        }
        // If the interaction is coming from an input label, we consider it a mouse interactions.
        // This is a special case where focus moves on `click`, rather than `mousedown` which breaks
        // our detection, because all our assumptions are for `mousedown`. We need to handle this
        // special case, because it's very common for checkboxes and radio buttons.
        if (focusEventTarget && this._isLastInteractionFromInputLabel(focusEventTarget)) {
            return 'mouse';
        }
        return 'program';
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
        return (this._detectionMode === 1 /* FocusMonitorDetectionMode.EVENTUAL */ ||
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
            if (this._detectionMode === 0 /* FocusMonitorDetectionMode.IMMEDIATE */) {
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
        this._emitOrigin(elementInfo, null);
    }
    _emitOrigin(info, origin) {
        if (info.subject.observers.length) {
            this._ngZone.run(() => info.subject.next(origin));
        }
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
        this._emitOrigin(elementInfo, origin);
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
    /**
     * Returns whether an interaction is likely to have come from the user clicking the `label` of
     * an `input` or `textarea` in order to focus it.
     * @param focusEventTarget Target currently receiving focus.
     */
    _isLastInteractionFromInputLabel(focusEventTarget) {
        const { _mostRecentTarget: mostRecentTarget, mostRecentModality } = this._inputModalityDetector;
        // If the last interaction used the mouse on an element contained by one of the labels
        // of an `input`/`textarea` that is currently focused, it is very likely that the
        // user redirected focus using the label.
        if (mostRecentModality !== 'mouse' ||
            !mostRecentTarget ||
            mostRecentTarget === focusEventTarget ||
            (focusEventTarget.nodeName !== 'INPUT' && focusEventTarget.nodeName !== 'TEXTAREA') ||
            focusEventTarget.disabled) {
            return false;
        }
        const labels = focusEventTarget.labels;
        if (labels) {
            for (let i = 0; i < labels.length; i++) {
                if (labels[i].contains(mostRecentTarget)) {
                    return true;
                }
            }
        }
        return false;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: FocusMonitor, deps: [{ token: i0.NgZone }, { token: i1.Platform }, { token: i2.InputModalityDetector }, { token: DOCUMENT, optional: true }, { token: FOCUS_MONITOR_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: FocusMonitor, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: FocusMonitor, decorators: [{
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
        this._focusOrigin = null;
        this.cdkFocusChange = new EventEmitter();
    }
    get focusOrigin() {
        return this._focusOrigin;
    }
    ngAfterViewInit() {
        const element = this._elementRef.nativeElement;
        this._monitorSubscription = this._focusMonitor
            .monitor(element, element.nodeType === 1 && element.hasAttribute('cdkMonitorSubtreeFocus'))
            .subscribe(origin => {
            this._focusOrigin = origin;
            this.cdkFocusChange.emit(origin);
        });
    }
    ngOnDestroy() {
        this._focusMonitor.stopMonitoring(this._elementRef);
        if (this._monitorSubscription) {
            this._monitorSubscription.unsubscribe();
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkMonitorFocus, deps: [{ token: i0.ElementRef }, { token: FocusMonitor }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: CdkMonitorFocus, selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]", outputs: { cdkFocusChange: "cdkFocusChange" }, exportAs: ["cdkMonitorFocus"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkMonitorFocus, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
                    exportAs: 'cdkMonitorFocus',
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: FocusMonitor }]; }, propDecorators: { cdkFocusChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFFBQVEsRUFDUiwrQkFBK0IsRUFDL0IsY0FBYyxFQUNkLGVBQWUsR0FDaEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQzs7OztBQWlDakcsOENBQThDO0FBQzlDLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUFHLElBQUksY0FBYyxDQUM3RCxtQ0FBbUMsQ0FDcEMsQ0FBQztBQVFGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUVILGlGQUFpRjtBQUVqRixNQUFNLE9BQU8sWUFBWTtJQTJEdkIsWUFDVSxPQUFlLEVBQ2YsU0FBbUIsRUFDVixzQkFBNkM7SUFDOUQscURBQXFEO0lBQ3ZCLFFBQW9CLEVB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LENBQUM7WUFDM0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVwRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDekM7SUFDSCxDQUFDOzhHQTVCVSxlQUFlO2tHQUFmLGVBQWU7OzJGQUFmLGVBQWU7a0JBSjNCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG9EQUFvRDtvQkFDOUQsUUFBUSxFQUFFLGlCQUFpQjtpQkFDNUI7eUhBS29CLGNBQWM7c0JBQWhDLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUGxhdGZvcm0sXG4gIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsXG4gIF9nZXRTaGFkb3dSb290LFxuICBfZ2V0RXZlbnRUYXJnZXQsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIEFmdGVyVmlld0luaXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5wdXRNb2RhbGl0eURldGVjdG9yLCBUT1VDSF9CVUZGRVJfTVN9IGZyb20gJy4uL2lucHV0LW1vZGFsaXR5L2lucHV0LW1vZGFsaXR5LWRldGVjdG9yJztcblxuZXhwb3J0IHR5cGUgRm9jdXNPcmlnaW4gPSAndG91Y2gnIHwgJ21vdXNlJyB8ICdrZXlib2FyZCcgfCAncHJvZ3JhbScgfCBudWxsO1xuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGUgbmF0aXZlIGBmb2N1c2AgZXZlbnQuXG4gKiB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50L2ZvY3VzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNPcHRpb25zIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc2hvdWxkIHNjcm9sbCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzIGZvY3VzZWQuICovXG4gIHByZXZlbnRTY3JvbGw/OiBib29sZWFuO1xufVxuXG4vKiogRGV0ZWN0aW9uIG1vZGUgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzIGV2ZW50LiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZSB7XG4gIC8qKlxuICAgKiBBbnkgbW91c2Vkb3duLCBrZXlkb3duLCBvciB0b3VjaHN0YXJ0IGV2ZW50IHRoYXQgaGFwcGVuZWQgaW4gdGhlIHByZXZpb3VzXG4gICAqIHRpY2sgb3IgdGhlIGN1cnJlbnQgdGljayB3aWxsIGJlIHVzZWQgdG8gYXNzaWduIGEgZm9jdXMgZXZlbnQncyBvcmlnaW4gKHRvXG4gICAqIGVpdGhlciBtb3VzZSwga2V5Ym9hcmQsIG9yIHRvdWNoKS4gVGhpcyBpcyB0aGUgZGVmYXVsdCBvcHRpb24uXG4gICAqL1xuICBJTU1FRElBVEUsXG4gIC8qKlxuICAgKiBBIGZvY3VzIGV2ZW50J3Mgb3JpZ2luIGlzIGFsd2F5cyBhdHRyaWJ1dGVkIHRvIHRoZSBsYXN0IGNvcnJlc3BvbmRpbmdcbiAgICogbW91c2Vkb3duLCBrZXlkb3duLCBvciB0b3VjaHN0YXJ0IGV2ZW50LCBubyBtYXR0ZXIgaG93IGxvbmcgYWdvIGl0IG9jY3VycmVkLlxuICAgKi9cbiAgRVZFTlRVQUwsXG59XG5cbi8qKiBJbmplY3RhYmxlIHNlcnZpY2UtbGV2ZWwgb3B0aW9ucyBmb3IgRm9jdXNNb25pdG9yLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c01vbml0b3JPcHRpb25zIHtcbiAgZGV0ZWN0aW9uTW9kZT86IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgRm9jdXNNb25pdG9yT3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxGb2N1c01vbml0b3JPcHRpb25zPihcbiAgJ2Nkay1mb2N1cy1tb25pdG9yLWRlZmF1bHQtb3B0aW9ucycsXG4pO1xuXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICBjaGVja0NoaWxkcmVuOiBib29sZWFuO1xuICByZWFkb25seSBzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPjtcbiAgcm9vdE5vZGU6IEhUTUxFbGVtZW50IHwgU2hhZG93Um9vdCB8IERvY3VtZW50O1xufTtcblxuLyoqXG4gKiBFdmVudCBsaXN0ZW5lciBvcHRpb25zIHRoYXQgZW5hYmxlIGNhcHR1cmluZyBhbmQgYWxzb1xuICogbWFyayB0aGUgbGlzdGVuZXIgYXMgcGFzc2l2ZSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBpdC5cbiAqL1xuY29uc3QgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWUsXG59KTtcblxuLyoqIE1vbml0b3JzIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMgdG8gZGV0ZXJtaW5lIHRoZSBjYXVzZSBvZiBmb2N1cyBldmVudHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGb2N1c01vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGZvY3VzIG9yaWdpbiB0aGF0IHRoZSBuZXh0IGZvY3VzIGV2ZW50IGlzIGEgcmVzdWx0IG9mLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICAvKiogVGhlIEZvY3VzT3JpZ2luIG9mIHRoZSBsYXN0IGZvY3VzIGV2ZW50IHRyYWNrZWQgYnkgdGhlIEZvY3VzTW9uaXRvci4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbjtcblxuICAvKiogV2hldGhlciB0aGUgd2luZG93IGhhcyBqdXN0IGJlZW4gZm9jdXNlZC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgd2luZG93IGZvY3VzIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSBvcmlnaW4gY2xlYXJpbmcgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIG9yaWdpbiB3YXMgZGV0ZXJtaW5lZCB2aWEgYSB0b3VjaCBpbnRlcmFjdGlvbi4gTmVjZXNzYXJ5IGFzIHByb3Blcmx5IGF0dHJpYnV0aW5nXG4gICAqIGZvY3VzIGV2ZW50cyB0byB0b3VjaCBpbnRlcmFjdGlvbnMgcmVxdWlyZXMgc3BlY2lhbCBsb2dpYy5cbiAgICovXG4gIHByaXZhdGUgX29yaWdpbkZyb21Ub3VjaEludGVyYWN0aW9uID0gZmFsc2U7XG5cbiAgLyoqIE1hcCBvZiBlbGVtZW50cyBiZWluZyBtb25pdG9yZWQgdG8gdGhlaXIgaW5mby4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudEluZm8gPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mbz4oKTtcblxuICAvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyBjdXJyZW50bHkgYmVpbmcgbW9uaXRvcmVkLiAqL1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50Q291bnQgPSAwO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgcm9vdCBub2RlcyB0byB3aGljaCB3ZSd2ZSBjdXJyZW50bHkgYm91bmQgYSBmb2N1cy9ibHVyIGhhbmRsZXIsXG4gICAqIGFzIHdlbGwgYXMgdGhlIG51bWJlciBvZiBtb25pdG9yZWQgZWxlbWVudHMgdGhhdCB0aGV5IGNvbnRhaW4uIFdlIGhhdmUgdG8gdHJlYXQgZm9jdXMvYmx1clxuICAgKiBoYW5kbGVycyBkaWZmZXJlbnRseSBmcm9tIHRoZSByZXN0IG9mIHRoZSBldmVudHMsIGJlY2F1c2UgdGhlIGJyb3dzZXIgd29uJ3QgZW1pdCBldmVudHNcbiAgICogdG8gdGhlIGRvY3VtZW50IHdoZW4gZm9jdXMgbW92ZXMgaW5zaWRlIG9mIGEgc2hhZG93IHJvb3QuXG4gICAqL1xuICBwcml2YXRlIF9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudCA9IG5ldyBNYXA8SFRNTEVsZW1lbnQgfCBEb2N1bWVudCB8IFNoYWRvd1Jvb3QsIG51bWJlcj4oKTtcblxuICAvKipcbiAgICogVGhlIHNwZWNpZmllZCBkZXRlY3Rpb24gbW9kZSwgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzXG4gICAqIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGV0ZWN0aW9uTW9kZTogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgZXZlbnRzIG9uIHRoZSB3aW5kb3cuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgLy8gTWFrZSBhIG5vdGUgb2Ygd2hlbiB0aGUgd2luZG93IHJlZ2FpbnMgZm9jdXMsIHNvIHdlIGNhblxuICAgIC8vIHJlc3RvcmUgdGhlIG9yaWdpbiBpbmZvIGZvciB0aGUgZm9jdXNlZCBlbGVtZW50LlxuICAgIHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSB0cnVlO1xuICAgIHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4gKHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZSkpO1xuICB9O1xuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgLyoqIFN1YmplY3QgZm9yIHN0b3BwaW5nIG91ciBJbnB1dE1vZGFsaXR5RGV0ZWN0b3Igc3Vic2NyaXB0aW9uLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zdG9wSW5wdXRNb2RhbGl0eURldGVjdG9yID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgcHJpdmF0ZSByZWFkb25seSBfaW5wdXRNb2RhbGl0eURldGVjdG9yOiBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IsXG4gICAgLyoqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIG1ha2UgZG9jdW1lbnQgcmVxdWlyZWQgKi9cbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55IHwgbnVsbCxcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TKSBvcHRpb25zOiBGb2N1c01vbml0b3JPcHRpb25zIHwgbnVsbCxcbiAgKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICB0aGlzLl9kZXRlY3Rpb25Nb2RlID0gb3B0aW9ucz8uZGV0ZWN0aW9uTW9kZSB8fCBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURTtcbiAgfVxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBmb2N1c2AgYW5kICdibHVyJyBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyID0gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudD4oZXZlbnQpO1xuXG4gICAgLy8gV2UgbmVlZCB0byB3YWxrIHVwIHRoZSBhbmNlc3RvciBjaGFpbiBpbiBvcmRlciB0byBzdXBwb3J0IGBjaGVja0NoaWxkcmVuYC5cbiAgICBmb3IgKGxldCBlbGVtZW50ID0gdGFyZ2V0OyBlbGVtZW50OyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ2ZvY3VzJykge1xuICAgICAgICB0aGlzLl9vbkZvY3VzKGV2ZW50IGFzIEZvY3VzRXZlbnQsIGVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fb25CbHVyKGV2ZW50IGFzIEZvY3VzRXZlbnQsIGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIG1vbml0b3IoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBjaGVja0NoaWxkcmVuOiBib29sZWFuID0gZmFsc2UsXG4gICk6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgd2UncmUgbm90IG9uIHRoZSBicm93c2VyIHBsYXRmb3JtIG9yIHRoZSBwYXNzZWQgaW4gbm9kZSBpc24ndCBhbiBlbGVtZW50LlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyIHx8IG5hdGl2ZUVsZW1lbnQubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGRvbid0IHdhbnQgdGhlIG9ic2VydmFibGUgdG8gZW1pdCBhdCBhbGwgc28gd2UgZG9uJ3QgcGFzcyBhbnkgcGFyYW1ldGVycy5cbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNoYWRvdyBET00sIHdlIG5lZWQgdG8gYmluZCBvdXIgZm9jdXMvYmx1ciBsaXN0ZW5lcnMgdG9cbiAgICAvLyB0aGUgc2hhZG93IHJvb3QsIHJhdGhlciB0aGFuIHRoZSBgZG9jdW1lbnRgLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZm9jdXMgZXZlbnRzXG4gICAgLy8gdG8gdGhlIGBkb2N1bWVudGAsIGlmIGZvY3VzIGlzIG1vdmluZyB3aXRoaW4gdGhlIHNhbWUgc2hhZG93IHJvb3QuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSBfZ2V0U2hhZG93Um9vdChuYXRpdmVFbGVtZW50KSB8fCB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIGNvbnN0IGNhY2hlZEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmIChjYWNoZWRJbmZvKSB7XG4gICAgICBpZiAoY2hlY2tDaGlsZHJlbikge1xuICAgICAgICAvLyBUT0RPKENPTVAtMzE4KTogdGhpcyBjYW4gYmUgcHJvYmxlbWF0aWMsIGJlY2F1c2UgaXQnbGwgdHVybiBhbGwgbm9uLWNoZWNrQ2hpbGRyZW5cbiAgICAgICAgLy8gb2JzZXJ2ZXJzIGludG8gb25lcyB0aGF0IGJlaGF2ZSBhcyBpZiBgY2hlY2tDaGlsZHJlbmAgd2FzIHR1cm5lZCBvbi4gV2UgbmVlZCBhIG1vcmVcbiAgICAgICAgLy8gcm9idXN0IHNvbHV0aW9uLlxuICAgICAgICBjYWNoZWRJbmZvLmNoZWNrQ2hpbGRyZW4gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FjaGVkSW5mby5zdWJqZWN0O1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtb25pdG9yZWQgZWxlbWVudCBpbmZvLlxuICAgIGNvbnN0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpLFxuICAgICAgcm9vdE5vZGUsXG4gICAgfTtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5zZXQobmF0aXZlRWxlbWVudCwgaW5mbyk7XG4gICAgdGhpcy5fcmVnaXN0ZXJHbG9iYWxMaXN0ZW5lcnMoaW5mbyk7XG5cbiAgICByZXR1cm4gaW5mby5zdWJqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIGVsZW1lbnRJbmZvLnN1YmplY3QuY29tcGxldGUoKTtcblxuICAgICAgdGhpcy5fc2V0Q2xhc3NlcyhuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2VsZW1lbnRJbmZvLmRlbGV0ZShuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Piwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgZm9jdXNWaWEoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGZvY3VzZWRFbGVtZW50ID0gdGhpcy5fZ2V0RG9jdW1lbnQoKS5hY3RpdmVFbGVtZW50O1xuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgZm9jdXNlZCBhbHJlYWR5LCBjYWxsaW5nIGBmb2N1c2AgYWdhaW4gd29uJ3QgdHJpZ2dlciB0aGUgZXZlbnQgbGlzdGVuZXJcbiAgICAvLyB3aGljaCBtZWFucyB0aGF0IHRoZSBmb2N1cyBjbGFzc2VzIHdvbid0IGJlIHVwZGF0ZWQuIElmIHRoYXQncyB0aGUgY2FzZSwgdXBkYXRlIHRoZSBjbGFzc2VzXG4gICAgLy8gZGlyZWN0bHkgd2l0aG91dCB3YWl0aW5nIGZvciBhbiBldmVudC5cbiAgICBpZiAobmF0aXZlRWxlbWVudCA9PT0gZm9jdXNlZEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2dldENsb3Nlc3RFbGVtZW50c0luZm8obmF0aXZlRWxlbWVudCkuZm9yRWFjaCgoW2N1cnJlbnRFbGVtZW50LCBpbmZvXSkgPT5cbiAgICAgICAgdGhpcy5fb3JpZ2luQ2hhbmdlZChjdXJyZW50RWxlbWVudCwgb3JpZ2luLCBpbmZvKSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NldE9yaWdpbihvcmlnaW4pO1xuXG4gICAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbmF0aXZlRWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Rm9jdXNPcmlnaW4oZm9jdXNFdmVudFRhcmdldDogSFRNTEVsZW1lbnQgfCBudWxsKTogRm9jdXNPcmlnaW4ge1xuICAgIGlmICh0aGlzLl9vcmlnaW4pIHtcbiAgICAgIC8vIElmIHRoZSBvcmlnaW4gd2FzIHJlYWxpemVkIHZpYSBhIHRvdWNoIGludGVyYWN0aW9uLCB3ZSBuZWVkIHRvIHBlcmZvcm0gYWRkaXRpb25hbCBjaGVja3NcbiAgICAgIC8vIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBmb2N1cyBvcmlnaW4gc2hvdWxkIGJlIGF0dHJpYnV0ZWQgdG8gdG91Y2ggb3IgcHJvZ3JhbS5cbiAgICAgIGlmICh0aGlzLl9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2hvdWxkQmVBdHRyaWJ1dGVkVG9Ub3VjaChmb2N1c0V2ZW50VGFyZ2V0KSA/ICd0b3VjaCcgOiAncHJvZ3JhbSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fb3JpZ2luO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZSB3aW5kb3cgaGFzIGp1c3QgcmVnYWluZWQgZm9jdXMsIHdlIGNhbiByZXN0b3JlIHRoZSBtb3N0IHJlY2VudCBvcmlnaW4gZnJvbSBiZWZvcmUgdGhlXG4gICAgLy8gd2luZG93IGJsdXJyZWQuIE90aGVyd2lzZSwgd2UndmUgcmVhY2hlZCB0aGUgcG9pbnQgd2hlcmUgd2UgY2FuJ3QgaWRlbnRpZnkgdGhlIHNvdXJjZSBvZiB0aGVcbiAgICAvLyBmb2N1cy4gVGhpcyB0eXBpY2FsbHkgbWVhbnMgb25lIG9mIHR3byB0aGluZ3MgaGFwcGVuZWQ6XG4gICAgLy9cbiAgICAvLyAxKSBUaGUgZWxlbWVudCB3YXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkLCBvclxuICAgIC8vIDIpIFRoZSBlbGVtZW50IHdhcyBmb2N1c2VkIHZpYSBzY3JlZW4gcmVhZGVyIG5hdmlnYXRpb24gKHdoaWNoIGdlbmVyYWxseSBkb2Vzbid0IGZpcmVcbiAgICAvLyAgICBldmVudHMpLlxuICAgIC8vXG4gICAgLy8gQmVjYXVzZSB3ZSBjYW4ndCBkaXN0aW5ndWlzaCBiZXR3ZWVuIHRoZXNlIHR3byBjYXNlcywgd2UgZGVmYXVsdCB0byBzZXR0aW5nIGBwcm9ncmFtYC5cbiAgICBpZiAodGhpcy5fd2luZG93Rm9jdXNlZCAmJiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4pIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGludGVyYWN0aW9uIGlzIGNvbWluZyBmcm9tIGFuIGlucHV0IGxhYmVsLCB3ZSBjb25zaWRlciBpdCBhIG1vdXNlIGludGVyYWN0aW9ucy5cbiAgICAvLyBUaGlzIGlzIGEgc3BlY2lhbCBjYXNlIHdoZXJlIGZvY3VzIG1vdmVzIG9uIGBjbGlja2AsIHJhdGhlciB0aGFuIGBtb3VzZWRvd25gIHdoaWNoIGJyZWFrc1xuICAgIC8vIG91ciBkZXRlY3Rpb24sIGJlY2F1c2UgYWxsIG91ciBhc3N1bXB0aW9ucyBhcmUgZm9yIGBtb3VzZWRvd25gLiBXZSBuZWVkIHRvIGhhbmRsZSB0aGlzXG4gICAgLy8gc3BlY2lhbCBjYXNlLCBiZWNhdXNlIGl0J3MgdmVyeSBjb21tb24gZm9yIGNoZWNrYm94ZXMgYW5kIHJhZGlvIGJ1dHRvbnMuXG4gICAgaWYgKGZvY3VzRXZlbnRUYXJnZXQgJiYgdGhpcy5faXNMYXN0SW50ZXJhY3Rpb25Gcm9tSW5wdXRMYWJlbChmb2N1c0V2ZW50VGFyZ2V0KSkge1xuICAgICAgcmV0dXJuICdtb3VzZSc7XG4gICAgfVxuXG4gICAgcmV0dXJuICdwcm9ncmFtJztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGZvY3VzIGV2ZW50IHNob3VsZCBiZSBhdHRyaWJ1dGVkIHRvIHRvdWNoLiBSZWNhbGwgdGhhdCBpbiBJTU1FRElBVEUgbW9kZSwgYVxuICAgKiB0b3VjaCBvcmlnaW4gaXNuJ3QgaW1tZWRpYXRlbHkgcmVzZXQgYXQgdGhlIG5leHQgdGljayAoc2VlIF9zZXRPcmlnaW4pLiBUaGlzIG1lYW5zIHRoYXQgd2hlbiB3ZVxuICAgKiBoYW5kbGUgYSBmb2N1cyBldmVudCBmb2xsb3dpbmcgYSB0b3VjaCBpbnRlcmFjdGlvbiwgd2UgbmVlZCB0byBkZXRlcm1pbmUgd2hldGhlciAoMSkgdGhlIGZvY3VzXG4gICAqIGV2ZW50IHdhcyBkaXJlY3RseSBjYXVzZWQgYnkgdGhlIHRvdWNoIGludGVyYWN0aW9uIG9yICgyKSB0aGUgZm9jdXMgZXZlbnQgd2FzIGNhdXNlZCBieSBhXG4gICAqIHN1YnNlcXVlbnQgcHJvZ3JhbW1hdGljIGZvY3VzIGNhbGwgdHJpZ2dlcmVkIGJ5IHRoZSB0b3VjaCBpbnRlcmFjdGlvbi5cbiAgICogQHBhcmFtIGZvY3VzRXZlbnRUYXJnZXQgVGhlIHRhcmdldCBvZiB0aGUgZm9jdXMgZXZlbnQgdW5kZXIgZXhhbWluYXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRCZUF0dHJpYnV0ZWRUb1RvdWNoKGZvY3VzRXZlbnRUYXJnZXQ6IEhUTUxFbGVtZW50IHwgbnVsbCk6IGJvb2xlYW4ge1xuICAgIC8vIFBsZWFzZSBub3RlIHRoYXQgdGhpcyBjaGVjayBpcyBub3QgcGVyZmVjdC4gQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBlZGdlIGNhc2U6XG4gICAgLy9cbiAgICAvLyA8ZGl2ICNwYXJlbnQgdGFiaW5kZXg9XCIwXCI+XG4gICAgLy8gICA8ZGl2ICNjaGlsZCB0YWJpbmRleD1cIjBcIiAoY2xpY2spPVwiI3BhcmVudC5mb2N1cygpXCI+PC9kaXY+XG4gICAgLy8gPC9kaXY+XG4gICAgLy9cbiAgICAvLyBTdXBwb3NlIHRoZXJlIGlzIGEgRm9jdXNNb25pdG9yIGluIElNTUVESUFURSBtb2RlIGF0dGFjaGVkIHRvICNwYXJlbnQuIFdoZW4gdGhlIHVzZXIgdG91Y2hlc1xuICAgIC8vICNjaGlsZCwgI3BhcmVudCBpcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQuIFRoaXMgY29kZSB3aWxsIGF0dHJpYnV0ZSB0aGUgZm9jdXMgdG8gdG91Y2hcbiAgICAvLyBpbnN0ZWFkIG9mIHByb2dyYW0uIFRoaXMgaXMgYSByZWxhdGl2ZWx5IG1pbm9yIGVkZ2UtY2FzZSB0aGF0IGNhbiBiZSB3b3JrZWQgYXJvdW5kIGJ5IHVzaW5nXG4gICAgLy8gZm9jdXNWaWEocGFyZW50LCAncHJvZ3JhbScpIHRvIGZvY3VzICNwYXJlbnQuXG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX2RldGVjdGlvbk1vZGUgPT09IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuRVZFTlRVQUwgfHxcbiAgICAgICEhZm9jdXNFdmVudFRhcmdldD8uY29udGFpbnModGhpcy5faW5wdXRNb2RhbGl0eURldGVjdG9yLl9tb3N0UmVjZW50VGFyZ2V0KVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jdXMgY2xhc3NlcyBvbiB0aGUgZWxlbWVudCBiYXNlZCBvbiB0aGUgZ2l2ZW4gZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB1cGRhdGUgdGhlIGNsYXNzZXMgb24uXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIGZvY3VzIG9yaWdpbi5cbiAgICovXG4gIHByaXZhdGUgX3NldENsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbj86IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdjZGstZm9jdXNlZCcsICEhb3JpZ2luKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2Nkay1rZXlib2FyZC1mb2N1c2VkJywgb3JpZ2luID09PSAna2V5Ym9hcmQnKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2Nkay1tb3VzZS1mb2N1c2VkJywgb3JpZ2luID09PSAnbW91c2UnKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZm9jdXMgb3JpZ2luLiBJZiB3ZSdyZSB1c2luZyBpbW1lZGlhdGUgZGV0ZWN0aW9uIG1vZGUsIHdlIHNjaGVkdWxlIGFuIGFzeW5jXG4gICAqIGZ1bmN0aW9uIHRvIGNsZWFyIHRoZSBvcmlnaW4gYXQgdGhlIGVuZCBvZiBhIHRpbWVvdXQuIFRoZSBkdXJhdGlvbiBvZiB0aGUgdGltZW91dCBkZXBlbmRzIG9uXG4gICAqIHRoZSBvcmlnaW4gYmVpbmcgc2V0LlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gdG8gc2V0LlxuICAgKiBAcGFyYW0gaXNGcm9tSW50ZXJhY3Rpb24gV2hldGhlciB3ZSBhcmUgc2V0dGluZyB0aGUgb3JpZ2luIGZyb20gYW4gaW50ZXJhY3Rpb24gZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRPcmlnaW4ob3JpZ2luOiBGb2N1c09yaWdpbiwgaXNGcm9tSW50ZXJhY3Rpb24gPSBmYWxzZSk6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG4gICAgICB0aGlzLl9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA9IG9yaWdpbiA9PT0gJ3RvdWNoJyAmJiBpc0Zyb21JbnRlcmFjdGlvbjtcblxuICAgICAgLy8gSWYgd2UncmUgaW4gSU1NRURJQVRFIG1vZGUsIHJlc2V0IHRoZSBvcmlnaW4gYXQgdGhlIG5leHQgdGljayAob3IgaW4gYFRPVUNIX0JVRkZFUl9NU2AgbXNcbiAgICAgIC8vIGZvciBhIHRvdWNoIGV2ZW50KS4gV2UgcmVzZXQgdGhlIG9yaWdpbiBhdCB0aGUgbmV4dCB0aWNrIGJlY2F1c2UgRmlyZWZveCBmb2N1c2VzIG9uZSB0aWNrXG4gICAgICAvLyBhZnRlciB0aGUgaW50ZXJhY3Rpb24gZXZlbnQuIFdlIHdhaXQgYFRPVUNIX0JVRkZFUl9NU2AgbXMgYmVmb3JlIHJlc2V0dGluZyB0aGUgb3JpZ2luIGZvclxuICAgICAgLy8gYSB0b3VjaCBldmVudCBiZWNhdXNlIHdoZW4gYSB0b3VjaCBldmVudCBpcyBmaXJlZCwgdGhlIGFzc29jaWF0ZWQgZm9jdXMgZXZlbnQgaXNuJ3QgeWV0IGluXG4gICAgICAvLyB0aGUgZXZlbnQgcXVldWUuIEJlZm9yZSBkb2luZyBzbywgY2xlYXIgYW55IHBlbmRpbmcgdGltZW91dHMuXG4gICAgICBpZiAodGhpcy5fZGV0ZWN0aW9uTW9kZSA9PT0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX29yaWdpblRpbWVvdXRJZCk7XG4gICAgICAgIGNvbnN0IG1zID0gdGhpcy5fb3JpZ2luRnJvbVRvdWNoSW50ZXJhY3Rpb24gPyBUT1VDSF9CVUZGRVJfTVMgOiAxO1xuICAgICAgICB0aGlzLl9vcmlnaW5UaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+ICh0aGlzLl9vcmlnaW4gPSBudWxsKSwgbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9vbkZvY3VzKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIE5PVEUobW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgc2V0IHRoZSBjbGFzc2VzIGJhc2VkIG9uIHRoZSBmb2N1cyBvcmlnaW4gb2YgdGhlIG1vc3QgcmVjZW50XG4gICAgLy8gZm9jdXMgZXZlbnQgYWZmZWN0aW5nIHRoZSBtb25pdG9yZWQgZWxlbWVudC4gSWYgd2Ugd2FudCB0byB1c2UgdGhlIG9yaWdpbiBvZiB0aGUgZmlyc3QgZXZlbnRcbiAgICAvLyBpbnN0ZWFkIHdlIHNob3VsZCBjaGVjayBmb3IgdGhlIGNkay1mb2N1c2VkIGNsYXNzIGhlcmUgYW5kIHJldHVybiBpZiB0aGUgZWxlbWVudCBhbHJlYWR5IGhhc1xuICAgIC8vIGl0LiAoVGhpcyBvbmx5IG1hdHRlcnMgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBpbmNsdWRlc0NoaWxkcmVuID0gdHJ1ZSkuXG5cbiAgICAvLyBJZiB3ZSBhcmUgbm90IGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHRhcmdldCBpcyB0aGVcbiAgICAvLyBtb25pdG9yZWQgZWxlbWVudCBpdHNlbGYuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG4gICAgY29uc3QgZm9jdXNFdmVudFRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudD4oZXZlbnQpO1xuICAgIGlmICghZWxlbWVudEluZm8gfHwgKCFlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGVsZW1lbnQgIT09IGZvY3VzRXZlbnRUYXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fb3JpZ2luQ2hhbmdlZChlbGVtZW50LCB0aGlzLl9nZXRGb2N1c09yaWdpbihmb2N1c0V2ZW50VGFyZ2V0KSwgZWxlbWVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYmx1ciBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgYmx1ciBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgX29uQmx1cihldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB3ZSBhcmVuJ3QganVzdCBibHVycmluZyBpblxuICAgIC8vIG9yZGVyIHRvIGZvY3VzIGFub3RoZXIgY2hpbGQgb2YgdGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKFxuICAgICAgIWVsZW1lbnRJbmZvIHx8XG4gICAgICAoZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJlxuICAgICAgICBldmVudC5yZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICBlbGVtZW50LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCk7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mbywgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0T3JpZ2luKGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvLCBvcmlnaW46IEZvY3VzT3JpZ2luKSB7XG4gICAgaWYgKGluZm8uc3ViamVjdC5vYnNlcnZlcnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IGluZm8uc3ViamVjdC5uZXh0KG9yaWdpbikpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JlZ2lzdGVyR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbykge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcbiAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSB8fCAwO1xuXG4gICAgaWYgKCFyb290Tm9kZUZvY3VzTGlzdGVuZXJzKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgICdmb2N1cycsXG4gICAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ2JsdXInLFxuICAgICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zLFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuc2V0KHJvb3ROb2RlLCByb290Tm9kZUZvY3VzTGlzdGVuZXJzICsgMSk7XG5cbiAgICAvLyBSZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gZmlyc3QgZWxlbWVudCBpcyBtb25pdG9yZWQuXG4gICAgaWYgKCsrdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50ID09PSAxKSB7XG4gICAgICAvLyBOb3RlOiB3ZSBsaXN0ZW4gdG8gZXZlbnRzIGluIHRoZSBjYXB0dXJlIHBoYXNlIHNvIHdlXG4gICAgICAvLyBjYW4gZGV0ZWN0IHRoZW0gZXZlbiBpZiB0aGUgdXNlciBzdG9wcyBwcm9wYWdhdGlvbi5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaGUgSW5wdXRNb2RhbGl0eURldGVjdG9yIGlzIGFsc28ganVzdCBhIGNvbGxlY3Rpb24gb2YgZ2xvYmFsIGxpc3RlbmVycy5cbiAgICAgIHRoaXMuX2lucHV0TW9kYWxpdHlEZXRlY3Rvci5tb2RhbGl0eURldGVjdGVkXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9zdG9wSW5wdXRNb2RhbGl0eURldGVjdG9yKSlcbiAgICAgICAgLnN1YnNjcmliZShtb2RhbGl0eSA9PiB7XG4gICAgICAgICAgdGhpcy5fc2V0T3JpZ2luKG1vZGFsaXR5LCB0cnVlIC8qIGlzRnJvbUludGVyYWN0aW9uICovKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVtb3ZlR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbykge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudEluZm8ucm9vdE5vZGU7XG5cbiAgICBpZiAodGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuaGFzKHJvb3ROb2RlKSkge1xuICAgICAgY29uc3Qgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyA9IHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmdldChyb290Tm9kZSkhO1xuXG4gICAgICBpZiAocm9vdE5vZGVGb2N1c0xpc3RlbmVycyA+IDEpIHtcbiAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuc2V0KHJvb3ROb2RlLCByb290Tm9kZUZvY3VzTGlzdGVuZXJzIC0gMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAgICdmb2N1cycsXG4gICAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ2JsdXInLFxuICAgICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5kZWxldGUocm9vdE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBFcXVpdmFsZW50bHksIHN0b3Agb3VyIElucHV0TW9kYWxpdHlEZXRlY3RvciBzdWJzY3JpcHRpb24uXG4gICAgICB0aGlzLl9zdG9wSW5wdXRNb2RhbGl0eURldGVjdG9yLm5leHQoKTtcblxuICAgICAgLy8gQ2xlYXIgdGltZW91dHMgZm9yIGFsbCBwb3RlbnRpYWxseSBwZW5kaW5nIHRpbWVvdXRzIHRvIHByZXZlbnQgdGhlIGxlYWtzLlxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIGFsbCB0aGUgc3RhdGUgb24gYW4gZWxlbWVudCBvbmNlIGl0cyBmb2N1cyBvcmlnaW4gaGFzIGNoYW5nZWQuICovXG4gIHByaXZhdGUgX29yaWdpbkNoYW5nZWQoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICBlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8sXG4gICkge1xuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCwgb3JpZ2luKTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLCBvcmlnaW4pO1xuICAgIHRoaXMuX2xhc3RGb2N1c09yaWdpbiA9IG9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2xsZWN0cyB0aGUgYE1vbml0b3JlZEVsZW1lbnRJbmZvYCBvZiBhIHBhcnRpY3VsYXIgZWxlbWVudCBhbmRcbiAgICogYWxsIG9mIGl0cyBhbmNlc3RvcnMgdGhhdCBoYXZlIGVuYWJsZWQgYGNoZWNrQ2hpbGRyZW5gLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IGZyb20gd2hpY2ggdG8gc3RhcnQgdGhlIHNlYXJjaC5cbiAgICovXG4gIHByaXZhdGUgX2dldENsb3Nlc3RFbGVtZW50c0luZm8oZWxlbWVudDogSFRNTEVsZW1lbnQpOiBbSFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvXVtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBbSFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvXVtdID0gW107XG5cbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChpbmZvLCBjdXJyZW50RWxlbWVudCkgPT4ge1xuICAgICAgaWYgKGN1cnJlbnRFbGVtZW50ID09PSBlbGVtZW50IHx8IChpbmZvLmNoZWNrQ2hpbGRyZW4gJiYgY3VycmVudEVsZW1lbnQuY29udGFpbnMoZWxlbWVudCkpKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChbY3VycmVudEVsZW1lbnQsIGluZm9dKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciBhbiBpbnRlcmFjdGlvbiBpcyBsaWtlbHkgdG8gaGF2ZSBjb21lIGZyb20gdGhlIHVzZXIgY2xpY2tpbmcgdGhlIGBsYWJlbGAgb2ZcbiAgICogYW4gYGlucHV0YCBvciBgdGV4dGFyZWFgIGluIG9yZGVyIHRvIGZvY3VzIGl0LlxuICAgKiBAcGFyYW0gZm9jdXNFdmVudFRhcmdldCBUYXJnZXQgY3VycmVudGx5IHJlY2VpdmluZyBmb2N1cy5cbiAgICovXG4gIHByaXZhdGUgX2lzTGFzdEludGVyYWN0aW9uRnJvbUlucHV0TGFiZWwoZm9jdXNFdmVudFRhcmdldDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCB7X21vc3RSZWNlbnRUYXJnZXQ6IG1vc3RSZWNlbnRUYXJnZXQsIG1vc3RSZWNlbnRNb2RhbGl0eX0gPSB0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3I7XG5cbiAgICAvLyBJZiB0aGUgbGFzdCBpbnRlcmFjdGlvbiB1c2VkIHRoZSBtb3VzZSBvbiBhbiBlbGVtZW50IGNvbnRhaW5lZCBieSBvbmUgb2YgdGhlIGxhYmVsc1xuICAgIC8vIG9mIGFuIGBpbnB1dGAvYHRleHRhcmVhYCB0aGF0IGlzIGN1cnJlbnRseSBmb2N1c2VkLCBpdCBpcyB2ZXJ5IGxpa2VseSB0aGF0IHRoZVxuICAgIC8vIHVzZXIgcmVkaXJlY3RlZCBmb2N1cyB1c2luZyB0aGUgbGFiZWwuXG4gICAgaWYgKFxuICAgICAgbW9zdFJlY2VudE1vZGFsaXR5ICE9PSAnbW91c2UnIHx8XG4gICAgICAhbW9zdFJlY2VudFRhcmdldCB8fFxuICAgICAgbW9zdFJlY2VudFRhcmdldCA9PT0gZm9jdXNFdmVudFRhcmdldCB8fFxuICAgICAgKGZvY3VzRXZlbnRUYXJnZXQubm9kZU5hbWUgIT09ICdJTlBVVCcgJiYgZm9jdXNFdmVudFRhcmdldC5ub2RlTmFtZSAhPT0gJ1RFWFRBUkVBJykgfHxcbiAgICAgIChmb2N1c0V2ZW50VGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50KS5kaXNhYmxlZFxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGxhYmVscyA9IChmb2N1c0V2ZW50VGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50KS5sYWJlbHM7XG5cbiAgICBpZiAobGFiZWxzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobGFiZWxzW2ldLmNvbnRhaW5zKG1vc3RSZWNlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBEaXJlY3RpdmUgdGhhdCBkZXRlcm1pbmVzIGhvdyBhIHBhcnRpY3VsYXIgZWxlbWVudCB3YXMgZm9jdXNlZCAodmlhIGtleWJvYXJkLCBtb3VzZSwgdG91Y2gsIG9yXG4gKiBwcm9ncmFtbWF0aWNhbGx5KSBhbmQgYWRkcyBjb3JyZXNwb25kaW5nIGNsYXNzZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byB2YXJpYW50cyBvZiB0aGlzIGRpcmVjdGl2ZTpcbiAqIDEpIGNka01vbml0b3JFbGVtZW50Rm9jdXM6IGRvZXMgbm90IGNvbnNpZGVyIGFuIGVsZW1lbnQgdG8gYmUgZm9jdXNlZCBpZiBvbmUgb2YgaXRzIGNoaWxkcmVuIGlzXG4gKiAgICBmb2N1c2VkLlxuICogMikgY2RrTW9uaXRvclN1YnRyZWVGb2N1czogY29uc2lkZXJzIGFuIGVsZW1lbnQgZm9jdXNlZCBpZiBpdCBvciBhbnkgb2YgaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTW9uaXRvckVsZW1lbnRGb2N1c10sIFtjZGtNb25pdG9yU3VidHJlZUZvY3VzXScsXG4gIGV4cG9ydEFzOiAnY2RrTW9uaXRvckZvY3VzJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBwcml2YXRlIF9mb2N1c09yaWdpbjogRm9jdXNPcmlnaW4gPSBudWxsO1xuXG4gIEBPdXRwdXQoKSByZWFkb25seSBjZGtGb2N1c0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Rm9jdXNPcmlnaW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yKSB7fVxuXG4gIGdldCBmb2N1c09yaWdpbigpOiBGb2N1c09yaWdpbiB7XG4gICAgcmV0dXJuIHRoaXMuX2ZvY3VzT3JpZ2luO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvclxuICAgICAgLm1vbml0b3IoZWxlbWVudCwgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY2RrTW9uaXRvclN1YnRyZWVGb2N1cycpKVxuICAgICAgLnN1YnNjcmliZShvcmlnaW4gPT4ge1xuICAgICAgICB0aGlzLl9mb2N1c09yaWdpbiA9IG9yaWdpbjtcbiAgICAgICAgdGhpcy5jZGtGb2N1c0NoYW5nZS5lbWl0KG9yaWdpbik7XG4gICAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcblxuICAgIGlmICh0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG4iXX0=