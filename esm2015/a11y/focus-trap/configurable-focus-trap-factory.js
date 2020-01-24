/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/focus-trap/configurable-focus-trap-factory.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
/**
 * Factory that allows easy instantiation of configurable focus traps.
 */
export class ConfigurableFocusTrapFactory {
    /**
     * @param {?} _checker
     * @param {?} _ngZone
     * @param {?} _focusTrapManager
     * @param {?} _document
     * @param {?=} _inertStrategy
     */
    constructor(_checker, _ngZone, _focusTrapManager, _document, _inertStrategy) {
        this._checker = _checker;
        this._ngZone = _ngZone;
        this._focusTrapManager = _focusTrapManager;
        this._document = _document;
        // TODO split up the strategies into different modules, similar to DateAdapter.
        this._inertStrategy = _inertStrategy || new EventListenerFocusTrapInertStrategy();
    }
    /**
     * Creates a focus-trapped region around the given element.
     * @param {?} element The element around which focus will be trapped.
     * @param {?=} config
     * @return {?} The created focus trap instance.
     */
    create(element, config = new ConfigurableFocusTrapConfig()) {
        return new ConfigurableFocusTrap(element, this._checker, this._ngZone, this._document, this._focusTrapManager, this._inertStrategy, config);
    }
}
ConfigurableFocusTrapFactory.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
ConfigurableFocusTrapFactory.ctorParameters = () => [
    { type: InteractivityChecker },
    { type: NgZone },
    { type: FocusTrapManager },
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [FOCUS_TRAP_INERT_STRATEGY,] }] }
];
/** @nocollapse */ ConfigurableFocusTrapFactory.ɵprov = i0.ɵɵdefineInjectable({ factory: function ConfigurableFocusTrapFactory_Factory() { return new ConfigurableFocusTrapFactory(i0.ɵɵinject(i1.InteractivityChecker), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.FocusTrapManager), i0.ɵɵinject(i3.DOCUMENT), i0.ɵɵinject(i4.FOCUS_TRAP_INERT_STRATEGY, 8)); }, token: ConfigurableFocusTrapFactory, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    ConfigurableFocusTrapFactory.prototype._document;
    /**
     * @type {?}
     * @private
     */
    ConfigurableFocusTrapFactory.prototype._inertStrategy;
    /**
     * @type {?}
     * @private
     */
    ConfigurableFocusTrapFactory.prototype._checker;
    /**
     * @type {?}
     * @private
     */
    ConfigurableFocusTrapFactory.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    ConfigurableFocusTrapFactory.prototype._focusTrapManager;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhYmxlLWZvY3VzLXRyYXAtZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvYTExeS9mb2N1cy10cmFwL2NvbmZpZ3VyYWJsZS1mb2N1cy10cmFwLWZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFDTCxNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sZ0RBQWdELENBQUM7QUFDcEYsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDaEUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFDN0UsT0FBTyxFQUFDLHlCQUF5QixFQUF5QixNQUFNLDZCQUE2QixDQUFDO0FBQzlGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7Ozs7QUFJdEQsTUFBTSxPQUFPLDRCQUE0Qjs7Ozs7Ozs7SUFJdkMsWUFDWSxRQUE4QixFQUM5QixPQUFlLEVBQ2YsaUJBQW1DLEVBQ3pCLFNBQWMsRUFDZSxjQUF1QztRQUo5RSxhQUFRLEdBQVIsUUFBUSxDQUFzQjtRQUM5QixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQ2Ysc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtRQUk3QyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQiwrRUFBK0U7UUFDL0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLElBQUksSUFBSSxtQ0FBbUMsRUFBRSxDQUFDO0lBQ3BGLENBQUM7Ozs7Ozs7SUFTRCxNQUFNLENBQUMsT0FBb0IsRUFBRSxTQUMzQixJQUFJLDJCQUEyQixFQUFFO1FBQ2pDLE9BQU8sSUFBSSxxQkFBcUIsQ0FDNUIsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFDNUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDOzs7WUE3QkYsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztZQVJ4QixvQkFBb0I7WUFGMUIsTUFBTTtZQU9BLGdCQUFnQjs0Q0FZakIsTUFBTSxTQUFDLFFBQVE7NENBQ2YsUUFBUSxZQUFJLE1BQU0sU0FBQyx5QkFBeUI7Ozs7Ozs7O0lBUmpELGlEQUE0Qjs7Ozs7SUFDNUIsc0RBQStDOzs7OztJQUczQyxnREFBc0M7Ozs7O0lBQ3RDLCtDQUF1Qjs7Ozs7SUFDdkIseURBQTJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIE9wdGlvbmFsLFxuICBOZ1pvbmUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtJbnRlcmFjdGl2aXR5Q2hlY2tlcn0gZnJvbSAnLi4vaW50ZXJhY3Rpdml0eS1jaGVja2VyL2ludGVyYWN0aXZpdHktY2hlY2tlcic7XG5pbXBvcnQge0NvbmZpZ3VyYWJsZUZvY3VzVHJhcH0gZnJvbSAnLi9jb25maWd1cmFibGUtZm9jdXMtdHJhcCc7XG5pbXBvcnQge0NvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZ30gZnJvbSAnLi9jb25maWd1cmFibGUtZm9jdXMtdHJhcC1jb25maWcnO1xuaW1wb3J0IHtGT0NVU19UUkFQX0lORVJUX1NUUkFURUdZLCBGb2N1c1RyYXBJbmVydFN0cmF0ZWd5fSBmcm9tICcuL2ZvY3VzLXRyYXAtaW5lcnQtc3RyYXRlZ3knO1xuaW1wb3J0IHtFdmVudExpc3RlbmVyRm9jdXNUcmFwSW5lcnRTdHJhdGVneX0gZnJvbSAnLi9ldmVudC1saXN0ZW5lci1pbmVydC1zdHJhdGVneSc7XG5pbXBvcnQge0ZvY3VzVHJhcE1hbmFnZXJ9IGZyb20gJy4vZm9jdXMtdHJhcC1tYW5hZ2VyJztcblxuLyoqIEZhY3RvcnkgdGhhdCBhbGxvd3MgZWFzeSBpbnN0YW50aWF0aW9uIG9mIGNvbmZpZ3VyYWJsZSBmb2N1cyB0cmFwcy4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENvbmZpZ3VyYWJsZUZvY3VzVHJhcEZhY3Rvcnkge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG4gIHByaXZhdGUgX2luZXJ0U3RyYXRlZ3k6IEZvY3VzVHJhcEluZXJ0U3RyYXRlZ3k7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9jaGVja2VyOiBJbnRlcmFjdGl2aXR5Q2hlY2tlcixcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfZm9jdXNUcmFwTWFuYWdlcjogRm9jdXNUcmFwTWFuYWdlcixcbiAgICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChGT0NVU19UUkFQX0lORVJUX1NUUkFURUdZKSBfaW5lcnRTdHJhdGVneT86IEZvY3VzVHJhcEluZXJ0U3RyYXRlZ3kpIHtcblxuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIC8vIFRPRE8gc3BsaXQgdXAgdGhlIHN0cmF0ZWdpZXMgaW50byBkaWZmZXJlbnQgbW9kdWxlcywgc2ltaWxhciB0byBEYXRlQWRhcHRlci5cbiAgICB0aGlzLl9pbmVydFN0cmF0ZWd5ID0gX2luZXJ0U3RyYXRlZ3kgfHwgbmV3IEV2ZW50TGlzdGVuZXJGb2N1c1RyYXBJbmVydFN0cmF0ZWd5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZvY3VzLXRyYXBwZWQgcmVnaW9uIGFyb3VuZCB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgYXJvdW5kIHdoaWNoIGZvY3VzIHdpbGwgYmUgdHJhcHBlZC5cbiAgICogQHBhcmFtIGRlZmVyQ2FwdHVyZUVsZW1lbnRzIERlZmVycyB0aGUgY3JlYXRpb24gb2YgZm9jdXMtY2FwdHVyaW5nIGVsZW1lbnRzIHRvIGJlIGRvbmVcbiAgICogICAgIG1hbnVhbGx5IGJ5IHRoZSB1c2VyLlxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRlZCBmb2N1cyB0cmFwIGluc3RhbmNlLlxuICAgKi9cbiAgY3JlYXRlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb25maWc6IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZyA9XG4gICAgbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcENvbmZpZygpKTogQ29uZmlndXJhYmxlRm9jdXNUcmFwIHtcbiAgICByZXR1cm4gbmV3IENvbmZpZ3VyYWJsZUZvY3VzVHJhcChcbiAgICAgICAgZWxlbWVudCwgdGhpcy5fY2hlY2tlciwgdGhpcy5fbmdab25lLCB0aGlzLl9kb2N1bWVudCwgdGhpcy5fZm9jdXNUcmFwTWFuYWdlcixcbiAgICAgICAgdGhpcy5faW5lcnRTdHJhdGVneSwgY29uZmlnKTtcbiAgfVxufVxuIl19