/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, inject, Injectable, Input } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayConfig, STANDARD_DROPDOWN_BELOW_POSITIONS, } from '@angular/cdk/overlay';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { merge, partition } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { MENU_STACK, MenuStack } from './menu-stack';
import { CdkMenuTriggerBase, MENU_TRIGGER } from './menu-trigger-base';
import * as i0 from "@angular/core";
/** The preferred menu positions for the context menu. */
const CONTEXT_MENU_POSITIONS = STANDARD_DROPDOWN_BELOW_POSITIONS.map(position => {
    // In cases where the first menu item in the context menu is a trigger the submenu opens on a
    // hover event. We offset the context menu 2px by default to prevent this from occurring.
    const offsetX = position.overlayX === 'start' ? 2 : -2;
    const offsetY = position.overlayY === 'top' ? 2 : -2;
    return { ...position, offsetX, offsetY };
});
/** Tracks the last open context menu trigger across the entire application. */
export class ContextMenuTracker {
    /**
     * Close the previous open context menu and set the given one as being open.
     * @param trigger The trigger for the currently open Context Menu.
     */
    update(trigger) {
        if (ContextMenuTracker._openContextMenuTrigger !== trigger) {
            ContextMenuTracker._openContextMenuTrigger?.close();
            ContextMenuTracker._openContextMenuTrigger = trigger;
        }
    }
}
ContextMenuTracker.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: ContextMenuTracker, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
ContextMenuTracker.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: ContextMenuTracker, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: ContextMenuTracker, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
/**
 * A directive that opens a menu when a user right-clicks within its host element.
 * It is aware of nested context menus and will trigger only the lowest level non-disabled context menu.
 */
