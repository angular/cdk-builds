import { __decorate, __metadata, __param } from "tslib";
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
import { ConfigurableFocusTrapConfig } from './configurable-focus-trap-config';
import { FOCUS_TRAP_INERT_STRATEGY } from './focus-trap-inert-strategy';
import { EventListenerFocusTrapInertStrategy } from './event-listener-inert-strategy';
import { FocusTrapManager } from './focus-trap-manager';
import * as i0 from "@angular/core";
import * as i1 from "../interactivity-checker/interactivity-checker";
import * as i2 from "./focus-trap-manager";
import * as i3 from "@angular/common";
import * as i4 from "./focus-trap-inert-strategy";
/** Factory that allows easy instantiation of configurable focus traps. */
let ConfigurableFocusTrapFactory = /** @class */ (() => {
    let ConfigurableFocusTrapFactory = class ConfigurableFocusTrapFactory {
        constructor(_checker, _ngZone, _focusTrapManager, _document, _inertStrategy) {
            this._checker = _checker;
            this._ngZone = _ngZone;
            this._focusTrapManager = _focusTrapManager;
            this._document = _document;
            // TODO split up the strategies into different modules, similar to DateAdapter.
            this._inertStrategy = _inertStrategy || new EventListenerFocusTrapInertStrategy();
        }
        create(element, config = new ConfigurableFocusTrapConfig()) {
            let configObject;
            if (typeof config === 'boolean') {
                configObject = new ConfigurableFocusTrapConfig();
                configObject.defer = config;
            }
            else {
                configObject = config;
            }
            return new ConfigurableFocusTrap(element, this._checker, this._ngZone, this._document, this._focusTrapManager, this._inertStrategy, configObject);
        }
    };
    ConfigurableFocusTrapFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function ConfigurableFocusTrapFactory_Factory() { return new ConfigurableFocusTrapFactory(i0.ɵɵinject(i1.InteractivityChecker), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.FocusTrapManager), i0.ɵɵinject(i3.DOCUMENT), i0.ɵɵinject(i4.FOCUS_TRAP_INERT_STRATEGY, 8)); }, token: ConfigurableFocusTrapFactory, providedIn: "root" });
    ConfigurableFocusTrapFactory = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(3, Inject(DOCUMENT)),
        __param(4, Optional()), __param(4, Inject(FOCUS_TRAP_INERT_STRATEGY)),
        __metadata("design:paramtypes", [InteractivityChecker,
            NgZone,
            FocusTrapManager, Object, Object])
    ], ConfigurableFocusTrapFactory);
    return ConfigurableFocusTrapFactory;
})();
export { ConfigurableFocusTrapFactory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhYmxlLWZvY3VzLXRyYXAtZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy10cmFwL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwLWZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0wsTUFBTSxFQUNOLFVBQVUsRUFDVixRQUFRLEVBQ1IsTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLGdEQUFnRCxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQzdFLE9BQU8sRUFBQyx5QkFBeUIsRUFBeUIsTUFBTSw2QkFBNkIsQ0FBQztBQUM5RixPQUFPLEVBQUMsbUNBQW1DLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNwRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQzs7Ozs7O0FBRXRELDBFQUEwRTtBQUUxRTtJQUFBLElBQWEsNEJBQTRCLEdBQXpDLE1BQWEsNEJBQTRCO1FBSXZDLFlBQ1ksUUFBOEIsRUFDOUIsT0FBZSxFQUNmLGlCQUFtQyxFQUN6QixTQUFjLEVBQ2UsY0FBdUM7WUFKOUUsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7WUFDOUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7WUFJN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsK0VBQStFO1lBQy9FLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxJQUFJLElBQUksbUNBQW1DLEVBQUUsQ0FBQztRQUNwRixDQUFDO1FBZ0JELE1BQU0sQ0FBQyxPQUFvQixFQUFFLFNBQzNCLElBQUksMkJBQTJCLEVBQUU7WUFDakMsSUFBSSxZQUF5QyxDQUFDO1lBQzlDLElBQUksT0FBTyxNQUFNLEtBQUssU0FBUyxFQUFFO2dCQUMvQixZQUFZLEdBQUcsSUFBSSwyQkFBMkIsRUFBRSxDQUFDO2dCQUNqRCxZQUFZLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQzthQUM3QjtpQkFBTTtnQkFDTCxZQUFZLEdBQUcsTUFBTSxDQUFDO2FBQ3ZCO1lBQ0QsT0FBTyxJQUFJLHFCQUFxQixDQUM1QixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUM1RSxJQUFJLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRixDQUFBOztJQTNDWSw0QkFBNEI7UUFEeEMsVUFBVSxDQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyxDQUFDO1FBUzFCLFdBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2hCLFdBQUEsUUFBUSxFQUFFLENBQUEsRUFBRSxXQUFBLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO3lDQUo1QixvQkFBb0I7WUFDckIsTUFBTTtZQUNJLGdCQUFnQjtPQVBwQyw0QkFBNEIsQ0EyQ3hDO3VDQW5FRDtLQW1FQztTQTNDWSw0QkFBNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgT3B0aW9uYWwsXG4gIE5nWm9uZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0ludGVyYWN0aXZpdHlDaGVja2VyfSBmcm9tICcuLi9pbnRlcmFjdGl2aXR5LWNoZWNrZXIvaW50ZXJhY3Rpdml0eS1jaGVja2VyJztcbmltcG9ydCB7Q29uZmlndXJhYmxlRm9jdXNUcmFwfSBmcm9tICcuL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwJztcbmltcG9ydCB7Q29uZmlndXJhYmxlRm9jdXNUcmFwQ29uZmlnfSBmcm9tICcuL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwLWNvbmZpZyc7XG5pbXBvcnQge0ZPQ1VTX1RSQVBfSU5FUlRfU1RSQVRFR1ksIEZvY3VzVHJhcEluZXJ0U3RyYXRlZ3l9IGZyb20gJy4vZm9jdXMtdHJhcC1pbmVydC1zdHJhdGVneSc7XG5pbXBvcnQge0V2ZW50TGlzdGVuZXJGb2N1c1RyYXBJbmVydFN0cmF0ZWd5fSBmcm9tICcuL2V2ZW50LWxpc3RlbmVyLWluZXJ0LXN0cmF0ZWd5JztcbmltcG9ydCB7Rm9jdXNUcmFwTWFuYWdlcn0gZnJvbSAnLi9mb2N1cy10cmFwLW1hbmFnZXInO1xuXG4vKiogRmFjdG9yeSB0aGF0IGFsbG93cyBlYXN5IGluc3RhbnRpYXRpb24gb2YgY29uZmlndXJhYmxlIGZvY3VzIHRyYXBzLiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ29uZmlndXJhYmxlRm9jdXNUcmFwRmFjdG9yeSB7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcbiAgcHJpdmF0ZSBfaW5lcnRTdHJhdGVneTogRm9jdXNUcmFwSW5lcnRTdHJhdGVneTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2NoZWNrZXI6IEludGVyYWN0aXZpdHlDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF9mb2N1c1RyYXBNYW5hZ2VyOiBGb2N1c1RyYXBNYW5hZ2VyLFxuICAgICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KEZPQ1VTX1RSQVBfSU5FUlRfU1RSQVRFR1kpIF9pbmVydFN0cmF0ZWd5PzogRm9jdXNUcmFwSW5lcnRTdHJhdGVneSkge1xuXG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgLy8gVE9ETyBzcGxpdCB1cCB0aGUgc3RyYXRlZ2llcyBpbnRvIGRpZmZlcmVudCBtb2R1bGVzLCBzaW1pbGFyIHRvIERhdGVBZGFwdGVyLlxuICAgIHRoaXMuX2luZXJ0U3RyYXRlZ3kgPSBfaW5lcnRTdHJhdGVneSB8fCBuZXcgRXZlbnRMaXN0ZW5lckZvY3VzVHJhcEluZXJ0U3RyYXRlZ3koKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZm9jdXMtdHJhcHBlZCByZWdpb24gYXJvdW5kIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCBhcm91bmQgd2hpY2ggZm9jdXMgd2lsbCBiZSB0cmFwcGVkLlxuICAgKiBAcGFyYW0gY29uZmlnIFRoZSBmb2N1cyB0cmFwIGNvbmZpZ3VyYXRpb24uXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIGZvY3VzIHRyYXAgaW5zdGFuY2UuXG4gICAqL1xuICBjcmVhdGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNvbmZpZz86IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZyk6IENvbmZpZ3VyYWJsZUZvY3VzVHJhcDtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgUGFzcyBhIGNvbmZpZyBvYmplY3QgaW5zdGVhZCBvZiB0aGUgYGRlZmVyQ2FwdHVyZUVsZW1lbnRzYCBmbGFnLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMFxuICAgKi9cbiAgY3JlYXRlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkZWZlckNhcHR1cmVFbGVtZW50czogYm9vbGVhbik6IENvbmZpZ3VyYWJsZUZvY3VzVHJhcDtcblxuICBjcmVhdGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNvbmZpZzogQ29uZmlndXJhYmxlRm9jdXNUcmFwQ29uZmlnIHwgYm9vbGVhbiA9XG4gICAgbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZygpKTogQ29uZmlndXJhYmxlRm9jdXNUcmFwIHtcbiAgICBsZXQgY29uZmlnT2JqZWN0OiBDb25maWd1cmFibGVGb2N1c1RyYXBDb25maWc7XG4gICAgaWYgKHR5cGVvZiBjb25maWcgPT09ICdib29sZWFuJykge1xuICAgICAgY29uZmlnT2JqZWN0ID0gbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZygpO1xuICAgICAgY29uZmlnT2JqZWN0LmRlZmVyID0gY29uZmlnO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWdPYmplY3QgPSBjb25maWc7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29uZmlndXJhYmxlRm9jdXNUcmFwKFxuICAgICAgICBlbGVtZW50LCB0aGlzLl9jaGVja2VyLCB0aGlzLl9uZ1pvbmUsIHRoaXMuX2RvY3VtZW50LCB0aGlzLl9mb2N1c1RyYXBNYW5hZ2VyLFxuICAgICAgICB0aGlzLl9pbmVydFN0cmF0ZWd5LCBjb25maWdPYmplY3QpO1xuICB9XG59XG4iXX0=