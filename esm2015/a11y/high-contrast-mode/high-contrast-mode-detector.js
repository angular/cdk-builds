/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/high-contrast-mode/high-contrast-mode-detector.ts
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
        // via the document so we can fake it in tests. Note that we have extra null checks, because
        // this logic will likely run during app bootstrap and throwing can break the entire app.
        /** @type {?} */
        const documentWindow = this._document.defaultView || window;
        /** @type {?} */
        const computedStyle = (documentWindow && documentWindow.getComputedStyle) ?
            documentWindow.getComputedStyle(testElement) : null;
        /** @type {?} */
        const computedColor = (computedStyle && computedStyle.backgroundColor || '').replace(/ /g, '');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaC1jb250cmFzdC1tb2RlLWRldGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2hpZ2gtY29udHJhc3QtbW9kZS9oaWdoLWNvbnRyYXN0LW1vZGUtZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7QUFJakQsTUFBa0IsZ0JBQWdCO0lBQ2hDLElBQUksR0FBQTtJQUNKLGNBQWMsR0FBQTtJQUNkLGNBQWMsR0FBQTtFQUNmOzs7Ozs7QUFHRCxNQUFNLE9BQU8sd0JBQXdCLEdBQUcsa0NBQWtDOzs7OztBQUcxRSxNQUFNLE9BQU8sd0JBQXdCLEdBQUcsa0NBQWtDOzs7OztBQUcxRSxNQUFNLE9BQU8sbUNBQW1DLEdBQUcsMEJBQTBCOzs7Ozs7Ozs7Ozs7QUFjN0UsTUFBTSxPQUFPLHdCQUF3Qjs7Ozs7SUFHbkMsWUFBb0IsU0FBbUIsRUFBb0IsUUFBYTtRQUFwRCxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7Ozs7O0lBR0QsbUJBQW1CO1FBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtZQUM3QixvQkFBNkI7U0FDOUI7Ozs7O2NBS0ssV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUN2RCxXQUFXLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxZQUFZLENBQUM7UUFDakQsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQzs7Ozs7O2NBTXZDLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxNQUFNOztjQUNyRCxhQUFhLEdBQUcsQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN2RSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7O2NBQ2pELGFBQWEsR0FDZixDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQzVFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUU3QyxRQUFRLGFBQWEsRUFBRTtZQUNyQixLQUFLLFlBQVksQ0FBQyxDQUFDLDhCQUF1QztZQUMxRCxLQUFLLGtCQUFrQixDQUFDLENBQUMsOEJBQXVDO1NBQ2pFO1FBQ0Qsb0JBQTZCO0lBQy9CLENBQUM7Ozs7O0lBR0Qsb0NBQW9DO1FBQ2xDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUU7O2tCQUM3QyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUztZQUNqRCxzRUFBc0U7WUFDdEUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ3hELFdBQVcsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUM3QyxXQUFXLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7O2tCQUV2QyxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3ZDLElBQUksSUFBSSwyQkFBb0MsRUFBRTtnQkFDNUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO2dCQUNyRCxXQUFXLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7YUFDM0M7aUJBQU0sSUFBSSxJQUFJLDJCQUFvQyxFQUFFO2dCQUNuRCxXQUFXLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3JELFdBQVcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQzthQUMzQztTQUNGO0lBQ0gsQ0FBQzs7O1lBMURGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7WUFoQ3hCLFFBQVE7NENBb0M0QixNQUFNLFNBQUMsUUFBUTs7Ozs7Ozs7SUFGekQsNkNBQTRCOzs7OztJQUVoQiw2Q0FBMkIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuLyoqIFNldCBvZiBwb3NzaWJsZSBoaWdoLWNvbnRyYXN0IG1vZGUgYmFja2dyb3VuZHMuICovXG5leHBvcnQgY29uc3QgZW51bSBIaWdoQ29udHJhc3RNb2RlIHtcbiAgTk9ORSxcbiAgQkxBQ0tfT05fV0hJVEUsXG4gIFdISVRFX09OX0JMQUNLLFxufVxuXG4vKiogQ1NTIGNsYXNzIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkgd2hlbiBpbiBibGFjay1vbi13aGl0ZSBoaWdoLWNvbnRyYXN0IG1vZGUuICovXG5leHBvcnQgY29uc3QgQkxBQ0tfT05fV0hJVEVfQ1NTX0NMQVNTID0gJ2Nkay1oaWdoLWNvbnRyYXN0LWJsYWNrLW9uLXdoaXRlJztcblxuLyoqIENTUyBjbGFzcyBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCBib2R5IHdoZW4gaW4gd2hpdGUtb24tYmxhY2sgaGlnaC1jb250cmFzdCBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IFdISVRFX09OX0JMQUNLX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC13aGl0ZS1vbi1ibGFjayc7XG5cbi8qKiBDU1MgY2xhc3MgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgYm9keSB3aGVuIGluIGhpZ2gtY29udHJhc3QgbW9kZS4gKi9cbmV4cG9ydCBjb25zdCBISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC1hY3RpdmUnO1xuXG4vKipcbiAqIFNlcnZpY2UgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGJyb3dzZXIgaXMgY3VycmVudGx5IGluIGEgaGlnaC1jb25zdHJhc3QtbW9kZSBlbnZpcm9ubWVudC5cbiAqXG4gKiBNaWNyb3NvZnQgV2luZG93cyBzdXBwb3J0cyBhbiBhY2Nlc3NpYmlsaXR5IGZlYXR1cmUgY2FsbGVkIFwiSGlnaCBDb250cmFzdCBNb2RlXCIuIFRoaXMgbW9kZVxuICogY2hhbmdlcyB0aGUgYXBwZWFyYW5jZSBvZiBhbGwgYXBwbGljYXRpb25zLCBpbmNsdWRpbmcgd2ViIGFwcGxpY2F0aW9ucywgdG8gZHJhbWF0aWNhbGx5IGluY3JlYXNlXG4gKiBjb250cmFzdC5cbiAqXG4gKiBJRSwgRWRnZSwgYW5kIEZpcmVmb3ggY3VycmVudGx5IHN1cHBvcnQgdGhpcyBtb2RlLiBDaHJvbWUgZG9lcyBub3Qgc3VwcG9ydCBXaW5kb3dzIEhpZ2ggQ29udHJhc3RcbiAqIE1vZGUuIFRoaXMgc2VydmljZSBkb2VzIG5vdCBkZXRlY3QgaGlnaC1jb250cmFzdCBtb2RlIGFzIGFkZGVkIGJ5IHRoZSBDaHJvbWUgXCJIaWdoIENvbnRyYXN0XCJcbiAqIGJyb3dzZXIgZXh0ZW5zaW9uLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBIaWdoQ29udHJhc3RNb2RlRGV0ZWN0b3Ige1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLCBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55KSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjdXJyZW50IGhpZ2gtY29uc3RyYXN0LW1vZGUgZm9yIHRoZSBwYWdlLiAqL1xuICBnZXRIaWdoQ29udHJhc3RNb2RlKCk6IEhpZ2hDb250cmFzdE1vZGUge1xuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gSGlnaENvbnRyYXN0TW9kZS5OT05FO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIHRlc3QgZWxlbWVudCB3aXRoIGFuIGFyYml0cmFyeSBiYWNrZ3JvdW5kLWNvbG9yIHRoYXQgaXMgbmVpdGhlciBibGFjayBub3JcbiAgICAvLyB3aGl0ZTsgaGlnaC1jb250cmFzdCBtb2RlIHdpbGwgY29lcmNlIHRoZSBjb2xvciB0byBlaXRoZXIgYmxhY2sgb3Igd2hpdGUuIEFsc28gZW5zdXJlIHRoYXRcbiAgICAvLyBhcHBlbmRpbmcgdGhlIHRlc3QgZWxlbWVudCB0byB0aGUgRE9NIGRvZXMgbm90IGFmZmVjdCBsYXlvdXQgYnkgYWJzb2x1dGVseSBwb3NpdGlvbmluZyBpdFxuICAgIGNvbnN0IHRlc3RFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGVzdEVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYigxLDIsMyknO1xuICAgIHRlc3RFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRlc3RFbGVtZW50KTtcblxuICAgIC8vIEdldCB0aGUgY29tcHV0ZWQgc3R5bGUgZm9yIHRoZSBiYWNrZ3JvdW5kIGNvbG9yLCBjb2xsYXBzaW5nIHNwYWNlcyB0byBub3JtYWxpemUgYmV0d2VlblxuICAgIC8vIGJyb3dzZXJzLiBPbmNlIHdlIGdldCB0aGlzIGNvbG9yLCB3ZSBubyBsb25nZXIgbmVlZCB0aGUgdGVzdCBlbGVtZW50LiBBY2Nlc3MgdGhlIGB3aW5kb3dgXG4gICAgLy8gdmlhIHRoZSBkb2N1bWVudCBzbyB3ZSBjYW4gZmFrZSBpdCBpbiB0ZXN0cy4gTm90ZSB0aGF0IHdlIGhhdmUgZXh0cmEgbnVsbCBjaGVja3MsIGJlY2F1c2VcbiAgICAvLyB0aGlzIGxvZ2ljIHdpbGwgbGlrZWx5IHJ1biBkdXJpbmcgYXBwIGJvb3RzdHJhcCBhbmQgdGhyb3dpbmcgY2FuIGJyZWFrIHRoZSBlbnRpcmUgYXBwLlxuICAgIGNvbnN0IGRvY3VtZW50V2luZG93ID0gdGhpcy5fZG9jdW1lbnQuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSAoZG9jdW1lbnRXaW5kb3cgJiYgZG9jdW1lbnRXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSkgP1xuICAgICAgICBkb2N1bWVudFdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRlc3RFbGVtZW50KSA6IG51bGw7XG4gICAgY29uc3QgY29tcHV0ZWRDb2xvciA9XG4gICAgICAgIChjb21wdXRlZFN0eWxlICYmIGNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZENvbG9yIHx8ICcnKS5yZXBsYWNlKC8gL2csICcnKTtcbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRlc3RFbGVtZW50KTtcblxuICAgIHN3aXRjaCAoY29tcHV0ZWRDb2xvcikge1xuICAgICAgY2FzZSAncmdiKDAsMCwwKSc6IHJldHVybiBIaWdoQ29udHJhc3RNb2RlLldISVRFX09OX0JMQUNLO1xuICAgICAgY2FzZSAncmdiKDI1NSwyNTUsMjU1KSc6IHJldHVybiBIaWdoQ29udHJhc3RNb2RlLkJMQUNLX09OX1dISVRFO1xuICAgIH1cbiAgICByZXR1cm4gSGlnaENvbnRyYXN0TW9kZS5OT05FO1xuICB9XG5cbiAgLyoqIEFwcGxpZXMgQ1NTIGNsYXNzZXMgaW5kaWNhdGluZyBoaWdoLWNvbnRyYXN0IG1vZGUgdG8gZG9jdW1lbnQgYm9keSAoYnJvd3Nlci1vbmx5KS4gKi9cbiAgX2FwcGx5Qm9keUhpZ2hDb250cmFzdE1vZGVDc3NDbGFzc2VzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIgJiYgdGhpcy5fZG9jdW1lbnQuYm9keSkge1xuICAgICAgY29uc3QgYm9keUNsYXNzZXMgPSB0aGlzLl9kb2N1bWVudC5ib2R5LmNsYXNzTGlzdDtcbiAgICAgIC8vIElFMTEgZG9lc24ndCBzdXBwb3J0IGBjbGFzc0xpc3RgIG9wZXJhdGlvbnMgd2l0aCBtdWx0aXBsZSBhcmd1bWVudHNcbiAgICAgIGJvZHlDbGFzc2VzLnJlbW92ZShISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyk7XG4gICAgICBib2R5Q2xhc3Nlcy5yZW1vdmUoQkxBQ0tfT05fV0hJVEVfQ1NTX0NMQVNTKTtcbiAgICAgIGJvZHlDbGFzc2VzLnJlbW92ZShXSElURV9PTl9CTEFDS19DU1NfQ0xBU1MpO1xuXG4gICAgICBjb25zdCBtb2RlID0gdGhpcy5nZXRIaWdoQ29udHJhc3RNb2RlKCk7XG4gICAgICBpZiAobW9kZSA9PT0gSGlnaENvbnRyYXN0TW9kZS5CTEFDS19PTl9XSElURSkge1xuICAgICAgICBib2R5Q2xhc3Nlcy5hZGQoSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MpO1xuICAgICAgICBib2R5Q2xhc3Nlcy5hZGQoQkxBQ0tfT05fV0hJVEVfQ1NTX0NMQVNTKTtcbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gSGlnaENvbnRyYXN0TW9kZS5XSElURV9PTl9CTEFDSykge1xuICAgICAgICBib2R5Q2xhc3Nlcy5hZGQoSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MpO1xuICAgICAgICBib2R5Q2xhc3Nlcy5hZGQoV0hJVEVfT05fQkxBQ0tfQ1NTX0NMQVNTKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==