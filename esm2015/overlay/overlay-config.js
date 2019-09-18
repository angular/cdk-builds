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
import { NoopScrollStrategy } from './scroll/index';
/**
 * Initial configuration used when creating an overlay.
 */
export class OverlayConfig {
    /**
     * @param {?=} config
     */
    constructor(config) {
        /**
         * Strategy to be used when handling scroll events while the overlay is open.
         */
        this.scrollStrategy = new NoopScrollStrategy();
        /**
         * Custom class to add to the overlay pane.
         */
        this.panelClass = '';
        /**
         * Whether the overlay has a backdrop.
         */
        this.hasBackdrop = false;
        /**
         * Custom class to add to the backdrop
         */
        this.backdropClass = 'cdk-overlay-dark-backdrop';
        /**
         * Whether the overlay should be disposed of when the user goes backwards/forwards in history.
         * Note that this usually doesn't include clicking on links (unless the user is using
         * the `HashLocationStrategy`).
         */
        this.disposeOnNavigation = false;
        if (config) {
            /** @type {?} */
            const configKeys = (/** @type {?} */ (Object.keys(config)));
            for (const key of configKeys) {
                if (config[key] !== undefined) {
                    // TypeScript, as of version 3.5, sees the left-hand-side of this expression
                    // as "I don't know *which* key this is, so the only valid value is the intersection
                    // of all the posible values." In this case, that happens to be `undefined`. TypeScript
                    // is not smart enough to see that the right-hand-side is actually an access of the same
                    // exact type with the same exact key, meaning that the value type must be identical.
                    // So we use `any` to work around this.
                    this[key] = (/** @type {?} */ (config[key]));
                }
            }
        }
    }
}
if (false) {
    /**
     * Strategy with which to position the overlay.
     * @type {?}
     */
    OverlayConfig.prototype.positionStrategy;
    /**
     * Strategy to be used when handling scroll events while the overlay is open.
     * @type {?}
     */
    OverlayConfig.prototype.scrollStrategy;
    /**
     * Custom class to add to the overlay pane.
     * @type {?}
     */
    OverlayConfig.prototype.panelClass;
    /**
     * Whether the overlay has a backdrop.
     * @type {?}
     */
    OverlayConfig.prototype.hasBackdrop;
    /**
     * Custom class to add to the backdrop
     * @type {?}
     */
    OverlayConfig.prototype.backdropClass;
    /**
     * The width of the overlay panel. If a number is provided, pixel units are assumed.
     * @type {?}
     */
    OverlayConfig.prototype.width;
    /**
     * The height of the overlay panel. If a number is provided, pixel units are assumed.
     * @type {?}
     */
    OverlayConfig.prototype.height;
    /**
     * The min-width of the overlay panel. If a number is provided, pixel units are assumed.
     * @type {?}
     */
    OverlayConfig.prototype.minWidth;
    /**
     * The min-height of the overlay panel. If a number is provided, pixel units are assumed.
     * @type {?}
     */
    OverlayConfig.prototype.minHeight;
    /**
     * The max-width of the overlay panel. If a number is provided, pixel units are assumed.
     * @type {?}
     */
    OverlayConfig.prototype.maxWidth;
    /**
     * The max-height of the overlay panel. If a number is provided, pixel units are assumed.
     * @type {?}
     */
    OverlayConfig.prototype.maxHeight;
    /**
     * Direction of the text in the overlay panel. If a `Directionality` instance
     * is passed in, the overlay will handle changes to its value automatically.
     * @type {?}
     */
    OverlayConfig.prototype.direction;
    /**
     * Whether the overlay should be disposed of when the user goes backwards/forwards in history.
     * Note that this usually doesn't include clicking on links (unless the user is using
     * the `HashLocationStrategy`).
     * @type {?}
     */
    OverlayConfig.prototype.disposeOnNavigation;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFVQSxPQUFPLEVBQWlCLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7QUFJbEUsTUFBTSxPQUFPLGFBQWE7Ozs7SUErQ3hCLFlBQVksTUFBc0I7Ozs7UUExQ2xDLG1CQUFjLEdBQW9CLElBQUksa0JBQWtCLEVBQUUsQ0FBQzs7OztRQUczRCxlQUFVLEdBQXVCLEVBQUUsQ0FBQzs7OztRQUdwQyxnQkFBVyxHQUFhLEtBQUssQ0FBQzs7OztRQUc5QixrQkFBYSxHQUF1QiwyQkFBMkIsQ0FBQzs7Ozs7O1FBK0JoRSx3QkFBbUIsR0FBYSxLQUFLLENBQUM7UUFHcEMsSUFBSSxNQUFNLEVBQUU7O2tCQUNKLFVBQVUsR0FBRyxtQkFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUE4QjtZQUNwRSxLQUFLLE1BQU0sR0FBRyxJQUFJLFVBQVUsRUFBRTtnQkFDNUIsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxFQUFFO29CQUM3Qiw0RUFBNEU7b0JBQzVFLG9GQUFvRjtvQkFDcEYsdUZBQXVGO29CQUN2Rix3RkFBd0Y7b0JBQ3hGLHFGQUFxRjtvQkFDckYsdUNBQXVDO29CQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsbUJBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFPLENBQUM7aUJBQ2hDO2FBQ0Y7U0FDRjtJQUNILENBQUM7Q0FDRjs7Ozs7O0lBN0RDLHlDQUFvQzs7Ozs7SUFHcEMsdUNBQTJEOzs7OztJQUczRCxtQ0FBb0M7Ozs7O0lBR3BDLG9DQUE4Qjs7Ozs7SUFHOUIsc0NBQWdFOzs7OztJQUdoRSw4QkFBd0I7Ozs7O0lBR3hCLCtCQUF5Qjs7Ozs7SUFHekIsaUNBQTJCOzs7OztJQUczQixrQ0FBNEI7Ozs7O0lBRzVCLGlDQUEyQjs7Ozs7SUFHM0Isa0NBQTRCOzs7Ozs7SUFNNUIsa0NBQXVDOzs7Ozs7O0lBT3ZDLDRDQUFzQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Bvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vcG9zaXRpb24vcG9zaXRpb24tc3RyYXRlZ3knO1xuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5LCBOb29wU2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vc2Nyb2xsL2luZGV4JztcblxuXG4vKiogSW5pdGlhbCBjb25maWd1cmF0aW9uIHVzZWQgd2hlbiBjcmVhdGluZyBhbiBvdmVybGF5LiAqL1xuZXhwb3J0IGNsYXNzIE92ZXJsYXlDb25maWcge1xuICAvKiogU3RyYXRlZ3kgd2l0aCB3aGljaCB0byBwb3NpdGlvbiB0aGUgb3ZlcmxheS4gKi9cbiAgcG9zaXRpb25TdHJhdGVneT86IFBvc2l0aW9uU3RyYXRlZ3k7XG5cbiAgLyoqIFN0cmF0ZWd5IHRvIGJlIHVzZWQgd2hlbiBoYW5kbGluZyBzY3JvbGwgZXZlbnRzIHdoaWxlIHRoZSBvdmVybGF5IGlzIG9wZW4uICovXG4gIHNjcm9sbFN0cmF0ZWd5PzogU2Nyb2xsU3RyYXRlZ3kgPSBuZXcgTm9vcFNjcm9sbFN0cmF0ZWd5KCk7XG5cbiAgLyoqIEN1c3RvbSBjbGFzcyB0byBhZGQgdG8gdGhlIG92ZXJsYXkgcGFuZS4gKi9cbiAgcGFuZWxDbGFzcz86IHN0cmluZyB8IHN0cmluZ1tdID0gJyc7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgaGFzIGEgYmFja2Ryb3AuICovXG4gIGhhc0JhY2tkcm9wPzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBDdXN0b20gY2xhc3MgdG8gYWRkIHRvIHRoZSBiYWNrZHJvcCAqL1xuICBiYWNrZHJvcENsYXNzPzogc3RyaW5nIHwgc3RyaW5nW10gPSAnY2RrLW92ZXJsYXktZGFyay1iYWNrZHJvcCc7XG5cbiAgLyoqIFRoZSB3aWR0aCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHBpeGVsIHVuaXRzIGFyZSBhc3N1bWVkLiAqL1xuICB3aWR0aD86IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIGhlaWdodCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHBpeGVsIHVuaXRzIGFyZSBhc3N1bWVkLiAqL1xuICBoZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4td2lkdGggb2YgdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCBwaXhlbCB1bml0cyBhcmUgYXNzdW1lZC4gKi9cbiAgbWluV2lkdGg/OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtaW4taGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgcGl4ZWwgdW5pdHMgYXJlIGFzc3VtZWQuICovXG4gIG1pbkhlaWdodD86IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIG1heC13aWR0aCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHBpeGVsIHVuaXRzIGFyZSBhc3N1bWVkLiAqL1xuICBtYXhXaWR0aD86IG51bWJlciB8IHN0cmluZztcblxuICAvKiogVGhlIG1heC1oZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCBwaXhlbCB1bml0cyBhcmUgYXNzdW1lZC4gKi9cbiAgbWF4SGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBEaXJlY3Rpb24gb2YgdGhlIHRleHQgaW4gdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgYERpcmVjdGlvbmFsaXR5YCBpbnN0YW5jZVxuICAgKiBpcyBwYXNzZWQgaW4sIHRoZSBvdmVybGF5IHdpbGwgaGFuZGxlIGNoYW5nZXMgdG8gaXRzIHZhbHVlIGF1dG9tYXRpY2FsbHkuXG4gICAqL1xuICBkaXJlY3Rpb24/OiBEaXJlY3Rpb24gfCBEaXJlY3Rpb25hbGl0eTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgb3ZlcmxheSBzaG91bGQgYmUgZGlzcG9zZWQgb2Ygd2hlbiB0aGUgdXNlciBnb2VzIGJhY2t3YXJkcy9mb3J3YXJkcyBpbiBoaXN0b3J5LlxuICAgKiBOb3RlIHRoYXQgdGhpcyB1c3VhbGx5IGRvZXNuJ3QgaW5jbHVkZSBjbGlja2luZyBvbiBsaW5rcyAodW5sZXNzIHRoZSB1c2VyIGlzIHVzaW5nXG4gICAqIHRoZSBgSGFzaExvY2F0aW9uU3RyYXRlZ3lgKS5cbiAgICovXG4gIGRpc3Bvc2VPbk5hdmlnYXRpb24/OiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnPzogT3ZlcmxheUNvbmZpZykge1xuICAgIGlmIChjb25maWcpIHtcbiAgICAgIGNvbnN0IGNvbmZpZ0tleXMgPSBPYmplY3Qua2V5cyhjb25maWcpIGFzIEFycmF5PGtleW9mIE92ZXJsYXlDb25maWc+O1xuICAgICAgZm9yIChjb25zdCBrZXkgb2YgY29uZmlnS2V5cykge1xuICAgICAgICBpZiAoY29uZmlnW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIFR5cGVTY3JpcHQsIGFzIG9mIHZlcnNpb24gMy41LCBzZWVzIHRoZSBsZWZ0LWhhbmQtc2lkZSBvZiB0aGlzIGV4cHJlc3Npb25cbiAgICAgICAgICAvLyBhcyBcIkkgZG9uJ3Qga25vdyAqd2hpY2gqIGtleSB0aGlzIGlzLCBzbyB0aGUgb25seSB2YWxpZCB2YWx1ZSBpcyB0aGUgaW50ZXJzZWN0aW9uXG4gICAgICAgICAgLy8gb2YgYWxsIHRoZSBwb3NpYmxlIHZhbHVlcy5cIiBJbiB0aGlzIGNhc2UsIHRoYXQgaGFwcGVucyB0byBiZSBgdW5kZWZpbmVkYC4gVHlwZVNjcmlwdFxuICAgICAgICAgIC8vIGlzIG5vdCBzbWFydCBlbm91Z2ggdG8gc2VlIHRoYXQgdGhlIHJpZ2h0LWhhbmQtc2lkZSBpcyBhY3R1YWxseSBhbiBhY2Nlc3Mgb2YgdGhlIHNhbWVcbiAgICAgICAgICAvLyBleGFjdCB0eXBlIHdpdGggdGhlIHNhbWUgZXhhY3Qga2V5LCBtZWFuaW5nIHRoYXQgdGhlIHZhbHVlIHR5cGUgbXVzdCBiZSBpZGVudGljYWwuXG4gICAgICAgICAgLy8gU28gd2UgdXNlIGBhbnlgIHRvIHdvcmsgYXJvdW5kIHRoaXMuXG4gICAgICAgICAgdGhpc1trZXldID0gY29uZmlnW2tleV0gYXMgYW55O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=