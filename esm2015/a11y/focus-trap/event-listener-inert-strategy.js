/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/focus-trap/event-listener-inert-strategy.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { closest } from './polyfill';
/**
 * Lightweight FocusTrapInertStrategy that adds a document focus event
 * listener to redirect focus back inside the FocusTrap.
 */
export class EventListenerFocusTrapInertStrategy {
    constructor() {
        /**
         * Focus event handler.
         */
        this._listener = null;
    }
    /**
     * Adds a document event listener that keeps focus inside the FocusTrap.
     * @param {?} focusTrap
     * @return {?}
     */
    preventFocus(focusTrap) {
        // Ensure there's only one listener per document
        if (this._listener) {
            focusTrap._document.removeEventListener('focus', (/** @type {?} */ (this._listener)), true);
        }
        this._listener = (/**
         * @param {?} e
         * @return {?}
         */
        (e) => this._trapFocus(focusTrap, e));
        focusTrap._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            focusTrap._document.addEventListener('focus', (/** @type {?} */ (this._listener)), true);
        }));
    }
    /**
     * Removes the event listener added in preventFocus.
     * @param {?} focusTrap
     * @return {?}
     */
    allowFocus(focusTrap) {
        if (!this._listener) {
            return;
        }
        focusTrap._document.removeEventListener('focus', (/** @type {?} */ (this._listener)), true);
        this._listener = null;
    }
    /**
     * Refocuses the first element in the FocusTrap if the focus event target was outside
     * the FocusTrap.
     *
     * This is an event listener callback. The event listener is added in runOutsideAngular,
     * so all this code runs outside Angular as well.
     * @private
     * @param {?} focusTrap
     * @param {?} event
     * @return {?}
     */
    _trapFocus(focusTrap, event) {
        /** @type {?} */
        const target = (/** @type {?} */ (event.target));
        // Don't refocus if target was in an overlay, because the overlay might be associated
        // with an element inside the FocusTrap, ex. mat-select.
        if (!focusTrap._element.contains(target) &&
            closest(target, 'div.cdk-overlay-pane') === null) {
            // Some legacy FocusTrap usages have logic that focuses some element on the page
            // just before FocusTrap is destroyed. For backwards compatibility, wait
            // to be sure FocusTrap is still enabled before refocusing.
            setTimeout((/**
             * @return {?}
             */
            () => {
                if (focusTrap.enabled) {
                    focusTrap.focusFirstTabbableElement();
                }
            }));
        }
    }
}
if (false) {
    /**
     * Focus event handler.
     * @type {?}
     * @private
     */
    EventListenerFocusTrapInertStrategy.prototype._listener;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtbGlzdGVuZXItaW5lcnQtc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvZm9jdXMtdHJhcC9ldmVudC1saXN0ZW5lci1pbmVydC1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFVQSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7OztBQU1uQyxNQUFNLE9BQU8sbUNBQW1DO0lBQWhEOzs7O1FBRVUsY0FBUyxHQUFxQyxJQUFJLENBQUM7SUErQzdELENBQUM7Ozs7OztJQTVDQyxZQUFZLENBQUMsU0FBZ0M7UUFDM0MsZ0RBQWdEO1FBQ2hELElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixTQUFTLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxtQkFBQSxJQUFJLENBQUMsU0FBUyxFQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDekU7UUFFRCxJQUFJLENBQUMsU0FBUzs7OztRQUFHLENBQUMsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQSxDQUFDO1FBQ2xFLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7UUFBQyxHQUFHLEVBQUU7WUFDdkMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsbUJBQUEsSUFBSSxDQUFDLFNBQVMsRUFBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZFLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7O0lBR0QsVUFBVSxDQUFDLFNBQWdDO1FBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLE9BQU87U0FDUjtRQUNELFNBQVMsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLG1CQUFBLElBQUksQ0FBQyxTQUFTLEVBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztJQUN4QixDQUFDOzs7Ozs7Ozs7Ozs7SUFTTyxVQUFVLENBQUMsU0FBZ0MsRUFBRSxLQUFpQjs7Y0FDOUQsTUFBTSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxNQUFNLEVBQWU7UUFDMUMscUZBQXFGO1FBQ3JGLHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsc0JBQXNCLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEQsZ0ZBQWdGO1lBQ2hGLHdFQUF3RTtZQUN4RSwyREFBMkQ7WUFDM0QsVUFBVTs7O1lBQUMsR0FBRyxFQUFFO2dCQUNkLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRTtvQkFDckIsU0FBUyxDQUFDLHlCQUF5QixFQUFFLENBQUM7aUJBQ3ZDO1lBQ0gsQ0FBQyxFQUFDLENBQUM7U0FDSjtJQUNMLENBQUM7Q0FDRjs7Ozs7OztJQS9DQyx3REFBMkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtGb2N1c1RyYXBJbmVydFN0cmF0ZWd5fSBmcm9tICcuL2ZvY3VzLXRyYXAtaW5lcnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtDb25maWd1cmFibGVGb2N1c1RyYXB9IGZyb20gJy4vY29uZmlndXJhYmxlLWZvY3VzLXRyYXAnO1xuaW1wb3J0IHtjbG9zZXN0fSBmcm9tICcuL3BvbHlmaWxsJztcblxuLyoqXG4gKiBMaWdodHdlaWdodCBGb2N1c1RyYXBJbmVydFN0cmF0ZWd5IHRoYXQgYWRkcyBhIGRvY3VtZW50IGZvY3VzIGV2ZW50XG4gKiBsaXN0ZW5lciB0byByZWRpcmVjdCBmb2N1cyBiYWNrIGluc2lkZSB0aGUgRm9jdXNUcmFwLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRMaXN0ZW5lckZvY3VzVHJhcEluZXJ0U3RyYXRlZ3kgaW1wbGVtZW50cyBGb2N1c1RyYXBJbmVydFN0cmF0ZWd5IHtcbiAgLyoqIEZvY3VzIGV2ZW50IGhhbmRsZXIuICovXG4gIHByaXZhdGUgX2xpc3RlbmVyOiAoKGU6IEZvY3VzRXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIEFkZHMgYSBkb2N1bWVudCBldmVudCBsaXN0ZW5lciB0aGF0IGtlZXBzIGZvY3VzIGluc2lkZSB0aGUgRm9jdXNUcmFwLiAqL1xuICBwcmV2ZW50Rm9jdXMoZm9jdXNUcmFwOiBDb25maWd1cmFibGVGb2N1c1RyYXApOiB2b2lkIHtcbiAgICAvLyBFbnN1cmUgdGhlcmUncyBvbmx5IG9uZSBsaXN0ZW5lciBwZXIgZG9jdW1lbnRcbiAgICBpZiAodGhpcy5fbGlzdGVuZXIpIHtcbiAgICAgIGZvY3VzVHJhcC5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9saXN0ZW5lciEsIHRydWUpO1xuICAgIH1cblxuICAgIHRoaXMuX2xpc3RlbmVyID0gKGU6IEZvY3VzRXZlbnQpID0+IHRoaXMuX3RyYXBGb2N1cyhmb2N1c1RyYXAsIGUpO1xuICAgIGZvY3VzVHJhcC5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGZvY3VzVHJhcC5fZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9saXN0ZW5lciEsIHRydWUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGV2ZW50IGxpc3RlbmVyIGFkZGVkIGluIHByZXZlbnRGb2N1cy4gKi9cbiAgYWxsb3dGb2N1cyhmb2N1c1RyYXA6IENvbmZpZ3VyYWJsZUZvY3VzVHJhcCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fbGlzdGVuZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9jdXNUcmFwLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX2xpc3RlbmVyISwgdHJ1ZSk7XG4gICAgdGhpcy5fbGlzdGVuZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZm9jdXNlcyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgRm9jdXNUcmFwIGlmIHRoZSBmb2N1cyBldmVudCB0YXJnZXQgd2FzIG91dHNpZGVcbiAgICogdGhlIEZvY3VzVHJhcC5cbiAgICpcbiAgICogVGhpcyBpcyBhbiBldmVudCBsaXN0ZW5lciBjYWxsYmFjay4gVGhlIGV2ZW50IGxpc3RlbmVyIGlzIGFkZGVkIGluIHJ1bk91dHNpZGVBbmd1bGFyLFxuICAgKiBzbyBhbGwgdGhpcyBjb2RlIHJ1bnMgb3V0c2lkZSBBbmd1bGFyIGFzIHdlbGwuXG4gICAqL1xuICBwcml2YXRlIF90cmFwRm9jdXMoZm9jdXNUcmFwOiBDb25maWd1cmFibGVGb2N1c1RyYXAsIGV2ZW50OiBGb2N1c0V2ZW50KSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIC8vIERvbid0IHJlZm9jdXMgaWYgdGFyZ2V0IHdhcyBpbiBhbiBvdmVybGF5LCBiZWNhdXNlIHRoZSBvdmVybGF5IG1pZ2h0IGJlIGFzc29jaWF0ZWRcbiAgICAvLyB3aXRoIGFuIGVsZW1lbnQgaW5zaWRlIHRoZSBGb2N1c1RyYXAsIGV4LiBtYXQtc2VsZWN0LlxuICAgIGlmICghZm9jdXNUcmFwLl9lbGVtZW50LmNvbnRhaW5zKHRhcmdldCkgJiZcbiAgICAgIGNsb3Nlc3QodGFyZ2V0LCAnZGl2LmNkay1vdmVybGF5LXBhbmUnKSA9PT0gbnVsbCkge1xuICAgICAgICAvLyBTb21lIGxlZ2FjeSBGb2N1c1RyYXAgdXNhZ2VzIGhhdmUgbG9naWMgdGhhdCBmb2N1c2VzIHNvbWUgZWxlbWVudCBvbiB0aGUgcGFnZVxuICAgICAgICAvLyBqdXN0IGJlZm9yZSBGb2N1c1RyYXAgaXMgZGVzdHJveWVkLiBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIHdhaXRcbiAgICAgICAgLy8gdG8gYmUgc3VyZSBGb2N1c1RyYXAgaXMgc3RpbGwgZW5hYmxlZCBiZWZvcmUgcmVmb2N1c2luZy5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKGZvY3VzVHJhcC5lbmFibGVkKSB7XG4gICAgICAgICAgICBmb2N1c1RyYXAuZm9jdXNGaXJzdFRhYmJhYmxlRWxlbWVudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gIH1cbn1cbiJdfQ==