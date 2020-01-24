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
import * as i1 from "angular_material/src/cdk/a11y/interactivity-checker/interactivity-checker";
import * as i2 from "angular_material/src/cdk/a11y/focus-trap/focus-trap-manager";
import * as i3 from "@angular/common";
import * as i4 from "angular_material/src/cdk/a11y/focus-trap/focus-trap-inert-strategy";
/** Factory that allows easy instantiation of configurable focus traps. */
var ConfigurableFocusTrapFactory = /** @class */ (function () {
    function ConfigurableFocusTrapFactory(_checker, _ngZone, _focusTrapManager, _document, _inertStrategy) {
        this._checker = _checker;
        this._ngZone = _ngZone;
        this._focusTrapManager = _focusTrapManager;
        this._document = _document;
        // TODO split up the strategies into different modules, similar to DateAdapter.
        this._inertStrategy = _inertStrategy || new EventListenerFocusTrapInertStrategy();
    }
    /**
     * Creates a focus-trapped region around the given element.
     * @param element The element around which focus will be trapped.
     * @param deferCaptureElements Defers the creation of focus-capturing elements to be done
     *     manually by the user.
     * @returns The created focus trap instance.
     */
    ConfigurableFocusTrapFactory.prototype.create = function (element, config) {
        if (config === void 0) { config = new ConfigurableFocusTrapConfig(); }
        return new ConfigurableFocusTrap(element, this._checker, this._ngZone, this._document, this._focusTrapManager, this._inertStrategy, config);
    };
    ConfigurableFocusTrapFactory.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    ConfigurableFocusTrapFactory.ctorParameters = function () { return [
        { type: InteractivityChecker },
        { type: NgZone },
        { type: FocusTrapManager },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_TRAP_INERT_STRATEGY,] }] }
    ]; };
    ConfigurableFocusTrapFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function ConfigurableFocusTrapFactory_Factory() { return new ConfigurableFocusTrapFactory(i0.ɵɵinject(i1.InteractivityChecker), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.FocusTrapManager), i0.ɵɵinject(i3.DOCUMENT), i0.ɵɵinject(i4.FOCUS_TRAP_INERT_STRATEGY, 8)); }, token: ConfigurableFocusTrapFactory, providedIn: "root" });
    return ConfigurableFocusTrapFactory;
}());
export { ConfigurableFocusTrapFactory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhYmxlLWZvY3VzLXRyYXAtZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy10cmFwL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwLWZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDTCxNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sZ0RBQWdELENBQUM7QUFDcEYsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDaEUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFDN0UsT0FBTyxFQUFDLHlCQUF5QixFQUF5QixNQUFNLDZCQUE2QixDQUFDO0FBQzlGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7QUFFdEQsMEVBQTBFO0FBQzFFO0lBS0Usc0NBQ1ksUUFBOEIsRUFDOUIsT0FBZSxFQUNmLGlCQUFtQyxFQUN6QixTQUFjLEVBQ2UsY0FBdUM7UUFKOUUsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7UUFDOUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0I7UUFJN0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsK0VBQStFO1FBQy9FLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxJQUFJLElBQUksbUNBQW1DLEVBQUUsQ0FBQztJQUNwRixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsNkNBQU0sR0FBTixVQUFPLE9BQW9CLEVBQUUsTUFDTTtRQUROLHVCQUFBLEVBQUEsYUFDdkIsMkJBQTJCLEVBQUU7UUFDakMsT0FBTyxJQUFJLHFCQUFxQixDQUM1QixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUM1RSxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ25DLENBQUM7O2dCQTdCRixVQUFVLFNBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzs7O2dCQVJ4QixvQkFBb0I7Z0JBRjFCLE1BQU07Z0JBT0EsZ0JBQWdCO2dEQVlqQixNQUFNLFNBQUMsUUFBUTtnREFDZixRQUFRLFlBQUksTUFBTSxTQUFDLHlCQUF5Qjs7O3VDQWpDbkQ7Q0FxREMsQUE5QkQsSUE4QkM7U0E3QlksNEJBQTRCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIE9wdGlvbmFsLFxuICBOZ1pvbmUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtJbnRlcmFjdGl2aXR5Q2hlY2tlcn0gZnJvbSAnLi4vaW50ZXJhY3Rpdml0eS1jaGVja2VyL2ludGVyYWN0aXZpdHktY2hlY2tlcic7XG5pbXBvcnQge0NvbmZpZ3VyYWJsZUZvY3VzVHJhcH0gZnJvbSAnLi9jb25maWd1cmFibGUtZm9jdXMtdHJhcCc7XG5pbXBvcnQge0NvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZ30gZnJvbSAnLi9jb25maWd1cmFibGUtZm9jdXMtdHJhcC1jb25maWcnO1xuaW1wb3J0IHtGT0NVU19UUkFQX0lORVJUX1NUUkFURUdZLCBGb2N1c1RyYXBJbmVydFN0cmF0ZWd5fSBmcm9tICcuL2ZvY3VzLXRyYXAtaW5lcnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtFdmVudExpc3RlbmVyRm9jdXNUcmFwSW5lcnRTdHJhdGVneX0gZnJvbSAnLi9ldmVudC1saXN0ZW5lci1pbmVydC1zdHJhdGVneSc7XG5pbXBvcnQge0ZvY3VzVHJhcE1hbmFnZXJ9IGZyb20gJy4vZm9jdXMtdHJhcC1tYW5hZ2VyJztcblxuLyoqIEZhY3RvcnkgdGhhdCBhbGxvd3MgZWFzeSBpbnN0YW50aWF0aW9uIG9mIGNvbmZpZ3VyYWJsZSBmb2N1cyB0cmFwcy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYWJsZUZvY3VzVHJhcEZhY3Rvcnkge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG4gIHByaXZhdGUgX2luZXJ0U3RyYXRlZ3k6IEZvY3VzVHJhcEluZXJ0U3RyYXRlZ3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9jaGVja2VyOiBJbnRlcmFjdGl2aXR5Q2hlY2tlcixcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfZm9jdXNUcmFwTWFuYWdlcjogRm9jdXNUcmFwTWFuYWdlcixcbiAgICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19UUkFQX0lORVJUX1NUUkFURUdZKSBfaW5lcnRTdHJhdGVneT86IEZvY3VzVHJhcEluZXJ0U3RyYXRlZ3kpIHtcblxuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIC8vIFRPRE8gc3BsaXQgdXAgdGhlIHN0cmF0ZWdpZXMgaW50byBkaWZmZXJlbnQgbW9kdWxlcywgc2ltaWxhciB0byBEYXRlQWRhcHRlci5cbiAgICB0aGlzLl9pbmVydFN0cmF0ZWd5ID0gX2luZXJ0U3RyYXRlZ3kgfHwgbmV3IEV2ZW50TGlzdGVuZXJGb2N1c1RyYXBJbmVydFN0cmF0ZWd5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZvY3VzLXRyYXBwZWQgcmVnaW9uIGFyb3VuZCB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgYXJvdW5kIHdoaWNoIGZvY3VzIHdpbGwgYmUgdHJhcHBlZC5cbiAgICogQHBhcmFtIGRlZmVyQ2FwdHVyZUVsZW1lbnRzIERlZmVycyB0aGUgY3JlYXRpb24gb2YgZm9jdXMtY2FwdHVyaW5nIGVsZW1lbnRzIHRvIGJlIGRvbmVcbiAgICogICAgIG1hbnVhbGx5IGJ5IHRoZSB1c2VyLlxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRlZCBmb2N1cyB0cmFwIGluc3RhbmNlLlxuICAgKi9cbiAgY3JlYXRlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb25maWc6IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZyA9XG4gICAgbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZygpKTogQ29uZmlndXJhYmxlRm9jdXNUcmFwIHtcbiAgICByZXR1cm4gbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcChcbiAgICAgICAgZWxlbWVudCwgdGhpcy5fY2hlY2tlciwgdGhpcy5fbmdab25lLCB0aGlzLl9kb2N1bWVudCwgdGhpcy5fZm9jdXNUcmFwTWFuYWdlcixcbiAgICAgICAgdGhpcy5faW5lcnRTdHJhdGVneSwgY29uZmlnKTtcbiAgfVxufVxuIl19