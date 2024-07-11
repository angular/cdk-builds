import { AfterContentChecked } from '@angular/core';
import { AfterContentInit } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { CollectionViewer } from '@angular/cdk/collections';
import { DataSource } from '@angular/cdk/collections';
import { Directionality } from '@angular/cdk/bidi';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import * as i0 from '@angular/core';
import { InjectionToken } from '@angular/core';
import { IterableDiffer } from '@angular/core';
import { IterableDiffers } from '@angular/core';
import { Observable } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { QueryList } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { TemplateRef } from '@angular/core';
import { TrackByFunction } from '@angular/core';
import { TreeKeyManagerItem } from '@angular/cdk/a11y';
import { TreeKeyManagerStrategy } from '@angular/cdk/a11y';
import { ViewContainerRef } from '@angular/core';

/**
 * Base tree control. It has basic toggle/expand/collapse operations on a single data node.
 *
 * @deprecated Use one of levelAccessor or childrenAccessor. To be removed in a future version.
 * @breaking-change 21.0.0
 */
export declare abstract class BaseTreeControl<T, K = T> implements TreeControl<T, K> {
    /** Gets a list of descendent data nodes of a subtree rooted at given data node recursively. */
    abstract getDescendants(dataNode: T): T[];
    /** Expands all data nodes in the tree. */
    abstract expandAll(): void;
    /** Saved data node for `expandAll` action. */
    dataNodes: T[];
    /** A selection model with multi-selection to track expansion status. */
    expansionModel: SelectionModel<K>;
    /**
     * Returns the identifier by which a dataNode should be tracked, should its
     * reference change.
     *
     * Similar to trackBy for *ngFor
     */
    trackBy?: (dataNode: T) => K;
    /** Get depth of a given data node, return the level number. This is for flat tree node. */
    getLevel: (dataNode: T) => number;
    /**
     * Whether the data node is expandable. Returns true if expandable.
     * This is for flat tree node.
     */
    isExpandable: (dataNode: T) => boolean;
    /** Gets a stream that emits whenever the given data node's children change. */
    getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null;
    /** Toggles one single data node's expanded/collapsed state. */
    toggle(dataNode: T): void;
    /** Expands one single data node. */
    expand(dataNode: T): void;
    /** Collapses one single data node. */
    collapse(dataNode: T): void;
    /** Whether a given data node is expanded or not. Returns true if the data node is expanded. */
    isExpanded(dataNode: T): boolean;
    /** Toggles a subtree rooted at `node` recursively. */
    toggleDescendants(dataNode: T): void;
    /** Collapse all dataNodes in the tree. */
    collapseAll(): void;
    /** Expands a subtree rooted at given data node recursively. */
    expandDescendants(dataNode: T): void;
    /** Collapses a subtree rooted at given data node recursively. */
    collapseDescendants(dataNode: T): void;
    protected _trackByValue(value: T | K): K;
}

/**
 * Injection token used to provide a `CdkTreeNode` to its outlet.
 * Used primarily to avoid circular imports.
 * @docs-private
 */
export declare const CDK_TREE_NODE_OUTLET_NODE: InjectionToken<{}>;

/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * The children of node will be automatically added to `cdkTreeNodeOutlet`.
 */
export declare class CdkNestedTreeNode<T, K = T> extends CdkTreeNode<T, K> implements AfterContentInit, OnDestroy, OnInit {
    protected _differs: IterableDiffers;
    /** Differ used to find the changes in the data provided by the data source. */
    private _dataDiffer;
    /** The children data dataNodes of current node. They will be placed in `CdkTreeNodeOutlet`. */
    protected _children: T[];
    /** The children node placeholder. */
    nodeOutlet: QueryList<CdkTreeNodeOutlet>;
    constructor(elementRef: ElementRef<HTMLElement>, tree: CdkTree<T, K>, _differs: IterableDiffers);
    ngAfterContentInit(): void;
    ngOnInit(): void;
    ngOnDestroy(): void;
    /** Add children dataNodes to the NodeOutlet */
    protected updateChildrenNodes(children?: T[]): void;
    /** Clear the children dataNodes. */
    protected _clear(): void;
    /** Gets the outlet for the current node. */
    private _getNodeOutlet;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkNestedTreeNode<any, any>, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkNestedTreeNode<any, any>, "cdk-nested-tree-node", ["cdkNestedTreeNode"], {}, {}, ["nodeOutlet"], never, true, never>;
}

