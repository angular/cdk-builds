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
import { InputModalityDetector, TOUCH_BUFFER_MS, } from '../input-modality/input-modality-detector';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "../input-modality/input-modality-detector";
import * as i3 from "@angular/common";
/** InjectionToken for FocusMonitorOptions. */
export const FOCUS_MONITOR_DEFAULT_OPTIONS = new InjectionToken('cdk-focus-monitor-default-options');
/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
    passive: true,
    capture: true
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
            this._windowFocusTimeoutId = setTimeout(() => this._windowFocused = false);
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
        this._detectionMode = (options === null || options === void 0 ? void 0 : options.detectionMode) || 0 /* IMMEDIATE */;
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
            rootNode
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
            this._getClosestElementsInfo(nativeElement)
                .forEach(([currentElement, info]) => this._originChanged(currentElement, origin, info));
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
    _toggleClass(element, className, shouldSet) {
        if (shouldSet) {
            element.classList.add(className);
        }
        else {
            element.classList.remove(className);
        }
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
        return (this._windowFocused && this._lastFocusOrigin) ? this._lastFocusOrigin : 'program';
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
        return (this._detectionMode === 1 /* EVENTUAL */) ||
            !!(focusEventTarget === null || focusEventTarget === void 0 ? void 0 : focusEventTarget.contains(this._inputModalityDetector._mostRecentTarget));
    }
    /**
     * Sets the focus classes on the element based on the given focus origin.
     * @param element The element to update the classes on.
     * @param origin The focus origin.
     */
    _setClasses(element, origin) {
        this._toggleClass(element, 'cdk-focused', !!origin);
        this._toggleClass(element, 'cdk-touch-focused', origin === 'touch');
        this._toggleClass(element, 'cdk-keyboard-focused', origin === 'keyboard');
        this._toggleClass(element, 'cdk-mouse-focused', origin === 'mouse');
        this._toggleClass(element, 'cdk-program-focused', origin === 'program');
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
            this._originFromTouchInteraction = (origin === 'touch') && isFromInteraction;
            // If we're in IMMEDIATE mode, reset the origin at the next tick (or in `TOUCH_BUFFER_MS` ms
            // for a touch event). We reset the origin at the next tick because Firefox focuses one tick
            // after the interaction event. We wait `TOUCH_BUFFER_MS` ms before resetting the origin for
            // a touch event because when a touch event is fired, the associated focus event isn't yet in
            // the event queue. Before doing so, clear any pending timeouts.
            if (this._detectionMode === 0 /* IMMEDIATE */) {
                clearTimeout(this._originTimeoutId);
                const ms = this._originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
                this._originTimeoutId = setTimeout(() => this._origin = null, ms);
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
        if (!elementInfo || (elementInfo.checkChildren && event.relatedTarget instanceof Node &&
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
                .subscribe(modality => { this._setOrigin(modality, true /* isFromInteraction */); });
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
FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.InputModalityDetector), i0.ɵɵinject(i3.DOCUMENT, 8), i0.ɵɵinject(FOCUS_MONITOR_DEFAULT_OPTIONS, 8)); }, token: FocusMonitor, providedIn: "root" });
FocusMonitor.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
FocusMonitor.ctorParameters = () => [
    { type: NgZone },
    { type: Platform },
    { type: InputModalityDetector },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_MONITOR_DEFAULT_OPTIONS,] }] }
];
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
        this._monitorSubscription = this._focusMonitor.monitor(element, element.nodeType === 1 && element.hasAttribute('cdkMonitorSubtreeFocus'))
            .subscribe(origin => this.cdkFocusChange.emit(origin));
    }
    ngOnDestroy() {
        this._focusMonitor.stopMonitoring(this._elementRef);
        if (this._monitorSubscription) {
            this._monitorSubscription.unsubscribe();
        }
    }
}
CdkMonitorFocus.decorators = [
    { type: Directive, args: [{
                selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
            },] }
];
CdkMonitorFocus.ctorParameters = () => [
    { type: ElementRef },
    { type: FocusMonitor }
];
CdkMonitorFocus.propDecorators = {
    cdkFocusChange: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFFBQVEsRUFDUiwrQkFBK0IsRUFDL0IsY0FBYyxFQUNkLGVBQWUsR0FDaEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsZUFBZSxHQUNoQixNQUFNLDJDQUEyQyxDQUFDOzs7OztBQWtDbkQsOENBQThDO0FBQzlDLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUN0QyxJQUFJLGNBQWMsQ0FBc0IsbUNBQW1DLENBQUMsQ0FBQztBQVFqRjs7O0dBR0c7QUFDSCxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lBQ2xFLE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDLENBQUM7QUFHSCxpRkFBaUY7QUFFakYsTUFBTSxPQUFPLFlBQVk7SUEyRHZCLFlBQ1ksT0FBZSxFQUNmLFNBQW1CLEVBQ1Ysc0JBQTZDO0lBQzlELHFEQUFxRDtJQUN2QixRQUFr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SUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUNwRCxPQUFPLEVBQ1AsT0FBTyxDQUFDLFFBQVEsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2FBQzFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFcEQsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ3pDO0lBQ0gsQ0FBQzs7O1lBdkJGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsb0RBQW9EO2FBQy9EOzs7WUF0aEJDLFVBQVU7WUEyaEJ1RSxZQUFZOzs7NkJBRjVGLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgUGxhdGZvcm0sXG4gIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsXG4gIF9nZXRTaGFkb3dSb290LFxuICBfZ2V0RXZlbnRUYXJnZXQsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIEFmdGVyVmlld0luaXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIElucHV0TW9kYWxpdHlEZXRlY3RvcixcbiAgVE9VQ0hfQlVGRkVSX01TLFxufSBmcm9tICcuLi9pbnB1dC1tb2RhbGl0eS9pbnB1dC1tb2RhbGl0eS1kZXRlY3Rvcic7XG5cblxuZXhwb3J0IHR5cGUgRm9jdXNPcmlnaW4gPSAndG91Y2gnIHwgJ21vdXNlJyB8ICdrZXlib2FyZCcgfCAncHJvZ3JhbScgfCBudWxsO1xuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBvcHRpb25zIHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGUgbmF0aXZlIGBmb2N1c2AgZXZlbnQuXG4gKiB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50L2ZvY3VzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRm9jdXNPcHRpb25zIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGJyb3dzZXIgc2hvdWxkIHNjcm9sbCB0byB0aGUgZWxlbWVudCB3aGVuIGl0IGlzIGZvY3VzZWQuICovXG4gIHByZXZlbnRTY3JvbGw/OiBib29sZWFuO1xufVxuXG4vKiogRGV0ZWN0aW9uIG1vZGUgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzIGV2ZW50LiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZSB7XG4gIC8qKlxuICAgKiBBbnkgbW91c2Vkb3duLCBrZXlkb3duLCBvciB0b3VjaHN0YXJ0IGV2ZW50IHRoYXQgaGFwcGVuZWQgaW4gdGhlIHByZXZpb3VzXG4gICAqIHRpY2sgb3IgdGhlIGN1cnJlbnQgdGljayB3aWxsIGJlIHVzZWQgdG8gYXNzaWduIGEgZm9jdXMgZXZlbnQncyBvcmlnaW4gKHRvXG4gICAqIGVpdGhlciBtb3VzZSwga2V5Ym9hcmQsIG9yIHRvdWNoKS4gVGhpcyBpcyB0aGUgZGVmYXVsdCBvcHRpb24uXG4gICAqL1xuICBJTU1FRElBVEUsXG4gIC8qKlxuICAgKiBBIGZvY3VzIGV2ZW50J3Mgb3JpZ2luIGlzIGFsd2F5cyBhdHRyaWJ1dGVkIHRvIHRoZSBsYXN0IGNvcnJlc3BvbmRpbmdcbiAgICogbW91c2Vkb3duLCBrZXlkb3duLCBvciB0b3VjaHN0YXJ0IGV2ZW50LCBubyBtYXR0ZXIgaG93IGxvbmcgYWdvIGl0IG9jY3VycmVkLlxuICAgKi9cbiAgRVZFTlRVQUxcbn1cblxuLyoqIEluamVjdGFibGUgc2VydmljZS1sZXZlbCBvcHRpb25zIGZvciBGb2N1c01vbml0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzTW9uaXRvck9wdGlvbnMge1xuICBkZXRlY3Rpb25Nb2RlPzogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcbn1cblxuLyoqIEluamVjdGlvblRva2VuIGZvciBGb2N1c01vbml0b3JPcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oJ2Nkay1mb2N1cy1tb25pdG9yLWRlZmF1bHQtb3B0aW9ucycpO1xuXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICBjaGVja0NoaWxkcmVuOiBib29sZWFuLFxuICByZWFkb25seSBzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPixcbiAgcm9vdE5vZGU6IEhUTUxFbGVtZW50fFNoYWRvd1Jvb3R8RG9jdW1lbnRcbn07XG5cbi8qKlxuICogRXZlbnQgbGlzdGVuZXIgb3B0aW9ucyB0aGF0IGVuYWJsZSBjYXB0dXJpbmcgYW5kIGFsc29cbiAqIG1hcmsgdGhlIGxpc3RlbmVyIGFzIHBhc3NpdmUgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgaXQuXG4gKi9cbmNvbnN0IGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59KTtcblxuXG4vKiogTW9uaXRvcnMgbW91c2UgYW5kIGtleWJvYXJkIGV2ZW50cyB0byBkZXRlcm1pbmUgdGhlIGNhdXNlIG9mIGZvY3VzIGV2ZW50cy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEZvY3VzTW9uaXRvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgZm9jdXMgb3JpZ2luIHRoYXQgdGhlIG5leHQgZm9jdXMgZXZlbnQgaXMgYSByZXN1bHQgb2YuICovXG4gIHByaXZhdGUgX29yaWdpbjogRm9jdXNPcmlnaW4gPSBudWxsO1xuXG4gIC8qKiBUaGUgRm9jdXNPcmlnaW4gb2YgdGhlIGxhc3QgZm9jdXMgZXZlbnQgdHJhY2tlZCBieSB0aGUgRm9jdXNNb25pdG9yLiAqL1xuICBwcml2YXRlIF9sYXN0Rm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB3aW5kb3cgaGFzIGp1c3QgYmVlbiBmb2N1c2VkLiAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c2VkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB3aW5kb3cgZm9jdXMgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNUaW1lb3V0SWQ6IGFueTtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIG9yaWdpbiBjbGVhcmluZyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF9vcmlnaW5UaW1lb3V0SWQ6IGFueTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgb3JpZ2luIHdhcyBkZXRlcm1pbmVkIHZpYSBhIHRvdWNoIGludGVyYWN0aW9uLiBOZWNlc3NhcnkgYXMgcHJvcGVybHkgYXR0cmlidXRpbmdcbiAgICogZm9jdXMgZXZlbnRzIHRvIHRvdWNoIGludGVyYWN0aW9ucyByZXF1aXJlcyBzcGVjaWFsIGxvZ2ljLlxuICAgKi9cbiAgcHJpdmF0ZSBfb3JpZ2luRnJvbVRvdWNoSW50ZXJhY3Rpb24gPSBmYWxzZTtcblxuICAvKiogTWFwIG9mIGVsZW1lbnRzIGJlaW5nIG1vbml0b3JlZCB0byB0aGVpciBpbmZvLiAqL1xuICBwcml2YXRlIF9lbGVtZW50SW5mbyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvPigpO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBiZWluZyBtb25pdG9yZWQuICovXG4gIHByaXZhdGUgX21vbml0b3JlZEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSByb290IG5vZGVzIHRvIHdoaWNoIHdlJ3ZlIGN1cnJlbnRseSBib3VuZCBhIGZvY3VzL2JsdXIgaGFuZGxlcixcbiAgICogYXMgd2VsbCBhcyB0aGUgbnVtYmVyIG9mIG1vbml0b3JlZCBlbGVtZW50cyB0aGF0IHRoZXkgY29udGFpbi4gV2UgaGF2ZSB0byB0cmVhdCBmb2N1cy9ibHVyXG4gICAqIGhhbmRsZXJzIGRpZmZlcmVudGx5IGZyb20gdGhlIHJlc3Qgb2YgdGhlIGV2ZW50cywgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGV2ZW50c1xuICAgKiB0byB0aGUgZG9jdW1lbnQgd2hlbiBmb2N1cyBtb3ZlcyBpbnNpZGUgb2YgYSBzaGFkb3cgcm9vdC5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50ID0gbmV3IE1hcDxIVE1MRWxlbWVudHxEb2N1bWVudHxTaGFkb3dSb290LCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSBzcGVjaWZpZWQgZGV0ZWN0aW9uIG1vZGUsIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1c1xuICAgKiBldmVudC5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGVjdGlvbk1vZGU6IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fd2luZG93Rm9jdXNlZCA9IGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgLyoqIFN1YmplY3QgZm9yIHN0b3BwaW5nIG91ciBJbnB1dE1vZGFsaXR5RGV0ZWN0b3Igc3Vic2NyaXB0aW9uLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zdG9wSW5wdXRNb2RhbGl0eURldGVjdG9yID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfaW5wdXRNb2RhbGl0eURldGVjdG9yOiBJbnB1dE1vZGFsaXR5RGV0ZWN0b3IsXG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueXxudWxsLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUykgb3B0aW9uczpcbiAgICAgICAgICBGb2N1c01vbml0b3JPcHRpb25zfG51bGwpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMuX2RldGVjdGlvbk1vZGUgPSBvcHRpb25zPy5kZXRlY3Rpb25Nb2RlIHx8IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFO1xuICB9XG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBhbmQgJ2JsdXInIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gX2dldEV2ZW50VGFyZ2V0PEhUTUxFbGVtZW50PihldmVudCk7XG4gICAgY29uc3QgaGFuZGxlciA9IGV2ZW50LnR5cGUgPT09ICdmb2N1cycgPyB0aGlzLl9vbkZvY3VzIDogdGhpcy5fb25CbHVyO1xuXG4gICAgLy8gV2UgbmVlZCB0byB3YWxrIHVwIHRoZSBhbmNlc3RvciBjaGFpbiBpbiBvcmRlciB0byBzdXBwb3J0IGBjaGVja0NoaWxkcmVuYC5cbiAgICBmb3IgKGxldCBlbGVtZW50ID0gdGFyZ2V0OyBlbGVtZW50OyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQgYXMgRm9jdXNFdmVudCwgZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICBtb25pdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj4ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0gb3IgdGhlIHBhc3NlZCBpbiBub2RlIGlzbid0IGFuIGVsZW1lbnQuXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIgfHwgbmF0aXZlRWxlbWVudC5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihudWxsKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNoYWRvdyBET00sIHdlIG5lZWQgdG8gYmluZCBvdXIgZm9jdXMvYmx1ciBsaXN0ZW5lcnMgdG9cbiAgICAvLyB0aGUgc2hhZG93IHJvb3QsIHJhdGhlciB0aGFuIHRoZSBgZG9jdW1lbnRgLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZm9jdXMgZXZlbnRzXG4gICAgLy8gdG8gdGhlIGBkb2N1bWVudGAsIGlmIGZvY3VzIGlzIG1vdmluZyB3aXRoaW4gdGhlIHNhbWUgc2hhZG93IHJvb3QuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSBfZ2V0U2hhZG93Um9vdChuYXRpdmVFbGVtZW50KSB8fCB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIGNvbnN0IGNhY2hlZEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmIChjYWNoZWRJbmZvKSB7XG4gICAgICBpZiAoY2hlY2tDaGlsZHJlbikge1xuICAgICAgICAvLyBUT0RPKENPTVAtMzE4KTogdGhpcyBjYW4gYmUgcHJvYmxlbWF0aWMsIGJlY2F1c2UgaXQnbGwgdHVybiBhbGwgbm9uLWNoZWNrQ2hpbGRyZW5cbiAgICAgICAgLy8gb2JzZXJ2ZXJzIGludG8gb25lcyB0aGF0IGJlaGF2ZSBhcyBpZiBgY2hlY2tDaGlsZHJlbmAgd2FzIHR1cm5lZCBvbi4gV2UgbmVlZCBhIG1vcmVcbiAgICAgICAgLy8gcm9idXN0IHNvbHV0aW9uLlxuICAgICAgICBjYWNoZWRJbmZvLmNoZWNrQ2hpbGRyZW4gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FjaGVkSW5mby5zdWJqZWN0O1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtb25pdG9yZWQgZWxlbWVudCBpbmZvLlxuICAgIGNvbnN0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpLFxuICAgICAgcm9vdE5vZGVcbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLnNldChuYXRpdmVFbGVtZW50LCBpbmZvKTtcbiAgICB0aGlzLl9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhpbmZvKTtcblxuICAgIHJldHVybiBpbmZvLnN1YmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkO1xuXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgZWxlbWVudEluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuXG4gICAgICB0aGlzLl9zZXRDbGFzc2VzKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudEluZm8uZGVsZXRlKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQge1xuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpLmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBmb2N1c2VkIGFscmVhZHksIGNhbGxpbmcgYGZvY3VzYCBhZ2FpbiB3b24ndCB0cmlnZ2VyIHRoZSBldmVudCBsaXN0ZW5lclxuICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGZvY3VzIGNsYXNzZXMgd29uJ3QgYmUgdXBkYXRlZC4gSWYgdGhhdCdzIHRoZSBjYXNlLCB1cGRhdGUgdGhlIGNsYXNzZXNcbiAgICAvLyBkaXJlY3RseSB3aXRob3V0IHdhaXRpbmcgZm9yIGFuIGV2ZW50LlxuICAgIGlmIChuYXRpdmVFbGVtZW50ID09PSBmb2N1c2VkRWxlbWVudCkge1xuICAgICAgdGhpcy5fZ2V0Q2xvc2VzdEVsZW1lbnRzSW5mbyhuYXRpdmVFbGVtZW50KVxuICAgICAgICAuZm9yRWFjaCgoW2N1cnJlbnRFbGVtZW50LCBpbmZvXSkgPT4gdGhpcy5fb3JpZ2luQ2hhbmdlZChjdXJyZW50RWxlbWVudCwgb3JpZ2luLCBpbmZvKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NldE9yaWdpbihvcmlnaW4pO1xuXG4gICAgICAvLyBgZm9jdXNgIGlzbid0IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyXG4gICAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbmF0aXZlRWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3MoZWxlbWVudDogRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHNob3VsZFNldDogYm9vbGVhbikge1xuICAgIGlmIChzaG91bGRTZXQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRGb2N1c09yaWdpbihmb2N1c0V2ZW50VGFyZ2V0OiBIVE1MRWxlbWVudCB8IG51bGwpOiBGb2N1c09yaWdpbiB7XG4gICAgaWYgKHRoaXMuX29yaWdpbikge1xuICAgICAgLy8gSWYgdGhlIG9yaWdpbiB3YXMgcmVhbGl6ZWQgdmlhIGEgdG91Y2ggaW50ZXJhY3Rpb24sIHdlIG5lZWQgdG8gcGVyZm9ybSBhZGRpdGlvbmFsIGNoZWNrc1xuICAgICAgLy8gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGZvY3VzIG9yaWdpbiBzaG91bGQgYmUgYXR0cmlidXRlZCB0byB0b3VjaCBvciBwcm9ncmFtLlxuICAgICAgaWYgKHRoaXMuX29yaWdpbkZyb21Ub3VjaEludGVyYWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zaG91bGRCZUF0dHJpYnV0ZWRUb1RvdWNoKGZvY3VzRXZlbnRUYXJnZXQpID8gJ3RvdWNoJyA6ICdwcm9ncmFtJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vcmlnaW47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHdpbmRvdyBoYXMganVzdCByZWdhaW5lZCBmb2N1cywgd2UgY2FuIHJlc3RvcmUgdGhlIG1vc3QgcmVjZW50IG9yaWdpbiBmcm9tIGJlZm9yZSB0aGVcbiAgICAvLyB3aW5kb3cgYmx1cnJlZC4gT3RoZXJ3aXNlLCB3ZSd2ZSByZWFjaGVkIHRoZSBwb2ludCB3aGVyZSB3ZSBjYW4ndCBpZGVudGlmeSB0aGUgc291cmNlIG9mIHRoZVxuICAgIC8vIGZvY3VzLiBUaGlzIHR5cGljYWxseSBtZWFucyBvbmUgb2YgdHdvIHRoaW5ncyBoYXBwZW5lZDpcbiAgICAvL1xuICAgIC8vIDEpIFRoZSBlbGVtZW50IHdhcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQsIG9yXG4gICAgLy8gMikgVGhlIGVsZW1lbnQgd2FzIGZvY3VzZWQgdmlhIHNjcmVlbiByZWFkZXIgbmF2aWdhdGlvbiAod2hpY2ggZ2VuZXJhbGx5IGRvZXNuJ3QgZmlyZVxuICAgIC8vICAgIGV2ZW50cykuXG4gICAgLy9cbiAgICAvLyBCZWNhdXNlIHdlIGNhbid0IGRpc3Rpbmd1aXNoIGJldHdlZW4gdGhlc2UgdHdvIGNhc2VzLCB3ZSBkZWZhdWx0IHRvIHNldHRpbmcgYHByb2dyYW1gLlxuICAgIHJldHVybiAodGhpcy5fd2luZG93Rm9jdXNlZCAmJiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4pID8gdGhpcy5fbGFzdEZvY3VzT3JpZ2luIDogJ3Byb2dyYW0nO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgZm9jdXMgZXZlbnQgc2hvdWxkIGJlIGF0dHJpYnV0ZWQgdG8gdG91Y2guIFJlY2FsbCB0aGF0IGluIElNTUVESUFURSBtb2RlLCBhXG4gICAqIHRvdWNoIG9yaWdpbiBpc24ndCBpbW1lZGlhdGVseSByZXNldCBhdCB0aGUgbmV4dCB0aWNrIChzZWUgX3NldE9yaWdpbikuIFRoaXMgbWVhbnMgdGhhdCB3aGVuIHdlXG4gICAqIGhhbmRsZSBhIGZvY3VzIGV2ZW50IGZvbGxvd2luZyBhIHRvdWNoIGludGVyYWN0aW9uLCB3ZSBuZWVkIHRvIGRldGVybWluZSB3aGV0aGVyICgxKSB0aGUgZm9jdXNcbiAgICogZXZlbnQgd2FzIGRpcmVjdGx5IGNhdXNlZCBieSB0aGUgdG91Y2ggaW50ZXJhY3Rpb24gb3IgKDIpIHRoZSBmb2N1cyBldmVudCB3YXMgY2F1c2VkIGJ5IGFcbiAgICogc3Vic2VxdWVudCBwcm9ncmFtbWF0aWMgZm9jdXMgY2FsbCB0cmlnZ2VyZWQgYnkgdGhlIHRvdWNoIGludGVyYWN0aW9uLlxuICAgKiBAcGFyYW0gZm9jdXNFdmVudFRhcmdldCBUaGUgdGFyZ2V0IG9mIHRoZSBmb2N1cyBldmVudCB1bmRlciBleGFtaW5hdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEJlQXR0cmlidXRlZFRvVG91Y2goZm9jdXNFdmVudFRhcmdldDogSFRNTEVsZW1lbnQgfCBudWxsKTogYm9vbGVhbiB7XG4gICAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGNoZWNrIGlzIG5vdCBwZXJmZWN0LiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGVkZ2UgY2FzZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIj5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIHRhYmluZGV4PVwiMFwiIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIFN1cHBvc2UgdGhlcmUgaXMgYSBGb2N1c01vbml0b3IgaW4gSU1NRURJQVRFIG1vZGUgYXR0YWNoZWQgdG8gI3BhcmVudC4gV2hlbiB0aGUgdXNlciB0b3VjaGVzXG4gICAgLy8gI2NoaWxkLCAjcGFyZW50IGlzIHByb2dyYW1tYXRpY2FsbHkgZm9jdXNlZC4gVGhpcyBjb2RlIHdpbGwgYXR0cmlidXRlIHRoZSBmb2N1cyB0byB0b3VjaFxuICAgIC8vIGluc3RlYWQgb2YgcHJvZ3JhbS4gVGhpcyBpcyBhIHJlbGF0aXZlbHkgbWlub3IgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnQsICdwcm9ncmFtJykgdG8gZm9jdXMgI3BhcmVudC5cbiAgICByZXR1cm4gKHRoaXMuX2RldGVjdGlvbk1vZGUgPT09IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuRVZFTlRVQUwpIHx8XG4gICAgICAgICEhZm9jdXNFdmVudFRhcmdldD8uY29udGFpbnModGhpcy5faW5wdXRNb2RhbGl0eURldGVjdG9yLl9tb3N0UmVjZW50VGFyZ2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmb2N1cyBjbGFzc2VzIG9uIHRoZSBlbGVtZW50IGJhc2VkIG9uIHRoZSBnaXZlbiBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHVwZGF0ZSB0aGUgY2xhc3NlcyBvbi5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgZm9jdXMgb3JpZ2luLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0Q2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luPzogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWZvY3VzZWQnLCAhIW9yaWdpbik7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay10b3VjaC1mb2N1c2VkJywgb3JpZ2luID09PSAndG91Y2gnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLWtleWJvYXJkLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdrZXlib2FyZCcpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstbW91c2UtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ21vdXNlJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1wcm9ncmFtLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdwcm9ncmFtJyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZm9jdXMgb3JpZ2luLiBJZiB3ZSdyZSB1c2luZyBpbW1lZGlhdGUgZGV0ZWN0aW9uIG1vZGUsIHdlIHNjaGVkdWxlIGFuIGFzeW5jXG4gICAqIGZ1bmN0aW9uIHRvIGNsZWFyIHRoZSBvcmlnaW4gYXQgdGhlIGVuZCBvZiBhIHRpbWVvdXQuIFRoZSBkdXJhdGlvbiBvZiB0aGUgdGltZW91dCBkZXBlbmRzIG9uXG4gICAqIHRoZSBvcmlnaW4gYmVpbmcgc2V0LlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gdG8gc2V0LlxuICAgKiBAcGFyYW0gaXNGcm9tSW50ZXJhY3Rpb24gV2hldGhlciB3ZSBhcmUgc2V0dGluZyB0aGUgb3JpZ2luIGZyb20gYW4gaW50ZXJhY3Rpb24gZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRPcmlnaW4ob3JpZ2luOiBGb2N1c09yaWdpbiwgaXNGcm9tSW50ZXJhY3Rpb24gPSBmYWxzZSk6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG4gICAgICB0aGlzLl9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA9IChvcmlnaW4gPT09ICd0b3VjaCcpICYmIGlzRnJvbUludGVyYWN0aW9uO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBpbiBJTU1FRElBVEUgbW9kZSwgcmVzZXQgdGhlIG9yaWdpbiBhdCB0aGUgbmV4dCB0aWNrIChvciBpbiBgVE9VQ0hfQlVGRkVSX01TYCBtc1xuICAgICAgLy8gZm9yIGEgdG91Y2ggZXZlbnQpLiBXZSByZXNldCB0aGUgb3JpZ2luIGF0IHRoZSBuZXh0IHRpY2sgYmVjYXVzZSBGaXJlZm94IGZvY3VzZXMgb25lIHRpY2tcbiAgICAgIC8vIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudC4gV2Ugd2FpdCBgVE9VQ0hfQlVGRkVSX01TYCBtcyBiZWZvcmUgcmVzZXR0aW5nIHRoZSBvcmlnaW4gZm9yXG4gICAgICAvLyBhIHRvdWNoIGV2ZW50IGJlY2F1c2Ugd2hlbiBhIHRvdWNoIGV2ZW50IGlzIGZpcmVkLCB0aGUgYXNzb2NpYXRlZCBmb2N1cyBldmVudCBpc24ndCB5ZXQgaW5cbiAgICAgIC8vIHRoZSBldmVudCBxdWV1ZS4gQmVmb3JlIGRvaW5nIHNvLCBjbGVhciBhbnkgcGVuZGluZyB0aW1lb3V0cy5cbiAgICAgIGlmICh0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICAgICAgY29uc3QgbXMgPSB0aGlzLl9vcmlnaW5Gcm9tVG91Y2hJbnRlcmFjdGlvbiA/IFRPVUNIX0JVRkZFUl9NUyA6IDE7XG4gICAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb3JpZ2luID0gbnVsbCwgbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9vbkZvY3VzKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIE5PVEUobW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgc2V0IHRoZSBjbGFzc2VzIGJhc2VkIG9uIHRoZSBmb2N1cyBvcmlnaW4gb2YgdGhlIG1vc3QgcmVjZW50XG4gICAgLy8gZm9jdXMgZXZlbnQgYWZmZWN0aW5nIHRoZSBtb25pdG9yZWQgZWxlbWVudC4gSWYgd2Ugd2FudCB0byB1c2UgdGhlIG9yaWdpbiBvZiB0aGUgZmlyc3QgZXZlbnRcbiAgICAvLyBpbnN0ZWFkIHdlIHNob3VsZCBjaGVjayBmb3IgdGhlIGNkay1mb2N1c2VkIGNsYXNzIGhlcmUgYW5kIHJldHVybiBpZiB0aGUgZWxlbWVudCBhbHJlYWR5IGhhc1xuICAgIC8vIGl0LiAoVGhpcyBvbmx5IG1hdHRlcnMgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBpbmNsdWRlc0NoaWxkcmVuID0gdHJ1ZSkuXG5cbiAgICAvLyBJZiB3ZSBhcmUgbm90IGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHRhcmdldCBpcyB0aGVcbiAgICAvLyBtb25pdG9yZWQgZWxlbWVudCBpdHNlbGYuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG4gICAgY29uc3QgZm9jdXNFdmVudFRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudD4oZXZlbnQpO1xuICAgIGlmICghZWxlbWVudEluZm8gfHwgKCFlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGVsZW1lbnQgIT09IGZvY3VzRXZlbnRUYXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fb3JpZ2luQ2hhbmdlZChlbGVtZW50LCB0aGlzLl9nZXRGb2N1c09yaWdpbihmb2N1c0V2ZW50VGFyZ2V0KSwgZWxlbWVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgYmx1ciBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgYmx1ciBldmVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgKi9cbiAgX29uQmx1cihldmVudDogRm9jdXNFdmVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgICAvLyBJZiB3ZSBhcmUgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB3ZSBhcmVuJ3QganVzdCBibHVycmluZyBpblxuICAgIC8vIG9yZGVyIHRvIGZvY3VzIGFub3RoZXIgY2hpbGQgb2YgdGhlIG1vbml0b3JlZCBlbGVtZW50LlxuICAgIGNvbnN0IGVsZW1lbnRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBldmVudC5yZWxhdGVkVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgICBlbGVtZW50LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NldENsYXNzZXMoZWxlbWVudCk7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRPcmlnaW4oc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sIG9yaWdpbjogRm9jdXNPcmlnaW4pIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHN1YmplY3QubmV4dChvcmlnaW4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlZ2lzdGVyR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbykge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcbiAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSB8fCAwO1xuXG4gICAgaWYgKCFyb290Tm9kZUZvY3VzTGlzdGVuZXJzKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LnNldChyb290Tm9kZSwgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyArIDEpO1xuXG4gICAgLy8gUmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGZpcnN0IGVsZW1lbnQgaXMgbW9uaXRvcmVkLlxuICAgIGlmICgrK3RoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCA9PT0gMSkge1xuICAgICAgLy8gTm90ZTogd2UgbGlzdGVuIHRvIGV2ZW50cyBpbiB0aGUgY2FwdHVyZSBwaGFzZSBzbyB3ZVxuICAgICAgLy8gY2FuIGRldGVjdCB0aGVtIGV2ZW4gaWYgdGhlIHVzZXIgc3RvcHMgcHJvcGFnYXRpb24uXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG4gICAgICB9KTtcblxuICAgICAgLy8gVGhlIElucHV0TW9kYWxpdHlEZXRlY3RvciBpcyBhbHNvIGp1c3QgYSBjb2xsZWN0aW9uIG9mIGdsb2JhbCBsaXN0ZW5lcnMuXG4gICAgICB0aGlzLl9pbnB1dE1vZGFsaXR5RGV0ZWN0b3IubW9kYWxpdHlEZXRlY3RlZFxuICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fc3RvcElucHV0TW9kYWxpdHlEZXRlY3RvcikpXG4gICAgICAgIC5zdWJzY3JpYmUobW9kYWxpdHkgPT4geyB0aGlzLl9zZXRPcmlnaW4obW9kYWxpdHksIHRydWUgLyogaXNGcm9tSW50ZXJhY3Rpb24gKi8pOyB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcblxuICAgIGlmICh0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5oYXMocm9vdE5vZGUpKSB7XG4gICAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSE7XG5cbiAgICAgIGlmIChyb290Tm9kZUZvY3VzTGlzdGVuZXJzID4gMSkge1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgLSAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5kZWxldGUocm9vdE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBFcXVpdmFsZW50bHksIHN0b3Agb3VyIElucHV0TW9kYWxpdHlEZXRlY3RvciBzdWJzY3JpcHRpb24uXG4gICAgICB0aGlzLl9zdG9wSW5wdXRNb2RhbGl0eURldGVjdG9yLm5leHQoKTtcblxuICAgICAgLy8gQ2xlYXIgdGltZW91dHMgZm9yIGFsbCBwb3RlbnRpYWxseSBwZW5kaW5nIHRpbWVvdXRzIHRvIHByZXZlbnQgdGhlIGxlYWtzLlxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIGFsbCB0aGUgc3RhdGUgb24gYW4gZWxlbWVudCBvbmNlIGl0cyBmb2N1cyBvcmlnaW4gaGFzIGNoYW5nZWQuICovXG4gIHByaXZhdGUgX29yaWdpbkNoYW5nZWQoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdHMgdGhlIGBNb25pdG9yZWRFbGVtZW50SW5mb2Agb2YgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgYW5kXG4gICAqIGFsbCBvZiBpdHMgYW5jZXN0b3JzIHRoYXQgaGF2ZSBlbmFibGVkIGBjaGVja0NoaWxkcmVuYC5cbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCBmcm9tIHdoaWNoIHRvIHN0YXJ0IHRoZSBzZWFyY2guXG4gICAqL1xuICBwcml2YXRlIF9nZXRDbG9zZXN0RWxlbWVudHNJbmZvKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSB7XG4gICAgY29uc3QgcmVzdWx0czogW0hUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mb11bXSA9IFtdO1xuXG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoaW5mbywgY3VycmVudEVsZW1lbnQpID0+IHtcbiAgICAgIGlmIChjdXJyZW50RWxlbWVudCA9PT0gZWxlbWVudCB8fCAoaW5mby5jaGVja0NoaWxkcmVuICYmIGN1cnJlbnRFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnQpKSkge1xuICAgICAgICByZXN1bHRzLnB1c2goW2N1cnJlbnRFbGVtZW50LCBpbmZvXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcikge31cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uID0gdGhpcy5fZm9jdXNNb25pdG9yLm1vbml0b3IoXG4gICAgICBlbGVtZW50LFxuICAgICAgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY2RrTW9uaXRvclN1YnRyZWVGb2N1cycpKVxuICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcblxuICAgIGlmICh0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG4iXX0=