/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceArray } from '@angular/cdk/coercion';
import { Injectable, NgZone } from '@angular/core';
import { combineLatest, concat, Observable, Subject } from 'rxjs';
import { debounceTime, map, skip, startWith, take, takeUntil } from 'rxjs/operators';
import { MediaMatcher } from './media-matcher';
import * as i0 from "@angular/core";
import * as i1 from "./media-matcher";
/** Utility for checking the matching state of @media queries. */
class BreakpointObserver {
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
        return stateObservable.pipe(map(breakpointStates => {
            const response = {
                matches: false,
                breakpoints: {},
            };
            breakpointStates.forEach(({ matches, query }) => {
                response.matches = response.matches || matches;
                response.breakpoints[query] = matches;
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
        }).pipe(startWith(mql), map(({ matches }) => ({ query, matches })), takeUntil(this._destroySubject));
        // Add the MediaQueryList to the set of queries.
        const output = { observable: queryObservable, mql };
        this._queries.set(query, output);
        return output;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: BreakpointObserver, deps: [{ token: i1.MediaMatcher }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: BreakpointObserver, providedIn: 'root' }); }
}
export { BreakpointObserver };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: BreakpointObserver, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.MediaMatcher }, { type: i0.NgZone }]; } });
/**
 * Split each query string into separate query strings if two queries are provided as comma
 * separated.
 */
