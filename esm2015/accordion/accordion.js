/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/accordion/accordion.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * Used to generate unique ID for each accordion.
 * @type {?}
 */
let nextId = 0;
/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 */
let CdkAccordion = /** @class */ (() => {
    /**
     * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
     */
    class CdkAccordion {
        constructor() {
            /**
             * Emits when the state of the accordion changes
             */
            this._stateChanges = new Subject();
            /**
             * Stream that emits true/false when openAll/closeAll is triggered.
             */
            this._openCloseAllActions = new Subject();
            /**
             * A readonly id value to use for unique selection coordination.
             */
            this.id = `cdk-accordion-${nextId++}`;
            this._multi = false;
        }
        /**
         * Whether the accordion should allow multiple expanded accordion items simultaneously.
         * @return {?}
         */
        get multi() { return this._multi; }
        /**
         * @param {?} multi
         * @return {?}
         */
        set multi(multi) { this._multi = coerceBooleanProperty(multi); }
        /**
         * Opens all enabled accordion items in an accordion where multi is enabled.
         * @return {?}
         */
        openAll() {
            this._openCloseAll(true);
        }
        /**
         * Closes all enabled accordion items in an accordion where multi is enabled.
         * @return {?}
         */
        closeAll() {
            this._openCloseAll(false);
        }
        /**
         * @param {?} changes
         * @return {?}
         */
        ngOnChanges(changes) {
            this._stateChanges.next(changes);
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            this._stateChanges.complete();
        }
        /**
         * @private
         * @param {?} expanded
         * @return {?}
         */
        _openCloseAll(expanded) {
            if (this.multi) {
                this._openCloseAllActions.next(expanded);
            }
        }
    }
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
})();
export { CdkAccordion };
if (false) {
    /** @type {?} */
    CdkAccordion.ngAcceptInputType_multi;
    /**
     * Emits when the state of the accordion changes
     * @type {?}
     */
    CdkAccordion.prototype._stateChanges;
    /**
     * Stream that emits true/false when openAll/closeAll is triggered.
     * @type {?}
     */
    CdkAccordion.prototype._openCloseAllActions;
    /**
     * A readonly id value to use for unique selection coordination.
     * @type {?}
     */
    CdkAccordion.prototype.id;
    /**
     * @type {?}
     * @private
     */
    CdkAccordion.prototype._multi;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hY2NvcmRpb24vYWNjb3JkaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFzQyxNQUFNLGVBQWUsQ0FBQztBQUNwRixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDOzs7OztJQUd6QixNQUFNLEdBQUcsQ0FBQzs7OztBQUtkOzs7O0lBQUEsTUFJYSxZQUFZO1FBSnpCOzs7O1lBTVcsa0JBQWEsR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQzs7OztZQUc3Qyx5QkFBb0IsR0FBcUIsSUFBSSxPQUFPLEVBQVcsQ0FBQzs7OztZQUdoRSxPQUFFLEdBQUcsaUJBQWlCLE1BQU0sRUFBRSxFQUFFLENBQUM7WUFNbEMsV0FBTSxHQUFZLEtBQUssQ0FBQztRQTJCbEMsQ0FBQzs7Ozs7UUE5QkMsSUFDSSxLQUFLLEtBQWMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzs7Ozs7UUFDNUMsSUFBSSxLQUFLLENBQUMsS0FBYyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7OztRQUl6RSxPQUFPO1lBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDOzs7OztRQUdELFFBQVE7WUFDTixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7Ozs7O1FBRUQsV0FBVyxDQUFDLE9BQXNCO1lBQ2hDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7Ozs7UUFFRCxXQUFXO1lBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQyxDQUFDOzs7Ozs7UUFFTyxhQUFhLENBQUMsUUFBaUI7WUFDckMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNkLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDMUM7UUFDSCxDQUFDOzs7Z0JBMUNGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsK0JBQStCO29CQUN6QyxRQUFRLEVBQUUsY0FBYztpQkFDekI7Ozt3QkFZRSxLQUFLOztJQThCUixtQkFBQztLQUFBO1NBekNZLFlBQVk7OztJQXdDdkIscUNBQTZDOzs7OztJQXRDN0MscUNBQXNEOzs7OztJQUd0RCw0Q0FBeUU7Ozs7O0lBR3pFLDBCQUEwQzs7Ozs7SUFNMUMsOEJBQWdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBTaW1wbGVDaGFuZ2VzfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKiBVc2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRCBmb3IgZWFjaCBhY2NvcmRpb24uICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBEaXJlY3RpdmUgd2hvc2UgcHVycG9zZSBpcyB0byBtYW5hZ2UgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIENka0FjY29yZGlvbkl0ZW0gY2hpbGRyZW4uXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1hY2NvcmRpb24sIFtjZGtBY2NvcmRpb25dJyxcbiAgZXhwb3J0QXM6ICdjZGtBY2NvcmRpb24nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtBY2NvcmRpb24gaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGNoYW5nZXMgKi9cbiAgcmVhZG9ubHkgX3N0YXRlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PFNpbXBsZUNoYW5nZXM+KCk7XG5cbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHRydWUvZmFsc2Ugd2hlbiBvcGVuQWxsL2Nsb3NlQWxsIGlzIHRyaWdnZXJlZC4gKi9cbiAgcmVhZG9ubHkgX29wZW5DbG9zZUFsbEFjdGlvbnM6IFN1YmplY3Q8Ym9vbGVhbj4gPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuXG4gIC8qKiBBIHJlYWRvbmx5IGlkIHZhbHVlIHRvIHVzZSBmb3IgdW5pcXVlIHNlbGVjdGlvbiBjb29yZGluYXRpb24uICovXG4gIHJlYWRvbmx5IGlkID0gYGNkay1hY2NvcmRpb24tJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBhY2NvcmRpb24gc2hvdWxkIGFsbG93IG11bHRpcGxlIGV4cGFuZGVkIGFjY29yZGlvbiBpdGVtcyBzaW11bHRhbmVvdXNseS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG11bHRpKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fbXVsdGk7IH1cbiAgc2V0IG11bHRpKG11bHRpOiBib29sZWFuKSB7IHRoaXMuX211bHRpID0gY29lcmNlQm9vbGVhblByb3BlcnR5KG11bHRpKTsgfVxuICBwcml2YXRlIF9tdWx0aTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBPcGVucyBhbGwgZW5hYmxlZCBhY2NvcmRpb24gaXRlbXMgaW4gYW4gYWNjb3JkaW9uIHdoZXJlIG11bHRpIGlzIGVuYWJsZWQuICovXG4gIG9wZW5BbGwoKTogdm9pZCB7XG4gICAgdGhpcy5fb3BlbkNsb3NlQWxsKHRydWUpO1xuICB9XG5cbiAgLyoqIENsb3NlcyBhbGwgZW5hYmxlZCBhY2NvcmRpb24gaXRlbXMgaW4gYW4gYWNjb3JkaW9uIHdoZXJlIG11bHRpIGlzIGVuYWJsZWQuICovXG4gIGNsb3NlQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuX29wZW5DbG9zZUFsbChmYWxzZSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLm5leHQoY2hhbmdlcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX29wZW5DbG9zZUFsbChleHBhbmRlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLm11bHRpKSB7XG4gICAgICB0aGlzLl9vcGVuQ2xvc2VBbGxBY3Rpb25zLm5leHQoZXhwYW5kZWQpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9tdWx0aTogQm9vbGVhbklucHV0O1xufVxuIl19