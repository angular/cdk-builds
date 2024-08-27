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
        // TODO: change to `this._changeDetectorRef.markForCheck()`, or just switch this component to
        // use signals.
        this._changeDetectorRef.detectChanges();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS90cmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFDTCxnQkFBZ0IsR0FLakIsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUdMLFlBQVksRUFFWixjQUFjLEdBQ2YsTUFBTSwwQkFBMEIsQ0FBQztBQUNsQyxPQUFPLEVBSUwsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUVaLEtBQUssRUFHTCxlQUFlLEVBR2YsTUFBTSxFQUNOLFNBQVMsRUFFVCxTQUFTLEVBRVQsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixNQUFNLEVBQ04sZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQy9ELE9BQU8sRUFDTCxlQUFlLEVBQ2YsYUFBYSxFQUNiLE1BQU0sRUFDTixLQUFLLEVBRUwsT0FBTyxFQUVQLFlBQVksRUFDWixFQUFFLElBQUksWUFBWSxHQUNuQixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsU0FBUyxFQUNULEdBQUcsRUFDSCxNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxJQUFJLEVBQ0osU0FBUyxFQUNULEdBQUcsR0FDSixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBQyxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFDTCw0QkFBNEIsRUFDNUIsMEJBQTBCLEVBQzFC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RCxDQUFDO1NBQU0sQ0FBQztRQUNOLDhDQUE4QztRQUM5QyxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBb0I7SUFDekMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztJQUNwQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsc0JBQXNCLENBQUMsSUFBSSxTQUFTLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgVFJFRV9LRVlfTUFOQUdFUixcbiAgVHJlZUtleU1hbmFnZXJGYWN0b3J5LFxuICBUcmVlS2V5TWFuYWdlckl0ZW0sXG4gIFRyZWVLZXlNYW5hZ2VyT3B0aW9ucyxcbiAgVHJlZUtleU1hbmFnZXJTdHJhdGVneSxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgaXNEYXRhU291cmNlLFxuICBTZWxlY3Rpb25DaGFuZ2UsXG4gIFNlbGVjdGlvbk1vZGVsLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50Q2hlY2tlZCxcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgbnVtYmVyQXR0cmlidXRlLFxuICBpbmplY3QsXG4gIGJvb2xlYW5BdHRyaWJ1dGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtjb2VyY2VPYnNlcnZhYmxlfSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24vcHJpdmF0ZSc7XG5pbXBvcnQge1xuICBCZWhhdmlvclN1YmplY3QsXG4gIGNvbWJpbmVMYXRlc3QsXG4gIGNvbmNhdCxcbiAgRU1QVFksXG4gIE9ic2VydmFibGUsXG4gIFN1YmplY3QsXG4gIFN1YnNjcmlwdGlvbixcbiAgaXNPYnNlcnZhYmxlLFxuICBvZiBhcyBvYnNlcnZhYmxlT2YsXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgZGlzdGluY3RVbnRpbENoYW5nZWQsXG4gIGNvbmNhdE1hcCxcbiAgbWFwLFxuICByZWR1Y2UsXG4gIHN0YXJ0V2l0aCxcbiAgc3dpdGNoTWFwLFxuICB0YWtlLFxuICB0YWtlVW50aWwsXG4gIHRhcCxcbn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtUcmVlQ29udHJvbH0gZnJvbSAnLi9jb250cm9sL3RyZWUtY29udHJvbCc7XG5pbXBvcnQge0Nka1RyZWVOb2RlRGVmLCBDZGtUcmVlTm9kZU91dGxldENvbnRleHR9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge0Nka1RyZWVOb2RlT3V0bGV0fSBmcm9tICcuL291dGxldCc7XG5pbXBvcnQge1xuICBnZXRNdWx0aXBsZVRyZWVDb250cm9sc0Vycm9yLFxuICBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcixcbiAgZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcixcbiAgZ2V0VHJlZU11bHRpcGxlRGVmYXVsdE5vZGVEZWZzRXJyb3IsXG4gIGdldFRyZWVOb1ZhbGlkRGF0YVNvdXJjZUVycm9yLFxufSBmcm9tICcuL3RyZWUtZXJyb3JzJztcblxudHlwZSBSZW5kZXJpbmdEYXRhPFQ+ID1cbiAgfCB7XG4gICAgICBmbGF0dGVuZWROb2RlczogbnVsbDtcbiAgICAgIG5vZGVUeXBlOiBudWxsO1xuICAgICAgcmVuZGVyTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgICB9XG4gIHwge1xuICAgICAgZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgICAgIG5vZGVUeXBlOiAnbmVzdGVkJyB8ICdmbGF0JztcbiAgICAgIHJlbmRlck5vZGVzOiByZWFkb25seSBUW107XG4gICAgfTtcblxuLyoqXG4gKiBDREsgdHJlZSBjb21wb25lbnQgdGhhdCBjb25uZWN0cyB3aXRoIGEgZGF0YSBzb3VyY2UgdG8gcmV0cmlldmUgZGF0YSBvZiB0eXBlIGBUYCBhbmQgcmVuZGVyc1xuICogZGF0YU5vZGVzIHdpdGggaGllcmFyY2h5LiBVcGRhdGVzIHRoZSBkYXRhTm9kZXMgd2hlbiBuZXcgZGF0YSBpcyBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay10cmVlJyxcbiAgZXhwb3J0QXM6ICdjZGtUcmVlJyxcbiAgdGVtcGxhdGU6IGA8bmctY29udGFpbmVyIGNka1RyZWVOb2RlT3V0bGV0PjwvbmctY29udGFpbmVyPmAsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUnLFxuICAgICdyb2xlJzogJ3RyZWUnLFxuICAgICcoa2V5ZG93biknOiAnX3NlbmRLZXlkb3duVG9LZXlNYW5hZ2VyKCRldmVudCknLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAvLyBUaGUgXCJPblB1c2hcIiBzdGF0dXMgZm9yIHRoZSBgQ2RrVHJlZWAgY29tcG9uZW50IGlzIGVmZmVjdGl2ZWx5IGEgbm9vcCwgc28gd2UgYXJlIHJlbW92aW5nIGl0LlxuICAvLyBUaGUgdmlldyBmb3IgYENka1RyZWVgIGNvbnNpc3RzIGVudGlyZWx5IG9mIHRlbXBsYXRlcyBkZWNsYXJlZCBpbiBvdGhlciB2aWV3cy4gQXMgdGhleSBhcmVcbiAgLy8gZGVjbGFyZWQgZWxzZXdoZXJlLCB0aGV5IGFyZSBjaGVja2VkIHdoZW4gdGhlaXIgZGVjbGFyYXRpb24gcG9pbnRzIGFyZSBjaGVja2VkLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtDZGtUcmVlTm9kZU91dGxldF0sXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWU8VCwgSyA9IFQ+XG4gIGltcGxlbWVudHNcbiAgICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICAgIEFmdGVyQ29udGVudEluaXQsXG4gICAgQWZ0ZXJWaWV3SW5pdCxcbiAgICBDb2xsZWN0aW9uVmlld2VyLFxuICAgIE9uRGVzdHJveSxcbiAgICBPbkluaXRcbntcbiAgcHJpdmF0ZSBfZGlyID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5KTtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX29uRGVzdHJveSA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIERpZmZlciB1c2VkIHRvIGZpbmQgdGhlIGNoYW5nZXMgaW4gdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9kYXRhRGlmZmVyOiBJdGVyYWJsZURpZmZlcjxUPjtcblxuICAvKiogU3RvcmVzIHRoZSBub2RlIGRlZmluaXRpb24gdGhhdCBkb2VzIG5vdCBoYXZlIGEgd2hlbiBwcmVkaWNhdGUuICovXG4gIHByaXZhdGUgX2RlZmF1bHROb2RlRGVmOiBDZGtUcmVlTm9kZURlZjxUPiB8IG51bGw7XG5cbiAgLyoqIERhdGEgc3Vic2NyaXB0aW9uICovXG4gIHByaXZhdGUgX2RhdGFTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGw7XG5cbiAgLyoqIExldmVsIG9mIG5vZGVzICovXG4gIHByaXZhdGUgX2xldmVsczogTWFwPEssIG51bWJlcj4gPSBuZXcgTWFwPEssIG51bWJlcj4oKTtcblxuICAvKiogVGhlIGltbWVkaWF0ZSBwYXJlbnRzIGZvciBhIG5vZGUuIFRoaXMgaXMgYG51bGxgIGlmIHRoZXJlIGlzIG5vIHBhcmVudC4gKi9cbiAgcHJpdmF0ZSBfcGFyZW50czogTWFwPEssIFQgfCBudWxsPiA9IG5ldyBNYXA8SywgVCB8IG51bGw+KCk7XG5cbiAgLyoqXG4gICAqIE5vZGVzIGdyb3VwZWQgaW50byBlYWNoIHNldCwgd2hpY2ggaXMgYSBsaXN0IG9mIG5vZGVzIGRpc3BsYXllZCB0b2dldGhlciBpbiB0aGUgRE9NLlxuICAgKlxuICAgKiBMb29rdXAga2V5IGlzIHRoZSBwYXJlbnQgb2YgYSBzZXQuIFJvb3Qgbm9kZXMgaGF2ZSBrZXkgb2YgbnVsbC5cbiAgICpcbiAgICogVmFsdWVzIGlzIGEgJ3NldCcgb2YgdHJlZSBub2Rlcy4gRWFjaCB0cmVlIG5vZGUgbWFwcyB0byBhIHRyZWVpdGVtIGVsZW1lbnQuIFNldHMgYXJlIGluIHRoZVxuICAgKiBvcmRlciB0aGF0IGl0IGlzIHJlbmRlcmVkLiBFYWNoIHNldCBtYXBzIGRpcmVjdGx5IHRvIGFyaWEtcG9zaW5zZXQgYW5kIGFyaWEtc2V0c2l6ZSBhdHRyaWJ1dGVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXJpYVNldHM6IE1hcDxLIHwgbnVsbCwgVFtdPiA9IG5ldyBNYXA8SyB8IG51bGwsIFRbXT4oKTtcblxuICAvKipcbiAgICogUHJvdmlkZXMgYSBzdHJlYW0gY29udGFpbmluZyB0aGUgbGF0ZXN0IGRhdGEgYXJyYXkgdG8gcmVuZGVyLiBJbmZsdWVuY2VkIGJ5IHRoZSB0cmVlJ3NcbiAgICogc3RyZWFtIG9mIHZpZXcgd2luZG93ICh3aGF0IGRhdGFOb2RlcyBhcmUgY3VycmVudGx5IG9uIHNjcmVlbikuXG4gICAqIERhdGEgc291cmNlIGNhbiBiZSBhbiBvYnNlcnZhYmxlIG9mIGRhdGEgYXJyYXksIG9yIGEgZGF0YSBhcnJheSB0byByZW5kZXIuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgZGF0YVNvdXJjZSgpOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgVFtdIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YVNvdXJjZTtcbiAgfVxuICBzZXQgZGF0YVNvdXJjZShkYXRhU291cmNlOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgVFtdKSB7XG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgIT09IGRhdGFTb3VyY2UpIHtcbiAgICAgIHRoaXMuX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2RhdGFTb3VyY2U6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBUW107XG5cbiAgLyoqXG4gICAqIFRoZSB0cmVlIGNvbnRyb2xsZXJcbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVXNlIG9uZSBvZiBgbGV2ZWxBY2Nlc3NvcmAgb3IgYGNoaWxkcmVuQWNjZXNzb3JgIGluc3RlYWQuIFRvIGJlIHJlbW92ZWQgaW4gYVxuICAgKiBmdXR1cmUgdmVyc2lvbi5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAyMS4wLjBcbiAgICovXG4gIEBJbnB1dCgpIHRyZWVDb250cm9sPzogVHJlZUNvbnRyb2w8VCwgSz47XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgZGF0YSBub2RlLCBkZXRlcm1pbmVzIHdoYXQgdHJlZSBsZXZlbCB0aGUgbm9kZSBpcyBhdC5cbiAgICpcbiAgICogT25lIG9mIGxldmVsQWNjZXNzb3Igb3IgY2hpbGRyZW5BY2Nlc3NvciBtdXN0IGJlIHNwZWNpZmllZCwgbm90IGJvdGguXG4gICAqIFRoaXMgaXMgZW5mb3JjZWQgYXQgcnVuLXRpbWUuXG4gICAqL1xuICBASW5wdXQoKSBsZXZlbEFjY2Vzc29yPzogKGRhdGFOb2RlOiBUKSA9PiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgZGF0YSBub2RlLCBkZXRlcm1pbmVzIHdoYXQgdGhlIGNoaWxkcmVuIG9mIHRoYXQgbm9kZSBhcmUuXG4gICAqXG4gICAqIE9uZSBvZiBsZXZlbEFjY2Vzc29yIG9yIGNoaWxkcmVuQWNjZXNzb3IgbXVzdCBiZSBzcGVjaWZpZWQsIG5vdCBib3RoLlxuICAgKiBUaGlzIGlzIGVuZm9yY2VkIGF0IHJ1bi10aW1lLlxuICAgKi9cbiAgQElucHV0KCkgY2hpbGRyZW5BY2Nlc3Nvcj86IChkYXRhTm9kZTogVCkgPT4gVFtdIHwgT2JzZXJ2YWJsZTxUW10+O1xuXG4gIC8qKlxuICAgKiBUcmFja2luZyBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBjaGVjayB0aGUgZGlmZmVyZW5jZXMgaW4gZGF0YSBjaGFuZ2VzLiBVc2VkIHNpbWlsYXJseVxuICAgKiB0byBgbmdGb3JgIGB0cmFja0J5YCBmdW5jdGlvbi4gT3B0aW1pemUgbm9kZSBvcGVyYXRpb25zIGJ5IGlkZW50aWZ5aW5nIGEgbm9kZSBiYXNlZCBvbiBpdHMgZGF0YVxuICAgKiByZWxhdGl2ZSB0byB0aGUgZnVuY3Rpb24gdG8ga25vdyBpZiBhIG5vZGUgc2hvdWxkIGJlIGFkZGVkL3JlbW92ZWQvbW92ZWQuXG4gICAqIEFjY2VwdHMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIHR3byBwYXJhbWV0ZXJzLCBgaW5kZXhgIGFuZCBgaXRlbWAuXG4gICAqL1xuICBASW5wdXQoKSB0cmFja0J5OiBUcmFja0J5RnVuY3Rpb248VD47XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgZGF0YSBub2RlLCBkZXRlcm1pbmVzIHRoZSBrZXkgYnkgd2hpY2ggd2UgZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRoaXMgbm9kZSBpcyBleHBhbmRlZC5cbiAgICovXG4gIEBJbnB1dCgpIGV4cGFuc2lvbktleT86IChkYXRhTm9kZTogVCkgPT4gSztcblxuICAvLyBPdXRsZXRzIHdpdGhpbiB0aGUgdHJlZSdzIHRlbXBsYXRlIHdoZXJlIHRoZSBkYXRhTm9kZXMgd2lsbCBiZSBpbnNlcnRlZC5cbiAgQFZpZXdDaGlsZChDZGtUcmVlTm9kZU91dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9ub2RlT3V0bGV0OiBDZGtUcmVlTm9kZU91dGxldDtcblxuICAvKiogVGhlIHRyZWUgbm9kZSB0ZW1wbGF0ZSBmb3IgdGhlIHRyZWUgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtUcmVlTm9kZURlZiwge1xuICAgIC8vIFdlIG5lZWQgdG8gdXNlIGBkZXNjZW5kYW50czogdHJ1ZWAsIGJlY2F1c2UgSXZ5IHdpbGwgbm8gbG9uZ2VyIG1hdGNoXG4gICAgLy8gaW5kaXJlY3QgZGVzY2VuZGFudHMgaWYgaXQncyBsZWZ0IGFzIGZhbHNlLlxuICAgIGRlc2NlbmRhbnRzOiB0cnVlLFxuICB9KVxuICBfbm9kZURlZnM6IFF1ZXJ5TGlzdDxDZGtUcmVlTm9kZURlZjxUPj47XG5cbiAgLy8gVE9ETyh0aW5heXVhbmdhbyk6IFNldHVwIGEgbGlzdGVuZXIgZm9yIHNjcm9sbGluZywgZW1pdCB0aGUgY2FsY3VsYXRlZCB2aWV3IHRvIHZpZXdDaGFuZ2UuXG4gIC8vICAgICBSZW1vdmUgdGhlIE1BWF9WQUxVRSBpbiB2aWV3Q2hhbmdlXG4gIC8qKlxuICAgKiBTdHJlYW0gY29udGFpbmluZyB0aGUgbGF0ZXN0IGluZm9ybWF0aW9uIG9uIHdoYXQgcm93cyBhcmUgYmVpbmcgZGlzcGxheWVkIG9uIHNjcmVlbi5cbiAgICogQ2FuIGJlIHVzZWQgYnkgdGhlIGRhdGEgc291cmNlIHRvIGFzIGEgaGV1cmlzdGljIG9mIHdoYXQgZGF0YSBzaG91bGQgYmUgcHJvdmlkZWQuXG4gICAqL1xuICByZWFkb25seSB2aWV3Q2hhbmdlID0gbmV3IEJlaGF2aW9yU3ViamVjdDx7c3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXJ9Pih7XG4gICAgc3RhcnQ6IDAsXG4gICAgZW5kOiBOdW1iZXIuTUFYX1ZBTFVFLFxuICB9KTtcblxuICAvKiogS2VlcCB0cmFjayBvZiB3aGljaCBub2RlcyBhcmUgZXhwYW5kZWQuICovXG4gIHByaXZhdGUgX2V4cGFuc2lvbk1vZGVsPzogU2VsZWN0aW9uTW9kZWw8Sz47XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgc3luY2hyb25vdXMgY2FjaGUgb2YgZmxhdHRlbmVkIGRhdGEgbm9kZXMuIFRoaXMgd2lsbCBvbmx5IGJlXG4gICAqIHBvcHVsYXRlZCBhZnRlciBpbml0aWFsIHJlbmRlciwgYW5kIGluIGNlcnRhaW4gY2FzZXMsIHdpbGwgYmUgZGVsYXllZCBkdWUgdG9cbiAgICogcmVseWluZyBvbiBPYnNlcnZhYmxlIGBnZXRDaGlsZHJlbmAgY2FsbHMuXG4gICAqL1xuICBwcml2YXRlIF9mbGF0dGVuZWROb2RlczogQmVoYXZpb3JTdWJqZWN0PHJlYWRvbmx5IFRbXT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PHJlYWRvbmx5IFRbXT4oW10pO1xuXG4gIC8qKiBUaGUgYXV0b21hdGljYWxseSBkZXRlcm1pbmVkIG5vZGUgdHlwZSBmb3IgdGhlIHRyZWUuICovXG4gIHByaXZhdGUgX25vZGVUeXBlOiBCZWhhdmlvclN1YmplY3Q8J2ZsYXQnIHwgJ25lc3RlZCcgfCBudWxsPiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8XG4gICAgJ2ZsYXQnIHwgJ25lc3RlZCcgfCBudWxsXG4gID4obnVsbCk7XG5cbiAgLyoqIFRoZSBtYXBwaW5nIGJldHdlZW4gZGF0YSBhbmQgdGhlIG5vZGUgdGhhdCBpcyByZW5kZXJlZC4gKi9cbiAgcHJpdmF0ZSBfbm9kZXM6IEJlaGF2aW9yU3ViamVjdDxNYXA8SywgQ2RrVHJlZU5vZGU8VCwgSz4+PiA9IG5ldyBCZWhhdmlvclN1YmplY3QoXG4gICAgbmV3IE1hcDxLLCBDZGtUcmVlTm9kZTxULCBLPj4oKSxcbiAgKTtcblxuICAvKipcbiAgICogU3luY2hyb25vdXMgY2FjaGUgb2Ygbm9kZXMgZm9yIHRoZSBgVHJlZUtleU1hbmFnZXJgLiBUaGlzIGlzIHNlcGFyYXRlXG4gICAqIGZyb20gYF9mbGF0dGVuZWROb2Rlc2Agc28gdGhleSBjYW4gYmUgaW5kZXBlbmRlbnRseSB1cGRhdGVkIGF0IGRpZmZlcmVudFxuICAgKiB0aW1lcy5cbiAgICovXG4gIHByaXZhdGUgX2tleU1hbmFnZXJOb2RlczogQmVoYXZpb3JTdWJqZWN0PHJlYWRvbmx5IFRbXT4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PHJlYWRvbmx5IFRbXT4oW10pO1xuXG4gIHByaXZhdGUgX2tleU1hbmFnZXJGYWN0b3J5ID0gaW5qZWN0KFRSRUVfS0VZX01BTkFHRVIpIGFzIFRyZWVLZXlNYW5hZ2VyRmFjdG9yeTxDZGtUcmVlTm9kZTxULCBLPj47XG5cbiAgLyoqIFRoZSBrZXkgbWFuYWdlciBmb3IgdGhpcyB0cmVlLiBIYW5kbGVzIGZvY3VzIGFuZCBhY3RpdmF0aW9uIGJhc2VkIG9uIHVzZXIga2V5Ym9hcmQgaW5wdXQuICovXG4gIF9rZXlNYW5hZ2VyOiBUcmVlS2V5TWFuYWdlclN0cmF0ZWd5PENka1RyZWVOb2RlPFQsIEs+PjtcbiAgcHJpdmF0ZSBfdmlld0luaXQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICApIHt9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHRoaXMuX2luaXRpYWxpemVLZXlNYW5hZ2VyKCk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKSB7XG4gICAgdGhpcy5fdXBkYXRlRGVmYXVsdE5vZGVEZWZpbml0aW9uKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9EYXRhQ2hhbmdlcygpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG5cbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kubmV4dCgpO1xuICAgIHRoaXMuX29uRGVzdHJveS5jb21wbGV0ZSgpO1xuXG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgJiYgdHlwZW9mICh0aGlzLl9kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICh0aGlzLmRhdGFTb3VyY2UgYXMgRGF0YVNvdXJjZTxUPikuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gSW4gY2VydGFpbiB0ZXN0cywgdGhlIHRyZWUgbWlnaHQgYmUgZGVzdHJveWVkIGJlZm9yZSB0aGlzIGlzIGluaXRpYWxpemVkXG4gICAgLy8gaW4gYG5nQWZ0ZXJDb250ZW50SW5pdGAuXG4gICAgdGhpcy5fa2V5TWFuYWdlcj8uZGVzdHJveSgpO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fY2hlY2tUcmVlQ29udHJvbFVzYWdlKCk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZURhdGFEaWZmZXIoKTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICB0aGlzLl92aWV3SW5pdCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVEZWZhdWx0Tm9kZURlZmluaXRpb24oKSB7XG4gICAgY29uc3QgZGVmYXVsdE5vZGVEZWZzID0gdGhpcy5fbm9kZURlZnMuZmlsdGVyKGRlZiA9PiAhZGVmLndoZW4pO1xuICAgIGlmIChkZWZhdWx0Tm9kZURlZnMubGVuZ3RoID4gMSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VHJlZU11bHRpcGxlRGVmYXVsdE5vZGVEZWZzRXJyb3IoKTtcbiAgICB9XG4gICAgdGhpcy5fZGVmYXVsdE5vZGVEZWYgPSBkZWZhdWx0Tm9kZURlZnNbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbm9kZSB0eXBlIGZvciB0aGUgdHJlZSwgaWYgaXQgaGFzbid0IGJlZW4gc2V0IHlldC5cbiAgICpcbiAgICogVGhpcyB3aWxsIGJlIGNhbGxlZCBieSB0aGUgZmlyc3Qgbm9kZSB0aGF0J3MgcmVuZGVyZWQgaW4gb3JkZXIgZm9yIHRoZSB0cmVlXG4gICAqIHRvIGRldGVybWluZSB3aGF0IGRhdGEgdHJhbnNmb3JtYXRpb25zIGFyZSByZXF1aXJlZC5cbiAgICovXG4gIF9zZXROb2RlVHlwZUlmVW5zZXQobm9kZVR5cGU6ICdmbGF0JyB8ICduZXN0ZWQnKSB7XG4gICAgaWYgKHRoaXMuX25vZGVUeXBlLnZhbHVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9ub2RlVHlwZS5uZXh0KG5vZGVUeXBlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3dpdGNoIHRvIHRoZSBwcm92aWRlZCBkYXRhIHNvdXJjZSBieSByZXNldHRpbmcgdGhlIGRhdGEgYW5kIHVuc3Vic2NyaWJpbmcgZnJvbSB0aGUgY3VycmVudFxuICAgKiByZW5kZXIgY2hhbmdlIHN1YnNjcmlwdGlvbiBpZiBvbmUgZXhpc3RzLiBJZiB0aGUgZGF0YSBzb3VyY2UgaXMgbnVsbCwgaW50ZXJwcmV0IHRoaXMgYnlcbiAgICogY2xlYXJpbmcgdGhlIG5vZGUgb3V0bGV0LiBPdGhlcndpc2Ugc3RhcnQgbGlzdGVuaW5nIGZvciBuZXcgZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSkge1xuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICYmIHR5cGVvZiAodGhpcy5fZGF0YVNvdXJjZSBhcyBEYXRhU291cmNlPFQ+KS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAodGhpcy5kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RhdGFTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSB0aGUgYWxsIGRhdGFOb2RlcyBpZiB0aGVyZSBpcyBub3cgbm8gZGF0YSBzb3VyY2VcbiAgICBpZiAoIWRhdGFTb3VyY2UpIHtcbiAgICAgIHRoaXMuX25vZGVPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgIGlmICh0aGlzLl9ub2RlRGVmcykge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlVG9EYXRhQ2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRFeHBhbnNpb25Nb2RlbCgpIHtcbiAgICBpZiAoIXRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsID8/PSBuZXcgU2VsZWN0aW9uTW9kZWw8Sz4odHJ1ZSk7XG4gICAgICByZXR1cm4gdGhpcy5fZXhwYW5zaW9uTW9kZWw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRyZWVDb250cm9sLmV4cGFuc2lvbk1vZGVsO1xuICB9XG5cbiAgLyoqIFNldCB1cCBhIHN1YnNjcmlwdGlvbiBmb3IgdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb0RhdGFDaGFuZ2VzKCkge1xuICAgIGlmICh0aGlzLl9kYXRhU3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPiB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLl9kYXRhU291cmNlLmNvbm5lY3QodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLl9kYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLl9kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IG9ic2VydmFibGVPZih0aGlzLl9kYXRhU291cmNlKTtcbiAgICB9XG5cbiAgICBpZiAoIWRhdGFTdHJlYW0pIHtcbiAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3cgZ2V0VHJlZU5vVmFsaWREYXRhU291cmNlRXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhU3Vic2NyaXB0aW9uID0gdGhpcy5fZ2V0UmVuZGVyRGF0YShkYXRhU3RyZWFtKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAuc3Vic2NyaWJlKHJlbmRlcmluZ0RhdGEgPT4ge1xuICAgICAgICB0aGlzLl9yZW5kZXJEYXRhQ2hhbmdlcyhyZW5kZXJpbmdEYXRhKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqIEdpdmVuIGFuIE9ic2VydmFibGUgY29udGFpbmluZyBhIHN0cmVhbSBvZiB0aGUgcmF3IGRhdGEsIHJldHVybnMgYW4gT2JzZXJ2YWJsZSBjb250YWluaW5nIHRoZSBSZW5kZXJpbmdEYXRhICovXG4gIHByaXZhdGUgX2dldFJlbmRlckRhdGEoZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxyZWFkb25seSBUW10+KTogT2JzZXJ2YWJsZTxSZW5kZXJpbmdEYXRhPFQ+PiB7XG4gICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9nZXRFeHBhbnNpb25Nb2RlbCgpO1xuICAgIHJldHVybiBjb21iaW5lTGF0ZXN0KFtcbiAgICAgIGRhdGFTdHJlYW0sXG4gICAgICB0aGlzLl9ub2RlVHlwZSxcbiAgICAgIC8vIFdlIGRvbid0IHVzZSB0aGUgZXhwYW5zaW9uIGRhdGEgZGlyZWN0bHksIGhvd2V2ZXIgd2UgYWRkIGl0IGhlcmUgdG8gZXNzZW50aWFsbHlcbiAgICAgIC8vIHRyaWdnZXIgZGF0YSByZW5kZXJpbmcgd2hlbiBleHBhbnNpb24gY2hhbmdlcyBvY2N1ci5cbiAgICAgIGV4cGFuc2lvbk1vZGVsLmNoYW5nZWQucGlwZShcbiAgICAgICAgc3RhcnRXaXRoKG51bGwpLFxuICAgICAgICB0YXAoZXhwYW5zaW9uQ2hhbmdlcyA9PiB7XG4gICAgICAgICAgdGhpcy5fZW1pdEV4cGFuc2lvbkNoYW5nZXMoZXhwYW5zaW9uQ2hhbmdlcyk7XG4gICAgICAgIH0pLFxuICAgICAgKSxcbiAgICBdKS5waXBlKFxuICAgICAgc3dpdGNoTWFwKChbZGF0YSwgbm9kZVR5cGVdKSA9PiB7XG4gICAgICAgIGlmIChub2RlVHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Yoe3JlbmRlck5vZGVzOiBkYXRhLCBmbGF0dGVuZWROb2RlczogbnVsbCwgbm9kZVR5cGV9IGFzIGNvbnN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlJ3JlIGhlcmUsIHRoZW4gd2Uga25vdyB3aGF0IG91ciBub2RlIHR5cGUgaXMsIGFuZCB0aGVyZWZvcmUgY2FuXG4gICAgICAgIC8vIHBlcmZvcm0gb3VyIHVzdWFsIHJlbmRlcmluZyBwaXBlbGluZSwgd2hpY2ggbmVjZXNzaXRhdGVzIGNvbnZlcnRpbmcgdGhlIGRhdGFcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbXB1dGVSZW5kZXJpbmdEYXRhKGRhdGEsIG5vZGVUeXBlKS5waXBlKFxuICAgICAgICAgIG1hcChjb252ZXJ0ZWREYXRhID0+ICh7Li4uY29udmVydGVkRGF0YSwgbm9kZVR5cGV9KSBhcyBjb25zdCksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVuZGVyRGF0YUNoYW5nZXMoZGF0YTogUmVuZGVyaW5nRGF0YTxUPikge1xuICAgIGlmIChkYXRhLm5vZGVUeXBlID09PSBudWxsKSB7XG4gICAgICB0aGlzLnJlbmRlck5vZGVDaGFuZ2VzKGRhdGEucmVuZGVyTm9kZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHdlJ3JlIGhlcmUsIHRoZW4gd2Uga25vdyB3aGF0IG91ciBub2RlIHR5cGUgaXMsIGFuZCB0aGVyZWZvcmUgY2FuXG4gICAgLy8gcGVyZm9ybSBvdXIgdXN1YWwgcmVuZGVyaW5nIHBpcGVsaW5lLlxuICAgIHRoaXMuX3VwZGF0ZUNhY2hlZERhdGEoZGF0YS5mbGF0dGVuZWROb2Rlcyk7XG4gICAgdGhpcy5yZW5kZXJOb2RlQ2hhbmdlcyhkYXRhLnJlbmRlck5vZGVzKTtcbiAgICB0aGlzLl91cGRhdGVLZXlNYW5hZ2VySXRlbXMoZGF0YS5mbGF0dGVuZWROb2Rlcyk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0RXhwYW5zaW9uQ2hhbmdlcyhleHBhbnNpb25DaGFuZ2VzOiBTZWxlY3Rpb25DaGFuZ2U8Sz4gfCBudWxsKSB7XG4gICAgaWYgKCFleHBhbnNpb25DaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgbm9kZXMgPSB0aGlzLl9ub2Rlcy52YWx1ZTtcbiAgICBmb3IgKGNvbnN0IGFkZGVkIG9mIGV4cGFuc2lvbkNoYW5nZXMuYWRkZWQpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5nZXQoYWRkZWQpO1xuICAgICAgbm9kZT8uX2VtaXRFeHBhbnNpb25TdGF0ZSh0cnVlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCByZW1vdmVkIG9mIGV4cGFuc2lvbkNoYW5nZXMucmVtb3ZlZCkge1xuICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmdldChyZW1vdmVkKTtcbiAgICAgIG5vZGU/Ll9lbWl0RXhwYW5zaW9uU3RhdGUoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2luaXRpYWxpemVLZXlNYW5hZ2VyKCkge1xuICAgIGNvbnN0IGl0ZW1zID0gY29tYmluZUxhdGVzdChbdGhpcy5fa2V5TWFuYWdlck5vZGVzLCB0aGlzLl9ub2Rlc10pLnBpcGUoXG4gICAgICBtYXAoKFtrZXlNYW5hZ2VyTm9kZXMsIHJlbmRlck5vZGVzXSkgPT5cbiAgICAgICAga2V5TWFuYWdlck5vZGVzLnJlZHVjZTxDZGtUcmVlTm9kZTxULCBLPltdPigoaXRlbXMsIGRhdGEpID0+IHtcbiAgICAgICAgICBjb25zdCBub2RlID0gcmVuZGVyTm9kZXMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhKSk7XG4gICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2gobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpdGVtcztcbiAgICAgICAgfSwgW10pLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgY29uc3Qga2V5TWFuYWdlck9wdGlvbnM6IFRyZWVLZXlNYW5hZ2VyT3B0aW9uczxDZGtUcmVlTm9kZTxULCBLPj4gPSB7XG4gICAgICB0cmFja0J5OiBub2RlID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlLmRhdGEpLFxuICAgICAgc2tpcFByZWRpY2F0ZTogbm9kZSA9PiAhIW5vZGUuaXNEaXNhYmxlZCxcbiAgICAgIHR5cGVBaGVhZERlYm91bmNlSW50ZXJ2YWw6IHRydWUsXG4gICAgICBob3Jpem9udGFsT3JpZW50YXRpb246IHRoaXMuX2Rpci52YWx1ZSxcbiAgICB9O1xuXG4gICAgdGhpcy5fa2V5TWFuYWdlciA9IHRoaXMuX2tleU1hbmFnZXJGYWN0b3J5KGl0ZW1zLCBrZXlNYW5hZ2VyT3B0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIF9pbml0aWFsaXplRGF0YURpZmZlcigpIHtcbiAgICAvLyBQcm92aWRlIGEgZGVmYXVsdCB0cmFja0J5IGJhc2VkIG9uIGBfZ2V0RXhwYW5zaW9uS2V5YCBpZiBvbmUgaXNuJ3QgcHJvdmlkZWQuXG4gICAgY29uc3QgdHJhY2tCeSA9IHRoaXMudHJhY2tCeSA/PyAoKF9pbmRleDogbnVtYmVyLCBpdGVtOiBUKSA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoaXRlbSkpO1xuICAgIHRoaXMuX2RhdGFEaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQoW10pLmNyZWF0ZSh0cmFja0J5KTtcbiAgfVxuXG4gIHByaXZhdGUgX2NoZWNrVHJlZUNvbnRyb2xVc2FnZSgpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCBUcmVlIGZvbGxvd3MgQVBJIGNvbnRyYWN0IG9mIHVzaW5nIG9uZSBvZiBUcmVlQ29udHJvbCwgbGV2ZWxBY2Nlc3NvciBvclxuICAgICAgLy8gY2hpbGRyZW5BY2Nlc3Nvci4gVGhyb3cgYW4gYXBwcm9wcmlhdGUgZXJyb3IgaWYgY29udHJhY3QgaXMgbm90IG1ldC5cbiAgICAgIGxldCBudW1UcmVlQ29udHJvbHMgPSAwO1xuXG4gICAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgICBudW1UcmVlQ29udHJvbHMrKztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmxldmVsQWNjZXNzb3IpIHtcbiAgICAgICAgbnVtVHJlZUNvbnRyb2xzKys7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jaGlsZHJlbkFjY2Vzc29yKSB7XG4gICAgICAgIG51bVRyZWVDb250cm9scysrO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW51bVRyZWVDb250cm9scykge1xuICAgICAgICB0aHJvdyBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpO1xuICAgICAgfSBlbHNlIGlmIChudW1UcmVlQ29udHJvbHMgPiAxKSB7XG4gICAgICAgIHRocm93IGdldE11bHRpcGxlVHJlZUNvbnRyb2xzRXJyb3IoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2hlY2sgZm9yIGNoYW5nZXMgbWFkZSBpbiB0aGUgZGF0YSBhbmQgcmVuZGVyIGVhY2ggY2hhbmdlIChub2RlIGFkZGVkL3JlbW92ZWQvbW92ZWQpLiAqL1xuICByZW5kZXJOb2RlQ2hhbmdlcyhcbiAgICBkYXRhOiByZWFkb25seSBUW10sXG4gICAgZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gPSB0aGlzLl9kYXRhRGlmZmVyLFxuICAgIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYgPSB0aGlzLl9ub2RlT3V0bGV0LnZpZXdDb250YWluZXIsXG4gICAgcGFyZW50RGF0YT86IFQsXG4gICkge1xuICAgIGNvbnN0IGNoYW5nZXMgPSBkYXRhRGlmZmVyLmRpZmYoZGF0YSk7XG5cbiAgICAvLyBTb21lIHRyZWUgY29uc3VtZXJzIGV4cGVjdCBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHByb3BhZ2F0ZSB0byBub2Rlc1xuICAgIC8vIGV2ZW4gd2hlbiB0aGUgYXJyYXkgaXRzZWxmIGhhc24ndCBjaGFuZ2VkOyB3ZSBleHBsaWNpdGx5IGRldGVjdCBjaGFuZ2VzXG4gICAgLy8gYW55d2F5cyBpbiBvcmRlciBmb3Igbm9kZXMgdG8gdXBkYXRlIHRoZWlyIGRhdGEuXG4gICAgLy9cbiAgICAvLyBIb3dldmVyLCBpZiBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGNhbGxlZCB3aGlsZSB0aGUgY29tcG9uZW50J3MgdmlldyBpc1xuICAgIC8vIHN0aWxsIGluaXRpbmcsIHRoZW4gdGhlIG9yZGVyIG9mIGNoaWxkIHZpZXdzIGluaXRpbmcgd2lsbCBiZSBpbmNvcnJlY3Q7XG4gICAgLy8gdG8gcHJldmVudCB0aGlzLCB3ZSBvbmx5IGV4aXQgZWFybHkgaWYgdGhlIHZpZXcgaGFzbid0IGluaXRpYWxpemVkIHlldC5cbiAgICBpZiAoIWNoYW5nZXMgJiYgIXRoaXMuX3ZpZXdJbml0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2hhbmdlcz8uZm9yRWFjaE9wZXJhdGlvbihcbiAgICAgIChcbiAgICAgICAgaXRlbTogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgIGFkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgKSA9PiB7XG4gICAgICAgIGlmIChpdGVtLnByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuaW5zZXJ0Tm9kZShkYXRhW2N1cnJlbnRJbmRleCFdLCBjdXJyZW50SW5kZXghLCB2aWV3Q29udGFpbmVyLCBwYXJlbnREYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHZpZXdDb250YWluZXIucmVtb3ZlKGFkanVzdGVkUHJldmlvdXNJbmRleCEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHZpZXcgPSB2aWV3Q29udGFpbmVyLmdldChhZGp1c3RlZFByZXZpb3VzSW5kZXghKTtcbiAgICAgICAgICB2aWV3Q29udGFpbmVyLm1vdmUodmlldyEsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIElmIHRoZSBkYXRhIGl0c2VsZiBjaGFuZ2VzLCBidXQga2VlcHMgdGhlIHNhbWUgdHJhY2tCeSwgd2UgbmVlZCB0byB1cGRhdGUgdGhlIHRlbXBsYXRlcydcbiAgICAvLyBjb250ZXh0IHRvIHJlZmxlY3QgdGhlIG5ldyBvYmplY3QuXG4gICAgY2hhbmdlcz8uZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+KSA9PiB7XG4gICAgICBjb25zdCBuZXdEYXRhID0gcmVjb3JkLml0ZW07XG4gICAgICBpZiAocmVjb3JkLmN1cnJlbnRJbmRleCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgdmlldyA9IHZpZXdDb250YWluZXIuZ2V0KHJlY29yZC5jdXJyZW50SW5kZXgpO1xuICAgICAgICAodmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PikuY29udGV4dC4kaW1wbGljaXQgPSBuZXdEYXRhO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY2hhbmdlIHRvIGB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKWAsIG9yIGp1c3Qgc3dpdGNoIHRoaXMgY29tcG9uZW50IHRvXG4gICAgLy8gdXNlIHNpZ25hbHMuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBtYXRjaGluZyBub2RlIGRlZmluaXRpb24gdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhpcyBub2RlIGRhdGEuIElmIHRoZXJlIGlzIG9ubHlcbiAgICogb25lIG5vZGUgZGVmaW5pdGlvbiwgaXQgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSwgZmluZCB0aGUgbm9kZSBkZWZpbml0aW9uIHRoYXQgaGFzIGEgd2hlblxuICAgKiBwcmVkaWNhdGUgdGhhdCByZXR1cm5zIHRydWUgd2l0aCB0aGUgZGF0YS4gSWYgbm9uZSByZXR1cm4gdHJ1ZSwgcmV0dXJuIHRoZSBkZWZhdWx0IG5vZGVcbiAgICogZGVmaW5pdGlvbi5cbiAgICovXG4gIF9nZXROb2RlRGVmKGRhdGE6IFQsIGk6IG51bWJlcik6IENka1RyZWVOb2RlRGVmPFQ+IHtcbiAgICBpZiAodGhpcy5fbm9kZURlZnMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbm9kZURlZnMuZmlyc3QhO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVEZWYgPVxuICAgICAgdGhpcy5fbm9kZURlZnMuZmluZChkZWYgPT4gZGVmLndoZW4gJiYgZGVmLndoZW4oaSwgZGF0YSkpIHx8IHRoaXMuX2RlZmF1bHROb2RlRGVmO1xuXG4gICAgaWYgKCFub2RlRGVmICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRUcmVlTWlzc2luZ01hdGNoaW5nTm9kZURlZkVycm9yKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGVEZWYhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSB0aGUgZW1iZWRkZWQgdmlldyBmb3IgdGhlIGRhdGEgbm9kZSB0ZW1wbGF0ZSBhbmQgcGxhY2UgaXQgaW4gdGhlIGNvcnJlY3QgaW5kZXggbG9jYXRpb25cbiAgICogd2l0aGluIHRoZSBkYXRhIG5vZGUgdmlldyBjb250YWluZXIuXG4gICAqL1xuICBpbnNlcnROb2RlKG5vZGVEYXRhOiBULCBpbmRleDogbnVtYmVyLCB2aWV3Q29udGFpbmVyPzogVmlld0NvbnRhaW5lclJlZiwgcGFyZW50RGF0YT86IFQpIHtcbiAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5fZ2V0TGV2ZWxBY2Nlc3NvcigpO1xuXG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX2dldE5vZGVEZWYobm9kZURhdGEsIGluZGV4KTtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZURhdGEpO1xuXG4gICAgLy8gTm9kZSBjb250ZXh0IHRoYXQgd2lsbCBiZSBwcm92aWRlZCB0byBjcmVhdGVkIGVtYmVkZGVkIHZpZXdcbiAgICBjb25zdCBjb250ZXh0ID0gbmV3IENka1RyZWVOb2RlT3V0bGV0Q29udGV4dDxUPihub2RlRGF0YSk7XG5cbiAgICBwYXJlbnREYXRhID8/PSB0aGlzLl9wYXJlbnRzLmdldChrZXkpID8/IHVuZGVmaW5lZDtcbiAgICAvLyBJZiB0aGUgdHJlZSBpcyBmbGF0IHRyZWUsIHRoZW4gdXNlIHRoZSBgZ2V0TGV2ZWxgIGZ1bmN0aW9uIGluIGZsYXQgdHJlZSBjb250cm9sXG4gICAgLy8gT3RoZXJ3aXNlLCB1c2UgdGhlIGxldmVsIG9mIHBhcmVudCBub2RlLlxuICAgIGlmIChsZXZlbEFjY2Vzc29yKSB7XG4gICAgICBjb250ZXh0LmxldmVsID0gbGV2ZWxBY2Nlc3Nvcihub2RlRGF0YSk7XG4gICAgfSBlbHNlIGlmIChwYXJlbnREYXRhICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fbGV2ZWxzLmhhcyh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50RGF0YSkpKSB7XG4gICAgICBjb250ZXh0LmxldmVsID0gdGhpcy5fbGV2ZWxzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50RGF0YSkpISArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQubGV2ZWwgPSAwO1xuICAgIH1cbiAgICB0aGlzLl9sZXZlbHMuc2V0KGtleSwgY29udGV4dC5sZXZlbCk7XG5cbiAgICAvLyBVc2UgZGVmYXVsdCB0cmVlIG5vZGVPdXRsZXQsIG9yIG5lc3RlZCBub2RlJ3Mgbm9kZU91dGxldFxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdDb250YWluZXIgPyB2aWV3Q29udGFpbmVyIDogdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyO1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcobm9kZS50ZW1wbGF0ZSwgY29udGV4dCwgaW5kZXgpO1xuXG4gICAgLy8gU2V0IHRoZSBkYXRhIHRvIGp1c3QgY3JlYXRlZCBgQ2RrVHJlZU5vZGVgLlxuICAgIC8vIFRoZSBgQ2RrVHJlZU5vZGVgIGNyZWF0ZWQgZnJvbSBgY3JlYXRlRW1iZWRkZWRWaWV3YCB3aWxsIGJlIHNhdmVkIGluIHN0YXRpYyB2YXJpYWJsZVxuICAgIC8vICAgICBgbW9zdFJlY2VudFRyZWVOb2RlYC4gV2UgZ2V0IGl0IGZyb20gc3RhdGljIHZhcmlhYmxlIGFuZCBwYXNzIHRoZSBub2RlIGRhdGEgdG8gaXQuXG4gICAgaWYgKENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSkge1xuICAgICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlLmRhdGEgPSBub2RlRGF0YTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZGF0YSBub2RlIGlzIGV4cGFuZGVkIG9yIGNvbGxhcHNlZC4gUmV0dXJucyB0cnVlIGlmIGl0J3MgZXhwYW5kZWQuICovXG4gIGlzRXhwYW5kZWQoZGF0YU5vZGU6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISEoXG4gICAgICB0aGlzLnRyZWVDb250cm9sPy5pc0V4cGFuZGVkKGRhdGFOb2RlKSB8fFxuICAgICAgdGhpcy5fZXhwYW5zaW9uTW9kZWw/LmlzU2VsZWN0ZWQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSlcbiAgICApO1xuICB9XG5cbiAgLyoqIElmIHRoZSBkYXRhIG5vZGUgaXMgY3VycmVudGx5IGV4cGFuZGVkLCBjb2xsYXBzZSBpdC4gT3RoZXJ3aXNlLCBleHBhbmQgaXQuICovXG4gIHRvZ2dsZShkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLnRvZ2dsZShkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgdGhpcy5fZXhwYW5zaW9uTW9kZWwudG9nZ2xlKHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFeHBhbmQgdGhlIGRhdGEgbm9kZS4gSWYgaXQgaXMgYWxyZWFkeSBleHBhbmRlZCwgZG9lcyBub3RoaW5nLiAqL1xuICBleHBhbmQoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5leHBhbmQoZGF0YU5vZGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsLnNlbGVjdCh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ29sbGFwc2UgdGhlIGRhdGEgbm9kZS4gSWYgaXQgaXMgYWxyZWFkeSBjb2xsYXBzZWQsIGRvZXMgbm90aGluZy4gKi9cbiAgY29sbGFwc2UoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5jb2xsYXBzZShkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgdGhpcy5fZXhwYW5zaW9uTW9kZWwuZGVzZWxlY3QodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBkYXRhIG5vZGUgaXMgY3VycmVudGx5IGV4cGFuZGVkLCBjb2xsYXBzZSBpdCBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cy5cbiAgICogT3RoZXJ3aXNlLCBleHBhbmQgaXQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuXG4gICAqL1xuICB0b2dnbGVEZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLnRvZ2dsZURlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKGRhdGFOb2RlKSkge1xuICAgICAgICB0aGlzLmNvbGxhcHNlRGVzY2VuZGFudHMoZGF0YU5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZCB0aGUgZGF0YSBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzLiBJZiB0aGV5IGFyZSBhbHJlYWR5IGV4cGFuZGVkLCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBleHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLmV4cGFuZERlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBleHBhbnNpb25Nb2RlbCA9IHRoaXMuX2V4cGFuc2lvbk1vZGVsO1xuICAgICAgZXhwYW5zaW9uTW9kZWwuc2VsZWN0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgICAgdGhpcy5fZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpXG4gICAgICAgIC5waXBlKHRha2UoMSksIHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgICAuc3Vic2NyaWJlKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICBleHBhbnNpb25Nb2RlbC5zZWxlY3QoLi4uY2hpbGRyZW4ubWFwKGNoaWxkID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbGxhcHNlIHRoZSBkYXRhIG5vZGUgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuIElmIGl0IGlzIGFscmVhZHkgY29sbGFwc2VkLCBkb2VzIG5vdGhpbmcuICovXG4gIGNvbGxhcHNlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5jb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBleHBhbnNpb25Nb2RlbCA9IHRoaXMuX2V4cGFuc2lvbk1vZGVsO1xuICAgICAgZXhwYW5zaW9uTW9kZWwuZGVzZWxlY3QodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSk7XG4gICAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkYXRhTm9kZSlcbiAgICAgICAgLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAgIC5zdWJzY3JpYmUoY2hpbGRyZW4gPT4ge1xuICAgICAgICAgIGV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KC4uLmNoaWxkcmVuLm1hcChjaGlsZCA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFeHBhbmRzIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLiAqL1xuICBleHBhbmRBbGwoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuZXhwYW5kQWxsKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLnNlbGVjdChcbiAgICAgICAgLi4udGhpcy5fZmxhdHRlbmVkTm9kZXMudmFsdWUubWFwKGNoaWxkID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ29sbGFwc2UgYWxsIGRhdGEgbm9kZXMgaW4gdGhlIHRyZWUuICovXG4gIGNvbGxhcHNlQWxsKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLmNvbGxhcHNlQWxsKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KFxuICAgICAgICAuLi50aGlzLl9mbGF0dGVuZWROb2Rlcy52YWx1ZS5tYXAoY2hpbGQgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBMZXZlbCBhY2Nlc3NvciwgdXNlZCBmb3IgY29tcGF0aWJpbGl0eSBiZXR3ZWVuIHRoZSBvbGQgVHJlZSBhbmQgbmV3IFRyZWUgKi9cbiAgX2dldExldmVsQWNjZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJlZUNvbnRyb2w/LmdldExldmVsPy5iaW5kKHRoaXMudHJlZUNvbnRyb2wpID8/IHRoaXMubGV2ZWxBY2Nlc3NvcjtcbiAgfVxuXG4gIC8qKiBDaGlsZHJlbiBhY2Nlc3NvciwgdXNlZCBmb3IgY29tcGF0aWJpbGl0eSBiZXR3ZWVuIHRoZSBvbGQgVHJlZSBhbmQgbmV3IFRyZWUgKi9cbiAgX2dldENoaWxkcmVuQWNjZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJlZUNvbnRyb2w/LmdldENoaWxkcmVuPy5iaW5kKHRoaXMudHJlZUNvbnRyb2wpID8/IHRoaXMuY2hpbGRyZW5BY2Nlc3NvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaXJlY3QgY2hpbGRyZW4gb2YgYSBub2RlOyB1c2VkIGZvciBjb21wYXRpYmlsaXR5IGJldHdlZW4gdGhlIG9sZCB0cmVlIGFuZCB0aGVcbiAgICogbmV3IHRyZWUuXG4gICAqL1xuICBfZ2V0RGlyZWN0Q2hpbGRyZW4oZGF0YU5vZGU6IFQpOiBPYnNlcnZhYmxlPFRbXT4ge1xuICAgIGNvbnN0IGxldmVsQWNjZXNzb3IgPSB0aGlzLl9nZXRMZXZlbEFjY2Vzc29yKCk7XG4gICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbCA/PyB0aGlzLnRyZWVDb250cm9sPy5leHBhbnNpb25Nb2RlbDtcbiAgICBpZiAoIWV4cGFuc2lvbk1vZGVsKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpO1xuXG4gICAgY29uc3QgaXNFeHBhbmRlZCA9IGV4cGFuc2lvbk1vZGVsLmNoYW5nZWQucGlwZShcbiAgICAgIHN3aXRjaE1hcChjaGFuZ2VzID0+IHtcbiAgICAgICAgaWYgKGNoYW5nZXMuYWRkZWQuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hhbmdlcy5yZW1vdmVkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRU1QVFk7XG4gICAgICB9KSxcbiAgICAgIHN0YXJ0V2l0aCh0aGlzLmlzRXhwYW5kZWQoZGF0YU5vZGUpKSxcbiAgICApO1xuXG4gICAgaWYgKGxldmVsQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiBjb21iaW5lTGF0ZXN0KFtpc0V4cGFuZGVkLCB0aGlzLl9mbGF0dGVuZWROb2Rlc10pLnBpcGUoXG4gICAgICAgIG1hcCgoW2V4cGFuZGVkLCBmbGF0dGVuZWROb2Rlc10pID0+IHtcbiAgICAgICAgICBpZiAoIWV4cGFuZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQ2hpbGRyZW5CeUxldmVsKFxuICAgICAgICAgICAgbGV2ZWxBY2Nlc3NvcixcbiAgICAgICAgICAgIGZsYXR0ZW5lZE5vZGVzLFxuXG4gICAgICAgICAgICBkYXRhTm9kZSxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZHJlbkFjY2Vzc29yID0gdGhpcy5fZ2V0Q2hpbGRyZW5BY2Nlc3NvcigpO1xuICAgIGlmIChjaGlsZHJlbkFjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gY29lcmNlT2JzZXJ2YWJsZShjaGlsZHJlbkFjY2Vzc29yKGRhdGFOb2RlKSA/PyBbXSk7XG4gICAgfVxuICAgIHRocm93IGdldFRyZWVDb250cm9sTWlzc2luZ0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gdGhlIGxpc3Qgb2YgZmxhdHRlbmVkIG5vZGVzLCB0aGUgbGV2ZWwgYWNjZXNzb3IsIGFuZCB0aGUgbGV2ZWwgcmFuZ2Ugd2l0aGluXG4gICAqIHdoaWNoIHRvIGNvbnNpZGVyIGNoaWxkcmVuLCBmaW5kcyB0aGUgY2hpbGRyZW4gZm9yIGEgZ2l2ZW4gbm9kZS5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGZvciBkaXJlY3QgY2hpbGRyZW4sIGBsZXZlbERlbHRhYCB3b3VsZCBiZSAxLiBGb3IgYWxsIGRlc2NlbmRhbnRzLFxuICAgKiBgbGV2ZWxEZWx0YWAgd291bGQgYmUgSW5maW5pdHkuXG4gICAqL1xuICBwcml2YXRlIF9maW5kQ2hpbGRyZW5CeUxldmVsKFxuICAgIGxldmVsQWNjZXNzb3I6IChub2RlOiBUKSA9PiBudW1iZXIsXG4gICAgZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXSxcbiAgICBkYXRhTm9kZTogVCxcbiAgICBsZXZlbERlbHRhOiBudW1iZXIsXG4gICk6IFRbXSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKTtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gZmxhdHRlbmVkTm9kZXMuZmluZEluZGV4KG5vZGUgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpID09PSBrZXkpO1xuICAgIGNvbnN0IGRhdGFOb2RlTGV2ZWwgPSBsZXZlbEFjY2Vzc29yKGRhdGFOb2RlKTtcbiAgICBjb25zdCBleHBlY3RlZExldmVsID0gZGF0YU5vZGVMZXZlbCArIGxldmVsRGVsdGE7XG4gICAgY29uc3QgcmVzdWx0czogVFtdID0gW107XG5cbiAgICAvLyBHb2VzIHRocm91Z2ggZmxhdHRlbmVkIHRyZWUgbm9kZXMgaW4gdGhlIGBmbGF0dGVuZWROb2Rlc2AgYXJyYXksIGFuZCBnZXQgYWxsXG4gICAgLy8gZGVzY2VuZGFudHMgd2l0aGluIGEgY2VydGFpbiBsZXZlbCByYW5nZS5cbiAgICAvL1xuICAgIC8vIElmIHdlIHJlYWNoIGEgbm9kZSB3aG9zZSBsZXZlbCBpcyBlcXVhbCB0byBvciBsZXNzIHRoYW4gdGhlIGxldmVsIG9mIHRoZSB0cmVlIG5vZGUsXG4gICAgLy8gd2UgaGl0IGEgc2libGluZyBvciBwYXJlbnQncyBzaWJsaW5nLCBhbmQgc2hvdWxkIHN0b3AuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXggKyAxOyBpIDwgZmxhdHRlbmVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRMZXZlbCA9IGxldmVsQWNjZXNzb3IoZmxhdHRlbmVkTm9kZXNbaV0pO1xuICAgICAgaWYgKGN1cnJlbnRMZXZlbCA8PSBkYXRhTm9kZUxldmVsKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnRMZXZlbCA8PSBleHBlY3RlZExldmVsKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChmbGF0dGVuZWROb2Rlc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIHNwZWNpZmllZCBub2RlIGNvbXBvbmVudCB0byB0aGUgdHJlZSdzIGludGVybmFsIHJlZ2lzdHJ5LlxuICAgKlxuICAgKiBUaGlzIHByaW1hcmlseSBmYWNpbGl0YXRlcyBrZXlib2FyZCBuYXZpZ2F0aW9uLlxuICAgKi9cbiAgX3JlZ2lzdGVyTm9kZShub2RlOiBDZGtUcmVlTm9kZTxULCBLPikge1xuICAgIHRoaXMuX25vZGVzLnZhbHVlLnNldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSwgbm9kZSk7XG4gICAgdGhpcy5fbm9kZXMubmV4dCh0aGlzLl9ub2Rlcy52YWx1ZSk7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgc3BlY2lmaWVkIG5vZGUgY29tcG9uZW50IGZyb20gdGhlIHRyZWUncyBpbnRlcm5hbCByZWdpc3RyeS4gKi9cbiAgX3VucmVnaXN0ZXJOb2RlKG5vZGU6IENka1RyZWVOb2RlPFQsIEs+KSB7XG4gICAgdGhpcy5fbm9kZXMudmFsdWUuZGVsZXRlKHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlLmRhdGEpKTtcbiAgICB0aGlzLl9ub2Rlcy5uZXh0KHRoaXMuX25vZGVzLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3IgdGhlIGdpdmVuIG5vZGUsIGRldGVybWluZSB0aGUgbGV2ZWwgd2hlcmUgdGhpcyBub2RlIGFwcGVhcnMgaW4gdGhlIHRyZWUuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtbGV2ZWxgIGJ1dCBpcyAwLWluZGV4ZWQuXG4gICAqL1xuICBfZ2V0TGV2ZWwobm9kZTogVCkge1xuICAgIHJldHVybiB0aGlzLl9sZXZlbHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBub2RlLCBkZXRlcm1pbmUgdGhlIHNpemUgb2YgdGhlIHBhcmVudCdzIGNoaWxkIHNldC5cbiAgICpcbiAgICogVGhpcyBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBgYXJpYS1zZXRzaXplYC5cbiAgICovXG4gIF9nZXRTZXRTaXplKGRhdGFOb2RlOiBUKSB7XG4gICAgY29uc3Qgc2V0ID0gdGhpcy5fZ2V0QXJpYVNldChkYXRhTm9kZSk7XG4gICAgcmV0dXJuIHNldC5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBub2RlLCBkZXRlcm1pbmUgdGhlIGluZGV4IChzdGFydGluZyBmcm9tIDEpIG9mIHRoZSBub2RlIGluIGl0cyBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtcG9zaW5zZXRgLlxuICAgKi9cbiAgX2dldFBvc2l0aW9uSW5TZXQoZGF0YU5vZGU6IFQpIHtcbiAgICBjb25zdCBzZXQgPSB0aGlzLl9nZXRBcmlhU2V0KGRhdGFOb2RlKTtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpO1xuICAgIHJldHVybiBzZXQuZmluZEluZGV4KG5vZGUgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpID09PSBrZXkpICsgMTtcbiAgfVxuXG4gIC8qKiBHaXZlbiBhIENka1RyZWVOb2RlLCBnZXRzIHRoZSBub2RlIHRoYXQgcmVuZGVycyB0aGF0IG5vZGUncyBwYXJlbnQncyBkYXRhLiAqL1xuICBfZ2V0Tm9kZVBhcmVudChub2RlOiBDZGtUcmVlTm9kZTxULCBLPikge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX3BhcmVudHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlLmRhdGEpKTtcbiAgICByZXR1cm4gcGFyZW50ICYmIHRoaXMuX25vZGVzLnZhbHVlLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50KSk7XG4gIH1cblxuICAvKiogR2l2ZW4gYSBDZGtUcmVlTm9kZSwgZ2V0cyB0aGUgbm9kZXMgdGhhdCByZW5kZXJzIHRoYXQgbm9kZSdzIGNoaWxkIGRhdGEuICovXG4gIF9nZXROb2RlQ2hpbGRyZW4obm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0RGlyZWN0Q2hpbGRyZW4obm9kZS5kYXRhKS5waXBlKFxuICAgICAgbWFwKGNoaWxkcmVuID0+XG4gICAgICAgIGNoaWxkcmVuLnJlZHVjZTxDZGtUcmVlTm9kZTxULCBLPltdPigobm9kZXMsIGNoaWxkKSA9PiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9ub2Rlcy52YWx1ZS5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSk7XG4gICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgICAgIH0sIFtdKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBga2V5ZG93bmAgZXZlbnQgaGFuZGxlcjsgdGhpcyBqdXN0IHBhc3NlcyB0aGUgZXZlbnQgdG8gdGhlIGBUcmVlS2V5TWFuYWdlcmAuICovXG4gIF9zZW5kS2V5ZG93blRvS2V5TWFuYWdlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIHRoaXMuX2tleU1hbmFnZXIub25LZXlkb3duKGV2ZW50KTtcbiAgfVxuXG4gIC8qKiBHZXRzIGFsbCBuZXN0ZWQgZGVzY2VuZGFudHMgb2YgYSBnaXZlbiBub2RlLiAqL1xuICBwcml2YXRlIF9nZXREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IE9ic2VydmFibGU8VFtdPiB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YodGhpcy50cmVlQ29udHJvbC5nZXREZXNjZW5kYW50cyhkYXRhTm9kZSkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5sZXZlbEFjY2Vzc29yKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gdGhpcy5fZmluZENoaWxkcmVuQnlMZXZlbChcbiAgICAgICAgdGhpcy5sZXZlbEFjY2Vzc29yLFxuICAgICAgICB0aGlzLl9mbGF0dGVuZWROb2Rlcy52YWx1ZSxcbiAgICAgICAgZGF0YU5vZGUsXG4gICAgICAgIEluZmluaXR5LFxuICAgICAgKTtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YocmVzdWx0cyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoaWxkcmVuQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRBbGxDaGlsZHJlblJlY3Vyc2l2ZWx5KGRhdGFOb2RlKS5waXBlKFxuICAgICAgICByZWR1Y2UoKGFsbENoaWxkcmVuOiBUW10sIG5leHRDaGlsZHJlbikgPT4ge1xuICAgICAgICAgIGFsbENoaWxkcmVuLnB1c2goLi4ubmV4dENoaWxkcmVuKTtcbiAgICAgICAgICByZXR1cm4gYWxsQ2hpbGRyZW47XG4gICAgICAgIH0sIFtdKSxcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IGdldFRyZWVDb250cm9sTWlzc2luZ0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgY2hpbGRyZW4gYW5kIHN1Yi1jaGlsZHJlbiBvZiB0aGUgcHJvdmlkZWQgbm9kZS5cbiAgICpcbiAgICogVGhpcyB3aWxsIGVtaXQgbXVsdGlwbGUgdGltZXMsIGluIHRoZSBvcmRlciB0aGF0IHRoZSBjaGlsZHJlbiB3aWxsIGFwcGVhclxuICAgKiBpbiB0aGUgdHJlZSwgYW5kIGNhbiBiZSBjb21iaW5lZCB3aXRoIGEgYHJlZHVjZWAgb3BlcmF0b3IuXG4gICAqL1xuICBwcml2YXRlIF9nZXRBbGxDaGlsZHJlblJlY3Vyc2l2ZWx5KGRhdGFOb2RlOiBUKTogT2JzZXJ2YWJsZTxUW10+IHtcbiAgICBpZiAoIXRoaXMuY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZXJjZU9ic2VydmFibGUodGhpcy5jaGlsZHJlbkFjY2Vzc29yKGRhdGFOb2RlKSkucGlwZShcbiAgICAgIHRha2UoMSksXG4gICAgICBzd2l0Y2hNYXAoY2hpbGRyZW4gPT4ge1xuICAgICAgICAvLyBIZXJlLCB3ZSBjYWNoZSB0aGUgcGFyZW50cyBvZiBhIHBhcnRpY3VsYXIgY2hpbGQgc28gdGhhdCB3ZSBjYW4gY29tcHV0ZSB0aGUgbGV2ZWxzLlxuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgdGhpcy5fcGFyZW50cy5zZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSwgZGF0YU5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoLi4uY2hpbGRyZW4pLnBpcGUoXG4gICAgICAgICAgY29uY2F0TWFwKGNoaWxkID0+IGNvbmNhdChvYnNlcnZhYmxlT2YoW2NoaWxkXSksIHRoaXMuX2dldEFsbENoaWxkcmVuUmVjdXJzaXZlbHkoY2hpbGQpKSksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlOiBUKTogSyB7XG4gICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBhIGtleSBhY2Nlc3NvciBmdW5jdGlvbiB3YXMgbm90IHByb3ZpZGVkIGJ5IHRoZVxuICAgIC8vIHRyZWUgdXNlciwgd2UnbGwgZGVmYXVsdCB0byB1c2luZyB0aGUgbm9kZSBvYmplY3QgaXRzZWxmIGFzIHRoZSBrZXkuXG4gICAgLy9cbiAgICAvLyBUaGlzIGNhc3QgaXMgc2FmZSBzaW5jZTpcbiAgICAvLyAtIGlmIGFuIGV4cGFuc2lvbktleSBpcyBwcm92aWRlZCwgVFMgd2lsbCBpbmZlciB0aGUgdHlwZSBvZiBLIHRvIGJlXG4gICAgLy8gICB0aGUgcmV0dXJuIHR5cGUuXG4gICAgLy8gLSBpZiBpdCdzIG5vdCwgdGhlbiBLIHdpbGwgYmUgZGVmYXVsdGVkIHRvIFQuXG4gICAgcmV0dXJuIHRoaXMuZXhwYW5zaW9uS2V5Py4oZGF0YU5vZGUpID8/IChkYXRhTm9kZSBhcyB1bmtub3duIGFzIEspO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QXJpYVNldChub2RlOiBUKSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpO1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX3BhcmVudHMuZ2V0KGtleSk7XG4gICAgY29uc3QgcGFyZW50S2V5ID0gcGFyZW50ID8gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudCkgOiBudWxsO1xuICAgIGNvbnN0IHNldCA9IHRoaXMuX2FyaWFTZXRzLmdldChwYXJlbnRLZXkpO1xuICAgIHJldHVybiBzZXQgPz8gW25vZGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBwYXJlbnQgZm9yIHRoZSBnaXZlbiBub2RlLiBJZiB0aGlzIGlzIGEgcm9vdCBub2RlLCB0aGlzXG4gICAqIHJldHVybnMgbnVsbC4gSWYgd2UncmUgdW5hYmxlIHRvIGRldGVybWluZSB0aGUgcGFyZW50LCBmb3IgZXhhbXBsZSxcbiAgICogaWYgd2UgZG9uJ3QgaGF2ZSBjYWNoZWQgbm9kZSBkYXRhLCB0aGlzIHJldHVybnMgdW5kZWZpbmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZmluZFBhcmVudEZvck5vZGUobm9kZTogVCwgaW5kZXg6IG51bWJlciwgY2FjaGVkTm9kZXM6IHJlYWRvbmx5IFRbXSk6IFQgfCBudWxsIHtcbiAgICAvLyBJbiBhbGwgY2FzZXMsIHdlIGhhdmUgYSBtYXBwaW5nIGZyb20gbm9kZSB0byBsZXZlbDsgYWxsIHdlIG5lZWQgdG8gZG8gaGVyZSBpcyBiYWNrdHJhY2sgaW5cbiAgICAvLyBvdXIgZmxhdHRlbmVkIGxpc3Qgb2Ygbm9kZXMgdG8gZGV0ZXJtaW5lIHRoZSBmaXJzdCBub2RlIHRoYXQncyBvZiBhIGxldmVsIGxvd2VyIHRoYW4gdGhlXG4gICAgLy8gcHJvdmlkZWQgbm9kZS5cbiAgICBpZiAoIWNhY2hlZE5vZGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRMZXZlbCA9IHRoaXMuX2xldmVscy5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpKSA/PyAwO1xuICAgIGZvciAobGV0IHBhcmVudEluZGV4ID0gaW5kZXggLSAxOyBwYXJlbnRJbmRleCA+PSAwOyBwYXJlbnRJbmRleC0tKSB7XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gY2FjaGVkTm9kZXNbcGFyZW50SW5kZXhdO1xuICAgICAgY29uc3QgcGFyZW50TGV2ZWwgPSB0aGlzLl9sZXZlbHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShwYXJlbnROb2RlKSkgPz8gMDtcblxuICAgICAgaWYgKHBhcmVudExldmVsIDwgY3VycmVudExldmVsKSB7XG4gICAgICAgIHJldHVybiBwYXJlbnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHNldCBvZiByb290IG5vZGVzIGFuZCB0aGUgY3VycmVudCBub2RlIGxldmVsLCBmbGF0dGVucyBhbnkgbmVzdGVkXG4gICAqIG5vZGVzIGludG8gYSBzaW5nbGUgYXJyYXkuXG4gICAqXG4gICAqIElmIGFueSBub2RlcyBhcmUgbm90IGV4cGFuZGVkLCB0aGVuIHRoZWlyIGNoaWxkcmVuIHdpbGwgbm90IGJlIGFkZGVkIGludG8gdGhlIGFycmF5LlxuICAgKiBUaGlzIHdpbGwgc3RpbGwgdHJhdmVyc2UgYWxsIG5lc3RlZCBjaGlsZHJlbiBpbiBvcmRlciB0byBidWlsZCB1cCBvdXIgaW50ZXJuYWwgZGF0YVxuICAgKiBtb2RlbHMsIGJ1dCB3aWxsIG5vdCBpbmNsdWRlIHRoZW0gaW4gdGhlIHJldHVybmVkIGFycmF5LlxuICAgKi9cbiAgcHJpdmF0ZSBfZmxhdHRlbk5lc3RlZE5vZGVzV2l0aEV4cGFuc2lvbihub2RlczogcmVhZG9ubHkgVFtdLCBsZXZlbCA9IDApOiBPYnNlcnZhYmxlPFRbXT4ge1xuICAgIGNvbnN0IGNoaWxkcmVuQWNjZXNzb3IgPSB0aGlzLl9nZXRDaGlsZHJlbkFjY2Vzc29yKCk7XG4gICAgLy8gSWYgd2UncmUgdXNpbmcgYSBsZXZlbCBhY2Nlc3Nvciwgd2UgZG9uJ3QgbmVlZCB0byBmbGF0dGVuIGFueXRoaW5nLlxuICAgIGlmICghY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbLi4ubm9kZXNdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKC4uLm5vZGVzKS5waXBlKFxuICAgICAgY29uY2F0TWFwKG5vZGUgPT4ge1xuICAgICAgICBjb25zdCBwYXJlbnRLZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZSk7XG4gICAgICAgIGlmICghdGhpcy5fcGFyZW50cy5oYXMocGFyZW50S2V5KSkge1xuICAgICAgICAgIHRoaXMuX3BhcmVudHMuc2V0KHBhcmVudEtleSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGV2ZWxzLnNldChwYXJlbnRLZXksIGxldmVsKTtcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGNvZXJjZU9ic2VydmFibGUoY2hpbGRyZW5BY2Nlc3Nvcihub2RlKSk7XG4gICAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgICAgb2JzZXJ2YWJsZU9mKFtub2RlXSksXG4gICAgICAgICAgY2hpbGRyZW4ucGlwZShcbiAgICAgICAgICAgIHRha2UoMSksXG4gICAgICAgICAgICB0YXAoY2hpbGROb2RlcyA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuX2FyaWFTZXRzLnNldChwYXJlbnRLZXksIFsuLi4oY2hpbGROb2RlcyA/PyBbXSldKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZE5vZGVzID8/IFtdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRLZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmVudHMuc2V0KGNoaWxkS2V5LCBub2RlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sZXZlbHMuc2V0KGNoaWxkS2V5LCBsZXZlbCArIDEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN3aXRjaE1hcChjaGlsZE5vZGVzID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFjaGlsZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24oY2hpbGROb2RlcywgbGV2ZWwgKyAxKS5waXBlKFxuICAgICAgICAgICAgICAgIG1hcChuZXN0ZWROb2RlcyA9PiAodGhpcy5pc0V4cGFuZGVkKG5vZGUpID8gbmVzdGVkTm9kZXMgOiBbXSkpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgcmVkdWNlKChyZXN1bHRzLCBjaGlsZHJlbikgPT4ge1xuICAgICAgICByZXN1bHRzLnB1c2goLi4uY2hpbGRyZW4pO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sIFtdIGFzIFRbXSksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBjaGlsZHJlbiBmb3IgY2VydGFpbiB0cmVlIGNvbmZpZ3VyYXRpb25zLlxuICAgKlxuICAgKiBUaGlzIGFsc28gY29tcHV0ZXMgcGFyZW50LCBsZXZlbCwgYW5kIGdyb3VwIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9jb21wdXRlUmVuZGVyaW5nRGF0YShcbiAgICBub2RlczogcmVhZG9ubHkgVFtdLFxuICAgIG5vZGVUeXBlOiAnZmxhdCcgfCAnbmVzdGVkJyxcbiAgKTogT2JzZXJ2YWJsZTx7XG4gICAgcmVuZGVyTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgICBmbGF0dGVuZWROb2RlczogcmVhZG9ubHkgVFtdO1xuICB9PiB7XG4gICAgLy8gVGhlIG9ubHkgc2l0dWF0aW9ucyB3aGVyZSB3ZSBoYXZlIHRvIGNvbnZlcnQgY2hpbGRyZW4gdHlwZXMgaXMgd2hlblxuICAgIC8vIHRoZXkncmUgbWlzbWF0Y2hlZDsgaS5lLiBpZiB0aGUgdHJlZSBpcyB1c2luZyBhIGNoaWxkcmVuQWNjZXNzb3IgYW5kIHRoZVxuICAgIC8vIG5vZGVzIGFyZSBmbGF0LCBvciBpZiB0aGUgdHJlZSBpcyB1c2luZyBhIGxldmVsQWNjZXNzb3IgYW5kIHRoZSBub2RlcyBhcmVcbiAgICAvLyBuZXN0ZWQuXG4gICAgaWYgKHRoaXMuY2hpbGRyZW5BY2Nlc3NvciAmJiBub2RlVHlwZSA9PT0gJ2ZsYXQnKSB7XG4gICAgICAvLyBUaGlzIGZsYXR0ZW5zIGNoaWxkcmVuIGludG8gYSBzaW5nbGUgYXJyYXkuXG4gICAgICB0aGlzLl9hcmlhU2V0cy5zZXQobnVsbCwgWy4uLm5vZGVzXSk7XG4gICAgICByZXR1cm4gdGhpcy5fZmxhdHRlbk5lc3RlZE5vZGVzV2l0aEV4cGFuc2lvbihub2RlcykucGlwZShcbiAgICAgICAgbWFwKGZsYXR0ZW5lZE5vZGVzID0+ICh7XG4gICAgICAgICAgcmVuZGVyTm9kZXM6IGZsYXR0ZW5lZE5vZGVzLFxuICAgICAgICAgIGZsYXR0ZW5lZE5vZGVzLFxuICAgICAgICB9KSksXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5sZXZlbEFjY2Vzc29yICYmIG5vZGVUeXBlID09PSAnbmVzdGVkJykge1xuICAgICAgLy8gSW4gdGhlIG5lc3RlZCBjYXNlLCB3ZSBvbmx5IGxvb2sgZm9yIHJvb3Qgbm9kZXMuIFRoZSBDZGtOZXN0ZWROb2RlXG4gICAgICAvLyBpdHNlbGYgd2lsbCBoYW5kbGUgcmVuZGVyaW5nIGVhY2ggaW5kaXZpZHVhbCBub2RlJ3MgY2hpbGRyZW4uXG4gICAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5sZXZlbEFjY2Vzc29yO1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihub2Rlcy5maWx0ZXIobm9kZSA9PiBsZXZlbEFjY2Vzc29yKG5vZGUpID09PSAwKSkucGlwZShcbiAgICAgICAgbWFwKHJvb3ROb2RlcyA9PiAoe1xuICAgICAgICAgIHJlbmRlck5vZGVzOiByb290Tm9kZXMsXG4gICAgICAgICAgZmxhdHRlbmVkTm9kZXM6IG5vZGVzLFxuICAgICAgICB9KSksXG4gICAgICAgIHRhcCgoe2ZsYXR0ZW5lZE5vZGVzfSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZVBhcmVudHMoZmxhdHRlbmVkTm9kZXMpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ2ZsYXQnKSB7XG4gICAgICAvLyBJbiB0aGUgY2FzZSBvZiBhIFRyZWVDb250cm9sLCB3ZSBrbm93IHRoYXQgdGhlIG5vZGUgdHlwZSBtYXRjaGVzIHVwXG4gICAgICAvLyB3aXRoIHRoZSBUcmVlQ29udHJvbCwgYW5kIHNvIG5vIGNvbnZlcnNpb25zIGFyZSBuZWNlc3NhcnkuIE90aGVyd2lzZSxcbiAgICAgIC8vIHdlJ3ZlIGFscmVhZHkgY29uZmlybWVkIHRoYXQgdGhlIGRhdGEgbW9kZWwgbWF0Y2hlcyB1cCB3aXRoIHRoZVxuICAgICAgLy8gZGVzaXJlZCBub2RlIHR5cGUgaGVyZS5cbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Yoe3JlbmRlck5vZGVzOiBub2RlcywgZmxhdHRlbmVkTm9kZXM6IG5vZGVzfSkucGlwZShcbiAgICAgICAgdGFwKCh7ZmxhdHRlbmVkTm9kZXN9KSA9PiB7XG4gICAgICAgICAgdGhpcy5fY2FsY3VsYXRlUGFyZW50cyhmbGF0dGVuZWROb2Rlcyk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9yIG5lc3RlZCBub2Rlcywgd2Ugc3RpbGwgbmVlZCB0byBwZXJmb3JtIHRoZSBub2RlIGZsYXR0ZW5pbmcgaW4gb3JkZXJcbiAgICAgIC8vIHRvIG1haW50YWluIG91ciBjYWNoZXMgZm9yIHZhcmlvdXMgdHJlZSBvcGVyYXRpb25zLlxuICAgICAgdGhpcy5fYXJpYVNldHMuc2V0KG51bGwsIFsuLi5ub2Rlc10pO1xuICAgICAgcmV0dXJuIHRoaXMuX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24obm9kZXMpLnBpcGUoXG4gICAgICAgIG1hcChmbGF0dGVuZWROb2RlcyA9PiAoe1xuICAgICAgICAgIHJlbmRlck5vZGVzOiBub2RlcyxcbiAgICAgICAgICBmbGF0dGVuZWROb2RlcyxcbiAgICAgICAgfSkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVDYWNoZWREYXRhKGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW10pIHtcbiAgICB0aGlzLl9mbGF0dGVuZWROb2Rlcy5uZXh0KGZsYXR0ZW5lZE5vZGVzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZUtleU1hbmFnZXJJdGVtcyhmbGF0dGVuZWROb2RlczogcmVhZG9ubHkgVFtdKSB7XG4gICAgdGhpcy5fa2V5TWFuYWdlck5vZGVzLm5leHQoZmxhdHRlbmVkTm9kZXMpO1xuICB9XG5cbiAgLyoqIFRyYXZlcnNlIHRoZSBmbGF0dGVuZWQgbm9kZSBkYXRhIGFuZCBjb21wdXRlIHBhcmVudHMsIGxldmVscywgYW5kIGdyb3VwIGRhdGEuICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVBhcmVudHMoZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXSk6IHZvaWQge1xuICAgIGNvbnN0IGxldmVsQWNjZXNzb3IgPSB0aGlzLl9nZXRMZXZlbEFjY2Vzc29yKCk7XG4gICAgaWYgKCFsZXZlbEFjY2Vzc29yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcGFyZW50cy5jbGVhcigpO1xuICAgIHRoaXMuX2FyaWFTZXRzLmNsZWFyKCk7XG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmxhdHRlbmVkTm9kZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjb25zdCBkYXRhTm9kZSA9IGZsYXR0ZW5lZE5vZGVzW2luZGV4XTtcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSk7XG4gICAgICB0aGlzLl9sZXZlbHMuc2V0KGtleSwgbGV2ZWxBY2Nlc3NvcihkYXRhTm9kZSkpO1xuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZmluZFBhcmVudEZvck5vZGUoZGF0YU5vZGUsIGluZGV4LCBmbGF0dGVuZWROb2Rlcyk7XG4gICAgICB0aGlzLl9wYXJlbnRzLnNldChrZXksIHBhcmVudCk7XG4gICAgICBjb25zdCBwYXJlbnRLZXkgPSBwYXJlbnQgPyB0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50KSA6IG51bGw7XG5cbiAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5fYXJpYVNldHMuZ2V0KHBhcmVudEtleSkgPz8gW107XG4gICAgICBncm91cC5zcGxpY2UoaW5kZXgsIDAsIGRhdGFOb2RlKTtcbiAgICAgIHRoaXMuX2FyaWFTZXRzLnNldChwYXJlbnRLZXksIGdyb3VwKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUcmVlIG5vZGUgZm9yIENka1RyZWUuIEl0IGNvbnRhaW5zIHRoZSBkYXRhIGluIHRoZSB0cmVlIG5vZGUuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay10cmVlLW5vZGUnLFxuICBleHBvcnRBczogJ2Nka1RyZWVOb2RlJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdHJlZS1ub2RlJyxcbiAgICAnW2F0dHIuYXJpYS1leHBhbmRlZF0nOiAnX2dldEFyaWFFeHBhbmRlZCgpJyxcbiAgICAnW2F0dHIuYXJpYS1sZXZlbF0nOiAnbGV2ZWwgKyAxJyxcbiAgICAnW2F0dHIuYXJpYS1wb3NpbnNldF0nOiAnX2dldFBvc2l0aW9uSW5TZXQoKScsXG4gICAgJ1thdHRyLmFyaWEtc2V0c2l6ZV0nOiAnX2dldFNldFNpemUoKScsXG4gICAgJ1t0YWJpbmRleF0nOiAnX3RhYmluZGV4JyxcbiAgICAncm9sZSc6ICd0cmVlaXRlbScsXG4gICAgJyhjbGljayknOiAnX3NldEFjdGl2ZUl0ZW0oKScsXG4gICAgJyhmb2N1cyknOiAnX2ZvY3VzSXRlbSgpJyxcbiAgfSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGU8VCwgSyA9IFQ+IGltcGxlbWVudHMgT25EZXN0cm95LCBPbkluaXQsIFRyZWVLZXlNYW5hZ2VySXRlbSB7XG4gIHByb3RlY3RlZCBfdGFiaW5kZXg6IG51bWJlciB8IG51bGwgPSAtMTtcblxuICAvKipcbiAgICogVGhlIHJvbGUgb2YgdGhlIHRyZWUgbm9kZS5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIGlnbm9yZWQ7IHRoZSB0cmVlIHdpbGwgYXV0b21hdGljYWxseSBkZXRlcm1pbmUgdGhlIGFwcHJvcHJpYXRlIHJvbGVcbiAgICogZm9yIHRyZWUgbm9kZS4gVGhpcyBpbnB1dCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgdmVyc2lvbi5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAyMS4wLjBcbiAgICovXG4gIEBJbnB1dCgpIGdldCByb2xlKCk6ICd0cmVlaXRlbScgfCAnZ3JvdXAnIHtcbiAgICByZXR1cm4gJ3RyZWVpdGVtJztcbiAgfVxuXG4gIHNldCByb2xlKF9yb2xlOiAndHJlZWl0ZW0nIHwgJ2dyb3VwJykge1xuICAgIC8vIGlnbm9yZSBhbnkgcm9sZSBzZXR0aW5nLCB3ZSBoYW5kbGUgdGhpcyBpbnRlcm5hbGx5LlxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgbm9kZSBpcyBleHBhbmRhYmxlLlxuICAgKlxuICAgKiBJZiBub3QgdXNpbmcgYEZsYXRUcmVlQ29udHJvbGAsIG9yIGlmIGBpc0V4cGFuZGFibGVgIGlzIG5vdCBwcm92aWRlZCB0b1xuICAgKiBgTmVzdGVkVHJlZUNvbnRyb2xgLCB0aGlzIHNob3VsZCBiZSBwcm92aWRlZCBmb3IgY29ycmVjdCBub2RlIGExMXkuXG4gICAqL1xuICBASW5wdXQoe3RyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBpc0V4cGFuZGFibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRXhwYW5kYWJsZSgpO1xuICB9XG4gIHNldCBpc0V4cGFuZGFibGUoaXNFeHBhbmRhYmxlOiBib29sZWFuKSB7XG4gICAgdGhpcy5faW5wdXRJc0V4cGFuZGFibGUgPSBpc0V4cGFuZGFibGU7XG4gICAgaWYgKCh0aGlzLmRhdGEgJiYgIXRoaXMuX2lzRXhwYW5kYWJsZSkgfHwgIXRoaXMuX2lucHV0SXNFeHBhbmRhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIElmIHRoZSBub2RlIGlzIGJlaW5nIHNldCB0byBleHBhbmRhYmxlLCBlbnN1cmUgdGhhdCB0aGUgc3RhdHVzIG9mIHRoZVxuICAgIC8vIG5vZGUgaXMgcHJvcGFnYXRlZFxuICAgIGlmICh0aGlzLl9pbnB1dElzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9pbnB1dElzRXhwYW5kZWQgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmNvbGxhcHNlKCk7XG4gICAgfVxuICB9XG5cbiAgQElucHV0KClcbiAgZ2V0IGlzRXhwYW5kZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuaXNFeHBhbmRlZCh0aGlzLl9kYXRhKTtcbiAgfVxuICBzZXQgaXNFeHBhbmRlZChpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgdGhpcy5faW5wdXRJc0V4cGFuZGVkID0gaXNFeHBhbmRlZDtcbiAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5leHBhbmQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsYXBzZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgZGlzYWJsZWQuIElmIGl0J3MgZGlzYWJsZWQsIHRoZW4gdGhlIHVzZXIgd29uJ3QgYmUgYWJsZSB0byBmb2N1c1xuICAgKiBvciBhY3RpdmF0ZSB0aGlzIG5vZGUuXG4gICAqL1xuICBASW5wdXQoe3RyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pIGlzRGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSB0ZXh0IHVzZWQgdG8gbG9jYXRlIHRoaXMgaXRlbSBkdXJpbmcgdHlwZWFoZWFkLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgYHRleHRDb250ZW50YCB3aWxsXG4gICAqIHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVUeXBlYWhlYWRMYWJlbCcpIHR5cGVhaGVhZExhYmVsOiBzdHJpbmcgfCBudWxsO1xuXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudHlwZWFoZWFkTGFiZWwgfHwgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gIH1cblxuICAvKiogVGhpcyBlbWl0cyB3aGVuIHRoZSBub2RlIGhhcyBiZWVuIHByb2dyYW1hdGljYWxseSBhY3RpdmF0ZWQgb3IgYWN0aXZhdGVkIGJ5IGtleWJvYXJkLiAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgYWN0aXZhdGlvbjogRXZlbnRFbWl0dGVyPFQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxUPigpO1xuXG4gIC8qKiBUaGlzIGVtaXRzIHdoZW4gdGhlIG5vZGUncyBleHBhbnNpb24gc3RhdHVzIGhhcyBiZWVuIGNoYW5nZWQuICovXG4gIEBPdXRwdXQoKVxuICByZWFkb25seSBleHBhbmRlZENoYW5nZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+ID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPigpO1xuXG4gIC8qKlxuICAgKiBUaGUgbW9zdCByZWNlbnRseSBjcmVhdGVkIGBDZGtUcmVlTm9kZWAuIFdlIHNhdmUgaXQgaW4gc3RhdGljIHZhcmlhYmxlIHNvIHdlIGNhbiByZXRyaWV2ZSBpdFxuICAgKiBpbiBgQ2RrVHJlZWAgYW5kIHNldCB0aGUgZGF0YSB0byBpdC5cbiAgICovXG4gIHN0YXRpYyBtb3N0UmVjZW50VHJlZU5vZGU6IENka1RyZWVOb2RlPGFueT4gfCBudWxsID0gbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgbm9kZSdzIGRhdGEgaGFzIGNoYW5nZWQuICovXG4gIHJlYWRvbmx5IF9kYXRhQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgcHJpdmF0ZSBfaW5wdXRJc0V4cGFuZGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfaW5wdXRJc0V4cGFuZGVkOiBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAvKipcbiAgICogRmxhZyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgYmUgZm9jdXNpbmcgdGhlIGFjdHVhbCBlbGVtZW50IGJhc2VkIG9uXG4gICAqIHNvbWUgdXNlciBpbnRlcmFjdGlvbiAoY2xpY2sgb3IgZm9jdXMpLiBPbiBjbGljaywgd2UgZG9uJ3QgZm9yY2libHkgZm9jdXMgdGhlIGVsZW1lbnRcbiAgICogc2luY2UgdGhlIGNsaWNrIGNvdWxkIHRyaWdnZXIgc29tZSBvdGhlciBjb21wb25lbnQgdGhhdCB3YW50cyB0byBncmFiIGl0cyBvd24gZm9jdXNcbiAgICogKGUuZy4gbWVudSwgZGlhbG9nKS5cbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEZvY3VzID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfcGFyZW50Tm9kZUFyaWFMZXZlbDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdHJlZSBub2RlJ3MgZGF0YS4gKi9cbiAgZ2V0IGRhdGEoKTogVCB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gIH1cbiAgc2V0IGRhdGEodmFsdWU6IFQpIHtcbiAgICBpZiAodmFsdWUgIT09IHRoaXMuX2RhdGEpIHtcbiAgICAgIHRoaXMuX2RhdGEgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2RhdGFDaGFuZ2VzLm5leHQoKTtcbiAgICB9XG4gIH1cbiAgcHJvdGVjdGVkIF9kYXRhOiBUO1xuXG4gIC8qIElmIGxlYWYgbm9kZSwgcmV0dXJuIHRydWUgdG8gbm90IGFzc2lnbiBhcmlhLWV4cGFuZGVkIGF0dHJpYnV0ZSAqL1xuICBnZXQgaXNMZWFmTm9kZSgpOiBib29sZWFuIHtcbiAgICAvLyBJZiBmbGF0IHRyZWUgbm9kZSBkYXRhIHJldHVybnMgZmFsc2UgZm9yIGV4cGFuZGFibGUgcHJvcGVydHksIGl0J3MgYSBsZWFmIG5vZGVcbiAgICBpZiAoXG4gICAgICB0aGlzLl90cmVlLnRyZWVDb250cm9sPy5pc0V4cGFuZGFibGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgIXRoaXMuX3RyZWUudHJlZUNvbnRyb2wuaXNFeHBhbmRhYmxlKHRoaXMuX2RhdGEpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gSWYgbmVzdGVkIHRyZWUgbm9kZSBkYXRhIHJldHVybnMgMCBkZXNjZW5kYW50cywgaXQncyBhIGxlYWYgbm9kZVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLl90cmVlLnRyZWVDb250cm9sPy5pc0V4cGFuZGFibGUgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uZ2V0RGVzY2VuZGFudHModGhpcy5fZGF0YSkubGVuZ3RoID09PSAwXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBnZXQgbGV2ZWwoKTogbnVtYmVyIHtcbiAgICAvLyBJZiB0aGUgdHJlZSBoYXMgYSBsZXZlbEFjY2Vzc29yLCB1c2UgaXQgdG8gZ2V0IHRoZSBsZXZlbC4gT3RoZXJ3aXNlIHJlYWQgdGhlXG4gICAgLy8gYXJpYS1sZXZlbCBvZmYgdGhlIHBhcmVudCBub2RlIGFuZCB1c2UgaXQgYXMgdGhlIGxldmVsIGZvciB0aGlzIG5vZGUgKG5vdGUgYXJpYS1sZXZlbCBpc1xuICAgIC8vIDEtaW5kZXhlZCwgd2hpbGUgdGhpcyBwcm9wZXJ0eSBpcyAwLWluZGV4ZWQsIHNvIHdlIGRvbid0IG5lZWQgdG8gaW5jcmVtZW50KS5cbiAgICByZXR1cm4gdGhpcy5fdHJlZS5fZ2V0TGV2ZWwodGhpcy5fZGF0YSkgPz8gdGhpcy5fcGFyZW50Tm9kZUFyaWFMZXZlbDtcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIGlmIHRoZSB0cmVlIG5vZGUgaXMgZXhwYW5kYWJsZS4gKi9cbiAgX2lzRXhwYW5kYWJsZSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdHJlZS50cmVlQ29udHJvbCkge1xuICAgICAgaWYgKHRoaXMuaXNMZWFmTm9kZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBjb21wYXRpYmlsaXR5IHdpdGggdHJlZXMgY3JlYXRlZCB1c2luZyBUcmVlQ29udHJvbCBiZWZvcmUgd2UgYWRkZWRcbiAgICAgIC8vIENka1RyZWVOb2RlI2lzRXhwYW5kYWJsZS5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faW5wdXRJc0V4cGFuZGFibGU7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgdmFsdWUgZm9yIGBhcmlhLWV4cGFuZGVkYC5cbiAgICpcbiAgICogRm9yIG5vbi1leHBhbmRhYmxlIG5vZGVzLCB0aGlzIGlzIGBudWxsYC5cbiAgICovXG4gIF9nZXRBcmlhRXhwYW5kZWQoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLl9pc0V4cGFuZGFibGUoKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBTdHJpbmcodGhpcy5pc0V4cGFuZGVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBzaXplIG9mIHRoaXMgbm9kZSdzIHBhcmVudCdzIGNoaWxkIHNldC5cbiAgICpcbiAgICogVGhpcyBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBgYXJpYS1zZXRzaXplYC5cbiAgICovXG4gIF9nZXRTZXRTaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldFNldFNpemUodGhpcy5fZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgaW5kZXggKHN0YXJ0aW5nIGZyb20gMSkgb2YgdGhpcyBub2RlIGluIGl0cyBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtcG9zaW5zZXRgLlxuICAgKi9cbiAgX2dldFBvc2l0aW9uSW5TZXQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5fZ2V0UG9zaXRpb25JblNldCh0aGlzLl9kYXRhKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmID0gaW5qZWN0KENoYW5nZURldGVjdG9yUmVmKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcm90ZWN0ZWQgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIHByb3RlY3RlZCBfdHJlZTogQ2RrVHJlZTxULCBLPixcbiAgKSB7XG4gICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID0gdGhpcyBhcyBDZGtUcmVlTm9kZTxULCBLPjtcbiAgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuX3BhcmVudE5vZGVBcmlhTGV2ZWwgPSBnZXRQYXJlbnROb2RlQXJpYUxldmVsKHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5fdHJlZVxuICAgICAgLl9nZXRFeHBhbnNpb25Nb2RlbCgpXG4gICAgICAuY2hhbmdlZC5waXBlKFxuICAgICAgICBtYXAoKCkgPT4gdGhpcy5pc0V4cGFuZGVkKSxcbiAgICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICAgIH0pO1xuICAgIHRoaXMuX3RyZWUuX3NldE5vZGVUeXBlSWZVbnNldCgnZmxhdCcpO1xuICAgIHRoaXMuX3RyZWUuX3JlZ2lzdGVyTm9kZSh0aGlzKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgdHJlZSBub2RlIGJlaW5nIGRlc3Ryb3llZCxcbiAgICAvLyBjbGVhciBvdXQgdGhlIHJlZmVyZW5jZSB0byBhdm9pZCBsZWFraW5nIG1lbW9yeS5cbiAgICBpZiAoQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID09PSB0aGlzKSB7XG4gICAgICBDZGtUcmVlTm9kZS5tb3N0UmVjZW50VHJlZU5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGFDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIGdldFBhcmVudCgpOiBDZGtUcmVlTm9kZTxULCBLPiB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXROb2RlUGFyZW50KHRoaXMpID8/IG51bGw7XG4gIH1cblxuICBnZXRDaGlsZHJlbigpOiBDZGtUcmVlTm9kZTxULCBLPltdIHwgT2JzZXJ2YWJsZTxDZGtUcmVlTm9kZTxULCBLPltdPiB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldE5vZGVDaGlsZHJlbih0aGlzKTtcbiAgfVxuXG4gIC8qKiBGb2N1c2VzIHRoaXMgZGF0YSBub2RlLiBJbXBsZW1lbnRlZCBmb3IgVHJlZUtleU1hbmFnZXJJdGVtLiAqL1xuICBmb2N1cygpOiB2b2lkIHtcbiAgICB0aGlzLl90YWJpbmRleCA9IDA7XG4gICAgaWYgKHRoaXMuX3Nob3VsZEZvY3VzKSB7XG4gICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKiBEZWZvY3VzIHRoaXMgZGF0YSBub2RlLiAqL1xuICB1bmZvY3VzKCk6IHZvaWQge1xuICAgIHRoaXMuX3RhYmluZGV4ID0gLTE7XG5cbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKiBFbWl0cyBhbiBhY3RpdmF0aW9uIGV2ZW50LiBJbXBsZW1lbnRlZCBmb3IgVHJlZUtleU1hbmFnZXJJdGVtLiAqL1xuICBhY3RpdmF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuYWN0aXZhdGlvbi5uZXh0KHRoaXMuX2RhdGEpO1xuICB9XG5cbiAgLyoqIENvbGxhcHNlcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgY29sbGFwc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNFeHBhbmRhYmxlKSB7XG4gICAgICB0aGlzLl90cmVlLmNvbGxhcHNlKHRoaXMuX2RhdGEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFeHBhbmRzIHRoaXMgZGF0YSBub2RlLiBJbXBsZW1lbnRlZCBmb3IgVHJlZUtleU1hbmFnZXJJdGVtLiAqL1xuICBleHBhbmQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNFeHBhbmRhYmxlKSB7XG4gICAgICB0aGlzLl90cmVlLmV4cGFuZCh0aGlzLl9kYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKiogTWFrZXMgdGhlIG5vZGUgZm9jdXNhYmxlLiBJbXBsZW1lbnRlZCBmb3IgVHJlZUtleU1hbmFnZXJJdGVtLiAqL1xuICBtYWtlRm9jdXNhYmxlKCk6IHZvaWQge1xuICAgIHRoaXMuX3RhYmluZGV4ID0gMDtcbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIF9mb2N1c0l0ZW0oKSB7XG4gICAgaWYgKHRoaXMuaXNEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl90cmVlLl9rZXlNYW5hZ2VyLmZvY3VzSXRlbSh0aGlzKTtcbiAgfVxuXG4gIF9zZXRBY3RpdmVJdGVtKCkge1xuICAgIGlmICh0aGlzLmlzRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fc2hvdWxkRm9jdXMgPSBmYWxzZTtcbiAgICB0aGlzLl90cmVlLl9rZXlNYW5hZ2VyLmZvY3VzSXRlbSh0aGlzKTtcbiAgICB0aGlzLl9zaG91bGRGb2N1cyA9IHRydWU7XG4gIH1cblxuICBfZW1pdEV4cGFuc2lvblN0YXRlKGV4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgdGhpcy5leHBhbmRlZENoYW5nZS5lbWl0KGV4cGFuZGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnROb2RlQXJpYUxldmVsKG5vZGVFbGVtZW50OiBIVE1MRWxlbWVudCk6IG51bWJlciB7XG4gIGxldCBwYXJlbnQgPSBub2RlRWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICB3aGlsZSAocGFyZW50ICYmICFpc05vZGVFbGVtZW50KHBhcmVudCkpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcbiAgfVxuICBpZiAoIXBhcmVudCkge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIHRocm93IEVycm9yKCdJbmNvcnJlY3QgdHJlZSBzdHJ1Y3R1cmUgY29udGFpbmluZyBkZXRhY2hlZCBub2RlLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICB9IGVsc2UgaWYgKHBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2Nkay1uZXN0ZWQtdHJlZS1ub2RlJykpIHtcbiAgICByZXR1cm4gbnVtYmVyQXR0cmlidXRlKHBhcmVudC5nZXRBdHRyaWJ1dGUoJ2FyaWEtbGV2ZWwnKSEpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBhbmNlc3RvciBlbGVtZW50IGlzIHRoZSBjZGstdHJlZSBpdHNlbGZcbiAgICByZXR1cm4gMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc05vZGVFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gIGNvbnN0IGNsYXNzTGlzdCA9IGVsZW1lbnQuY2xhc3NMaXN0O1xuICByZXR1cm4gISEoY2xhc3NMaXN0Py5jb250YWlucygnY2RrLW5lc3RlZC10cmVlLW5vZGUnKSB8fCBjbGFzc0xpc3Q/LmNvbnRhaW5zKCdjZGstdHJlZScpKTtcbn1cbiJdfQ==