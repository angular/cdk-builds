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
    class MutationObserverFactory {
        create(callback) {
            return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
        }
    }
    MutationObserverFactory.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    MutationObserverFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function MutationObserverFactory_Factory() { return new MutationObserverFactory(); }, token: MutationObserverFactory, providedIn: "root" });
    return MutationObserverFactory;
})();
export { MutationObserverFactory };
/** An injectable service that allows watching elements for changes to their content. */
let ContentObserver = /** @class */ (() => {
    class ContentObserver {
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
    ContentObserver.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ContentObserver.ctorParameters = () => [
        { type: MutationObserverFactory }
    ];
    ContentObserver.ɵprov = i0.ɵɵdefineInjectable({ factory: function ContentObserver_Factory() { return new ContentObserver(i0.ɵɵinject(MutationObserverFactory)); }, token: ContentObserver, providedIn: "root" });
    return ContentObserver;
})();
export { ContentObserver };
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
let CdkObserveContent = /** @class */ (() => {
    class CdkObserveContent {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZS1jb250ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vYnNlcnZlcnMvb2JzZXJ2ZS1jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLGFBQWEsRUFFZCxNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFFTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsS0FBSyxFQUNMLFFBQVEsRUFDUixNQUFNLEVBRU4sTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUF5QixNQUFNLE1BQU0sQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7O0FBRTVDOzs7R0FHRztBQUNIO0lBQUEsTUFDYSx1QkFBdUI7UUFDbEMsTUFBTSxDQUFDLFFBQTBCO1lBQy9CLE9BQU8sT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6RixDQUFDOzs7Z0JBSkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7O2tDQWpDaEM7S0FzQ0M7U0FKWSx1QkFBdUI7QUFPcEMsd0ZBQXdGO0FBQ3hGO0lBQUEsTUFDYSxlQUFlO1FBUTFCLFlBQW9CLHdCQUFpRDtZQUFqRCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQXlCO1lBUHJFLDJFQUEyRTtZQUNuRSxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFJL0IsQ0FBQztRQUVtRSxDQUFDO1FBRXpFLFdBQVc7WUFDVCxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakYsQ0FBQztRQWNELE9BQU8sQ0FBQyxZQUEyQztZQUNqRCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFNUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxDQUFDLFFBQW9DLEVBQUUsRUFBRTtnQkFDN0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFaEQsT0FBTyxHQUFHLEVBQUU7b0JBQ1YsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUMzQixJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVEOzs7V0FHRztRQUNLLGVBQWUsQ0FBQyxPQUFnQjtZQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDeEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQW9CLENBQUM7Z0JBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNGLElBQUksUUFBUSxFQUFFO29CQUNaLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO3dCQUN4QixhQUFhLEVBQUUsSUFBSTt3QkFDbkIsU0FBUyxFQUFFLElBQUk7d0JBQ2YsT0FBTyxFQUFFLElBQUk7cUJBQ2QsQ0FBQyxDQUFDO2lCQUNKO2dCQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQzthQUNuRTtpQkFBTTtnQkFDTCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQzlDO1lBQ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLE1BQU0sQ0FBQztRQUNyRCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ssaUJBQWlCLENBQUMsT0FBZ0I7WUFDeEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxLQUFLLEVBQUU7b0JBQy9DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDaEM7YUFDRjtRQUNILENBQUM7UUFFRCwwRUFBMEU7UUFDbEUsZ0JBQWdCLENBQUMsT0FBZ0I7WUFDdkMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLEVBQUMsUUFBUSxFQUFFLE1BQU0sRUFBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLENBQUM7Z0JBQ2hFLElBQUksUUFBUSxFQUFFO29CQUNaLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztpQkFDdkI7Z0JBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3hDO1FBQ0gsQ0FBQzs7O2dCQXRGRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dCQVNnQix1QkFBdUI7OzswQkFuRHZFO0tBaUlDO1NBdEZZLGVBQWU7QUF5RjVCOzs7R0FHRztBQUNIO0lBQUEsTUFJYSxpQkFBaUI7UUEyQjVCLFlBQW9CLGdCQUFpQyxFQUNqQyxXQUFvQyxFQUNwQyxPQUFlO1lBRmYscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtZQUNqQyxnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7WUFDcEMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQTVCbkMsOERBQThEO1lBQ2pDLFVBQUssR0FBRyxJQUFJLFlBQVksRUFBb0IsQ0FBQztZQVlsRSxjQUFTLEdBQUcsS0FBSyxDQUFDO1lBV2xCLHlCQUFvQixHQUF3QixJQUFJLENBQUM7UUFJbkIsQ0FBQztRQXpCdkM7OztXQUdHO1FBQ0gsSUFDSSxRQUFRLEtBQUssT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6QyxJQUFJLFFBQVEsQ0FBQyxLQUFVO1lBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0QsQ0FBQztRQUdELGtEQUFrRDtRQUNsRCxJQUNJLFFBQVEsS0FBYSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksUUFBUSxDQUFDLEtBQWE7WUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQVNELGtCQUFrQjtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQ25CO1FBQ0gsQ0FBQztRQUVELFdBQVc7WUFDVCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVPLFVBQVU7WUFDaEIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRS9ELCtFQUErRTtZQUMvRSxvRkFBb0Y7WUFDcEYsNEZBQTRGO1lBQzVGLG9FQUFvRTtZQUNwRSxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLG9CQUFvQjtvQkFDckIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxZQUFZO1lBQ2xCLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO2dCQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7YUFDekM7UUFDSCxDQUFDOzs7Z0JBL0RGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUscUJBQXFCO29CQUMvQixRQUFRLEVBQUUsbUJBQW1CO2lCQUM5Qjs7OztnQkE0QnVDLGVBQWU7Z0JBdEpyRCxVQUFVO2dCQUtWLE1BQU07Ozt3QkF3SEwsTUFBTSxTQUFDLG1CQUFtQjsyQkFNMUIsS0FBSyxTQUFDLDJCQUEyQjsyQkFTakMsS0FBSzs7SUE4Q1Isd0JBQUM7S0FBQTtTQS9EWSxpQkFBaUI7QUFrRTlCO0lBQUEsTUFLYSxlQUFlOzs7Z0JBTDNCLFFBQVEsU0FBQztvQkFDUixPQUFPLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztvQkFDNUIsWUFBWSxFQUFFLENBQUMsaUJBQWlCLENBQUM7b0JBQ2pDLFNBQVMsRUFBRSxDQUFDLHVCQUF1QixDQUFDO2lCQUNyQzs7SUFDNkIsc0JBQUM7S0FBQTtTQUFsQixlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIGNvZXJjZUVsZW1lbnQsXG4gIEJvb2xlYW5JbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdGFibGUsXG4gIElucHV0LFxuICBOZ01vZHVsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE91dHB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFN1YnNjcmlwdGlvbiwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtkZWJvdW5jZVRpbWV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuLyoqXG4gKiBGYWN0b3J5IHRoYXQgY3JlYXRlcyBhIG5ldyBNdXRhdGlvbk9ic2VydmVyIGFuZCBhbGxvd3MgdXMgdG8gc3R1YiBpdCBvdXQgaW4gdW5pdCB0ZXN0cy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTXV0YXRpb25PYnNlcnZlckZhY3Rvcnkge1xuICBjcmVhdGUoY2FsbGJhY2s6IE11dGF0aW9uQ2FsbGJhY2spOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjayk7XG4gIH1cbn1cblxuXG4vKiogQW4gaW5qZWN0YWJsZSBzZXJ2aWNlIHRoYXQgYWxsb3dzIHdhdGNoaW5nIGVsZW1lbnRzIGZvciBjaGFuZ2VzIHRvIHRoZWlyIGNvbnRlbnQuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDb250ZW50T2JzZXJ2ZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGV4aXN0aW5nIE11dGF0aW9uT2JzZXJ2ZXJzIHNvIHRoZXkgY2FuIGJlIHJldXNlZC4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZWRFbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwge1xuICAgIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbCxcbiAgICBzdHJlYW06IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4sXG4gICAgY291bnQ6IG51bWJlclxuICB9PigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX211dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5OiBNdXRhdGlvbk9ic2VydmVyRmFjdG9yeSkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmZvckVhY2goKF8sIGVsZW1lbnQpID0+IHRoaXMuX2NsZWFudXBPYnNlcnZlcihlbGVtZW50KSk7XG4gIH1cblxuICAvKipcbiAgICogT2JzZXJ2ZSBjb250ZW50IGNoYW5nZXMgb24gYW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgY29udGVudCBjaGFuZ2VzLlxuICAgKi9cbiAgb2JzZXJ2ZShlbGVtZW50OiBFbGVtZW50KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPjtcblxuICAvKipcbiAgICogT2JzZXJ2ZSBjb250ZW50IGNoYW5nZXMgb24gYW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gb2JzZXJ2ZSBmb3IgY29udGVudCBjaGFuZ2VzLlxuICAgKi9cbiAgb2JzZXJ2ZShlbGVtZW50OiBFbGVtZW50UmVmPEVsZW1lbnQ+KTogT2JzZXJ2YWJsZTxNdXRhdGlvblJlY29yZFtdPjtcblxuICBvYnNlcnZlKGVsZW1lbnRPclJlZjogRWxlbWVudCB8IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPE11dGF0aW9uUmVjb3JkW10+IHtcbiAgICBjb25zdCBlbGVtZW50ID0gY29lcmNlRWxlbWVudChlbGVtZW50T3JSZWYpO1xuXG4gICAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8TXV0YXRpb25SZWNvcmRbXT4pID0+IHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuX29ic2VydmVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gc3RyZWFtLnN1YnNjcmliZShvYnNlcnZlcik7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl91bm9ic2VydmVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnNlcnZlcyB0aGUgZ2l2ZW4gZWxlbWVudCBieSB1c2luZyB0aGUgZXhpc3RpbmcgTXV0YXRpb25PYnNlcnZlciBpZiBhdmFpbGFibGUsIG9yIGNyZWF0aW5nIGFcbiAgICogbmV3IG9uZSBpZiBub3QuXG4gICAqL1xuICBwcml2YXRlIF9vYnNlcnZlRWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogU3ViamVjdDxNdXRhdGlvblJlY29yZFtdPiB7XG4gICAgaWYgKCF0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFN1YmplY3Q8TXV0YXRpb25SZWNvcmRbXT4oKTtcbiAgICAgIGNvbnN0IG9ic2VydmVyID0gdGhpcy5fbXV0YXRpb25PYnNlcnZlckZhY3RvcnkuY3JlYXRlKG11dGF0aW9ucyA9PiBzdHJlYW0ubmV4dChtdXRhdGlvbnMpKTtcbiAgICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGVsZW1lbnQsIHtcbiAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5zZXQoZWxlbWVudCwge29ic2VydmVyLCBzdHJlYW0sIGNvdW50OiAxfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLnN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbi1vYnNlcnZlcyB0aGUgZ2l2ZW4gZWxlbWVudCBhbmQgY2xlYW5zIHVwIHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgaWYgbm9ib2R5IGVsc2UgaXNcbiAgICogb2JzZXJ2aW5nIHRoaXMgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX3Vub2JzZXJ2ZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9vYnNlcnZlZEVsZW1lbnRzLmhhcyhlbGVtZW50KSkge1xuICAgICAgdGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5nZXQoZWxlbWVudCkhLmNvdW50LS07XG4gICAgICBpZiAoIXRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpIS5jb3VudCkge1xuICAgICAgICB0aGlzLl9jbGVhbnVwT2JzZXJ2ZXIoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIENsZWFuIHVwIHRoZSB1bmRlcmx5aW5nIE11dGF0aW9uT2JzZXJ2ZXIgZm9yIHRoZSBzcGVjaWZpZWQgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY2xlYW51cE9ic2VydmVyKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fb2JzZXJ2ZWRFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IHtvYnNlcnZlciwgc3RyZWFtfSA9IHRoaXMuX29ic2VydmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpITtcbiAgICAgIGlmIChvYnNlcnZlcikge1xuICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICB9XG4gICAgICBzdHJlYW0uY29tcGxldGUoKTtcbiAgICAgIHRoaXMuX29ic2VydmVkRWxlbWVudHMuZGVsZXRlKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogRGlyZWN0aXZlIHRoYXQgdHJpZ2dlcnMgYSBjYWxsYmFjayB3aGVuZXZlciB0aGUgY29udGVudCBvZlxuICogaXRzIGFzc29jaWF0ZWQgZWxlbWVudCBoYXMgY2hhbmdlZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka09ic2VydmVDb250ZW50XScsXG4gIGV4cG9ydEFzOiAnY2RrT2JzZXJ2ZUNvbnRlbnQnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtPYnNlcnZlQ29udGVudCBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFdmVudCBlbWl0dGVkIGZvciBlYWNoIGNoYW5nZSBpbiB0aGUgZWxlbWVudCdzIGNvbnRlbnQuICovXG4gIEBPdXRwdXQoJ2Nka09ic2VydmVDb250ZW50JykgZXZlbnQgPSBuZXcgRXZlbnRFbWl0dGVyPE11dGF0aW9uUmVjb3JkW10+KCk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb2JzZXJ2aW5nIGNvbnRlbnQgaXMgZGlzYWJsZWQuIFRoaXMgb3B0aW9uIGNhbiBiZSB1c2VkXG4gICAqIHRvIGRpc2Nvbm5lY3QgdGhlIHVuZGVybHlpbmcgTXV0YXRpb25PYnNlcnZlciB1bnRpbCBpdCBpcyBuZWVkZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka09ic2VydmVDb250ZW50RGlzYWJsZWQnKVxuICBnZXQgZGlzYWJsZWQoKSB7IHJldHVybiB0aGlzLl9kaXNhYmxlZDsgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGFueSkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9kaXNhYmxlZCA/IHRoaXMuX3Vuc3Vic2NyaWJlKCkgOiB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIC8qKiBEZWJvdW5jZSBpbnRlcnZhbCBmb3IgZW1pdHRpbmcgdGhlIGNoYW5nZXMuICovXG4gIEBJbnB1dCgpXG4gIGdldCBkZWJvdW5jZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fZGVib3VuY2U7IH1cbiAgc2V0IGRlYm91bmNlKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9kZWJvdW5jZSA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zdWJzY3JpYmUoKTtcbiAgfVxuICBwcml2YXRlIF9kZWJvdW5jZTogbnVtYmVyO1xuXG4gIHByaXZhdGUgX2N1cnJlbnRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2NvbnRlbnRPYnNlcnZlcjogQ29udGVudE9ic2VydmVyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIGlmICghdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiAmJiAhdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3N1YnNjcmliZSgpIHtcbiAgICB0aGlzLl91bnN1YnNjcmliZSgpO1xuICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuX2NvbnRlbnRPYnNlcnZlci5vYnNlcnZlKHRoaXMuX2VsZW1lbnRSZWYpO1xuXG4gICAgLy8gVE9ETyhtbWFsZXJiYSk6IFdlIHNob3VsZG4ndCBiZSBlbWl0dGluZyBvbiB0aGlzIEBPdXRwdXQoKSBvdXRzaWRlIHRoZSB6b25lLlxuICAgIC8vIENvbnNpZGVyIGJyaW5pbmcgaXQgYmFjayBpbnNpZGUgdGhlIHpvbmUgbmV4dCB0aW1lIHdlJ3JlIG1ha2luZyBicmVha2luZyBjaGFuZ2VzLlxuICAgIC8vIEJyaW5naW5nIGl0IGJhY2sgaW5zaWRlIGNhbiBjYXVzZSB0aGluZ3MgbGlrZSBpbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIGxvb3BzIGFuZCBjaGFuZ2VkXG4gICAgLy8gYWZ0ZXIgY2hlY2tlZCBlcnJvcnMgaWYgcGVvcGxlJ3MgY29kZSBpc24ndCBoYW5kbGluZyBpdCBwcm9wZXJseS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbiA9XG4gICAgICAgICAgKHRoaXMuZGVib3VuY2UgPyBzdHJlYW0ucGlwZShkZWJvdW5jZVRpbWUodGhpcy5kZWJvdW5jZSkpIDogc3RyZWFtKS5zdWJzY3JpYmUodGhpcy5ldmVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF91bnN1YnNjcmliZSgpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fY3VycmVudFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGVib3VuY2U6IEJvb2xlYW5JbnB1dDtcbn1cblxuXG5ATmdNb2R1bGUoe1xuICBleHBvcnRzOiBbQ2RrT2JzZXJ2ZUNvbnRlbnRdLFxuICBkZWNsYXJhdGlvbnM6IFtDZGtPYnNlcnZlQ29udGVudF0sXG4gIHByb3ZpZGVyczogW011dGF0aW9uT2JzZXJ2ZXJGYWN0b3J5XVxufSlcbmV4cG9ydCBjbGFzcyBPYnNlcnZlcnNNb2R1bGUge31cbiJdfQ==