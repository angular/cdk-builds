/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '@angular/core';
import 'rxjs/Subject';
import { debounceTime } from 'rxjs/operators/debounceTime';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Factory that creates a new MutationObserver and allows us to stub it out in unit tests.
 * \@docs-private
 */
var MutationObserverFactory = /** @class */ (function () {
    function MutationObserverFactory() {
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    MutationObserverFactory.prototype.create = /**
     * @param {?} callback
     * @return {?}
     */
    function (callback) {
        return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
    };
    return MutationObserverFactory;
}());
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
var CdkObserveContent = /** @class */ (function () {
    function CdkObserveContent(_mutationObserverFactory, _elementRef, _ngZone) {
        this._mutationObserverFactory = _mutationObserverFactory;
        this._elementRef = _elementRef;
        this._ngZone = _ngZone;
    }
    /**
     * @return {?}
     */
    CdkObserveContent.prototype.ngAfterContentInit = /**
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.debounce > 0) {
            this._ngZone.runOutsideAngular(function () {
                _this._debouncer.pipe(debounceTime(_this.debounce))
                    .subscribe(function (mutations) { return _this.event.emit(mutations); });
            });
        }
        else {
            this._debouncer.subscribe(function (mutations) { return _this.event.emit(mutations); });
        }
        this._observer = this._ngZone.runOutsideAngular(function () {
            return _this._mutationObserverFactory.create(function (mutations) {
                _this._debouncer.next(mutations);
            });
        });
        if (this._observer) {
            this._observer.observe(this._elementRef.nativeElement, {
                'characterData': true,
                'childList': true,
                'subtree': true
            });
        }
    };
    /**
     * @return {?}
     */
    CdkObserveContent.prototype.ngOnDestroy = /**
     * @return {?}
     */
    function () {
        if (this._observer) {
            this._observer.disconnect();
        }
        this._debouncer.complete();
    };
    return CdkObserveContent;
}());
var ObserversModule = /** @class */ (function () {
    function ObserversModule() {
    }
    return ObserversModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Generated bundle index. Do not edit.
 */

export { CdkObserveContent as ObserveContent, MutationObserverFactory, CdkObserveContent, ObserversModule };
//# sourceMappingURL=observers.es5.js.map
