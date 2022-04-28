/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OverlayRef } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';
import { DialogConfig } from './dialog-config';
import { FocusOrigin } from '@angular/cdk/a11y';
import { BasePortalOutlet } from '@angular/cdk/portal';
/** Additional options that can be passed in when closing a dialog. */
export interface DialogCloseOptions {
    /** Focus original to use when restoring focus. */
    focusOrigin?: FocusOrigin;
}
/**
 * Reference to a dialog opened via the Dialog service.
 */
export declare class DialogRef<R = unknown, C = unknown> {
    readonly overlayRef: OverlayRef;
    readonly config: DialogConfig<any, DialogRef<R, C>, BasePortalOutlet>;
    /**
     * Instance of component opened into the dialog. Will be
     * null when the dialog is opened using a `TemplateRef`.
     */
    readonly componentInstance: C | null;
    /** Instance of the container that is rendering out the dialog content. */
    readonly containerInstance: BasePortalOutlet & {
        _closeInteractionType?: FocusOrigin;
    };
    /** Whether the user is allowed to close the dialog. */
    disableClose: boolean | undefined;
    /** Emits when the dialog has been closed. */
    readonly closed: Observable<R | undefined>;
    /** Emits when the backdrop of the dialog is clicked. */
    readonly backdropClick: Observable<MouseEvent>;
    /** Emits when on keyboard events within the dialog. */
    readonly keydownEvents: Observable<KeyboardEvent>;
    /** Emits on pointer events that happen outside of the dialog. */
    readonly outsidePointerEvents: Observable<MouseEvent>;
    /** Unique ID for the dialog. */
    readonly id: string;
    constructor(overlayRef: OverlayRef, config: DialogConfig<any, DialogRef<R, C>, BasePortalOutlet>);
    /**
     * Close the dialog.
     * @param result Optional result to return to the dialog opener.
     * @param options Additional options to customize the closing behavior.
     */
    close(result?: R, options?: DialogCloseOptions): void;
    /** Updates the position of the dialog based on the current position strategy. */
    updatePosition(): this;
    /**
     * Updates the dialog's width and height.
     * @param width New width of the dialog.
     * @param height New height of the dialog.
     */
    updateSize(width?: string | number, height?: string | number): this;
    /** Add a CSS class or an array of classes to the overlay pane. */
    addPanelClass(classes: string | string[]): this;
    /** Remove a CSS class or an array of classes from the overlay pane. */
    removePanelClass(classes: string | string[]): this;
}
