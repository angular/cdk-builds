/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/cdk/collections'), require('@angular/cdk/coercion')) :
	typeof define === 'function' && define.amd ? define(['exports', '@angular/core', '@angular/cdk/collections', '@angular/cdk/coercion'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.accordion = global.ng.cdk.accordion || {}),global.ng.core,global.ng.cdk.collections,global.ng.cdk.coercion));
}(this, (function (exports,_angular_core,_angular_cdk_collections,_angular_cdk_coercion) { 'use strict';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 */
var CdkAccordion = /** @class */ (function () {
    function CdkAccordion() {
    }
    Object.defineProperty(CdkAccordion.prototype, "multi", {
        get: /**
         * Whether the accordion should allow multiple expanded accordion items simulateously.
         * @return {?}
         */
        function () { return this._multi; },
        set: /**
         * @param {?} multi
         * @return {?}
         */
        function (multi) { this._multi = _angular_cdk_coercion.coerceBooleanProperty(multi); },
        enumerable: true,
        configurable: true
    });
    return CdkAccordion;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * An basic directive expected to be extended and decorated as a component.  Sets up all
 * events and attributes needed to be managed by a CdkAccordion parent.
 */
var CdkAccordionItem = /** @class */ (function () {
    function CdkAccordionItem(accordion, _changeDetectorRef, _expansionDispatcher) {
        var _this = this;
        this.accordion = accordion;
        this._changeDetectorRef = _changeDetectorRef;
        this._expansionDispatcher = _expansionDispatcher;
        this._removeUniqueSelectionListener =
            _expansionDispatcher.listen(function (id, accordionId) {
                if (_this.accordion && !_this.accordion.multi &&
                    _this.accordion.id === accordionId && _this.id !== id) {
                    _this.expanded = false;
                }
            });
    }
    Object.defineProperty(CdkAccordionItem.prototype, "expanded", {
        get: /**
         * Whether the AccordionItem is expanded.
         * @return {?}
         */
        function () { return this._expanded; },
        set: /**
         * @param {?} expanded
         * @return {?}
         */
        function (expanded) {
            expanded = _angular_cdk_coercion.coerceBooleanProperty(expanded);
            // Only emit events and update the internal value if the value changes.
            if (this._expanded !== expanded) {
                this._expanded = expanded;
                if (expanded) {
                    this.opened.emit();
                    /**
                     * In the unique selection dispatcher, the id parameter is the id of the CdkAccordionItem,
                     * the name value is the id of the accordion.
                     */
                    var /** @type {?} */ accordionId = this.accordion ? this.accordion.id : this.id;
                    this._expansionDispatcher.notify(this.id, accordionId);
                }
                else {
                    this.closed.emit();
                }
                // Ensures that the animation will run when the value is set outside of an `@Input`.
                // This includes cases like the open, close and toggle methods.
                this._changeDetectorRef.markForCheck();
            }
        },
        enumerable: true,
        configurable: true
    });
    /** Emits an event for the accordion item being destroyed. */
    /**
     * Emits an event for the accordion item being destroyed.
     * @return {?}
     */
    CdkAccordionItem.prototype.ngOnDestroy = /**
     * Emits an event for the accordion item being destroyed.
     * @return {?}
     */
    function () {
        this.destroyed.emit();
        this._removeUniqueSelectionListener();
    };
    /** Toggles the expanded state of the accordion item. */
    /**
     * Toggles the expanded state of the accordion item.
     * @return {?}
     */
    CdkAccordionItem.prototype.toggle = /**
     * Toggles the expanded state of the accordion item.
     * @return {?}
     */
    function () {
        this.expanded = !this.expanded;
    };
    /** Sets the expanded state of the accordion item to false. */
    /**
     * Sets the expanded state of the accordion item to false.
     * @return {?}
     */
    CdkAccordionItem.prototype.close = /**
     * Sets the expanded state of the accordion item to false.
     * @return {?}
     */
    function () {
        this.expanded = false;
    };
    /** Sets the expanded state of the accordion item to true. */
    /**
     * Sets the expanded state of the accordion item to true.
     * @return {?}
     */
    CdkAccordionItem.prototype.open = /**
     * Sets the expanded state of the accordion item to true.
     * @return {?}
     */
    function () {
        this.expanded = true;
    };
    return CdkAccordionItem;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

var CdkAccordionModule = /** @class */ (function () {
    function CdkAccordionModule() {
    }
    return CdkAccordionModule;
}());

exports.CdkAccordionItem = CdkAccordionItem;
exports.CdkAccordion = CdkAccordion;
exports.CdkAccordionModule = CdkAccordionModule;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-accordion.umd.js.map
