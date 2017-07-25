/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('rxjs/Subject'), require('@angular/cdk/rxjs')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core', 'rxjs/Subject', '@angular/cdk/rxjs'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk['observe-content'] = global.ng.cdk['observe-content'] || {}),global.ng.core,global.Rx,global.ng.cdk.rxjs));
}(this, (function (exports,_angular_core,rxjs_Subject,_angular_cdk_rxjs) { 'use strict';

/**
 * Factory that creates a new MutationObserver and allows us to stub it out in unit tests.
 * \@docs-private
 */
var MdMutationObserverFactory = (function () {
    function MdMutationObserverFactory() {
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    MdMutationObserverFactory.prototype.create = function (callback) {
        return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
    };
    return MdMutationObserverFactory;
}());
MdMutationObserverFactory.decorators = [
    { type: _angular_core.Injectable },
];
/**
 * @nocollapse
 */
MdMutationObserverFactory.ctorParameters = function () { return []; };
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
var ObserveContent = (function () {
    /**
     * @param {?} _mutationObserverFactory
     * @param {?} _elementRef
     */
    function ObserveContent(_mutationObserverFactory, _elementRef) {
        this._mutationObserverFactory = _mutationObserverFactory;
        this._elementRef = _elementRef;
        /**
         * Event emitted for each change in the element's content.
         */
        this.event = new _angular_core.EventEmitter();
        /**
         * Used for debouncing the emitted values to the observeContent event.
         */
        this._debouncer = new rxjs_Subject.Subject();
    }
    /**
     * @return {?}
     */
    ObserveContent.prototype.ngAfterContentInit = function () {
        var _this = this;
        if (this.debounce > 0) {
            _angular_cdk_rxjs.RxChain.from(this._debouncer)
                .call(_angular_cdk_rxjs.debounceTime, this.debounce)
                .subscribe(function (mutations) { return _this.event.emit(mutations); });
        }
        else {
            this._debouncer.subscribe(function (mutations) { return _this.event.emit(mutations); });
        }
        this._observer = this._mutationObserverFactory.create(function (mutations) {
            _this._debouncer.next(mutations);
        });
        if (this._observer) {
            this._observer.observe(this._elementRef.nativeElement, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }
    };
    /**
     * @return {?}
     */
    ObserveContent.prototype.ngOnDestroy = function () {
        if (this._observer) {
            this._observer.disconnect();
            this._debouncer.complete();
        }
    };
    return ObserveContent;
}());
ObserveContent.decorators = [
    { type: _angular_core.Directive, args: [{
                selector: '[cdkObserveContent]'
            },] },
];
/**
 * @nocollapse
 */
ObserveContent.ctorParameters = function () { return [
    { type: MdMutationObserverFactory, },
    { type: _angular_core.ElementRef, },
]; };
ObserveContent.propDecorators = {
    'event': [{ type: _angular_core.Output, args: ['cdkObserveContent',] },],
    'debounce': [{ type: _angular_core.Input },],
};
var ObserveContentModule = (function () {
    function ObserveContentModule() {
    }
    return ObserveContentModule;
}());
ObserveContentModule.decorators = [
    { type: _angular_core.NgModule, args: [{
                exports: [ObserveContent],
                declarations: [ObserveContent],
                providers: [MdMutationObserverFactory]
            },] },
];
/**
 * @nocollapse
 */
ObserveContentModule.ctorParameters = function () { return []; };

exports.MdMutationObserverFactory = MdMutationObserverFactory;
exports.ObserveContent = ObserveContent;
exports.ObserveContentModule = ObserveContentModule;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-observe-content.umd.js.map
