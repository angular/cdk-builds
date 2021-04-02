import { isDataSource } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, Input, IterableDiffers, QueryList, ViewChild, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, isObservable, of as observableOf, Subject, } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkTreeNodeDef, CdkTreeNodeOutletContext } from './node';
import { CdkTreeNodeOutlet } from './outlet';
import { getTreeControlFunctionsMissingError, getTreeControlMissingError, getTreeMissingMatchingNodeDefError, getTreeMultipleDefaultNodeDefsError, getTreeNoValidDataSourceError } from './tree-errors';
import { coerceNumberProperty } from '@angular/cdk/coercion';
/**
 * CDK tree component that connects with a data source to retrieve data of type `T` and renders
 * dataNodes with hierarchy. Updates the dataNodes when new data is provided by the data source.
 */
export class CdkTree {
    constructor(_differs, _changeDetectorRef) {
        this._differs = _differs;
        this._changeDetectorRef = _changeDetectorRef;
        /** Subject that emits when the component has been destroyed. */
        this._onDestroy = new Subject();
        /** Level of nodes */
        this._levels = new Map();
        // TODO(tinayuangao): Setup a listener for scrolling, emit the calculated view to viewChange.
        //     Remove the MAX_VALUE in viewChange
        /**
         * Stream containing the latest information on what rows are being displayed on screen.
         * Can be used by the data source to as a heuristic of what data should be provided.
         */
        this.viewChange = new BehaviorSubject({ start: 0, end: Number.MAX_VALUE });
    }
    /**
     * Provides a stream containing the latest data array to render. Influenced by the tree's
     * stream of view window (what dataNodes are currently on screen).
     * Data source can be an observable of data array, or a data array to render.
     */
    get dataSource() { return this._dataSource; }
    set dataSource(dataSource) {
        if (this._dataSource !== dataSource) {
            this._switchDataSource(dataSource);
        }
    }
    ngOnInit() {
        this._dataDiffer = this._differs.find([]).create(this.trackBy);
        if (!this.treeControl && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTreeControlMissingError();
        }
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
    }
    ngAfterContentChecked() {
        const defaultNodeDefs = this._nodeDefs.filter(def => !def.when);
        if (defaultNodeDefs.length > 1 && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTreeMultipleDefaultNodeDefsError();
        }
        this._defaultNodeDef = defaultNodeDefs[0];
        if (this.dataSource && this._nodeDefs && !this._dataSubscription) {
            this._observeRenderChanges();
        }
    }
    // TODO(tinayuangao): Work on keyboard traversal and actions, make sure it's working for RTL
    //     and nested trees.
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
            this._observeRenderChanges();
        }
    }
    /** Set up a subscription for the data provided by the data source. */
    _observeRenderChanges() {
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
        if (dataStream) {
            this._dataSubscription = dataStream.pipe(takeUntil(this._onDestroy))
                .subscribe(data => this.renderNodeChanges(data));
        }
        else if (typeof ngDevMode === 'undefined' || ngDevMode) {
            throw getTreeNoValidDataSourceError();
        }
    }
    /** Check for changes made in the data and render each change (node added/removed/moved). */
    renderNodeChanges(data, dataDiffer = this._dataDiffer, viewContainer = this._nodeOutlet.viewContainer, parentData) {
        const changes = dataDiffer.diff(data);
        if (!changes) {
            return;
        }
        changes.forEachOperation((item, adjustedPreviousIndex, currentIndex) => {
            if (item.previousIndex == null) {
                this.insertNode(data[currentIndex], currentIndex, viewContainer, parentData);
            }
            else if (currentIndex == null) {
                viewContainer.remove(adjustedPreviousIndex);
                this._levels.delete(item.item);
            }
            else {
                const view = viewContainer.get(adjustedPreviousIndex);
                viewContainer.move(view, currentIndex);
            }
        });
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
        const node = this._getNodeDef(nodeData, index);
        // Node context that will be provided to created embedded view
        const context = new CdkTreeNodeOutletContext(nodeData);
        // If the tree is flat tree, then use the `getLevel` function in flat tree control
        // Otherwise, use the level of parent node.
        if (this.treeControl.getLevel) {
            context.level = this.treeControl.getLevel(nodeData);
        }
        else if (typeof parentData !== 'undefined' && this._levels.has(parentData)) {
            context.level = this._levels.get(parentData) + 1;
        }
        else {
            context.level = 0;
        }
        this._levels.set(nodeData, context.level);
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
}
CdkTree.decorators = [
    { type: Component, args: [{
                selector: 'cdk-tree',
                exportAs: 'cdkTree',
                template: `<ng-container cdkTreeNodeOutlet></ng-container>`,
                host: {
                    'class': 'cdk-tree',
                    'role': 'tree',
                },
                encapsulation: ViewEncapsulation.None,
                // The "OnPush" status for the `CdkTree` component is effectively a noop, so we are removing it.
                // The view for `CdkTree` consists entirely of templates declared in other views. As they are
                // declared elsewhere, they are checked when their declaration points are checked.
                // tslint:disable-next-line:validate-decorators
                changeDetection: ChangeDetectionStrategy.Default
            },] }
];
CdkTree.ctorParameters = () => [
    { type: IterableDiffers },
    { type: ChangeDetectorRef }
];
CdkTree.propDecorators = {
    dataSource: [{ type: Input }],
    treeControl: [{ type: Input }],
    trackBy: [{ type: Input }],
    _nodeOutlet: [{ type: ViewChild, args: [CdkTreeNodeOutlet, { static: true },] }],
    _nodeDefs: [{ type: ContentChildren, args: [CdkTreeNodeDef, {
                    // We need to use `descendants: true`, because Ivy will no longer match
                    // indirect descendants if it's left as false.
                    descendants: true
                },] }]
};
/**
 * Tree node for CdkTree. It contains the data in the tree node.
 */
