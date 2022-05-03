/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone, InjectionToken, Directive } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { throwMissingPointerFocusTracker, throwMissingMenuReference } from './menu-errors';
import * as i0 from "@angular/core";
/** Injection token used for an implementation of MenuAim. */
export const MENU_AIM = new InjectionToken('cdk-menu-aim');
/** Capture every nth mouse move event. */
const MOUSE_MOVE_SAMPLE_FREQUENCY = 3;
/** The number of mouse move events to track. */
const NUM_POINTS = 5;
/**
 * How long to wait before closing a sibling menu if a user stops short of the submenu they were
 * predicted to go into.
 */
const CLOSE_DELAY = 300;
/** Calculate the slope between point a and b. */
function getSlope(a, b) {
    return (b.y - a.y) / (b.x - a.x);
}
/** Calculate the y intercept for the given point and slope. */
function getYIntercept(point, slope) {
    return point.y - slope * point.x;
}
/**
 * Whether the given mouse trajectory line defined by the slope and y intercept falls within the
 * submenu as defined by `submenuPoints`
 * @param submenuPoints the submenu DOMRect points.
 * @param m the slope of the trajectory line.
 * @param b the y intercept of the trajectory line.
 * @return true if any point on the line falls within the submenu.
 */
function isWithinSubmenu(submenuPoints, m, b) {
    const { left, right, top, bottom } = submenuPoints;
    // Check for intersection with each edge of the submenu (left, right, top, bottom)
    // by fixing one coordinate to that edge's coordinate (either x or y) and checking if the
    // other coordinate is within bounds.
    return ((m * left + b >= top && m * left + b <= bottom) ||
        (m * right + b >= top && m * right + b <= bottom) ||
        ((top - b) / m >= left && (top - b) / m <= right) ||
        ((bottom - b) / m >= left && (bottom - b) / m <= right));
}
/**
 * TargetMenuAim predicts if a user is moving into a submenu. It calculates the
 * trajectory of the user's mouse movement in the current menu to determine if the
 * mouse is moving towards an open submenu.
 *
 * The determination is made by calculating the slope of the users last NUM_POINTS moves where each
 * pair of points determines if the trajectory line points into the submenu. It uses consensus
 * approach by checking if at least NUM_POINTS / 2 pairs determine that the user is moving towards
 * to submenu.
 */
