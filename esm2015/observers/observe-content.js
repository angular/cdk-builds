import { __decorate, __metadata } from "tslib";
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
let MutationObserverFactory = /** @class */ (() => {
    let MutationObserverFactory = class MutationObserverFactory {
        create(callback) {
            return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
        }
    };
    MutationObserverFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function MutationObserverFactory_Factory() { return new MutationObserverFactory(); }, token: MutationObserverFactory, providedIn: "root" });
    MutationObserverFactory = __decorate([
        Injectable({ providedIn: 'root' })
    ], MutationObserverFactory);
    return MutationObserverFactory;
})();
export { MutationObserverFactory };
/** An injectable service that allows watching elements for changes to their content. */
let ContentObserver = /** @class */ (() => {
    let ContentObserver = class ContentObserver {
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
    };
    ContentObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function ContentObserver_Factory() { return new ContentObserver(i0.ɵɵinject(MutationObserverFactory)); }, token: ContentObserver, providedIn: "root" });
    ContentObserver = __decorate([
        Injectable({ providedIn: 'root' }),
        __metadata("design:paramtypes", [MutationObserverFactory])
    ], ContentObserver);
    return ContentObserver;
})();
export { ContentObserver };
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
let CdkObserveContent = /** @class */ (() => {
    let CdkObserveContent = class CdkObserveContent {
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
            if (this._currentSubscription) {
                this._currentSubscription.unsubscribe();
            }
        }
    };
    __decorate([
        Output('cdkObserveContent'),
        __metadata("design:type", Object)
    ], CdkObserveContent.prototype, "event", void 0);
    __decorate([
        Input('cdkObserveContentDisabled'),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], CdkObserveContent.prototype, "disabled", null);
    __decorate([
        Input(),
        __metadata("design:type", Number),
        __metadata("design:paramtypes", [Number])
    ], CdkObserveContent.prototype, "debounce", null);
    CdkObserveContent = __decorate([
        Directive({
            selector: '[cdkObserveContent]',
            exportAs: 'cdkObserveContent',
        }),
        __metadata("design:paramtypes", [ContentObserver,
            ElementRef,
            NgZone])
    ], CdkObserveContent);
    return CdkObserveContent;
})();
export { CdkObserveContent };
let ObserversModule = /** @class */ (() => {
    let ObserversModule = class ObserversModule {
    };
    ObserversModule = __decorate([
        NgModule({
            exports: [CdkObserveContent],
            declarations: [CdkObserveContent],
            providers: [MutationObserverFactory]
        })
    ], ObserversModule);
    return ObserversModule;
})();
export { ObserversModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZS1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vYnNlcnZlcnMvb2JzZXJ2ZS1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixhQUFhLEVBRWQsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBRUwsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLEtBQUssRUFDTCxRQUFRLEVBQ1IsTUFBTSxFQUVOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBeUIsTUFBTSxNQUFNLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDOztBQUU1Qzs7O0dBR0c7QUFFSDtJQUFBLElBQWEsdUJBQXVCLEdBQXBDLE1BQWEsdUJBQXVCO1FBQ2xDLE1BQU0sQ0FBQyxRQUEwQjtZQUMvQixPQUFPLE9BQU8sZ0JBQWdCLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekYsQ0FBQztLQUNGLENBQUE7O0lBSlksdUJBQXVCO1FBRG5DLFVBQVUsQ0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMsQ0FBQztPQUNwQix1QkFBdUIsQ0FJbkM7a0NBdENEO0tBc0NDO1NBSlksdUJBQXVCO0FBT3BDLHdGQUF3RjtBQUV4RjtJQUFBLElBQWEsZUFBZSxHQUE1QixNQUFhLGVBQWU7UUFRMUIsWUFBb0Isd0JBQWlEO1lBQWpELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBeUI7WUFQckUsMkVBQTJFO1lBQ25FLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUkvQixDQUFDO1FBRW1FLENB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U0FDOUIsQ0FBQzt5Q0E0QnNDLGVBQWU7WUFDcEIsVUFBVTtZQUNkLE1BQU07T0E3QnhCLGlCQUFpQixDQStEN0I7SUFBRCx3QkFBQztLQUFBO1NBL0RZLGlCQUFpQjtBQXVFOUI7SUFBQSxJQUFhLGVBQWUsR0FBNUIsTUFBYSxlQUFlO0tBQUcsQ0FBQTtJQUFsQixlQUFlO1FBTDNCLFFBQVEsQ0FBQztZQUNSLE9BQU8sRUFBRSxDQUFDLGlCQUFpQixDQUFDO1lBQzVCLFlBQVksRUFBRSxDQUFDLGlCQUFpQixDQUFDO1lBQ2pDLFNBQVMsRUFBRSxDQUFDLHVCQUF1QixDQUFDO1NBQ3JDLENBQUM7T0FDVyxlQUFlLENBQUc7SUFBRCxzQkFBQztLQUFBO1NBQWxCLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgY29lcmNlRWxlbWVudCxcbiAgQm9vbGVhbklucHV0XG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRJbml0LFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0YWJsZSxcbiAgSW5wdXQsXG4gIE5nTW9kdWxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3V0cHV0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgU3Vic2NyaXB0aW9uLCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2RlYm91bmNlVGltZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKipcbiAqIEZhY3RvcnkgdGhhdCBjcmVhdGVzIGEgbmV3IE11dGF0aW9uT2JzZXJ2ZXIgYW5kIGFsbG93cyB1cyB0byBzdHViIGl0IG91dCBpbiB1bml0IHRlc3RzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBNdXRhdGlvbk9ic2VydmVyRmFjdG9yeSB7XG4gIGNyZWF0ZShjYWxsYmFjazogTXV0YXRpb25DYWxsYmFjayk6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNhbGxiYWNrKTtcbiAgfVxufVxuXG5cbi8qKiBBbiBpbmplY3RhYmxlIHNlcnZpY2UgdGhhdCBhbGxvd3Mgd2F0Y2hpbmcgZWxlbWVudHMgZm9yIGNoYW5nZXMgdG8gdGhlaXIgY29udGVudC4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENvbnRlbnRPYnNlcnZlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgZXhpc3RpbmcgTXV0YXRpb25PYnNlcnZlcnMgc28gdGhleSBjYW4gYmUgcmV1c2VkLiAqL1xuICBwcml2YXRlIF9vYnNlcnZlZEVsZW1lbnRzID0gbmV3IE1hcDxFbGVtZW50LCB7XG4gICAgb2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsLFxuICAgIHN0cmVhbTogU3ViamVjdDxNdXRhdGlvblJlY29yZFtdPixcbiAgICBjb3VudDogbnVtYmVyXG4gIH0+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbXV0YXRpb25PYnNlcnZlckZhY3Rvcnk6IE11dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5KSB7fVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZm9yRWFjaCgoXywgZWxlbWVudCkgPT4gdGhpcy5fY2xlYW51cE9ic2VydmVyKGVsZW1lbnQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNlcnZlIGNvbnRlbnQgY2hhbmdlcyBvbiBhbiBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBvYnNlcnZlIGZvciBjb250ZW50IGNoYW5nZXMuXG4gICAqL1xuICBvYnNlcnZlKGVsZW1lbnQ6IEVsZW1lbnQpOiBPYnNlcnZhYmxlPE11dGF0aW9uUmVjb3JkW10+O1xuXG4gIC8qKlxuICAgKiBPYnNlcnZlIGNvbnRlbnQgY2hhbmdlcyBvbiBhbiBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBvYnNlcnZlIGZvciBjb250ZW50IGNoYW5nZXMuXG4gICAqL1xuICBvYnNlcnZlKGVsZW1lbnQ6IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPE11dGF0aW9uUmVjb3JkW10+O1xuXG4gIG9ic2VydmUoZWxlbWVudE9yUmVmOiBFbGVtZW50IHwgRWxlbWVudFJlZjxFbGVtZW50Pik6IE9ic2VydmFibGU8TXV0YXRpb25SZWNvcmRbXT4ge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnRPclJlZik7XG5cbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxNdXRhdGlvblJlY29yZFtdPikgPT4ge1xuICAgICAgY29uc3Qgc3RyZWFtID0gdGhpcy5fb2JzZXJ2ZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBzdHJlYW0uc3Vic2NyaWJlKG9ic2VydmVyKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX3Vub2JzZXJ2ZUVsZW1lbnQoZWxlbWVudCk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9ic2VydmVzIHRoZSBnaXZlbiBlbGVtZW50IGJ5IHVzaW5nIHRoZSBleGlzdGluZyBNdXRhdGlvbk9ic2VydmVyIGlmIGF2YWlsYWJsZSwgb3IgY3JlYXRpbmcgYVxuICAgKiBuZXcgb25lIGlmIG5vdC5cbiAgICovXG4gIHByaXZhdGUgX29ic2VydmVFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBTdWJqZWN0PE11dGF0aW9uUmVjb3JkW10+IHtcbiAgICBpZiAoIXRoaXMuX29ic2VydmVkRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICBjb25zdCBzdHJlYW0gPSBuZXcgU3ViamVjdDxNdXRhdGlvblJlY29yZFtdPigpO1xuICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSB0aGlzLl9tdXRhdGlvbk9ic2VydmVyRmFjdG9yeS5jcmVhdGUobXV0YXRpb25zID0+IHN0cmVhbS5uZXh0KG11dGF0aW9ucykpO1xuICAgICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoZWxlbWVudCwge1xuICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLnNldChlbGVtZW50LCB7b2JzZXJ2ZXIsIHN0cmVhbSwgY291bnQ6IDF9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLmNvdW50Kys7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSEuc3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuLW9ic2VydmVzIHRoZSBnaXZlbiBlbGVtZW50IGFuZCBjbGVhbnMgdXAgdGhlIHVuZGVybHlpbmcgTXV0YXRpb25PYnNlcnZlciBpZiBub2JvZHkgZWxzZSBpc1xuICAgKiBvYnNlcnZpbmcgdGhpcyBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfdW5vYnNlcnZlRWxlbWVudChlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX29ic2VydmVkRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSEuY291bnQtLTtcbiAgICAgIGlmICghdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLmNvdW50KSB7XG4gICAgICAgIHRoaXMuX2NsZWFudXBPYnNlcnZlcihlbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYW4gdXAgdGhlIHVuZGVybHlpbmcgTXV0YXRpb25PYnNlcnZlciBmb3IgdGhlIHNwZWNpZmllZCBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jbGVhbnVwT2JzZXJ2ZXIoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgY29uc3Qge29ic2VydmVyLCBzdHJlYW19ID0gdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhO1xuICAgICAgaWYgKG9ic2VydmVyKSB7XG4gICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIH1cbiAgICAgIHN0cmVhbS5jb21wbGV0ZSgpO1xuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5kZWxldGUoZWxlbWVudCk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBEaXJlY3RpdmUgdGhhdCB0cmlnZ2VycyBhIGNhbGxiYWNrIHdoZW5ldmVyIHRoZSBjb250ZW50IG9mXG4gKiBpdHMgYXNzb2NpYXRlZCBlbGVtZW50IGhhcyBjaGFuZ2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrT2JzZXJ2ZUNvbnRlbnRdJyxcbiAgZXhwb3J0QXM6ICdjZGtPYnNlcnZlQ29udGVudCcsXG59KVxuZXhwb3J0IGNsYXNzIENka09ic2VydmVDb250ZW50IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEV2ZW50IGVtaXR0ZWQgZm9yIGVhY2ggY2hhbmdlIGluIHRoZSBlbGVtZW50J3MgY29udGVudC4gKi9cbiAgQE91dHB1dCgnY2RrT2JzZXJ2ZUNvbnRlbnQnKSBldmVudCA9IG5ldyBFdmVudEVtaXR0ZXI8TXV0YXRpb25SZWNvcmRbXT4oKTtcblxuICAvKipcbiAgICogV2hldGhlciBvYnNlcnZpbmcgY29udGVudCBpcyBkaXNhYmxlZC4gVGhpcyBvcHRpb24gY2FuIGJlIHVzZWRcbiAgICogdG8gZGlzY29ubmVjdCB0aGUgdW5kZXJseWluZyBNdXRhdGlvbk9ic2VydmVyIHVudGlsIGl0IGlzIG5lZWRlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrT2JzZXJ2ZUNvbnRlbnREaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX2Rpc2FibGVkID8gdGhpcy5fdW5zdWJzY3JpYmUoKSA6IHRoaXMuX3N1YnNjcmliZSgpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIERlYm91bmNlIGludGVydmFsIGZvciBlbWl0dGluZyB0aGUgY2hhbmdlcy4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGRlYm91bmNlKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9kZWJvdW5jZTsgfVxuICBzZXQgZGVib3VuY2UodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2RlYm91bmNlID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3N1YnNjcmliZSgpO1xuICB9XG4gIHByaXZhdGUgX2RlYm91bmNlOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBfY3VycmVudFN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfY29udGVudE9ic2VydmVyOiBDb250ZW50T2JzZXJ2ZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge31cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgaWYgKCF0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uICYmICF0aGlzLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl91bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlKCkge1xuICAgIHRoaXMuX3Vuc3Vic2NyaWJlKCk7XG4gICAgY29uc3Qgc3RyZWFtID0gdGhpcy5fY29udGVudE9ic2VydmVyLm9ic2VydmUodGhpcy5fZWxlbWVudFJlZik7XG5cbiAgICAvLyBUT0RPKG1tYWxlcmJhKTogV2Ugc2hvdWxkbid0IGJlIGVtaXR0aW5nIG9uIHRoaXMgQE91dHB1dCgpIG91dHNpZGUgdGhlIHpvbmUuXG4gICAgLy8gQ29uc2lkZXIgYnJpbmluZyBpdCBiYWNrIGluc2lkZSB0aGUgem9uZSBuZXh0IHRpbWUgd2UncmUgbWFraW5nIGJyZWFraW5nIGNoYW5nZXMuXG4gICAgLy8gQnJpbmdpbmcgaXQgYmFjayBpbnNpZGUgY2FuIGNhdXNlIHRoaW5ncyBsaWtlIGluZmluaXRlIGNoYW5nZSBkZXRlY3Rpb24gbG9vcHMgYW5kIGNoYW5nZWRcbiAgICAvLyBhZnRlciBjaGVja2VkIGVycm9ycyBpZiBwZW9wbGUncyBjb2RlIGlzbid0IGhhbmRsaW5nIGl0IHByb3Blcmx5LlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uID1cbiAgICAgICAgICAodGhpcy5kZWJvdW5jZSA/IHN0cmVhbS5waXBlKGRlYm91bmNlVGltZSh0aGlzLmRlYm91bmNlKSkgOiBzdHJlYW0pLnN1YnNjcmliZSh0aGlzLmV2ZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Vuc3Vic2NyaWJlKCkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9jdXJyZW50U3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kZWJvdW5jZTogQm9vbGVhbklucHV0O1xufVxuXG5cbkBOZ01vZHVsZSh7XG4gIGV4cG9ydHM6IFtDZGtPYnNlcnZlQ29udGVudF0sXG4gIGRlY2xhcmF0aW9uczogW0Nka09ic2VydmVDb250ZW50XSxcbiAgcHJvdmlkZXJzOiBbTXV0YXRpb25PYnNlcnZlckZhY3RvcnldXG59KVxuZXhwb3J0IGNsYXNzIE9ic2VydmVyc01vZHVsZSB7fVxuIl19