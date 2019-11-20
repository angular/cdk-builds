(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/cdk/platform'), require('@angular/core'), require('@angular/cdk/coercion'), require('rxjs'), require('@angular/common'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/text-field', ['exports', '@angular/cdk/platform', '@angular/core', '@angular/cdk/coercion', 'rxjs', '@angular/common', 'rxjs/operators'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.textField = {}), global.ng.cdk.platform, global.ng.core, global.ng.cdk.coercion, global.rxjs, global.ng.common, global.rxjs.operators));
}(this, (function (exports, platform, i0, coercion, rxjs, common, operators) { 'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // Whether the current platform supports the V8 Break Iterator. The V8 check
    // is necessary to detect all Blink based browsers.
    var hasV8BreakIterator;
    // We need a try/catch around the reference to `Intl`, because accessing it in some cases can
    // cause IE to throw. These cases are tied to particular versions of Windows and can happen if
    // the consumer is providing a polyfilled `Map`. See:
    // https://github.com/Microsoft/ChakraCore/issues/3189
    // https://github.com/angular/components/issues/15687
    try {
        hasV8BreakIterator = (typeof Intl !== 'undefined' && Intl.v8BreakIterator);
    }
    catch (_a) {
        hasV8BreakIterator = false;
    }
    /**
     * Service to detect the current platform by comparing the userAgent strings and
     * checking browser-specific global properties.
     */
    var Platform = /** @class */ (function () {
        /**
         * @breaking-change 8.0.0 remove optional decorator
         */
        function Platform(_platformId) {
            this._platformId = _platformId;
            // We want to use the Angular platform check because if the Document is shimmed
            // without the navigator, the following checks will fail. This is preferred because
            // sometimes the Document may be shimmed without the user's knowledge or intention
            /** Whether the Angular application is being rendered in the browser. */
            this.isBrowser = this._platformId ?
                common.isPlatformBrowser(this._platformId) : typeof document === 'object' && !!document;
            /** Whether the current browser is Microsoft Edge. */
            this.EDGE = this.isBrowser && /(edge)/i.test(navigator.userAgent);
            /** Whether the current rendering engine is Microsoft Trident. */
            this.TRIDENT = this.isBrowser && /(msie|trident)/i.test(navigator.userAgent);
            // EdgeHTML and Trident mock Blink specific things and need to be excluded from this check.
            /** Whether the current rendering engine is Blink. */
            this.BLINK = this.isBrowser && (!!(window.chrome || hasV8BreakIterator) &&
                typeof CSS !== 'undefined' && !this.EDGE && !this.TRIDENT);
            // Webkit is part of the userAgent in EdgeHTML, Blink and Trident. Therefore we need to
            // ensure that Webkit runs standalone and is not used as another engine's base.
            /** Whether the current rendering engine is WebKit. */
            this.WEBKIT = this.isBrowser &&
                /AppleWebKit/i.test(navigator.userAgent) && !this.BLINK && !this.EDGE && !this.TRIDENT;
            /** Whether the current platform is Apple iOS. */
            this.IOS = this.isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                !('MSStream' in window);
            // It's difficult to detect the plain Gecko engine, because most of the browsers identify
            // them self as Gecko-like browsers and modify the userAgent's according to that.
            // Since we only cover one explicit Firefox case, we can simply check for Firefox
            // instead of having an unstable check for Gecko.
            /** Whether the current browser is Firefox. */
            this.FIREFOX = this.isBrowser && /(firefox|minefield)/i.test(navigator.userAgent);
            /** Whether the current platform is Android. */
            // Trident on mobile adds the android platform to the userAgent to trick detections.
            this.ANDROID = this.isBrowser && /android/i.test(navigator.userAgent) && !this.TRIDENT;
            // Safari browsers will include the Safari keyword in their userAgent. Some browsers may fake
            // this and just place the Safari keyword in the userAgent. To be more safe about Safari every
            // Safari browser should also use Webkit as its layout engine.
            /** Whether the current browser is Safari. */
            this.SAFARI = this.isBrowser && /safari/i.test(navigator.userAgent) && this.WEBKIT;
        }
        Platform.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        Platform.ctorParameters = function () { return [
            { type: Object, decorators: [{ type: i0.Optional }, { type: i0.Inject, args: [i0.PLATFORM_ID,] }] }
        ]; };
        Platform.ɵprov = i0.ɵɵdefineInjectable({ factory: function Platform_Factory() { return new Platform(i0.ɵɵinject(i0.PLATFORM_ID, 8)); }, token: Platform, providedIn: "root" });
        return Platform;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Options to pass to the animationstart listener. */
    var listenerOptions = platform.normalizePassiveListenerOptions({ passive: true });
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
                return info.subject.asObservable();
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
            return result.asObservable();
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
        AutofillMonitor.decorators = [
            { type: i0.Injectable, args: [{ providedIn: 'root' },] }
        ];
        /** @nocollapse */
        AutofillMonitor.ctorParameters = function () { return [
            { type: platform.Platform },
            { type: i0.NgZone }
        ]; };
        AutofillMonitor.ɵprov = i0.ɵɵdefineInjectable({ factory: function AutofillMonitor_Factory() { return new AutofillMonitor(i0.ɵɵinject(Platform), i0.ɵɵinject(i0.NgZone)); }, token: AutofillMonitor, providedIn: "root" });
        return AutofillMonitor;
    }());
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
        CdkAutofill.decorators = [
            { type: i0.Directive, args: [{
                        selector: '[cdkAutofill]',
                    },] }
        ];
        /** @nocollapse */
        CdkAutofill.ctorParameters = function () { return [
            { type: i0.ElementRef },
            { type: AutofillMonitor }
        ]; };
        CdkAutofill.propDecorators = {
            cdkAutofill: [{ type: i0.Output }]
        };
        return CdkAutofill;
    }());

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /** Directive to automatically resize a textarea to fit its content. */
    var CdkTextareaAutosize = /** @class */ (function () {
        function CdkTextareaAutosize(_elementRef, _platform, _ngZone) {
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
            this._textareaElement = this._elementRef.nativeElement;
        }
        Object.defineProperty(CdkTextareaAutosize.prototype, "minRows", {
            /** Minimum amount of rows in the textarea. */
            get: function () { return this._minRows; },
            set: function (value) {
                this._minRows = coercion.coerceNumberProperty(value);
                this._setMinHeight();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CdkTextareaAutosize.prototype, "maxRows", {
            /** Maximum amount of rows in the textarea. */
            get: function () { return this._maxRows; },
            set: function (value) {
                this._maxRows = coercion.coerceNumberProperty(value);
                this._setMaxHeight();
            },
            enumerable: true,
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
            enumerable: true,
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
                    rxjs.fromEvent(window, 'resize')
                        .pipe(operators.auditTime(16), operators.takeUntil(_this._destroyed))
                        .subscribe(function () { return _this.resizeToFitContent(true); });
                });
            }
        };
        CdkTextareaAutosize.prototype.ngOnDestroy = function () {
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
            this._textareaElement.parentNode.removeChild(textareaClone);
            // Min and max heights have to be re-calculated if the cached line height changes
            this._setMinHeight();
            this._setMaxHeight();
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
            var placeholderText = textarea.placeholder;
            // Reset the textarea height to auto in order to shrink back to its default size.
            // Also temporarily force overflow:hidden, so scroll bars do not interfere with calculations.
            // Long placeholders that are wider than the textarea width may lead to a bigger scrollHeight
            // value. To ensure that the scrollHeight is not bigger than the content, the placeholders
            // need to be removed temporarily.
            textarea.classList.add('cdk-textarea-autosize-measuring');
            textarea.placeholder = '';
            // The cdk-textarea-autosize-measuring class includes a 2px padding to workaround an issue with
            // Chrome, so we account for that extra space here by subtracting 4 (2px top + 2px bottom).
            var height = textarea.scrollHeight - 4;
            // Use the scrollHeight to know how large the textarea *would* be if fit its entire value.
            textarea.style.height = height + "px";
            textarea.classList.remove('cdk-textarea-autosize-measuring');
            textarea.placeholder = placeholderText;
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
            if (this._initialHeight === undefined) {
                return;
            }
            this._textareaElement.style.height = this._initialHeight;
        };
        CdkTextareaAutosize.prototype._noopInputHandler = function () {
            // no-op handler that ensures we're running change detection on input events.
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
            if (!this._destroyed.isStopped && document.activeElement === textarea) {
                textarea.setSelectionRange(selectionStart, selectionEnd);
            }
        };
        CdkTextareaAutosize.decorators = [
            { type: i0.Directive, args: [{
                        selector: 'textarea[cdkTextareaAutosize]',
                        exportAs: 'cdkTextareaAutosize',
                        host: {
                            'class': 'cdk-textarea-autosize',
                            // Textarea elements that have the directive applied should have a single row by default.
                            // Browsers normally show two rows by default and therefore this limits the minRows binding.
                            'rows': '1',
                            '(input)': '_noopInputHandler()',
                        },
                    },] }
        ];
        /** @nocollapse */
        CdkTextareaAutosize.ctorParameters = function () { return [
            { type: i0.ElementRef },
            { type: platform.Platform },
            { type: i0.NgZone }
        ]; };
        CdkTextareaAutosize.propDecorators = {
            minRows: [{ type: i0.Input, args: ['cdkAutosizeMinRows',] }],
            maxRows: [{ type: i0.Input, args: ['cdkAutosizeMaxRows',] }],
            enabled: [{ type: i0.Input, args: ['cdkTextareaAutosize',] }]
        };
        return CdkTextareaAutosize;
    }());

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
        TextFieldModule.decorators = [
            { type: i0.NgModule, args: [{
                        declarations: [CdkAutofill, CdkTextareaAutosize],
                        imports: [platform.PlatformModule],
                        exports: [CdkAutofill, CdkTextareaAutosize],
                    },] }
        ];
        return TextFieldModule;
    }());

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
