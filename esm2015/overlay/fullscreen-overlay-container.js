/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/overlay/fullscreen-overlay-container.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, Inject } from '@angular/core';
import { OverlayContainer } from './overlay-container';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/platform";
/**
 * Alternative to OverlayContainer that supports correct displaying of overlay elements in
 * Fullscreen mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullScreen
 *
 * Should be provided in the root component.
 */
let FullscreenOverlayContainer = /** @class */ (() => {
    /**
     * Alternative to OverlayContainer that supports correct displaying of overlay elements in
     * Fullscreen mode
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullScreen
     *
     * Should be provided in the root component.
     */
    class FullscreenOverlayContainer extends OverlayContainer {
        /**
         * @param {?} _document
         * @param {?=} platform
         */
        constructor(_document, 
        /**
         * @deprecated `platform` parameter to become required.
         * @breaking-change 10.0.0
         */
        platform) {
            super(_document, platform);
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            super.ngOnDestroy();
            if (this._fullScreenEventName && this._fullScreenListener) {
                this._document.removeEventListener(this._fullScreenEventName, this._fullScreenListener);
            }
        }
        /**
         * @protected
         * @return {?}
         */
        _createContainer() {
            super._createContainer();
            this._adjustParentForFullscreenChange();
            this._addFullscreenChangeListener((/**
             * @return {?}
             */
            () => this._adjustParentForFullscreenChange()));
        }
        /**
         * @private
         * @return {?}
         */
        _adjustParentForFullscreenChange() {
            if (!this._containerElement) {
                return;
            }
            /** @type {?} */
            const fullscreenElement = this.getFullscreenElement();
            /** @type {?} */
            const parent = fullscreenElement || this._document.body;
            parent.appendChild(this._containerElement);
        }
        /**
         * @private
         * @param {?} fn
         * @return {?}
         */
        _addFullscreenChangeListener(fn) {
            /** @type {?} */
            const eventName = this._getEventName();
            if (eventName) {
                if (this._fullScreenListener) {
                    this._document.removeEventListener(eventName, this._fullScreenListener);
                }
                this._document.addEventListener(eventName, fn);
                this._fullScreenListener = fn;
            }
        }
        /**
         * @private
         * @return {?}
         */
        _getEventName() {
            if (!this._fullScreenEventName) {
                /** @type {?} */
                const _document = (/** @type {?} */ (this._document));
                if (_document.fullscreenEnabled) {
                    this._fullScreenEventName = 'fullscreenchange';
                }
                else if (_document.webkitFullscreenEnabled) {
                    this._fullScreenEventName = 'webkitfullscreenchange';
                }
                else if (_document.mozFullScreenEnabled) {
                    this._fullScreenEventName = 'mozfullscreenchange';
                }
                else if (_document.msFullscreenEnabled) {
                    this._fullScreenEventName = 'MSFullscreenChange';
                }
            }
            return this._fullScreenEventName;
        }
        /**
         * When the page is put into fullscreen mode, a specific element is specified.
         * Only that element and its children are visible when in fullscreen mode.
         * @return {?}
         */
        getFullscreenElement() {
            /** @type {?} */
            const _document = (/** @type {?} */ (this._document));
            return _document.fullscreenElement ||
                _document.webkitFullscreenElement ||
                _document.mozFullScreenElement ||
                _document.msFullscreenElement ||
                null;
        }
    }
    FullscreenOverlayContainer.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    FullscreenOverlayContainer.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: Platform }
    ];
    /** @nocollapse */ FullscreenOverlayContainer.ɵprov = i0.ɵɵdefineInjectable({ factory: function FullscreenOverlayContainer_Factory() { return new FullscreenOverlayContainer(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i2.Platform)); }, token: FullscreenOverlayContainer, providedIn: "root" });
    return FullscreenOverlayContainer;
})();
export { FullscreenOverlayContainer };
if (false) {
    /**
     * @type {?}
     * @private
     */
    FullscreenOverlayContainer.prototype._fullScreenEventName;
    /**
     * @type {?}
     * @private
     */
    FullscreenOverlayContainer.prototype._fullScreenListener;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVsbHNjcmVlbi1vdmVybGF5LWNvbnRhaW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9mdWxsc2NyZWVuLW92ZXJsYXktY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7Ozs7O0FBVS9DOzs7Ozs7OztJQUFBLE1BQ2EsMEJBQTJCLFNBQVEsZ0JBQWdCOzs7OztRQUk5RCxZQUNvQixTQUFjO1FBQ2hDOzs7V0FHRztRQUNILFFBQW1CO1lBQ25CLEtBQUssQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDN0IsQ0FBQzs7OztRQUVELFdBQVc7WUFDVCxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFcEIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO2dCQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQzthQUN6RjtRQUNILENBQUM7Ozs7O1FBRVMsZ0JBQWdCO1lBQ3hCLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyw0QkFBNEI7OztZQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxFQUFDLENBQUM7UUFDbkYsQ0FBQzs7Ozs7UUFFTyxnQ0FBZ0M7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDM0IsT0FBTzthQUNSOztrQkFFSyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUU7O2tCQUMvQyxNQUFNLEdBQUcsaUJBQWlCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0MsQ0FBQzs7Ozs7O1FBRU8sNEJBQTRCLENBQUMsRUFBYzs7a0JBQzNDLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFO1lBRXRDLElBQUksU0FBUyxFQUFFO2dCQUNiLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO29CQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztpQkFDekU7Z0JBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUM7YUFDL0I7UUFDSCxDQUFDOzs7OztRQUVPLGFBQWE7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRTs7c0JBQ3hCLFNBQVMsR0FBRyxtQkFBQSxJQUFJLENBQUMsU0FBUyxFQUFPO2dCQUV2QyxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRTtvQkFDL0IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGtCQUFrQixDQUFDO2lCQUNoRDtxQkFBTSxJQUFJLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRTtvQkFDNUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLHdCQUF3QixDQUFDO2lCQUN0RDtxQkFBTSxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRTtvQkFDekMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO2lCQUNuRDtxQkFBTSxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRTtvQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO2lCQUNsRDthQUNGO1lBRUQsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDbkMsQ0FBQzs7Ozs7O1FBTUQsb0JBQW9COztrQkFDWixTQUFTLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFNBQVMsRUFBTztZQUV2QyxPQUFPLFNBQVMsQ0FBQyxpQkFBaUI7Z0JBQzNCLFNBQVMsQ0FBQyx1QkFBdUI7Z0JBQ2pDLFNBQVMsQ0FBQyxvQkFBb0I7Z0JBQzlCLFNBQVMsQ0FBQyxtQkFBbUI7Z0JBQzdCLElBQUksQ0FBQztRQUNkLENBQUM7OztnQkFsRkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnREFNM0IsTUFBTSxTQUFDLFFBQVE7Z0JBaEJaLFFBQVE7OztxQ0FYaEI7S0F3R0M7U0FsRlksMEJBQTBCOzs7Ozs7SUFDckMsMERBQWlEOzs7OztJQUNqRCx5REFBd0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cblxuLyoqXG4gKiBBbHRlcm5hdGl2ZSB0byBPdmVybGF5Q29udGFpbmVyIHRoYXQgc3VwcG9ydHMgY29ycmVjdCBkaXNwbGF5aW5nIG9mIG92ZXJsYXkgZWxlbWVudHMgaW5cbiAqIEZ1bGxzY3JlZW4gbW9kZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvcmVxdWVzdEZ1bGxTY3JlZW5cbiAqXG4gKiBTaG91bGQgYmUgcHJvdmlkZWQgaW4gdGhlIHJvb3QgY29tcG9uZW50LlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGdWxsc2NyZWVuT3ZlcmxheUNvbnRhaW5lciBleHRlbmRzIE92ZXJsYXlDb250YWluZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9mdWxsU2NyZWVuRXZlbnROYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2Z1bGxTY3JlZW5MaXN0ZW5lcjogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBgcGxhdGZvcm1gIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSAxMC4wLjBcbiAgICAgKi9cbiAgICBwbGF0Zm9ybT86IFBsYXRmb3JtKSB7XG4gICAgc3VwZXIoX2RvY3VtZW50LCBwbGF0Zm9ybSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuXG4gICAgaWYgKHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgJiYgdGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUsIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcik7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIF9jcmVhdGVDb250YWluZXIoKTogdm9pZCB7XG4gICAgc3VwZXIuX2NyZWF0ZUNvbnRhaW5lcigpO1xuICAgIHRoaXMuX2FkanVzdFBhcmVudEZvckZ1bGxzY3JlZW5DaGFuZ2UoKTtcbiAgICB0aGlzLl9hZGRGdWxsc2NyZWVuQ2hhbmdlTGlzdGVuZXIoKCkgPT4gdGhpcy5fYWRqdXN0UGFyZW50Rm9yRnVsbHNjcmVlbkNoYW5nZSgpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdFBhcmVudEZvckZ1bGxzY3JlZW5DaGFuZ2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9jb250YWluZXJFbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZnVsbHNjcmVlbkVsZW1lbnQgPSB0aGlzLmdldEZ1bGxzY3JlZW5FbGVtZW50KCk7XG4gICAgY29uc3QgcGFyZW50ID0gZnVsbHNjcmVlbkVsZW1lbnQgfHwgdGhpcy5fZG9jdW1lbnQuYm9keTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyRWxlbWVudCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRGdWxsc2NyZWVuQ2hhbmdlTGlzdGVuZXIoZm46ICgpID0+IHZvaWQpIHtcbiAgICBjb25zdCBldmVudE5hbWUgPSB0aGlzLl9nZXRFdmVudE5hbWUoKTtcblxuICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgIGlmICh0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2RvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XG4gICAgICB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIgPSBmbjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRFdmVudE5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUpIHtcbiAgICAgIGNvbnN0IF9kb2N1bWVudCA9IHRoaXMuX2RvY3VtZW50IGFzIGFueTtcblxuICAgICAgaWYgKF9kb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ2Z1bGxzY3JlZW5jaGFuZ2UnO1xuICAgICAgfSBlbHNlIGlmIChfZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSA9ICd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJztcbiAgICAgIH0gZWxzZSBpZiAoX2RvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnbW96ZnVsbHNjcmVlbmNoYW5nZSc7XG4gICAgICB9IGVsc2UgaWYgKF9kb2N1bWVudC5tc0Z1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnTVNGdWxsc2NyZWVuQ2hhbmdlJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBwYWdlIGlzIHB1dCBpbnRvIGZ1bGxzY3JlZW4gbW9kZSwgYSBzcGVjaWZpYyBlbGVtZW50IGlzIHNwZWNpZmllZC5cbiAgICogT25seSB0aGF0IGVsZW1lbnQgYW5kIGl0cyBjaGlsZHJlbiBhcmUgdmlzaWJsZSB3aGVuIGluIGZ1bGxzY3JlZW4gbW9kZS5cbiAgICovXG4gIGdldEZ1bGxzY3JlZW5FbGVtZW50KCk6IEVsZW1lbnQge1xuICAgIGNvbnN0IF9kb2N1bWVudCA9IHRoaXMuX2RvY3VtZW50IGFzIGFueTtcblxuICAgIHJldHVybiBfZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgICAgX2RvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgIF9kb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICBfZG9jdW1lbnQubXNGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICBudWxsO1xuICB9XG59XG4iXX0=