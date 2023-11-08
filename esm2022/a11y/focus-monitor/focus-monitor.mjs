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
/** Detection mode used for attributing the origin of a focus event. */
export var FocusMonitorDetectionMode;
(function (FocusMonitorDetectionMode) {
    /**
     * Any mousedown, keydown, or touchstart event that happened in the previous
     * tick or the current tick will be used to assign a focus event's origin (to
     * either mouse, keyboard, or touch). This is the default option.
     */
    FocusMonitorDetectionMode[FocusMonitorDetectionMode["IMMEDIATE"] = 0] = "IMMEDIATE";
    /**
     * A focus event's origin is always attributed to the last corresponding
     * mousedown, keydown, or touchstart event, no matter how long ago it occurred.
     */
    FocusMonitorDetectionMode[FocusMonitorDetectionMode["EVENTUAL"] = 1] = "EVENTUAL";
})(FocusMonitorDetectionMode || (FocusMonitorDetectionMode = {}));
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
        this._detectionMode = options?.detectionMode || FocusMonitorDetectionMode.IMMEDIATE;
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
        return (this._detectionMode === FocusMonitorDetectionMode.EVENTUAL ||
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
            if (this._detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: FocusMonitor, deps: [{ token: i0.NgZone }, { token: i1.Platform }, { token: i2.InputModalityDetector }, { token: DOCUMENT, optional: true }, { token: FOCUS_MONITOR_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: FocusMonitor, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: FocusMonitor, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: i0.NgZone }, { type: i1.Platform }, { type: i2.InputModalityDetector }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [FOCUS_MONITOR_DEFAULT_OPTIONS]
                }] }] });
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkMonitorFocus, deps: [{ token: i0.ElementRef }, { token: FocusMonitor }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.0", type: CdkMonitorFocus, selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]", outputs: { cdkFocusChange: "cdkFocusChange" }, exportAs: ["cdkMonitorFocus"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkMonitorFocus, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
                    exportAs: 'cdkMonitorFocus',
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: FocusMonitor }], propDecorators: { cdkFocusChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFFBQVEsRUFDUiwrQkFBK0IsRUFDL0IsY0FBYyxFQUNkLGVBQWUsR0FDaEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQzs7OztBQWFqRyx1RUFBdUU7QUFDdkUsTUFBTSxDQUFOLElBQVkseUJBWVg7QUFaRCxXQUFZLHlCQUF5QjtJQUNuQzs7OztPQUlHO0lBQ0gsbUZBQVMsQ0FBQTtJQUNUOzs7T0FHRztJQUNILGlGQUFRLENBQUE7QUFDVixDQUFDLEVBWlcseUJBQXlCLEtBQXpCLHlCQUF5QixRQVlwQztBQU9ELDhDQUE4QztBQUM5QyxNQUFNLENBQUMsTUFBTSw2QkFBNkIsR0FBRyxJQUFJLGNBQWMsQ0FDN0QsbUNBQW1DLENBQ3BDLENBQUM7QUFRRjs7O0dBR0c7QUFDSCxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lB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QztRQUMvQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGFBQWE7YUFDM0MsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLENBQUM7YUFDMUYsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1lBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFcEQsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ3pDO0lBQ0gsQ0FBQzs4R0EvQlUsZUFBZTtrR0FBZixlQUFlOzsyRkFBZixlQUFlO2tCQUozQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvREFBb0Q7b0JBQzlELFFBQVEsRUFBRSxpQkFBaUI7aUJBQzVCO3VHQUtvQixjQUFjO3NCQUFoQyxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIFBsYXRmb3JtLFxuICBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zLFxuICBfZ2V0U2hhZG93Um9vdCxcbiAgX2dldEV2ZW50VGFyZ2V0LFxufSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0lucHV0TW9kYWxpdHlEZXRlY3RvciwgVE9VQ0hfQlVGRkVSX01TfSBmcm9tICcuLi9pbnB1dC1tb2RhbGl0eS9pbnB1dC1tb2RhbGl0eS1kZXRlY3Rvcic7XG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxuLyoqIERldGVjdGlvbiBtb2RlIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1cyBldmVudC4gKi9cbmV4cG9ydCBlbnVtIEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogQW55IG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCB0aGF0IGhhcHBlbmVkIGluIHRoZSBwcmV2aW91c1xuICAgKiB0aWNrIG9yIHRoZSBjdXJyZW50IHRpY2sgd2lsbCBiZSB1c2VkIHRvIGFzc2lnbiBhIGZvY3VzIGV2ZW50J3Mgb3JpZ2luICh0b1xuICAgKiBlaXRoZXIgbW91c2UsIGtleWJvYXJkLCBvciB0b3VjaCkuIFRoaXMgaXMgdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgKi9cbiAgSU1NRURJQVRFLFxuICAvKipcbiAgICogQSBmb2N1cyBldmVudCdzIG9yaWdpbiBpcyBhbHdheXMgYXR0cmlidXRlZCB0byB0aGUgbGFzdCBjb3JyZXNwb25kaW5nXG4gICAqIG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCwgbm8gbWF0dGVyIGhvdyBsb25nIGFnbyBpdCBvY2N1cnJlZC5cbiAgICovXG4gIEVWRU5UVUFMLFxufVxuXG4vKiogSW5qZWN0YWJsZSBzZXJ2aWNlLWxldmVsIG9wdGlvbnMgZm9yIEZvY3VzTW9uaXRvci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNNb25pdG9yT3B0aW9ucyB7XG4gIGRldGVjdGlvbk1vZGU/OiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xufVxuXG4vKiogSW5qZWN0aW9uVG9rZW4gZm9yIEZvY3VzTW9uaXRvck9wdGlvbnMuICovXG5leHBvcnQgY29uc3QgRk9DVVNfTU9OSVRPUl9ERUZBVUxUX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oXG4gICdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnLFxuKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj47XG4gIHJvb3ROb2RlOiBIVE1MRWxlbWVudCB8IFNoYWRvd1Jvb3QgfCBEb2N1bWVudDtcbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlLFxufSk7XG5cbi8qKiBNb25pdG9ycyBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzIHRvIGRldGVybWluZSB0aGUgY2F1c2Ugb2YgZm9jdXMgZXZlbnRzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNNb25pdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBmb2N1cyBvcmlnaW4gdGhhdCB0aGUgbmV4dCBmb2N1cyBldmVudCBpcyBhIHJlc3VsdCBvZi4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgLyoqIFRoZSBGb2N1c09yaWdpbiBvZiB0aGUgbGFzdCBmb2N1cyBldmVudCB0cmFja2VkIGJ5IHRoZSBGb2N1c01vbml0b3IuICovXG4gIHByaXZhdGUgX2xhc3RGb2N1c09yaWdpbjogRm9jdXNPcmlnaW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdpbmRvdyBoYXMganVzdCBiZWVuIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZTtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHdpbmRvdyBmb2N1cyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c1RpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgb3JpZ2luIGNsZWFyaW5nIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX29yaWdpblRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvcmlnaW4gd2FzIGRldGVybWluZWQgdmlhIGEgdG91Y2ggaW50ZXJhY3Rpb24uIE5lY2Vzc2FyeSBhcyBwcm9wZXJseSBhdHRyaWJ1dGluZ1xuICAgKiBmb2N1cyBldmVudHMgdG8gdG91Y2ggaW50ZXJhY3Rpb25zIHJlcXVpcmVzIHNwZWNpYWwgbG9naWMuXG4gICAqL1xuICBwcml2YXRlIF9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA9IGZhbHNlO1xuXG4gIC8qKiBNYXAgb2YgZWxlbWVudHMgYmVpbmcgbW9uaXRvcmVkIHRvIHRoZWlyIGluZm8uICovXG4gIHByaXZhdGUgX2VsZW1lbnRJbmZvID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IGJlaW5nIG1vbml0b3JlZC4gKi9cbiAgcHJpdmF0ZSBfbW9uaXRvcmVkRWxlbWVudENvdW50ID0gMDtcblxuICAvKipcbiAgICogS2VlcHMgdHJhY2sgb2YgdGhlIHJvb3Qgbm9kZXMgdG8gd2hpY2ggd2UndmUgY3VycmVudGx5IGJvdW5kIGEgZm9jdXMvYmx1ciBoYW5kbGVyLFxuICAgKiBhcyB3ZWxsIGFzIHRoZSBudW1iZXIgb2YgbW9uaXRvcmVkIGVsZW1lbnRzIHRoYXQgdGhleSBjb250YWluLiBXZSBoYXZlIHRvIHRyZWF0IGZvY3VzL2JsdXJcbiAgICogaGFuZGxlcnMgZGlmZmVyZW50bHkgZnJvbSB0aGUgcmVzdCBvZiB0aGUgZXZlbnRzLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZXZlbnRzXG4gICAqIHRvIHRoZSBkb2N1bWVudCB3aGVuIGZvY3VzIG1vdmVzIGluc2lkZSBvZiBhIHNoYWRvdyByb290LlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQgPSBuZXcgTWFwPEhUTUxFbGVtZW50IHwgRG9jdW1lbnQgfCBTaGFkb3dSb290LCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+ICh0aGlzLl93aW5kb3dGb2N1c2VkID0gZmFsc2UpKTtcbiAgfTtcblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIC8qKiBTdWJqZWN0IGZvciBzdG9wcGluZyBvdXIgSW5wdXRNb2RhbGl0eURldGVjdG9yIHN1YnNjcmlwdGlvbi4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfc3RvcElucHV0TW9kYWxpdHlEZXRlY3RvciA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lucHV0TW9kYWxpdHlEZXRlY3RvcjogSW5wdXRNb2RhbGl0eURldGVjdG9yLFxuICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSB8IG51bGwsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUykgb3B0aW9uczogRm9jdXNNb25pdG9yT3B0aW9ucyB8IG51bGwsXG4gICkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9IG9wdGlvbnM/LmRldGVjdGlvbk1vZGUgfHwgRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEU7XG4gIH1cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGFuZCAnYmx1cicgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lciA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQ8SFRNTEVsZW1lbnQ+KGV2ZW50KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gd2FsayB1cCB0aGUgYW5jZXN0b3IgY2hhaW4gaW4gb3JkZXIgdG8gc3VwcG9ydCBgY2hlY2tDaGlsZHJlbmAuXG4gICAgZm9yIChsZXQgZWxlbWVudCA9IHRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdmb2N1cycpIHtcbiAgICAgICAgdGhpcy5fb25Gb2N1cyhldmVudCBhcyBGb2N1c0V2ZW50LCBlbGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX29uQmx1cihldmVudCBhcyBGb2N1c0V2ZW50LCBlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlLFxuICApOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPiB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIHdlJ3JlIG5vdCBvbiB0aGUgYnJvd3NlciBwbGF0Zm9ybSBvciB0aGUgcGFzc2VkIGluIG5vZGUgaXNuJ3QgYW4gZWxlbWVudC5cbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciB8fCBuYXRpdmVFbGVtZW50Lm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICAvLyBOb3RlOiB3ZSBkb24ndCB3YW50IHRoZSBvYnNlcnZhYmxlIHRvIGVtaXQgYXQgYWxsIHNvIHdlIGRvbid0IHBhc3MgYW55IHBhcmFtZXRlcnMuXG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgaW5zaWRlIHRoZSBzaGFkb3cgRE9NLCB3ZSBuZWVkIHRvIGJpbmQgb3VyIGZvY3VzL2JsdXIgbGlzdGVuZXJzIHRvXG4gICAgLy8gdGhlIHNoYWRvdyByb290LCByYXRoZXIgdGhhbiB0aGUgYGRvY3VtZW50YCwgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGZvY3VzIGV2ZW50c1xuICAgIC8vIHRvIHRoZSBgZG9jdW1lbnRgLCBpZiBmb2N1cyBpcyBtb3Zpbmcgd2l0aGluIHRoZSBzYW1lIHNoYWRvdyByb290LlxuICAgIGNvbnN0IHJvb3ROb2RlID0gX2dldFNoYWRvd1Jvb3QobmF0aXZlRWxlbWVudCkgfHwgdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICBjb25zdCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAoY2FjaGVkSW5mbykge1xuICAgICAgaWYgKGNoZWNrQ2hpbGRyZW4pIHtcbiAgICAgICAgLy8gVE9ETyhDT01QLTMxOCk6IHRoaXMgY2FuIGJlIHByb2JsZW1hdGljLCBiZWNhdXNlIGl0J2xsIHR1cm4gYWxsIG5vbi1jaGVja0NoaWxkcmVuXG4gICAgICAgIC8vIG9ic2VydmVycyBpbnRvIG9uZXMgdGhhdCBiZWhhdmUgYXMgaWYgYGNoZWNrQ2hpbGRyZW5gIHdhcyB0dXJuZWQgb24uIFdlIG5lZWQgYSBtb3JlXG4gICAgICAgIC8vIHJvYnVzdCBzb2x1dGlvbi5cbiAgICAgICAgY2FjaGVkSW5mby5jaGVja0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZEluZm8uc3ViamVjdDtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBjb25zdCBpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgICAgIGNoZWNrQ2hpbGRyZW46IGNoZWNrQ2hpbGRyZW4sXG4gICAgICBzdWJqZWN0OiBuZXcgU3ViamVjdDxGb2N1c09yaWdpbj4oKSxcbiAgICAgIHJvb3ROb2RlLFxuICAgIH07XG4gICAgdGhpcy5fZWxlbWVudEluZm8uc2V0KG5hdGl2ZUVsZW1lbnQsIGluZm8pO1xuICAgIHRoaXMuX3JlZ2lzdGVyR2xvYmFsTGlzdGVuZXJzKGluZm8pO1xuXG4gICAgcmV0dXJuIGluZm8uc3ViamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnRJbmZvKSB7XG4gICAgICBlbGVtZW50SW5mby5zdWJqZWN0LmNvbXBsZXRlKCk7XG5cbiAgICAgIHRoaXMuX3NldENsYXNzZXMobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9lbGVtZW50SW5mby5kZWxldGUobmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBlbGVtZW50IHZpYSB0aGUgc3BlY2lmaWVkIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmb2N1cy5cbiAgICogQHBhcmFtIG9yaWdpbiBGb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGZvY3VzIGJlaGF2aW9yLlxuICAgKi9cbiAgZm9jdXNWaWEoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIG9yaWdpbjogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkO1xuXG4gIGZvY3VzVmlhKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgb3JpZ2luOiBGb2N1c09yaWdpbixcbiAgICBvcHRpb25zPzogRm9jdXNPcHRpb25zLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IHRoaXMuX2dldERvY3VtZW50KCkuYWN0aXZlRWxlbWVudDtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGZvY3VzZWQgYWxyZWFkeSwgY2FsbGluZyBgZm9jdXNgIGFnYWluIHdvbid0IHRyaWdnZXIgdGhlIGV2ZW50IGxpc3RlbmVyXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhhdCB0aGUgZm9jdXMgY2xhc3NlcyB3b24ndCBiZSB1cGRhdGVkLiBJZiB0aGF0J3MgdGhlIGNhc2UsIHVwZGF0ZSB0aGUgY2xhc3Nlc1xuICAgIC8vIGRpcmVjdGx5IHdpdGhvdXQgd2FpdGluZyBmb3IgYW4gZXZlbnQuXG4gICAgaWYgKG5hdGl2ZUVsZW1lbnQgPT09IGZvY3VzZWRFbGVtZW50KSB7XG4gICAgICB0aGlzLl9nZXRDbG9zZXN0RWxlbWVudHNJbmZvKG5hdGl2ZUVsZW1lbnQpLmZvckVhY2goKFtjdXJyZW50RWxlbWVudCwgaW5mb10pID0+XG4gICAgICAgIHRoaXMuX29yaWdpbkNoYW5nZWQoY3VycmVudEVsZW1lbnQsIG9yaWdpbiwgaW5mbyksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZXRPcmlnaW4ob3JpZ2luKTtcblxuICAgICAgLy8gYGZvY3VzYCBpc24ndCBhdmFpbGFibGUgb24gdGhlIHNlcnZlclxuICAgICAgaWYgKHR5cGVvZiBuYXRpdmVFbGVtZW50LmZvY3VzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG5hdGl2ZUVsZW1lbnQuZm9jdXMob3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoX2luZm8sIGVsZW1lbnQpID0+IHRoaXMuc3RvcE1vbml0b3JpbmcoZWxlbWVudCkpO1xuICB9XG5cbiAgLyoqIEFjY2VzcyBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIGRvY3VtZW50IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXREb2N1bWVudCgpOiBEb2N1bWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvY3VtZW50IHx8IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqIFVzZSBkZWZhdWx0VmlldyBvZiBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIHdpbmRvdyByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0V2luZG93KCk6IFdpbmRvdyB7XG4gICAgY29uc3QgZG9jID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICByZXR1cm4gZG9jLmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgfVxuXG4gIHByaXZhdGUgX2dldEZvY3VzT3JpZ2luKGZvY3VzRXZlbnRUYXJnZXQ6IEhUTUxFbGVtZW50IHwgbnVsbCk6IEZvY3VzT3JpZ2luIHtcbiAgICBpZiAodGhpcy5fb3JpZ2luKSB7XG4gICAgICAvLyBJZiB0aGUgb3JpZ2luIHdhcyByZWFsaXplZCB2aWEgYSB0b3VjaCBpbnRlcmFjdGlvbiwgd2UgbmVlZCB0byBwZXJmb3JtIGFkZGl0aW9uYWwgY2hlY2tzXG4gICAgICAvLyB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgZm9jdXMgb3JpZ2luIHNob3VsZCBiZSBhdHRyaWJ1dGVkIHRvIHRvdWNoIG9yIHByb2dyYW0uXG4gICAgICBpZiAodGhpcy5fb3JpZ2luRnJvbVRvdWNoSW50ZXJhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Nob3VsZEJlQXR0cmlidXRlZFRvVG91Y2goZm9jdXNFdmVudFRhcmdldCkgPyAndG91Y2gnIDogJ3Byb2dyYW0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX29yaWdpbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgd2luZG93IGhhcyBqdXN0IHJlZ2FpbmVkIGZvY3VzLCB3ZSBjYW4gcmVzdG9yZSB0aGUgbW9zdCByZWNlbnQgb3JpZ2luIGZyb20gYmVmb3JlIHRoZVxuICAgIC8vIHdpbmRvdyBibHVycmVkLiBPdGhlcndpc2UsIHdlJ3ZlIHJlYWNoZWQgdGhlIHBvaW50IHdoZXJlIHdlIGNhbid0IGlkZW50aWZ5IHRoZSBzb3VyY2Ugb2YgdGhlXG4gICAgLy8gZm9jdXMuIFRoaXMgdHlwaWNhbGx5IG1lYW5zIG9uZSBvZiB0d28gdGhpbmdzIGhhcHBlbmVkOlxuICAgIC8vXG4gICAgLy8gMSkgVGhlIGVsZW1lbnQgd2FzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZCwgb3JcbiAgICAvLyAyKSBUaGUgZWxlbWVudCB3YXMgZm9jdXNlZCB2aWEgc2NyZWVuIHJlYWRlciBuYXZpZ2F0aW9uICh3aGljaCBnZW5lcmFsbHkgZG9lc24ndCBmaXJlXG4gICAgLy8gICAgZXZlbnRzKS5cbiAgICAvL1xuICAgIC8vIEJlY2F1c2Ugd2UgY2FuJ3QgZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVzZSB0d28gY2FzZXMsIHdlIGRlZmF1bHQgdG8gc2V0dGluZyBgcHJvZ3JhbWAuXG4gICAgaWYgKHRoaXMuX3dpbmRvd0ZvY3VzZWQgJiYgdGhpcy5fbGFzdEZvY3VzT3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGFzdEZvY3VzT3JpZ2luO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBpbnRlcmFjdGlvbiBpcyBjb21pbmcgZnJvbSBhbiBpbnB1dCBsYWJlbCwgd2UgY29uc2lkZXIgaXQgYSBtb3VzZSBpbnRlcmFjdGlvbnMuXG4gICAgLy8gVGhpcyBpcyBhIHNwZWNpYWwgY2FzZSB3aGVyZSBmb2N1cyBtb3ZlcyBvbiBgY2xpY2tgLCByYXRoZXIgdGhhbiBgbW91c2Vkb3duYCB3aGljaCBicmVha3NcbiAgICAvLyBvdXIgZGV0ZWN0aW9uLCBiZWNhdXNlIGFsbCBvdXIgYXNzdW1wdGlvbnMgYXJlIGZvciBgbW91c2Vkb3duYC4gV2UgbmVlZCB0byBoYW5kbGUgdGhpc1xuICAgIC8vIHNwZWNpYWwgY2FzZSwgYmVjYXVzZSBpdCdzIHZlcnkgY29tbW9uIGZvciBjaGVja2JveGVzIGFuZCByYWRpbyBidXR0b25zLlxuICAgIGlmIChmb2N1c0V2ZW50VGFyZ2V0ICYmIHRoaXMuX2lzTGFzdEludGVyYWN0aW9uRnJvbUlucHV0TGFiZWwoZm9jdXNFdmVudFRhcmdldCkpIHtcbiAgICAgIHJldHVybiAnbW91c2UnO1xuICAgIH1cblxuICAgIHJldHVybiAncHJvZ3JhbSc7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBmb2N1cyBldmVudCBzaG91bGQgYmUgYXR0cmlidXRlZCB0byB0b3VjaC4gUmVjYWxsIHRoYXQgaW4gSU1NRURJQVRFIG1vZGUsIGFcbiAgICogdG91Y2ggb3JpZ2luIGlzbid0IGltbWVkaWF0ZWx5IHJlc2V0IGF0IHRoZSBuZXh0IHRpY2sgKHNlZSBfc2V0T3JpZ2luKS4gVGhpcyBtZWFucyB0aGF0IHdoZW4gd2VcbiAgICogaGFuZGxlIGEgZm9jdXMgZXZlbnQgZm9sbG93aW5nIGEgdG91Y2ggaW50ZXJhY3Rpb24sIHdlIG5lZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgKDEpIHRoZSBmb2N1c1xuICAgKiBldmVudCB3YXMgZGlyZWN0bHkgY2F1c2VkIGJ5IHRoZSB0b3VjaCBpbnRlcmFjdGlvbiBvciAoMikgdGhlIGZvY3VzIGV2ZW50IHdhcyBjYXVzZWQgYnkgYVxuICAgKiBzdWJzZXF1ZW50IHByb2dyYW1tYXRpYyBmb2N1cyBjYWxsIHRyaWdnZXJlZCBieSB0aGUgdG91Y2ggaW50ZXJhY3Rpb24uXG4gICAqIEBwYXJhbSBmb2N1c0V2ZW50VGFyZ2V0IFRoZSB0YXJnZXQgb2YgdGhlIGZvY3VzIGV2ZW50IHVuZGVyIGV4YW1pbmF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2hvdWxkQmVBdHRyaWJ1dGVkVG9Ub3VjaChmb2N1c0V2ZW50VGFyZ2V0OiBIVE1MRWxlbWVudCB8IG51bGwpOiBib29sZWFuIHtcbiAgICAvLyBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgY2hlY2sgaXMgbm90IHBlcmZlY3QuIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgZWRnZSBjYXNlOlxuICAgIC8vXG4gICAgLy8gPGRpdiAjcGFyZW50IHRhYmluZGV4PVwiMFwiPlxuICAgIC8vICAgPGRpdiAjY2hpbGQgdGFiaW5kZXg9XCIwXCIgKGNsaWNrKT1cIiNwYXJlbnQuZm9jdXMoKVwiPjwvZGl2PlxuICAgIC8vIDwvZGl2PlxuICAgIC8vXG4gICAgLy8gU3VwcG9zZSB0aGVyZSBpcyBhIEZvY3VzTW9uaXRvciBpbiBJTU1FRElBVEUgbW9kZSBhdHRhY2hlZCB0byAjcGFyZW50LiBXaGVuIHRoZSB1c2VyIHRvdWNoZXNcbiAgICAvLyAjY2hpbGQsICNwYXJlbnQgaXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkLiBUaGlzIGNvZGUgd2lsbCBhdHRyaWJ1dGUgdGhlIGZvY3VzIHRvIHRvdWNoXG4gICAgLy8gaW5zdGVhZCBvZiBwcm9ncmFtLiBUaGlzIGlzIGEgcmVsYXRpdmVseSBtaW5vciBlZGdlLWNhc2UgdGhhdCBjYW4gYmUgd29ya2VkIGFyb3VuZCBieSB1c2luZ1xuICAgIC8vIGZvY3VzVmlhKHBhcmVudCwgJ3Byb2dyYW0nKSB0byBmb2N1cyAjcGFyZW50LlxuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLkVWRU5UVUFMIHx8XG4gICAgICAhIWZvY3VzRXZlbnRUYXJnZXQ/LmNvbnRhaW5zKHRoaXMuX2lucHV0TW9kYWxpdHlEZXRlY3Rvci5fbW9zdFJlY2VudFRhcmdldClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvY3VzIGNsYXNzZXMgb24gdGhlIGVsZW1lbnQgYmFzZWQgb24gdGhlIGdpdmVuIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdXBkYXRlIHRoZSBjbGFzc2VzIG9uLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBmb2N1cyBvcmlnaW4uXG4gICAqL1xuICBwcml2YXRlIF9zZXRDbGFzc2VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW4/OiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY2RrLWZvY3VzZWQnLCAhIW9yaWdpbik7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdjZGstdG91Y2gtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3RvdWNoJyk7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdjZGsta2V5Ym9hcmQtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ2tleWJvYXJkJyk7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdjZGstbW91c2UtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ21vdXNlJyk7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdjZGstcHJvZ3JhbS1mb2N1c2VkJywgb3JpZ2luID09PSAncHJvZ3JhbScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGZvY3VzIG9yaWdpbi4gSWYgd2UncmUgdXNpbmcgaW1tZWRpYXRlIGRldGVjdGlvbiBtb2RlLCB3ZSBzY2hlZHVsZSBhbiBhc3luY1xuICAgKiBmdW5jdGlvbiB0byBjbGVhciB0aGUgb3JpZ2luIGF0IHRoZSBlbmQgb2YgYSB0aW1lb3V0LiBUaGUgZHVyYXRpb24gb2YgdGhlIHRpbWVvdXQgZGVwZW5kcyBvblxuICAgKiB0aGUgb3JpZ2luIGJlaW5nIHNldC5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgb3JpZ2luIHRvIHNldC5cbiAgICogQHBhcmFtIGlzRnJvbUludGVyYWN0aW9uIFdoZXRoZXIgd2UgYXJlIHNldHRpbmcgdGhlIG9yaWdpbiBmcm9tIGFuIGludGVyYWN0aW9uIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0T3JpZ2luKG9yaWdpbjogRm9jdXNPcmlnaW4sIGlzRnJvbUludGVyYWN0aW9uID0gZmFsc2UpOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuICAgICAgdGhpcy5fb3JpZ2luRnJvbVRvdWNoSW50ZXJhY3Rpb24gPSBvcmlnaW4gPT09ICd0b3VjaCcgJiYgaXNGcm9tSW50ZXJhY3Rpb247XG5cbiAgICAgIC8vIElmIHdlJ3JlIGluIElNTUVESUFURSBtb2RlLCByZXNldCB0aGUgb3JpZ2luIGF0IHRoZSBuZXh0IHRpY2sgKG9yIGluIGBUT1VDSF9CVUZGRVJfTVNgIG1zXG4gICAgICAvLyBmb3IgYSB0b3VjaCBldmVudCkuIFdlIHJlc2V0IHRoZSBvcmlnaW4gYXQgdGhlIG5leHQgdGljayBiZWNhdXNlIEZpcmVmb3ggZm9jdXNlcyBvbmUgdGlja1xuICAgICAgLy8gYWZ0ZXIgdGhlIGludGVyYWN0aW9uIGV2ZW50LiBXZSB3YWl0IGBUT1VDSF9CVUZGRVJfTVNgIG1zIGJlZm9yZSByZXNldHRpbmcgdGhlIG9yaWdpbiBmb3JcbiAgICAgIC8vIGEgdG91Y2ggZXZlbnQgYmVjYXVzZSB3aGVuIGEgdG91Y2ggZXZlbnQgaXMgZmlyZWQsIHRoZSBhc3NvY2lhdGVkIGZvY3VzIGV2ZW50IGlzbid0IHlldCBpblxuICAgICAgLy8gdGhlIGV2ZW50IHF1ZXVlLiBCZWZvcmUgZG9pbmcgc28sIGNsZWFyIGFueSBwZW5kaW5nIHRpbWVvdXRzLlxuICAgICAgaWYgKHRoaXMuX2RldGVjdGlvbk1vZGUgPT09IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgICAgICBjb25zdCBtcyA9IHRoaXMuX29yaWdpbkZyb21Ub3VjaEludGVyYWN0aW9uID8gVE9VQ0hfQlVGRkVSX01TIDogMTtcbiAgICAgICAgdGhpcy5fb3JpZ2luVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiAodGhpcy5fb3JpZ2luID0gbnVsbCksIG1zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGZvY3VzIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBmb2N1cyBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfb25Gb2N1cyhldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBOT1RFKG1tYWxlcmJhKTogV2UgY3VycmVudGx5IHNldCB0aGUgY2xhc3NlcyBiYXNlZCBvbiB0aGUgZm9jdXMgb3JpZ2luIG9mIHRoZSBtb3N0IHJlY2VudFxuICAgIC8vIGZvY3VzIGV2ZW50IGFmZmVjdGluZyB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuIElmIHdlIHdhbnQgdG8gdXNlIHRoZSBvcmlnaW4gb2YgdGhlIGZpcnN0IGV2ZW50XG4gICAgLy8gaW5zdGVhZCB3ZSBzaG91bGQgY2hlY2sgZm9yIHRoZSBjZGstZm9jdXNlZCBjbGFzcyBoZXJlIGFuZCByZXR1cm4gaWYgdGhlIGVsZW1lbnQgYWxyZWFkeSBoYXNcbiAgICAvLyBpdC4gKFRoaXMgb25seSBtYXR0ZXJzIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgaW5jbHVkZXNDaGlsZHJlbiA9IHRydWUpLlxuXG4gICAgLy8gSWYgd2UgYXJlIG5vdCBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHRoZSBldmVudCB0YXJnZXQgaXMgdGhlXG4gICAgLy8gbW9uaXRvcmVkIGVsZW1lbnQgaXRzZWxmLlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuICAgIGNvbnN0IGZvY3VzRXZlbnRUYXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQ8SFRNTEVsZW1lbnQ+KGV2ZW50KTtcbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8ICghZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBlbGVtZW50ICE9PSBmb2N1c0V2ZW50VGFyZ2V0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX29yaWdpbkNoYW5nZWQoZWxlbWVudCwgdGhpcy5fZ2V0Rm9jdXNPcmlnaW4oZm9jdXNFdmVudFRhcmdldCksIGVsZW1lbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGJsdXIgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIF9vbkJsdXIoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgYXJlbid0IGp1c3QgYmx1cnJpbmcgaW5cbiAgICAvLyBvcmRlciB0byBmb2N1cyBhbm90aGVyIGNoaWxkIG9mIHRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmIChcbiAgICAgICFlbGVtZW50SW5mbyB8fFxuICAgICAgKGVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiZcbiAgICAgICAgZXZlbnQucmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZWxlbWVudC5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQpO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8sIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdE9yaWdpbihpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbywgb3JpZ2luOiBGb2N1c09yaWdpbikge1xuICAgIGlmIChpbmZvLnN1YmplY3Qub2JzZXJ2ZXJzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiBpbmZvLnN1YmplY3QubmV4dChvcmlnaW4pKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudEluZm8ucm9vdE5vZGU7XG4gICAgY29uc3Qgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyA9IHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmdldChyb290Tm9kZSkgfHwgMDtcblxuICAgIGlmICghcm9vdE5vZGVGb2N1c0xpc3RlbmVycykge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAnZm9jdXMnLFxuICAgICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zLFxuICAgICAgICApO1xuICAgICAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgICdibHVyJyxcbiAgICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LnNldChyb290Tm9kZSwgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyArIDEpO1xuXG4gICAgLy8gUmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGZpcnN0IGVsZW1lbnQgaXMgbW9uaXRvcmVkLlxuICAgIGlmICgrK3RoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCA9PT0gMSkge1xuICAgICAgLy8gTm90ZTogd2UgbGlzdGVuIHRvIGV2ZW50cyBpbiB0aGUgY2FwdHVyZSBwaGFzZSBzbyB3ZVxuICAgICAgLy8gY2FuIGRldGVjdCB0aGVtIGV2ZW4gaWYgdGhlIHVzZXIgc3RvcHMgcHJvcGFnYXRpb24uXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG4gICAgICB9KTtcblxuICAgICAgLy8gVGhlIElucHV0TW9kYWxpdHlEZXRlY3RvciBpcyBhbHNvIGp1c3QgYSBjb2xsZWN0aW9uIG9mIGdsb2JhbCBsaXN0ZW5lcnMuXG4gICAgICB0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IubW9kYWxpdHlEZXRlY3RlZFxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fc3RvcElucHV0TW9kYWxpdHlEZXRlY3RvcikpXG4gICAgICAgIC5zdWJzY3JpYmUobW9kYWxpdHkgPT4ge1xuICAgICAgICAgIHRoaXMuX3NldE9yaWdpbihtb2RhbGl0eSwgdHJ1ZSAvKiBpc0Zyb21JbnRlcmFjdGlvbiAqLyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JlbW92ZUdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnRJbmZvLnJvb3ROb2RlO1xuXG4gICAgaWYgKHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50Lmhhcyhyb290Tm9kZSkpIHtcbiAgICAgIGNvbnN0IHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPSB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5nZXQocm9vdE5vZGUpITtcblxuICAgICAgaWYgKHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPiAxKSB7XG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LnNldChyb290Tm9kZSwgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyAtIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAnZm9jdXMnLFxuICAgICAgICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zLFxuICAgICAgICApO1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAgICdibHVyJyxcbiAgICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyxcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZGVsZXRlKHJvb3ROb2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVbnJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBsYXN0IGVsZW1lbnQgaXMgdW5tb25pdG9yZWQuXG4gICAgaWYgKCEtLXRoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCkge1xuICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcblxuICAgICAgLy8gRXF1aXZhbGVudGx5LCBzdG9wIG91ciBJbnB1dE1vZGFsaXR5RGV0ZWN0b3Igc3Vic2NyaXB0aW9uLlxuICAgICAgdGhpcy5fc3RvcElucHV0TW9kYWxpdHlEZXRlY3Rvci5uZXh0KCk7XG5cbiAgICAgIC8vIENsZWFyIHRpbWVvdXRzIGZvciBhbGwgcG90ZW50aWFsbHkgcGVuZGluZyB0aW1lb3V0cyB0byBwcmV2ZW50IHRoZSBsZWFrcy5cbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlcyBhbGwgdGhlIHN0YXRlIG9uIGFuIGVsZW1lbnQgb25jZSBpdHMgZm9jdXMgb3JpZ2luIGhhcyBjaGFuZ2VkLiAqL1xuICBwcml2YXRlIF9vcmlnaW5DaGFuZ2VkKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvLFxuICApIHtcbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQsIG9yaWdpbik7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mbywgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgdGhlIGBNb25pdG9yZWRFbGVtZW50SW5mb2Agb2YgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgYW5kXG4gICAqIGFsbCBvZiBpdHMgYW5jZXN0b3JzIHRoYXQgaGF2ZSBlbmFibGVkIGBjaGVja0NoaWxkcmVuYC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmcm9tIHdoaWNoIHRvIHN0YXJ0IHRoZSBzZWFyY2guXG4gICAqL1xuICBwcml2YXRlIF9nZXRDbG9zZXN0RWxlbWVudHNJbmZvKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSB7XG4gICAgY29uc3QgcmVzdWx0czogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSA9IFtdO1xuXG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoaW5mbywgY3VycmVudEVsZW1lbnQpID0+IHtcbiAgICAgIGlmIChjdXJyZW50RWxlbWVudCA9PT0gZWxlbWVudCB8fCAoaW5mby5jaGVja0NoaWxkcmVuICYmIGN1cnJlbnRFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnQpKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goW2N1cnJlbnRFbGVtZW50LCBpbmZvXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYW4gaW50ZXJhY3Rpb24gaXMgbGlrZWx5IHRvIGhhdmUgY29tZSBmcm9tIHRoZSB1c2VyIGNsaWNraW5nIHRoZSBgbGFiZWxgIG9mXG4gICAqIGFuIGBpbnB1dGAgb3IgYHRleHRhcmVhYCBpbiBvcmRlciB0byBmb2N1cyBpdC5cbiAgICogQHBhcmFtIGZvY3VzRXZlbnRUYXJnZXQgVGFyZ2V0IGN1cnJlbnRseSByZWNlaXZpbmcgZm9jdXMuXG4gICAqL1xuICBwcml2YXRlIF9pc0xhc3RJbnRlcmFjdGlvbkZyb21JbnB1dExhYmVsKGZvY3VzRXZlbnRUYXJnZXQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgY29uc3Qge19tb3N0UmVjZW50VGFyZ2V0OiBtb3N0UmVjZW50VGFyZ2V0LCBtb3N0UmVjZW50TW9kYWxpdHl9ID0gdGhpcy5faW5wdXRNb2RhbGl0eURldGVjdG9yO1xuXG4gICAgLy8gSWYgdGhlIGxhc3QgaW50ZXJhY3Rpb24gdXNlZCB0aGUgbW91c2Ugb24gYW4gZWxlbWVudCBjb250YWluZWQgYnkgb25lIG9mIHRoZSBsYWJlbHNcbiAgICAvLyBvZiBhbiBgaW5wdXRgL2B0ZXh0YXJlYWAgdGhhdCBpcyBjdXJyZW50bHkgZm9jdXNlZCwgaXQgaXMgdmVyeSBsaWtlbHkgdGhhdCB0aGVcbiAgICAvLyB1c2VyIHJlZGlyZWN0ZWQgZm9jdXMgdXNpbmcgdGhlIGxhYmVsLlxuICAgIGlmIChcbiAgICAgIG1vc3RSZWNlbnRNb2RhbGl0eSAhPT0gJ21vdXNlJyB8fFxuICAgICAgIW1vc3RSZWNlbnRUYXJnZXQgfHxcbiAgICAgIG1vc3RSZWNlbnRUYXJnZXQgPT09IGZvY3VzRXZlbnRUYXJnZXQgfHxcbiAgICAgIChmb2N1c0V2ZW50VGFyZ2V0Lm5vZGVOYW1lICE9PSAnSU5QVVQnICYmIGZvY3VzRXZlbnRUYXJnZXQubm9kZU5hbWUgIT09ICdURVhUQVJFQScpIHx8XG4gICAgICAoZm9jdXNFdmVudFRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkuZGlzYWJsZWRcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBsYWJlbHMgPSAoZm9jdXNFdmVudFRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkubGFiZWxzO1xuXG4gICAgaWYgKGxhYmVscykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGxhYmVsc1tpXS5jb250YWlucyhtb3N0UmVjZW50VGFyZ2V0KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgZGV0ZXJtaW5lcyBob3cgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgd2FzIGZvY3VzZWQgKHZpYSBrZXlib2FyZCwgbW91c2UsIHRvdWNoLCBvclxuICogcHJvZ3JhbW1hdGljYWxseSkgYW5kIGFkZHMgY29ycmVzcG9uZGluZyBjbGFzc2VzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gdmFyaWFudHMgb2YgdGhpcyBkaXJlY3RpdmU6XG4gKiAxKSBjZGtNb25pdG9yRWxlbWVudEZvY3VzOiBkb2VzIG5vdCBjb25zaWRlciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgaWYgb25lIG9mIGl0cyBjaGlsZHJlbiBpc1xuICogICAgZm9jdXNlZC5cbiAqIDIpIGNka01vbml0b3JTdWJ0cmVlRm9jdXM6IGNvbnNpZGVycyBhbiBlbGVtZW50IGZvY3VzZWQgaWYgaXQgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01vbml0b3JFbGVtZW50Rm9jdXNdLCBbY2RrTW9uaXRvclN1YnRyZWVGb2N1c10nLFxuICBleHBvcnRBczogJ2Nka01vbml0b3JGb2N1cycsXG59KVxuZXhwb3J0IGNsYXNzIENka01vbml0b3JGb2N1cyBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX21vbml0b3JTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgcHJpdmF0ZSBfZm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yLFxuICApIHt9XG5cbiAgZ2V0IGZvY3VzT3JpZ2luKCk6IEZvY3VzT3JpZ2luIHtcbiAgICByZXR1cm4gdGhpcy5fZm9jdXNPcmlnaW47XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yXG4gICAgICAubW9uaXRvcihlbGVtZW50LCBlbGVtZW50Lm5vZGVUeXBlID09PSAxICYmIGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAuc3Vic2NyaWJlKG9yaWdpbiA9PiB7XG4gICAgICAgIHRoaXMuX2ZvY3VzT3JpZ2luID0gb3JpZ2luO1xuICAgICAgICB0aGlzLmNka0ZvY3VzQ2hhbmdlLmVtaXQob3JpZ2luKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuXG4gICAgaWYgKHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX21vbml0b3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==