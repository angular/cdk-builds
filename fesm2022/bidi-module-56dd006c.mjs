import * as i0 from '@angular/core';
import { EventEmitter, Directive, Output, Input, NgModule } from '@angular/core';
import { _ as _resolveDirectionality, D as Directionality } from './directionality-0a678adc.mjs';

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

export { BidiModule as B, Dir as D };
//# sourceMappingURL=bidi-module-56dd006c.mjs.map
