/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplateRef, Injectable, Injector, Inject, Optional, SkipSelf, } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { of as observableOf, Subject, defer } from 'rxjs';
import { DialogRef } from './dialog-ref';
import { DialogConfig } from './dialog-config';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayRef, OverlayConfig, OverlayContainer, } from '@angular/cdk/overlay';
import { startWith } from 'rxjs/operators';
import { DEFAULT_DIALOG_CONFIG, DIALOG_DATA, DIALOG_SCROLL_STRATEGY } from './dialog-injectors';
import { CdkDialogContainer } from './dialog-container';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/overlay";
import * as i2 from "./dialog-config";
/** Unique id for the created dialog. */
let uniqueId = 0;
export class Dialog {
    constructor(_overlay, _injector, _defaultOptions, _parentDialog, _overlayContainer, scrollStrategy) {
        this._overlay = _overlay;
        this._injector = _injector;
        this._defaultOptions = _defaultOptions;
        this._parentDialog = _parentDialog;
        this._overlayContainer = _overlayContainer;
        this._openDialogsAtThisLevel = [];
        this._afterAllClosedAtThisLevel = new Subject();
        this._afterOpenedAtThisLevel = new Subject();
        this._ariaHiddenElements = new Map();
        /**
         * Stream that emits when all open dialog have finished closing.
         * Will emit on subscribe if there are no open dialogs to begin with.
         */
        this.afterAllClosed = defer(() => this.openDialogs.length
            ? this._getAfterAllClosed()
            : this._getAfterAllClosed().pipe(startWith(undefined)));
        this._scrollStrategy = scrollStrategy;
    }
    /** Keeps track of the currently-open dialogs. */
    get openDialogs() {
        return this._parentDialog ? this._parentDialog.openDialogs : this._openDialogsAtThisLevel;
    }
    /** Stream that emits when a dialog has been opened. */
    get afterOpened() {
        return this._parentDialog ? this._parentDialog.afterOpened : this._afterOpenedAtThisLevel;
    }
    open(componentOrTemplateRef, config) {
        const defaults = (this._defaultOptions || new DialogConfig());
        config = { ...defaults, ...config };
        config.id = config.id || `cdk-dialog-${uniqueId++}`;
        if (config.id &&
            this.getDialogById(config.id) &&
            (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
        }
        const overlayConfig = this._getOverlayConfig(config);
        const overlayRef = this._overlay.create(overlayConfig);
        const dialogRef = new DialogRef(overlayRef, config);
        const dialogContainer = this._attachContainer(overlayRef, dialogRef, config);
        dialogRef.containerInstance = dialogContainer;
        this._attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config);
        // If this is the first dialog that we're opening, hide all the non-overlay content.
        if (!this.openDialogs.length) {
            this._hideNonDialogContentFromAssistiveTechnology();
        }
        this.openDialogs.push(dialogRef);
        dialogRef.closed.subscribe(() => this._removeOpenDialog(dialogRef, true));
        this.afterOpened.next(dialogRef);
        return dialogRef;
    }
    /**
     * Closes all of the currently-open dialogs.
     */
    closeAll() {
        reverseForEach(this.openDialogs, dialog => dialog.close());
    }
    /**
     * Finds an open dialog by its id.
     * @param id ID to use when looking up the dialog.
     */
    getDialogById(id) {
        return this.openDialogs.find(dialog => dialog.id === id);
    }
    ngOnDestroy() {
        // Make one pass over all the dialogs that need to be untracked, but should not be closed. We
        // want to stop tracking the open dialog even if it hasn't been closed, because the tracking
        // determines when `aria-hidden` is removed from elements outside the dialog.
        reverseForEach(this._openDialogsAtThisLevel, dialog => {
            // Check for `false` specifically since we want `undefined` to be interpreted as `true`.
            if (dialog.config.closeOnDestroy === false) {
                this._removeOpenDialog(dialog, false);
            }
        });
        // Make a second pass and close the remaining dialogs. We do this second pass in order to
        // correctly dispatch the `afterAllClosed` event in case we have a mixed array of dialogs
        // that should be closed and dialogs that should not.
        reverseForEach(this._openDialogsAtThisLevel, dialog => dialog.close());
        this._afterAllClosedAtThisLevel.complete();
        this._afterOpenedAtThisLevel.complete();
        this._openDialogsAtThisLevel = [];
    }
    /**
     * Creates an overlay config from a dialog config.
     * @param config The dialog configuration.
     * @returns The overlay configuration.
     */
    _getOverlayConfig(config) {
        const state = new OverlayConfig({
            positionStrategy: config.positionStrategy ||
                this._overlay.position().global().centerHorizontally().centerVertically(),
            scrollStrategy: config.scrollStrategy || this._scrollStrategy(),
            panelClass: config.panelClass,
            hasBackdrop: config.hasBackdrop,
            direction: config.direction,
            minWidth: config.minWidth,
            minHeight: config.minHeight,
            maxWidth: config.maxWidth,
            maxHeight: config.maxHeight,
            width: config.width,
            height: config.height,
            disposeOnNavigation: config.closeOnNavigation,
        });
        if (config.backdropClass) {
            state.backdropClass = config.backdropClass;
        }
        return state;
    }
    /**
     * Attaches a dialog container to a dialog's already-created overlay.
     * @param overlay Reference to the dialog's underlying overlay.
     * @param config The dialog configuration.
     * @returns A promise resolving to a ComponentRef for the attached container.
     */
    _attachContainer(overlay, dialogRef, config) {
        const userInjector = config.injector || config.viewContainerRef?.injector;
        const providers = [
            { provide: DialogConfig, useValue: config },
            { provide: DialogRef, useValue: dialogRef },
            { provide: OverlayRef, useValue: overlay },
        ];
        let containerType;
        if (config.container) {
            if (typeof config.container === 'function') {
                containerType = config.container;
            }
            else {
                containerType = config.container.type;
                providers.push(...config.container.providers(config));
            }
        }
        else {
            containerType = CdkDialogContainer;
        }
        const containerPortal = new ComponentPortal(containerType, config.viewContainerRef, Injector.create({ parent: userInjector || this._injector, providers }), config.componentFactoryResolver);
        const containerRef = overlay.attach(containerPortal);
        return containerRef.instance;
    }
    /**
     * Attaches the user-provided component to the already-created dialog container.
     * @param componentOrTemplateRef The type of component being loaded into the dialog,
     *     or a TemplateRef to instantiate as the content.
     * @param dialogRef Reference to the dialog being opened.
     * @param dialogContainer Component that is going to wrap the dialog content.
     * @param config Configuration used to open the dialog.
     */
    _attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config) {
        if (componentOrTemplateRef instanceof TemplateRef) {
            const injector = this._createInjector(config, dialogRef, dialogContainer, undefined);
            let context = { $implicit: config.data, dialogRef };
            if (config.templateContext) {
                context = {
                    ...context,
                    ...(typeof config.templateContext === 'function'
                        ? config.templateContext()
                        : config.templateContext),
                };
            }
            dialogContainer.attachTemplatePortal(new TemplatePortal(componentOrTemplateRef, null, context, injector));
        }
        else {
            const injector = this._createInjector(config, dialogRef, dialogContainer, this._injector);
            const contentRef = dialogContainer.attachComponentPortal(new ComponentPortal(componentOrTemplateRef, config.viewContainerRef, injector, config.componentFactoryResolver));
            dialogRef.componentInstance = contentRef.instance;
        }
    }
    /**
     * Creates a custom injector to be used inside the dialog. This allows a component loaded inside
     * of a dialog to close itself and, optionally, to return a value.
     * @param config Config object that is used to construct the dialog.
     * @param dialogRef Reference to the dialog being opened.
     * @param dialogContainer Component that is going to wrap the dialog content.
     * @param fallbackInjector Injector to use as a fallback when a lookup fails in the custom
     * dialog injector, if the user didn't provide a custom one.
     * @returns The custom injector that can be used inside the dialog.
     */
    _createInjector(config, dialogRef, dialogContainer, fallbackInjector) {
        const userInjector = config.injector || config.viewContainerRef?.injector;
        const providers = [
            { provide: DIALOG_DATA, useValue: config.data },
            { provide: DialogRef, useValue: dialogRef },
        ];
        if (config.providers) {
            if (typeof config.providers === 'function') {
                providers.push(...config.providers(dialogRef, config, dialogContainer));
            }
            else {
                providers.push(...config.providers);
            }
        }
        if (config.direction &&
            (!userInjector ||
                !userInjector.get(Directionality, null, { optional: true }))) {
            providers.push({
                provide: Directionality,
                useValue: { value: config.direction, change: observableOf() },
            });
        }
        return Injector.create({ parent: userInjector || fallbackInjector, providers });
    }
    /**
     * Removes a dialog from the array of open dialogs.
     * @param dialogRef Dialog to be removed.
     * @param emitEvent Whether to emit an event if this is the last dialog.
     */
    _removeOpenDialog(dialogRef, emitEvent) {
        const index = this.openDialogs.indexOf(dialogRef);
        if (index > -1) {
            this.openDialogs.splice(index, 1);
            // If all the dialogs were closed, remove/restore the `aria-hidden`
            // to a the siblings and emit to the `afterAllClosed` stream.
            if (!this.openDialogs.length) {
                this._ariaHiddenElements.forEach((previousValue, element) => {
                    if (previousValue) {
                        element.setAttribute('aria-hidden', previousValue);
                    }
                    else {
                        element.removeAttribute('aria-hidden');
                    }
                });
                this._ariaHiddenElements.clear();
                if (emitEvent) {
                    this._getAfterAllClosed().next();
                }
            }
        }
    }
    /** Hides all of the content that isn't an overlay from assistive technology. */
    _hideNonDialogContentFromAssistiveTechnology() {
        const overlayContainer = this._overlayContainer.getContainerElement();
        // Ensure that the overlay container is attached to the DOM.
        if (overlayContainer.parentElement) {
            const siblings = overlayContainer.parentElement.children;
            for (let i = siblings.length - 1; i > -1; i--) {
                const sibling = siblings[i];
                if (sibling !== overlayContainer &&
                    sibling.nodeName !== 'SCRIPT' &&
                    sibling.nodeName !== 'STYLE' &&
                    !sibling.hasAttribute('aria-live')) {
                    this._ariaHiddenElements.set(sibling, sibling.getAttribute('aria-hidden'));
                    sibling.setAttribute('aria-hidden', 'true');
                }
            }
        }
    }
    _getAfterAllClosed() {
        const parent = this._parentDialog;
        return parent ? parent._getAfterAllClosed() : this._afterAllClosedAtThisLevel;
    }
}
Dialog.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: Dialog, deps: [{ token: i1.Overlay }, { token: i0.Injector }, { token: DEFAULT_DIALOG_CONFIG, optional: true }, { token: Dialog, optional: true, skipSelf: true }, { token: i1.OverlayContainer }, { token: DIALOG_SCROLL_STRATEGY }], target: i0.ɵɵFactoryTarget.Injectable });
Dialog.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: Dialog });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-rc.1", ngImport: i0, type: Dialog, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.Overlay }, { type: i0.Injector }, { type: i2.DialogConfig, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DEFAULT_DIALOG_CONFIG]
                }] }, { type: Dialog, decorators: [{
                    type: Optional
                }, {
                    type: SkipSelf
                }] }, { type: i1.OverlayContainer }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DIALOG_SCROLL_STRATEGY]
                }] }]; } });
