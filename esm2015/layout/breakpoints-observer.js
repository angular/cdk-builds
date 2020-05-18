/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/layout/breakpoints-observer.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone } from '@angular/core';
import { MediaMatcher } from './media-matcher';
import { combineLatest, concat, Observable, Subject } from 'rxjs';
import { debounceTime, map, skip, startWith, take, takeUntil } from 'rxjs/operators';
import { coerceArray } from '@angular/cdk/coercion';
import * as i0 from "@angular/core";
import * as i1 from "./media-matcher";
/**
 * The current state of a layout breakpoint.
 * @record
 */
export function BreakpointState() { }
if (false) {
    /**
     * Whether the breakpoint is currently matching.
     * @type {?}
     */
    BreakpointState.prototype.matches;
    /**
     * A key boolean pair for each query provided to the observe method,
     * with its current matched state.
     * @type {?}
     */
    BreakpointState.prototype.breakpoints;
}
/**
 * The current state of a layout breakpoint.
 * @record
 */
function InternalBreakpointState() { }
if (false) {
    /**
     * Whether the breakpoint is currently matching.
     * @type {?}
     */
    InternalBreakpointState.prototype.matches;
    /**
     * The media query being to be matched
     * @type {?}
     */
    InternalBreakpointState.prototype.query;
}
/**
 * @record
 */
function Query() { }
if (false) {
    /** @type {?} */
    Query.prototype.observable;
    /** @type {?} */
    Query.prototype.mql;
}
/**
 * Utility for checking the matching state of \@media queries.
 */
let BreakpointObserver = /** @class */ (() => {
    /**
     * Utility for checking the matching state of \@media queries.
     */
    class BreakpointObserver {
        /**
         * @param {?} _mediaMatcher
         * @param {?} _zone
         */
        constructor(_mediaMatcher, _zone) {
            this._mediaMatcher = _mediaMatcher;
            this._zone = _zone;
            /**
             * A map of all media queries currently being listened for.
             */
            this._queries = new Map();
            /**
             * A subject for all other observables to takeUntil based on.
             */
            this._destroySubject = new Subject();
        }
        /**
         * Completes the active subject, signalling to all other observables to complete.
         * @return {?}
         */
        ngOnDestroy() {
            this._destroySubject.next();
            this._destroySubject.complete();
        }
        /**
         * Whether one or more media queries match the current viewport size.
         * @param {?} value One or more media queries to check.
         * @return {?} Whether any of the media queries match.
         */
        isMatched(value) {
            /** @type {?} */
            const queries = splitQueries(coerceArray(value));
            return queries.some((/**
             * @param {?} mediaQuery
             * @return {?}
             */
            mediaQuery => this._registerQuery(mediaQuery).mql.matches));
        }
        /**
         * Gets an observable of results for the given queries that will emit new results for any changes
         * in matching of the given queries.
         * @param {?} value One or more media queries to check.
         * @return {?} A stream of matches for the given queries.
         */
        observe(value) {
            /** @type {?} */
            const queries = splitQueries(coerceArray(value));
            /** @type {?} */
            const observables = queries.map((/**
             * @param {?} query
             * @return {?}
             */
            query => this._registerQuery(query).observable));
            /** @type {?} */
            let stateObservable = combineLatest(observables);
            // Emit the first state immediately, and then debounce the subsequent emissions.
            stateObservable = concat(stateObservable.pipe(take(1)), stateObservable.pipe(skip(1), debounceTime(0)));
            return stateObservable.pipe(map((/**
             * @param {?} breakpointStates
             * @return {?}
             */
            (breakpointStates) => {
                /** @type {?} */
                const response = {
                    matches: false,
                    breakpoints: {},
                };
                breakpointStates.forEach((/**
                 * @param {?} state
                 * @return {?}
                 */
                (state) => {
                    response.matches = response.matches || state.matches;
                    response.breakpoints[state.query] = state.matches;
                }));
                return response;
            })));
        }
        /**
         * Registers a specific query to be listened for.
         * @private
         * @param {?} query
         * @return {?}
         */
        _registerQuery(query) {
            // Only set up a new MediaQueryList if it is not already being listened for.
            if (this._queries.has(query)) {
                return (/** @type {?} */ (this._queries.get(query)));
            }
            /** @type {?} */
            const mql = this._mediaMatcher.matchMedia(query);
            // Create callback for match changes and add it is as a listener.
            /** @type {?} */
            const queryObservable = new Observable((/**
             * @param {?} observer
             * @return {?}
             */
            (observer) => {
                // Listener callback methods are wrapped to be placed back in ngZone. Callbacks must be placed
                // back into the zone because matchMedia is only included in Zone.js by loading the
                // webapis-media-query.js file alongside the zone.js file.  Additionally, some browsers do not
                // have MediaQueryList inherit from EventTarget, which causes inconsistencies in how Zone.js
                // patches it.
                /** @type {?} */
                const handler = (/**
                 * @param {?} e
                 * @return {?}
                 */
                (e) => this._zone.run((/**
                 * @return {?}
                 */
                () => observer.next(e))));
                mql.addListener(handler);
                return (/**
                 * @return {?}
                 */
                () => {
                    mql.removeListener(handler);
                });
            })).pipe(startWith(mql), map((/**
             * @param {?} nextMql
             * @return {?}
             */
            (nextMql) => ({ query, matches: nextMql.matches }))), takeUntil(this._destroySubject));
            // Add the MediaQueryList to the set of queries.
            /** @type {?} */
            const output = { observable: queryObservable, mql };
            this._queries.set(query, output);
            return output;
        }
    }
    BreakpointObserver.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    BreakpointObserver.ctorParameters = () => [
        { type: MediaMatcher },
        { type: NgZone }
    ];
    /** @nocollapse */ BreakpointObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function BreakpointObserver_Factory() { return new BreakpointObserver(i0.ɵɵinject(i1.MediaMatcher), i0.ɵɵinject(i0.NgZone)); }, token: BreakpointObserver, providedIn: "root" });
    return BreakpointObserver;
})();
export { BreakpointObserver };
if (false) {
    /**
     * A map of all media queries currently being listened for.
     * @type {?}
     * @private
     */
    BreakpointObserver.prototype._queries;
    /**
     * A subject for all other observables to takeUntil based on.
     * @type {?}
     * @private
     */
    BreakpointObserver.prototype._destroySubject;
    /**
     * @type {?}
     * @private
     */
    BreakpointObserver.prototype._mediaMatcher;
    /**
     * @type {?}
     * @private
     */
    BreakpointObserver.prototype._zone;
}
/**
 * Split each query string into separate query strings if two queries are provided as comma
 * separated.
 * @param {?} queries
 * @return {?}
 */
