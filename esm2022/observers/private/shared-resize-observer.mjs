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
export class SharedResizeObserver {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: SharedResizeObserver, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: SharedResizeObserver, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: SharedResizeObserver, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLXJlc2l6ZS1vYnNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb2JzZXJ2ZXJzL3ByaXZhdGUvc2hhcmVkLXJlc2l6ZS1vYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDcEUsT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7O0FBRTlEOzs7O0dBSUc7QUFDSCxNQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBVSxFQUFFLEVBQUU7SUFDbkQsSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssb0NBQW9DLEVBQUU7UUFDNUUsT0FBTyxDQUFDLEtBQUssQ0FDWCxHQUFHLENBQUMsQ0FBQyxPQUFPLDhJQUE4SSxDQUMzSixDQUFDO0tBQ0g7QUFDSCxDQUFDLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxNQUFNLDZCQUE2QjtJQVVqQztJQUNFLDJDQUEyQztJQUNuQyxJQUE4QjtRQUE5QixTQUFJLEdBQUosSUFBSSxDQUEwQjtRQVh4QywrREFBK0Q7UUFDdkQsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFDekMsb0RBQW9EO1FBQzVDLG1CQUFjLEdBQUcsSUFBSSxPQUFPLEVBQXlCLENBQUM7UUFHOUQsMkRBQTJEO1FBQ25ELHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUE4QyxDQUFDO1FBTWxGLElBQUksT0FBTyxjQUFjLEtBQUssV0FBVyxFQUFFO1lBQ3pDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FB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O1NBQ3BFO0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsT0FBTyxDQUFDLE1BQWUsRUFBRSxPQUErQjtRQUN0RCxNQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsR0FBRyxJQUFJLGFBQWEsQ0FBQztRQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksNkJBQTZCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNsRTtRQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25ELENBQUM7OEdBckNVLG9CQUFvQjtrSEFBcEIsb0JBQW9CLGNBRm5CLE1BQU07OzJGQUVQLG9CQUFvQjtrQkFIaEMsVUFBVTttQkFBQztvQkFDVixVQUFVLEVBQUUsTUFBTTtpQkFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RhYmxlLCBOZ1pvbmUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaWx0ZXIsIHNoYXJlUmVwbGF5LCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqXG4gKiBIYW5kbGVyIHRoYXQgbG9ncyBcIlJlc2l6ZU9ic2VydmVyIGxvb3AgbGltaXQgZXhjZWVkZWRcIiBlcnJvcnMuXG4gKiBUaGVzZSBlcnJvcnMgYXJlIG5vdCBzaG93biBpbiB0aGUgQ2hyb21lIGNvbnNvbGUsIHNvIHdlIGxvZyB0aGVtIHRvIGVuc3VyZSBkZXZlbG9wZXJzIGFyZSBhd2FyZS5cbiAqIEBwYXJhbSBlIFRoZSBlcnJvclxuICovXG5jb25zdCBsb29wTGltaXRFeGNlZWRlZEVycm9ySGFuZGxlciA9IChlOiB1bmtub3duKSA9PiB7XG4gIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5tZXNzYWdlID09PSAnUmVzaXplT2JzZXJ2ZXIgbG9vcCBsaW1pdCBleGNlZWRlZCcpIHtcbiAgICBjb25zb2xlLmVycm9yKFxuICAgICAgYCR7ZS5tZXNzYWdlfS4gVGhpcyBjb3VsZCBpbmRpY2F0ZSBhIHBlcmZvcm1hbmNlIGlzc3VlIHdpdGggeW91ciBhcHAuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vV0lDRy9yZXNpemUtb2JzZXJ2ZXIvYmxvYi9tYXN0ZXIvZXhwbGFpbmVyLm1kI2Vycm9yLWhhbmRsaW5nYCxcbiAgICApO1xuICB9XG59O1xuXG4vKipcbiAqIEEgc2hhcmVkIFJlc2l6ZU9ic2VydmVyIHRvIGJlIHVzZWQgZm9yIGEgcGFydGljdWxhciBib3ggdHlwZSAoY29udGVudC1ib3gsIGJvcmRlci1ib3gsIG9yXG4gKiBkZXZpY2UtcGl4ZWwtY29udGVudC1ib3gpXG4gKi9cbmNsYXNzIFNpbmdsZUJveFNoYXJlZFJlc2l6ZU9ic2VydmVyIHtcbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHdoZW4gdGhlIHNoYXJlZCBvYnNlcnZlciBpcyBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIC8qKiBTdHJlYW0gb2YgYWxsIGV2ZW50cyBmcm9tIHRoZSBSZXNpemVPYnNlcnZlci4gKi9cbiAgcHJpdmF0ZSBfcmVzaXplU3ViamVjdCA9IG5ldyBTdWJqZWN0PFJlc2l6ZU9ic2VydmVyRW50cnlbXT4oKTtcbiAgLyoqIFJlc2l6ZU9ic2VydmVyIHVzZWQgdG8gb2JzZXJ2ZSBlbGVtZW50IHJlc2l6ZSBldmVudHMuICovXG4gIHByaXZhdGUgX3Jlc2l6ZU9ic2VydmVyPzogUmVzaXplT2JzZXJ2ZXI7XG4gIC8qKiBBIG1hcCBvZiBlbGVtZW50cyB0byBzdHJlYW1zIG9mIHRoZWlyIHJlc2l6ZSBldmVudHMuICovXG4gIHByaXZhdGUgX2VsZW1lbnRPYnNlcnZhYmxlcyA9IG5ldyBNYXA8RWxlbWVudCwgT2JzZXJ2YWJsZTxSZXNpemVPYnNlcnZlckVudHJ5W10+PigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIC8qKiBUaGUgYm94IHR5cGUgdG8gb2JzZXJ2ZSBmb3IgcmVzaXplcy4gKi9cbiAgICBwcml2YXRlIF9ib3g6IFJlc2l6ZU9ic2VydmVyQm94T3B0aW9ucyxcbiAgKSB7XG4gICAgaWYgKHR5cGVvZiBSZXNpemVPYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuX3Jlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4gdGhpcy5fcmVzaXplU3ViamVjdC5uZXh0KGVudHJpZXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHN0cmVhbSBvZiByZXNpemUgZXZlbnRzIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtIHRhcmdldCBUaGUgZWxlbWVudCB0byBvYnNlcnZlLlxuICAgKiBAcmV0dXJuIFRoZSBzdHJlYW0gb2YgcmVzaXplIGV2ZW50cyBmb3IgdGhlIGVsZW1lbnQuXG4gICAqL1xuICBvYnNlcnZlKHRhcmdldDogRWxlbWVudCk6IE9ic2VydmFibGU8UmVzaXplT2JzZXJ2ZXJFbnRyeVtdPiB7XG4gICAgaWYgKCF0aGlzLl9lbGVtZW50T2JzZXJ2YWJsZXMuaGFzKHRhcmdldCkpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnRPYnNlcnZhYmxlcy5zZXQoXG4gICAgICAgIHRhcmdldCxcbiAgICAgICAgbmV3IE9ic2VydmFibGU8UmVzaXplT2JzZXJ2ZXJFbnRyeVtdPihvYnNlcnZlciA9PiB7XG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdGhpcy5fcmVzaXplU3ViamVjdC5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuICAgICAgICAgIHRoaXMuX3Jlc2l6ZU9ic2VydmVyPy5vYnNlcnZlKHRhcmdldCwge2JveDogdGhpcy5fYm94fSk7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2l6ZU9ic2VydmVyPy51bm9ic2VydmUodGFyZ2V0KTtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudE9ic2VydmFibGVzLmRlbGV0ZSh0YXJnZXQpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKGVudHJpZXMgPT4gZW50cmllcy5zb21lKGVudHJ5ID0+IGVudHJ5LnRhcmdldCA9PT0gdGFyZ2V0KSksXG4gICAgICAgICAgLy8gU2hhcmUgYSByZXBsYXkgb2YgdGhlIGxhc3QgZXZlbnQgc28gdGhhdCBzdWJzZXF1ZW50IGNhbGxzIHRvIG9ic2VydmUgdGhlIHNhbWUgZWxlbWVudFxuICAgICAgICAgIC8vIHJlY2VpdmUgaW5pdGlhbCBzaXppbmcgaW5mbyBsaWtlIHRoZSBmaXJzdCBvbmUuIEFsc28gZW5hYmxlIHJlZiBjb3VudGluZyBzbyB0aGVcbiAgICAgICAgICAvLyBlbGVtZW50IHdpbGwgYmUgYXV0b21hdGljYWxseSB1bm9ic2VydmVkIHdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgc3Vic2NyaXB0aW9ucy5cbiAgICAgICAgICBzaGFyZVJlcGxheSh7YnVmZmVyU2l6ZTogMSwgcmVmQ291bnQ6IHRydWV9KSxcbiAgICAgICAgICB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSxcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9lbGVtZW50T2JzZXJ2YWJsZXMuZ2V0KHRhcmdldCkhO1xuICB9XG5cbiAgLyoqIERlc3Ryb3lzIHRoaXMgaW5zdGFuY2UuICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9yZXNpemVTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZWxlbWVudE9ic2VydmFibGVzLmNsZWFyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbGxvd3Mgb2JzZXJ2aW5nIHJlc2l6ZSBldmVudHMgb24gbXVsdGlwbGUgZWxlbWVudHMgdXNpbmcgYSBzaGFyZWQgc2V0IG9mIFJlc2l6ZU9ic2VydmVyLlxuICogU2hhcmluZyBhIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlIGlzIHJlY29tbWVuZGVkIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UgKHNlZVxuICogaHR0cHM6Ly9naXRodWIuY29tL1dJQ0cvcmVzaXplLW9ic2VydmVyL2lzc3Vlcy81OSkuXG4gKlxuICogUmF0aGVyIHRoYW4gc2hhcmUgYSBzaW5nbGUgYFJlc2l6ZU9ic2VydmVyYCwgdGhpcyBjbGFzcyBjcmVhdGVzIG9uZSBgUmVzaXplT2JzZXJ2ZXJgIHBlciB0eXBlXG4gKiBvZiBvYnNlcnZlZCBib3ggKCdjb250ZW50LWJveCcsICdib3JkZXItYm94JywgYW5kICdkZXZpY2UtcGl4ZWwtY29udGVudC1ib3gnKS4gVGhpcyBhdm9pZHNcbiAqIGxhdGVyIGNhbGxzIHRvIGBvYnNlcnZlYCB3aXRoIGEgZGlmZmVyZW50IGJveCB0eXBlIGZyb20gaW5mbHVlbmNpbmcgdGhlIGV2ZW50cyBkaXNwYXRjaGVkIHRvXG4gKiBlYXJsaWVyIGNhbGxzLlxuICovXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdyb290Jyxcbn0pXG5leHBvcnQgY2xhc3MgU2hhcmVkUmVzaXplT2JzZXJ2ZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogTWFwIG9mIGJveCB0eXBlIHRvIHNoYXJlZCByZXNpemUgb2JzZXJ2ZXIuICovXG4gIHByaXZhdGUgX29ic2VydmVycyA9IG5ldyBNYXA8UmVzaXplT2JzZXJ2ZXJCb3hPcHRpb25zLCBTaW5nbGVCb3hTaGFyZWRSZXNpemVPYnNlcnZlcj4oKTtcblxuICAvKiogVGhlIEFuZ3VsYXIgem9uZS4gKi9cbiAgcHJpdmF0ZSBfbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKHR5cGVvZiBSZXNpemVPYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGxvb3BMaW1pdEV4Y2VlZGVkRXJyb3JIYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGZvciAoY29uc3QgWywgb2JzZXJ2ZXJdIG9mIHRoaXMuX29ic2VydmVycykge1xuICAgICAgb2JzZXJ2ZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICB0aGlzLl9vYnNlcnZlcnMuY2xlYXIoKTtcbiAgICBpZiAodHlwZW9mIFJlc2l6ZU9ic2VydmVyICE9PSAndW5kZWZpbmVkJyAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgbG9vcExpbWl0RXhjZWVkZWRFcnJvckhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgc3RyZWFtIG9mIHJlc2l6ZSBldmVudHMgZm9yIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudCBhbmQgYm94IHR5cGUuXG4gICAqIEBwYXJhbSB0YXJnZXQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgcmVzaXplcy5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0byBwYXNzIHRvIHRoZSBgUmVzaXplT2JzZXJ2ZXJgXG4gICAqIEByZXR1cm4gVGhlIHN0cmVhbSBvZiByZXNpemUgZXZlbnRzIGZvciB0aGUgZWxlbWVudC5cbiAgICovXG4gIG9ic2VydmUodGFyZ2V0OiBFbGVtZW50LCBvcHRpb25zPzogUmVzaXplT2JzZXJ2ZXJPcHRpb25zKTogT2JzZXJ2YWJsZTxSZXNpemVPYnNlcnZlckVudHJ5W10+IHtcbiAgICBjb25zdCBib3ggPSBvcHRpb25zPy5ib3ggfHwgJ2NvbnRlbnQtYm94JztcbiAgICBpZiAoIXRoaXMuX29ic2VydmVycy5oYXMoYm94KSkge1xuICAgICAgdGhpcy5fb2JzZXJ2ZXJzLnNldChib3gsIG5ldyBTaW5nbGVCb3hTaGFyZWRSZXNpemVPYnNlcnZlcihib3gpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX29ic2VydmVycy5nZXQoYm94KSEub2JzZXJ2ZSh0YXJnZXQpO1xuICB9XG59XG4iXX0=