/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { _getEventTarget } from '@angular/cdk/platform';
import { getMutableClientRect, adjustDomRect } from './dom-rect';
/** Keeps track of the scroll position and dimensions of the parents of an element. */
export class ParentPositionTracker {
    constructor(_document) {
        this._document = _document;
        /** Cached positions of the scrollable parent elements. */
        this.positions = new Map();
    }
    /** Clears the cached positions. */
    clear() {
        this.positions.clear();
    }
    /** Caches the positions. Should be called at the beginning of a drag sequence. */
    cache(elements) {
        this.clear();
        this.positions.set(this._document, {
            scrollPosition: this.getViewportScrollPosition(),
        });
        elements.forEach(element => {
            this.positions.set(element, {
                scrollPosition: { top: element.scrollTop, left: element.scrollLeft },
                clientRect: getMutableClientRect(element),
            });
        });
    }
    /** Handles scrolling while a drag is taking place. */
    handleScroll(event) {
        const target = _getEventTarget(event);
        const cachedPosition = this.positions.get(target);
        if (!cachedPosition) {
            return null;
        }
        const scrollPosition = cachedPosition.scrollPosition;
        let newTop;
        let newLeft;
        if (target === this._document) {
            const viewportScrollPosition = this.getViewportScrollPosition();
            newTop = viewportScrollPosition.top;
            newLeft = viewportScrollPosition.left;
        }
        else {
            newTop = target.scrollTop;
            newLeft = target.scrollLeft;
        }
        const topDifference = scrollPosition.top - newTop;
        const leftDifference = scrollPosition.left - newLeft;
        // Go through and update the cached positions of the scroll
        // parents that are inside the element that was scrolled.
        this.positions.forEach((position, node) => {
            if (position.clientRect && target !== node && target.contains(node)) {
                adjustDomRect(position.clientRect, topDifference, leftDifference);
            }
        });
        scrollPosition.top = newTop;
        scrollPosition.left = newLeft;
        return { top: topDifference, left: leftDifference };
    }
    /**
     * Gets the scroll position of the viewport. Note that we use the scrollX and scrollY directly,
     * instead of going through the `ViewportRuler`, because the first value the ruler looks at is
     * the top/left offset of the `document.documentElement` which works for most cases, but breaks
     * if the element is offset by something like the `BlockScrollStrategy`.
     */
    getViewportScrollPosition() {
        return { top: window.scrollY, left: window.scrollX };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyZW50LXBvc2l0aW9uLXRyYWNrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kb20vcGFyZW50LXBvc2l0aW9uLXRyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxhQUFhLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFRL0Qsc0ZBQXNGO0FBQ3RGLE1BQU0sT0FBTyxxQkFBcUI7SUFVaEMsWUFBb0IsU0FBbUI7UUFBbkIsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQVR2QywwREFBMEQ7UUFDakQsY0FBUyxHQUFHLElBQUksR0FBRyxFQU16QixDQUFDO0lBRXNDLENBQUM7SUFFM0MsbUNBQW1DO0lBQ25DLEtBQUs7UUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxrRkFBa0Y7SUFDbEYsS0FBSyxDQUFDLFFBQWdDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDakMsY0FBYyxFQUFFLElBQUksQ0FBQyx5QkFBeUIsRUFBRTtTQUNqRCxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTtnQkFDMUIsY0FBYyxFQUFFLEVBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUM7Z0JBQ2xFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7YUFDMUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsc0RBQXNEO0lBQ3RELFlBQVksQ0FBQyxLQUFZO1FBQ3ZCLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBeUIsS0FBSyxDQUFFLENBQUM7UUFDL0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNuQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQztRQUNyRCxJQUFJLE1BQWMsQ0FBQztRQUNuQixJQUFJLE9BQWUsQ0FBQztRQUVwQixJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQzdCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDaEUsTUFBTSxHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQztZQUNwQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDO1NBQ3ZDO2FBQU07WUFDTCxNQUFNLEdBQUksTUFBc0IsQ0FBQyxTQUFTLENBQUM7WUFDM0MsT0FBTyxHQUFJLE1BQXNCLENBQUMsVUFBVSxDQUFDO1NBQzlDO1FBRUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFFckQsMkRBQTJEO1FBQzNELHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN4QyxJQUFJLFFBQVEsQ0FBQyxVQUFVLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNuRSxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDbkU7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGNBQWMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO1FBQzVCLGNBQWMsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1FBRTlCLE9BQU8sRUFBQyxHQUFHLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCx5QkFBeUI7UUFDdkIsT0FBTyxFQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFDLENBQUM7SUFDckQsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7X2dldEV2ZW50VGFyZ2V0fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtnZXRNdXRhYmxlQ2xpZW50UmVjdCwgYWRqdXN0RG9tUmVjdH0gZnJvbSAnLi9kb20tcmVjdCc7XG5cbi8qKiBPYmplY3QgaG9sZGluZyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHNvbWV0aGluZy4gKi9cbmludGVyZmFjZSBTY3JvbGxQb3NpdGlvbiB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG59XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgc2Nyb2xsIHBvc2l0aW9uIGFuZCBkaW1lbnNpb25zIG9mIHRoZSBwYXJlbnRzIG9mIGFuIGVsZW1lbnQuICovXG5leHBvcnQgY2xhc3MgUGFyZW50UG9zaXRpb25UcmFja2VyIHtcbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICByZWFkb25seSBwb3NpdGlvbnMgPSBuZXcgTWFwPFxuICAgIERvY3VtZW50IHwgSFRNTEVsZW1lbnQsXG4gICAge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IFNjcm9sbFBvc2l0aW9uO1xuICAgICAgY2xpZW50UmVjdD86IERPTVJlY3Q7XG4gICAgfVxuICA+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50KSB7fVxuXG4gIC8qKiBDbGVhcnMgdGhlIGNhY2hlZCBwb3NpdGlvbnMuICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMucG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBwb3NpdGlvbnMuIFNob3VsZCBiZSBjYWxsZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBhIGRyYWcgc2VxdWVuY2UuICovXG4gIGNhY2hlKGVsZW1lbnRzOiByZWFkb25seSBIVE1MRWxlbWVudFtdKSB7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucG9zaXRpb25zLnNldCh0aGlzLl9kb2N1bWVudCwge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IHRoaXMuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpLFxuICAgIH0pO1xuXG4gICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIHRoaXMucG9zaXRpb25zLnNldChlbGVtZW50LCB7XG4gICAgICAgIHNjcm9sbFBvc2l0aW9uOiB7dG9wOiBlbGVtZW50LnNjcm9sbFRvcCwgbGVmdDogZWxlbWVudC5zY3JvbGxMZWZ0fSxcbiAgICAgICAgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudCksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHNjcm9sbGluZyB3aGlsZSBhIGRyYWcgaXMgdGFraW5nIHBsYWNlLiAqL1xuICBoYW5kbGVTY3JvbGwoZXZlbnQ6IEV2ZW50KTogU2Nyb2xsUG9zaXRpb24gfCBudWxsIHtcbiAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQ8SFRNTEVsZW1lbnQgfCBEb2N1bWVudD4oZXZlbnQpITtcbiAgICBjb25zdCBjYWNoZWRQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25zLmdldCh0YXJnZXQpO1xuXG4gICAgaWYgKCFjYWNoZWRQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSBjYWNoZWRQb3NpdGlvbi5zY3JvbGxQb3NpdGlvbjtcbiAgICBsZXQgbmV3VG9wOiBudW1iZXI7XG4gICAgbGV0IG5ld0xlZnQ6IG51bWJlcjtcblxuICAgIGlmICh0YXJnZXQgPT09IHRoaXMuX2RvY3VtZW50KSB7XG4gICAgICBjb25zdCB2aWV3cG9ydFNjcm9sbFBvc2l0aW9uID0gdGhpcy5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCk7XG4gICAgICBuZXdUb3AgPSB2aWV3cG9ydFNjcm9sbFBvc2l0aW9uLnRvcDtcbiAgICAgIG5ld0xlZnQgPSB2aWV3cG9ydFNjcm9sbFBvc2l0aW9uLmxlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1RvcCA9ICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcDtcbiAgICAgIG5ld0xlZnQgPSAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5zY3JvbGxMZWZ0O1xuICAgIH1cblxuICAgIGNvbnN0IHRvcERpZmZlcmVuY2UgPSBzY3JvbGxQb3NpdGlvbi50b3AgLSBuZXdUb3A7XG4gICAgY29uc3QgbGVmdERpZmZlcmVuY2UgPSBzY3JvbGxQb3NpdGlvbi5sZWZ0IC0gbmV3TGVmdDtcblxuICAgIC8vIEdvIHRocm91Z2ggYW5kIHVwZGF0ZSB0aGUgY2FjaGVkIHBvc2l0aW9ucyBvZiB0aGUgc2Nyb2xsXG4gICAgLy8gcGFyZW50cyB0aGF0IGFyZSBpbnNpZGUgdGhlIGVsZW1lbnQgdGhhdCB3YXMgc2Nyb2xsZWQuXG4gICAgdGhpcy5wb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIG5vZGUpID0+IHtcbiAgICAgIGlmIChwb3NpdGlvbi5jbGllbnRSZWN0ICYmIHRhcmdldCAhPT0gbm9kZSAmJiB0YXJnZXQuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgYWRqdXN0RG9tUmVjdChwb3NpdGlvbi5jbGllbnRSZWN0LCB0b3BEaWZmZXJlbmNlLCBsZWZ0RGlmZmVyZW5jZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBzY3JvbGxQb3NpdGlvbi50b3AgPSBuZXdUb3A7XG4gICAgc2Nyb2xsUG9zaXRpb24ubGVmdCA9IG5ld0xlZnQ7XG5cbiAgICByZXR1cm4ge3RvcDogdG9wRGlmZmVyZW5jZSwgbGVmdDogbGVmdERpZmZlcmVuY2V9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgdmlld3BvcnQuIE5vdGUgdGhhdCB3ZSB1c2UgdGhlIHNjcm9sbFggYW5kIHNjcm9sbFkgZGlyZWN0bHksXG4gICAqIGluc3RlYWQgb2YgZ29pbmcgdGhyb3VnaCB0aGUgYFZpZXdwb3J0UnVsZXJgLCBiZWNhdXNlIHRoZSBmaXJzdCB2YWx1ZSB0aGUgcnVsZXIgbG9va3MgYXQgaXNcbiAgICogdGhlIHRvcC9sZWZ0IG9mZnNldCBvZiB0aGUgYGRvY3VtZW50LmRvY3VtZW50RWxlbWVudGAgd2hpY2ggd29ya3MgZm9yIG1vc3QgY2FzZXMsIGJ1dCBicmVha3NcbiAgICogaWYgdGhlIGVsZW1lbnQgaXMgb2Zmc2V0IGJ5IHNvbWV0aGluZyBsaWtlIHRoZSBgQmxvY2tTY3JvbGxTdHJhdGVneWAuXG4gICAqL1xuICBnZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCkge1xuICAgIHJldHVybiB7dG9wOiB3aW5kb3cuc2Nyb2xsWSwgbGVmdDogd2luZG93LnNjcm9sbFh9O1xuICB9XG59XG4iXX0=