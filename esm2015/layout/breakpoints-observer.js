import { __decorate, __metadata } from "tslib";
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
/** Utility for checking the matching state of @media queries. */
let BreakpointObserver = /** @class */ (() => {
    let BreakpointObserver = class BreakpointObserver {
        constructor(_mediaMatcher, _zone) {
            this._mediaMatcher = _mediaMatcher;
            this._zone = _zone;
            /**  A map of all media queries currently being listened for. */
            this._queries = new Map();
            /** A subject for all other observables to takeUntil based on. */
            this._destroySubject = new Subject();
        }
        /** Completes the active subject, signalling to all other observables to complete. */
        ngOnDestroy() {
            this._destroySubject.next();
            this._destroySubject.complete();
        }
        /**
         * Whether one or more media queries match the current viewport size.
         * @param value One or more media queries to check.
         * @returns Whether any of the media queries match.
         */
        isMatched(value) {
            const queries = splitQueries(coerceArray(value));
            return queries.some(mediaQuery => this._registerQuery(mediaQuery).mql.matches);
        }
        /**
         * Gets an observable of results for the given queries that will emit new results for any changes
         * in matching of the given queries.
         * @param value One or more media queries to check.
         * @returns A stream of matches for the given queries.
         */
        observe(value) {
            const queries = splitQueries(coerceArray(value));
            const observables = queries.map(query => this._registerQuery(query).observable);
            let stateObservable = combineLatest(observables);
            // Emit the first state immediately, and then debounce the subsequent emissions.
            stateObservable = concat(stateObservable.pipe(take(1)), stateObservable.pipe(skip(1), debounceTime(0)));
            return stateObservable.pipe(map((breakpointStates) => {
                const response = {
                    matches: false,
                    breakpoints: {},
                };
                breakpointStates.forEach((state) => {
                    response.matches = response.matches || state.matches;
                    response.breakpoints[state.query] = state.matches;
                });
                return response;
            }));
        }
        /** Registers a specific query to be listened for. */
        _registerQuery(query) {
            // Only set up a new MediaQueryList if it is not already being listened for.
            if (this._queries.has(query)) {
                return this._queries.get(query);
            }
            const mql = this._mediaMatcher.matchMedia(query);
            // Create callback for match changes and add it is as a listener.
            const queryObservable = new Observable((observer) => {
                // Listener callback methods are wrapped to be placed back in ngZone. Callbacks must be placed
                // back into the zone because matchMedia is only included in Zone.js by loading the
                // webapis-media-query.js file alongside the zone.js file.  Additionally, some browsers do not
                // have MediaQueryList inherit from EventTarget, which causes inconsistencies in how Zone.js
                // patches it.
                const handler = (e) => this._zone.run(() => observer.next(e));
                mql.addListener(handler);
                return () => {
                    mql.removeListener(handler);
                };
            }).pipe(startWith(mql), map((nextMql) => ({ query, matches: nextMql.matches })), takeUntil(this._destroySubject));
            // Add the MediaQueryList to the set of queries.
            const output = { observable: queryObservable, mql };
            this._queries.set(query, output);
            return output;
        }
    };
    BreakpointObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function BreakpointObserver_Factory() { return new BreakpointObserver(i0.ɵɵinject(i1.MediaMatcher), i0.ɵɵinject(i0.NgZone)); }, token: BreakpointObserver, providedIn: "root" });
    BreakpointObserver = __decorate([
        Injectable({ providedIn: 'root' }),
        __metadata("design:paramtypes", [MediaMatcher, NgZone])
    ], BreakpointObserver);
    return BreakpointObserver;
})();
export { BreakpointObserver };
/**
 * Split each query string into separate query strings if two queries are provided as comma
 * separated.
 */
