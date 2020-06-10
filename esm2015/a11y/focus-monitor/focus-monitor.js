/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions, _getShadowRoot } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Inject, Injectable, InjectionToken, NgZone, Optional, Output, } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';
import { coerceElement } from '@angular/cdk/coercion';
import { DOCUMENT } from '@angular/common';
import { isFakeMousedownFromScreenReader } from '../fake-mousedown';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
// This is the value used by AngularJS Material. Through trial and error (on iPhone 6S) they found
// that a value of around 650ms seems appropriate.
export const TOUCH_BUFFER_MS = 650;
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
let FocusMonitor = /** @class */ (() => {
    class FocusMonitor {
        constructor(_ngZone, _platform, 
        /** @breaking-change 11.0.0 make document required */
        document, options) {
            this._ngZone = _ngZone;
            this._platform = _platform;
            /** The focus origin that the next focus event is a result of. */
            this._origin = null;
            /** Whether the window has just been focused. */
            this._windowFocused = false;
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
             * Event listener for `keydown` events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._documentKeydownListener = () => {
                // On keydown record the origin and clear any touch event that may be in progress.
                this._lastTouchTarget = null;
                this._setOriginForCurrentEventQueue('keyboard');
            };
            /**
             * Event listener for `mousedown` events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._documentMousedownListener = (event) => {
                // On mousedown record the origin only if there is not touch
                // target, since a mousedown can happen as a result of a touch event.
                if (!this._lastTouchTarget) {
                    // In some cases screen readers fire fake `mousedown` events instead of `keydown`.
                    // Resolve the focus source to `keyboard` if we detect one of them.
                    const source = isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse';
                    this._setOriginForCurrentEventQueue(source);
                }
            };
            /**
             * Event listener for `touchstart` events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._documentTouchstartListener = (event) => {
                // When the touchstart event fires the focus event is not yet in the event queue. This means
                // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
                // see if a focus happens.
                if (this._touchTimeoutId != null) {
                    clearTimeout(this._touchTimeoutId);
                }
                this._lastTouchTarget = getTarget(event);
                this._touchTimeoutId = setTimeout(() => this._lastTouchTarget = null, TOUCH_BUFFER_MS);
            };
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
            /**
             * Event listener for `focus` and 'blur' events on the document.
             * Needs to be an arrow function in order to preserve the context when it gets bound.
             */
            this._rootNodeFocusAndBlurListener = (event) => {
                const target = getTarget(event);
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
            // Do nothing if we're not on the browser platform.
            if (!this._platform.isBrowser) {
                return observableOf(null);
            }
            const nativeElement = coerceElement(element);
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
                return cachedInfo.subject.asObservable();
            }
            // Create monitored element info.
            const info = {
                checkChildren: checkChildren,
                subject: new Subject(),
                rootNode
            };
            this._elementInfo.set(nativeElement, info);
            this._registerGlobalListeners(info);
            return info.subject.asObservable();
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
            this._setOriginForCurrentEventQueue(origin);
            // `focus` isn't available on the server
            if (typeof nativeElement.focus === 'function') {
                // Cast the element to `any`, because the TS typings don't have the `options` parameter yet.
                nativeElement.focus(options);
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
        _getFocusOrigin(event) {
            // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
            // 1) The window has just regained focus, in which case we want to restore the focused state of
            //    the element from before the window blurred.
            // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
            // 3) The element was programmatically focused, in which case we should mark the origin as
            //    'program'.
            if (this._origin) {
                return this._origin;
            }
            if (this._windowFocused && this._lastFocusOrigin) {
                return this._lastFocusOrigin;
            }
            else if (this._wasCausedByTouch(event)) {
                return 'touch';
            }
            else {
                return 'program';
            }
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
         * Sets the origin and schedules an async function to clear it at the end of the event queue.
         * If the detection mode is 'eventual', the origin is never cleared.
         * @param origin The origin to set.
         */
        _setOriginForCurrentEventQueue(origin) {
            this._ngZone.runOutsideAngular(() => {
                this._origin = origin;
                if (this._detectionMode === 0 /* IMMEDIATE */) {
                    // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
                    // tick after the interaction event fired. To ensure the focus origin is always correct,
                    // the focus origin will be determined at the beginning of the next tick.
                    this._originTimeoutId = setTimeout(() => this._origin = null, 1);
                }
            });
        }
        /**
         * Checks whether the given focus event was caused by a touchstart event.
         * @param event The focus event to check.
         * @returns Whether the event was caused by a touch.
         */
        _wasCausedByTouch(event) {
            // Note(mmalerba): This implementation is not quite perfect, there is a small edge case.
            // Consider the following dom structure:
            //
            // <div #parent tabindex="0" cdkFocusClasses>
            //   <div #child (click)="#parent.focus()"></div>
            // </div>
            //
            // If the user touches the #child element and the #parent is programmatically focused as a
            // result, this code will still consider it to have been caused by the touch event and will
            // apply the cdk-touch-focused class rather than the cdk-program-focused class. This is a
            // relatively small edge-case that can be worked around by using
            // focusVia(parentEl, 'program') to focus the parent element.
            //
            // If we decide that we absolutely must handle this case correctly, we can do so by listening
            // for the first focus event after the touchstart, and then the first blur event after that
            // focus event. When that blur event fires we know that whatever follows is not a result of the
            // touchstart.
            const focusTarget = getTarget(event);
            return this._lastTouchTarget instanceof Node && focusTarget instanceof Node &&
                (focusTarget === this._lastTouchTarget || focusTarget.contains(this._lastTouchTarget));
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
            if (!elementInfo || (!elementInfo.checkChildren && element !== getTarget(event))) {
                return;
            }
            const origin = this._getFocusOrigin(event);
            this._setClasses(element, origin);
            this._emitOrigin(elementInfo.subject, origin);
            this._lastFocusOrigin = origin;
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
                    const document = this._getDocument();
                    const window = this._getWindow();
                    document.addEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
                    document.addEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
                    document.addEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
                    window.addEventListener('focus', this._windowFocusListener);
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
                const document = this._getDocument();
                const window = this._getWindow();
                document.removeEventListener('keydown', this._documentKeydownListener, captureEventListenerOptions);
                document.removeEventListener('mousedown', this._documentMousedownListener, captureEventListenerOptions);
                document.removeEventListener('touchstart', this._documentTouchstartListener, captureEventListenerOptions);
                window.removeEventListener('focus', this._windowFocusListener);
                // Clear timeouts for all potentially pending timeouts to prevent the leaks.
                clearTimeout(this._windowFocusTimeoutId);
                clearTimeout(this._touchTimeoutId);
                clearTimeout(this._originTimeoutId);
            }
        }
    }
    FocusMonitor.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    FocusMonitor.ctorParameters = () => [
        { type: NgZone },
        { type: Platform },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_MONITOR_DEFAULT_OPTIONS,] }] }
    ];
    FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT, 8), i0.ɵɵinject(FOCUS_MONITOR_DEFAULT_OPTIONS, 8)); }, token: FocusMonitor, providedIn: "root" });
    return FocusMonitor;
})();
export { FocusMonitor };
/** Gets the target of an event, accounting for Shadow DOM. */
function getTarget(event) {
    // If an event is bound outside the Shadow DOM, the `event.target` will
    // point to the shadow root so we have to use `composedPath` instead.
    return (event.composedPath ? event.composedPath()[0] : event.target);
}
/**
 * Directive that determines how a particular element was focused (via keyboard, mouse, touch, or
 * programmatically) and adds corresponding classes to the element.
 *
 * There are two variants of this directive:
 * 1) cdkMonitorElementFocus: does not consider an element to be focused if one of its children is
 *    focused.
 * 2) cdkMonitorSubtreeFocus: considers an element focused if it or any of its children are focused.
 */
