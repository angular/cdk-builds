/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
                clientRect: getMutableClientRect(element)
            });
        });
    }
    /** Handles scrolling while a drag is taking place. */
    handleScroll(event) {
        const target = getEventTarget(event);
        const cachedPosition = this.positions.get(target);
        if (!cachedPosition) {
            return null;
        }
        // Used when figuring out whether an element is inside the scroll parent. If the scrolled
        // parent is the `document`, we use the `documentElement`, because IE doesn't support
        // `contains` on the `document`.
        const scrolledParentNode = target === this._document ? target.documentElement : target;
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
            if (position.clientRect && target !== node && scrolledParentNode.contains(node)) {
                adjustClientRect(position.clientRect, topDifference, leftDifference);
            }
        });
        scrollPosition.top = newTop;
        scrollPosition.left = newLeft;
        return { top: topDifference, left: leftDifference };
    }
}
/** Gets the target of an event while accounting for shadow dom. */
export function getEventTarget(event) {
    return (event.composedPath ? event.composedPath()[0] : event.target);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyZW50LXBvc2l0aW9uLXRyYWNrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9wYXJlbnQtcG9zaXRpb24tdHJhY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFRckUsc0ZBQXNGO0FBQ3RGLE1BQU0sT0FBTyxxQkFBcUI7SUFPaEMsWUFBb0IsU0FBbUIsRUFBVSxjQUE2QjtRQUExRCxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQVUsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFOOUUsMERBQTBEO1FBQ2pELGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFHeEIsQ0FBQztJQUU0RSxDQUFDO0lBRWxGLG1DQUFtQztJQUNuQyxLQUFLO1FBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRUQsa0ZBQWtGO0lBQ2xGLEtBQUssQ0FBQyxRQUFnQztRQUNwQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2pDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLHlCQUF5QixFQUFFO1NBQ2hFLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFO2dCQUMxQixjQUFjLEVBQUUsRUFBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLFVBQVUsRUFBQztnQkFDbEUsVUFBVSxFQUFFLG9CQUFvQixDQUFDLE9BQU8sQ0FBQzthQUMxQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxzREFBc0Q7SUFDdEQsWUFBWSxDQUFDLEtBQVk7UUFDdkIsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDbkIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELHlGQUF5RjtRQUN6RixxRkFBcUY7UUFDckYsZ0NBQWdDO1FBQ2hDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN2RixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFDO1FBQ3JELElBQUksTUFBYyxDQUFDO1FBQ25CLElBQUksT0FBZSxDQUFDO1FBRXBCLElBQUksTUFBTSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDN0IsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsY0FBZSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDaEYsTUFBTSxHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQztZQUNwQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDO1NBQ3ZDO2FBQU07WUFDTCxNQUFNLEdBQUksTUFBc0IsQ0FBQyxTQUFTLENBQUM7WUFDM0MsT0FBTyxHQUFJLE1BQXNCLENBQUMsVUFBVSxDQUFDO1NBQzlDO1FBRUQsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFFckQsMkRBQTJEO1FBQzNELHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN4QyxJQUFJLFFBQVEsQ0FBQyxVQUFVLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9FLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQ3RFO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxjQUFjLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQztRQUM1QixjQUFjLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUU5QixPQUFPLEVBQUMsR0FBRyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBRUQsbUVBQW1FO0FBQ25FLE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWTtJQUN6QyxPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUEyQixDQUFDO0FBQ2pHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtWaWV3cG9ydFJ1bGVyfSBmcm9tICdAYW5ndWxhci9jZGsvc2Nyb2xsaW5nJztcbmltcG9ydCB7Z2V0TXV0YWJsZUNsaWVudFJlY3QsIGFkanVzdENsaWVudFJlY3R9IGZyb20gJy4vY2xpZW50LXJlY3QnO1xuXG4vKiogT2JqZWN0IGhvbGRpbmcgdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiBzb21ldGhpbmcuICovXG5pbnRlcmZhY2UgU2Nyb2xsUG9zaXRpb24ge1xuICB0b3A6IG51bWJlcjtcbiAgbGVmdDogbnVtYmVyO1xufVxuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIHNjcm9sbCBwb3NpdGlvbiBhbmQgZGltZW5zaW9ucyBvZiB0aGUgcGFyZW50cyBvZiBhbiBlbGVtZW50LiAqL1xuZXhwb3J0IGNsYXNzIFBhcmVudFBvc2l0aW9uVHJhY2tlciB7XG4gIC8qKiBDYWNoZWQgcG9zaXRpb25zIG9mIHRoZSBzY3JvbGxhYmxlIHBhcmVudCBlbGVtZW50cy4gKi9cbiAgcmVhZG9ubHkgcG9zaXRpb25zID0gbmV3IE1hcDxEb2N1bWVudHxIVE1MRWxlbWVudCwge1xuICAgIHNjcm9sbFBvc2l0aW9uOiBTY3JvbGxQb3NpdGlvbixcbiAgICBjbGllbnRSZWN0PzogQ2xpZW50UmVjdFxuICB9PigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCwgcHJpdmF0ZSBfdmlld3BvcnRSdWxlcjogVmlld3BvcnRSdWxlcikge31cblxuICAvKiogQ2xlYXJzIHRoZSBjYWNoZWQgcG9zaXRpb25zLiAqL1xuICBjbGVhcigpIHtcbiAgICB0aGlzLnBvc2l0aW9ucy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIENhY2hlcyB0aGUgcG9zaXRpb25zLiBTaG91bGQgYmUgY2FsbGVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgYSBkcmFnIHNlcXVlbmNlLiAqL1xuICBjYWNoZShlbGVtZW50czogcmVhZG9ubHkgSFRNTEVsZW1lbnRbXSkge1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBvc2l0aW9ucy5zZXQodGhpcy5fZG9jdW1lbnQsIHtcbiAgICAgIHNjcm9sbFBvc2l0aW9uOiB0aGlzLl92aWV3cG9ydFJ1bGVyLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSxcbiAgICB9KTtcblxuICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICB0aGlzLnBvc2l0aW9ucy5zZXQoZWxlbWVudCwge1xuICAgICAgICBzY3JvbGxQb3NpdGlvbjoge3RvcDogZWxlbWVudC5zY3JvbGxUb3AsIGxlZnQ6IGVsZW1lbnQuc2Nyb2xsTGVmdH0sXG4gICAgICAgIGNsaWVudFJlY3Q6IGdldE11dGFibGVDbGllbnRSZWN0KGVsZW1lbnQpXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBIYW5kbGVzIHNjcm9sbGluZyB3aGlsZSBhIGRyYWcgaXMgdGFraW5nIHBsYWNlLiAqL1xuICBoYW5kbGVTY3JvbGwoZXZlbnQ6IEV2ZW50KTogU2Nyb2xsUG9zaXRpb24gfCBudWxsIHtcbiAgICBjb25zdCB0YXJnZXQgPSBnZXRFdmVudFRhcmdldChldmVudCk7XG4gICAgY29uc3QgY2FjaGVkUG9zaXRpb24gPSB0aGlzLnBvc2l0aW9ucy5nZXQodGFyZ2V0KTtcblxuICAgIGlmICghY2FjaGVkUG9zaXRpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFVzZWQgd2hlbiBmaWd1cmluZyBvdXQgd2hldGhlciBhbiBlbGVtZW50IGlzIGluc2lkZSB0aGUgc2Nyb2xsIHBhcmVudC4gSWYgdGhlIHNjcm9sbGVkXG4gICAgLy8gcGFyZW50IGlzIHRoZSBgZG9jdW1lbnRgLCB3ZSB1c2UgdGhlIGBkb2N1bWVudEVsZW1lbnRgLCBiZWNhdXNlIElFIGRvZXNuJ3Qgc3VwcG9ydFxuICAgIC8vIGBjb250YWluc2Agb24gdGhlIGBkb2N1bWVudGAuXG4gICAgY29uc3Qgc2Nyb2xsZWRQYXJlbnROb2RlID0gdGFyZ2V0ID09PSB0aGlzLl9kb2N1bWVudCA/IHRhcmdldC5kb2N1bWVudEVsZW1lbnQgOiB0YXJnZXQ7XG4gICAgY29uc3Qgc2Nyb2xsUG9zaXRpb24gPSBjYWNoZWRQb3NpdGlvbi5zY3JvbGxQb3NpdGlvbjtcbiAgICBsZXQgbmV3VG9wOiBudW1iZXI7XG4gICAgbGV0IG5ld0xlZnQ6IG51bWJlcjtcblxuICAgIGlmICh0YXJnZXQgPT09IHRoaXMuX2RvY3VtZW50KSB7XG4gICAgICBjb25zdCB2aWV3cG9ydFNjcm9sbFBvc2l0aW9uID0gdGhpcy5fdmlld3BvcnRSdWxlciEuZ2V0Vmlld3BvcnRTY3JvbGxQb3NpdGlvbigpO1xuICAgICAgbmV3VG9wID0gdmlld3BvcnRTY3JvbGxQb3NpdGlvbi50b3A7XG4gICAgICBuZXdMZWZ0ID0gdmlld3BvcnRTY3JvbGxQb3NpdGlvbi5sZWZ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdUb3AgPSAodGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5zY3JvbGxUb3A7XG4gICAgICBuZXdMZWZ0ID0gKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsTGVmdDtcbiAgICB9XG5cbiAgICBjb25zdCB0b3BEaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24udG9wIC0gbmV3VG9wO1xuICAgIGNvbnN0IGxlZnREaWZmZXJlbmNlID0gc2Nyb2xsUG9zaXRpb24ubGVmdCAtIG5ld0xlZnQ7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGFuZCB1cGRhdGUgdGhlIGNhY2hlZCBwb3NpdGlvbnMgb2YgdGhlIHNjcm9sbFxuICAgIC8vIHBhcmVudHMgdGhhdCBhcmUgaW5zaWRlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHNjcm9sbGVkLlxuICAgIHRoaXMucG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBub2RlKSA9PiB7XG4gICAgICBpZiAocG9zaXRpb24uY2xpZW50UmVjdCAmJiB0YXJnZXQgIT09IG5vZGUgJiYgc2Nyb2xsZWRQYXJlbnROb2RlLmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgIGFkanVzdENsaWVudFJlY3QocG9zaXRpb24uY2xpZW50UmVjdCwgdG9wRGlmZmVyZW5jZSwgbGVmdERpZmZlcmVuY2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2Nyb2xsUG9zaXRpb24udG9wID0gbmV3VG9wO1xuICAgIHNjcm9sbFBvc2l0aW9uLmxlZnQgPSBuZXdMZWZ0O1xuXG4gICAgcmV0dXJuIHt0b3A6IHRvcERpZmZlcmVuY2UsIGxlZnQ6IGxlZnREaWZmZXJlbmNlfTtcbiAgfVxufVxuXG4vKiogR2V0cyB0aGUgdGFyZ2V0IG9mIGFuIGV2ZW50IHdoaWxlIGFjY291bnRpbmcgZm9yIHNoYWRvdyBkb20uICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRUYXJnZXQoZXZlbnQ6IEV2ZW50KTogSFRNTEVsZW1lbnQgfCBEb2N1bWVudCB7XG4gIHJldHVybiAoZXZlbnQuY29tcG9zZWRQYXRoID8gZXZlbnQuY29tcG9zZWRQYXRoKClbMF0gOiBldmVudC50YXJnZXQpIGFzIEhUTUxFbGVtZW50IHwgRG9jdW1lbnQ7XG59XG4iXX0=