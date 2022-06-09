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
        return Injector.create({ parent: userInjector || this._injector, providers });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9kaWFsb2cvZGlhbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxXQUFXLEVBQ1gsVUFBVSxFQUNWLFFBQVEsRUFJUixXQUFXLEVBQ1gsTUFBTSxFQUNOLFFBQVEsRUFDUixRQUFRLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFtQixlQUFlLEVBQUUsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEYsT0FBTyxFQUFDLEVBQUUsSUFBSSxZQUFZLEVBQWMsT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNwRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUVMLE9BQU8sRUFDUCxVQUFVLEVBQ1YsYUFBYSxFQUViLGdCQUFnQixHQUNqQixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV6QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDOUYsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7QUFFdEQsd0NBQXdDO0FBQ3hDLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztBQUdqQixNQUFNLE9BQU8sTUFBTTtJQTJCakIsWUFDVSxRQUFpQixFQUNqQixTQUFtQixFQUN3QixlQUE2QixFQUNoRCxhQUFxQixFQUM3QyxpQkFBbUMsRUFDWCxjQUFtQjtRQUwzQyxhQUFRLEdBQVIsUUFBUSxDQUFTO1FBQ2pCLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDd0Isb0JBQWUsR0FBZixlQUFlLENBQWM7UUFDaEQsa0JBQWEsR0FBYixhQUFhLENBQVE7UUFDN0Msc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQS9CckMsNEJBQXVCLEdBQTBCLEVBQUUsQ0FBQztRQUMzQywrQkFBMEIsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBQ2pELDRCQUF1QixHQUFHLElBQUksT0FBTyxFQUFhLENBQUM7UUFDNUQsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7UUFhaEU7OztXQUdHO1FBQ00sbUJBQWMsR0FBcUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUNyRCxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU07WUFDckIsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUMzQixDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUN6RCxDQUFDO1FBVUEsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7SUFDeEMsQ0FBQztJQTdCRCxpREFBaUQ7SUFDakQsSUFBSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDO0lBQzVGLENBQUM7SUFFRCx1REFBdUQ7SUFDdkQsSUFBSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDO0lBQzVGLENBQUM7SUFrREQsSUFBSSxDQUNGLHNCQUF5RCxFQUN6RCxNQUF5QztRQUV6QyxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxZQUFZLEVBQUUsQ0FHM0QsQ0FBQztRQUNGLE1BQU0sR0FBRyxFQUFDLEdBQUcsUUFBUSxFQUFFLEdBQUcsTUFBTSxFQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxJQUFJLGNBQWMsUUFBUSxFQUFFLEVBQUUsQ0FBQztRQUVwRCxJQUNFLE1BQU0sQ0FBQyxFQUFFO1lBQ1QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzdCLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxFQUMvQztZQUNBLE1BQU0sS0FBSyxDQUFDLG1CQUFtQixNQUFNLENBQUMsRUFBRSxpREFBaUQsQ0FBQyxDQUFDO1NBQzVGO1FBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU1RSxTQUFtRCxDQUFDLGlCQUFpQixHQUFHLGVBQWUsQ0FBQztRQUN6RixJQUFJLENBQUMsb0JBQW9CLENBQUMsc0JBQXNCLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUV0RixvRkFBb0Y7UUFDcEYsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO1lBQzVCLElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxDQUFDO1NBQ3JEO1FBRUEsSUFBSSxDQUFDLFdBQWlDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVqQyxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsYUFBYSxDQUFPLEVBQVU7UUFDNUIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELFdBQVc7UUFDVCw2RkFBNkY7UUFDN0YsNEZBQTRGO1FBQzVGLDZFQUE2RTtRQUM3RSxjQUFjLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ3BELHdGQUF3RjtZQUN4RixJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxLQUFLLEtBQUssRUFBRTtnQkFDMUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgseUZBQXlGO1FBQ3pGLHlGQUF5RjtRQUN6RixxREFBcUQ7UUFDckQsY0FBYyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLGlCQUFpQixDQUFPLE1BQTBCO1FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksYUFBYSxDQUFDO1lBQzlCLGdCQUFnQixFQUNkLE1BQU0sQ0FBQyxnQkFBZ0I7Z0JBQ3ZCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRTtZQUMzRSxjQUFjLEVBQUUsTUFBTSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQy9ELFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtZQUM3QixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7WUFDL0IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1lBQzNCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtZQUN6QixTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7WUFDM0IsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQ3pCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztZQUMzQixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7U0FDOUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxNQUFNLENBQUMsYUFBYSxFQUFFO1lBQ3hCLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztTQUM1QztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssZ0JBQWdCLENBQ3RCLE9BQW1CLEVBQ25CLFNBQTBCLEVBQzFCLE1BQXdDO1FBRXhDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQztRQUMxRSxNQUFNLFNBQVMsR0FBcUI7WUFDbEMsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUM7WUFDekMsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUM7WUFDekMsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUM7U0FDekMsQ0FBQztRQUNGLElBQUksYUFBcUMsQ0FBQztRQUUxQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7WUFDcEIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFO2dCQUMxQyxhQUFhLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQzthQUNsQztpQkFBTTtnQkFDTCxhQUFhLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQ3RDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2FBQ3ZEO1NBQ0Y7YUFBTTtZQUNMLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQztTQUNwQztRQUVELE1BQU0sZUFBZSxHQUFHLElBQUksZUFBZSxDQUN6QyxhQUFhLEVBQ2IsTUFBTSxDQUFDLGdCQUFnQixFQUN2QixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUMsTUFBTSxFQUFFLFlBQVksSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxDQUFDLEVBQ3BFLE1BQU0sQ0FBQyx3QkFBd0IsQ0FDaEMsQ0FBQztRQUNGLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFckQsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDO0lBQy9CLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ssb0JBQW9CLENBQzFCLHNCQUF5RCxFQUN6RCxTQUEwQixFQUMxQixlQUFpQyxFQUNqQyxNQUF3QztRQUV4QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFMUUsSUFBSSxzQkFBc0IsWUFBWSxXQUFXLEVBQUU7WUFDakQsSUFBSSxPQUFPLEdBQVEsRUFBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsQ0FBQztZQUV2RCxJQUFJLE1BQU0sQ0FBQyxlQUFlLEVBQUU7Z0JBQzFCLE9BQU8sR0FBRztvQkFDUixHQUFHLE9BQU87b0JBQ1YsR0FBRyxDQUFDLE9BQU8sTUFBTSxDQUFDLGVBQWUsS0FBSyxVQUFVO3dCQUM5QyxDQUFDLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRTt3QkFDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7aUJBQzVCLENBQUM7YUFDSDtZQUVELGVBQWUsQ0FBQyxvQkFBb0IsQ0FDbEMsSUFBSSxjQUFjLENBQUksc0JBQXNCLEVBQUUsSUFBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FDeEUsQ0FBQztTQUNIO2FBQU07WUFDTCxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMscUJBQXFCLENBQ3RELElBQUksZUFBZSxDQUNqQixzQkFBc0IsRUFDdEIsTUFBTSxDQUFDLGdCQUFnQixFQUN2QixRQUFRLEVBQ1IsTUFBTSxDQUFDLHdCQUF3QixDQUNoQyxDQUNGLENBQUM7WUFDRCxTQUFvQyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUM7U0FDL0U7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNLLGVBQWUsQ0FDckIsTUFBd0MsRUFDeEMsU0FBMEIsRUFDMUIsZUFBaUM7UUFFakMsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO1FBQzNGLE1BQU0sU0FBUyxHQUFxQjtZQUNsQyxFQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUM7WUFDN0MsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUM7U0FDMUMsQ0FBQztRQUVGLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRTtZQUNwQixJQUFJLE9BQU8sTUFBTSxDQUFDLFNBQVMsS0FBSyxVQUFVLEVBQUU7Z0JBQzFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQzthQUN6RTtpQkFBTTtnQkFDTCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3JDO1NBQ0Y7UUFFRCxJQUNFLE1BQU0sQ0FBQyxTQUFTO1lBQ2hCLENBQUMsQ0FBQyxZQUFZO2dCQUNaLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBd0IsY0FBYyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsRUFDdkY7WUFDQSxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUNiLE9BQU8sRUFBRSxjQUFjO2dCQUN2QixRQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLEVBQUM7YUFDNUQsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBQyxNQUFNLEVBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLGlCQUFpQixDQUFPLFNBQTBCLEVBQUUsU0FBa0I7UUFDNUUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFbEQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDYixJQUFJLENBQUMsV0FBaUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXpELG1FQUFtRTtZQUNuRSw2REFBNkQ7WUFDN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO2dCQUM1QixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxFQUFFO29CQUMxRCxJQUFJLGFBQWEsRUFBRTt3QkFDakIsT0FBTyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7cUJBQ3BEO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUM7cUJBQ3hDO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFakMsSUFBSSxTQUFTLEVBQUU7b0JBQ2IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7aUJBQ2xDO2FBQ0Y7U0FDRjtJQUNILENBQUM7SUFFRCxnRkFBZ0Y7SUFDeEUsNENBQTRDO1FBQ2xELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFFdEUsNERBQTREO1FBQzVELElBQUksZ0JBQWdCLENBQUMsYUFBYSxFQUFFO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7WUFFekQsS0FBSyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFNUIsSUFDRSxPQUFPLEtBQUssZ0JBQWdCO29CQUM1QixPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVE7b0JBQzdCLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTztvQkFDNUIsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUNsQztvQkFDQSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7b0JBQzNFLE9BQU8sQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUM3QzthQUNGO1NBQ0Y7SUFDSCxDQUFDO0lBRU8sa0JBQWtCO1FBQ3hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDbEMsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUM7SUFDaEYsQ0FBQzs7bUdBbFdVLE1BQU0saUVBOEJLLHFCQUFxQiw2QkFDTSxNQUFNLDZFQUU3QyxzQkFBc0I7dUdBakNyQixNQUFNOzJGQUFOLE1BQU07a0JBRGxCLFVBQVU7OzBCQStCTixRQUFROzswQkFBSSxNQUFNOzJCQUFDLHFCQUFxQjs4QkFDTSxNQUFNOzBCQUFwRCxRQUFROzswQkFBSSxRQUFROzswQkFFcEIsTUFBTTsyQkFBQyxzQkFBc0I7O0FBb1VsQzs7O0dBR0c7QUFDSCxTQUFTLGNBQWMsQ0FBSSxLQUF5QixFQUFFLFFBQThCO0lBQ2xGLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFFckIsT0FBTyxDQUFDLEVBQUUsRUFBRTtRQUNWLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgVGVtcGxhdGVSZWYsXG4gIEluamVjdGFibGUsXG4gIEluamVjdG9yLFxuICBPbkRlc3Ryb3ksXG4gIFR5cGUsXG4gIFN0YXRpY1Byb3ZpZGVyLFxuICBJbmplY3RGbGFncyxcbiAgSW5qZWN0LFxuICBPcHRpb25hbCxcbiAgU2tpcFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCYXNlUG9ydGFsT3V0bGV0LCBDb21wb25lbnRQb3J0YWwsIFRlbXBsYXRlUG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7b2YgYXMgb2JzZXJ2YWJsZU9mLCBPYnNlcnZhYmxlLCBTdWJqZWN0LCBkZWZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge0RpYWxvZ1JlZn0gZnJvbSAnLi9kaWFsb2ctcmVmJztcbmltcG9ydCB7RGlhbG9nQ29uZmlnfSBmcm9tICcuL2RpYWxvZy1jb25maWcnO1xuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50VHlwZSxcbiAgT3ZlcmxheSxcbiAgT3ZlcmxheVJlZixcbiAgT3ZlcmxheUNvbmZpZyxcbiAgU2Nyb2xsU3RyYXRlZ3ksXG4gIE92ZXJsYXlDb250YWluZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9vdmVybGF5JztcbmltcG9ydCB7c3RhcnRXaXRofSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7REVGQVVMVF9ESUFMT0dfQ09ORklHLCBESUFMT0dfREFUQSwgRElBTE9HX1NDUk9MTF9TVFJBVEVHWX0gZnJvbSAnLi9kaWFsb2ctaW5qZWN0b3JzJztcbmltcG9ydCB7Q2RrRGlhbG9nQ29udGFpbmVyfSBmcm9tICcuL2RpYWxvZy1jb250YWluZXInO1xuXG4vKiogVW5pcXVlIGlkIGZvciB0aGUgY3JlYXRlZCBkaWFsb2cuICovXG5sZXQgdW5pcXVlSWQgPSAwO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgRGlhbG9nIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfb3BlbkRpYWxvZ3NBdFRoaXNMZXZlbDogRGlhbG9nUmVmPGFueSwgYW55PltdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgX2FmdGVyQWxsQ2xvc2VkQXRUaGlzTGV2ZWwgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9hZnRlck9wZW5lZEF0VGhpc0xldmVsID0gbmV3IFN1YmplY3Q8RGlhbG9nUmVmPigpO1xuICBwcml2YXRlIF9hcmlhSGlkZGVuRWxlbWVudHMgPSBuZXcgTWFwPEVsZW1lbnQsIHN0cmluZyB8IG51bGw+KCk7XG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiAoKSA9PiBTY3JvbGxTdHJhdGVneTtcblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1vcGVuIGRpYWxvZ3MuICovXG4gIGdldCBvcGVuRGlhbG9ncygpOiByZWFkb25seSBEaWFsb2dSZWY8YW55LCBhbnk+W10ge1xuICAgIHJldHVybiB0aGlzLl9wYXJlbnREaWFsb2cgPyB0aGlzLl9wYXJlbnREaWFsb2cub3BlbkRpYWxvZ3MgOiB0aGlzLl9vcGVuRGlhbG9nc0F0VGhpc0xldmVsO1xuICB9XG5cbiAgLyoqIFN0cmVhbSB0aGF0IGVtaXRzIHdoZW4gYSBkaWFsb2cgaGFzIGJlZW4gb3BlbmVkLiAqL1xuICBnZXQgYWZ0ZXJPcGVuZWQoKTogU3ViamVjdDxEaWFsb2dSZWY8YW55LCBhbnk+PiB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmVudERpYWxvZyA/IHRoaXMuX3BhcmVudERpYWxvZy5hZnRlck9wZW5lZCA6IHRoaXMuX2FmdGVyT3BlbmVkQXRUaGlzTGV2ZWw7XG4gIH1cblxuICAvKipcbiAgICogU3RyZWFtIHRoYXQgZW1pdHMgd2hlbiBhbGwgb3BlbiBkaWFsb2cgaGF2ZSBmaW5pc2hlZCBjbG9zaW5nLlxuICAgKiBXaWxsIGVtaXQgb24gc3Vic2NyaWJlIGlmIHRoZXJlIGFyZSBubyBvcGVuIGRpYWxvZ3MgdG8gYmVnaW4gd2l0aC5cbiAgICovXG4gIHJlYWRvbmx5IGFmdGVyQWxsQ2xvc2VkOiBPYnNlcnZhYmxlPHZvaWQ+ID0gZGVmZXIoKCkgPT5cbiAgICB0aGlzLm9wZW5EaWFsb2dzLmxlbmd0aFxuICAgICAgPyB0aGlzLl9nZXRBZnRlckFsbENsb3NlZCgpXG4gICAgICA6IHRoaXMuX2dldEFmdGVyQWxsQ2xvc2VkKCkucGlwZShzdGFydFdpdGgodW5kZWZpbmVkKSksXG4gICk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfb3ZlcmxheTogT3ZlcmxheSxcbiAgICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChERUZBVUxUX0RJQUxPR19DT05GSUcpIHByaXZhdGUgX2RlZmF1bHRPcHRpb25zOiBEaWFsb2dDb25maWcsXG4gICAgQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHJpdmF0ZSBfcGFyZW50RGlhbG9nOiBEaWFsb2csXG4gICAgcHJpdmF0ZSBfb3ZlcmxheUNvbnRhaW5lcjogT3ZlcmxheUNvbnRhaW5lcixcbiAgICBASW5qZWN0KERJQUxPR19TQ1JPTExfU1RSQVRFR1kpIHNjcm9sbFN0cmF0ZWd5OiBhbnksXG4gICkge1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5ID0gc2Nyb2xsU3RyYXRlZ3k7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgYSBtb2RhbCBkaWFsb2cgY29udGFpbmluZyB0aGUgZ2l2ZW4gY29tcG9uZW50LlxuICAgKiBAcGFyYW0gY29tcG9uZW50IFR5cGUgb2YgdGhlIGNvbXBvbmVudCB0byBsb2FkIGludG8gdGhlIGRpYWxvZy5cbiAgICogQHBhcmFtIGNvbmZpZyBFeHRyYSBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAqIEByZXR1cm5zIFJlZmVyZW5jZSB0byB0aGUgbmV3bHktb3BlbmVkIGRpYWxvZy5cbiAgICovXG4gIG9wZW48UiA9IHVua25vd24sIEQgPSB1bmtub3duLCBDID0gdW5rbm93bj4oXG4gICAgY29tcG9uZW50OiBDb21wb25lbnRUeXBlPEM+LFxuICAgIGNvbmZpZz86IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICApOiBEaWFsb2dSZWY8UiwgQz47XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgbW9kYWwgZGlhbG9nIGNvbnRhaW5pbmcgdGhlIGdpdmVuIHRlbXBsYXRlLlxuICAgKiBAcGFyYW0gdGVtcGxhdGUgVGVtcGxhdGVSZWYgdG8gaW5zdGFudGlhdGUgYXMgdGhlIGRpYWxvZyBjb250ZW50LlxuICAgKiBAcGFyYW0gY29uZmlnIEV4dHJhIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICogQHJldHVybnMgUmVmZXJlbmNlIHRvIHRoZSBuZXdseS1vcGVuZWQgZGlhbG9nLlxuICAgKi9cbiAgb3BlbjxSID0gdW5rbm93biwgRCA9IHVua25vd24sIEMgPSB1bmtub3duPihcbiAgICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8Qz4sXG4gICAgY29uZmlnPzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICk6IERpYWxvZ1JlZjxSLCBDPjtcblxuICBvcGVuPFIgPSB1bmtub3duLCBEID0gdW5rbm93biwgQyA9IHVua25vd24+KFxuICAgIGNvbXBvbmVudE9yVGVtcGxhdGVSZWY6IENvbXBvbmVudFR5cGU8Qz4gfCBUZW1wbGF0ZVJlZjxDPixcbiAgICBjb25maWc/OiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgKTogRGlhbG9nUmVmPFIsIEM+O1xuXG4gIG9wZW48UiA9IHVua25vd24sIEQgPSB1bmtub3duLCBDID0gdW5rbm93bj4oXG4gICAgY29tcG9uZW50T3JUZW1wbGF0ZVJlZjogQ29tcG9uZW50VHlwZTxDPiB8IFRlbXBsYXRlUmVmPEM+LFxuICAgIGNvbmZpZz86IERpYWxvZ0NvbmZpZzxELCBEaWFsb2dSZWY8UiwgQz4+LFxuICApOiBEaWFsb2dSZWY8UiwgQz4ge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gKHRoaXMuX2RlZmF1bHRPcHRpb25zIHx8IG5ldyBEaWFsb2dDb25maWcoKSkgYXMgRGlhbG9nQ29uZmlnPFxuICAgICAgRCxcbiAgICAgIERpYWxvZ1JlZjxSLCBDPlxuICAgID47XG4gICAgY29uZmlnID0gey4uLmRlZmF1bHRzLCAuLi5jb25maWd9O1xuICAgIGNvbmZpZy5pZCA9IGNvbmZpZy5pZCB8fCBgY2RrLWRpYWxvZy0ke3VuaXF1ZUlkKyt9YDtcblxuICAgIGlmIChcbiAgICAgIGNvbmZpZy5pZCAmJlxuICAgICAgdGhpcy5nZXREaWFsb2dCeUlkKGNvbmZpZy5pZCkgJiZcbiAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpXG4gICAgKSB7XG4gICAgICB0aHJvdyBFcnJvcihgRGlhbG9nIHdpdGggaWQgXCIke2NvbmZpZy5pZH1cIiBleGlzdHMgYWxyZWFkeS4gVGhlIGRpYWxvZyBpZCBtdXN0IGJlIHVuaXF1ZS5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBvdmVybGF5Q29uZmlnID0gdGhpcy5fZ2V0T3ZlcmxheUNvbmZpZyhjb25maWcpO1xuICAgIGNvbnN0IG92ZXJsYXlSZWYgPSB0aGlzLl9vdmVybGF5LmNyZWF0ZShvdmVybGF5Q29uZmlnKTtcbiAgICBjb25zdCBkaWFsb2dSZWYgPSBuZXcgRGlhbG9nUmVmKG92ZXJsYXlSZWYsIGNvbmZpZyk7XG4gICAgY29uc3QgZGlhbG9nQ29udGFpbmVyID0gdGhpcy5fYXR0YWNoQ29udGFpbmVyKG92ZXJsYXlSZWYsIGRpYWxvZ1JlZiwgY29uZmlnKTtcblxuICAgIChkaWFsb2dSZWYgYXMge2NvbnRhaW5lckluc3RhbmNlOiBCYXNlUG9ydGFsT3V0bGV0fSkuY29udGFpbmVySW5zdGFuY2UgPSBkaWFsb2dDb250YWluZXI7XG4gICAgdGhpcy5fYXR0YWNoRGlhbG9nQ29udGVudChjb21wb25lbnRPclRlbXBsYXRlUmVmLCBkaWFsb2dSZWYsIGRpYWxvZ0NvbnRhaW5lciwgY29uZmlnKTtcblxuICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGRpYWxvZyB0aGF0IHdlJ3JlIG9wZW5pbmcsIGhpZGUgYWxsIHRoZSBub24tb3ZlcmxheSBjb250ZW50LlxuICAgIGlmICghdGhpcy5vcGVuRGlhbG9ncy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2hpZGVOb25EaWFsb2dDb250ZW50RnJvbUFzc2lzdGl2ZVRlY2hub2xvZ3koKTtcbiAgICB9XG5cbiAgICAodGhpcy5vcGVuRGlhbG9ncyBhcyBEaWFsb2dSZWY8UiwgQz5bXSkucHVzaChkaWFsb2dSZWYpO1xuICAgIGRpYWxvZ1JlZi5jbG9zZWQuc3Vic2NyaWJlKCgpID0+IHRoaXMuX3JlbW92ZU9wZW5EaWFsb2coZGlhbG9nUmVmLCB0cnVlKSk7XG4gICAgdGhpcy5hZnRlck9wZW5lZC5uZXh0KGRpYWxvZ1JlZik7XG5cbiAgICByZXR1cm4gZGlhbG9nUmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbGwgb2YgdGhlIGN1cnJlbnRseS1vcGVuIGRpYWxvZ3MuXG4gICAqL1xuICBjbG9zZUFsbCgpOiB2b2lkIHtcbiAgICByZXZlcnNlRm9yRWFjaCh0aGlzLm9wZW5EaWFsb2dzLCBkaWFsb2cgPT4gZGlhbG9nLmNsb3NlKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIGFuIG9wZW4gZGlhbG9nIGJ5IGl0cyBpZC5cbiAgICogQHBhcmFtIGlkIElEIHRvIHVzZSB3aGVuIGxvb2tpbmcgdXAgdGhlIGRpYWxvZy5cbiAgICovXG4gIGdldERpYWxvZ0J5SWQ8UiwgQz4oaWQ6IHN0cmluZyk6IERpYWxvZ1JlZjxSLCBDPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMub3BlbkRpYWxvZ3MuZmluZChkaWFsb2cgPT4gZGlhbG9nLmlkID09PSBpZCk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBNYWtlIG9uZSBwYXNzIG92ZXIgYWxsIHRoZSBkaWFsb2dzIHRoYXQgbmVlZCB0byBiZSB1bnRyYWNrZWQsIGJ1dCBzaG91bGQgbm90IGJlIGNsb3NlZC4gV2VcbiAgICAvLyB3YW50IHRvIHN0b3AgdHJhY2tpbmcgdGhlIG9wZW4gZGlhbG9nIGV2ZW4gaWYgaXQgaGFzbid0IGJlZW4gY2xvc2VkLCBiZWNhdXNlIHRoZSB0cmFja2luZ1xuICAgIC8vIGRldGVybWluZXMgd2hlbiBgYXJpYS1oaWRkZW5gIGlzIHJlbW92ZWQgZnJvbSBlbGVtZW50cyBvdXRzaWRlIHRoZSBkaWFsb2cuXG4gICAgcmV2ZXJzZUZvckVhY2godGhpcy5fb3BlbkRpYWxvZ3NBdFRoaXNMZXZlbCwgZGlhbG9nID0+IHtcbiAgICAgIC8vIENoZWNrIGZvciBgZmFsc2VgIHNwZWNpZmljYWxseSBzaW5jZSB3ZSB3YW50IGB1bmRlZmluZWRgIHRvIGJlIGludGVycHJldGVkIGFzIGB0cnVlYC5cbiAgICAgIGlmIChkaWFsb2cuY29uZmlnLmNsb3NlT25EZXN0cm95ID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLl9yZW1vdmVPcGVuRGlhbG9nKGRpYWxvZywgZmFsc2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTWFrZSBhIHNlY29uZCBwYXNzIGFuZCBjbG9zZSB0aGUgcmVtYWluaW5nIGRpYWxvZ3MuIFdlIGRvIHRoaXMgc2Vjb25kIHBhc3MgaW4gb3JkZXIgdG9cbiAgICAvLyBjb3JyZWN0bHkgZGlzcGF0Y2ggdGhlIGBhZnRlckFsbENsb3NlZGAgZXZlbnQgaW4gY2FzZSB3ZSBoYXZlIGEgbWl4ZWQgYXJyYXkgb2YgZGlhbG9nc1xuICAgIC8vIHRoYXQgc2hvdWxkIGJlIGNsb3NlZCBhbmQgZGlhbG9ncyB0aGF0IHNob3VsZCBub3QuXG4gICAgcmV2ZXJzZUZvckVhY2godGhpcy5fb3BlbkRpYWxvZ3NBdFRoaXNMZXZlbCwgZGlhbG9nID0+IGRpYWxvZy5jbG9zZSgpKTtcblxuICAgIHRoaXMuX2FmdGVyQWxsQ2xvc2VkQXRUaGlzTGV2ZWwuY29tcGxldGUoKTtcbiAgICB0aGlzLl9hZnRlck9wZW5lZEF0VGhpc0xldmVsLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb3BlbkRpYWxvZ3NBdFRoaXNMZXZlbCA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheSBjb25maWcgZnJvbSBhIGRpYWxvZyBjb25maWcuXG4gICAqIEBwYXJhbSBjb25maWcgVGhlIGRpYWxvZyBjb25maWd1cmF0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgb3ZlcmxheSBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheUNvbmZpZzxELCBSPihjb25maWc6IERpYWxvZ0NvbmZpZzxELCBSPik6IE92ZXJsYXlDb25maWcge1xuICAgIGNvbnN0IHN0YXRlID0gbmV3IE92ZXJsYXlDb25maWcoe1xuICAgICAgcG9zaXRpb25TdHJhdGVneTpcbiAgICAgICAgY29uZmlnLnBvc2l0aW9uU3RyYXRlZ3kgfHxcbiAgICAgICAgdGhpcy5fb3ZlcmxheS5wb3NpdGlvbigpLmdsb2JhbCgpLmNlbnRlckhvcml6b250YWxseSgpLmNlbnRlclZlcnRpY2FsbHkoKSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiBjb25maWcuc2Nyb2xsU3RyYXRlZ3kgfHwgdGhpcy5fc2Nyb2xsU3RyYXRlZ3koKSxcbiAgICAgIHBhbmVsQ2xhc3M6IGNvbmZpZy5wYW5lbENsYXNzLFxuICAgICAgaGFzQmFja2Ryb3A6IGNvbmZpZy5oYXNCYWNrZHJvcCxcbiAgICAgIGRpcmVjdGlvbjogY29uZmlnLmRpcmVjdGlvbixcbiAgICAgIG1pbldpZHRoOiBjb25maWcubWluV2lkdGgsXG4gICAgICBtaW5IZWlnaHQ6IGNvbmZpZy5taW5IZWlnaHQsXG4gICAgICBtYXhXaWR0aDogY29uZmlnLm1heFdpZHRoLFxuICAgICAgbWF4SGVpZ2h0OiBjb25maWcubWF4SGVpZ2h0LFxuICAgICAgd2lkdGg6IGNvbmZpZy53aWR0aCxcbiAgICAgIGhlaWdodDogY29uZmlnLmhlaWdodCxcbiAgICAgIGRpc3Bvc2VPbk5hdmlnYXRpb246IGNvbmZpZy5jbG9zZU9uTmF2aWdhdGlvbixcbiAgICB9KTtcblxuICAgIGlmIChjb25maWcuYmFja2Ryb3BDbGFzcykge1xuICAgICAgc3RhdGUuYmFja2Ryb3BDbGFzcyA9IGNvbmZpZy5iYWNrZHJvcENsYXNzO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIGRpYWxvZyBjb250YWluZXIgdG8gYSBkaWFsb2cncyBhbHJlYWR5LWNyZWF0ZWQgb3ZlcmxheS5cbiAgICogQHBhcmFtIG92ZXJsYXkgUmVmZXJlbmNlIHRvIHRoZSBkaWFsb2cncyB1bmRlcmx5aW5nIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBjb25maWcgVGhlIGRpYWxvZyBjb25maWd1cmF0aW9uLlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgcmVzb2x2aW5nIHRvIGEgQ29tcG9uZW50UmVmIGZvciB0aGUgYXR0YWNoZWQgY29udGFpbmVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXR0YWNoQ29udGFpbmVyPFIsIEQsIEM+KFxuICAgIG92ZXJsYXk6IE92ZXJsYXlSZWYsXG4gICAgZGlhbG9nUmVmOiBEaWFsb2dSZWY8UiwgQz4sXG4gICAgY29uZmlnOiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgKTogQmFzZVBvcnRhbE91dGxldCB7XG4gICAgY29uc3QgdXNlckluamVjdG9yID0gY29uZmlnLmluamVjdG9yID8/IGNvbmZpZy52aWV3Q29udGFpbmVyUmVmPy5pbmplY3RvcjtcbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXG4gICAgICB7cHJvdmlkZTogRGlhbG9nQ29uZmlnLCB1c2VWYWx1ZTogY29uZmlnfSxcbiAgICAgIHtwcm92aWRlOiBEaWFsb2dSZWYsIHVzZVZhbHVlOiBkaWFsb2dSZWZ9LFxuICAgICAge3Byb3ZpZGU6IE92ZXJsYXlSZWYsIHVzZVZhbHVlOiBvdmVybGF5fSxcbiAgICBdO1xuICAgIGxldCBjb250YWluZXJUeXBlOiBUeXBlPEJhc2VQb3J0YWxPdXRsZXQ+O1xuXG4gICAgaWYgKGNvbmZpZy5jb250YWluZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgY29uZmlnLmNvbnRhaW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjb250YWluZXJUeXBlID0gY29uZmlnLmNvbnRhaW5lcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRhaW5lclR5cGUgPSBjb25maWcuY29udGFpbmVyLnR5cGU7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKC4uLmNvbmZpZy5jb250YWluZXIucHJvdmlkZXJzKGNvbmZpZykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXJUeXBlID0gQ2RrRGlhbG9nQ29udGFpbmVyO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lclBvcnRhbCA9IG5ldyBDb21wb25lbnRQb3J0YWwoXG4gICAgICBjb250YWluZXJUeXBlLFxuICAgICAgY29uZmlnLnZpZXdDb250YWluZXJSZWYsXG4gICAgICBJbmplY3Rvci5jcmVhdGUoe3BhcmVudDogdXNlckluamVjdG9yIHx8IHRoaXMuX2luamVjdG9yLCBwcm92aWRlcnN9KSxcbiAgICAgIGNvbmZpZy5jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgKTtcbiAgICBjb25zdCBjb250YWluZXJSZWYgPSBvdmVybGF5LmF0dGFjaChjb250YWluZXJQb3J0YWwpO1xuXG4gICAgcmV0dXJuIGNvbnRhaW5lclJlZi5pbnN0YW5jZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyB0aGUgdXNlci1wcm92aWRlZCBjb21wb25lbnQgdG8gdGhlIGFscmVhZHktY3JlYXRlZCBkaWFsb2cgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY29tcG9uZW50T3JUZW1wbGF0ZVJlZiBUaGUgdHlwZSBvZiBjb21wb25lbnQgYmVpbmcgbG9hZGVkIGludG8gdGhlIGRpYWxvZyxcbiAgICogICAgIG9yIGEgVGVtcGxhdGVSZWYgdG8gaW5zdGFudGlhdGUgYXMgdGhlIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBkaWFsb2dSZWYgUmVmZXJlbmNlIHRvIHRoZSBkaWFsb2cgYmVpbmcgb3BlbmVkLlxuICAgKiBAcGFyYW0gZGlhbG9nQ29udGFpbmVyIENvbXBvbmVudCB0aGF0IGlzIGdvaW5nIHRvIHdyYXAgdGhlIGRpYWxvZyBjb250ZW50LlxuICAgKiBAcGFyYW0gY29uZmlnIENvbmZpZ3VyYXRpb24gdXNlZCB0byBvcGVuIHRoZSBkaWFsb2cuXG4gICAqL1xuICBwcml2YXRlIF9hdHRhY2hEaWFsb2dDb250ZW50PFIsIEQsIEM+KFxuICAgIGNvbXBvbmVudE9yVGVtcGxhdGVSZWY6IENvbXBvbmVudFR5cGU8Qz4gfCBUZW1wbGF0ZVJlZjxDPixcbiAgICBkaWFsb2dSZWY6IERpYWxvZ1JlZjxSLCBDPixcbiAgICBkaWFsb2dDb250YWluZXI6IEJhc2VQb3J0YWxPdXRsZXQsXG4gICAgY29uZmlnOiBEaWFsb2dDb25maWc8RCwgRGlhbG9nUmVmPFIsIEM+PixcbiAgKSB7XG4gICAgY29uc3QgaW5qZWN0b3IgPSB0aGlzLl9jcmVhdGVJbmplY3Rvcihjb25maWcsIGRpYWxvZ1JlZiwgZGlhbG9nQ29udGFpbmVyKTtcblxuICAgIGlmIChjb21wb25lbnRPclRlbXBsYXRlUmVmIGluc3RhbmNlb2YgVGVtcGxhdGVSZWYpIHtcbiAgICAgIGxldCBjb250ZXh0OiBhbnkgPSB7JGltcGxpY2l0OiBjb25maWcuZGF0YSwgZGlhbG9nUmVmfTtcblxuICAgICAgaWYgKGNvbmZpZy50ZW1wbGF0ZUNvbnRleHQpIHtcbiAgICAgICAgY29udGV4dCA9IHtcbiAgICAgICAgICAuLi5jb250ZXh0LFxuICAgICAgICAgIC4uLih0eXBlb2YgY29uZmlnLnRlbXBsYXRlQ29udGV4dCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgPyBjb25maWcudGVtcGxhdGVDb250ZXh0KClcbiAgICAgICAgICAgIDogY29uZmlnLnRlbXBsYXRlQ29udGV4dCksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGRpYWxvZ0NvbnRhaW5lci5hdHRhY2hUZW1wbGF0ZVBvcnRhbChcbiAgICAgICAgbmV3IFRlbXBsYXRlUG9ydGFsPEM+KGNvbXBvbmVudE9yVGVtcGxhdGVSZWYsIG51bGwhLCBjb250ZXh0LCBpbmplY3RvciksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjb250ZW50UmVmID0gZGlhbG9nQ29udGFpbmVyLmF0dGFjaENvbXBvbmVudFBvcnRhbDxDPihcbiAgICAgICAgbmV3IENvbXBvbmVudFBvcnRhbChcbiAgICAgICAgICBjb21wb25lbnRPclRlbXBsYXRlUmVmLFxuICAgICAgICAgIGNvbmZpZy52aWV3Q29udGFpbmVyUmVmLFxuICAgICAgICAgIGluamVjdG9yLFxuICAgICAgICAgIGNvbmZpZy5jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICAgICksXG4gICAgICApO1xuICAgICAgKGRpYWxvZ1JlZiBhcyB7Y29tcG9uZW50SW5zdGFuY2U6IEN9KS5jb21wb25lbnRJbnN0YW5jZSA9IGNvbnRlbnRSZWYuaW5zdGFuY2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjdXN0b20gaW5qZWN0b3IgdG8gYmUgdXNlZCBpbnNpZGUgdGhlIGRpYWxvZy4gVGhpcyBhbGxvd3MgYSBjb21wb25lbnQgbG9hZGVkIGluc2lkZVxuICAgKiBvZiBhIGRpYWxvZyB0byBjbG9zZSBpdHNlbGYgYW5kLCBvcHRpb25hbGx5LCB0byByZXR1cm4gYSB2YWx1ZS5cbiAgICogQHBhcmFtIGNvbmZpZyBDb25maWcgb2JqZWN0IHRoYXQgaXMgdXNlZCB0byBjb25zdHJ1Y3QgdGhlIGRpYWxvZy5cbiAgICogQHBhcmFtIGRpYWxvZ1JlZiBSZWZlcmVuY2UgdG8gdGhlIGRpYWxvZyBiZWluZyBvcGVuZWQuXG4gICAqIEBwYXJhbSBkaWFsb2dDb250YWluZXIgQ29tcG9uZW50IHRoYXQgaXMgZ29pbmcgdG8gd3JhcCB0aGUgZGlhbG9nIGNvbnRlbnQuXG4gICAqIEByZXR1cm5zIFRoZSBjdXN0b20gaW5qZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBpbnNpZGUgdGhlIGRpYWxvZy5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZUluamVjdG9yPFIsIEQsIEM+KFxuICAgIGNvbmZpZzogRGlhbG9nQ29uZmlnPEQsIERpYWxvZ1JlZjxSLCBDPj4sXG4gICAgZGlhbG9nUmVmOiBEaWFsb2dSZWY8UiwgQz4sXG4gICAgZGlhbG9nQ29udGFpbmVyOiBCYXNlUG9ydGFsT3V0bGV0LFxuICApOiBJbmplY3RvciB7XG4gICAgY29uc3QgdXNlckluamVjdG9yID0gY29uZmlnICYmIGNvbmZpZy52aWV3Q29udGFpbmVyUmVmICYmIGNvbmZpZy52aWV3Q29udGFpbmVyUmVmLmluamVjdG9yO1xuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAgICAgIHtwcm92aWRlOiBESUFMT0dfREFUQSwgdXNlVmFsdWU6IGNvbmZpZy5kYXRhfSxcbiAgICAgIHtwcm92aWRlOiBEaWFsb2dSZWYsIHVzZVZhbHVlOiBkaWFsb2dSZWZ9LFxuICAgIF07XG5cbiAgICBpZiAoY29uZmlnLnByb3ZpZGVycykge1xuICAgICAgaWYgKHR5cGVvZiBjb25maWcucHJvdmlkZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKC4uLmNvbmZpZy5wcm92aWRlcnMoZGlhbG9nUmVmLCBjb25maWcsIGRpYWxvZ0NvbnRhaW5lcikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgY29uZmlnLmRpcmVjdGlvbiAmJlxuICAgICAgKCF1c2VySW5qZWN0b3IgfHxcbiAgICAgICAgIXVzZXJJbmplY3Rvci5nZXQ8RGlyZWN0aW9uYWxpdHkgfCBudWxsPihEaXJlY3Rpb25hbGl0eSwgbnVsbCwgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpKVxuICAgICkge1xuICAgICAgcHJvdmlkZXJzLnB1c2goe1xuICAgICAgICBwcm92aWRlOiBEaXJlY3Rpb25hbGl0eSxcbiAgICAgICAgdXNlVmFsdWU6IHt2YWx1ZTogY29uZmlnLmRpcmVjdGlvbiwgY2hhbmdlOiBvYnNlcnZhYmxlT2YoKX0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gSW5qZWN0b3IuY3JlYXRlKHtwYXJlbnQ6IHVzZXJJbmplY3RvciB8fCB0aGlzLl9pbmplY3RvciwgcHJvdmlkZXJzfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGRpYWxvZyBmcm9tIHRoZSBhcnJheSBvZiBvcGVuIGRpYWxvZ3MuXG4gICAqIEBwYXJhbSBkaWFsb2dSZWYgRGlhbG9nIHRvIGJlIHJlbW92ZWQuXG4gICAqIEBwYXJhbSBlbWl0RXZlbnQgV2hldGhlciB0byBlbWl0IGFuIGV2ZW50IGlmIHRoaXMgaXMgdGhlIGxhc3QgZGlhbG9nLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlT3BlbkRpYWxvZzxSLCBDPihkaWFsb2dSZWY6IERpYWxvZ1JlZjxSLCBDPiwgZW1pdEV2ZW50OiBib29sZWFuKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLm9wZW5EaWFsb2dzLmluZGV4T2YoZGlhbG9nUmVmKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAodGhpcy5vcGVuRGlhbG9ncyBhcyBEaWFsb2dSZWY8UiwgQz5bXSkuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgICAgLy8gSWYgYWxsIHRoZSBkaWFsb2dzIHdlcmUgY2xvc2VkLCByZW1vdmUvcmVzdG9yZSB0aGUgYGFyaWEtaGlkZGVuYFxuICAgICAgLy8gdG8gYSB0aGUgc2libGluZ3MgYW5kIGVtaXQgdG8gdGhlIGBhZnRlckFsbENsb3NlZGAgc3RyZWFtLlxuICAgICAgaWYgKCF0aGlzLm9wZW5EaWFsb2dzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuZm9yRWFjaCgocHJldmlvdXNWYWx1ZSwgZWxlbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBwcmV2aW91c1ZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuY2xlYXIoKTtcblxuICAgICAgICBpZiAoZW1pdEV2ZW50KSB7XG4gICAgICAgICAgdGhpcy5fZ2V0QWZ0ZXJBbGxDbG9zZWQoKS5uZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSGlkZXMgYWxsIG9mIHRoZSBjb250ZW50IHRoYXQgaXNuJ3QgYW4gb3ZlcmxheSBmcm9tIGFzc2lzdGl2ZSB0ZWNobm9sb2d5LiAqL1xuICBwcml2YXRlIF9oaWRlTm9uRGlhbG9nQ29udGVudEZyb21Bc3Npc3RpdmVUZWNobm9sb2d5KCkge1xuICAgIGNvbnN0IG92ZXJsYXlDb250YWluZXIgPSB0aGlzLl9vdmVybGF5Q29udGFpbmVyLmdldENvbnRhaW5lckVsZW1lbnQoKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBvdmVybGF5IGNvbnRhaW5lciBpcyBhdHRhY2hlZCB0byB0aGUgRE9NLlxuICAgIGlmIChvdmVybGF5Q29udGFpbmVyLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHNpYmxpbmdzID0gb3ZlcmxheUNvbnRhaW5lci5wYXJlbnRFbGVtZW50LmNoaWxkcmVuO1xuXG4gICAgICBmb3IgKGxldCBpID0gc2libGluZ3MubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcbiAgICAgICAgY29uc3Qgc2libGluZyA9IHNpYmxpbmdzW2ldO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBzaWJsaW5nICE9PSBvdmVybGF5Q29udGFpbmVyICYmXG4gICAgICAgICAgc2libGluZy5ub2RlTmFtZSAhPT0gJ1NDUklQVCcgJiZcbiAgICAgICAgICBzaWJsaW5nLm5vZGVOYW1lICE9PSAnU1RZTEUnICYmXG4gICAgICAgICAgIXNpYmxpbmcuaGFzQXR0cmlidXRlKCdhcmlhLWxpdmUnKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLl9hcmlhSGlkZGVuRWxlbWVudHMuc2V0KHNpYmxpbmcsIHNpYmxpbmcuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICAgICAgICBzaWJsaW5nLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QWZ0ZXJBbGxDbG9zZWQoKTogU3ViamVjdDx2b2lkPiB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5fcGFyZW50RGlhbG9nO1xuICAgIHJldHVybiBwYXJlbnQgPyBwYXJlbnQuX2dldEFmdGVyQWxsQ2xvc2VkKCkgOiB0aGlzLl9hZnRlckFsbENsb3NlZEF0VGhpc0xldmVsO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBjYWxsYmFjayBhZ2FpbnN0IGFsbCBlbGVtZW50cyBpbiBhbiBhcnJheSB3aGlsZSBpdGVyYXRpbmcgaW4gcmV2ZXJzZS5cbiAqIFVzZWZ1bCBpZiB0aGUgYXJyYXkgaXMgYmVpbmcgbW9kaWZpZWQgYXMgaXQgaXMgYmVpbmcgaXRlcmF0ZWQuXG4gKi9cbmZ1bmN0aW9uIHJldmVyc2VGb3JFYWNoPFQ+KGl0ZW1zOiBUW10gfCByZWFkb25seSBUW10sIGNhbGxiYWNrOiAoY3VycmVudDogVCkgPT4gdm9pZCkge1xuICBsZXQgaSA9IGl0ZW1zLmxlbmd0aDtcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgY2FsbGJhY2soaXRlbXNbaV0pO1xuICB9XG59XG4iXX0=