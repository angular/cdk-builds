/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * Time in ms to throttle the scrolling events by default.
 * @type {?}
 */
export const DEFAULT_SCROLL_TIME = 20;
/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 */
export class ScrollDispatcher {
    /**
     * @param {?} _ngZone
     * @param {?} _platform
     */
    constructor(_ngZone, _platform) {
        this._ngZone = _ngZone;
        this._platform = _platform;
        /**
         * Subject for notifying that a registered scrollable reference element has been scrolled.
         */
        this._scrolled = new Subject();
        /**
         * Keeps track of the global `scroll` and `resize` subscriptions.
         */
        this._globalSubscription = null;
        /**
         * Keeps track of the amount of subscriptions to `scrolled`. Used for cleaning up afterwards.
         */
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
     * @param {?} scrollable Scrollable instance to be registered.
     * @return {?}
     */
    register(scrollable) {
        if (!this.scrollContainers.has(scrollable)) {
            this.scrollContainers.set(scrollable, scrollable.elementScrolled()
                .subscribe((/**
             * @return {?}
             */
            () => this._scrolled.next(scrollable))));
        }
    }
    /**
     * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
     * @param {?} scrollable Scrollable instance to be deregistered.
     * @return {?}
     */
    deregister(scrollable) {
        /** @type {?} */
        const scrollableReference = this.scrollContainers.get(scrollable);
        if (scrollableReference) {
            scrollableReference.unsubscribe();
            this.scrollContainers.delete(scrollable);
        }
    }
    /**
     * Returns an observable that emits an event whenever any of the registered Scrollable
     * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
     * to override the default "throttle" time.
     *
     * **Note:** in order to avoid hitting change detection for every scroll event,
     * all of the events emitted from this stream will be run outside the Angular zone.
     * If you need to update any data bindings as a result of a scroll event, you have
     * to run the callback using `NgZone.run`.
     * @param {?=} auditTimeInMs
     * @return {?}
     */
    scrolled(auditTimeInMs = DEFAULT_SCROLL_TIME) {
        if (!this._platform.isBrowser) {
            return observableOf();
        }
        return new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => {
            if (!this._globalSubscription) {
                this._addGlobalListener();
            }
            // In the case of a 0ms delay, use an observable without auditTime
            // since it does add a perceptible delay in processing overhead.
            /** @type {?} */
            const subscription = auditTimeInMs > 0 ?
                this._scrolled.pipe(auditTime(auditTimeInMs)).subscribe(observer) :
                this._scrolled.subscribe(observer);
            this._scrolledCount++;
            return (/**
             * @return {?}
             */
            () => {
                subscription.unsubscribe();
                this._scrolledCount--;
                if (!this._scrolledCount) {
                    this._removeGlobalListener();
                }
            });
        }));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._removeGlobalListener();
        this.scrollContainers.forEach((/**
         * @param {?} _
         * @param {?} container
         * @return {?}
         */
        (_, container) => this.deregister(container)));
        this._scrolled.complete();
    }
    /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param {?} elementRef Element whose ancestors to listen for.
     * @param {?=} auditTimeInMs Time to throttle the scroll events.
     * @return {?}
     */
    ancestorScrolled(elementRef, auditTimeInMs) {
        /** @type {?} */
        const ancestors = this.getAncestorScrollContainers(elementRef);
        return this.scrolled(auditTimeInMs).pipe(filter((/**
         * @param {?} target
         * @return {?}
         */
        target => {
            return !target || ancestors.indexOf(target) > -1;
        })));
    }
    /**
     * Returns all registered Scrollables that contain the provided element.
     * @param {?} elementRef
     * @return {?}
     */
    getAncestorScrollContainers(elementRef) {
        /** @type {?} */
        const scrollingContainers = [];
        this.scrollContainers.forEach((/**
         * @param {?} _subscription
         * @param {?} scrollable
         * @return {?}
         */
        (_subscription, scrollable) => {
            if (this._scrollableContainsElement(scrollable, elementRef)) {
                scrollingContainers.push(scrollable);
            }
        }));
        return scrollingContainers;
    }
    /**
     * Returns true if the element is contained within the provided Scrollable.
     * @private
     * @param {?} scrollable
     * @param {?} elementRef
     * @return {?}
     */
    _scrollableContainsElement(scrollable, elementRef) {
        /** @type {?} */
        let element = elementRef.nativeElement;
        /** @type {?} */
        let scrollableElement = scrollable.getElementRef().nativeElement;
        // Traverse through the element parents until we reach null, checking if any of the elements
        // are the scrollable's element.
        do {
            if (element == scrollableElement) {
                return true;
            }
        } while (element = (/** @type {?} */ (element)).parentElement);
        return false;
    }
    /**
     * Sets up the global scroll listeners.
     * @private
     * @return {?}
     */
    _addGlobalListener() {
        this._globalSubscription = this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            return fromEvent(window.document, 'scroll').subscribe((/**
             * @return {?}
             */
            () => this._scrolled.next()));
        }));
    }
    /**
     * Cleans up the global scroll listener.
     * @private
     * @return {?}
     */
    _removeGlobalListener() {
        if (this._globalSubscription) {
            this._globalSubscription.unsubscribe();
            this._globalSubscription = null;
        }
    }
}
ScrollDispatcher.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
ScrollDispatcher.ctorParameters = () => [
    { type: NgZone },
    { type: Platform }
];
/** @nocollapse */ ScrollDispatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function ScrollDispatcher_Factory() { return new ScrollDispatcher(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform)); }, token: ScrollDispatcher, providedIn: "root" });
if (false) {
    /**
     * Subject for notifying that a registered scrollable reference element has been scrolled.
     * @type {?}
     * @private
     */
    ScrollDispatcher.prototype._scrolled;
    /**
     * Keeps track of the global `scroll` and `resize` subscriptions.
     * @type {?}
     */
    ScrollDispatcher.prototype._globalSubscription;
    /**
     * Keeps track of the amount of subscriptions to `scrolled`. Used for cleaning up afterwards.
     * @type {?}
     * @private
     */
    ScrollDispatcher.prototype._scrolledCount;
    /**
     * Map of all the scrollable references that are registered with the service and their
     * scroll event subscriptions.
     * @type {?}
     */
    ScrollDispatcher.prototype.scrollContainers;
    /**
     * @type {?}
     * @private
     */
    ScrollDispatcher.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    ScrollDispatcher.prototype._platform;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy9zY3JvbGwtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQWEsVUFBVSxFQUFFLE1BQU0sRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFnQixVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDaEcsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7OztBQUtqRCxNQUFNLE9BQU8sbUJBQW1CLEdBQUcsRUFBRTs7Ozs7QUFPckMsTUFBTSxPQUFPLGdCQUFnQjs7Ozs7SUFDM0IsWUFBb0IsT0FBZSxFQUFVLFNBQW1CO1FBQTVDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFVOzs7O1FBR3hELGNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBc0IsQ0FBQzs7OztRQUd0RCx3QkFBbUIsR0FBd0IsSUFBSSxDQUFDOzs7O1FBR3hDLG1CQUFjLEdBQUcsQ0FBQyxDQUFDOzs7OztRQU0zQixxQkFBZ0IsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQWZLLENBQUM7Ozs7Ozs7SUFzQnJFLFFBQVEsQ0FBQyxVQUF5QjtRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsZUFBZSxFQUFFO2lCQUM3RCxTQUFTOzs7WUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMs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QUFDLGFBQWE7O1lBQ3RELGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxhQUFhO1FBRWhFLDRGQUE0RjtRQUM1RixnQ0FBZ0M7UUFDaEMsR0FBRztZQUNELElBQUksT0FBTyxJQUFJLGlCQUFpQixFQUFFO2dCQUFFLE9BQU8sSUFBSSxDQUFDO2FBQUU7U0FDbkQsUUFBUSxPQUFPLEdBQUcsbUJBQUEsT0FBTyxFQUFDLENBQUMsYUFBYSxFQUFFO1FBRTNDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQzs7Ozs7O0lBR08sa0JBQWtCO1FBQ3hCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQjs7O1FBQUMsR0FBRyxFQUFFO1lBQzdELE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsU0FBUzs7O1lBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDO1FBQ3JGLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7O0lBR08scUJBQXFCO1FBQzNCLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQzVCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQzs7O1lBL0lGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7WUFiQSxNQUFNO1lBRDlCLFFBQVE7Ozs7Ozs7OztJQW1CZCxxQ0FBc0Q7Ozs7O0lBR3RELCtDQUFnRDs7Ozs7O0lBR2hELDBDQUEyQjs7Ozs7O0lBTTNCLDRDQUErRDs7Ozs7SUFmbkQsbUNBQXVCOzs7OztJQUFFLHFDQUEyQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtFbGVtZW50UmVmLCBJbmplY3RhYmxlLCBOZ1pvbmUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2Zyb21FdmVudCwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0LCBTdWJzY3JpcHRpb24sIE9ic2VydmFibGUsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7YXVkaXRUaW1lLCBmaWx0ZXJ9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Q2RrU2Nyb2xsYWJsZX0gZnJvbSAnLi9zY3JvbGxhYmxlJztcblxuXG4vKiogVGltZSBpbiBtcyB0byB0aHJvdHRsZSB0aGUgc2Nyb2xsaW5nIGV2ZW50cyBieSBkZWZhdWx0LiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0NST0xMX1RJTUUgPSAyMDtcblxuLyoqXG4gKiBTZXJ2aWNlIGNvbnRhaW5lZCBhbGwgcmVnaXN0ZXJlZCBTY3JvbGxhYmxlIHJlZmVyZW5jZXMgYW5kIGVtaXRzIGFuIGV2ZW50IHdoZW4gYW55IG9uZSBvZiB0aGVcbiAqIFNjcm9sbGFibGUgcmVmZXJlbmNlcyBlbWl0IGEgc2Nyb2xsZWQgZXZlbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFNjcm9sbERpc3BhdGNoZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSwgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtKSB7IH1cblxuICAvKiogU3ViamVjdCBmb3Igbm90aWZ5aW5nIHRoYXQgYSByZWdpc3RlcmVkIHNjcm9sbGFibGUgcmVmZXJlbmNlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgX3Njcm9sbGVkID0gbmV3IFN1YmplY3Q8Q2RrU2Nyb2xsYWJsZXx2b2lkPigpO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZ2xvYmFsIGBzY3JvbGxgIGFuZCBgcmVzaXplYCBzdWJzY3JpcHRpb25zLiAqL1xuICBfZ2xvYmFsU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsID0gbnVsbDtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGFtb3VudCBvZiBzdWJzY3JpcHRpb25zIHRvIGBzY3JvbGxlZGAuIFVzZWQgZm9yIGNsZWFuaW5nIHVwIGFmdGVyd2FyZHMuICovXG4gIHByaXZhdGUgX3Njcm9sbGVkQ291bnQgPSAwO1xuXG4gIC8qKlxuICAgKiBNYXAgb2YgYWxsIHRoZSBzY3JvbGxhYmxlIHJlZmVyZW5jZXMgdGhhdCBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoZSBzZXJ2aWNlIGFuZCB0aGVpclxuICAgKiBzY3JvbGwgZXZlbnQgc3Vic2NyaXB0aW9ucy5cbiAgICovXG4gIHNjcm9sbENvbnRhaW5lcnM6IE1hcDxDZGtTY3JvbGxhYmxlLCBTdWJzY3JpcHRpb24+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBzY3JvbGxhYmxlIGluc3RhbmNlIHdpdGggdGhlIHNlcnZpY2UgYW5kIGxpc3RlbnMgZm9yIGl0cyBzY3JvbGxlZCBldmVudHMuIFdoZW4gdGhlXG4gICAqIHNjcm9sbGFibGUgaXMgc2Nyb2xsZWQsIHRoZSBzZXJ2aWNlIGVtaXRzIHRoZSBldmVudCB0byBpdHMgc2Nyb2xsZWQgb2JzZXJ2YWJsZS5cbiAgICogQHBhcmFtIHNjcm9sbGFibGUgU2Nyb2xsYWJsZSBpbnN0YW5jZSB0byBiZSByZWdpc3RlcmVkLlxuICAgKi9cbiAgcmVnaXN0ZXIoc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zY3JvbGxDb250YWluZXJzLmhhcyhzY3JvbGxhYmxlKSkge1xuICAgICAgdGhpcy5zY3JvbGxDb250YWluZXJzLnNldChzY3JvbGxhYmxlLCBzY3JvbGxhYmxlLmVsZW1lbnRTY3JvbGxlZCgpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zY3JvbGxlZC5uZXh0KHNjcm9sbGFibGUpKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlcmVnaXN0ZXJzIGEgU2Nyb2xsYWJsZSByZWZlcmVuY2UgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIGl0cyBzY3JvbGwgZXZlbnQgb2JzZXJ2YWJsZS5cbiAgICogQHBhcmFtIHNjcm9sbGFibGUgU2Nyb2xsYWJsZSBpbnN0YW5jZSB0byBiZSBkZXJlZ2lzdGVyZWQuXG4gICAqL1xuICBkZXJlZ2lzdGVyKHNjcm9sbGFibGU6IENka1Njcm9sbGFibGUpOiB2b2lkIHtcbiAgICBjb25zdCBzY3JvbGxhYmxlUmVmZXJlbmNlID0gdGhpcy5zY3JvbGxDb250YWluZXJzLmdldChzY3JvbGxhYmxlKTtcblxuICAgIGlmIChzY3JvbGxhYmxlUmVmZXJlbmNlKSB7XG4gICAgICBzY3JvbGxhYmxlUmVmZXJlbmNlLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZGVsZXRlKHNjcm9sbGFibGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyBhbiBldmVudCB3aGVuZXZlciBhbnkgb2YgdGhlIHJlZ2lzdGVyZWQgU2Nyb2xsYWJsZVxuICAgKiByZWZlcmVuY2VzIChvciB3aW5kb3csIGRvY3VtZW50LCBvciBib2R5KSBmaXJlIGEgc2Nyb2xsZWQgZXZlbnQuIENhbiBwcm92aWRlIGEgdGltZSBpbiBtc1xuICAgKiB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBcInRocm90dGxlXCIgdGltZS5cbiAgICpcbiAgICogKipOb3RlOioqIGluIG9yZGVyIHRvIGF2b2lkIGhpdHRpbmcgY2hhbmdlIGRldGVjdGlvbiBmb3IgZXZlcnkgc2Nyb2xsIGV2ZW50LFxuICAgKiBhbGwgb2YgdGhlIGV2ZW50cyBlbWl0dGVkIGZyb20gdGhpcyBzdHJlYW0gd2lsbCBiZSBydW4gb3V0c2lkZSB0aGUgQW5ndWxhciB6b25lLlxuICAgKiBJZiB5b3UgbmVlZCB0byB1cGRhdGUgYW55IGRhdGEgYmluZGluZ3MgYXMgYSByZXN1bHQgb2YgYSBzY3JvbGwgZXZlbnQsIHlvdSBoYXZlXG4gICAqIHRvIHJ1biB0aGUgY2FsbGJhY2sgdXNpbmcgYE5nWm9uZS5ydW5gLlxuICAgKi9cbiAgc2Nyb2xsZWQoYXVkaXRUaW1lSW5NczogbnVtYmVyID0gREVGQVVMVF9TQ1JPTExfVElNRSk6IE9ic2VydmFibGU8Q2RrU2Nyb2xsYWJsZXx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Y8dm9pZD4oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxDZGtTY3JvbGxhYmxlfHZvaWQ+KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLl9hZGRHbG9iYWxMaXN0ZW5lcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiB0aGUgY2FzZSBvZiBhIDBtcyBkZWxheSwgdXNlIGFuIG9ic2VydmFibGUgd2l0aG91dCBhdWRpdFRpbWVcbiAgICAgIC8vIHNpbmNlIGl0IGRvZXMgYWRkIGEgcGVyY2VwdGlibGUgZGVsYXkgaW4gcHJvY2Vzc2luZyBvdmVyaGVhZC5cbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGF1ZGl0VGltZUluTXMgPiAwID9cbiAgICAgICAgdGhpcy5fc2Nyb2xsZWQucGlwZShhdWRpdFRpbWUoYXVkaXRUaW1lSW5NcykpLnN1YnNjcmliZShvYnNlcnZlcikgOlxuICAgICAgICB0aGlzLl9zY3JvbGxlZC5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuXG4gICAgICB0aGlzLl9zY3JvbGxlZENvdW50Kys7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9zY3JvbGxlZENvdW50LS07XG5cbiAgICAgICAgaWYgKCF0aGlzLl9zY3JvbGxlZENvdW50KSB7XG4gICAgICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXIoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3JlbW92ZUdsb2JhbExpc3RlbmVyKCk7XG4gICAgdGhpcy5zY3JvbGxDb250YWluZXJzLmZvckVhY2goKF8sIGNvbnRhaW5lcikgPT4gdGhpcy5kZXJlZ2lzdGVyKGNvbnRhaW5lcikpO1xuICAgIHRoaXMuX3Njcm9sbGVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbmV2ZXIgYW55IG9mIHRoZVxuICAgKiBzY3JvbGxhYmxlIGFuY2VzdG9ycyBvZiBhbiBlbGVtZW50IGFyZSBzY3JvbGxlZC5cbiAgICogQHBhcmFtIGVsZW1lbnRSZWYgRWxlbWVudCB3aG9zZSBhbmNlc3RvcnMgdG8gbGlzdGVuIGZvci5cbiAgICogQHBhcmFtIGF1ZGl0VGltZUluTXMgVGltZSB0byB0aHJvdHRsZSB0aGUgc2Nyb2xsIGV2ZW50cy5cbiAgICovXG4gIGFuY2VzdG9yU2Nyb2xsZWQoZWxlbWVudFJlZjogRWxlbWVudFJlZiwgYXVkaXRUaW1lSW5Ncz86IG51bWJlcik6IE9ic2VydmFibGU8Q2RrU2Nyb2xsYWJsZXx2b2lkPiB7XG4gICAgY29uc3QgYW5jZXN0b3JzID0gdGhpcy5nZXRBbmNlc3RvclNjcm9sbENvbnRhaW5lcnMoZWxlbWVudFJlZik7XG5cbiAgICByZXR1cm4gdGhpcy5zY3JvbGxlZChhdWRpdFRpbWVJbk1zKS5waXBlKGZpbHRlcih0YXJnZXQgPT4ge1xuICAgICAgcmV0dXJuICF0YXJnZXQgfHwgYW5jZXN0b3JzLmluZGV4T2YodGFyZ2V0KSA+IC0xO1xuICAgIH0pKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGFsbCByZWdpc3RlcmVkIFNjcm9sbGFibGVzIHRoYXQgY29udGFpbiB0aGUgcHJvdmlkZWQgZWxlbWVudC4gKi9cbiAgZ2V0QW5jZXN0b3JTY3JvbGxDb250YWluZXJzKGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYpOiBDZGtTY3JvbGxhYmxlW10ge1xuICAgIGNvbnN0IHNjcm9sbGluZ0NvbnRhaW5lcnM6IENka1Njcm9sbGFibGVbXSA9IFtdO1xuXG4gICAgdGhpcy5zY3JvbGxDb250YWluZXJzLmZvckVhY2goKF9zdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiwgc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuX3Njcm9sbGFibGVDb250YWluc0VsZW1lbnQoc2Nyb2xsYWJsZSwgZWxlbWVudFJlZikpIHtcbiAgICAgICAgc2Nyb2xsaW5nQ29udGFpbmVycy5wdXNoKHNjcm9sbGFibGUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjcm9sbGluZ0NvbnRhaW5lcnM7XG4gIH1cblxuICAvKiogUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIHByb3ZpZGVkIFNjcm9sbGFibGUuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVDb250YWluc0VsZW1lbnQoc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSwgZWxlbWVudFJlZjogRWxlbWVudFJlZik6IGJvb2xlYW4ge1xuICAgIGxldCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgbGV0IHNjcm9sbGFibGVFbGVtZW50ID0gc2Nyb2xsYWJsZS5nZXRFbGVtZW50UmVmKCkubmF0aXZlRWxlbWVudDtcblxuICAgIC8vIFRyYXZlcnNlIHRocm91Z2ggdGhlIGVsZW1lbnQgcGFyZW50cyB1bnRpbCB3ZSByZWFjaCBudWxsLCBjaGVja2luZyBpZiBhbnkgb2YgdGhlIGVsZW1lbnRzXG4gICAgLy8gYXJlIHRoZSBzY3JvbGxhYmxlJ3MgZWxlbWVudC5cbiAgICBkbyB7XG4gICAgICBpZiAoZWxlbWVudCA9PSBzY3JvbGxhYmxlRWxlbWVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIH0gd2hpbGUgKGVsZW1lbnQgPSBlbGVtZW50IS5wYXJlbnRFbGVtZW50KTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKiBTZXRzIHVwIHRoZSBnbG9iYWwgc2Nyb2xsIGxpc3RlbmVycy4gKi9cbiAgcHJpdmF0ZSBfYWRkR2xvYmFsTGlzdGVuZXIoKSB7XG4gICAgdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uID0gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHJldHVybiBmcm9tRXZlbnQod2luZG93LmRvY3VtZW50LCAnc2Nyb2xsJykuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbGVkLm5leHQoKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBnbG9iYWwgc2Nyb2xsIGxpc3RlbmVyLiAqL1xuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcigpIHtcbiAgICBpZiAodGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9XG59XG4iXX0=