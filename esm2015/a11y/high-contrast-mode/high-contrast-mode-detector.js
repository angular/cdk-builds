/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/** @enum {number} */
const HighContrastMode = {
    NONE: 0,
    BLACK_ON_WHITE: 1,
    WHITE_ON_BLACK: 2,
};
export { HighContrastMode };
/**
 * CSS class applied to the document body when in black-on-white high-contrast mode.
 * @type {?}
 */
export const BLACK_ON_WHITE_CSS_CLASS = 'cdk-high-contrast-black-on-white';
/**
 * CSS class applied to the document body when in white-on-black high-contrast mode.
 * @type {?}
 */
export const WHITE_ON_BLACK_CSS_CLASS = 'cdk-high-contrast-white-on-black';
/**
 * CSS class applied to the document body when in high-contrast mode.
 * @type {?}
 */
export const HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS = 'cdk-high-contrast-active';
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
export class HighContrastModeDetector {
    /**
     * @param {?} _platform
     * @param {?} document
     */
    constructor(_platform, document) {
        this._platform = _platform;
        this._document = document;
    }
    /**
     * Gets the current high-constrast-mode for the page.
     * @return {?}
     */
    getHighContrastMode() {
        if (!this._platform.isBrowser) {
            return 0 /* NONE */;
        }
        // Create a test element with an arbitrary background-color that is neither black nor
        // white; high-contrast mode will coerce the color to either black or white. Also ensure that
        // appending the test element to the DOM does not affect layout by absolutely positioning it
        /** @type {?} */
        const testElement = this._document.createElement('div');
        testElement.style.backgroundColor = 'rgb(1,2,3)';
        testElement.style.position = 'absolute';
        this._document.body.appendChild(testElement);
        // Get the computed style for the background color, collapsing spaces to normalize between
        // browsers. Once we get this color, we no longer need the test element. Access the `window`
        // via the document so we can fake it in tests.
        /** @type {?} */
        const documentWindow = (/** @type {?} */ (this._document.defaultView));
        /** @type {?} */
        const computedColor = (documentWindow.getComputedStyle(testElement).backgroundColor || '').replace(/ /g, '');
        this._document.body.removeChild(testElement);
        switch (computedColor) {
            case 'rgb(0,0,0)': return 2 /* WHITE_ON_BLACK */;
            case 'rgb(255,255,255)': return 1 /* BLACK_ON_WHITE */;
        }
        return 0 /* NONE */;
    }
    /**
     * Applies CSS classes indicating high-contrast mode to document body (browser-only).
     * @return {?}
     */
    _applyBodyHighContrastModeCssClasses() {
        if (this._platform.isBrowser && this._document.body) {
            /** @type {?} */
            const bodyClasses = this._document.body.classList;
            // IE11 doesn't support `classList` operations with multiple arguments
            bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
            bodyClasses.remove(BLACK_ON_WHITE_CSS_CLASS);
            bodyClasses.remove(WHITE_ON_BLACK_CSS_CLASS);
            /** @type {?} */
            const mode = this.getHighContrastMode();
            if (mode === 1 /* BLACK_ON_WHITE */) {
                bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                bodyClasses.add(BLACK_ON_WHITE_CSS_CLASS);
            }
            else if (mode === 2 /* WHITE_ON_BLACK */) {
                bodyClasses.add(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                bodyClasses.add(WHITE_ON_BLACK_CSS_CLASS);
            }
        }
    }
}
HighContrastModeDetector.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
HighContrastModeDetector.ctorParameters = () => [
    { type: Platform },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
/** @nocollapse */ HighContrastModeDetector.ɵprov = i0.ɵɵdefineInjectable({ factory: function HighContrastModeDetector_Factory() { return new HighContrastModeDetector(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT)); }, token: HighContrastModeDetector, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    HighContrastModeDetector.prototype._document;
    /**
     * @type {?}
     * @private
     */
    HighContrastModeDetector.prototype._platform;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaC1jb250cmFzdC1tb2RlLWRldGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2hpZ2gtY29udHJhc3QtbW9kZS9oaWdoLWNvbnRyYXN0LW1vZGUtZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7SUFLL0MsT0FBSTtJQUNKLGlCQUFjO0lBQ2QsaUJBQWM7Ozs7Ozs7QUFJaEIsTUFBTSxPQUFPLHdCQUF3QixHQUFHLGtDQUFrQzs7Ozs7QUFHMUUsTUFBTSxPQUFPLHdCQUF3QixHQUFHLGtDQUFrQzs7Ozs7QUFHMUUsTUFBTSxPQUFPLG1DQUFtQyxHQUFHLDBCQUEwQjs7Ozs7Ozs7Ozs7O0FBYzdFLE1BQU0sT0FBTyx3QkFBd0I7Ozs7O0lBR25DLFlBQW9CLFNBQW1CLEVBQW9CLFFBQWE7UUFBcEQsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztJQUM1QixDQUFDOzs7OztJQUdELG1CQUFtQjtRQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDN0Isb0JBQTZCO1NBQzlCOzs7OztjQUtLLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7UUFDdkQsV0FBVyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsWUFBWSxDQUFDO1FBQ2pELFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7Ozs7O2NBS3ZDLGNBQWMsR0FBRyxtQkFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBQzs7Y0FDNUMsYUFBYSxHQUNmLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDLGVBQWUsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztRQUMxRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFN0MsUUFBUSxhQUFhLEVBQUU7WUFDckIsS0FBSyxZQUFZLENBQUMsQ0FBQyw4QkFBdUM7WUFDMUQsS0FBSyxrQkFBa0IsQ0FBQyxDQUFDLDhCQUF1QztTQUNqRTtRQUNELG9CQUE2QjtJQUMvQixDQUFDOzs7OztJQUdELG9DQUFvQztRQUNsQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFOztrQkFDN0MsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVM7WUFDakQsc0VBQXNFO1lBQ3RFLFdBQVcsQ0FBQyxNQUFNLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUN4RCxXQUFXLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDN0MsV0FBVyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDOztrQkFFdkMsSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN2QyxJQUFJLElBQUksMkJBQW9DLEVBQUU7Z0JBQzVDLFdBQVcsQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztnQkFDckQsV0FBVyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2FBQzNDO2lCQUFNLElBQUksSUFBSSwyQkFBb0MsRUFBRTtnQkFDbkQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2dCQUNyRCxXQUFXLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7YUFDM0M7U0FDRjtJQUNILENBQUM7OztZQXZERixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O1lBaEN4QixRQUFROzRDQW9DNEIsTUFBTSxTQUFDLFFBQVE7Ozs7Ozs7O0lBRnpELDZDQUE0Qjs7Ozs7SUFFaEIsNkNBQTJCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKiBTZXQgb2YgcG9zc2libGUgaGlnaC1jb250cmFzdCBtb2RlIGJhY2tncm91bmRzLiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSGlnaENvbnRyYXN0TW9kZSB7XG4gIE5PTkUsXG4gIEJMQUNLX09OX1dISVRFLFxuICBXSElURV9PTl9CTEFDSyxcbn1cblxuLyoqIENTUyBjbGFzcyBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCBib2R5IHdoZW4gaW4gYmxhY2stb24td2hpdGUgaGlnaC1jb250cmFzdCBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IEJMQUNLX09OX1dISVRFX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC1ibGFjay1vbi13aGl0ZSc7XG5cbi8qKiBDU1MgY2xhc3MgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgYm9keSB3aGVuIGluIHdoaXRlLW9uLWJsYWNrIGhpZ2gtY29udHJhc3QgbW9kZS4gKi9cbmV4cG9ydCBjb25zdCBXSElURV9PTl9CTEFDS19DU1NfQ0xBU1MgPSAnY2RrLWhpZ2gtY29udHJhc3Qtd2hpdGUtb24tYmxhY2snO1xuXG4vKiogQ1NTIGNsYXNzIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkgd2hlbiBpbiBoaWdoLWNvbnRyYXN0IG1vZGUuICovXG5leHBvcnQgY29uc3QgSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MgPSAnY2RrLWhpZ2gtY29udHJhc3QtYWN0aXZlJztcblxuLyoqXG4gKiBTZXJ2aWNlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBicm93c2VyIGlzIGN1cnJlbnRseSBpbiBhIGhpZ2gtY29uc3RyYXN0LW1vZGUgZW52aXJvbm1lbnQuXG4gKlxuICogTWljcm9zb2Z0IFdpbmRvd3Mgc3VwcG9ydHMgYW4gYWNjZXNzaWJpbGl0eSBmZWF0dXJlIGNhbGxlZCBcIkhpZ2ggQ29udHJhc3QgTW9kZVwiLiBUaGlzIG1vZGVcbiAqIGNoYW5nZXMgdGhlIGFwcGVhcmFuY2Ugb2YgYWxsIGFwcGxpY2F0aW9ucywgaW5jbHVkaW5nIHdlYiBhcHBsaWNhdGlvbnMsIHRvIGRyYW1hdGljYWxseSBpbmNyZWFzZVxuICogY29udHJhc3QuXG4gKlxuICogSUUsIEVkZ2UsIGFuZCBGaXJlZm94IGN1cnJlbnRseSBzdXBwb3J0IHRoaXMgbW9kZS4gQ2hyb21lIGRvZXMgbm90IHN1cHBvcnQgV2luZG93cyBIaWdoIENvbnRyYXN0XG4gKiBNb2RlLiBUaGlzIHNlcnZpY2UgZG9lcyBub3QgZGV0ZWN0IGhpZ2gtY29udHJhc3QgbW9kZSBhcyBhZGRlZCBieSB0aGUgQ2hyb21lIFwiSGlnaCBDb250cmFzdFwiXG4gKiBicm93c2VyIGV4dGVuc2lvbi5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgSGlnaENvbnRyYXN0TW9kZURldGVjdG9yIHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSwgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY3VycmVudCBoaWdoLWNvbnN0cmFzdC1tb2RlIGZvciB0aGUgcGFnZS4gKi9cbiAgZ2V0SGlnaENvbnRyYXN0TW9kZSgpOiBIaWdoQ29udHJhc3RNb2RlIHtcbiAgICBpZiAoIXRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuTk9ORTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSB0ZXN0IGVsZW1lbnQgd2l0aCBhbiBhcmJpdHJhcnkgYmFja2dyb3VuZC1jb2xvciB0aGF0IGlzIG5laXRoZXIgYmxhY2sgbm9yXG4gICAgLy8gd2hpdGU7IGhpZ2gtY29udHJhc3QgbW9kZSB3aWxsIGNvZXJjZSB0aGUgY29sb3IgdG8gZWl0aGVyIGJsYWNrIG9yIHdoaXRlLiBBbHNvIGVuc3VyZSB0aGF0XG4gICAgLy8gYXBwZW5kaW5nIHRoZSB0ZXN0IGVsZW1lbnQgdG8gdGhlIERPTSBkb2VzIG5vdCBhZmZlY3QgbGF5b3V0IGJ5IGFic29sdXRlbHkgcG9zaXRpb25pbmcgaXRcbiAgICBjb25zdCB0ZXN0RWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRlc3RFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2IoMSwyLDMpJztcbiAgICB0ZXN0RWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXN0RWxlbWVudCk7XG5cbiAgICAvLyBHZXQgdGhlIGNvbXB1dGVkIHN0eWxlIGZvciB0aGUgYmFja2dyb3VuZCBjb2xvciwgY29sbGFwc2luZyBzcGFjZXMgdG8gbm9ybWFsaXplIGJldHdlZW5cbiAgICAvLyBicm93c2Vycy4gT25jZSB3ZSBnZXQgdGhpcyBjb2xvciwgd2Ugbm8gbG9uZ2VyIG5lZWQgdGhlIHRlc3QgZWxlbWVudC4gQWNjZXNzIHRoZSBgd2luZG93YFxuICAgIC8vIHZpYSB0aGUgZG9jdW1lbnQgc28gd2UgY2FuIGZha2UgaXQgaW4gdGVzdHMuXG4gICAgY29uc3QgZG9jdW1lbnRXaW5kb3cgPSB0aGlzLl9kb2N1bWVudC5kZWZhdWx0VmlldyE7XG4gICAgY29uc3QgY29tcHV0ZWRDb2xvciA9XG4gICAgICAgIChkb2N1bWVudFdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRlc3RFbGVtZW50KS5iYWNrZ3JvdW5kQ29sb3IgfHwgJycpLnJlcGxhY2UoLyAvZywgJycpO1xuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGVzdEVsZW1lbnQpO1xuXG4gICAgc3dpdGNoIChjb21wdXRlZENvbG9yKSB7XG4gICAgICBjYXNlICdyZ2IoMCwwLDApJzogcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuV0hJVEVfT05fQkxBQ0s7XG4gICAgICBjYXNlICdyZ2IoMjU1LDI1NSwyNTUpJzogcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuQkxBQ0tfT05fV0hJVEU7XG4gICAgfVxuICAgIHJldHVybiBIaWdoQ29udHJhc3RNb2RlLk5PTkU7XG4gIH1cblxuICAvKiogQXBwbGllcyBDU1MgY2xhc3NlcyBpbmRpY2F0aW5nIGhpZ2gtY29udHJhc3QgbW9kZSB0byBkb2N1bWVudCBib2R5IChicm93c2VyLW9ubHkpLiAqL1xuICBfYXBwbHlCb2R5SGlnaENvbnRyYXN0TW9kZUNzc0NsYXNzZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciAmJiB0aGlzLl9kb2N1bWVudC5ib2R5KSB7XG4gICAgICBjb25zdCBib2R5Q2xhc3NlcyA9IHRoaXMuX2RvY3VtZW50LmJvZHkuY2xhc3NMaXN0O1xuICAgICAgLy8gSUUxMSBkb2Vzbid0IHN1cHBvcnQgYGNsYXNzTGlzdGAgb3BlcmF0aW9ucyB3aXRoIG11bHRpcGxlIGFyZ3VtZW50c1xuICAgICAgYm9keUNsYXNzZXMucmVtb3ZlKEhJR0hfQ09OVFJBU1RfTU9ERV9BQ1RJVkVfQ1NTX0NMQVNTKTtcbiAgICAgIGJvZHlDbGFzc2VzLnJlbW92ZShCTEFDS19PTl9XSElURV9DU1NfQ0xBU1MpO1xuICAgICAgYm9keUNsYXNzZXMucmVtb3ZlKFdISVRFX09OX0JMQUNLX0NTU19DTEFTUyk7XG5cbiAgICAgIGNvbnN0IG1vZGUgPSB0aGlzLmdldEhpZ2hDb250cmFzdE1vZGUoKTtcbiAgICAgIGlmIChtb2RlID09PSBIaWdoQ29udHJhc3RNb2RlLkJMQUNLX09OX1dISVRFKSB7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyk7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChCTEFDS19PTl9XSElURV9DU1NfQ0xBU1MpO1xuICAgICAgfSBlbHNlIGlmIChtb2RlID09PSBIaWdoQ29udHJhc3RNb2RlLldISVRFX09OX0JMQUNLKSB7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyk7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChXSElURV9PTl9CTEFDS19DU1NfQ0xBU1MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19