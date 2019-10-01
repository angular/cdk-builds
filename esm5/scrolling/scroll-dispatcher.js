/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { Injectable, NgZone, Optional, SkipSelf, } from '@angular/core';
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
/** @docs-private @deprecated @breaking-change 8.0.0 */
export function SCROLL_DISPATCHER_PROVIDER_FACTORY(parentDispatcher, ngZone, platform) {
    return parentDispatcher || new ScrollDispatcher(ngZone, platform);
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export var SCROLL_DISPATCHER_PROVIDER = {
    // If there is already a ScrollDispatcher available, use that. Otherwise, provide a new one.
    provide: ScrollDispatcher,
    deps: [[new Optional(), new SkipSelf(), ScrollDispatcher], NgZone, Platform],
    useFactory: SCROLL_DISPATCHER_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy9zY3JvbGwtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUVMLFVBQVUsRUFDVixNQUFNLEVBRU4sUUFBUSxFQUNSLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFnQixVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDaEcsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7O0FBSWpELDhEQUE4RDtBQUM5RCxNQUFNLENBQUMsSUFBTSxtQkFBbUIsR0FBRyxFQUFFLENBQUM7QUFFdEM7OztHQUdHO0FBQ0g7SUFFRSwwQkFBb0IsT0FBZSxFQUFVLFNBQW1CO1FBQTVDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBRWhFLDhGQUE4RjtRQUN0RixjQUFTLEdBQUcsSUFBSSxPQUFPLEVBQXNCLENBQUM7UUFFdEQscUVBQXFFO1FBQ3JFLHdCQUFtQixHQUF3QixJQUFJLENBQUM7UUFFaEQsaUdBQWlHO1FBQ3pGLG1CQUFjLEdBQUcsQ0FBQyxDQUFDO1FBRTNCOzs7V0FHRztRQUNILHFCQUFnQixHQUFxQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBZkssQ0FBQztJQWlCckU7Ozs7T0FJRztJQUNILG1DQUFRLEdBQVIsVUFBUyxVQUF5QjtRQUFsQyxpQkFLQztRQUpDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxlQUFlLEVBQUU7aUJBQzdELFNBQVMsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQS9CLENBQStCLENBQUMsQ0FBQyxDQUFDO1NBQ3hEO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILHFDQUFVLEdBQVYsVUFBVyxVQUF5QjtRQUNsQyxJQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFbEUsSUFBSSxtQkFBbUIsRUFBRTtZQUN2QixtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILG1DQUFRLEdBQVIsVUFBUyxhQUEyQztRQUFwRCxpQkEyQkM7UUEzQlEsOEJBQUEsRUFBQSxtQ0FBMkM7UUFDbEQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzdCLE9BQU8sWUFBWSxFQUFRLENBQUM7U0FDN0I7UUFFRCxPQUFPLElBQUksVUFBVSxDQUFDLFVBQUMsUUFBc0M7WUFDM0QsSUFBSSxDQUFDLEtBQUksQ0FBQyxtQkFBbUIsRUFBRTtnQkFDN0IsS0FBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7YUFDM0I7WUFFRCxrRUFBa0U7WUFDbEUsZ0VBQWdFO1lBQ2hFLElBQU0sWUFBWSxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsS0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLEtBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXJDLEtBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV0QixPQUFPO2dCQUNMLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDM0IsS0FBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUV0QixJQUFJLENBQUMsS0FBSSxDQUFDLGNBQWMsRUFBRTtvQkFDeEIsS0FBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7aUJBQzlCO1lBQ0gsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsc0NBQVcsR0FBWDtRQUFBLGlCQUlDO1FBSEMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUMsRUFBRSxTQUFTLElBQUssT0FBQSxLQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUExQixDQUEwQixDQUFDLENBQUM7UUFDNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCwyQ0FBZ0IsR0FBaEIsVUFBaUIsVUFBc0IsRUFBRSxhQUFzQjtRQUM3RCxJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFL0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBQSxNQUFNO1lBQ3BELE9BQU8sQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztJQUVELDRFQUE0RTtJQUM1RSxzREFBMkIsR0FBM0IsVUFBNEIsVUFBc0I7UUFBbEQsaUJBVUM7UUFUQyxJQUFNLG1CQUFtQixHQUFvQixFQUFFLENBQUM7UUFFaEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFDLGFBQTJCLEVBQUUsVUFBeUI7WUFDbkYsSUFBSSxLQUFJLENBQUMsMEJBQTBCLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFO2dCQUMzRCxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdEM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sbUJBQW1CLENBQUM7SUFDN0IsQ0FBQztJQUVELCtFQUErRTtJQUN2RSxxREFBMEIsR0FBbEMsVUFBbUMsVUFBeUIsRUFBRSxVQUFzQjtRQUNsRixJQUFJLE9BQU8sR0FBdUIsVUFBVSxDQUFDLGFBQWEsQ0FBQztRQUMzRCxJQUFJLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxhQUFhLENBQUM7UUFFakUsNEZBQTRGO1FBQzVGLGdDQUFnQztRQUNoQyxHQUFHO1lBQ0QsSUFBSSxPQUFPLElBQUksaUJBQWlCLEVBQUU7Z0JBQUUsT0FBTyxJQUFJLENBQUM7YUFBRTtTQUNuRCxRQUFRLE9BQU8sR0FBRyxPQUFRLENBQUMsYUFBYSxFQUFFO1FBRTNDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDJDQUEyQztJQUNuQyw2Q0FBa0IsR0FBMUI7UUFBQSxpQkFJQztRQUhDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO1lBQ3hELE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLGNBQU0sT0FBQSxLQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxFQUFyQixDQUFxQixDQUFDLENBQUM7UUFDckYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsNENBQTRDO0lBQ3BDLGdEQUFxQixHQUE3QjtRQUNFLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQzVCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQzs7Z0JBL0lGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7Z0JBakI5QixNQUFNO2dCQUpBLFFBQVE7OzsyQkFSaEI7Q0E2S0MsQUFoSkQsSUFnSkM7U0EvSVksZ0JBQWdCO0FBa0o3Qix1REFBdUQ7QUFDdkQsTUFBTSxVQUFVLGtDQUFrQyxDQUM5QyxnQkFBa0MsRUFBRSxNQUFjLEVBQUUsUUFBa0I7SUFDeEUsT0FBTyxnQkFBZ0IsSUFBSSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNwRSxDQUFDO0FBRUQsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxJQUFNLDBCQUEwQixHQUFHO0lBQ3hDLDRGQUE0RjtJQUM1RixPQUFPLEVBQUUsZ0JBQWdCO0lBQ3pCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQztJQUM1RSxVQUFVLEVBQUUsa0NBQWtDO0NBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7XG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdGFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgU2tpcFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdCwgU3Vic2NyaXB0aW9uLCBPYnNlcnZhYmxlLCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZSwgZmlsdGVyfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1Njcm9sbGFibGV9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5cblxuLyoqIFRpbWUgaW4gbXMgdG8gdGhyb3R0bGUgdGhlIHNjcm9sbGluZyBldmVudHMgYnkgZGVmYXVsdC4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NDUk9MTF9USU1FID0gMjA7XG5cbi8qKlxuICogU2VydmljZSBjb250YWluZWQgYWxsIHJlZ2lzdGVyZWQgU2Nyb2xsYWJsZSByZWZlcmVuY2VzIGFuZCBlbWl0cyBhbiBldmVudCB3aGVuIGFueSBvbmUgb2YgdGhlXG4gKiBTY3JvbGxhYmxlIHJlZmVyZW5jZXMgZW1pdCBhIHNjcm9sbGVkIGV2ZW50LlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBTY3JvbGxEaXNwYXRjaGVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsIHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSkgeyB9XG5cbiAgLyoqIFN1YmplY3QgZm9yIG5vdGlmeWluZyB0aGF0IGEgcmVnaXN0ZXJlZCBzY3JvbGxhYmxlIHJlZmVyZW5jZSBlbGVtZW50IGhhcyBiZWVuIHNjcm9sbGVkLiAqL1xuICBwcml2YXRlIF9zY3JvbGxlZCA9IG5ldyBTdWJqZWN0PENka1Njcm9sbGFibGV8dm9pZD4oKTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGdsb2JhbCBgc2Nyb2xsYCBhbmQgYHJlc2l6ZWAgc3Vic2NyaXB0aW9ucy4gKi9cbiAgX2dsb2JhbFN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBhbW91bnQgb2Ygc3Vic2NyaXB0aW9ucyB0byBgc2Nyb2xsZWRgLiBVc2VkIGZvciBjbGVhbmluZyB1cCBhZnRlcndhcmRzLiAqL1xuICBwcml2YXRlIF9zY3JvbGxlZENvdW50ID0gMDtcblxuICAvKipcbiAgICogTWFwIG9mIGFsbCB0aGUgc2Nyb2xsYWJsZSByZWZlcmVuY2VzIHRoYXQgYXJlIHJlZ2lzdGVyZWQgd2l0aCB0aGUgc2VydmljZSBhbmQgdGhlaXJcbiAgICogc2Nyb2xsIGV2ZW50IHN1YnNjcmlwdGlvbnMuXG4gICAqL1xuICBzY3JvbGxDb250YWluZXJzOiBNYXA8Q2RrU2Nyb2xsYWJsZSwgU3Vic2NyaXB0aW9uPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgc2Nyb2xsYWJsZSBpbnN0YW5jZSB3aXRoIHRoZSBzZXJ2aWNlIGFuZCBsaXN0ZW5zIGZvciBpdHMgc2Nyb2xsZWQgZXZlbnRzLiBXaGVuIHRoZVxuICAgKiBzY3JvbGxhYmxlIGlzIHNjcm9sbGVkLCB0aGUgc2VydmljZSBlbWl0cyB0aGUgZXZlbnQgdG8gaXRzIHNjcm9sbGVkIG9ic2VydmFibGUuXG4gICAqIEBwYXJhbSBzY3JvbGxhYmxlIFNjcm9sbGFibGUgaW5zdGFuY2UgdG8gYmUgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHJlZ2lzdGVyKHNjcm9sbGFibGU6IENka1Njcm9sbGFibGUpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc2Nyb2xsQ29udGFpbmVycy5oYXMoc2Nyb2xsYWJsZSkpIHtcbiAgICAgIHRoaXMuc2Nyb2xsQ29udGFpbmVycy5zZXQoc2Nyb2xsYWJsZSwgc2Nyb2xsYWJsZS5lbGVtZW50U2Nyb2xsZWQoKVxuICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2Nyb2xsZWQubmV4dChzY3JvbGxhYmxlKSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJlZ2lzdGVycyBhIFNjcm9sbGFibGUgcmVmZXJlbmNlIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBpdHMgc2Nyb2xsIGV2ZW50IG9ic2VydmFibGUuXG4gICAqIEBwYXJhbSBzY3JvbGxhYmxlIFNjcm9sbGFibGUgaW5zdGFuY2UgdG8gYmUgZGVyZWdpc3RlcmVkLlxuICAgKi9cbiAgZGVyZWdpc3RlcihzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKTogdm9pZCB7XG4gICAgY29uc3Qgc2Nyb2xsYWJsZVJlZmVyZW5jZSA9IHRoaXMuc2Nyb2xsQ29udGFpbmVycy5nZXQoc2Nyb2xsYWJsZSk7XG5cbiAgICBpZiAoc2Nyb2xsYWJsZVJlZmVyZW5jZSkge1xuICAgICAgc2Nyb2xsYWJsZVJlZmVyZW5jZS51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5zY3JvbGxDb250YWluZXJzLmRlbGV0ZShzY3JvbGxhYmxlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgYW4gZXZlbnQgd2hlbmV2ZXIgYW55IG9mIHRoZSByZWdpc3RlcmVkIFNjcm9sbGFibGVcbiAgICogcmVmZXJlbmNlcyAob3Igd2luZG93LCBkb2N1bWVudCwgb3IgYm9keSkgZmlyZSBhIHNjcm9sbGVkIGV2ZW50LiBDYW4gcHJvdmlkZSBhIHRpbWUgaW4gbXNcbiAgICogdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgXCJ0aHJvdHRsZVwiIHRpbWUuXG4gICAqXG4gICAqICoqTm90ZToqKiBpbiBvcmRlciB0byBhdm9pZCBoaXR0aW5nIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGV2ZXJ5IHNjcm9sbCBldmVudCxcbiAgICogYWxsIG9mIHRoZSBldmVudHMgZW1pdHRlZCBmcm9tIHRoaXMgc3RyZWFtIHdpbGwgYmUgcnVuIG91dHNpZGUgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICogSWYgeW91IG5lZWQgdG8gdXBkYXRlIGFueSBkYXRhIGJpbmRpbmdzIGFzIGEgcmVzdWx0IG9mIGEgc2Nyb2xsIGV2ZW50LCB5b3UgaGF2ZVxuICAgKiB0byBydW4gdGhlIGNhbGxiYWNrIHVzaW5nIGBOZ1pvbmUucnVuYC5cbiAgICovXG4gIHNjcm9sbGVkKGF1ZGl0VGltZUluTXM6IG51bWJlciA9IERFRkFVTFRfU0NST0xMX1RJTUUpOiBPYnNlcnZhYmxlPENka1Njcm9sbGFibGV8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mPHZvaWQ+KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8Q2RrU2Nyb2xsYWJsZXx2b2lkPikgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5fYWRkR2xvYmFsTGlzdGVuZXIoKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYSAwbXMgZGVsYXksIHVzZSBhbiBvYnNlcnZhYmxlIHdpdGhvdXQgYXVkaXRUaW1lXG4gICAgICAvLyBzaW5jZSBpdCBkb2VzIGFkZCBhIHBlcmNlcHRpYmxlIGRlbGF5IGluIHByb2Nlc3Npbmcgb3ZlcmhlYWQuXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBhdWRpdFRpbWVJbk1zID4gMCA/XG4gICAgICAgIHRoaXMuX3Njcm9sbGVkLnBpcGUoYXVkaXRUaW1lKGF1ZGl0VGltZUluTXMpKS5zdWJzY3JpYmUob2JzZXJ2ZXIpIDpcbiAgICAgICAgdGhpcy5fc2Nyb2xsZWQuc3Vic2NyaWJlKG9ic2VydmVyKTtcblxuICAgICAgdGhpcy5fc2Nyb2xsZWRDb3VudCsrO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsZWRDb3VudC0tO1xuXG4gICAgICAgIGlmICghdGhpcy5fc2Nyb2xsZWRDb3VudCkge1xuICAgICAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbExpc3RlbmVyKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9yZW1vdmVHbG9iYWxMaXN0ZW5lcigpO1xuICAgIHRoaXMuc2Nyb2xsQ29udGFpbmVycy5mb3JFYWNoKChfLCBjb250YWluZXIpID0+IHRoaXMuZGVyZWdpc3Rlcihjb250YWluZXIpKTtcbiAgICB0aGlzLl9zY3JvbGxlZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW5ldmVyIGFueSBvZiB0aGVcbiAgICogc2Nyb2xsYWJsZSBhbmNlc3RvcnMgb2YgYW4gZWxlbWVudCBhcmUgc2Nyb2xsZWQuXG4gICAqIEBwYXJhbSBlbGVtZW50UmVmIEVsZW1lbnQgd2hvc2UgYW5jZXN0b3JzIHRvIGxpc3RlbiBmb3IuXG4gICAqIEBwYXJhbSBhdWRpdFRpbWVJbk1zIFRpbWUgdG8gdGhyb3R0bGUgdGhlIHNjcm9sbCBldmVudHMuXG4gICAqL1xuICBhbmNlc3RvclNjcm9sbGVkKGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsIGF1ZGl0VGltZUluTXM/OiBudW1iZXIpOiBPYnNlcnZhYmxlPENka1Njcm9sbGFibGV8dm9pZD4ge1xuICAgIGNvbnN0IGFuY2VzdG9ycyA9IHRoaXMuZ2V0QW5jZXN0b3JTY3JvbGxDb250YWluZXJzKGVsZW1lbnRSZWYpO1xuXG4gICAgcmV0dXJuIHRoaXMuc2Nyb2xsZWQoYXVkaXRUaW1lSW5NcykucGlwZShmaWx0ZXIodGFyZ2V0ID0+IHtcbiAgICAgIHJldHVybiAhdGFyZ2V0IHx8IGFuY2VzdG9ycy5pbmRleE9mKHRhcmdldCkgPiAtMTtcbiAgICB9KSk7XG4gIH1cblxuICAvKiogUmV0dXJucyBhbGwgcmVnaXN0ZXJlZCBTY3JvbGxhYmxlcyB0aGF0IGNvbnRhaW4gdGhlIHByb3ZpZGVkIGVsZW1lbnQuICovXG4gIGdldEFuY2VzdG9yU2Nyb2xsQ29udGFpbmVycyhlbGVtZW50UmVmOiBFbGVtZW50UmVmKTogQ2RrU2Nyb2xsYWJsZVtdIHtcbiAgICBjb25zdCBzY3JvbGxpbmdDb250YWluZXJzOiBDZGtTY3JvbGxhYmxlW10gPSBbXTtcblxuICAgIHRoaXMuc2Nyb2xsQ29udGFpbmVycy5mb3JFYWNoKChfc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24sIHNjcm9sbGFibGU6IENka1Njcm9sbGFibGUpID0+IHtcbiAgICAgIGlmICh0aGlzLl9zY3JvbGxhYmxlQ29udGFpbnNFbGVtZW50KHNjcm9sbGFibGUsIGVsZW1lbnRSZWYpKSB7XG4gICAgICAgIHNjcm9sbGluZ0NvbnRhaW5lcnMucHVzaChzY3JvbGxhYmxlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBzY3JvbGxpbmdDb250YWluZXJzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIHRoZSBwcm92aWRlZCBTY3JvbGxhYmxlLiAqL1xuICBwcml2YXRlIF9zY3JvbGxhYmxlQ29udGFpbnNFbGVtZW50KHNjcm9sbGFibGU6IENka1Njcm9sbGFibGUsIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpOiBib29sZWFuIHtcbiAgICBsZXQgZWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIGxldCBzY3JvbGxhYmxlRWxlbWVudCA9IHNjcm9sbGFibGUuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBUcmF2ZXJzZSB0aHJvdWdoIHRoZSBlbGVtZW50IHBhcmVudHMgdW50aWwgd2UgcmVhY2ggbnVsbCwgY2hlY2tpbmcgaWYgYW55IG9mIHRoZSBlbGVtZW50c1xuICAgIC8vIGFyZSB0aGUgc2Nyb2xsYWJsZSdzIGVsZW1lbnQuXG4gICAgZG8ge1xuICAgICAgaWYgKGVsZW1lbnQgPT0gc2Nyb2xsYWJsZUVsZW1lbnQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICB9IHdoaWxlIChlbGVtZW50ID0gZWxlbWVudCEucGFyZW50RWxlbWVudCk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogU2V0cyB1cCB0aGUgZ2xvYmFsIHNjcm9sbCBsaXN0ZW5lcnMuICovXG4gIHByaXZhdGUgX2FkZEdsb2JhbExpc3RlbmVyKCkge1xuICAgIHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbiA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gZnJvbUV2ZW50KHdpbmRvdy5kb2N1bWVudCwgJ3Njcm9sbCcpLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zY3JvbGxlZC5uZXh0KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgZ2xvYmFsIHNjcm9sbCBsaXN0ZW5lci4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlR2xvYmFsTGlzdGVuZXIoKSB7XG4gICAgaWYgKHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiBTQ1JPTExfRElTUEFUQ0hFUl9QUk9WSURFUl9GQUNUT1JZKFxuICAgIHBhcmVudERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsIG5nWm9uZTogTmdab25lLCBwbGF0Zm9ybTogUGxhdGZvcm0pIHtcbiAgcmV0dXJuIHBhcmVudERpc3BhdGNoZXIgfHwgbmV3IFNjcm9sbERpc3BhdGNoZXIobmdab25lLCBwbGF0Zm9ybSk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBjb25zdCBTQ1JPTExfRElTUEFUQ0hFUl9QUk9WSURFUiA9IHtcbiAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhIFNjcm9sbERpc3BhdGNoZXIgYXZhaWxhYmxlLCB1c2UgdGhhdC4gT3RoZXJ3aXNlLCBwcm92aWRlIGEgbmV3IG9uZS5cbiAgcHJvdmlkZTogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgZGVwczogW1tuZXcgT3B0aW9uYWwoKSwgbmV3IFNraXBTZWxmKCksIFNjcm9sbERpc3BhdGNoZXJdLCBOZ1pvbmUsIFBsYXRmb3JtXSxcbiAgdXNlRmFjdG9yeTogU0NST0xMX0RJU1BBVENIRVJfUFJPVklERVJfRkFDVE9SWVxufTtcbiJdfQ==