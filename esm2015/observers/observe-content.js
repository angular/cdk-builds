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
let MutationObserverFactory = /** @class */ (() => {
    /**
     * Factory that creates a new MutationObserver and allows us to stub it out in unit tests.
     * \@docs-private
     */
    class MutationObserverFactory {
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
    return MutationObserverFactory;
})();
export { MutationObserverFactory };
/**
 * An injectable service that allows watching elements for changes to their content.
 */
let ContentObserver = /** @class */ (() => {
    /**
     * An injectable service that allows watching elements for changes to their content.
     */
    class ContentObserver {
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
    return ContentObserver;
})();
export { ContentObserver };
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
let CdkObserveContent = /** @class */ (() => {
    /**
     * Directive that triggers a callback whenever the content of
     * its associated element has changed.
     */
    class CdkObserveContent {
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
    return CdkObserveContent;
})();
export { CdkObserveContent };
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
let ObserversModule = /** @class */ (() => {
    class ObserversModule {
    }
    ObserversModule.decorators = [
        { type: NgModule, args: [{
                    exports: [CdkObserveContent],
                    declarations: [CdkObserveContent],
                    providers: [MutationObserverFactory]
                },] }
    ];
    return ObserversModule;
})();
export { ObserversModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZS1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vYnNlcnZlcnMvb2JzZXJ2ZS1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLGFBQWEsRUFFZCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFFTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBRU4sTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUF5QixNQUFNLE1BQU0sQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7OztBQU01Qzs7Ozs7SUFBQSxNQUNhLHVCQUF1Qjs7Ozs7UUFDbEMsTUFBTSxDQUFDLFFBQTBCO1lBQy9CLE9BQU8sT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6RixDQUFDOzs7Z0JBSkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7O2tDQWpDaEM7S0FzQ0M7U0FKWSx1QkFBdUI7Ozs7QUFRcEM7Ozs7SUFBQSxNQUNhLGVBQWU7Ozs7UUFRMUIsWUFBb0Isd0JBQWlEO1lBQWpELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBeUI7Ozs7WUFON0Qsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBSS9CLENBQUM7UUFFbUUsQ0FBQzs7OztRQUV6RSxXQUFXO1lBQ1QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU87Ozs7O1lBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJ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QUF5Qzs7Ozs7SUFDekMsd0NBQTRDOzs7OztJQUM1QyxvQ0FBdUI7O0FBcUNyQztJQUFBLE1BS2EsZUFBZTs7O2dCQUwzQixRQUFRLFNBQUM7b0JBQ1IsT0FBTyxFQUFFLENBQUMsaUJBQWlCLENBQUM7b0JBQzVCLFlBQVksRUFBRSxDQUFDLGlCQUFpQixDQUFDO29CQUNqQyxTQUFTLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztpQkFDckM7O0lBQzZCLHNCQUFDO0tBQUE7U0FBbEIsZUFBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBjb2VyY2VFbGVtZW50LFxuICBCb29sZWFuSW5wdXRcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudEluaXQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3RhYmxlLFxuICBJbnB1dCxcbiAgTmdNb2R1bGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBTdWJzY3JpcHRpb24sIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZGVib3VuY2VUaW1lfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgYSBuZXcgTXV0YXRpb25PYnNlcnZlciBhbmQgYWxsb3dzIHVzIHRvIHN0dWIgaXQgb3V0IGluIHVuaXQgdGVzdHMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE11dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5IHtcbiAgY3JlYXRlKGNhbGxiYWNrOiBNdXRhdGlvbkNhbGxiYWNrKTogTXV0YXRpb25PYnNlcnZlciB8IG51bGwge1xuICAgIHJldHVybiB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spO1xuICB9XG59XG5cblxuLyoqIEFuIGluamVjdGFibGUgc2VydmljZSB0aGF0IGFsbG93cyB3YXRjaGluZyBlbGVtZW50cyBmb3IgY2hhbmdlcyB0byB0aGVpciBjb250ZW50LiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ29udGVudE9ic2VydmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBleGlzdGluZyBNdXRhdGlvbk9ic2VydmVycyBzbyB0aGV5IGNhbiBiZSByZXVzZWQuICovXG4gIHByaXZhdGUgX29ic2VydmVkRWxlbWVudHMgPSBuZXcgTWFwPEVsZW1lbnQsIHtcbiAgICBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGwsXG4gICAgc3RyZWFtOiBTdWJqZWN0PE11dGF0aW9uUmVjb3JkW10+LFxuICAgIGNvdW50OiBudW1iZXJcbiAgfT4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tdXRhdGlvbk9ic2VydmVyRmFjdG9yeTogTXV0YXRpb25PYnNlcnZlckZhY3RvcnkpIHt9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5mb3JFYWNoKChfLCBlbGVtZW50KSA9PiB0aGlzLl9jbGVhbnVwT2JzZXJ2ZXIoZWxlbWVudCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9ic2VydmUgY29udGVudCBjaGFuZ2VzIG9uIGFuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG9ic2VydmUgZm9yIGNvbnRlbnQgY2hhbmdlcy5cbiAgICovXG4gIG9ic2VydmUoZWxlbWVudDogRWxlbWVudCk6IE9ic2VydmFibGU8TXV0YXRpb25SZWNvcmRbXT47XG5cbiAgLyoqXG4gICAqIE9ic2VydmUgY29udGVudCBjaGFuZ2VzIG9uIGFuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG9ic2VydmUgZm9yIGNvbnRlbnQgY2hhbmdlcy5cbiAgICovXG4gIG9ic2VydmUoZWxlbWVudDogRWxlbWVudFJlZjxFbGVtZW50Pik6IE9ic2VydmFibGU8TXV0YXRpb25SZWNvcmRbXT47XG5cbiAgb2JzZXJ2ZShlbGVtZW50T3JSZWY6IEVsZW1lbnQgfCBFbGVtZW50UmVmPEVsZW1lbnQ+KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPiB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudE9yUmVmKTtcblxuICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPE11dGF0aW9uUmVjb3JkW10+KSA9PiB7XG4gICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLl9vYnNlcnZlRWxlbWVudChlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHN0cmVhbS5zdWJzY3JpYmUob2JzZXJ2ZXIpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fdW5vYnNlcnZlRWxlbWVudChlbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZXMgdGhlIGdpdmVuIGVsZW1lbnQgYnkgdXNpbmcgdGhlIGV4aXN0aW5nIE11dGF0aW9uT2JzZXJ2ZXIgaWYgYXZhaWxhYmxlLCBvciBjcmVhdGluZyBhXG4gICAqIG5ldyBvbmUgaWYgbm90LlxuICAgKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4ge1xuICAgIGlmICghdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBTdWJqZWN0PE11dGF0aW9uUmVjb3JkW10+KCk7XG4gICAgICBjb25zdCBvYnNlcnZlciA9IHRoaXMuX211dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5LmNyZWF0ZShtdXRhdGlvbnMgPT4gc3RyZWFtLm5leHQobXV0YXRpb25zKSk7XG4gICAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50LCB7XG4gICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuc2V0KGVsZW1lbnQsIHtvYnNlcnZlciwgc3RyZWFtLCBjb3VudDogMX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSEuY291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5zdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogVW4tb2JzZXJ2ZXMgdGhlIGdpdmVuIGVsZW1lbnQgYW5kIGNsZWFucyB1cCB0aGUgdW5kZXJseWluZyBNdXRhdGlvbk9ic2VydmVyIGlmIG5vYm9keSBlbHNlIGlzXG4gICAqIG9ic2VydmluZyB0aGlzIGVsZW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF91bm9ic2VydmVFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudC0tO1xuICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSEuY291bnQpIHtcbiAgICAgICAgdGhpcy5fY2xlYW51cE9ic2VydmVyKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhbiB1cCB0aGUgdW5kZXJseWluZyBNdXRhdGlvbk9ic2VydmVyIGZvciB0aGUgc3BlY2lmaWVkIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NsZWFudXBPYnNlcnZlcihlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX29ic2VydmVkRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgICBjb25zdCB7b2JzZXJ2ZXIsIHN0cmVhbX0gPSB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmdldChlbGVtZW50KSE7XG4gICAgICBpZiAob2JzZXJ2ZXIpIHtcbiAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgfVxuICAgICAgc3RyZWFtLmNvbXBsZXRlKCk7XG4gICAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmRlbGV0ZShlbGVtZW50KTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIERpcmVjdGl2ZSB0aGF0IHRyaWdnZXJzIGEgY2FsbGJhY2sgd2hlbmV2ZXIgdGhlIGNvbnRlbnQgb2ZcbiAqIGl0cyBhc3NvY2lhdGVkIGVsZW1lbnQgaGFzIGNoYW5nZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtPYnNlcnZlQ29udGVudF0nLFxuICBleHBvcnRBczogJ2Nka09ic2VydmVDb250ZW50Jyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT2JzZXJ2ZUNvbnRlbnQgaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRXZlbnQgZW1pdHRlZCBmb3IgZWFjaCBjaGFuZ2UgaW4gdGhlIGVsZW1lbnQncyBjb250ZW50LiAqL1xuICBAT3V0cHV0KCdjZGtPYnNlcnZlQ29udGVudCcpIGV2ZW50ID0gbmV3IEV2ZW50RW1pdHRlcjxNdXRhdGlvblJlY29yZFtdPigpO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9ic2VydmluZyBjb250ZW50IGlzIGRpc2FibGVkLiBUaGlzIG9wdGlvbiBjYW4gYmUgdXNlZFxuICAgKiB0byBkaXNjb25uZWN0IHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgdW50aWwgaXQgaXMgbmVlZGVkLlxuICAgKi9cbiAgQElucHV0KCdjZGtPYnNlcnZlQ29udGVudERpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCkgeyByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7IH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fZGlzYWJsZWQgPyB0aGlzLl91bnN1YnNjcmliZSgpIDogdGhpcy5fc3Vic2NyaWJlKCk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICAvKiogRGVib3VuY2UgaW50ZXJ2YWwgZm9yIGVtaXR0aW5nIHRoZSBjaGFuZ2VzLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZGVib3VuY2UoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2RlYm91bmNlOyB9XG4gIHNldCBkZWJvdW5jZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fZGVib3VuY2UgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc3Vic2NyaWJlKCk7XG4gIH1cbiAgcHJpdmF0ZSBfZGVib3VuY2U6IG51bWJlcjtcblxuICBwcml2YXRlIF9jdXJyZW50U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb250ZW50T2JzZXJ2ZXI6IENvbnRlbnRPYnNlcnZlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7fVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICBpZiAoIXRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gJiYgIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3Vuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBwcml2YXRlIF9zdWJzY3JpYmUoKSB7XG4gICAgdGhpcy5fdW5zdWJzY3JpYmUoKTtcbiAgICBjb25zdCBzdHJlYW0gPSB0aGlzLl9jb250ZW50T2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLl9lbGVtZW50UmVmKTtcblxuICAgIC8vIFRPRE8obW1hbGVyYmEpOiBXZSBzaG91bGRuJ3QgYmUgZW1pdHRpbmcgb24gdGhpcyBAT3V0cHV0KCkgb3V0c2lkZSB0aGUgem9uZS5cbiAgICAvLyBDb25zaWRlciBicmluaW5nIGl0IGJhY2sgaW5zaWRlIHRoZSB6b25lIG5leHQgdGltZSB3ZSdyZSBtYWtpbmcgYnJlYWtpbmcgY2hhbmdlcy5cbiAgICAvLyBCcmluZ2luZyBpdCBiYWNrIGluc2lkZSBjYW4gY2F1c2UgdGhpbmdzIGxpa2UgaW5maW5pdGUgY2hhbmdlIGRldGVjdGlvbiBsb29wcyBhbmQgY2hhbmdlZFxuICAgIC8vIGFmdGVyIGNoZWNrZWQgZXJyb3JzIGlmIHBlb3BsZSdzIGNvZGUgaXNuJ3QgaGFuZGxpbmcgaXQgcHJvcGVybHkuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24gPVxuICAgICAgICAgICh0aGlzLmRlYm91bmNlID8gc3RyZWFtLnBpcGUoZGVib3VuY2VUaW1lKHRoaXMuZGVib3VuY2UpKSA6IHN0cmVhbSkuc3Vic2NyaWJlKHRoaXMuZXZlbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfdW5zdWJzY3JpYmUoKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2RlYm91bmNlOiBCb29sZWFuSW5wdXQ7XG59XG5cblxuQE5nTW9kdWxlKHtcbiAgZXhwb3J0czogW0Nka09ic2VydmVDb250ZW50XSxcbiAgZGVjbGFyYXRpb25zOiBbQ2RrT2JzZXJ2ZUNvbnRlbnRdLFxuICBwcm92aWRlcnM6IFtNdXRhdGlvbk9ic2VydmVyRmFjdG9yeV1cbn0pXG5leHBvcnQgY2xhc3MgT2JzZXJ2ZXJzTW9kdWxlIHt9XG4iXX0=