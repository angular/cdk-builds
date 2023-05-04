/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, inject, Injectable, InjectionToken, NgZone } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { throwMissingMenuReference, throwMissingPointerFocusTracker } from './menu-errors';
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
class TargetMenuAim {
    constructor() {
        /** The Angular zone. */
        this._ngZone = inject(NgZone);
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: TargetMenuAim, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: TargetMenuAim }); }
}
export { TargetMenuAim };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: TargetMenuAim, decorators: [{
            type: Injectable
        }] });
/**
 * CdkTargetMenuAim is a provider for the TargetMenuAim service. It can be added to an
 * element with either the `cdkMenu` or `cdkMenuBar` directive and child menu items.
 */
class CdkTargetMenuAim {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTargetMenuAim, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkTargetMenuAim, isStandalone: true, selector: "[cdkTargetMenuAim]", providers: [{ provide: MENU_AIM, useClass: TargetMenuAim }], exportAs: ["cdkTargetMenuAim"], ngImport: i0 }); }
}
export { CdkTargetMenuAim };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTargetMenuAim, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTargetMenuAim]',
                    exportAs: 'cdkTargetMenuAim',
                    standalone: true,
                    providers: [{ provide: MENU_AIM, useClass: TargetMenuAim }],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS1haW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL21lbnUvbWVudS1haW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDL0YsT0FBTyxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDeEMsT0FBTyxFQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUdqRCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBdUJ6Riw2REFBNkQ7QUFDN0QsTUFBTSxDQUFDLE1BQU0sUUFBUSxHQUFHLElBQUksY0FBYyxDQUFVLGNBQWMsQ0FBQyxDQUFDO0FBRXBFLDBDQUEwQztBQUMxQyxNQUFNLDJCQUEyQixHQUFHLENBQUMsQ0FBQztBQUV0QyxnREFBZ0Q7QUFDaEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBRXJCOzs7R0FHRztBQUNILE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztBQVF4QixpREFBaUQ7QUFDakQsU0FBUyxRQUFRLENBQUMsQ0FBUSxFQUFFLENBQVE7SUFDbEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUVELCtEQUErRDtBQUMvRCxTQUFTLGFBQWEsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUNoRCxPQUFPLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUtEOzs7Ozs7O0dBT0c7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QyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUMsQ0FBQzs7U0FFOUMsZ0JBQWdCOzJGQUFoQixnQkFBZ0I7a0JBTjVCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLG9CQUFvQjtvQkFDOUIsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFDLENBQUM7aUJBQzFEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBpbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBOZ1pvbmUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2Zyb21FdmVudCwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpbHRlciwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0ZvY3VzYWJsZUVsZW1lbnQsIFBvaW50ZXJGb2N1c1RyYWNrZXJ9IGZyb20gJy4vcG9pbnRlci1mb2N1cy10cmFja2VyJztcbmltcG9ydCB7TWVudX0gZnJvbSAnLi9tZW51LWludGVyZmFjZSc7XG5pbXBvcnQge3Rocm93TWlzc2luZ01lbnVSZWZlcmVuY2UsIHRocm93TWlzc2luZ1BvaW50ZXJGb2N1c1RyYWNrZXJ9IGZyb20gJy4vbWVudS1lcnJvcnMnO1xuXG4vKipcbiAqIE1lbnVBaW0gaXMgcmVzcG9uc2libGUgZm9yIGRldGVybWluaW5nIGlmIGEgc2libGluZyBtZW51aXRlbSdzIG1lbnUgc2hvdWxkIGJlIGNsb3NlZCB3aGVuIGFcbiAqIFRvZ2dsZXIgaXRlbSBpcyBob3ZlcmVkIGludG8uIEl0IGlzIHVwIHRvIHRoZSBob3ZlcmVkIGluIGl0ZW0gdG8gY2FsbCB0aGUgTWVudUFpbSBzZXJ2aWNlIGluXG4gKiBvcmRlciB0byBkZXRlcm1pbmUgaWYgaXQgbWF5IHBlcmZvcm0gaXRzIGNsb3NlIGFjdGlvbnMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWVudUFpbSB7XG4gIC8qKlxuICAgKiBTZXQgdGhlIE1lbnUgYW5kIGl0cyBQb2ludGVyRm9jdXNUcmFja2VyLlxuICAgKiBAcGFyYW0gbWVudSBUaGUgbWVudSB0aGF0IHRoaXMgbWVudSBhaW0gc2VydmljZSBjb250cm9scy5cbiAgICogQHBhcmFtIHBvaW50ZXJUcmFja2VyIFRoZSBgUG9pbnRlckZvY3VzVHJhY2tlcmAgZm9yIHRoZSBnaXZlbiBtZW51LlxuICAgKi9cbiAgaW5pdGlhbGl6ZShtZW51OiBNZW51LCBwb2ludGVyVHJhY2tlcjogUG9pbnRlckZvY3VzVHJhY2tlcjxGb2N1c2FibGVFbGVtZW50ICYgVG9nZ2xlcj4pOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgYGRvVG9nZ2xlYCBjYWxsYmFjayB3aGVuIGl0IGlzIGRlZW1lZCB0aGF0IHRoZSB1c2VyIGlzIG5vdCBtb3ZpbmcgdG93YXJkc1xuICAgKiB0aGUgc3VibWVudS5cbiAgICogQHBhcmFtIGRvVG9nZ2xlIHRoZSBmdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgdXNlciBpcyBub3QgbW92aW5nIHRvd2FyZHMgdGhlIHN1Ym1lbnUuXG4gICAqL1xuICB0b2dnbGUoZG9Ub2dnbGU6ICgpID0+IHZvaWQpOiB2b2lkO1xufVxuXG4vKiogSW5qZWN0aW9uIHRva2VuIHVzZWQgZm9yIGFuIGltcGxlbWVudGF0aW9uIG9mIE1lbnVBaW0uICovXG5leHBvcnQgY29uc3QgTUVOVV9BSU0gPSBuZXcgSW5qZWN0aW9uVG9rZW48TWVudUFpbT4oJ2Nkay1tZW51LWFpbScpO1xuXG4vKiogQ2FwdHVyZSBldmVyeSBudGggbW91c2UgbW92ZSBldmVudC4gKi9cbmNvbnN0IE1PVVNFX01PVkVfU0FNUExFX0ZSRVFVRU5DWSA9IDM7XG5cbi8qKiBUaGUgbnVtYmVyIG9mIG1vdXNlIG1vdmUgZXZlbnRzIHRvIHRyYWNrLiAqL1xuY29uc3QgTlVNX1BPSU5UUyA9IDU7XG5cbi8qKlxuICogSG93IGxvbmcgdG8gd2FpdCBiZWZvcmUgY2xvc2luZyBhIHNpYmxpbmcgbWVudSBpZiBhIHVzZXIgc3RvcHMgc2hvcnQgb2YgdGhlIHN1Ym1lbnUgdGhleSB3ZXJlXG4gKiBwcmVkaWN0ZWQgdG8gZ28gaW50by5cbiAqL1xuY29uc3QgQ0xPU0VfREVMQVkgPSAzMDA7XG5cbi8qKiBBbiBlbGVtZW50IHdoaWNoIHdoZW4gaG92ZXJlZCBvdmVyIG1heSBvcGVuIG9yIGNsb3NlIGEgbWVudS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVG9nZ2xlciB7XG4gIC8qKiBHZXRzIHRoZSBvcGVuIG1lbnUsIG9yIHVuZGVmaW5lZCBpZiBubyBtZW51IGlzIG9wZW4uICovXG4gIGdldE1lbnUoKTogTWVudSB8IHVuZGVmaW5lZDtcbn1cblxuLyoqIENhbGN1bGF0ZSB0aGUgc2xvcGUgYmV0d2VlbiBwb2ludCBhIGFuZCBiLiAqL1xuZnVuY3Rpb24gZ2V0U2xvcGUoYTogUG9pbnQsIGI6IFBvaW50KSB7XG4gIHJldHVybiAoYi55IC0gYS55KSAvIChiLnggLSBhLngpO1xufVxuXG4vKiogQ2FsY3VsYXRlIHRoZSB5IGludGVyY2VwdCBmb3IgdGhlIGdpdmVuIHBvaW50IGFuZCBzbG9wZS4gKi9cbmZ1bmN0aW9uIGdldFlJbnRlcmNlcHQocG9pbnQ6IFBvaW50LCBzbG9wZTogbnVtYmVyKSB7XG4gIHJldHVybiBwb2ludC55IC0gc2xvcGUgKiBwb2ludC54O1xufVxuXG4vKiogUmVwcmVzZW50cyBhIGNvb3JkaW5hdGUgb2YgbW91c2UgdHJhdmVsLiAqL1xudHlwZSBQb2ludCA9IHt4OiBudW1iZXI7IHk6IG51bWJlcn07XG5cbi8qKlxuICogV2hldGhlciB0aGUgZ2l2ZW4gbW91c2UgdHJhamVjdG9yeSBsaW5lIGRlZmluZWQgYnkgdGhlIHNsb3BlIGFuZCB5IGludGVyY2VwdCBmYWxscyB3aXRoaW4gdGhlXG4gKiBzdWJtZW51IGFzIGRlZmluZWQgYnkgYHN1Ym1lbnVQb2ludHNgXG4gKiBAcGFyYW0gc3VibWVudVBvaW50cyB0aGUgc3VibWVudSBET01SZWN0IHBvaW50cy5cbiAqIEBwYXJhbSBtIHRoZSBzbG9wZSBvZiB0aGUgdHJhamVjdG9yeSBsaW5lLlxuICogQHBhcmFtIGIgdGhlIHkgaW50ZXJjZXB0IG9mIHRoZSB0cmFqZWN0b3J5IGxpbmUuXG4gKiBAcmV0dXJuIHRydWUgaWYgYW55IHBvaW50IG9uIHRoZSBsaW5lIGZhbGxzIHdpdGhpbiB0aGUgc3VibWVudS5cbiAqL1xuZnVuY3Rpb24gaXNXaXRoaW5TdWJtZW51KHN1Ym1lbnVQb2ludHM6IERPTVJlY3QsIG06IG51bWJlciwgYjogbnVtYmVyKSB7XG4gIGNvbnN0IHtsZWZ0LCByaWdodCwgdG9wLCBib3R0b219ID0gc3VibWVudVBvaW50cztcblxuICAvLyBDaGVjayBmb3IgaW50ZXJzZWN0aW9uIHdpdGggZWFjaCBlZGdlIG9mIHRoZSBzdWJtZW51IChsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pXG4gIC8vIGJ5IGZpeGluZyBvbmUgY29vcmRpbmF0ZSB0byB0aGF0IGVkZ2UncyBjb29yZGluYXRlIChlaXRoZXIgeCBvciB5KSBhbmQgY2hlY2tpbmcgaWYgdGhlXG4gIC8vIG90aGVyIGNvb3JkaW5hdGUgaXMgd2l0aGluIGJvdW5kcy5cbiAgcmV0dXJuIChcbiAgICAobSAqIGxlZnQgKyBiID49IHRvcCAmJiBtICogbGVmdCArIGIgPD0gYm90dG9tKSB8fFxuICAgIChtICogcmlnaHQgKyBiID49IHRvcCAmJiBtICogcmlnaHQgKyBiIDw9IGJvdHRvbSkgfHxcbiAgICAoKHRvcCAtIGIpIC8gbSA+PSBsZWZ0ICYmICh0b3AgLSBiKSAvIG0gPD0gcmlnaHQpIHx8XG4gICAgKChib3R0b20gLSBiKSAvIG0gPj0gbGVmdCAmJiAoYm90dG9tIC0gYikgLyBtIDw9IHJpZ2h0KVxuICApO1xufVxuXG4vKipcbiAqIFRhcmdldE1lbnVBaW0gcHJlZGljdHMgaWYgYSB1c2VyIGlzIG1vdmluZyBpbnRvIGEgc3VibWVudS4gSXQgY2FsY3VsYXRlcyB0aGVcbiAqIHRyYWplY3Rvcnkgb2YgdGhlIHVzZXIncyBtb3VzZSBtb3ZlbWVudCBpbiB0aGUgY3VycmVudCBtZW51IHRvIGRldGVybWluZSBpZiB0aGVcbiAqIG1vdXNlIGlzIG1vdmluZyB0b3dhcmRzIGFuIG9wZW4gc3VibWVudS5cbiAqXG4gKiBUaGUgZGV0ZXJtaW5hdGlvbiBpcyBtYWRlIGJ5IGNhbGN1bGF0aW5nIHRoZSBzbG9wZSBvZiB0aGUgdXNlcnMgbGFzdCBOVU1fUE9JTlRTIG1vdmVzIHdoZXJlIGVhY2hcbiAqIHBhaXIgb2YgcG9pbnRzIGRldGVybWluZXMgaWYgdGhlIHRyYWplY3RvcnkgbGluZSBwb2ludHMgaW50byB0aGUgc3VibWVudS4gSXQgdXNlcyBjb25zZW5zdXNcbiAqIGFwcHJvYWNoIGJ5IGNoZWNraW5nIGlmIGF0IGxlYXN0IE5VTV9QT0lOVFMgLyAyIHBhaXJzIGRldGVybWluZSB0aGF0IHRoZSB1c2VyIGlzIG1vdmluZyB0b3dhcmRzXG4gKiB0byBzdWJtZW51LlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGFyZ2V0TWVudUFpbSBpbXBsZW1lbnRzIE1lbnVBaW0sIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgQW5ndWxhciB6b25lLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9uZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICAvKiogVGhlIGxhc3QgTlVNX1BPSU5UUyBtb3VzZSBtb3ZlIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcG9pbnRzOiBQb2ludFtdID0gW107XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgcm9vdCBtZW51IGluIHdoaWNoIHdlIGFyZSB0cmFja2luZyBtb3VzZSBtb3Zlcy4gKi9cbiAgcHJpdmF0ZSBfbWVudTogTWVudTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSByb290IG1lbnUncyBtb3VzZSBtYW5hZ2VyLiAqL1xuICBwcml2YXRlIF9wb2ludGVyVHJhY2tlcjogUG9pbnRlckZvY3VzVHJhY2tlcjxUb2dnbGVyICYgRm9jdXNhYmxlRWxlbWVudD47XG5cbiAgLyoqIFRoZSBpZCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgdGltZW91dCBjYWxsIHdhaXRpbmcgdG8gcmVzb2x2ZS4gKi9cbiAgcHJpdmF0ZSBfdGltZW91dElkOiBudW1iZXIgfCBudWxsO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoaXMgc2VydmljZSBpcyBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Rlc3Ryb3llZDogU3ViamVjdDx2b2lkPiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIE1lbnUgYW5kIGl0cyBQb2ludGVyRm9jdXNUcmFja2VyLlxuICAgKiBAcGFyYW0gbWVudSBUaGUgbWVudSB0aGF0IHRoaXMgbWVudSBhaW0gc2VydmljZSBjb250cm9scy5cbiAgICogQHBhcmFtIHBvaW50ZXJUcmFja2VyIFRoZSBgUG9pbnRlckZvY3VzVHJhY2tlcmAgZm9yIHRoZSBnaXZlbiBtZW51LlxuICAgKi9cbiAgaW5pdGlhbGl6ZShtZW51OiBNZW51LCBwb2ludGVyVHJhY2tlcjogUG9pbnRlckZvY3VzVHJhY2tlcjxGb2N1c2FibGVFbGVtZW50ICYgVG9nZ2xlcj4pIHtcbiAgICB0aGlzLl9tZW51ID0gbWVudTtcbiAgICB0aGlzLl9wb2ludGVyVHJhY2tlciA9IHBvaW50ZXJUcmFja2VyO1xuICAgIHRoaXMuX3N1YnNjcmliZVRvTW91c2VNb3ZlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBgZG9Ub2dnbGVgIGNhbGxiYWNrIHdoZW4gaXQgaXMgZGVlbWVkIHRoYXQgdGhlIHVzZXIgaXMgbm90IG1vdmluZyB0b3dhcmRzXG4gICAqIHRoZSBzdWJtZW51LlxuICAgKiBAcGFyYW0gZG9Ub2dnbGUgdGhlIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGlzIG5vdCBtb3ZpbmcgdG93YXJkcyB0aGUgc3VibWVudS5cbiAgICovXG4gIHRvZ2dsZShkb1RvZ2dsZTogKCkgPT4gdm9pZCkge1xuICAgIC8vIElmIHRoZSBtZW51IGlzIGhvcml6b250YWwgdGhlIHN1Yi1tZW51cyBvcGVuIGJlbG93IGFuZCB0aGVyZSBpcyBubyByaXNrIG9mIHByZW1hdHVyZVxuICAgIC8vIGNsb3Npbmcgb2YgYW55IHN1Yi1tZW51cyB0aGVyZWZvcmUgd2UgYXV0b21hdGljYWxseSByZXNvbHZlIHRoZSBjYWxsYmFjay5cbiAgICBpZiAodGhpcy5fbWVudS5vcmllbnRhdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICBkb1RvZ2dsZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX2NoZWNrQ29uZmlndXJlZCgpO1xuXG4gICAgY29uc3Qgc2libGluZ0l0ZW1Jc1dhaXRpbmcgPSAhIXRoaXMuX3RpbWVvdXRJZDtcbiAgICBjb25zdCBoYXNQb2ludHMgPSB0aGlzLl9wb2ludHMubGVuZ3RoID4gMTtcblxuICAgIGlmIChoYXNQb2ludHMgJiYgIXNpYmxpbmdJdGVtSXNXYWl0aW5nKSB7XG4gICAgICBpZiAodGhpcy5faXNNb3ZpbmdUb1N1Ym1lbnUoKSkge1xuICAgICAgICB0aGlzLl9zdGFydFRpbWVvdXQoZG9Ub2dnbGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9Ub2dnbGUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFzaWJsaW5nSXRlbUlzV2FpdGluZykge1xuICAgICAgZG9Ub2dnbGUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgdGhlIGRlbGF5ZWQgdG9nZ2xlIGhhbmRsZXIgaWYgb25lIGlzbid0IHJ1bm5pbmcgYWxyZWFkeS5cbiAgICpcbiAgICogVGhlIGRlbGF5ZWQgdG9nZ2xlIGhhbmRsZXIgZXhlY3V0ZXMgdGhlIGBkb1RvZ2dsZWAgY2FsbGJhY2sgYWZ0ZXIgc29tZSBwZXJpb2Qgb2YgdGltZSBpZmYgdGhlXG4gICAqIHVzZXJzIG1vdXNlIGlzIG9uIGFuIGl0ZW0gaW4gdGhlIGN1cnJlbnQgbWVudS5cbiAgICpcbiAgICogQHBhcmFtIGRvVG9nZ2xlIHRoZSBmdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgdXNlciBpcyBub3QgbW92aW5nIHRvd2FyZHMgdGhlIHN1Ym1lbnUuXG4gICAqL1xuICBwcml2YXRlIF9zdGFydFRpbWVvdXQoZG9Ub2dnbGU6ICgpID0+IHZvaWQpIHtcbiAgICAvLyBJZiB0aGUgdXNlcnMgbW91c2UgaXMgbW92aW5nIHRvd2FyZHMgYSBzdWJtZW51IHdlIGRvbid0IHdhbnQgdG8gaW1tZWRpYXRlbHkgcmVzb2x2ZS5cbiAgICAvLyBXYWl0IGZvciBzb21lIHBlcmlvZCBvZiB0aW1lIGJlZm9yZSBkZXRlcm1pbmluZyBpZiB0aGUgcHJldmlvdXMgbWVudSBzaG91bGQgY2xvc2UgaW5cbiAgICAvLyBjYXNlcyB3aGVyZSB0aGUgdXNlciBtYXkgaGF2ZSBtb3ZlZCB0b3dhcmRzIHRoZSBzdWJtZW51IGJ1dCBzdG9wcGVkIG9uIGEgc2libGluZyBtZW51XG4gICAgLy8gaXRlbSBpbnRlbnRpb25hbGx5LlxuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgLy8gUmVzb2x2ZSBpZiB0aGUgdXNlciBpcyBjdXJyZW50bHkgbW91c2VkIG92ZXIgc29tZSBlbGVtZW50IGluIHRoZSByb290IG1lbnVcbiAgICAgIGlmICh0aGlzLl9wb2ludGVyVHJhY2tlciEuYWN0aXZlRWxlbWVudCAmJiB0aW1lb3V0SWQgPT09IHRoaXMuX3RpbWVvdXRJZCkge1xuICAgICAgICBkb1RvZ2dsZSgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fdGltZW91dElkID0gbnVsbDtcbiAgICB9LCBDTE9TRV9ERUxBWSkgYXMgYW55IGFzIG51bWJlcjtcblxuICAgIHRoaXMuX3RpbWVvdXRJZCA9IHRpbWVvdXRJZDtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIGlzIGhlYWRpbmcgdG93YXJkcyB0aGUgb3BlbiBzdWJtZW51LiAqL1xuICBwcml2YXRlIF9pc01vdmluZ1RvU3VibWVudSgpIHtcbiAgICBjb25zdCBzdWJtZW51UG9pbnRzID0gdGhpcy5fZ2V0U3VibWVudUJvdW5kcygpO1xuICAgIGlmICghc3VibWVudVBvaW50cykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBudW1Nb3ZpbmcgPSAwO1xuICAgIGNvbnN0IGN1cnJQb2ludCA9IHRoaXMuX3BvaW50c1t0aGlzLl9wb2ludHMubGVuZ3RoIC0gMV07XG4gICAgLy8gc3RhcnQgZnJvbSB0aGUgc2Vjb25kIGxhc3QgcG9pbnQgYW5kIGNhbGN1bGF0ZSB0aGUgc2xvcGUgYmV0d2VlbiBlYWNoIHBvaW50IGFuZCB0aGUgbGFzdFxuICAgIC8vIHBvaW50LlxuICAgIGZvciAobGV0IGkgPSB0aGlzLl9wb2ludHMubGVuZ3RoIC0gMjsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gdGhpcy5fcG9pbnRzW2ldO1xuICAgICAgY29uc3Qgc2xvcGUgPSBnZXRTbG9wZShjdXJyUG9pbnQsIHByZXZpb3VzKTtcbiAgICAgIGlmIChpc1dpdGhpblN1Ym1lbnUoc3VibWVudVBvaW50cywgc2xvcGUsIGdldFlJbnRlcmNlcHQoY3VyclBvaW50LCBzbG9wZSkpKSB7XG4gICAgICAgIG51bU1vdmluZysrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVtTW92aW5nID49IE1hdGguZmxvb3IoTlVNX1BPSU5UUyAvIDIpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgYm91bmRpbmcgRE9NUmVjdCBmb3IgdGhlIG9wZW4gc3VibWVudS4gKi9cbiAgcHJpdmF0ZSBfZ2V0U3VibWVudUJvdW5kcygpOiBET01SZWN0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fcG9pbnRlclRyYWNrZXI/LnByZXZpb3VzRWxlbWVudD8uZ2V0TWVudSgpPy5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgcmVmZXJlbmNlIHRvIHRoZSBQb2ludGVyRm9jdXNUcmFja2VyIGFuZCBtZW51IGVsZW1lbnQgaXMgcHJvdmlkZWQuXG4gICAqIEB0aHJvd3MgYW4gZXJyb3IgaWYgbmVpdGhlciByZWZlcmVuY2UgaXMgcHJvdmlkZWQuXG4gICAqL1xuICBwcml2YXRlIF9jaGVja0NvbmZpZ3VyZWQoKSB7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKCF0aGlzLl9wb2ludGVyVHJhY2tlcikge1xuICAgICAgICB0aHJvd01pc3NpbmdQb2ludGVyRm9jdXNUcmFja2VyKCk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuX21lbnUpIHtcbiAgICAgICAgdGhyb3dNaXNzaW5nTWVudVJlZmVyZW5jZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTdWJzY3JpYmUgdG8gdGhlIHJvb3QgbWVudXMgbW91c2UgbW92ZSBldmVudHMgYW5kIHVwZGF0ZSB0aGUgdHJhY2tlZCBtb3VzZSBwb2ludHMuICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvTW91c2VNb3ZlcygpIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHRoaXMuX21lbnUubmF0aXZlRWxlbWVudCwgJ21vdXNlbW92ZScpXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIGZpbHRlcigoXzogTW91c2VFdmVudCwgaW5kZXg6IG51bWJlcikgPT4gaW5kZXggJSBNT1VTRV9NT1ZFX1NBTVBMRV9GUkVRVUVOQ1kgPT09IDApLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpLFxuICAgICAgICApXG4gICAgICAgIC5zdWJzY3JpYmUoKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgdGhpcy5fcG9pbnRzLnB1c2goe3g6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFl9KTtcbiAgICAgICAgICBpZiAodGhpcy5fcG9pbnRzLmxlbmd0aCA+IE5VTV9QT0lOVFMpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvaW50cy5zaGlmdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDZGtUYXJnZXRNZW51QWltIGlzIGEgcHJvdmlkZXIgZm9yIHRoZSBUYXJnZXRNZW51QWltIHNlcnZpY2UuIEl0IGNhbiBiZSBhZGRlZCB0byBhblxuICogZWxlbWVudCB3aXRoIGVpdGhlciB0aGUgYGNka01lbnVgIG9yIGBjZGtNZW51QmFyYCBkaXJlY3RpdmUgYW5kIGNoaWxkIG1lbnUgaXRlbXMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtUYXJnZXRNZW51QWltXScsXG4gIGV4cG9ydEFzOiAnY2RrVGFyZ2V0TWVudUFpbScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBNRU5VX0FJTSwgdXNlQ2xhc3M6IFRhcmdldE1lbnVBaW19XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGFyZ2V0TWVudUFpbSB7fVxuIl19