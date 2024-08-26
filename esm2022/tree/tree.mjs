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
import * as i1 from "@angular/cdk/bidi";
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
    constructor(_differs, _changeDetectorRef, _dir) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        this._dir = _dir;
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTree, deps: [{ token: i0.IterableDiffers }, { token: i0.ChangeDetectorRef }, { token: i1.Directionality }], target: i0.ɵɵFactoryTarget.Component }); }
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
        }], ctorParameters: () => [{ type: i0.IterableDiffers }, { type: i0.ChangeDetectorRef }, { type: i1.Directionality }], propDecorators: { dataSource: [{
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
    }
    get isExpanded() {
        return this._tree.isExpanded(this._data);
    }
    set isExpanded(isExpanded) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS90cmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFDTCxnQkFBZ0IsR0FLakIsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUdMLFlBQVksRUFFWixjQUFjLEdBQ2YsTUFBTSwwQkFBMEIsQ0FBQztBQUNsQyxPQUFPLEVBSUwsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUVaLEtBQUssRUFHTCxlQUFlLEVBR2YsTUFBTSxFQUNOLFNBQVMsRUFFVCxTQUFTLEVBRVQsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixNQUFNLEVBQ04sZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQy9ELE9BQU8sRUFDTCxlQUFlLEVBQ2YsYUFBYSxFQUNiLE1BQU0sRUFDTixLQUFLLEVBRUwsT0FBTyxFQUVQLFlBQVksRUFDWixFQUFFLElBQUksWUFBWSxHQUNuQixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsU0FBUyxFQUNULEdBQUcsRUFDSCxNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxJQUFJLEVBQ0osU0FBUyxFQUNULEdBQUcsR0FDSixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBQyxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFDTCw0QkFBNEIsRUFDNUIsMEJBQTBCLEVBQzFC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QkFEbEIsTUFBTTtnQkFLRSxjQUFjO3NCQUR0QixNQUFNOztBQTBOVCxTQUFTLHNCQUFzQixDQUFDLFdBQXdCO0lBQ3RELElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUM7SUFDdkMsT0FBTyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUN4QyxNQUFNLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztJQUNoQyxDQUFDO0lBQ0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFLENBQUM7WUFDbEQsTUFBTSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztRQUNwRSxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDWixDQUFDO0lBQ0gsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDO1FBQzdELE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFFLENBQUMsQ0FBQztJQUM3RCxDQUFDO1NBQU0sQ0FBQztRQUNOLDhDQUE4QztRQUM5QyxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBb0I7SUFDekMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztJQUNwQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsc0JBQXNCLENBQUMsSUFBSSxTQUFTLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgVFJFRV9LRVlfTUFOQUdFUixcbiAgVHJlZUtleU1hbmFnZXJGYWN0b3J5LFxuICBUcmVlS2V5TWFuYWdlckl0ZW0sXG4gIFRyZWVLZXlNYW5hZ2VyT3B0aW9ucyxcbiAgVHJlZUtleU1hbmFnZXJTdHJhdGVneSxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvblZpZXdlcixcbiAgRGF0YVNvdXJjZSxcbiAgaXNEYXRhU291cmNlLFxuICBTZWxlY3Rpb25DaGFuZ2UsXG4gIFNlbGVjdGlvbk1vZGVsLFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50Q2hlY2tlZCxcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgSW5wdXQsXG4gIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkLFxuICBJdGVyYWJsZURpZmZlcixcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFRyYWNrQnlGdW5jdGlvbixcbiAgVmlld0NoaWxkLFxuICBWaWV3Q29udGFpbmVyUmVmLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgbnVtYmVyQXR0cmlidXRlLFxuICBpbmplY3QsXG4gIGJvb2xlYW5BdHRyaWJ1dGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtjb2VyY2VPYnNlcnZhYmxlfSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24vcHJpdmF0ZSc7XG5pbXBvcnQge1xuICBCZWhhdmlvclN1YmplY3QsXG4gIGNvbWJpbmVMYXRlc3QsXG4gIGNvbmNhdCxcbiAgRU1QVFksXG4gIE9ic2VydmFibGUsXG4gIFN1YmplY3QsXG4gIFN1YnNjcmlwdGlvbixcbiAgaXNPYnNlcnZhYmxlLFxuICBvZiBhcyBvYnNlcnZhYmxlT2YsXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgZGlzdGluY3RVbnRpbENoYW5nZWQsXG4gIGNvbmNhdE1hcCxcbiAgbWFwLFxuICByZWR1Y2UsXG4gIHN0YXJ0V2l0aCxcbiAgc3dpdGNoTWFwLFxuICB0YWtlLFxuICB0YWtlVW50aWwsXG4gIHRhcCxcbn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtUcmVlQ29udHJvbH0gZnJvbSAnLi9jb250cm9sL3RyZWUtY29udHJvbCc7XG5pbXBvcnQge0Nka1RyZWVOb2RlRGVmLCBDZGtUcmVlTm9kZU91dGxldENvbnRleHR9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge0Nka1RyZWVOb2RlT3V0bGV0fSBmcm9tICcuL291dGxldCc7XG5pbXBvcnQge1xuICBnZXRNdWx0aXBsZVRyZWVDb250cm9sc0Vycm9yLFxuICBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcixcbiAgZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcixcbiAgZ2V0VHJlZU11bHRpcGxlRGVmYXVsdE5vZGVEZWZzRXJyb3IsXG4gIGdldFRyZWVOb1ZhbGlkRGF0YVNvdXJjZUVycm9yLFxufSBmcm9tICcuL3RyZWUtZXJyb3JzJztcblxudHlwZSBSZW5kZXJpbmdEYXRhPFQ+ID1cbiAgfCB7XG4gICAgICBmbGF0dGVuZWROb2RlczogbnVsbDtcbiAgICAgIG5vZGVUeXBlOiBudWxsO1xuICAgICAgcmVuZGVyTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgICB9XG4gIHwge1xuICAgICAgZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgICAgIG5vZGVUeXBlOiAnbmVzdGVkJyB8ICdmbGF0JztcbiAgICAgIHJlbmRlck5vZGVzOiByZWFkb25seSBUW107XG4gICAgfTtcblxuLyoqXG4gKiBDREsgdHJlZSBjb21wb25lbnQgdGhhdCBjb25uZWN0cyB3aXRoIGEgZGF0YSBzb3VyY2UgdG8gcmV0cmlldmUgZGF0YSBvZiB0eXBlIGBUYCBhbmQgcmVuZGVyc1xuICogZGF0YU5vZGVzIHdpdGggaGllcmFyY2h5LiBVcGRhdGVzIHRoZSBkYXRhTm9kZXMgd2hlbiBuZXcgZGF0YSBpcyBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay10cmVlJyxcbiAgZXhwb3J0QXM6ICdjZGtUcmVlJyxcbiAgdGVtcGxhdGU6IGA8bmctY29udGFpbmVyIGNka1RyZWVOb2RlT3V0bGV0PjwvbmctY29udGFpbmVyPmAsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUnLFxuICAgICdyb2xlJzogJ3RyZWUnLFxuICAgICcoa2V5ZG93biknOiAnX3NlbmRLZXlkb3duVG9LZXlNYW5hZ2VyKCRldmVudCknLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAvLyBUaGUgXCJPblB1c2hcIiBzdGF0dXMgZm9yIHRoZSBgQ2RrVHJlZWAgY29tcG9uZW50IGlzIGVmZmVjdGl2ZWx5IGEgbm9vcCwgc28gd2UgYXJlIHJlbW92aW5nIGl0LlxuICAvLyBUaGUgdmlldyBmb3IgYENka1RyZWVgIGNvbnNpc3RzIGVudGlyZWx5IG9mIHRlbXBsYXRlcyBkZWNsYXJlZCBpbiBvdGhlciB2aWV3cy4gQXMgdGhleSBhcmVcbiAgLy8gZGVjbGFyZWQgZWxzZXdoZXJlLCB0aGV5IGFyZSBjaGVja2VkIHdoZW4gdGhlaXIgZGVjbGFyYXRpb24gcG9pbnRzIGFyZSBjaGVja2VkLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6dmFsaWRhdGUtZGVjb3JhdG9yc1xuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5LkRlZmF1bHQsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtDZGtUcmVlTm9kZU91dGxldF0sXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWU8VCwgSyA9IFQ+XG4gIGltcGxlbWVudHNcbiAgICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICAgIEFmdGVyQ29udGVudEluaXQsXG4gICAgQWZ0ZXJWaWV3SW5pdCxcbiAgICBDb2xsZWN0aW9uVmlld2VyLFxuICAgIE9uRGVzdHJveSxcbiAgICBPbkluaXRcbntcbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9vbkRlc3Ryb3kgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBEaWZmZXIgdXNlZCB0byBmaW5kIHRoZSBjaGFuZ2VzIGluIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8VD47XG5cbiAgLyoqIFN0b3JlcyB0aGUgbm9kZSBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Tm9kZURlZjogQ2RrVHJlZU5vZGVEZWY8VD4gfCBudWxsO1xuXG4gIC8qKiBEYXRhIHN1YnNjcmlwdGlvbiAqL1xuICBwcml2YXRlIF9kYXRhU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsO1xuXG4gIC8qKiBMZXZlbCBvZiBub2RlcyAqL1xuICBwcml2YXRlIF9sZXZlbHM6IE1hcDxLLCBudW1iZXI+ID0gbmV3IE1hcDxLLCBudW1iZXI+KCk7XG5cbiAgLyoqIFRoZSBpbW1lZGlhdGUgcGFyZW50cyBmb3IgYSBub2RlLiBUaGlzIGlzIGBudWxsYCBpZiB0aGVyZSBpcyBubyBwYXJlbnQuICovXG4gIHByaXZhdGUgX3BhcmVudHM6IE1hcDxLLCBUIHwgbnVsbD4gPSBuZXcgTWFwPEssIFQgfCBudWxsPigpO1xuXG4gIC8qKlxuICAgKiBOb2RlcyBncm91cGVkIGludG8gZWFjaCBzZXQsIHdoaWNoIGlzIGEgbGlzdCBvZiBub2RlcyBkaXNwbGF5ZWQgdG9nZXRoZXIgaW4gdGhlIERPTS5cbiAgICpcbiAgICogTG9va3VwIGtleSBpcyB0aGUgcGFyZW50IG9mIGEgc2V0LiBSb290IG5vZGVzIGhhdmUga2V5IG9mIG51bGwuXG4gICAqXG4gICAqIFZhbHVlcyBpcyBhICdzZXQnIG9mIHRyZWUgbm9kZXMuIEVhY2ggdHJlZSBub2RlIG1hcHMgdG8gYSB0cmVlaXRlbSBlbGVtZW50LiBTZXRzIGFyZSBpbiB0aGVcbiAgICogb3JkZXIgdGhhdCBpdCBpcyByZW5kZXJlZC4gRWFjaCBzZXQgbWFwcyBkaXJlY3RseSB0byBhcmlhLXBvc2luc2V0IGFuZCBhcmlhLXNldHNpemUgYXR0cmlidXRlcy5cbiAgICovXG4gIHByaXZhdGUgX2FyaWFTZXRzOiBNYXA8SyB8IG51bGwsIFRbXT4gPSBuZXcgTWFwPEsgfCBudWxsLCBUW10+KCk7XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGEgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBkYXRhIGFycmF5IHRvIHJlbmRlci4gSW5mbHVlbmNlZCBieSB0aGUgdHJlZSdzXG4gICAqIHN0cmVhbSBvZiB2aWV3IHdpbmRvdyAod2hhdCBkYXRhTm9kZXMgYXJlIGN1cnJlbnRseSBvbiBzY3JlZW4pLlxuICAgKiBEYXRhIHNvdXJjZSBjYW4gYmUgYW4gb2JzZXJ2YWJsZSBvZiBkYXRhIGFycmF5LCBvciBhIGRhdGEgYXJyYXkgdG8gcmVuZGVyLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRhdGFTb3VyY2UoKTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFTb3VyY2U7XG4gIH1cbiAgc2V0IGRhdGFTb3VyY2UoZGF0YVNvdXJjZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSkge1xuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICE9PSBkYXRhU291cmNlKSB7XG4gICAgICB0aGlzLl9zd2l0Y2hEYXRhU291cmNlKGRhdGFTb3VyY2UpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kYXRhU291cmNlOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgVFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgdHJlZSBjb250cm9sbGVyXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBvbmUgb2YgYGxldmVsQWNjZXNzb3JgIG9yIGBjaGlsZHJlbkFjY2Vzc29yYCBpbnN0ZWFkLiBUbyBiZSByZW1vdmVkIGluIGFcbiAgICogZnV0dXJlIHZlcnNpb24uXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMjEuMC4wXG4gICAqL1xuICBASW5wdXQoKSB0cmVlQ29udHJvbD86IFRyZWVDb250cm9sPFQsIEs+O1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGRhdGEgbm9kZSwgZGV0ZXJtaW5lcyB3aGF0IHRyZWUgbGV2ZWwgdGhlIG5vZGUgaXMgYXQuXG4gICAqXG4gICAqIE9uZSBvZiBsZXZlbEFjY2Vzc29yIG9yIGNoaWxkcmVuQWNjZXNzb3IgbXVzdCBiZSBzcGVjaWZpZWQsIG5vdCBib3RoLlxuICAgKiBUaGlzIGlzIGVuZm9yY2VkIGF0IHJ1bi10aW1lLlxuICAgKi9cbiAgQElucHV0KCkgbGV2ZWxBY2Nlc3Nvcj86IChkYXRhTm9kZTogVCkgPT4gbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGRhdGEgbm9kZSwgZGV0ZXJtaW5lcyB3aGF0IHRoZSBjaGlsZHJlbiBvZiB0aGF0IG5vZGUgYXJlLlxuICAgKlxuICAgKiBPbmUgb2YgbGV2ZWxBY2Nlc3NvciBvciBjaGlsZHJlbkFjY2Vzc29yIG11c3QgYmUgc3BlY2lmaWVkLCBub3QgYm90aC5cbiAgICogVGhpcyBpcyBlbmZvcmNlZCBhdCBydW4tdGltZS5cbiAgICovXG4gIEBJbnB1dCgpIGNoaWxkcmVuQWNjZXNzb3I/OiAoZGF0YU5vZGU6IFQpID0+IFRbXSB8IE9ic2VydmFibGU8VFtdPjtcblxuICAvKipcbiAgICogVHJhY2tpbmcgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gY2hlY2sgdGhlIGRpZmZlcmVuY2VzIGluIGRhdGEgY2hhbmdlcy4gVXNlZCBzaW1pbGFybHlcbiAgICogdG8gYG5nRm9yYCBgdHJhY2tCeWAgZnVuY3Rpb24uIE9wdGltaXplIG5vZGUgb3BlcmF0aW9ucyBieSBpZGVudGlmeWluZyBhIG5vZGUgYmFzZWQgb24gaXRzIGRhdGFcbiAgICogcmVsYXRpdmUgdG8gdGhlIGZ1bmN0aW9uIHRvIGtub3cgaWYgYSBub2RlIHNob3VsZCBiZSBhZGRlZC9yZW1vdmVkL21vdmVkLlxuICAgKiBBY2NlcHRzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gcGFyYW1ldGVycywgYGluZGV4YCBhbmQgYGl0ZW1gLlxuICAgKi9cbiAgQElucHV0KCkgdHJhY2tCeTogVHJhY2tCeUZ1bmN0aW9uPFQ+O1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIGRhdGEgbm9kZSwgZGV0ZXJtaW5lcyB0aGUga2V5IGJ5IHdoaWNoIHdlIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgZXhwYW5kZWQuXG4gICAqL1xuICBASW5wdXQoKSBleHBhbnNpb25LZXk/OiAoZGF0YU5vZGU6IFQpID0+IEs7XG5cbiAgLy8gT3V0bGV0cyB3aXRoaW4gdGhlIHRyZWUncyB0ZW1wbGF0ZSB3aGVyZSB0aGUgZGF0YU5vZGVzIHdpbGwgYmUgaW5zZXJ0ZWQuXG4gIEBWaWV3Q2hpbGQoQ2RrVHJlZU5vZGVPdXRsZXQsIHtzdGF0aWM6IHRydWV9KSBfbm9kZU91dGxldDogQ2RrVHJlZU5vZGVPdXRsZXQ7XG5cbiAgLyoqIFRoZSB0cmVlIG5vZGUgdGVtcGxhdGUgZm9yIHRoZSB0cmVlICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrVHJlZU5vZGVEZWYsIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBgZGVzY2VuZGFudHM6IHRydWVgLCBiZWNhdXNlIEl2eSB3aWxsIG5vIGxvbmdlciBtYXRjaFxuICAgIC8vIGluZGlyZWN0IGRlc2NlbmRhbnRzIGlmIGl0J3MgbGVmdCBhcyBmYWxzZS5cbiAgICBkZXNjZW5kYW50czogdHJ1ZSxcbiAgfSlcbiAgX25vZGVEZWZzOiBRdWVyeUxpc3Q8Q2RrVHJlZU5vZGVEZWY8VD4+O1xuXG4gIC8vIFRPRE8odGluYXl1YW5nYW8pOiBTZXR1cCBhIGxpc3RlbmVyIGZvciBzY3JvbGxpbmcsIGVtaXQgdGhlIGNhbGN1bGF0ZWQgdmlldyB0byB2aWV3Q2hhbmdlLlxuICAvLyAgICAgUmVtb3ZlIHRoZSBNQVhfVkFMVUUgaW4gdmlld0NoYW5nZVxuICAvKipcbiAgICogU3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBpbmZvcm1hdGlvbiBvbiB3aGF0IHJvd3MgYXJlIGJlaW5nIGRpc3BsYXllZCBvbiBzY3JlZW4uXG4gICAqIENhbiBiZSB1c2VkIGJ5IHRoZSBkYXRhIHNvdXJjZSB0byBhcyBhIGhldXJpc3RpYyBvZiB3aGF0IGRhdGEgc2hvdWxkIGJlIHByb3ZpZGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgdmlld0NoYW5nZSA9IG5ldyBCZWhhdmlvclN1YmplY3Q8e3N0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyfT4oe1xuICAgIHN0YXJ0OiAwLFxuICAgIGVuZDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgfSk7XG5cbiAgLyoqIEtlZXAgdHJhY2sgb2Ygd2hpY2ggbm9kZXMgYXJlIGV4cGFuZGVkLiAqL1xuICBwcml2YXRlIF9leHBhbnNpb25Nb2RlbD86IFNlbGVjdGlvbk1vZGVsPEs+O1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIHN5bmNocm9ub3VzIGNhY2hlIG9mIGZsYXR0ZW5lZCBkYXRhIG5vZGVzLiBUaGlzIHdpbGwgb25seSBiZVxuICAgKiBwb3B1bGF0ZWQgYWZ0ZXIgaW5pdGlhbCByZW5kZXIsIGFuZCBpbiBjZXJ0YWluIGNhc2VzLCB3aWxsIGJlIGRlbGF5ZWQgZHVlIHRvXG4gICAqIHJlbHlpbmcgb24gT2JzZXJ2YWJsZSBgZ2V0Q2hpbGRyZW5gIGNhbGxzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZmxhdHRlbmVkTm9kZXM6IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+KFtdKTtcblxuICAvKiogVGhlIGF1dG9tYXRpY2FsbHkgZGV0ZXJtaW5lZCBub2RlIHR5cGUgZm9yIHRoZSB0cmVlLiAqL1xuICBwcml2YXRlIF9ub2RlVHlwZTogQmVoYXZpb3JTdWJqZWN0PCdmbGF0JyB8ICduZXN0ZWQnIHwgbnVsbD4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0PFxuICAgICdmbGF0JyB8ICduZXN0ZWQnIHwgbnVsbFxuICA+KG51bGwpO1xuXG4gIC8qKiBUaGUgbWFwcGluZyBiZXR3ZWVuIGRhdGEgYW5kIHRoZSBub2RlIHRoYXQgaXMgcmVuZGVyZWQuICovXG4gIHByaXZhdGUgX25vZGVzOiBCZWhhdmlvclN1YmplY3Q8TWFwPEssIENka1RyZWVOb2RlPFQsIEs+Pj4gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KFxuICAgIG5ldyBNYXA8SywgQ2RrVHJlZU5vZGU8VCwgSz4+KCksXG4gICk7XG5cbiAgLyoqXG4gICAqIFN5bmNocm9ub3VzIGNhY2hlIG9mIG5vZGVzIGZvciB0aGUgYFRyZWVLZXlNYW5hZ2VyYC4gVGhpcyBpcyBzZXBhcmF0ZVxuICAgKiBmcm9tIGBfZmxhdHRlbmVkTm9kZXNgIHNvIHRoZXkgY2FuIGJlIGluZGVwZW5kZW50bHkgdXBkYXRlZCBhdCBkaWZmZXJlbnRcbiAgICogdGltZXMuXG4gICAqL1xuICBwcml2YXRlIF9rZXlNYW5hZ2VyTm9kZXM6IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxyZWFkb25seSBUW10+KFtdKTtcblxuICBwcml2YXRlIF9rZXlNYW5hZ2VyRmFjdG9yeSA9IGluamVjdChUUkVFX0tFWV9NQU5BR0VSKSBhcyBUcmVlS2V5TWFuYWdlckZhY3Rvcnk8Q2RrVHJlZU5vZGU8VCwgSz4+O1xuXG4gIC8qKiBUaGUga2V5IG1hbmFnZXIgZm9yIHRoaXMgdHJlZS4gSGFuZGxlcyBmb2N1cyBhbmQgYWN0aXZhdGlvbiBiYXNlZCBvbiB1c2VyIGtleWJvYXJkIGlucHV0LiAqL1xuICBfa2V5TWFuYWdlcjogVHJlZUtleU1hbmFnZXJTdHJhdGVneTxDZGtUcmVlTm9kZTxULCBLPj47XG4gIHByaXZhdGUgX3ZpZXdJbml0ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZGlmZmVyczogSXRlcmFibGVEaWZmZXJzLFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LFxuICApIHt9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHRoaXMuX2luaXRpYWxpemVLZXlNYW5hZ2VyKCk7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKSB7XG4gICAgdGhpcy5fdXBkYXRlRGVmYXVsdE5vZGVEZWZpbml0aW9uKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9EYXRhQ2hhbmdlcygpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG5cbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kubmV4dCgpO1xuICAgIHRoaXMuX29uRGVzdHJveS5jb21wbGV0ZSgpO1xuXG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgJiYgdHlwZW9mICh0aGlzLl9kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICh0aGlzLmRhdGFTb3VyY2UgYXMgRGF0YVNvdXJjZTxUPikuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gSW4gY2VydGFpbiB0ZXN0cywgdGhlIHRyZWUgbWlnaHQgYmUgZGVzdHJveWVkIGJlZm9yZSB0aGlzIGlzIGluaXRpYWxpemVkXG4gICAgLy8gaW4gYG5nQWZ0ZXJDb250ZW50SW5pdGAuXG4gICAgdGhpcy5fa2V5TWFuYWdlcj8uZGVzdHJveSgpO1xuICB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5fY2hlY2tUcmVlQ29udHJvbFVzYWdlKCk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZURhdGFEaWZmZXIoKTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICB0aGlzLl92aWV3SW5pdCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVEZWZhdWx0Tm9kZURlZmluaXRpb24oKSB7XG4gICAgY29uc3QgZGVmYXVsdE5vZGVEZWZzID0gdGhpcy5fbm9kZURlZnMuZmlsdGVyKGRlZiA9PiAhZGVmLndoZW4pO1xuICAgIGlmIChkZWZhdWx0Tm9kZURlZnMubGVuZ3RoID4gMSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VHJlZU11bHRpcGxlRGVmYXVsdE5vZGVEZWZzRXJyb3IoKTtcbiAgICB9XG4gICAgdGhpcy5fZGVmYXVsdE5vZGVEZWYgPSBkZWZhdWx0Tm9kZURlZnNbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbm9kZSB0eXBlIGZvciB0aGUgdHJlZSwgaWYgaXQgaGFzbid0IGJlZW4gc2V0IHlldC5cbiAgICpcbiAgICogVGhpcyB3aWxsIGJlIGNhbGxlZCBieSB0aGUgZmlyc3Qgbm9kZSB0aGF0J3MgcmVuZGVyZWQgaW4gb3JkZXIgZm9yIHRoZSB0cmVlXG4gICAqIHRvIGRldGVybWluZSB3aGF0IGRhdGEgdHJhbnNmb3JtYXRpb25zIGFyZSByZXF1aXJlZC5cbiAgICovXG4gIF9zZXROb2RlVHlwZUlmVW5zZXQobm9kZVR5cGU6ICdmbGF0JyB8ICduZXN0ZWQnKSB7XG4gICAgaWYgKHRoaXMuX25vZGVUeXBlLnZhbHVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9ub2RlVHlwZS5uZXh0KG5vZGVUeXBlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3dpdGNoIHRvIHRoZSBwcm92aWRlZCBkYXRhIHNvdXJjZSBieSByZXNldHRpbmcgdGhlIGRhdGEgYW5kIHVuc3Vic2NyaWJpbmcgZnJvbSB0aGUgY3VycmVudFxuICAgKiByZW5kZXIgY2hhbmdlIHN1YnNjcmlwdGlvbiBpZiBvbmUgZXhpc3RzLiBJZiB0aGUgZGF0YSBzb3VyY2UgaXMgbnVsbCwgaW50ZXJwcmV0IHRoaXMgYnlcbiAgICogY2xlYXJpbmcgdGhlIG5vZGUgb3V0bGV0LiBPdGhlcndpc2Ugc3RhcnQgbGlzdGVuaW5nIGZvciBuZXcgZGF0YS5cbiAgICovXG4gIHByaXZhdGUgX3N3aXRjaERhdGFTb3VyY2UoZGF0YVNvdXJjZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSkge1xuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICYmIHR5cGVvZiAodGhpcy5fZGF0YVNvdXJjZSBhcyBEYXRhU291cmNlPFQ+KS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAodGhpcy5kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RhdGFTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSB0aGUgYWxsIGRhdGFOb2RlcyBpZiB0aGVyZSBpcyBub3cgbm8gZGF0YSBzb3VyY2VcbiAgICBpZiAoIWRhdGFTb3VyY2UpIHtcbiAgICAgIHRoaXMuX25vZGVPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgIGlmICh0aGlzLl9ub2RlRGVmcykge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlVG9EYXRhQ2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRFeHBhbnNpb25Nb2RlbCgpIHtcbiAgICBpZiAoIXRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsID8/PSBuZXcgU2VsZWN0aW9uTW9kZWw8Sz4odHJ1ZSk7XG4gICAgICByZXR1cm4gdGhpcy5fZXhwYW5zaW9uTW9kZWw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnRyZWVDb250cm9sLmV4cGFuc2lvbk1vZGVsO1xuICB9XG5cbiAgLyoqIFNldCB1cCBhIHN1YnNjcmlwdGlvbiBmb3IgdGhlIGRhdGEgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLiAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb0RhdGFDaGFuZ2VzKCkge1xuICAgIGlmICh0aGlzLl9kYXRhU3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPiB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLl9kYXRhU291cmNlLmNvbm5lY3QodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLl9kYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLl9kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IG9ic2VydmFibGVPZih0aGlzLl9kYXRhU291cmNlKTtcbiAgICB9XG5cbiAgICBpZiAoIWRhdGFTdHJlYW0pIHtcbiAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3cgZ2V0VHJlZU5vVmFsaWREYXRhU291cmNlRXJyb3IoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhU3Vic2NyaXB0aW9uID0gdGhpcy5fZ2V0UmVuZGVyRGF0YShkYXRhU3RyZWFtKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAuc3Vic2NyaWJlKHJlbmRlcmluZ0RhdGEgPT4ge1xuICAgICAgICB0aGlzLl9yZW5kZXJEYXRhQ2hhbmdlcyhyZW5kZXJpbmdEYXRhKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqIEdpdmVuIGFuIE9ic2VydmFibGUgY29udGFpbmluZyBhIHN0cmVhbSBvZiB0aGUgcmF3IGRhdGEsIHJldHVybnMgYW4gT2JzZXJ2YWJsZSBjb250YWluaW5nIHRoZSBSZW5kZXJpbmdEYXRhICovXG4gIHByaXZhdGUgX2dldFJlbmRlckRhdGEoZGF0YVN0cmVhbTogT2JzZXJ2YWJsZTxyZWFkb25seSBUW10+KTogT2JzZXJ2YWJsZTxSZW5kZXJpbmdEYXRhPFQ+PiB7XG4gICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9nZXRFeHBhbnNpb25Nb2RlbCgpO1xuICAgIHJldHVybiBjb21iaW5lTGF0ZXN0KFtcbiAgICAgIGRhdGFTdHJlYW0sXG4gICAgICB0aGlzLl9ub2RlVHlwZSxcbiAgICAgIC8vIFdlIGRvbid0IHVzZSB0aGUgZXhwYW5zaW9uIGRhdGEgZGlyZWN0bHksIGhvd2V2ZXIgd2UgYWRkIGl0IGhlcmUgdG8gZXNzZW50aWFsbHlcbiAgICAgIC8vIHRyaWdnZXIgZGF0YSByZW5kZXJpbmcgd2hlbiBleHBhbnNpb24gY2hhbmdlcyBvY2N1ci5cbiAgICAgIGV4cGFuc2lvbk1vZGVsLmNoYW5nZWQucGlwZShcbiAgICAgICAgc3RhcnRXaXRoKG51bGwpLFxuICAgICAgICB0YXAoZXhwYW5zaW9uQ2hhbmdlcyA9PiB7XG4gICAgICAgICAgdGhpcy5fZW1pdEV4cGFuc2lvbkNoYW5nZXMoZXhwYW5zaW9uQ2hhbmdlcyk7XG4gICAgICAgIH0pLFxuICAgICAgKSxcbiAgICBdKS5waXBlKFxuICAgICAgc3dpdGNoTWFwKChbZGF0YSwgbm9kZVR5cGVdKSA9PiB7XG4gICAgICAgIGlmIChub2RlVHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Yoe3JlbmRlck5vZGVzOiBkYXRhLCBmbGF0dGVuZWROb2RlczogbnVsbCwgbm9kZVR5cGV9IGFzIGNvbnN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlJ3JlIGhlcmUsIHRoZW4gd2Uga25vdyB3aGF0IG91ciBub2RlIHR5cGUgaXMsIGFuZCB0aGVyZWZvcmUgY2FuXG4gICAgICAgIC8vIHBlcmZvcm0gb3VyIHVzdWFsIHJlbmRlcmluZyBwaXBlbGluZSwgd2hpY2ggbmVjZXNzaXRhdGVzIGNvbnZlcnRpbmcgdGhlIGRhdGFcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbXB1dGVSZW5kZXJpbmdEYXRhKGRhdGEsIG5vZGVUeXBlKS5waXBlKFxuICAgICAgICAgIG1hcChjb252ZXJ0ZWREYXRhID0+ICh7Li4uY29udmVydGVkRGF0YSwgbm9kZVR5cGV9KSBhcyBjb25zdCksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVuZGVyRGF0YUNoYW5nZXMoZGF0YTogUmVuZGVyaW5nRGF0YTxUPikge1xuICAgIGlmIChkYXRhLm5vZGVUeXBlID09PSBudWxsKSB7XG4gICAgICB0aGlzLnJlbmRlck5vZGVDaGFuZ2VzKGRhdGEucmVuZGVyTm9kZXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHdlJ3JlIGhlcmUsIHRoZW4gd2Uga25vdyB3aGF0IG91ciBub2RlIHR5cGUgaXMsIGFuZCB0aGVyZWZvcmUgY2FuXG4gICAgLy8gcGVyZm9ybSBvdXIgdXN1YWwgcmVuZGVyaW5nIHBpcGVsaW5lLlxuICAgIHRoaXMuX3VwZGF0ZUNhY2hlZERhdGEoZGF0YS5mbGF0dGVuZWROb2Rlcyk7XG4gICAgdGhpcy5yZW5kZXJOb2RlQ2hhbmdlcyhkYXRhLnJlbmRlck5vZGVzKTtcbiAgICB0aGlzLl91cGRhdGVLZXlNYW5hZ2VySXRlbXMoZGF0YS5mbGF0dGVuZWROb2Rlcyk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0RXhwYW5zaW9uQ2hhbmdlcyhleHBhbnNpb25DaGFuZ2VzOiBTZWxlY3Rpb25DaGFuZ2U8Sz4gfCBudWxsKSB7XG4gICAgaWYgKCFleHBhbnNpb25DaGFuZ2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgbm9kZXMgPSB0aGlzLl9ub2Rlcy52YWx1ZTtcbiAgICBmb3IgKGNvbnN0IGFkZGVkIG9mIGV4cGFuc2lvbkNoYW5nZXMuYWRkZWQpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5nZXQoYWRkZWQpO1xuICAgICAgbm9kZT8uX2VtaXRFeHBhbnNpb25TdGF0ZSh0cnVlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCByZW1vdmVkIG9mIGV4cGFuc2lvbkNoYW5nZXMucmVtb3ZlZCkge1xuICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmdldChyZW1vdmVkKTtcbiAgICAgIG5vZGU/Ll9lbWl0RXhwYW5zaW9uU3RhdGUoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2luaXRpYWxpemVLZXlNYW5hZ2VyKCkge1xuICAgIGNvbnN0IGl0ZW1zID0gY29tYmluZUxhdGVzdChbdGhpcy5fa2V5TWFuYWdlck5vZGVzLCB0aGlzLl9ub2Rlc10pLnBpcGUoXG4gICAgICBtYXAoKFtrZXlNYW5hZ2VyTm9kZXMsIHJlbmRlck5vZGVzXSkgPT5cbiAgICAgICAga2V5TWFuYWdlck5vZGVzLnJlZHVjZTxDZGtUcmVlTm9kZTxULCBLPltdPigoaXRlbXMsIGRhdGEpID0+IHtcbiAgICAgICAgICBjb25zdCBub2RlID0gcmVuZGVyTm9kZXMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhKSk7XG4gICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIGl0ZW1zLnB1c2gobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpdGVtcztcbiAgICAgICAgfSwgW10pLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgY29uc3Qga2V5TWFuYWdlck9wdGlvbnM6IFRyZWVLZXlNYW5hZ2VyT3B0aW9uczxDZGtUcmVlTm9kZTxULCBLPj4gPSB7XG4gICAgICB0cmFja0J5OiBub2RlID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlLmRhdGEpLFxuICAgICAgc2tpcFByZWRpY2F0ZTogbm9kZSA9PiAhIW5vZGUuaXNEaXNhYmxlZCxcbiAgICAgIHR5cGVBaGVhZERlYm91bmNlSW50ZXJ2YWw6IHRydWUsXG4gICAgICBob3Jpem9udGFsT3JpZW50YXRpb246IHRoaXMuX2Rpci52YWx1ZSxcbiAgICB9O1xuXG4gICAgdGhpcy5fa2V5TWFuYWdlciA9IHRoaXMuX2tleU1hbmFnZXJGYWN0b3J5KGl0ZW1zLCBrZXlNYW5hZ2VyT3B0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIF9pbml0aWFsaXplRGF0YURpZmZlcigpIHtcbiAgICAvLyBQcm92aWRlIGEgZGVmYXVsdCB0cmFja0J5IGJhc2VkIG9uIGBfZ2V0RXhwYW5zaW9uS2V5YCBpZiBvbmUgaXNuJ3QgcHJvdmlkZWQuXG4gICAgY29uc3QgdHJhY2tCeSA9IHRoaXMudHJhY2tCeSA/PyAoKF9pbmRleDogbnVtYmVyLCBpdGVtOiBUKSA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoaXRlbSkpO1xuICAgIHRoaXMuX2RhdGFEaWZmZXIgPSB0aGlzLl9kaWZmZXJzLmZpbmQoW10pLmNyZWF0ZSh0cmFja0J5KTtcbiAgfVxuXG4gIHByaXZhdGUgX2NoZWNrVHJlZUNvbnRyb2xVc2FnZSgpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCBUcmVlIGZvbGxvd3MgQVBJIGNvbnRyYWN0IG9mIHVzaW5nIG9uZSBvZiBUcmVlQ29udHJvbCwgbGV2ZWxBY2Nlc3NvciBvclxuICAgICAgLy8gY2hpbGRyZW5BY2Nlc3Nvci4gVGhyb3cgYW4gYXBwcm9wcmlhdGUgZXJyb3IgaWYgY29udHJhY3QgaXMgbm90IG1ldC5cbiAgICAgIGxldCBudW1UcmVlQ29udHJvbHMgPSAwO1xuXG4gICAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgICBudW1UcmVlQ29udHJvbHMrKztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmxldmVsQWNjZXNzb3IpIHtcbiAgICAgICAgbnVtVHJlZUNvbnRyb2xzKys7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jaGlsZHJlbkFjY2Vzc29yKSB7XG4gICAgICAgIG51bVRyZWVDb250cm9scysrO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW51bVRyZWVDb250cm9scykge1xuICAgICAgICB0aHJvdyBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpO1xuICAgICAgfSBlbHNlIGlmIChudW1UcmVlQ29udHJvbHMgPiAxKSB7XG4gICAgICAgIHRocm93IGdldE11bHRpcGxlVHJlZUNvbnRyb2xzRXJyb3IoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogQ2hlY2sgZm9yIGNoYW5nZXMgbWFkZSBpbiB0aGUgZGF0YSBhbmQgcmVuZGVyIGVhY2ggY2hhbmdlIChub2RlIGFkZGVkL3JlbW92ZWQvbW92ZWQpLiAqL1xuICByZW5kZXJOb2RlQ2hhbmdlcyhcbiAgICBkYXRhOiByZWFkb25seSBUW10sXG4gICAgZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gPSB0aGlzLl9kYXRhRGlmZmVyLFxuICAgIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYgPSB0aGlzLl9ub2RlT3V0bGV0LnZpZXdDb250YWluZXIsXG4gICAgcGFyZW50RGF0YT86IFQsXG4gICkge1xuICAgIGNvbnN0IGNoYW5nZXMgPSBkYXRhRGlmZmVyLmRpZmYoZGF0YSk7XG5cbiAgICAvLyBTb21lIHRyZWUgY29uc3VtZXJzIGV4cGVjdCBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHByb3BhZ2F0ZSB0byBub2Rlc1xuICAgIC8vIGV2ZW4gd2hlbiB0aGUgYXJyYXkgaXRzZWxmIGhhc24ndCBjaGFuZ2VkOyB3ZSBleHBsaWNpdGx5IGRldGVjdCBjaGFuZ2VzXG4gICAgLy8gYW55d2F5cyBpbiBvcmRlciBmb3Igbm9kZXMgdG8gdXBkYXRlIHRoZWlyIGRhdGEuXG4gICAgLy9cbiAgICAvLyBIb3dldmVyLCBpZiBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGNhbGxlZCB3aGlsZSB0aGUgY29tcG9uZW50J3MgdmlldyBpc1xuICAgIC8vIHN0aWxsIGluaXRpbmcsIHRoZW4gdGhlIG9yZGVyIG9mIGNoaWxkIHZpZXdzIGluaXRpbmcgd2lsbCBiZSBpbmNvcnJlY3Q7XG4gICAgLy8gdG8gcHJldmVudCB0aGlzLCB3ZSBvbmx5IGV4aXQgZWFybHkgaWYgdGhlIHZpZXcgaGFzbid0IGluaXRpYWxpemVkIHlldC5cbiAgICBpZiAoIWNoYW5nZXMgJiYgIXRoaXMuX3ZpZXdJbml0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2hhbmdlcz8uZm9yRWFjaE9wZXJhdGlvbihcbiAgICAgIChcbiAgICAgICAgaXRlbTogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8VD4sXG4gICAgICAgIGFkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgY3VycmVudEluZGV4OiBudW1iZXIgfCBudWxsLFxuICAgICAgKSA9PiB7XG4gICAgICAgIGlmIChpdGVtLnByZXZpb3VzSW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuaW5zZXJ0Tm9kZShkYXRhW2N1cnJlbnRJbmRleCFdLCBjdXJyZW50SW5kZXghLCB2aWV3Q29udGFpbmVyLCBwYXJlbnREYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50SW5kZXggPT0gbnVsbCkge1xuICAgICAgICAgIHZpZXdDb250YWluZXIucmVtb3ZlKGFkanVzdGVkUHJldmlvdXNJbmRleCEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHZpZXcgPSB2aWV3Q29udGFpbmVyLmdldChhZGp1c3RlZFByZXZpb3VzSW5kZXghKTtcbiAgICAgICAgICB2aWV3Q29udGFpbmVyLm1vdmUodmlldyEsIGN1cnJlbnRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIElmIHRoZSBkYXRhIGl0c2VsZiBjaGFuZ2VzLCBidXQga2VlcHMgdGhlIHNhbWUgdHJhY2tCeSwgd2UgbmVlZCB0byB1cGRhdGUgdGhlIHRlbXBsYXRlcydcbiAgICAvLyBjb250ZXh0IHRvIHJlZmxlY3QgdGhlIG5ldyBvYmplY3QuXG4gICAgY2hhbmdlcz8uZm9yRWFjaElkZW50aXR5Q2hhbmdlKChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+KSA9PiB7XG4gICAgICBjb25zdCBuZXdEYXRhID0gcmVjb3JkLml0ZW07XG4gICAgICBpZiAocmVjb3JkLmN1cnJlbnRJbmRleCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgdmlldyA9IHZpZXdDb250YWluZXIuZ2V0KHJlY29yZC5jdXJyZW50SW5kZXgpO1xuICAgICAgICAodmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PikuY29udGV4dC4kaW1wbGljaXQgPSBuZXdEYXRhO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY2hhbmdlIHRvIGB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKWAsIG9yIGp1c3Qgc3dpdGNoIHRoaXMgY29tcG9uZW50IHRvXG4gICAgLy8gdXNlIHNpZ25hbHMuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBtYXRjaGluZyBub2RlIGRlZmluaXRpb24gdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgdGhpcyBub2RlIGRhdGEuIElmIHRoZXJlIGlzIG9ubHlcbiAgICogb25lIG5vZGUgZGVmaW5pdGlvbiwgaXQgaXMgcmV0dXJuZWQuIE90aGVyd2lzZSwgZmluZCB0aGUgbm9kZSBkZWZpbml0aW9uIHRoYXQgaGFzIGEgd2hlblxuICAgKiBwcmVkaWNhdGUgdGhhdCByZXR1cm5zIHRydWUgd2l0aCB0aGUgZGF0YS4gSWYgbm9uZSByZXR1cm4gdHJ1ZSwgcmV0dXJuIHRoZSBkZWZhdWx0IG5vZGVcbiAgICogZGVmaW5pdGlvbi5cbiAgICovXG4gIF9nZXROb2RlRGVmKGRhdGE6IFQsIGk6IG51bWJlcik6IENka1RyZWVOb2RlRGVmPFQ+IHtcbiAgICBpZiAodGhpcy5fbm9kZURlZnMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbm9kZURlZnMuZmlyc3QhO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVEZWYgPVxuICAgICAgdGhpcy5fbm9kZURlZnMuZmluZChkZWYgPT4gZGVmLndoZW4gJiYgZGVmLndoZW4oaSwgZGF0YSkpIHx8IHRoaXMuX2RlZmF1bHROb2RlRGVmO1xuXG4gICAgaWYgKCFub2RlRGVmICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvdyBnZXRUcmVlTWlzc2luZ01hdGNoaW5nTm9kZURlZkVycm9yKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGVEZWYhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSB0aGUgZW1iZWRkZWQgdmlldyBmb3IgdGhlIGRhdGEgbm9kZSB0ZW1wbGF0ZSBhbmQgcGxhY2UgaXQgaW4gdGhlIGNvcnJlY3QgaW5kZXggbG9jYXRpb25cbiAgICogd2l0aGluIHRoZSBkYXRhIG5vZGUgdmlldyBjb250YWluZXIuXG4gICAqL1xuICBpbnNlcnROb2RlKG5vZGVEYXRhOiBULCBpbmRleDogbnVtYmVyLCB2aWV3Q29udGFpbmVyPzogVmlld0NvbnRhaW5lclJlZiwgcGFyZW50RGF0YT86IFQpIHtcbiAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5fZ2V0TGV2ZWxBY2Nlc3NvcigpO1xuXG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX2dldE5vZGVEZWYobm9kZURhdGEsIGluZGV4KTtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZURhdGEpO1xuXG4gICAgLy8gTm9kZSBjb250ZXh0IHRoYXQgd2lsbCBiZSBwcm92aWRlZCB0byBjcmVhdGVkIGVtYmVkZGVkIHZpZXdcbiAgICBjb25zdCBjb250ZXh0ID0gbmV3IENka1RyZWVOb2RlT3V0bGV0Q29udGV4dDxUPihub2RlRGF0YSk7XG5cbiAgICBwYXJlbnREYXRhID8/PSB0aGlzLl9wYXJlbnRzLmdldChrZXkpID8/IHVuZGVmaW5lZDtcbiAgICAvLyBJZiB0aGUgdHJlZSBpcyBmbGF0IHRyZWUsIHRoZW4gdXNlIHRoZSBgZ2V0TGV2ZWxgIGZ1bmN0aW9uIGluIGZsYXQgdHJlZSBjb250cm9sXG4gICAgLy8gT3RoZXJ3aXNlLCB1c2UgdGhlIGxldmVsIG9mIHBhcmVudCBub2RlLlxuICAgIGlmIChsZXZlbEFjY2Vzc29yKSB7XG4gICAgICBjb250ZXh0LmxldmVsID0gbGV2ZWxBY2Nlc3Nvcihub2RlRGF0YSk7XG4gICAgfSBlbHNlIGlmIChwYXJlbnREYXRhICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fbGV2ZWxzLmhhcyh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50RGF0YSkpKSB7XG4gICAgICBjb250ZXh0LmxldmVsID0gdGhpcy5fbGV2ZWxzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50RGF0YSkpISArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQubGV2ZWwgPSAwO1xuICAgIH1cbiAgICB0aGlzLl9sZXZlbHMuc2V0KGtleSwgY29udGV4dC5sZXZlbCk7XG5cbiAgICAvLyBVc2UgZGVmYXVsdCB0cmVlIG5vZGVPdXRsZXQsIG9yIG5lc3RlZCBub2RlJ3Mgbm9kZU91dGxldFxuICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdDb250YWluZXIgPyB2aWV3Q29udGFpbmVyIDogdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyO1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcobm9kZS50ZW1wbGF0ZSwgY29udGV4dCwgaW5kZXgpO1xuXG4gICAgLy8gU2V0IHRoZSBkYXRhIHRvIGp1c3QgY3JlYXRlZCBgQ2RrVHJlZU5vZGVgLlxuICAgIC8vIFRoZSBgQ2RrVHJlZU5vZGVgIGNyZWF0ZWQgZnJvbSBgY3JlYXRlRW1iZWRkZWRWaWV3YCB3aWxsIGJlIHNhdmVkIGluIHN0YXRpYyB2YXJpYWJsZVxuICAgIC8vICAgICBgbW9zdFJlY2VudFRyZWVOb2RlYC4gV2UgZ2V0IGl0IGZyb20gc3RhdGljIHZhcmlhYmxlIGFuZCBwYXNzIHRoZSBub2RlIGRhdGEgdG8gaXQuXG4gICAgaWYgKENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSkge1xuICAgICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlLmRhdGEgPSBub2RlRGF0YTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZGF0YSBub2RlIGlzIGV4cGFuZGVkIG9yIGNvbGxhcHNlZC4gUmV0dXJucyB0cnVlIGlmIGl0J3MgZXhwYW5kZWQuICovXG4gIGlzRXhwYW5kZWQoZGF0YU5vZGU6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISEoXG4gICAgICB0aGlzLnRyZWVDb250cm9sPy5pc0V4cGFuZGVkKGRhdGFOb2RlKSB8fFxuICAgICAgdGhpcy5fZXhwYW5zaW9uTW9kZWw/LmlzU2VsZWN0ZWQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSlcbiAgICApO1xuICB9XG5cbiAgLyoqIElmIHRoZSBkYXRhIG5vZGUgaXMgY3VycmVudGx5IGV4cGFuZGVkLCBjb2xsYXBzZSBpdC4gT3RoZXJ3aXNlLCBleHBhbmQgaXQuICovXG4gIHRvZ2dsZShkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLnRvZ2dsZShkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgdGhpcy5fZXhwYW5zaW9uTW9kZWwudG9nZ2xlKHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFeHBhbmQgdGhlIGRhdGEgbm9kZS4gSWYgaXQgaXMgYWxyZWFkeSBleHBhbmRlZCwgZG9lcyBub3RoaW5nLiAqL1xuICBleHBhbmQoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5leHBhbmQoZGF0YU5vZGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsLnNlbGVjdCh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ29sbGFwc2UgdGhlIGRhdGEgbm9kZS4gSWYgaXQgaXMgYWxyZWFkeSBjb2xsYXBzZWQsIGRvZXMgbm90aGluZy4gKi9cbiAgY29sbGFwc2UoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5jb2xsYXBzZShkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgdGhpcy5fZXhwYW5zaW9uTW9kZWwuZGVzZWxlY3QodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBkYXRhIG5vZGUgaXMgY3VycmVudGx5IGV4cGFuZGVkLCBjb2xsYXBzZSBpdCBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cy5cbiAgICogT3RoZXJ3aXNlLCBleHBhbmQgaXQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuXG4gICAqL1xuICB0b2dnbGVEZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLnRvZ2dsZURlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKGRhdGFOb2RlKSkge1xuICAgICAgICB0aGlzLmNvbGxhcHNlRGVzY2VuZGFudHMoZGF0YU5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZCB0aGUgZGF0YSBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzLiBJZiB0aGV5IGFyZSBhbHJlYWR5IGV4cGFuZGVkLCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBleHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLmV4cGFuZERlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBleHBhbnNpb25Nb2RlbCA9IHRoaXMuX2V4cGFuc2lvbk1vZGVsO1xuICAgICAgZXhwYW5zaW9uTW9kZWwuc2VsZWN0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgICAgdGhpcy5fZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpXG4gICAgICAgIC5waXBlKHRha2UoMSksIHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgICAuc3Vic2NyaWJlKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICBleHBhbnNpb25Nb2RlbC5zZWxlY3QoLi4uY2hpbGRyZW4ubWFwKGNoaWxkID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbGxhcHNlIHRoZSBkYXRhIG5vZGUgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuIElmIGl0IGlzIGFscmVhZHkgY29sbGFwc2VkLCBkb2VzIG5vdGhpbmcuICovXG4gIGNvbGxhcHNlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5jb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBleHBhbnNpb25Nb2RlbCA9IHRoaXMuX2V4cGFuc2lvbk1vZGVsO1xuICAgICAgZXhwYW5zaW9uTW9kZWwuZGVzZWxlY3QodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSk7XG4gICAgICB0aGlzLl9nZXREZXNjZW5kYW50cyhkYXRhTm9kZSlcbiAgICAgICAgLnBpcGUodGFrZSgxKSwgdGFrZVVudGlsKHRoaXMuX29uRGVzdHJveSkpXG4gICAgICAgIC5zdWJzY3JpYmUoY2hpbGRyZW4gPT4ge1xuICAgICAgICAgIGV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KC4uLmNoaWxkcmVuLm1hcChjaGlsZCA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFeHBhbmRzIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLiAqL1xuICBleHBhbmRBbGwoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuZXhwYW5kQWxsKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLnNlbGVjdChcbiAgICAgICAgLi4udGhpcy5fZmxhdHRlbmVkTm9kZXMudmFsdWUubWFwKGNoaWxkID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ29sbGFwc2UgYWxsIGRhdGEgbm9kZXMgaW4gdGhlIHRyZWUuICovXG4gIGNvbGxhcHNlQWxsKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLmNvbGxhcHNlQWxsKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KFxuICAgICAgICAuLi50aGlzLl9mbGF0dGVuZWROb2Rlcy52YWx1ZS5tYXAoY2hpbGQgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSksXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBMZXZlbCBhY2Nlc3NvciwgdXNlZCBmb3IgY29tcGF0aWJpbGl0eSBiZXR3ZWVuIHRoZSBvbGQgVHJlZSBhbmQgbmV3IFRyZWUgKi9cbiAgX2dldExldmVsQWNjZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJlZUNvbnRyb2w/LmdldExldmVsPy5iaW5kKHRoaXMudHJlZUNvbnRyb2wpID8/IHRoaXMubGV2ZWxBY2Nlc3NvcjtcbiAgfVxuXG4gIC8qKiBDaGlsZHJlbiBhY2Nlc3NvciwgdXNlZCBmb3IgY29tcGF0aWJpbGl0eSBiZXR3ZWVuIHRoZSBvbGQgVHJlZSBhbmQgbmV3IFRyZWUgKi9cbiAgX2dldENoaWxkcmVuQWNjZXNzb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJlZUNvbnRyb2w/LmdldENoaWxkcmVuPy5iaW5kKHRoaXMudHJlZUNvbnRyb2wpID8/IHRoaXMuY2hpbGRyZW5BY2Nlc3NvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaXJlY3QgY2hpbGRyZW4gb2YgYSBub2RlOyB1c2VkIGZvciBjb21wYXRpYmlsaXR5IGJldHdlZW4gdGhlIG9sZCB0cmVlIGFuZCB0aGVcbiAgICogbmV3IHRyZWUuXG4gICAqL1xuICBfZ2V0RGlyZWN0Q2hpbGRyZW4oZGF0YU5vZGU6IFQpOiBPYnNlcnZhYmxlPFRbXT4ge1xuICAgIGNvbnN0IGxldmVsQWNjZXNzb3IgPSB0aGlzLl9nZXRMZXZlbEFjY2Vzc29yKCk7XG4gICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbCA/PyB0aGlzLnRyZWVDb250cm9sPy5leHBhbnNpb25Nb2RlbDtcbiAgICBpZiAoIWV4cGFuc2lvbk1vZGVsKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKFtdKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpO1xuXG4gICAgY29uc3QgaXNFeHBhbmRlZCA9IGV4cGFuc2lvbk1vZGVsLmNoYW5nZWQucGlwZShcbiAgICAgIHN3aXRjaE1hcChjaGFuZ2VzID0+IHtcbiAgICAgICAgaWYgKGNoYW5nZXMuYWRkZWQuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YodHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hhbmdlcy5yZW1vdmVkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRU1QVFk7XG4gICAgICB9KSxcbiAgICAgIHN0YXJ0V2l0aCh0aGlzLmlzRXhwYW5kZWQoZGF0YU5vZGUpKSxcbiAgICApO1xuXG4gICAgaWYgKGxldmVsQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiBjb21iaW5lTGF0ZXN0KFtpc0V4cGFuZGVkLCB0aGlzLl9mbGF0dGVuZWROb2Rlc10pLnBpcGUoXG4gICAgICAgIG1hcCgoW2V4cGFuZGVkLCBmbGF0dGVuZWROb2Rlc10pID0+IHtcbiAgICAgICAgICBpZiAoIWV4cGFuZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQ2hpbGRyZW5CeUxldmVsKFxuICAgICAgICAgICAgbGV2ZWxBY2Nlc3NvcixcbiAgICAgICAgICAgIGZsYXR0ZW5lZE5vZGVzLFxuXG4gICAgICAgICAgICBkYXRhTm9kZSxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZHJlbkFjY2Vzc29yID0gdGhpcy5fZ2V0Q2hpbGRyZW5BY2Nlc3NvcigpO1xuICAgIGlmIChjaGlsZHJlbkFjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gY29lcmNlT2JzZXJ2YWJsZShjaGlsZHJlbkFjY2Vzc29yKGRhdGFOb2RlKSA/PyBbXSk7XG4gICAgfVxuICAgIHRocm93IGdldFRyZWVDb250cm9sTWlzc2luZ0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gdGhlIGxpc3Qgb2YgZmxhdHRlbmVkIG5vZGVzLCB0aGUgbGV2ZWwgYWNjZXNzb3IsIGFuZCB0aGUgbGV2ZWwgcmFuZ2Ugd2l0aGluXG4gICAqIHdoaWNoIHRvIGNvbnNpZGVyIGNoaWxkcmVuLCBmaW5kcyB0aGUgY2hpbGRyZW4gZm9yIGEgZ2l2ZW4gbm9kZS5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGZvciBkaXJlY3QgY2hpbGRyZW4sIGBsZXZlbERlbHRhYCB3b3VsZCBiZSAxLiBGb3IgYWxsIGRlc2NlbmRhbnRzLFxuICAgKiBgbGV2ZWxEZWx0YWAgd291bGQgYmUgSW5maW5pdHkuXG4gICAqL1xuICBwcml2YXRlIF9maW5kQ2hpbGRyZW5CeUxldmVsKFxuICAgIGxldmVsQWNjZXNzb3I6IChub2RlOiBUKSA9PiBudW1iZXIsXG4gICAgZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXSxcbiAgICBkYXRhTm9kZTogVCxcbiAgICBsZXZlbERlbHRhOiBudW1iZXIsXG4gICk6IFRbXSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKTtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gZmxhdHRlbmVkTm9kZXMuZmluZEluZGV4KG5vZGUgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpID09PSBrZXkpO1xuICAgIGNvbnN0IGRhdGFOb2RlTGV2ZWwgPSBsZXZlbEFjY2Vzc29yKGRhdGFOb2RlKTtcbiAgICBjb25zdCBleHBlY3RlZExldmVsID0gZGF0YU5vZGVMZXZlbCArIGxldmVsRGVsdGE7XG4gICAgY29uc3QgcmVzdWx0czogVFtdID0gW107XG5cbiAgICAvLyBHb2VzIHRocm91Z2ggZmxhdHRlbmVkIHRyZWUgbm9kZXMgaW4gdGhlIGBmbGF0dGVuZWROb2Rlc2AgYXJyYXksIGFuZCBnZXQgYWxsXG4gICAgLy8gZGVzY2VuZGFudHMgd2l0aGluIGEgY2VydGFpbiBsZXZlbCByYW5nZS5cbiAgICAvL1xuICAgIC8vIElmIHdlIHJlYWNoIGEgbm9kZSB3aG9zZSBsZXZlbCBpcyBlcXVhbCB0byBvciBsZXNzIHRoYW4gdGhlIGxldmVsIG9mIHRoZSB0cmVlIG5vZGUsXG4gICAgLy8gd2UgaGl0IGEgc2libGluZyBvciBwYXJlbnQncyBzaWJsaW5nLCBhbmQgc2hvdWxkIHN0b3AuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXggKyAxOyBpIDwgZmxhdHRlbmVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGN1cnJlbnRMZXZlbCA9IGxldmVsQWNjZXNzb3IoZmxhdHRlbmVkTm9kZXNbaV0pO1xuICAgICAgaWYgKGN1cnJlbnRMZXZlbCA8PSBkYXRhTm9kZUxldmVsKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnRMZXZlbCA8PSBleHBlY3RlZExldmVsKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChmbGF0dGVuZWROb2Rlc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIHNwZWNpZmllZCBub2RlIGNvbXBvbmVudCB0byB0aGUgdHJlZSdzIGludGVybmFsIHJlZ2lzdHJ5LlxuICAgKlxuICAgKiBUaGlzIHByaW1hcmlseSBmYWNpbGl0YXRlcyBrZXlib2FyZCBuYXZpZ2F0aW9uLlxuICAgKi9cbiAgX3JlZ2lzdGVyTm9kZShub2RlOiBDZGtUcmVlTm9kZTxULCBLPikge1xuICAgIHRoaXMuX25vZGVzLnZhbHVlLnNldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSwgbm9kZSk7XG4gICAgdGhpcy5fbm9kZXMubmV4dCh0aGlzLl9ub2Rlcy52YWx1ZSk7XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgc3BlY2lmaWVkIG5vZGUgY29tcG9uZW50IGZyb20gdGhlIHRyZWUncyBpbnRlcm5hbCByZWdpc3RyeS4gKi9cbiAgX3VucmVnaXN0ZXJOb2RlKG5vZGU6IENka1RyZWVOb2RlPFQsIEs+KSB7XG4gICAgdGhpcy5fbm9kZXMudmFsdWUuZGVsZXRlKHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlLmRhdGEpKTtcbiAgICB0aGlzLl9ub2Rlcy5uZXh0KHRoaXMuX25vZGVzLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3IgdGhlIGdpdmVuIG5vZGUsIGRldGVybWluZSB0aGUgbGV2ZWwgd2hlcmUgdGhpcyBub2RlIGFwcGVhcnMgaW4gdGhlIHRyZWUuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtbGV2ZWxgIGJ1dCBpcyAwLWluZGV4ZWQuXG4gICAqL1xuICBfZ2V0TGV2ZWwobm9kZTogVCkge1xuICAgIHJldHVybiB0aGlzLl9sZXZlbHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBub2RlLCBkZXRlcm1pbmUgdGhlIHNpemUgb2YgdGhlIHBhcmVudCdzIGNoaWxkIHNldC5cbiAgICpcbiAgICogVGhpcyBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBgYXJpYS1zZXRzaXplYC5cbiAgICovXG4gIF9nZXRTZXRTaXplKGRhdGFOb2RlOiBUKSB7XG4gICAgY29uc3Qgc2V0ID0gdGhpcy5fZ2V0QXJpYVNldChkYXRhTm9kZSk7XG4gICAgcmV0dXJuIHNldC5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBub2RlLCBkZXRlcm1pbmUgdGhlIGluZGV4IChzdGFydGluZyBmcm9tIDEpIG9mIHRoZSBub2RlIGluIGl0cyBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtcG9zaW5zZXRgLlxuICAgKi9cbiAgX2dldFBvc2l0aW9uSW5TZXQoZGF0YU5vZGU6IFQpIHtcbiAgICBjb25zdCBzZXQgPSB0aGlzLl9nZXRBcmlhU2V0KGRhdGFOb2RlKTtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpO1xuICAgIHJldHVybiBzZXQuZmluZEluZGV4KG5vZGUgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpID09PSBrZXkpICsgMTtcbiAgfVxuXG4gIC8qKiBHaXZlbiBhIENka1RyZWVOb2RlLCBnZXRzIHRoZSBub2RlIHRoYXQgcmVuZGVycyB0aGF0IG5vZGUncyBwYXJlbnQncyBkYXRhLiAqL1xuICBfZ2V0Tm9kZVBhcmVudChub2RlOiBDZGtUcmVlTm9kZTxULCBLPikge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX3BhcmVudHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlLmRhdGEpKTtcbiAgICByZXR1cm4gcGFyZW50ICYmIHRoaXMuX25vZGVzLnZhbHVlLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50KSk7XG4gIH1cblxuICAvKiogR2l2ZW4gYSBDZGtUcmVlTm9kZSwgZ2V0cyB0aGUgbm9kZXMgdGhhdCByZW5kZXJzIHRoYXQgbm9kZSdzIGNoaWxkIGRhdGEuICovXG4gIF9nZXROb2RlQ2hpbGRyZW4obm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0RGlyZWN0Q2hpbGRyZW4obm9kZS5kYXRhKS5waXBlKFxuICAgICAgbWFwKGNoaWxkcmVuID0+XG4gICAgICAgIGNoaWxkcmVuLnJlZHVjZTxDZGtUcmVlTm9kZTxULCBLPltdPigobm9kZXMsIGNoaWxkKSA9PiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLl9ub2Rlcy52YWx1ZS5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSk7XG4gICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gbm9kZXM7XG4gICAgICAgIH0sIFtdKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBga2V5ZG93bmAgZXZlbnQgaGFuZGxlcjsgdGhpcyBqdXN0IHBhc3NlcyB0aGUgZXZlbnQgdG8gdGhlIGBUcmVlS2V5TWFuYWdlcmAuICovXG4gIF9zZW5kS2V5ZG93blRvS2V5TWFuYWdlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIHRoaXMuX2tleU1hbmFnZXIub25LZXlkb3duKGV2ZW50KTtcbiAgfVxuXG4gIC8qKiBHZXRzIGFsbCBuZXN0ZWQgZGVzY2VuZGFudHMgb2YgYSBnaXZlbiBub2RlLiAqL1xuICBwcml2YXRlIF9nZXREZXNjZW5kYW50cyhkYXRhTm9kZTogVCk6IE9ic2VydmFibGU8VFtdPiB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YodGhpcy50cmVlQ29udHJvbC5nZXREZXNjZW5kYW50cyhkYXRhTm9kZSkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5sZXZlbEFjY2Vzc29yKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gdGhpcy5fZmluZENoaWxkcmVuQnlMZXZlbChcbiAgICAgICAgdGhpcy5sZXZlbEFjY2Vzc29yLFxuICAgICAgICB0aGlzLl9mbGF0dGVuZWROb2Rlcy52YWx1ZSxcbiAgICAgICAgZGF0YU5vZGUsXG4gICAgICAgIEluZmluaXR5LFxuICAgICAgKTtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YocmVzdWx0cyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoaWxkcmVuQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRBbGxDaGlsZHJlblJlY3Vyc2l2ZWx5KGRhdGFOb2RlKS5waXBlKFxuICAgICAgICByZWR1Y2UoKGFsbENoaWxkcmVuOiBUW10sIG5leHRDaGlsZHJlbikgPT4ge1xuICAgICAgICAgIGFsbENoaWxkcmVuLnB1c2goLi4ubmV4dENoaWxkcmVuKTtcbiAgICAgICAgICByZXR1cm4gYWxsQ2hpbGRyZW47XG4gICAgICAgIH0sIFtdKSxcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IGdldFRyZWVDb250cm9sTWlzc2luZ0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgY2hpbGRyZW4gYW5kIHN1Yi1jaGlsZHJlbiBvZiB0aGUgcHJvdmlkZWQgbm9kZS5cbiAgICpcbiAgICogVGhpcyB3aWxsIGVtaXQgbXVsdGlwbGUgdGltZXMsIGluIHRoZSBvcmRlciB0aGF0IHRoZSBjaGlsZHJlbiB3aWxsIGFwcGVhclxuICAgKiBpbiB0aGUgdHJlZSwgYW5kIGNhbiBiZSBjb21iaW5lZCB3aXRoIGEgYHJlZHVjZWAgb3BlcmF0b3IuXG4gICAqL1xuICBwcml2YXRlIF9nZXRBbGxDaGlsZHJlblJlY3Vyc2l2ZWx5KGRhdGFOb2RlOiBUKTogT2JzZXJ2YWJsZTxUW10+IHtcbiAgICBpZiAoIXRoaXMuY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvZXJjZU9ic2VydmFibGUodGhpcy5jaGlsZHJlbkFjY2Vzc29yKGRhdGFOb2RlKSkucGlwZShcbiAgICAgIHRha2UoMSksXG4gICAgICBzd2l0Y2hNYXAoY2hpbGRyZW4gPT4ge1xuICAgICAgICAvLyBIZXJlLCB3ZSBjYWNoZSB0aGUgcGFyZW50cyBvZiBhIHBhcnRpY3VsYXIgY2hpbGQgc28gdGhhdCB3ZSBjYW4gY29tcHV0ZSB0aGUgbGV2ZWxzLlxuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgdGhpcy5fcGFyZW50cy5zZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSwgZGF0YU5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoLi4uY2hpbGRyZW4pLnBpcGUoXG4gICAgICAgICAgY29uY2F0TWFwKGNoaWxkID0+IGNvbmNhdChvYnNlcnZhYmxlT2YoW2NoaWxkXSksIHRoaXMuX2dldEFsbENoaWxkcmVuUmVjdXJzaXZlbHkoY2hpbGQpKSksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlOiBUKTogSyB7XG4gICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBhIGtleSBhY2Nlc3NvciBmdW5jdGlvbiB3YXMgbm90IHByb3ZpZGVkIGJ5IHRoZVxuICAgIC8vIHRyZWUgdXNlciwgd2UnbGwgZGVmYXVsdCB0byB1c2luZyB0aGUgbm9kZSBvYmplY3QgaXRzZWxmIGFzIHRoZSBrZXkuXG4gICAgLy9cbiAgICAvLyBUaGlzIGNhc3QgaXMgc2FmZSBzaW5jZTpcbiAgICAvLyAtIGlmIGFuIGV4cGFuc2lvbktleSBpcyBwcm92aWRlZCwgVFMgd2lsbCBpbmZlciB0aGUgdHlwZSBvZiBLIHRvIGJlXG4gICAgLy8gICB0aGUgcmV0dXJuIHR5cGUuXG4gICAgLy8gLSBpZiBpdCdzIG5vdCwgdGhlbiBLIHdpbGwgYmUgZGVmYXVsdGVkIHRvIFQuXG4gICAgcmV0dXJuIHRoaXMuZXhwYW5zaW9uS2V5Py4oZGF0YU5vZGUpID8/IChkYXRhTm9kZSBhcyB1bmtub3duIGFzIEspO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QXJpYVNldChub2RlOiBUKSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpO1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX3BhcmVudHMuZ2V0KGtleSk7XG4gICAgY29uc3QgcGFyZW50S2V5ID0gcGFyZW50ID8gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudCkgOiBudWxsO1xuICAgIGNvbnN0IHNldCA9IHRoaXMuX2FyaWFTZXRzLmdldChwYXJlbnRLZXkpO1xuICAgIHJldHVybiBzZXQgPz8gW25vZGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBwYXJlbnQgZm9yIHRoZSBnaXZlbiBub2RlLiBJZiB0aGlzIGlzIGEgcm9vdCBub2RlLCB0aGlzXG4gICAqIHJldHVybnMgbnVsbC4gSWYgd2UncmUgdW5hYmxlIHRvIGRldGVybWluZSB0aGUgcGFyZW50LCBmb3IgZXhhbXBsZSxcbiAgICogaWYgd2UgZG9uJ3QgaGF2ZSBjYWNoZWQgbm9kZSBkYXRhLCB0aGlzIHJldHVybnMgdW5kZWZpbmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZmluZFBhcmVudEZvck5vZGUobm9kZTogVCwgaW5kZXg6IG51bWJlciwgY2FjaGVkTm9kZXM6IHJlYWRvbmx5IFRbXSk6IFQgfCBudWxsIHtcbiAgICAvLyBJbiBhbGwgY2FzZXMsIHdlIGhhdmUgYSBtYXBwaW5nIGZyb20gbm9kZSB0byBsZXZlbDsgYWxsIHdlIG5lZWQgdG8gZG8gaGVyZSBpcyBiYWNrdHJhY2sgaW5cbiAgICAvLyBvdXIgZmxhdHRlbmVkIGxpc3Qgb2Ygbm9kZXMgdG8gZGV0ZXJtaW5lIHRoZSBmaXJzdCBub2RlIHRoYXQncyBvZiBhIGxldmVsIGxvd2VyIHRoYW4gdGhlXG4gICAgLy8gcHJvdmlkZWQgbm9kZS5cbiAgICBpZiAoIWNhY2hlZE5vZGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRMZXZlbCA9IHRoaXMuX2xldmVscy5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpKSA/PyAwO1xuICAgIGZvciAobGV0IHBhcmVudEluZGV4ID0gaW5kZXggLSAxOyBwYXJlbnRJbmRleCA+PSAwOyBwYXJlbnRJbmRleC0tKSB7XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gY2FjaGVkTm9kZXNbcGFyZW50SW5kZXhdO1xuICAgICAgY29uc3QgcGFyZW50TGV2ZWwgPSB0aGlzLl9sZXZlbHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShwYXJlbnROb2RlKSkgPz8gMDtcblxuICAgICAgaWYgKHBhcmVudExldmVsIDwgY3VycmVudExldmVsKSB7XG4gICAgICAgIHJldHVybiBwYXJlbnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHNldCBvZiByb290IG5vZGVzIGFuZCB0aGUgY3VycmVudCBub2RlIGxldmVsLCBmbGF0dGVucyBhbnkgbmVzdGVkXG4gICAqIG5vZGVzIGludG8gYSBzaW5nbGUgYXJyYXkuXG4gICAqXG4gICAqIElmIGFueSBub2RlcyBhcmUgbm90IGV4cGFuZGVkLCB0aGVuIHRoZWlyIGNoaWxkcmVuIHdpbGwgbm90IGJlIGFkZGVkIGludG8gdGhlIGFycmF5LlxuICAgKiBUaGlzIHdpbGwgc3RpbGwgdHJhdmVyc2UgYWxsIG5lc3RlZCBjaGlsZHJlbiBpbiBvcmRlciB0byBidWlsZCB1cCBvdXIgaW50ZXJuYWwgZGF0YVxuICAgKiBtb2RlbHMsIGJ1dCB3aWxsIG5vdCBpbmNsdWRlIHRoZW0gaW4gdGhlIHJldHVybmVkIGFycmF5LlxuICAgKi9cbiAgcHJpdmF0ZSBfZmxhdHRlbk5lc3RlZE5vZGVzV2l0aEV4cGFuc2lvbihub2RlczogcmVhZG9ubHkgVFtdLCBsZXZlbCA9IDApOiBPYnNlcnZhYmxlPFRbXT4ge1xuICAgIGNvbnN0IGNoaWxkcmVuQWNjZXNzb3IgPSB0aGlzLl9nZXRDaGlsZHJlbkFjY2Vzc29yKCk7XG4gICAgLy8gSWYgd2UncmUgdXNpbmcgYSBsZXZlbCBhY2Nlc3Nvciwgd2UgZG9uJ3QgbmVlZCB0byBmbGF0dGVuIGFueXRoaW5nLlxuICAgIGlmICghY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbLi4ubm9kZXNdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKC4uLm5vZGVzKS5waXBlKFxuICAgICAgY29uY2F0TWFwKG5vZGUgPT4ge1xuICAgICAgICBjb25zdCBwYXJlbnRLZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZSk7XG4gICAgICAgIGlmICghdGhpcy5fcGFyZW50cy5oYXMocGFyZW50S2V5KSkge1xuICAgICAgICAgIHRoaXMuX3BhcmVudHMuc2V0KHBhcmVudEtleSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGV2ZWxzLnNldChwYXJlbnRLZXksIGxldmVsKTtcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGNvZXJjZU9ic2VydmFibGUoY2hpbGRyZW5BY2Nlc3Nvcihub2RlKSk7XG4gICAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgICAgb2JzZXJ2YWJsZU9mKFtub2RlXSksXG4gICAgICAgICAgY2hpbGRyZW4ucGlwZShcbiAgICAgICAgICAgIHRha2UoMSksXG4gICAgICAgICAgICB0YXAoY2hpbGROb2RlcyA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuX2FyaWFTZXRzLnNldChwYXJlbnRLZXksIFsuLi4oY2hpbGROb2RlcyA/PyBbXSldKTtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZE5vZGVzID8/IFtdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRLZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmVudHMuc2V0KGNoaWxkS2V5LCBub2RlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sZXZlbHMuc2V0KGNoaWxkS2V5LCBsZXZlbCArIDEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN3aXRjaE1hcChjaGlsZE5vZGVzID0+IHtcbiAgICAgICAgICAgICAgaWYgKCFjaGlsZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24oY2hpbGROb2RlcywgbGV2ZWwgKyAxKS5waXBlKFxuICAgICAgICAgICAgICAgIG1hcChuZXN0ZWROb2RlcyA9PiAodGhpcy5pc0V4cGFuZGVkKG5vZGUpID8gbmVzdGVkTm9kZXMgOiBbXSkpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgcmVkdWNlKChyZXN1bHRzLCBjaGlsZHJlbikgPT4ge1xuICAgICAgICByZXN1bHRzLnB1c2goLi4uY2hpbGRyZW4pO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sIFtdIGFzIFRbXSksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBjaGlsZHJlbiBmb3IgY2VydGFpbiB0cmVlIGNvbmZpZ3VyYXRpb25zLlxuICAgKlxuICAgKiBUaGlzIGFsc28gY29tcHV0ZXMgcGFyZW50LCBsZXZlbCwgYW5kIGdyb3VwIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9jb21wdXRlUmVuZGVyaW5nRGF0YShcbiAgICBub2RlczogcmVhZG9ubHkgVFtdLFxuICAgIG5vZGVUeXBlOiAnZmxhdCcgfCAnbmVzdGVkJyxcbiAgKTogT2JzZXJ2YWJsZTx7XG4gICAgcmVuZGVyTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgICBmbGF0dGVuZWROb2RlczogcmVhZG9ubHkgVFtdO1xuICB9PiB7XG4gICAgLy8gVGhlIG9ubHkgc2l0dWF0aW9ucyB3aGVyZSB3ZSBoYXZlIHRvIGNvbnZlcnQgY2hpbGRyZW4gdHlwZXMgaXMgd2hlblxuICAgIC8vIHRoZXkncmUgbWlzbWF0Y2hlZDsgaS5lLiBpZiB0aGUgdHJlZSBpcyB1c2luZyBhIGNoaWxkcmVuQWNjZXNzb3IgYW5kIHRoZVxuICAgIC8vIG5vZGVzIGFyZSBmbGF0LCBvciBpZiB0aGUgdHJlZSBpcyB1c2luZyBhIGxldmVsQWNjZXNzb3IgYW5kIHRoZSBub2RlcyBhcmVcbiAgICAvLyBuZXN0ZWQuXG4gICAgaWYgKHRoaXMuY2hpbGRyZW5BY2Nlc3NvciAmJiBub2RlVHlwZSA9PT0gJ2ZsYXQnKSB7XG4gICAgICAvLyBUaGlzIGZsYXR0ZW5zIGNoaWxkcmVuIGludG8gYSBzaW5nbGUgYXJyYXkuXG4gICAgICB0aGlzLl9hcmlhU2V0cy5zZXQobnVsbCwgWy4uLm5vZGVzXSk7XG4gICAgICByZXR1cm4gdGhpcy5fZmxhdHRlbk5lc3RlZE5vZGVzV2l0aEV4cGFuc2lvbihub2RlcykucGlwZShcbiAgICAgICAgbWFwKGZsYXR0ZW5lZE5vZGVzID0+ICh7XG4gICAgICAgICAgcmVuZGVyTm9kZXM6IGZsYXR0ZW5lZE5vZGVzLFxuICAgICAgICAgIGZsYXR0ZW5lZE5vZGVzLFxuICAgICAgICB9KSksXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5sZXZlbEFjY2Vzc29yICYmIG5vZGVUeXBlID09PSAnbmVzdGVkJykge1xuICAgICAgLy8gSW4gdGhlIG5lc3RlZCBjYXNlLCB3ZSBvbmx5IGxvb2sgZm9yIHJvb3Qgbm9kZXMuIFRoZSBDZGtOZXN0ZWROb2RlXG4gICAgICAvLyBpdHNlbGYgd2lsbCBoYW5kbGUgcmVuZGVyaW5nIGVhY2ggaW5kaXZpZHVhbCBub2RlJ3MgY2hpbGRyZW4uXG4gICAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5sZXZlbEFjY2Vzc29yO1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihub2Rlcy5maWx0ZXIobm9kZSA9PiBsZXZlbEFjY2Vzc29yKG5vZGUpID09PSAwKSkucGlwZShcbiAgICAgICAgbWFwKHJvb3ROb2RlcyA9PiAoe1xuICAgICAgICAgIHJlbmRlck5vZGVzOiByb290Tm9kZXMsXG4gICAgICAgICAgZmxhdHRlbmVkTm9kZXM6IG5vZGVzLFxuICAgICAgICB9KSksXG4gICAgICAgIHRhcCgoe2ZsYXR0ZW5lZE5vZGVzfSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZVBhcmVudHMoZmxhdHRlbmVkTm9kZXMpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ2ZsYXQnKSB7XG4gICAgICAvLyBJbiB0aGUgY2FzZSBvZiBhIFRyZWVDb250cm9sLCB3ZSBrbm93IHRoYXQgdGhlIG5vZGUgdHlwZSBtYXRjaGVzIHVwXG4gICAgICAvLyB3aXRoIHRoZSBUcmVlQ29udHJvbCwgYW5kIHNvIG5vIGNvbnZlcnNpb25zIGFyZSBuZWNlc3NhcnkuIE90aGVyd2lzZSxcbiAgICAgIC8vIHdlJ3ZlIGFscmVhZHkgY29uZmlybWVkIHRoYXQgdGhlIGRhdGEgbW9kZWwgbWF0Y2hlcyB1cCB3aXRoIHRoZVxuICAgICAgLy8gZGVzaXJlZCBub2RlIHR5cGUgaGVyZS5cbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Yoe3JlbmRlck5vZGVzOiBub2RlcywgZmxhdHRlbmVkTm9kZXM6IG5vZGVzfSkucGlwZShcbiAgICAgICAgdGFwKCh7ZmxhdHRlbmVkTm9kZXN9KSA9PiB7XG4gICAgICAgICAgdGhpcy5fY2FsY3VsYXRlUGFyZW50cyhmbGF0dGVuZWROb2Rlcyk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9yIG5lc3RlZCBub2Rlcywgd2Ugc3RpbGwgbmVlZCB0byBwZXJmb3JtIHRoZSBub2RlIGZsYXR0ZW5pbmcgaW4gb3JkZXJcbiAgICAgIC8vIHRvIG1haW50YWluIG91ciBjYWNoZXMgZm9yIHZhcmlvdXMgdHJlZSBvcGVyYXRpb25zLlxuICAgICAgdGhpcy5fYXJpYVNldHMuc2V0KG51bGwsIFsuLi5ub2Rlc10pO1xuICAgICAgcmV0dXJuIHRoaXMuX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24obm9kZXMpLnBpcGUoXG4gICAgICAgIG1hcChmbGF0dGVuZWROb2RlcyA9PiAoe1xuICAgICAgICAgIHJlbmRlck5vZGVzOiBub2RlcyxcbiAgICAgICAgICBmbGF0dGVuZWROb2RlcyxcbiAgICAgICAgfSkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVDYWNoZWREYXRhKGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW10pIHtcbiAgICB0aGlzLl9mbGF0dGVuZWROb2Rlcy5uZXh0KGZsYXR0ZW5lZE5vZGVzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZUtleU1hbmFnZXJJdGVtcyhmbGF0dGVuZWROb2RlczogcmVhZG9ubHkgVFtdKSB7XG4gICAgdGhpcy5fa2V5TWFuYWdlck5vZGVzLm5leHQoZmxhdHRlbmVkTm9kZXMpO1xuICB9XG5cbiAgLyoqIFRyYXZlcnNlIHRoZSBmbGF0dGVuZWQgbm9kZSBkYXRhIGFuZCBjb21wdXRlIHBhcmVudHMsIGxldmVscywgYW5kIGdyb3VwIGRhdGEuICovXG4gIHByaXZhdGUgX2NhbGN1bGF0ZVBhcmVudHMoZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXSk6IHZvaWQge1xuICAgIGNvbnN0IGxldmVsQWNjZXNzb3IgPSB0aGlzLl9nZXRMZXZlbEFjY2Vzc29yKCk7XG4gICAgaWYgKCFsZXZlbEFjY2Vzc29yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcGFyZW50cy5jbGVhcigpO1xuICAgIHRoaXMuX2FyaWFTZXRzLmNsZWFyKCk7XG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmxhdHRlbmVkTm9kZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjb25zdCBkYXRhTm9kZSA9IGZsYXR0ZW5lZE5vZGVzW2luZGV4XTtcbiAgICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSk7XG4gICAgICB0aGlzLl9sZXZlbHMuc2V0KGtleSwgbGV2ZWxBY2Nlc3NvcihkYXRhTm9kZSkpO1xuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZmluZFBhcmVudEZvck5vZGUoZGF0YU5vZGUsIGluZGV4LCBmbGF0dGVuZWROb2Rlcyk7XG4gICAgICB0aGlzLl9wYXJlbnRzLnNldChrZXksIHBhcmVudCk7XG4gICAgICBjb25zdCBwYXJlbnRLZXkgPSBwYXJlbnQgPyB0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50KSA6IG51bGw7XG5cbiAgICAgIGNvbnN0IGdyb3VwID0gdGhpcy5fYXJpYVNldHMuZ2V0KHBhcmVudEtleSkgPz8gW107XG4gICAgICBncm91cC5zcGxpY2UoaW5kZXgsIDAsIGRhdGFOb2RlKTtcbiAgICAgIHRoaXMuX2FyaWFTZXRzLnNldChwYXJlbnRLZXksIGdyb3VwKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUcmVlIG5vZGUgZm9yIENka1RyZWUuIEl0IGNvbnRhaW5zIHRoZSBkYXRhIGluIHRoZSB0cmVlIG5vZGUuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2Nkay10cmVlLW5vZGUnLFxuICBleHBvcnRBczogJ2Nka1RyZWVOb2RlJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdHJlZS1ub2RlJyxcbiAgICAnW2F0dHIuYXJpYS1leHBhbmRlZF0nOiAnX2dldEFyaWFFeHBhbmRlZCgpJyxcbiAgICAnW2F0dHIuYXJpYS1sZXZlbF0nOiAnbGV2ZWwgKyAxJyxcbiAgICAnW2F0dHIuYXJpYS1wb3NpbnNldF0nOiAnX2dldFBvc2l0aW9uSW5TZXQoKScsXG4gICAgJ1thdHRyLmFyaWEtc2V0c2l6ZV0nOiAnX2dldFNldFNpemUoKScsXG4gICAgJ1t0YWJpbmRleF0nOiAnX3RhYmluZGV4JyxcbiAgICAncm9sZSc6ICd0cmVlaXRlbScsXG4gICAgJyhjbGljayknOiAnX3NldEFjdGl2ZUl0ZW0oKScsXG4gICAgJyhmb2N1cyknOiAnX2ZvY3VzSXRlbSgpJyxcbiAgfSxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGU8VCwgSyA9IFQ+IGltcGxlbWVudHMgT25EZXN0cm95LCBPbkluaXQsIFRyZWVLZXlNYW5hZ2VySXRlbSB7XG4gIHByb3RlY3RlZCBfdGFiaW5kZXg6IG51bWJlciB8IG51bGwgPSAtMTtcblxuICAvKipcbiAgICogVGhlIHJvbGUgb2YgdGhlIHRyZWUgbm9kZS5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIGlnbm9yZWQ7IHRoZSB0cmVlIHdpbGwgYXV0b21hdGljYWxseSBkZXRlcm1pbmUgdGhlIGFwcHJvcHJpYXRlIHJvbGVcbiAgICogZm9yIHRyZWUgbm9kZS4gVGhpcyBpbnB1dCB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgdmVyc2lvbi5cbiAgICogQGJyZWFraW5nLWNoYW5nZSAyMS4wLjBcbiAgICovXG4gIEBJbnB1dCgpIGdldCByb2xlKCk6ICd0cmVlaXRlbScgfCAnZ3JvdXAnIHtcbiAgICByZXR1cm4gJ3RyZWVpdGVtJztcbiAgfVxuXG4gIHNldCByb2xlKF9yb2xlOiAndHJlZWl0ZW0nIHwgJ2dyb3VwJykge1xuICAgIC8vIGlnbm9yZSBhbnkgcm9sZSBzZXR0aW5nLCB3ZSBoYW5kbGUgdGhpcyBpbnRlcm5hbGx5LlxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgbm9kZSBpcyBleHBhbmRhYmxlLlxuICAgKlxuICAgKiBJZiBub3QgdXNpbmcgYEZsYXRUcmVlQ29udHJvbGAsIG9yIGlmIGBpc0V4cGFuZGFibGVgIGlzIG5vdCBwcm92aWRlZCB0b1xuICAgKiBgTmVzdGVkVHJlZUNvbnRyb2xgLCB0aGlzIHNob3VsZCBiZSBwcm92aWRlZCBmb3IgY29ycmVjdCBub2RlIGExMXkuXG4gICAqL1xuICBASW5wdXQoe3RyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBpc0V4cGFuZGFibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzRXhwYW5kYWJsZSgpO1xuICB9XG4gIHNldCBpc0V4cGFuZGFibGUoaXNFeHBhbmRhYmxlOiBib29sZWFuKSB7XG4gICAgdGhpcy5faW5wdXRJc0V4cGFuZGFibGUgPSBpc0V4cGFuZGFibGU7XG4gIH1cblxuICBASW5wdXQoKVxuICBnZXQgaXNFeHBhbmRlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5pc0V4cGFuZGVkKHRoaXMuX2RhdGEpO1xuICB9XG4gIHNldCBpc0V4cGFuZGVkKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5leHBhbmQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsYXBzZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgZGlzYWJsZWQuIElmIGl0J3MgZGlzYWJsZWQsIHRoZW4gdGhlIHVzZXIgd29uJ3QgYmUgYWJsZSB0byBmb2N1c1xuICAgKiBvciBhY3RpdmF0ZSB0aGlzIG5vZGUuXG4gICAqL1xuICBASW5wdXQoe3RyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pIGlzRGlzYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSB0ZXh0IHVzZWQgdG8gbG9jYXRlIHRoaXMgaXRlbSBkdXJpbmcgdHlwZWFoZWFkLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgYHRleHRDb250ZW50YCB3aWxsXG4gICAqIHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVUeXBlYWhlYWRMYWJlbCcpIHR5cGVhaGVhZExhYmVsOiBzdHJpbmcgfCBudWxsO1xuXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudHlwZWFoZWFkTGFiZWwgfHwgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gIH1cblxuICAvKiogVGhpcyBlbWl0cyB3aGVuIHRoZSBub2RlIGhhcyBiZWVuIHByb2dyYW1hdGljYWxseSBhY3RpdmF0ZWQgb3IgYWN0aXZhdGVkIGJ5IGtleWJvYXJkLiAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgYWN0aXZhdGlvbjogRXZlbnRFbWl0dGVyPFQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxUPigpO1xuXG4gIC8qKiBUaGlzIGVtaXRzIHdoZW4gdGhlIG5vZGUncyBleHBhbnNpb24gc3RhdHVzIGhhcyBiZWVuIGNoYW5nZWQuICovXG4gIEBPdXRwdXQoKVxuICByZWFkb25seSBleHBhbmRlZENoYW5nZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+ID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPigpO1xuXG4gIC8qKlxuICAgKiBUaGUgbW9zdCByZWNlbnRseSBjcmVhdGVkIGBDZGtUcmVlTm9kZWAuIFdlIHNhdmUgaXQgaW4gc3RhdGljIHZhcmlhYmxlIHNvIHdlIGNhbiByZXRyaWV2ZSBpdFxuICAgKiBpbiBgQ2RrVHJlZWAgYW5kIHNldCB0aGUgZGF0YSB0byBpdC5cbiAgICovXG4gIHN0YXRpYyBtb3N0UmVjZW50VHJlZU5vZGU6IENka1RyZWVOb2RlPGFueT4gfCBudWxsID0gbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgbm9kZSdzIGRhdGEgaGFzIGNoYW5nZWQuICovXG4gIHJlYWRvbmx5IF9kYXRhQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgcHJpdmF0ZSBfaW5wdXRJc0V4cGFuZGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqXG4gICAqIEZsYWcgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIGJlIGZvY3VzaW5nIHRoZSBhY3R1YWwgZWxlbWVudCBiYXNlZCBvblxuICAgKiBzb21lIHVzZXIgaW50ZXJhY3Rpb24gKGNsaWNrIG9yIGZvY3VzKS4gT24gY2xpY2ssIHdlIGRvbid0IGZvcmNpYmx5IGZvY3VzIHRoZSBlbGVtZW50XG4gICAqIHNpbmNlIHRoZSBjbGljayBjb3VsZCB0cmlnZ2VyIHNvbWUgb3RoZXIgY29tcG9uZW50IHRoYXQgd2FudHMgdG8gZ3JhYiBpdHMgb3duIGZvY3VzXG4gICAqIChlLmcuIG1lbnUsIGRpYWxvZykuXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRGb2N1cyA9IHRydWU7XG4gIHByaXZhdGUgX3BhcmVudE5vZGVBcmlhTGV2ZWw6IG51bWJlcjtcblxuICAvKiogVGhlIHRyZWUgbm9kZSdzIGRhdGEuICovXG4gIGdldCBkYXRhKCk6IFQge1xuICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICB9XG4gIHNldCBkYXRhKHZhbHVlOiBUKSB7XG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLl9kYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdmFsdWU7XG4gICAgICB0aGlzLl9kYXRhQ2hhbmdlcy5uZXh0KCk7XG4gICAgfVxuICB9XG4gIHByb3RlY3RlZCBfZGF0YTogVDtcblxuICAvKiBJZiBsZWFmIG5vZGUsIHJldHVybiB0cnVlIHRvIG5vdCBhc3NpZ24gYXJpYS1leHBhbmRlZCBhdHRyaWJ1dGUgKi9cbiAgZ2V0IGlzTGVhZk5vZGUoKTogYm9vbGVhbiB7XG4gICAgLy8gSWYgZmxhdCB0cmVlIG5vZGUgZGF0YSByZXR1cm5zIGZhbHNlIGZvciBleHBhbmRhYmxlIHByb3BlcnR5LCBpdCdzIGEgbGVhZiBub2RlXG4gICAgaWYgKFxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uaXNFeHBhbmRhYmxlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICF0aGlzLl90cmVlLnRyZWVDb250cm9sLmlzRXhwYW5kYWJsZSh0aGlzLl9kYXRhKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIElmIG5lc3RlZCB0cmVlIG5vZGUgZGF0YSByZXR1cm5zIDAgZGVzY2VuZGFudHMsIGl0J3MgYSBsZWFmIG5vZGVcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uaXNFeHBhbmRhYmxlID09PSB1bmRlZmluZWQgJiZcbiAgICAgIHRoaXMuX3RyZWUudHJlZUNvbnRyb2w/LmdldERlc2NlbmRhbnRzKHRoaXMuX2RhdGEpLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0IGxldmVsKCk6IG51bWJlciB7XG4gICAgLy8gSWYgdGhlIHRyZWUgaGFzIGEgbGV2ZWxBY2Nlc3NvciwgdXNlIGl0IHRvIGdldCB0aGUgbGV2ZWwuIE90aGVyd2lzZSByZWFkIHRoZVxuICAgIC8vIGFyaWEtbGV2ZWwgb2ZmIHRoZSBwYXJlbnQgbm9kZSBhbmQgdXNlIGl0IGFzIHRoZSBsZXZlbCBmb3IgdGhpcyBub2RlIChub3RlIGFyaWEtbGV2ZWwgaXNcbiAgICAvLyAxLWluZGV4ZWQsIHdoaWxlIHRoaXMgcHJvcGVydHkgaXMgMC1pbmRleGVkLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGluY3JlbWVudCkuXG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldExldmVsKHRoaXMuX2RhdGEpID8/IHRoaXMuX3BhcmVudE5vZGVBcmlhTGV2ZWw7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyBpZiB0aGUgdHJlZSBub2RlIGlzIGV4cGFuZGFibGUuICovXG4gIF9pc0V4cGFuZGFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3RyZWUudHJlZUNvbnRyb2wpIHtcbiAgICAgIGlmICh0aGlzLmlzTGVhZk5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgY29tcGF0aWJpbGl0eSB3aXRoIHRyZWVzIGNyZWF0ZWQgdXNpbmcgVHJlZUNvbnRyb2wgYmVmb3JlIHdlIGFkZGVkXG4gICAgICAvLyBDZGtUcmVlTm9kZSNpc0V4cGFuZGFibGUuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lucHV0SXNFeHBhbmRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIHZhbHVlIGZvciBgYXJpYS1leHBhbmRlZGAuXG4gICAqXG4gICAqIEZvciBub24tZXhwYW5kYWJsZSBub2RlcywgdGhpcyBpcyBgbnVsbGAuXG4gICAqL1xuICBfZ2V0QXJpYUV4cGFuZGVkKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICghdGhpcy5faXNFeHBhbmRhYmxlKCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgc2l6ZSBvZiB0aGlzIG5vZGUncyBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtc2V0c2l6ZWAuXG4gICAqL1xuICBfZ2V0U2V0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXRTZXRTaXplKHRoaXMuX2RhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGluZGV4IChzdGFydGluZyBmcm9tIDEpIG9mIHRoaXMgbm9kZSBpbiBpdHMgcGFyZW50J3MgY2hpbGQgc2V0LlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLXBvc2luc2V0YC5cbiAgICovXG4gIF9nZXRQb3NpdGlvbkluU2V0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldFBvc2l0aW9uSW5TZXQodGhpcy5fZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZiA9IGluamVjdChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcm90ZWN0ZWQgX3RyZWU6IENka1RyZWU8VCwgSz4sXG4gICkge1xuICAgIENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSA9IHRoaXMgYXMgQ2RrVHJlZU5vZGU8VCwgSz47XG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXJlbnROb2RlQXJpYUxldmVsID0gZ2V0UGFyZW50Tm9kZUFyaWFMZXZlbCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX3RyZWVcbiAgICAgIC5fZ2V0RXhwYW5zaW9uTW9kZWwoKVxuICAgICAgLmNoYW5nZWQucGlwZShcbiAgICAgICAgbWFwKCgpID0+IHRoaXMuaXNFeHBhbmRlZCksXG4gICAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgICB9KTtcbiAgICB0aGlzLl90cmVlLl9zZXROb2RlVHlwZUlmVW5zZXQoJ2ZsYXQnKTtcbiAgICB0aGlzLl90cmVlLl9yZWdpc3Rlck5vZGUodGhpcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRyZWUgbm9kZSBiZWluZyBkZXN0cm95ZWQsXG4gICAgLy8gY2xlYXIgb3V0IHRoZSByZWZlcmVuY2UgdG8gYXZvaWQgbGVha2luZyBtZW1vcnkuXG4gICAgaWYgKENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSA9PT0gdGhpcykge1xuICAgICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICBnZXRQYXJlbnQoKTogQ2RrVHJlZU5vZGU8VCwgSz4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5fZ2V0Tm9kZVBhcmVudCh0aGlzKSA/PyBudWxsO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKTogQ2RrVHJlZU5vZGU8VCwgSz5bXSB8IE9ic2VydmFibGU8Q2RrVHJlZU5vZGU8VCwgSz5bXT4ge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXROb2RlQ2hpbGRyZW4odGhpcyk7XG4gIH1cblxuICAvKiogRm9jdXNlcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgZm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuICAgIGlmICh0aGlzLl9zaG91bGRGb2N1cykge1xuICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRGVmb2N1cyB0aGlzIGRhdGEgbm9kZS4gKi9cbiAgdW5mb2N1cygpOiB2b2lkIHtcbiAgICB0aGlzLl90YWJpbmRleCA9IC0xO1xuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRW1pdHMgYW4gYWN0aXZhdGlvbiBldmVudC4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2YXRpb24ubmV4dCh0aGlzLl9kYXRhKTtcbiAgfVxuXG4gIC8qKiBDb2xsYXBzZXMgdGhpcyBkYXRhIG5vZGUuIEltcGxlbWVudGVkIGZvciBUcmVlS2V5TWFuYWdlckl0ZW0uICovXG4gIGNvbGxhcHNlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzRXhwYW5kYWJsZSkge1xuICAgICAgdGhpcy5fdHJlZS5jb2xsYXBzZSh0aGlzLl9kYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgZXhwYW5kKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzRXhwYW5kYWJsZSkge1xuICAgICAgdGhpcy5fdHJlZS5leHBhbmQodGhpcy5fZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIE1ha2VzIHRoZSBub2RlIGZvY3VzYWJsZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgbWFrZUZvY3VzYWJsZSgpOiB2b2lkIHtcbiAgICB0aGlzLl90YWJpbmRleCA9IDA7XG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICBfZm9jdXNJdGVtKCkge1xuICAgIGlmICh0aGlzLmlzRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fdHJlZS5fa2V5TWFuYWdlci5mb2N1c0l0ZW0odGhpcyk7XG4gIH1cblxuICBfc2V0QWN0aXZlSXRlbSgpIHtcbiAgICBpZiAodGhpcy5pc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3Nob3VsZEZvY3VzID0gZmFsc2U7XG4gICAgdGhpcy5fdHJlZS5fa2V5TWFuYWdlci5mb2N1c0l0ZW0odGhpcyk7XG4gICAgdGhpcy5fc2hvdWxkRm9jdXMgPSB0cnVlO1xuICB9XG5cbiAgX2VtaXRFeHBhbnNpb25TdGF0ZShleHBhbmRlZDogYm9vbGVhbikge1xuICAgIHRoaXMuZXhwYW5kZWRDaGFuZ2UuZW1pdChleHBhbmRlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50Tm9kZUFyaWFMZXZlbChub2RlRWxlbWVudDogSFRNTEVsZW1lbnQpOiBudW1iZXIge1xuICBsZXQgcGFyZW50ID0gbm9kZUVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgd2hpbGUgKHBhcmVudCAmJiAhaXNOb2RlRWxlbWVudChwYXJlbnQpKSB7XG4gICAgcGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG4gIH1cbiAgaWYgKCFwYXJlbnQpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICB0aHJvdyBFcnJvcignSW5jb3JyZWN0IHRyZWUgc3RydWN0dXJlIGNvbnRhaW5pbmcgZGV0YWNoZWQgbm9kZS4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwYXJlbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdjZGstbmVzdGVkLXRyZWUtbm9kZScpKSB7XG4gICAgcmV0dXJuIG51bWJlckF0dHJpYnV0ZShwYXJlbnQuZ2V0QXR0cmlidXRlKCdhcmlhLWxldmVsJykhKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgYW5jZXN0b3IgZWxlbWVudCBpcyB0aGUgY2RrLXRyZWUgaXRzZWxmXG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNOb2RlRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICBjb25zdCBjbGFzc0xpc3QgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgcmV0dXJuICEhKGNsYXNzTGlzdD8uY29udGFpbnMoJ2Nkay1uZXN0ZWQtdHJlZS1ub2RlJykgfHwgY2xhc3NMaXN0Py5jb250YWlucygnY2RrLXRyZWUnKSk7XG59XG4iXX0=