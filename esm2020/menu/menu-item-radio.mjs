/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { Directive, inject } from '@angular/core';
import { CdkMenuItemSelectable } from './menu-item-selectable';
import { CdkMenuItem } from './menu-item';
import * as i0 from "@angular/core";
/** Counter used to set a unique id and name for a selectable item */
let nextId = 0;
/**
 * A directive providing behavior for the "menuitemradio" ARIA role, which behaves similarly to
 * a conventional radio-button. Any sibling `CdkMenuItemRadio` instances within the same `CdkMenu`
 * or `CdkMenuGroup` comprise a radio group with unique selection enforced.
 */
export class CdkMenuItemRadio extends CdkMenuItemSelectable {
    constructor() {
        super();
        /** The unique selection dispatcher for this radio's `CdkMenuGroup`. */
        this._selectionDispatcher = inject(UniqueSelectionDispatcher);
        /** An ID to identify this radio item to the `UniqueSelectionDispatcher`. */
        this._id = `${nextId++}`;
        this._registerDispatcherListener();
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        this._removeDispatcherListener();
    }
    /**
     * Toggles the checked state of the radio-button.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options) {
        super.trigger(options);
        if (!this.disabled) {
            this._selectionDispatcher.notify(this._id, '');
        }
    }
    /** Configure the unique selection dispatcher listener in order to toggle the checked state  */
    _registerDispatcherListener() {
        this._removeDispatcherListener = this._selectionDispatcher.listen((id) => {
            this.checked = this._id === id;
        });
    }
}
CdkMenuItemRadio.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkMenuItemRadio, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkMenuItemRadio.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkMenuItemRadio, selector: "[cdkMenuItemRadio]", host: { attributes: { "role": "menuitemradio" }, properties: { "class.cdk-menu-item-radio": "true" } }, providers: [
        { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio },
        { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
    ], exportAs: ["cdkMenuItemRadio"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkMenuItemRadio, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkMenuItemRadio]',
                    exportAs: 'cdkMenuItemRadio',
                    host: {
                        'role': 'menuitemradio',
                        '[class.cdk-menu-item-radio]': 'true',
                    },
                    providers: [
                        { provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio },
                        { provide: CdkMenuItem, useExisting: CdkMenuItemSelectable },
                    ],
                }]
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1pdGVtLXJhZGlvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtaXRlbS1yYWRpby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRSxPQUFPLEVBQUMsU0FBUyxFQUFFLE1BQU0sRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUMzRCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sYUFBYSxDQUFDOztBQUV4QyxxRUFBcUU7QUFDckUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBRWY7Ozs7R0FJRztBQWFILE1BQU0sT0FBTyxnQkFBaUIsU0FBUSxxQkFBcUI7SUFVekQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQVZWLHVFQUF1RTtRQUN0RCx5QkFBb0IsR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUUxRSw0RUFBNEU7UUFDcEUsUUFBRyxHQUFHLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQztRQU8xQixJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRVEsV0FBVztRQUNsQixLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFcEIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDTSxPQUFPLENBQUMsT0FBNkI7UUFDNUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV2QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNsQixJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDaEQ7SUFDSCxDQUFDO0lBRUQsK0ZBQStGO0lBQ3ZGLDJCQUEyQjtRQUNqQyxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQVUsRUFBRSxFQUFFO1lBQy9FLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDOzs2R0F2Q1UsZ0JBQWdCO2lHQUFoQixnQkFBZ0IscUpBTGhCO1FBQ1QsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFDO1FBQy9ELEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUM7S0FDM0Q7MkZBRVUsZ0JBQWdCO2tCQVo1QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvQkFBb0I7b0JBQzlCLFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsZUFBZTt3QkFDdkIsNkJBQTZCLEVBQUUsTUFBTTtxQkFDdEM7b0JBQ0QsU0FBUyxFQUFFO3dCQUNULEVBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLFdBQVcsa0JBQWtCLEVBQUM7d0JBQy9ELEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUM7cUJBQzNEO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7RGlyZWN0aXZlLCBpbmplY3QsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Nka01lbnVJdGVtU2VsZWN0YWJsZX0gZnJvbSAnLi9tZW51LWl0ZW0tc2VsZWN0YWJsZSc7XG5pbXBvcnQge0Nka01lbnVJdGVtfSBmcm9tICcuL21lbnUtaXRlbSc7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gc2V0IGEgdW5pcXVlIGlkIGFuZCBuYW1lIGZvciBhIHNlbGVjdGFibGUgaXRlbSAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogQSBkaXJlY3RpdmUgcHJvdmlkaW5nIGJlaGF2aW9yIGZvciB0aGUgXCJtZW51aXRlbXJhZGlvXCIgQVJJQSByb2xlLCB3aGljaCBiZWhhdmVzIHNpbWlsYXJseSB0b1xuICogYSBjb252ZW50aW9uYWwgcmFkaW8tYnV0dG9uLiBBbnkgc2libGluZyBgQ2RrTWVudUl0ZW1SYWRpb2AgaW5zdGFuY2VzIHdpdGhpbiB0aGUgc2FtZSBgQ2RrTWVudWBcbiAqIG9yIGBDZGtNZW51R3JvdXBgIGNvbXByaXNlIGEgcmFkaW8gZ3JvdXAgd2l0aCB1bmlxdWUgc2VsZWN0aW9uIGVuZm9yY2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrTWVudUl0ZW1SYWRpb10nLFxuICBleHBvcnRBczogJ2Nka01lbnVJdGVtUmFkaW8nLFxuICBob3N0OiB7XG4gICAgJ3JvbGUnOiAnbWVudWl0ZW1yYWRpbycsXG4gICAgJ1tjbGFzcy5jZGstbWVudS1pdGVtLXJhZGlvXSc6ICd0cnVlJyxcbiAgfSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IENka01lbnVJdGVtU2VsZWN0YWJsZSwgdXNlRXhpc3Rpbmc6IENka01lbnVJdGVtUmFkaW99LFxuICAgIHtwcm92aWRlOiBDZGtNZW51SXRlbSwgdXNlRXhpc3Rpbmc6IENka01lbnVJdGVtU2VsZWN0YWJsZX0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka01lbnVJdGVtUmFkaW8gZXh0ZW5kcyBDZGtNZW51SXRlbVNlbGVjdGFibGUgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIHVuaXF1ZSBzZWxlY3Rpb24gZGlzcGF0Y2hlciBmb3IgdGhpcyByYWRpbydzIGBDZGtNZW51R3JvdXBgLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9zZWxlY3Rpb25EaXNwYXRjaGVyID0gaW5qZWN0KFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXIpO1xuXG4gIC8qKiBBbiBJRCB0byBpZGVudGlmeSB0aGlzIHJhZGlvIGl0ZW0gdG8gdGhlIGBVbmlxdWVTZWxlY3Rpb25EaXNwYXRjaGVyYC4gKi9cbiAgcHJpdmF0ZSBfaWQgPSBgJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBGdW5jdGlvbiB0byB1bnJlZ2lzdGVyIHRoZSBzZWxlY3Rpb24gZGlzcGF0Y2hlciAqL1xuICBwcml2YXRlIF9yZW1vdmVEaXNwYXRjaGVyTGlzdGVuZXI6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9yZWdpc3RlckRpc3BhdGNoZXJMaXN0ZW5lcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgbmdPbkRlc3Ryb3koKSB7XG4gICAgc3VwZXIubmdPbkRlc3Ryb3koKTtcblxuICAgIHRoaXMuX3JlbW92ZURpc3BhdGNoZXJMaXN0ZW5lcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGNoZWNrZWQgc3RhdGUgb2YgdGhlIHJhZGlvLWJ1dHRvbi5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0aGUgY29uZmlndXJlIGhvdyB0aGUgaXRlbSBpcyB0cmlnZ2VyZWRcbiAgICogICAtIGtlZXBPcGVuOiBzcGVjaWZpZXMgdGhhdCB0aGUgbWVudSBzaG91bGQgYmUga2VwdCBvcGVuIGFmdGVyIHRyaWdnZXJpbmcgdGhlIGl0ZW0uXG4gICAqL1xuICBvdmVycmlkZSB0cmlnZ2VyKG9wdGlvbnM/OiB7a2VlcE9wZW46IGJvb2xlYW59KSB7XG4gICAgc3VwZXIudHJpZ2dlcihvcHRpb25zKTtcblxuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fc2VsZWN0aW9uRGlzcGF0Y2hlci5ub3RpZnkodGhpcy5faWQsICcnKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ29uZmlndXJlIHRoZSB1bmlxdWUgc2VsZWN0aW9uIGRpc3BhdGNoZXIgbGlzdGVuZXIgaW4gb3JkZXIgdG8gdG9nZ2xlIHRoZSBjaGVja2VkIHN0YXRlICAqL1xuICBwcml2YXRlIF9yZWdpc3RlckRpc3BhdGNoZXJMaXN0ZW5lcigpIHtcbiAgICB0aGlzLl9yZW1vdmVEaXNwYXRjaGVyTGlzdGVuZXIgPSB0aGlzLl9zZWxlY3Rpb25EaXNwYXRjaGVyLmxpc3RlbigoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5jaGVja2VkID0gdGhpcy5faWQgPT09IGlkO1xuICAgIH0pO1xuICB9XG59XG4iXX0=