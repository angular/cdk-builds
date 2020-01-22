/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/scrolling/scrollable.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { getRtlScrollAxisType, RtlScrollAxisType, supportsScrollBehavior } from '@angular/cdk/platform';
import { Directive, ElementRef, NgZone, Optional } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScrollDispatcher } from './scroll-dispatcher';
/**
 * Sends an event when the directive's element is scrolled. Registers itself with the
 * ScrollDispatcher service to include itself as part of its collection of scrolling events that it
 * can be listened to through the service.
 */
export class CdkScrollable {
    /**
     * @param {?} elementRef
     * @param {?} scrollDispatcher
     * @param {?} ngZone
     * @param {?=} dir
     */
    constructor(elementRef, scrollDispatcher, ngZone, dir) {
        this.elementRef = elementRef;
        this.scrollDispatcher = scrollDispatcher;
        this.ngZone = ngZone;
        this.dir = dir;
        this._destroyed = new Subject();
        this._elementScrolled = new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => this.ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => fromEvent(this.elementRef.nativeElement, 'scroll').pipe(takeUntil(this._destroyed))
            .subscribe(observer)))));
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.scrollDispatcher.register(this);
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this.scrollDispatcher.deregister(this);
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Returns observable that emits when a scroll event is fired on the host element.
     * @return {?}
     */
    elementScrolled() {
        return this._elementScrolled;
    }
    /**
     * Gets the ElementRef for the viewport.
     * @return {?}
     */
    getElementRef() {
        return this.elementRef;
    }
    /**
     * Scrolls to the specified offsets. This is a normalized version of the browser's native scrollTo
     * method, since browsers are not consistent about what scrollLeft means in RTL. For this method
     * left and right always refer to the left and right side of the scrolling container irrespective
     * of the layout direction. start and end refer to left and right in an LTR context and vice-versa
     * in an RTL context.
     * @param {?} options specified the offsets to scroll to.
     * @return {?}
     */
    scrollTo(options) {
        /** @type {?} */
        const el = this.elementRef.nativeElement;
        /** @type {?} */
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
            ((/** @type {?} */ (options))).top =
                el.scrollHeight - el.clientHeight - options.bottom;
        }
        // Rewrite the right offset as a left offset.
        if (isRtl && getRtlScrollAxisType() != RtlScrollAxisType.NORMAL) {
            if (options.left != null) {
                ((/** @type {?} */ (options))).right =
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
                ((/** @type {?} */ (options))).left =
                    el.scrollWidth - el.clientWidth - options.right;
            }
        }
        this._applyScrollToOptions(options);
    }
    /**
     * @private
     * @param {?} options
     * @return {?}
     */
    _applyScrollToOptions(options) {
        /** @type {?} */
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
     * @param {?} from The edge to measure from.
     * @return {?}
     */
    measureScrollOffset(from) {
        /** @type {?} */
        const LEFT = 'left';
        /** @type {?} */
        const RIGHT = 'right';
        /** @type {?} */
        const el = this.elementRef.nativeElement;
        if (from == 'top') {
            return el.scrollTop;
        }
        if (from == 'bottom') {
            return el.scrollHeight - el.clientHeight - el.scrollTop;
        }
        // Rewrite start & end as left or right offsets.
        /** @type {?} */
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
}
CdkScrollable.decorators = [
    { type: Directive, args: [{
                selector: '[cdk-scrollable], [cdkScrollable]'
            },] }
];
/** @nocollapse */
CdkScrollable.ctorParameters = () => [
    { type: ElementRef },
    { type: ScrollDispatcher },
    { type: NgZone },
    { type: Directionality, decorators: [{ type: Optional }] }
];
if (false) {
    /**
     * @type {?}
     * @private
     */
    CdkScrollable.prototype._destroyed;
    /**
     * @type {?}
     * @private
     */
    CdkScrollable.prototype._elementScrolled;
    /**
     * @type {?}
     * @protected
     */
    CdkScrollable.prototype.elementRef;
    /**
     * @type {?}
     * @protected
     */
    CdkScrollable.prototype.scrollDispatcher;
    /**
     * @type {?}
     * @protected
     */
    CdkScrollable.prototype.ngZone;
    /**
     * @type {?}
     * @protected
     */
    CdkScrollable.prototype.dir;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsaUJBQWlCLEVBQ2pCLHNCQUFzQixFQUN2QixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBcUIsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUM5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7Ozs7OztBQTZCckQsTUFBTSxPQUFPLGFBQWE7Ozs7Ozs7SUFReEIsWUFBc0IsVUFBbUMsRUFDbkMsZ0JBQWtDLEVBQ2xDLE1BQWMsRUFDRixHQUFvQjtRQUhoQyxlQUFVLEdBQVYsVUFBVSxDQUF5QjtRQUNuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBQ2xDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDRixRQUFHLEdBQUgsR0FBRyxDQUFpQjtRQVY5QyxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUUzQixxQkFBZ0IsR0FBc0IsSUFBSSxVQUFVOzs7O1FBQUMsQ0FBQyxRQUF5QixFQUFFLEVBQUUsQ0FDdkYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUI7OztRQUFDLEdBQUcsRUFBRSxDQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFNB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bnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIGdldFJ0bFNjcm9sbEF4aXNUeXBlLFxuICBSdGxTY3JvbGxBeGlzVHlwZSxcbiAgc3VwcG9ydHNTY3JvbGxCZWhhdmlvclxufSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIE5nWm9uZSwgT25EZXN0cm95LCBPbkluaXQsIE9wdGlvbmFsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBPYnNlcnZhYmxlLCBTdWJqZWN0LCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICcuL3Njcm9sbC1kaXNwYXRjaGVyJztcblxuZXhwb3J0IHR5cGUgX1dpdGhvdXQ8VD4gPSB7W1AgaW4ga2V5b2YgVF0/OiBuZXZlcn07XG5leHBvcnQgdHlwZSBfWE9SPFQsIFU+ID0gKF9XaXRob3V0PFQ+ICYgVSkgfCAoX1dpdGhvdXQ8VT4gJiBUKTtcbmV4cG9ydCB0eXBlIF9Ub3AgPSB7dG9wPzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9Cb3R0b20gPSB7Ym90dG9tPzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9MZWZ0ID0ge2xlZnQ/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX1JpZ2h0ID0ge3JpZ2h0PzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9TdGFydCA9IHtzdGFydD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfRW5kID0ge2VuZD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfWEF4aXMgPSBfWE9SPF9YT1I8X0xlZnQsIF9SaWdodD4sIF9YT1I8X1N0YXJ0LCBfRW5kPj47XG5leHBvcnQgdHlwZSBfWUF4aXMgPSBfWE9SPF9Ub3AsIF9Cb3R0b20+O1xuXG4vKipcbiAqIEFuIGV4dGVuZGVkIHZlcnNpb24gb2YgU2Nyb2xsVG9PcHRpb25zIHRoYXQgYWxsb3dzIGV4cHJlc3Npbmcgc2Nyb2xsIG9mZnNldHMgcmVsYXRpdmUgdG8gdGhlXG4gKiB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQsIHN0YXJ0LCBvciBlbmQgb2YgdGhlIHZpZXdwb3J0IHJhdGhlciB0aGFuIGp1c3QgdGhlIHRvcCBhbmQgbGVmdC5cbiAqIFBsZWFzZSBub3RlOiB0aGUgdG9wIGFuZCBib3R0b20gcHJvcGVydGllcyBhcmUgbXV0dWFsbHkgZXhjbHVzaXZlLCBhcyBhcmUgdGhlIGxlZnQsIHJpZ2h0LFxuICogc3RhcnQsIGFuZCBlbmQgcHJvcGVydGllcy5cbiAqL1xuZXhwb3J0IHR5cGUgRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnMgPSBfWEF4aXMgJiBfWUF4aXMgJiBTY3JvbGxPcHRpb25zO1xuXG4vKipcbiAqIFNlbmRzIGFuIGV2ZW50IHdoZW4gdGhlIGRpcmVjdGl2ZSdzIGVsZW1lbnQgaXMgc2Nyb2xsZWQuIFJlZ2lzdGVycyBpdHNlbGYgd2l0aCB0aGVcbiAqIFNjcm9sbERpc3BhdGNoZXIgc2VydmljZSB0byBpbmNsdWRlIGl0c2VsZiBhcyBwYXJ0IG9mIGl0cyBjb2xsZWN0aW9uIG9mIHNjcm9sbGluZyBldmVudHMgdGhhdCBpdFxuICogY2FuIGJlIGxpc3RlbmVkIHRvIHRocm91Z2ggdGhlIHNlcnZpY2UuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGstc2Nyb2xsYWJsZV0sIFtjZGtTY3JvbGxhYmxlXSdcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU2Nyb2xsYWJsZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3QoKTtcblxuICBwcml2YXRlIF9lbGVtZW50U2Nyb2xsZWQ6IE9ic2VydmFibGU8RXZlbnQ+ID0gbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxFdmVudD4pID0+XG4gICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgICAgIGZyb21FdmVudCh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgJ3Njcm9sbCcpLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgICAgICAgIC5zdWJzY3JpYmUob2JzZXJ2ZXIpKSk7XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBwcm90ZWN0ZWQgc2Nyb2xsRGlzcGF0Y2hlcjogU2Nyb2xsRGlzcGF0Y2hlcixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIG5nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBwcm90ZWN0ZWQgZGlyPzogRGlyZWN0aW9uYWxpdHkpIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5zY3JvbGxEaXNwYXRjaGVyLnJlZ2lzdGVyKHRoaXMpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zY3JvbGxEaXNwYXRjaGVyLmRlcmVnaXN0ZXIodGhpcyk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIGEgc2Nyb2xsIGV2ZW50IGlzIGZpcmVkIG9uIHRoZSBob3N0IGVsZW1lbnQuICovXG4gIGVsZW1lbnRTY3JvbGxlZCgpOiBPYnNlcnZhYmxlPEV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2VsZW1lbnRTY3JvbGxlZDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBFbGVtZW50UmVmIGZvciB0aGUgdmlld3BvcnQuICovXG4gIGdldEVsZW1lbnRSZWYoKTogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4ge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnRSZWY7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyB0byB0aGUgc3BlY2lmaWVkIG9mZnNldHMuIFRoaXMgaXMgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGJyb3dzZXIncyBuYXRpdmUgc2Nyb2xsVG9cbiAgICogbWV0aG9kLCBzaW5jZSBicm93c2VycyBhcmUgbm90IGNvbnNpc3RlbnQgYWJvdXQgd2hhdCBzY3JvbGxMZWZ0IG1lYW5zIGluIFJUTC4gRm9yIHRoaXMgbWV0aG9kXG4gICAqIGxlZnQgYW5kIHJpZ2h0IGFsd2F5cyByZWZlciB0byB0aGUgbGVmdCBhbmQgcmlnaHQgc2lkZSBvZiB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBpcnJlc3BlY3RpdmVcbiAgICogb2YgdGhlIGxheW91dCBkaXJlY3Rpb24uIHN0YXJ0IGFuZCBlbmQgcmVmZXIgdG8gbGVmdCBhbmQgcmlnaHQgaW4gYW4gTFRSIGNvbnRleHQgYW5kIHZpY2UtdmVyc2FcbiAgICogaW4gYW4gUlRMIGNvbnRleHQuXG4gICAqIEBwYXJhbSBvcHRpb25zIHNwZWNpZmllZCB0aGUgb2Zmc2V0cyB0byBzY3JvbGwgdG8uXG4gICAqL1xuICBzY3JvbGxUbyhvcHRpb25zOiBFeHRlbmRlZFNjcm9sbFRvT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcblxuICAgIC8vIFJld3JpdGUgc3RhcnQgJiBlbmQgb2Zmc2V0cyBhcyByaWdodCBvciBsZWZ0IG9mZnNldHMuXG4gICAgaWYgKG9wdGlvbnMubGVmdCA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zLmxlZnQgPSBpc1J0bCA/IG9wdGlvbnMuZW5kIDogb3B0aW9ucy5zdGFydDtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5yaWdodCA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zLnJpZ2h0ID0gaXNSdGwgPyBvcHRpb25zLnN0YXJ0IDogb3B0aW9ucy5lbmQ7XG4gICAgfVxuXG4gICAgLy8gUmV3cml0ZSB0aGUgYm90dG9tIG9mZnNldCBhcyBhIHRvcCBvZmZzZXQuXG4gICAgaWYgKG9wdGlvbnMuYm90dG9tICE9IG51bGwpIHtcbiAgICAgIChvcHRpb25zIGFzIF9XaXRob3V0PF9Cb3R0b20+ICYgX1RvcCkudG9wID1cbiAgICAgICAgICBlbC5zY3JvbGxIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBvcHRpb25zLmJvdHRvbTtcbiAgICB9XG5cbiAgICAvLyBSZXdyaXRlIHRoZSByaWdodCBvZmZzZXQgYXMgYSBsZWZ0IG9mZnNldC5cbiAgICBpZiAoaXNSdGwgJiYgZ2V0UnRsU2Nyb2xsQXhpc1R5cGUoKSAhPSBSdGxTY3JvbGxBeGlzVHlwZS5OT1JNQUwpIHtcbiAgICAgIGlmIChvcHRpb25zLmxlZnQgIT0gbnVsbCkge1xuICAgICAgICAob3B0aW9ucyBhcyBfV2l0aG91dDxfTGVmdD4gJiBfUmlnaHQpLnJpZ2h0ID1cbiAgICAgICAgICAgIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBvcHRpb25zLmxlZnQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLklOVkVSVEVEKSB7XG4gICAgICAgIG9wdGlvbnMubGVmdCA9IG9wdGlvbnMucmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgPT0gUnRsU2Nyb2xsQXhpc1R5cGUuTkVHQVRFRCkge1xuICAgICAgICBvcHRpb25zLmxlZnQgPSBvcHRpb25zLnJpZ2h0ID8gLW9wdGlvbnMucmlnaHQgOiBvcHRpb25zLnJpZ2h0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy5yaWdodCAhPSBudWxsKSB7XG4gICAgICAgIChvcHRpb25zIGFzIF9XaXRob3V0PF9SaWdodD4gJiBfTGVmdCkubGVmdCA9XG4gICAgICAgICAgICBlbC5zY3JvbGxXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gb3B0aW9ucy5yaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hcHBseVNjcm9sbFRvT3B0aW9ucyhvcHRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FwcGx5U2Nyb2xsVG9PcHRpb25zKG9wdGlvbnM6IFNjcm9sbFRvT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoc3VwcG9ydHNTY3JvbGxCZWhhdmlvcigpKSB7XG4gICAgICBlbC5zY3JvbGxUbyhvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMudG9wICE9IG51bGwpIHtcbiAgICAgICAgZWwuc2Nyb2xsVG9wID0gb3B0aW9ucy50b3A7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5sZWZ0ICE9IG51bGwpIHtcbiAgICAgICAgZWwuc2Nyb2xsTGVmdCA9IG9wdGlvbnMubGVmdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIHNjcm9sbCBvZmZzZXQgcmVsYXRpdmUgdG8gdGhlIHNwZWNpZmllZCBlZGdlIG9mIHRoZSB2aWV3cG9ydC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAqIHVzZWQgaW5zdGVhZCBvZiBkaXJlY3RseSBjaGVja2luZyBzY3JvbGxMZWZ0IG9yIHNjcm9sbFRvcCwgc2luY2UgYnJvd3NlcnMgYXJlIG5vdCBjb25zaXN0ZW50XG4gICAqIGFib3V0IHdoYXQgc2Nyb2xsTGVmdCBtZWFucyBpbiBSVEwuIFRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhpcyBtZXRob2QgYXJlIG5vcm1hbGl6ZWQgc3VjaCB0aGF0XG4gICAqIGxlZnQgYW5kIHJpZ2h0IGFsd2F5cyByZWZlciB0byB0aGUgbGVmdCBhbmQgcmlnaHQgc2lkZSBvZiB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBpcnJlc3BlY3RpdmVcbiAgICogb2YgdGhlIGxheW91dCBkaXJlY3Rpb24uIHN0YXJ0IGFuZCBlbmQgcmVmZXIgdG8gbGVmdCBhbmQgcmlnaHQgaW4gYW4gTFRSIGNvbnRleHQgYW5kIHZpY2UtdmVyc2FcbiAgICogaW4gYW4gUlRMIGNvbnRleHQuXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgZnJvbS5cbiAgICovXG4gIG1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbTogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcpOiBudW1iZXIge1xuICAgIGNvbnN0IExFRlQgPSAnbGVmdCc7XG4gICAgY29uc3QgUklHSFQgPSAncmlnaHQnO1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGZyb20gPT0gJ3RvcCcpIHtcbiAgICAgIHJldHVybiBlbC5zY3JvbGxUb3A7XG4gICAgfVxuICAgIGlmIChmcm9tID09ICdib3R0b20nKSB7XG4gICAgICByZXR1cm4gZWwuc2Nyb2xsSGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gZWwuc2Nyb2xsVG9wO1xuICAgIH1cblxuICAgIC8vIFJld3JpdGUgc3RhcnQgJiBlbmQgYXMgbGVmdCBvciByaWdodCBvZmZzZXRzLlxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG4gICAgaWYgKGZyb20gPT0gJ3N0YXJ0Jykge1xuICAgICAgZnJvbSA9IGlzUnRsID8gUklHSFQgOiBMRUZUO1xuICAgIH0gZWxzZSBpZiAoZnJvbSA9PSAnZW5kJykge1xuICAgICAgZnJvbSA9IGlzUnRsID8gTEVGVCA6IFJJR0hUO1xuICAgIH1cblxuICAgIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLklOVkVSVEVEKSB7XG4gICAgICAvLyBGb3IgSU5WRVJURUQsIHNjcm9sbExlZnQgaXMgKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmRcbiAgICAgIC8vIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSByaWdodC5cbiAgICAgIGlmIChmcm9tID09IExFRlQpIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBlbC5zY3JvbGxMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbExlZnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLk5FR0FURUQpIHtcbiAgICAgIC8vIEZvciBORUdBVEVELCBzY3JvbGxMZWZ0IGlzIC0oc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZFxuICAgICAgLy8gMCB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdCArIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gLWVsLnNjcm9sbExlZnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBOT1JNQUwsIGFzIHdlbGwgYXMgbm9uLVJUTCBjb250ZXh0cywgc2Nyb2xsTGVmdCBpcyAwIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmRcbiAgICAgIC8vIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbC5zY3JvbGxXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==