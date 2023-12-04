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
                adjustClientRect(position.clientRect, topDifference, leftDifference);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyZW50LXBvc2l0aW9uLXRyYWNrZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9kb20vcGFyZW50LXBvc2l0aW9uLXRyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQVFyRSxzRkFBc0Y7QUFDdEYsTUFBTSxPQUFPLHFCQUFxQjtJQVVoQyxZQUFvQixTQUFtQjtRQUFuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBVHZDLDBEQUEwRDtRQUNqRCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBTXpCLENBQUM7SUFFc0MsQ0FBQztJQUUzQyxtQ0FBbUM7SUFDbkMsS0FBSztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELGtGQUFrRjtJQUNsRixLQUFLLENBQUMsUUFBZ0M7UUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNqQyxjQUFjLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1NBQ2pELENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFO2dCQUMxQixjQUFjLEVBQUUsRUFBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLFVBQVUsRUFBQztnQkFDbEUsVUFBVSxFQUFFLG9CQUFvQixDQUFDLE9BQU8sQ0FBQzthQUMxQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxzREFBc0Q7SUFDdEQsWUFBWSxDQUFDLEtBQVk7UUFDdkIsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUF5QixLQUFLLENBQUUsQ0FBQztRQUMvRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVsRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQztRQUNyRCxJQUFJLE1BQWMsQ0FBQztRQUNuQixJQUFJLE9BQWUsQ0FBQztRQUVwQixJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDOUIsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUNoRSxNQUFNLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxDQUFDO1lBQ3BDLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7UUFDeEMsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLEdBQUksTUFBc0IsQ0FBQyxTQUFTLENBQUM7WUFDM0MsT0FBTyxHQUFJLE1BQXNCLENBQUMsVUFBVSxDQUFDO1FBQy9DLENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQztRQUNsRCxNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUVyRCwyREFBMkQ7UUFDM0QseURBQXlEO1FBQ3pELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3hDLElBQUksUUFBUSxDQUFDLFVBQVUsSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDcEUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDdkUsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsY0FBYyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUM7UUFDNUIsY0FBYyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFFOUIsT0FBTyxFQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILHlCQUF5QjtRQUN2QixPQUFPLEVBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUMsQ0FBQztJQUNyRCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtfZ2V0RXZlbnRUYXJnZXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2dldE11dGFibGVDbGllbnRSZWN0LCBhZGp1c3RDbGllbnRSZWN0fSBmcm9tICcuL2NsaWVudC1yZWN0JztcblxuLyoqIE9iamVjdCBob2xkaW5nIHRoZSBzY3JvbGwgcG9zaXRpb24gb2Ygc29tZXRoaW5nLiAqL1xuaW50ZXJmYWNlIFNjcm9sbFBvc2l0aW9uIHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbn1cblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBzY3JvbGwgcG9zaXRpb24gYW5kIGRpbWVuc2lvbnMgb2YgdGhlIHBhcmVudHMgb2YgYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBjbGFzcyBQYXJlbnRQb3NpdGlvblRyYWNrZXIge1xuICAvKiogQ2FjaGVkIHBvc2l0aW9ucyBvZiB0aGUgc2Nyb2xsYWJsZSBwYXJlbnQgZWxlbWVudHMuICovXG4gIHJlYWRvbmx5IHBvc2l0aW9ucyA9IG5ldyBNYXA8XG4gICAgRG9jdW1lbnQgfCBIVE1MRWxlbWVudCxcbiAgICB7XG4gICAgICBzY3JvbGxQb3NpdGlvbjogU2Nyb2xsUG9zaXRpb247XG4gICAgICBjbGllbnRSZWN0PzogQ2xpZW50UmVjdDtcbiAgICB9XG4gID4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQpIHt9XG5cbiAgLyoqIENsZWFycyB0aGUgY2FjaGVkIHBvc2l0aW9ucy4gKi9cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5wb3NpdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBDYWNoZXMgdGhlIHBvc2l0aW9ucy4gU2hvdWxkIGJlIGNhbGxlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgZHJhZyBzZXF1ZW5jZS4gKi9cbiAgY2FjaGUoZWxlbWVudHM6IHJlYWRvbmx5IEhUTUxFbGVtZW50W10pIHtcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wb3NpdGlvbnMuc2V0KHRoaXMuX2RvY3VtZW50LCB7XG4gICAgICBzY3JvbGxQb3NpdGlvbjogdGhpcy5nZXRWaWV3cG9ydFNjcm9sbFBvc2l0aW9uKCksXG4gICAgfSk7XG5cbiAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgdGhpcy5wb3NpdGlvbnMuc2V0KGVsZW1lbnQsIHtcbiAgICAgICAgc2Nyb2xsUG9zaXRpb246IHt0b3A6IGVsZW1lbnQuc2Nyb2xsVG9wLCBsZWZ0OiBlbGVtZW50LnNjcm9sbExlZnR9LFxuICAgICAgICBjbGllbnRSZWN0OiBnZXRNdXRhYmxlQ2xpZW50UmVjdChlbGVtZW50KSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEhhbmRsZXMgc2Nyb2xsaW5nIHdoaWxlIGEgZHJhZyBpcyB0YWtpbmcgcGxhY2UuICovXG4gIGhhbmRsZVNjcm9sbChldmVudDogRXZlbnQpOiBTY3JvbGxQb3NpdGlvbiB8IG51bGwge1xuICAgIGNvbnN0IHRhcmdldCA9IF9nZXRFdmVudFRhcmdldDxIVE1MRWxlbWVudCB8IERvY3VtZW50PihldmVudCkhO1xuICAgIGNvbnN0IGNhY2hlZFBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbnMuZ2V0KHRhcmdldCk7XG5cbiAgICBpZiAoIWNhY2hlZFBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBzY3JvbGxQb3NpdGlvbiA9IGNhY2hlZFBvc2l0aW9uLnNjcm9sbFBvc2l0aW9uO1xuICAgIGxldCBuZXdUb3A6IG51bWJlcjtcbiAgICBsZXQgbmV3TGVmdDogbnVtYmVyO1xuXG4gICAgaWYgKHRhcmdldCA9PT0gdGhpcy5fZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IHZpZXdwb3J0U2Nyb2xsUG9zaXRpb24gPSB0aGlzLmdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICAgIG5ld1RvcCA9IHZpZXdwb3J0U2Nyb2xsUG9zaXRpb24udG9wO1xuICAgICAgbmV3TGVmdCA9IHZpZXdwb3J0U2Nyb2xsUG9zaXRpb24ubGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3VG9wID0gKHRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wO1xuICAgICAgbmV3TGVmdCA9ICh0YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbExlZnQ7XG4gICAgfVxuXG4gICAgY29uc3QgdG9wRGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLnRvcCAtIG5ld1RvcDtcbiAgICBjb25zdCBsZWZ0RGlmZmVyZW5jZSA9IHNjcm9sbFBvc2l0aW9uLmxlZnQgLSBuZXdMZWZ0O1xuXG4gICAgLy8gR28gdGhyb3VnaCBhbmQgdXBkYXRlIHRoZSBjYWNoZWQgcG9zaXRpb25zIG9mIHRoZSBzY3JvbGxcbiAgICAvLyBwYXJlbnRzIHRoYXQgYXJlIGluc2lkZSB0aGUgZWxlbWVudCB0aGF0IHdhcyBzY3JvbGxlZC5cbiAgICB0aGlzLnBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgbm9kZSkgPT4ge1xuICAgICAgaWYgKHBvc2l0aW9uLmNsaWVudFJlY3QgJiYgdGFyZ2V0ICE9PSBub2RlICYmIHRhcmdldC5jb250YWlucyhub2RlKSkge1xuICAgICAgICBhZGp1c3RDbGllbnRSZWN0KHBvc2l0aW9uLmNsaWVudFJlY3QsIHRvcERpZmZlcmVuY2UsIGxlZnREaWZmZXJlbmNlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNjcm9sbFBvc2l0aW9uLnRvcCA9IG5ld1RvcDtcbiAgICBzY3JvbGxQb3NpdGlvbi5sZWZ0ID0gbmV3TGVmdDtcblxuICAgIHJldHVybiB7dG9wOiB0b3BEaWZmZXJlbmNlLCBsZWZ0OiBsZWZ0RGlmZmVyZW5jZX07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSB2aWV3cG9ydC4gTm90ZSB0aGF0IHdlIHVzZSB0aGUgc2Nyb2xsWCBhbmQgc2Nyb2xsWSBkaXJlY3RseSxcbiAgICogaW5zdGVhZCBvZiBnb2luZyB0aHJvdWdoIHRoZSBgVmlld3BvcnRSdWxlcmAsIGJlY2F1c2UgdGhlIGZpcnN0IHZhbHVlIHRoZSBydWxlciBsb29rcyBhdCBpc1xuICAgKiB0aGUgdG9wL2xlZnQgb2Zmc2V0IG9mIHRoZSBgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50YCB3aGljaCB3b3JrcyBmb3IgbW9zdCBjYXNlcywgYnV0IGJyZWFrc1xuICAgKiBpZiB0aGUgZWxlbWVudCBpcyBvZmZzZXQgYnkgc29tZXRoaW5nIGxpa2UgdGhlIGBCbG9ja1Njcm9sbFN0cmF0ZWd5YC5cbiAgICovXG4gIGdldFZpZXdwb3J0U2Nyb2xsUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHt0b3A6IHdpbmRvdy5zY3JvbGxZLCBsZWZ0OiB3aW5kb3cuc2Nyb2xsWH07XG4gIH1cbn1cbiJdfQ==