export class TargetMenuAim {
    constructor(
    /** The Angular zone. */
    _ngZone) {
        this._ngZone = _ngZone;
        /** The last NUM_POINTS mouse move events. */
        this._points = [];
        /** Emits when this service is destroyed. */
        this._destroyed = new Subject();
    }
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Set the Menu and its PointerFocusTracker.
     * @param menu The menu that this menu aim service controls.
     * @param pointerTracker The `PointerFocusTracker` for the given menu.
     */
    initialize(menu, pointerTracker) {
        this._menu = menu;
        this._pointerTracker = pointerTracker;
        this._subscribeToMouseMoves();
    }
    /**
     * Calls the `doToggle` callback when it is deemed that the user is not moving towards
     * the submenu.
     * @param doToggle the function called when the user is not moving towards the submenu.
     */
    toggle(doToggle) {
        // If the menu is horizontal the sub-menus open below and there is no risk of premature
        // closing of any sub-menus therefore we automatically resolve the callback.
        if (this._menu.orientation === 'horizontal') {
            doToggle();
        }
        this._checkConfigured();
        const siblingItemIsWaiting = !!this._timeoutId;
        const hasPoints = this._points.length > 1;
        if (hasPoints && !siblingItemIsWaiting) {
            if (this._isMovingToSubmenu()) {
                this._startTimeout(doToggle);
            }
            else {
                doToggle();
            }
        }
        else if (!siblingItemIsWaiting) {
            doToggle();
        }
    }
    /**
     * Start the delayed toggle handler if one isn't running already.
     *
     * The delayed toggle handler executes the `doToggle` callback after some period of time iff the
     * users mouse is on an item in the current menu.
     *
     * @param doToggle the function called when the user is not moving towards the submenu.
     */
    _startTimeout(doToggle) {
        // If the users mouse is moving towards a submenu we don't want to immediately resolve.
        // Wait for some period of time before determining if the previous menu should close in
        // cases where the user may have moved towards the submenu but stopped on a sibling menu
        // item intentionally.
        const timeoutId = setTimeout(() => {
            // Resolve if the user is currently moused over some element in the root menu
            if (this._pointerTracker.activeElement && timeoutId === this._timeoutId) {
                doToggle();
            }
            this._timeoutId = null;
        }, CLOSE_DELAY);
        this._timeoutId = timeoutId;
    }
    /** Whether the user is heading towards the open submenu. */
    _isMovingToSubmenu() {
        const submenuPoints = this._getSubmenuBounds();
        if (!submenuPoints) {
            return false;
        }
        let numMoving = 0;
        const currPoint = this._points[this._points.length - 1];
        // start from the second last point and calculate the slope between each point and the last
        // point.
        for (let i = this._points.length - 2; i >= 0; i--) {
            const previous = this._points[i];
            const slope = getSlope(currPoint, previous);
            if (isWithinSubmenu(submenuPoints, slope, getYIntercept(currPoint, slope))) {
                numMoving++;
            }
        }
        return numMoving >= Math.floor(NUM_POINTS / 2);
    }
    /** Get the bounding DOMRect for the open submenu. */
    _getSubmenuBounds() {
        return this._pointerTracker?.previousElement?.getMenu()?.nativeElement.getBoundingClientRect();
    }
    /**
     * Check if a reference to the PointerFocusTracker and menu element is provided.
     * @throws an error if neither reference is provided.
     */
    _checkConfigured() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (!this._pointerTracker) {
                throwMissingPointerFocusTracker();
            }
            if (!this._menu) {
                throwMissingMenuReference();
            }
        }
    }
    /** Subscribe to the root menus mouse move events and update the tracked mouse points. */
    _subscribeToMouseMoves() {
        this._ngZone.runOutsideAngular(() => {
            fromEvent(this._menu.nativeElement, 'mousemove')
                .pipe(filter((_, index) => index % MOUSE_MOVE_SAMPLE_FREQUENCY === 0), takeUntil(this._destroyed))
                .subscribe((event) => {
                this._points.push({ x: event.clientX, y: event.clientY });
                if (this._points.length > NUM_POINTS) {
                    this._points.shift();
                }
            });
        });
    }
}
TargetMenuAim.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: TargetMenuAim, deps: [{ token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable });
TargetMenuAim.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: TargetMenuAim });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: TargetMenuAim, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i0.NgZone }]; } });
/**
 * CdkTargetMenuAim is a provider for the TargetMenuAim service. It can be added to an
 * element with either the `cdkMenu` or `cdkMenuBar` directive and child menu items.
 */
