/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata } from "tslib";
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, HostListener, Input } from '@angular/core';
import { CdkTree, CdkTreeNode } from './tree';
/**
 * Node toggle to expand/collapse the node.
 */
let CdkTreeNodeToggle = /** @class */ (() => {
    let CdkTreeNodeToggle = class CdkTreeNodeToggle {
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
    };
    __decorate([
        Input('cdkTreeNodeToggleRecursive'),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], CdkTreeNodeToggle.prototype, "recursive", null);
    __decorate([
        HostListener('click', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Event]),
        __metadata("design:returntype", void 0)
    ], CdkTreeNodeToggle.prototype, "_toggle", null);
    CdkTreeNodeToggle = __decorate([
        Directive({ selector: '[cdkTreeNodeToggle]' }),
        __metadata("design:paramtypes", [CdkTree,
            CdkTreeNode])
    ], CdkTreeNodeToggle);
    return CdkTreeNodeToggle;
})();
export { CdkTreeNodeToggle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90cmVlL3RvZ2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTdELE9BQU8sRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRTVDOztHQUVHO0FBRUg7SUFBQSxJQUFhLGlCQUFpQixHQUE5QixNQUFhLGlCQUFpQjtRQU81QixZQUFzQixLQUFpQixFQUNqQixTQUF5QjtZQUR6QixVQUFLLEdBQUwsS0FBSyxDQUFZO1lBQ2pCLGNBQVMsR0FBVCxTQUFTLENBQWdCO1lBSHJDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFHcUIsQ0FBQztRQVBuRCxvREFBb0Q7UUFFcEQsSUFBSSxTQUFTLEtBQWMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLFNBQVMsQ0FBQyxLQUFjLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFNakYsb0ZBQW9GO1FBQ3BGLG9GQUFvRjtRQUNwRixrQ0FBa0M7UUFDbEMsa0ZBQWtGO1FBQ2xGLHlEQUF5RDtRQUV6RCxPQUFPLENBQUMsS0FBWTtZQUNsQixJQUFJLENBQUMsU0FBUztnQkFDWixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQy9ELENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2RCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUdGLENBQUE7SUF0QkM7UUFEQyxLQUFLLENBQUMsNEJBQTRCLENBQUM7OztzREFDZ0I7SUFhcEQ7UUFEQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7O3lDQUNuQixLQUFLOztvREFNbkI7SUF0QlUsaUJBQWlCO1FBRDdCLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBQyxDQUFDO3lDQVFkLE9BQU87WUFDSCxXQUFXO09BUmpDLGlCQUFpQixDQXlCN0I7SUFBRCx3QkFBQztLQUFBO1NBekJZLGlCQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEhvc3RMaXN0ZW5lciwgSW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuXG4vKipcbiAqIE5vZGUgdG9nZ2xlIHRvIGV4cGFuZC9jb2xsYXBzZSB0aGUgbm9kZS5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbY2RrVHJlZU5vZGVUb2dnbGVdJ30pXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGVUb2dnbGU8VD4ge1xuICAvKiogV2hldGhlciBleHBhbmQvY29sbGFwc2UgdGhlIG5vZGUgcmVjdXJzaXZlbHkuICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVUb2dnbGVSZWN1cnNpdmUnKVxuICBnZXQgcmVjdXJzaXZlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fcmVjdXJzaXZlOyB9XG4gIHNldCByZWN1cnNpdmUodmFsdWU6IGJvb2xlYW4pIHsgdGhpcy5fcmVjdXJzaXZlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTsgfVxuICBwcm90ZWN0ZWQgX3JlY3Vyc2l2ZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfdHJlZTogQ2RrVHJlZTxUPixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF90cmVlTm9kZTogQ2RrVHJlZU5vZGU8VD4pIHt9XG5cbiAgLy8gV2UgaGF2ZSB0byB1c2UgYSBgSG9zdExpc3RlbmVyYCBoZXJlIGluIG9yZGVyIHRvIHN1cHBvcnQgYm90aCBJdnkgYW5kIFZpZXdFbmdpbmUuXG4gIC8vIEluIEl2eSB0aGUgYGhvc3RgIGJpbmRpbmdzIHdpbGwgYmUgbWVyZ2VkIHdoZW4gdGhpcyBjbGFzcyBpcyBleHRlbmRlZCwgd2hlcmVhcyBpblxuICAvLyBWaWV3RW5naW5lIHRoZXkncmUgb3ZlcndyaXR0ZW4uXG4gIC8vIFRPRE8oY3Jpc2JldG8pOiB3ZSBtb3ZlIHRoaXMgYmFjayBpbnRvIGBob3N0YCBvbmNlIEl2eSBpcyB0dXJuZWQgb24gYnkgZGVmYXVsdC5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWhvc3QtZGVjb3JhdG9yLWluLWNvbmNyZXRlXG4gIEBIb3N0TGlzdGVuZXIoJ2NsaWNrJywgWyckZXZlbnQnXSlcbiAgX3RvZ2dsZShldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLnJlY3Vyc2l2ZVxuICAgICAgPyB0aGlzLl90cmVlLnRyZWVDb250cm9sLnRvZ2dsZURlc2NlbmRhbnRzKHRoaXMuX3RyZWVOb2RlLmRhdGEpXG4gICAgICA6IHRoaXMuX3RyZWUudHJlZUNvbnRyb2wudG9nZ2xlKHRoaXMuX3RyZWVOb2RlLmRhdGEpO1xuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfcmVjdXJzaXZlOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=