import { SelectionModel } from './_selection-model-chunk.mjs';
import { isObservable, Subject, BehaviorSubject, of, combineLatest, EMPTY, concat } from 'rxjs';
import { take, filter, takeUntil, startWith, tap, switchMap, map, reduce, concatMap, distinctUntilChanged } from 'rxjs/operators';
import * as i0 from '@angular/core';
import { InjectionToken, inject, ViewContainerRef, Directive, TemplateRef, IterableDiffers, ChangeDetectorRef, ElementRef, Component, ViewEncapsulation, ChangeDetectionStrategy, Input, ViewChild, ContentChildren, EventEmitter, booleanAttribute, Output, numberAttribute, NgModule } from '@angular/core';
import { TREE_KEY_MANAGER } from './_tree-key-manager-chunk.mjs';
import { Directionality } from './_directionality-chunk.mjs';
import { isDataSource } from './_data-source-chunk.mjs';
import { coerceObservable } from './coercion-private.mjs';
import './_typeahead-chunk.mjs';
import './_keycodes-chunk.mjs';

class BaseTreeControl {
  dataNodes;
  expansionModel = new SelectionModel(true);
  trackBy;
  getLevel;
  isExpandable;
  getChildren;
  toggle(dataNode) {
    this.expansionModel.toggle(this._trackByValue(dataNode));
  }
  expand(dataNode) {
    this.expansionModel.select(this._trackByValue(dataNode));
  }
  collapse(dataNode) {
    this.expansionModel.deselect(this._trackByValue(dataNode));
  }
  isExpanded(dataNode) {
    return this.expansionModel.isSelected(this._trackByValue(dataNode));
  }
  toggleDescendants(dataNode) {
    this.expansionModel.isSelected(this._trackByValue(dataNode)) ? this.collapseDescendants(dataNode) : this.expandDescendants(dataNode);
  }
  collapseAll() {
    this.expansionModel.clear();
  }
  expandDescendants(dataNode) {
    let toBeProcessed = [dataNode];
    toBeProcessed.push(...this.getDescendants(dataNode));
    this.expansionModel.select(...toBeProcessed.map(value => this._trackByValue(value)));
  }
  collapseDescendants(dataNode) {
    let toBeProcessed = [dataNode];
    toBeProcessed.push(...this.getDescendants(dataNode));
    this.expansionModel.deselect(...toBeProcessed.map(value => this._trackByValue(value)));
  }
  _trackByValue(value) {
    return this.trackBy ? this.trackBy(value) : value;
  }
}

class FlatTreeControl extends BaseTreeControl {
  getLevel;
  isExpandable;
  options;
  constructor(getLevel, isExpandable, options) {
    super();
    this.getLevel = getLevel;
    this.isExpandable = isExpandable;
    this.options = options;
    if (this.options) {
      this.trackBy = this.options.trackBy;
    }
  }
  getDescendants(dataNode) {
    const startIndex = this.dataNodes.indexOf(dataNode);
    const results = [];
    for (let i = startIndex + 1; i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]); i++) {
      results.push(this.dataNodes[i]);
    }
    return results;
  }
  expandAll() {
    this.expansionModel.select(...this.dataNodes.map(node => this._trackByValue(node)));
  }
}

class NestedTreeControl extends BaseTreeControl {
  getChildren;
  options;
  constructor(getChildren, options) {
    super();
    this.getChildren = getChildren;
    this.options = options;
    if (this.options) {
      this.trackBy = this.options.trackBy;
    }
    if (this.options?.isExpandable) {
      this.isExpandable = this.options.isExpandable;
    }
  }
  expandAll() {
    this.expansionModel.clear();
    const allNodes = this.dataNodes.reduce((accumulator, dataNode) => [...accumulator, ...this.getDescendants(dataNode), dataNode], []);
    this.expansionModel.select(...allNodes.map(node => this._trackByValue(node)));
  }
  getDescendants(dataNode) {
    const descendants = [];
    this._getDescendants(descendants, dataNode);
    return descendants.splice(1);
  }
  _getDescendants(descendants, dataNode) {
    descendants.push(dataNode);
    const childrenNodes = this.getChildren(dataNode);
    if (Array.isArray(childrenNodes)) {
      childrenNodes.forEach(child => this._getDescendants(descendants, child));
    } else if (isObservable(childrenNodes)) {
      childrenNodes.pipe(take(1), filter(Boolean)).subscribe(children => {
        for (const child of children) {
          this._getDescendants(descendants, child);
        }
      });
    }
  }
}

const CDK_TREE_NODE_OUTLET_NODE = new InjectionToken('CDK_TREE_NODE_OUTLET_NODE');
class CdkTreeNodeOutlet {
  viewContainer = inject(ViewContainerRef);
  _node = inject(CDK_TREE_NODE_OUTLET_NODE, {
    optional: true
  });
  constructor() {}
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeNodeOutlet,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkTreeNodeOutlet,
    isStandalone: true,
    selector: "[cdkTreeNodeOutlet]",
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTreeNodeOutlet,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkTreeNodeOutlet]'
    }]
  }],
  ctorParameters: () => []
});

