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
import { Directive, ElementRef, Inject, Optional, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { toggleNativeDragInteractions } from '../drag-styling';
/**
 * Handle that can be used to drag and CdkDrag instance.
 */
export class CdkDragHandle {
    /**
     * @param {?} element
     * @param {?=} parentDrag
     */
    constructor(element, parentDrag) {
        this.element = element;
        /**
         * Emits when the state of the handle has changed.
         */
        this._stateChanges = new Subject();
        this._disabled = false;
        this._parentDrag = parentDrag;
        toggleNativeDragInteractions(element.nativeElement, false);
    }
    /**
     * Whether starting to drag through this handle is disabled.
     * @return {?}
     */
    get disabled() { return this._disabled; }
    /**
     * @param {?} value
     * @return {?}
     */
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._stateChanges.next(this);
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._stateChanges.complete();
    }
}
CdkDragHandle.decorators = [
    { type: Directive, args: [{
                selector: '[cdkDragHandle]',
                host: {
                    'class': 'cdk-drag-handle'
                }
            },] }
];
/** @nocollapse */
CdkDragHandle.ctorParameters = () => [
    { type: ElementRef },
    { type: undefined, decorators: [{ type: Inject, args: [CDK_DRAG_PARENT,] }, { type: Optional }] }
];
CdkDragHandle.propDecorators = {
    disabled: [{ type: Input, args: ['cdkDragHandleDisabled',] }]
};
if (false) {
    /** @type {?} */
    CdkDragHandle.ngAcceptInputType_disabled;
    /**
     * Closest parent draggable instance.
     * @type {?}
     */
    CdkDragHandle.prototype._parentDrag;
    /**
     * Emits when the state of the handle has changed.
     * @type {?}
     */
    CdkDragHandle.prototype._stateChanges;
    /**
     * @type {?}
     * @private
     */
    CdkDragHandle.prototype._disabled;
    /** @type {?} */
    CdkDragHandle.prototype.element;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1oYW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kaXJlY3RpdmVzL2RyYWctaGFuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDeEYsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7QUFTN0QsTUFBTSxPQUFPLGFBQWE7Ozs7O0lBZ0J4QixZQUNTLE9BQWdDLEVBQ0YsVUFBZ0I7UUFEOUMsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7Ozs7UUFaekMsa0JBQWEsR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQztRQVNyQyxjQUFTLEdBQUcsS0FBSyxDQUFDO1FBTXhCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0QsQ0FBQzs7Ozs7SUFkRCxJQUNJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7OztJQUNsRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQzs7OztJQVdELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2hDLENBQUM7OztZQWhDRixTQUFTLFNBQUM7Z0JBQ1QsUUFBUSxFQUFFLGlCQUFpQjtnQkFDM0IsSUFBSSxFQUFFO29CQUNKLE9BQU8sRUFBRSxpQkFBaUI7aUJBQzNCO2FBQ0Y7Ozs7WUFaa0IsVUFBVTs0Q0ErQnhCLE1BQU0sU0FBQyxlQUFlLGNBQUcsUUFBUTs7O3VCQVZuQyxLQUFLLFNBQUMsdUJBQXVCOzs7O0lBb0I5Qix5Q0FBb0Q7Ozs7O0lBMUJwRCxvQ0FBNEI7Ozs7O0lBRzVCLHNDQUE2Qzs7Ozs7SUFTN0Msa0NBQTBCOztJQUd4QixnQ0FBdUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIEluamVjdCwgT3B0aW9uYWwsIElucHV0LCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtDREtfRFJBR19QQVJFTlR9IGZyb20gJy4uL2RyYWctcGFyZW50JztcbmltcG9ydCB7dG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9uc30gZnJvbSAnLi4vZHJhZy1zdHlsaW5nJztcblxuLyoqIEhhbmRsZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgYW5kIENka0RyYWcgaW5zdGFuY2UuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJhZ0hhbmRsZV0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcmFnLWhhbmRsZSdcbiAgfVxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcmFnSGFuZGxlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIENsb3Nlc3QgcGFyZW50IGRyYWdnYWJsZSBpbnN0YW5jZS4gKi9cbiAgX3BhcmVudERyYWc6IHt9IHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBzdGF0ZSBvZiB0aGUgaGFuZGxlIGhhcyBjaGFuZ2VkLiAqL1xuICBfc3RhdGVDaGFuZ2VzID0gbmV3IFN1YmplY3Q8Q2RrRHJhZ0hhbmRsZT4oKTtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRocm91Z2ggdGhpcyBoYW5kbGUgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrRHJhZ0hhbmRsZURpc2FibGVkJylcbiAgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7IH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5uZXh0KHRoaXMpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIEBJbmplY3QoQ0RLX0RSQUdfUEFSRU5UKSBAT3B0aW9uYWwoKSBwYXJlbnREcmFnPzogYW55KSB7XG5cbiAgICB0aGlzLl9wYXJlbnREcmFnID0gcGFyZW50RHJhZztcbiAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKGVsZW1lbnQubmF0aXZlRWxlbWVudCwgZmFsc2UpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IGJvb2xlYW4gfCBzdHJpbmc7XG59XG4iXX0=