/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/stepper/stepper.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { END, ENTER, hasModifierKey, HOME, SPACE } from '@angular/cdk/keycodes';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, ElementRef, EventEmitter, forwardRef, Inject, InjectionToken, Input, Optional, Output, QueryList, TemplateRef, ViewChild, ViewEncapsulation, } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { CdkStepHeader } from './step-header';
import { CdkStepLabel } from './step-label';
/**
 * Used to generate unique ID for each stepper component.
 * @type {?}
 */
let nextId = 0;
/**
 * Change event emitted on selection changes.
 */
export class StepperSelectionEvent {
}
if (false) {
    /**
     * Index of the step now selected.
     * @type {?}
     */
    StepperSelectionEvent.prototype.selectedIndex;
    /**
     * Index of the step previously selected.
     * @type {?}
     */
    StepperSelectionEvent.prototype.previouslySelectedIndex;
    /**
     * The step instance now selected.
     * @type {?}
     */
    StepperSelectionEvent.prototype.selectedStep;
    /**
     * The step instance previously selected.
     * @type {?}
     */
    StepperSelectionEvent.prototype.previouslySelectedStep;
}
/**
 * Enum to represent the different states of the steps.
 * @type {?}
 */
export const STEP_STATE = {
    NUMBER: 'number',
    EDIT: 'edit',
    DONE: 'done',
    ERROR: 'error'
};
/**
 * InjectionToken that can be used to specify the global stepper options.
 * @type {?}
 */
export const STEPPER_GLOBAL_OPTIONS = new InjectionToken('STEPPER_GLOBAL_OPTIONS');
/**
 * InjectionToken that can be used to specify the global stepper options.
 * @deprecated Use `STEPPER_GLOBAL_OPTIONS` instead.
 * \@breaking-change 8.0.0.
 * @type {?}
 */
export const MAT_STEPPER_GLOBAL_OPTIONS = STEPPER_GLOBAL_OPTIONS;
/**
 * Configurable options for stepper.
 * @record
 */
