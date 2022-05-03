/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TemplateRef, Injector, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DialogRef } from './dialog-ref';
import { DialogConfig } from './dialog-config';
import { ComponentType, Overlay, OverlayContainer } from '@angular/cdk/overlay';
import * as i0 from "@angular/core";
export declare class Dialog implements OnDestroy {
    private _overlay;
    private _injector;
    private _defaultOptions;
    private _parentDialog;
    private _overlayContainer;
    private _openDialogsAtThisLevel;
    private readonly _afterAllClosedAtThisLevel;
    private readonly _afterOpenedAtThisLevel;
    private _ariaHiddenElements;
    private _scrollStrategy;
    /** Keeps track of the currently-open dialogs. */
    get openDialogs(): readonly DialogRef<any, any>[];
    /** Stream that emits when a dialog has been opened. */
    get afterOpened(): Subject<DialogRef<any, any>>;
    /**
     * Stream that emits when all open dialog have finished closing.
     * Will emit on subscribe if there are no open dialogs to begin with.
     */
    readonly afterAllClosed: Observable<void>;
    constructor(_overlay: Overlay, _injector: Injector, _defaultOptions: DialogConfig, _parentDialog: Dialog, _overlayContainer: OverlayContainer, scrollStrategy: any);
    /**
     * Opens a modal dialog containing the given component.
     * @param component Type of the component to load into the dialog.
     * @param config Extra configuration options.
     * @returns Reference to the newly-opened dialog.
     */
    open<R = unknown, D = unknown, C = unknown>(component: ComponentType<C>, config?: DialogConfig<D, DialogRef<R, C>>): DialogRef<R, C>;
    /**
     * Opens a modal dialog containing the given template.
     * @param template TemplateRef to instantiate as the dialog content.
     * @param config Extra configuration options.
     * @returns Reference to the newly-opened dialog.
     */
    open<R = unknown, D = unknown, C = unknown>(template: TemplateRef<C>, config?: DialogConfig<D, DialogRef<R, C>>): DialogRef<R, C>;
    open<R = unknown, D = unknown, C = unknown>(componentOrTemplateRef: ComponentType<C> | TemplateRef<C>, config?: DialogConfig<D, DialogRef<R, C>>): DialogRef<R, C>;
    /**
     * Closes all of the currently-open dialogs.
     */
    closeAll(): void;
    /**
     * Finds an open dialog by its id.
     * @param id ID to use when looking up the dialog.
     */
    getDialogById<R, C>(id: string): DialogRef<R, C> | undefined;
    ngOnDestroy(): void;
    /**
     * Creates an overlay config from a dialog config.
     * @param config The dialog configuration.
     * @returns The overlay configuration.
     */
    private _getOverlayConfig;
    /**
     * Attaches a dialog container to a dialog's already-created overlay.
     * @param overlay Reference to the dialog's underlying overlay.
     * @param config The dialog configuration.
     * @returns A promise resolving to a ComponentRef for the attached container.
     */
    private _attachContainer;
    /**
     * Attaches the user-provided component to the already-created dialog container.
     * @param componentOrTemplateRef The type of component being loaded into the dialog,
     *     or a TemplateRef to instantiate as the content.
     * @param dialogRef Reference to the dialog being opened.
     * @param dialogContainer Component that is going to wrap the dialog content.
     * @param config Configuration used to open the dialog.
     */
    private _attachDialogContent;
    /**
     * Creates a custom injector to be used inside the dialog. This allows a component loaded inside
     * of a dialog to close itself and, optionally, to return a value.
     * @param config Config object that is used to construct the dialog.
     * @param dialogRef Reference to the dialog being opened.
     * @param dialogContainer Component that is going to wrap the dialog content.
     * @returns The custom injector that can be used inside the dialog.
     */
    private _createInjector;
    /**
     * Removes a dialog from the array of open dialogs.
     * @param dialogRef Dialog to be removed.
     * @param emitEvent Whether to emit an event if this is the last dialog.
     */
    private _removeOpenDialog;
    /** Hides all of the content that isn't an overlay from assistive technology. */
    private _hideNonDialogContentFromAssistiveTechnology;
    private _getAfterAllClosed;
    static ɵfac: i0.ɵɵFactoryDeclaration<Dialog, [null, null, { optional: true; }, { optional: true; skipSelf: true; }, null, null]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<Dialog>;
}
