/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, ElementRef, Inject, InjectionToken, Input, Optional } from '@angular/core';
import { Subject } from 'rxjs';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { toggleNativeDragInteractions } from '../drag-styling';
/**
 * Injection token that can be used to reference instances of `CdkDragHandle`. It serves as
 * alternative token to the actual `CdkDragHandle` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DRAG_HANDLE = new InjectionToken('CdkDragHandle');
/** Handle that can be used to drag and CdkDrag instance. */
export class CdkDragHandle {
    constructor(element, parentDrag) {
        this.element = element;
        /** Emits when the state of the handle has changed. */
        this._stateChanges = new Subject();
        this._disabled = false;
        this._parentDrag = parentDrag;
        toggleNativeDragInteractions(element.nativeElement, false);
    }
    /** Whether starting to drag through this handle is disabled. */
    get disabled() { return this._disabled; }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
        this._stateChanges.next(this);
    }
    ngOnDestroy() {
        this._stateChanges.complete();
    }
}
CdkDragHandle.decorators = [
    { type: Directive, args: [{
                selector: '[cdkDragHandle]',
                host: {
                    'class': 'cdk-drag-handle'
                },
                providers: [{ provide: CDK_DRAG_HANDLE, useExisting: CdkDragHandle }],
            },] }
];
CdkDragHandle.ctorParameters = () => [
    { type: ElementRef },
    { type: undefined, decorators: [{ type: Inject, args: [CDK_DRAG_PARENT,] }, { type: Optional }] }
];
CdkDragHandle.propDecorators = {
    disabled: [{ type: Input, args: ['cdkDragHandleDisabled',] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1oYW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kaXJlY3RpdmVzL2RyYWctaGFuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUVMLFFBQVEsRUFDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsNEJBQTRCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUU3RDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFnQixlQUFlLENBQUMsQ0FBQztBQUVsRiw0REFBNEQ7QUFRNUQsTUFBTSxPQUFPLGFBQWE7SUFnQnhCLFlBQ1MsT0FBZ0MsRUFDRixVQUFnQjtRQUQ5QyxZQUFPLEdBQVAsT0FBTyxDQUF5QjtRQWJ6QyxzREFBc0Q7UUFDdEQsa0JBQWEsR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQztRQVNyQyxjQUFTLEdBQUcsS0FBSyxDQUFDO1FBTXhCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQWZELGdFQUFnRTtJQUNoRSxJQUNJLFFBQVEsS0FBYyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQUksUUFBUSxDQUFDLEtBQWM7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBV0QsV0FBVztRQUNULElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDaEMsQ0FBQzs7O1lBakNGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsaUJBQWlCO2dCQUMzQixJQUFJLEVBQUU7b0JBQ0osT0FBTyxFQUFFLGlCQUFpQjtpQkFDM0I7Z0JBQ0QsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUMsQ0FBQzthQUNwRTs7O1lBekJDLFVBQVU7NENBNENQLE1BQU0sU0FBQyxlQUFlLGNBQUcsUUFBUTs7O3VCQVZuQyxLQUFLLFNBQUMsdUJBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnN9IGZyb20gJy4uL2RyYWctc3R5bGluZyc7XG5cbi8qKlxuICogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIGluc3RhbmNlcyBvZiBgQ2RrRHJhZ0hhbmRsZWAuIEl0IHNlcnZlcyBhc1xuICogYWx0ZXJuYXRpdmUgdG9rZW4gdG8gdGhlIGFjdHVhbCBgQ2RrRHJhZ0hhbmRsZWAgY2xhc3Mgd2hpY2ggY291bGQgY2F1c2UgdW5uZWNlc3NhcnlcbiAqIHJldGVudGlvbiBvZiB0aGUgY2xhc3MgYW5kIGl0cyBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJBR19IQU5ETEUgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJhZ0hhbmRsZT4oJ0Nka0RyYWdIYW5kbGUnKTtcblxuLyoqIEhhbmRsZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgYW5kIENka0RyYWcgaW5zdGFuY2UuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrRHJhZ0hhbmRsZV0nLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay1kcmFnLWhhbmRsZSdcbiAgfSxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19EUkFHX0hBTkRMRSwgdXNlRXhpc3Rpbmc6IENka0RyYWdIYW5kbGV9XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZ0hhbmRsZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBDbG9zZXN0IHBhcmVudCBkcmFnZ2FibGUgaW5zdGFuY2UuICovXG4gIF9wYXJlbnREcmFnOiB7fSB8IHVuZGVmaW5lZDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgc3RhdGUgb2YgdGhlIGhhbmRsZSBoYXMgY2hhbmdlZC4gKi9cbiAgX3N0YXRlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PENka0RyYWdIYW5kbGU+KCk7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aHJvdWdoIHRoaXMgaGFuZGxlIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdIYW5kbGVEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMubmV4dCh0aGlzKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBASW5qZWN0KENES19EUkFHX1BBUkVOVCkgQE9wdGlvbmFsKCkgcGFyZW50RHJhZz86IGFueSkge1xuXG4gICAgdGhpcy5fcGFyZW50RHJhZyA9IHBhcmVudERyYWc7XG4gICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhlbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIGZhbHNlKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=