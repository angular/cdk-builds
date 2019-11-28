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
/** @nocollapse */ FullscreenOverlayContainer.ɵprov = i0.ɵɵdefineInjectable({ factory: function FullscreenOverlayContainer_Factory() { return new FullscreenOverlayContainer(i0.ɵɵinject(i1.DOCUMENT)); }, token: FullscreenOverlayContainer, providedIn: "root" });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVsbHNjcmVlbi1vdmVybGF5LWNvbnRhaW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9mdWxsc2NyZWVuLW92ZXJsYXktY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7Ozs7OztBQVd6QyxNQUFNLE9BQU8sMEJBQTJCLFNBQVEsZ0JBQWdCOzs7O0lBSTlELFlBQThCLFNBQWM7UUFDMUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25CLENBQUM7Ozs7SUFFRCxXQUFXO1FBQ1QsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXBCLElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUN6RjtJQUNILENBQUM7Ozs7O0lBRVMsZ0JBQWdCO1FBQ3hCLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1FBQ3hDLElBQUksQ0FBQyw0QkFBNEI7OztRQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxFQUFDLENBQUM7SUFDbkYsQ0FBQzs7Ozs7SUFFTyxnQ0FBZ0M7UUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMzQixPQUFPO1NBQ1I7O2NBRUssaUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFOztjQUMvQyxNQUFNLEdBQUcsaUJBQWlCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJO1FBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDN0MsQ0FBQzs7Ozs7O0lBRU8sNEJBQTRCLENBQUMsRUFBYzs7Y0FDM0MsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUU7UUFFdEMsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7YUFDekU7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1NBQy9CO0lBQ0gsQ0FBQzs7Ozs7SUFFTyxhQUFhO1FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUU7O2tCQUN4QixTQUFTLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFNBQVMsRUFBTztZQUV2QyxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGtCQUFrQixDQUFDO2FBQ2hEO2lCQUFNLElBQUksU0FBUyxDQUFDLHVCQUF1QixFQUFFO2dCQUM1QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsd0JBQXdCLENBQUM7YUFDdEQ7aUJBQU0sSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQzthQUNuRDtpQkFBTSxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO2FBQ2xEO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztJQUNuQyxDQUFDOzs7Ozs7SUFNRCxvQkFBb0I7O2NBQ1osU0FBUyxHQUFHLG1CQUFBLElBQUksQ0FBQyxTQUFTLEVBQU87UUFFdkMsT0FBTyxTQUFTLENBQUMsaUJBQWlCO1lBQzNCLFNBQVMsQ0FBQyx1QkFBdUI7WUFDakMsU0FBUyxDQUFDLG9CQUFvQjtZQUM5QixTQUFTLENBQUMsbUJBQW1CO1lBQzdCLElBQUksQ0FBQztJQUNkLENBQUM7OztZQTVFRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7OzRDQUtqQixNQUFNLFNBQUMsUUFBUTs7Ozs7Ozs7SUFINUIsMERBQWlEOzs7OztJQUNqRCx5REFBd0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuXG4vKipcbiAqIEFsdGVybmF0aXZlIHRvIE92ZXJsYXlDb250YWluZXIgdGhhdCBzdXBwb3J0cyBjb3JyZWN0IGRpc3BsYXlpbmcgb2Ygb3ZlcmxheSBlbGVtZW50cyBpblxuICogRnVsbHNjcmVlbiBtb2RlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9yZXF1ZXN0RnVsbFNjcmVlblxuICpcbiAqIFNob3VsZCBiZSBwcm92aWRlZCBpbiB0aGUgcm9vdCBjb21wb25lbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEZ1bGxzY3JlZW5PdmVybGF5Q29udGFpbmVyIGV4dGVuZHMgT3ZlcmxheUNvbnRhaW5lciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2Z1bGxTY3JlZW5FdmVudE5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfZnVsbFNjcmVlbkxpc3RlbmVyOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55KSB7XG4gICAgc3VwZXIoX2RvY3VtZW50KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHN1cGVyLm5nT25EZXN0cm95KCk7XG5cbiAgICBpZiAodGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSAmJiB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSwgdGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgX2NyZWF0ZUNvbnRhaW5lcigpOiB2b2lkIHtcbiAgICBzdXBlci5fY3JlYXRlQ29udGFpbmVyKCk7XG4gICAgdGhpcy5fYWRqdXN0UGFyZW50Rm9yRnVsbHNjcmVlbkNoYW5nZSgpO1xuICAgIHRoaXMuX2FkZEZ1bGxzY3JlZW5DaGFuZ2VMaXN0ZW5lcigoKSA9PiB0aGlzLl9hZGp1c3RQYXJlbnRGb3JGdWxsc2NyZWVuQ2hhbmdlKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0UGFyZW50Rm9yRnVsbHNjcmVlbkNoYW5nZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2NvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmdWxsc2NyZWVuRWxlbWVudCA9IHRoaXMuZ2V0RnVsbHNjcmVlbkVsZW1lbnQoKTtcbiAgICBjb25zdCBwYXJlbnQgPSBmdWxsc2NyZWVuRWxlbWVudCB8fCB0aGlzLl9kb2N1bWVudC5ib2R5O1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLl9jb250YWluZXJFbGVtZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkZEZ1bGxzY3JlZW5DaGFuZ2VMaXN0ZW5lcihmbjogKCkgPT4gdm9pZCkge1xuICAgIGNvbnN0IGV2ZW50TmFtZSA9IHRoaXMuX2dldEV2ZW50TmFtZSgpO1xuXG4gICAgaWYgKGV2ZW50TmFtZSkge1xuICAgICAgaWYgKHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgdGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZuKTtcbiAgICAgIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lciA9IGZuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldEV2ZW50TmFtZSgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSkge1xuICAgICAgY29uc3QgX2RvY3VtZW50ID0gdGhpcy5fZG9jdW1lbnQgYXMgYW55O1xuXG4gICAgICBpZiAoX2RvY3VtZW50LmZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnZnVsbHNjcmVlbmNoYW5nZSc7XG4gICAgICB9IGVsc2UgaWYgKF9kb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnO1xuICAgICAgfSBlbHNlIGlmIChfZG9jdW1lbnQubW96RnVsbFNjcmVlbkVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSA9ICdtb3pmdWxsc2NyZWVuY2hhbmdlJztcbiAgICAgIH0gZWxzZSBpZiAoX2RvY3VtZW50Lm1zRnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSA9ICdNU0Z1bGxzY3JlZW5DaGFuZ2UnO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIHBhZ2UgaXMgcHV0IGludG8gZnVsbHNjcmVlbiBtb2RlLCBhIHNwZWNpZmljIGVsZW1lbnQgaXMgc3BlY2lmaWVkLlxuICAgKiBPbmx5IHRoYXQgZWxlbWVudCBhbmQgaXRzIGNoaWxkcmVuIGFyZSB2aXNpYmxlIHdoZW4gaW4gZnVsbHNjcmVlbiBtb2RlLlxuICAgKi9cbiAgZ2V0RnVsbHNjcmVlbkVsZW1lbnQoKTogRWxlbWVudCB7XG4gICAgY29uc3QgX2RvY3VtZW50ID0gdGhpcy5fZG9jdW1lbnQgYXMgYW55O1xuXG4gICAgcmV0dXJuIF9kb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICBfZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgICAgX2RvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgIF9kb2N1bWVudC5tc0Z1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgIG51bGw7XG4gIH1cbn1cbiJdfQ==