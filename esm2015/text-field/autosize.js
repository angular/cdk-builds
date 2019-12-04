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
        if (this._initialHeight === undefined) {
            return;
        }
        this._textareaElement.style.height = this._initialHeight;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3NpemUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b3NpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHFCQUFxQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEYsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsS0FBSyxFQUlMLE1BQU0sRUFDTixZQUFZLEdBQ2IsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7Ozs7QUFjeEMsTUFBTSxPQUFPLG1CQUFtQjs7Ozs7O0lBbUQ5QixZQUNVLFdBQW9DLEVBQ3BDLFNBQW1CLEVBQ25CLE9BQWU7UUFGZixnQkFBVyxHQUFYLFdBQVcsQ0FBeUI7UUFDcEMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBbERSLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBSTFDLGFBQVEsR0FBWSxJQUFJLENBQUM7Ozs7OztRQU96QixxQkFBZ0IsR0FBVyxDQUFDLENBQUMsQ0FBQztRQXdDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLG1CQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUF1QixDQUFDO0lBQ2hGLENBQUM7Ozs7O0lBcENELElBQ0ksT0FBTyxLQUFhLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBQy9DLElBQUksT0FBTyxDQUFDLEtBQWE7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENB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SixRQUFRO1lBSGQsTUFBTTs7O3NCQXVDTCxLQUFLLFNBQUMsb0JBQW9CO3NCQVExQixLQUFLLFNBQUMsb0JBQW9CO3NCQVExQixLQUFLLFNBQUMscUJBQXFCO2dDQXlMM0IsWUFBWSxTQUFDLE9BQU87Ozs7SUF3QnJCLDhDQUFxRTs7SUFDckUsOENBQXFFOztJQUNyRSw4Q0FBc0U7Ozs7OztJQXJQdEUsNkNBQWdDOzs7OztJQUNoQyw2Q0FBc0M7Ozs7O0lBQ3RDLHlDQUFrRDs7Ozs7SUFFbEQsdUNBQXlCOzs7OztJQUN6Qix1Q0FBeUI7Ozs7O0lBQ3pCLHVDQUFpQzs7Ozs7Ozs7SUFPakMsK0NBQXNDOzs7OztJQUV0QywrQ0FBOEM7Ozs7OztJQWdDOUMsZ0RBQWtDOzs7OztJQUdoQywwQ0FBNEM7Ozs7O0lBQzVDLHdDQUEyQjs7Ozs7SUFDM0Isc0NBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VOdW1iZXJQcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIEFmdGVyVmlld0luaXQsXG4gIERvQ2hlY2ssXG4gIE9uRGVzdHJveSxcbiAgTmdab25lLFxuICBIb3N0TGlzdGVuZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7YXVkaXRUaW1lLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuXG4vKiogRGlyZWN0aXZlIHRvIGF1dG9tYXRpY2FsbHkgcmVzaXplIGEgdGV4dGFyZWEgdG8gZml0IGl0cyBjb250ZW50LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAndGV4dGFyZWFbY2RrVGV4dGFyZWFBdXRvc2l6ZV0nLFxuICBleHBvcnRBczogJ2Nka1RleHRhcmVhQXV0b3NpemUnLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZScsXG4gICAgLy8gVGV4dGFyZWEgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBkaXJlY3RpdmUgYXBwbGllZCBzaG91bGQgaGF2ZSBhIHNpbmdsZSByb3cgYnkgZGVmYXVsdC5cbiAgICAvLyBCcm93c2VycyBub3JtYWxseSBzaG93IHR3byByb3dzIGJ5IGRlZmF1bHQgYW5kIHRoZXJlZm9yZSB0aGlzIGxpbWl0cyB0aGUgbWluUm93cyBiaW5kaW5nLlxuICAgICdyb3dzJzogJzEnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUZXh0YXJlYUF1dG9zaXplIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgRG9DaGVjaywgT25EZXN0cm95IHtcbiAgLyoqIEtlZXAgdHJhY2sgb2YgdGhlIHByZXZpb3VzIHRleHRhcmVhIHZhbHVlIHRvIGF2b2lkIHJlc2l6aW5nIHdoZW4gdGhlIHZhbHVlIGhhc24ndCBjaGFuZ2VkLiAqL1xuICBwcml2YXRlIF9wcmV2aW91c1ZhbHVlPzogc3RyaW5nO1xuICBwcml2YXRlIF9pbml0aWFsSGVpZ2h0OiBzdHJpbmcgfCBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX21pblJvd3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWF4Um93czogbnVtYmVyO1xuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogVmFsdWUgb2YgbWluUm93cyBhcyBvZiBsYXN0IHJlc2l6ZS4gSWYgdGhlIG1pblJvd3MgaGFzIGRlY3JlYXNlZCwgdGhlXG4gICAqIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byByZWZsZWN0IHRoZSBuZXcgbWluaW11bS4gVGhlIG1heEhlaWdodFxuICAgKiBkb2VzIG5vdCBoYXZlIHRoZSBzYW1lIHByb2JsZW0gYmVjYXVzZSBpdCBkb2VzIG5vdCBhZmZlY3QgdGhlIHRleHRhcmVhJ3Mgc2Nyb2xsSGVpZ2h0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNNaW5Sb3dzOiBudW1iZXIgPSAtMTtcblxuICBwcml2YXRlIF90ZXh0YXJlYUVsZW1lbnQ6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgLyoqIE1pbmltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWluUm93cycpXG4gIGdldCBtaW5Sb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5Sb3dzOyB9XG4gIHNldCBtaW5Sb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9taW5Sb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1pbkhlaWdodCgpO1xuICB9XG5cbiAgLyoqIE1heGltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWF4Um93cycpXG4gIGdldCBtYXhSb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhSb3dzOyB9XG4gIHNldCBtYXhSb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9tYXhSb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYXV0b3NpemluZyBpcyBlbmFibGVkIG9yIG5vdCAqL1xuICBASW5wdXQoJ2Nka1RleHRhcmVhQXV0b3NpemUnKVxuICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7IH1cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB2YWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICAvLyBPbmx5IGFjdCBpZiB0aGUgYWN0dWFsIHZhbHVlIGNoYW5nZWQuIFRoaXMgc3BlY2lmaWNhbGx5IGhlbHBzIHRvIG5vdCBydW5cbiAgICAvLyByZXNpemVUb0ZpdENvbnRlbnQgdG9vIGVhcmx5IChpLmUuIGJlZm9yZSBuZ0FmdGVyVmlld0luaXQpXG4gICAgaWYgKHRoaXMuX2VuYWJsZWQgIT09IHZhbHVlKSB7XG4gICAgICAodGhpcy5fZW5hYmxlZCA9IHZhbHVlKSA/IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpIDogdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZWQgaGVpZ2h0IG9mIGEgdGV4dGFyZWEgd2l0aCBhIHNpbmdsZSByb3cuICovXG4gIHByaXZhdGUgX2NhY2hlZExpbmVIZWlnaHQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBtaW5pbXVtIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgYXMgZGV0ZXJtaW5lZCBieSBtaW5Sb3dzLiAqL1xuICBfc2V0TWluSGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IG1pbkhlaWdodCA9IHRoaXMubWluUm93cyAmJiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID9cbiAgICAgICAgYCR7dGhpcy5taW5Sb3dzICogdGhpcy5fY2FjaGVkTGluZUhlaWdodH1weGAgOiBudWxsO1xuXG4gICAgaWYgKG1pbkhlaWdodCkgIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYSBhcyBkZXRlcm1pbmVkIGJ5IG1heFJvd3MuICovXG4gIF9zZXRNYXhIZWlnaHQoKTogdm9pZCB7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5tYXhSb3dzICYmIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgP1xuICAgICAgICBgJHt0aGlzLm1heFJvd3MgKiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0fXB4YCA6IG51bGw7XG5cbiAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBSZW1lbWJlciB0aGUgaGVpZ2h0IHdoaWNoIHdlIHN0YXJ0ZWQgd2l0aCBpbiBjYXNlIGF1dG9zaXppbmcgaXMgZGlzYWJsZWRcbiAgICAgIHRoaXMuX2luaXRpYWxIZWlnaHQgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0O1xuXG4gICAgICB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCgpO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJylcbiAgICAgICAgICAucGlwZShhdWRpdFRpbWUoMTYpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FjaGUgdGhlIGhlaWdodCBvZiBhIHNpbmdsZS1yb3cgdGV4dGFyZWEgaWYgaXQgaGFzIG5vdCBhbHJlYWR5IGJlZW4gY2FjaGVkLlxuICAgKlxuICAgKiBXZSBuZWVkIHRvIGtub3cgaG93IGxhcmdlIGEgc2luZ2xlIFwicm93XCIgb2YgYSB0ZXh0YXJlYSBpcyBpbiBvcmRlciB0byBhcHBseSBtaW5Sb3dzIGFuZFxuICAgKiBtYXhSb3dzLiBGb3IgdGhlIGluaXRpYWwgdmVyc2lvbiwgd2Ugd2lsbCBhc3N1bWUgdGhhdCB0aGUgaGVpZ2h0IG9mIGEgc2luZ2xlIGxpbmUgaW4gdGhlXG4gICAqIHRleHRhcmVhIGRvZXMgbm90IGV2ZXIgY2hhbmdlLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FjaGVUZXh0YXJlYUxpbmVIZWlnaHQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2NhY2hlZExpbmVIZWlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBjbG9uZSBlbGVtZW50IGJlY2F1c2Ugd2UgaGF2ZSB0byBvdmVycmlkZSBzb21lIHN0eWxlcy5cbiAgICBsZXQgdGV4dGFyZWFDbG9uZSA9IHRoaXMuX3RleHRhcmVhRWxlbWVudC5jbG9uZU5vZGUoZmFsc2UpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgdGV4dGFyZWFDbG9uZS5yb3dzID0gMTtcblxuICAgIC8vIFVzZSBgcG9zaXRpb246IGFic29sdXRlYCBzbyB0aGF0IHRoaXMgZG9lc24ndCBjYXVzZSBhIGJyb3dzZXIgbGF5b3V0IGFuZCB1c2VcbiAgICAvLyBgdmlzaWJpbGl0eTogaGlkZGVuYCBzbyB0aGF0IG5vdGhpbmcgaXMgcmVuZGVyZWQuIENsZWFyIGFueSBvdGhlciBzdHlsZXMgdGhhdFxuICAgIC8vIHdvdWxkIGFmZmVjdCB0aGUgaGVpZ2h0LlxuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUuYm9yZGVyID0gJ25vbmUnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUucGFkZGluZyA9ICcwJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLmhlaWdodCA9ICcnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUubWluSGVpZ2h0ID0gJyc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5tYXhIZWlnaHQgPSAnJztcblxuICAgIC8vIEluIEZpcmVmb3ggaXQgaGFwcGVucyB0aGF0IHRleHRhcmVhIGVsZW1lbnRzIGFyZSBhbHdheXMgYmlnZ2VyIHRoYW4gdGhlIHNwZWNpZmllZCBhbW91bnRcbiAgICAvLyBvZiByb3dzLiBUaGlzIGlzIGJlY2F1c2UgRmlyZWZveCB0cmllcyB0byBhZGQgZXh0cmEgc3BhY2UgZm9yIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cbiAgICAvLyBBcyBhIHdvcmthcm91bmQgdGhhdCByZW1vdmVzIHRoZSBleHRyYSBzcGFjZSBmb3IgdGhlIHNjcm9sbGJhciwgd2UgY2FuIGp1c3Qgc2V0IG92ZXJmbG93XG4gICAgLy8gdG8gaGlkZGVuLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBubyBpbnZhbGlkIGNhbGN1bGF0aW9uIG9mIHRoZSBsaW5lIGhlaWdodC5cbiAgICAvLyBTZWUgRmlyZWZveCBidWcgcmVwb3J0OiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0zMzY1NFxuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5wYXJlbnROb2RlIS5hcHBlbmRDaGlsZCh0ZXh0YXJlYUNsb25lKTtcbiAgICB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID0gdGV4dGFyZWFDbG9uZS5jbGllbnRIZWlnaHQ7XG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHRleHRhcmVhQ2xvbmUpO1xuXG4gICAgLy8gTWluIGFuZCBtYXggaGVpZ2h0cyBoYXZlIHRvIGJlIHJlLWNhbGN1bGF0ZWQgaWYgdGhlIGNhY2hlZCBsaW5lIGhlaWdodCBjaGFuZ2VzXG4gICAgdGhpcy5fc2V0TWluSGVpZ2h0KCk7XG4gICAgdGhpcy5fc2V0TWF4SGVpZ2h0KCk7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgdGhpcy5yZXNpemVUb0ZpdENvbnRlbnQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzaXplIHRoZSB0ZXh0YXJlYSB0byBmaXQgaXRzIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBmb3JjZSBXaGV0aGVyIHRvIGZvcmNlIGEgaGVpZ2h0IHJlY2FsY3VsYXRpb24uIEJ5IGRlZmF1bHQgdGhlIGhlaWdodCB3aWxsIGJlXG4gICAqICAgIHJlY2FsY3VsYXRlZCBvbmx5IGlmIHRoZSB2YWx1ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGNhbGwuXG4gICAqL1xuICByZXNpemVUb0ZpdENvbnRlbnQoZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIC8vIElmIGF1dG9zaXppbmcgaXMgZGlzYWJsZWQsIGp1c3Qgc2tpcCBldmVyeXRoaW5nIGVsc2VcbiAgICBpZiAoIXRoaXMuX2VuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jYWNoZVRleHRhcmVhTGluZUhlaWdodCgpO1xuXG4gICAgLy8gSWYgd2UgaGF2ZW4ndCBkZXRlcm1pbmVkIHRoZSBsaW5lLWhlaWdodCB5ZXQsIHdlIGtub3cgd2UncmUgc3RpbGwgaGlkZGVuIGFuZCB0aGVyZSdzIG5vIHBvaW50XG4gICAgLy8gaW4gY2hlY2tpbmcgdGhlIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEuXG4gICAgaWYgKCF0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICBjb25zdCB2YWx1ZSA9IHRleHRhcmVhLnZhbHVlO1xuXG4gICAgLy8gT25seSByZXNpemUgaWYgdGhlIHZhbHVlIG9yIG1pblJvd3MgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZXNlIGNhbGN1bGF0aW9ucyBjYW4gYmUgZXhwZW5zaXZlLlxuICAgIGlmICghZm9yY2UgJiYgdGhpcy5fbWluUm93cyA9PT0gdGhpcy5fcHJldmlvdXNNaW5Sb3dzICYmIHZhbHVlID09PSB0aGlzLl9wcmV2aW91c1ZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gdGV4dGFyZWEucGxhY2Vob2xkZXI7XG5cbiAgICAvLyBSZXNldCB0aGUgdGV4dGFyZWEgaGVpZ2h0IHRvIGF1dG8gaW4gb3JkZXIgdG8gc2hyaW5rIGJhY2sgdG8gaXRzIGRlZmF1bHQgc2l6ZS5cbiAgICAvLyBBbHNvIHRlbXBvcmFyaWx5IGZvcmNlIG92ZXJmbG93OmhpZGRlbiwgc28gc2Nyb2xsIGJhcnMgZG8gbm90IGludGVyZmVyZSB3aXRoIGNhbGN1bGF0aW9ucy5cbiAgICAvLyBMb25nIHBsYWNlaG9sZGVycyB0aGF0IGFyZSB3aWRlciB0aGFuIHRoZSB0ZXh0YXJlYSB3aWR0aCBtYXkgbGVhZCB0byBhIGJpZ2dlciBzY3JvbGxIZWlnaHRcbiAgICAvLyB2YWx1ZS4gVG8gZW5zdXJlIHRoYXQgdGhlIHNjcm9sbEhlaWdodCBpcyBub3QgYmlnZ2VyIHRoYW4gdGhlIGNvbnRlbnQsIHRoZSBwbGFjZWhvbGRlcnNcbiAgICAvLyBuZWVkIHRvIGJlIHJlbW92ZWQgdGVtcG9yYXJpbHkuXG4gICAgdGV4dGFyZWEuY2xhc3NMaXN0LmFkZCgnY2RrLXRleHRhcmVhLWF1dG9zaXplLW1lYXN1cmluZycpO1xuICAgIHRleHRhcmVhLnBsYWNlaG9sZGVyID0gJyc7XG5cbiAgICAvLyBUaGUgY2RrLXRleHRhcmVhLWF1dG9zaXplLW1lYXN1cmluZyBjbGFzcyBpbmNsdWRlcyBhIDJweCBwYWRkaW5nIHRvIHdvcmthcm91bmQgYW4gaXNzdWUgd2l0aFxuICAgIC8vIENocm9tZSwgc28gd2UgYWNjb3VudCBmb3IgdGhhdCBleHRyYSBzcGFjZSBoZXJlIGJ5IHN1YnRyYWN0aW5nIDQgKDJweCB0b3AgKyAycHggYm90dG9tKS5cbiAgICBjb25zdCBoZWlnaHQgPSB0ZXh0YXJlYS5zY3JvbGxIZWlnaHQgLSA0O1xuXG4gICAgLy8gVXNlIHRoZSBzY3JvbGxIZWlnaHQgdG8ga25vdyBob3cgbGFyZ2UgdGhlIHRleHRhcmVhICp3b3VsZCogYmUgaWYgZml0IGl0cyBlbnRpcmUgdmFsdWUuXG4gICAgdGV4dGFyZWEuc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICB0ZXh0YXJlYS5jbGFzc0xpc3QucmVtb3ZlKCdjZGstdGV4dGFyZWEtYXV0b3NpemUtbWVhc3VyaW5nJyk7XG4gICAgdGV4dGFyZWEucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlclRleHQ7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLl9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWEpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9wcmV2aW91c1ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fcHJldmlvdXNNaW5Sb3dzID0gdGhpcy5fbWluUm93cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgdGhlIHRleHRhcmVhIHRvIGl0cyBvcmlnaW5hbCBzaXplXG4gICAqL1xuICByZXNldCgpIHtcbiAgICAvLyBEbyBub3QgdHJ5IHRvIGNoYW5nZSB0aGUgdGV4dGFyZWEsIGlmIHRoZSBpbml0aWFsSGVpZ2h0IGhhcyBub3QgYmVlbiBkZXRlcm1pbmVkIHlldFxuICAgIC8vIFRoaXMgbWlnaHQgcG90ZW50aWFsbHkgcmVtb3ZlIHN0eWxlcyB3aGVuIHJlc2V0KCkgaXMgY2FsbGVkIGJlZm9yZSBuZ0FmdGVyVmlld0luaXRcbiAgICBpZiAodGhpcy5faW5pdGlhbEhlaWdodCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLl9pbml0aWFsSGVpZ2h0O1xuICB9XG5cbiAgLy8gSW4gSXZ5IHRoZSBgaG9zdGAgbWV0YWRhdGEgd2lsbCBiZSBtZXJnZWQsIHdoZXJlYXMgaW4gVmlld0VuZ2luZSBpdCBpcyBvdmVycmlkZGVuLiBJbiBvcmRlclxuICAvLyB0byBhdm9pZCBkb3VibGUgZXZlbnQgbGlzdGVuZXJzLCB3ZSBuZWVkIHRvIHVzZSBgSG9zdExpc3RlbmVyYC4gT25jZSBJdnkgaXMgdGhlIGRlZmF1bHQsIHdlXG4gIC8vIGNhbiBtb3ZlIHRoaXMgYmFjayBpbnRvIGBob3N0YC5cbiAgLy8gdHNsaW50OmRpc2FibGU6bm8taG9zdC1kZWNvcmF0b3ItaW4tY29uY3JldGVcbiAgQEhvc3RMaXN0ZW5lcignaW5wdXQnKVxuICBfbm9vcElucHV0SGFuZGxlcigpIHtcbiAgICAvLyBuby1vcCBoYW5kbGVyIHRoYXQgZW5zdXJlcyB3ZSdyZSBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gaW5wdXQgZXZlbnRzLlxuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgYSB0ZXh0YXJlYSB0byB0aGUgY2FyZXQgcG9zaXRpb24uIE9uIEZpcmVmb3ggcmVzaXppbmcgdGhlIHRleHRhcmVhIHdpbGxcbiAgICogcHJldmVudCBpdCBmcm9tIHNjcm9sbGluZyB0byB0aGUgY2FyZXQgcG9zaXRpb24uIFdlIG5lZWQgdG8gcmUtc2V0IHRoZSBzZWxlY3Rpb25cbiAgICogaW4gb3JkZXIgZm9yIGl0IHRvIHNjcm9sbCB0byB0aGUgcHJvcGVyIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50KSB7XG4gICAgY29uc3Qge3NlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmR9ID0gdGV4dGFyZWE7XG5cbiAgICAvLyBJRSB3aWxsIHRocm93IGFuIFwiVW5zcGVjaWZpZWQgZXJyb3JcIiBpZiB3ZSB0cnkgdG8gc2V0IHRoZSBzZWxlY3Rpb24gcmFuZ2UgYWZ0ZXIgdGhlXG4gICAgLy8gZWxlbWVudCBoYXMgYmVlbiByZW1vdmVkIGZyb20gdGhlIERPTS4gQXNzZXJ0IHRoYXQgdGhlIGRpcmVjdGl2ZSBoYXNuJ3QgYmVlbiBkZXN0cm95ZWRcbiAgICAvLyBiZXR3ZWVuIHRoZSB0aW1lIHdlIHJlcXVlc3RlZCB0aGUgYW5pbWF0aW9uIGZyYW1lIGFuZCB3aGVuIGl0IHdhcyBleGVjdXRlZC5cbiAgICAvLyBBbHNvIG5vdGUgdGhhdCB3ZSBoYXZlIHRvIGFzc2VydCB0aGF0IHRoZSB0ZXh0YXJlYSBpcyBmb2N1c2VkIGJlZm9yZSB3ZSBzZXQgdGhlXG4gICAgLy8gc2VsZWN0aW9uIHJhbmdlLiBTZXR0aW5nIHRoZSBzZWxlY3Rpb24gcmFuZ2Ugb24gYSBub24tZm9jdXNlZCB0ZXh0YXJlYSB3aWxsIGNhdXNlXG4gICAgLy8gaXQgdG8gcmVjZWl2ZSBmb2N1cyBvbiBJRSBhbmQgRWRnZS5cbiAgICBpZiAoIXRoaXMuX2Rlc3Ryb3llZC5pc1N0b3BwZWQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gdGV4dGFyZWEpIHtcbiAgICAgIHRleHRhcmVhLnNldFNlbGVjdGlvblJhbmdlKHNlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmQpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9taW5Sb3dzOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWF4Um93czogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2VuYWJsZWQ6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xufVxuIl19