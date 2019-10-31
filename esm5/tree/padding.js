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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUU1QyxxREFBcUQ7QUFDckQsSUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBRXZDOzs7R0FHRztBQUNIO0lBK0NFLDRCQUFvQixTQUF5QixFQUN6QixLQUFpQixFQUNqQixTQUFvQixFQUNwQixRQUFpQyxFQUNyQixJQUFvQjtRQUpwRCxpQkFjQztRQWRtQixjQUFTLEdBQVQsU0FBUyxDQUFnQjtRQUN6QixVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ2pCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDcEIsYUFBUSxHQUFSLFFBQVEsQ0FBeUI7UUFDckIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7UUE1Q3BELGdFQUFnRTtRQUN4RCxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUV6QyxnREFBZ0Q7UUFDaEQsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFrQ25CLFlBQU8sR0FBVyxFQUFFLENBQUM7UUFPbkIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLElBQUksSUFBSSxFQUFF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QUM1QyxJQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDNUYsSUFBTSxTQUFTLEdBQUcsV0FBVyxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDakYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQzs7Z0JBeEZGLFNBQVMsU0FBQztvQkFDVCxRQUFRLEVBQUUsc0JBQXNCO2lCQUNqQzs7OztnQkFYZ0IsV0FBVztnQkFBcEIsT0FBTztnQkFINEMsU0FBUztnQkFBakQsVUFBVTtnQkFGckIsY0FBYyx1QkFpRVAsUUFBUTs7O3dCQXJDcEIsS0FBSyxTQUFDLG9CQUFvQjt5QkFlMUIsS0FBSyxTQUFDLDBCQUEwQjs7SUE4RG5DLHlCQUFDO0NBQUEsQUEzRkQsSUEyRkM7U0F4Rlksa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlTnVtYmVyUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uRGVzdHJveSwgT3B0aW9uYWwsIFJlbmRlcmVyMn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5cbi8qKiBSZWdleCB1c2VkIHRvIHNwbGl0IGEgc3RyaW5nIG9uIGl0cyBDU1MgdW5pdHMuICovXG5jb25zdCBjc3NVbml0UGF0dGVybiA9IC8oW0EtWmEteiVdKykkLztcblxuLyoqXG4gKiBJbmRlbnQgZm9yIHRoZSBjaGlsZHJlbiB0cmVlIGRhdGFOb2Rlcy5cbiAqIFRoaXMgZGlyZWN0aXZlIHdpbGwgYWRkIGxlZnQtcGFkZGluZyB0byB0aGUgbm9kZSB0byBzaG93IGhpZXJhcmNoeS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1RyZWVOb2RlUGFkZGluZ10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZVBhZGRpbmc8VD4gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogQ3VycmVudCBwYWRkaW5nIHZhbHVlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuIFVzZWQgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBoaXR0aW5nIHRoZSBET00uICovXG4gIHByaXZhdGUgX2N1cnJlbnRQYWRkaW5nOiBzdHJpbmd8bnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIENTUyB1bml0cyB1c2VkIGZvciB0aGUgaW5kZW50YXRpb24gdmFsdWUuICovXG4gIGluZGVudFVuaXRzID0gJ3B4JztcblxuICAvKiogVGhlIGxldmVsIG9mIGRlcHRoIG9mIHRoZSB0cmVlIG5vZGUuIFRoZSBwYWRkaW5nIHdpbGwgYmUgYGxldmVsICogaW5kZW50YCBwaXhlbHMuICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVQYWRkaW5nJylcbiAgZ2V0IGxldmVsKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9sZXZlbDsgfVxuICBzZXQgbGV2ZWwodmFsdWU6IG51bWJlcikge1xuICAgIC8vIFNldCB0byBudWxsIGFzIHRoZSBmYWxsYmFjayB2YWx1ZSBzbyB0aGF0IF9zZXRQYWRkaW5nIGNhbiBmYWxsIGJhY2sgdG8gdGhlIG5vZGUgbGV2ZWwgaWYgdGhlXG4gICAgLy8gY29uc3VtZXIgc2V0IHRoZSBkaXJlY3RpdmUgYXMgYGNka1RyZWVOb2RlUGFkZGluZz1cIlwiYC4gV2Ugc3RpbGwgd2FudCB0byB0YWtlIHRoaXMgdmFsdWUgaWZcbiAgICAvLyB0aGV5IHNldCAwIGV4cGxpY2l0bHkuXG4gICAgdGhpcy5fbGV2ZWwgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSwgbnVsbCkhO1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgfVxuICBfbGV2ZWw6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGVudCBmb3IgZWFjaCBsZXZlbC4gQ2FuIGJlIGEgbnVtYmVyIG9yIGEgQ1NTIHN0cmluZy5cbiAgICogRGVmYXVsdCBudW1iZXIgNDBweCBmcm9tIG1hdGVyaWFsIGRlc2lnbiBtZW51IHN1Yi1tZW51IHNwZWMuXG4gICAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlUGFkZGluZ0luZGVudCcpXG4gIGdldCBpbmRlbnQoKTogbnVtYmVyIHwgc3RyaW5nIHsgcmV0dXJuIHRoaXMuX2luZGVudDsgfVxuICBzZXQgaW5kZW50KGluZGVudDogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IHZhbHVlID0gaW5kZW50O1xuICAgIGxldCB1bml0cyA9ICdweCc7XG5cbiAgICBpZiAodHlwZW9mIGluZGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHBhcnRzID0gaW5kZW50LnNwbGl0KGNzc1VuaXRQYXR0ZXJuKTtcbiAgICAgIHZhbHVlID0gcGFydHNbMF07XG4gICAgICB1bml0cyA9IHBhcnRzWzFdIHx8IHVuaXRzO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZW50VW5pdHMgPSB1bml0cztcbiAgICB0aGlzLl9pbmRlbnQgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICB9XG4gIF9pbmRlbnQ6IG51bWJlciA9IDQwO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3RyZWVOb2RlOiBDZGtUcmVlTm9kZTxUPixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfdHJlZTogQ2RrVHJlZTxUPixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHkpIHtcbiAgICB0aGlzLl9zZXRQYWRkaW5nKCk7XG4gICAgaWYgKF9kaXIpIHtcbiAgICAgIF9kaXIuY2hhbmdlLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zZXRQYWRkaW5nKHRydWUpKTtcbiAgICB9XG5cbiAgICAvLyBJbiBJdnkgdGhlIGluZGVudGF0aW9uIGJpbmRpbmcgbWlnaHQgYmUgc2V0IGJlZm9yZSB0aGUgdHJlZSBub2RlJ3MgZGF0YSBoYXMgYmVlbiBhZGRlZCxcbiAgICAvLyB3aGljaCBtZWFucyB0aGF0IHdlJ2xsIG1pc3MgdGhlIGZpcnN0IHJlbmRlci4gV2UgaGF2ZSB0byBzdWJzY3JpYmUgdG8gY2hhbmdlcyBpbiB0aGVcbiAgICAvLyBkYXRhIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgdXAgdG8gZGF0ZS5cbiAgICBfdHJlZU5vZGUuX2RhdGFDaGFuZ2VzLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zZXRQYWRkaW5nKCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBUaGUgcGFkZGluZyBpbmRlbnQgdmFsdWUgZm9yIHRoZSB0cmVlIG5vZGUuIFJldHVybnMgYSBzdHJpbmcgd2l0aCBweCBudW1iZXJzIGlmIG5vdCBudWxsLiAqL1xuICBfcGFkZGluZ0luZGVudCgpOiBzdHJpbmd8bnVsbCB7XG4gICAgY29uc3Qgbm9kZUxldmVsID0gKHRoaXMuX3RyZWVOb2RlLmRhdGEgJiYgdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRMZXZlbClcbiAgICAgID8gdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRMZXZlbCh0aGlzLl90cmVlTm9kZS5kYXRhKVxuICAgICAgOiBudWxsO1xuICAgIGNvbnN0IGxldmVsID0gdGhpcy5fbGV2ZWwgPT0gbnVsbCA/IG5vZGVMZXZlbCA6IHRoaXMuX2xldmVsO1xuICAgIHJldHVybiB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInID8gYCR7bGV2ZWwgKiB0aGlzLl9pbmRlbnR9JHt0aGlzLmluZGVudFVuaXRzfWAgOiBudWxsO1xuICB9XG5cbiAgX3NldFBhZGRpbmcoZm9yY2VDaGFuZ2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IHBhZGRpbmcgPSB0aGlzLl9wYWRkaW5nSW5kZW50KCk7XG5cbiAgICBpZiAocGFkZGluZyAhPT0gdGhpcy5fY3VycmVudFBhZGRpbmcgfHwgZm9yY2VDaGFuZ2UpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBjb25zdCBwYWRkaW5nUHJvcCA9IHRoaXMuX2RpciAmJiB0aGlzLl9kaXIudmFsdWUgPT09ICdydGwnID8gJ3BhZGRpbmdSaWdodCcgOiAncGFkZGluZ0xlZnQnO1xuICAgICAgY29uc3QgcmVzZXRQcm9wID0gcGFkZGluZ1Byb3AgPT09ICdwYWRkaW5nTGVmdCcgPyAncGFkZGluZ1JpZ2h0JyA6ICdwYWRkaW5nTGVmdCc7XG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShlbGVtZW50LCBwYWRkaW5nUHJvcCwgcGFkZGluZyk7XG4gICAgICB0aGlzLl9yZW5kZXJlci5zZXRTdHlsZShlbGVtZW50LCByZXNldFByb3AsIG51bGwpO1xuICAgICAgdGhpcy5fY3VycmVudFBhZGRpbmcgPSBwYWRkaW5nO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9sZXZlbDogbnVtYmVyIHwgc3RyaW5nO1xufVxuIl19