export class CdkContextMenuTrigger extends CdkMenuTriggerBase {
    constructor() {
        super();
        /** The CDK overlay service. */
        this._overlay = inject(Overlay);
        /** The directionality of the page. */
        this._directionality = inject(Directionality, { optional: true });
        /** The app's context menu tracking registry */
        this._contextMenuTracker = inject(ContextMenuTracker);
        this._disabled = false;
        this._setMenuStackCloseListener();
    }
    /** Whether the context menu is disabled. */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        this._disabled = coerceBooleanProperty(value);
    }
    /**
     * Open the attached menu at the specified location.
     * @param coordinates where to open the context menu
     */
    open(coordinates) {
        this._open(coordinates, false);
    }
    /** Close the currently opened context menu. */
    close() {
        this.menuStack.closeAll();
    }
    /**
     * Open the context menu and closes any previously open menus.
     * @param event the mouse event which opens the context menu.
     */
    _openOnContextMenu(event) {
        if (!this.disabled) {
            // Prevent the native context menu from opening because we're opening a custom one.
            event.preventDefault();
            // Stop event propagation to ensure that only the closest enabled context menu opens.
            // Otherwise, any context menus attached to containing elements would *also* open,
            // resulting in multiple stacked context menus being displayed.
            event.stopPropagation();
            this._contextMenuTracker.update(this);
            this._open({ x: event.clientX, y: event.clientY }, true);
            // A context menu can be triggered via a mouse right click or a keyboard shortcut.
            if (event.button === 2) {
                this.childMenu?.focusFirstItem('mouse');
            }
            else if (event.button === 0) {
                this.childMenu?.focusFirstItem('keyboard');
            }
            else {
                this.childMenu?.focusFirstItem('program');
            }
        }
    }
    /**
     * Get the configuration object used to create the overlay.
     * @param coordinates the location to place the opened menu
     */
    _getOverlayConfig(coordinates) {
        return new OverlayConfig({
            positionStrategy: this._getOverlayPositionStrategy(coordinates),
            scrollStrategy: this._overlay.scrollStrategies.reposition(),
            direction: this._directionality || undefined,
        });
    }
    /**
     * Get the position strategy for the overlay which specifies where to place the menu.
     * @param coordinates the location to place the opened menu
     */
    _getOverlayPositionStrategy(coordinates) {
        return this._overlay
            .position()
            .flexibleConnectedTo(coordinates)
            .withLockedPosition()
            .withGrowAfterOpen()
            .withPositions(this.menuPosition ?? CONTEXT_MENU_POSITIONS);
    }
    /** Subscribe to the menu stack close events and close this menu when requested. */
    _setMenuStackCloseListener() {
        this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({ item }) => {
            if (item === this.childMenu && this.isOpen()) {
                this.closed.next();
                this.overlayRef.detach();
            }
        });
    }
    /**
     * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
     * click occurs outside the menus.
     * @param ignoreFirstAuxClick Whether to ignore the first auxclick event outside the menu.
     */
    _subscribeToOutsideClicks(ignoreFirstAuxClick) {
        if (this.overlayRef) {
            let outsideClicks = this.overlayRef.outsidePointerEvents();
            // If the menu was triggered by the `contextmenu` event, skip the first `auxclick` event
            // because it fires when the mouse is released on the same click that opened the menu.
            if (ignoreFirstAuxClick) {
                const [auxClicks, nonAuxClicks] = partition(outsideClicks, ({ type }) => type === 'auxclick');
                outsideClicks = merge(nonAuxClicks, auxClicks.pipe(skip(1)));
            }
            outsideClicks.pipe(takeUntil(this.stopOutsideClicksListener)).subscribe(event => {
                if (!this.isElementInsideMenuStack(event.target)) {
                    this.menuStack.closeAll();
                }
            });
        }
    }
    /**
     * Open the attached menu at the specified location.
     * @param coordinates where to open the context menu
     * @param ignoreFirstOutsideAuxClick Whether to ignore the first auxclick outside the menu after opening.
     */
    _open(coordinates, ignoreFirstOutsideAuxClick) {
        if (this.disabled) {
            return;
        }
        if (this.isOpen()) {
            // since we're moving this menu we need to close any submenus first otherwise they end up
            // disconnected from this one.
            this.menuStack.closeSubMenuOf(this.childMenu);
            this.overlayRef.getConfig().positionStrategy.setOrigin(coordinates);
            this.overlayRef.updatePosition();
        }
        else {
            this.opened.next();
            if (this.overlayRef) {
                this.overlayRef.getConfig().positionStrategy.setOrigin(coordinates);
                this.overlayRef.updatePosition();
            }
            else {
                this.overlayRef = this._overlay.create(this._getOverlayConfig(coordinates));
            }
            this.overlayRef.attach(this.getMenuContentPortal());
            this._subscribeToOutsideClicks(ignoreFirstOutsideAuxClick);
        }
    }
}
CdkContextMenuTrigger.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: CdkContextMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkContextMenuTrigger.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0-next.1", type: CdkContextMenuTrigger, selector: "[cdkContextMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkContextMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkContextMenuPosition", "menuPosition"], menuData: ["cdkContextMenuTriggerData", "menuData"], disabled: ["cdkContextMenuDisabled", "disabled"] }, outputs: { opened: "cdkContextMenuOpened", closed: "cdkContextMenuClosed" }, host: { listeners: { "contextmenu": "_openOnContextMenu($event)" }, properties: { "attr.data-cdk-menu-stack-id": "null" } }, providers: [
        { provide: MENU_TRIGGER, useExisting: CdkContextMenuTrigger },
        { provide: MENU_STACK, useClass: MenuStack },
    ], exportAs: ["cdkContextMenuTriggerFor"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0-next.1", ngImport: i0, type: CdkContextMenuTrigger, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkContextMenuTriggerFor]',
                    exportAs: 'cdkContextMenuTriggerFor',
                    host: {
                        '[attr.data-cdk-menu-stack-id]': 'null',
                        '(contextmenu)': '_openOnContextMenu($event)',
                    },
                    inputs: [
                        'menuTemplateRef: cdkContextMenuTriggerFor',
                        'menuPosition: cdkContextMenuPosition',
                        'menuData: cdkContextMenuTriggerData',
                    ],
                    outputs: ['opened: cdkContextMenuOpened', 'closed: cdkContextMenuClosed'],
                    providers: [
                        { provide: MENU_TRIGGER, useExisting: CdkContextMenuTrigger },
                        { provide: MENU_STACK, useClass: MenuStack },
                    ],
                }]
        }], ctorParameters: function () { return []; }, propDecorators: { disabled: [{
                type: Input,
                args: ['cdkContextMenuDisabled']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC1tZW51LXRyaWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvY29udGV4dC1tZW51LXRyaWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUM5RSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUVMLE9BQU8sRUFDUCxhQUFhLEVBQ2IsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLEtBQUssRUFBRSxTQUFTLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdEMsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNuRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7O0FBRXJFLHlEQUF5RDtBQUN6RCxNQUFNLHNCQUFzQixHQUFHLGlDQUFpQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtJQUM5RSw2RkFBNkY7SUFDN0YseUZBQXlGO0lBQ3pGLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JE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cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIGluamVjdCwgSW5qZWN0YWJsZSwgSW5wdXQsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG4gIE92ZXJsYXksXG4gIE92ZXJsYXlDb25maWcsXG4gIFNUQU5EQVJEX0RST1BET1dOX0JFTE9XX1BPU0lUSU9OUyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7bWVyZ2UsIHBhcnRpdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3NraXAsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtNRU5VX1NUQUNLLCBNZW51U3RhY2t9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge0Nka01lbnVUcmlnZ2VyQmFzZSwgTUVOVV9UUklHR0VSfSBmcm9tICcuL21lbnUtdHJpZ2dlci1iYXNlJztcblxuLyoqIFRoZSBwcmVmZXJyZWQgbWVudSBwb3NpdGlvbnMgZm9yIHRoZSBjb250ZXh0IG1lbnUuICovXG5jb25zdCBDT05URVhUX01FTlVfUE9TSVRJT05TID0gU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TLm1hcChwb3NpdGlvbiA9PiB7XG4gIC8vIEluIGNhc2VzIHdoZXJlIHRoZSBmaXJzdCBtZW51IGl0ZW0gaW4gdGhlIGNvbnRleHQgbWVudSBpcyBhIHRyaWdnZXIgdGhlIHN1Ym1lbnUgb3BlbnMgb24gYVxuICAvLyBob3ZlciBldmVudC4gV2Ugb2Zmc2V0IHRoZSBjb250ZXh0IG1lbnUgMnB4IGJ5IGRlZmF1bHQgdG8gcHJldmVudCB0aGlzIGZyb20gb2NjdXJyaW5nLlxuICBjb25zdCBvZmZzZXRYID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgPyAyIDogLTI7XG4gIGNvbnN0IG9mZnNldFkgPSBwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ3RvcCcgPyAyIDogLTI7XG4gIHJldHVybiB7Li4ucG9zaXRpb24sIG9mZnNldFgsIG9mZnNldFl9O1xufSk7XG5cbi8qKiBUcmFja3MgdGhlIGxhc3Qgb3BlbiBjb250ZXh0IG1lbnUgdHJpZ2dlciBhY3Jvc3MgdGhlIGVudGlyZSBhcHBsaWNhdGlvbi4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENvbnRleHRNZW51VHJhY2tlciB7XG4gIC8qKiBUaGUgbGFzdCBvcGVuIGNvbnRleHQgbWVudSB0cmlnZ2VyLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfb3BlbkNvbnRleHRNZW51VHJpZ2dlcj86IENka0NvbnRleHRNZW51VHJpZ2dlcjtcblxuICAvKipcbiAgICogQ2xvc2UgdGhlIHByZXZpb3VzIG9wZW4gY29udGV4dCBtZW51IGFuZCBzZXQgdGhlIGdpdmVuIG9uZSBhcyBiZWluZyBvcGVuLlxuICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgdHJpZ2dlciBmb3IgdGhlIGN1cnJlbnRseSBvcGVuIENvbnRleHQgTWVudS5cbiAgICovXG4gIHVwZGF0ZSh0cmlnZ2VyOiBDZGtDb250ZXh0TWVudVRyaWdnZXIpIHtcbiAgICBpZiAoQ29udGV4dE1lbnVUcmFja2VyLl9vcGVuQ29udGV4dE1lbnVUcmlnZ2VyICE9PSB0cmlnZ2VyKSB7XG4gICAgICBDb250ZXh0TWVudVRyYWNrZXIuX29wZW5Db250ZXh0TWVudVRyaWdnZXI/LmNsb3NlKCk7XG4gICAgICBDb250ZXh0TWVudVRyYWNrZXIuX29wZW5Db250ZXh0TWVudVRyaWdnZXIgPSB0cmlnZ2VyO1xuICAgIH1cbiAgfVxufVxuXG4vKiogVGhlIGNvb3JkaW5hdGVzIHdoZXJlIHRoZSBjb250ZXh0IG1lbnUgc2hvdWxkIG9wZW4uICovXG5leHBvcnQgdHlwZSBDb250ZXh0TWVudUNvb3JkaW5hdGVzID0ge3g6IG51bWJlcjsgeTogbnVtYmVyfTtcblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IG9wZW5zIGEgbWVudSB3aGVuIGEgdXNlciByaWdodC1jbGlja3Mgd2l0aGluIGl0cyBob3N0IGVsZW1lbnQuXG4gKiBJdCBpcyBhd2FyZSBvZiBuZXN0ZWQgY29udGV4dCBtZW51cyBhbmQgd2lsbCB0cmlnZ2VyIG9ubHkgdGhlIGxvd2VzdCBsZXZlbCBub24tZGlzYWJsZWQgY29udGV4dCBtZW51LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQ29udGV4dE1lbnVUcmlnZ2VyRm9yXScsXG4gIGV4cG9ydEFzOiAnY2RrQ29udGV4dE1lbnVUcmlnZ2VyRm9yJyxcbiAgaG9zdDoge1xuICAgICdbYXR0ci5kYXRhLWNkay1tZW51LXN0YWNrLWlkXSc6ICdudWxsJyxcbiAgICAnKGNvbnRleHRtZW51KSc6ICdfb3Blbk9uQ29udGV4dE1lbnUoJGV2ZW50KScsXG4gIH0sXG4gIGlucHV0czogW1xuICAgICdtZW51VGVtcGxhdGVSZWY6IGNka0NvbnRleHRNZW51VHJpZ2dlckZvcicsXG4gICAgJ21lbnVQb3NpdGlvbjogY2RrQ29udGV4dE1lbnVQb3NpdGlvbicsXG4gICAgJ21lbnVEYXRhOiBjZGtDb250ZXh0TWVudVRyaWdnZXJEYXRhJyxcbiAgXSxcbiAgb3V0cHV0czogWydvcGVuZWQ6IGNka0NvbnRleHRNZW51T3BlbmVkJywgJ2Nsb3NlZDogY2RrQ29udGV4dE1lbnVDbG9zZWQnXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IE1FTlVfVFJJR0dFUiwgdXNlRXhpc3Rpbmc6IENka0NvbnRleHRNZW51VHJpZ2dlcn0sXG4gICAge3Byb3ZpZGU6IE1FTlVfU1RBQ0ssIHVzZUNsYXNzOiBNZW51U3RhY2t9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDb250ZXh0TWVudVRyaWdnZXIgZXh0ZW5kcyBDZGtNZW51VHJpZ2dlckJhc2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIENESyBvdmVybGF5IHNlcnZpY2UuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX292ZXJsYXkgPSBpbmplY3QoT3ZlcmxheSk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb25hbGl0eSBvZiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGlyZWN0aW9uYWxpdHkgPSBpbmplY3QoRGlyZWN0aW9uYWxpdHksIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgYXBwJ3MgY29udGV4dCBtZW51IHRyYWNraW5nIHJlZ2lzdHJ5ICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2NvbnRleHRNZW51VHJhY2tlciA9IGluamVjdChDb250ZXh0TWVudVRyYWNrZXIpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjb250ZXh0IG1lbnUgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrQ29udGV4dE1lbnVEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NldE1lbnVTdGFja0Nsb3NlTGlzdGVuZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIHRoZSBhdHRhY2hlZCBtZW51IGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAqIEBwYXJhbSBjb29yZGluYXRlcyB3aGVyZSB0byBvcGVuIHRoZSBjb250ZXh0IG1lbnVcbiAgICovXG4gIG9wZW4oY29vcmRpbmF0ZXM6IENvbnRleHRNZW51Q29vcmRpbmF0ZXMpIHtcbiAgICB0aGlzLl9vcGVuKGNvb3JkaW5hdGVzLCBmYWxzZSk7XG4gIH1cblxuICAvKiogQ2xvc2UgdGhlIGN1cnJlbnRseSBvcGVuZWQgY29udGV4dCBtZW51LiAqL1xuICBjbG9zZSgpIHtcbiAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW4gdGhlIGNvbnRleHQgbWVudSBhbmQgY2xvc2VzIGFueSBwcmV2aW91c2x5IG9wZW4gbWVudXMuXG4gICAqIEBwYXJhbSBldmVudCB0aGUgbW91c2UgZXZlbnQgd2hpY2ggb3BlbnMgdGhlIGNvbnRleHQgbWVudS5cbiAgICovXG4gIF9vcGVuT25Db250ZXh0TWVudShldmVudDogTW91c2VFdmVudCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgLy8gUHJldmVudCB0aGUgbmF0aXZlIGNvbnRleHQgbWVudSBmcm9tIG9wZW5pbmcgYmVjYXVzZSB3ZSdyZSBvcGVuaW5nIGEgY3VzdG9tIG9uZS5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIC8vIFN0b3AgZXZlbnQgcHJvcGFnYXRpb24gdG8gZW5zdXJlIHRoYXQgb25seSB0aGUgY2xvc2VzdCBlbmFibGVkIGNvbnRleHQgbWVudSBvcGVucy5cbiAgICAgIC8vIE90aGVyd2lzZSwgYW55IGNvbnRleHQgbWVudXMgYXR0YWNoZWQgdG8gY29udGFpbmluZyBlbGVtZW50cyB3b3VsZCAqYWxzbyogb3BlbixcbiAgICAgIC8vIHJlc3VsdGluZyBpbiBtdWx0aXBsZSBzdGFja2VkIGNvbnRleHQgbWVudXMgYmVpbmcgZGlzcGxheWVkLlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgIHRoaXMuX2NvbnRleHRNZW51VHJhY2tlci51cGRhdGUodGhpcyk7XG4gICAgICB0aGlzLl9vcGVuKHt4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZfSwgdHJ1ZSk7XG5cbiAgICAgIC8vIEEgY29udGV4dCBtZW51IGNhbiBiZSB0cmlnZ2VyZWQgdmlhIGEgbW91c2UgcmlnaHQgY2xpY2sgb3IgYSBrZXlib2FyZCBzaG9ydGN1dC5cbiAgICAgIGlmIChldmVudC5idXR0b24gPT09IDIpIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdtb3VzZScpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IDApIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdwcm9ncmFtJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byBjcmVhdGUgdGhlIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBjb29yZGluYXRlcyB0aGUgbG9jYXRpb24gdG8gcGxhY2UgdGhlIG9wZW5lZCBtZW51XG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Q29uZmlnKGNvb3JkaW5hdGVzOiBDb250ZXh0TWVudUNvb3JkaW5hdGVzKSB7XG4gICAgcmV0dXJuIG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3k6IHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5KGNvb3JkaW5hdGVzKSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLl9vdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpLFxuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXJlY3Rpb25hbGl0eSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBmb3IgdGhlIG92ZXJsYXkgd2hpY2ggc3BlY2lmaWVzIHdoZXJlIHRvIHBsYWNlIHRoZSBtZW51LlxuICAgKiBAcGFyYW0gY29vcmRpbmF0ZXMgdGhlIGxvY2F0aW9uIHRvIHBsYWNlIHRoZSBvcGVuZWQgbWVudVxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3koXG4gICAgY29vcmRpbmF0ZXM6IENvbnRleHRNZW51Q29vcmRpbmF0ZXMsXG4gICk6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlcbiAgICAgIC5wb3NpdGlvbigpXG4gICAgICAuZmxleGlibGVDb25uZWN0ZWRUbyhjb29yZGluYXRlcylcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24oKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKClcbiAgICAgIC53aXRoUG9zaXRpb25zKHRoaXMubWVudVBvc2l0aW9uID8/IENPTlRFWFRfTUVOVV9QT1NJVElPTlMpO1xuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgbWVudSBzdGFjayBjbG9zZSBldmVudHMgYW5kIGNsb3NlIHRoaXMgbWVudSB3aGVuIHJlcXVlc3RlZC4gKi9cbiAgcHJpdmF0ZSBfc2V0TWVudVN0YWNrQ2xvc2VMaXN0ZW5lcigpIHtcbiAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKHtpdGVtfSkgPT4ge1xuICAgICAgaWYgKGl0ZW0gPT09IHRoaXMuY2hpbGRNZW51ICYmIHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgICAgdGhpcy5jbG9zZWQubmV4dCgpO1xuICAgICAgICB0aGlzLm92ZXJsYXlSZWYhLmRldGFjaCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgb3ZlcmxheXMgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBzdHJlYW0gYW5kIGhhbmRsZSBjbG9zaW5nIG91dCB0aGUgc3RhY2sgaWYgYVxuICAgKiBjbGljayBvY2N1cnMgb3V0c2lkZSB0aGUgbWVudXMuXG4gICAqIEBwYXJhbSBpZ25vcmVGaXJzdEF1eENsaWNrIFdoZXRoZXIgdG8gaWdub3JlIHRoZSBmaXJzdCBhdXhjbGljayBldmVudCBvdXRzaWRlIHRoZSBtZW51LlxuICAgKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9PdXRzaWRlQ2xpY2tzKGlnbm9yZUZpcnN0QXV4Q2xpY2s6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICBsZXQgb3V0c2lkZUNsaWNrcyA9IHRoaXMub3ZlcmxheVJlZi5vdXRzaWRlUG9pbnRlckV2ZW50cygpO1xuICAgICAgLy8gSWYgdGhlIG1lbnUgd2FzIHRyaWdnZXJlZCBieSB0aGUgYGNvbnRleHRtZW51YCBldmVudCwgc2tpcCB0aGUgZmlyc3QgYGF1eGNsaWNrYCBldmVudFxuICAgICAgLy8gYmVjYXVzZSBpdCBmaXJlcyB3aGVuIHRoZSBtb3VzZSBpcyByZWxlYXNlZCBvbiB0aGUgc2FtZSBjbGljayB0aGF0IG9wZW5lZCB0aGUgbWVudS5cbiAgICAgIGlmIChpZ25vcmVGaXJzdEF1eENsaWNrKSB7XG4gICAgICAgIGNvbnN0IFthdXhDbGlja3MsIG5vbkF1eENsaWNrc10gPSBwYXJ0aXRpb24ob3V0c2lkZUNsaWNrcywgKHt0eXBlfSkgPT4gdHlwZSA9PT0gJ2F1eGNsaWNrJyk7XG4gICAgICAgIG91dHNpZGVDbGlja3MgPSBtZXJnZShub25BdXhDbGlja3MsIGF1eENsaWNrcy5waXBlKHNraXAoMSkpKTtcbiAgICAgIH1cbiAgICAgIG91dHNpZGVDbGlja3MucGlwZSh0YWtlVW50aWwodGhpcy5zdG9wT3V0c2lkZUNsaWNrc0xpc3RlbmVyKSkuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzRWxlbWVudEluc2lkZU1lbnVTdGFjayhldmVudC50YXJnZXQgYXMgRWxlbWVudCkpIHtcbiAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbiB0aGUgYXR0YWNoZWQgbWVudSBhdCB0aGUgc3BlY2lmaWVkIGxvY2F0aW9uLlxuICAgKiBAcGFyYW0gY29vcmRpbmF0ZXMgd2hlcmUgdG8gb3BlbiB0aGUgY29udGV4dCBtZW51XG4gICAqIEBwYXJhbSBpZ25vcmVGaXJzdE91dHNpZGVBdXhDbGljayBXaGV0aGVyIHRvIGlnbm9yZSB0aGUgZmlyc3QgYXV4Y2xpY2sgb3V0c2lkZSB0aGUgbWVudSBhZnRlciBvcGVuaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfb3Blbihjb29yZGluYXRlczogQ29udGV4dE1lbnVDb29yZGluYXRlcywgaWdub3JlRmlyc3RPdXRzaWRlQXV4Q2xpY2s6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc09wZW4oKSkge1xuICAgICAgLy8gc2luY2Ugd2UncmUgbW92aW5nIHRoaXMgbWVudSB3ZSBuZWVkIHRvIGNsb3NlIGFueSBzdWJtZW51cyBmaXJzdCBvdGhlcndpc2UgdGhleSBlbmQgdXBcbiAgICAgIC8vIGRpc2Nvbm5lY3RlZCBmcm9tIHRoaXMgb25lLlxuICAgICAgdGhpcy5tZW51U3RhY2suY2xvc2VTdWJNZW51T2YodGhpcy5jaGlsZE1lbnUhKTtcblxuICAgICAgKFxuICAgICAgICB0aGlzLm92ZXJsYXlSZWYhLmdldENvbmZpZygpLnBvc2l0aW9uU3RyYXRlZ3kgYXMgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5XG4gICAgICApLnNldE9yaWdpbihjb29yZGluYXRlcyk7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYhLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbmVkLm5leHQoKTtcblxuICAgICAgaWYgKHRoaXMub3ZlcmxheVJlZikge1xuICAgICAgICAoXG4gICAgICAgICAgdGhpcy5vdmVybGF5UmVmLmdldENvbmZpZygpLnBvc2l0aW9uU3RyYXRlZ3kgYXMgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5XG4gICAgICAgICkuc2V0T3JpZ2luKGNvb3JkaW5hdGVzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5UmVmLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm92ZXJsYXlSZWYgPSB0aGlzLl9vdmVybGF5LmNyZWF0ZSh0aGlzLl9nZXRPdmVybGF5Q29uZmlnKGNvb3JkaW5hdGVzKSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub3ZlcmxheVJlZi5hdHRhY2godGhpcy5nZXRNZW51Q29udGVudFBvcnRhbCgpKTtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvT3V0c2lkZUNsaWNrcyhpZ25vcmVGaXJzdE91dHNpZGVBdXhDbGljayk7XG4gICAgfVxuICB9XG59XG4iXX0=