export class CdkTreeNode {
    constructor(_elementRef, _tree) {
        this._elementRef = _elementRef;
        this._tree = _tree;
        /** Subject that emits when the component has been destroyed. */
        this._destroyed = new Subject();
        /** Emits when the node's data has changed. */
        this._dataChanges = new Subject();
        CdkTreeNode.mostRecentTreeNode = this;
        // The classes are directly added here instead of in the host property because classes on
        // the host property are not inherited with View Engine. It is not set as a @HostBinding because
        // it is not set by the time it's children nodes try to read the class from it.
        // TODO: move to host after View Engine deprecation
        this._elementRef.nativeElement.classList.add('cdk-tree-node');
        this.role = 'treeitem';
    }
    /**
     * The role of the tree node.
     * @deprecated The correct role is 'treeitem', 'group' should not be used. This input will be
     *   removed in a future version.
     * @breaking-change 12.0.0 Remove this input
     */
    get role() { return 'treeitem'; }
    set role(_role) {
        // TODO: move to host after View Engine deprecation
        this._elementRef.nativeElement.setAttribute('role', _role);
    }
    /** The tree node's data. */
    get data() { return this._data; }
    set data(value) {
        if (value !== this._data) {
            this._data = value;
            this._setRoleFromData();
            this._dataChanges.next();
        }
    }
    get isExpanded() {
        return this._tree.treeControl.isExpanded(this._data);
    }
    _setExpanded(_expanded) {
        this._isAriaExpanded = _expanded;
        this._elementRef.nativeElement.setAttribute('aria-expanded', `${_expanded}`);
    }
    get level() {
        // If the treeControl has a getLevel method, use it to get the level. Otherwise read the
        // aria-level off the parent node and use it as the level for this node (note aria-level is
        // 1-indexed, while this property is 0-indexed, so we don't need to increment).
        return this._tree.treeControl.getLevel ?
            this._tree.treeControl.getLevel(this._data) : this._parentNodeAriaLevel;
    }
    ngOnInit() {
        this._parentNodeAriaLevel = getParentNodeAriaLevel(this._elementRef.nativeElement);
        this._elementRef.nativeElement.setAttribute('aria-level', `${this.level + 1}`);
    }
    ngDoCheck() {
        // aria-expanded is be set here because the expanded state is stored in the tree control and
        // the node isn't aware when the state is changed.
        // It is not set using a @HostBinding because they sometimes get lost with Mixin based classes.
        // TODO: move to host after View Engine deprecation
        if (this.isExpanded != this._isAriaExpanded) {
            this._setExpanded(this.isExpanded);
        }
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
    /** Focuses the menu item. Implements for FocusableOption. */
    focus() {
        this._elementRef.nativeElement.focus();
    }
    // TODO: role should eventually just be set in the component host
    _setRoleFromData() {
        if (!this._tree.treeControl.isExpandable && !this._tree.treeControl.getChildren &&
            (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw getTreeControlFunctionsMissingError();
        }
        this.role = 'treeitem';
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
            },] }
];
CdkTreeNode.ctorParameters = () => [
    { type: ElementRef },
    { type: CdkTree }
];
CdkTreeNode.propDecorators = {
    role: [{ type: Input }]
};
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
        return coerceNumberProperty(parent.getAttribute('aria-level'));
    }
    else {
        // The ancestor element is the cdk-tree itself
        return 0;
    }
}
function isNodeElement(element) {
    const classList = element.classList;
    return !!((classList === null || classList === void 0 ? void 0 : classList.contains('cdk-nested-tree-node')) || (classList === null || classList === void 0 ? void 0 : classList.contains('cdk-tree')));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS90cmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBK0IsWUFBWSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDcEYsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULGVBQWUsRUFDZixTQUFTLEVBRVQsVUFBVSxFQUNWLEtBQUssRUFHTCxlQUFlLEVBR2YsU0FBUyxFQUVULFNBQVMsRUFFVCxpQkFBaUIsRUFDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUNMLGVBQWUsRUFDZixZQUFZLEVBRVosRUFBRSxJQUFJLFlBQVksRUFDbEIsT0FBTyxHQUVSLE1BQU0sTUFBTSxDQUFDO0FBQ2QsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXpDLE9BQU8sRUFBQyxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNDLE9BQU8sRUFDTCxtQ0FBbUMsRUFDbkMsMEJBQTBCLEVBQzFCLGtDQUFrQyxFQUNsQyxtQ0FBbUMsRUFDbkMsNkJBQTZCLEVBQzlCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTNEOzs7R0FHRztBQWlCSCxNQUFNLE9BQU8sT0FBTztJQTREbEIsWUFBb0IsUUFBeUIsRUFDekIsa0JBQXFDO1FBRHJDLGFBQVEsR0FBUixRQUFRLENBQWlCO1FBQ3pCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7UUE1RHpELGdFQUFnRTtRQUN4RCxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQVd6QyxxQkFBcUI7UUFDYixZQUFPLEdBQW1CLElBQUksR0FBRyxFQUFhLENBQUM7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LENBQUM7S0FDakU7U0FBTTtRQUNMLDhDQUE4QztRQUM5QyxPQUFPLENBQUMsQ0FBQztLQUNWO0FBQ0gsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE9BQW9CO0lBQ3pDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDcEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxRQUFRLENBQUMsc0JBQXNCLENBQUMsTUFBSSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUM1RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtDb2xsZWN0aW9uVmlld2VyLCBEYXRhU291cmNlLCBpc0RhdGFTb3VyY2V9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIERvQ2hlY2ssXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBJdGVyYWJsZUNoYW5nZVJlY29yZCxcbiAgSXRlcmFibGVEaWZmZXIsXG4gIEl0ZXJhYmxlRGlmZmVycyxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIFF1ZXJ5TGlzdCxcbiAgVHJhY2tCeUZ1bmN0aW9uLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdDb250YWluZXJSZWYsXG4gIFZpZXdFbmNhcHN1bGF0aW9uXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgQmVoYXZpb3JTdWJqZWN0LFxuICBpc09ic2VydmFibGUsXG4gIE9ic2VydmFibGUsXG4gIG9mIGFzIG9ic2VydmFibGVPZixcbiAgU3ViamVjdCxcbiAgU3Vic2NyaXB0aW9uLFxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1RyZWVDb250cm9sfSBmcm9tICcuL2NvbnRyb2wvdHJlZS1jb250cm9sJztcbmltcG9ydCB7Q2RrVHJlZU5vZGVEZWYsIENka1RyZWVOb2RlT3V0bGV0Q29udGV4dH0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7Q2RrVHJlZU5vZGVPdXRsZXR9IGZyb20gJy4vb3V0bGV0JztcbmltcG9ydCB7XG4gIGdldFRyZWVDb250cm9sRnVuY3Rpb25zTWlzc2luZ0Vycm9yLFxuICBnZXRUcmVlQ29udHJvbE1pc3NpbmdFcnJvcixcbiAgZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcixcbiAgZ2V0VHJlZU11bHRpcGxlRGVmYXVsdE5vZGVEZWZzRXJyb3IsXG4gIGdldFRyZWVOb1ZhbGlkRGF0YVNvdXJjZUVycm9yXG59IGZyb20gJy4vdHJlZS1lcnJvcnMnO1xuaW1wb3J0IHtjb2VyY2VOdW1iZXJQcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcblxuLyoqXG4gKiBDREsgdHJlZSBjb21wb25lbnQgdGhhdCBjb25uZWN0cyB3aXRoIGEgZGF0YSBzb3VyY2UgdG8gcmV0cmlldmUgZGF0YSBvZiB0eXBlIGBUYCBhbmQgcmVuZGVyc1xuICogZGF0YU5vZGVzIHdpdGggaGllcmFyY2h5LiBVcGRhdGVzIHRoZSBkYXRhTm9kZXMgd2hlbiBuZXcgZGF0YSBpcyBwcm92aWRlZCBieSB0aGUgZGF0YSBzb3VyY2UuXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay10cmVlJyxcbiAgZXhwb3J0QXM6ICdjZGtUcmVlJyxcbiAgdGVtcGxhdGU6IGA8bmctY29udGFpbmVyIGNka1RyZWVOb2RlT3V0bGV0PjwvbmctY29udGFpbmVyPmAsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRyZWUnLFxuICAgICdyb2xlJzogJ3RyZWUnLFxuICB9LFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuXG4gIC8vIFRoZSBcIk9uUHVzaFwiIHN0YXR1cyBmb3IgdGhlIGBDZGtUcmVlYCBjb21wb25lbnQgaXMgZWZmZWN0aXZlbHkgYSBub29wLCBzbyB3ZSBhcmUgcmVtb3ZpbmcgaXQuXG4gIC8vIFRoZSB2aWV3IGZvciBgQ2RrVHJlZWAgY29uc2lzdHMgZW50aXJlbHkgb2YgdGVtcGxhdGVzIGRlY2xhcmVkIGluIG90aGVyIHZpZXdzLiBBcyB0aGV5IGFyZVxuICAvLyBkZWNsYXJlZCBlbHNld2hlcmUsIHRoZXkgYXJlIGNoZWNrZWQgd2hlbiB0aGVpciBkZWNsYXJhdGlvbiBwb2ludHMgYXJlIGNoZWNrZWQuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlPFQsIEsgPSBUPiBpbXBsZW1lbnRzIEFmdGVyQ29udGVudENoZWNrZWQsIENvbGxlY3Rpb25WaWV3ZXIsIE9uRGVzdHJveSwgT25Jbml0IHtcbiAgLyoqIFN1YmplY3QgdGhhdCBlbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9vbkRlc3Ryb3kgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBEaWZmZXIgdXNlZCB0byBmaW5kIHRoZSBjaGFuZ2VzIGluIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8VD47XG5cbiAgLyoqIFN0b3JlcyB0aGUgbm9kZSBkZWZpbml0aW9uIHRoYXQgZG9lcyBub3QgaGF2ZSBhIHdoZW4gcHJlZGljYXRlLiAqL1xuICBwcml2YXRlIF9kZWZhdWx0Tm9kZURlZjogQ2RrVHJlZU5vZGVEZWY8VD4gfCBudWxsO1xuXG4gIC8qKiBEYXRhIHN1YnNjcmlwdGlvbiAqL1xuICBwcml2YXRlIF9kYXRhU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsO1xuXG4gIC8qKiBMZXZlbCBvZiBub2RlcyAqL1xuICBwcml2YXRlIF9sZXZlbHM6IE1hcDxULCBudW1iZXI+ID0gbmV3IE1hcDxULCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGEgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIGxhdGVzdCBkYXRhIGFycmF5IHRvIHJlbmRlci4gSW5mbHVlbmNlZCBieSB0aGUgdHJlZSdzXG4gICAqIHN0cmVhbSBvZiB2aWV3IHdpbmRvdyAod2hhdCBkYXRhTm9kZXMgYXJlIGN1cnJlbnRseSBvbiBzY3JlZW4pLlxuICAgKiBEYXRhIHNvdXJjZSBjYW4gYmUgYW4gb2JzZXJ2YWJsZSBvZiBkYXRhIGFycmF5LCBvciBhIGRhdGEgYXJyYXkgdG8gcmVuZGVyLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGRhdGFTb3VyY2UoKTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXSB7IHJldHVybiB0aGlzLl9kYXRhU291cmNlOyB9XG4gIHNldCBkYXRhU291cmNlKGRhdGFTb3VyY2U6IERhdGFTb3VyY2U8VD4gfCBPYnNlcnZhYmxlPFRbXT4gfCBUW10pIHtcbiAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSAhPT0gZGF0YVNvdXJjZSkge1xuICAgICAgdGhpcy5fc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZGF0YVNvdXJjZTogRGF0YVNvdXJjZTxUPiB8IE9ic2VydmFibGU8VFtdPiB8IFRbXTtcblxuICAvKiogVGhlIHRyZWUgY29udHJvbGxlciAqL1xuICBASW5wdXQoKSB0cmVlQ29udHJvbDogVHJlZUNvbnRyb2w8VCwgSz47XG5cbiAgLyoqXG4gICAqIFRyYWNraW5nIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGNoZWNrIHRoZSBkaWZmZXJlbmNlcyBpbiBkYXRhIGNoYW5nZXMuIFVzZWQgc2ltaWxhcmx5XG4gICAqIHRvIGBuZ0ZvcmAgYHRyYWNrQnlgIGZ1bmN0aW9uLiBPcHRpbWl6ZSBub2RlIG9wZXJhdGlvbnMgYnkgaWRlbnRpZnlpbmcgYSBub2RlIGJhc2VkIG9uIGl0cyBkYXRhXG4gICAqIHJlbGF0aXZlIHRvIHRoZSBmdW5jdGlvbiB0byBrbm93IGlmIGEgbm9kZSBzaG91bGQgYmUgYWRkZWQvcmVtb3ZlZC9tb3ZlZC5cbiAgICogQWNjZXB0cyBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdHdvIHBhcmFtZXRlcnMsIGBpbmRleGAgYW5kIGBpdGVtYC5cbiAgICovXG4gIEBJbnB1dCgpIHRyYWNrQnk6IFRyYWNrQnlGdW5jdGlvbjxUPjtcblxuICAvLyBPdXRsZXRzIHdpdGhpbiB0aGUgdHJlZSdzIHRlbXBsYXRlIHdoZXJlIHRoZSBkYXRhTm9kZXMgd2lsbCBiZSBpbnNlcnRlZC5cbiAgQFZpZXdDaGlsZChDZGtUcmVlTm9kZU91dGxldCwge3N0YXRpYzogdHJ1ZX0pIF9ub2RlT3V0bGV0OiBDZGtUcmVlTm9kZU91dGxldDtcblxuICAvKiogVGhlIHRyZWUgbm9kZSB0ZW1wbGF0ZSBmb3IgdGhlIHRyZWUgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtUcmVlTm9kZURlZiwge1xuICAgIC8vIFdlIG5lZWQgdG8gdXNlIGBkZXNjZW5kYW50czogdHJ1ZWAsIGJlY2F1c2UgSXZ5IHdpbGwgbm8gbG9uZ2VyIG1hdGNoXG4gICAgLy8gaW5kaXJlY3QgZGVzY2VuZGFudHMgaWYgaXQncyBsZWZ0IGFzIGZhbHNlLlxuICAgIGRlc2NlbmRhbnRzOiB0cnVlXG4gIH0pIF9ub2RlRGVmczogUXVlcnlMaXN0PENka1RyZWVOb2RlRGVmPFQ+PjtcblxuICAvLyBUT0RPKHRpbmF5dWFuZ2FvKTogU2V0dXAgYSBsaXN0ZW5lciBmb3Igc2Nyb2xsaW5nLCBlbWl0IHRoZSBjYWxjdWxhdGVkIHZpZXcgdG8gdmlld0NoYW5nZS5cbiAgLy8gICAgIFJlbW92ZSB0aGUgTUFYX1ZBTFVFIGluIHZpZXdDaGFuZ2VcbiAgLyoqXG4gICAqIFN0cmVhbSBjb250YWluaW5nIHRoZSBsYXRlc3QgaW5mb3JtYXRpb24gb24gd2hhdCByb3dzIGFyZSBiZWluZyBkaXNwbGF5ZWQgb24gc2NyZWVuLlxuICAgKiBDYW4gYmUgdXNlZCBieSB0aGUgZGF0YSBzb3VyY2UgdG8gYXMgYSBoZXVyaXN0aWMgb2Ygd2hhdCBkYXRhIHNob3VsZCBiZSBwcm92aWRlZC5cbiAgICovXG4gIHZpZXdDaGFuZ2UgPVxuICAgIG5ldyBCZWhhdmlvclN1YmplY3Q8e3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyfT4oe3N0YXJ0OiAwLCBlbmQ6IE51bWJlci5NQVhfVkFMVUV9KTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9kaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZikge31cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLl9kYXRhRGlmZmVyID0gdGhpcy5fZGlmZmVycy5maW5kKFtdKS5jcmVhdGUodGhpcy50cmFja0J5KTtcbiAgICBpZiAoIXRoaXMudHJlZUNvbnRyb2wgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRyZWVDb250cm9sTWlzc2luZ0Vycm9yKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG5cbiAgICB0aGlzLnZpZXdDaGFuZ2UuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vbkRlc3Ryb3kubmV4dCgpO1xuICAgIHRoaXMuX29uRGVzdHJveS5jb21wbGV0ZSgpO1xuXG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgJiYgdHlwZW9mICh0aGlzLl9kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICh0aGlzLmRhdGFTb3VyY2UgYXMgRGF0YVNvdXJjZTxUPikuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRDaGVja2VkKCkge1xuICAgIGNvbnN0IGRlZmF1bHROb2RlRGVmcyA9IHRoaXMuX25vZGVEZWZzLmZpbHRlcihkZWYgPT4gIWRlZi53aGVuKTtcbiAgICBpZiAoZGVmYXVsdE5vZGVEZWZzLmxlbmd0aCA+IDEgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93IGdldFRyZWVNdWx0aXBsZURlZmF1bHROb2RlRGVmc0Vycm9yKCk7XG4gICAgfVxuICAgIHRoaXMuX2RlZmF1bHROb2RlRGVmID0gZGVmYXVsdE5vZGVEZWZzWzBdO1xuXG4gICAgaWYgKHRoaXMuZGF0YVNvdXJjZSAmJiB0aGlzLl9ub2RlRGVmcyAmJiAhdGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fb2JzZXJ2ZVJlbmRlckNoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIFRPRE8odGluYXl1YW5nYW8pOiBXb3JrIG9uIGtleWJvYXJkIHRyYXZlcnNhbCBhbmQgYWN0aW9ucywgbWFrZSBzdXJlIGl0J3Mgd29ya2luZyBmb3IgUlRMXG4gIC8vICAgICBhbmQgbmVzdGVkIHRyZWVzLlxuXG4gIC8qKlxuICAgKiBTd2l0Y2ggdG8gdGhlIHByb3ZpZGVkIGRhdGEgc291cmNlIGJ5IHJlc2V0dGluZyB0aGUgZGF0YSBhbmQgdW5zdWJzY3JpYmluZyBmcm9tIHRoZSBjdXJyZW50XG4gICAqIHJlbmRlciBjaGFuZ2Ugc3Vic2NyaXB0aW9uIGlmIG9uZSBleGlzdHMuIElmIHRoZSBkYXRhIHNvdXJjZSBpcyBudWxsLCBpbnRlcnByZXQgdGhpcyBieVxuICAgKiBjbGVhcmluZyB0aGUgbm9kZSBvdXRsZXQuIE90aGVyd2lzZSBzdGFydCBsaXN0ZW5pbmcgZm9yIG5ldyBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3dpdGNoRGF0YVNvdXJjZShkYXRhU291cmNlOiBEYXRhU291cmNlPFQ+IHwgT2JzZXJ2YWJsZTxUW10+IHwgVFtdKSB7XG4gICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgJiYgdHlwZW9mICh0aGlzLl9kYXRhU291cmNlIGFzIERhdGFTb3VyY2U8VD4pLmRpc2Nvbm5lY3QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICh0aGlzLmRhdGFTb3VyY2UgYXMgRGF0YVNvdXJjZTxUPikuZGlzY29ubmVjdCh0aGlzKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZGF0YVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBhbGwgZGF0YU5vZGVzIGlmIHRoZXJlIGlzIG5vdyBubyBkYXRhIHNvdXJjZVxuICAgIGlmICghZGF0YVNvdXJjZSkge1xuICAgICAgdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgaWYgKHRoaXMuX25vZGVEZWZzKSB7XG4gICAgICB0aGlzLl9vYnNlcnZlUmVuZGVyQ2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXQgdXAgYSBzdWJzY3JpcHRpb24gZm9yIHRoZSBkYXRhIHByb3ZpZGVkIGJ5IHRoZSBkYXRhIHNvdXJjZS4gKi9cbiAgcHJpdmF0ZSBfb2JzZXJ2ZVJlbmRlckNoYW5nZXMoKSB7XG4gICAgbGV0IGRhdGFTdHJlYW06IE9ic2VydmFibGU8cmVhZG9ubHkgVFtdPiB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChpc0RhdGFTb3VyY2UodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLl9kYXRhU291cmNlLmNvbm5lY3QodGhpcyk7XG4gICAgfSBlbHNlIGlmIChpc09ic2VydmFibGUodGhpcy5fZGF0YVNvdXJjZSkpIHtcbiAgICAgIGRhdGFTdHJlYW0gPSB0aGlzLl9kYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLl9kYXRhU291cmNlKSkge1xuICAgICAgZGF0YVN0cmVhbSA9IG9ic2VydmFibGVPZih0aGlzLl9kYXRhU291cmNlKTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YVN0cmVhbSkge1xuICAgICAgdGhpcy5fZGF0YVN1YnNjcmlwdGlvbiA9IGRhdGFTdHJlYW0ucGlwZSh0YWtlVW50aWwodGhpcy5fb25EZXN0cm95KSlcbiAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IHRoaXMucmVuZGVyTm9kZUNoYW5nZXMoZGF0YSkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICB0aHJvdyBnZXRUcmVlTm9WYWxpZERhdGFTb3VyY2VFcnJvcigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDaGVjayBmb3IgY2hhbmdlcyBtYWRlIGluIHRoZSBkYXRhIGFuZCByZW5kZXIgZWFjaCBjaGFuZ2UgKG5vZGUgYWRkZWQvcmVtb3ZlZC9tb3ZlZCkuICovXG4gIHJlbmRlck5vZGVDaGFuZ2VzKGRhdGE6IHJlYWRvbmx5IFRbXSwgZGF0YURpZmZlcjogSXRlcmFibGVEaWZmZXI8VD4gPSB0aGlzLl9kYXRhRGlmZmVyLFxuICAgICAgICAgICAgICAgICAgICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmID0gdGhpcy5fbm9kZU91dGxldC52aWV3Q29udGFpbmVyLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnREYXRhPzogVCkge1xuICAgIGNvbnN0IGNoYW5nZXMgPSBkYXRhRGlmZmVyLmRpZmYoZGF0YSk7XG4gICAgaWYgKCFjaGFuZ2VzKSB7IHJldHVybjsgfVxuXG4gICAgY2hhbmdlcy5mb3JFYWNoT3BlcmF0aW9uKChpdGVtOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdGVkUHJldmlvdXNJbmRleDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgICBpZiAoaXRlbS5wcmV2aW91c0luZGV4ID09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmluc2VydE5vZGUoZGF0YVtjdXJyZW50SW5kZXghXSwgY3VycmVudEluZGV4ISwgdmlld0NvbnRhaW5lciwgcGFyZW50RGF0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICB2aWV3Q29udGFpbmVyLnJlbW92ZShhZGp1c3RlZFByZXZpb3VzSW5kZXghKTtcbiAgICAgICAgICB0aGlzLl9sZXZlbHMuZGVsZXRlKGl0ZW0uaXRlbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgdmlldyA9IHZpZXdDb250YWluZXIuZ2V0KGFkanVzdGVkUHJldmlvdXNJbmRleCEpO1xuICAgICAgICAgIHZpZXdDb250YWluZXIubW92ZSh2aWV3ISwgY3VycmVudEluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgdGhlIG1hdGNoaW5nIG5vZGUgZGVmaW5pdGlvbiB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciB0aGlzIG5vZGUgZGF0YS4gSWYgdGhlcmUgaXMgb25seVxuICAgKiBvbmUgbm9kZSBkZWZpbml0aW9uLCBpdCBpcyByZXR1cm5lZC4gT3RoZXJ3aXNlLCBmaW5kIHRoZSBub2RlIGRlZmluaXRpb24gdGhhdCBoYXMgYSB3aGVuXG4gICAqIHByZWRpY2F0ZSB0aGF0IHJldHVybnMgdHJ1ZSB3aXRoIHRoZSBkYXRhLiBJZiBub25lIHJldHVybiB0cnVlLCByZXR1cm4gdGhlIGRlZmF1bHQgbm9kZVxuICAgKiBkZWZpbml0aW9uLlxuICAgKi9cbiAgX2dldE5vZGVEZWYoZGF0YTogVCwgaTogbnVtYmVyKTogQ2RrVHJlZU5vZGVEZWY8VD4ge1xuICAgIGlmICh0aGlzLl9ub2RlRGVmcy5sZW5ndGggPT09IDEpIHsgcmV0dXJuIHRoaXMuX25vZGVEZWZzLmZpcnN0OyB9XG5cbiAgICBjb25zdCBub2RlRGVmID1cbiAgICAgIHRoaXMuX25vZGVEZWZzLmZpbmQoZGVmID0+IGRlZi53aGVuICYmIGRlZi53aGVuKGksIGRhdGEpKSB8fCB0aGlzLl9kZWZhdWx0Tm9kZURlZjtcblxuICAgIGlmICghbm9kZURlZiAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VHJlZU1pc3NpbmdNYXRjaGluZ05vZGVEZWZFcnJvcigpO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlRGVmITtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGVtYmVkZGVkIHZpZXcgZm9yIHRoZSBkYXRhIG5vZGUgdGVtcGxhdGUgYW5kIHBsYWNlIGl0IGluIHRoZSBjb3JyZWN0IGluZGV4IGxvY2F0aW9uXG4gICAqIHdpdGhpbiB0aGUgZGF0YSBub2RlIHZpZXcgY29udGFpbmVyLlxuICAgKi9cbiAgaW5zZXJ0Tm9kZShub2RlRGF0YTogVCwgaW5kZXg6IG51bWJlciwgdmlld0NvbnRhaW5lcj86IFZpZXdDb250YWluZXJSZWYsIHBhcmVudERhdGE/OiBUKSB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMuX2dldE5vZGVEZWYobm9kZURhdGEsIGluZGV4KTtcblxuICAgIC8vIE5vZGUgY29udGV4dCB0aGF0IHdpbGwgYmUgcHJvdmlkZWQgdG8gY3JlYXRlZCBlbWJlZGRlZCB2aWV3XG4gICAgY29uc3QgY29udGV4dCA9IG5ldyBDZGtUcmVlTm9kZU91dGxldENvbnRleHQ8VD4obm9kZURhdGEpO1xuXG4gICAgLy8gSWYgdGhlIHRyZWUgaXMgZmxhdCB0cmVlLCB0aGVuIHVzZSB0aGUgYGdldExldmVsYCBmdW5jdGlvbiBpbiBmbGF0IHRyZWUgY29udHJvbFxuICAgIC8vIE90aGVyd2lzZSwgdXNlIHRoZSBsZXZlbCBvZiBwYXJlbnQgbm9kZS5cbiAgICBpZiAodGhpcy50cmVlQ29udHJvbC5nZXRMZXZlbCkge1xuICAgICAgY29udGV4dC5sZXZlbCA9IHRoaXMudHJlZUNvbnRyb2wuZ2V0TGV2ZWwobm9kZURhdGEpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBhcmVudERhdGEgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX2xldmVscy5oYXMocGFyZW50RGF0YSkpIHtcbiAgICAgIGNvbnRleHQubGV2ZWwgPSB0aGlzLl9sZXZlbHMuZ2V0KHBhcmVudERhdGEpISArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQubGV2ZWwgPSAwO1xuICAgIH1cbiAgICB0aGlzLl9sZXZlbHMuc2V0KG5vZGVEYXRhLCBjb250ZXh0LmxldmVsKTtcblxuICAgIC8vIFVzZSBkZWZhdWx0IHRyZWUgbm9kZU91dGxldCwgb3IgbmVzdGVkIG5vZGUncyBub2RlT3V0bGV0XG4gICAgY29uc3QgY29udGFpbmVyID0gdmlld0NvbnRhaW5lciA/IHZpZXdDb250YWluZXIgOiB0aGlzLl9ub2RlT3V0bGV0LnZpZXdDb250YWluZXI7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhub2RlLnRlbXBsYXRlLCBjb250ZXh0LCBpbmRleCk7XG5cbiAgICAvLyBTZXQgdGhlIGRhdGEgdG8ganVzdCBjcmVhdGVkIGBDZGtUcmVlTm9kZWAuXG4gICAgLy8gVGhlIGBDZGtUcmVlTm9kZWAgY3JlYXRlZCBmcm9tIGBjcmVhdGVFbWJlZGRlZFZpZXdgIHdpbGwgYmUgc2F2ZWQgaW4gc3RhdGljIHZhcmlhYmxlXG4gICAgLy8gICAgIGBtb3N0UmVjZW50VHJlZU5vZGVgLiBXZSBnZXQgaXQgZnJvbSBzdGF0aWMgdmFyaWFibGUgYW5kIHBhc3MgdGhlIG5vZGUgZGF0YSB0byBpdC5cbiAgICBpZiAoQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlKSB7XG4gICAgICBDZGtUcmVlTm9kZS5tb3N0UmVjZW50VHJlZU5vZGUuZGF0YSA9IG5vZGVEYXRhO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogVHJlZSBub2RlIGZvciBDZGtUcmVlLiBJdCBjb250YWlucyB0aGUgZGF0YSBpbiB0aGUgdHJlZSBub2RlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstdHJlZS1ub2RlJyxcbiAgZXhwb3J0QXM6ICdjZGtUcmVlTm9kZScsXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlPFQsIEsgPSBUPiBpbXBsZW1lbnRzIERvQ2hlY2ssIEZvY3VzYWJsZU9wdGlvbiwgT25EZXN0cm95LCBPbkluaXQge1xuICAvKipcbiAgICogVGhlIHJvbGUgb2YgdGhlIHRyZWUgbm9kZS5cbiAgICogQGRlcHJlY2F0ZWQgVGhlIGNvcnJlY3Qgcm9sZSBpcyAndHJlZWl0ZW0nLCAnZ3JvdXAnIHNob3VsZCBub3QgYmUgdXNlZC4gVGhpcyBpbnB1dCB3aWxsIGJlXG4gICAqICAgcmVtb3ZlZCBpbiBhIGZ1dHVyZSB2ZXJzaW9uLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDEyLjAuMCBSZW1vdmUgdGhpcyBpbnB1dFxuICAgKi9cbiAgQElucHV0KCkgZ2V0IHJvbGUoKTogJ3RyZWVpdGVtJ3wnZ3JvdXAnIHsgcmV0dXJuICd0cmVlaXRlbSc7IH1cblxuICBzZXQgcm9sZShfcm9sZTogJ3RyZWVpdGVtJ3wnZ3JvdXAnKSB7XG4gICAgLy8gVE9ETzogbW92ZSB0byBob3N0IGFmdGVyIFZpZXcgRW5naW5lIGRlcHJlY2F0aW9uXG4gICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsIF9yb2xlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbW9zdCByZWNlbnRseSBjcmVhdGVkIGBDZGtUcmVlTm9kZWAuIFdlIHNhdmUgaXQgaW4gc3RhdGljIHZhcmlhYmxlIHNvIHdlIGNhbiByZXRyaWV2ZSBpdFxuICAgKiBpbiBgQ2RrVHJlZWAgYW5kIHNldCB0aGUgZGF0YSB0byBpdC5cbiAgICovXG4gIHN0YXRpYyBtb3N0UmVjZW50VHJlZU5vZGU6IENka1RyZWVOb2RlPGFueT4gfCBudWxsID0gbnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgbm9kZSdzIGRhdGEgaGFzIGNoYW5nZWQuICovXG4gIF9kYXRhQ2hhbmdlcyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgcHJpdmF0ZSBfcGFyZW50Tm9kZUFyaWFMZXZlbDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdHJlZSBub2RlJ3MgZGF0YS4gKi9cbiAgZ2V0IGRhdGEoKTogVCB7IHJldHVybiB0aGlzLl9kYXRhOyB9XG4gIHNldCBkYXRhKHZhbHVlOiBUKSB7XG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLl9kYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdmFsdWU7XG4gICAgICB0aGlzLl9zZXRSb2xlRnJvbURhdGEoKTtcbiAgICAgIHRoaXMuX2RhdGFDaGFuZ2VzLm5leHQoKTtcbiAgICB9XG4gIH1cbiAgcHJvdGVjdGVkIF9kYXRhOiBUO1xuXG4gIGdldCBpc0V4cGFuZGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl90cmVlLnRyZWVDb250cm9sLmlzRXhwYW5kZWQodGhpcy5fZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIF9zZXRFeHBhbmRlZChfZXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9pc0FyaWFFeHBhbmRlZCA9IF9leHBhbmRlZDtcbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgYCR7X2V4cGFuZGVkfWApO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9pc0FyaWFFeHBhbmRlZDogYm9vbGVhbjtcblxuICBnZXQgbGV2ZWwoKTogbnVtYmVyIHtcbiAgIC8vIElmIHRoZSB0cmVlQ29udHJvbCBoYXMgYSBnZXRMZXZlbCBtZXRob2QsIHVzZSBpdCB0byBnZXQgdGhlIGxldmVsLiBPdGhlcndpc2UgcmVhZCB0aGVcbiAgIC8vIGFyaWEtbGV2ZWwgb2ZmIHRoZSBwYXJlbnQgbm9kZSBhbmQgdXNlIGl0IGFzIHRoZSBsZXZlbCBmb3IgdGhpcyBub2RlIChub3RlIGFyaWEtbGV2ZWwgaXNcbiAgIC8vIDEtaW5kZXhlZCwgd2hpbGUgdGhpcyBwcm9wZXJ0eSBpcyAwLWluZGV4ZWQsIHNvIHdlIGRvbid0IG5lZWQgdG8gaW5jcmVtZW50KS5cbiAgIHJldHVybiB0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldExldmVsID9cbiAgICAgdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRMZXZlbCh0aGlzLl9kYXRhKSA6IHRoaXMuX3BhcmVudE5vZGVBcmlhTGV2ZWw7XG4gICB9XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF90cmVlOiBDZGtUcmVlPFQsIEs+KSB7XG4gICAgQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID0gdGhpcyBhcyBDZGtUcmVlTm9kZTxULCBLPjtcbiAgICAvLyBUaGUgY2xhc3NlcyBhcmUgZGlyZWN0bHkgYWRkZWQgaGVyZSBpbnN0ZWFkIG9mIGluIHRoZSBob3N0IHByb3BlcnR5IGJlY2F1c2UgY2xhc3NlcyBvblxuICAgIC8vIHRoZSBob3N0IHByb3BlcnR5IGFyZSBub3QgaW5oZXJpdGVkIHdpdGggVmlldyBFbmdpbmUuIEl0IGlzIG5vdCBzZXQgYXMgYSBASG9zdEJpbmRpbmcgYmVjYXVzZVxuICAgIC8vIGl0IGlzIG5vdCBzZXQgYnkgdGhlIHRpbWUgaXQncyBjaGlsZHJlbiBub2RlcyB0cnkgdG8gcmVhZCB0aGUgY2xhc3MgZnJvbSBpdC5cbiAgICAvLyBUT0RPOiBtb3ZlIHRvIGhvc3QgYWZ0ZXIgVmlldyBFbmdpbmUgZGVwcmVjYXRpb25cbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY2RrLXRyZWUtbm9kZScpO1xuICAgIHRoaXMucm9sZSA9ICd0cmVlaXRlbSc7XG4gIH1cblxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYXJlbnROb2RlQXJpYUxldmVsID0gZ2V0UGFyZW50Tm9kZUFyaWFMZXZlbCh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGV2ZWwnLCBgJHt0aGlzLmxldmVsICsgMX1gKTtcbiAgfVxuXG4gIG5nRG9DaGVjaygpIHtcbiAgICAvLyBhcmlhLWV4cGFuZGVkIGlzIGJlIHNldCBoZXJlIGJlY2F1c2UgdGhlIGV4cGFuZGVkIHN0YXRlIGlzIHN0b3JlZCBpbiB0aGUgdHJlZSBjb250cm9sIGFuZFxuICAgIC8vIHRoZSBub2RlIGlzbid0IGF3YXJlIHdoZW4gdGhlIHN0YXRlIGlzIGNoYW5nZWQuXG4gICAgLy8gSXQgaXMgbm90IHNldCB1c2luZyBhIEBIb3N0QmluZGluZyBiZWNhdXNlIHRoZXkgc29tZXRpbWVzIGdldCBsb3N0IHdpdGggTWl4aW4gYmFzZWQgY2xhc3Nlcy5cbiAgICAvLyBUT0RPOiBtb3ZlIHRvIGhvc3QgYWZ0ZXIgVmlldyBFbmdpbmUgZGVwcmVjYXRpb25cbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkICE9IHRoaXMuX2lzQXJpYUV4cGFuZGVkKSB7XG4gICAgICB0aGlzLl9zZXRFeHBhbmRlZCh0aGlzLmlzRXhwYW5kZWQpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgdHJlZSBub2RlIGJlaW5nIGRlc3Ryb3llZCxcbiAgICAvLyBjbGVhciBvdXQgdGhlIHJlZmVyZW5jZSB0byBhdm9pZCBsZWFraW5nIG1lbW9yeS5cbiAgICBpZiAoQ2RrVHJlZU5vZGUubW9zdFJlY2VudFRyZWVOb2RlID09PSB0aGlzKSB7XG4gICAgICBDZGtUcmVlTm9kZS5tb3N0UmVjZW50VHJlZU5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGFDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBGb2N1c2VzIHRoZSBtZW51IGl0ZW0uIEltcGxlbWVudHMgZm9yIEZvY3VzYWJsZU9wdGlvbi4gKi9cbiAgZm9jdXMoKTogdm9pZCB7XG4gICAgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKCk7XG4gIH1cblxuICAvLyBUT0RPOiByb2xlIHNob3VsZCBldmVudHVhbGx5IGp1c3QgYmUgc2V0IGluIHRoZSBjb21wb25lbnQgaG9zdFxuICBwcm90ZWN0ZWQgX3NldFJvbGVGcm9tRGF0YSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3RyZWUudHJlZUNvbnRyb2wuaXNFeHBhbmRhYmxlICYmICF0aGlzLl90cmVlLnRyZWVDb250cm9sLmdldENoaWxkcmVuICYmXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3cgZ2V0VHJlZUNvbnRyb2xGdW5jdGlvbnNNaXNzaW5nRXJyb3IoKTtcbiAgICB9XG4gICAgdGhpcy5yb2xlID0gJ3RyZWVpdGVtJztcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnROb2RlQXJpYUxldmVsKG5vZGVFbGVtZW50OiBIVE1MRWxlbWVudCk6IG51bWJlciB7XG4gIGxldCBwYXJlbnQgPSBub2RlRWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICB3aGlsZSAocGFyZW50ICYmICFpc05vZGVFbGVtZW50KHBhcmVudCkpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcbiAgfVxuICBpZiAoIXBhcmVudCkge1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIHRocm93IEVycm9yKCdJbmNvcnJlY3QgdHJlZSBzdHJ1Y3R1cmUgY29udGFpbmluZyBkZXRhY2hlZCBub2RlLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICB9IGVsc2UgaWYgKHBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2Nkay1uZXN0ZWQtdHJlZS1ub2RlJykpIHtcbiAgICByZXR1cm4gY29lcmNlTnVtYmVyUHJvcGVydHkocGFyZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sZXZlbCcpISk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIGFuY2VzdG9yIGVsZW1lbnQgaXMgdGhlIGNkay10cmVlIGl0c2VsZlxuICAgIHJldHVybiAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgY29uc3QgY2xhc3NMaXN0ID0gZWxlbWVudC5jbGFzc0xpc3Q7XG4gIHJldHVybiAhIShjbGFzc0xpc3Q/LmNvbnRhaW5zKCdjZGstbmVzdGVkLXRyZWUtbm9kZScpIHx8IGNsYXNzTGlzdD8uY29udGFpbnMoJ2Nkay10cmVlJykpO1xufVxuIl19