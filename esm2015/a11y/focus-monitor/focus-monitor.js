import { __decorate, __metadata, __param } from "tslib";
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
    let FocusMonitor = class FocusMonitor {
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
    };
    FocusMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function FocusMonitor_Factory() { return new FocusMonitor(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT, 8), i0.ɵɵinject(FOCUS_MONITOR_DEFAULT_OPTIONS, 8)); }, token: FocusMonitor, providedIn: "root" });
    FocusMonitor = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(2, Optional()), __param(2, Inject(DOCUMENT)),
        __param(3, Optional()), __param(3, Inject(FOCUS_MONITOR_DEFAULT_OPTIONS)),
        __metadata("design:paramtypes", [NgZone,
            Platform, Object, Object])
    ], FocusMonitor);
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
    let CdkMonitorFocus = class CdkMonitorFocus {
        constructor(_elementRef, _focusMonitor) {
            this._elementRef = _elementRef;
            this._focusMonitor = _focusMonitor;
            this.cdkFocusChange = new EventEmitter();
            this._monitorSubscription = this._focusMonitor.monitor(this._elementRef, this._elementRef.nativeElement.hasAttribute('cdkMonitorSubtreeFocus'))
                .subscribe(origin => this.cdkFocusChange.emit(origin));
        }
        ngOnDestroy() {
            this._focusMonitor.stopMonitoring(this._elementRef);
            this._monitorSubscription.unsubscribe();
        }
    };
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], CdkMonitorFocus.prototype, "cdkFocusChange", void 0);
    CdkMonitorFocus = __decorate([
        Directive({
            selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
        }),
        __metadata("design:paramtypes", [ElementRef, FocusMonitor])
    ], CdkMonitorFocus);
    return CdkMonitorFocus;
})();
export { CdkMonitorFocus };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9jdXMtbW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy1tb25pdG9yL2ZvY3VzLW1vbml0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUUsK0JBQStCLEVBQUUsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDaEcsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLE1BQU0sRUFDTixVQUFVLEVBQ1YsY0FBYyxFQUNkLE1BQU0sRUFFTixRQUFRLEVBQ1IsTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBYSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBZSxNQUFNLE1BQU0sQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQywrQkFBK0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7O0FBR2xFLGtHQUFrRztBQUNsRyxrREFBa0Q7QUFDbEQsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztBQWtDbkMsOENBQThDO0FBQzlDLE1BQU0sQ0FBQyxNQUFNLDZCQUE2QixHQUN0QyxJQUFJLGNBQWMsQ0FBc0IsbUNBQW1DLENBQUMsQ0FBQztBQVFqRjs7O0dBR0c7QUFDSCxNQUFNLDJCQUEyQixHQUFHLCtCQUErQixDQUFDO0lBQ2xFLE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDLENBQUM7QUFHSCxpRkFBaUY7QUFFakY7SUFBQSxJQUFhLFlBQVksR0FBekIsTUFBYSxZQUFZO1FBaUd2QixZQUNZLE9BQWUsRUFDZixTQUFtQjtRQUMzQixxREFBcUQ7UUFDdkIs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QyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybSwgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucywgX2dldFNoYWRvd1Jvb3R9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtpc0Zha2VNb3VzZWRvd25Gcm9tU2NyZWVuUmVhZGVyfSBmcm9tICcuLi9mYWtlLW1vdXNlZG93bic7XG5cblxuLy8gVGhpcyBpcyB0aGUgdmFsdWUgdXNlZCBieSBBbmd1bGFySlMgTWF0ZXJpYWwuIFRocm91Z2ggdHJpYWwgYW5kIGVycm9yIChvbiBpUGhvbmUgNlMpIHRoZXkgZm91bmRcbi8vIHRoYXQgYSB2YWx1ZSBvZiBhcm91bmQgNjUwbXMgc2VlbXMgYXBwcm9wcmlhdGUuXG5leHBvcnQgY29uc3QgVE9VQ0hfQlVGRkVSX01TID0gNjUwO1xuXG5cbmV4cG9ydCB0eXBlIEZvY3VzT3JpZ2luID0gJ3RvdWNoJyB8ICdtb3VzZScgfCAna2V5Ym9hcmQnIHwgJ3Byb2dyYW0nIHwgbnVsbDtcblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgb3B0aW9ucyB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gdGhlIG5hdGl2ZSBgZm9jdXNgIGV2ZW50LlxuICogdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC9mb2N1c1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzT3B0aW9ucyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicm93c2VyIHNob3VsZCBzY3JvbGwgdG8gdGhlIGVsZW1lbnQgd2hlbiBpdCBpcyBmb2N1c2VkLiAqL1xuICBwcmV2ZW50U2Nyb2xsPzogYm9vbGVhbjtcbn1cblxuLyoqIERldGVjdGlvbiBtb2RlIHVzZWQgZm9yIGF0dHJpYnV0aW5nIHRoZSBvcmlnaW4gb2YgYSBmb2N1cyBldmVudC4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEZvY3VzTW9uaXRvckRldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogQW55IG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCB0aGF0IGhhcHBlbmVkIGluIHRoZSBwcmV2aW91c1xuICAgKiB0aWNrIG9yIHRoZSBjdXJyZW50IHRpY2sgd2lsbCBiZSB1c2VkIHRvIGFzc2lnbiBhIGZvY3VzIGV2ZW50J3Mgb3JpZ2luICh0b1xuICAgKiBlaXRoZXIgbW91c2UsIGtleWJvYXJkLCBvciB0b3VjaCkuIFRoaXMgaXMgdGhlIGRlZmF1bHQgb3B0aW9uLlxuICAgKi9cbiAgSU1NRURJQVRFLFxuICAvKipcbiAgICogQSBmb2N1cyBldmVudCdzIG9yaWdpbiBpcyBhbHdheXMgYXR0cmlidXRlZCB0byB0aGUgbGFzdCBjb3JyZXNwb25kaW5nXG4gICAqIG1vdXNlZG93biwga2V5ZG93biwgb3IgdG91Y2hzdGFydCBldmVudCwgbm8gbWF0dGVyIGhvdyBsb25nIGFnbyBpdCBvY2N1cmVkLlxuICAgKi9cbiAgRVZFTlRVQUxcbn1cblxuLyoqIEluamVjdGFibGUgc2VydmljZS1sZXZlbCBvcHRpb25zIGZvciBGb2N1c01vbml0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvY3VzTW9uaXRvck9wdGlvbnMge1xuICBkZXRlY3Rpb25Nb2RlPzogRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZTtcbn1cblxuLyoqIEluamVjdGlvblRva2VuIGZvciBGb2N1c01vbml0b3JPcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48Rm9jdXNNb25pdG9yT3B0aW9ucz4oJ2Nkay1mb2N1cy1tb25pdG9yLWRlZmF1bHQtb3B0aW9ucycpO1xuXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICBjaGVja0NoaWxkcmVuOiBib29sZWFuLFxuICBzdWJqZWN0OiBTdWJqZWN0PEZvY3VzT3JpZ2luPixcbiAgcm9vdE5vZGU6IEhUTUxFbGVtZW50fERvY3VtZW50XG59O1xuXG4vKipcbiAqIEV2ZW50IGxpc3RlbmVyIG9wdGlvbnMgdGhhdCBlbmFibGUgY2FwdHVyaW5nIGFuZCBhbHNvXG4gKiBtYXJrIHRoZSBsaXN0ZW5lciBhcyBwYXNzaXZlIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0LlxuICovXG5jb25zdCBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufSk7XG5cblxuLyoqIE1vbml0b3JzIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMgdG8gZGV0ZXJtaW5lIHRoZSBjYXVzZSBvZiBmb2N1cyBldmVudHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGb2N1c01vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGZvY3VzIG9yaWdpbiB0aGF0IHRoZSBuZXh0IGZvY3VzIGV2ZW50IGlzIGEgcmVzdWx0IG9mLiAqL1xuICBwcml2YXRlIF9vcmlnaW46IEZvY3VzT3JpZ2luID0gbnVsbDtcblxuICAvKiogVGhlIEZvY3VzT3JpZ2luIG9mIHRoZSBsYXN0IGZvY3VzIGV2ZW50IHRyYWNrZWQgYnkgdGhlIEZvY3VzTW9uaXRvci4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbjtcblxuICAvKiogV2hldGhlciB0aGUgd2luZG93IGhhcyBqdXN0IGJlZW4gZm9jdXNlZC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNlZCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgdGFyZ2V0IG9mIHRoZSBsYXN0IHRvdWNoIGV2ZW50LiAqL1xuICBwcml2YXRlIF9sYXN0VG91Y2hUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIHRvdWNoIHRpbWVvdXQsIHVzZWQgdG8gY2FuY2VsIHRpbWVvdXQgbGF0ZXIuICovXG4gIHByaXZhdGUgX3RvdWNoVGltZW91dElkOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0aW1lb3V0IGlkIG9mIHRoZSB3aW5kb3cgZm9jdXMgdGltZW91dC4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Rm9jdXNUaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogVGhlIHRpbWVvdXQgaWQgb2YgdGhlIG9yaWdpbiBjbGVhcmluZyB0aW1lb3V0LiAqL1xuICBwcml2YXRlIF9vcmlnaW5UaW1lb3V0SWQ6IG51bWJlcjtcblxuICAvKiogTWFwIG9mIGVsZW1lbnRzIGJlaW5nIG1vbml0b3JlZCB0byB0aGVpciBpbmZvLiAqL1xuICBwcml2YXRlIF9lbGVtZW50SW5mbyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE1vbml0b3JlZEVsZW1lbnRJbmZvPigpO1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBiZWluZyBtb25pdG9yZWQuICovXG4gIHByaXZhdGUgX21vbml0b3JlZEVsZW1lbnRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIEtlZXBzIHRyYWNrIG9mIHRoZSByb290IG5vZGVzIHRvIHdoaWNoIHdlJ3ZlIGN1cnJlbnRseSBib3VuZCBhIGZvY3VzL2JsdXIgaGFuZGxlcixcbiAgICogYXMgd2VsbCBhcyB0aGUgbnVtYmVyIG9mIG1vbml0b3JlZCBlbGVtZW50cyB0aGF0IHRoZXkgY29udGFpbi4gV2UgaGF2ZSB0byB0cmVhdCBmb2N1cy9ibHVyXG4gICAqIGhhbmRsZXJzIGRpZmZlcmVudGx5IGZyb20gdGhlIHJlc3Qgb2YgdGhlIGV2ZW50cywgYmVjYXVzZSB0aGUgYnJvd3NlciB3b24ndCBlbWl0IGV2ZW50c1xuICAgKiB0byB0aGUgZG9jdW1lbnQgd2hlbiBmb2N1cyBtb3ZlcyBpbnNpZGUgb2YgYSBzaGFkb3cgcm9vdC5cbiAgICovXG4gIHByaXZhdGUgX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50ID0gbmV3IE1hcDxIVE1MRWxlbWVudHxEb2N1bWVudCwgbnVtYmVyPigpO1xuXG4gIC8qKlxuICAgKiBUaGUgc3BlY2lmaWVkIGRldGVjdGlvbiBtb2RlLCB1c2VkIGZvciBhdHRyaWJ1dGluZyB0aGUgb3JpZ2luIG9mIGEgZm9jdXNcbiAgICogZXZlbnQuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXRlY3Rpb25Nb2RlOiBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlO1xuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYGtleWRvd25gIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE9uIGtleWRvd24gcmVjb3JkIHRoZSBvcmlnaW4gYW5kIGNsZWFyIGFueSB0b3VjaCBldmVudCB0aGF0IG1heSBiZSBpbiBwcm9ncmVzcy5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsO1xuICAgIHRoaXMuX3NldE9yaWdpbkZvckN1cnJlbnRFdmVudFF1ZXVlKCdrZXlib2FyZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgbW91c2Vkb3duYCBldmVudHMgb24gdGhlIGRvY3VtZW50LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudE1vdXNlZG93bkxpc3RlbmVyID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgLy8gT24gbW91c2Vkb3duIHJlY29yZCB0aGUgb3JpZ2luIG9ubHkgaWYgdGhlcmUgaXMgbm90IHRvdWNoXG4gICAgLy8gdGFyZ2V0LCBzaW5jZSBhIG1vdXNlZG93biBjYW4gaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGEgdG91Y2ggZXZlbnQuXG4gICAgaWYgKCF0aGlzLl9sYXN0VG91Y2hUYXJnZXQpIHtcbiAgICAgIC8vIEluIHNvbWUgY2FzZXMgc2NyZWVuIHJlYWRlcnMgZmlyZSBmYWtlIGBtb3VzZWRvd25gIGV2ZW50cyBpbnN0ZWFkIG9mIGBrZXlkb3duYC5cbiAgICAgIC8vIFJlc29sdmUgdGhlIGZvY3VzIHNvdXJjZSB0byBga2V5Ym9hcmRgIGlmIHdlIGRldGVjdCBvbmUgb2YgdGhlbS5cbiAgICAgIGNvbnN0IHNvdXJjZSA9IGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQpID8gJ2tleWJvYXJkJyA6ICdtb3VzZSc7XG4gICAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShzb3VyY2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBsaXN0ZW5lciBmb3IgYHRvdWNoc3RhcnRgIGV2ZW50cyBvbiB0aGUgZG9jdW1lbnQuXG4gICAqIE5lZWRzIHRvIGJlIGFuIGFycm93IGZ1bmN0aW9uIGluIG9yZGVyIHRvIHByZXNlcnZlIHRoZSBjb250ZXh0IHdoZW4gaXQgZ2V0cyBib3VuZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50VG91Y2hzdGFydExpc3RlbmVyID0gKGV2ZW50OiBUb3VjaEV2ZW50KSA9PiB7XG4gICAgLy8gV2hlbiB0aGUgdG91Y2hzdGFydCBldmVudCBmaXJlcyB0aGUgZm9jdXMgZXZlbnQgaXMgbm90IHlldCBpbiB0aGUgZXZlbnQgcXVldWUuIFRoaXMgbWVhbnNcbiAgICAvLyB3ZSBjYW4ndCByZWx5IG9uIHRoZSB0cmljayB1c2VkIGFib3ZlIChzZXR0aW5nIHRpbWVvdXQgb2YgMW1zKS4gSW5zdGVhZCB3ZSB3YWl0IDY1MG1zIHRvXG4gICAgLy8gc2VlIGlmIGEgZm9jdXMgaGFwcGVucy5cbiAgICBpZiAodGhpcy5fdG91Y2hUaW1lb3V0SWQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICB9XG5cbiAgICB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgIHRoaXMuX3RvdWNoVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgPSBudWxsLCBUT1VDSF9CVUZGRVJfTVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGV2ZW50cyBvbiB0aGUgd2luZG93LlxuICAgKiBOZWVkcyB0byBiZSBhbiBhcnJvdyBmdW5jdGlvbiBpbiBvcmRlciB0byBwcmVzZXJ2ZSB0aGUgY29udGV4dCB3aGVuIGl0IGdldHMgYm91bmQuXG4gICAqL1xuICBwcml2YXRlIF93aW5kb3dGb2N1c0xpc3RlbmVyID0gKCkgPT4ge1xuICAgIC8vIE1ha2UgYSBub3RlIG9mIHdoZW4gdGhlIHdpbmRvdyByZWdhaW5zIGZvY3VzLCBzbyB3ZSBjYW5cbiAgICAvLyByZXN0b3JlIHRoZSBvcmlnaW4gaW5mbyBmb3IgdGhlIGZvY3VzZWQgZWxlbWVudC5cbiAgICB0aGlzLl93aW5kb3dGb2N1c2VkID0gdHJ1ZTtcbiAgICB0aGlzLl93aW5kb3dGb2N1c1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fd2luZG93Rm9jdXNlZCA9IGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSxcbiAgICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55fG51bGwsXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KEZPQ1VTX01PTklUT1JfREVGQVVMVF9PUFRJT05TKSBvcHRpb25zOlxuICAgICAgICAgIEZvY3VzTW9uaXRvck9wdGlvbnN8bnVsbCkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgdGhpcy5fZGV0ZWN0aW9uTW9kZSA9IG9wdGlvbnM/LmRldGVjdGlvbk1vZGUgfHwgRm9jdXNNb25pdG9yRGV0ZWN0aW9uTW9kZS5JTU1FRElBVEU7XG4gIH1cbiAgLyoqXG4gICAqIEV2ZW50IGxpc3RlbmVyIGZvciBgZm9jdXNgIGFuZCAnYmx1cicgZXZlbnRzIG9uIHRoZSBkb2N1bWVudC5cbiAgICogTmVlZHMgdG8gYmUgYW4gYXJyb3cgZnVuY3Rpb24gaW4gb3JkZXIgdG8gcHJlc2VydmUgdGhlIGNvbnRleHQgd2hlbiBpdCBnZXRzIGJvdW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lciA9IChldmVudDogRXZlbnQpID0+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBnZXRUYXJnZXQoZXZlbnQpO1xuICAgIGNvbnN0IGhhbmRsZXIgPSBldmVudC50eXBlID09PSAnZm9jdXMnID8gdGhpcy5fb25Gb2N1cyA6IHRoaXMuX29uQmx1cjtcblxuICAgIC8vIFdlIG5lZWQgdG8gd2FsayB1cCB0aGUgYW5jZXN0b3IgY2hhaW4gaW4gb3JkZXIgdG8gc3VwcG9ydCBgY2hlY2tDaGlsZHJlbmAuXG4gICAgZm9yIChsZXQgZWxlbWVudCA9IHRhcmdldDsgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50IGFzIEZvY3VzRXZlbnQsIGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNb25pdG9ycyBmb2N1cyBvbiBhbiBlbGVtZW50IGFuZCBhcHBsaWVzIGFwcHJvcHJpYXRlIENTUyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yXG4gICAqIEBwYXJhbSBjaGVja0NoaWxkcmVuIFdoZXRoZXIgdG8gY291bnQgdGhlIGVsZW1lbnQgYXMgZm9jdXNlZCB3aGVuIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAgICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGZvY3VzIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuXG4gICAqICAgICBXaGVuIHRoZSBlbGVtZW50IGlzIGJsdXJyZWQsIG51bGwgd2lsbCBiZSBlbWl0dGVkLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBIVE1MRWxlbWVudCwgY2hlY2tDaGlsZHJlbj86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPEZvY3VzT3JpZ2luPjtcblxuICAvKipcbiAgICogTW9uaXRvcnMgZm9jdXMgb24gYW4gZWxlbWVudCBhbmQgYXBwbGllcyBhcHByb3ByaWF0ZSBDU1MgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvclxuICAgKiBAcGFyYW0gY2hlY2tDaGlsZHJlbiBXaGV0aGVyIHRvIGNvdW50IHRoZSBlbGVtZW50IGFzIGZvY3VzZWQgd2hlbiBpdHMgY2hpbGRyZW4gYXJlIGZvY3VzZWQuXG4gICAqIEByZXR1cm5zIEFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBmb2N1cyBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLlxuICAgKiAgICAgV2hlbiB0aGUgZWxlbWVudCBpcyBibHVycmVkLCBudWxsIHdpbGwgYmUgZW1pdHRlZC5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIGNoZWNrQ2hpbGRyZW4/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxGb2N1c09yaWdpbj47XG5cbiAgbW9uaXRvcihlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIGNoZWNrQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IE9ic2VydmFibGU8Rm9jdXNPcmlnaW4+IHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHdlJ3JlIG5vdCBvbiB0aGUgYnJvd3NlciBwbGF0Zm9ybS5cbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGluc2lkZSB0aGUgc2hhZG93IERPTSwgd2UgbmVlZCB0byBiaW5kIG91ciBmb2N1cy9ibHVyIGxpc3RlbmVycyB0b1xuICAgIC8vIHRoZSBzaGFkb3cgcm9vdCwgcmF0aGVyIHRoYW4gdGhlIGBkb2N1bWVudGAsIGJlY2F1c2UgdGhlIGJyb3dzZXIgd29uJ3QgZW1pdCBmb2N1cyBldmVudHNcbiAgICAvLyB0byB0aGUgYGRvY3VtZW50YCwgaWYgZm9jdXMgaXMgbW92aW5nIHdpdGhpbiB0aGUgc2FtZSBzaGFkb3cgcm9vdC5cbiAgICBjb25zdCByb290Tm9kZSA9IChfZ2V0U2hhZG93Um9vdChuYXRpdmVFbGVtZW50KSBhcyBIVE1MRWxlbWVudHxudWxsKSB8fCB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIGNvbnN0IGNhY2hlZEluZm8gPSB0aGlzLl9lbGVtZW50SW5mby5nZXQobmF0aXZlRWxlbWVudCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSdyZSBhbHJlYWR5IG1vbml0b3JpbmcgdGhpcyBlbGVtZW50LlxuICAgIGlmIChjYWNoZWRJbmZvKSB7XG4gICAgICBpZiAoY2hlY2tDaGlsZHJlbikge1xuICAgICAgICAvLyBUT0RPKENPTVAtMzE4KTogdGhpcyBjYW4gYmUgcHJvYmxlbWF0aWMsIGJlY2F1c2UgaXQnbGwgdHVybiBhbGwgbm9uLWNoZWNrQ2hpbGRyZW5cbiAgICAgICAgLy8gb2JzZXJ2ZXJzIGludG8gb25lcyB0aGF0IGJlaGF2ZSBhcyBpZiBgY2hlY2tDaGlsZHJlbmAgd2FzIHR1cm5lZCBvbi4gV2UgbmVlZCBhIG1vcmVcbiAgICAgICAgLy8gcm9idXN0IHNvbHV0aW9uLlxuICAgICAgICBjYWNoZWRJbmZvLmNoZWNrQ2hpbGRyZW4gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FjaGVkSW5mby5zdWJqZWN0LmFzT2JzZXJ2YWJsZSgpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBtb25pdG9yZWQgZWxlbWVudCBpbmZvLlxuICAgIGNvbnN0IGluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICAgICAgY2hlY2tDaGlsZHJlbjogY2hlY2tDaGlsZHJlbixcbiAgICAgIHN1YmplY3Q6IG5ldyBTdWJqZWN0PEZvY3VzT3JpZ2luPigpLFxuICAgICAgcm9vdE5vZGVcbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnRJbmZvLnNldChuYXRpdmVFbGVtZW50LCBpbmZvKTtcbiAgICB0aGlzLl9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhpbmZvKTtcblxuICAgIHJldHVybiBpbmZvLnN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgbW9uaXRvcmluZyBhbiBlbGVtZW50IGFuZCByZW1vdmVzIGFsbCBmb2N1cyBjbGFzc2VzLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFN0b3BzIG1vbml0b3JpbmcgYW4gZWxlbWVudCBhbmQgcmVtb3ZlcyBhbGwgZm9jdXMgY2xhc3Nlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkO1xuXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pOiB2b2lkIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50KTtcbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChuYXRpdmVFbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50SW5mbykge1xuICAgICAgZWxlbWVudEluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuXG4gICAgICB0aGlzLl9zZXRDbGFzc2VzKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudEluZm8uZGVsZXRlKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXJzKGVsZW1lbnRJbmZvKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogRm9jdXNlcyB0aGUgZWxlbWVudCB2aWEgdGhlIHNwZWNpZmllZCBmb2N1cyBvcmlnaW4uXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gZm9jdXMuXG4gICAqIEBwYXJhbSBvcmlnaW4gRm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIHRoZSBmb2N1cyBiZWhhdmlvci5cbiAgICovXG4gIGZvY3VzVmlhKGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBvcmlnaW46IEZvY3VzT3JpZ2luLCBvcHRpb25zPzogRm9jdXNPcHRpb25zKTogdm9pZDtcblxuICBmb2N1c1ZpYShlbGVtZW50OiBIVE1MRWxlbWVudCB8IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgIG9yaWdpbjogRm9jdXNPcmlnaW4sXG4gICAgICAgICAgb3B0aW9ucz86IEZvY3VzT3B0aW9ucyk6IHZvaWQge1xuXG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICB0aGlzLl9zZXRPcmlnaW5Gb3JDdXJyZW50RXZlbnRRdWV1ZShvcmlnaW4pO1xuXG4gICAgLy8gYGZvY3VzYCBpc24ndCBhdmFpbGFibGUgb24gdGhlIHNlcnZlclxuICAgIGlmICh0eXBlb2YgbmF0aXZlRWxlbWVudC5mb2N1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQ2FzdCB0aGUgZWxlbWVudCB0byBgYW55YCwgYmVjYXVzZSB0aGUgVFMgdHlwaW5ncyBkb24ndCBoYXZlIHRoZSBgb3B0aW9uc2AgcGFyYW1ldGVyIHlldC5cbiAgICAgIChuYXRpdmVFbGVtZW50IGFzIGFueSkuZm9jdXMob3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZWxlbWVudEluZm8uZm9yRWFjaCgoX2luZm8sIGVsZW1lbnQpID0+IHRoaXMuc3RvcE1vbml0b3JpbmcoZWxlbWVudCkpO1xuICB9XG5cbiAgLyoqIEFjY2VzcyBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIGRvY3VtZW50IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXREb2N1bWVudCgpOiBEb2N1bWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvY3VtZW50IHx8IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqIFVzZSBkZWZhdWx0VmlldyBvZiBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIHdpbmRvdyByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0V2luZG93KCk6IFdpbmRvdyB7XG4gICAgY29uc3QgZG9jID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICByZXR1cm4gZG9jLmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgfVxuXG4gIHByaXZhdGUgX3RvZ2dsZUNsYXNzKGVsZW1lbnQ6IEVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCBzaG91bGRTZXQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoc2hvdWxkU2V0KSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Rm9jdXNPcmlnaW4oZXZlbnQ6IEZvY3VzRXZlbnQpOiBGb2N1c09yaWdpbiB7XG4gICAgLy8gSWYgd2UgY291bGRuJ3QgZGV0ZWN0IGEgY2F1c2UgZm9yIHRoZSBmb2N1cyBldmVudCwgaXQncyBkdWUgdG8gb25lIG9mIHRocmVlIHJlYXNvbnM6XG4gICAgLy8gMSkgVGhlIHdpbmRvdyBoYXMganVzdCByZWdhaW5lZCBmb2N1cywgaW4gd2hpY2ggY2FzZSB3ZSB3YW50IHRvIHJlc3RvcmUgdGhlIGZvY3VzZWQgc3RhdGUgb2ZcbiAgICAvLyAgICB0aGUgZWxlbWVudCBmcm9tIGJlZm9yZSB0aGUgd2luZG93IGJsdXJyZWQuXG4gICAgLy8gMikgSXQgd2FzIGNhdXNlZCBieSBhIHRvdWNoIGV2ZW50LCBpbiB3aGljaCBjYXNlIHdlIG1hcmsgdGhlIG9yaWdpbiBhcyAndG91Y2gnLlxuICAgIC8vIDMpIFRoZSBlbGVtZW50IHdhcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQsIGluIHdoaWNoIGNhc2Ugd2Ugc2hvdWxkIG1hcmsgdGhlIG9yaWdpbiBhc1xuICAgIC8vICAgICdwcm9ncmFtJy5cbiAgICBpZiAodGhpcy5fb3JpZ2luKSB7XG4gICAgICByZXR1cm4gdGhpcy5fb3JpZ2luO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl93aW5kb3dGb2N1c2VkICYmIHRoaXMuX2xhc3RGb2N1c09yaWdpbikge1xuICAgICAgcmV0dXJuIHRoaXMuX2xhc3RGb2N1c09yaWdpbjtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQpKSB7XG4gICAgICByZXR1cm4gJ3RvdWNoJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICdwcm9ncmFtJztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jdXMgY2xhc3NlcyBvbiB0aGUgZWxlbWVudCBiYXNlZCBvbiB0aGUgZ2l2ZW4gZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB1cGRhdGUgdGhlIGNsYXNzZXMgb24uXG4gICAqIEBwYXJhbSBvcmlnaW4gVGhlIGZvY3VzIG9yaWdpbi5cbiAgICovXG4gIHByaXZhdGUgX3NldENsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIG9yaWdpbj86IEZvY3VzT3JpZ2luKTogdm9pZCB7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1mb2N1c2VkJywgISFvcmlnaW4pO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstdG91Y2gtZm9jdXNlZCcsIG9yaWdpbiA9PT0gJ3RvdWNoJyk7XG4gICAgdGhpcy5fdG9nZ2xlQ2xhc3MoZWxlbWVudCwgJ2Nkay1rZXlib2FyZC1mb2N1c2VkJywgb3JpZ2luID09PSAna2V5Ym9hcmQnKTtcbiAgICB0aGlzLl90b2dnbGVDbGFzcyhlbGVtZW50LCAnY2RrLW1vdXNlLWZvY3VzZWQnLCBvcmlnaW4gPT09ICdtb3VzZScpO1xuICAgIHRoaXMuX3RvZ2dsZUNsYXNzKGVsZW1lbnQsICdjZGstcHJvZ3JhbS1mb2N1c2VkJywgb3JpZ2luID09PSAncHJvZ3JhbScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9yaWdpbiBhbmQgc2NoZWR1bGVzIGFuIGFzeW5jIGZ1bmN0aW9uIHRvIGNsZWFyIGl0IGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50IHF1ZXVlLlxuICAgKiBJZiB0aGUgZGV0ZWN0aW9uIG1vZGUgaXMgJ2V2ZW50dWFsJywgdGhlIG9yaWdpbiBpcyBuZXZlciBjbGVhcmVkLlxuICAgKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gdG8gc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0T3JpZ2luRm9yQ3VycmVudEV2ZW50UXVldWUob3JpZ2luOiBGb2N1c09yaWdpbik6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9vcmlnaW4gPSBvcmlnaW47XG5cbiAgICAgIGlmICh0aGlzLl9kZXRlY3Rpb25Nb2RlID09PSBGb2N1c01vbml0b3JEZXRlY3Rpb25Nb2RlLklNTUVESUFURSkge1xuICAgICAgICAvLyBTb21ldGltZXMgdGhlIGZvY3VzIG9yaWdpbiB3b24ndCBiZSB2YWxpZCBpbiBGaXJlZm94IGJlY2F1c2UgRmlyZWZveCBzZWVtcyB0byBmb2N1cyAqb25lKlxuICAgICAgICAvLyB0aWNrIGFmdGVyIHRoZSBpbnRlcmFjdGlvbiBldmVudCBmaXJlZC4gVG8gZW5zdXJlIHRoZSBmb2N1cyBvcmlnaW4gaXMgYWx3YXlzIGNvcnJlY3QsXG4gICAgICAgIC8vIHRoZSBmb2N1cyBvcmlnaW4gd2lsbCBiZSBkZXRlcm1pbmVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fb3JpZ2luVGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9vcmlnaW4gPSBudWxsLCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZm9jdXMgZXZlbnQgd2FzIGNhdXNlZCBieSBhIHRvdWNoc3RhcnQgZXZlbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGV2ZW50IHdhcyBjYXVzZWQgYnkgYSB0b3VjaC5cbiAgICovXG4gIHByaXZhdGUgX3dhc0NhdXNlZEJ5VG91Y2goZXZlbnQ6IEZvY3VzRXZlbnQpOiBib29sZWFuIHtcbiAgICAvLyBOb3RlKG1tYWxlcmJhKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBub3QgcXVpdGUgcGVyZmVjdCwgdGhlcmUgaXMgYSBzbWFsbCBlZGdlIGNhc2UuXG4gICAgLy8gQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBkb20gc3RydWN0dXJlOlxuICAgIC8vXG4gICAgLy8gPGRpdiAjcGFyZW50IHRhYmluZGV4PVwiMFwiIGNka0ZvY3VzQ2xhc3Nlcz5cbiAgICAvLyAgIDxkaXYgI2NoaWxkIChjbGljayk9XCIjcGFyZW50LmZvY3VzKClcIj48L2Rpdj5cbiAgICAvLyA8L2Rpdj5cbiAgICAvL1xuICAgIC8vIElmIHRoZSB1c2VyIHRvdWNoZXMgdGhlICNjaGlsZCBlbGVtZW50IGFuZCB0aGUgI3BhcmVudCBpcyBwcm9ncmFtbWF0aWNhbGx5IGZvY3VzZWQgYXMgYVxuICAgIC8vIHJlc3VsdCwgdGhpcyBjb2RlIHdpbGwgc3RpbGwgY29uc2lkZXIgaXQgdG8gaGF2ZSBiZWVuIGNhdXNlZCBieSB0aGUgdG91Y2ggZXZlbnQgYW5kIHdpbGxcbiAgICAvLyBhcHBseSB0aGUgY2RrLXRvdWNoLWZvY3VzZWQgY2xhc3MgcmF0aGVyIHRoYW4gdGhlIGNkay1wcm9ncmFtLWZvY3VzZWQgY2xhc3MuIFRoaXMgaXMgYVxuICAgIC8vIHJlbGF0aXZlbHkgc21hbGwgZWRnZS1jYXNlIHRoYXQgY2FuIGJlIHdvcmtlZCBhcm91bmQgYnkgdXNpbmdcbiAgICAvLyBmb2N1c1ZpYShwYXJlbnRFbCwgJ3Byb2dyYW0nKSB0byBmb2N1cyB0aGUgcGFyZW50IGVsZW1lbnQuXG4gICAgLy9cbiAgICAvLyBJZiB3ZSBkZWNpZGUgdGhhdCB3ZSBhYnNvbHV0ZWx5IG11c3QgaGFuZGxlIHRoaXMgY2FzZSBjb3JyZWN0bHksIHdlIGNhbiBkbyBzbyBieSBsaXN0ZW5pbmdcbiAgICAvLyBmb3IgdGhlIGZpcnN0IGZvY3VzIGV2ZW50IGFmdGVyIHRoZSB0b3VjaHN0YXJ0LCBhbmQgdGhlbiB0aGUgZmlyc3QgYmx1ciBldmVudCBhZnRlciB0aGF0XG4gICAgLy8gZm9jdXMgZXZlbnQuIFdoZW4gdGhhdCBibHVyIGV2ZW50IGZpcmVzIHdlIGtub3cgdGhhdCB3aGF0ZXZlciBmb2xsb3dzIGlzIG5vdCBhIHJlc3VsdCBvZiB0aGVcbiAgICAvLyB0b3VjaHN0YXJ0LlxuICAgIGNvbnN0IGZvY3VzVGFyZ2V0ID0gZ2V0VGFyZ2V0KGV2ZW50KTtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFRvdWNoVGFyZ2V0IGluc3RhbmNlb2YgTm9kZSAmJiBmb2N1c1RhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgKGZvY3VzVGFyZ2V0ID09PSB0aGlzLl9sYXN0VG91Y2hUYXJnZXQgfHwgZm9jdXNUYXJnZXQuY29udGFpbnModGhpcy5fbGFzdFRvdWNoVGFyZ2V0KSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBmb2N1cyBldmVudHMgb24gYSByZWdpc3RlcmVkIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudCBUaGUgZm9jdXMgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX29uRm9jdXMoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gTk9URShtbWFsZXJiYSk6IFdlIGN1cnJlbnRseSBzZXQgdGhlIGNsYXNzZXMgYmFzZWQgb24gdGhlIGZvY3VzIG9yaWdpbiBvZiB0aGUgbW9zdCByZWNlbnRcbiAgICAvLyBmb2N1cyBldmVudCBhZmZlY3RpbmcgdGhlIG1vbml0b3JlZCBlbGVtZW50LiBJZiB3ZSB3YW50IHRvIHVzZSB0aGUgb3JpZ2luIG9mIHRoZSBmaXJzdCBldmVudFxuICAgIC8vIGluc3RlYWQgd2Ugc2hvdWxkIGNoZWNrIGZvciB0aGUgY2RrLWZvY3VzZWQgY2xhc3MgaGVyZSBhbmQgcmV0dXJuIGlmIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzXG4gICAgLy8gaXQuIChUaGlzIG9ubHkgbWF0dGVycyBmb3IgZWxlbWVudHMgdGhhdCBoYXZlIGluY2x1ZGVzQ2hpbGRyZW4gPSB0cnVlKS5cblxuICAgIC8vIElmIHdlIGFyZSBub3QgY291bnRpbmcgY2hpbGQtZWxlbWVudC1mb2N1cyBhcyBmb2N1c2VkLCBtYWtlIHN1cmUgdGhhdCB0aGUgZXZlbnQgdGFyZ2V0IGlzIHRoZVxuICAgIC8vIG1vbml0b3JlZCBlbGVtZW50IGl0c2VsZi5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWVsZW1lbnRJbmZvIHx8ICghZWxlbWVudEluZm8uY2hlY2tDaGlsZHJlbiAmJiBlbGVtZW50ICE9PSBnZXRUYXJnZXQoZXZlbnQpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG9yaWdpbiA9IHRoaXMuX2dldEZvY3VzT3JpZ2luKGV2ZW50KTtcbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQsIG9yaWdpbik7XG4gICAgdGhpcy5fZW1pdE9yaWdpbihlbGVtZW50SW5mby5zdWJqZWN0LCBvcmlnaW4pO1xuICAgIHRoaXMuX2xhc3RGb2N1c09yaWdpbiA9IG9yaWdpbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGJsdXIgZXZlbnRzIG9uIGEgcmVnaXN0ZXJlZCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGJsdXIgZXZlbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICovXG4gIF9vbkJsdXIoZXZlbnQ6IEZvY3VzRXZlbnQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgLy8gSWYgd2UgYXJlIGNvdW50aW5nIGNoaWxkLWVsZW1lbnQtZm9jdXMgYXMgZm9jdXNlZCwgbWFrZSBzdXJlIHRoYXQgd2UgYXJlbid0IGp1c3QgYmx1cnJpbmcgaW5cbiAgICAvLyBvcmRlciB0byBmb2N1cyBhbm90aGVyIGNoaWxkIG9mIHRoZSBtb25pdG9yZWQgZWxlbWVudC5cbiAgICBjb25zdCBlbGVtZW50SW5mbyA9IHRoaXMuX2VsZW1lbnRJbmZvLmdldChlbGVtZW50KTtcblxuICAgIGlmICghZWxlbWVudEluZm8gfHwgKGVsZW1lbnRJbmZvLmNoZWNrQ2hpbGRyZW4gJiYgZXZlbnQucmVsYXRlZFRhcmdldCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgICAgZWxlbWVudC5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRDbGFzc2VzKGVsZW1lbnQpO1xuICAgIHRoaXMuX2VtaXRPcmlnaW4oZWxlbWVudEluZm8uc3ViamVjdCwgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0T3JpZ2luKHN1YmplY3Q6IFN1YmplY3Q8Rm9jdXNPcmlnaW4+LCBvcmlnaW46IEZvY3VzT3JpZ2luKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiBzdWJqZWN0Lm5leHQob3JpZ2luKSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWdpc3Rlckdsb2JhbExpc3RlbmVycyhlbGVtZW50SW5mbzogTW9uaXRvcmVkRWxlbWVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3ROb2RlID0gZWxlbWVudEluZm8ucm9vdE5vZGU7XG4gICAgY29uc3Qgcm9vdE5vZGVGb2N1c0xpc3RlbmVycyA9IHRoaXMuX3Jvb3ROb2RlRm9jdXNMaXN0ZW5lckNvdW50LmdldChyb290Tm9kZSkgfHwgMDtcblxuICAgIGlmICghcm9vdE5vZGVGb2N1c0xpc3RlbmVycykge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcm9vdE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICAgIHJvb3ROb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9yb290Tm9kZUZvY3VzQW5kQmx1ckxpc3RlbmVyLFxuICAgICAgICAgIGNhcHR1cmVFdmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgKyAxKTtcblxuICAgIC8vIFJlZ2lzdGVyIGdsb2JhbCBsaXN0ZW5lcnMgd2hlbiBmaXJzdCBlbGVtZW50IGlzIG1vbml0b3JlZC5cbiAgICBpZiAoKyt0aGlzLl9tb25pdG9yZWRFbGVtZW50Q291bnQgPT09IDEpIHtcbiAgICAgIC8vIE5vdGU6IHdlIGxpc3RlbiB0byBldmVudHMgaW4gdGhlIGNhcHR1cmUgcGhhc2Ugc28gd2VcbiAgICAgIC8vIGNhbiBkZXRlY3QgdGhlbSBldmVuIGlmIHRoZSB1c2VyIHN0b3BzIHByb3BhZ2F0aW9uLlxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fZG9jdW1lbnRLZXlkb3duTGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fZG9jdW1lbnRUb3VjaHN0YXJ0TGlzdGVuZXIsXG4gICAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fd2luZG93Rm9jdXNMaXN0ZW5lcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcnMoZWxlbWVudEluZm86IE1vbml0b3JlZEVsZW1lbnRJbmZvKSB7XG4gICAgY29uc3Qgcm9vdE5vZGUgPSBlbGVtZW50SW5mby5yb290Tm9kZTtcblxuICAgIGlmICh0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5oYXMocm9vdE5vZGUpKSB7XG4gICAgICBjb25zdCByb290Tm9kZUZvY3VzTGlzdGVuZXJzID0gdGhpcy5fcm9vdE5vZGVGb2N1c0xpc3RlbmVyQ291bnQuZ2V0KHJvb3ROb2RlKSE7XG5cbiAgICAgIGlmIChyb290Tm9kZUZvY3VzTGlzdGVuZXJzID4gMSkge1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5zZXQocm9vdE5vZGUsIHJvb3ROb2RlRm9jdXNMaXN0ZW5lcnMgLSAxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3ROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICByb290Tm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fcm9vdE5vZGVGb2N1c0FuZEJsdXJMaXN0ZW5lcixcbiAgICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9yb290Tm9kZUZvY3VzTGlzdGVuZXJDb3VudC5kZWxldGUocm9vdE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVucmVnaXN0ZXIgZ2xvYmFsIGxpc3RlbmVycyB3aGVuIGxhc3QgZWxlbWVudCBpcyB1bm1vbml0b3JlZC5cbiAgICBpZiAoIS0tdGhpcy5fbW9uaXRvcmVkRWxlbWVudENvdW50KSB7XG4gICAgICBjb25zdCBkb2N1bWVudCA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2RvY3VtZW50S2V5ZG93bkxpc3RlbmVyLFxuICAgICAgICBjYXB0dXJlRXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fZG9jdW1lbnRNb3VzZWRvd25MaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9kb2N1bWVudFRvdWNoc3RhcnRMaXN0ZW5lcixcbiAgICAgICAgY2FwdHVyZUV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX3dpbmRvd0ZvY3VzTGlzdGVuZXIpO1xuXG4gICAgICAvLyBDbGVhciB0aW1lb3V0cyBmb3IgYWxsIHBvdGVudGlhbGx5IHBlbmRpbmcgdGltZW91dHMgdG8gcHJldmVudCB0aGUgbGVha3MuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fd2luZG93Rm9jdXNUaW1lb3V0SWQpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RvdWNoVGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9vcmlnaW5UaW1lb3V0SWQpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogR2V0cyB0aGUgdGFyZ2V0IG9mIGFuIGV2ZW50LCBhY2NvdW50aW5nIGZvciBTaGFkb3cgRE9NLiAqL1xuZnVuY3Rpb24gZ2V0VGFyZ2V0KGV2ZW50OiBFdmVudCk6IEhUTUxFbGVtZW50fG51bGwge1xuICAvLyBJZiBhbiBldmVudCBpcyBib3VuZCBvdXRzaWRlIHRoZSBTaGFkb3cgRE9NLCB0aGUgYGV2ZW50LnRhcmdldGAgd2lsbFxuICAvLyBwb2ludCB0byB0aGUgc2hhZG93IHJvb3Qgc28gd2UgaGF2ZSB0byB1c2UgYGNvbXBvc2VkUGF0aGAgaW5zdGVhZC5cbiAgcmV0dXJuIChldmVudC5jb21wb3NlZFBhdGggPyBldmVudC5jb21wb3NlZFBhdGgoKVswXSA6IGV2ZW50LnRhcmdldCkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgZGV0ZXJtaW5lcyBob3cgYSBwYXJ0aWN1bGFyIGVsZW1lbnQgd2FzIGZvY3VzZWQgKHZpYSBrZXlib2FyZCwgbW91c2UsIHRvdWNoLCBvclxuICogcHJvZ3JhbW1hdGljYWxseSkgYW5kIGFkZHMgY29ycmVzcG9uZGluZyBjbGFzc2VzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gdmFyaWFudHMgb2YgdGhpcyBkaXJlY3RpdmU6XG4gKiAxKSBjZGtNb25pdG9yRWxlbWVudEZvY3VzOiBkb2VzIG5vdCBjb25zaWRlciBhbiBlbGVtZW50IHRvIGJlIGZvY3VzZWQgaWYgb25lIG9mIGl0cyBjaGlsZHJlbiBpc1xuICogICAgZm9jdXNlZC5cbiAqIDIpIGNka01vbml0b3JTdWJ0cmVlRm9jdXM6IGNvbnNpZGVycyBhbiBlbGVtZW50IGZvY3VzZWQgaWYgaXQgb3IgYW55IG9mIGl0cyBjaGlsZHJlbiBhcmUgZm9jdXNlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka01vbml0b3JFbGVtZW50Rm9jdXNdLCBbY2RrTW9uaXRvclN1YnRyZWVGb2N1c10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNb25pdG9yRm9jdXMgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIEBPdXRwdXQoKSBjZGtGb2N1c0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Rm9jdXNPcmlnaW4+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIHByaXZhdGUgX2ZvY3VzTW9uaXRvcjogRm9jdXNNb25pdG9yKSB7XG4gICAgdGhpcy5fbW9uaXRvclN1YnNjcmlwdGlvbiA9IHRoaXMuX2ZvY3VzTW9uaXRvci5tb25pdG9yKFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLFxuICAgICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuaGFzQXR0cmlidXRlKCdjZGtNb25pdG9yU3VidHJlZUZvY3VzJykpXG4gICAgICAgIC5zdWJzY3JpYmUob3JpZ2luID0+IHRoaXMuY2RrRm9jdXNDaGFuZ2UuZW1pdChvcmlnaW4pKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcbiAgICB0aGlzLl9tb25pdG9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cbiJdfQ==