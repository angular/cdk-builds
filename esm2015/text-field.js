/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform, supportsPassiveEventListeners, PlatformModule } from '@angular/cdk/platform';
import { Directive, ElementRef, EventEmitter, Injectable, NgZone, Output, Input, NgModule, defineInjectable, inject } from '@angular/core';
import { EMPTY, Subject, fromEvent } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Options to pass to the animationstart listener.
 */
const /** @type {?} */ listenerOptions = supportsPassiveEventListeners() ? { passive: true } : false;
/**
 * An injectable service that can be used to monitor the autofill state of an input.
 * Based on the following blog post:
 * https://medium.com/\@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
 */
class AutofillMonitor {
    /**
     * @param {?} _platform
     * @param {?} _ngZone
     */
    constructor(_platform, _ngZone) {
        this._platform = _platform;
        this._ngZone = _ngZone;
        this._monitoredElements = new Map();
    }
    /**
     * Monitor for changes in the autofill state of the given input element.
     * @param {?} element The element to monitor.
     * @return {?} A stream of autofill state changes.
     */
    monitor(element) {
        if (!this._platform.isBrowser) {
            return EMPTY;
        }
        const /** @type {?} */ info = this._monitoredElements.get(element);
        if (info) {
            return info.subject.asObservable();
        }
        const /** @type {?} */ result = new Subject();
        const /** @type {?} */ listener = (event) => {
            if (event.animationName === 'cdk-text-field-autofill-start') {
                element.classList.add('cdk-text-field-autofilled');
                result.next({ target: /** @type {?} */ (event.target), isAutofilled: true });
            }
            else if (event.animationName === 'cdk-text-field-autofill-end') {
                element.classList.remove('cdk-text-field-autofilled');
                result.next({ target: /** @type {?} */ (event.target), isAutofilled: false });
            }
        };
        this._ngZone.runOutsideAngular(() => {
            element.addEventListener('animationstart', listener, listenerOptions);
            element.classList.add('cdk-text-field-autofill-monitored');
        });
        this._monitoredElements.set(element, {
            subject: result,
            unlisten: () => {
                element.removeEventListener('animationstart', listener, listenerOptions);
            }
        });
        return result.asObservable();
    }
    /**
     * Stop monitoring the autofill state of the given input element.
     * @param {?} element The element to stop monitoring.
     * @return {?}
     */
    stopMonitoring(element) {
        const /** @type {?} */ info = this._monitoredElements.get(element);
        if (info) {
            info.unlisten();
            info.subject.complete();
            element.classList.remove('cdk-text-field-autofill-monitored');
            element.classList.remove('cdk-text-field-autofilled');
            this._monitoredElements.delete(element);
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._monitoredElements.forEach((_info, element) => this.stopMonitoring(element));
    }
}
AutofillMonitor.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] },
];
/** @nocollapse */
AutofillMonitor.ctorParameters = () => [
    { type: Platform, },
    { type: NgZone, },
];
/** @nocollapse */ AutofillMonitor.ngInjectableDef = defineInjectable({ factory: function AutofillMonitor_Factory() { return new AutofillMonitor(inject(Platform), inject(NgZone)); }, token: AutofillMonitor, providedIn: "root" });
/**
 * A directive that can be used to monitor the autofill state of an input.
 */
