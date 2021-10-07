/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isObservable } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { BaseTreeControl } from './base-tree-control';
/** Nested tree control. Able to expand/collapse a subtree recursively for NestedNode type. */
export class NestedTreeControl extends BaseTreeControl {
    /** Construct with nested tree function getChildren. */
    constructor(getChildren, options) {
        super();
        this.getChildren = getChildren;
        this.options = options;
        if (this.options) {
            this.trackBy = this.options.trackBy;
        }
    }
    /**
     * Expands all dataNodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all root level
     * data nodes of the tree.
     */
    expandAll() {
        this.expansionModel.clear();
        const allNodes = this.dataNodes.reduce((accumulator, dataNode) => [...accumulator, ...this.getDescendants(dataNode), dataNode], []);
        this.expansionModel.select(...allNodes.map(node => this._trackByValue(node)));
    }
    /** Gets a list of descendant dataNodes of a subtree rooted at given data node recursively. */
    getDescendants(dataNode) {
        const descendants = [];
        this._getDescendants(descendants, dataNode);
        // Remove the node itself
        return descendants.splice(1);
    }
    /** A helper function to get descendants recursively. */
    _getDescendants(descendants, dataNode) {
        descendants.push(dataNode);
        const childrenNodes = this.getChildren(dataNode);
        if (Array.isArray(childrenNodes)) {
            childrenNodes.forEach((child) => this._getDescendants(descendants, child));
        }
        else if (isObservable(childrenNodes)) {
            // TypeScript as of version 3.5 doesn't seem to treat `Boolean` like a function that
            // returns a `boolean` specifically in the context of `filter`, so we manually clarify that.
            childrenNodes.pipe(take(1), filter(Boolean))
                .subscribe(children => {
                for (const child of children) {
                    this._getDescendants(descendants, child);
                }
            });
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLXRyZWUtY29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9jb250cm9sL25lc3RlZC10cmVlLWNvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFhLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM5QyxPQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQU9wRCw4RkFBOEY7QUFDOUYsTUFBTSxPQUFPLGlCQUE0QixTQUFRLGVBQXFCO0lBQ3BFLHVEQUF1RDtJQUN2RCxZQUNvQixXQUF1RSxFQUNoRixPQUF3QztRQUNqRCxLQUFLLEVBQUUsQ0FBQztRQUZVLGdCQUFXLEdBQVgsV0FBVyxDQUE0RDtRQUNoRixZQUFPLEdBQVAsT0FBTyxDQUFpQztRQUdqRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUNyQztJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVM7UUFDUCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBZ0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUNsRSxDQUFDLEdBQUcsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsOEZBQThGO0lBQzlGLGNBQWMsQ0FBQyxRQUFXO1FBQ3hCLE1BQU0sV0FBVyxHQUFRLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1Qyx5QkFBeUI7UUFDekIsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCx3REFBd0Q7SUFDOUMsZUFBZSxDQUFDLFdBQWdCLEVBQUUsUUFBVztRQUNyRCxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ2hDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDL0U7YUFBTSxJQUFJLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN0QyxvRkFBb0Y7WUFDcEYsNEZBQTRGO1lBQzVGLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUF3QixDQUFDLENBQUM7aUJBQ3hELFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDcEIsS0FBSyxNQUFNLEtBQUssSUFBSSxRQUFRLEVBQUU7b0JBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUMxQztZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ1I7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7T2JzZXJ2YWJsZSwgaXNPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZSwgZmlsdGVyfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0Jhc2VUcmVlQ29udHJvbH0gZnJvbSAnLi9iYXNlLXRyZWUtY29udHJvbCc7XG5cbi8qKiBPcHRpb25hbCBzZXQgb2YgY29uZmlndXJhdGlvbiB0aGF0IGNhbiBiZSBwcm92aWRlZCB0byB0aGUgTmVzdGVkVHJlZUNvbnRyb2wuICovXG5leHBvcnQgaW50ZXJmYWNlIE5lc3RlZFRyZWVDb250cm9sT3B0aW9uczxULCBLPiB7XG4gIHRyYWNrQnk/OiAoZGF0YU5vZGU6IFQpID0+IEs7XG59XG5cbi8qKiBOZXN0ZWQgdHJlZSBjb250cm9sLiBBYmxlIHRvIGV4cGFuZC9jb2xsYXBzZSBhIHN1YnRyZWUgcmVjdXJzaXZlbHkgZm9yIE5lc3RlZE5vZGUgdHlwZS4gKi9cbmV4cG9ydCBjbGFzcyBOZXN0ZWRUcmVlQ29udHJvbDxULCBLID0gVD4gZXh0ZW5kcyBCYXNlVHJlZUNvbnRyb2w8VCwgSz4ge1xuICAvKiogQ29uc3RydWN0IHdpdGggbmVzdGVkIHRyZWUgZnVuY3Rpb24gZ2V0Q2hpbGRyZW4uICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG92ZXJyaWRlIGdldENoaWxkcmVuOiAoZGF0YU5vZGU6IFQpID0+IChPYnNlcnZhYmxlPFRbXT58IFRbXSB8IHVuZGVmaW5lZCB8IG51bGwpLFxuICAgICAgcHVibGljIG9wdGlvbnM/OiBOZXN0ZWRUcmVlQ29udHJvbE9wdGlvbnM8VCwgSz4pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucykge1xuICAgICAgdGhpcy50cmFja0J5ID0gdGhpcy5vcHRpb25zLnRyYWNrQnk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgYWxsIGRhdGFOb2RlcyBpbiB0aGUgdHJlZS5cbiAgICpcbiAgICogVG8gbWFrZSB0aGlzIHdvcmtpbmcsIHRoZSBgZGF0YU5vZGVzYCB2YXJpYWJsZSBvZiB0aGUgVHJlZUNvbnRyb2wgbXVzdCBiZSBzZXQgdG8gYWxsIHJvb3QgbGV2ZWxcbiAgICogZGF0YSBub2RlcyBvZiB0aGUgdHJlZS5cbiAgICovXG4gIGV4cGFuZEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLmNsZWFyKCk7XG4gICAgY29uc3QgYWxsTm9kZXMgPSB0aGlzLmRhdGFOb2Rlcy5yZWR1Y2UoKGFjY3VtdWxhdG9yOiBUW10sIGRhdGFOb2RlKSA9PlxuICAgICAgICBbLi4uYWNjdW11bGF0b3IsIC4uLnRoaXMuZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpLCBkYXRhTm9kZV0sIFtdKTtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLnNlbGVjdCguLi5hbGxOb2Rlcy5tYXAobm9kZSA9PiB0aGlzLl90cmFja0J5VmFsdWUobm9kZSkpKTtcbiAgfVxuXG4gIC8qKiBHZXRzIGEgbGlzdCBvZiBkZXNjZW5kYW50IGRhdGFOb2RlcyBvZiBhIHN1YnRyZWUgcm9vdGVkIGF0IGdpdmVuIGRhdGEgbm9kZSByZWN1cnNpdmVseS4gKi9cbiAgZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiBUW10ge1xuICAgIGNvbnN0IGRlc2NlbmRhbnRzOiBUW10gPSBbXTtcblxuICAgIHRoaXMuX2dldERlc2NlbmRhbnRzKGRlc2NlbmRhbnRzLCBkYXRhTm9kZSk7XG4gICAgLy8gUmVtb3ZlIHRoZSBub2RlIGl0c2VsZlxuICAgIHJldHVybiBkZXNjZW5kYW50cy5zcGxpY2UoMSk7XG4gIH1cblxuICAvKiogQSBoZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IGRlc2NlbmRhbnRzIHJlY3Vyc2l2ZWx5LiAqL1xuICBwcm90ZWN0ZWQgX2dldERlc2NlbmRhbnRzKGRlc2NlbmRhbnRzOiBUW10sIGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgZGVzY2VuZGFudHMucHVzaChkYXRhTm9kZSk7XG4gICAgY29uc3QgY2hpbGRyZW5Ob2RlcyA9IHRoaXMuZ2V0Q2hpbGRyZW4oZGF0YU5vZGUpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuTm9kZXMpKSB7XG4gICAgICBjaGlsZHJlbk5vZGVzLmZvckVhY2goKGNoaWxkOiBUKSA9PiB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgY2hpbGQpKTtcbiAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZShjaGlsZHJlbk5vZGVzKSkge1xuICAgICAgLy8gVHlwZVNjcmlwdCBhcyBvZiB2ZXJzaW9uIDMuNSBkb2Vzbid0IHNlZW0gdG8gdHJlYXQgYEJvb2xlYW5gIGxpa2UgYSBmdW5jdGlvbiB0aGF0XG4gICAgICAvLyByZXR1cm5zIGEgYGJvb2xlYW5gIHNwZWNpZmljYWxseSBpbiB0aGUgY29udGV4dCBvZiBgZmlsdGVyYCwgc28gd2UgbWFudWFsbHkgY2xhcmlmeSB0aGF0LlxuICAgICAgY2hpbGRyZW5Ob2Rlcy5waXBlKHRha2UoMSksIGZpbHRlcihCb29sZWFuIGFzICgpID0+IGJvb2xlYW4pKVxuICAgICAgICAgIC5zdWJzY3JpYmUoY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuIl19