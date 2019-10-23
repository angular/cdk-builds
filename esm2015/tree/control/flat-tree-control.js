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
import { BaseTreeControl } from './base-tree-control';
/**
 * Flat tree control. Able to expand/collapse a subtree recursively for flattened tree.
 * @template T
 */
export class FlatTreeControl extends BaseTreeControl {
    /**
     * Construct with flat tree data node functions getLevel and isExpandable.
     * @param {?} getLevel
     * @param {?} isExpandable
     */
    constructor(getLevel, isExpandable) {
        super();
        this.getLevel = getLevel;
        this.isExpandable = isExpandable;
    }
    /**
     * Gets a list of the data node's subtree of descendent data nodes.
     *
     * To make this working, the `dataNodes` of the TreeControl must be flattened tree nodes
     * with correct levels.
     * @param {?} dataNode
     * @return {?}
     */
    getDescendants(dataNode) {
        /** @type {?} */
        const startIndex = this.dataNodes.indexOf(dataNode);
        /** @type {?} */
        const results = [];
        // Goes through flattened tree nodes in the `dataNodes` array, and get all descendants.
        // The level of descendants of a tree node must be greater than the level of the given
        // tree node.
        // If we reach a node whose level is equal to the level of the tree node, we hit a sibling.
        // If we reach a node whose level is greater than the level of the tree node, we hit a
        // sibling of an ancestor.
        for (let i = startIndex + 1; i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]); i++) {
            results.push(this.dataNodes[i]);
        }
        return results;
    }
    /**
     * Expands all data nodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all flattened
     * data nodes of the tree.
     * @return {?}
     */
    expandAll() {
        this.expansionModel.select(...this.dataNodes);
    }
}
if (false) {
    /** @type {?} */
    FlatTreeControl.prototype.getLevel;
    /** @type {?} */
    FlatTreeControl.prototype.isExpandable;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhdC10cmVlLWNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvY29udHJvbC9mbGF0LXRyZWUtY29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQzs7Ozs7QUFHcEQsTUFBTSxPQUFPLGVBQW1CLFNBQVEsZUFBa0I7Ozs7OztJQUd4RCxZQUFtQixRQUFpQyxFQUNqQyxZQUFzQztRQUN2RCxLQUFLLEVBQUUsQ0FBQztRQUZTLGFBQVEsR0FBUixRQUFRLENBQXlCO1FBQ2pDLGlCQUFZLEdBQVosWUFBWSxDQUEwQjtJQUV6RCxDQUFDOzs7Ozs7Ozs7SUFRRCxjQUFjLENBQUMsUUFBVzs7Y0FDbEIsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQzs7Y0FDN0MsT0FBTyxHQUFRLEVBQUU7UUFFdkIsdUZBQXVGO1FBQ3ZGLHNGQUFzRjtRQUN0RixhQUFhO1FBQ2IsMkZBQTJGO1FBQzNGLHNGQUFzRjtRQUN0RiwwQkFBMEI7UUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxFQUN2QixDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDdkYsQ0FBQyxFQUFFLEVBQUU7WUFDUCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7Ozs7Ozs7O0lBUUQsU0FBUztRQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7Q0FDRjs7O0lBdENhLG1DQUF3Qzs7SUFDeEMsdUNBQTZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmFzZVRyZWVDb250cm9sfSBmcm9tICcuL2Jhc2UtdHJlZS1jb250cm9sJztcblxuLyoqIEZsYXQgdHJlZSBjb250cm9sLiBBYmxlIHRvIGV4cGFuZC9jb2xsYXBzZSBhIHN1YnRyZWUgcmVjdXJzaXZlbHkgZm9yIGZsYXR0ZW5lZCB0cmVlLiAqL1xuZXhwb3J0IGNsYXNzIEZsYXRUcmVlQ29udHJvbDxUPiBleHRlbmRzIEJhc2VUcmVlQ29udHJvbDxUPiB7XG5cbiAgLyoqIENvbnN0cnVjdCB3aXRoIGZsYXQgdHJlZSBkYXRhIG5vZGUgZnVuY3Rpb25zIGdldExldmVsIGFuZCBpc0V4cGFuZGFibGUuICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBnZXRMZXZlbDogKGRhdGFOb2RlOiBUKSA9PiBudW1iZXIsXG4gICAgICAgICAgICAgIHB1YmxpYyBpc0V4cGFuZGFibGU6IChkYXRhTm9kZTogVCkgPT4gYm9vbGVhbikge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIGxpc3Qgb2YgdGhlIGRhdGEgbm9kZSdzIHN1YnRyZWUgb2YgZGVzY2VuZGVudCBkYXRhIG5vZGVzLlxuICAgKlxuICAgKiBUbyBtYWtlIHRoaXMgd29ya2luZywgdGhlIGBkYXRhTm9kZXNgIG9mIHRoZSBUcmVlQ29udHJvbCBtdXN0IGJlIGZsYXR0ZW5lZCB0cmVlIG5vZGVzXG4gICAqIHdpdGggY29ycmVjdCBsZXZlbHMuXG4gICAqL1xuICBnZXREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IFRbXSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IHRoaXMuZGF0YU5vZGVzLmluZGV4T2YoZGF0YU5vZGUpO1xuICAgIGNvbnN0IHJlc3VsdHM6IFRbXSA9IFtdO1xuXG4gICAgLy8gR29lcyB0aHJvdWdoIGZsYXR0ZW5lZCB0cmVlIG5vZGVzIGluIHRoZSBgZGF0YU5vZGVzYCBhcnJheSwgYW5kIGdldCBhbGwgZGVzY2VuZGFudHMuXG4gICAgLy8gVGhlIGxldmVsIG9mIGRlc2NlbmRhbnRzIG9mIGEgdHJlZSBub2RlIG11c3QgYmUgZ3JlYXRlciB0aGFuIHRoZSBsZXZlbCBvZiB0aGUgZ2l2ZW5cbiAgICAvLyB0cmVlIG5vZGUuXG4gICAgLy8gSWYgd2UgcmVhY2ggYSBub2RlIHdob3NlIGxldmVsIGlzIGVxdWFsIHRvIHRoZSBsZXZlbCBvZiB0aGUgdHJlZSBub2RlLCB3ZSBoaXQgYSBzaWJsaW5nLlxuICAgIC8vIElmIHdlIHJlYWNoIGEgbm9kZSB3aG9zZSBsZXZlbCBpcyBncmVhdGVyIHRoYW4gdGhlIGxldmVsIG9mIHRoZSB0cmVlIG5vZGUsIHdlIGhpdCBhXG4gICAgLy8gc2libGluZyBvZiBhbiBhbmNlc3Rvci5cbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleCArIDE7XG4gICAgICAgIGkgPCB0aGlzLmRhdGFOb2Rlcy5sZW5ndGggJiYgdGhpcy5nZXRMZXZlbChkYXRhTm9kZSkgPCB0aGlzLmdldExldmVsKHRoaXMuZGF0YU5vZGVzW2ldKTtcbiAgICAgICAgaSsrKSB7XG4gICAgICByZXN1bHRzLnB1c2godGhpcy5kYXRhTm9kZXNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBhbmRzIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLlxuICAgKlxuICAgKiBUbyBtYWtlIHRoaXMgd29ya2luZywgdGhlIGBkYXRhTm9kZXNgIHZhcmlhYmxlIG9mIHRoZSBUcmVlQ29udHJvbCBtdXN0IGJlIHNldCB0byBhbGwgZmxhdHRlbmVkXG4gICAqIGRhdGEgbm9kZXMgb2YgdGhlIHRyZWUuXG4gICAqL1xuICBleHBhbmRBbGwoKTogdm9pZCB7XG4gICAgdGhpcy5leHBhbnNpb25Nb2RlbC5zZWxlY3QoLi4udGhpcy5kYXRhTm9kZXMpO1xuICB9XG59XG4iXX0=