/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional, NgZone, } from '@angular/core';
import { InteractivityChecker } from '../interactivity-checker/interactivity-checker';
import { ConfigurableFocusTrap } from './configurable-focus-trap';
import { FOCUS_TRAP_INERT_STRATEGY } from './focus-trap-inert-strategy';
import { EventListenerFocusTrapInertStrategy } from './event-listener-inert-strategy';
import { FocusTrapManager } from './focus-trap-manager';
import * as i0 from "@angular/core";
import * as i1 from "../interactivity-checker/interactivity-checker";
import * as i2 from "./focus-trap-manager";
/** Factory that allows easy instantiation of configurable focus traps. */
export class ConfigurableFocusTrapFactory {
    constructor(_checker, _ngZone, _focusTrapManager, _document, _inertStrategy) {
        this._checker = _checker;
        this._ngZone = _ngZone;
        this._focusTrapManager = _focusTrapManager;
        this._document = _document;
        // TODO split up the strategies into different modules, similar to DateAdapter.
        this._inertStrategy = _inertStrategy || new EventListenerFocusTrapInertStrategy();
    }
    create(element, config = { defer: false }) {
        let configObject;
        if (typeof config === 'boolean') {
            configObject = { defer: config };
        }
        else {
            configObject = config;
        }
        return new ConfigurableFocusTrap(element, this._checker, this._ngZone, this._document, this._focusTrapManager, this._inertStrategy, configObject);
    }
}
ConfigurableFocusTrapFactory.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ConfigurableFocusTrapFactory, deps: [{ token: i1.InteractivityChecker }, { token: i0.NgZone }, { token: i2.FocusTrapManager }, { token: DOCUMENT }, { token: FOCUS_TRAP_INERT_STRATEGY, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
ConfigurableFocusTrapFactory.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ConfigurableFocusTrapFactory, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: ConfigurableFocusTrapFactory, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.InteractivityChecker }, { type: i0.NgZone }, { type: i2.FocusTrapManager }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [FOCUS_TRAP_INERT_STRATEGY]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhYmxlLWZvY3VzLXRyYXAtZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy10cmFwL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwLWZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDTCxNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sZ0RBQWdELENBQUM7QUFDcEYsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFaEUsT0FBTyxFQUFDLHlCQUF5QixFQUF5QixNQUFNLDZCQUE2QixDQUFDO0FBQzlGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7O0FBRXRELDBFQUEwRTtBQUUxRSxNQUFNLE9BQU8sNEJBQTRCO0lBSXZDLFlBQ1ksUUFBOEIsRUFDOUIsT0FBZSxFQUNmLGlCQUFtQyxFQUN6QixTQUFjLEVBQ2UsY0FBdUM7UUFKOUUsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7UUFDOUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7UUFJN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsK0VBQStFO1FBQy9FLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxJQUFJLElBQUksbUNBQW1DLEVBQUUsQ0FBQztJQUNwRixDQUFDO0lBZ0JELE1BQU0sQ0FBQyxPQUFvQixFQUFFLFNBQThDLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQztRQUV2RixJQUFJLFlBQXlDLENBQUM7UUFDOUMsSUFBSSxPQUFPLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDL0IsWUFBWSxHQUFHLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDO1NBQ2hDO2FBQU07WUFDTCxZQUFZLEdBQUcsTUFBTSxDQUFDO1NBQ3ZCO1FBQ0QsT0FBTyxJQUFJLHFCQUFxQixDQUM1QixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUM1RSxJQUFJLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7O2lJQXpDVSw0QkFBNEIsNEdBUTNCLFFBQVEsYUFDSSx5QkFBeUI7cUlBVHRDLDRCQUE0QixjQURoQixNQUFNO21HQUNsQiw0QkFBNEI7a0JBRHhDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFTekIsTUFBTTsyQkFBQyxRQUFROzswQkFDZixRQUFROzswQkFBSSxNQUFNOzJCQUFDLHlCQUF5QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBPcHRpb25hbCxcbiAgTmdab25lLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7SW50ZXJhY3Rpdml0eUNoZWNrZXJ9IGZyb20gJy4uL2ludGVyYWN0aXZpdHktY2hlY2tlci9pbnRlcmFjdGl2aXR5LWNoZWNrZXInO1xuaW1wb3J0IHtDb25maWd1cmFibGVGb2N1c1RyYXB9IGZyb20gJy4vY29uZmlndXJhYmxlLWZvY3VzLXRyYXAnO1xuaW1wb3J0IHtDb25maWd1cmFibGVGb2N1c1RyYXBDb25maWd9IGZyb20gJy4vY29uZmlndXJhYmxlLWZvY3VzLXRyYXAtY29uZmlnJztcbmltcG9ydCB7Rk9DVVNfVFJBUF9JTkVSVF9TVFJBVEVHWSwgRm9jdXNUcmFwSW5lcnRTdHJhdGVneX0gZnJvbSAnLi9mb2N1cy10cmFwLWluZXJ0LXN0cmF0ZWd5JztcbmltcG9ydCB7RXZlbnRMaXN0ZW5lckZvY3VzVHJhcEluZXJ0U3RyYXRlZ3l9IGZyb20gJy4vZXZlbnQtbGlzdGVuZXItaW5lcnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtGb2N1c1RyYXBNYW5hZ2VyfSBmcm9tICcuL2ZvY3VzLXRyYXAtbWFuYWdlcic7XG5cbi8qKiBGYWN0b3J5IHRoYXQgYWxsb3dzIGVhc3kgaW5zdGFudGlhdGlvbiBvZiBjb25maWd1cmFibGUgZm9jdXMgdHJhcHMuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDb25maWd1cmFibGVGb2N1c1RyYXBGYWN0b3J5IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuICBwcml2YXRlIF9pbmVydFN0cmF0ZWd5OiBGb2N1c1RyYXBJbmVydFN0cmF0ZWd5O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfY2hlY2tlcjogSW50ZXJhY3Rpdml0eUNoZWNrZXIsXG4gICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgIHByaXZhdGUgX2ZvY3VzVHJhcE1hbmFnZXI6IEZvY3VzVHJhcE1hbmFnZXIsXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoRk9DVVNfVFJBUF9JTkVSVF9TVFJBVEVHWSkgX2luZXJ0U3RyYXRlZ3k/OiBGb2N1c1RyYXBJbmVydFN0cmF0ZWd5KSB7XG5cbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICAvLyBUT0RPIHNwbGl0IHVwIHRoZSBzdHJhdGVnaWVzIGludG8gZGlmZmVyZW50IG1vZHVsZXMsIHNpbWlsYXIgdG8gRGF0ZUFkYXB0ZXIuXG4gICAgdGhpcy5faW5lcnRTdHJhdGVneSA9IF9pbmVydFN0cmF0ZWd5IHx8IG5ldyBFdmVudExpc3RlbmVyRm9jdXNUcmFwSW5lcnRTdHJhdGVneSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmb2N1cy10cmFwcGVkIHJlZ2lvbiBhcm91bmQgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IGFyb3VuZCB3aGljaCBmb2N1cyB3aWxsIGJlIHRyYXBwZWQuXG4gICAqIEBwYXJhbSBjb25maWcgVGhlIGZvY3VzIHRyYXAgY29uZmlndXJhdGlvbi5cbiAgICogQHJldHVybnMgVGhlIGNyZWF0ZWQgZm9jdXMgdHJhcCBpbnN0YW5jZS5cbiAgICovXG4gIGNyZWF0ZShlbGVtZW50OiBIVE1MRWxlbWVudCwgY29uZmlnPzogQ29uZmlndXJhYmxlRm9jdXNUcmFwQ29uZmlnKTogQ29uZmlndXJhYmxlRm9jdXNUcmFwO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzIGEgY29uZmlnIG9iamVjdCBpbnN0ZWFkIG9mIHRoZSBgZGVmZXJDYXB0dXJlRWxlbWVudHNgIGZsYWcuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wXG4gICAqL1xuICBjcmVhdGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIGRlZmVyQ2FwdHVyZUVsZW1lbnRzOiBib29sZWFuKTogQ29uZmlndXJhYmxlRm9jdXNUcmFwO1xuXG4gIGNyZWF0ZShlbGVtZW50OiBIVE1MRWxlbWVudCwgY29uZmlnOiBDb25maWd1cmFibGVGb2N1c1RyYXBDb25maWd8Ym9vbGVhbiA9IHtkZWZlcjogZmFsc2V9KTpcbiAgICAgIENvbmZpZ3VyYWJsZUZvY3VzVHJhcCB7XG4gICAgbGV0IGNvbmZpZ09iamVjdDogQ29uZmlndXJhYmxlRm9jdXNUcmFwQ29uZmlnO1xuICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnYm9vbGVhbicpIHtcbiAgICAgIGNvbmZpZ09iamVjdCA9IHtkZWZlcjogY29uZmlnfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnT2JqZWN0ID0gY29uZmlnO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcChcbiAgICAgICAgZWxlbWVudCwgdGhpcy5fY2hlY2tlciwgdGhpcy5fbmdab25lLCB0aGlzLl9kb2N1bWVudCwgdGhpcy5fZm9jdXNUcmFwTWFuYWdlcixcbiAgICAgICAgdGhpcy5faW5lcnRTdHJhdGVneSwgY29uZmlnT2JqZWN0KTtcbiAgfVxufVxuIl19