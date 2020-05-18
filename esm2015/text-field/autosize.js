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
import { Directive, ElementRef, Input, NgZone, HostListener, Optional, Inject, } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { auditTime, takeUntil } from 'rxjs/operators';
import { fromEvent, Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';
/**
 * Directive to automatically resize a textarea to fit its content.
 */
let CdkTextareaAutosize = /** @class */ (() => {
    /**
     * Directive to automatically resize a textarea to fit its content.
     */
    class CdkTextareaAutosize {
        /**
         * @param {?} _elementRef
         * @param {?} _platform
         * @param {?} _ngZone
         * @param {?=} document
         */
        constructor(_elementRef, _platform, _ngZone, 
        /** @breaking-change 11.0.0 make document required */
        document) {
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
            this._document = document;
            this._textareaElement = (/** @type {?} */ (this._elementRef.nativeElement));
            this._measuringClass = _platform.FIREFOX ?
                'cdk-textarea-autosize-measuring-firefox' :
                'cdk-textarea-autosize-measuring';
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
                    /** @type {?} */
                    const window = this._getWindow();
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
            textarea.classList.add(this._measuringClass);
            textarea.placeholder = '';
            // The measuring class includes a 2px padding to workaround an issue with Chrome,
            // so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
            /** @type {?} */
            const height = textarea.scrollHeight - 4;
            // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
            textarea.style.height = `${height}px`;
            textarea.classList.remove(this._measuringClass);
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
         * Access injected document if available or fallback to global document reference
         * @private
         * @return {?}
         */
        _getDocument() {
            return this._document || document;
        }
        /**
         * Use defaultView of injected document if available or fallback to global window reference
         * @private
         * @return {?}
         */
        _getWindow() {
            /** @type {?} */
            const doc = this._getDocument();
            return doc.defaultView || window;
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
            /** @type {?} */
            const document = this._getDocument();
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
        { type: NgZone },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [DOCUMENT,] }] }
    ];
    CdkTextareaAutosize.propDecorators = {
        minRows: [{ type: Input, args: ['cdkAutosizeMinRows',] }],
        maxRows: [{ type: Input, args: ['cdkAutosizeMaxRows',] }],
        enabled: [{ type: Input, args: ['cdkTextareaAutosize',] }],
        _noopInputHandler: [{ type: HostListener, args: ['input',] }]
    };
    return CdkTextareaAutosize;
})();
export { CdkTextareaAutosize };
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
     * Used to reference correct document/window
     * @type {?}
     * @protected
     */
    CdkTextareaAutosize.prototype._document;
    /**
     * Class that should be applied to the textarea while it's being measured.
     * @type {?}
     * @private
     */
    CdkTextareaAutosize.prototype._measuringClass;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3NpemUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b3NpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUVMLHFCQUFxQixFQUNyQixvQkFBb0IsRUFFckIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixLQUFLLEVBSUwsTUFBTSxFQUNOLFlBQVksRUFDWixRQUFRLEVBQ1IsTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7OztBQUd6Qzs7OztJQUFBLE1BVWEsbUJBQW1COzs7Ozs7O1FBeUQ5QixZQUFvQixXQUFvQyxFQUNwQyxTQUFtQixFQUNuQixPQUFlO1FBQ3ZCLHFEQUFxRDtRQUN2QixRQUFjO1lBSnBDLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtZQUNwQyxjQUFTLEdBQVQsU0FBUyxDQUFVO1lBQ25CLFlBQU8sR0FBUCxPQUFPLENBQVE7WUF2RGxCLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1lBSTFDLGFBQVEsR0FBWSxJQUFJLENBQUM7Ozs7OztZQU96QixxQkFBZ0IsR0FBVyxDQUFDLENBQUMsQ0FBQztZQStDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFFMUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLG1CQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUF1QixDQUFDO1lBQzlFLElBQUksQ0FB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OztJQUdsQyx3Q0FBK0I7Ozs7OztJQUcvQiw4Q0FBZ0M7Ozs7O0lBRXBCLDBDQUE0Qzs7Ozs7SUFDNUMsd0NBQTJCOzs7OztJQUMzQixzQ0FBdUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQm9vbGVhbklucHV0LFxuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBOdW1iZXJJbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgRG9DaGVjayxcbiAgT25EZXN0cm95LFxuICBOZ1pvbmUsXG4gIEhvc3RMaXN0ZW5lcixcbiAgT3B0aW9uYWwsXG4gIEluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHthdWRpdFRpbWUsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuLyoqIERpcmVjdGl2ZSB0byBhdXRvbWF0aWNhbGx5IHJlc2l6ZSBhIHRleHRhcmVhIHRvIGZpdCBpdHMgY29udGVudC4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ3RleHRhcmVhW2Nka1RleHRhcmVhQXV0b3NpemVdJyxcbiAgZXhwb3J0QXM6ICdjZGtUZXh0YXJlYUF1dG9zaXplJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdGV4dGFyZWEtYXV0b3NpemUnLFxuICAgIC8vIFRleHRhcmVhIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgZGlyZWN0aXZlIGFwcGxpZWQgc2hvdWxkIGhhdmUgYSBzaW5nbGUgcm93IGJ5IGRlZmF1bHQuXG4gICAgLy8gQnJvd3NlcnMgbm9ybWFsbHkgc2hvdyB0d28gcm93cyBieSBkZWZhdWx0IGFuZCB0aGVyZWZvcmUgdGhpcyBsaW1pdHMgdGhlIG1pblJvd3MgYmluZGluZy5cbiAgICAncm93cyc6ICcxJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGV4dGFyZWFBdXRvc2l6ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBLZWVwIHRyYWNrIG9mIHRoZSBwcmV2aW91cyB0ZXh0YXJlYSB2YWx1ZSB0byBhdm9pZCByZXNpemluZyB3aGVuIHRoZSB2YWx1ZSBoYXNuJ3QgY2hhbmdlZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNWYWx1ZT86IHN0cmluZztcbiAgcHJpdmF0ZSBfaW5pdGlhbEhlaWdodDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX21pblJvd3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWF4Um93czogbnVtYmVyO1xuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogVmFsdWUgb2YgbWluUm93cyBhcyBvZiBsYXN0IHJlc2l6ZS4gSWYgdGhlIG1pblJvd3MgaGFzIGRlY3JlYXNlZCwgdGhlXG4gICAqIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byByZWZsZWN0IHRoZSBuZXcgbWluaW11bS4gVGhlIG1heEhlaWdodFxuICAgKiBkb2VzIG5vdCBoYXZlIHRoZSBzYW1lIHByb2JsZW0gYmVjYXVzZSBpdCBkb2VzIG5vdCBhZmZlY3QgdGhlIHRleHRhcmVhJ3Mgc2Nyb2xsSGVpZ2h0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNNaW5Sb3dzOiBudW1iZXIgPSAtMTtcblxuICBwcml2YXRlIF90ZXh0YXJlYUVsZW1lbnQ6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgLyoqIE1pbmltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWluUm93cycpXG4gIGdldCBtaW5Sb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5Sb3dzOyB9XG4gIHNldCBtaW5Sb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9taW5Sb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1pbkhlaWdodCgpO1xuICB9XG5cbiAgLyoqIE1heGltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWF4Um93cycpXG4gIGdldCBtYXhSb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhSb3dzOyB9XG4gIHNldCBtYXhSb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9tYXhSb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYXV0b3NpemluZyBpcyBlbmFibGVkIG9yIG5vdCAqL1xuICBASW5wdXQoJ2Nka1RleHRhcmVhQXV0b3NpemUnKVxuICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7IH1cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB2YWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICAvLyBPbmx5IGFjdCBpZiB0aGUgYWN0dWFsIHZhbHVlIGNoYW5nZWQuIFRoaXMgc3BlY2lmaWNhbGx5IGhlbHBzIHRvIG5vdCBydW5cbiAgICAvLyByZXNpemVUb0ZpdENvbnRlbnQgdG9vIGVhcmx5IChpLmUuIGJlZm9yZSBuZ0FmdGVyVmlld0luaXQpXG4gICAgaWYgKHRoaXMuX2VuYWJsZWQgIT09IHZhbHVlKSB7XG4gICAgICAodGhpcy5fZW5hYmxlZCA9IHZhbHVlKSA/IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpIDogdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWNoZWQgaGVpZ2h0IG9mIGEgdGV4dGFyZWEgd2l0aCBhIHNpbmdsZSByb3cuICovXG4gIHByaXZhdGUgX2NhY2hlZExpbmVIZWlnaHQ6IG51bWJlcjtcblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIC8qKiBDbGFzcyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkIHRvIHRoZSB0ZXh0YXJlYSB3aGlsZSBpdCdzIGJlaW5nIG1lYXN1cmVkLiAqL1xuICBwcml2YXRlIF9tZWFzdXJpbmdDbGFzczogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudD86IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG5cbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICB0aGlzLl9tZWFzdXJpbmdDbGFzcyA9IF9wbGF0Zm9ybS5GSVJFRk9YID9cbiAgICAgICdjZGstdGV4dGFyZWEtYXV0b3NpemUtbWVhc3VyaW5nLWZpcmVmb3gnIDpcbiAgICAgICdjZGstdGV4dGFyZWEtYXV0b3NpemUtbWVhc3VyaW5nJztcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBtaW5pbXVtIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgYXMgZGV0ZXJtaW5lZCBieSBtaW5Sb3dzLiAqL1xuICBfc2V0TWluSGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IG1pbkhlaWdodCA9IHRoaXMubWluUm93cyAmJiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID9cbiAgICAgICAgYCR7dGhpcy5taW5Sb3dzICogdGhpcy5fY2FjaGVkTGluZUhlaWdodH1weGAgOiBudWxsO1xuXG4gICAgaWYgKG1pbkhlaWdodCkgIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYSBhcyBkZXRlcm1pbmVkIGJ5IG1heFJvd3MuICovXG4gIF9zZXRNYXhIZWlnaHQoKTogdm9pZCB7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5tYXhSb3dzICYmIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgP1xuICAgICAgICBgJHt0aGlzLm1heFJvd3MgKiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0fXB4YCA6IG51bGw7XG5cbiAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBSZW1lbWJlciB0aGUgaGVpZ2h0IHdoaWNoIHdlIHN0YXJ0ZWQgd2l0aCBpbiBjYXNlIGF1dG9zaXppbmcgaXMgZGlzYWJsZWRcbiAgICAgIHRoaXMuX2luaXRpYWxIZWlnaHQgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0O1xuXG4gICAgICB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCgpO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgICAgICBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJylcbiAgICAgICAgICAucGlwZShhdWRpdFRpbWUoMTYpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FjaGUgdGhlIGhlaWdodCBvZiBhIHNpbmdsZS1yb3cgdGV4dGFyZWEgaWYgaXQgaGFzIG5vdCBhbHJlYWR5IGJlZW4gY2FjaGVkLlxuICAgKlxuICAgKiBXZSBuZWVkIHRvIGtub3cgaG93IGxhcmdlIGEgc2luZ2xlIFwicm93XCIgb2YgYSB0ZXh0YXJlYSBpcyBpbiBvcmRlciB0byBhcHBseSBtaW5Sb3dzIGFuZFxuICAgKiBtYXhSb3dzLiBGb3IgdGhlIGluaXRpYWwgdmVyc2lvbiwgd2Ugd2lsbCBhc3N1bWUgdGhhdCB0aGUgaGVpZ2h0IG9mIGEgc2luZ2xlIGxpbmUgaW4gdGhlXG4gICAqIHRleHRhcmVhIGRvZXMgbm90IGV2ZXIgY2hhbmdlLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2FjaGVUZXh0YXJlYUxpbmVIZWlnaHQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2NhY2hlZExpbmVIZWlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVc2UgYSBjbG9uZSBlbGVtZW50IGJlY2F1c2Ugd2UgaGF2ZSB0byBvdmVycmlkZSBzb21lIHN0eWxlcy5cbiAgICBsZXQgdGV4dGFyZWFDbG9uZSA9IHRoaXMuX3RleHRhcmVhRWxlbWVudC5jbG9uZU5vZGUoZmFsc2UpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgdGV4dGFyZWFDbG9uZS5yb3dzID0gMTtcblxuICAgIC8vIFVzZSBgcG9zaXRpb246IGFic29sdXRlYCBzbyB0aGF0IHRoaXMgZG9lc24ndCBjYXVzZSBhIGJyb3dzZXIgbGF5b3V0IGFuZCB1c2VcbiAgICAvLyBgdmlzaWJpbGl0eTogaGlkZGVuYCBzbyB0aGF0IG5vdGhpbmcgaXMgcmVuZGVyZWQuIENsZWFyIGFueSBvdGhlciBzdHlsZXMgdGhhdFxuICAgIC8vIHdvdWxkIGFmZmVjdCB0aGUgaGVpZ2h0LlxuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUuYm9yZGVyID0gJ25vbmUnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUucGFkZGluZyA9ICcwJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLmhlaWdodCA9ICcnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUubWluSGVpZ2h0ID0gJyc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5tYXhIZWlnaHQgPSAnJztcblxuICAgIC8vIEluIEZpcmVmb3ggaXQgaGFwcGVucyB0aGF0IHRleHRhcmVhIGVsZW1lbnRzIGFyZSBhbHdheXMgYmlnZ2VyIHRoYW4gdGhlIHNwZWNpZmllZCBhbW91bnRcbiAgICAvLyBvZiByb3dzLiBUaGlzIGlzIGJlY2F1c2UgRmlyZWZveCB0cmllcyB0byBhZGQgZXh0cmEgc3BhY2UgZm9yIHRoZSBob3Jpem9udGFsIHNjcm9sbGJhci5cbiAgICAvLyBBcyBhIHdvcmthcm91bmQgdGhhdCByZW1vdmVzIHRoZSBleHRyYSBzcGFjZSBmb3IgdGhlIHNjcm9sbGJhciwgd2UgY2FuIGp1c3Qgc2V0IG92ZXJmbG93XG4gICAgLy8gdG8gaGlkZGVuLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBubyBpbnZhbGlkIGNhbGN1bGF0aW9uIG9mIHRoZSBsaW5lIGhlaWdodC5cbiAgICAvLyBTZWUgRmlyZWZveCBidWcgcmVwb3J0OiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0zMzY1NFxuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5wYXJlbnROb2RlIS5hcHBlbmRDaGlsZCh0ZXh0YXJlYUNsb25lKTtcbiAgICB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID0gdGV4dGFyZWFDbG9uZS5jbGllbnRIZWlnaHQ7XG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHRleHRhcmVhQ2xvbmUpO1xuXG4gICAgLy8gTWluIGFuZCBtYXggaGVpZ2h0cyBoYXZlIHRvIGJlIHJlLWNhbGN1bGF0ZWQgaWYgdGhlIGNhY2hlZCBsaW5lIGhlaWdodCBjaGFuZ2VzXG4gICAgdGhpcy5fc2V0TWluSGVpZ2h0KCk7XG4gICAgdGhpcy5fc2V0TWF4SGVpZ2h0KCk7XG4gIH1cblxuICBuZ0RvQ2hlY2soKSB7XG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLmlzQnJvd3Nlcikge1xuICAgICAgdGhpcy5yZXNpemVUb0ZpdENvbnRlbnQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzaXplIHRoZSB0ZXh0YXJlYSB0byBmaXQgaXRzIGNvbnRlbnQuXG4gICAqIEBwYXJhbSBmb3JjZSBXaGV0aGVyIHRvIGZvcmNlIGEgaGVpZ2h0IHJlY2FsY3VsYXRpb24uIEJ5IGRlZmF1bHQgdGhlIGhlaWdodCB3aWxsIGJlXG4gICAqICAgIHJlY2FsY3VsYXRlZCBvbmx5IGlmIHRoZSB2YWx1ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGNhbGwuXG4gICAqL1xuICByZXNpemVUb0ZpdENvbnRlbnQoZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIC8vIElmIGF1dG9zaXppbmcgaXMgZGlzYWJsZWQsIGp1c3Qgc2tpcCBldmVyeXRoaW5nIGVsc2VcbiAgICBpZiAoIXRoaXMuX2VuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jYWNoZVRleHRhcmVhTGluZUhlaWdodCgpO1xuXG4gICAgLy8gSWYgd2UgaGF2ZW4ndCBkZXRlcm1pbmVkIHRoZSBsaW5lLWhlaWdodCB5ZXQsIHdlIGtub3cgd2UncmUgc3RpbGwgaGlkZGVuIGFuZCB0aGVyZSdzIG5vIHBvaW50XG4gICAgLy8gaW4gY2hlY2tpbmcgdGhlIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEuXG4gICAgaWYgKCF0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGV4dGFyZWEgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICBjb25zdCB2YWx1ZSA9IHRleHRhcmVhLnZhbHVlO1xuXG4gICAgLy8gT25seSByZXNpemUgaWYgdGhlIHZhbHVlIG9yIG1pblJvd3MgaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZXNlIGNhbGN1bGF0aW9ucyBjYW4gYmUgZXhwZW5zaXZlLlxuICAgIGlmICghZm9yY2UgJiYgdGhpcy5fbWluUm93cyA9PT0gdGhpcy5fcHJldmlvdXNNaW5Sb3dzICYmIHZhbHVlID09PSB0aGlzLl9wcmV2aW91c1ZhbHVlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGxhY2Vob2xkZXJUZXh0ID0gdGV4dGFyZWEucGxhY2Vob2xkZXI7XG5cbiAgICAvLyBSZXNldCB0aGUgdGV4dGFyZWEgaGVpZ2h0IHRvIGF1dG8gaW4gb3JkZXIgdG8gc2hyaW5rIGJhY2sgdG8gaXRzIGRlZmF1bHQgc2l6ZS5cbiAgICAvLyBBbHNvIHRlbXBvcmFyaWx5IGZvcmNlIG92ZXJmbG93OmhpZGRlbiwgc28gc2Nyb2xsIGJhcnMgZG8gbm90IGludGVyZmVyZSB3aXRoIGNhbGN1bGF0aW9ucy5cbiAgICAvLyBMb25nIHBsYWNlaG9sZGVycyB0aGF0IGFyZSB3aWRlciB0aGFuIHRoZSB0ZXh0YXJlYSB3aWR0aCBtYXkgbGVhZCB0byBhIGJpZ2dlciBzY3JvbGxIZWlnaHRcbiAgICAvLyB2YWx1ZS4gVG8gZW5zdXJlIHRoYXQgdGhlIHNjcm9sbEhlaWdodCBpcyBub3QgYmlnZ2VyIHRoYW4gdGhlIGNvbnRlbnQsIHRoZSBwbGFjZWhvbGRlcnNcbiAgICAvLyBuZWVkIHRvIGJlIHJlbW92ZWQgdGVtcG9yYXJpbHkuXG4gICAgdGV4dGFyZWEuY2xhc3NMaXN0LmFkZCh0aGlzLl9tZWFzdXJpbmdDbGFzcyk7XG4gICAgdGV4dGFyZWEucGxhY2Vob2xkZXIgPSAnJztcblxuICAgIC8vIFRoZSBtZWFzdXJpbmcgY2xhc3MgaW5jbHVkZXMgYSAycHggcGFkZGluZyB0byB3b3JrYXJvdW5kIGFuIGlzc3VlIHdpdGggQ2hyb21lLFxuICAgIC8vIHNvIHdlIGFjY291bnQgZm9yIHRoYXQgZXh0cmEgc3BhY2UgaGVyZSBieSBzdWJ0cmFjdGluZyA0ICgycHggdG9wICsgMnB4IGJvdHRvbSkuXG4gICAgY29uc3QgaGVpZ2h0ID0gdGV4dGFyZWEuc2Nyb2xsSGVpZ2h0IC0gNDtcblxuICAgIC8vIFVzZSB0aGUgc2Nyb2xsSGVpZ2h0IHRvIGtub3cgaG93IGxhcmdlIHRoZSB0ZXh0YXJlYSAqd291bGQqIGJlIGlmIGZpdCBpdHMgZW50aXJlIHZhbHVlLlxuICAgIHRleHRhcmVhLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgdGV4dGFyZWEuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9tZWFzdXJpbmdDbGFzcyk7XG4gICAgdGV4dGFyZWEucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlclRleHQ7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLl9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWEpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9wcmV2aW91c1ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fcHJldmlvdXNNaW5Sb3dzID0gdGhpcy5fbWluUm93cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgdGhlIHRleHRhcmVhIHRvIGl0cyBvcmlnaW5hbCBzaXplXG4gICAqL1xuICByZXNldCgpIHtcbiAgICAvLyBEbyBub3QgdHJ5IHRvIGNoYW5nZSB0aGUgdGV4dGFyZWEsIGlmIHRoZSBpbml0aWFsSGVpZ2h0IGhhcyBub3QgYmVlbiBkZXRlcm1pbmVkIHlldFxuICAgIC8vIFRoaXMgbWlnaHQgcG90ZW50aWFsbHkgcmVtb3ZlIHN0eWxlcyB3aGVuIHJlc2V0KCkgaXMgY2FsbGVkIGJlZm9yZSBuZ0FmdGVyVmlld0luaXRcbiAgICBpZiAodGhpcy5faW5pdGlhbEhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gdGhpcy5faW5pdGlhbEhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvLyBJbiBJdnkgdGhlIGBob3N0YCBtZXRhZGF0YSB3aWxsIGJlIG1lcmdlZCwgd2hlcmVhcyBpbiBWaWV3RW5naW5lIGl0IGlzIG92ZXJyaWRkZW4uIEluIG9yZGVyXG4gIC8vIHRvIGF2b2lkIGRvdWJsZSBldmVudCBsaXN0ZW5lcnMsIHdlIG5lZWQgdG8gdXNlIGBIb3N0TGlzdGVuZXJgLiBPbmNlIEl2eSBpcyB0aGUgZGVmYXVsdCwgd2VcbiAgLy8gY2FuIG1vdmUgdGhpcyBiYWNrIGludG8gYGhvc3RgLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZTpuby1ob3N0LWRlY29yYXRvci1pbi1jb25jcmV0ZVxuICBASG9zdExpc3RlbmVyKCdpbnB1dCcpXG4gIF9ub29wSW5wdXRIYW5kbGVyKCkge1xuICAgIC8vIG5vLW9wIGhhbmRsZXIgdGhhdCBlbnN1cmVzIHdlJ3JlIHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBvbiBpbnB1dCBldmVudHMuXG4gIH1cblxuICAvKiogQWNjZXNzIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgZG9jdW1lbnQgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldERvY3VtZW50KCk6IERvY3VtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fZG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gIH1cblxuICAvKiogVXNlIGRlZmF1bHRWaWV3IG9mIGluamVjdGVkIGRvY3VtZW50IGlmIGF2YWlsYWJsZSBvciBmYWxsYmFjayB0byBnbG9iYWwgd2luZG93IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXRXaW5kb3coKTogV2luZG93IHtcbiAgICBjb25zdCBkb2MgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICB9XG5cbiAgLyoqXG4gICAqIFNjcm9sbHMgYSB0ZXh0YXJlYSB0byB0aGUgY2FyZXQgcG9zaXRpb24uIE9uIEZpcmVmb3ggcmVzaXppbmcgdGhlIHRleHRhcmVhIHdpbGxcbiAgICogcHJldmVudCBpdCBmcm9tIHNjcm9sbGluZyB0byB0aGUgY2FyZXQgcG9zaXRpb24uIFdlIG5lZWQgdG8gcmUtc2V0IHRoZSBzZWxlY3Rpb25cbiAgICogaW4gb3JkZXIgZm9yIGl0IHRvIHNjcm9sbCB0byB0aGUgcHJvcGVyIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhOiBIVE1MVGV4dEFyZWFFbGVtZW50KSB7XG4gICAgY29uc3Qge3NlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmR9ID0gdGV4dGFyZWE7XG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9nZXREb2N1bWVudCgpO1xuXG4gICAgLy8gSUUgd2lsbCB0aHJvdyBhbiBcIlVuc3BlY2lmaWVkIGVycm9yXCIgaWYgd2UgdHJ5IHRvIHNldCB0aGUgc2VsZWN0aW9uIHJhbmdlIGFmdGVyIHRoZVxuICAgIC8vIGVsZW1lbnQgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIHRoZSBET00uIEFzc2VydCB0aGF0IHRoZSBkaXJlY3RpdmUgaGFzbid0IGJlZW4gZGVzdHJveWVkXG4gICAgLy8gYmV0d2VlbiB0aGUgdGltZSB3ZSByZXF1ZXN0ZWQgdGhlIGFuaW1hdGlvbiBmcmFtZSBhbmQgd2hlbiBpdCB3YXMgZXhlY3V0ZWQuXG4gICAgLy8gQWxzbyBub3RlIHRoYXQgd2UgaGF2ZSB0byBhc3NlcnQgdGhhdCB0aGUgdGV4dGFyZWEgaXMgZm9jdXNlZCBiZWZvcmUgd2Ugc2V0IHRoZVxuICAgIC8vIHNlbGVjdGlvbiByYW5nZS4gU2V0dGluZyB0aGUgc2VsZWN0aW9uIHJhbmdlIG9uIGEgbm9uLWZvY3VzZWQgdGV4dGFyZWEgd2lsbCBjYXVzZVxuICAgIC8vIGl0IHRvIHJlY2VpdmUgZm9jdXMgb24gSUUgYW5kIEVkZ2UuXG4gICAgaWYgKCF0aGlzLl9kZXN0cm95ZWQuaXNTdG9wcGVkICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IHRleHRhcmVhKSB7XG4gICAgICB0ZXh0YXJlYS5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWluUm93czogTnVtYmVySW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9tYXhSb3dzOiBOdW1iZXJJbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2VuYWJsZWQ6IEJvb2xlYW5JbnB1dDtcbn1cbiJdfQ==