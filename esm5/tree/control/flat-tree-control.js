/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends, __read, __spread } from "tslib";
import { BaseTreeControl } from './base-tree-control';
/** Flat tree control. Able to expand/collapse a subtree recursively for flattened tree. */
var FlatTreeControl = /** @class */ (function (_super) {
    __extends(FlatTreeControl, _super);
    /** Construct with flat tree data node functions getLevel and isExpandable. */
    function FlatTreeControl(getLevel, isExpandable, options) {
        var _this = _super.call(this) || this;
        _this.getLevel = getLevel;
        _this.isExpandable = isExpandable;
        _this.options = options;
        if (_this.options) {
            _this.trackBy = _this.options.trackBy;
        }
        return _this;
    }
    /**
     * Gets a list of the data node's subtree of descendent data nodes.
     *
     * To make this working, the `dataNodes` of the TreeControl must be flattened tree nodes
     * with correct levels.
     */
    FlatTreeControl.prototype.getDescendants = function (dataNode) {
        var startIndex = this.dataNodes.indexOf(dataNode);
        var results = [];
        // Goes through flattened tree nodes in the `dataNodes` array, and get all descendants.
        // The level of descendants of a tree node must be greater than the level of the given
        // tree node.
        // If we reach a node whose level is equal to the level of the tree node, we hit a sibling.
        // If we reach a node whose level is greater than the level of the tree node, we hit a
        // sibling of an ancestor.
        for (var i = startIndex + 1; i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]); i++) {
            results.push(this.dataNodes[i]);
        }
        return results;
    };
    /**
     * Expands all data nodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all flattened
     * data nodes of the tree.
     */
    FlatTreeControl.prototype.expandAll = function () {
        var _a;
        var _this = this;
        (_a = this.expansionModel).select.apply(_a, __spread(this.dataNodes.map(function (node) { return _this._trackByValue(node); })));
    };
    return FlatTreeControl;
}(BaseTreeControl));
export { FlatTreeControl };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhdC10cmVlLWNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvY29udHJvbC9mbGF0LXRyZWUtY29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBT3BELDJGQUEyRjtBQUMzRjtJQUErQyxtQ0FBcUI7SUFFbEUsOEVBQThFO0lBQzlFLHlCQUNXLFFBQWlDLEVBQVMsWUFBc0MsRUFDaEYsT0FBc0M7UUFGakQsWUFHRSxpQkFBTyxTQUtSO1FBUFUsY0FBUSxHQUFSLFFBQVEsQ0FBeUI7UUFBUyxrQkFBWSxHQUFaLFlBQVksQ0FBMEI7UUFDaEYsYUFBTyxHQUFQLE9BQU8sQ0FBK0I7UUFHL0MsSUFBSSxLQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLEtBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7U0FDckM7O0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsd0NBQWMsR0FBZCxVQUFlLFFBQVc7UUFDeEIsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEQsSUFBTSxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBRXhCLHVGQUF1RjtRQUN2RixzRkFBc0Y7UUFDdEYsYUFBYTtRQUNiLDJGQUEyRjtRQUMzRixzRkFBc0Y7UUFDdEYsMEJBQTBCO1FBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsRUFDdkIsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3ZGLENBQUMsRUFBRSxFQUFFO1lBQ1AsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxtQ0FBUyxHQUFUOztRQUFBLGlCQUVDO1FBREMsQ0FBQSxLQUFBLElBQUksQ0FBQyxjQUFjLENBQUEsQ0FBQyxNQUFNLG9CQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSSxJQUFJLE9BQUEsS0FBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBeEIsQ0FBd0IsQ0FBQyxHQUFFO0lBQ3RGLENBQUM7SUFDSCxzQkFBQztBQUFELENBQUMsQUE5Q0QsQ0FBK0MsZUFBZSxHQThDN0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCYXNlVHJlZUNvbnRyb2x9IGZyb20gJy4vYmFzZS10cmVlLWNvbnRyb2wnO1xuXG4vKiogT3B0aW9uYWwgc2V0IG9mIGNvbmZpZ3VyYXRpb24gdGhhdCBjYW4gYmUgcHJvdmlkZWQgdG8gdGhlIEZsYXRUcmVlQ29udHJvbC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmxhdFRyZWVDb250cm9sT3B0aW9uczxULCBLPiB7XG4gIHRyYWNrQnk/OiAoZGF0YU5vZGU6IFQpID0+IEs7XG59XG5cbi8qKiBGbGF0IHRyZWUgY29udHJvbC4gQWJsZSB0byBleHBhbmQvY29sbGFwc2UgYSBzdWJ0cmVlIHJlY3Vyc2l2ZWx5IGZvciBmbGF0dGVuZWQgdHJlZS4gKi9cbmV4cG9ydCBjbGFzcyBGbGF0VHJlZUNvbnRyb2w8VCwgSyA9IFQ+IGV4dGVuZHMgQmFzZVRyZWVDb250cm9sPFQsIEs+IHtcblxuICAvKiogQ29uc3RydWN0IHdpdGggZmxhdCB0cmVlIGRhdGEgbm9kZSBmdW5jdGlvbnMgZ2V0TGV2ZWwgYW5kIGlzRXhwYW5kYWJsZS4gKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgZ2V0TGV2ZWw6IChkYXRhTm9kZTogVCkgPT4gbnVtYmVyLCBwdWJsaWMgaXNFeHBhbmRhYmxlOiAoZGF0YU5vZGU6IFQpID0+IGJvb2xlYW4sXG4gICAgICBwdWJsaWMgb3B0aW9ucz86IEZsYXRUcmVlQ29udHJvbE9wdGlvbnM8VCwgSz4pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucykge1xuICAgICAgdGhpcy50cmFja0J5ID0gdGhpcy5vcHRpb25zLnRyYWNrQnk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBsaXN0IG9mIHRoZSBkYXRhIG5vZGUncyBzdWJ0cmVlIG9mIGRlc2NlbmRlbnQgZGF0YSBub2Rlcy5cbiAgICpcbiAgICogVG8gbWFrZSB0aGlzIHdvcmtpbmcsIHRoZSBgZGF0YU5vZGVzYCBvZiB0aGUgVHJlZUNvbnRyb2wgbXVzdCBiZSBmbGF0dGVuZWQgdHJlZSBub2Rlc1xuICAgKiB3aXRoIGNvcnJlY3QgbGV2ZWxzLlxuICAgKi9cbiAgZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiBUW10ge1xuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSB0aGlzLmRhdGFOb2Rlcy5pbmRleE9mKGRhdGFOb2RlKTtcbiAgICBjb25zdCByZXN1bHRzOiBUW10gPSBbXTtcblxuICAgIC8vIEdvZXMgdGhyb3VnaCBmbGF0dGVuZWQgdHJlZSBub2RlcyBpbiB0aGUgYGRhdGFOb2Rlc2AgYXJyYXksIGFuZCBnZXQgYWxsIGRlc2NlbmRhbnRzLlxuICAgIC8vIFRoZSBsZXZlbCBvZiBkZXNjZW5kYW50cyBvZiBhIHRyZWUgbm9kZSBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB0aGUgbGV2ZWwgb2YgdGhlIGdpdmVuXG4gICAgLy8gdHJlZSBub2RlLlxuICAgIC8vIElmIHdlIHJlYWNoIGEgbm9kZSB3aG9zZSBsZXZlbCBpcyBlcXVhbCB0byB0aGUgbGV2ZWwgb2YgdGhlIHRyZWUgbm9kZSwgd2UgaGl0IGEgc2libGluZy5cbiAgICAvLyBJZiB3ZSByZWFjaCBhIG5vZGUgd2hvc2UgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIHRoZSBsZXZlbCBvZiB0aGUgdHJlZSBub2RlLCB3ZSBoaXQgYVxuICAgIC8vIHNpYmxpbmcgb2YgYW4gYW5jZXN0b3IuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXggKyAxO1xuICAgICAgICBpIDwgdGhpcy5kYXRhTm9kZXMubGVuZ3RoICYmIHRoaXMuZ2V0TGV2ZWwoZGF0YU5vZGUpIDwgdGhpcy5nZXRMZXZlbCh0aGlzLmRhdGFOb2Rlc1tpXSk7XG4gICAgICAgIGkrKykge1xuICAgICAgcmVzdWx0cy5wdXNoKHRoaXMuZGF0YU5vZGVzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvKipcbiAgICogRXhwYW5kcyBhbGwgZGF0YSBub2RlcyBpbiB0aGUgdHJlZS5cbiAgICpcbiAgICogVG8gbWFrZSB0aGlzIHdvcmtpbmcsIHRoZSBgZGF0YU5vZGVzYCB2YXJpYWJsZSBvZiB0aGUgVHJlZUNvbnRyb2wgbXVzdCBiZSBzZXQgdG8gYWxsIGZsYXR0ZW5lZFxuICAgKiBkYXRhIG5vZGVzIG9mIHRoZSB0cmVlLlxuICAgKi9cbiAgZXhwYW5kQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuZXhwYW5zaW9uTW9kZWwuc2VsZWN0KC4uLnRoaXMuZGF0YU5vZGVzLm1hcChub2RlID0+IHRoaXMuX3RyYWNrQnlWYWx1ZShub2RlKSkpO1xuICB9XG59XG4iXX0=