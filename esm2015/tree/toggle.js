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
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, HostListener, Input } from '@angular/core';
import { CdkTree, CdkTreeNode } from './tree';
/**
 * Node toggle to expand/collapse the node.
 * @template T
 */
export class CdkTreeNodeToggle {
    /**
     * @param {?} _tree
     * @param {?} _treeNode
     */
    constructor(_tree, _treeNode) {
        this._tree = _tree;
        this._treeNode = _treeNode;
        this._recursive = false;
    }
    /**
     * Whether expand/collapse the node recursively.
     * @return {?}
     */
    get recursive() { return this._recursive; }
    /**
     * @param {?} value
     * @return {?}
     */
    set recursive(value) { this._recursive = coerceBooleanProperty(value); }
    // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
    // In Ivy the `host` bindings will be merged when this class is extended, whereas in
    // ViewEngine they're overwritten.
    // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
    // tslint:disable-next-line:no-host-decorator-in-concrete
    /**
     * @param {?} event
     * @return {?}
     */
    _toggle(event) {
        this.recursive
            ? this._tree.treeControl.toggleDescendants(this._treeNode.data)
            : this._tree.treeControl.toggle(this._treeNode.data);
        event.stopPropagation();
    }
}
CdkTreeNodeToggle.decorators = [
    { type: Directive, args: [{ selector: '[cdkTreeNodeToggle]' },] }
];
/** @nocollapse */
CdkTreeNodeToggle.ctorParameters = () => [
    { type: CdkTree },
    { type: CdkTreeNode }
];
CdkTreeNodeToggle.propDecorators = {
    recursive: [{ type: Input, args: ['cdkTreeNodeToggleRecursive',] }],
    _toggle: [{ type: HostListener, args: ['click', ['$event'],] }]
};
if (false) {
    /** @type {?} */
    CdkTreeNodeToggle.ngAcceptInputType_recursive;
    /**
     * @type {?}
     * @protected
     */
    CdkTreeNodeToggle.prototype._recursive;
    /**
     * @type {?}
     * @protected
     */
    CdkTreeNodeToggle.prototype._tree;
    /**
     * @type {?}
     * @protected
     */
    CdkTreeNodeToggle.prototype._treeNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL3RvZ2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVELE9BQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUU3RCxPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7QUFNNUMsTUFBTSxPQUFPLGlCQUFpQjs7Ozs7SUFPNUIsWUFBc0IsS0FBaUIsRUFDakIsU0FBeUI7UUFEekIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUNqQixjQUFTLEdBQVQsU0FBUyxDQUFnQjtRQUhyQyxlQUFVLEdBQUcsS0FBSyxDQUFDO0lBR3FCLENBQUM7Ozs7O0lBTm5ELElBQ0ksU0FBUyxLQUFjLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBQ3BELElBQUksU0FBUyxDQUFDLEtBQWMsSUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7Ozs7OztJQVlqRixPQUFPLENBQUMsS0FBWTtRQUNsQixJQUFJLENBQUMsU0FBUztZQUNaLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztZQUMvRCxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkQsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQzFCLENBQUM7OztZQXZCRixTQUFTLFNBQUMsRUFBQyxRQUFRLEVBQUUscUJBQXFCLEVBQUM7Ozs7WUFMcEMsT0FBTztZQUFFLFdBQVc7Ozt3QkFRekIsS0FBSyxTQUFDLDRCQUE0QjtzQkFhbEMsWUFBWSxTQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQzs7OztJQVNqQyw4Q0FBcUQ7Ozs7O0lBbkJyRCx1Q0FBNkI7Ozs7O0lBRWpCLGtDQUEyQjs7Ozs7SUFDM0Isc0NBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEhvc3RMaXN0ZW5lciwgSW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuXG4vKipcbiAqIE5vZGUgdG9nZ2xlIHRvIGV4cGFuZC9jb2xsYXBzZSB0aGUgbm9kZS5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrVHJlZU5vZGVUb2dnbGVdJ30pXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGVUb2dnbGU8VD4ge1xuICAvKiogV2hldGhlciBleHBhbmQvY29sbGFwc2UgdGhlIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVUb2dnbGVSZWN1cnNpdmUnKVxuICBnZXQgcmVjdXJzaXZlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fcmVjdXJzaXZlOyB9XG4gIHNldCByZWN1cnNpdmUodmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fcmVjdXJzaXZlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuICBwcm90ZWN0ZWQgX3JlY3Vyc2l2ZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfdHJlZTogQ2RrVHJlZTxUPixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF90cmVlTm9kZTogQ2RrVHJlZU5vZGU8VD4pIHt9XG5cbiAgLy8gV2UgaGF2ZSB0byB1c2UgYSBgSG9zdExpc3RlbmVyYCBoZXJlIGluIG9yZGVyIHRvIHN1cHBvcnQgYm90aCBJdnkgYW5kIFZpZXdFbmdpbmUuXG4gIC8vIEluIEl2eSB0aGUgYGhvc3RgIGJpbmRpbmdzIHdpbGwgYmUgbWVyZ2VkIHdoZW4gdGhpcyBjbGFzcyBpcyBleHRlbmRlZCwgd2hlcmVhcyBpblxuICAvLyBWaWV3RW5naW5lIHRoZXkncmUgb3ZlcndyaXR0ZW4uXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiB3ZSBtb3ZlIHRoaXMgYmFjayBpbnRvIGBob3N0YCBvbmNlIEl2eSBpcyB0dXJuZWQgb24gYnkgZGVmYXVsdC5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWhvc3QtZGVjb3JhdG9yLWluLWNvbmNyZXRlXG4gIEBIb3N0TGlzdGVuZXIoJ2NsaWNrJywgWyckZXZlbnQnXSlcbiAgX3RvZ2dsZShldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLnJlY3Vyc2l2ZVxuICAgICAgPyB0aGlzLl90cmVlLnRyZWVDb250cm9sLnRvZ2dsZURlc2NlbmRhbnRzKHRoaXMuX3RyZWVOb2RlLmRhdGEpXG4gICAgICA6IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wudG9nZ2xlKHRoaXMuX3RyZWVOb2RlLmRhdGEpO1xuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcmVjdXJzaXZlOiBib29sZWFuIHwgc3RyaW5nO1xufVxuIl19