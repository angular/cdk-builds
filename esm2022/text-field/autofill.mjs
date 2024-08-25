/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, inject, Injectable, NgZone, Output, } from '@angular/core';
import { _CdkPrivateStyleLoader } from '@angular/cdk/private';
import { coerceElement } from '@angular/cdk/coercion';
import { EMPTY, Subject } from 'rxjs';
import { _CdkTextFieldStyleLoader } from './text-field-style-loader';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Options to pass to the animationstart listener. */
const listenerOptions = normalizePassiveListenerOptions({ passive: true });
/**
 * An injectable service that can be used to monitor the autofill state of an input.
 * Based on the following blog post:
 * https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
 */
export class AutofillMonitor {
    constructor(_platform, _ngZone) {
        this._platform = _platform;
        this._ngZone = _ngZone;
        this._styleLoader = inject(_CdkPrivateStyleLoader);
        this._monitoredElements = new Map();
    }
    monitor(elementOrRef) {
        if (!this._platform.isBrowser) {
            return EMPTY;
        }
        this._styleLoader.load(_CdkTextFieldStyleLoader);
        const element = coerceElement(elementOrRef);
        const info = this._monitoredElements.get(element);
        if (info) {
            return info.subject;
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
            },
        });
        return result;
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: AutofillMonitor, deps: [{ token: i1.Platform }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: AutofillMonitor, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: AutofillMonitor, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: i1.Platform }, { type: i0.NgZone }] });
/** A directive that can be used to monitor the autofill state of an input. */
export class CdkAutofill {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkAutofill, deps: [{ token: i0.ElementRef }, { token: AutofillMonitor }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.2.0-next.2", type: CdkAutofill, isStandalone: true, selector: "[cdkAutofill]", outputs: { cdkAutofill: "cdkAutofill" }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkAutofill, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkAutofill]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: AutofillMonitor }], propDecorators: { cdkAutofill: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2ZpbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b2ZpbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sVUFBVSxFQUNWLE1BQU0sRUFHTixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxLQUFLLEVBQWMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2hELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDOzs7QUFnQm5FLHNEQUFzRDtBQUN0RCxNQUFNLGVBQWUsR0FBRywrQkFBK0IsQ0FBQyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBRXpFOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8sZUFBZTtJQUkxQixZQUNVLFNBQW1CLEVBQ25CLE9BQWU7UUFEZixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFMakIsaUJBQVksR0FBRyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUM5Qyx1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztJQUtuRSxDQUFDO0lBZ0JKLE9BQU8sQ0FBQyxZQUEyQztRQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM5QixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFJLENBQUMs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QUMxQyxDQUFDO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7cUhBcEdVLGVBQWU7eUhBQWYsZUFBZSxjQURILE1BQU07O2tHQUNsQixlQUFlO2tCQUQzQixVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUF3R2hDLDhFQUE4RTtBQUs5RSxNQUFNLE9BQU8sV0FBVztJQUl0QixZQUNVLFdBQW9DLEVBQ3BDLGdCQUFpQztRQURqQyxnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7UUFDcEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtRQUwzQyw0REFBNEQ7UUFDekMsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBaUIsQ0FBQztJQUtoRSxDQUFDO0lBRUosUUFBUTtRQUNOLElBQUksQ0FBQyxnQkFBZ0I7YUFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDekIsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3pELENBQUM7cUhBakJVLFdBQVc7eUdBQVgsV0FBVzs7a0dBQVgsV0FBVztrQkFKdkIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsZUFBZTtvQkFDekIsVUFBVSxFQUFFLElBQUk7aUJBQ2pCOzBHQUdvQixXQUFXO3NCQUE3QixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm0sIG5vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgaW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtfQ2RrUHJpdmF0ZVN0eWxlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jZGsvcHJpdmF0ZSc7XG5pbXBvcnQge2NvZXJjZUVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0VNUFRZLCBPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7X0Nka1RleHRGaWVsZFN0eWxlTG9hZGVyfSBmcm9tICcuL3RleHQtZmllbGQtc3R5bGUtbG9hZGVyJztcblxuLyoqIEFuIGV2ZW50IHRoYXQgaXMgZW1pdHRlZCB3aGVuIHRoZSBhdXRvZmlsbCBzdGF0ZSBvZiBhbiBpbnB1dCBjaGFuZ2VzLiAqL1xuZXhwb3J0IHR5cGUgQXV0b2ZpbGxFdmVudCA9IHtcbiAgLyoqIFRoZSBlbGVtZW50IHdob3NlIGF1dG9maWxsIHN0YXRlIGNoYW5nZXMuICovXG4gIHRhcmdldDogRWxlbWVudDtcbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgY3VycmVudGx5IGF1dG9maWxsZWQuICovXG4gIGlzQXV0b2ZpbGxlZDogYm9vbGVhbjtcbn07XG5cbi8qKiBVc2VkIHRvIHRyYWNrIGluZm8gYWJvdXQgY3VycmVudGx5IG1vbml0b3JlZCBlbGVtZW50cy4gKi9cbnR5cGUgTW9uaXRvcmVkRWxlbWVudEluZm8gPSB7XG4gIHJlYWRvbmx5IHN1YmplY3Q6IFN1YmplY3Q8QXV0b2ZpbGxFdmVudD47XG4gIHVubGlzdGVuOiAoKSA9PiB2b2lkO1xufTtcblxuLyoqIE9wdGlvbnMgdG8gcGFzcyB0byB0aGUgYW5pbWF0aW9uc3RhcnQgbGlzdGVuZXIuICovXG5jb25zdCBsaXN0ZW5lck9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtwYXNzaXZlOiB0cnVlfSk7XG5cbi8qKlxuICogQW4gaW5qZWN0YWJsZSBzZXJ2aWNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gbW9uaXRvciB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgYW4gaW5wdXQuXG4gKiBCYXNlZCBvbiB0aGUgZm9sbG93aW5nIGJsb2cgcG9zdDpcbiAqIGh0dHBzOi8vbWVkaXVtLmNvbS9AYnJ1bm4vZGV0ZWN0aW5nLWF1dG9maWxsZWQtZmllbGRzLWluLWphdmFzY3JpcHQtYWVkNTk4ZDI1ZGE3XG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEF1dG9maWxsTW9uaXRvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX3N0eWxlTG9hZGVyID0gaW5qZWN0KF9DZGtQcml2YXRlU3R5bGVMb2FkZXIpO1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICApIHt9XG5cbiAgLyoqXG4gICAqIE1vbml0b3IgZm9yIGNoYW5nZXMgaW4gdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yLlxuICAgKiBAcmV0dXJuIEEgc3RyZWFtIG9mIGF1dG9maWxsIHN0YXRlIGNoYW5nZXMuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnQpOiBPYnNlcnZhYmxlPEF1dG9maWxsRXZlbnQ+O1xuXG4gIC8qKlxuICAgKiBNb25pdG9yIGZvciBjaGFuZ2VzIGluIHRoZSBhdXRvZmlsbCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gaW5wdXQgZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gbW9uaXRvci5cbiAgICogQHJldHVybiBBIHN0cmVhbSBvZiBhdXRvZmlsbCBzdGF0ZSBjaGFuZ2VzLlxuICAgKi9cbiAgbW9uaXRvcihlbGVtZW50OiBFbGVtZW50UmVmPEVsZW1lbnQ+KTogT2JzZXJ2YWJsZTxBdXRvZmlsbEV2ZW50PjtcblxuICBtb25pdG9yKGVsZW1lbnRPclJlZjogRWxlbWVudCB8IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPEF1dG9maWxsRXZlbnQ+IHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIEVNUFRZO1xuICAgIH1cblxuICAgIHRoaXMuX3N0eWxlTG9hZGVyLmxvYWQoX0Nka1RleHRGaWVsZFN0eWxlTG9hZGVyKTtcblxuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnRPclJlZik7XG4gICAgY29uc3QgaW5mbyA9IHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLmdldChlbGVtZW50KTtcblxuICAgIGlmIChpbmZvKSB7XG4gICAgICByZXR1cm4gaW5mby5zdWJqZWN0O1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBTdWJqZWN0PEF1dG9maWxsRXZlbnQ+KCk7XG4gICAgY29uc3QgY3NzQ2xhc3MgPSAnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGxlZCc7XG4gICAgY29uc3QgbGlzdGVuZXIgPSAoKGV2ZW50OiBBbmltYXRpb25FdmVudCkgPT4ge1xuICAgICAgLy8gQW5pbWF0aW9uIGV2ZW50cyBmaXJlIG9uIGluaXRpYWwgZWxlbWVudCByZW5kZXIsIHdlIGNoZWNrIGZvciB0aGUgcHJlc2VuY2Ugb2YgdGhlIGF1dG9maWxsXG4gICAgICAvLyBDU1MgY2xhc3MgdG8gbWFrZSBzdXJlIHRoaXMgaXMgYSByZWFsIGNoYW5nZSBpbiBzdGF0ZSwgbm90IGp1c3QgdGhlIGluaXRpYWwgcmVuZGVyIGJlZm9yZVxuICAgICAgLy8gd2UgZmlyZSBvZmYgZXZlbnRzLlxuICAgICAgaWYgKFxuICAgICAgICBldmVudC5hbmltYXRpb25OYW1lID09PSAnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGwtc3RhcnQnICYmXG4gICAgICAgICFlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhjc3NDbGFzcylcbiAgICAgICkge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHJlc3VsdC5uZXh0KHt0YXJnZXQ6IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50LCBpc0F1dG9maWxsZWQ6IHRydWV9KSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBldmVudC5hbmltYXRpb25OYW1lID09PSAnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGwtZW5kJyAmJlxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhjc3NDbGFzcylcbiAgICAgICkge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHJlc3VsdC5uZXh0KHt0YXJnZXQ6IGV2ZW50LnRhcmdldCBhcyBFbGVtZW50LCBpc0F1dG9maWxsZWQ6IGZhbHNlfSkpO1xuICAgICAgfVxuICAgIH0pIGFzIEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3Q7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25zdGFydCcsIGxpc3RlbmVyLCBsaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjZGstdGV4dC1maWVsZC1hdXRvZmlsbC1tb25pdG9yZWQnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLnNldChlbGVtZW50LCB7XG4gICAgICBzdWJqZWN0OiByZXN1bHQsXG4gICAgICB1bmxpc3RlbjogKCkgPT4ge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbnN0YXJ0JywgbGlzdGVuZXIsIGxpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wIG1vbml0b3JpbmcgdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50KTogdm9pZDtcblxuICAvKipcbiAgICogU3RvcCBtb25pdG9yaW5nIHRoZSBhdXRvZmlsbCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gaW5wdXQgZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc3RvcCBtb25pdG9yaW5nLlxuICAgKi9cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudDogRWxlbWVudFJlZjxFbGVtZW50Pik6IHZvaWQ7XG5cbiAgc3RvcE1vbml0b3JpbmcoZWxlbWVudE9yUmVmOiBFbGVtZW50IHwgRWxlbWVudFJlZjxFbGVtZW50Pik6IHZvaWQge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb2VyY2VFbGVtZW50KGVsZW1lbnRPclJlZik7XG4gICAgY29uc3QgaW5mbyA9IHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLmdldChlbGVtZW50KTtcblxuICAgIGlmIChpbmZvKSB7XG4gICAgICBpbmZvLnVubGlzdGVuKCk7XG4gICAgICBpbmZvLnN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGwtbW9uaXRvcmVkJyk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2Nkay10ZXh0LWZpZWxkLWF1dG9maWxsZWQnKTtcbiAgICAgIHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLmRlbGV0ZShlbGVtZW50KTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9tb25pdG9yZWRFbGVtZW50cy5mb3JFYWNoKChfaW5mbywgZWxlbWVudCkgPT4gdGhpcy5zdG9wTW9uaXRvcmluZyhlbGVtZW50KSk7XG4gIH1cbn1cblxuLyoqIEEgZGlyZWN0aXZlIHRoYXQgY2FuIGJlIHVzZWQgdG8gbW9uaXRvciB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgYW4gaW5wdXQuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQXV0b2ZpbGxdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQXV0b2ZpbGwgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uSW5pdCB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBhdXRvZmlsbCBzdGF0ZSBvZiB0aGUgZWxlbWVudCBjaGFuZ2VzLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2RrQXV0b2ZpbGwgPSBuZXcgRXZlbnRFbWl0dGVyPEF1dG9maWxsRXZlbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgcHJpdmF0ZSBfYXV0b2ZpbGxNb25pdG9yOiBBdXRvZmlsbE1vbml0b3IsXG4gICkge31cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLl9hdXRvZmlsbE1vbml0b3JcbiAgICAgIC5tb25pdG9yKHRoaXMuX2VsZW1lbnRSZWYpXG4gICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHRoaXMuY2RrQXV0b2ZpbGwuZW1pdChldmVudCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fYXV0b2ZpbGxNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuICB9XG59XG4iXX0=