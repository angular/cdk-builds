/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { extendStyles, getTransform, matchElementSize, toggleNativeDragInteractions, } from './dom/styling';
import { deepCloneNode } from './dom/clone-node';
import { getRootNode } from './dom/root-node';
import { getTransformTransitionDurationInMs } from './dom/transition-duration';
/** Inline styles to be set as `!important` while dragging. */
const importantProperties = new Set([
    // Needs to be important, because some `mat-table` sets `position: sticky !important`. See #22781.
    'position',
]);
export class PreviewRef {
    get element() {
        return this._preview;
    }
    constructor(_document, _rootElement, _direction, _initialDomRect, _previewTemplate, _previewClass, _pickupPositionOnPage, _initialTransform, _zIndex) {
        this._document = _document;
        this._rootElement = _rootElement;
        this._direction = _direction;
        this._initialDomRect = _initialDomRect;
        this._previewTemplate = _previewTemplate;
        this._previewClass = _previewClass;
        this._pickupPositionOnPage = _pickupPositionOnPage;
        this._initialTransform = _initialTransform;
        this._zIndex = _zIndex;
    }
    attach(parent) {
        this._preview = this._createPreview();
        parent.appendChild(this._preview);
        // The null check is necessary for browsers that don't support the popover API.
        // Note that we use a string access for compatibility with Closure.
        if ('showPopover' in this._preview) {
            this._preview['showPopover']();
        }
    }
    destroy() {
        this._preview.remove();
        this._previewEmbeddedView?.destroy();
        this._preview = this._previewEmbeddedView = null;
    }
    setTransform(value) {
        this._preview.style.transform = value;
    }
    getBoundingClientRect() {
        return this._preview.getBoundingClientRect();
    }
    addClass(className) {
        this._preview.classList.add(className);
    }
    getTransitionDuration() {
        return getTransformTransitionDurationInMs(this._preview);
    }
    addEventListener(name, handler) {
        this._preview.addEventListener(name, handler);
    }
    removeEventListener(name, handler) {
        this._preview.removeEventListener(name, handler);
    }
    _createPreview() {
        const previewConfig = this._previewTemplate;
        const previewClass = this._previewClass;
        const previewTemplate = previewConfig ? previewConfig.template : null;
        let preview;
        if (previewTemplate && previewConfig) {
            // Measure the element before we've inserted the preview
            // since the insertion could throw off the measurement.
            const rootRect = previewConfig.matchSize ? this._initialDomRect : null;
            const viewRef = previewConfig.viewContainer.createEmbeddedView(previewTemplate, previewConfig.context);
            viewRef.detectChanges();
            preview = getRootNode(viewRef, this._document);
            this._previewEmbeddedView = viewRef;
            if (previewConfig.matchSize) {
                matchElementSize(preview, rootRect);
            }
            else {
                preview.style.transform = getTransform(this._pickupPositionOnPage.x, this._pickupPositionOnPage.y);
            }
        }
        else {
            preview = deepCloneNode(this._rootElement);
            matchElementSize(preview, this._initialDomRect);
            if (this._initialTransform) {
                preview.style.transform = this._initialTransform;
            }
        }
        extendStyles(preview.style, {
            // It's important that we disable the pointer events on the preview, because
            // it can throw off the `document.elementFromPoint` calls in the `CdkDropList`.
            'pointer-events': 'none',
            // We have to reset the margin, because it can throw off positioning relative to the viewport.
            'margin': '0',
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'z-index': this._zIndex + '',
        }, importantProperties);
        toggleNativeDragInteractions(preview, false);
        preview.classList.add('cdk-drag-preview');
        preview.setAttribute('popover', 'manual');
        preview.setAttribute('dir', this._direction);
        if (previewClass) {
            if (Array.isArray(previewClass)) {
                previewClass.forEach(className => preview.classList.add(className));
            }
            else {
                preview.classList.add(previewClass);
            }
        }
        return preview;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9wcmV2aWV3LXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQ0wsWUFBWSxFQUNaLFlBQVksRUFDWixnQkFBZ0IsRUFDaEIsNEJBQTRCLEdBQzdCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtDQUFrQyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFVN0UsOERBQThEO0FBQzlELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDbEMsa0dBQWtHO0lBQ2xHLFVBQVU7Q0FDWCxDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sVUFBVTtJQU9yQixJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkIsQ0FBQztJQUVELFlBQ1UsU0FBbUIsRUFDbkIsWUFBeUIsRUFDekIsVUFBcUIsRUFDckIsZUFBd0IsRUFDeEIsZ0JBQTRDLEVBQzVDLGFBQXVDLEVBQ3ZDLHFCQUdQLEVBQ08saUJBQWdDLEVBQ2hDLE9BQWU7UUFYZixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLGlCQUFZLEdBQVosWUFBWSxDQUFhO1FBQ3pCLGVBQVUsR0FBVixVQUFVLENBQVc7UUFDckIsb0JBQWUsR0FBZixlQUFlLENBQVM7UUFDeEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUE0QjtRQUM1QyxrQkFBYSxHQUFiLGFBQWEsQ0FBMEI7UUFDdkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUc1QjtRQUNPLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBZTtRQUNoQyxZQUFPLEdBQVAsT0FBTyxDQUFRO0lBQ3RC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QUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVGVtcGxhdGVSZWYsIFZpZXdDb250YWluZXJSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIGV4dGVuZFN0eWxlcyxcbiAgZ2V0VHJhbnNmb3JtLFxuICBtYXRjaEVsZW1lbnRTaXplLFxuICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zLFxufSBmcm9tICcuL2RvbS9zdHlsaW5nJztcbmltcG9ydCB7ZGVlcENsb25lTm9kZX0gZnJvbSAnLi9kb20vY2xvbmUtbm9kZSc7XG5pbXBvcnQge2dldFJvb3ROb2RlfSBmcm9tICcuL2RvbS9yb290LW5vZGUnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL2RvbS90cmFuc2l0aW9uLWR1cmF0aW9uJztcblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBwcmV2aWV3IGVsZW1lbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdQcmV2aWV3VGVtcGxhdGU8VCA9IGFueT4ge1xuICBtYXRjaFNpemU/OiBib29sZWFuO1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8VD4gfCBudWxsO1xuICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmO1xuICBjb250ZXh0OiBUO1xufVxuXG4vKiogSW5saW5lIHN0eWxlcyB0byBiZSBzZXQgYXMgYCFpbXBvcnRhbnRgIHdoaWxlIGRyYWdnaW5nLiAqL1xuY29uc3QgaW1wb3J0YW50UHJvcGVydGllcyA9IG5ldyBTZXQoW1xuICAvLyBOZWVkcyB0byBiZSBpbXBvcnRhbnQsIGJlY2F1c2Ugc29tZSBgbWF0LXRhYmxlYCBzZXRzIGBwb3NpdGlvbjogc3RpY2t5ICFpbXBvcnRhbnRgLiBTZWUgIzIyNzgxLlxuICAncG9zaXRpb24nLFxuXSk7XG5cbmV4cG9ydCBjbGFzcyBQcmV2aWV3UmVmIHtcbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3RW1iZWRkZWRWaWV3OiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICBnZXQgZWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZXZpZXc7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfcm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2RpcmVjdGlvbjogRGlyZWN0aW9uLFxuICAgIHByaXZhdGUgX2luaXRpYWxEb21SZWN0OiBET01SZWN0LFxuICAgIHByaXZhdGUgX3ByZXZpZXdUZW1wbGF0ZTogRHJhZ1ByZXZpZXdUZW1wbGF0ZSB8IG51bGwsXG4gICAgcHJpdmF0ZSBfcHJldmlld0NsYXNzOiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bGwsXG4gICAgcHJpdmF0ZSBfcGlja3VwUG9zaXRpb25PblBhZ2U6IHtcbiAgICAgIHg6IG51bWJlcjtcbiAgICAgIHk6IG51bWJlcjtcbiAgICB9LFxuICAgIHByaXZhdGUgX2luaXRpYWxUcmFuc2Zvcm06IHN0cmluZyB8IG51bGwsXG4gICAgcHJpdmF0ZSBfekluZGV4OiBudW1iZXIsXG4gICkge31cblxuICBhdHRhY2gocGFyZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMuX3ByZXZpZXcgPSB0aGlzLl9jcmVhdGVQcmV2aWV3KCk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMuX3ByZXZpZXcpO1xuXG4gICAgLy8gVGhlIG51bGwgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIHBvcG92ZXIgQVBJLlxuICAgIC8vIE5vdGUgdGhhdCB3ZSB1c2UgYSBzdHJpbmcgYWNjZXNzIGZvciBjb21wYXRpYmlsaXR5IHdpdGggQ2xvc3VyZS5cbiAgICBpZiAoJ3Nob3dQb3BvdmVyJyBpbiB0aGlzLl9wcmV2aWV3KSB7XG4gICAgICB0aGlzLl9wcmV2aWV3WydzaG93UG9wb3ZlciddKCk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl9wcmV2aWV3LnJlbW92ZSgpO1xuICAgIHRoaXMuX3ByZXZpZXdFbWJlZGRlZFZpZXc/LmRlc3Ryb3koKTtcbiAgICB0aGlzLl9wcmV2aWV3ID0gdGhpcy5fcHJldmlld0VtYmVkZGVkVmlldyA9IG51bGwhO1xuICB9XG5cbiAgc2V0VHJhbnNmb3JtKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9wcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk6IERPTVJlY3Qge1xuICAgIHJldHVybiB0aGlzLl9wcmV2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgYWRkQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9wcmV2aWV3LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgfVxuXG4gIGdldFRyYW5zaXRpb25EdXJhdGlvbigpOiBudW1iZXIge1xuICAgIHJldHVybiBnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zKHRoaXMuX3ByZXZpZXcpO1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcihuYW1lOiBzdHJpbmcsIGhhbmRsZXI6IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3QpIHtcbiAgICB0aGlzLl9wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgaGFuZGxlcik7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVyKG5hbWU6IHN0cmluZywgaGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCkge1xuICAgIHRoaXMuX3ByZXZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVByZXZpZXcoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IHByZXZpZXdDb25maWcgPSB0aGlzLl9wcmV2aWV3VGVtcGxhdGU7XG4gICAgY29uc3QgcHJldmlld0NsYXNzID0gdGhpcy5fcHJldmlld0NsYXNzO1xuICAgIGNvbnN0IHByZXZpZXdUZW1wbGF0ZSA9IHByZXZpZXdDb25maWcgPyBwcmV2aWV3Q29uZmlnLnRlbXBsYXRlIDogbnVsbDtcbiAgICBsZXQgcHJldmlldzogSFRNTEVsZW1lbnQ7XG5cbiAgICBpZiAocHJldmlld1RlbXBsYXRlICYmIHByZXZpZXdDb25maWcpIHtcbiAgICAgIC8vIE1lYXN1cmUgdGhlIGVsZW1lbnQgYmVmb3JlIHdlJ3ZlIGluc2VydGVkIHRoZSBwcmV2aWV3XG4gICAgICAvLyBzaW5jZSB0aGUgaW5zZXJ0aW9uIGNvdWxkIHRocm93IG9mZiB0aGUgbWVhc3VyZW1lbnQuXG4gICAgICBjb25zdCByb290UmVjdCA9IHByZXZpZXdDb25maWcubWF0Y2hTaXplID8gdGhpcy5faW5pdGlhbERvbVJlY3QgOiBudWxsO1xuICAgICAgY29uc3Qgdmlld1JlZiA9IHByZXZpZXdDb25maWcudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgIHByZXZpZXdUZW1wbGF0ZSxcbiAgICAgICAgcHJldmlld0NvbmZpZy5jb250ZXh0LFxuICAgICAgKTtcbiAgICAgIHZpZXdSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcHJldmlldyA9IGdldFJvb3ROb2RlKHZpZXdSZWYsIHRoaXMuX2RvY3VtZW50KTtcbiAgICAgIHRoaXMuX3ByZXZpZXdFbWJlZGRlZFZpZXcgPSB2aWV3UmVmO1xuICAgICAgaWYgKHByZXZpZXdDb25maWcubWF0Y2hTaXplKSB7XG4gICAgICAgIG1hdGNoRWxlbWVudFNpemUocHJldmlldywgcm9vdFJlY3QhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gZ2V0VHJhbnNmb3JtKFxuICAgICAgICAgIHRoaXMuX3BpY2t1cFBvc2l0aW9uT25QYWdlLngsXG4gICAgICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlldyA9IGRlZXBDbG9uZU5vZGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuICAgICAgbWF0Y2hFbGVtZW50U2l6ZShwcmV2aWV3LCB0aGlzLl9pbml0aWFsRG9tUmVjdCEpO1xuXG4gICAgICBpZiAodGhpcy5faW5pdGlhbFRyYW5zZm9ybSkge1xuICAgICAgICBwcmV2aWV3LnN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuX2luaXRpYWxUcmFuc2Zvcm07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXh0ZW5kU3R5bGVzKFxuICAgICAgcHJldmlldy5zdHlsZSxcbiAgICAgIHtcbiAgICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkaXNhYmxlIHRoZSBwb2ludGVyIGV2ZW50cyBvbiB0aGUgcHJldmlldywgYmVjYXVzZVxuICAgICAgICAvLyBpdCBjYW4gdGhyb3cgb2ZmIHRoZSBgZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludGAgY2FsbHMgaW4gdGhlIGBDZGtEcm9wTGlzdGAuXG4gICAgICAgICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyxcbiAgICAgICAgLy8gV2UgaGF2ZSB0byByZXNldCB0aGUgbWFyZ2luLCBiZWNhdXNlIGl0IGNhbiB0aHJvdyBvZmYgcG9zaXRpb25pbmcgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0LlxuICAgICAgICAnbWFyZ2luJzogJzAnLFxuICAgICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxuICAgICAgICAndG9wJzogJzAnLFxuICAgICAgICAnbGVmdCc6ICcwJyxcbiAgICAgICAgJ3otaW5kZXgnOiB0aGlzLl96SW5kZXggKyAnJyxcbiAgICAgIH0sXG4gICAgICBpbXBvcnRhbnRQcm9wZXJ0aWVzLFxuICAgICk7XG5cbiAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKHByZXZpZXcsIGZhbHNlKTtcbiAgICBwcmV2aWV3LmNsYXNzTGlzdC5hZGQoJ2Nkay1kcmFnLXByZXZpZXcnKTtcbiAgICBwcmV2aWV3LnNldEF0dHJpYnV0ZSgncG9wb3ZlcicsICdtYW51YWwnKTtcbiAgICBwcmV2aWV3LnNldEF0dHJpYnV0ZSgnZGlyJywgdGhpcy5fZGlyZWN0aW9uKTtcblxuICAgIGlmIChwcmV2aWV3Q2xhc3MpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHByZXZpZXdDbGFzcykpIHtcbiAgICAgICAgcHJldmlld0NsYXNzLmZvckVhY2goY2xhc3NOYW1lID0+IHByZXZpZXcuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZChwcmV2aWV3Q2xhc3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwcmV2aWV3O1xuICB9XG59XG4iXX0=