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
        options.left = options.left == null ? (isRtl ? options.end : options.start) : options.left;
        options.right = options.right == null ? (isRtl ? options.start : options.end) : options.right;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsaUJBQWlCLEVBQ2pCLHNCQUFzQixFQUN2QixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBcUIsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUM5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7Ozs7OztBQTZCckQsTUFBTSxPQUFPLGFBQWE7Ozs7Ozs7SUFReEIsWUFBc0IsVUFBbUMsRUFDbkMsZ0JBQWtDLEVBQ2xDLE1BQWMsRUFDRixHQUFvQjtRQUhoQyxlQUFVLEdBQVYsVUFBVSxDQUF5QjtRQUNuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBQ2xDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDRixRQUFHLEdBQUgsR0FBRyxDQUFpQjtRQVY5QyxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUUzQixxQkFBZ0IsR0FBc0IsSUFBSSxVQUFVOzs7O1FBQUMsQ0FBQyxRQUF5QixFQUFFLEVBQUUsQ0FDdkYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUI7OztRQUFDLEdBQUcsRUFBRSxDQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFNB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NkM7Ozs7O0lBQzdDLHlDQUE0Qzs7Ozs7SUFDNUMsK0JBQXdCOzs7OztJQUN4Qiw0QkFBMEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgZ2V0UnRsU2Nyb2xsQXhpc1R5cGUsXG4gIFJ0bFNjcm9sbEF4aXNUeXBlLFxuICBzdXBwb3J0c1Njcm9sbEJlaGF2aW9yXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgTmdab25lLCBPbkRlc3Ryb3ksIE9uSW5pdCwgT3B0aW9uYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIE9ic2VydmFibGUsIFN1YmplY3QsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1Njcm9sbERpc3BhdGNoZXJ9IGZyb20gJy4vc2Nyb2xsLWRpc3BhdGNoZXInO1xuXG5leHBvcnQgdHlwZSBfV2l0aG91dDxUPiA9IHtbUCBpbiBrZXlvZiBUXT86IG5ldmVyfTtcbmV4cG9ydCB0eXBlIF9YT1I8VCwgVT4gPSAoX1dpdGhvdXQ8VD4gJiBVKSB8IChfV2l0aG91dDxVPiAmIFQpO1xuZXhwb3J0IHR5cGUgX1RvcCA9IHt0b3A/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX0JvdHRvbSA9IHtib3R0b20/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX0xlZnQgPSB7bGVmdD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfUmlnaHQgPSB7cmlnaHQ/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX1N0YXJ0ID0ge3N0YXJ0PzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9FbmQgPSB7ZW5kPzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9YQXhpcyA9IF9YT1I8X1hPUjxfTGVmdCwgX1JpZ2h0PiwgX1hPUjxfU3RhcnQsIF9FbmQ+PjtcbmV4cG9ydCB0eXBlIF9ZQXhpcyA9IF9YT1I8X1RvcCwgX0JvdHRvbT47XG5cbi8qKlxuICogQW4gZXh0ZW5kZWQgdmVyc2lvbiBvZiBTY3JvbGxUb09wdGlvbnMgdGhhdCBhbGxvd3MgZXhwcmVzc2luZyBzY3JvbGwgb2Zmc2V0cyByZWxhdGl2ZSB0byB0aGVcbiAqIHRvcCwgYm90dG9tLCBsZWZ0LCByaWdodCwgc3RhcnQsIG9yIGVuZCBvZiB0aGUgdmlld3BvcnQgcmF0aGVyIHRoYW4ganVzdCB0aGUgdG9wIGFuZCBsZWZ0LlxuICogUGxlYXNlIG5vdGU6IHRoZSB0b3AgYW5kIGJvdHRvbSBwcm9wZXJ0aWVzIGFyZSBtdXR1YWxseSBleGNsdXNpdmUsIGFzIGFyZSB0aGUgbGVmdCwgcmlnaHQsXG4gKiBzdGFydCwgYW5kIGVuZCBwcm9wZXJ0aWVzLlxuICovXG5leHBvcnQgdHlwZSBFeHRlbmRlZFNjcm9sbFRvT3B0aW9ucyA9IF9YQXhpcyAmIF9ZQXhpcyAmIFNjcm9sbE9wdGlvbnM7XG5cbi8qKlxuICogU2VuZHMgYW4gZXZlbnQgd2hlbiB0aGUgZGlyZWN0aXZlJ3MgZWxlbWVudCBpcyBzY3JvbGxlZC4gUmVnaXN0ZXJzIGl0c2VsZiB3aXRoIHRoZVxuICogU2Nyb2xsRGlzcGF0Y2hlciBzZXJ2aWNlIHRvIGluY2x1ZGUgaXRzZWxmIGFzIHBhcnQgb2YgaXRzIGNvbGxlY3Rpb24gb2Ygc2Nyb2xsaW5nIGV2ZW50cyB0aGF0IGl0XG4gKiBjYW4gYmUgbGlzdGVuZWQgdG8gdGhyb3VnaCB0aGUgc2VydmljZS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nkay1zY3JvbGxhYmxlXSwgW2Nka1Njcm9sbGFibGVdJ1xufSlcbmV4cG9ydCBjbGFzcyBDZGtTY3JvbGxhYmxlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdCgpO1xuXG4gIHByaXZhdGUgX2VsZW1lbnRTY3JvbGxlZDogT2JzZXJ2YWJsZTxFdmVudD4gPSBuZXcgT2JzZXJ2YWJsZSgob2JzZXJ2ZXI6IE9ic2VydmVyPEV2ZW50PikgPT5cbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgICAgZnJvbUV2ZW50KHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LCAnc2Nyb2xsJykucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgICAgICAgLnN1YnNjcmliZShvYnNlcnZlcikpKTtcblxuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBzY3JvbGxEaXNwYXRjaGVyOiBTY3JvbGxEaXNwYXRjaGVyLFxuICAgICAgICAgICAgICBwcm90ZWN0ZWQgbmdab25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIHByb3RlY3RlZCBkaXI/OiBEaXJlY3Rpb25hbGl0eSkge31cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLnNjcm9sbERpc3BhdGNoZXIucmVnaXN0ZXIodGhpcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnNjcm9sbERpc3BhdGNoZXIuZGVyZWdpc3Rlcih0aGlzKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gYSBzY3JvbGwgZXZlbnQgaXMgZmlyZWQgb24gdGhlIGhvc3QgZWxlbWVudC4gKi9cbiAgZWxlbWVudFNjcm9sbGVkKCk6IE9ic2VydmFibGU8RXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fZWxlbWVudFNjcm9sbGVkO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIEVsZW1lbnRSZWYgZm9yIHRoZSB2aWV3cG9ydC4gKi9cbiAgZ2V0RWxlbWVudFJlZigpOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIHRvIHRoZSBzcGVjaWZpZWQgb2Zmc2V0cy4gVGhpcyBpcyBhIG5vcm1hbGl6ZWQgdmVyc2lvbiBvZiB0aGUgYnJvd3NlcidzIG5hdGl2ZSBzY3JvbGxUb1xuICAgKiBtZXRob2QsIHNpbmNlIGJyb3dzZXJzIGFyZSBub3QgY29uc2lzdGVudCBhYm91dCB3aGF0IHNjcm9sbExlZnQgbWVhbnMgaW4gUlRMLiBGb3IgdGhpcyBtZXRob2RcbiAgICogbGVmdCBhbmQgcmlnaHQgYWx3YXlzIHJlZmVyIHRvIHRoZSBsZWZ0IGFuZCByaWdodCBzaWRlIG9mIHRoZSBzY3JvbGxpbmcgY29udGFpbmVyIGlycmVzcGVjdGl2ZVxuICAgKiBvZiB0aGUgbGF5b3V0IGRpcmVjdGlvbi4gc3RhcnQgYW5kIGVuZCByZWZlciB0byBsZWZ0IGFuZCByaWdodCBpbiBhbiBMVFIgY29udGV4dCBhbmQgdmljZS12ZXJzYVxuICAgKiBpbiBhbiBSVEwgY29udGV4dC5cbiAgICogQHBhcmFtIG9wdGlvbnMgc3BlY2lmaWVkIHRoZSBvZmZzZXRzIHRvIHNjcm9sbCB0by5cbiAgICovXG4gIHNjcm9sbFRvKG9wdGlvbnM6IEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zKTogdm9pZCB7XG4gICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCBpc1J0bCA9IHRoaXMuZGlyICYmIHRoaXMuZGlyLnZhbHVlID09ICdydGwnO1xuXG4gICAgLy8gUmV3cml0ZSBzdGFydCAmIGVuZCBvZmZzZXRzIGFzIHJpZ2h0IG9yIGxlZnQgb2Zmc2V0cy5cbiAgICBvcHRpb25zLmxlZnQgPSBvcHRpb25zLmxlZnQgPT0gbnVsbCA/IChpc1J0bCA/IG9wdGlvbnMuZW5kIDogb3B0aW9ucy5zdGFydCkgOiBvcHRpb25zLmxlZnQ7XG4gICAgb3B0aW9ucy5yaWdodCA9IG9wdGlvbnMucmlnaHQgPT0gbnVsbCA/IChpc1J0bCA/IG9wdGlvbnMuc3RhcnQgOiBvcHRpb25zLmVuZCkgOiBvcHRpb25zLnJpZ2h0O1xuXG4gICAgLy8gUmV3cml0ZSB0aGUgYm90dG9tIG9mZnNldCBhcyBhIHRvcCBvZmZzZXQuXG4gICAgaWYgKG9wdGlvbnMuYm90dG9tICE9IG51bGwpIHtcbiAgICAgIChvcHRpb25zIGFzIF9XaXRob3V0PF9Cb3R0b20+ICYgX1RvcCkudG9wID1cbiAgICAgICAgICBlbC5zY3JvbGxIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBvcHRpb25zLmJvdHRvbTtcbiAgICB9XG5cbiAgICAvLyBSZXdyaXRlIHRoZSByaWdodCBvZmZzZXQgYXMgYSBsZWZ0IG9mZnNldC5cbiAgICBpZiAoaXNSdGwgJiYgZ2V0UnRsU2Nyb2xsQXhpc1R5cGUoKSAhPSBSdGxTY3JvbGxBeGlzVHlwZS5OT1JNQUwpIHtcbiAgICAgIGlmIChvcHRpb25zLmxlZnQgIT0gbnVsbCkge1xuICAgICAgICAob3B0aW9ucyBhcyBfV2l0aG91dDxfTGVmdD4gJiBfUmlnaHQpLnJpZ2h0ID1cbiAgICAgICAgICAgIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBvcHRpb25zLmxlZnQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLklOVkVSVEVEKSB7XG4gICAgICAgIG9wdGlvbnMubGVmdCA9IG9wdGlvbnMucmlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgPT0gUnRsU2Nyb2xsQXhpc1R5cGUuTkVHQVRFRCkge1xuICAgICAgICBvcHRpb25zLmxlZnQgPSBvcHRpb25zLnJpZ2h0ID8gLW9wdGlvbnMucmlnaHQgOiBvcHRpb25zLnJpZ2h0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy5yaWdodCAhPSBudWxsKSB7XG4gICAgICAgIChvcHRpb25zIGFzIF9XaXRob3V0PF9SaWdodD4gJiBfTGVmdCkubGVmdCA9XG4gICAgICAgICAgICBlbC5zY3JvbGxXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gb3B0aW9ucy5yaWdodDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hcHBseVNjcm9sbFRvT3B0aW9ucyhvcHRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FwcGx5U2Nyb2xsVG9PcHRpb25zKG9wdGlvbnM6IFNjcm9sbFRvT3B0aW9ucyk6IHZvaWQge1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoc3VwcG9ydHNTY3JvbGxCZWhhdmlvcigpKSB7XG4gICAgICBlbC5zY3JvbGxUbyhvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wdGlvbnMudG9wICE9IG51bGwpIHtcbiAgICAgICAgZWwuc2Nyb2xsVG9wID0gb3B0aW9ucy50b3A7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5sZWZ0ICE9IG51bGwpIHtcbiAgICAgICAgZWwuc2Nyb2xsTGVmdCA9IG9wdGlvbnMubGVmdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWVhc3VyZXMgdGhlIHNjcm9sbCBvZmZzZXQgcmVsYXRpdmUgdG8gdGhlIHNwZWNpZmllZCBlZGdlIG9mIHRoZSB2aWV3cG9ydC4gVGhpcyBtZXRob2QgY2FuIGJlXG4gICAqIHVzZWQgaW5zdGVhZCBvZiBkaXJlY3RseSBjaGVja2luZyBzY3JvbGxMZWZ0IG9yIHNjcm9sbFRvcCwgc2luY2UgYnJvd3NlcnMgYXJlIG5vdCBjb25zaXN0ZW50XG4gICAqIGFib3V0IHdoYXQgc2Nyb2xsTGVmdCBtZWFucyBpbiBSVEwuIFRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhpcyBtZXRob2QgYXJlIG5vcm1hbGl6ZWQgc3VjaCB0aGF0XG4gICAqIGxlZnQgYW5kIHJpZ2h0IGFsd2F5cyByZWZlciB0byB0aGUgbGVmdCBhbmQgcmlnaHQgc2lkZSBvZiB0aGUgc2Nyb2xsaW5nIGNvbnRhaW5lciBpcnJlc3BlY3RpdmVcbiAgICogb2YgdGhlIGxheW91dCBkaXJlY3Rpb24uIHN0YXJ0IGFuZCBlbmQgcmVmZXIgdG8gbGVmdCBhbmQgcmlnaHQgaW4gYW4gTFRSIGNvbnRleHQgYW5kIHZpY2UtdmVyc2FcbiAgICogaW4gYW4gUlRMIGNvbnRleHQuXG4gICAqIEBwYXJhbSBmcm9tIFRoZSBlZGdlIHRvIG1lYXN1cmUgZnJvbS5cbiAgICovXG4gIG1lYXN1cmVTY3JvbGxPZmZzZXQoZnJvbTogJ3RvcCcgfCAnbGVmdCcgfCAncmlnaHQnIHwgJ2JvdHRvbScgfCAnc3RhcnQnIHwgJ2VuZCcpOiBudW1iZXIge1xuICAgIGNvbnN0IExFRlQgPSAnbGVmdCc7XG4gICAgY29uc3QgUklHSFQgPSAncmlnaHQnO1xuICAgIGNvbnN0IGVsID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGZyb20gPT0gJ3RvcCcpIHtcbiAgICAgIHJldHVybiBlbC5zY3JvbGxUb3A7XG4gICAgfVxuICAgIGlmIChmcm9tID09ICdib3R0b20nKSB7XG4gICAgICByZXR1cm4gZWwuc2Nyb2xsSGVpZ2h0IC0gZWwuY2xpZW50SGVpZ2h0IC0gZWwuc2Nyb2xsVG9wO1xuICAgIH1cblxuICAgIC8vIFJld3JpdGUgc3RhcnQgJiBlbmQgYXMgbGVmdCBvciByaWdodCBvZmZzZXRzLlxuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG4gICAgaWYgKGZyb20gPT0gJ3N0YXJ0Jykge1xuICAgICAgZnJvbSA9IGlzUnRsID8gUklHSFQgOiBMRUZUO1xuICAgIH0gZWxzZSBpZiAoZnJvbSA9PSAnZW5kJykge1xuICAgICAgZnJvbSA9IGlzUnRsID8gTEVGVCA6IFJJR0hUO1xuICAgIH1cblxuICAgIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLklOVkVSVEVEKSB7XG4gICAgICAvLyBGb3IgSU5WRVJURUQsIHNjcm9sbExlZnQgaXMgKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmRcbiAgICAgIC8vIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSByaWdodC5cbiAgICAgIGlmIChmcm9tID09IExFRlQpIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBlbC5zY3JvbGxMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbExlZnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpID09IFJ0bFNjcm9sbEF4aXNUeXBlLk5FR0FURUQpIHtcbiAgICAgIC8vIEZvciBORUdBVEVELCBzY3JvbGxMZWZ0IGlzIC0oc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZFxuICAgICAgLy8gMCB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdCArIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gLWVsLnNjcm9sbExlZnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZvciBOT1JNQUwsIGFzIHdlbGwgYXMgbm9uLVJUTCBjb250ZXh0cywgc2Nyb2xsTGVmdCBpcyAwIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgbGVmdCBhbmRcbiAgICAgIC8vIChzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbC5zY3JvbGxXaWR0aCAtIGVsLmNsaWVudFdpZHRoIC0gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==