/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CdkMenuGroup } from './menu-group';
import { ContentChildren, Directive, ElementRef, inject, InjectFlags, Input, NgZone, QueryList, } from '@angular/core';
import { FocusKeyManager } from '@angular/cdk/a11y';
import { CdkMenuItem } from './menu-item';
import { merge, Subject } from 'rxjs';
import { Directionality } from '@angular/cdk/bidi';
import { mapTo, mergeAll, mergeMap, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { MENU_STACK } from './menu-stack';
import { PointerFocusTracker } from './pointer-focus-tracker';
import { MENU_AIM } from './menu-aim';
import * as i0 from "@angular/core";
/** Counter used to create unique IDs for menus. */
let nextId = 0;
/**
 * Abstract directive that implements shared logic common to all menus.
 * This class can be extended to create custom menu types.
 */
export class CdkMenuBase extends CdkMenuGroup {
    constructor() {
        super(...arguments);
        /** The menu's native DOM host element. */
        this.nativeElement = inject(ElementRef).nativeElement;
        /** The Angular zone. */
        this.ngZone = inject(NgZone);
        /** The stack of menus this menu belongs to. */
        this.menuStack = inject(MENU_STACK);
        /** The menu aim service used by this menu. */
        this.menuAim = inject(MENU_AIM, InjectFlags.Optional | InjectFlags.Self);
        /** The directionality (text direction) of the current page. */
        this.dir = inject(Directionality, InjectFlags.Optional);
        /** The id of the menu's host element. */
        this.id = `cdk-menu-${nextId++}`;
        /** The direction items in the menu flow. */
        this.orientation = 'vertical';
        /**
         * Whether the menu is displayed inline (i.e. always present vs a conditional popup that the
         * user triggers with a trigger element).
         */
        this.isInline = false;
        /** Emits when the MenuBar is destroyed. */
        this.destroyed = new Subject();
        /** Whether this menu's menu stack has focus. */
        this._menuStackHasFocus = false;
    }
    ngAfterContentInit() {
        if (!this.isInline) {
            this.menuStack.push(this);
        }
        this._setKeyManager();
        this._subscribeToMenuStackHasFocus();
        this._subscribeToMenuOpen();
        this._subscribeToMenuStackClosed();
        this._setUpPointerTracker();
    }
    ngOnDestroy() {
        this.destroyed.next();
        this.destroyed.complete();
        this.pointerTracker?.destroy();
    }
    /**
     * Place focus on the first MenuItem in the menu and set the focus origin.
     * @param focusOrigin The origin input mode of the focus event.
     */
    focusFirstItem(focusOrigin = 'program') {
        this.keyManager.setFocusOrigin(focusOrigin);
        this.keyManager.setFirstItemActive();
    }
    /**
     * Place focus on the last MenuItem in the menu and set the focus origin.
     * @param focusOrigin The origin input mode of the focus event.
     */
    focusLastItem(focusOrigin = 'program') {
        this.keyManager.setFocusOrigin(focusOrigin);
        this.keyManager.setLastItemActive();
    }
    /** Gets the tabindex for this menu. */
    _getTabIndex() {
        const tabindexIfInline = this._menuStackHasFocus ? -1 : 0;
        return this.isInline ? tabindexIfInline : null;
    }
    /**
     * Close the open menu if the current active item opened the requested MenuStackItem.
     * @param menu The menu requested to be closed.
     * @param options Options to configure the behavior on close.
     *   - `focusParentTrigger` Whether to focus the parent trigger after closing the menu.
     */
    closeOpenMenu(menu, options) {
        const { focusParentTrigger } = { ...options };
        const keyManager = this.keyManager;
        const trigger = this.triggerItem;
        if (menu === trigger?.getMenuTrigger()?.getMenu()) {
            trigger?.getMenuTrigger()?.close();
            // If the user has moused over a sibling item we want to focus the element under mouse focus
            // not the trigger which previously opened the now closed menu.
            if (focusParentTrigger) {
                if (trigger) {
                    keyManager.setActiveItem(trigger);
                }
                else {
                    keyManager.setFirstItemActive();
                }
            }
        }
    }
    /** Setup the FocusKeyManager with the correct orientation for the menu. */
    _setKeyManager() {
        this.keyManager = new FocusKeyManager(this.items).withWrap().withTypeAhead().withHomeAndEnd();
        if (this.orientation === 'horizontal') {
            this.keyManager.withHorizontalOrientation(this.dir?.value || 'ltr');
        }
        else {
            this.keyManager.withVerticalOrientation();
        }
    }
    /**
     * Subscribe to the menu trigger's open events in order to track the trigger which opened the menu
     * and stop tracking it when the menu is closed.
     */
    _subscribeToMenuOpen() {
        const exitCondition = merge(this.items.changes, this.destroyed);
        this.items.changes
            .pipe(startWith(this.items), mergeMap((list) => list
            .filter(item => item.hasMenu)
            .map(item => item.getMenuTrigger().opened.pipe(mapTo(item), takeUntil(exitCondition)))), mergeAll(), switchMap((item) => {
            this.triggerItem = item;
            return item.getMenuTrigger().closed;
        }), takeUntil(this.destroyed))
            .subscribe(() => (this.triggerItem = undefined));
    }
    /** Subscribe to the MenuStack close events. */
    _subscribeToMenuStackClosed() {
        this.menuStack.closed
            .pipe(takeUntil(this.destroyed))
            .subscribe(({ item, focusParentTrigger }) => this.closeOpenMenu(item, { focusParentTrigger }));
    }
    /** Subscribe to the MenuStack hasFocus events. */
    _subscribeToMenuStackHasFocus() {
        if (this.isInline) {
            this.menuStack.hasFocus.pipe(takeUntil(this.destroyed)).subscribe(hasFocus => {
                this._menuStackHasFocus = hasFocus;
            });
        }
    }
    /**
     * Set the PointerFocusTracker and ensure that when mouse focus changes the key manager is updated
     * with the latest menu item under mouse focus.
     */
    _setUpPointerTracker() {
        if (this.menuAim) {
            this.ngZone.runOutsideAngular(() => {
                this.pointerTracker = new PointerFocusTracker(this.items);
            });
            this.menuAim.initialize(this, this.pointerTracker);
        }
    }
}
CdkMenuBase.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuBase, deps: null, target: i0.ɵɵFactoryTarget.Directive });
CdkMenuBase.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.0.0-rc.1", type: CdkMenuBase, inputs: { id: "id" }, host: { attributes: { "role": "menu" }, listeners: { "focus": "focusFirstItem()", "focusin": "menuStack.setHasFocus(true)", "focusout": "menuStack.setHasFocus(false)" }, properties: { "tabindex": "_getTabIndex()", "id": "id", "attr.aria-orientation": "orientation", "attr.data-cdk-menu-stack-id": "menuStack.id" } }, queries: [{ propertyName: "items", predicate: CdkMenuItem, descendants: true }], usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkMenuBase, decorators: [{
            type: Directive,
            args: [{
                    host: {
                        'role': 'menu',
                        'class': '',
                        '[tabindex]': '_getTabIndex()',
                        '[id]': 'id',
                        '[attr.aria-orientation]': 'orientation',
                        '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
                        '(focus)': 'focusFirstItem()',
                        '(focusin)': 'menuStack.setHasFocus(true)',
                        '(focusout)': 'menuStack.setHasFocus(false)',
                    },
                }]
        }], propDecorators: { id: [{
                type: Input
            }], items: [{
                type: ContentChildren,
                args: [CdkMenuItem, { descendants: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1iYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9tZW51L21lbnUtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFDLE9BQU8sRUFFTCxlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sV0FBVyxFQUNYLEtBQUssRUFDTCxNQUFNLEVBRU4sU0FBUyxHQUNWLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxlQUFlLEVBQWMsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxRixPQUFPLEVBQUMsVUFBVSxFQUEyQixNQUFNLGNBQWMsQ0FBQztBQUVsRSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDOztBQUVwQyxtREFBbUQ7QUFDbkQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBRWY7OztHQUdHO0FBY0gsTUFBTSxPQUFnQixXQUNwQixTQUFRLFlBQVk7SUFkdEI7O1FBaUJFLDBDQUEwQztRQUNqQyxrQkFBYSxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsYUFBYSxDQUFDO1FBRXZFLHdCQUF3QjtRQUNkLFdBQU0sR0FBRyxNQUFNLENBQUMsTUFB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QUFFLElBQUksQ0FBQyxjQUFlLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7OzZHQWpMbUIsV0FBVztpR0FBWCxXQUFXLG1ZQXVCZCxXQUFXO2dHQXZCUixXQUFXO2tCQWJoQyxTQUFTO21CQUFDO29CQUNULElBQUksRUFBRTt3QkFDSixNQUFNLEVBQUUsTUFBTTt3QkFDZCxPQUFPLEVBQUUsRUFBRTt3QkFDWCxZQUFZLEVBQUUsZ0JBQWdCO3dCQUM5QixNQUFNLEVBQUUsSUFBSTt3QkFDWix5QkFBeUIsRUFBRSxhQUFhO3dCQUN4QywrQkFBK0IsRUFBRSxjQUFjO3dCQUMvQyxTQUFTLEVBQUUsa0JBQWtCO3dCQUM3QixXQUFXLEVBQUUsNkJBQTZCO3dCQUMxQyxZQUFZLEVBQUUsOEJBQThCO3FCQUM3QztpQkFDRjs4QkFxQlUsRUFBRTtzQkFBVixLQUFLO2dCQUlHLEtBQUs7c0JBRGIsZUFBZTt1QkFBQyxXQUFXLEVBQUUsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2RrTWVudUdyb3VwfSBmcm9tICcuL21lbnUtZ3JvdXAnO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIGluamVjdCxcbiAgSW5qZWN0RmxhZ3MsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgUXVlcnlMaXN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Rm9jdXNLZXlNYW5hZ2VyLCBGb2N1c09yaWdpbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtDZGtNZW51SXRlbX0gZnJvbSAnLi9tZW51LWl0ZW0nO1xuaW1wb3J0IHttZXJnZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge21hcFRvLCBtZXJnZUFsbCwgbWVyZ2VNYXAsIHN0YXJ0V2l0aCwgc3dpdGNoTWFwLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7TUVOVV9TVEFDSywgTWVudVN0YWNrLCBNZW51U3RhY2tJdGVtfSBmcm9tICcuL21lbnUtc3RhY2snO1xuaW1wb3J0IHtNZW51fSBmcm9tICcuL21lbnUtaW50ZXJmYWNlJztcbmltcG9ydCB7UG9pbnRlckZvY3VzVHJhY2tlcn0gZnJvbSAnLi9wb2ludGVyLWZvY3VzLXRyYWNrZXInO1xuaW1wb3J0IHtNRU5VX0FJTX0gZnJvbSAnLi9tZW51LWFpbSc7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gY3JlYXRlIHVuaXF1ZSBJRHMgZm9yIG1lbnVzLiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogQWJzdHJhY3QgZGlyZWN0aXZlIHRoYXQgaW1wbGVtZW50cyBzaGFyZWQgbG9naWMgY29tbW9uIHRvIGFsbCBtZW51cy5cbiAqIFRoaXMgY2xhc3MgY2FuIGJlIGV4dGVuZGVkIHRvIGNyZWF0ZSBjdXN0b20gbWVudSB0eXBlcy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdtZW51JyxcbiAgICAnY2xhc3MnOiAnJywgLy8gcmVzZXQgdGhlIGNzcyBjbGFzcyBhZGRlZCBieSB0aGUgc3VwZXItY2xhc3NcbiAgICAnW3RhYmluZGV4XSc6ICdfZ2V0VGFiSW5kZXgoKScsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbYXR0ci5hcmlhLW9yaWVudGF0aW9uXSc6ICdvcmllbnRhdGlvbicsXG4gICAgJ1thdHRyLmRhdGEtY2RrLW1lbnUtc3RhY2staWRdJzogJ21lbnVTdGFjay5pZCcsXG4gICAgJyhmb2N1cyknOiAnZm9jdXNGaXJzdEl0ZW0oKScsXG4gICAgJyhmb2N1c2luKSc6ICdtZW51U3RhY2suc2V0SGFzRm9jdXModHJ1ZSknLFxuICAgICcoZm9jdXNvdXQpJzogJ21lbnVTdGFjay5zZXRIYXNGb2N1cyhmYWxzZSknLFxuICB9LFxufSlcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDZGtNZW51QmFzZVxuICBleHRlbmRzIENka01lbnVHcm91cFxuICBpbXBsZW1lbnRzIE1lbnUsIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveVxue1xuICAvKiogVGhlIG1lbnUncyBuYXRpdmUgRE9NIGhvc3QgZWxlbWVudC4gKi9cbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogSFRNTEVsZW1lbnQgPSBpbmplY3QoRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcblxuICAvKiogVGhlIEFuZ3VsYXIgem9uZS4gKi9cbiAgcHJvdGVjdGVkIG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuXG4gIC8qKiBUaGUgc3RhY2sgb2YgbWVudXMgdGhpcyBtZW51IGJlbG9uZ3MgdG8uICovXG4gIHJlYWRvbmx5IG1lbnVTdGFjazogTWVudVN0YWNrID0gaW5qZWN0KE1FTlVfU1RBQ0spO1xuXG4gIC8qKiBUaGUgbWVudSBhaW0gc2VydmljZSB1c2VkIGJ5IHRoaXMgbWVudS4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IG1lbnVBaW0gPSBpbmplY3QoTUVOVV9BSU0sIEluamVjdEZsYWdzLk9wdGlvbmFsIHwgSW5qZWN0RmxhZ3MuU2VsZik7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb25hbGl0eSAodGV4dCBkaXJlY3Rpb24pIG9mIHRoZSBjdXJyZW50IHBhZ2UuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBkaXIgPSBpbmplY3QoRGlyZWN0aW9uYWxpdHksIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcblxuICAvKiogVGhlIGlkIG9mIHRoZSBtZW51J3MgaG9zdCBlbGVtZW50LiAqL1xuICBASW5wdXQoKSBpZCA9IGBjZGstbWVudS0ke25leHRJZCsrfWA7XG5cbiAgLyoqIEFsbCBjaGlsZCBNZW51SXRlbSBlbGVtZW50cyBuZXN0ZWQgaW4gdGhpcyBNZW51LiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka01lbnVJdGVtLCB7ZGVzY2VuZGFudHM6IHRydWV9KVxuICByZWFkb25seSBpdGVtczogUXVlcnlMaXN0PENka01lbnVJdGVtPjtcblxuICAvKiogVGhlIGRpcmVjdGlvbiBpdGVtcyBpbiB0aGUgbWVudSBmbG93LiAqL1xuICBvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJyA9ICd2ZXJ0aWNhbCc7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIG1lbnUgaXMgZGlzcGxheWVkIGlubGluZSAoaS5lLiBhbHdheXMgcHJlc2VudCB2cyBhIGNvbmRpdGlvbmFsIHBvcHVwIHRoYXQgdGhlXG4gICAqIHVzZXIgdHJpZ2dlcnMgd2l0aCBhIHRyaWdnZXIgZWxlbWVudCkuXG4gICAqL1xuICBpc0lubGluZSA9IGZhbHNlO1xuXG4gIC8qKiBIYW5kbGVzIGtleWJvYXJkIGV2ZW50cyBmb3IgdGhlIG1lbnUuICovXG4gIHByb3RlY3RlZCBrZXlNYW5hZ2VyOiBGb2N1c0tleU1hbmFnZXI8Q2RrTWVudUl0ZW0+O1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBNZW51QmFyIGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGRlc3Ryb3llZDogU3ViamVjdDx2b2lkPiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgLyoqIFRoZSBNZW51IEl0ZW0gd2hpY2ggdHJpZ2dlcmVkIHRoZSBvcGVuIHN1Ym1lbnUuICovXG4gIHByb3RlY3RlZCB0cmlnZ2VySXRlbT86IENka01lbnVJdGVtO1xuXG4gIC8qKiBUcmFja3MgdGhlIHVzZXJzIG1vdXNlIG1vdmVtZW50cyBvdmVyIHRoZSBtZW51LiAqL1xuICBwcm90ZWN0ZWQgcG9pbnRlclRyYWNrZXI/OiBQb2ludGVyRm9jdXNUcmFja2VyPENka01lbnVJdGVtPjtcblxuICAvKiogV2hldGhlciB0aGlzIG1lbnUncyBtZW51IHN0YWNrIGhhcyBmb2N1cy4gKi9cbiAgcHJpdmF0ZSBfbWVudVN0YWNrSGFzRm9jdXMgPSBmYWxzZTtcblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgaWYgKCF0aGlzLmlzSW5saW5lKSB7XG4gICAgICB0aGlzLm1lbnVTdGFjay5wdXNoKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLl9zZXRLZXlNYW5hZ2VyKCk7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTWVudU9wZW4oKTtcbiAgICB0aGlzLl9zdWJzY3JpYmVUb01lbnVTdGFja0Nsb3NlZCgpO1xuICAgIHRoaXMuX3NldFVwUG9pbnRlclRyYWNrZXIoKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMucG9pbnRlclRyYWNrZXI/LmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQbGFjZSBmb2N1cyBvbiB0aGUgZmlyc3QgTWVudUl0ZW0gaW4gdGhlIG1lbnUgYW5kIHNldCB0aGUgZm9jdXMgb3JpZ2luLlxuICAgKiBAcGFyYW0gZm9jdXNPcmlnaW4gVGhlIG9yaWdpbiBpbnB1dCBtb2RlIG9mIHRoZSBmb2N1cyBldmVudC5cbiAgICovXG4gIGZvY3VzRmlyc3RJdGVtKGZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbiA9ICdwcm9ncmFtJykge1xuICAgIHRoaXMua2V5TWFuYWdlci5zZXRGb2N1c09yaWdpbihmb2N1c09yaWdpbik7XG4gICAgdGhpcy5rZXlNYW5hZ2VyLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBsYWNlIGZvY3VzIG9uIHRoZSBsYXN0IE1lbnVJdGVtIGluIHRoZSBtZW51IGFuZCBzZXQgdGhlIGZvY3VzIG9yaWdpbi5cbiAgICogQHBhcmFtIGZvY3VzT3JpZ2luIFRoZSBvcmlnaW4gaW5wdXQgbW9kZSBvZiB0aGUgZm9jdXMgZXZlbnQuXG4gICAqL1xuICBmb2N1c0xhc3RJdGVtKGZvY3VzT3JpZ2luOiBGb2N1c09yaWdpbiA9ICdwcm9ncmFtJykge1xuICAgIHRoaXMua2V5TWFuYWdlci5zZXRGb2N1c09yaWdpbihmb2N1c09yaWdpbik7XG4gICAgdGhpcy5rZXlNYW5hZ2VyLnNldExhc3RJdGVtQWN0aXZlKCk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgdGFiaW5kZXggZm9yIHRoaXMgbWVudS4gKi9cbiAgX2dldFRhYkluZGV4KCkge1xuICAgIGNvbnN0IHRhYmluZGV4SWZJbmxpbmUgPSB0aGlzLl9tZW51U3RhY2tIYXNGb2N1cyA/IC0xIDogMDtcbiAgICByZXR1cm4gdGhpcy5pc0lubGluZSA/IHRhYmluZGV4SWZJbmxpbmUgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSBvcGVuIG1lbnUgaWYgdGhlIGN1cnJlbnQgYWN0aXZlIGl0ZW0gb3BlbmVkIHRoZSByZXF1ZXN0ZWQgTWVudVN0YWNrSXRlbS5cbiAgICogQHBhcmFtIG1lbnUgVGhlIG1lbnUgcmVxdWVzdGVkIHRvIGJlIGNsb3NlZC5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGJlaGF2aW9yIG9uIGNsb3NlLlxuICAgKiAgIC0gYGZvY3VzUGFyZW50VHJpZ2dlcmAgV2hldGhlciB0byBmb2N1cyB0aGUgcGFyZW50IHRyaWdnZXIgYWZ0ZXIgY2xvc2luZyB0aGUgbWVudS5cbiAgICovXG4gIHByb3RlY3RlZCBjbG9zZU9wZW5NZW51KG1lbnU6IE1lbnVTdGFja0l0ZW0sIG9wdGlvbnM/OiB7Zm9jdXNQYXJlbnRUcmlnZ2VyPzogYm9vbGVhbn0pIHtcbiAgICBjb25zdCB7Zm9jdXNQYXJlbnRUcmlnZ2VyfSA9IHsuLi5vcHRpb25zfTtcbiAgICBjb25zdCBrZXlNYW5hZ2VyID0gdGhpcy5rZXlNYW5hZ2VyO1xuICAgIGNvbnN0IHRyaWdnZXIgPSB0aGlzLnRyaWdnZXJJdGVtO1xuICAgIGlmIChtZW51ID09PSB0cmlnZ2VyPy5nZXRNZW51VHJpZ2dlcigpPy5nZXRNZW51KCkpIHtcbiAgICAgIHRyaWdnZXI/LmdldE1lbnVUcmlnZ2VyKCk/LmNsb3NlKCk7XG4gICAgICAvLyBJZiB0aGUgdXNlciBoYXMgbW91c2VkIG92ZXIgYSBzaWJsaW5nIGl0ZW0gd2Ugd2FudCB0byBmb2N1cyB0aGUgZWxlbWVudCB1bmRlciBtb3VzZSBmb2N1c1xuICAgICAgLy8gbm90IHRoZSB0cmlnZ2VyIHdoaWNoIHByZXZpb3VzbHkgb3BlbmVkIHRoZSBub3cgY2xvc2VkIG1lbnUuXG4gICAgICBpZiAoZm9jdXNQYXJlbnRUcmlnZ2VyKSB7XG4gICAgICAgIGlmICh0cmlnZ2VyKSB7XG4gICAgICAgICAga2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKHRyaWdnZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGtleU1hbmFnZXIuc2V0Rmlyc3RJdGVtQWN0aXZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU2V0dXAgdGhlIEZvY3VzS2V5TWFuYWdlciB3aXRoIHRoZSBjb3JyZWN0IG9yaWVudGF0aW9uIGZvciB0aGUgbWVudS4gKi9cbiAgcHJpdmF0ZSBfc2V0S2V5TWFuYWdlcigpIHtcbiAgICB0aGlzLmtleU1hbmFnZXIgPSBuZXcgRm9jdXNLZXlNYW5hZ2VyKHRoaXMuaXRlbXMpLndpdGhXcmFwKCkud2l0aFR5cGVBaGVhZCgpLndpdGhIb21lQW5kRW5kKCk7XG5cbiAgICBpZiAodGhpcy5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICB0aGlzLmtleU1hbmFnZXIud2l0aEhvcml6b250YWxPcmllbnRhdGlvbih0aGlzLmRpcj8udmFsdWUgfHwgJ2x0cicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleU1hbmFnZXIud2l0aFZlcnRpY2FsT3JpZW50YXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIHRoZSBtZW51IHRyaWdnZXIncyBvcGVuIGV2ZW50cyBpbiBvcmRlciB0byB0cmFjayB0aGUgdHJpZ2dlciB3aGljaCBvcGVuZWQgdGhlIG1lbnVcbiAgICogYW5kIHN0b3AgdHJhY2tpbmcgaXQgd2hlbiB0aGUgbWVudSBpcyBjbG9zZWQuXG4gICAqL1xuICBwcml2YXRlIF9zdWJzY3JpYmVUb01lbnVPcGVuKCkge1xuICAgIGNvbnN0IGV4aXRDb25kaXRpb24gPSBtZXJnZSh0aGlzLml0ZW1zLmNoYW5nZXMsIHRoaXMuZGVzdHJveWVkKTtcbiAgICB0aGlzLml0ZW1zLmNoYW5nZXNcbiAgICAgIC5waXBlKFxuICAgICAgICBzdGFydFdpdGgodGhpcy5pdGVtcyksXG4gICAgICAgIG1lcmdlTWFwKChsaXN0OiBRdWVyeUxpc3Q8Q2RrTWVudUl0ZW0+KSA9PlxuICAgICAgICAgIGxpc3RcbiAgICAgICAgICAgIC5maWx0ZXIoaXRlbSA9PiBpdGVtLmhhc01lbnUpXG4gICAgICAgICAgICAubWFwKGl0ZW0gPT4gaXRlbS5nZXRNZW51VHJpZ2dlcigpIS5vcGVuZWQucGlwZShtYXBUbyhpdGVtKSwgdGFrZVVudGlsKGV4aXRDb25kaXRpb24pKSksXG4gICAgICAgICksXG4gICAgICAgIG1lcmdlQWxsKCksXG4gICAgICAgIHN3aXRjaE1hcCgoaXRlbTogQ2RrTWVudUl0ZW0pID0+IHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJJdGVtID0gaXRlbTtcbiAgICAgICAgICByZXR1cm4gaXRlbS5nZXRNZW51VHJpZ2dlcigpIS5jbG9zZWQ7XG4gICAgICAgIH0pLFxuICAgICAgICB0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpLFxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiAodGhpcy50cmlnZ2VySXRlbSA9IHVuZGVmaW5lZCkpO1xuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgTWVudVN0YWNrIGNsb3NlIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tDbG9zZWQoKSB7XG4gICAgdGhpcy5tZW51U3RhY2suY2xvc2VkXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKVxuICAgICAgLnN1YnNjcmliZSgoe2l0ZW0sIGZvY3VzUGFyZW50VHJpZ2dlcn0pID0+IHRoaXMuY2xvc2VPcGVuTWVudShpdGVtLCB7Zm9jdXNQYXJlbnRUcmlnZ2VyfSkpO1xuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgTWVudVN0YWNrIGhhc0ZvY3VzIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9NZW51U3RhY2tIYXNGb2N1cygpIHtcbiAgICBpZiAodGhpcy5pc0lubGluZSkge1xuICAgICAgdGhpcy5tZW51U3RhY2suaGFzRm9jdXMucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQpKS5zdWJzY3JpYmUoaGFzRm9jdXMgPT4ge1xuICAgICAgICB0aGlzLl9tZW51U3RhY2tIYXNGb2N1cyA9IGhhc0ZvY3VzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgUG9pbnRlckZvY3VzVHJhY2tlciBhbmQgZW5zdXJlIHRoYXQgd2hlbiBtb3VzZSBmb2N1cyBjaGFuZ2VzIHRoZSBrZXkgbWFuYWdlciBpcyB1cGRhdGVkXG4gICAqIHdpdGggdGhlIGxhdGVzdCBtZW51IGl0ZW0gdW5kZXIgbW91c2UgZm9jdXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXRVcFBvaW50ZXJUcmFja2VyKCkge1xuICAgIGlmICh0aGlzLm1lbnVBaW0pIHtcbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgdGhpcy5wb2ludGVyVHJhY2tlciA9IG5ldyBQb2ludGVyRm9jdXNUcmFja2VyKHRoaXMuaXRlbXMpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLm1lbnVBaW0uaW5pdGlhbGl6ZSh0aGlzLCB0aGlzLnBvaW50ZXJUcmFja2VyISk7XG4gICAgfVxuICB9XG59XG4iXX0=