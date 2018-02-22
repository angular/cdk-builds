/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, OnDestroy, QueryList } from '@angular/core';
import { CdkTree, CdkTreeNode } from './tree';
import { CdkTreeNodeOutlet } from './outlet';
/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * For example:
 *   ```html
 *   <cdk-mested-tree-node>
 *     {{node.name}}
 *     <ng-template cdkTreeNodeOutlet></ng-template>
 *   </cdk-tree-node>
 *   ```
 * The children of node will be automatically added to `cdkTreeNodeOutlet`, the result dom will be
 * like this:
 *   ```html
 *   <cdk-nested-tree-node>
 *     {{node.name}}
 *      <cdk-nested-tree-node>{{child1.name}}</cdk-tree-node>
 *      <cdk-nested-tree-node>{{child2.name}}</cdk-tree-node>
 *   </cdk-tree-node>
 *   ```
 */
export declare class CdkNestedTreeNode<T> extends CdkTreeNode<T> implements AfterContentInit, OnDestroy {
    protected _elementRef: ElementRef;
    protected _tree: CdkTree<T>;
    /** The children data dataNodes of current node. They will be placed in `CdkTreeNodeOutlet`. */
    protected _children: T[];
    /** The children node placeholder. */
    nodeOutlet: QueryList<CdkTreeNodeOutlet>;
    constructor(_elementRef: ElementRef, _tree: CdkTree<T>);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Add children dataNodes to the NodeOutlet */
    protected _addChildrenNodes(): void;
    /** Clear the children dataNodes. */
    protected _clear(): void;
}
