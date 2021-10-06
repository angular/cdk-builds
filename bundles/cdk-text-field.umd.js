(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/platform'), require('@angular/core'), require('@angular/cdk/coercion'), require('rxjs'), require('rxjs/operators'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/text-field', ['exports', '@angular/cdk/platform', '@angular/core', '@angular/cdk/coercion', 'rxjs', 'rxjs/operators', '@angular/common'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.textField = {}), global.ng.cdk.platform, global.ng.core, global.ng.cdk.coercion, global.rxjs, global.rxjs.operators, global.ng.common));
}(this, (function (exports, i1, i0, coercion, rxjs, operators, common) { 'use strict';

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var i1__namespace = /*#__PURE__*/_interopNamespace(i1);
    var i0__namespace = /*#__PURE__*/_interopNamespace(i0);

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Options to pass to the animationstart listener. */
    var listenerOptions = i1.normalizePassiveListenerOptions({ passive: true });
    /**
     * An injectable service that can be used to monitor the autofill state of an input.
     * Based on the following blog post:
     * https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
     */
    var AutofillMonitor = /** @class */ (function () {
        function AutofillMonitor(_platform, _ngZone) {
            this._platform = _platform;
            this._ngZone = _ngZone;
            this._monitoredElements = new Map();
        }
        AutofillMonitor.prototype.monitor = function (elementOrRef) {
            var _this = this;
            if (!this._platform.isBrowser) {
                return rxjs.EMPTY;
            }
            var element = coercion.coerceElement(elementOrRef);
            var info = this._monitoredElements.get(element);
            if (info) {
                return info.subject;
            }
            var result = new rxjs.Subject();
            var cssClass = 'cdk-text-field-autofilled';
            var listener = (function (event) {
                // Animation events fire on initial element render, we check for the presence of the autofill
                // CSS class to make sure this is a real change in state, not just the initial render before
                // we fire off events.
                if (event.animationName === 'cdk-text-field-autofill-start' &&
                    !element.classList.contains(cssClass)) {
                    element.classList.add(cssClass);
                    _this._ngZone.run(function () { return result.next({ target: event.target, isAutofilled: true }); });
                }
                else if (event.animationName === 'cdk-text-field-autofill-end' &&
                    element.classList.contains(cssClass)) {
                    element.classList.remove(cssClass);
                    _this._ngZone.run(function () { return result.next({ target: event.target, isAutofilled: false }); });
                }
            });
            this._ngZone.runOutsideAngular(function () {
                element.addEventListener('animationstart', listener, listenerOptions);
                element.classList.add('cdk-text-field-autofill-monitored');
            });
            this._monitoredElements.set(element, {
                subject: result,
                unlisten: function () {
                    element.removeEventListener('animationstart', listener, listenerOptions);
                }
            });
            return result;
        };
        AutofillMonitor.prototype.stopMonitoring = function (elementOrRef) {
            var element = coercion.coerceElement(elementOrRef);
            var info = this._monitoredElements.get(element);
            if (info) {
                info.unlisten();
                info.subject.complete();
                element.classList.remove('cdk-text-field-autofill-monitored');
                element.classList.remove('cdk-text-field-autofilled');
                this._monitoredElements.delete(element);
            }
        };
        AutofillMonitor.prototype.ngOnDestroy = function () {
            var _this = this;
            this._monitoredElements.forEach(function (_info, element) { return _this.stopMonitoring(element); });
        };
        return AutofillMonitor;
    }());
    AutofillMonitor.ɵprov = i0__namespace.ɵɵdefineInjectable({ factory: function AutofillMonitor_Factory() { return new AutofillMonitor(i0__namespace.ɵɵinject(i1__namespace.Platform), i0__namespace.ɵɵinject(i0__namespace.NgZone)); }, token: AutofillMonitor, providedIn: "root" });
    AutofillMonitor.decorators = [
        { type: i0.Injectable, args: [{ providedIn: 'root' },] }
    ];
    AutofillMonitor.ctorParameters = function () { return [
        { type: i1.Platform },
        { type: i0.NgZone }
    ]; };
    /** A directive that can be used to monitor the autofill state of an input. */
    var CdkAutofill = /** @class */ (function () {
        function CdkAutofill(_elementRef, _autofillMonitor) {
            this._elementRef = _elementRef;
            this._autofillMonitor = _autofillMonitor;
            /** Emits when the autofill state of the element changes. */
            this.cdkAutofill = new i0.EventEmitter();
        }
        CdkAutofill.prototype.ngOnInit = function () {
            var _this = this;
            this._autofillMonitor
                .monitor(this._elementRef)
                .subscribe(function (event) { return _this.cdkAutofill.emit(event); });
        };
        CdkAutofill.prototype.ngOnDestroy = function () {
            this._autofillMonitor.stopMonitoring(this._elementRef);
        };
        return CdkAutofill;
    }());
    CdkAutofill.decorators = [
        { type: i0.Directive, args: [{
                    selector: '[cdkAutofill]',
                },] }
    ];
    CdkAutofill.ctorParameters = function () { return [
        { type: i0.ElementRef },
        { type: AutofillMonitor }
    ]; };
    CdkAutofill.propDecorators = {
        cdkAutofill: [{ type: i0.Output }]
    };

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Directive to automatically resize a textarea to fit its content. */
    var CdkTextareaAutosize = /** @class */ (function () {
        function CdkTextareaAutosize(_elementRef, _platform, _ngZone, 
        /** @breaking-change 11.0.0 make document required */
        document) {
            var _this = this;
            this._elementRef = _elementRef;
            this._platform = _platform;
            this._ngZone = _ngZone;
            this._destroyed = new rxjs.Subject();
            this._enabled = true;
            /**
             * Value of minRows as of last resize. If the minRows has decreased, the
             * height of the textarea needs to be recomputed to reflect the new minimum. The maxHeight
             * does not have the same problem because it does not affect the textarea's scrollHeight.
             */
            this._previousMinRows = -1;
            this._isViewInited = false;
            /** Handles `focus` and `blur` events. */
            this._handleFocusEvent = function (event) {
                _this._hasFocus = event.type === 'focus';
            };
            this._document = document;
            this._textareaElement = this._elementRef.nativeElement;
        }
        Object.defineProperty(CdkTextareaAutosize.prototype, "minRows", {
            /** Minimum amount of rows in the textarea. */
            get: function () { return this._minRows; },
            set: function (value) {
                this._minRows = coercion.coerceNumberProperty(value);
                this._setMinHeight();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkTextareaAutosize.prototype, "maxRows", {
            /** Maximum amount of rows in the textarea. */
            get: function () { return this._maxRows; },
            set: function (value) {
                this._maxRows = coercion.coerceNumberProperty(value);
                this._setMaxHeight();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkTextareaAutosize.prototype, "enabled", {
            /** Whether autosizing is enabled or not */
            get: function () { return this._enabled; },
            set: function (value) {
                value = coercion.coerceBooleanProperty(value);
                // Only act if the actual value changed. This specifically helps to not run
                // resizeToFitContent too early (i.e. before ngAfterViewInit)
                if (this._enabled !== value) {
                    (this._enabled = value) ? this.resizeToFitContent(true) : this.reset();
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CdkTextareaAutosize.prototype, "placeholder", {
            get: function () { return this._textareaElement.placeholder; },
            set: function (value) {
                this._cachedPlaceholderHeight = undefined;
                this._textareaElement.placeholder = value;
                this._cacheTextareaPlaceholderHeight();
            },
            enumerable: false,
            configurable: true
        });
        /** Sets the minimum height of the textarea as determined by minRows. */
        CdkTextareaAutosize.prototype._setMinHeight = function () {
            var minHeight = this.minRows && this._cachedLineHeight ?
                this.minRows * this._cachedLineHeight + "px" : null;
            if (minHeight) {
                this._textareaElement.style.minHeight = minHeight;
            }
        };
        /** Sets the maximum height of the textarea as determined by maxRows. */
        CdkTextareaAutosize.prototype._setMaxHeight = function () {
            var maxHeight = this.maxRows && this._cachedLineHeight ?
                this.maxRows * this._cachedLineHeight + "px" : null;
            if (maxHeight) {
                this._textareaElement.style.maxHeight = maxHeight;
            }
        };
        CdkTextareaAutosize.prototype.ngAfterViewInit = function () {
            var _this = this;
            if (this._platform.isBrowser) {
                // Remember the height which we started with in case autosizing is disabled
                this._initialHeight = this._textareaElement.style.height;
                this.resizeToFitContent();
                this._ngZone.runOutsideAngular(function () {
                    var window = _this._getWindow();
                    rxjs.fromEvent(window, 'resize')
                        .pipe(operators.auditTime(16), operators.takeUntil(_this._destroyed))
                        .subscribe(function () { return _this.resizeToFitContent(true); });
                    _this._textareaElement.addEventListener('focus', _this._handleFocusEvent);
                    _this._textareaElement.addEventListener('blur', _this._handleFocusEvent);
                });
                this._isViewInited = true;
                this.resizeToFitContent(true);
            }
        };
        CdkTextareaAutosize.prototype.ngOnDestroy = function () {
            this._textareaElement.removeEventListener('focus', this._handleFocusEvent);
            this._textareaElement.removeEventListener('blur', this._handleFocusEvent);
            this._destroyed.next();
            this._destroyed.complete();
        };
        /**
         * Cache the height of a single-row textarea if it has not already been cached.
         *
         * We need to know how large a single "row" of a textarea is in order to apply minRows and
         * maxRows. For the initial version, we will assume that the height of a single line in the
         * textarea does not ever change.
         */
        CdkTextareaAutosize.prototype._cacheTextareaLineHeight = function () {
            if (this._cachedLineHeight) {
                return;
            }
            // Use a clone element because we have to override some styles.
            var textareaClone = this._textareaElement.cloneNode(false);
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
        };
        CdkTextareaAutosize.prototype._measureScrollHeight = function () {
            var element = this._textareaElement;
            var previousMargin = element.style.marginBottom || '';
            var isFirefox = this._platform.FIREFOX;
            var needsMarginFiller = isFirefox && this._hasFocus;
            var measuringClass = isFirefox ?
                'cdk-textarea-autosize-measuring-firefox' :
                'cdk-textarea-autosize-measuring';
            // In some cases the page might move around while we're measuring the `textarea` on Firefox. We
            // work around it by assigning a temporary margin with the same height as the `textarea` so that
            // it occupies the same amount of space. See #23233.
            if (needsMarginFiller) {
                element.style.marginBottom = element.clientHeight + "px";
            }
            // Reset the textarea height to auto in order to shrink back to its default size.
            // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
            element.classList.add(measuringClass);
            // The measuring class includes a 2px padding to workaround an issue with Chrome,
            // so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
            var scrollHeight = element.scrollHeight - 4;
            element.classList.remove(measuringClass);
            if (needsMarginFiller) {
                element.style.marginBottom = previousMargin;
            }
            return scrollHeight;
        };
        CdkTextareaAutosize.prototype._cacheTextareaPlaceholderHeight = function () {
            if (!this._isViewInited || this._cachedPlaceholderHeight != undefined) {
                return;
            }
            if (!this.placeholder) {
                this._cachedPlaceholderHeight = 0;
                return;
            }
            var value = this._textareaElement.value;
            this._textareaElement.value = this._textareaElement.placeholder;
            this._cachedPlaceholderHeight = this._measureScrollHeight();
            this._textareaElement.value = value;
        };
        CdkTextareaAutosize.prototype.ngDoCheck = function () {
            if (this._platform.isBrowser) {
                this.resizeToFitContent();
            }
        };
        /**
         * Resize the textarea to fit its content.
         * @param force Whether to force a height recalculation. By default the height will be
         *    recalculated only if the value changed since the last call.
         */
        CdkTextareaAutosize.prototype.resizeToFitContent = function (force) {
            var _this = this;
            if (force === void 0) { force = false; }
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
            var textarea = this._elementRef.nativeElement;
            var value = textarea.value;
            // Only resize if the value or minRows have changed since these calculations can be expensive.
            if (!force && this._minRows === this._previousMinRows && value === this._previousValue) {
                return;
            }
            var scrollHeight = this._measureScrollHeight();
            var height = Math.max(scrollHeight, this._cachedPlaceholderHeight || 0);
            // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
            textarea.style.height = height + "px";
            this._ngZone.runOutsideAngular(function () {
                if (typeof requestAnimationFrame !== 'undefined') {
                    requestAnimationFrame(function () { return _this._scrollToCaretPosition(textarea); });
                }
                else {
                    setTimeout(function () { return _this._scrollToCaretPosition(textarea); });
                }
            });
            this._previousValue = value;
            this._previousMinRows = this._minRows;
        };
        /**
         * Resets the textarea to its original size
         */
        CdkTextareaAutosize.prototype.reset = function () {
            // Do not try to change the textarea, if the initialHeight has not been determined yet
            // This might potentially remove styles when reset() is called before ngAfterViewInit
            if (this._initialHeight !== undefined) {
                this._textareaElement.style.height = this._initialHeight;
            }
        };
        // In Ivy the `host` metadata will be merged, whereas in ViewEngine it is overridden. In order
        // to avoid double event listeners, we need to use `HostListener`. Once Ivy is the default, we
        // can move this back into `host`.
        // tslint:disable:no-host-decorator-in-concrete
        CdkTextareaAutosize.prototype._noopInputHandler = function () {
            // no-op handler that ensures we're running change detection on input events.
        };
        /** Access injected document if available or fallback to global document reference */
        CdkTextareaAutosize.prototype._getDocument = function () {
            return this._document || document;
        };
        /** Use defaultView of injected document if available or fallback to global window reference */
        CdkTextareaAutosize.prototype._getWindow = function () {
            var doc = this._getDocument();
            return doc.defaultView || window;
        };
        /**
         * Scrolls a textarea to the caret position. On Firefox resizing the textarea will
         * prevent it from scrolling to the caret position. We need to re-set the selection
         * in order for it to scroll to the proper position.
         */
        CdkTextareaAutosize.prototype._scrollToCaretPosition = function (textarea) {
            var selectionStart = textarea.selectionStart, selectionEnd = textarea.selectionEnd;
            // IE will throw an "Unspecified error" if we try to set the selection range after the
            // element has been removed from the DOM. Assert that the directive hasn't been destroyed
            // between the time we requested the animation frame and when it was executed.
            // Also note that we have to assert that the textarea is focused before we set the
            // selection range. Setting the selection range on a non-focused textarea will cause
            // it to receive focus on IE and Edge.
            if (!this._destroyed.isStopped && this._hasFocus) {
                textarea.setSelectionRange(selectionStart, selectionEnd);
            }
        };
        return CdkTextareaAutosize;
    }());
    CdkTextareaAutosize.decorators = [
        { type: i0.Directive, args: [{
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
    CdkTextareaAutosize.ctorParameters = function () { return [
        { type: i0.ElementRef },
        { type: i1.Platform },
        { type: i0.NgZone },
        { type: undefined, decorators: [{ type: i0.Optional }, { type: i0.Inject, args: [common.DOCUMENT,] }] }
    ]; };
    CdkTextareaAutosize.propDecorators = {
        minRows: [{ type: i0.Input, args: ['cdkAutosizeMinRows',] }],
        maxRows: [{ type: i0.Input, args: ['cdkAutosizeMaxRows',] }],
        enabled: [{ type: i0.Input, args: ['cdkTextareaAutosize',] }],
        placeholder: [{ type: i0.Input }],
        _noopInputHandler: [{ type: i0.HostListener, args: ['input',] }]
    };

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var TextFieldModule = /** @class */ (function () {
        function TextFieldModule() {
        }
        return TextFieldModule;
    }());
    TextFieldModule.decorators = [
        { type: i0.NgModule, args: [{
                    declarations: [CdkAutofill, CdkTextareaAutosize],
                    imports: [i1.PlatformModule],
                    exports: [CdkAutofill, CdkTextareaAutosize],
                },] }
    ];

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.AutofillMonitor = AutofillMonitor;
    exports.CdkAutofill = CdkAutofill;
    exports.CdkTextareaAutosize = CdkTextareaAutosize;
    exports.TextFieldModule = TextFieldModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-text-field.umd.js.map
