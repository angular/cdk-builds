import * as i0 from '@angular/core';
import { InjectionToken, inject, EventEmitter, Injectable, Directive, Output, Input, NgModule } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Injection token used to inject the document into Directionality.
 * This is used so that the value can be faked in tests.
 *
 * We can't use the real document in tests because changing the real `dir` causes geometry-based
 * tests in Safari to fail.
 *
 * We also can't re-provide the DOCUMENT token from platform-browser because the unit tests
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
/**
 * @docs-private
 * @deprecated No longer used, will be removed.
 * @breaking-change 21.0.0
 */
function DIR_DOCUMENT_FACTORY() {
    return inject(DOCUMENT);
}

/** Regex that matches locales with an RTL script. Taken from `goog.i18n.bidi.isRtlLanguage`. */
const RTL_LOCALE_PATTERN = /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;
/** Resolves a string value to a specific direction. */
function _resolveDirectionality(rawValue) {
    const value = rawValue?.toLowerCase() || '';
    if (value === 'auto' && typeof navigator !== 'undefined' && navigator?.language) {
        return RTL_LOCALE_PATTERN.test(navigator.language) ? 'rtl' : 'ltr';
    }
    return value === 'rtl' ? 'rtl' : 'ltr';
}
/**
 * The directionality (LTR / RTL) context for the application (or a subtree of it).
 * Exposes the current direction and a stream of direction changes.
 */
class Directionality {
    /** The current 'ltr' or 'rtl' value. */
    value = 'ltr';
    /** Stream that emits whenever the 'ltr' / 'rtl' state changes. */
    change = new EventEmitter();
    constructor() {
        const _document = inject(DIR_DOCUMENT, { optional: true });
        if (_document) {
            const bodyDir = _document.body ? _document.body.dir : null;
            const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
            this.value = _resolveDirectionality(bodyDir || htmlDir || 'ltr');
        }
    }
    ngOnDestroy() {
        this.change.complete();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: Directionality, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: Directionality, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: Directionality, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });

/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
class Dir {
    /** Normalized direction that accounts for invalid/unsupported values. */
    _dir = 'ltr';
    /** Whether the `value` has been set to its initial value. */
    _isInitialized = false;
    /** Direction as passed in by the consumer. */
    _rawDir;
    /** Event emitted when the direction changes. */
    change = new EventEmitter();
    /** @docs-private */
    get dir() {
        return this._dir;
    }
    set dir(value) {
        const previousValue = this._dir;
        // Note: `_resolveDirectionality` resolves the language based on the browser's language,
        // whereas the browser does it based on the content of the element. Since doing so based
        // on the content can be expensive, for now we're doing the simpler matching.
        this._dir = _resolveDirectionality(value);
        this._rawDir = value;
        if (previousValue !== this._dir && this._isInitialized) {
            this.change.emit(this._dir);
        }
    }
    /** Current layout direction of the element. */
    get value() {
        return this.dir;
    }
    /** Initialize once default value has been set. */
    ngAfterContentInit() {
        this._isInitialized = true;
    }
    ngOnDestroy() {
        this.change.complete();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: Dir, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.2.0", type: Dir, isStandalone: true, selector: "[dir]", inputs: { dir: "dir" }, outputs: { change: "dirChange" }, host: { properties: { "attr.dir": "_rawDir" } }, providers: [{ provide: Directionality, useExisting: Dir }], exportAs: ["dir"], ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: Dir, decorators: [{
            type: Directive,
            args: [{
                    selector: '[dir]',
                    providers: [{ provide: Directionality, useExisting: Dir }],
                    host: { '[attr.dir]': '_rawDir' },
                    exportAs: 'dir',
                }]
        }], propDecorators: { change: [{
                type: Output,
                args: ['dirChange']
            }], dir: [{
                type: Input
            }] } });

class BidiModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: BidiModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "19.2.0", ngImport: i0, type: BidiModule, imports: [Dir], exports: [Dir] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: BidiModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.0", ngImport: i0, type: BidiModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [Dir],
                    exports: [Dir],
                }]
        }] });

export { BidiModule, DIR_DOCUMENT, Dir, Directionality };
//# sourceMappingURL=bidi.mjs.map
