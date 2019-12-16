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
            // TODO: as any works around `height` being nullable in TS3.6, but non-null in 3.7.
            // Remove once on TS3.7.
            this._initialHeight = (/** @type {?} */ (this._textareaElement.style.height));
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
        // TODO: "as any" inserted for migration to TS3.7.
        this._textareaElement.style.height = (/** @type {?} */ (this._initialHeight));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3NpemUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b3NpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUVMLHFCQUFxQixFQUNyQixvQkFBb0IsRUFFckIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixLQUFLLEVBSUwsTUFBTSxFQUNOLFlBQVksR0FDYixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsU0FBUyxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQzs7OztBQWN4QyxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFtRDlCLFlBQ1UsV0FBb0MsRUFDcEMsU0FBbUIsRUFDbkIsT0FBZTtRQUZmLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUNwQyxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFsRFIsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFJMUMsYUFBUSxHQUFZLElBQUksQ0FBQzs7Ozs7O1FBT3pCLHFCQUFnQixHQUFXLENBQUMsQ0FBQyxDQUFDO1FBd0NwQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQXVCLENBQUM7SUFDaEYsQ0FBQzs7Ozs7SUFwQ0QsSUFDSSxPQUFPLEtBQWEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFDL0MsSUFBSSxPQUFPLENBQUMsS0FBYTtRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDOzs7OztJQUdELElBQ0ksT0FBTyxLQUFhLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBQy9DLElBQUksT0FBTyxDQUFDLEtBQWE7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkIsQ0FBQzs7Ozs7SUFHRCxJQUNJLE9BQU8sS0FBYyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7OztJQUNoRCxJQUFJLE9BQU8sQ0FBQyxLQUFjO1FBQ3hCLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVyQywyRUFBMkU7UUFDM0UsNkRBQTZEO1FBQzdELElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7WUFDM0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN4RTtJQUNILENBQUM7Ozs7O0lBYUQsYUFBYTs7Y0FDTCxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN0RCxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFFdkQsSUFBSSxTQUFTLEVBQUc7WUFDZCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7U0FDbkQ7SUFDSCxDQUFDOzs7OztJQUdELGFBQWE7O2NBQ0wsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDdEQsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBRXZELElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1NBQ25EO0lBQ0gsQ0FBQzs7OztJQUVELGVBQWU7UUFDYixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzVCLDJFQUEyRTtZQUMzRSxtRkFBbUY7WUFDbkYsd0JBQXdCO1lBQ3hCLElBQUksQ0FBQyxjQUFjLEdBQUcsbUJBQUEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQU8sQ0FBQztZQUVoRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUUxQixJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQjs7O1lBQUMsR0FBRyxFQUFFO2dCQUNsQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztxQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUMvQyxTQUFTOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFDLENBQUM7WUFDcEQsQ0FBQyxFQUFDLENBQUM7U0FDSjtJQUNILENBQUM7Ozs7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLENBQUM7Ozs7Ozs7Ozs7SUFTTyx3QkFBd0I7UUFDOUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDMUIsT0FBTztTQUNSOzs7WUFHRyxhQUFhLEdBQUcsbUJBQUEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBdUI7UUFDakYsYUFBYSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFFdkIsK0VBQStFO1FBQy9FLGdGQUFnRjtRQUNoRiwyQkFBMkI7UUFDM0IsYUFBYSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1FBQzFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztRQUMxQyxhQUFhLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDcEMsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBQ2xDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQyxhQUFhLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDbkMsYUFBYSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBRW5DLDJGQUEyRjtRQUMzRiwwRkFBMEY7UUFDMUYsMkZBQTJGO1FBQzNGLG1GQUFtRjtRQUNuRiw2RUFBNkU7UUFDN0UsYUFBYSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBRXhDLG1CQUFBLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUMsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUM7UUFDcEQsbUJBQUEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBQyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUU3RCxpRkFBaUY7UUFDakYsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDOzs7O0lBRUQsU0FBUztRQUNQLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDNUIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDM0I7SUFDSCxDQUFDOzs7Ozs7O0lBT0Qsa0JBQWtCLENBQUMsUUFBaUIsS0FBSztRQUN2Qyx1REFBdUQ7UUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFFaEMsZ0dBQWdHO1FBQ2hHLDBDQUEwQztRQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLE9BQU87U0FDUjs7Y0FFSyxRQUFRLEdBQUcsbUJBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQXVCOztjQUNoRSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUs7UUFFNUIsOEZBQThGO1FBQzlGLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsZ0JBQWdCLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDdEYsT0FBTztTQUNSOztjQUVLLGVBQWUsR0FBRyxRQUFRLENBQUMsV0FBVztRQUU1QyxpRkFBaUY7UUFDakYsNkZBQTZGO1FBQzdGLDZGQUE2RjtRQUM3RiwwRkFBMEY7UUFDMUYsa0NBQWtDO1FBQ2xDLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDMUQsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7Ozs7Y0FJcEIsTUFBTSxHQUFHLFFBQVEsQ0FBQyxZQUFZLEdBQUcsQ0FBQztRQUV4QywwRkFBMEY7UUFDMUYsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQztRQUN0QyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQzdELFFBQVEsQ0FBQyxXQUFXLEdBQUcsZUFBZSxDQUFDO1FBRXZDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7UUFBQyxHQUFHLEVBQUU7WUFDbEMsSUFBSSxPQUFPLHFCQUFxQixLQUFLLFdBQVcsRUFBRTtnQkFDaEQscUJBQXFCOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxFQUFDLENBQUM7YUFDcEU7aUJBQU07Z0JBQ0wsVUFBVTs7O2dCQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsRUFBQyxDQUFDO2FBQ3pEO1FBQ0gsQ0FBQyxFQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztRQUM1QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN4QyxDQUFDOzs7OztJQUtELEtBQUs7UUFDSCxzRkFBc0Y7UUFDdEYscUZBQXFGO1FBQ3JGLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDckMsT0FBTztTQUNSO1FBQ0Qsa0RBQWtEO1FBQ2xELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLG1CQUFBLElBQUksQ0FBQyxjQUFjLEVBQU8sQ0FBQztJQUNsRSxDQUFDOzs7Ozs7OztJQU9ELGlCQUFpQjtRQUNmLDZFQUE2RTtJQUMvRSxDQUFDOzs7Ozs7Ozs7SUFPTyxzQkFBc0IsQ0FBQyxRQUE2QjtjQUNwRCxFQUFDLGNBQWMsRUFBRSxZQUFZLEVBQUMsR0FBRyxRQUFRO1FBRS9DLHNGQUFzRjtRQUN0Rix5RkFBeUY7UUFDekYsOEVBQThFO1FBQzlFLGtGQUFrRjtRQUNsRixvRkFBb0Y7UUFDcEYsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsSUFBSSxRQUFRLENBQUMsYUFBYSxLQUFLLFFBQVEsRUFBRTtZQUNyRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQzs7O1lBaFFGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsK0JBQStCO2dCQUN6QyxRQUFRLEVBQUUscUJBQXFCO2dCQUMvQixJQUFJLEVBQUU7b0JBQ0osT0FBTyxFQUFFLHVCQUF1Qjs7O29CQUdoQyxNQUFNLEVBQUUsR0FBRztpQkFDWjthQUNGOzs7O1lBdkJDLFVBQVU7WUFRSixRQUFRO1lBSGQsTUFBTTs7O3NCQXVDTCxLQUFLLFNBQUMsb0JBQW9CO3NCQVExQixLQUFLLFNBQUMsb0JBQW9CO3NCQVExQixLQUFLLFNBQUMscUJBQXFCO2dDQTRMM0IsWUFBWSxTQUFDLE9BQU87Ozs7SUF3QnJCLDhDQUE4Qzs7SUFDOUMsOENBQThDOztJQUM5Qyw4Q0FBK0M7Ozs7OztJQXhQL0MsNkNBQWdDOzs7OztJQUNoQyw2Q0FBc0M7Ozs7O0lBQ3RDLHlDQUFrRDs7Ozs7SUFFbEQsdUNBQXlCOzs7OztJQUN6Qix1Q0FBeUI7Ozs7O0lBQ3pCLHVDQUFpQzs7Ozs7Ozs7SUFPakMsK0NBQXNDOzs7OztJQUV0QywrQ0FBOEM7Ozs7OztJQWdDOUMsZ0RBQWtDOzs7OztJQUdoQywwQ0FBNEM7Ozs7O0lBQzVDLHdDQUEyQjs7Ozs7SUFDM0Isc0NBQXVCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEJvb2xlYW5JbnB1dCxcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgTnVtYmVySW5wdXRcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5wdXQsXG4gIEFmdGVyVmlld0luaXQsXG4gIERvQ2hlY2ssXG4gIE9uRGVzdHJveSxcbiAgTmdab25lLFxuICBIb3N0TGlzdGVuZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7YXVkaXRUaW1lLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7ZnJvbUV2ZW50LCBTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuXG4vKiogRGlyZWN0aXZlIHRvIGF1dG9tYXRpY2FsbHkgcmVzaXplIGEgdGV4dGFyZWEgdG8gZml0IGl0cyBjb250ZW50LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAndGV4dGFyZWFbY2RrVGV4dGFyZWFBdXRvc2l6ZV0nLFxuICBleHBvcnRBczogJ2Nka1RleHRhcmVhQXV0b3NpemUnLFxuICBob3N0OiB7XG4gICAgJ2NsYXNzJzogJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZScsXG4gICAgLy8gVGV4dGFyZWEgZWxlbWVudHMgdGhhdCBoYXZlIHRoZSBkaXJlY3RpdmUgYXBwbGllZCBzaG91bGQgaGF2ZSBhIHNpbmdsZSByb3cgYnkgZGVmYXVsdC5cbiAgICAvLyBCcm93c2VycyBub3JtYWxseSBzaG93IHR3byByb3dzIGJ5IGRlZmF1bHQgYW5kIHRoZXJlZm9yZSB0aGlzIGxpbWl0cyB0aGUgbWluUm93cyBiaW5kaW5nLlxuICAgICdyb3dzJzogJzEnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUZXh0YXJlYUF1dG9zaXplIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgRG9DaGVjaywgT25EZXN0cm95IHtcbiAgLyoqIEtlZXAgdHJhY2sgb2YgdGhlIHByZXZpb3VzIHRleHRhcmVhIHZhbHVlIHRvIGF2b2lkIHJlc2l6aW5nIHdoZW4gdGhlIHZhbHVlIGhhc24ndCBjaGFuZ2VkLiAqL1xuICBwcml2YXRlIF9wcmV2aW91c1ZhbHVlPzogc3RyaW5nO1xuICBwcml2YXRlIF9pbml0aWFsSGVpZ2h0OiBzdHJpbmcgfCBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX21pblJvd3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWF4Um93czogbnVtYmVyO1xuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogVmFsdWUgb2YgbWluUm93cyBhcyBvZiBsYXN0IHJlc2l6ZS4gSWYgdGhlIG1pblJvd3MgaGFzIGRlY3JlYXNlZCwgdGhlXG4gICAqIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byByZWZsZWN0IHRoZSBuZXcgbWluaW11bS4gVGhlIG1heEhlaWdodFxuICAgKiBkb2VzIG5vdCBoYXZlIHRoZSBzYW1lIHByb2JsZW0gYmVjYXVzZSBpdCBkb2VzIG5vdCBhZmZlY3QgdGhlIHRleHRhcmVhJ3Mgc2Nyb2xsSGVpZ2h0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNNaW5Sb3dzOiBudW1iZXIgPSAtMTtcblxuICBwcml2YXRlIF90ZXh0YXJlYUVsZW1lbnQ6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgLyoqIE1pbmltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWluUm93cycpXG4gIGdldCBtaW5Sb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5Sb3dzOyB9XG4gIHNldCBtaW5Sb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9taW5Sb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1pbkhlaWdodCgpO1xuICB9XG5cbiAgLyoqIE1heGltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWF4Um93cycpXG4gIGdldCBtYXhSb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhSb3dzOyB9XG4gIHNldCBtYXhSb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9tYXhSb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYXV0b3NpemluZyBpcyBlbmFibGVkIG9yIG5vdCAqL1xuICBASW5wdXQoJ2Nka1RleHRhcmVhQXV0b3NpemUnKVxuICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7IH1cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB2YWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICAvLyBPbmx5IGFjdCBpZiB0aGUgYWN0dWFsIHZhbHVlIGNoYW5nZWQuIFRoaXMgc3BlY2lmaWNhbGx5IGhlbHBzIHRvIG5vdCBydW5cbiAgICAvLyByZXNpemVUb0ZpdENvbnRlbnQgdG9vIGVhcmx5IChpLmUuIGJlZm9yZSBuZ0FmdGVyVmlld0luaXQpXG4gICAgaWYgKHRoaXMuX2VuYWJsZWQgIT09IHZhbHVlKSB7XG4gICAgICAodGhpcy5fZW5hYmxlZCA9IHZhbHVlKSA/IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpIDogdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZWQgaGVpZ2h0IG9mIGEgdGV4dGFyZWEgd2l0aCBhIHNpbmdsZSByb3cuICovXG4gIHByaXZhdGUgX2NhY2hlZExpbmVIZWlnaHQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcbiAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBtaW5pbXVtIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgYXMgZGV0ZXJtaW5lZCBieSBtaW5Sb3dzLiAqL1xuICBfc2V0TWluSGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IG1pbkhlaWdodCA9IHRoaXMubWluUm93cyAmJiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID9cbiAgICAgICAgYCR7dGhpcy5taW5Sb3dzICogdGhpcy5fY2FjaGVkTGluZUhlaWdodH1weGAgOiBudWxsO1xuXG4gICAgaWYgKG1pbkhlaWdodCkgIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYSBhcyBkZXRlcm1pbmVkIGJ5IG1heFJvd3MuICovXG4gIF9zZXRNYXhIZWlnaHQoKTogdm9pZCB7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5tYXhSb3dzICYmIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgP1xuICAgICAgICBgJHt0aGlzLm1heFJvd3MgKiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0fXB4YCA6IG51bGw7XG5cbiAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBSZW1lbWJlciB0aGUgaGVpZ2h0IHdoaWNoIHdlIHN0YXJ0ZWQgd2l0aCBpbiBjYXNlIGF1dG9zaXppbmcgaXMgZGlzYWJsZWRcbiAgICAgIC8vIFRPRE86IGFzIGFueSB3b3JrcyBhcm91bmQgYGhlaWdodGAgYmVpbmcgbnVsbGFibGUgaW4gVFMzLjYsIGJ1dCBub24tbnVsbCBpbiAzLjcuXG4gICAgICAvLyBSZW1vdmUgb25jZSBvbiBUUzMuNy5cbiAgICAgIHRoaXMuX2luaXRpYWxIZWlnaHQgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0IGFzIGFueTtcblxuICAgICAgdGhpcy5yZXNpemVUb0ZpdENvbnRlbnQoKTtcblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpXG4gICAgICAgICAgLnBpcGUoYXVkaXRUaW1lKDE2KSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCh0cnVlKSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhY2hlIHRoZSBoZWlnaHQgb2YgYSBzaW5nbGUtcm93IHRleHRhcmVhIGlmIGl0IGhhcyBub3QgYWxyZWFkeSBiZWVuIGNhY2hlZC5cbiAgICpcbiAgICogV2UgbmVlZCB0byBrbm93IGhvdyBsYXJnZSBhIHNpbmdsZSBcInJvd1wiIG9mIGEgdGV4dGFyZWEgaXMgaW4gb3JkZXIgdG8gYXBwbHkgbWluUm93cyBhbmRcbiAgICogbWF4Um93cy4gRm9yIHRoZSBpbml0aWFsIHZlcnNpb24sIHdlIHdpbGwgYXNzdW1lIHRoYXQgdGhlIGhlaWdodCBvZiBhIHNpbmdsZSBsaW5lIGluIHRoZVxuICAgKiB0ZXh0YXJlYSBkb2VzIG5vdCBldmVyIGNoYW5nZS5cbiAgICovXG4gIHByaXZhdGUgX2NhY2hlVGV4dGFyZWFMaW5lSGVpZ2h0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVXNlIGEgY2xvbmUgZWxlbWVudCBiZWNhdXNlIHdlIGhhdmUgdG8gb3ZlcnJpZGUgc29tZSBzdHlsZXMuXG4gICAgbGV0IHRleHRhcmVhQ2xvbmUgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuY2xvbmVOb2RlKGZhbHNlKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICAgIHRleHRhcmVhQ2xvbmUucm93cyA9IDE7XG5cbiAgICAvLyBVc2UgYHBvc2l0aW9uOiBhYnNvbHV0ZWAgc28gdGhhdCB0aGlzIGRvZXNuJ3QgY2F1c2UgYSBicm93c2VyIGxheW91dCBhbmQgdXNlXG4gICAgLy8gYHZpc2liaWxpdHk6IGhpZGRlbmAgc28gdGhhdCBub3RoaW5nIGlzIHJlbmRlcmVkLiBDbGVhciBhbnkgb3RoZXIgc3R5bGVzIHRoYXRcbiAgICAvLyB3b3VsZCBhZmZlY3QgdGhlIGhlaWdodC5cbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLmJvcmRlciA9ICdub25lJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLnBhZGRpbmcgPSAnMCc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5oZWlnaHQgPSAnJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLm1pbkhlaWdodCA9ICcnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUubWF4SGVpZ2h0ID0gJyc7XG5cbiAgICAvLyBJbiBGaXJlZm94IGl0IGhhcHBlbnMgdGhhdCB0ZXh0YXJlYSBlbGVtZW50cyBhcmUgYWx3YXlzIGJpZ2dlciB0aGFuIHRoZSBzcGVjaWZpZWQgYW1vdW50XG4gICAgLy8gb2Ygcm93cy4gVGhpcyBpcyBiZWNhdXNlIEZpcmVmb3ggdHJpZXMgdG8gYWRkIGV4dHJhIHNwYWNlIGZvciB0aGUgaG9yaXpvbnRhbCBzY3JvbGxiYXIuXG4gICAgLy8gQXMgYSB3b3JrYXJvdW5kIHRoYXQgcmVtb3ZlcyB0aGUgZXh0cmEgc3BhY2UgZm9yIHRoZSBzY3JvbGxiYXIsIHdlIGNhbiBqdXN0IHNldCBvdmVyZmxvd1xuICAgIC8vIHRvIGhpZGRlbi4gVGhpcyBlbnN1cmVzIHRoYXQgdGhlcmUgaXMgbm8gaW52YWxpZCBjYWxjdWxhdGlvbiBvZiB0aGUgbGluZSBoZWlnaHQuXG4gICAgLy8gU2VlIEZpcmVmb3ggYnVnIHJlcG9ydDogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MzM2NTRcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQucGFyZW50Tm9kZSEuYXBwZW5kQ2hpbGQodGV4dGFyZWFDbG9uZSk7XG4gICAgdGhpcy5fY2FjaGVkTGluZUhlaWdodCA9IHRleHRhcmVhQ2xvbmUuY2xpZW50SGVpZ2h0O1xuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZCh0ZXh0YXJlYUNsb25lKTtcblxuICAgIC8vIE1pbiBhbmQgbWF4IGhlaWdodHMgaGF2ZSB0byBiZSByZS1jYWxjdWxhdGVkIGlmIHRoZSBjYWNoZWQgbGluZSBoZWlnaHQgY2hhbmdlc1xuICAgIHRoaXMuX3NldE1pbkhlaWdodCgpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHRoaXMucmVzaXplVG9GaXRDb250ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2l6ZSB0aGUgdGV4dGFyZWEgdG8gZml0IGl0cyBjb250ZW50LlxuICAgKiBAcGFyYW0gZm9yY2UgV2hldGhlciB0byBmb3JjZSBhIGhlaWdodCByZWNhbGN1bGF0aW9uLiBCeSBkZWZhdWx0IHRoZSBoZWlnaHQgd2lsbCBiZVxuICAgKiAgICByZWNhbGN1bGF0ZWQgb25seSBpZiB0aGUgdmFsdWUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjYWxsLlxuICAgKi9cbiAgcmVzaXplVG9GaXRDb250ZW50KGZvcmNlOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAvLyBJZiBhdXRvc2l6aW5nIGlzIGRpc2FibGVkLCBqdXN0IHNraXAgZXZlcnl0aGluZyBlbHNlXG4gICAgaWYgKCF0aGlzLl9lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVUZXh0YXJlYUxpbmVIZWlnaHQoKTtcblxuICAgIC8vIElmIHdlIGhhdmVuJ3QgZGV0ZXJtaW5lZCB0aGUgbGluZS1oZWlnaHQgeWV0LCB3ZSBrbm93IHdlJ3JlIHN0aWxsIGhpZGRlbiBhbmQgdGhlcmUncyBubyBwb2ludFxuICAgIC8vIGluIGNoZWNraW5nIHRoZSBoZWlnaHQgb2YgdGhlIHRleHRhcmVhLlxuICAgIGlmICghdGhpcy5fY2FjaGVkTGluZUhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgY29uc3QgdmFsdWUgPSB0ZXh0YXJlYS52YWx1ZTtcblxuICAgIC8vIE9ubHkgcmVzaXplIGlmIHRoZSB2YWx1ZSBvciBtaW5Sb3dzIGhhdmUgY2hhbmdlZCBzaW5jZSB0aGVzZSBjYWxjdWxhdGlvbnMgY2FuIGJlIGV4cGVuc2l2ZS5cbiAgICBpZiAoIWZvcmNlICYmIHRoaXMuX21pblJvd3MgPT09IHRoaXMuX3ByZXZpb3VzTWluUm93cyAmJiB2YWx1ZSA9PT0gdGhpcy5fcHJldmlvdXNWYWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBsYWNlaG9sZGVyVGV4dCA9IHRleHRhcmVhLnBsYWNlaG9sZGVyO1xuXG4gICAgLy8gUmVzZXQgdGhlIHRleHRhcmVhIGhlaWdodCB0byBhdXRvIGluIG9yZGVyIHRvIHNocmluayBiYWNrIHRvIGl0cyBkZWZhdWx0IHNpemUuXG4gICAgLy8gQWxzbyB0ZW1wb3JhcmlseSBmb3JjZSBvdmVyZmxvdzpoaWRkZW4sIHNvIHNjcm9sbCBiYXJzIGRvIG5vdCBpbnRlcmZlcmUgd2l0aCBjYWxjdWxhdGlvbnMuXG4gICAgLy8gTG9uZyBwbGFjZWhvbGRlcnMgdGhhdCBhcmUgd2lkZXIgdGhhbiB0aGUgdGV4dGFyZWEgd2lkdGggbWF5IGxlYWQgdG8gYSBiaWdnZXIgc2Nyb2xsSGVpZ2h0XG4gICAgLy8gdmFsdWUuIFRvIGVuc3VyZSB0aGF0IHRoZSBzY3JvbGxIZWlnaHQgaXMgbm90IGJpZ2dlciB0aGFuIHRoZSBjb250ZW50LCB0aGUgcGxhY2Vob2xkZXJzXG4gICAgLy8gbmVlZCB0byBiZSByZW1vdmVkIHRlbXBvcmFyaWx5LlxuICAgIHRleHRhcmVhLmNsYXNzTGlzdC5hZGQoJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZS1tZWFzdXJpbmcnKTtcbiAgICB0ZXh0YXJlYS5wbGFjZWhvbGRlciA9ICcnO1xuXG4gICAgLy8gVGhlIGNkay10ZXh0YXJlYS1hdXRvc2l6ZS1tZWFzdXJpbmcgY2xhc3MgaW5jbHVkZXMgYSAycHggcGFkZGluZyB0byB3b3JrYXJvdW5kIGFuIGlzc3VlIHdpdGhcbiAgICAvLyBDaHJvbWUsIHNvIHdlIGFjY291bnQgZm9yIHRoYXQgZXh0cmEgc3BhY2UgaGVyZSBieSBzdWJ0cmFjdGluZyA0ICgycHggdG9wICsgMnB4IGJvdHRvbSkuXG4gICAgY29uc3QgaGVpZ2h0ID0gdGV4dGFyZWEuc2Nyb2xsSGVpZ2h0IC0gNDtcblxuICAgIC8vIFVzZSB0aGUgc2Nyb2xsSGVpZ2h0IHRvIGtub3cgaG93IGxhcmdlIHRoZSB0ZXh0YXJlYSAqd291bGQqIGJlIGlmIGZpdCBpdHMgZW50aXJlIHZhbHVlLlxuICAgIHRleHRhcmVhLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgdGV4dGFyZWEuY2xhc3NMaXN0LnJlbW92ZSgnY2RrLXRleHRhcmVhLWF1dG9zaXplLW1lYXN1cmluZycpO1xuICAgIHRleHRhcmVhLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXJUZXh0O1xuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5fc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3Njcm9sbFRvQ2FyZXRQb3NpdGlvbih0ZXh0YXJlYSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fcHJldmlvdXNWYWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuX3ByZXZpb3VzTWluUm93cyA9IHRoaXMuX21pblJvd3M7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSB0ZXh0YXJlYSB0byBpdHMgb3JpZ2luYWwgc2l6ZVxuICAgKi9cbiAgcmVzZXQoKSB7XG4gICAgLy8gRG8gbm90IHRyeSB0byBjaGFuZ2UgdGhlIHRleHRhcmVhLCBpZiB0aGUgaW5pdGlhbEhlaWdodCBoYXMgbm90IGJlZW4gZGV0ZXJtaW5lZCB5ZXRcbiAgICAvLyBUaGlzIG1pZ2h0IHBvdGVudGlhbGx5IHJlbW92ZSBzdHlsZXMgd2hlbiByZXNldCgpIGlzIGNhbGxlZCBiZWZvcmUgbmdBZnRlclZpZXdJbml0XG4gICAgaWYgKHRoaXMuX2luaXRpYWxIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUT0RPOiBcImFzIGFueVwiIGluc2VydGVkIGZvciBtaWdyYXRpb24gdG8gVFMzLjcuXG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnN0eWxlLmhlaWdodCA9IHRoaXMuX2luaXRpYWxIZWlnaHQgYXMgYW55O1xuICB9XG5cbiAgLy8gSW4gSXZ5IHRoZSBgaG9zdGAgbWV0YWRhdGEgd2lsbCBiZSBtZXJnZWQsIHdoZXJlYXMgaW4gVmlld0VuZ2luZSBpdCBpcyBvdmVycmlkZGVuLiBJbiBvcmRlclxuICAvLyB0byBhdm9pZCBkb3VibGUgZXZlbnQgbGlzdGVuZXJzLCB3ZSBuZWVkIHRvIHVzZSBgSG9zdExpc3RlbmVyYC4gT25jZSBJdnkgaXMgdGhlIGRlZmF1bHQsIHdlXG4gIC8vIGNhbiBtb3ZlIHRoaXMgYmFjayBpbnRvIGBob3N0YC5cbiAgLy8gdHNsaW50OmRpc2FibGU6bm8taG9zdC1kZWNvcmF0b3ItaW4tY29uY3JldGVcbiAgQEhvc3RMaXN0ZW5lcignaW5wdXQnKVxuICBfbm9vcElucHV0SGFuZGxlcigpIHtcbiAgICAvLyBuby1vcCBoYW5kbGVyIHRoYXQgZW5zdXJlcyB3ZSdyZSBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gaW5wdXQgZXZlbnRzLlxuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgYSB0ZXh0YXJlYSB0byB0aGUgY2FyZXQgcG9zaXRpb24uIE9uIEZpcmVmb3ggcmVzaXppbmcgdGhlIHRleHRhcmVhIHdpbGxcbiAgICogcHJldmVudCBpdCBmcm9tIHNjcm9sbGluZyB0byB0aGUgY2FyZXQgcG9zaXRpb24uIFdlIG5lZWQgdG8gcmUtc2V0IHRoZSBzZWxlY3Rpb25cbiAgICogaW4gb3JkZXIgZm9yIGl0IHRvIHNjcm9sbCB0byB0aGUgcHJvcGVyIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50KSB7XG4gICAgY29uc3Qge3NlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmR9ID0gdGV4dGFyZWE7XG5cbiAgICAvLyBJRSB3aWxsIHRocm93IGFuIFwiVW5zcGVjaWZpZWQgZXJyb3JcIiBpZiB3ZSB0cnkgdG8gc2V0IHRoZSBzZWxlY3Rpb24gcmFuZ2UgYWZ0ZXIgdGhlXG4gICAgLy8gZWxlbWVudCBoYXMgYmVlbiByZW1vdmVkIGZyb20gdGhlIERPTS4gQXNzZXJ0IHRoYXQgdGhlIGRpcmVjdGl2ZSBoYXNuJ3QgYmVlbiBkZXN0cm95ZWRcbiAgICAvLyBiZXR3ZWVuIHRoZSB0aW1lIHdlIHJlcXVlc3RlZCB0aGUgYW5pbWF0aW9uIGZyYW1lIGFuZCB3aGVuIGl0IHdhcyBleGVjdXRlZC5cbiAgICAvLyBBbHNvIG5vdGUgdGhhdCB3ZSBoYXZlIHRvIGFzc2VydCB0aGF0IHRoZSB0ZXh0YXJlYSBpcyBmb2N1c2VkIGJlZm9yZSB3ZSBzZXQgdGhlXG4gICAgLy8gc2VsZWN0aW9uIHJhbmdlLiBTZXR0aW5nIHRoZSBzZWxlY3Rpb24gcmFuZ2Ugb24gYSBub24tZm9jdXNlZCB0ZXh0YXJlYSB3aWxsIGNhdXNlXG4gICAgLy8gaXQgdG8gcmVjZWl2ZSBmb2N1cyBvbiBJRSBhbmQgRWRnZS5cbiAgICBpZiAoIXRoaXMuX2Rlc3Ryb3llZC5pc1N0b3BwZWQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gdGV4dGFyZWEpIHtcbiAgICAgIHRleHRhcmVhLnNldFNlbGVjdGlvblJhbmdlKHNlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmQpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9taW5Sb3dzOiBOdW1iZXJJbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX21heFJvd3M6IE51bWJlcklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZW5hYmxlZDogQm9vbGVhbklucHV0O1xufVxuIl19