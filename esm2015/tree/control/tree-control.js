/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/tree/control/tree-control.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Tree control interface. User can implement TreeControl to expand/collapse dataNodes in the tree.
 * The CDKTree will use this TreeControl to expand/collapse a node.
 * User can also use it outside the `<cdk-tree>` to control the expansion status of the tree.
 * @record
 * @template T, K
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1jb250cm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL2NvbnRyb2wvdHJlZS1jb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQWVBLGlDQWdEQzs7Ozs7O0lBOUNDLGdDQUFlOzs7OztJQUdmLHFDQUFrQzs7Ozs7SUFpQ2xDLCtCQUEyQzs7Ozs7O0lBTTNDLG1DQUFnRDs7Ozs7SUFHaEQsa0NBQWdGOzs7Ozs7SUF2Q2hGLDJEQUFpQzs7Ozs7O0lBR2pDLCtEQUFtQzs7Ozs7O0lBR25DLHVEQUEwQjs7Ozs7O0lBRzFCLHVEQUEwQjs7Ozs7O0lBRzFCLHlEQUE0Qjs7Ozs7SUFHNUIsa0RBQWtCOzs7OztJQUdsQixvREFBb0I7Ozs7OztJQUdwQixrRUFBcUM7Ozs7OztJQUdyQyxrRUFBcUM7Ozs7OztJQUdyQyxvRUFBdUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U2VsZWN0aW9uTW9kZWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIFRyZWUgY29udHJvbCBpbnRlcmZhY2UuIFVzZXIgY2FuIGltcGxlbWVudCBUcmVlQ29udHJvbCB0byBleHBhbmQvY29sbGFwc2UgZGF0YU5vZGVzIGluIHRoZSB0cmVlLlxuICogVGhlIENES1RyZWUgd2lsbCB1c2UgdGhpcyBUcmVlQ29udHJvbCB0byBleHBhbmQvY29sbGFwc2UgYSBub2RlLlxuICogVXNlciBjYW4gYWxzbyB1c2UgaXQgb3V0c2lkZSB0aGUgYDxjZGstdHJlZT5gIHRvIGNvbnRyb2wgdGhlIGV4cGFuc2lvbiBzdGF0dXMgb2YgdGhlIHRyZWUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJlZUNvbnRyb2w8VCwgSyA9IFQ+IHtcbiAgLyoqIFRoZSBzYXZlZCB0cmVlIG5vZGVzIGRhdGEgZm9yIGBleHBhbmRBbGxgIGFjdGlvbi4gKi9cbiAgZGF0YU5vZGVzOiBUW107XG5cbiAgLyoqIFRoZSBleHBhbnNpb24gbW9kZWwgKi9cbiAgZXhwYW5zaW9uTW9kZWw6IFNlbGVjdGlvbk1vZGVsPEs+O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBkYXRhIG5vZGUgaXMgZXhwYW5kZWQgb3IgY29sbGFwc2VkLiBSZXR1cm4gdHJ1ZSBpZiBpdCdzIGV4cGFuZGVkLiAqL1xuICBpc0V4cGFuZGVkKGRhdGFOb2RlOiBUKTogYm9vbGVhbjtcblxuICAvKiogR2V0IGFsbCBkZXNjZW5kYW50cyBvZiBhIGRhdGEgbm9kZSAqL1xuICBnZXREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IGFueVtdO1xuXG4gIC8qKiBFeHBhbmQgb3IgY29sbGFwc2UgZGF0YSBub2RlICovXG4gIHRvZ2dsZShkYXRhTm9kZTogVCk6IHZvaWQ7XG5cbiAgLyoqIEV4cGFuZCBvbmUgZGF0YSBub2RlICovXG4gIGV4cGFuZChkYXRhTm9kZTogVCk6IHZvaWQ7XG5cbiAgLyoqIENvbGxhcHNlIG9uZSBkYXRhIG5vZGUgKi9cbiAgY29sbGFwc2UoZGF0YU5vZGU6IFQpOiB2b2lkO1xuXG4gIC8qKiBFeHBhbmQgYWxsIHRoZSBkYXRhTm9kZXMgaW4gdGhlIHRyZWUgKi9cbiAgZXhwYW5kQWxsKCk6IHZvaWQ7XG5cbiAgLyoqIENvbGxhcHNlIGFsbCB0aGUgZGF0YU5vZGVzIGluIHRoZSB0cmVlICovXG4gIGNvbGxhcHNlQWxsKCk6IHZvaWQ7XG5cbiAgLyoqIFRvZ2dsZSBhIGRhdGEgbm9kZSBieSBleHBhbmQvY29sbGFwc2UgaXQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMgKi9cbiAgdG9nZ2xlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkO1xuXG4gIC8qKiBFeHBhbmQgYSBkYXRhIG5vZGUgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMgKi9cbiAgZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkO1xuXG4gIC8qKiBDb2xsYXBzZSBhIGRhdGEgbm9kZSBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cyAqL1xuICBjb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogdm9pZDtcblxuICAvKiogR2V0IGRlcHRoIG9mIGEgZ2l2ZW4gZGF0YSBub2RlLCByZXR1cm4gdGhlIGxldmVsIG51bWJlci4gVGhpcyBpcyBmb3IgZmxhdCB0cmVlIG5vZGUuICovXG4gIHJlYWRvbmx5IGdldExldmVsOiAoZGF0YU5vZGU6IFQpID0+IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZGF0YSBub2RlIGlzIGV4cGFuZGFibGUuIFJldHVybnMgdHJ1ZSBpZiBleHBhbmRhYmxlLlxuICAgKiBUaGlzIGlzIGZvciBmbGF0IHRyZWUgbm9kZS5cbiAgICovXG4gIHJlYWRvbmx5IGlzRXhwYW5kYWJsZTogKGRhdGFOb2RlOiBUKSA9PiBib29sZWFuO1xuXG4gIC8qKiBHZXRzIGEgc3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIGdpdmVuIGRhdGEgbm9kZSdzIGNoaWxkcmVuIGNoYW5nZS4gKi9cbiAgcmVhZG9ubHkgZ2V0Q2hpbGRyZW46IChkYXRhTm9kZTogVCkgPT4gT2JzZXJ2YWJsZTxUW10+IHwgVFtdIHwgdW5kZWZpbmVkIHwgbnVsbDtcbn1cbiJdfQ==