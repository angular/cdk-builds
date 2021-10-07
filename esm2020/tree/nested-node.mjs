/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ContentChildren, Directive, ElementRef, IterableDiffers, QueryList, } from '@angular/core';
import { isObservable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CDK_TREE_NODE_OUTLET_NODE, CdkTreeNodeOutlet } from './outlet';
import { CdkTree, CdkTreeNode } from './tree';
import { getTreeControlFunctionsMissingError } from './tree-errors';
import * as i0 from "@angular/core";
import * as i1 from "./tree";
/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * The children of node will be automatically added to `cdkTreeNodeOutlet`.
 */
export class CdkNestedTreeNode extends CdkTreeNode {
    constructor(elementRef, tree, _differs) {
        super(elementRef, tree);
        this._differs = _differs;
        // The classes are directly added here instead of in the host property because classes on
        // the host property are not inherited with View Engine. It is not set as a @HostBinding because
        // it is not set by the time it's children nodes try to read the class from it.
        // TODO: move to host after View Engine deprecation
        elementRef.nativeElement.classList.add('cdk-nested-tree-node');
    }
    ngAfterContentInit() {
        this._dataDiffer = this._differs.find([]).create(this._tree.trackBy);
        if (!this._tree.treeControl.getChildren && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTreeControlFunctionsMissingError();
        }
        const childrenNodes = this._tree.treeControl.getChildren(this.data);
        if (Array.isArray(childrenNodes)) {
            this.updateChildrenNodes(childrenNodes);
        }
        else if (isObservable(childrenNodes)) {
            childrenNodes.pipe(takeUntil(this._destroyed))
                .subscribe(result => this.updateChildrenNodes(result));
        }
        this.nodeOutlet.changes.pipe(takeUntil(this._destroyed))
            .subscribe(() => this.updateChildrenNodes());
    }
    // This is a workaround for https://github.com/angular/angular/issues/23091
    // In aot mode, the lifecycle hooks from parent class are not called.
    ngOnInit() {
        super.ngOnInit();
    }
    ngDoCheck() {
        super.ngDoCheck();
    }
    ngOnDestroy() {
        this._clear();
        super.ngOnDestroy();
    }
    /** Add children dataNodes to the NodeOutlet */
    updateChildrenNodes(children) {
        const outlet = this._getNodeOutlet();
        if (children) {
            this._children = children;
        }
        if (outlet && this._children) {
            const viewContainer = outlet.viewContainer;
            this._tree.renderNodeChanges(this._children, this._dataDiffer, viewContainer, this._data);
        }
        else {
            // Reset the data differ if there's no children nodes displayed
            this._dataDiffer.diff([]);
        }
    }
    /** Clear the children dataNodes. */
    _clear() {
        const outlet = this._getNodeOutlet();
        if (outlet) {
            outlet.viewContainer.clear();
            this._dataDiffer.diff([]);
        }
    }
    /** Gets the outlet for the current node. */
    _getNodeOutlet() {
        const outlets = this.nodeOutlet;
        // Note that since we use `descendants: true` on the query, we have to ensure
        // that we don't pick up the outlet of a child node by accident.
        return outlets && outlets.find(outlet => !outlet._node || outlet._node === this);
    }
}
CdkNestedTreeNode.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkNestedTreeNode, deps: [{ token: i0.ElementRef }, { token: i1.CdkTree }, { token: i0.IterableDiffers }], target: i0.ɵɵFactoryTarget.Directive });
CdkNestedTreeNode.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkNestedTreeNode, selector: "cdk-nested-tree-node", inputs: { role: "role", disabled: "disabled", tabIndex: "tabIndex" }, providers: [
        { provide: CdkTreeNode, useExisting: CdkNestedTreeNode },
        { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode }
    ], queries: [{ propertyName: "nodeOutlet", predicate: CdkTreeNodeOutlet, descendants: true }], exportAs: ["cdkNestedTreeNode"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkNestedTreeNode, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-nested-tree-node',
                    exportAs: 'cdkNestedTreeNode',
                    inputs: ['role', 'disabled', 'tabIndex'],
                    providers: [
                        { provide: CdkTreeNode, useExisting: CdkNestedTreeNode },
                        { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode }
                    ]
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.CdkTree }, { type: i0.IterableDiffers }]; }, propDecorators: { nodeOutlet: [{
                type: ContentChildren,
                args: [CdkTreeNodeOutlet, {
                        // We need to use `descendants: true`, because Ivy will no longer match
                        // indirect descendants if it's left as false.
                        descendants: true
                    }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLW5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvbmVzdGVkLW5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUVMLGVBQWUsRUFDZixTQUFTLEVBRVQsVUFBVSxFQUVWLGVBQWUsRUFHZixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFekMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7O0FBRWxFOzs7OztHQUtHO0FBVUgsTUFBTSxPQUFPLGlCQUE0QixTQUFRLFdBQWlCO0lBZ0JoRSxZQUFZLFVBQW1DLEVBQ25DLElBQW1CLEVBQ1QsUUFBeUI7UUFDN0MsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQURKLGFBQVEsR0FBUixRQUFRLENBQWlCO1FBRTdDLHlGQUF5RjtRQUN6RixnR0FBZ0c7UUFDaEcsK0VBQStFO1FBQy9FLG1EQUFtRDtRQUNuRCxVQUFVLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsa0JBQWtCO1FBQ2hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLElBQUksQ0FB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QUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQztLQUNyRSxxREFXZ0IsaUJBQWlCO21HQVR2QixpQkFBaUI7a0JBVDdCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLHNCQUFzQjtvQkFDaEMsUUFBUSxFQUFFLG1CQUFtQjtvQkFDN0IsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUM7b0JBQ3hDLFNBQVMsRUFBRTt3QkFDVCxFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxtQkFBbUIsRUFBQzt3QkFDdEQsRUFBQyxPQUFPLEVBQUUseUJBQXlCLEVBQUUsV0FBVyxtQkFBbUIsRUFBQztxQkFDckU7aUJBQ0Y7cUpBZUMsVUFBVTtzQkFMVCxlQUFlO3VCQUFDLGlCQUFpQixFQUFFO3dCQUNsQyx1RUFBdUU7d0JBQ3ZFLDhDQUE4Qzt3QkFDOUMsV0FBVyxFQUFFLElBQUk7cUJBQ2xCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRJbml0LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRG9DaGVjayxcbiAgRWxlbWVudFJlZixcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIFF1ZXJ5TGlzdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0NES19UUkVFX05PREVfT1VUTEVUX05PREUsIENka1RyZWVOb2RlT3V0bGV0fSBmcm9tICcuL291dGxldCc7XG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuaW1wb3J0IHtnZXRUcmVlQ29udHJvbEZ1bmN0aW9uc01pc3NpbmdFcnJvcn0gZnJvbSAnLi90cmVlLWVycm9ycyc7XG5cbi8qKlxuICogTmVzdGVkIG5vZGUgaXMgYSBjaGlsZCBvZiBgPGNkay10cmVlPmAuIEl0IHdvcmtzIHdpdGggbmVzdGVkIHRyZWUuXG4gKiBCeSB1c2luZyBgY2RrLW5lc3RlZC10cmVlLW5vZGVgIGNvbXBvbmVudCBpbiB0cmVlIG5vZGUgdGVtcGxhdGUsIGNoaWxkcmVuIG9mIHRoZSBwYXJlbnQgbm9kZSB3aWxsXG4gKiBiZSBhZGRlZCBpbiB0aGUgYGNka1RyZWVOb2RlT3V0bGV0YCBpbiB0cmVlIG5vZGUgdGVtcGxhdGUuXG4gKiBUaGUgY2hpbGRyZW4gb2Ygbm9kZSB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgYWRkZWQgdG8gYGNka1RyZWVOb2RlT3V0bGV0YC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLW5lc3RlZC10cmVlLW5vZGUnLFxuICBleHBvcnRBczogJ2Nka05lc3RlZFRyZWVOb2RlJyxcbiAgaW5wdXRzOiBbJ3JvbGUnLCAnZGlzYWJsZWQnLCAndGFiSW5kZXgnXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IENka1RyZWVOb2RlLCB1c2VFeGlzdGluZzogQ2RrTmVzdGVkVHJlZU5vZGV9LFxuICAgIHtwcm92aWRlOiBDREtfVFJFRV9OT0RFX09VVExFVF9OT0RFLCB1c2VFeGlzdGluZzogQ2RrTmVzdGVkVHJlZU5vZGV9XG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrTmVzdGVkVHJlZU5vZGU8VCwgSyA9IFQ+IGV4dGVuZHMgQ2RrVHJlZU5vZGU8VCwgSz5cbiAgICBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIERvQ2hlY2ssIE9uRGVzdHJveSwgT25Jbml0IHtcbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPjtcblxuICAvKiogVGhlIGNoaWxkcmVuIGRhdGEgZGF0YU5vZGVzIG9mIGN1cnJlbnQgbm9kZS4gVGhleSB3aWxsIGJlIHBsYWNlZCBpbiBgQ2RrVHJlZU5vZGVPdXRsZXRgLiAqL1xuICBwcm90ZWN0ZWQgX2NoaWxkcmVuOiBUW107XG5cbiAgLyoqIFRoZSBjaGlsZHJlbiBub2RlIHBsYWNlaG9sZGVyLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1RyZWVOb2RlT3V0bGV0LCB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgYGRlc2NlbmRhbnRzOiB0cnVlYCwgYmVjYXVzZSBJdnkgd2lsbCBubyBsb25nZXIgbWF0Y2hcbiAgICAvLyBpbmRpcmVjdCBkZXNjZW5kYW50cyBpZiBpdCdzIGxlZnQgYXMgZmFsc2UuXG4gICAgZGVzY2VuZGFudHM6IHRydWVcbiAgfSlcbiAgbm9kZU91dGxldDogUXVlcnlMaXN0PENka1RyZWVOb2RlT3V0bGV0PjtcblxuICBjb25zdHJ1Y3RvcihlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgdHJlZTogQ2RrVHJlZTxULCBLPixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgICBzdXBlcihlbGVtZW50UmVmLCB0cmVlKTtcbiAgICAvLyBUaGUgY2xhc3NlcyBhcmUgZGlyZWN0bHkgYWRkZWQgaGVyZSBpbnN0ZWFkIG9mIGluIHRoZSBob3N0IHByb3BlcnR5IGJlY2F1c2UgY2xhc3NlcyBvblxuICAgIC8vIHRoZSBob3N0IHByb3BlcnR5IGFyZSBub3QgaW5oZXJpdGVkIHdpdGggVmlldyBFbmdpbmUuIEl0IGlzIG5vdCBzZXQgYXMgYSBASG9zdEJpbmRpbmcgYmVjYXVzZVxuICAgIC8vIGl0IGlzIG5vdCBzZXQgYnkgdGhlIHRpbWUgaXQncyBjaGlsZHJlbiBub2RlcyB0cnkgdG8gcmVhZCB0aGUgY2xhc3MgZnJvbSBpdC5cbiAgICAvLyBUT0RPOiBtb3ZlIHRvIGhvc3QgYWZ0ZXIgVmlldyBFbmdpbmUgZGVwcmVjYXRpb25cbiAgICBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY2RrLW5lc3RlZC10cmVlLW5vZGUnKTtcbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKFtdKS5jcmVhdGUodGhpcy5fdHJlZS50cmFja0J5KTtcbiAgICBpZiAoIXRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0Q2hpbGRyZW4gJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRyZWVDb250cm9sRnVuY3Rpb25zTWlzc2luZ0Vycm9yKCk7XG4gICAgfVxuICAgIGNvbnN0IGNoaWxkcmVuTm9kZXMgPSB0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldENoaWxkcmVuKHRoaXMuZGF0YSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW5Ob2RlcykpIHtcbiAgICAgIHRoaXMudXBkYXRlQ2hpbGRyZW5Ob2RlcyhjaGlsZHJlbk5vZGVzIGFzIFRbXSk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUoY2hpbGRyZW5Ob2RlcykpIHtcbiAgICAgIGNoaWxkcmVuTm9kZXMucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZShyZXN1bHQgPT4gdGhpcy51cGRhdGVDaGlsZHJlbk5vZGVzKHJlc3VsdCkpO1xuICAgIH1cbiAgICB0aGlzLm5vZGVPdXRsZXQuY2hhbmdlcy5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudXBkYXRlQ2hpbGRyZW5Ob2RlcygpKTtcbiAgfVxuXG4gIC8vIFRoaXMgaXMgYSB3b3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8yMzA5MVxuICAvLyBJbiBhb3QgbW9kZSwgdGhlIGxpZmVjeWNsZSBob29rcyBmcm9tIHBhcmVudCBjbGFzcyBhcmUgbm90IGNhbGxlZC5cbiAgb3ZlcnJpZGUgbmdPbkluaXQoKSB7XG4gICAgc3VwZXIubmdPbkluaXQoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG5nRG9DaGVjaygpIHtcbiAgICBzdXBlci5uZ0RvQ2hlY2soKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2NsZWFyKCk7XG4gICAgc3VwZXIubmdPbkRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKiBBZGQgY2hpbGRyZW4gZGF0YU5vZGVzIHRvIHRoZSBOb2RlT3V0bGV0ICovXG4gIHByb3RlY3RlZCB1cGRhdGVDaGlsZHJlbk5vZGVzKGNoaWxkcmVuPzogVFtdKTogdm9pZCB7XG4gICAgY29uc3Qgb3V0bGV0ID0gdGhpcy5fZ2V0Tm9kZU91dGxldCgpO1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgdGhpcy5fY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICB9XG4gICAgaWYgKG91dGxldCAmJiB0aGlzLl9jaGlsZHJlbikge1xuICAgICAgY29uc3Qgdmlld0NvbnRhaW5lciA9IG91dGxldC52aWV3Q29udGFpbmVyO1xuICAgICAgdGhpcy5fdHJlZS5yZW5kZXJOb2RlQ2hhbmdlcyh0aGlzLl9jaGlsZHJlbiwgdGhpcy5fZGF0YURpZmZlciwgdmlld0NvbnRhaW5lciwgdGhpcy5fZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlc2V0IHRoZSBkYXRhIGRpZmZlciBpZiB0aGVyZSdzIG5vIGNoaWxkcmVuIG5vZGVzIGRpc3BsYXllZFxuICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ2xlYXIgdGhlIGNoaWxkcmVuIGRhdGFOb2Rlcy4gKi9cbiAgcHJvdGVjdGVkIF9jbGVhcigpOiB2b2lkIHtcbiAgICBjb25zdCBvdXRsZXQgPSB0aGlzLl9nZXROb2RlT3V0bGV0KCk7XG4gICAgaWYgKG91dGxldCkge1xuICAgICAgb3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICAgIHRoaXMuX2RhdGFEaWZmZXIuZGlmZihbXSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEdldHMgdGhlIG91dGxldCBmb3IgdGhlIGN1cnJlbnQgbm9kZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0Tm9kZU91dGxldCgpIHtcbiAgICBjb25zdCBvdXRsZXRzID0gdGhpcy5ub2RlT3V0bGV0O1xuXG4gICAgLy8gTm90ZSB0aGF0IHNpbmNlIHdlIHVzZSBgZGVzY2VuZGFudHM6IHRydWVgIG9uIHRoZSBxdWVyeSwgd2UgaGF2ZSB0byBlbnN1cmVcbiAgICAvLyB0aGF0IHdlIGRvbid0IHBpY2sgdXAgdGhlIG91dGxldCBvZiBhIGNoaWxkIG5vZGUgYnkgYWNjaWRlbnQuXG4gICAgcmV0dXJuIG91dGxldHMgJiYgb3V0bGV0cy5maW5kKG91dGxldCA9PiAhb3V0bGV0Ll9ub2RlIHx8IG91dGxldC5fbm9kZSA9PT0gdGhpcyk7XG4gIH1cbn1cbiJdfQ==