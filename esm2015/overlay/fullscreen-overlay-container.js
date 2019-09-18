/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * Alternative to OverlayContainer that supports correct displaying of overlay elements in
 * Fullscreen mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullScreen
 *
 * Should be provided in the root component.
 */
export class FullscreenOverlayContainer extends OverlayContainer {
    /**
     * @param {?} _document
     */
    constructor(_document) {
        super(_document);
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
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
/** @nocollapse */ FullscreenOverlayContainer.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function FullscreenOverlayContainer_Factory() { return new FullscreenOverlayContainer(i0.ɵɵinject(i1.DOCUMENT)); }, token: FullscreenOverlayContainer, providedIn: "root" });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVsbHNjcmVlbi1vdmVybGF5LWNvbnRhaW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9mdWxsc2NyZWVuLW92ZXJsYXktY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDNUQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7Ozs7Ozs7O0FBV3pDLE1BQU0sT0FBTywwQkFBMkIsU0FBUSxnQkFBZ0I7Ozs7SUFJOUQsWUFBOEIsU0FBYztRQUMxQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbkIsQ0FBQzs7OztJQUVELFdBQVc7UUFDVCxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFcEIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3pELElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQ3pGO0lBQ0gsQ0FBQzs7Ozs7SUFFUyxnQkFBZ0I7UUFDeEIsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLDRCQUE0Qjs7O1FBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEVBQUMsQ0FBQztJQUNuRixDQUFDOzs7OztJQUVPLGdDQUFnQztRQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLE9BQU87U0FDUjs7Y0FFSyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUU7O2NBQy9DLE1BQU0sR0FBRyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7UUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM3QyxDQUFDOzs7Ozs7SUFFTyw0QkFBNEIsQ0FBQyxFQUFjOztjQUMzQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUV0QyxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQzthQUN6RTtZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUM7U0FDL0I7SUFDSCxDQUFDOzs7OztJQUVPLGFBQWE7UUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRTs7a0JBQ3hCLFNBQVMsR0FBRyxtQkFBQSxJQUFJLENBQUMsU0FBUyxFQUFPO1lBRXZDLElBQUksU0FBUyxDQUFDLGlCQUFpQixFQUFFO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsa0JBQWtCLENBQUM7YUFDaEQ7aUJBQU0sSUFBSSxTQUFTLENBQUMsdUJBQXVCLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyx3QkFBd0IsQ0FBQzthQUN0RDtpQkFBTSxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRTtnQkFDekMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO2FBQ25EO2lCQUFNLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7YUFDbEQ7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO0lBQ25DLENBQUM7Ozs7OztJQU1ELG9CQUFvQjs7Y0FDWixTQUFTLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFNBQVMsRUFBTztRQUV2QyxPQUFPLFNBQVMsQ0FBQyxpQkFBaUI7WUFDM0IsU0FBUyxDQUFDLHVCQUF1QjtZQUNqQyxTQUFTLENBQUMsb0JBQW9CO1lBQzlCLFNBQVMsQ0FBQyxtQkFBbUI7WUFDN0IsSUFBSSxDQUFDO0lBQ2QsQ0FBQzs7O1lBNUVGLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs7NENBS2pCLE1BQU0sU0FBQyxRQUFROzs7Ozs7OztJQUg1QiwwREFBaUQ7Ozs7O0lBQ2pELHlEQUF3QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGUsIEluamVjdCwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T3ZlcmxheUNvbnRhaW5lcn0gZnJvbSAnLi9vdmVybGF5LWNvbnRhaW5lcic7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5cbi8qKlxuICogQWx0ZXJuYXRpdmUgdG8gT3ZlcmxheUNvbnRhaW5lciB0aGF0IHN1cHBvcnRzIGNvcnJlY3QgZGlzcGxheWluZyBvZiBvdmVybGF5IGVsZW1lbnRzIGluXG4gKiBGdWxsc2NyZWVuIG1vZGVcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L3JlcXVlc3RGdWxsU2NyZWVuXG4gKlxuICogU2hvdWxkIGJlIHByb3ZpZGVkIGluIHRoZSByb290IGNvbXBvbmVudC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXIgZXh0ZW5kcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZnVsbFNjcmVlbkV2ZW50TmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9mdWxsU2NyZWVuTGlzdGVuZXI6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnkpIHtcbiAgICBzdXBlcihfZG9jdW1lbnQpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgc3VwZXIubmdPbkRlc3Ryb3koKTtcblxuICAgIGlmICh0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lICYmIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcikge1xuICAgICAgdGhpcy5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lLCB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBfY3JlYXRlQ29udGFpbmVyKCk6IHZvaWQge1xuICAgIHN1cGVyLl9jcmVhdGVDb250YWluZXIoKTtcbiAgICB0aGlzLl9hZGp1c3RQYXJlbnRGb3JGdWxsc2NyZWVuQ2hhbmdlKCk7XG4gICAgdGhpcy5fYWRkRnVsbHNjcmVlbkNoYW5nZUxpc3RlbmVyKCgpID0+IHRoaXMuX2FkanVzdFBhcmVudEZvckZ1bGxzY3JlZW5DaGFuZ2UoKSk7XG4gIH1cblxuICBwcml2YXRlIF9hZGp1c3RQYXJlbnRGb3JGdWxsc2NyZWVuQ2hhbmdlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZ1bGxzY3JlZW5FbGVtZW50ID0gdGhpcy5nZXRGdWxsc2NyZWVuRWxlbWVudCgpO1xuICAgIGNvbnN0IHBhcmVudCA9IGZ1bGxzY3JlZW5FbGVtZW50IHx8IHRoaXMuX2RvY3VtZW50LmJvZHk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lckVsZW1lbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRkRnVsbHNjcmVlbkNoYW5nZUxpc3RlbmVyKGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgY29uc3QgZXZlbnROYW1lID0gdGhpcy5fZ2V0RXZlbnROYW1lKCk7XG5cbiAgICBpZiAoZXZlbnROYW1lKSB7XG4gICAgICBpZiAodGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZm4pO1xuICAgICAgdGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyID0gZm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RXZlbnROYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lKSB7XG4gICAgICBjb25zdCBfZG9jdW1lbnQgPSB0aGlzLl9kb2N1bWVudCBhcyBhbnk7XG5cbiAgICAgIGlmIChfZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSA9ICdmdWxsc2NyZWVuY2hhbmdlJztcbiAgICAgIH0gZWxzZSBpZiAoX2RvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnd2Via2l0ZnVsbHNjcmVlbmNoYW5nZSc7XG4gICAgICB9IGVsc2UgaWYgKF9kb2N1bWVudC5tb3pGdWxsU2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ21vemZ1bGxzY3JlZW5jaGFuZ2UnO1xuICAgICAgfSBlbHNlIGlmIChfZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ01TRnVsbHNjcmVlbkNoYW5nZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWU7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgcGFnZSBpcyBwdXQgaW50byBmdWxsc2NyZWVuIG1vZGUsIGEgc3BlY2lmaWMgZWxlbWVudCBpcyBzcGVjaWZpZWQuXG4gICAqIE9ubHkgdGhhdCBlbGVtZW50IGFuZCBpdHMgY2hpbGRyZW4gYXJlIHZpc2libGUgd2hlbiBpbiBmdWxsc2NyZWVuIG1vZGUuXG4gICAqL1xuICBnZXRGdWxsc2NyZWVuRWxlbWVudCgpOiBFbGVtZW50IHtcbiAgICBjb25zdCBfZG9jdW1lbnQgPSB0aGlzLl9kb2N1bWVudCBhcyBhbnk7XG5cbiAgICByZXR1cm4gX2RvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgIF9kb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICBfZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgICAgX2RvY3VtZW50Lm1zRnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgICAgbnVsbDtcbiAgfVxufVxuIl19