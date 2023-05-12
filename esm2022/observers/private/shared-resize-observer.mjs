/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, shareReplay, takeUntil } from 'rxjs/operators';
import * as i0 from "@angular/core";
/**
 * Handler that logs "ResizeObserver loop limit exceeded" errors.
 * These errors are not shown in the Chrome console, so we log them to ensure developers are aware.
 * @param e The error
 */
const loopLimitExceededErrorHandler = (e) => {
    if (e instanceof Error && e.message === 'ResizeObserver loop limit exceeded') {
        console.error(`${e.message}. This could indicate a performance issue with your app. See https://github.com/WICG/resize-observer/blob/master/explainer.md#error-handling`);
    }
};
/**
 * A shared ResizeObserver to be used for a particular box type (content-box, border-box, or
 * device-pixel-content-box)
 */
class SingleBoxSharedResizeObserver {
    constructor(
    /** The box type to observe for resizes. */
    _box) {
        this._box = _box;
        /** Stream that emits when the shared observer is destroyed. */
        this._destroyed = new Subject();
        /** Stream of all events from the ResizeObserver. */
        this._resizeSubject = new Subject();
        /** A map of elements to streams of their resize events. */
        this._elementObservables = new Map();
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(entries => this._resizeSubject.next(entries));
        }
    }
    /**
     * Gets a stream of resize events for the given element.
     * @param target The element to observe.
     * @return The stream of resize events for the element.
     */
    observe(target) {
        if (!this._elementObservables.has(target)) {
            this._elementObservables.set(target, new Observable(observer => {
                const subscription = this._resizeSubject.subscribe(observer);
                this._resizeObserver?.observe(target, { box: this._box });
                return () => {
                    this._resizeObserver?.unobserve(target);
                    subscription.unsubscribe();
                    this._elementObservables.delete(target);
                };
            }).pipe(filter(entries => entries.some(entry => entry.target === target)), 
            // Share a replay of the last event so that subsequent calls to observe the same element
            // receive initial sizing info like the first one. Also enable ref counting so the
            // element will be automatically unobserved when there are no more subscriptions.
            shareReplay({ bufferSize: 1, refCount: true }), takeUntil(this._destroyed)));
        }
        return this._elementObservables.get(target);
    }
    /** Destroys this instance. */
    destroy() {
        this._destroyed.next();
        this._destroyed.complete();
        this._resizeSubject.complete();
        this._elementObservables.clear();
    }
}
/**
 * Allows observing resize events on multiple elements using a shared set of ResizeObserver.
 * Sharing a ResizeObserver instance is recommended for better performance (see
 * https://github.com/WICG/resize-observer/issues/59).
 *
 * Rather than share a single `ResizeObserver`, this class creates one `ResizeObserver` per type
 * of observed box ('content-box', 'border-box', and 'device-pixel-content-box'). This avoids
 * later calls to `observe` with a different box type from influencing the events dispatched to
 * earlier calls.
 */
