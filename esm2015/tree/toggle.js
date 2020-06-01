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
 */
let CdkTreeNodeToggle = /** @class */ (() => {
    class CdkTreeNodeToggle {
        constructor(_tree, _treeNode) {
            this._tree = _tree;
            this._treeNode = _treeNode;
            this._recursive = false;
        }
        /** Whether expand/collapse the node recursively. */
        get recursive() { return this._recursive; }
        set recursive(value) { this._recursive = coerceBooleanProperty(value); }
        // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
        // In Ivy the `host` bindings will be merged when this class is extended, whereas in
        // ViewEngine they're overwritten.
        // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
        // tslint:disable-next-line:no-host-decorator-in-concrete
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL3RvZ2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFN0QsT0FBTyxFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFNUM7O0dBRUc7QUFDSDtJQUFBLE1BQ2EsaUJBQWlCO1FBTzVCLFlBQXNCLEtBQWlCLEVBQ2pCLFNBQXlCO1lBRHpCLFVBQUssR0FBTCxLQUFLLENBQVk7WUFDakIsY0FBUyxHQUFULFNBQVMsQ0FBZ0I7WUFIckMsZUFBVSxHQUFHLEtBQUssQ0FBQztRQUdxQixDQUFDO1FBUG5ELG9EQUFvRDtRQUNwRCxJQUNJLFNBQVMsS0FBYyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksU0FBUyxDQUFDLEtBQWMsSUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQU1qRixvRkFBb0Y7UUFDcEYsb0ZBQW9GO1FBQ3BGLGtDQUFrQztRQUNsQyxrRkFBa0Y7UUFDbEYseURBQXlEO1FBRXpELE9BQU8sQ0FBQyxLQUFZO1lBQ2xCLElBQUksQ0FBQyxTQUFTO2dCQUNaLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDL0QsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZELEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMxQixDQUFDOzs7Z0JBdkJGLFNBQVMsU0FBQyxFQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBQzs7OztnQkFMcEMsT0FBTztnQkFBRSxXQUFXOzs7NEJBUXpCLEtBQUssU0FBQyw0QkFBNEI7MEJBYWxDLFlBQVksU0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7O0lBVW5DLHdCQUFDO0tBQUE7U0F6QlksaUJBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgSG9zdExpc3RlbmVyLCBJbnB1dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5cbi8qKlxuICogTm9kZSB0b2dnbGUgdG8gZXhwYW5kL2NvbGxhcHNlIHRoZSBub2RlLlxuICovXG5ARGlyZWN0aXZlKHtzZWxlY3RvcjogJ1tjZGtUcmVlTm9kZVRvZ2dsZV0nfSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZVRvZ2dsZTxUPiB7XG4gIC8qKiBXaGV0aGVyIGV4cGFuZC9jb2xsYXBzZSB0aGUgbm9kZSByZWN1cnNpdmVseS4gKi9cbiAgQElucHV0KCdjZGtUcmVlTm9kZVRvZ2dsZVJlY3Vyc2l2ZScpXG4gIGdldCByZWN1cnNpdmUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9yZWN1cnNpdmU7IH1cbiAgc2V0IHJlY3Vyc2l2ZSh2YWx1ZTogYm9vbGVhbikgeyB0aGlzLl9yZWN1cnNpdmUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpOyB9XG4gIHByb3RlY3RlZCBfcmVjdXJzaXZlID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF90cmVlOiBDZGtUcmVlPFQ+LFxuICAgICAgICAgICAgICBwcm90ZWN0ZWQgX3RyZWVOb2RlOiBDZGtUcmVlTm9kZTxUPikge31cblxuICAvLyBXZSBoYXZlIHRvIHVzZSBhIGBIb3N0TGlzdGVuZXJgIGhlcmUgaW4gb3JkZXIgdG8gc3VwcG9ydCBib3RoIEl2eSBhbmQgVmlld0VuZ2luZS5cbiAgLy8gSW4gSXZ5IHRoZSBgaG9zdGAgYmluZGluZ3Mgd2lsbCBiZSBtZXJnZWQgd2hlbiB0aGlzIGNsYXNzIGlzIGV4dGVuZGVkLCB3aGVyZWFzIGluXG4gIC8vIFZpZXdFbmdpbmUgdGhleSdyZSBvdmVyd3JpdHRlbi5cbiAgLy8gVE9ETyhjcmlzYmV0byk6IHdlIG1vdmUgdGhpcyBiYWNrIGludG8gYGhvc3RgIG9uY2UgSXZ5IGlzIHR1cm5lZCBvbiBieSBkZWZhdWx0LlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8taG9zdC1kZWNvcmF0b3ItaW4tY29uY3JldGVcbiAgQEhvc3RMaXN0ZW5lcignY2xpY2snLCBbJyRldmVudCddKVxuICBfdG9nZ2xlKGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIHRoaXMucmVjdXJzaXZlXG4gICAgICA/IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wudG9nZ2xlRGVzY2VuZGFudHModGhpcy5fdHJlZU5vZGUuZGF0YSlcbiAgICAgIDogdGhpcy5fdHJlZS50cmVlQ29udHJvbC50b2dnbGUodGhpcy5fdHJlZU5vZGUuZGF0YSk7XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9yZWN1cnNpdmU6IEJvb2xlYW5JbnB1dDtcbn1cbiJdfQ==