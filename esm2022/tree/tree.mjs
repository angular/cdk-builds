/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TREE_KEY_MANAGER, } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { isDataSource, SelectionModel, } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, EventEmitter, Input, IterableDiffers, Output, QueryList, ViewChild, ViewEncapsulation, numberAttribute, inject, booleanAttribute, } from '@angular/core';
import { coerceObservable } from '@angular/cdk/coercion/private';
import { BehaviorSubject, combineLatest, concat, EMPTY, Subject, isObservable, of as observableOf, } from 'rxjs';
import { distinctUntilChanged, concatMap, map, reduce, startWith, switchMap, take, takeUntil, tap, } from 'rxjs/operators';
import { CdkTreeNodeDef, CdkTreeNodeOutletContext } from './node';
import { CdkTreeNodeOutlet } from './outlet';
import { getMultipleTreeControlsError, getTreeControlMissingError, getTreeMissingMatchingNodeDefError, getTreeMultipleDefaultNodeDefsError, getTreeNoValidDataSourceError, } from './tree-errors';
import * as i0 from "@angular/core";
/**
 * CDK tree component that connects with a data source to retrieve data of type `T` and renders
 * dataNodes with hierarchy. Updates the dataNodes when new data is provided by the data source.
 */
export class CdkTree {
    /**
     * Provides a stream containing the latest data array to render. Influenced by the tree's
     * stream of view window (what dataNodes are currently on screen).
     * Data source can be an observable of data array, or a data array to render.
     */
    get dataSource() {
        return this._dataSource;
    }
    set dataSource(dataSource) {
        if (this._dataSource !== dataSource) {
            this._switchDataSource(dataSource);
        }
    }
    constructor(_differs, _changeDetectorRef) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        this._dir = inject(Directionality);
        /** Subject that emits when the component has been destroyed. */
        this._onDestroy = new Subject();
        /** Level of nodes */
        this._levels = new Map();
        /** The immediate parents for a node. This is `null` if there is no parent. */
        this._parents = new Map();
        /**
         * Nodes grouped into each set, which is a list of nodes displayed together in the DOM.
         *
         * Lookup key is the parent of a set. Root nodes have key of null.
         *
         * Values is a 'set' of tree nodes. Each tree node maps to a treeitem element. Sets are in the
         * order that it is rendered. Each set maps directly to aria-posinset and aria-setsize attributes.
         */
        this._ariaSets = new Map();
        // TODO(tinayuangao): Setup a listener for scrolling, emit the calculated view to viewChange.
        //     Remove the MAX_VALUE in viewChange
        /**
         * Stream containing the latest information on what rows are being displayed on screen.
         * Can be used by the data source to as a heuristic of what data should be provided.
         */
        this.viewChange = new BehaviorSubject({
            start: 0,
            end: Number.MAX_VALUE,
        });
        /**
         * Maintain a synchronous cache of flattened data nodes. This will only be
         * populated after initial render, and in certain cases, will be delayed due to
         * relying on Observable `getChildren` calls.
         */
        this._flattenedNodes = new BehaviorSubject([]);
        /** The automatically determined node type for the tree. */
        this._nodeType = new BehaviorSubject(null);
        /** The mapping between data and the node that is rendered. */
        this._nodes = new BehaviorSubject(new Map());
        /**
         * Synchronous cache of nodes for the `TreeKeyManager`. This is separate
         * from `_flattenedNodes` so they can be independently updated at different
         * times.
         */
        this._keyManagerNodes = new BehaviorSubject([]);
        this._keyManagerFactory = inject(TREE_KEY_MANAGER);
        this._viewInit = false;
    }
    ngAfterContentInit() {
        this._initializeKeyManager();
    }
    ngAfterContentChecked() {
        this._updateDefaultNodeDefinition();
        this._subscribeToDataChanges();
    }
    ngOnDestroy() {
        this._nodeOutlet.viewContainer.clear();
        this.viewChange.complete();
        this._onDestroy.next();
        this._onDestroy.complete();
        if (this._dataSource && typeof this._dataSource.disconnect === 'function') {
            this.dataSource.disconnect(this);
        }
        if (this._dataSubscription) {
            this._dataSubscription.unsubscribe();
            this._dataSubscription = null;
        }
        // In certain tests, the tree might be destroyed before this is initialized
        // in `ngAfterContentInit`.
        this._keyManager?.destroy();
    }
    ngOnInit() {
        this._checkTreeControlUsage();
        this._initializeDataDiffer();
    }
    ngAfterViewInit() {
        this._viewInit = true;
    }
    _updateDefaultNodeDefinition() {
        const defaultNodeDefs = this._nodeDefs.filter(def => !def.when);
        if (defaultNodeDefs.length > 1 && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTreeMultipleDefaultNodeDefsError();
        }
        this._defaultNodeDef = defaultNodeDefs[0];
    }
    /**
     * Sets the node type for the tree, if it hasn't been set yet.
     *
     * This will be called by the first node that's rendered in order for the tree
     * to determine what data transformations are required.
     */
    _setNodeTypeIfUnset(nodeType) {
        if (this._nodeType.value === null) {
            this._nodeType.next(nodeType);
        }
    }
    /**
     * Switch to the provided data source by resetting the data and unsubscribing from the current
     * render change subscription if one exists. If the data source is null, interpret this by
     * clearing the node outlet. Otherwise start listening for new data.
     */
    _switchDataSource(dataSource) {
        if (this._dataSource && typeof this._dataSource.disconnect === 'function') {
            this.dataSource.disconnect(this);
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
            this._subscribeToDataChanges();
        }
    }
    _getExpansionModel() {
        if (!this.treeControl) {
            this._expansionModel ??= new SelectionModel(true);
            return this._expansionModel;
        }
        return this.treeControl.expansionModel;
    }
    /** Set up a subscription for the data provided by the data source. */
    _subscribeToDataChanges() {
        if (this._dataSubscription) {
            return;
        }
        let dataStream;
        if (isDataSource(this._dataSource)) {
            dataStream = this._dataSource.connect(this);
        }
        else if (isObservable(this._dataSource)) {
            dataStream = this._dataSource;
        }
        else if (Array.isArray(this._dataSource)) {
            dataStream = observableOf(this._dataSource);
        }
        if (!dataStream) {
            if (typeof ngDevMode === 'undefined' || ngDevMode) {
                throw getTreeNoValidDataSourceError();
            }
            return;
        }
        this._dataSubscription = this._getRenderData(dataStream)
            .pipe(takeUntil(this._onDestroy))
            .subscribe(renderingData => {
            this._renderDataChanges(renderingData);
        });
    }
    /** Given an Observable containing a stream of the raw data, returns an Observable containing the RenderingData */
    _getRenderData(dataStream) {
        const expansionModel = this._getExpansionModel();
        return combineLatest([
            dataStream,
            this._nodeType,
            // We don't use the expansion data directly, however we add it here to essentially
            // trigger data rendering when expansion changes occur.
            expansionModel.changed.pipe(startWith(null), tap(expansionChanges => {
                this._emitExpansionChanges(expansionChanges);
            })),
        ]).pipe(switchMap(([data, nodeType]) => {
            if (nodeType === null) {
                return observableOf({ renderNodes: data, flattenedNodes: null, nodeType });
            }
            // If we're here, then we know what our node type is, and therefore can
            // perform our usual rendering pipeline, which necessitates converting the data
            return this._computeRenderingData(data, nodeType).pipe(map(convertedData => ({ ...convertedData, nodeType })));
        }));
    }
    _renderDataChanges(data) {
        if (data.nodeType === null) {
            this.renderNodeChanges(data.renderNodes);
            return;
        }
        // If we're here, then we know what our node type is, and therefore can
        // perform our usual rendering pipeline.
        this._updateCachedData(data.flattenedNodes);
        this.renderNodeChanges(data.renderNodes);
        this._updateKeyManagerItems(data.flattenedNodes);
    }
    _emitExpansionChanges(expansionChanges) {
        if (!expansionChanges) {
            return;
        }
        const nodes = this._nodes.value;
        for (const added of expansionChanges.added) {
            const node = nodes.get(added);
            node?._emitExpansionState(true);
        }
        for (const removed of expansionChanges.removed) {
            const node = nodes.get(removed);
            node?._emitExpansionState(false);
        }
    }
    _initializeKeyManager() {
        const items = combineLatest([this._keyManagerNodes, this._nodes]).pipe(map(([keyManagerNodes, renderNodes]) => keyManagerNodes.reduce((items, data) => {
            const node = renderNodes.get(this._getExpansionKey(data));
            if (node) {
                items.push(node);
            }
            return items;
        }, [])));
        const keyManagerOptions = {
            trackBy: node => this._getExpansionKey(node.data),
            skipPredicate: node => !!node.isDisabled,
            typeAheadDebounceInterval: true,
            horizontalOrientation: this._dir.value,
        };
        this._keyManager = this._keyManagerFactory(items, keyManagerOptions);
    }
    _initializeDataDiffer() {
        // Provide a default trackBy based on `_getExpansionKey` if one isn't provided.
        const trackBy = this.trackBy ?? ((_index, item) => this._getExpansionKey(item));
        this._dataDiffer = this._differs.find([]).create(trackBy);
    }
    _checkTreeControlUsage() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            // Verify that Tree follows API contract of using one of TreeControl, levelAccessor or
            // childrenAccessor. Throw an appropriate error if contract is not met.
            let numTreeControls = 0;
            if (this.treeControl) {
                numTreeControls++;
            }
            if (this.levelAccessor) {
                numTreeControls++;
            }
            if (this.childrenAccessor) {
                numTreeControls++;
            }
            if (!numTreeControls) {
                throw getTreeControlMissingError();
            }
            else if (numTreeControls > 1) {
                throw getMultipleTreeControlsError();
            }
        }
    }
    /** Check for changes made in the data and render each change (node added/removed/moved). */
    renderNodeChanges(data, dataDiffer = this._dataDiffer, viewContainer = this._nodeOutlet.viewContainer, parentData) {
        const changes = dataDiffer.diff(data);
        // Some tree consumers expect change detection to propagate to nodes
        // even when the array itself hasn't changed; we explicitly detect changes
        // anyways in order for nodes to update their data.
        //
        // However, if change detection is called while the component's view is
        // still initing, then the order of child views initing will be incorrect;
        // to prevent this, we only exit early if the view hasn't initialized yet.
        if (!changes && !this._viewInit) {
            return;
        }
        changes?.forEachOperation((item, adjustedPreviousIndex, currentIndex) => {
            if (item.previousIndex == null) {
                this.insertNode(data[currentIndex], currentIndex, viewContainer, parentData);
            }
            else if (currentIndex == null) {
                viewContainer.remove(adjustedPreviousIndex);
            }
            else {
                const view = viewContainer.get(adjustedPreviousIndex);
                viewContainer.move(view, currentIndex);
            }
        });
        // If the data itself changes, but keeps the same trackBy, we need to update the templates'
        // context to reflect the new object.
        changes?.forEachIdentityChange((record) => {
            const newData = record.item;
            if (record.currentIndex != undefined) {
                const view = viewContainer.get(record.currentIndex);
                view.context.$implicit = newData;
            }
        });
        // Note: we only `detectChanges` from a top-level call, otherwise we risk overflowing
        // the call stack since this method is called recursively (see #29733.)
        // TODO: change to `this._changeDetectorRef.markForCheck()`,
        // or just switch this component to use signals.
        if (parentData) {
            this._changeDetectorRef.markForCheck();
        }
        else {
            this._changeDetectorRef.detectChanges();
        }
    }
    /**
     * Finds the matching node definition that should be used for this node data. If there is only
     * one node definition, it is returned. Otherwise, find the node definition that has a when
     * predicate that returns true with the data. If none return true, return the default node
     * definition.
     */
    _getNodeDef(data, i) {
        if (this._nodeDefs.length === 1) {
            return this._nodeDefs.first;
        }
        const nodeDef = this._nodeDefs.find(def => def.when && def.when(i, data)) || this._defaultNodeDef;
        if (!nodeDef && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTreeMissingMatchingNodeDefError();
        }
        return nodeDef;
    }
    /**
     * Create the embedded view for the data node template and place it in the correct index location
     * within the data node view container.
     */
    insertNode(nodeData, index, viewContainer, parentData) {
        const levelAccessor = this._getLevelAccessor();
        const node = this._getNodeDef(nodeData, index);
        const key = this._getExpansionKey(nodeData);
        // Node context that will be provided to created embedded view
        const context = new CdkTreeNodeOutletContext(nodeData);
        parentData ??= this._parents.get(key) ?? undefined;
        // If the tree is flat tree, then use the `getLevel` function in flat tree control
        // Otherwise, use the level of parent node.
        if (levelAccessor) {
            context.level = levelAccessor(nodeData);
        }
        else if (parentData !== undefined && this._levels.has(this._getExpansionKey(parentData))) {
            context.level = this._levels.get(this._getExpansionKey(parentData)) + 1;
        }
        else {
            context.level = 0;
        }
        this._levels.set(key, context.level);
        // Use default tree nodeOutlet, or nested node's nodeOutlet
        const container = viewContainer ? viewContainer : this._nodeOutlet.viewContainer;
        container.createEmbeddedView(node.template, context, index);
        // Set the data to just created `CdkTreeNode`.
        // The `CdkTreeNode` created from `createEmbeddedView` will be saved in static variable
        //     `mostRecentTreeNode`. We get it from static variable and pass the node data to it.
        if (CdkTreeNode.mostRecentTreeNode) {
            CdkTreeNode.mostRecentTreeNode.data = nodeData;
        }
    }
    /** Whether the data node is expanded or collapsed. Returns true if it's expanded. */
    isExpanded(dataNode) {
        return !!(this.treeControl?.isExpanded(dataNode) ||
            this._expansionModel?.isSelected(this._getExpansionKey(dataNode)));
    }
    /** If the data node is currently expanded, collapse it. Otherwise, expand it. */
    toggle(dataNode) {
        if (this.treeControl) {
            this.treeControl.toggle(dataNode);
        }
        else if (this._expansionModel) {
            this._expansionModel.toggle(this._getExpansionKey(dataNode));
        }
    }
    /** Expand the data node. If it is already expanded, does nothing. */
    expand(dataNode) {
        if (this.treeControl) {
            this.treeControl.expand(dataNode);
        }
        else if (this._expansionModel) {
            this._expansionModel.select(this._getExpansionKey(dataNode));
        }
    }
    /** Collapse the data node. If it is already collapsed, does nothing. */
    collapse(dataNode) {
        if (this.treeControl) {
            this.treeControl.collapse(dataNode);
        }
        else if (this._expansionModel) {
            this._expansionModel.deselect(this._getExpansionKey(dataNode));
        }
    }
    /**
     * If the data node is currently expanded, collapse it and all its descendants.
     * Otherwise, expand it and all its descendants.
     */
    toggleDescendants(dataNode) {
        if (this.treeControl) {
            this.treeControl.toggleDescendants(dataNode);
        }
        else if (this._expansionModel) {
            if (this.isExpanded(dataNode)) {
                this.collapseDescendants(dataNode);
            }
            else {
                this.expandDescendants(dataNode);
            }
        }
    }
    /**
     * Expand the data node and all its descendants. If they are already expanded, does nothing.
     */
    expandDescendants(dataNode) {
        if (this.treeControl) {
            this.treeControl.expandDescendants(dataNode);
        }
        else if (this._expansionModel) {
            const expansionModel = this._expansionModel;
            expansionModel.select(this._getExpansionKey(dataNode));
            this._getDescendants(dataNode)
                .pipe(take(1), takeUntil(this._onDestroy))
                .subscribe(children => {
                expansionModel.select(...children.map(child => this._getExpansionKey(child)));
            });
        }
    }
    /** Collapse the data node and all its descendants. If it is already collapsed, does nothing. */
    collapseDescendants(dataNode) {
        if (this.treeControl) {
            this.treeControl.collapseDescendants(dataNode);
        }
        else if (this._expansionModel) {
            const expansionModel = this._expansionModel;
            expansionModel.deselect(this._getExpansionKey(dataNode));
            this._getDescendants(dataNode)
                .pipe(take(1), takeUntil(this._onDestroy))
                .subscribe(children => {
                expansionModel.deselect(...children.map(child => this._getExpansionKey(child)));
            });
        }
    }
    /** Expands all data nodes in the tree. */
    expandAll() {
        if (this.treeControl) {
            this.treeControl.expandAll();
        }
        else if (this._expansionModel) {
            const expansionModel = this._expansionModel;
            expansionModel.select(...this._flattenedNodes.value.map(child => this._getExpansionKey(child)));
        }
    }
    /** Collapse all data nodes in the tree. */
    collapseAll() {
        if (this.treeControl) {
            this.treeControl.collapseAll();
        }
        else if (this._expansionModel) {
            const expansionModel = this._expansionModel;
            expansionModel.deselect(...this._flattenedNodes.value.map(child => this._getExpansionKey(child)));
        }
    }
    /** Level accessor, used for compatibility between the old Tree and new Tree */
    _getLevelAccessor() {
        return this.treeControl?.getLevel?.bind(this.treeControl) ?? this.levelAccessor;
    }
    /** Children accessor, used for compatibility between the old Tree and new Tree */
    _getChildrenAccessor() {
        return this.treeControl?.getChildren?.bind(this.treeControl) ?? this.childrenAccessor;
    }
    /**
     * Gets the direct children of a node; used for compatibility between the old tree and the
     * new tree.
     */
    _getDirectChildren(dataNode) {
        const levelAccessor = this._getLevelAccessor();
        const expansionModel = this._expansionModel ?? this.treeControl?.expansionModel;
        if (!expansionModel) {
            return observableOf([]);
        }
        const key = this._getExpansionKey(dataNode);
        const isExpanded = expansionModel.changed.pipe(switchMap(changes => {
            if (changes.added.includes(key)) {
                return observableOf(true);
            }
            else if (changes.removed.includes(key)) {
                return observableOf(false);
            }
            return EMPTY;
        }), startWith(this.isExpanded(dataNode)));
        if (levelAccessor) {
            return combineLatest([isExpanded, this._flattenedNodes]).pipe(map(([expanded, flattenedNodes]) => {
                if (!expanded) {
                    return [];
                }
                return this._findChildrenByLevel(levelAccessor, flattenedNodes, dataNode, 1);
            }));
        }
        const childrenAccessor = this._getChildrenAccessor();
        if (childrenAccessor) {
            return coerceObservable(childrenAccessor(dataNode) ?? []);
        }
        throw getTreeControlMissingError();
    }
    /**
     * Given the list of flattened nodes, the level accessor, and the level range within
     * which to consider children, finds the children for a given node.
     *
     * For example, for direct children, `levelDelta` would be 1. For all descendants,
     * `levelDelta` would be Infinity.
     */
    _findChildrenByLevel(levelAccessor, flattenedNodes, dataNode, levelDelta) {
        const key = this._getExpansionKey(dataNode);
        const startIndex = flattenedNodes.findIndex(node => this._getExpansionKey(node) === key);
        const dataNodeLevel = levelAccessor(dataNode);
        const expectedLevel = dataNodeLevel + levelDelta;
        const results = [];
        // Goes through flattened tree nodes in the `flattenedNodes` array, and get all
        // descendants within a certain level range.
        //
        // If we reach a node whose level is equal to or less than the level of the tree node,
        // we hit a sibling or parent's sibling, and should stop.
        for (let i = startIndex + 1; i < flattenedNodes.length; i++) {
            const currentLevel = levelAccessor(flattenedNodes[i]);
            if (currentLevel <= dataNodeLevel) {
                break;
            }
            if (currentLevel <= expectedLevel) {
                results.push(flattenedNodes[i]);
            }
        }
        return results;
    }
    /**
     * Adds the specified node component to the tree's internal registry.
     *
     * This primarily facilitates keyboard navigation.
     */
    _registerNode(node) {
        this._nodes.value.set(this._getExpansionKey(node.data), node);
        this._nodes.next(this._nodes.value);
    }
    /** Removes the specified node component from the tree's internal registry. */
    _unregisterNode(node) {
        this._nodes.value.delete(this._getExpansionKey(node.data));
        this._nodes.next(this._nodes.value);
    }
    /**
     * For the given node, determine the level where this node appears in the tree.
     *
     * This is intended to be used for `aria-level` but is 0-indexed.
     */
    _getLevel(node) {
        return this._levels.get(this._getExpansionKey(node));
    }
    /**
     * For the given node, determine the size of the parent's child set.
     *
     * This is intended to be used for `aria-setsize`.
     */
    _getSetSize(dataNode) {
        const set = this._getAriaSet(dataNode);
        return set.length;
    }
    /**
     * For the given node, determine the index (starting from 1) of the node in its parent's child set.
     *
     * This is intended to be used for `aria-posinset`.
     */
    _getPositionInSet(dataNode) {
        const set = this._getAriaSet(dataNode);
        const key = this._getExpansionKey(dataNode);
        return set.findIndex(node => this._getExpansionKey(node) === key) + 1;
    }
    /** Given a CdkTreeNode, gets the node that renders that node's parent's data. */
    _getNodeParent(node) {
        const parent = this._parents.get(this._getExpansionKey(node.data));
        return parent && this._nodes.value.get(this._getExpansionKey(parent));
    }
    /** Given a CdkTreeNode, gets the nodes that renders that node's child data. */
    _getNodeChildren(node) {
        return this._getDirectChildren(node.data).pipe(map(children => children.reduce((nodes, child) => {
            const value = this._nodes.value.get(this._getExpansionKey(child));
            if (value) {
                nodes.push(value);
            }
            return nodes;
        }, [])));
    }
    /** `keydown` event handler; this just passes the event to the `TreeKeyManager`. */
    _sendKeydownToKeyManager(event) {
        this._keyManager.onKeydown(event);
    }
    /** Gets all nested descendants of a given node. */
    _getDescendants(dataNode) {
        if (this.treeControl) {
            return observableOf(this.treeControl.getDescendants(dataNode));
        }
        if (this.levelAccessor) {
            const results = this._findChildrenByLevel(this.levelAccessor, this._flattenedNodes.value, dataNode, Infinity);
            return observableOf(results);
        }
        if (this.childrenAccessor) {
            return this._getAllChildrenRecursively(dataNode).pipe(reduce((allChildren, nextChildren) => {
                allChildren.push(...nextChildren);
                return allChildren;
            }, []));
        }
        throw getTreeControlMissingError();
    }
    /**
     * Gets all children and sub-children of the provided node.
     *
     * This will emit multiple times, in the order that the children will appear
     * in the tree, and can be combined with a `reduce` operator.
     */
    _getAllChildrenRecursively(dataNode) {
        if (!this.childrenAccessor) {
            return observableOf([]);
        }
        return coerceObservable(this.childrenAccessor(dataNode)).pipe(take(1), switchMap(children => {
            // Here, we cache the parents of a particular child so that we can compute the levels.
            for (const child of children) {
                this._parents.set(this._getExpansionKey(child), dataNode);
            }
            return observableOf(...children).pipe(concatMap(child => concat(observableOf([child]), this._getAllChildrenRecursively(child))));
        }));
    }
    _getExpansionKey(dataNode) {
        // In the case that a key accessor function was not provided by the
        // tree user, we'll default to using the node object itself as the key.
        //
        // This cast is safe since:
        // - if an expansionKey is provided, TS will infer the type of K to be
        //   the return type.
        // - if it's not, then K will be defaulted to T.
        return this.expansionKey?.(dataNode) ?? dataNode;
    }
    _getAriaSet(node) {
        const key = this._getExpansionKey(node);
        const parent = this._parents.get(key);
        const parentKey = parent ? this._getExpansionKey(parent) : null;
        const set = this._ariaSets.get(parentKey);
        return set ?? [node];
    }
    /**
     * Finds the parent for the given node. If this is a root node, this
     * returns null. If we're unable to determine the parent, for example,
     * if we don't have cached node data, this returns undefined.
     */
    _findParentForNode(node, index, cachedNodes) {
        // In all cases, we have a mapping from node to level; all we need to do here is backtrack in
        // our flattened list of nodes to determine the first node that's of a level lower than the
        // provided node.
        if (!cachedNodes.length) {
            return null;
        }
        const currentLevel = this._levels.get(this._getExpansionKey(node)) ?? 0;
        for (let parentIndex = index - 1; parentIndex >= 0; parentIndex--) {
            const parentNode = cachedNodes[parentIndex];
            const parentLevel = this._levels.get(this._getExpansionKey(parentNode)) ?? 0;
            if (parentLevel < currentLevel) {
                return parentNode;
            }
        }
        return null;
    }
    /**
     * Given a set of root nodes and the current node level, flattens any nested
     * nodes into a single array.
     *
     * If any nodes are not expanded, then their children will not be added into the array.
     * This will still traverse all nested children in order to build up our internal data
     * models, but will not include them in the returned array.
     */
    _flattenNestedNodesWithExpansion(nodes, level = 0) {
        const childrenAccessor = this._getChildrenAccessor();
        // If we're using a level accessor, we don't need to flatten anything.
        if (!childrenAccessor) {
            return observableOf([...nodes]);
        }
        return observableOf(...nodes).pipe(concatMap(node => {
            const parentKey = this._getExpansionKey(node);
            if (!this._parents.has(parentKey)) {
                this._parents.set(parentKey, null);
            }
            this._levels.set(parentKey, level);
            const children = coerceObservable(childrenAccessor(node));
            return concat(observableOf([node]), children.pipe(take(1), tap(childNodes => {
                this._ariaSets.set(parentKey, [...(childNodes ?? [])]);
                for (const child of childNodes ?? []) {
                    const childKey = this._getExpansionKey(child);
                    this._parents.set(childKey, node);
                    this._levels.set(childKey, level + 1);
                }
            }), switchMap(childNodes => {
                if (!childNodes) {
                    return observableOf([]);
                }
                return this._flattenNestedNodesWithExpansion(childNodes, level + 1).pipe(map(nestedNodes => (this.isExpanded(node) ? nestedNodes : [])));
            })));
        }), reduce((results, children) => {
            results.push(...children);
            return results;
        }, []));
    }
    /**
     * Converts children for certain tree configurations.
     *
     * This also computes parent, level, and group data.
     */
    _computeRenderingData(nodes, nodeType) {
        // The only situations where we have to convert children types is when
        // they're mismatched; i.e. if the tree is using a childrenAccessor and the
        // nodes are flat, or if the tree is using a levelAccessor and the nodes are
        // nested.
        if (this.childrenAccessor && nodeType === 'flat') {
            // This flattens children into a single array.
            this._ariaSets.set(null, [...nodes]);
            return this._flattenNestedNodesWithExpansion(nodes).pipe(map(flattenedNodes => ({
                renderNodes: flattenedNodes,
                flattenedNodes,
            })));
        }
        else if (this.levelAccessor && nodeType === 'nested') {
            // In the nested case, we only look for root nodes. The CdkNestedNode
            // itself will handle rendering each individual node's children.
            const levelAccessor = this.levelAccessor;
            return observableOf(nodes.filter(node => levelAccessor(node) === 0)).pipe(map(rootNodes => ({
                renderNodes: rootNodes,
                flattenedNodes: nodes,
            })), tap(({ flattenedNodes }) => {
                this._calculateParents(flattenedNodes);
            }));
        }
        else if (nodeType === 'flat') {
            // In the case of a TreeControl, we know that the node type matches up
            // with the TreeControl, and so no conversions are necessary. Otherwise,
            // we've already confirmed that the data model matches up with the
            // desired node type here.
            return observableOf({ renderNodes: nodes, flattenedNodes: nodes }).pipe(tap(({ flattenedNodes }) => {
                this._calculateParents(flattenedNodes);
            }));
        }
        else {
            // For nested nodes, we still need to perform the node flattening in order
            // to maintain our caches for various tree operations.
            this._ariaSets.set(null, [...nodes]);
            return this._flattenNestedNodesWithExpansion(nodes).pipe(map(flattenedNodes => ({
                renderNodes: nodes,
                flattenedNodes,
            })));
        }
    }
    _updateCachedData(flattenedNodes) {
        this._flattenedNodes.next(flattenedNodes);
    }
    _updateKeyManagerItems(flattenedNodes) {
        this._keyManagerNodes.next(flattenedNodes);
    }
    /** Traverse the flattened node data and compute parents, levels, and group data. */
    _calculateParents(flattenedNodes) {
        const levelAccessor = this._getLevelAccessor();
        if (!levelAccessor) {
            return;
        }
        this._parents.clear();
        this._ariaSets.clear();
        for (let index = 0; index < flattenedNodes.length; index++) {
            const dataNode = flattenedNodes[index];
            const key = this._getExpansionKey(dataNode);
            this._levels.set(key, levelAccessor(dataNode));
            const parent = this._findParentForNode(dataNode, index, flattenedNodes);
            this._parents.set(key, parent);
            const parentKey = parent ? this._getExpansionKey(parent) : null;
            const group = this._ariaSets.get(parentKey) ?? [];
            group.splice(index, 0, dataNode);
            this._ariaSets.set(parentKey, group);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTree, deps: [{ token: i0.IterableDiffers }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.2.0-next.2", type: CdkTree, isStandalone: true, selector: "cdk-tree", inputs: { dataSource: "dataSource", treeControl: "treeControl", levelAccessor: "levelAccessor", childrenAccessor: "childrenAccessor", trackBy: "trackBy", expansionKey: "expansionKey" }, host: { attributes: { "role": "tree" }, listeners: { "keydown": "_sendKeydownToKeyManager($event)" }, classAttribute: "cdk-tree" }, queries: [{ propertyName: "_nodeDefs", predicate: CdkTreeNodeDef, descendants: true }], viewQueries: [{ propertyName: "_nodeOutlet", first: true, predicate: CdkTreeNodeOutlet, descendants: true, static: true }], exportAs: ["cdkTree"], ngImport: i0, template: `<ng-container cdkTreeNodeOutlet></ng-container>`, isInline: true, dependencies: [{ kind: "directive", type: CdkTreeNodeOutlet, selector: "[cdkTreeNodeOutlet]" }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTree, decorators: [{
            type: Component,
            args: [{
                    selector: 'cdk-tree',
                    exportAs: 'cdkTree',
                    template: `<ng-container cdkTreeNodeOutlet></ng-container>`,
                    host: {
                        'class': 'cdk-tree',
                        'role': 'tree',
                        '(keydown)': '_sendKeydownToKeyManager($event)',
                    },
                    encapsulation: ViewEncapsulation.None,
                    // The "OnPush" status for the `CdkTree` component is effectively a noop, so we are removing it.
                    // The view for `CdkTree` consists entirely of templates declared in other views. As they are
                    // declared elsewhere, they are checked when their declaration points are checked.
                    // tslint:disable-next-line:validate-decorators
                    changeDetection: ChangeDetectionStrategy.Default,
                    standalone: true,
                    imports: [CdkTreeNodeOutlet],
                }]
        }], ctorParameters: () => [{ type: i0.IterableDiffers }, { type: i0.ChangeDetectorRef }], propDecorators: { dataSource: [{
                type: Input
            }], treeControl: [{
                type: Input
            }], levelAccessor: [{
                type: Input
            }], childrenAccessor: [{
                type: Input
            }], trackBy: [{
                type: Input
            }], expansionKey: [{
                type: Input
            }], _nodeOutlet: [{
                type: ViewChild,
                args: [CdkTreeNodeOutlet, { static: true }]
            }], _nodeDefs: [{
                type: ContentChildren,
                args: [CdkTreeNodeDef, {
                        // We need to use `descendants: true`, because Ivy will no longer match
                        // indirect descendants if it's left as false.
                        descendants: true,
                    }]
            }] } });