class SharedResizeObserver {
    constructor() {
        /** Map of box type to shared resize observer. */
        this._observers = new Map();
        /** The Angular zone. */
        this._ngZone = inject(NgZone);
        if (typeof ResizeObserver !== 'undefined' && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            this._ngZone.runOutsideAngular(() => {
                window.addEventListener('error', loopLimitExceededErrorHandler);
            });
        }
    }
    ngOnDestroy() {
        for (const [, observer] of this._observers) {
            observer.destroy();
        }
        this._observers.clear();
        if (typeof ResizeObserver !== 'undefined' && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            window.removeEventListener('error', loopLimitExceededErrorHandler);
        }
    }
    /**
     * Gets a stream of resize events for the given target element and box type.
     * @param target The element to observe for resizes.
     * @param options Options to pass to the `ResizeObserver`
     * @return The stream of resize events for the element.
     */
    observe(target, options) {
        const box = options?.box || 'content-box';
        if (!this._observers.has(box)) {
            this._observers.set(box, new SingleBoxSharedResizeObserver(box));
        }
        return this._observers.get(box).observe(target);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: SharedResizeObserver, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: SharedResizeObserver, providedIn: 'root' }); }
}
export { SharedResizeObserver };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: SharedResizeObserver, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLXJlc2l6ZS1vYnNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb2JzZXJ2ZXJzL3ByaXZhdGUvc2hhcmVkLXJlc2l6ZS1vYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7O0FBRTlEOzs7O0dBSUc7QUFDSCxNQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBVSxFQUFFLEVBQUU7SUFDbkQsSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssb0NBQW9DLEVBQUU7UUFDNUUsT0FBTyxDQUFDLEtBQUssQ0FDWCxHQUFHLENBQUMsQ0FBQyxPQUFPLDhJQUE4SSxDQUMzSixDQUFDO0tBQ0g7QUFDSCxDQUFDLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxNQUFNLDZCQUE2QjtJQVVqQztJQUNFLDJDQUEyQztJQUNuQyxJQUE4QjtRQUE5QixTQUFJLEdBQUosSUFBSSxDQUEwQjtRQVh4QywrREFBK0Q7UUFDdkQsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFDekMsb0RBQW9EO1FBQzVDLG1CQUFjLEdBQUcsSUFBSSxPQUFPLEVBQXlCLENBQUM7UUFHOUQsMkRBQTJEO1FBQ25ELHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUE4QyxDQUFDO1FBTWxGLElBQUksT0FBTyxjQUFjLEtBQUssV0FBVyxFQUFFO1lBQ3pDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FB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RTtJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxNQUFlLEVBQUUsT0FBK0I7UUFDdEQsTUFBTSxHQUFHLEdBQUcsT0FBTyxFQUFFLEdBQUcsSUFBSSxhQUFhLENBQUM7UUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRCxDQUFDOzhHQXJDVSxvQkFBb0I7a0hBQXBCLG9CQUFvQixjQUZuQixNQUFNOztTQUVQLG9CQUFvQjsyRkFBcEIsb0JBQW9CO2tCQUhoQyxVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtpbmplY3QsIEluamVjdGFibGUsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpbHRlciwgc2hhcmVSZXBsYXksIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKipcbiAqIEhhbmRsZXIgdGhhdCBsb2dzIFwiUmVzaXplT2JzZXJ2ZXIgbG9vcCBsaW1pdCBleGNlZWRlZFwiIGVycm9ycy5cbiAqIFRoZXNlIGVycm9ycyBhcmUgbm90IHNob3duIGluIHRoZSBDaHJvbWUgY29uc29sZSwgc28gd2UgbG9nIHRoZW0gdG8gZW5zdXJlIGRldmVsb3BlcnMgYXJlIGF3YXJlLlxuICogQHBhcmFtIGUgVGhlIGVycm9yXG4gKi9cbmNvbnN0IGxvb3BMaW1pdEV4Y2VlZGVkRXJyb3JIYW5kbGVyID0gKGU6IHVua25vd24pID0+IHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLm1lc3NhZ2UgPT09ICdSZXNpemVPYnNlcnZlciBsb29wIGxpbWl0IGV4Y2VlZGVkJykge1xuICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICBgJHtlLm1lc3NhZ2V9LiBUaGlzIGNvdWxkIGluZGljYXRlIGEgcGVyZm9ybWFuY2UgaXNzdWUgd2l0aCB5b3VyIGFwcC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9XSUNHL3Jlc2l6ZS1vYnNlcnZlci9ibG9iL21hc3Rlci9leHBsYWluZXIubWQjZXJyb3ItaGFuZGxpbmdgLFxuICAgICk7XG4gIH1cbn07XG5cbi8qKlxuICogQSBzaGFyZWQgUmVzaXplT2JzZXJ2ZXIgdG8gYmUgdXNlZCBmb3IgYSBwYXJ0aWN1bGFyIGJveCB0eXBlIChjb250ZW50LWJveCwgYm9yZGVyLWJveCwgb3JcbiAqIGRldmljZS1waXhlbC1jb250ZW50LWJveClcbiAqL1xuY2xhc3MgU2luZ2xlQm94U2hhcmVkUmVzaXplT2JzZXJ2ZXIge1xuICAvKiogU3RyZWFtIHRoYXQgZW1pdHMgd2hlbiB0aGUgc2hhcmVkIG9ic2VydmVyIGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgLyoqIFN0cmVhbSBvZiBhbGwgZXZlbnRzIGZyb20gdGhlIFJlc2l6ZU9ic2VydmVyLiAqL1xuICBwcml2YXRlIF9yZXNpemVTdWJqZWN0ID0gbmV3IFN1YmplY3Q8UmVzaXplT2JzZXJ2ZXJFbnRyeVtdPigpO1xuICAvKiogUmVzaXplT2JzZXJ2ZXIgdXNlZCB0byBvYnNlcnZlIGVsZW1lbnQgcmVzaXplIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplT2JzZXJ2ZXI/OiBSZXNpemVPYnNlcnZlcjtcbiAgLyoqIEEgbWFwIG9mIGVsZW1lbnRzIHRvIHN0cmVhbXMgb2YgdGhlaXIgcmVzaXplIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudE9ic2VydmFibGVzID0gbmV3IE1hcDxFbGVtZW50LCBPYnNlcnZhYmxlPFJlc2l6ZU9ic2VydmVyRW50cnlbXT4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgLyoqIFRoZSBib3ggdHlwZSB0byBvYnNlcnZlIGZvciByZXNpemVzLiAqL1xuICAgIHByaXZhdGUgX2JveDogUmVzaXplT2JzZXJ2ZXJCb3hPcHRpb25zLFxuICApIHtcbiAgICBpZiAodHlwZW9mIFJlc2l6ZU9ic2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5fcmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB0aGlzLl9yZXNpemVTdWJqZWN0Lm5leHQoZW50cmllcykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgc3RyZWFtIG9mIHJlc2l6ZSBldmVudHMgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSBlbGVtZW50IHRvIG9ic2VydmUuXG4gICAqIEByZXR1cm4gVGhlIHN0cmVhbSBvZiByZXNpemUgZXZlbnRzIGZvciB0aGUgZWxlbWVudC5cbiAgICovXG4gIG9ic2VydmUodGFyZ2V0OiBFbGVtZW50KTogT2JzZXJ2YWJsZTxSZXNpemVPYnNlcnZlckVudHJ5W10+IHtcbiAgICBpZiAoIXRoaXMuX2VsZW1lbnRPYnNlcnZhYmxlcy5oYXModGFyZ2V0KSkge1xuICAgICAgdGhpcy5fZWxlbWVudE9ic2VydmFibGVzLnNldChcbiAgICAgICAgdGFyZ2V0LFxuICAgICAgICBuZXcgT2JzZXJ2YWJsZTxSZXNpemVPYnNlcnZlckVudHJ5W10+KG9ic2VydmVyID0+IHtcbiAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9yZXNpemVTdWJqZWN0LnN1YnNjcmliZShvYnNlcnZlcik7XG4gICAgICAgICAgdGhpcy5fcmVzaXplT2JzZXJ2ZXI/Lm9ic2VydmUodGFyZ2V0LCB7Ym94OiB0aGlzLl9ib3h9KTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVzaXplT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0YXJnZXQpO1xuICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50T2JzZXJ2YWJsZXMuZGVsZXRlKHRhcmdldCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkucGlwZShcbiAgICAgICAgICBmaWx0ZXIoZW50cmllcyA9PiBlbnRyaWVzLnNvbWUoZW50cnkgPT4gZW50cnkudGFyZ2V0ID09PSB0YXJnZXQpKSxcbiAgICAgICAgICAvLyBTaGFyZSBhIHJlcGxheSBvZiB0aGUgbGFzdCBldmVudCBzbyB0aGF0IHN1YnNlcXVlbnQgY2FsbHMgdG8gb2JzZXJ2ZSB0aGUgc2FtZSBlbGVtZW50XG4gICAgICAgICAgLy8gcmVjZWl2ZSBpbml0aWFsIHNpemluZyBpbmZvIGxpa2UgdGhlIGZpcnN0IG9uZS4gQWxzbyBlbmFibGUgcmVmIGNvdW50aW5nIHNvIHRoZVxuICAgICAgICAgIC8vIGVsZW1lbnQgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHVub2JzZXJ2ZWQgd2hlbiB0aGVyZSBhcmUgbm8gbW9yZSBzdWJzY3JpcHRpb25zLlxuICAgICAgICAgIHNoYXJlUmVwbGF5KHtidWZmZXJTaXplOiAxLCByZWZDb3VudDogdHJ1ZX0pLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRPYnNlcnZhYmxlcy5nZXQodGFyZ2V0KSE7XG4gIH1cblxuICAvKiogRGVzdHJveXMgdGhpcyBpbnN0YW5jZS4gKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YmplY3QuY29tcGxldGUoKTtcbiAgICB0aGlzLl9lbGVtZW50T2JzZXJ2YWJsZXMuY2xlYXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIEFsbG93cyBvYnNlcnZpbmcgcmVzaXplIGV2ZW50cyBvbiBtdWx0aXBsZSBlbGVtZW50cyB1c2luZyBhIHNoYXJlZCBzZXQgb2YgUmVzaXplT2JzZXJ2ZXIuXG4gKiBTaGFyaW5nIGEgUmVzaXplT2JzZXJ2ZXIgaW5zdGFuY2UgaXMgcmVjb21tZW5kZWQgZm9yIGJldHRlciBwZXJmb3JtYW5jZSAoc2VlXG4gKiBodHRwczovL2dpdGh1Yi5jb20vV0lDRy9yZXNpemUtb2JzZXJ2ZXIvaXNzdWVzLzU5KS5cbiAqXG4gKiBSYXRoZXIgdGhhbiBzaGFyZSBhIHNpbmdsZSBgUmVzaXplT2JzZXJ2ZXJgLCB0aGlzIGNsYXNzIGNyZWF0ZXMgb25lIGBSZXNpemVPYnNlcnZlcmAgcGVyIHR5cGVcbiAqIG9mIG9ic2VydmVkIGJveCAoJ2NvbnRlbnQtYm94JywgJ2JvcmRlci1ib3gnLCBhbmQgJ2RldmljZS1waXhlbC1jb250ZW50LWJveCcpLiBUaGlzIGF2b2lkc1xuICogbGF0ZXIgY2FsbHMgdG8gYG9ic2VydmVgIHdpdGggYSBkaWZmZXJlbnQgYm94IHR5cGUgZnJvbSBpbmZsdWVuY2luZyB0aGUgZXZlbnRzIGRpc3BhdGNoZWQgdG9cbiAqIGVhcmxpZXIgY2FsbHMuXG4gKi9cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBTaGFyZWRSZXNpemVPYnNlcnZlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBNYXAgb2YgYm94IHR5cGUgdG8gc2hhcmVkIHJlc2l6ZSBvYnNlcnZlci4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZXJzID0gbmV3IE1hcDxSZXNpemVPYnNlcnZlckJveE9wdGlvbnMsIFNpbmdsZUJveFNoYXJlZFJlc2l6ZU9ic2VydmVyPigpO1xuXG4gIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICBwcml2YXRlIF9uZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBpZiAodHlwZW9mIFJlc2l6ZU9ic2VydmVyICE9PSAndW5kZWZpbmVkJyAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgbG9vcExpbWl0RXhjZWVkZWRFcnJvckhhbmRsZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgZm9yIChjb25zdCBbLCBvYnNlcnZlcl0gb2YgdGhpcy5fb2JzZXJ2ZXJzKSB7XG4gICAgICBvYnNlcnZlci5kZXN0cm95KCk7XG4gICAgfVxuICAgIHRoaXMuX29ic2VydmVycy5jbGVhcigpO1xuICAgIGlmICh0eXBlb2YgUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBsb29wTGltaXRFeGNlZWRlZEVycm9ySGFuZGxlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBzdHJlYW0gb2YgcmVzaXplIGV2ZW50cyBmb3IgdGhlIGdpdmVuIHRhcmdldCBlbGVtZW50IGFuZCBib3ggdHlwZS5cbiAgICogQHBhcmFtIHRhcmdldCBUaGUgZWxlbWVudCB0byBvYnNlcnZlIGZvciByZXNpemVzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIGBSZXNpemVPYnNlcnZlcmBcbiAgICogQHJldHVybiBUaGUgc3RyZWFtIG9mIHJlc2l6ZSBldmVudHMgZm9yIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgb2JzZXJ2ZSh0YXJnZXQ6IEVsZW1lbnQsIG9wdGlvbnM/OiBSZXNpemVPYnNlcnZlck9wdGlvbnMpOiBPYnNlcnZhYmxlPFJlc2l6ZU9ic2VydmVyRW50cnlbXT4ge1xuICAgIGNvbnN0IGJveCA9IG9wdGlvbnM/LmJveCB8fCAnY29udGVudC1ib3gnO1xuICAgIGlmICghdGhpcy5fb2JzZXJ2ZXJzLmhhcyhib3gpKSB7XG4gICAgICB0aGlzLl9vYnNlcnZlcnMuc2V0KGJveCwgbmV3IFNpbmdsZUJveFNoYXJlZFJlc2l6ZU9ic2VydmVyKGJveCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fb2JzZXJ2ZXJzLmdldChib3gpIS5vYnNlcnZlKHRhcmdldCk7XG4gIH1cbn1cbiJdfQ==