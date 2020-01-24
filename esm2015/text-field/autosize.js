/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/text-field/autosize.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { Directive, ElementRef, Input, NgZone, HostListener, } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { auditTime, takeUntil } from 'rxjs/operators';
import { fromEvent, Subject } from 'rxjs';
/**
 * Directive to automatically resize a textarea to fit its content.
 */
export class CdkTextareaAutosize {
    /**
     * @param {?} _elementRef
     * @param {?} _platform
     * @param {?} _ngZone
     */
    constructor(_elementRef, _platform, _ngZone) {
        this._elementRef = _elementRef;
        this._platform = _platform;
        this._ngZone = _ngZone;
        this._destroyed = new Subject();
        this._enabled = true;
        /**
         * Value of minRows as of last resize. If the minRows has decreased, the
         * height of the textarea needs to be recomputed to reflect the new minimum. The maxHeight
         * does not have the same problem because it does not affect the textarea's scrollHeight.
         */
        this._previousMinRows = -1;
        this._textareaElement = (/** @type {?} */ (this._elementRef.nativeElement));
    }
    /**
     * Minimum amount of rows in the textarea.
     * @return {?}
     */
    get minRows() { return this._minRows; }
    /**
     * @param {?} value
     * @return {?}
     */
    set minRows(value) {
        this._minRows = coerceNumberProperty(value);
        this._setMinHeight();
    }
    /**
     * Maximum amount of rows in the textarea.
     * @return {?}
     */
    get maxRows() { return this._maxRows; }
    /**
     * @param {?} value
     * @return {?}
     */
    set maxRows(value) {
        this._maxRows = coerceNumberProperty(value);
        this._setMaxHeight();
    }
    /**
     * Whether autosizing is enabled or not
     * @return {?}
     */
    get enabled() { return this._enabled; }
    /**
     * @param {?} value
     * @return {?}
     */
    set enabled(value) {
        value = coerceBooleanProperty(value);
        // Only act if the actual value changed. This specifically helps to not run
        // resizeToFitContent too early (i.e. before ngAfterViewInit)
        if (this._enabled !== value) {
            (this._enabled = value) ? this.resizeToFitContent(true) : this.reset();
        }
    }
    /**
     * Sets the minimum height of the textarea as determined by minRows.
     * @return {?}
     */
    _setMinHeight() {
        /** @type {?} */
        const minHeight = this.minRows && this._cachedLineHeight ?
            `${this.minRows * this._cachedLineHeight}px` : null;
        if (minHeight) {
            this._textareaElement.style.minHeight = minHeight;
        }
    }
    /**
     * Sets the maximum height of the textarea as determined by maxRows.
     * @return {?}
     */
    _setMaxHeight() {
        /** @type {?} */
        const maxHeight = this.maxRows && this._cachedLineHeight ?
            `${this.maxRows * this._cachedLineHeight}px` : null;
        if (maxHeight) {
            this._textareaElement.style.maxHeight = maxHeight;
        }
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        if (this._platform.isBrowser) {
            // Remember the height which we started with in case autosizing is disabled
            this._initialHeight = this._textareaElement.style.height;
            this.resizeToFitContent();
            this._ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                fromEvent(window, 'resize')
                    .pipe(auditTime(16), takeUntil(this._destroyed))
                    .subscribe((/**
                 * @return {?}
                 */
                () => this.resizeToFitContent(true)));
            }));
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Cache the height of a single-row textarea if it has not already been cached.
     *
     * We need to know how large a single "row" of a textarea is in order to apply minRows and
     * maxRows. For the initial version, we will assume that the height of a single line in the
     * textarea does not ever change.
     * @private
     * @return {?}
     */
    _cacheTextareaLineHeight() {
        if (this._cachedLineHeight) {
            return;
        }
        // Use a clone element because we have to override some styles.
        /** @type {?} */
        let textareaClone = (/** @type {?} */ (this._textareaElement.cloneNode(false)));
        textareaClone.rows = 1;
        // Use `position: absolute` so that this doesn't cause a browser layout and use
        // `visibility: hidden` so that nothing is rendered. Clear any other styles that
        // would affect the height.
        textareaClone.style.position = 'absolute';
        textareaClone.style.visibility = 'hidden';
        textareaClone.style.border = 'none';
        textareaClone.style.padding = '0';
        textareaClone.style.height = '';
        textareaClone.style.minHeight = '';
        textareaClone.style.maxHeight = '';
        // In Firefox it happens that textarea elements are always bigger than the specified amount
        // of rows. This is because Firefox tries to add extra space for the horizontal scrollbar.
        // As a workaround that removes the extra space for the scrollbar, we can just set overflow
        // to hidden. This ensures that there is no invalid calculation of the line height.
        // See Firefox bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=33654
        textareaClone.style.overflow = 'hidden';
        (/** @type {?} */ (this._textareaElement.parentNode)).appendChild(textareaClone);
        this._cachedLineHeight = textareaClone.clientHeight;
        (/** @type {?} */ (this._textareaElement.parentNode)).removeChild(textareaClone);
        // Min and max heights have to be re-calculated if the cached line height changes
        this._setMinHeight();
        this._setMaxHeight();
    }
    /**
     * @return {?}
     */
    ngDoCheck() {
        if (this._platform.isBrowser) {
            this.resizeToFitContent();
        }
    }
    /**
     * Resize the textarea to fit its content.
     * @param {?=} force Whether to force a height recalculation. By default the height will be
     *    recalculated only if the value changed since the last call.
     * @return {?}
     */
    resizeToFitContent(force = false) {
        // If autosizing is disabled, just skip everything else
        if (!this._enabled) {
            return;
        }
        this._cacheTextareaLineHeight();
        // If we haven't determined the line-height yet, we know we're still hidden and there's no point
        // in checking the height of the textarea.
        if (!this._cachedLineHeight) {
            return;
        }
        /** @type {?} */
        const textarea = (/** @type {?} */ (this._elementRef.nativeElement));
        /** @type {?} */
        const value = textarea.value;
        // Only resize if the value or minRows have changed since these calculations can be expensive.
        if (!force && this._minRows === this._previousMinRows && value === this._previousValue) {
            return;
        }
        /** @type {?} */
        const placeholderText = textarea.placeholder;
        // Reset the textarea height to auto in order to shrink back to its default size.
        // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
        // Long placeholders that are wider than the textarea width may lead to a bigger scrollHeight
        // value. To ensure that the scrollHeight is not bigger than the content, the placeholders
        // need to be removed temporarily.
        textarea.classList.add('cdk-textarea-autosize-measuring');
        textarea.placeholder = '';
        // The cdk-textarea-autosize-measuring class includes a 2px padding to workaround an issue with
        // Chrome, so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
        /** @type {?} */
        const height = textarea.scrollHeight - 4;
        // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
        textarea.style.height = `${height}px`;
        textarea.classList.remove('cdk-textarea-autosize-measuring');
        textarea.placeholder = placeholderText;
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame((/**
                 * @return {?}
                 */
                () => this._scrollToCaretPosition(textarea)));
            }
            else {
                setTimeout((/**
                 * @return {?}
                 */
                () => this._scrollToCaretPosition(textarea)));
            }
        }));
        this._previousValue = value;
        this._previousMinRows = this._minRows;
    }
    /**
     * Resets the textarea to its original size
     * @return {?}
     */
    reset() {
        // Do not try to change the textarea, if the initialHeight has not been determined yet
        // This might potentially remove styles when reset() is called before ngAfterViewInit
        if (this._initialHeight !== undefined) {
            this._textareaElement.style.height = this._initialHeight;
        }
    }
    // In Ivy the `host` metadata will be merged, whereas in ViewEngine it is overridden. In order
    // to avoid double event listeners, we need to use `HostListener`. Once Ivy is the default, we
    // can move this back into `host`.
    // tslint:disable:no-host-decorator-in-concrete
    /**
     * @return {?}
     */
    _noopInputHandler() {
        // no-op handler that ensures we're running change detection on input events.
    }
    /**
     * Scrolls a textarea to the caret position. On Firefox resizing the textarea will
     * prevent it from scrolling to the caret position. We need to re-set the selection
     * in order for it to scroll to the proper position.
     * @private
     * @param {?} textarea
     * @return {?}
     */
    _scrollToCaretPosition(textarea) {
        const { selectionStart, selectionEnd } = textarea;
        // IE will throw an "Unspecified error" if we try to set the selection range after the
        // element has been removed from the DOM. Assert that the directive hasn't been destroyed
        // between the time we requested the animation frame and when it was executed.
        // Also note that we have to assert that the textarea is focused before we set the
        // selection range. Setting the selection range on a non-focused textarea will cause
        // it to receive focus on IE and Edge.
        if (!this._destroyed.isStopped && document.activeElement === textarea) {
            textarea.setSelectionRange(selectionStart, selectionEnd);
        }
    }
}
CdkTextareaAutosize.decorators = [
    { type: Directive, args: [{
                selector: 'textarea[cdkTextareaAutosize]',
                exportAs: 'cdkTextareaAutosize',
                host: {
                    'class': 'cdk-textarea-autosize',
                    // Textarea elements that have the directive applied should have a single row by default.
                    // Browsers normally show two rows by default and therefore this limits the minRows binding.
                    'rows': '1',
                },
            },] }
];
/** @nocollapse */
CdkTextareaAutosize.ctorParameters = () => [
    { type: ElementRef },
    { type: Platform },
    { type: NgZone }
];
CdkTextareaAutosize.propDecorators = {
    minRows: [{ type: Input, args: ['cdkAutosizeMinRows',] }],
    maxRows: [{ type: Input, args: ['cdkAutosizeMaxRows',] }],
    enabled: [{ type: Input, args: ['cdkTextareaAutosize',] }],
    _noopInputHandler: [{ type: HostListener, args: ['input',] }]
};
if (false) {
    /** @type {?} */
    CdkTextareaAutosize.ngAcceptInputType_minRows;
    /** @type {?} */
    CdkTextareaAutosize.ngAcceptInputType_maxRows;
    /** @type {?} */
    CdkTextareaAutosize.ngAcceptInputType_enabled;
    /**
     * Keep track of the previous textarea value to avoid resizing when the value hasn't changed.
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._previousValue;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._initialHeight;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._destroyed;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._minRows;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._maxRows;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._enabled;
    /**
     * Value of minRows as of last resize. If the minRows has decreased, the
     * height of the textarea needs to be recomputed to reflect the new minimum. The maxHeight
     * does not have the same problem because it does not affect the textarea's scrollHeight.
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._previousMinRows;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._textareaElement;
    /**
     * Cached height of a textarea with a single row.
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._cachedLineHeight;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._elementRef;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._platform;
    /**
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._ngZone;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3NpemUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b3NpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUVMLHFCQUFxQixFQUNyQixvQkFBb0IsRUFFckIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixLQUFLLEVBSUwsTUFBTSxFQUNOLFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQzs7OztBQWN4QyxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFtRDlCLFlBQ1UsV0FBb0MsRUFDcEMsU0FBbUIsRUFDbkIsT0FBZTtRQUZmLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUNwQyxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFsRFIsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFJMUMsYUFBUSxHQUFZLElBQUksQ0FBQzs7Ozs7O1FBT3pCLHFCQUFnQixHQUFXLENBQUMsQ0FBQyxDQUFDO1FBd0NwQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQXVCLENBQUM7SUFDaEYsQ0FBQzs7Ozs7SUFwQ0QsSUFDSSxPQUFPLEtBQWEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFDL0MsSUFBSSxPQUFPLENBQUMsS0FBYTtRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLG9CQUFvQixDQUFDLEtBQUss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QUhkLE1BQU07OztzQkF1Q0wsS0FBSyxTQUFDLG9CQUFvQjtzQkFRMUIsS0FBSyxTQUFDLG9CQUFvQjtzQkFRMUIsS0FBSyxTQUFDLHFCQUFxQjtnQ0F3TDNCLFlBQVksU0FBQyxPQUFPOzs7O0lBd0JyQiw4Q0FBOEM7O0lBQzlDLDhDQUE4Qzs7SUFDOUMsOENBQStDOzs7Ozs7SUFwUC9DLDZDQUFnQzs7Ozs7SUFDaEMsNkNBQTJDOzs7OztJQUMzQyx5Q0FBa0Q7Ozs7O0lBRWxELHVDQUF5Qjs7Ozs7SUFDekIsdUNBQXlCOzs7OztJQUN6Qix1Q0FBaUM7Ozs7Ozs7O0lBT2pDLCtDQUFzQzs7Ozs7SUFFdEMsK0NBQThDOzs7Ozs7SUFnQzlDLGdEQUFrQzs7Ozs7SUFHaEMsMENBQTRDOzs7OztJQUM1Qyx3Q0FBMkI7Ozs7O0lBQzNCLHNDQUF1QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBCb29sZWFuSW5wdXQsXG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIE51bWJlcklucHV0XG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBBZnRlclZpZXdJbml0LFxuICBEb0NoZWNrLFxuICBPbkRlc3Ryb3ksXG4gIE5nWm9uZSxcbiAgSG9zdExpc3RlbmVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge2F1ZGl0VGltZSwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge2Zyb21FdmVudCwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cblxuLyoqIERpcmVjdGl2ZSB0byBhdXRvbWF0aWNhbGx5IHJlc2l6ZSBhIHRleHRhcmVhIHRvIGZpdCBpdHMgY29udGVudC4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ3RleHRhcmVhW2Nka1RleHRhcmVhQXV0b3NpemVdJyxcbiAgZXhwb3J0QXM6ICdjZGtUZXh0YXJlYUF1dG9zaXplJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdGV4dGFyZWEtYXV0b3NpemUnLFxuICAgIC8vIFRleHRhcmVhIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgZGlyZWN0aXZlIGFwcGxpZWQgc2hvdWxkIGhhdmUgYSBzaW5nbGUgcm93IGJ5IGRlZmF1bHQuXG4gICAgLy8gQnJvd3NlcnMgbm9ybWFsbHkgc2hvdyB0d28gcm93cyBieSBkZWZhdWx0IGFuZCB0aGVyZWZvcmUgdGhpcyBsaW1pdHMgdGhlIG1pblJvd3MgYmluZGluZy5cbiAgICAncm93cyc6ICcxJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGV4dGFyZWFBdXRvc2l6ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBLZWVwIHRyYWNrIG9mIHRoZSBwcmV2aW91cyB0ZXh0YXJlYSB2YWx1ZSB0byBhdm9pZCByZXNpemluZyB3aGVuIHRoZSB2YWx1ZSBoYXNuJ3QgY2hhbmdlZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNWYWx1ZT86IHN0cmluZztcbiAgcHJpdmF0ZSBfaW5pdGlhbEhlaWdodDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX21pblJvd3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWF4Um93czogbnVtYmVyO1xuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogVmFsdWUgb2YgbWluUm93cyBhcyBvZiBsYXN0IHJlc2l6ZS4gSWYgdGhlIG1pblJvd3MgaGFzIGRlY3JlYXNlZCwgdGhlXG4gICAqIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byByZWZsZWN0IHRoZSBuZXcgbWluaW11bS4gVGhlIG1heEhlaWdodFxuICAgKiBkb2VzIG5vdCBoYXZlIHRoZSBzYW1lIHByb2JsZW0gYmVjYXVzZSBpdCBkb2VzIG5vdCBhZmZlY3QgdGhlIHRleHRhcmVhJ3Mgc2Nyb2xsSGVpZ2h0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNNaW5Sb3dzOiBudW1iZXIgPSAtMTtcblxuICBwcml2YXRlIF90ZXh0YXJlYUVsZW1lbnQ6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgLyoqIE1pbmltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWluUm93cycpXG4gIGdldCBtaW5Sb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5Sb3dzOyB9XG4gIHNldCBtaW5Sb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9taW5Sb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1pbkhlaWdodCgpO1xuICB9XG5cbiAgLyoqIE1heGltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWF4Um93cycpXG4gIGdldCBtYXhSb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhSb3dzOyB9XG4gIHNldCBtYXhSb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9tYXhSb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYXV0b3NpemluZyBpcyBlbmFibGVkIG9yIG5vdCAqL1xuICBASW5wdXQoJ2Nka1RleHRhcmVhQXV0b3NpemUnKVxuICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7IH1cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB2YWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICAvLyBPbmx5IGFjdCBpZiB0aGUgYWN0dWFsIHZhbHVlIGNoYW5nZWQuIFRoaXMgc3BlY2lmaWNhbGx5IGhlbHBzIHRvIG5vdCBydW5cbiAgICAvLyByZXNpemVUb0ZpdENvbnRlbnQgdG9vIGVhcmx5IChpLmUuIGJlZm9yZSBuZ0FmdGVyVmlld0luaXQpXG4gICAgaWYgKHRoaXMuX2VuYWJsZWQgIT09IHZhbHVlKSB7XG4gICAgICAodGhpcy5fZW5hYmxlZCA9IHZhbHVlKSA/IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpIDogdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZWQgaGVpZ2h0IG9mIGEgdGV4dGFyZWEgd2l0aCBhIHNpbmdsZSByb3cuICovXG4gIHByaXZhdGUgX2NhY2hlZExpbmVIZWlnaHQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBtaW5pbXVtIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgYXMgZGV0ZXJtaW5lZCBieSBtaW5Sb3dzLiAqL1xuICBfc2V0TWluSGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IG1pbkhlaWdodCA9IHRoaXMubWluUm93cyAmJiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID9cbiAgICAgICAgYCR7dGhpcy5taW5Sb3dzICogdGhpcy5fY2FjaGVkTGluZUhlaWdodH1weGAgOiBudWxsO1xuXG4gICAgaWYgKG1pbkhlaWdodCkgIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYSBhcyBkZXRlcm1pbmVkIGJ5IG1heFJvd3MuICovXG4gIF9zZXRNYXhIZWlnaHQoKTogdm9pZCB7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5tYXhSb3dzICYmIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgP1xuICAgICAgICBgJHt0aGlzLm1heFJvd3MgKiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0fXB4YCA6IG51bGw7XG5cbiAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBSZW1lbWJlciB0aGUgaGVpZ2h0IHdoaWNoIHdlIHN0YXJ0ZWQgd2l0aCBpbiBjYXNlIGF1dG9zaXppbmcgaXMgZGlzYWJsZWRcbiAgICAgIHRoaXMuX2luaXRpYWxIZWlnaHQgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0O1xuXG4gICAgICB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCgpO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJylcbiAgICAgICAgICAucGlwZShhdWRpdFRpbWUoMTYpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FjaGUgdGhlIGhlaWdodCBvZiBhIHNpbmdsZS1yb3cgdGV4dGFyZWEgaWYgaXQgaGFzIG5vdCBhbHJlYWR5IGJlZW4gY2FjaGVkLlxuICAgKlxuICAgKiBXZSBuZWVkIHRvIGtub3cgaG93IGxhcmdlIGEgc2luZ2xlIFwicm93XCIgb2YgYSB0ZXh0YXJlYSBpcyBpbiBvcmRlciB0byBhcHBseSBtaW5Sb3dzIGFuZFxuICAgKiBtYXhSb3dzLiBGb3IgdGhlIGluaXRpYWwgdmVyc2lvbiwgd2Ugd2lsbCBhc3N1bWUgdGhhdCB0aGUgaGVpZ2h0IG9mIGEgc2luZ2xlIGxpbmUgaW4gdGhlXG4gICAqIHRleHRhcmVhIGRvZXMgbm90IGV2ZXIgY2hhbmdlLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FjaGVUZXh0YXJlYUxpbmVIZWlnaHQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2NhY2hlZExpbmVIZWlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBjbG9uZSBlbGVtZW50IGJlY2F1c2Ugd2UgaGF2ZSB0byBvdmVycmlkZSBzb21lIHN0eWxlcy5cbiAgICBsZXQgdGV4dGFyZWFDbG9uZSA9IHRoaXMuX3RleHRhcmVhRWxlbWVudC5jbG9uZU5vZGUoZmFsc2UpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgdGV4dGFyZWFDbG9uZS5yb3dzID0gMTtcblxuICAgIC8vIFVzZSBgcG9zaXRpb246IGFic29sdXRlYCBzbyB0aGF0IHRoaXMgZG9lc24ndCBjYXVzZSBhIGJyb3dzZXIgbGF5b3V0IGFuZCB1c2VcbiAgICAvLyBgdmlzaWJpbGl0eTogaGlkZGVuYCBzbyB0aGF0IG5vdGhpbmcgaXMgcmVuZGVyZWQuIENsZWFyIGFueSBvdGhlciBzdHlsZXMgdGhhdFxuICAgIC8vIHdvdWxkIGFmZmVjdCB0aGUgaGVpZ2h0LlxuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUuYm9yZGVyID0gJ25vbmUnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUucGFkZGluZyA9ICcwJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLmhlaWdodCA9ICcnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUubWluSGVpZ2h0ID0gJyc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5tYXhIZWlnaHQgPSAnJztcblxuICAgIC8vIEluIEZpcmVmb3ggaXQgaGFwcGVucyB0aGF0IHRleHRhcmVhIGVsZW1lbnRzIGFyZSBhbHdheXMgYmlnZ2VyIHRoYW4gdGhlIHNwZWNpZmllZCBhbW91bnRcbiAgICAvLyBvZiByb3dzLiBUaGlzIGlzIGJlY2F1c2UgRmlyZWZveCB0cmllcyB0byBhZGQgZXh0cmEgc3BhY2UgZm9yIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cbiAgICAvLyBBcyBhIHdvcmthcm91bmQgdGhhdCByZW1vdmVzIHRoZSBleHRyYSBzcGFjZSBmb3IgdGhlIHNjcm9sbGJhciwgd2UgY2FuIGp1c3Qgc2V0IG92ZXJmbG93XG4gICAgLy8gdG8gaGlkZGVuLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBubyBpbnZhbGlkIGNhbGN1bGF0aW9uIG9mIHRoZSBsaW5lIGhlaWdodC5cbiAgICAvLyBTZWUgRmlyZWZveCBidWcgcmVwb3J0OiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0zMzY1NFxuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5wYXJlbnROb2RlIS5hcHBlbmRDaGlsZCh0ZXh0YXJlYUNsb25lKTtcbiAgICB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID0gdGV4dGFyZWFDbG9uZS5jbGllbnRIZWlnaHQ7XG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHRleHRhcmVhQ2xvbmUpO1xuXG4gICAgLy8gTWluIGFuZCBtYXggaGVpZ2h0cyBoYXZlIHRvIGJlIHJlLWNhbGN1bGF0ZWQgaWYgdGhlIGNhY2hlZCBsaW5lIGhlaWdodCBjaGFuZ2VzXG4gICAgdGhpcy5fc2V0TWluSGVpZ2h0KCk7XG4gICAgdGhpcy5fc2V0TWF4SGVpZ2h0KCk7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgdGhpcy5yZXNpemVUb0ZpdENvbnRlbnQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzaXplIHRoZSB0ZXh0YXJlYSB0byBmaXQgaXRzIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBmb3JjZSBXaGV0aGVyIHRvIGZvcmNlIGEgaGVpZ2h0IHJlY2FsY3VsYXRpb24uIEJ5IGRlZmF1bHQgdGhlIGhlaWdodCB3aWxsIGJlXG4gICAqICAgIHJlY2FsY3VsYXRlZCBvbmx5IGlmIHRoZSB2YWx1ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGNhbGwuXG4gICAqL1xuICByZXNpemVUb0ZpdENvbnRlbnQoZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIC8vIElmIGF1dG9zaXppbmcgaXMgZGlzYWJsZWQsIGp1c3Qgc2tpcCBldmVyeXRoaW5nIGVsc2VcbiAgICBpZiAoIXRoaXMuX2VuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jYWNoZVRleHRhcmVhTGluZUhlaWdodCgpO1xuXG4gICAgLy8gSWYgd2UgaGF2ZW4ndCBkZXRlcm1pbmVkIHRoZSBsaW5lLWhlaWdodCB5ZXQsIHdlIGtub3cgd2UncmUgc3RpbGwgaGlkZGVuIGFuZCB0aGVyZSdzIG5vIHBvaW50XG4gICAgLy8gaW4gY2hlY2tpbmcgdGhlIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEuXG4gICAgaWYgKCF0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICBjb25zdCB2YWx1ZSA9IHRleHRhcmVhLnZhbHVlO1xuXG4gICAgLy8gT25seSByZXNpemUgaWYgdGhlIHZhbHVlIG9yIG1pblJvd3MgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZXNlIGNhbGN1bGF0aW9ucyBjYW4gYmUgZXhwZW5zaXZlLlxuICAgIGlmICghZm9yY2UgJiYgdGhpcy5fbWluUm93cyA9PT0gdGhpcy5fcHJldmlvdXNNaW5Sb3dzICYmIHZhbHVlID09PSB0aGlzLl9wcmV2aW91c1ZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gdGV4dGFyZWEucGxhY2Vob2xkZXI7XG5cbiAgICAvLyBSZXNldCB0aGUgdGV4dGFyZWEgaGVpZ2h0IHRvIGF1dG8gaW4gb3JkZXIgdG8gc2hyaW5rIGJhY2sgdG8gaXRzIGRlZmF1bHQgc2l6ZS5cbiAgICAvLyBBbHNvIHRlbXBvcmFyaWx5IGZvcmNlIG92ZXJmbG93OmhpZGRlbiwgc28gc2Nyb2xsIGJhcnMgZG8gbm90IGludGVyZmVyZSB3aXRoIGNhbGN1bGF0aW9ucy5cbiAgICAvLyBMb25nIHBsYWNlaG9sZGVycyB0aGF0IGFyZSB3aWRlciB0aGFuIHRoZSB0ZXh0YXJlYSB3aWR0aCBtYXkgbGVhZCB0byBhIGJpZ2dlciBzY3JvbGxIZWlnaHRcbiAgICAvLyB2YWx1ZS4gVG8gZW5zdXJlIHRoYXQgdGhlIHNjcm9sbEhlaWdodCBpcyBub3QgYmlnZ2VyIHRoYW4gdGhlIGNvbnRlbnQsIHRoZSBwbGFjZWhvbGRlcnNcbiAgICAvLyBuZWVkIHRvIGJlIHJlbW92ZWQgdGVtcG9yYXJpbHkuXG4gICAgdGV4dGFyZWEuY2xhc3NMaXN0LmFkZCgnY2RrLXRleHRhcmVhLWF1dG9zaXplLW1lYXN1cmluZycpO1xuICAgIHRleHRhcmVhLnBsYWNlaG9sZGVyID0gJyc7XG5cbiAgICAvLyBUaGUgY2RrLXRleHRhcmVhLWF1dG9zaXplLW1lYXN1cmluZyBjbGFzcyBpbmNsdWRlcyBhIDJweCBwYWRkaW5nIHRvIHdvcmthcm91bmQgYW4gaXNzdWUgd2l0aFxuICAgIC8vIENocm9tZSwgc28gd2UgYWNjb3VudCBmb3IgdGhhdCBleHRyYSBzcGFjZSBoZXJlIGJ5IHN1YnRyYWN0aW5nIDQgKDJweCB0b3AgKyAycHggYm90dG9tKS5cbiAgICBjb25zdCBoZWlnaHQgPSB0ZXh0YXJlYS5zY3JvbGxIZWlnaHQgLSA0O1xuXG4gICAgLy8gVXNlIHRoZSBzY3JvbGxIZWlnaHQgdG8ga25vdyBob3cgbGFyZ2UgdGhlIHRleHRhcmVhICp3b3VsZCogYmUgaWYgZml0IGl0cyBlbnRpcmUgdmFsdWUuXG4gICAgdGV4dGFyZWEuc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICB0ZXh0YXJlYS5jbGFzc0xpc3QucmVtb3ZlKCdjZGstdGV4dGFyZWEtYXV0b3NpemUtbWVhc3VyaW5nJyk7XG4gICAgdGV4dGFyZWEucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlclRleHQ7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLl9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWEpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9wcmV2aW91c1ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fcHJldmlvdXNNaW5Sb3dzID0gdGhpcy5fbWluUm93cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgdGhlIHRleHRhcmVhIHRvIGl0cyBvcmlnaW5hbCBzaXplXG4gICAqL1xuICByZXNldCgpIHtcbiAgICAvLyBEbyBub3QgdHJ5IHRvIGNoYW5nZSB0aGUgdGV4dGFyZWEsIGlmIHRoZSBpbml0aWFsSGVpZ2h0IGhhcyBub3QgYmVlbiBkZXRlcm1pbmVkIHlldFxuICAgIC8vIFRoaXMgbWlnaHQgcG90ZW50aWFsbHkgcmVtb3ZlIHN0eWxlcyB3aGVuIHJlc2V0KCkgaXMgY2FsbGVkIGJlZm9yZSBuZ0FmdGVyVmlld0luaXRcbiAgICBpZiAodGhpcy5faW5pdGlhbEhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gdGhpcy5faW5pdGlhbEhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvLyBJbiBJdnkgdGhlIGBob3N0YCBtZXRhZGF0YSB3aWxsIGJlIG1lcmdlZCwgd2hlcmVhcyBpbiBWaWV3RW5naW5lIGl0IGlzIG92ZXJyaWRkZW4uIEluIG9yZGVyXG4gIC8vIHRvIGF2b2lkIGRvdWJsZSBldmVudCBsaXN0ZW5lcnMsIHdlIG5lZWQgdG8gdXNlIGBIb3N0TGlzdGVuZXJgLiBPbmNlIEl2eSBpcyB0aGUgZGVmYXVsdCwgd2VcbiAgLy8gY2FuIG1vdmUgdGhpcyBiYWNrIGludG8gYGhvc3RgLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZTpuby1ob3N0LWRlY29yYXRvci1pbi1jb25jcmV0ZVxuICBASG9zdExpc3RlbmVyKCdpbnB1dCcpXG4gIF9ub29wSW5wdXRIYW5kbGVyKCkge1xuICAgIC8vIG5vLW9wIGhhbmRsZXIgdGhhdCBlbnN1cmVzIHdlJ3JlIHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBvbiBpbnB1dCBldmVudHMuXG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyBhIHRleHRhcmVhIHRvIHRoZSBjYXJldCBwb3NpdGlvbi4gT24gRmlyZWZveCByZXNpemluZyB0aGUgdGV4dGFyZWEgd2lsbFxuICAgKiBwcmV2ZW50IGl0IGZyb20gc2Nyb2xsaW5nIHRvIHRoZSBjYXJldCBwb3NpdGlvbi4gV2UgbmVlZCB0byByZS1zZXQgdGhlIHNlbGVjdGlvblxuICAgKiBpbiBvcmRlciBmb3IgaXQgdG8gc2Nyb2xsIHRvIHRoZSBwcm9wZXIgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWE6IEhUTUxUZXh0QXJlYUVsZW1lbnQpIHtcbiAgICBjb25zdCB7c2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZH0gPSB0ZXh0YXJlYTtcblxuICAgIC8vIElFIHdpbGwgdGhyb3cgYW4gXCJVbnNwZWNpZmllZCBlcnJvclwiIGlmIHdlIHRyeSB0byBzZXQgdGhlIHNlbGVjdGlvbiByYW5nZSBhZnRlciB0aGVcbiAgICAvLyBlbGVtZW50IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgRE9NLiBBc3NlcnQgdGhhdCB0aGUgZGlyZWN0aXZlIGhhc24ndCBiZWVuIGRlc3Ryb3llZFxuICAgIC8vIGJldHdlZW4gdGhlIHRpbWUgd2UgcmVxdWVzdGVkIHRoZSBhbmltYXRpb24gZnJhbWUgYW5kIHdoZW4gaXQgd2FzIGV4ZWN1dGVkLlxuICAgIC8vIEFsc28gbm90ZSB0aGF0IHdlIGhhdmUgdG8gYXNzZXJ0IHRoYXQgdGhlIHRleHRhcmVhIGlzIGZvY3VzZWQgYmVmb3JlIHdlIHNldCB0aGVcbiAgICAvLyBzZWxlY3Rpb24gcmFuZ2UuIFNldHRpbmcgdGhlIHNlbGVjdGlvbiByYW5nZSBvbiBhIG5vbi1mb2N1c2VkIHRleHRhcmVhIHdpbGwgY2F1c2VcbiAgICAvLyBpdCB0byByZWNlaXZlIGZvY3VzIG9uIElFIGFuZCBFZGdlLlxuICAgIGlmICghdGhpcy5fZGVzdHJveWVkLmlzU3RvcHBlZCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSB0ZXh0YXJlYSkge1xuICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX21pblJvd3M6IE51bWJlcklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWF4Um93czogTnVtYmVySW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9lbmFibGVkOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=