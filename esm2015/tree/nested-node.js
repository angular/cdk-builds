/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/tree/nested-node.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ContentChildren, Directive, ElementRef, IterableDiffers, QueryList, } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CDK_TREE_NODE_OUTLET_NODE, CdkTreeNodeOutlet } from './outlet';
import { CdkTree, CdkTreeNode } from './tree';
import { getTreeControlFunctionsMissingError } from './tree-errors';
/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * The children of node will be automatically added to `cdkTreeNodeOutlet`.
 * @template T
 */
export class CdkNestedTreeNode extends CdkTreeNode {
    /**
     * @param {?} _elementRef
     * @param {?} _tree
     * @param {?} _differs
     */
    constructor(_elementRef, _tree, _differs) {
        super(_elementRef, _tree);
        this._elementRef = _elementRef;
        this._tree = _tree;
        this._differs = _differs;
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        this._dataDiffer = this._differs.find([]).create(this._tree.trackBy);
        if (!this._tree.treeControl.getChildren) {
            throw getTreeControlFunctionsMissingError();
        }
        /** @type {?} */
        const childrenNodes = this._tree.treeControl.getChildren(this.data);
        if (Array.isArray(childrenNodes)) {
            this.updateChildrenNodes((/** @type {?} */ (childrenNodes)));
        }
        else if (childrenNodes instanceof Observable) {
            childrenNodes.pipe(takeUntil(this._destroyed))
                .subscribe((/**
             * @param {?} result
             * @return {?}
             */
            result => this.updateChildrenNodes(result)));
        }
        this.nodeOutlet.changes.pipe(takeUntil(this._destroyed))
            .subscribe((/**
         * @return {?}
         */
        () => this.updateChildrenNodes()));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._clear();
        super.ngOnDestroy();
    }
    /**
     * Add children dataNodes to the NodeOutlet
     * @protected
     * @param {?=} children
     * @return {?}
     */
    updateChildrenNodes(children) {
        /** @type {?} */
        const outlet = this._getNodeOutlet();
        if (children) {
            this._children = children;
        }
        if (outlet && this._children) {
            /** @type {?} */
            const viewContainer = outlet.viewContainer;
            this._tree.renderNodeChanges(this._children, this._dataDiffer, viewContainer, this._data);
        }
        else {
            // Reset the data differ if there's no children nodes displayed
            this._dataDiffer.diff([]);
        }
    }
    /**
     * Clear the children dataNodes.
     * @protected
     * @return {?}
     */
    _clear() {
        /** @type {?} */
        const outlet = this._getNodeOutlet();
        if (outlet) {
            outlet.viewContainer.clear();
            this._dataDiffer.diff([]);
        }
    }
    /**
     * Gets the outlet for the current node.
     * @private
     * @return {?}
     */
    _getNodeOutlet() {
        /** @type {?} */
        const outlets = this.nodeOutlet;
        // Note that since we use `descendants: true` on the query, we have to ensure
        // that we don't pick up the outlet of a child node by accident.
        return outlets && outlets.find((/**
         * @param {?} outlet
         * @return {?}
         */
        outlet => !outlet._node || outlet._node === this));
    }
}
CdkNestedTreeNode.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-nested-tree-node',
                exportAs: 'cdkNestedTreeNode',
                host: {
                    '[attr.aria-expanded]': 'isExpanded',
                    '[attr.role]': 'role',
                    'class': 'cdk-tree-node cdk-nested-tree-node',
                },
                providers: [
                    { provide: CdkTreeNode, useExisting: CdkNestedTreeNode },
                    { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode }
                ]
            },] }
];
/** @nocollapse */
CdkNestedTreeNode.ctorParameters = () => [
    { type: ElementRef },
    { type: CdkTree },
    { type: IterableDiffers }
];
CdkNestedTreeNode.propDecorators = {
    nodeOutlet: [{ type: ContentChildren, args: [CdkTreeNodeOutlet, {
                    // We need to use `descendants: true`, because Ivy will no longer match
                    // indirect descendants if it's left as false.
                    descendants: true
                },] }]
};
if (false) {
    /**
     * Differ used to find the changes in the data provided by the data source.
     * @type {?}
     * @private
     */
    CdkNestedTreeNode.prototype._dataDiffer;
    /**
     * The children data dataNodes of current node. They will be placed in `CdkTreeNodeOutlet`.
     * @type {?}
     * @protected
     */
    CdkNestedTreeNode.prototype._children;
    /**
     * The children node placeholder.
     * @type {?}
     */
    CdkNestedTreeNode.prototype.nodeOutlet;
    /**
     * @type {?}
     * @protected
     */
    CdkNestedTreeNode.prototype._elementRef;
    /**
     * @type {?}
     * @protected
     */
    CdkNestedTreeNode.prototype._tree;
    /**
     * @type {?}
     * @protected
     */
    CdkNestedTreeNode.prototype._differs;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLW5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvbmVzdGVkLW5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUVMLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUVWLGVBQWUsRUFFZixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFekMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7Ozs7QUFxQmxFLE1BQU0sT0FBTyxpQkFBcUIsU0FBUSxXQUFjOzs7Ozs7SUFldEQsWUFBc0IsV0FBb0MsRUFDcEMsS0FBaUIsRUFDakIsUUFBeUI7UUFDN0MsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUhOLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUNwQyxVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ2pCLGFBQVEsR0FBUixRQUFRLENBQWlCO0lBRS9DLENBQUM7Ozs7SUFFRCxrQkFBa0I7UUFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO1lBQ3ZDLE1BQU0sbUNBQW1DLEVBQUUsQ0FBQztTQUM3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Qzs7Ozs7O0lBR3ZDLHNDQUF5Qjs7Ozs7SUFHekIsdUNBS3lDOzs7OztJQUU3Qix3Q0FBOEM7Ozs7O0lBQzlDLGtDQUEyQjs7Ozs7SUFDM0IscUNBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRJbml0LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgT25EZXN0cm95LFxuICBRdWVyeUxpc3QsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q0RLX1RSRUVfTk9ERV9PVVRMRVRfTk9ERSwgQ2RrVHJlZU5vZGVPdXRsZXR9IGZyb20gJy4vb3V0bGV0JztcbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5pbXBvcnQge2dldFRyZWVDb250cm9sRnVuY3Rpb25zTWlzc2luZ0Vycm9yfSBmcm9tICcuL3RyZWUtZXJyb3JzJztcblxuLyoqXG4gKiBOZXN0ZWQgbm9kZSBpcyBhIGNoaWxkIG9mIGA8Y2RrLXRyZWU+YC4gSXQgd29ya3Mgd2l0aCBuZXN0ZWQgdHJlZS5cbiAqIEJ5IHVzaW5nIGBjZGstbmVzdGVkLXRyZWUtbm9kZWAgY29tcG9uZW50IGluIHRyZWUgbm9kZSB0ZW1wbGF0ZSwgY2hpbGRyZW4gb2YgdGhlIHBhcmVudCBub2RlIHdpbGxcbiAqIGJlIGFkZGVkIGluIHRoZSBgY2RrVHJlZU5vZGVPdXRsZXRgIGluIHRyZWUgbm9kZSB0ZW1wbGF0ZS5cbiAqIFRoZSBjaGlsZHJlbiBvZiBub2RlIHdpbGwgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byBgY2RrVHJlZU5vZGVPdXRsZXRgLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstbmVzdGVkLXRyZWUtbm9kZScsXG4gIGV4cG9ydEFzOiAnY2RrTmVzdGVkVHJlZU5vZGUnLFxuICBob3N0OiB7XG4gICAgJ1thdHRyLmFyaWEtZXhwYW5kZWRdJzogJ2lzRXhwYW5kZWQnLFxuICAgICdbYXR0ci5yb2xlXSc6ICdyb2xlJyxcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUtbm9kZSBjZGstbmVzdGVkLXRyZWUtbm9kZScsXG4gIH0sXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBDZGtUcmVlTm9kZSwgdXNlRXhpc3Rpbmc6IENka05lc3RlZFRyZWVOb2RlfSxcbiAgICB7cHJvdmlkZTogQ0RLX1RSRUVfTk9ERV9PVVRMRVRfTk9ERSwgdXNlRXhpc3Rpbmc6IENka05lc3RlZFRyZWVOb2RlfVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIENka05lc3RlZFRyZWVOb2RlPFQ+IGV4dGVuZHMgQ2RrVHJlZU5vZGU8VD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRGlmZmVyIHVzZWQgdG8gZmluZCB0aGUgY2hhbmdlcyBpbiB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGFEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+O1xuXG4gIC8qKiBUaGUgY2hpbGRyZW4gZGF0YSBkYXRhTm9kZXMgb2YgY3VycmVudCBub2RlLiBUaGV5IHdpbGwgYmUgcGxhY2VkIGluIGBDZGtUcmVlTm9kZU91dGxldGAuICovXG4gIHByb3RlY3RlZCBfY2hpbGRyZW46IFRbXTtcblxuICAvKiogVGhlIGNoaWxkcmVuIG5vZGUgcGxhY2Vob2xkZXIuICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrVHJlZU5vZGVPdXRsZXQsIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBgZGVzY2VuZGFudHM6IHRydWVgLCBiZWNhdXNlIEl2eSB3aWxsIG5vIGxvbmdlciBtYXRjaFxuICAgIC8vIGluZGlyZWN0IGRlc2NlbmRhbnRzIGlmIGl0J3MgbGVmdCBhcyBmYWxzZS5cbiAgICBkZXNjZW5kYW50czogdHJ1ZVxuICB9KVxuICBub2RlT3V0bGV0OiBRdWVyeUxpc3Q8Q2RrVHJlZU5vZGVPdXRsZXQ+O1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBfdHJlZTogQ2RrVHJlZTxUPixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgICBzdXBlcihfZWxlbWVudFJlZiwgX3RyZWUpO1xuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHRoaXMuX2RhdGFEaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQoW10pLmNyZWF0ZSh0aGlzLl90cmVlLnRyYWNrQnkpO1xuICAgIGlmICghdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRDaGlsZHJlbikge1xuICAgICAgdGhyb3cgZ2V0VHJlZUNvbnRyb2xGdW5jdGlvbnNNaXNzaW5nRXJyb3IoKTtcbiAgICB9XG4gICAgY29uc3QgY2hpbGRyZW5Ob2RlcyA9IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0Q2hpbGRyZW4odGhpcy5kYXRhKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbk5vZGVzKSkge1xuICAgICAgdGhpcy51cGRhdGVDaGlsZHJlbk5vZGVzKGNoaWxkcmVuTm9kZXMgYXMgVFtdKTtcbiAgICB9IGVsc2UgaWYgKGNoaWxkcmVuTm9kZXMgaW5zdGFuY2VvZiBPYnNlcnZhYmxlKSB7XG4gICAgICBjaGlsZHJlbk5vZGVzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUocmVzdWx0ID0+IHRoaXMudXBkYXRlQ2hpbGRyZW5Ob2RlcyhyZXN1bHQpKTtcbiAgICB9XG4gICAgdGhpcy5ub2RlT3V0bGV0LmNoYW5nZXMucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnVwZGF0ZUNoaWxkcmVuTm9kZXMoKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9jbGVhcigpO1xuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG4gIH1cblxuICAvKiogQWRkIGNoaWxkcmVuIGRhdGFOb2RlcyB0byB0aGUgTm9kZU91dGxldCAqL1xuICBwcm90ZWN0ZWQgdXBkYXRlQ2hpbGRyZW5Ob2RlcyhjaGlsZHJlbj86IFRbXSk6IHZvaWQge1xuICAgIGNvbnN0IG91dGxldCA9IHRoaXMuX2dldE5vZGVPdXRsZXQoKTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIHRoaXMuX2NoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgfVxuICAgIGlmIChvdXRsZXQgJiYgdGhpcy5fY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IHZpZXdDb250YWluZXIgPSBvdXRsZXQudmlld0NvbnRhaW5lcjtcbiAgICAgIHRoaXMuX3RyZWUucmVuZGVyTm9kZUNoYW5nZXModGhpcy5fY2hpbGRyZW4sIHRoaXMuX2RhdGFEaWZmZXIsIHZpZXdDb250YWluZXIsIHRoaXMuX2RhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZXNldCB0aGUgZGF0YSBkaWZmZXIgaWYgdGhlcmUncyBubyBjaGlsZHJlbiBub2RlcyBkaXNwbGF5ZWRcbiAgICAgIHRoaXMuX2RhdGFEaWZmZXIuZGlmZihbXSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENsZWFyIHRoZSBjaGlsZHJlbiBkYXRhTm9kZXMuICovXG4gIHByb3RlY3RlZCBfY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3Qgb3V0bGV0ID0gdGhpcy5fZ2V0Tm9kZU91dGxldCgpO1xuICAgIGlmIChvdXRsZXQpIHtcbiAgICAgIG91dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBvdXRsZXQgZm9yIHRoZSBjdXJyZW50IG5vZGUuICovXG4gIHByaXZhdGUgX2dldE5vZGVPdXRsZXQoKSB7XG4gICAgY29uc3Qgb3V0bGV0cyA9IHRoaXMubm9kZU91dGxldDtcblxuICAgIC8vIE5vdGUgdGhhdCBzaW5jZSB3ZSB1c2UgYGRlc2NlbmRhbnRzOiB0cnVlYCBvbiB0aGUgcXVlcnksIHdlIGhhdmUgdG8gZW5zdXJlXG4gICAgLy8gdGhhdCB3ZSBkb24ndCBwaWNrIHVwIHRoZSBvdXRsZXQgb2YgYSBjaGlsZCBub2RlIGJ5IGFjY2lkZW50LlxuICAgIHJldHVybiBvdXRsZXRzICYmIG91dGxldHMuZmluZChvdXRsZXQgPT4gIW91dGxldC5fbm9kZSB8fCBvdXRsZXQuX25vZGUgPT09IHRoaXMpO1xuICB9XG59XG4iXX0=