export function StepperOptions() { }
if (false) {
    /**
     * Whether the stepper should display an error state or not.
     * Default behavior is assumed to be false.
     * @type {?|undefined}
     */
    StepperOptions.prototype.showError;
    /**
     * Whether the stepper should display the default indicator type
     * or not.
     * Default behavior is assumed to be true.
     * @type {?|undefined}
     */
    StepperOptions.prototype.displayDefaultIndicatorType;
}
let CdkStep = /** @class */ (() => {
    class CdkStep {
        /**
         * \@breaking-change 8.0.0 remove the `?` after `stepperOptions`
         * @param {?} _stepper
         * @param {?=} stepperOptions
         */
        constructor(_stepper, stepperOptions) {
            this._stepper = _stepper;
            /**
             * Whether user has seen the expanded step content or not.
             */
            this.interacted = false;
            this._editable = true;
            this._optional = false;
            this._completedOverride = null;
            this._customError = null;
            this._stepperOptions = stepperOptions ? stepperOptions : {};
            this._displayDefaultIndicatorType = this._stepperOptions.displayDefaultIndicatorType !== false;
            this._showError = !!this._stepperOptions.showError;
        }
        /**
         * Whether the user can return to this step once it has been marked as completed.
         * @return {?}
         */
        get editable() {
            return this._editable;
        }
        /**
         * @param {?} value
         * @return {?}
         */
        set editable(value) {
            this._editable = coerceBooleanProperty(value);
        }
        /**
         * Whether the completion of step is optional.
         * @return {?}
         */
        get optional() {
            return this._optional;
        }
        /**
         * @param {?} value
         * @return {?}
         */
        set optional(value) {
            this._optional = coerceBooleanProperty(value);
        }
        /**
         * Whether step is marked as completed.
         * @return {?}
         */
        get completed() {
            return this._completedOverride == null ? this._getDefaultCompleted() : this._completedOverride;
        }
        /**
         * @param {?} value
         * @return {?}
         */
        set completed(value) {
            this._completedOverride = coerceBooleanProperty(value);
        }
        /**
         * @private
         * @return {?}
         */
        _getDefaultCompleted() {
            return this.stepControl ? this.stepControl.valid && this.interacted : this.interacted;
        }
        /**
         * Whether step has an error.
         * @return {?}
         */
        get hasError() {
            return this._customError == null ? this._getDefaultError() : this._customError;
        }
        /**
         * @param {?} value
         * @return {?}
         */
        set hasError(value) {
            this._customError = coerceBooleanProperty(value);
        }
        /**
         * @private
         * @return {?}
         */
        _getDefaultError() {
            return this.stepControl && this.stepControl.invalid && this.interacted;
        }
        /**
         * Selects this step component.
         * @return {?}
         */
        select() {
            this._stepper.selected = this;
        }
        /**
         * Resets the step to its initial state. Note that this includes resetting form data.
         * @return {?}
         */
        reset() {
            this.interacted = false;
            if (this._completedOverride != null) {
                this._completedOverride = false;
            }
            if (this._customError != null) {
                this._customError = false;
            }
            if (this.stepControl) {
                this.stepControl.reset();
            }
        }
        /**
         * @return {?}
         */
        ngOnChanges() {
            // Since basically all inputs of the MatStep get proxied through the view down to the
            // underlying MatStepHeader, we have to make sure that change detection runs correctly.
            this._stepper._stateChanged();
        }
    }
    CdkStep.decorators = [
        { type: Component, args: [{
                    selector: 'cdk-step',
                    exportAs: 'cdkStep',
                    template: '<ng-template><ng-content></ng-content></ng-template>',
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush
                }] }
    ];
    /** @nocollapse */
    CdkStep.ctorParameters = () => [
        { type: CdkStepper, decorators: [{ type: Inject, args: [forwardRef((/**
                         * @return {?}
                         */
                        () => CdkStepper)),] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [STEPPER_GLOBAL_OPTIONS,] }] }
    ];
    CdkStep.propDecorators = {
        stepLabel: [{ type: ContentChild, args: [CdkStepLabel,] }],
        content: [{ type: ViewChild, args: [TemplateRef, { static: true },] }],
        stepControl: [{ type: Input }],
        label: [{ type: Input }],
        errorMessage: [{ type: Input }],
        ariaLabel: [{ type: Input, args: ['aria-label',] }],
        ariaLabelledby: [{ type: Input, args: ['aria-labelledby',] }],
        state: [{ type: Input }],
        editable: [{ type: Input }],
        optional: [{ type: Input }],
        completed: [{ type: Input }],
        hasError: [{ type: Input }]
    };
    return CdkStep;
})();
export { CdkStep };
if (false) {
    /** @type {?} */
    CdkStep.ngAcceptInputType_editable;
    /** @type {?} */
    CdkStep.ngAcceptInputType_hasError;
    /** @type {?} */
    CdkStep.ngAcceptInputType_optional;
    /** @type {?} */
    CdkStep.ngAcceptInputType_completed;
    /**
     * @type {?}
     * @private
     */
    CdkStep.prototype._stepperOptions;
    /** @type {?} */
    CdkStep.prototype._showError;
    /** @type {?} */
    CdkStep.prototype._displayDefaultIndicatorType;
    /**
     * Template for step label if it exists.
     * @type {?}
     */
    CdkStep.prototype.stepLabel;
    /**
     * Template for step content.
     * @type {?}
     */
    CdkStep.prototype.content;
    /**
     * The top level abstract control of the step.
     * @type {?}
     */
    CdkStep.prototype.stepControl;
    /**
     * Whether user has seen the expanded step content or not.
     * @type {?}
     */
    CdkStep.prototype.interacted;
    /**
     * Plain text label of the step.
     * @type {?}
     */
    CdkStep.prototype.label;
    /**
     * Error message to display when there's an error.
     * @type {?}
     */
    CdkStep.prototype.errorMessage;
    /**
     * Aria label for the tab.
     * @type {?}
     */
    CdkStep.prototype.ariaLabel;
    /**
     * Reference to the element that the tab is labelled by.
     * Will be cleared if `aria-label` is set at the same time.
     * @type {?}
     */
    CdkStep.prototype.ariaLabelledby;
    /**
     * State of the step.
     * @type {?}
     */
    CdkStep.prototype.state;
    /**
     * @type {?}
     * @private
     */
    CdkStep.prototype._editable;
    /**
     * @type {?}
     * @private
     */
    CdkStep.prototype._optional;
    /** @type {?} */
    CdkStep.prototype._completedOverride;
    /**
     * @type {?}
     * @private
     */
    CdkStep.prototype._customError;
    /**
     * @type {?}
     * @private
     */
    CdkStep.prototype._stepper;
}
let CdkStepper = /** @class */ (() => {
    class CdkStepper {
        /**
         * @param {?} _dir
         * @param {?} _changeDetectorRef
         * @param {?=} _elementRef
         * @param {?=} _document
         */
        constructor(_dir, _changeDetectorRef, _elementRef, _document) {
            this._dir = _dir;
            this._changeDetectorRef = _changeDetectorRef;
            this._elementRef = _elementRef;
            /**
             * Emits when the component is destroyed.
             */
            this._destroyed = new Subject();
            this._linear = false;
            this._selectedIndex = 0;
            /**
             * Event emitted when the selected step has changed.
             */
            this.selectionChange = new EventEmitter();
            this._orientation = 'horizontal';
            this._groupId = nextId++;
            this._document = _document;
        }
        /**
         * The list of step components that the stepper is holding.
         * @return {?}
         */
        get steps() {
            return this._steps;
        }
        /**
         * Whether the validity of previous steps should be checked or not.
         * @return {?}
         */
        get linear() {
            return this._linear;
        }
        /**
         * @param {?} value
         * @return {?}
         */
        set linear(value) {
            this._linear = coerceBooleanProperty(value);
        }
        /**
         * The index of the selected step.
         * @return {?}
         */
        get selectedIndex() {
            return this._selectedIndex;
        }
        /**
         * @param {?} index
         * @return {?}
         */
        set selectedIndex(index) {
            /** @type {?} */
            const newIndex = coerceNumberProperty(index);
            if (this.steps) {
                // Ensure that the index can't be out of bounds.
                if (newIndex < 0 || newIndex > this.steps.length - 1) {
                    throw Error('cdkStepper: Cannot assign out-of-bounds value to `selectedIndex`.');
                }
                if (this._selectedIndex != newIndex && !this._anyControlsInvalidOrPending(newIndex) &&
                    (newIndex >= this._selectedIndex || this.steps.toArray()[newIndex].editable)) {
                    this._updateSelectedItemIndex(index);
                }
            }
            else {
                this._selectedIndex = newIndex;
            }
        }
        /**
         * The step that is selected.
         * @return {?}
         */
        get selected() {
            // @breaking-change 8.0.0 Change return type to `CdkStep | undefined`.
            return this.steps ? this.steps.toArray()[this.selectedIndex] : (/** @type {?} */ (undefined));
        }
        /**
         * @param {?} step
         * @return {?}
         */
        set selected(step) {
            this.selectedIndex = this.steps ? this.steps.toArray().indexOf(step) : -1;
        }
        /**
         * @return {?}
         */
        ngAfterViewInit() {
            // Note that while the step headers are content children by default, any components that
            // extend this one might have them as view children. We initialize the keyboard handling in
            // AfterViewInit so we're guaranteed for both view and content children to be defined.
            this._keyManager = new FocusKeyManager(this._stepHeader)
                .withWrap()
                .withVerticalOrientation(this._orientation === 'vertical');
            (this._dir ? ((/** @type {?} */ (this._dir.change))) : observableOf())
                .pipe(startWith(this._layoutDirection()), takeUntil(this._destroyed))
                .subscribe((/**
             * @param {?} direction
             * @return {?}
             */
            direction => this._keyManager.withHorizontalOrientation(direction)));
            this._keyManager.updateActiveItem(this._selectedIndex);
            this.steps.changes.pipe(takeUntil(this._destroyed)).subscribe((/**
             * @return {?}
             */
            () => {
                if (!this.selected) {
                    this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
                }
            }));
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            this._destroyed.next();
            this._destroyed.complete();
        }
        /**
         * Selects and focuses the next step in list.
         * @return {?}
         */
        next() {
            this.selectedIndex = Math.min(this._selectedIndex + 1, this.steps.length - 1);
        }
        /**
         * Selects and focuses the previous step in list.
         * @return {?}
         */
        previous() {
            this.selectedIndex = Math.max(this._selectedIndex - 1, 0);
        }
        /**
         * Resets the stepper to its initial state. Note that this includes clearing form data.
         * @return {?}
         */
        reset() {
            this._updateSelectedItemIndex(0);
            this.steps.forEach((/**
             * @param {?} step
             * @return {?}
             */
            step => step.reset()));
            this._stateChanged();
        }
        /**
         * Returns a unique id for each step label element.
         * @param {?} i
         * @return {?}
         */
        _getStepLabelId(i) {
            return `cdk-step-label-${this._groupId}-${i}`;
        }
        /**
         * Returns unique id for each step content element.
         * @param {?} i
         * @return {?}
         */
        _getStepContentId(i) {
            return `cdk-step-content-${this._groupId}-${i}`;
        }
        /**
         * Marks the component to be change detected.
         * @return {?}
         */
        _stateChanged() {
            this._changeDetectorRef.markForCheck();
        }
        /**
         * Returns position state of the step with the given index.
         * @param {?} index
         * @return {?}
         */
        _getAnimationDirection(index) {
            /** @type {?} */
            const position = index - this._selectedIndex;
            if (position < 0) {
                return this._layoutDirection() === 'rtl' ? 'next' : 'previous';
            }
            else if (position > 0) {
                return this._layoutDirection() === 'rtl' ? 'previous' : 'next';
            }
            return 'current';
        }
        /**
         * Returns the type of icon to be displayed.
         * @param {?} index
         * @param {?=} state
         * @return {?}
         */
        _getIndicatorType(index, state = STEP_STATE.NUMBER) {
            /** @type {?} */
            const step = this.steps.toArray()[index];
            /** @type {?} */
            const isCurrentStep = this._isCurrentStep(index);
            return step._displayDefaultIndicatorType ? this._getDefaultIndicatorLogic(step, isCurrentStep) :
                this._getGuidelineLogic(step, isCurrentStep, state);
        }
        /**
         * @private
         * @param {?} step
         * @param {?} isCurrentStep
         * @return {?}
         */
        _getDefaultIndicatorLogic(step, isCurrentStep) {
            if (step._showError && step.hasError && !isCurrentStep) {
                return STEP_STATE.ERROR;
            }
            else if (!step.completed || isCurrentStep) {
                return STEP_STATE.NUMBER;
            }
            else {
                return step.editable ? STEP_STATE.EDIT : STEP_STATE.DONE;
            }
        }
        /**
         * @private
         * @param {?} step
         * @param {?} isCurrentStep
         * @param {?=} state
         * @return {?}
         */
        _getGuidelineLogic(step, isCurrentStep, state = STEP_STATE.NUMBER) {
            if (step._showError && step.hasError && !isCurrentStep) {
                return STEP_STATE.ERROR;
            }
            else if (step.completed && !isCurrentStep) {
                return STEP_STATE.DONE;
            }
            else if (step.completed && isCurrentStep) {
                return state;
            }
            else if (step.editable && isCurrentStep) {
                return STEP_STATE.EDIT;
            }
            else {
                return state;
            }
        }
        /**
         * @private
         * @param {?} index
         * @return {?}
         */
        _isCurrentStep(index) {
            return this._selectedIndex === index;
        }
        /**
         * Returns the index of the currently-focused step header.
         * @return {?}
         */
        _getFocusIndex() {
            return this._keyManager ? this._keyManager.activeItemIndex : this._selectedIndex;
        }
        /**
         * @private
         * @param {?} newIndex
         * @return {?}
         */
        _updateSelectedItemIndex(newIndex) {
            /** @type {?} */
            const stepsArray = this.steps.toArray();
            this.selectionChange.emit({
                selectedIndex: newIndex,
                previouslySelectedIndex: this._selectedIndex,
                selectedStep: stepsArray[newIndex],
                previouslySelectedStep: stepsArray[this._selectedIndex],
            });
            // If focus is inside the stepper, move it to the next header, otherwise it may become
            // lost when the active step content is hidden. We can't be more granular with the check
            // (e.g. checking whether focus is inside the active step), because we don't have a
            // reference to the elements that are rendering out the content.
            this._containsFocus() ? this._keyManager.setActiveItem(newIndex) :
                this._keyManager.updateActiveItem(newIndex);
            this._selectedIndex = newIndex;
            this._stateChanged();
        }
        /**
         * @param {?} event
         * @return {?}
         */
        _onKeydown(event) {
            /** @type {?} */
            const hasModifier = hasModifierKey(event);
            /** @type {?} */
            const keyCode = event.keyCode;
            /** @type {?} */
            const manager = this._keyManager;
            if (manager.activeItemIndex != null && !hasModifier &&
                (keyCode === SPACE || keyCode === ENTER)) {
                this.selectedIndex = manager.activeItemIndex;
                event.preventDefault();
            }
            else if (keyCode === HOME) {
                manager.setFirstItemActive();
                event.preventDefault();
            }
            else if (keyCode === END) {
                manager.setLastItemActive();
                event.preventDefault();
            }
            else {
                manager.onKeydown(event);
            }
        }
        /**
         * @private
         * @param {?} index
         * @return {?}
         */
        _anyControlsInvalidOrPending(index) {
            /** @type {?} */
            const steps = this.steps.toArray();
            steps[this._selectedIndex].interacted = true;
            if (this._linear && index >= 0) {
                return steps.slice(0, index).some((/**
                 * @param {?} step
                 * @return {?}
                 */
                step => {
                    /** @type {?} */
                    const control = step.stepControl;
                    /** @type {?} */
                    const isIncomplete = control ? (control.invalid || control.pending || !step.interacted) : !step.completed;
                    return isIncomplete && !step.optional && !step._completedOverride;
                }));
            }
            return false;
        }
        /**
         * @private
         * @return {?}
         */
        _layoutDirection() {
            return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
        }
        /**
         * Checks whether the stepper contains the focused element.
         * @private
         * @return {?}
         */
        _containsFocus() {
            if (!this._document || !this._elementRef) {
                return false;
            }
            /** @type {?} */
            const stepperElement = this._elementRef.nativeElement;
            /** @type {?} */
            const focusedElement = this._document.activeElement;
            return stepperElement === focusedElement || stepperElement.contains(focusedElement);
        }
    }
    CdkStepper.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkStepper]',
                    exportAs: 'cdkStepper',
                },] }
    ];
    /** @nocollapse */
    CdkStepper.ctorParameters = () => [
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: ChangeDetectorRef },
        { type: ElementRef },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ];
    CdkStepper.propDecorators = {
        _steps: [{ type: ContentChildren, args: [CdkStep, { descendants: true },] }],
        _stepHeader: [{ type: ContentChildren, args: [CdkStepHeader, { descendants: true },] }],
        linear: [{ type: Input }],
        selectedIndex: [{ type: Input }],
        selected: [{ type: Input }],
        selectionChange: [{ type: Output }]
    };
    return CdkStepper;
})();
export { CdkStepper };
if (false) {
    /** @type {?} */
    CdkStepper.ngAcceptInputType_editable;
    /** @type {?} */
    CdkStepper.ngAcceptInputType_optional;
    /** @type {?} */
    CdkStepper.ngAcceptInputType_completed;
    /** @type {?} */
    CdkStepper.ngAcceptInputType_hasError;
    /** @type {?} */
    CdkStepper.ngAcceptInputType_linear;
    /** @type {?} */
    CdkStepper.ngAcceptInputType_selectedIndex;
    /**
     * Emits when the component is destroyed.
     * @type {?}
     * @protected
     */
    CdkStepper.prototype._destroyed;
    /**
     * Used for managing keyboard focus.
     * @type {?}
     * @private
     */
    CdkStepper.prototype._keyManager;
    /**
     * \@breaking-change 8.0.0 Remove `| undefined` once the `_document`
     * constructor param is required.
     * @type {?}
     * @private
     */
    CdkStepper.prototype._document;
    /**
     * The list of step components that the stepper is holding.
     * @deprecated use `steps` instead
     * \@breaking-change 9.0.0 remove this property
     * @type {?}
     */
    CdkStepper.prototype._steps;
    /**
     * The list of step headers of the steps in the stepper.
     * @deprecated Type to be changed to `QueryList<CdkStepHeader>`.
     * \@breaking-change 8.0.0
     * @type {?}
     */
    CdkStepper.prototype._stepHeader;
    /**
     * @type {?}
     * @private
     */
    CdkStepper.prototype._linear;
    /**
     * @type {?}
     * @private
     */
    CdkStepper.prototype._selectedIndex;
    /**
     * Event emitted when the selected step has changed.
     * @type {?}
     */
    CdkStepper.prototype.selectionChange;
    /**
     * Used to track unique ID for each stepper component.
     * @type {?}
     */
    CdkStepper.prototype._groupId;
    /**
     * @type {?}
     * @protected
     */
    CdkStepper.prototype._orientation;
    /**
     * @type {?}
     * @private
     */
    CdkStepper.prototype._dir;
    /**
     * @type {?}
     * @private
     */
    CdkStepper.prototype._changeDetectorRef;
    /**
     * @type {?}
     * @private
     */
    CdkStepper.prototype._elementRef;
}
/**
 * Simplified representation of an "AbstractControl" from \@angular/forms.
 * Used to avoid having to bring in \@angular/forms for a single optional interface.
 * \@docs-private
 * @record
 */
