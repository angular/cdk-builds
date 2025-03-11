import * as i0 from '@angular/core';
import { OnDestroy, EventEmitter, InjectionToken, AfterContentInit } from '@angular/core';

type Direction = 'ltr' | 'rtl';
/**
 * The directionality (LTR / RTL) context for the application (or a subtree of it).
 * Exposes the current direction and a stream of direction changes.
 */
declare class Directionality implements OnDestroy {
    /** The current 'ltr' or 'rtl' value. */
    readonly value: Direction;
    /** Stream that emits whenever the 'ltr' / 'rtl' state changes. */
    readonly change: EventEmitter<Direction>;
    constructor(...args: unknown[]);
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<Directionality, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<Directionality>;
}

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
declare const DIR_DOCUMENT: InjectionToken<Document>;

/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
declare class Dir implements Directionality, AfterContentInit, OnDestroy {
    /** Normalized direction that accounts for invalid/unsupported values. */
    private _dir;
    /** Whether the `value` has been set to its initial value. */
    private _isInitialized;
    /** Direction as passed in by the consumer. */
    _rawDir: string;
    /** Event emitted when the direction changes. */
    readonly change: EventEmitter<Direction>;
    /** @docs-private */
    get dir(): Direction;
    set dir(value: Direction | 'auto');
    /** Current layout direction of the element. */
    get value(): Direction;
    /** Initialize once default value has been set. */
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<Dir, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<Dir, "[dir]", ["dir"], { "dir": { "alias": "dir"; "required": false; }; }, { "change": "dirChange"; }, never, never, true, never>;
}

declare class BidiModule {
    static ɵfac: i0.ɵɵFactoryDeclaration<BidiModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<BidiModule, never, [typeof Dir], [typeof Dir]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<BidiModule>;
}

export { BidiModule, DIR_DOCUMENT, Dir, type Direction, Directionality };
