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
            this.value = (value === 'ltr' || value === 'rtl') ? value : 'ltr';
        }
    }
    ngOnDestroy() {
        this.change.complete();
    }
}
Directionality.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Directionality, deps: [{ token: DIR_DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
Directionality.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Directionality, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Directionality, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DIR_DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyZWN0aW9uYWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2JpZGkvZGlyZWN0aW9uYWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7O0FBTWxEOzs7R0FHRztBQUVILE1BQU0sT0FBTyxjQUFjO0lBT3pCLFlBQThDLFNBQWU7UUFON0Qsd0NBQXdDO1FBQy9CLFVBQUssR0FBYyxLQUFLLENBQUM7UUFFbEMsa0VBQWtFO1FBQ3pELFdBQU0sR0FBRyxJQUFJLFlBQVksRUFBYSxDQUFDO1FBRzlDLElBQUksU0FBUyxFQUFFO1lBQ2IsOEJBQThCO1lBQzlCLDJDQUEyQztZQUMzQyxrRkFBa0Y7WUFDbEYsdUZBQXVGO1lBQ3ZGLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDM0QsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNqRixNQUFNLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7U0FDbkU7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDekIsQ0FBQzs7bUhBdEJVLGNBQWMsa0JBT08sWUFBWTt1SEFQakMsY0FBYyxjQURGLE1BQU07bUdBQ2xCLGNBQWM7a0JBRDFCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFRakIsUUFBUTs7MEJBQUksTUFBTTsyQkFBQyxZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyLCBJbmplY3QsIEluamVjdGFibGUsIE9wdGlvbmFsLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtESVJfRE9DVU1FTlR9IGZyb20gJy4vZGlyLWRvY3VtZW50LXRva2VuJztcblxuXG5leHBvcnQgdHlwZSBEaXJlY3Rpb24gPSAnbHRyJyB8ICdydGwnO1xuXG5cbi8qKlxuICogVGhlIGRpcmVjdGlvbmFsaXR5IChMVFIgLyBSVEwpIGNvbnRleHQgZm9yIHRoZSBhcHBsaWNhdGlvbiAob3IgYSBzdWJ0cmVlIG9mIGl0KS5cbiAqIEV4cG9zZXMgdGhlIGN1cnJlbnQgZGlyZWN0aW9uIGFuZCBhIHN0cmVhbSBvZiBkaXJlY3Rpb24gY2hhbmdlcy5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRGlyZWN0aW9uYWxpdHkgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGN1cnJlbnQgJ2x0cicgb3IgJ3J0bCcgdmFsdWUuICovXG4gIHJlYWRvbmx5IHZhbHVlOiBEaXJlY3Rpb24gPSAnbHRyJztcblxuICAvKiogU3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlICdsdHInIC8gJ3J0bCcgc3RhdGUgY2hhbmdlcy4gKi9cbiAgcmVhZG9ubHkgY2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxEaXJlY3Rpb24+KCk7XG5cbiAgY29uc3RydWN0b3IoQE9wdGlvbmFsKCkgQEluamVjdChESVJfRE9DVU1FTlQpIF9kb2N1bWVudD86IGFueSkge1xuICAgIGlmIChfZG9jdW1lbnQpIHtcbiAgICAgIC8vIFRPRE86IGhhbmRsZSAnYXV0bycgdmFsdWUgLVxuICAgICAgLy8gV2Ugc3RpbGwgbmVlZCB0byBhY2NvdW50IGZvciBkaXI9XCJhdXRvXCIuXG4gICAgICAvLyBJdCBsb29rcyBsaWtlIEhUTUxFbGVtZW5ldC5kaXIgaXMgYWxzbyBcImF1dG9cIiB3aGVuIHRoYXQncyBzZXQgdG8gdGhlIGF0dHJpYnV0ZSxcbiAgICAgIC8vIGJ1dCBnZXRDb21wdXRlZFN0eWxlIHJldHVybiBlaXRoZXIgXCJsdHJcIiBvciBcInJ0bFwiLiBhdm9pZGluZyBnZXRDb21wdXRlZFN0eWxlIGZvciBub3dcbiAgICAgIGNvbnN0IGJvZHlEaXIgPSBfZG9jdW1lbnQuYm9keSA/IF9kb2N1bWVudC5ib2R5LmRpciA6IG51bGw7XG4gICAgICBjb25zdCBodG1sRGlyID0gX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCA/IF9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGlyIDogbnVsbDtcbiAgICAgIGNvbnN0IHZhbHVlID0gYm9keURpciB8fCBodG1sRGlyO1xuICAgICAgdGhpcy52YWx1ZSA9ICh2YWx1ZSA9PT0gJ2x0cicgfHwgdmFsdWUgPT09ICdydGwnKSA/IHZhbHVlIDogJ2x0cic7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5jaGFuZ2UuY29tcGxldGUoKTtcbiAgfVxufVxuIl19