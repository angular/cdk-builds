/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/tree/control/nested-tree-control.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { BaseTreeControl } from './base-tree-control';
/**
 * Nested tree control. Able to expand/collapse a subtree recursively for NestedNode type.
 * @template T
 */
export class NestedTreeControl extends BaseTreeControl {
    /**
     * Construct with nested tree function getChildren.
     * @param {?} getChildren
     */
    constructor(getChildren) {
        super();
        this.getChildren = getChildren;
    }
    /**
     * Expands all dataNodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all root level
     * data nodes of the tree.
     * @return {?}
     */
    expandAll() {
        this.expansionModel.clear();
        /** @type {?} */
        const allNodes = this.dataNodes.reduce((/**
         * @param {?} accumulator
         * @param {?} dataNode
         * @return {?}
         */
        (accumulator, dataNode) => [...accumulator, ...this.getDescendants(dataNode), dataNode]), []);
        this.expansionModel.select(...allNodes);
    }
    /**
     * Gets a list of descendant dataNodes of a subtree rooted at given data node recursively.
     * @param {?} dataNode
     * @return {?}
     */
    getDescendants(dataNode) {
        /** @type {?} */
        const descendants = [];
        this._getDescendants(descendants, dataNode);
        // Remove the node itself
        return descendants.splice(1);
    }
    /**
     * A helper function to get descendants recursively.
     * @protected
     * @param {?} descendants
     * @param {?} dataNode
     * @return {?}
     */
    _getDescendants(descendants, dataNode) {
        descendants.push(dataNode);
        /** @type {?} */
        const childrenNodes = this.getChildren(dataNode);
        if (Array.isArray(childrenNodes)) {
            childrenNodes.forEach((/**
             * @param {?} child
             * @return {?}
             */
            (child) => this._getDescendants(descendants, child)));
        }
        else if (childrenNodes instanceof Observable) {
            // TypeScript as of version 3.5 doesn't seem to treat `Boolean` like a function that
            // returns a `boolean` specifically in the context of `filter`, so we manually clarify that.
            childrenNodes.pipe(take(1), filter((/** @type {?} */ (Boolean))))
                .subscribe((/**
             * @param {?} children
             * @return {?}
             */
            children => {
                for (const child of children) {
                    this._getDescendants(descendants, child);
                }
            }));
        }
    }
}
if (false) {
    /** @type {?} */
    NestedTreeControl.prototype.getChildren;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLXRyZWUtY29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9jb250cm9sL25lc3RlZC10cmVlLWNvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoQyxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQzs7Ozs7QUFHcEQsTUFBTSxPQUFPLGlCQUFxQixTQUFRLGVBQWtCOzs7OztJQUcxRCxZQUFtQixXQUF3RTtRQUN6RixLQUFLLEVBQUUsQ0FBQztRQURTLGdCQUFXLEdBQVgsV0FBVyxDQUE2RDtJQUUzRixDQUFDOzs7Ozs7OztJQVFELFNBQVM7UUFDUCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDOztjQUN0QixRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNOzs7OztRQUFDLENBQUMsV0FBZ0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUNsRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUM7UUFDckUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDOzs7Ozs7SUFHRCxjQUFjLENBQUMsUUFBVzs7Y0FDbEIsV0FBVyxHQUFRLEVBQUU7UUFFM0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDNUMseUJBQXlCO1FBQ3pCLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDOzs7Ozs7OztJQUdTLGVBQWUsQ0FBQyxXQUFnQixFQUFFLFFBQVc7UUFDckQsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzs7Y0FDckIsYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDO1FBQ2hELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUNoQyxhQUFhLENBQUMsT0FBTzs7OztZQUFDLENBQUMsS0FBUSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBQyxDQUFDO1NBQy9FO2FBQU0sSUFBSSxhQUFhLFlBQVksVUFBVSxFQUFFO1lBQzlDLG9GQUFvRjtZQUNwRiw0RkFBNEY7WUFDNUYsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLG1CQUFBLE9BQU8sRUFBaUIsQ0FBQyxDQUFDO2lCQUN4RCxTQUFTOzs7O1lBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3BCLEtBQUssTUFBTSxLQUFLLElBQUksUUFBUSxFQUFFO29CQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDMUM7WUFDSCxDQUFDLEVBQUMsQ0FBQztTQUNSO0lBQ0gsQ0FBQztDQUNGOzs7SUEzQ2Esd0NBQStFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlLCBmaWx0ZXJ9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7QmFzZVRyZWVDb250cm9sfSBmcm9tICcuL2Jhc2UtdHJlZS1jb250cm9sJztcblxuLyoqIE5lc3RlZCB0cmVlIGNvbnRyb2wuIEFibGUgdG8gZXhwYW5kL2NvbGxhcHNlIGEgc3VidHJlZSByZWN1cnNpdmVseSBmb3IgTmVzdGVkTm9kZSB0eXBlLiAqL1xuZXhwb3J0IGNsYXNzIE5lc3RlZFRyZWVDb250cm9sPFQ+IGV4dGVuZHMgQmFzZVRyZWVDb250cm9sPFQ+IHtcblxuICAvKiogQ29uc3RydWN0IHdpdGggbmVzdGVkIHRyZWUgZnVuY3Rpb24gZ2V0Q2hpbGRyZW4uICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBnZXRDaGlsZHJlbjogKGRhdGFOb2RlOiBUKSA9PiAoT2JzZXJ2YWJsZTxUW10+IHwgVFtdIHwgdW5kZWZpbmVkIHwgbnVsbCkpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgYWxsIGRhdGFOb2RlcyBpbiB0aGUgdHJlZS5cbiAgICpcbiAgICogVG8gbWFrZSB0aGlzIHdvcmtpbmcsIHRoZSBgZGF0YU5vZGVzYCB2YXJpYWJsZSBvZiB0aGUgVHJlZUNvbnRyb2wgbXVzdCBiZSBzZXQgdG8gYWxsIHJvb3QgbGV2ZWxcbiAgICogZGF0YSBub2RlcyBvZiB0aGUgdHJlZS5cbiAgICovXG4gIGV4cGFuZEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLmNsZWFyKCk7XG4gICAgY29uc3QgYWxsTm9kZXMgPSB0aGlzLmRhdGFOb2Rlcy5yZWR1Y2UoKGFjY3VtdWxhdG9yOiBUW10sIGRhdGFOb2RlKSA9PlxuICAgICAgICBbLi4uYWNjdW11bGF0b3IsIC4uLnRoaXMuZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpLCBkYXRhTm9kZV0sIFtdKTtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLnNlbGVjdCguLi5hbGxOb2Rlcyk7XG4gIH1cblxuICAvKiogR2V0cyBhIGxpc3Qgb2YgZGVzY2VuZGFudCBkYXRhTm9kZXMgb2YgYSBzdWJ0cmVlIHJvb3RlZCBhdCBnaXZlbiBkYXRhIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIGdldERlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogVFtdIHtcbiAgICBjb25zdCBkZXNjZW5kYW50czogVFtdID0gW107XG5cbiAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgZGF0YU5vZGUpO1xuICAgIC8vIFJlbW92ZSB0aGUgbm9kZSBpdHNlbGZcbiAgICByZXR1cm4gZGVzY2VuZGFudHMuc3BsaWNlKDEpO1xuICB9XG5cbiAgLyoqIEEgaGVscGVyIGZ1bmN0aW9uIHRvIGdldCBkZXNjZW5kYW50cyByZWN1cnNpdmVseS4gKi9cbiAgcHJvdGVjdGVkIF9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50czogVFtdLCBkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGRlc2NlbmRhbnRzLnB1c2goZGF0YU5vZGUpO1xuICAgIGNvbnN0IGNoaWxkcmVuTm9kZXMgPSB0aGlzLmdldENoaWxkcmVuKGRhdGFOb2RlKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbk5vZGVzKSkge1xuICAgICAgY2hpbGRyZW5Ob2Rlcy5mb3JFYWNoKChjaGlsZDogVCkgPT4gdGhpcy5fZ2V0RGVzY2VuZGFudHMoZGVzY2VuZGFudHMsIGNoaWxkKSk7XG4gICAgfSBlbHNlIGlmIChjaGlsZHJlbk5vZGVzIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSkge1xuICAgICAgLy8gVHlwZVNjcmlwdCBhcyBvZiB2ZXJzaW9uIDMuNSBkb2Vzbid0IHNlZW0gdG8gdHJlYXQgYEJvb2xlYW5gIGxpa2UgYSBmdW5jdGlvbiB0aGF0XG4gICAgICAvLyByZXR1cm5zIGEgYGJvb2xlYW5gIHNwZWNpZmljYWxseSBpbiB0aGUgY29udGV4dCBvZiBgZmlsdGVyYCwgc28gd2UgbWFudWFsbHkgY2xhcmlmeSB0aGF0LlxuICAgICAgY2hpbGRyZW5Ob2Rlcy5waXBlKHRha2UoMSksIGZpbHRlcihCb29sZWFuIGFzICgpID0+IGJvb2xlYW4pKVxuICAgICAgICAgIC5zdWJzY3JpYmUoY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuIl19