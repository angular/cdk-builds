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
import * as i1 from "@angular/cdk/platform";
/**
 * Alternative to OverlayContainer that supports correct displaying of overlay elements in
 * Fullscreen mode
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullScreen
 *
 * Should be provided in the root component.
 */
class FullscreenOverlayContainer extends OverlayContainer {
    constructor(_document, platform) {
        super(_document, platform);
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        if (this._fullScreenEventName && this._fullScreenListener) {
            this._document.removeEventListener(this._fullScreenEventName, this._fullScreenListener);
        }
    }
    _createContainer() {
        super._createContainer();
        this._adjustParentForFullscreenChange();
        this._addFullscreenChangeListener(() => this._adjustParentForFullscreenChange());
    }
    _adjustParentForFullscreenChange() {
        if (!this._containerElement) {
            return;
        }
        const fullscreenElement = this.getFullscreenElement();
        const parent = fullscreenElement || this._document.body;
        parent.appendChild(this._containerElement);
    }
    _addFullscreenChangeListener(fn) {
        const eventName = this._getEventName();
        if (eventName) {
            if (this._fullScreenListener) {
                this._document.removeEventListener(eventName, this._fullScreenListener);
            }
            this._document.addEventListener(eventName, fn);
            this._fullScreenListener = fn;
        }
    }
    _getEventName() {
        if (!this._fullScreenEventName) {
            const _document = this._document;
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
     */
    getFullscreenElement() {
        const _document = this._document;
        return (_document.fullscreenElement ||
            _document.webkitFullscreenElement ||
            _document.mozFullScreenElement ||
            _document.msFullscreenElement ||
            null);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: FullscreenOverlayContainer, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: FullscreenOverlayContainer, providedIn: 'root' }); }
}
export { FullscreenOverlayContainer };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: FullscreenOverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVsbHNjcmVlbi1vdmVybGF5LWNvbnRhaW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9mdWxsc2NyZWVuLW92ZXJsYXktY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUUvQzs7Ozs7O0dBTUc7QUFDSCxNQUNhLDBCQUEyQixTQUFRLGdCQUFnQjtJQUk5RCxZQUE4QixTQUFjLEVBQUUsUUFBa0I7UUFDOUQsS0FBSyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRVEsV0FBVztRQUNsQixLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFcEIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3pELElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQ3pGO0lBQ0gsQ0FBQztJQUVrQixnQkFBZ0I7UUFDakMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7UUFDeEMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVPLGdDQUFnQztRQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLE9BQU87U0FDUjtRQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDdEQsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRU8sNEJBQTRCLENBQUMsRUFBYztRQUNqRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFdkMsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7YUFDekU7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQUVPLGFBQWE7UUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtZQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBZ0IsQ0FBQztZQUV4QyxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGtCQUFrQixDQUFDO2FBQ2hEO2lCQUFNLElBQUksU0FBUyxDQUFDLHVCQUF1QixFQUFFO2dCQUM1QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsd0JBQXdCLENBQUM7YUFDdEQ7aUJBQU0sSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQzthQUNuRDtpQkFBTSxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRTtnQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDO2FBQ2xEO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsb0JBQW9CO1FBQ2xCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFnQixDQUFDO1FBRXhDLE9BQU8sQ0FDTCxTQUFTLENBQUMsaUJBQWlCO1lBQzNCLFNBQVMsQ0FBQyx1QkFBdUI7WUFDakMsU0FBUyxDQUFDLG9CQUFvQjtZQUM5QixTQUFTLENBQUMsbUJBQW1CO1lBQzdCLElBQUksQ0FDTCxDQUFDO0lBQ0osQ0FBQzs4R0E3RVUsMEJBQTBCLGtCQUlqQixRQUFRO2tIQUpqQiwwQkFBMEIsY0FEZCxNQUFNOztTQUNsQiwwQkFBMEI7MkZBQTFCLDBCQUEwQjtrQkFEdEMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQUtqQixNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cbi8qKlxuICogQWx0ZXJuYXRpdmUgdG8gT3ZlcmxheUNvbnRhaW5lciB0aGF0IHN1cHBvcnRzIGNvcnJlY3QgZGlzcGxheWluZyBvZiBvdmVybGF5IGVsZW1lbnRzIGluXG4gKiBGdWxsc2NyZWVuIG1vZGVcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L3JlcXVlc3RGdWxsU2NyZWVuXG4gKlxuICogU2hvdWxkIGJlIHByb3ZpZGVkIGluIHRoZSByb290IGNvbXBvbmVudC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgRnVsbHNjcmVlbk92ZXJsYXlDb250YWluZXIgZXh0ZW5kcyBPdmVybGF5Q29udGFpbmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZnVsbFNjcmVlbkV2ZW50TmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9mdWxsU2NyZWVuTGlzdGVuZXI6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksIHBsYXRmb3JtOiBQbGF0Zm9ybSkge1xuICAgIHN1cGVyKF9kb2N1bWVudCwgcGxhdGZvcm0pO1xuICB9XG5cbiAgb3ZlcnJpZGUgbmdPbkRlc3Ryb3koKSB7XG4gICAgc3VwZXIubmdPbkRlc3Ryb3koKTtcblxuICAgIGlmICh0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lICYmIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcikge1xuICAgICAgdGhpcy5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lLCB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBvdmVycmlkZSBfY3JlYXRlQ29udGFpbmVyKCk6IHZvaWQge1xuICAgIHN1cGVyLl9jcmVhdGVDb250YWluZXIoKTtcbiAgICB0aGlzLl9hZGp1c3RQYXJlbnRGb3JGdWxsc2NyZWVuQ2hhbmdlKCk7XG4gICAgdGhpcy5fYWRkRnVsbHNjcmVlbkNoYW5nZUxpc3RlbmVyKCgpID0+IHRoaXMuX2FkanVzdFBhcmVudEZvckZ1bGxzY3JlZW5DaGFuZ2UoKSk7XG4gIH1cblxuICBwcml2YXRlIF9hZGp1c3RQYXJlbnRGb3JGdWxsc2NyZWVuQ2hhbmdlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZ1bGxzY3JlZW5FbGVtZW50ID0gdGhpcy5nZXRGdWxsc2NyZWVuRWxlbWVudCgpO1xuICAgIGNvbnN0IHBhcmVudCA9IGZ1bGxzY3JlZW5FbGVtZW50IHx8IHRoaXMuX2RvY3VtZW50LmJvZHk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMuX2NvbnRhaW5lckVsZW1lbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRkRnVsbHNjcmVlbkNoYW5nZUxpc3RlbmVyKGZuOiAoKSA9PiB2b2lkKSB7XG4gICAgY29uc3QgZXZlbnROYW1lID0gdGhpcy5fZ2V0RXZlbnROYW1lKCk7XG5cbiAgICBpZiAoZXZlbnROYW1lKSB7XG4gICAgICBpZiAodGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZm4pO1xuICAgICAgdGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyID0gZm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RXZlbnROYW1lKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lKSB7XG4gICAgICBjb25zdCBfZG9jdW1lbnQgPSB0aGlzLl9kb2N1bWVudCBhcyBhbnk7XG5cbiAgICAgIGlmIChfZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSA9ICdmdWxsc2NyZWVuY2hhbmdlJztcbiAgICAgIH0gZWxzZSBpZiAoX2RvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnd2Via2l0ZnVsbHNjcmVlbmNoYW5nZSc7XG4gICAgICB9IGVsc2UgaWYgKF9kb2N1bWVudC5tb3pGdWxsU2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ21vemZ1bGxzY3JlZW5jaGFuZ2UnO1xuICAgICAgfSBlbHNlIGlmIChfZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ01TRnVsbHNjcmVlbkNoYW5nZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWU7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgcGFnZSBpcyBwdXQgaW50byBmdWxsc2NyZWVuIG1vZGUsIGEgc3BlY2lmaWMgZWxlbWVudCBpcyBzcGVjaWZpZWQuXG4gICAqIE9ubHkgdGhhdCBlbGVtZW50IGFuZCBpdHMgY2hpbGRyZW4gYXJlIHZpc2libGUgd2hlbiBpbiBmdWxsc2NyZWVuIG1vZGUuXG4gICAqL1xuICBnZXRGdWxsc2NyZWVuRWxlbWVudCgpOiBFbGVtZW50IHtcbiAgICBjb25zdCBfZG9jdW1lbnQgPSB0aGlzLl9kb2N1bWVudCBhcyBhbnk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgX2RvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICBfZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIF9kb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuICAgICAgX2RvY3VtZW50Lm1zRnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIG51bGxcbiAgICApO1xuICB9XG59XG4iXX0=