/**
 * Tree node for CdkTree. It contains the data in the tree node.
 */
export class CdkTreeNode {
    /**
     * The role of the tree node.
     *
     * @deprecated This will be ignored; the tree will automatically determine the appropriate role
     * for tree node. This input will be removed in a future version.
     * @breaking-change 21.0.0
     */
    get role() {
        return 'treeitem';
    }
    set role(_role) {
        // ignore any role setting, we handle this internally.
    }
    /**
     * Whether or not this node is expandable.
     *
     * If not using `FlatTreeControl`, or if `isExpandable` is not provided to
     * `NestedTreeControl`, this should be provided for correct node a11y.
     */
    get isExpandable() {
        return this._isExpandable();
    }
    set isExpandable(isExpandable) {
        this._inputIsExpandable = isExpandable;
        if ((this.data && !this._isExpandable) || !this._inputIsExpandable) {
            return;
        }
        // If the node is being set to expandable, ensure that the status of the
        // node is propagated
        if (this._inputIsExpanded) {
            this.expand();
        }
        else if (this._inputIsExpanded === false) {
            this.collapse();
        }
    }
    get isExpanded() {
        return this._tree.isExpanded(this._data);
    }
    set isExpanded(isExpanded) {
        this._inputIsExpanded = isExpanded;
        if (isExpanded) {
            this.expand();
        }
        else {
            this.collapse();
        }
    }
    getLabel() {
        return this.typeaheadLabel || this._elementRef.nativeElement.textContent?.trim() || '';
    }
    /**
     * The most recently created `CdkTreeNode`. We save it in static variable so we can retrieve it
     * in `CdkTree` and set the data to it.
     */
    static { this.mostRecentTreeNode = null; }
    /** The tree node's data. */
    get data() {
        return this._data;
    }
    set data(value) {
        if (value !== this._data) {
            this._data = value;
            this._dataChanges.next();
        }
    }
    /* If leaf node, return true to not assign aria-expanded attribute */
    get isLeafNode() {
        // If flat tree node data returns false for expandable property, it's a leaf node
        if (this._tree.treeControl?.isExpandable !== undefined &&
            !this._tree.treeControl.isExpandable(this._data)) {
            return true;
            // If nested tree node data returns 0 descendants, it's a leaf node
        }
        else if (this._tree.treeControl?.isExpandable === undefined &&
            this._tree.treeControl?.getDescendants(this._data).length === 0) {
            return true;
        }
        return false;
    }
    get level() {
        // If the tree has a levelAccessor, use it to get the level. Otherwise read the
        // aria-level off the parent node and use it as the level for this node (note aria-level is
        // 1-indexed, while this property is 0-indexed, so we don't need to increment).
        return this._tree._getLevel(this._data) ?? this._parentNodeAriaLevel;
    }
    /** Determines if the tree node is expandable. */
    _isExpandable() {
        if (this._tree.treeControl) {
            if (this.isLeafNode) {
                return false;
            }
            // For compatibility with trees created using TreeControl before we added
            // CdkTreeNode#isExpandable.
            return true;
        }
        return this._inputIsExpandable;
    }
    /**
     * Determines the value for `aria-expanded`.
     *
     * For non-expandable nodes, this is `null`.
     */
    _getAriaExpanded() {
        if (!this._isExpandable()) {
            return null;
        }
        return String(this.isExpanded);
    }
    /**
     * Determines the size of this node's parent's child set.
     *
     * This is intended to be used for `aria-setsize`.
     */
    _getSetSize() {
        return this._tree._getSetSize(this._data);
    }
    /**
     * Determines the index (starting from 1) of this node in its parent's child set.
     *
     * This is intended to be used for `aria-posinset`.
     */
    _getPositionInSet() {
        return this._tree._getPositionInSet(this._data);
    }
    constructor(_elementRef, _tree) {
        this._elementRef = _elementRef;
        this._tree = _tree;
        this._tabindex = -1;
        /** This emits when the node has been programatically activated or activated by keyboard. */
        this.activation = new EventEmitter();
        /** This emits when the node's expansion status has been changed. */
        this.expandedChange = new EventEmitter();
        /** Subject that emits when the component has been destroyed. */
        this._destroyed = new Subject();
        /** Emits when the node's data has changed. */
        this._dataChanges = new Subject();
        this._inputIsExpandable = false;
        this._inputIsExpanded = undefined;
        /**
         * Flag used to determine whether or not we should be focusing the actual element based on
         * some user interaction (click or focus). On click, we don't forcibly focus the element
         * since the click could trigger some other component that wants to grab its own focus
         * (e.g. menu, dialog).
         */
        this._shouldFocus = true;
        this._changeDetectorRef = inject(ChangeDetectorRef);
        CdkTreeNode.mostRecentTreeNode = this;
    }
    ngOnInit() {
        this._parentNodeAriaLevel = getParentNodeAriaLevel(this._elementRef.nativeElement);
        this._tree
            ._getExpansionModel()
            .changed.pipe(map(() => this.isExpanded), distinctUntilChanged())
            .subscribe(() => {
            this._changeDetectorRef.markForCheck();
        });
        this._tree._setNodeTypeIfUnset('flat');
        this._tree._registerNode(this);
    }
    ngOnDestroy() {
        // If this is the last tree node being destroyed,
        // clear out the reference to avoid leaking memory.
        if (CdkTreeNode.mostRecentTreeNode === this) {
            CdkTreeNode.mostRecentTreeNode = null;
        }
        this._dataChanges.complete();
        this._destroyed.next();
        this._destroyed.complete();
    }
    getParent() {
        return this._tree._getNodeParent(this) ?? null;
    }
    getChildren() {
        return this._tree._getNodeChildren(this);
    }
    /** Focuses this data node. Implemented for TreeKeyManagerItem. */
    focus() {
        this._tabindex = 0;
        if (this._shouldFocus) {
            this._elementRef.nativeElement.focus();
        }
        this._changeDetectorRef.markForCheck();
    }
    /** Defocus this data node. */
    unfocus() {
        this._tabindex = -1;
        this._changeDetectorRef.markForCheck();
    }
    /** Emits an activation event. Implemented for TreeKeyManagerItem. */
    activate() {
        if (this.isDisabled) {
            return;
        }
        this.activation.next(this._data);
    }
    /** Collapses this data node. Implemented for TreeKeyManagerItem. */
    collapse() {
        if (this.isExpandable) {
            this._tree.collapse(this._data);
        }
    }
    /** Expands this data node. Implemented for TreeKeyManagerItem. */
    expand() {
        if (this.isExpandable) {
            this._tree.expand(this._data);
        }
    }
    /** Makes the node focusable. Implemented for TreeKeyManagerItem. */
    makeFocusable() {
        this._tabindex = 0;
        this._changeDetectorRef.markForCheck();
    }
    _focusItem() {
        if (this.isDisabled) {
            return;
        }
        this._tree._keyManager.focusItem(this);
    }
    _setActiveItem() {
        if (this.isDisabled) {
            return;
        }
        this._shouldFocus = false;
        this._tree._keyManager.focusItem(this);
        this._shouldFocus = true;
    }
    _emitExpansionState(expanded) {
        this.expandedChange.emit(expanded);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTreeNode, deps: [{ token: i0.ElementRef }, { token: CdkTree }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "18.2.0-next.2", type: CdkTreeNode, isStandalone: true, selector: "cdk-tree-node", inputs: { role: "role", isExpandable: ["isExpandable", "isExpandable", booleanAttribute], isExpanded: "isExpanded", isDisabled: ["isDisabled", "isDisabled", booleanAttribute], typeaheadLabel: ["cdkTreeNodeTypeaheadLabel", "typeaheadLabel"] }, outputs: { activation: "activation", expandedChange: "expandedChange" }, host: { attributes: { "role": "treeitem" }, listeners: { "click": "_setActiveItem()", "focus": "_focusItem()" }, properties: { "attr.aria-expanded": "_getAriaExpanded()", "attr.aria-level": "level + 1", "attr.aria-posinset": "_getPositionInSet()", "attr.aria-setsize": "_getSetSize()", "tabindex": "_tabindex" }, classAttribute: "cdk-tree-node" }, exportAs: ["cdkTreeNode"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTreeNode, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-tree-node',
                    exportAs: 'cdkTreeNode',
                    host: {
                        'class': 'cdk-tree-node',
                        '[attr.aria-expanded]': '_getAriaExpanded()',
                        '[attr.aria-level]': 'level + 1',
                        '[attr.aria-posinset]': '_getPositionInSet()',
                        '[attr.aria-setsize]': '_getSetSize()',
                        '[tabindex]': '_tabindex',
                        'role': 'treeitem',
                        '(click)': '_setActiveItem()',
                        '(focus)': '_focusItem()',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: CdkTree }], propDecorators: { role: [{
                type: Input
            }], isExpandable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], isExpanded: [{
                type: Input
            }], isDisabled: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], typeaheadLabel: [{
                type: Input,
                args: ['cdkTreeNodeTypeaheadLabel']
            }], activation: [{
                type: Output
            }], expandedChange: [{
                type: Output
            }] } });
