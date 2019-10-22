/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { Injectable, NgZone } from '@angular/core';
import { fromEvent, of as observableOf, Subject, Observable } from 'rxjs';
import { auditTime, filter } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Time in ms to throttle the scrolling events by default. */
export var DEFAULT_SCROLL_TIME = 20;
/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 */
var ScrollDispatcher = /** @class */ (function () {
    function ScrollDispatcher(_ngZone, _platform) {
        this._ngZone = _ngZone;
        this._platform = _platform;
        /** Subject for notifying that a registered scrollable reference element has been scrolled. */
        this._scrolled = new Subject();
        /** Keeps track of the global `scroll` and `resize` subscriptions. */
        this._globalSubscription = null;
        /** Keeps track of the amount of subscriptions to `scrolled`. Used for cleaning up afterwards. */
        this._scrolledCount = 0;
        /**
         * Map of all the scrollable references that are registered with the service and their
         * scroll event subscriptions.
         */
        this.scrollContainers = new Map();
    }
    /**
     * Registers a scrollable instance with the service and listens for its scrolled events. When the
     * scrollable is scrolled, the service emits the event to its scrolled observable.
     * @param scrollable Scrollable instance to be registered.
     */
    ScrollDispatcher.prototype.register = function (scrollable) {
        var _this = this;
        if (!this.scrollContainers.has(scrollable)) {
            this.scrollContainers.set(scrollable, scrollable.elementScrolled()
                .subscribe(function () { return _this._scrolled.next(scrollable); }));
        }
    };
    /**
     * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
     * @param scrollable Scrollable instance to be deregistered.
     */
    ScrollDispatcher.prototype.deregister = function (scrollable) {
        var scrollableReference = this.scrollContainers.get(scrollable);
        if (scrollableReference) {
            scrollableReference.unsubscribe();
            this.scrollContainers.delete(scrollable);
        }
    };
    /**
     * Returns an observable that emits an event whenever any of the registered Scrollable
     * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
     * to override the default "throttle" time.
     *
     * **Note:** in order to avoid hitting change detection for every scroll event,
     * all of the events emitted from this stream will be run outside the Angular zone.
     * If you need to update any data bindings as a result of a scroll event, you have
     * to run the callback using `NgZone.run`.
     */
    ScrollDispatcher.prototype.scrolled = function (auditTimeInMs) {
        var _this = this;
        if (auditTimeInMs === void 0) { auditTimeInMs = DEFAULT_SCROLL_TIME; }
        if (!this._platform.isBrowser) {
            return observableOf();
        }
        return new Observable(function (observer) {
            if (!_this._globalSubscription) {
                _this._addGlobalListener();
            }
            // In the case of a 0ms delay, use an observable without auditTime
            // since it does add a perceptible delay in processing overhead.
            var subscription = auditTimeInMs > 0 ?
                _this._scrolled.pipe(auditTime(auditTimeInMs)).subscribe(observer) :
                _this._scrolled.subscribe(observer);
            _this._scrolledCount++;
            return function () {
                subscription.unsubscribe();
                _this._scrolledCount--;
                if (!_this._scrolledCount) {
                    _this._removeGlobalListener();
                }
            };
        });
    };
    ScrollDispatcher.prototype.ngOnDestroy = function () {
        var _this = this;
        this._removeGlobalListener();
        this.scrollContainers.forEach(function (_, container) { return _this.deregister(container); });
        this._scrolled.complete();
    };
    /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param elementRef Element whose ancestors to listen for.
     * @param auditTimeInMs Time to throttle the scroll events.
     */
    ScrollDispatcher.prototype.ancestorScrolled = function (elementRef, auditTimeInMs) {
        var ancestors = this.getAncestorScrollContainers(elementRef);
        return this.scrolled(auditTimeInMs).pipe(filter(function (target) {
            return !target || ancestors.indexOf(target) > -1;
        }));
    };
    /** Returns all registered Scrollables that contain the provided element. */
    ScrollDispatcher.prototype.getAncestorScrollContainers = function (elementRef) {
        var _this = this;
        var scrollingContainers = [];
        this.scrollContainers.forEach(function (_subscription, scrollable) {
            if (_this._scrollableContainsElement(scrollable, elementRef)) {
                scrollingContainers.push(scrollable);
            }
        });
        return scrollingContainers;
    };
    /** Returns true if the element is contained within the provided Scrollable. */
    ScrollDispatcher.prototype._scrollableContainsElement = function (scrollable, elementRef) {
        var element = elementRef.nativeElement;
        var scrollableElement = scrollable.getElementRef().nativeElement;
        // Traverse through the element parents until we reach null, checking if any of the elements
        // are the scrollable's element.
        do {
            if (element == scrollableElement) {
                return true;
            }
        } while (element = element.parentElement);
        return false;
    };
    /** Sets up the global scroll listeners. */
    ScrollDispatcher.prototype._addGlobalListener = function () {
        var _this = this;
        this._globalSubscription = this._ngZone.runOutsideAngular(function () {
            return fromEvent(window.document, 'scroll').subscribe(function () { return _this._scrolled.next(); });
        });
    };
    /** Cleans up the global scroll listener. */
    ScrollDispatcher.prototype._removeGlobalListener = function () {
        if (this._globalSubscription) {
            this._globalSubscription.unsubscribe();
            this._globalSubscription = null;
        }
    };
    ScrollDispatcher.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ScrollDispatcher.ctorParameters = function () { return [
        { type: NgZone },
        { type: Platform }
    ]; };
    ScrollDispatcher.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function ScrollDispatcher_Factory() { return new ScrollDispatcher(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform)); }, token: ScrollDispatcher, providedIn: "root" });
    return ScrollDispatcher;
}());
export { ScrollDispatcher };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy9zY3JvbGwtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFhLFVBQVUsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDeEUsT0FBTyxFQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBZ0IsVUFBVSxFQUFXLE1BQU0sTUFBTSxDQUFDO0FBQ2hHLE9BQU8sRUFBQyxTQUFTLEVBQUUsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7OztBQUlqRCw4REFBOEQ7QUFDOUQsTUFBTSxDQUFDLElBQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRXRDOzs7R0FHRztBQUNIO0lBRUUsMEJBQW9CLE9BQWUsRUFBVSxTQUFtQjtRQUE1QyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUVoRSw4RkFBOEY7UUFDdEYsY0FBUyxHQUFHLElBQUksT0FBTyxFQUFzQixDQUFDO1FBRXRELHFFQUFxRTtRQUNyRSx3QkFBbUIsR0FBd0IsSUFBSSxDQUFDO1FBRWhELGlHQUFpRztRQUN6RixtQkFBYyxHQUFHLENBQUMsQ0FBQztRQUUzQjs7O1dBR0c7UUFDSCxxQkFBZ0IsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQWZLLENBQUM7SUFpQnJFOzs7O09BSUc7SUFDSCxtQ0FBUSxHQUFSLFVBQVMsVUFBeUI7UUFBbEMsaUJBS0M7UUFKQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMs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LFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dCQWJBLE1BQU07Z0JBRDlCLFFBQVE7OzsyQkFSaEI7Q0FzS0MsQUFoSkQsSUFnSkM7U0EvSVksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0VsZW1lbnRSZWYsIEluamVjdGFibGUsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbiwgT2JzZXJ2YWJsZSwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHthdWRpdFRpbWUsIGZpbHRlcn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtDZGtTY3JvbGxhYmxlfSBmcm9tICcuL3Njcm9sbGFibGUnO1xuXG5cbi8qKiBUaW1lIGluIG1zIHRvIHRocm90dGxlIHRoZSBzY3JvbGxpbmcgZXZlbnRzIGJ5IGRlZmF1bHQuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9TQ1JPTExfVElNRSA9IDIwO1xuXG4vKipcbiAqIFNlcnZpY2UgY29udGFpbmVkIGFsbCByZWdpc3RlcmVkIFNjcm9sbGFibGUgcmVmZXJlbmNlcyBhbmQgZW1pdHMgYW4gZXZlbnQgd2hlbiBhbnkgb25lIG9mIHRoZVxuICogU2Nyb2xsYWJsZSByZWZlcmVuY2VzIGVtaXQgYSBzY3JvbGxlZCBldmVudC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgU2Nyb2xsRGlzcGF0Y2hlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX25nWm9uZTogTmdab25lLCBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0pIHsgfVxuXG4gIC8qKiBTdWJqZWN0IGZvciBub3RpZnlpbmcgdGhhdCBhIHJlZ2lzdGVyZWQgc2Nyb2xsYWJsZSByZWZlcmVuY2UgZWxlbWVudCBoYXMgYmVlbiBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsZWQgPSBuZXcgU3ViamVjdDxDZGtTY3JvbGxhYmxlfHZvaWQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBnbG9iYWwgYHNjcm9sbGAgYW5kIGByZXNpemVgIHN1YnNjcmlwdGlvbnMuICovXG4gIF9nbG9iYWxTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgYW1vdW50IG9mIHN1YnNjcmlwdGlvbnMgdG8gYHNjcm9sbGVkYC4gVXNlZCBmb3IgY2xlYW5pbmcgdXAgYWZ0ZXJ3YXJkcy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsZWRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBhbGwgdGhlIHNjcm9sbGFibGUgcmVmZXJlbmNlcyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhlIHNlcnZpY2UgYW5kIHRoZWlyXG4gICAqIHNjcm9sbCBldmVudCBzdWJzY3JpcHRpb25zLlxuICAgKi9cbiAgc2Nyb2xsQ29udGFpbmVyczogTWFwPENka1Njcm9sbGFibGUsIFN1YnNjcmlwdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIHNjcm9sbGFibGUgaW5zdGFuY2Ugd2l0aCB0aGUgc2VydmljZSBhbmQgbGlzdGVucyBmb3IgaXRzIHNjcm9sbGVkIGV2ZW50cy4gV2hlbiB0aGVcbiAgICogc2Nyb2xsYWJsZSBpcyBzY3JvbGxlZCwgdGhlIHNlcnZpY2UgZW1pdHMgdGhlIGV2ZW50IHRvIGl0cyBzY3JvbGxlZCBvYnNlcnZhYmxlLlxuICAgKiBAcGFyYW0gc2Nyb2xsYWJsZSBTY3JvbGxhYmxlIGluc3RhbmNlIHRvIGJlIHJlZ2lzdGVyZWQuXG4gICAqL1xuICByZWdpc3RlcihzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbENvbnRhaW5lcnMuaGFzKHNjcm9sbGFibGUpKSB7XG4gICAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuc2V0KHNjcm9sbGFibGUsIHNjcm9sbGFibGUuZWxlbWVudFNjcm9sbGVkKClcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbGVkLm5leHQoc2Nyb2xsYWJsZSkpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVyZWdpc3RlcnMgYSBTY3JvbGxhYmxlIHJlZmVyZW5jZSBhbmQgdW5zdWJzY3JpYmVzIGZyb20gaXRzIHNjcm9sbCBldmVudCBvYnNlcnZhYmxlLlxuICAgKiBAcGFyYW0gc2Nyb2xsYWJsZSBTY3JvbGxhYmxlIGluc3RhbmNlIHRvIGJlIGRlcmVnaXN0ZXJlZC5cbiAgICovXG4gIGRlcmVnaXN0ZXIoc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSk6IHZvaWQge1xuICAgIGNvbnN0IHNjcm9sbGFibGVSZWZlcmVuY2UgPSB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZ2V0KHNjcm9sbGFibGUpO1xuXG4gICAgaWYgKHNjcm9sbGFibGVSZWZlcmVuY2UpIHtcbiAgICAgIHNjcm9sbGFibGVSZWZlcmVuY2UudW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuc2Nyb2xsQ29udGFpbmVycy5kZWxldGUoc2Nyb2xsYWJsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIGFuIGV2ZW50IHdoZW5ldmVyIGFueSBvZiB0aGUgcmVnaXN0ZXJlZCBTY3JvbGxhYmxlXG4gICAqIHJlZmVyZW5jZXMgKG9yIHdpbmRvdywgZG9jdW1lbnQsIG9yIGJvZHkpIGZpcmUgYSBzY3JvbGxlZCBldmVudC4gQ2FuIHByb3ZpZGUgYSB0aW1lIGluIG1zXG4gICAqIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IFwidGhyb3R0bGVcIiB0aW1lLlxuICAgKlxuICAgKiAqKk5vdGU6KiogaW4gb3JkZXIgdG8gYXZvaWQgaGl0dGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGZvciBldmVyeSBzY3JvbGwgZXZlbnQsXG4gICAqIGFsbCBvZiB0aGUgZXZlbnRzIGVtaXR0ZWQgZnJvbSB0aGlzIHN0cmVhbSB3aWxsIGJlIHJ1biBvdXRzaWRlIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqIElmIHlvdSBuZWVkIHRvIHVwZGF0ZSBhbnkgZGF0YSBiaW5kaW5ncyBhcyBhIHJlc3VsdCBvZiBhIHNjcm9sbCBldmVudCwgeW91IGhhdmVcbiAgICogdG8gcnVuIHRoZSBjYWxsYmFjayB1c2luZyBgTmdab25lLnJ1bmAuXG4gICAqL1xuICBzY3JvbGxlZChhdWRpdFRpbWVJbk1zOiBudW1iZXIgPSBERUZBVUxUX1NDUk9MTF9USU1FKTogT2JzZXJ2YWJsZTxDZGtTY3JvbGxhYmxlfHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZjx2b2lkPigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPENka1Njcm9sbGFibGV8dm9pZD4pID0+IHtcbiAgICAgIGlmICghdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuX2FkZEdsb2JhbExpc3RlbmVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIHRoZSBjYXNlIG9mIGEgMG1zIGRlbGF5LCB1c2UgYW4gb2JzZXJ2YWJsZSB3aXRob3V0IGF1ZGl0VGltZVxuICAgICAgLy8gc2luY2UgaXQgZG9lcyBhZGQgYSBwZXJjZXB0aWJsZSBkZWxheSBpbiBwcm9jZXNzaW5nIG92ZXJoZWFkLlxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gYXVkaXRUaW1lSW5NcyA+IDAgP1xuICAgICAgICB0aGlzLl9zY3JvbGxlZC5waXBlKGF1ZGl0VGltZShhdWRpdFRpbWVJbk1zKSkuc3Vic2NyaWJlKG9ic2VydmVyKSA6XG4gICAgICAgIHRoaXMuX3Njcm9sbGVkLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgIHRoaXMuX3Njcm9sbGVkQ291bnQrKztcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbGVkQ291bnQtLTtcblxuICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbGVkQ291bnQpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVHbG9iYWxMaXN0ZW5lcigpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXIoKTtcbiAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZm9yRWFjaCgoXywgY29udGFpbmVyKSA9PiB0aGlzLmRlcmVnaXN0ZXIoY29udGFpbmVyKSk7XG4gICAgdGhpcy5fc2Nyb2xsZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuZXZlciBhbnkgb2YgdGhlXG4gICAqIHNjcm9sbGFibGUgYW5jZXN0b3JzIG9mIGFuIGVsZW1lbnQgYXJlIHNjcm9sbGVkLlxuICAgKiBAcGFyYW0gZWxlbWVudFJlZiBFbGVtZW50IHdob3NlIGFuY2VzdG9ycyB0byBsaXN0ZW4gZm9yLlxuICAgKiBAcGFyYW0gYXVkaXRUaW1lSW5NcyBUaW1lIHRvIHRocm90dGxlIHRoZSBzY3JvbGwgZXZlbnRzLlxuICAgKi9cbiAgYW5jZXN0b3JTY3JvbGxlZChlbGVtZW50UmVmOiBFbGVtZW50UmVmLCBhdWRpdFRpbWVJbk1zPzogbnVtYmVyKTogT2JzZXJ2YWJsZTxDZGtTY3JvbGxhYmxlfHZvaWQ+IHtcbiAgICBjb25zdCBhbmNlc3RvcnMgPSB0aGlzLmdldEFuY2VzdG9yU2Nyb2xsQ29udGFpbmVycyhlbGVtZW50UmVmKTtcblxuICAgIHJldHVybiB0aGlzLnNjcm9sbGVkKGF1ZGl0VGltZUluTXMpLnBpcGUoZmlsdGVyKHRhcmdldCA9PiB7XG4gICAgICByZXR1cm4gIXRhcmdldCB8fCBhbmNlc3RvcnMuaW5kZXhPZih0YXJnZXQpID4gLTE7XG4gICAgfSkpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYWxsIHJlZ2lzdGVyZWQgU2Nyb2xsYWJsZXMgdGhhdCBjb250YWluIHRoZSBwcm92aWRlZCBlbGVtZW50LiAqL1xuICBnZXRBbmNlc3RvclNjcm9sbENvbnRhaW5lcnMoZWxlbWVudFJlZjogRWxlbWVudFJlZik6IENka1Njcm9sbGFibGVbXSB7XG4gICAgY29uc3Qgc2Nyb2xsaW5nQ29udGFpbmVyczogQ2RrU2Nyb2xsYWJsZVtdID0gW107XG5cbiAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZm9yRWFjaCgoX3N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uLCBzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKSA9PiB7XG4gICAgICBpZiAodGhpcy5fc2Nyb2xsYWJsZUNvbnRhaW5zRWxlbWVudChzY3JvbGxhYmxlLCBlbGVtZW50UmVmKSkge1xuICAgICAgICBzY3JvbGxpbmdDb250YWluZXJzLnB1c2goc2Nyb2xsYWJsZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2Nyb2xsaW5nQ29udGFpbmVycztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiB0aGUgcHJvdmlkZWQgU2Nyb2xsYWJsZS4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsYWJsZUNvbnRhaW5zRWxlbWVudChzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmKTogYm9vbGVhbiB7XG4gICAgbGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICBsZXQgc2Nyb2xsYWJsZUVsZW1lbnQgPSBzY3JvbGxhYmxlLmdldEVsZW1lbnRSZWYoKS5uYXRpdmVFbGVtZW50O1xuXG4gICAgLy8gVHJhdmVyc2UgdGhyb3VnaCB0aGUgZWxlbWVudCBwYXJlbnRzIHVudGlsIHdlIHJlYWNoIG51bGwsIGNoZWNraW5nIGlmIGFueSBvZiB0aGUgZWxlbWVudHNcbiAgICAvLyBhcmUgdGhlIHNjcm9sbGFibGUncyBlbGVtZW50LlxuICAgIGRvIHtcbiAgICAgIGlmIChlbGVtZW50ID09IHNjcm9sbGFibGVFbGVtZW50KSB7IHJldHVybiB0cnVlOyB9XG4gICAgfSB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQhLnBhcmVudEVsZW1lbnQpO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIFNldHMgdXAgdGhlIGdsb2JhbCBzY3JvbGwgbGlzdGVuZXJzLiAqL1xuICBwcml2YXRlIF9hZGRHbG9iYWxMaXN0ZW5lcigpIHtcbiAgICB0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24gPSB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIGZyb21FdmVudCh3aW5kb3cuZG9jdW1lbnQsICdzY3JvbGwnKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2Nyb2xsZWQubmV4dCgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgdGhlIGdsb2JhbCBzY3JvbGwgbGlzdGVuZXIuICovXG4gIHByaXZhdGUgX3JlbW92ZUdsb2JhbExpc3RlbmVyKCkge1xuICAgIGlmICh0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==