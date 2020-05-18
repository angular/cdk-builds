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
import { isObservable } from 'rxjs';
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
let CdkNestedTreeNode = /** @class */ (() => {
    /**
     * Nested node is a child of `<cdk-tree>`. It works with nested tree.
     * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
     * be added in the `cdkTreeNodeOutlet` in tree node template.
     * The children of node will be automatically added to `cdkTreeNodeOutlet`.
     * @template T
     */
    class CdkNestedTreeNode extends CdkTreeNode {
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
            else if (isObservable(childrenNodes)) {
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
    return CdkNestedTreeNode;
})();
export { CdkNestedTreeNode };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLW5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvbmVzdGVkLW5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUVMLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUVWLGVBQWUsRUFFZixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFekMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7Ozs7QUFRbEU7Ozs7Ozs7O0lBQUEsTUFhYSxpQkFBcUIsU0FBUSxXQUFjOzs7Ozs7UUFldEQsWUFBc0IsV0FBb0MsRUFDcEMsS0FBaUIsRUFDakIsUUFBeUI7WUFDN0MsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUhOLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtZQUNwQyxVQUFLLEdBQUwsS0FBSyxDQUFZO1lBQ2pCLGFBQVEsR0FBUixRQUFRLENBQWlCO1FBRS9DLENBQUM7Ozs7UUFFRCxrQkFBa0I7WUFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO2dCQUN2QyxNQUFNLG1DQUFtQyxFQUFFLENB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QUFFLElBQUk7cUJBQ2xCOztJQThESCx3QkFBQztLQUFBO1NBMUVZLGlCQUFpQjs7Ozs7OztJQUU1Qix3Q0FBdUM7Ozs7OztJQUd2QyxzQ0FBeUI7Ozs7O0lBR3pCLHVDQUt5Qzs7Ozs7SUFFN0Isd0NBQThDOzs7OztJQUM5QyxrQ0FBMkI7Ozs7O0lBQzNCLHFDQUFtQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE9uRGVzdHJveSxcbiAgUXVlcnlMaXN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7aXNPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q0RLX1RSRUVfTk9ERV9PVVRMRVRfTk9ERSwgQ2RrVHJlZU5vZGVPdXRsZXR9IGZyb20gJy4vb3V0bGV0JztcbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5pbXBvcnQge2dldFRyZWVDb250cm9sRnVuY3Rpb25zTWlzc2luZ0Vycm9yfSBmcm9tICcuL3RyZWUtZXJyb3JzJztcblxuLyoqXG4gKiBOZXN0ZWQgbm9kZSBpcyBhIGNoaWxkIG9mIGA8Y2RrLXRyZWU+YC4gSXQgd29ya3Mgd2l0aCBuZXN0ZWQgdHJlZS5cbiAqIEJ5IHVzaW5nIGBjZGstbmVzdGVkLXRyZWUtbm9kZWAgY29tcG9uZW50IGluIHRyZWUgbm9kZSB0ZW1wbGF0ZSwgY2hpbGRyZW4gb2YgdGhlIHBhcmVudCBub2RlIHdpbGxcbiAqIGJlIGFkZGVkIGluIHRoZSBgY2RrVHJlZU5vZGVPdXRsZXRgIGluIHRyZWUgbm9kZSB0ZW1wbGF0ZS5cbiAqIFRoZSBjaGlsZHJlbiBvZiBub2RlIHdpbGwgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byBgY2RrVHJlZU5vZGVPdXRsZXRgLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstbmVzdGVkLXRyZWUtbm9kZScsXG4gIGV4cG9ydEFzOiAnY2RrTmVzdGVkVHJlZU5vZGUnLFxuICBob3N0OiB7XG4gICAgJ1thdHRyLmFyaWEtZXhwYW5kZWRdJzogJ2lzRXhwYW5kZWQnLFxuICAgICdbYXR0ci5yb2xlXSc6ICdyb2xlJyxcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUtbm9kZSBjZGstbmVzdGVkLXRyZWUtbm9kZScsXG4gIH0sXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBDZGtUcmVlTm9kZSwgdXNlRXhpc3Rpbmc6IENka05lc3RlZFRyZWVOb2RlfSxcbiAgICB7cHJvdmlkZTogQ0RLX1RSRUVfTk9ERV9PVVRMRVRfTk9ERSwgdXNlRXhpc3Rpbmc6IENka05lc3RlZFRyZWVOb2RlfVxuICBdXG59KVxuZXhwb3J0IGNsYXNzIENka05lc3RlZFRyZWVOb2RlPFQ+IGV4dGVuZHMgQ2RrVHJlZU5vZGU8VD4gaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRGlmZmVyIHVzZWQgdG8gZmluZCB0aGUgY2hhbmdlcyBpbiB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGFEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+O1xuXG4gIC8qKiBUaGUgY2hpbGRyZW4gZGF0YSBkYXRhTm9kZXMgb2YgY3VycmVudCBub2RlLiBUaGV5IHdpbGwgYmUgcGxhY2VkIGluIGBDZGtUcmVlTm9kZU91dGxldGAuICovXG4gIHByb3RlY3RlZCBfY2hpbGRyZW46IFRbXTtcblxuICAvKiogVGhlIGNoaWxkcmVuIG5vZGUgcGxhY2Vob2xkZXIuICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrVHJlZU5vZGVPdXRsZXQsIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBgZGVzY2VuZGFudHM6IHRydWVgLCBiZWNhdXNlIEl2eSB3aWxsIG5vIGxvbmdlciBtYXRjaFxuICAgIC8vIGluZGlyZWN0IGRlc2NlbmRhbnRzIGlmIGl0J3MgbGVmdCBhcyBmYWxzZS5cbiAgICBkZXNjZW5kYW50czogdHJ1ZVxuICB9KVxuICBub2RlT3V0bGV0OiBRdWVyeUxpc3Q8Q2RrVHJlZU5vZGVPdXRsZXQ+O1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBfdHJlZTogQ2RrVHJlZTxUPixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgICBzdXBlcihfZWxlbWVudFJlZiwgX3RyZWUpO1xuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHRoaXMuX2RhdGFEaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQoW10pLmNyZWF0ZSh0aGlzLl90cmVlLnRyYWNrQnkpO1xuICAgIGlmICghdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRDaGlsZHJlbikge1xuICAgICAgdGhyb3cgZ2V0VHJlZUNvbnRyb2xGdW5jdGlvbnNNaXNzaW5nRXJyb3IoKTtcbiAgICB9XG4gICAgY29uc3QgY2hpbGRyZW5Ob2RlcyA9IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0Q2hpbGRyZW4odGhpcy5kYXRhKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbk5vZGVzKSkge1xuICAgICAgdGhpcy51cGRhdGVDaGlsZHJlbk5vZGVzKGNoaWxkcmVuTm9kZXMgYXMgVFtdKTtcbiAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZShjaGlsZHJlbk5vZGVzKSkge1xuICAgICAgY2hpbGRyZW5Ob2Rlcy5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHJlc3VsdCA9PiB0aGlzLnVwZGF0ZUNoaWxkcmVuTm9kZXMocmVzdWx0KSk7XG4gICAgfVxuICAgIHRoaXMubm9kZU91dGxldC5jaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy51cGRhdGVDaGlsZHJlbk5vZGVzKCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fY2xlYXIoKTtcbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuICB9XG5cbiAgLyoqIEFkZCBjaGlsZHJlbiBkYXRhTm9kZXMgdG8gdGhlIE5vZGVPdXRsZXQgKi9cbiAgcHJvdGVjdGVkIHVwZGF0ZUNoaWxkcmVuTm9kZXMoY2hpbGRyZW4/OiBUW10pOiB2b2lkIHtcbiAgICBjb25zdCBvdXRsZXQgPSB0aGlzLl9nZXROb2RlT3V0bGV0KCk7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICB0aGlzLl9jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICAgIH1cbiAgICBpZiAob3V0bGV0ICYmIHRoaXMuX2NoaWxkcmVuKSB7XG4gICAgICBjb25zdCB2aWV3Q29udGFpbmVyID0gb3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgICB0aGlzLl90cmVlLnJlbmRlck5vZGVDaGFuZ2VzKHRoaXMuX2NoaWxkcmVuLCB0aGlzLl9kYXRhRGlmZmVyLCB2aWV3Q29udGFpbmVyLCB0aGlzLl9kYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVzZXQgdGhlIGRhdGEgZGlmZmVyIGlmIHRoZXJlJ3Mgbm8gY2hpbGRyZW4gbm9kZXMgZGlzcGxheWVkXG4gICAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhciB0aGUgY2hpbGRyZW4gZGF0YU5vZGVzLiAqL1xuICBwcm90ZWN0ZWQgX2NsZWFyKCk6IHZvaWQge1xuICAgIGNvbnN0IG91dGxldCA9IHRoaXMuX2dldE5vZGVPdXRsZXQoKTtcbiAgICBpZiAob3V0bGV0KSB7XG4gICAgICBvdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgb3V0bGV0IGZvciB0aGUgY3VycmVudCBub2RlLiAqL1xuICBwcml2YXRlIF9nZXROb2RlT3V0bGV0KCkge1xuICAgIGNvbnN0IG91dGxldHMgPSB0aGlzLm5vZGVPdXRsZXQ7XG5cbiAgICAvLyBOb3RlIHRoYXQgc2luY2Ugd2UgdXNlIGBkZXNjZW5kYW50czogdHJ1ZWAgb24gdGhlIHF1ZXJ5LCB3ZSBoYXZlIHRvIGVuc3VyZVxuICAgIC8vIHRoYXQgd2UgZG9uJ3QgcGljayB1cCB0aGUgb3V0bGV0IG9mIGEgY2hpbGQgbm9kZSBieSBhY2NpZGVudC5cbiAgICByZXR1cm4gb3V0bGV0cyAmJiBvdXRsZXRzLmZpbmQob3V0bGV0ID0+ICFvdXRsZXQuX25vZGUgfHwgb3V0bGV0Ll9ub2RlID09PSB0aGlzKTtcbiAgfVxufVxuIl19