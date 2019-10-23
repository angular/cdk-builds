/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Basic interface for an overlay. Used to avoid circular type references between
 * `OverlayRef`, `PositionStrategy` and `ScrollStrategy`, and `OverlayConfig`.
 * \@docs-private
 * @record
 */
export function OverlayReference() { }
if (false) {
    /** @type {?} */
    OverlayReference.prototype.attach;
    /** @type {?} */
    OverlayReference.prototype.detach;
    /** @type {?} */
    OverlayReference.prototype.dispose;
    /** @type {?} */
    OverlayReference.prototype.overlayElement;
    /** @type {?} */
    OverlayReference.prototype.hostElement;
    /** @type {?} */
    OverlayReference.prototype.getConfig;
    /** @type {?} */
    OverlayReference.prototype.hasAttached;
    /** @type {?} */
    OverlayReference.prototype.updateSize;
    /** @type {?} */
    OverlayReference.prototype.updatePosition;
    /** @type {?} */
    OverlayReference.prototype.getDirection;
    /** @type {?} */
    OverlayReference.prototype.setDirection;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1yZWZlcmVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1yZWZlcmVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsc0NBWUM7OztJQVhDLGtDQUFxQzs7SUFDckMsa0NBQWtCOztJQUNsQixtQ0FBb0I7O0lBQ3BCLDBDQUE0Qjs7SUFDNUIsdUNBQXlCOztJQUN6QixxQ0FBcUI7O0lBQ3JCLHVDQUEyQjs7SUFDM0Isc0NBQWtDOztJQUNsQywwQ0FBMkI7O0lBQzNCLHdDQUE4Qjs7SUFDOUIsd0NBQXdEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuXG4vKipcbiAqIEJhc2ljIGludGVyZmFjZSBmb3IgYW4gb3ZlcmxheS4gVXNlZCB0byBhdm9pZCBjaXJjdWxhciB0eXBlIHJlZmVyZW5jZXMgYmV0d2VlblxuICogYE92ZXJsYXlSZWZgLCBgUG9zaXRpb25TdHJhdGVneWAgYW5kIGBTY3JvbGxTdHJhdGVneWAsIGFuZCBgT3ZlcmxheUNvbmZpZ2AuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3ZlcmxheVJlZmVyZW5jZSB7XG4gIGF0dGFjaDogKHBvcnRhbDogUG9ydGFsPGFueT4pID0+IGFueTtcbiAgZGV0YWNoOiAoKSA9PiBhbnk7XG4gIGRpc3Bvc2U6ICgpID0+IHZvaWQ7XG4gIG92ZXJsYXlFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgaG9zdEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBnZXRDb25maWc6ICgpID0+IGFueTtcbiAgaGFzQXR0YWNoZWQ6ICgpID0+IGJvb2xlYW47XG4gIHVwZGF0ZVNpemU6IChjb25maWc6IGFueSkgPT4gdm9pZDtcbiAgdXBkYXRlUG9zaXRpb246ICgpID0+IHZvaWQ7XG4gIGdldERpcmVjdGlvbjogKCkgPT4gRGlyZWN0aW9uO1xuICBzZXREaXJlY3Rpb246IChkaXI6IERpcmVjdGlvbiB8IERpcmVjdGlvbmFsaXR5KSA9PiB2b2lkO1xufVxuIl19