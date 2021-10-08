/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty, coerceNumberProperty, coerceElement } from '@angular/cdk/coercion';
import { Directive, ElementRef, EventEmitter, Injectable, Input, NgModule, NgZone, Output, } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as i0 from "@angular/core";
/**
 * Factory that creates a new MutationObserver and allows us to stub it out in unit tests.
 * @docs-private
 */
export class MutationObserverFactory {
    create(callback) {
        return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
    }
}
MutationObserverFactory.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: MutationObserverFactory, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
MutationObserverFactory.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: MutationObserverFactory, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: MutationObserverFactory, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
/** An injectable service that allows watching elements for changes to their content. */
export class ContentObserver {
    constructor(_mutationObserverFactory) {
        this._mutationObserverFactory = _mutationObserverFactory;
        /** Keeps track of the existing MutationObservers so they can be reused. */
        this._observedElements = new Map();
    }
    ngOnDestroy() {
        this._observedElements.forEach((_, element) => this._cleanupObserver(element));
    }
    observe(elementOrRef) {
        const element = coerceElement(elementOrRef);
        return new Observable((observer) => {
            const stream = this._observeElement(element);
            const subscription = stream.subscribe(observer);
            return () => {
                subscription.unsubscribe();
                this._unobserveElement(element);
            };
        });
    }
    /**
     * Observes the given element by using the existing MutationObserver if available, or creating a
     * new one if not.
     */
    _observeElement(element) {
        if (!this._observedElements.has(element)) {
            const stream = new Subject();
            const observer = this._mutationObserverFactory.create(mutations => stream.next(mutations));
            if (observer) {
                observer.observe(element, {
                    characterData: true,
                    childList: true,
                    subtree: true
                });
            }
            this._observedElements.set(element, { observer, stream, count: 1 });
        }
        else {
            this._observedElements.get(element).count++;
        }
        return this._observedElements.get(element).stream;
    }
    /**
     * Un-observes the given element and cleans up the underlying MutationObserver if nobody else is
     * observing this element.
     */
    _unobserveElement(element) {
        if (this._observedElements.has(element)) {
            this._observedElements.get(element).count--;
            if (!this._observedElements.get(element).count) {
                this._cleanupObserver(element);
            }
        }
    }
    /** Clean up the underlying MutationObserver for the specified element. */
    _cleanupObserver(element) {
        if (this._observedElements.has(element)) {
            const { observer, stream } = this._observedElements.get(element);
            if (observer) {
                observer.disconnect();
            }
            stream.complete();
            this._observedElements.delete(element);
        }
    }
}
ContentObserver.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ContentObserver, deps: [{ token: MutationObserverFactory }], target: i0.ɵɵFactoryTarget.Injectable });
ContentObserver.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ContentObserver, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ContentObserver, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: MutationObserverFactory }]; } });
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
export class CdkObserveContent {
    constructor(_contentObserver, _elementRef, _ngZone) {
        this._contentObserver = _contentObserver;
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
        /** Event emitted for each change in the element's content. */
        this.event = new EventEmitter();
        this._disabled = false;
        this._currentSubscription = null;
    }
    /**
     * Whether observing content is disabled. This option can be used
     * to disconnect the underlying MutationObserver until it is needed.
     */
    get disabled() { return this._disabled; }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._disabled ? this._unsubscribe() : this._subscribe();
    }
    /** Debounce interval for emitting the changes. */
    get debounce() { return this._debounce; }
    set debounce(value) {
        this._debounce = coerceNumberProperty(value);
        this._subscribe();
    }
    ngAfterContentInit() {
        if (!this._currentSubscription && !this.disabled) {
            this._subscribe();
        }
    }
    ngOnDestroy() {
        this._unsubscribe();
    }
    _subscribe() {
        this._unsubscribe();
        const stream = this._contentObserver.observe(this._elementRef);
        // TODO(mmalerba): We shouldn't be emitting on this @Output() outside the zone.
        // Consider brining it back inside the zone next time we're making breaking changes.
        // Bringing it back inside can cause things like infinite change detection loops and changed
        // after checked errors if people's code isn't handling it properly.
        this._ngZone.runOutsideAngular(() => {
            this._currentSubscription =
                (this.debounce ? stream.pipe(debounceTime(this.debounce)) : stream).subscribe(this.event);
        });
    }
    _unsubscribe() {
        this._currentSubscription?.unsubscribe();
    }
}
CdkObserveContent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkObserveContent, deps: [{ token: ContentObserver }, { token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive });
CdkObserveContent.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkObserveContent, selector: "[cdkObserveContent]", inputs: { disabled: ["cdkObserveContentDisabled", "disabled"], debounce: "debounce" }, outputs: { event: "cdkObserveContent" }, exportAs: ["cdkObserveContent"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkObserveContent, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkObserveContent]',
                    exportAs: 'cdkObserveContent',
                }]
        }], ctorParameters: function () { return [{ type: ContentObserver }, { type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { event: [{
                type: Output,
                args: ['cdkObserveContent']
            }], disabled: [{
                type: Input,
                args: ['cdkObserveContentDisabled']
            }], debounce: [{
                type: Input
            }] } });
export class ObserversModule {
}
ObserversModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ObserversModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
ObserversModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ObserversModule, declarations: [CdkObserveContent], exports: [CdkObserveContent] });
ObserversModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ObserversModule, providers: [MutationObserverFactory] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ObserversModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: [CdkObserveContent],
                    declarations: [CdkObserveContent],
                    providers: [MutationObserverFactory]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZS1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vYnNlcnZlcnMvb2JzZXJ2ZS1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLGFBQWEsRUFHZCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFFTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBRU4sTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUF5QixNQUFNLE1BQU0sQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7O0FBRTVDOzs7R0FHRztBQUVILE1BQU0sT0FBTyx1QkFBdUI7SUFDbEMsTUFBTSxDQUFDLFFBQTBCO1FBQy9CLE9BQU8sT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6RixDQUFDOzs0SEFIVSx1QkFBdUI7Z0lBQXZCLHVCQUF1QixjQURYLE1BQU07bUdBQ2xCLHVCQUF1QjtrQkFEbkMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7O0FBUWhDLHdGQUF3RjtBQUV4RixNQUFNLE9BQU8sZUFBZTtJQVExQixZQUFvQix3QkFBaUQ7UUFBakQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUF5QjtRQVByRSwyRUFBMkU7UUFDbkUsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBSS9CLENBQUM7SUFFbUUsQ0FBQztJQUV6RSxXQUFXO1FBQ1QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxD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QUF1QixDQUFDO21HQUV6QixlQUFlO2tCQUwzQixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLGlCQUFpQixDQUFDO29CQUM1QixZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztvQkFDakMsU0FBUyxFQUFFLENBQUMsdUJBQXVCLENBQUM7aUJBQ3JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIGNvZXJjZUVsZW1lbnQsXG4gIEJvb2xlYW5JbnB1dCxcbiAgTnVtYmVySW5wdXRcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudEluaXQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3RhYmxlLFxuICBJbnB1dCxcbiAgTmdNb2R1bGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBTdWJzY3JpcHRpb24sIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZGVib3VuY2VUaW1lfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgYSBuZXcgTXV0YXRpb25PYnNlcnZlciBhbmQgYWxsb3dzIHVzIHRvIHN0dWIgaXQgb3V0IGluIHVuaXQgdGVzdHMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE11dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5IHtcbiAgY3JlYXRlKGNhbGxiYWNrOiBNdXRhdGlvbkNhbGxiYWNrKTogTXV0YXRpb25PYnNlcnZlciB8IG51bGwge1xuICAgIHJldHVybiB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xuICB9XG59XG5cblxuLyoqIEFuIGluamVjdGFibGUgc2VydmljZSB0aGF0IGFsbG93cyB3YXRjaGluZyBlbGVtZW50cyBmb3IgY2hhbmdlcyB0byB0aGVpciBjb250ZW50LiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ29udGVudE9ic2VydmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBleGlzdGluZyBNdXRhdGlvbk9ic2VydmVycyBzbyB0aGV5IGNhbiBiZSByZXVzZWQuICovXG4gIHByaXZhdGUgX29ic2VydmVkRWxlbWVudHMgPSBuZXcgTWFwPEVsZW1lbnQsIHtcbiAgICBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGwsXG4gICAgcmVhZG9ubHkgc3RyZWFtOiBTdWJqZWN0PE11dGF0aW9uUmVjb3JkW10+LFxuICAgIGNvdW50OiBudW1iZXJcbiAgfT4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tdXRhdGlvbk9ic2VydmVyRmFjdG9yeTogTXV0YXRpb25PYnNlcnZlckZhY3RvcnkpIHt9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5mb3JFYWNoKChfLCBlbGVtZW50KSA9PiB0aGlzLl9jbGVhbnVwT2JzZXJ2ZXIoZWxlbWVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9ic2VydmUgY29udGVudCBjaGFuZ2VzIG9uIGFuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG9ic2VydmUgZm9yIGNvbnRlbnQgY2hhbmdlcy5cbiAgICovXG4gIG9ic2VydmUoZWxlbWVudDogRWxlbWVudCk6IE9ic2VydmFibGU8TXV0YXRpb25SZWNvcmRbXT47XG5cbiAgLyoqXG4gICAqIE9ic2VydmUgY29udGVudCBjaGFuZ2VzIG9uIGFuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG9ic2VydmUgZm9yIGNvbnRlbnQgY2hhbmdlcy5cbiAgICovXG4gIG9ic2VydmUoZWxlbWVudDogRWxlbWVudFJlZjxFbGVtZW50Pik6IE9ic2VydmFibGU8TXV0YXRpb25SZWNvcmRbXT47XG5cbiAgb2JzZXJ2ZShlbGVtZW50T3JSZWY6IEVsZW1lbnQgfCBFbGVtZW50UmVmPEVsZW1lbnQ+KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPiB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudE9yUmVmKTtcblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPE11dGF0aW9uUmVjb3JkW10+KSA9PiB7XG4gICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLl9vYnNlcnZlRWxlbWVudChlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHN0cmVhbS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fdW5vYnNlcnZlRWxlbWVudChlbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZXMgdGhlIGdpdmVuIGVsZW1lbnQgYnkgdXNpbmcgdGhlIGV4aXN0aW5nIE11dGF0aW9uT2JzZXJ2ZXIgaWYgYXZhaWxhYmxlLCBvciBjcmVhdGluZyBhXG4gICAqIG5ldyBvbmUgaWYgbm90LlxuICAgKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4ge1xuICAgIGlmICghdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBTdWJqZWN0PE11dGF0aW9uUmVjb3JkW10+KCk7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IHRoaXMuX211dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5LmNyZWF0ZShtdXRhdGlvbnMgPT4gc3RyZWFtLm5leHQobXV0YXRpb25zKSk7XG4gICAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50LCB7XG4gICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuc2V0KGVsZW1lbnQsIHtvYnNlcnZlciwgc3RyZWFtLCBjb3VudDogMX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSEuY291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5zdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogVW4tb2JzZXJ2ZXMgdGhlIGdpdmVuIGVsZW1lbnQgYW5kIGNsZWFucyB1cCB0aGUgdW5kZXJseWluZyBNdXRhdGlvbk9ic2VydmVyIGlmIG5vYm9keSBlbHNlIGlzXG4gICAqIG9ic2VydmluZyB0aGlzIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF91bm9ic2VydmVFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudC0tO1xuICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSEuY291bnQpIHtcbiAgICAgICAgdGhpcy5fY2xlYW51cE9ic2VydmVyKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhbiB1cCB0aGUgdW5kZXJseWluZyBNdXRhdGlvbk9ic2VydmVyIGZvciB0aGUgc3BlY2lmaWVkIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NsZWFudXBPYnNlcnZlcihlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX29ic2VydmVkRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICBjb25zdCB7b2JzZXJ2ZXIsIHN0cmVhbX0gPSB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSE7XG4gICAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuICAgICAgc3RyZWFtLmNvbXBsZXRlKCk7XG4gICAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmRlbGV0ZShlbGVtZW50KTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IHRyaWdnZXJzIGEgY2FsbGJhY2sgd2hlbmV2ZXIgdGhlIGNvbnRlbnQgb2ZcbiAqIGl0cyBhc3NvY2lhdGVkIGVsZW1lbnQgaGFzIGNoYW5nZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtPYnNlcnZlQ29udGVudF0nLFxuICBleHBvcnRBczogJ2Nka09ic2VydmVDb250ZW50Jyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT2JzZXJ2ZUNvbnRlbnQgaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRXZlbnQgZW1pdHRlZCBmb3IgZWFjaCBjaGFuZ2UgaW4gdGhlIGVsZW1lbnQncyBjb250ZW50LiAqL1xuICBAT3V0cHV0KCdjZGtPYnNlcnZlQ29udGVudCcpIHJlYWRvbmx5IGV2ZW50ID0gbmV3IEV2ZW50RW1pdHRlcjxNdXRhdGlvblJlY29yZFtdPigpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9ic2VydmluZyBjb250ZW50IGlzIGRpc2FibGVkLiBUaGlzIG9wdGlvbiBjYW4gYmUgdXNlZFxuICAgKiB0byBkaXNjb25uZWN0IHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgdW50aWwgaXQgaXMgbmVlZGVkLlxuICAgKi9cbiAgQElucHV0KCdjZGtPYnNlcnZlQ29udGVudERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCkgeyByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7IH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fZGlzYWJsZWQgPyB0aGlzLl91bnN1YnNjcmliZSgpIDogdGhpcy5fc3Vic2NyaWJlKCk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogRGVib3VuY2UgaW50ZXJ2YWwgZm9yIGVtaXR0aW5nIHRoZSBjaGFuZ2VzLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZGVib3VuY2UoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2RlYm91bmNlOyB9XG4gIHNldCBkZWJvdW5jZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fZGVib3VuY2UgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc3Vic2NyaWJlKCk7XG4gIH1cbiAgcHJpdmF0ZSBfZGVib3VuY2U6IG51bWJlcjtcblxuICBwcml2YXRlIF9jdXJyZW50U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb250ZW50T2JzZXJ2ZXI6IENvbnRlbnRPYnNlcnZlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7fVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICBpZiAoIXRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gJiYgIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3Vuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBwcml2YXRlIF9zdWJzY3JpYmUoKSB7XG4gICAgdGhpcy5fdW5zdWJzY3JpYmUoKTtcbiAgICBjb25zdCBzdHJlYW0gPSB0aGlzLl9jb250ZW50T2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLl9lbGVtZW50UmVmKTtcblxuICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGRuJ3QgYmUgZW1pdHRpbmcgb24gdGhpcyBAT3V0cHV0KCkgb3V0c2lkZSB0aGUgem9uZS5cbiAgICAvLyBDb25zaWRlciBicmluaW5nIGl0IGJhY2sgaW5zaWRlIHRoZSB6b25lIG5leHQgdGltZSB3ZSdyZSBtYWtpbmcgYnJlYWtpbmcgY2hhbmdlcy5cbiAgICAvLyBCcmluZ2luZyBpdCBiYWNrIGluc2lkZSBjYW4gY2F1c2UgdGhpbmdzIGxpa2UgaW5maW5pdGUgY2hhbmdlIGRldGVjdGlvbiBsb29wcyBhbmQgY2hhbmdlZFxuICAgIC8vIGFmdGVyIGNoZWNrZWQgZXJyb3JzIGlmIHBlb3BsZSdzIGNvZGUgaXNuJ3QgaGFuZGxpbmcgaXQgcHJvcGVybHkuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPVxuICAgICAgICAgICh0aGlzLmRlYm91bmNlID8gc3RyZWFtLnBpcGUoZGVib3VuY2VUaW1lKHRoaXMuZGVib3VuY2UpKSA6IHN0cmVhbSkuc3Vic2NyaWJlKHRoaXMuZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfdW5zdWJzY3JpYmUoKSB7XG4gICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGVib3VuY2U6IE51bWJlcklucHV0O1xufVxuXG5cbkBOZ01vZHVsZSh7XG4gIGV4cG9ydHM6IFtDZGtPYnNlcnZlQ29udGVudF0sXG4gIGRlY2xhcmF0aW9uczogW0Nka09ic2VydmVDb250ZW50XSxcbiAgcHJvdmlkZXJzOiBbTXV0YXRpb25PYnNlcnZlckZhY3RvcnldXG59KVxuZXhwb3J0IGNsYXNzIE9ic2VydmVyc01vZHVsZSB7fVxuIl19