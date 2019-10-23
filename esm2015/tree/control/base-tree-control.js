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
import { SelectionModel } from '@angular/cdk/collections';
/**
 * Base tree control. It has basic toggle/expand/collapse operations on a single data node.
 * @abstract
 * @template T
 */
export class BaseTreeControl {
    constructor() {
        /**
         * A selection model with multi-selection to track expansion status.
         */
        this.expansionModel = new SelectionModel(true);
    }
    /**
     * Toggles one single data node's expanded/collapsed state.
     * @param {?} dataNode
     * @return {?}
     */
    toggle(dataNode) {
        this.expansionModel.toggle(dataNode);
    }
    /**
     * Expands one single data node.
     * @param {?} dataNode
     * @return {?}
     */
    expand(dataNode) {
        this.expansionModel.select(dataNode);
    }
    /**
     * Collapses one single data node.
     * @param {?} dataNode
     * @return {?}
     */
    collapse(dataNode) {
        this.expansionModel.deselect(dataNode);
    }
    /**
     * Whether a given data node is expanded or not. Returns true if the data node is expanded.
     * @param {?} dataNode
     * @return {?}
     */
    isExpanded(dataNode) {
        return this.expansionModel.isSelected(dataNode);
    }
    /**
     * Toggles a subtree rooted at `node` recursively.
     * @param {?} dataNode
     * @return {?}
     */
    toggleDescendants(dataNode) {
        this.expansionModel.isSelected(dataNode)
            ? this.collapseDescendants(dataNode)
            : this.expandDescendants(dataNode);
    }
    /**
     * Collapse all dataNodes in the tree.
     * @return {?}
     */
    collapseAll() {
        this.expansionModel.clear();
    }
    /**
     * Expands a subtree rooted at given data node recursively.
     * @param {?} dataNode
     * @return {?}
     */
    expandDescendants(dataNode) {
        /** @type {?} */
        let toBeProcessed = [dataNode];
        toBeProcessed.push(...this.getDescendants(dataNode));
        this.expansionModel.select(...toBeProcessed);
    }
    /**
     * Collapses a subtree rooted at given data node recursively.
     * @param {?} dataNode
     * @return {?}
     */
    collapseDescendants(dataNode) {
        /** @type {?} */
        let toBeProcessed = [dataNode];
        toBeProcessed.push(...this.getDescendants(dataNode));
        this.expansionModel.deselect(...toBeProcessed);
    }
}
if (false) {
    /**
     * Saved data node for `expandAll` action.
     * @type {?}
     */
    BaseTreeControl.prototype.dataNodes;
    /**
     * A selection model with multi-selection to track expansion status.
     * @type {?}
     */
    BaseTreeControl.prototype.expansionModel;
    /**
     * Get depth of a given data node, return the level number. This is for flat tree node.
     * @type {?}
     */
    BaseTreeControl.prototype.getLevel;
    /**
     * Whether the data node is expandable. Returns true if expandable.
     * This is for flat tree node.
     * @type {?}
     */
    BaseTreeControl.prototype.isExpandable;
    /**
     * Gets a stream that emits whenever the given data node's children change.
     * @type {?}
     */
    BaseTreeControl.prototype.getChildren;
    /**
     * Gets a list of descendent data nodes of a subtree rooted at given data node recursively.
     * @abstract
     * @param {?} dataNode
     * @return {?}
     */
    BaseTreeControl.prototype.getDescendants = function (dataNode) { };
    /**
     * Expands all data nodes in the tree.
     * @abstract
     * @return {?}
     */
    BaseTreeControl.prototype.expandAll = function () { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS10cmVlLWNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvY29udHJvbC9iYXNlLXRyZWUtY29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQzs7Ozs7O0FBS3hELE1BQU0sT0FBZ0IsZUFBZTtJQUFyQzs7OztRQVlFLG1CQUFjLEdBQXNCLElBQUksY0FBYyxDQUFJLElBQUksQ0FBQyxDQUFDO0lBMkRsRSxDQUFDOzs7Ozs7SUE1Q0MsTUFBTSxDQUFDLFFBQVc7UUFDaEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsQ0FBQzs7Ozs7O0lBR0QsTUFBTSxDQUFDLFFBQVc7UUFDaEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsQ0FBQzs7Ozs7O0lBR0QsUUFBUSxDQUFDLFFBQVc7UUFDbEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekMsQ0FBQzs7Ozs7O0lBR0QsVUFBVSxDQUFDLFFBQVc7UUFDcEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsRCxDQUFDOzs7Ozs7SUFHRCxpQkFBaUIsQ0FBQyxRQUFXO1FBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztZQUNwQyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQztZQUNwQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7Ozs7O0lBR0QsV0FBVztRQUNULElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQzs7Ozs7O0lBR0QsaUJBQWlCLENBQUMsUUFBVzs7WUFDdkIsYUFBYSxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzlCLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQztJQUMvQyxDQUFDOzs7Ozs7SUFHRCxtQkFBbUIsQ0FBQyxRQUFXOztZQUN6QixhQUFhLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDOUIsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRjs7Ozs7O0lBOURDLG9DQUFlOzs7OztJQUdmLHlDQUFnRTs7Ozs7SUFHaEUsbUNBQWtDOzs7Ozs7SUFNbEMsdUNBQXVDOzs7OztJQUd2QyxzQ0FBeUU7Ozs7Ozs7SUFyQnpFLG1FQUEwQzs7Ozs7O0lBRzFDLHNEQUEyQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTZWxlY3Rpb25Nb2RlbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1RyZWVDb250cm9sfSBmcm9tICcuL3RyZWUtY29udHJvbCc7XG5cbi8qKiBCYXNlIHRyZWUgY29udHJvbC4gSXQgaGFzIGJhc2ljIHRvZ2dsZS9leHBhbmQvY29sbGFwc2Ugb3BlcmF0aW9ucyBvbiBhIHNpbmdsZSBkYXRhIG5vZGUuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVRyZWVDb250cm9sPFQ+IGltcGxlbWVudHMgVHJlZUNvbnRyb2w8VD4ge1xuXG4gIC8qKiBHZXRzIGEgbGlzdCBvZiBkZXNjZW5kZW50IGRhdGEgbm9kZXMgb2YgYSBzdWJ0cmVlIHJvb3RlZCBhdCBnaXZlbiBkYXRhIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIGFic3RyYWN0IGdldERlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogVFtdO1xuXG4gIC8qKiBFeHBhbmRzIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLiAqL1xuICBhYnN0cmFjdCBleHBhbmRBbGwoKTogdm9pZDtcblxuICAvKiogU2F2ZWQgZGF0YSBub2RlIGZvciBgZXhwYW5kQWxsYCBhY3Rpb24uICovXG4gIGRhdGFOb2RlczogVFtdO1xuXG4gIC8qKiBBIHNlbGVjdGlvbiBtb2RlbCB3aXRoIG11bHRpLXNlbGVjdGlvbiB0byB0cmFjayBleHBhbnNpb24gc3RhdHVzLiAqL1xuICBleHBhbnNpb25Nb2RlbDogU2VsZWN0aW9uTW9kZWw8VD4gPSBuZXcgU2VsZWN0aW9uTW9kZWw8VD4odHJ1ZSk7XG5cbiAgLyoqIEdldCBkZXB0aCBvZiBhIGdpdmVuIGRhdGEgbm9kZSwgcmV0dXJuIHRoZSBsZXZlbCBudW1iZXIuIFRoaXMgaXMgZm9yIGZsYXQgdHJlZSBub2RlLiAqL1xuICBnZXRMZXZlbDogKGRhdGFOb2RlOiBUKSA9PiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGRhdGEgbm9kZSBpcyBleHBhbmRhYmxlLiBSZXR1cm5zIHRydWUgaWYgZXhwYW5kYWJsZS5cbiAgICogVGhpcyBpcyBmb3IgZmxhdCB0cmVlIG5vZGUuXG4gICAqL1xuICBpc0V4cGFuZGFibGU6IChkYXRhTm9kZTogVCkgPT4gYm9vbGVhbjtcblxuICAvKiogR2V0cyBhIHN0cmVhbSB0aGF0IGVtaXRzIHdoZW5ldmVyIHRoZSBnaXZlbiBkYXRhIG5vZGUncyBjaGlsZHJlbiBjaGFuZ2UuICovXG4gIGdldENoaWxkcmVuOiAoZGF0YU5vZGU6IFQpID0+IChPYnNlcnZhYmxlPFRbXT4gfCBUW10gfCB1bmRlZmluZWQgfCBudWxsKTtcblxuICAvKiogVG9nZ2xlcyBvbmUgc2luZ2xlIGRhdGEgbm9kZSdzIGV4cGFuZGVkL2NvbGxhcHNlZCBzdGF0ZS4gKi9cbiAgdG9nZ2xlKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgdGhpcy5leHBhbnNpb25Nb2RlbC50b2dnbGUoZGF0YU5vZGUpO1xuICB9XG5cbiAgLyoqIEV4cGFuZHMgb25lIHNpbmdsZSBkYXRhIG5vZGUuICovXG4gIGV4cGFuZChkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuc2VsZWN0KGRhdGFOb2RlKTtcbiAgfVxuXG4gIC8qKiBDb2xsYXBzZXMgb25lIHNpbmdsZSBkYXRhIG5vZGUuICovXG4gIGNvbGxhcHNlKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgdGhpcy5leHBhbnNpb25Nb2RlbC5kZXNlbGVjdChkYXRhTm9kZSk7XG4gIH1cblxuICAvKiogV2hldGhlciBhIGdpdmVuIGRhdGEgbm9kZSBpcyBleHBhbmRlZCBvciBub3QuIFJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBub2RlIGlzIGV4cGFuZGVkLiAqL1xuICBpc0V4cGFuZGVkKGRhdGFOb2RlOiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZXhwYW5zaW9uTW9kZWwuaXNTZWxlY3RlZChkYXRhTm9kZSk7XG4gIH1cblxuICAvKiogVG9nZ2xlcyBhIHN1YnRyZWUgcm9vdGVkIGF0IGBub2RlYCByZWN1cnNpdmVseS4gKi9cbiAgdG9nZ2xlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLmlzU2VsZWN0ZWQoZGF0YU5vZGUpXG4gICAgICAgID8gdGhpcy5jb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlKVxuICAgICAgICA6IHRoaXMuZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGUpO1xuICB9XG5cbiAgLyoqIENvbGxhcHNlIGFsbCBkYXRhTm9kZXMgaW4gdGhlIHRyZWUuICovXG4gIGNvbGxhcHNlQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBFeHBhbmRzIGEgc3VidHJlZSByb290ZWQgYXQgZ2l2ZW4gZGF0YSBub2RlIHJlY3Vyc2l2ZWx5LiAqL1xuICBleHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGxldCB0b0JlUHJvY2Vzc2VkID0gW2RhdGFOb2RlXTtcbiAgICB0b0JlUHJvY2Vzc2VkLnB1c2goLi4udGhpcy5nZXREZXNjZW5kYW50cyhkYXRhTm9kZSkpO1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuc2VsZWN0KC4uLnRvQmVQcm9jZXNzZWQpO1xuICB9XG5cbiAgLyoqIENvbGxhcHNlcyBhIHN1YnRyZWUgcm9vdGVkIGF0IGdpdmVuIGRhdGEgbm9kZSByZWN1cnNpdmVseS4gKi9cbiAgY29sbGFwc2VEZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGxldCB0b0JlUHJvY2Vzc2VkID0gW2RhdGFOb2RlXTtcbiAgICB0b0JlUHJvY2Vzc2VkLnB1c2goLi4udGhpcy5nZXREZXNjZW5kYW50cyhkYXRhTm9kZSkpO1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuZGVzZWxlY3QoLi4udG9CZVByb2Nlc3NlZCk7XG4gIH1cbn1cbiJdfQ==