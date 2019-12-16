/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Directive, ElementRef, Input, Optional, Renderer2 } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CdkTree, CdkTreeNode } from './tree';
/** Regex used to split a string on its CSS units. */
var cssUnitPattern = /([A-Za-z%]+)$/;
/**
 * Indent for the children tree dataNodes.
 * This directive will add left-padding to the node to show hierarchy.
 */
var CdkTreeNodePadding = /** @class */ (function () {
    function CdkTreeNodePadding(_treeNode, _tree, _renderer, _element, _dir) {
        var _this = this;
        this._treeNode = _treeNode;
        this._tree = _tree;
        this._renderer = _renderer;
        this._element = _element;
        this._dir = _dir;
        /** Subject that emits when the component has been destroyed. */
        this._destroyed = new Subject();
        /** CSS units used for the indentation value. */
        this.indentUnits = 'px';
        this._indent = 40;
        this._setPadding();
        if (_dir) {
            _dir.change.pipe(takeUntil(this._destroyed)).subscribe(function () { return _this._setPadding(true); });
        }
        // In Ivy the indentation binding might be set before the tree node's data has been added,
        // which means that we'll miss the first render. We have to subscribe to changes in the
        // data to ensure that everything is up to date.
        _treeNode._dataChanges.subscribe(function () { return _this._setPadding(); });
    }
    Object.defineProperty(CdkTreeNodePadding.prototype, "level", {
        /** The level of depth of the tree node. The padding will be `level * indent` pixels. */
        get: function () { return this._level; },
        set: function (value) {
            // Set to null as the fallback value so that _setPadding can fall back to the node level if the
            // consumer set the directive as `cdkTreeNodePadding=""`. We still want to take this value if
            // they set 0 explicitly.
            this._level = coerceNumberProperty(value, null);
            this._setPadding();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkTreeNodePadding.prototype, "indent", {
        /**
         * The indent for each level. Can be a number or a CSS string.
         * Default number 40px from material design menu sub-menu spec.
         */
        get: function () { return this._indent; },
        set: function (indent) {
            var value = indent;
            var units = 'px';
            if (typeof indent === 'string') {
                var parts = indent.split(cssUnitPattern);
                value = parts[0];
                units = parts[1] || units;
            }
            this.indentUnits = units;
            this._indent = coerceNumberProperty(value);
            this._setPadding();
        },
        enumerable: true,
        configurable: true
    });
    CdkTreeNodePadding.prototype.ngOnDestroy = function () {
        this._destroyed.next();
        this._destroyed.complete();
    };
    /** The padding indent value for the tree node. Returns a string with px numbers if not null. */
    CdkTreeNodePadding.prototype._paddingIndent = function () {
        var nodeLevel = (this._treeNode.data && this._tree.treeControl.getLevel)
            ? this._tree.treeControl.getLevel(this._treeNode.data)
            : null;
        var level = this._level == null ? nodeLevel : this._level;
        return typeof level === 'number' ? "" + level * this._indent + this.indentUnits : null;
    };
    CdkTreeNodePadding.prototype._setPadding = function (forceChange) {
        if (forceChange === void 0) { forceChange = false; }
        var padding = this._paddingIndent();
        if (padding !== this._currentPadding || forceChange) {
            var element = this._element.nativeElement;
            var paddingProp = this._dir && this._dir.value === 'rtl' ? 'paddingRight' : 'paddingLeft';
            var resetProp = paddingProp === 'paddingLeft' ? 'paddingRight' : 'paddingLeft';
            this._renderer.setStyle(element, paddingProp, padding);
            this._renderer.setStyle(element, resetProp, null);
            this._currentPadding = padding;
        }
    };
    CdkTreeNodePadding.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkTreeNodePadding]',
                },] }
    ];
    /** @nocollapse */
    CdkTreeNodePadding.ctorParameters = function () { return [
        { type: CdkTreeNode },
        { type: CdkTree },
        { type: Renderer2 },
        { type: ElementRef },
        { type: Directionality, decorators: [{ type: Optional }] }
    ]; };
    CdkTreeNodePadding.propDecorators = {
        level: [{ type: Input, args: ['cdkTreeNodePadding',] }],
        indent: [{ type: Input, args: ['cdkTreeNodePaddingIndent',] }]
    };
    return CdkTreeNodePadding;
}());
export { CdkTreeNodePadding };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQWMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUU1QyxxREFBcUQ7QUFDckQsSUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBRXZDOzs7R0FHRztBQUNIO0lBK0NFLDRCQUFvQixTQUF5QixFQUN6QixLQUFpQixFQUNqQixTQUFvQixFQUNwQixRQUFpQyxFQUNyQixJQUFvQjtRQUpwRCxpQkFjQztRQWRtQixjQUFTLEdBQVQsU0FBUyxDQUFnQjtRQUN6QixVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ2pCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDcEIsYUFBUSxHQUFSLFFBQVEsQ0FBeUI7UUFDckIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7UUE1Q3BELGdFQUFnRTtRQUN4RCxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUV6QyxnREFBZ0Q7UUFDaEQsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFrQ25CLFlBQU8sR0FBVyxFQUFFLENBQUM7UUFPbkIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLElBQUksSUFBSSxFQUFF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QUM1QyxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDNUYsSUFBTSxTQUFTLEdBQUcsV0FBVyxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDakYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQzs7Z0JBeEZGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsc0JBQXNCO2lCQUNqQzs7OztnQkFYZ0IsV0FBVztnQkFBcEIsT0FBTztnQkFINEMsU0FBUztnQkFBakQsVUFBVTtnQkFGckIsY0FBYyx1QkFpRVAsUUFBUTs7O3dCQXJDcEIsS0FBSyxTQUFDLG9CQUFvQjt5QkFlMUIsS0FBSyxTQUFDLDBCQUEwQjs7SUE4RG5DLHlCQUFDO0NBQUEsQUEzRkQsSUEyRkM7U0F4Rlksa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlTnVtYmVyUHJvcGVydHksIE51bWJlcklucHV0fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0LCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBSZW5kZXJlcjJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuXG4vKiogUmVnZXggdXNlZCB0byBzcGxpdCBhIHN0cmluZyBvbiBpdHMgQ1NTIHVuaXRzLiAqL1xuY29uc3QgY3NzVW5pdFBhdHRlcm4gPSAvKFtBLVphLXolXSspJC87XG5cbi8qKlxuICogSW5kZW50IGZvciB0aGUgY2hpbGRyZW4gdHJlZSBkYXRhTm9kZXMuXG4gKiBUaGlzIGRpcmVjdGl2ZSB3aWxsIGFkZCBsZWZ0LXBhZGRpbmcgdG8gdGhlIG5vZGUgdG8gc2hvdyBoaWVyYXJjaHkuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtUcmVlTm9kZVBhZGRpbmddJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGVQYWRkaW5nPFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEN1cnJlbnQgcGFkZGluZyB2YWx1ZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LiBVc2VkIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgaGl0dGluZyB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9jdXJyZW50UGFkZGluZzogc3RyaW5nfG51bGw7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBDU1MgdW5pdHMgdXNlZCBmb3IgdGhlIGluZGVudGF0aW9uIHZhbHVlLiAqL1xuICBpbmRlbnRVbml0cyA9ICdweCc7XG5cbiAgLyoqIFRoZSBsZXZlbCBvZiBkZXB0aCBvZiB0aGUgdHJlZSBub2RlLiBUaGUgcGFkZGluZyB3aWxsIGJlIGBsZXZlbCAqIGluZGVudGAgcGl4ZWxzLiAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlUGFkZGluZycpXG4gIGdldCBsZXZlbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbGV2ZWw7IH1cbiAgc2V0IGxldmVsKHZhbHVlOiBudW1iZXIpIHtcbiAgICAvLyBTZXQgdG8gbnVsbCBhcyB0aGUgZmFsbGJhY2sgdmFsdWUgc28gdGhhdCBfc2V0UGFkZGluZyBjYW4gZmFsbCBiYWNrIHRvIHRoZSBub2RlIGxldmVsIGlmIHRoZVxuICAgIC8vIGNvbnN1bWVyIHNldCB0aGUgZGlyZWN0aXZlIGFzIGBjZGtUcmVlTm9kZVBhZGRpbmc9XCJcImAuIFdlIHN0aWxsIHdhbnQgdG8gdGFrZSB0aGlzIHZhbHVlIGlmXG4gICAgLy8gdGhleSBzZXQgMCBleHBsaWNpdGx5LlxuICAgIHRoaXMuX2xldmVsID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUsIG51bGwpITtcbiAgICB0aGlzLl9zZXRQYWRkaW5nKCk7XG4gIH1cbiAgX2xldmVsOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRlbnQgZm9yIGVhY2ggbGV2ZWwuIENhbiBiZSBhIG51bWJlciBvciBhIENTUyBzdHJpbmcuXG4gICAqIERlZmF1bHQgbnVtYmVyIDQwcHggZnJvbSBtYXRlcmlhbCBkZXNpZ24gbWVudSBzdWItbWVudSBzcGVjLlxuICAgKi9cbiAgQElucHV0KCdjZGtUcmVlTm9kZVBhZGRpbmdJbmRlbnQnKVxuICBnZXQgaW5kZW50KCk6IG51bWJlciB8IHN0cmluZyB7IHJldHVybiB0aGlzLl9pbmRlbnQ7IH1cbiAgc2V0IGluZGVudChpbmRlbnQ6IG51bWJlciB8IHN0cmluZykge1xuICAgIGxldCB2YWx1ZSA9IGluZGVudDtcbiAgICBsZXQgdW5pdHMgPSAncHgnO1xuXG4gICAgaWYgKHR5cGVvZiBpbmRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGluZGVudC5zcGxpdChjc3NVbml0UGF0dGVybik7XG4gICAgICB2YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgdW5pdHMgPSBwYXJ0c1sxXSB8fCB1bml0cztcbiAgICB9XG5cbiAgICB0aGlzLmluZGVudFVuaXRzID0gdW5pdHM7XG4gICAgdGhpcy5faW5kZW50ID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgfVxuICBfaW5kZW50OiBudW1iZXIgPSA0MDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF90cmVlTm9kZTogQ2RrVHJlZU5vZGU8VD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3RyZWU6IENka1RyZWU8VD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2VsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5KSB7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICAgIGlmIChfZGlyKSB7XG4gICAgICBfZGlyLmNoYW5nZS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2V0UGFkZGluZyh0cnVlKSk7XG4gICAgfVxuXG4gICAgLy8gSW4gSXZ5IHRoZSBpbmRlbnRhdGlvbiBiaW5kaW5nIG1pZ2h0IGJlIHNldCBiZWZvcmUgdGhlIHRyZWUgbm9kZSdzIGRhdGEgaGFzIGJlZW4gYWRkZWQsXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhhdCB3ZSdsbCBtaXNzIHRoZSBmaXJzdCByZW5kZXIuIFdlIGhhdmUgdG8gc3Vic2NyaWJlIHRvIGNoYW5nZXMgaW4gdGhlXG4gICAgLy8gZGF0YSB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIHVwIHRvIGRhdGUuXG4gICAgX3RyZWVOb2RlLl9kYXRhQ2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2V0UGFkZGluZygpKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogVGhlIHBhZGRpbmcgaW5kZW50IHZhbHVlIGZvciB0aGUgdHJlZSBub2RlLiBSZXR1cm5zIGEgc3RyaW5nIHdpdGggcHggbnVtYmVycyBpZiBub3QgbnVsbC4gKi9cbiAgX3BhZGRpbmdJbmRlbnQoKTogc3RyaW5nfG51bGwge1xuICAgIGNvbnN0IG5vZGVMZXZlbCA9ICh0aGlzLl90cmVlTm9kZS5kYXRhICYmIHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0TGV2ZWwpXG4gICAgICA/IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0TGV2ZWwodGhpcy5fdHJlZU5vZGUuZGF0YSlcbiAgICAgIDogbnVsbDtcbiAgICBjb25zdCBsZXZlbCA9IHRoaXMuX2xldmVsID09IG51bGwgPyBub2RlTGV2ZWwgOiB0aGlzLl9sZXZlbDtcbiAgICByZXR1cm4gdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyA/IGAke2xldmVsICogdGhpcy5faW5kZW50fSR7dGhpcy5pbmRlbnRVbml0c31gIDogbnVsbDtcbiAgfVxuXG4gIF9zZXRQYWRkaW5nKGZvcmNlQ2hhbmdlID0gZmFsc2UpIHtcbiAgICBjb25zdCBwYWRkaW5nID0gdGhpcy5fcGFkZGluZ0luZGVudCgpO1xuXG4gICAgaWYgKHBhZGRpbmcgIT09IHRoaXMuX2N1cnJlbnRQYWRkaW5nIHx8IGZvcmNlQ2hhbmdlKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgICAgY29uc3QgcGFkZGluZ1Byb3AgPSB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJyA/ICdwYWRkaW5nUmlnaHQnIDogJ3BhZGRpbmdMZWZ0JztcbiAgICAgIGNvbnN0IHJlc2V0UHJvcCA9IHBhZGRpbmdQcm9wID09PSAncGFkZGluZ0xlZnQnID8gJ3BhZGRpbmdSaWdodCcgOiAncGFkZGluZ0xlZnQnO1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoZWxlbWVudCwgcGFkZGluZ1Byb3AsIHBhZGRpbmcpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoZWxlbWVudCwgcmVzZXRQcm9wLCBudWxsKTtcbiAgICAgIHRoaXMuX2N1cnJlbnRQYWRkaW5nID0gcGFkZGluZztcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbGV2ZWw6IE51bWJlcklucHV0O1xufVxuIl19