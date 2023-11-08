/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Input, booleanAttribute } from '@angular/core';
import { CdkMenuItem } from './menu-item';
import * as i0 from "@angular/core";
/** Base class providing checked state for selectable MenuItems. */
export class CdkMenuItemSelectable extends CdkMenuItem {
    constructor() {
        super(...arguments);
        /** Whether the element is checked */
        this.checked = false;
        /** Whether the item should close the menu if triggered by the spacebar. */
        this.closeOnSpacebarTrigger = false;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkMenuItemSelectable, deps: null, target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0", type: CdkMenuItemSelectable, inputs: { checked: ["cdkMenuItemChecked", "checked", booleanAttribute] }, host: { properties: { "attr.aria-checked": "!!checked", "attr.aria-disabled": "disabled || null" } }, usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkMenuItemSelectable, decorators: [{
            type: Directive,
            args: [{
                    host: {
                        '[attr.aria-checked]': '!!checked',
                        '[attr.aria-disabled]': 'disabled || null',
                    },
                }]
        }], propDecorators: { checked: [{
                type: Input,
                args: [{ alias: 'cdkMenuItemChecked', transform: booleanAttribute }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLXNlbGVjdGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1pdGVtLXNlbGVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGFBQWEsQ0FBQzs7QUFFeEMsbUVBQW1FO0FBT25FLE1BQU0sT0FBZ0IscUJBQXNCLFNBQVEsV0FBVztJQU4vRDs7UUFPRSxxQ0FBcUM7UUFDOEIsWUFBTyxHQUFZLEtBQUssQ0FBQztRQUU1RiwyRUFBMkU7UUFDeEQsMkJBQXNCLEdBQUcsS0FBSyxDQUFDO0tBQ25EOzhHQU5xQixxQkFBcUI7a0dBQXJCLHFCQUFxQix1REFFTyxnQkFBZ0I7OzJGQUY1QyxxQkFBcUI7a0JBTjFDLFNBQVM7bUJBQUM7b0JBQ1QsSUFBSSxFQUFFO3dCQUNKLHFCQUFxQixFQUFFLFdBQVc7d0JBQ2xDLHNCQUFzQixFQUFFLGtCQUFrQjtxQkFDM0M7aUJBQ0Y7OEJBR29FLE9BQU87c0JBQXpFLEtBQUs7dUJBQUMsRUFBQyxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBJbnB1dCwgYm9vbGVhbkF0dHJpYnV0ZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nka01lbnVJdGVtfSBmcm9tICcuL21lbnUtaXRlbSc7XG5cbi8qKiBCYXNlIGNsYXNzIHByb3ZpZGluZyBjaGVja2VkIHN0YXRlIGZvciBzZWxlY3RhYmxlIE1lbnVJdGVtcy4gKi9cbkBEaXJlY3RpdmUoe1xuICBob3N0OiB7XG4gICAgJ1thdHRyLmFyaWEtY2hlY2tlZF0nOiAnISFjaGVja2VkJyxcbiAgICAnW2F0dHIuYXJpYS1kaXNhYmxlZF0nOiAnZGlzYWJsZWQgfHwgbnVsbCcsXG4gIH0sXG59KVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENka01lbnVJdGVtU2VsZWN0YWJsZSBleHRlbmRzIENka01lbnVJdGVtIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgY2hlY2tlZCAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrTWVudUl0ZW1DaGVja2VkJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSkgY2hlY2tlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBpdGVtIHNob3VsZCBjbG9zZSB0aGUgbWVudSBpZiB0cmlnZ2VyZWQgYnkgdGhlIHNwYWNlYmFyLiAqL1xuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgY2xvc2VPblNwYWNlYmFyVHJpZ2dlciA9IGZhbHNlO1xufVxuIl19