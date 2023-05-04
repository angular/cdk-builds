/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, Input } from '@angular/core';
import { CdkTree, CdkTreeNode } from './tree';
import * as i0 from "@angular/core";
import * as i1 from "./tree";
/**
 * Node toggle to expand/collapse the node.
 */
class CdkTreeNodeToggle {
    /** Whether expand/collapse the node recursively. */
    get recursive() {
        return this._recursive;
    }
    set recursive(value) {
        this._recursive = coerceBooleanProperty(value);
    }
    constructor(_tree, _treeNode) {
        this._tree = _tree;
        this._treeNode = _treeNode;
        this._recursive = false;
    }
    _toggle(event) {
        this.recursive
            ? this._tree.treeControl.toggleDescendants(this._treeNode.data)
            : this._tree.treeControl.toggle(this._treeNode.data);
        event.stopPropagation();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTreeNodeToggle, deps: [{ token: i1.CdkTree }, { token: i1.CdkTreeNode }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkTreeNodeToggle, selector: "[cdkTreeNodeToggle]", inputs: { recursive: ["cdkTreeNodeToggleRecursive", "recursive"] }, host: { listeners: { "click": "_toggle($event)" } }, ngImport: i0 }); }
}
export { CdkTreeNodeToggle };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTreeNodeToggle, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTreeNodeToggle]',
                    host: {
                        '(click)': '_toggle($event)',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i1.CdkTree }, { type: i1.CdkTreeNode }]; }, propDecorators: { recursive: [{
                type: Input,
                args: ['cdkTreeNodeToggleRecursive']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL3RvZ2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFFLEtBQUssRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUvQyxPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7O0FBRTVDOztHQUVHO0FBQ0gsTUFNYSxpQkFBaUI7SUFDNUIsb0RBQW9EO0lBQ3BELElBQ0ksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN6QixDQUFDO0lBQ0QsSUFBSSxTQUFTLENBQUMsS0FBbUI7UUFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBR0QsWUFBc0IsS0FBb0IsRUFBWSxTQUE0QjtRQUE1RCxVQUFLLEdBQUwsS0FBSyxDQUFlO1FBQVksY0FBUyxHQUFULFNBQVMsQ0FBbUI7UUFGeEUsZUFBVSxHQUFHLEtBQUssQ0FBQztJQUV3RCxDQUFDO0lBRXRGLE9BQU8sQ0FBQyxLQUFZO1FBQ2xCLElBQUksQ0FBQyxTQUFTO1lBQ1osQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1lBQy9ELENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDMUIsQ0FBQzs4R0FuQlUsaUJBQWlCO2tHQUFqQixpQkFBaUI7O1NBQWpCLGlCQUFpQjsyRkFBakIsaUJBQWlCO2tCQU43QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxxQkFBcUI7b0JBQy9CLElBQUksRUFBRTt3QkFDSixTQUFTLEVBQUUsaUJBQWlCO3FCQUM3QjtpQkFDRjt3SEFJSyxTQUFTO3NCQURaLEtBQUs7dUJBQUMsNEJBQTRCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgSW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuXG4vKipcbiAqIE5vZGUgdG9nZ2xlIHRvIGV4cGFuZC9jb2xsYXBzZSB0aGUgbm9kZS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1RyZWVOb2RlVG9nZ2xlXScsXG4gIGhvc3Q6IHtcbiAgICAnKGNsaWNrKSc6ICdfdG9nZ2xlKCRldmVudCknLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZVRvZ2dsZTxULCBLID0gVD4ge1xuICAvKiogV2hldGhlciBleHBhbmQvY29sbGFwc2UgdGhlIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVUb2dnbGVSZWN1cnNpdmUnKVxuICBnZXQgcmVjdXJzaXZlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9yZWN1cnNpdmU7XG4gIH1cbiAgc2V0IHJlY3Vyc2l2ZSh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fcmVjdXJzaXZlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcm90ZWN0ZWQgX3JlY3Vyc2l2ZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfdHJlZTogQ2RrVHJlZTxULCBLPiwgcHJvdGVjdGVkIF90cmVlTm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHt9XG5cbiAgX3RvZ2dsZShldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLnJlY3Vyc2l2ZVxuICAgICAgPyB0aGlzLl90cmVlLnRyZWVDb250cm9sLnRvZ2dsZURlc2NlbmRhbnRzKHRoaXMuX3RyZWVOb2RlLmRhdGEpXG4gICAgICA6IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wudG9nZ2xlKHRoaXMuX3RyZWVOb2RlLmRhdGEpO1xuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cbn1cbiJdfQ==