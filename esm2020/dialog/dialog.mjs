/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplateRef, Injectable, Injector, InjectFlags, Inject, Optional, SkipSelf, } from '@angular/core';
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
        const userInjector = config.injector ?? config.viewContainerRef?.injector;
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
        const injector = this._createInjector(config, dialogRef, dialogContainer);
        if (componentOrTemplateRef instanceof TemplateRef) {
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
     * @returns The custom injector that can be used inside the dialog.
     */
    _createInjector(config, dialogRef, dialogContainer) {
        const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
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
                !userInjector.get(Directionality, null, InjectFlags.Optional))) {
            providers.push({
                provide: Directionality,
                useValue: { value: config.direction, change: observableOf() },
            });
        }
        return Injector.create({ parent: config.injector || userInjector || this._injector, providers });
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
Dialog.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: Dialog, deps: [{ token: i1.Overlay }, { token: i0.Injector }, { token: DEFAULT_DIALOG_CONFIG, optional: true }, { token: Dialog, optional: true, skipSelf: true }, { token: i1.OverlayContainer }, { token: DIALOG_SCROLL_STRATEGY }], target: i0.ɵɵFactoryTarget.Injectable });
Dialog.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: Dialog });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: Dialog, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kaWFsb2cvZGlhbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxXQUFXLEVBQ1gsVUFBVSxFQUNWLFFBQVEsRUFJUixXQUFXLEVBQ1gsTUFBTSxFQUNOLFFBQVEsRUFDUixRQUFRLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFtQixlQUFlLEVBQUUsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEYsT0FBTyxFQUFDLEVBQUUsSUFBSSxZQUFZLEVBQWMsT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNwRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUVMLE9BQU8sRUFDUCxVQUFVLEVBQ1YsYUFBYSxFQUViLGdCQUFnQixHQUNqQixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV6QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDOUYsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7QUFFdEQsd0NBQXdDO0FBQ3hDLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztBQUdqQixNQUFNLE9BQU8sTUFBTTtJQTJCakIsWUFDVSxRQUFpQixFQUNqQixTQUFtQixFQUN3QixlQUE2QixFQUNoRCxhQUFxQixFQUM3QyxpQkFBbUMsRUFDWCxjQUFtQjtRQUwzQyxhQUFRLEdBQVIsUUFBUSxDQUFTO1FB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LENBQUMsQ0FBQztvQkFDM0UsT0FBTyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQzdDO2FBQ0Y7U0FDRjtJQUNILENBQUM7SUFFTyxrQkFBa0I7UUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNsQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQztJQUNoRixDQUFDOzttR0FsV1UsTUFBTSxpRUE4QksscUJBQXFCLDZCQUNNLE1BQU0sNkVBRTdDLHNCQUFzQjt1R0FqQ3JCLE1BQU07MkZBQU4sTUFBTTtrQkFEbEIsVUFBVTs7MEJBK0JOLFFBQVE7OzBCQUFJLE1BQU07MkJBQUMscUJBQXFCOzhCQUNNLE1BQU07MEJBQXBELFFBQVE7OzBCQUFJLFFBQVE7OzBCQUVwQixNQUFNOzJCQUFDLHNCQUFzQjs7QUFvVWxDOzs7R0FHRztBQUNILFNBQVMsY0FBYyxDQUFJLEtBQXlCLEVBQUUsUUFBOEI7SUFDbEYsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUVyQixPQUFPLENBQUMsRUFBRSxFQUFFO1FBQ1YsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBUZW1wbGF0ZVJlZixcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0b3IsXG4gIE9uRGVzdHJveSxcbiAgVHlwZSxcbiAgU3RhdGljUHJvdmlkZXIsXG4gIEluamVjdEZsYWdzLFxuICBJbmplY3QsXG4gIE9wdGlvbmFsLFxuICBTa2lwU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0Jhc2VQb3J0YWxPdXRsZXQsIENvbXBvbmVudFBvcnRhbCwgVGVtcGxhdGVQb3J0YWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtvZiBhcyBvYnNlcnZhYmxlT2YsIE9ic2VydmFibGUsIFN1YmplY3QsIGRlZmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7RGlhbG9nUmVmfSBmcm9tICcuL2RpYWxvZy1yZWYnO1xuaW1wb3J0IHtEaWFsb2dDb25maWd9IGZyb20gJy4vZGlhbG9nLWNvbmZpZyc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBDb21wb25lbnRUeXBlLFxuICBPdmVybGF5LFxuICBPdmVybGF5UmVmLFxuICBPdmVybGF5Q29uZmlnLFxuICBTY3JvbGxTdHJhdGVneSxcbiAgT3ZlcmxheUNvbnRhaW5lcixcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtzdGFydFdpdGh9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtERUZBVUxUX0RJQUxPR19DT05GSUcsIERJQUxPR19EQVRBLCBESUFMT0dfU0NST0xMX1NUUkFURUdZfSBmcm9tICcuL2RpYWxvZy1pbmplY3RvcnMnO1xuaW1wb3J0IHtDZGtEaWFsb2dDb250YWluZXJ9IGZyb20gJy4vZGlhbG9nLWNvbnRhaW5lcic7XG5cbi8qKiBVbmlxdWUgaWQgZm9yIHRoZSBjcmVhdGVkIGRpYWxvZy4gKi9cbmxldCB1bmlxdWVJZCA9IDA7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBEaWFsb2cgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9vcGVuRGlhbG9nc0F0VGhpc0xldmVsOiBEaWFsb2dSZWY8YW55LCBhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYWZ0ZXJBbGxDbG9zZWRBdFRoaXNMZXZlbCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2FmdGVyT3BlbmVkQXRUaGlzTGV2ZWwgPSBuZXcgU3ViamVjdDxEaWFsb2dSZWY+KCk7XG4gIHByaXZhdGUgX2FyaWFIaWRkZW5FbGVtZW50cyA9IG5ldyBNYXA8RWxlbWVudCwgc3RyaW5nIHwgbnVsbD4oKTtcbiAgcHJpdmF0ZSBfc2Nyb2xsU3RyYXRlZ3k6ICgpID0+IFNjcm9sbFN0cmF0ZWd5O1xuXG4gIC8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LW9wZW4gZGlhbG9ncy4gKi9cbiAgZ2V0IG9wZW5EaWFsb2dzKCk6IHJlYWRvbmx5IERpYWxvZ1JlZjxhbnksIGFueT5bXSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudERpYWxvZyA/IHRoaXMuX3BhcmVudERpYWxvZy5vcGVuRGlhbG9ncyA6IHRoaXMuX29wZW5EaWFsb2dzQXRUaGlzTGV2ZWw7XG4gIH1cblxuICAvKiogU3RyZWFtIHRoYXQgZW1pdHMgd2hlbiBhIGRpYWxvZyBoYXMgYmVlbiBvcGVuZWQuICovXG4gIGdldCBhZnRlck9wZW5lZCgpOiBTdWJqZWN0PERpYWxvZ1JlZjxhbnksIGFueT4+IHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50RGlhbG9nID8gdGhpcy5fcGFyZW50RGlhbG9nLmFmdGVyT3BlbmVkIDogdGhpcy5fYWZ0ZXJPcGVuZWRBdFRoaXNMZXZlbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdHJlYW0gdGhhdCBlbWl0cyB3aGVuIGFsbCBvcGVuIGRpYWxvZyBoYXZlIGZpbmlzaGVkIGNsb3NpbmcuXG4gICAqIFdpbGwgZW1pdCBvbiBzdWJzY3JpYmUgaWYgdGhlcmUgYXJlIG5vIG9wZW4gZGlhbG9ncyB0byBiZWdpbiB3aXRoLlxuICAgKi9cbiAgcmVhZG9ubHkgYWZ0ZXJBbGxDbG9zZWQ6IE9ic2VydmFibGU8dm9pZD4gPSBkZWZlcigoKSA9PlxuICAgIHRoaXMub3BlbkRpYWxvZ3MubGVuZ3RoXG4gICAgICA/IHRoaXMuX2dldEFmdGVyQWxsQ2xvc2VkKClcbiAgICAgIDogdGhpcy5fZ2V0QWZ0ZXJBbGxDbG9zZWQoKS5waXBlKHN0YXJ0V2l0aCh1bmRlZmluZWQpKSxcbiAgKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9vdmVybGF5OiBPdmVybGF5LFxuICAgIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcixcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERFRkFVTFRfRElBTE9HX0NPTkZJRykgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM6IERpYWxvZ0NvbmZpZyxcbiAgICBAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwcml2YXRlIF9wYXJlbnREaWFsb2c6IERpYWxvZyxcbiAgICBwcml2YXRlIF9vdmVybGF5Q29udGFpbmVyOiBPdmVybGF5Q29udGFpbmVyLFxuICAgIEBJbmplY3QoRElBTE9HX1NDUk9MTF9TVFJBVEVHWSkgc2Nyb2xsU3RyYXRlZ3k6IGFueSxcbiAgKSB7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kgPSBzY3JvbGxTdHJhdGVneTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyBhIG1vZGFsIGRpYWxvZyBjb250YWluaW5nIHRoZSBnaXZlbiBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBjb21wb25lbnQgVHlwZSBvZiB0aGUgY29tcG9uZW50IHRvIGxvYWQgaW50byB0aGUgZGlhbG9nLlxuICAgKiBAcGFyYW0gY29uZmlnIEV4dHJhIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBuZXdseS1vcGVuZWQgZGlhbG9nLlxuICAgKi9cbiAgb3BlbjxSID0gdW5rbm93biwgRCA9IHVua25vd24sIEMgPSB1bmtub3duPihcbiAgICBjb21wb25lbnQ6IENvbXBvbmVudFR5cGU8Qz4sXG4gICAgY29uZmlnPzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICk6IERpYWxvZ1JlZjxSLCBDPjtcblxuICAvKipcbiAgICogT3BlbnMgYSBtb2RhbCBkaWFsb2cgY29udGFpbmluZyB0aGUgZ2l2ZW4gdGVtcGxhdGUuXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZVJlZiB0byBpbnN0YW50aWF0ZSBhcyB0aGUgZGlhbG9nIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBjb25maWcgRXh0cmEgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgKiBAcmV0dXJucyBSZWZlcmVuY2UgdG8gdGhlIG5ld2x5LW9wZW5lZCBkaWFsb2cuXG4gICAqL1xuICBvcGVuPFIgPSB1bmtub3duLCBEID0gdW5rbm93biwgQyA9IHVua25vd24+KFxuICAgIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxDPixcbiAgICBjb25maWc/OiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgKTogRGlhbG9nUmVmPFIsIEM+O1xuXG4gIG9wZW48UiA9IHVua25vd24sIEQgPSB1bmtub3duLCBDID0gdW5rbm93bj4oXG4gICAgY29tcG9uZW50T3JUZW1wbGF0ZVJlZjogQ29tcG9uZW50VHlwZTxDPiB8IFRlbXBsYXRlUmVmPEM+LFxuICAgIGNvbmZpZz86IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICApOiBEaWFsb2dSZWY8UiwgQz47XG5cbiAgb3BlbjxSID0gdW5rbm93biwgRCA9IHVua25vd24sIEMgPSB1bmtub3duPihcbiAgICBjb21wb25lbnRPclRlbXBsYXRlUmVmOiBDb21wb25lbnRUeXBlPEM+IHwgVGVtcGxhdGVSZWY8Qz4sXG4gICAgY29uZmlnPzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICk6IERpYWxvZ1JlZjxSLCBDPiB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSAodGhpcy5fZGVmYXVsdE9wdGlvbnMgfHwgbmV3IERpYWxvZ0NvbmZpZygpKSBhcyBEaWFsb2dDb25maWc8XG4gICAgICBELFxuICAgICAgRGlhbG9nUmVmPFIsIEM+XG4gICAgPjtcbiAgICBjb25maWcgPSB7Li4uZGVmYXVsdHMsIC4uLmNvbmZpZ307XG4gICAgY29uZmlnLmlkID0gY29uZmlnLmlkIHx8IGBjZGstZGlhbG9nLSR7dW5pcXVlSWQrK31gO1xuXG4gICAgaWYgKFxuICAgICAgY29uZmlnLmlkICYmXG4gICAgICB0aGlzLmdldERpYWxvZ0J5SWQoY29uZmlnLmlkKSAmJlxuICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSlcbiAgICApIHtcbiAgICAgIHRocm93IEVycm9yKGBEaWFsb2cgd2l0aCBpZCBcIiR7Y29uZmlnLmlkfVwiIGV4aXN0cyBhbHJlYWR5LiBUaGUgZGlhbG9nIGlkIG11c3QgYmUgdW5pcXVlLmApO1xuICAgIH1cblxuICAgIGNvbnN0IG92ZXJsYXlDb25maWcgPSB0aGlzLl9nZXRPdmVybGF5Q29uZmlnKGNvbmZpZyk7XG4gICAgY29uc3Qgb3ZlcmxheVJlZiA9IHRoaXMuX292ZXJsYXkuY3JlYXRlKG92ZXJsYXlDb25maWcpO1xuICAgIGNvbnN0IGRpYWxvZ1JlZiA9IG5ldyBEaWFsb2dSZWYob3ZlcmxheVJlZiwgY29uZmlnKTtcbiAgICBjb25zdCBkaWFsb2dDb250YWluZXIgPSB0aGlzLl9hdHRhY2hDb250YWluZXIob3ZlcmxheVJlZiwgZGlhbG9nUmVmLCBjb25maWcpO1xuXG4gICAgKGRpYWxvZ1JlZiBhcyB7Y29udGFpbmVySW5zdGFuY2U6IEJhc2VQb3J0YWxPdXRsZXR9KS5jb250YWluZXJJbnN0YW5jZSA9IGRpYWxvZ0NvbnRhaW5lcjtcbiAgICB0aGlzLl9hdHRhY2hEaWFsb2dDb250ZW50KGNvbXBvbmVudE9yVGVtcGxhdGVSZWYsIGRpYWxvZ1JlZiwgZGlhbG9nQ29udGFpbmVyLCBjb25maWcpO1xuXG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZGlhbG9nIHRoYXQgd2UncmUgb3BlbmluZywgaGlkZSBhbGwgdGhlIG5vbi1vdmVybGF5IGNvbnRlbnQuXG4gICAgaWYgKCF0aGlzLm9wZW5EaWFsb2dzLmxlbmd0aCkge1xuICAgICAgdGhpcy5faGlkZU5vbkRpYWxvZ0NvbnRlbnRGcm9tQXNzaXN0aXZlVGVjaG5vbG9neSgpO1xuICAgIH1cblxuICAgICh0aGlzLm9wZW5EaWFsb2dzIGFzIERpYWxvZ1JlZjxSLCBDPltdKS5wdXNoKGRpYWxvZ1JlZik7XG4gICAgZGlhbG9nUmVmLmNsb3NlZC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fcmVtb3ZlT3BlbkRpYWxvZyhkaWFsb2dSZWYsIHRydWUpKTtcbiAgICB0aGlzLmFmdGVyT3BlbmVkLm5leHQoZGlhbG9nUmVmKTtcblxuICAgIHJldHVybiBkaWFsb2dSZWY7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIGFsbCBvZiB0aGUgY3VycmVudGx5LW9wZW4gZGlhbG9ncy5cbiAgICovXG4gIGNsb3NlQWxsKCk6IHZvaWQge1xuICAgIHJldmVyc2VGb3JFYWNoKHRoaXMub3BlbkRpYWxvZ3MsIGRpYWxvZyA9PiBkaWFsb2cuY2xvc2UoKSk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgYW4gb3BlbiBkaWFsb2cgYnkgaXRzIGlkLlxuICAgKiBAcGFyYW0gaWQgSUQgdG8gdXNlIHdoZW4gbG9va2luZyB1cCB0aGUgZGlhbG9nLlxuICAgKi9cbiAgZ2V0RGlhbG9nQnlJZDxSLCBDPihpZDogc3RyaW5nKTogRGlhbG9nUmVmPFIsIEM+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5vcGVuRGlhbG9ncy5maW5kKGRpYWxvZyA9PiBkaWFsb2cuaWQgPT09IGlkKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIE1ha2Ugb25lIHBhc3Mgb3ZlciBhbGwgdGhlIGRpYWxvZ3MgdGhhdCBuZWVkIHRvIGJlIHVudHJhY2tlZCwgYnV0IHNob3VsZCBub3QgYmUgY2xvc2VkLiBXZVxuICAgIC8vIHdhbnQgdG8gc3RvcCB0cmFja2luZyB0aGUgb3BlbiBkaWFsb2cgZXZlbiBpZiBpdCBoYXNuJ3QgYmVlbiBjbG9zZWQsIGJlY2F1c2UgdGhlIHRyYWNraW5nXG4gICAgLy8gZGV0ZXJtaW5lcyB3aGVuIGBhcmlhLWhpZGRlbmAgaXMgcmVtb3ZlZCBmcm9tIGVsZW1lbnRzIG91dHNpZGUgdGhlIGRpYWxvZy5cbiAgICByZXZlcnNlRm9yRWFjaCh0aGlzLl9vcGVuRGlhbG9nc0F0VGhpc0xldmVsLCBkaWFsb2cgPT4ge1xuICAgICAgLy8gQ2hlY2sgZm9yIGBmYWxzZWAgc3BlY2lmaWNhbGx5IHNpbmNlIHdlIHdhbnQgYHVuZGVmaW5lZGAgdG8gYmUgaW50ZXJwcmV0ZWQgYXMgYHRydWVgLlxuICAgICAgaWYgKGRpYWxvZy5jb25maWcuY2xvc2VPbkRlc3Ryb3kgPT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZU9wZW5EaWFsb2coZGlhbG9nLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBNYWtlIGEgc2Vjb25kIHBhc3MgYW5kIGNsb3NlIHRoZSByZW1haW5pbmcgZGlhbG9ncy4gV2UgZG8gdGhpcyBzZWNvbmQgcGFzcyBpbiBvcmRlciB0b1xuICAgIC8vIGNvcnJlY3RseSBkaXNwYXRjaCB0aGUgYGFmdGVyQWxsQ2xvc2VkYCBldmVudCBpbiBjYXNlIHdlIGhhdmUgYSBtaXhlZCBhcnJheSBvZiBkaWFsb2dzXG4gICAgLy8gdGhhdCBzaG91bGQgYmUgY2xvc2VkIGFuZCBkaWFsb2dzIHRoYXQgc2hvdWxkIG5vdC5cbiAgICByZXZlcnNlRm9yRWFjaCh0aGlzLl9vcGVuRGlhbG9nc0F0VGhpc0xldmVsLCBkaWFsb2cgPT4gZGlhbG9nLmNsb3NlKCkpO1xuXG4gICAgdGhpcy5fYWZ0ZXJBbGxDbG9zZWRBdFRoaXNMZXZlbC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2FmdGVyT3BlbmVkQXRUaGlzTGV2ZWwuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vcGVuRGlhbG9nc0F0VGhpc0xldmVsID0gW107XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5IGNvbmZpZyBmcm9tIGEgZGlhbG9nIGNvbmZpZy5cbiAgICogQHBhcmFtIGNvbmZpZyBUaGUgZGlhbG9nIGNvbmZpZ3VyYXRpb24uXG4gICAqIEByZXR1cm5zIFRoZSBvdmVybGF5IGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Q29uZmlnPEQsIFI+KGNvbmZpZzogRGlhbG9nQ29uZmlnPEQsIFI+KTogT3ZlcmxheUNvbmZpZyB7XG4gICAgY29uc3Qgc3RhdGUgPSBuZXcgT3ZlcmxheUNvbmZpZyh7XG4gICAgICBwb3NpdGlvblN0cmF0ZWd5OlxuICAgICAgICBjb25maWcucG9zaXRpb25TdHJhdGVneSB8fFxuICAgICAgICB0aGlzLl9vdmVybGF5LnBvc2l0aW9uKCkuZ2xvYmFsKCkuY2VudGVySG9yaXpvbnRhbGx5KCkuY2VudGVyVmVydGljYWxseSgpLFxuICAgICAgc2Nyb2xsU3RyYXRlZ3k6IGNvbmZpZy5zY3JvbGxTdHJhdGVneSB8fCB0aGlzLl9zY3JvbGxTdHJhdGVneSgpLFxuICAgICAgcGFuZWxDbGFzczogY29uZmlnLnBhbmVsQ2xhc3MsXG4gICAgICBoYXNCYWNrZHJvcDogY29uZmlnLmhhc0JhY2tkcm9wLFxuICAgICAgZGlyZWN0aW9uOiBjb25maWcuZGlyZWN0aW9uLFxuICAgICAgbWluV2lkdGg6IGNvbmZpZy5taW5XaWR0aCxcbiAgICAgIG1pbkhlaWdodDogY29uZmlnLm1pbkhlaWdodCxcbiAgICAgIG1heFdpZHRoOiBjb25maWcubWF4V2lkdGgsXG4gICAgICBtYXhIZWlnaHQ6IGNvbmZpZy5tYXhIZWlnaHQsXG4gICAgICB3aWR0aDogY29uZmlnLndpZHRoLFxuICAgICAgaGVpZ2h0OiBjb25maWcuaGVpZ2h0LFxuICAgICAgZGlzcG9zZU9uTmF2aWdhdGlvbjogY29uZmlnLmNsb3NlT25OYXZpZ2F0aW9uLFxuICAgIH0pO1xuXG4gICAgaWYgKGNvbmZpZy5iYWNrZHJvcENsYXNzKSB7XG4gICAgICBzdGF0ZS5iYWNrZHJvcENsYXNzID0gY29uZmlnLmJhY2tkcm9wQ2xhc3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgZGlhbG9nIGNvbnRhaW5lciB0byBhIGRpYWxvZydzIGFscmVhZHktY3JlYXRlZCBvdmVybGF5LlxuICAgKiBAcGFyYW0gb3ZlcmxheSBSZWZlcmVuY2UgdG8gdGhlIGRpYWxvZydzIHVuZGVybHlpbmcgb3ZlcmxheS5cbiAgICogQHBhcmFtIGNvbmZpZyBUaGUgZGlhbG9nIGNvbmZpZ3VyYXRpb24uXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSByZXNvbHZpbmcgdG8gYSBDb21wb25lbnRSZWYgZm9yIHRoZSBhdHRhY2hlZCBjb250YWluZXIuXG4gICAqL1xuICBwcml2YXRlIF9hdHRhY2hDb250YWluZXI8UiwgRCwgQz4oXG4gICAgb3ZlcmxheTogT3ZlcmxheVJlZixcbiAgICBkaWFsb2dSZWY6IERpYWxvZ1JlZjxSLCBDPixcbiAgICBjb25maWc6IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICApOiBCYXNlUG9ydGFsT3V0bGV0IHtcbiAgICBjb25zdCB1c2VySW5qZWN0b3IgPSBjb25maWcuaW5qZWN0b3IgPz8gY29uZmlnLnZpZXdDb250YWluZXJSZWY/LmluamVjdG9yO1xuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAgICAgIHtwcm92aWRlOiBEaWFsb2dDb25maWcsIHVzZVZhbHVlOiBjb25maWd9LFxuICAgICAge3Byb3ZpZGU6IERpYWxvZ1JlZiwgdXNlVmFsdWU6IGRpYWxvZ1JlZn0sXG4gICAgICB7cHJvdmlkZTogT3ZlcmxheVJlZiwgdXNlVmFsdWU6IG92ZXJsYXl9LFxuICAgIF07XG4gICAgbGV0IGNvbnRhaW5lclR5cGU6IFR5cGU8QmFzZVBvcnRhbE91dGxldD47XG5cbiAgICBpZiAoY29uZmlnLmNvbnRhaW5lcikge1xuICAgICAgaWYgKHR5cGVvZiBjb25maWcuY29udGFpbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnRhaW5lclR5cGUgPSBjb25maWcuY29udGFpbmVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyVHlwZSA9IGNvbmZpZy5jb250YWluZXIudHlwZTtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2goLi4uY29uZmlnLmNvbnRhaW5lci5wcm92aWRlcnMoY29uZmlnKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRhaW5lclR5cGUgPSBDZGtEaWFsb2dDb250YWluZXI7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyUG9ydGFsID0gbmV3IENvbXBvbmVudFBvcnRhbChcbiAgICAgIGNvbnRhaW5lclR5cGUsXG4gICAgICBjb25maWcudmlld0NvbnRhaW5lclJlZixcbiAgICAgIEluamVjdG9yLmNyZWF0ZSh7cGFyZW50OiB1c2VySW5qZWN0b3IgfHwgdGhpcy5faW5qZWN0b3IsIHByb3ZpZGVyc30pLFxuICAgICAgY29uZmlnLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICApO1xuICAgIGNvbnN0IGNvbnRhaW5lclJlZiA9IG92ZXJsYXkuYXR0YWNoKGNvbnRhaW5lclBvcnRhbCk7XG5cbiAgICByZXR1cm4gY29udGFpbmVyUmVmLmluc3RhbmNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIHRoZSB1c2VyLXByb3ZpZGVkIGNvbXBvbmVudCB0byB0aGUgYWxyZWFkeS1jcmVhdGVkIGRpYWxvZyBjb250YWluZXIuXG4gICAqIEBwYXJhbSBjb21wb25lbnRPclRlbXBsYXRlUmVmIFRoZSB0eXBlIG9mIGNvbXBvbmVudCBiZWluZyBsb2FkZWQgaW50byB0aGUgZGlhbG9nLFxuICAgKiAgICAgb3IgYSBUZW1wbGF0ZVJlZiB0byBpbnN0YW50aWF0ZSBhcyB0aGUgY29udGVudC5cbiAgICogQHBhcmFtIGRpYWxvZ1JlZiBSZWZlcmVuY2UgdG8gdGhlIGRpYWxvZyBiZWluZyBvcGVuZWQuXG4gICAqIEBwYXJhbSBkaWFsb2dDb250YWluZXIgQ29tcG9uZW50IHRoYXQgaXMgZ29pbmcgdG8gd3JhcCB0aGUgZGlhbG9nIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiB1c2VkIHRvIG9wZW4gdGhlIGRpYWxvZy5cbiAgICovXG4gIHByaXZhdGUgX2F0dGFjaERpYWxvZ0NvbnRlbnQ8UiwgRCwgQz4oXG4gICAgY29tcG9uZW50T3JUZW1wbGF0ZVJlZjogQ29tcG9uZW50VHlwZTxDPiB8IFRlbXBsYXRlUmVmPEM+LFxuICAgIGRpYWxvZ1JlZjogRGlhbG9nUmVmPFIsIEM+LFxuICAgIGRpYWxvZ0NvbnRhaW5lcjogQmFzZVBvcnRhbE91dGxldCxcbiAgICBjb25maWc6IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICApIHtcbiAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX2NyZWF0ZUluamVjdG9yKGNvbmZpZywgZGlhbG9nUmVmLCBkaWFsb2dDb250YWluZXIpO1xuXG4gICAgaWYgKGNvbXBvbmVudE9yVGVtcGxhdGVSZWYgaW5zdGFuY2VvZiBUZW1wbGF0ZVJlZikge1xuICAgICAgbGV0IGNvbnRleHQ6IGFueSA9IHskaW1wbGljaXQ6IGNvbmZpZy5kYXRhLCBkaWFsb2dSZWZ9O1xuXG4gICAgICBpZiAoY29uZmlnLnRlbXBsYXRlQ29udGV4dCkge1xuICAgICAgICBjb250ZXh0ID0ge1xuICAgICAgICAgIC4uLmNvbnRleHQsXG4gICAgICAgICAgLi4uKHR5cGVvZiBjb25maWcudGVtcGxhdGVDb250ZXh0ID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgICA/IGNvbmZpZy50ZW1wbGF0ZUNvbnRleHQoKVxuICAgICAgICAgICAgOiBjb25maWcudGVtcGxhdGVDb250ZXh0KSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZGlhbG9nQ29udGFpbmVyLmF0dGFjaFRlbXBsYXRlUG9ydGFsKFxuICAgICAgICBuZXcgVGVtcGxhdGVQb3J0YWw8Qz4oY29tcG9uZW50T3JUZW1wbGF0ZVJlZiwgbnVsbCEsIGNvbnRleHQsIGluamVjdG9yKSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNvbnRlbnRSZWYgPSBkaWFsb2dDb250YWluZXIuYXR0YWNoQ29tcG9uZW50UG9ydGFsPEM+KFxuICAgICAgICBuZXcgQ29tcG9uZW50UG9ydGFsKFxuICAgICAgICAgIGNvbXBvbmVudE9yVGVtcGxhdGVSZWYsXG4gICAgICAgICAgY29uZmlnLnZpZXdDb250YWluZXJSZWYsXG4gICAgICAgICAgaW5qZWN0b3IsXG4gICAgICAgICAgY29uZmlnLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgICAoZGlhbG9nUmVmIGFzIHtjb21wb25lbnRJbnN0YW5jZTogQ30pLmNvbXBvbmVudEluc3RhbmNlID0gY29udGVudFJlZi5pbnN0YW5jZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGN1c3RvbSBpbmplY3RvciB0byBiZSB1c2VkIGluc2lkZSB0aGUgZGlhbG9nLiBUaGlzIGFsbG93cyBhIGNvbXBvbmVudCBsb2FkZWQgaW5zaWRlXG4gICAqIG9mIGEgZGlhbG9nIHRvIGNsb3NlIGl0c2VsZiBhbmQsIG9wdGlvbmFsbHksIHRvIHJldHVybiBhIHZhbHVlLlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZyBvYmplY3QgdGhhdCBpcyB1c2VkIHRvIGNvbnN0cnVjdCB0aGUgZGlhbG9nLlxuICAgKiBAcGFyYW0gZGlhbG9nUmVmIFJlZmVyZW5jZSB0byB0aGUgZGlhbG9nIGJlaW5nIG9wZW5lZC5cbiAgICogQHBhcmFtIGRpYWxvZ0NvbnRhaW5lciBDb21wb25lbnQgdGhhdCBpcyBnb2luZyB0byB3cmFwIHRoZSBkaWFsb2cgY29udGVudC5cbiAgICogQHJldHVybnMgVGhlIGN1c3RvbSBpbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGluc2lkZSB0aGUgZGlhbG9nLlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlSW5qZWN0b3I8UiwgRCwgQz4oXG4gICAgY29uZmlnOiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgICBkaWFsb2dSZWY6IERpYWxvZ1JlZjxSLCBDPixcbiAgICBkaWFsb2dDb250YWluZXI6IEJhc2VQb3J0YWxPdXRsZXQsXG4gICk6IEluamVjdG9yIHtcbiAgICBjb25zdCB1c2VySW5qZWN0b3IgPSBjb25maWcgJiYgY29uZmlnLnZpZXdDb250YWluZXJSZWYgJiYgY29uZmlnLnZpZXdDb250YWluZXJSZWYuaW5qZWN0b3I7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IERJQUxPR19EQVRBLCB1c2VWYWx1ZTogY29uZmlnLmRhdGF9LFxuICAgICAge3Byb3ZpZGU6IERpYWxvZ1JlZiwgdXNlVmFsdWU6IGRpYWxvZ1JlZn0sXG4gICAgXTtcblxuICAgIGlmIChjb25maWcucHJvdmlkZXJzKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbmZpZy5wcm92aWRlcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyhkaWFsb2dSZWYsIGNvbmZpZywgZGlhbG9nQ29udGFpbmVyKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm92aWRlcnMucHVzaCguLi5jb25maWcucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBjb25maWcuZGlyZWN0aW9uICYmXG4gICAgICAoIXVzZXJJbmplY3RvciB8fFxuICAgICAgICAhdXNlckluamVjdG9yLmdldDxEaXJlY3Rpb25hbGl0eSB8IG51bGw+KERpcmVjdGlvbmFsaXR5LCBudWxsLCBJbmplY3RGbGFncy5PcHRpb25hbCkpXG4gICAgKSB7XG4gICAgICBwcm92aWRlcnMucHVzaCh7XG4gICAgICAgIHByb3ZpZGU6IERpcmVjdGlvbmFsaXR5LFxuICAgICAgICB1c2VWYWx1ZToge3ZhbHVlOiBjb25maWcuZGlyZWN0aW9uLCBjaGFuZ2U6IG9ic2VydmFibGVPZigpfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBJbmplY3Rvci5jcmVhdGUoe3BhcmVudDogY29uZmlnLmluamVjdG9yIHx8IHVzZXJJbmplY3RvciB8fCB0aGlzLl9pbmplY3RvciwgcHJvdmlkZXJzfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGRpYWxvZyBmcm9tIHRoZSBhcnJheSBvZiBvcGVuIGRpYWxvZ3MuXG4gICAqIEBwYXJhbSBkaWFsb2dSZWYgRGlhbG9nIHRvIGJlIHJlbW92ZWQuXG4gICAqIEBwYXJhbSBlbWl0RXZlbnQgV2hldGhlciB0byBlbWl0IGFuIGV2ZW50IGlmIHRoaXMgaXMgdGhlIGxhc3QgZGlhbG9nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlT3BlbkRpYWxvZzxSLCBDPihkaWFsb2dSZWY6IERpYWxvZ1JlZjxSLCBDPiwgZW1pdEV2ZW50OiBib29sZWFuKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wZW5EaWFsb2dzLmluZGV4T2YoZGlhbG9nUmVmKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAodGhpcy5vcGVuRGlhbG9ncyBhcyBEaWFsb2dSZWY8UiwgQz5bXSkuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgLy8gSWYgYWxsIHRoZSBkaWFsb2dzIHdlcmUgY2xvc2VkLCByZW1vdmUvcmVzdG9yZSB0aGUgYGFyaWEtaGlkZGVuYFxuICAgICAgLy8gdG8gYSB0aGUgc2libGluZ3MgYW5kIGVtaXQgdG8gdGhlIGBhZnRlckFsbENsb3NlZGAgc3RyZWFtLlxuICAgICAgaWYgKCF0aGlzLm9wZW5EaWFsb2dzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuZm9yRWFjaCgocHJldmlvdXNWYWx1ZSwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBwcmV2aW91c1ZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuY2xlYXIoKTtcblxuICAgICAgICBpZiAoZW1pdEV2ZW50KSB7XG4gICAgICAgICAgdGhpcy5fZ2V0QWZ0ZXJBbGxDbG9zZWQoKS5uZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSGlkZXMgYWxsIG9mIHRoZSBjb250ZW50IHRoYXQgaXNuJ3QgYW4gb3ZlcmxheSBmcm9tIGFzc2lzdGl2ZSB0ZWNobm9sb2d5LiAqL1xuICBwcml2YXRlIF9oaWRlTm9uRGlhbG9nQ29udGVudEZyb21Bc3Npc3RpdmVUZWNobm9sb2d5KCkge1xuICAgIGNvbnN0IG92ZXJsYXlDb250YWluZXIgPSB0aGlzLl9vdmVybGF5Q29udGFpbmVyLmdldENvbnRhaW5lckVsZW1lbnQoKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBvdmVybGF5IGNvbnRhaW5lciBpcyBhdHRhY2hlZCB0byB0aGUgRE9NLlxuICAgIGlmIChvdmVybGF5Q29udGFpbmVyLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gb3ZlcmxheUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LmNoaWxkcmVuO1xuXG4gICAgICBmb3IgKGxldCBpID0gc2libGluZ3MubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcbiAgICAgICAgY29uc3Qgc2libGluZyA9IHNpYmxpbmdzW2ldO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBzaWJsaW5nICE9PSBvdmVybGF5Q29udGFpbmVyICYmXG4gICAgICAgICAgc2libGluZy5ub2RlTmFtZSAhPT0gJ1NDUklQVCcgJiZcbiAgICAgICAgICBzaWJsaW5nLm5vZGVOYW1lICE9PSAnU1RZTEUnICYmXG4gICAgICAgICAgIXNpYmxpbmcuaGFzQXR0cmlidXRlKCdhcmlhLWxpdmUnKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuc2V0KHNpYmxpbmcsIHNpYmxpbmcuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICAgICAgICBzaWJsaW5nLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QWZ0ZXJBbGxDbG9zZWQoKTogU3ViamVjdDx2b2lkPiB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5fcGFyZW50RGlhbG9nO1xuICAgIHJldHVybiBwYXJlbnQgPyBwYXJlbnQuX2dldEFmdGVyQWxsQ2xvc2VkKCkgOiB0aGlzLl9hZnRlckFsbENsb3NlZEF0VGhpc0xldmVsO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBjYWxsYmFjayBhZ2FpbnN0IGFsbCBlbGVtZW50cyBpbiBhbiBhcnJheSB3aGlsZSBpdGVyYXRpbmcgaW4gcmV2ZXJzZS5cbiAqIFVzZWZ1bCBpZiB0aGUgYXJyYXkgaXMgYmVpbmcgbW9kaWZpZWQgYXMgaXQgaXMgYmVpbmcgaXRlcmF0ZWQuXG4gKi9cbmZ1bmN0aW9uIHJldmVyc2VGb3JFYWNoPFQ+KGl0ZW1zOiBUW10gfCByZWFkb25seSBUW10sIGNhbGxiYWNrOiAoY3VycmVudDogVCkgPT4gdm9pZCkge1xuICBsZXQgaSA9IGl0ZW1zLmxlbmd0aDtcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgY2FsbGJhY2soaXRlbXNbaV0pO1xuICB9XG59XG4iXX0=