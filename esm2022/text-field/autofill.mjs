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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: AutofillMonitor, deps: [{ token: i1.Platform }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: AutofillMonitor, providedIn: 'root' }); }
}
export { AutofillMonitor };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: AutofillMonitor, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.Platform }, { type: i0.NgZone }]; } });
/** A directive that can be used to monitor the autofill state of an input. */
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkAutofill, deps: [{ token: i0.ElementRef }, { token: AutofillMonitor }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkAutofill, selector: "[cdkAutofill]", outputs: { cdkAutofill: "cdkAutofill" }, ngImport: i0 }); }
}
export { CdkAutofill };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkAutofill, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkAutofill]',
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: AutofillMonitor }]; }, propDecorators: { cdkAutofill: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2ZpbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b2ZpbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2hGLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUdOLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLEtBQUssRUFBYyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7OztBQWdCaEQsc0RBQXNEO0FBQ3RELE1BQU0sZUFBZSxHQUFHLCtCQUErQixDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFFekU7Ozs7R0FJRztBQUNILE1BQ2EsZUFBZTtJQUcxQixZQUFvQixTQUFtQixFQUFVLE9BQWU7UUFBNUMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFGeEQsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7SUFFSCxDQUFDO0lBZ0JwRSxPQUFPLENBQUMsWUFBMkM7UUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzdCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDNUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVsRCxJQUFJLElBQUksRUFBRTtZQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUNyQjtRQUVE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O0FBa0doQyw4RUFBOEU7QUFDOUUsTUFHYSxXQUFXO0lBSXRCLFlBQ1UsV0FBb0MsRUFDcEMsZ0JBQWlDO1FBRGpDLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUNwQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlCO1FBTDNDLDREQUE0RDtRQUN6QyxnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFpQixDQUFDO0lBS2hFLENBQUM7SUFFSixRQUFRO1FBQ04sSUFBSSxDQUFDLGdCQUFnQjthQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUN6QixTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDekQsQ0FBQzs4R0FqQlUsV0FBVztrR0FBWCxXQUFXOztTQUFYLFdBQVc7MkZBQVgsV0FBVztrQkFIdkIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsZUFBZTtpQkFDMUI7NEhBR29CLFdBQVc7c0JBQTdCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybSwgbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9uc30gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbmplY3RhYmxlLFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtjb2VyY2VFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtFTVBUWSwgT2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKiBBbiBldmVudCB0aGF0IGlzIGVtaXR0ZWQgd2hlbiB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgYW4gaW5wdXQgY2hhbmdlcy4gKi9cbmV4cG9ydCB0eXBlIEF1dG9maWxsRXZlbnQgPSB7XG4gIC8qKiBUaGUgZWxlbWVudCB3aG9zZSBhdXRvZmlsbCBzdGF0ZSBjaGFuZ2VzLiAqL1xuICB0YXJnZXQ6IEVsZW1lbnQ7XG4gIC8qKiBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBhdXRvZmlsbGVkLiAqL1xuICBpc0F1dG9maWxsZWQ6IGJvb2xlYW47XG59O1xuXG4vKiogVXNlZCB0byB0cmFjayBpbmZvIGFib3V0IGN1cnJlbnRseSBtb25pdG9yZWQgZWxlbWVudHMuICovXG50eXBlIE1vbml0b3JlZEVsZW1lbnRJbmZvID0ge1xuICByZWFkb25seSBzdWJqZWN0OiBTdWJqZWN0PEF1dG9maWxsRXZlbnQ+O1xuICB1bmxpc3RlbjogKCkgPT4gdm9pZDtcbn07XG5cbi8qKiBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIGFuaW1hdGlvbnN0YXJ0IGxpc3RlbmVyLiAqL1xuY29uc3QgbGlzdGVuZXJPcHRpb25zID0gbm9ybWFsaXplUGFzc2l2ZUxpc3RlbmVyT3B0aW9ucyh7cGFzc2l2ZTogdHJ1ZX0pO1xuXG4vKipcbiAqIEFuIGluamVjdGFibGUgc2VydmljZSB0aGF0IGNhbiBiZSB1c2VkIHRvIG1vbml0b3IgdGhlIGF1dG9maWxsIHN0YXRlIG9mIGFuIGlucHV0LlxuICogQmFzZWQgb24gdGhlIGZvbGxvd2luZyBibG9nIHBvc3Q6XG4gKiBodHRwczovL21lZGl1bS5jb20vQGJydW5uL2RldGVjdGluZy1hdXRvZmlsbGVkLWZpZWxkcy1pbi1qYXZhc2NyaXB0LWFlZDU5OGQyNWRhN1xuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBdXRvZmlsbE1vbml0b3IgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9tb25pdG9yZWRFbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwgTW9uaXRvcmVkRWxlbWVudEluZm8+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLCBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge31cblxuICAvKipcbiAgICogTW9uaXRvciBmb3IgY2hhbmdlcyBpbiB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgdGhlIGdpdmVuIGlucHV0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIG1vbml0b3IuXG4gICAqIEByZXR1cm4gQSBzdHJlYW0gb2YgYXV0b2ZpbGwgc3RhdGUgY2hhbmdlcy5cbiAgICovXG4gIG1vbml0b3IoZWxlbWVudDogRWxlbWVudCk6IE9ic2VydmFibGU8QXV0b2ZpbGxFdmVudD47XG5cbiAgLyoqXG4gICAqIE1vbml0b3IgZm9yIGNoYW5nZXMgaW4gdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBtb25pdG9yLlxuICAgKiBAcmV0dXJuIEEgc3RyZWFtIG9mIGF1dG9maWxsIHN0YXRlIGNoYW5nZXMuXG4gICAqL1xuICBtb25pdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWY8RWxlbWVudD4pOiBPYnNlcnZhYmxlPEF1dG9maWxsRXZlbnQ+O1xuXG4gIG1vbml0b3IoZWxlbWVudE9yUmVmOiBFbGVtZW50IHwgRWxlbWVudFJlZjxFbGVtZW50Pik6IE9ic2VydmFibGU8QXV0b2ZpbGxFdmVudD4ge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gRU1QVFk7XG4gICAgfVxuXG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudE9yUmVmKTtcbiAgICBjb25zdCBpbmZvID0gdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKGluZm8pIHtcbiAgICAgIHJldHVybiBpbmZvLnN1YmplY3Q7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFN1YmplY3Q8QXV0b2ZpbGxFdmVudD4oKTtcbiAgICBjb25zdCBjc3NDbGFzcyA9ICdjZGstdGV4dC1maWVsZC1hdXRvZmlsbGVkJztcbiAgICBjb25zdCBsaXN0ZW5lciA9ICgoZXZlbnQ6IEFuaW1hdGlvbkV2ZW50KSA9PiB7XG4gICAgICAvLyBBbmltYXRpb24gZXZlbnRzIGZpcmUgb24gaW5pdGlhbCBlbGVtZW50IHJlbmRlciwgd2UgY2hlY2sgZm9yIHRoZSBwcmVzZW5jZSBvZiB0aGUgYXV0b2ZpbGxcbiAgICAgIC8vIENTUyBjbGFzcyB0byBtYWtlIHN1cmUgdGhpcyBpcyBhIHJlYWwgY2hhbmdlIGluIHN0YXRlLCBub3QganVzdCB0aGUgaW5pdGlhbCByZW5kZXIgYmVmb3JlXG4gICAgICAvLyB3ZSBmaXJlIG9mZiBldmVudHMuXG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50LmFuaW1hdGlvbk5hbWUgPT09ICdjZGstdGV4dC1maWVsZC1hdXRvZmlsbC1zdGFydCcgJiZcbiAgICAgICAgIWVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNzc0NsYXNzKVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gcmVzdWx0Lm5leHQoe3RhcmdldDogZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsIGlzQXV0b2ZpbGxlZDogdHJ1ZX0pKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGV2ZW50LmFuaW1hdGlvbk5hbWUgPT09ICdjZGstdGV4dC1maWVsZC1hdXRvZmlsbC1lbmQnICYmXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNzc0NsYXNzKVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjc3NDbGFzcyk7XG4gICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4gcmVzdWx0Lm5leHQoe3RhcmdldDogZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsIGlzQXV0b2ZpbGxlZDogZmFsc2V9KSk7XG4gICAgICB9XG4gICAgfSkgYXMgRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdDtcblxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbnN0YXJ0JywgbGlzdGVuZXIsIGxpc3RlbmVyT3B0aW9ucyk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2Nkay10ZXh0LWZpZWxkLWF1dG9maWxsLW1vbml0b3JlZCcpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuc2V0KGVsZW1lbnQsIHtcbiAgICAgIHN1YmplY3Q6IHJlc3VsdCxcbiAgICAgIHVubGlzdGVuOiAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uc3RhcnQnLCBsaXN0ZW5lciwgbGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgbW9uaXRvcmluZyB0aGUgYXV0b2ZpbGwgc3RhdGUgb2YgdGhlIGdpdmVuIGlucHV0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHN0b3AgbW9uaXRvcmluZy5cbiAgICovXG4gIHN0b3BNb25pdG9yaW5nKGVsZW1lbnQ6IEVsZW1lbnQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBTdG9wIG1vbml0b3JpbmcgdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBzdG9wIG1vbml0b3JpbmcuXG4gICAqL1xuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50OiBFbGVtZW50UmVmPEVsZW1lbnQ+KTogdm9pZDtcblxuICBzdG9wTW9uaXRvcmluZyhlbGVtZW50T3JSZWY6IEVsZW1lbnQgfCBFbGVtZW50UmVmPEVsZW1lbnQ+KTogdm9pZCB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvZXJjZUVsZW1lbnQoZWxlbWVudE9yUmVmKTtcbiAgICBjb25zdCBpbmZvID0gdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuZ2V0KGVsZW1lbnQpO1xuXG4gICAgaWYgKGluZm8pIHtcbiAgICAgIGluZm8udW5saXN0ZW4oKTtcbiAgICAgIGluZm8uc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdjZGstdGV4dC1maWVsZC1hdXRvZmlsbC1tb25pdG9yZWQnKTtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnY2RrLXRleHQtZmllbGQtYXV0b2ZpbGxlZCcpO1xuICAgICAgdGhpcy5fbW9uaXRvcmVkRWxlbWVudHMuZGVsZXRlKGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX21vbml0b3JlZEVsZW1lbnRzLmZvckVhY2goKF9pbmZvLCBlbGVtZW50KSA9PiB0aGlzLnN0b3BNb25pdG9yaW5nKGVsZW1lbnQpKTtcbiAgfVxufVxuXG4vKiogQSBkaXJlY3RpdmUgdGhhdCBjYW4gYmUgdXNlZCB0byBtb25pdG9yIHRoZSBhdXRvZmlsbCBzdGF0ZSBvZiBhbiBpbnB1dC4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtBdXRvZmlsbF0nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtBdXRvZmlsbCBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25Jbml0IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGF1dG9maWxsIHN0YXRlIG9mIHRoZSBlbGVtZW50IGNoYW5nZXMuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBjZGtBdXRvZmlsbCA9IG5ldyBFdmVudEVtaXR0ZXI8QXV0b2ZpbGxFdmVudD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcml2YXRlIF9hdXRvZmlsbE1vbml0b3I6IEF1dG9maWxsTW9uaXRvcixcbiAgKSB7fVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX2F1dG9maWxsTW9uaXRvclxuICAgICAgLm1vbml0b3IodGhpcy5fZWxlbWVudFJlZilcbiAgICAgIC5zdWJzY3JpYmUoZXZlbnQgPT4gdGhpcy5jZGtBdXRvZmlsbC5lbWl0KGV2ZW50KSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9hdXRvZmlsbE1vbml0b3Iuc3RvcE1vbml0b3JpbmcodGhpcy5fZWxlbWVudFJlZik7XG4gIH1cbn1cbiJdfQ==