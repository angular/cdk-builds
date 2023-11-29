/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { booleanAttribute, Directive, inject, Injectable, Input } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayConfig, STANDARD_DROPDOWN_BELOW_POSITIONS, } from '@angular/cdk/overlay';
import { _getEventTarget } from '@angular/cdk/platform';
import { merge, partition } from 'rxjs';
import { skip, takeUntil, skipWhile } from 'rxjs/operators';
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: ContextMenuTracker, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: ContextMenuTracker, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: ContextMenuTracker, decorators: [{
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
        /** Whether the context menu is disabled. */
        this.disabled = false;
        this._setMenuStackCloseListener();
    }
    /**
     * Open the attached menu at the specified location.
     * @param coordinates where to open the context menu
     */
    open(coordinates) {
        this._open(null, coordinates);
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
            this._open(event, { x: event.clientX, y: event.clientY });
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
     * @param userEvent User-generated event that opened the menu.
     */
    _subscribeToOutsideClicks(userEvent) {
        if (this.overlayRef) {
            let outsideClicks = this.overlayRef.outsidePointerEvents();
            if (userEvent) {
                const [auxClicks, nonAuxClicks] = partition(outsideClicks, ({ type }) => type === 'auxclick');
                outsideClicks = merge(
                // Using a mouse, the `contextmenu` event can fire either when pressing the right button
                // or left button + control. Most browsers won't dispatch a `click` event right after
                // a `contextmenu` event triggered by left button + control, but Safari will (see #27832).
                // This closes the menu immediately. To work around it, we check that both the triggering
                // event and the current outside click event both had the control key pressed, and that
                // that this is the first outside click event.
                nonAuxClicks.pipe(skipWhile((event, index) => userEvent.ctrlKey && index === 0 && event.ctrlKey)), 
                // If the menu was triggered by the `contextmenu` event, skip the first `auxclick` event
                // because it fires when the mouse is released on the same click that opened the menu.
                auxClicks.pipe(skip(1)));
            }
            outsideClicks.pipe(takeUntil(this.stopOutsideClicksListener)).subscribe(event => {
                if (!this.isElementInsideMenuStack(_getEventTarget(event))) {
                    this.menuStack.closeAll();
                }
            });
        }
    }
    /**
     * Open the attached menu at the specified location.
     * @param userEvent User-generated event that opened the menu
     * @param coordinates where to open the context menu
     */
    _open(userEvent, coordinates) {
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
            this._subscribeToOutsideClicks(userEvent);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkContextMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.4", type: CdkContextMenuTrigger, isStandalone: true, selector: "[cdkContextMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkContextMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkContextMenuPosition", "menuPosition"], menuData: ["cdkContextMenuTriggerData", "menuData"], disabled: ["cdkContextMenuDisabled", "disabled", booleanAttribute] }, outputs: { opened: "cdkContextMenuOpened", closed: "cdkContextMenuClosed" }, host: { listeners: { "contextmenu": "_openOnContextMenu($event)" }, properties: { "attr.data-cdk-menu-stack-id": "null" } }, providers: [
            { provide: MENU_TRIGGER, useExisting: CdkContextMenuTrigger },
            { provide: MENU_STACK, useClass: MenuStack },
        ], exportAs: ["cdkContextMenuTriggerFor"], usesInheritance: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkContextMenuTrigger, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkContextMenuTriggerFor]',
                    exportAs: 'cdkContextMenuTriggerFor',
                    standalone: true,
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
        }], ctorParameters: () => [], propDecorators: { disabled: [{
                type: Input,
                args: [{ alias: 'cdkContextMenuDisabled', transform: booleanAttribute }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC1tZW51LXRyaWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvY29udGV4dC1tZW51LXRyaWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUNoRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUVMLE9BQU8sRUFDUCxhQUFhLEVBQ2IsaUNBQWlDLEdBQ2xDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUIsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxLQUFLLEVBQUUsU0FBUyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzFELE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ25ELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQzs7QUFFckUseURBQXlEO0FBQ3pELE1BQU0sc0JBQXNCLEdBQUcsaUNBQWlDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0lBQzlFLDZGQUE2RjtJQUM3Rix5RkFBeUY7SUFDekYsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckQsT0FBTyxFQUFDLEdBQUcsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUN6QyxDQUFDLENBQUMsQ0FBQztBQUVILCtFQUErRTtBQUUvRSxNQUFNLE9BQU8sa0JBQWtCO0lBSTdCOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxPQUE4QjtRQUNuQyxJQUFJLGtCQUFrQixDQUFDLHVCQUF1QixLQUFLLE9BQU8sRUFBRTtZQUMxRCxrQkFBa0IsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUNwRCxrQkFBa0IsQ0FBQyx1QkFBdUIsR0FBRyxPQUFPLENBQUM7U0FDdEQ7SUFDSCxDQUFDOzhHQWJVLGtCQUFrQjtrSEFBbEIsa0JBQWtCLGNBRE4sTUFBTTs7MkZBQ2xCLGtCQUFrQjtrQkFEOUIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7O0FBb0JoQzs7O0dBR0c7QUFvQkgsTUFBTSxPQUFPLHFCQUFzQixTQUFRLGtCQUFrQjtJQWEzRDtRQUNFLEtBQUssRUFBRSxDQUFDO1FBYlYsK0JBQStCO1FBQ2QsYUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU1QyxzQ0FBc0M7UUFDckIsb0JBQWUsR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFFNUUsK0NBQStDO1FBQzlCLHdCQUFtQixHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRWxFLDRDQUE0QztRQUMyQixhQUFRLEdBQVksS0FBSyxDQUFDO1FBSS9GLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLENBQUMsV0FBbUM7UUFDdEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELCtDQUErQztJQUMvQyxLQUFLO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsa0JBQWtCLENBQUMsS0FBaUI7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsbUZBQW1GO1lBQ25GLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixxRkFBcUY7WUFDckYsa0ZBQWtGO1lBQ2xGLCtEQUErRDtZQUMvRCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFeEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQztZQUV4RCxrRkFBa0Y7WUFDbEYsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDekM7aUJBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDN0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDNUM7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDM0M7U0FDRjtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSyxpQkFBaUIsQ0FBQyxXQUFtQztRQUMzRCxPQUFPLElBQUksYUFBYSxDQUFDO1lBQ3ZCLGdCQUFnQixFQUFFLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLENBQUM7WUFDL0QsY0FBYyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFO1lBQzNELFNBQVMsRUFBRSxJQUFJLENBQUMsZUFBZSxJQUFJLFNBQVM7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7T0FHRztJQUNLLDJCQUEyQixDQUNqQyxXQUFtQztRQUVuQyxPQUFPLElBQUksQ0FBQyxRQUFRO2FBQ2pCLFFBQVEsRUFBRTthQUNWLG1CQUFtQixDQUFDLFdBQVcsQ0FBQzthQUNoQyxrQkFBa0IsRUFBRTthQUNwQixpQkFBaUIsRUFBRTthQUNuQixhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxtRkFBbUY7SUFDM0UsMEJBQTBCO1FBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFFO1lBQ3pFLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsVUFBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQzNCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLHlCQUF5QixDQUFDLFNBQTRCO1FBQzVELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFFM0QsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsTUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsR0FBRyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RixhQUFhLEdBQUcsS0FBSztnQkFDbkIsd0ZBQXdGO2dCQUN4RixxRkFBcUY7Z0JBQ3JGLDBGQUEwRjtnQkFDMUYseUZBQXlGO2dCQUN6Rix1RkFBdUY7Z0JBQ3ZGLDhDQUE4QztnQkFDOUMsWUFBWSxDQUFDLElBQUksQ0FDZixTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUMvRTtnQkFFRCx3RkFBd0Y7Z0JBQ3hGLHNGQUFzRjtnQkFDdEYsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDeEIsQ0FBQzthQUNIO1lBRUQsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzlFLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBRSxDQUFDLEVBQUU7b0JBQzNELElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7aUJBQzNCO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssS0FBSyxDQUFDLFNBQTRCLEVBQUUsV0FBbUM7UUFDN0UsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUNELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2pCLHlGQUF5RjtZQUN6Riw4QkFBOEI7WUFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVUsQ0FBQyxDQUFDO1lBRzdDLElBQUksQ0FBQyxVQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsZ0JBQzlCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxVQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDbkM7YUFBTTtZQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFbkIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUVqQixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLGdCQUM3QixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQzthQUNsQztpQkFBTTtnQkFDTCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2FBQzdFO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMseUJBQXlCLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDM0M7SUFDSCxDQUFDOzhHQXJLVSxxQkFBcUI7a0dBQXJCLHFCQUFxQiwwU0FXb0IsZ0JBQWdCLDBOQWhCekQ7WUFDVCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFDO1lBQzNELEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDO1NBQzNDOzsyRkFFVSxxQkFBcUI7a0JBbkJqQyxTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSw0QkFBNEI7b0JBQ3RDLFFBQVEsRUFBRSwwQkFBMEI7b0JBQ3BDLFVBQVUsRUFBRSxJQUFJO29CQUNoQixJQUFJLEVBQUU7d0JBQ0osK0JBQStCLEVBQUUsTUFBTTt3QkFDdkMsZUFBZSxFQUFFLDRCQUE0QjtxQkFDOUM7b0JBQ0QsTUFBTSxFQUFFO3dCQUNOLDJDQUEyQzt3QkFDM0Msc0NBQXNDO3dCQUN0QyxxQ0FBcUM7cUJBQ3RDO29CQUNELE9BQU8sRUFBRSxDQUFDLDhCQUE4QixFQUFFLDhCQUE4QixDQUFDO29CQUN6RSxTQUFTLEVBQUU7d0JBQ1QsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFdBQVcsdUJBQXVCLEVBQUM7d0JBQzNELEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDO3FCQUMzQztpQkFDRjt3REFZd0UsUUFBUTtzQkFBOUUsS0FBSzt1QkFBQyxFQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtib29sZWFuQXR0cmlidXRlLCBEaXJlY3RpdmUsIGluamVjdCwgSW5qZWN0YWJsZSwgSW5wdXQsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG4gIE92ZXJsYXksXG4gIE92ZXJsYXlDb25maWcsXG4gIFNUQU5EQVJEX0RST1BET1dOX0JFTE9XX1BPU0lUSU9OUyxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL292ZXJsYXknO1xuaW1wb3J0IHtfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge21lcmdlLCBwYXJ0aXRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtza2lwLCB0YWtlVW50aWwsIHNraXBXaGlsZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtNRU5VX1NUQUNLLCBNZW51U3RhY2t9IGZyb20gJy4vbWVudS1zdGFjayc7XG5pbXBvcnQge0Nka01lbnVUcmlnZ2VyQmFzZSwgTUVOVV9UUklHR0VSfSBmcm9tICcuL21lbnUtdHJpZ2dlci1iYXNlJztcblxuLyoqIFRoZSBwcmVmZXJyZWQgbWVudSBwb3NpdGlvbnMgZm9yIHRoZSBjb250ZXh0IG1lbnUuICovXG5jb25zdCBDT05URVhUX01FTlVfUE9TSVRJT05TID0gU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TLm1hcChwb3NpdGlvbiA9PiB7XG4gIC8vIEluIGNhc2VzIHdoZXJlIHRoZSBmaXJzdCBtZW51IGl0ZW0gaW4gdGhlIGNvbnRleHQgbWVudSBpcyBhIHRyaWdnZXIgdGhlIHN1Ym1lbnUgb3BlbnMgb24gYVxuICAvLyBob3ZlciBldmVudC4gV2Ugb2Zmc2V0IHRoZSBjb250ZXh0IG1lbnUgMnB4IGJ5IGRlZmF1bHQgdG8gcHJldmVudCB0aGlzIGZyb20gb2NjdXJyaW5nLlxuICBjb25zdCBvZmZzZXRYID0gcG9zaXRpb24ub3ZlcmxheVggPT09ICdzdGFydCcgPyAyIDogLTI7XG4gIGNvbnN0IG9mZnNldFkgPSBwb3NpdGlvbi5vdmVybGF5WSA9PT0gJ3RvcCcgPyAyIDogLTI7XG4gIHJldHVybiB7Li4ucG9zaXRpb24sIG9mZnNldFgsIG9mZnNldFl9O1xufSk7XG5cbi8qKiBUcmFja3MgdGhlIGxhc3Qgb3BlbiBjb250ZXh0IG1lbnUgdHJpZ2dlciBhY3Jvc3MgdGhlIGVudGlyZSBhcHBsaWNhdGlvbi4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENvbnRleHRNZW51VHJhY2tlciB7XG4gIC8qKiBUaGUgbGFzdCBvcGVuIGNvbnRleHQgbWVudSB0cmlnZ2VyLiAqL1xuICBwcml2YXRlIHN0YXRpYyBfb3BlbkNvbnRleHRNZW51VHJpZ2dlcj86IENka0NvbnRleHRNZW51VHJpZ2dlcjtcblxuICAvKipcbiAgICogQ2xvc2UgdGhlIHByZXZpb3VzIG9wZW4gY29udGV4dCBtZW51IGFuZCBzZXQgdGhlIGdpdmVuIG9uZSBhcyBiZWluZyBvcGVuLlxuICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgdHJpZ2dlciBmb3IgdGhlIGN1cnJlbnRseSBvcGVuIENvbnRleHQgTWVudS5cbiAgICovXG4gIHVwZGF0ZSh0cmlnZ2VyOiBDZGtDb250ZXh0TWVudVRyaWdnZXIpIHtcbiAgICBpZiAoQ29udGV4dE1lbnVUcmFja2VyLl9vcGVuQ29udGV4dE1lbnVUcmlnZ2VyICE9PSB0cmlnZ2VyKSB7XG4gICAgICBDb250ZXh0TWVudVRyYWNrZXIuX29wZW5Db250ZXh0TWVudVRyaWdnZXI/LmNsb3NlKCk7XG4gICAgICBDb250ZXh0TWVudVRyYWNrZXIuX29wZW5Db250ZXh0TWVudVRyaWdnZXIgPSB0cmlnZ2VyO1xuICAgIH1cbiAgfVxufVxuXG4vKiogVGhlIGNvb3JkaW5hdGVzIHdoZXJlIHRoZSBjb250ZXh0IG1lbnUgc2hvdWxkIG9wZW4uICovXG5leHBvcnQgdHlwZSBDb250ZXh0TWVudUNvb3JkaW5hdGVzID0ge3g6IG51bWJlcjsgeTogbnVtYmVyfTtcblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IG9wZW5zIGEgbWVudSB3aGVuIGEgdXNlciByaWdodC1jbGlja3Mgd2l0aGluIGl0cyBob3N0IGVsZW1lbnQuXG4gKiBJdCBpcyBhd2FyZSBvZiBuZXN0ZWQgY29udGV4dCBtZW51cyBhbmQgd2lsbCB0cmlnZ2VyIG9ubHkgdGhlIGxvd2VzdCBsZXZlbCBub24tZGlzYWJsZWQgY29udGV4dCBtZW51LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQ29udGV4dE1lbnVUcmlnZ2VyRm9yXScsXG4gIGV4cG9ydEFzOiAnY2RrQ29udGV4dE1lbnVUcmlnZ2VyRm9yJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaG9zdDoge1xuICAgICdbYXR0ci5kYXRhLWNkay1tZW51LXN0YWNrLWlkXSc6ICdudWxsJyxcbiAgICAnKGNvbnRleHRtZW51KSc6ICdfb3Blbk9uQ29udGV4dE1lbnUoJGV2ZW50KScsXG4gIH0sXG4gIGlucHV0czogW1xuICAgICdtZW51VGVtcGxhdGVSZWY6IGNka0NvbnRleHRNZW51VHJpZ2dlckZvcicsXG4gICAgJ21lbnVQb3NpdGlvbjogY2RrQ29udGV4dE1lbnVQb3NpdGlvbicsXG4gICAgJ21lbnVEYXRhOiBjZGtDb250ZXh0TWVudVRyaWdnZXJEYXRhJyxcbiAgXSxcbiAgb3V0cHV0czogWydvcGVuZWQ6IGNka0NvbnRleHRNZW51T3BlbmVkJywgJ2Nsb3NlZDogY2RrQ29udGV4dE1lbnVDbG9zZWQnXSxcbiAgcHJvdmlkZXJzOiBbXG4gICAge3Byb3ZpZGU6IE1FTlVfVFJJR0dFUiwgdXNlRXhpc3Rpbmc6IENka0NvbnRleHRNZW51VHJpZ2dlcn0sXG4gICAge3Byb3ZpZGU6IE1FTlVfU1RBQ0ssIHVzZUNsYXNzOiBNZW51U3RhY2t9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtDb250ZXh0TWVudVRyaWdnZXIgZXh0ZW5kcyBDZGtNZW51VHJpZ2dlckJhc2UgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIENESyBvdmVybGF5IHNlcnZpY2UuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX292ZXJsYXkgPSBpbmplY3QoT3ZlcmxheSk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb25hbGl0eSBvZiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGlyZWN0aW9uYWxpdHkgPSBpbmplY3QoRGlyZWN0aW9uYWxpdHksIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBUaGUgYXBwJ3MgY29udGV4dCBtZW51IHRyYWNraW5nIHJlZ2lzdHJ5ICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2NvbnRleHRNZW51VHJhY2tlciA9IGluamVjdChDb250ZXh0TWVudVRyYWNrZXIpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjb250ZXh0IG1lbnUgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtDb250ZXh0TWVudURpc2FibGVkJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSkgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NldE1lbnVTdGFja0Nsb3NlTGlzdGVuZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIHRoZSBhdHRhY2hlZCBtZW51IGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAqIEBwYXJhbSBjb29yZGluYXRlcyB3aGVyZSB0byBvcGVuIHRoZSBjb250ZXh0IG1lbnVcbiAgICovXG4gIG9wZW4oY29vcmRpbmF0ZXM6IENvbnRleHRNZW51Q29vcmRpbmF0ZXMpIHtcbiAgICB0aGlzLl9vcGVuKG51bGwsIGNvb3JkaW5hdGVzKTtcbiAgfVxuXG4gIC8qKiBDbG9zZSB0aGUgY3VycmVudGx5IG9wZW5lZCBjb250ZXh0IG1lbnUuICovXG4gIGNsb3NlKCkge1xuICAgIHRoaXMubWVudVN0YWNrLmNsb3NlQWxsKCk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbiB0aGUgY29udGV4dCBtZW51IGFuZCBjbG9zZXMgYW55IHByZXZpb3VzbHkgb3BlbiBtZW51cy5cbiAgICogQHBhcmFtIGV2ZW50IHRoZSBtb3VzZSBldmVudCB3aGljaCBvcGVucyB0aGUgY29udGV4dCBtZW51LlxuICAgKi9cbiAgX29wZW5PbkNvbnRleHRNZW51KGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAvLyBQcmV2ZW50IHRoZSBuYXRpdmUgY29udGV4dCBtZW51IGZyb20gb3BlbmluZyBiZWNhdXNlIHdlJ3JlIG9wZW5pbmcgYSBjdXN0b20gb25lLlxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgLy8gU3RvcCBldmVudCBwcm9wYWdhdGlvbiB0byBlbnN1cmUgdGhhdCBvbmx5IHRoZSBjbG9zZXN0IGVuYWJsZWQgY29udGV4dCBtZW51IG9wZW5zLlxuICAgICAgLy8gT3RoZXJ3aXNlLCBhbnkgY29udGV4dCBtZW51cyBhdHRhY2hlZCB0byBjb250YWluaW5nIGVsZW1lbnRzIHdvdWxkICphbHNvKiBvcGVuLFxuICAgICAgLy8gcmVzdWx0aW5nIGluIG11bHRpcGxlIHN0YWNrZWQgY29udGV4dCBtZW51cyBiZWluZyBkaXNwbGF5ZWQuXG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgdGhpcy5fY29udGV4dE1lbnVUcmFja2VyLnVwZGF0ZSh0aGlzKTtcbiAgICAgIHRoaXMuX29wZW4oZXZlbnQsIHt4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZfSk7XG5cbiAgICAgIC8vIEEgY29udGV4dCBtZW51IGNhbiBiZSB0cmlnZ2VyZWQgdmlhIGEgbW91c2UgcmlnaHQgY2xpY2sgb3IgYSBrZXlib2FyZCBzaG9ydGN1dC5cbiAgICAgIGlmIChldmVudC5idXR0b24gPT09IDIpIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdtb3VzZScpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IDApIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdwcm9ncmFtJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byBjcmVhdGUgdGhlIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBjb29yZGluYXRlcyB0aGUgbG9jYXRpb24gdG8gcGxhY2UgdGhlIG9wZW5lZCBtZW51XG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Q29uZmlnKGNvb3JkaW5hdGVzOiBDb250ZXh0TWVudUNvb3JkaW5hdGVzKSB7XG4gICAgcmV0dXJuIG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3k6IHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5KGNvb3JkaW5hdGVzKSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLl9vdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpLFxuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXJlY3Rpb25hbGl0eSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBmb3IgdGhlIG92ZXJsYXkgd2hpY2ggc3BlY2lmaWVzIHdoZXJlIHRvIHBsYWNlIHRoZSBtZW51LlxuICAgKiBAcGFyYW0gY29vcmRpbmF0ZXMgdGhlIGxvY2F0aW9uIHRvIHBsYWNlIHRoZSBvcGVuZWQgbWVudVxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3koXG4gICAgY29vcmRpbmF0ZXM6IENvbnRleHRNZW51Q29vcmRpbmF0ZXMsXG4gICk6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlcbiAgICAgIC5wb3NpdGlvbigpXG4gICAgICAuZmxleGlibGVDb25uZWN0ZWRUbyhjb29yZGluYXRlcylcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24oKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKClcbiAgICAgIC53aXRoUG9zaXRpb25zKHRoaXMubWVudVBvc2l0aW9uID8/IENPTlRFWFRfTUVOVV9QT1NJVElPTlMpO1xuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgbWVudSBzdGFjayBjbG9zZSBldmVudHMgYW5kIGNsb3NlIHRoaXMgbWVudSB3aGVuIHJlcXVlc3RlZC4gKi9cbiAgcHJpdmF0ZSBfc2V0TWVudVN0YWNrQ2xvc2VMaXN0ZW5lcigpIHtcbiAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKHtpdGVtfSkgPT4ge1xuICAgICAgaWYgKGl0ZW0gPT09IHRoaXMuY2hpbGRNZW51ICYmIHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgICAgdGhpcy5jbG9zZWQubmV4dCgpO1xuICAgICAgICB0aGlzLm92ZXJsYXlSZWYhLmRldGFjaCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgb3ZlcmxheXMgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBzdHJlYW0gYW5kIGhhbmRsZSBjbG9zaW5nIG91dCB0aGUgc3RhY2sgaWYgYVxuICAgKiBjbGljayBvY2N1cnMgb3V0c2lkZSB0aGUgbWVudXMuXG4gICAqIEBwYXJhbSB1c2VyRXZlbnQgVXNlci1nZW5lcmF0ZWQgZXZlbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXG4gICAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb091dHNpZGVDbGlja3ModXNlckV2ZW50OiBNb3VzZUV2ZW50IHwgbnVsbCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXlSZWYpIHtcbiAgICAgIGxldCBvdXRzaWRlQ2xpY2tzID0gdGhpcy5vdmVybGF5UmVmLm91dHNpZGVQb2ludGVyRXZlbnRzKCk7XG5cbiAgICAgIGlmICh1c2VyRXZlbnQpIHtcbiAgICAgICAgY29uc3QgW2F1eENsaWNrcywgbm9uQXV4Q2xpY2tzXSA9IHBhcnRpdGlvbihvdXRzaWRlQ2xpY2tzLCAoe3R5cGV9KSA9PiB0eXBlID09PSAnYXV4Y2xpY2snKTtcbiAgICAgICAgb3V0c2lkZUNsaWNrcyA9IG1lcmdlKFxuICAgICAgICAgIC8vIFVzaW5nIGEgbW91c2UsIHRoZSBgY29udGV4dG1lbnVgIGV2ZW50IGNhbiBmaXJlIGVpdGhlciB3aGVuIHByZXNzaW5nIHRoZSByaWdodCBidXR0b25cbiAgICAgICAgICAvLyBvciBsZWZ0IGJ1dHRvbiArIGNvbnRyb2wuIE1vc3QgYnJvd3NlcnMgd29uJ3QgZGlzcGF0Y2ggYSBgY2xpY2tgIGV2ZW50IHJpZ2h0IGFmdGVyXG4gICAgICAgICAgLy8gYSBgY29udGV4dG1lbnVgIGV2ZW50IHRyaWdnZXJlZCBieSBsZWZ0IGJ1dHRvbiArIGNvbnRyb2wsIGJ1dCBTYWZhcmkgd2lsbCAoc2VlICMyNzgzMikuXG4gICAgICAgICAgLy8gVGhpcyBjbG9zZXMgdGhlIG1lbnUgaW1tZWRpYXRlbHkuIFRvIHdvcmsgYXJvdW5kIGl0LCB3ZSBjaGVjayB0aGF0IGJvdGggdGhlIHRyaWdnZXJpbmdcbiAgICAgICAgICAvLyBldmVudCBhbmQgdGhlIGN1cnJlbnQgb3V0c2lkZSBjbGljayBldmVudCBib3RoIGhhZCB0aGUgY29udHJvbCBrZXkgcHJlc3NlZCwgYW5kIHRoYXRcbiAgICAgICAgICAvLyB0aGF0IHRoaXMgaXMgdGhlIGZpcnN0IG91dHNpZGUgY2xpY2sgZXZlbnQuXG4gICAgICAgICAgbm9uQXV4Q2xpY2tzLnBpcGUoXG4gICAgICAgICAgICBza2lwV2hpbGUoKGV2ZW50LCBpbmRleCkgPT4gdXNlckV2ZW50LmN0cmxLZXkgJiYgaW5kZXggPT09IDAgJiYgZXZlbnQuY3RybEtleSksXG4gICAgICAgICAgKSxcblxuICAgICAgICAgIC8vIElmIHRoZSBtZW51IHdhcyB0cmlnZ2VyZWQgYnkgdGhlIGBjb250ZXh0bWVudWAgZXZlbnQsIHNraXAgdGhlIGZpcnN0IGBhdXhjbGlja2AgZXZlbnRcbiAgICAgICAgICAvLyBiZWNhdXNlIGl0IGZpcmVzIHdoZW4gdGhlIG1vdXNlIGlzIHJlbGVhc2VkIG9uIHRoZSBzYW1lIGNsaWNrIHRoYXQgb3BlbmVkIHRoZSBtZW51LlxuICAgICAgICAgIGF1eENsaWNrcy5waXBlKHNraXAoMSkpLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBvdXRzaWRlQ2xpY2tzLnBpcGUodGFrZVVudGlsKHRoaXMuc3RvcE91dHNpZGVDbGlja3NMaXN0ZW5lcikpLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgIGlmICghdGhpcy5pc0VsZW1lbnRJbnNpZGVNZW51U3RhY2soX2dldEV2ZW50VGFyZ2V0KGV2ZW50KSEpKSB7XG4gICAgICAgICAgdGhpcy5tZW51U3RhY2suY2xvc2VBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW4gdGhlIGF0dGFjaGVkIG1lbnUgYXQgdGhlIHNwZWNpZmllZCBsb2NhdGlvbi5cbiAgICogQHBhcmFtIHVzZXJFdmVudCBVc2VyLWdlbmVyYXRlZCBldmVudCB0aGF0IG9wZW5lZCB0aGUgbWVudVxuICAgKiBAcGFyYW0gY29vcmRpbmF0ZXMgd2hlcmUgdG8gb3BlbiB0aGUgY29udGV4dCBtZW51XG4gICAqL1xuICBwcml2YXRlIF9vcGVuKHVzZXJFdmVudDogTW91c2VFdmVudCB8IG51bGwsIGNvb3JkaW5hdGVzOiBDb250ZXh0TWVudUNvb3JkaW5hdGVzKSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgIC8vIHNpbmNlIHdlJ3JlIG1vdmluZyB0aGlzIG1lbnUgd2UgbmVlZCB0byBjbG9zZSBhbnkgc3VibWVudXMgZmlyc3Qgb3RoZXJ3aXNlIHRoZXkgZW5kIHVwXG4gICAgICAvLyBkaXNjb25uZWN0ZWQgZnJvbSB0aGlzIG9uZS5cbiAgICAgIHRoaXMubWVudVN0YWNrLmNsb3NlU3ViTWVudU9mKHRoaXMuY2hpbGRNZW51ISk7XG5cbiAgICAgIChcbiAgICAgICAgdGhpcy5vdmVybGF5UmVmIS5nZXRDb25maWcoKS5wb3NpdGlvblN0cmF0ZWd5IGFzIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneVxuICAgICAgKS5zZXRPcmlnaW4oY29vcmRpbmF0ZXMpO1xuICAgICAgdGhpcy5vdmVybGF5UmVmIS51cGRhdGVQb3NpdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZW5lZC5uZXh0KCk7XG5cbiAgICAgIGlmICh0aGlzLm92ZXJsYXlSZWYpIHtcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMub3ZlcmxheVJlZi5nZXRDb25maWcoKS5wb3NpdGlvblN0cmF0ZWd5IGFzIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneVxuICAgICAgICApLnNldE9yaWdpbihjb29yZGluYXRlcyk7XG4gICAgICAgIHRoaXMub3ZlcmxheVJlZi51cGRhdGVQb3NpdGlvbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vdmVybGF5UmVmID0gdGhpcy5fb3ZlcmxheS5jcmVhdGUodGhpcy5fZ2V0T3ZlcmxheUNvbmZpZyhjb29yZGluYXRlcykpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm92ZXJsYXlSZWYuYXR0YWNoKHRoaXMuZ2V0TWVudUNvbnRlbnRQb3J0YWwoKSk7XG4gICAgICB0aGlzLl9zdWJzY3JpYmVUb091dHNpZGVDbGlja3ModXNlckV2ZW50KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==