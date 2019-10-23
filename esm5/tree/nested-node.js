import { __extends } from "tslib";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ContentChildren, Directive, ElementRef, IterableDiffers, QueryList, } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CDK_TREE_NODE_OUTLET_NODE, CdkTreeNodeOutlet } from './outlet';
import { CdkTree, CdkTreeNode } from './tree';
import { getTreeControlFunctionsMissingError } from './tree-errors';
/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * For example:
 *   ```html
 *   <cdk-nested-tree-node>
 *     {{node.name}}
 *     <ng-template cdkTreeNodeOutlet></ng-template>
 *   </cdk-nested-tree-node>
 *   ```
 * The children of node will be automatically added to `cdkTreeNodeOutlet`, the result dom will be
 * like this:
 *   ```html
 *   <cdk-nested-tree-node>
 *     {{node.name}}
 *      <cdk-nested-tree-node>{{child1.name}}</cdk-nested-tree-node>
 *      <cdk-nested-tree-node>{{child2.name}}</cdk-nested-tree-node>
 *   </cdk-nested-tree-node>
 *   ```
 */
var CdkNestedTreeNode = /** @class */ (function (_super) {
    __extends(CdkNestedTreeNode, _super);
    function CdkNestedTreeNode(_elementRef, _tree, _differs) {
        var _this = _super.call(this, _elementRef, _tree) || this;
        _this._elementRef = _elementRef;
        _this._tree = _tree;
        _this._differs = _differs;
        return _this;
    }
    CdkNestedTreeNode.prototype.ngAfterContentInit = function () {
        var _this = this;
        this._dataDiffer = this._differs.find([]).create(this._tree.trackBy);
        if (!this._tree.treeControl.getChildren) {
            throw getTreeControlFunctionsMissingError();
        }
        var childrenNodes = this._tree.treeControl.getChildren(this.data);
        if (Array.isArray(childrenNodes)) {
            this.updateChildrenNodes(childrenNodes);
        }
        else if (childrenNodes instanceof Observable) {
            childrenNodes.pipe(takeUntil(this._destroyed))
                .subscribe(function (result) { return _this.updateChildrenNodes(result); });
        }
        this.nodeOutlet.changes.pipe(takeUntil(this._destroyed))
            .subscribe(function () { return _this.updateChildrenNodes(); });
    };
    CdkNestedTreeNode.prototype.ngOnDestroy = function () {
        this._clear();
        _super.prototype.ngOnDestroy.call(this);
    };
    /** Add children dataNodes to the NodeOutlet */
    CdkNestedTreeNode.prototype.updateChildrenNodes = function (children) {
        var outlet = this._getNodeOutlet();
        if (children) {
            this._children = children;
        }
        if (outlet && this._children) {
            var viewContainer = outlet.viewContainer;
            this._tree.renderNodeChanges(this._children, this._dataDiffer, viewContainer, this._data);
        }
        else {
            // Reset the data differ if there's no children nodes displayed
            this._dataDiffer.diff([]);
        }
    };
    /** Clear the children dataNodes. */
    CdkNestedTreeNode.prototype._clear = function () {
        var outlet = this._getNodeOutlet();
        if (outlet) {
            outlet.viewContainer.clear();
            this._dataDiffer.diff([]);
        }
    };
    /** Gets the outlet for the current node. */
    CdkNestedTreeNode.prototype._getNodeOutlet = function () {
        var _this = this;
        var outlets = this.nodeOutlet;
        // Note that since we use `descendants: true` on the query, we have to ensure
        // that we don't pick up the outlet of a child node by accident.
        return outlets && outlets.find(function (outlet) { return !outlet._node || outlet._node === _this; });
    };
    CdkNestedTreeNode.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-nested-tree-node',
                    exportAs: 'cdkNestedTreeNode',
                    host: {
                        '[attr.aria-expanded]': 'isExpanded',
                        '[attr.role]': 'role',
                        'class': 'cdk-tree-node cdk-nested-tree-node',
                    },
                    providers: [
                        { provide: CdkTreeNode, useExisting: CdkNestedTreeNode },
                        { provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode }
                    ]
                },] }
    ];
    /** @nocollapse */
    CdkNestedTreeNode.ctorParameters = function () { return [
        { type: ElementRef },
        { type: CdkTree },
        { type: IterableDiffers }
    ]; };
    CdkNestedTreeNode.propDecorators = {
        nodeOutlet: [{ type: ContentChildren, args: [CdkTreeNodeOutlet, {
                        // We need to use `descendants: true`, because Ivy will no longer match
                        // indirect descendants if it's left as false.
                        descendants: true
                    },] }]
    };
    return CdkNestedTreeNode;
}(CdkTreeNode));
export { CdkNestedTreeNode };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzdGVkLW5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvbmVzdGVkLW5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFFTCxlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFFVixlQUFlLEVBRWYsU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDaEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXpDLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0RSxPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUM1QyxPQUFPLEVBQUMsbUNBQW1DLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFbEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBQ0g7SUFhMEMscUNBQWM7SUFldEQsMkJBQXNCLFdBQW9DLEVBQ3BDLEtBQWlCLEVBQ2pCLFFBQXlCO1FBRi9DLFlBR0Usa0JBQU0sV0FBVyxFQUFFLEtBQUssQ0FBQyxTQUMxQjtRQUpxQixpQkFBVyxHQUFYLFdBQVcsQ0FBeUI7UUFDcEMsV0FBSyxHQUFMLEtBQUssQ0FBWTtRQUNqQixjQUFRLEdBQVIsUUFBUSxDQUFpQjs7SUFFL0MsQ0FBQztJQUVELDhDQUFrQixHQUFsQjtRQUFBLGlCQWNDO1FBYkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO1lBQ3ZDLE1BQU0sbUNBQW1DLEVBQUUsQ0FBQztTQUM3QztRQUNELElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ2hDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxhQUFvQixDQUFDLENBQUM7U0FDaEQ7YUFBTSxJQUFJLGFBQWEsWUFBWSxVQUFVLEVBQUU7WUFDOUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUMzQyxTQUFTLENBQUMsVUFBQSxNQUFNLElBQUksT0FBQSxLQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQWhDLENBQWdDLENBQUMsQ0FBQztTQUMxRDtRQUNELElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ25ELFNBQVMsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLG1CQUFtQixFQUFFLEVBQTFCLENBQTBCLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsdUNBQVcsR0FBWDtRQUNFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLGlCQUFNLFdBQVcsV0FBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCwrQ0FBK0M7SUFDckMsK0NBQW1CLEdBQTdCLFVBQThCLFFBQWM7UUFDMUMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3JDLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7U0FDM0I7UUFDRCxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQzVCLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDM0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMzRjthQUFNO1lBQ0wsK0RBQStEO1lBQy9ELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQztJQUVELG9DQUFvQztJQUMxQixrQ0FBTSxHQUFoQjtRQUNFLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQyxJQUFJLE1BQU0sRUFBRTtZQUNWLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDM0I7SUFDSCxDQUFDO0lBRUQsNENBQTRDO0lBQ3BDLDBDQUFjLEdBQXRCO1FBQUEsaUJBTUM7UUFMQyxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRWhDLDZFQUE2RTtRQUM3RSxnRUFBZ0U7UUFDaEUsT0FBTyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sSUFBSSxPQUFBLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxLQUFLLEtBQUksRUFBdEMsQ0FBc0MsQ0FBQyxDQUFDO0lBQ25GLENBQUM7O2dCQXRGRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLHNCQUFzQjtvQkFDaEMsUUFBUSxFQUFFLG1CQUFtQjtvQkFDN0IsSUFBSSxFQUFFO3dCQUNKLHNCQUFzQixFQUFFLFlBQVk7d0JBQ3BDLGFBQWEsRUFBRSxNQUFNO3dCQUNyQixPQUFPLEVBQUUsb0NBQW9DO3FCQUM5QztvQkFDRCxTQUFTLEVBQUU7d0JBQ1QsRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQzt3QkFDdEQsRUFBQyxPQUFPLEVBQUUseUJBQXlCLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFDO3FCQUNyRTtpQkFDRjs7OztnQkE5Q0MsVUFBVTtnQkFVSixPQUFPO2dCQVJiLGVBQWU7Ozs2QkFxRGQsZUFBZSxTQUFDLGlCQUFpQixFQUFFO3dCQUNsQyx1RUFBdUU7d0JBQ3ZFLDhDQUE4Qzt3QkFDOUMsV0FBVyxFQUFFLElBQUk7cUJBQ2xCOztJQThESCx3QkFBQztDQUFBLEFBdkZELENBYTBDLFdBQVcsR0EwRXBEO1NBMUVZLGlCQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEl0ZXJhYmxlRGlmZmVyLFxuICBJdGVyYWJsZURpZmZlcnMsXG4gIE9uRGVzdHJveSxcbiAgUXVlcnlMaXN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0NES19UUkVFX05PREVfT1VUTEVUX05PREUsIENka1RyZWVOb2RlT3V0bGV0fSBmcm9tICcuL291dGxldCc7XG5pbXBvcnQge0Nka1RyZWUsIENka1RyZWVOb2RlfSBmcm9tICcuL3RyZWUnO1xuaW1wb3J0IHtnZXRUcmVlQ29udHJvbEZ1bmN0aW9uc01pc3NpbmdFcnJvcn0gZnJvbSAnLi90cmVlLWVycm9ycyc7XG5cbi8qKlxuICogTmVzdGVkIG5vZGUgaXMgYSBjaGlsZCBvZiBgPGNkay10cmVlPmAuIEl0IHdvcmtzIHdpdGggbmVzdGVkIHRyZWUuXG4gKiBCeSB1c2luZyBgY2RrLW5lc3RlZC10cmVlLW5vZGVgIGNvbXBvbmVudCBpbiB0cmVlIG5vZGUgdGVtcGxhdGUsIGNoaWxkcmVuIG9mIHRoZSBwYXJlbnQgbm9kZSB3aWxsXG4gKiBiZSBhZGRlZCBpbiB0aGUgYGNka1RyZWVOb2RlT3V0bGV0YCBpbiB0cmVlIG5vZGUgdGVtcGxhdGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqICAgYGBgaHRtbFxuICogICA8Y2RrLW5lc3RlZC10cmVlLW5vZGU+XG4gKiAgICAge3tub2RlLm5hbWV9fVxuICogICAgIDxuZy10ZW1wbGF0ZSBjZGtUcmVlTm9kZU91dGxldD48L25nLXRlbXBsYXRlPlxuICogICA8L2Nkay1uZXN0ZWQtdHJlZS1ub2RlPlxuICogICBgYGBcbiAqIFRoZSBjaGlsZHJlbiBvZiBub2RlIHdpbGwgYmUgYXV0b21hdGljYWxseSBhZGRlZCB0byBgY2RrVHJlZU5vZGVPdXRsZXRgLCB0aGUgcmVzdWx0IGRvbSB3aWxsIGJlXG4gKiBsaWtlIHRoaXM6XG4gKiAgIGBgYGh0bWxcbiAqICAgPGNkay1uZXN0ZWQtdHJlZS1ub2RlPlxuICogICAgIHt7bm9kZS5uYW1lfX1cbiAqICAgICAgPGNkay1uZXN0ZWQtdHJlZS1ub2RlPnt7Y2hpbGQxLm5hbWV9fTwvY2RrLW5lc3RlZC10cmVlLW5vZGU+XG4gKiAgICAgIDxjZGstbmVzdGVkLXRyZWUtbm9kZT57e2NoaWxkMi5uYW1lfX08L2Nkay1uZXN0ZWQtdHJlZS1ub2RlPlxuICogICA8L2Nkay1uZXN0ZWQtdHJlZS1ub2RlPlxuICogICBgYGBcbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLW5lc3RlZC10cmVlLW5vZGUnLFxuICBleHBvcnRBczogJ2Nka05lc3RlZFRyZWVOb2RlJyxcbiAgaG9zdDoge1xuICAgICdbYXR0ci5hcmlhLWV4cGFuZGVkXSc6ICdpc0V4cGFuZGVkJyxcbiAgICAnW2F0dHIucm9sZV0nOiAncm9sZScsXG4gICAgJ2NsYXNzJzogJ2Nkay10cmVlLW5vZGUgY2RrLW5lc3RlZC10cmVlLW5vZGUnLFxuICB9LFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogQ2RrVHJlZU5vZGUsIHVzZUV4aXN0aW5nOiBDZGtOZXN0ZWRUcmVlTm9kZX0sXG4gICAge3Byb3ZpZGU6IENES19UUkVFX05PREVfT1VUTEVUX05PREUsIHVzZUV4aXN0aW5nOiBDZGtOZXN0ZWRUcmVlTm9kZX1cbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBDZGtOZXN0ZWRUcmVlTm9kZTxUPiBleHRlbmRzIENka1RyZWVOb2RlPFQ+IGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPjtcblxuICAvKiogVGhlIGNoaWxkcmVuIGRhdGEgZGF0YU5vZGVzIG9mIGN1cnJlbnQgbm9kZS4gVGhleSB3aWxsIGJlIHBsYWNlZCBpbiBgQ2RrVHJlZU5vZGVPdXRsZXRgLiAqL1xuICBwcm90ZWN0ZWQgX2NoaWxkcmVuOiBUW107XG5cbiAgLyoqIFRoZSBjaGlsZHJlbiBub2RlIHBsYWNlaG9sZGVyLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1RyZWVOb2RlT3V0bGV0LCB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgYGRlc2NlbmRhbnRzOiB0cnVlYCwgYmVjYXVzZSBJdnkgd2lsbCBubyBsb25nZXIgbWF0Y2hcbiAgICAvLyBpbmRpcmVjdCBkZXNjZW5kYW50cyBpZiBpdCdzIGxlZnQgYXMgZmFsc2UuXG4gICAgZGVzY2VuZGFudHM6IHRydWVcbiAgfSlcbiAgbm9kZU91dGxldDogUXVlcnlMaXN0PENka1RyZWVOb2RlT3V0bGV0PjtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBwcm90ZWN0ZWQgX3RyZWU6IENka1RyZWU8VD4sXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzKSB7XG4gICAgc3VwZXIoX2VsZW1lbnRSZWYsIF90cmVlKTtcbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKFtdKS5jcmVhdGUodGhpcy5fdHJlZS50cmFja0J5KTtcbiAgICBpZiAoIXRoaXMuX3RyZWUudHJlZUNvbnRyb2wuZ2V0Q2hpbGRyZW4pIHtcbiAgICAgIHRocm93IGdldFRyZWVDb250cm9sRnVuY3Rpb25zTWlzc2luZ0Vycm9yKCk7XG4gICAgfVxuICAgIGNvbnN0IGNoaWxkcmVuTm9kZXMgPSB0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldENoaWxkcmVuKHRoaXMuZGF0YSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW5Ob2RlcykpIHtcbiAgICAgIHRoaXMudXBkYXRlQ2hpbGRyZW5Ob2RlcyhjaGlsZHJlbk5vZGVzIGFzIFRbXSk7XG4gICAgfSBlbHNlIGlmIChjaGlsZHJlbk5vZGVzIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSkge1xuICAgICAgY2hpbGRyZW5Ob2Rlcy5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKHJlc3VsdCA9PiB0aGlzLnVwZGF0ZUNoaWxkcmVuTm9kZXMocmVzdWx0KSk7XG4gICAgfVxuICAgIHRoaXMubm9kZU91dGxldC5jaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy51cGRhdGVDaGlsZHJlbk5vZGVzKCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fY2xlYXIoKTtcbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuICB9XG5cbiAgLyoqIEFkZCBjaGlsZHJlbiBkYXRhTm9kZXMgdG8gdGhlIE5vZGVPdXRsZXQgKi9cbiAgcHJvdGVjdGVkIHVwZGF0ZUNoaWxkcmVuTm9kZXMoY2hpbGRyZW4/OiBUW10pOiB2b2lkIHtcbiAgICBjb25zdCBvdXRsZXQgPSB0aGlzLl9nZXROb2RlT3V0bGV0KCk7XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICB0aGlzLl9jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICAgIH1cbiAgICBpZiAob3V0bGV0ICYmIHRoaXMuX2NoaWxkcmVuKSB7XG4gICAgICBjb25zdCB2aWV3Q29udGFpbmVyID0gb3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgICB0aGlzLl90cmVlLnJlbmRlck5vZGVDaGFuZ2VzKHRoaXMuX2NoaWxkcmVuLCB0aGlzLl9kYXRhRGlmZmVyLCB2aWV3Q29udGFpbmVyLCB0aGlzLl9kYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVzZXQgdGhlIGRhdGEgZGlmZmVyIGlmIHRoZXJlJ3Mgbm8gY2hpbGRyZW4gbm9kZXMgZGlzcGxheWVkXG4gICAgICB0aGlzLl9kYXRhRGlmZmVyLmRpZmYoW10pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbGVhciB0aGUgY2hpbGRyZW4gZGF0YU5vZGVzLiAqL1xuICBwcm90ZWN0ZWQgX2NsZWFyKCk6IHZvaWQge1xuICAgIGNvbnN0IG91dGxldCA9IHRoaXMuX2dldE5vZGVPdXRsZXQoKTtcbiAgICBpZiAob3V0bGV0KSB7XG4gICAgICBvdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgICAgdGhpcy5fZGF0YURpZmZlci5kaWZmKFtdKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0cyB0aGUgb3V0bGV0IGZvciB0aGUgY3VycmVudCBub2RlLiAqL1xuICBwcml2YXRlIF9nZXROb2RlT3V0bGV0KCkge1xuICAgIGNvbnN0IG91dGxldHMgPSB0aGlzLm5vZGVPdXRsZXQ7XG5cbiAgICAvLyBOb3RlIHRoYXQgc2luY2Ugd2UgdXNlIGBkZXNjZW5kYW50czogdHJ1ZWAgb24gdGhlIHF1ZXJ5LCB3ZSBoYXZlIHRvIGVuc3VyZVxuICAgIC8vIHRoYXQgd2UgZG9uJ3QgcGljayB1cCB0aGUgb3V0bGV0IG9mIGEgY2hpbGQgbm9kZSBieSBhY2NpZGVudC5cbiAgICByZXR1cm4gb3V0bGV0cyAmJiBvdXRsZXRzLmZpbmQob3V0bGV0ID0+ICFvdXRsZXQuX25vZGUgfHwgb3V0bGV0Ll9ub2RlID09PSB0aGlzKTtcbiAgfVxufVxuIl19