function getParentNodeAriaLevel(nodeElement) {
    let parent = nodeElement.parentElement;
    while (parent && !isNodeElement(parent)) {
        parent = parent.parentElement;
    }
    if (!parent) {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throw Error('Incorrect tree structure containing detached node.');
        }
        else {
            return -1;
        }
    }
    else if (parent.classList.contains('cdk-nested-tree-node')) {
        return numberAttribute(parent.getAttribute('aria-level'));
    }
    else {
        // The ancestor element is the cdk-tree itself
        return 0;
    }
}
function isNodeElement(element) {
    const classList = element.classList;
    return !!(classList?.contains('cdk-nested-tree-node') || classList?.contains('cdk-tree'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS90cmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFDTCxnQkFBZ0IsR0FLakIsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUdMLFlBQVksRUFFWixjQUFjLEdBQ2YsTUFBTSwwQkFBMEIsQ0FBQztBQUNsQyxPQUFPLEVBSUwsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUVaLEtBQUssRUFHTCxlQUFlLEVBR2YsTUFBTSxFQUNOLFNBQVMsRUFFVCxTQUFTLEVBRVQsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixNQUFNLEVBQ04sZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQy9ELE9BQU8sRUFDTCxlQUFlLEVBQ2YsYUFBYSxFQUNiLE1BQU0sRUFDTixLQUFLLEVBRUwsT0FBTyxFQUVQLFlBQVksRUFDWixFQUFFLElBQUksWUFBWSxHQUNuQixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsU0FBUyxFQUNULEdBQUcsRUFDSCxNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxJQUFJLEVBQ0osU0FBUyxFQUNULEdBQUcsR0FDSixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBQyxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFDTCw0QkFBNEIsRUFDNUIsMEJBQTBCLEVBQzFC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U0FBTSxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztRQUM3RCxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBRSxDQUFDLENBQUM7SUFDN0QsQ0FBQztTQUFNLENBQUM7UUFDTiw4Q0FBOEM7UUFDOUMsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE9BQW9CO0lBQ3pDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDcEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLHNCQUFzQixDQUFDLElBQUksU0FBUyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQzVGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFRSRUVfS0VZX01BTkFHRVIsXG4gIFRyZWVLZXlNYW5hZ2VyRmFjdG9yeSxcbiAgVHJlZUtleU1hbmFnZXJJdGVtLFxuICBUcmVlS2V5TWFuYWdlck9wdGlvbnMsXG4gIFRyZWVLZXlNYW5hZ2VyU3RyYXRlZ3ksXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIGlzRGF0YVNvdXJjZSxcbiAgU2VsZWN0aW9uQ2hhbmdlLFxuICBTZWxlY3Rpb25Nb2RlbCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudENoZWNrZWQsXG4gIEFmdGVyQ29udGVudEluaXQsXG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUcmFja0J5RnVuY3Rpb24sXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIG51bWJlckF0dHJpYnV0ZSxcbiAgaW5qZWN0LFxuICBib29sZWFuQXR0cmlidXRlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29lcmNlT2JzZXJ2YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uL3ByaXZhdGUnO1xuaW1wb3J0IHtcbiAgQmVoYXZpb3JTdWJqZWN0LFxuICBjb21iaW5lTGF0ZXN0LFxuICBjb25jYXQsXG4gIEVNUFRZLFxuICBPYnNlcnZhYmxlLFxuICBTdWJqZWN0LFxuICBTdWJzY3JpcHRpb24sXG4gIGlzT2JzZXJ2YWJsZSxcbiAgb2YgYXMgb2JzZXJ2YWJsZU9mLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIGRpc3RpbmN0VW50aWxDaGFuZ2VkLFxuICBjb25jYXRNYXAsXG4gIG1hcCxcbiAgcmVkdWNlLFxuICBzdGFydFdpdGgsXG4gIHN3aXRjaE1hcCxcbiAgdGFrZSxcbiAgdGFrZVVudGlsLFxuICB0YXAsXG59IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7VHJlZUNvbnRyb2x9IGZyb20gJy4vY29udHJvbC90cmVlLWNvbnRyb2wnO1xuaW1wb3J0IHtDZGtUcmVlTm9kZURlZiwgQ2RrVHJlZU5vZGVPdXRsZXRDb250ZXh0fSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtDZGtUcmVlTm9kZU91dGxldH0gZnJvbSAnLi9vdXRsZXQnO1xuaW1wb3J0IHtcbiAgZ2V0TXVsdGlwbGVUcmVlQ29udHJvbHNFcnJvcixcbiAgZ2V0VHJlZUNvbnRyb2xNaXNzaW5nRXJyb3IsXG4gIGdldFRyZWVNaXNzaW5nTWF0Y2hpbmdOb2RlRGVmRXJyb3IsXG4gIGdldFRyZWVNdWx0aXBsZURlZmF1bHROb2RlRGVmc0Vycm9yLFxuICBnZXRUcmVlTm9WYWxpZERhdGFTb3VyY2VFcnJvcixcbn0gZnJvbSAnLi90cmVlLWVycm9ycyc7XG5cbnR5cGUgUmVuZGVyaW5nRGF0YTxUPiA9XG4gIHwge1xuICAgICAgZmxhdHRlbmVkTm9kZXM6IG51bGw7XG4gICAgICBub2RlVHlwZTogbnVsbDtcbiAgICAgIHJlbmRlck5vZGVzOiByZWFkb25seSBUW107XG4gICAgfVxuICB8IHtcbiAgICAgIGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW107XG4gICAgICBub2RlVHlwZTogJ25lc3RlZCcgfCAnZmxhdCc7XG4gICAgICByZW5kZXJOb2RlczogcmVhZG9ubHkgVFtdO1xuICAgIH07XG5cbi8qKlxuICogQ0RLIHRyZWUgY29tcG9uZW50IHRoYXQgY29ubmVjdHMgd2l0aCBhIGRhdGEgc291cmNlIHRvIHJldHJpZXZlIGRhdGEgb2YgdHlwZSBgVGAgYW5kIHJlbmRlcnNcbiAqIGRhdGFOb2RlcyB3aXRoIGhpZXJhcmNoeS4gVXBkYXRlcyB0aGUgZGF0YU5vZGVzIHdoZW4gbmV3IGRhdGEgaXMgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdHJlZScsXG4gIGV4cG9ydEFzOiAnY2RrVHJlZScsXG4gIHRlbXBsYXRlOiBgPG5nLWNvbnRhaW5lciBjZGtUcmVlTm9kZU91dGxldD48L25nLWNvbnRhaW5lcj5gLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay10cmVlJyxcbiAgICAncm9sZSc6ICd0cmVlJyxcbiAgICAnKGtleWRvd24pJzogJ19zZW5kS2V5ZG93blRvS2V5TWFuYWdlcigkZXZlbnQpJyxcbiAgfSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgLy8gVGhlIFwiT25QdXNoXCIgc3RhdHVzIGZvciB0aGUgYENka1RyZWVgIGNvbXBvbmVudCBpcyBlZmZlY3RpdmVseSBhIG5vb3AsIHNvIHdlIGFyZSByZW1vdmluZyBpdC5cbiAgLy8gVGhlIHZpZXcgZm9yIGBDZGtUcmVlYCBjb25zaXN0cyBlbnRpcmVseSBvZiB0ZW1wbGF0ZXMgZGVjbGFyZWQgaW4gb3RoZXIgdmlld3MuIEFzIHRoZXkgYXJlXG4gIC8vIGRlY2xhcmVkIGVsc2V3aGVyZSwgdGhleSBhcmUgY2hlY2tlZCB3aGVuIHRoZWlyIGRlY2xhcmF0aW9uIHBvaW50cyBhcmUgY2hlY2tlZC5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBpbXBvcnRzOiBbQ2RrVHJlZU5vZGVPdXRsZXRdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlPFQsIEsgPSBUPlxuICBpbXBsZW1lbnRzXG4gICAgQWZ0ZXJDb250ZW50Q2hlY2tlZCxcbiAgICBBZnRlckNvbnRlbnRJbml0LFxuICAgIEFmdGVyVmlld0luaXQsXG4gICAgQ29sbGVjdGlvblZpZXdlcixcbiAgICBPbkRlc3Ryb3ksXG4gICAgT25Jbml0XG57XG4gIHByaXZhdGUgX2RpciA9IGluamVjdChEaXJlY3Rpb25hbGl0eSk7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9vbkRlc3Ryb3kgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBEaWZmZXIgdXNlZCB0byBmaW5kIHRoZSBjaGFuZ2VzIGluIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8VD47XG5cbiAgLyoqIFN0b3JlcyB0aGUgbm9kZSBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Tm9kZURlZjogQ2RrVHJlZU5vZGVEZWY8VD4gfCBudWxsO1xuXG4gIC8qKiBEYXRhIHN1YnNjcmlwdGlvbiAqL1xuICBwcml2YXRlIF9kYXRhU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsO1xuXG4gIC8qKiBMZXZlbCBvZiBub2RlcyAqL1xuICBwcml2YXRlIF9sZXZlbHM6IE1hcDxLLCBudW1iZXI+ID0gbmV3IE1hcDxLLCBudW1iZXI+KCk7XG5cbiAgLyoqIFRoZSBpbW1lZGlhdGUgcGFyZW50cyBmb3IgYSBub2RlLiBUaGlzIGlzIGBudWxsYCBpZiB0aGVyZSBpcyBubyBwYXJlbnQuICovXG4gIHByaXZhdGUgX3BhcmVudHM6IE1hcDxLLCBUIHwgbnVsbD4gPSBuZXcgTWFwPEssIFQgfCBudWxsPigpO1xuXG4gIC8qKlxuICAgKiBOb2RlcyBncm91cGVkIGludG8gZWFjaCBzZXQsIHdoaWNoIGlzIGEgbGlzdCBvZiBub2RlcyBkaXNwbGF5ZWQgdG9nZXRoZXIgaW4gdGhlIERPTS5cbiAgICpcbiAgICogTG9va3VwIGtleSBpcyB0aGUgcGFyZW50IG9mIGEgc2V0LiBSb290IG5vZGVzIGhhdmUga2V5IG9mIG51bGwuXG4gICAqXG4gICAqIFZhbHVlcyBpcyBhICdzZXQnIG9mIHRyZWUgbm9kZXMuIEVhY2ggdHJlZSBub2RlIG1hcHMgdG8gYSB0cmVlaXRlbSBlbGVtZW50LiBTZXRzIGFyZSBpbiB0aGVcbiAgICogb3JkZXIgdGhhdCBpdCBpcyByZW5kZXJlZC4gRWFjaCBzZXQgbWFwcyBkaXJlY3RseSB0byBhcmlhLXBvc2luc2V0IGFuZCBhcmlhLXNldHNpemUgYXR0cmlidXRlcy5cbiAgICovXG4gIHByaXZhdGUgX2FyaWFTZXRzOiBNYXA8SyB8IG51bGwsIFRbXT4gPSBuZXcgTWFwPEsgfCBudWxsLCBUW10+KCk7XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGEgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBkYXRhIGFycmF5IHRvIHJlbmRlci4gSW5mbHVlbmNlZCBieSB0aGUgdHJlZSdzXG4gICAqIHN0cmVhbSBvZiB2aWV3IHdpbmRvdyAod2hhdCBkYXRhTm9kZXMgYXJlIGN1cnJlbnRseSBvbiBzY3JlZW4pLlxuICAgKiBEYXRhIHNvdXJjZSBjYW4gYmUgYW4gb2JzZXJ2YWJsZSBvZiBkYXRhIGFycmF5LCBvciBhIGRhdGEgYXJyYXkgdG8gcmVuZGVyLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRhdGFTb3VyY2UoKTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFTb3VyY2U7XG4gIH1cbiAgc2V0IGRhdGFTb3VyY2UoZGF0YVNvdXJjZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSkge1xuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICE9PSBkYXRhU291cmNlKSB7XG4gICAgICB0aGlzLl9zd2l0Y2hEYXRhU291cmNlKGRhdGFTb3VyY2UpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kYXRhU291cmNlOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgVFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgdHJlZSBjb250cm9sbGVyXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBvbmUgb2YgYGxldmVsQWNjZXNzb3JgIG9yIGBjaGlsZHJlbkFjY2Vzc29yYCBpbnN0ZWFkLiBUbyBiZSByZW1vdmVkIGluIGFcbiAgICogZnV0dXJlIHZlcnNpb24uXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMjEuMC4wXG4gICAqL1xuICBASW5wdXQoKSB0cmVlQ29udHJvbD86IFRyZWVDb250cm9sPFQsIEs+O1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGRhdGEgbm9kZSwgZGV0ZXJtaW5lcyB3aGF0IHRyZWUgbGV2ZWwgdGhlIG5vZGUgaXMgYXQuXG4gICAqXG4gICAqIE9uZSBvZiBsZXZlbEFjY2Vzc29yIG9yIGNoaWxkcmVuQWNjZXNzb3IgbXVzdCBiZSBzcGVjaWZpZWQsIG5vdCBib3RoLlxuICAgKiBUaGlzIGlzIGVuZm9yY2VkIGF0IHJ1bi10aW1lLlxuICAgKi9cbiAgQElucHV0KCkgbGV2ZWxBY2Nlc3Nvcj86IChkYXRhTm9kZTogVCkgPT4gbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGRhdGEgbm9kZSwgZGV0ZXJtaW5lcyB3aGF0IHRoZSBjaGlsZHJlbiBvZiB0aGF0IG5vZGUgYXJlLlxuICAgKlxuICAgKiBPbmUgb2YgbGV2ZWxBY2Nlc3NvciBvciBjaGlsZHJlbkFjY2Vzc29yIG11c3QgYmUgc3BlY2lmaWVkLCBub3QgYm90aC5cbiAgICogVGhpcyBpcyBlbmZvcmNlZCBhdCBydW4tdGltZS5cbiAgICovXG4gIEBJbnB1dCgpIGNoaWxkcmVuQWNjZXNzb3I/OiAoZGF0YU5vZGU6IFQpID0+IFRbXSB8IE9ic2VydmFibGU8VFtdPjtcblxuICAvKipcbiAgICogVHJhY2tpbmcgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gY2hlY2sgdGhlIGRpZmZlcmVuY2VzIGluIGRhdGEgY2hhbmdlcy4gVXNlZCBzaW1pbGFybHlcbiAgICogdG8gYG5nRm9yYCBgdHJhY2tCeWAgZnVuY3Rpb24uIE9wdGltaXplIG5vZGUgb3BlcmF0aW9ucyBieSBpZGVudGlmeWluZyBhIG5vZGUgYmFzZWQgb24gaXRzIGRhdGFcbiAgICogcmVsYXRpdmUgdG8gdGhlIGZ1bmN0aW9uIHRvIGtub3cgaWYgYSBub2RlIHNob3VsZCBiZSBhZGRlZC9yZW1vdmVkL21vdmVkLlxuICAgKiBBY2NlcHRzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gcGFyYW1ldGVycywgYGluZGV4YCBhbmQgYGl0ZW1gLlxuICAgKi9cbiAgQElucHV0KCkgdHJhY2tCeTogVHJhY2tCeUZ1bmN0aW9uPFQ+O1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGRhdGEgbm9kZSwgZGV0ZXJtaW5lcyB0aGUga2V5IGJ5IHdoaWNoIHdlIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgZXhwYW5kZWQuXG4gICAqL1xuICBASW5wdXQoKSBleHBhbnNpb25LZXk/OiAoZGF0YU5vZGU6IFQpID0+IEs7XG5cbiAgLy8gT3V0bGV0cyB3aXRoaW4gdGhlIHRyZWUncyB0ZW1wbGF0ZSB3aGVyZSB0aGUgZGF0YU5vZGVzIHdpbGwgYmUgaW5zZXJ0ZWQuXG4gIEBWaWV3Q2hpbGQoQ2RrVHJlZU5vZGVPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfbm9kZU91dGxldDogQ2RrVHJlZU5vZGVPdXRsZXQ7XG5cbiAgLyoqIFRoZSB0cmVlIG5vZGUgdGVtcGxhdGUgZm9yIHRoZSB0cmVlICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrVHJlZU5vZGVEZWYsIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBgZGVzY2VuZGFudHM6IHRydWVgLCBiZWNhdXNlIEl2eSB3aWxsIG5vIGxvbmdlciBtYXRjaFxuICAgIC8vIGluZGlyZWN0IGRlc2NlbmRhbnRzIGlmIGl0J3MgbGVmdCBhcyBmYWxzZS5cbiAgICBkZXNjZW5kYW50czogdHJ1ZSxcbiAgfSlcbiAgX25vZGVEZWZzOiBRdWVyeUxpc3Q8Q2RrVHJlZU5vZGVEZWY8VD4+O1xuXG4gIC8vIFRPRE8odGluYXl1YW5nYW8pOiBTZXR1cCBhIGxpc3RlbmVyIGZvciBzY3JvbGxpbmcsIGVtaXQgdGhlIGNhbGN1bGF0ZWQgdmlldyB0byB2aWV3Q2hhbmdlLlxuICAvLyAgICAgUmVtb3ZlIHRoZSBNQVhfVkFMVUUgaW4gdmlld0NoYW5nZVxuICAvKipcbiAgICogU3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBpbmZvcm1hdGlvbiBvbiB3aGF0IHJvd3MgYXJlIGJlaW5nIGRpc3BsYXllZCBvbiBzY3JlZW4uXG4gICAqIENhbiBiZSB1c2VkIGJ5IHRoZSBkYXRhIHNvdXJjZSB0byBhcyBhIGhldXJpc3RpYyBvZiB3aGF0IGRhdGEgc2hvdWxkIGJlIHByb3ZpZGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgdmlld0NoYW5nZSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8e3N0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyfT4oe1xuICAgIHN0YXJ0OiAwLFxuICAgIGVuZDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG5cbiAgLyoqIEtlZXAgdHJhY2sgb2Ygd2hpY2ggbm9kZXMgYXJlIGV4cGFuZGVkLiAqL1xuICBwcml2YXRlIF9leHBhbnNpb25Nb2RlbD86IFNlbGVjdGlvbk1vZGVsPEs+O1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIHN5bmNocm9ub3VzIGNhY2hlIG9mIGZsYXR0ZW5lZCBkYXRhIG5vZGVzLiBUaGlzIHdpbGwgb25seSBiZVxuICAgKiBwb3B1bGF0ZWQgYWZ0ZXIgaW5pdGlhbCByZW5kZXIsIGFuZCBpbiBjZXJ0YWluIGNhc2VzLCB3aWxsIGJlIGRlbGF5ZWQgZHVlIHRvXG4gICAqIHJlbHlpbmcgb24gT2JzZXJ2YWJsZSBgZ2V0Q2hpbGRyZW5gIGNhbGxzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZmxhdHRlbmVkTm9kZXM6IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+KFtdKTtcblxuICAvKiogVGhlIGF1dG9tYXRpY2FsbHkgZGV0ZXJtaW5lZCBub2RlIHR5cGUgZm9yIHRoZSB0cmVlLiAqL1xuICBwcml2YXRlIF9ub2RlVHlwZTogQmVoYXZpb3JTdWJqZWN0PCdmbGF0JyB8ICduZXN0ZWQnIHwgbnVsbD4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFxuICAgICdmbGF0JyB8ICduZXN0ZWQnIHwgbnVsbFxuICA+KG51bGwpO1xuXG4gIC8qKiBUaGUgbWFwcGluZyBiZXR3ZWVuIGRhdGEgYW5kIHRoZSBub2RlIHRoYXQgaXMgcmVuZGVyZWQuICovXG4gIHByaXZhdGUgX25vZGVzOiBCZWhhdmlvclN1YmplY3Q8TWFwPEssIENka1RyZWVOb2RlPFQsIEs+Pj4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KFxuICAgIG5ldyBNYXA8SywgQ2RrVHJlZU5vZGU8VCwgSz4+KCksXG4gICk7XG5cbiAgLyoqXG4gICAqIFN5bmNocm9ub3VzIGNhY2hlIG9mIG5vZGVzIGZvciB0aGUgYFRyZWVLZXlNYW5hZ2VyYC4gVGhpcyBpcyBzZXBhcmF0ZVxuICAgKiBmcm9tIGBfZmxhdHRlbmVkTm9kZXNgIHNvIHRoZXkgY2FuIGJlIGluZGVwZW5kZW50bHkgdXBkYXRlZCBhdCBkaWZmZXJlbnRcbiAgICogdGltZXMuXG4gICAqL1xuICBwcml2YXRlIF9rZXlNYW5hZ2VyTm9kZXM6IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+KFtdKTtcblxuICBwcml2YXRlIF9rZXlNYW5hZ2VyRmFjdG9yeSA9IGluamVjdChUUkVFX0tFWV9NQU5BR0VSKSBhcyBUcmVlS2V5TWFuYWdlckZhY3Rvcnk8Q2RrVHJlZU5vZGU8VCwgSz4+O1xuXG4gIC8qKiBUaGUga2V5IG1hbmFnZXIgZm9yIHRoaXMgdHJlZS4gSGFuZGxlcyBmb2N1cyBhbmQgYWN0aXZhdGlvbiBiYXNlZCBvbiB1c2VyIGtleWJvYXJkIGlucHV0LiAqL1xuICBfa2V5TWFuYWdlcjogVHJlZUtleU1hbmFnZXJTdHJhdGVneTxDZGtUcmVlTm9kZTxULCBLPj47XG4gIHByaXZhdGUgX3ZpZXdJbml0ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgKSB7fVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplS2V5TWFuYWdlcigpO1xuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCkge1xuICAgIHRoaXMuX3VwZGF0ZURlZmF1bHROb2RlRGVmaW5pdGlvbigpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvRGF0YUNoYW5nZXMoKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX25vZGVPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuXG4gICAgdGhpcy52aWV3Q2hhbmdlLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb25EZXN0cm95Lm5leHQoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kuY29tcGxldGUoKTtcblxuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICYmIHR5cGVvZiAodGhpcy5fZGF0YVNvdXJjZSBhcyBEYXRhU291cmNlPFQ+KS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAodGhpcy5kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RhdGFTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIC8vIEluIGNlcnRhaW4gdGVzdHMsIHRoZSB0cmVlIG1pZ2h0IGJlIGRlc3Ryb3llZCBiZWZvcmUgdGhpcyBpcyBpbml0aWFsaXplZFxuICAgIC8vIGluIGBuZ0FmdGVyQ29udGVudEluaXRgLlxuICAgIHRoaXMuX2tleU1hbmFnZXI/LmRlc3Ryb3koKTtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX2NoZWNrVHJlZUNvbnRyb2xVc2FnZSgpO1xuICAgIHRoaXMuX2luaXRpYWxpemVEYXRhRGlmZmVyKCk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5fdmlld0luaXQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlRGVmYXVsdE5vZGVEZWZpbml0aW9uKCkge1xuICAgIGNvbnN0IGRlZmF1bHROb2RlRGVmcyA9IHRoaXMuX25vZGVEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuKTtcbiAgICBpZiAoZGVmYXVsdE5vZGVEZWZzLmxlbmd0aCA+IDEgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRyZWVNdWx0aXBsZURlZmF1bHROb2RlRGVmc0Vycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHROb2RlRGVmID0gZGVmYXVsdE5vZGVEZWZzWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG5vZGUgdHlwZSBmb3IgdGhlIHRyZWUsIGlmIGl0IGhhc24ndCBiZWVuIHNldCB5ZXQuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBiZSBjYWxsZWQgYnkgdGhlIGZpcnN0IG5vZGUgdGhhdCdzIHJlbmRlcmVkIGluIG9yZGVyIGZvciB0aGUgdHJlZVxuICAgKiB0byBkZXRlcm1pbmUgd2hhdCBkYXRhIHRyYW5zZm9ybWF0aW9ucyBhcmUgcmVxdWlyZWQuXG4gICAqL1xuICBfc2V0Tm9kZVR5cGVJZlVuc2V0KG5vZGVUeXBlOiAnZmxhdCcgfCAnbmVzdGVkJykge1xuICAgIGlmICh0aGlzLl9ub2RlVHlwZS52YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fbm9kZVR5cGUubmV4dChub2RlVHlwZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN3aXRjaCB0byB0aGUgcHJvdmlkZWQgZGF0YSBzb3VyY2UgYnkgcmVzZXR0aW5nIHRoZSBkYXRhIGFuZCB1bnN1YnNjcmliaW5nIGZyb20gdGhlIGN1cnJlbnRcbiAgICogcmVuZGVyIGNoYW5nZSBzdWJzY3JpcHRpb24gaWYgb25lIGV4aXN0cy4gSWYgdGhlIGRhdGEgc291cmNlIGlzIG51bGwsIGludGVycHJldCB0aGlzIGJ5XG4gICAqIGNsZWFyaW5nIHRoZSBub2RlIG91dGxldC4gT3RoZXJ3aXNlIHN0YXJ0IGxpc3RlbmluZyBmb3IgbmV3IGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9zd2l0Y2hEYXRhU291cmNlKGRhdGFTb3VyY2U6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBUW10pIHtcbiAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSAmJiB0eXBlb2YgKHRoaXMuX2RhdGFTb3VyY2UgYXMgRGF0YVNvdXJjZTxUPikuZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgKHRoaXMuZGF0YVNvdXJjZSBhcyBEYXRhU291cmNlPFQ+KS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9kYXRhU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9kYXRhU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9kYXRhU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgdGhlIGFsbCBkYXRhTm9kZXMgaWYgdGhlcmUgaXMgbm93IG5vIGRhdGEgc291cmNlXG4gICAgaWYgKCFkYXRhU291cmNlKSB7XG4gICAgICB0aGlzLl9ub2RlT3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgICBpZiAodGhpcy5fbm9kZURlZnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvRGF0YUNoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0RXhwYW5zaW9uTW9kZWwoKSB7XG4gICAgaWYgKCF0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLl9leHBhbnNpb25Nb2RlbCA/Pz0gbmV3IFNlbGVjdGlvbk1vZGVsPEs+KHRydWUpO1xuICAgICAgcmV0dXJuIHRoaXMuX2V4cGFuc2lvbk1vZGVsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50cmVlQ29udHJvbC5leHBhbnNpb25Nb2RlbDtcbiAgfVxuXG4gIC8qKiBTZXQgdXAgYSBzdWJzY3JpcHRpb24gZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9EYXRhQ2hhbmdlcygpIHtcbiAgICBpZiAodGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT4gfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuX2RhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5fZGF0YVNvdXJjZS5jb25uZWN0KHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKHRoaXMuX2RhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5fZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSBvYnNlcnZhYmxlT2YodGhpcy5fZGF0YVNvdXJjZSk7XG4gICAgfVxuXG4gICAgaWYgKCFkYXRhU3RyZWFtKSB7XG4gICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICAgIHRocm93IGdldFRyZWVOb1ZhbGlkRGF0YVNvdXJjZUVycm9yKCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IHRoaXMuX2dldFJlbmRlckRhdGEoZGF0YVN0cmVhbSlcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgLnN1YnNjcmliZShyZW5kZXJpbmdEYXRhID0+IHtcbiAgICAgICAgdGhpcy5fcmVuZGVyRGF0YUNoYW5nZXMocmVuZGVyaW5nRGF0YSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKiBHaXZlbiBhbiBPYnNlcnZhYmxlIGNvbnRhaW5pbmcgYSBzdHJlYW0gb2YgdGhlIHJhdyBkYXRhLCByZXR1cm5zIGFuIE9ic2VydmFibGUgY29udGFpbmluZyB0aGUgUmVuZGVyaW5nRGF0YSAqL1xuICBwcml2YXRlIF9nZXRSZW5kZXJEYXRhKGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPik6IE9ic2VydmFibGU8UmVuZGVyaW5nRGF0YTxUPj4ge1xuICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZ2V0RXhwYW5zaW9uTW9kZWwoKTtcbiAgICByZXR1cm4gY29tYmluZUxhdGVzdChbXG4gICAgICBkYXRhU3RyZWFtLFxuICAgICAgdGhpcy5fbm9kZVR5cGUsXG4gICAgICAvLyBXZSBkb24ndCB1c2UgdGhlIGV4cGFuc2lvbiBkYXRhIGRpcmVjdGx5LCBob3dldmVyIHdlIGFkZCBpdCBoZXJlIHRvIGVzc2VudGlhbGx5XG4gICAgICAvLyB0cmlnZ2VyIGRhdGEgcmVuZGVyaW5nIHdoZW4gZXhwYW5zaW9uIGNoYW5nZXMgb2NjdXIuXG4gICAgICBleHBhbnNpb25Nb2RlbC5jaGFuZ2VkLnBpcGUoXG4gICAgICAgIHN0YXJ0V2l0aChudWxsKSxcbiAgICAgICAgdGFwKGV4cGFuc2lvbkNoYW5nZXMgPT4ge1xuICAgICAgICAgIHRoaXMuX2VtaXRFeHBhbnNpb25DaGFuZ2VzKGV4cGFuc2lvbkNoYW5nZXMpO1xuICAgICAgICB9KSxcbiAgICAgICksXG4gICAgXSkucGlwZShcbiAgICAgIHN3aXRjaE1hcCgoW2RhdGEsIG5vZGVUeXBlXSkgPT4ge1xuICAgICAgICBpZiAobm9kZVR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHtyZW5kZXJOb2RlczogZGF0YSwgZmxhdHRlbmVkTm9kZXM6IG51bGwsIG5vZGVUeXBlfSBhcyBjb25zdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSdyZSBoZXJlLCB0aGVuIHdlIGtub3cgd2hhdCBvdXIgbm9kZSB0eXBlIGlzLCBhbmQgdGhlcmVmb3JlIGNhblxuICAgICAgICAvLyBwZXJmb3JtIG91ciB1c3VhbCByZW5kZXJpbmcgcGlwZWxpbmUsIHdoaWNoIG5lY2Vzc2l0YXRlcyBjb252ZXJ0aW5nIHRoZSBkYXRhXG4gICAgICAgIHJldHVybiB0aGlzLl9jb21wdXRlUmVuZGVyaW5nRGF0YShkYXRhLCBub2RlVHlwZSkucGlwZShcbiAgICAgICAgICBtYXAoY29udmVydGVkRGF0YSA9PiAoey4uLmNvbnZlcnRlZERhdGEsIG5vZGVUeXBlfSkgYXMgY29uc3QpLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlbmRlckRhdGFDaGFuZ2VzKGRhdGE6IFJlbmRlcmluZ0RhdGE8VD4pIHtcbiAgICBpZiAoZGF0YS5ub2RlVHlwZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5yZW5kZXJOb2RlQ2hhbmdlcyhkYXRhLnJlbmRlck5vZGVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSdyZSBoZXJlLCB0aGVuIHdlIGtub3cgd2hhdCBvdXIgbm9kZSB0eXBlIGlzLCBhbmQgdGhlcmVmb3JlIGNhblxuICAgIC8vIHBlcmZvcm0gb3VyIHVzdWFsIHJlbmRlcmluZyBwaXBlbGluZS5cbiAgICB0aGlzLl91cGRhdGVDYWNoZWREYXRhKGRhdGEuZmxhdHRlbmVkTm9kZXMpO1xuICAgIHRoaXMucmVuZGVyTm9kZUNoYW5nZXMoZGF0YS5yZW5kZXJOb2Rlcyk7XG4gICAgdGhpcy5fdXBkYXRlS2V5TWFuYWdlckl0ZW1zKGRhdGEuZmxhdHRlbmVkTm9kZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdEV4cGFuc2lvbkNoYW5nZXMoZXhwYW5zaW9uQ2hhbmdlczogU2VsZWN0aW9uQ2hhbmdlPEs+IHwgbnVsbCkge1xuICAgIGlmICghZXhwYW5zaW9uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVzID0gdGhpcy5fbm9kZXMudmFsdWU7XG4gICAgZm9yIChjb25zdCBhZGRlZCBvZiBleHBhbnNpb25DaGFuZ2VzLmFkZGVkKSB7XG4gICAgICBjb25zdCBub2RlID0gbm9kZXMuZ2V0KGFkZGVkKTtcbiAgICAgIG5vZGU/Ll9lbWl0RXhwYW5zaW9uU3RhdGUodHJ1ZSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcmVtb3ZlZCBvZiBleHBhbnNpb25DaGFuZ2VzLnJlbW92ZWQpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5nZXQocmVtb3ZlZCk7XG4gICAgICBub2RlPy5fZW1pdEV4cGFuc2lvblN0YXRlKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9pbml0aWFsaXplS2V5TWFuYWdlcigpIHtcbiAgICBjb25zdCBpdGVtcyA9IGNvbWJpbmVMYXRlc3QoW3RoaXMuX2tleU1hbmFnZXJOb2RlcywgdGhpcy5fbm9kZXNdKS5waXBlKFxuICAgICAgbWFwKChba2V5TWFuYWdlck5vZGVzLCByZW5kZXJOb2Rlc10pID0+XG4gICAgICAgIGtleU1hbmFnZXJOb2Rlcy5yZWR1Y2U8Q2RrVHJlZU5vZGU8VCwgSz5bXT4oKGl0ZW1zLCBkYXRhKSA9PiB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IHJlbmRlck5vZGVzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YSkpO1xuICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBpdGVtcy5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICAgIH0sIFtdKSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIGNvbnN0IGtleU1hbmFnZXJPcHRpb25zOiBUcmVlS2V5TWFuYWdlck9wdGlvbnM8Q2RrVHJlZU5vZGU8VCwgSz4+ID0ge1xuICAgICAgdHJhY2tCeTogbm9kZSA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSxcbiAgICAgIHNraXBQcmVkaWNhdGU6IG5vZGUgPT4gISFub2RlLmlzRGlzYWJsZWQsXG4gICAgICB0eXBlQWhlYWREZWJvdW5jZUludGVydmFsOiB0cnVlLFxuICAgICAgaG9yaXpvbnRhbE9yaWVudGF0aW9uOiB0aGlzLl9kaXIudmFsdWUsXG4gICAgfTtcblxuICAgIHRoaXMuX2tleU1hbmFnZXIgPSB0aGlzLl9rZXlNYW5hZ2VyRmFjdG9yeShpdGVtcywga2V5TWFuYWdlck9wdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZURhdGFEaWZmZXIoKSB7XG4gICAgLy8gUHJvdmlkZSBhIGRlZmF1bHQgdHJhY2tCeSBiYXNlZCBvbiBgX2dldEV4cGFuc2lvbktleWAgaWYgb25lIGlzbid0IHByb3ZpZGVkLlxuICAgIGNvbnN0IHRyYWNrQnkgPSB0aGlzLnRyYWNrQnkgPz8gKChfaW5kZXg6IG51bWJlciwgaXRlbTogVCkgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGl0ZW0pKTtcbiAgICB0aGlzLl9kYXRhRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKFtdKS5jcmVhdGUodHJhY2tCeSk7XG4gIH1cblxuICBwcml2YXRlIF9jaGVja1RyZWVDb250cm9sVXNhZ2UoKSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgVHJlZSBmb2xsb3dzIEFQSSBjb250cmFjdCBvZiB1c2luZyBvbmUgb2YgVHJlZUNvbnRyb2wsIGxldmVsQWNjZXNzb3Igb3JcbiAgICAgIC8vIGNoaWxkcmVuQWNjZXNzb3IuIFRocm93IGFuIGFwcHJvcHJpYXRlIGVycm9yIGlmIGNvbnRyYWN0IGlzIG5vdCBtZXQuXG4gICAgICBsZXQgbnVtVHJlZUNvbnRyb2xzID0gMDtcblxuICAgICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgICAgbnVtVHJlZUNvbnRyb2xzKys7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5sZXZlbEFjY2Vzc29yKSB7XG4gICAgICAgIG51bVRyZWVDb250cm9scysrO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgICBudW1UcmVlQ29udHJvbHMrKztcbiAgICAgIH1cblxuICAgICAgaWYgKCFudW1UcmVlQ29udHJvbHMpIHtcbiAgICAgICAgdGhyb3cgZ2V0VHJlZUNvbnRyb2xNaXNzaW5nRXJyb3IoKTtcbiAgICAgIH0gZWxzZSBpZiAobnVtVHJlZUNvbnRyb2xzID4gMSkge1xuICAgICAgICB0aHJvdyBnZXRNdWx0aXBsZVRyZWVDb250cm9sc0Vycm9yKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIENoZWNrIGZvciBjaGFuZ2VzIG1hZGUgaW4gdGhlIGRhdGEgYW5kIHJlbmRlciBlYWNoIGNoYW5nZSAobm9kZSBhZGRlZC9yZW1vdmVkL21vdmVkKS4gKi9cbiAgcmVuZGVyTm9kZUNoYW5nZXMoXG4gICAgZGF0YTogcmVhZG9ubHkgVFtdLFxuICAgIGRhdGFEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+ID0gdGhpcy5fZGF0YURpZmZlcixcbiAgICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmID0gdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLFxuICAgIHBhcmVudERhdGE/OiBULFxuICApIHtcbiAgICBjb25zdCBjaGFuZ2VzID0gZGF0YURpZmZlci5kaWZmKGRhdGEpO1xuXG4gICAgLy8gU29tZSB0cmVlIGNvbnN1bWVycyBleHBlY3QgY2hhbmdlIGRldGVjdGlvbiB0byBwcm9wYWdhdGUgdG8gbm9kZXNcbiAgICAvLyBldmVuIHdoZW4gdGhlIGFycmF5IGl0c2VsZiBoYXNuJ3QgY2hhbmdlZDsgd2UgZXhwbGljaXRseSBkZXRlY3QgY2hhbmdlc1xuICAgIC8vIGFueXdheXMgaW4gb3JkZXIgZm9yIG5vZGVzIHRvIHVwZGF0ZSB0aGVpciBkYXRhLlxuICAgIC8vXG4gICAgLy8gSG93ZXZlciwgaWYgY2hhbmdlIGRldGVjdGlvbiBpcyBjYWxsZWQgd2hpbGUgdGhlIGNvbXBvbmVudCdzIHZpZXcgaXNcbiAgICAvLyBzdGlsbCBpbml0aW5nLCB0aGVuIHRoZSBvcmRlciBvZiBjaGlsZCB2aWV3cyBpbml0aW5nIHdpbGwgYmUgaW5jb3JyZWN0O1xuICAgIC8vIHRvIHByZXZlbnQgdGhpcywgd2Ugb25seSBleGl0IGVhcmx5IGlmIHRoZSB2aWV3IGhhc24ndCBpbml0aWFsaXplZCB5ZXQuXG4gICAgaWYgKCFjaGFuZ2VzICYmICF0aGlzLl92aWV3SW5pdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNoYW5nZXM/LmZvckVhY2hPcGVyYXRpb24oXG4gICAgICAoXG4gICAgICAgIGl0ZW06IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LFxuICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICkgPT4ge1xuICAgICAgICBpZiAoaXRlbS5wcmV2aW91c0luZGV4ID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmluc2VydE5vZGUoZGF0YVtjdXJyZW50SW5kZXghXSwgY3VycmVudEluZGV4ISwgdmlld0NvbnRhaW5lciwgcGFyZW50RGF0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICB2aWV3Q29udGFpbmVyLnJlbW92ZShhZGp1c3RlZFByZXZpb3VzSW5kZXghKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCB2aWV3ID0gdmlld0NvbnRhaW5lci5nZXQoYWRqdXN0ZWRQcmV2aW91c0luZGV4ISk7XG4gICAgICAgICAgdmlld0NvbnRhaW5lci5tb3ZlKHZpZXchLCBjdXJyZW50SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyBJZiB0aGUgZGF0YSBpdHNlbGYgY2hhbmdlcywgYnV0IGtlZXBzIHRoZSBzYW1lIHRyYWNrQnksIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZXMnXG4gICAgLy8gY29udGV4dCB0byByZWZsZWN0IHRoZSBuZXcgb2JqZWN0LlxuICAgIGNoYW5nZXM/LmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPikgPT4ge1xuICAgICAgY29uc3QgbmV3RGF0YSA9IHJlY29yZC5pdGVtO1xuICAgICAgaWYgKHJlY29yZC5jdXJyZW50SW5kZXggIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB2aWV3Q29udGFpbmVyLmdldChyZWNvcmQuY3VycmVudEluZGV4KTtcbiAgICAgICAgKHZpZXcgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLmNvbnRleHQuJGltcGxpY2l0ID0gbmV3RGF0YTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE5vdGU6IHdlIG9ubHkgYGRldGVjdENoYW5nZXNgIGZyb20gYSB0b3AtbGV2ZWwgY2FsbCwgb3RoZXJ3aXNlIHdlIHJpc2sgb3ZlcmZsb3dpbmdcbiAgICAvLyB0aGUgY2FsbCBzdGFjayBzaW5jZSB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgcmVjdXJzaXZlbHkgKHNlZSAjMjk3MzMuKVxuICAgIC8vIFRPRE86IGNoYW5nZSB0byBgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKClgLFxuICAgIC8vIG9yIGp1c3Qgc3dpdGNoIHRoaXMgY29tcG9uZW50IHRvIHVzZSBzaWduYWxzLlxuICAgIGlmIChwYXJlbnREYXRhKSB7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgbWF0Y2hpbmcgbm9kZSBkZWZpbml0aW9uIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoaXMgbm9kZSBkYXRhLiBJZiB0aGVyZSBpcyBvbmx5XG4gICAqIG9uZSBub2RlIGRlZmluaXRpb24sIGl0IGlzIHJldHVybmVkLiBPdGhlcndpc2UsIGZpbmQgdGhlIG5vZGUgZGVmaW5pdGlvbiB0aGF0IGhhcyBhIHdoZW5cbiAgICogcHJlZGljYXRlIHRoYXQgcmV0dXJucyB0cnVlIHdpdGggdGhlIGRhdGEuIElmIG5vbmUgcmV0dXJuIHRydWUsIHJldHVybiB0aGUgZGVmYXVsdCBub2RlXG4gICAqIGRlZmluaXRpb24uXG4gICAqL1xuICBfZ2V0Tm9kZURlZihkYXRhOiBULCBpOiBudW1iZXIpOiBDZGtUcmVlTm9kZURlZjxUPiB7XG4gICAgaWYgKHRoaXMuX25vZGVEZWZzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuX25vZGVEZWZzLmZpcnN0ITtcbiAgICB9XG5cbiAgICBjb25zdCBub2RlRGVmID1cbiAgICAgIHRoaXMuX25vZGVEZWZzLmZpbmQoZGVmID0+IGRlZi53aGVuICYmIGRlZi53aGVuKGksIGRhdGEpKSB8fCB0aGlzLl9kZWZhdWx0Tm9kZURlZjtcblxuICAgIGlmICghbm9kZURlZiAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcigpO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlRGVmITtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGVtYmVkZGVkIHZpZXcgZm9yIHRoZSBkYXRhIG5vZGUgdGVtcGxhdGUgYW5kIHBsYWNlIGl0IGluIHRoZSBjb3JyZWN0IGluZGV4IGxvY2F0aW9uXG4gICAqIHdpdGhpbiB0aGUgZGF0YSBub2RlIHZpZXcgY29udGFpbmVyLlxuICAgKi9cbiAgaW5zZXJ0Tm9kZShub2RlRGF0YTogVCwgaW5kZXg6IG51bWJlciwgdmlld0NvbnRhaW5lcj86IFZpZXdDb250YWluZXJSZWYsIHBhcmVudERhdGE/OiBUKSB7XG4gICAgY29uc3QgbGV2ZWxBY2Nlc3NvciA9IHRoaXMuX2dldExldmVsQWNjZXNzb3IoKTtcblxuICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9nZXROb2RlRGVmKG5vZGVEYXRhLCBpbmRleCk7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGVEYXRhKTtcblxuICAgIC8vIE5vZGUgY29udGV4dCB0aGF0IHdpbGwgYmUgcHJvdmlkZWQgdG8gY3JlYXRlZCBlbWJlZGRlZCB2aWV3XG4gICAgY29uc3QgY29udGV4dCA9IG5ldyBDZGtUcmVlTm9kZU91dGxldENvbnRleHQ8VD4obm9kZURhdGEpO1xuXG4gICAgcGFyZW50RGF0YSA/Pz0gdGhpcy5fcGFyZW50cy5nZXQoa2V5KSA/PyB1bmRlZmluZWQ7XG4gICAgLy8gSWYgdGhlIHRyZWUgaXMgZmxhdCB0cmVlLCB0aGVuIHVzZSB0aGUgYGdldExldmVsYCBmdW5jdGlvbiBpbiBmbGF0IHRyZWUgY29udHJvbFxuICAgIC8vIE90aGVyd2lzZSwgdXNlIHRoZSBsZXZlbCBvZiBwYXJlbnQgbm9kZS5cbiAgICBpZiAobGV2ZWxBY2Nlc3Nvcikge1xuICAgICAgY29udGV4dC5sZXZlbCA9IGxldmVsQWNjZXNzb3Iobm9kZURhdGEpO1xuICAgIH0gZWxzZSBpZiAocGFyZW50RGF0YSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2xldmVscy5oYXModGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudERhdGEpKSkge1xuICAgICAgY29udGV4dC5sZXZlbCA9IHRoaXMuX2xldmVscy5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudERhdGEpKSEgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmxldmVsID0gMDtcbiAgICB9XG4gICAgdGhpcy5fbGV2ZWxzLnNldChrZXksIGNvbnRleHQubGV2ZWwpO1xuXG4gICAgLy8gVXNlIGRlZmF1bHQgdHJlZSBub2RlT3V0bGV0LCBvciBuZXN0ZWQgbm9kZSdzIG5vZGVPdXRsZXRcbiAgICBjb25zdCBjb250YWluZXIgPSB2aWV3Q29udGFpbmVyID8gdmlld0NvbnRhaW5lciA6IHRoaXMuX25vZGVPdXRsZXQudmlld0NvbnRhaW5lcjtcbiAgICBjb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KG5vZGUudGVtcGxhdGUsIGNvbnRleHQsIGluZGV4KTtcblxuICAgIC8vIFNldCB0aGUgZGF0YSB0byBqdXN0IGNyZWF0ZWQgYENka1RyZWVOb2RlYC5cbiAgICAvLyBUaGUgYENka1RyZWVOb2RlYCBjcmVhdGVkIGZyb20gYGNyZWF0ZUVtYmVkZGVkVmlld2Agd2lsbCBiZSBzYXZlZCBpbiBzdGF0aWMgdmFyaWFibGVcbiAgICAvLyAgICAgYG1vc3RSZWNlbnRUcmVlTm9kZWAuIFdlIGdldCBpdCBmcm9tIHN0YXRpYyB2YXJpYWJsZSBhbmQgcGFzcyB0aGUgbm9kZSBkYXRhIHRvIGl0LlxuICAgIGlmIChDZGtUcmVlTm9kZS5tb3N0UmVjZW50VHJlZU5vZGUpIHtcbiAgICAgIENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZS5kYXRhID0gbm9kZURhdGE7XG4gICAgfVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGRhdGEgbm9kZSBpcyBleHBhbmRlZCBvciBjb2xsYXBzZWQuIFJldHVybnMgdHJ1ZSBpZiBpdCdzIGV4cGFuZGVkLiAqL1xuICBpc0V4cGFuZGVkKGRhdGFOb2RlOiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhKFxuICAgICAgdGhpcy50cmVlQ29udHJvbD8uaXNFeHBhbmRlZChkYXRhTm9kZSkgfHxcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsPy5pc1NlbGVjdGVkKHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBJZiB0aGUgZGF0YSBub2RlIGlzIGN1cnJlbnRseSBleHBhbmRlZCwgY29sbGFwc2UgaXQuIE90aGVyd2lzZSwgZXhwYW5kIGl0LiAqL1xuICB0b2dnbGUoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC50b2dnbGUoZGF0YU5vZGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsLnRvZ2dsZSh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpKTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kIHRoZSBkYXRhIG5vZGUuIElmIGl0IGlzIGFscmVhZHkgZXhwYW5kZWQsIGRvZXMgbm90aGluZy4gKi9cbiAgZXhwYW5kKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuZXhwYW5kKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICB0aGlzLl9leHBhbnNpb25Nb2RlbC5zZWxlY3QodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbGxhcHNlIHRoZSBkYXRhIG5vZGUuIElmIGl0IGlzIGFscmVhZHkgY29sbGFwc2VkLCBkb2VzIG5vdGhpbmcuICovXG4gIGNvbGxhcHNlKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuY29sbGFwc2UoZGF0YU5vZGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgZGF0YSBub2RlIGlzIGN1cnJlbnRseSBleHBhbmRlZCwgY29sbGFwc2UgaXQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuXG4gICAqIE90aGVyd2lzZSwgZXhwYW5kIGl0IGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzLlxuICAgKi9cbiAgdG9nZ2xlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC50b2dnbGVEZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgaWYgKHRoaXMuaXNFeHBhbmRlZChkYXRhTm9kZSkpIHtcbiAgICAgICAgdGhpcy5jb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBhbmQgdGhlIGRhdGEgbm9kZSBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cy4gSWYgdGhleSBhcmUgYWxyZWFkeSBleHBhbmRlZCwgZG9lcyBub3RoaW5nLlxuICAgKi9cbiAgZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5leHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLnNlbGVjdCh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpKTtcbiAgICAgIHRoaXMuX2dldERlc2NlbmRhbnRzKGRhdGFOb2RlKVxuICAgICAgICAucGlwZSh0YWtlKDEpLCB0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgICAgLnN1YnNjcmliZShjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgZXhwYW5zaW9uTW9kZWwuc2VsZWN0KC4uLmNoaWxkcmVuLm1hcChjaGlsZCA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDb2xsYXBzZSB0aGUgZGF0YSBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzLiBJZiBpdCBpcyBhbHJlYWR5IGNvbGxhcHNlZCwgZG9lcyBub3RoaW5nLiAqL1xuICBjb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuY29sbGFwc2VEZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgICAgdGhpcy5fZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpXG4gICAgICAgIC5waXBlKHRha2UoMSksIHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgICAuc3Vic2NyaWJlKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICBleHBhbnNpb25Nb2RlbC5kZXNlbGVjdCguLi5jaGlsZHJlbi5tYXAoY2hpbGQgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kcyBhbGwgZGF0YSBub2RlcyBpbiB0aGUgdHJlZS4gKi9cbiAgZXhwYW5kQWxsKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLmV4cGFuZEFsbCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZXhwYW5zaW9uTW9kZWw7XG4gICAgICBleHBhbnNpb25Nb2RlbC5zZWxlY3QoXG4gICAgICAgIC4uLnRoaXMuX2ZsYXR0ZW5lZE5vZGVzLnZhbHVlLm1hcChjaGlsZCA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbGxhcHNlIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLiAqL1xuICBjb2xsYXBzZUFsbCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5jb2xsYXBzZUFsbCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZXhwYW5zaW9uTW9kZWw7XG4gICAgICBleHBhbnNpb25Nb2RlbC5kZXNlbGVjdChcbiAgICAgICAgLi4udGhpcy5fZmxhdHRlbmVkTm9kZXMudmFsdWUubWFwKGNoaWxkID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKiogTGV2ZWwgYWNjZXNzb3IsIHVzZWQgZm9yIGNvbXBhdGliaWxpdHkgYmV0d2VlbiB0aGUgb2xkIFRyZWUgYW5kIG5ldyBUcmVlICovXG4gIF9nZXRMZXZlbEFjY2Vzc29yKCkge1xuICAgIHJldHVybiB0aGlzLnRyZWVDb250cm9sPy5nZXRMZXZlbD8uYmluZCh0aGlzLnRyZWVDb250cm9sKSA/PyB0aGlzLmxldmVsQWNjZXNzb3I7XG4gIH1cblxuICAvKiogQ2hpbGRyZW4gYWNjZXNzb3IsIHVzZWQgZm9yIGNvbXBhdGliaWxpdHkgYmV0d2VlbiB0aGUgb2xkIFRyZWUgYW5kIG5ldyBUcmVlICovXG4gIF9nZXRDaGlsZHJlbkFjY2Vzc29yKCkge1xuICAgIHJldHVybiB0aGlzLnRyZWVDb250cm9sPy5nZXRDaGlsZHJlbj8uYmluZCh0aGlzLnRyZWVDb250cm9sKSA/PyB0aGlzLmNoaWxkcmVuQWNjZXNzb3I7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGlyZWN0IGNoaWxkcmVuIG9mIGEgbm9kZTsgdXNlZCBmb3IgY29tcGF0aWJpbGl0eSBiZXR3ZWVuIHRoZSBvbGQgdHJlZSBhbmQgdGhlXG4gICAqIG5ldyB0cmVlLlxuICAgKi9cbiAgX2dldERpcmVjdENoaWxkcmVuKGRhdGFOb2RlOiBUKTogT2JzZXJ2YWJsZTxUW10+IHtcbiAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5fZ2V0TGV2ZWxBY2Nlc3NvcigpO1xuICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZXhwYW5zaW9uTW9kZWwgPz8gdGhpcy50cmVlQ29udHJvbD8uZXhwYW5zaW9uTW9kZWw7XG4gICAgaWYgKCFleHBhbnNpb25Nb2RlbCkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbXSk7XG4gICAgfVxuXG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKTtcblxuICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBleHBhbnNpb25Nb2RlbC5jaGFuZ2VkLnBpcGUoXG4gICAgICBzd2l0Y2hNYXAoY2hhbmdlcyA9PiB7XG4gICAgICAgIGlmIChjaGFuZ2VzLmFkZGVkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYW5nZXMucmVtb3ZlZC5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgICAgfSksXG4gICAgICBzdGFydFdpdGgodGhpcy5pc0V4cGFuZGVkKGRhdGFOb2RlKSksXG4gICAgKTtcblxuICAgIGlmIChsZXZlbEFjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gY29tYmluZUxhdGVzdChbaXNFeHBhbmRlZCwgdGhpcy5fZmxhdHRlbmVkTm9kZXNdKS5waXBlKFxuICAgICAgICBtYXAoKFtleHBhbmRlZCwgZmxhdHRlbmVkTm9kZXNdKSA9PiB7XG4gICAgICAgICAgaWYgKCFleHBhbmRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZENoaWxkcmVuQnlMZXZlbChcbiAgICAgICAgICAgIGxldmVsQWNjZXNzb3IsXG4gICAgICAgICAgICBmbGF0dGVuZWROb2RlcyxcblxuICAgICAgICAgICAgZGF0YU5vZGUsXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgY2hpbGRyZW5BY2Nlc3NvciA9IHRoaXMuX2dldENoaWxkcmVuQWNjZXNzb3IoKTtcbiAgICBpZiAoY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuIGNvZXJjZU9ic2VydmFibGUoY2hpbGRyZW5BY2Nlc3NvcihkYXRhTm9kZSkgPz8gW10pO1xuICAgIH1cbiAgICB0aHJvdyBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIHRoZSBsaXN0IG9mIGZsYXR0ZW5lZCBub2RlcywgdGhlIGxldmVsIGFjY2Vzc29yLCBhbmQgdGhlIGxldmVsIHJhbmdlIHdpdGhpblxuICAgKiB3aGljaCB0byBjb25zaWRlciBjaGlsZHJlbiwgZmluZHMgdGhlIGNoaWxkcmVuIGZvciBhIGdpdmVuIG5vZGUuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBmb3IgZGlyZWN0IGNoaWxkcmVuLCBgbGV2ZWxEZWx0YWAgd291bGQgYmUgMS4gRm9yIGFsbCBkZXNjZW5kYW50cyxcbiAgICogYGxldmVsRGVsdGFgIHdvdWxkIGJlIEluZmluaXR5LlxuICAgKi9cbiAgcHJpdmF0ZSBfZmluZENoaWxkcmVuQnlMZXZlbChcbiAgICBsZXZlbEFjY2Vzc29yOiAobm9kZTogVCkgPT4gbnVtYmVyLFxuICAgIGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW10sXG4gICAgZGF0YU5vZGU6IFQsXG4gICAgbGV2ZWxEZWx0YTogbnVtYmVyLFxuICApOiBUW10ge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSk7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IGZsYXR0ZW5lZE5vZGVzLmZpbmRJbmRleChub2RlID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSA9PT0ga2V5KTtcbiAgICBjb25zdCBkYXRhTm9kZUxldmVsID0gbGV2ZWxBY2Nlc3NvcihkYXRhTm9kZSk7XG4gICAgY29uc3QgZXhwZWN0ZWRMZXZlbCA9IGRhdGFOb2RlTGV2ZWwgKyBsZXZlbERlbHRhO1xuICAgIGNvbnN0IHJlc3VsdHM6IFRbXSA9IFtdO1xuXG4gICAgLy8gR29lcyB0aHJvdWdoIGZsYXR0ZW5lZCB0cmVlIG5vZGVzIGluIHRoZSBgZmxhdHRlbmVkTm9kZXNgIGFycmF5LCBhbmQgZ2V0IGFsbFxuICAgIC8vIGRlc2NlbmRhbnRzIHdpdGhpbiBhIGNlcnRhaW4gbGV2ZWwgcmFuZ2UuXG4gICAgLy9cbiAgICAvLyBJZiB3ZSByZWFjaCBhIG5vZGUgd2hvc2UgbGV2ZWwgaXMgZXF1YWwgdG8gb3IgbGVzcyB0aGFuIHRoZSBsZXZlbCBvZiB0aGUgdHJlZSBub2RlLFxuICAgIC8vIHdlIGhpdCBhIHNpYmxpbmcgb3IgcGFyZW50J3Mgc2libGluZywgYW5kIHNob3VsZCBzdG9wLlxuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4ICsgMTsgaSA8IGZsYXR0ZW5lZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50TGV2ZWwgPSBsZXZlbEFjY2Vzc29yKGZsYXR0ZW5lZE5vZGVzW2ldKTtcbiAgICAgIGlmIChjdXJyZW50TGV2ZWwgPD0gZGF0YU5vZGVMZXZlbCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChjdXJyZW50TGV2ZWwgPD0gZXhwZWN0ZWRMZXZlbCkge1xuICAgICAgICByZXN1bHRzLnB1c2goZmxhdHRlbmVkTm9kZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBzcGVjaWZpZWQgbm9kZSBjb21wb25lbnQgdG8gdGhlIHRyZWUncyBpbnRlcm5hbCByZWdpc3RyeS5cbiAgICpcbiAgICogVGhpcyBwcmltYXJpbHkgZmFjaWxpdGF0ZXMga2V5Ym9hcmQgbmF2aWdhdGlvbi5cbiAgICovXG4gIF9yZWdpc3Rlck5vZGUobm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHtcbiAgICB0aGlzLl9ub2Rlcy52YWx1ZS5zZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUuZGF0YSksIG5vZGUpO1xuICAgIHRoaXMuX25vZGVzLm5leHQodGhpcy5fbm9kZXMudmFsdWUpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIHNwZWNpZmllZCBub2RlIGNvbXBvbmVudCBmcm9tIHRoZSB0cmVlJ3MgaW50ZXJuYWwgcmVnaXN0cnkuICovXG4gIF91bnJlZ2lzdGVyTm9kZShub2RlOiBDZGtUcmVlTm9kZTxULCBLPikge1xuICAgIHRoaXMuX25vZGVzLnZhbHVlLmRlbGV0ZSh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSk7XG4gICAgdGhpcy5fbm9kZXMubmV4dCh0aGlzLl9ub2Rlcy52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBub2RlLCBkZXRlcm1pbmUgdGhlIGxldmVsIHdoZXJlIHRoaXMgbm9kZSBhcHBlYXJzIGluIHRoZSB0cmVlLlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLWxldmVsYCBidXQgaXMgMC1pbmRleGVkLlxuICAgKi9cbiAgX2dldExldmVsKG5vZGU6IFQpIHtcbiAgICByZXR1cm4gdGhpcy5fbGV2ZWxzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvciB0aGUgZ2l2ZW4gbm9kZSwgZGV0ZXJtaW5lIHRoZSBzaXplIG9mIHRoZSBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtc2V0c2l6ZWAuXG4gICAqL1xuICBfZ2V0U2V0U2l6ZShkYXRhTm9kZTogVCkge1xuICAgIGNvbnN0IHNldCA9IHRoaXMuX2dldEFyaWFTZXQoZGF0YU5vZGUpO1xuICAgIHJldHVybiBzZXQubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvciB0aGUgZ2l2ZW4gbm9kZSwgZGV0ZXJtaW5lIHRoZSBpbmRleCAoc3RhcnRpbmcgZnJvbSAxKSBvZiB0aGUgbm9kZSBpbiBpdHMgcGFyZW50J3MgY2hpbGQgc2V0LlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLXBvc2luc2V0YC5cbiAgICovXG4gIF9nZXRQb3NpdGlvbkluU2V0KGRhdGFOb2RlOiBUKSB7XG4gICAgY29uc3Qgc2V0ID0gdGhpcy5fZ2V0QXJpYVNldChkYXRhTm9kZSk7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKTtcbiAgICByZXR1cm4gc2V0LmZpbmRJbmRleChub2RlID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSA9PT0ga2V5KSArIDE7XG4gIH1cblxuICAvKiogR2l2ZW4gYSBDZGtUcmVlTm9kZSwgZ2V0cyB0aGUgbm9kZSB0aGF0IHJlbmRlcnMgdGhhdCBub2RlJ3MgcGFyZW50J3MgZGF0YS4gKi9cbiAgX2dldE5vZGVQYXJlbnQobm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9wYXJlbnRzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSk7XG4gICAgcmV0dXJuIHBhcmVudCAmJiB0aGlzLl9ub2Rlcy52YWx1ZS5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudCkpO1xuICB9XG5cbiAgLyoqIEdpdmVuIGEgQ2RrVHJlZU5vZGUsIGdldHMgdGhlIG5vZGVzIHRoYXQgcmVuZGVycyB0aGF0IG5vZGUncyBjaGlsZCBkYXRhLiAqL1xuICBfZ2V0Tm9kZUNoaWxkcmVuKG5vZGU6IENka1RyZWVOb2RlPFQsIEs+KSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldERpcmVjdENoaWxkcmVuKG5vZGUuZGF0YSkucGlwZShcbiAgICAgIG1hcChjaGlsZHJlbiA9PlxuICAgICAgICBjaGlsZHJlbi5yZWR1Y2U8Q2RrVHJlZU5vZGU8VCwgSz5bXT4oKG5vZGVzLCBjaGlsZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5fbm9kZXMudmFsdWUuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpO1xuICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgbm9kZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgICAgICB9LCBbXSksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICAvKiogYGtleWRvd25gIGV2ZW50IGhhbmRsZXI7IHRoaXMganVzdCBwYXNzZXMgdGhlIGV2ZW50IHRvIHRoZSBgVHJlZUtleU1hbmFnZXJgLiAqL1xuICBfc2VuZEtleWRvd25Ub0tleU1hbmFnZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICB0aGlzLl9rZXlNYW5hZ2VyLm9uS2V5ZG93bihldmVudCk7XG4gIH1cblxuICAvKiogR2V0cyBhbGwgbmVzdGVkIGRlc2NlbmRhbnRzIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiBPYnNlcnZhYmxlPFRbXT4ge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHRoaXMudHJlZUNvbnRyb2wuZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMubGV2ZWxBY2Nlc3Nvcikge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuX2ZpbmRDaGlsZHJlbkJ5TGV2ZWwoXG4gICAgICAgIHRoaXMubGV2ZWxBY2Nlc3NvcixcbiAgICAgICAgdGhpcy5fZmxhdHRlbmVkTm9kZXMudmFsdWUsXG4gICAgICAgIGRhdGFOb2RlLFxuICAgICAgICBJbmZpbml0eSxcbiAgICAgICk7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHJlc3VsdHMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGlsZHJlbkFjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QWxsQ2hpbGRyZW5SZWN1cnNpdmVseShkYXRhTm9kZSkucGlwZShcbiAgICAgICAgcmVkdWNlKChhbGxDaGlsZHJlbjogVFtdLCBuZXh0Q2hpbGRyZW4pID0+IHtcbiAgICAgICAgICBhbGxDaGlsZHJlbi5wdXNoKC4uLm5leHRDaGlsZHJlbik7XG4gICAgICAgICAgcmV0dXJuIGFsbENoaWxkcmVuO1xuICAgICAgICB9LCBbXSksXG4gICAgICApO1xuICAgIH1cbiAgICB0aHJvdyBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIGNoaWxkcmVuIGFuZCBzdWItY2hpbGRyZW4gb2YgdGhlIHByb3ZpZGVkIG5vZGUuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBlbWl0IG11bHRpcGxlIHRpbWVzLCBpbiB0aGUgb3JkZXIgdGhhdCB0aGUgY2hpbGRyZW4gd2lsbCBhcHBlYXJcbiAgICogaW4gdGhlIHRyZWUsIGFuZCBjYW4gYmUgY29tYmluZWQgd2l0aCBhIGByZWR1Y2VgIG9wZXJhdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0QWxsQ2hpbGRyZW5SZWN1cnNpdmVseShkYXRhTm9kZTogVCk6IE9ic2VydmFibGU8VFtdPiB7XG4gICAgaWYgKCF0aGlzLmNoaWxkcmVuQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoW10pO1xuICAgIH1cblxuICAgIHJldHVybiBjb2VyY2VPYnNlcnZhYmxlKHRoaXMuY2hpbGRyZW5BY2Nlc3NvcihkYXRhTm9kZSkpLnBpcGUoXG4gICAgICB0YWtlKDEpLFxuICAgICAgc3dpdGNoTWFwKGNoaWxkcmVuID0+IHtcbiAgICAgICAgLy8gSGVyZSwgd2UgY2FjaGUgdGhlIHBhcmVudHMgb2YgYSBwYXJ0aWN1bGFyIGNoaWxkIHNvIHRoYXQgd2UgY2FuIGNvbXB1dGUgdGhlIGxldmVscy5cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgIHRoaXMuX3BhcmVudHMuc2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCksIGRhdGFOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKC4uLmNoaWxkcmVuKS5waXBlKFxuICAgICAgICAgIGNvbmNhdE1hcChjaGlsZCA9PiBjb25jYXQob2JzZXJ2YWJsZU9mKFtjaGlsZF0pLCB0aGlzLl9nZXRBbGxDaGlsZHJlblJlY3Vyc2l2ZWx5KGNoaWxkKSkpLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEV4cGFuc2lvbktleShkYXRhTm9kZTogVCk6IEsge1xuICAgIC8vIEluIHRoZSBjYXNlIHRoYXQgYSBrZXkgYWNjZXNzb3IgZnVuY3Rpb24gd2FzIG5vdCBwcm92aWRlZCBieSB0aGVcbiAgICAvLyB0cmVlIHVzZXIsIHdlJ2xsIGRlZmF1bHQgdG8gdXNpbmcgdGhlIG5vZGUgb2JqZWN0IGl0c2VsZiBhcyB0aGUga2V5LlxuICAgIC8vXG4gICAgLy8gVGhpcyBjYXN0IGlzIHNhZmUgc2luY2U6XG4gICAgLy8gLSBpZiBhbiBleHBhbnNpb25LZXkgaXMgcHJvdmlkZWQsIFRTIHdpbGwgaW5mZXIgdGhlIHR5cGUgb2YgSyB0byBiZVxuICAgIC8vICAgdGhlIHJldHVybiB0eXBlLlxuICAgIC8vIC0gaWYgaXQncyBub3QsIHRoZW4gSyB3aWxsIGJlIGRlZmF1bHRlZCB0byBULlxuICAgIHJldHVybiB0aGlzLmV4cGFuc2lvbktleT8uKGRhdGFOb2RlKSA/PyAoZGF0YU5vZGUgYXMgdW5rbm93biBhcyBLKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEFyaWFTZXQobm9kZTogVCkge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKTtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9wYXJlbnRzLmdldChrZXkpO1xuICAgIGNvbnN0IHBhcmVudEtleSA9IHBhcmVudCA/IHRoaXMuX2dldEV4cGFuc2lvbktleShwYXJlbnQpIDogbnVsbDtcbiAgICBjb25zdCBzZXQgPSB0aGlzLl9hcmlhU2V0cy5nZXQocGFyZW50S2V5KTtcbiAgICByZXR1cm4gc2V0ID8/IFtub2RlXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgcGFyZW50IGZvciB0aGUgZ2l2ZW4gbm9kZS4gSWYgdGhpcyBpcyBhIHJvb3Qgbm9kZSwgdGhpc1xuICAgKiByZXR1cm5zIG51bGwuIElmIHdlJ3JlIHVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHBhcmVudCwgZm9yIGV4YW1wbGUsXG4gICAqIGlmIHdlIGRvbid0IGhhdmUgY2FjaGVkIG5vZGUgZGF0YSwgdGhpcyByZXR1cm5zIHVuZGVmaW5lZC5cbiAgICovXG4gIHByaXZhdGUgX2ZpbmRQYXJlbnRGb3JOb2RlKG5vZGU6IFQsIGluZGV4OiBudW1iZXIsIGNhY2hlZE5vZGVzOiByZWFkb25seSBUW10pOiBUIHwgbnVsbCB7XG4gICAgLy8gSW4gYWxsIGNhc2VzLCB3ZSBoYXZlIGEgbWFwcGluZyBmcm9tIG5vZGUgdG8gbGV2ZWw7IGFsbCB3ZSBuZWVkIHRvIGRvIGhlcmUgaXMgYmFja3RyYWNrIGluXG4gICAgLy8gb3VyIGZsYXR0ZW5lZCBsaXN0IG9mIG5vZGVzIHRvIGRldGVybWluZSB0aGUgZmlyc3Qgbm9kZSB0aGF0J3Mgb2YgYSBsZXZlbCBsb3dlciB0aGFuIHRoZVxuICAgIC8vIHByb3ZpZGVkIG5vZGUuXG4gICAgaWYgKCFjYWNoZWROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50TGV2ZWwgPSB0aGlzLl9sZXZlbHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSkgPz8gMDtcbiAgICBmb3IgKGxldCBwYXJlbnRJbmRleCA9IGluZGV4IC0gMTsgcGFyZW50SW5kZXggPj0gMDsgcGFyZW50SW5kZXgtLSkge1xuICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGNhY2hlZE5vZGVzW3BhcmVudEluZGV4XTtcbiAgICAgIGNvbnN0IHBhcmVudExldmVsID0gdGhpcy5fbGV2ZWxzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50Tm9kZSkpID8/IDA7XG5cbiAgICAgIGlmIChwYXJlbnRMZXZlbCA8IGN1cnJlbnRMZXZlbCkge1xuICAgICAgICByZXR1cm4gcGFyZW50Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBzZXQgb2Ygcm9vdCBub2RlcyBhbmQgdGhlIGN1cnJlbnQgbm9kZSBsZXZlbCwgZmxhdHRlbnMgYW55IG5lc3RlZFxuICAgKiBub2RlcyBpbnRvIGEgc2luZ2xlIGFycmF5LlxuICAgKlxuICAgKiBJZiBhbnkgbm9kZXMgYXJlIG5vdCBleHBhbmRlZCwgdGhlbiB0aGVpciBjaGlsZHJlbiB3aWxsIG5vdCBiZSBhZGRlZCBpbnRvIHRoZSBhcnJheS5cbiAgICogVGhpcyB3aWxsIHN0aWxsIHRyYXZlcnNlIGFsbCBuZXN0ZWQgY2hpbGRyZW4gaW4gb3JkZXIgdG8gYnVpbGQgdXAgb3VyIGludGVybmFsIGRhdGFcbiAgICogbW9kZWxzLCBidXQgd2lsbCBub3QgaW5jbHVkZSB0aGVtIGluIHRoZSByZXR1cm5lZCBhcnJheS5cbiAgICovXG4gIHByaXZhdGUgX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24obm9kZXM6IHJlYWRvbmx5IFRbXSwgbGV2ZWwgPSAwKTogT2JzZXJ2YWJsZTxUW10+IHtcbiAgICBjb25zdCBjaGlsZHJlbkFjY2Vzc29yID0gdGhpcy5fZ2V0Q2hpbGRyZW5BY2Nlc3NvcigpO1xuICAgIC8vIElmIHdlJ3JlIHVzaW5nIGEgbGV2ZWwgYWNjZXNzb3IsIHdlIGRvbid0IG5lZWQgdG8gZmxhdHRlbiBhbnl0aGluZy5cbiAgICBpZiAoIWNoaWxkcmVuQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoWy4uLm5vZGVzXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9ic2VydmFibGVPZiguLi5ub2RlcykucGlwZShcbiAgICAgIGNvbmNhdE1hcChub2RlID0+IHtcbiAgICAgICAgY29uc3QgcGFyZW50S2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpO1xuICAgICAgICBpZiAoIXRoaXMuX3BhcmVudHMuaGFzKHBhcmVudEtleSkpIHtcbiAgICAgICAgICB0aGlzLl9wYXJlbnRzLnNldChwYXJlbnRLZXksIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xldmVscy5zZXQocGFyZW50S2V5LCBsZXZlbCk7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBjb2VyY2VPYnNlcnZhYmxlKGNoaWxkcmVuQWNjZXNzb3Iobm9kZSkpO1xuICAgICAgICByZXR1cm4gY29uY2F0KFxuICAgICAgICAgIG9ic2VydmFibGVPZihbbm9kZV0pLFxuICAgICAgICAgIGNoaWxkcmVuLnBpcGUoXG4gICAgICAgICAgICB0YWtlKDEpLFxuICAgICAgICAgICAgdGFwKGNoaWxkTm9kZXMgPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9hcmlhU2V0cy5zZXQocGFyZW50S2V5LCBbLi4uKGNoaWxkTm9kZXMgPz8gW10pXSk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGROb2RlcyA/PyBbXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkS2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnRzLnNldChjaGlsZEtleSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGV2ZWxzLnNldChjaGlsZEtleSwgbGV2ZWwgKyAxKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzd2l0Y2hNYXAoY2hpbGROb2RlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICghY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLl9mbGF0dGVuTmVzdGVkTm9kZXNXaXRoRXhwYW5zaW9uKGNoaWxkTm9kZXMsIGxldmVsICsgMSkucGlwZShcbiAgICAgICAgICAgICAgICBtYXAobmVzdGVkTm9kZXMgPT4gKHRoaXMuaXNFeHBhbmRlZChub2RlKSA/IG5lc3RlZE5vZGVzIDogW10pKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIHJlZHVjZSgocmVzdWx0cywgY2hpbGRyZW4pID0+IHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLmNoaWxkcmVuKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9LCBbXSBhcyBUW10pLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgY2hpbGRyZW4gZm9yIGNlcnRhaW4gdHJlZSBjb25maWd1cmF0aW9ucy5cbiAgICpcbiAgICogVGhpcyBhbHNvIGNvbXB1dGVzIHBhcmVudCwgbGV2ZWwsIGFuZCBncm91cCBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29tcHV0ZVJlbmRlcmluZ0RhdGEoXG4gICAgbm9kZXM6IHJlYWRvbmx5IFRbXSxcbiAgICBub2RlVHlwZTogJ2ZsYXQnIHwgJ25lc3RlZCcsXG4gICk6IE9ic2VydmFibGU8e1xuICAgIHJlbmRlck5vZGVzOiByZWFkb25seSBUW107XG4gICAgZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgfT4ge1xuICAgIC8vIFRoZSBvbmx5IHNpdHVhdGlvbnMgd2hlcmUgd2UgaGF2ZSB0byBjb252ZXJ0IGNoaWxkcmVuIHR5cGVzIGlzIHdoZW5cbiAgICAvLyB0aGV5J3JlIG1pc21hdGNoZWQ7IGkuZS4gaWYgdGhlIHRyZWUgaXMgdXNpbmcgYSBjaGlsZHJlbkFjY2Vzc29yIGFuZCB0aGVcbiAgICAvLyBub2RlcyBhcmUgZmxhdCwgb3IgaWYgdGhlIHRyZWUgaXMgdXNpbmcgYSBsZXZlbEFjY2Vzc29yIGFuZCB0aGUgbm9kZXMgYXJlXG4gICAgLy8gbmVzdGVkLlxuICAgIGlmICh0aGlzLmNoaWxkcmVuQWNjZXNzb3IgJiYgbm9kZVR5cGUgPT09ICdmbGF0Jykge1xuICAgICAgLy8gVGhpcyBmbGF0dGVucyBjaGlsZHJlbiBpbnRvIGEgc2luZ2xlIGFycmF5LlxuICAgICAgdGhpcy5fYXJpYVNldHMuc2V0KG51bGwsIFsuLi5ub2Rlc10pO1xuICAgICAgcmV0dXJuIHRoaXMuX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24obm9kZXMpLnBpcGUoXG4gICAgICAgIG1hcChmbGF0dGVuZWROb2RlcyA9PiAoe1xuICAgICAgICAgIHJlbmRlck5vZGVzOiBmbGF0dGVuZWROb2RlcyxcbiAgICAgICAgICBmbGF0dGVuZWROb2RlcyxcbiAgICAgICAgfSkpLFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubGV2ZWxBY2Nlc3NvciAmJiBub2RlVHlwZSA9PT0gJ25lc3RlZCcpIHtcbiAgICAgIC8vIEluIHRoZSBuZXN0ZWQgY2FzZSwgd2Ugb25seSBsb29rIGZvciByb290IG5vZGVzLiBUaGUgQ2RrTmVzdGVkTm9kZVxuICAgICAgLy8gaXRzZWxmIHdpbGwgaGFuZGxlIHJlbmRlcmluZyBlYWNoIGluZGl2aWR1YWwgbm9kZSdzIGNoaWxkcmVuLlxuICAgICAgY29uc3QgbGV2ZWxBY2Nlc3NvciA9IHRoaXMubGV2ZWxBY2Nlc3NvcjtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Yobm9kZXMuZmlsdGVyKG5vZGUgPT4gbGV2ZWxBY2Nlc3Nvcihub2RlKSA9PT0gMCkpLnBpcGUoXG4gICAgICAgIG1hcChyb290Tm9kZXMgPT4gKHtcbiAgICAgICAgICByZW5kZXJOb2Rlczogcm9vdE5vZGVzLFxuICAgICAgICAgIGZsYXR0ZW5lZE5vZGVzOiBub2RlcyxcbiAgICAgICAgfSkpLFxuICAgICAgICB0YXAoKHtmbGF0dGVuZWROb2Rlc30pID0+IHtcbiAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVQYXJlbnRzKGZsYXR0ZW5lZE5vZGVzKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdmbGF0Jykge1xuICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYSBUcmVlQ29udHJvbCwgd2Uga25vdyB0aGF0IHRoZSBub2RlIHR5cGUgbWF0Y2hlcyB1cFxuICAgICAgLy8gd2l0aCB0aGUgVHJlZUNvbnRyb2wsIGFuZCBzbyBubyBjb252ZXJzaW9ucyBhcmUgbmVjZXNzYXJ5LiBPdGhlcndpc2UsXG4gICAgICAvLyB3ZSd2ZSBhbHJlYWR5IGNvbmZpcm1lZCB0aGF0IHRoZSBkYXRhIG1vZGVsIG1hdGNoZXMgdXAgd2l0aCB0aGVcbiAgICAgIC8vIGRlc2lyZWQgbm9kZSB0eXBlIGhlcmUuXG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHtyZW5kZXJOb2Rlczogbm9kZXMsIGZsYXR0ZW5lZE5vZGVzOiBub2Rlc30pLnBpcGUoXG4gICAgICAgIHRhcCgoe2ZsYXR0ZW5lZE5vZGVzfSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZVBhcmVudHMoZmxhdHRlbmVkTm9kZXMpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBuZXN0ZWQgbm9kZXMsIHdlIHN0aWxsIG5lZWQgdG8gcGVyZm9ybSB0aGUgbm9kZSBmbGF0dGVuaW5nIGluIG9yZGVyXG4gICAgICAvLyB0byBtYWludGFpbiBvdXIgY2FjaGVzIGZvciB2YXJpb3VzIHRyZWUgb3BlcmF0aW9ucy5cbiAgICAgIHRoaXMuX2FyaWFTZXRzLnNldChudWxsLCBbLi4ubm9kZXNdKTtcbiAgICAgIHJldHVybiB0aGlzLl9mbGF0dGVuTmVzdGVkTm9kZXNXaXRoRXhwYW5zaW9uKG5vZGVzKS5waXBlKFxuICAgICAgICBtYXAoZmxhdHRlbmVkTm9kZXMgPT4gKHtcbiAgICAgICAgICByZW5kZXJOb2Rlczogbm9kZXMsXG4gICAgICAgICAgZmxhdHRlbmVkTm9kZXMsXG4gICAgICAgIH0pKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlQ2FjaGVkRGF0YShmbGF0dGVuZWROb2RlczogcmVhZG9ubHkgVFtdKSB7XG4gICAgdGhpcy5fZmxhdHRlbmVkTm9kZXMubmV4dChmbGF0dGVuZWROb2Rlcyk7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVLZXlNYW5hZ2VySXRlbXMoZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXSkge1xuICAgIHRoaXMuX2tleU1hbmFnZXJOb2Rlcy5uZXh0KGZsYXR0ZW5lZE5vZGVzKTtcbiAgfVxuXG4gIC8qKiBUcmF2ZXJzZSB0aGUgZmxhdHRlbmVkIG5vZGUgZGF0YSBhbmQgY29tcHV0ZSBwYXJlbnRzLCBsZXZlbHMsIGFuZCBncm91cCBkYXRhLiAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVQYXJlbnRzKGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW10pOiB2b2lkIHtcbiAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5fZ2V0TGV2ZWxBY2Nlc3NvcigpO1xuICAgIGlmICghbGV2ZWxBY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3BhcmVudHMuY2xlYXIoKTtcbiAgICB0aGlzLl9hcmlhU2V0cy5jbGVhcigpO1xuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZsYXR0ZW5lZE5vZGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgZGF0YU5vZGUgPSBmbGF0dGVuZWROb2Rlc1tpbmRleF07XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpO1xuICAgICAgdGhpcy5fbGV2ZWxzLnNldChrZXksIGxldmVsQWNjZXNzb3IoZGF0YU5vZGUpKTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX2ZpbmRQYXJlbnRGb3JOb2RlKGRhdGFOb2RlLCBpbmRleCwgZmxhdHRlbmVkTm9kZXMpO1xuICAgICAgdGhpcy5fcGFyZW50cy5zZXQoa2V5LCBwYXJlbnQpO1xuICAgICAgY29uc3QgcGFyZW50S2V5ID0gcGFyZW50ID8gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudCkgOiBudWxsO1xuXG4gICAgICBjb25zdCBncm91cCA9IHRoaXMuX2FyaWFTZXRzLmdldChwYXJlbnRLZXkpID8/IFtdO1xuICAgICAgZ3JvdXAuc3BsaWNlKGluZGV4LCAwLCBkYXRhTm9kZSk7XG4gICAgICB0aGlzLl9hcmlhU2V0cy5zZXQocGFyZW50S2V5LCBncm91cCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVHJlZSBub2RlIGZvciBDZGtUcmVlLiBJdCBjb250YWlucyB0aGUgZGF0YSBpbiB0aGUgdHJlZSBub2RlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstdHJlZS1ub2RlJyxcbiAgZXhwb3J0QXM6ICdjZGtUcmVlTm9kZScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUtbm9kZScsXG4gICAgJ1thdHRyLmFyaWEtZXhwYW5kZWRdJzogJ19nZXRBcmlhRXhwYW5kZWQoKScsXG4gICAgJ1thdHRyLmFyaWEtbGV2ZWxdJzogJ2xldmVsICsgMScsXG4gICAgJ1thdHRyLmFyaWEtcG9zaW5zZXRdJzogJ19nZXRQb3NpdGlvbkluU2V0KCknLFxuICAgICdbYXR0ci5hcmlhLXNldHNpemVdJzogJ19nZXRTZXRTaXplKCknLFxuICAgICdbdGFiaW5kZXhdJzogJ190YWJpbmRleCcsXG4gICAgJ3JvbGUnOiAndHJlZWl0ZW0nLFxuICAgICcoY2xpY2spJzogJ19zZXRBY3RpdmVJdGVtKCknLFxuICAgICcoZm9jdXMpJzogJ19mb2N1c0l0ZW0oKScsXG4gIH0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlPFQsIEsgPSBUPiBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25Jbml0LCBUcmVlS2V5TWFuYWdlckl0ZW0ge1xuICBwcm90ZWN0ZWQgX3RhYmluZGV4OiBudW1iZXIgfCBudWxsID0gLTE7XG5cbiAgLyoqXG4gICAqIFRoZSByb2xlIG9mIHRoZSB0cmVlIG5vZGUuXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSBpZ25vcmVkOyB0aGUgdHJlZSB3aWxsIGF1dG9tYXRpY2FsbHkgZGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSByb2xlXG4gICAqIGZvciB0cmVlIG5vZGUuIFRoaXMgaW5wdXQgd2lsbCBiZSByZW1vdmVkIGluIGEgZnV0dXJlIHZlcnNpb24uXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMjEuMC4wXG4gICAqL1xuICBASW5wdXQoKSBnZXQgcm9sZSgpOiAndHJlZWl0ZW0nIHwgJ2dyb3VwJyB7XG4gICAgcmV0dXJuICd0cmVlaXRlbSc7XG4gIH1cblxuICBzZXQgcm9sZShfcm9sZTogJ3RyZWVpdGVtJyB8ICdncm91cCcpIHtcbiAgICAvLyBpZ25vcmUgYW55IHJvbGUgc2V0dGluZywgd2UgaGFuZGxlIHRoaXMgaW50ZXJuYWxseS5cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgZXhwYW5kYWJsZS5cbiAgICpcbiAgICogSWYgbm90IHVzaW5nIGBGbGF0VHJlZUNvbnRyb2xgLCBvciBpZiBgaXNFeHBhbmRhYmxlYCBpcyBub3QgcHJvdmlkZWQgdG9cbiAgICogYE5lc3RlZFRyZWVDb250cm9sYCwgdGhpcyBzaG91bGQgYmUgcHJvdmlkZWQgZm9yIGNvcnJlY3Qgbm9kZSBhMTF5LlxuICAgKi9cbiAgQElucHV0KHt0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgaXNFeHBhbmRhYmxlKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0V4cGFuZGFibGUoKTtcbiAgfVxuICBzZXQgaXNFeHBhbmRhYmxlKGlzRXhwYW5kYWJsZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2lucHV0SXNFeHBhbmRhYmxlID0gaXNFeHBhbmRhYmxlO1xuICAgIGlmICgodGhpcy5kYXRhICYmICF0aGlzLl9pc0V4cGFuZGFibGUpIHx8ICF0aGlzLl9pbnB1dElzRXhwYW5kYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBiZWluZyBzZXQgdG8gZXhwYW5kYWJsZSwgZW5zdXJlIHRoYXQgdGhlIHN0YXR1cyBvZiB0aGVcbiAgICAvLyBub2RlIGlzIHByb3BhZ2F0ZWRcbiAgICBpZiAodGhpcy5faW5wdXRJc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmV4cGFuZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faW5wdXRJc0V4cGFuZGVkID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5jb2xsYXBzZSgpO1xuICAgIH1cbiAgfVxuXG4gIEBJbnB1dCgpXG4gIGdldCBpc0V4cGFuZGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmlzRXhwYW5kZWQodGhpcy5fZGF0YSk7XG4gIH1cbiAgc2V0IGlzRXhwYW5kZWQoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIHRoaXMuX2lucHV0SXNFeHBhbmRlZCA9IGlzRXhwYW5kZWQ7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2UoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhpcyBub2RlIGlzIGRpc2FibGVkLiBJZiBpdCdzIGRpc2FibGVkLCB0aGVuIHRoZSB1c2VyIHdvbid0IGJlIGFibGUgdG8gZm9jdXNcbiAgICogb3IgYWN0aXZhdGUgdGhpcyBub2RlLlxuICAgKi9cbiAgQElucHV0KHt0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KSBpc0Rpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgdGV4dCB1c2VkIHRvIGxvY2F0ZSB0aGlzIGl0ZW0gZHVyaW5nIHR5cGVhaGVhZC4gSWYgbm90IHNwZWNpZmllZCwgdGhlIGB0ZXh0Q29udGVudGAgd2lsbFxuICAgKiB3aWxsIGJlIHVzZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlVHlwZWFoZWFkTGFiZWwnKSB0eXBlYWhlYWRMYWJlbDogc3RyaW5nIHwgbnVsbDtcblxuICBnZXRMYWJlbCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnR5cGVhaGVhZExhYmVsIHx8IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuICB9XG5cbiAgLyoqIFRoaXMgZW1pdHMgd2hlbiB0aGUgbm9kZSBoYXMgYmVlbiBwcm9ncmFtYXRpY2FsbHkgYWN0aXZhdGVkIG9yIGFjdGl2YXRlZCBieSBrZXlib2FyZC4gKi9cbiAgQE91dHB1dCgpXG4gIHJlYWRvbmx5IGFjdGl2YXRpb246IEV2ZW50RW1pdHRlcjxUPiA9IG5ldyBFdmVudEVtaXR0ZXI8VD4oKTtcblxuICAvKiogVGhpcyBlbWl0cyB3aGVuIHRoZSBub2RlJ3MgZXhwYW5zaW9uIHN0YXR1cyBoYXMgYmVlbiBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgZXhwYW5kZWRDaGFuZ2U6IEV2ZW50RW1pdHRlcjxib29sZWFuPiA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICAvKipcbiAgICogVGhlIG1vc3QgcmVjZW50bHkgY3JlYXRlZCBgQ2RrVHJlZU5vZGVgLiBXZSBzYXZlIGl0IGluIHN0YXRpYyB2YXJpYWJsZSBzbyB3ZSBjYW4gcmV0cmlldmUgaXRcbiAgICogaW4gYENka1RyZWVgIGFuZCBzZXQgdGhlIGRhdGEgdG8gaXQuXG4gICAqL1xuICBzdGF0aWMgbW9zdFJlY2VudFRyZWVOb2RlOiBDZGtUcmVlTm9kZTxhbnk+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG5vZGUncyBkYXRhIGhhcyBjaGFuZ2VkLiAqL1xuICByZWFkb25seSBfZGF0YUNoYW5nZXMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX2lucHV0SXNFeHBhbmRhYmxlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2lucHV0SXNFeHBhbmRlZDogYm9vbGVhbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIEZsYWcgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIGJlIGZvY3VzaW5nIHRoZSBhY3R1YWwgZWxlbWVudCBiYXNlZCBvblxuICAgKiBzb21lIHVzZXIgaW50ZXJhY3Rpb24gKGNsaWNrIG9yIGZvY3VzKS4gT24gY2xpY2ssIHdlIGRvbid0IGZvcmNpYmx5IGZvY3VzIHRoZSBlbGVtZW50XG4gICAqIHNpbmNlIHRoZSBjbGljayBjb3VsZCB0cmlnZ2VyIHNvbWUgb3RoZXIgY29tcG9uZW50IHRoYXQgd2FudHMgdG8gZ3JhYiBpdHMgb3duIGZvY3VzXG4gICAqIChlLmcuIG1lbnUsIGRpYWxvZykuXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRGb2N1cyA9IHRydWU7XG4gIHByaXZhdGUgX3BhcmVudE5vZGVBcmlhTGV2ZWw6IG51bWJlcjtcblxuICAvKiogVGhlIHRyZWUgbm9kZSdzIGRhdGEuICovXG4gIGdldCBkYXRhKCk6IFQge1xuICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICB9XG4gIHNldCBkYXRhKHZhbHVlOiBUKSB7XG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLl9kYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdmFsdWU7XG4gICAgICB0aGlzLl9kYXRhQ2hhbmdlcy5uZXh0KCk7XG4gICAgfVxuICB9XG4gIHByb3RlY3RlZCBfZGF0YTogVDtcblxuICAvKiBJZiBsZWFmIG5vZGUsIHJldHVybiB0cnVlIHRvIG5vdCBhc3NpZ24gYXJpYS1leHBhbmRlZCBhdHRyaWJ1dGUgKi9cbiAgZ2V0IGlzTGVhZk5vZGUoKTogYm9vbGVhbiB7XG4gICAgLy8gSWYgZmxhdCB0cmVlIG5vZGUgZGF0YSByZXR1cm5zIGZhbHNlIGZvciBleHBhbmRhYmxlIHByb3BlcnR5LCBpdCdzIGEgbGVhZiBub2RlXG4gICAgaWYgKFxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uaXNFeHBhbmRhYmxlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICF0aGlzLl90cmVlLnRyZWVDb250cm9sLmlzRXhwYW5kYWJsZSh0aGlzLl9kYXRhKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIElmIG5lc3RlZCB0cmVlIG5vZGUgZGF0YSByZXR1cm5zIDAgZGVzY2VuZGFudHMsIGl0J3MgYSBsZWFmIG5vZGVcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uaXNFeHBhbmRhYmxlID09PSB1bmRlZmluZWQgJiZcbiAgICAgIHRoaXMuX3RyZWUudHJlZUNvbnRyb2w/LmdldERlc2NlbmRhbnRzKHRoaXMuX2RhdGEpLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0IGxldmVsKCk6IG51bWJlciB7XG4gICAgLy8gSWYgdGhlIHRyZWUgaGFzIGEgbGV2ZWxBY2Nlc3NvciwgdXNlIGl0IHRvIGdldCB0aGUgbGV2ZWwuIE90aGVyd2lzZSByZWFkIHRoZVxuICAgIC8vIGFyaWEtbGV2ZWwgb2ZmIHRoZSBwYXJlbnQgbm9kZSBhbmQgdXNlIGl0IGFzIHRoZSBsZXZlbCBmb3IgdGhpcyBub2RlIChub3RlIGFyaWEtbGV2ZWwgaXNcbiAgICAvLyAxLWluZGV4ZWQsIHdoaWxlIHRoaXMgcHJvcGVydHkgaXMgMC1pbmRleGVkLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGluY3JlbWVudCkuXG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldExldmVsKHRoaXMuX2RhdGEpID8/IHRoaXMuX3BhcmVudE5vZGVBcmlhTGV2ZWw7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyBpZiB0aGUgdHJlZSBub2RlIGlzIGV4cGFuZGFibGUuICovXG4gIF9pc0V4cGFuZGFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3RyZWUudHJlZUNvbnRyb2wpIHtcbiAgICAgIGlmICh0aGlzLmlzTGVhZk5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgY29tcGF0aWJpbGl0eSB3aXRoIHRyZWVzIGNyZWF0ZWQgdXNpbmcgVHJlZUNvbnRyb2wgYmVmb3JlIHdlIGFkZGVkXG4gICAgICAvLyBDZGtUcmVlTm9kZSNpc0V4cGFuZGFibGUuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lucHV0SXNFeHBhbmRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIHZhbHVlIGZvciBgYXJpYS1leHBhbmRlZGAuXG4gICAqXG4gICAqIEZvciBub24tZXhwYW5kYWJsZSBub2RlcywgdGhpcyBpcyBgbnVsbGAuXG4gICAqL1xuICBfZ2V0QXJpYUV4cGFuZGVkKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICghdGhpcy5faXNFeHBhbmRhYmxlKCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgc2l6ZSBvZiB0aGlzIG5vZGUncyBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtc2V0c2l6ZWAuXG4gICAqL1xuICBfZ2V0U2V0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXRTZXRTaXplKHRoaXMuX2RhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGluZGV4IChzdGFydGluZyBmcm9tIDEpIG9mIHRoaXMgbm9kZSBpbiBpdHMgcGFyZW50J3MgY2hpbGQgc2V0LlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLXBvc2luc2V0YC5cbiAgICovXG4gIF9nZXRQb3NpdGlvbkluU2V0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldFBvc2l0aW9uSW5TZXQodGhpcy5fZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZiA9IGluamVjdChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcm90ZWN0ZWQgX3RyZWU6IENka1RyZWU8VCwgSz4sXG4gICkge1xuICAgIENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSA9IHRoaXMgYXMgQ2RrVHJlZU5vZGU8VCwgSz47XG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXJlbnROb2RlQXJpYUxldmVsID0gZ2V0UGFyZW50Tm9kZUFyaWFMZXZlbCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX3RyZWVcbiAgICAgIC5fZ2V0RXhwYW5zaW9uTW9kZWwoKVxuICAgICAgLmNoYW5nZWQucGlwZShcbiAgICAgICAgbWFwKCgpID0+IHRoaXMuaXNFeHBhbmRlZCksXG4gICAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgICB9KTtcbiAgICB0aGlzLl90cmVlLl9zZXROb2RlVHlwZUlmVW5zZXQoJ2ZsYXQnKTtcbiAgICB0aGlzLl90cmVlLl9yZWdpc3Rlck5vZGUodGhpcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRyZWUgbm9kZSBiZWluZyBkZXN0cm95ZWQsXG4gICAgLy8gY2xlYXIgb3V0IHRoZSByZWZlcmVuY2UgdG8gYXZvaWQgbGVha2luZyBtZW1vcnkuXG4gICAgaWYgKENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSA9PT0gdGhpcykge1xuICAgICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICBnZXRQYXJlbnQoKTogQ2RrVHJlZU5vZGU8VCwgSz4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5fZ2V0Tm9kZVBhcmVudCh0aGlzKSA/PyBudWxsO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKTogQ2RrVHJlZU5vZGU8VCwgSz5bXSB8IE9ic2VydmFibGU8Q2RrVHJlZU5vZGU8VCwgSz5bXT4ge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXROb2RlQ2hpbGRyZW4odGhpcyk7XG4gIH1cblxuICAvKiogRm9jdXNlcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgZm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuICAgIGlmICh0aGlzLl9zaG91bGRGb2N1cykge1xuICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRGVmb2N1cyB0aGlzIGRhdGEgbm9kZS4gKi9cbiAgdW5mb2N1cygpOiB2b2lkIHtcbiAgICB0aGlzLl90YWJpbmRleCA9IC0xO1xuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRW1pdHMgYW4gYWN0aXZhdGlvbiBldmVudC4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2YXRpb24ubmV4dCh0aGlzLl9kYXRhKTtcbiAgfVxuXG4gIC8qKiBDb2xsYXBzZXMgdGhpcyBkYXRhIG5vZGUuIEltcGxlbWVudGVkIGZvciBUcmVlS2V5TWFuYWdlckl0ZW0uICovXG4gIGNvbGxhcHNlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzRXhwYW5kYWJsZSkge1xuICAgICAgdGhpcy5fdHJlZS5jb2xsYXBzZSh0aGlzLl9kYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgZXhwYW5kKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzRXhwYW5kYWJsZSkge1xuICAgICAgdGhpcy5fdHJlZS5leHBhbmQodGhpcy5fZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIE1ha2VzIHRoZSBub2RlIGZvY3VzYWJsZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgbWFrZUZvY3VzYWJsZSgpOiB2b2lkIHtcbiAgICB0aGlzLl90YWJpbmRleCA9IDA7XG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICBfZm9jdXNJdGVtKCkge1xuICAgIGlmICh0aGlzLmlzRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fdHJlZS5fa2V5TWFuYWdlci5mb2N1c0l0ZW0odGhpcyk7XG4gIH1cblxuICBfc2V0QWN0aXZlSXRlbSgpIHtcbiAgICBpZiAodGhpcy5pc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3Nob3VsZEZvY3VzID0gZmFsc2U7XG4gICAgdGhpcy5fdHJlZS5fa2V5TWFuYWdlci5mb2N1c0l0ZW0odGhpcyk7XG4gICAgdGhpcy5fc2hvdWxkRm9jdXMgPSB0cnVlO1xuICB9XG5cbiAgX2VtaXRFeHBhbnNpb25TdGF0ZShleHBhbmRlZDogYm9vbGVhbikge1xuICAgIHRoaXMuZXhwYW5kZWRDaGFuZ2UuZW1pdChleHBhbmRlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50Tm9kZUFyaWFMZXZlbChub2RlRWxlbWVudDogSFRNTEVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgcGFyZW50ID0gbm9kZUVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgd2hpbGUgKHBhcmVudCAmJiAhaXNOb2RlRWxlbWVudChwYXJlbnQpKSB7XG4gICAgcGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG4gIH1cbiAgaWYgKCFwYXJlbnQpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICB0aHJvdyBFcnJvcignSW5jb3JyZWN0IHRyZWUgc3RydWN0dXJlIGNvbnRhaW5pbmcgZGV0YWNoZWQgbm9kZS4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwYXJlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdjZGstbmVzdGVkLXRyZWUtbm9kZScpKSB7XG4gICAgcmV0dXJuIG51bWJlckF0dHJpYnV0ZShwYXJlbnQuZ2V0QXR0cmlidXRlKCdhcmlhLWxldmVsJykhKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgYW5jZXN0b3IgZWxlbWVudCBpcyB0aGUgY2RrLXRyZWUgaXRzZWxmXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNOb2RlRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICBjb25zdCBjbGFzc0xpc3QgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgcmV0dXJuICEhKGNsYXNzTGlzdD8uY29udGFpbnMoJ2Nkay1uZXN0ZWQtdHJlZS1ub2RlJykgfHwgY2xhc3NMaXN0Py5jb250YWlucygnY2RrLXRyZWUnKSk7XG59XG4iXX0=