/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { of as obaservableOf, Subject } from 'rxjs';
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
export class CdkStep {
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
                moduleId: module.id,
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
    stepLabel: [{ type: ContentChild, args: [CdkStepLabel, { static: false },] }],
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
if (false) {
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
export class CdkStepper {
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
        // extend this one might have them as view chidren. We initialize the keyboard handling in
        // AfterViewInit so we're guaranteed for both view and content children to be defined.
        this._keyManager = new FocusKeyManager(this._stepHeader)
            .withWrap()
            .withVerticalOrientation(this._orientation === 'vertical');
        (this._dir ? ((/** @type {?} */ (this._dir.change))) : obaservableOf())
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
    _steps: [{ type: ContentChildren, args: [CdkStep,] }],
    _stepHeader: [{ type: ContentChildren, args: [CdkStepHeader,] }],
    linear: [{ type: Input }],
    selectedIndex: [{ type: Input }],
    selected: [{ type: Input }],
    selectionChange: [{ type: Output }]
};
if (false) {
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
 * Simplified representation of a FormControl from \@angular/forms.
 * Used to avoid having to bring in \@angular/forms for a single optional interface.
 * \@docs-private
 * @record
 */
function FormControlLike() { }
if (false) {
    /** @type {?} */
    FormControlLike.prototype.asyncValidator;
    /** @type {?} */
    FormControlLike.prototype.dirty;
    /** @type {?} */
    FormControlLike.prototype.disabled;
    /** @type {?} */
    FormControlLike.prototype.enabled;
    /** @type {?} */
    FormControlLike.prototype.errors;
    /** @type {?} */
    FormControlLike.prototype.invalid;
    /** @type {?} */
    FormControlLike.prototype.parent;
    /** @type {?} */
    FormControlLike.prototype.pending;
    /** @type {?} */
    FormControlLike.prototype.pristine;
    /** @type {?} */
    FormControlLike.prototype.root;
    /** @type {?} */
    FormControlLike.prototype.status;
    /** @type {?} */
    FormControlLike.prototype.statusChanges;
    /** @type {?} */
    FormControlLike.prototype.touched;
    /** @type {?} */
    FormControlLike.prototype.untouched;
    /** @type {?} */
    FormControlLike.prototype.updateOn;
    /** @type {?} */
    FormControlLike.prototype.valid;
    /** @type {?} */
    FormControlLike.prototype.validator;
    /** @type {?} */
    FormControlLike.prototype.value;
    /** @type {?} */
    FormControlLike.prototype.valueChanges;
    /**
     * @return {?}
     */
    FormControlLike.prototype.clearAsyncValidators = function () { };
    /**
     * @return {?}
     */
    FormControlLike.prototype.clearValidators = function () { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.disable = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.enable = function (opts) { };
    /**
     * @param {?} path
     * @return {?}
     */
    FormControlLike.prototype.get = function (path) { };
    /**
     * @param {?} errorCode
     * @param {?=} path
     * @return {?}
     */
    FormControlLike.prototype.getError = function (errorCode, path) { };
    /**
     * @param {?} errorCode
     * @param {?=} path
     * @return {?}
     */
    FormControlLike.prototype.hasError = function (errorCode, path) { };
    /**
     * @return {?}
     */
    FormControlLike.prototype.markAllAsTouched = function () { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.markAsDirty = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.markAsPending = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.markAsPristine = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.markAsTouched = function (opts) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.markAsUntouched = function (opts) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    FormControlLike.prototype.patchValue = function (value, options) { };
    /**
     * @param {?=} value
     * @param {?=} options
     * @return {?}
     */
    FormControlLike.prototype.reset = function (value, options) { };
    /**
     * @param {?} newValidator
     * @return {?}
     */
    FormControlLike.prototype.setAsyncValidators = function (newValidator) { };
    /**
     * @param {?} errors
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.setErrors = function (errors, opts) { };
    /**
     * @param {?} parent
     * @return {?}
     */
    FormControlLike.prototype.setParent = function (parent) { };
    /**
     * @param {?} newValidator
     * @return {?}
     */
    FormControlLike.prototype.setValidators = function (newValidator) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    FormControlLike.prototype.setValue = function (value, options) { };
    /**
     * @param {?=} opts
     * @return {?}
     */
    FormControlLike.prototype.updateValueAndValidity = function (opts) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    FormControlLike.prototype.patchValue = function (value, options) { };
    /**
     * @param {?} fn
     * @return {?}
     */
    FormControlLike.prototype.registerOnChange = function (fn) { };
    /**
     * @param {?} fn
     * @return {?}
     */
    FormControlLike.prototype.registerOnDisabledChange = function (fn) { };
    /**
     * @param {?=} formState
     * @param {?=} options
     * @return {?}
     */
    FormControlLike.prototype.reset = function (formState, options) { };
    /**
     * @param {?} value
     * @param {?=} options
     * @return {?}
     */
    FormControlLike.prototype.setValue = function (value, options) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFrQixlQUFlLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRSxPQUFPLEVBQVksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEYsT0FBTyxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFlBQVksRUFDWixlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFdBQVcsRUFDWCxTQUFTLEVBQ1QsaUJBQWlCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBYSxFQUFFLElBQUksYUFBYSxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM5RCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7SUFHdEMsTUFBTSxHQUFHLENBQUM7Ozs7QUFZZCxNQUFNLE9BQU8scUJBQXFCO0NBWWpDOzs7Ozs7SUFWQyw4Q0FBc0I7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Ozs7OztJQUN4Qix3REFBMEI7Ozs7O0lBQzFCLHVEQUF5Qjs7Ozs7SUFDekIsb0RBQWdFOzs7Ozs7SUFDaEUsb0VBQXNFOzs7Ozs7SUFDdEUsb0VBQTBFOzs7O0lBQzFFLDZEQUF5Qjs7Ozs7SUFDekIsNERBQThCOzs7OztJQUM5Qiw4REFBZ0M7Ozs7O0lBQ2hDLCtEQUFpQzs7Ozs7SUFDakMsOERBQWdDOzs7OztJQUNoQyxnRUFBa0M7Ozs7OztJQUNsQyxxRUFBK0M7Ozs7OztJQUMvQyxnRUFBMkM7Ozs7O0lBQzNDLDJFQUF5RTs7Ozs7O0lBQ3pFLGtFQUFpRTs7Ozs7SUFDakUsNERBQTZCOzs7OztJQUM3QixzRUFBb0U7Ozs7OztJQUNwRSxtRUFBNkM7Ozs7O0lBQzdDLHVFQUF5Qzs7Ozs7O0lBQ3pDLHFFQUE0Qzs7Ozs7SUFDNUMsK0RBQXFDOzs7OztJQUNyQyx1RUFBa0U7Ozs7OztJQUNsRSxvRUFBNEM7Ozs7OztJQUM1QyxtRUFBMEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtGb2N1c2FibGVPcHRpb24sIEZvY3VzS2V5TWFuYWdlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2ExMXknO1xuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge2NvZXJjZUJvb2xlYW5Qcm9wZXJ0eSwgY29lcmNlTnVtYmVyUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0VORCwgRU5URVIsIGhhc01vZGlmaWVyS2V5LCBIT01FLCBTUEFDRX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgQ29udGVudENoaWxkLFxuICBDb250ZW50Q2hpbGRyZW4sXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBmb3J3YXJkUmVmLFxuICBJbmplY3QsXG4gIEluamVjdGlvblRva2VuLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBPdXRwdXQsXG4gIFF1ZXJ5TGlzdCxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiBhcyBvYmFzZXJ2YWJsZU9mLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtDZGtTdGVwSGVhZGVyfSBmcm9tICcuL3N0ZXAtaGVhZGVyJztcbmltcG9ydCB7Q2RrU3RlcExhYmVsfSBmcm9tICcuL3N0ZXAtbGFiZWwnO1xuXG4vKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSUQgZm9yIGVhY2ggc3RlcHBlciBjb21wb25lbnQuICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBQb3NpdGlvbiBzdGF0ZSBvZiB0aGUgY29udGVudCBvZiBlYWNoIHN0ZXAgaW4gc3RlcHBlciB0aGF0IGlzIHVzZWQgZm9yIHRyYW5zaXRpb25pbmdcbiAqIHRoZSBjb250ZW50IGludG8gY29ycmVjdCBwb3NpdGlvbiB1cG9uIHN0ZXAgc2VsZWN0aW9uIGNoYW5nZS5cbiAqL1xuZXhwb3J0IHR5cGUgU3RlcENvbnRlbnRQb3NpdGlvblN0YXRlID0gJ3ByZXZpb3VzJ3wnY3VycmVudCd8J25leHQnO1xuXG4vKiogUG9zc2libGUgb3JpZW50YXRpb24gb2YgYSBzdGVwcGVyLiAqL1xuZXhwb3J0IHR5cGUgU3RlcHBlck9yaWVudGF0aW9uID0gJ2hvcml6b250YWwnfCd2ZXJ0aWNhbCc7XG5cbi8qKiBDaGFuZ2UgZXZlbnQgZW1pdHRlZCBvbiBzZWxlY3Rpb24gY2hhbmdlcy4gKi9cbmV4cG9ydCBjbGFzcyBTdGVwcGVyU2VsZWN0aW9uRXZlbnQge1xuICAvKiogSW5kZXggb2YgdGhlIHN0ZXAgbm93IHNlbGVjdGVkLiAqL1xuICBzZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIHByZXZpb3VzbHkgc2VsZWN0ZWQuICovXG4gIHByZXZpb3VzbHlTZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBzdGVwIGluc3RhbmNlIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRTdGVwOiBDZGtTdGVwO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBDZGtTdGVwO1xufVxuXG4vKiogVGhlIHN0YXRlIG9mIGVhY2ggc3RlcC4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBTdGF0ZSA9ICdudW1iZXInfCdlZGl0J3wnZG9uZSd8J2Vycm9yJ3xzdHJpbmc7XG5cbi8qKiBFbnVtIHRvIHJlcHJlc2VudCB0aGUgZGlmZmVyZW50IHN0YXRlcyBvZiB0aGUgc3RlcHMuICovXG5leHBvcnQgY29uc3QgU1RFUF9TVEFURSA9IHtcbiAgTlVNQkVSOiAnbnVtYmVyJyxcbiAgRURJVDogJ2VkaXQnLFxuICBET05FOiAnZG9uZScsXG4gIEVSUk9SOiAnZXJyb3InXG59O1xuXG4vKiogSW5qZWN0aW9uVG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5IHRoZSBnbG9iYWwgc3RlcHBlciBvcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBQRVJfR0xPQkFMX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48U3RlcHBlck9wdGlvbnM+KCdTVEVQUEVSX0dMT0JBTF9PUFRJT05TJyk7XG5cbi8qKlxuICogSW5qZWN0aW9uVG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5IHRoZSBnbG9iYWwgc3RlcHBlciBvcHRpb25zLlxuICogQGRlcHJlY2F0ZWQgVXNlIGBTVEVQUEVSX0dMT0JBTF9PUFRJT05TYCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMC5cbiAqL1xuZXhwb3J0IGNvbnN0IE1BVF9TVEVQUEVSX0dMT0JBTF9PUFRJT05TID0gU1RFUFBFUl9HTE9CQUxfT1BUSU9OUztcblxuLyoqIENvbmZpZ3VyYWJsZSBvcHRpb25zIGZvciBzdGVwcGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdGVwcGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBzdGVwcGVyIHNob3VsZCBkaXNwbGF5IGFuIGVycm9yIHN0YXRlIG9yIG5vdC5cbiAgICogRGVmYXVsdCBiZWhhdmlvciBpcyBhc3N1bWVkIHRvIGJlIGZhbHNlLlxuICAgKi9cbiAgc2hvd0Vycm9yPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RlcHBlciBzaG91bGQgZGlzcGxheSB0aGUgZGVmYXVsdCBpbmRpY2F0b3IgdHlwZVxuICAgKiBvciBub3QuXG4gICAqIERlZmF1bHQgYmVoYXZpb3IgaXMgYXNzdW1lZCB0byBiZSB0cnVlLlxuICAgKi9cbiAgZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlPzogYm9vbGVhbjtcbn1cblxuQENvbXBvbmVudCh7XG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXG4gIHNlbGVjdG9yOiAnY2RrLXN0ZXAnLFxuICBleHBvcnRBczogJ2Nka1N0ZXAnLFxuICB0ZW1wbGF0ZTogJzxuZy10ZW1wbGF0ZT48bmctY29udGVudD48L25nLWNvbnRlbnQ+PC9uZy10ZW1wbGF0ZT4nLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcCBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIHByaXZhdGUgX3N0ZXBwZXJPcHRpb25zOiBTdGVwcGVyT3B0aW9ucztcbiAgX3Nob3dFcnJvcjogYm9vbGVhbjtcbiAgX2Rpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZTogYm9vbGVhbjtcblxuICAvKiogVGVtcGxhdGUgZm9yIHN0ZXAgbGFiZWwgaWYgaXQgZXhpc3RzLiAqL1xuICBAQ29udGVudENoaWxkKENka1N0ZXBMYWJlbCwge3N0YXRpYzogZmFsc2V9KSBzdGVwTGFiZWw6IENka1N0ZXBMYWJlbDtcblxuICAvKiogVGVtcGxhdGUgZm9yIHN0ZXAgY29udGVudC4gKi9cbiAgQFZpZXdDaGlsZChUZW1wbGF0ZVJlZiwge3N0YXRpYzogdHJ1ZX0pIGNvbnRlbnQ6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgLyoqIFRoZSB0b3AgbGV2ZWwgYWJzdHJhY3QgY29udHJvbCBvZiB0aGUgc3RlcC4gKi9cbiAgQElucHV0KCkgc3RlcENvbnRyb2w6IEZvcm1Db250cm9sTGlrZTtcblxuICAvKiogV2hldGhlciB1c2VyIGhhcyBzZWVuIHRoZSBleHBhbmRlZCBzdGVwIGNvbnRlbnQgb3Igbm90LiAqL1xuICBpbnRlcmFjdGVkID0gZmFsc2U7XG5cbiAgLyoqIFBsYWluIHRleHQgbGFiZWwgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIGxhYmVsOiBzdHJpbmc7XG5cbiAgLyoqIEVycm9yIG1lc3NhZ2UgdG8gZGlzcGxheSB3aGVuIHRoZXJlJ3MgYW4gZXJyb3IuICovXG4gIEBJbnB1dCgpIGVycm9yTWVzc2FnZTogc3RyaW5nO1xuXG4gIC8qKiBBcmlhIGxhYmVsIGZvciB0aGUgdGFiLiAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWwnKSBhcmlhTGFiZWw6IHN0cmluZztcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHRoYXQgdGhlIHRhYiBpcyBsYWJlbGxlZCBieS5cbiAgICogV2lsbCBiZSBjbGVhcmVkIGlmIGBhcmlhLWxhYmVsYCBpcyBzZXQgYXQgdGhlIHNhbWUgdGltZS5cbiAgICovXG4gIEBJbnB1dCgnYXJpYS1sYWJlbGxlZGJ5JykgYXJpYUxhYmVsbGVkYnk6IHN0cmluZztcblxuICAvKiogU3RhdGUgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIHN0YXRlOiBTdGVwU3RhdGU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgY2FuIHJldHVybiB0byB0aGlzIHN0ZXAgb25jZSBpdCBoYXMgYmVlbiBtYXJrZWQgYXMgY29tcGxldGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZWRpdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2VkaXRhYmxlO1xuICB9XG4gIHNldCBlZGl0YWJsZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2VkaXRhYmxlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9lZGl0YWJsZSA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNvbXBsZXRpb24gb2Ygc3RlcCBpcyBvcHRpb25hbC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9wdGlvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25hbDtcbiAgfVxuICBzZXQgb3B0aW9uYWwodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9vcHRpb25hbCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfb3B0aW9uYWwgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzdGVwIGlzIG1hcmtlZCBhcyBjb21wbGV0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjb21wbGV0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID09IG51bGwgPyB0aGlzLl9nZXREZWZhdWx0Q29tcGxldGVkKCkgOiB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZTtcbiAgfVxuICBzZXQgY29tcGxldGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIF9jb21wbGV0ZWRPdmVycmlkZTogYm9vbGVhbnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9nZXREZWZhdWx0Q29tcGxldGVkKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sID8gdGhpcy5zdGVwQ29udHJvbC52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQgOiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogV2hldGhlciBzdGVwIGhhcyBhbiBlcnJvci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGhhc0Vycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jdXN0b21FcnJvciA9PSBudWxsID8gdGhpcy5fZ2V0RGVmYXVsdEVycm9yKCkgOiB0aGlzLl9jdXN0b21FcnJvcjtcbiAgfVxuICBzZXQgaGFzRXJyb3IodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jdXN0b21FcnJvciA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfY3VzdG9tRXJyb3I6IGJvb2xlYW58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEVycm9yKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sICYmIHRoaXMuc3RlcENvbnRyb2wuaW52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCByZW1vdmUgdGhlIGA/YCBhZnRlciBgc3RlcHBlck9wdGlvbnNgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQEluamVjdChmb3J3YXJkUmVmKCgpID0+IENka1N0ZXBwZXIpKSBwcml2YXRlIF9zdGVwcGVyOiBDZGtTdGVwcGVyLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChTVEVQUEVSX0dMT0JBTF9PUFRJT05TKSBzdGVwcGVyT3B0aW9ucz86IFN0ZXBwZXJPcHRpb25zKSB7XG4gICAgdGhpcy5fc3RlcHBlck9wdGlvbnMgPSBzdGVwcGVyT3B0aW9ucyA/IHN0ZXBwZXJPcHRpb25zIDoge307XG4gICAgdGhpcy5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID0gdGhpcy5fc3RlcHBlck9wdGlvbnMuZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlICE9PSBmYWxzZTtcbiAgICB0aGlzLl9zaG93RXJyb3IgPSAhIXRoaXMuX3N0ZXBwZXJPcHRpb25zLnNob3dFcnJvcjtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIHRoaXMgc3RlcCBjb21wb25lbnQuICovXG4gIHNlbGVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGVwcGVyLnNlbGVjdGVkID0gdGhpcztcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXAgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIHJlc2V0dGluZyBmb3JtIGRhdGEuICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuaW50ZXJhY3RlZCA9IGZhbHNlO1xuXG4gICAgaWYgKHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2N1c3RvbUVycm9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2N1c3RvbUVycm9yID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RlcENvbnRyb2wpIHtcbiAgICAgIHRoaXMuc3RlcENvbnRyb2wucmVzZXQoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcygpIHtcbiAgICAvLyBTaW5jZSBiYXNpY2FsbHkgYWxsIGlucHV0cyBvZiB0aGUgTWF0U3RlcCBnZXQgcHJveGllZCB0aHJvdWdoIHRoZSB2aWV3IGRvd24gdG8gdGhlXG4gICAgLy8gdW5kZXJseWluZyBNYXRTdGVwSGVhZGVyLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gcnVucyBjb3JyZWN0bHkuXG4gICAgdGhpcy5fc3RlcHBlci5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cbn1cblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1N0ZXBwZXJdJyxcbiAgZXhwb3J0QXM6ICdjZGtTdGVwcGVyJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcHBlciBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFVzZWQgZm9yIG1hbmFnaW5nIGtleWJvYXJkIGZvY3VzLiAqL1xuICBwcml2YXRlIF9rZXlNYW5hZ2VyOiBGb2N1c0tleU1hbmFnZXI8Rm9jdXNhYmxlT3B0aW9uPjtcblxuICAvKipcbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBSZW1vdmUgYHwgdW5kZWZpbmVkYCBvbmNlIHRoZSBgX2RvY3VtZW50YFxuICAgKiBjb25zdHJ1Y3RvciBwYXJhbSBpcyByZXF1aXJlZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN0ZXAgY29tcG9uZW50cyB0aGF0IHRoZSBzdGVwcGVyIGlzIGhvbGRpbmcuXG4gICAqIEBkZXByZWNhdGVkIHVzZSBgc3RlcHNgIGluc3RlYWRcbiAgICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMCByZW1vdmUgdGhpcyBwcm9wZXJ0eVxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtTdGVwKSBfc3RlcHM6IFF1ZXJ5TGlzdDxDZGtTdGVwPjtcblxuICAvKiogVGhlIGxpc3Qgb2Ygc3RlcCBjb21wb25lbnRzIHRoYXQgdGhlIHN0ZXBwZXIgaXMgaG9sZGluZy4gKi9cbiAgZ2V0IHN0ZXBzKCk6IFF1ZXJ5TGlzdDxDZGtTdGVwPiB7XG4gICAgcmV0dXJuIHRoaXMuX3N0ZXBzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN0ZXAgaGVhZGVycyBvZiB0aGUgc3RlcHMgaW4gdGhlIHN0ZXBwZXIuXG4gICAqIEBkZXByZWNhdGVkIFR5cGUgdG8gYmUgY2hhbmdlZCB0byBgUXVlcnlMaXN0PENka1N0ZXBIZWFkZXI+YC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMFxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtTdGVwSGVhZGVyKSBfc3RlcEhlYWRlcjogUXVlcnlMaXN0PEZvY3VzYWJsZU9wdGlvbj47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHZhbGlkaXR5IG9mIHByZXZpb3VzIHN0ZXBzIHNob3VsZCBiZSBjaGVja2VkIG9yIG5vdC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGxpbmVhcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbGluZWFyO1xuICB9XG4gIHNldCBsaW5lYXIodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9saW5lYXIgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2xpbmVhciA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIHNlbGVjdGVkIHN0ZXAuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZEluZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICB9XG4gIHNldCBzZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IGNvZXJjZU51bWJlclByb3BlcnR5KGluZGV4KTtcblxuICAgIGlmICh0aGlzLnN0ZXBzKSB7XG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgaW5kZXggY2FuJ3QgYmUgb3V0IG9mIGJvdW5kcy5cbiAgICAgIGlmIChuZXdJbmRleCA8IDAgfHwgbmV3SW5kZXggPiB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2Nka1N0ZXBwZXI6IENhbm5vdCBhc3NpZ24gb3V0LW9mLWJvdW5kcyB2YWx1ZSB0byBgc2VsZWN0ZWRJbmRleGAuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ICE9IG5ld0luZGV4ICYmICF0aGlzLl9hbnlDb250cm9sc0ludmFsaWRPclBlbmRpbmcobmV3SW5kZXgpICYmXG4gICAgICAgICAgKG5ld0luZGV4ID49IHRoaXMuX3NlbGVjdGVkSW5kZXggfHwgdGhpcy5zdGVwcy50b0FycmF5KClbbmV3SW5kZXhdLmVkaXRhYmxlKSkge1xuICAgICAgICB0aGlzLl91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChpbmRleCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleCA9IDA7XG5cbiAgLyoqIFRoZSBzdGVwIHRoYXQgaXMgc2VsZWN0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZCgpOiBDZGtTdGVwIHtcbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIENoYW5nZSByZXR1cm4gdHlwZSB0byBgQ2RrU3RlcCB8IHVuZGVmaW5lZGAuXG4gICAgcmV0dXJuIHRoaXMuc3RlcHMgPyB0aGlzLnN0ZXBzLnRvQXJyYXkoKVt0aGlzLnNlbGVjdGVkSW5kZXhdIDogdW5kZWZpbmVkITtcbiAgfVxuICBzZXQgc2VsZWN0ZWQoc3RlcDogQ2RrU3RlcCkge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuc3RlcHMgPyB0aGlzLnN0ZXBzLnRvQXJyYXkoKS5pbmRleE9mKHN0ZXApIDogLTE7XG4gIH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBzZWxlY3RlZCBzdGVwIGhhcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KClcbiAgc2VsZWN0aW9uQ2hhbmdlOiBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PigpO1xuXG4gIC8qKiBVc2VkIHRvIHRyYWNrIHVuaXF1ZSBJRCBmb3IgZWFjaCBzdGVwcGVyIGNvbXBvbmVudC4gKi9cbiAgX2dyb3VwSWQ6IG51bWJlcjtcblxuICBwcm90ZWN0ZWQgX29yaWVudGF0aW9uOiBTdGVwcGVyT3JpZW50YXRpb24gPSAnaG9yaXpvbnRhbCc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIGBfZWxlbWVudFJlZmAgYW5kIGBfZG9jdW1lbnRgIHBhcmFtZXRlcnMgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgICAgcHJpdmF0ZSBfZWxlbWVudFJlZj86IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICB0aGlzLl9ncm91cElkID0gbmV4dElkKys7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gTm90ZSB0aGF0IHdoaWxlIHRoZSBzdGVwIGhlYWRlcnMgYXJlIGNvbnRlbnQgY2hpbGRyZW4gYnkgZGVmYXVsdCwgYW55IGNvbXBvbmVudHMgdGhhdFxuICAgIC8vIGV4dGVuZCB0aGlzIG9uZSBtaWdodCBoYXZlIHRoZW0gYXMgdmlldyBjaGlkcmVuLiBXZSBpbml0aWFsaXplIHRoZSBrZXlib2FyZCBoYW5kbGluZyBpblxuICAgIC8vIEFmdGVyVmlld0luaXQgc28gd2UncmUgZ3VhcmFudGVlZCBmb3IgYm90aCB2aWV3IGFuZCBjb250ZW50IGNoaWxkcmVuIHRvIGJlIGRlZmluZWQuXG4gICAgdGhpcy5fa2V5TWFuYWdlciA9IG5ldyBGb2N1c0tleU1hbmFnZXI8Rm9jdXNhYmxlT3B0aW9uPih0aGlzLl9zdGVwSGVhZGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpdGhXcmFwKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aXRoVmVydGljYWxPcmllbnRhdGlvbih0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyk7XG5cbiAgICAodGhpcy5fZGlyID8gKHRoaXMuX2Rpci5jaGFuZ2UgYXMgT2JzZXJ2YWJsZTxEaXJlY3Rpb24+KSA6IG9iYXNlcnZhYmxlT2Y8RGlyZWN0aW9uPigpKVxuICAgICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZShkaXJlY3Rpb24gPT4gdGhpcy5fa2V5TWFuYWdlci53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKGRpcmVjdGlvbikpO1xuXG4gICAgdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKHRoaXMuX3NlbGVjdGVkSW5kZXgpO1xuXG4gICAgdGhpcy5zdGVwcy5jaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxLCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogU2VsZWN0cyBhbmQgZm9jdXNlcyB0aGUgbmV4dCBzdGVwIGluIGxpc3QuICovXG4gIG5leHQoKTogdm9pZCB7XG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gTWF0aC5taW4odGhpcy5fc2VsZWN0ZWRJbmRleCArIDEsIHRoaXMuc3RlcHMubGVuZ3RoIC0gMSk7XG4gIH1cblxuICAvKiogU2VsZWN0cyBhbmQgZm9jdXNlcyB0aGUgcHJldmlvdXMgc3RlcCBpbiBsaXN0LiAqL1xuICBwcmV2aW91cygpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBNYXRoLm1heCh0aGlzLl9zZWxlY3RlZEluZGV4IC0gMSwgMCk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdGVwcGVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLiBOb3RlIHRoYXQgdGhpcyBpbmNsdWRlcyBjbGVhcmluZyBmb3JtIGRhdGEuICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbUluZGV4KDApO1xuICAgIHRoaXMuc3RlcHMuZm9yRWFjaChzdGVwID0+IHN0ZXAucmVzZXQoKSk7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyBhIHVuaXF1ZSBpZCBmb3IgZWFjaCBzdGVwIGxhYmVsIGVsZW1lbnQuICovXG4gIF9nZXRTdGVwTGFiZWxJZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgY2RrLXN0ZXAtbGFiZWwtJHt0aGlzLl9ncm91cElkfS0ke2l9YDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHVuaXF1ZSBpZCBmb3IgZWFjaCBzdGVwIGNvbnRlbnQgZWxlbWVudC4gKi9cbiAgX2dldFN0ZXBDb250ZW50SWQoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGNkay1zdGVwLWNvbnRlbnQtJHt0aGlzLl9ncm91cElkfS0ke2l9YDtcbiAgfVxuXG4gIC8qKiBNYXJrcyB0aGUgY29tcG9uZW50IHRvIGJlIGNoYW5nZSBkZXRlY3RlZC4gKi9cbiAgX3N0YXRlQ2hhbmdlZCgpIHtcbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHBvc2l0aW9uIHN0YXRlIG9mIHRoZSBzdGVwIHdpdGggdGhlIGdpdmVuIGluZGV4LiAqL1xuICBfZ2V0QW5pbWF0aW9uRGlyZWN0aW9uKGluZGV4OiBudW1iZXIpOiBTdGVwQ29udGVudFBvc2l0aW9uU3RhdGUge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggLSB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXlvdXREaXJlY3Rpb24oKSA9PT0gJ3J0bCcgPyAnbmV4dCcgOiAncHJldmlvdXMnO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkgPT09ICdydGwnID8gJ3ByZXZpb3VzJyA6ICduZXh0JztcbiAgICB9XG4gICAgcmV0dXJuICdjdXJyZW50JztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSB0eXBlIG9mIGljb24gdG8gYmUgZGlzcGxheWVkLiAqL1xuICBfZ2V0SW5kaWNhdG9yVHlwZShpbmRleDogbnVtYmVyLCBzdGF0ZTogU3RlcFN0YXRlID0gU1RFUF9TVEFURS5OVU1CRVIpOiBTdGVwU3RhdGUge1xuICAgIGNvbnN0IHN0ZXAgPSB0aGlzLnN0ZXBzLnRvQXJyYXkoKVtpbmRleF07XG4gICAgY29uc3QgaXNDdXJyZW50U3RlcCA9IHRoaXMuX2lzQ3VycmVudFN0ZXAoaW5kZXgpO1xuXG4gICAgcmV0dXJuIHN0ZXAuX2Rpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZSA/IHRoaXMuX2dldERlZmF1bHRJbmRpY2F0b3JMb2dpYyhzdGVwLCBpc0N1cnJlbnRTdGVwKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dldEd1aWRlbGluZUxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXAsIHN0YXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldERlZmF1bHRJbmRpY2F0b3JMb2dpYyhzdGVwOiBDZGtTdGVwLCBpc0N1cnJlbnRTdGVwOiBib29sZWFuKTogU3RlcFN0YXRlIHtcbiAgICBpZiAoc3RlcC5fc2hvd0Vycm9yICYmIHN0ZXAuaGFzRXJyb3IgJiYgIWlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLkVSUk9SO1xuICAgIH0gZWxzZSBpZiAoIXN0ZXAuY29tcGxldGVkIHx8IGlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLk5VTUJFUjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0ZXAuZWRpdGFibGUgPyBTVEVQX1NUQVRFLkVESVQgOiBTVEVQX1NUQVRFLkRPTkU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0R3VpZGVsaW5lTG9naWMoXG4gICAgICBzdGVwOiBDZGtTdGVwLCBpc0N1cnJlbnRTdGVwOiBib29sZWFuLCBzdGF0ZTogU3RlcFN0YXRlID0gU1RFUF9TVEFURS5OVU1CRVIpOiBTdGVwU3RhdGUge1xuICAgIGlmIChzdGVwLl9zaG93RXJyb3IgJiYgc3RlcC5oYXNFcnJvciAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRVJST1I7XG4gICAgfSBlbHNlIGlmIChzdGVwLmNvbXBsZXRlZCAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRE9ORTtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuY29tcGxldGVkICYmIGlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuZWRpdGFibGUgJiYgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRURJVDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2lzQ3VycmVudFN0ZXAoaW5kZXg6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZEluZGV4ID09PSBpbmRleDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudGx5LWZvY3VzZWQgc3RlcCBoZWFkZXIuICovXG4gIF9nZXRGb2N1c0luZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9rZXlNYW5hZ2VyID8gdGhpcy5fa2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXggOiB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlU2VsZWN0ZWRJdGVtSW5kZXgobmV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHN0ZXBzQXJyYXkgPSB0aGlzLnN0ZXBzLnRvQXJyYXkoKTtcbiAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZS5lbWl0KHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IG5ld0luZGV4LFxuICAgICAgcHJldmlvdXNseVNlbGVjdGVkSW5kZXg6IHRoaXMuX3NlbGVjdGVkSW5kZXgsXG4gICAgICBzZWxlY3RlZFN0ZXA6IHN0ZXBzQXJyYXlbbmV3SW5kZXhdLFxuICAgICAgcHJldmlvdXNseVNlbGVjdGVkU3RlcDogc3RlcHNBcnJheVt0aGlzLl9zZWxlY3RlZEluZGV4XSxcbiAgICB9KTtcblxuICAgIC8vIElmIGZvY3VzIGlzIGluc2lkZSB0aGUgc3RlcHBlciwgbW92ZSBpdCB0byB0aGUgbmV4dCBoZWFkZXIsIG90aGVyd2lzZSBpdCBtYXkgYmVjb21lXG4gICAgLy8gbG9zdCB3aGVuIHRoZSBhY3RpdmUgc3RlcCBjb250ZW50IGlzIGhpZGRlbi4gV2UgY2FuJ3QgYmUgbW9yZSBncmFudWxhciB3aXRoIHRoZSBjaGVja1xuICAgIC8vIChlLmcuIGNoZWNraW5nIHdoZXRoZXIgZm9jdXMgaXMgaW5zaWRlIHRoZSBhY3RpdmUgc3RlcCksIGJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSBhXG4gICAgLy8gcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50cyB0aGF0IGFyZSByZW5kZXJpbmcgb3V0IHRoZSBjb250ZW50LlxuICAgIHRoaXMuX2NvbnRhaW5zRm9jdXMoKSA/IHRoaXMuX2tleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShuZXdJbmRleCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleU1hbmFnZXIudXBkYXRlQWN0aXZlSXRlbShuZXdJbmRleCk7XG5cbiAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gbmV3SW5kZXg7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICBfb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgY29uc3QgaGFzTW9kaWZpZXIgPSBoYXNNb2RpZmllcktleShldmVudCk7XG4gICAgY29uc3Qga2V5Q29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgY29uc3QgbWFuYWdlciA9IHRoaXMuX2tleU1hbmFnZXI7XG5cbiAgICBpZiAobWFuYWdlci5hY3RpdmVJdGVtSW5kZXggIT0gbnVsbCAmJiAhaGFzTW9kaWZpZXIgJiZcbiAgICAgICAgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSkge1xuICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gbWFuYWdlci5hY3RpdmVJdGVtSW5kZXg7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gSE9NRSkge1xuICAgICAgbWFuYWdlci5zZXRGaXJzdEl0ZW1BY3RpdmUoKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSBFTkQpIHtcbiAgICAgIG1hbmFnZXIuc2V0TGFzdEl0ZW1BY3RpdmUoKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hbmFnZXIub25LZXlkb3duKGV2ZW50KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hbnlDb250cm9sc0ludmFsaWRPclBlbmRpbmcoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN0ZXBzID0gdGhpcy5zdGVwcy50b0FycmF5KCk7XG5cbiAgICBzdGVwc1t0aGlzLl9zZWxlY3RlZEluZGV4XS5pbnRlcmFjdGVkID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLl9saW5lYXIgJiYgaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHN0ZXBzLnNsaWNlKDAsIGluZGV4KS5zb21lKHN0ZXAgPT4ge1xuICAgICAgICBjb25zdCBjb250cm9sID0gc3RlcC5zdGVwQ29udHJvbDtcbiAgICAgICAgY29uc3QgaXNJbmNvbXBsZXRlID1cbiAgICAgICAgICAgIGNvbnRyb2wgPyAoY29udHJvbC5pbnZhbGlkIHx8IGNvbnRyb2wucGVuZGluZyB8fCAhc3RlcC5pbnRlcmFjdGVkKSA6ICFzdGVwLmNvbXBsZXRlZDtcbiAgICAgICAgcmV0dXJuIGlzSW5jb21wbGV0ZSAmJiAhc3RlcC5vcHRpb25hbCAmJiAhc3RlcC5fY29tcGxldGVkT3ZlcnJpZGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9sYXlvdXREaXJlY3Rpb24oKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyICYmIHRoaXMuX2Rpci52YWx1ZSA9PT0gJ3J0bCcgPyAncnRsJyA6ICdsdHInO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBzdGVwcGVyIGNvbnRhaW5zIHRoZSBmb2N1c2VkIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NvbnRhaW5zRm9jdXMoKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9kb2N1bWVudCB8fCAhdGhpcy5fZWxlbWVudFJlZikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHN0ZXBwZXJFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IGZvY3VzZWRFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gc3RlcHBlckVsZW1lbnQgPT09IGZvY3VzZWRFbGVtZW50IHx8IHN0ZXBwZXJFbGVtZW50LmNvbnRhaW5zKGZvY3VzZWRFbGVtZW50KTtcbiAgfVxufVxuXG5cbi8qKlxuICogU2ltcGxpZmllZCByZXByZXNlbnRhdGlvbiBvZiBhIEZvcm1Db250cm9sIGZyb20gQGFuZ3VsYXIvZm9ybXMuXG4gKiBVc2VkIHRvIGF2b2lkIGhhdmluZyB0byBicmluZyBpbiBAYW5ndWxhci9mb3JtcyBmb3IgYSBzaW5nbGUgb3B0aW9uYWwgaW50ZXJmYWNlLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbnRlcmZhY2UgRm9ybUNvbnRyb2xMaWtlIHtcbiAgYXN5bmNWYWxpZGF0b3I6ICgpID0+IGFueSB8IG51bGw7XG4gIGRpcnR5OiBib29sZWFuO1xuICBkaXNhYmxlZDogYm9vbGVhbjtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZXJyb3JzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGw7XG4gIGludmFsaWQ6IGJvb2xlYW47XG4gIHBhcmVudDogYW55O1xuICBwZW5kaW5nOiBib29sZWFuO1xuICBwcmlzdGluZTogYm9vbGVhbjtcbiAgcm9vdDogRm9ybUNvbnRyb2xMaWtlO1xuICBzdGF0dXM6IHN0cmluZztcbiAgc3RhdHVzQ2hhbmdlczogT2JzZXJ2YWJsZTxhbnk+O1xuICB0b3VjaGVkOiBib29sZWFuO1xuICB1bnRvdWNoZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZU9uOiBhbnk7XG4gIHZhbGlkOiBib29sZWFuO1xuICB2YWxpZGF0b3I6ICgpID0+IGFueSB8IG51bGw7XG4gIHZhbHVlOiBhbnk7XG4gIHZhbHVlQ2hhbmdlczogT2JzZXJ2YWJsZTxhbnk+O1xuICBjbGVhckFzeW5jVmFsaWRhdG9ycygpOiB2b2lkO1xuICBjbGVhclZhbGlkYXRvcnMoKTogdm9pZDtcbiAgZGlzYWJsZShvcHRzPzogYW55KTogdm9pZDtcbiAgZW5hYmxlKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBnZXQocGF0aDogKHN0cmluZyB8IG51bWJlcilbXSB8IHN0cmluZyk6IEZvcm1Db250cm9sTGlrZSB8IG51bGw7XG4gIGdldEVycm9yKGVycm9yQ29kZTogc3RyaW5nLCBwYXRoPzogKHN0cmluZyB8IG51bWJlcilbXSB8IHN0cmluZyk6IGFueTtcbiAgaGFzRXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogYm9vbGVhbjtcbiAgbWFya0FsbEFzVG91Y2hlZCgpOiB2b2lkO1xuICBtYXJrQXNEaXJ0eShvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzUGVuZGluZyhvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzUHJpc3RpbmUob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1RvdWNoZWQob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1VudG91Y2hlZChvcHRzPzogYW55KTogdm9pZDtcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogT2JqZWN0KTogdm9pZDtcbiAgcmVzZXQodmFsdWU/OiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICBzZXRBc3luY1ZhbGlkYXRvcnMobmV3VmFsaWRhdG9yOiAoKSA9PiBhbnkgfCAoKCkgPT4gYW55KVtdIHwgbnVsbCk6IHZvaWQ7XG4gIHNldEVycm9ycyhlcnJvcnM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCwgb3B0cz86IGFueSk6IHZvaWQ7XG4gIHNldFBhcmVudChwYXJlbnQ6IGFueSk6IHZvaWQ7XG4gIHNldFZhbGlkYXRvcnMobmV3VmFsaWRhdG9yOiAoKSA9PiBhbnkgfCAoKCkgPT4gYW55KVtdIHwgbnVsbCk6IHZvaWQ7XG4gIHNldFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICB1cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdHM/OiBhbnkpOiB2b2lkO1xuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiBGdW5jdGlvbik6IHZvaWQ7XG4gIHJlZ2lzdGVyT25EaXNhYmxlZENoYW5nZShmbjogKGlzRGlzYWJsZWQ6IGJvb2xlYW4pID0+IHZvaWQpOiB2b2lkO1xuICByZXNldChmb3JtU3RhdGU/OiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbn1cbiJdfQ==