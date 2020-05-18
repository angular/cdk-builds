/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/tree/padding.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * Regex used to split a string on its CSS units.
 * @type {?}
 */
const cssUnitPattern = /([A-Za-z%]+)$/;
/**
 * Indent for the children tree dataNodes.
 * This directive will add left-padding to the node to show hierarchy.
 * @template T
 */
let CdkTreeNodePadding = /** @class */ (() => {
    /**
     * Indent for the children tree dataNodes.
     * This directive will add left-padding to the node to show hierarchy.
     * @template T
     */
    class CdkTreeNodePadding {
        /**
         * @param {?} _treeNode
         * @param {?} _tree
         * @param {?} _renderer
         * @param {?} _element
         * @param {?} _dir
         */
        constructor(_treeNode, _tree, 
        /**
         * @deprecated _renderer parameter no longer being used. To be removed.
         * @breaking-change 11.0.0
         */
        _renderer, _element, _dir) {
            this._treeNode = _treeNode;
            this._tree = _tree;
            this._element = _element;
            this._dir = _dir;
            /**
             * Subject that emits when the component has been destroyed.
             */
            this._destroyed = new Subject();
            /**
             * CSS units used for the indentation value.
             */
            this.indentUnits = 'px';
            this._indent = 40;
            this._setPadding();
            if (_dir) {
                _dir.change.pipe(takeUntil(this._destroyed)).subscribe((/**
                 * @return {?}
                 */
                () => this._setPadding(true)));
            }
            // In Ivy the indentation binding might be set before the tree node's data has been added,
            // which means that we'll miss the first render. We have to subscribe to changes in the
            // data to ensure that everything is up to date.
            _treeNode._dataChanges.subscribe((/**
             * @return {?}
             */
            () => this._setPadding()));
        }
        /**
         * The level of depth of the tree node. The padding will be `level * indent` pixels.
         * @return {?}
         */
        get level() { return this._level; }
        /**
         * @param {?} value
         * @return {?}
         */
        set level(value) {
            // Set to null as the fallback value so that _setPadding can fall back to the node level if the
            // consumer set the directive as `cdkTreeNodePadding=""`. We still want to take this value if
            // they set 0 explicitly.
            this._level = (/** @type {?} */ (coerceNumberProperty(value, null)));
            this._setPadding();
        }
        /**
         * The indent for each level. Can be a number or a CSS string.
         * Default number 40px from material design menu sub-menu spec.
         * @return {?}
         */
        get indent() { return this._indent; }
        /**
         * @param {?} indent
         * @return {?}
         */
        set indent(indent) {
            /** @type {?} */
            let value = indent;
            /** @type {?} */
            let units = 'px';
            if (typeof indent === 'string') {
                /** @type {?} */
                const parts = indent.split(cssUnitPattern);
                value = parts[0];
                units = parts[1] || units;
            }
            this.indentUnits = units;
            this._indent = coerceNumberProperty(value);
            this._setPadding();
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            this._destroyed.next();
            this._destroyed.complete();
        }
        /**
         * The padding indent value for the tree node. Returns a string with px numbers if not null.
         * @return {?}
         */
        _paddingIndent() {
            /** @type {?} */
            const nodeLevel = (this._treeNode.data && this._tree.treeControl.getLevel)
                ? this._tree.treeControl.getLevel(this._treeNode.data)
                : null;
            /** @type {?} */
            const level = this._level == null ? nodeLevel : this._level;
            return typeof level === 'number' ? `${level * this._indent}${this.indentUnits}` : null;
        }
        /**
         * @param {?=} forceChange
         * @return {?}
         */
        _setPadding(forceChange = false) {
            /** @type {?} */
            const padding = this._paddingIndent();
            if (padding !== this._currentPadding || forceChange) {
                /** @type {?} */
                const element = this._element.nativeElement;
                /** @type {?} */
                const paddingProp = this._dir && this._dir.value === 'rtl' ? 'paddingRight' : 'paddingLeft';
                /** @type {?} */
                const resetProp = paddingProp === 'paddingLeft' ? 'paddingRight' : 'paddingLeft';
                element.style[paddingProp] = padding || '';
                element.style[resetProp] = '';
                this._currentPadding = padding;
            }
        }
    }
    CdkTreeNodePadding.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkTreeNodePadding]',
                },] }
    ];
    /** @nocollapse */
    CdkTreeNodePadding.ctorParameters = () => [
        { type: CdkTreeNode },
        { type: CdkTree },
        { type: Renderer2 },
        { type: ElementRef },
        { type: Directionality, decorators: [{ type: Optional }] }
    ];
    CdkTreeNodePadding.propDecorators = {
        level: [{ type: Input, args: ['cdkTreeNodePadding',] }],
        indent: [{ type: Input, args: ['cdkTreeNodePaddingIndent',] }]
    };
    return CdkTreeNodePadding;
})();
export { CdkTreeNodePadding };
if (false) {
    /** @type {?} */
    CdkTreeNodePadding.ngAcceptInputType_level;
    /**
     * Current padding value applied to the element. Used to avoid unnecessarily hitting the DOM.
     * @type {?}
     * @private
     */
    CdkTreeNodePadding.prototype._currentPadding;
    /**
     * Subject that emits when the component has been destroyed.
     * @type {?}
     * @private
     */
    CdkTreeNodePadding.prototype._destroyed;
    /**
     * CSS units used for the indentation value.
     * @type {?}
     */
    CdkTreeNodePadding.prototype.indentUnits;
    /** @type {?} */
    CdkTreeNodePadding.prototype._level;
    /** @type {?} */
    CdkTreeNodePadding.prototype._indent;
    /**
     * @type {?}
     * @private
     */
    CdkTreeNodePadding.prototype._treeNode;
    /**
     * @type {?}
     * @private
     */
    CdkTreeNodePadding.prototype._tree;
    /**
     * @type {?}
     * @private
     */
    CdkTreeNodePadding.prototype._element;
    /**
     * @type {?}
     * @private
     */
    CdkTreeNodePadding.prototype._dir;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQWMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7TUFHdEMsY0FBYyxHQUFHLGVBQWU7Ozs7OztBQU10Qzs7Ozs7O0lBQUEsTUFHYSxrQkFBa0I7Ozs7Ozs7O1FBNEM3QixZQUFvQixTQUF5QixFQUN6QixLQUFpQjtRQUN6Qjs7O1dBR0c7UUFDSCxTQUFvQixFQUNaLFFBQWlDLEVBQ3JCLElBQW9CO1lBUmhDLGNBQVMsR0FBVCxTQUFTLENBQWdCO1lBQ3pCLFVBQUssR0FBTCxLQUFLLENBQVk7WUFNakIsYUFBUSxHQUFSLFFBQVEsQ0FBeUI7WUFDckIsU0FBSSxHQUFKLElBQUksQ0FBZ0I7Ozs7WUEvQzVDLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDOzs7O1lBR3pDLGdCQUFXLEdBQUcsSUFBSSxDQUFDO1lBa0NuQixZQUFPLEdBQVcsRUFBRSxDQUFDO1lBV25CLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLElBQUksRUFBRTtnQkFDUixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVB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YyxDQUFDLENBQUMsQ0FBQyxhQUFhO2dCQUNoRixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQzNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQzthQUNoQztRQUNILENBQUM7OztnQkE1RkYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxzQkFBc0I7aUJBQ2pDOzs7O2dCQVhnQixXQUFXO2dCQUFwQixPQUFPO2dCQUg0QyxTQUFTO2dCQUFqRCxVQUFVO2dCQUZyQixjQUFjLHVCQXFFUCxRQUFROzs7d0JBekNwQixLQUFLLFNBQUMsb0JBQW9CO3lCQWUxQixLQUFLLFNBQUMsMEJBQTBCOztJQWtFbkMseUJBQUM7S0FBQTtTQTVGWSxrQkFBa0I7OztJQTJGN0IsMkNBQTRDOzs7Ozs7SUF6RjVDLDZDQUFxQzs7Ozs7O0lBR3JDLHdDQUF5Qzs7Ozs7SUFHekMseUNBQW1COztJQVluQixvQ0FBZTs7SUFzQmYscUNBQXFCOzs7OztJQUVULHVDQUFpQzs7Ozs7SUFDakMsbUNBQXlCOzs7OztJQU16QixzQ0FBeUM7Ozs7O0lBQ3pDLGtDQUF3QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZU51bWJlclByb3BlcnR5LCBOdW1iZXJJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCwgT25EZXN0cm95LCBPcHRpb25hbCwgUmVuZGVyZXIyfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1N1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtDZGtUcmVlLCBDZGtUcmVlTm9kZX0gZnJvbSAnLi90cmVlJztcblxuLyoqIFJlZ2V4IHVzZWQgdG8gc3BsaXQgYSBzdHJpbmcgb24gaXRzIENTUyB1bml0cy4gKi9cbmNvbnN0IGNzc1VuaXRQYXR0ZXJuID0gLyhbQS1aYS16JV0rKSQvO1xuXG4vKipcbiAqIEluZGVudCBmb3IgdGhlIGNoaWxkcmVuIHRyZWUgZGF0YU5vZGVzLlxuICogVGhpcyBkaXJlY3RpdmUgd2lsbCBhZGQgbGVmdC1wYWRkaW5nIHRvIHRoZSBub2RlIHRvIHNob3cgaGllcmFyY2h5LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVHJlZU5vZGVQYWRkaW5nXScsXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlUGFkZGluZzxUPiBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBDdXJyZW50IHBhZGRpbmcgdmFsdWUgYXBwbGllZCB0byB0aGUgZWxlbWVudC4gVXNlZCB0byBhdm9pZCB1bm5lY2Vzc2FyaWx5IGhpdHRpbmcgdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfY3VycmVudFBhZGRpbmc6IHN0cmluZ3xudWxsO1xuXG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogQ1NTIHVuaXRzIHVzZWQgZm9yIHRoZSBpbmRlbnRhdGlvbiB2YWx1ZS4gKi9cbiAgaW5kZW50VW5pdHMgPSAncHgnO1xuXG4gIC8qKiBUaGUgbGV2ZWwgb2YgZGVwdGggb2YgdGhlIHRyZWUgbm9kZS4gVGhlIHBhZGRpbmcgd2lsbCBiZSBgbGV2ZWwgKiBpbmRlbnRgIHBpeGVscy4gKi9cbiAgQElucHV0KCdjZGtUcmVlTm9kZVBhZGRpbmcnKVxuICBnZXQgbGV2ZWwoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2xldmVsOyB9XG4gIHNldCBsZXZlbCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgLy8gU2V0IHRvIG51bGwgYXMgdGhlIGZhbGxiYWNrIHZhbHVlIHNvIHRoYXQgX3NldFBhZGRpbmcgY2FuIGZhbGwgYmFjayB0byB0aGUgbm9kZSBsZXZlbCBpZiB0aGVcbiAgICAvLyBjb25zdW1lciBzZXQgdGhlIGRpcmVjdGl2ZSBhcyBgY2RrVHJlZU5vZGVQYWRkaW5nPVwiXCJgLiBXZSBzdGlsbCB3YW50IHRvIHRha2UgdGhpcyB2YWx1ZSBpZlxuICAgIC8vIHRoZXkgc2V0IDAgZXhwbGljaXRseS5cbiAgICB0aGlzLl9sZXZlbCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlLCBudWxsKSE7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICB9XG4gIF9sZXZlbDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZW50IGZvciBlYWNoIGxldmVsLiBDYW4gYmUgYSBudW1iZXIgb3IgYSBDU1Mgc3RyaW5nLlxuICAgKiBEZWZhdWx0IG51bWJlciA0MHB4IGZyb20gbWF0ZXJpYWwgZGVzaWduIG1lbnUgc3ViLW1lbnUgc3BlYy5cbiAgICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVQYWRkaW5nSW5kZW50JylcbiAgZ2V0IGluZGVudCgpOiBudW1iZXIgfCBzdHJpbmcgeyByZXR1cm4gdGhpcy5faW5kZW50OyB9XG4gIHNldCBpbmRlbnQoaW5kZW50OiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICBsZXQgdmFsdWUgPSBpbmRlbnQ7XG4gICAgbGV0IHVuaXRzID0gJ3B4JztcblxuICAgIGlmICh0eXBlb2YgaW5kZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgcGFydHMgPSBpbmRlbnQuc3BsaXQoY3NzVW5pdFBhdHRlcm4pO1xuICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgIHVuaXRzID0gcGFydHNbMV0gfHwgdW5pdHM7XG4gICAgfVxuXG4gICAgdGhpcy5pbmRlbnRVbml0cyA9IHVuaXRzO1xuICAgIHRoaXMuX2luZGVudCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlKTtcbiAgICB0aGlzLl9zZXRQYWRkaW5nKCk7XG4gIH1cbiAgX2luZGVudDogbnVtYmVyID0gNDA7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfdHJlZU5vZGU6IENka1RyZWVOb2RlPFQ+LFxuICAgICAgICAgICAgICBwcml2YXRlIF90cmVlOiBDZGtUcmVlPFQ+LFxuICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICogQGRlcHJlY2F0ZWQgX3JlbmRlcmVyIHBhcmFtZXRlciBubyBsb25nZXIgYmVpbmcgdXNlZC4gVG8gYmUgcmVtb3ZlZC5cbiAgICAgICAgICAgICAgICogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjBcbiAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgIF9yZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9lbGVtZW50OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSkge1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgICBpZiAoX2Rpcikge1xuICAgICAgX2Rpci5jaGFuZ2UucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3NldFBhZGRpbmcodHJ1ZSkpO1xuICAgIH1cblxuICAgIC8vIEluIEl2eSB0aGUgaW5kZW50YXRpb24gYmluZGluZyBtaWdodCBiZSBzZXQgYmVmb3JlIHRoZSB0cmVlIG5vZGUncyBkYXRhIGhhcyBiZWVuIGFkZGVkLFxuICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgd2UnbGwgbWlzcyB0aGUgZmlyc3QgcmVuZGVyLiBXZSBoYXZlIHRvIHN1YnNjcmliZSB0byBjaGFuZ2VzIGluIHRoZVxuICAgIC8vIGRhdGEgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyB1cCB0byBkYXRlLlxuICAgIF90cmVlTm9kZS5fZGF0YUNoYW5nZXMuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3NldFBhZGRpbmcoKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFRoZSBwYWRkaW5nIGluZGVudCB2YWx1ZSBmb3IgdGhlIHRyZWUgbm9kZS4gUmV0dXJucyBhIHN0cmluZyB3aXRoIHB4IG51bWJlcnMgaWYgbm90IG51bGwuICovXG4gIF9wYWRkaW5nSW5kZW50KCk6IHN0cmluZ3xudWxsIHtcbiAgICBjb25zdCBub2RlTGV2ZWwgPSAodGhpcy5fdHJlZU5vZGUuZGF0YSAmJiB0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldExldmVsKVxuICAgICAgPyB0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldExldmVsKHRoaXMuX3RyZWVOb2RlLmRhdGEpXG4gICAgICA6IG51bGw7XG4gICAgY29uc3QgbGV2ZWwgPSB0aGlzLl9sZXZlbCA9PSBudWxsID8gbm9kZUxldmVsIDogdGhpcy5fbGV2ZWw7XG4gICAgcmV0dXJuIHR5cGVvZiBsZXZlbCA9PT0gJ251bWJlcicgPyBgJHtsZXZlbCAqIHRoaXMuX2luZGVudH0ke3RoaXMuaW5kZW50VW5pdHN9YCA6IG51bGw7XG4gIH1cblxuICBfc2V0UGFkZGluZyhmb3JjZUNoYW5nZSA9IGZhbHNlKSB7XG4gICAgY29uc3QgcGFkZGluZyA9IHRoaXMuX3BhZGRpbmdJbmRlbnQoKTtcblxuICAgIGlmIChwYWRkaW5nICE9PSB0aGlzLl9jdXJyZW50UGFkZGluZyB8fCBmb3JjZUNoYW5nZSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgICAgIGNvbnN0IHBhZGRpbmdQcm9wID0gdGhpcy5fZGlyICYmIHRoaXMuX2Rpci52YWx1ZSA9PT0gJ3J0bCcgPyAncGFkZGluZ1JpZ2h0JyA6ICdwYWRkaW5nTGVmdCc7XG4gICAgICBjb25zdCByZXNldFByb3AgPSBwYWRkaW5nUHJvcCA9PT0gJ3BhZGRpbmdMZWZ0JyA/ICdwYWRkaW5nUmlnaHQnIDogJ3BhZGRpbmdMZWZ0JztcbiAgICAgIGVsZW1lbnQuc3R5bGVbcGFkZGluZ1Byb3BdID0gcGFkZGluZyB8fCAnJztcbiAgICAgIGVsZW1lbnQuc3R5bGVbcmVzZXRQcm9wXSA9ICcnO1xuICAgICAgdGhpcy5fY3VycmVudFBhZGRpbmcgPSBwYWRkaW5nO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9sZXZlbDogTnVtYmVySW5wdXQ7XG59XG4iXX0=