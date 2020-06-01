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
let HighContrastModeDetector = /** @class */ (() => {
    class HighContrastModeDetector {
        constructor(_platform, document) {
            this._platform = _platform;
            this._document = document;
        }
        /** Gets the current high-contrast-mode for the page. */
        getHighContrastMode() {
            if (!this._platform.isBrowser) {
                return 0 /* NONE */;
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
            const computedStyle = (documentWindow && documentWindow.getComputedStyle) ?
                documentWindow.getComputedStyle(testElement) : null;
            const computedColor = (computedStyle && computedStyle.backgroundColor || '').replace(/ /g, '');
            this._document.body.removeChild(testElement);
            switch (computedColor) {
                case 'rgb(0,0,0)': return 2 /* WHITE_ON_BLACK */;
                case 'rgb(255,255,255)': return 1 /* BLACK_ON_WHITE */;
            }
            return 0 /* NONE */;
        }
        /** Applies CSS classes indicating high-contrast mode to document body (browser-only). */
        _applyBodyHighContrastModeCssClasses() {
            if (this._platform.isBrowser && this._document.body) {
                const bodyClasses = this._document.body.classList;
                // IE11 doesn't support `classList` operations with multiple arguments
                bodyClasses.remove(HIGH_CONTRAST_MODE_ACTIVE_CSS_CLASS);
                bodyClasses.remove(BLACK_ON_WHITE_CSS_CLASS);
                bodyClasses.remove(WHITE_ON_BLACK_CSS_CLASS);
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
    HighContrastModeDetector.ɵprov = i0.ɵɵdefineInjectable({ factory: function HighContrastModeDetector_Factory() { return new HighContrastModeDetector(i0.ɵɵinject(i1.Platform), i0.ɵɵinject(i2.DOCUMENT)); }, token: HighContrastModeDetector, providedIn: "root" });
    return HighContrastModeDetector;
})();
export { HighContrastModeDetector };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaC1jb250cmFzdC1tb2RlLWRldGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2hpZ2gtY29udHJhc3QtbW9kZS9oaWdoLWNvbnRyYXN0LW1vZGUtZGV0ZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7OztBQVVqRCx3RkFBd0Y7QUFDeEYsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsa0NBQWtDLENBQUM7QUFFM0Usd0ZBQXdGO0FBQ3hGLE1BQU0sQ0FBQyxNQUFNLHdCQUF3QixHQUFHLGtDQUFrQyxDQUFDO0FBRTNFLHlFQUF5RTtBQUN6RSxNQUFNLENBQUMsTUFBTSxtQ0FBbUMsR0FBRywwQkFBMEIsQ0FBQztBQUU5RTs7Ozs7Ozs7OztHQVVHO0FBQ0g7SUFBQSxNQUNhLHdCQUF3QjtRQUduQyxZQUFvQixTQUFtQixFQUFvQixRQUFhO1lBQXBELGNBQVMsR0FBVCxTQUFTLENBQVU7WUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDNUIsQ0FBQztRQUVELHdEQUF3RDtRQUN4RCxtQkFBbUI7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO2dCQUM3QixvQkFBNkI7YUFDOUI7WUFFRCxxRkFBcUY7WUFDckYsNkZBQTZGO1lBQzdGLDRGQUE0RjtZQUM1RixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4RCxXQUFXLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxZQUFZLENBQUM7WUFDakQsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU3QywwRkFBMEY7WUFDMUYsNEZBQTRGO1lBQzVGLDRGQUE0RjtZQUM1Rix5RkFBeUY7WUFDekYsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDO1lBQzVELE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3hELE1BQU0sYUFBYSxHQUNmLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFN0MsUUFBUSxhQUFhLEVBQUU7Z0JBQ3JCLEtBQUssWUFBWSxDQUFDLENBQUMsOEJBQXVDO2dCQUMxRCxLQUFLLGtCQUFrQixDQUFDLENBQUMsOEJBQXVDO2FBQ2pFO1lBQ0Qsb0JBQTZCO1FBQy9CLENBQUM7UUFFRCx5RkFBeUY7UUFDekYsb0NBQW9DO1lBQ2xDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ25ELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbEQsc0VBQXNFO2dCQUN0RSxXQUFXLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3hELFdBQVcsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDN0MsV0FBVyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUU3QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxJQUFJLDJCQUFvQyxFQUFFO29CQUM1QyxXQUFXLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7b0JBQ3JELFdBQVcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztpQkFDM0M7cUJBQU0sSUFBSSxJQUFJLDJCQUFvQyxFQUFFO29CQUNuRCxXQUFXLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7b0JBQ3JELFdBQVcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztpQkFDM0M7YUFDRjtRQUNILENBQUM7OztnQkExREYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnQkFoQ3hCLFFBQVE7Z0RBb0M0QixNQUFNLFNBQUMsUUFBUTs7O21DQTVDM0Q7S0FtR0M7U0ExRFksd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKiBTZXQgb2YgcG9zc2libGUgaGlnaC1jb250cmFzdCBtb2RlIGJhY2tncm91bmRzLiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSGlnaENvbnRyYXN0TW9kZSB7XG4gIE5PTkUsXG4gIEJMQUNLX09OX1dISVRFLFxuICBXSElURV9PTl9CTEFDSyxcbn1cblxuLyoqIENTUyBjbGFzcyBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCBib2R5IHdoZW4gaW4gYmxhY2stb24td2hpdGUgaGlnaC1jb250cmFzdCBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IEJMQUNLX09OX1dISVRFX0NTU19DTEFTUyA9ICdjZGstaGlnaC1jb250cmFzdC1ibGFjay1vbi13aGl0ZSc7XG5cbi8qKiBDU1MgY2xhc3MgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgYm9keSB3aGVuIGluIHdoaXRlLW9uLWJsYWNrIGhpZ2gtY29udHJhc3QgbW9kZS4gKi9cbmV4cG9ydCBjb25zdCBXSElURV9PTl9CTEFDS19DU1NfQ0xBU1MgPSAnY2RrLWhpZ2gtY29udHJhc3Qtd2hpdGUtb24tYmxhY2snO1xuXG4vKiogQ1NTIGNsYXNzIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50IGJvZHkgd2hlbiBpbiBoaWdoLWNvbnRyYXN0IG1vZGUuICovXG5leHBvcnQgY29uc3QgSElHSF9DT05UUkFTVF9NT0RFX0FDVElWRV9DU1NfQ0xBU1MgPSAnY2RrLWhpZ2gtY29udHJhc3QtYWN0aXZlJztcblxuLyoqXG4gKiBTZXJ2aWNlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBicm93c2VyIGlzIGN1cnJlbnRseSBpbiBhIGhpZ2gtY29udHJhc3QtbW9kZSBlbnZpcm9ubWVudC5cbiAqXG4gKiBNaWNyb3NvZnQgV2luZG93cyBzdXBwb3J0cyBhbiBhY2Nlc3NpYmlsaXR5IGZlYXR1cmUgY2FsbGVkIFwiSGlnaCBDb250cmFzdCBNb2RlXCIuIFRoaXMgbW9kZVxuICogY2hhbmdlcyB0aGUgYXBwZWFyYW5jZSBvZiBhbGwgYXBwbGljYXRpb25zLCBpbmNsdWRpbmcgd2ViIGFwcGxpY2F0aW9ucywgdG8gZHJhbWF0aWNhbGx5IGluY3JlYXNlXG4gKiBjb250cmFzdC5cbiAqXG4gKiBJRSwgRWRnZSwgYW5kIEZpcmVmb3ggY3VycmVudGx5IHN1cHBvcnQgdGhpcyBtb2RlLiBDaHJvbWUgZG9lcyBub3Qgc3VwcG9ydCBXaW5kb3dzIEhpZ2ggQ29udHJhc3RcbiAqIE1vZGUuIFRoaXMgc2VydmljZSBkb2VzIG5vdCBkZXRlY3QgaGlnaC1jb250cmFzdCBtb2RlIGFzIGFkZGVkIGJ5IHRoZSBDaHJvbWUgXCJIaWdoIENvbnRyYXN0XCJcbiAqIGJyb3dzZXIgZXh0ZW5zaW9uLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBIaWdoQ29udHJhc3RNb2RlRGV0ZWN0b3Ige1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLCBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55KSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjdXJyZW50IGhpZ2gtY29udHJhc3QtbW9kZSBmb3IgdGhlIHBhZ2UuICovXG4gIGdldEhpZ2hDb250cmFzdE1vZGUoKTogSGlnaENvbnRyYXN0TW9kZSB7XG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBIaWdoQ29udHJhc3RNb2RlLk5PTkU7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgdGVzdCBlbGVtZW50IHdpdGggYW4gYXJiaXRyYXJ5IGJhY2tncm91bmQtY29sb3IgdGhhdCBpcyBuZWl0aGVyIGJsYWNrIG5vclxuICAgIC8vIHdoaXRlOyBoaWdoLWNvbnRyYXN0IG1vZGUgd2lsbCBjb2VyY2UgdGhlIGNvbG9yIHRvIGVpdGhlciBibGFjayBvciB3aGl0ZS4gQWxzbyBlbnN1cmUgdGhhdFxuICAgIC8vIGFwcGVuZGluZyB0aGUgdGVzdCBlbGVtZW50IHRvIHRoZSBET00gZG9lcyBub3QgYWZmZWN0IGxheW91dCBieSBhYnNvbHV0ZWx5IHBvc2l0aW9uaW5nIGl0XG4gICAgY29uc3QgdGVzdEVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0ZXN0RWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiKDEsMiwzKSc7XG4gICAgdGVzdEVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGVzdEVsZW1lbnQpO1xuXG4gICAgLy8gR2V0IHRoZSBjb21wdXRlZCBzdHlsZSBmb3IgdGhlIGJhY2tncm91bmQgY29sb3IsIGNvbGxhcHNpbmcgc3BhY2VzIHRvIG5vcm1hbGl6ZSBiZXR3ZWVuXG4gICAgLy8gYnJvd3NlcnMuIE9uY2Ugd2UgZ2V0IHRoaXMgY29sb3IsIHdlIG5vIGxvbmdlciBuZWVkIHRoZSB0ZXN0IGVsZW1lbnQuIEFjY2VzcyB0aGUgYHdpbmRvd2BcbiAgICAvLyB2aWEgdGhlIGRvY3VtZW50IHNvIHdlIGNhbiBmYWtlIGl0IGluIHRlc3RzLiBOb3RlIHRoYXQgd2UgaGF2ZSBleHRyYSBudWxsIGNoZWNrcywgYmVjYXVzZVxuICAgIC8vIHRoaXMgbG9naWMgd2lsbCBsaWtlbHkgcnVuIGR1cmluZyBhcHAgYm9vdHN0cmFwIGFuZCB0aHJvd2luZyBjYW4gYnJlYWsgdGhlIGVudGlyZSBhcHAuXG4gICAgY29uc3QgZG9jdW1lbnRXaW5kb3cgPSB0aGlzLl9kb2N1bWVudC5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gICAgY29uc3QgY29tcHV0ZWRTdHlsZSA9IChkb2N1bWVudFdpbmRvdyAmJiBkb2N1bWVudFdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSA/XG4gICAgICAgIGRvY3VtZW50V2luZG93LmdldENvbXB1dGVkU3R5bGUodGVzdEVsZW1lbnQpIDogbnVsbDtcbiAgICBjb25zdCBjb21wdXRlZENvbG9yID1cbiAgICAgICAgKGNvbXB1dGVkU3R5bGUgJiYgY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kQ29sb3IgfHwgJycpLnJlcGxhY2UoLyAvZywgJycpO1xuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGVzdEVsZW1lbnQpO1xuXG4gICAgc3dpdGNoIChjb21wdXRlZENvbG9yKSB7XG4gICAgICBjYXNlICdyZ2IoMCwwLDApJzogcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuV0hJVEVfT05fQkxBQ0s7XG4gICAgICBjYXNlICdyZ2IoMjU1LDI1NSwyNTUpJzogcmV0dXJuIEhpZ2hDb250cmFzdE1vZGUuQkxBQ0tfT05fV0hJVEU7XG4gICAgfVxuICAgIHJldHVybiBIaWdoQ29udHJhc3RNb2RlLk5PTkU7XG4gIH1cblxuICAvKiogQXBwbGllcyBDU1MgY2xhc3NlcyBpbmRpY2F0aW5nIGhpZ2gtY29udHJhc3QgbW9kZSB0byBkb2N1bWVudCBib2R5IChicm93c2VyLW9ubHkpLiAqL1xuICBfYXBwbHlCb2R5SGlnaENvbnRyYXN0TW9kZUNzc0NsYXNzZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3NlciAmJiB0aGlzLl9kb2N1bWVudC5ib2R5KSB7XG4gICAgICBjb25zdCBib2R5Q2xhc3NlcyA9IHRoaXMuX2RvY3VtZW50LmJvZHkuY2xhc3NMaXN0O1xuICAgICAgLy8gSUUxMSBkb2Vzbid0IHN1cHBvcnQgYGNsYXNzTGlzdGAgb3BlcmF0aW9ucyB3aXRoIG11bHRpcGxlIGFyZ3VtZW50c1xuICAgICAgYm9keUNsYXNzZXMucmVtb3ZlKEhJR0hfQ09OVFJBU1RfTU9ERV9BQ1RJVkVfQ1NTX0NMQVNTKTtcbiAgICAgIGJvZHlDbGFzc2VzLnJlbW92ZShCTEFDS19PTl9XSElURV9DU1NfQ0xBU1MpO1xuICAgICAgYm9keUNsYXNzZXMucmVtb3ZlKFdISVRFX09OX0JMQUNLX0NTU19DTEFTUyk7XG5cbiAgICAgIGNvbnN0IG1vZGUgPSB0aGlzLmdldEhpZ2hDb250cmFzdE1vZGUoKTtcbiAgICAgIGlmIChtb2RlID09PSBIaWdoQ29udHJhc3RNb2RlLkJMQUNLX09OX1dISVRFKSB7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyk7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChCTEFDS19PTl9XSElURV9DU1NfQ0xBU1MpO1xuICAgICAgfSBlbHNlIGlmIChtb2RlID09PSBIaWdoQ29udHJhc3RNb2RlLldISVRFX09OX0JMQUNLKSB7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChISUdIX0NPTlRSQVNUX01PREVfQUNUSVZFX0NTU19DTEFTUyk7XG4gICAgICAgIGJvZHlDbGFzc2VzLmFkZChXSElURV9PTl9CTEFDS19DU1NfQ0xBU1MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19