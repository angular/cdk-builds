/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor, FocusTrapFactory, InteractivityChecker, } from '@angular/cdk/a11y';
import { OverlayRef } from '@angular/cdk/overlay';
import { _getFocusedElementPierceShadowDom } from '@angular/cdk/platform';
import { BasePortalOutlet, CdkPortalOutlet, } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Inject, NgZone, Optional, ViewChild, ViewEncapsulation, } from '@angular/core';
import { DialogConfig } from './dialog-config';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
import * as i2 from "@angular/cdk/overlay";
import * as i3 from "@angular/cdk/portal";
export function throwDialogContentAlreadyAttachedError() {
    throw Error('Attempting to attach dialog content after content is already attached');
}
/**
 * Internal component that wraps user-provided dialog content.
 * @docs-private
 */
class CdkDialogContainer extends BasePortalOutlet {
    constructor(_elementRef, _focusTrapFactory, _document, _config, _interactivityChecker, _ngZone, _overlayRef, _focusMonitor) {
        super();
        this._elementRef = _elementRef;
        this._focusTrapFactory = _focusTrapFactory;
        this._config = _config;
        this._interactivityChecker = _interactivityChecker;
        this._ngZone = _ngZone;
        this._overlayRef = _overlayRef;
        this._focusMonitor = _focusMonitor;
        /** Element that was focused before the dialog was opened. Save this to restore upon close. */
        this._elementFocusedBeforeDialogWasOpened = null;
        /**
         * Type of interaction that led to the dialog being closed. This is used to determine
         * whether the focus style will be applied when returning focus to its original location
         * after the dialog is closed.
         */
        this._closeInteractionType = null;
        /**
         * Attaches a DOM portal to the dialog container.
         * @param portal Portal to be attached.
         * @deprecated To be turned into a method.
         * @breaking-change 10.0.0
         */
        this.attachDomPortal = (portal) => {
            if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throwDialogContentAlreadyAttachedError();
            }
            const result = this._portalOutlet.attachDomPortal(portal);
            this._contentAttached();
            return result;
        };
        this._ariaLabelledBy = this._config.ariaLabelledBy || null;
        this._document = _document;
    }
    _contentAttached() {
        this._initializeFocusTrap();
        this._handleBackdropClicks();
        this._captureInitialFocus();
    }
    /**
     * Can be used by child classes to customize the initial focus
     * capturing behavior (e.g. if it's tied to an animation).
     */
    _captureInitialFocus() {
        this._trapFocus();
    }
    ngOnDestroy() {
        this._restoreFocus();
    }
    /**
     * Attach a ComponentPortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachComponentPortal(portal) {
        if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throwDialogContentAlreadyAttachedError();
        }
        const result = this._portalOutlet.attachComponentPortal(portal);
        this._contentAttached();
        return result;
    }
    /**
     * Attach a TemplatePortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachTemplatePortal(portal) {
        if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            throwDialogContentAlreadyAttachedError();
        }
        const result = this._portalOutlet.attachTemplatePortal(portal);
        this._contentAttached();
        return result;
    }
    // TODO(crisbeto): this shouldn't be exposed, but there are internal references to it.
    /** Captures focus if it isn't already inside the dialog. */
    _recaptureFocus() {
        if (!this._containsFocus()) {
            this._trapFocus();
        }
    }
    /**
     * Focuses the provided element. If the element is not focusable, it will add a tabIndex
     * attribute to forcefully focus it. The attribute is removed after focus is moved.
     * @param element The element to focus.
     */
    _forceFocus(element, options) {
        if (!this._interactivityChecker.isFocusable(element)) {
            element.tabIndex = -1;
            // The tabindex attribute should be removed to avoid navigating to that element again
            this._ngZone.runOutsideAngular(() => {
                const callback = () => {
                    element.removeEventListener('blur', callback);
                    element.removeEventListener('mousedown', callback);
                    element.removeAttribute('tabindex');
                };
                element.addEventListener('blur', callback);
                element.addEventListener('mousedown', callback);
            });
        }
        element.focus(options);
    }
    /**
     * Focuses the first element that matches the given selector within the focus trap.
     * @param selector The CSS selector for the element to set focus to.
     */
    _focusByCssSelector(selector, options) {
        let elementToFocus = this._elementRef.nativeElement.querySelector(selector);
        if (elementToFocus) {
            this._forceFocus(elementToFocus, options);
        }
    }
    /**
     * Moves the focus inside the focus trap. When autoFocus is not set to 'dialog', if focus
     * cannot be moved then focus will go to the dialog container.
     */
    _trapFocus() {
        const element = this._elementRef.nativeElement;
        // If were to attempt to focus immediately, then the content of the dialog would not yet be
        // ready in instances where change detection has to run first. To deal with this, we simply
        // wait for the microtask queue to be empty when setting focus when autoFocus isn't set to
        // dialog. If the element inside the dialog can't be focused, then the container is focused
        // so the user can't tab into other elements behind it.
        switch (this._config.autoFocus) {
            case false:
            case 'dialog':
                // Ensure that focus is on the dialog container. It's possible that a different
                // component tried to move focus while the open animation was running. See:
                // https://github.com/angular/components/issues/16215. Note that we only want to do this
                // if the focus isn't inside the dialog already, because it's possible that the consumer
                // turned off `autoFocus` in order to move focus themselves.
                if (!this._containsFocus()) {
                    element.focus();
                }
                break;
            case true:
            case 'first-tabbable':
                this._focusTrap.focusInitialElementWhenReady().then(focusedSuccessfully => {
                    // If we weren't able to find a focusable element in the dialog, then focus the dialog
                    // container instead.
                    if (!focusedSuccessfully) {
                        this._focusDialogContainer();
                    }
                });
                break;
            case 'first-heading':
                this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
                break;
            default:
                this._focusByCssSelector(this._config.autoFocus);
                break;
        }
    }
    /** Restores focus to the element that was focused before the dialog opened. */
    _restoreFocus() {
        const focusConfig = this._config.restoreFocus;
        let focusTargetElement = null;
        if (typeof focusConfig === 'string') {
            focusTargetElement = this._document.querySelector(focusConfig);
        }
        else if (typeof focusConfig === 'boolean') {
            focusTargetElement = focusConfig ? this._elementFocusedBeforeDialogWasOpened : null;
        }
        else if (focusConfig) {
            focusTargetElement = focusConfig;
        }
        // We need the extra check, because IE can set the `activeElement` to null in some cases.
        if (this._config.restoreFocus &&
            focusTargetElement &&
            typeof focusTargetElement.focus === 'function') {
            const activeElement = _getFocusedElementPierceShadowDom();
            const element = this._elementRef.nativeElement;
            // Make sure that focus is still inside the dialog or is on the body (usually because a
            // non-focusable element like the backdrop was clicked) before moving it. It's possible that
            // the consumer moved it themselves before the animation was done, in which case we shouldn't
            // do anything.
            if (!activeElement ||
                activeElement === this._document.body ||
                activeElement === element ||
                element.contains(activeElement)) {
                if (this._focusMonitor) {
                    this._focusMonitor.focusVia(focusTargetElement, this._closeInteractionType);
                    this._closeInteractionType = null;
                }
                else {
                    focusTargetElement.focus();
                }
            }
        }
        if (this._focusTrap) {
            this._focusTrap.destroy();
        }
    }
    /** Focuses the dialog container. */
    _focusDialogContainer() {
        // Note that there is no focus method when rendering on the server.
        if (this._elementRef.nativeElement.focus) {
            this._elementRef.nativeElement.focus();
        }
    }
    /** Returns whether focus is inside the dialog. */
    _containsFocus() {
        const element = this._elementRef.nativeElement;
        const activeElement = _getFocusedElementPierceShadowDom();
        return element === activeElement || element.contains(activeElement);
    }
    /** Sets up the focus trap. */
    _initializeFocusTrap() {
        this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
        // Save the previously focused element. This element will be re-focused
        // when the dialog closes.
        if (this._document) {
            this._elementFocusedBeforeDialogWasOpened = _getFocusedElementPierceShadowDom();
        }
    }
    /** Sets up the listener that handles clicks on the dialog backdrop. */
    _handleBackdropClicks() {
        // Clicking on the backdrop will move focus out of dialog.
        // Recapture it if closing via the backdrop is disabled.
        this._overlayRef.backdropClick().subscribe(() => {
            if (this._config.disableClose) {
                this._recaptureFocus();
            }
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkDialogContainer, deps: [{ token: i0.ElementRef }, { token: i1.FocusTrapFactory }, { token: DOCUMENT, optional: true }, { token: DialogConfig }, { token: i1.InteractivityChecker }, { token: i0.NgZone }, { token: i2.OverlayRef }, { token: i1.FocusMonitor }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.0.0-next.7", type: CdkDialogContainer, selector: "cdk-dialog-container", host: { attributes: { "tabindex": "-1" }, properties: { "attr.id": "_config.id || null", "attr.role": "_config.role", "attr.aria-modal": "_config.ariaModal", "attr.aria-labelledby": "_config.ariaLabel ? null : _ariaLabelledBy", "attr.aria-label": "_config.ariaLabel", "attr.aria-describedby": "_config.ariaDescribedBy || null" }, classAttribute: "cdk-dialog-container" }, viewQueries: [{ propertyName: "_portalOutlet", first: true, predicate: CdkPortalOutlet, descendants: true, static: true }], usesInheritance: true, ngImport: i0, template: "<ng-template cdkPortalOutlet></ng-template>\n", styles: [".cdk-dialog-container{display:block;width:100%;height:100%;min-height:inherit;max-height:inherit}"], dependencies: [{ kind: "directive", type: i3.CdkPortalOutlet, selector: "[cdkPortalOutlet]", inputs: ["cdkPortalOutlet"], outputs: ["attached"], exportAs: ["cdkPortalOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None }); }
}
export { CdkDialogContainer };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-next.7", ngImport: i0, type: CdkDialogContainer, decorators: [{
            type: Component,
            args: [{ selector: 'cdk-dialog-container', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.Default, host: {
                        'class': 'cdk-dialog-container',
                        'tabindex': '-1',
                        '[attr.id]': '_config.id || null',
                        '[attr.role]': '_config.role',
                        '[attr.aria-modal]': '_config.ariaModal',
                        '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledBy',
                        '[attr.aria-label]': '_config.ariaLabel',
                        '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
                    }, template: "<ng-template cdkPortalOutlet></ng-template>\n", styles: [".cdk-dialog-container{display:block;width:100%;height:100%;min-height:inherit;max-height:inherit}"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.FocusTrapFactory }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DialogConfig]
                }] }, { type: i1.InteractivityChecker }, { type: i0.NgZone }, { type: i2.OverlayRef }, { type: i1.FocusMonitor }]; }, propDecorators: { _portalOutlet: [{
                type: ViewChild,
                args: [CdkPortalOutlet, { static: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLWNvbnRhaW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvZGlhbG9nL2RpYWxvZy1jb250YWluZXIudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RpYWxvZy9kaWFsb2ctY29udGFpbmVyLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLFlBQVksRUFHWixnQkFBZ0IsRUFDaEIsb0JBQW9CLEdBQ3JCLE1BQU0sbUJBQW1CLENBQUM7QUFDM0IsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3hFLE9BQU8sRUFDTCxnQkFBZ0IsRUFDaEIsZUFBZSxHQUloQixNQUFNLHFCQUFxQixDQUFDO0FBQzdCLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0wsdUJBQXVCLEVBQ3ZCLFNBQVMsRUFFVCxVQUFVLEVBRVYsTUFBTSxFQUNOLE1BQU0sRUFFTixRQUFRLEVBQ1IsU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7O0FBRTdDLE1BQU0sVUFBVSxzQ0FBc0M7SUFDcEQsTUFBTSxLQUFLLENBQUMsdUVBQXVFLENBQUMsQ0FBQztBQUN2RixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFtQmEsa0JBQ1gsU0FBUSxnQkFBZ0I7SUF3QnhCLFlBQ1ksV0FBdUIsRUFDdkIsaUJBQW1DLEVBQ2YsU0FBYyxFQUNiLE9BQVUsRUFDakMscUJBQTJDLEVBQzNDLE9BQWUsRUFDZixXQUF1QixFQUN2QixhQUE0QjtRQUVwQyxLQUFLLEVBQUUsQ0FBQztRQVRFLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FB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QkFBbUI7d0JBQ3hDLHlCQUF5QixFQUFFLGlDQUFpQztxQkFDN0Q7OzBCQThCRSxRQUFROzswQkFBSSxNQUFNOzJCQUFDLFFBQVE7OzBCQUMzQixNQUFNOzJCQUFDLFlBQVk7d0pBdEJzQixhQUFhO3NCQUF4RCxTQUFTO3VCQUFDLGVBQWUsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRm9jdXNNb25pdG9yLFxuICBGb2N1c09yaWdpbixcbiAgRm9jdXNUcmFwLFxuICBGb2N1c1RyYXBGYWN0b3J5LFxuICBJbnRlcmFjdGl2aXR5Q2hlY2tlcixcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtPdmVybGF5UmVmfSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge19nZXRGb2N1c2VkRWxlbWVudFBpZXJjZVNoYWRvd0RvbX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7XG4gIEJhc2VQb3J0YWxPdXRsZXQsXG4gIENka1BvcnRhbE91dGxldCxcbiAgQ29tcG9uZW50UG9ydGFsLFxuICBEb21Qb3J0YWwsXG4gIFRlbXBsYXRlUG9ydGFsLFxufSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ29tcG9uZW50LFxuICBDb21wb25lbnRSZWYsXG4gIEVsZW1lbnRSZWYsXG4gIEVtYmVkZGVkVmlld1JlZixcbiAgSW5qZWN0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaWFsb2dDb25maWd9IGZyb20gJy4vZGlhbG9nLWNvbmZpZyc7XG5cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd0RpYWxvZ0NvbnRlbnRBbHJlYWR5QXR0YWNoZWRFcnJvcigpIHtcbiAgdGhyb3cgRXJyb3IoJ0F0dGVtcHRpbmcgdG8gYXR0YWNoIGRpYWxvZyBjb250ZW50IGFmdGVyIGNvbnRlbnQgaXMgYWxyZWFkeSBhdHRhY2hlZCcpO1xufVxuXG4vKipcbiAqIEludGVybmFsIGNvbXBvbmVudCB0aGF0IHdyYXBzIHVzZXItcHJvdmlkZWQgZGlhbG9nIGNvbnRlbnQuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1kaWFsb2ctY29udGFpbmVyJyxcbiAgdGVtcGxhdGVVcmw6ICcuL2RpYWxvZy1jb250YWluZXIuaHRtbCcsXG4gIHN0eWxlVXJsczogWydkaWFsb2ctY29udGFpbmVyLmNzcyddLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICAvLyBVc2luZyBPblB1c2ggZm9yIGRpYWxvZ3MgY2F1c2VkIHNvbWUgRzMgc3luYyBpc3N1ZXMuIERpc2FibGVkIHVudGlsIHdlIGNhbiB0cmFjayB0aGVtIGRvd24uXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTp2YWxpZGF0ZS1kZWNvcmF0b3JzXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuRGVmYXVsdCxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstZGlhbG9nLWNvbnRhaW5lcicsXG4gICAgJ3RhYmluZGV4JzogJy0xJyxcbiAgICAnW2F0dHIuaWRdJzogJ19jb25maWcuaWQgfHwgbnVsbCcsXG4gICAgJ1thdHRyLnJvbGVdJzogJ19jb25maWcucm9sZScsXG4gICAgJ1thdHRyLmFyaWEtbW9kYWxdJzogJ19jb25maWcuYXJpYU1vZGFsJyxcbiAgICAnW2F0dHIuYXJpYS1sYWJlbGxlZGJ5XSc6ICdfY29uZmlnLmFyaWFMYWJlbCA/IG51bGwgOiBfYXJpYUxhYmVsbGVkQnknLFxuICAgICdbYXR0ci5hcmlhLWxhYmVsXSc6ICdfY29uZmlnLmFyaWFMYWJlbCcsXG4gICAgJ1thdHRyLmFyaWEtZGVzY3JpYmVkYnldJzogJ19jb25maWcuYXJpYURlc2NyaWJlZEJ5IHx8IG51bGwnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtEaWFsb2dDb250YWluZXI8QyBleHRlbmRzIERpYWxvZ0NvbmZpZyA9IERpYWxvZ0NvbmZpZz5cbiAgZXh0ZW5kcyBCYXNlUG9ydGFsT3V0bGV0XG4gIGltcGxlbWVudHMgT25EZXN0cm95XG57XG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBUaGUgcG9ydGFsIG91dGxldCBpbnNpZGUgb2YgdGhpcyBjb250YWluZXIgaW50byB3aGljaCB0aGUgZGlhbG9nIGNvbnRlbnQgd2lsbCBiZSBsb2FkZWQuICovXG4gIEBWaWV3Q2hpbGQoQ2RrUG9ydGFsT3V0bGV0LCB7c3RhdGljOiB0cnVlfSkgX3BvcnRhbE91dGxldDogQ2RrUG9ydGFsT3V0bGV0O1xuXG4gIC8qKiBUaGUgY2xhc3MgdGhhdCB0cmFwcyBhbmQgbWFuYWdlcyBmb2N1cyB3aXRoaW4gdGhlIGRpYWxvZy4gKi9cbiAgcHJpdmF0ZSBfZm9jdXNUcmFwOiBGb2N1c1RyYXA7XG5cbiAgLyoqIEVsZW1lbnQgdGhhdCB3YXMgZm9jdXNlZCBiZWZvcmUgdGhlIGRpYWxvZyB3YXMgb3BlbmVkLiBTYXZlIHRoaXMgdG8gcmVzdG9yZSB1cG9uIGNsb3NlLiAqL1xuICBwcml2YXRlIF9lbGVtZW50Rm9jdXNlZEJlZm9yZURpYWxvZ1dhc09wZW5lZDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogVHlwZSBvZiBpbnRlcmFjdGlvbiB0aGF0IGxlZCB0byB0aGUgZGlhbG9nIGJlaW5nIGNsb3NlZC4gVGhpcyBpcyB1c2VkIHRvIGRldGVybWluZVxuICAgKiB3aGV0aGVyIHRoZSBmb2N1cyBzdHlsZSB3aWxsIGJlIGFwcGxpZWQgd2hlbiByZXR1cm5pbmcgZm9jdXMgdG8gaXRzIG9yaWdpbmFsIGxvY2F0aW9uXG4gICAqIGFmdGVyIHRoZSBkaWFsb2cgaXMgY2xvc2VkLlxuICAgKi9cbiAgX2Nsb3NlSW50ZXJhY3Rpb25UeXBlOiBGb2N1c09yaWdpbiB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBJRCBvZiB0aGUgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBjb25zaWRlcmVkIGFzIHRoZSBkaWFsb2cncyBsYWJlbC4gKi9cbiAgX2FyaWFMYWJlbGxlZEJ5OiBzdHJpbmcgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCBfZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcm90ZWN0ZWQgX2ZvY3VzVHJhcEZhY3Rvcnk6IEZvY3VzVHJhcEZhY3RvcnksXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgQEluamVjdChEaWFsb2dDb25maWcpIHJlYWRvbmx5IF9jb25maWc6IEMsXG4gICAgcHJpdmF0ZSBfaW50ZXJhY3Rpdml0eUNoZWNrZXI6IEludGVyYWN0aXZpdHlDaGVja2VyLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX292ZXJsYXlSZWY6IE92ZXJsYXlSZWYsXG4gICAgcHJpdmF0ZSBfZm9jdXNNb25pdG9yPzogRm9jdXNNb25pdG9yLFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX2FyaWFMYWJlbGxlZEJ5ID0gdGhpcy5fY29uZmlnLmFyaWFMYWJlbGxlZEJ5IHx8IG51bGw7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2NvbnRlbnRBdHRhY2hlZCgpIHtcbiAgICB0aGlzLl9pbml0aWFsaXplRm9jdXNUcmFwKCk7XG4gICAgdGhpcy5faGFuZGxlQmFja2Ryb3BDbGlja3MoKTtcbiAgICB0aGlzLl9jYXB0dXJlSW5pdGlhbEZvY3VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FuIGJlIHVzZWQgYnkgY2hpbGQgY2xhc3NlcyB0byBjdXN0b21pemUgdGhlIGluaXRpYWwgZm9jdXNcbiAgICogY2FwdHVyaW5nIGJlaGF2aW9yIChlLmcuIGlmIGl0J3MgdGllZCB0byBhbiBhbmltYXRpb24pLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9jYXB0dXJlSW5pdGlhbEZvY3VzKCkge1xuICAgIHRoaXMuX3RyYXBGb2N1cygpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcmVzdG9yZUZvY3VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoIGEgQ29tcG9uZW50UG9ydGFsIGFzIGNvbnRlbnQgdG8gdGhpcyBkaWFsb2cgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZCBhcyB0aGUgZGlhbG9nIGNvbnRlbnQuXG4gICAqL1xuICBhdHRhY2hDb21wb25lbnRQb3J0YWw8VD4ocG9ydGFsOiBDb21wb25lbnRQb3J0YWw8VD4pOiBDb21wb25lbnRSZWY8VD4ge1xuICAgIGlmICh0aGlzLl9wb3J0YWxPdXRsZXQuaGFzQXR0YWNoZWQoKSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgdGhyb3dEaWFsb2dDb250ZW50QWxyZWFkeUF0dGFjaGVkRXJyb3IoKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9wb3J0YWxPdXRsZXQuYXR0YWNoQ29tcG9uZW50UG9ydGFsKHBvcnRhbCk7XG4gICAgdGhpcy5fY29udGVudEF0dGFjaGVkKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggYSBUZW1wbGF0ZVBvcnRhbCBhcyBjb250ZW50IHRvIHRoaXMgZGlhbG9nIGNvbnRhaW5lci5cbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgdG8gYmUgYXR0YWNoZWQgYXMgdGhlIGRpYWxvZyBjb250ZW50LlxuICAgKi9cbiAgYXR0YWNoVGVtcGxhdGVQb3J0YWw8VD4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxUPik6IEVtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgaWYgKHRoaXMuX3BvcnRhbE91dGxldC5oYXNBdHRhY2hlZCgpICYmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICB0aHJvd0RpYWxvZ0NvbnRlbnRBbHJlYWR5QXR0YWNoZWRFcnJvcigpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX3BvcnRhbE91dGxldC5hdHRhY2hUZW1wbGF0ZVBvcnRhbChwb3J0YWwpO1xuICAgIHRoaXMuX2NvbnRlbnRBdHRhY2hlZCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSBET00gcG9ydGFsIHRvIHRoZSBkaWFsb2cgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCB0byBiZSBhdHRhY2hlZC5cbiAgICogQGRlcHJlY2F0ZWQgVG8gYmUgdHVybmVkIGludG8gYSBtZXRob2QuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBvdmVycmlkZSBhdHRhY2hEb21Qb3J0YWwgPSAocG9ydGFsOiBEb21Qb3J0YWwpID0+IHtcbiAgICBpZiAodGhpcy5fcG9ydGFsT3V0bGV0Lmhhc0F0dGFjaGVkKCkgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIHRocm93RGlhbG9nQ29udGVudEFscmVhZHlBdHRhY2hlZEVycm9yKCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fcG9ydGFsT3V0bGV0LmF0dGFjaERvbVBvcnRhbChwb3J0YWwpO1xuICAgIHRoaXMuX2NvbnRlbnRBdHRhY2hlZCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gVE9ETyhjcmlzYmV0byk6IHRoaXMgc2hvdWxkbid0IGJlIGV4cG9zZWQsIGJ1dCB0aGVyZSBhcmUgaW50ZXJuYWwgcmVmZXJlbmNlcyB0byBpdC5cbiAgLyoqIENhcHR1cmVzIGZvY3VzIGlmIGl0IGlzbid0IGFscmVhZHkgaW5zaWRlIHRoZSBkaWFsb2cuICovXG4gIF9yZWNhcHR1cmVGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMuX2NvbnRhaW5zRm9jdXMoKSkge1xuICAgICAgdGhpcy5fdHJhcEZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIHByb3ZpZGVkIGVsZW1lbnQuIElmIHRoZSBlbGVtZW50IGlzIG5vdCBmb2N1c2FibGUsIGl0IHdpbGwgYWRkIGEgdGFiSW5kZXhcbiAgICogYXR0cmlidXRlIHRvIGZvcmNlZnVsbHkgZm9jdXMgaXQuIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCBhZnRlciBmb2N1cyBpcyBtb3ZlZC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gZm9jdXMuXG4gICAqL1xuICBwcml2YXRlIF9mb3JjZUZvY3VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBvcHRpb25zPzogRm9jdXNPcHRpb25zKSB7XG4gICAgaWYgKCF0aGlzLl9pbnRlcmFjdGl2aXR5Q2hlY2tlci5pc0ZvY3VzYWJsZShlbGVtZW50KSkge1xuICAgICAgZWxlbWVudC50YWJJbmRleCA9IC0xO1xuICAgICAgLy8gVGhlIHRhYmluZGV4IGF0dHJpYnV0ZSBzaG91bGQgYmUgcmVtb3ZlZCB0byBhdm9pZCBuYXZpZ2F0aW5nIHRvIHRoYXQgZWxlbWVudCBhZ2FpblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgY2FsbGJhY2spO1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgY2FsbGJhY2spO1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGNhbGxiYWNrKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjYWxsYmFjayk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb2N1c2VzIHRoZSBmaXJzdCBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gc2VsZWN0b3Igd2l0aGluIHRoZSBmb2N1cyB0cmFwLlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgVGhlIENTUyBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnQgdG8gc2V0IGZvY3VzIHRvLlxuICAgKi9cbiAgcHJpdmF0ZSBfZm9jdXNCeUNzc1NlbGVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpIHtcbiAgICBsZXQgZWxlbWVudFRvRm9jdXMgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgIHNlbGVjdG9yLFxuICAgICkgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIGlmIChlbGVtZW50VG9Gb2N1cykge1xuICAgICAgdGhpcy5fZm9yY2VGb2N1cyhlbGVtZW50VG9Gb2N1cywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1vdmVzIHRoZSBmb2N1cyBpbnNpZGUgdGhlIGZvY3VzIHRyYXAuIFdoZW4gYXV0b0ZvY3VzIGlzIG5vdCBzZXQgdG8gJ2RpYWxvZycsIGlmIGZvY3VzXG4gICAqIGNhbm5vdCBiZSBtb3ZlZCB0aGVuIGZvY3VzIHdpbGwgZ28gdG8gdGhlIGRpYWxvZyBjb250YWluZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgX3RyYXBGb2N1cygpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIC8vIElmIHdlcmUgdG8gYXR0ZW1wdCB0byBmb2N1cyBpbW1lZGlhdGVseSwgdGhlbiB0aGUgY29udGVudCBvZiB0aGUgZGlhbG9nIHdvdWxkIG5vdCB5ZXQgYmVcbiAgICAvLyByZWFkeSBpbiBpbnN0YW5jZXMgd2hlcmUgY2hhbmdlIGRldGVjdGlvbiBoYXMgdG8gcnVuIGZpcnN0LiBUbyBkZWFsIHdpdGggdGhpcywgd2Ugc2ltcGx5XG4gICAgLy8gd2FpdCBmb3IgdGhlIG1pY3JvdGFzayBxdWV1ZSB0byBiZSBlbXB0eSB3aGVuIHNldHRpbmcgZm9jdXMgd2hlbiBhdXRvRm9jdXMgaXNuJ3Qgc2V0IHRvXG4gICAgLy8gZGlhbG9nLiBJZiB0aGUgZWxlbWVudCBpbnNpZGUgdGhlIGRpYWxvZyBjYW4ndCBiZSBmb2N1c2VkLCB0aGVuIHRoZSBjb250YWluZXIgaXMgZm9jdXNlZFxuICAgIC8vIHNvIHRoZSB1c2VyIGNhbid0IHRhYiBpbnRvIG90aGVyIGVsZW1lbnRzIGJlaGluZCBpdC5cbiAgICBzd2l0Y2ggKHRoaXMuX2NvbmZpZy5hdXRvRm9jdXMpIHtcbiAgICAgIGNhc2UgZmFsc2U6XG4gICAgICBjYXNlICdkaWFsb2cnOlxuICAgICAgICAvLyBFbnN1cmUgdGhhdCBmb2N1cyBpcyBvbiB0aGUgZGlhbG9nIGNvbnRhaW5lci4gSXQncyBwb3NzaWJsZSB0aGF0IGEgZGlmZmVyZW50XG4gICAgICAgIC8vIGNvbXBvbmVudCB0cmllZCB0byBtb3ZlIGZvY3VzIHdoaWxlIHRoZSBvcGVuIGFuaW1hdGlvbiB3YXMgcnVubmluZy4gU2VlOlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL2lzc3Vlcy8xNjIxNS4gTm90ZSB0aGF0IHdlIG9ubHkgd2FudCB0byBkbyB0aGlzXG4gICAgICAgIC8vIGlmIHRoZSBmb2N1cyBpc24ndCBpbnNpZGUgdGhlIGRpYWxvZyBhbHJlYWR5LCBiZWNhdXNlIGl0J3MgcG9zc2libGUgdGhhdCB0aGUgY29uc3VtZXJcbiAgICAgICAgLy8gdHVybmVkIG9mZiBgYXV0b0ZvY3VzYCBpbiBvcmRlciB0byBtb3ZlIGZvY3VzIHRoZW1zZWx2ZXMuXG4gICAgICAgIGlmICghdGhpcy5fY29udGFpbnNGb2N1cygpKSB7XG4gICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cnVlOlxuICAgICAgY2FzZSAnZmlyc3QtdGFiYmFibGUnOlxuICAgICAgICB0aGlzLl9mb2N1c1RyYXAuZm9jdXNJbml0aWFsRWxlbWVudFdoZW5SZWFkeSgpLnRoZW4oZm9jdXNlZFN1Y2Nlc3NmdWxseSA9PiB7XG4gICAgICAgICAgLy8gSWYgd2Ugd2VyZW4ndCBhYmxlIHRvIGZpbmQgYSBmb2N1c2FibGUgZWxlbWVudCBpbiB0aGUgZGlhbG9nLCB0aGVuIGZvY3VzIHRoZSBkaWFsb2dcbiAgICAgICAgICAvLyBjb250YWluZXIgaW5zdGVhZC5cbiAgICAgICAgICBpZiAoIWZvY3VzZWRTdWNjZXNzZnVsbHkpIHtcbiAgICAgICAgICAgIHRoaXMuX2ZvY3VzRGlhbG9nQ29udGFpbmVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdmaXJzdC1oZWFkaW5nJzpcbiAgICAgICAgdGhpcy5fZm9jdXNCeUNzc1NlbGVjdG9yKCdoMSwgaDIsIGgzLCBoNCwgaDUsIGg2LCBbcm9sZT1cImhlYWRpbmdcIl0nKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLl9mb2N1c0J5Q3NzU2VsZWN0b3IodGhpcy5fY29uZmlnLmF1dG9Gb2N1cyEpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKiogUmVzdG9yZXMgZm9jdXMgdG8gdGhlIGVsZW1lbnQgdGhhdCB3YXMgZm9jdXNlZCBiZWZvcmUgdGhlIGRpYWxvZyBvcGVuZWQuICovXG4gIHByaXZhdGUgX3Jlc3RvcmVGb2N1cygpIHtcbiAgICBjb25zdCBmb2N1c0NvbmZpZyA9IHRoaXMuX2NvbmZpZy5yZXN0b3JlRm9jdXM7XG4gICAgbGV0IGZvY3VzVGFyZ2V0RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgIGlmICh0eXBlb2YgZm9jdXNDb25maWcgPT09ICdzdHJpbmcnKSB7XG4gICAgICBmb2N1c1RhcmdldEVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGZvY3VzQ29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBmb2N1c0NvbmZpZyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBmb2N1c1RhcmdldEVsZW1lbnQgPSBmb2N1c0NvbmZpZyA/IHRoaXMuX2VsZW1lbnRGb2N1c2VkQmVmb3JlRGlhbG9nV2FzT3BlbmVkIDogbnVsbDtcbiAgICB9IGVsc2UgaWYgKGZvY3VzQ29uZmlnKSB7XG4gICAgICBmb2N1c1RhcmdldEVsZW1lbnQgPSBmb2N1c0NvbmZpZztcbiAgICB9XG5cbiAgICAvLyBXZSBuZWVkIHRoZSBleHRyYSBjaGVjaywgYmVjYXVzZSBJRSBjYW4gc2V0IHRoZSBgYWN0aXZlRWxlbWVudGAgdG8gbnVsbCBpbiBzb21lIGNhc2VzLlxuICAgIGlmIChcbiAgICAgIHRoaXMuX2NvbmZpZy5yZXN0b3JlRm9jdXMgJiZcbiAgICAgIGZvY3VzVGFyZ2V0RWxlbWVudCAmJlxuICAgICAgdHlwZW9mIGZvY3VzVGFyZ2V0RWxlbWVudC5mb2N1cyA9PT0gJ2Z1bmN0aW9uJ1xuICAgICkge1xuICAgICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IF9nZXRGb2N1c2VkRWxlbWVudFBpZXJjZVNoYWRvd0RvbSgpO1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgZm9jdXMgaXMgc3RpbGwgaW5zaWRlIHRoZSBkaWFsb2cgb3IgaXMgb24gdGhlIGJvZHkgKHVzdWFsbHkgYmVjYXVzZSBhXG4gICAgICAvLyBub24tZm9jdXNhYmxlIGVsZW1lbnQgbGlrZSB0aGUgYmFja2Ryb3Agd2FzIGNsaWNrZWQpIGJlZm9yZSBtb3ZpbmcgaXQuIEl0J3MgcG9zc2libGUgdGhhdFxuICAgICAgLy8gdGhlIGNvbnN1bWVyIG1vdmVkIGl0IHRoZW1zZWx2ZXMgYmVmb3JlIHRoZSBhbmltYXRpb24gd2FzIGRvbmUsIGluIHdoaWNoIGNhc2Ugd2Ugc2hvdWxkbid0XG4gICAgICAvLyBkbyBhbnl0aGluZy5cbiAgICAgIGlmIChcbiAgICAgICAgIWFjdGl2ZUVsZW1lbnQgfHxcbiAgICAgICAgYWN0aXZlRWxlbWVudCA9PT0gdGhpcy5fZG9jdW1lbnQuYm9keSB8fFxuICAgICAgICBhY3RpdmVFbGVtZW50ID09PSBlbGVtZW50IHx8XG4gICAgICAgIGVsZW1lbnQuY29udGFpbnMoYWN0aXZlRWxlbWVudClcbiAgICAgICkge1xuICAgICAgICBpZiAodGhpcy5fZm9jdXNNb25pdG9yKSB7XG4gICAgICAgICAgdGhpcy5fZm9jdXNNb25pdG9yLmZvY3VzVmlhKGZvY3VzVGFyZ2V0RWxlbWVudCwgdGhpcy5fY2xvc2VJbnRlcmFjdGlvblR5cGUpO1xuICAgICAgICAgIHRoaXMuX2Nsb3NlSW50ZXJhY3Rpb25UeXBlID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb2N1c1RhcmdldEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9mb2N1c1RyYXApIHtcbiAgICAgIHRoaXMuX2ZvY3VzVHJhcC5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEZvY3VzZXMgdGhlIGRpYWxvZyBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2ZvY3VzRGlhbG9nQ29udGFpbmVyKCkge1xuICAgIC8vIE5vdGUgdGhhdCB0aGVyZSBpcyBubyBmb2N1cyBtZXRob2Qgd2hlbiByZW5kZXJpbmcgb24gdGhlIHNlcnZlci5cbiAgICBpZiAodGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmZvY3VzKSB7XG4gICAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmV0dXJucyB3aGV0aGVyIGZvY3VzIGlzIGluc2lkZSB0aGUgZGlhbG9nLiAqL1xuICBwcml2YXRlIF9jb250YWluc0ZvY3VzKCkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IF9nZXRGb2N1c2VkRWxlbWVudFBpZXJjZVNoYWRvd0RvbSgpO1xuICAgIHJldHVybiBlbGVtZW50ID09PSBhY3RpdmVFbGVtZW50IHx8IGVsZW1lbnQuY29udGFpbnMoYWN0aXZlRWxlbWVudCk7XG4gIH1cblxuICAvKiogU2V0cyB1cCB0aGUgZm9jdXMgdHJhcC4gKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZUZvY3VzVHJhcCgpIHtcbiAgICB0aGlzLl9mb2N1c1RyYXAgPSB0aGlzLl9mb2N1c1RyYXBGYWN0b3J5LmNyZWF0ZSh0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgLy8gU2F2ZSB0aGUgcHJldmlvdXNseSBmb2N1c2VkIGVsZW1lbnQuIFRoaXMgZWxlbWVudCB3aWxsIGJlIHJlLWZvY3VzZWRcbiAgICAvLyB3aGVuIHRoZSBkaWFsb2cgY2xvc2VzLlxuICAgIGlmICh0aGlzLl9kb2N1bWVudCkge1xuICAgICAgdGhpcy5fZWxlbWVudEZvY3VzZWRCZWZvcmVEaWFsb2dXYXNPcGVuZWQgPSBfZ2V0Rm9jdXNlZEVsZW1lbnRQaWVyY2VTaGFkb3dEb20oKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB1cCB0aGUgbGlzdGVuZXIgdGhhdCBoYW5kbGVzIGNsaWNrcyBvbiB0aGUgZGlhbG9nIGJhY2tkcm9wLiAqL1xuICBwcml2YXRlIF9oYW5kbGVCYWNrZHJvcENsaWNrcygpIHtcbiAgICAvLyBDbGlja2luZyBvbiB0aGUgYmFja2Ryb3Agd2lsbCBtb3ZlIGZvY3VzIG91dCBvZiBkaWFsb2cuXG4gICAgLy8gUmVjYXB0dXJlIGl0IGlmIGNsb3NpbmcgdmlhIHRoZSBiYWNrZHJvcCBpcyBkaXNhYmxlZC5cbiAgICB0aGlzLl9vdmVybGF5UmVmLmJhY2tkcm9wQ2xpY2soKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy5kaXNhYmxlQ2xvc2UpIHtcbiAgICAgICAgdGhpcy5fcmVjYXB0dXJlRm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiPG5nLXRlbXBsYXRlIGNka1BvcnRhbE91dGxldD48L25nLXRlbXBsYXRlPlxuIl19