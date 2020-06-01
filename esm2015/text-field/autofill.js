/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Injectable, NgZone, Output, } from '@angular/core';
import { coerceElement } from '@angular/cdk/coercion';
import { EMPTY, Subject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Options to pass to the animationstart listener. */
const listenerOptions = normalizePassiveListenerOptions({ passive: true });
/**
 * An injectable service that can be used to monitor the autofill state of an input.
 * Based on the following blog post:
 * https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
 */
let AutofillMonitor = /** @class */ (() => {
    class AutofillMonitor {
        constructor(_platform, _ngZone) {
            this._platform = _platform;
            this._ngZone = _ngZone;
            this._monitoredElements = new Map();
        }
        monitor(elementOrRef) {
            if (!this._platform.isBrowser) {
                return EMPTY;
            }
            const element = coerceElement(elementOrRef);
            const info = this._monitoredElements.get(element);
            if (info) {
                return info.subject.asObservable();
            }
            const result = new Subject();
            const cssClass = 'cdk-text-field-autofilled';
            const listener = ((event) => {
                // Animation events fire on initial element render, we check for the presence of the autofill
                // CSS class to make sure this is a real change in state, not just the initial render before
                // we fire off events.
                if (event.animationName === 'cdk-text-field-autofill-start' &&
                    !element.classList.contains(cssClass)) {
                    element.classList.add(cssClass);
                    this._ngZone.run(() => result.next({ target: event.target, isAutofilled: true }));
                }
                else if (event.animationName === 'cdk-text-field-autofill-end' &&
                    element.classList.contains(cssClass)) {
                    element.classList.remove(cssClass);
                    this._ngZone.run(() => result.next({ target: event.target, isAutofilled: false }));
                }
            });
            this._ngZone.runOutsideAngular(() => {
                element.addEventListener('animationstart', listener, listenerOptions);
                element.classList.add('cdk-text-field-autofill-monitored');
            });
            this._monitoredElements.set(element, {
                subject: result,
                unlisten: () => {
                    element.removeEventListener('animationstart', listener, listenerOptions);
                }
            });
            return result.asObservable();
        }
        stopMonitoring(elementOrRef) {
            const element = coerceElement(elementOrRef);
            const info = this._monitoredElements.get(element);
            if (info) {
                info.unlisten();
                info.subject.complete();
                element.classList.remove('cdk-text-field-autofill-monitored');
                element.classList.remove('cdk-text-field-autofilled');
                this._monitoredElements.delete(element);
            }
        }
        ngOnDestroy() {
            this._monitoredElements.forEach((_info, element) => this.stopMonitoring(element));
        }
    }
    AutofillMonitor.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    AutofillMonitor.ctorParameters = () => [
        { type: Platform },
        { type: NgZone }
    ];
    AutofillMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function AutofillMonitor_Factory() { return new AutofillMonitor(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i0.NgZone)); }, token: AutofillMonitor, providedIn: "root" });
    return AutofillMonitor;
})();
export { AutofillMonitor };
/** A directive that can be used to monitor the autofill state of an input. */
let CdkAutofill = /** @class */ (() => {
    class CdkAutofill {
        constructor(_elementRef, _autofillMonitor) {
            this._elementRef = _elementRef;
            this._autofillMonitor = _autofillMonitor;
            /** Emits when the autofill state of the element changes. */
            this.cdkAutofill = new EventEmitter();
        }
        ngOnInit() {
            this._autofillMonitor
                .monitor(this._elementRef)
                .subscribe(event => this.cdkAutofill.emit(event));
        }
        ngOnDestroy() {
            this._autofillMonitor.stopMonitoring(this._elementRef);
        }
    }
    CdkAutofill.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkAutofill]',
                },] }
    ];
    /** @nocollapse */
    CdkAutofill.ctorParameters = () => [
        { type: ElementRef },
        { type: AutofillMonitor }
    ];
    CdkAutofill.propDecorators = {
        cdkAutofill: [{ type: Output }]
    };
    return CdkAutofill;
})();
export { CdkAutofill };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2ZpbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b2ZpbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUdOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLEtBQUssRUFBYyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7OztBQW1CaEQsc0RBQXNEO0FBQ3RELE1BQU0sZUFBZSxHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFHekU7Ozs7R0FJRztBQUNIO0lBQUEsTUFDYSxlQUFlO1FBRzFCLFlBQW9CLFNBQW1CLEVBQVUsT0FBZTtZQUE1QyxjQUFTLEdBQVQsU0FBUyxDQUFVO1lBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUZ4RCx1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztRQUVILENBQUM7UUFnQnBFLE9BQU8sQ0FBQyxZQUEyQztZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7Z0JBQzdCLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFFRCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVsRCxJQUFJLElBQUksRUFBRTtnQkFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7YUFDcEM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRywyQkFBMkIsQ0FBQztZQUM3QyxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBcUIsRUFBRSxFQUFFO2dCQUMxQyw2RkFBNkY7Z0JBQzdGLDRGQUE0RjtnQkFDNUYsc0JBQXNCO2dCQUN0QixJQUFJLEtBQUssQ0FBQyxhQUFhLEtBQUssK0JBQStCO29CQUN2RCxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUN6QyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBaUIsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUM1RjtxQkFBTSxJQUFJLEtBQUssQ0FBQyxhQUFhLEtBQUssNkJBQTZCO29CQUM1RCxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDeEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ25DLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQWlCLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsQ0FBQztpQkFDN0Y7WUFDSCxDQUFDLENBQXVDLENBQUM7WUFFekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2xDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQ3RFLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTtnQkFDbkMsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDYixPQUFPLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUMzRSxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsT0FBTyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQWNELGNBQWMsQ0FBQyxZQUEyQztZQUN4RCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVsRCxJQUFJLElBQUksRUFBRTtnQkFDUixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7Z0JBQzlELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDekM7UUFDSCxDQUFDO1FBRUQsV0FBVztZQUNULElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQzs7O2dCQTNGRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dCQXhDeEIsUUFBUTtnQkFNZCxNQUFNOzs7MEJBZFI7S0E0SUM7U0EzRlksZUFBZTtBQThGNUIsOEVBQThFO0FBQzlFO0lBQUEsTUFHYSxXQUFXO1FBSXRCLFlBQW9CLFdBQW9DLEVBQ3BDLGdCQUFpQztZQURqQyxnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7WUFDcEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtZQUpyRCw0REFBNEQ7WUFDbEQsZ0JBQVcsR0FBZ0MsSUFBSSxZQUFZLEVBQWlCLENBQUM7UUFHL0IsQ0FBQztRQUV6RCxRQUFRO1lBQ04sSUFBSSxDQUFDLGdCQUFnQjtpQkFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7aUJBQ3pCLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELFdBQVc7WUFDVCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN6RCxDQUFDOzs7Z0JBbEJGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsZUFBZTtpQkFDMUI7Ozs7Z0JBdklDLFVBQVU7Z0JBNkk0QixlQUFlOzs7OEJBSHBELE1BQU07O0lBY1Qsa0JBQUM7S0FBQTtTQWhCWSxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0YWJsZSxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29lcmNlRWxlbWVudH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RU1QVFksIE9ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuXG5cbi8qKiBBbiBldmVudCB0aGF0IGlzIGVtaXR0ZWQgd2hlbiB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgYW4gaW5wdXQgY2hhbmdlcy4gKi9cbmV4cG9ydCB0eXBlIEF1dG9maWxsRXZlbnQgPSB7XG4gIC8qKiBUaGUgZWxlbWVudCB3aG9zZSBhdXRvZmlsbCBzdGF0ZSBjaGFuZ2VzLiAqL1xuICB0YXJnZXQ6IEVsZW1lbnQ7XG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBhdXRvZmlsbGVkLiAqL1xuICBpc0F1dG9maWxsZWQ6IGJvb2xlYW47XG59O1xuXG5cbi8qKiBVc2VkIHRvIHRyYWNrIGluZm8gYWJvdXQgY3VycmVudGx5IG1vbml0b3JlZCBlbGVtZW50cy4gKi9cbnR5cGUgTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gIHN1YmplY3Q6IFN1YmplY3Q8QXV0b2ZpbGxFdmVudD47XG4gIHVubGlzdGVuOiAoKSA9PiB2b2lkO1xufTtcblxuXG4vKiogT3B0aW9ucyB0byBwYXNzIHRvIHRoZSBhbmltYXRpb25zdGFydCBsaXN0ZW5lci4gKi9cbmNvbnN0IGxpc3RlbmVyT3B0aW9ucyA9IG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnMoe3Bhc3NpdmU6IHRydWV9KTtcblxuXG4vKipcbiAqIEFuIGluamVjdGFibGUgc2VydmljZSB0aGF0IGNhbiBiZSB1c2VkIHRvIG1vbml0b3IgdGhlIGF1dG9maWxsIHN0YXRlIG9mIGFuIGlucHV0LlxuICogQmFzZWQgb24gdGhlIGZvbGxvd2luZyBibG9nIHBvc3Q6XG4gKiBodHRwczovL21lZGl1bS5jb20vQGJydW5uL2RldGVjdGluZy1hdXRvZmlsbGVkLWZpZWxkcy1pbi1qYXZhc2NyaXB0LWFlZDU5OGQyNWRhN1xuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBdXRvZmlsbE1vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLCBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge31cblxuICAvKipcbiAgICogTW9uaXRvciBmb3IgY2hhbmdlcyBpbiB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgdGhlIGdpdmVuIGlucHV0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3IuXG4gICAqIEByZXR1cm4gQSBzdHJlYW0gb2YgYXV0b2ZpbGwgc3RhdGUgY2hhbmdlcy5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogRWxlbWVudCk6IE9ic2VydmFibGU8QXV0b2ZpbGxFdmVudD47XG5cbiAgLyoqXG4gICAqIE1vbml0b3IgZm9yIGNoYW5nZXMgaW4gdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yLlxuICAgKiBAcmV0dXJuIEEgc3RyZWFtIG9mIGF1dG9maWxsIHN0YXRlIGNoYW5nZXMuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPEF1dG9maWxsRXZlbnQ+O1xuXG4gIG1vbml0b3IoZWxlbWVudE9yUmVmOiBFbGVtZW50IHwgRWxlbWVudFJlZjxFbGVtZW50Pik6IE9ic2VydmFibGU8QXV0b2ZpbGxFdmVudD4ge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gRU1QVFk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudE9yUmVmKTtcbiAgICBjb25zdCBpbmZvID0gdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKGluZm8pIHtcbiAgICAgIHJldHVybiBpbmZvLnN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFN1YmplY3Q8QXV0b2ZpbGxFdmVudD4oKTtcbiAgICBjb25zdCBjc3NDbGFzcyA9ICdjZGstdGV4dC1maWVsZC1hdXRvZmlsbGVkJztcbiAgICBjb25zdCBsaXN0ZW5lciA9ICgoZXZlbnQ6IEFuaW1hdGlvbkV2ZW50KSA9PiB7XG4gICAgICAvLyBBbmltYXRpb24gZXZlbnRzIGZpcmUgb24gaW5pdGlhbCBlbGVtZW50IHJlbmRlciwgd2UgY2hlY2sgZm9yIHRoZSBwcmVzZW5jZSBvZiB0aGUgYXV0b2ZpbGxcbiAgICAgIC8vIENTUyBjbGFzcyB0byBtYWtlIHN1cmUgdGhpcyBpcyBhIHJlYWwgY2hhbmdlIGluIHN0YXRlLCBub3QganVzdCB0aGUgaW5pdGlhbCByZW5kZXIgYmVmb3JlXG4gICAgICAvLyB3ZSBmaXJlIG9mZiBldmVudHMuXG4gICAgICBpZiAoZXZlbnQuYW5pbWF0aW9uTmFtZSA9PT0gJ2Nkay10ZXh0LWZpZWxkLWF1dG9maWxsLXN0YXJ0JyAmJlxuICAgICAgICAgICFlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhjc3NDbGFzcykpIHtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiByZXN1bHQubmV4dCh7dGFyZ2V0OiBldmVudC50YXJnZXQgYXMgRWxlbWVudCwgaXNBdXRvZmlsbGVkOiB0cnVlfSkpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5hbmltYXRpb25OYW1lID09PSAnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGwtZW5kJyAmJlxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNzc0NsYXNzKSkge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHJlc3VsdC5uZXh0KHt0YXJnZXQ6IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50LCBpc0F1dG9maWxsZWQ6IGZhbHNlfSkpO1xuICAgICAgfVxuICAgIH0pIGFzIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3Q7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25zdGFydCcsIGxpc3RlbmVyLCBsaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjZGstdGV4dC1maWVsZC1hdXRvZmlsbC1tb25pdG9yZWQnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLnNldChlbGVtZW50LCB7XG4gICAgICBzdWJqZWN0OiByZXN1bHQsXG4gICAgICB1bmxpc3RlbjogKCkgPT4ge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbnN0YXJ0JywgbGlzdGVuZXIsIGxpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0LmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgbW9uaXRvcmluZyB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgdGhlIGdpdmVuIGlucHV0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wIG1vbml0b3JpbmcgdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50T3JSZWY6IEVsZW1lbnQgfCBFbGVtZW50UmVmPEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudE9yUmVmKTtcbiAgICBjb25zdCBpbmZvID0gdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKGluZm8pIHtcbiAgICAgIGluZm8udW5saXN0ZW4oKTtcbiAgICAgIGluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdjZGstdGV4dC1maWVsZC1hdXRvZmlsbC1tb25pdG9yZWQnKTtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGxlZCcpO1xuICAgICAgdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuZGVsZXRlKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxufVxuXG5cbi8qKiBBIGRpcmVjdGl2ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIG1vbml0b3IgdGhlIGF1dG9maWxsIHN0YXRlIG9mIGFuIGlucHV0LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0F1dG9maWxsXScsXG59KVxuZXhwb3J0IGNsYXNzIENka0F1dG9maWxsIGltcGxlbWVudHMgT25EZXN0cm95LCBPbkluaXQge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgdGhlIGVsZW1lbnQgY2hhbmdlcy4gKi9cbiAgQE91dHB1dCgpIGNka0F1dG9maWxsOiBFdmVudEVtaXR0ZXI8QXV0b2ZpbGxFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPEF1dG9maWxsRXZlbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX2F1dG9maWxsTW9uaXRvcjogQXV0b2ZpbGxNb25pdG9yKSB7fVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX2F1dG9maWxsTW9uaXRvclxuICAgICAgLm1vbml0b3IodGhpcy5fZWxlbWVudFJlZilcbiAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4gdGhpcy5jZGtBdXRvZmlsbC5lbWl0KGV2ZW50KSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9hdXRvZmlsbE1vbml0b3Iuc3RvcE1vbml0b3JpbmcodGhpcy5fZWxlbWVudFJlZik7XG4gIH1cbn1cbiJdfQ==