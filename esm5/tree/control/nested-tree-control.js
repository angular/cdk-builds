import { __extends, __read, __spread, __values } from "tslib";
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
/** Nested tree control. Able to expand/collapse a subtree recursively for NestedNode type. */
var NestedTreeControl = /** @class */ (function (_super) {
    __extends(NestedTreeControl, _super);
    /** Construct with nested tree function getChildren. */
    function NestedTreeControl(getChildren) {
        var _this = _super.call(this) || this;
        _this.getChildren = getChildren;
        return _this;
    }
    /**
     * Expands all dataNodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all root level
     * data nodes of the tree.
     */
    NestedTreeControl.prototype.expandAll = function () {
        var _a;
        var _this = this;
        this.expansionModel.clear();
        var allNodes = this.dataNodes.reduce(function (accumulator, dataNode) {
            return __spread(accumulator, _this.getDescendants(dataNode), [dataNode]);
        }, []);
        (_a = this.expansionModel).select.apply(_a, __spread(allNodes));
    };
    /** Gets a list of descendant dataNodes of a subtree rooted at given data node recursively. */
    NestedTreeControl.prototype.getDescendants = function (dataNode) {
        var descendants = [];
        this._getDescendants(descendants, dataNode);
        // Remove the node itself
        return descendants.splice(1);
    };
    /** A helper function to get descendants recursively. */
    NestedTreeControl.prototype._getDescendants = function (descendants, dataNode) {
        var _this = this;
        descendants.push(dataNode);
        var childrenNodes = this.getChildren(dataNode);
        if (Array.isArray(childrenNodes)) {
            childrenNodes.forEach(function (child) { return _this._getDescendants(descendants, child); });
        }
        else if (childrenNodes instanceof Observable) {
            // TypeScript as of version 3.5 doesn't seem to treat `Boolean` like a function that
            // returns a `boolean` specifically in the context of `filter`, so we manually clarify that.
            childrenNodes.pipe(take(1), filter(Boolean))
                .subscribe(function (children) {
                var e_1, _a;
                try {
                    for (var children_1 = __values(children), children_1_1 = children_1.next(); !children_1_1.done; children_1_1 = children_1.next()) {
                        var child = children_1_1.value;
                        _this._getDescendants(descendants, child);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (children_1_1 && !children_1_1.done && (_a = children_1.return)) _a.call(children_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            });
        }
    };
    return NestedTreeControl;
}(BaseTreeControl));
export { NestedTreeControl };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLXRyZWUtY29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9jb250cm9sL25lc3RlZC10cmVlLWNvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDaEMsT0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFcEQsOEZBQThGO0FBQzlGO0lBQTBDLHFDQUFrQjtJQUUxRCx1REFBdUQ7SUFDdkQsMkJBQW1CLFdBQXdFO1FBQTNGLFlBQ0UsaUJBQU8sU0FDUjtRQUZrQixpQkFBVyxHQUFYLFdBQVcsQ0FBNkQ7O0lBRTNGLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILHFDQUFTLEdBQVQ7O1FBQUEsaUJBS0M7UUFKQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQUMsV0FBZ0IsRUFBRSxRQUFRO1lBQzlELGdCQUFJLFdBQVcsRUFBSyxLQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxHQUFFLFFBQVE7UUFBM0QsQ0FBNEQsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFBLEtBQUEsSUFBSSxDQUFDLGNBQWMsQ0FBQSxDQUFDLE1BQU0sb0JBQUksUUFBUSxHQUFFO0lBQzFDLENBQUM7SUFFRCw4RkFBOEY7SUFDOUYsMENBQWMsR0FBZCxVQUFlLFFBQVc7UUFDeEIsSUFBTSxXQUFXLEdBQVEsRUFBRSxDQUFDO1FBRTVCLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLHlCQUF5QjtRQUN6QixPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELHdEQUF3RDtJQUM5QywyQ0FBZSxHQUF6QixVQUEwQixXQUFnQixFQUFFLFFBQVc7UUFBdkQsaUJBZUM7UUFkQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNCLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ2hDLGFBQWEsQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFRLElBQUssT0FBQSxLQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBeEMsQ0FBd0MsQ0FBQyxDQUFDO1NBQy9FO2FBQU0sSUFBSSxhQUFhLFlBQVksVUFBVSxFQUFFO1lBQzlDLG9GQUFvRjtZQUNwRiw0RkFBNEY7WUFDNUYsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE9BQXdCLENBQUMsQ0FBQztpQkFDeEQsU0FBUyxDQUFDLFVBQUEsUUFBUTs7O29CQUNqQixLQUFvQixJQUFBLGFBQUEsU0FBQSxRQUFRLENBQUEsa0NBQUEsd0RBQUU7d0JBQXpCLElBQU0sS0FBSyxxQkFBQTt3QkFDZCxLQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDMUM7Ozs7Ozs7OztZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ1I7SUFDSCxDQUFDO0lBQ0gsd0JBQUM7QUFBRCxDQUFDLEFBOUNELENBQTBDLGVBQWUsR0E4Q3hEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlLCBmaWx0ZXJ9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7QmFzZVRyZWVDb250cm9sfSBmcm9tICcuL2Jhc2UtdHJlZS1jb250cm9sJztcblxuLyoqIE5lc3RlZCB0cmVlIGNvbnRyb2wuIEFibGUgdG8gZXhwYW5kL2NvbGxhcHNlIGEgc3VidHJlZSByZWN1cnNpdmVseSBmb3IgTmVzdGVkTm9kZSB0eXBlLiAqL1xuZXhwb3J0IGNsYXNzIE5lc3RlZFRyZWVDb250cm9sPFQ+IGV4dGVuZHMgQmFzZVRyZWVDb250cm9sPFQ+IHtcblxuICAvKiogQ29uc3RydWN0IHdpdGggbmVzdGVkIHRyZWUgZnVuY3Rpb24gZ2V0Q2hpbGRyZW4uICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBnZXRDaGlsZHJlbjogKGRhdGFOb2RlOiBUKSA9PiAoT2JzZXJ2YWJsZTxUW10+IHwgVFtdIHwgdW5kZWZpbmVkIHwgbnVsbCkpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgYWxsIGRhdGFOb2RlcyBpbiB0aGUgdHJlZS5cbiAgICpcbiAgICogVG8gbWFrZSB0aGlzIHdvcmtpbmcsIHRoZSBgZGF0YU5vZGVzYCB2YXJpYWJsZSBvZiB0aGUgVHJlZUNvbnRyb2wgbXVzdCBiZSBzZXQgdG8gYWxsIHJvb3QgbGV2ZWxcbiAgICogZGF0YSBub2RlcyBvZiB0aGUgdHJlZS5cbiAgICovXG4gIGV4cGFuZEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLmNsZWFyKCk7XG4gICAgY29uc3QgYWxsTm9kZXMgPSB0aGlzLmRhdGFOb2Rlcy5yZWR1Y2UoKGFjY3VtdWxhdG9yOiBUW10sIGRhdGFOb2RlKSA9PlxuICAgICAgICBbLi4uYWNjdW11bGF0b3IsIC4uLnRoaXMuZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpLCBkYXRhTm9kZV0sIFtdKTtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLnNlbGVjdCguLi5hbGxOb2Rlcyk7XG4gIH1cblxuICAvKiogR2V0cyBhIGxpc3Qgb2YgZGVzY2VuZGFudCBkYXRhTm9kZXMgb2YgYSBzdWJ0cmVlIHJvb3RlZCBhdCBnaXZlbiBkYXRhIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIGdldERlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogVFtdIHtcbiAgICBjb25zdCBkZXNjZW5kYW50czogVFtdID0gW107XG5cbiAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgZGF0YU5vZGUpO1xuICAgIC8vIFJlbW92ZSB0aGUgbm9kZSBpdHNlbGZcbiAgICByZXR1cm4gZGVzY2VuZGFudHMuc3BsaWNlKDEpO1xuICB9XG5cbiAgLyoqIEEgaGVscGVyIGZ1bmN0aW9uIHRvIGdldCBkZXNjZW5kYW50cyByZWN1cnNpdmVseS4gKi9cbiAgcHJvdGVjdGVkIF9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50czogVFtdLCBkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGRlc2NlbmRhbnRzLnB1c2goZGF0YU5vZGUpO1xuICAgIGNvbnN0IGNoaWxkcmVuTm9kZXMgPSB0aGlzLmdldENoaWxkcmVuKGRhdGFOb2RlKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbk5vZGVzKSkge1xuICAgICAgY2hpbGRyZW5Ob2Rlcy5mb3JFYWNoKChjaGlsZDogVCkgPT4gdGhpcy5fZ2V0RGVzY2VuZGFudHMoZGVzY2VuZGFudHMsIGNoaWxkKSk7XG4gICAgfSBlbHNlIGlmIChjaGlsZHJlbk5vZGVzIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSkge1xuICAgICAgLy8gVHlwZVNjcmlwdCBhcyBvZiB2ZXJzaW9uIDMuNSBkb2Vzbid0IHNlZW0gdG8gdHJlYXQgYEJvb2xlYW5gIGxpa2UgYSBmdW5jdGlvbiB0aGF0XG4gICAgICAvLyByZXR1cm5zIGEgYGJvb2xlYW5gIHNwZWNpZmljYWxseSBpbiB0aGUgY29udGV4dCBvZiBgZmlsdGVyYCwgc28gd2UgbWFudWFsbHkgY2xhcmlmeSB0aGF0LlxuICAgICAgY2hpbGRyZW5Ob2Rlcy5waXBlKHRha2UoMSksIGZpbHRlcihCb29sZWFuIGFzICgpID0+IGJvb2xlYW4pKVxuICAgICAgICAgIC5zdWJzY3JpYmUoY2hpbGRyZW4gPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkZXNjZW5kYW50cywgY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuIl19