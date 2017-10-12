/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, Directive, EventEmitter, Input, NgModule, Optional, Output } from '@angular/core';
import { UNIQUE_SELECTION_DISPATCHER_PROVIDER, UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

/**
 * Used to generate unique ID for each accordion.
 */
var nextId$1 = 0;
/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 */
var CdkAccordion = (function () {
    function CdkAccordion() {
        /**
         * A readonly id value to use for unique selection coordination.
         */
        this.id = "cdk-accordion-" + nextId$1++;
        this._multi = false;
    }
    Object.defineProperty(CdkAccordion.prototype, "multi", {
        /**
         * Whether the accordion should allow multiple expanded accordion items simulateously.
         * @return {?}
         */
        get: function () { return this._multi; },
        /**
         * @param {?} multi
         * @return {?}
         */
        set: function (multi) { this._multi = coerceBooleanProperty(multi); },
        enumerable: true,
        configurable: true
    });
    CdkAccordion.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-accordion, [cdk-accordion]',
                    exportAs: 'cdkAccordion',
                },] },
    ];
    /**
     * @nocollapse
     */
    CdkAccordion.ctorParameters = function () { return []; };
    CdkAccordion.propDecorators = {
        'multi': [{ type: Input },],
    };
    return CdkAccordion;
}());

/**
 * Used to generate unique ID for each accordion item.
 */
var nextId = 0;
/**
 * An basic directive expected to be extended and decorated as a component.  Sets up all
 * events and attributes needed to be managed by a CdkAccordion parent.
 */
var CdkAccordionItem = (function () {
    /**
     * @param {?} accordion
     * @param {?} _changeDetectorRef
     * @param {?} _expansionDispatcher
     */
    function CdkAccordionItem(accordion, _changeDetectorRef, _expansionDispatcher) {
        var _this = this;
        this.accordion = accordion;
        this._changeDetectorRef = _changeDetectorRef;
        this._expansionDispatcher = _expansionDispatcher;
        /**
         * Event emitted every time the AccordionItem is closed.
         */
        this.closed = new EventEmitter();
        /**
         * Event emitted every time the AccordionItem is opened.
         */
        this.opened = new EventEmitter();
        /**
         * Event emitted when the AccordionItem is destroyed.
         */
        this.destroyed = new EventEmitter();
        /**
         * The unique AccordionItem id.
         */
        this.id = "cdk-accordion-child-" + nextId++;
        /**
         * Unregister function for _expansionDispatcher.
         */
        this._removeUniqueSelectionListener = function () { };
        this._removeUniqueSelectionListener =
            _expansionDispatcher.listen(function (id, accordionId) {
                if (_this.accordion && !_this.accordion.multi &&
                    _this.accordion.id === accordionId && _this.id !== id) {
                    _this.expanded = false;
                }
            });
    }
    Object.defineProperty(CdkAccordionItem.prototype, "expanded", {
        /**
         * Whether the AccordionItem is expanded.
         * @return {?}
         */
        get: function () { return this._expanded; },
        /**
         * @param {?} expanded
         * @return {?}
         */
        set: function (expanded) {
            // Only emit events and update the internal value if the value changes.
            if (this._expanded !== expanded) {
                this._expanded = expanded;
                if (expanded) {
                    this.opened.emit();
                    /**
                     * In the unique selection dispatcher, the id parameter is the id of the CdkAccordionItem,
                     * the name value is the id of the accordion.
                     */
                    var accordionId = this.accordion ? this.accordion.id : this.id;
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
    /**
     * Emits an event for the accordion item being destroyed.
     * @return {?}
     */
    CdkAccordionItem.prototype.ngOnDestroy = function () {
        this.destroyed.emit();
        this._removeUniqueSelectionListener();
    };
    /**
     * Toggles the expanded state of the accordion item.
     * @return {?}
     */
    CdkAccordionItem.prototype.toggle = function () {
        this.expanded = !this.expanded;
    };
    /**
     * Sets the expanded state of the accordion item to false.
     * @return {?}
     */
    CdkAccordionItem.prototype.close = function () {
        this.expanded = false;
    };
    /**
     * Sets the expanded state of the accordion item to true.
     * @return {?}
     */
    CdkAccordionItem.prototype.open = function () {
        this.expanded = true;
    };
    CdkAccordionItem.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-accordion-item',
                    exportAs: 'cdkAccordionItem',
                },] },
    ];
    /**
     * @nocollapse
     */
    CdkAccordionItem.ctorParameters = function () { return [
        { type: CdkAccordion, decorators: [{ type: Optional },] },
        { type: ChangeDetectorRef, },
        { type: UniqueSelectionDispatcher, },
    ]; };
    CdkAccordionItem.propDecorators = {
        'closed': [{ type: Output },],
        'opened': [{ type: Output },],
        'destroyed': [{ type: Output },],
        'expanded': [{ type: Input },],
    };
    return CdkAccordionItem;
}());

var CdkAccordionModule = (function () {
    function CdkAccordionModule() {
    }
    CdkAccordionModule.decorators = [
        { type: NgModule, args: [{
                    exports: [CdkAccordion, CdkAccordionItem],
                    declarations: [CdkAccordion, CdkAccordionItem],
                    providers: [UNIQUE_SELECTION_DISPATCHER_PROVIDER],
                },] },
    ];
    /**
     * @nocollapse
     */
    CdkAccordionModule.ctorParameters = function () { return []; };
    return CdkAccordionModule;
}());

/**
 * Generated bundle index. Do not edit.
 */

export { CdkAccordionItem, CdkAccordion, CdkAccordionModule };
//# sourceMappingURL=accordion.es5.js.map