class CdkTreeNodeOutletContext {
  $implicit;
  level;
  index;
  count;
  constructor(data) {
    this.$implicit = data;
  }
}
class CdkTreeNodeDef {
  template = inject(TemplateRef);
  when;
  constructor() {}
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeNodeDef,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkTreeNodeDef,
    isStandalone: true,
    selector: "[cdkTreeNodeDef]",
    inputs: {
      when: ["cdkTreeNodeDefWhen", "when"]
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTreeNodeDef,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkTreeNodeDef]',
      inputs: [{
        name: 'when',
        alias: 'cdkTreeNodeDefWhen'
      }]
    }]
  }],
  ctorParameters: () => []
});

function getTreeNoValidDataSourceError() {
  return Error(`A valid data source must be provided.`);
}
function getTreeMultipleDefaultNodeDefsError() {
  return Error(`There can only be one default row without a when predicate function.`);
}
function getTreeMissingMatchingNodeDefError() {
  return Error(`Could not find a matching node definition for the provided node data.`);
}
function getTreeControlMissingError() {
  return Error(`Could not find a tree control, levelAccessor, or childrenAccessor for the tree.`);
}
function getMultipleTreeControlsError() {
  return Error(`More than one of tree control, levelAccessor, or childrenAccessor were provided.`);
}

