/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, inject, Injectable, InjectFlags, Input } from '@angular/core';
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
ContextMenuTracker.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: ContextMenuTracker, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
ContextMenuTracker.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: ContextMenuTracker, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: ContextMenuTracker, decorators: [{
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
        this._directionality = inject(Directionality, InjectFlags.Optional);
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
CdkContextMenuTrigger.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkContextMenuTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkContextMenuTrigger.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.0", type: CdkContextMenuTrigger, selector: "[cdkContextMenuTriggerFor]", inputs: { menuTemplateRef: ["cdkContextMenuTriggerFor", "menuTemplateRef"], menuPosition: ["cdkContextMenuPosition", "menuPosition"], disabled: ["cdkContextMenuDisabled", "disabled"] }, outputs: { opened: "cdkContextMenuOpened", closed: "cdkContextMenuClosed" }, host: { listeners: { "contextmenu": "_openOnContextMenu($event)" }, properties: { "attr.data-cdk-menu-stack-id": "null" } }, providers: [
        { provide: MENU_TRIGGER, useExisting: CdkContextMenuTrigger },
        { provide: MENU_STACK, useClass: MenuStack },
    ], exportAs: ["cdkContextMenuTriggerFor"], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: CdkContextMenuTrigger, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkContextMenuTriggerFor]',
                    exportAs: 'cdkContextMenuTriggerFor',
                    host: {
                        '[attr.data-cdk-menu-stack-id]': 'null',
                        '(contextmenu)': '_openOnContextMenu($event)',
                    },
                    inputs: ['menuTemplateRef: cdkContextMenuTriggerFor', 'menuPosition: cdkContextMenuPosition'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC1tZW51LXRyaWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvY29udGV4dC1tZW51LXRyaWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDM0YsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFFTCxPQUFPLEVBQ1AsYUFBYSxFQUNiLGlDQUFpQyxHQUNsQyxNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxLQUFLLEVBQUUsU0FBUyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDbkQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDOztBQUVyRSx5REFBeUQ7QUFDekQsTUFBTSxzQkFBc0IsR0FBRyxpQ0FBaUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7SUFDOUUsNkZBQTZGO0lBQzdGLHlGQUF5RjtJQUN6RixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMs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IFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBpbmplY3QsIEluamVjdGFibGUsIEluamVjdEZsYWdzLCBJbnB1dCwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSxcbiAgT3ZlcmxheSxcbiAgT3ZlcmxheUNvbmZpZyxcbiAgU1RBTkRBUkRfRFJPUERPV05fQkVMT1dfUE9TSVRJT05TLFxufSBmcm9tICdAYW5ndWxhci9jZGsvb3ZlcmxheSc7XG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHttZXJnZSwgcGFydGl0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7c2tpcCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge01FTlVfU1RBQ0ssIE1lbnVTdGFja30gZnJvbSAnLi9tZW51LXN0YWNrJztcbmltcG9ydCB7Q2RrTWVudVRyaWdnZXJCYXNlLCBNRU5VX1RSSUdHRVJ9IGZyb20gJy4vbWVudS10cmlnZ2VyLWJhc2UnO1xuXG4vKiogVGhlIHByZWZlcnJlZCBtZW51IHBvc2l0aW9ucyBmb3IgdGhlIGNvbnRleHQgbWVudS4gKi9cbmNvbnN0IENPTlRFWFRfTUVOVV9QT1NJVElPTlMgPSBTVEFOREFSRF9EUk9QRE9XTl9CRUxPV19QT1NJVElPTlMubWFwKHBvc2l0aW9uID0+IHtcbiAgLy8gSW4gY2FzZXMgd2hlcmUgdGhlIGZpcnN0IG1lbnUgaXRlbSBpbiB0aGUgY29udGV4dCBtZW51IGlzIGEgdHJpZ2dlciB0aGUgc3VibWVudSBvcGVucyBvbiBhXG4gIC8vIGhvdmVyIGV2ZW50LiBXZSBvZmZzZXQgdGhlIGNvbnRleHQgbWVudSAycHggYnkgZGVmYXVsdCB0byBwcmV2ZW50IHRoaXMgZnJvbSBvY2N1cnJpbmcuXG4gIGNvbnN0IG9mZnNldFggPSBwb3NpdGlvbi5vdmVybGF5WCA9PT0gJ3N0YXJ0JyA/IDIgOiAtMjtcbiAgY29uc3Qgb2Zmc2V0WSA9IHBvc2l0aW9uLm92ZXJsYXlZID09PSAndG9wJyA/IDIgOiAtMjtcbiAgcmV0dXJuIHsuLi5wb3NpdGlvbiwgb2Zmc2V0WCwgb2Zmc2V0WX07XG59KTtcblxuLyoqIFRyYWNrcyB0aGUgbGFzdCBvcGVuIGNvbnRleHQgbWVudSB0cmlnZ2VyIGFjcm9zcyB0aGUgZW50aXJlIGFwcGxpY2F0aW9uLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ29udGV4dE1lbnVUcmFja2VyIHtcbiAgLyoqIFRoZSBsYXN0IG9wZW4gY29udGV4dCBtZW51IHRyaWdnZXIuICovXG4gIHByaXZhdGUgc3RhdGljIF9vcGVuQ29udGV4dE1lbnVUcmlnZ2VyPzogQ2RrQ29udGV4dE1lbnVUcmlnZ2VyO1xuXG4gIC8qKlxuICAgKiBDbG9zZSB0aGUgcHJldmlvdXMgb3BlbiBjb250ZXh0IG1lbnUgYW5kIHNldCB0aGUgZ2l2ZW4gb25lIGFzIGJlaW5nIG9wZW4uXG4gICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSB0cmlnZ2VyIGZvciB0aGUgY3VycmVudGx5IG9wZW4gQ29udGV4dCBNZW51LlxuICAgKi9cbiAgdXBkYXRlKHRyaWdnZXI6IENka0NvbnRleHRNZW51VHJpZ2dlcikge1xuICAgIGlmIChDb250ZXh0TWVudVRyYWNrZXIuX29wZW5Db250ZXh0TWVudVRyaWdnZXIgIT09IHRyaWdnZXIpIHtcbiAgICAgIENvbnRleHRNZW51VHJhY2tlci5fb3BlbkNvbnRleHRNZW51VHJpZ2dlcj8uY2xvc2UoKTtcbiAgICAgIENvbnRleHRNZW51VHJhY2tlci5fb3BlbkNvbnRleHRNZW51VHJpZ2dlciA9IHRyaWdnZXI7XG4gICAgfVxuICB9XG59XG5cbi8qKiBUaGUgY29vcmRpbmF0ZXMgd2hlcmUgdGhlIGNvbnRleHQgbWVudSBzaG91bGQgb3Blbi4gKi9cbmV4cG9ydCB0eXBlIENvbnRleHRNZW51Q29vcmRpbmF0ZXMgPSB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHRoYXQgb3BlbnMgYSBtZW51IHdoZW4gYSB1c2VyIHJpZ2h0LWNsaWNrcyB3aXRoaW4gaXRzIGhvc3QgZWxlbWVudC5cbiAqIEl0IGlzIGF3YXJlIG9mIG5lc3RlZCBjb250ZXh0IG1lbnVzIGFuZCB3aWxsIHRyaWdnZXIgb25seSB0aGUgbG93ZXN0IGxldmVsIG5vbi1kaXNhYmxlZCBjb250ZXh0IG1lbnUuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb250ZXh0TWVudVRyaWdnZXJGb3JdJyxcbiAgZXhwb3J0QXM6ICdjZGtDb250ZXh0TWVudVRyaWdnZXJGb3InLFxuICBob3N0OiB7XG4gICAgJ1thdHRyLmRhdGEtY2RrLW1lbnUtc3RhY2staWRdJzogJ251bGwnLFxuICAgICcoY29udGV4dG1lbnUpJzogJ19vcGVuT25Db250ZXh0TWVudSgkZXZlbnQpJyxcbiAgfSxcbiAgaW5wdXRzOiBbJ21lbnVUZW1wbGF0ZVJlZjogY2RrQ29udGV4dE1lbnVUcmlnZ2VyRm9yJywgJ21lbnVQb3NpdGlvbjogY2RrQ29udGV4dE1lbnVQb3NpdGlvbiddLFxuICBvdXRwdXRzOiBbJ29wZW5lZDogY2RrQ29udGV4dE1lbnVPcGVuZWQnLCAnY2xvc2VkOiBjZGtDb250ZXh0TWVudUNsb3NlZCddLFxuICBwcm92aWRlcnM6IFtcbiAgICB7cHJvdmlkZTogTUVOVV9UUklHR0VSLCB1c2VFeGlzdGluZzogQ2RrQ29udGV4dE1lbnVUcmlnZ2VyfSxcbiAgICB7cHJvdmlkZTogTUVOVV9TVEFDSywgdXNlQ2xhc3M6IE1lbnVTdGFja30sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka0NvbnRleHRNZW51VHJpZ2dlciBleHRlbmRzIENka01lbnVUcmlnZ2VyQmFzZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgQ0RLIG92ZXJsYXkgc2VydmljZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfb3ZlcmxheSA9IGluamVjdChPdmVybGF5KTtcblxuICAvKiogVGhlIGRpcmVjdGlvbmFsaXR5IG9mIHRoZSBwYWdlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9kaXJlY3Rpb25hbGl0eSA9IGluamVjdChEaXJlY3Rpb25hbGl0eSwgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuXG4gIC8qKiBUaGUgYXBwJ3MgY29udGV4dCBtZW51IHRyYWNraW5nIHJlZ2lzdHJ5ICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2NvbnRleHRNZW51VHJhY2tlciA9IGluamVjdChDb250ZXh0TWVudVRyYWNrZXIpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjb250ZXh0IG1lbnUgaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgnY2RrQ29udGV4dE1lbnVEaXNhYmxlZCcpXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NldE1lbnVTdGFja0Nsb3NlTGlzdGVuZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIHRoZSBhdHRhY2hlZCBtZW51IGF0IHRoZSBzcGVjaWZpZWQgbG9jYXRpb24uXG4gICAqIEBwYXJhbSBjb29yZGluYXRlcyB3aGVyZSB0byBvcGVuIHRoZSBjb250ZXh0IG1lbnVcbiAgICovXG4gIG9wZW4oY29vcmRpbmF0ZXM6IENvbnRleHRNZW51Q29vcmRpbmF0ZXMpIHtcbiAgICB0aGlzLl9vcGVuKGNvb3JkaW5hdGVzLCBmYWxzZSk7XG4gIH1cblxuICAvKiogQ2xvc2UgdGhlIGN1cnJlbnRseSBvcGVuZWQgY29udGV4dCBtZW51LiAqL1xuICBjbG9zZSgpIHtcbiAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW4gdGhlIGNvbnRleHQgbWVudSBhbmQgY2xvc2VzIGFueSBwcmV2aW91c2x5IG9wZW4gbWVudXMuXG4gICAqIEBwYXJhbSBldmVudCB0aGUgbW91c2UgZXZlbnQgd2hpY2ggb3BlbnMgdGhlIGNvbnRleHQgbWVudS5cbiAgICovXG4gIF9vcGVuT25Db250ZXh0TWVudShldmVudDogTW91c2VFdmVudCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgLy8gUHJldmVudCB0aGUgbmF0aXZlIGNvbnRleHQgbWVudSBmcm9tIG9wZW5pbmcgYmVjYXVzZSB3ZSdyZSBvcGVuaW5nIGEgY3VzdG9tIG9uZS5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIC8vIFN0b3AgZXZlbnQgcHJvcGFnYXRpb24gdG8gZW5zdXJlIHRoYXQgb25seSB0aGUgY2xvc2VzdCBlbmFibGVkIGNvbnRleHQgbWVudSBvcGVucy5cbiAgICAgIC8vIE90aGVyd2lzZSwgYW55IGNvbnRleHQgbWVudXMgYXR0YWNoZWQgdG8gY29udGFpbmluZyBlbGVtZW50cyB3b3VsZCAqYWxzbyogb3BlbixcbiAgICAgIC8vIHJlc3VsdGluZyBpbiBtdWx0aXBsZSBzdGFja2VkIGNvbnRleHQgbWVudXMgYmVpbmcgZGlzcGxheWVkLlxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgIHRoaXMuX2NvbnRleHRNZW51VHJhY2tlci51cGRhdGUodGhpcyk7XG4gICAgICB0aGlzLl9vcGVuKHt4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZfSwgdHJ1ZSk7XG5cbiAgICAgIC8vIEEgY29udGV4dCBtZW51IGNhbiBiZSB0cmlnZ2VyZWQgdmlhIGEgbW91c2UgcmlnaHQgY2xpY2sgb3IgYSBrZXlib2FyZCBzaG9ydGN1dC5cbiAgICAgIGlmIChldmVudC5idXR0b24gPT09IDIpIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdtb3VzZScpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IDApIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdrZXlib2FyZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGlsZE1lbnU/LmZvY3VzRmlyc3RJdGVtKCdwcm9ncmFtJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byBjcmVhdGUgdGhlIG92ZXJsYXkuXG4gICAqIEBwYXJhbSBjb29yZGluYXRlcyB0aGUgbG9jYXRpb24gdG8gcGxhY2UgdGhlIG9wZW5lZCBtZW51XG4gICAqL1xuICBwcml2YXRlIF9nZXRPdmVybGF5Q29uZmlnKGNvb3JkaW5hdGVzOiBDb250ZXh0TWVudUNvb3JkaW5hdGVzKSB7XG4gICAgcmV0dXJuIG5ldyBPdmVybGF5Q29uZmlnKHtcbiAgICAgIHBvc2l0aW9uU3RyYXRlZ3k6IHRoaXMuX2dldE92ZXJsYXlQb3NpdGlvblN0cmF0ZWd5KGNvb3JkaW5hdGVzKSxcbiAgICAgIHNjcm9sbFN0cmF0ZWd5OiB0aGlzLl9vdmVybGF5LnNjcm9sbFN0cmF0ZWdpZXMucmVwb3NpdGlvbigpLFxuICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXJlY3Rpb25hbGl0eSB8fCB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBwb3NpdGlvbiBzdHJhdGVneSBmb3IgdGhlIG92ZXJsYXkgd2hpY2ggc3BlY2lmaWVzIHdoZXJlIHRvIHBsYWNlIHRoZSBtZW51LlxuICAgKiBAcGFyYW0gY29vcmRpbmF0ZXMgdGhlIGxvY2F0aW9uIHRvIHBsYWNlIHRoZSBvcGVuZWQgbWVudVxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0T3ZlcmxheVBvc2l0aW9uU3RyYXRlZ3koXG4gICAgY29vcmRpbmF0ZXM6IENvbnRleHRNZW51Q29vcmRpbmF0ZXMsXG4gICk6IEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneSB7XG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlcbiAgICAgIC5wb3NpdGlvbigpXG4gICAgICAuZmxleGlibGVDb25uZWN0ZWRUbyhjb29yZGluYXRlcylcbiAgICAgIC53aXRoTG9ja2VkUG9zaXRpb24oKVxuICAgICAgLndpdGhHcm93QWZ0ZXJPcGVuKClcbiAgICAgIC53aXRoUG9zaXRpb25zKHRoaXMubWVudVBvc2l0aW9uID8/IENPTlRFWFRfTUVOVV9QT1NJVElPTlMpO1xuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgbWVudSBzdGFjayBjbG9zZSBldmVudHMgYW5kIGNsb3NlIHRoaXMgbWVudSB3aGVuIHJlcXVlc3RlZC4gKi9cbiAgcHJpdmF0ZSBfc2V0TWVudVN0YWNrQ2xvc2VMaXN0ZW5lcigpIHtcbiAgICB0aGlzLm1lbnVTdGFjay5jbG9zZWQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKHtpdGVtfSkgPT4ge1xuICAgICAgaWYgKGl0ZW0gPT09IHRoaXMuY2hpbGRNZW51ICYmIHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgICAgdGhpcy5jbG9zZWQubmV4dCgpO1xuICAgICAgICB0aGlzLm92ZXJsYXlSZWYhLmRldGFjaCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byB0aGUgb3ZlcmxheXMgb3V0c2lkZSBwb2ludGVyIGV2ZW50cyBzdHJlYW0gYW5kIGhhbmRsZSBjbG9zaW5nIG91dCB0aGUgc3RhY2sgaWYgYVxuICAgKiBjbGljayBvY2N1cnMgb3V0c2lkZSB0aGUgbWVudXMuXG4gICAqIEBwYXJhbSBpZ25vcmVGaXJzdEF1eENsaWNrIFdoZXRoZXIgdG8gaWdub3JlIHRoZSBmaXJzdCBhdXhjbGljayBldmVudCBvdXRzaWRlIHRoZSBtZW51LlxuICAgKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9PdXRzaWRlQ2xpY2tzKGlnbm9yZUZpcnN0QXV4Q2xpY2s6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5vdmVybGF5UmVmKSB7XG4gICAgICBsZXQgb3V0c2lkZUNsaWNrcyA9IHRoaXMub3ZlcmxheVJlZi5vdXRzaWRlUG9pbnRlckV2ZW50cygpO1xuICAgICAgLy8gSWYgdGhlIG1lbnUgd2FzIHRyaWdnZXJlZCBieSB0aGUgYGNvbnRleHRtZW51YCBldmVudCwgc2tpcCB0aGUgZmlyc3QgYGF1eGNsaWNrYCBldmVudFxuICAgICAgLy8gYmVjYXVzZSBpdCBmaXJlcyB3aGVuIHRoZSBtb3VzZSBpcyByZWxlYXNlZCBvbiB0aGUgc2FtZSBjbGljayB0aGF0IG9wZW5lZCB0aGUgbWVudS5cbiAgICAgIGlmIChpZ25vcmVGaXJzdEF1eENsaWNrKSB7XG4gICAgICAgIGNvbnN0IFthdXhDbGlja3MsIG5vbkF1eENsaWNrc10gPSBwYXJ0aXRpb24ob3V0c2lkZUNsaWNrcywgKHt0eXBlfSkgPT4gdHlwZSA9PT0gJ2F1eGNsaWNrJyk7XG4gICAgICAgIG91dHNpZGVDbGlja3MgPSBtZXJnZShub25BdXhDbGlja3MsIGF1eENsaWNrcy5waXBlKHNraXAoMSkpKTtcbiAgICAgIH1cbiAgICAgIG91dHNpZGVDbGlja3MucGlwZSh0YWtlVW50aWwodGhpcy5zdG9wT3V0c2lkZUNsaWNrc0xpc3RlbmVyKSkuc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzRWxlbWVudEluc2lkZU1lbnVTdGFjayhldmVudC50YXJnZXQgYXMgRWxlbWVudCkpIHtcbiAgICAgICAgICB0aGlzLm1lbnVTdGFjay5jbG9zZUFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbiB0aGUgYXR0YWNoZWQgbWVudSBhdCB0aGUgc3BlY2lmaWVkIGxvY2F0aW9uLlxuICAgKiBAcGFyYW0gY29vcmRpbmF0ZXMgd2hlcmUgdG8gb3BlbiB0aGUgY29udGV4dCBtZW51XG4gICAqIEBwYXJhbSBpZ25vcmVGaXJzdE91dHNpZGVBdXhDbGljayBXaGV0aGVyIHRvIGlnbm9yZSB0aGUgZmlyc3QgYXV4Y2xpY2sgb3V0c2lkZSB0aGUgbWVudSBhZnRlciBvcGVuaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfb3Blbihjb29yZGluYXRlczogQ29udGV4dE1lbnVDb29yZGluYXRlcywgaWdub3JlRmlyc3RPdXRzaWRlQXV4Q2xpY2s6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc09wZW4oKSkge1xuICAgICAgLy8gc2luY2Ugd2UncmUgbW92aW5nIHRoaXMgbWVudSB3ZSBuZWVkIHRvIGNsb3NlIGFueSBzdWJtZW51cyBmaXJzdCBvdGhlcndpc2UgdGhleSBlbmQgdXBcbiAgICAgIC8vIGRpc2Nvbm5lY3RlZCBmcm9tIHRoaXMgb25lLlxuICAgICAgdGhpcy5tZW51U3RhY2suY2xvc2VTdWJNZW51T2YodGhpcy5jaGlsZE1lbnUhKTtcblxuICAgICAgKFxuICAgICAgICB0aGlzLm92ZXJsYXlSZWYhLmdldENvbmZpZygpLnBvc2l0aW9uU3RyYXRlZ3kgYXMgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5XG4gICAgICApLnNldE9yaWdpbihjb29yZGluYXRlcyk7XG4gICAgICB0aGlzLm92ZXJsYXlSZWYhLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbmVkLm5leHQoKTtcblxuICAgICAgaWYgKHRoaXMub3ZlcmxheVJlZikge1xuICAgICAgICAoXG4gICAgICAgICAgdGhpcy5vdmVybGF5UmVmLmdldENvbmZpZygpLnBvc2l0aW9uU3RyYXRlZ3kgYXMgRmxleGlibGVDb25uZWN0ZWRQb3NpdGlvblN0cmF0ZWd5XG4gICAgICAgICkuc2V0T3JpZ2luKGNvb3JkaW5hdGVzKTtcbiAgICAgICAgdGhpcy5vdmVybGF5UmVmLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm92ZXJsYXlSZWYgPSB0aGlzLl9vdmVybGF5LmNyZWF0ZSh0aGlzLl9nZXRPdmVybGF5Q29uZmlnKGNvb3JkaW5hdGVzKSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMub3ZlcmxheVJlZi5hdHRhY2godGhpcy5nZXRNZW51Q29udGVudFBvcnRhbCgpKTtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvT3V0c2lkZUNsaWNrcyhpZ25vcmVGaXJzdE91dHNpZGVBdXhDbGljayk7XG4gICAgfVxuICB9XG59XG4iXX0=