/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SelectionModel } from '@angular/cdk/collections';
import { take } from 'rxjs/operators/take';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, Input, IterableDiffers, NgModule, Optional, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { takeUntil } from 'rxjs/operators/takeUntil';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { FocusMonitor } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Base tree control. It has basic toggle/expand/collapse operations on a single data node.
 * @abstract
 */
class BaseTreeControl {
    constructor() {
        /**
         * A selection model with multi-selection to track expansion status.
         */
        this.expansionModel = new SelectionModel(true);
    }
    /**
     * Toggles one single data node's expanded/collapsed state.
     * @param {?} dataNode
     * @return {?}
     */
    toggle(dataNode) {
        this.expansionModel.toggle(dataNode);
    }
    /**
     * Expands one single data node.
     * @param {?} dataNode
     * @return {?}
     */
    expand(dataNode) {
        this.expansionModel.select(dataNode);
    }
    /**
     * Collapses one single data node.
     * @param {?} dataNode
     * @return {?}
     */
    collapse(dataNode) {
        this.expansionModel.deselect(dataNode);
    }
    /**
     * Whether a given data node is expanded or not. Returns true if the data node is expanded.
     * @param {?} dataNode
     * @return {?}
     */
    isExpanded(dataNode) {
        return this.expansionModel.isSelected(dataNode);
    }
    /**
     * Toggles a subtree rooted at `node` recursively.
     * @param {?} dataNode
     * @return {?}
     */
    toggleDescendants(dataNode) {
        this.expansionModel.isSelected(dataNode)
            ? this.collapseDescendants(dataNode)
            : this.expandDescendants(dataNode);
    }
    /**
     * Collapse all dataNodes in the tree.
     * @return {?}
     */
    collapseAll() {
        this.expansionModel.clear();
    }
    /**
     * Expands a subtree rooted at given data node recursively.
     * @param {?} dataNode
     * @return {?}
     */
    expandDescendants(dataNode) {
        let /** @type {?} */ toBeProcessed = [dataNode];
        toBeProcessed.push(...this.getDescendants(dataNode));
        this.expansionModel.select(...toBeProcessed);
    }
    /**
     * Collapses a subtree rooted at given data node recursively.
     * @param {?} dataNode
     * @return {?}
     */
    collapseDescendants(dataNode) {
        let /** @type {?} */ toBeProcessed = [dataNode];
        toBeProcessed.push(...this.getDescendants(dataNode));
        this.expansionModel.deselect(...toBeProcessed);
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Flat tree control. Able to expand/collapse a subtree recursively for flattened tree.
 */
class FlatTreeControl extends BaseTreeControl {
    /**
     * Construct with flat tree data node functions getLevel and isExpandable.
     * @param {?} getLevel
     * @param {?} isExpandable
     */
    constructor(getLevel, isExpandable) {
        super();
        this.getLevel = getLevel;
        this.isExpandable = isExpandable;
    }
    /**
     * Gets a list of the data node's subtree of descendent data nodes.
     *
     * To make this working, the `dataNodes` of the TreeControl must be flattened tree nodes
     * with correct levels.
     * @param {?} dataNode
     * @return {?}
     */
    getDescendants(dataNode) {
        const /** @type {?} */ startIndex = this.dataNodes.indexOf(dataNode);
        const /** @type {?} */ results = [];
        // Goes through flattened tree nodes in the `dataNodes` array, and get all descendants.
        // The level of descendants of a tree node must be greater than the level of the given
        // tree node.
        // If we reach a node whose level is equal to the level of the tree node, we hit a sibling.
        // If we reach a node whose level is greater than the level of the tree node, we hit a
        // sibling of an ancestor.
        for (let /** @type {?} */ i = startIndex + 1; i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]); i++) {
            results.push(this.dataNodes[i]);
        }
        return results;
    }
    /**
     * Expands all data nodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all flattened
     * data nodes of the tree.
     * @return {?}
     */
    expandAll() {
        this.expansionModel.select(...this.dataNodes);
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Nested tree control. Able to expand/collapse a subtree recursively for NestedNode type.
 */
class NestedTreeControl extends BaseTreeControl {
    /**
     * Construct with nested tree function getChildren.
     * @param {?} getChildren
     */
    constructor(getChildren) {
        super();
        this.getChildren = getChildren;
    }
    /**
     * Expands all dataNodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all root level
     * data nodes of the tree.
     * @return {?}
     */
    expandAll() {
        this.expansionModel.clear();
        let /** @type {?} */ toBeExpanded = /** @type {?} */ ([]);
        this.dataNodes.forEach(dataNode => toBeExpanded.push(...this.getDescendants(dataNode)));
        this.expansionModel.select(...toBeExpanded);
    }
    /**
     * Gets a list of descendant dataNodes of a subtree rooted at given data node recursively.
     * @param {?} dataNode
     * @return {?}
     */
    getDescendants(dataNode) {
        const /** @type {?} */ descendants = [];
        this._getDescendants(descendants, dataNode);
        return descendants;
    }
    /**
     * A helper function to get descendants recursively.
     * @param {?} descendants
     * @param {?} dataNode
     * @return {?}
     */
    _getDescendants(descendants, dataNode) {
        descendants.push(dataNode);
        this.getChildren(dataNode).pipe(take(1)).subscribe(children => {
            if (children && children.length > 0) {
                children.forEach((child) => this._getDescendants(descendants, child));
            }
        });
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Context provided to the tree node component.
 */
class CdkTreeNodeOutletContext {
    /**
     * @param {?} data
     */
    constructor(data) {
        this.$implicit = data;
    }
}
/**
 * Data node definition for the CdkTree.
 * Captures the node's template and a when predicate that describes when this node should be used.
 */
class CdkTreeNodeDef {
    /**
     * \@docs-private
     * @param {?} template
     */
    constructor(template) {
        this.template = template;
    }
}
CdkTreeNodeDef.decorators = [
    { type: Directive, args: [{
                selector: '[cdkTreeNodeDef]',
                inputs: [
                    'when: cdkTreeNodeDefWhen'
                ],
            },] },
];
/** @nocollapse */
CdkTreeNodeDef.ctorParameters = () => [
    { type: TemplateRef, },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Outlet for nested CdkNode. Put `[cdkTreeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 */
class CdkTreeNodeOutlet {
    /**
     * @param {?} viewContainer
     */
    constructor(viewContainer) {
        this.viewContainer = viewContainer;
    }
}
CdkTreeNodeOutlet.decorators = [
    { type: Directive, args: [{
                selector: '[cdkTreeNodeOutlet]'
            },] },
];
/** @nocollapse */
CdkTreeNodeOutlet.ctorParameters = () => [
    { type: ViewContainerRef, },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Returns an error to be thrown when there is no usable data.
 * \@docs-private
 * @return {?}
 */
function getTreeNoValidDataSourceError() {
    return Error(`A valid data source must be provided.`);
}
/**
 * Returns an error to be thrown when there are multiple nodes that are missing a when function.
 * \@docs-private
 * @return {?}
 */
function getTreeMultipleDefaultNodeDefsError() {
    return Error(`There can only be one default row without a when predicate function.`);
}
/**
 * Returns an error to be thrown when there are no matching node defs for a particular set of data.
 * \@docs-private
 * @return {?}
 */
function getTreeMissingMatchingNodeDefError() {
    return Error(`Could not find a matching node definition for the provided node data.`);
}
/**
 * Returns an error to be thrown when there are tree control.
 * \@docs-private
 * @return {?}
 */
function getTreeControlMissingError() {
    return Error(`Could not find a tree control for the tree.`);
}
/**
 * Returns an error to be thrown when tree control did not implement functions for flat/nested node.
 * \@docs-private
 * @return {?}
 */
function getTreeControlFunctionsMissingError() {
    return Error(`Could not find functions for nested/flat tree in tree control.`);
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Tree node for CdkTree. It contains the data in the tree node.
 */
class CdkTreeNode {
    /**
     * @param {?} _elementRef
     * @param {?} _tree
     */
    constructor(_elementRef, _tree) {
        this._elementRef = _elementRef;
        this._tree = _tree;
        /**
         * Subject that emits when the component has been destroyed.
         */
        this._destroyed = new Subject();
        /**
         * The role of the node should be 'group' if it's an internal node,
         * and 'treeitem' if it's a leaf node.
         */
        this.role = 'treeitem';
        CdkTreeNode.mostRecentTreeNode = /** @type {?} */ (this);
    }
    /**
     * The tree node's data.
     * @return {?}
     */
    get data() { return this._data; }
    /**
     * @param {?} value
     * @return {?}
     */
    set data(value) {
        this._data = value;
        this._setRoleFromData();
    }
    /**
     * @return {?}
     */
    get isExpanded() {
        return this._tree.treeControl.isExpanded(this._data);
    }
    /**
     * @return {?}
     */
    get level() {
        return this._tree.treeControl.getLevel ? this._tree.treeControl.getLevel(this._data) : 0;
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Focuses the menu item. Implements for FocusableOption.
     * @return {?}
     */
    focus() {
        this._elementRef.nativeElement.focus();
    }
    /**
     * @return {?}
     */
    _setRoleFromData() {
        if (this._tree.treeControl.isExpandable) {
            this.role = this._tree.treeControl.isExpandable(this._data) ? 'group' : 'treeitem';
        }
        else {
            if (!this._tree.treeControl.getChildren) {
                throw getTreeControlFunctionsMissingError();
            }
            this._tree.treeControl.getChildren(this._data).pipe(takeUntil(this._destroyed))
                .subscribe(children => {
                this.role = children && children.length ? 'group' : 'treeitem';
            });
        }
    }
}
/**
 * The most recently created `CdkTreeNode`. We save it in static variable so we can retrieve it
 * in `CdkTree` and set the data to it.
 */
CdkTreeNode.mostRecentTreeNode = null;
CdkTreeNode.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-tree-node',
                exportAs: 'cdkTreeNode',
                host: {
                    '[attr.aria-expanded]': 'isExpanded',
                    '[attr.aria-level]': 'level',
                    '[attr.role]': 'role',
                    'class': 'cdk-tree-node',
                },
            },] },
];
/** @nocollapse */
CdkTreeNode.ctorParameters = () => [
    { type: ElementRef, },
    { type: CdkTree, },
];
CdkTreeNode.propDecorators = {
    "role": [{ type: Input },],
};
/**
 * CDK tree component that connects with a data source to retrieve data of type `T` and renders
 * dataNodes with hierarchy. Updates the dataNodes when new data is provided by the data source.
 */
class CdkTree {
    /**
     * @param {?} _differs
     * @param {?} _changeDetectorRef
     */
    constructor(_differs, _changeDetectorRef) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        /**
         * Subject that emits when the component has been destroyed.
         */
        this._onDestroy = new Subject();
        /**
         * Stream containing the latest information on what rows are being displayed on screen.
         * Can be used by the data source to as a heuristic of what data should be provided.
         */
        this.viewChange = new BehaviorSubject({ start: 0, end: Number.MAX_VALUE });
    }
    /**
     * Provides a stream containing the latest data array to render. Influenced by the tree's
     * stream of view window (what dataNodes are currently on screen).
     * Data source can be an observable of data array, or a dara array to render.
     * @return {?}
     */
    get dataSource() { return this._dataSource; }
    /**
     * @param {?} dataSource
     * @return {?}
     */
    set dataSource(dataSource) {
        if (this._dataSource !== dataSource) {
            this._switchDataSource(dataSource);
        }
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._dataDiffer = this._differs.find([]).create();
        if (!this.treeControl) {
            throw getTreeControlMissingError();
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._nodeOutlet.viewContainer.clear();
        this._onDestroy.next();
        this._onDestroy.complete();
        if (this._dataSource && typeof (/** @type {?} */ (this._dataSource)).disconnect === 'function') {
            (/** @type {?} */ (this.dataSource)).disconnect(this);
        }
        if (this._dataSubscription) {
            this._dataSubscription.unsubscribe();
            this._dataSubscription = null;
        }
    }
    /**
     * @return {?}
     */
    ngAfterContentChecked() {
        const /** @type {?} */ defaultNodeDefs = this._nodeDefs.filter(def => !def.when);
        if (defaultNodeDefs.length > 1) {
            throw getTreeMultipleDefaultNodeDefsError();
        }
        this._defaultNodeDef = defaultNodeDefs[0];
        if (this.dataSource && this._nodeDefs && !this._dataSubscription) {
            this._observeRenderChanges();
        }
    }
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the node outlet. Otherwise start listening for new data.
     * @param {?} dataSource
     * @return {?}
     */
    _switchDataSource(dataSource) {
        if (this._dataSource && typeof (/** @type {?} */ (this._dataSource)).disconnect === 'function') {
            (/** @type {?} */ (this.dataSource)).disconnect(this);
        }
        if (this._dataSubscription) {
            this._dataSubscription.unsubscribe();
            this._dataSubscription = null;
        }
        // Remove the all dataNodes if there is now no data source
        if (!dataSource) {
            this._nodeOutlet.viewContainer.clear();
        }
        this._dataSource = dataSource;
        if (this._nodeDefs) {
            this._observeRenderChanges();
        }
    }
    /**
     * Set up a subscription for the data provided by the data source.
     * @return {?}
     */
    _observeRenderChanges() {
        let /** @type {?} */ dataStream;
        // Cannot use `instanceof DataSource` since the data source could be a literal with
        // `connect` function and may not extends DataSource.
        if (typeof (/** @type {?} */ (this._dataSource)).connect === 'function') {
            dataStream = (/** @type {?} */ (this._dataSource)).connect(this);
        }
        else if (this._dataSource instanceof Observable) {
            dataStream = this._dataSource;
        }
        else if (Array.isArray(this._dataSource)) {
            dataStream = of(this._dataSource);
        }
        if (dataStream) {
            this._dataSubscription = dataStream.pipe(takeUntil(this._onDestroy))
                .subscribe(data => this._renderNodeChanges(data));
        }
        else {
            throw getTreeNoValidDataSourceError();
        }
    }
    /**
     * Check for changes made in the data and render each change (node added/removed/moved).
     * @param {?} dataNodes
     * @return {?}
     */
    _renderNodeChanges(dataNodes) {
        const /** @type {?} */ changes = this._dataDiffer.diff(dataNodes);
        if (!changes) {
            return;
        }
        const /** @type {?} */ viewContainer = this._nodeOutlet.viewContainer;
        changes.forEachOperation((item, adjustedPreviousIndex, currentIndex) => {
            if (item.previousIndex == null) {
                this.insertNode(dataNodes[currentIndex], currentIndex);
            }
            else if (currentIndex == null) {
                viewContainer.remove(adjustedPreviousIndex);
            }
            else {
                const /** @type {?} */ view = viewContainer.get(adjustedPreviousIndex);
                viewContainer.move(/** @type {?} */ ((view)), currentIndex);
            }
        });
    }
    /**
     * Finds the matching node definition that should be used for this node data. If there is only
     * one node definition, it is returned. Otherwise, find the node definition that has a when
     * predicate that returns true with the data. If none return true, return the default node
     * definition.
     * @param {?} data
     * @param {?} i
     * @return {?}
     */
    _getNodeDef(data, i) {
        if (this._nodeDefs.length === 1) {
            return this._nodeDefs.first;
        }
        const /** @type {?} */ nodeDef = this._nodeDefs.find(def => def.when && def.when(i, data)) || this._defaultNodeDef;
        if (!nodeDef) {
            throw getTreeMissingMatchingNodeDefError();
        }
        return nodeDef;
    }
    /**
     * Create the embedded view for the data node template and place it in the correct index location
     * within the data node view container.
     * @param {?} nodeData
     * @param {?} index
     * @param {?=} viewContainer
     * @return {?}
     */
    insertNode(nodeData, index, viewContainer) {
        const /** @type {?} */ node = this._getNodeDef(nodeData, index);
        // Node context that will be provided to created embedded view
        const /** @type {?} */ context = new CdkTreeNodeOutletContext(nodeData);
        // Use default tree nodeOutlet, or nested node's nodeOutlet
        const /** @type {?} */ container = viewContainer ? viewContainer : this._nodeOutlet.viewContainer;
        container.createEmbeddedView(node.template, context, index);
        // Set the data to just created `CdkTreeNode`.
        // The `CdkTreeNode` created from `createEmbeddedView` will be saved in static variable
        //     `mostRecentTreeNode`. We get it from static variable and pass the node data to it.
        if (CdkTreeNode.mostRecentTreeNode) {
            CdkTreeNode.mostRecentTreeNode.data = nodeData;
        }
        this._changeDetectorRef.detectChanges();
    }
}
CdkTree.decorators = [
    { type: Component, args: [{selector: 'cdk-tree',
                exportAs: 'cdkTree',
                template: `<ng-container cdkTreeNodeOutlet></ng-container>`,
                host: {
                    'class': 'cdk-tree',
                    'role': 'tree',
                },
                encapsulation: ViewEncapsulation.None,
                preserveWhitespaces: false,
                changeDetection: ChangeDetectionStrategy.OnPush
            },] },
];
/** @nocollapse */
CdkTree.ctorParameters = () => [
    { type: IterableDiffers, },
    { type: ChangeDetectorRef, },
];
CdkTree.propDecorators = {
    "dataSource": [{ type: Input },],
    "treeControl": [{ type: Input },],
    "_nodeOutlet": [{ type: ViewChild, args: [CdkTreeNodeOutlet,] },],
    "_nodeDefs": [{ type: ContentChildren, args: [CdkTreeNodeDef,] },],
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
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
class CdkNestedTreeNode extends CdkTreeNode {
    /**
     * @param {?} _elementRef
     * @param {?} _tree
     */
    constructor(_elementRef, _tree) {
        super(_elementRef, _tree);
        this._elementRef = _elementRef;
        this._tree = _tree;
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        if (!this._tree.treeControl.getChildren) {
            throw getTreeControlFunctionsMissingError();
        }
        this._tree.treeControl.getChildren(this.data).pipe(takeUntil(this._destroyed))
            .subscribe(result => {
            if (result && result.length) {
                // In case when nodeOutlet is not in the DOM when children changes, save it in the node
                // and add to nodeOutlet when it's available.
                this._children = /** @type {?} */ (result);
                this._addChildrenNodes();
            }
        });
        this.nodeOutlet.changes.pipe(takeUntil(this._destroyed))
            .subscribe((_) => this._addChildrenNodes());
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._clear();
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Add children dataNodes to the NodeOutlet
     * @return {?}
     */
    _addChildrenNodes() {
        this._clear();
        if (this.nodeOutlet.length && this._children && this._children.length) {
            this._children.forEach((child, index) => {
                this._tree.insertNode(child, index, this.nodeOutlet.first.viewContainer);
            });
        }
    }
    /**
     * Clear the children dataNodes.
     * @return {?}
     */
    _clear() {
        if (this.nodeOutlet && this.nodeOutlet.first) {
            this.nodeOutlet.first.viewContainer.clear();
        }
    }
}
CdkNestedTreeNode.decorators = [
    { type: Directive, args: [{
                selector: 'cdk-nested-tree-node',
                exportAs: 'cdkNestedTreeNode',
                host: {
                    '[attr.aria-expanded]': 'isExpanded',
                    '[attr.role]': 'role',
                    'class': 'cdk-tree-node cdk-nested-tree-node',
                },
                providers: [{ provide: CdkTreeNode, useExisting: CdkNestedTreeNode }]
            },] },
];
/** @nocollapse */
CdkNestedTreeNode.ctorParameters = () => [
    { type: ElementRef, },
    { type: CdkTree, },
];
CdkNestedTreeNode.propDecorators = {
    "nodeOutlet": [{ type: ContentChildren, args: [CdkTreeNodeOutlet,] },],
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Indent for the children tree dataNodes.
 * This directive will add left-padding to the node to show hierarchy.
 */
class CdkTreeNodePadding {
    /**
     * @param {?} _treeNode
     * @param {?} _tree
     * @param {?} _renderer
     * @param {?} _element
     * @param {?} _dir
     */
    constructor(_treeNode, _tree, _renderer, _element, _dir) {
        this._treeNode = _treeNode;
        this._tree = _tree;
        this._renderer = _renderer;
        this._element = _element;
        this._dir = _dir;
        /**
         * Subject that emits when the component has been destroyed.
         */
        this._destroyed = new Subject();
        this._indent = 40;
        this._setPadding();
        if (this._dir) {
            this._dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => this._setPadding());
        }
    }
    /**
     * The level of depth of the tree node. The padding will be `level * indent` pixels.
     * @param {?} value
     * @return {?}
     */
    set level(value) {
        this._level = coerceNumberProperty(value);
        this._setPadding();
    }
    /**
     * @return {?}
     */
    get level() { return this._level; }
    /**
     * The indent for each level. Default number 40px from material design menu sub-menu spec.
     * @param {?} value
     * @return {?}
     */
    set indent(value) {
        this._indent = coerceNumberProperty(value);
        this._setPadding();
    }
    /**
     * @return {?}
     */
    get indent() { return this._indent; }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * The padding indent value for the tree node. Returns a string with px numbers if not null.
     * @return {?}
     */
    _paddingIndent() {
        const /** @type {?} */ nodeLevel = (this._treeNode.data && this._tree.treeControl.getLevel)
            ? this._tree.treeControl.getLevel(this._treeNode.data)
            : null;
        const /** @type {?} */ level = this._level || nodeLevel;
        return level ? `${level * this._indent}px` : null;
    }
    /**
     * @return {?}
     */
    _setPadding() {
        const /** @type {?} */ padding = this._paddingIndent();
        const /** @type {?} */ paddingProp = this._dir && this._dir.value === 'rtl' ? 'padding-right' : 'padding-left';
        this._renderer.setStyle(this._element.nativeElement, paddingProp, padding);
    }
}
CdkTreeNodePadding.decorators = [
    { type: Directive, args: [{
                selector: '[cdkTreeNodePadding]',
            },] },
];
/** @nocollapse */
CdkTreeNodePadding.ctorParameters = () => [
    { type: CdkTreeNode, },
    { type: CdkTree, },
    { type: Renderer2, },
    { type: ElementRef, },
    { type: Directionality, decorators: [{ type: Optional },] },
];
CdkTreeNodePadding.propDecorators = {
    "level": [{ type: Input, args: ['cdkTreeNodePadding',] },],
    "indent": [{ type: Input, args: ['cdkTreeNodePaddingIndent',] },],
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Node toggle to expand/collapse the node.
 */
class CdkTreeNodeToggle {
    /**
     * @param {?} _tree
     * @param {?} _treeNode
     */
    constructor(_tree, _treeNode) {
        this._tree = _tree;
        this._treeNode = _treeNode;
        this._recursive = true;
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
    { type: Directive, args: [{
                selector: '[cdkTreeNodeToggle]',
                host: {
                    '(click)': '_toggle($event)',
                }
            },] },
];
/** @nocollapse */
CdkTreeNodeToggle.ctorParameters = () => [
    { type: CdkTree, },
    { type: CdkTreeNode, },
];
CdkTreeNodeToggle.propDecorators = {
    "recursive": [{ type: Input, args: ['cdkTreeNodeToggleRecursive',] },],
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

const EXPORTED_DECLARATIONS = [
    CdkNestedTreeNode,
    CdkTreeNodeDef,
    CdkTreeNodePadding,
    CdkTreeNodeToggle,
    CdkTree,
    CdkTreeNode,
    CdkTreeNodeOutlet,
];
class CdkTreeModule {
}
CdkTreeModule.decorators = [
    { type: NgModule, args: [{
                imports: [CommonModule],
                exports: EXPORTED_DECLARATIONS,
                declarations: EXPORTED_DECLARATIONS,
                providers: [FocusMonitor, CdkTreeNodeDef]
            },] },
];
/** @nocollapse */
CdkTreeModule.ctorParameters = () => [];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Generated bundle index. Do not edit.
 */

export { BaseTreeControl, FlatTreeControl, NestedTreeControl, CdkNestedTreeNode, CdkTreeNodeOutletContext, CdkTreeNodeDef, CdkTreeNodePadding, CdkTreeNodeOutlet, CdkTreeNode, CdkTree, getTreeNoValidDataSourceError, getTreeMultipleDefaultNodeDefsError, getTreeMissingMatchingNodeDefError, getTreeControlMissingError, getTreeControlFunctionsMissingError, CdkTreeModule, CdkTreeNodeToggle };
//# sourceMappingURL=tree.js.map
