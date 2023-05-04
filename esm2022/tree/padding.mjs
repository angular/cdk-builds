/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Directive, ElementRef, Input, Optional } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CdkTree, CdkTreeNode } from './tree';
import * as i0 from "@angular/core";
import * as i1 from "./tree";
import * as i2 from "@angular/cdk/bidi";
/** Regex used to split a string on its CSS units. */
const cssUnitPattern = /([A-Za-z%]+)$/;
/**
 * Indent for the children tree dataNodes.
 * This directive will add left-padding to the node to show hierarchy.
 */
class CdkTreeNodePadding {
    /** The level of depth of the tree node. The padding will be `level * indent` pixels. */
    get level() {
        return this._level;
    }
    set level(value) {
        this._setLevelInput(value);
    }
    /**
     * The indent for each level. Can be a number or a CSS string.
     * Default number 40px from material design menu sub-menu spec.
     */
    get indent() {
        return this._indent;
    }
    set indent(indent) {
        this._setIndentInput(indent);
    }
    constructor(_treeNode, _tree, _element, _dir) {
        this._treeNode = _treeNode;
        this._tree = _tree;
        this._element = _element;
        this._dir = _dir;
        /** Subject that emits when the component has been destroyed. */
        this._destroyed = new Subject();
        /** CSS units used for the indentation value. */
        this.indentUnits = 'px';
        this._indent = 40;
        this._setPadding();
        if (_dir) {
            _dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => this._setPadding(true));
        }
        // In Ivy the indentation binding might be set before the tree node's data has been added,
        // which means that we'll miss the first render. We have to subscribe to changes in the
        // data to ensure that everything is up to date.
        _treeNode._dataChanges.subscribe(() => this._setPadding());
    }
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    /** The padding indent value for the tree node. Returns a string with px numbers if not null. */
    _paddingIndent() {
        const nodeLevel = this._treeNode.data && this._tree.treeControl.getLevel
            ? this._tree.treeControl.getLevel(this._treeNode.data)
            : null;
        const level = this._level == null ? nodeLevel : this._level;
        return typeof level === 'number' ? `${level * this._indent}${this.indentUnits}` : null;
    }
    _setPadding(forceChange = false) {
        const padding = this._paddingIndent();
        if (padding !== this._currentPadding || forceChange) {
            const element = this._element.nativeElement;
            const paddingProp = this._dir && this._dir.value === 'rtl' ? 'paddingRight' : 'paddingLeft';
            const resetProp = paddingProp === 'paddingLeft' ? 'paddingRight' : 'paddingLeft';
            element.style[paddingProp] = padding || '';
            element.style[resetProp] = '';
            this._currentPadding = padding;
        }
    }
    /**
     * This has been extracted to a util because of TS 4 and VE.
     * View Engine doesn't support property rename inheritance.
     * TS 4.0 doesn't allow properties to override accessors or vice-versa.
     * @docs-private
     */
    _setLevelInput(value) {
        // Set to null as the fallback value so that _setPadding can fall back to the node level if the
        // consumer set the directive as `cdkTreeNodePadding=""`. We still want to take this value if
        // they set 0 explicitly.
        this._level = coerceNumberProperty(value, null);
        this._setPadding();
    }
    /**
     * This has been extracted to a util because of TS 4 and VE.
     * View Engine doesn't support property rename inheritance.
     * TS 4.0 doesn't allow properties to override accessors or vice-versa.
     * @docs-private
     */
    _setIndentInput(indent) {
        let value = indent;
        let units = 'px';
        if (typeof indent === 'string') {
            const parts = indent.split(cssUnitPattern);
            value = parts[0];
            units = parts[1] || units;
        }
        this.indentUnits = units;
        this._indent = coerceNumberProperty(value);
        this._setPadding();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTreeNodePadding, deps: [{ token: i1.CdkTreeNode }, { token: i1.CdkTree }, { token: i0.ElementRef }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkTreeNodePadding, selector: "[cdkTreeNodePadding]", inputs: { level: ["cdkTreeNodePadding", "level"], indent: ["cdkTreeNodePaddingIndent", "indent"] }, ngImport: i0 }); }
}
export { CdkTreeNodePadding };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTreeNodePadding, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTreeNodePadding]',
                }]
        }], ctorParameters: function () { return [{ type: i1.CdkTreeNode }, { type: i1.CdkTree }, { type: i0.ElementRef }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }]; }, propDecorators: { level: [{
                type: Input,
                args: ['cdkTreeNodePadding']
            }], indent: [{
                type: Input,
                args: ['cdkTreeNodePaddingIndent']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQWMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7O0FBRTVDLHFEQUFxRDtBQUNyRCxNQUFNLGNBQWMsR0FBRyxlQUFlLENBQUM7QUFFdkM7OztHQUdHO0FBQ0gsTUFHYSxrQkFBa0I7SUFVN0Isd0ZBQXdGO0lBQ3hGLElBQ0ksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBQ0QsSUFBSSxLQUFLLENBQUMsS0FBa0I7UUFDMUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBR0Q7OztPQUdHO0lBQ0gsSUFDSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUF1QjtRQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFHRCxZQUNVLFNBQTRCLEVBQzVCLEtBQW9CLEVBQ3BCLFFBQWlDLEVBQ3JCLElBQW9CO1FBSGhDLGNBQVMsR0FBVCxTQUFTLENBQW1CO1FBQzVCLFVBQUssR0FB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OztPQUtHO0lBQ08sZUFBZSxDQUFDLE1BQXVCO1FBQy9DLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUNuQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7UUFFakIsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDOUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMzQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDO1NBQzNCO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckIsQ0FBQzs4R0EvR1Usa0JBQWtCO2tHQUFsQixrQkFBa0I7O1NBQWxCLGtCQUFrQjsyRkFBbEIsa0JBQWtCO2tCQUg5QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxzQkFBc0I7aUJBQ2pDOzswQkFzQ0ksUUFBUTs0Q0F6QlAsS0FBSztzQkFEUixLQUFLO3VCQUFDLG9CQUFvQjtnQkFjdkIsTUFBTTtzQkFEVCxLQUFLO3VCQUFDLDBCQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZU51bWJlclByb3BlcnR5LCBOdW1iZXJJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBJbnB1dCwgT25EZXN0cm95LCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5cbi8qKiBSZWdleCB1c2VkIHRvIHNwbGl0IGEgc3RyaW5nIG9uIGl0cyBDU1MgdW5pdHMuICovXG5jb25zdCBjc3NVbml0UGF0dGVybiA9IC8oW0EtWmEteiVdKykkLztcblxuLyoqXG4gKiBJbmRlbnQgZm9yIHRoZSBjaGlsZHJlbiB0cmVlIGRhdGFOb2Rlcy5cbiAqIFRoaXMgZGlyZWN0aXZlIHdpbGwgYWRkIGxlZnQtcGFkZGluZyB0byB0aGUgbm9kZSB0byBzaG93IGhpZXJhcmNoeS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1RyZWVOb2RlUGFkZGluZ10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZVBhZGRpbmc8VCwgSyA9IFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEN1cnJlbnQgcGFkZGluZyB2YWx1ZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LiBVc2VkIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgaGl0dGluZyB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9jdXJyZW50UGFkZGluZzogc3RyaW5nIHwgbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIENTUyB1bml0cyB1c2VkIGZvciB0aGUgaW5kZW50YXRpb24gdmFsdWUuICovXG4gIGluZGVudFVuaXRzID0gJ3B4JztcblxuICAvKiogVGhlIGxldmVsIG9mIGRlcHRoIG9mIHRoZSB0cmVlIG5vZGUuIFRoZSBwYWRkaW5nIHdpbGwgYmUgYGxldmVsICogaW5kZW50YCBwaXhlbHMuICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVQYWRkaW5nJylcbiAgZ2V0IGxldmVsKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2xldmVsO1xuICB9XG4gIHNldCBsZXZlbCh2YWx1ZTogTnVtYmVySW5wdXQpIHtcbiAgICB0aGlzLl9zZXRMZXZlbElucHV0KHZhbHVlKTtcbiAgfVxuICBfbGV2ZWw6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGVudCBmb3IgZWFjaCBsZXZlbC4gQ2FuIGJlIGEgbnVtYmVyIG9yIGEgQ1NTIHN0cmluZy5cbiAgICogRGVmYXVsdCBudW1iZXIgNDBweCBmcm9tIG1hdGVyaWFsIGRlc2lnbiBtZW51IHN1Yi1tZW51IHNwZWMuXG4gICAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlUGFkZGluZ0luZGVudCcpXG4gIGdldCBpbmRlbnQoKTogbnVtYmVyIHwgc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5faW5kZW50O1xuICB9XG4gIHNldCBpbmRlbnQoaW5kZW50OiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICB0aGlzLl9zZXRJbmRlbnRJbnB1dChpbmRlbnQpO1xuICB9XG4gIF9pbmRlbnQ6IG51bWJlciA9IDQwO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX3RyZWVOb2RlOiBDZGtUcmVlTm9kZTxULCBLPixcbiAgICBwcml2YXRlIF90cmVlOiBDZGtUcmVlPFQsIEs+LFxuICAgIHByaXZhdGUgX2VsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHksXG4gICkge1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgICBpZiAoX2Rpcikge1xuICAgICAgX2Rpci5jaGFuZ2UucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3NldFBhZGRpbmcodHJ1ZSkpO1xuICAgIH1cblxuICAgIC8vIEluIEl2eSB0aGUgaW5kZW50YXRpb24gYmluZGluZyBtaWdodCBiZSBzZXQgYmVmb3JlIHRoZSB0cmVlIG5vZGUncyBkYXRhIGhhcyBiZWVuIGFkZGVkLFxuICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgd2UnbGwgbWlzcyB0aGUgZmlyc3QgcmVuZGVyLiBXZSBoYXZlIHRvIHN1YnNjcmliZSB0byBjaGFuZ2VzIGluIHRoZVxuICAgIC8vIGRhdGEgdG8gZW5zdXJlIHRoYXQgZXZlcnl0aGluZyBpcyB1cCB0byBkYXRlLlxuICAgIF90cmVlTm9kZS5fZGF0YUNoYW5nZXMuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3NldFBhZGRpbmcoKSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFRoZSBwYWRkaW5nIGluZGVudCB2YWx1ZSBmb3IgdGhlIHRyZWUgbm9kZS4gUmV0dXJucyBhIHN0cmluZyB3aXRoIHB4IG51bWJlcnMgaWYgbm90IG51bGwuICovXG4gIF9wYWRkaW5nSW5kZW50KCk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IG5vZGVMZXZlbCA9XG4gICAgICB0aGlzLl90cmVlTm9kZS5kYXRhICYmIHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0TGV2ZWxcbiAgICAgICAgPyB0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldExldmVsKHRoaXMuX3RyZWVOb2RlLmRhdGEpXG4gICAgICAgIDogbnVsbDtcbiAgICBjb25zdCBsZXZlbCA9IHRoaXMuX2xldmVsID09IG51bGwgPyBub2RlTGV2ZWwgOiB0aGlzLl9sZXZlbDtcbiAgICByZXR1cm4gdHlwZW9mIGxldmVsID09PSAnbnVtYmVyJyA/IGAke2xldmVsICogdGhpcy5faW5kZW50fSR7dGhpcy5pbmRlbnRVbml0c31gIDogbnVsbDtcbiAgfVxuXG4gIF9zZXRQYWRkaW5nKGZvcmNlQ2hhbmdlID0gZmFsc2UpIHtcbiAgICBjb25zdCBwYWRkaW5nID0gdGhpcy5fcGFkZGluZ0luZGVudCgpO1xuXG4gICAgaWYgKHBhZGRpbmcgIT09IHRoaXMuX2N1cnJlbnRQYWRkaW5nIHx8IGZvcmNlQ2hhbmdlKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgICAgY29uc3QgcGFkZGluZ1Byb3AgPSB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJyA/ICdwYWRkaW5nUmlnaHQnIDogJ3BhZGRpbmdMZWZ0JztcbiAgICAgIGNvbnN0IHJlc2V0UHJvcCA9IHBhZGRpbmdQcm9wID09PSAncGFkZGluZ0xlZnQnID8gJ3BhZGRpbmdSaWdodCcgOiAncGFkZGluZ0xlZnQnO1xuICAgICAgZWxlbWVudC5zdHlsZVtwYWRkaW5nUHJvcF0gPSBwYWRkaW5nIHx8ICcnO1xuICAgICAgZWxlbWVudC5zdHlsZVtyZXNldFByb3BdID0gJyc7XG4gICAgICB0aGlzLl9jdXJyZW50UGFkZGluZyA9IHBhZGRpbmc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaGFzIGJlZW4gZXh0cmFjdGVkIHRvIGEgdXRpbCBiZWNhdXNlIG9mIFRTIDQgYW5kIFZFLlxuICAgKiBWaWV3IEVuZ2luZSBkb2Vzbid0IHN1cHBvcnQgcHJvcGVydHkgcmVuYW1lIGluaGVyaXRhbmNlLlxuICAgKiBUUyA0LjAgZG9lc24ndCBhbGxvdyBwcm9wZXJ0aWVzIHRvIG92ZXJyaWRlIGFjY2Vzc29ycyBvciB2aWNlLXZlcnNhLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3NldExldmVsSW5wdXQodmFsdWU6IE51bWJlcklucHV0KSB7XG4gICAgLy8gU2V0IHRvIG51bGwgYXMgdGhlIGZhbGxiYWNrIHZhbHVlIHNvIHRoYXQgX3NldFBhZGRpbmcgY2FuIGZhbGwgYmFjayB0byB0aGUgbm9kZSBsZXZlbCBpZiB0aGVcbiAgICAvLyBjb25zdW1lciBzZXQgdGhlIGRpcmVjdGl2ZSBhcyBgY2RrVHJlZU5vZGVQYWRkaW5nPVwiXCJgLiBXZSBzdGlsbCB3YW50IHRvIHRha2UgdGhpcyB2YWx1ZSBpZlxuICAgIC8vIHRoZXkgc2V0IDAgZXhwbGljaXRseS5cbiAgICB0aGlzLl9sZXZlbCA9IGNvZXJjZU51bWJlclByb3BlcnR5KHZhbHVlLCBudWxsKSE7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaGFzIGJlZW4gZXh0cmFjdGVkIHRvIGEgdXRpbCBiZWNhdXNlIG9mIFRTIDQgYW5kIFZFLlxuICAgKiBWaWV3IEVuZ2luZSBkb2Vzbid0IHN1cHBvcnQgcHJvcGVydHkgcmVuYW1lIGluaGVyaXRhbmNlLlxuICAgKiBUUyA0LjAgZG9lc24ndCBhbGxvdyBwcm9wZXJ0aWVzIHRvIG92ZXJyaWRlIGFjY2Vzc29ycyBvciB2aWNlLXZlcnNhLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3NldEluZGVudElucHV0KGluZGVudDogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IHZhbHVlID0gaW5kZW50O1xuICAgIGxldCB1bml0cyA9ICdweCc7XG5cbiAgICBpZiAodHlwZW9mIGluZGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHBhcnRzID0gaW5kZW50LnNwbGl0KGNzc1VuaXRQYXR0ZXJuKTtcbiAgICAgIHZhbHVlID0gcGFydHNbMF07XG4gICAgICB1bml0cyA9IHBhcnRzWzFdIHx8IHVuaXRzO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZW50VW5pdHMgPSB1bml0cztcbiAgICB0aGlzLl9pbmRlbnQgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICB9XG59XG4iXX0=