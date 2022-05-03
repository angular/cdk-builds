/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive } from '@angular/core';
import { CdkMenuItemSelectable } from './menu-item-selectable';
import { CdkMenuItem } from './menu-item';
import * as i0 from "@angular/core";
/**
 * A directive providing behavior for the "menuitemcheckbox" ARIA role, which behaves similarly to a
 * conventional checkbox.
 */
export class CdkMenuItemCheckbox extends CdkMenuItemSelectable {
    /**
     * Toggle the checked state of the checkbox.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options) {
        super.trigger(options);
        if (!this.disabled) {
            this.checked = !this.checked;
        }
    }
}
CdkMenuItemCheckbox.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkMenuItemCheckbox, deps: null, target: i0.ɵɵFactoryTarget.Directive });
CdkMenuItemCheckbox.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "14.0.0-next.15", type: CdkMenuItemCheckbox, selector: "[cdkMenuItemCheckbox]", host: { attributes: { "role": "menuitemcheckbox" } }, providers: [
        { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemCheckbox },
        { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
    ], exportAs: ["cdkMenuItemCheckbox"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkMenuItemCheckbox, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuItemCheckbox]',
                    exportAs: 'cdkMenuItemCheckbox',
                    host: {
                        'role': 'menuitemcheckbox',
                    },
                    providers: [
                        { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemCheckbox },
                        { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
                    ],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLWNoZWNrYm94LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtaXRlbS1jaGVja2JveC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxhQUFhLENBQUM7O0FBRXhDOzs7R0FHRztBQVlILE1BQU0sT0FBTyxtQkFBb0IsU0FBUSxxQkFBcUI7SUFDNUQ7Ozs7T0FJRztJQUNNLE9BQU8sQ0FBQyxPQUE2QjtRQUM1QyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXZCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQzlCO0lBQ0gsQ0FBQzs7d0hBWlUsbUJBQW1COzRHQUFuQixtQkFBbUIsc0dBTG5CO1FBQ1QsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDO1FBQ2xFLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUM7S0FDM0Q7bUdBRVUsbUJBQW1CO2tCQVgvQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSx1QkFBdUI7b0JBQ2pDLFFBQVEsRUFBRSxxQkFBcUI7b0JBQy9CLElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsa0JBQWtCO3FCQUMzQjtvQkFDRCxTQUFTLEVBQUU7d0JBQ1QsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxxQkFBcUIsRUFBQzt3QkFDbEUsRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxxQkFBcUIsRUFBQztxQkFDM0Q7aUJBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDZGtNZW51SXRlbVNlbGVjdGFibGV9IGZyb20gJy4vbWVudS1pdGVtLXNlbGVjdGFibGUnO1xuaW1wb3J0IHtDZGtNZW51SXRlbX0gZnJvbSAnLi9tZW51LWl0ZW0nO1xuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHByb3ZpZGluZyBiZWhhdmlvciBmb3IgdGhlIFwibWVudWl0ZW1jaGVja2JveFwiIEFSSUEgcm9sZSwgd2hpY2ggYmVoYXZlcyBzaW1pbGFybHkgdG8gYVxuICogY29udmVudGlvbmFsIGNoZWNrYm94LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTWVudUl0ZW1DaGVja2JveF0nLFxuICBleHBvcnRBczogJ2Nka01lbnVJdGVtQ2hlY2tib3gnLFxuICBob3N0OiB7XG4gICAgJ3JvbGUnOiAnbWVudWl0ZW1jaGVja2JveCcsXG4gIH0sXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBDZGtNZW51SXRlbVNlbGVjdGFibGUsIHVzZUV4aXN0aW5nOiBDZGtNZW51SXRlbUNoZWNrYm94fSxcbiAgICB7cHJvdmlkZTogQ2RrTWVudUl0ZW0sIHVzZUV4aXN0aW5nOiBDZGtNZW51SXRlbVNlbGVjdGFibGV9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtNZW51SXRlbUNoZWNrYm94IGV4dGVuZHMgQ2RrTWVudUl0ZW1TZWxlY3RhYmxlIHtcbiAgLyoqXG4gICAqIFRvZ2dsZSB0aGUgY2hlY2tlZCBzdGF0ZSBvZiB0aGUgY2hlY2tib3guXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdGhlIGNvbmZpZ3VyZSBob3cgdGhlIGl0ZW0gaXMgdHJpZ2dlcmVkXG4gICAqICAgLSBrZWVwT3Blbjogc3BlY2lmaWVzIHRoYXQgdGhlIG1lbnUgc2hvdWxkIGJlIGtlcHQgb3BlbiBhZnRlciB0cmlnZ2VyaW5nIHRoZSBpdGVtLlxuICAgKi9cbiAgb3ZlcnJpZGUgdHJpZ2dlcihvcHRpb25zPzoge2tlZXBPcGVuOiBib29sZWFufSkge1xuICAgIHN1cGVyLnRyaWdnZXIob3B0aW9ucyk7XG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuY2hlY2tlZCA9ICF0aGlzLmNoZWNrZWQ7XG4gICAgfVxuICB9XG59XG4iXX0=