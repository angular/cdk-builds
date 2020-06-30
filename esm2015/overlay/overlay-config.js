/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NoopScrollStrategy } from './scroll/index';
/** Initial configuration used when creating an overlay. */
export class OverlayConfig {
    constructor(config) {
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
        /**
         * Array of HTML elements clicking on which should not be considered as outside click
         */
        this.excludeFromOutsideClick = [];
        if (config) {
            // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
            // loses the array generic type in the `for of`. But we *also* have to use `Array` because
            // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
            const configKeys = Object.keys(config);
            for (const key of configKeys) {
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
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFpQixrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR2xFLDJEQUEyRDtBQUMzRCxNQUFNLE9BQU8sYUFBYTtJQW9EeEIsWUFBWSxNQUFzQjtRQWhEbEMsaUZBQWlGO1FBQ2pGLG1CQUFjLEdBQW9CLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUUzRCwrQ0FBK0M7UUFDL0MsZUFBVSxHQUF1QixFQUFFLENBQUM7UUFFcEMsMENBQTBDO1FBQzFDLGdCQUFXLEdBQWEsS0FBSyxDQUFDO1FBRTlCLDBDQUEwQztRQUMxQyxrQkFBYSxHQUF1QiwyQkFBMkIsQ0FBQztRQTBCaEU7Ozs7V0FJRztRQUNILHdCQUFtQixHQUFhLEtBQUssQ0FBQztRQUV0Qzs7V0FFRztRQUNILDRCQUF1QixHQUFtQixFQUFFLENBQUM7UUFHM0MsSUFBSSxNQUFNLEVBQUU7WUFDVixxRUFBcUU7WUFDckUsMEZBQTBGO1lBQzFGLDZGQUE2RjtZQUM3RixNQUFNLFVBQVUsR0FDWixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBNEQsQ0FBQztZQUNuRixLQUFLLE1BQU0sR0FBRyxJQUFJLFVBQVUsRUFBRTtnQkFDNUIsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxFQUFFO29CQUM3Qiw0RUFBNEU7b0JBQzVFLG9GQUFvRjtvQkFDcEYsdUZBQXVGO29CQUN2Rix3RkFBd0Y7b0JBQ3hGLHFGQUFxRjtvQkFDckYsdUNBQXVDO29CQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBUSxDQUFDO2lCQUNoQzthQUNGO1NBQ0Y7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQb3NpdGlvblN0cmF0ZWd5fSBmcm9tICcuL3Bvc2l0aW9uL3Bvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtTY3JvbGxTdHJhdGVneSwgTm9vcFNjcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3Njcm9sbC9pbmRleCc7XG5cblxuLyoqIEluaXRpYWwgY29uZmlndXJhdGlvbiB1c2VkIHdoZW4gY3JlYXRpbmcgYW4gb3ZlcmxheS4gKi9cbmV4cG9ydCBjbGFzcyBPdmVybGF5Q29uZmlnIHtcbiAgLyoqIFN0cmF0ZWd5IHdpdGggd2hpY2ggdG8gcG9zaXRpb24gdGhlIG92ZXJsYXkuICovXG4gIHBvc2l0aW9uU3RyYXRlZ3k/OiBQb3NpdGlvblN0cmF0ZWd5O1xuXG4gIC8qKiBTdHJhdGVneSB0byBiZSB1c2VkIHdoZW4gaGFuZGxpbmcgc2Nyb2xsIGV2ZW50cyB3aGlsZSB0aGUgb3ZlcmxheSBpcyBvcGVuLiAqL1xuICBzY3JvbGxTdHJhdGVneT86IFNjcm9sbFN0cmF0ZWd5ID0gbmV3IE5vb3BTY3JvbGxTdHJhdGVneSgpO1xuXG4gIC8qKiBDdXN0b20gY2xhc3MgdG8gYWRkIHRvIHRoZSBvdmVybGF5IHBhbmUuICovXG4gIHBhbmVsQ2xhc3M/OiBzdHJpbmcgfCBzdHJpbmdbXSA9ICcnO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGhhcyBhIGJhY2tkcm9wLiAqL1xuICBoYXNCYWNrZHJvcD86IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQ3VzdG9tIGNsYXNzIHRvIGFkZCB0byB0aGUgYmFja2Ryb3AgKi9cbiAgYmFja2Ryb3BDbGFzcz86IHN0cmluZyB8IHN0cmluZ1tdID0gJ2Nkay1vdmVybGF5LWRhcmstYmFja2Ryb3AnO1xuXG4gIC8qKiBUaGUgd2lkdGggb2YgdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCBwaXhlbCB1bml0cyBhcmUgYXNzdW1lZC4gKi9cbiAgd2lkdGg/OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBoZWlnaHQgb2YgdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCBwaXhlbCB1bml0cyBhcmUgYXNzdW1lZC4gKi9cbiAgaGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluLXdpZHRoIG9mIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgcGl4ZWwgdW5pdHMgYXJlIGFzc3VtZWQuICovXG4gIG1pbldpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuXG4gIC8qKiBUaGUgbWluLWhlaWdodCBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHBpeGVsIHVuaXRzIGFyZSBhc3N1bWVkLiAqL1xuICBtaW5IZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtYXgtd2lkdGggb2YgdGhlIG92ZXJsYXkgcGFuZWwuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCBwaXhlbCB1bml0cyBhcmUgYXNzdW1lZC4gKi9cbiAgbWF4V2lkdGg/OiBudW1iZXIgfCBzdHJpbmc7XG5cbiAgLyoqIFRoZSBtYXgtaGVpZ2h0IG9mIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgcGl4ZWwgdW5pdHMgYXJlIGFzc3VtZWQuICovXG4gIG1heEhlaWdodD86IG51bWJlciB8IHN0cmluZztcblxuICAvKipcbiAgICogRGlyZWN0aW9uIG9mIHRoZSB0ZXh0IGluIHRoZSBvdmVybGF5IHBhbmVsLiBJZiBhIGBEaXJlY3Rpb25hbGl0eWAgaW5zdGFuY2VcbiAgICogaXMgcGFzc2VkIGluLCB0aGUgb3ZlcmxheSB3aWxsIGhhbmRsZSBjaGFuZ2VzIHRvIGl0cyB2YWx1ZSBhdXRvbWF0aWNhbGx5LlxuICAgKi9cbiAgZGlyZWN0aW9uPzogRGlyZWN0aW9uIHwgRGlyZWN0aW9uYWxpdHk7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIG92ZXJsYXkgc2hvdWxkIGJlIGRpc3Bvc2VkIG9mIHdoZW4gdGhlIHVzZXIgZ29lcyBiYWNrd2FyZHMvZm9yd2FyZHMgaW4gaGlzdG9yeS5cbiAgICogTm90ZSB0aGF0IHRoaXMgdXN1YWxseSBkb2Vzbid0IGluY2x1ZGUgY2xpY2tpbmcgb24gbGlua3MgKHVubGVzcyB0aGUgdXNlciBpcyB1c2luZ1xuICAgKiB0aGUgYEhhc2hMb2NhdGlvblN0cmF0ZWd5YCkuXG4gICAqL1xuICBkaXNwb3NlT25OYXZpZ2F0aW9uPzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBIVE1MIGVsZW1lbnRzIGNsaWNraW5nIG9uIHdoaWNoIHNob3VsZCBub3QgYmUgY29uc2lkZXJlZCBhcyBvdXRzaWRlIGNsaWNrXG4gICAqL1xuICBleGNsdWRlRnJvbU91dHNpZGVDbGljaz86IEhUTUxFbGVtZW50W10gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc/OiBPdmVybGF5Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgLy8gVXNlIGBJdGVyYWJsZWAgaW5zdGVhZCBvZiBgQXJyYXlgIGJlY2F1c2UgVHlwZVNjcmlwdCwgYXMgb2YgMy42LjMsXG4gICAgICAvLyBsb3NlcyB0aGUgYXJyYXkgZ2VuZXJpYyB0eXBlIGluIHRoZSBgZm9yIG9mYC4gQnV0IHdlICphbHNvKiBoYXZlIHRvIHVzZSBgQXJyYXlgIGJlY2F1c2VcbiAgICAgIC8vIHR5cGVzY3JpcHQgd29uJ3QgaXRlcmF0ZSBvdmVyIGFuIGBJdGVyYWJsZWAgdW5sZXNzIHlvdSBjb21waWxlIHdpdGggYC0tZG93bmxldmVsSXRlcmF0aW9uYFxuICAgICAgY29uc3QgY29uZmlnS2V5cyA9XG4gICAgICAgICAgT2JqZWN0LmtleXMoY29uZmlnKSBhcyBJdGVyYWJsZTxrZXlvZiBPdmVybGF5Q29uZmlnPiAmIChrZXlvZiBPdmVybGF5Q29uZmlnKVtdO1xuICAgICAgZm9yIChjb25zdCBrZXkgb2YgY29uZmlnS2V5cykge1xuICAgICAgICBpZiAoY29uZmlnW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIFR5cGVTY3JpcHQsIGFzIG9mIHZlcnNpb24gMy41LCBzZWVzIHRoZSBsZWZ0LWhhbmQtc2lkZSBvZiB0aGlzIGV4cHJlc3Npb25cbiAgICAgICAgICAvLyBhcyBcIkkgZG9uJ3Qga25vdyAqd2hpY2gqIGtleSB0aGlzIGlzLCBzbyB0aGUgb25seSB2YWxpZCB2YWx1ZSBpcyB0aGUgaW50ZXJzZWN0aW9uXG4gICAgICAgICAgLy8gb2YgYWxsIHRoZSBwb3NpYmxlIHZhbHVlcy5cIiBJbiB0aGlzIGNhc2UsIHRoYXQgaGFwcGVucyB0byBiZSBgdW5kZWZpbmVkYC4gVHlwZVNjcmlwdFxuICAgICAgICAgIC8vIGlzIG5vdCBzbWFydCBlbm91Z2ggdG8gc2VlIHRoYXQgdGhlIHJpZ2h0LWhhbmQtc2lkZSBpcyBhY3R1YWxseSBhbiBhY2Nlc3Mgb2YgdGhlIHNhbWVcbiAgICAgICAgICAvLyBleGFjdCB0eXBlIHdpdGggdGhlIHNhbWUgZXhhY3Qga2V5LCBtZWFuaW5nIHRoYXQgdGhlIHZhbHVlIHR5cGUgbXVzdCBiZSBpZGVudGljYWwuXG4gICAgICAgICAgLy8gU28gd2UgdXNlIGBhbnlgIHRvIHdvcmsgYXJvdW5kIHRoaXMuXG4gICAgICAgICAgdGhpc1trZXldID0gY29uZmlnW2tleV0gYXMgYW55O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=