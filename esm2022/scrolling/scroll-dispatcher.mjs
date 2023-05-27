/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceElement } from '@angular/cdk/coercion';
import { Platform } from '@angular/cdk/platform';
import { Injectable, NgZone, Optional, Inject } from '@angular/core';
import { fromEvent, of as observableOf, Subject, Observable } from 'rxjs';
import { auditTime, filter } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Time in ms to throttle the scrolling events by default. */
export const DEFAULT_SCROLL_TIME = 20;
/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 */
class ScrollDispatcher {
    constructor(_ngZone, _platform, document) {
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
        this._document = document;
    }
    /**
     * Registers a scrollable instance with the service and listens for its scrolled events. When the
     * scrollable is scrolled, the service emits the event to its scrolled observable.
     * @param scrollable Scrollable instance to be registered.
     */
    register(scrollable) {
        if (!this.scrollContainers.has(scrollable)) {
            this.scrollContainers.set(scrollable, scrollable.elementScrolled().subscribe(() => this._scrolled.next(scrollable)));
        }
    }
    /**
     * De-registers a Scrollable reference and unsubscribes from its scroll event observable.
     * @param scrollable Scrollable instance to be deregistered.
     */
    deregister(scrollable) {
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
     */
    scrolled(auditTimeInMs = DEFAULT_SCROLL_TIME) {
        if (!this._platform.isBrowser) {
            return observableOf();
        }
        return new Observable((observer) => {
            if (!this._globalSubscription) {
                this._addGlobalListener();
            }
            // In the case of a 0ms delay, use an observable without auditTime
            // since it does add a perceptible delay in processing overhead.
            const subscription = auditTimeInMs > 0
                ? this._scrolled.pipe(auditTime(auditTimeInMs)).subscribe(observer)
                : this._scrolled.subscribe(observer);
            this._scrolledCount++;
            return () => {
                subscription.unsubscribe();
                this._scrolledCount--;
                if (!this._scrolledCount) {
                    this._removeGlobalListener();
                }
            };
        });
    }
    ngOnDestroy() {
        this._removeGlobalListener();
        this.scrollContainers.forEach((_, container) => this.deregister(container));
        this._scrolled.complete();
    }
    /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param elementOrElementRef Element whose ancestors to listen for.
     * @param auditTimeInMs Time to throttle the scroll events.
     */
    ancestorScrolled(elementOrElementRef, auditTimeInMs) {
        const ancestors = this.getAncestorScrollContainers(elementOrElementRef);
        return this.scrolled(auditTimeInMs).pipe(filter(target => {
            return !target || ancestors.indexOf(target) > -1;
        }));
    }
    /** Returns all registered Scrollables that contain the provided element. */
    getAncestorScrollContainers(elementOrElementRef) {
        const scrollingContainers = [];
        this.scrollContainers.forEach((_subscription, scrollable) => {
            if (this._scrollableContainsElement(scrollable, elementOrElementRef)) {
                scrollingContainers.push(scrollable);
            }
        });
        return scrollingContainers;
    }
    /** Use defaultView of injected document if available or fallback to global window reference */
    _getWindow() {
        return this._document.defaultView || window;
    }
    /** Returns true if the element is contained within the provided Scrollable. */
    _scrollableContainsElement(scrollable, elementOrElementRef) {
        let element = coerceElement(elementOrElementRef);
        let scrollableElement = scrollable.getElementRef().nativeElement;
        // Traverse through the element parents until we reach null, checking if any of the elements
        // are the scrollable's element.
        do {
            if (element == scrollableElement) {
                return true;
            }
        } while ((element = element.parentElement));
        return false;
    }
    /** Sets up the global scroll listeners. */
    _addGlobalListener() {
        this._globalSubscription = this._ngZone.runOutsideAngular(() => {
            const window = this._getWindow();
            return fromEvent(window.document, 'scroll').subscribe(() => this._scrolled.next());
        });
    }
    /** Cleans up the global scroll listener. */
    _removeGlobalListener() {
        if (this._globalSubscription) {
            this._globalSubscription.unsubscribe();
            this._globalSubscription = null;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: ScrollDispatcher, deps: [{ token: i0.NgZone }, { token: i1.Platform }, { token: DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: ScrollDispatcher, providedIn: 'root' }); }
}
export { ScrollDispatcher };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: ScrollDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i1.Platform }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy9zY3JvbGwtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBYSxVQUFVLEVBQUUsTUFBTSxFQUFhLFFBQVEsRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUYsT0FBTyxFQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBZ0IsVUFBVSxFQUFXLE1BQU0sTUFBTSxDQUFDO0FBQ2hHLE9BQU8sRUFBQyxTQUFTLEVBQUUsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7QUFFekMsOERBQThEO0FBQzlELE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztBQUV0Qzs7O0dBR0c7QUFDSCxNQUNhLGdCQUFnQjtJQUkzQixZQUNVLE9BQWUsRUFDZixTQUFtQixFQUNHLFFBQWE7UUFGbkMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFNN0IsOEZBQThGO1FBQzdFLGNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBd0IsQ0FBQztRQUVqRSxxRUFBcUU7UUFDckUsd0JBQW1CLEdBQXdCLElBQUksQ0FBQztRQUVoRCxpR0FBaUc7UUFDekYsbUJBQWMsR0FBRyxDQUFDLENBQUM7UUFFM0I7OztXQUdHO1FBQ0gscUJBQWdCLEdBQXFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFoQjdELElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lB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QyxDQUFDO1FBQ3JGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELDRDQUE0QztJQUNwQyxxQkFBcUI7UUFDM0IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7U0FDakM7SUFDSCxDQUFDOzhHQTFLVSxnQkFBZ0IsZ0VBT0wsUUFBUTtrSEFQbkIsZ0JBQWdCLGNBREosTUFBTTs7U0FDbEIsZ0JBQWdCOzJGQUFoQixnQkFBZ0I7a0JBRDVCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFRM0IsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0VsZW1lbnRSZWYsIEluamVjdGFibGUsIE5nWm9uZSwgT25EZXN0cm95LCBPcHRpb25hbCwgSW5qZWN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBvZiBhcyBvYnNlcnZhYmxlT2YsIFN1YmplY3QsIFN1YnNjcmlwdGlvbiwgT2JzZXJ2YWJsZSwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHthdWRpdFRpbWUsIGZpbHRlcn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHR5cGUge0Nka1Njcm9sbGFibGV9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG4vKiogVGltZSBpbiBtcyB0byB0aHJvdHRsZSB0aGUgc2Nyb2xsaW5nIGV2ZW50cyBieSBkZWZhdWx0LiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0NST0xMX1RJTUUgPSAyMDtcblxuLyoqXG4gKiBTZXJ2aWNlIGNvbnRhaW5lZCBhbGwgcmVnaXN0ZXJlZCBTY3JvbGxhYmxlIHJlZmVyZW5jZXMgYW5kIGVtaXRzIGFuIGV2ZW50IHdoZW4gYW55IG9uZSBvZiB0aGVcbiAqIFNjcm9sbGFibGUgcmVmZXJlbmNlcyBlbWl0IGEgc2Nyb2xsZWQgZXZlbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFNjcm9sbERpc3BhdGNoZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnksXG4gICkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogU3ViamVjdCBmb3Igbm90aWZ5aW5nIHRoYXQgYSByZWdpc3RlcmVkIHNjcm9sbGFibGUgcmVmZXJlbmNlIGVsZW1lbnQgaGFzIGJlZW4gc2Nyb2xsZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX3Njcm9sbGVkID0gbmV3IFN1YmplY3Q8Q2RrU2Nyb2xsYWJsZSB8IHZvaWQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBnbG9iYWwgYHNjcm9sbGAgYW5kIGByZXNpemVgIHN1YnNjcmlwdGlvbnMuICovXG4gIF9nbG9iYWxTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgYW1vdW50IG9mIHN1YnNjcmlwdGlvbnMgdG8gYHNjcm9sbGVkYC4gVXNlZCBmb3IgY2xlYW5pbmcgdXAgYWZ0ZXJ3YXJkcy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsZWRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBhbGwgdGhlIHNjcm9sbGFibGUgcmVmZXJlbmNlcyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhlIHNlcnZpY2UgYW5kIHRoZWlyXG4gICAqIHNjcm9sbCBldmVudCBzdWJzY3JpcHRpb25zLlxuICAgKi9cbiAgc2Nyb2xsQ29udGFpbmVyczogTWFwPENka1Njcm9sbGFibGUsIFN1YnNjcmlwdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIHNjcm9sbGFibGUgaW5zdGFuY2Ugd2l0aCB0aGUgc2VydmljZSBhbmQgbGlzdGVucyBmb3IgaXRzIHNjcm9sbGVkIGV2ZW50cy4gV2hlbiB0aGVcbiAgICogc2Nyb2xsYWJsZSBpcyBzY3JvbGxlZCwgdGhlIHNlcnZpY2UgZW1pdHMgdGhlIGV2ZW50IHRvIGl0cyBzY3JvbGxlZCBvYnNlcnZhYmxlLlxuICAgKiBAcGFyYW0gc2Nyb2xsYWJsZSBTY3JvbGxhYmxlIGluc3RhbmNlIHRvIGJlIHJlZ2lzdGVyZWQuXG4gICAqL1xuICByZWdpc3RlcihzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbENvbnRhaW5lcnMuaGFzKHNjcm9sbGFibGUpKSB7XG4gICAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuc2V0KFxuICAgICAgICBzY3JvbGxhYmxlLFxuICAgICAgICBzY3JvbGxhYmxlLmVsZW1lbnRTY3JvbGxlZCgpLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zY3JvbGxlZC5uZXh0KHNjcm9sbGFibGUpKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlLXJlZ2lzdGVycyBhIFNjcm9sbGFibGUgcmVmZXJlbmNlIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBpdHMgc2Nyb2xsIGV2ZW50IG9ic2VydmFibGUuXG4gICAqIEBwYXJhbSBzY3JvbGxhYmxlIFNjcm9sbGFibGUgaW5zdGFuY2UgdG8gYmUgZGVyZWdpc3RlcmVkLlxuICAgKi9cbiAgZGVyZWdpc3RlcihzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKTogdm9pZCB7XG4gICAgY29uc3Qgc2Nyb2xsYWJsZVJlZmVyZW5jZSA9IHRoaXMuc2Nyb2xsQ29udGFpbmVycy5nZXQoc2Nyb2xsYWJsZSk7XG5cbiAgICBpZiAoc2Nyb2xsYWJsZVJlZmVyZW5jZSkge1xuICAgICAgc2Nyb2xsYWJsZVJlZmVyZW5jZS51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5zY3JvbGxDb250YWluZXJzLmRlbGV0ZShzY3JvbGxhYmxlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgYW4gZXZlbnQgd2hlbmV2ZXIgYW55IG9mIHRoZSByZWdpc3RlcmVkIFNjcm9sbGFibGVcbiAgICogcmVmZXJlbmNlcyAob3Igd2luZG93LCBkb2N1bWVudCwgb3IgYm9keSkgZmlyZSBhIHNjcm9sbGVkIGV2ZW50LiBDYW4gcHJvdmlkZSBhIHRpbWUgaW4gbXNcbiAgICogdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgXCJ0aHJvdHRsZVwiIHRpbWUuXG4gICAqXG4gICAqICoqTm90ZToqKiBpbiBvcmRlciB0byBhdm9pZCBoaXR0aW5nIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGV2ZXJ5IHNjcm9sbCBldmVudCxcbiAgICogYWxsIG9mIHRoZSBldmVudHMgZW1pdHRlZCBmcm9tIHRoaXMgc3RyZWFtIHdpbGwgYmUgcnVuIG91dHNpZGUgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICogSWYgeW91IG5lZWQgdG8gdXBkYXRlIGFueSBkYXRhIGJpbmRpbmdzIGFzIGEgcmVzdWx0IG9mIGEgc2Nyb2xsIGV2ZW50LCB5b3UgaGF2ZVxuICAgKiB0byBydW4gdGhlIGNhbGxiYWNrIHVzaW5nIGBOZ1pvbmUucnVuYC5cbiAgICovXG4gIHNjcm9sbGVkKGF1ZGl0VGltZUluTXM6IG51bWJlciA9IERFRkFVTFRfU0NST0xMX1RJTUUpOiBPYnNlcnZhYmxlPENka1Njcm9sbGFibGUgfCB2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Y8dm9pZD4oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxDZGtTY3JvbGxhYmxlIHwgdm9pZD4pID0+IHtcbiAgICAgIGlmICghdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuX2FkZEdsb2JhbExpc3RlbmVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIHRoZSBjYXNlIG9mIGEgMG1zIGRlbGF5LCB1c2UgYW4gb2JzZXJ2YWJsZSB3aXRob3V0IGF1ZGl0VGltZVxuICAgICAgLy8gc2luY2UgaXQgZG9lcyBhZGQgYSBwZXJjZXB0aWJsZSBkZWxheSBpbiBwcm9jZXNzaW5nIG92ZXJoZWFkLlxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID1cbiAgICAgICAgYXVkaXRUaW1lSW5NcyA+IDBcbiAgICAgICAgICA/IHRoaXMuX3Njcm9sbGVkLnBpcGUoYXVkaXRUaW1lKGF1ZGl0VGltZUluTXMpKS5zdWJzY3JpYmUob2JzZXJ2ZXIpXG4gICAgICAgICAgOiB0aGlzLl9zY3JvbGxlZC5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuXG4gICAgICB0aGlzLl9zY3JvbGxlZENvdW50Kys7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9zY3JvbGxlZENvdW50LS07XG5cbiAgICAgICAgaWYgKCF0aGlzLl9zY3JvbGxlZENvdW50KSB7XG4gICAgICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXIoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3JlbW92ZUdsb2JhbExpc3RlbmVyKCk7XG4gICAgdGhpcy5zY3JvbGxDb250YWluZXJzLmZvckVhY2goKF8sIGNvbnRhaW5lcikgPT4gdGhpcy5kZXJlZ2lzdGVyKGNvbnRhaW5lcikpO1xuICAgIHRoaXMuX3Njcm9sbGVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbmV2ZXIgYW55IG9mIHRoZVxuICAgKiBzY3JvbGxhYmxlIGFuY2VzdG9ycyBvZiBhbiBlbGVtZW50IGFyZSBzY3JvbGxlZC5cbiAgICogQHBhcmFtIGVsZW1lbnRPckVsZW1lbnRSZWYgRWxlbWVudCB3aG9zZSBhbmNlc3RvcnMgdG8gbGlzdGVuIGZvci5cbiAgICogQHBhcmFtIGF1ZGl0VGltZUluTXMgVGltZSB0byB0aHJvdHRsZSB0aGUgc2Nyb2xsIGV2ZW50cy5cbiAgICovXG4gIGFuY2VzdG9yU2Nyb2xsZWQoXG4gICAgZWxlbWVudE9yRWxlbWVudFJlZjogRWxlbWVudFJlZiB8IEhUTUxFbGVtZW50LFxuICAgIGF1ZGl0VGltZUluTXM/OiBudW1iZXIsXG4gICk6IE9ic2VydmFibGU8Q2RrU2Nyb2xsYWJsZSB8IHZvaWQ+IHtcbiAgICBjb25zdCBhbmNlc3RvcnMgPSB0aGlzLmdldEFuY2VzdG9yU2Nyb2xsQ29udGFpbmVycyhlbGVtZW50T3JFbGVtZW50UmVmKTtcblxuICAgIHJldHVybiB0aGlzLnNjcm9sbGVkKGF1ZGl0VGltZUluTXMpLnBpcGUoXG4gICAgICBmaWx0ZXIodGFyZ2V0ID0+IHtcbiAgICAgICAgcmV0dXJuICF0YXJnZXQgfHwgYW5jZXN0b3JzLmluZGV4T2YodGFyZ2V0KSA+IC0xO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGFsbCByZWdpc3RlcmVkIFNjcm9sbGFibGVzIHRoYXQgY29udGFpbiB0aGUgcHJvdmlkZWQgZWxlbWVudC4gKi9cbiAgZ2V0QW5jZXN0b3JTY3JvbGxDb250YWluZXJzKGVsZW1lbnRPckVsZW1lbnRSZWY6IEVsZW1lbnRSZWYgfCBIVE1MRWxlbWVudCk6IENka1Njcm9sbGFibGVbXSB7XG4gICAgY29uc3Qgc2Nyb2xsaW5nQ29udGFpbmVyczogQ2RrU2Nyb2xsYWJsZVtdID0gW107XG5cbiAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZm9yRWFjaCgoX3N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uLCBzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKSA9PiB7XG4gICAgICBpZiAodGhpcy5fc2Nyb2xsYWJsZUNvbnRhaW5zRWxlbWVudChzY3JvbGxhYmxlLCBlbGVtZW50T3JFbGVtZW50UmVmKSkge1xuICAgICAgICBzY3JvbGxpbmdDb250YWluZXJzLnB1c2goc2Nyb2xsYWJsZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2Nyb2xsaW5nQ29udGFpbmVycztcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudC5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICAvKiogUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIHByb3ZpZGVkIFNjcm9sbGFibGUuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVDb250YWluc0VsZW1lbnQoXG4gICAgc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSxcbiAgICBlbGVtZW50T3JFbGVtZW50UmVmOiBFbGVtZW50UmVmIHwgSFRNTEVsZW1lbnQsXG4gICk6IGJvb2xlYW4ge1xuICAgIGxldCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnRPckVsZW1lbnRSZWYpO1xuICAgIGxldCBzY3JvbGxhYmxlRWxlbWVudCA9IHNjcm9sbGFibGUuZ2V0RWxlbWVudFJlZigpLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAvLyBUcmF2ZXJzZSB0aHJvdWdoIHRoZSBlbGVtZW50IHBhcmVudHMgdW50aWwgd2UgcmVhY2ggbnVsbCwgY2hlY2tpbmcgaWYgYW55IG9mIHRoZSBlbGVtZW50c1xuICAgIC8vIGFyZSB0aGUgc2Nyb2xsYWJsZSdzIGVsZW1lbnQuXG4gICAgZG8ge1xuICAgICAgaWYgKGVsZW1lbnQgPT0gc2Nyb2xsYWJsZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoKGVsZW1lbnQgPSBlbGVtZW50IS5wYXJlbnRFbGVtZW50KSk7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogU2V0cyB1cCB0aGUgZ2xvYmFsIHNjcm9sbCBsaXN0ZW5lcnMuICovXG4gIHByaXZhdGUgX2FkZEdsb2JhbExpc3RlbmVyKCkge1xuICAgIHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbiA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcbiAgICAgIHJldHVybiBmcm9tRXZlbnQod2luZG93LmRvY3VtZW50LCAnc2Nyb2xsJykuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbGVkLm5leHQoKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBnbG9iYWwgc2Nyb2xsIGxpc3RlbmVyLiAqL1xuICBwcml2YXRlIF9yZW1vdmVHbG9iYWxMaXN0ZW5lcigpIHtcbiAgICBpZiAodGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9XG59XG4iXX0=