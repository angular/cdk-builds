/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/tree/control/base-tree-control.ts
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
 * @template T, K
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
        this.expansionModel.toggle(this._trackByValue(dataNode));
    }
    /**
     * Expands one single data node.
     * @param {?} dataNode
     * @return {?}
     */
    expand(dataNode) {
        this.expansionModel.select(this._trackByValue(dataNode));
    }
    /**
     * Collapses one single data node.
     * @param {?} dataNode
     * @return {?}
     */
    collapse(dataNode) {
        this.expansionModel.deselect(this._trackByValue(dataNode));
    }
    /**
     * Whether a given data node is expanded or not. Returns true if the data node is expanded.
     * @param {?} dataNode
     * @return {?}
     */
    isExpanded(dataNode) {
        return this.expansionModel.isSelected(this._trackByValue(dataNode));
    }
    /**
     * Toggles a subtree rooted at `node` recursively.
     * @param {?} dataNode
     * @return {?}
     */
    toggleDescendants(dataNode) {
        this.expansionModel.isSelected(this._trackByValue(dataNode)) ?
            this.collapseDescendants(dataNode) :
            this.expandDescendants(dataNode);
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
        this.expansionModel.select(...toBeProcessed.map((/**
         * @param {?} value
         * @return {?}
         */
        value => this._trackByValue(value))));
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
        this.expansionModel.deselect(...toBeProcessed.map((/**
         * @param {?} value
         * @return {?}
         */
        value => this._trackByValue(value))));
    }
    /**
     * @protected
     * @param {?} value
     * @return {?}
     */
    _trackByValue(value) {
        return this.trackBy ? this.trackBy((/** @type {?} */ (value))) : (/** @type {?} */ (value));
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
     * Returns the identifier by which a dataNode should be tracked, should its
     * reference change.
     *
     * Similar to trackBy for *ngFor
     * @type {?}
     */
    BaseTreeControl.prototype.trackBy;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS10cmVlLWNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvY29udHJvbC9iYXNlLXRyZWUtY29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7Ozs7OztBQUt4RCxNQUFNLE9BQWdCLGVBQWU7SUFBckM7Ozs7UUFZRSxtQkFBYyxHQUFzQixJQUFJLGNBQWMsQ0FBSSxJQUFJLENBQUMsQ0FBQztJQXVFbEUsQ0FBQzs7Ozs7O0lBaERDLE1BQU0sQ0FBQyxRQUFXO1FBQ2hCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDOzs7Ozs7SUFHRCxNQUFNLENBQUMsUUFBVztRQUNoQixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBQzs7Ozs7O0lBR0QsUUFBUSxDQUFDLFFBQVc7UUFDbEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzdELENBQUM7Ozs7OztJQUdELFVBQVUsQ0FBQyxRQUFXO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7Ozs7OztJQUdELGlCQUFpQixDQUFDLFFBQVc7UUFDM0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Ozs7O0lBR0QsV0FBVztRQUNULElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUIsQ0FBQzs7Ozs7O0lBR0QsaUJBQWlCLENBQUMsUUFBVzs7WUFDdkIsYUFBYSxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzlCLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRzs7OztRQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQzs7Ozs7O0lBR0QsbUJBQW1CLENBQUMsUUFBVzs7WUFDekIsYUFBYSxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzlCLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRzs7OztRQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDekYsQ0FBQzs7Ozs7O0lBRVMsYUFBYSxDQUFDLEtBQVU7UUFDaEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFBLEtBQUssRUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLEtBQUssRUFBSyxDQUFDO0lBQzlELENBQUM7Q0FDRjs7Ozs7O0lBMUVDLG9DQUFlOzs7OztJQUdmLHlDQUFnRTs7Ozs7Ozs7SUFRaEUsa0NBQTZCOzs7OztJQUc3QixtQ0FBa0M7Ozs7OztJQU1sQyx1Q0FBdUM7Ozs7O0lBR3ZDLHNDQUF5RTs7Ozs7OztJQTdCekUsbUVBQTBDOzs7Ozs7SUFHMUMsc0RBQTJCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1NlbGVjdGlvbk1vZGVsfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7VHJlZUNvbnRyb2x9IGZyb20gJy4vdHJlZS1jb250cm9sJztcblxuLyoqIEJhc2UgdHJlZSBjb250cm9sLiBJdCBoYXMgYmFzaWMgdG9nZ2xlL2V4cGFuZC9jb2xsYXBzZSBvcGVyYXRpb25zIG9uIGEgc2luZ2xlIGRhdGEgbm9kZS4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlVHJlZUNvbnRyb2w8VCwgSyA9IFQ+IGltcGxlbWVudHMgVHJlZUNvbnRyb2w8VCwgSz4ge1xuXG4gIC8qKiBHZXRzIGEgbGlzdCBvZiBkZXNjZW5kZW50IGRhdGEgbm9kZXMgb2YgYSBzdWJ0cmVlIHJvb3RlZCBhdCBnaXZlbiBkYXRhIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIGFic3RyYWN0IGdldERlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogVFtdO1xuXG4gIC8qKiBFeHBhbmRzIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLiAqL1xuICBhYnN0cmFjdCBleHBhbmRBbGwoKTogdm9pZDtcblxuICAvKiogU2F2ZWQgZGF0YSBub2RlIGZvciBgZXhwYW5kQWxsYCBhY3Rpb24uICovXG4gIGRhdGFOb2RlczogVFtdO1xuXG4gIC8qKiBBIHNlbGVjdGlvbiBtb2RlbCB3aXRoIG11bHRpLXNlbGVjdGlvbiB0byB0cmFjayBleHBhbnNpb24gc3RhdHVzLiAqL1xuICBleHBhbnNpb25Nb2RlbDogU2VsZWN0aW9uTW9kZWw8Sz4gPSBuZXcgU2VsZWN0aW9uTW9kZWw8Sz4odHJ1ZSk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkZW50aWZpZXIgYnkgd2hpY2ggYSBkYXRhTm9kZSBzaG91bGQgYmUgdHJhY2tlZCwgc2hvdWxkIGl0c1xuICAgKiByZWZlcmVuY2UgY2hhbmdlLlxuICAgKlxuICAgKiBTaW1pbGFyIHRvIHRyYWNrQnkgZm9yICpuZ0ZvclxuICAgKi9cbiAgdHJhY2tCeT86IChkYXRhTm9kZTogVCkgPT4gSztcblxuICAvKiogR2V0IGRlcHRoIG9mIGEgZ2l2ZW4gZGF0YSBub2RlLCByZXR1cm4gdGhlIGxldmVsIG51bWJlci4gVGhpcyBpcyBmb3IgZmxhdCB0cmVlIG5vZGUuICovXG4gIGdldExldmVsOiAoZGF0YU5vZGU6IFQpID0+IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZGF0YSBub2RlIGlzIGV4cGFuZGFibGUuIFJldHVybnMgdHJ1ZSBpZiBleHBhbmRhYmxlLlxuICAgKiBUaGlzIGlzIGZvciBmbGF0IHRyZWUgbm9kZS5cbiAgICovXG4gIGlzRXhwYW5kYWJsZTogKGRhdGFOb2RlOiBUKSA9PiBib29sZWFuO1xuXG4gIC8qKiBHZXRzIGEgc3RyZWFtIHRoYXQgZW1pdHMgd2hlbmV2ZXIgdGhlIGdpdmVuIGRhdGEgbm9kZSdzIGNoaWxkcmVuIGNoYW5nZS4gKi9cbiAgZ2V0Q2hpbGRyZW46IChkYXRhTm9kZTogVCkgPT4gKE9ic2VydmFibGU8VFtdPiB8IFRbXSB8IHVuZGVmaW5lZCB8IG51bGwpO1xuXG4gIC8qKiBUb2dnbGVzIG9uZSBzaW5nbGUgZGF0YSBub2RlJ3MgZXhwYW5kZWQvY29sbGFwc2VkIHN0YXRlLiAqL1xuICB0b2dnbGUoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLnRvZ2dsZSh0aGlzLl90cmFja0J5VmFsdWUoZGF0YU5vZGUpKTtcbiAgfVxuXG4gIC8qKiBFeHBhbmRzIG9uZSBzaW5nbGUgZGF0YSBub2RlLiAqL1xuICBleHBhbmQoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLnNlbGVjdCh0aGlzLl90cmFja0J5VmFsdWUoZGF0YU5vZGUpKTtcbiAgfVxuXG4gIC8qKiBDb2xsYXBzZXMgb25lIHNpbmdsZSBkYXRhIG5vZGUuICovXG4gIGNvbGxhcHNlKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgdGhpcy5leHBhbnNpb25Nb2RlbC5kZXNlbGVjdCh0aGlzLl90cmFja0J5VmFsdWUoZGF0YU5vZGUpKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIGEgZ2l2ZW4gZGF0YSBub2RlIGlzIGV4cGFuZGVkIG9yIG5vdC4gUmV0dXJucyB0cnVlIGlmIHRoZSBkYXRhIG5vZGUgaXMgZXhwYW5kZWQuICovXG4gIGlzRXhwYW5kZWQoZGF0YU5vZGU6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5leHBhbnNpb25Nb2RlbC5pc1NlbGVjdGVkKHRoaXMuX3RyYWNrQnlWYWx1ZShkYXRhTm9kZSkpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgYSBzdWJ0cmVlIHJvb3RlZCBhdCBgbm9kZWAgcmVjdXJzaXZlbHkuICovXG4gIHRvZ2dsZURlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgdGhpcy5leHBhbnNpb25Nb2RlbC5pc1NlbGVjdGVkKHRoaXMuX3RyYWNrQnlWYWx1ZShkYXRhTm9kZSkpID9cbiAgICAgICAgdGhpcy5jb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlKSA6XG4gICAgICAgIHRoaXMuZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGUpO1xuICB9XG5cbiAgLyoqIENvbGxhcHNlIGFsbCBkYXRhTm9kZXMgaW4gdGhlIHRyZWUuICovXG4gIGNvbGxhcHNlQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBFeHBhbmRzIGEgc3VidHJlZSByb290ZWQgYXQgZ2l2ZW4gZGF0YSBub2RlIHJlY3Vyc2l2ZWx5LiAqL1xuICBleHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGxldCB0b0JlUHJvY2Vzc2VkID0gW2RhdGFOb2RlXTtcbiAgICB0b0JlUHJvY2Vzc2VkLnB1c2goLi4udGhpcy5nZXREZXNjZW5kYW50cyhkYXRhTm9kZSkpO1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuc2VsZWN0KC4uLnRvQmVQcm9jZXNzZWQubWFwKHZhbHVlID0+IHRoaXMuX3RyYWNrQnlWYWx1ZSh2YWx1ZSkpKTtcbiAgfVxuXG4gIC8qKiBDb2xsYXBzZXMgYSBzdWJ0cmVlIHJvb3RlZCBhdCBnaXZlbiBkYXRhIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIGNvbGxhcHNlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBsZXQgdG9CZVByb2Nlc3NlZCA9IFtkYXRhTm9kZV07XG4gICAgdG9CZVByb2Nlc3NlZC5wdXNoKC4uLnRoaXMuZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpKTtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KC4uLnRvQmVQcm9jZXNzZWQubWFwKHZhbHVlID0+IHRoaXMuX3RyYWNrQnlWYWx1ZSh2YWx1ZSkpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBfdHJhY2tCeVZhbHVlKHZhbHVlOiBUfEspOiBLIHtcbiAgICByZXR1cm4gdGhpcy50cmFja0J5ID8gdGhpcy50cmFja0J5KHZhbHVlIGFzIFQpIDogdmFsdWUgYXMgSztcbiAgfVxufVxuIl19