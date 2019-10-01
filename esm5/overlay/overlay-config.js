/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { NoopScrollStrategy } from './scroll/index';
/** Initial configuration used when creating an overlay. */
var OverlayConfig = /** @class */ (function () {
    function OverlayConfig(config) {
        var e_1, _a;
        /** Strategy to be used when handling scroll events while the overlay is open. */
        this.scrollStrategy = new NoopScrollStrategy();
        /** Custom class to add to the overlay pane. */
        this.panelClass = '';
        /** Whether the overlay has a backdrop. */
        this.hasBackdrop = false;
        /** Custom class to add to the backdrop */
        this.backdropClass = 'cdk-overlay-dark-backdrop';
        /**
         * Whether the overlay should be disposed of when the user goes backwards/forwards in history.
         * Note that this usually doesn't include clicking on links (unless the user is using
         * the `HashLocationStrategy`).
         */
        this.disposeOnNavigation = false;
        if (config) {
            var configKeys = Object.keys(config);
            try {
                for (var configKeys_1 = tslib_1.__values(configKeys), configKeys_1_1 = configKeys_1.next(); !configKeys_1_1.done; configKeys_1_1 = configKeys_1.next()) {
                    var key = configKeys_1_1.value;
                    if (config[key] !== undefined) {
                        // TypeScript, as of version 3.5, sees the left-hand-side of this expression
                        // as "I don't know *which* key this is, so the only valid value is the intersection
                        // of all the posible values." In this case, that happens to be `undefined`. TypeScript
                        // is not smart enough to see that the right-hand-side is actually an access of the same
                        // exact type with the same exact key, meaning that the value type must be identical.
                        // So we use `any` to work around this.
                        this[key] = config[key];
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (configKeys_1_1 && !configKeys_1_1.done && (_a = configKeys_1.return)) _a.call(configKeys_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    }
    return OverlayConfig;
}());
export { OverlayConfig };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUlILE9BQU8sRUFBaUIsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUdsRSwyREFBMkQ7QUFDM0Q7SUErQ0UsdUJBQVksTUFBc0I7O1FBM0NsQyxpRkFBaUY7UUFDakYsbUJBQWMsR0FBb0IsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1FBRTNELCtDQUErQztRQUMvQyxlQUFVLEdBQXVCLEVBQUUsQ0FBQztRQUVwQywwQ0FBMEM7UUFDMUMsZ0JBQVcsR0FBYSxLQUFLLENBQUM7UUFFOUIsMENBQTBDO1FBQzFDLGtCQUFhLEdBQXVCLDJCQUEyQixDQUFDO1FBMEJoRTs7OztXQUlHO1FBQ0gsd0JBQW1CLEdBQWEsS0FBSyxDQUFDO1FBR3BDLElBQUksTUFBTSxFQUFFO1lBQ1YsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQStCLENBQUM7O2dCQUNyRSxLQUFrQixJQUFBLGVBQUEsaUJBQUEsVUFBVSxDQUFBLHNDQUFBLDhEQUFFO29CQUF6QixJQUFNLEdBQUcsdUJBQUE7b0JBQ1osSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxFQUFFO3dCQUM3Qiw0RUFBNEU7d0JBQzVFLG9GQUFvRjt3QkFDcEYsdUZBQXVGO3dCQUN2Rix3RkFBd0Y7d0JBQ3hGLHFGQUFxRjt3QkFDckYsdUNBQXVDO3dCQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBUSxDQUFDO3FCQUNoQztpQkFDRjs7Ozs7Ozs7O1NBQ0Y7SUFDSCxDQUFDO0lBQ0gsb0JBQUM7QUFBRCxDQUFDLEFBL0RELElBK0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9wb3NpdGlvbi9wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7U2Nyb2xsU3RyYXRlZ3ksIE5vb3BTY3JvbGxTdHJhdGVneX0gZnJvbSAnLi9zY3JvbGwvaW5kZXgnO1xuXG5cbi8qKiBJbml0aWFsIGNvbmZpZ3VyYXRpb24gdXNlZCB3aGVuIGNyZWF0aW5nIGFuIG92ZXJsYXkuICovXG5leHBvcnQgY2xhc3MgT3ZlcmxheUNvbmZpZyB7XG4gIC8qKiBTdHJhdGVneSB3aXRoIHdoaWNoIHRvIHBvc2l0aW9uIHRoZSBvdmVybGF5LiAqL1xuICBwb3NpdGlvblN0cmF0ZWd5PzogUG9zaXRpb25TdHJhdGVneTtcblxuICAvKiogU3RyYXRlZ3kgdG8gYmUgdXNlZCB3aGVuIGhhbmRsaW5nIHNjcm9sbCBldmVudHMgd2hpbGUgdGhlIG92ZXJsYXkgaXMgb3Blbi4gKi9cbiAgc2Nyb2xsU3RyYXRlZ3k/OiBTY3JvbGxTdHJhdGVneSA9IG5ldyBOb29wU2Nyb2xsU3RyYXRlZ3koKTtcblxuICAvKiogQ3VzdG9tIGNsYXNzIHRvIGFkZCB0byB0aGUgb3ZlcmxheSBwYW5lLiAqL1xuICBwYW5lbENsYXNzPzogc3RyaW5nIHwgc3RyaW5nW10gPSAnJztcblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBoYXMgYSBiYWNrZHJvcC4gKi9cbiAgaGFzQmFja2Ryb3A/OiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIEN1c3RvbSBjbGFzcyB0byBhZGQgdG8gdGhlIGJhY2tkcm9wICovXG4gIGJhY2tkcm9wQ2xhc3M/OiBzdHJpbmcgfCBzdHJpbmdbXSA9ICdjZGstb3ZlcmxheS1kYXJrLWJhY2tkcm9wJztcblxuICAvKiogVGhlIHdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgcGl4ZWwgdW5pdHMgYXJlIGFzc3VtZWQuICovXG4gIHdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgcGl4ZWwgdW5pdHMgYXJlIGFzc3VtZWQuICovXG4gIGhlaWdodD86IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIG1pbi13aWR0aCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHBpeGVsIHVuaXRzIGFyZSBhc3N1bWVkLiAqL1xuICBtaW5XaWR0aD86IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIG1pbi1oZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCBwaXhlbCB1bml0cyBhcmUgYXNzdW1lZC4gKi9cbiAgbWluSGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWF4LXdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgcGl4ZWwgdW5pdHMgYXJlIGFzc3VtZWQuICovXG4gIG1heFdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWF4LWhlaWdodCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHBpeGVsIHVuaXRzIGFyZSBhc3N1bWVkLiAqL1xuICBtYXhIZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIERpcmVjdGlvbiBvZiB0aGUgdGV4dCBpbiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBgRGlyZWN0aW9uYWxpdHlgIGluc3RhbmNlXG4gICAqIGlzIHBhc3NlZCBpbiwgdGhlIG92ZXJsYXkgd2lsbCBoYW5kbGUgY2hhbmdlcyB0byBpdHMgdmFsdWUgYXV0b21hdGljYWxseS5cbiAgICovXG4gIGRpcmVjdGlvbj86IERpcmVjdGlvbiB8IERpcmVjdGlvbmFsaXR5O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBvdmVybGF5IHNob3VsZCBiZSBkaXNwb3NlZCBvZiB3aGVuIHRoZSB1c2VyIGdvZXMgYmFja3dhcmRzL2ZvcndhcmRzIGluIGhpc3RvcnkuXG4gICAqIE5vdGUgdGhhdCB0aGlzIHVzdWFsbHkgZG9lc24ndCBpbmNsdWRlIGNsaWNraW5nIG9uIGxpbmtzICh1bmxlc3MgdGhlIHVzZXIgaXMgdXNpbmdcbiAgICogdGhlIGBIYXNoTG9jYXRpb25TdHJhdGVneWApLlxuICAgKi9cbiAgZGlzcG9zZU9uTmF2aWdhdGlvbj86IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc/OiBPdmVybGF5Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgY29uc3QgY29uZmlnS2V5cyA9IE9iamVjdC5rZXlzKGNvbmZpZykgYXMgQXJyYXk8a2V5b2YgT3ZlcmxheUNvbmZpZz47XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBjb25maWdLZXlzKSB7XG4gICAgICAgIGlmIChjb25maWdba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gVHlwZVNjcmlwdCwgYXMgb2YgdmVyc2lvbiAzLjUsIHNlZXMgdGhlIGxlZnQtaGFuZC1zaWRlIG9mIHRoaXMgZXhwcmVzc2lvblxuICAgICAgICAgIC8vIGFzIFwiSSBkb24ndCBrbm93ICp3aGljaCoga2V5IHRoaXMgaXMsIHNvIHRoZSBvbmx5IHZhbGlkIHZhbHVlIGlzIHRoZSBpbnRlcnNlY3Rpb25cbiAgICAgICAgICAvLyBvZiBhbGwgdGhlIHBvc2libGUgdmFsdWVzLlwiIEluIHRoaXMgY2FzZSwgdGhhdCBoYXBwZW5zIHRvIGJlIGB1bmRlZmluZWRgLiBUeXBlU2NyaXB0XG4gICAgICAgICAgLy8gaXMgbm90IHNtYXJ0IGVub3VnaCB0byBzZWUgdGhhdCB0aGUgcmlnaHQtaGFuZC1zaWRlIGlzIGFjdHVhbGx5IGFuIGFjY2VzcyBvZiB0aGUgc2FtZVxuICAgICAgICAgIC8vIGV4YWN0IHR5cGUgd2l0aCB0aGUgc2FtZSBleGFjdCBrZXksIG1lYW5pbmcgdGhhdCB0aGUgdmFsdWUgdHlwZSBtdXN0IGJlIGlkZW50aWNhbC5cbiAgICAgICAgICAvLyBTbyB3ZSB1c2UgYGFueWAgdG8gd29yayBhcm91bmQgdGhpcy5cbiAgICAgICAgICB0aGlzW2tleV0gPSBjb25maWdba2V5XSBhcyBhbnk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==