let CdkMonitorFocus = /** @class */ (() => {
    class CdkMonitorFocus {
        constructor(_elementRef, _focusMonitor) {
            this._elementRef = _elementRef;
            this._focusMonitor = _focusMonitor;
            this.cdkFocusChange = new EventEmitter();
        }
        ngAfterViewInit() {
            this._monitorSubscription = this._focusMonitor.monitor(this._elementRef, this._elementRef.nativeElement.hasAttribute('cdkMonitorSubtreeFocus'))
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
    /** @nocollapse */
    CdkMonitorFocus.ctorParameters = () => [
        { type: ElementRef },
        { type: FocusMonitor }
    ];
    CdkMonitorFocus.propDecorators = {
        cdkFocusChange: [{ type: Output }]
    };
    return CdkMonitorFocus;
})();
export { CdkMonitorFocus };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBRSxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUVOLFFBQVEsRUFDUixNQUFNLEdBRVAsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFhLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7QUFHbEUsa0dBQWtHO0FBQ2xHLGtEQUFrRDtBQUNsRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDO0FBa0NuQyw4Q0FBOEM7QUFDOUMsTUFBTSxDQUFDLE1BQU0sNkJBQTZCLEdBQ3RDLElBQUksY0FBYyxDQUFzQixtQ0FBbUMsQ0FBQyxDQUFDO0FBUWpGOzs7R0FHRztBQUNILE1BQU0sMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7SUFDbEUsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQUdILGlGQUFpRjtBQUNqRjtJQUFBLE1BQ2EsWUFBWTtRQWlHdkIsWUFDWSxPQUFlLEVBQ2YsU0FBbUI7UUFDM0IscURBQXFEO1FBQ3ZCLFFBQWtCLEVBQ0csT0FDdkI7WUFMcEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLGNBQVMsR0FBVCxTQUFTLENBQVU7WUFsRy9CLGlFQUFpRTtZQUN6RCxZQUFPLEdBQWdCLElBQUksQ0FBQztZQUtwQyxnREFBZ0Q7WUFDeEMsbUJBQWMsR0FBRyxLQUFLLENBQUM7WUFjL0IscURBQXFEO1lBQzdDLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7WUFFcEUsd0RBQXdEO1lBQ2hELDJCQUFzQixHQUFHLENBQUMsQ0FBQztZQUVuQzs7Ozs7ZUFLRztZQUNLLGdDQUEyQixHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBUTlFOzs7ZUFHRztZQUNLLDZCQUF3QixHQUFHLEdBQUcsRUFBRTtnQkFDdEMsa0ZBQWtGO2dCQUNsRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO2dCQUM3QixJQUFJLENBQUMsOEJBQThCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEQsQ0FBQyxDQUFBO1lBRUQ7OztlQUdHO1lBQ0ssK0JBQTBCLEdBQUcsQ0FBQyxLQUFpQixFQUFFLEVBQUU7Z0JBQ3pELDREQUE0RDtnQkFDNUQscUVBQXFFO2dCQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO29CQUMxQixrRkFBa0Y7b0JBQ2xGLG1FQUFtRTtvQkFDbkUsTUFBTSxNQUFNLEdBQUcsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO29CQUM3RSxJQUFJLENBQUMsOEJBQThCLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQzdDO1lBQ0gsQ0FBQyxDQUFBO1lBRUQ7OztlQUdHO1lBQ0ssZ0NBQTJCLEdBQUcsQ0FBQyxLQUFpQixFQUFFLEVBQUU7Z0JBQzFELDRGQUE0RjtnQkFDNUYsMkZBQTJGO2dCQUMzRiwwQkFBMEI7Z0JBQzFCLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUU7b0JBQ2hDLFlBQVksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7aUJBQ3BDO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDekYsQ0FBQyxDQUFBO1lBRUQ7OztlQUdHO1lBQ0sseUJBQW9CLEdBQUcsR0FBRyxFQUFFO2dCQUNsQywwREFBMEQ7Z0JBQzFELG1EQUFtRDtnQkFDbkQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUE7WUFlRDs7O2VBR0c7WUFDSyxrQ0FBNkIsR0FBRyxDQUFDLEtBQVksRUFBRSxFQUFFO2dCQUN2RCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUV0RSw2RUFBNkU7Z0JBQzdFLEtBQUssSUFBSSxPQUFPLEdBQUcsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRTtvQkFDbkUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBbUIsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDbEQ7WUFDSCxDQUFDLENBQUE7WUFmQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGFBQWEsc0JBQXVDLENBQUM7UUFDdEYsQ0FBQztRQWlDRCxPQUFPLENBQUMsT0FBOEMsRUFDOUMsZ0JBQXlCLEtBQUs7WUFDcEMsbURBQW1EO1lBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtnQkFDN0IsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0I7WUFFRCxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFN0MsdUZBQXVGO1lBQ3ZGLDJGQUEyRjtZQUMzRixxRUFBcUU7WUFDckUsTUFBTSxRQUFRLEdBQUksY0FBYyxDQUFDLGFBQWEsQ0FBc0IsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFeEQsa0RBQWtEO1lBQ2xELElBQUksVUFBVSxFQUFFO2dCQUNkLElBQUksYUFBYSxFQUFFO29CQUNqQixvRkFBb0Y7b0JBQ3BGLHNGQUFzRjtvQkFDdEYsbUJBQW1CO29CQUNuQixVQUFVLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztpQkFDakM7Z0JBRUQsT0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2FBQzFDO1lBRUQsaUNBQWlDO1lBQ2pDLE1BQU0sSUFBSSxHQUF5QjtnQkFDakMsYUFBYSxFQUFFLGFBQWE7Z0JBQzVCLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBZTtnQkFDbkMsUUFBUTthQUNULENBQUM7WUFDRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBY0QsY0FBYyxDQUFDLE9BQThDO1lBQzNELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUV6RCxJQUFJLFdBQVcsRUFBRTtnQkFDZixXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUUvQixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzFDO1FBQ0gsQ0FBQztRQWtCRCxRQUFRLENBQUMsT0FBOEMsRUFDL0MsTUFBbUIsRUFDbkIsT0FBc0I7WUFFNUIsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTdDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU1Qyx3Q0FBd0M7WUFDeEMsSUFBSSxPQUFPLGFBQWEsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFO2dCQUM3Qyw0RkFBNEY7Z0JBQzNGLGFBQXFCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3ZDO1FBQ0gsQ0FBQztRQUVELFdBQVc7WUFDVCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQscUZBQXFGO1FBQzdFLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQztRQUNwQyxDQUFDO1FBRUQsK0ZBQStGO1FBQ3ZGLFVBQVU7WUFDaEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2hDLE9BQU8sR0FBRyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUM7UUFDbkMsQ0FBQztRQUVPLFlBQVksQ0FBQyxPQUFnQixFQUFFLFNBQWlCLEVBQUUsU0FBa0I7WUFDMUUsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDbEM7aUJBQU07Z0JBQ0wsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDckM7UUFDSCxDQUFDO1FBRU8sZUFBZSxDQUFDLEtBQWlCO1lBQ3ZDLHVGQUF1RjtZQUN2RiwrRkFBK0Y7WUFDL0YsaURBQWlEO1lBQ2pELGtGQUFrRjtZQUNsRiwwRkFBMEY7WUFDMUYsZ0JBQWdCO1lBQ2hCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO2FBQ3JCO1lBRUQsSUFBSSxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEQsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7YUFDOUI7aUJBQU0sSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3hDLE9BQU8sT0FBTyxDQUFDO2FBQ2hCO2lCQUFNO2dCQUNMLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1FBQ0gsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSyxXQUFXLENBQUMsT0FBb0IsRUFBRSxNQUFvQjtZQUM1RCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sS0FBSyxPQUFPLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLEtBQUssVUFBVSxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxLQUFLLE9BQU8sQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBRUQ7Ozs7V0FJRztRQUNLLDhCQUE4QixDQUFDLE1BQW1CO1lBQ3hELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztnQkFFdEIsSUFBSSxJQUFJLENBQUMsY0FBYyxzQkFBd0MsRUFBRTtvQkFDL0QsNEZBQTRGO29CQUM1Rix3RkFBd0Y7b0JBQ3hGLHlFQUF5RTtvQkFDekUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDbEU7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ssaUJBQWlCLENBQUMsS0FBaUI7WUFDekMsd0ZBQXdGO1lBQ3hGLHdDQUF3QztZQUN4QyxFQUFFO1lBQ0YsNkNBQTZDO1lBQzdDLGlEQUFpRDtZQUNqRCxTQUFTO1lBQ1QsRUFBRTtZQUNGLDBGQUEwRjtZQUMxRiwyRkFBMkY7WUFDM0YseUZBQXlGO1lBQ3pGLGdFQUFnRTtZQUNoRSw2REFBNkQ7WUFDN0QsRUFBRTtZQUNGLDZGQUE2RjtZQUM3RiwyRkFBMkY7WUFDM0YsK0ZBQStGO1lBQy9GLGNBQWM7WUFDZCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLFlBQVksSUFBSSxJQUFJLFdBQVcsWUFBWSxJQUFJO2dCQUN2RSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsZ0JBQWdCLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ssUUFBUSxDQUFDLEtBQWlCLEVBQUUsT0FBb0I7WUFDdEQsNEZBQTRGO1lBQzVGLCtGQUErRjtZQUMvRiwrRkFBK0Y7WUFDL0YsMEVBQTBFO1lBRTFFLGdHQUFnRztZQUNoRyw0QkFBNEI7WUFDNUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLGFBQWEsSUFBSSxPQUFPLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hGLE9BQU87YUFDUjtZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUM7UUFDakMsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSCxPQUFPLENBQUMsS0FBaUIsRUFBRSxPQUFvQjtZQUM3QywrRkFBK0Y7WUFDL0YseURBQXlEO1lBQ3pELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRW5ELElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxhQUFhLFlBQVksSUFBSTtnQkFDakYsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRTtnQkFDMUMsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVPLFdBQVcsQ0FBQyxPQUE2QixFQUFFLE1BQW1CO1lBQ3BFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU8sd0JBQXdCLENBQUMsV0FBaUM7WUFDaEUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO2dCQUM3QixPQUFPO2FBQ1I7WUFFRCxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO1lBQ3RDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFbkYsSUFBSSxDQUFDLHNCQUFzQixFQUFFO2dCQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtvQkFDbEMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsNkJBQTZCLEVBQ25FLDJCQUEyQixDQUFDLENBQUM7b0JBQy9CLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixFQUNsRSwyQkFBMkIsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDLENBQUMsQ0FBQzthQUNKO1lBRUQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFM0UsNkRBQTZEO1lBQzdELElBQUksRUFBRSxJQUFJLENBQUMsc0JBQXNCLEtBQUssQ0FBQyxFQUFFO2dCQUN2Qyx1REFBdUQ7Z0JBQ3ZELHNEQUFzRDtnQkFDdEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7b0JBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDckMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUVqQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyx3QkFBd0IsRUFDaEUsMkJBQTJCLENBQUMsQ0FBQztvQkFDL0IsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsMEJBQTBCLEVBQ3BFLDJCQUEyQixDQUFDLENBQUM7b0JBQy9CLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLDJCQUEyQixFQUN0RSwyQkFBMkIsQ0FBQyxDQUFDO29CQUMvQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM5RCxDQUFDLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQztRQUVPLHNCQUFzQixDQUFDLFdBQWlDO1lBQzlELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFFdEMsSUFBSSxJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNsRCxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFFLENBQUM7Z0JBRS9FLElBQUksc0JBQXNCLEdBQUcsQ0FBQyxFQUFFO29CQUM5QixJQUFJLENBQUMsMkJBQTJCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDNUU7cUJBQU07b0JBQ0wsUUFBUSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsNkJBQTZCLEVBQ3RFLDJCQUEyQixDQUFDLENBQUM7b0JBQy9CLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixFQUNyRSwyQkFBMkIsQ0FBQyxDQUFDO29CQUMvQixJQUFJLENBQUMsMkJBQTJCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNuRDthQUNGO1lBRUQsZ0VBQWdFO1lBQ2hFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtnQkFDbEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNyQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRWpDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixFQUNuRSwyQkFBMkIsQ0FBQyxDQUFDO2dCQUMvQixRQUFRLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQywwQkFBMEIsRUFDdkUsMkJBQTJCLENBQUMsQ0FBQztnQkFDL0IsUUFBUSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsMkJBQTJCLEVBQ3pFLDJCQUEyQixDQUFDLENBQUM7Z0JBQy9CLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBRS9ELDRFQUE0RTtnQkFDNUUsWUFBWSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUN6QyxZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuQyxZQUFZLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDckM7UUFDSCxDQUFDOzs7Z0JBemNGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7Z0JBckU5QixNQUFNO2dCQVJBLFFBQVE7Z0RBbUxULFFBQVEsWUFBSSxNQUFNLFNBQUMsUUFBUTtnREFDM0IsUUFBUSxZQUFJLE1BQU0sU0FBQyw2QkFBNkI7Ozt1QkE1THZEO0tBK2hCQztTQXpjWSxZQUFZO0FBMmN6Qiw4REFBOEQ7QUFDOUQsU0FBUyxTQUFTLENBQUMsS0FBWTtJQUM3Qix1RUFBdUU7SUFDdkUscUVBQXFFO0lBQ3JFLE9BQU8sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQXVCLENBQUM7QUFDN0YsQ0FBQztBQUdEOzs7Ozs7OztHQVFHO0FBQ0g7SUFBQSxNQUdhLGVBQWU7UUFJMUIsWUFBb0IsV0FBb0MsRUFBVSxhQUEyQjtZQUF6RSxnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7WUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBYztZQUZuRixtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFlLENBQUM7UUFFcUMsQ0FBQztRQUVqRyxlQUFlO1lBQ2IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUNwRCxJQUFJLENBQUMsV0FBVyxFQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsQ0FBQztpQkFDckUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsV0FBVztZQUNULElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVwRCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtnQkFDN0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQ3pDO1FBQ0gsQ0FBQzs7O2dCQXRCRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLG9EQUFvRDtpQkFDL0Q7Ozs7Z0JBemlCQyxVQUFVO2dCQThpQnVFLFlBQVk7OztpQ0FGNUYsTUFBTTs7SUFrQlQsc0JBQUM7S0FBQTtTQXBCWSxlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMsIF9nZXRTaGFkb3dSb290fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7aXNGYWtlTW91c2Vkb3duRnJvbVNjcmVlblJlYWRlcn0gZnJvbSAnLi4vZmFrZS1tb3VzZWRvd24nO1xuXG5cbi8vIFRoaXMgaXMgdGhlIHZhbHVlIHVzZWQgYnkgQW5ndWxhckpTIE1hdGVyaWFsLiBUaHJvdWdoIHRyaWFsIGFuZCBlcnJvciAob24gaVBob25lIDZTKSB0aGV5IGZvdW5kXG4vLyB0aGF0IGEgdmFsdWUgb2YgYXJvdW5kIDY1MG1zIHNlZW1zIGFwcHJvcHJpYXRlLlxuZXhwb3J0IGNvbnN0IFRPVUNIX0JVRkZFUl9NUyA9IDY1MDtcblxuXG5leHBvcnQgdHlwZSBGb2N1c09yaWdpbiA9ICd0b3VjaCcgfCAnbW91c2UnIHwgJ2tleWJvYXJkJyB8ICdwcm9ncmFtJyB8IG51bGw7XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIG9wdGlvbnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBuYXRpdmUgYGZvY3VzYCBldmVudC5cbiAqIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQvZm9jdXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c09wdGlvbnMge1xuICAvKiogV2hldGhlciB0aGUgYnJvd3NlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgZm9jdXNlZC4gKi9cbiAgcHJldmVudFNjcm9sbD86IGJvb2xlYW47XG59XG5cbi8qKiBEZXRlY3Rpb24gbW9kZSB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXMgZXZlbnQuICovXG5leHBvcnQgY29uc3QgZW51bSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlIHtcbiAgLyoqXG4gICAqIEFueSBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQgdGhhdCBoYXBwZW5lZCBpbiB0aGUgcHJldmlvdXNcbiAgICogdGljayBvciB0aGUgY3VycmVudCB0aWNrIHdpbGwgYmUgdXNlZCB0byBhc3NpZ24gYSBmb2N1cyBldmVudCdzIG9yaWdpbiAodG9cbiAgICogZWl0aGVyIG1vdXNlLCBrZXlib2FyZCwgb3IgdG91Y2gpLiBUaGlzIGlzIHRoZSBkZWZhdWx0IG9wdGlvbi5cbiAgICovXG4gIElNTUVESUFURSxcbiAgLyoqXG4gICAqIEEgZm9jdXMgZXZlbnQncyBvcmlnaW4gaXMgYWx3YXlzIGF0dHJpYnV0ZWQgdG8gdGhlIGxhc3QgY29ycmVzcG9uZGluZ1xuICAgKiBtb3VzZWRvd24sIGtleWRvd24sIG9yIHRvdWNoc3RhcnQgZXZlbnQsIG5vIG1hdHRlciBob3cgbG9uZyBhZ28gaXQgb2NjdXJlZC5cbiAgICovXG4gIEVWRU5UVUFMXG59XG5cbi8qKiBJbmplY3RhYmxlIHNlcnZpY2UtbGV2ZWwgb3B0aW9ucyBmb3IgRm9jdXNNb25pdG9yLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb2N1c01vbml0b3JPcHRpb25zIHtcbiAgZGV0ZWN0aW9uTW9kZT86IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGU7XG59XG5cbi8qKiBJbmplY3Rpb25Ub2tlbiBmb3IgRm9jdXNNb25pdG9yT3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPEZvY3VzTW9uaXRvck9wdGlvbnM+KCdjZGstZm9jdXMtbW9uaXRvci1kZWZhdWx0LW9wdGlvbnMnKTtcblxudHlwZSBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgY2hlY2tDaGlsZHJlbjogYm9vbGVhbixcbiAgc3ViamVjdDogU3ViamVjdDxGb2N1c09yaWdpbj4sXG4gIHJvb3ROb2RlOiBIVE1MRWxlbWVudHxEb2N1bWVudFxufTtcblxuLyoqXG4gKiBFdmVudCBsaXN0ZW5lciBvcHRpb25zIHRoYXQgZW5hYmxlIGNhcHR1cmluZyBhbmQgYWxzb1xuICogbWFyayB0aGUgbGlzdGVuZXIgYXMgcGFzc2l2ZSBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyBpdC5cbiAqL1xuY29uc3QgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWVcbn0pO1xuXG5cbi8qKiBNb25pdG9ycyBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzIHRvIGRldGVybWluZSB0aGUgY2F1c2Ugb2YgZm9jdXMgZXZlbnRzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRm9jdXNNb25pdG9yIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBmb2N1cyBvcmlnaW4gdGhhdCB0aGUgbmV4dCBmb2N1cyBldmVudCBpcyBhIHJlc3VsdCBvZi4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luOiBGb2N1c09yaWdpbiA9IG51bGw7XG5cbiAgLyoqIFRoZSBGb2N1c09yaWdpbiBvZiB0aGUgbGFzdCBmb2N1cyBldmVudCB0cmFja2VkIGJ5IHRoZSBGb2N1c01vbml0b3IuICovXG4gIHByaXZhdGUgX2xhc3RGb2N1c09yaWdpbjogRm9jdXNPcmlnaW47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHdpbmRvdyBoYXMganVzdCBiZWVuIGZvY3VzZWQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZTtcblxuICAvKiogVGhlIHRhcmdldCBvZiB0aGUgbGFzdCB0b3VjaCBldmVudC4gKi9cbiAgcHJpdmF0ZSBfbGFzdFRvdWNoVGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGw7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB0b3VjaCB0aW1lb3V0LCB1c2VkIHRvIGNhbmNlbCB0aW1lb3V0IGxhdGVyLiAqL1xuICBwcml2YXRlIF90b3VjaFRpbWVvdXRJZDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdGltZW91dCBpZCBvZiB0aGUgd2luZG93IGZvY3VzIHRpbWVvdXQuICovXG4gIHByaXZhdGUgX3dpbmRvd0ZvY3VzVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSBvcmlnaW4gY2xlYXJpbmcgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfb3JpZ2luVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIE1hcCBvZiBlbGVtZW50cyBiZWluZyBtb25pdG9yZWQgdG8gdGhlaXIgaW5mby4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudEluZm8gPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBNb25pdG9yZWRFbGVtZW50SW5mbz4oKTtcblxuICAvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyBjdXJyZW50bHkgYmVpbmcgbW9uaXRvcmVkLiAqL1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50Q291bnQgPSAwO1xuXG4gIC8qKlxuICAgKiBLZWVwcyB0cmFjayBvZiB0aGUgcm9vdCBub2RlcyB0byB3aGljaCB3ZSd2ZSBjdXJyZW50bHkgYm91bmQgYSBmb2N1cy9ibHVyIGhhbmRsZXIsXG4gICAqIGFzIHdlbGwgYXMgdGhlIG51bWJlciBvZiBtb25pdG9yZWQgZWxlbWVudHMgdGhhdCB0aGV5IGNvbnRhaW4uIFdlIGhhdmUgdG8gdHJlYXQgZm9jdXMvYmx1clxuICAgKiBoYW5kbGVycyBkaWZmZXJlbnRseSBmcm9tIHRoZSByZXN0IG9mIHRoZSBldmVudHMsIGJlY2F1c2UgdGhlIGJyb3dzZXIgd29uJ3QgZW1pdCBldmVudHNcbiAgICogdG8gdGhlIGRvY3VtZW50IHdoZW4gZm9jdXMgbW92ZXMgaW5zaWRlIG9mIGEgc2hhZG93IHJvb3QuXG4gICAqL1xuICBwcml2YXRlIF9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudCA9IG5ldyBNYXA8SFRNTEVsZW1lbnR8RG9jdW1lbnQsIG51bWJlcj4oKTtcblxuICAvKipcbiAgICogVGhlIHNwZWNpZmllZCBkZXRlY3Rpb24gbW9kZSwgdXNlZCBmb3IgYXR0cmlidXRpbmcgdGhlIG9yaWdpbiBvZiBhIGZvY3VzXG4gICAqIGV2ZW50LlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGV0ZWN0aW9uTW9kZTogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGBrZXlkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudEtleWRvd25MaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBPbiBrZXlkb3duIHJlY29yZCB0aGUgb3JpZ2luIGFuZCBjbGVhciBhbnkgdG91Y2ggZXZlbnQgdGhhdCBtYXkgYmUgaW4gcHJvZ3Jlc3MuXG4gICAgdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbDtcbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZSgna2V5Ym9hcmQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYG1vdXNlZG93bmAgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lciA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgIC8vIE9uIG1vdXNlZG93biByZWNvcmQgdGhlIG9yaWdpbiBvbmx5IGlmIHRoZXJlIGlzIG5vdCB0b3VjaFxuICAgIC8vIHRhcmdldCwgc2luY2UgYSBtb3VzZWRvd24gY2FuIGhhcHBlbiBhcyBhIHJlc3VsdCBvZiBhIHRvdWNoIGV2ZW50LlxuICAgIGlmICghdGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSB7XG4gICAgICAvLyBJbiBzb21lIGNhc2VzIHNjcmVlbiByZWFkZXJzIGZpcmUgZmFrZSBgbW91c2Vkb3duYCBldmVudHMgaW5zdGVhZCBvZiBga2V5ZG93bmAuXG4gICAgICAvLyBSZXNvbHZlIHRoZSBmb2N1cyBzb3VyY2UgdG8gYGtleWJvYXJkYCBpZiB3ZSBkZXRlY3Qgb25lIG9mIHRoZW0uXG4gICAgICBjb25zdCBzb3VyY2UgPSBpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyKGV2ZW50KSA/ICdrZXlib2FyZCcgOiAnbW91c2UnO1xuICAgICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUoc291cmNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgbGlzdGVuZXIgZm9yIGB0b3VjaHN0YXJ0YCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lciA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xuICAgIC8vIFdoZW4gdGhlIHRvdWNoc3RhcnQgZXZlbnQgZmlyZXMgdGhlIGZvY3VzIGV2ZW50IGlzIG5vdCB5ZXQgaW4gdGhlIGV2ZW50IHF1ZXVlLiBUaGlzIG1lYW5zXG4gICAgLy8gd2UgY2FuJ3QgcmVseSBvbiB0aGUgdHJpY2sgdXNlZCBhYm92ZSAoc2V0dGluZyB0aW1lb3V0IG9mIDFtcykuIEluc3RlYWQgd2Ugd2FpdCA2NTBtcyB0b1xuICAgIC8vIHNlZSBpZiBhIGZvY3VzIGhhcHBlbnMuXG4gICAgaWYgKHRoaXMuX3RvdWNoVGltZW91dElkICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICB0aGlzLl90b3VjaFRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0ID0gbnVsbCwgVE9VQ0hfQlVGRkVSX01TKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBldmVudHMgb24gdGhlIHdpbmRvdy5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAvLyBNYWtlIGEgbm90ZSBvZiB3aGVuIHRoZSB3aW5kb3cgcmVnYWlucyBmb2N1cywgc28gd2UgY2FuXG4gICAgLy8gcmVzdG9yZSB0aGUgb3JpZ2luIGluZm8gZm9yIHRoZSBmb2N1c2VkIGVsZW1lbnQuXG4gICAgdGhpcy5fd2luZG93Rm9jdXNlZCA9IHRydWU7XG4gICAgdGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3dpbmRvd0ZvY3VzZWQgPSBmYWxzZSk7XG4gIH1cblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueXxudWxsLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19NT05JVE9SX0RFRkFVTFRfT1BUSU9OUykgb3B0aW9uczpcbiAgICAgICAgICBGb2N1c01vbml0b3JPcHRpb25zfG51bGwpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMuX2RldGVjdGlvbk1vZGUgPSBvcHRpb25zPy5kZXRlY3Rpb25Nb2RlIHx8IEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUuSU1NRURJQVRFO1xuICB9XG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGZvY3VzYCBhbmQgJ2JsdXInIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICBjb25zdCBoYW5kbGVyID0gZXZlbnQudHlwZSA9PT0gJ2ZvY3VzJyA/IHRoaXMuX29uRm9jdXMgOiB0aGlzLl9vbkJsdXI7XG5cbiAgICAvLyBXZSBuZWVkIHRvIHdhbGsgdXAgdGhlIGFuY2VzdG9yIGNoYWluIGluIG9yZGVyIHRvIHN1cHBvcnQgYGNoZWNrQ2hpbGRyZW5gLlxuICAgIGZvciAobGV0IGVsZW1lbnQgPSB0YXJnZXQ7IGVsZW1lbnQ7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnQpIHtcbiAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBldmVudCBhcyBGb2N1c0V2ZW50LCBlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgLyoqXG4gICAqIE1vbml0b3JzIGZvY3VzIG9uIGFuIGVsZW1lbnQgYW5kIGFwcGxpZXMgYXBwcm9wcmlhdGUgQ1NTIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3JcbiAgICogQHBhcmFtIGNoZWNrQ2hpbGRyZW4gV2hldGhlciB0byBjb3VudCB0aGUgZWxlbWVudCBhcyBmb2N1c2VkIHdoZW4gaXRzIGNoaWxkcmVuIGFyZSBmb2N1c2VkLlxuICAgKiBAcmV0dXJucyBBbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgZm9jdXMgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy5cbiAgICogICAgIFdoZW4gdGhlIGVsZW1lbnQgaXMgYmx1cnJlZCwgbnVsbCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBjaGVja0NoaWxkcmVuPzogYm9vbGVhbik6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+O1xuXG4gIG1vbml0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBjaGVja0NoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPiB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSdyZSBub3Qgb24gdGhlIGJyb3dzZXIgcGxhdGZvcm0uXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YobnVsbCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBpbnNpZGUgdGhlIHNoYWRvdyBET00sIHdlIG5lZWQgdG8gYmluZCBvdXIgZm9jdXMvYmx1ciBsaXN0ZW5lcnMgdG9cbiAgICAvLyB0aGUgc2hhZG93IHJvb3QsIHJhdGhlciB0aGFuIHRoZSBgZG9jdW1lbnRgLCBiZWNhdXNlIHRoZSBicm93c2VyIHdvbid0IGVtaXQgZm9jdXMgZXZlbnRzXG4gICAgLy8gdG8gdGhlIGBkb2N1bWVudGAsIGlmIGZvY3VzIGlzIG1vdmluZyB3aXRoaW4gdGhlIHNhbWUgc2hhZG93IHJvb3QuXG4gICAgY29uc3Qgcm9vdE5vZGUgPSAoX2dldFNoYWRvd1Jvb3QobmF0aXZlRWxlbWVudCkgYXMgSFRNTEVsZW1lbnR8bnVsbCkgfHwgdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICBjb25zdCBjYWNoZWRJbmZvID0gdGhpcy5fZWxlbWVudEluZm8uZ2V0KG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UncmUgYWxyZWFkeSBtb25pdG9yaW5nIHRoaXMgZWxlbWVudC5cbiAgICBpZiAoY2FjaGVkSW5mbykge1xuICAgICAgaWYgKGNoZWNrQ2hpbGRyZW4pIHtcbiAgICAgICAgLy8gVE9ETyhDT01QLTMxOCk6IHRoaXMgY2FuIGJlIHByb2JsZW1hdGljLCBiZWNhdXNlIGl0J2xsIHR1cm4gYWxsIG5vbi1jaGVja0NoaWxkcmVuXG4gICAgICAgIC8vIG9ic2VydmVycyBpbnRvIG9uZXMgdGhhdCBiZWhhdmUgYXMgaWYgYGNoZWNrQ2hpbGRyZW5gIHdhcyB0dXJuZWQgb24uIFdlIG5lZWQgYSBtb3JlXG4gICAgICAgIC8vIHJvYnVzdCBzb2x1dGlvbi5cbiAgICAgICAgY2FjaGVkSW5mby5jaGVja0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZEluZm8uc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbW9uaXRvcmVkIGVsZW1lbnQgaW5mby5cbiAgICBjb25zdCBpbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbyA9IHtcbiAgICAgIGNoZWNrQ2hpbGRyZW46IGNoZWNrQ2hpbGRyZW4sXG4gICAgICBzdWJqZWN0OiBuZXcgU3ViamVjdDxGb2N1c09yaWdpbj4oKSxcbiAgICAgIHJvb3ROb2RlXG4gICAgfTtcbiAgICB0aGlzLl9lbGVtZW50SW5mby5zZXQobmF0aXZlRWxlbWVudCwgaW5mbyk7XG4gICAgdGhpcy5fcmVnaXN0ZXJHbG9iYWxMaXN0ZW5lcnMoaW5mbyk7XG5cbiAgICByZXR1cm4gaW5mby5zdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wcyBtb25pdG9yaW5nIGFuIGVsZW1lbnQgYW5kIHJlbW92ZXMgYWxsIGZvY3VzIGNsYXNzZXMuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICBpZiAoZWxlbWVudEluZm8pIHtcbiAgICAgIGVsZW1lbnRJbmZvLnN1YmplY3QuY29tcGxldGUoKTtcblxuICAgICAgdGhpcy5fc2V0Q2xhc3NlcyhuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2VsZW1lbnRJbmZvLmRlbGV0ZShuYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIGVsZW1lbnQgdmlhIHRoZSBzcGVjaWZpZWQgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBFbGVtZW50IHRvIGZvY3VzLlxuICAgKiBAcGFyYW0gb3JpZ2luIEZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZm9jdXMgYmVoYXZpb3IuXG4gICAqL1xuICBmb2N1c1ZpYShlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50Piwgb3JpZ2luOiBGb2N1c09yaWdpbiwgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQ7XG5cbiAgZm9jdXNWaWEoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICBvcmlnaW46IEZvY3VzT3JpZ2luLFxuICAgICAgICAgIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkIHtcblxuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgdGhpcy5fc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luKTtcblxuICAgIC8vIGBmb2N1c2AgaXNuJ3QgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXJcbiAgICBpZiAodHlwZW9mIG5hdGl2ZUVsZW1lbnQuZm9jdXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIENhc3QgdGhlIGVsZW1lbnQgdG8gYGFueWAsIGJlY2F1c2UgdGhlIFRTIHR5cGluZ3MgZG9uJ3QgaGF2ZSB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciB5ZXQuXG4gICAgICAobmF0aXZlRWxlbWVudCBhcyBhbnkpLmZvY3VzKG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKiBBY2Nlc3MgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCBkb2N1bWVudCByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIGNvbnN0IGRvYyA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICBwcml2YXRlIF90b2dnbGVDbGFzcyhlbGVtZW50OiBFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgc2hvdWxkU2V0OiBib29sZWFuKSB7XG4gICAgaWYgKHNob3VsZFNldCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldEZvY3VzT3JpZ2luKGV2ZW50OiBGb2N1c0V2ZW50KTogRm9jdXNPcmlnaW4ge1xuICAgIC8vIElmIHdlIGNvdWxkbid0IGRldGVjdCBhIGNhdXNlIGZvciB0aGUgZm9jdXMgZXZlbnQsIGl0J3MgZHVlIHRvIG9uZSBvZiB0aHJlZSByZWFzb25zOlxuICAgIC8vIDEpIFRoZSB3aW5kb3cgaGFzIGp1c3QgcmVnYWluZWQgZm9jdXMsIGluIHdoaWNoIGNhc2Ugd2Ugd2FudCB0byByZXN0b3JlIHRoZSBmb2N1c2VkIHN0YXRlIG9mXG4gICAgLy8gICAgdGhlIGVsZW1lbnQgZnJvbSBiZWZvcmUgdGhlIHdpbmRvdyBibHVycmVkLlxuICAgIC8vIDIpIEl0IHdhcyBjYXVzZWQgYnkgYSB0b3VjaCBldmVudCwgaW4gd2hpY2ggY2FzZSB3ZSBtYXJrIHRoZSBvcmlnaW4gYXMgJ3RvdWNoJy5cbiAgICAvLyAzKSBUaGUgZWxlbWVudCB3YXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkLCBpbiB3aGljaCBjYXNlIHdlIHNob3VsZCBtYXJrIHRoZSBvcmlnaW4gYXNcbiAgICAvLyAgICAncHJvZ3JhbScuXG4gICAgaWYgKHRoaXMuX29yaWdpbikge1xuICAgICAgcmV0dXJuIHRoaXMuX29yaWdpbjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fd2luZG93Rm9jdXNlZCAmJiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4pIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXN0Rm9jdXNPcmlnaW47XG4gICAgfSBlbHNlIGlmICh0aGlzLl93YXNDYXVzZWRCeVRvdWNoKGV2ZW50KSkge1xuICAgICAgcmV0dXJuICd0b3VjaCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAncHJvZ3JhbSc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvY3VzIGNsYXNzZXMgb24gdGhlIGVsZW1lbnQgYmFzZWQgb24gdGhlIGdpdmVuIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdXBkYXRlIHRoZSBjbGFzc2VzIG9uLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBmb2N1cyBvcmlnaW4uXG4gICAqL1xuICBwcml2YXRlIF9zZXRDbGFzc2VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW4/OiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstZm9jdXNlZCcsICEhb3JpZ2luKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLXRvdWNoLWZvY3VzZWQnLCBvcmlnaW4gPT09ICd0b3VjaCcpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGsta2V5Ym9hcmQtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ2tleWJvYXJkJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1tb3VzZS1mb2N1c2VkJywgb3JpZ2luID09PSAnbW91c2UnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLXByb2dyYW0tZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3Byb2dyYW0nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBvcmlnaW4gYW5kIHNjaGVkdWxlcyBhbiBhc3luYyBmdW5jdGlvbiB0byBjbGVhciBpdCBhdCB0aGUgZW5kIG9mIHRoZSBldmVudCBxdWV1ZS5cbiAgICogSWYgdGhlIGRldGVjdGlvbiBtb2RlIGlzICdldmVudHVhbCcsIHRoZSBvcmlnaW4gaXMgbmV2ZXIgY2xlYXJlZC5cbiAgICogQHBhcmFtIG9yaWdpbiBUaGUgb3JpZ2luIHRvIHNldC5cbiAgICovXG4gIHByaXZhdGUgX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKG9yaWdpbjogRm9jdXNPcmlnaW4pOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fb3JpZ2luID0gb3JpZ2luO1xuXG4gICAgICBpZiAodGhpcy5fZGV0ZWN0aW9uTW9kZSA9PT0gRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEUpIHtcbiAgICAgICAgLy8gU29tZXRpbWVzIHRoZSBmb2N1cyBvcmlnaW4gd29uJ3QgYmUgdmFsaWQgaW4gRmlyZWZveCBiZWNhdXNlIEZpcmVmb3ggc2VlbXMgdG8gZm9jdXMgKm9uZSpcbiAgICAgICAgLy8gdGljayBhZnRlciB0aGUgaW50ZXJhY3Rpb24gZXZlbnQgZmlyZWQuIFRvIGVuc3VyZSB0aGUgZm9jdXMgb3JpZ2luIGlzIGFsd2F5cyBjb3JyZWN0LFxuICAgICAgICAvLyB0aGUgZm9jdXMgb3JpZ2luIHdpbGwgYmUgZGV0ZXJtaW5lZCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX29yaWdpblRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fb3JpZ2luID0gbnVsbCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGZvY3VzIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaHN0YXJ0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBldmVudCB3YXMgY2F1c2VkIGJ5IGEgdG91Y2guXG4gICAqL1xuICBwcml2YXRlIF93YXNDYXVzZWRCeVRvdWNoKGV2ZW50OiBGb2N1c0V2ZW50KTogYm9vbGVhbiB7XG4gICAgLy8gTm90ZShtbWFsZXJiYSk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgbm90IHF1aXRlIHBlcmZlY3QsIHRoZXJlIGlzIGEgc21hbGwgZWRnZSBjYXNlLlxuICAgIC8vIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgZG9tIHN0cnVjdHVyZTpcbiAgICAvL1xuICAgIC8vIDxkaXYgI3BhcmVudCB0YWJpbmRleD1cIjBcIiBjZGtGb2N1c0NsYXNzZXM+XG4gICAgLy8gICA8ZGl2ICNjaGlsZCAoY2xpY2spPVwiI3BhcmVudC5mb2N1cygpXCI+PC9kaXY+XG4gICAgLy8gPC9kaXY+XG4gICAgLy9cbiAgICAvLyBJZiB0aGUgdXNlciB0b3VjaGVzIHRoZSAjY2hpbGQgZWxlbWVudCBhbmQgdGhlICNwYXJlbnQgaXMgcHJvZ3JhbW1hdGljYWxseSBmb2N1c2VkIGFzIGFcbiAgICAvLyByZXN1bHQsIHRoaXMgY29kZSB3aWxsIHN0aWxsIGNvbnNpZGVyIGl0IHRvIGhhdmUgYmVlbiBjYXVzZWQgYnkgdGhlIHRvdWNoIGV2ZW50IGFuZCB3aWxsXG4gICAgLy8gYXBwbHkgdGhlIGNkay10b3VjaC1mb2N1c2VkIGNsYXNzIHJhdGhlciB0aGFuIHRoZSBjZGstcHJvZ3JhbS1mb2N1c2VkIGNsYXNzLiBUaGlzIGlzIGFcbiAgICAvLyByZWxhdGl2ZWx5IHNtYWxsIGVkZ2UtY2FzZSB0aGF0IGNhbiBiZSB3b3JrZWQgYXJvdW5kIGJ5IHVzaW5nXG4gICAgLy8gZm9jdXNWaWEocGFyZW50RWwsICdwcm9ncmFtJykgdG8gZm9jdXMgdGhlIHBhcmVudCBlbGVtZW50LlxuICAgIC8vXG4gICAgLy8gSWYgd2UgZGVjaWRlIHRoYXQgd2UgYWJzb2x1dGVseSBtdXN0IGhhbmRsZSB0aGlzIGNhc2UgY29ycmVjdGx5LCB3ZSBjYW4gZG8gc28gYnkgbGlzdGVuaW5nXG4gICAgLy8gZm9yIHRoZSBmaXJzdCBmb2N1cyBldmVudCBhZnRlciB0aGUgdG91Y2hzdGFydCwgYW5kIHRoZW4gdGhlIGZpcnN0IGJsdXIgZXZlbnQgYWZ0ZXIgdGhhdFxuICAgIC8vIGZvY3VzIGV2ZW50LiBXaGVuIHRoYXQgYmx1ciBldmVudCBmaXJlcyB3ZSBrbm93IHRoYXQgd2hhdGV2ZXIgZm9sbG93cyBpcyBub3QgYSByZXN1bHQgb2YgdGhlXG4gICAgLy8gdG91Y2hzdGFydC5cbiAgICBjb25zdCBmb2N1c1RhcmdldCA9IGdldFRhcmdldChldmVudCk7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RUb3VjaFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiYgZm9jdXNUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIChmb2N1c1RhcmdldCA9PT0gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IHx8IGZvY3VzVGFyZ2V0LmNvbnRhaW5zKHRoaXMuX2xhc3RUb3VjaFRhcmdldCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgZm9jdXMgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3VzIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9vbkZvY3VzKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIE5PVEUobW1hbGVyYmEpOiBXZSBjdXJyZW50bHkgc2V0IHRoZSBjbGFzc2VzIGJhc2VkIG9uIHRoZSBmb2N1cyBvcmlnaW4gb2YgdGhlIG1vc3QgcmVjZW50XG4gICAgLy8gZm9jdXMgZXZlbnQgYWZmZWN0aW5nIHRoZSBtb25pdG9yZWQgZWxlbWVudC4gSWYgd2Ugd2FudCB0byB1c2UgdGhlIG9yaWdpbiBvZiB0aGUgZmlyc3QgZXZlbnRcbiAgICAvLyBpbnN0ZWFkIHdlIHNob3VsZCBjaGVjayBmb3IgdGhlIGNkay1mb2N1c2VkIGNsYXNzIGhlcmUgYW5kIHJldHVybiBpZiB0aGUgZWxlbWVudCBhbHJlYWR5IGhhc1xuICAgIC8vIGl0LiAoVGhpcyBvbmx5IG1hdHRlcnMgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBpbmNsdWRlc0NoaWxkcmVuID0gdHJ1ZSkuXG5cbiAgICAvLyBJZiB3ZSBhcmUgbm90IGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGV2ZW50IHRhcmdldCBpcyB0aGVcbiAgICAvLyBtb25pdG9yZWQgZWxlbWVudCBpdHNlbGYuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFlbGVtZW50SW5mbyB8fCAoIWVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZWxlbWVudCAhPT0gZ2V0VGFyZ2V0KGV2ZW50KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcmlnaW4gPSB0aGlzLl9nZXRGb2N1c09yaWdpbihldmVudCk7XG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50LCBvcmlnaW4pO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgb3JpZ2luKTtcbiAgICB0aGlzLl9sYXN0Rm9jdXNPcmlnaW4gPSBvcmlnaW47XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBibHVyIGV2ZW50cyBvbiBhIHJlZ2lzdGVyZWQgZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50IFRoZSBibHVyIGV2ZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAqL1xuICBfb25CbHVyKGV2ZW50OiBGb2N1c0V2ZW50LCBlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIC8vIElmIHdlIGFyZSBjb3VudGluZyBjaGlsZC1lbGVtZW50LWZvY3VzIGFzIGZvY3VzZWQsIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZW4ndCBqdXN0IGJsdXJyaW5nIGluXG4gICAgLy8gb3JkZXIgdG8gZm9jdXMgYW5vdGhlciBjaGlsZCBvZiB0aGUgbW9uaXRvcmVkIGVsZW1lbnQuXG4gICAgY29uc3QgZWxlbWVudEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQoZWxlbWVudCk7XG5cbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8IChlbGVtZW50SW5mby5jaGVja0NoaWxkcmVuICYmIGV2ZW50LnJlbGF0ZWRUYXJnZXQgaW5zdGFuY2VvZiBOb2RlICYmXG4gICAgICAgIGVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0Q2xhc3NlcyhlbGVtZW50KTtcbiAgICB0aGlzLl9lbWl0T3JpZ2luKGVsZW1lbnRJbmZvLnN1YmplY3QsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdE9yaWdpbihzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPiwgb3JpZ2luOiBGb2N1c09yaWdpbikge1xuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gc3ViamVjdC5uZXh0KG9yaWdpbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVnaXN0ZXJHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByb290Tm9kZSA9IGVsZW1lbnRJbmZvLnJvb3ROb2RlO1xuICAgIGNvbnN0IHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgPSB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5nZXQocm9vdE5vZGUpIHx8IDA7XG5cbiAgICBpZiAoIXJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICByb290Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuc2V0KHJvb3ROb2RlLCByb290Tm9kZUZvY3VzTGlzdGVuZXJzICsgMSk7XG5cbiAgICAvLyBSZWdpc3RlciBnbG9iYWwgbGlzdGVuZXJzIHdoZW4gZmlyc3QgZWxlbWVudCBpcyBtb25pdG9yZWQuXG4gICAgaWYgKCsrdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50ID09PSAxKSB7XG4gICAgICAvLyBOb3RlOiB3ZSBsaXN0ZW4gdG8gZXZlbnRzIGluIHRoZSBjYXB0dXJlIHBoYXNlIHNvIHdlXG4gICAgICAvLyBjYW4gZGV0ZWN0IHRoZW0gZXZlbiBpZiB0aGUgdXNlciBzdG9wcyBwcm9wYWdhdGlvbi5cbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVtb3ZlR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvOiBNb25pdG9yZWRFbGVtZW50SW5mbykge1xuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudEluZm8ucm9vdE5vZGU7XG5cbiAgICBpZiAodGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuaGFzKHJvb3ROb2RlKSkge1xuICAgICAgY29uc3Qgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyA9IHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmdldChyb290Tm9kZSkhO1xuXG4gICAgICBpZiAocm9vdE5vZGVGb2N1c0xpc3RlbmVycyA+IDEpIHtcbiAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuc2V0KHJvb3ROb2RlLCByb290Tm9kZUZvY3VzTGlzdGVuZXJzIC0gMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgcm9vdE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX3Jvb3ROb2RlRm9jdXNBbmRCbHVyTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZGVsZXRlKHJvb3ROb2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVbnJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBsYXN0IGVsZW1lbnQgaXMgdW5tb25pdG9yZWQuXG4gICAgaWYgKCEtLXRoaXMuX21vbml0b3JlZEVsZW1lbnRDb3VudCkge1xuICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9kb2N1bWVudEtleWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2RvY3VtZW50TW91c2Vkb3duTGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl93aW5kb3dGb2N1c0xpc3RlbmVyKTtcblxuICAgICAgLy8gQ2xlYXIgdGltZW91dHMgZm9yIGFsbCBwb3RlbnRpYWxseSBwZW5kaW5nIHRpbWVvdXRzIHRvIHByZXZlbnQgdGhlIGxlYWtzLlxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3dpbmRvd0ZvY3VzVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90b3VjaFRpbWVvdXRJZCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fb3JpZ2luVGltZW91dElkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEdldHMgdGhlIHRhcmdldCBvZiBhbiBldmVudCwgYWNjb3VudGluZyBmb3IgU2hhZG93IERPTS4gKi9cbmZ1bmN0aW9uIGdldFRhcmdldChldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudHxudWxsIHtcbiAgLy8gSWYgYW4gZXZlbnQgaXMgYm91bmQgb3V0c2lkZSB0aGUgU2hhZG93IERPTSwgdGhlIGBldmVudC50YXJnZXRgIHdpbGxcbiAgLy8gcG9pbnQgdG8gdGhlIHNoYWRvdyByb290IHNvIHdlIGhhdmUgdG8gdXNlIGBjb21wb3NlZFBhdGhgIGluc3RlYWQuXG4gIHJldHVybiAoZXZlbnQuY29tcG9zZWRQYXRoID8gZXZlbnQuY29tcG9zZWRQYXRoKClbMF0gOiBldmVudC50YXJnZXQpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IGRldGVybWluZXMgaG93IGEgcGFydGljdWxhciBlbGVtZW50IHdhcyBmb2N1c2VkICh2aWEga2V5Ym9hcmQsIG1vdXNlLCB0b3VjaCwgb3JcbiAqIHByb2dyYW1tYXRpY2FsbHkpIGFuZCBhZGRzIGNvcnJlc3BvbmRpbmcgY2xhc3NlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHZhcmlhbnRzIG9mIHRoaXMgZGlyZWN0aXZlOlxuICogMSkgY2RrTW9uaXRvckVsZW1lbnRGb2N1czogZG9lcyBub3QgY29uc2lkZXIgYW4gZWxlbWVudCB0byBiZSBmb2N1c2VkIGlmIG9uZSBvZiBpdHMgY2hpbGRyZW4gaXNcbiAqICAgIGZvY3VzZWQuXG4gKiAyKSBjZGtNb25pdG9yU3VidHJlZUZvY3VzOiBjb25zaWRlcnMgYW4gZWxlbWVudCBmb2N1c2VkIGlmIGl0IG9yIGFueSBvZiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtNb25pdG9yRWxlbWVudEZvY3VzXSwgW2Nka01vbml0b3JTdWJ0cmVlRm9jdXNdJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrTW9uaXRvckZvY3VzIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbW9uaXRvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBAT3V0cHV0KCkgY2RrRm9jdXNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPEZvY3VzT3JpZ2luPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcikge31cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvci5tb25pdG9yKFxuICAgICAgdGhpcy5fZWxlbWVudFJlZixcbiAgICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2Nka01vbml0b3JTdWJ0cmVlRm9jdXMnKSlcbiAgICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcblxuICAgIGlmICh0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG4iXX0=