class CdkAutofill {
    /**
     * @param {?} _elementRef
     * @param {?} _autofillMonitor
     */
    constructor(_elementRef, _autofillMonitor) {
        this._elementRef = _elementRef;
        this._autofillMonitor = _autofillMonitor;
        /**
         * Emits when the autofill state of the element changes.
         */
        this.cdkAutofill = new EventEmitter();
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this._autofillMonitor
            .monitor(this._elementRef.nativeElement)
            .subscribe(event => this.cdkAutofill.emit(event));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this._autofillMonitor.stopMonitoring(this._elementRef.nativeElement);
    }
}
CdkAutofill.decorators = [
    { type: Directive, args: [{
                selector: '[cdkAutofill]',
            },] },
];
/** @nocollapse */
CdkAutofill.ctorParameters = () => [
    { type: ElementRef, },
    { type: AutofillMonitor, },
];
CdkAutofill.propDecorators = {
    "cdkAutofill": [{ type: Output },],
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Directive to automatically resize a textarea to fit its content.
 */
class CdkTextareaAutosize {
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
    }
    /**
     * Minimum amount of rows in the textarea.
     * @param {?} value
     * @return {?}
     */
    set minRows(value) {
        this._minRows = value;
        this._setMinHeight();
    }
    /**
     * @return {?}
     */
    get minRows() { return this._minRows; }
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
        this._maxRows = value;
        this._setMaxHeight();
    }
    /**
     * Sets the minimum height of the textarea as determined by minRows.
     * @return {?}
     */
    _setMinHeight() {
        const /** @type {?} */ minHeight = this.minRows && this._cachedLineHeight ?
            `${this.minRows * this._cachedLineHeight}px` : null;
        if (minHeight) {
            this._setTextareaStyle('minHeight', minHeight);
        }
    }
    /**
     * Sets the maximum height of the textarea as determined by maxRows.
     * @return {?}
     */
    _setMaxHeight() {
        const /** @type {?} */ maxHeight = this.maxRows && this._cachedLineHeight ?
            `${this.maxRows * this._cachedLineHeight}px` : null;
        if (maxHeight) {
            this._setTextareaStyle('maxHeight', maxHeight);
        }
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        if (this._platform.isBrowser) {
            this.resizeToFitContent();
            this._ngZone.runOutsideAngular(() => {
                fromEvent(window, 'resize')
                    .pipe(auditTime(16), takeUntil(this._destroyed))
                    .subscribe(() => this.resizeToFitContent(true));
            });
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
     * Sets a style property on the textarea element.
     * @param {?} property
     * @param {?} value
     * @return {?}
     */
    _setTextareaStyle(property, value) {
        const /** @type {?} */ textarea = /** @type {?} */ (this._elementRef.nativeElement);
        textarea.style[property] = value;
    }
    /**
     * Cache the height of a single-row textarea if it has not already been cached.
     *
     * We need to know how large a single "row" of a textarea is in order to apply minRows and
     * maxRows. For the initial version, we will assume that the height of a single line in the
     * textarea does not ever change.
     * @return {?}
     */
    _cacheTextareaLineHeight() {
        if (this._cachedLineHeight) {
            return;
        }
        let /** @type {?} */ textarea = /** @type {?} */ (this._elementRef.nativeElement);
        // Use a clone element because we have to override some styles.
        let /** @type {?} */ textareaClone = /** @type {?} */ (textarea.cloneNode(false));
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
        textareaClone.style.overflow = 'hidden'; /** @type {?} */
        ((textarea.parentNode)).appendChild(textareaClone);
        this._cachedLineHeight = textareaClone.clientHeight; /** @type {?} */
        ((textarea.parentNode)).removeChild(textareaClone);
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
        this._cacheTextareaLineHeight();
        // If we haven't determined the line-height yet, we know we're still hidden and there's no point
        // in checking the height of the textarea.
        if (!this._cachedLineHeight) {
            return;
        }
        const /** @type {?} */ textarea = /** @type {?} */ (this._elementRef.nativeElement);
        const /** @type {?} */ value = textarea.value;
        // Only resize of the value changed since these calculations can be expensive.
        if (value === this._previousValue && !force) {
            return;
        }
        const /** @type {?} */ placeholderText = textarea.placeholder;
        // Reset the textarea height to auto in order to shrink back to its default size.
        // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
        // Long placeholders that are wider than the textarea width may lead to a bigger scrollHeight
        // value. To ensure that the scrollHeight is not bigger than the content, the placeholders
        // need to be removed temporarily.
        textarea.style.height = 'auto';
        textarea.style.overflow = 'hidden';
        textarea.placeholder = '';
        const /** @type {?} */ height = textarea.scrollHeight;
        // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
        textarea.style.height = `${height}px`;
        textarea.style.overflow = '';
        textarea.placeholder = placeholderText;
        // On Firefox resizing the textarea will prevent it from scrolling to the caret position.
        // We need to re-set the selection in order for it to scroll to the proper position.
        if (typeof requestAnimationFrame !== 'undefined') {
            this._ngZone.runOutsideAngular(() => requestAnimationFrame(() => {
                const { selectionStart, selectionEnd } = textarea;
                textarea.setSelectionRange(selectionStart, selectionEnd);
            }));
        }
        this._previousValue = value;
    }
    /**
     * @return {?}
     */
    _noopInputHandler() {
        // no-op handler that ensures we're running change detection on input events.
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
                    '(input)': '_noopInputHandler()',
                },
            },] },
];
/** @nocollapse */
CdkTextareaAutosize.ctorParameters = () => [
    { type: ElementRef, },
    { type: Platform, },
    { type: NgZone, },
];
CdkTextareaAutosize.propDecorators = {
    "minRows": [{ type: Input, args: ['cdkAutosizeMinRows',] },],
    "maxRows": [{ type: Input, args: ['cdkAutosizeMaxRows',] },],
};

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
class TextFieldModule {
}
TextFieldModule.decorators = [
    { type: NgModule, args: [{
                declarations: [CdkAutofill, CdkTextareaAutosize],
                imports: [PlatformModule],
                exports: [CdkAutofill, CdkTextareaAutosize],
            },] },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

export { AutofillMonitor, CdkAutofill, CdkTextareaAutosize, TextFieldModule };
//# sourceMappingURL=text-field.js.map
