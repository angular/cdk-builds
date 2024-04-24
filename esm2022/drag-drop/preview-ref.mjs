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
        this._wrapper = this._createWrapper();
        this._preview = this._createPreview();
        this._wrapper.appendChild(this._preview);
        parent.appendChild(this._wrapper);
        // The null check is necessary for browsers that don't support the popover API.
        if (this._wrapper.showPopover) {
            this._wrapper.showPopover();
        }
    }
    destroy() {
        this._wrapper?.remove();
        this._previewEmbeddedView?.destroy();
        this._preview = this._wrapper = this._previewEmbeddedView = null;
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
    _createWrapper() {
        const wrapper = this._document.createElement('div');
        wrapper.setAttribute('popover', 'manual');
        wrapper.setAttribute('dir', this._direction);
        wrapper.classList.add('cdk-drag-preview-container');
        extendStyles(wrapper.style, {
            // This is redundant, but we need it for browsers that don't support the popover API.
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'z-index': this._zIndex + '',
            // Reset the user agent styles.
            'background': 'none',
            'border': 'none',
            'pointer-events': 'none',
            'margin': '0',
            'padding': '0',
        });
        toggleNativeDragInteractions(wrapper, false);
        return wrapper;
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
            'position': 'absolute',
            'top': '0',
            'left': '0',
        }, importantProperties);
        toggleNativeDragInteractions(preview, false);
        preview.classList.add('cdk-drag-preview');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2RyYWctZHJvcC9wcmV2aWV3LXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQ0wsWUFBWSxFQUNaLFlBQVksRUFDWixnQkFBZ0IsRUFDaEIsNEJBQTRCLEdBQzdCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtDQUFrQyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFVN0UsOERBQThEO0FBQzlELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDbEMsa0dBQWtHO0lBQ2xHLFVBQVU7Q0FDWCxDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sVUFBVTtJQVVyQixZQUNVLFNBQW1CLEVBQ25CLFlBQXlCLEVBQ3pCLFVBQXFCLEVBQ3JCLGVBQXdCLEVBQ3hCLGdCQUE0QyxFQUM1QyxhQUF1QyxFQUN2QyxxQkFHUCxFQUNPLGlCQUFnQyxFQUNoQyxPQUFlO1FBWGYsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixpQkFBWSxHQUFaLFlBQVksQ0FBYTtRQUN6QixlQUFVLEdBQVYsVUFBVSxDQUFXO1FBQ3JCLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1FBQ3hCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBNEI7UUFDNUMsa0JBQWEsR0FBYixhQUFhLENBQTBCO1FBQ3ZDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FHNUI7UUFDTyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWU7UUFDaEMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtJQUN0QixDQUFDO0lBRUosTUFBTSxDQUFDLE1BQW1CO1FBQ3hCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFB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LENBQUM7UUFFRCxZQUFZLENBQ1YsT0FBTyxDQUFDLEtBQUssRUFDYjtZQUNFLDRFQUE0RTtZQUM1RSwrRUFBK0U7WUFDL0UsZ0JBQWdCLEVBQUUsTUFBTTtZQUN4Qiw4RkFBOEY7WUFDOUYsUUFBUSxFQUFFLEdBQUc7WUFDYixVQUFVLEVBQUUsVUFBVTtZQUN0QixLQUFLLEVBQUUsR0FBRztZQUNWLE1BQU0sRUFBRSxHQUFHO1NBQ1osRUFDRCxtQkFBbUIsQ0FDcEIsQ0FBQztRQUVGLDRCQUE0QixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3QyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRTFDLElBQUksWUFBWSxFQUFFLENBQUM7WUFDakIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVGVtcGxhdGVSZWYsIFZpZXdDb250YWluZXJSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIGV4dGVuZFN0eWxlcyxcbiAgZ2V0VHJhbnNmb3JtLFxuICBtYXRjaEVsZW1lbnRTaXplLFxuICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zLFxufSBmcm9tICcuL2RvbS9zdHlsaW5nJztcbmltcG9ydCB7ZGVlcENsb25lTm9kZX0gZnJvbSAnLi9kb20vY2xvbmUtbm9kZSc7XG5pbXBvcnQge2dldFJvb3ROb2RlfSBmcm9tICcuL2RvbS9yb290LW5vZGUnO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1UcmFuc2l0aW9uRHVyYXRpb25Jbk1zfSBmcm9tICcuL2RvbS90cmFuc2l0aW9uLWR1cmF0aW9uJztcblxuLyoqIFRlbXBsYXRlIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgZHJhZyBwcmV2aWV3IGVsZW1lbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIERyYWdQcmV2aWV3VGVtcGxhdGU8VCA9IGFueT4ge1xuICBtYXRjaFNpemU/OiBib29sZWFuO1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8VD4gfCBudWxsO1xuICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmO1xuICBjb250ZXh0OiBUO1xufVxuXG4vKiogSW5saW5lIHN0eWxlcyB0byBiZSBzZXQgYXMgYCFpbXBvcnRhbnRgIHdoaWxlIGRyYWdnaW5nLiAqL1xuY29uc3QgaW1wb3J0YW50UHJvcGVydGllcyA9IG5ldyBTZXQoW1xuICAvLyBOZWVkcyB0byBiZSBpbXBvcnRhbnQsIGJlY2F1c2Ugc29tZSBgbWF0LXRhYmxlYCBzZXRzIGBwb3NpdGlvbjogc3RpY2t5ICFpbXBvcnRhbnRgLiBTZWUgIzIyNzgxLlxuICAncG9zaXRpb24nLFxuXSk7XG5cbmV4cG9ydCBjbGFzcyBQcmV2aWV3UmVmIHtcbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgdmlldyBvZiB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3RW1iZWRkZWRWaWV3OiBFbWJlZGRlZFZpZXdSZWY8YW55PiB8IG51bGw7XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgcHJldmlldyBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9wcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBwcmV2aWV3IHdyYXBwZXIuICovXG4gIHByaXZhdGUgX3dyYXBwZXI6IEhUTUxFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCxcbiAgICBwcml2YXRlIF9yb290RWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb24sXG4gICAgcHJpdmF0ZSBfaW5pdGlhbERvbVJlY3Q6IERPTVJlY3QsXG4gICAgcHJpdmF0ZSBfcHJldmlld1RlbXBsYXRlOiBEcmFnUHJldmlld1RlbXBsYXRlIHwgbnVsbCxcbiAgICBwcml2YXRlIF9wcmV2aWV3Q2xhc3M6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBwcml2YXRlIF9waWNrdXBQb3NpdGlvbk9uUGFnZToge1xuICAgICAgeDogbnVtYmVyO1xuICAgICAgeTogbnVtYmVyO1xuICAgIH0sXG4gICAgcHJpdmF0ZSBfaW5pdGlhbFRyYW5zZm9ybTogc3RyaW5nIHwgbnVsbCxcbiAgICBwcml2YXRlIF96SW5kZXg6IG51bWJlcixcbiAgKSB7fVxuXG4gIGF0dGFjaChwYXJlbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgdGhpcy5fd3JhcHBlciA9IHRoaXMuX2NyZWF0ZVdyYXBwZXIoKTtcbiAgICB0aGlzLl9wcmV2aWV3ID0gdGhpcy5fY3JlYXRlUHJldmlldygpO1xuICAgIHRoaXMuX3dyYXBwZXIuYXBwZW5kQ2hpbGQodGhpcy5fcHJldmlldyk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMuX3dyYXBwZXIpO1xuXG4gICAgLy8gVGhlIG51bGwgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIHBvcG92ZXIgQVBJLlxuICAgIGlmICh0aGlzLl93cmFwcGVyLnNob3dQb3BvdmVyKSB7XG4gICAgICB0aGlzLl93cmFwcGVyLnNob3dQb3BvdmVyKCk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl93cmFwcGVyPy5yZW1vdmUoKTtcbiAgICB0aGlzLl9wcmV2aWV3RW1iZWRkZWRWaWV3Py5kZXN0cm95KCk7XG4gICAgdGhpcy5fcHJldmlldyA9IHRoaXMuX3dyYXBwZXIgPSB0aGlzLl9wcmV2aWV3RW1iZWRkZWRWaWV3ID0gbnVsbCE7XG4gIH1cblxuICBzZXRUcmFuc2Zvcm0odmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3ByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gdmFsdWU7XG4gIH1cblxuICBnZXRCb3VuZGluZ0NsaWVudFJlY3QoKTogRE9NUmVjdCB7XG4gICAgcmV0dXJuIHRoaXMuX3ByZXZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH1cblxuICBhZGRDbGFzcyhjbGFzc05hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX3ByZXZpZXcuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICB9XG5cbiAgZ2V0VHJhbnNpdGlvbkR1cmF0aW9uKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIGdldFRyYW5zZm9ybVRyYW5zaXRpb25EdXJhdGlvbkluTXModGhpcy5fcHJldmlldyk7XG4gIH1cblxuICBhZGRFdmVudExpc3RlbmVyKG5hbWU6IHN0cmluZywgaGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCkge1xuICAgIHRoaXMuX3ByZXZpZXcuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKTtcbiAgfVxuXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZTogc3RyaW5nLCBoYW5kbGVyOiBFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0KSB7XG4gICAgdGhpcy5fcHJldmlldy5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGhhbmRsZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlV3JhcHBlcigpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3Qgd3JhcHBlciA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHdyYXBwZXIuc2V0QXR0cmlidXRlKCdwb3BvdmVyJywgJ21hbnVhbCcpO1xuICAgIHdyYXBwZXIuc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLl9kaXJlY3Rpb24pO1xuICAgIHdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldy1jb250YWluZXInKTtcblxuICAgIGV4dGVuZFN0eWxlcyh3cmFwcGVyLnN0eWxlLCB7XG4gICAgICAvLyBUaGlzIGlzIHJlZHVuZGFudCwgYnV0IHdlIG5lZWQgaXQgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0aGUgcG9wb3ZlciBBUEkuXG4gICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxuICAgICAgJ3RvcCc6ICcwJyxcbiAgICAgICdsZWZ0JzogJzAnLFxuICAgICAgJ3dpZHRoJzogJzEwMCUnLFxuICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcbiAgICAgICd6LWluZGV4JzogdGhpcy5fekluZGV4ICsgJycsXG5cbiAgICAgIC8vIFJlc2V0IHRoZSB1c2VyIGFnZW50IHN0eWxlcy5cbiAgICAgICdiYWNrZ3JvdW5kJzogJ25vbmUnLFxuICAgICAgJ2JvcmRlcic6ICdub25lJyxcbiAgICAgICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyxcbiAgICAgICdtYXJnaW4nOiAnMCcsXG4gICAgICAncGFkZGluZyc6ICcwJyxcbiAgICB9KTtcbiAgICB0b2dnbGVOYXRpdmVEcmFnSW50ZXJhY3Rpb25zKHdyYXBwZXIsIGZhbHNlKTtcblxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlUHJldmlldygpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgcHJldmlld0NvbmZpZyA9IHRoaXMuX3ByZXZpZXdUZW1wbGF0ZTtcbiAgICBjb25zdCBwcmV2aWV3Q2xhc3MgPSB0aGlzLl9wcmV2aWV3Q2xhc3M7XG4gICAgY29uc3QgcHJldmlld1RlbXBsYXRlID0gcHJldmlld0NvbmZpZyA/IHByZXZpZXdDb25maWcudGVtcGxhdGUgOiBudWxsO1xuICAgIGxldCBwcmV2aWV3OiBIVE1MRWxlbWVudDtcblxuICAgIGlmIChwcmV2aWV3VGVtcGxhdGUgJiYgcHJldmlld0NvbmZpZykge1xuICAgICAgLy8gTWVhc3VyZSB0aGUgZWxlbWVudCBiZWZvcmUgd2UndmUgaW5zZXJ0ZWQgdGhlIHByZXZpZXdcbiAgICAgIC8vIHNpbmNlIHRoZSBpbnNlcnRpb24gY291bGQgdGhyb3cgb2ZmIHRoZSBtZWFzdXJlbWVudC5cbiAgICAgIGNvbnN0IHJvb3RSZWN0ID0gcHJldmlld0NvbmZpZy5tYXRjaFNpemUgPyB0aGlzLl9pbml0aWFsRG9tUmVjdCA6IG51bGw7XG4gICAgICBjb25zdCB2aWV3UmVmID0gcHJldmlld0NvbmZpZy52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgcHJldmlld1RlbXBsYXRlLFxuICAgICAgICBwcmV2aWV3Q29uZmlnLmNvbnRleHQsXG4gICAgICApO1xuICAgICAgdmlld1JlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBwcmV2aWV3ID0gZ2V0Um9vdE5vZGUodmlld1JlZiwgdGhpcy5fZG9jdW1lbnQpO1xuICAgICAgdGhpcy5fcHJldmlld0VtYmVkZGVkVmlldyA9IHZpZXdSZWY7XG4gICAgICBpZiAocHJldmlld0NvbmZpZy5tYXRjaFNpemUpIHtcbiAgICAgICAgbWF0Y2hFbGVtZW50U2l6ZShwcmV2aWV3LCByb290UmVjdCEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5zdHlsZS50cmFuc2Zvcm0gPSBnZXRUcmFuc2Zvcm0oXG4gICAgICAgICAgdGhpcy5fcGlja3VwUG9zaXRpb25PblBhZ2UueCxcbiAgICAgICAgICB0aGlzLl9waWNrdXBQb3NpdGlvbk9uUGFnZS55LFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwcmV2aWV3ID0gZGVlcENsb25lTm9kZSh0aGlzLl9yb290RWxlbWVudCk7XG4gICAgICBtYXRjaEVsZW1lbnRTaXplKHByZXZpZXcsIHRoaXMuX2luaXRpYWxEb21SZWN0ISk7XG5cbiAgICAgIGlmICh0aGlzLl9pbml0aWFsVHJhbnNmb3JtKSB7XG4gICAgICAgIHByZXZpZXcuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5faW5pdGlhbFRyYW5zZm9ybTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBleHRlbmRTdHlsZXMoXG4gICAgICBwcmV2aWV3LnN0eWxlLFxuICAgICAge1xuICAgICAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHdlIGRpc2FibGUgdGhlIHBvaW50ZXIgZXZlbnRzIG9uIHRoZSBwcmV2aWV3LCBiZWNhdXNlXG4gICAgICAgIC8vIGl0IGNhbiB0aHJvdyBvZmYgdGhlIGBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50YCBjYWxscyBpbiB0aGUgYENka0Ryb3BMaXN0YC5cbiAgICAgICAgJ3BvaW50ZXItZXZlbnRzJzogJ25vbmUnLFxuICAgICAgICAvLyBXZSBoYXZlIHRvIHJlc2V0IHRoZSBtYXJnaW4sIGJlY2F1c2UgaXQgY2FuIHRocm93IG9mZiBwb3NpdGlvbmluZyByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQuXG4gICAgICAgICdtYXJnaW4nOiAnMCcsXG4gICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXG4gICAgICAgICd0b3AnOiAnMCcsXG4gICAgICAgICdsZWZ0JzogJzAnLFxuICAgICAgfSxcbiAgICAgIGltcG9ydGFudFByb3BlcnRpZXMsXG4gICAgKTtcblxuICAgIHRvZ2dsZU5hdGl2ZURyYWdJbnRlcmFjdGlvbnMocHJldmlldywgZmFsc2UpO1xuICAgIHByZXZpZXcuY2xhc3NMaXN0LmFkZCgnY2RrLWRyYWctcHJldmlldycpO1xuXG4gICAgaWYgKHByZXZpZXdDbGFzcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJldmlld0NsYXNzKSkge1xuICAgICAgICBwcmV2aWV3Q2xhc3MuZm9yRWFjaChjbGFzc05hbWUgPT4gcHJldmlldy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlldy5jbGFzc0xpc3QuYWRkKHByZXZpZXdDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZpZXc7XG4gIH1cbn1cbiJdfQ==