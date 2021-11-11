/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Inject, Injectable, Optional } from '@angular/core';
import { DIR_DOCUMENT } from './dir-document-token';
import * as i0 from "@angular/core";
/**
 * The directionality (LTR / RTL) context for the application (or a subtree of it).
 * Exposes the current direction and a stream of direction changes.
 */
export class Directionality {
    constructor(_document) {
        /** The current 'ltr' or 'rtl' value. */
        this.value = 'ltr';
        /** Stream that emits whenever the 'ltr' / 'rtl' state changes. */
        this.change = new EventEmitter();
        if (_document) {
            // TODO: handle 'auto' value -
            // We still need to account for dir="auto".
            // It looks like HTMLElemenet.dir is also "auto" when that's set to the attribute,
            // but getComputedStyle return either "ltr" or "rtl". avoiding getComputedStyle for now
            const bodyDir = _document.body ? _document.body.dir : null;
            const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
            const value = bodyDir || htmlDir;
            this.value = value === 'ltr' || value === 'rtl' ? value : 'ltr';
        }
    }
    ngOnDestroy() {
        this.change.complete();
    }
}
Directionality.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: Directionality, deps: [{ token: DIR_DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
Directionality.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: Directionality, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.1", ngImport: i0, type: Directionality, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DIR_DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aW9uYWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2JpZGkvZGlyZWN0aW9uYWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7O0FBSWxEOzs7R0FHRztBQUVILE1BQU0sT0FBTyxjQUFjO0lBT3pCLFlBQThDLFNBQWU7UUFON0Qsd0NBQXdDO1FBQy9CLFVBQUssR0FBYyxLQUFLLENBQUM7UUFFbEMsa0VBQWtFO1FBQ3pELFdBQU0sR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1FBRzlDLElBQUksU0FBUyxFQUFFO1lBQ2IsOEJBQThCO1lBQzlCLDJDQUEyQztZQUMzQyxrRkFBa0Y7WUFDbEYsdUZBQXVGO1lBQ3ZGLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDM0QsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNqRixNQUFNLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztTQUNqRTtJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN6QixDQUFDOzsyR0F0QlUsY0FBYyxrQkFPTyxZQUFZOytHQVBqQyxjQUFjLGNBREYsTUFBTTsyRkFDbEIsY0FBYztrQkFEMUIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQVFqQixRQUFROzswQkFBSSxNQUFNOzJCQUFDLFlBQVkiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFdmVudEVtaXR0ZXIsIEluamVjdCwgSW5qZWN0YWJsZSwgT3B0aW9uYWwsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RJUl9ET0NVTUVOVH0gZnJvbSAnLi9kaXItZG9jdW1lbnQtdG9rZW4nO1xuXG5leHBvcnQgdHlwZSBEaXJlY3Rpb24gPSAnbHRyJyB8ICdydGwnO1xuXG4vKipcbiAqIFRoZSBkaXJlY3Rpb25hbGl0eSAoTFRSIC8gUlRMKSBjb250ZXh0IGZvciB0aGUgYXBwbGljYXRpb24gKG9yIGEgc3VidHJlZSBvZiBpdCkuXG4gKiBFeHBvc2VzIHRoZSBjdXJyZW50IGRpcmVjdGlvbiBhbmQgYSBzdHJlYW0gb2YgZGlyZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIERpcmVjdGlvbmFsaXR5IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBjdXJyZW50ICdsdHInIG9yICdydGwnIHZhbHVlLiAqL1xuICByZWFkb25seSB2YWx1ZTogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSAnbHRyJyAvICdydGwnIHN0YXRlIGNoYW5nZXMuICovXG4gIHJlYWRvbmx5IGNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8RGlyZWN0aW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIEBJbmplY3QoRElSX0RPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICBpZiAoX2RvY3VtZW50KSB7XG4gICAgICAvLyBUT0RPOiBoYW5kbGUgJ2F1dG8nIHZhbHVlIC1cbiAgICAgIC8vIFdlIHN0aWxsIG5lZWQgdG8gYWNjb3VudCBmb3IgZGlyPVwiYXV0b1wiLlxuICAgICAgLy8gSXQgbG9va3MgbGlrZSBIVE1MRWxlbWVuZXQuZGlyIGlzIGFsc28gXCJhdXRvXCIgd2hlbiB0aGF0J3Mgc2V0IHRvIHRoZSBhdHRyaWJ1dGUsXG4gICAgICAvLyBidXQgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm4gZWl0aGVyIFwibHRyXCIgb3IgXCJydGxcIi4gYXZvaWRpbmcgZ2V0Q29tcHV0ZWRTdHlsZSBmb3Igbm93XG4gICAgICBjb25zdCBib2R5RGlyID0gX2RvY3VtZW50LmJvZHkgPyBfZG9jdW1lbnQuYm9keS5kaXIgOiBudWxsO1xuICAgICAgY29uc3QgaHRtbERpciA9IF9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBfZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRpciA6IG51bGw7XG4gICAgICBjb25zdCB2YWx1ZSA9IGJvZHlEaXIgfHwgaHRtbERpcjtcbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZSA9PT0gJ2x0cicgfHwgdmFsdWUgPT09ICdydGwnID8gdmFsdWUgOiAnbHRyJztcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNoYW5nZS5jb21wbGV0ZSgpO1xuICB9XG59XG4iXX0=