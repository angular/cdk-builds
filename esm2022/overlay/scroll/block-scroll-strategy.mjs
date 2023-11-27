/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceCssPixelValue } from '@angular/cdk/coercion';
import { supportsScrollBehavior } from '@angular/cdk/platform';
const scrollBehaviorSupported = supportsScrollBehavior();
/**
 * Strategy that will prevent the user from scrolling while the overlay is visible.
 */
export class BlockScrollStrategy {
    constructor(_viewportRuler, document) {
        this._viewportRuler = _viewportRuler;
        this._previousHTMLStyles = { top: '', left: '' };
        this._isEnabled = false;
        this._document = document;
    }
    /** Attaches this scroll strategy to an overlay. */
    attach() { }
    /** Blocks page-level scroll while the attached overlay is open. */
    enable() {
        if (this._canBeEnabled()) {
            const root = this._document.documentElement;
            this._previousScrollPosition = this._viewportRuler.getViewportScrollPosition();
            // Cache the previous inline styles in case the user had set them.
            this._previousHTMLStyles.left = root.style.left || '';
            this._previousHTMLStyles.top = root.style.top || '';
            // Note: we're using the `html` node, instead of the `body`, because the `body` may
            // have the user agent margin, whereas the `html` is guaranteed not to have one.
            root.style.left = coerceCssPixelValue(-this._previousScrollPosition.left);
            root.style.top = coerceCssPixelValue(-this._previousScrollPosition.top);
            root.classList.add('cdk-global-scrollblock');
            this._isEnabled = true;
        }
    }
    /** Unblocks page-level scroll while the attached overlay is open. */
    disable() {
        if (this._isEnabled) {
            const html = this._document.documentElement;
            const body = this._document.body;
            const htmlStyle = html.style;
            const bodyStyle = body.style;
            const previousHtmlScrollBehavior = htmlStyle.scrollBehavior || '';
            const previousBodyScrollBehavior = bodyStyle.scrollBehavior || '';
            this._isEnabled = false;
            htmlStyle.left = this._previousHTMLStyles.left;
            htmlStyle.top = this._previousHTMLStyles.top;
            html.classList.remove('cdk-global-scrollblock');
            // Disable user-defined smooth scrolling temporarily while we restore the scroll position.
            // See https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
            // Note that we don't mutate the property if the browser doesn't support `scroll-behavior`,
            // because it can throw off feature detections in `supportsScrollBehavior` which
            // checks for `'scrollBehavior' in documentElement.style`.
            if (scrollBehaviorSupported) {
                htmlStyle.scrollBehavior = bodyStyle.scrollBehavior = 'auto';
            }
            window.scroll(this._previousScrollPosition.left, this._previousScrollPosition.top);
            if (scrollBehaviorSupported) {
                htmlStyle.scrollBehavior = previousHtmlScrollBehavior;
                bodyStyle.scrollBehavior = previousBodyScrollBehavior;
            }
        }
    }
    _canBeEnabled() {
        // Since the scroll strategies can't be singletons, we have to use a global CSS class
        // (`cdk-global-scrollblock`) to make sure that we don't try to disable global
        // scrolling multiple times.
        const html = this._document.documentElement;
        if (html.classList.contains('cdk-global-scrollblock') || this._isEnabled) {
            return false;
        }
        const body = this._document.body;
        const viewport = this._viewportRuler.getViewportSize();
        return body.scrollHeight > viewport.height || body.scrollWidth > viewport.width;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2stc2Nyb2xsLXN0cmF0ZWd5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9vdmVybGF5L3Njcm9sbC9ibG9jay1zY3JvbGwtc3RyYXRlZ3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFN0QsTUFBTSx1QkFBdUIsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO0FBRXpEOztHQUVHO0FBQ0gsTUFBTSxPQUFPLG1CQUFtQjtJQU05QixZQUNVLGNBQTZCLEVBQ3JDLFFBQWE7UUFETCxtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQU4vQix3QkFBbUIsR0FBRyxFQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQyxDQUFDO1FBRTFDLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFPekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDNUIsQ0FBQztJQUVELG1EQUFtRDtJQUNuRCxNQUFNLEtBQUksQ0FBQztJQUVYLG1FQUFtRTtJQUNuRSxNQUFNO1FBQ0osSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUU7WUFDeEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFnQixDQUFDO1lBRTdDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFFL0Usa0VBQWtFO1lBQ2xFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3RELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDO1lBRXBELG1GQUFtRjtZQUNuRixnRkFBZ0Y7WUFDaEYsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztTQUN4QjtJQUNILENBQUM7SUFFRCxxRUFBcUU7SUFDckUsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWdCLENBQUM7WUFDN0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFLLENBQUM7WUFDbEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM3QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzdCLE1BQU0sMEJBQTBCLEdBQUcsU0FBUyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7WUFDbEUsTUFBTSwwQkFBMEIsR0FBRyxTQUFTLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztZQUVsRSxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUV4QixTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7WUFDL0MsU0FBUyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFFaEQsMEZBQTBGO1lBQzFGLHVFQUF1RTtZQUN2RSwyRkFBMkY7WUFDM0YsZ0ZBQWdGO1lBQ2hGLDBEQUEwRDtZQUMxRCxJQUFJLHVCQUF1QixFQUFFO2dCQUMzQixTQUFTLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDO2FBQzlEO1lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVuRixJQUFJLHVCQUF1QixFQUFFO2dCQUMzQixTQUFTLENBQUMsY0FBYyxHQUFHLDBCQUEwQixDQUFDO2dCQUN0RCxTQUFTLENBQUMsY0FBYyxHQUFHLDBCQUEwQixDQUFDO2FBQ3ZEO1NBQ0Y7SUFDSCxDQUFDO0lBRU8sYUFBYTtRQUNuQixxRkFBcUY7UUFDckYsOEVBQThFO1FBQzlFLDRCQUE0QjtRQUM1QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWdCLENBQUM7UUFFN0MsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDeEUsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ2pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkQsT0FBTyxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQ2xGLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3Njcm9sbC1zdHJhdGVneSc7XG5pbXBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuaW1wb3J0IHtjb2VyY2VDc3NQaXhlbFZhbHVlfSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtzdXBwb3J0c1Njcm9sbEJlaGF2aW9yfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG5jb25zdCBzY3JvbGxCZWhhdmlvclN1cHBvcnRlZCA9IHN1cHBvcnRzU2Nyb2xsQmVoYXZpb3IoKTtcblxuLyoqXG4gKiBTdHJhdGVneSB0aGF0IHdpbGwgcHJldmVudCB0aGUgdXNlciBmcm9tIHNjcm9sbGluZyB3aGlsZSB0aGUgb3ZlcmxheSBpcyB2aXNpYmxlLlxuICovXG5leHBvcnQgY2xhc3MgQmxvY2tTY3JvbGxTdHJhdGVneSBpbXBsZW1lbnRzIFNjcm9sbFN0cmF0ZWd5IHtcbiAgcHJpdmF0ZSBfcHJldmlvdXNIVE1MU3R5bGVzID0ge3RvcDogJycsIGxlZnQ6ICcnfTtcbiAgcHJpdmF0ZSBfcHJldmlvdXNTY3JvbGxQb3NpdGlvbjoge3RvcDogbnVtYmVyOyBsZWZ0OiBudW1iZXJ9O1xuICBwcml2YXRlIF9pc0VuYWJsZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX3ZpZXdwb3J0UnVsZXI6IFZpZXdwb3J0UnVsZXIsXG4gICAgZG9jdW1lbnQ6IGFueSxcbiAgKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyB0aGlzIHNjcm9sbCBzdHJhdGVneSB0byBhbiBvdmVybGF5LiAqL1xuICBhdHRhY2goKSB7fVxuXG4gIC8qKiBCbG9ja3MgcGFnZS1sZXZlbCBzY3JvbGwgd2hpbGUgdGhlIGF0dGFjaGVkIG92ZXJsYXkgaXMgb3Blbi4gKi9cbiAgZW5hYmxlKCkge1xuICAgIGlmICh0aGlzLl9jYW5CZUVuYWJsZWQoKSkge1xuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCE7XG5cbiAgICAgIHRoaXMuX3ByZXZpb3VzU2Nyb2xsUG9zaXRpb24gPSB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcblxuICAgICAgLy8gQ2FjaGUgdGhlIHByZXZpb3VzIGlubGluZSBzdHlsZXMgaW4gY2FzZSB0aGUgdXNlciBoYWQgc2V0IHRoZW0uXG4gICAgICB0aGlzLl9wcmV2aW91c0hUTUxTdHlsZXMubGVmdCA9IHJvb3Quc3R5bGUubGVmdCB8fCAnJztcbiAgICAgIHRoaXMuX3ByZXZpb3VzSFRNTFN0eWxlcy50b3AgPSByb290LnN0eWxlLnRvcCB8fCAnJztcblxuICAgICAgLy8gTm90ZTogd2UncmUgdXNpbmcgdGhlIGBodG1sYCBub2RlLCBpbnN0ZWFkIG9mIHRoZSBgYm9keWAsIGJlY2F1c2UgdGhlIGBib2R5YCBtYXlcbiAgICAgIC8vIGhhdmUgdGhlIHVzZXIgYWdlbnQgbWFyZ2luLCB3aGVyZWFzIHRoZSBgaHRtbGAgaXMgZ3VhcmFudGVlZCBub3QgdG8gaGF2ZSBvbmUuXG4gICAgICByb290LnN0eWxlLmxlZnQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKC10aGlzLl9wcmV2aW91c1Njcm9sbFBvc2l0aW9uLmxlZnQpO1xuICAgICAgcm9vdC5zdHlsZS50b3AgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKC10aGlzLl9wcmV2aW91c1Njcm9sbFBvc2l0aW9uLnRvcCk7XG4gICAgICByb290LmNsYXNzTGlzdC5hZGQoJ2Nkay1nbG9iYWwtc2Nyb2xsYmxvY2snKTtcbiAgICAgIHRoaXMuX2lzRW5hYmxlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVuYmxvY2tzIHBhZ2UtbGV2ZWwgc2Nyb2xsIHdoaWxlIHRoZSBhdHRhY2hlZCBvdmVybGF5IGlzIG9wZW4uICovXG4gIGRpc2FibGUoKSB7XG4gICAgaWYgKHRoaXMuX2lzRW5hYmxlZCkge1xuICAgICAgY29uc3QgaHRtbCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCE7XG4gICAgICBjb25zdCBib2R5ID0gdGhpcy5fZG9jdW1lbnQuYm9keSE7XG4gICAgICBjb25zdCBodG1sU3R5bGUgPSBodG1sLnN0eWxlO1xuICAgICAgY29uc3QgYm9keVN0eWxlID0gYm9keS5zdHlsZTtcbiAgICAgIGNvbnN0IHByZXZpb3VzSHRtbFNjcm9sbEJlaGF2aW9yID0gaHRtbFN0eWxlLnNjcm9sbEJlaGF2aW9yIHx8ICcnO1xuICAgICAgY29uc3QgcHJldmlvdXNCb2R5U2Nyb2xsQmVoYXZpb3IgPSBib2R5U3R5bGUuc2Nyb2xsQmVoYXZpb3IgfHwgJyc7XG5cbiAgICAgIHRoaXMuX2lzRW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICBodG1sU3R5bGUubGVmdCA9IHRoaXMuX3ByZXZpb3VzSFRNTFN0eWxlcy5sZWZ0O1xuICAgICAgaHRtbFN0eWxlLnRvcCA9IHRoaXMuX3ByZXZpb3VzSFRNTFN0eWxlcy50b3A7XG4gICAgICBodG1sLmNsYXNzTGlzdC5yZW1vdmUoJ2Nkay1nbG9iYWwtc2Nyb2xsYmxvY2snKTtcblxuICAgICAgLy8gRGlzYWJsZSB1c2VyLWRlZmluZWQgc21vb3RoIHNjcm9sbGluZyB0ZW1wb3JhcmlseSB3aGlsZSB3ZSByZXN0b3JlIHRoZSBzY3JvbGwgcG9zaXRpb24uXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3Njcm9sbC1iZWhhdmlvclxuICAgICAgLy8gTm90ZSB0aGF0IHdlIGRvbid0IG11dGF0ZSB0aGUgcHJvcGVydHkgaWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IGBzY3JvbGwtYmVoYXZpb3JgLFxuICAgICAgLy8gYmVjYXVzZSBpdCBjYW4gdGhyb3cgb2ZmIGZlYXR1cmUgZGV0ZWN0aW9ucyBpbiBgc3VwcG9ydHNTY3JvbGxCZWhhdmlvcmAgd2hpY2hcbiAgICAgIC8vIGNoZWNrcyBmb3IgYCdzY3JvbGxCZWhhdmlvcicgaW4gZG9jdW1lbnRFbGVtZW50LnN0eWxlYC5cbiAgICAgIGlmIChzY3JvbGxCZWhhdmlvclN1cHBvcnRlZCkge1xuICAgICAgICBodG1sU3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBib2R5U3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSAnYXV0byc7XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5zY3JvbGwodGhpcy5fcHJldmlvdXNTY3JvbGxQb3NpdGlvbi5sZWZ0LCB0aGlzLl9wcmV2aW91c1Njcm9sbFBvc2l0aW9uLnRvcCk7XG5cbiAgICAgIGlmIChzY3JvbGxCZWhhdmlvclN1cHBvcnRlZCkge1xuICAgICAgICBodG1sU3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBwcmV2aW91c0h0bWxTY3JvbGxCZWhhdmlvcjtcbiAgICAgICAgYm9keVN0eWxlLnNjcm9sbEJlaGF2aW9yID0gcHJldmlvdXNCb2R5U2Nyb2xsQmVoYXZpb3I7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2FuQmVFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIC8vIFNpbmNlIHRoZSBzY3JvbGwgc3RyYXRlZ2llcyBjYW4ndCBiZSBzaW5nbGV0b25zLCB3ZSBoYXZlIHRvIHVzZSBhIGdsb2JhbCBDU1MgY2xhc3NcbiAgICAvLyAoYGNkay1nbG9iYWwtc2Nyb2xsYmxvY2tgKSB0byBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCB0cnkgdG8gZGlzYWJsZSBnbG9iYWxcbiAgICAvLyBzY3JvbGxpbmcgbXVsdGlwbGUgdGltZXMuXG4gICAgY29uc3QgaHRtbCA9IHRoaXMuX2RvY3VtZW50LmRvY3VtZW50RWxlbWVudCE7XG5cbiAgICBpZiAoaHRtbC5jbGFzc0xpc3QuY29udGFpbnMoJ2Nkay1nbG9iYWwtc2Nyb2xsYmxvY2snKSB8fCB0aGlzLl9pc0VuYWJsZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gdGhpcy5fZG9jdW1lbnQuYm9keTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTaXplKCk7XG4gICAgcmV0dXJuIGJvZHkuc2Nyb2xsSGVpZ2h0ID4gdmlld3BvcnQuaGVpZ2h0IHx8IGJvZHkuc2Nyb2xsV2lkdGggPiB2aWV3cG9ydC53aWR0aDtcbiAgfVxufVxuIl19