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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS90cmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFDTCxnQkFBZ0IsR0FLakIsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUdMLFlBQVksRUFFWixjQUFjLEdBQ2YsTUFBTSwwQkFBMEIsQ0FBQztBQUNsQyxPQUFPLEVBSUwsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUVaLEtBQUssRUFHTCxlQUFlLEVBR2YsTUFBTSxFQUNOLFNBQVMsRUFFVCxTQUFTLEVBRVQsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixNQUFNLEVBQ04sZ0JBQWdCLEdBQ2pCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQy9ELE9BQU8sRUFDTCxlQUFlLEVBQ2YsYUFBYSxFQUNiLE1BQU0sRUFDTixLQUFLLEVBRUwsT0FBTyxFQUVQLFlBQVksRUFDWixFQUFFLElBQUksWUFBWSxHQUNuQixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsU0FBUyxFQUNULEdBQUcsRUFDSCxNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxJQUFJLEVBQ0osU0FBUyxFQUNULEdBQUcsR0FDSixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBQyxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFDTCw0QkFBNEIsRUFDNUIsMEJBQTBCLEVBQzFCLGtDQUFrQyxFQUNsQyxtQ0FBbUMsRUFDbkMsNkJBQTZCLEdBQzlCLE1BQU0sZUFBZSxDQUFDOzs7QUFjdkI7OztHQUdHO0FBbUJILE1BQU0sT0FBTyxPQUFPO0lBcUNsQjs7OztPQUlHO0lBQ0gsSUFDSSxVQUFVO1FBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFDRCxJQUFJLFVBQVUsQ0FBQyxVQUFpRDtRQUM5RCxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7SUFDSCxDQUFDO0lBZ0dELFlBQ1UsUUFBeUIsRUFDekIsa0JBQXFDLEVBQ3JDLElBQW9CO1FBRnBCLGFBQVEsR0FBUixRQUFRLENBQWlCO1FBQ3pCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7UUFDckMsU0FBSSxHQUFKLElBQUksQ0FBZ0I7UUE1STlCLGdFQUFnRTtRQUMvQyxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQVdsRCxxQkFBcUI7UUFDYixZQUFPLEdBQW1CLElBQUksR0FBRyxFQUFhLENBQUM7UUFFdkQsOEVBQThFO1FBQ3RFLGFBQVEsR0FBcUIsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQUU1RDs7Ozs7OztXQU9HO1FBQ0ssY0FBUyxHQUF1QixJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQW1FakUsNkZBQTZGO1FBQzdGLHlDQUF5QztRQUN6Qzs7O1dBR0c7UUFDTSxlQUFVLEdBQUcsSUFBSSxlQUFlLENBQStCO1lBQ3RFLEtBQUssRUFBRSxDQUFDO1lBQ1IsR0FBRyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1NBQ3RCLENBQUMsQ0FBQztRQUtIOzs7O1dBSUc7UUFDSyxvQkFBZSxHQUFrQyxJQUFJLGVBQWUsQ0FBZSxFQUFFLENBQUMsQ0FBQztRQUUvRiwyREFBMkQ7UUFDbkQsY0FBUyxHQUE4QyxJQUFJLGVBQWUsQ0FFaEYsSUFBSSxDQUFDLENBQUM7UUFFUiw4REFBOEQ7UUFDdEQsV0FBTSxHQUErQyxJQUFJLGVBQWUsQ0FDOUUsSUFBSSxHQUFHLEVBQXdCLENBQ2hDLENBQUM7UUFFRjs7OztXQUlHO1FBQ0sscUJBQWdCLEdBQWtDLElBQUksZUFBZSxDQUFlLEVBQUUsQ0FBQyxDQUFDO1FBRXhGLHVCQUFrQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBNkMsQ0FBQztRQUkxRixjQUFTLEdBQUcsS0FBSyxDQUFDO0lBTXZCLENBQUM7SUFFSixrQkFBa0I7UUFDaEIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELHFCQUFxQjtRQUNuQixJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXZDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTNCLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxPQUFRLElBQUksQ0FBQyxXQUE2QixDQUFDLFVBQVUsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUM1RixJQUFJLENBQUMsVUFBNEIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFDaEMsQ0FBQztRQUVELDJFQUEyRTtRQUMzRSwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxlQUFlO1FBQ2IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztJQUVPLDRCQUE0QjtRQUNsQyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hFLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUNsRixNQUFNLG1DQUFtQyxFQUFFLENBQUM7UUFDOUMsQ0FBQztRQUNELElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILG1CQUFtQixDQUFDLFFBQTJCO1FBQzdDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsQ0FBQztJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssaUJBQWlCLENBQUMsVUFBaUQ7UUFDekUsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLE9BQVEsSUFBSSxDQUFDLFdBQTZCLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQzVGLElBQUksQ0FBQyxVQUE0QixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUNoQyxDQUFDO1FBRUQsMERBQTBEO1FBQzFELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDakMsQ0FBQztJQUNILENBQUM7SUFFRCxrQkFBa0I7UUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsZUFBZSxLQUFLLElBQUksY0FBYyxDQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3JELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM5QixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsc0VBQXNFO0lBQzlELHVCQUF1QjtRQUM3QixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzNCLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxVQUFnRCxDQUFDO1FBRXJELElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQ25DLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDO2FBQU0sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7WUFDMUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDaEMsQ0FBQzthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUMzQyxVQUFVLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLDZCQUE2QixFQUFFLENBQUM7WUFDeEMsQ0FBQztZQUNELE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO2FBQ3JELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ2hDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsa0hBQWtIO0lBQzFHLGNBQWMsQ0FBQyxVQUFvQztRQUN6RCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNqRCxPQUFPLGFBQWEsQ0FBQztZQUNuQixVQUFVO1lBQ1YsSUFBSSxDQUFDLFNBQVM7WUFDZCxrRkFBa0Y7WUFDbEYsdURBQXVEO1lBQ3ZELGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUN6QixTQUFTLENBQUMsSUFBSSxDQUFDLEVBQ2YsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9DLENBQUMsQ0FBQyxDQUNIO1NBQ0YsQ0FBQyxDQUFDLElBQUksQ0FDTCxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFO1lBQzdCLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN0QixPQUFPLFlBQVksQ0FBQyxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQVUsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7WUFFRCx1RUFBdUU7WUFDdkUsK0VBQStFO1lBQy9FLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQ3BELEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBQyxHQUFHLGFBQWEsRUFBRSxRQUFRLEVBQUMsQ0FBVSxDQUFDLENBQzlELENBQUM7UUFDSixDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQUVPLGtCQUFrQixDQUFDLElBQXNCO1FBQy9DLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pDLE9BQU87UUFDVCxDQUFDO1FBRUQsdUVBQXVFO1FBQ3ZFLHdDQUF3QztRQUN4QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRU8scUJBQXFCLENBQUMsZ0JBQTJDO1FBQ3ZFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3RCLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDaEMsS0FBSyxNQUFNLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMzQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlCLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMvQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztJQUVPLHFCQUFxQjtRQUMzQixNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNwRSxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsRUFBRSxFQUFFLENBQ3JDLGVBQWUsQ0FBQyxNQUFNLENBQXNCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQzFELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FDUCxDQUNGLENBQUM7UUFFRixNQUFNLGlCQUFpQixHQUE2QztZQUNsRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNqRCxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVU7WUFDeEMseUJBQXlCLEVBQUUsSUFBSTtZQUMvQixxQkFBcUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUs7U0FDdkMsQ0FBQztRQUVGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFTyxxQkFBcUI7UUFDM0IsK0VBQStFO1FBQy9FLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE1BQWMsRUFBRSxJQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFTyxzQkFBc0I7UUFDNUIsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFLENBQUM7WUFDbEQsc0ZBQXNGO1lBQ3RGLHVFQUF1RTtZQUN2RSxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7WUFFeEIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3JCLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDdkIsZUFBZSxFQUFFLENBQUM7WUFDcEIsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzFCLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFFRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sMEJBQTBCLEVBQUUsQ0FBQztZQUNyQyxDQUFDO2lCQUFNLElBQUksZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQixNQUFNLDRCQUE0QixFQUFFLENBQUM7WUFDdkMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsNEZBQTRGO0lBQzVGLGlCQUFpQixDQUNmLElBQWtCLEVBQ2xCLGFBQWdDLElBQUksQ0FBQyxXQUFXLEVBQ2hELGdCQUFrQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFDaEUsVUFBYztRQUVkLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdEMsb0VBQW9FO1FBQ3BFLDBFQUEwRTtRQUMxRSxtREFBbUQ7UUFDbkQsRUFBRTtRQUNGLHVFQUF1RTtRQUN2RSwwRUFBMEU7UUFDMUUsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDaEMsT0FBTztRQUNULENBQUM7UUFFRCxPQUFPLEVBQUUsZ0JBQWdCLENBQ3ZCLENBQ0UsSUFBNkIsRUFDN0IscUJBQW9DLEVBQ3BDLFlBQTJCLEVBQzNCLEVBQUU7WUFDRixJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQWEsQ0FBQyxFQUFFLFlBQWEsRUFBRSxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakYsQ0FBQztpQkFBTSxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDaEMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxxQkFBc0IsQ0FBQyxDQUFDO1lBQy9DLENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLHFCQUFzQixDQUFDLENBQUM7Z0JBQ3ZELGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzFDLENBQUM7UUFDSCxDQUFDLENBQ0YsQ0FBQztRQUVGLDJGQUEyRjtRQUMzRixxQ0FBcUM7UUFDckMsT0FBTyxFQUFFLHFCQUFxQixDQUFDLENBQUMsTUFBK0IsRUFBRSxFQUFFO1lBQ2pFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDNUIsSUFBSSxNQUFNLENBQUMsWUFBWSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDbkQsSUFBNkIsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztZQUM3RCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCw2RkFBNkY7UUFDN0YsZUFBZTtRQUNmLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxXQUFXLENBQUMsSUFBTyxFQUFFLENBQVM7UUFDNUIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBTSxDQUFDO1FBQy9CLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FDWCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDO1FBRXBGLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUNoRSxNQUFNLGtDQUFrQyxFQUFFLENBQUM7UUFDN0MsQ0FBQztRQUVELE9BQU8sT0FBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxVQUFVLENBQUMsUUFBVyxFQUFFLEtBQWEsRUFBRSxhQUFnQyxFQUFFLFVBQWM7UUFDckYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFL0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTVDLDhEQUE4RDtRQUM5RCxNQUFNLE9BQU8sR0FBRyxJQUFJLHdCQUF3QixDQUFJLFFBQVEsQ0FBQyxDQUFDO1FBRTFELFVBQVUsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDbkQsa0ZBQWtGO1FBQ2xGLDJDQUEyQztRQUMzQyxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUM7YUFBTSxJQUFJLFVBQVUsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMzRixPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBRSxHQUFHLENBQUMsQ0FBQztRQUMzRSxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXJDLDJEQUEyRDtRQUMzRCxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDakYsU0FBUyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTVELDhDQUE4QztRQUM5Qyx1RkFBdUY7UUFDdkYseUZBQXlGO1FBQ3pGLElBQUksV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDbkMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7UUFDakQsQ0FBQztJQUNILENBQUM7SUFFRCxxRkFBcUY7SUFDckYsVUFBVSxDQUFDLFFBQVc7UUFDcEIsT0FBTyxDQUFDLENBQUMsQ0FDUCxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDdEMsSUFBSSxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQ2xFLENBQUM7SUFDSixDQUFDO0lBRUQsaUZBQWlGO0lBQ2pGLE1BQU0sQ0FBQyxRQUFXO1FBQ2hCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7YUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO0lBQ0gsQ0FBQztJQUVELHFFQUFxRTtJQUNyRSxNQUFNLENBQUMsUUFBVztRQUNoQixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztJQUNILENBQUM7SUFFRCx3RUFBd0U7SUFDeEUsUUFBUSxDQUFDLFFBQVc7UUFDbEIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsaUJBQWlCLENBQUMsUUFBVztRQUMzQixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLENBQUM7YUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxpQkFBaUIsQ0FBQyxRQUFXO1FBQzNCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDNUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQztpQkFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUN6QyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3BCLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDSCxDQUFDO0lBRUQsZ0dBQWdHO0lBQ2hHLG1CQUFtQixDQUFDLFFBQVc7UUFDN0IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRCxDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUM1QyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDO2lCQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3pDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDcEIsY0FBYyxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztJQUNILENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsU0FBUztRQUNQLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDL0IsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDNUMsY0FBYyxDQUFDLE1BQU0sQ0FDbkIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FDekUsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBRUQsMkNBQTJDO0lBQzNDLFdBQVc7UUFDVCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pDLENBQUM7YUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQzVDLGNBQWMsQ0FBQyxRQUFRLENBQ3JCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQ3pFLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUVELCtFQUErRTtJQUMvRSxpQkFBaUI7UUFDZixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUNsRixDQUFDO0lBRUQsa0ZBQWtGO0lBQ2xGLG9CQUFvQjtRQUNsQixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQ3hGLENBQUM7SUFFRDs7O09BR0c7SUFDSCxrQkFBa0IsQ0FBQyxRQUFXO1FBQzVCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQy9DLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUM7UUFDaEYsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFNUMsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQzVDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNsQixJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUM7aUJBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxPQUFPLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUMsRUFDRixTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUNyQyxDQUFDO1FBRUYsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNsQixPQUFPLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQzNELEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZCxPQUFPLEVBQUUsQ0FBQztnQkFDWixDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUM5QixhQUFhLEVBQ2IsY0FBYyxFQUVkLFFBQVEsRUFDUixDQUFDLENBQ0YsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDSixDQUFDO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUNyRCxJQUFJLGdCQUFnQixFQUFFLENBQUM7WUFDckIsT0FBTyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQ0QsTUFBTSwwQkFBMEIsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSyxvQkFBb0IsQ0FDMUIsYUFBa0MsRUFDbEMsY0FBNEIsRUFDNUIsUUFBVyxFQUNYLFVBQWtCO1FBRWxCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ3pGLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxNQUFNLGFBQWEsR0FBRyxhQUFhLEdBQUcsVUFBVSxDQUFDO1FBQ2pELE1BQU0sT0FBTyxHQUFRLEVBQUUsQ0FBQztRQUV4QiwrRUFBK0U7UUFDL0UsNENBQTRDO1FBQzVDLEVBQUU7UUFDRixzRkFBc0Y7UUFDdEYseURBQXlEO1FBQ3pELEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzVELE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLFlBQVksSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbEMsTUFBTTtZQUNSLENBQUM7WUFDRCxJQUFJLFlBQVksSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsYUFBYSxDQUFDLElBQXVCO1FBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELDhFQUE4RTtJQUM5RSxlQUFlLENBQUMsSUFBdUI7UUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyxDQUFDLElBQU87UUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsV0FBVyxDQUFDLFFBQVc7UUFDckIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxpQkFBaUIsQ0FBQyxRQUFXO1FBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdkMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELGlGQUFpRjtJQUNqRixjQUFjLENBQUMsSUFBdUI7UUFDcEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsK0VBQStFO0lBQy9FLGdCQUFnQixDQUFDLElBQXVCO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQzVDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUNiLFFBQVEsQ0FBQyxNQUFNLENBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ3BELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsRSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUNQLENBQ0YsQ0FBQztJQUNKLENBQUM7SUFFRCxtRkFBbUY7SUFDbkYsd0JBQXdCLENBQUMsS0FBb0I7UUFDM0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELG1EQUFtRDtJQUMzQyxlQUFlLENBQUMsUUFBVztRQUNqQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQixPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQ3ZDLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUMxQixRQUFRLEVBQ1IsUUFBUSxDQUNULENBQUM7WUFDRixPQUFPLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQ25ELE1BQU0sQ0FBQyxDQUFDLFdBQWdCLEVBQUUsWUFBWSxFQUFFLEVBQUU7Z0JBQ3hDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxXQUFXLENBQUM7WUFDckIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUNQLENBQUM7UUFDSixDQUFDO1FBQ0QsTUFBTSwwQkFBMEIsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLDBCQUEwQixDQUFDLFFBQVc7UUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzNCLE9BQU8sWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxPQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDM0QsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNuQixzRkFBc0Y7WUFDdEYsS0FBSyxNQUFNLEtBQUssSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFDRCxPQUFPLFlBQVksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FDbkMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FDMUYsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBRU8sZ0JBQWdCLENBQUMsUUFBVztRQUNsQyxtRUFBbUU7UUFDbkUsdUVBQXVFO1FBQ3ZFLEVBQUU7UUFDRiwyQkFBMkI7UUFDM0Isc0VBQXNFO1FBQ3RFLHFCQUFxQjtRQUNyQixnREFBZ0Q7UUFDaEQsT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUssUUFBeUIsQ0FBQztJQUNyRSxDQUFDO0lBRU8sV0FBVyxDQUFDLElBQU87UUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLGtCQUFrQixDQUFDLElBQU8sRUFBRSxLQUFhLEVBQUUsV0FBeUI7UUFDMUUsNkZBQTZGO1FBQzdGLDJGQUEyRjtRQUMzRixpQkFBaUI7UUFDakIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEUsS0FBSyxJQUFJLFdBQVcsR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLFdBQVcsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUNsRSxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDNUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTdFLElBQUksV0FBVyxHQUFHLFlBQVksRUFBRSxDQUFDO2dCQUMvQixPQUFPLFVBQVUsQ0FBQztZQUNwQixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSyxnQ0FBZ0MsQ0FBQyxLQUFtQixFQUFFLEtBQUssR0FBRyxDQUFDO1FBQ3JFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDckQsc0VBQXNFO1FBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sWUFBWSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxPQUFPLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FDaEMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2YsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVuQyxNQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFELE9BQU8sTUFBTSxDQUNYLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ3BCLFFBQVEsQ0FBQyxJQUFJLENBQ1gsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDZixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsS0FBSyxNQUFNLEtBQUssSUFBSSxVQUFVLElBQUksRUFBRSxFQUFFLENBQUM7b0JBQ3JDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLEVBQ0YsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNyQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLFVBQVUsRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUN0RSxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDL0QsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUNILENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxFQUNGLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDMUIsT0FBTyxPQUFPLENBQUM7UUFDakIsQ0FBQyxFQUFFLEVBQVMsQ0FBQyxDQUNkLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLHFCQUFxQixDQUMzQixLQUFtQixFQUNuQixRQUEyQjtRQUszQixzRUFBc0U7UUFDdEUsMkVBQTJFO1FBQzNFLDRFQUE0RTtRQUM1RSxVQUFVO1FBQ1YsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRSxDQUFDO1lBQ2pELDhDQUE4QztZQUM5QyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDckMsT0FBTyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUN0RCxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQixXQUFXLEVBQUUsY0FBYztnQkFDM0IsY0FBYzthQUNmLENBQUMsQ0FBQyxDQUNKLENBQUM7UUFDSixDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN2RCxxRUFBcUU7WUFDckUsZ0VBQWdFO1lBQ2hFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDekMsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDdkUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEIsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLGNBQWMsRUFBRSxLQUFLO2FBQ3RCLENBQUMsQ0FBQyxFQUNILEdBQUcsQ0FBQyxDQUFDLEVBQUMsY0FBYyxFQUFDLEVBQUUsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDSixDQUFDO2FBQU0sSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDL0Isc0VBQXNFO1lBQ3RFLHdFQUF3RTtZQUN4RSxrRUFBa0U7WUFDbEUsMEJBQTBCO1lBQzFCLE9BQU8sWUFBWSxDQUFDLEVBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQ25FLEdBQUcsQ0FBQyxDQUFDLEVBQUMsY0FBYyxFQUFDLEVBQUUsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUNILENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLDBFQUEwRTtZQUMxRSxzREFBc0Q7WUFDdEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FDdEQsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDckIsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLGNBQWM7YUFDZixDQUFDLENBQUMsQ0FDSixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxjQUE0QjtRQUNwRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRU8sc0JBQXNCLENBQUMsY0FBNEI7UUFDekQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsb0ZBQW9GO0lBQzVFLGlCQUFpQixDQUFDLGNBQTRCO1FBQ3BELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQy9DLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNuQixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUV2QixLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQzNELE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMvQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRWhFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsRCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDSCxDQUFDO3FIQWgvQlUsT0FBTzt5R0FBUCxPQUFPLDRaQStGRCxjQUFjLDZGQUhwQixpQkFBaUIscUZBM0dsQixpREFBaUQsNERBYWpELGlCQUFpQjs7a0dBRWhCLE9BQU87a0JBbEJuQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxVQUFVO29CQUNwQixRQUFRLEVBQUUsU0FBUztvQkFDbkIsUUFBUSxFQUFFLGlEQUFpRDtvQkFDM0QsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSxVQUFVO3dCQUNuQixNQUFNLEVBQUUsTUFBTTt3QkFDZCxXQUFXLEVBQUUsa0NBQWtDO3FCQUNoRDtvQkFDRCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtvQkFDckMsZ0dBQWdHO29CQUNoRyw2RkFBNkY7b0JBQzdGLGtGQUFrRjtvQkFDbEYsK0NBQStDO29CQUMvQyxlQUFlLEVBQUUsdUJBQXVCLENBQUMsT0FBTztvQkFDaEQsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLE9BQU8sRUFBRSxDQUFDLGlCQUFpQixDQUFDO2lCQUM3QjtpSkE0Q0ssVUFBVTtzQkFEYixLQUFLO2dCQWtCRyxXQUFXO3NCQUFuQixLQUFLO2dCQVFHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBUUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQVFHLE9BQU87c0JBQWYsS0FBSztnQkFLRyxZQUFZO3NCQUFwQixLQUFLO2dCQUd3QyxXQUFXO3NCQUF4RCxTQUFTO3VCQUFDLGlCQUFpQixFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQztnQkFRNUMsU0FBUztzQkFMUixlQUFlO3VCQUFDLGNBQWMsRUFBRTt3QkFDL0IsdUVBQXVFO3dCQUN2RSw4Q0FBOEM7d0JBQzlDLFdBQVcsRUFBRSxJQUFJO3FCQUNsQjs7QUFnNUJIOztHQUVHO0FBaUJILE1BQU0sT0FBTyxXQUFXO0lBR3RCOzs7Ozs7T0FNRztJQUNILElBQWEsSUFBSTtRQUNmLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJLElBQUksQ0FBQyxLQUEyQjtRQUNsQyxzREFBc0Q7SUFDeEQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFDSSxZQUFZO1FBQ2QsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUNELElBQUksWUFBWSxDQUFDLFlBQXFCO1FBQ3BDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxZQUFZLENBQUM7UUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUNuRSxPQUFPO1FBQ1QsQ0FBQztRQUNELHdFQUF3RTtRQUN4RSxxQkFBcUI7UUFDckIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEIsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLEtBQUssRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQixDQUFDO0lBQ0gsQ0FBQztJQUVELElBQ0ksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFDRCxJQUFJLFVBQVUsQ0FBQyxVQUFtQjtRQUNoQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDO1FBQ25DLElBQUksVUFBVSxFQUFFLENBQUM7WUFDZixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbEIsQ0FBQztJQUNILENBQUM7SUFjRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDekYsQ0FBQztJQVVEOzs7T0FHRzthQUNJLHVCQUFrQixHQUE0QixJQUFJLEFBQWhDLENBQWlDO0lBbUIxRCw0QkFBNEI7SUFDNUIsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFDRCxJQUFJLElBQUksQ0FBQyxLQUFRO1FBQ2YsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0IsQ0FBQztJQUNILENBQUM7SUFHRCxxRUFBcUU7SUFDckUsSUFBSSxVQUFVO1FBQ1osaUZBQWlGO1FBQ2pGLElBQ0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsWUFBWSxLQUFLLFNBQVM7WUFDbEQsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUNoRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7WUFFWixtRUFBbUU7UUFDckUsQ0FBQzthQUFNLElBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsWUFBWSxLQUFLLFNBQVM7WUFDbEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUMvRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsSUFBSSxLQUFLO1FBQ1AsK0VBQStFO1FBQy9FLDJGQUEyRjtRQUMzRiwrRUFBK0U7UUFDL0UsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDO0lBQ3ZFLENBQUM7SUFFRCxpREFBaUQ7SUFDakQsYUFBYTtRQUNYLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDO1lBRUQseUVBQXlFO1lBQ3pFLDRCQUE0QjtZQUM1QixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGdCQUFnQjtRQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxpQkFBaUI7UUFDZixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFJRCxZQUNZLFdBQW9DLEVBQ3BDLEtBQW9CO1FBRHBCLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUNwQyxVQUFLLEdBQUwsS0FBSyxDQUFlO1FBNUx0QixjQUFTLEdBQWtCLENBQUMsQ0FBQyxDQUFDO1FBc0V4Qyw0RkFBNEY7UUFFbkYsZUFBVSxHQUFvQixJQUFJLFlBQVksRUFBSyxDQUFDO1FBRTdELG9FQUFvRTtRQUUzRCxtQkFBYyxHQUEwQixJQUFJLFlBQVksRUFBVyxDQUFDO1FBUTdFLGdFQUFnRTtRQUM3QyxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUVwRCw4Q0FBOEM7UUFDckMsaUJBQVksR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBRXBDLHVCQUFrQixHQUFZLEtBQUssQ0FBQztRQUNwQyxxQkFBZ0IsR0FBd0IsU0FBUyxDQUFDO1FBQzFEOzs7OztXQUtHO1FBQ0ssaUJBQVksR0FBRyxJQUFJLENBQUM7UUFzRnBCLHVCQUFrQixHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBTXJELFdBQVcsQ0FBQyxrQkFBa0IsR0FBRyxJQUF5QixDQUFDO0lBQzdELENBQUM7SUFFRCxRQUFRO1FBQ04sSUFBSSxDQUFDLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLEtBQUs7YUFDUCxrQkFBa0IsRUFBRTthQUNwQixPQUFPLENBQUMsSUFBSSxDQUNYLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQzFCLG9CQUFvQixFQUFFLENBQ3ZCO2FBQ0EsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUNkLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELFdBQVc7UUFDVCxpREFBaUQ7UUFDakQsbURBQW1EO1FBQ25ELElBQUksV0FBVyxDQUFDLGtCQUFrQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQzVDLFdBQVcsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDeEMsQ0FBQztRQUVELElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDakQsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELGtFQUFrRTtJQUNsRSxLQUFLO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRUQsOEJBQThCO0lBQzlCLE9BQU87UUFDTCxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRXBCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRUQscUVBQXFFO0lBQ3JFLFFBQVE7UUFDTixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsb0VBQW9FO0lBQ3BFLFFBQVE7UUFDTixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7SUFFRCxrRUFBa0U7SUFDbEUsTUFBTTtRQUNKLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0gsQ0FBQztJQUVELFVBQVU7UUFDUixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsY0FBYztRQUNaLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3BCLE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQzNCLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxRQUFpQjtRQUNuQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNyQyxDQUFDO3FIQTlSVSxXQUFXO3lHQUFYLFdBQVcsd0hBd0JILGdCQUFnQixzRUFtQ2hCLGdCQUFnQjs7a0dBM0R4QixXQUFXO2tCQWhCdkIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsZUFBZTtvQkFDekIsUUFBUSxFQUFFLGFBQWE7b0JBQ3ZCLElBQUksRUFBRTt3QkFDSixPQUFPLEVBQUUsZUFBZTt3QkFDeEIsc0JBQXNCLEVBQUUsb0JBQW9CO3dCQUM1QyxtQkFBbUIsRUFBRSxXQUFXO3dCQUNoQyxzQkFBc0IsRUFBRSxxQkFBcUI7d0JBQzdDLHFCQUFxQixFQUFFLGVBQWU7d0JBQ3RDLFlBQVksRUFBRSxXQUFXO3dCQUN6QixNQUFNLEVBQUUsVUFBVTt3QkFDbEIsU0FBUyxFQUFFLGtCQUFrQjt3QkFDN0IsU0FBUyxFQUFFLGNBQWM7cUJBQzFCO29CQUNELFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtrR0FXYyxJQUFJO3NCQUFoQixLQUFLO2dCQWVGLFlBQVk7c0JBRGYsS0FBSzt1QkFBQyxFQUFDLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQztnQkFtQmhDLFVBQVU7c0JBRGIsS0FBSztnQkFpQmdDLFVBQVU7c0JBQS9DLEtBQUs7dUJBQUMsRUFBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUM7Z0JBTUEsY0FBYztzQkFBakQsS0FBSzt1QkFBQywyQkFBMkI7Z0JBUXpCLFVBQVU7c0JBRGxCLE1BQU07Z0JBS0UsY0FBYztzQkFEdEIsTUFBTTs7QUFxTlQsU0FBUyxzQkFBc0IsQ0FBQyxXQUF3QjtJQUN0RCxJQUFJLE1BQU0sR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO0lBQ3ZDLE9BQU8sTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDeEMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7SUFDaEMsQ0FBQztJQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2xELE1BQU0sS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7UUFDcEUsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1osQ0FBQztJQUNILENBQUM7U0FBTSxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztRQUM3RCxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBRSxDQUFDLENBQUM7SUFDN0QsQ0FBQztTQUFNLENBQUM7UUFDTiw4Q0FBOEM7UUFDOUMsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE9BQW9CO0lBQ3pDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDcEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLHNCQUFzQixDQUFDLElBQUksU0FBUyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQzVGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFRSRUVfS0VZX01BTkFHRVIsXG4gIFRyZWVLZXlNYW5hZ2VyRmFjdG9yeSxcbiAgVHJlZUtleU1hbmFnZXJJdGVtLFxuICBUcmVlS2V5TWFuYWdlck9wdGlvbnMsXG4gIFRyZWVLZXlNYW5hZ2VyU3RyYXRlZ3ksXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIENvbGxlY3Rpb25WaWV3ZXIsXG4gIERhdGFTb3VyY2UsXG4gIGlzRGF0YVNvdXJjZSxcbiAgU2VsZWN0aW9uQ2hhbmdlLFxuICBTZWxlY3Rpb25Nb2RlbCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvbGxlY3Rpb25zJztcbmltcG9ydCB7XG4gIEFmdGVyQ29udGVudENoZWNrZWQsXG4gIEFmdGVyQ29udGVudEluaXQsXG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBFbWJlZGRlZFZpZXdSZWYsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUcmFja0J5RnVuY3Rpb24sXG4gIFZpZXdDaGlsZCxcbiAgVmlld0NvbnRhaW5lclJlZixcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG4gIG51bWJlckF0dHJpYnV0ZSxcbiAgaW5qZWN0LFxuICBib29sZWFuQXR0cmlidXRlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Y29lcmNlT2JzZXJ2YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uL3ByaXZhdGUnO1xuaW1wb3J0IHtcbiAgQmVoYXZpb3JTdWJqZWN0LFxuICBjb21iaW5lTGF0ZXN0LFxuICBjb25jYXQsXG4gIEVNUFRZLFxuICBPYnNlcnZhYmxlLFxuICBTdWJqZWN0LFxuICBTdWJzY3JpcHRpb24sXG4gIGlzT2JzZXJ2YWJsZSxcbiAgb2YgYXMgb2JzZXJ2YWJsZU9mLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIGRpc3RpbmN0VW50aWxDaGFuZ2VkLFxuICBjb25jYXRNYXAsXG4gIG1hcCxcbiAgcmVkdWNlLFxuICBzdGFydFdpdGgsXG4gIHN3aXRjaE1hcCxcbiAgdGFrZSxcbiAgdGFrZVVudGlsLFxuICB0YXAsXG59IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7VHJlZUNvbnRyb2x9IGZyb20gJy4vY29udHJvbC90cmVlLWNvbnRyb2wnO1xuaW1wb3J0IHtDZGtUcmVlTm9kZURlZiwgQ2RrVHJlZU5vZGVPdXRsZXRDb250ZXh0fSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtDZGtUcmVlTm9kZU91dGxldH0gZnJvbSAnLi9vdXRsZXQnO1xuaW1wb3J0IHtcbiAgZ2V0TXVsdGlwbGVUcmVlQ29udHJvbHNFcnJvcixcbiAgZ2V0VHJlZUNvbnRyb2xNaXNzaW5nRXJyb3IsXG4gIGdldFRyZWVNaXNzaW5nTWF0Y2hpbmdOb2RlRGVmRXJyb3IsXG4gIGdldFRyZWVNdWx0aXBsZURlZmF1bHROb2RlRGVmc0Vycm9yLFxuICBnZXRUcmVlTm9WYWxpZERhdGFTb3VyY2VFcnJvcixcbn0gZnJvbSAnLi90cmVlLWVycm9ycyc7XG5cbnR5cGUgUmVuZGVyaW5nRGF0YTxUPiA9XG4gIHwge1xuICAgICAgZmxhdHRlbmVkTm9kZXM6IG51bGw7XG4gICAgICBub2RlVHlwZTogbnVsbDtcbiAgICAgIHJlbmRlck5vZGVzOiByZWFkb25seSBUW107XG4gICAgfVxuICB8IHtcbiAgICAgIGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW107XG4gICAgICBub2RlVHlwZTogJ25lc3RlZCcgfCAnZmxhdCc7XG4gICAgICByZW5kZXJOb2RlczogcmVhZG9ubHkgVFtdO1xuICAgIH07XG5cbi8qKlxuICogQ0RLIHRyZWUgY29tcG9uZW50IHRoYXQgY29ubmVjdHMgd2l0aCBhIGRhdGEgc291cmNlIHRvIHJldHJpZXZlIGRhdGEgb2YgdHlwZSBgVGAgYW5kIHJlbmRlcnNcbiAqIGRhdGFOb2RlcyB3aXRoIGhpZXJhcmNoeS4gVXBkYXRlcyB0aGUgZGF0YU5vZGVzIHdoZW4gbmV3IGRhdGEgaXMgcHJvdmlkZWQgYnkgdGhlIGRhdGEgc291cmNlLlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstdHJlZScsXG4gIGV4cG9ydEFzOiAnY2RrVHJlZScsXG4gIHRlbXBsYXRlOiBgPG5nLWNvbnRhaW5lciBjZGtUcmVlTm9kZU91dGxldD48L25nLWNvbnRhaW5lcj5gLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay10cmVlJyxcbiAgICAncm9sZSc6ICd0cmVlJyxcbiAgICAnKGtleWRvd24pJzogJ19zZW5kS2V5ZG93blRvS2V5TWFuYWdlcigkZXZlbnQpJyxcbiAgfSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgLy8gVGhlIFwiT25QdXNoXCIgc3RhdHVzIGZvciB0aGUgYENka1RyZWVgIGNvbXBvbmVudCBpcyBlZmZlY3RpdmVseSBhIG5vb3AsIHNvIHdlIGFyZSByZW1vdmluZyBpdC5cbiAgLy8gVGhlIHZpZXcgZm9yIGBDZGtUcmVlYCBjb25zaXN0cyBlbnRpcmVseSBvZiB0ZW1wbGF0ZXMgZGVjbGFyZWQgaW4gb3RoZXIgdmlld3MuIEFzIHRoZXkgYXJlXG4gIC8vIGRlY2xhcmVkIGVsc2V3aGVyZSwgdGhleSBhcmUgY2hlY2tlZCB3aGVuIHRoZWlyIGRlY2xhcmF0aW9uIHBvaW50cyBhcmUgY2hlY2tlZC5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBpbXBvcnRzOiBbQ2RrVHJlZU5vZGVPdXRsZXRdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlPFQsIEsgPSBUPlxuICBpbXBsZW1lbnRzXG4gICAgQWZ0ZXJDb250ZW50Q2hlY2tlZCxcbiAgICBBZnRlckNvbnRlbnRJbml0LFxuICAgIEFmdGVyVmlld0luaXQsXG4gICAgQ29sbGVjdGlvblZpZXdlcixcbiAgICBPbkRlc3Ryb3ksXG4gICAgT25Jbml0XG57XG4gIC8qKiBTdWJqZWN0IHRoYXQgZW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGhhcyBiZWVuIGRlc3Ryb3llZC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfb25EZXN0cm95ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRGlmZmVyIHVzZWQgdG8gZmluZCB0aGUgY2hhbmdlcyBpbiB0aGUgZGF0YSBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuICovXG4gIHByaXZhdGUgX2RhdGFEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+O1xuXG4gIC8qKiBTdG9yZXMgdGhlIG5vZGUgZGVmaW5pdGlvbiB0aGF0IGRvZXMgbm90IGhhdmUgYSB3aGVuIHByZWRpY2F0ZS4gKi9cbiAgcHJpdmF0ZSBfZGVmYXVsdE5vZGVEZWY6IENka1RyZWVOb2RlRGVmPFQ+IHwgbnVsbDtcblxuICAvKiogRGF0YSBzdWJzY3JpcHRpb24gKi9cbiAgcHJpdmF0ZSBfZGF0YVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuICAvKiogTGV2ZWwgb2Ygbm9kZXMgKi9cbiAgcHJpdmF0ZSBfbGV2ZWxzOiBNYXA8SywgbnVtYmVyPiA9IG5ldyBNYXA8SywgbnVtYmVyPigpO1xuXG4gIC8qKiBUaGUgaW1tZWRpYXRlIHBhcmVudHMgZm9yIGEgbm9kZS4gVGhpcyBpcyBgbnVsbGAgaWYgdGhlcmUgaXMgbm8gcGFyZW50LiAqL1xuICBwcml2YXRlIF9wYXJlbnRzOiBNYXA8SywgVCB8IG51bGw+ID0gbmV3IE1hcDxLLCBUIHwgbnVsbD4oKTtcblxuICAvKipcbiAgICogTm9kZXMgZ3JvdXBlZCBpbnRvIGVhY2ggc2V0LCB3aGljaCBpcyBhIGxpc3Qgb2Ygbm9kZXMgZGlzcGxheWVkIHRvZ2V0aGVyIGluIHRoZSBET00uXG4gICAqXG4gICAqIExvb2t1cCBrZXkgaXMgdGhlIHBhcmVudCBvZiBhIHNldC4gUm9vdCBub2RlcyBoYXZlIGtleSBvZiBudWxsLlxuICAgKlxuICAgKiBWYWx1ZXMgaXMgYSAnc2V0JyBvZiB0cmVlIG5vZGVzLiBFYWNoIHRyZWUgbm9kZSBtYXBzIHRvIGEgdHJlZWl0ZW0gZWxlbWVudC4gU2V0cyBhcmUgaW4gdGhlXG4gICAqIG9yZGVyIHRoYXQgaXQgaXMgcmVuZGVyZWQuIEVhY2ggc2V0IG1hcHMgZGlyZWN0bHkgdG8gYXJpYS1wb3NpbnNldCBhbmQgYXJpYS1zZXRzaXplIGF0dHJpYnV0ZXMuXG4gICAqL1xuICBwcml2YXRlIF9hcmlhU2V0czogTWFwPEsgfCBudWxsLCBUW10+ID0gbmV3IE1hcDxLIHwgbnVsbCwgVFtdPigpO1xuXG4gIC8qKlxuICAgKiBQcm92aWRlcyBhIHN0cmVhbSBjb250YWluaW5nIHRoZSBsYXRlc3QgZGF0YSBhcnJheSB0byByZW5kZXIuIEluZmx1ZW5jZWQgYnkgdGhlIHRyZWUnc1xuICAgKiBzdHJlYW0gb2YgdmlldyB3aW5kb3cgKHdoYXQgZGF0YU5vZGVzIGFyZSBjdXJyZW50bHkgb24gc2NyZWVuKS5cbiAgICogRGF0YSBzb3VyY2UgY2FuIGJlIGFuIG9ic2VydmFibGUgb2YgZGF0YSBhcnJheSwgb3IgYSBkYXRhIGFycmF5IHRvIHJlbmRlci5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBkYXRhU291cmNlKCk6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBUW10ge1xuICAgIHJldHVybiB0aGlzLl9kYXRhU291cmNlO1xuICB9XG4gIHNldCBkYXRhU291cmNlKGRhdGFTb3VyY2U6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBUW10pIHtcbiAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSAhPT0gZGF0YVNvdXJjZSkge1xuICAgICAgdGhpcy5fc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGF0YVNvdXJjZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXTtcblxuICAvKipcbiAgICogVGhlIHRyZWUgY29udHJvbGxlclxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2Ugb25lIG9mIGBsZXZlbEFjY2Vzc29yYCBvciBgY2hpbGRyZW5BY2Nlc3NvcmAgaW5zdGVhZC4gVG8gYmUgcmVtb3ZlZCBpbiBhXG4gICAqIGZ1dHVyZSB2ZXJzaW9uLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDIxLjAuMFxuICAgKi9cbiAgQElucHV0KCkgdHJlZUNvbnRyb2w/OiBUcmVlQ29udHJvbDxULCBLPjtcblxuICAvKipcbiAgICogR2l2ZW4gYSBkYXRhIG5vZGUsIGRldGVybWluZXMgd2hhdCB0cmVlIGxldmVsIHRoZSBub2RlIGlzIGF0LlxuICAgKlxuICAgKiBPbmUgb2YgbGV2ZWxBY2Nlc3NvciBvciBjaGlsZHJlbkFjY2Vzc29yIG11c3QgYmUgc3BlY2lmaWVkLCBub3QgYm90aC5cbiAgICogVGhpcyBpcyBlbmZvcmNlZCBhdCBydW4tdGltZS5cbiAgICovXG4gIEBJbnB1dCgpIGxldmVsQWNjZXNzb3I/OiAoZGF0YU5vZGU6IFQpID0+IG51bWJlcjtcblxuICAvKipcbiAgICogR2l2ZW4gYSBkYXRhIG5vZGUsIGRldGVybWluZXMgd2hhdCB0aGUgY2hpbGRyZW4gb2YgdGhhdCBub2RlIGFyZS5cbiAgICpcbiAgICogT25lIG9mIGxldmVsQWNjZXNzb3Igb3IgY2hpbGRyZW5BY2Nlc3NvciBtdXN0IGJlIHNwZWNpZmllZCwgbm90IGJvdGguXG4gICAqIFRoaXMgaXMgZW5mb3JjZWQgYXQgcnVuLXRpbWUuXG4gICAqL1xuICBASW5wdXQoKSBjaGlsZHJlbkFjY2Vzc29yPzogKGRhdGFOb2RlOiBUKSA9PiBUW10gfCBPYnNlcnZhYmxlPFRbXT47XG5cbiAgLyoqXG4gICAqIFRyYWNraW5nIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGNoZWNrIHRoZSBkaWZmZXJlbmNlcyBpbiBkYXRhIGNoYW5nZXMuIFVzZWQgc2ltaWxhcmx5XG4gICAqIHRvIGBuZ0ZvcmAgYHRyYWNrQnlgIGZ1bmN0aW9uLiBPcHRpbWl6ZSBub2RlIG9wZXJhdGlvbnMgYnkgaWRlbnRpZnlpbmcgYSBub2RlIGJhc2VkIG9uIGl0cyBkYXRhXG4gICAqIHJlbGF0aXZlIHRvIHRoZSBmdW5jdGlvbiB0byBrbm93IGlmIGEgbm9kZSBzaG91bGQgYmUgYWRkZWQvcmVtb3ZlZC9tb3ZlZC5cbiAgICogQWNjZXB0cyBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdHdvIHBhcmFtZXRlcnMsIGBpbmRleGAgYW5kIGBpdGVtYC5cbiAgICovXG4gIEBJbnB1dCgpIHRyYWNrQnk6IFRyYWNrQnlGdW5jdGlvbjxUPjtcblxuICAvKipcbiAgICogR2l2ZW4gYSBkYXRhIG5vZGUsIGRldGVybWluZXMgdGhlIGtleSBieSB3aGljaCB3ZSBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdGhpcyBub2RlIGlzIGV4cGFuZGVkLlxuICAgKi9cbiAgQElucHV0KCkgZXhwYW5zaW9uS2V5PzogKGRhdGFOb2RlOiBUKSA9PiBLO1xuXG4gIC8vIE91dGxldHMgd2l0aGluIHRoZSB0cmVlJ3MgdGVtcGxhdGUgd2hlcmUgdGhlIGRhdGFOb2RlcyB3aWxsIGJlIGluc2VydGVkLlxuICBAVmlld0NoaWxkKENka1RyZWVOb2RlT3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX25vZGVPdXRsZXQ6IENka1RyZWVOb2RlT3V0bGV0O1xuXG4gIC8qKiBUaGUgdHJlZSBub2RlIHRlbXBsYXRlIGZvciB0aGUgdHJlZSAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1RyZWVOb2RlRGVmLCB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgYGRlc2NlbmRhbnRzOiB0cnVlYCwgYmVjYXVzZSBJdnkgd2lsbCBubyBsb25nZXIgbWF0Y2hcbiAgICAvLyBpbmRpcmVjdCBkZXNjZW5kYW50cyBpZiBpdCdzIGxlZnQgYXMgZmFsc2UuXG4gICAgZGVzY2VuZGFudHM6IHRydWUsXG4gIH0pXG4gIF9ub2RlRGVmczogUXVlcnlMaXN0PENka1RyZWVOb2RlRGVmPFQ+PjtcblxuICAvLyBUT0RPKHRpbmF5dWFuZ2FvKTogU2V0dXAgYSBsaXN0ZW5lciBmb3Igc2Nyb2xsaW5nLCBlbWl0IHRoZSBjYWxjdWxhdGVkIHZpZXcgdG8gdmlld0NoYW5nZS5cbiAgLy8gICAgIFJlbW92ZSB0aGUgTUFYX1ZBTFVFIGluIHZpZXdDaGFuZ2VcbiAgLyoqXG4gICAqIFN0cmVhbSBjb250YWluaW5nIHRoZSBsYXRlc3QgaW5mb3JtYXRpb24gb24gd2hhdCByb3dzIGFyZSBiZWluZyBkaXNwbGF5ZWQgb24gc2NyZWVuLlxuICAgKiBDYW4gYmUgdXNlZCBieSB0aGUgZGF0YSBzb3VyY2UgdG8gYXMgYSBoZXVyaXN0aWMgb2Ygd2hhdCBkYXRhIHNob3VsZCBiZSBwcm92aWRlZC5cbiAgICovXG4gIHJlYWRvbmx5IHZpZXdDaGFuZ2UgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PHtzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcn0+KHtcbiAgICBzdGFydDogMCxcbiAgICBlbmQ6IE51bWJlci5NQVhfVkFMVUUsXG4gIH0pO1xuXG4gIC8qKiBLZWVwIHRyYWNrIG9mIHdoaWNoIG5vZGVzIGFyZSBleHBhbmRlZC4gKi9cbiAgcHJpdmF0ZSBfZXhwYW5zaW9uTW9kZWw/OiBTZWxlY3Rpb25Nb2RlbDxLPjtcblxuICAvKipcbiAgICogTWFpbnRhaW4gYSBzeW5jaHJvbm91cyBjYWNoZSBvZiBmbGF0dGVuZWQgZGF0YSBub2Rlcy4gVGhpcyB3aWxsIG9ubHkgYmVcbiAgICogcG9wdWxhdGVkIGFmdGVyIGluaXRpYWwgcmVuZGVyLCBhbmQgaW4gY2VydGFpbiBjYXNlcywgd2lsbCBiZSBkZWxheWVkIGR1ZSB0b1xuICAgKiByZWx5aW5nIG9uIE9ic2VydmFibGUgYGdldENoaWxkcmVuYCBjYWxscy5cbiAgICovXG4gIHByaXZhdGUgX2ZsYXR0ZW5lZE5vZGVzOiBCZWhhdmlvclN1YmplY3Q8cmVhZG9ubHkgVFtdPiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8cmVhZG9ubHkgVFtdPihbXSk7XG5cbiAgLyoqIFRoZSBhdXRvbWF0aWNhbGx5IGRldGVybWluZWQgbm9kZSB0eXBlIGZvciB0aGUgdHJlZS4gKi9cbiAgcHJpdmF0ZSBfbm9kZVR5cGU6IEJlaGF2aW9yU3ViamVjdDwnZmxhdCcgfCAnbmVzdGVkJyB8IG51bGw+ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxcbiAgICAnZmxhdCcgfCAnbmVzdGVkJyB8IG51bGxcbiAgPihudWxsKTtcblxuICAvKiogVGhlIG1hcHBpbmcgYmV0d2VlbiBkYXRhIGFuZCB0aGUgbm9kZSB0aGF0IGlzIHJlbmRlcmVkLiAqL1xuICBwcml2YXRlIF9ub2RlczogQmVoYXZpb3JTdWJqZWN0PE1hcDxLLCBDZGtUcmVlTm9kZTxULCBLPj4+ID0gbmV3IEJlaGF2aW9yU3ViamVjdChcbiAgICBuZXcgTWFwPEssIENka1RyZWVOb2RlPFQsIEs+PigpLFxuICApO1xuXG4gIC8qKlxuICAgKiBTeW5jaHJvbm91cyBjYWNoZSBvZiBub2RlcyBmb3IgdGhlIGBUcmVlS2V5TWFuYWdlcmAuIFRoaXMgaXMgc2VwYXJhdGVcbiAgICogZnJvbSBgX2ZsYXR0ZW5lZE5vZGVzYCBzbyB0aGV5IGNhbiBiZSBpbmRlcGVuZGVudGx5IHVwZGF0ZWQgYXQgZGlmZmVyZW50XG4gICAqIHRpbWVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfa2V5TWFuYWdlck5vZGVzOiBCZWhhdmlvclN1YmplY3Q8cmVhZG9ubHkgVFtdPiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8cmVhZG9ubHkgVFtdPihbXSk7XG5cbiAgcHJpdmF0ZSBfa2V5TWFuYWdlckZhY3RvcnkgPSBpbmplY3QoVFJFRV9LRVlfTUFOQUdFUikgYXMgVHJlZUtleU1hbmFnZXJGYWN0b3J5PENka1RyZWVOb2RlPFQsIEs+PjtcblxuICAvKiogVGhlIGtleSBtYW5hZ2VyIGZvciB0aGlzIHRyZWUuIEhhbmRsZXMgZm9jdXMgYW5kIGFjdGl2YXRpb24gYmFzZWQgb24gdXNlciBrZXlib2FyZCBpbnB1dC4gKi9cbiAgX2tleU1hbmFnZXI6IFRyZWVLZXlNYW5hZ2VyU3RyYXRlZ3k8Q2RrVHJlZU5vZGU8VCwgSz4+O1xuICBwcml2YXRlIF92aWV3SW5pdCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX2RpZmZlcnM6IEl0ZXJhYmxlRGlmZmVycyxcbiAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSxcbiAgKSB7fVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplS2V5TWFuYWdlcigpO1xuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCkge1xuICAgIHRoaXMuX3VwZGF0ZURlZmF1bHROb2RlRGVmaW5pdGlvbigpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvRGF0YUNoYW5nZXMoKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX25vZGVPdXRsZXQudmlld0NvbnRhaW5lci5jbGVhcigpO1xuXG4gICAgdGhpcy52aWV3Q2hhbmdlLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb25EZXN0cm95Lm5leHQoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kuY29tcGxldGUoKTtcblxuICAgIGlmICh0aGlzLl9kYXRhU291cmNlICYmIHR5cGVvZiAodGhpcy5fZGF0YVNvdXJjZSBhcyBEYXRhU291cmNlPFQ+KS5kaXNjb25uZWN0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAodGhpcy5kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QodGhpcyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2RhdGFTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2RhdGFTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgIH1cblxuICAgIC8vIEluIGNlcnRhaW4gdGVzdHMsIHRoZSB0cmVlIG1pZ2h0IGJlIGRlc3Ryb3llZCBiZWZvcmUgdGhpcyBpcyBpbml0aWFsaXplZFxuICAgIC8vIGluIGBuZ0FmdGVyQ29udGVudEluaXRgLlxuICAgIHRoaXMuX2tleU1hbmFnZXI/LmRlc3Ryb3koKTtcbiAgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuX2NoZWNrVHJlZUNvbnRyb2xVc2FnZSgpO1xuICAgIHRoaXMuX2luaXRpYWxpemVEYXRhRGlmZmVyKCk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5fdmlld0luaXQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlRGVmYXVsdE5vZGVEZWZpbml0aW9uKCkge1xuICAgIGNvbnN0IGRlZmF1bHROb2RlRGVmcyA9IHRoaXMuX25vZGVEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuKTtcbiAgICBpZiAoZGVmYXVsdE5vZGVEZWZzLmxlbmd0aCA+IDEgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRyZWVNdWx0aXBsZURlZmF1bHROb2RlRGVmc0Vycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHROb2RlRGVmID0gZGVmYXVsdE5vZGVEZWZzWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG5vZGUgdHlwZSBmb3IgdGhlIHRyZWUsIGlmIGl0IGhhc24ndCBiZWVuIHNldCB5ZXQuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBiZSBjYWxsZWQgYnkgdGhlIGZpcnN0IG5vZGUgdGhhdCdzIHJlbmRlcmVkIGluIG9yZGVyIGZvciB0aGUgdHJlZVxuICAgKiB0byBkZXRlcm1pbmUgd2hhdCBkYXRhIHRyYW5zZm9ybWF0aW9ucyBhcmUgcmVxdWlyZWQuXG4gICAqL1xuICBfc2V0Tm9kZVR5cGVJZlVuc2V0KG5vZGVUeXBlOiAnZmxhdCcgfCAnbmVzdGVkJykge1xuICAgIGlmICh0aGlzLl9ub2RlVHlwZS52YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fbm9kZVR5cGUubmV4dChub2RlVHlwZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN3aXRjaCB0byB0aGUgcHJvdmlkZWQgZGF0YSBzb3VyY2UgYnkgcmVzZXR0aW5nIHRoZSBkYXRhIGFuZCB1bnN1YnNjcmliaW5nIGZyb20gdGhlIGN1cnJlbnRcbiAgICogcmVuZGVyIGNoYW5nZSBzdWJzY3JpcHRpb24gaWYgb25lIGV4aXN0cy4gSWYgdGhlIGRhdGEgc291cmNlIGlzIG51bGwsIGludGVycHJldCB0aGlzIGJ5XG4gICAqIGNsZWFyaW5nIHRoZSBub2RlIG91dGxldC4gT3RoZXJ3aXNlIHN0YXJ0IGxpc3RlbmluZyBmb3IgbmV3IGRhdGEuXG4gICAqL1xuICBwcml2YXRlIF9zd2l0Y2hEYXRhU291cmNlKGRhdGFTb3VyY2U6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBUW10pIHtcbiAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSAmJiB0eXBlb2YgKHRoaXMuX2RhdGFTb3VyY2UgYXMgRGF0YVNvdXJjZTxUPikuZGlzY29ubmVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgKHRoaXMuZGF0YVNvdXJjZSBhcyBEYXRhU291cmNlPFQ+KS5kaXNjb25uZWN0KHRoaXMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9kYXRhU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9kYXRhU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLl9kYXRhU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgdGhlIGFsbCBkYXRhTm9kZXMgaWYgdGhlcmUgaXMgbm93IG5vIGRhdGEgc291cmNlXG4gICAgaWYgKCFkYXRhU291cmNlKSB7XG4gICAgICB0aGlzLl9ub2RlT3V0bGV0LnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgICBpZiAodGhpcy5fbm9kZURlZnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvRGF0YUNoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0RXhwYW5zaW9uTW9kZWwoKSB7XG4gICAgaWYgKCF0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLl9leHBhbnNpb25Nb2RlbCA/Pz0gbmV3IFNlbGVjdGlvbk1vZGVsPEs+KHRydWUpO1xuICAgICAgcmV0dXJuIHRoaXMuX2V4cGFuc2lvbk1vZGVsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50cmVlQ29udHJvbC5leHBhbnNpb25Nb2RlbDtcbiAgfVxuXG4gIC8qKiBTZXQgdXAgYSBzdWJzY3JpcHRpb24gZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9EYXRhQ2hhbmdlcygpIHtcbiAgICBpZiAodGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBkYXRhU3RyZWFtOiBPYnNlcnZhYmxlPHJlYWRvbmx5IFRbXT4gfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNEYXRhU291cmNlKHRoaXMuX2RhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5fZGF0YVNvdXJjZS5jb25uZWN0KHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoaXNPYnNlcnZhYmxlKHRoaXMuX2RhdGFTb3VyY2UpKSB7XG4gICAgICBkYXRhU3RyZWFtID0gdGhpcy5fZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSBvYnNlcnZhYmxlT2YodGhpcy5fZGF0YVNvdXJjZSk7XG4gICAgfVxuXG4gICAgaWYgKCFkYXRhU3RyZWFtKSB7XG4gICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICAgIHRocm93IGdldFRyZWVOb1ZhbGlkRGF0YVNvdXJjZUVycm9yKCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IHRoaXMuX2dldFJlbmRlckRhdGEoZGF0YVN0cmVhbSlcbiAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgLnN1YnNjcmliZShyZW5kZXJpbmdEYXRhID0+IHtcbiAgICAgICAgdGhpcy5fcmVuZGVyRGF0YUNoYW5nZXMocmVuZGVyaW5nRGF0YSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKiBHaXZlbiBhbiBPYnNlcnZhYmxlIGNvbnRhaW5pbmcgYSBzdHJlYW0gb2YgdGhlIHJhdyBkYXRhLCByZXR1cm5zIGFuIE9ic2VydmFibGUgY29udGFpbmluZyB0aGUgUmVuZGVyaW5nRGF0YSAqL1xuICBwcml2YXRlIF9nZXRSZW5kZXJEYXRhKGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPik6IE9ic2VydmFibGU8UmVuZGVyaW5nRGF0YTxUPj4ge1xuICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZ2V0RXhwYW5zaW9uTW9kZWwoKTtcbiAgICByZXR1cm4gY29tYmluZUxhdGVzdChbXG4gICAgICBkYXRhU3RyZWFtLFxuICAgICAgdGhpcy5fbm9kZVR5cGUsXG4gICAgICAvLyBXZSBkb24ndCB1c2UgdGhlIGV4cGFuc2lvbiBkYXRhIGRpcmVjdGx5LCBob3dldmVyIHdlIGFkZCBpdCBoZXJlIHRvIGVzc2VudGlhbGx5XG4gICAgICAvLyB0cmlnZ2VyIGRhdGEgcmVuZGVyaW5nIHdoZW4gZXhwYW5zaW9uIGNoYW5nZXMgb2NjdXIuXG4gICAgICBleHBhbnNpb25Nb2RlbC5jaGFuZ2VkLnBpcGUoXG4gICAgICAgIHN0YXJ0V2l0aChudWxsKSxcbiAgICAgICAgdGFwKGV4cGFuc2lvbkNoYW5nZXMgPT4ge1xuICAgICAgICAgIHRoaXMuX2VtaXRFeHBhbnNpb25DaGFuZ2VzKGV4cGFuc2lvbkNoYW5nZXMpO1xuICAgICAgICB9KSxcbiAgICAgICksXG4gICAgXSkucGlwZShcbiAgICAgIHN3aXRjaE1hcCgoW2RhdGEsIG5vZGVUeXBlXSkgPT4ge1xuICAgICAgICBpZiAobm9kZVR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHtyZW5kZXJOb2RlczogZGF0YSwgZmxhdHRlbmVkTm9kZXM6IG51bGwsIG5vZGVUeXBlfSBhcyBjb25zdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSdyZSBoZXJlLCB0aGVuIHdlIGtub3cgd2hhdCBvdXIgbm9kZSB0eXBlIGlzLCBhbmQgdGhlcmVmb3JlIGNhblxuICAgICAgICAvLyBwZXJmb3JtIG91ciB1c3VhbCByZW5kZXJpbmcgcGlwZWxpbmUsIHdoaWNoIG5lY2Vzc2l0YXRlcyBjb252ZXJ0aW5nIHRoZSBkYXRhXG4gICAgICAgIHJldHVybiB0aGlzLl9jb21wdXRlUmVuZGVyaW5nRGF0YShkYXRhLCBub2RlVHlwZSkucGlwZShcbiAgICAgICAgICBtYXAoY29udmVydGVkRGF0YSA9PiAoey4uLmNvbnZlcnRlZERhdGEsIG5vZGVUeXBlfSkgYXMgY29uc3QpLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlbmRlckRhdGFDaGFuZ2VzKGRhdGE6IFJlbmRlcmluZ0RhdGE8VD4pIHtcbiAgICBpZiAoZGF0YS5ub2RlVHlwZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5yZW5kZXJOb2RlQ2hhbmdlcyhkYXRhLnJlbmRlck5vZGVzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSdyZSBoZXJlLCB0aGVuIHdlIGtub3cgd2hhdCBvdXIgbm9kZSB0eXBlIGlzLCBhbmQgdGhlcmVmb3JlIGNhblxuICAgIC8vIHBlcmZvcm0gb3VyIHVzdWFsIHJlbmRlcmluZyBwaXBlbGluZS5cbiAgICB0aGlzLl91cGRhdGVDYWNoZWREYXRhKGRhdGEuZmxhdHRlbmVkTm9kZXMpO1xuICAgIHRoaXMucmVuZGVyTm9kZUNoYW5nZXMoZGF0YS5yZW5kZXJOb2Rlcyk7XG4gICAgdGhpcy5fdXBkYXRlS2V5TWFuYWdlckl0ZW1zKGRhdGEuZmxhdHRlbmVkTm9kZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZW1pdEV4cGFuc2lvbkNoYW5nZXMoZXhwYW5zaW9uQ2hhbmdlczogU2VsZWN0aW9uQ2hhbmdlPEs+IHwgbnVsbCkge1xuICAgIGlmICghZXhwYW5zaW9uQ2hhbmdlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVzID0gdGhpcy5fbm9kZXMudmFsdWU7XG4gICAgZm9yIChjb25zdCBhZGRlZCBvZiBleHBhbnNpb25DaGFuZ2VzLmFkZGVkKSB7XG4gICAgICBjb25zdCBub2RlID0gbm9kZXMuZ2V0KGFkZGVkKTtcbiAgICAgIG5vZGU/Ll9lbWl0RXhwYW5zaW9uU3RhdGUodHJ1ZSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcmVtb3ZlZCBvZiBleHBhbnNpb25DaGFuZ2VzLnJlbW92ZWQpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5nZXQocmVtb3ZlZCk7XG4gICAgICBub2RlPy5fZW1pdEV4cGFuc2lvblN0YXRlKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9pbml0aWFsaXplS2V5TWFuYWdlcigpIHtcbiAgICBjb25zdCBpdGVtcyA9IGNvbWJpbmVMYXRlc3QoW3RoaXMuX2tleU1hbmFnZXJOb2RlcywgdGhpcy5fbm9kZXNdKS5waXBlKFxuICAgICAgbWFwKChba2V5TWFuYWdlck5vZGVzLCByZW5kZXJOb2Rlc10pID0+XG4gICAgICAgIGtleU1hbmFnZXJOb2Rlcy5yZWR1Y2U8Q2RrVHJlZU5vZGU8VCwgSz5bXT4oKGl0ZW1zLCBkYXRhKSA9PiB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IHJlbmRlck5vZGVzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YSkpO1xuICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBpdGVtcy5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICAgIH0sIFtdKSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIGNvbnN0IGtleU1hbmFnZXJPcHRpb25zOiBUcmVlS2V5TWFuYWdlck9wdGlvbnM8Q2RrVHJlZU5vZGU8VCwgSz4+ID0ge1xuICAgICAgdHJhY2tCeTogbm9kZSA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSxcbiAgICAgIHNraXBQcmVkaWNhdGU6IG5vZGUgPT4gISFub2RlLmlzRGlzYWJsZWQsXG4gICAgICB0eXBlQWhlYWREZWJvdW5jZUludGVydmFsOiB0cnVlLFxuICAgICAgaG9yaXpvbnRhbE9yaWVudGF0aW9uOiB0aGlzLl9kaXIudmFsdWUsXG4gICAgfTtcblxuICAgIHRoaXMuX2tleU1hbmFnZXIgPSB0aGlzLl9rZXlNYW5hZ2VyRmFjdG9yeShpdGVtcywga2V5TWFuYWdlck9wdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZURhdGFEaWZmZXIoKSB7XG4gICAgLy8gUHJvdmlkZSBhIGRlZmF1bHQgdHJhY2tCeSBiYXNlZCBvbiBgX2dldEV4cGFuc2lvbktleWAgaWYgb25lIGlzbid0IHByb3ZpZGVkLlxuICAgIGNvbnN0IHRyYWNrQnkgPSB0aGlzLnRyYWNrQnkgPz8gKChfaW5kZXg6IG51bWJlciwgaXRlbTogVCkgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGl0ZW0pKTtcbiAgICB0aGlzLl9kYXRhRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKFtdKS5jcmVhdGUodHJhY2tCeSk7XG4gIH1cblxuICBwcml2YXRlIF9jaGVja1RyZWVDb250cm9sVXNhZ2UoKSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgVHJlZSBmb2xsb3dzIEFQSSBjb250cmFjdCBvZiB1c2luZyBvbmUgb2YgVHJlZUNvbnRyb2wsIGxldmVsQWNjZXNzb3Igb3JcbiAgICAgIC8vIGNoaWxkcmVuQWNjZXNzb3IuIFRocm93IGFuIGFwcHJvcHJpYXRlIGVycm9yIGlmIGNvbnRyYWN0IGlzIG5vdCBtZXQuXG4gICAgICBsZXQgbnVtVHJlZUNvbnRyb2xzID0gMDtcblxuICAgICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgICAgbnVtVHJlZUNvbnRyb2xzKys7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5sZXZlbEFjY2Vzc29yKSB7XG4gICAgICAgIG51bVRyZWVDb250cm9scysrO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgICBudW1UcmVlQ29udHJvbHMrKztcbiAgICAgIH1cblxuICAgICAgaWYgKCFudW1UcmVlQ29udHJvbHMpIHtcbiAgICAgICAgdGhyb3cgZ2V0VHJlZUNvbnRyb2xNaXNzaW5nRXJyb3IoKTtcbiAgICAgIH0gZWxzZSBpZiAobnVtVHJlZUNvbnRyb2xzID4gMSkge1xuICAgICAgICB0aHJvdyBnZXRNdWx0aXBsZVRyZWVDb250cm9sc0Vycm9yKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIENoZWNrIGZvciBjaGFuZ2VzIG1hZGUgaW4gdGhlIGRhdGEgYW5kIHJlbmRlciBlYWNoIGNoYW5nZSAobm9kZSBhZGRlZC9yZW1vdmVkL21vdmVkKS4gKi9cbiAgcmVuZGVyTm9kZUNoYW5nZXMoXG4gICAgZGF0YTogcmVhZG9ubHkgVFtdLFxuICAgIGRhdGFEaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPFQ+ID0gdGhpcy5fZGF0YURpZmZlcixcbiAgICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmID0gdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLFxuICAgIHBhcmVudERhdGE/OiBULFxuICApIHtcbiAgICBjb25zdCBjaGFuZ2VzID0gZGF0YURpZmZlci5kaWZmKGRhdGEpO1xuXG4gICAgLy8gU29tZSB0cmVlIGNvbnN1bWVycyBleHBlY3QgY2hhbmdlIGRldGVjdGlvbiB0byBwcm9wYWdhdGUgdG8gbm9kZXNcbiAgICAvLyBldmVuIHdoZW4gdGhlIGFycmF5IGl0c2VsZiBoYXNuJ3QgY2hhbmdlZDsgd2UgZXhwbGljaXRseSBkZXRlY3QgY2hhbmdlc1xuICAgIC8vIGFueXdheXMgaW4gb3JkZXIgZm9yIG5vZGVzIHRvIHVwZGF0ZSB0aGVpciBkYXRhLlxuICAgIC8vXG4gICAgLy8gSG93ZXZlciwgaWYgY2hhbmdlIGRldGVjdGlvbiBpcyBjYWxsZWQgd2hpbGUgdGhlIGNvbXBvbmVudCdzIHZpZXcgaXNcbiAgICAvLyBzdGlsbCBpbml0aW5nLCB0aGVuIHRoZSBvcmRlciBvZiBjaGlsZCB2aWV3cyBpbml0aW5nIHdpbGwgYmUgaW5jb3JyZWN0O1xuICAgIC8vIHRvIHByZXZlbnQgdGhpcywgd2Ugb25seSBleGl0IGVhcmx5IGlmIHRoZSB2aWV3IGhhc24ndCBpbml0aWFsaXplZCB5ZXQuXG4gICAgaWYgKCFjaGFuZ2VzICYmICF0aGlzLl92aWV3SW5pdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNoYW5nZXM/LmZvckVhY2hPcGVyYXRpb24oXG4gICAgICAoXG4gICAgICAgIGl0ZW06IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFQ+LFxuICAgICAgICBhZGp1c3RlZFByZXZpb3VzSW5kZXg6IG51bWJlciB8IG51bGwsXG4gICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICkgPT4ge1xuICAgICAgICBpZiAoaXRlbS5wcmV2aW91c0luZGV4ID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmluc2VydE5vZGUoZGF0YVtjdXJyZW50SW5kZXghXSwgY3VycmVudEluZGV4ISwgdmlld0NvbnRhaW5lciwgcGFyZW50RGF0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICB2aWV3Q29udGFpbmVyLnJlbW92ZShhZGp1c3RlZFByZXZpb3VzSW5kZXghKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCB2aWV3ID0gdmlld0NvbnRhaW5lci5nZXQoYWRqdXN0ZWRQcmV2aW91c0luZGV4ISk7XG4gICAgICAgICAgdmlld0NvbnRhaW5lci5tb3ZlKHZpZXchLCBjdXJyZW50SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyBJZiB0aGUgZGF0YSBpdHNlbGYgY2hhbmdlcywgYnV0IGtlZXBzIHRoZSBzYW1lIHRyYWNrQnksIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZXMnXG4gICAgLy8gY29udGV4dCB0byByZWZsZWN0IHRoZSBuZXcgb2JqZWN0LlxuICAgIGNoYW5nZXM/LmZvckVhY2hJZGVudGl0eUNoYW5nZSgocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPikgPT4ge1xuICAgICAgY29uc3QgbmV3RGF0YSA9IHJlY29yZC5pdGVtO1xuICAgICAgaWYgKHJlY29yZC5jdXJyZW50SW5kZXggIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXcgPSB2aWV3Q29udGFpbmVyLmdldChyZWNvcmQuY3VycmVudEluZGV4KTtcbiAgICAgICAgKHZpZXcgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLmNvbnRleHQuJGltcGxpY2l0ID0gbmV3RGF0YTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRPRE86IGNoYW5nZSB0byBgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKClgLCBvciBqdXN0IHN3aXRjaCB0aGlzIGNvbXBvbmVudCB0b1xuICAgIC8vIHVzZSBzaWduYWxzLlxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgbWF0Y2hpbmcgbm9kZSBkZWZpbml0aW9uIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIHRoaXMgbm9kZSBkYXRhLiBJZiB0aGVyZSBpcyBvbmx5XG4gICAqIG9uZSBub2RlIGRlZmluaXRpb24sIGl0IGlzIHJldHVybmVkLiBPdGhlcndpc2UsIGZpbmQgdGhlIG5vZGUgZGVmaW5pdGlvbiB0aGF0IGhhcyBhIHdoZW5cbiAgICogcHJlZGljYXRlIHRoYXQgcmV0dXJucyB0cnVlIHdpdGggdGhlIGRhdGEuIElmIG5vbmUgcmV0dXJuIHRydWUsIHJldHVybiB0aGUgZGVmYXVsdCBub2RlXG4gICAqIGRlZmluaXRpb24uXG4gICAqL1xuICBfZ2V0Tm9kZURlZihkYXRhOiBULCBpOiBudW1iZXIpOiBDZGtUcmVlTm9kZURlZjxUPiB7XG4gICAgaWYgKHRoaXMuX25vZGVEZWZzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuX25vZGVEZWZzLmZpcnN0ITtcbiAgICB9XG5cbiAgICBjb25zdCBub2RlRGVmID1cbiAgICAgIHRoaXMuX25vZGVEZWZzLmZpbmQoZGVmID0+IGRlZi53aGVuICYmIGRlZi53aGVuKGksIGRhdGEpKSB8fCB0aGlzLl9kZWZhdWx0Tm9kZURlZjtcblxuICAgIGlmICghbm9kZURlZiAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcigpO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlRGVmITtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGVtYmVkZGVkIHZpZXcgZm9yIHRoZSBkYXRhIG5vZGUgdGVtcGxhdGUgYW5kIHBsYWNlIGl0IGluIHRoZSBjb3JyZWN0IGluZGV4IGxvY2F0aW9uXG4gICAqIHdpdGhpbiB0aGUgZGF0YSBub2RlIHZpZXcgY29udGFpbmVyLlxuICAgKi9cbiAgaW5zZXJ0Tm9kZShub2RlRGF0YTogVCwgaW5kZXg6IG51bWJlciwgdmlld0NvbnRhaW5lcj86IFZpZXdDb250YWluZXJSZWYsIHBhcmVudERhdGE/OiBUKSB7XG4gICAgY29uc3QgbGV2ZWxBY2Nlc3NvciA9IHRoaXMuX2dldExldmVsQWNjZXNzb3IoKTtcblxuICAgIGNvbnN0IG5vZGUgPSB0aGlzLl9nZXROb2RlRGVmKG5vZGVEYXRhLCBpbmRleCk7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGVEYXRhKTtcblxuICAgIC8vIE5vZGUgY29udGV4dCB0aGF0IHdpbGwgYmUgcHJvdmlkZWQgdG8gY3JlYXRlZCBlbWJlZGRlZCB2aWV3XG4gICAgY29uc3QgY29udGV4dCA9IG5ldyBDZGtUcmVlTm9kZU91dGxldENvbnRleHQ8VD4obm9kZURhdGEpO1xuXG4gICAgcGFyZW50RGF0YSA/Pz0gdGhpcy5fcGFyZW50cy5nZXQoa2V5KSA/PyB1bmRlZmluZWQ7XG4gICAgLy8gSWYgdGhlIHRyZWUgaXMgZmxhdCB0cmVlLCB0aGVuIHVzZSB0aGUgYGdldExldmVsYCBmdW5jdGlvbiBpbiBmbGF0IHRyZWUgY29udHJvbFxuICAgIC8vIE90aGVyd2lzZSwgdXNlIHRoZSBsZXZlbCBvZiBwYXJlbnQgbm9kZS5cbiAgICBpZiAobGV2ZWxBY2Nlc3Nvcikge1xuICAgICAgY29udGV4dC5sZXZlbCA9IGxldmVsQWNjZXNzb3Iobm9kZURhdGEpO1xuICAgIH0gZWxzZSBpZiAocGFyZW50RGF0YSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2xldmVscy5oYXModGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudERhdGEpKSkge1xuICAgICAgY29udGV4dC5sZXZlbCA9IHRoaXMuX2xldmVscy5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudERhdGEpKSEgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmxldmVsID0gMDtcbiAgICB9XG4gICAgdGhpcy5fbGV2ZWxzLnNldChrZXksIGNvbnRleHQubGV2ZWwpO1xuXG4gICAgLy8gVXNlIGRlZmF1bHQgdHJlZSBub2RlT3V0bGV0LCBvciBuZXN0ZWQgbm9kZSdzIG5vZGVPdXRsZXRcbiAgICBjb25zdCBjb250YWluZXIgPSB2aWV3Q29udGFpbmVyID8gdmlld0NvbnRhaW5lciA6IHRoaXMuX25vZGVPdXRsZXQudmlld0NvbnRhaW5lcjtcbiAgICBjb250YWluZXIuY3JlYXRlRW1iZWRkZWRWaWV3KG5vZGUudGVtcGxhdGUsIGNvbnRleHQsIGluZGV4KTtcblxuICAgIC8vIFNldCB0aGUgZGF0YSB0byBqdXN0IGNyZWF0ZWQgYENka1RyZWVOb2RlYC5cbiAgICAvLyBUaGUgYENka1RyZWVOb2RlYCBjcmVhdGVkIGZyb20gYGNyZWF0ZUVtYmVkZGVkVmlld2Agd2lsbCBiZSBzYXZlZCBpbiBzdGF0aWMgdmFyaWFibGVcbiAgICAvLyAgICAgYG1vc3RSZWNlbnRUcmVlTm9kZWAuIFdlIGdldCBpdCBmcm9tIHN0YXRpYyB2YXJpYWJsZSBhbmQgcGFzcyB0aGUgbm9kZSBkYXRhIHRvIGl0LlxuICAgIGlmIChDZGtUcmVlTm9kZS5tb3N0UmVjZW50VHJlZU5vZGUpIHtcbiAgICAgIENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZS5kYXRhID0gbm9kZURhdGE7XG4gICAgfVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGRhdGEgbm9kZSBpcyBleHBhbmRlZCBvciBjb2xsYXBzZWQuIFJldHVybnMgdHJ1ZSBpZiBpdCdzIGV4cGFuZGVkLiAqL1xuICBpc0V4cGFuZGVkKGRhdGFOb2RlOiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhKFxuICAgICAgdGhpcy50cmVlQ29udHJvbD8uaXNFeHBhbmRlZChkYXRhTm9kZSkgfHxcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsPy5pc1NlbGVjdGVkKHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBJZiB0aGUgZGF0YSBub2RlIGlzIGN1cnJlbnRseSBleHBhbmRlZCwgY29sbGFwc2UgaXQuIE90aGVyd2lzZSwgZXhwYW5kIGl0LiAqL1xuICB0b2dnbGUoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC50b2dnbGUoZGF0YU5vZGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsLnRvZ2dsZSh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpKTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kIHRoZSBkYXRhIG5vZGUuIElmIGl0IGlzIGFscmVhZHkgZXhwYW5kZWQsIGRvZXMgbm90aGluZy4gKi9cbiAgZXhwYW5kKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuZXhwYW5kKGRhdGFOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2V4cGFuc2lvbk1vZGVsKSB7XG4gICAgICB0aGlzLl9leHBhbnNpb25Nb2RlbC5zZWxlY3QodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbGxhcHNlIHRoZSBkYXRhIG5vZGUuIElmIGl0IGlzIGFscmVhZHkgY29sbGFwc2VkLCBkb2VzIG5vdGhpbmcuICovXG4gIGNvbGxhcHNlKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuY29sbGFwc2UoZGF0YU5vZGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIHRoaXMuX2V4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgZGF0YSBub2RlIGlzIGN1cnJlbnRseSBleHBhbmRlZCwgY29sbGFwc2UgaXQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuXG4gICAqIE90aGVyd2lzZSwgZXhwYW5kIGl0IGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzLlxuICAgKi9cbiAgdG9nZ2xlRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC50b2dnbGVEZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgaWYgKHRoaXMuaXNFeHBhbmRlZChkYXRhTm9kZSkpIHtcbiAgICAgICAgdGhpcy5jb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBhbmQgdGhlIGRhdGEgbm9kZSBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cy4gSWYgdGhleSBhcmUgYWxyZWFkeSBleHBhbmRlZCwgZG9lcyBub3RoaW5nLlxuICAgKi9cbiAgZXhwYW5kRGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5leHBhbmREZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLnNlbGVjdCh0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpKTtcbiAgICAgIHRoaXMuX2dldERlc2NlbmRhbnRzKGRhdGFOb2RlKVxuICAgICAgICAucGlwZSh0YWtlKDEpLCB0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgICAgLnN1YnNjcmliZShjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgZXhwYW5zaW9uTW9kZWwuc2VsZWN0KC4uLmNoaWxkcmVuLm1hcChjaGlsZCA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDb2xsYXBzZSB0aGUgZGF0YSBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzLiBJZiBpdCBpcyBhbHJlYWR5IGNvbGxhcHNlZCwgZG9lcyBub3RoaW5nLiAqL1xuICBjb2xsYXBzZURlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudHJlZUNvbnRyb2wpIHtcbiAgICAgIHRoaXMudHJlZUNvbnRyb2wuY29sbGFwc2VEZXNjZW5kYW50cyhkYXRhTm9kZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9leHBhbnNpb25Nb2RlbCkge1xuICAgICAgY29uc3QgZXhwYW5zaW9uTW9kZWwgPSB0aGlzLl9leHBhbnNpb25Nb2RlbDtcbiAgICAgIGV4cGFuc2lvbk1vZGVsLmRlc2VsZWN0KHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSkpO1xuICAgICAgdGhpcy5fZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpXG4gICAgICAgIC5waXBlKHRha2UoMSksIHRha2VVbnRpbCh0aGlzLl9vbkRlc3Ryb3kpKVxuICAgICAgICAuc3Vic2NyaWJlKGNoaWxkcmVuID0+IHtcbiAgICAgICAgICBleHBhbnNpb25Nb2RlbC5kZXNlbGVjdCguLi5jaGlsZHJlbi5tYXAoY2hpbGQgPT4gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kcyBhbGwgZGF0YSBub2RlcyBpbiB0aGUgdHJlZS4gKi9cbiAgZXhwYW5kQWxsKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICB0aGlzLnRyZWVDb250cm9sLmV4cGFuZEFsbCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZXhwYW5zaW9uTW9kZWw7XG4gICAgICBleHBhbnNpb25Nb2RlbC5zZWxlY3QoXG4gICAgICAgIC4uLnRoaXMuX2ZsYXR0ZW5lZE5vZGVzLnZhbHVlLm1hcChjaGlsZCA9PiB0aGlzLl9nZXRFeHBhbnNpb25LZXkoY2hpbGQpKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENvbGxhcHNlIGFsbCBkYXRhIG5vZGVzIGluIHRoZSB0cmVlLiAqL1xuICBjb2xsYXBzZUFsbCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy50cmVlQ29udHJvbCkge1xuICAgICAgdGhpcy50cmVlQ29udHJvbC5jb2xsYXBzZUFsbCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fZXhwYW5zaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZXhwYW5zaW9uTW9kZWw7XG4gICAgICBleHBhbnNpb25Nb2RlbC5kZXNlbGVjdChcbiAgICAgICAgLi4udGhpcy5fZmxhdHRlbmVkTm9kZXMudmFsdWUubWFwKGNoaWxkID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKiogTGV2ZWwgYWNjZXNzb3IsIHVzZWQgZm9yIGNvbXBhdGliaWxpdHkgYmV0d2VlbiB0aGUgb2xkIFRyZWUgYW5kIG5ldyBUcmVlICovXG4gIF9nZXRMZXZlbEFjY2Vzc29yKCkge1xuICAgIHJldHVybiB0aGlzLnRyZWVDb250cm9sPy5nZXRMZXZlbD8uYmluZCh0aGlzLnRyZWVDb250cm9sKSA/PyB0aGlzLmxldmVsQWNjZXNzb3I7XG4gIH1cblxuICAvKiogQ2hpbGRyZW4gYWNjZXNzb3IsIHVzZWQgZm9yIGNvbXBhdGliaWxpdHkgYmV0d2VlbiB0aGUgb2xkIFRyZWUgYW5kIG5ldyBUcmVlICovXG4gIF9nZXRDaGlsZHJlbkFjY2Vzc29yKCkge1xuICAgIHJldHVybiB0aGlzLnRyZWVDb250cm9sPy5nZXRDaGlsZHJlbj8uYmluZCh0aGlzLnRyZWVDb250cm9sKSA/PyB0aGlzLmNoaWxkcmVuQWNjZXNzb3I7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGlyZWN0IGNoaWxkcmVuIG9mIGEgbm9kZTsgdXNlZCBmb3IgY29tcGF0aWJpbGl0eSBiZXR3ZWVuIHRoZSBvbGQgdHJlZSBhbmQgdGhlXG4gICAqIG5ldyB0cmVlLlxuICAgKi9cbiAgX2dldERpcmVjdENoaWxkcmVuKGRhdGFOb2RlOiBUKTogT2JzZXJ2YWJsZTxUW10+IHtcbiAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5fZ2V0TGV2ZWxBY2Nlc3NvcigpO1xuICAgIGNvbnN0IGV4cGFuc2lvbk1vZGVsID0gdGhpcy5fZXhwYW5zaW9uTW9kZWwgPz8gdGhpcy50cmVlQ29udHJvbD8uZXhwYW5zaW9uTW9kZWw7XG4gICAgaWYgKCFleHBhbnNpb25Nb2RlbCkge1xuICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihbXSk7XG4gICAgfVxuXG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKTtcblxuICAgIGNvbnN0IGlzRXhwYW5kZWQgPSBleHBhbnNpb25Nb2RlbC5jaGFuZ2VkLnBpcGUoXG4gICAgICBzd2l0Y2hNYXAoY2hhbmdlcyA9PiB7XG4gICAgICAgIGlmIChjaGFuZ2VzLmFkZGVkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYW5nZXMucmVtb3ZlZC5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgICAgcmV0dXJuIG9ic2VydmFibGVPZihmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEVNUFRZO1xuICAgICAgfSksXG4gICAgICBzdGFydFdpdGgodGhpcy5pc0V4cGFuZGVkKGRhdGFOb2RlKSksXG4gICAgKTtcblxuICAgIGlmIChsZXZlbEFjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gY29tYmluZUxhdGVzdChbaXNFeHBhbmRlZCwgdGhpcy5fZmxhdHRlbmVkTm9kZXNdKS5waXBlKFxuICAgICAgICBtYXAoKFtleHBhbmRlZCwgZmxhdHRlbmVkTm9kZXNdKSA9PiB7XG4gICAgICAgICAgaWYgKCFleHBhbmRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZENoaWxkcmVuQnlMZXZlbChcbiAgICAgICAgICAgIGxldmVsQWNjZXNzb3IsXG4gICAgICAgICAgICBmbGF0dGVuZWROb2RlcyxcblxuICAgICAgICAgICAgZGF0YU5vZGUsXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgY2hpbGRyZW5BY2Nlc3NvciA9IHRoaXMuX2dldENoaWxkcmVuQWNjZXNzb3IoKTtcbiAgICBpZiAoY2hpbGRyZW5BY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuIGNvZXJjZU9ic2VydmFibGUoY2hpbGRyZW5BY2Nlc3NvcihkYXRhTm9kZSkgPz8gW10pO1xuICAgIH1cbiAgICB0aHJvdyBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIHRoZSBsaXN0IG9mIGZsYXR0ZW5lZCBub2RlcywgdGhlIGxldmVsIGFjY2Vzc29yLCBhbmQgdGhlIGxldmVsIHJhbmdlIHdpdGhpblxuICAgKiB3aGljaCB0byBjb25zaWRlciBjaGlsZHJlbiwgZmluZHMgdGhlIGNoaWxkcmVuIGZvciBhIGdpdmVuIG5vZGUuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBmb3IgZGlyZWN0IGNoaWxkcmVuLCBgbGV2ZWxEZWx0YWAgd291bGQgYmUgMS4gRm9yIGFsbCBkZXNjZW5kYW50cyxcbiAgICogYGxldmVsRGVsdGFgIHdvdWxkIGJlIEluZmluaXR5LlxuICAgKi9cbiAgcHJpdmF0ZSBfZmluZENoaWxkcmVuQnlMZXZlbChcbiAgICBsZXZlbEFjY2Vzc29yOiAobm9kZTogVCkgPT4gbnVtYmVyLFxuICAgIGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW10sXG4gICAgZGF0YU5vZGU6IFQsXG4gICAgbGV2ZWxEZWx0YTogbnVtYmVyLFxuICApOiBUW10ge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldEV4cGFuc2lvbktleShkYXRhTm9kZSk7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IGZsYXR0ZW5lZE5vZGVzLmZpbmRJbmRleChub2RlID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSA9PT0ga2V5KTtcbiAgICBjb25zdCBkYXRhTm9kZUxldmVsID0gbGV2ZWxBY2Nlc3NvcihkYXRhTm9kZSk7XG4gICAgY29uc3QgZXhwZWN0ZWRMZXZlbCA9IGRhdGFOb2RlTGV2ZWwgKyBsZXZlbERlbHRhO1xuICAgIGNvbnN0IHJlc3VsdHM6IFRbXSA9IFtdO1xuXG4gICAgLy8gR29lcyB0aHJvdWdoIGZsYXR0ZW5lZCB0cmVlIG5vZGVzIGluIHRoZSBgZmxhdHRlbmVkTm9kZXNgIGFycmF5LCBhbmQgZ2V0IGFsbFxuICAgIC8vIGRlc2NlbmRhbnRzIHdpdGhpbiBhIGNlcnRhaW4gbGV2ZWwgcmFuZ2UuXG4gICAgLy9cbiAgICAvLyBJZiB3ZSByZWFjaCBhIG5vZGUgd2hvc2UgbGV2ZWwgaXMgZXF1YWwgdG8gb3IgbGVzcyB0aGFuIHRoZSBsZXZlbCBvZiB0aGUgdHJlZSBub2RlLFxuICAgIC8vIHdlIGhpdCBhIHNpYmxpbmcgb3IgcGFyZW50J3Mgc2libGluZywgYW5kIHNob3VsZCBzdG9wLlxuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4ICsgMTsgaSA8IGZsYXR0ZW5lZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjdXJyZW50TGV2ZWwgPSBsZXZlbEFjY2Vzc29yKGZsYXR0ZW5lZE5vZGVzW2ldKTtcbiAgICAgIGlmIChjdXJyZW50TGV2ZWwgPD0gZGF0YU5vZGVMZXZlbCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChjdXJyZW50TGV2ZWwgPD0gZXhwZWN0ZWRMZXZlbCkge1xuICAgICAgICByZXN1bHRzLnB1c2goZmxhdHRlbmVkTm9kZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBzcGVjaWZpZWQgbm9kZSBjb21wb25lbnQgdG8gdGhlIHRyZWUncyBpbnRlcm5hbCByZWdpc3RyeS5cbiAgICpcbiAgICogVGhpcyBwcmltYXJpbHkgZmFjaWxpdGF0ZXMga2V5Ym9hcmQgbmF2aWdhdGlvbi5cbiAgICovXG4gIF9yZWdpc3Rlck5vZGUobm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHtcbiAgICB0aGlzLl9ub2Rlcy52YWx1ZS5zZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUuZGF0YSksIG5vZGUpO1xuICAgIHRoaXMuX25vZGVzLm5leHQodGhpcy5fbm9kZXMudmFsdWUpO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIHNwZWNpZmllZCBub2RlIGNvbXBvbmVudCBmcm9tIHRoZSB0cmVlJ3MgaW50ZXJuYWwgcmVnaXN0cnkuICovXG4gIF91bnJlZ2lzdGVyTm9kZShub2RlOiBDZGtUcmVlTm9kZTxULCBLPikge1xuICAgIHRoaXMuX25vZGVzLnZhbHVlLmRlbGV0ZSh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSk7XG4gICAgdGhpcy5fbm9kZXMubmV4dCh0aGlzLl9ub2Rlcy52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yIHRoZSBnaXZlbiBub2RlLCBkZXRlcm1pbmUgdGhlIGxldmVsIHdoZXJlIHRoaXMgbm9kZSBhcHBlYXJzIGluIHRoZSB0cmVlLlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLWxldmVsYCBidXQgaXMgMC1pbmRleGVkLlxuICAgKi9cbiAgX2dldExldmVsKG5vZGU6IFQpIHtcbiAgICByZXR1cm4gdGhpcy5fbGV2ZWxzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvciB0aGUgZ2l2ZW4gbm9kZSwgZGV0ZXJtaW5lIHRoZSBzaXplIG9mIHRoZSBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtc2V0c2l6ZWAuXG4gICAqL1xuICBfZ2V0U2V0U2l6ZShkYXRhTm9kZTogVCkge1xuICAgIGNvbnN0IHNldCA9IHRoaXMuX2dldEFyaWFTZXQoZGF0YU5vZGUpO1xuICAgIHJldHVybiBzZXQubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvciB0aGUgZ2l2ZW4gbm9kZSwgZGV0ZXJtaW5lIHRoZSBpbmRleCAoc3RhcnRpbmcgZnJvbSAxKSBvZiB0aGUgbm9kZSBpbiBpdHMgcGFyZW50J3MgY2hpbGQgc2V0LlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLXBvc2luc2V0YC5cbiAgICovXG4gIF9nZXRQb3NpdGlvbkluU2V0KGRhdGFOb2RlOiBUKSB7XG4gICAgY29uc3Qgc2V0ID0gdGhpcy5fZ2V0QXJpYVNldChkYXRhTm9kZSk7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGRhdGFOb2RlKTtcbiAgICByZXR1cm4gc2V0LmZpbmRJbmRleChub2RlID0+IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSA9PT0ga2V5KSArIDE7XG4gIH1cblxuICAvKiogR2l2ZW4gYSBDZGtUcmVlTm9kZSwgZ2V0cyB0aGUgbm9kZSB0aGF0IHJlbmRlcnMgdGhhdCBub2RlJ3MgcGFyZW50J3MgZGF0YS4gKi9cbiAgX2dldE5vZGVQYXJlbnQobm9kZTogQ2RrVHJlZU5vZGU8VCwgSz4pIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9wYXJlbnRzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkobm9kZS5kYXRhKSk7XG4gICAgcmV0dXJuIHBhcmVudCAmJiB0aGlzLl9ub2Rlcy52YWx1ZS5nZXQodGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudCkpO1xuICB9XG5cbiAgLyoqIEdpdmVuIGEgQ2RrVHJlZU5vZGUsIGdldHMgdGhlIG5vZGVzIHRoYXQgcmVuZGVycyB0aGF0IG5vZGUncyBjaGlsZCBkYXRhLiAqL1xuICBfZ2V0Tm9kZUNoaWxkcmVuKG5vZGU6IENka1RyZWVOb2RlPFQsIEs+KSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldERpcmVjdENoaWxkcmVuKG5vZGUuZGF0YSkucGlwZShcbiAgICAgIG1hcChjaGlsZHJlbiA9PlxuICAgICAgICBjaGlsZHJlbi5yZWR1Y2U8Q2RrVHJlZU5vZGU8VCwgSz5bXT4oKG5vZGVzLCBjaGlsZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5fbm9kZXMudmFsdWUuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCkpO1xuICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgbm9kZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG5vZGVzO1xuICAgICAgICB9LCBbXSksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICAvKiogYGtleWRvd25gIGV2ZW50IGhhbmRsZXI7IHRoaXMganVzdCBwYXNzZXMgdGhlIGV2ZW50IHRvIHRoZSBgVHJlZUtleU1hbmFnZXJgLiAqL1xuICBfc2VuZEtleWRvd25Ub0tleU1hbmFnZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICB0aGlzLl9rZXlNYW5hZ2VyLm9uS2V5ZG93bihldmVudCk7XG4gIH1cblxuICAvKiogR2V0cyBhbGwgbmVzdGVkIGRlc2NlbmRhbnRzIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbiAgcHJpdmF0ZSBfZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGU6IFQpOiBPYnNlcnZhYmxlPFRbXT4ge1xuICAgIGlmICh0aGlzLnRyZWVDb250cm9sKSB7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHRoaXMudHJlZUNvbnRyb2wuZ2V0RGVzY2VuZGFudHMoZGF0YU5vZGUpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMubGV2ZWxBY2Nlc3Nvcikge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuX2ZpbmRDaGlsZHJlbkJ5TGV2ZWwoXG4gICAgICAgIHRoaXMubGV2ZWxBY2Nlc3NvcixcbiAgICAgICAgdGhpcy5fZmxhdHRlbmVkTm9kZXMudmFsdWUsXG4gICAgICAgIGRhdGFOb2RlLFxuICAgICAgICBJbmZpbml0eSxcbiAgICAgICk7XG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHJlc3VsdHMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGlsZHJlbkFjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QWxsQ2hpbGRyZW5SZWN1cnNpdmVseShkYXRhTm9kZSkucGlwZShcbiAgICAgICAgcmVkdWNlKChhbGxDaGlsZHJlbjogVFtdLCBuZXh0Q2hpbGRyZW4pID0+IHtcbiAgICAgICAgICBhbGxDaGlsZHJlbi5wdXNoKC4uLm5leHRDaGlsZHJlbik7XG4gICAgICAgICAgcmV0dXJuIGFsbENoaWxkcmVuO1xuICAgICAgICB9LCBbXSksXG4gICAgICApO1xuICAgIH1cbiAgICB0aHJvdyBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIGNoaWxkcmVuIGFuZCBzdWItY2hpbGRyZW4gb2YgdGhlIHByb3ZpZGVkIG5vZGUuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBlbWl0IG11bHRpcGxlIHRpbWVzLCBpbiB0aGUgb3JkZXIgdGhhdCB0aGUgY2hpbGRyZW4gd2lsbCBhcHBlYXJcbiAgICogaW4gdGhlIHRyZWUsIGFuZCBjYW4gYmUgY29tYmluZWQgd2l0aCBhIGByZWR1Y2VgIG9wZXJhdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0QWxsQ2hpbGRyZW5SZWN1cnNpdmVseShkYXRhTm9kZTogVCk6IE9ic2VydmFibGU8VFtdPiB7XG4gICAgaWYgKCF0aGlzLmNoaWxkcmVuQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoW10pO1xuICAgIH1cblxuICAgIHJldHVybiBjb2VyY2VPYnNlcnZhYmxlKHRoaXMuY2hpbGRyZW5BY2Nlc3NvcihkYXRhTm9kZSkpLnBpcGUoXG4gICAgICB0YWtlKDEpLFxuICAgICAgc3dpdGNoTWFwKGNoaWxkcmVuID0+IHtcbiAgICAgICAgLy8gSGVyZSwgd2UgY2FjaGUgdGhlIHBhcmVudHMgb2YgYSBwYXJ0aWN1bGFyIGNoaWxkIHNvIHRoYXQgd2UgY2FuIGNvbXB1dGUgdGhlIGxldmVscy5cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgIHRoaXMuX3BhcmVudHMuc2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShjaGlsZCksIGRhdGFOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKC4uLmNoaWxkcmVuKS5waXBlKFxuICAgICAgICAgIGNvbmNhdE1hcChjaGlsZCA9PiBjb25jYXQob2JzZXJ2YWJsZU9mKFtjaGlsZF0pLCB0aGlzLl9nZXRBbGxDaGlsZHJlblJlY3Vyc2l2ZWx5KGNoaWxkKSkpLFxuICAgICAgICApO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEV4cGFuc2lvbktleShkYXRhTm9kZTogVCk6IEsge1xuICAgIC8vIEluIHRoZSBjYXNlIHRoYXQgYSBrZXkgYWNjZXNzb3IgZnVuY3Rpb24gd2FzIG5vdCBwcm92aWRlZCBieSB0aGVcbiAgICAvLyB0cmVlIHVzZXIsIHdlJ2xsIGRlZmF1bHQgdG8gdXNpbmcgdGhlIG5vZGUgb2JqZWN0IGl0c2VsZiBhcyB0aGUga2V5LlxuICAgIC8vXG4gICAgLy8gVGhpcyBjYXN0IGlzIHNhZmUgc2luY2U6XG4gICAgLy8gLSBpZiBhbiBleHBhbnNpb25LZXkgaXMgcHJvdmlkZWQsIFRTIHdpbGwgaW5mZXIgdGhlIHR5cGUgb2YgSyB0byBiZVxuICAgIC8vICAgdGhlIHJldHVybiB0eXBlLlxuICAgIC8vIC0gaWYgaXQncyBub3QsIHRoZW4gSyB3aWxsIGJlIGRlZmF1bHRlZCB0byBULlxuICAgIHJldHVybiB0aGlzLmV4cGFuc2lvbktleT8uKGRhdGFOb2RlKSA/PyAoZGF0YU5vZGUgYXMgdW5rbm93biBhcyBLKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEFyaWFTZXQobm9kZTogVCkge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKTtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9wYXJlbnRzLmdldChrZXkpO1xuICAgIGNvbnN0IHBhcmVudEtleSA9IHBhcmVudCA/IHRoaXMuX2dldEV4cGFuc2lvbktleShwYXJlbnQpIDogbnVsbDtcbiAgICBjb25zdCBzZXQgPSB0aGlzLl9hcmlhU2V0cy5nZXQocGFyZW50S2V5KTtcbiAgICByZXR1cm4gc2V0ID8/IFtub2RlXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgcGFyZW50IGZvciB0aGUgZ2l2ZW4gbm9kZS4gSWYgdGhpcyBpcyBhIHJvb3Qgbm9kZSwgdGhpc1xuICAgKiByZXR1cm5zIG51bGwuIElmIHdlJ3JlIHVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHBhcmVudCwgZm9yIGV4YW1wbGUsXG4gICAqIGlmIHdlIGRvbid0IGhhdmUgY2FjaGVkIG5vZGUgZGF0YSwgdGhpcyByZXR1cm5zIHVuZGVmaW5lZC5cbiAgICovXG4gIHByaXZhdGUgX2ZpbmRQYXJlbnRGb3JOb2RlKG5vZGU6IFQsIGluZGV4OiBudW1iZXIsIGNhY2hlZE5vZGVzOiByZWFkb25seSBUW10pOiBUIHwgbnVsbCB7XG4gICAgLy8gSW4gYWxsIGNhc2VzLCB3ZSBoYXZlIGEgbWFwcGluZyBmcm9tIG5vZGUgdG8gbGV2ZWw7IGFsbCB3ZSBuZWVkIHRvIGRvIGhlcmUgaXMgYmFja3RyYWNrIGluXG4gICAgLy8gb3VyIGZsYXR0ZW5lZCBsaXN0IG9mIG5vZGVzIHRvIGRldGVybWluZSB0aGUgZmlyc3Qgbm9kZSB0aGF0J3Mgb2YgYSBsZXZlbCBsb3dlciB0aGFuIHRoZVxuICAgIC8vIHByb3ZpZGVkIG5vZGUuXG4gICAgaWYgKCFjYWNoZWROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50TGV2ZWwgPSB0aGlzLl9sZXZlbHMuZ2V0KHRoaXMuX2dldEV4cGFuc2lvbktleShub2RlKSkgPz8gMDtcbiAgICBmb3IgKGxldCBwYXJlbnRJbmRleCA9IGluZGV4IC0gMTsgcGFyZW50SW5kZXggPj0gMDsgcGFyZW50SW5kZXgtLSkge1xuICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGNhY2hlZE5vZGVzW3BhcmVudEluZGV4XTtcbiAgICAgIGNvbnN0IHBhcmVudExldmVsID0gdGhpcy5fbGV2ZWxzLmdldCh0aGlzLl9nZXRFeHBhbnNpb25LZXkocGFyZW50Tm9kZSkpID8/IDA7XG5cbiAgICAgIGlmIChwYXJlbnRMZXZlbCA8IGN1cnJlbnRMZXZlbCkge1xuICAgICAgICByZXR1cm4gcGFyZW50Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBzZXQgb2Ygcm9vdCBub2RlcyBhbmQgdGhlIGN1cnJlbnQgbm9kZSBsZXZlbCwgZmxhdHRlbnMgYW55IG5lc3RlZFxuICAgKiBub2RlcyBpbnRvIGEgc2luZ2xlIGFycmF5LlxuICAgKlxuICAgKiBJZiBhbnkgbm9kZXMgYXJlIG5vdCBleHBhbmRlZCwgdGhlbiB0aGVpciBjaGlsZHJlbiB3aWxsIG5vdCBiZSBhZGRlZCBpbnRvIHRoZSBhcnJheS5cbiAgICogVGhpcyB3aWxsIHN0aWxsIHRyYXZlcnNlIGFsbCBuZXN0ZWQgY2hpbGRyZW4gaW4gb3JkZXIgdG8gYnVpbGQgdXAgb3VyIGludGVybmFsIGRhdGFcbiAgICogbW9kZWxzLCBidXQgd2lsbCBub3QgaW5jbHVkZSB0aGVtIGluIHRoZSByZXR1cm5lZCBhcnJheS5cbiAgICovXG4gIHByaXZhdGUgX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24obm9kZXM6IHJlYWRvbmx5IFRbXSwgbGV2ZWwgPSAwKTogT2JzZXJ2YWJsZTxUW10+IHtcbiAgICBjb25zdCBjaGlsZHJlbkFjY2Vzc29yID0gdGhpcy5fZ2V0Q2hpbGRyZW5BY2Nlc3NvcigpO1xuICAgIC8vIElmIHdlJ3JlIHVzaW5nIGEgbGV2ZWwgYWNjZXNzb3IsIHdlIGRvbid0IG5lZWQgdG8gZmxhdHRlbiBhbnl0aGluZy5cbiAgICBpZiAoIWNoaWxkcmVuQWNjZXNzb3IpIHtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoWy4uLm5vZGVzXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9ic2VydmFibGVPZiguLi5ub2RlcykucGlwZShcbiAgICAgIGNvbmNhdE1hcChub2RlID0+IHtcbiAgICAgICAgY29uc3QgcGFyZW50S2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KG5vZGUpO1xuICAgICAgICBpZiAoIXRoaXMuX3BhcmVudHMuaGFzKHBhcmVudEtleSkpIHtcbiAgICAgICAgICB0aGlzLl9wYXJlbnRzLnNldChwYXJlbnRLZXksIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xldmVscy5zZXQocGFyZW50S2V5LCBsZXZlbCk7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBjb2VyY2VPYnNlcnZhYmxlKGNoaWxkcmVuQWNjZXNzb3Iobm9kZSkpO1xuICAgICAgICByZXR1cm4gY29uY2F0KFxuICAgICAgICAgIG9ic2VydmFibGVPZihbbm9kZV0pLFxuICAgICAgICAgIGNoaWxkcmVuLnBpcGUoXG4gICAgICAgICAgICB0YWtlKDEpLFxuICAgICAgICAgICAgdGFwKGNoaWxkTm9kZXMgPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9hcmlhU2V0cy5zZXQocGFyZW50S2V5LCBbLi4uKGNoaWxkTm9kZXMgPz8gW10pXSk7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGROb2RlcyA/PyBbXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkS2V5ID0gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KGNoaWxkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnRzLnNldChjaGlsZEtleSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGV2ZWxzLnNldChjaGlsZEtleSwgbGV2ZWwgKyAxKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzd2l0Y2hNYXAoY2hpbGROb2RlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICghY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlT2YoW10pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLl9mbGF0dGVuTmVzdGVkTm9kZXNXaXRoRXhwYW5zaW9uKGNoaWxkTm9kZXMsIGxldmVsICsgMSkucGlwZShcbiAgICAgICAgICAgICAgICBtYXAobmVzdGVkTm9kZXMgPT4gKHRoaXMuaXNFeHBhbmRlZChub2RlKSA/IG5lc3RlZE5vZGVzIDogW10pKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIHJlZHVjZSgocmVzdWx0cywgY2hpbGRyZW4pID0+IHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLmNoaWxkcmVuKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9LCBbXSBhcyBUW10pLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgY2hpbGRyZW4gZm9yIGNlcnRhaW4gdHJlZSBjb25maWd1cmF0aW9ucy5cbiAgICpcbiAgICogVGhpcyBhbHNvIGNvbXB1dGVzIHBhcmVudCwgbGV2ZWwsIGFuZCBncm91cCBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29tcHV0ZVJlbmRlcmluZ0RhdGEoXG4gICAgbm9kZXM6IHJlYWRvbmx5IFRbXSxcbiAgICBub2RlVHlwZTogJ2ZsYXQnIHwgJ25lc3RlZCcsXG4gICk6IE9ic2VydmFibGU8e1xuICAgIHJlbmRlck5vZGVzOiByZWFkb25seSBUW107XG4gICAgZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXTtcbiAgfT4ge1xuICAgIC8vIFRoZSBvbmx5IHNpdHVhdGlvbnMgd2hlcmUgd2UgaGF2ZSB0byBjb252ZXJ0IGNoaWxkcmVuIHR5cGVzIGlzIHdoZW5cbiAgICAvLyB0aGV5J3JlIG1pc21hdGNoZWQ7IGkuZS4gaWYgdGhlIHRyZWUgaXMgdXNpbmcgYSBjaGlsZHJlbkFjY2Vzc29yIGFuZCB0aGVcbiAgICAvLyBub2RlcyBhcmUgZmxhdCwgb3IgaWYgdGhlIHRyZWUgaXMgdXNpbmcgYSBsZXZlbEFjY2Vzc29yIGFuZCB0aGUgbm9kZXMgYXJlXG4gICAgLy8gbmVzdGVkLlxuICAgIGlmICh0aGlzLmNoaWxkcmVuQWNjZXNzb3IgJiYgbm9kZVR5cGUgPT09ICdmbGF0Jykge1xuICAgICAgLy8gVGhpcyBmbGF0dGVucyBjaGlsZHJlbiBpbnRvIGEgc2luZ2xlIGFycmF5LlxuICAgICAgdGhpcy5fYXJpYVNldHMuc2V0KG51bGwsIFsuLi5ub2Rlc10pO1xuICAgICAgcmV0dXJuIHRoaXMuX2ZsYXR0ZW5OZXN0ZWROb2Rlc1dpdGhFeHBhbnNpb24obm9kZXMpLnBpcGUoXG4gICAgICAgIG1hcChmbGF0dGVuZWROb2RlcyA9PiAoe1xuICAgICAgICAgIHJlbmRlck5vZGVzOiBmbGF0dGVuZWROb2RlcyxcbiAgICAgICAgICBmbGF0dGVuZWROb2RlcyxcbiAgICAgICAgfSkpLFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubGV2ZWxBY2Nlc3NvciAmJiBub2RlVHlwZSA9PT0gJ25lc3RlZCcpIHtcbiAgICAgIC8vIEluIHRoZSBuZXN0ZWQgY2FzZSwgd2Ugb25seSBsb29rIGZvciByb290IG5vZGVzLiBUaGUgQ2RrTmVzdGVkTm9kZVxuICAgICAgLy8gaXRzZWxmIHdpbGwgaGFuZGxlIHJlbmRlcmluZyBlYWNoIGluZGl2aWR1YWwgbm9kZSdzIGNoaWxkcmVuLlxuICAgICAgY29uc3QgbGV2ZWxBY2Nlc3NvciA9IHRoaXMubGV2ZWxBY2Nlc3NvcjtcbiAgICAgIHJldHVybiBvYnNlcnZhYmxlT2Yobm9kZXMuZmlsdGVyKG5vZGUgPT4gbGV2ZWxBY2Nlc3Nvcihub2RlKSA9PT0gMCkpLnBpcGUoXG4gICAgICAgIG1hcChyb290Tm9kZXMgPT4gKHtcbiAgICAgICAgICByZW5kZXJOb2Rlczogcm9vdE5vZGVzLFxuICAgICAgICAgIGZsYXR0ZW5lZE5vZGVzOiBub2RlcyxcbiAgICAgICAgfSkpLFxuICAgICAgICB0YXAoKHtmbGF0dGVuZWROb2Rlc30pID0+IHtcbiAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVQYXJlbnRzKGZsYXR0ZW5lZE5vZGVzKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdmbGF0Jykge1xuICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYSBUcmVlQ29udHJvbCwgd2Uga25vdyB0aGF0IHRoZSBub2RlIHR5cGUgbWF0Y2hlcyB1cFxuICAgICAgLy8gd2l0aCB0aGUgVHJlZUNvbnRyb2wsIGFuZCBzbyBubyBjb252ZXJzaW9ucyBhcmUgbmVjZXNzYXJ5LiBPdGhlcndpc2UsXG4gICAgICAvLyB3ZSd2ZSBhbHJlYWR5IGNvbmZpcm1lZCB0aGF0IHRoZSBkYXRhIG1vZGVsIG1hdGNoZXMgdXAgd2l0aCB0aGVcbiAgICAgIC8vIGRlc2lyZWQgbm9kZSB0eXBlIGhlcmUuXG4gICAgICByZXR1cm4gb2JzZXJ2YWJsZU9mKHtyZW5kZXJOb2Rlczogbm9kZXMsIGZsYXR0ZW5lZE5vZGVzOiBub2Rlc30pLnBpcGUoXG4gICAgICAgIHRhcCgoe2ZsYXR0ZW5lZE5vZGVzfSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZVBhcmVudHMoZmxhdHRlbmVkTm9kZXMpO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBuZXN0ZWQgbm9kZXMsIHdlIHN0aWxsIG5lZWQgdG8gcGVyZm9ybSB0aGUgbm9kZSBmbGF0dGVuaW5nIGluIG9yZGVyXG4gICAgICAvLyB0byBtYWludGFpbiBvdXIgY2FjaGVzIGZvciB2YXJpb3VzIHRyZWUgb3BlcmF0aW9ucy5cbiAgICAgIHRoaXMuX2FyaWFTZXRzLnNldChudWxsLCBbLi4ubm9kZXNdKTtcbiAgICAgIHJldHVybiB0aGlzLl9mbGF0dGVuTmVzdGVkTm9kZXNXaXRoRXhwYW5zaW9uKG5vZGVzKS5waXBlKFxuICAgICAgICBtYXAoZmxhdHRlbmVkTm9kZXMgPT4gKHtcbiAgICAgICAgICByZW5kZXJOb2Rlczogbm9kZXMsXG4gICAgICAgICAgZmxhdHRlbmVkTm9kZXMsXG4gICAgICAgIH0pKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlQ2FjaGVkRGF0YShmbGF0dGVuZWROb2RlczogcmVhZG9ubHkgVFtdKSB7XG4gICAgdGhpcy5fZmxhdHRlbmVkTm9kZXMubmV4dChmbGF0dGVuZWROb2Rlcyk7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVLZXlNYW5hZ2VySXRlbXMoZmxhdHRlbmVkTm9kZXM6IHJlYWRvbmx5IFRbXSkge1xuICAgIHRoaXMuX2tleU1hbmFnZXJOb2Rlcy5uZXh0KGZsYXR0ZW5lZE5vZGVzKTtcbiAgfVxuXG4gIC8qKiBUcmF2ZXJzZSB0aGUgZmxhdHRlbmVkIG5vZGUgZGF0YSBhbmQgY29tcHV0ZSBwYXJlbnRzLCBsZXZlbHMsIGFuZCBncm91cCBkYXRhLiAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVQYXJlbnRzKGZsYXR0ZW5lZE5vZGVzOiByZWFkb25seSBUW10pOiB2b2lkIHtcbiAgICBjb25zdCBsZXZlbEFjY2Vzc29yID0gdGhpcy5fZ2V0TGV2ZWxBY2Nlc3NvcigpO1xuICAgIGlmICghbGV2ZWxBY2Nlc3Nvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3BhcmVudHMuY2xlYXIoKTtcbiAgICB0aGlzLl9hcmlhU2V0cy5jbGVhcigpO1xuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZsYXR0ZW5lZE5vZGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgZGF0YU5vZGUgPSBmbGF0dGVuZWROb2Rlc1tpbmRleF07XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRFeHBhbnNpb25LZXkoZGF0YU5vZGUpO1xuICAgICAgdGhpcy5fbGV2ZWxzLnNldChrZXksIGxldmVsQWNjZXNzb3IoZGF0YU5vZGUpKTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX2ZpbmRQYXJlbnRGb3JOb2RlKGRhdGFOb2RlLCBpbmRleCwgZmxhdHRlbmVkTm9kZXMpO1xuICAgICAgdGhpcy5fcGFyZW50cy5zZXQoa2V5LCBwYXJlbnQpO1xuICAgICAgY29uc3QgcGFyZW50S2V5ID0gcGFyZW50ID8gdGhpcy5fZ2V0RXhwYW5zaW9uS2V5KHBhcmVudCkgOiBudWxsO1xuXG4gICAgICBjb25zdCBncm91cCA9IHRoaXMuX2FyaWFTZXRzLmdldChwYXJlbnRLZXkpID8/IFtdO1xuICAgICAgZ3JvdXAuc3BsaWNlKGluZGV4LCAwLCBkYXRhTm9kZSk7XG4gICAgICB0aGlzLl9hcmlhU2V0cy5zZXQocGFyZW50S2V5LCBncm91cCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVHJlZSBub2RlIGZvciBDZGtUcmVlLiBJdCBjb250YWlucyB0aGUgZGF0YSBpbiB0aGUgdHJlZSBub2RlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstdHJlZS1ub2RlJyxcbiAgZXhwb3J0QXM6ICdjZGtUcmVlTm9kZScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUtbm9kZScsXG4gICAgJ1thdHRyLmFyaWEtZXhwYW5kZWRdJzogJ19nZXRBcmlhRXhwYW5kZWQoKScsXG4gICAgJ1thdHRyLmFyaWEtbGV2ZWxdJzogJ2xldmVsICsgMScsXG4gICAgJ1thdHRyLmFyaWEtcG9zaW5zZXRdJzogJ19nZXRQb3NpdGlvbkluU2V0KCknLFxuICAgICdbYXR0ci5hcmlhLXNldHNpemVdJzogJ19nZXRTZXRTaXplKCknLFxuICAgICdbdGFiaW5kZXhdJzogJ190YWJpbmRleCcsXG4gICAgJ3JvbGUnOiAndHJlZWl0ZW0nLFxuICAgICcoY2xpY2spJzogJ19zZXRBY3RpdmVJdGVtKCknLFxuICAgICcoZm9jdXMpJzogJ19mb2N1c0l0ZW0oKScsXG4gIH0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlPFQsIEsgPSBUPiBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25Jbml0LCBUcmVlS2V5TWFuYWdlckl0ZW0ge1xuICBwcm90ZWN0ZWQgX3RhYmluZGV4OiBudW1iZXIgfCBudWxsID0gLTE7XG5cbiAgLyoqXG4gICAqIFRoZSByb2xlIG9mIHRoZSB0cmVlIG5vZGUuXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSBpZ25vcmVkOyB0aGUgdHJlZSB3aWxsIGF1dG9tYXRpY2FsbHkgZGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSByb2xlXG4gICAqIGZvciB0cmVlIG5vZGUuIFRoaXMgaW5wdXQgd2lsbCBiZSByZW1vdmVkIGluIGEgZnV0dXJlIHZlcnNpb24uXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMjEuMC4wXG4gICAqL1xuICBASW5wdXQoKSBnZXQgcm9sZSgpOiAndHJlZWl0ZW0nIHwgJ2dyb3VwJyB7XG4gICAgcmV0dXJuICd0cmVlaXRlbSc7XG4gIH1cblxuICBzZXQgcm9sZShfcm9sZTogJ3RyZWVpdGVtJyB8ICdncm91cCcpIHtcbiAgICAvLyBpZ25vcmUgYW55IHJvbGUgc2V0dGluZywgd2UgaGFuZGxlIHRoaXMgaW50ZXJuYWxseS5cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgaXMgZXhwYW5kYWJsZS5cbiAgICpcbiAgICogSWYgbm90IHVzaW5nIGBGbGF0VHJlZUNvbnRyb2xgLCBvciBpZiBgaXNFeHBhbmRhYmxlYCBpcyBub3QgcHJvdmlkZWQgdG9cbiAgICogYE5lc3RlZFRyZWVDb250cm9sYCwgdGhpcyBzaG91bGQgYmUgcHJvdmlkZWQgZm9yIGNvcnJlY3Qgbm9kZSBhMTF5LlxuICAgKi9cbiAgQElucHV0KHt0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KVxuICBnZXQgaXNFeHBhbmRhYmxlKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0V4cGFuZGFibGUoKTtcbiAgfVxuICBzZXQgaXNFeHBhbmRhYmxlKGlzRXhwYW5kYWJsZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2lucHV0SXNFeHBhbmRhYmxlID0gaXNFeHBhbmRhYmxlO1xuICAgIGlmICgodGhpcy5kYXRhICYmICF0aGlzLl9pc0V4cGFuZGFibGUpIHx8ICF0aGlzLl9pbnB1dElzRXhwYW5kYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBiZWluZyBzZXQgdG8gZXhwYW5kYWJsZSwgZW5zdXJlIHRoYXQgdGhlIHN0YXR1cyBvZiB0aGVcbiAgICAvLyBub2RlIGlzIHByb3BhZ2F0ZWRcbiAgICBpZiAodGhpcy5faW5wdXRJc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmV4cGFuZCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faW5wdXRJc0V4cGFuZGVkID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5jb2xsYXBzZSgpO1xuICAgIH1cbiAgfVxuXG4gIEBJbnB1dCgpXG4gIGdldCBpc0V4cGFuZGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90cmVlLmlzRXhwYW5kZWQodGhpcy5fZGF0YSk7XG4gIH1cbiAgc2V0IGlzRXhwYW5kZWQoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIHRoaXMuX2lucHV0SXNFeHBhbmRlZCA9IGlzRXhwYW5kZWQ7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29sbGFwc2UoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhpcyBub2RlIGlzIGRpc2FibGVkLiBJZiBpdCdzIGRpc2FibGVkLCB0aGVuIHRoZSB1c2VyIHdvbid0IGJlIGFibGUgdG8gZm9jdXNcbiAgICogb3IgYWN0aXZhdGUgdGhpcyBub2RlLlxuICAgKi9cbiAgQElucHV0KHt0cmFuc2Zvcm06IGJvb2xlYW5BdHRyaWJ1dGV9KSBpc0Rpc2FibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgdGV4dCB1c2VkIHRvIGxvY2F0ZSB0aGlzIGl0ZW0gZHVyaW5nIHR5cGVhaGVhZC4gSWYgbm90IHNwZWNpZmllZCwgdGhlIGB0ZXh0Q29udGVudGAgd2lsbFxuICAgKiB3aWxsIGJlIHVzZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlVHlwZWFoZWFkTGFiZWwnKSB0eXBlYWhlYWRMYWJlbDogc3RyaW5nIHwgbnVsbDtcblxuICBnZXRMYWJlbCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnR5cGVhaGVhZExhYmVsIHx8IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuICB9XG5cbiAgLyoqIFRoaXMgZW1pdHMgd2hlbiB0aGUgbm9kZSBoYXMgYmVlbiBwcm9ncmFtYXRpY2FsbHkgYWN0aXZhdGVkIG9yIGFjdGl2YXRlZCBieSBrZXlib2FyZC4gKi9cbiAgQE91dHB1dCgpXG4gIHJlYWRvbmx5IGFjdGl2YXRpb246IEV2ZW50RW1pdHRlcjxUPiA9IG5ldyBFdmVudEVtaXR0ZXI8VD4oKTtcblxuICAvKiogVGhpcyBlbWl0cyB3aGVuIHRoZSBub2RlJ3MgZXhwYW5zaW9uIHN0YXR1cyBoYXMgYmVlbiBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KClcbiAgcmVhZG9ubHkgZXhwYW5kZWRDaGFuZ2U6IEV2ZW50RW1pdHRlcjxib29sZWFuPiA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICAvKipcbiAgICogVGhlIG1vc3QgcmVjZW50bHkgY3JlYXRlZCBgQ2RrVHJlZU5vZGVgLiBXZSBzYXZlIGl0IGluIHN0YXRpYyB2YXJpYWJsZSBzbyB3ZSBjYW4gcmV0cmlldmUgaXRcbiAgICogaW4gYENka1RyZWVgIGFuZCBzZXQgdGhlIGRhdGEgdG8gaXQuXG4gICAqL1xuICBzdGF0aWMgbW9zdFJlY2VudFRyZWVOb2RlOiBDZGtUcmVlTm9kZTxhbnk+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG5vZGUncyBkYXRhIGhhcyBjaGFuZ2VkLiAqL1xuICByZWFkb25seSBfZGF0YUNoYW5nZXMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX2lucHV0SXNFeHBhbmRhYmxlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2lucHV0SXNFeHBhbmRlZDogYm9vbGVhbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIEZsYWcgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIGJlIGZvY3VzaW5nIHRoZSBhY3R1YWwgZWxlbWVudCBiYXNlZCBvblxuICAgKiBzb21lIHVzZXIgaW50ZXJhY3Rpb24gKGNsaWNrIG9yIGZvY3VzKS4gT24gY2xpY2ssIHdlIGRvbid0IGZvcmNpYmx5IGZvY3VzIHRoZSBlbGVtZW50XG4gICAqIHNpbmNlIHRoZSBjbGljayBjb3VsZCB0cmlnZ2VyIHNvbWUgb3RoZXIgY29tcG9uZW50IHRoYXQgd2FudHMgdG8gZ3JhYiBpdHMgb3duIGZvY3VzXG4gICAqIChlLmcuIG1lbnUsIGRpYWxvZykuXG4gICAqL1xuICBwcml2YXRlIF9zaG91bGRGb2N1cyA9IHRydWU7XG4gIHByaXZhdGUgX3BhcmVudE5vZGVBcmlhTGV2ZWw6IG51bWJlcjtcblxuICAvKiogVGhlIHRyZWUgbm9kZSdzIGRhdGEuICovXG4gIGdldCBkYXRhKCk6IFQge1xuICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICB9XG4gIHNldCBkYXRhKHZhbHVlOiBUKSB7XG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLl9kYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdmFsdWU7XG4gICAgICB0aGlzLl9kYXRhQ2hhbmdlcy5uZXh0KCk7XG4gICAgfVxuICB9XG4gIHByb3RlY3RlZCBfZGF0YTogVDtcblxuICAvKiBJZiBsZWFmIG5vZGUsIHJldHVybiB0cnVlIHRvIG5vdCBhc3NpZ24gYXJpYS1leHBhbmRlZCBhdHRyaWJ1dGUgKi9cbiAgZ2V0IGlzTGVhZk5vZGUoKTogYm9vbGVhbiB7XG4gICAgLy8gSWYgZmxhdCB0cmVlIG5vZGUgZGF0YSByZXR1cm5zIGZhbHNlIGZvciBleHBhbmRhYmxlIHByb3BlcnR5LCBpdCdzIGEgbGVhZiBub2RlXG4gICAgaWYgKFxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uaXNFeHBhbmRhYmxlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICF0aGlzLl90cmVlLnRyZWVDb250cm9sLmlzRXhwYW5kYWJsZSh0aGlzLl9kYXRhKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIElmIG5lc3RlZCB0cmVlIG5vZGUgZGF0YSByZXR1cm5zIDAgZGVzY2VuZGFudHMsIGl0J3MgYSBsZWFmIG5vZGVcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbD8uaXNFeHBhbmRhYmxlID09PSB1bmRlZmluZWQgJiZcbiAgICAgIHRoaXMuX3RyZWUudHJlZUNvbnRyb2w/LmdldERlc2NlbmRhbnRzKHRoaXMuX2RhdGEpLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0IGxldmVsKCk6IG51bWJlciB7XG4gICAgLy8gSWYgdGhlIHRyZWUgaGFzIGEgbGV2ZWxBY2Nlc3NvciwgdXNlIGl0IHRvIGdldCB0aGUgbGV2ZWwuIE90aGVyd2lzZSByZWFkIHRoZVxuICAgIC8vIGFyaWEtbGV2ZWwgb2ZmIHRoZSBwYXJlbnQgbm9kZSBhbmQgdXNlIGl0IGFzIHRoZSBsZXZlbCBmb3IgdGhpcyBub2RlIChub3RlIGFyaWEtbGV2ZWwgaXNcbiAgICAvLyAxLWluZGV4ZWQsIHdoaWxlIHRoaXMgcHJvcGVydHkgaXMgMC1pbmRleGVkLCBzbyB3ZSBkb24ndCBuZWVkIHRvIGluY3JlbWVudCkuXG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldExldmVsKHRoaXMuX2RhdGEpID8/IHRoaXMuX3BhcmVudE5vZGVBcmlhTGV2ZWw7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyBpZiB0aGUgdHJlZSBub2RlIGlzIGV4cGFuZGFibGUuICovXG4gIF9pc0V4cGFuZGFibGUoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX3RyZWUudHJlZUNvbnRyb2wpIHtcbiAgICAgIGlmICh0aGlzLmlzTGVhZk5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgY29tcGF0aWJpbGl0eSB3aXRoIHRyZWVzIGNyZWF0ZWQgdXNpbmcgVHJlZUNvbnRyb2wgYmVmb3JlIHdlIGFkZGVkXG4gICAgICAvLyBDZGtUcmVlTm9kZSNpc0V4cGFuZGFibGUuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lucHV0SXNFeHBhbmRhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIHZhbHVlIGZvciBgYXJpYS1leHBhbmRlZGAuXG4gICAqXG4gICAqIEZvciBub24tZXhwYW5kYWJsZSBub2RlcywgdGhpcyBpcyBgbnVsbGAuXG4gICAqL1xuICBfZ2V0QXJpYUV4cGFuZGVkKCk6IHN0cmluZyB8IG51bGwge1xuICAgIGlmICghdGhpcy5faXNFeHBhbmRhYmxlKCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgc2l6ZSBvZiB0aGlzIG5vZGUncyBwYXJlbnQncyBjaGlsZCBzZXQuXG4gICAqXG4gICAqIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgYGFyaWEtc2V0c2l6ZWAuXG4gICAqL1xuICBfZ2V0U2V0U2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXRTZXRTaXplKHRoaXMuX2RhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGluZGV4IChzdGFydGluZyBmcm9tIDEpIG9mIHRoaXMgbm9kZSBpbiBpdHMgcGFyZW50J3MgY2hpbGQgc2V0LlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGBhcmlhLXBvc2luc2V0YC5cbiAgICovXG4gIF9nZXRQb3NpdGlvbkluU2V0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3RyZWUuX2dldFBvc2l0aW9uSW5TZXQodGhpcy5fZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZiA9IGluamVjdChDaGFuZ2VEZXRlY3RvclJlZik7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJvdGVjdGVkIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcm90ZWN0ZWQgX3RyZWU6IENka1RyZWU8VCwgSz4sXG4gICkge1xuICAgIENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSA9IHRoaXMgYXMgQ2RrVHJlZU5vZGU8VCwgSz47XG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXJlbnROb2RlQXJpYUxldmVsID0gZ2V0UGFyZW50Tm9kZUFyaWFMZXZlbCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX3RyZWVcbiAgICAgIC5fZ2V0RXhwYW5zaW9uTW9kZWwoKVxuICAgICAgLmNoYW5nZWQucGlwZShcbiAgICAgICAgbWFwKCgpID0+IHRoaXMuaXNFeHBhbmRlZCksXG4gICAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgICB9KTtcbiAgICB0aGlzLl90cmVlLl9zZXROb2RlVHlwZUlmVW5zZXQoJ2ZsYXQnKTtcbiAgICB0aGlzLl90cmVlLl9yZWdpc3Rlck5vZGUodGhpcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRyZWUgbm9kZSBiZWluZyBkZXN0cm95ZWQsXG4gICAgLy8gY2xlYXIgb3V0IHRoZSByZWZlcmVuY2UgdG8gYXZvaWQgbGVha2luZyBtZW1vcnkuXG4gICAgaWYgKENka1RyZWVOb2RlLm1vc3RSZWNlbnRUcmVlTm9kZSA9PT0gdGhpcykge1xuICAgICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhQ2hhbmdlcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICBnZXRQYXJlbnQoKTogQ2RrVHJlZU5vZGU8VCwgSz4gfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fdHJlZS5fZ2V0Tm9kZVBhcmVudCh0aGlzKSA/PyBudWxsO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKTogQ2RrVHJlZU5vZGU8VCwgSz5bXSB8IE9ic2VydmFibGU8Q2RrVHJlZU5vZGU8VCwgSz5bXT4ge1xuICAgIHJldHVybiB0aGlzLl90cmVlLl9nZXROb2RlQ2hpbGRyZW4odGhpcyk7XG4gIH1cblxuICAvKiogRm9jdXNlcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgZm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5fdGFiaW5kZXggPSAwO1xuICAgIGlmICh0aGlzLl9zaG91bGRGb2N1cykge1xuICAgICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRGVmb2N1cyB0aGlzIGRhdGEgbm9kZS4gKi9cbiAgdW5mb2N1cygpOiB2b2lkIHtcbiAgICB0aGlzLl90YWJpbmRleCA9IC0xO1xuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRW1pdHMgYW4gYWN0aXZhdGlvbiBldmVudC4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2YXRpb24ubmV4dCh0aGlzLl9kYXRhKTtcbiAgfVxuXG4gIC8qKiBDb2xsYXBzZXMgdGhpcyBkYXRhIG5vZGUuIEltcGxlbWVudGVkIGZvciBUcmVlS2V5TWFuYWdlckl0ZW0uICovXG4gIGNvbGxhcHNlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzRXhwYW5kYWJsZSkge1xuICAgICAgdGhpcy5fdHJlZS5jb2xsYXBzZSh0aGlzLl9kYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKiogRXhwYW5kcyB0aGlzIGRhdGEgbm9kZS4gSW1wbGVtZW50ZWQgZm9yIFRyZWVLZXlNYW5hZ2VySXRlbS4gKi9cbiAgZXhwYW5kKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzRXhwYW5kYWJsZSkge1xuICAgICAgdGhpcy5fdHJlZS5leHBhbmQodGhpcy5fZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgX2ZvY3VzSXRlbSgpIHtcbiAgICBpZiAodGhpcy5pc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3RyZWUuX2tleU1hbmFnZXIuZm9jdXNJdGVtKHRoaXMpO1xuICB9XG5cbiAgX3NldEFjdGl2ZUl0ZW0oKSB7XG4gICAgaWYgKHRoaXMuaXNEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9zaG91bGRGb2N1cyA9IGZhbHNlO1xuICAgIHRoaXMuX3RyZWUuX2tleU1hbmFnZXIuZm9jdXNJdGVtKHRoaXMpO1xuICAgIHRoaXMuX3Nob3VsZEZvY3VzID0gdHJ1ZTtcbiAgfVxuXG4gIF9lbWl0RXhwYW5zaW9uU3RhdGUoZXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmV4cGFuZGVkQ2hhbmdlLmVtaXQoZXhwYW5kZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudE5vZGVBcmlhTGV2ZWwobm9kZUVsZW1lbnQ6IEhUTUxFbGVtZW50KTogbnVtYmVyIHtcbiAgbGV0IHBhcmVudCA9IG5vZGVFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gIHdoaWxlIChwYXJlbnQgJiYgIWlzTm9kZUVsZW1lbnQocGFyZW50KSkge1xuICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50O1xuICB9XG4gIGlmICghcGFyZW50KSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgdGhyb3cgRXJyb3IoJ0luY29ycmVjdCB0cmVlIHN0cnVjdHVyZSBjb250YWluaW5nIGRldGFjaGVkIG5vZGUuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocGFyZW50LmNsYXNzTGlzdC5jb250YWlucygnY2RrLW5lc3RlZC10cmVlLW5vZGUnKSkge1xuICAgIHJldHVybiBudW1iZXJBdHRyaWJ1dGUocGFyZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sZXZlbCcpISk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIGFuY2VzdG9yIGVsZW1lbnQgaXMgdGhlIGNkay10cmVlIGl0c2VsZlxuICAgIHJldHVybiAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgY29uc3QgY2xhc3NMaXN0ID0gZWxlbWVudC5jbGFzc0xpc3Q7XG4gIHJldHVybiAhIShjbGFzc0xpc3Q/LmNvbnRhaW5zKCdjZGstbmVzdGVkLXRyZWUtbm9kZScpIHx8IGNsYXNzTGlzdD8uY29udGFpbnMoJ2Nkay10cmVlJykpO1xufVxuIl19