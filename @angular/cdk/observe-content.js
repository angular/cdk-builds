/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, ElementRef, EventEmitter, Injectable, Input, NgModule, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { RxChain, debounceTime } from '@angular/cdk/rxjs';

/**
 * Factory that creates a new MutationObserver and allows us to stub it out in unit tests.
 * \@docs-private
 */
class MdMutationObserverFactory {
    /**
     * @param {?} callback
     * @return {?}
     */
    create(callback) {
        return typeof MutationObserver === 'undefined' ? null : new MutationObserver(callback);
    }
}
MdMutationObserverFactory.decorators = [
    { type: Injectable },
];
/**
 * @nocollapse
 */
MdMutationObserverFactory.ctorParameters = () => [];
/**
 * Directive that triggers a callback whenever the content of
 * its associated element has changed.
 */
class ObserveContent {
    /**
     * @param {?} _mutationObserverFactory
     * @param {?} _elementRef
     */
    constructor(_mutationObserverFactory, _elementRef) {
        this._mutationObserverFactory = _mutationObserverFactory;
        this._elementRef = _elementRef;
        /**
         * Event emitted for each change in the element's content.
         */
        this.event = new EventEmitter();
        /**
         * Used for debouncing the emitted values to the observeContent event.
         */
        this._debouncer = new Subject();
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        if (this.debounce > 0) {
            RxChain.from(this._debouncer)
                .call(debounceTime, this.debounce)
                .subscribe((mutations) => this.event.emit(mutations));
        }
        else {
            this._debouncer.subscribe(mutations => this.event.emit(mutations));
        }
        this._observer = this._mutationObserverFactory.create((mutations) => {
            this._debouncer.next(mutations);
        });
        if (this._observer) {
            this._observer.observe(this._elementRef.nativeElement, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        if (this._observer) {
            this._observer.disconnect();
            this._debouncer.complete();
        }
    }
}
ObserveContent.decorators = [
    { type: Directive, args: [{
                selector: '[cdkObserveContent]'
            },] },
];
/**
 * @nocollapse
 */
ObserveContent.ctorParameters = () => [
    { type: MdMutationObserverFactory, },
    { type: ElementRef, },
];
ObserveContent.propDecorators = {
    'event': [{ type: Output, args: ['cdkObserveContent',] },],
    'debounce': [{ type: Input },],
};
class ObserveContentModule {
}
ObserveContentModule.decorators = [
    { type: NgModule, args: [{
                exports: [ObserveContent],
                declarations: [ObserveContent],
                providers: [MdMutationObserverFactory]
            },] },
];
/**
 * @nocollapse
 */
ObserveContentModule.ctorParameters = () => [];

/**
 * Generated bundle index. Do not edit.
 */

export { MdMutationObserverFactory, ObserveContent, ObserveContentModule };
//# sourceMappingURL=observe-content.js.map
