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
export class FullscreenOverlayContainer extends OverlayContainer {
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
        return _document.fullscreenElement ||
            _document.webkitFullscreenElement ||
            _document.mozFullScreenElement ||
            _document.msFullscreenElement ||
            null;
    }
}
FullscreenOverlayContainer.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: FullscreenOverlayContainer, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
FullscreenOverlayContainer.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: FullscreenOverlayContainer, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: FullscreenOverlayContainer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVsbHNjcmVlbi1vdmVybGF5LWNvbnRhaW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9mdWxsc2NyZWVuLW92ZXJsYXktY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7OztBQUcvQzs7Ozs7O0dBTUc7QUFFSCxNQUFNLE9BQU8sMEJBQTJCLFNBQVEsZ0JBQWdCO0lBSTlELFlBQThCLFNBQWMsRUFBRSxRQUFrQjtRQUM5RCxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFUSxXQUFXO1FBQ2xCLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVwQixJQUFJLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7WUFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDekY7SUFDSCxDQUFDO0lBRWtCLGdCQUFnQjtRQUNqQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRU8sZ0NBQWdDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDM0IsT0FBTztTQUNSO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUN0RCxNQUFNLE1BQU0sR0FBRyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTyw0QkFBNEIsQ0FBQyxFQUFjO1FBQ2pELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUV2QyxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO2dCQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQzthQUN6RTtZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUM7U0FDL0I7SUFDSCxDQUFDO0lBRU8sYUFBYTtRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFnQixDQUFDO1lBRXhDLElBQUksU0FBUyxDQUFDLGlCQUFpQixFQUFFO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsa0JBQWtCLENBQUM7YUFDaEQ7aUJBQU0sSUFBSSxTQUFTLENBQUMsdUJBQXVCLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyx3QkFBd0IsQ0FBQzthQUN0RDtpQkFBTSxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRTtnQkFDekMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO2FBQ25EO2lCQUFNLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7YUFDbEQ7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO0lBQ25DLENBQUM7SUFFRDs7O09BR0c7SUFDSCxvQkFBb0I7UUFDbEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQWdCLENBQUM7UUFFeEMsT0FBTyxTQUFTLENBQUMsaUJBQWlCO1lBQzNCLFNBQVMsQ0FBQyx1QkFBdUI7WUFDakMsU0FBUyxDQUFDLG9CQUFvQjtZQUM5QixTQUFTLENBQUMsbUJBQW1CO1lBQzdCLElBQUksQ0FBQztJQUNkLENBQUM7OytIQTNFVSwwQkFBMEIsa0JBSWpCLFFBQVE7bUlBSmpCLDBCQUEwQixjQURkLE1BQU07bUdBQ2xCLDBCQUEwQjtrQkFEdEMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQUtqQixNQUFNOzJCQUFDLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3QsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5cblxuLyoqXG4gKiBBbHRlcm5hdGl2ZSB0byBPdmVybGF5Q29udGFpbmVyIHRoYXQgc3VwcG9ydHMgY29ycmVjdCBkaXNwbGF5aW5nIG9mIG92ZXJsYXkgZWxlbWVudHMgaW5cbiAqIEZ1bGxzY3JlZW4gbW9kZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnQvcmVxdWVzdEZ1bGxTY3JlZW5cbiAqXG4gKiBTaG91bGQgYmUgcHJvdmlkZWQgaW4gdGhlIHJvb3QgY29tcG9uZW50LlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBGdWxsc2NyZWVuT3ZlcmxheUNvbnRhaW5lciBleHRlbmRzIE92ZXJsYXlDb250YWluZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9mdWxsU2NyZWVuRXZlbnROYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2Z1bGxTY3JlZW5MaXN0ZW5lcjogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSwgcGxhdGZvcm06IFBsYXRmb3JtKSB7XG4gICAgc3VwZXIoX2RvY3VtZW50LCBwbGF0Zm9ybSk7XG4gIH1cblxuICBvdmVycmlkZSBuZ09uRGVzdHJveSgpIHtcbiAgICBzdXBlci5uZ09uRGVzdHJveSgpO1xuXG4gICAgaWYgKHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgJiYgdGhpcy5fZnVsbFNjcmVlbkxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUsIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcik7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIG92ZXJyaWRlIF9jcmVhdGVDb250YWluZXIoKTogdm9pZCB7XG4gICAgc3VwZXIuX2NyZWF0ZUNvbnRhaW5lcigpO1xuICAgIHRoaXMuX2FkanVzdFBhcmVudEZvckZ1bGxzY3JlZW5DaGFuZ2UoKTtcbiAgICB0aGlzLl9hZGRGdWxsc2NyZWVuQ2hhbmdlTGlzdGVuZXIoKCkgPT4gdGhpcy5fYWRqdXN0UGFyZW50Rm9yRnVsbHNjcmVlbkNoYW5nZSgpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdFBhcmVudEZvckZ1bGxzY3JlZW5DaGFuZ2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9jb250YWluZXJFbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZnVsbHNjcmVlbkVsZW1lbnQgPSB0aGlzLmdldEZ1bGxzY3JlZW5FbGVtZW50KCk7XG4gICAgY29uc3QgcGFyZW50ID0gZnVsbHNjcmVlbkVsZW1lbnQgfHwgdGhpcy5fZG9jdW1lbnQuYm9keTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyRWxlbWVudCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRGdWxsc2NyZWVuQ2hhbmdlTGlzdGVuZXIoZm46ICgpID0+IHZvaWQpIHtcbiAgICBjb25zdCBldmVudE5hbWUgPSB0aGlzLl9nZXRFdmVudE5hbWUoKTtcblxuICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgIGlmICh0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHRoaXMuX2Z1bGxTY3JlZW5MaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2RvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XG4gICAgICB0aGlzLl9mdWxsU2NyZWVuTGlzdGVuZXIgPSBmbjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRFdmVudE5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUpIHtcbiAgICAgIGNvbnN0IF9kb2N1bWVudCA9IHRoaXMuX2RvY3VtZW50IGFzIGFueTtcblxuICAgICAgaWYgKF9kb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgICB0aGlzLl9mdWxsU2NyZWVuRXZlbnROYW1lID0gJ2Z1bGxzY3JlZW5jaGFuZ2UnO1xuICAgICAgfSBlbHNlIGlmIChfZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZSA9ICd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJztcbiAgICAgIH0gZWxzZSBpZiAoX2RvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnbW96ZnVsbHNjcmVlbmNoYW5nZSc7XG4gICAgICB9IGVsc2UgaWYgKF9kb2N1bWVudC5tc0Z1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxTY3JlZW5FdmVudE5hbWUgPSAnTVNGdWxsc2NyZWVuQ2hhbmdlJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZnVsbFNjcmVlbkV2ZW50TmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBwYWdlIGlzIHB1dCBpbnRvIGZ1bGxzY3JlZW4gbW9kZSwgYSBzcGVjaWZpYyBlbGVtZW50IGlzIHNwZWNpZmllZC5cbiAgICogT25seSB0aGF0IGVsZW1lbnQgYW5kIGl0cyBjaGlsZHJlbiBhcmUgdmlzaWJsZSB3aGVuIGluIGZ1bGxzY3JlZW4gbW9kZS5cbiAgICovXG4gIGdldEZ1bGxzY3JlZW5FbGVtZW50KCk6IEVsZW1lbnQge1xuICAgIGNvbnN0IF9kb2N1bWVudCA9IHRoaXMuX2RvY3VtZW50IGFzIGFueTtcblxuICAgIHJldHVybiBfZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgICAgICAgX2RvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICAgICAgIF9kb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICBfZG9jdW1lbnQubXNGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgICAgICBudWxsO1xuICB9XG59XG4iXX0=