function AbstractControlLike() { }
if (false) {
    /** @type {?} */
    AbstractControlLike.prototype.asyncValidator;
    /** @type {?} */
    AbstractControlLike.prototype.dirty;
    /** @type {?} */
    AbstractControlLike.prototype.disabled;
    /** @type {?} */
    AbstractControlLike.prototype.enabled;
    /** @type {?} */
    AbstractControlLike.prototype.errors;
    /** @type {?} */
    AbstractControlLike.prototype.invalid;
    /** @type {?} */
    AbstractControlLike.prototype.parent;
    /** @type {?} */
    AbstractControlLike.prototype.pending;
    /** @type {?} */
    AbstractControlLike.prototype.pristine;
    /** @type {?} */
    AbstractControlLike.prototype.root;
    /** @type {?} */
    AbstractControlLike.prototype.status;
    /** @type {?} */
    AbstractControlLike.prototype.statusChanges;
    /** @type {?} */
    AbstractControlLike.prototype.touched;
    /** @type {?} */
    AbstractControlLike.prototype.untouched;
    /** @type {?} */
    AbstractControlLike.prototype.updateOn;
    /** @type {?} */
    AbstractControlLike.prototype.valid;
    /** @type {?} */
    AbstractControlLike.prototype.validator;
    /** @type {?} */
    AbstractControlLike.prototype.value;
    /** @type {?} */
    AbstractControlLike.prototype.valueChanges;
    /**
     * @return {?}
     */
    AbstractControlLike.prototype.clearAsyncValidators = function () { };
    /**
     * @return {?}
     */
    AbstractControlLike.prototype.clearValidators = function () { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.disable = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.enable = function (opts) { };
    /**
     * @param {?} path
     * @return {?}
     */
    AbstractControlLike.prototype.get = function (path) { };
    /**
     * @param {?} errorCode
     * @param {?=} path
     * @return {?}
     */
    AbstractControlLike.prototype.getError = function (errorCode, path) { };
    /**
     * @param {?} errorCode
     * @param {?=} path
     * @return {?}
     */
    AbstractControlLike.prototype.hasError = function (errorCode, path) { };
    /**
     * @return {?}
     */
    AbstractControlLike.prototype.markAllAsTouched = function () { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.markAsDirty = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.markAsPending = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.markAsPristine = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.markAsTouched = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.markAsUntouched = function (opts) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    AbstractControlLike.prototype.patchValue = function (value, options) { };
    /**
     * @param {?=} value
     * @param {?=} options
     * @return {?}
     */
    AbstractControlLike.prototype.reset = function (value, options) { };
    /**
     * @param {?} newValidator
     * @return {?}
     */
    AbstractControlLike.prototype.setAsyncValidators = function (newValidator) { };
    /**
     * @param {?} errors
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.setErrors = function (errors, opts) { };
    /**
     * @param {?} parent
     * @return {?}
     */
    AbstractControlLike.prototype.setParent = function (parent) { };
    /**
     * @param {?} newValidator
     * @return {?}
     */
    AbstractControlLike.prototype.setValidators = function (newValidator) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    AbstractControlLike.prototype.setValue = function (value, options) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    AbstractControlLike.prototype.updateValueAndValidity = function (opts) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    AbstractControlLike.prototype.patchValue = function (value, options) { };
    /**
     * @param {?=} formState
     * @param {?=} options
     * @return {?}
     */
    AbstractControlLike.prototype.reset = function (formState, options) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    AbstractControlLike.prototype.setValue = function (value, options) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFZLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBRXJCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFlBQVksRUFDWixlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFdBQVcsRUFDWCxTQUFTLEVBQ1QsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBYSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7SUFHdEMsTUFBTSxHQUFHLENBQUM7Ozs7QUFZZCxNQUFNLE9BQU8scUJBQXFCO0NBWWpDOzs7Ozs7SUFWQyw4Q0FB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Qzs7SUFDL0Msb0NBQWU7O0lBQ2YsdUNBQWtCOztJQUNsQixzQ0FBaUI7O0lBQ2pCLHFDQUFvQzs7SUFDcEMsc0NBQWlCOztJQUNqQixxQ0FBWTs7SUFDWixzQ0FBaUI7O0lBQ2pCLHVDQUFrQjs7SUFDbEIsbUNBQTBCOztJQUMxQixxQ0FBZTs7SUFDZiw0Q0FBK0I7O0lBQy9CLHNDQUFpQjs7SUFDakIsd0NBQW1COztJQUNuQix1Q0FBYzs7SUFDZCxvQ0FBZTs7SUFDZix3Q0FBMEM7O0lBQzFDLG9DQUFXOztJQUNYLDJDQUE4Qjs7OztJQUM5QixxRUFBNkI7Ozs7SUFDN0IsZ0VBQXdCOzs7OztJQUN4Qiw0REFBMEI7Ozs7O0lBQzFCLDJEQUF5Qjs7Ozs7SUFDekIsd0RBQW9FOzs7Ozs7SUFDcEUsd0VBQXNFOzs7Ozs7SUFDdEUsd0VBQTBFOzs7O0lBQzFFLGlFQUF5Qjs7Ozs7SUFDekIsZ0VBQThCOzs7OztJQUM5QixrRUFBZ0M7Ozs7O0lBQ2hDLG1FQUFpQzs7Ozs7SUFDakMsa0VBQWdDOzs7OztJQUNoQyxvRUFBa0M7Ozs7OztJQUNsQyx5RUFBK0M7Ozs7OztJQUMvQyxvRUFBMkM7Ozs7O0lBQzNDLCtFQUMwQzs7Ozs7O0lBQzFDLHNFQUFpRTs7Ozs7SUFDakUsZ0VBQTZCOzs7OztJQUM3QiwwRUFDMEM7Ozs7OztJQUMxQyx1RUFBNkM7Ozs7O0lBQzdDLDJFQUF5Qzs7Ozs7O0lBQ3pDLHlFQUE0Qzs7Ozs7O0lBQzVDLHdFQUE0Qzs7Ozs7O0lBQzVDLHVFQUEwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbiwgRm9jdXNLZXlNYW5hZ2VyfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7XG4gIEJvb2xlYW5JbnB1dCxcbiAgY29lcmNlQm9vbGVhblByb3BlcnR5LFxuICBjb2VyY2VOdW1iZXJQcm9wZXJ0eSxcbiAgTnVtYmVySW5wdXRcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RU5ELCBFTlRFUiwgaGFzTW9kaWZpZXJLZXksIEhPTUUsIFNQQUNFfSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q2RrU3RlcEhlYWRlcn0gZnJvbSAnLi9zdGVwLWhlYWRlcic7XG5pbXBvcnQge0Nka1N0ZXBMYWJlbH0gZnJvbSAnLi9zdGVwLWxhYmVsJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIHN0ZXBwZXIgY29tcG9uZW50LiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogUG9zaXRpb24gc3RhdGUgb2YgdGhlIGNvbnRlbnQgb2YgZWFjaCBzdGVwIGluIHN0ZXBwZXIgdGhhdCBpcyB1c2VkIGZvciB0cmFuc2l0aW9uaW5nXG4gKiB0aGUgY29udGVudCBpbnRvIGNvcnJlY3QgcG9zaXRpb24gdXBvbiBzdGVwIHNlbGVjdGlvbiBjaGFuZ2UuXG4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSA9ICdwcmV2aW91cyd8J2N1cnJlbnQnfCduZXh0JztcblxuLyoqIFBvc3NpYmxlIG9yaWVudGF0aW9uIG9mIGEgc3RlcHBlci4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBwZXJPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJ3wndmVydGljYWwnO1xuXG4vKiogQ2hhbmdlIGV2ZW50IGVtaXR0ZWQgb24gc2VsZWN0aW9uIGNoYW5nZXMuICovXG5leHBvcnQgY2xhc3MgU3RlcHBlclNlbGVjdGlvbkV2ZW50IHtcbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgc3RlcCBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBub3cgc2VsZWN0ZWQuICovXG4gIHNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcblxuICAvKiogVGhlIHN0ZXAgaW5zdGFuY2UgcHJldmlvdXNseSBzZWxlY3RlZC4gKi9cbiAgcHJldmlvdXNseVNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcbn1cblxuLyoqIFRoZSBzdGF0ZSBvZiBlYWNoIHN0ZXAuICovXG5leHBvcnQgdHlwZSBTdGVwU3RhdGUgPSAnbnVtYmVyJ3wnZWRpdCd8J2RvbmUnfCdlcnJvcid8c3RyaW5nO1xuXG4vKiogRW51bSB0byByZXByZXNlbnQgdGhlIGRpZmZlcmVudCBzdGF0ZXMgb2YgdGhlIHN0ZXBzLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBfU1RBVEUgPSB7XG4gIE5VTUJFUjogJ251bWJlcicsXG4gIEVESVQ6ICdlZGl0JyxcbiAgRE9ORTogJ2RvbmUnLFxuICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuLyoqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBTVEVQUEVSX0dMT0JBTF9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPFN0ZXBwZXJPcHRpb25zPignU1RFUFBFUl9HTE9CQUxfT1BUSU9OUycpO1xuXG4vKipcbiAqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy5cbiAqIEBkZXByZWNhdGVkIFVzZSBgU1RFUFBFUl9HTE9CQUxfT1BUSU9OU2AgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjAuXG4gKi9cbmV4cG9ydCBjb25zdCBNQVRfU1RFUFBFUl9HTE9CQUxfT1BUSU9OUyA9IFNURVBQRVJfR0xPQkFMX09QVElPTlM7XG5cbi8qKiBDb25maWd1cmFibGUgb3B0aW9ucyBmb3Igc3RlcHBlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcHBlck9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RlcHBlciBzaG91bGQgZGlzcGxheSBhbiBlcnJvciBzdGF0ZSBvciBub3QuXG4gICAqIERlZmF1bHQgYmVoYXZpb3IgaXMgYXNzdW1lZCB0byBiZSBmYWxzZS5cbiAgICovXG4gIHNob3dFcnJvcj86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0ZXBwZXIgc2hvdWxkIGRpc3BsYXkgdGhlIGRlZmF1bHQgaW5kaWNhdG9yIHR5cGVcbiAgICogb3Igbm90LlxuICAgKiBEZWZhdWx0IGJlaGF2aW9yIGlzIGFzc3VtZWQgdG8gYmUgdHJ1ZS5cbiAgICovXG4gIGRpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZT86IGJvb2xlYW47XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1zdGVwJyxcbiAgZXhwb3J0QXM6ICdjZGtTdGVwJyxcbiAgdGVtcGxhdGU6ICc8bmctdGVtcGxhdGU+PG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PjwvbmctdGVtcGxhdGU+JyxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXAgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICBwcml2YXRlIF9zdGVwcGVyT3B0aW9uczogU3RlcHBlck9wdGlvbnM7XG4gIF9zaG93RXJyb3I6IGJvb2xlYW47XG4gIF9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGU6IGJvb2xlYW47XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBzdGVwIGxhYmVsIGlmIGl0IGV4aXN0cy4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtTdGVwTGFiZWwpIHN0ZXBMYWJlbDogQ2RrU3RlcExhYmVsO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3Igc3RlcCBjb250ZW50LiAqL1xuICBAVmlld0NoaWxkKFRlbXBsYXRlUmVmLCB7c3RhdGljOiB0cnVlfSkgY29udGVudDogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKiogVGhlIHRvcCBsZXZlbCBhYnN0cmFjdCBjb250cm9sIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBzdGVwQ29udHJvbDogQWJzdHJhY3RDb250cm9sTGlrZTtcblxuICAvKiogV2hldGhlciB1c2VyIGhhcyBzZWVuIHRoZSBleHBhbmRlZCBzdGVwIGNvbnRlbnQgb3Igbm90LiAqL1xuICBpbnRlcmFjdGVkID0gZmFsc2U7XG5cbiAgLyoqIFBsYWluIHRleHQgbGFiZWwgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIGxhYmVsOiBzdHJpbmc7XG5cbiAgLyoqIEVycm9yIG1lc3NhZ2UgdG8gZGlzcGxheSB3aGVuIHRoZXJlJ3MgYW4gZXJyb3IuICovXG4gIEBJbnB1dCgpIGVycm9yTWVzc2FnZTogc3RyaW5nO1xuXG4gIC8qKiBBcmlhIGxhYmVsIGZvciB0aGUgdGFiLiAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWwnKSBhcmlhTGFiZWw6IHN0cmluZztcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHRoYXQgdGhlIHRhYiBpcyBsYWJlbGxlZCBieS5cbiAgICogV2lsbCBiZSBjbGVhcmVkIGlmIGBhcmlhLWxhYmVsYCBpcyBzZXQgYXQgdGhlIHNhbWUgdGltZS5cbiAgICovXG4gIEBJbnB1dCgnYXJpYS1sYWJlbGxlZGJ5JykgYXJpYUxhYmVsbGVkYnk6IHN0cmluZztcblxuICAvKiogU3RhdGUgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIHN0YXRlOiBTdGVwU3RhdGU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgY2FuIHJldHVybiB0byB0aGlzIHN0ZXAgb25jZSBpdCBoYXMgYmVlbiBtYXJrZWQgYXMgY29tcGxldGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZWRpdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2VkaXRhYmxlO1xuICB9XG4gIHNldCBlZGl0YWJsZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2VkaXRhYmxlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9lZGl0YWJsZSA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNvbXBsZXRpb24gb2Ygc3RlcCBpcyBvcHRpb25hbC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9wdGlvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25hbDtcbiAgfVxuICBzZXQgb3B0aW9uYWwodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9vcHRpb25hbCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfb3B0aW9uYWwgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzdGVwIGlzIG1hcmtlZCBhcyBjb21wbGV0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjb21wbGV0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID09IG51bGwgPyB0aGlzLl9nZXREZWZhdWx0Q29tcGxldGVkKCkgOiB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZTtcbiAgfVxuICBzZXQgY29tcGxldGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIF9jb21wbGV0ZWRPdmVycmlkZTogYm9vbGVhbnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9nZXREZWZhdWx0Q29tcGxldGVkKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sID8gdGhpcy5zdGVwQ29udHJvbC52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQgOiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogV2hldGhlciBzdGVwIGhhcyBhbiBlcnJvci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGhhc0Vycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jdXN0b21FcnJvciA9PSBudWxsID8gdGhpcy5fZ2V0RGVmYXVsdEVycm9yKCkgOiB0aGlzLl9jdXN0b21FcnJvcjtcbiAgfVxuICBzZXQgaGFzRXJyb3IodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jdXN0b21FcnJvciA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfY3VzdG9tRXJyb3I6IGJvb2xlYW58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEVycm9yKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sICYmIHRoaXMuc3RlcENvbnRyb2wuaW52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCByZW1vdmUgdGhlIGA/YCBhZnRlciBgc3RlcHBlck9wdGlvbnNgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQEluamVjdChmb3J3YXJkUmVmKCgpID0+IENka1N0ZXBwZXIpKSBwcml2YXRlIF9zdGVwcGVyOiBDZGtTdGVwcGVyLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChTVEVQUEVSX0dMT0JBTF9PUFRJT05TKSBzdGVwcGVyT3B0aW9ucz86IFN0ZXBwZXJPcHRpb25zKSB7XG4gICAgdGhpcy5fc3RlcHBlck9wdGlvbnMgPSBzdGVwcGVyT3B0aW9ucyA/IHN0ZXBwZXJPcHRpb25zIDoge307XG4gICAgdGhpcy5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID0gdGhpcy5fc3RlcHBlck9wdGlvbnMuZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlICE9PSBmYWxzZTtcbiAgICB0aGlzLl9zaG93RXJyb3IgPSAhIXRoaXMuX3N0ZXBwZXJPcHRpb25zLnNob3dFcnJvcjtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIHRoaXMgc3RlcCBjb21wb25lbnQuICovXG4gIHNlbGVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGVwcGVyLnNlbGVjdGVkID0gdGhpcztcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXAgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIHJlc2V0dGluZyBmb3JtIGRhdGEuICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuaW50ZXJhY3RlZCA9IGZhbHNlO1xuXG4gICAgaWYgKHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2N1c3RvbUVycm9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2N1c3RvbUVycm9yID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RlcENvbnRyb2wpIHtcbiAgICAgIHRoaXMuc3RlcENvbnRyb2wucmVzZXQoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcygpIHtcbiAgICAvLyBTaW5jZSBiYXNpY2FsbHkgYWxsIGlucHV0cyBvZiB0aGUgTWF0U3RlcCBnZXQgcHJveGllZCB0aHJvdWdoIHRoZSB2aWV3IGRvd24gdG8gdGhlXG4gICAgLy8gdW5kZXJseWluZyBNYXRTdGVwSGVhZGVyLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gcnVucyBjb3JyZWN0bHkuXG4gICAgdGhpcy5fc3RlcHBlci5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZWRpdGFibGU6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2hhc0Vycm9yOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9vcHRpb25hbDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfY29tcGxldGVkOiBCb29sZWFuSW5wdXQ7XG59XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtTdGVwcGVyXScsXG4gIGV4cG9ydEFzOiAnY2RrU3RlcHBlcicsXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXBwZXIgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJvdGVjdGVkIF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBVc2VkIGZvciBtYW5hZ2luZyBrZXlib2FyZCBmb2N1cy4gKi9cbiAgcHJpdmF0ZSBfa2V5TWFuYWdlcjogRm9jdXNLZXlNYW5hZ2VyPEZvY3VzYWJsZU9wdGlvbj47XG5cbiAgLyoqXG4gICAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgUmVtb3ZlIGB8IHVuZGVmaW5lZGAgb25jZSB0aGUgYF9kb2N1bWVudGBcbiAgICogY29uc3RydWN0b3IgcGFyYW0gaXMgcmVxdWlyZWQuXG4gICAqL1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnR8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBzdGVwIGNvbXBvbmVudHMgdGhhdCB0aGUgc3RlcHBlciBpcyBob2xkaW5nLlxuICAgKiBAZGVwcmVjYXRlZCB1c2UgYHN0ZXBzYCBpbnN0ZWFkXG4gICAqIEBicmVha2luZy1jaGFuZ2UgOS4wLjAgcmVtb3ZlIHRoaXMgcHJvcGVydHlcbiAgICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrU3RlcCwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX3N0ZXBzOiBRdWVyeUxpc3Q8Q2RrU3RlcD47XG5cbiAgLyoqIFRoZSBsaXN0IG9mIHN0ZXAgY29tcG9uZW50cyB0aGF0IHRoZSBzdGVwcGVyIGlzIGhvbGRpbmcuICovXG4gIGdldCBzdGVwcygpOiBRdWVyeUxpc3Q8Q2RrU3RlcD4ge1xuICAgIHJldHVybiB0aGlzLl9zdGVwcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBzdGVwIGhlYWRlcnMgb2YgdGhlIHN0ZXBzIGluIHRoZSBzdGVwcGVyLlxuICAgKiBAZGVwcmVjYXRlZCBUeXBlIHRvIGJlIGNoYW5nZWQgdG8gYFF1ZXJ5TGlzdDxDZGtTdGVwSGVhZGVyPmAuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjBcbiAgICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrU3RlcEhlYWRlciwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX3N0ZXBIZWFkZXI6IFF1ZXJ5TGlzdDxGb2N1c2FibGVPcHRpb24+O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB2YWxpZGl0eSBvZiBwcmV2aW91cyBzdGVwcyBzaG91bGQgYmUgY2hlY2tlZCBvciBub3QuICovXG4gIEBJbnB1dCgpXG4gIGdldCBsaW5lYXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpbmVhcjtcbiAgfVxuICBzZXQgbGluZWFyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fbGluZWFyID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9saW5lYXIgPSBmYWxzZTtcblxuICAvKiogVGhlIGluZGV4IG9mIHRoZSBzZWxlY3RlZCBzdGVwLiAqL1xuICBASW5wdXQoKVxuICBnZXQgc2VsZWN0ZWRJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgfVxuICBzZXQgc2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eShpbmRleCk7XG5cbiAgICBpZiAodGhpcy5zdGVwcykge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGluZGV4IGNhbid0IGJlIG91dCBvZiBib3VuZHMuXG4gICAgICBpZiAobmV3SW5kZXggPCAwIHx8IG5ld0luZGV4ID4gdGhpcy5zdGVwcy5sZW5ndGggLSAxKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdjZGtTdGVwcGVyOiBDYW5ub3QgYXNzaWduIG91dC1vZi1ib3VuZHMgdmFsdWUgdG8gYHNlbGVjdGVkSW5kZXhgLicpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCAhPSBuZXdJbmRleCAmJiAhdGhpcy5fYW55Q29udHJvbHNJbnZhbGlkT3JQZW5kaW5nKG5ld0luZGV4KSAmJlxuICAgICAgICAgIChuZXdJbmRleCA+PSB0aGlzLl9zZWxlY3RlZEluZGV4IHx8IHRoaXMuc3RlcHMudG9BcnJheSgpW25ld0luZGV4XS5lZGl0YWJsZSkpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRJdGVtSW5kZXgoaW5kZXgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gbmV3SW5kZXg7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX3NlbGVjdGVkSW5kZXggPSAwO1xuXG4gIC8qKiBUaGUgc3RlcCB0aGF0IGlzIHNlbGVjdGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgc2VsZWN0ZWQoKTogQ2RrU3RlcCB7XG4gICAgLy8gQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBDaGFuZ2UgcmV0dXJuIHR5cGUgdG8gYENka1N0ZXAgfCB1bmRlZmluZWRgLlxuICAgIHJldHVybiB0aGlzLnN0ZXBzID8gdGhpcy5zdGVwcy50b0FycmF5KClbdGhpcy5zZWxlY3RlZEluZGV4XSA6IHVuZGVmaW5lZCE7XG4gIH1cbiAgc2V0IHNlbGVjdGVkKHN0ZXA6IENka1N0ZXApIHtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSB0aGlzLnN0ZXBzID8gdGhpcy5zdGVwcy50b0FycmF5KCkuaW5kZXhPZihzdGVwKSA6IC0xO1xuICB9XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgc2VsZWN0ZWQgc3RlcCBoYXMgY2hhbmdlZC4gKi9cbiAgQE91dHB1dCgpXG4gIHNlbGVjdGlvbkNoYW5nZTogRXZlbnRFbWl0dGVyPFN0ZXBwZXJTZWxlY3Rpb25FdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPFN0ZXBwZXJTZWxlY3Rpb25FdmVudD4oKTtcblxuICAvKiogVXNlZCB0byB0cmFjayB1bmlxdWUgSUQgZm9yIGVhY2ggc3RlcHBlciBjb21wb25lbnQuICovXG4gIF9ncm91cElkOiBudW1iZXI7XG5cbiAgcHJvdGVjdGVkIF9vcmllbnRhdGlvbjogU3RlcHBlck9yaWVudGF0aW9uID0gJ2hvcml6b250YWwnO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBfZGlyOiBEaXJlY3Rpb25hbGl0eSwgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgICAgLy8gQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBgX2VsZW1lbnRSZWZgIGFuZCBgX2RvY3VtZW50YCBwYXJhbWV0ZXJzIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgIHByaXZhdGUgX2VsZW1lbnRSZWY/OiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50PzogYW55KSB7XG4gICAgdGhpcy5fZ3JvdXBJZCA9IG5leHRJZCsrO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIC8vIE5vdGUgdGhhdCB3aGlsZSB0aGUgc3RlcCBoZWFkZXJzIGFyZSBjb250ZW50IGNoaWxkcmVuIGJ5IGRlZmF1bHQsIGFueSBjb21wb25lbnRzIHRoYXRcbiAgICAvLyBleHRlbmQgdGhpcyBvbmUgbWlnaHQgaGF2ZSB0aGVtIGFzIHZpZXcgY2hpbGRyZW4uIFdlIGluaXRpYWxpemUgdGhlIGtleWJvYXJkIGhhbmRsaW5nIGluXG4gICAgLy8gQWZ0ZXJWaWV3SW5pdCBzbyB3ZSdyZSBndWFyYW50ZWVkIGZvciBib3RoIHZpZXcgYW5kIGNvbnRlbnQgY2hpbGRyZW4gdG8gYmUgZGVmaW5lZC5cbiAgICB0aGlzLl9rZXlNYW5hZ2VyID0gbmV3IEZvY3VzS2V5TWFuYWdlcjxGb2N1c2FibGVPcHRpb24+KHRoaXMuX3N0ZXBIZWFkZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAud2l0aFdyYXAoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpdGhWZXJ0aWNhbE9yaWVudGF0aW9uKHRoaXMuX29yaWVudGF0aW9uID09PSAndmVydGljYWwnKTtcblxuICAgICh0aGlzLl9kaXIgPyAodGhpcy5fZGlyLmNoYW5nZSBhcyBPYnNlcnZhYmxlPERpcmVjdGlvbj4pIDogb2JzZXJ2YWJsZU9mPERpcmVjdGlvbj4oKSlcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2xheW91dERpcmVjdGlvbigpKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUoZGlyZWN0aW9uID0+IHRoaXMuX2tleU1hbmFnZXIud2l0aEhvcml6b250YWxPcmllbnRhdGlvbihkaXJlY3Rpb24pKTtcblxuICAgIHRoaXMuX2tleU1hbmFnZXIudXBkYXRlQWN0aXZlSXRlbSh0aGlzLl9zZWxlY3RlZEluZGV4KTtcblxuICAgIHRoaXMuc3RlcHMuY2hhbmdlcy5waXBlKHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBNYXRoLm1heCh0aGlzLl9zZWxlY3RlZEluZGV4IC0gMSwgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgYW5kIGZvY3VzZXMgdGhlIG5leHQgc3RlcCBpbiBsaXN0LiAqL1xuICBuZXh0KCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWluKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxLCB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgYW5kIGZvY3VzZXMgdGhlIHByZXZpb3VzIHN0ZXAgaW4gbGlzdC4gKi9cbiAgcHJldmlvdXMoKTogdm9pZCB7XG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gTWF0aC5tYXgodGhpcy5fc2VsZWN0ZWRJbmRleCAtIDEsIDApO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3RlcHBlciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gTm90ZSB0aGF0IHRoaXMgaW5jbHVkZXMgY2xlYXJpbmcgZm9ybSBkYXRhLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleCgwKTtcbiAgICB0aGlzLnN0ZXBzLmZvckVhY2goc3RlcCA9PiBzdGVwLnJlc2V0KCkpO1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlZCgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSB1bmlxdWUgaWQgZm9yIGVhY2ggc3RlcCBsYWJlbCBlbGVtZW50LiAqL1xuICBfZ2V0U3RlcExhYmVsSWQoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGNkay1zdGVwLWxhYmVsLSR7dGhpcy5fZ3JvdXBJZH0tJHtpfWA7XG4gIH1cblxuICAvKiogUmV0dXJucyB1bmlxdWUgaWQgZm9yIGVhY2ggc3RlcCBjb250ZW50IGVsZW1lbnQuICovXG4gIF9nZXRTdGVwQ29udGVudElkKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBjZGstc3RlcC1jb250ZW50LSR7dGhpcy5fZ3JvdXBJZH0tJHtpfWA7XG4gIH1cblxuICAvKiogTWFya3MgdGhlIGNvbXBvbmVudCB0byBiZSBjaGFuZ2UgZGV0ZWN0ZWQuICovXG4gIF9zdGF0ZUNoYW5nZWQoKSB7XG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyBwb3NpdGlvbiBzdGF0ZSBvZiB0aGUgc3RlcCB3aXRoIHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgX2dldEFuaW1hdGlvbkRpcmVjdGlvbihpbmRleDogbnVtYmVyKTogU3RlcENvbnRlbnRQb3NpdGlvblN0YXRlIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IGluZGV4IC0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgICBpZiAocG9zaXRpb24gPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkgPT09ICdydGwnID8gJ25leHQnIDogJ3ByZXZpb3VzJztcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xheW91dERpcmVjdGlvbigpID09PSAncnRsJyA/ICdwcmV2aW91cycgOiAnbmV4dCc7XG4gICAgfVxuICAgIHJldHVybiAnY3VycmVudCc7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgdHlwZSBvZiBpY29uIHRvIGJlIGRpc3BsYXllZC4gKi9cbiAgX2dldEluZGljYXRvclR5cGUoaW5kZXg6IG51bWJlciwgc3RhdGU6IFN0ZXBTdGF0ZSA9IFNURVBfU1RBVEUuTlVNQkVSKTogU3RlcFN0YXRlIHtcbiAgICBjb25zdCBzdGVwID0gdGhpcy5zdGVwcy50b0FycmF5KClbaW5kZXhdO1xuICAgIGNvbnN0IGlzQ3VycmVudFN0ZXAgPSB0aGlzLl9pc0N1cnJlbnRTdGVwKGluZGV4KTtcblxuICAgIHJldHVybiBzdGVwLl9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGUgPyB0aGlzLl9nZXREZWZhdWx0SW5kaWNhdG9yTG9naWMoc3RlcCwgaXNDdXJyZW50U3RlcCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nZXRHdWlkZWxpbmVMb2dpYyhzdGVwLCBpc0N1cnJlbnRTdGVwLCBzdGF0ZSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXREZWZhdWx0SW5kaWNhdG9yTG9naWMoc3RlcDogQ2RrU3RlcCwgaXNDdXJyZW50U3RlcDogYm9vbGVhbik6IFN0ZXBTdGF0ZSB7XG4gICAgaWYgKHN0ZXAuX3Nob3dFcnJvciAmJiBzdGVwLmhhc0Vycm9yICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FUlJPUjtcbiAgICB9IGVsc2UgaWYgKCFzdGVwLmNvbXBsZXRlZCB8fCBpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5OVU1CRVI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdGVwLmVkaXRhYmxlID8gU1RFUF9TVEFURS5FRElUIDogU1RFUF9TVEFURS5ET05FO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldEd1aWRlbGluZUxvZ2ljKFxuICAgICAgc3RlcDogQ2RrU3RlcCwgaXNDdXJyZW50U3RlcDogYm9vbGVhbiwgc3RhdGU6IFN0ZXBTdGF0ZSA9IFNURVBfU1RBVEUuTlVNQkVSKTogU3RlcFN0YXRlIHtcbiAgICBpZiAoc3RlcC5fc2hvd0Vycm9yICYmIHN0ZXAuaGFzRXJyb3IgJiYgIWlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLkVSUk9SO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5jb21wbGV0ZWQgJiYgIWlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLkRPTkU7XG4gICAgfSBlbHNlIGlmIChzdGVwLmNvbXBsZXRlZCAmJiBpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSBlbHNlIGlmIChzdGVwLmVkaXRhYmxlICYmIGlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLkVESVQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9pc0N1cnJlbnRTdGVwKGluZGV4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleCA9PT0gaW5kZXg7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnRseS1mb2N1c2VkIHN0ZXAgaGVhZGVyLiAqL1xuICBfZ2V0Rm9jdXNJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5TWFuYWdlciA/IHRoaXMuX2tleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4IDogdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZVNlbGVjdGVkSXRlbUluZGV4KG5ld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBzdGVwc0FycmF5ID0gdGhpcy5zdGVwcy50b0FycmF5KCk7XG4gICAgdGhpcy5zZWxlY3Rpb25DaGFuZ2UuZW1pdCh7XG4gICAgICBzZWxlY3RlZEluZGV4OiBuZXdJbmRleCxcbiAgICAgIHByZXZpb3VzbHlTZWxlY3RlZEluZGV4OiB0aGlzLl9zZWxlY3RlZEluZGV4LFxuICAgICAgc2VsZWN0ZWRTdGVwOiBzdGVwc0FycmF5W25ld0luZGV4XSxcbiAgICAgIHByZXZpb3VzbHlTZWxlY3RlZFN0ZXA6IHN0ZXBzQXJyYXlbdGhpcy5fc2VsZWN0ZWRJbmRleF0sXG4gICAgfSk7XG5cbiAgICAvLyBJZiBmb2N1cyBpcyBpbnNpZGUgdGhlIHN0ZXBwZXIsIG1vdmUgaXQgdG8gdGhlIG5leHQgaGVhZGVyLCBvdGhlcndpc2UgaXQgbWF5IGJlY29tZVxuICAgIC8vIGxvc3Qgd2hlbiB0aGUgYWN0aXZlIHN0ZXAgY29udGVudCBpcyBoaWRkZW4uIFdlIGNhbid0IGJlIG1vcmUgZ3JhbnVsYXIgd2l0aCB0aGUgY2hlY2tcbiAgICAvLyAoZS5nLiBjaGVja2luZyB3aGV0aGVyIGZvY3VzIGlzIGluc2lkZSB0aGUgYWN0aXZlIHN0ZXApLCBiZWNhdXNlIHdlIGRvbid0IGhhdmUgYVxuICAgIC8vIHJlZmVyZW5jZSB0byB0aGUgZWxlbWVudHMgdGhhdCBhcmUgcmVuZGVyaW5nIG91dCB0aGUgY29udGVudC5cbiAgICB0aGlzLl9jb250YWluc0ZvY3VzKCkgPyB0aGlzLl9rZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0obmV3SW5kZXgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlNYW5hZ2VyLnVwZGF0ZUFjdGl2ZUl0ZW0obmV3SW5kZXgpO1xuXG4gICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG5ld0luZGV4O1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlZCgpO1xuICB9XG5cbiAgX29uS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGNvbnN0IGhhc01vZGlmaWVyID0gaGFzTW9kaWZpZXJLZXkoZXZlbnQpO1xuICAgIGNvbnN0IGtleUNvZGUgPSBldmVudC5rZXlDb2RlO1xuICAgIGNvbnN0IG1hbmFnZXIgPSB0aGlzLl9rZXlNYW5hZ2VyO1xuXG4gICAgaWYgKG1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ICE9IG51bGwgJiYgIWhhc01vZGlmaWVyICYmXG4gICAgICAgIChrZXlDb2RlID09PSBTUEFDRSB8fCBrZXlDb2RlID09PSBFTlRFUikpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IG1hbmFnZXIuYWN0aXZlSXRlbUluZGV4O1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IEhPTUUpIHtcbiAgICAgIG1hbmFnZXIuc2V0Rmlyc3RJdGVtQWN0aXZlKCk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gRU5EKSB7XG4gICAgICBtYW5hZ2VyLnNldExhc3RJdGVtQWN0aXZlKCk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYW5hZ2VyLm9uS2V5ZG93bihldmVudCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYW55Q29udHJvbHNJbnZhbGlkT3JQZW5kaW5nKGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBzdGVwcyA9IHRoaXMuc3RlcHMudG9BcnJheSgpO1xuXG4gICAgc3RlcHNbdGhpcy5fc2VsZWN0ZWRJbmRleF0uaW50ZXJhY3RlZCA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5fbGluZWFyICYmIGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiBzdGVwcy5zbGljZSgwLCBpbmRleCkuc29tZShzdGVwID0+IHtcbiAgICAgICAgY29uc3QgY29udHJvbCA9IHN0ZXAuc3RlcENvbnRyb2w7XG4gICAgICAgIGNvbnN0IGlzSW5jb21wbGV0ZSA9XG4gICAgICAgICAgICBjb250cm9sID8gKGNvbnRyb2wuaW52YWxpZCB8fCBjb250cm9sLnBlbmRpbmcgfHwgIXN0ZXAuaW50ZXJhY3RlZCkgOiAhc3RlcC5jb21wbGV0ZWQ7XG4gICAgICAgIHJldHVybiBpc0luY29tcGxldGUgJiYgIXN0ZXAub3B0aW9uYWwgJiYgIXN0ZXAuX2NvbXBsZXRlZE92ZXJyaWRlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBfbGF5b3V0RGlyZWN0aW9uKCk6IERpcmVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX2RpciAmJiB0aGlzLl9kaXIudmFsdWUgPT09ICdydGwnID8gJ3J0bCcgOiAnbHRyJztcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgc3RlcHBlciBjb250YWlucyB0aGUgZm9jdXNlZCBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jb250YWluc0ZvY3VzKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fZG9jdW1lbnQgfHwgIXRoaXMuX2VsZW1lbnRSZWYpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGVwcGVyRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgcmV0dXJuIHN0ZXBwZXJFbGVtZW50ID09PSBmb2N1c2VkRWxlbWVudCB8fCBzdGVwcGVyRWxlbWVudC5jb250YWlucyhmb2N1c2VkRWxlbWVudCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZWRpdGFibGU6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX29wdGlvbmFsOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9jb21wbGV0ZWQ6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2hhc0Vycm9yOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9saW5lYXI6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3NlbGVjdGVkSW5kZXg6IE51bWJlcklucHV0O1xufVxuXG5cbi8qKlxuICogU2ltcGxpZmllZCByZXByZXNlbnRhdGlvbiBvZiBhbiBcIkFic3RyYWN0Q29udHJvbFwiIGZyb20gQGFuZ3VsYXIvZm9ybXMuXG4gKiBVc2VkIHRvIGF2b2lkIGhhdmluZyB0byBicmluZyBpbiBAYW5ndWxhci9mb3JtcyBmb3IgYSBzaW5nbGUgb3B0aW9uYWwgaW50ZXJmYWNlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbnRlcmZhY2UgQWJzdHJhY3RDb250cm9sTGlrZSB7XG4gIGFzeW5jVmFsaWRhdG9yOiAoKGNvbnRyb2w6IGFueSkgPT4gYW55KSB8IG51bGw7XG4gIGRpcnR5OiBib29sZWFuO1xuICBkaXNhYmxlZDogYm9vbGVhbjtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZXJyb3JzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGw7XG4gIGludmFsaWQ6IGJvb2xlYW47XG4gIHBhcmVudDogYW55O1xuICBwZW5kaW5nOiBib29sZWFuO1xuICBwcmlzdGluZTogYm9vbGVhbjtcbiAgcm9vdDogQWJzdHJhY3RDb250cm9sTGlrZTtcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIHN0YXR1c0NoYW5nZXM6IE9ic2VydmFibGU8YW55PjtcbiAgdG91Y2hlZDogYm9vbGVhbjtcbiAgdW50b3VjaGVkOiBib29sZWFuO1xuICB1cGRhdGVPbjogYW55O1xuICB2YWxpZDogYm9vbGVhbjtcbiAgdmFsaWRhdG9yOiAoKGNvbnRyb2w6IGFueSkgPT4gYW55KSB8IG51bGw7XG4gIHZhbHVlOiBhbnk7XG4gIHZhbHVlQ2hhbmdlczogT2JzZXJ2YWJsZTxhbnk+O1xuICBjbGVhckFzeW5jVmFsaWRhdG9ycygpOiB2b2lkO1xuICBjbGVhclZhbGlkYXRvcnMoKTogdm9pZDtcbiAgZGlzYWJsZShvcHRzPzogYW55KTogdm9pZDtcbiAgZW5hYmxlKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBnZXQocGF0aDogKHN0cmluZyB8IG51bWJlcilbXSB8IHN0cmluZyk6IEFic3RyYWN0Q29udHJvbExpa2UgfCBudWxsO1xuICBnZXRFcnJvcihlcnJvckNvZGU6IHN0cmluZywgcGF0aD86IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBhbnk7XG4gIGhhc0Vycm9yKGVycm9yQ29kZTogc3RyaW5nLCBwYXRoPzogKHN0cmluZyB8IG51bWJlcilbXSB8IHN0cmluZyk6IGJvb2xlYW47XG4gIG1hcmtBbGxBc1RvdWNoZWQoKTogdm9pZDtcbiAgbWFya0FzRGlydHkob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1BlbmRpbmcob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1ByaXN0aW5lKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNUb3VjaGVkKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNVbnRvdWNoZWQob3B0cz86IGFueSk6IHZvaWQ7XG4gIHBhdGNoVmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG4gIHJlc2V0KHZhbHVlPzogYW55LCBvcHRpb25zPzogT2JqZWN0KTogdm9pZDtcbiAgc2V0QXN5bmNWYWxpZGF0b3JzKG5ld1ZhbGlkYXRvcjogKGNvbnRyb2w6IGFueSkgPT4gYW55IHxcbiAgICAoKGNvbnRyb2w6IGFueSkgPT4gYW55KVtdIHwgbnVsbCk6IHZvaWQ7XG4gIHNldEVycm9ycyhlcnJvcnM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCwgb3B0cz86IGFueSk6IHZvaWQ7XG4gIHNldFBhcmVudChwYXJlbnQ6IGFueSk6IHZvaWQ7XG4gIHNldFZhbGlkYXRvcnMobmV3VmFsaWRhdG9yOiAoY29udHJvbDogYW55KSA9PiBhbnkgfFxuICAgICgoY29udHJvbDogYW55KSA9PiBhbnkpW10gfCBudWxsKTogdm9pZDtcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG4gIHVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0cz86IGFueSk6IHZvaWQ7XG4gIHBhdGNoVmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IGFueSk6IHZvaWQ7XG4gIHJlc2V0KGZvcm1TdGF0ZT86IGFueSwgb3B0aW9ucz86IGFueSk6IHZvaWQ7XG4gIHNldFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xufVxuIl19