function splitQueries(queries) {
    return queries
        .map(query => query.split(','))
        .reduce((a1, a2) => a1.concat(a2))
        .map(query => query.trim());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludHMtb2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2xheW91dC9icmVha3BvaW50cy1vYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFZLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNuRixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7OztBQTRCN0MsaUVBQWlFO0FBQ2pFLE1BQ2Esa0JBQWtCO0lBTTdCLFlBQW9CLGFBQTJCLEVBQVUsS0FBYTtRQUFsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBYztRQUFVLFVBQUssR0FBTCxLQUFLLENBQVE7UUFMdEUsZ0VBQWdFO1FBQ3hELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQUM1QyxpRUFBaUU7UUFDaEQsb0JBQWUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO0lBRWtCLENBQUM7SUFFMUUscUZBQXFGO0lBQ3JGLFdBQVc7UUFDVCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLENBQUMsS0FBaUM7UUFDekMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FB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QUcsRUFBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqQyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDOzhHQXZGVSxrQkFBa0I7a0hBQWxCLGtCQUFrQixjQUROLE1BQU07O1NBQ2xCLGtCQUFrQjsyRkFBbEIsa0JBQWtCO2tCQUQ5QixVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUEyRmhDOzs7R0FHRztBQUNILFNBQVMsWUFBWSxDQUFDLE9BQTBCO0lBQzlDLE9BQU8sT0FBTztTQUNYLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDOUIsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNqQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNoQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0luamVjdGFibGUsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29tYmluZUxhdGVzdCwgY29uY2F0LCBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2RlYm91bmNlVGltZSwgbWFwLCBza2lwLCBzdGFydFdpdGgsIHRha2UsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtNZWRpYU1hdGNoZXJ9IGZyb20gJy4vbWVkaWEtbWF0Y2hlcic7XG5cbi8qKiBUaGUgY3VycmVudCBzdGF0ZSBvZiBhIGxheW91dCBicmVha3BvaW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBCcmVha3BvaW50U3RhdGUge1xuICAvKiogV2hldGhlciB0aGUgYnJlYWtwb2ludCBpcyBjdXJyZW50bHkgbWF0Y2hpbmcuICovXG4gIG1hdGNoZXM6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBIGtleSBib29sZWFuIHBhaXIgZm9yIGVhY2ggcXVlcnkgcHJvdmlkZWQgdG8gdGhlIG9ic2VydmUgbWV0aG9kLFxuICAgKiB3aXRoIGl0cyBjdXJyZW50IG1hdGNoZWQgc3RhdGUuXG4gICAqL1xuICBicmVha3BvaW50czoge1xuICAgIFtrZXk6IHN0cmluZ106IGJvb2xlYW47XG4gIH07XG59XG5cbi8qKiBUaGUgY3VycmVudCBzdGF0ZSBvZiBhIGxheW91dCBicmVha3BvaW50LiAqL1xuaW50ZXJmYWNlIEludGVybmFsQnJlYWtwb2ludFN0YXRlIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGJyZWFrcG9pbnQgaXMgY3VycmVudGx5IG1hdGNoaW5nLiAqL1xuICBtYXRjaGVzOiBib29sZWFuO1xuICAvKiogVGhlIG1lZGlhIHF1ZXJ5IGJlaW5nIHRvIGJlIG1hdGNoZWQgKi9cbiAgcXVlcnk6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFF1ZXJ5IHtcbiAgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxJbnRlcm5hbEJyZWFrcG9pbnRTdGF0ZT47XG4gIG1xbDogTWVkaWFRdWVyeUxpc3Q7XG59XG5cbi8qKiBVdGlsaXR5IGZvciBjaGVja2luZyB0aGUgbWF0Y2hpbmcgc3RhdGUgb2YgQG1lZGlhIHF1ZXJpZXMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBCcmVha3BvaW50T2JzZXJ2ZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogIEEgbWFwIG9mIGFsbCBtZWRpYSBxdWVyaWVzIGN1cnJlbnRseSBiZWluZyBsaXN0ZW5lZCBmb3IuICovXG4gIHByaXZhdGUgX3F1ZXJpZXMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnk+KCk7XG4gIC8qKiBBIHN1YmplY3QgZm9yIGFsbCBvdGhlciBvYnNlcnZhYmxlcyB0byB0YWtlVW50aWwgYmFzZWQgb24uICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rlc3Ryb3lTdWJqZWN0ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tZWRpYU1hdGNoZXI6IE1lZGlhTWF0Y2hlciwgcHJpdmF0ZSBfem9uZTogTmdab25lKSB7fVxuXG4gIC8qKiBDb21wbGV0ZXMgdGhlIGFjdGl2ZSBzdWJqZWN0LCBzaWduYWxsaW5nIHRvIGFsbCBvdGhlciBvYnNlcnZhYmxlcyB0byBjb21wbGV0ZS4gKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveVN1YmplY3QubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3lTdWJqZWN0LmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBvbmUgb3IgbW9yZSBtZWRpYSBxdWVyaWVzIG1hdGNoIHRoZSBjdXJyZW50IHZpZXdwb3J0IHNpemUuXG4gICAqIEBwYXJhbSB2YWx1ZSBPbmUgb3IgbW9yZSBtZWRpYSBxdWVyaWVzIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIGFueSBvZiB0aGUgbWVkaWEgcXVlcmllcyBtYXRjaC5cbiAgICovXG4gIGlzTWF0Y2hlZCh2YWx1ZTogc3RyaW5nIHwgcmVhZG9ubHkgc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICBjb25zdCBxdWVyaWVzID0gc3BsaXRRdWVyaWVzKGNvZXJjZUFycmF5KHZhbHVlKSk7XG4gICAgcmV0dXJuIHF1ZXJpZXMuc29tZShtZWRpYVF1ZXJ5ID0+IHRoaXMuX3JlZ2lzdGVyUXVlcnkobWVkaWFRdWVyeSkubXFsLm1hdGNoZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gb2JzZXJ2YWJsZSBvZiByZXN1bHRzIGZvciB0aGUgZ2l2ZW4gcXVlcmllcyB0aGF0IHdpbGwgZW1pdCBuZXcgcmVzdWx0cyBmb3IgYW55IGNoYW5nZXNcbiAgICogaW4gbWF0Y2hpbmcgb2YgdGhlIGdpdmVuIHF1ZXJpZXMuXG4gICAqIEBwYXJhbSB2YWx1ZSBPbmUgb3IgbW9yZSBtZWRpYSBxdWVyaWVzIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyBBIHN0cmVhbSBvZiBtYXRjaGVzIGZvciB0aGUgZ2l2ZW4gcXVlcmllcy5cbiAgICovXG4gIG9ic2VydmUodmFsdWU6IHN0cmluZyB8IHJlYWRvbmx5IHN0cmluZ1tdKTogT2JzZXJ2YWJsZTxCcmVha3BvaW50U3RhdGU+IHtcbiAgICBjb25zdCBxdWVyaWVzID0gc3BsaXRRdWVyaWVzKGNvZXJjZUFycmF5KHZhbHVlKSk7XG4gICAgY29uc3Qgb2JzZXJ2YWJsZXMgPSBxdWVyaWVzLm1hcChxdWVyeSA9PiB0aGlzLl9yZWdpc3RlclF1ZXJ5KHF1ZXJ5KS5vYnNlcnZhYmxlKTtcblxuICAgIGxldCBzdGF0ZU9ic2VydmFibGUgPSBjb21iaW5lTGF0ZXN0KG9ic2VydmFibGVzKTtcbiAgICAvLyBFbWl0IHRoZSBmaXJzdCBzdGF0ZSBpbW1lZGlhdGVseSwgYW5kIHRoZW4gZGVib3VuY2UgdGhlIHN1YnNlcXVlbnQgZW1pc3Npb25zLlxuICAgIHN0YXRlT2JzZXJ2YWJsZSA9IGNvbmNhdChcbiAgICAgIHN0YXRlT2JzZXJ2YWJsZS5waXBlKHRha2UoMSkpLFxuICAgICAgc3RhdGVPYnNlcnZhYmxlLnBpcGUoc2tpcCgxKSwgZGVib3VuY2VUaW1lKDApKSxcbiAgICApO1xuICAgIHJldHVybiBzdGF0ZU9ic2VydmFibGUucGlwZShcbiAgICAgIG1hcChicmVha3BvaW50U3RhdGVzID0+IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2U6IEJyZWFrcG9pbnRTdGF0ZSA9IHtcbiAgICAgICAgICBtYXRjaGVzOiBmYWxzZSxcbiAgICAgICAgICBicmVha3BvaW50czoge30sXG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrcG9pbnRTdGF0ZXMuZm9yRWFjaCgoe21hdGNoZXMsIHF1ZXJ5fSkgPT4ge1xuICAgICAgICAgIHJlc3BvbnNlLm1hdGNoZXMgPSByZXNwb25zZS5tYXRjaGVzIHx8IG1hdGNoZXM7XG4gICAgICAgICAgcmVzcG9uc2UuYnJlYWtwb2ludHNbcXVlcnldID0gbWF0Y2hlcztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIGEgc3BlY2lmaWMgcXVlcnkgdG8gYmUgbGlzdGVuZWQgZm9yLiAqL1xuICBwcml2YXRlIF9yZWdpc3RlclF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBRdWVyeSB7XG4gICAgLy8gT25seSBzZXQgdXAgYSBuZXcgTWVkaWFRdWVyeUxpc3QgaWYgaXQgaXMgbm90IGFscmVhZHkgYmVpbmcgbGlzdGVuZWQgZm9yLlxuICAgIGlmICh0aGlzLl9xdWVyaWVzLmhhcyhxdWVyeSkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9xdWVyaWVzLmdldChxdWVyeSkhO1xuICAgIH1cblxuICAgIGNvbnN0IG1xbCA9IHRoaXMuX21lZGlhTWF0Y2hlci5tYXRjaE1lZGlhKHF1ZXJ5KTtcblxuICAgIC8vIENyZWF0ZSBjYWxsYmFjayBmb3IgbWF0Y2ggY2hhbmdlcyBhbmQgYWRkIGl0IGlzIGFzIGEgbGlzdGVuZXIuXG4gICAgY29uc3QgcXVlcnlPYnNlcnZhYmxlID0gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxNZWRpYVF1ZXJ5TGlzdEV2ZW50PikgPT4ge1xuICAgICAgLy8gTGlzdGVuZXIgY2FsbGJhY2sgbWV0aG9kcyBhcmUgd3JhcHBlZCB0byBiZSBwbGFjZWQgYmFjayBpbiBuZ1pvbmUuIENhbGxiYWNrcyBtdXN0IGJlIHBsYWNlZFxuICAgICAgLy8gYmFjayBpbnRvIHRoZSB6b25lIGJlY2F1c2UgbWF0Y2hNZWRpYSBpcyBvbmx5IGluY2x1ZGVkIGluIFpvbmUuanMgYnkgbG9hZGluZyB0aGVcbiAgICAgIC8vIHdlYmFwaXMtbWVkaWEtcXVlcnkuanMgZmlsZSBhbG9uZ3NpZGUgdGhlIHpvbmUuanMgZmlsZS4gIEFkZGl0aW9uYWxseSwgc29tZSBicm93c2VycyBkbyBub3RcbiAgICAgIC8vIGhhdmUgTWVkaWFRdWVyeUxpc3QgaW5oZXJpdCBmcm9tIEV2ZW50VGFyZ2V0LCB3aGljaCBjYXVzZXMgaW5jb25zaXN0ZW5jaWVzIGluIGhvdyBab25lLmpzXG4gICAgICAvLyBwYXRjaGVzIGl0LlxuICAgICAgY29uc3QgaGFuZGxlciA9IChlOiBNZWRpYVF1ZXJ5TGlzdEV2ZW50KTogdm9pZCA9PiB0aGlzLl96b25lLnJ1bigoKSA9PiBvYnNlcnZlci5uZXh0KGUpKTtcbiAgICAgIG1xbC5hZGRMaXN0ZW5lcihoYW5kbGVyKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgbXFsLnJlbW92ZUxpc3RlbmVyKGhhbmRsZXIpO1xuICAgICAgfTtcbiAgICB9KS5waXBlKFxuICAgICAgc3RhcnRXaXRoKG1xbCksXG4gICAgICBtYXAoKHttYXRjaGVzfSkgPT4gKHtxdWVyeSwgbWF0Y2hlc30pKSxcbiAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95U3ViamVjdCksXG4gICAgKTtcblxuICAgIC8vIEFkZCB0aGUgTWVkaWFRdWVyeUxpc3QgdG8gdGhlIHNldCBvZiBxdWVyaWVzLlxuICAgIGNvbnN0IG91dHB1dCA9IHtvYnNlcnZhYmxlOiBxdWVyeU9ic2VydmFibGUsIG1xbH07XG4gICAgdGhpcy5fcXVlcmllcy5zZXQocXVlcnksIG91dHB1dCk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxufVxuXG4vKipcbiAqIFNwbGl0IGVhY2ggcXVlcnkgc3RyaW5nIGludG8gc2VwYXJhdGUgcXVlcnkgc3RyaW5ncyBpZiB0d28gcXVlcmllcyBhcmUgcHJvdmlkZWQgYXMgY29tbWFcbiAqIHNlcGFyYXRlZC5cbiAqL1xuZnVuY3Rpb24gc3BsaXRRdWVyaWVzKHF1ZXJpZXM6IHJlYWRvbmx5IHN0cmluZ1tdKTogcmVhZG9ubHkgc3RyaW5nW10ge1xuICByZXR1cm4gcXVlcmllc1xuICAgIC5tYXAocXVlcnkgPT4gcXVlcnkuc3BsaXQoJywnKSlcbiAgICAucmVkdWNlKChhMSwgYTIpID0+IGExLmNvbmNhdChhMikpXG4gICAgLm1hcChxdWVyeSA9PiBxdWVyeS50cmltKCkpO1xufVxuIl19