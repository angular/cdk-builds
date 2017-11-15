/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '@angular/core';
import '@angular/platform-browser';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Injection token used to inject the document into Directionality.
 * This is used so that the value can be faked in tests.
 *
 * We can't use the real document in tests because changing the real `dir` causes geometry-based
 * tests in Safari to fail.
 *
 * We also can't re-provide the DOCUMENT token from platform-brower because the unit tests
 * themselves use things like `querySelector` in test code.
 */
const DIR_DOCUMENT = new InjectionToken('cdk-dir-doc');
/**
 * The directionality (LTR / RTL) context for the application (or a subtree of it).
 * Exposes the current direction and a stream of direction changes.
 */
class Directionality {
    /**
     * @param {?=} _document
     */
    constructor(_document) {
        if (_document) {
            // TODO: handle 'auto' value -
            // We still need to account for dir="auto".
            // It looks like HTMLElemenet.dir is also "auto" when that's set to the attribute,
            // but getComputedStyle return either "ltr" or "rtl". avoiding getComputedStyle for now
            const /** @type {?} */ bodyDir = _document.body ? _document.body.dir : null;
            const /** @type {?} */ htmlDir = _document.documentElement ? _document.documentElement.dir : null;
            this.value = /** @type {?} */ ((bodyDir || htmlDir || 'ltr'));
        }
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
class Dir {
    /**
     * \@docs-private
     * @return {?}
     */
    get dir() { return this._dir; }
    /**
     * @param {?} v
     * @return {?}
     */
    set dir(v) {
        let /** @type {?} */ old = this._dir;
        this._dir = v;
        if (old !== this._dir && this._isInitialized) {
            this.change.emit();
        }
    }
    /**
     * Current layout direction of the element.
     * @return {?}
     */
    get value() { return this.dir; }
    /**
     * Initialize once default value has been set.
     * @return {?}
     */
    ngAfterContentInit() {
        this._isInitialized = true;
    }
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

class BidiModule {
}

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

export { Directionality, DIR_DOCUMENT, Dir, BidiModule };
//# sourceMappingURL=bidi.js.map
