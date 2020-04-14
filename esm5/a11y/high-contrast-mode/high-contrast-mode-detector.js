/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
import * as i2 from "@angular/common";
/** CSS class applied to the document body when in black-on-white high-contrast mode. */
export var BLACK_ON_WHITE_CSS_CLASS = 'cdk-high-contrast-black-on-white';
/** CSS class applied to the document body when in white-on-black high-contrast mode. */
export var WHITE_ON_BLACK_CSS_CLASS = 'cdk-high-contrast-white-on-black';
/** CSS class applied to the document body when in high-contrast mode. */
export var HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS = 'cdk-high-contrast-active';
/**
 * Service to determine whether the browser is currently in a high-constrast-mode environment.
 *
 * Microsoft Windows supports an accessibility feature called "High Contrast Mode". This mode
 * changes the appearance of all applications, including web applications, to dramatically increase
 * contrast.
 *
 * IE, Edge, and Firefox currently support this mode. Chrome does not support Windows High Contrast
 * Mode. This service does not detect high-contrast mode as added by the Chrome "High Contrast"
 * browser extension.
 */
var HighContrastModeDetector = /** @class */ (function () {
    function HighContrastModeDetector(_platform, document) {
        this._platform = _platform;
        this._document = document;
    }
    /** Gets the current high-constrast-mode for the page. */
    HighContrastModeDetector.prototype.getHighContrastMode = function () {
        if (!this._platform.isBrowser) {
            return 0 /* NONE */;
        }
        // Create a test element with an arbitrary background-color that is neither black nor
        // white; high-contrast mode will coerce the color to either black or white. Also ensure that
        // appending the test element to the DOM does not affect layout by absolutely positioning it
        var testElement = this._document.createElement('div');
        testElement.style.backgroundColor = 'rgb(1,2,3)';
        testElement.style.position = 'absolute';
        this._document.body.appendChild(testElement);
        // Get the computed style for the background color, collapsing spaces to normalize between
        // browsers. Once we get this color, we no longer need the test element. Access the `window`
        // via the document so we can fake it in tests. Note that we have extra null checks, because
        // this logic will likely run during app bootstrap and throwing can break the entire app.
        var documentWindow = this._document.defaultView || window;
        var computedStyle = (documentWindow && documentWindow.getComputedStyle) ?
            documentWindow.getComputedStyle(testElement) : null;
        var computedColor = (computedStyle && computedStyle.backgroundColor || '').replace(/ /g, '');
        this._document.body.removeChild(testElement);
        switch (computedColor) {
            case 'rgb(0,0,0)': return 2 /* WHITE_ON_BLACK */;
            case 'rgb(255,255,255)': return 1 /* BLACK_ON_WHITE */;
        }
        return 0 /* NONE */;
    };
    /** Applies CSS classes indicating high-contrast mode to document body (browser-only). */
    HighContrastModeDetector.prototype._applyBodyHighContrastModeCssClasses = function () {
        if (this._platform.isBrowser && this._document.body) {
            var bodyClasses = this._document.body.classList;
            // IE11 doesn't support `classList` operations with multiple arguments
            bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
            bodyClasses.remove(BLACK_ON_WHITE_CSS_CLASS);
            bodyClasses.remove(WHITE_ON_BLACK_CSS_CLASS);
            var mode = this.getHighContrastMode();
            if (mode === 1 /* BLACK_ON_WHITE */) {
                bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                bodyClasses.add(BLACK_ON_WHITE_CSS_CLASS);
            }
            else if (mode === 2 /* WHITE_ON_BLACK */) {
                bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                bodyClasses.add(WHITE_ON_BLACK_CSS_CLASS);
            }
        }
    };
    HighContrastModeDetector.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    HighContrastModeDetector.ctorParameters = function () { return [
        { type: Platform },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ]; };
    HighContrastModeDetector.ɵprov = i0.ɵɵdefineInjectable({ factory: function HighContrastModeDetector_Factory() { return new HighContrastModeDetector(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT)); }, token: HighContrastModeDetector, providedIn: "root" });
    return HighContrastModeDetector;
}());
export { HighContrastModeDetector };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaC1jb250cmFzdC1tb2RlLWRldGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2hpZ2gtY29udHJhc3QtbW9kZS9oaWdoLWNvbnRyYXN0LW1vZGUtZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7OztBQVVqRCx3RkFBd0Y7QUFDeEYsTUFBTSxDQUFDLElBQU0sd0JBQXdCLEdBQUcsa0NBQWtDLENBQUM7QUFFM0Usd0ZBQXdGO0FBQ3hGLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLGtDQUFrQyxDQUFDO0FBRTNFLHlFQUF5RTtBQUN6RSxNQUFNLENBQUMsSUFBTSxtQ0FBbUMsR0FBRywwQkFBMEIsQ0FBQztBQUU5RTs7Ozs7Ozs7OztHQVVHO0FBQ0g7SUFJRSxrQ0FBb0IsU0FBbUIsRUFBb0IsUUFBYTtRQUFwRCxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7SUFFRCx5REFBeUQ7SUFDekQsc0RBQW1CLEdBQW5CO1FBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzdCLG9CQUE2QjtTQUM5QjtRQUVELHFGQUFxRjtRQUNyRiw2RkFBNkY7UUFDN0YsNEZBQTRGO1FBQzVGLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hELFdBQVcsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFlBQVksQ0FBQztRQUNqRCxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7UUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTdDLDBGQUEwRjtRQUMxRiw0RkFBNEY7UUFDNUYsNEZBQTRGO1FBQzVGLHlGQUF5RjtRQUN6RixJQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUM7UUFDNUQsSUFBTSxhQUFhLEdBQUcsQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN2RSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN4RCxJQUFNLGFBQWEsR0FDZixDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTdDLFFBQVEsYUFBYSxFQUFFO1lBQ3JCLEtBQUssWUFBWSxDQUFDLENBQUMsOEJBQXVDO1lBQzFELEtBQUssa0JBQWtCLENBQUMsQ0FBQyw4QkFBdUM7U0FDakU7UUFDRCxvQkFBNkI7SUFDL0IsQ0FBQztJQUVELHlGQUF5RjtJQUN6Rix1RUFBb0MsR0FBcEM7UUFDRSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFO1lBQ25ELElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNsRCxzRUFBc0U7WUFDdEUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ3hELFdBQVcsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUM3QyxXQUFXLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFFN0MsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDeEMsSUFBSSxJQUFJLDJCQUFvQyxFQUFFO2dCQUM1QyxXQUFXLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3JELFdBQVcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQzthQUMzQztpQkFBTSxJQUFJLElBQUksMkJBQW9DLEVBQUU7Z0JBQ25ELFdBQVcsQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztnQkFDckQsV0FBVyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2FBQzNDO1NBQ0Y7SUFDSCxDQUFDOztnQkExREYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnQkFoQ3hCLFFBQVE7Z0RBb0M0QixNQUFNLFNBQUMsUUFBUTs7O21DQTVDM0Q7Q0FtR0MsQUEzREQsSUEyREM7U0ExRFksd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKiBTZXQgb2YgcG9zc2libGUgaGlnaC1jb250cmFzdCBtb2RlIGJhY2tncm91bmRzLiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSGlnaENvbnRyYXN0TW9kZSB7XG4gIE5PTkUsXG4gIEJMQUNLX09OX1dISVRFLFxuICBXSElURV9PTl9CTEFDSyxcbn1cblxuLyoqIENTUyBjbGFzcyBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCBib2R5IHdoZW4gaW4gYmxhY2stb24td2hpdGUgaGlnaC1jb250cmFzdCBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IEJMQUNLX09OX1dISVRFX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC1ibGFjay1vbi13aGl0ZSc7XG5cbi8qKiBDU1MgY2xhc3MgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgYm9keSB3aGVuIGluIHdoaXRlLW9uLWJsYWNrIGhpZ2gtY29udHJhc3QgbW9kZS4gKi9cbmV4cG9ydCBjb25zdCBXSElURV9PTl9CTEFDS19DU1NfQ0xBU1MgPSAnY2RrLWhpZ2gtY29udHJhc3Qtd2hpdGUtb24tYmxhY2snO1xuXG4vKiogQ1NTIGNsYXNzIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkgd2hlbiBpbiBoaWdoLWNvbnRyYXN0IG1vZGUuICovXG5leHBvcnQgY29uc3QgSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MgPSAnY2RrLWhpZ2gtY29udHJhc3QtYWN0aXZlJztcblxuLyoqXG4gKiBTZXJ2aWNlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBicm93c2VyIGlzIGN1cnJlbnRseSBpbiBhIGhpZ2gtY29uc3RyYXN0LW1vZGUgZW52aXJvbm1lbnQuXG4gKlxuICogTWljcm9zb2Z0IFdpbmRvd3Mgc3VwcG9ydHMgYW4gYWNjZXNzaWJpbGl0eSBmZWF0dXJlIGNhbGxlZCBcIkhpZ2ggQ29udHJhc3QgTW9kZVwiLiBUaGlzIG1vZGVcbiAqIGNoYW5nZXMgdGhlIGFwcGVhcmFuY2Ugb2YgYWxsIGFwcGxpY2F0aW9ucywgaW5jbHVkaW5nIHdlYiBhcHBsaWNhdGlvbnMsIHRvIGRyYW1hdGljYWxseSBpbmNyZWFzZVxuICogY29udHJhc3QuXG4gKlxuICogSUUsIEVkZ2UsIGFuZCBGaXJlZm94IGN1cnJlbnRseSBzdXBwb3J0IHRoaXMgbW9kZS4gQ2hyb21lIGRvZXMgbm90IHN1cHBvcnQgV2luZG93cyBIaWdoIENvbnRyYXN0XG4gKiBNb2RlLiBUaGlzIHNlcnZpY2UgZG9lcyBub3QgZGV0ZWN0IGhpZ2gtY29udHJhc3QgbW9kZSBhcyBhZGRlZCBieSB0aGUgQ2hyb21lIFwiSGlnaCBDb250cmFzdFwiXG4gKiBicm93c2VyIGV4dGVuc2lvbi5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgSGlnaENvbnRyYXN0TW9kZURldGVjdG9yIHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSwgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY3VycmVudCBoaWdoLWNvbnN0cmFzdC1tb2RlIGZvciB0aGUgcGFnZS4gKi9cbiAgZ2V0SGlnaENvbnRyYXN0TW9kZSgpOiBIaWdoQ29udHJhc3RNb2RlIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuTk9ORTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSB0ZXN0IGVsZW1lbnQgd2l0aCBhbiBhcmJpdHJhcnkgYmFja2dyb3VuZC1jb2xvciB0aGF0IGlzIG5laXRoZXIgYmxhY2sgbm9yXG4gICAgLy8gd2hpdGU7IGhpZ2gtY29udHJhc3QgbW9kZSB3aWxsIGNvZXJjZSB0aGUgY29sb3IgdG8gZWl0aGVyIGJsYWNrIG9yIHdoaXRlLiBBbHNvIGVuc3VyZSB0aGF0XG4gICAgLy8gYXBwZW5kaW5nIHRoZSB0ZXN0IGVsZW1lbnQgdG8gdGhlIERPTSBkb2VzIG5vdCBhZmZlY3QgbGF5b3V0IGJ5IGFic29sdXRlbHkgcG9zaXRpb25pbmcgaXRcbiAgICBjb25zdCB0ZXN0RWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRlc3RFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2IoMSwyLDMpJztcbiAgICB0ZXN0RWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXN0RWxlbWVudCk7XG5cbiAgICAvLyBHZXQgdGhlIGNvbXB1dGVkIHN0eWxlIGZvciB0aGUgYmFja2dyb3VuZCBjb2xvciwgY29sbGFwc2luZyBzcGFjZXMgdG8gbm9ybWFsaXplIGJldHdlZW5cbiAgICAvLyBicm93c2Vycy4gT25jZSB3ZSBnZXQgdGhpcyBjb2xvciwgd2Ugbm8gbG9uZ2VyIG5lZWQgdGhlIHRlc3QgZWxlbWVudC4gQWNjZXNzIHRoZSBgd2luZG93YFxuICAgIC8vIHZpYSB0aGUgZG9jdW1lbnQgc28gd2UgY2FuIGZha2UgaXQgaW4gdGVzdHMuIE5vdGUgdGhhdCB3ZSBoYXZlIGV4dHJhIG51bGwgY2hlY2tzLCBiZWNhdXNlXG4gICAgLy8gdGhpcyBsb2dpYyB3aWxsIGxpa2VseSBydW4gZHVyaW5nIGFwcCBib290c3RyYXAgYW5kIHRocm93aW5nIGNhbiBicmVhayB0aGUgZW50aXJlIGFwcC5cbiAgICBjb25zdCBkb2N1bWVudFdpbmRvdyA9IHRoaXMuX2RvY3VtZW50LmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgICBjb25zdCBjb21wdXRlZFN0eWxlID0gKGRvY3VtZW50V2luZG93ICYmIGRvY3VtZW50V2luZG93LmdldENvbXB1dGVkU3R5bGUpID9cbiAgICAgICAgZG9jdW1lbnRXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0ZXN0RWxlbWVudCkgOiBudWxsO1xuICAgIGNvbnN0IGNvbXB1dGVkQ29sb3IgPVxuICAgICAgICAoY29tcHV0ZWRTdHlsZSAmJiBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRDb2xvciB8fCAnJykucmVwbGFjZSgvIC9nLCAnJyk7XG4gICAgdGhpcy5fZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0ZXN0RWxlbWVudCk7XG5cbiAgICBzd2l0Y2ggKGNvbXB1dGVkQ29sb3IpIHtcbiAgICAgIGNhc2UgJ3JnYigwLDAsMCknOiByZXR1cm4gSGlnaENvbnRyYXN0TW9kZS5XSElURV9PTl9CTEFDSztcbiAgICAgIGNhc2UgJ3JnYigyNTUsMjU1LDI1NSknOiByZXR1cm4gSGlnaENvbnRyYXN0TW9kZS5CTEFDS19PTl9XSElURTtcbiAgICB9XG4gICAgcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuTk9ORTtcbiAgfVxuXG4gIC8qKiBBcHBsaWVzIENTUyBjbGFzc2VzIGluZGljYXRpbmcgaGlnaC1jb250cmFzdCBtb2RlIHRvIGRvY3VtZW50IGJvZHkgKGJyb3dzZXItb25seSkuICovXG4gIF9hcHBseUJvZHlIaWdoQ29udHJhc3RNb2RlQ3NzQ2xhc3NlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyICYmIHRoaXMuX2RvY3VtZW50LmJvZHkpIHtcbiAgICAgIGNvbnN0IGJvZHlDbGFzc2VzID0gdGhpcy5fZG9jdW1lbnQuYm9keS5jbGFzc0xpc3Q7XG4gICAgICAvLyBJRTExIGRvZXNuJ3Qgc3VwcG9ydCBgY2xhc3NMaXN0YCBvcGVyYXRpb25zIHdpdGggbXVsdGlwbGUgYXJndW1lbnRzXG4gICAgICBib2R5Q2xhc3Nlcy5yZW1vdmUoSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MpO1xuICAgICAgYm9keUNsYXNzZXMucmVtb3ZlKEJMQUNLX09OX1dISVRFX0NTU19DTEFTUyk7XG4gICAgICBib2R5Q2xhc3Nlcy5yZW1vdmUoV0hJVEVfT05fQkxBQ0tfQ1NTX0NMQVNTKTtcblxuICAgICAgY29uc3QgbW9kZSA9IHRoaXMuZ2V0SGlnaENvbnRyYXN0TW9kZSgpO1xuICAgICAgaWYgKG1vZGUgPT09IEhpZ2hDb250cmFzdE1vZGUuQkxBQ0tfT05fV0hJVEUpIHtcbiAgICAgICAgYm9keUNsYXNzZXMuYWRkKEhJR0hfQ09OVFJBU1RfTU9ERV9BQ1RJVkVfQ1NTX0NMQVNTKTtcbiAgICAgICAgYm9keUNsYXNzZXMuYWRkKEJMQUNLX09OX1dISVRFX0NTU19DTEFTUyk7XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT09IEhpZ2hDb250cmFzdE1vZGUuV0hJVEVfT05fQkxBQ0spIHtcbiAgICAgICAgYm9keUNsYXNzZXMuYWRkKEhJR0hfQ09OVFJBU1RfTU9ERV9BQ1RJVkVfQ1NTX0NMQVNTKTtcbiAgICAgICAgYm9keUNsYXNzZXMuYWRkKFdISVRFX09OX0JMQUNLX0NTU19DTEFTUyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=