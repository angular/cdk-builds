/**
 * @fileoverview added by tsickle
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
export class CdkAccordion {
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
if (false) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hY2NvcmRpb24vYWNjb3JkaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxLQUFLLEVBQXNDLE1BQU0sZUFBZSxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7Ozs7O0lBR3pCLE1BQU0sR0FBRyxDQUFDOzs7O0FBU2QsTUFBTSxPQUFPLFlBQVk7SUFKekI7Ozs7UUFNVyxrQkFBYSxHQUFHLElBQUksT0FBTyxFQUFpQixDQUFDOzs7O1FBRzdDLHlCQUFvQixHQUFxQixJQUFJLE9BQU8sRUFBVyxDQUFDOzs7O1FBR2hFLE9BQUUsR0FBRyxpQkFBaUIsTUFBTSxFQUFFLEVBQUUsQ0FBQztRQU1sQyxXQUFNLEdBQVksS0FBSyxDQUFDO0lBeUJsQyxDQUFDOzs7OztJQTVCQyxJQUNJLEtBQUssS0FBYyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDOzs7OztJQUM1QyxJQUFJLEtBQUssQ0FBQyxLQUFjLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBSXpFLE9BQU87UUFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7Ozs7O0lBR0QsUUFBUTtRQUNOLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQzs7Ozs7SUFFRCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkMsQ0FBQzs7OztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2hDLENBQUM7Ozs7OztJQUVPLGFBQWEsQ0FBQyxRQUFpQjtRQUNyQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzFDO0lBQ0gsQ0FBQzs7O1lBMUNGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsK0JBQStCO2dCQUN6QyxRQUFRLEVBQUUsY0FBYzthQUN6Qjs7O29CQVlFLEtBQUs7Ozs7Ozs7SUFUTixxQ0FBc0Q7Ozs7O0lBR3RELDRDQUF5RTs7Ozs7SUFHekUsMEJBQTBDOzs7OztJQU0xQyw4QkFBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgSW5wdXQsIE9uQ2hhbmdlcywgT25EZXN0cm95LCBTaW1wbGVDaGFuZ2VzfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKiBVc2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRCBmb3IgZWFjaCBhY2NvcmRpb24uICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBEaXJlY3RpdmUgd2hvc2UgcHVycG9zZSBpcyB0byBtYW5hZ2UgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIENka0FjY29yZGlvbkl0ZW0gY2hpbGRyZW4uXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1hY2NvcmRpb24sIFtjZGtBY2NvcmRpb25dJyxcbiAgZXhwb3J0QXM6ICdjZGtBY2NvcmRpb24nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtBY2NvcmRpb24gaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGNoYW5nZXMgKi9cbiAgcmVhZG9ubHkgX3N0YXRlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PFNpbXBsZUNoYW5nZXM+KCk7XG5cbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHRydWUvZmFsc2Ugd2hlbiBvcGVuQWxsL2Nsb3NlQWxsIGlzIHRyaWdnZXJlZC4gKi9cbiAgcmVhZG9ubHkgX29wZW5DbG9zZUFsbEFjdGlvbnM6IFN1YmplY3Q8Ym9vbGVhbj4gPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuXG4gIC8qKiBBIHJlYWRvbmx5IGlkIHZhbHVlIHRvIHVzZSBmb3IgdW5pcXVlIHNlbGVjdGlvbiBjb29yZGluYXRpb24uICovXG4gIHJlYWRvbmx5IGlkID0gYGNkay1hY2NvcmRpb24tJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBhY2NvcmRpb24gc2hvdWxkIGFsbG93IG11bHRpcGxlIGV4cGFuZGVkIGFjY29yZGlvbiBpdGVtcyBzaW11bHRhbmVvdXNseS4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG11bHRpKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fbXVsdGk7IH1cbiAgc2V0IG11bHRpKG11bHRpOiBib29sZWFuKSB7IHRoaXMuX211bHRpID0gY29lcmNlQm9vbGVhblByb3BlcnR5KG11bHRpKTsgfVxuICBwcml2YXRlIF9tdWx0aTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBPcGVucyBhbGwgZW5hYmxlZCBhY2NvcmRpb24gaXRlbXMgaW4gYW4gYWNjb3JkaW9uIHdoZXJlIG11bHRpIGlzIGVuYWJsZWQuICovXG4gIG9wZW5BbGwoKTogdm9pZCB7XG4gICAgdGhpcy5fb3BlbkNsb3NlQWxsKHRydWUpO1xuICB9XG5cbiAgLyoqIENsb3NlcyBhbGwgZW5hYmxlZCBhY2NvcmRpb24gaXRlbXMgaW4gYW4gYWNjb3JkaW9uIHdoZXJlIG11bHRpIGlzIGVuYWJsZWQuICovXG4gIGNsb3NlQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuX29wZW5DbG9zZUFsbChmYWxzZSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLm5leHQoY2hhbmdlcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX29wZW5DbG9zZUFsbChleHBhbmRlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLm11bHRpKSB7XG4gICAgICB0aGlzLl9vcGVuQ2xvc2VBbGxBY3Rpb25zLm5leHQoZXhwYW5kZWQpO1xuICAgIH1cbiAgfVxufVxuIl19