/**
 * CDK tree component that connects with a data source to retrieve data of type `T` and renders
 * dataNodes with hierarchy. Updates the dataNodes when new data is provided by the data source.
 */
export declare class CdkTree<T, K = T> implements AfterContentChecked, AfterContentInit, AfterViewInit, CollectionViewer, OnDestroy, OnInit {
    private _differs;
    private _changeDetectorRef;
    private _dir;
    /** Subject that emits when the component has been destroyed. */
    private readonly _onDestroy;
    /** Differ used to find the changes in the data provided by the data source. */
    private _dataDiffer;
    /** Stores the node definition that does not have a when predicate. */
    private _defaultNodeDef;
    /** Data subscription */
    private _dataSubscription;
    /** Level of nodes */
    private _levels;
    /** The immediate parents for a node. This is `null` if there is no parent. */
    private _parents;
    /**
     * Nodes grouped into each set, which is a list of nodes displayed together in the DOM.
     *
     * Lookup key is the parent of a set. Root nodes have key of null.
     *
     * Values is a 'set' of tree nodes. Each tree node maps to a treeitem element. Sets are in the
     * order that it is rendered. Each set maps directly to aria-posinset and aria-setsize attributes.
     */
    private _ariaSets;
    /**
     * Provides a stream containing the latest data array to render. Influenced by the tree's
     * stream of view window (what dataNodes are currently on screen).
     * Data source can be an observable of data array, or a data array to render.
     */
    get dataSource(): DataSource<T> | Observable<T[]> | T[];
    set dataSource(dataSource: DataSource<T> | Observable<T[]> | T[]);
    private _dataSource;
    /**
     * The tree controller
     *
     * @deprecated Use one of `levelAccessor` or `childrenAccessor` instead. To be removed in a
     * future version.
     * @breaking-change 21.0.0
     */
    treeControl?: TreeControl<T, K>;
    /**
     * Given a data node, determines what tree level the node is at.
     *
     * One of levelAccessor or childrenAccessor must be specified, not both.
     * This is enforced at run-time.
     */
    levelAccessor?: (dataNode: T) => number;
    /**
     * Given a data node, determines what the children of that node are.
     *
     * One of levelAccessor or childrenAccessor must be specified, not both.
     * This is enforced at run-time.
     */
    childrenAccessor?: (dataNode: T) => T[] | Observable<T[]>;
    /**
     * Tracking function that will be used to check the differences in data changes. Used similarly
     * to `ngFor` `trackBy` function. Optimize node operations by identifying a node based on its data
     * relative to the function to know if a node should be added/removed/moved.
     * Accepts a function that takes two parameters, `index` and `item`.
     */
    trackBy: TrackByFunction<T>;
    /**
     * Given a data node, determines the key by which we determine whether or not this node is expanded.
     */
    expansionKey?: (dataNode: T) => K;
    _nodeOutlet: CdkTreeNodeOutlet;
    /** The tree node template for the tree */
    _nodeDefs: QueryList<CdkTreeNodeDef<T>>;
    /**
     * Stream containing the latest information on what rows are being displayed on screen.
     * Can be used by the data source to as a heuristic of what data should be provided.
     */
    readonly viewChange: BehaviorSubject<{
        start: number;
        end: number;
    }>;
    /** Keep track of which nodes are expanded. */
    private _expansionModel?;
    /**
     * Maintain a synchronous cache of flattened data nodes. This will only be
     * populated after initial render, and in certain cases, will be delayed due to
     * relying on Observable `getChildren` calls.
     */
    private _flattenedNodes;
    /** The automatically determined node type for the tree. */
    private _nodeType;
    /** The mapping between data and the node that is rendered. */
    private _nodes;
    /**
     * Synchronous cache of nodes for the `TreeKeyManager`. This is separate
     * from `_flattenedNodes` so they can be independently updated at different
     * times.
     */
    private _keyManagerNodes;
    private _keyManagerFactory;
    /** The key manager for this tree. Handles focus and activation based on user keyboard input. */
    _keyManager: TreeKeyManagerStrategy<CdkTreeNode<T, K>>;
    private _viewInit;
    constructor(_differs: IterableDiffers, _changeDetectorRef: ChangeDetectorRef, _dir: Directionality);
    ngAfterContentInit(): void;
    ngAfterContentChecked(): void;
    ngOnDestroy(): void;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    private _updateDefaultNodeDefinition;
    /**
     * Sets the node type for the tree, if it hasn't been set yet.
     *
     * This will be called by the first node that's rendered in order for the tree
     * to determine what data transformations are required.
     */
    _setNodeTypeIfUnset(nodeType: 'flat' | 'nested'): void;
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the node outlet. Otherwise start listening for new data.
     */
    private _switchDataSource;
    _getExpansionModel(): SelectionModel<K>;
    /** Set up a subscription for the data provided by the data source. */
    private _subscribeToDataChanges;
    /** Given an Observable containing a stream of the raw data, returns an Observable containing the RenderingData */
    private _getRenderData;
    private _renderDataChanges;
    private _emitExpansionChanges;
    private _initializeKeyManager;
    private _initializeDataDiffer;
    private _checkTreeControlUsage;
    /** Check for changes made in the data and render each change (node added/removed/moved). */
    renderNodeChanges(data: readonly T[], dataDiffer?: IterableDiffer<T>, viewContainer?: ViewContainerRef, parentData?: T): void;
    /**
     * Finds the matching node definition that should be used for this node data. If there is only
     * one node definition, it is returned. Otherwise, find the node definition that has a when
     * predicate that returns true with the data. If none return true, return the default node
     * definition.
     */
    _getNodeDef(data: T, i: number): CdkTreeNodeDef<T>;
    /**
     * Create the embedded view for the data node template and place it in the correct index location
     * within the data node view container.
     */
    insertNode(nodeData: T, index: number, viewContainer?: ViewContainerRef, parentData?: T): void;
    /** Whether the data node is expanded or collapsed. Returns true if it's expanded. */
    isExpanded(dataNode: T): boolean;
    /** If the data node is currently expanded, collapse it. Otherwise, expand it. */
    toggle(dataNode: T): void;
    /** Expand the data node. If it is already expanded, does nothing. */
    expand(dataNode: T): void;
    /** Collapse the data node. If it is already collapsed, does nothing. */
    collapse(dataNode: T): void;
    /**
     * If the data node is currently expanded, collapse it and all its descendants.
     * Otherwise, expand it and all its descendants.
     */
    toggleDescendants(dataNode: T): void;
    /**
     * Expand the data node and all its descendants. If they are already expanded, does nothing.
     */
    expandDescendants(dataNode: T): void;
    /** Collapse the data node and all its descendants. If it is already collapsed, does nothing. */
    collapseDescendants(dataNode: T): void;
    /** Expands all data nodes in the tree. */
    expandAll(): void;
    /** Collapse all data nodes in the tree. */
    collapseAll(): void;
    /** Level accessor, used for compatibility between the old Tree and new Tree */
    _getLevelAccessor(): ((dataNode: T) => number) | undefined;
    /** Children accessor, used for compatibility between the old Tree and new Tree */
    _getChildrenAccessor(): ((dataNode: T) => Observable<T[]> | T[] | undefined | null) | undefined;
    /**
     * Gets the direct children of a node; used for compatibility between the old tree and the
     * new tree.
     */
    _getDirectChildren(dataNode: T): Observable<T[]>;
    /**
     * Given the list of flattened nodes, the level accessor, and the level range within
     * which to consider children, finds the children for a given node.
     *
     * For example, for direct children, `levelDelta` would be 1. For all descendants,
     * `levelDelta` would be Infinity.
     */
    private _findChildrenByLevel;
    /**
     * Adds the specified node component to the tree's internal registry.
     *
     * This primarily facilitates keyboard navigation.
     */
    _registerNode(node: CdkTreeNode<T, K>): void;
    /** Removes the specified node component from the tree's internal registry. */
    _unregisterNode(node: CdkTreeNode<T, K>): void;
    /**
     * For the given node, determine the level where this node appears in the tree.
     *
     * This is intended to be used for `aria-level` but is 0-indexed.
     */
    _getLevel(node: T): number | undefined;
    /**
     * For the given node, determine the size of the parent's child set.
     *
     * This is intended to be used for `aria-setsize`.
     */
    _getSetSize(dataNode: T): number;
    /**
     * For the given node, determine the index (starting from 1) of the node in its parent's child set.
     *
     * This is intended to be used for `aria-posinset`.
     */
    _getPositionInSet(dataNode: T): number;
    /** Given a CdkTreeNode, gets the node that renders that node's parent's data. */
    _getNodeParent(node: CdkTreeNode<T, K>): CdkTreeNode<T, K> | null | undefined;
    /** Given a CdkTreeNode, gets the nodes that renders that node's child data. */
    _getNodeChildren(node: CdkTreeNode<T, K>): Observable<CdkTreeNode<T, K>[]>;
    /** `keydown` event handler; this just passes the event to the `TreeKeyManager`. */
    _sendKeydownToKeyManager(event: KeyboardEvent): void;
    /** Gets all nested descendants of a given node. */
    private _getDescendants;
    /**
     * Gets all children and sub-children of the provided node.
     *
     * This will emit multiple times, in the order that the children will appear
     * in the tree, and can be combined with a `reduce` operator.
     */
    private _getAllChildrenRecursively;
    private _getExpansionKey;
    private _getAriaSet;
    /**
     * Finds the parent for the given node. If this is a root node, this
     * returns null. If we're unable to determine the parent, for example,
     * if we don't have cached node data, this returns undefined.
     */
    private _findParentForNode;
    /**
     * Given a set of root nodes and the current node level, flattens any nested
     * nodes into a single array.
     *
     * If any nodes are not expanded, then their children will not be added into the array.
     * This will still traverse all nested children in order to build up our internal data
     * models, but will not include them in the returned array.
     */
    private _flattenNestedNodesWithExpansion;
    /**
     * Converts children for certain tree configurations.
     *
     * This also computes parent, level, and group data.
     */
    private _computeRenderingData;
    private _updateCachedData;
    private _updateKeyManagerItems;
    /** Traverse the flattened node data and compute parents, levels, and group data. */
    private _calculateParents;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTree<any, any>, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CdkTree<any, any>, "cdk-tree", ["cdkTree"], { "dataSource": { "alias": "dataSource"; "required": false; }; "treeControl": { "alias": "treeControl"; "required": false; }; "levelAccessor": { "alias": "levelAccessor"; "required": false; }; "childrenAccessor": { "alias": "childrenAccessor"; "required": false; }; "trackBy": { "alias": "trackBy"; "required": false; }; "expansionKey": { "alias": "expansionKey"; "required": false; }; }, {}, ["_nodeDefs"], never, true, never>;
}

