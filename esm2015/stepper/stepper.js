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
        /**
         * We need to store the steps in an Iterable due to strict template type checking with *ngFor and
         * https://github.com/angular/angular/issues/29842.
         */
        this._stepsArray = [];
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
     * We need to store the steps in an Iterable due to strict template type checking with *ngFor and
     * https://github.com/angular/angular/issues/29842.
     * @type {?}
     */
    CdkStepper.prototype._stepsArray;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFZLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFHTCxRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxXQUFXLEVBQ1gsU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVwRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7Ozs7O0lBR3RDLE1BQU0sR0FBRyxDQUFDOzs7O0FBWWQsTUFBTSxPQUFPLHFCQUFxQjtDQVlqQzs7Ozs7O0lBVkMsOENBQXNC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WTs7SUFDWixzQ0FBaUI7O0lBQ2pCLHVDQUFrQjs7SUFDbEIsbUNBQTBCOztJQUMxQixxQ0FBZTs7SUFDZiw0Q0FBK0I7O0lBQy9CLHNDQUFpQjs7SUFDakIsd0NBQW1COztJQUNuQix1Q0FBYzs7SUFDZCxvQ0FBZTs7SUFDZix3Q0FBMEM7O0lBQzFDLG9DQUFXOztJQUNYLDJDQUE4Qjs7OztJQUM5QixxRUFBNkI7Ozs7SUFDN0IsZ0VBQXdCOzs7OztJQUN4Qiw0REFBMEI7Ozs7O0lBQzFCLDJEQUF5Qjs7Ozs7SUFDekIsd0RBQW9FOzs7Ozs7SUFDcEUsd0VBQXNFOzs7Ozs7SUFDdEUsd0VBQTBFOzs7O0lBQzFFLGlFQUF5Qjs7Ozs7SUFDekIsZ0VBQThCOzs7OztJQUM5QixrRUFBZ0M7Ozs7O0lBQ2hDLG1FQUFpQzs7Ozs7SUFDakMsa0VBQWdDOzs7OztJQUNoQyxvRUFBa0M7Ozs7OztJQUNsQyx5RUFBK0M7Ozs7OztJQUMvQyxvRUFBMkM7Ozs7O0lBQzNDLCtFQUMwQzs7Ozs7O0lBQzFDLHNFQUFpRTs7Ozs7SUFDakUsZ0VBQTZCOzs7OztJQUM3QiwwRUFDMEM7Ozs7OztJQUMxQyx1RUFBNkM7Ozs7O0lBQzdDLDJFQUF5Qzs7Ozs7O0lBQ3pDLHlFQUE0Qzs7Ozs7O0lBQzVDLHdFQUE0Qzs7Ozs7O0lBQzVDLHVFQUEwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbiwgRm9jdXNLZXlNYW5hZ2VyfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VOdW1iZXJQcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RU5ELCBFTlRFUiwgaGFzTW9kaWZpZXJLZXksIEhPTUUsIFNQQUNFfSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q2RrU3RlcEhlYWRlcn0gZnJvbSAnLi9zdGVwLWhlYWRlcic7XG5pbXBvcnQge0Nka1N0ZXBMYWJlbH0gZnJvbSAnLi9zdGVwLWxhYmVsJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIHN0ZXBwZXIgY29tcG9uZW50LiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogUG9zaXRpb24gc3RhdGUgb2YgdGhlIGNvbnRlbnQgb2YgZWFjaCBzdGVwIGluIHN0ZXBwZXIgdGhhdCBpcyB1c2VkIGZvciB0cmFuc2l0aW9uaW5nXG4gKiB0aGUgY29udGVudCBpbnRvIGNvcnJlY3QgcG9zaXRpb24gdXBvbiBzdGVwIHNlbGVjdGlvbiBjaGFuZ2UuXG4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSA9ICdwcmV2aW91cyd8J2N1cnJlbnQnfCduZXh0JztcblxuLyoqIFBvc3NpYmxlIG9yaWVudGF0aW9uIG9mIGEgc3RlcHBlci4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBwZXJPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJ3wndmVydGljYWwnO1xuXG4vKiogQ2hhbmdlIGV2ZW50IGVtaXR0ZWQgb24gc2VsZWN0aW9uIGNoYW5nZXMuICovXG5leHBvcnQgY2xhc3MgU3RlcHBlclNlbGVjdGlvbkV2ZW50IHtcbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgc3RlcCBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBub3cgc2VsZWN0ZWQuICovXG4gIHNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcblxuICAvKiogVGhlIHN0ZXAgaW5zdGFuY2UgcHJldmlvdXNseSBzZWxlY3RlZC4gKi9cbiAgcHJldmlvdXNseVNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcbn1cblxuLyoqIFRoZSBzdGF0ZSBvZiBlYWNoIHN0ZXAuICovXG5leHBvcnQgdHlwZSBTdGVwU3RhdGUgPSAnbnVtYmVyJ3wnZWRpdCd8J2RvbmUnfCdlcnJvcid8c3RyaW5nO1xuXG4vKiogRW51bSB0byByZXByZXNlbnQgdGhlIGRpZmZlcmVudCBzdGF0ZXMgb2YgdGhlIHN0ZXBzLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBfU1RBVEUgPSB7XG4gIE5VTUJFUjogJ251bWJlcicsXG4gIEVESVQ6ICdlZGl0JyxcbiAgRE9ORTogJ2RvbmUnLFxuICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuLyoqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBTVEVQUEVSX0dMT0JBTF9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPFN0ZXBwZXJPcHRpb25zPignU1RFUFBFUl9HTE9CQUxfT1BUSU9OUycpO1xuXG4vKipcbiAqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy5cbiAqIEBkZXByZWNhdGVkIFVzZSBgU1RFUFBFUl9HTE9CQUxfT1BUSU9OU2AgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjAuXG4gKi9cbmV4cG9ydCBjb25zdCBNQVRfU1RFUFBFUl9HTE9CQUxfT1BUSU9OUyA9IFNURVBQRVJfR0xPQkFMX09QVElPTlM7XG5cbi8qKiBDb25maWd1cmFibGUgb3B0aW9ucyBmb3Igc3RlcHBlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcHBlck9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RlcHBlciBzaG91bGQgZGlzcGxheSBhbiBlcnJvciBzdGF0ZSBvciBub3QuXG4gICAqIERlZmF1bHQgYmVoYXZpb3IgaXMgYXNzdW1lZCB0byBiZSBmYWxzZS5cbiAgICovXG4gIHNob3dFcnJvcj86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0ZXBwZXIgc2hvdWxkIGRpc3BsYXkgdGhlIGRlZmF1bHQgaW5kaWNhdG9yIHR5cGVcbiAgICogb3Igbm90LlxuICAgKiBEZWZhdWx0IGJlaGF2aW9yIGlzIGFzc3VtZWQgdG8gYmUgdHJ1ZS5cbiAgICovXG4gIGRpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZT86IGJvb2xlYW47XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1zdGVwJyxcbiAgZXhwb3J0QXM6ICdjZGtTdGVwJyxcbiAgdGVtcGxhdGU6ICc8bmctdGVtcGxhdGU+PG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PjwvbmctdGVtcGxhdGU+JyxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXAgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICBwcml2YXRlIF9zdGVwcGVyT3B0aW9uczogU3RlcHBlck9wdGlvbnM7XG4gIF9zaG93RXJyb3I6IGJvb2xlYW47XG4gIF9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGU6IGJvb2xlYW47XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBzdGVwIGxhYmVsIGlmIGl0IGV4aXN0cy4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtTdGVwTGFiZWwpIHN0ZXBMYWJlbDogQ2RrU3RlcExhYmVsO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3Igc3RlcCBjb250ZW50LiAqL1xuICBAVmlld0NoaWxkKFRlbXBsYXRlUmVmLCB7c3RhdGljOiB0cnVlfSkgY29udGVudDogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKiogVGhlIHRvcCBsZXZlbCBhYnN0cmFjdCBjb250cm9sIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBzdGVwQ29udHJvbDogQWJzdHJhY3RDb250cm9sTGlrZTtcblxuICAvKiogV2hldGhlciB1c2VyIGhhcyBzZWVuIHRoZSBleHBhbmRlZCBzdGVwIGNvbnRlbnQgb3Igbm90LiAqL1xuICBpbnRlcmFjdGVkID0gZmFsc2U7XG5cbiAgLyoqIFBsYWluIHRleHQgbGFiZWwgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIGxhYmVsOiBzdHJpbmc7XG5cbiAgLyoqIEVycm9yIG1lc3NhZ2UgdG8gZGlzcGxheSB3aGVuIHRoZXJlJ3MgYW4gZXJyb3IuICovXG4gIEBJbnB1dCgpIGVycm9yTWVzc2FnZTogc3RyaW5nO1xuXG4gIC8qKiBBcmlhIGxhYmVsIGZvciB0aGUgdGFiLiAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWwnKSBhcmlhTGFiZWw6IHN0cmluZztcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHRoYXQgdGhlIHRhYiBpcyBsYWJlbGxlZCBieS5cbiAgICogV2lsbCBiZSBjbGVhcmVkIGlmIGBhcmlhLWxhYmVsYCBpcyBzZXQgYXQgdGhlIHNhbWUgdGltZS5cbiAgICovXG4gIEBJbnB1dCgnYXJpYS1sYWJlbGxlZGJ5JykgYXJpYUxhYmVsbGVkYnk6IHN0cmluZztcblxuICAvKiogU3RhdGUgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIHN0YXRlOiBTdGVwU3RhdGU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgY2FuIHJldHVybiB0byB0aGlzIHN0ZXAgb25jZSBpdCBoYXMgYmVlbiBtYXJrZWQgYXMgY29tcGxldGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZWRpdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2VkaXRhYmxlO1xuICB9XG4gIHNldCBlZGl0YWJsZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2VkaXRhYmxlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9lZGl0YWJsZSA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNvbXBsZXRpb24gb2Ygc3RlcCBpcyBvcHRpb25hbC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9wdGlvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25hbDtcbiAgfVxuICBzZXQgb3B0aW9uYWwodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9vcHRpb25hbCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfb3B0aW9uYWwgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzdGVwIGlzIG1hcmtlZCBhcyBjb21wbGV0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjb21wbGV0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID09IG51bGwgPyB0aGlzLl9nZXREZWZhdWx0Q29tcGxldGVkKCkgOiB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZTtcbiAgfVxuICBzZXQgY29tcGxldGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIF9jb21wbGV0ZWRPdmVycmlkZTogYm9vbGVhbnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9nZXREZWZhdWx0Q29tcGxldGVkKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sID8gdGhpcy5zdGVwQ29udHJvbC52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQgOiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogV2hldGhlciBzdGVwIGhhcyBhbiBlcnJvci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGhhc0Vycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jdXN0b21FcnJvciA9PSBudWxsID8gdGhpcy5fZ2V0RGVmYXVsdEVycm9yKCkgOiB0aGlzLl9jdXN0b21FcnJvcjtcbiAgfVxuICBzZXQgaGFzRXJyb3IodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jdXN0b21FcnJvciA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfY3VzdG9tRXJyb3I6IGJvb2xlYW58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEVycm9yKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sICYmIHRoaXMuc3RlcENvbnRyb2wuaW52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCByZW1vdmUgdGhlIGA/YCBhZnRlciBgc3RlcHBlck9wdGlvbnNgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQEluamVjdChmb3J3YXJkUmVmKCgpID0+IENka1N0ZXBwZXIpKSBwcml2YXRlIF9zdGVwcGVyOiBDZGtTdGVwcGVyLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChTVEVQUEVSX0dMT0JBTF9PUFRJT05TKSBzdGVwcGVyT3B0aW9ucz86IFN0ZXBwZXJPcHRpb25zKSB7XG4gICAgdGhpcy5fc3RlcHBlck9wdGlvbnMgPSBzdGVwcGVyT3B0aW9ucyA/IHN0ZXBwZXJPcHRpb25zIDoge307XG4gICAgdGhpcy5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID0gdGhpcy5fc3RlcHBlck9wdGlvbnMuZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlICE9PSBmYWxzZTtcbiAgICB0aGlzLl9zaG93RXJyb3IgPSAhIXRoaXMuX3N0ZXBwZXJPcHRpb25zLnNob3dFcnJvcjtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIHRoaXMgc3RlcCBjb21wb25lbnQuICovXG4gIHNlbGVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGVwcGVyLnNlbGVjdGVkID0gdGhpcztcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXAgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIHJlc2V0dGluZyBmb3JtIGRhdGEuICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuaW50ZXJhY3RlZCA9IGZhbHNlO1xuXG4gICAgaWYgKHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2N1c3RvbUVycm9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2N1c3RvbUVycm9yID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RlcENvbnRyb2wpIHtcbiAgICAgIHRoaXMuc3RlcENvbnRyb2wucmVzZXQoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcygpIHtcbiAgICAvLyBTaW5jZSBiYXNpY2FsbHkgYWxsIGlucHV0cyBvZiB0aGUgTWF0U3RlcCBnZXQgcHJveGllZCB0aHJvdWdoIHRoZSB2aWV3IGRvd24gdG8gdGhlXG4gICAgLy8gdW5kZXJseWluZyBNYXRTdGVwSGVhZGVyLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gcnVucyBjb3JyZWN0bHkuXG4gICAgdGhpcy5fc3RlcHBlci5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZWRpdGFibGU6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfaGFzRXJyb3I6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfb3B0aW9uYWw6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfY29tcGxldGVkOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbn1cblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1N0ZXBwZXJdJyxcbiAgZXhwb3J0QXM6ICdjZGtTdGVwcGVyJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcHBlciBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBjb21wb25lbnQgaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIFVzZWQgZm9yIG1hbmFnaW5nIGtleWJvYXJkIGZvY3VzLiAqL1xuICBwcml2YXRlIF9rZXlNYW5hZ2VyOiBGb2N1c0tleU1hbmFnZXI8Rm9jdXNhYmxlT3B0aW9uPjtcblxuICAvKipcbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBSZW1vdmUgYHwgdW5kZWZpbmVkYCBvbmNlIHRoZSBgX2RvY3VtZW50YFxuICAgKiBjb25zdHJ1Y3RvciBwYXJhbSBpcyByZXF1aXJlZC5cbiAgICovXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN0ZXAgY29tcG9uZW50cyB0aGF0IHRoZSBzdGVwcGVyIGlzIGhvbGRpbmcuXG4gICAqIEBkZXByZWNhdGVkIHVzZSBgc3RlcHNgIGluc3RlYWRcbiAgICogQGJyZWFraW5nLWNoYW5nZSA5LjAuMCByZW1vdmUgdGhpcyBwcm9wZXJ0eVxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtTdGVwLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfc3RlcHM6IFF1ZXJ5TGlzdDxDZGtTdGVwPjtcblxuICAvKipcbiAgICogV2UgbmVlZCB0byBzdG9yZSB0aGUgc3RlcHMgaW4gYW4gSXRlcmFibGUgZHVlIHRvIHN0cmljdCB0ZW1wbGF0ZSB0eXBlIGNoZWNraW5nIHdpdGggKm5nRm9yIGFuZFxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8yOTg0Mi5cbiAgICovXG4gIF9zdGVwc0FycmF5OiBDZGtTdGVwW10gPSBbXTtcblxuICAvKiogVGhlIGxpc3Qgb2Ygc3RlcCBjb21wb25lbnRzIHRoYXQgdGhlIHN0ZXBwZXIgaXMgaG9sZGluZy4gKi9cbiAgZ2V0IHN0ZXBzKCk6IFF1ZXJ5TGlzdDxDZGtTdGVwPiB7XG4gICAgcmV0dXJuIHRoaXMuX3N0ZXBzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN0ZXAgaGVhZGVycyBvZiB0aGUgc3RlcHMgaW4gdGhlIHN0ZXBwZXIuXG4gICAqIEBkZXByZWNhdGVkIFR5cGUgdG8gYmUgY2hhbmdlZCB0byBgUXVlcnlMaXN0PENka1N0ZXBIZWFkZXI+YC5cbiAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMFxuICAgKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtTdGVwSGVhZGVyLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfc3RlcEhlYWRlcjogUXVlcnlMaXN0PEZvY3VzYWJsZU9wdGlvbj47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHZhbGlkaXR5IG9mIHByZXZpb3VzIHN0ZXBzIHNob3VsZCBiZSBjaGVja2VkIG9yIG5vdC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGxpbmVhcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbGluZWFyO1xuICB9XG4gIHNldCBsaW5lYXIodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9saW5lYXIgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2xpbmVhciA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIHNlbGVjdGVkIHN0ZXAuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZEluZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICB9XG4gIHNldCBzZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IGNvZXJjZU51bWJlclByb3BlcnR5KGluZGV4KTtcblxuICAgIGlmICh0aGlzLnN0ZXBzKSB7XG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgaW5kZXggY2FuJ3QgYmUgb3V0IG9mIGJvdW5kcy5cbiAgICAgIGlmIChuZXdJbmRleCA8IDAgfHwgbmV3SW5kZXggPiB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2Nka1N0ZXBwZXI6IENhbm5vdCBhc3NpZ24gb3V0LW9mLWJvdW5kcyB2YWx1ZSB0byBgc2VsZWN0ZWRJbmRleGAuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ICE9IG5ld0luZGV4ICYmICF0aGlzLl9hbnlDb250cm9sc0ludmFsaWRPclBlbmRpbmcobmV3SW5kZXgpICYmXG4gICAgICAgICAgKG5ld0luZGV4ID49IHRoaXMuX3NlbGVjdGVkSW5kZXggfHwgdGhpcy5zdGVwcy50b0FycmF5KClbbmV3SW5kZXhdLmVkaXRhYmxlKSkge1xuICAgICAgICB0aGlzLl91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChpbmRleCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleCA9IDA7XG5cbiAgLyoqIFRoZSBzdGVwIHRoYXQgaXMgc2VsZWN0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZCgpOiBDZGtTdGVwIHtcbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIENoYW5nZSByZXR1cm4gdHlwZSB0byBgQ2RrU3RlcCB8IHVuZGVmaW5lZGAuXG4gICAgcmV0dXJuIHRoaXMuc3RlcHMgPyB0aGlzLnN0ZXBzLnRvQXJyYXkoKVt0aGlzLnNlbGVjdGVkSW5kZXhdIDogdW5kZWZpbmVkITtcbiAgfVxuICBzZXQgc2VsZWN0ZWQoc3RlcDogQ2RrU3RlcCkge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuc3RlcHMgPyB0aGlzLnN0ZXBzLnRvQXJyYXkoKS5pbmRleE9mKHN0ZXApIDogLTE7XG4gIH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBzZWxlY3RlZCBzdGVwIGhhcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KClcbiAgc2VsZWN0aW9uQ2hhbmdlOiBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PigpO1xuXG4gIC8qKiBVc2VkIHRvIHRyYWNrIHVuaXF1ZSBJRCBmb3IgZWFjaCBzdGVwcGVyIGNvbXBvbmVudC4gKi9cbiAgX2dyb3VwSWQ6IG51bWJlcjtcblxuICBwcm90ZWN0ZWQgX29yaWVudGF0aW9uOiBTdGVwcGVyT3JpZW50YXRpb24gPSAnaG9yaXpvbnRhbCc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIGBfZWxlbWVudFJlZmAgYW5kIGBfZG9jdW1lbnRgIHBhcmFtZXRlcnMgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgICAgcHJpdmF0ZSBfZWxlbWVudFJlZj86IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICB0aGlzLl9ncm91cElkID0gbmV4dElkKys7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gTm90ZSB0aGF0IHdoaWxlIHRoZSBzdGVwIGhlYWRlcnMgYXJlIGNvbnRlbnQgY2hpbGRyZW4gYnkgZGVmYXVsdCwgYW55IGNvbXBvbmVudHMgdGhhdFxuICAgIC8vIGV4dGVuZCB0aGlzIG9uZSBtaWdodCBoYXZlIHRoZW0gYXMgdmlldyBjaGlsZHJlbi4gV2UgaW5pdGlhbGl6ZSB0aGUga2V5Ym9hcmQgaGFuZGxpbmcgaW5cbiAgICAvLyBBZnRlclZpZXdJbml0IHNvIHdlJ3JlIGd1YXJhbnRlZWQgZm9yIGJvdGggdmlldyBhbmQgY29udGVudCBjaGlsZHJlbiB0byBiZSBkZWZpbmVkLlxuICAgIHRoaXMuX2tleU1hbmFnZXIgPSBuZXcgRm9jdXNLZXlNYW5hZ2VyPEZvY3VzYWJsZU9wdGlvbj4odGhpcy5fc3RlcEhlYWRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aXRoV3JhcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAud2l0aFZlcnRpY2FsT3JpZW50YXRpb24odGhpcy5fb3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpO1xuXG4gICAgKHRoaXMuX2RpciA/ICh0aGlzLl9kaXIuY2hhbmdlIGFzIE9ic2VydmFibGU8RGlyZWN0aW9uPikgOiBvYnNlcnZhYmxlT2Y8RGlyZWN0aW9uPigpKVxuICAgICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZShkaXJlY3Rpb24gPT4gdGhpcy5fa2V5TWFuYWdlci53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKGRpcmVjdGlvbikpO1xuXG4gICAgdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKHRoaXMuX3NlbGVjdGVkSW5kZXgpO1xuXG4gICAgdGhpcy5zdGVwcy5jaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxLCAwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogU2VsZWN0cyBhbmQgZm9jdXNlcyB0aGUgbmV4dCBzdGVwIGluIGxpc3QuICovXG4gIG5leHQoKTogdm9pZCB7XG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gTWF0aC5taW4odGhpcy5fc2VsZWN0ZWRJbmRleCArIDEsIHRoaXMuc3RlcHMubGVuZ3RoIC0gMSk7XG4gIH1cblxuICAvKiogU2VsZWN0cyBhbmQgZm9jdXNlcyB0aGUgcHJldmlvdXMgc3RlcCBpbiBsaXN0LiAqL1xuICBwcmV2aW91cygpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBNYXRoLm1heCh0aGlzLl9zZWxlY3RlZEluZGV4IC0gMSwgMCk7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdGVwcGVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLiBOb3RlIHRoYXQgdGhpcyBpbmNsdWRlcyBjbGVhcmluZyBmb3JtIGRhdGEuICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbUluZGV4KDApO1xuICAgIHRoaXMuc3RlcHMuZm9yRWFjaChzdGVwID0+IHN0ZXAucmVzZXQoKSk7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyBhIHVuaXF1ZSBpZCBmb3IgZWFjaCBzdGVwIGxhYmVsIGVsZW1lbnQuICovXG4gIF9nZXRTdGVwTGFiZWxJZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgY2RrLXN0ZXAtbGFiZWwtJHt0aGlzLl9ncm91cElkfS0ke2l9YDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHVuaXF1ZSBpZCBmb3IgZWFjaCBzdGVwIGNvbnRlbnQgZWxlbWVudC4gKi9cbiAgX2dldFN0ZXBDb250ZW50SWQoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGNkay1zdGVwLWNvbnRlbnQtJHt0aGlzLl9ncm91cElkfS0ke2l9YDtcbiAgfVxuXG4gIC8qKiBNYXJrcyB0aGUgY29tcG9uZW50IHRvIGJlIGNoYW5nZSBkZXRlY3RlZC4gKi9cbiAgX3N0YXRlQ2hhbmdlZCgpIHtcbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHBvc2l0aW9uIHN0YXRlIG9mIHRoZSBzdGVwIHdpdGggdGhlIGdpdmVuIGluZGV4LiAqL1xuICBfZ2V0QW5pbWF0aW9uRGlyZWN0aW9uKGluZGV4OiBudW1iZXIpOiBTdGVwQ29udGVudFBvc2l0aW9uU3RhdGUge1xuICAgIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggLSB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXlvdXREaXJlY3Rpb24oKSA9PT0gJ3J0bCcgPyAnbmV4dCcgOiAncHJldmlvdXMnO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkgPT09ICdydGwnID8gJ3ByZXZpb3VzJyA6ICduZXh0JztcbiAgICB9XG4gICAgcmV0dXJuICdjdXJyZW50JztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSB0eXBlIG9mIGljb24gdG8gYmUgZGlzcGxheWVkLiAqL1xuICBfZ2V0SW5kaWNhdG9yVHlwZShpbmRleDogbnVtYmVyLCBzdGF0ZTogU3RlcFN0YXRlID0gU1RFUF9TVEFURS5OVU1CRVIpOiBTdGVwU3RhdGUge1xuICAgIGNvbnN0IHN0ZXAgPSB0aGlzLnN0ZXBzLnRvQXJyYXkoKVtpbmRleF07XG4gICAgY29uc3QgaXNDdXJyZW50U3RlcCA9IHRoaXMuX2lzQ3VycmVudFN0ZXAoaW5kZXgpO1xuXG4gICAgcmV0dXJuIHN0ZXAuX2Rpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZSA/IHRoaXMuX2dldERlZmF1bHRJbmRpY2F0b3JMb2dpYyhzdGVwLCBpc0N1cnJlbnRTdGVwKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dldEd1aWRlbGluZUxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXAsIHN0YXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldERlZmF1bHRJbmRpY2F0b3JMb2dpYyhzdGVwOiBDZGtTdGVwLCBpc0N1cnJlbnRTdGVwOiBib29sZWFuKTogU3RlcFN0YXRlIHtcbiAgICBpZiAoc3RlcC5fc2hvd0Vycm9yICYmIHN0ZXAuaGFzRXJyb3IgJiYgIWlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLkVSUk9SO1xuICAgIH0gZWxzZSBpZiAoIXN0ZXAuY29tcGxldGVkIHx8IGlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBTVEVQX1NUQVRFLk5VTUJFUjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0ZXAuZWRpdGFibGUgPyBTVEVQX1NUQVRFLkVESVQgOiBTVEVQX1NUQVRFLkRPTkU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0R3VpZGVsaW5lTG9naWMoXG4gICAgICBzdGVwOiBDZGtTdGVwLCBpc0N1cnJlbnRTdGVwOiBib29sZWFuLCBzdGF0ZTogU3RlcFN0YXRlID0gU1RFUF9TVEFURS5OVU1CRVIpOiBTdGVwU3RhdGUge1xuICAgIGlmIChzdGVwLl9zaG93RXJyb3IgJiYgc3RlcC5oYXNFcnJvciAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRVJST1I7XG4gICAgfSBlbHNlIGlmIChzdGVwLmNvbXBsZXRlZCAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRE9ORTtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuY29tcGxldGVkICYmIGlzQ3VycmVudFN0ZXApIHtcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuZWRpdGFibGUgJiYgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRURJVDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2lzQ3VycmVudFN0ZXAoaW5kZXg6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZEluZGV4ID09PSBpbmRleDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudGx5LWZvY3VzZWQgc3RlcCBoZWFkZXIuICovXG4gIF9nZXRGb2N1c0luZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9rZXlNYW5hZ2VyID8gdGhpcy5fa2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXggOiB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlU2VsZWN0ZWRJdGVtSW5kZXgobmV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHN0ZXBzQXJyYXkgPSB0aGlzLnN0ZXBzLnRvQXJyYXkoKTtcbiAgICB0aGlzLnNlbGVjdGlvbkNoYW5nZS5lbWl0KHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IG5ld0luZGV4LFxuICAgICAgcHJldmlvdXNseVNlbGVjdGVkSW5kZXg6IHRoaXMuX3NlbGVjdGVkSW5kZXgsXG4gICAgICBzZWxlY3RlZFN0ZXA6IHN0ZXBzQXJyYXlbbmV3SW5kZXhdLFxuICAgICAgcHJldmlvdXNseVNlbGVjdGVkU3RlcDogc3RlcHNBcnJheVt0aGlzLl9zZWxlY3RlZEluZGV4XSxcbiAgICB9KTtcblxuICAgIC8vIElmIGZvY3VzIGlzIGluc2lkZSB0aGUgc3RlcHBlciwgbW92ZSBpdCB0byB0aGUgbmV4dCBoZWFkZXIsIG90aGVyd2lzZSBpdCBtYXkgYmVjb21lXG4gICAgLy8gbG9zdCB3aGVuIHRoZSBhY3RpdmUgc3RlcCBjb250ZW50IGlzIGhpZGRlbi4gV2UgY2FuJ3QgYmUgbW9yZSBncmFudWxhciB3aXRoIHRoZSBjaGVja1xuICAgIC8vIChlLmcuIGNoZWNraW5nIHdoZXRoZXIgZm9jdXMgaXMgaW5zaWRlIHRoZSBhY3RpdmUgc3RlcCksIGJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSBhXG4gICAgLy8gcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50cyB0aGF0IGFyZSByZW5kZXJpbmcgb3V0IHRoZSBjb250ZW50LlxuICAgIHRoaXMuX2NvbnRhaW5zRm9jdXMoKSA/IHRoaXMuX2tleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShuZXdJbmRleCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleU1hbmFnZXIudXBkYXRlQWN0aXZlSXRlbShuZXdJbmRleCk7XG5cbiAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gbmV3SW5kZXg7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICBfb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgY29uc3QgaGFzTW9kaWZpZXIgPSBoYXNNb2RpZmllcktleShldmVudCk7XG4gICAgY29uc3Qga2V5Q29kZSA9IGV2ZW50LmtleUNvZGU7XG4gICAgY29uc3QgbWFuYWdlciA9IHRoaXMuX2tleU1hbmFnZXI7XG5cbiAgICBpZiAobWFuYWdlci5hY3RpdmVJdGVtSW5kZXggIT0gbnVsbCAmJiAhaGFzTW9kaWZpZXIgJiZcbiAgICAgICAgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSkge1xuICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gbWFuYWdlci5hY3RpdmVJdGVtSW5kZXg7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gSE9NRSkge1xuICAgICAgbWFuYWdlci5zZXRGaXJzdEl0ZW1BY3RpdmUoKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSBFTkQpIHtcbiAgICAgIG1hbmFnZXIuc2V0TGFzdEl0ZW1BY3RpdmUoKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hbmFnZXIub25LZXlkb3duKGV2ZW50KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hbnlDb250cm9sc0ludmFsaWRPclBlbmRpbmcoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN0ZXBzID0gdGhpcy5zdGVwcy50b0FycmF5KCk7XG5cbiAgICBzdGVwc1t0aGlzLl9zZWxlY3RlZEluZGV4XS5pbnRlcmFjdGVkID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLl9saW5lYXIgJiYgaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHN0ZXBzLnNsaWNlKDAsIGluZGV4KS5zb21lKHN0ZXAgPT4ge1xuICAgICAgICBjb25zdCBjb250cm9sID0gc3RlcC5zdGVwQ29udHJvbDtcbiAgICAgICAgY29uc3QgaXNJbmNvbXBsZXRlID1cbiAgICAgICAgICAgIGNvbnRyb2wgPyAoY29udHJvbC5pbnZhbGlkIHx8IGNvbnRyb2wucGVuZGluZyB8fCAhc3RlcC5pbnRlcmFjdGVkKSA6ICFzdGVwLmNvbXBsZXRlZDtcbiAgICAgICAgcmV0dXJuIGlzSW5jb21wbGV0ZSAmJiAhc3RlcC5vcHRpb25hbCAmJiAhc3RlcC5fY29tcGxldGVkT3ZlcnJpZGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9sYXlvdXREaXJlY3Rpb24oKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyICYmIHRoaXMuX2Rpci52YWx1ZSA9PT0gJ3J0bCcgPyAncnRsJyA6ICdsdHInO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBzdGVwcGVyIGNvbnRhaW5zIHRoZSBmb2N1c2VkIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NvbnRhaW5zRm9jdXMoKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9kb2N1bWVudCB8fCAhdGhpcy5fZWxlbWVudFJlZikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHN0ZXBwZXJFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IGZvY3VzZWRFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gc3RlcHBlckVsZW1lbnQgPT09IGZvY3VzZWRFbGVtZW50IHx8IHN0ZXBwZXJFbGVtZW50LmNvbnRhaW5zKGZvY3VzZWRFbGVtZW50KTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9lZGl0YWJsZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9vcHRpb25hbDogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9jb21wbGV0ZWQ6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfaGFzRXJyb3I6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbGluZWFyOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3NlbGVjdGVkSW5kZXg6IG51bWJlciB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG59XG5cblxuLyoqXG4gKiBTaW1wbGlmaWVkIHJlcHJlc2VudGF0aW9uIG9mIGFuIFwiQWJzdHJhY3RDb250cm9sXCIgZnJvbSBAYW5ndWxhci9mb3Jtcy5cbiAqIFVzZWQgdG8gYXZvaWQgaGF2aW5nIHRvIGJyaW5nIGluIEBhbmd1bGFyL2Zvcm1zIGZvciBhIHNpbmdsZSBvcHRpb25hbCBpbnRlcmZhY2UuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBBYnN0cmFjdENvbnRyb2xMaWtlIHtcbiAgYXN5bmNWYWxpZGF0b3I6ICgoY29udHJvbDogYW55KSA9PiBhbnkpIHwgbnVsbDtcbiAgZGlydHk6IGJvb2xlYW47XG4gIGRpc2FibGVkOiBib29sZWFuO1xuICBlbmFibGVkOiBib29sZWFuO1xuICBlcnJvcnM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbDtcbiAgaW52YWxpZDogYm9vbGVhbjtcbiAgcGFyZW50OiBhbnk7XG4gIHBlbmRpbmc6IGJvb2xlYW47XG4gIHByaXN0aW5lOiBib29sZWFuO1xuICByb290OiBBYnN0cmFjdENvbnRyb2xMaWtlO1xuICBzdGF0dXM6IHN0cmluZztcbiAgc3RhdHVzQ2hhbmdlczogT2JzZXJ2YWJsZTxhbnk+O1xuICB0b3VjaGVkOiBib29sZWFuO1xuICB1bnRvdWNoZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZU9uOiBhbnk7XG4gIHZhbGlkOiBib29sZWFuO1xuICB2YWxpZGF0b3I6ICgoY29udHJvbDogYW55KSA9PiBhbnkpIHwgbnVsbDtcbiAgdmFsdWU6IGFueTtcbiAgdmFsdWVDaGFuZ2VzOiBPYnNlcnZhYmxlPGFueT47XG4gIGNsZWFyQXN5bmNWYWxpZGF0b3JzKCk6IHZvaWQ7XG4gIGNsZWFyVmFsaWRhdG9ycygpOiB2b2lkO1xuICBkaXNhYmxlKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBlbmFibGUob3B0cz86IGFueSk6IHZvaWQ7XG4gIGdldChwYXRoOiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogQWJzdHJhY3RDb250cm9sTGlrZSB8IG51bGw7XG4gIGdldEVycm9yKGVycm9yQ29kZTogc3RyaW5nLCBwYXRoPzogKHN0cmluZyB8IG51bWJlcilbXSB8IHN0cmluZyk6IGFueTtcbiAgaGFzRXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogYm9vbGVhbjtcbiAgbWFya0FsbEFzVG91Y2hlZCgpOiB2b2lkO1xuICBtYXJrQXNEaXJ0eShvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzUGVuZGluZyhvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzUHJpc3RpbmUob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1RvdWNoZWQob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1VudG91Y2hlZChvcHRzPzogYW55KTogdm9pZDtcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogT2JqZWN0KTogdm9pZDtcbiAgcmVzZXQodmFsdWU/OiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICBzZXRBc3luY1ZhbGlkYXRvcnMobmV3VmFsaWRhdG9yOiAoY29udHJvbDogYW55KSA9PiBhbnkgfFxuICAgICgoY29udHJvbDogYW55KSA9PiBhbnkpW10gfCBudWxsKTogdm9pZDtcbiAgc2V0RXJyb3JzKGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLCBvcHRzPzogYW55KTogdm9pZDtcbiAgc2V0UGFyZW50KHBhcmVudDogYW55KTogdm9pZDtcbiAgc2V0VmFsaWRhdG9ycyhuZXdWYWxpZGF0b3I6IChjb250cm9sOiBhbnkpID0+IGFueSB8XG4gICAgKChjb250cm9sOiBhbnkpID0+IGFueSlbXSB8IG51bGwpOiB2b2lkO1xuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogT2JqZWN0KTogdm9pZDtcbiAgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRzPzogYW55KTogdm9pZDtcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbiAgcmVzZXQoZm9ybVN0YXRlPzogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IGFueSk6IHZvaWQ7XG59XG4iXX0=