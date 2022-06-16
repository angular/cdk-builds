/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Inject, Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** CSS class applied to the document body when in black-on-white high-contrast mode. */
export const BLACK_ON_WHITE_CSS_CLASS = 'cdk-high-contrast-black-on-white';
/** CSS class applied to the document body when in white-on-black high-contrast mode. */
export const WHITE_ON_BLACK_CSS_CLASS = 'cdk-high-contrast-white-on-black';
/** CSS class applied to the document body when in high-contrast mode. */
export const HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS = 'cdk-high-contrast-active';
/**
 * Service to determine whether the browser is currently in a high-contrast-mode environment.
 *
 * Microsoft Windows supports an accessibility feature called "High Contrast Mode". This mode
 * changes the appearance of all applications, including web applications, to dramatically increase
 * contrast.
 *
 * IE, Edge, and Firefox currently support this mode. Chrome does not support Windows High Contrast
 * Mode. This service does not detect high-contrast mode as added by the Chrome "High Contrast"
 * browser extension.
 */
export class HighContrastModeDetector {
    constructor(_platform, document) {
        this._platform = _platform;
        this._document = document;
        this._breakpointSubscription = inject(BreakpointObserver)
            .observe('(forced-colors: active)')
            .subscribe(() => {
            if (this._hasCheckedHighContrastMode) {
                this._hasCheckedHighContrastMode = false;
                this._applyBodyHighContrastModeCssClasses();
            }
        });
    }
    /** Gets the current high-contrast-mode for the page. */
    getHighContrastMode() {
        if (!this._platform.isBrowser) {
            return 0 /* HighContrastMode.NONE */;
        }
        // Create a test element with an arbitrary background-color that is neither black nor
        // white; high-contrast mode will coerce the color to either black or white. Also ensure that
        // appending the test element to the DOM does not affect layout by absolutely positioning it
        const testElement = this._document.createElement('div');
        testElement.style.backgroundColor = 'rgb(1,2,3)';
        testElement.style.position = 'absolute';
        this._document.body.appendChild(testElement);
        // Get the computed style for the background color, collapsing spaces to normalize between
        // browsers. Once we get this color, we no longer need the test element. Access the `window`
        // via the document so we can fake it in tests. Note that we have extra null checks, because
        // this logic will likely run during app bootstrap and throwing can break the entire app.
        const documentWindow = this._document.defaultView || window;
        const computedStyle = documentWindow && documentWindow.getComputedStyle
            ? documentWindow.getComputedStyle(testElement)
            : null;
        const computedColor = ((computedStyle && computedStyle.backgroundColor) || '').replace(/ /g, '');
        testElement.remove();
        switch (computedColor) {
            case 'rgb(0,0,0)':
                return 2 /* HighContrastMode.WHITE_ON_BLACK */;
            case 'rgb(255,255,255)':
                return 1 /* HighContrastMode.BLACK_ON_WHITE */;
        }
        return 0 /* HighContrastMode.NONE */;
    }
    ngOnDestroy() {
        this._breakpointSubscription.unsubscribe();
    }
    /** Applies CSS classes indicating high-contrast mode to document body (browser-only). */
    _applyBodyHighContrastModeCssClasses() {
        if (!this._hasCheckedHighContrastMode && this._platform.isBrowser && this._document.body) {
            const bodyClasses = this._document.body.classList;
            bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, BLACK_ON_WHITE_CSS_CLASS, WHITE_ON_BLACK_CSS_CLASS);
            this._hasCheckedHighContrastMode = true;
            const mode = this.getHighContrastMode();
            if (mode === 1 /* HighContrastMode.BLACK_ON_WHITE */) {
                bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, BLACK_ON_WHITE_CSS_CLASS);
            }
            else if (mode === 2 /* HighContrastMode.WHITE_ON_BLACK */) {
                bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS, WHITE_ON_BLACK_CSS_CLASS);
            }
        }
    }
}
HighContrastModeDetector.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: HighContrastModeDetector, deps: [{ token: i1.Platform }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable });
HighContrastModeDetector.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: HighContrastModeDetector, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.1", ngImport: i0, type: HighContrastModeDetector, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.Platform }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaC1jb250cmFzdC1tb2RlLWRldGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2hpZ2gtY29udHJhc3QtbW9kZS9oaWdoLWNvbnRyYXN0LW1vZGUtZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3BFLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7OztBQVV6Qyx3RkFBd0Y7QUFDeEYsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsa0NBQWtDLENBQUM7QUFFM0Usd0ZBQXdGO0FBQ3hGLE1BQU0sQ0FBQyxNQUFNLHdCQUF3QixHQUFHLGtDQUFrQyxDQUFDO0FBRTNFLHlFQUF5RTtBQUN6RSxNQUFNLENBQUMsTUFBTSxtQ0FBbUMsR0FBRywwQkFBMEIsQ0FBQztBQUU5RTs7Ozs7Ozs7OztHQVVHO0FBRUgsTUFBTSxPQUFPLHdCQUF3QjtJQVNuQyxZQUFvQixTQUFtQixFQUFvQixRQUFhO1FBQXBELGNBQVMsR0FBVCxTQUFTLENBQVU7UUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFFMUIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQzthQUN0RCxPQUFPLENBQUMseUJBQXlCLENBQUM7YUFDbEMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUNkLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO2dCQUNwQyxJQUFJLENBQUMsMkJBQTJCLEdBQUcsS0FBSyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsQ0FBQzthQUM3QztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELHdEQUF3RDtJQUN4RCxtQkFBbUI7UUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzdCLHFDQUE2QjtTQUM5QjtRQUVELHFGQUFxRjtRQUNyRiw2RkFBNkY7UUFDN0YsNEZBQTRGO1FBQzVGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hELFdBQVcsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFlBQVksQ0FBQztRQUNqRCxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTdDLDBGQUEwRjtRQUMxRiw0RkFBNEY7UUFDNUYsNEZBQTRGO1FBQzVGLHlGQUF5RjtRQUN6RixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUM7UUFDNUQsTUFBTSxhQUFhLEdBQ2pCLGNBQWMsSUFBSSxjQUFjLENBQUMsZ0JBQWdCO1lBQy9DLENBQUMsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO1lBQzlDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDWCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQ3BGLElBQUksRUFDSixFQUFFLENBQ0gsQ0FBQztRQUNGLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVyQixRQUFRLGFBQWEsRUFBRTtZQUNyQixLQUFLLFlBQVk7Z0JBQ2YsK0NBQXVDO1lBQ3pDLEtBQUssa0JBQWtCO2dCQUNyQiwrQ0FBdUM7U0FDMUM7UUFDRCxxQ0FBNkI7SUFDL0IsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDN0MsQ0FBQztJQUVELHlGQUF5RjtJQUN6RixvQ0FBb0M7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQywyQkFBMkIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRTtZQUN4RixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDbEQsV0FBVyxDQUFDLE1BQU0sQ0FDaEIsbUNBQW1DLEVBQ25DLHdCQUF3QixFQUN4Qix3QkFBd0IsQ0FDekIsQ0FBQztZQUNGLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7WUFFeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDeEMsSUFBSSxJQUFJLDRDQUFvQyxFQUFFO2dCQUM1QyxXQUFXLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7YUFDaEY7aUJBQU0sSUFBSSxJQUFJLDRDQUFvQyxFQUFFO2dCQUNuRCxXQUFXLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7YUFDaEY7U0FDRjtJQUNILENBQUM7O3FIQWxGVSx3QkFBd0IsMENBU2MsUUFBUTt5SEFUOUMsd0JBQXdCLGNBRFosTUFBTTsyRkFDbEIsd0JBQXdCO2tCQURwQyxVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7MEJBVVksTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3QsIEluamVjdGFibGUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0JyZWFrcG9pbnRPYnNlcnZlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2xheW91dCc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuLyoqIFNldCBvZiBwb3NzaWJsZSBoaWdoLWNvbnRyYXN0IG1vZGUgYmFja2dyb3VuZHMuICovXG5leHBvcnQgY29uc3QgZW51bSBIaWdoQ29udHJhc3RNb2RlIHtcbiAgTk9ORSxcbiAgQkxBQ0tfT05fV0hJVEUsXG4gIFdISVRFX09OX0JMQUNLLFxufVxuXG4vKiogQ1NTIGNsYXNzIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkgd2hlbiBpbiBibGFjay1vbi13aGl0ZSBoaWdoLWNvbnRyYXN0IG1vZGUuICovXG5leHBvcnQgY29uc3QgQkxBQ0tfT05fV0hJVEVfQ1NTX0NMQVNTID0gJ2Nkay1oaWdoLWNvbnRyYXN0LWJsYWNrLW9uLXdoaXRlJztcblxuLyoqIENTUyBjbGFzcyBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCBib2R5IHdoZW4gaW4gd2hpdGUtb24tYmxhY2sgaGlnaC1jb250cmFzdCBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IFdISVRFX09OX0JMQUNLX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC13aGl0ZS1vbi1ibGFjayc7XG5cbi8qKiBDU1MgY2xhc3MgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgYm9keSB3aGVuIGluIGhpZ2gtY29udHJhc3QgbW9kZS4gKi9cbmV4cG9ydCBjb25zdCBISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC1hY3RpdmUnO1xuXG4vKipcbiAqIFNlcnZpY2UgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGJyb3dzZXIgaXMgY3VycmVudGx5IGluIGEgaGlnaC1jb250cmFzdC1tb2RlIGVudmlyb25tZW50LlxuICpcbiAqIE1pY3Jvc29mdCBXaW5kb3dzIHN1cHBvcnRzIGFuIGFjY2Vzc2liaWxpdHkgZmVhdHVyZSBjYWxsZWQgXCJIaWdoIENvbnRyYXN0IE1vZGVcIi4gVGhpcyBtb2RlXG4gKiBjaGFuZ2VzIHRoZSBhcHBlYXJhbmNlIG9mIGFsbCBhcHBsaWNhdGlvbnMsIGluY2x1ZGluZyB3ZWIgYXBwbGljYXRpb25zLCB0byBkcmFtYXRpY2FsbHkgaW5jcmVhc2VcbiAqIGNvbnRyYXN0LlxuICpcbiAqIElFLCBFZGdlLCBhbmQgRmlyZWZveCBjdXJyZW50bHkgc3VwcG9ydCB0aGlzIG1vZGUuIENocm9tZSBkb2VzIG5vdCBzdXBwb3J0IFdpbmRvd3MgSGlnaCBDb250cmFzdFxuICogTW9kZS4gVGhpcyBzZXJ2aWNlIGRvZXMgbm90IGRldGVjdCBoaWdoLWNvbnRyYXN0IG1vZGUgYXMgYWRkZWQgYnkgdGhlIENocm9tZSBcIkhpZ2ggQ29udHJhc3RcIlxuICogYnJvd3NlciBleHRlbnNpb24uXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEhpZ2hDb250cmFzdE1vZGVEZXRlY3RvciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKlxuICAgKiBGaWd1cmluZyBvdXQgdGhlIGhpZ2ggY29udHJhc3QgbW9kZSBhbmQgYWRkaW5nIHRoZSBib2R5IGNsYXNzZXMgY2FuIGNhdXNlXG4gICAqIHNvbWUgZXhwZW5zaXZlIGxheW91dHMuIFRoaXMgZmxhZyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHdlIG9ubHkgZG8gaXQgb25jZS5cbiAgICovXG4gIHByaXZhdGUgX2hhc0NoZWNrZWRIaWdoQ29udHJhc3RNb2RlOiBib29sZWFuO1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG4gIHByaXZhdGUgX2JyZWFrcG9pbnRTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sIEBJbmplY3QoRE9DVU1FTlQpIGRvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuXG4gICAgdGhpcy5fYnJlYWtwb2ludFN1YnNjcmlwdGlvbiA9IGluamVjdChCcmVha3BvaW50T2JzZXJ2ZXIpXG4gICAgICAub2JzZXJ2ZSgnKGZvcmNlZC1jb2xvcnM6IGFjdGl2ZSknKVxuICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9oYXNDaGVja2VkSGlnaENvbnRyYXN0TW9kZSkge1xuICAgICAgICAgIHRoaXMuX2hhc0NoZWNrZWRIaWdoQ29udHJhc3RNb2RlID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5fYXBwbHlCb2R5SGlnaENvbnRyYXN0TW9kZUNzc0NsYXNzZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY3VycmVudCBoaWdoLWNvbnRyYXN0LW1vZGUgZm9yIHRoZSBwYWdlLiAqL1xuICBnZXRIaWdoQ29udHJhc3RNb2RlKCk6IEhpZ2hDb250cmFzdE1vZGUge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gSGlnaENvbnRyYXN0TW9kZS5OT05FO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIHRlc3QgZWxlbWVudCB3aXRoIGFuIGFyYml0cmFyeSBiYWNrZ3JvdW5kLWNvbG9yIHRoYXQgaXMgbmVpdGhlciBibGFjayBub3JcbiAgICAvLyB3aGl0ZTsgaGlnaC1jb250cmFzdCBtb2RlIHdpbGwgY29lcmNlIHRoZSBjb2xvciB0byBlaXRoZXIgYmxhY2sgb3Igd2hpdGUuIEFsc28gZW5zdXJlIHRoYXRcbiAgICAvLyBhcHBlbmRpbmcgdGhlIHRlc3QgZWxlbWVudCB0byB0aGUgRE9NIGRvZXMgbm90IGFmZmVjdCBsYXlvdXQgYnkgYWJzb2x1dGVseSBwb3NpdGlvbmluZyBpdFxuICAgIGNvbnN0IHRlc3RFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGVzdEVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYigxLDIsMyknO1xuICAgIHRlc3RFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRlc3RFbGVtZW50KTtcblxuICAgIC8vIEdldCB0aGUgY29tcHV0ZWQgc3R5bGUgZm9yIHRoZSBiYWNrZ3JvdW5kIGNvbG9yLCBjb2xsYXBzaW5nIHNwYWNlcyB0byBub3JtYWxpemUgYmV0d2VlblxuICAgIC8vIGJyb3dzZXJzLiBPbmNlIHdlIGdldCB0aGlzIGNvbG9yLCB3ZSBubyBsb25nZXIgbmVlZCB0aGUgdGVzdCBlbGVtZW50LiBBY2Nlc3MgdGhlIGB3aW5kb3dgXG4gICAgLy8gdmlhIHRoZSBkb2N1bWVudCBzbyB3ZSBjYW4gZmFrZSBpdCBpbiB0ZXN0cy4gTm90ZSB0aGF0IHdlIGhhdmUgZXh0cmEgbnVsbCBjaGVja3MsIGJlY2F1c2VcbiAgICAvLyB0aGlzIGxvZ2ljIHdpbGwgbGlrZWx5IHJ1biBkdXJpbmcgYXBwIGJvb3RzdHJhcCBhbmQgdGhyb3dpbmcgY2FuIGJyZWFrIHRoZSBlbnRpcmUgYXBwLlxuICAgIGNvbnN0IGRvY3VtZW50V2luZG93ID0gdGhpcy5fZG9jdW1lbnQuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGUgPVxuICAgICAgZG9jdW1lbnRXaW5kb3cgJiYgZG9jdW1lbnRXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZVxuICAgICAgICA/IGRvY3VtZW50V2luZG93LmdldENvbXB1dGVkU3R5bGUodGVzdEVsZW1lbnQpXG4gICAgICAgIDogbnVsbDtcbiAgICBjb25zdCBjb21wdXRlZENvbG9yID0gKChjb21wdXRlZFN0eWxlICYmIGNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZENvbG9yKSB8fCAnJykucmVwbGFjZShcbiAgICAgIC8gL2csXG4gICAgICAnJyxcbiAgICApO1xuICAgIHRlc3RFbGVtZW50LnJlbW92ZSgpO1xuXG4gICAgc3dpdGNoIChjb21wdXRlZENvbG9yKSB7XG4gICAgICBjYXNlICdyZ2IoMCwwLDApJzpcbiAgICAgICAgcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuV0hJVEVfT05fQkxBQ0s7XG4gICAgICBjYXNlICdyZ2IoMjU1LDI1NSwyNTUpJzpcbiAgICAgICAgcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuQkxBQ0tfT05fV0hJVEU7XG4gICAgfVxuICAgIHJldHVybiBIaWdoQ29udHJhc3RNb2RlLk5PTkU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl9icmVha3BvaW50U3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogQXBwbGllcyBDU1MgY2xhc3NlcyBpbmRpY2F0aW5nIGhpZ2gtY29udHJhc3QgbW9kZSB0byBkb2N1bWVudCBib2R5IChicm93c2VyLW9ubHkpLiAqL1xuICBfYXBwbHlCb2R5SGlnaENvbnRyYXN0TW9kZUNzc0NsYXNzZXMoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9oYXNDaGVja2VkSGlnaENvbnRyYXN0TW9kZSAmJiB0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIgJiYgdGhpcy5fZG9jdW1lbnQuYm9keSkge1xuICAgICAgY29uc3QgYm9keUNsYXNzZXMgPSB0aGlzLl9kb2N1bWVudC5ib2R5LmNsYXNzTGlzdDtcbiAgICAgIGJvZHlDbGFzc2VzLnJlbW92ZShcbiAgICAgICAgSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MsXG4gICAgICAgIEJMQUNLX09OX1dISVRFX0NTU19DTEFTUyxcbiAgICAgICAgV0hJVEVfT05fQkxBQ0tfQ1NTX0NMQVNTLFxuICAgICAgKTtcbiAgICAgIHRoaXMuX2hhc0NoZWNrZWRIaWdoQ29udHJhc3RNb2RlID0gdHJ1ZTtcblxuICAgICAgY29uc3QgbW9kZSA9IHRoaXMuZ2V0SGlnaENvbnRyYXN0TW9kZSgpO1xuICAgICAgaWYgKG1vZGUgPT09IEhpZ2hDb250cmFzdE1vZGUuQkxBQ0tfT05fV0hJVEUpIHtcbiAgICAgICAgYm9keUNsYXNzZXMuYWRkKEhJR0hfQ09OVFJBU1RfTU9ERV9BQ1RJVkVfQ1NTX0NMQVNTLCBCTEFDS19PTl9XSElURV9DU1NfQ0xBU1MpO1xuICAgICAgfSBlbHNlIGlmIChtb2RlID09PSBIaWdoQ29udHJhc3RNb2RlLldISVRFX09OX0JMQUNLKSB7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUywgV0hJVEVfT05fQkxBQ0tfQ1NTX0NMQVNTKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==