/**
 * Executes a callback against all elements in an array while iterating in reverse.
 * Useful if the array is being modified as it is being iterated.
 */
function reverseForEach(items, callback) {
    let i = items.length;
    while (i--) {
        callback(items[i]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kaWFsb2cvZGlhbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxXQUFXLEVBQ1gsVUFBVSxFQUNWLFFBQVEsRUFJUixNQUFNLEVBQ04sUUFBUSxFQUNSLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQW1CLGVBQWUsRUFBRSxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RixPQUFPLEVBQUMsRUFBRSxJQUFJLFlBQVksRUFBYyxPQUFPLEVBQUUsS0FBSyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3BFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBRUwsT0FBTyxFQUNQLFVBQVUsRUFDVixhQUFhLEVBRWIsZ0JBQWdCLEdBQ2pCLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXpDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM5RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQzs7OztBQUV0RCx3Q0FBd0M7QUFDeEMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBR2pCLE1BQU0sT0FBTyxNQUFNO0lBMkJqQixZQUNVLFFBQWlCLEVBQ2pCLFNBQW1CLEVBQ3dCLGVBQTZCLEVBQ2hELGFBQXFCLEVBQzdDLGlCQUFtQyxFQUNYLGNBQW1CO1FBTDNDLGFBQVEsR0FBUixRQUFRLENBQVM7UUFDakIsY0FBUyxH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Q2xDO29CQUNBLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDM0UsT0FBTyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQzdDO2FBQ0Y7U0FDRjtJQUNILENBQUM7SUFFTyxrQkFBa0I7UUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNsQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQztJQUNoRixDQUFDOzt3R0FyV1UsTUFBTSxpRUE4QksscUJBQXFCLGdIQUdqQyxzQkFBc0I7NEdBakNyQixNQUFNO2dHQUFOLE1BQU07a0JBRGxCLFVBQVU7OzBCQStCTixRQUFROzswQkFBSSxNQUFNOzJCQUFDLHFCQUFxQjs7MEJBQ3hDLFFBQVE7OzBCQUFJLFFBQVE7OzBCQUVwQixNQUFNOzJCQUFDLHNCQUFzQjs7QUF1VWxDOzs7R0FHRztBQUNILFNBQVMsY0FBYyxDQUFJLEtBQXlCLEVBQUUsUUFBOEI7SUFDbEYsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUVyQixPQUFPLENBQUMsRUFBRSxFQUFFO1FBQ1YsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBUZW1wbGF0ZVJlZixcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0b3IsXG4gIE9uRGVzdHJveSxcbiAgVHlwZSxcbiAgU3RhdGljUHJvdmlkZXIsXG4gIEluamVjdCxcbiAgT3B0aW9uYWwsXG4gIFNraXBTZWxmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7QmFzZVBvcnRhbE91dGxldCwgQ29tcG9uZW50UG9ydGFsLCBUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge29mIGFzIG9ic2VydmFibGVPZiwgT2JzZXJ2YWJsZSwgU3ViamVjdCwgZGVmZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtEaWFsb2dSZWZ9IGZyb20gJy4vZGlhbG9nLXJlZic7XG5pbXBvcnQge0RpYWxvZ0NvbmZpZ30gZnJvbSAnLi9kaWFsb2ctY29uZmlnJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIENvbXBvbmVudFR5cGUsXG4gIE92ZXJsYXksXG4gIE92ZXJsYXlSZWYsXG4gIE92ZXJsYXlDb25maWcsXG4gIFNjcm9sbFN0cmF0ZWd5LFxuICBPdmVybGF5Q29udGFpbmVyLFxufSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge3N0YXJ0V2l0aH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0RFRkFVTFRfRElBTE9HX0NPTkZJRywgRElBTE9HX0RBVEEsIERJQUxPR19TQ1JPTExfU1RSQVRFR1l9IGZyb20gJy4vZGlhbG9nLWluamVjdG9ycyc7XG5pbXBvcnQge0Nka0RpYWxvZ0NvbnRhaW5lcn0gZnJvbSAnLi9kaWFsb2ctY29udGFpbmVyJztcblxuLyoqIFVuaXF1ZSBpZCBmb3IgdGhlIGNyZWF0ZWQgZGlhbG9nLiAqL1xubGV0IHVuaXF1ZUlkID0gMDtcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERpYWxvZyBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX29wZW5EaWFsb2dzQXRUaGlzTGV2ZWw6IERpYWxvZ1JlZjxhbnksIGFueT5bXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IF9hZnRlckFsbENsb3NlZEF0VGhpc0xldmVsID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYWZ0ZXJPcGVuZWRBdFRoaXNMZXZlbCA9IG5ldyBTdWJqZWN0PERpYWxvZ1JlZj4oKTtcbiAgcHJpdmF0ZSBfYXJpYUhpZGRlbkVsZW1lbnRzID0gbmV3IE1hcDxFbGVtZW50LCBzdHJpbmcgfCBudWxsPigpO1xuICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneTogKCkgPT4gU2Nyb2xsU3RyYXRlZ3k7XG5cbiAgLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50bHktb3BlbiBkaWFsb2dzLiAqL1xuICBnZXQgb3BlbkRpYWxvZ3MoKTogcmVhZG9ubHkgRGlhbG9nUmVmPGFueSwgYW55PltdIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50RGlhbG9nID8gdGhpcy5fcGFyZW50RGlhbG9nLm9wZW5EaWFsb2dzIDogdGhpcy5fb3BlbkRpYWxvZ3NBdFRoaXNMZXZlbDtcbiAgfVxuXG4gIC8qKiBTdHJlYW0gdGhhdCBlbWl0cyB3aGVuIGEgZGlhbG9nIGhhcyBiZWVuIG9wZW5lZC4gKi9cbiAgZ2V0IGFmdGVyT3BlbmVkKCk6IFN1YmplY3Q8RGlhbG9nUmVmPGFueSwgYW55Pj4ge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnREaWFsb2cgPyB0aGlzLl9wYXJlbnREaWFsb2cuYWZ0ZXJPcGVuZWQgOiB0aGlzLl9hZnRlck9wZW5lZEF0VGhpc0xldmVsO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0cmVhbSB0aGF0IGVtaXRzIHdoZW4gYWxsIG9wZW4gZGlhbG9nIGhhdmUgZmluaXNoZWQgY2xvc2luZy5cbiAgICogV2lsbCBlbWl0IG9uIHN1YnNjcmliZSBpZiB0aGVyZSBhcmUgbm8gb3BlbiBkaWFsb2dzIHRvIGJlZ2luIHdpdGguXG4gICAqL1xuICByZWFkb25seSBhZnRlckFsbENsb3NlZDogT2JzZXJ2YWJsZTx2b2lkPiA9IGRlZmVyKCgpID0+XG4gICAgdGhpcy5vcGVuRGlhbG9ncy5sZW5ndGhcbiAgICAgID8gdGhpcy5fZ2V0QWZ0ZXJBbGxDbG9zZWQoKVxuICAgICAgOiB0aGlzLl9nZXRBZnRlckFsbENsb3NlZCgpLnBpcGUoc3RhcnRXaXRoKHVuZGVmaW5lZCkpLFxuICApO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX292ZXJsYXk6IE92ZXJsYXksXG4gICAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoREVGQVVMVF9ESUFMT0dfQ09ORklHKSBwcml2YXRlIF9kZWZhdWx0T3B0aW9uczogRGlhbG9nQ29uZmlnLFxuICAgIEBPcHRpb25hbCgpIEBTa2lwU2VsZigpIHByaXZhdGUgX3BhcmVudERpYWxvZzogRGlhbG9nLFxuICAgIHByaXZhdGUgX292ZXJsYXlDb250YWluZXI6IE92ZXJsYXlDb250YWluZXIsXG4gICAgQEluamVjdChESUFMT0dfU0NST0xMX1NUUkFURUdZKSBzY3JvbGxTdHJhdGVneTogYW55LFxuICApIHtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneSA9IHNjcm9sbFN0cmF0ZWd5O1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgbW9kYWwgZGlhbG9nIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIGNvbXBvbmVudCBUeXBlIG9mIHRoZSBjb21wb25lbnQgdG8gbG9hZCBpbnRvIHRoZSBkaWFsb2cuXG4gICAqIEBwYXJhbSBjb25maWcgRXh0cmEgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIG5ld2x5LW9wZW5lZCBkaWFsb2cuXG4gICAqL1xuICBvcGVuPFIgPSB1bmtub3duLCBEID0gdW5rbm93biwgQyA9IHVua25vd24+KFxuICAgIGNvbXBvbmVudDogQ29tcG9uZW50VHlwZTxDPixcbiAgICBjb25maWc/OiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgKTogRGlhbG9nUmVmPFIsIEM+O1xuXG4gIC8qKlxuICAgKiBPcGVucyBhIG1vZGFsIGRpYWxvZyBjb250YWluaW5nIHRoZSBnaXZlbiB0ZW1wbGF0ZS5cbiAgICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlUmVmIHRvIGluc3RhbnRpYXRlIGFzIHRoZSBkaWFsb2cgY29udGVudC5cbiAgICogQHBhcmFtIGNvbmZpZyBFeHRyYSBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgbmV3bHktb3BlbmVkIGRpYWxvZy5cbiAgICovXG4gIG9wZW48UiA9IHVua25vd24sIEQgPSB1bmtub3duLCBDID0gdW5rbm93bj4oXG4gICAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPEM+LFxuICAgIGNvbmZpZz86IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICApOiBEaWFsb2dSZWY8UiwgQz47XG5cbiAgb3BlbjxSID0gdW5rbm93biwgRCA9IHVua25vd24sIEMgPSB1bmtub3duPihcbiAgICBjb21wb25lbnRPclRlbXBsYXRlUmVmOiBDb21wb25lbnRUeXBlPEM+IHwgVGVtcGxhdGVSZWY8Qz4sXG4gICAgY29uZmlnPzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICk6IERpYWxvZ1JlZjxSLCBDPjtcblxuICBvcGVuPFIgPSB1bmtub3duLCBEID0gdW5rbm93biwgQyA9IHVua25vd24+KFxuICAgIGNvbXBvbmVudE9yVGVtcGxhdGVSZWY6IENvbXBvbmVudFR5cGU8Qz4gfCBUZW1wbGF0ZVJlZjxDPixcbiAgICBjb25maWc/OiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgKTogRGlhbG9nUmVmPFIsIEM+IHtcbiAgICBjb25zdCBkZWZhdWx0cyA9ICh0aGlzLl9kZWZhdWx0T3B0aW9ucyB8fCBuZXcgRGlhbG9nQ29uZmlnKCkpIGFzIERpYWxvZ0NvbmZpZzxcbiAgICAgIEQsXG4gICAgICBEaWFsb2dSZWY8UiwgQz5cbiAgICA+O1xuICAgIGNvbmZpZyA9IHsuLi5kZWZhdWx0cywgLi4uY29uZmlnfTtcbiAgICBjb25maWcuaWQgPSBjb25maWcuaWQgfHwgYGNkay1kaWFsb2ctJHt1bmlxdWVJZCsrfWA7XG5cbiAgICBpZiAoXG4gICAgICBjb25maWcuaWQgJiZcbiAgICAgIHRoaXMuZ2V0RGlhbG9nQnlJZChjb25maWcuaWQpICYmXG4gICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgRXJyb3IoYERpYWxvZyB3aXRoIGlkIFwiJHtjb25maWcuaWR9XCIgZXhpc3RzIGFscmVhZHkuIFRoZSBkaWFsb2cgaWQgbXVzdCBiZSB1bmlxdWUuYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3ZlcmxheUNvbmZpZyA9IHRoaXMuX2dldE92ZXJsYXlDb25maWcoY29uZmlnKTtcbiAgICBjb25zdCBvdmVybGF5UmVmID0gdGhpcy5fb3ZlcmxheS5jcmVhdGUob3ZlcmxheUNvbmZpZyk7XG4gICAgY29uc3QgZGlhbG9nUmVmID0gbmV3IERpYWxvZ1JlZihvdmVybGF5UmVmLCBjb25maWcpO1xuICAgIGNvbnN0IGRpYWxvZ0NvbnRhaW5lciA9IHRoaXMuX2F0dGFjaENvbnRhaW5lcihvdmVybGF5UmVmLCBkaWFsb2dSZWYsIGNvbmZpZyk7XG5cbiAgICAoZGlhbG9nUmVmIGFzIHtjb250YWluZXJJbnN0YW5jZTogQmFzZVBvcnRhbE91dGxldH0pLmNvbnRhaW5lckluc3RhbmNlID0gZGlhbG9nQ29udGFpbmVyO1xuICAgIHRoaXMuX2F0dGFjaERpYWxvZ0NvbnRlbnQoY29tcG9uZW50T3JUZW1wbGF0ZVJlZiwgZGlhbG9nUmVmLCBkaWFsb2dDb250YWluZXIsIGNvbmZpZyk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBkaWFsb2cgdGhhdCB3ZSdyZSBvcGVuaW5nLCBoaWRlIGFsbCB0aGUgbm9uLW92ZXJsYXkgY29udGVudC5cbiAgICBpZiAoIXRoaXMub3BlbkRpYWxvZ3MubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9oaWRlTm9uRGlhbG9nQ29udGVudEZyb21Bc3Npc3RpdmVUZWNobm9sb2d5KCk7XG4gICAgfVxuXG4gICAgKHRoaXMub3BlbkRpYWxvZ3MgYXMgRGlhbG9nUmVmPFIsIEM+W10pLnB1c2goZGlhbG9nUmVmKTtcbiAgICBkaWFsb2dSZWYuY2xvc2VkLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9yZW1vdmVPcGVuRGlhbG9nKGRpYWxvZ1JlZiwgdHJ1ZSkpO1xuICAgIHRoaXMuYWZ0ZXJPcGVuZWQubmV4dChkaWFsb2dSZWYpO1xuXG4gICAgcmV0dXJuIGRpYWxvZ1JlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgYWxsIG9mIHRoZSBjdXJyZW50bHktb3BlbiBkaWFsb2dzLlxuICAgKi9cbiAgY2xvc2VBbGwoKTogdm9pZCB7XG4gICAgcmV2ZXJzZUZvckVhY2godGhpcy5vcGVuRGlhbG9ncywgZGlhbG9nID0+IGRpYWxvZy5jbG9zZSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbiBvcGVuIGRpYWxvZyBieSBpdHMgaWQuXG4gICAqIEBwYXJhbSBpZCBJRCB0byB1c2Ugd2hlbiBsb29raW5nIHVwIHRoZSBkaWFsb2cuXG4gICAqL1xuICBnZXREaWFsb2dCeUlkPFIsIEM+KGlkOiBzdHJpbmcpOiBEaWFsb2dSZWY8UiwgQz4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm9wZW5EaWFsb2dzLmZpbmQoZGlhbG9nID0+IGRpYWxvZy5pZCA9PT0gaWQpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgLy8gTWFrZSBvbmUgcGFzcyBvdmVyIGFsbCB0aGUgZGlhbG9ncyB0aGF0IG5lZWQgdG8gYmUgdW50cmFja2VkLCBidXQgc2hvdWxkIG5vdCBiZSBjbG9zZWQuIFdlXG4gICAgLy8gd2FudCB0byBzdG9wIHRyYWNraW5nIHRoZSBvcGVuIGRpYWxvZyBldmVuIGlmIGl0IGhhc24ndCBiZWVuIGNsb3NlZCwgYmVjYXVzZSB0aGUgdHJhY2tpbmdcbiAgICAvLyBkZXRlcm1pbmVzIHdoZW4gYGFyaWEtaGlkZGVuYCBpcyByZW1vdmVkIGZyb20gZWxlbWVudHMgb3V0c2lkZSB0aGUgZGlhbG9nLlxuICAgIHJldmVyc2VGb3JFYWNoKHRoaXMuX29wZW5EaWFsb2dzQXRUaGlzTGV2ZWwsIGRpYWxvZyA9PiB7XG4gICAgICAvLyBDaGVjayBmb3IgYGZhbHNlYCBzcGVjaWZpY2FsbHkgc2luY2Ugd2Ugd2FudCBgdW5kZWZpbmVkYCB0byBiZSBpbnRlcnByZXRlZCBhcyBgdHJ1ZWAuXG4gICAgICBpZiAoZGlhbG9nLmNvbmZpZy5jbG9zZU9uRGVzdHJveSA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlT3BlbkRpYWxvZyhkaWFsb2csIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE1ha2UgYSBzZWNvbmQgcGFzcyBhbmQgY2xvc2UgdGhlIHJlbWFpbmluZyBkaWFsb2dzLiBXZSBkbyB0aGlzIHNlY29uZCBwYXNzIGluIG9yZGVyIHRvXG4gICAgLy8gY29ycmVjdGx5IGRpc3BhdGNoIHRoZSBgYWZ0ZXJBbGxDbG9zZWRgIGV2ZW50IGluIGNhc2Ugd2UgaGF2ZSBhIG1peGVkIGFycmF5IG9mIGRpYWxvZ3NcbiAgICAvLyB0aGF0IHNob3VsZCBiZSBjbG9zZWQgYW5kIGRpYWxvZ3MgdGhhdCBzaG91bGQgbm90LlxuICAgIHJldmVyc2VGb3JFYWNoKHRoaXMuX29wZW5EaWFsb2dzQXRUaGlzTGV2ZWwsIGRpYWxvZyA9PiBkaWFsb2cuY2xvc2UoKSk7XG5cbiAgICB0aGlzLl9hZnRlckFsbENsb3NlZEF0VGhpc0xldmVsLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYWZ0ZXJPcGVuZWRBdFRoaXNMZXZlbC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX29wZW5EaWFsb2dzQXRUaGlzTGV2ZWwgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIG92ZXJsYXkgY29uZmlnIGZyb20gYSBkaWFsb2cgY29uZmlnLlxuICAgKiBAcGFyYW0gY29uZmlnIFRoZSBkaWFsb2cgY29uZmlndXJhdGlvbi5cbiAgICogQHJldHVybnMgVGhlIG92ZXJsYXkgY29uZmlndXJhdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2dldE92ZXJsYXlDb25maWc8RCwgUj4oY29uZmlnOiBEaWFsb2dDb25maWc8RCwgUj4pOiBPdmVybGF5Q29uZmlnIHtcbiAgICBjb25zdCBzdGF0ZSA9IG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3k6XG4gICAgICAgIGNvbmZpZy5wb3NpdGlvblN0cmF0ZWd5IHx8XG4gICAgICAgIHRoaXMuX292ZXJsYXkucG9zaXRpb24oKS5nbG9iYWwoKS5jZW50ZXJIb3Jpem9udGFsbHkoKS5jZW50ZXJWZXJ0aWNhbGx5KCksXG4gICAgICBzY3JvbGxTdHJhdGVneTogY29uZmlnLnNjcm9sbFN0cmF0ZWd5IHx8IHRoaXMuX3Njcm9sbFN0cmF0ZWd5KCksXG4gICAgICBwYW5lbENsYXNzOiBjb25maWcucGFuZWxDbGFzcyxcbiAgICAgIGhhc0JhY2tkcm9wOiBjb25maWcuaGFzQmFja2Ryb3AsXG4gICAgICBkaXJlY3Rpb246IGNvbmZpZy5kaXJlY3Rpb24sXG4gICAgICBtaW5XaWR0aDogY29uZmlnLm1pbldpZHRoLFxuICAgICAgbWluSGVpZ2h0OiBjb25maWcubWluSGVpZ2h0LFxuICAgICAgbWF4V2lkdGg6IGNvbmZpZy5tYXhXaWR0aCxcbiAgICAgIG1heEhlaWdodDogY29uZmlnLm1heEhlaWdodCxcbiAgICAgIHdpZHRoOiBjb25maWcud2lkdGgsXG4gICAgICBoZWlnaHQ6IGNvbmZpZy5oZWlnaHQsXG4gICAgICBkaXNwb3NlT25OYXZpZ2F0aW9uOiBjb25maWcuY2xvc2VPbk5hdmlnYXRpb24sXG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLmJhY2tkcm9wQ2xhc3MpIHtcbiAgICAgIHN0YXRlLmJhY2tkcm9wQ2xhc3MgPSBjb25maWcuYmFja2Ryb3BDbGFzcztcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSBkaWFsb2cgY29udGFpbmVyIHRvIGEgZGlhbG9nJ3MgYWxyZWFkeS1jcmVhdGVkIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBvdmVybGF5IFJlZmVyZW5jZSB0byB0aGUgZGlhbG9nJ3MgdW5kZXJseWluZyBvdmVybGF5LlxuICAgKiBAcGFyYW0gY29uZmlnIFRoZSBkaWFsb2cgY29uZmlndXJhdGlvbi5cbiAgICogQHJldHVybnMgQSBwcm9taXNlIHJlc29sdmluZyB0byBhIENvbXBvbmVudFJlZiBmb3IgdGhlIGF0dGFjaGVkIGNvbnRhaW5lci5cbiAgICovXG4gIHByaXZhdGUgX2F0dGFjaENvbnRhaW5lcjxSLCBELCBDPihcbiAgICBvdmVybGF5OiBPdmVybGF5UmVmLFxuICAgIGRpYWxvZ1JlZjogRGlhbG9nUmVmPFIsIEM+LFxuICAgIGNvbmZpZzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICk6IEJhc2VQb3J0YWxPdXRsZXQge1xuICAgIGNvbnN0IHVzZXJJbmplY3RvciA9IGNvbmZpZy5pbmplY3RvciB8fCBjb25maWcudmlld0NvbnRhaW5lclJlZj8uaW5qZWN0b3I7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IERpYWxvZ0NvbmZpZywgdXNlVmFsdWU6IGNvbmZpZ30sXG4gICAgICB7cHJvdmlkZTogRGlhbG9nUmVmLCB1c2VWYWx1ZTogZGlhbG9nUmVmfSxcbiAgICAgIHtwcm92aWRlOiBPdmVybGF5UmVmLCB1c2VWYWx1ZTogb3ZlcmxheX0sXG4gICAgXTtcbiAgICBsZXQgY29udGFpbmVyVHlwZTogVHlwZTxCYXNlUG9ydGFsT3V0bGV0PjtcblxuICAgIGlmIChjb25maWcuY29udGFpbmVyKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbmZpZy5jb250YWluZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29udGFpbmVyVHlwZSA9IGNvbmZpZy5jb250YWluZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250YWluZXJUeXBlID0gY29uZmlnLmNvbnRhaW5lci50eXBlO1xuICAgICAgICBwcm92aWRlcnMucHVzaCguLi5jb25maWcuY29udGFpbmVyLnByb3ZpZGVycyhjb25maWcpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGFpbmVyVHlwZSA9IENka0RpYWxvZ0NvbnRhaW5lcjtcbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZXJQb3J0YWwgPSBuZXcgQ29tcG9uZW50UG9ydGFsKFxuICAgICAgY29udGFpbmVyVHlwZSxcbiAgICAgIGNvbmZpZy52aWV3Q29udGFpbmVyUmVmLFxuICAgICAgSW5qZWN0b3IuY3JlYXRlKHtwYXJlbnQ6IHVzZXJJbmplY3RvciB8fCB0aGlzLl9pbmplY3RvciwgcHJvdmlkZXJzfSksXG4gICAgICBjb25maWcuY29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICAgICk7XG4gICAgY29uc3QgY29udGFpbmVyUmVmID0gb3ZlcmxheS5hdHRhY2goY29udGFpbmVyUG9ydGFsKTtcblxuICAgIHJldHVybiBjb250YWluZXJSZWYuaW5zdGFuY2U7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgdGhlIHVzZXItcHJvdmlkZWQgY29tcG9uZW50IHRvIHRoZSBhbHJlYWR5LWNyZWF0ZWQgZGlhbG9nIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIGNvbXBvbmVudE9yVGVtcGxhdGVSZWYgVGhlIHR5cGUgb2YgY29tcG9uZW50IGJlaW5nIGxvYWRlZCBpbnRvIHRoZSBkaWFsb2csXG4gICAqICAgICBvciBhIFRlbXBsYXRlUmVmIHRvIGluc3RhbnRpYXRlIGFzIHRoZSBjb250ZW50LlxuICAgKiBAcGFyYW0gZGlhbG9nUmVmIFJlZmVyZW5jZSB0byB0aGUgZGlhbG9nIGJlaW5nIG9wZW5lZC5cbiAgICogQHBhcmFtIGRpYWxvZ0NvbnRhaW5lciBDb21wb25lbnQgdGhhdCBpcyBnb2luZyB0byB3cmFwIHRoZSBkaWFsb2cgY29udGVudC5cbiAgICogQHBhcmFtIGNvbmZpZyBDb25maWd1cmF0aW9uIHVzZWQgdG8gb3BlbiB0aGUgZGlhbG9nLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXR0YWNoRGlhbG9nQ29udGVudDxSLCBELCBDPihcbiAgICBjb21wb25lbnRPclRlbXBsYXRlUmVmOiBDb21wb25lbnRUeXBlPEM+IHwgVGVtcGxhdGVSZWY8Qz4sXG4gICAgZGlhbG9nUmVmOiBEaWFsb2dSZWY8UiwgQz4sXG4gICAgZGlhbG9nQ29udGFpbmVyOiBCYXNlUG9ydGFsT3V0bGV0LFxuICAgIGNvbmZpZzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICkge1xuICAgIGlmIChjb21wb25lbnRPclRlbXBsYXRlUmVmIGluc3RhbmNlb2YgVGVtcGxhdGVSZWYpIHtcbiAgICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5fY3JlYXRlSW5qZWN0b3IoY29uZmlnLCBkaWFsb2dSZWYsIGRpYWxvZ0NvbnRhaW5lciwgdW5kZWZpbmVkKTtcbiAgICAgIGxldCBjb250ZXh0OiBhbnkgPSB7JGltcGxpY2l0OiBjb25maWcuZGF0YSwgZGlhbG9nUmVmfTtcblxuICAgICAgaWYgKGNvbmZpZy50ZW1wbGF0ZUNvbnRleHQpIHtcbiAgICAgICAgY29udGV4dCA9IHtcbiAgICAgICAgICAuLi5jb250ZXh0LFxuICAgICAgICAgIC4uLih0eXBlb2YgY29uZmlnLnRlbXBsYXRlQ29udGV4dCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgPyBjb25maWcudGVtcGxhdGVDb250ZXh0KClcbiAgICAgICAgICAgIDogY29uZmlnLnRlbXBsYXRlQ29udGV4dCksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGRpYWxvZ0NvbnRhaW5lci5hdHRhY2hUZW1wbGF0ZVBvcnRhbChcbiAgICAgICAgbmV3IFRlbXBsYXRlUG9ydGFsPEM+KGNvbXBvbmVudE9yVGVtcGxhdGVSZWYsIG51bGwhLCBjb250ZXh0LCBpbmplY3RvciksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX2NyZWF0ZUluamVjdG9yKGNvbmZpZywgZGlhbG9nUmVmLCBkaWFsb2dDb250YWluZXIsIHRoaXMuX2luamVjdG9yKTtcbiAgICAgIGNvbnN0IGNvbnRlbnRSZWYgPSBkaWFsb2dDb250YWluZXIuYXR0YWNoQ29tcG9uZW50UG9ydGFsPEM+KFxuICAgICAgICBuZXcgQ29tcG9uZW50UG9ydGFsKFxuICAgICAgICAgIGNvbXBvbmVudE9yVGVtcGxhdGVSZWYsXG4gICAgICAgICAgY29uZmlnLnZpZXdDb250YWluZXJSZWYsXG4gICAgICAgICAgaW5qZWN0b3IsXG4gICAgICAgICAgY29uZmlnLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgICAoZGlhbG9nUmVmIGFzIHtjb21wb25lbnRJbnN0YW5jZTogQ30pLmNvbXBvbmVudEluc3RhbmNlID0gY29udGVudFJlZi5pbnN0YW5jZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGN1c3RvbSBpbmplY3RvciB0byBiZSB1c2VkIGluc2lkZSB0aGUgZGlhbG9nLiBUaGlzIGFsbG93cyBhIGNvbXBvbmVudCBsb2FkZWQgaW5zaWRlXG4gICAqIG9mIGEgZGlhbG9nIHRvIGNsb3NlIGl0c2VsZiBhbmQsIG9wdGlvbmFsbHksIHRvIHJldHVybiBhIHZhbHVlLlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZyBvYmplY3QgdGhhdCBpcyB1c2VkIHRvIGNvbnN0cnVjdCB0aGUgZGlhbG9nLlxuICAgKiBAcGFyYW0gZGlhbG9nUmVmIFJlZmVyZW5jZSB0byB0aGUgZGlhbG9nIGJlaW5nIG9wZW5lZC5cbiAgICogQHBhcmFtIGRpYWxvZ0NvbnRhaW5lciBDb21wb25lbnQgdGhhdCBpcyBnb2luZyB0byB3cmFwIHRoZSBkaWFsb2cgY29udGVudC5cbiAgICogQHBhcmFtIGZhbGxiYWNrSW5qZWN0b3IgSW5qZWN0b3IgdG8gdXNlIGFzIGEgZmFsbGJhY2sgd2hlbiBhIGxvb2t1cCBmYWlscyBpbiB0aGUgY3VzdG9tXG4gICAqIGRpYWxvZyBpbmplY3RvciwgaWYgdGhlIHVzZXIgZGlkbid0IHByb3ZpZGUgYSBjdXN0b20gb25lLlxuICAgKiBAcmV0dXJucyBUaGUgY3VzdG9tIGluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgaW5zaWRlIHRoZSBkaWFsb2cuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVJbmplY3RvcjxSLCBELCBDPihcbiAgICBjb25maWc6IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICAgIGRpYWxvZ1JlZjogRGlhbG9nUmVmPFIsIEM+LFxuICAgIGRpYWxvZ0NvbnRhaW5lcjogQmFzZVBvcnRhbE91dGxldCxcbiAgICBmYWxsYmFja0luamVjdG9yOiBJbmplY3RvciB8IHVuZGVmaW5lZCxcbiAgKTogSW5qZWN0b3Ige1xuICAgIGNvbnN0IHVzZXJJbmplY3RvciA9IGNvbmZpZy5pbmplY3RvciB8fCBjb25maWcudmlld0NvbnRhaW5lclJlZj8uaW5qZWN0b3I7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IERJQUxPR19EQVRBLCB1c2VWYWx1ZTogY29uZmlnLmRhdGF9LFxuICAgICAge3Byb3ZpZGU6IERpYWxvZ1JlZiwgdXNlVmFsdWU6IGRpYWxvZ1JlZn0sXG4gICAgXTtcblxuICAgIGlmIChjb25maWcucHJvdmlkZXJzKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbmZpZy5wcm92aWRlcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyhkaWFsb2dSZWYsIGNvbmZpZywgZGlhbG9nQ29udGFpbmVyKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm92aWRlcnMucHVzaCguLi5jb25maWcucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBjb25maWcuZGlyZWN0aW9uICYmXG4gICAgICAoIXVzZXJJbmplY3RvciB8fFxuICAgICAgICAhdXNlckluamVjdG9yLmdldDxEaXJlY3Rpb25hbGl0eSB8IG51bGw+KERpcmVjdGlvbmFsaXR5LCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KSlcbiAgICApIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKHtcbiAgICAgICAgcHJvdmlkZTogRGlyZWN0aW9uYWxpdHksXG4gICAgICAgIHVzZVZhbHVlOiB7dmFsdWU6IGNvbmZpZy5kaXJlY3Rpb24sIGNoYW5nZTogb2JzZXJ2YWJsZU9mKCl9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIEluamVjdG9yLmNyZWF0ZSh7cGFyZW50OiB1c2VySW5qZWN0b3IgfHwgZmFsbGJhY2tJbmplY3RvciwgcHJvdmlkZXJzfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGRpYWxvZyBmcm9tIHRoZSBhcnJheSBvZiBvcGVuIGRpYWxvZ3MuXG4gICAqIEBwYXJhbSBkaWFsb2dSZWYgRGlhbG9nIHRvIGJlIHJlbW92ZWQuXG4gICAqIEBwYXJhbSBlbWl0RXZlbnQgV2hldGhlciB0byBlbWl0IGFuIGV2ZW50IGlmIHRoaXMgaXMgdGhlIGxhc3QgZGlhbG9nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlT3BlbkRpYWxvZzxSLCBDPihkaWFsb2dSZWY6IERpYWxvZ1JlZjxSLCBDPiwgZW1pdEV2ZW50OiBib29sZWFuKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wZW5EaWFsb2dzLmluZGV4T2YoZGlhbG9nUmVmKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAodGhpcy5vcGVuRGlhbG9ncyBhcyBEaWFsb2dSZWY8UiwgQz5bXSkuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgLy8gSWYgYWxsIHRoZSBkaWFsb2dzIHdlcmUgY2xvc2VkLCByZW1vdmUvcmVzdG9yZSB0aGUgYGFyaWEtaGlkZGVuYFxuICAgICAgLy8gdG8gYSB0aGUgc2libGluZ3MgYW5kIGVtaXQgdG8gdGhlIGBhZnRlckFsbENsb3NlZGAgc3RyZWFtLlxuICAgICAgaWYgKCF0aGlzLm9wZW5EaWFsb2dzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuZm9yRWFjaCgocHJldmlvdXNWYWx1ZSwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBwcmV2aW91c1ZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuY2xlYXIoKTtcblxuICAgICAgICBpZiAoZW1pdEV2ZW50KSB7XG4gICAgICAgICAgdGhpcy5fZ2V0QWZ0ZXJBbGxDbG9zZWQoKS5uZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSGlkZXMgYWxsIG9mIHRoZSBjb250ZW50IHRoYXQgaXNuJ3QgYW4gb3ZlcmxheSBmcm9tIGFzc2lzdGl2ZSB0ZWNobm9sb2d5LiAqL1xuICBwcml2YXRlIF9oaWRlTm9uRGlhbG9nQ29udGVudEZyb21Bc3Npc3RpdmVUZWNobm9sb2d5KCkge1xuICAgIGNvbnN0IG92ZXJsYXlDb250YWluZXIgPSB0aGlzLl9vdmVybGF5Q29udGFpbmVyLmdldENvbnRhaW5lckVsZW1lbnQoKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBvdmVybGF5IGNvbnRhaW5lciBpcyBhdHRhY2hlZCB0byB0aGUgRE9NLlxuICAgIGlmIChvdmVybGF5Q29udGFpbmVyLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gb3ZlcmxheUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LmNoaWxkcmVuO1xuXG4gICAgICBmb3IgKGxldCBpID0gc2libGluZ3MubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcbiAgICAgICAgY29uc3Qgc2libGluZyA9IHNpYmxpbmdzW2ldO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBzaWJsaW5nICE9PSBvdmVybGF5Q29udGFpbmVyICYmXG4gICAgICAgICAgc2libGluZy5ub2RlTmFtZSAhPT0gJ1NDUklQVCcgJiZcbiAgICAgICAgICBzaWJsaW5nLm5vZGVOYW1lICE9PSAnU1RZTEUnICYmXG4gICAgICAgICAgIXNpYmxpbmcuaGFzQXR0cmlidXRlKCdhcmlhLWxpdmUnKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuc2V0KHNpYmxpbmcsIHNpYmxpbmcuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICAgICAgICBzaWJsaW5nLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QWZ0ZXJBbGxDbG9zZWQoKTogU3ViamVjdDx2b2lkPiB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5fcGFyZW50RGlhbG9nO1xuICAgIHJldHVybiBwYXJlbnQgPyBwYXJlbnQuX2dldEFmdGVyQWxsQ2xvc2VkKCkgOiB0aGlzLl9hZnRlckFsbENsb3NlZEF0VGhpc0xldmVsO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBjYWxsYmFjayBhZ2FpbnN0IGFsbCBlbGVtZW50cyBpbiBhbiBhcnJheSB3aGlsZSBpdGVyYXRpbmcgaW4gcmV2ZXJzZS5cbiAqIFVzZWZ1bCBpZiB0aGUgYXJyYXkgaXMgYmVpbmcgbW9kaWZpZWQgYXMgaXQgaXMgYmVpbmcgaXRlcmF0ZWQuXG4gKi9cbmZ1bmN0aW9uIHJldmVyc2VGb3JFYWNoPFQ+KGl0ZW1zOiBUW10gfCByZWFkb25seSBUW10sIGNhbGxiYWNrOiAoY3VycmVudDogVCkgPT4gdm9pZCkge1xuICBsZXQgaSA9IGl0ZW1zLmxlbmd0aDtcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgY2FsbGJhY2soaXRlbXNbaV0pO1xuICB9XG59XG4iXX0=