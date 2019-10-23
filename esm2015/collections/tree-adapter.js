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
/**
 * Interface for a class that can flatten hierarchical structured data and re-expand the flattened
 * data back into its original structure. Should be used in conjunction with the cdk-tree.
 * @record
 * @template T
 */
export function TreeDataNodeFlattener() { }
if (false) {
    /**
     * Transforms a set of hierarchical structured data into a flattened data array.
     * @param {?} structuredData
     * @return {?}
     */
    TreeDataNodeFlattener.prototype.flattenNodes = function (structuredData) { };
    /**
     * Expands a flattened array of data into its hierarchical form using the provided expansion
     * model.
     * @param {?} nodes
     * @param {?} expansionModel
     * @return {?}
     */
    TreeDataNodeFlattener.prototype.expandFlattenedNodes = function (nodes, expansionModel) { };
    /**
     * Put node descendants of node in array.
     * If `onlyExpandable` is true, then only process expandable descendants.
     * @param {?} node
     * @param {?} nodes
     * @param {?} onlyExpandable
     * @return {?}
     */
    TreeDataNodeFlattener.prototype.nodeDescendents = function (node, nodes, onlyExpandable) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy90cmVlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSwyQ0FlQzs7Ozs7OztJQWJDLDZFQUF5Qzs7Ozs7Ozs7SUFNekMsNEZBQXlFOzs7Ozs7Ozs7SUFNekUsNkZBQW9FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2VsZWN0aW9uTW9kZWx9IGZyb20gJy4vc2VsZWN0aW9uLW1vZGVsJztcblxuXG4vKipcbiAqIEludGVyZmFjZSBmb3IgYSBjbGFzcyB0aGF0IGNhbiBmbGF0dGVuIGhpZXJhcmNoaWNhbCBzdHJ1Y3R1cmVkIGRhdGEgYW5kIHJlLWV4cGFuZCB0aGUgZmxhdHRlbmVkXG4gKiBkYXRhIGJhY2sgaW50byBpdHMgb3JpZ2luYWwgc3RydWN0dXJlLiBTaG91bGQgYmUgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBjZGstdHJlZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmVlRGF0YU5vZGVGbGF0dGVuZXI8VD4ge1xuICAvKiogVHJhbnNmb3JtcyBhIHNldCBvZiBoaWVyYXJjaGljYWwgc3RydWN0dXJlZCBkYXRhIGludG8gYSBmbGF0dGVuZWQgZGF0YSBhcnJheS4gKi9cbiAgZmxhdHRlbk5vZGVzKHN0cnVjdHVyZWREYXRhOiBhbnlbXSk6IFRbXTtcblxuICAvKipcbiAgICogRXhwYW5kcyBhIGZsYXR0ZW5lZCBhcnJheSBvZiBkYXRhIGludG8gaXRzIGhpZXJhcmNoaWNhbCBmb3JtIHVzaW5nIHRoZSBwcm92aWRlZCBleHBhbnNpb25cbiAgICogbW9kZWwuXG4gICAqL1xuICBleHBhbmRGbGF0dGVuZWROb2Rlcyhub2RlczogVFtdLCBleHBhbnNpb25Nb2RlbDogU2VsZWN0aW9uTW9kZWw8VD4pOiBUW107XG5cbiAgLyoqXG4gICAqIFB1dCBub2RlIGRlc2NlbmRhbnRzIG9mIG5vZGUgaW4gYXJyYXkuXG4gICAqIElmIGBvbmx5RXhwYW5kYWJsZWAgaXMgdHJ1ZSwgdGhlbiBvbmx5IHByb2Nlc3MgZXhwYW5kYWJsZSBkZXNjZW5kYW50cy5cbiAgICovXG4gIG5vZGVEZXNjZW5kZW50cyhub2RlOiBULCBub2RlczogVFtdLCBvbmx5RXhwYW5kYWJsZTogYm9vbGVhbik6IHZvaWQ7XG59XG4iXX0=