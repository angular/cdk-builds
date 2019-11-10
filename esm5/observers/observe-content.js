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
var MutationObserverFactory = /** @class */ (function () {
    function MutationObserverFactory() {
    }
    MutationObserverFactory.prototype.create = function (callback) {
        return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
    };
    MutationObserverFactory.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    MutationObserverFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function MutationObserverFactory_Factory() { return new MutationObserverFactory(); }, token: MutationObserverFactory, providedIn: "root" });
    return MutationObserverFactory;
}());
export { MutationObserverFactory };
/** An injectable service that allows watching elements for changes to their content. */
var ContentObserver = /** @class */ (function () {
    function ContentObserver(_mutationObserverFactory) {
        this._mutationObserverFactory = _mutationObserverFactory;
        /** Keeps track of the existing MutationObservers so they can be reused. */
        this._observedElements = new Map();
    }
    ContentObserver.prototype.ngOnDestroy = function () {
        var _this = this;
        this._observedElements.forEach(function (_, element) { return _this._cleanupObserver(element); });
    };
    ContentObserver.prototype.observe = function (elementOrRef) {
        var _this = this;
        var element = coerceElement(elementOrRef);
        return new Observable(function (observer) {
            var stream = _this._observeElement(element);
            var subscription = stream.subscribe(observer);
            return function () {
                subscription.unsubscribe();
                _this._unobserveElement(element);
            };
        });
    };
    /**
     * Observes the given element by using the existing MutationObserver if available, or creating a
     * new one if not.
     */
    ContentObserver.prototype._observeElement = function (element) {
        if (!this._observedElements.has(element)) {
            var stream_1 = new Subject();
            var observer = this._mutationObserverFactory.create(function (mutations) { return stream_1.next(mutations); });
            if (observer) {
                observer.observe(element, {
                    characterData: true,
                    childList: true,
                    subtree: true
                });
            }
            this._observedElements.set(element, { observer: observer, stream: stream_1, count: 1 });
        }
        else {
            this._observedElements.get(element).count++;
        }
        return this._observedElements.get(element).stream;
    };
    /**
     * Un-observes the given element and cleans up the underlying MutationObserver if nobody else is
     * observing this element.
     */
    ContentObserver.prototype._unobserveElement = function (element) {
        if (this._observedElements.has(element)) {
            this._observedElements.get(element).count--;
            if (!this._observedElements.get(element).count) {
                this._cleanupObserver(element);
            }
        }
    };
    /** Clean up the underlying MutationObserver for the specified element. */
    ContentObserver.prototype._cleanupObserver = function (element) {
        if (this._observedElements.has(element)) {
            var _a = this._observedElements.get(element), observer = _a.observer, stream = _a.stream;
            if (observer) {
                observer.disconnect();
            }
            stream.complete();
            this._observedElements.delete(element);
        }
    };
    ContentObserver.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ContentObserver.ctorParameters = function () { return [
        { type: MutationObserverFactory }
    ]; };
    ContentObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function ContentObserver_Factory() { return new ContentObserver(i0.ɵɵinject(MutationObserverFactory)); }, token: ContentObserver, providedIn: "root" });
    return ContentObserver;
}());
export { ContentObserver };
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
var CdkObserveContent = /** @class */ (function () {
    function CdkObserveContent(_contentObserver, _elementRef, _ngZone) {
        this._contentObserver = _contentObserver;
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
        /** Event emitted for each change in the element's content. */
        this.event = new EventEmitter();
        this._disabled = false;
        this._currentSubscription = null;
    }
    Object.defineProperty(CdkObserveContent.prototype, "disabled", {
        /**
         * Whether observing content is disabled. This option can be used
         * to disconnect the underlying MutationObserver until it is needed.
         */
        get: function () { return this._disabled; },
        set: function (value) {
            this._disabled = coerceBooleanProperty(value);
            this._disabled ? this._unsubscribe() : this._subscribe();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkObserveContent.prototype, "debounce", {
        /** Debounce interval for emitting the changes. */
        get: function () { return this._debounce; },
        set: function (value) {
            this._debounce = coerceNumberProperty(value);
            this._subscribe();
        },
        enumerable: true,
        configurable: true
    });
    CdkObserveContent.prototype.ngAfterContentInit = function () {
        if (!this._currentSubscription && !this.disabled) {
            this._subscribe();
        }
    };
    CdkObserveContent.prototype.ngOnDestroy = function () {
        this._unsubscribe();
    };
    CdkObserveContent.prototype._subscribe = function () {
        var _this = this;
        this._unsubscribe();
        var stream = this._contentObserver.observe(this._elementRef);
        // TODO(mmalerba): We shouldn't be emitting on this @Output() outside the zone.
        // Consider brining it back inside the zone next time we're making breaking changes.
        // Bringing it back inside can cause things like infinite change detection loops and changed
        // after checked errors if people's code isn't handling it properly.
        this._ngZone.runOutsideAngular(function () {
            _this._currentSubscription =
                (_this.debounce ? stream.pipe(debounceTime(_this.debounce)) : stream).subscribe(_this.event);
        });
    };
    CdkObserveContent.prototype._unsubscribe = function () {
        if (this._currentSubscription) {
            this._currentSubscription.unsubscribe();
        }
    };
    CdkObserveContent.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkObserveContent]',
                    exportAs: 'cdkObserveContent',
                },] }
    ];
    /** @nocollapse */
    CdkObserveContent.ctorParameters = function () { return [
        { type: ContentObserver },
        { type: ElementRef },
        { type: NgZone }
    ]; };
    CdkObserveContent.propDecorators = {
        event: [{ type: Output, args: ['cdkObserveContent',] }],
        disabled: [{ type: Input, args: ['cdkObserveContentDisabled',] }],
        debounce: [{ type: Input }]
    };
    return CdkObserveContent;
}());
export { CdkObserveContent };
var ObserversModule = /** @class */ (function () {
    function ObserversModule() {
    }
    ObserversModule.decorators = [
        { type: NgModule, args: [{
                    exports: [CdkObserveContent],
                    declarations: [CdkObserveContent],
                    providers: [MutationObserverFactory]
                },] }
    ];
    return ObserversModule;
}());
export { ObserversModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZS1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vYnNlcnZlcnMvb2JzZXJ2ZS1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRyxPQUFPLEVBRUwsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLEtBQUssRUFDTCxRQUFRLEVBQ1IsTUFBTSxFQUVOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBeUIsTUFBTSxNQUFNLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDOztBQUU1Qzs7O0dBR0c7QUFDSDtJQUFBO0tBS0M7SUFIQyx3Q0FBTSxHQUFOLFVBQU8sUUFBMEI7UUFDL0IsT0FBTyxPQUFPLGdCQUFnQixLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pGLENBQUM7O2dCQUpGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OztrQ0E1QmhDO0NBaUNDLEFBTEQsSUFLQztTQUpZLHVCQUF1QjtBQU9wQyx3RkFBd0Y7QUFDeEY7SUFTRSx5QkFBb0Isd0JBQWlEO1FBQWpELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBeUI7UUFQckUsMkVBQTJFO1FBQ25FLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUkvQixDQUFDO0lBRW1FLENBQUM7SUFFekUscUNBQVcsR0FBWDtRQUFBLGlCQUVDO1FBREMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFDLENB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QUM1QixZQUFZLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztvQkFDakMsU0FBUyxFQUFFLENBQUMsdUJBQXVCLENBQUM7aUJBQ3JDOztJQUM2QixzQkFBQztDQUFBLEFBTC9CLElBSytCO1NBQWxCLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHksIGNvZXJjZU51bWJlclByb3BlcnR5LCBjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdGFibGUsXG4gIElucHV0LFxuICBOZ01vZHVsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFN1YnNjcmlwdGlvbiwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkZWJvdW5jZVRpbWV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBhIG5ldyBNdXRhdGlvbk9ic2VydmVyIGFuZCBhbGxvd3MgdXMgdG8gc3R1YiBpdCBvdXQgaW4gdW5pdCB0ZXN0cy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTXV0YXRpb25PYnNlcnZlckZhY3Rvcnkge1xuICBjcmVhdGUoY2FsbGJhY2s6IE11dGF0aW9uQ2FsbGJhY2spOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG4gIH1cbn1cblxuXG4vKiogQW4gaW5qZWN0YWJsZSBzZXJ2aWNlIHRoYXQgYWxsb3dzIHdhdGNoaW5nIGVsZW1lbnRzIGZvciBjaGFuZ2VzIHRvIHRoZWlyIGNvbnRlbnQuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDb250ZW50T2JzZXJ2ZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGV4aXN0aW5nIE11dGF0aW9uT2JzZXJ2ZXJzIHNvIHRoZXkgY2FuIGJlIHJldXNlZC4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZWRFbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwge1xuICAgIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCxcbiAgICBzdHJlYW06IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4sXG4gICAgY291bnQ6IG51bWJlclxuICB9PigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX211dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5OiBNdXRhdGlvbk9ic2VydmVyRmFjdG9yeSkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmZvckVhY2goKF8sIGVsZW1lbnQpID0+IHRoaXMuX2NsZWFudXBPYnNlcnZlcihlbGVtZW50KSk7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZSBjb250ZW50IGNoYW5nZXMgb24gYW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgY29udGVudCBjaGFuZ2VzLlxuICAgKi9cbiAgb2JzZXJ2ZShlbGVtZW50OiBFbGVtZW50KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPjtcblxuICAvKipcbiAgICogT2JzZXJ2ZSBjb250ZW50IGNoYW5nZXMgb24gYW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgY29udGVudCBjaGFuZ2VzLlxuICAgKi9cbiAgb2JzZXJ2ZShlbGVtZW50OiBFbGVtZW50UmVmPEVsZW1lbnQ+KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPjtcblxuICBvYnNlcnZlKGVsZW1lbnRPclJlZjogRWxlbWVudCB8IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPE11dGF0aW9uUmVjb3JkW10+IHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50T3JSZWYpO1xuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8TXV0YXRpb25SZWNvcmRbXT4pID0+IHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuX29ic2VydmVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gc3RyZWFtLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl91bm9ic2VydmVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNlcnZlcyB0aGUgZ2l2ZW4gZWxlbWVudCBieSB1c2luZyB0aGUgZXhpc3RpbmcgTXV0YXRpb25PYnNlcnZlciBpZiBhdmFpbGFibGUsIG9yIGNyZWF0aW5nIGFcbiAgICogbmV3IG9uZSBpZiBub3QuXG4gICAqL1xuICBwcml2YXRlIF9vYnNlcnZlRWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogU3ViamVjdDxNdXRhdGlvblJlY29yZFtdPiB7XG4gICAgaWYgKCF0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4oKTtcbiAgICAgIGNvbnN0IG9ic2VydmVyID0gdGhpcy5fbXV0YXRpb25PYnNlcnZlckZhY3RvcnkuY3JlYXRlKG11dGF0aW9ucyA9PiBzdHJlYW0ubmV4dChtdXRhdGlvbnMpKTtcbiAgICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHtcbiAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5zZXQoZWxlbWVudCwge29ic2VydmVyLCBzdHJlYW0sIGNvdW50OiAxfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLnN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbi1vYnNlcnZlcyB0aGUgZ2l2ZW4gZWxlbWVudCBhbmQgY2xlYW5zIHVwIHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgaWYgbm9ib2R5IGVsc2UgaXNcbiAgICogb2JzZXJ2aW5nIHRoaXMgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX3Vub2JzZXJ2ZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLmNvdW50LS07XG4gICAgICBpZiAoIXRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudCkge1xuICAgICAgICB0aGlzLl9jbGVhbnVwT2JzZXJ2ZXIoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIENsZWFuIHVwIHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgZm9yIHRoZSBzcGVjaWZpZWQgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY2xlYW51cE9ic2VydmVyKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IHtvYnNlcnZlciwgc3RyZWFtfSA9IHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpITtcbiAgICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICB9XG4gICAgICBzdHJlYW0uY29tcGxldGUoKTtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZGVsZXRlKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgdHJpZ2dlcnMgYSBjYWxsYmFjayB3aGVuZXZlciB0aGUgY29udGVudCBvZlxuICogaXRzIGFzc29jaWF0ZWQgZWxlbWVudCBoYXMgY2hhbmdlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka09ic2VydmVDb250ZW50XScsXG4gIGV4cG9ydEFzOiAnY2RrT2JzZXJ2ZUNvbnRlbnQnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtPYnNlcnZlQ29udGVudCBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFdmVudCBlbWl0dGVkIGZvciBlYWNoIGNoYW5nZSBpbiB0aGUgZWxlbWVudCdzIGNvbnRlbnQuICovXG4gIEBPdXRwdXQoJ2Nka09ic2VydmVDb250ZW50JykgZXZlbnQgPSBuZXcgRXZlbnRFbWl0dGVyPE11dGF0aW9uUmVjb3JkW10+KCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb2JzZXJ2aW5nIGNvbnRlbnQgaXMgZGlzYWJsZWQuIFRoaXMgb3B0aW9uIGNhbiBiZSB1c2VkXG4gICAqIHRvIGRpc2Nvbm5lY3QgdGhlIHVuZGVybHlpbmcgTXV0YXRpb25PYnNlcnZlciB1bnRpbCBpdCBpcyBuZWVkZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka09ic2VydmVDb250ZW50RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKSB7IHJldHVybiB0aGlzLl9kaXNhYmxlZDsgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGFueSkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kaXNhYmxlZCA/IHRoaXMuX3Vuc3Vic2NyaWJlKCkgOiB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBEZWJvdW5jZSBpbnRlcnZhbCBmb3IgZW1pdHRpbmcgdGhlIGNoYW5nZXMuICovXG4gIEBJbnB1dCgpXG4gIGdldCBkZWJvdW5jZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fZGVib3VuY2U7IH1cbiAgc2V0IGRlYm91bmNlKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9kZWJvdW5jZSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgfVxuICBwcml2YXRlIF9kZWJvdW5jZTogbnVtYmVyO1xuXG4gIHByaXZhdGUgX2N1cnJlbnRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NvbnRlbnRPYnNlcnZlcjogQ29udGVudE9ic2VydmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIGlmICghdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3N1YnNjcmliZSgpIHtcbiAgICB0aGlzLl91bnN1YnNjcmliZSgpO1xuICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuX2NvbnRlbnRPYnNlcnZlci5vYnNlcnZlKHRoaXMuX2VsZW1lbnRSZWYpO1xuXG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZG4ndCBiZSBlbWl0dGluZyBvbiB0aGlzIEBPdXRwdXQoKSBvdXRzaWRlIHRoZSB6b25lLlxuICAgIC8vIENvbnNpZGVyIGJyaW5pbmcgaXQgYmFjayBpbnNpZGUgdGhlIHpvbmUgbmV4dCB0aW1lIHdlJ3JlIG1ha2luZyBicmVha2luZyBjaGFuZ2VzLlxuICAgIC8vIEJyaW5naW5nIGl0IGJhY2sgaW5zaWRlIGNhbiBjYXVzZSB0aGluZ3MgbGlrZSBpbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3BzIGFuZCBjaGFuZ2VkXG4gICAgLy8gYWZ0ZXIgY2hlY2tlZCBlcnJvcnMgaWYgcGVvcGxlJ3MgY29kZSBpc24ndCBoYW5kbGluZyBpdCBwcm9wZXJseS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9XG4gICAgICAgICAgKHRoaXMuZGVib3VuY2UgPyBzdHJlYW0ucGlwZShkZWJvdW5jZVRpbWUodGhpcy5kZWJvdW5jZSkpIDogc3RyZWFtKS5zdWJzY3JpYmUodGhpcy5ldmVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF91bnN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kZWJvdW5jZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG59XG5cblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka09ic2VydmVDb250ZW50XSxcbiAgZGVjbGFyYXRpb25zOiBbQ2RrT2JzZXJ2ZUNvbnRlbnRdLFxuICBwcm92aWRlcnM6IFtNdXRhdGlvbk9ic2VydmVyRmFjdG9yeV1cbn0pXG5leHBvcnQgY2xhc3MgT2JzZXJ2ZXJzTW9kdWxlIHt9XG4iXX0=