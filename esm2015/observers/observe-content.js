/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/observers/observe-content.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * \@docs-private
 */
export class MutationObserverFactory {
    /**
     * @param {?} callback
     * @return {?}
     */
    create(callback) {
        return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
    }
}
MutationObserverFactory.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */ MutationObserverFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function MutationObserverFactory_Factory() { return new MutationObserverFactory(); }, token: MutationObserverFactory, providedIn: "root" });
/**
 * An injectable service that allows watching elements for changes to their content.
 */
export class ContentObserver {
    /**
     * @param {?} _mutationObserverFactory
     */
    constructor(_mutationObserverFactory) {
        this._mutationObserverFactory = _mutationObserverFactory;
        /**
         * Keeps track of the existing MutationObservers so they can be reused.
         */
        this._observedElements = new Map();
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._observedElements.forEach((/**
         * @param {?} _
         * @param {?} element
         * @return {?}
         */
        (_, element) => this._cleanupObserver(element)));
    }
    /**
     * @param {?} elementOrRef
     * @return {?}
     */
    observe(elementOrRef) {
        /** @type {?} */
        const element = coerceElement(elementOrRef);
        return new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => {
            /** @type {?} */
            const stream = this._observeElement(element);
            /** @type {?} */
            const subscription = stream.subscribe(observer);
            return (/**
             * @return {?}
             */
            () => {
                subscription.unsubscribe();
                this._unobserveElement(element);
            });
        }));
    }
    /**
     * Observes the given element by using the existing MutationObserver if available, or creating a
     * new one if not.
     * @private
     * @param {?} element
     * @return {?}
     */
    _observeElement(element) {
        if (!this._observedElements.has(element)) {
            /** @type {?} */
            const stream = new Subject();
            /** @type {?} */
            const observer = this._mutationObserverFactory.create((/**
             * @param {?} mutations
             * @return {?}
             */
            mutations => stream.next(mutations)));
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
            (/** @type {?} */ (this._observedElements.get(element))).count++;
        }
        return (/** @type {?} */ (this._observedElements.get(element))).stream;
    }
    /**
     * Un-observes the given element and cleans up the underlying MutationObserver if nobody else is
     * observing this element.
     * @private
     * @param {?} element
     * @return {?}
     */
    _unobserveElement(element) {
        if (this._observedElements.has(element)) {
            (/** @type {?} */ (this._observedElements.get(element))).count--;
            if (!(/** @type {?} */ (this._observedElements.get(element))).count) {
                this._cleanupObserver(element);
            }
        }
    }
    /**
     * Clean up the underlying MutationObserver for the specified element.
     * @private
     * @param {?} element
     * @return {?}
     */
    _cleanupObserver(element) {
        if (this._observedElements.has(element)) {
            const { observer, stream } = (/** @type {?} */ (this._observedElements.get(element)));
            if (observer) {
                observer.disconnect();
            }
            stream.complete();
            this._observedElements.delete(element);
        }
    }
}
ContentObserver.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
ContentObserver.ctorParameters = () => [
    { type: MutationObserverFactory }
];
/** @nocollapse */ ContentObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function ContentObserver_Factory() { return new ContentObserver(i0.ɵɵinject(MutationObserverFactory)); }, token: ContentObserver, providedIn: "root" });
if (false) {
    /**
     * Keeps track of the existing MutationObservers so they can be reused.
     * @type {?}
     * @private
     */
    ContentObserver.prototype._observedElements;
    /**
     * @type {?}
     * @private
     */
    ContentObserver.prototype._mutationObserverFactory;
}
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
export class CdkObserveContent {
    /**
     * @param {?} _contentObserver
     * @param {?} _elementRef
     * @param {?} _ngZone
     */
    constructor(_contentObserver, _elementRef, _ngZone) {
        this._contentObserver = _contentObserver;
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
        /**
         * Event emitted for each change in the element's content.
         */
        this.event = new EventEmitter();
        this._disabled = false;
        this._currentSubscription = null;
    }
    /**
     * Whether observing content is disabled. This option can be used
     * to disconnect the underlying MutationObserver until it is needed.
     * @return {?}
     */
    get disabled() { return this._disabled; }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._disabled ? this._unsubscribe() : this._subscribe();
    }
    /**
     * Debounce interval for emitting the changes.
     * @return {?}
     */
    get debounce() { return this._debounce; }
    /**
     * @param {?} value
     * @return {?}
     */
    set debounce(value) {
        this._debounce = coerceNumberProperty(value);
        this._subscribe();
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        if (!this._currentSubscription && !this.disabled) {
            this._subscribe();
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._unsubscribe();
    }
    /**
     * @private
     * @return {?}
     */
    _subscribe() {
        this._unsubscribe();
        /** @type {?} */
        const stream = this._contentObserver.observe(this._elementRef);
        // TODO(mmalerba): We shouldn't be emitting on this @Output() outside the zone.
        // Consider brining it back inside the zone next time we're making breaking changes.
        // Bringing it back inside can cause things like infinite change detection loops and changed
        // after checked errors if people's code isn't handling it properly.
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            this._currentSubscription =
                (this.debounce ? stream.pipe(debounceTime(this.debounce)) : stream).subscribe(this.event);
        }));
    }
    /**
     * @private
     * @return {?}
     */
    _unsubscribe() {
        if (this._currentSubscription) {
            this._currentSubscription.unsubscribe();
        }
    }
}
CdkObserveContent.decorators = [
    { type: Directive, args: [{
                selector: '[cdkObserveContent]',
                exportAs: 'cdkObserveContent',
            },] }
];
/** @nocollapse */
CdkObserveContent.ctorParameters = () => [
    { type: ContentObserver },
    { type: ElementRef },
    { type: NgZone }
];
CdkObserveContent.propDecorators = {
    event: [{ type: Output, args: ['cdkObserveContent',] }],
    disabled: [{ type: Input, args: ['cdkObserveContentDisabled',] }],
    debounce: [{ type: Input }]
};
if (false) {
    /** @type {?} */
    CdkObserveContent.ngAcceptInputType_disabled;
    /** @type {?} */
    CdkObserveContent.ngAcceptInputType_debounce;
    /**
     * Event emitted for each change in the element's content.
     * @type {?}
     */
    CdkObserveContent.prototype.event;
    /**
     * @type {?}
     * @private
     */
    CdkObserveContent.prototype._disabled;
    /**
     * @type {?}
     * @private
     */
    CdkObserveContent.prototype._debounce;
    /**
     * @type {?}
     * @private
     */
    CdkObserveContent.prototype._currentSubscription;
    /**
     * @type {?}
     * @private
     */
    CdkObserveContent.prototype._contentObserver;
    /**
     * @type {?}
     * @private
     */
    CdkObserveContent.prototype._elementRef;
    /**
     * @type {?}
     * @private
     */
    CdkObserveContent.prototype._ngZone;
}
export class ObserversModule {
}
ObserversModule.decorators = [
    { type: NgModule, args: [{
                exports: [CdkObserveContent],
                declarations: [CdkObserveContent],
                providers: [MutationObserverFactory]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZS1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vYnNlcnZlcnMvb2JzZXJ2ZS1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRyxPQUFPLEVBRUwsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLEtBQUssRUFDTCxRQUFRLEVBQ1IsTUFBTSxFQUVOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBeUIsTUFBTSxNQUFNLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7Ozs7QUFPNUMsTUFBTSxPQUFPLHVCQUF1Qjs7Ozs7SUFDbEMsTUFBTSxDQUFDLFFBQTBCO1FBQy9CLE9BQU8sT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6RixDQUFDOzs7WUFKRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7Ozs7QUFVaEMsTUFBTSxPQUFPLGVBQWU7Ozs7SUFRMUIsWUFBb0Isd0JBQWlEO1FBQWpELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBeUI7Ozs7UUFON0Qsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBSS9CLENBQUM7SUFFbUUsQ0FBQzs7OztJQUV6RSxXQUFXO1FBQ1QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU87Ozs7O1FBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEVBQUMs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LEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDakMsU0FBUyxFQUFFLENBQUMsdUJBQXVCLENBQUM7YUFDckMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHksIGNvZXJjZU51bWJlclByb3BlcnR5LCBjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdGFibGUsXG4gIElucHV0LFxuICBOZ01vZHVsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFN1YnNjcmlwdGlvbiwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkZWJvdW5jZVRpbWV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBhIG5ldyBNdXRhdGlvbk9ic2VydmVyIGFuZCBhbGxvd3MgdXMgdG8gc3R1YiBpdCBvdXQgaW4gdW5pdCB0ZXN0cy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTXV0YXRpb25PYnNlcnZlckZhY3Rvcnkge1xuICBjcmVhdGUoY2FsbGJhY2s6IE11dGF0aW9uQ2FsbGJhY2spOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG4gIH1cbn1cblxuXG4vKiogQW4gaW5qZWN0YWJsZSBzZXJ2aWNlIHRoYXQgYWxsb3dzIHdhdGNoaW5nIGVsZW1lbnRzIGZvciBjaGFuZ2VzIHRvIHRoZWlyIGNvbnRlbnQuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDb250ZW50T2JzZXJ2ZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGV4aXN0aW5nIE11dGF0aW9uT2JzZXJ2ZXJzIHNvIHRoZXkgY2FuIGJlIHJldXNlZC4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZWRFbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwge1xuICAgIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCxcbiAgICBzdHJlYW06IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4sXG4gICAgY291bnQ6IG51bWJlclxuICB9PigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX211dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5OiBNdXRhdGlvbk9ic2VydmVyRmFjdG9yeSkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmZvckVhY2goKF8sIGVsZW1lbnQpID0+IHRoaXMuX2NsZWFudXBPYnNlcnZlcihlbGVtZW50KSk7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZSBjb250ZW50IGNoYW5nZXMgb24gYW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgY29udGVudCBjaGFuZ2VzLlxuICAgKi9cbiAgb2JzZXJ2ZShlbGVtZW50OiBFbGVtZW50KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPjtcblxuICAvKipcbiAgICogT2JzZXJ2ZSBjb250ZW50IGNoYW5nZXMgb24gYW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgY29udGVudCBjaGFuZ2VzLlxuICAgKi9cbiAgb2JzZXJ2ZShlbGVtZW50OiBFbGVtZW50UmVmPEVsZW1lbnQ+KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPjtcblxuICBvYnNlcnZlKGVsZW1lbnRPclJlZjogRWxlbWVudCB8IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPE11dGF0aW9uUmVjb3JkW10+IHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50T3JSZWYpO1xuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8TXV0YXRpb25SZWNvcmRbXT4pID0+IHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuX29ic2VydmVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gc3RyZWFtLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl91bm9ic2VydmVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNlcnZlcyB0aGUgZ2l2ZW4gZWxlbWVudCBieSB1c2luZyB0aGUgZXhpc3RpbmcgTXV0YXRpb25PYnNlcnZlciBpZiBhdmFpbGFibGUsIG9yIGNyZWF0aW5nIGFcbiAgICogbmV3IG9uZSBpZiBub3QuXG4gICAqL1xuICBwcml2YXRlIF9vYnNlcnZlRWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogU3ViamVjdDxNdXRhdGlvblJlY29yZFtdPiB7XG4gICAgaWYgKCF0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4oKTtcbiAgICAgIGNvbnN0IG9ic2VydmVyID0gdGhpcy5fbXV0YXRpb25PYnNlcnZlckZhY3RvcnkuY3JlYXRlKG11dGF0aW9ucyA9PiBzdHJlYW0ubmV4dChtdXRhdGlvbnMpKTtcbiAgICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHtcbiAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5zZXQoZWxlbWVudCwge29ic2VydmVyLCBzdHJlYW0sIGNvdW50OiAxfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLnN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbi1vYnNlcnZlcyB0aGUgZ2l2ZW4gZWxlbWVudCBhbmQgY2xlYW5zIHVwIHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgaWYgbm9ib2R5IGVsc2UgaXNcbiAgICogb2JzZXJ2aW5nIHRoaXMgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX3Vub2JzZXJ2ZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLmNvdW50LS07XG4gICAgICBpZiAoIXRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudCkge1xuICAgICAgICB0aGlzLl9jbGVhbnVwT2JzZXJ2ZXIoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIENsZWFuIHVwIHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgZm9yIHRoZSBzcGVjaWZpZWQgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY2xlYW51cE9ic2VydmVyKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IHtvYnNlcnZlciwgc3RyZWFtfSA9IHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpITtcbiAgICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICB9XG4gICAgICBzdHJlYW0uY29tcGxldGUoKTtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZGVsZXRlKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgdHJpZ2dlcnMgYSBjYWxsYmFjayB3aGVuZXZlciB0aGUgY29udGVudCBvZlxuICogaXRzIGFzc29jaWF0ZWQgZWxlbWVudCBoYXMgY2hhbmdlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka09ic2VydmVDb250ZW50XScsXG4gIGV4cG9ydEFzOiAnY2RrT2JzZXJ2ZUNvbnRlbnQnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtPYnNlcnZlQ29udGVudCBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFdmVudCBlbWl0dGVkIGZvciBlYWNoIGNoYW5nZSBpbiB0aGUgZWxlbWVudCdzIGNvbnRlbnQuICovXG4gIEBPdXRwdXQoJ2Nka09ic2VydmVDb250ZW50JykgZXZlbnQgPSBuZXcgRXZlbnRFbWl0dGVyPE11dGF0aW9uUmVjb3JkW10+KCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb2JzZXJ2aW5nIGNvbnRlbnQgaXMgZGlzYWJsZWQuIFRoaXMgb3B0aW9uIGNhbiBiZSB1c2VkXG4gICAqIHRvIGRpc2Nvbm5lY3QgdGhlIHVuZGVybHlpbmcgTXV0YXRpb25PYnNlcnZlciB1bnRpbCBpdCBpcyBuZWVkZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka09ic2VydmVDb250ZW50RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKSB7IHJldHVybiB0aGlzLl9kaXNhYmxlZDsgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGFueSkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kaXNhYmxlZCA/IHRoaXMuX3Vuc3Vic2NyaWJlKCkgOiB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBEZWJvdW5jZSBpbnRlcnZhbCBmb3IgZW1pdHRpbmcgdGhlIGNoYW5nZXMuICovXG4gIEBJbnB1dCgpXG4gIGdldCBkZWJvdW5jZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fZGVib3VuY2U7IH1cbiAgc2V0IGRlYm91bmNlKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9kZWJvdW5jZSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgfVxuICBwcml2YXRlIF9kZWJvdW5jZTogbnVtYmVyO1xuXG4gIHByaXZhdGUgX2N1cnJlbnRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NvbnRlbnRPYnNlcnZlcjogQ29udGVudE9ic2VydmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIGlmICghdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3N1YnNjcmliZSgpIHtcbiAgICB0aGlzLl91bnN1YnNjcmliZSgpO1xuICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuX2NvbnRlbnRPYnNlcnZlci5vYnNlcnZlKHRoaXMuX2VsZW1lbnRSZWYpO1xuXG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZG4ndCBiZSBlbWl0dGluZyBvbiB0aGlzIEBPdXRwdXQoKSBvdXRzaWRlIHRoZSB6b25lLlxuICAgIC8vIENvbnNpZGVyIGJyaW5pbmcgaXQgYmFjayBpbnNpZGUgdGhlIHpvbmUgbmV4dCB0aW1lIHdlJ3JlIG1ha2luZyBicmVha2luZyBjaGFuZ2VzLlxuICAgIC8vIEJyaW5naW5nIGl0IGJhY2sgaW5zaWRlIGNhbiBjYXVzZSB0aGluZ3MgbGlrZSBpbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3BzIGFuZCBjaGFuZ2VkXG4gICAgLy8gYWZ0ZXIgY2hlY2tlZCBlcnJvcnMgaWYgcGVvcGxlJ3MgY29kZSBpc24ndCBoYW5kbGluZyBpdCBwcm9wZXJseS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9XG4gICAgICAgICAgKHRoaXMuZGVib3VuY2UgPyBzdHJlYW0ucGlwZShkZWJvdW5jZVRpbWUodGhpcy5kZWJvdW5jZSkpIDogc3RyZWFtKS5zdWJzY3JpYmUodGhpcy5ldmVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF91bnN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kZWJvdW5jZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG59XG5cblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka09ic2VydmVDb250ZW50XSxcbiAgZGVjbGFyYXRpb25zOiBbQ2RrT2JzZXJ2ZUNvbnRlbnRdLFxuICBwcm92aWRlcnM6IFtNdXRhdGlvbk9ic2VydmVyRmFjdG9yeV1cbn0pXG5leHBvcnQgY2xhc3MgT2JzZXJ2ZXJzTW9kdWxlIHt9XG4iXX0=