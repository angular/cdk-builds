/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { _getEventTarget } from '@angular/cdk/platform';
import { getMutableClientRect, adjustClientRect } from './client-rect';
/** Keeps track of the scroll position and dimensions of the parents of an element. */
export class ParentPositionTracker {
    constructor(_document, _viewportRuler) {
        this._document = _document;
        this._viewportRuler = _viewportRuler;
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
            scrollPosition: this._viewportRuler.getViewportScrollPosition(),
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
            const viewportScrollPosition = this._viewportRuler.getViewportScrollPosition();
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
                adjustClientRect(position.clientRect, topDifference, leftDifference);
            }
        });
        scrollPosition.top = newTop;
        scrollPosition.left = newLeft;
        return { top: topDifference, left: leftDifference };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyZW50LXBvc2l0aW9uLXRyYWNrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9wYXJlbnQtcG9zaXRpb24tdHJhY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBUXJFLHNGQUFzRjtBQUN0RixNQUFNLE9BQU8scUJBQXFCO0lBVWhDLFlBQW9CLFNBQW1CLEVBQVUsY0FBNkI7UUFBMUQsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUFVLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBVDlFLDBEQUEwRDtRQUNqRCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBTXpCLENBQUM7SUFFNkUsQ0FBQztJQUVsRixtQ0FBbUM7SUFDbkMsS0FBSztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELGtGQUFrRjtJQUNsRixLQUFLLENBQUMsUUFBZ0M7UUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNqQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRTtTQUNoRSxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTtnQkFDMUIsY0FBYyxFQUFFLEVBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUM7Z0JBQ2xFLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7YUFDMUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsc0RBQXNEO0lBQ3RELFlBQVksQ0FBQyxLQUFZO1FBQ3ZCLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBeUIsS0FBSyxDQUFFLENBQUM7UUFDL0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNuQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQztRQUNyRCxJQUFJLE1BQWMsQ0FBQztRQUNuQixJQUFJLE9BQWUsQ0FBQztRQUVwQixJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQzdCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLGNBQWUsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQ2hGLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxHQUFHLENBQUM7WUFDcEMsT0FBTyxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQztTQUN2QzthQUFNO1lBQ0wsTUFBTSxHQUFJLE1BQXNCLENBQUMsU0FBUyxDQUFDO1lBQzNDLE9BQU8sR0FBSSxNQUFzQixDQUFDLFVBQVUsQ0FBQztTQUM5QztRQUVELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO1FBQ2xELE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1FBRXJELDJEQUEyRDtRQUMzRCx5REFBeUQ7UUFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDeEMsSUFBSSxRQUFRLENBQUMsVUFBVSxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDdEU7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGNBQWMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDO1FBQzVCLGNBQWMsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1FBRTlCLE9BQU8sRUFBQyxHQUFHLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7X2dldEV2ZW50VGFyZ2V0fSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtnZXRNdXRhYmxlQ2xpZW50UmVjdCwgYWRqdXN0Q2xpZW50UmVjdH0gZnJvbSAnLi9jbGllbnQtcmVjdCc7XG5cbi8qKiBPYmplY3QgaG9sZGluZyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHNvbWV0aGluZy4gKi9cbmludGVyZmFjZSBTY3JvbGxQb3NpdGlvbiB7XG4gIHRvcDogbnVtYmVyO1xuICBsZWZ0OiBudW1iZXI7XG59XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgc2Nyb2xsIHBvc2l0aW9uIGFuZCBkaW1lbnNpb25zIG9mIHRoZSBwYXJlbnRzIG9mIGFuIGVsZW1lbnQuICovXG5leHBvcnQgY2xhc3MgUGFyZW50UG9zaXRpb25UcmFja2VyIHtcbiAgLyoqIENhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbGFibGUgcGFyZW50IGVsZW1lbnRzLiAqL1xuICByZWFkb25seSBwb3NpdGlvbnMgPSBuZXcgTWFwPFxuICAgIERvY3VtZW50IHwgSFRNTEVsZW1lbnQsXG4gICAge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IFNjcm9sbFBvc2l0aW9uO1xuICAgICAgY2xpZW50UmVjdD86IENsaWVudFJlY3Q7XG4gICAgfVxuICA+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LCBwcml2YXRlIF92aWV3cG9ydFJ1bGVyOiBWaWV3cG9ydFJ1bGVyKSB7fVxuXG4gIC8qKiBDbGVhcnMgdGhlIGNhY2hlZCBwb3NpdGlvbnMuICovXG4gIGNsZWFyKCkge1xuICAgIHRoaXMucG9zaXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKiogQ2FjaGVzIHRoZSBwb3NpdGlvbnMuIFNob3VsZCBiZSBjYWxsZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBhIGRyYWcgc2VxdWVuY2UuICovXG4gIGNhY2hlKGVsZW1lbnRzOiByZWFkb25seSBIVE1MRWxlbWVudFtdKSB7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucG9zaXRpb25zLnNldCh0aGlzLl9kb2N1bWVudCwge1xuICAgICAgc2Nyb2xsUG9zaXRpb246IHRoaXMuX3ZpZXdwb3J0UnVsZXIuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpLFxuICAgIH0pO1xuXG4gICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIHRoaXMucG9zaXRpb25zLnNldChlbGVtZW50LCB7XG4gICAgICAgIHNjcm9sbFBvc2l0aW9uOiB7dG9wOiBlbGVtZW50LnNjcm9sbFRvcCwgbGVmdDogZWxlbWVudC5zY3JvbGxMZWZ0fSxcbiAgICAgICAgY2xpZW50UmVjdDogZ2V0TXV0YWJsZUNsaWVudFJlY3QoZWxlbWVudCksXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHNjcm9sbGluZyB3aGlsZSBhIGRyYWcgaXMgdGFraW5nIHBsYWNlLiAqL1xuICBoYW5kbGVTY3JvbGwoZXZlbnQ6IEV2ZW50KTogU2Nyb2xsUG9zaXRpb24gfCBudWxsIHtcbiAgICBjb25zdCB0YXJnZXQgPSBfZ2V0RXZlbnRUYXJnZXQ8SFRNTEVsZW1lbnQgfCBEb2N1bWVudD4oZXZlbnQpITtcbiAgICBjb25zdCBjYWNoZWRQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25zLmdldCh0YXJnZXQpO1xuXG4gICAgaWYgKCFjYWNoZWRQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSBjYWNoZWRQb3NpdGlvbi5zY3JvbGxQb3NpdGlvbjtcbiAgICBsZXQgbmV3VG9wOiBudW1iZXI7XG4gICAgbGV0IG5ld0xlZnQ6IG51bWJlcjtcblxuICAgIGlmICh0YXJnZXQgPT09IHRoaXMuX2RvY3VtZW50KSB7XG4gICAgICBjb25zdCB2aWV3cG9ydFNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlciEuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgbmV3VG9wID0gdmlld3BvcnRTY3JvbGxQb3NpdGlvbi50b3A7XG4gICAgICBuZXdMZWZ0ID0gdmlld3BvcnRTY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdUb3AgPSAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5zY3JvbGxUb3A7XG4gICAgICBuZXdMZWZ0ID0gKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsTGVmdDtcbiAgICB9XG5cbiAgICBjb25zdCB0b3BEaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24udG9wIC0gbmV3VG9wO1xuICAgIGNvbnN0IGxlZnREaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIG5ld0xlZnQ7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGFuZCB1cGRhdGUgdGhlIGNhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbFxuICAgIC8vIHBhcmVudHMgdGhhdCBhcmUgaW5zaWRlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHNjcm9sbGVkLlxuICAgIHRoaXMucG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBub2RlKSA9PiB7XG4gICAgICBpZiAocG9zaXRpb24uY2xpZW50UmVjdCAmJiB0YXJnZXQgIT09IG5vZGUgJiYgdGFyZ2V0LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2Nyb2xsUG9zaXRpb24udG9wID0gbmV3VG9wO1xuICAgIHNjcm9sbFBvc2l0aW9uLmxlZnQgPSBuZXdMZWZ0O1xuXG4gICAgcmV0dXJuIHt0b3A6IHRvcERpZmZlcmVuY2UsIGxlZnQ6IGxlZnREaWZmZXJlbmNlfTtcbiAgfVxufVxuIl19