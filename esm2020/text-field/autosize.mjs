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
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/** Directive to automatically resize a textarea to fit its content. */
export class CdkTextareaAutosize {
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
        this._document = document;
        this._textareaElement = this._elementRef.nativeElement;
    }
    /** Minimum amount of rows in the textarea. */
    get minRows() { return this._minRows; }
    set minRows(value) {
        this._minRows = coerceNumberProperty(value);
        this._setMinHeight();
    }
    /** Maximum amount of rows in the textarea. */
    get maxRows() { return this._maxRows; }
    set maxRows(value) {
        this._maxRows = coerceNumberProperty(value);
        this._setMaxHeight();
    }
    /** Whether autosizing is enabled or not */
    get enabled() { return this._enabled; }
    set enabled(value) {
        value = coerceBooleanProperty(value);
        // Only act if the actual value changed. This specifically helps to not run
        // resizeToFitContent too early (i.e. before ngAfterViewInit)
        if (this._enabled !== value) {
            (this._enabled = value) ? this.resizeToFitContent(true) : this.reset();
        }
    }
    get placeholder() { return this._textareaElement.placeholder; }
    set placeholder(value) {
        this._cachedPlaceholderHeight = undefined;
        this._textareaElement.placeholder = value;
        this._cacheTextareaPlaceholderHeight();
    }
    /** Sets the minimum height of the textarea as determined by minRows. */
    _setMinHeight() {
        const minHeight = this.minRows && this._cachedLineHeight ?
            `${this.minRows * this._cachedLineHeight}px` : null;
        if (minHeight) {
            this._textareaElement.style.minHeight = minHeight;
        }
    }
    /** Sets the maximum height of the textarea as determined by maxRows. */
    _setMaxHeight() {
        const maxHeight = this.maxRows && this._cachedLineHeight ?
            `${this.maxRows * this._cachedLineHeight}px` : null;
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
        const measuringClass = isFirefox ?
            'cdk-textarea-autosize-measuring-firefox' :
            'cdk-textarea-autosize-measuring';
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
    // In Ivy the `host` metadata will be merged, whereas in ViewEngine it is overridden. In order
    // to avoid double event listeners, we need to use `HostListener`. Once Ivy is the default, we
    // can move this back into `host`.
    // tslint:disable:no-host-decorator-in-concrete
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
}
CdkTextareaAutosize.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTextareaAutosize, deps: [{ token: i0.ElementRef }, { token: i1.Platform }, { token: i0.NgZone }, { token: DOCUMENT, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
CdkTextareaAutosize.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkTextareaAutosize, selector: "textarea[cdkTextareaAutosize]", inputs: { minRows: ["cdkAutosizeMinRows", "minRows"], maxRows: ["cdkAutosizeMaxRows", "maxRows"], enabled: ["cdkTextareaAutosize", "enabled"], placeholder: "placeholder" }, host: { attributes: { "rows": "1" }, listeners: { "input": "_noopInputHandler()" }, classAttribute: "cdk-textarea-autosize" }, exportAs: ["cdkTextareaAutosize"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTextareaAutosize, decorators: [{
            type: Directive,
            args: [{
                    selector: 'textarea[cdkTextareaAutosize]',
                    exportAs: 'cdkTextareaAutosize',
                    host: {
                        'class': 'cdk-textarea-autosize',
                        // Textarea elements that have the directive applied should have a single row by default.
                        // Browsers normally show two rows by default and therefore this limits the minRows binding.
                        'rows': '1',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.Platform }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; }, propDecorators: { minRows: [{
                type: Input,
                args: ['cdkAutosizeMinRows']
            }], maxRows: [{
                type: Input,
                args: ['cdkAutosizeMaxRows']
            }], enabled: [{
                type: Input,
                args: ['cdkTextareaAutosize']
            }], placeholder: [{
                type: Input
            }], _noopInputHandler: [{
                type: HostListener,
                args: ['input']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b3NpemUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RleHQtZmllbGQvYXV0b3NpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUVMLHFCQUFxQixFQUNyQixvQkFBb0IsRUFFckIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixLQUFLLEVBSUwsTUFBTSxFQUNOLFlBQVksRUFDWixRQUFRLEVBQ1IsTUFBTSxHQUNQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7O0FBRXpDLHVFQUF1RTtBQVd2RSxNQUFNLE9BQU8sbUJBQW1CO0lBcUU5QixZQUFvQixXQUFvQyxFQUNwQyxTQUFtQixFQUNuQixPQUFlO0lBQ3ZCLHFEQUFxRDtJQUN2QixRQUFjO1FBSnBDLGdCQUFXLEdBQVgsV0FBVyxDQUF5QjtRQUNwQyxjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFuRWxCLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBSTFDLGFBQVEsR0FBWSxJQUFJLENBQUM7UUFFakM7Ozs7V0FJRztRQUNLLHFCQUFnQixHQUFXLENBQUMsQ0FBQyxDQUFDO1FBb0Q5QixrQkFBYSxHQUFHLEtBQUssQ0FBQztRQXVKOUIseUNBQXlDO1FBQ2pDLHNCQUFpQixHQUFHLENBQUMsS0FBaUIsRUFBRSxFQUFFO1lBQ2hELElBQUksQ0FBQyxTQUFTLEdBQUcs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QyxjQUFjLEVBQUUsWUFBWSxFQUFDLEdBQUcsUUFBUSxDQUFDO1FBRWhELHNGQUFzRjtRQUN0Rix5RkFBeUY7UUFDekYsOEVBQThFO1FBQzlFLGtGQUFrRjtRQUNsRixvRkFBb0Y7UUFDcEYsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2hELFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDMUQ7SUFDSCxDQUFDOzt3SEFuVVUsbUJBQW1CLDBGQXlFRSxRQUFROzRHQXpFN0IsbUJBQW1CO21HQUFuQixtQkFBbUI7a0JBVi9CLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLCtCQUErQjtvQkFDekMsUUFBUSxFQUFFLHFCQUFxQjtvQkFDL0IsSUFBSSxFQUFFO3dCQUNKLE9BQU8sRUFBRSx1QkFBdUI7d0JBQ2hDLHlGQUF5Rjt3QkFDekYsNEZBQTRGO3dCQUM1RixNQUFNLEVBQUUsR0FBRztxQkFDWjtpQkFDRjs7MEJBMEVjLFFBQVE7OzBCQUFJLE1BQU07MkJBQUMsUUFBUTs0Q0FwRHBDLE9BQU87c0JBRFYsS0FBSzt1QkFBQyxvQkFBb0I7Z0JBU3ZCLE9BQU87c0JBRFYsS0FBSzt1QkFBQyxvQkFBb0I7Z0JBU3ZCLE9BQU87c0JBRFYsS0FBSzt1QkFBQyxxQkFBcUI7Z0JBYXhCLFdBQVc7c0JBRGQsS0FBSztnQkFtUE4saUJBQWlCO3NCQURoQixZQUFZO3VCQUFDLE9BQU8iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQm9vbGVhbklucHV0LFxuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBOdW1iZXJJbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBJbnB1dCxcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgRG9DaGVjayxcbiAgT25EZXN0cm95LFxuICBOZ1pvbmUsXG4gIEhvc3RMaXN0ZW5lcixcbiAgT3B0aW9uYWwsXG4gIEluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHthdWRpdFRpbWUsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtmcm9tRXZlbnQsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuLyoqIERpcmVjdGl2ZSB0byBhdXRvbWF0aWNhbGx5IHJlc2l6ZSBhIHRleHRhcmVhIHRvIGZpdCBpdHMgY29udGVudC4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ3RleHRhcmVhW2Nka1RleHRhcmVhQXV0b3NpemVdJyxcbiAgZXhwb3J0QXM6ICdjZGtUZXh0YXJlYUF1dG9zaXplJyxcbiAgaG9zdDoge1xuICAgICdjbGFzcyc6ICdjZGstdGV4dGFyZWEtYXV0b3NpemUnLFxuICAgIC8vIFRleHRhcmVhIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgZGlyZWN0aXZlIGFwcGxpZWQgc2hvdWxkIGhhdmUgYSBzaW5nbGUgcm93IGJ5IGRlZmF1bHQuXG4gICAgLy8gQnJvd3NlcnMgbm9ybWFsbHkgc2hvdyB0d28gcm93cyBieSBkZWZhdWx0IGFuZCB0aGVyZWZvcmUgdGhpcyBsaW1pdHMgdGhlIG1pblJvd3MgYmluZGluZy5cbiAgICAncm93cyc6ICcxJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrVGV4dGFyZWFBdXRvc2l6ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIERvQ2hlY2ssIE9uRGVzdHJveSB7XG4gIC8qKiBLZWVwIHRyYWNrIG9mIHRoZSBwcmV2aW91cyB0ZXh0YXJlYSB2YWx1ZSB0byBhdm9pZCByZXNpemluZyB3aGVuIHRoZSB2YWx1ZSBoYXNuJ3QgY2hhbmdlZC4gKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNWYWx1ZT86IHN0cmluZztcbiAgcHJpdmF0ZSBfaW5pdGlhbEhlaWdodDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX21pblJvd3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBfbWF4Um93czogbnVtYmVyO1xuICBwcml2YXRlIF9lbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogVmFsdWUgb2YgbWluUm93cyBhcyBvZiBsYXN0IHJlc2l6ZS4gSWYgdGhlIG1pblJvd3MgaGFzIGRlY3JlYXNlZCwgdGhlXG4gICAqIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgbmVlZHMgdG8gYmUgcmVjb21wdXRlZCB0byByZWZsZWN0IHRoZSBuZXcgbWluaW11bS4gVGhlIG1heEhlaWdodFxuICAgKiBkb2VzIG5vdCBoYXZlIHRoZSBzYW1lIHByb2JsZW0gYmVjYXVzZSBpdCBkb2VzIG5vdCBhZmZlY3QgdGhlIHRleHRhcmVhJ3Mgc2Nyb2xsSGVpZ2h0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNNaW5Sb3dzOiBudW1iZXIgPSAtMTtcblxuICBwcml2YXRlIF90ZXh0YXJlYUVsZW1lbnQ6IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5cbiAgLyoqIE1pbmltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWluUm93cycpXG4gIGdldCBtaW5Sb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9taW5Sb3dzOyB9XG4gIHNldCBtaW5Sb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9taW5Sb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1pbkhlaWdodCgpO1xuICB9XG5cbiAgLyoqIE1heGltdW0gYW1vdW50IG9mIHJvd3MgaW4gdGhlIHRleHRhcmVhLiAqL1xuICBASW5wdXQoJ2Nka0F1dG9zaXplTWF4Um93cycpXG4gIGdldCBtYXhSb3dzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhSb3dzOyB9XG4gIHNldCBtYXhSb3dzKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9tYXhSb3dzID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUpO1xuICAgIHRoaXMuX3NldE1heEhlaWdodCgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgYXV0b3NpemluZyBpcyBlbmFibGVkIG9yIG5vdCAqL1xuICBASW5wdXQoJ2Nka1RleHRhcmVhQXV0b3NpemUnKVxuICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7IH1cbiAgc2V0IGVuYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB2YWx1ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICAvLyBPbmx5IGFjdCBpZiB0aGUgYWN0dWFsIHZhbHVlIGNoYW5nZWQuIFRoaXMgc3BlY2lmaWNhbGx5IGhlbHBzIHRvIG5vdCBydW5cbiAgICAvLyByZXNpemVUb0ZpdENvbnRlbnQgdG9vIGVhcmx5IChpLmUuIGJlZm9yZSBuZ0FmdGVyVmlld0luaXQpXG4gICAgaWYgKHRoaXMuX2VuYWJsZWQgIT09IHZhbHVlKSB7XG4gICAgICAodGhpcy5fZW5hYmxlZCA9IHZhbHVlKSA/IHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpIDogdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgfVxuXG4gIEBJbnB1dCgpXG4gIGdldCBwbGFjZWhvbGRlcigpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBsYWNlaG9sZGVyOyB9XG4gIHNldCBwbGFjZWhvbGRlcih2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fY2FjaGVkUGxhY2Vob2xkZXJIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBsYWNlaG9sZGVyID0gdmFsdWU7XG4gICAgdGhpcy5fY2FjaGVUZXh0YXJlYVBsYWNlaG9sZGVySGVpZ2h0KCk7XG4gIH1cblxuXG4gIC8qKiBDYWNoZWQgaGVpZ2h0IG9mIGEgdGV4dGFyZWEgd2l0aCBhIHNpbmdsZSByb3cuICovXG4gIHByaXZhdGUgX2NhY2hlZExpbmVIZWlnaHQ6IG51bWJlcjtcbiAgLyoqIENhY2hlZCBoZWlnaHQgb2YgYSB0ZXh0YXJlYSB3aXRoIG9ubHkgdGhlIHBsYWNlaG9sZGVyLiAqL1xuICBwcml2YXRlIF9jYWNoZWRQbGFjZWhvbGRlckhlaWdodD86IG51bWJlcjtcblxuICAvKiogVXNlZCB0byByZWZlcmVuY2UgY29ycmVjdCBkb2N1bWVudC93aW5kb3cgKi9cbiAgcHJvdGVjdGVkIF9kb2N1bWVudD86IERvY3VtZW50O1xuXG4gIHByaXZhdGUgX2hhc0ZvY3VzOiBib29sZWFuO1xuXG4gIHByaXZhdGUgX2lzVmlld0luaXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgICAgICAgICAgICBwcml2YXRlIF9wbGF0Zm9ybTogUGxhdGZvcm0sXG4gICAgICAgICAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgICAgICAgICAvKiogQGJyZWFraW5nLWNoYW5nZSAxMS4wLjAgbWFrZSBkb2N1bWVudCByZXF1aXJlZCAqL1xuICAgICAgICAgICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudD86IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG5cbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBtaW5pbXVtIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgYXMgZGV0ZXJtaW5lZCBieSBtaW5Sb3dzLiAqL1xuICBfc2V0TWluSGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IG1pbkhlaWdodCA9IHRoaXMubWluUm93cyAmJiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0ID9cbiAgICAgICAgYCR7dGhpcy5taW5Sb3dzICogdGhpcy5fY2FjaGVkTGluZUhlaWdodH1weGAgOiBudWxsO1xuXG4gICAgaWYgKG1pbkhlaWdodCkgIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5taW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSB0ZXh0YXJlYSBhcyBkZXRlcm1pbmVkIGJ5IG1heFJvd3MuICovXG4gIF9zZXRNYXhIZWlnaHQoKTogdm9pZCB7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gdGhpcy5tYXhSb3dzICYmIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgP1xuICAgICAgICBgJHt0aGlzLm1heFJvd3MgKiB0aGlzLl9jYWNoZWRMaW5lSGVpZ2h0fXB4YCA6IG51bGw7XG5cbiAgICBpZiAobWF4SGVpZ2h0KSB7XG4gICAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUubWF4SGVpZ2h0ID0gbWF4SGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICAvLyBSZW1lbWJlciB0aGUgaGVpZ2h0IHdoaWNoIHdlIHN0YXJ0ZWQgd2l0aCBpbiBjYXNlIGF1dG9zaXppbmcgaXMgZGlzYWJsZWRcbiAgICAgIHRoaXMuX2luaXRpYWxIZWlnaHQgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQuc3R5bGUuaGVpZ2h0O1xuICAgICAgdGhpcy5yZXNpemVUb0ZpdENvbnRlbnQoKTtcblxuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3Qgd2luZG93ID0gdGhpcy5fZ2V0V2luZG93KCk7XG5cbiAgICAgICAgZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpXG4gICAgICAgICAgLnBpcGUoYXVkaXRUaW1lKDE2KSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlc2l6ZVRvRml0Q29udGVudCh0cnVlKSk7XG5cbiAgICAgICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5faGFuZGxlRm9jdXNFdmVudCk7XG4gICAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5faGFuZGxlRm9jdXNFdmVudCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5faXNWaWV3SW5pdGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzaXplVG9GaXRDb250ZW50KHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX2hhbmRsZUZvY3VzRXZlbnQpO1xuICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5faGFuZGxlRm9jdXNFdmVudCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWNoZSB0aGUgaGVpZ2h0IG9mIGEgc2luZ2xlLXJvdyB0ZXh0YXJlYSBpZiBpdCBoYXMgbm90IGFscmVhZHkgYmVlbiBjYWNoZWQuXG4gICAqXG4gICAqIFdlIG5lZWQgdG8ga25vdyBob3cgbGFyZ2UgYSBzaW5nbGUgXCJyb3dcIiBvZiBhIHRleHRhcmVhIGlzIGluIG9yZGVyIHRvIGFwcGx5IG1pblJvd3MgYW5kXG4gICAqIG1heFJvd3MuIEZvciB0aGUgaW5pdGlhbCB2ZXJzaW9uLCB3ZSB3aWxsIGFzc3VtZSB0aGF0IHRoZSBoZWlnaHQgb2YgYSBzaW5nbGUgbGluZSBpbiB0aGVcbiAgICogdGV4dGFyZWEgZG9lcyBub3QgZXZlciBjaGFuZ2UuXG4gICAqL1xuICBwcml2YXRlIF9jYWNoZVRleHRhcmVhTGluZUhlaWdodCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fY2FjaGVkTGluZUhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFVzZSBhIGNsb25lIGVsZW1lbnQgYmVjYXVzZSB3ZSBoYXZlIHRvIG92ZXJyaWRlIHNvbWUgc3R5bGVzLlxuICAgIGxldCB0ZXh0YXJlYUNsb25lID0gdGhpcy5fdGV4dGFyZWFFbGVtZW50LmNsb25lTm9kZShmYWxzZSkgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICB0ZXh0YXJlYUNsb25lLnJvd3MgPSAxO1xuXG4gICAgLy8gVXNlIGBwb3NpdGlvbjogYWJzb2x1dGVgIHNvIHRoYXQgdGhpcyBkb2Vzbid0IGNhdXNlIGEgYnJvd3NlciBsYXlvdXQgYW5kIHVzZVxuICAgIC8vIGB2aXNpYmlsaXR5OiBoaWRkZW5gIHNvIHRoYXQgbm90aGluZyBpcyByZW5kZXJlZC4gQ2xlYXIgYW55IG90aGVyIHN0eWxlcyB0aGF0XG4gICAgLy8gd291bGQgYWZmZWN0IHRoZSBoZWlnaHQuXG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5wYWRkaW5nID0gJzAnO1xuICAgIHRleHRhcmVhQ2xvbmUuc3R5bGUuaGVpZ2h0ID0gJyc7XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5taW5IZWlnaHQgPSAnJztcbiAgICB0ZXh0YXJlYUNsb25lLnN0eWxlLm1heEhlaWdodCA9ICcnO1xuXG4gICAgLy8gSW4gRmlyZWZveCBpdCBoYXBwZW5zIHRoYXQgdGV4dGFyZWEgZWxlbWVudHMgYXJlIGFsd2F5cyBiaWdnZXIgdGhhbiB0aGUgc3BlY2lmaWVkIGFtb3VudFxuICAgIC8vIG9mIHJvd3MuIFRoaXMgaXMgYmVjYXVzZSBGaXJlZm94IHRyaWVzIHRvIGFkZCBleHRyYSBzcGFjZSBmb3IgdGhlIGhvcml6b250YWwgc2Nyb2xsYmFyLlxuICAgIC8vIEFzIGEgd29ya2Fyb3VuZCB0aGF0IHJlbW92ZXMgdGhlIGV4dHJhIHNwYWNlIGZvciB0aGUgc2Nyb2xsYmFyLCB3ZSBjYW4ganVzdCBzZXQgb3ZlcmZsb3dcbiAgICAvLyB0byBoaWRkZW4uIFRoaXMgZW5zdXJlcyB0aGF0IHRoZXJlIGlzIG5vIGludmFsaWQgY2FsY3VsYXRpb24gb2YgdGhlIGxpbmUgaGVpZ2h0LlxuICAgIC8vIFNlZSBGaXJlZm94IGJ1ZyByZXBvcnQ6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTMzNjU0XG4gICAgdGV4dGFyZWFDbG9uZS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnBhcmVudE5vZGUhLmFwcGVuZENoaWxkKHRleHRhcmVhQ2xvbmUpO1xuICAgIHRoaXMuX2NhY2hlZExpbmVIZWlnaHQgPSB0ZXh0YXJlYUNsb25lLmNsaWVudEhlaWdodDtcbiAgICB0ZXh0YXJlYUNsb25lLnJlbW92ZSgpO1xuXG4gICAgLy8gTWluIGFuZCBtYXggaGVpZ2h0cyBoYXZlIHRvIGJlIHJlLWNhbGN1bGF0ZWQgaWYgdGhlIGNhY2hlZCBsaW5lIGhlaWdodCBjaGFuZ2VzXG4gICAgdGhpcy5fc2V0TWluSGVpZ2h0KCk7XG4gICAgdGhpcy5fc2V0TWF4SGVpZ2h0KCk7XG4gIH1cblxuICBwcml2YXRlIF9tZWFzdXJlU2Nyb2xsSGVpZ2h0KCk6IG51bWJlciB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX3RleHRhcmVhRWxlbWVudDtcbiAgICBjb25zdCBwcmV2aW91c01hcmdpbiA9IGVsZW1lbnQuc3R5bGUubWFyZ2luQm90dG9tIHx8ICcnO1xuICAgIGNvbnN0IGlzRmlyZWZveCA9IHRoaXMuX3BsYXRmb3JtLkZJUkVGT1g7XG4gICAgY29uc3QgbmVlZHNNYXJnaW5GaWxsZXIgPSBpc0ZpcmVmb3ggJiYgdGhpcy5faGFzRm9jdXM7XG4gICAgY29uc3QgbWVhc3VyaW5nQ2xhc3MgPSBpc0ZpcmVmb3ggP1xuICAgICAgJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZS1tZWFzdXJpbmctZmlyZWZveCcgOlxuICAgICAgJ2Nkay10ZXh0YXJlYS1hdXRvc2l6ZS1tZWFzdXJpbmcnO1xuXG4gICAgLy8gSW4gc29tZSBjYXNlcyB0aGUgcGFnZSBtaWdodCBtb3ZlIGFyb3VuZCB3aGlsZSB3ZSdyZSBtZWFzdXJpbmcgdGhlIGB0ZXh0YXJlYWAgb24gRmlyZWZveC4gV2VcbiAgICAvLyB3b3JrIGFyb3VuZCBpdCBieSBhc3NpZ25pbmcgYSB0ZW1wb3JhcnkgbWFyZ2luIHdpdGggdGhlIHNhbWUgaGVpZ2h0IGFzIHRoZSBgdGV4dGFyZWFgIHNvIHRoYXRcbiAgICAvLyBpdCBvY2N1cGllcyB0aGUgc2FtZSBhbW91bnQgb2Ygc3BhY2UuIFNlZSAjMjMyMzMuXG4gICAgaWYgKG5lZWRzTWFyZ2luRmlsbGVyKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLm1hcmdpbkJvdHRvbSA9IGAke2VsZW1lbnQuY2xpZW50SGVpZ2h0fXB4YDtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0aGUgdGV4dGFyZWEgaGVpZ2h0IHRvIGF1dG8gaW4gb3JkZXIgdG8gc2hyaW5rIGJhY2sgdG8gaXRzIGRlZmF1bHQgc2l6ZS5cbiAgICAvLyBBbHNvIHRlbXBvcmFyaWx5IGZvcmNlIG92ZXJmbG93OmhpZGRlbiwgc28gc2Nyb2xsIGJhcnMgZG8gbm90IGludGVyZmVyZSB3aXRoIGNhbGN1bGF0aW9ucy5cbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQobWVhc3VyaW5nQ2xhc3MpO1xuICAgIC8vIFRoZSBtZWFzdXJpbmcgY2xhc3MgaW5jbHVkZXMgYSAycHggcGFkZGluZyB0byB3b3JrYXJvdW5kIGFuIGlzc3VlIHdpdGggQ2hyb21lLFxuICAgIC8vIHNvIHdlIGFjY291bnQgZm9yIHRoYXQgZXh0cmEgc3BhY2UgaGVyZSBieSBzdWJ0cmFjdGluZyA0ICgycHggdG9wICsgMnB4IGJvdHRvbSkuXG4gICAgY29uc3Qgc2Nyb2xsSGVpZ2h0ID0gZWxlbWVudC5zY3JvbGxIZWlnaHQgLSA0O1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShtZWFzdXJpbmdDbGFzcyk7XG5cbiAgICBpZiAobmVlZHNNYXJnaW5GaWxsZXIpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUubWFyZ2luQm90dG9tID0gcHJldmlvdXNNYXJnaW47XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjcm9sbEhlaWdodDtcbiAgfVxuXG4gIHByaXZhdGUgX2NhY2hlVGV4dGFyZWFQbGFjZWhvbGRlckhlaWdodCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzVmlld0luaXRlZCB8fCB0aGlzLl9jYWNoZWRQbGFjZWhvbGRlckhlaWdodCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnBsYWNlaG9sZGVyKSB7XG4gICAgICB0aGlzLl9jYWNoZWRQbGFjZWhvbGRlckhlaWdodCA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQudmFsdWU7XG5cbiAgICB0aGlzLl90ZXh0YXJlYUVsZW1lbnQudmFsdWUgPSB0aGlzLl90ZXh0YXJlYUVsZW1lbnQucGxhY2Vob2xkZXI7XG4gICAgdGhpcy5fY2FjaGVkUGxhY2Vob2xkZXJIZWlnaHQgPSB0aGlzLl9tZWFzdXJlU2Nyb2xsSGVpZ2h0KCk7XG4gICAgdGhpcy5fdGV4dGFyZWFFbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICAvKiogSGFuZGxlcyBgZm9jdXNgIGFuZCBgYmx1cmAgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9oYW5kbGVGb2N1c0V2ZW50ID0gKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB7XG4gICAgdGhpcy5faGFzRm9jdXMgPSBldmVudC50eXBlID09PSAnZm9jdXMnO1xuICB9XG5cbiAgbmdEb0NoZWNrKCkge1xuICAgIGlmICh0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHRoaXMucmVzaXplVG9GaXRDb250ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2l6ZSB0aGUgdGV4dGFyZWEgdG8gZml0IGl0cyBjb250ZW50LlxuICAgKiBAcGFyYW0gZm9yY2UgV2hldGhlciB0byBmb3JjZSBhIGhlaWdodCByZWNhbGN1bGF0aW9uLiBCeSBkZWZhdWx0IHRoZSBoZWlnaHQgd2lsbCBiZVxuICAgKiAgICByZWNhbGN1bGF0ZWQgb25seSBpZiB0aGUgdmFsdWUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjYWxsLlxuICAgKi9cbiAgcmVzaXplVG9GaXRDb250ZW50KGZvcmNlOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAvLyBJZiBhdXRvc2l6aW5nIGlzIGRpc2FibGVkLCBqdXN0IHNraXAgZXZlcnl0aGluZyBlbHNlXG4gICAgaWYgKCF0aGlzLl9lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVUZXh0YXJlYUxpbmVIZWlnaHQoKTtcbiAgICB0aGlzLl9jYWNoZVRleHRhcmVhUGxhY2Vob2xkZXJIZWlnaHQoKTtcblxuICAgIC8vIElmIHdlIGhhdmVuJ3QgZGV0ZXJtaW5lZCB0aGUgbGluZS1oZWlnaHQgeWV0LCB3ZSBrbm93IHdlJ3JlIHN0aWxsIGhpZGRlbiBhbmQgdGhlcmUncyBubyBwb2ludFxuICAgIC8vIGluIGNoZWNraW5nIHRoZSBoZWlnaHQgb2YgdGhlIHRleHRhcmVhLlxuICAgIGlmICghdGhpcy5fY2FjaGVkTGluZUhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHRhcmVhID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgY29uc3QgdmFsdWUgPSB0ZXh0YXJlYS52YWx1ZTtcblxuICAgIC8vIE9ubHkgcmVzaXplIGlmIHRoZSB2YWx1ZSBvciBtaW5Sb3dzIGhhdmUgY2hhbmdlZCBzaW5jZSB0aGVzZSBjYWxjdWxhdGlvbnMgY2FuIGJlIGV4cGVuc2l2ZS5cbiAgICBpZiAoIWZvcmNlICYmIHRoaXMuX21pblJvd3MgPT09IHRoaXMuX3ByZXZpb3VzTWluUm93cyAmJiB2YWx1ZSA9PT0gdGhpcy5fcHJldmlvdXNWYWx1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNjcm9sbEhlaWdodCA9IHRoaXMuX21lYXN1cmVTY3JvbGxIZWlnaHQoKTtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heChzY3JvbGxIZWlnaHQsIHRoaXMuX2NhY2hlZFBsYWNlaG9sZGVySGVpZ2h0IHx8IDApO1xuXG4gICAgLy8gVXNlIHRoZSBzY3JvbGxIZWlnaHQgdG8ga25vdyBob3cgbGFyZ2UgdGhlIHRleHRhcmVhICp3b3VsZCogYmUgaWYgZml0IGl0cyBlbnRpcmUgdmFsdWUuXG4gICAgdGV4dGFyZWEuc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcblxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMuX3Njcm9sbFRvQ2FyZXRQb3NpdGlvbih0ZXh0YXJlYSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWEpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX3ByZXZpb3VzVmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLl9wcmV2aW91c01pblJvd3MgPSB0aGlzLl9taW5Sb3dzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgdGV4dGFyZWEgdG8gaXRzIG9yaWdpbmFsIHNpemVcbiAgICovXG4gIHJlc2V0KCkge1xuICAgIC8vIERvIG5vdCB0cnkgdG8gY2hhbmdlIHRoZSB0ZXh0YXJlYSwgaWYgdGhlIGluaXRpYWxIZWlnaHQgaGFzIG5vdCBiZWVuIGRldGVybWluZWQgeWV0XG4gICAgLy8gVGhpcyBtaWdodCBwb3RlbnRpYWxseSByZW1vdmUgc3R5bGVzIHdoZW4gcmVzZXQoKSBpcyBjYWxsZWQgYmVmb3JlIG5nQWZ0ZXJWaWV3SW5pdFxuICAgIGlmICh0aGlzLl9pbml0aWFsSGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3RleHRhcmVhRWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLl9pbml0aWFsSGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gIC8vIEluIEl2eSB0aGUgYGhvc3RgIG1ldGFkYXRhIHdpbGwgYmUgbWVyZ2VkLCB3aGVyZWFzIGluIFZpZXdFbmdpbmUgaXQgaXMgb3ZlcnJpZGRlbi4gSW4gb3JkZXJcbiAgLy8gdG8gYXZvaWQgZG91YmxlIGV2ZW50IGxpc3RlbmVycywgd2UgbmVlZCB0byB1c2UgYEhvc3RMaXN0ZW5lcmAuIE9uY2UgSXZ5IGlzIHRoZSBkZWZhdWx0LCB3ZVxuICAvLyBjYW4gbW92ZSB0aGlzIGJhY2sgaW50byBgaG9zdGAuXG4gIC8vIHRzbGludDpkaXNhYmxlOm5vLWhvc3QtZGVjb3JhdG9yLWluLWNvbmNyZXRlXG4gIEBIb3N0TGlzdGVuZXIoJ2lucHV0JylcbiAgX25vb3BJbnB1dEhhbmRsZXIoKSB7XG4gICAgLy8gbm8tb3AgaGFuZGxlciB0aGF0IGVuc3VyZXMgd2UncmUgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGlucHV0IGV2ZW50cy5cbiAgfVxuXG4gIC8qKiBBY2Nlc3MgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCBkb2N1bWVudCByZWZlcmVuY2UgKi9cbiAgcHJpdmF0ZSBfZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIGNvbnN0IGRvYyA9IHRoaXMuX2dldERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICAvKipcbiAgICogU2Nyb2xscyBhIHRleHRhcmVhIHRvIHRoZSBjYXJldCBwb3NpdGlvbi4gT24gRmlyZWZveCByZXNpemluZyB0aGUgdGV4dGFyZWEgd2lsbFxuICAgKiBwcmV2ZW50IGl0IGZyb20gc2Nyb2xsaW5nIHRvIHRoZSBjYXJldCBwb3NpdGlvbi4gV2UgbmVlZCB0byByZS1zZXQgdGhlIHNlbGVjdGlvblxuICAgKiBpbiBvcmRlciBmb3IgaXQgdG8gc2Nyb2xsIHRvIHRoZSBwcm9wZXIgcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9zY3JvbGxUb0NhcmV0UG9zaXRpb24odGV4dGFyZWE6IEhUTUxUZXh0QXJlYUVsZW1lbnQpIHtcbiAgICBjb25zdCB7c2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZH0gPSB0ZXh0YXJlYTtcblxuICAgIC8vIElFIHdpbGwgdGhyb3cgYW4gXCJVbnNwZWNpZmllZCBlcnJvclwiIGlmIHdlIHRyeSB0byBzZXQgdGhlIHNlbGVjdGlvbiByYW5nZSBhZnRlciB0aGVcbiAgICAvLyBlbGVtZW50IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgRE9NLiBBc3NlcnQgdGhhdCB0aGUgZGlyZWN0aXZlIGhhc24ndCBiZWVuIGRlc3Ryb3llZFxuICAgIC8vIGJldHdlZW4gdGhlIHRpbWUgd2UgcmVxdWVzdGVkIHRoZSBhbmltYXRpb24gZnJhbWUgYW5kIHdoZW4gaXQgd2FzIGV4ZWN1dGVkLlxuICAgIC8vIEFsc28gbm90ZSB0aGF0IHdlIGhhdmUgdG8gYXNzZXJ0IHRoYXQgdGhlIHRleHRhcmVhIGlzIGZvY3VzZWQgYmVmb3JlIHdlIHNldCB0aGVcbiAgICAvLyBzZWxlY3Rpb24gcmFuZ2UuIFNldHRpbmcgdGhlIHNlbGVjdGlvbiByYW5nZSBvbiBhIG5vbi1mb2N1c2VkIHRleHRhcmVhIHdpbGwgY2F1c2VcbiAgICAvLyBpdCB0byByZWNlaXZlIGZvY3VzIG9uIElFIGFuZCBFZGdlLlxuICAgIGlmICghdGhpcy5fZGVzdHJveWVkLmlzU3RvcHBlZCAmJiB0aGlzLl9oYXNGb2N1cykge1xuICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX21pblJvd3M6IE51bWJlcklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbWF4Um93czogTnVtYmVySW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9lbmFibGVkOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=