class CdkTree {
  _differs = inject(IterableDiffers);
  _changeDetectorRef = inject(ChangeDetectorRef);
  _elementRef = inject(ElementRef);
  _dir = inject(Directionality);
  _onDestroy = new Subject();
  _dataDiffer;
  _defaultNodeDef = null;
  _dataSubscription;
  _levels = new Map();
  _parents = new Map();
  _ariaSets = new Map();
  get dataSource() {
    return this._dataSource;
  }
  set dataSource(dataSource) {
    if (this._dataSource !== dataSource) {
      this._switchDataSource(dataSource);
    }
  }
  _dataSource;
  treeControl;
  levelAccessor;
  childrenAccessor;
  trackBy;
  expansionKey;
  _nodeOutlet;
  _nodeDefs;
  viewChange = new BehaviorSubject({
    start: 0,
    end: Number.MAX_VALUE
  });
  _expansionModel;
  _flattenedNodes = new BehaviorSubject([]);
  _nodeType = new BehaviorSubject(null);
  _nodes = new BehaviorSubject(new Map());
  _keyManagerNodes = new BehaviorSubject([]);
  _keyManagerFactory = inject(TREE_KEY_MANAGER);
  _keyManager;
  _viewInit = false;
  constructor() {}
  ngAfterContentInit() {
    this._initializeKeyManager();
  }
  ngAfterContentChecked() {
    this._updateDefaultNodeDefinition();
    this._subscribeToDataChanges();
  }
  ngOnDestroy() {
    this._nodeOutlet.viewContainer.clear();
    this._nodes.complete();
    this._keyManagerNodes.complete();
    this._nodeType.complete();
    this._flattenedNodes.complete();
    this.viewChange.complete();
    this._onDestroy.next();
    this._onDestroy.complete();
    if (this._dataSource && typeof this._dataSource.disconnect === 'function') {
      this.dataSource.disconnect(this);
    }
    this._dataSubscription?.unsubscribe();
    this._dataSubscription = undefined;
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
  _setNodeTypeIfUnset(newType) {
    const currentType = this._nodeType.value;
    if (currentType === null) {
      this._nodeType.next(newType);
    } else if ((typeof ngDevMode === 'undefined' || ngDevMode) && currentType !== newType) {
      console.warn(`Tree is using conflicting node types which can cause unexpected behavior. ` + `Please use tree nodes of the same type (e.g. only flat or only nested). ` + `Current node type: "${currentType}", new node type "${newType}".`);
    }
  }
  _switchDataSource(dataSource) {
    if (this._dataSource && typeof this._dataSource.disconnect === 'function') {
      this.dataSource.disconnect(this);
    }
    this._dataSubscription?.unsubscribe();
    this._dataSubscription = undefined;
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
  _subscribeToDataChanges() {
    if (this._dataSubscription) {
      return;
    }
    let dataStream;
    if (isDataSource(this._dataSource)) {
      dataStream = this._dataSource.connect(this);
    } else if (isObservable(this._dataSource)) {
      dataStream = this._dataSource;
    } else if (Array.isArray(this._dataSource)) {
      dataStream = of(this._dataSource);
    }
    if (!dataStream) {
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        throw getTreeNoValidDataSourceError();
      }
      return;
    }
    this._dataSubscription = this._getRenderData(dataStream).pipe(takeUntil(this._onDestroy)).subscribe(renderingData => {
      this._renderDataChanges(renderingData);
    });
  }
  _getRenderData(dataStream) {
    const expansionModel = this._getExpansionModel();
    return combineLatest([dataStream, this._nodeType, expansionModel.changed.pipe(startWith(null), tap(expansionChanges => {
      this._emitExpansionChanges(expansionChanges);
    }))]).pipe(switchMap(([data, nodeType]) => {
      if (nodeType === null) {
        return of({
          renderNodes: data,
          flattenedNodes: null,
          nodeType
        });
      }
      return this._computeRenderingData(data, nodeType).pipe(map(convertedData => ({
        ...convertedData,
        nodeType
      })));
    }));
  }
  _renderDataChanges(data) {
    if (data.nodeType === null) {
      this.renderNodeChanges(data.renderNodes);
      return;
    }
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
      horizontalOrientation: this._dir.value
    };
    this._keyManager = this._keyManagerFactory(items, keyManagerOptions);
  }
  _initializeDataDiffer() {
    const trackBy = this.trackBy ?? ((_index, item) => this._getExpansionKey(item));
    this._dataDiffer = this._differs.find([]).create(trackBy);
  }
  _checkTreeControlUsage() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
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
      } else if (numTreeControls > 1) {
        throw getMultipleTreeControlsError();
      }
    }
  }
  renderNodeChanges(data, dataDiffer = this._dataDiffer, viewContainer = this._nodeOutlet.viewContainer, parentData) {
    const changes = dataDiffer.diff(data);
    if (!changes && !this._viewInit) {
      return;
    }
    changes?.forEachOperation((item, adjustedPreviousIndex, currentIndex) => {
      if (item.previousIndex == null) {
        this.insertNode(data[currentIndex], currentIndex, viewContainer, parentData);
      } else if (currentIndex == null) {
        viewContainer.remove(adjustedPreviousIndex);
      } else {
        const view = viewContainer.get(adjustedPreviousIndex);
        viewContainer.move(view, currentIndex);
      }
    });
    changes?.forEachIdentityChange(record => {
      const newData = record.item;
      if (record.currentIndex != undefined) {
        const view = viewContainer.get(record.currentIndex);
        view.context.$implicit = newData;
      }
    });
    if (parentData) {
      this._changeDetectorRef.markForCheck();
    } else {
      this._changeDetectorRef.detectChanges();
    }
  }
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
  insertNode(nodeData, index, viewContainer, parentData) {
    const levelAccessor = this._getLevelAccessor();
    const node = this._getNodeDef(nodeData, index);
    const key = this._getExpansionKey(nodeData);
    const context = new CdkTreeNodeOutletContext(nodeData);
    context.index = index;
    parentData ??= this._parents.get(key) ?? undefined;
    if (levelAccessor) {
      context.level = levelAccessor(nodeData);
    } else if (parentData !== undefined && this._levels.has(this._getExpansionKey(parentData))) {
      context.level = this._levels.get(this._getExpansionKey(parentData)) + 1;
    } else {
      context.level = 0;
    }
    this._levels.set(key, context.level);
    const container = viewContainer ? viewContainer : this._nodeOutlet.viewContainer;
    container.createEmbeddedView(node.template, context, index);
    if (CdkTreeNode.mostRecentTreeNode) {
      CdkTreeNode.mostRecentTreeNode.data = nodeData;
    }
  }
  isExpanded(dataNode) {
    return !!(this.treeControl?.isExpanded(dataNode) || this._expansionModel?.isSelected(this._getExpansionKey(dataNode)));
  }
  toggle(dataNode) {
    if (this.treeControl) {
      this.treeControl.toggle(dataNode);
    } else if (this._expansionModel) {
      this._expansionModel.toggle(this._getExpansionKey(dataNode));
    }
  }
  expand(dataNode) {
    if (this.treeControl) {
      this.treeControl.expand(dataNode);
    } else if (this._expansionModel) {
      this._expansionModel.select(this._getExpansionKey(dataNode));
    }
  }
  collapse(dataNode) {
    if (this.treeControl) {
      this.treeControl.collapse(dataNode);
    } else if (this._expansionModel) {
      this._expansionModel.deselect(this._getExpansionKey(dataNode));
    }
  }
  toggleDescendants(dataNode) {
    if (this.treeControl) {
      this.treeControl.toggleDescendants(dataNode);
    } else if (this._expansionModel) {
      if (this.isExpanded(dataNode)) {
        this.collapseDescendants(dataNode);
      } else {
        this.expandDescendants(dataNode);
      }
    }
  }
  expandDescendants(dataNode) {
    if (this.treeControl) {
      this.treeControl.expandDescendants(dataNode);
    } else if (this._expansionModel) {
      const expansionModel = this._expansionModel;
      expansionModel.select(this._getExpansionKey(dataNode));
      this._getDescendants(dataNode).pipe(take(1), takeUntil(this._onDestroy)).subscribe(children => {
        expansionModel.select(...children.map(child => this._getExpansionKey(child)));
      });
    }
  }
  collapseDescendants(dataNode) {
    if (this.treeControl) {
      this.treeControl.collapseDescendants(dataNode);
    } else if (this._expansionModel) {
      const expansionModel = this._expansionModel;
      expansionModel.deselect(this._getExpansionKey(dataNode));
      this._getDescendants(dataNode).pipe(take(1), takeUntil(this._onDestroy)).subscribe(children => {
        expansionModel.deselect(...children.map(child => this._getExpansionKey(child)));
      });
    }
  }
  expandAll() {
    if (this.treeControl) {
      this.treeControl.expandAll();
    } else if (this._expansionModel) {
      this._forEachExpansionKey(keys => this._expansionModel?.select(...keys));
    }
  }
  collapseAll() {
    if (this.treeControl) {
      this.treeControl.collapseAll();
    } else if (this._expansionModel) {
      this._forEachExpansionKey(keys => this._expansionModel?.deselect(...keys));
    }
  }
  _getLevelAccessor() {
    return this.treeControl?.getLevel?.bind(this.treeControl) ?? this.levelAccessor;
  }
  _getChildrenAccessor() {
    return this.treeControl?.getChildren?.bind(this.treeControl) ?? this.childrenAccessor;
  }
  _getDirectChildren(dataNode) {
    const levelAccessor = this._getLevelAccessor();
    const expansionModel = this._expansionModel ?? this.treeControl?.expansionModel;
    if (!expansionModel) {
      return of([]);
    }
    const key = this._getExpansionKey(dataNode);
    const isExpanded = expansionModel.changed.pipe(switchMap(changes => {
      if (changes.added.includes(key)) {
        return of(true);
      } else if (changes.removed.includes(key)) {
        return of(false);
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
  _findChildrenByLevel(levelAccessor, flattenedNodes, dataNode, levelDelta) {
    const key = this._getExpansionKey(dataNode);
    const startIndex = flattenedNodes.findIndex(node => this._getExpansionKey(node) === key);
    const dataNodeLevel = levelAccessor(dataNode);
    const expectedLevel = dataNodeLevel + levelDelta;
    const results = [];
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
  _registerNode(node) {
    this._nodes.value.set(this._getExpansionKey(node.data), node);
    this._nodes.next(this._nodes.value);
  }
  _unregisterNode(node) {
    this._nodes.value.delete(this._getExpansionKey(node.data));
    this._nodes.next(this._nodes.value);
  }
  _getLevel(node) {
    return this._levels.get(this._getExpansionKey(node));
  }
  _getSetSize(dataNode) {
    const set = this._getAriaSet(dataNode);
    return set.length;
  }
  _getPositionInSet(dataNode) {
    const set = this._getAriaSet(dataNode);
    const key = this._getExpansionKey(dataNode);
    return set.findIndex(node => this._getExpansionKey(node) === key) + 1;
  }
  _getNodeParent(node) {
    const parent = this._parents.get(this._getExpansionKey(node.data));
    return parent && this._nodes.value.get(this._getExpansionKey(parent));
  }
  _getNodeChildren(node) {
    return this._getDirectChildren(node.data).pipe(map(children => children.reduce((nodes, child) => {
      const value = this._nodes.value.get(this._getExpansionKey(child));
      if (value) {
        nodes.push(value);
      }
      return nodes;
    }, [])));
  }
  _sendKeydownToKeyManager(event) {
    if (event.target === this._elementRef.nativeElement) {
      this._keyManager.onKeydown(event);
    } else {
      const nodes = this._nodes.getValue();
      for (const [, node] of nodes) {
        if (event.target === node._elementRef.nativeElement) {
          this._keyManager.onKeydown(event);
          break;
        }
      }
    }
  }
  _getDescendants(dataNode) {
    if (this.treeControl) {
      return of(this.treeControl.getDescendants(dataNode));
    }
    if (this.levelAccessor) {
      const results = this._findChildrenByLevel(this.levelAccessor, this._flattenedNodes.value, dataNode, Infinity);
      return of(results);
    }
    if (this.childrenAccessor) {
      return this._getAllChildrenRecursively(dataNode).pipe(reduce((allChildren, nextChildren) => {
        allChildren.push(...nextChildren);
        return allChildren;
      }, []));
    }
    throw getTreeControlMissingError();
  }
  _getAllChildrenRecursively(dataNode) {
    if (!this.childrenAccessor) {
      return of([]);
    }
    return coerceObservable(this.childrenAccessor(dataNode)).pipe(take(1), switchMap(children => {
      for (const child of children) {
        this._parents.set(this._getExpansionKey(child), dataNode);
      }
      return of(...children).pipe(concatMap(child => concat(of([child]), this._getAllChildrenRecursively(child))));
    }));
  }
  _getExpansionKey(dataNode) {
    return this.expansionKey?.(dataNode) ?? dataNode;
  }
  _getAriaSet(node) {
    const key = this._getExpansionKey(node);
    const parent = this._parents.get(key);
    const parentKey = parent ? this._getExpansionKey(parent) : null;
    const set = this._ariaSets.get(parentKey);
    return set ?? [node];
  }
  _findParentForNode(node, index, cachedNodes) {
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
  _flattenNestedNodesWithExpansion(nodes, level = 0) {
    const childrenAccessor = this._getChildrenAccessor();
    if (!childrenAccessor) {
      return of([...nodes]);
    }
    return of(...nodes).pipe(concatMap(node => {
      const parentKey = this._getExpansionKey(node);
      if (!this._parents.has(parentKey)) {
        this._parents.set(parentKey, null);
      }
      this._levels.set(parentKey, level);
      const children = coerceObservable(childrenAccessor(node));
      return concat(of([node]), children.pipe(take(1), tap(childNodes => {
        this._ariaSets.set(parentKey, [...(childNodes ?? [])]);
        for (const child of childNodes ?? []) {
          const childKey = this._getExpansionKey(child);
          this._parents.set(childKey, node);
          this._levels.set(childKey, level + 1);
        }
      }), switchMap(childNodes => {
        if (!childNodes) {
          return of([]);
        }
        return this._flattenNestedNodesWithExpansion(childNodes, level + 1).pipe(map(nestedNodes => this.isExpanded(node) ? nestedNodes : []));
      })));
    }), reduce((results, children) => {
      results.push(...children);
      return results;
    }, []));
  }
  _computeRenderingData(nodes, nodeType) {
    if (this.childrenAccessor && nodeType === 'flat') {
      this._clearPreviousCache();
      this._ariaSets.set(null, [...nodes]);
      return this._flattenNestedNodesWithExpansion(nodes).pipe(map(flattenedNodes => ({
        renderNodes: flattenedNodes,
        flattenedNodes
      })));
    } else if (this.levelAccessor && nodeType === 'nested') {
      const levelAccessor = this.levelAccessor;
      return of(nodes.filter(node => levelAccessor(node) === 0)).pipe(map(rootNodes => ({
        renderNodes: rootNodes,
        flattenedNodes: nodes
      })), tap(({
        flattenedNodes
      }) => {
        this._calculateParents(flattenedNodes);
      }));
    } else if (nodeType === 'flat') {
      return of({
        renderNodes: nodes,
        flattenedNodes: nodes
      }).pipe(tap(({
        flattenedNodes
      }) => {
        this._calculateParents(flattenedNodes);
      }));
    } else {
      this._clearPreviousCache();
      this._ariaSets.set(null, [...nodes]);
      return this._flattenNestedNodesWithExpansion(nodes).pipe(map(flattenedNodes => ({
        renderNodes: nodes,
        flattenedNodes
      })));
    }
  }
  _updateCachedData(flattenedNodes) {
    this._flattenedNodes.next(flattenedNodes);
  }
  _updateKeyManagerItems(flattenedNodes) {
    this._keyManagerNodes.next(flattenedNodes);
  }
  _calculateParents(flattenedNodes) {
    const levelAccessor = this._getLevelAccessor();
    if (!levelAccessor) {
      return;
    }
    this._clearPreviousCache();
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
  _forEachExpansionKey(callback) {
    const toToggle = [];
    const observables = [];
    this._nodes.value.forEach(node => {
      toToggle.push(this._getExpansionKey(node.data));
      observables.push(this._getDescendants(node.data));
    });
    if (observables.length > 0) {
      combineLatest(observables).pipe(take(1), takeUntil(this._onDestroy)).subscribe(results => {
        results.forEach(inner => inner.forEach(r => toToggle.push(this._getExpansionKey(r))));
        callback(toToggle);
      });
    } else {
      callback(toToggle);
    }
  }
  _clearPreviousCache() {
    this._parents.clear();
    this._levels.clear();
    this._ariaSets.clear();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTree,
    deps: [],
    target: i0.ɵɵFactoryTarget.Component
  });
  static ɵcmp = i0.ɵɵngDeclareComponent({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkTree,
    isStandalone: true,
    selector: "cdk-tree",
    inputs: {
      dataSource: "dataSource",
      treeControl: "treeControl",
      levelAccessor: "levelAccessor",
      childrenAccessor: "childrenAccessor",
      trackBy: "trackBy",
      expansionKey: "expansionKey"
    },
    host: {
      attributes: {
        "role": "tree"
      },
      listeners: {
        "keydown": "_sendKeydownToKeyManager($event)"
      },
      classAttribute: "cdk-tree"
    },
    queries: [{
      propertyName: "_nodeDefs",
      predicate: CdkTreeNodeDef,
      descendants: true
    }],
    viewQueries: [{
      propertyName: "_nodeOutlet",
      first: true,
      predicate: CdkTreeNodeOutlet,
      descendants: true,
      static: true
    }],
    exportAs: ["cdkTree"],
    ngImport: i0,
    template: `<ng-container cdkTreeNodeOutlet></ng-container>`,
    isInline: true,
    dependencies: [{
      kind: "directive",
      type: CdkTreeNodeOutlet,
      selector: "[cdkTreeNodeOutlet]"
    }],
    changeDetection: i0.ChangeDetectionStrategy.Default,
    encapsulation: i0.ViewEncapsulation.None
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTree,
  decorators: [{
    type: Component,
    args: [{
      selector: 'cdk-tree',
      exportAs: 'cdkTree',
      template: `<ng-container cdkTreeNodeOutlet></ng-container>`,
      host: {
        'class': 'cdk-tree',
        'role': 'tree',
        '(keydown)': '_sendKeydownToKeyManager($event)'
      },
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.Default,
      imports: [CdkTreeNodeOutlet]
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    dataSource: [{
      type: Input
    }],
    treeControl: [{
      type: Input
    }],
    levelAccessor: [{
      type: Input
    }],
    childrenAccessor: [{
      type: Input
    }],
    trackBy: [{
      type: Input
    }],
    expansionKey: [{
      type: Input
    }],
    _nodeOutlet: [{
      type: ViewChild,
      args: [CdkTreeNodeOutlet, {
        static: true
      }]
    }],
    _nodeDefs: [{
      type: ContentChildren,
      args: [CdkTreeNodeDef, {
        descendants: true
      }]
    }]
  }
});
class CdkTreeNode {
  _elementRef = inject(ElementRef);
  _tree = inject(CdkTree);
  _tabindex = -1;
  _type = 'flat';
  get role() {
    return 'treeitem';
  }
  set role(_role) {}
  get isExpandable() {
    return this._isExpandable();
  }
  set isExpandable(isExpandable) {
    this._inputIsExpandable = isExpandable;
    if (this.data && !this._isExpandable || !this._inputIsExpandable) {
      return;
    }
    if (this._inputIsExpanded) {
      this.expand();
    } else if (this._inputIsExpanded === false) {
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
    } else {
      this.collapse();
    }
  }
  isDisabled = false;
  typeaheadLabel = null;
  getLabel() {
    return this.typeaheadLabel || this._elementRef.nativeElement.textContent?.trim() || '';
  }
  activation = new EventEmitter();
  expandedChange = new EventEmitter();
  static mostRecentTreeNode = null;
  _destroyed = new Subject();
  _dataChanges = new Subject();
  _inputIsExpandable = false;
  _inputIsExpanded = undefined;
  _shouldFocus = true;
  _parentNodeAriaLevel;
  get data() {
    return this._data;
  }
  set data(value) {
    if (value !== this._data) {
      this._data = value;
      this._dataChanges.next();
    }
  }
  _data;
  get isLeafNode() {
    if (this._tree.treeControl?.isExpandable !== undefined && !this._tree.treeControl.isExpandable(this._data)) {
      return true;
    } else if (this._tree.treeControl?.isExpandable === undefined && this._tree.treeControl?.getDescendants(this._data).length === 0) {
      return true;
    }
    return false;
  }
  get level() {
    return this._tree._getLevel(this._data) ?? this._parentNodeAriaLevel;
  }
  _isExpandable() {
    if (this._tree.treeControl) {
      if (this.isLeafNode) {
        return false;
      }
      return true;
    }
    return this._inputIsExpandable;
  }
  _getAriaExpanded() {
    if (!this._isExpandable()) {
      return null;
    }
    return String(this.isExpanded);
  }
  _getSetSize() {
    return this._tree._getSetSize(this._data);
  }
  _getPositionInSet() {
    return this._tree._getPositionInSet(this._data);
  }
  _changeDetectorRef = inject(ChangeDetectorRef);
  constructor() {
    CdkTreeNode.mostRecentTreeNode = this;
  }
  ngOnInit() {
    this._parentNodeAriaLevel = getParentNodeAriaLevel(this._elementRef.nativeElement);
    this._tree._getExpansionModel().changed.pipe(map(() => this.isExpanded), distinctUntilChanged(), takeUntil(this._destroyed)).pipe(takeUntil(this._destroyed)).subscribe(() => this._changeDetectorRef.markForCheck());
    this._tree._setNodeTypeIfUnset(this._type);
    this._tree._registerNode(this);
  }
  ngOnDestroy() {
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
  focus() {
    this._tabindex = 0;
    if (this._shouldFocus) {
      this._elementRef.nativeElement.focus();
    }
    this._changeDetectorRef.markForCheck();
  }
  unfocus() {
    this._tabindex = -1;
    this._changeDetectorRef.markForCheck();
  }
  activate() {
    if (this.isDisabled) {
      return;
    }
    this.activation.next(this._data);
  }
  collapse() {
    if (this.isExpandable) {
      this._tree.collapse(this._data);
    }
  }
  expand() {
    if (this.isExpandable) {
      this._tree.expand(this._data);
    }
  }
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
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeNode,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkTreeNode,
    isStandalone: true,
    selector: "cdk-tree-node",
    inputs: {
      role: "role",
      isExpandable: ["isExpandable", "isExpandable", booleanAttribute],
      isExpanded: "isExpanded",
      isDisabled: ["isDisabled", "isDisabled", booleanAttribute],
      typeaheadLabel: ["cdkTreeNodeTypeaheadLabel", "typeaheadLabel"]
    },
    outputs: {
      activation: "activation",
      expandedChange: "expandedChange"
    },
    host: {
      attributes: {
        "role": "treeitem"
      },
      listeners: {
        "click": "_setActiveItem()",
        "focus": "_focusItem()"
      },
      properties: {
        "attr.aria-expanded": "_getAriaExpanded()",
        "attr.aria-level": "level + 1",
        "attr.aria-posinset": "_getPositionInSet()",
        "attr.aria-setsize": "_getSetSize()",
        "tabindex": "_tabindex"
      },
      classAttribute: "cdk-tree-node"
    },
    exportAs: ["cdkTreeNode"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTreeNode,
  decorators: [{
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
        '(focus)': '_focusItem()'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    role: [{
      type: Input
    }],
    isExpandable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    isExpanded: [{
      type: Input
    }],
    isDisabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    typeaheadLabel: [{
      type: Input,
      args: ['cdkTreeNodeTypeaheadLabel']
    }],
    activation: [{
      type: Output
    }],
    expandedChange: [{
      type: Output
    }]
  }
});
function getParentNodeAriaLevel(nodeElement) {
  let parent = nodeElement.parentElement;
  while (parent && !isNodeElement(parent)) {
    parent = parent.parentElement;
  }
  if (!parent) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw Error('Incorrect tree structure containing detached node.');
    } else {
      return -1;
    }
  } else if (parent.classList.contains('cdk-nested-tree-node')) {
    return numberAttribute(parent.getAttribute('aria-level'));
  } else {
    return 0;
  }
}
function isNodeElement(element) {
  const classList = element.classList;
  return !!(classList?.contains('cdk-nested-tree-node') || classList?.contains('cdk-tree'));
}

class CdkNestedTreeNode extends CdkTreeNode {
  _type = 'nested';
  _differs = inject(IterableDiffers);
  _dataDiffer;
  _children;
  nodeOutlet;
  constructor() {
    super();
  }
  ngAfterContentInit() {
    this._dataDiffer = this._differs.find([]).create(this._tree.trackBy);
    this._tree._getDirectChildren(this.data).pipe(takeUntil(this._destroyed)).subscribe(result => this.updateChildrenNodes(result));
    this.nodeOutlet.changes.pipe(takeUntil(this._destroyed)).subscribe(() => this.updateChildrenNodes());
  }
  ngOnDestroy() {
    this._clear();
    super.ngOnDestroy();
  }
  updateChildrenNodes(children) {
    const outlet = this._getNodeOutlet();
    if (children) {
      this._children = children;
    }
    if (outlet && this._children) {
      const viewContainer = outlet.viewContainer;
      this._tree.renderNodeChanges(this._children, this._dataDiffer, viewContainer, this._data);
    } else {
      this._dataDiffer.diff([]);
    }
  }
  _clear() {
    const outlet = this._getNodeOutlet();
    if (outlet) {
      outlet.viewContainer.clear();
      this._dataDiffer.diff([]);
    }
  }
  _getNodeOutlet() {
    const outlets = this.nodeOutlet;
    return outlets && outlets.find(outlet => !outlet._node || outlet._node === this);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkNestedTreeNode,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkNestedTreeNode,
    isStandalone: true,
    selector: "cdk-nested-tree-node",
    host: {
      classAttribute: "cdk-nested-tree-node"
    },
    providers: [{
      provide: CdkTreeNode,
      useExisting: CdkNestedTreeNode
    }, {
      provide: CDK_TREE_NODE_OUTLET_NODE,
      useExisting: CdkNestedTreeNode
    }],
    queries: [{
      propertyName: "nodeOutlet",
      predicate: CdkTreeNodeOutlet,
      descendants: true
    }],
    exportAs: ["cdkNestedTreeNode"],
    usesInheritance: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkNestedTreeNode,
  decorators: [{
    type: Directive,
    args: [{
      selector: 'cdk-nested-tree-node',
      exportAs: 'cdkNestedTreeNode',
      providers: [{
        provide: CdkTreeNode,
        useExisting: CdkNestedTreeNode
      }, {
        provide: CDK_TREE_NODE_OUTLET_NODE,
        useExisting: CdkNestedTreeNode
      }],
      host: {
        'class': 'cdk-nested-tree-node'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    nodeOutlet: [{
      type: ContentChildren,
      args: [CdkTreeNodeOutlet, {
        descendants: true
      }]
    }]
  }
});

const cssUnitPattern = /([A-Za-z%]+)$/;
class CdkTreeNodePadding {
  _treeNode = inject(CdkTreeNode);
  _tree = inject(CdkTree);
  _element = inject(ElementRef);
  _dir = inject(Directionality, {
    optional: true
  });
  _currentPadding = null;
  _destroyed = new Subject();
  indentUnits = 'px';
  get level() {
    return this._level;
  }
  set level(value) {
    this._setLevelInput(value);
  }
  _level;
  get indent() {
    return this._indent;
  }
  set indent(indent) {
    this._setIndentInput(indent);
  }
  _indent = 40;
  constructor() {
    this._setPadding();
    this._dir?.change.pipe(takeUntil(this._destroyed)).subscribe(() => this._setPadding(true));
    this._treeNode._dataChanges.subscribe(() => this._setPadding());
  }
  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
  _paddingIndent() {
    const nodeLevel = (this._treeNode.data && this._tree._getLevel(this._treeNode.data)) ?? null;
    const level = this._level == null ? nodeLevel : this._level;
    return typeof level === 'number' ? `${level * this._indent}${this.indentUnits}` : null;
  }
  _setPadding(forceChange = false) {
    const padding = this._paddingIndent();
    if (padding !== this._currentPadding || forceChange) {
      const element = this._element.nativeElement;
      const paddingProp = this._dir && this._dir.value === 'rtl' ? 'paddingRight' : 'paddingLeft';
      const resetProp = paddingProp === 'paddingLeft' ? 'paddingRight' : 'paddingLeft';
      element.style[paddingProp] = padding || '';
      element.style[resetProp] = '';
      this._currentPadding = padding;
    }
  }
  _setLevelInput(value) {
    this._level = isNaN(value) ? null : value;
    this._setPadding();
  }
  _setIndentInput(indent) {
    let value = indent;
    let units = 'px';
    if (typeof indent === 'string') {
      const parts = indent.split(cssUnitPattern);
      value = parts[0];
      units = parts[1] || units;
    }
    this.indentUnits = units;
    this._indent = numberAttribute(value);
    this._setPadding();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeNodePadding,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkTreeNodePadding,
    isStandalone: true,
    selector: "[cdkTreeNodePadding]",
    inputs: {
      level: ["cdkTreeNodePadding", "level", numberAttribute],
      indent: ["cdkTreeNodePaddingIndent", "indent"]
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTreeNodePadding,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkTreeNodePadding]'
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    level: [{
      type: Input,
      args: [{
        alias: 'cdkTreeNodePadding',
        transform: numberAttribute
      }]
    }],
    indent: [{
      type: Input,
      args: ['cdkTreeNodePaddingIndent']
    }]
  }
});

class CdkTreeNodeToggle {
  _tree = inject(CdkTree);
  _treeNode = inject(CdkTreeNode);
  recursive = false;
  constructor() {}
  _toggle() {
    this.recursive ? this._tree.toggleDescendants(this._treeNode.data) : this._tree.toggle(this._treeNode.data);
    this._tree._keyManager.focusItem(this._treeNode);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeNodeToggle,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkTreeNodeToggle,
    isStandalone: true,
    selector: "[cdkTreeNodeToggle]",
    inputs: {
      recursive: ["cdkTreeNodeToggleRecursive", "recursive", booleanAttribute]
    },
    host: {
      attributes: {
        "tabindex": "-1"
      },
      listeners: {
        "click": "_toggle(); $event.stopPropagation();",
        "keydown.Enter": "_toggle(); $event.preventDefault();",
        "keydown.Space": "_toggle(); $event.preventDefault();"
      }
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTreeNodeToggle,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkTreeNodeToggle]',
      host: {
        '(click)': '_toggle(); $event.stopPropagation();',
        '(keydown.Enter)': '_toggle(); $event.preventDefault();',
        '(keydown.Space)': '_toggle(); $event.preventDefault();',
        'tabindex': '-1'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    recursive: [{
      type: Input,
      args: [{
        alias: 'cdkTreeNodeToggleRecursive',
        transform: booleanAttribute
      }]
    }]
  }
});

const EXPORTED_DECLARATIONS = [CdkNestedTreeNode, CdkTreeNodeDef, CdkTreeNodePadding, CdkTreeNodeToggle, CdkTree, CdkTreeNode, CdkTreeNodeOutlet];
class CdkTreeModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeModule,
    imports: [CdkNestedTreeNode, CdkTreeNodeDef, CdkTreeNodePadding, CdkTreeNodeToggle, CdkTree, CdkTreeNode, CdkTreeNodeOutlet],
    exports: [CdkNestedTreeNode, CdkTreeNodeDef, CdkTreeNodePadding, CdkTreeNodeToggle, CdkTree, CdkTreeNode, CdkTreeNodeOutlet]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkTreeModule
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkTreeModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: EXPORTED_DECLARATIONS,
      exports: EXPORTED_DECLARATIONS
    }]
  }]
});

export { BaseTreeControl, CDK_TREE_NODE_OUTLET_NODE, CdkNestedTreeNode, CdkTree, CdkTreeModule, CdkTreeNode, CdkTreeNodeDef, CdkTreeNodeOutlet, CdkTreeNodeOutletContext, CdkTreeNodePadding, CdkTreeNodeToggle, FlatTreeControl, NestedTreeControl, getMultipleTreeControlsError, getTreeControlMissingError, getTreeMissingMatchingNodeDefError, getTreeMultipleDefaultNodeDefsError, getTreeNoValidDataSourceError };
//# sourceMappingURL=tree.mjs.map
