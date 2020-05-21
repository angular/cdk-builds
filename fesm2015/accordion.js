import { __decorate, __metadata, __param } from 'tslib';
import { Input, Directive, EventEmitter, Output, Optional, SkipSelf, ChangeDetectorRef, NgModule } from '@angular/core';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subject, Subscription } from 'rxjs';

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Used to generate unique ID for each accordion. */
let nextId = 0;
/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 */
let CdkAccordion = /** @class */ (() => {
    let CdkAccordion = class CdkAccordion {
        constructor() {
            /** Emits when the state of the accordion changes */
            this._stateChanges = new Subject();
            /** Stream that emits true/false when openAll/closeAll is triggered. */
            this._openCloseAllActions = new Subject();
            /** A readonly id value to use for unique selection coordination. */
            this.id = `cdk-accordion-${nextId++}`;
            this._multi = false;
        }
        /** Whether the accordion should allow multiple expanded accordion items simultaneously. */
        get multi() { return this._multi; }
        set multi(multi) { this._multi = coerceBooleanProperty(multi); }
        /** Opens all enabled accordion items in an accordion where multi is enabled. */
        openAll() {
            this._openCloseAll(true);
        }
        /** Closes all enabled accordion items in an accordion where multi is enabled. */
        closeAll() {
            this._openCloseAll(false);
        }
        ngOnChanges(changes) {
            this._stateChanges.next(changes);
        }
        ngOnDestroy() {
            this._stateChanges.complete();
        }
        _openCloseAll(expanded) {
            if (this.multi) {
                this._openCloseAllActions.next(expanded);
            }
        }
    };
    __decorate([
        Input(),
        __metadata("design:type", Boolean),
        __metadata("design:paramtypes", [Boolean])
    ], CdkAccordion.prototype, "multi", null);
    CdkAccordion = __decorate([
        Directive({
            selector: 'cdk-accordion, [cdkAccordion]',
            exportAs: 'cdkAccordion',
        })
    ], CdkAccordion);
    return CdkAccordion;
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Used to generate unique ID for each accordion item. */
let nextId$1 = 0;
const ɵ0 = undefined;
/**
 * An basic directive expected to be extended and decorated as a component.  Sets up all
 * events and attributes needed to be managed by a CdkAccordion parent.
 */
let CdkAccordionItem = /** @class */ (() => {
    let CdkAccordionItem = class CdkAccordionItem {
        constructor(accordion, _changeDetectorRef, _expansionDispatcher) {
            this.accordion = accordion;
            this._changeDetectorRef = _changeDetectorRef;
            this._expansionDispatcher = _expansionDispatcher;
            /** Subscription to openAll/closeAll events. */
            this._openCloseAllSubscription = Subscription.EMPTY;
            /** Event emitted every time the AccordionItem is closed. */
            this.closed = new EventEmitter();
            /** Event emitted every time the AccordionItem is opened. */
            this.opened = new EventEmitter();
            /** Event emitted when the AccordionItem is destroyed. */
            this.destroyed = new EventEmitter();
            /**
             * Emits whenever the expanded state of the accordion changes.
             * Primarily used to facilitate two-way binding.
             * @docs-private
             */
            this.expandedChange = new EventEmitter();
            /** The unique AccordionItem id. */
            this.id = `cdk-accordion-child-${nextId$1++}`;
            this._expanded = false;
            this._disabled = false;
            /** Unregister function for _expansionDispatcher. */
            this._removeUniqueSelectionListener = () => { };
            this._removeUniqueSelectionListener =
                _expansionDispatcher.listen((id, accordionId) => {
                    if (this.accordion && !this.accordion.multi &&
                        this.accordion.id === accordionId && this.id !== id) {
                        this.expanded = false;
                    }
                });
            // When an accordion item is hosted in an accordion, subscribe to open/close events.
            if (this.accordion) {
                this._openCloseAllSubscription = this._subscribeToOpenCloseAllActions();
            }
        }
        /** Whether the AccordionItem is expanded. */
        get expanded() { return this._expanded; }
        set expanded(expanded) {
            expanded = coerceBooleanProperty(expanded);
            // Only emit events and update the internal value if the value changes.
            if (this._expanded !== expanded) {
                this._expanded = expanded;
                this.expandedChange.emit(expanded);
                if (expanded) {
                    this.opened.emit();
                    /**
                     * In the unique selection dispatcher, the id parameter is the id of the CdkAccordionItem,
                     * the name value is the id of the accordion.
                     */
                    const accordionId = this.accordion ? this.accordion.id : this.id;
                    this._expansionDispatcher.notify(this.id, accordionId);
                }
                else {
                    this.closed.emit();
                }
                // Ensures that the animation will run when the value is set outside of an `@Input`.
                // This includes cases like the open, close and toggle methods.
                this._changeDetectorRef.markForCheck();
            }
        }
        /** Whether the AccordionItem is disabled. */
        get disabled() { return this._disabled; }
        set disabled(disabled) { this._disabled = coerceBooleanProperty(disabled); }
        /** Emits an event for the accordion item being destroyed. */
        ngOnDestroy() {
            this.opened.complete();
            this.closed.complete();
            this.destroyed.emit();
            this.destroyed.complete();
            this._removeUniqueSelectionListener();
            this._openCloseAllSubscription.unsubscribe();
        }
        /** Toggles the expanded state of the accordion item. */
        toggle() {
            if (!this.disabled) {
                this.expanded = !this.expanded;
            }
        }
        /** Sets the expanded state of the accordion item to false. */
        close() {
            if (!this.disabled) {
                this.expanded = false;
            }
        }
        /** Sets the expanded state of the accordion item to true. */
        open() {
            if (!this.disabled) {
                this.expanded = true;
            }
        }
        _subscribeToOpenCloseAllActions() {
            return this.accordion._openCloseAllActions.subscribe(expanded => {
                // Only change expanded state if item is enabled
                if (!this.disabled) {
                    this.expanded = expanded;
                }
            });
        }
    };
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], CdkAccordionItem.prototype, "closed", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], CdkAccordionItem.prototype, "opened", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], CdkAccordionItem.prototype, "destroyed", void 0);
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], CdkAccordionItem.prototype, "expandedChange", void 0);
    __decorate([
        Input(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], CdkAccordionItem.prototype, "expanded", null);
    __decorate([
        Input(),
        __metadata("design:type", Object),
        __metadata("design:paramtypes", [Object])
    ], CdkAccordionItem.prototype, "disabled", null);
    CdkAccordionItem = __decorate([
        Directive({
            selector: 'cdk-accordion-item, [cdkAccordionItem]',
            exportAs: 'cdkAccordionItem',
            providers: [
                // Provide CdkAccordion as undefined to prevent nested accordion items from registering
                // to the same accordion.
                { provide: CdkAccordion, useValue: ɵ0 },
            ],
        }),
        __param(0, Optional()), __param(0, SkipSelf()),
        __metadata("design:paramtypes", [CdkAccordion,
            ChangeDetectorRef,
            UniqueSelectionDispatcher])
    ], CdkAccordionItem);
    return CdkAccordionItem;
})();

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
let CdkAccordionModule = /** @class */ (() => {
    let CdkAccordionModule = class CdkAccordionModule {
    };
    CdkAccordionModule = __decorate([
        NgModule({
            exports: [CdkAccordion, CdkAccordionItem],
            declarations: [CdkAccordion, CdkAccordionItem],
        })
    ], CdkAccordionModule);
    return CdkAccordionModule;
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

export { CdkAccordion, CdkAccordionItem, CdkAccordionModule };
//# sourceMappingURL=accordion.js.map