export declare class CdkTreeModule {
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTreeModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<CdkTreeModule, never, [typeof i1.CdkNestedTreeNode, typeof i2.CdkTreeNodeDef, typeof i3.CdkTreeNodePadding, typeof i4.CdkTreeNodeToggle, typeof i5.CdkTree, typeof i5.CdkTreeNode, typeof i6.CdkTreeNodeOutlet], [typeof i1.CdkNestedTreeNode, typeof i2.CdkTreeNodeDef, typeof i3.CdkTreeNodePadding, typeof i4.CdkTreeNodeToggle, typeof i5.CdkTree, typeof i5.CdkTreeNode, typeof i6.CdkTreeNodeOutlet]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<CdkTreeModule>;
}

/**
 * Tree node for CdkTree. It contains the data in the tree node.
 */
export declare class CdkTreeNode<T, K = T> implements OnDestroy, OnInit, TreeKeyManagerItem {
    protected _elementRef: ElementRef<HTMLElement>;
    protected _tree: CdkTree<T, K>;
    protected _tabindex: number | null;
    /**
     * The role of the tree node.
     *
     * @deprecated This will be ignored; the tree will automatically determine the appropriate role
     * for tree node. This input will be removed in a future version.
     * @breaking-change 21.0.0
     */
    get role(): 'treeitem' | 'group';
    set role(_role: 'treeitem' | 'group');
    /**
     * Whether or not this node is expandable.
     *
     * If not using `FlatTreeControl`, or if `isExpandable` is not provided to
     * `NestedTreeControl`, this should be provided for correct node a11y.
     */
    get isExpandable(): boolean;
    set isExpandable(isExpandable: boolean);
    get isExpanded(): boolean;
    set isExpanded(isExpanded: boolean);
    /**
     * Whether or not this node is disabled. If it's disabled, then the user won't be able to focus
     * or activate this node.
     */
    isDisabled: boolean;
    /**
     * The text used to locate this item during typeahead. If not specified, the `textContent` will
     * will be used.
     */
    typeaheadLabel: string | null;
    getLabel(): string;
    /** This emits when the node has been programatically activated or activated by keyboard. */
    readonly activation: EventEmitter<T>;
    /** This emits when the node's expansion status has been changed. */
    readonly expandedChange: EventEmitter<boolean>;
    /**
     * The most recently created `CdkTreeNode`. We save it in static variable so we can retrieve it
     * in `CdkTree` and set the data to it.
     */
    static mostRecentTreeNode: CdkTreeNode<any> | null;
    /** Subject that emits when the component has been destroyed. */
    protected readonly _destroyed: Subject<void>;
    /** Emits when the node's data has changed. */
    readonly _dataChanges: Subject<void>;
    private _inputIsExpandable;
    /**
     * Flag used to determine whether or not we should be focusing the actual element based on
     * some user interaction (click or focus). On click, we don't forcibly focus the element
     * since the click could trigger some other component that wants to grab its own focus
     * (e.g. menu, dialog).
     */
    private _shouldFocus;
    private _parentNodeAriaLevel;
    /** The tree node's data. */
    get data(): T;
    set data(value: T);
    protected _data: T;
    get isLeafNode(): boolean;
    get level(): number;
    /** Determines if the tree node is expandable. */
    _isExpandable(): boolean;
    /**
     * Determines the value for `aria-expanded`.
     *
     * For non-expandable nodes, this is `null`.
     */
    _getAriaExpanded(): string | null;
    /**
     * Determines the size of this node's parent's child set.
     *
     * This is intended to be used for `aria-setsize`.
     */
    _getSetSize(): number;
    /**
     * Determines the index (starting from 1) of this node in its parent's child set.
     *
     * This is intended to be used for `aria-posinset`.
     */
    _getPositionInSet(): number;
    private _changeDetectorRef;
    constructor(_elementRef: ElementRef<HTMLElement>, _tree: CdkTree<T, K>);
    ngOnInit(): void;
    ngOnDestroy(): void;
    getParent(): CdkTreeNode<T, K> | null;
    getChildren(): CdkTreeNode<T, K>[] | Observable<CdkTreeNode<T, K>[]>;
    /** Focuses this data node. Implemented for TreeKeyManagerItem. */
    focus(): void;
    /** Defocus this data node. */
    unfocus(): void;
    /** Emits an activation event. Implemented for TreeKeyManagerItem. */
    activate(): void;
    /** Collapses this data node. Implemented for TreeKeyManagerItem. */
    collapse(): void;
    /** Expands this data node. Implemented for TreeKeyManagerItem. */
    expand(): void;
    _focusItem(): void;
    _setActiveItem(): void;
    _emitExpansionState(expanded: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTreeNode<any, any>, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkTreeNode<any, any>, "cdk-tree-node", ["cdkTreeNode"], { "role": { "alias": "role"; "required": false; }; "isExpandable": { "alias": "isExpandable"; "required": false; }; "isExpanded": { "alias": "isExpanded"; "required": false; }; "isDisabled": { "alias": "isDisabled"; "required": false; }; "typeaheadLabel": { "alias": "cdkTreeNodeTypeaheadLabel"; "required": false; }; }, { "activation": "activation"; "expandedChange": "expandedChange"; }, never, never, true, never>;
    static ngAcceptInputType_isExpandable: unknown;
    static ngAcceptInputType_isDisabled: unknown;
}

/**
 * Data node definition for the CdkTree.
 * Captures the node's template and a when predicate that describes when this node should be used.
 */
export declare class CdkTreeNodeDef<T> {
    template: TemplateRef<any>;
    /**
     * Function that should return true if this node template should be used for the provided node
     * data and index. If left undefined, this node will be considered the default node template to
     * use when no other when functions return true for the data.
     * For every node, there must be at least one when function that passes or an undefined to
     * default.
     */
    when: (index: number, nodeData: T) => boolean;
    /** @docs-private */
    constructor(template: TemplateRef<any>);
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTreeNodeDef<any>, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkTreeNodeDef<any>, "[cdkTreeNodeDef]", never, { "when": { "alias": "cdkTreeNodeDefWhen"; "required": false; }; }, {}, never, never, true, never>;
}

/**
 * Outlet for nested CdkNode. Put `[cdkTreeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 */
export declare class CdkTreeNodeOutlet {
    viewContainer: ViewContainerRef;
    _node?: any | undefined;
    constructor(viewContainer: ViewContainerRef, _node?: any | undefined);
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTreeNodeOutlet, [null, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkTreeNodeOutlet, "[cdkTreeNodeOutlet]", never, {}, {}, never, never, true, never>;
}

/** Context provided to the tree node component. */
export declare class CdkTreeNodeOutletContext<T> {
    /** Data for the node. */
    $implicit: T;
    /** Depth of the node. */
    level: number;
    /** Index location of the node. */
    index?: number;
    /** Length of the number of total dataNodes. */
    count?: number;
    constructor(data: T);
}

/**
 * Indent for the children tree dataNodes.
 * This directive will add left-padding to the node to show hierarchy.
 */
export declare class CdkTreeNodePadding<T, K = T> implements OnDestroy {
    private _treeNode;
    private _tree;
    private _element;
    private _dir;
    /** Current padding value applied to the element. Used to avoid unnecessarily hitting the DOM. */
    private _currentPadding;
    /** Subject that emits when the component has been destroyed. */
    private readonly _destroyed;
    /** CSS units used for the indentation value. */
    indentUnits: string;
    /** The level of depth of the tree node. The padding will be `level * indent` pixels. */
    get level(): number;
    set level(value: number);
    _level: number;
    /**
     * The indent for each level. Can be a number or a CSS string.
     * Default number 40px from material design menu sub-menu spec.
     */
    get indent(): number | string;
    set indent(indent: number | string);
    _indent: number;
    constructor(_treeNode: CdkTreeNode<T, K>, _tree: CdkTree<T, K>, _element: ElementRef<HTMLElement>, _dir: Directionality);
    ngOnDestroy(): void;
    /** The padding indent value for the tree node. Returns a string with px numbers if not null. */
    _paddingIndent(): string | null;
    _setPadding(forceChange?: boolean): void;
    /**
     * This has been extracted to a util because of TS 4 and VE.
     * View Engine doesn't support property rename inheritance.
     * TS 4.0 doesn't allow properties to override accessors or vice-versa.
     * @docs-private
     */
    protected _setLevelInput(value: number): void;
    /**
     * This has been extracted to a util because of TS 4 and VE.
     * View Engine doesn't support property rename inheritance.
     * TS 4.0 doesn't allow properties to override accessors or vice-versa.
     * @docs-private
     */
    protected _setIndentInput(indent: number | string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTreeNodePadding<any, any>, [null, null, null, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkTreeNodePadding<any, any>, "[cdkTreeNodePadding]", never, { "level": { "alias": "cdkTreeNodePadding"; "required": false; }; "indent": { "alias": "cdkTreeNodePaddingIndent"; "required": false; }; }, {}, never, never, true, never>;
    static ngAcceptInputType_level: unknown;
}

/**
 * Node toggle to expand and collapse the node.
 */
export declare class CdkTreeNodeToggle<T, K = T> {
    protected _tree: CdkTree<T, K>;
    protected _treeNode: CdkTreeNode<T, K>;
    /** Whether expand/collapse the node recursively. */
    recursive: boolean;
    constructor(_tree: CdkTree<T, K>, _treeNode: CdkTreeNode<T, K>);
    _toggle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTreeNodeToggle<any, any>, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkTreeNodeToggle<any, any>, "[cdkTreeNodeToggle]", never, { "recursive": { "alias": "cdkTreeNodeToggleRecursive"; "required": false; }; }, {}, never, never, true, never>;
    static ngAcceptInputType_recursive: unknown;
}

/**
 * Flat tree control. Able to expand/collapse a subtree recursively for flattened tree.
 *
 * @deprecated Use one of levelAccessor or childrenAccessor instead. To be removed in a future
 * version.
 * @breaking-change 21.0.0
 */
export declare class FlatTreeControl<T, K = T> extends BaseTreeControl<T, K> {
    getLevel: (dataNode: T) => number;
    isExpandable: (dataNode: T) => boolean;
    options?: FlatTreeControlOptions<T, K> | undefined;
    /** Construct with flat tree data node functions getLevel and isExpandable. */
    constructor(getLevel: (dataNode: T) => number, isExpandable: (dataNode: T) => boolean, options?: FlatTreeControlOptions<T, K> | undefined);
    /**
     * Gets a list of the data node's subtree of descendent data nodes.
     *
     * To make this working, the `dataNodes` of the TreeControl must be flattened tree nodes
     * with correct levels.
     */
    getDescendants(dataNode: T): T[];
    /**
     * Expands all data nodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all flattened
     * data nodes of the tree.
     */
    expandAll(): void;
}

/** Optional set of configuration that can be provided to the FlatTreeControl. */
export declare interface FlatTreeControlOptions<T, K> {
    trackBy?: (dataNode: T) => K;
}

/**
 * Returns an error to be thrown when there are multiple ways of specifying children or level
 * provided to the tree.
 * @docs-private
 */
export declare function getMultipleTreeControlsError(): Error;

/**
 * Returns an error to be thrown when there is no tree control.
 * @docs-private
 */
export declare function getTreeControlMissingError(): Error;

/**
 * Returns an error to be thrown when there are no matching node defs for a particular set of data.
 * @docs-private
 */
export declare function getTreeMissingMatchingNodeDefError(): Error;

/**
 * Returns an error to be thrown when there are multiple nodes that are missing a when function.
 * @docs-private
 */
export declare function getTreeMultipleDefaultNodeDefsError(): Error;


/**
 * Returns an error to be thrown when there is no usable data.
 * @docs-private
 */
export declare function getTreeNoValidDataSourceError(): Error;

declare namespace i1 {
    export {
        CdkNestedTreeNode
    }
}

declare namespace i2 {
    export {
        CdkTreeNodeOutletContext,
        CdkTreeNodeDef
    }
}

declare namespace i3 {
    export {
        CdkTreeNodePadding
    }
}

declare namespace i4 {
    export {
        CdkTreeNodeToggle
    }
}

declare namespace i5 {
    export {
        CdkTree,
        CdkTreeNode
    }
}

declare namespace i6 {
    export {
        CDK_TREE_NODE_OUTLET_NODE,
        CdkTreeNodeOutlet
    }
}

/**
 * Nested tree control. Able to expand/collapse a subtree recursively for NestedNode type.
 *
 * @deprecated Use one of levelAccessor or childrenAccessor instead. To be removed in a future
 * version.
 * @breaking-change 21.0.0
 */
export declare class NestedTreeControl<T, K = T> extends BaseTreeControl<T, K> {
    getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null;
    options?: NestedTreeControlOptions<T, K> | undefined;
    /** Construct with nested tree function getChildren. */
    constructor(getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null, options?: NestedTreeControlOptions<T, K> | undefined);
    /**
     * Expands all dataNodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all root level
     * data nodes of the tree.
     */
    expandAll(): void;
    /** Gets a list of descendant dataNodes of a subtree rooted at given data node recursively. */
    getDescendants(dataNode: T): T[];
    /** A helper function to get descendants recursively. */
    protected _getDescendants(descendants: T[], dataNode: T): void;
}

/** Optional set of configuration that can be provided to the NestedTreeControl. */
export declare interface NestedTreeControlOptions<T, K> {
    /** Function to determine if the provided node is expandable. */
    isExpandable?: (dataNode: T) => boolean;
    trackBy?: (dataNode: T) => K;
}

/**
 * Tree control interface. User can implement TreeControl to expand/collapse dataNodes in the tree.
 * The CDKTree will use this TreeControl to expand/collapse a node.
 * User can also use it outside the `<cdk-tree>` to control the expansion status of the tree.
 *
 * @deprecated Use one of levelAccessor or childrenAccessor instead. To be removed in a future version.
 * @breaking-change 21.0.0
 */
export declare interface TreeControl<T, K = T> {
    /** The saved tree nodes data for `expandAll` action. */
    dataNodes: T[];
    /** The expansion model */
    expansionModel: SelectionModel<K>;
    /** Whether the data node is expanded or collapsed. Return true if it's expanded. */
    isExpanded(dataNode: T): boolean;
    /** Get all descendants of a data node */
    getDescendants(dataNode: T): any[];
    /** Expand or collapse data node */
    toggle(dataNode: T): void;
    /** Expand one data node */
    expand(dataNode: T): void;
    /** Collapse one data node */
    collapse(dataNode: T): void;
    /** Expand all the dataNodes in the tree */
    expandAll(): void;
    /** Collapse all the dataNodes in the tree */
    collapseAll(): void;
    /** Toggle a data node by expand/collapse it and all its descendants */
    toggleDescendants(dataNode: T): void;
    /** Expand a data node and all its descendants */
    expandDescendants(dataNode: T): void;
    /** Collapse a data node and all its descendants */
    collapseDescendants(dataNode: T): void;
    /** Get depth of a given data node, return the level number. This is for flat tree node. */
    readonly getLevel: (dataNode: T) => number;
    /**
     * Whether the data node is expandable. Returns true if expandable.
     * This is for flat tree node.
     */
    readonly isExpandable: (dataNode: T) => boolean;
    /** Gets a stream that emits whenever the given data node's children change. */
    readonly getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null;
}

export { }
