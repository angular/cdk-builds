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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLXRyZWUtY29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9jb250cm9sL25lc3RlZC10cmVlLWNvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDOzs7OztBQUdwRCxNQUFNLE9BQU8saUJBQXFCLFNBQVEsZUFBa0I7Ozs7O0lBRzFELFlBQW1CLFdBQXdFO1FBQ3pGLEtBQUssRUFBRSxDQUFDO1FBRFMsZ0JBQVcsR0FBWCxXQUFXLENBQTZEO0lBRTNGLENBQUM7Ozs7Ozs7O0lBUUQsU0FBUztRQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7O2NBQ3RCLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU07Ozs7O1FBQUMsQ0FBQyxXQUFnQixFQUFFLFFBQVEsRUFBRSxFQUFFLENBQ2xFLENBQUMsR0FBRyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFFLEVBQUUsQ0FBQztRQUNyRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Ozs7OztJQUdELGNBQWMsQ0FBQyxRQUFXOztjQUNsQixXQUFXLEdBQVEsRUFBRTtRQUUzQixJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1Qyx5QkFBeUI7UUFDekIsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUM7Ozs7Ozs7O0lBR1MsZUFBZSxDQUFDLFdBQWdCLEVBQUUsUUFBVztRQUNyRCxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztjQUNyQixhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7UUFDaEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ2hDLGFBQWEsQ0FBQyxPQUFPOzs7O1lBQUMsQ0FBQyxLQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFDLENBQUM7U0FDL0U7YUFBTSxJQUFJLGFBQWEsWUFBWSxVQUFVLEVBQUU7WUFDOUMsb0ZBQW9GO1lBQ3BGLDRGQUE0RjtZQUM1RixhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsbUJBQUEsT0FBTyxFQUFpQixDQUFDLENBQUM7aUJBQ3hELFNBQVM7Ozs7WUFBQyxRQUFRLENBQUMsRUFBRTtnQkFDcEIsS0FBSyxNQUFNLEtBQUssSUFBSSxRQUFRLEVBQUU7b0JBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUMxQztZQUNILENBQUMsRUFBQyxDQUFDO1NBQ1I7SUFDSCxDQUFDO0NBQ0Y7OztJQTNDYSx3Q0FBK0UiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2UsIGZpbHRlcn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtCYXNlVHJlZUNvbnRyb2x9IGZyb20gJy4vYmFzZS10cmVlLWNvbnRyb2wnO1xuXG4vKiogTmVzdGVkIHRyZWUgY29udHJvbC4gQWJsZSB0byBleHBhbmQvY29sbGFwc2UgYSBzdWJ0cmVlIHJlY3Vyc2l2ZWx5IGZvciBOZXN0ZWROb2RlIHR5cGUuICovXG5leHBvcnQgY2xhc3MgTmVzdGVkVHJlZUNvbnRyb2w8VD4gZXh0ZW5kcyBCYXNlVHJlZUNvbnRyb2w8VD4ge1xuXG4gIC8qKiBDb25zdHJ1Y3Qgd2l0aCBuZXN0ZWQgdHJlZSBmdW5jdGlvbiBnZXRDaGlsZHJlbi4gKi9cbiAgY29uc3RydWN0b3IocHVibGljIGdldENoaWxkcmVuOiAoZGF0YU5vZGU6IFQpID0+IChPYnNlcnZhYmxlPFRbXT4gfCBUW10gfCB1bmRlZmluZWQgfCBudWxsKSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwYW5kcyBhbGwgZGF0YU5vZGVzIGluIHRoZSB0cmVlLlxuICAgKlxuICAgKiBUbyBtYWtlIHRoaXMgd29ya2luZywgdGhlIGBkYXRhTm9kZXNgIHZhcmlhYmxlIG9mIHRoZSBUcmVlQ29udHJvbCBtdXN0IGJlIHNldCB0byBhbGwgcm9vdCBsZXZlbFxuICAgKiBkYXRhIG5vZGVzIG9mIHRoZSB0cmVlLlxuICAgKi9cbiAgZXhwYW5kQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuY2xlYXIoKTtcbiAgICBjb25zdCBhbGxOb2RlcyA9IHRoaXMuZGF0YU5vZGVzLnJlZHVjZSgoYWNjdW11bGF0b3I6IFRbXSwgZGF0YU5vZGUpID0+XG4gICAgICAgIFsuLi5hY2N1bXVsYXRvciwgLi4udGhpcy5nZXREZXNjZW5kYW50cyhkYXRhTm9kZSksIGRhdGFOb2RlXSwgW10pO1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuc2VsZWN0KC4uLmFsbE5vZGVzKTtcbiAgfVxuXG4gIC8qKiBHZXRzIGEgbGlzdCBvZiBkZXNjZW5kYW50IGRhdGFOb2RlcyBvZiBhIHN1YnRyZWUgcm9vdGVkIGF0IGdpdmVuIGRhdGEgbm9kZSByZWN1cnNpdmVseS4gKi9cbiAgZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiBUW10ge1xuICAgIGNvbnN0IGRlc2NlbmRhbnRzOiBUW10gPSBbXTtcblxuICAgIHRoaXMuX2dldERlc2NlbmRhbnRzKGRlc2NlbmRhbnRzLCBkYXRhTm9kZSk7XG4gICAgLy8gUmVtb3ZlIHRoZSBub2RlIGl0c2VsZlxuICAgIHJldHVybiBkZXNjZW5kYW50cy5zcGxpY2UoMSk7XG4gIH1cblxuICAvKiogQSBoZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IGRlc2NlbmRhbnRzIHJlY3Vyc2l2ZWx5LiAqL1xuICBwcm90ZWN0ZWQgX2dldERlc2NlbmRhbnRzKGRlc2NlbmRhbnRzOiBUW10sIGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgZGVzY2VuZGFudHMucHVzaChkYXRhTm9kZSk7XG4gICAgY29uc3QgY2hpbGRyZW5Ob2RlcyA9IHRoaXMuZ2V0Q2hpbGRyZW4oZGF0YU5vZGUpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuTm9kZXMpKSB7XG4gICAgICBjaGlsZHJlbk5vZGVzLmZvckVhY2goKGNoaWxkOiBUKSA9PiB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgY2hpbGQpKTtcbiAgICB9IGVsc2UgaWYgKGNoaWxkcmVuTm9kZXMgaW5zdGFuY2VvZiBPYnNlcnZhYmxlKSB7XG4gICAgICAvLyBUeXBlU2NyaXB0IGFzIG9mIHZlcnNpb24gMy41IGRvZXNuJ3Qgc2VlbSB0byB0cmVhdCBgQm9vbGVhbmAgbGlrZSBhIGZ1bmN0aW9uIHRoYXRcbiAgICAgIC8vIHJldHVybnMgYSBgYm9vbGVhbmAgc3BlY2lmaWNhbGx5IGluIHRoZSBjb250ZXh0IG9mIGBmaWx0ZXJgLCBzbyB3ZSBtYW51YWxseSBjbGFyaWZ5IHRoYXQuXG4gICAgICBjaGlsZHJlbk5vZGVzLnBpcGUodGFrZSgxKSwgZmlsdGVyKEJvb2xlYW4gYXMgKCkgPT4gYm9vbGVhbikpXG4gICAgICAgICAgLnN1YnNjcmliZShjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2dldERlc2NlbmRhbnRzKGRlc2NlbmRhbnRzLCBjaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=