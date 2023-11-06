/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { Directive, ElementRef, Input, numberAttribute, Optional } from '@angular/core';
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
export class CdkTreeNodePadding {
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
        this._level = isNaN(value) ? null : value;
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
        this._indent = numberAttribute(value);
        this._setPadding();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.0-rc.2", ngImport: i0, type: CdkTreeNodePadding, deps: [{ token: i1.CdkTreeNode }, { token: i1.CdkTree }, { token: i0.ElementRef }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.0-rc.2", type: CdkTreeNodePadding, selector: "[cdkTreeNodePadding]", inputs: { level: ["cdkTreeNodePadding", "level", numberAttribute], indent: ["cdkTreeNodePaddingIndent", "indent"] }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.0-rc.2", ngImport: i0, type: CdkTreeNodePadding, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTreeNodePadding]',
                }]
        }], ctorParameters: () => [{ type: i1.CdkTreeNode }, { type: i1.CdkTree }, { type: i0.ElementRef }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }], propDecorators: { level: [{
                type: Input,
                args: [{ alias: 'cdkTreeNodePadding', transform: numberAttribute }]
            }], indent: [{
                type: Input,
                args: ['cdkTreeNodePaddingIndent']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFhLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7OztBQUU1QyxxREFBcUQ7QUFDckQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBRXZDOzs7R0FHRztBQUlILE1BQU0sT0FBTyxrQkFBa0I7SUFVN0Isd0ZBQXdGO0lBQ3hGLElBQ0ksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBQ0QsSUFBSSxLQUFLLENBQUMsS0FBYTtRQUNyQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFHRDs7O09BR0c7SUFDSCxJQUNJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztJQUNELElBQUksTUFBTSxDQUFDLE1BQXVCO1FBQ2hDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUdELFlBQ1UsU0FBNEIsRUFDNUIsS0FBb0IsRUFDcEIsUUFBaUMsRUFDckIsSUFBb0I7UUFIaEMsY0FBUyxHQUFULFNBQVMsQ0FBbUI7UUFDNUIsVUFBSyxHQUFMLEtBQUssQ0FBZTtRQUNwQixhQUFRLEdBQVIsUUFB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S0c7SUFDTyxlQUFlLENBQUMsTUFBdUI7UUFDL0MsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDO1FBQ25CLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztRQUVqQixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtZQUM5QixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzNDLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUM7U0FDM0I7UUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckIsQ0FBQzttSEEvR1Usa0JBQWtCO3VHQUFsQixrQkFBa0IscUZBV21CLGVBQWU7O2dHQVhwRCxrQkFBa0I7a0JBSDlCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHNCQUFzQjtpQkFDakM7OzBCQXNDSSxRQUFRO3lDQXpCUCxLQUFLO3NCQURSLEtBQUs7dUJBQUMsRUFBQyxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBQztnQkFjNUQsTUFBTTtzQkFEVCxLQUFLO3VCQUFDLDBCQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIG51bWJlckF0dHJpYnV0ZSwgT25EZXN0cm95LCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5cbi8qKiBSZWdleCB1c2VkIHRvIHNwbGl0IGEgc3RyaW5nIG9uIGl0cyBDU1MgdW5pdHMuICovXG5jb25zdCBjc3NVbml0UGF0dGVybiA9IC8oW0EtWmEteiVdKykkLztcblxuLyoqXG4gKiBJbmRlbnQgZm9yIHRoZSBjaGlsZHJlbiB0cmVlIGRhdGFOb2Rlcy5cbiAqIFRoaXMgZGlyZWN0aXZlIHdpbGwgYWRkIGxlZnQtcGFkZGluZyB0byB0aGUgbm9kZSB0byBzaG93IGhpZXJhcmNoeS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1RyZWVOb2RlUGFkZGluZ10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZVBhZGRpbmc8VCwgSyA9IFQ+IGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIEN1cnJlbnQgcGFkZGluZyB2YWx1ZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LiBVc2VkIHRvIGF2b2lkIHVubmVjZXNzYXJpbHkgaGl0dGluZyB0aGUgRE9NLiAqL1xuICBwcml2YXRlIF9jdXJyZW50UGFkZGluZzogc3RyaW5nIHwgbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIENTUyB1bml0cyB1c2VkIGZvciB0aGUgaW5kZW50YXRpb24gdmFsdWUuICovXG4gIGluZGVudFVuaXRzID0gJ3B4JztcblxuICAvKiogVGhlIGxldmVsIG9mIGRlcHRoIG9mIHRoZSB0cmVlIG5vZGUuIFRoZSBwYWRkaW5nIHdpbGwgYmUgYGxldmVsICogaW5kZW50YCBwaXhlbHMuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtUcmVlTm9kZVBhZGRpbmcnLCB0cmFuc2Zvcm06IG51bWJlckF0dHJpYnV0ZX0pXG4gIGdldCBsZXZlbCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9sZXZlbDtcbiAgfVxuICBzZXQgbGV2ZWwodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX3NldExldmVsSW5wdXQodmFsdWUpO1xuICB9XG4gIF9sZXZlbDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZW50IGZvciBlYWNoIGxldmVsLiBDYW4gYmUgYSBudW1iZXIgb3IgYSBDU1Mgc3RyaW5nLlxuICAgKiBEZWZhdWx0IG51bWJlciA0MHB4IGZyb20gbWF0ZXJpYWwgZGVzaWduIG1lbnUgc3ViLW1lbnUgc3BlYy5cbiAgICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVQYWRkaW5nSW5kZW50JylcbiAgZ2V0IGluZGVudCgpOiBudW1iZXIgfCBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9pbmRlbnQ7XG4gIH1cbiAgc2V0IGluZGVudChpbmRlbnQ6IG51bWJlciB8IHN0cmluZykge1xuICAgIHRoaXMuX3NldEluZGVudElucHV0KGluZGVudCk7XG4gIH1cbiAgX2luZGVudDogbnVtYmVyID0gNDA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfdHJlZU5vZGU6IENka1RyZWVOb2RlPFQsIEs+LFxuICAgIHByaXZhdGUgX3RyZWU6IENka1RyZWU8VCwgSz4sXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgKSB7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICAgIGlmIChfZGlyKSB7XG4gICAgICBfZGlyLmNoYW5nZS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2V0UGFkZGluZyh0cnVlKSk7XG4gICAgfVxuXG4gICAgLy8gSW4gSXZ5IHRoZSBpbmRlbnRhdGlvbiBiaW5kaW5nIG1pZ2h0IGJlIHNldCBiZWZvcmUgdGhlIHRyZWUgbm9kZSdzIGRhdGEgaGFzIGJlZW4gYWRkZWQsXG4gICAgLy8gd2hpY2ggbWVhbnMgdGhhdCB3ZSdsbCBtaXNzIHRoZSBmaXJzdCByZW5kZXIuIFdlIGhhdmUgdG8gc3Vic2NyaWJlIHRvIGNoYW5nZXMgaW4gdGhlXG4gICAgLy8gZGF0YSB0byBlbnN1cmUgdGhhdCBldmVyeXRoaW5nIGlzIHVwIHRvIGRhdGUuXG4gICAgX3RyZWVOb2RlLl9kYXRhQ2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fc2V0UGFkZGluZygpKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogVGhlIHBhZGRpbmcgaW5kZW50IHZhbHVlIGZvciB0aGUgdHJlZSBub2RlLiBSZXR1cm5zIGEgc3RyaW5nIHdpdGggcHggbnVtYmVycyBpZiBub3QgbnVsbC4gKi9cbiAgX3BhZGRpbmdJbmRlbnQoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgY29uc3Qgbm9kZUxldmVsID1cbiAgICAgIHRoaXMuX3RyZWVOb2RlLmRhdGEgJiYgdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRMZXZlbFxuICAgICAgICA/IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0TGV2ZWwodGhpcy5fdHJlZU5vZGUuZGF0YSlcbiAgICAgICAgOiBudWxsO1xuICAgIGNvbnN0IGxldmVsID0gdGhpcy5fbGV2ZWwgPT0gbnVsbCA/IG5vZGVMZXZlbCA6IHRoaXMuX2xldmVsO1xuICAgIHJldHVybiB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInID8gYCR7bGV2ZWwgKiB0aGlzLl9pbmRlbnR9JHt0aGlzLmluZGVudFVuaXRzfWAgOiBudWxsO1xuICB9XG5cbiAgX3NldFBhZGRpbmcoZm9yY2VDaGFuZ2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IHBhZGRpbmcgPSB0aGlzLl9wYWRkaW5nSW5kZW50KCk7XG5cbiAgICBpZiAocGFkZGluZyAhPT0gdGhpcy5fY3VycmVudFBhZGRpbmcgfHwgZm9yY2VDaGFuZ2UpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBjb25zdCBwYWRkaW5nUHJvcCA9IHRoaXMuX2RpciAmJiB0aGlzLl9kaXIudmFsdWUgPT09ICdydGwnID8gJ3BhZGRpbmdSaWdodCcgOiAncGFkZGluZ0xlZnQnO1xuICAgICAgY29uc3QgcmVzZXRQcm9wID0gcGFkZGluZ1Byb3AgPT09ICdwYWRkaW5nTGVmdCcgPyAncGFkZGluZ1JpZ2h0JyA6ICdwYWRkaW5nTGVmdCc7XG4gICAgICBlbGVtZW50LnN0eWxlW3BhZGRpbmdQcm9wXSA9IHBhZGRpbmcgfHwgJyc7XG4gICAgICBlbGVtZW50LnN0eWxlW3Jlc2V0UHJvcF0gPSAnJztcbiAgICAgIHRoaXMuX2N1cnJlbnRQYWRkaW5nID0gcGFkZGluZztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBoYXMgYmVlbiBleHRyYWN0ZWQgdG8gYSB1dGlsIGJlY2F1c2Ugb2YgVFMgNCBhbmQgVkUuXG4gICAqIFZpZXcgRW5naW5lIGRvZXNuJ3Qgc3VwcG9ydCBwcm9wZXJ0eSByZW5hbWUgaW5oZXJpdGFuY2UuXG4gICAqIFRTIDQuMCBkb2Vzbid0IGFsbG93IHByb3BlcnRpZXMgdG8gb3ZlcnJpZGUgYWNjZXNzb3JzIG9yIHZpY2UtdmVyc2EuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHByb3RlY3RlZCBfc2V0TGV2ZWxJbnB1dCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgLy8gU2V0IHRvIG51bGwgYXMgdGhlIGZhbGxiYWNrIHZhbHVlIHNvIHRoYXQgX3NldFBhZGRpbmcgY2FuIGZhbGwgYmFjayB0byB0aGUgbm9kZSBsZXZlbCBpZiB0aGVcbiAgICAvLyBjb25zdW1lciBzZXQgdGhlIGRpcmVjdGl2ZSBhcyBgY2RrVHJlZU5vZGVQYWRkaW5nPVwiXCJgLiBXZSBzdGlsbCB3YW50IHRvIHRha2UgdGhpcyB2YWx1ZSBpZlxuICAgIC8vIHRoZXkgc2V0IDAgZXhwbGljaXRseS5cbiAgICB0aGlzLl9sZXZlbCA9IGlzTmFOKHZhbHVlKSA/IG51bGwhIDogdmFsdWU7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaGFzIGJlZW4gZXh0cmFjdGVkIHRvIGEgdXRpbCBiZWNhdXNlIG9mIFRTIDQgYW5kIFZFLlxuICAgKiBWaWV3IEVuZ2luZSBkb2Vzbid0IHN1cHBvcnQgcHJvcGVydHkgcmVuYW1lIGluaGVyaXRhbmNlLlxuICAgKiBUUyA0LjAgZG9lc24ndCBhbGxvdyBwcm9wZXJ0aWVzIHRvIG92ZXJyaWRlIGFjY2Vzc29ycyBvciB2aWNlLXZlcnNhLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3NldEluZGVudElucHV0KGluZGVudDogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IHZhbHVlID0gaW5kZW50O1xuICAgIGxldCB1bml0cyA9ICdweCc7XG5cbiAgICBpZiAodHlwZW9mIGluZGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHBhcnRzID0gaW5kZW50LnNwbGl0KGNzc1VuaXRQYXR0ZXJuKTtcbiAgICAgIHZhbHVlID0gcGFydHNbMF07XG4gICAgICB1bml0cyA9IHBhcnRzWzFdIHx8IHVuaXRzO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZW50VW5pdHMgPSB1bml0cztcbiAgICB0aGlzLl9pbmRlbnQgPSBudW1iZXJBdHRyaWJ1dGUodmFsdWUpO1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgfVxufVxuIl19