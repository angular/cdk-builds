/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/tree/toggle.ts
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
let CdkTreeNodeToggle = /** @class */ (() => {
    /**
     * Node toggle to expand/collapse the node.
     * @template T
     */
    class CdkTreeNodeToggle {
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
    return CdkTreeNodeToggle;
})();
export { CdkTreeNodeToggle };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL3RvZ2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFN0QsT0FBTyxFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7O0FBSzVDOzs7OztJQUFBLE1BQ2EsaUJBQWlCOzs7OztRQU81QixZQUFzQixLQUFpQixFQUNqQixTQUF5QjtZQUR6QixVQUFLLEdBQUwsS0FBSyxDQUFZO1lBQ2pCLGNBQVMsR0FBVCxTQUFTLENBQWdCO1lBSHJDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFHcUIsQ0FBQzs7Ozs7UUFObkQsSUFDSSxTQUFTLEtBQWMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzs7Ozs7UUFDcEQsSUFBSSxTQUFTLENBQUMsS0FBYyxJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7Ozs7Ozs7O1FBWWpGLE9BQU8sQ0FBQyxLQUFZO1lBQ2xCLElBQUksQ0FBQyxTQUFTO2dCQUNaLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDL0QsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZELEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMxQixDQUFDOzs7Z0JBdkJGLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBQzs7OztnQkFMcEMsT0FBTztnQkFBRSxXQUFXOzs7NEJBUXpCLEtBQUssU0FBQyw0QkFBNEI7MEJBYWxDLFlBQVksU0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7O0lBVW5DLHdCQUFDO0tBQUE7U0F6QlksaUJBQWlCOzs7SUF3QjVCLDhDQUFpRDs7Ozs7SUFuQmpELHVDQUE2Qjs7Ozs7SUFFakIsa0NBQTJCOzs7OztJQUMzQixzQ0FBbUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RGlyZWN0aXZlLCBIb3N0TGlzdGVuZXIsIElucHV0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDZGtUcmVlLCBDZGtUcmVlTm9kZX0gZnJvbSAnLi90cmVlJztcblxuLyoqXG4gKiBOb2RlIHRvZ2dsZSB0byBleHBhbmQvY29sbGFwc2UgdGhlIG5vZGUuXG4gKi9cbkBEaXJlY3RpdmUoe3NlbGVjdG9yOiAnW2Nka1RyZWVOb2RlVG9nZ2xlXSd9KVxuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlVG9nZ2xlPFQ+IHtcbiAgLyoqIFdoZXRoZXIgZXhwYW5kL2NvbGxhcHNlIHRoZSBub2RlIHJlY3Vyc2l2ZWx5LiAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlVG9nZ2xlUmVjdXJzaXZlJylcbiAgZ2V0IHJlY3Vyc2l2ZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3JlY3Vyc2l2ZTsgfVxuICBzZXQgcmVjdXJzaXZlKHZhbHVlOiBib29sZWFuKSB7IHRoaXMuX3JlY3Vyc2l2ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7IH1cbiAgcHJvdGVjdGVkIF9yZWN1cnNpdmUgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX3RyZWU6IENka1RyZWU8VD4sXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBfdHJlZU5vZGU6IENka1RyZWVOb2RlPFQ+KSB7fVxuXG4gIC8vIFdlIGhhdmUgdG8gdXNlIGEgYEhvc3RMaXN0ZW5lcmAgaGVyZSBpbiBvcmRlciB0byBzdXBwb3J0IGJvdGggSXZ5IGFuZCBWaWV3RW5naW5lLlxuICAvLyBJbiBJdnkgdGhlIGBob3N0YCBiaW5kaW5ncyB3aWxsIGJlIG1lcmdlZCB3aGVuIHRoaXMgY2xhc3MgaXMgZXh0ZW5kZWQsIHdoZXJlYXMgaW5cbiAgLy8gVmlld0VuZ2luZSB0aGV5J3JlIG92ZXJ3cml0dGVuLlxuICAvLyBUT0RPKGNyaXNiZXRvKTogd2UgbW92ZSB0aGlzIGJhY2sgaW50byBgaG9zdGAgb25jZSBJdnkgaXMgdHVybmVkIG9uIGJ5IGRlZmF1bHQuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1ob3N0LWRlY29yYXRvci1pbi1jb25jcmV0ZVxuICBASG9zdExpc3RlbmVyKCdjbGljaycsIFsnJGV2ZW50J10pXG4gIF90b2dnbGUoZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgdGhpcy5yZWN1cnNpdmVcbiAgICAgID8gdGhpcy5fdHJlZS50cmVlQ29udHJvbC50b2dnbGVEZXNjZW5kYW50cyh0aGlzLl90cmVlTm9kZS5kYXRhKVxuICAgICAgOiB0aGlzLl90cmVlLnRyZWVDb250cm9sLnRvZ2dsZSh0aGlzLl90cmVlTm9kZS5kYXRhKTtcblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3JlY3Vyc2l2ZTogQm9vbGVhbklucHV0O1xufVxuIl19