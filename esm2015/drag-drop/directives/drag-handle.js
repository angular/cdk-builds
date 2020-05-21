/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
import { Directive, ElementRef, Inject, Optional, Input } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject } from 'rxjs';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { toggleNativeDragInteractions } from '../drag-styling';
/** Handle that can be used to drag and CdkDrag instance. */
let CdkDragHandle = /** @class */ (() => {
    let CdkDragHandle = class CdkDragHandle {
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
    };
    __decorate([
        Input('cdkDragHandleDisabled'),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], CdkDragHandle.prototype, "disabled", null);
    CdkDragHandle = __decorate([
        Directive({
            selector: '[cdkDragHandle]',
            host: {
                'class': 'cdk-drag-handle'
            }
        }),
        __param(1, Inject(CDK_DRAG_PARENT)), __param(1, Optional()),
        __metadata("design:paramtypes", [ElementRef, Object])
    ], CdkDragHandle);
    return CdkDragHandle;
})();
export { CdkDragHandle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1oYW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kaXJlY3RpdmVzL2RyYWctaGFuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUN4RixPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsNEJBQTRCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUU3RCw0REFBNEQ7QUFPNUQ7SUFBQSxJQUFhLGFBQWEsR0FBMUIsTUFBYSxhQUFhO1FBZ0J4QixZQUNTLE9BQWdDLEVBQ0YsVUFBZ0I7WUFEOUMsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7WUFiekMsc0RBQXNEO1lBQ3RELGtCQUFhLEdBQUcsSUFBSSxPQUFPLEVBQWlCLENBQUM7WUFTckMsY0FBUyxHQUFHLEtBQUssQ0FBQztZQU14QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5Qiw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFmRCxnRUFBZ0U7UUFFaEUsSUFBSSxRQUFRLEtBQWMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1lBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQVdELFdBQVc7WUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hDLENBQUM7S0FHRixDQUFBO0lBcEJDO1FBREMsS0FBSyxDQUFDLHVCQUF1QixDQUFDOzs7aURBQ21CO0lBVHZDLGFBQWE7UUFOekIsU0FBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLGlCQUFpQjtZQUMzQixJQUFJLEVBQUU7Z0JBQ0osT0FBTyxFQUFFLGlCQUFpQjthQUMzQjtTQUNGLENBQUM7UUFtQkcsV0FBQSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUEsRUFBRSxXQUFBLFFBQVEsRUFBRSxDQUFBO3lDQURwQixVQUFVO09BakJqQixhQUFhLENBNkJ6QjtJQUFELG9CQUFDO0tBQUE7U0E3QlksYUFBYSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5qZWN0LCBPcHRpb25hbCwgSW5wdXQsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q0RLX0RSQUdfUEFSRU5UfSBmcm9tICcuLi9kcmFnLXBhcmVudCc7XG5pbXBvcnQge3RvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnN9IGZyb20gJy4uL2RyYWctc3R5bGluZyc7XG5cbi8qKiBIYW5kbGUgdGhhdCBjYW4gYmUgdXNlZCB0byBkcmFnIGFuZCBDZGtEcmFnIGluc3RhbmNlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWdIYW5kbGVdJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJhZy1oYW5kbGUnXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrRHJhZ0hhbmRsZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBDbG9zZXN0IHBhcmVudCBkcmFnZ2FibGUgaW5zdGFuY2UuICovXG4gIF9wYXJlbnREcmFnOiB7fSB8IHVuZGVmaW5lZDtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgc3RhdGUgb2YgdGhlIGhhbmRsZSBoYXMgY2hhbmdlZC4gKi9cbiAgX3N0YXRlQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PENka0RyYWdIYW5kbGU+KCk7XG5cbiAgLyoqIFdoZXRoZXIgc3RhcnRpbmcgdG8gZHJhZyB0aHJvdWdoIHRoaXMgaGFuZGxlIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoJ2Nka0RyYWdIYW5kbGVEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMubmV4dCh0aGlzKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBlbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBASW5qZWN0KENES19EUkFHX1BBUkVOVCkgQE9wdGlvbmFsKCkgcGFyZW50RHJhZz86IGFueSkge1xuXG4gICAgdGhpcy5fcGFyZW50RHJhZyA9IHBhcmVudERyYWc7XG4gICAgdG9nZ2xlTmF0aXZlRHJhZ0ludGVyYWN0aW9ucyhlbGVtZW50Lm5hdGl2ZUVsZW1lbnQsIGZhbHNlKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2Rpc2FibGVkOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=