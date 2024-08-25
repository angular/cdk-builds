/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Directive, ElementRef, Input, NgZone, Optional, Inject, booleanAttribute, inject, } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import { _CdkPrivateStyleLoader } from '@angular/cdk/private';
import { auditTime, takeUntil } from 'rxjs/operators';
import { fromEvent, Subject } from 'rxjs';
import { _CdkTextFieldStyleLoader } from './text-field-style-loader';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Directive to automatically resize a textarea to fit its content. */
export class CdkTextareaAutosize {
    /** Minimum amount of rows in the textarea. */
    get minRows() {
        return this._minRows;
    }
    set minRows(value) {
        this._minRows = coerceNumberProperty(value);
        this._setMinHeight();
    }
    /** Maximum amount of rows in the textarea. */
    get maxRows() {
        return this._maxRows;
    }
    set maxRows(value) {
        this._maxRows = coerceNumberProperty(value);
        this._setMaxHeight();
    }
    /** Whether autosizing is enabled or not */
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        // Only act if the actual value changed. This specifically helps to not run
        // resizeToFitContent too early (i.e. before ngAfterViewInit)
        if (this._enabled !== value) {
            (this._enabled = value) ? this.resizeToFitContent(true) : this.reset();
        }
    }
    get placeholder() {
        return this._textareaElement.placeholder;
    }
    set placeholder(value) {
        this._cachedPlaceholderHeight = undefined;
        if (value) {
            this._textareaElement.setAttribute('placeholder', value);
        }
        else {
            this._textareaElement.removeAttribute('placeholder');
        }
        this._cacheTextareaPlaceholderHeight();
    }
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
        this._isViewInited = false;
        /** Handles `focus` and `blur` events. */
        this._handleFocusEvent = (event) => {
            this._hasFocus = event.type === 'focus';
        };
        const styleLoader = inject(_CdkPrivateStyleLoader);
        styleLoader.load(_CdkTextFieldStyleLoader);
        this._document = document;
        this._textareaElement = this._elementRef.nativeElement;
    }
    /** Sets the minimum height of the textarea as determined by minRows. */
    _setMinHeight() {
        const minHeight = this.minRows && this._cachedLineHeight ? `${this.minRows * this._cachedLineHeight}px` : null;
        if (minHeight) {
            this._textareaElement.style.minHeight = minHeight;
        }
    }
    /** Sets the maximum height of the textarea as determined by maxRows. */
    _setMaxHeight() {
        const maxHeight = this.maxRows && this._cachedLineHeight ? `${this.maxRows * this._cachedLineHeight}px` : null;
        if (maxHeight) {
            this._textareaElement.style.maxHeight = maxHeight;
        }
    }
    ngAfterViewInit() {
        if (this._platform.isBrowser) {
            // Remember the height which we started with in case autosizing is disabled
            this._initialHeight = this._textareaElement.style.height;
            this.resizeToFitContent();
            this._ngZone.runOutsideAngular(() => {
                const window = this._getWindow();
                fromEvent(window, 'resize')
                    .pipe(auditTime(16), takeUntil(this._destroyed))
                    .subscribe(() => this.resizeToFitContent(true));
                this._textareaElement.addEventListener('focus', this._handleFocusEvent);
                this._textareaElement.addEventListener('blur', this._handleFocusEvent);
            });
            this._isViewInited = true;
            this.resizeToFitContent(true);
        }
    }
    ngOnDestroy() {
        this._textareaElement.removeEventListener('focus', this._handleFocusEvent);
        this._textareaElement.removeEventListener('blur', this._handleFocusEvent);
        this._destroyed.next();
        this._destroyed.complete();
    }
    /**
     * Cache the height of a single-row textarea if it has not already been cached.
     *
     * We need to know how large a single "row" of a textarea is in order to apply minRows and
     * maxRows. For the initial version, we will assume that the height of a single line in the
     * textarea does not ever change.
     */
    _cacheTextareaLineHeight() {
        if (this._cachedLineHeight) {
            return;
        }
        // Use a clone element because we have to override some styles.
        let textareaClone = this._textareaElement.cloneNode(false);
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
        this._textareaElement.parentNode.appendChild(textareaClone);
        this._cachedLineHeight = textareaClone.clientHeight;
        textareaClone.remove();
        // Min and max heights have to be re-calculated if the cached line height changes
        this._setMinHeight();
        this._setMaxHeight();
    }
    _measureScrollHeight() {
        const element = this._textareaElement;
        const previousMargin = element.style.marginBottom || '';
        const isFirefox = this._platform.FIREFOX;
        const needsMarginFiller = isFirefox && this._hasFocus;
        const measuringClass = isFirefox
            ? 'cdk-textarea-autosize-measuring-firefox'
            : 'cdk-textarea-autosize-measuring';
        // In some cases the page might move around while we're measuring the `textarea` on Firefox. We
        // work around it by assigning a temporary margin with the same height as the `textarea` so that
        // it occupies the same amount of space. See #23233.
        if (needsMarginFiller) {
            element.style.marginBottom = `${element.clientHeight}px`;
        }
        // Reset the textarea height to auto in order to shrink back to its default size.
        // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
        element.classList.add(measuringClass);
        // The measuring class includes a 2px padding to workaround an issue with Chrome,
        // so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
        const scrollHeight = element.scrollHeight - 4;
        element.classList.remove(measuringClass);
        if (needsMarginFiller) {
            element.style.marginBottom = previousMargin;
        }
        return scrollHeight;
    }
    _cacheTextareaPlaceholderHeight() {
        if (!this._isViewInited || this._cachedPlaceholderHeight != undefined) {
            return;
        }
        if (!this.placeholder) {
            this._cachedPlaceholderHeight = 0;
            return;
        }
        const value = this._textareaElement.value;
        this._textareaElement.value = this._textareaElement.placeholder;
        this._cachedPlaceholderHeight = this._measureScrollHeight();
        this._textareaElement.value = value;
    }
    ngDoCheck() {
        if (this._platform.isBrowser) {
            this.resizeToFitContent();
        }
    }
    /**
     * Resize the textarea to fit its content.
     * @param force Whether to force a height recalculation. By default the height will be
     *    recalculated only if the value changed since the last call.
     */
    resizeToFitContent(force = false) {
        // If autosizing is disabled, just skip everything else
        if (!this._enabled) {
            return;
        }
        this._cacheTextareaLineHeight();
        this._cacheTextareaPlaceholderHeight();
        // If we haven't determined the line-height yet, we know we're still hidden and there's no point
        // in checking the height of the textarea.
        if (!this._cachedLineHeight) {
            return;
        }
        const textarea = this._elementRef.nativeElement;
        const value = textarea.value;
        // Only resize if the value or minRows have changed since these calculations can be expensive.
        if (!force && this._minRows === this._previousMinRows && value === this._previousValue) {
            return;
        }
        const scrollHeight = this._measureScrollHeight();
        const height = Math.max(scrollHeight, this._cachedPlaceholderHeight || 0);
        // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
        textarea.style.height = `${height}px`;
        this._ngZone.runOutsideAngular(() => {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this._scrollToCaretPosition(textarea));
            }
            else {
                setTimeout(() => this._scrollToCaretPosition(textarea));
            }
        });
        this._previousValue = value;
        this._previousMinRows = this._minRows;
    }
    /**
     * Resets the textarea to its original size
     */
    reset() {
        // Do not try to change the textarea, if the initialHeight has not been determined yet
        // This might potentially remove styles when reset() is called before ngAfterViewInit
        if (this._initialHeight !== undefined) {
            this._textareaElement.style.height = this._initialHeight;
        }
    }
    _noopInputHandler() {
        // no-op handler that ensures we're running change detection on input events.
    }
    /** Access injected document if available or fallback to global document reference */
    _getDocument() {
        return this._document || document;
    }
    /** Use defaultView of injected document if available or fallback to global window reference */
    _getWindow() {
        const doc = this._getDocument();
        return doc.defaultView || window;
    }
    /**
     * Scrolls a textarea to the caret position. On Firefox resizing the textarea will
     * prevent it from scrolling to the caret position. We need to re-set the selection
     * in order for it to scroll to the proper position.
     */
    _scrollToCaretPosition(textarea) {
        const { selectionStart, selectionEnd } = textarea;
        // IE will throw an "Unspecified error" if we try to set the selection range after the
        // element has been removed from the DOM. Assert that the directive hasn't been destroyed
        // between the time we requested the animation frame and when it was executed.
        // Also note that we have to assert that the textarea is focused before we set the
        // selection range. Setting the selection range on a non-focused textarea will cause
        // it to receive focus on IE and Edge.
        if (!this._destroyed.isStopped && this._hasFocus) {
            textarea.setSelectionRange(selectionStart, selectionEnd);
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTextareaAutosize, deps: [{ token: i0.ElementRef }, { token: i1.Platform }, { token: i0.NgZone }, { token: DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "18.2.0-next.2", type: CdkTextareaAutosize, isStandalone: true, selector: "textarea[cdkTextareaAutosize]", inputs: { minRows: ["cdkAutosizeMinRows", "minRows"], maxRows: ["cdkAutosizeMaxRows", "maxRows"], enabled: ["cdkTextareaAutosize", "enabled", booleanAttribute], placeholder: "placeholder" }, host: { attributes: { "rows": "1" }, listeners: { "input": "_noopInputHandler()" }, classAttribute: "cdk-textarea-autosize" }, exportAs: ["cdkTextareaAutosize"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkTextareaAutosize, decorators: [{
            type: Directive,
            args: [{
                    selector: 'textarea[cdkTextareaAutosize]',
                    exportAs: 'cdkTextareaAutosize',
                    host: {
                        'class': 'cdk-textarea-autosize',
                        // Textarea elements that have the directive applied should have a single row by default.
                        // Browsers normally show two rows by default and therefore this limits the minRows binding.
                        'rows': '1',
                        '(input)': '_noopInputHandler()',
                    },
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i1.Platform }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }], propDecorators: { minRows: [{
                type: Input,
                args: ['cdkAutosizeMinRows']
            }], maxRows: [{
                type: Input,
                args: ['cdkAutosizeMaxRows']
            }], enabled: [{
                type: Input,
                args: [{ alias: 'cdkTextareaAutosize', transform: booleanAttribute }]
            }], placeholder: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3NpemUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b3NpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFjLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDeEUsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsS0FBSyxFQUlMLE1BQU0sRUFDTixRQUFRLEVBQ1IsTUFBTSxFQUNOLGdCQUFnQixFQUNoQixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDOzs7QUFFbkUsdUVBQXVFO0FBYXZFLE1BQU0sT0FBTyxtQkFBbUI7SUFtQjlCLDhDQUE4QztJQUM5QyxJQUNJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkIsQ0FBQztJQUNELElBQUksT0FBTyxDQUFDLEtBQWtCO1FBQzVCLElBQUksQ0FBQyxRQUFRLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMsSUFDSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7SUFDRCxJQUFJLE9B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STtpQkFDakI7OzBCQXNGSSxRQUFROzswQkFBSSxNQUFNOzJCQUFDLFFBQVE7eUNBaEUxQixPQUFPO3NCQURWLEtBQUs7dUJBQUMsb0JBQW9CO2dCQVd2QixPQUFPO3NCQURWLEtBQUs7dUJBQUMsb0JBQW9CO2dCQVd2QixPQUFPO3NCQURWLEtBQUs7dUJBQUMsRUFBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFDO2dCQWE5RCxXQUFXO3NCQURkLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtOdW1iZXJJbnB1dCwgY29lcmNlTnVtYmVyUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIElucHV0LFxuICBBZnRlclZpZXdJbml0LFxuICBEb0NoZWNrLFxuICBPbkRlc3Ryb3ksXG4gIE5nWm9uZSxcbiAgT3B0aW9uYWwsXG4gIEluamVjdCxcbiAgYm9vbGVhbkF0dHJpYnV0ZSxcbiAgaW5qZWN0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtfQ2RrUHJpdmF0ZVN0eWxlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jZGsvcHJpdmF0ZSc7XG5pbXBvcnQge2F1ZGl0VGltZSwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge2Zyb21FdmVudCwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge19DZGtUZXh0RmllbGRTdHlsZUxvYWRlcn0gZnJvbSAnLi90ZXh0LWZpZWxkLXN0eWxlLWxvYWRlcic7XG5cbi8qKiBEaXJlY3RpdmUgdG8gYXV0b21hdGljYWxseSByZXNpemUgYSB0ZXh0YXJlYSB0byBmaXQgaXRzIGNvbnRlbnQuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICd0ZXh0YXJlYVtjZGtUZXh0YXJlYUF1dG9zaXplXScsXG4gIGV4cG9ydEFzOiAnY2RrVGV4dGFyZWFBdXRvc2l6ZScsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnY2RrLXRleHRhcmVhLWF1dG9zaXplJyxcbiAgICAvLyBUZXh0YXJlYSBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIGRpcmVjdGl2ZSBhcHBsaWVkIHNob3VsZCBoYXZlIGEgc2luZ2xlIHJvdyBieSBkZWZhdWx0LlxuICAgIC8vIEJyb3dzZXJzIG5vcm1hbGx5IHNob3cgdHdvIHJvd3MgYnkgZGVmYXVsdCBhbmQgdGhlcmVmb3JlIHRoaXMgbGltaXRzIHRoZSBtaW5Sb3dzIGJpbmRpbmcuXG4gICAgJ3Jvd3MnOiAnMScsXG4gICAgJyhpbnB1dCknOiAnX25vb3BJbnB1dEhhbmRsZXIoKScsXG4gIH0sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka1RleHRhcmVhQXV0b3NpemUgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBEb0NoZWNrLCBPbkRlc3Ryb3kge1xuICAvKiogS2VlcCB0cmFjayBvZiB0aGUgcHJldmlvdXMgdGV4dGFyZWEgdmFsdWUgdG8gYXZvaWQgcmVzaXppbmcgd2hlbiB0aGUgdmFsdWUgaGFzbid0IGNoYW5nZWQuICovXG4gIHByaXZhdGUgX3ByZXZpb3VzVmFsdWU/OiBzdHJpbmc7XG4gIHByaXZhdGUgX2luaXRpYWxIZWlnaHQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBwcml2YXRlIF9taW5Sb3dzOiBudW1iZXI7XG4gIHByaXZhdGUgX21heFJvd3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBfZW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFZhbHVlIG9mIG1pblJvd3MgYXMgb2YgbGFzdCByZXNpemUuIElmIHRoZSBtaW5Sb3dzIGhhcyBkZWNyZWFzZWQsIHRoZVxuICAgKiBoZWlnaHQgb2YgdGhlIHRleHRhcmVhIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQgdG8gcmVmbGVjdCB0aGUgbmV3IG1pbmltdW0uIFRoZSBtYXhIZWlnaHRcbiAgICogZG9lcyBub3QgaGF2ZSB0aGUgc2FtZSBwcm9ibGVtIGJlY2F1c2UgaXQgZG9lcyBub3QgYWZmZWN0IHRoZSB0ZXh0YXJlYSdzIHNjcm9sbEhlaWdodC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzTWluUm93czogbnVtYmVyID0gLTE7XG5cbiAgcHJpdmF0ZSBfdGV4dGFyZWFFbGVtZW50OiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuXG4gIC8qKiBNaW5pbXVtIGFtb3VudCBvZiByb3dzIGluIHRoZSB0ZXh0YXJlYS4gKi9cbiAgQElucHV0KCdjZGtBdXRvc2l6ZU1pblJvd3MnKVxuICBnZXQgbWluUm93cygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9taW5Sb3dzO1xuICB9XG4gIHNldCBtaW5Sb3dzKHZhbHVlOiBOdW1iZXJJbnB1dCkge1xuICAgIHRoaXMuX21pblJvd3MgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc2V0TWluSGVpZ2h0KCk7XG4gIH1cblxuICAvKiogTWF4aW11bSBhbW91bnQgb2Ygcm93cyBpbiB0aGUgdGV4dGFyZWEuICovXG4gIEBJbnB1dCgnY2RrQXV0b3NpemVNYXhSb3dzJylcbiAgZ2V0IG1heFJvd3MoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbWF4Um93cztcbiAgfVxuICBzZXQgbWF4Um93cyh2YWx1ZTogTnVtYmVySW5wdXQpIHtcbiAgICB0aGlzLl9tYXhSb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYXV0b3NpemluZyBpcyBlbmFibGVkIG9yIG5vdCAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrVGV4dGFyZWFBdXRvc2l6ZScsIHRyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICB9XG4gIHNldCBlbmFibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgLy8gT25seSBhY3QgaWYgdGhlIGFjdHVhbCB2YWx1ZSBjaGFuZ2VkLiBUaGlzIHNwZWNpZmljYWxseSBoZWxwcyB0byBub3QgcnVuXG4gICAgLy8gcmVzaXplVG9GaXRDb250ZW50IHRvbyBlYXJseSAoaS5lLiBiZWZvcmUgbmdBZnRlclZpZXdJbml0KVxuICAgIGlmICh0aGlzLl9lbmFibGVkICE9PSB2YWx1ZSkge1xuICAgICAgKHRoaXMuX2VuYWJsZWQgPSB2YWx1ZSkgPyB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCh0cnVlKSA6IHRoaXMucmVzZXQoKTtcbiAgICB9XG4gIH1cblxuICBASW5wdXQoKVxuICBnZXQgcGxhY2Vob2xkZXIoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBsYWNlaG9sZGVyO1xuICB9XG4gIHNldCBwbGFjZWhvbGRlcih2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fY2FjaGVkUGxhY2Vob2xkZXJIZWlnaHQgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlVGV4dGFyZWFQbGFjZWhvbGRlckhlaWdodCgpO1xuICB9XG5cbiAgLyoqIENhY2hlZCBoZWlnaHQgb2YgYSB0ZXh0YXJlYSB3aXRoIGEgc2luZ2xlIHJvdy4gKi9cbiAgcHJpdmF0ZSBfY2FjaGVkTGluZUhlaWdodDogbnVtYmVyO1xuICAvKiogQ2FjaGVkIGhlaWdodCBvZiBhIHRleHRhcmVhIHdpdGggb25seSB0aGUgcGxhY2Vob2xkZXIuICovXG4gIHByaXZhdGUgX2NhY2hlZFBsYWNlaG9sZGVySGVpZ2h0PzogbnVtYmVyO1xuXG4gIC8qKiBVc2VkIHRvIHJlZmVyZW5jZSBjb3JyZWN0IGRvY3VtZW50L3dpbmRvdyAqL1xuICBwcm90ZWN0ZWQgX2RvY3VtZW50PzogRG9jdW1lbnQ7XG5cbiAgcHJpdmF0ZSBfaGFzRm9jdXM6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBfaXNWaWV3SW5pdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIC8qKiBAYnJlYWtpbmctY2hhbmdlIDExLjAuMCBtYWtlIGRvY3VtZW50IHJlcXVpcmVkICovXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ/OiBhbnksXG4gICkge1xuICAgIGNvbnN0IHN0eWxlTG9hZGVyID0gaW5qZWN0KF9DZGtQcml2YXRlU3R5bGVMb2FkZXIpO1xuICAgIHN0eWxlTG9hZGVyLmxvYWQoX0Nka1RleHRGaWVsZFN0eWxlTG9hZGVyKTtcbiAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIG1pbmltdW0gaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYSBhcyBkZXRlcm1pbmVkIGJ5IG1pblJvd3MuICovXG4gIF9zZXRNaW5IZWlnaHQoKTogdm9pZCB7XG4gICAgY29uc3QgbWluSGVpZ2h0ID1cbiAgICAgIHRoaXMubWluUm93cyAmJiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID8gYCR7dGhpcy5taW5Sb3dzICogdGhpcy5fY2FjaGVkTGluZUhlaWdodH1weGAgOiBudWxsO1xuXG4gICAgaWYgKG1pbkhlaWdodCkge1xuICAgICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9IG1pbkhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHRleHRhcmVhIGFzIGRldGVybWluZWQgYnkgbWF4Um93cy4gKi9cbiAgX3NldE1heEhlaWdodCgpOiB2b2lkIHtcbiAgICBjb25zdCBtYXhIZWlnaHQgPVxuICAgICAgdGhpcy5tYXhSb3dzICYmIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgPyBgJHt0aGlzLm1heFJvd3MgKiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0fXB4YCA6IG51bGw7XG5cbiAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBSZW1lbWJlciB0aGUgaGVpZ2h0IHdoaWNoIHdlIHN0YXJ0ZWQgd2l0aCBpbiBjYXNlIGF1dG9zaXppbmcgaXMgZGlzYWJsZWRcbiAgICAgIHRoaXMuX2luaXRpYWxIZWlnaHQgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0O1xuICAgICAgdGhpcy5yZXNpemVUb0ZpdENvbnRlbnQoKTtcblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgICAgZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpXG4gICAgICAgICAgLnBpcGUoYXVkaXRUaW1lKDE2KSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCh0cnVlKSk7XG5cbiAgICAgICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5faGFuZGxlRm9jdXNFdmVudCk7XG4gICAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5faGFuZGxlRm9jdXNFdmVudCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5faXNWaWV3SW5pdGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX2hhbmRsZUZvY3VzRXZlbnQpO1xuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5faGFuZGxlRm9jdXNFdmVudCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWNoZSB0aGUgaGVpZ2h0IG9mIGEgc2luZ2xlLXJvdyB0ZXh0YXJlYSBpZiBpdCBoYXMgbm90IGFscmVhZHkgYmVlbiBjYWNoZWQuXG4gICAqXG4gICAqIFdlIG5lZWQgdG8ga25vdyBob3cgbGFyZ2UgYSBzaW5nbGUgXCJyb3dcIiBvZiBhIHRleHRhcmVhIGlzIGluIG9yZGVyIHRvIGFwcGx5IG1pblJvd3MgYW5kXG4gICAqIG1heFJvd3MuIEZvciB0aGUgaW5pdGlhbCB2ZXJzaW9uLCB3ZSB3aWxsIGFzc3VtZSB0aGF0IHRoZSBoZWlnaHQgb2YgYSBzaW5nbGUgbGluZSBpbiB0aGVcbiAgICogdGV4dGFyZWEgZG9lcyBub3QgZXZlciBjaGFuZ2UuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZVRleHRhcmVhTGluZUhlaWdodCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fY2FjaGVkTGluZUhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFVzZSBhIGNsb25lIGVsZW1lbnQgYmVjYXVzZSB3ZSBoYXZlIHRvIG92ZXJyaWRlIHNvbWUgc3R5bGVzLlxuICAgIGxldCB0ZXh0YXJlYUNsb25lID0gdGhpcy5fdGV4dGFyZWFFbGVtZW50LmNsb25lTm9kZShmYWxzZSkgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICB0ZXh0YXJlYUNsb25lLnJvd3MgPSAxO1xuXG4gICAgLy8gVXNlIGBwb3NpdGlvbjogYWJzb2x1dGVgIHNvIHRoYXQgdGhpcyBkb2Vzbid0IGNhdXNlIGEgYnJvd3NlciBsYXlvdXQgYW5kIHVzZVxuICAgIC8vIGB2aXNpYmlsaXR5OiBoaWRkZW5gIHNvIHRoYXQgbm90aGluZyBpcyByZW5kZXJlZC4gQ2xlYXIgYW55IG90aGVyIHN0eWxlcyB0aGF0XG4gICAgLy8gd291bGQgYWZmZWN0IHRoZSBoZWlnaHQuXG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5wYWRkaW5nID0gJzAnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUuaGVpZ2h0ID0gJyc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5taW5IZWlnaHQgPSAnJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLm1heEhlaWdodCA9ICcnO1xuXG4gICAgLy8gSW4gRmlyZWZveCBpdCBoYXBwZW5zIHRoYXQgdGV4dGFyZWEgZWxlbWVudHMgYXJlIGFsd2F5cyBiaWdnZXIgdGhhbiB0aGUgc3BlY2lmaWVkIGFtb3VudFxuICAgIC8vIG9mIHJvd3MuIFRoaXMgaXMgYmVjYXVzZSBGaXJlZm94IHRyaWVzIHRvIGFkZCBleHRyYSBzcGFjZSBmb3IgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyLlxuICAgIC8vIEFzIGEgd29ya2Fyb3VuZCB0aGF0IHJlbW92ZXMgdGhlIGV4dHJhIHNwYWNlIGZvciB0aGUgc2Nyb2xsYmFyLCB3ZSBjYW4ganVzdCBzZXQgb3ZlcmZsb3dcbiAgICAvLyB0byBoaWRkZW4uIFRoaXMgZW5zdXJlcyB0aGF0IHRoZXJlIGlzIG5vIGludmFsaWQgY2FsY3VsYXRpb24gb2YgdGhlIGxpbmUgaGVpZ2h0LlxuICAgIC8vIFNlZSBGaXJlZm94IGJ1ZyByZXBvcnQ6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTMzNjU0XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBhcmVudE5vZGUhLmFwcGVuZENoaWxkKHRleHRhcmVhQ2xvbmUpO1xuICAgIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgPSB0ZXh0YXJlYUNsb25lLmNsaWVudEhlaWdodDtcbiAgICB0ZXh0YXJlYUNsb25lLnJlbW92ZSgpO1xuXG4gICAgLy8gTWluIGFuZCBtYXggaGVpZ2h0cyBoYXZlIHRvIGJlIHJlLWNhbGN1bGF0ZWQgaWYgdGhlIGNhY2hlZCBsaW5lIGhlaWdodCBjaGFuZ2VzXG4gICAgdGhpcy5fc2V0TWluSGVpZ2h0KCk7XG4gICAgdGhpcy5fc2V0TWF4SGVpZ2h0KCk7XG4gIH1cblxuICBwcml2YXRlIF9tZWFzdXJlU2Nyb2xsSGVpZ2h0KCk6IG51bWJlciB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX3RleHRhcmVhRWxlbWVudDtcbiAgICBjb25zdCBwcmV2aW91c01hcmdpbiA9IGVsZW1lbnQuc3R5bGUubWFyZ2luQm90dG9tIHx8ICcnO1xuICAgIGNvbnN0IGlzRmlyZWZveCA9IHRoaXMuX3BsYXRmb3JtLkZJUkVGT1g7XG4gICAgY29uc3QgbmVlZHNNYXJnaW5GaWxsZXIgPSBpc0ZpcmVmb3ggJiYgdGhpcy5faGFzRm9jdXM7XG4gICAgY29uc3QgbWVhc3VyaW5nQ2xhc3MgPSBpc0ZpcmVmb3hcbiAgICAgID8gJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZS1tZWFzdXJpbmctZmlyZWZveCdcbiAgICAgIDogJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZS1tZWFzdXJpbmcnO1xuXG4gICAgLy8gSW4gc29tZSBjYXNlcyB0aGUgcGFnZSBtaWdodCBtb3ZlIGFyb3VuZCB3aGlsZSB3ZSdyZSBtZWFzdXJpbmcgdGhlIGB0ZXh0YXJlYWAgb24gRmlyZWZveC4gV2VcbiAgICAvLyB3b3JrIGFyb3VuZCBpdCBieSBhc3NpZ25pbmcgYSB0ZW1wb3JhcnkgbWFyZ2luIHdpdGggdGhlIHNhbWUgaGVpZ2h0IGFzIHRoZSBgdGV4dGFyZWFgIHNvIHRoYXRcbiAgICAvLyBpdCBvY2N1cGllcyB0aGUgc2FtZSBhbW91bnQgb2Ygc3BhY2UuIFNlZSAjMjMyMzMuXG4gICAgaWYgKG5lZWRzTWFyZ2luRmlsbGVyKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLm1hcmdpbkJvdHRvbSA9IGAke2VsZW1lbnQuY2xpZW50SGVpZ2h0fXB4YDtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0aGUgdGV4dGFyZWEgaGVpZ2h0IHRvIGF1dG8gaW4gb3JkZXIgdG8gc2hyaW5rIGJhY2sgdG8gaXRzIGRlZmF1bHQgc2l6ZS5cbiAgICAvLyBBbHNvIHRlbXBvcmFyaWx5IGZvcmNlIG92ZXJmbG93OmhpZGRlbiwgc28gc2Nyb2xsIGJhcnMgZG8gbm90IGludGVyZmVyZSB3aXRoIGNhbGN1bGF0aW9ucy5cbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQobWVhc3VyaW5nQ2xhc3MpO1xuICAgIC8vIFRoZSBtZWFzdXJpbmcgY2xhc3MgaW5jbHVkZXMgYSAycHggcGFkZGluZyB0byB3b3JrYXJvdW5kIGFuIGlzc3VlIHdpdGggQ2hyb21lLFxuICAgIC8vIHNvIHdlIGFjY291bnQgZm9yIHRoYXQgZXh0cmEgc3BhY2UgaGVyZSBieSBzdWJ0cmFjdGluZyA0ICgycHggdG9wICsgMnB4IGJvdHRvbSkuXG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSA0O1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShtZWFzdXJpbmdDbGFzcyk7XG5cbiAgICBpZiAobmVlZHNNYXJnaW5GaWxsZXIpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUubWFyZ2luQm90dG9tID0gcHJldmlvdXNNYXJnaW47XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjcm9sbEhlaWdodDtcbiAgfVxuXG4gIHByaXZhdGUgX2NhY2hlVGV4dGFyZWFQbGFjZWhvbGRlckhlaWdodCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzVmlld0luaXRlZCB8fCB0aGlzLl9jYWNoZWRQbGFjZWhvbGRlckhlaWdodCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnBsYWNlaG9sZGVyKSB7XG4gICAgICB0aGlzLl9jYWNoZWRQbGFjZWhvbGRlckhlaWdodCA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQudmFsdWU7XG5cbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQudmFsdWUgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQucGxhY2Vob2xkZXI7XG4gICAgdGhpcy5fY2FjaGVkUGxhY2Vob2xkZXJIZWlnaHQgPSB0aGlzLl9tZWFzdXJlU2Nyb2xsSGVpZ2h0KCk7XG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICAvKiogSGFuZGxlcyBgZm9jdXNgIGFuZCBgYmx1cmAgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9oYW5kbGVGb2N1c0V2ZW50ID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB7XG4gICAgdGhpcy5faGFzRm9jdXMgPSBldmVudC50eXBlID09PSAnZm9jdXMnO1xuICB9O1xuXG4gIG5nRG9DaGVjaygpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNpemUgdGhlIHRleHRhcmVhIHRvIGZpdCBpdHMgY29udGVudC5cbiAgICogQHBhcmFtIGZvcmNlIFdoZXRoZXIgdG8gZm9yY2UgYSBoZWlnaHQgcmVjYWxjdWxhdGlvbi4gQnkgZGVmYXVsdCB0aGUgaGVpZ2h0IHdpbGwgYmVcbiAgICogICAgcmVjYWxjdWxhdGVkIG9ubHkgaWYgdGhlIHZhbHVlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbC5cbiAgICovXG4gIHJlc2l6ZVRvRml0Q29udGVudChmb3JjZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgLy8gSWYgYXV0b3NpemluZyBpcyBkaXNhYmxlZCwganVzdCBza2lwIGV2ZXJ5dGhpbmcgZWxzZVxuICAgIGlmICghdGhpcy5fZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlVGV4dGFyZWFMaW5lSGVpZ2h0KCk7XG4gICAgdGhpcy5fY2FjaGVUZXh0YXJlYVBsYWNlaG9sZGVySGVpZ2h0KCk7XG5cbiAgICAvLyBJZiB3ZSBoYXZlbid0IGRldGVybWluZWQgdGhlIGxpbmUtaGVpZ2h0IHlldCwgd2Uga25vdyB3ZSdyZSBzdGlsbCBoaWRkZW4gYW5kIHRoZXJlJ3Mgbm8gcG9pbnRcbiAgICAvLyBpbiBjaGVja2luZyB0aGUgaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYS5cbiAgICBpZiAoIXRoaXMuX2NhY2hlZExpbmVIZWlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0YXJlYSA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICAgIGNvbnN0IHZhbHVlID0gdGV4dGFyZWEudmFsdWU7XG5cbiAgICAvLyBPbmx5IHJlc2l6ZSBpZiB0aGUgdmFsdWUgb3IgbWluUm93cyBoYXZlIGNoYW5nZWQgc2luY2UgdGhlc2UgY2FsY3VsYXRpb25zIGNhbiBiZSBleHBlbnNpdmUuXG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLl9taW5Sb3dzID09PSB0aGlzLl9wcmV2aW91c01pblJvd3MgJiYgdmFsdWUgPT09IHRoaXMuX3ByZXZpb3VzVmFsdWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY3JvbGxIZWlnaHQgPSB0aGlzLl9tZWFzdXJlU2Nyb2xsSGVpZ2h0KCk7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoc2Nyb2xsSGVpZ2h0LCB0aGlzLl9jYWNoZWRQbGFjZWhvbGRlckhlaWdodCB8fCAwKTtcblxuICAgIC8vIFVzZSB0aGUgc2Nyb2xsSGVpZ2h0IHRvIGtub3cgaG93IGxhcmdlIHRoZSB0ZXh0YXJlYSAqd291bGQqIGJlIGlmIGZpdCBpdHMgZW50aXJlIHZhbHVlLlxuICAgIHRleHRhcmVhLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLl9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWEpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc2Nyb2xsVG9DYXJldFBvc2l0aW9uKHRleHRhcmVhKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9wcmV2aW91c1ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fcHJldmlvdXNNaW5Sb3dzID0gdGhpcy5fbWluUm93cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgdGhlIHRleHRhcmVhIHRvIGl0cyBvcmlnaW5hbCBzaXplXG4gICAqL1xuICByZXNldCgpIHtcbiAgICAvLyBEbyBub3QgdHJ5IHRvIGNoYW5nZSB0aGUgdGV4dGFyZWEsIGlmIHRoZSBpbml0aWFsSGVpZ2h0IGhhcyBub3QgYmVlbiBkZXRlcm1pbmVkIHlldFxuICAgIC8vIFRoaXMgbWlnaHQgcG90ZW50aWFsbHkgcmVtb3ZlIHN0eWxlcyB3aGVuIHJlc2V0KCkgaXMgY2FsbGVkIGJlZm9yZSBuZ0FmdGVyVmlld0luaXRcbiAgICBpZiAodGhpcy5faW5pdGlhbEhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gdGhpcy5faW5pdGlhbEhlaWdodDtcbiAgICB9XG4gIH1cblxuICBfbm9vcElucHV0SGFuZGxlcigpIHtcbiAgICAvLyBuby1vcCBoYW5kbGVyIHRoYXQgZW5zdXJlcyB3ZSdyZSBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gaW5wdXQgZXZlbnRzLlxuICB9XG5cbiAgLyoqIEFjY2VzcyBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIGRvY3VtZW50IHJlZmVyZW5jZSAqL1xuICBwcml2YXRlIF9nZXREb2N1bWVudCgpOiBEb2N1bWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2RvY3VtZW50IHx8IGRvY3VtZW50O1xuICB9XG5cbiAgLyoqIFVzZSBkZWZhdWx0VmlldyBvZiBpbmplY3RlZCBkb2N1bWVudCBpZiBhdmFpbGFibGUgb3IgZmFsbGJhY2sgdG8gZ2xvYmFsIHdpbmRvdyByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0V2luZG93KCk6IFdpbmRvdyB7XG4gICAgY29uc3QgZG9jID0gdGhpcy5fZ2V0RG9jdW1lbnQoKTtcbiAgICByZXR1cm4gZG9jLmRlZmF1bHRWaWV3IHx8IHdpbmRvdztcbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGxzIGEgdGV4dGFyZWEgdG8gdGhlIGNhcmV0IHBvc2l0aW9uLiBPbiBGaXJlZm94IHJlc2l6aW5nIHRoZSB0ZXh0YXJlYSB3aWxsXG4gICAqIHByZXZlbnQgaXQgZnJvbSBzY3JvbGxpbmcgdG8gdGhlIGNhcmV0IHBvc2l0aW9uLiBXZSBuZWVkIHRvIHJlLXNldCB0aGUgc2VsZWN0aW9uXG4gICAqIGluIG9yZGVyIGZvciBpdCB0byBzY3JvbGwgdG8gdGhlIHByb3BlciBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3Njcm9sbFRvQ2FyZXRQb3NpdGlvbih0ZXh0YXJlYTogSFRNTFRleHRBcmVhRWxlbWVudCkge1xuICAgIGNvbnN0IHtzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kfSA9IHRleHRhcmVhO1xuXG4gICAgLy8gSUUgd2lsbCB0aHJvdyBhbiBcIlVuc3BlY2lmaWVkIGVycm9yXCIgaWYgd2UgdHJ5IHRvIHNldCB0aGUgc2VsZWN0aW9uIHJhbmdlIGFmdGVyIHRoZVxuICAgIC8vIGVsZW1lbnQgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIHRoZSBET00uIEFzc2VydCB0aGF0IHRoZSBkaXJlY3RpdmUgaGFzbid0IGJlZW4gZGVzdHJveWVkXG4gICAgLy8gYmV0d2VlbiB0aGUgdGltZSB3ZSByZXF1ZXN0ZWQgdGhlIGFuaW1hdGlvbiBmcmFtZSBhbmQgd2hlbiBpdCB3YXMgZXhlY3V0ZWQuXG4gICAgLy8gQWxzbyBub3RlIHRoYXQgd2UgaGF2ZSB0byBhc3NlcnQgdGhhdCB0aGUgdGV4dGFyZWEgaXMgZm9jdXNlZCBiZWZvcmUgd2Ugc2V0IHRoZVxuICAgIC8vIHNlbGVjdGlvbiByYW5nZS4gU2V0dGluZyB0aGUgc2VsZWN0aW9uIHJhbmdlIG9uIGEgbm9uLWZvY3VzZWQgdGV4dGFyZWEgd2lsbCBjYXVzZVxuICAgIC8vIGl0IHRvIHJlY2VpdmUgZm9jdXMgb24gSUUgYW5kIEVkZ2UuXG4gICAgaWYgKCF0aGlzLl9kZXN0cm95ZWQuaXNTdG9wcGVkICYmIHRoaXMuX2hhc0ZvY3VzKSB7XG4gICAgICB0ZXh0YXJlYS5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==