/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { getRtlScrollAxisType, RtlScrollAxisType, supportsScrollBehavior, } from '@angular/cdk/platform';
import { Directive, ElementRef, NgZone, Optional } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
import * as i0 from "@angular/core";
import * as i1 from "./scroll-dispatcher";
import * as i2 from "@angular/cdk/bidi";
/**
 * Sends an event when the directive's element is scrolled. Registers itself with the
 * ScrollDispatcher service to include itself as part of its collection of scrolling events that it
 * can be listened to through the service.
 */
export class CdkScrollable {
    constructor(elementRef, scrollDispatcher, ngZone, dir) {
        this.elementRef = elementRef;
        this.scrollDispatcher = scrollDispatcher;
        this.ngZone = ngZone;
        this.dir = dir;
        this._destroyed = new Subject();
        this._elementScrolled = new Observable((observer) => this.ngZone.runOutsideAngular(() => fromEvent(this.elementRef.nativeElement, 'scroll')
            .pipe(takeUntil(this._destroyed))
            .subscribe(observer)));
    }
    ngOnInit() {
        this.scrollDispatcher.register(this);
    }
    ngOnDestroy() {
        this.scrollDispatcher.deregister(this);
        this._destroyed.next();
        this._destroyed.complete();
    }
    /** Returns observable that emits when a scroll event is fired on the host element. */
    elementScrolled() {
        return this._elementScrolled;
    }
    /** Gets the ElementRef for the viewport. */
    getElementRef() {
        return this.elementRef;
    }
    /**
     * Scrolls to the specified offsets. This is a normalized version of the browser's native scrollTo
     * method, since browsers are not consistent about what scrollLeft means in RTL. For this method
     * left and right always refer to the left and right side of the scrolling container irrespective
     * of the layout direction. start and end refer to left and right in an LTR context and vice-versa
     * in an RTL context.
     * @param options specified the offsets to scroll to.
     */
    scrollTo(options) {
        const el = this.elementRef.nativeElement;
        const isRtl = this.dir && this.dir.value == 'rtl';
        // Rewrite start & end offsets as right or left offsets.
        if (options.left == null) {
            options.left = isRtl ? options.end : options.start;
        }
        if (options.right == null) {
            options.right = isRtl ? options.start : options.end;
        }
        // Rewrite the bottom offset as a top offset.
        if (options.bottom != null) {
            options.top =
                el.scrollHeight - el.clientHeight - options.bottom;
        }
        // Rewrite the right offset as a left offset.
        if (isRtl && getRtlScrollAxisType() != RtlScrollAxisType.NORMAL) {
            if (options.left != null) {
                options.right =
                    el.scrollWidth - el.clientWidth - options.left;
            }
            if (getRtlScrollAxisType() == RtlScrollAxisType.INVERTED) {
                options.left = options.right;
            }
            else if (getRtlScrollAxisType() == RtlScrollAxisType.NEGATED) {
                options.left = options.right ? -options.right : options.right;
            }
        }
        else {
            if (options.right != null) {
                options.left =
                    el.scrollWidth - el.clientWidth - options.right;
            }
        }
        this._applyScrollToOptions(options);
    }
    _applyScrollToOptions(options) {
        const el = this.elementRef.nativeElement;
        if (supportsScrollBehavior()) {
            el.scrollTo(options);
        }
        else {
            if (options.top != null) {
                el.scrollTop = options.top;
            }
            if (options.left != null) {
                el.scrollLeft = options.left;
            }
        }
    }
    /**
     * Measures the scroll offset relative to the specified edge of the viewport. This method can be
     * used instead of directly checking scrollLeft or scrollTop, since browsers are not consistent
     * about what scrollLeft means in RTL. The values returned by this method are normalized such that
     * left and right always refer to the left and right side of the scrolling container irrespective
     * of the layout direction. start and end refer to left and right in an LTR context and vice-versa
     * in an RTL context.
     * @param from The edge to measure from.
     */
    measureScrollOffset(from) {
        const LEFT = 'left';
        const RIGHT = 'right';
        const el = this.elementRef.nativeElement;
        if (from == 'top') {
            return el.scrollTop;
        }
        if (from == 'bottom') {
            return el.scrollHeight - el.clientHeight - el.scrollTop;
        }
        // Rewrite start & end as left or right offsets.
        const isRtl = this.dir && this.dir.value == 'rtl';
        if (from == 'start') {
            from = isRtl ? RIGHT : LEFT;
        }
        else if (from == 'end') {
            from = isRtl ? LEFT : RIGHT;
        }
        if (isRtl && getRtlScrollAxisType() == RtlScrollAxisType.INVERTED) {
            // For INVERTED, scrollLeft is (scrollWidth - clientWidth) when scrolled all the way left and
            // 0 when scrolled all the way right.
            if (from == LEFT) {
                return el.scrollWidth - el.clientWidth - el.scrollLeft;
            }
            else {
                return el.scrollLeft;
            }
        }
        else if (isRtl && getRtlScrollAxisType() == RtlScrollAxisType.NEGATED) {
            // For NEGATED, scrollLeft is -(scrollWidth - clientWidth) when scrolled all the way left and
            // 0 when scrolled all the way right.
            if (from == LEFT) {
                return el.scrollLeft + el.scrollWidth - el.clientWidth;
            }
            else {
                return -el.scrollLeft;
            }
        }
        else {
            // For NORMAL, as well as non-RTL contexts, scrollLeft is 0 when scrolled all the way left and
            // (scrollWidth - clientWidth) when scrolled all the way right.
            if (from == LEFT) {
                return el.scrollLeft;
            }
            else {
                return el.scrollWidth - el.clientWidth - el.scrollLeft;
            }
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkScrollable, deps: [{ token: i0.ElementRef }, { token: i1.ScrollDispatcher }, { token: i0.NgZone }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.0.4", type: CdkScrollable, isStandalone: true, selector: "[cdk-scrollable], [cdkScrollable]", ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkScrollable, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdk-scrollable], [cdkScrollable]',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i1.ScrollDispatcher }, { type: i0.NgZone }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsaUJBQWlCLEVBQ2pCLHNCQUFzQixHQUN2QixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBcUIsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUM5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7Ozs7QUFxQnJEOzs7O0dBSUc7QUFLSCxNQUFNLE9BQU8sYUFBYTtJQVd4QixZQUNZLFVBQW1DLEVBQ25DLGdCQUFrQyxFQUNsQyxNQUFjLEVBQ0YsR0FBb0I7UUFIaEMsZUFBVSxHQUFWLFVBQVUsQ0FBeUI7UUFDbkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ0YsUUFBRyxHQUFILEdBQUcsQ0FBaUI7UUFkekIsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFFMUMscUJBQWdCLEdBQXNCLElBQUksVUFBVSxDQUFDLENBQUMsUUFBeUIsRUFBRSxFQUFFLENBQzNGLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQ2pDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUM7YUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDaEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUN2QixDQUNGLENBQUM7SUFPQyxDQUFDO0lBRUosUUFBUTtRQUNOLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQsc0ZBQXNGO0lBQ3RGLGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBRUQsNENBQTRDO0lBQzVDLGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxRQUFRLENBQUMsT0FBZ0M7UUFDdkMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7UUFDekMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUM7UUFFbEQsd0RBQXdEO1FBQ3hELElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDeEIsT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDcEQ7UUFFRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ3pCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1NBQ3JEO1FBRUQsNkNBQTZDO1FBQzdDLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7WUFDekIsT0FBb0MsQ0FBQyxHQUFHO2dCQUN2QyxFQUFFLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztTQUN0RDtRQUVELDZDQUE2QztRQUM3QyxJQUFJLEtBQUssSUFBSSxvQkFBb0IsRUFBRSxJQUFJLGlCQUFpQixDQUFDLE1BQU0sRUFBRTtZQUMvRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFO2dCQUN2QixPQUFvQyxDQUFDLEtBQUs7b0JBQ3pDLEVBQUUsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO2FBQ2xEO1lBRUQsSUFBSSxvQkFBb0IsRUFBRSxJQUFJLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtnQkFDeEQsT0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2FBQzlCO2lCQUFNLElBQUksb0JBQW9CLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLEVBQUU7Z0JBQzlELE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2FBQy9EO1NBQ0Y7YUFBTTtZQUNMLElBQUksT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7Z0JBQ3hCLE9BQW9DLENBQUMsSUFBSTtvQkFDeEMsRUFBRSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDbkQ7U0FDRjtRQUVELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU8scUJBQXFCLENBQUMsT0FBd0I7UUFDcEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUM7UUFFekMsSUFBSSxzQkFBc0IsRUFBRSxFQUFFO1lBQzVCLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdEI7YUFBTTtZQUNMLElBQUksT0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUU7Z0JBQ3ZCLEVBQUUsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQzthQUM1QjtZQUNELElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBQ3hCLEVBQUUsQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQzthQUM5QjtTQUNGO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsbUJBQW1CLENBQUMsSUFBMkQ7UUFDN0UsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBQ3BCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQztRQUN0QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztRQUN6QyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDakIsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDO1NBQ3JCO1FBQ0QsSUFBSSxJQUFJLElBQUksUUFBUSxFQUFFO1lBQ3BCLE9BQU8sRUFBRSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUM7U0FDekQ7UUFFRCxnREFBZ0Q7UUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUM7UUFDbEQsSUFBSSxJQUFJLElBQUksT0FBTyxFQUFFO1lBQ25CLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQzdCO2FBQU0sSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO1lBQ3hCLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1NBQzdCO1FBRUQsSUFBSSxLQUFLLElBQUksb0JBQW9CLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUU7WUFDakUsNkZBQTZGO1lBQzdGLHFDQUFxQztZQUNyQyxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBQ2hCLE9BQU8sRUFBRSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUM7YUFDeEQ7aUJBQU07Z0JBQ0wsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO2FBQ3RCO1NBQ0Y7YUFBTSxJQUFJLEtBQUssSUFBSSxvQkFBb0IsRUFBRSxJQUFJLGlCQUFpQixDQUFDLE9BQU8sRUFBRTtZQUN2RSw2RkFBNkY7WUFDN0YscUNBQXFDO1lBQ3JDLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtnQkFDaEIsT0FBTyxFQUFFLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQzthQUN4RDtpQkFBTTtnQkFDTCxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQzthQUN2QjtTQUNGO2FBQU07WUFDTCw4RkFBOEY7WUFDOUYsK0RBQStEO1lBQy9ELElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtnQkFDaEIsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDO2FBQ3RCO2lCQUFNO2dCQUNMLE9BQU8sRUFBRSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUM7YUFDeEQ7U0FDRjtJQUNILENBQUM7OEdBM0pVLGFBQWE7a0dBQWIsYUFBYTs7MkZBQWIsYUFBYTtrQkFKekIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsbUNBQW1DO29CQUM3QyxVQUFVLEVBQUUsSUFBSTtpQkFDakI7OzBCQWdCSSxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIGdldFJ0bFNjcm9sbEF4aXNUeXBlLFxuICBSdGxTY3JvbGxBeGlzVHlwZSxcbiAgc3VwcG9ydHNTY3JvbGxCZWhhdmlvcixcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBOZ1pvbmUsIE9uRGVzdHJveSwgT25Jbml0LCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2Zyb21FdmVudCwgT2JzZXJ2YWJsZSwgU3ViamVjdCwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnLi9zY3JvbGwtZGlzcGF0Y2hlcic7XG5cbmV4cG9ydCB0eXBlIF9XaXRob3V0PFQ+ID0ge1tQIGluIGtleW9mIFRdPzogbmV2ZXJ9O1xuZXhwb3J0IHR5cGUgX1hPUjxULCBVPiA9IChfV2l0aG91dDxUPiAmIFUpIHwgKF9XaXRob3V0PFU+ICYgVCk7XG5leHBvcnQgdHlwZSBfVG9wID0ge3RvcD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfQm90dG9tID0ge2JvdHRvbT86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfTGVmdCA9IHtsZWZ0PzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9SaWdodCA9IHtyaWdodD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfU3RhcnQgPSB7c3RhcnQ/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX0VuZCA9IHtlbmQ/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX1hBeGlzID0gX1hPUjxfWE9SPF9MZWZ0LCBfUmlnaHQ+LCBfWE9SPF9TdGFydCwgX0VuZD4+O1xuZXhwb3J0IHR5cGUgX1lBeGlzID0gX1hPUjxfVG9wLCBfQm90dG9tPjtcblxuLyoqXG4gKiBBbiBleHRlbmRlZCB2ZXJzaW9uIG9mIFNjcm9sbFRvT3B0aW9ucyB0aGF0IGFsbG93cyBleHByZXNzaW5nIHNjcm9sbCBvZmZzZXRzIHJlbGF0aXZlIHRvIHRoZVxuICogdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0LCBzdGFydCwgb3IgZW5kIG9mIHRoZSB2aWV3cG9ydCByYXRoZXIgdGhhbiBqdXN0IHRoZSB0b3AgYW5kIGxlZnQuXG4gKiBQbGVhc2Ugbm90ZTogdGhlIHRvcCBhbmQgYm90dG9tIHByb3BlcnRpZXMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZSwgYXMgYXJlIHRoZSBsZWZ0LCByaWdodCxcbiAqIHN0YXJ0LCBhbmQgZW5kIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCB0eXBlIEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zID0gX1hBeGlzICYgX1lBeGlzICYgU2Nyb2xsT3B0aW9ucztcblxuLyoqXG4gKiBTZW5kcyBhbiBldmVudCB3aGVuIHRoZSBkaXJlY3RpdmUncyBlbGVtZW50IGlzIHNjcm9sbGVkLiBSZWdpc3RlcnMgaXRzZWxmIHdpdGggdGhlXG4gKiBTY3JvbGxEaXNwYXRjaGVyIHNlcnZpY2UgdG8gaW5jbHVkZSBpdHNlbGYgYXMgcGFydCBvZiBpdHMgY29sbGVjdGlvbiBvZiBzY3JvbGxpbmcgZXZlbnRzIHRoYXQgaXRcbiAqIGNhbiBiZSBsaXN0ZW5lZCB0byB0aHJvdWdoIHRoZSBzZXJ2aWNlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLXNjcm9sbGFibGVdLCBbY2RrU2Nyb2xsYWJsZV0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtTY3JvbGxhYmxlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgcHJvdGVjdGVkIF9lbGVtZW50U2Nyb2xsZWQ6IE9ic2VydmFibGU8RXZlbnQ+ID0gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxFdmVudD4pID0+XG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgIGZyb21FdmVudCh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3Njcm9sbCcpXG4gICAgICAgIC5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKG9ic2VydmVyKSxcbiAgICApLFxuICApO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcm90ZWN0ZWQgc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICBwcm90ZWN0ZWQgbmdab25lOiBOZ1pvbmUsXG4gICAgQE9wdGlvbmFsKCkgcHJvdGVjdGVkIGRpcj86IERpcmVjdGlvbmFsaXR5LFxuICApIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5zY3JvbGxEaXNwYXRjaGVyLnJlZ2lzdGVyKHRoaXMpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zY3JvbGxEaXNwYXRjaGVyLmRlcmVnaXN0ZXIodGhpcyk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIGEgc2Nyb2xsIGV2ZW50IGlzIGZpcmVkIG9uIHRoZSBob3N0IGVsZW1lbnQuICovXG4gIGVsZW1lbnRTY3JvbGxlZCgpOiBPYnNlcnZhYmxlPEV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRTY3JvbGxlZDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBFbGVtZW50UmVmIGZvciB0aGUgdmlld3BvcnQuICovXG4gIGdldEVsZW1lbnRSZWYoKTogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnRSZWY7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgc3BlY2lmaWVkIG9mZnNldHMuIFRoaXMgaXMgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGJyb3dzZXIncyBuYXRpdmUgc2Nyb2xsVG9cbiAgICogbWV0aG9kLCBzaW5jZSBicm93c2VycyBhcmUgbm90IGNvbnNpc3RlbnQgYWJvdXQgd2hhdCBzY3JvbGxMZWZ0IG1lYW5zIGluIFJUTC4gRm9yIHRoaXMgbWV0aG9kXG4gICAqIGxlZnQgYW5kIHJpZ2h0IGFsd2F5cyByZWZlciB0byB0aGUgbGVmdCBhbmQgcmlnaHQgc2lkZSBvZiB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBpcnJlc3BlY3RpdmVcbiAgICogb2YgdGhlIGxheW91dCBkaXJlY3Rpb24uIHN0YXJ0IGFuZCBlbmQgcmVmZXIgdG8gbGVmdCBhbmQgcmlnaHQgaW4gYW4gTFRSIGNvbnRleHQgYW5kIHZpY2UtdmVyc2FcbiAgICogaW4gYW4gUlRMIGNvbnRleHQuXG4gICAqIEBwYXJhbSBvcHRpb25zIHNwZWNpZmllZCB0aGUgb2Zmc2V0cyB0byBzY3JvbGwgdG8uXG4gICAqL1xuICBzY3JvbGxUbyhvcHRpb25zOiBFeHRlbmRlZFNjcm9sbFRvT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcblxuICAgIC8vIFJld3JpdGUgc3RhcnQgJiBlbmQgb2Zmc2V0cyBhcyByaWdodCBvciBsZWZ0IG9mZnNldHMuXG4gICAgaWYgKG9wdGlvbnMubGVmdCA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zLmxlZnQgPSBpc1J0bCA/IG9wdGlvbnMuZW5kIDogb3B0aW9ucy5zdGFydDtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5yaWdodCA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zLnJpZ2h0ID0gaXNSdGwgPyBvcHRpb25zLnN0YXJ0IDogb3B0aW9ucy5lbmQ7XG4gICAgfVxuXG4gICAgLy8gUmV3cml0ZSB0aGUgYm90dG9tIG9mZnNldCBhcyBhIHRvcCBvZmZzZXQuXG4gICAgaWYgKG9wdGlvbnMuYm90dG9tICE9IG51bGwpIHtcbiAgICAgIChvcHRpb25zIGFzIF9XaXRob3V0PF9Cb3R0b20+ICYgX1RvcCkudG9wID1cbiAgICAgICAgZWwuc2Nyb2xsSGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gb3B0aW9ucy5ib3R0b207XG4gICAgfVxuXG4gICAgLy8gUmV3cml0ZSB0aGUgcmlnaHQgb2Zmc2V0IGFzIGEgbGVmdCBvZmZzZXQuXG4gICAgaWYgKGlzUnRsICYmIGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgIT0gUnRsU2Nyb2xsQXhpc1R5cGUuTk9STUFMKSB7XG4gICAgICBpZiAob3B0aW9ucy5sZWZ0ICE9IG51bGwpIHtcbiAgICAgICAgKG9wdGlvbnMgYXMgX1dpdGhvdXQ8X0xlZnQ+ICYgX1JpZ2h0KS5yaWdodCA9XG4gICAgICAgICAgZWwuc2Nyb2xsV2lkdGggLSBlbC5jbGllbnRXaWR0aCAtIG9wdGlvbnMubGVmdDtcbiAgICAgIH1cblxuICAgICAgaWYgKGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgPT0gUnRsU2Nyb2xsQXhpc1R5cGUuSU5WRVJURUQpIHtcbiAgICAgICAgb3B0aW9ucy5sZWZ0ID0gb3B0aW9ucy5yaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoZ2V0UnRsU2Nyb2xsQXhpc1R5cGUoKSA9PSBSdGxTY3JvbGxBeGlzVHlwZS5ORUdBVEVEKSB7XG4gICAgICAgIG9wdGlvbnMubGVmdCA9IG9wdGlvbnMucmlnaHQgPyAtb3B0aW9ucy5yaWdodCA6IG9wdGlvbnMucmlnaHQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvcHRpb25zLnJpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgKG9wdGlvbnMgYXMgX1dpdGhvdXQ8X1JpZ2h0PiAmIF9MZWZ0KS5sZWZ0ID1cbiAgICAgICAgICBlbC5zY3JvbGxXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gb3B0aW9ucy5yaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hcHBseVNjcm9sbFRvT3B0aW9ucyhvcHRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FwcGx5U2Nyb2xsVG9PcHRpb25zKG9wdGlvbnM6IFNjcm9sbFRvT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoc3VwcG9ydHNTY3JvbGxCZWhhdmlvcigpKSB7XG4gICAgICBlbC5zY3JvbGxUbyhvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMudG9wICE9IG51bGwpIHtcbiAgICAgICAgZWwuc2Nyb2xsVG9wID0gb3B0aW9ucy50b3A7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5sZWZ0ICE9IG51bGwpIHtcbiAgICAgICAgZWwuc2Nyb2xsTGVmdCA9IG9wdGlvbnMubGVmdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIHNjcm9sbCBvZmZzZXQgcmVsYXRpdmUgdG8gdGhlIHNwZWNpZmllZCBlZGdlIG9mIHRoZSB2aWV3cG9ydC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAqIHVzZWQgaW5zdGVhZCBvZiBkaXJlY3RseSBjaGVja2luZyBzY3JvbGxMZWZ0IG9yIHNjcm9sbFRvcCwgc2luY2UgYnJvd3NlcnMgYXJlIG5vdCBjb25zaXN0ZW50XG4gICAqIGFib3V0IHdoYXQgc2Nyb2xsTGVmdCBtZWFucyBpbiBSVEwuIFRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhpcyBtZXRob2QgYXJlIG5vcm1hbGl6ZWQgc3VjaCB0aGF0XG4gICAqIGxlZnQgYW5kIHJpZ2h0IGFsd2F5cyByZWZlciB0byB0aGUgbGVmdCBhbmQgcmlnaHQgc2lkZSBvZiB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBpcnJlc3BlY3RpdmVcbiAgICogb2YgdGhlIGxheW91dCBkaXJlY3Rpb24uIHN0YXJ0IGFuZCBlbmQgcmVmZXIgdG8gbGVmdCBhbmQgcmlnaHQgaW4gYW4gTFRSIGNvbnRleHQgYW5kIHZpY2UtdmVyc2FcbiAgICogaW4gYW4gUlRMIGNvbnRleHQuXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgZnJvbS5cbiAgICovXG4gIG1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbTogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcpOiBudW1iZXIge1xuICAgIGNvbnN0IExFRlQgPSAnbGVmdCc7XG4gICAgY29uc3QgUklHSFQgPSAncmlnaHQnO1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGZyb20gPT0gJ3RvcCcpIHtcbiAgICAgIHJldHVybiBlbC5zY3JvbGxUb3A7XG4gICAgfVxuICAgIGlmIChmcm9tID09ICdib3R0b20nKSB7XG4gICAgICByZXR1cm4gZWwuc2Nyb2xsSGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gZWwuc2Nyb2xsVG9wO1xuICAgIH1cblxuICAgIC8vIFJld3JpdGUgc3RhcnQgJiBlbmQgYXMgbGVmdCBvciByaWdodCBvZmZzZXRzLlxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG4gICAgaWYgKGZyb20gPT0gJ3N0YXJ0Jykge1xuICAgICAgZnJvbSA9IGlzUnRsID8gUklHSFQgOiBMRUZUO1xuICAgIH0gZWxzZSBpZiAoZnJvbSA9PSAnZW5kJykge1xuICAgICAgZnJvbSA9IGlzUnRsID8gTEVGVCA6IFJJR0hUO1xuICAgIH1cblxuICAgIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLklOVkVSVEVEKSB7XG4gICAgICAvLyBGb3IgSU5WRVJURUQsIHNjcm9sbExlZnQgaXMgKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmRcbiAgICAgIC8vIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSByaWdodC5cbiAgICAgIGlmIChmcm9tID09IExFRlQpIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBlbC5zY3JvbGxMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbExlZnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLk5FR0FURUQpIHtcbiAgICAgIC8vIEZvciBORUdBVEVELCBzY3JvbGxMZWZ0IGlzIC0oc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZFxuICAgICAgLy8gMCB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdCArIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gLWVsLnNjcm9sbExlZnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBOT1JNQUwsIGFzIHdlbGwgYXMgbm9uLVJUTCBjb250ZXh0cywgc2Nyb2xsTGVmdCBpcyAwIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmRcbiAgICAgIC8vIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbC5zY3JvbGxXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==