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
export class CdkTreeNodePadding {
    /**
     * @param {?} _treeNode
     * @param {?} _tree
     * @param {?} _renderer
     * @param {?} _element
     * @param {?} _dir
     */
    constructor(_treeNode, _tree, _renderer, _element, _dir) {
        this._treeNode = _treeNode;
        this._tree = _tree;
        this._renderer = _renderer;
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
            this._renderer.setStyle(element, paddingProp, padding);
            this._renderer.setStyle(element, resetProp, null);
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
    CdkTreeNodePadding.prototype._renderer;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQWMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7TUFHdEMsY0FBYyxHQUFHLGVBQWU7Ozs7OztBQVN0QyxNQUFNLE9BQU8sa0JBQWtCOzs7Ozs7OztJQTRDN0IsWUFBb0IsU0FBeUIsRUFDekIsS0FBaUIsRUFDakIsU0FBb0IsRUFDcEIsUUFBaUMsRUFDckIsSUFBb0I7UUFKaEMsY0FBUyxHQUFULFNBQVMsQ0FBZ0I7UUFDekIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUNqQixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQ3BCLGFBQVEsR0FBUixRQUFRLENBQXlCO1FBQ3JCLFNBQUksR0FBSixJQUFJLENBQWdCOzs7O1FBM0M1QyxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQzs7OztRQUd6QyxnQkFBVyxHQUFHLElBQUksQ0FBQztRQWtDbkIsWUFBTyxHQUFXLEVBQUUsQ0FBQztRQU9uQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFB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LENBQUMsQ0FBQyxDQUFDLGFBQWE7WUFDaEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQzs7O1lBeEZGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsc0JBQXNCO2FBQ2pDOzs7O1lBWGdCLFdBQVc7WUFBcEIsT0FBTztZQUg0QyxTQUFTO1lBQWpELFVBQVU7WUFGckIsY0FBYyx1QkFpRVAsUUFBUTs7O29CQXJDcEIsS0FBSyxTQUFDLG9CQUFvQjtxQkFlMUIsS0FBSyxTQUFDLDBCQUEwQjs7OztJQTZEakMsMkNBQTRDOzs7Ozs7SUFyRjVDLDZDQUFxQzs7Ozs7O0lBR3JDLHdDQUF5Qzs7Ozs7SUFHekMseUNBQW1COztJQVluQixvQ0FBZTs7SUFzQmYscUNBQXFCOzs7OztJQUVULHVDQUFpQzs7Ozs7SUFDakMsbUNBQXlCOzs7OztJQUN6Qix1Q0FBNEI7Ozs7O0lBQzVCLHNDQUF5Qzs7Ozs7SUFDekMsa0NBQXdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlTnVtYmVyUHJvcGVydHksIE51bWJlcklucHV0fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIElucHV0LCBPbkRlc3Ryb3ksIE9wdGlvbmFsLCBSZW5kZXJlcjJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuXG4vKiogUmVnZXggdXNlZCB0byBzcGxpdCBhIHN0cmluZyBvbiBpdHMgQ1NTIHVuaXRzLiAqL1xuY29uc3QgY3NzVW5pdFBhdHRlcm4gPSAvKFtBLVphLXolXSspJC87XG5cbi8qKlxuICogSW5kZW50IGZvciB0aGUgY2hpbGRyZW4gdHJlZSBkYXRhTm9kZXMuXG4gKiBUaGlzIGRpcmVjdGl2ZSB3aWxsIGFkZCBsZWZ0LXBhZGRpbmcgdG8gdGhlIG5vZGUgdG8gc2hvdyBoaWVyYXJjaHkuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtUcmVlTm9kZVBhZGRpbmddJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGVQYWRkaW5nPFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEN1cnJlbnQgcGFkZGluZyB2YWx1ZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LiBVc2VkIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgaGl0dGluZyB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9jdXJyZW50UGFkZGluZzogc3RyaW5nfG51bGw7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBDU1MgdW5pdHMgdXNlZCBmb3IgdGhlIGluZGVudGF0aW9uIHZhbHVlLiAqL1xuICBpbmRlbnRVbml0cyA9ICdweCc7XG5cbiAgLyoqIFRoZSBsZXZlbCBvZiBkZXB0aCBvZiB0aGUgdHJlZSBub2RlLiBUaGUgcGFkZGluZyB3aWxsIGJlIGBsZXZlbCAqIGluZGVudGAgcGl4ZWxzLiAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlUGFkZGluZycpXG4gIGdldCBsZXZlbCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbGV2ZWw7IH1cbiAgc2V0IGxldmVsKHZhbHVlOiBudW1iZXIpIHtcbiAgICAvLyBTZXQgdG8gbnVsbCBhcyB0aGUgZmFsbGJhY2sgdmFsdWUgc28gdGhhdCBfc2V0UGFkZGluZyBjYW4gZmFsbCBiYWNrIHRvIHRoZSBub2RlIGxldmVsIGlmIHRoZVxuICAgIC8vIGNvbnN1bWVyIHNldCB0aGUgZGlyZWN0aXZlIGFzIGBjZGtUcmVlTm9kZVBhZGRpbmc9XCJcImAuIFdlIHN0aWxsIHdhbnQgdG8gdGFrZSB0aGlzIHZhbHVlIGlmXG4gICAgLy8gdGhleSBzZXQgMCBleHBsaWNpdGx5LlxuICAgIHRoaXMuX2xldmVsID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUsIG51bGwpITtcbiAgICB0aGlzLl9zZXRQYWRkaW5nKCk7XG4gIH1cbiAgX2xldmVsOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRlbnQgZm9yIGVhY2ggbGV2ZWwuIENhbiBiZSBhIG51bWJlciBvciBhIENTUyBzdHJpbmcuXG4gICAqIERlZmF1bHQgbnVtYmVyIDQwcHggZnJvbSBtYXRlcmlhbCBkZXNpZ24gbWVudSBzdWItbWVudSBzcGVjLlxuICAgKi9cbiAgQElucHV0KCdjZGtUcmVlTm9kZVBhZGRpbmdJbmRlbnQnKVxuICBnZXQgaW5kZW50KCk6IG51bWJlciB8IHN0cmluZyB7IHJldHVybiB0aGlzLl9pbmRlbnQ7IH1cbiAgc2V0IGluZGVudChpbmRlbnQ6IG51bWJlciB8IHN0cmluZykge1xuICAgIGxldCB2YWx1ZSA9IGluZGVudDtcbiAgICBsZXQgdW5pdHMgPSAncHgnO1xuXG4gICAgaWYgKHR5cGVvZiBpbmRlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGluZGVudC5zcGxpdChjc3NVbml0UGF0dGVybik7XG4gICAgICB2YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgdW5pdHMgPSBwYXJ0c1sxXSB8fCB1bml0cztcbiAgICB9XG5cbiAgICB0aGlzLmluZGVudFVuaXRzID0gdW5pdHM7XG4gICAgdGhpcy5faW5kZW50ID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgfVxuICBfaW5kZW50OiBudW1iZXIgPSA0MDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF90cmVlTm9kZTogQ2RrVHJlZU5vZGU8VD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3RyZWU6IENka1RyZWU8VD4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2VsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5KSB7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICAgIGlmIChfZGlyKSB7XG4gICAgICBfZGlyLmNoYW5nZS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2V0UGFkZGluZyh0cnVlKSk7XG4gICAgfVxuXG4gICAgLy8gSW4gSXZ5IHRoZSBpbmRlbnRhdGlvbiBiaW5kaW5nIG1pZ2h0IGJlIHNldCBiZWZvcmUgdGhlIHRyZWUgbm9kZSdzIGRhdGEgaGFzIGJlZW4gYWRkZWQsXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhhdCB3ZSdsbCBtaXNzIHRoZSBmaXJzdCByZW5kZXIuIFdlIGhhdmUgdG8gc3Vic2NyaWJlIHRvIGNoYW5nZXMgaW4gdGhlXG4gICAgLy8gZGF0YSB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIHVwIHRvIGRhdGUuXG4gICAgX3RyZWVOb2RlLl9kYXRhQ2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2V0UGFkZGluZygpKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogVGhlIHBhZGRpbmcgaW5kZW50IHZhbHVlIGZvciB0aGUgdHJlZSBub2RlLiBSZXR1cm5zIGEgc3RyaW5nIHdpdGggcHggbnVtYmVycyBpZiBub3QgbnVsbC4gKi9cbiAgX3BhZGRpbmdJbmRlbnQoKTogc3RyaW5nfG51bGwge1xuICAgIGNvbnN0IG5vZGVMZXZlbCA9ICh0aGlzLl90cmVlTm9kZS5kYXRhICYmIHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0TGV2ZWwpXG4gICAgICA/IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0TGV2ZWwodGhpcy5fdHJlZU5vZGUuZGF0YSlcbiAgICAgIDogbnVsbDtcbiAgICBjb25zdCBsZXZlbCA9IHRoaXMuX2xldmVsID09IG51bGwgPyBub2RlTGV2ZWwgOiB0aGlzLl9sZXZlbDtcbiAgICByZXR1cm4gdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyA/IGAke2xldmVsICogdGhpcy5faW5kZW50fSR7dGhpcy5pbmRlbnRVbml0c31gIDogbnVsbDtcbiAgfVxuXG4gIF9zZXRQYWRkaW5nKGZvcmNlQ2hhbmdlID0gZmFsc2UpIHtcbiAgICBjb25zdCBwYWRkaW5nID0gdGhpcy5fcGFkZGluZ0luZGVudCgpO1xuXG4gICAgaWYgKHBhZGRpbmcgIT09IHRoaXMuX2N1cnJlbnRQYWRkaW5nIHx8IGZvcmNlQ2hhbmdlKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgICAgY29uc3QgcGFkZGluZ1Byb3AgPSB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJyA/ICdwYWRkaW5nUmlnaHQnIDogJ3BhZGRpbmdMZWZ0JztcbiAgICAgIGNvbnN0IHJlc2V0UHJvcCA9IHBhZGRpbmdQcm9wID09PSAncGFkZGluZ0xlZnQnID8gJ3BhZGRpbmdSaWdodCcgOiAncGFkZGluZ0xlZnQnO1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoZWxlbWVudCwgcGFkZGluZ1Byb3AsIHBhZGRpbmcpO1xuICAgICAgdGhpcy5fcmVuZGVyZXIuc2V0U3R5bGUoZWxlbWVudCwgcmVzZXRQcm9wLCBudWxsKTtcbiAgICAgIHRoaXMuX2N1cnJlbnRQYWRkaW5nID0gcGFkZGluZztcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbGV2ZWw6IE51bWJlcklucHV0O1xufVxuIl19