export class CdkTargetMenuAim {
}
CdkTargetMenuAim.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkTargetMenuAim, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkTargetMenuAim.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "14.0.0-next.15", type: CdkTargetMenuAim, selector: "[cdkTargetMenuAim]", providers: [{ provide: MENU_AIM, useClass: TargetMenuAim }], exportAs: ["cdkTargetMenuAim"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-next.15", ngImport: i0, type: CdkTargetMenuAim, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTargetMenuAim]',
                    exportAs: 'cdkTargetMenuAim',
                    providers: [{ provide: MENU_AIM, useClass: TargetMenuAim }],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1haW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1haW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQWEsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN2RixPQUFPLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN4QyxPQUFPLEVBQUMsU0FBUyxFQUFFLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR2pELE9BQU8sRUFBQywrQkFBK0IsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUF1QnpGLDZEQUE2RDtBQUM3RCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQVUsY0FBYyxDQUFDLENBQUM7QUFFcEUsMENBQTBDO0FBQzFDLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO0FBRXRDLGdEQUFnRDtBQUNoRCxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFFckI7OztHQUdHO0FBQ0gsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBUXhCLGlEQUFpRDtBQUNqRCxTQUFTLFFBQVEsQ0FBQyxDQUFRLEVBQUUsQ0FBUTtJQUNsQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBRUQsK0RBQStEO0FBQy9ELFNBQVMsYUFBYSxDQUFDLEtBQVksRUFBRSxLQUFhO0lBQ2hELE9BQU8sS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBS0Q7Ozs7Ozs7R0FPRztBQUNILFNBQVMs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QUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUMsQ0FBQzttR0FFOUMsZ0JBQWdCO2tCQUw1QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxvQkFBb0I7b0JBQzlCLFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFDLENBQUM7aUJBQzFEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3ksIEluamVjdGlvblRva2VuLCBEaXJlY3RpdmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWwsIGZpbHRlcn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtQb2ludGVyRm9jdXNUcmFja2VyLCBGb2N1c2FibGVFbGVtZW50fSBmcm9tICcuL3BvaW50ZXItZm9jdXMtdHJhY2tlcic7XG5pbXBvcnQge01lbnV9IGZyb20gJy4vbWVudS1pbnRlcmZhY2UnO1xuaW1wb3J0IHt0aHJvd01pc3NpbmdQb2ludGVyRm9jdXNUcmFja2VyLCB0aHJvd01pc3NpbmdNZW51UmVmZXJlbmNlfSBmcm9tICcuL21lbnUtZXJyb3JzJztcblxuLyoqXG4gKiBNZW51QWltIGlzIHJlc3BvbnNpYmxlIGZvciBkZXRlcm1pbmluZyBpZiBhIHNpYmxpbmcgbWVudWl0ZW0ncyBtZW51IHNob3VsZCBiZSBjbG9zZWQgd2hlbiBhXG4gKiBUb2dnbGVyIGl0ZW0gaXMgaG92ZXJlZCBpbnRvLiBJdCBpcyB1cCB0byB0aGUgaG92ZXJlZCBpbiBpdGVtIHRvIGNhbGwgdGhlIE1lbnVBaW0gc2VydmljZSBpblxuICogb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIGl0IG1heSBwZXJmb3JtIGl0cyBjbG9zZSBhY3Rpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1lbnVBaW0ge1xuICAvKipcbiAgICogU2V0IHRoZSBNZW51IGFuZCBpdHMgUG9pbnRlckZvY3VzVHJhY2tlci5cbiAgICogQHBhcmFtIG1lbnUgVGhlIG1lbnUgdGhhdCB0aGlzIG1lbnUgYWltIHNlcnZpY2UgY29udHJvbHMuXG4gICAqIEBwYXJhbSBwb2ludGVyVHJhY2tlciBUaGUgYFBvaW50ZXJGb2N1c1RyYWNrZXJgIGZvciB0aGUgZ2l2ZW4gbWVudS5cbiAgICovXG4gIGluaXRpYWxpemUobWVudTogTWVudSwgcG9pbnRlclRyYWNrZXI6IFBvaW50ZXJGb2N1c1RyYWNrZXI8Rm9jdXNhYmxlRWxlbWVudCAmIFRvZ2dsZXI+KTogdm9pZDtcblxuICAvKipcbiAgICogQ2FsbHMgdGhlIGBkb1RvZ2dsZWAgY2FsbGJhY2sgd2hlbiBpdCBpcyBkZWVtZWQgdGhhdCB0aGUgdXNlciBpcyBub3QgbW92aW5nIHRvd2FyZHNcbiAgICogdGhlIHN1Ym1lbnUuXG4gICAqIEBwYXJhbSBkb1RvZ2dsZSB0aGUgZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIHVzZXIgaXMgbm90IG1vdmluZyB0b3dhcmRzIHRoZSBzdWJtZW51LlxuICAgKi9cbiAgdG9nZ2xlKGRvVG9nZ2xlOiAoKSA9PiB2b2lkKTogdm9pZDtcbn1cblxuLyoqIEluamVjdGlvbiB0b2tlbiB1c2VkIGZvciBhbiBpbXBsZW1lbnRhdGlvbiBvZiBNZW51QWltLiAqL1xuZXhwb3J0IGNvbnN0IE1FTlVfQUlNID0gbmV3IEluamVjdGlvblRva2VuPE1lbnVBaW0+KCdjZGstbWVudS1haW0nKTtcblxuLyoqIENhcHR1cmUgZXZlcnkgbnRoIG1vdXNlIG1vdmUgZXZlbnQuICovXG5jb25zdCBNT1VTRV9NT1ZFX1NBTVBMRV9GUkVRVUVOQ1kgPSAzO1xuXG4vKiogVGhlIG51bWJlciBvZiBtb3VzZSBtb3ZlIGV2ZW50cyB0byB0cmFjay4gKi9cbmNvbnN0IE5VTV9QT0lOVFMgPSA1O1xuXG4vKipcbiAqIEhvdyBsb25nIHRvIHdhaXQgYmVmb3JlIGNsb3NpbmcgYSBzaWJsaW5nIG1lbnUgaWYgYSB1c2VyIHN0b3BzIHNob3J0IG9mIHRoZSBzdWJtZW51IHRoZXkgd2VyZVxuICogcHJlZGljdGVkIHRvIGdvIGludG8uXG4gKi9cbmNvbnN0IENMT1NFX0RFTEFZID0gMzAwO1xuXG4vKiogQW4gZWxlbWVudCB3aGljaCB3aGVuIGhvdmVyZWQgb3ZlciBtYXkgb3BlbiBvciBjbG9zZSBhIG1lbnUuICovXG5leHBvcnQgaW50ZXJmYWNlIFRvZ2dsZXIge1xuICAvKiogR2V0cyB0aGUgb3BlbiBtZW51LCBvciB1bmRlZmluZWQgaWYgbm8gbWVudSBpcyBvcGVuLiAqL1xuICBnZXRNZW51KCk6IE1lbnUgfCB1bmRlZmluZWQ7XG59XG5cbi8qKiBDYWxjdWxhdGUgdGhlIHNsb3BlIGJldHdlZW4gcG9pbnQgYSBhbmQgYi4gKi9cbmZ1bmN0aW9uIGdldFNsb3BlKGE6IFBvaW50LCBiOiBQb2ludCkge1xuICByZXR1cm4gKGIueSAtIGEueSkgLyAoYi54IC0gYS54KTtcbn1cblxuLyoqIENhbGN1bGF0ZSB0aGUgeSBpbnRlcmNlcHQgZm9yIHRoZSBnaXZlbiBwb2ludCBhbmQgc2xvcGUuICovXG5mdW5jdGlvbiBnZXRZSW50ZXJjZXB0KHBvaW50OiBQb2ludCwgc2xvcGU6IG51bWJlcikge1xuICByZXR1cm4gcG9pbnQueSAtIHNsb3BlICogcG9pbnQueDtcbn1cblxuLyoqIFJlcHJlc2VudHMgYSBjb29yZGluYXRlIG9mIG1vdXNlIHRyYXZlbC4gKi9cbnR5cGUgUG9pbnQgPSB7eDogbnVtYmVyOyB5OiBudW1iZXJ9O1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlIGdpdmVuIG1vdXNlIHRyYWplY3RvcnkgbGluZSBkZWZpbmVkIGJ5IHRoZSBzbG9wZSBhbmQgeSBpbnRlcmNlcHQgZmFsbHMgd2l0aGluIHRoZVxuICogc3VibWVudSBhcyBkZWZpbmVkIGJ5IGBzdWJtZW51UG9pbnRzYFxuICogQHBhcmFtIHN1Ym1lbnVQb2ludHMgdGhlIHN1Ym1lbnUgRE9NUmVjdCBwb2ludHMuXG4gKiBAcGFyYW0gbSB0aGUgc2xvcGUgb2YgdGhlIHRyYWplY3RvcnkgbGluZS5cbiAqIEBwYXJhbSBiIHRoZSB5IGludGVyY2VwdCBvZiB0aGUgdHJhamVjdG9yeSBsaW5lLlxuICogQHJldHVybiB0cnVlIGlmIGFueSBwb2ludCBvbiB0aGUgbGluZSBmYWxscyB3aXRoaW4gdGhlIHN1Ym1lbnUuXG4gKi9cbmZ1bmN0aW9uIGlzV2l0aGluU3VibWVudShzdWJtZW51UG9pbnRzOiBET01SZWN0LCBtOiBudW1iZXIsIGI6IG51bWJlcikge1xuICBjb25zdCB7bGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tfSA9IHN1Ym1lbnVQb2ludHM7XG5cbiAgLy8gQ2hlY2sgZm9yIGludGVyc2VjdGlvbiB3aXRoIGVhY2ggZWRnZSBvZiB0aGUgc3VibWVudSAobGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tKVxuICAvLyBieSBmaXhpbmcgb25lIGNvb3JkaW5hdGUgdG8gdGhhdCBlZGdlJ3MgY29vcmRpbmF0ZSAoZWl0aGVyIHggb3IgeSkgYW5kIGNoZWNraW5nIGlmIHRoZVxuICAvLyBvdGhlciBjb29yZGluYXRlIGlzIHdpdGhpbiBib3VuZHMuXG4gIHJldHVybiAoXG4gICAgKG0gKiBsZWZ0ICsgYiA+PSB0b3AgJiYgbSAqIGxlZnQgKyBiIDw9IGJvdHRvbSkgfHxcbiAgICAobSAqIHJpZ2h0ICsgYiA+PSB0b3AgJiYgbSAqIHJpZ2h0ICsgYiA8PSBib3R0b20pIHx8XG4gICAgKCh0b3AgLSBiKSAvIG0gPj0gbGVmdCAmJiAodG9wIC0gYikgLyBtIDw9IHJpZ2h0KSB8fFxuICAgICgoYm90dG9tIC0gYikgLyBtID49IGxlZnQgJiYgKGJvdHRvbSAtIGIpIC8gbSA8PSByaWdodClcbiAgKTtcbn1cblxuLyoqXG4gKiBUYXJnZXRNZW51QWltIHByZWRpY3RzIGlmIGEgdXNlciBpcyBtb3ZpbmcgaW50byBhIHN1Ym1lbnUuIEl0IGNhbGN1bGF0ZXMgdGhlXG4gKiB0cmFqZWN0b3J5IG9mIHRoZSB1c2VyJ3MgbW91c2UgbW92ZW1lbnQgaW4gdGhlIGN1cnJlbnQgbWVudSB0byBkZXRlcm1pbmUgaWYgdGhlXG4gKiBtb3VzZSBpcyBtb3ZpbmcgdG93YXJkcyBhbiBvcGVuIHN1Ym1lbnUuXG4gKlxuICogVGhlIGRldGVybWluYXRpb24gaXMgbWFkZSBieSBjYWxjdWxhdGluZyB0aGUgc2xvcGUgb2YgdGhlIHVzZXJzIGxhc3QgTlVNX1BPSU5UUyBtb3ZlcyB3aGVyZSBlYWNoXG4gKiBwYWlyIG9mIHBvaW50cyBkZXRlcm1pbmVzIGlmIHRoZSB0cmFqZWN0b3J5IGxpbmUgcG9pbnRzIGludG8gdGhlIHN1Ym1lbnUuIEl0IHVzZXMgY29uc2Vuc3VzXG4gKiBhcHByb2FjaCBieSBjaGVja2luZyBpZiBhdCBsZWFzdCBOVU1fUE9JTlRTIC8gMiBwYWlycyBkZXRlcm1pbmUgdGhhdCB0aGUgdXNlciBpcyBtb3ZpbmcgdG93YXJkc1xuICogdG8gc3VibWVudS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFRhcmdldE1lbnVBaW0gaW1wbGVtZW50cyBNZW51QWltLCBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGxhc3QgTlVNX1BPSU5UUyBtb3VzZSBtb3ZlIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcG9pbnRzOiBQb2ludFtdID0gW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgcm9vdCBtZW51IGluIHdoaWNoIHdlIGFyZSB0cmFja2luZyBtb3VzZSBtb3Zlcy4gKi9cbiAgcHJpdmF0ZSBfbWVudTogTWVudTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSByb290IG1lbnUncyBtb3VzZSBtYW5hZ2VyLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVHJhY2tlcjogUG9pbnRlckZvY3VzVHJhY2tlcjxUb2dnbGVyICYgRm9jdXNhYmxlRWxlbWVudD47XG5cbiAgLyoqIFRoZSBpZCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgdGltZW91dCBjYWxsIHdhaXRpbmcgdG8gcmVzb2x2ZS4gKi9cbiAgcHJpdmF0ZSBfdGltZW91dElkOiBudW1iZXIgfCBudWxsO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoaXMgc2VydmljZSBpcyBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rlc3Ryb3llZDogU3ViamVjdDx2b2lkPiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgLyoqIFRoZSBBbmd1bGFyIHpvbmUuICovXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbmdab25lOiBOZ1pvbmUsXG4gICkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgTWVudSBhbmQgaXRzIFBvaW50ZXJGb2N1c1RyYWNrZXIuXG4gICAqIEBwYXJhbSBtZW51IFRoZSBtZW51IHRoYXQgdGhpcyBtZW51IGFpbSBzZXJ2aWNlIGNvbnRyb2xzLlxuICAgKiBAcGFyYW0gcG9pbnRlclRyYWNrZXIgVGhlIGBQb2ludGVyRm9jdXNUcmFja2VyYCBmb3IgdGhlIGdpdmVuIG1lbnUuXG4gICAqL1xuICBpbml0aWFsaXplKG1lbnU6IE1lbnUsIHBvaW50ZXJUcmFja2VyOiBQb2ludGVyRm9jdXNUcmFja2VyPEZvY3VzYWJsZUVsZW1lbnQgJiBUb2dnbGVyPikge1xuICAgIHRoaXMuX21lbnUgPSBtZW51O1xuICAgIHRoaXMuX3BvaW50ZXJUcmFja2VyID0gcG9pbnRlclRyYWNrZXI7XG4gICAgdGhpcy5fc3Vic2NyaWJlVG9Nb3VzZU1vdmVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgdGhlIGBkb1RvZ2dsZWAgY2FsbGJhY2sgd2hlbiBpdCBpcyBkZWVtZWQgdGhhdCB0aGUgdXNlciBpcyBub3QgbW92aW5nIHRvd2FyZHNcbiAgICogdGhlIHN1Ym1lbnUuXG4gICAqIEBwYXJhbSBkb1RvZ2dsZSB0aGUgZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIHVzZXIgaXMgbm90IG1vdmluZyB0b3dhcmRzIHRoZSBzdWJtZW51LlxuICAgKi9cbiAgdG9nZ2xlKGRvVG9nZ2xlOiAoKSA9PiB2b2lkKSB7XG4gICAgLy8gSWYgdGhlIG1lbnUgaXMgaG9yaXpvbnRhbCB0aGUgc3ViLW1lbnVzIG9wZW4gYmVsb3cgYW5kIHRoZXJlIGlzIG5vIHJpc2sgb2YgcHJlbWF0dXJlXG4gICAgLy8gY2xvc2luZyBvZiBhbnkgc3ViLW1lbnVzIHRoZXJlZm9yZSB3ZSBhdXRvbWF0aWNhbGx5IHJlc29sdmUgdGhlIGNhbGxiYWNrLlxuICAgIGlmICh0aGlzLl9tZW51Lm9yaWVudGF0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgIGRvVG9nZ2xlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2hlY2tDb25maWd1cmVkKCk7XG5cbiAgICBjb25zdCBzaWJsaW5nSXRlbUlzV2FpdGluZyA9ICEhdGhpcy5fdGltZW91dElkO1xuICAgIGNvbnN0IGhhc1BvaW50cyA9IHRoaXMuX3BvaW50cy5sZW5ndGggPiAxO1xuXG4gICAgaWYgKGhhc1BvaW50cyAmJiAhc2libGluZ0l0ZW1Jc1dhaXRpbmcpIHtcbiAgICAgIGlmICh0aGlzLl9pc01vdmluZ1RvU3VibWVudSgpKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZW91dChkb1RvZ2dsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb1RvZ2dsZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXNpYmxpbmdJdGVtSXNXYWl0aW5nKSB7XG4gICAgICBkb1RvZ2dsZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB0aGUgZGVsYXllZCB0b2dnbGUgaGFuZGxlciBpZiBvbmUgaXNuJ3QgcnVubmluZyBhbHJlYWR5LlxuICAgKlxuICAgKiBUaGUgZGVsYXllZCB0b2dnbGUgaGFuZGxlciBleGVjdXRlcyB0aGUgYGRvVG9nZ2xlYCBjYWxsYmFjayBhZnRlciBzb21lIHBlcmlvZCBvZiB0aW1lIGlmZiB0aGVcbiAgICogdXNlcnMgbW91c2UgaXMgb24gYW4gaXRlbSBpbiB0aGUgY3VycmVudCBtZW51LlxuICAgKlxuICAgKiBAcGFyYW0gZG9Ub2dnbGUgdGhlIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGlzIG5vdCBtb3ZpbmcgdG93YXJkcyB0aGUgc3VibWVudS5cbiAgICovXG4gIHByaXZhdGUgX3N0YXJ0VGltZW91dChkb1RvZ2dsZTogKCkgPT4gdm9pZCkge1xuICAgIC8vIElmIHRoZSB1c2VycyBtb3VzZSBpcyBtb3ZpbmcgdG93YXJkcyBhIHN1Ym1lbnUgd2UgZG9uJ3Qgd2FudCB0byBpbW1lZGlhdGVseSByZXNvbHZlLlxuICAgIC8vIFdhaXQgZm9yIHNvbWUgcGVyaW9kIG9mIHRpbWUgYmVmb3JlIGRldGVybWluaW5nIGlmIHRoZSBwcmV2aW91cyBtZW51IHNob3VsZCBjbG9zZSBpblxuICAgIC8vIGNhc2VzIHdoZXJlIHRoZSB1c2VyIG1heSBoYXZlIG1vdmVkIHRvd2FyZHMgdGhlIHN1Ym1lbnUgYnV0IHN0b3BwZWQgb24gYSBzaWJsaW5nIG1lbnVcbiAgICAvLyBpdGVtIGludGVudGlvbmFsbHkuXG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAvLyBSZXNvbHZlIGlmIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBtb3VzZWQgb3ZlciBzb21lIGVsZW1lbnQgaW4gdGhlIHJvb3QgbWVudVxuICAgICAgaWYgKHRoaXMuX3BvaW50ZXJUcmFja2VyIS5hY3RpdmVFbGVtZW50ICYmIHRpbWVvdXRJZCA9PT0gdGhpcy5fdGltZW91dElkKSB7XG4gICAgICAgIGRvVG9nZ2xlKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl90aW1lb3V0SWQgPSBudWxsO1xuICAgIH0sIENMT1NFX0RFTEFZKSBhcyBhbnkgYXMgbnVtYmVyO1xuXG4gICAgdGhpcy5fdGltZW91dElkID0gdGltZW91dElkO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgaXMgaGVhZGluZyB0b3dhcmRzIHRoZSBvcGVuIHN1Ym1lbnUuICovXG4gIHByaXZhdGUgX2lzTW92aW5nVG9TdWJtZW51KCkge1xuICAgIGNvbnN0IHN1Ym1lbnVQb2ludHMgPSB0aGlzLl9nZXRTdWJtZW51Qm91bmRzKCk7XG4gICAgaWYgKCFzdWJtZW51UG9pbnRzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IG51bU1vdmluZyA9IDA7XG4gICAgY29uc3QgY3VyclBvaW50ID0gdGhpcy5fcG9pbnRzW3RoaXMuX3BvaW50cy5sZW5ndGggLSAxXTtcbiAgICAvLyBzdGFydCBmcm9tIHRoZSBzZWNvbmQgbGFzdCBwb2ludCBhbmQgY2FsY3VsYXRlIHRoZSBzbG9wZSBiZXR3ZWVuIGVhY2ggcG9pbnQgYW5kIHRoZSBsYXN0XG4gICAgLy8gcG9pbnQuXG4gICAgZm9yIChsZXQgaSA9IHRoaXMuX3BvaW50cy5sZW5ndGggLSAyOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLl9wb2ludHNbaV07XG4gICAgICBjb25zdCBzbG9wZSA9IGdldFNsb3BlKGN1cnJQb2ludCwgcHJldmlvdXMpO1xuICAgICAgaWYgKGlzV2l0aGluU3VibWVudShzdWJtZW51UG9pbnRzLCBzbG9wZSwgZ2V0WUludGVyY2VwdChjdXJyUG9pbnQsIHNsb3BlKSkpIHtcbiAgICAgICAgbnVtTW92aW5nKys7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudW1Nb3ZpbmcgPj0gTWF0aC5mbG9vcihOVU1fUE9JTlRTIC8gMik7XG4gIH1cblxuICAvKiogR2V0IHRoZSBib3VuZGluZyBET01SZWN0IGZvciB0aGUgb3BlbiBzdWJtZW51LiAqL1xuICBwcml2YXRlIF9nZXRTdWJtZW51Qm91bmRzKCk6IERPTVJlY3QgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9wb2ludGVyVHJhY2tlcj8ucHJldmlvdXNFbGVtZW50Py5nZXRNZW51KCk/Lm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSByZWZlcmVuY2UgdG8gdGhlIFBvaW50ZXJGb2N1c1RyYWNrZXIgYW5kIG1lbnUgZWxlbWVudCBpcyBwcm92aWRlZC5cbiAgICogQHRocm93cyBhbiBlcnJvciBpZiBuZWl0aGVyIHJlZmVyZW5jZSBpcyBwcm92aWRlZC5cbiAgICovXG4gIHByaXZhdGUgX2NoZWNrQ29uZmlndXJlZCgpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBpZiAoIXRoaXMuX3BvaW50ZXJUcmFja2VyKSB7XG4gICAgICAgIHRocm93TWlzc2luZ1BvaW50ZXJGb2N1c1RyYWNrZXIoKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5fbWVudSkge1xuICAgICAgICB0aHJvd01pc3NpbmdNZW51UmVmZXJlbmNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFN1YnNjcmliZSB0byB0aGUgcm9vdCBtZW51cyBtb3VzZSBtb3ZlIGV2ZW50cyBhbmQgdXBkYXRlIHRoZSB0cmFja2VkIG1vdXNlIHBvaW50cy4gKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9Nb3VzZU1vdmVzKCkge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBmcm9tRXZlbnQ8TW91c2VFdmVudD4odGhpcy5fbWVudS5uYXRpdmVFbGVtZW50LCAnbW91c2Vtb3ZlJylcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKChfOiBNb3VzZUV2ZW50LCBpbmRleDogbnVtYmVyKSA9PiBpbmRleCAlIE1PVVNFX01PVkVfU0FNUExFX0ZSRVFVRU5DWSA9PT0gMCksXG4gICAgICAgICAgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCksXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICB0aGlzLl9wb2ludHMucHVzaCh7eDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WX0pO1xuICAgICAgICAgIGlmICh0aGlzLl9wb2ludHMubGVuZ3RoID4gTlVNX1BPSU5UUykge1xuICAgICAgICAgICAgdGhpcy5fcG9pbnRzLnNoaWZ0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIENka1RhcmdldE1lbnVBaW0gaXMgYSBwcm92aWRlciBmb3IgdGhlIFRhcmdldE1lbnVBaW0gc2VydmljZS4gSXQgY2FuIGJlIGFkZGVkIHRvIGFuXG4gKiBlbGVtZW50IHdpdGggZWl0aGVyIHRoZSBgY2RrTWVudWAgb3IgYGNka01lbnVCYXJgIGRpcmVjdGl2ZSBhbmQgY2hpbGQgbWVudSBpdGVtcy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1RhcmdldE1lbnVBaW1dJyxcbiAgZXhwb3J0QXM6ICdjZGtUYXJnZXRNZW51QWltJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IE1FTlVfQUlNLCB1c2VDbGFzczogVGFyZ2V0TWVudUFpbX1dLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUYXJnZXRNZW51QWltIHt9XG4iXX0=