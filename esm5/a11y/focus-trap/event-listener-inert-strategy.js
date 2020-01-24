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
var EventListenerFocusTrapInertStrategy = /** @class */ (function () {
    function EventListenerFocusTrapInertStrategy() {
        /** Focus event handler. */
        this._listener = null;
    }
    /** Adds a document event listener that keeps focus inside the FocusTrap. */
    EventListenerFocusTrapInertStrategy.prototype.preventFocus = function (focusTrap) {
        var _this = this;
        // Ensure there's only one listener per document
        if (this._listener) {
            focusTrap._document.removeEventListener('focus', this._listener, true);
        }
        this._listener = function (e) { return _this._trapFocus(focusTrap, e); };
        focusTrap._ngZone.runOutsideAngular(function () {
            focusTrap._document.addEventListener('focus', _this._listener, true);
        });
    };
    /** Removes the event listener added in preventFocus. */
    EventListenerFocusTrapInertStrategy.prototype.allowFocus = function (focusTrap) {
        if (!this._listener) {
            return;
        }
        focusTrap._document.removeEventListener('focus', this._listener, true);
        this._listener = null;
    };
    /**
     * Refocuses the first element in the FocusTrap if the focus event target was outside
     * the FocusTrap.
     *
     * This is an event listener callback. The event listener is added in runOutsideAngular,
     * so all this code runs outside Angular as well.
     */
    EventListenerFocusTrapInertStrategy.prototype._trapFocus = function (focusTrap, event) {
        var target = event.target;
        // Don't refocus if target was in an overlay, because the overlay might be associated
        // with an element inside the FocusTrap, ex. mat-select.
        if (!focusTrap._element.contains(target) &&
            closest(target, 'div.cdk-overlay-pane') === null) {
            // Some legacy FocusTrap usages have logic that focuses some element on the page
            // just before FocusTrap is destroyed. For backwards compatibility, wait
            // to be sure FocusTrap is still enabled before refocusing.
            setTimeout(function () {
                if (focusTrap.enabled) {
                    focusTrap.focusFirstTabbableElement();
                }
            });
        }
    };
    return EventListenerFocusTrapInertStrategy;
}());
export { EventListenerFocusTrapInertStrategy };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtbGlzdGVuZXItaW5lcnQtc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvZm9jdXMtdHJhcC9ldmVudC1saXN0ZW5lci1pbmVydC1zdHJhdGVneS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5DOzs7R0FHRztBQUNIO0lBQUE7UUFDRSwyQkFBMkI7UUFDbkIsY0FBUyxHQUFxQyxJQUFJLENBQUM7SUErQzdELENBQUM7SUE3Q0MsNEVBQTRFO0lBQzVFLDBEQUFZLEdBQVosVUFBYSxTQUFnQztRQUE3QyxpQkFVQztRQVRDLGdEQUFnRDtRQUNoRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbEIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6RTtRQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxDQUFhLElBQUssT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBN0IsQ0FBNkIsQ0FBQztRQUNsRSxTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO1lBQ2xDLFNBQVMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUksQ0FBQyxTQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0RBQXdEO0lBQ3hELHdEQUFVLEdBQVYsVUFBVyxTQUFnQztRQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuQixPQUFPO1NBQ1I7UUFDRCxTQUFTLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSyx3REFBVSxHQUFsQixVQUFtQixTQUFnQyxFQUFFLEtBQWlCO1FBQ3BFLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFxQixDQUFDO1FBQzNDLHFGQUFxRjtRQUNyRix3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN0QyxPQUFPLENBQUMsTUFBTSxFQUFFLHNCQUFzQixDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hELGdGQUFnRjtZQUNoRix3RUFBd0U7WUFDeEUsMkRBQTJEO1lBQzNELFVBQVUsQ0FBQztnQkFDVCxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUU7b0JBQ3JCLFNBQVMsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2lCQUN2QztZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDTCxDQUFDO0lBQ0gsMENBQUM7QUFBRCxDQUFDLEFBakRELElBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Rm9jdXNUcmFwSW5lcnRTdHJhdGVneX0gZnJvbSAnLi9mb2N1cy10cmFwLWluZXJ0LXN0cmF0ZWd5JztcbmltcG9ydCB7Q29uZmlndXJhYmxlRm9jdXNUcmFwfSBmcm9tICcuL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwJztcbmltcG9ydCB7Y2xvc2VzdH0gZnJvbSAnLi9wb2x5ZmlsbCc7XG5cbi8qKlxuICogTGlnaHR3ZWlnaHQgRm9jdXNUcmFwSW5lcnRTdHJhdGVneSB0aGF0IGFkZHMgYSBkb2N1bWVudCBmb2N1cyBldmVudFxuICogbGlzdGVuZXIgdG8gcmVkaXJlY3QgZm9jdXMgYmFjayBpbnNpZGUgdGhlIEZvY3VzVHJhcC5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50TGlzdGVuZXJGb2N1c1RyYXBJbmVydFN0cmF0ZWd5IGltcGxlbWVudHMgRm9jdXNUcmFwSW5lcnRTdHJhdGVneSB7XG4gIC8qKiBGb2N1cyBldmVudCBoYW5kbGVyLiAqL1xuICBwcml2YXRlIF9saXN0ZW5lcjogKChlOiBGb2N1c0V2ZW50KSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBBZGRzIGEgZG9jdW1lbnQgZXZlbnQgbGlzdGVuZXIgdGhhdCBrZWVwcyBmb2N1cyBpbnNpZGUgdGhlIEZvY3VzVHJhcC4gKi9cbiAgcHJldmVudEZvY3VzKGZvY3VzVHJhcDogQ29uZmlndXJhYmxlRm9jdXNUcmFwKTogdm9pZCB7XG4gICAgLy8gRW5zdXJlIHRoZXJlJ3Mgb25seSBvbmUgbGlzdGVuZXIgcGVyIGRvY3VtZW50XG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyKSB7XG4gICAgICBmb2N1c1RyYXAuX2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fbGlzdGVuZXIhLCB0cnVlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9saXN0ZW5lciA9IChlOiBGb2N1c0V2ZW50KSA9PiB0aGlzLl90cmFwRm9jdXMoZm9jdXNUcmFwLCBlKTtcbiAgICBmb2N1c1RyYXAuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBmb2N1c1RyYXAuX2RvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5fbGlzdGVuZXIhLCB0cnVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBldmVudCBsaXN0ZW5lciBhZGRlZCBpbiBwcmV2ZW50Rm9jdXMuICovXG4gIGFsbG93Rm9jdXMoZm9jdXNUcmFwOiBDb25maWd1cmFibGVGb2N1c1RyYXApOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2xpc3RlbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvY3VzVHJhcC5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9saXN0ZW5lciEsIHRydWUpO1xuICAgIHRoaXMuX2xpc3RlbmVyID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZvY3VzZXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIEZvY3VzVHJhcCBpZiB0aGUgZm9jdXMgZXZlbnQgdGFyZ2V0IHdhcyBvdXRzaWRlXG4gICAqIHRoZSBGb2N1c1RyYXAuXG4gICAqXG4gICAqIFRoaXMgaXMgYW4gZXZlbnQgbGlzdGVuZXIgY2FsbGJhY2suIFRoZSBldmVudCBsaXN0ZW5lciBpcyBhZGRlZCBpbiBydW5PdXRzaWRlQW5ndWxhcixcbiAgICogc28gYWxsIHRoaXMgY29kZSBydW5zIG91dHNpZGUgQW5ndWxhciBhcyB3ZWxsLlxuICAgKi9cbiAgcHJpdmF0ZSBfdHJhcEZvY3VzKGZvY3VzVHJhcDogQ29uZmlndXJhYmxlRm9jdXNUcmFwLCBldmVudDogRm9jdXNFdmVudCkge1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAvLyBEb24ndCByZWZvY3VzIGlmIHRhcmdldCB3YXMgaW4gYW4gb3ZlcmxheSwgYmVjYXVzZSB0aGUgb3ZlcmxheSBtaWdodCBiZSBhc3NvY2lhdGVkXG4gICAgLy8gd2l0aCBhbiBlbGVtZW50IGluc2lkZSB0aGUgRm9jdXNUcmFwLCBleC4gbWF0LXNlbGVjdC5cbiAgICBpZiAoIWZvY3VzVHJhcC5fZWxlbWVudC5jb250YWlucyh0YXJnZXQpICYmXG4gICAgICBjbG9zZXN0KHRhcmdldCwgJ2Rpdi5jZGstb3ZlcmxheS1wYW5lJykgPT09IG51bGwpIHtcbiAgICAgICAgLy8gU29tZSBsZWdhY3kgRm9jdXNUcmFwIHVzYWdlcyBoYXZlIGxvZ2ljIHRoYXQgZm9jdXNlcyBzb21lIGVsZW1lbnQgb24gdGhlIHBhZ2VcbiAgICAgICAgLy8ganVzdCBiZWZvcmUgRm9jdXNUcmFwIGlzIGRlc3Ryb3llZC4gRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCB3YWl0XG4gICAgICAgIC8vIHRvIGJlIHN1cmUgRm9jdXNUcmFwIGlzIHN0aWxsIGVuYWJsZWQgYmVmb3JlIHJlZm9jdXNpbmcuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmIChmb2N1c1RyYXAuZW5hYmxlZCkge1xuICAgICAgICAgICAgZm9jdXNUcmFwLmZvY3VzRmlyc3RUYWJiYWJsZUVsZW1lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICB9XG59XG4iXX0=