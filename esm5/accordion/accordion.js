/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, Input } from '@angular/core';
import { Subject } from 'rxjs';
/** Used to generate unique ID for each accordion. */
var nextId = 0;
/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 */
var CdkAccordion = /** @class */ (function () {
    function CdkAccordion() {
        /** Emits when the state of the accordion changes */
        this._stateChanges = new Subject();
        /** Stream that emits true/false when openAll/closeAll is triggered. */
        this._openCloseAllActions = new Subject();
        /** A readonly id value to use for unique selection coordination. */
        this.id = "cdk-accordion-" + nextId++;
        this._multi = false;
    }
    Object.defineProperty(CdkAccordion.prototype, "multi", {
        /** Whether the accordion should allow multiple expanded accordion items simultaneously. */
        get: function () { return this._multi; },
        set: function (multi) { this._multi = coerceBooleanProperty(multi); },
        enumerable: true,
        configurable: true
    });
    /** Opens all enabled accordion items in an accordion where multi is enabled. */
    CdkAccordion.prototype.openAll = function () {
        this._openCloseAll(true);
    };
    /** Closes all enabled accordion items in an accordion where multi is enabled. */
    CdkAccordion.prototype.closeAll = function () {
        this._openCloseAll(false);
    };
    CdkAccordion.prototype.ngOnChanges = function (changes) {
        this._stateChanges.next(changes);
    };
    CdkAccordion.prototype.ngOnDestroy = function () {
        this._stateChanges.complete();
    };
    CdkAccordion.prototype._openCloseAll = function (expanded) {
        if (this.multi) {
            this._openCloseAllActions.next(expanded);
        }
    };
    CdkAccordion.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-accordion, [cdkAccordion]',
                    exportAs: 'cdkAccordion',
                },] }
    ];
    CdkAccordion.propDecorators = {
        multi: [{ type: Input }]
    };
    return CdkAccordion;
}());
export { CdkAccordion };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hY2NvcmRpb24vYWNjb3JkaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVELE9BQU8sRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFzQyxNQUFNLGVBQWUsQ0FBQztBQUNwRixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRTdCLHFEQUFxRDtBQUNyRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFFZjs7R0FFRztBQUNIO0lBQUE7UUFLRSxvREFBb0Q7UUFDM0Msa0JBQWEsR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQztRQUV0RCx1RUFBdUU7UUFDOUQseUJBQW9CLEdBQXFCLElBQUksT0FBTyxFQUFXLENBQUM7UUFFekUsb0VBQW9FO1FBQzNELE9BQUUsR0FBRyxtQkFBaUIsTUFBTSxFQUFJLENBQUM7UUFNbEMsV0FBTSxHQUFZLEtBQUssQ0FBQztJQXlCbEMsQ0FBQztJQTVCQyxzQkFDSSwrQkFBSztRQUZULDJGQUEyRjthQUMzRixjQUN1QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2FBQzVDLFVBQVUsS0FBYyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FEN0I7SUFJNUMsZ0ZBQWdGO0lBQ2hGLDhCQUFPLEdBQVA7UUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxpRkFBaUY7SUFDakYsK0JBQVEsR0FBUjtRQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGtDQUFXLEdBQVgsVUFBWSxPQUFzQjtRQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsa0NBQVcsR0FBWDtRQUNFLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVPLG9DQUFhLEdBQXJCLFVBQXNCLFFBQWlCO1FBQ3JDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDMUM7SUFDSCxDQUFDOztnQkExQ0YsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSwrQkFBK0I7b0JBQ3pDLFFBQVEsRUFBRSxjQUFjO2lCQUN6Qjs7O3dCQVlFLEtBQUs7O0lBNEJSLG1CQUFDO0NBQUEsQUEzQ0QsSUEyQ0M7U0F2Q1ksWUFBWSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RGlyZWN0aXZlLCBJbnB1dCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIFNpbXBsZUNoYW5nZXN9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIGFjY29yZGlvbi4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIERpcmVjdGl2ZSB3aG9zZSBwdXJwb3NlIGlzIHRvIG1hbmFnZSB0aGUgZXhwYW5kZWQgc3RhdGUgb2YgQ2RrQWNjb3JkaW9uSXRlbSBjaGlsZHJlbi5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWFjY29yZGlvbiwgW2Nka0FjY29yZGlvbl0nLFxuICBleHBvcnRBczogJ2Nka0FjY29yZGlvbicsXG59KVxuZXhwb3J0IGNsYXNzIENka0FjY29yZGlvbiBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gY2hhbmdlcyAqL1xuICByZWFkb25seSBfc3RhdGVDaGFuZ2VzID0gbmV3IFN1YmplY3Q8U2ltcGxlQ2hhbmdlcz4oKTtcblxuICAvKiogU3RyZWFtIHRoYXQgZW1pdHMgdHJ1ZS9mYWxzZSB3aGVuIG9wZW5BbGwvY2xvc2VBbGwgaXMgdHJpZ2dlcmVkLiAqL1xuICByZWFkb25seSBfb3BlbkNsb3NlQWxsQWN0aW9uczogU3ViamVjdDxib29sZWFuPiA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XG5cbiAgLyoqIEEgcmVhZG9ubHkgaWQgdmFsdWUgdG8gdXNlIGZvciB1bmlxdWUgc2VsZWN0aW9uIGNvb3JkaW5hdGlvbi4gKi9cbiAgcmVhZG9ubHkgaWQgPSBgY2RrLWFjY29yZGlvbi0ke25leHRJZCsrfWA7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGFjY29yZGlvbiBzaG91bGQgYWxsb3cgbXVsdGlwbGUgZXhwYW5kZWQgYWNjb3JkaW9uIGl0ZW1zIHNpbXVsdGFuZW91c2x5LiAqL1xuICBASW5wdXQoKVxuICBnZXQgbXVsdGkoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9tdWx0aTsgfVxuICBzZXQgbXVsdGkobXVsdGk6IGJvb2xlYW4pIHsgdGhpcy5fbXVsdGkgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkobXVsdGkpOyB9XG4gIHByaXZhdGUgX211bHRpOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIE9wZW5zIGFsbCBlbmFibGVkIGFjY29yZGlvbiBpdGVtcyBpbiBhbiBhY2NvcmRpb24gd2hlcmUgbXVsdGkgaXMgZW5hYmxlZC4gKi9cbiAgb3BlbkFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLl9vcGVuQ2xvc2VBbGwodHJ1ZSk7XG4gIH1cblxuICAvKiogQ2xvc2VzIGFsbCBlbmFibGVkIGFjY29yZGlvbiBpdGVtcyBpbiBhbiBhY2NvcmRpb24gd2hlcmUgbXVsdGkgaXMgZW5hYmxlZC4gKi9cbiAgY2xvc2VBbGwoKTogdm9pZCB7XG4gICAgdGhpcy5fb3BlbkNsb3NlQWxsKGZhbHNlKTtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMubmV4dChjaGFuZ2VzKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfb3BlbkNsb3NlQWxsKGV4cGFuZGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubXVsdGkpIHtcbiAgICAgIHRoaXMuX29wZW5DbG9zZUFsbEFjdGlvbnMubmV4dChleHBhbmRlZCk7XG4gICAgfVxuICB9XG59XG4iXX0=