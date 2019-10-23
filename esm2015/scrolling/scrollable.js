/**
 * @fileoverview added by tsickle
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2Nyb2xsaW5nL3Njcm9sbGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUNMLG9CQUFvQixFQUNwQixpQkFBaUIsRUFDakIsc0JBQXNCLEVBQ3ZCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFxQixRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekYsT0FBTyxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFXLE1BQU0sTUFBTSxDQUFDO0FBQzlELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQzs7Ozs7O0FBNkJyRCxNQUFNLE9BQU8sYUFBYTs7Ozs7OztJQVF4QixZQUFzQixVQUFtQyxFQUNuQyxnQkFBa0MsRUFDbEMsTUFBYyxFQUNGLEdBQW9CO1FBSGhDLGVBQVUsR0FBVixVQUFVLENBQXlCO1FBQ25DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7UUFDbEMsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNGLFFBQUcsR0FBSCxHQUFHLENBQWlCO1FBVjlDLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBRTNCLHFCQUFnQixHQUFzQixJQUFJLFVBQVU7Ozs7UUFBQyxDQUFDLFFBQXlCLEVBQUUsRUFBRSxDQUN2RixJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQjs7O1FBQUMsR0FBRyxFQUFFLENBQy9CLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FB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Qzs7Ozs7SUFDN0MseUNBQTRDOzs7OztJQUM1QywrQkFBd0I7Ozs7O0lBQ3hCLDRCQUEwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBnZXRSdGxTY3JvbGxBeGlzVHlwZSxcbiAgUnRsU2Nyb2xsQXhpc1R5cGUsXG4gIHN1cHBvcnRzU2Nyb2xsQmVoYXZpb3Jcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7RGlyZWN0aXZlLCBFbGVtZW50UmVmLCBOZ1pvbmUsIE9uRGVzdHJveSwgT25Jbml0LCBPcHRpb25hbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2Zyb21FdmVudCwgT2JzZXJ2YWJsZSwgU3ViamVjdCwgT2JzZXJ2ZXJ9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7U2Nyb2xsRGlzcGF0Y2hlcn0gZnJvbSAnLi9zY3JvbGwtZGlzcGF0Y2hlcic7XG5cbmV4cG9ydCB0eXBlIF9XaXRob3V0PFQ+ID0ge1tQIGluIGtleW9mIFRdPzogbmV2ZXJ9O1xuZXhwb3J0IHR5cGUgX1hPUjxULCBVPiA9IChfV2l0aG91dDxUPiAmIFUpIHwgKF9XaXRob3V0PFU+ICYgVCk7XG5leHBvcnQgdHlwZSBfVG9wID0ge3RvcD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfQm90dG9tID0ge2JvdHRvbT86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfTGVmdCA9IHtsZWZ0PzogbnVtYmVyfTtcbmV4cG9ydCB0eXBlIF9SaWdodCA9IHtyaWdodD86IG51bWJlcn07XG5leHBvcnQgdHlwZSBfU3RhcnQgPSB7c3RhcnQ/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX0VuZCA9IHtlbmQ/OiBudW1iZXJ9O1xuZXhwb3J0IHR5cGUgX1hBeGlzID0gX1hPUjxfWE9SPF9MZWZ0LCBfUmlnaHQ+LCBfWE9SPF9TdGFydCwgX0VuZD4+O1xuZXhwb3J0IHR5cGUgX1lBeGlzID0gX1hPUjxfVG9wLCBfQm90dG9tPjtcblxuLyoqXG4gKiBBbiBleHRlbmRlZCB2ZXJzaW9uIG9mIFNjcm9sbFRvT3B0aW9ucyB0aGF0IGFsbG93cyBleHByZXNzaW5nIHNjcm9sbCBvZmZzZXRzIHJlbGF0aXZlIHRvIHRoZVxuICogdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0LCBzdGFydCwgb3IgZW5kIG9mIHRoZSB2aWV3cG9ydCByYXRoZXIgdGhhbiBqdXN0IHRoZSB0b3AgYW5kIGxlZnQuXG4gKiBQbGVhc2Ugbm90ZTogdGhlIHRvcCBhbmQgYm90dG9tIHByb3BlcnRpZXMgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZSwgYXMgYXJlIHRoZSBsZWZ0LCByaWdodCxcbiAqIHN0YXJ0LCBhbmQgZW5kIHByb3BlcnRpZXMuXG4gKi9cbmV4cG9ydCB0eXBlIEV4dGVuZGVkU2Nyb2xsVG9PcHRpb25zID0gX1hBeGlzICYgX1lBeGlzICYgU2Nyb2xsT3B0aW9ucztcblxuLyoqXG4gKiBTZW5kcyBhbiBldmVudCB3aGVuIHRoZSBkaXJlY3RpdmUncyBlbGVtZW50IGlzIHNjcm9sbGVkLiBSZWdpc3RlcnMgaXRzZWxmIHdpdGggdGhlXG4gKiBTY3JvbGxEaXNwYXRjaGVyIHNlcnZpY2UgdG8gaW5jbHVkZSBpdHNlbGYgYXMgcGFydCBvZiBpdHMgY29sbGVjdGlvbiBvZiBzY3JvbGxpbmcgZXZlbnRzIHRoYXQgaXRcbiAqIGNhbiBiZSBsaXN0ZW5lZCB0byB0aHJvdWdoIHRoZSBzZXJ2aWNlLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrLXNjcm9sbGFibGVdLCBbY2RrU2Nyb2xsYWJsZV0nXG59KVxuZXhwb3J0IGNsYXNzIENka1Njcm9sbGFibGUgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgcHJpdmF0ZSBfZWxlbWVudFNjcm9sbGVkOiBPYnNlcnZhYmxlPEV2ZW50PiA9IG5ldyBPYnNlcnZhYmxlKChvYnNlcnZlcjogT2JzZXJ2ZXI8RXZlbnQ+KSA9PlxuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgICBmcm9tRXZlbnQodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsICdzY3JvbGwnKS5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAgICAgICAuc3Vic2NyaWJlKG9ic2VydmVyKSkpO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBlbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgICAgICAgQE9wdGlvbmFsKCkgcHJvdGVjdGVkIGRpcj86IERpcmVjdGlvbmFsaXR5KSB7fVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuc2Nyb2xsRGlzcGF0Y2hlci5yZWdpc3Rlcih0aGlzKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuc2Nyb2xsRGlzcGF0Y2hlci5kZXJlZ2lzdGVyKHRoaXMpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiBhIHNjcm9sbCBldmVudCBpcyBmaXJlZCBvbiB0aGUgaG9zdCBlbGVtZW50LiAqL1xuICBlbGVtZW50U2Nyb2xsZWQoKTogT2JzZXJ2YWJsZTxFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9lbGVtZW50U2Nyb2xsZWQ7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgRWxlbWVudFJlZiBmb3IgdGhlIHZpZXdwb3J0LiAqL1xuICBnZXRFbGVtZW50UmVmKCk6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgdG8gdGhlIHNwZWNpZmllZCBvZmZzZXRzLiBUaGlzIGlzIGEgbm9ybWFsaXplZCB2ZXJzaW9uIG9mIHRoZSBicm93c2VyJ3MgbmF0aXZlIHNjcm9sbFRvXG4gICAqIG1ldGhvZCwgc2luY2UgYnJvd3NlcnMgYXJlIG5vdCBjb25zaXN0ZW50IGFib3V0IHdoYXQgc2Nyb2xsTGVmdCBtZWFucyBpbiBSVEwuIEZvciB0aGlzIG1ldGhvZFxuICAgKiBsZWZ0IGFuZCByaWdodCBhbHdheXMgcmVmZXIgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0IHNpZGUgb2YgdGhlIHNjcm9sbGluZyBjb250YWluZXIgaXJyZXNwZWN0aXZlXG4gICAqIG9mIHRoZSBsYXlvdXQgZGlyZWN0aW9uLiBzdGFydCBhbmQgZW5kIHJlZmVyIHRvIGxlZnQgYW5kIHJpZ2h0IGluIGFuIExUUiBjb250ZXh0IGFuZCB2aWNlLXZlcnNhXG4gICAqIGluIGFuIFJUTCBjb250ZXh0LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBzcGVjaWZpZWQgdGhlIG9mZnNldHMgdG8gc2Nyb2xsIHRvLlxuICAgKi9cbiAgc2Nyb2xsVG8ob3B0aW9uczogRXh0ZW5kZWRTY3JvbGxUb09wdGlvbnMpOiB2b2lkIHtcbiAgICBjb25zdCBlbCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXIgJiYgdGhpcy5kaXIudmFsdWUgPT0gJ3J0bCc7XG5cbiAgICAvLyBSZXdyaXRlIHN0YXJ0ICYgZW5kIG9mZnNldHMgYXMgcmlnaHQgb3IgbGVmdCBvZmZzZXRzLlxuICAgIG9wdGlvbnMubGVmdCA9IG9wdGlvbnMubGVmdCA9PSBudWxsID8gKGlzUnRsID8gb3B0aW9ucy5lbmQgOiBvcHRpb25zLnN0YXJ0KSA6IG9wdGlvbnMubGVmdDtcbiAgICBvcHRpb25zLnJpZ2h0ID0gb3B0aW9ucy5yaWdodCA9PSBudWxsID8gKGlzUnRsID8gb3B0aW9ucy5zdGFydCA6IG9wdGlvbnMuZW5kKSA6IG9wdGlvbnMucmlnaHQ7XG5cbiAgICAvLyBSZXdyaXRlIHRoZSBib3R0b20gb2Zmc2V0IGFzIGEgdG9wIG9mZnNldC5cbiAgICBpZiAob3B0aW9ucy5ib3R0b20gIT0gbnVsbCkge1xuICAgICAgKG9wdGlvbnMgYXMgX1dpdGhvdXQ8X0JvdHRvbT4gJiBfVG9wKS50b3AgPVxuICAgICAgICAgIGVsLnNjcm9sbEhlaWdodCAtIGVsLmNsaWVudEhlaWdodCAtIG9wdGlvbnMuYm90dG9tO1xuICAgIH1cblxuICAgIC8vIFJld3JpdGUgdGhlIHJpZ2h0IG9mZnNldCBhcyBhIGxlZnQgb2Zmc2V0LlxuICAgIGlmIChpc1J0bCAmJiBnZXRSdGxTY3JvbGxBeGlzVHlwZSgpICE9IFJ0bFNjcm9sbEF4aXNUeXBlLk5PUk1BTCkge1xuICAgICAgaWYgKG9wdGlvbnMubGVmdCAhPSBudWxsKSB7XG4gICAgICAgIChvcHRpb25zIGFzIF9XaXRob3V0PF9MZWZ0PiAmIF9SaWdodCkucmlnaHQgPVxuICAgICAgICAgICAgZWwuc2Nyb2xsV2lkdGggLSBlbC5jbGllbnRXaWR0aCAtIG9wdGlvbnMubGVmdDtcbiAgICAgIH1cblxuICAgICAgaWYgKGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgPT0gUnRsU2Nyb2xsQXhpc1R5cGUuSU5WRVJURUQpIHtcbiAgICAgICAgb3B0aW9ucy5sZWZ0ID0gb3B0aW9ucy5yaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoZ2V0UnRsU2Nyb2xsQXhpc1R5cGUoKSA9PSBSdGxTY3JvbGxBeGlzVHlwZS5ORUdBVEVEKSB7XG4gICAgICAgIG9wdGlvbnMubGVmdCA9IG9wdGlvbnMucmlnaHQgPyAtb3B0aW9ucy5yaWdodCA6IG9wdGlvbnMucmlnaHQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvcHRpb25zLnJpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgKG9wdGlvbnMgYXMgX1dpdGhvdXQ8X1JpZ2h0PiAmIF9MZWZ0KS5sZWZ0ID1cbiAgICAgICAgICAgIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBvcHRpb25zLnJpZ2h0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2FwcGx5U2Nyb2xsVG9PcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXBwbHlTY3JvbGxUb09wdGlvbnMob3B0aW9uczogU2Nyb2xsVG9PcHRpb25zKTogdm9pZCB7XG4gICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgIGlmIChzdXBwb3J0c1Njcm9sbEJlaGF2aW9yKCkpIHtcbiAgICAgIGVsLnNjcm9sbFRvKG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3B0aW9ucy50b3AgIT0gbnVsbCkge1xuICAgICAgICBlbC5zY3JvbGxUb3AgPSBvcHRpb25zLnRvcDtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmxlZnQgIT0gbnVsbCkge1xuICAgICAgICBlbC5zY3JvbGxMZWZ0ID0gb3B0aW9ucy5sZWZ0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgc2Nyb2xsIG9mZnNldCByZWxhdGl2ZSB0byB0aGUgc3BlY2lmaWVkIGVkZ2Ugb2YgdGhlIHZpZXdwb3J0LiBUaGlzIG1ldGhvZCBjYW4gYmVcbiAgICogdXNlZCBpbnN0ZWFkIG9mIGRpcmVjdGx5IGNoZWNraW5nIHNjcm9sbExlZnQgb3Igc2Nyb2xsVG9wLCBzaW5jZSBicm93c2VycyBhcmUgbm90IGNvbnNpc3RlbnRcbiAgICogYWJvdXQgd2hhdCBzY3JvbGxMZWZ0IG1lYW5zIGluIFJUTC4gVGhlIHZhbHVlcyByZXR1cm5lZCBieSB0aGlzIG1ldGhvZCBhcmUgbm9ybWFsaXplZCBzdWNoIHRoYXRcbiAgICogbGVmdCBhbmQgcmlnaHQgYWx3YXlzIHJlZmVyIHRvIHRoZSBsZWZ0IGFuZCByaWdodCBzaWRlIG9mIHRoZSBzY3JvbGxpbmcgY29udGFpbmVyIGlycmVzcGVjdGl2ZVxuICAgKiBvZiB0aGUgbGF5b3V0IGRpcmVjdGlvbi4gc3RhcnQgYW5kIGVuZCByZWZlciB0byBsZWZ0IGFuZCByaWdodCBpbiBhbiBMVFIgY29udGV4dCBhbmQgdmljZS12ZXJzYVxuICAgKiBpbiBhbiBSVEwgY29udGV4dC5cbiAgICogQHBhcmFtIGZyb20gVGhlIGVkZ2UgdG8gbWVhc3VyZSBmcm9tLlxuICAgKi9cbiAgbWVhc3VyZVNjcm9sbE9mZnNldChmcm9tOiAndG9wJyB8ICdsZWZ0JyB8ICdyaWdodCcgfCAnYm90dG9tJyB8ICdzdGFydCcgfCAnZW5kJyk6IG51bWJlciB7XG4gICAgY29uc3QgTEVGVCA9ICdsZWZ0JztcbiAgICBjb25zdCBSSUdIVCA9ICdyaWdodCc7XG4gICAgY29uc3QgZWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZnJvbSA9PSAndG9wJykge1xuICAgICAgcmV0dXJuIGVsLnNjcm9sbFRvcDtcbiAgICB9XG4gICAgaWYgKGZyb20gPT0gJ2JvdHRvbScpIHtcbiAgICAgIHJldHVybiBlbC5zY3JvbGxIZWlnaHQgLSBlbC5jbGllbnRIZWlnaHQgLSBlbC5zY3JvbGxUb3A7XG4gICAgfVxuXG4gICAgLy8gUmV3cml0ZSBzdGFydCAmIGVuZCBhcyBsZWZ0IG9yIHJpZ2h0IG9mZnNldHMuXG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpciAmJiB0aGlzLmRpci52YWx1ZSA9PSAncnRsJztcbiAgICBpZiAoZnJvbSA9PSAnc3RhcnQnKSB7XG4gICAgICBmcm9tID0gaXNSdGwgPyBSSUdIVCA6IExFRlQ7XG4gICAgfSBlbHNlIGlmIChmcm9tID09ICdlbmQnKSB7XG4gICAgICBmcm9tID0gaXNSdGwgPyBMRUZUIDogUklHSFQ7XG4gICAgfVxuXG4gICAgaWYgKGlzUnRsICYmIGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgPT0gUnRsU2Nyb2xsQXhpc1R5cGUuSU5WRVJURUQpIHtcbiAgICAgIC8vIEZvciBJTlZFUlRFRCwgc2Nyb2xsTGVmdCBpcyAoc2Nyb2xsV2lkdGggLSBjbGllbnRXaWR0aCkgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZFxuICAgICAgLy8gMCB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgICAgaWYgKGZyb20gPT0gTEVGVCkge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsV2lkdGggLSBlbC5jbGllbnRXaWR0aCAtIGVsLnNjcm9sbExlZnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzUnRsICYmIGdldFJ0bFNjcm9sbEF4aXNUeXBlKCkgPT0gUnRsU2Nyb2xsQXhpc1R5cGUuTkVHQVRFRCkge1xuICAgICAgLy8gRm9yIE5FR0FURUQsIHNjcm9sbExlZnQgaXMgLShzY3JvbGxXaWR0aCAtIGNsaWVudFdpZHRoKSB3aGVuIHNjcm9sbGVkIGFsbCB0aGUgd2F5IGxlZnQgYW5kXG4gICAgICAvLyAwIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAgICBpZiAoZnJvbSA9PSBMRUZUKSB7XG4gICAgICAgIHJldHVybiBlbC5zY3JvbGxMZWZ0ICsgZWwuc2Nyb2xsV2lkdGggLSBlbC5jbGllbnRXaWR0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAtZWwuc2Nyb2xsTGVmdDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9yIE5PUk1BTCwgYXMgd2VsbCBhcyBub24tUlRMIGNvbnRleHRzLCBzY3JvbGxMZWZ0IGlzIDAgd2hlbiBzY3JvbGxlZCBhbGwgdGhlIHdheSBsZWZ0IGFuZFxuICAgICAgLy8gKHNjcm9sbFdpZHRoIC0gY2xpZW50V2lkdGgpIHdoZW4gc2Nyb2xsZWQgYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAgICBpZiAoZnJvbSA9PSBMRUZUKSB7XG4gICAgICAgIHJldHVybiBlbC5zY3JvbGxMZWZ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVsLnNjcm9sbFdpZHRoIC0gZWwuY2xpZW50V2lkdGggLSBlbC5zY3JvbGxMZWZ0O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19