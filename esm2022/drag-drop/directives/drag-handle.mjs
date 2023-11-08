/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, Inject, InjectionToken, Input, Optional, SkipSelf, booleanAttribute, } from '@angular/core';
import { Subject } from 'rxjs';
import { CDK_DRAG_PARENT } from '../drag-parent';
import { assertElementNode } from './assertions';
import * as i0 from "@angular/core";
/**
 * Injection token that can be used to reference instances of `CdkDragHandle`. It serves as
 * alternative token to the actual `CdkDragHandle` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DRAG_HANDLE = new InjectionToken('CdkDragHandle');
/** Handle that can be used to drag a CdkDrag instance. */
export class CdkDragHandle {
    /** Whether starting to drag through this handle is disabled. */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = value;
        this._stateChanges.next(this);
    }
    constructor(element, parentDrag) {
        this.element = element;
        /** Emits when the state of the handle has changed. */
        this._stateChanges = new Subject();
        this._disabled = false;
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            assertElementNode(element.nativeElement, 'cdkDragHandle');
        }
        this._parentDrag = parentDrag;
    }
    ngOnDestroy() {
        this._stateChanges.complete();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkDragHandle, deps: [{ token: i0.ElementRef }, { token: CDK_DRAG_PARENT, optional: true, skipSelf: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0", type: CdkDragHandle, isStandalone: true, selector: "[cdkDragHandle]", inputs: { disabled: ["cdkDragHandleDisabled", "disabled", booleanAttribute] }, host: { classAttribute: "cdk-drag-handle" }, providers: [{ provide: CDK_DRAG_HANDLE, useExisting: CdkDragHandle }], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0", ngImport: i0, type: CdkDragHandle, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkDragHandle]',
                    standalone: true,
                    host: {
                        'class': 'cdk-drag-handle',
                    },
                    providers: [{ provide: CDK_DRAG_HANDLE, useExisting: CdkDragHandle }],
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CDK_DRAG_PARENT]
                }, {
                    type: Optional
                }, {
                    type: SkipSelf
                }] }], propDecorators: { disabled: [{
                type: Input,
                args: [{ alias: 'cdkDragHandleDisabled', transform: booleanAttribute }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy1oYW5kbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kaXJlY3RpdmVzL2RyYWctaGFuZGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUVMLFFBQVEsRUFDUixRQUFRLEVBQ1IsZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7QUFFL0M7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBZ0IsZUFBZSxDQUFDLENBQUM7QUFFbEYsMERBQTBEO0FBUzFELE1BQU0sT0FBTyxhQUFhO0lBT3hCLGdFQUFnRTtJQUNoRSxJQUNJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUNELElBQUksUUFBUSxDQUFDLEtBQWM7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUdELFlBQ1MsT0FBZ0MsRUFDVSxVQUFnQjtRQUQxRCxZQUFPLEdBQVAsT0FBTyxDQUF5QjtRQWZ6QyxzREFBc0Q7UUFDN0Msa0JBQWEsR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQztRQVc5QyxjQUFTLEdBQUcsS0FBSyxDQUFDO1FBTXhCLElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsRUFBRTtZQUNqRCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBQzNEO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDaEMsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2hDLENBQUM7OEdBL0JVLGFBQWEsNENBb0JkLGVBQWU7a0dBcEJkLGFBQWEsNkdBUTJCLGdCQUFnQiw2REFWeEQsQ0FBQyxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBQyxDQUFDOzsyRkFFeEQsYUFBYTtrQkFSekIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsaUJBQWlCO29CQUMzQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSxpQkFBaUI7cUJBQzNCO29CQUNELFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxXQUFXLGVBQWUsRUFBQyxDQUFDO2lCQUNwRTs7MEJBcUJJLE1BQU07MkJBQUMsZUFBZTs7MEJBQUcsUUFBUTs7MEJBQUksUUFBUTt5Q0FYNUMsUUFBUTtzQkFEWCxLQUFLO3VCQUFDLEVBQUMsS0FBSyxFQUFFLHVCQUF1QixFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBTa2lwU2VsZixcbiAgYm9vbGVhbkF0dHJpYnV0ZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtDREtfRFJBR19QQVJFTlR9IGZyb20gJy4uL2RyYWctcGFyZW50JztcbmltcG9ydCB7YXNzZXJ0RWxlbWVudE5vZGV9IGZyb20gJy4vYXNzZXJ0aW9ucyc7XG5cbi8qKlxuICogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIGluc3RhbmNlcyBvZiBgQ2RrRHJhZ0hhbmRsZWAuIEl0IHNlcnZlcyBhc1xuICogYWx0ZXJuYXRpdmUgdG9rZW4gdG8gdGhlIGFjdHVhbCBgQ2RrRHJhZ0hhbmRsZWAgY2xhc3Mgd2hpY2ggY291bGQgY2F1c2UgdW5uZWNlc3NhcnlcbiAqIHJldGVudGlvbiBvZiB0aGUgY2xhc3MgYW5kIGl0cyBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfRFJBR19IQU5ETEUgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrRHJhZ0hhbmRsZT4oJ0Nka0RyYWdIYW5kbGUnKTtcblxuLyoqIEhhbmRsZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGRyYWcgYSBDZGtEcmFnIGluc3RhbmNlLiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0RyYWdIYW5kbGVdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZHJhZy1oYW5kbGUnLFxuICB9LFxuICBwcm92aWRlcnM6IFt7cHJvdmlkZTogQ0RLX0RSQUdfSEFORExFLCB1c2VFeGlzdGluZzogQ2RrRHJhZ0hhbmRsZX1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtEcmFnSGFuZGxlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIENsb3Nlc3QgcGFyZW50IGRyYWdnYWJsZSBpbnN0YW5jZS4gKi9cbiAgX3BhcmVudERyYWc6IHt9IHwgdW5kZWZpbmVkO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBzdGF0ZSBvZiB0aGUgaGFuZGxlIGhhcyBjaGFuZ2VkLiAqL1xuICByZWFkb25seSBfc3RhdGVDaGFuZ2VzID0gbmV3IFN1YmplY3Q8Q2RrRHJhZ0hhbmRsZT4oKTtcblxuICAvKiogV2hldGhlciBzdGFydGluZyB0byBkcmFnIHRocm91Z2ggdGhpcyBoYW5kbGUgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtEcmFnSGFuZGxlRGlzYWJsZWQnLCB0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgZGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkO1xuICB9XG4gIHNldCBkaXNhYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gdmFsdWU7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLm5leHQodGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgQEluamVjdChDREtfRFJBR19QQVJFTlQpIEBPcHRpb25hbCgpIEBTa2lwU2VsZigpIHBhcmVudERyYWc/OiBhbnksXG4gICkge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEVsZW1lbnROb2RlKGVsZW1lbnQubmF0aXZlRWxlbWVudCwgJ2Nka0RyYWdIYW5kbGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wYXJlbnREcmFnID0gcGFyZW50RHJhZztcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICB9XG59XG4iXX0=