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
class CdkNestedTreeNode extends CdkTreeNode {
    constructor(elementRef, tree, _differs) {
        super(elementRef, tree);
        this._differs = _differs;
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
            childrenNodes
                .pipe(takeUntil(this._destroyed))
                .subscribe(result => this.updateChildrenNodes(result));
        }
        this.nodeOutlet.changes
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => this.updateChildrenNodes());
    }
    // This is a workaround for https://github.com/angular/angular/issues/23091
    // In aot mode, the lifecycle hooks from parent class are not called.
    ngOnInit() {
        super.ngOnInit();
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkNestedTreeNode, deps: [{ token: i0.ElementRef }, { token: i1.CdkTree }, { token: i0.IterableDiffers }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkNestedTreeNode, selector: "cdk-nested-tree-node", inputs: { role: "role", disabled: "disabled", tabIndex: "tabIndex" }, host: { classAttribute: "cdk-nested-tree-node" }, providers: [
            { provide: CdkTreeNode, useExisting: CdkNestedTreeNode },
            { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode },
        ], queries: [{ propertyName: "nodeOutlet", predicate: CdkTreeNodeOutlet, descendants: true }], exportAs: ["cdkNestedTreeNode"], usesInheritance: true, ngImport: i0 }); }
}
export { CdkNestedTreeNode };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkNestedTreeNode, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-nested-tree-node',
                    exportAs: 'cdkNestedTreeNode',
                    inputs: ['role', 'disabled', 'tabIndex'],
                    providers: [
                        { provide: CdkTreeNode, useExisting: CdkNestedTreeNode },
                        { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode },
                    ],
                    host: {
                        'class': 'cdk-nested-tree-node',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.CdkTree }, { type: i0.IterableDiffers }]; }, propDecorators: { nodeOutlet: [{
                type: ContentChildren,
                args: [CdkTreeNodeOutlet, {
                        // We need to use `descendants: true`, because Ivy will no longer match
                        // indirect descendants if it's left as false.
                        descendants: true,
                    }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLW5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvbmVzdGVkLW5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUVMLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUVWLGVBQWUsRUFHZixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFekMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7O0FBRWxFOzs7OztHQUtHO0FBQ0gsTUFZYSxpQkFDWCxTQUFRLFdBQWlCO0lBaUJ6QixZQUNFLFVBQW1DLEVBQ25DLElBQW1CLEVBQ1QsUUFBeUI7UUFFbkMsS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUZkLGFBQVEsR0FBUixRQUFRLENBQWlCO0lBR3JDLENBQUM7SUFFRCxrQkFBa0I7UUFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxFQUFFO1lBQzFGLE1BQU0sbUNBQW1DLEVBQUUsQ0FBQztTQUM3QztRQUNELE1BQU0s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VUFBVSxFQUFFLFVBQVUsQ0FBQztvQkFDeEMsU0FBUyxFQUFFO3dCQUNULEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLG1CQUFtQixFQUFDO3dCQUN0RCxFQUFDLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxXQUFXLG1CQUFtQixFQUFDO3FCQUNyRTtvQkFDRCxJQUFJLEVBQUU7d0JBQ0osT0FBTyxFQUFFLHNCQUFzQjtxQkFDaEM7aUJBQ0Y7cUpBaUJDLFVBQVU7c0JBTFQsZUFBZTt1QkFBQyxpQkFBaUIsRUFBRTt3QkFDbEMsdUVBQXVFO3dCQUN2RSw4Q0FBOEM7d0JBQzlDLFdBQVcsRUFBRSxJQUFJO3FCQUNsQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBRdWVyeUxpc3QsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtpc09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtDREtfVFJFRV9OT0RFX09VVExFVF9OT0RFLCBDZGtUcmVlTm9kZU91dGxldH0gZnJvbSAnLi9vdXRsZXQnO1xuaW1wb3J0IHtDZGtUcmVlLCBDZGtUcmVlTm9kZX0gZnJvbSAnLi90cmVlJztcbmltcG9ydCB7Z2V0VHJlZUNvbnRyb2xGdW5jdGlvbnNNaXNzaW5nRXJyb3J9IGZyb20gJy4vdHJlZS1lcnJvcnMnO1xuXG4vKipcbiAqIE5lc3RlZCBub2RlIGlzIGEgY2hpbGQgb2YgYDxjZGstdHJlZT5gLiBJdCB3b3JrcyB3aXRoIG5lc3RlZCB0cmVlLlxuICogQnkgdXNpbmcgYGNkay1uZXN0ZWQtdHJlZS1ub2RlYCBjb21wb25lbnQgaW4gdHJlZSBub2RlIHRlbXBsYXRlLCBjaGlsZHJlbiBvZiB0aGUgcGFyZW50IG5vZGUgd2lsbFxuICogYmUgYWRkZWQgaW4gdGhlIGBjZGtUcmVlTm9kZU91dGxldGAgaW4gdHJlZSBub2RlIHRlbXBsYXRlLlxuICogVGhlIGNoaWxkcmVuIG9mIG5vZGUgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIGBjZGtUcmVlTm9kZU91dGxldGAuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay1uZXN0ZWQtdHJlZS1ub2RlJyxcbiAgZXhwb3J0QXM6ICdjZGtOZXN0ZWRUcmVlTm9kZScsXG4gIGlucHV0czogWydyb2xlJywgJ2Rpc2FibGVkJywgJ3RhYkluZGV4J10sXG4gIHByb3ZpZGVyczogW1xuICAgIHtwcm92aWRlOiBDZGtUcmVlTm9kZSwgdXNlRXhpc3Rpbmc6IENka05lc3RlZFRyZWVOb2RlfSxcbiAgICB7cHJvdmlkZTogQ0RLX1RSRUVfTk9ERV9PVVRMRVRfTk9ERSwgdXNlRXhpc3Rpbmc6IENka05lc3RlZFRyZWVOb2RlfSxcbiAgXSxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstbmVzdGVkLXRyZWUtbm9kZScsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka05lc3RlZFRyZWVOb2RlPFQsIEsgPSBUPlxuICBleHRlbmRzIENka1RyZWVOb2RlPFQsIEs+XG4gIGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95LCBPbkluaXRcbntcbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPjtcblxuICAvKiogVGhlIGNoaWxkcmVuIGRhdGEgZGF0YU5vZGVzIG9mIGN1cnJlbnQgbm9kZS4gVGhleSB3aWxsIGJlIHBsYWNlZCBpbiBgQ2RrVHJlZU5vZGVPdXRsZXRgLiAqL1xuICBwcm90ZWN0ZWQgX2NoaWxkcmVuOiBUW107XG5cbiAgLyoqIFRoZSBjaGlsZHJlbiBub2RlIHBsYWNlaG9sZGVyLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1RyZWVOb2RlT3V0bGV0LCB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgYGRlc2NlbmRhbnRzOiB0cnVlYCwgYmVjYXVzZSBJdnkgd2lsbCBubyBsb25nZXIgbWF0Y2hcbiAgICAvLyBpbmRpcmVjdCBkZXNjZW5kYW50cyBpZiBpdCdzIGxlZnQgYXMgZmFsc2UuXG4gICAgZGVzY2VuZGFudHM6IHRydWUsXG4gIH0pXG4gIG5vZGVPdXRsZXQ6IFF1ZXJ5TGlzdDxDZGtUcmVlTm9kZU91dGxldD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgdHJlZTogQ2RrVHJlZTxULCBLPixcbiAgICBwcm90ZWN0ZWQgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZiwgdHJlZSk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5fZGF0YURpZmZlciA9IHRoaXMuX2RpZmZlcnMuZmluZChbXSkuY3JlYXRlKHRoaXMuX3RyZWUudHJhY2tCeSk7XG4gICAgaWYgKCF0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldENoaWxkcmVuICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRUcmVlQ29udHJvbEZ1bmN0aW9uc01pc3NpbmdFcnJvcigpO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZHJlbk5vZGVzID0gdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRDaGlsZHJlbih0aGlzLmRhdGEpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuTm9kZXMpKSB7XG4gICAgICB0aGlzLnVwZGF0ZUNoaWxkcmVuTm9kZXMoY2hpbGRyZW5Ob2RlcyBhcyBUW10pO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKGNoaWxkcmVuTm9kZXMpKSB7XG4gICAgICBjaGlsZHJlbk5vZGVzXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHJlc3VsdCA9PiB0aGlzLnVwZGF0ZUNoaWxkcmVuTm9kZXMocmVzdWx0KSk7XG4gICAgfVxuICAgIHRoaXMubm9kZU91dGxldC5jaGFuZ2VzXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy51cGRhdGVDaGlsZHJlbk5vZGVzKCkpO1xuICB9XG5cbiAgLy8gVGhpcyBpcyBhIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzIzMDkxXG4gIC8vIEluIGFvdCBtb2RlLCB0aGUgbGlmZWN5Y2xlIGhvb2tzIGZyb20gcGFyZW50IGNsYXNzIGFyZSBub3QgY2FsbGVkLlxuICBvdmVycmlkZSBuZ09uSW5pdCgpIHtcbiAgICBzdXBlci5uZ09uSW5pdCgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fY2xlYXIoKTtcbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuICB9XG5cbiAgLyoqIEFkZCBjaGlsZHJlbiBkYXRhTm9kZXMgdG8gdGhlIE5vZGVPdXRsZXQgKi9cbiAgcHJvdGVjdGVkIHVwZGF0ZUNoaWxkcmVuTm9kZXMoY2hpbGRyZW4/OiBUW10pOiB2b2lkIHtcbiAgICBjb25zdCBvdXRsZXQgPSB0aGlzLl9nZXROb2RlT3V0bGV0KCk7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICB0aGlzLl9jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICAgIH1cbiAgICBpZiAob3V0bGV0ICYmIHRoaXMuX2NoaWxkcmVuKSB7XG4gICAgICBjb25zdCB2aWV3Q29udGFpbmVyID0gb3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgICB0aGlzLl90cmVlLnJlbmRlck5vZGVDaGFuZ2VzKHRoaXMuX2NoaWxkcmVuLCB0aGlzLl9kYXRhRGlmZmVyLCB2aWV3Q29udGFpbmVyLCB0aGlzLl9kYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVzZXQgdGhlIGRhdGEgZGlmZmVyIGlmIHRoZXJlJ3Mgbm8gY2hpbGRyZW4gbm9kZXMgZGlzcGxheWVkXG4gICAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhciB0aGUgY2hpbGRyZW4gZGF0YU5vZGVzLiAqL1xuICBwcm90ZWN0ZWQgX2NsZWFyKCk6IHZvaWQge1xuICAgIGNvbnN0IG91dGxldCA9IHRoaXMuX2dldE5vZGVPdXRsZXQoKTtcbiAgICBpZiAob3V0bGV0KSB7XG4gICAgICBvdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgb3V0bGV0IGZvciB0aGUgY3VycmVudCBub2RlLiAqL1xuICBwcml2YXRlIF9nZXROb2RlT3V0bGV0KCkge1xuICAgIGNvbnN0IG91dGxldHMgPSB0aGlzLm5vZGVPdXRsZXQ7XG5cbiAgICAvLyBOb3RlIHRoYXQgc2luY2Ugd2UgdXNlIGBkZXNjZW5kYW50czogdHJ1ZWAgb24gdGhlIHF1ZXJ5LCB3ZSBoYXZlIHRvIGVuc3VyZVxuICAgIC8vIHRoYXQgd2UgZG9uJ3QgcGljayB1cCB0aGUgb3V0bGV0IG9mIGEgY2hpbGQgbm9kZSBieSBhY2NpZGVudC5cbiAgICByZXR1cm4gb3V0bGV0cyAmJiBvdXRsZXRzLmZpbmQob3V0bGV0ID0+ICFvdXRsZXQuX25vZGUgfHwgb3V0bGV0Ll9ub2RlID09PSB0aGlzKTtcbiAgfVxufVxuIl19