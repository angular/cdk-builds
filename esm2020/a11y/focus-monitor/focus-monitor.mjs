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
}
FocusMonitor.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: FocusMonitor, deps: [{ token: i0.NgZone }, { token: i1.Platform }, { token: i2.InputModalityDetector }, { token: DOCUMENT, optional: true }, { token: FOCUS_MONITOR_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
FocusMonitor.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: FocusMonitor, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: FocusMonitor, decorators: [{
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
}
CdkMonitorFocus.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkMonitorFocus, deps: [{ token: i0.ElementRef }, { token: FocusMonitor }], target: i0.ɵɵFactoryTarget.Directive });
CdkMonitorFocus.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkMonitorFocus, selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]", outputs: { cdkFocusChange: "cdkFocusChange" }, exportAs: ["cdkMonitorFocus"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkMonitorFocus, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
                    exportAs: 'cdkMonitorFocus',
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: FocusMonitor }]; }, propDecorators: { cdkFocusChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFFBQVEsRUFDUiwrQkFBK0IsRUFDL0IsY0FBYyxFQUNkLGVBQWUsR0FDaEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQzs7OztBQWlDakcsOENBQThDO0FBQzlDLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUFHLElBQUksY0FBYyxDQUM3RCxtQ0FBbUMsQ0FDcEMsQ0FBQztBQVFGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUVILGlGQUFpRjtBQUVqRixNQUFNLE9BQU8sWUFBWTtJQTJEdkIsWUFDVSxPQUFlLEVBQ2YsU0FBbUIsRUFDVixzQkFBNkM7SUFDOUQscURBQXFEO0lBQ3ZCLFFBQW9CLEVB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QUM7WUFDM0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVwRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDekM7SUFDSCxDQUFDOzs0R0E1QlUsZUFBZSw0Q0FNdUQsWUFBWTtnR0FObEYsZUFBZTsyRkFBZixlQUFlO2tCQUozQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvREFBb0Q7b0JBQzlELFFBQVEsRUFBRSxpQkFBaUI7aUJBQzVCO21GQU9rRixZQUFZLDBCQUYxRSxjQUFjO3NCQUFoQyxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFBsYXRmb3JtLFxuICBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLFxuICBfZ2V0U2hhZG93Um9vdCxcbiAgX2dldEV2ZW50VGFyZ2V0LFxufSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0lucHV0TW9kYWxpdHlEZXRlY3RvciwgVE9VQ0hfQlVGRkVSX01TfSBmcm9tICcuLi9pbnB1dC1tb2RhbGl0eS9pbnB1dC1tb2RhbGl0eS1kZXRlY3Rvcic7XG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxuLyoqIERldGVjdGlvbiBtb2RlIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1cyBldmVudC4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogQW55IG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCB0aGF0IGhhcHBlbmVkIGluIHRoZSBwcmV2aW91c1xuICAgKiB0aWNrIG9yIHRoZSBjdXJyZW50IHRpY2sgd2lsbCBiZSB1c2VkIHRvIGFzc2lnbiBhIGZvY3VzIGV2ZW50J3Mgb3JpZ2luICh0b1xuICAgKiBlaXRoZXIgbW91c2UsIGtleWJvYXJkLCBvciB0b3VjaCkuIFRoaXMgaXMgdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgKi9cbiAgSU1NRURJQVRFLFxuICAvKipcbiAgICogQSBmb2N1cyBldmVudCdzIG9yaWdpbiBpcyBhbHdheXMgYXR0cmlidXRlZCB0byB0aGUgbGFzdCBjb3JyZXNwb25kaW5nXG4gICAqIG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCwgbm8gbWF0dGVyIGhvdyBsb25nIGFnbyBpdCBvY2N1cnJlZC5cbiAgICovXG4gIEVWRU5UVUFMLFxufVxuXG4vKiogSW5qZWN0YWJsZSBzZXJ2aWNlLWxldmVsIG9wdGlvbnMgZm9yIEZvY3VzTW9uaXRvci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNNb25pdG9yT3B0aW9ucyB7XG4gIGRldGVjdGlvbk1vZGU/OiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xufVxuXG4vKiogSW5qZWN0aW9uVG9rZW4gZm9yIEZvY3VzTW9uaXRvck9wdGlvbnMuICovXG5leHBvcnQgY29uc3QgRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oXG4gICdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnLFxuKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj47XG4gIHJvb3ROb2RlOiBIVE1MRWxlbWVudCB8IFNoYWRvd1Jvb3QgfCBEb2N1bWVudDtcbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlLFxufSk7XG5cbi8qKiBNb25pdG9ycyBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzIHRvIGRldGVybWluZSB0aGUgY2F1c2Ugb2YgZm9jdXMgZXZlbnRzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNNb25pdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBmb2N1cyBvcmlnaW4gdGhhdCB0aGUgbmV4dCBmb2N1cyBldmVudCBpcyBhIHJlc3VsdCBvZi4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgLyoqIFRoZSBGb2N1c09yaWdpbiBvZiB0aGUgbGFzdCBmb2N1cyBldmVudCB0cmFja2VkIGJ5IHRoZSBGb2N1c01vbml0b3IuICovXG4gIHByaXZhdGUgX2xhc3RGb2N1c09yaWdpbjogRm9jdXNPcmlnaW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdpbmRvdyBoYXMganVzdCBiZWVuIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZTtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvcmlnaW4gd2FzIGRldGVybWluZWQgdmlhIGEgdG91Y2ggaW50ZXJhY3Rpb24uIE5lY2Vzc2FyeSBhcyBwcm9wZXJseSBhdHRyaWJ1dGluZ1xuICAgKiBmb2N1cyBldmVudHMgdG8gdG91Y2ggaW50ZXJhY3Rpb25zIHJlcXVpcmVzIHNwZWNpYWwgbG9naWMuXG4gICAqL1xuICBwcml2YXRlIF9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA9IGZhbHNlO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHJvb3Qgbm9kZXMgdG8gd2hpY2ggd2UndmUgY3VycmVudGx5IGJvdW5kIGEgZm9jdXMvYmx1ciBoYW5kbGVyLFxuICAgKiBhcyB3ZWxsIGFzIHRoZSBudW1iZXIgb2YgbW9uaXRvcmVkIGVsZW1lbnRzIHRoYXQgdGhleSBjb250YWluLiBXZSBoYXZlIHRvIHRyZWF0IGZvY3VzL2JsdXJcbiAgICogaGFuZGxlcnMgZGlmZmVyZW50bHkgZnJvbSB0aGUgcmVzdCBvZiB0aGUgZXZlbnRzLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZXZlbnRzXG4gICAqIHRvIHRoZSBkb2N1bWVudCB3aGVuIGZvY3VzIG1vdmVzIGluc2lkZSBvZiBhIHNoYWRvdyByb290LlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQgPSBuZXcgTWFwPEhUTUxFbGVtZW50IHwgRG9jdW1lbnQgfCBTaGFkb3dSb290LCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+ICh0aGlzLl93aW5kb3dGb2N1c2VkID0gZmFsc2UpKTtcbiAgfTtcblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIC8qKiBTdWJqZWN0IGZvciBzdG9wcGluZyBvdXIgSW5wdXRNb2RhbGl0eURldGVjdG9yIHN1YnNjcmlwdGlvbi4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfc3RvcElucHV0TW9kYWxpdHlEZXRlY3RvciA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lucHV0TW9kYWxpdHlEZXRlY3RvcjogSW5wdXRNb2RhbGl0eURldGVjdG9yLFxuICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSB8IG51bGwsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUykgb3B0aW9uczogRm9jdXNNb25pdG9yT3B0aW9ucyB8IG51bGwsXG4gICkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9IG9wdGlvbnM/LmRldGVjdGlvbk1vZGUgfHwgRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEU7XG4gIH1cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGFuZCAnYmx1cicgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lciA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQ8SFRNTEVsZW1lbnQ+KGV2ZW50KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gd2FsayB1cCB0aGUgYW5jZXN0b3IgY2hhaW4gaW4gb3JkZXIgdG8gc3VwcG9ydCBgY2hlY2tDaGlsZHJlbmAuXG4gICAgZm9yIChsZXQgZWxlbWVudCA9IHRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdmb2N1cycpIHtcbiAgICAgICAgdGhpcy5fb25Gb2N1cyhldmVudCBhcyBGb2N1c0V2ZW50LCBlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX29uQmx1cihldmVudCBhcyBGb2N1c0V2ZW50LCBlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlLFxuICApOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPiB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIHdlJ3JlIG5vdCBvbiB0aGUgYnJvd3NlciBwbGF0Zm9ybSBvciB0aGUgcGFzc2VkIGluIG5vZGUgaXNuJ3QgYW4gZWxlbWVudC5cbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciB8fCBuYXRpdmVFbGVtZW50Lm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKG51bGwpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGluc2lkZSB0aGUgc2hhZG93IERPTSwgd2UgbmVlZCB0byBiaW5kIG91ciBmb2N1cy9ibHVyIGxpc3RlbmVycyB0b1xuICAgIC8vIHRoZSBzaGFkb3cgcm9vdCwgcmF0aGVyIHRoYW4gdGhlIGBkb2N1bWVudGAsIGJlY2F1c2UgdGhlIGJyb3dzZXIgd29uJ3QgZW1pdCBmb2N1cyBldmVudHNcbiAgICAvLyB0byB0aGUgYGRvY3VtZW50YCwgaWYgZm9jdXMgaXMgbW92aW5nIHdpdGhpbiB0aGUgc2FtZSBzaGFkb3cgcm9vdC5cbiAgICBjb25zdCByb290Tm9kZSA9IF9nZXRTaGFkb3dSb290KG5hdGl2ZUVsZW1lbnQpIHx8IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgY29uc3QgY2FjaGVkSW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIC8vIENoZWNrIGlmIHdlJ3JlIGFscmVhZHkgbW9uaXRvcmluZyB0aGlzIGVsZW1lbnQuXG4gICAgaWYgKGNhY2hlZEluZm8pIHtcbiAgICAgIGlmIChjaGVja0NoaWxkcmVuKSB7XG4gICAgICAgIC8vIFRPRE8oQ09NUC0zMTgpOiB0aGlzIGNhbiBiZSBwcm9ibGVtYXRpYywgYmVjYXVzZSBpdCdsbCB0dXJuIGFsbCBub24tY2hlY2tDaGlsZHJlblxuICAgICAgICAvLyBvYnNlcnZlcnMgaW50byBvbmVzIHRoYXQgYmVoYXZlIGFzIGlmIGBjaGVja0NoaWxkcmVuYCB3YXMgdHVybmVkIG9uLiBXZSBuZWVkIGEgbW9yZVxuICAgICAgICAvLyByb2J1c3Qgc29sdXRpb24uXG4gICAgICAgIGNhY2hlZEluZm8uY2hlY2tDaGlsZHJlbiA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWNoZWRJbmZvLnN1YmplY3Q7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIG1vbml0b3JlZCBlbGVtZW50IGluZm8uXG4gICAgY29uc3QgaW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gICAgICBjaGVja0NoaWxkcmVuOiBjaGVja0NoaWxkcmVuLFxuICAgICAgc3ViamVjdDogbmV3IFN1YmplY3Q8Rm9jdXNPcmlnaW4+KCksXG4gICAgICByb290Tm9kZSxcbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLnNldChuYXRpdmVFbGVtZW50LCBpbmZvKTtcbiAgICB0aGlzLl9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhpbmZvKTtcblxuICAgIHJldHVybiBpbmZvLnN1YmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkO1xuXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgZWxlbWVudEluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuXG4gICAgICB0aGlzLl9zZXRDbGFzc2VzKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudEluZm8uZGVsZXRlKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICBmb2N1c1ZpYShcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyxcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpLmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBmb2N1c2VkIGFscmVhZHksIGNhbGxpbmcgYGZvY3VzYCBhZ2FpbiB3b24ndCB0cmlnZ2VyIHRoZSBldmVudCBsaXN0ZW5lclxuICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGZvY3VzIGNsYXNzZXMgd29uJ3QgYmUgdXBkYXRlZC4gSWYgdGhhdCdzIHRoZSBjYXNlLCB1cGRhdGUgdGhlIGNsYXNzZXNcbiAgICAvLyBkaXJlY3RseSB3aXRob3V0IHdhaXRpbmcgZm9yIGFuIGV2ZW50LlxuICAgIGlmIChuYXRpdmVFbGVtZW50ID09PSBmb2N1c2VkRWxlbWVudCkge1xuICAgICAgdGhpcy5fZ2V0Q2xvc2VzdEVsZW1lbnRzSW5mbyhuYXRpdmVFbGVtZW50KS5mb3JFYWNoKChbY3VycmVudEVsZW1lbnQsIGluZm9dKSA9PlxuICAgICAgICB0aGlzLl9vcmlnaW5DaGFuZ2VkKGN1cnJlbnRFbGVtZW50LCBvcmlnaW4sIGluZm8pLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2V0T3JpZ2luKG9yaWdpbik7XG5cbiAgICAgIC8vIGBmb2N1c2AgaXNuJ3QgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXJcbiAgICAgIGlmICh0eXBlb2YgbmF0aXZlRWxlbWVudC5mb2N1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBuYXRpdmVFbGVtZW50LmZvY3VzKG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKiBBY2Nlc3MgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCBkb2N1bWVudCByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIGNvbnN0IGRvYyA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICBwcml2YXRlIF9nZXRGb2N1c09yaWdpbihmb2N1c0V2ZW50VGFyZ2V0OiBIVE1MRWxlbWVudCB8IG51bGwpOiBGb2N1c09yaWdpbiB7XG4gICAgaWYgKHRoaXMuX29yaWdpbikge1xuICAgICAgLy8gSWYgdGhlIG9yaWdpbiB3YXMgcmVhbGl6ZWQgdmlhIGEgdG91Y2ggaW50ZXJhY3Rpb24sIHdlIG5lZWQgdG8gcGVyZm9ybSBhZGRpdGlvbmFsIGNoZWNrc1xuICAgICAgLy8gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGZvY3VzIG9yaWdpbiBzaG91bGQgYmUgYXR0cmlidXRlZCB0byB0b3VjaCBvciBwcm9ncmFtLlxuICAgICAgaWYgKHRoaXMuX29yaWdpbkZyb21Ub3VjaEludGVyYWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zaG91bGRCZUF0dHJpYnV0ZWRUb1RvdWNoKGZvY3VzRXZlbnRUYXJnZXQpID8gJ3RvdWNoJyA6ICdwcm9ncmFtJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vcmlnaW47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHdpbmRvdyBoYXMganVzdCByZWdhaW5lZCBmb2N1cywgd2UgY2FuIHJlc3RvcmUgdGhlIG1vc3QgcmVjZW50IG9yaWdpbiBmcm9tIGJlZm9yZSB0aGVcbiAgICAvLyB3aW5kb3cgYmx1cnJlZC4gT3RoZXJ3aXNlLCB3ZSd2ZSByZWFjaGVkIHRoZSBwb2ludCB3aGVyZSB3ZSBjYW4ndCBpZGVudGlmeSB0aGUgc291cmNlIG9mIHRoZVxuICAgIC8vIGZvY3VzLiBUaGlzIHR5cGljYWxseSBtZWFucyBvbmUgb2YgdHdvIHRoaW5ncyBoYXBwZW5lZDpcbiAgICAvL1xuICAgIC8vIDEpIFRoZSBlbGVtZW50IHdhcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQsIG9yXG4gICAgLy8gMikgVGhlIGVsZW1lbnQgd2FzIGZvY3VzZWQgdmlhIHNjcmVlbiByZWFkZXIgbmF2aWdhdGlvbiAod2hpY2ggZ2VuZXJhbGx5IGRvZXNuJ3QgZmlyZVxuICAgIC8vICAgIGV2ZW50cykuXG4gICAgLy9cbiAgICAvLyBCZWNhdXNlIHdlIGNhbid0IGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlc2UgdHdvIGNhc2VzLCB3ZSBkZWZhdWx0IHRvIHNldHRpbmcgYHByb2dyYW1gLlxuICAgIGlmICh0aGlzLl93aW5kb3dGb2N1c2VkICYmIHRoaXMuX2xhc3RGb2N1c09yaWdpbikge1xuICAgICAgcmV0dXJuIHRoaXMuX2xhc3RGb2N1c09yaWdpbjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgaW50ZXJhY3Rpb24gaXMgY29taW5nIGZyb20gYW4gaW5wdXQgbGFiZWwsIHdlIGNvbnNpZGVyIGl0IGEgbW91c2UgaW50ZXJhY3Rpb25zLlxuICAgIC8vIFRoaXMgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlcmUgZm9jdXMgbW92ZXMgb24gYGNsaWNrYCwgcmF0aGVyIHRoYW4gYG1vdXNlZG93bmAgd2hpY2ggYnJlYWtzXG4gICAgLy8gb3VyIGRldGVjdGlvbiwgYmVjYXVzZSBhbGwgb3VyIGFzc3VtcHRpb25zIGFyZSBmb3IgYG1vdXNlZG93bmAuIFdlIG5lZWQgdG8gaGFuZGxlIHRoaXNcbiAgICAvLyBzcGVjaWFsIGNhc2UsIGJlY2F1c2UgaXQncyB2ZXJ5IGNvbW1vbiBmb3IgY2hlY2tib3hlcyBhbmQgcmFkaW8gYnV0dG9ucy5cbiAgICBpZiAoZm9jdXNFdmVudFRhcmdldCAmJiB0aGlzLl9pc0xhc3RJbnRlcmFjdGlvbkZyb21JbnB1dExhYmVsKGZvY3VzRXZlbnRUYXJnZXQpKSB7XG4gICAgICByZXR1cm4gJ21vdXNlJztcbiAgICB9XG5cbiAgICByZXR1cm4gJ3Byb2dyYW0nO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgZm9jdXMgZXZlbnQgc2hvdWxkIGJlIGF0dHJpYnV0ZWQgdG8gdG91Y2guIFJlY2FsbCB0aGF0IGluIElNTUVESUFURSBtb2RlLCBhXG4gICAqIHRvdWNoIG9yaWdpbiBpc24ndCBpbW1lZGlhdGVseSByZXNldCBhdCB0aGUgbmV4dCB0aWNrIChzZWUgX3NldE9yaWdpbikuIFRoaXMgbWVhbnMgdGhhdCB3aGVuIHdlXG4gICAqIGhhbmRsZSBhIGZvY3VzIGV2ZW50IGZvbGxvd2luZyBhIHRvdWNoIGludGVyYWN0aW9uLCB3ZSBuZWVkIHRvIGRldGVybWluZSB3aGV0aGVyICgxKSB0aGUgZm9jdXNcbiAgICogZXZlbnQgd2FzIGRpcmVjdGx5IGNhdXNlZCBieSB0aGUgdG91Y2ggaW50ZXJhY3Rpb24gb3IgKDIpIHRoZSBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGFcbiAgICogc3Vic2VxdWVudCBwcm9ncmFtbWF0aWMgZm9jdXMgY2FsbCB0cmlnZ2VyZWQgYnkgdGhlIHRvdWNoIGludGVyYWN0aW9uLlxuICAgKiBAcGFyYW0gZm9jdXNFdmVudFRhcmdldCBUaGUgdGFyZ2V0IG9mIHRoZSBmb2N1cyBldmVudCB1bmRlciBleGFtaW5hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEJlQXR0cmlidXRlZFRvVG91Y2goZm9jdXNFdmVudFRhcmdldDogSFRNTEVsZW1lbnQgfCBudWxsKTogYm9vbGVhbiB7XG4gICAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGNoZWNrIGlzIG5vdCBwZXJmZWN0LiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGVkZ2UgY2FzZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIj5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIHRhYmluZGV4PVwiMFwiIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIFN1cHBvc2UgdGhlcmUgaXMgYSBGb2N1c01vbml0b3IgaW4gSU1NRURJQVRFIG1vZGUgYXR0YWNoZWQgdG8gI3BhcmVudC4gV2hlbiB0aGUgdXNlciB0b3VjaGVzXG4gICAgLy8gI2NoaWxkLCAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZC4gVGhpcyBjb2RlIHdpbGwgYXR0cmlidXRlIHRoZSBmb2N1cyB0byB0b3VjaFxuICAgIC8vIGluc3RlYWQgb2YgcHJvZ3JhbS4gVGhpcyBpcyBhIHJlbGF0aXZlbHkgbWlub3IgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnQsICdwcm9ncmFtJykgdG8gZm9jdXMgI3BhcmVudC5cbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9PT0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5FVkVOVFVBTCB8fFxuICAgICAgISFmb2N1c0V2ZW50VGFyZ2V0Py5jb250YWlucyh0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IuX21vc3RSZWNlbnRUYXJnZXQpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2Nkay1mb2N1c2VkJywgISFvcmlnaW4pO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLXRvdWNoLWZvY3VzZWQnLCBvcmlnaW4gPT09ICd0b3VjaCcpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLW1vdXNlLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdtb3VzZScpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLXByb2dyYW0tZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3Byb2dyYW0nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBmb2N1cyBvcmlnaW4uIElmIHdlJ3JlIHVzaW5nIGltbWVkaWF0ZSBkZXRlY3Rpb24gbW9kZSwgd2Ugc2NoZWR1bGUgYW4gYXN5bmNcbiAgICogZnVuY3Rpb24gdG8gY2xlYXIgdGhlIG9yaWdpbiBhdCB0aGUgZW5kIG9mIGEgdGltZW91dC4gVGhlIGR1cmF0aW9uIG9mIHRoZSB0aW1lb3V0IGRlcGVuZHMgb25cbiAgICogdGhlIG9yaWdpbiBiZWluZyBzZXQuXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIG9yaWdpbiB0byBzZXQuXG4gICAqIEBwYXJhbSBpc0Zyb21JbnRlcmFjdGlvbiBXaGV0aGVyIHdlIGFyZSBzZXR0aW5nIHRoZSBvcmlnaW4gZnJvbSBhbiBpbnRlcmFjdGlvbiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgX3NldE9yaWdpbihvcmlnaW46IEZvY3VzT3JpZ2luLCBpc0Zyb21JbnRlcmFjdGlvbiA9IGZhbHNlKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICAgIHRoaXMuX29yaWdpbkZyb21Ub3VjaEludGVyYWN0aW9uID0gb3JpZ2luID09PSAndG91Y2gnICYmIGlzRnJvbUludGVyYWN0aW9uO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBpbiBJTU1FRElBVEUgbW9kZSwgcmVzZXQgdGhlIG9yaWdpbiBhdCB0aGUgbmV4dCB0aWNrIChvciBpbiBgVE9VQ0hfQlVGRkVSX01TYCBtc1xuICAgICAgLy8gZm9yIGEgdG91Y2ggZXZlbnQpLiBXZSByZXNldCB0aGUgb3JpZ2luIGF0IHRoZSBuZXh0IHRpY2sgYmVjYXVzZSBGaXJlZm94IGZvY3VzZXMgb25lIHRpY2tcbiAgICAgIC8vIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudC4gV2Ugd2FpdCBgVE9VQ0hfQlVGRkVSX01TYCBtcyBiZWZvcmUgcmVzZXR0aW5nIHRoZSBvcmlnaW4gZm9yXG4gICAgICAvLyBhIHRvdWNoIGV2ZW50IGJlY2F1c2Ugd2hlbiBhIHRvdWNoIGV2ZW50IGlzIGZpcmVkLCB0aGUgYXNzb2NpYXRlZCBmb2N1cyBldmVudCBpc24ndCB5ZXQgaW5cbiAgICAgIC8vIHRoZSBldmVudCBxdWV1ZS4gQmVmb3JlIGRvaW5nIHNvLCBjbGVhciBhbnkgcGVuZGluZyB0aW1lb3V0cy5cbiAgICAgIGlmICh0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICAgICAgY29uc3QgbXMgPSB0aGlzLl9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA/IFRPVUNIX0JVRkZFUl9NUyA6IDE7XG4gICAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gKHRoaXMuX29yaWdpbiA9IG51bGwpLCBtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmb2N1cyBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX29uRm9jdXMoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gTk9URShtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBzZXQgdGhlIGNsYXNzZXMgYmFzZWQgb24gdGhlIGZvY3VzIG9yaWdpbiBvZiB0aGUgbW9zdCByZWNlbnRcbiAgICAvLyBmb2N1cyBldmVudCBhZmZlY3RpbmcgdGhlIG1vbml0b3JlZCBlbGVtZW50LiBJZiB3ZSB3YW50IHRvIHVzZSB0aGUgb3JpZ2luIG9mIHRoZSBmaXJzdCBldmVudFxuICAgIC8vIGluc3RlYWQgd2Ugc2hvdWxkIGNoZWNrIGZvciB0aGUgY2RrLWZvY3VzZWQgY2xhc3MgaGVyZSBhbmQgcmV0dXJuIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzXG4gICAgLy8gaXQuIChUaGlzIG9ubHkgbWF0dGVycyBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGluY2x1ZGVzQ2hpbGRyZW4gPSB0cnVlKS5cblxuICAgIC8vIElmIHdlIGFyZSBub3QgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB0aGUgZXZlbnQgdGFyZ2V0IGlzIHRoZVxuICAgIC8vIG1vbml0b3JlZCBlbGVtZW50IGl0c2VsZi5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcbiAgICBjb25zdCBmb2N1c0V2ZW50VGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0PEhUTUxFbGVtZW50PihldmVudCk7XG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoIWVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZWxlbWVudCAhPT0gZm9jdXNFdmVudFRhcmdldCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vcmlnaW5DaGFuZ2VkKGVsZW1lbnQsIHRoaXMuX2dldEZvY3VzT3JpZ2luKGZvY3VzRXZlbnRUYXJnZXQpLCBlbGVtZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBibHVyIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBibHVyIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBfb25CbHVyKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHdlIGFyZSBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZW4ndCBqdXN0IGJsdXJyaW5nIGluXG4gICAgLy8gb3JkZXIgdG8gZm9jdXMgYW5vdGhlciBjaGlsZCBvZiB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoXG4gICAgICAhZWxlbWVudEluZm8gfHxcbiAgICAgIChlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmXG4gICAgICAgIGV2ZW50LnJlbGF0ZWRUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIGVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50KTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRPcmlnaW4oaW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8sIG9yaWdpbjogRm9jdXNPcmlnaW4pIHtcbiAgICBpZiAoaW5mby5zdWJqZWN0Lm9ic2VydmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gaW5mby5zdWJqZWN0Lm5leHQob3JpZ2luKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVnaXN0ZXJHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnRJbmZvLnJvb3ROb2RlO1xuICAgIGNvbnN0IHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPSB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5nZXQocm9vdE5vZGUpIHx8IDA7XG5cbiAgICBpZiAoIXJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ2ZvY3VzJyxcbiAgICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAnYmx1cicsXG4gICAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgKyAxKTtcblxuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT09IDEpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFRoZSBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IgaXMgYWxzbyBqdXN0IGEgY29sbGVjdGlvbiBvZiBnbG9iYWwgbGlzdGVuZXJzLlxuICAgICAgdGhpcy5faW5wdXRNb2RhbGl0eURldGVjdG9yLm1vZGFsaXR5RGV0ZWN0ZWRcbiAgICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX3N0b3BJbnB1dE1vZGFsaXR5RGV0ZWN0b3IpKVxuICAgICAgICAuc3Vic2NyaWJlKG1vZGFsaXR5ID0+IHtcbiAgICAgICAgICB0aGlzLl9zZXRPcmlnaW4obW9kYWxpdHksIHRydWUgLyogaXNGcm9tSW50ZXJhY3Rpb24gKi8pO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcblxuICAgIGlmICh0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5oYXMocm9vdE5vZGUpKSB7XG4gICAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSE7XG5cbiAgICAgIGlmIChyb290Tm9kZUZvY3VzTGlzdGVuZXJzID4gMSkge1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgLSAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgJ2ZvY3VzJyxcbiAgICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgICAgcm9vdE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAnYmx1cicsXG4gICAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMsXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmRlbGV0ZShyb290Tm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVW5yZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gbGFzdCBlbGVtZW50IGlzIHVubW9uaXRvcmVkLlxuICAgIGlmICghLS10aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQpIHtcbiAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG5cbiAgICAgIC8vIEVxdWl2YWxlbnRseSwgc3RvcCBvdXIgSW5wdXRNb2RhbGl0eURldGVjdG9yIHN1YnNjcmlwdGlvbi5cbiAgICAgIHRoaXMuX3N0b3BJbnB1dE1vZGFsaXR5RGV0ZWN0b3IubmV4dCgpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX29yaWdpblRpbWVvdXRJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZXMgYWxsIHRoZSBzdGF0ZSBvbiBhbiBlbGVtZW50IG9uY2UgaXRzIGZvY3VzIG9yaWdpbiBoYXMgY2hhbmdlZC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luQ2hhbmdlZChcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgIGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyxcbiAgKSB7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8sIG9yaWdpbik7XG4gICAgdGhpcy5fbGFzdEZvY3VzT3JpZ2luID0gb3JpZ2luO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbGxlY3RzIHRoZSBgTW9uaXRvcmVkRWxlbWVudEluZm9gIG9mIGEgcGFydGljdWxhciBlbGVtZW50IGFuZFxuICAgKiBhbGwgb2YgaXRzIGFuY2VzdG9ycyB0aGF0IGhhdmUgZW5hYmxlZCBgY2hlY2tDaGlsZHJlbmAuXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgZnJvbSB3aGljaCB0byBzdGFydCB0aGUgc2VhcmNoLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0Q2xvc2VzdEVsZW1lbnRzSW5mbyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IFtIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm9dW10ge1xuICAgIGNvbnN0IHJlc3VsdHM6IFtIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm9dW10gPSBbXTtcblxuICAgIHRoaXMuX2VsZW1lbnRJbmZvLmZvckVhY2goKGluZm8sIGN1cnJlbnRFbGVtZW50KSA9PiB7XG4gICAgICBpZiAoY3VycmVudEVsZW1lbnQgPT09IGVsZW1lbnQgfHwgKGluZm8uY2hlY2tDaGlsZHJlbiAmJiBjdXJyZW50RWxlbWVudC5jb250YWlucyhlbGVtZW50KSkpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKFtjdXJyZW50RWxlbWVudCwgaW5mb10pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGFuIGludGVyYWN0aW9uIGlzIGxpa2VseSB0byBoYXZlIGNvbWUgZnJvbSB0aGUgdXNlciBjbGlja2luZyB0aGUgYGxhYmVsYCBvZlxuICAgKiBhbiBgaW5wdXRgIG9yIGB0ZXh0YXJlYWAgaW4gb3JkZXIgdG8gZm9jdXMgaXQuXG4gICAqIEBwYXJhbSBmb2N1c0V2ZW50VGFyZ2V0IFRhcmdldCBjdXJyZW50bHkgcmVjZWl2aW5nIGZvY3VzLlxuICAgKi9cbiAgcHJpdmF0ZSBfaXNMYXN0SW50ZXJhY3Rpb25Gcm9tSW5wdXRMYWJlbChmb2N1c0V2ZW50VGFyZ2V0OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHtfbW9zdFJlY2VudFRhcmdldDogbW9zdFJlY2VudFRhcmdldCwgbW9zdFJlY2VudE1vZGFsaXR5fSA9IHRoaXMuX2lucHV0TW9kYWxpdHlEZXRlY3RvcjtcblxuICAgIC8vIElmIHRoZSBsYXN0IGludGVyYWN0aW9uIHVzZWQgdGhlIG1vdXNlIG9uIGFuIGVsZW1lbnQgY29udGFpbmVkIGJ5IG9uZSBvZiB0aGUgbGFiZWxzXG4gICAgLy8gb2YgYW4gYGlucHV0YC9gdGV4dGFyZWFgIHRoYXQgaXMgY3VycmVudGx5IGZvY3VzZWQsIGl0IGlzIHZlcnkgbGlrZWx5IHRoYXQgdGhlXG4gICAgLy8gdXNlciByZWRpcmVjdGVkIGZvY3VzIHVzaW5nIHRoZSBsYWJlbC5cbiAgICBpZiAoXG4gICAgICBtb3N0UmVjZW50TW9kYWxpdHkgIT09ICdtb3VzZScgfHxcbiAgICAgICFtb3N0UmVjZW50VGFyZ2V0IHx8XG4gICAgICBtb3N0UmVjZW50VGFyZ2V0ID09PSBmb2N1c0V2ZW50VGFyZ2V0IHx8XG4gICAgICAoZm9jdXNFdmVudFRhcmdldC5ub2RlTmFtZSAhPT0gJ0lOUFVUJyAmJiBmb2N1c0V2ZW50VGFyZ2V0Lm5vZGVOYW1lICE9PSAnVEVYVEFSRUEnKSB8fFxuICAgICAgKGZvY3VzRXZlbnRUYXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQpLmRpc2FibGVkXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbGFiZWxzID0gKGZvY3VzRXZlbnRUYXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQpLmxhYmVscztcblxuICAgIGlmIChsYWJlbHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChsYWJlbHNbaV0uY29udGFpbnMobW9zdFJlY2VudFRhcmdldCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbiAgZXhwb3J0QXM6ICdjZGtNb25pdG9yRm9jdXMnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNb25pdG9yRm9jdXMgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIHByaXZhdGUgX2ZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGNka0ZvY3VzQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxGb2N1c09yaWdpbj4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgcHJpdmF0ZSBfZm9jdXNNb25pdG9yOiBGb2N1c01vbml0b3IpIHt9XG5cbiAgZ2V0IGZvY3VzT3JpZ2luKCk6IEZvY3VzT3JpZ2luIHtcbiAgICByZXR1cm4gdGhpcy5fZm9jdXNPcmlnaW47XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yXG4gICAgICAubW9uaXRvcihlbGVtZW50LCBlbGVtZW50Lm5vZGVUeXBlID09PSAxICYmIGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB7XG4gICAgICAgIHRoaXMuX2ZvY3VzT3JpZ2luID0gb3JpZ2luO1xuICAgICAgICB0aGlzLmNka0ZvY3VzQ2hhbmdlLmVtaXQob3JpZ2luKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuXG4gICAgaWYgKHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==