function splitQueries(queries) {
    return queries.map((/**
     * @param {?} query
     * @return {?}
     */
    (query) => query.split(',')))
        .reduce((/**
     * @param {?} a1
     * @param {?} a2
     * @return {?}
     */
    (a1, a2) => a1.concat(a2)))
        .map((/**
     * @param {?} query
     * @return {?}
     */
    query => query.trim()));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludHMtb2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2xheW91dC9icmVha3BvaW50cy1vYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNuRixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7QUFJbEQscUNBVUM7Ozs7OztJQVJDLGtDQUFpQjs7Ozs7O0lBS2pCLHNDQUVFOzs7Ozs7QUFJSixzQ0FLQzs7Ozs7O0lBSEMsMENBQWlCOzs7OztJQUVqQix3Q0FBYzs7Ozs7QUFHaEIsb0JBR0M7OztJQUZDLDJCQUFnRDs7SUFDaEQsb0JBQW9COzs7OztBQUl0Qjs7OztJQUFBLE1BQ2Esa0JBQWtCOzs7OztRQU03QixZQUFvQixhQUEyQixFQUFVLEtBQWE7WUFBbEQsa0JBQWEsR0FBYixhQUFhLENBQWM7WUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFROzs7O1lBSjlELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQzs7OztZQUVwQyxvQkFBZSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFFMkIsQ0FBQzs7Ozs7UUFHMUUsV0FBVztZQUNULElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxR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VUFBVSxFQUFFLGVBQWUsRUFBRSxHQUFHLEVBQUM7WUFDakQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7OztnQkFyRkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnQkFqQ3hCLFlBQVk7Z0JBREEsTUFBTTs7OzZCQVIxQjtLQWdJQztTQXJGWSxrQkFBa0I7Ozs7Ozs7SUFFN0Isc0NBQTRDOzs7Ozs7SUFFNUMsNkNBQThDOzs7OztJQUVsQywyQ0FBbUM7Ozs7O0lBQUUsbUNBQXFCOzs7Ozs7OztBQXFGeEUsU0FBUyxZQUFZLENBQUMsT0FBaUI7SUFDckMsT0FBTyxPQUFPLENBQUMsR0FBRzs7OztJQUFDLENBQUMsS0FBYSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFDO1NBQ3hDLE1BQU07Ozs7O0lBQUMsQ0FBQyxFQUFZLEVBQUUsRUFBWSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFDO1NBQ3JELEdBQUc7Ozs7SUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBQyxDQUFDO0FBQzVDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBOZ1pvbmUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge01lZGlhTWF0Y2hlcn0gZnJvbSAnLi9tZWRpYS1tYXRjaGVyJztcbmltcG9ydCB7Y29tYmluZUxhdGVzdCwgY29uY2F0LCBPYnNlcnZhYmxlLCBTdWJqZWN0LCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2RlYm91bmNlVGltZSwgbWFwLCBza2lwLCBzdGFydFdpdGgsIHRha2UsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtjb2VyY2VBcnJheX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuXG4vKiogVGhlIGN1cnJlbnQgc3RhdGUgb2YgYSBsYXlvdXQgYnJlYWtwb2ludC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQnJlYWtwb2ludFN0YXRlIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGJyZWFrcG9pbnQgaXMgY3VycmVudGx5IG1hdGNoaW5nLiAqL1xuICBtYXRjaGVzOiBib29sZWFuO1xuICAvKipcbiAgICogQSBrZXkgYm9vbGVhbiBwYWlyIGZvciBlYWNoIHF1ZXJ5IHByb3ZpZGVkIHRvIHRoZSBvYnNlcnZlIG1ldGhvZCxcbiAgICogd2l0aCBpdHMgY3VycmVudCBtYXRjaGVkIHN0YXRlLlxuICAgKi9cbiAgYnJlYWtwb2ludHM6IHtcbiAgICBba2V5OiBzdHJpbmddOiBib29sZWFuO1xuICB9O1xufVxuXG4vKiogVGhlIGN1cnJlbnQgc3RhdGUgb2YgYSBsYXlvdXQgYnJlYWtwb2ludC4gKi9cbmludGVyZmFjZSBJbnRlcm5hbEJyZWFrcG9pbnRTdGF0ZSB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicmVha3BvaW50IGlzIGN1cnJlbnRseSBtYXRjaGluZy4gKi9cbiAgbWF0Y2hlczogYm9vbGVhbjtcbiAgLyoqIFRoZSBtZWRpYSBxdWVyeSBiZWluZyB0byBiZSBtYXRjaGVkICovXG4gIHF1ZXJ5OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBRdWVyeSB7XG4gIG9ic2VydmFibGU6IE9ic2VydmFibGU8SW50ZXJuYWxCcmVha3BvaW50U3RhdGU+O1xuICBtcWw6IE1lZGlhUXVlcnlMaXN0O1xufVxuXG4vKiogVXRpbGl0eSBmb3IgY2hlY2tpbmcgdGhlIG1hdGNoaW5nIHN0YXRlIG9mIEBtZWRpYSBxdWVyaWVzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQnJlYWtwb2ludE9ic2VydmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqICBBIG1hcCBvZiBhbGwgbWVkaWEgcXVlcmllcyBjdXJyZW50bHkgYmVpbmcgbGlzdGVuZWQgZm9yLiAqL1xuICBwcml2YXRlIF9xdWVyaWVzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5PigpO1xuICAvKiogQSBzdWJqZWN0IGZvciBhbGwgb3RoZXIgb2JzZXJ2YWJsZXMgdG8gdGFrZVVudGlsIGJhc2VkIG9uLiAqL1xuICBwcml2YXRlIF9kZXN0cm95U3ViamVjdCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbWVkaWFNYXRjaGVyOiBNZWRpYU1hdGNoZXIsIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge31cblxuICAvKiogQ29tcGxldGVzIHRoZSBhY3RpdmUgc3ViamVjdCwgc2lnbmFsbGluZyB0byBhbGwgb3RoZXIgb2JzZXJ2YWJsZXMgdG8gY29tcGxldGUuICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3lTdWJqZWN0Lm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95U3ViamVjdC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb25lIG9yIG1vcmUgbWVkaWEgcXVlcmllcyBtYXRjaCB0aGUgY3VycmVudCB2aWV3cG9ydCBzaXplLlxuICAgKiBAcGFyYW0gdmFsdWUgT25lIG9yIG1vcmUgbWVkaWEgcXVlcmllcyB0byBjaGVjay5cbiAgICogQHJldHVybnMgV2hldGhlciBhbnkgb2YgdGhlIG1lZGlhIHF1ZXJpZXMgbWF0Y2guXG4gICAqL1xuICBpc01hdGNoZWQodmFsdWU6IHN0cmluZyB8IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcXVlcmllcyA9IHNwbGl0UXVlcmllcyhjb2VyY2VBcnJheSh2YWx1ZSkpO1xuICAgIHJldHVybiBxdWVyaWVzLnNvbWUobWVkaWFRdWVyeSA9PiB0aGlzLl9yZWdpc3RlclF1ZXJ5KG1lZGlhUXVlcnkpLm1xbC5tYXRjaGVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIG9ic2VydmFibGUgb2YgcmVzdWx0cyBmb3IgdGhlIGdpdmVuIHF1ZXJpZXMgdGhhdCB3aWxsIGVtaXQgbmV3IHJlc3VsdHMgZm9yIGFueSBjaGFuZ2VzXG4gICAqIGluIG1hdGNoaW5nIG9mIHRoZSBnaXZlbiBxdWVyaWVzLlxuICAgKiBAcGFyYW0gdmFsdWUgT25lIG9yIG1vcmUgbWVkaWEgcXVlcmllcyB0byBjaGVjay5cbiAgICogQHJldHVybnMgQSBzdHJlYW0gb2YgbWF0Y2hlcyBmb3IgdGhlIGdpdmVuIHF1ZXJpZXMuXG4gICAqL1xuICBvYnNlcnZlKHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSk6IE9ic2VydmFibGU8QnJlYWtwb2ludFN0YXRlPiB7XG4gICAgY29uc3QgcXVlcmllcyA9IHNwbGl0UXVlcmllcyhjb2VyY2VBcnJheSh2YWx1ZSkpO1xuICAgIGNvbnN0IG9ic2VydmFibGVzID0gcXVlcmllcy5tYXAocXVlcnkgPT4gdGhpcy5fcmVnaXN0ZXJRdWVyeShxdWVyeSkub2JzZXJ2YWJsZSk7XG5cbiAgICBsZXQgc3RhdGVPYnNlcnZhYmxlID0gY29tYmluZUxhdGVzdChvYnNlcnZhYmxlcyk7XG4gICAgLy8gRW1pdCB0aGUgZmlyc3Qgc3RhdGUgaW1tZWRpYXRlbHksIGFuZCB0aGVuIGRlYm91bmNlIHRoZSBzdWJzZXF1ZW50IGVtaXNzaW9ucy5cbiAgICBzdGF0ZU9ic2VydmFibGUgPSBjb25jYXQoXG4gICAgICBzdGF0ZU9ic2VydmFibGUucGlwZSh0YWtlKDEpKSxcbiAgICAgIHN0YXRlT2JzZXJ2YWJsZS5waXBlKHNraXAoMSksIGRlYm91bmNlVGltZSgwKSkpO1xuICAgIHJldHVybiBzdGF0ZU9ic2VydmFibGUucGlwZShtYXAoKGJyZWFrcG9pbnRTdGF0ZXM6IEludGVybmFsQnJlYWtwb2ludFN0YXRlW10pID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBCcmVha3BvaW50U3RhdGUgPSB7XG4gICAgICAgIG1hdGNoZXM6IGZhbHNlLFxuICAgICAgICBicmVha3BvaW50czoge30sXG4gICAgICB9O1xuICAgICAgYnJlYWtwb2ludFN0YXRlcy5mb3JFYWNoKChzdGF0ZTogSW50ZXJuYWxCcmVha3BvaW50U3RhdGUpID0+IHtcbiAgICAgICAgcmVzcG9uc2UubWF0Y2hlcyA9IHJlc3BvbnNlLm1hdGNoZXMgfHwgc3RhdGUubWF0Y2hlcztcbiAgICAgICAgcmVzcG9uc2UuYnJlYWtwb2ludHNbc3RhdGUucXVlcnldID0gc3RhdGUubWF0Y2hlcztcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0pKTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBzcGVjaWZpYyBxdWVyeSB0byBiZSBsaXN0ZW5lZCBmb3IuICovXG4gIHByaXZhdGUgX3JlZ2lzdGVyUXVlcnkocXVlcnk6IHN0cmluZyk6IFF1ZXJ5IHtcbiAgICAvLyBPbmx5IHNldCB1cCBhIG5ldyBNZWRpYVF1ZXJ5TGlzdCBpZiBpdCBpcyBub3QgYWxyZWFkeSBiZWluZyBsaXN0ZW5lZCBmb3IuXG4gICAgaWYgKHRoaXMuX3F1ZXJpZXMuaGFzKHF1ZXJ5KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3F1ZXJpZXMuZ2V0KHF1ZXJ5KSE7XG4gICAgfVxuXG4gICAgY29uc3QgbXFsOiBNZWRpYVF1ZXJ5TGlzdCA9IHRoaXMuX21lZGlhTWF0Y2hlci5tYXRjaE1lZGlhKHF1ZXJ5KTtcblxuICAgIC8vIENyZWF0ZSBjYWxsYmFjayBmb3IgbWF0Y2ggY2hhbmdlcyBhbmQgYWRkIGl0IGlzIGFzIGEgbGlzdGVuZXIuXG4gICAgY29uc3QgcXVlcnlPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGU8TWVkaWFRdWVyeUxpc3Q+KChvYnNlcnZlcjogT2JzZXJ2ZXI8TWVkaWFRdWVyeUxpc3Q+KSA9PiB7XG4gICAgICAvLyBMaXN0ZW5lciBjYWxsYmFjayBtZXRob2RzIGFyZSB3cmFwcGVkIHRvIGJlIHBsYWNlZCBiYWNrIGluIG5nWm9uZS4gQ2FsbGJhY2tzIG11c3QgYmUgcGxhY2VkXG4gICAgICAvLyBiYWNrIGludG8gdGhlIHpvbmUgYmVjYXVzZSBtYXRjaE1lZGlhIGlzIG9ubHkgaW5jbHVkZWQgaW4gWm9uZS5qcyBieSBsb2FkaW5nIHRoZVxuICAgICAgLy8gd2ViYXBpcy1tZWRpYS1xdWVyeS5qcyBmaWxlIGFsb25nc2lkZSB0aGUgem9uZS5qcyBmaWxlLiAgQWRkaXRpb25hbGx5LCBzb21lIGJyb3dzZXJzIGRvIG5vdFxuICAgICAgLy8gaGF2ZSBNZWRpYVF1ZXJ5TGlzdCBpbmhlcml0IGZyb20gRXZlbnRUYXJnZXQsIHdoaWNoIGNhdXNlcyBpbmNvbnNpc3RlbmNpZXMgaW4gaG93IFpvbmUuanNcbiAgICAgIC8vIHBhdGNoZXMgaXQuXG4gICAgICBjb25zdCBoYW5kbGVyID0gKGU6IGFueSkgPT4gdGhpcy5fem9uZS5ydW4oKCkgPT4gb2JzZXJ2ZXIubmV4dChlKSk7XG4gICAgICBtcWwuYWRkTGlzdGVuZXIoaGFuZGxlcik7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIG1xbC5yZW1vdmVMaXN0ZW5lcihoYW5kbGVyKTtcbiAgICAgIH07XG4gICAgfSkucGlwZShcbiAgICAgIHN0YXJ0V2l0aChtcWwpLFxuICAgICAgbWFwKChuZXh0TXFsOiBNZWRpYVF1ZXJ5TGlzdCkgPT4gKHtxdWVyeSwgbWF0Y2hlczogbmV4dE1xbC5tYXRjaGVzfSkpLFxuICAgICAgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3lTdWJqZWN0KVxuICAgICk7XG5cbiAgICAvLyBBZGQgdGhlIE1lZGlhUXVlcnlMaXN0IHRvIHRoZSBzZXQgb2YgcXVlcmllcy5cbiAgICBjb25zdCBvdXRwdXQgPSB7b2JzZXJ2YWJsZTogcXVlcnlPYnNlcnZhYmxlLCBtcWx9O1xuICAgIHRoaXMuX3F1ZXJpZXMuc2V0KHF1ZXJ5LCBvdXRwdXQpO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTcGxpdCBlYWNoIHF1ZXJ5IHN0cmluZyBpbnRvIHNlcGFyYXRlIHF1ZXJ5IHN0cmluZ3MgaWYgdHdvIHF1ZXJpZXMgYXJlIHByb3ZpZGVkIGFzIGNvbW1hXG4gKiBzZXBhcmF0ZWQuXG4gKi9cbmZ1bmN0aW9uIHNwbGl0UXVlcmllcyhxdWVyaWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIHF1ZXJpZXMubWFwKChxdWVyeTogc3RyaW5nKSA9PiBxdWVyeS5zcGxpdCgnLCcpKVxuICAgICAgICAgICAgICAgIC5yZWR1Y2UoKGExOiBzdHJpbmdbXSwgYTI6IHN0cmluZ1tdKSA9PiBhMS5jb25jYXQoYTIpKVxuICAgICAgICAgICAgICAgIC5tYXAocXVlcnkgPT4gcXVlcnkudHJpbSgpKTtcbn1cbiJdfQ==