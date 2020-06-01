/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { Injectable, NgZone, Optional, Inject } from '@angular/core';
import { fromEvent, of as observableOf, Subject, Observable } from 'rxjs';
import { auditTime, filter } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
/** Time in ms to throttle the scrolling events by default. */
export const DEFAULT_SCROLL_TIME = 20;
/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 */
let ScrollDispatcher = /** @class */ (() => {
    class ScrollDispatcher {
        constructor(_ngZone, _platform, 
        /** @breaking-change 11.0.0 make document required */
        document) {
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
                this.scrollContainers.set(scrollable, scrollable.elementScrolled()
                    .subscribe(() => this._scrolled.next(scrollable)));
            }
        }
        /**
         * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
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
                const subscription = auditTimeInMs > 0 ?
                    this._scrolled.pipe(auditTime(auditTimeInMs)).subscribe(observer) :
                    this._scrolled.subscribe(observer);
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
         * @param elementRef Element whose ancestors to listen for.
         * @param auditTimeInMs Time to throttle the scroll events.
         */
        ancestorScrolled(elementRef, auditTimeInMs) {
            const ancestors = this.getAncestorScrollContainers(elementRef);
            return this.scrolled(auditTimeInMs).pipe(filter(target => {
                return !target || ancestors.indexOf(target) > -1;
            }));
        }
        /** Returns all registered Scrollables that contain the provided element. */
        getAncestorScrollContainers(elementRef) {
            const scrollingContainers = [];
            this.scrollContainers.forEach((_subscription, scrollable) => {
                if (this._scrollableContainsElement(scrollable, elementRef)) {
                    scrollingContainers.push(scrollable);
                }
            });
            return scrollingContainers;
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
        /** Returns true if the element is contained within the provided Scrollable. */
        _scrollableContainsElement(scrollable, elementRef) {
            let element = elementRef.nativeElement;
            let scrollableElement = scrollable.getElementRef().nativeElement;
            // Traverse through the element parents until we reach null, checking if any of the elements
            // are the scrollable's element.
            do {
                if (element == scrollableElement) {
                    return true;
                }
            } while (element = element.parentElement);
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
    }
    ScrollDispatcher.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ScrollDispatcher.ctorParameters = () => [
        { type: NgZone },
        { type: Platform },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] }
    ];
    ScrollDispatcher.ɵprov = i0.ɵɵdefineInjectable({ factory: function ScrollDispatcher_Factory() { return new ScrollDispatcher(i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT, 8)); }, token: ScrollDispatcher, providedIn: "root" });
    return ScrollDispatcher;
})();
export { ScrollDispatcher };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsLWRpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Njcm9sbGluZy9zY3JvbGwtZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFhLFVBQVUsRUFBRSxNQUFNLEVBQWEsUUFBUSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMxRixPQUFPLEVBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxFQUFnQixVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDaEcsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7QUFFekMsOERBQThEO0FBQzlELE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztBQUV0Qzs7O0dBR0c7QUFDSDtJQUFBLE1BQ2EsZ0JBQWdCO1FBSTNCLFlBQW9CLE9BQWUsRUFDZixTQUFtQjtRQUMzQixxREFBcUQ7UUFDdkIsUUFBYztZQUhwQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsY0FBUyxHQUFULFNBQVMsQ0FBVTtZQU12Qyw4RkFBOEY7WUFDdEYsY0FBUyxHQUFHLElBQUksT0FBTyxFQUFzQixDQUFDO1lBRXRELHFFQUFxRTtZQUNyRSx3QkFBbUIsR0FBd0IsSUFBSSxDQUFDO1lBRWhELGlHQUFpRztZQUN6RixtQkFBYyxHQUFHLENBQUMsQ0FBQztZQUUzQjs7O2VBR0c7WUFDSCxxQkFBZ0IsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQWhCN0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDNUIsQ0FBQztRQWlCRDs7OztXQUlH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QUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNyRixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCw0Q0FBNEM7UUFDcEMscUJBQXFCO1lBQzNCLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO2dCQUM1QixJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7YUFDakM7UUFDSCxDQUFDOzs7Z0JBbktGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7Z0JBYkEsTUFBTTtnQkFEOUIsUUFBUTtnREFzQkQsUUFBUSxZQUFJLE1BQU0sU0FBQyxRQUFROzs7MkJBOUIxQztLQTBMQztTQW5LWSxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7RWxlbWVudFJlZiwgSW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBJbmplY3R9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdCwgU3Vic2NyaXB0aW9uLCBPYnNlcnZhYmxlLCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2F1ZGl0VGltZSwgZmlsdGVyfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Nka1Njcm9sbGFibGV9IGZyb20gJy4vc2Nyb2xsYWJsZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG4vKiogVGltZSBpbiBtcyB0byB0aHJvdHRsZSB0aGUgc2Nyb2xsaW5nIGV2ZW50cyBieSBkZWZhdWx0LiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0NST0xMX1RJTUUgPSAyMDtcblxuLyoqXG4gKiBTZXJ2aWNlIGNvbnRhaW5lZCBhbGwgcmVnaXN0ZXJlZCBTY3JvbGxhYmxlIHJlZmVyZW5jZXMgYW5kIGVtaXRzIGFuIGV2ZW50IHdoZW4gYW55IG9uZSBvZiB0aGVcbiAqIFNjcm9sbGFibGUgcmVmZXJlbmNlcyBlbWl0IGEgc2Nyb2xsZWQgZXZlbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFNjcm9sbERpc3BhdGNoZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAgICAgICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50PzogYW55KSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBTdWJqZWN0IGZvciBub3RpZnlpbmcgdGhhdCBhIHJlZ2lzdGVyZWQgc2Nyb2xsYWJsZSByZWZlcmVuY2UgZWxlbWVudCBoYXMgYmVlbiBzY3JvbGxlZC4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsZWQgPSBuZXcgU3ViamVjdDxDZGtTY3JvbGxhYmxlfHZvaWQ+KCk7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBnbG9iYWwgYHNjcm9sbGAgYW5kIGByZXNpemVgIHN1YnNjcmlwdGlvbnMuICovXG4gIF9nbG9iYWxTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgYW1vdW50IG9mIHN1YnNjcmlwdGlvbnMgdG8gYHNjcm9sbGVkYC4gVXNlZCBmb3IgY2xlYW5pbmcgdXAgYWZ0ZXJ3YXJkcy4gKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsZWRDb3VudCA9IDA7XG5cbiAgLyoqXG4gICAqIE1hcCBvZiBhbGwgdGhlIHNjcm9sbGFibGUgcmVmZXJlbmNlcyB0aGF0IGFyZSByZWdpc3RlcmVkIHdpdGggdGhlIHNlcnZpY2UgYW5kIHRoZWlyXG4gICAqIHNjcm9sbCBldmVudCBzdWJzY3JpcHRpb25zLlxuICAgKi9cbiAgc2Nyb2xsQ29udGFpbmVyczogTWFwPENka1Njcm9sbGFibGUsIFN1YnNjcmlwdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIHNjcm9sbGFibGUgaW5zdGFuY2Ugd2l0aCB0aGUgc2VydmljZSBhbmQgbGlzdGVucyBmb3IgaXRzIHNjcm9sbGVkIGV2ZW50cy4gV2hlbiB0aGVcbiAgICogc2Nyb2xsYWJsZSBpcyBzY3JvbGxlZCwgdGhlIHNlcnZpY2UgZW1pdHMgdGhlIGV2ZW50IHRvIGl0cyBzY3JvbGxlZCBvYnNlcnZhYmxlLlxuICAgKiBAcGFyYW0gc2Nyb2xsYWJsZSBTY3JvbGxhYmxlIGluc3RhbmNlIHRvIGJlIHJlZ2lzdGVyZWQuXG4gICAqL1xuICByZWdpc3RlcihzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnNjcm9sbENvbnRhaW5lcnMuaGFzKHNjcm9sbGFibGUpKSB7XG4gICAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuc2V0KHNjcm9sbGFibGUsIHNjcm9sbGFibGUuZWxlbWVudFNjcm9sbGVkKClcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3Njcm9sbGVkLm5leHQoc2Nyb2xsYWJsZSkpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVyZWdpc3RlcnMgYSBTY3JvbGxhYmxlIHJlZmVyZW5jZSBhbmQgdW5zdWJzY3JpYmVzIGZyb20gaXRzIHNjcm9sbCBldmVudCBvYnNlcnZhYmxlLlxuICAgKiBAcGFyYW0gc2Nyb2xsYWJsZSBTY3JvbGxhYmxlIGluc3RhbmNlIHRvIGJlIGRlcmVnaXN0ZXJlZC5cbiAgICovXG4gIGRlcmVnaXN0ZXIoc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSk6IHZvaWQge1xuICAgIGNvbnN0IHNjcm9sbGFibGVSZWZlcmVuY2UgPSB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZ2V0KHNjcm9sbGFibGUpO1xuXG4gICAgaWYgKHNjcm9sbGFibGVSZWZlcmVuY2UpIHtcbiAgICAgIHNjcm9sbGFibGVSZWZlcmVuY2UudW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuc2Nyb2xsQ29udGFpbmVycy5kZWxldGUoc2Nyb2xsYWJsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIGFuIGV2ZW50IHdoZW5ldmVyIGFueSBvZiB0aGUgcmVnaXN0ZXJlZCBTY3JvbGxhYmxlXG4gICAqIHJlZmVyZW5jZXMgKG9yIHdpbmRvdywgZG9jdW1lbnQsIG9yIGJvZHkpIGZpcmUgYSBzY3JvbGxlZCBldmVudC4gQ2FuIHByb3ZpZGUgYSB0aW1lIGluIG1zXG4gICAqIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IFwidGhyb3R0bGVcIiB0aW1lLlxuICAgKlxuICAgKiAqKk5vdGU6KiogaW4gb3JkZXIgdG8gYXZvaWQgaGl0dGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGZvciBldmVyeSBzY3JvbGwgZXZlbnQsXG4gICAqIGFsbCBvZiB0aGUgZXZlbnRzIGVtaXR0ZWQgZnJvbSB0aGlzIHN0cmVhbSB3aWxsIGJlIHJ1biBvdXRzaWRlIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqIElmIHlvdSBuZWVkIHRvIHVwZGF0ZSBhbnkgZGF0YSBiaW5kaW5ncyBhcyBhIHJlc3VsdCBvZiBhIHNjcm9sbCBldmVudCwgeW91IGhhdmVcbiAgICogdG8gcnVuIHRoZSBjYWxsYmFjayB1c2luZyBgTmdab25lLnJ1bmAuXG4gICAqL1xuICBzY3JvbGxlZChhdWRpdFRpbWVJbk1zOiBudW1iZXIgPSBERUZBVUxUX1NDUk9MTF9USU1FKTogT2JzZXJ2YWJsZTxDZGtTY3JvbGxhYmxlfHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZjx2b2lkPigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPENka1Njcm9sbGFibGV8dm9pZD4pID0+IHtcbiAgICAgIGlmICghdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuX2FkZEdsb2JhbExpc3RlbmVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIHRoZSBjYXNlIG9mIGEgMG1zIGRlbGF5LCB1c2UgYW4gb2JzZXJ2YWJsZSB3aXRob3V0IGF1ZGl0VGltZVxuICAgICAgLy8gc2luY2UgaXQgZG9lcyBhZGQgYSBwZXJjZXB0aWJsZSBkZWxheSBpbiBwcm9jZXNzaW5nIG92ZXJoZWFkLlxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gYXVkaXRUaW1lSW5NcyA+IDAgP1xuICAgICAgICB0aGlzLl9zY3JvbGxlZC5waXBlKGF1ZGl0VGltZShhdWRpdFRpbWVJbk1zKSkuc3Vic2NyaWJlKG9ic2VydmVyKSA6XG4gICAgICAgIHRoaXMuX3Njcm9sbGVkLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgIHRoaXMuX3Njcm9sbGVkQ291bnQrKztcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbGVkQ291bnQtLTtcblxuICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbGVkQ291bnQpIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVHbG9iYWxMaXN0ZW5lcigpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcmVtb3ZlR2xvYmFsTGlzdGVuZXIoKTtcbiAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZm9yRWFjaCgoXywgY29udGFpbmVyKSA9PiB0aGlzLmRlcmVnaXN0ZXIoY29udGFpbmVyKSk7XG4gICAgdGhpcy5fc2Nyb2xsZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuZXZlciBhbnkgb2YgdGhlXG4gICAqIHNjcm9sbGFibGUgYW5jZXN0b3JzIG9mIGFuIGVsZW1lbnQgYXJlIHNjcm9sbGVkLlxuICAgKiBAcGFyYW0gZWxlbWVudFJlZiBFbGVtZW50IHdob3NlIGFuY2VzdG9ycyB0byBsaXN0ZW4gZm9yLlxuICAgKiBAcGFyYW0gYXVkaXRUaW1lSW5NcyBUaW1lIHRvIHRocm90dGxlIHRoZSBzY3JvbGwgZXZlbnRzLlxuICAgKi9cbiAgYW5jZXN0b3JTY3JvbGxlZChlbGVtZW50UmVmOiBFbGVtZW50UmVmLCBhdWRpdFRpbWVJbk1zPzogbnVtYmVyKTogT2JzZXJ2YWJsZTxDZGtTY3JvbGxhYmxlfHZvaWQ+IHtcbiAgICBjb25zdCBhbmNlc3RvcnMgPSB0aGlzLmdldEFuY2VzdG9yU2Nyb2xsQ29udGFpbmVycyhlbGVtZW50UmVmKTtcblxuICAgIHJldHVybiB0aGlzLnNjcm9sbGVkKGF1ZGl0VGltZUluTXMpLnBpcGUoZmlsdGVyKHRhcmdldCA9PiB7XG4gICAgICByZXR1cm4gIXRhcmdldCB8fCBhbmNlc3RvcnMuaW5kZXhPZih0YXJnZXQpID4gLTE7XG4gICAgfSkpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYWxsIHJlZ2lzdGVyZWQgU2Nyb2xsYWJsZXMgdGhhdCBjb250YWluIHRoZSBwcm92aWRlZCBlbGVtZW50LiAqL1xuICBnZXRBbmNlc3RvclNjcm9sbENvbnRhaW5lcnMoZWxlbWVudFJlZjogRWxlbWVudFJlZik6IENka1Njcm9sbGFibGVbXSB7XG4gICAgY29uc3Qgc2Nyb2xsaW5nQ29udGFpbmVyczogQ2RrU2Nyb2xsYWJsZVtdID0gW107XG5cbiAgICB0aGlzLnNjcm9sbENvbnRhaW5lcnMuZm9yRWFjaCgoX3N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uLCBzY3JvbGxhYmxlOiBDZGtTY3JvbGxhYmxlKSA9PiB7XG4gICAgICBpZiAodGhpcy5fc2Nyb2xsYWJsZUNvbnRhaW5zRWxlbWVudChzY3JvbGxhYmxlLCBlbGVtZW50UmVmKSkge1xuICAgICAgICBzY3JvbGxpbmdDb250YWluZXJzLnB1c2goc2Nyb2xsYWJsZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2Nyb2xsaW5nQ29udGFpbmVycztcbiAgfVxuXG4gIC8qKiBBY2Nlc3MgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCBkb2N1bWVudCByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIGNvbnN0IGRvYyA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICAvKiogUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIHByb3ZpZGVkIFNjcm9sbGFibGUuICovXG4gIHByaXZhdGUgX3Njcm9sbGFibGVDb250YWluc0VsZW1lbnQoc2Nyb2xsYWJsZTogQ2RrU2Nyb2xsYWJsZSwgZWxlbWVudFJlZjogRWxlbWVudFJlZik6IGJvb2xlYW4ge1xuICAgIGxldCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgbGV0IHNjcm9sbGFibGVFbGVtZW50ID0gc2Nyb2xsYWJsZS5nZXRFbGVtZW50UmVmKCkubmF0aXZlRWxlbWVudDtcblxuICAgIC8vIFRyYXZlcnNlIHRocm91Z2ggdGhlIGVsZW1lbnQgcGFyZW50cyB1bnRpbCB3ZSByZWFjaCBudWxsLCBjaGVja2luZyBpZiBhbnkgb2YgdGhlIGVsZW1lbnRzXG4gICAgLy8gYXJlIHRoZSBzY3JvbGxhYmxlJ3MgZWxlbWVudC5cbiAgICBkbyB7XG4gICAgICBpZiAoZWxlbWVudCA9PSBzY3JvbGxhYmxlRWxlbWVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIH0gd2hpbGUgKGVsZW1lbnQgPSBlbGVtZW50IS5wYXJlbnRFbGVtZW50KTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKiBTZXRzIHVwIHRoZSBnbG9iYWwgc2Nyb2xsIGxpc3RlbmVycy4gKi9cbiAgcHJpdmF0ZSBfYWRkR2xvYmFsTGlzdGVuZXIoKSB7XG4gICAgdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uID0gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuICAgICAgcmV0dXJuIGZyb21FdmVudCh3aW5kb3cuZG9jdW1lbnQsICdzY3JvbGwnKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2Nyb2xsZWQubmV4dCgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgdGhlIGdsb2JhbCBzY3JvbGwgbGlzdGVuZXIuICovXG4gIHByaXZhdGUgX3JlbW92ZUdsb2JhbExpc3RlbmVyKCkge1xuICAgIGlmICh0aGlzLl9nbG9iYWxTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2dsb2JhbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fZ2xvYmFsU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==