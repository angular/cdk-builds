import { __decorate, __param, __metadata } from 'tslib';
import { InjectionToken, inject, EventEmitter, ɵɵdefineInjectable, ɵɵinject, Injectable, Optional, Inject, Output, Input, Directive, NgModule } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
 *
 * This token is defined in a separate file from Directionality as a workaround for
 * https://github.com/angular/angular/issues/22559
 *
 * @docs-private
 */
const DIR_DOCUMENT = new InjectionToken('cdk-dir-doc', {
    providedIn: 'root',
    factory: DIR_DOCUMENT_FACTORY,
});
/** @docs-private */
function DIR_DOCUMENT_FACTORY() {
    return inject(DOCUMENT);
}

/**
 * The directionality (LTR / RTL) context for the application (or a subtree of it).
 * Exposes the current direction and a stream of direction changes.
 */
let Directionality = /** @class */ (() => {
    let Directionality = class Directionality {
        constructor(_document) {
            /** The current 'ltr' or 'rtl' value. */
            this.value = 'ltr';
            /** Stream that emits whenever the 'ltr' / 'rtl' state changes. */
            this.change = new EventEmitter();
            if (_document) {
                // TODO: handle 'auto' value -
                // We still need to account for dir="auto".
                // It looks like HTMLElemenet.dir is also "auto" when that's set to the attribute,
                // but getComputedStyle return either "ltr" or "rtl". avoiding getComputedStyle for now
                const bodyDir = _document.body ? _document.body.dir : null;
                const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
                const value = bodyDir || htmlDir;
                this.value = (value === 'ltr' || value === 'rtl') ? value : 'ltr';
            }
        }
        ngOnDestroy() {
            this.change.complete();
        }
    };
    Directionality.ɵprov = ɵɵdefineInjectable({ factory: function Directionality_Factory() { return new Directionality(ɵɵinject(DIR_DOCUMENT, 8)); }, token: Directionality, providedIn: "root" });
    Directionality = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(0, Optional()), __param(0, Inject(DIR_DOCUMENT)),
        __metadata("design:paramtypes", [Object])
    ], Directionality);
    return Directionality;
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
let Dir = /** @class */ (() => {
    var Dir_1;
    let Dir = Dir_1 = class Dir {
        constructor() {
            /** Normalized direction that accounts for invalid/unsupported values. */
            this._dir = 'ltr';
            /** Whether the `value` has been set to its initial value. */
            this._isInitialized = false;
            /** Event emitted when the direction changes. */
            this.change = new EventEmitter();
        }
        /** @docs-private */
        get dir() { return this._dir; }
        set dir(value) {
            const old = this._dir;
            const normalizedValue = value ? value.toLowerCase() : value;
            this._rawDir = value;
            this._dir = (normalizedValue === 'ltr' || normalizedValue === 'rtl') ? normalizedValue : 'ltr';
            if (old !== this._dir && this._isInitialized) {
                this.change.emit(this._dir);
            }
        }
        /** Current layout direction of the element. */
        get value() { return this.dir; }
        /** Initialize once default value has been set. */
        ngAfterContentInit() {
            this._isInitialized = true;
        }
        ngOnDestroy() {
            this.change.complete();
        }
    };
    __decorate([
        Output('dirChange'),
        __metadata("design:type", Object)
    ], Dir.prototype, "change", void 0);
    __decorate([
        Input(),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], Dir.prototype, "dir", null);
    Dir = Dir_1 = __decorate([
        Directive({
            selector: '[dir]',
            providers: [{ provide: Directionality, useExisting: Dir_1 }],
            host: { '[attr.dir]': '_rawDir' },
            exportAs: 'dir',
        })
    ], Dir);
    return Dir;
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
let BidiModule = /** @class */ (() => {
    let BidiModule = class BidiModule {
    };
    BidiModule = __decorate([
        NgModule({
            exports: [Dir],
            declarations: [Dir],
        })
    ], BidiModule);
    return BidiModule;
})();

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

export { BidiModule, DIR_DOCUMENT, Dir, Directionality, DIR_DOCUMENT_FACTORY as ɵangular_material_src_cdk_bidi_bidi_a };
//# sourceMappingURL=bidi.js.map