function splitQueries(queries) {
    return queries.map((query) => query.split(','))
        .reduce((a1, a2) => a1.concat(a2))
        .map(query => query.trim());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludHMtb2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2xheW91dC9icmVha3BvaW50cy1vYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxhQUFhLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDMUUsT0FBTyxFQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkYsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7QUE2QmxELGlFQUFpRTtBQUVqRTtJQUFBLElBQWEsa0JBQWtCLEdBQS9CLE1BQWEsa0JBQWtCO1FBTTdCLFlBQW9CLGFBQTJCLEVBQVUsS0FBYTtZQUFsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBYztZQUFVLFVBQUssR0FBTCxLQUFLLENBQVE7WUFMdEUsZ0VBQWdFO1lBQ3hELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztZQUM1QyxpRUFBaUU7WUFDekQsb0JBQWUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBRTJCLENBQUM7UUFFMUUscUZBQXFGO1FBQ3JGLFdBQVc7WUFDVCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSCxTQUFTLENBQUMsS0FBd0I7WUFDaEMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILE9BQU8sQ0FBQyxLQUF3QjtZQUM5QixNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFaEYsSUFBSSxlQUFlLEdBQUcsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELGdGQUFnRjtZQUNoRixlQUFlLEdBQUcsTUFBTSxDQUN0QixlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUM3QixlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBMkMsRUFBRSxFQUFFO2dCQUM5RSxNQUFNLFFBQVEsR0FBb0I7b0JBQ2hDLE9BQU8sRUFBRSxLQUFLO29CQUNkLFdBQVcsRUFBRSxFQUFFO2lCQUNoQixDQUFDO2dCQUNGLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQThCLEVBQUUsRUFBRTtvQkFDMUQsUUFBUSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUM7b0JBQ3JELFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ3BELENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sUUFBUSxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBRUQscURBQXFEO1FBQzdDLGNBQWMsQ0FBQyxLQUFhO1lBQ2xDLDRFQUE0RTtZQUM1RSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM1QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBRSxDQUFDO2FBQ2xDO1lBRUQsTUFBTSxHQUFHLEdBQW1CLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWpFLGlFQUFpRTtZQUNqRSxNQUFNLGVBQWUsR0FBRyxJQUFJLFVBQVUsQ0FBaUIsQ0FBQyxRQUFrQyxFQUFFLEVBQUU7Z0JBQzVGLDhGQUE4RjtnQkFDOUYsbUZBQW1GO2dCQUNuRiw4RkFBOEY7Z0JBQzlGLDRGQUE0RjtnQkFDNUYsY0FBYztnQkFDZCxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUV6QixPQUFPLEdBQUcsRUFBRTtvQkFDVixHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ0wsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUNkLEdBQUcsQ0FBQyxDQUFDLE9BQXVCLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDLEVBQ3JFLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQ2hDLENBQUM7WUFFRixnREFBZ0Q7WUFDaEQsTUFBTSxNQUFNLEdBQUcsRUFBQyxVQUFVLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqQyxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO0tBQ0YsQ0FBQTs7SUFyRlksa0JBQWtCO1FBRDlCLFVBQVUsQ0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMsQ0FBQzt5Q0FPSSxZQUFZLEVBQWlCLE1BQU07T0FOM0Qsa0JBQWtCLENBcUY5Qjs2QkFoSUQ7S0FnSUM7U0FyRlksa0JBQWtCO0FBdUYvQjs7O0dBR0c7QUFDSCxTQUFTLFlBQVksQ0FBQyxPQUFpQjtJQUNyQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDeEMsTUFBTSxDQUFDLENBQUMsRUFBWSxFQUFFLEVBQVksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNyRCxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM1QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtNZWRpYU1hdGNoZXJ9IGZyb20gJy4vbWVkaWEtbWF0Y2hlcic7XG5pbXBvcnQge2NvbWJpbmVMYXRlc3QsIGNvbmNhdCwgT2JzZXJ2YWJsZSwgU3ViamVjdCwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkZWJvdW5jZVRpbWUsIG1hcCwgc2tpcCwgc3RhcnRXaXRoLCB0YWtlLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7Y29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5cblxuLyoqIFRoZSBjdXJyZW50IHN0YXRlIG9mIGEgbGF5b3V0IGJyZWFrcG9pbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrcG9pbnRTdGF0ZSB7XG4gIC8qKiBXaGV0aGVyIHRoZSBicmVha3BvaW50IGlzIGN1cnJlbnRseSBtYXRjaGluZy4gKi9cbiAgbWF0Y2hlczogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEEga2V5IGJvb2xlYW4gcGFpciBmb3IgZWFjaCBxdWVyeSBwcm92aWRlZCB0byB0aGUgb2JzZXJ2ZSBtZXRob2QsXG4gICAqIHdpdGggaXRzIGN1cnJlbnQgbWF0Y2hlZCBzdGF0ZS5cbiAgICovXG4gIGJyZWFrcG9pbnRzOiB7XG4gICAgW2tleTogc3RyaW5nXTogYm9vbGVhbjtcbiAgfTtcbn1cblxuLyoqIFRoZSBjdXJyZW50IHN0YXRlIG9mIGEgbGF5b3V0IGJyZWFrcG9pbnQuICovXG5pbnRlcmZhY2UgSW50ZXJuYWxCcmVha3BvaW50U3RhdGUge1xuICAvKiogV2hldGhlciB0aGUgYnJlYWtwb2ludCBpcyBjdXJyZW50bHkgbWF0Y2hpbmcuICovXG4gIG1hdGNoZXM6IGJvb2xlYW47XG4gIC8qKiBUaGUgbWVkaWEgcXVlcnkgYmVpbmcgdG8gYmUgbWF0Y2hlZCAqL1xuICBxdWVyeTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgUXVlcnkge1xuICBvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPEludGVybmFsQnJlYWtwb2ludFN0YXRlPjtcbiAgbXFsOiBNZWRpYVF1ZXJ5TGlzdDtcbn1cblxuLyoqIFV0aWxpdHkgZm9yIGNoZWNraW5nIHRoZSBtYXRjaGluZyBzdGF0ZSBvZiBAbWVkaWEgcXVlcmllcy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEJyZWFrcG9pbnRPYnNlcnZlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiAgQSBtYXAgb2YgYWxsIG1lZGlhIHF1ZXJpZXMgY3VycmVudGx5IGJlaW5nIGxpc3RlbmVkIGZvci4gKi9cbiAgcHJpdmF0ZSBfcXVlcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeT4oKTtcbiAgLyoqIEEgc3ViamVjdCBmb3IgYWxsIG90aGVyIG9ic2VydmFibGVzIHRvIHRha2VVbnRpbCBiYXNlZCBvbi4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveVN1YmplY3QgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX21lZGlhTWF0Y2hlcjogTWVkaWFNYXRjaGVyLCBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHt9XG5cbiAgLyoqIENvbXBsZXRlcyB0aGUgYWN0aXZlIHN1YmplY3QsIHNpZ25hbGxpbmcgdG8gYWxsIG90aGVyIG9ic2VydmFibGVzIHRvIGNvbXBsZXRlLiAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95U3ViamVjdC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveVN1YmplY3QuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9uZSBvciBtb3JlIG1lZGlhIHF1ZXJpZXMgbWF0Y2ggdGhlIGN1cnJlbnQgdmlld3BvcnQgc2l6ZS5cbiAgICogQHBhcmFtIHZhbHVlIE9uZSBvciBtb3JlIG1lZGlhIHF1ZXJpZXMgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgYW55IG9mIHRoZSBtZWRpYSBxdWVyaWVzIG1hdGNoLlxuICAgKi9cbiAgaXNNYXRjaGVkKHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHF1ZXJpZXMgPSBzcGxpdFF1ZXJpZXMoY29lcmNlQXJyYXkodmFsdWUpKTtcbiAgICByZXR1cm4gcXVlcmllcy5zb21lKG1lZGlhUXVlcnkgPT4gdGhpcy5fcmVnaXN0ZXJRdWVyeShtZWRpYVF1ZXJ5KS5tcWwubWF0Y2hlcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiBvYnNlcnZhYmxlIG9mIHJlc3VsdHMgZm9yIHRoZSBnaXZlbiBxdWVyaWVzIHRoYXQgd2lsbCBlbWl0IG5ldyByZXN1bHRzIGZvciBhbnkgY2hhbmdlc1xuICAgKiBpbiBtYXRjaGluZyBvZiB0aGUgZ2l2ZW4gcXVlcmllcy5cbiAgICogQHBhcmFtIHZhbHVlIE9uZSBvciBtb3JlIG1lZGlhIHF1ZXJpZXMgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIEEgc3RyZWFtIG9mIG1hdGNoZXMgZm9yIHRoZSBnaXZlbiBxdWVyaWVzLlxuICAgKi9cbiAgb2JzZXJ2ZSh2YWx1ZTogc3RyaW5nIHwgc3RyaW5nW10pOiBPYnNlcnZhYmxlPEJyZWFrcG9pbnRTdGF0ZT4ge1xuICAgIGNvbnN0IHF1ZXJpZXMgPSBzcGxpdFF1ZXJpZXMoY29lcmNlQXJyYXkodmFsdWUpKTtcbiAgICBjb25zdCBvYnNlcnZhYmxlcyA9IHF1ZXJpZXMubWFwKHF1ZXJ5ID0+IHRoaXMuX3JlZ2lzdGVyUXVlcnkocXVlcnkpLm9ic2VydmFibGUpO1xuXG4gICAgbGV0IHN0YXRlT2JzZXJ2YWJsZSA9IGNvbWJpbmVMYXRlc3Qob2JzZXJ2YWJsZXMpO1xuICAgIC8vIEVtaXQgdGhlIGZpcnN0IHN0YXRlIGltbWVkaWF0ZWx5LCBhbmQgdGhlbiBkZWJvdW5jZSB0aGUgc3Vic2VxdWVudCBlbWlzc2lvbnMuXG4gICAgc3RhdGVPYnNlcnZhYmxlID0gY29uY2F0KFxuICAgICAgc3RhdGVPYnNlcnZhYmxlLnBpcGUodGFrZSgxKSksXG4gICAgICBzdGF0ZU9ic2VydmFibGUucGlwZShza2lwKDEpLCBkZWJvdW5jZVRpbWUoMCkpKTtcbiAgICByZXR1cm4gc3RhdGVPYnNlcnZhYmxlLnBpcGUobWFwKChicmVha3BvaW50U3RhdGVzOiBJbnRlcm5hbEJyZWFrcG9pbnRTdGF0ZVtdKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZTogQnJlYWtwb2ludFN0YXRlID0ge1xuICAgICAgICBtYXRjaGVzOiBmYWxzZSxcbiAgICAgICAgYnJlYWtwb2ludHM6IHt9LFxuICAgICAgfTtcbiAgICAgIGJyZWFrcG9pbnRTdGF0ZXMuZm9yRWFjaCgoc3RhdGU6IEludGVybmFsQnJlYWtwb2ludFN0YXRlKSA9PiB7XG4gICAgICAgIHJlc3BvbnNlLm1hdGNoZXMgPSByZXNwb25zZS5tYXRjaGVzIHx8IHN0YXRlLm1hdGNoZXM7XG4gICAgICAgIHJlc3BvbnNlLmJyZWFrcG9pbnRzW3N0YXRlLnF1ZXJ5XSA9IHN0YXRlLm1hdGNoZXM7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9KSk7XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIGEgc3BlY2lmaWMgcXVlcnkgdG8gYmUgbGlzdGVuZWQgZm9yLiAqL1xuICBwcml2YXRlIF9yZWdpc3RlclF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBRdWVyeSB7XG4gICAgLy8gT25seSBzZXQgdXAgYSBuZXcgTWVkaWFRdWVyeUxpc3QgaWYgaXQgaXMgbm90IGFscmVhZHkgYmVpbmcgbGlzdGVuZWQgZm9yLlxuICAgIGlmICh0aGlzLl9xdWVyaWVzLmhhcyhxdWVyeSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9xdWVyaWVzLmdldChxdWVyeSkhO1xuICAgIH1cblxuICAgIGNvbnN0IG1xbDogTWVkaWFRdWVyeUxpc3QgPSB0aGlzLl9tZWRpYU1hdGNoZXIubWF0Y2hNZWRpYShxdWVyeSk7XG5cbiAgICAvLyBDcmVhdGUgY2FsbGJhY2sgZm9yIG1hdGNoIGNoYW5nZXMgYW5kIGFkZCBpdCBpcyBhcyBhIGxpc3RlbmVyLlxuICAgIGNvbnN0IHF1ZXJ5T2JzZXJ2YWJsZSA9IG5ldyBPYnNlcnZhYmxlPE1lZGlhUXVlcnlMaXN0Pigob2JzZXJ2ZXI6IE9ic2VydmVyPE1lZGlhUXVlcnlMaXN0PikgPT4ge1xuICAgICAgLy8gTGlzdGVuZXIgY2FsbGJhY2sgbWV0aG9kcyBhcmUgd3JhcHBlZCB0byBiZSBwbGFjZWQgYmFjayBpbiBuZ1pvbmUuIENhbGxiYWNrcyBtdXN0IGJlIHBsYWNlZFxuICAgICAgLy8gYmFjayBpbnRvIHRoZSB6b25lIGJlY2F1c2UgbWF0Y2hNZWRpYSBpcyBvbmx5IGluY2x1ZGVkIGluIFpvbmUuanMgYnkgbG9hZGluZyB0aGVcbiAgICAgIC8vIHdlYmFwaXMtbWVkaWEtcXVlcnkuanMgZmlsZSBhbG9uZ3NpZGUgdGhlIHpvbmUuanMgZmlsZS4gIEFkZGl0aW9uYWxseSwgc29tZSBicm93c2VycyBkbyBub3RcbiAgICAgIC8vIGhhdmUgTWVkaWFRdWVyeUxpc3QgaW5oZXJpdCBmcm9tIEV2ZW50VGFyZ2V0LCB3aGljaCBjYXVzZXMgaW5jb25zaXN0ZW5jaWVzIGluIGhvdyBab25lLmpzXG4gICAgICAvLyBwYXRjaGVzIGl0LlxuICAgICAgY29uc3QgaGFuZGxlciA9IChlOiBhbnkpID0+IHRoaXMuX3pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoZSkpO1xuICAgICAgbXFsLmFkZExpc3RlbmVyKGhhbmRsZXIpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBtcWwucmVtb3ZlTGlzdGVuZXIoaGFuZGxlcik7XG4gICAgICB9O1xuICAgIH0pLnBpcGUoXG4gICAgICBzdGFydFdpdGgobXFsKSxcbiAgICAgIG1hcCgobmV4dE1xbDogTWVkaWFRdWVyeUxpc3QpID0+ICh7cXVlcnksIG1hdGNoZXM6IG5leHRNcWwubWF0Y2hlc30pKSxcbiAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95U3ViamVjdClcbiAgICApO1xuXG4gICAgLy8gQWRkIHRoZSBNZWRpYVF1ZXJ5TGlzdCB0byB0aGUgc2V0IG9mIHF1ZXJpZXMuXG4gICAgY29uc3Qgb3V0cHV0ID0ge29ic2VydmFibGU6IHF1ZXJ5T2JzZXJ2YWJsZSwgbXFsfTtcbiAgICB0aGlzLl9xdWVyaWVzLnNldChxdWVyeSwgb3V0cHV0KTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG59XG5cbi8qKlxuICogU3BsaXQgZWFjaCBxdWVyeSBzdHJpbmcgaW50byBzZXBhcmF0ZSBxdWVyeSBzdHJpbmdzIGlmIHR3byBxdWVyaWVzIGFyZSBwcm92aWRlZCBhcyBjb21tYVxuICogc2VwYXJhdGVkLlxuICovXG5mdW5jdGlvbiBzcGxpdFF1ZXJpZXMocXVlcmllczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIHJldHVybiBxdWVyaWVzLm1hcCgocXVlcnk6IHN0cmluZykgPT4gcXVlcnkuc3BsaXQoJywnKSlcbiAgICAgICAgICAgICAgICAucmVkdWNlKChhMTogc3RyaW5nW10sIGEyOiBzdHJpbmdbXSkgPT4gYTEuY29uY2F0KGEyKSlcbiAgICAgICAgICAgICAgICAubWFwKHF1ZXJ5ID0+IHF1ZXJ5LnRyaW0oKSk7XG59XG4iXX0=