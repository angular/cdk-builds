/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Tree control interface. User can implement TreeControl to expand/collapse dataNodes in the tree.
 * The CDKTree will use this TreeControl to expand/collapse a node.
 * User can also use it outside the `<cdk-tree>` to control the expansion status of the tree.
 * @record
 * @template T
 */
export function TreeControl() { }
if (false) {
    /**
     * The saved tree nodes data for `expandAll` action.
     * @type {?}
     */
    TreeControl.prototype.dataNodes;
    /**
     * The expansion model
     * @type {?}
     */
    TreeControl.prototype.expansionModel;
    /**
     * Get depth of a given data node, return the level number. This is for flat tree node.
     * @type {?}
     */
    TreeControl.prototype.getLevel;
    /**
     * Whether the data node is expandable. Returns true if expandable.
     * This is for flat tree node.
     * @type {?}
     */
    TreeControl.prototype.isExpandable;
    /**
     * Gets a stream that emits whenever the given data node's children change.
     * @type {?}
     */
    TreeControl.prototype.getChildren;
    /**
     * Whether the data node is expanded or collapsed. Return true if it's expanded.
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.isExpanded = function (dataNode) { };
    /**
     * Get all descendants of a data node
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.getDescendants = function (dataNode) { };
    /**
     * Expand or collapse data node
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.toggle = function (dataNode) { };
    /**
     * Expand one data node
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.expand = function (dataNode) { };
    /**
     * Collapse one data node
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.collapse = function (dataNode) { };
    /**
     * Expand all the dataNodes in the tree
     * @return {?}
     */
    TreeControl.prototype.expandAll = function () { };
    /**
     * Collapse all the dataNodes in the tree
     * @return {?}
     */
    TreeControl.prototype.collapseAll = function () { };
    /**
     * Toggle a data node by expand/collapse it and all its descendants
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.toggleDescendants = function (dataNode) { };
    /**
     * Expand a data node and all its descendants
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.expandDescendants = function (dataNode) { };
    /**
     * Collapse a data node and all its descendants
     * @param {?} dataNode
     * @return {?}
     */
    TreeControl.prototype.collapseDescendants = function (dataNode) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1jb250cm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL2NvbnRyb2wvdHJlZS1jb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBZUEsaUNBZ0RDOzs7Ozs7SUE5Q0MsZ0NBQWU7Ozs7O0lBR2YscUNBQWtDOzs7OztJQWlDbEMsK0JBQTJDOzs7Ozs7SUFNM0MsbUNBQWdEOzs7OztJQUdoRCxrQ0FBZ0Y7Ozs7OztJQXZDaEYsMkRBQWlDOzs7Ozs7SUFHakMsK0RBQW1DOzs7Ozs7SUFHbkMsdURBQTBCOzs7Ozs7SUFHMUIsdURBQTBCOzs7Ozs7SUFHMUIseURBQTRCOzs7OztJQUc1QixrREFBa0I7Ozs7O0lBR2xCLG9EQUFvQjs7Ozs7O0lBR3BCLGtFQUFxQzs7Ozs7O0lBR3JDLGtFQUFxQzs7Ozs7O0lBR3JDLG9FQUF1QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTZWxlY3Rpb25Nb2RlbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbi8qKlxuICogVHJlZSBjb250cm9sIGludGVyZmFjZS4gVXNlciBjYW4gaW1wbGVtZW50IFRyZWVDb250cm9sIHRvIGV4cGFuZC9jb2xsYXBzZSBkYXRhTm9kZXMgaW4gdGhlIHRyZWUuXG4gKiBUaGUgQ0RLVHJlZSB3aWxsIHVzZSB0aGlzIFRyZWVDb250cm9sIHRvIGV4cGFuZC9jb2xsYXBzZSBhIG5vZGUuXG4gKiBVc2VyIGNhbiBhbHNvIHVzZSBpdCBvdXRzaWRlIHRoZSBgPGNkay10cmVlPmAgdG8gY29udHJvbCB0aGUgZXhwYW5zaW9uIHN0YXR1cyBvZiB0aGUgdHJlZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmVlQ29udHJvbDxUPiB7XG4gIC8qKiBUaGUgc2F2ZWQgdHJlZSBub2RlcyBkYXRhIGZvciBgZXhwYW5kQWxsYCBhY3Rpb24uICovXG4gIGRhdGFOb2RlczogVFtdO1xuXG4gIC8qKiBUaGUgZXhwYW5zaW9uIG1vZGVsICovXG4gIGV4cGFuc2lvbk1vZGVsOiBTZWxlY3Rpb25Nb2RlbDxUPjtcblxuICAvKiogV2hldGhlciB0aGUgZGF0YSBub2RlIGlzIGV4cGFuZGVkIG9yIGNvbGxhcHNlZC4gUmV0dXJuIHRydWUgaWYgaXQncyBleHBhbmRlZC4gKi9cbiAgaXNFeHBhbmRlZChkYXRhTm9kZTogVCk6IGJvb2xlYW47XG5cbiAgLyoqIEdldCBhbGwgZGVzY2VuZGFudHMgb2YgYSBkYXRhIG5vZGUgKi9cbiAgZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiBhbnlbXTtcblxuICAvKiogRXhwYW5kIG9yIGNvbGxhcHNlIGRhdGEgbm9kZSAqL1xuICB0b2dnbGUoZGF0YU5vZGU6IFQpOiB2b2lkO1xuXG4gIC8qKiBFeHBhbmQgb25lIGRhdGEgbm9kZSAqL1xuICBleHBhbmQoZGF0YU5vZGU6IFQpOiB2b2lkO1xuXG4gIC8qKiBDb2xsYXBzZSBvbmUgZGF0YSBub2RlICovXG4gIGNvbGxhcHNlKGRhdGFOb2RlOiBUKTogdm9pZDtcblxuICAvKiogRXhwYW5kIGFsbCB0aGUgZGF0YU5vZGVzIGluIHRoZSB0cmVlICovXG4gIGV4cGFuZEFsbCgpOiB2b2lkO1xuXG4gIC8qKiBDb2xsYXBzZSBhbGwgdGhlIGRhdGFOb2RlcyBpbiB0aGUgdHJlZSAqL1xuICBjb2xsYXBzZUFsbCgpOiB2b2lkO1xuXG4gIC8qKiBUb2dnbGUgYSBkYXRhIG5vZGUgYnkgZXhwYW5kL2NvbGxhcHNlIGl0IGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzICovXG4gIHRvZ2dsZURlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogdm9pZDtcblxuICAvKiogRXhwYW5kIGEgZGF0YSBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzICovXG4gIGV4cGFuZERlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogdm9pZDtcblxuICAvKiogQ29sbGFwc2UgYSBkYXRhIG5vZGUgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMgKi9cbiAgY29sbGFwc2VEZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQ7XG5cbiAgLyoqIEdldCBkZXB0aCBvZiBhIGdpdmVuIGRhdGEgbm9kZSwgcmV0dXJuIHRoZSBsZXZlbCBudW1iZXIuIFRoaXMgaXMgZm9yIGZsYXQgdHJlZSBub2RlLiAqL1xuICByZWFkb25seSBnZXRMZXZlbDogKGRhdGFOb2RlOiBUKSA9PiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRhdGEgbm9kZSBpcyBleHBhbmRhYmxlLiBSZXR1cm5zIHRydWUgaWYgZXhwYW5kYWJsZS5cbiAgICogVGhpcyBpcyBmb3IgZmxhdCB0cmVlIG5vZGUuXG4gICAqL1xuICByZWFkb25seSBpc0V4cGFuZGFibGU6IChkYXRhTm9kZTogVCkgPT4gYm9vbGVhbjtcblxuICAvKiogR2V0cyBhIHN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSBnaXZlbiBkYXRhIG5vZGUncyBjaGlsZHJlbiBjaGFuZ2UuICovXG4gIHJlYWRvbmx5IGdldENoaWxkcmVuOiAoZGF0YU5vZGU6IFQpID0+IE9ic2VydmFibGU8VFtdPiB8IFRbXSB8IHVuZGVmaW5lZCB8IG51bGw7XG59XG4iXX0=