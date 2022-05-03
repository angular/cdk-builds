/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor, FocusOrigin, FocusTrapFactory, InteractivityChecker } from '@angular/cdk/a11y';
import { OverlayRef } from '@angular/cdk/overlay';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, DomPortal, TemplatePortal } from '@angular/cdk/portal';
import { ComponentRef, ElementRef, EmbeddedViewRef, NgZone, OnDestroy } from '@angular/core';
import { DialogConfig } from './dialog-config';
import * as i0 from "@angular/core";
export declare function throwDialogContentAlreadyAttachedError(): void;
/**
 * Internal component that wraps user-provided dialog content.
 * @docs-private
 */
export declare class CdkDialogContainer<C extends DialogConfig = DialogConfig> extends BasePortalOutlet implements OnDestroy {
    protected _elementRef: ElementRef;
    protected _focusTrapFactory: FocusTrapFactory;
    readonly _config: C;
    private _interactivityChecker;
    private _ngZone;
    private _overlayRef;
    private _focusMonitor?;
    protected _document: Document;
    /** The portal outlet inside of this container into which the dialog content will be loaded. */
    _portalOutlet: CdkPortalOutlet;
    /** The class that traps and manages focus within the dialog. */
    private _focusTrap;
    /** Element that was focused before the dialog was opened. Save this to restore upon close. */
    private _elementFocusedBeforeDialogWasOpened;
    /**
     * Type of interaction that led to the dialog being closed. This is used to determine
     * whether the focus style will be applied when returning focus to its original location
     * after the dialog is closed.
     */
    _closeInteractionType: FocusOrigin | null;
    /** ID of the element that should be considered as the dialog's label. */
    _ariaLabelledBy: string | null;
    constructor(_elementRef: ElementRef, _focusTrapFactory: FocusTrapFactory, _document: any, _config: C, _interactivityChecker: InteractivityChecker, _ngZone: NgZone, _overlayRef: OverlayRef, _focusMonitor?: FocusMonitor | undefined);
    protected _contentAttached(): void;
    /**
     * Can be used by child classes to customize the initial focus
     * capturing behavior (e.g. if it's tied to an animation).
     */
    protected _captureInitialFocus(): void;
    ngOnDestroy(): void;
    /**
     * Attach a ComponentPortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;
    /**
     * Attach a TemplatePortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachTemplatePortal<T>(portal: TemplatePortal<T>): EmbeddedViewRef<T>;
    /**
     * Attaches a DOM portal to the dialog container.
     * @param portal Portal to be attached.
     * @deprecated To be turned into a method.
     * @breaking-change 10.0.0
     */
    attachDomPortal: (portal: DomPortal) => void;
    /** Captures focus if it isn't already inside the dialog. */
    _recaptureFocus(): void;
    /**
     * Focuses the provided element. If the element is not focusable, it will add a tabIndex
     * attribute to forcefully focus it. The attribute is removed after focus is moved.
     * @param element The element to focus.
     */
    private _forceFocus;
    /**
     * Focuses the first element that matches the given selector within the focus trap.
     * @param selector The CSS selector for the element to set focus to.
     */
    private _focusByCssSelector;
    /**
     * Moves the focus inside the focus trap. When autoFocus is not set to 'dialog', if focus
     * cannot be moved then focus will go to the dialog container.
     */
    protected _trapFocus(): void;
    /** Restores focus to the element that was focused before the dialog opened. */
    private _restoreFocus;
    /** Focuses the dialog container. */
    private _focusDialogContainer;
    /** Returns whether focus is inside the dialog. */
    private _containsFocus;
    /** Sets up the focus trap. */
    private _initializeFocusTrap;
    /** Sets up the listener that handles clicks on the dialog backdrop. */
    private _handleBackdropClicks;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkDialogContainer<any>, [null, null, { optional: true; }, null, null, null, null, null]>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CdkDialogContainer<any>, "cdk-dialog-container", never, {}, {}, never, never, false>;
}
