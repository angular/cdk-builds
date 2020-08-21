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
/** Used to generate unique ID for each stepper component. */
let nextId = 0;
/** Change event emitted on selection changes. */
export class StepperSelectionEvent {
}
/** Enum to represent the different states of the steps. */
export const STEP_STATE = {
    NUMBER: 'number',
    EDIT: 'edit',
    DONE: 'done',
    ERROR: 'error'
};
/** InjectionToken that can be used to specify the global stepper options. */
export const STEPPER_GLOBAL_OPTIONS = new InjectionToken('STEPPER_GLOBAL_OPTIONS');
/**
 * InjectionToken that can be used to specify the global stepper options.
 * @deprecated Use `STEPPER_GLOBAL_OPTIONS` instead.
 * @breaking-change 8.0.0.
 */
export const MAT_STEPPER_GLOBAL_OPTIONS = STEPPER_GLOBAL_OPTIONS;
export class CdkStep {
    /** @breaking-change 8.0.0 remove the `?` after `stepperOptions` */
    constructor(_stepper, stepperOptions) {
        this._stepper = _stepper;
        /** Whether user has seen the expanded step content or not. */
        this.interacted = false;
        this._editable = true;
        this._optional = false;
        this._completedOverride = null;
        this._customError = null;
        this._stepperOptions = stepperOptions ? stepperOptions : {};
        this._displayDefaultIndicatorType = this._stepperOptions.displayDefaultIndicatorType !== false;
        this._showError = !!this._stepperOptions.showError;
    }
    /** Whether the user can return to this step once it has been marked as completed. */
    get editable() {
        return this._editable;
    }
    set editable(value) {
        this._editable = coerceBooleanProperty(value);
    }
    /** Whether the completion of step is optional. */
    get optional() {
        return this._optional;
    }
    set optional(value) {
        this._optional = coerceBooleanProperty(value);
    }
    /** Whether step is marked as completed. */
    get completed() {
        return this._completedOverride == null ? this._getDefaultCompleted() : this._completedOverride;
    }
    set completed(value) {
        this._completedOverride = coerceBooleanProperty(value);
    }
    _getDefaultCompleted() {
        return this.stepControl ? this.stepControl.valid && this.interacted : this.interacted;
    }
    /** Whether step has an error. */
    get hasError() {
        return this._customError == null ? this._getDefaultError() : this._customError;
    }
    set hasError(value) {
        this._customError = coerceBooleanProperty(value);
    }
    _getDefaultError() {
        return this.stepControl && this.stepControl.invalid && this.interacted;
    }
    /** Selects this step component. */
    select() {
        this._stepper.selected = this;
    }
    /** Resets the step to its initial state. Note that this includes resetting form data. */
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
            },] }
];
CdkStep.ctorParameters = () => [
    { type: CdkStepper, decorators: [{ type: Inject, args: [forwardRef(() => CdkStepper),] }] },
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
export class CdkStepper {
    constructor(_dir, _changeDetectorRef, 
    // @breaking-change 8.0.0 `_elementRef` and `_document` parameters to become required.
    _elementRef, _document) {
        this._dir = _dir;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        /** Emits when the component is destroyed. */
        this._destroyed = new Subject();
        /** Steps that belong to the current stepper, excluding ones from nested steppers. */
        this.steps = new QueryList();
        this._linear = false;
        this._selectedIndex = 0;
        /** Event emitted when the selected step has changed. */
        this.selectionChange = new EventEmitter();
        this._orientation = 'horizontal';
        this._groupId = nextId++;
        this._document = _document;
    }
    /** Whether the validity of previous steps should be checked or not. */
    get linear() {
        return this._linear;
    }
    set linear(value) {
        this._linear = coerceBooleanProperty(value);
    }
    /** The index of the selected step. */
    get selectedIndex() {
        return this._selectedIndex;
    }
    set selectedIndex(index) {
        const newIndex = coerceNumberProperty(index);
        if (this.steps && this._steps) {
            // Ensure that the index can't be out of bounds.
            if ((newIndex < 0 || newIndex > this.steps.length - 1) &&
                (typeof ngDevMode === 'undefined' || ngDevMode)) {
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
    /** The step that is selected. */
    get selected() {
        // @breaking-change 8.0.0 Change return type to `CdkStep | undefined`.
        return this.steps ? this.steps.toArray()[this.selectedIndex] : undefined;
    }
    set selected(step) {
        this.selectedIndex = this.steps ? this.steps.toArray().indexOf(step) : -1;
    }
    ngAfterContentInit() {
        this._steps.changes
            .pipe(startWith(this._steps), takeUntil(this._destroyed))
            .subscribe((steps) => {
            this.steps.reset(steps.filter(step => step._stepper === this));
            this.steps.notifyOnChanges();
        });
    }
    ngAfterViewInit() {
        // Note that while the step headers are content children by default, any components that
        // extend this one might have them as view children. We initialize the keyboard handling in
        // AfterViewInit so we're guaranteed for both view and content children to be defined.
        this._keyManager = new FocusKeyManager(this._stepHeader)
            .withWrap()
            .withVerticalOrientation(this._orientation === 'vertical');
        (this._dir ? this._dir.change : observableOf())
            .pipe(startWith(this._layoutDirection()), takeUntil(this._destroyed))
            .subscribe(direction => this._keyManager.withHorizontalOrientation(direction));
        this._keyManager.updateActiveItem(this._selectedIndex);
        // No need to `takeUntil` here, because we're the ones destroying `steps`.
        this.steps.changes.subscribe(() => {
            if (!this.selected) {
                this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
            }
        });
    }
    ngOnDestroy() {
        this.steps.destroy();
        this._destroyed.next();
        this._destroyed.complete();
    }
    /** Selects and focuses the next step in list. */
    next() {
        this.selectedIndex = Math.min(this._selectedIndex + 1, this.steps.length - 1);
    }
    /** Selects and focuses the previous step in list. */
    previous() {
        this.selectedIndex = Math.max(this._selectedIndex - 1, 0);
    }
    /** Resets the stepper to its initial state. Note that this includes clearing form data. */
    reset() {
        this._updateSelectedItemIndex(0);
        this.steps.forEach(step => step.reset());
        this._stateChanged();
    }
    /** Returns a unique id for each step label element. */
    _getStepLabelId(i) {
        return `cdk-step-label-${this._groupId}-${i}`;
    }
    /** Returns unique id for each step content element. */
    _getStepContentId(i) {
        return `cdk-step-content-${this._groupId}-${i}`;
    }
    /** Marks the component to be change detected. */
    _stateChanged() {
        this._changeDetectorRef.markForCheck();
    }
    /** Returns position state of the step with the given index. */
    _getAnimationDirection(index) {
        const position = index - this._selectedIndex;
        if (position < 0) {
            return this._layoutDirection() === 'rtl' ? 'next' : 'previous';
        }
        else if (position > 0) {
            return this._layoutDirection() === 'rtl' ? 'previous' : 'next';
        }
        return 'current';
    }
    /** Returns the type of icon to be displayed. */
    _getIndicatorType(index, state = STEP_STATE.NUMBER) {
        const step = this.steps.toArray()[index];
        const isCurrentStep = this._isCurrentStep(index);
        return step._displayDefaultIndicatorType ? this._getDefaultIndicatorLogic(step, isCurrentStep) :
            this._getGuidelineLogic(step, isCurrentStep, state);
    }
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
    _isCurrentStep(index) {
        return this._selectedIndex === index;
    }
    /** Returns the index of the currently-focused step header. */
    _getFocusIndex() {
        return this._keyManager ? this._keyManager.activeItemIndex : this._selectedIndex;
    }
    _updateSelectedItemIndex(newIndex) {
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
    _onKeydown(event) {
        const hasModifier = hasModifierKey(event);
        const keyCode = event.keyCode;
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
    _anyControlsInvalidOrPending(index) {
        const steps = this.steps.toArray();
        steps[this._selectedIndex].interacted = true;
        if (this._linear && index >= 0) {
            return steps.slice(0, index).some(step => {
                const control = step.stepControl;
                const isIncomplete = control ? (control.invalid || control.pending || !step.interacted) : !step.completed;
                return isIncomplete && !step.optional && !step._completedOverride;
            });
        }
        return false;
    }
    _layoutDirection() {
        return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
    }
    /** Checks whether the stepper contains the focused element. */
    _containsFocus() {
        if (!this._document || !this._elementRef) {
            return false;
        }
        const stepperElement = this._elementRef.nativeElement;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFZLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBRXJCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM5RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFlBQVksRUFDWixlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFdBQVcsRUFDWCxTQUFTLEVBQ1QsaUJBQWlCLEdBRWxCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBYSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUUxQyw2REFBNkQ7QUFDN0QsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBV2YsaURBQWlEO0FBQ2pELE1BQU0s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QUFDLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUNoRSxDQUFDO0lBRUQsK0RBQStEO0lBQ3ZELGNBQWM7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3hDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUN0RCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQztRQUNwRCxPQUFPLGNBQWMsS0FBSyxjQUFjLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN0RixDQUFDOzs7WUE3UkYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxjQUFjO2dCQUN4QixRQUFRLEVBQUUsWUFBWTthQUN2Qjs7O1lBL09rQixjQUFjLHVCQWlVMUIsUUFBUTtZQXJUYixpQkFBaUI7WUFLakIsVUFBVTs0Q0FrVDBDLE1BQU0sU0FBQyxRQUFROzs7cUJBckVsRSxlQUFlLFNBQUMsT0FBTyxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQzswQkFVNUMsZUFBZSxTQUFDLGFBQWEsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7cUJBR2xELEtBQUs7NEJBVUwsS0FBSzt1QkF5QkwsS0FBSzs4QkFVTCxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Rm9jdXNhYmxlT3B0aW9uLCBGb2N1c0tleU1hbmFnZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQm9vbGVhbklucHV0LFxuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBOdW1iZXJJbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtFTkQsIEVOVEVSLCBoYXNNb2RpZmllcktleSwgSE9NRSwgU1BBQ0V9IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgZm9yd2FyZFJlZixcbiAgSW5qZWN0LFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBBZnRlckNvbnRlbnRJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtDZGtTdGVwSGVhZGVyfSBmcm9tICcuL3N0ZXAtaGVhZGVyJztcbmltcG9ydCB7Q2RrU3RlcExhYmVsfSBmcm9tICcuL3N0ZXAtbGFiZWwnO1xuXG4vKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSUQgZm9yIGVhY2ggc3RlcHBlciBjb21wb25lbnQuICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBQb3NpdGlvbiBzdGF0ZSBvZiB0aGUgY29udGVudCBvZiBlYWNoIHN0ZXAgaW4gc3RlcHBlciB0aGF0IGlzIHVzZWQgZm9yIHRyYW5zaXRpb25pbmdcbiAqIHRoZSBjb250ZW50IGludG8gY29ycmVjdCBwb3NpdGlvbiB1cG9uIHN0ZXAgc2VsZWN0aW9uIGNoYW5nZS5cbiAqL1xuZXhwb3J0IHR5cGUgU3RlcENvbnRlbnRQb3NpdGlvblN0YXRlID0gJ3ByZXZpb3VzJ3wnY3VycmVudCd8J25leHQnO1xuXG4vKiogUG9zc2libGUgb3JpZW50YXRpb24gb2YgYSBzdGVwcGVyLiAqL1xuZXhwb3J0IHR5cGUgU3RlcHBlck9yaWVudGF0aW9uID0gJ2hvcml6b250YWwnfCd2ZXJ0aWNhbCc7XG5cbi8qKiBDaGFuZ2UgZXZlbnQgZW1pdHRlZCBvbiBzZWxlY3Rpb24gY2hhbmdlcy4gKi9cbmV4cG9ydCBjbGFzcyBTdGVwcGVyU2VsZWN0aW9uRXZlbnQge1xuICAvKiogSW5kZXggb2YgdGhlIHN0ZXAgbm93IHNlbGVjdGVkLiAqL1xuICBzZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIHByZXZpb3VzbHkgc2VsZWN0ZWQuICovXG4gIHByZXZpb3VzbHlTZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBzdGVwIGluc3RhbmNlIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRTdGVwOiBDZGtTdGVwO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBDZGtTdGVwO1xufVxuXG4vKiogVGhlIHN0YXRlIG9mIGVhY2ggc3RlcC4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBTdGF0ZSA9ICdudW1iZXInfCdlZGl0J3wnZG9uZSd8J2Vycm9yJ3xzdHJpbmc7XG5cbi8qKiBFbnVtIHRvIHJlcHJlc2VudCB0aGUgZGlmZmVyZW50IHN0YXRlcyBvZiB0aGUgc3RlcHMuICovXG5leHBvcnQgY29uc3QgU1RFUF9TVEFURSA9IHtcbiAgTlVNQkVSOiAnbnVtYmVyJyxcbiAgRURJVDogJ2VkaXQnLFxuICBET05FOiAnZG9uZScsXG4gIEVSUk9SOiAnZXJyb3InXG59O1xuXG4vKiogSW5qZWN0aW9uVG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5IHRoZSBnbG9iYWwgc3RlcHBlciBvcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBQRVJfR0xPQkFMX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48U3RlcHBlck9wdGlvbnM+KCdTVEVQUEVSX0dMT0JBTF9PUFRJT05TJyk7XG5cbi8qKlxuICogSW5qZWN0aW9uVG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5IHRoZSBnbG9iYWwgc3RlcHBlciBvcHRpb25zLlxuICogQGRlcHJlY2F0ZWQgVXNlIGBTVEVQUEVSX0dMT0JBTF9PUFRJT05TYCBpbnN0ZWFkLlxuICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMC5cbiAqL1xuZXhwb3J0IGNvbnN0IE1BVF9TVEVQUEVSX0dMT0JBTF9PUFRJT05TID0gU1RFUFBFUl9HTE9CQUxfT1BUSU9OUztcblxuLyoqIENvbmZpZ3VyYWJsZSBvcHRpb25zIGZvciBzdGVwcGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdGVwcGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBzdGVwcGVyIHNob3VsZCBkaXNwbGF5IGFuIGVycm9yIHN0YXRlIG9yIG5vdC5cbiAgICogRGVmYXVsdCBiZWhhdmlvciBpcyBhc3N1bWVkIHRvIGJlIGZhbHNlLlxuICAgKi9cbiAgc2hvd0Vycm9yPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RlcHBlciBzaG91bGQgZGlzcGxheSB0aGUgZGVmYXVsdCBpbmRpY2F0b3IgdHlwZVxuICAgKiBvciBub3QuXG4gICAqIERlZmF1bHQgYmVoYXZpb3IgaXMgYXNzdW1lZCB0byBiZSB0cnVlLlxuICAgKi9cbiAgZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlPzogYm9vbGVhbjtcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnY2RrLXN0ZXAnLFxuICBleHBvcnRBczogJ2Nka1N0ZXAnLFxuICB0ZW1wbGF0ZTogJzxuZy10ZW1wbGF0ZT48bmctY29udGVudD48L25nLWNvbnRlbnQ+PC9uZy10ZW1wbGF0ZT4nLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrU3RlcCBpbXBsZW1lbnRzIE9uQ2hhbmdlcyB7XG4gIHByaXZhdGUgX3N0ZXBwZXJPcHRpb25zOiBTdGVwcGVyT3B0aW9ucztcbiAgX3Nob3dFcnJvcjogYm9vbGVhbjtcbiAgX2Rpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZTogYm9vbGVhbjtcblxuICAvKiogVGVtcGxhdGUgZm9yIHN0ZXAgbGFiZWwgaWYgaXQgZXhpc3RzLiAqL1xuICBAQ29udGVudENoaWxkKENka1N0ZXBMYWJlbCkgc3RlcExhYmVsOiBDZGtTdGVwTGFiZWw7XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBzdGVwIGNvbnRlbnQuICovXG4gIEBWaWV3Q2hpbGQoVGVtcGxhdGVSZWYsIHtzdGF0aWM6IHRydWV9KSBjb250ZW50OiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIC8qKiBUaGUgdG9wIGxldmVsIGFic3RyYWN0IGNvbnRyb2wgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIHN0ZXBDb250cm9sOiBBYnN0cmFjdENvbnRyb2xMaWtlO1xuXG4gIC8qKiBXaGV0aGVyIHVzZXIgaGFzIHNlZW4gdGhlIGV4cGFuZGVkIHN0ZXAgY29udGVudCBvciBub3QuICovXG4gIGludGVyYWN0ZWQgPSBmYWxzZTtcblxuICAvKiogUGxhaW4gdGV4dCBsYWJlbCBvZiB0aGUgc3RlcC4gKi9cbiAgQElucHV0KCkgbGFiZWw6IHN0cmluZztcblxuICAvKiogRXJyb3IgbWVzc2FnZSB0byBkaXNwbGF5IHdoZW4gdGhlcmUncyBhbiBlcnJvci4gKi9cbiAgQElucHV0KCkgZXJyb3JNZXNzYWdlOiBzdHJpbmc7XG5cbiAgLyoqIEFyaWEgbGFiZWwgZm9yIHRoZSB0YWIuICovXG4gIEBJbnB1dCgnYXJpYS1sYWJlbCcpIGFyaWFMYWJlbDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgdGhhdCB0aGUgdGFiIGlzIGxhYmVsbGVkIGJ5LlxuICAgKiBXaWxsIGJlIGNsZWFyZWQgaWYgYGFyaWEtbGFiZWxgIGlzIHNldCBhdCB0aGUgc2FtZSB0aW1lLlxuICAgKi9cbiAgQElucHV0KCdhcmlhLWxhYmVsbGVkYnknKSBhcmlhTGFiZWxsZWRieTogc3RyaW5nO1xuXG4gIC8qKiBTdGF0ZSBvZiB0aGUgc3RlcC4gKi9cbiAgQElucHV0KCkgc3RhdGU6IFN0ZXBTdGF0ZTtcblxuICAvKiogV2hldGhlciB0aGUgdXNlciBjYW4gcmV0dXJuIHRvIHRoaXMgc3RlcCBvbmNlIGl0IGhhcyBiZWVuIG1hcmtlZCBhcyBjb21wbGV0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBlZGl0YWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZWRpdGFibGU7XG4gIH1cbiAgc2V0IGVkaXRhYmxlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZWRpdGFibGUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2VkaXRhYmxlID0gdHJ1ZTtcblxuICAvKiogV2hldGhlciB0aGUgY29tcGxldGlvbiBvZiBzdGVwIGlzIG9wdGlvbmFsLiAqL1xuICBASW5wdXQoKVxuICBnZXQgb3B0aW9uYWwoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX29wdGlvbmFsO1xuICB9XG4gIHNldCBvcHRpb25hbCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX29wdGlvbmFsID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9vcHRpb25hbCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHN0ZXAgaXMgbWFya2VkIGFzIGNvbXBsZXRlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNvbXBsZXRlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPT0gbnVsbCA/IHRoaXMuX2dldERlZmF1bHRDb21wbGV0ZWQoKSA6IHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlO1xuICB9XG4gIHNldCBjb21wbGV0ZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgX2NvbXBsZXRlZE92ZXJyaWRlOiBib29sZWFufG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgX2dldERlZmF1bHRDb21wbGV0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcENvbnRyb2wgPyB0aGlzLnN0ZXBDb250cm9sLnZhbGlkICYmIHRoaXMuaW50ZXJhY3RlZCA6IHRoaXMuaW50ZXJhY3RlZDtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHN0ZXAgaGFzIGFuIGVycm9yLiAqL1xuICBASW5wdXQoKVxuICBnZXQgaGFzRXJyb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2N1c3RvbUVycm9yID09IG51bGwgPyB0aGlzLl9nZXREZWZhdWx0RXJyb3IoKSA6IHRoaXMuX2N1c3RvbUVycm9yO1xuICB9XG4gIHNldCBoYXNFcnJvcih2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2N1c3RvbUVycm9yID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9jdXN0b21FcnJvcjogYm9vbGVhbnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9nZXREZWZhdWx0RXJyb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RlcENvbnRyb2wgJiYgdGhpcy5zdGVwQ29udHJvbC5pbnZhbGlkICYmIHRoaXMuaW50ZXJhY3RlZDtcbiAgfVxuXG4gIC8qKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wIHJlbW92ZSB0aGUgYD9gIGFmdGVyIGBzdGVwcGVyT3B0aW9uc2AgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBASW5qZWN0KGZvcndhcmRSZWYoKCkgPT4gQ2RrU3RlcHBlcikpIHB1YmxpYyBfc3RlcHBlcjogQ2RrU3RlcHBlcixcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoU1RFUFBFUl9HTE9CQUxfT1BUSU9OUykgc3RlcHBlck9wdGlvbnM/OiBTdGVwcGVyT3B0aW9ucykge1xuICAgIHRoaXMuX3N0ZXBwZXJPcHRpb25zID0gc3RlcHBlck9wdGlvbnMgPyBzdGVwcGVyT3B0aW9ucyA6IHt9O1xuICAgIHRoaXMuX2Rpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZSA9IHRoaXMuX3N0ZXBwZXJPcHRpb25zLmRpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZSAhPT0gZmFsc2U7XG4gICAgdGhpcy5fc2hvd0Vycm9yID0gISF0aGlzLl9zdGVwcGVyT3B0aW9ucy5zaG93RXJyb3I7XG4gIH1cblxuICAvKiogU2VsZWN0cyB0aGlzIHN0ZXAgY29tcG9uZW50LiAqL1xuICBzZWxlY3QoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RlcHBlci5zZWxlY3RlZCA9IHRoaXM7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdGVwIHRvIGl0cyBpbml0aWFsIHN0YXRlLiBOb3RlIHRoYXQgdGhpcyBpbmNsdWRlcyByZXNldHRpbmcgZm9ybSBkYXRhLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLmludGVyYWN0ZWQgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9jb21wbGV0ZWRPdmVycmlkZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jdXN0b21FcnJvciAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9jdXN0b21FcnJvciA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0ZXBDb250cm9sKSB7XG4gICAgICB0aGlzLnN0ZXBDb250cm9sLnJlc2V0KCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoKSB7XG4gICAgLy8gU2luY2UgYmFzaWNhbGx5IGFsbCBpbnB1dHMgb2YgdGhlIE1hdFN0ZXAgZ2V0IHByb3hpZWQgdGhyb3VnaCB0aGUgdmlldyBkb3duIHRvIHRoZVxuICAgIC8vIHVuZGVybHlpbmcgTWF0U3RlcEhlYWRlciwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgY29ycmVjdGx5LlxuICAgIHRoaXMuX3N0ZXBwZXIuX3N0YXRlQ2hhbmdlZCgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2VkaXRhYmxlOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNFcnJvcjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfb3B0aW9uYWw6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2NvbXBsZXRlZDogQm9vbGVhbklucHV0O1xufVxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrU3RlcHBlcl0nLFxuICBleHBvcnRBczogJ2Nka1N0ZXBwZXInLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtTdGVwcGVyIGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogVXNlZCBmb3IgbWFuYWdpbmcga2V5Ym9hcmQgZm9jdXMuICovXG4gIHByaXZhdGUgX2tleU1hbmFnZXI6IEZvY3VzS2V5TWFuYWdlcjxGb2N1c2FibGVPcHRpb24+O1xuXG4gIC8qKlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wIFJlbW92ZSBgfCB1bmRlZmluZWRgIG9uY2UgdGhlIGBfZG9jdW1lbnRgXG4gICAqIGNvbnN0cnVjdG9yIHBhcmFtIGlzIHJlcXVpcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50fHVuZGVmaW5lZDtcblxuICAvKiogRnVsbCBsaXN0IG9mIHN0ZXBzIGluc2lkZSB0aGUgc3RlcHBlciwgaW5jbHVkaW5nIGluc2lkZSBuZXN0ZWQgc3RlcHBlcnMuICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrU3RlcCwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX3N0ZXBzOiBRdWVyeUxpc3Q8Q2RrU3RlcD47XG5cbiAgLyoqIFN0ZXBzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50IHN0ZXBwZXIsIGV4Y2x1ZGluZyBvbmVzIGZyb20gbmVzdGVkIHN0ZXBwZXJzLiAqL1xuICByZWFkb25seSBzdGVwczogUXVlcnlMaXN0PENka1N0ZXA+ID0gbmV3IFF1ZXJ5TGlzdDxDZGtTdGVwPigpO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBzdGVwIGhlYWRlcnMgb2YgdGhlIHN0ZXBzIGluIHRoZSBzdGVwcGVyLlxuICAgKiBAZGVwcmVjYXRlZCBUeXBlIHRvIGJlIGNoYW5nZWQgdG8gYFF1ZXJ5TGlzdDxDZGtTdGVwSGVhZGVyPmAuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjBcbiAgICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrU3RlcEhlYWRlciwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX3N0ZXBIZWFkZXI6IFF1ZXJ5TGlzdDxGb2N1c2FibGVPcHRpb24+O1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB2YWxpZGl0eSBvZiBwcmV2aW91cyBzdGVwcyBzaG91bGQgYmUgY2hlY2tlZCBvciBub3QuICovXG4gIEBJbnB1dCgpXG4gIGdldCBsaW5lYXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpbmVhcjtcbiAgfVxuICBzZXQgbGluZWFyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fbGluZWFyID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9saW5lYXIgPSBmYWxzZTtcblxuICAvKiogVGhlIGluZGV4IG9mIHRoZSBzZWxlY3RlZCBzdGVwLiAqL1xuICBASW5wdXQoKVxuICBnZXQgc2VsZWN0ZWRJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgfVxuICBzZXQgc2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eShpbmRleCk7XG5cbiAgICBpZiAodGhpcy5zdGVwcyAmJiB0aGlzLl9zdGVwcykge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGluZGV4IGNhbid0IGJlIG91dCBvZiBib3VuZHMuXG4gICAgICBpZiAoKG5ld0luZGV4IDwgMCB8fCBuZXdJbmRleCA+IHRoaXMuc3RlcHMubGVuZ3RoIC0gMSkgJiZcbiAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2Nka1N0ZXBwZXI6IENhbm5vdCBhc3NpZ24gb3V0LW9mLWJvdW5kcyB2YWx1ZSB0byBgc2VsZWN0ZWRJbmRleGAuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ICE9IG5ld0luZGV4ICYmICF0aGlzLl9hbnlDb250cm9sc0ludmFsaWRPclBlbmRpbmcobmV3SW5kZXgpICYmXG4gICAgICAgICAgKG5ld0luZGV4ID49IHRoaXMuX3NlbGVjdGVkSW5kZXggfHwgdGhpcy5zdGVwcy50b0FycmF5KClbbmV3SW5kZXhdLmVkaXRhYmxlKSkge1xuICAgICAgICB0aGlzLl91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChpbmRleCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleCA9IDA7XG5cbiAgLyoqIFRoZSBzdGVwIHRoYXQgaXMgc2VsZWN0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZCgpOiBDZGtTdGVwIHtcbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIENoYW5nZSByZXR1cm4gdHlwZSB0byBgQ2RrU3RlcCB8IHVuZGVmaW5lZGAuXG4gICAgcmV0dXJuIHRoaXMuc3RlcHMgPyB0aGlzLnN0ZXBzLnRvQXJyYXkoKVt0aGlzLnNlbGVjdGVkSW5kZXhdIDogdW5kZWZpbmVkITtcbiAgfVxuICBzZXQgc2VsZWN0ZWQoc3RlcDogQ2RrU3RlcCkge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuc3RlcHMgPyB0aGlzLnN0ZXBzLnRvQXJyYXkoKS5pbmRleE9mKHN0ZXApIDogLTE7XG4gIH1cblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBzZWxlY3RlZCBzdGVwIGhhcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KClcbiAgc2VsZWN0aW9uQ2hhbmdlOiBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PigpO1xuXG4gIC8qKiBVc2VkIHRvIHRyYWNrIHVuaXF1ZSBJRCBmb3IgZWFjaCBzdGVwcGVyIGNvbXBvbmVudC4gKi9cbiAgX2dyb3VwSWQ6IG51bWJlcjtcblxuICBwcm90ZWN0ZWQgX29yaWVudGF0aW9uOiBTdGVwcGVyT3JpZW50YXRpb24gPSAnaG9yaXpvbnRhbCc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIGBfZWxlbWVudFJlZmAgYW5kIGBfZG9jdW1lbnRgIHBhcmFtZXRlcnMgdG8gYmVjb21lIHJlcXVpcmVkLlxuICAgICAgcHJpdmF0ZSBfZWxlbWVudFJlZj86IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LCBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ/OiBhbnkpIHtcbiAgICB0aGlzLl9ncm91cElkID0gbmV4dElkKys7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5fc3RlcHMuY2hhbmdlc1xuICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX3N0ZXBzKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKChzdGVwczogUXVlcnlMaXN0PENka1N0ZXA+KSA9PiB7XG4gICAgICAgIHRoaXMuc3RlcHMucmVzZXQoc3RlcHMuZmlsdGVyKHN0ZXAgPT4gc3RlcC5fc3RlcHBlciA9PT0gdGhpcykpO1xuICAgICAgICB0aGlzLnN0ZXBzLm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgICAgfSk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gTm90ZSB0aGF0IHdoaWxlIHRoZSBzdGVwIGhlYWRlcnMgYXJlIGNvbnRlbnQgY2hpbGRyZW4gYnkgZGVmYXVsdCwgYW55IGNvbXBvbmVudHMgdGhhdFxuICAgIC8vIGV4dGVuZCB0aGlzIG9uZSBtaWdodCBoYXZlIHRoZW0gYXMgdmlldyBjaGlsZHJlbi4gV2UgaW5pdGlhbGl6ZSB0aGUga2V5Ym9hcmQgaGFuZGxpbmcgaW5cbiAgICAvLyBBZnRlclZpZXdJbml0IHNvIHdlJ3JlIGd1YXJhbnRlZWQgZm9yIGJvdGggdmlldyBhbmQgY29udGVudCBjaGlsZHJlbiB0byBiZSBkZWZpbmVkLlxuICAgIHRoaXMuX2tleU1hbmFnZXIgPSBuZXcgRm9jdXNLZXlNYW5hZ2VyPEZvY3VzYWJsZU9wdGlvbj4odGhpcy5fc3RlcEhlYWRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aXRoV3JhcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAud2l0aFZlcnRpY2FsT3JpZW50YXRpb24odGhpcy5fb3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpO1xuXG4gICAgKHRoaXMuX2RpciA/ICh0aGlzLl9kaXIuY2hhbmdlIGFzIE9ic2VydmFibGU8RGlyZWN0aW9uPikgOiBvYnNlcnZhYmxlT2Y8RGlyZWN0aW9uPigpKVxuICAgICAgICAucGlwZShzdGFydFdpdGgodGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZShkaXJlY3Rpb24gPT4gdGhpcy5fa2V5TWFuYWdlci53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKGRpcmVjdGlvbikpO1xuXG4gICAgdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKHRoaXMuX3NlbGVjdGVkSW5kZXgpO1xuXG4gICAgLy8gTm8gbmVlZCB0byBgdGFrZVVudGlsYCBoZXJlLCBiZWNhdXNlIHdlJ3JlIHRoZSBvbmVzIGRlc3Ryb3lpbmcgYHN0ZXBzYC5cbiAgICB0aGlzLnN0ZXBzLmNoYW5nZXMuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gTWF0aC5tYXgodGhpcy5fc2VsZWN0ZWRJbmRleCAtIDEsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdGVwcy5kZXN0cm95KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIGFuZCBmb2N1c2VzIHRoZSBuZXh0IHN0ZXAgaW4gbGlzdC4gKi9cbiAgbmV4dCgpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBNYXRoLm1pbih0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSwgdGhpcy5zdGVwcy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIGFuZCBmb2N1c2VzIHRoZSBwcmV2aW91cyBzdGVwIGluIGxpc3QuICovXG4gIHByZXZpb3VzKCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxLCAwKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXBwZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIGNsZWFyaW5nIGZvcm0gZGF0YS4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRJdGVtSW5kZXgoMCk7XG4gICAgdGhpcy5zdGVwcy5mb3JFYWNoKHN0ZXAgPT4gc3RlcC5yZXNldCgpKTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgdW5pcXVlIGlkIGZvciBlYWNoIHN0ZXAgbGFiZWwgZWxlbWVudC4gKi9cbiAgX2dldFN0ZXBMYWJlbElkKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBjZGstc3RlcC1sYWJlbC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdW5pcXVlIGlkIGZvciBlYWNoIHN0ZXAgY29udGVudCBlbGVtZW50LiAqL1xuICBfZ2V0U3RlcENvbnRlbnRJZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgY2RrLXN0ZXAtY29udGVudC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIE1hcmtzIHRoZSBjb21wb25lbnQgdG8gYmUgY2hhbmdlIGRldGVjdGVkLiAqL1xuICBfc3RhdGVDaGFuZ2VkKCkge1xuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgcG9zaXRpb24gc3RhdGUgb2YgdGhlIHN0ZXAgd2l0aCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIF9nZXRBbmltYXRpb25EaXJlY3Rpb24oaW5kZXg6IG51bWJlcik6IFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSBpbmRleCAtIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xheW91dERpcmVjdGlvbigpID09PSAncnRsJyA/ICduZXh0JyA6ICdwcmV2aW91cyc7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXlvdXREaXJlY3Rpb24oKSA9PT0gJ3J0bCcgPyAncHJldmlvdXMnIDogJ25leHQnO1xuICAgIH1cbiAgICByZXR1cm4gJ2N1cnJlbnQnO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHR5cGUgb2YgaWNvbiB0byBiZSBkaXNwbGF5ZWQuICovXG4gIF9nZXRJbmRpY2F0b3JUeXBlKGluZGV4OiBudW1iZXIsIHN0YXRlOiBTdGVwU3RhdGUgPSBTVEVQX1NUQVRFLk5VTUJFUik6IFN0ZXBTdGF0ZSB7XG4gICAgY29uc3Qgc3RlcCA9IHRoaXMuc3RlcHMudG9BcnJheSgpW2luZGV4XTtcbiAgICBjb25zdCBpc0N1cnJlbnRTdGVwID0gdGhpcy5faXNDdXJyZW50U3RlcChpbmRleCk7XG5cbiAgICByZXR1cm4gc3RlcC5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID8gdGhpcy5fZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0R3VpZGVsaW5lTG9naWMoc3RlcCwgaXNDdXJyZW50U3RlcCwgc3RhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXA6IENka1N0ZXAsIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4pOiBTdGVwU3RhdGUge1xuICAgIGlmIChzdGVwLl9zaG93RXJyb3IgJiYgc3RlcC5oYXNFcnJvciAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRVJST1I7XG4gICAgfSBlbHNlIGlmICghc3RlcC5jb21wbGV0ZWQgfHwgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuTlVNQkVSO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RlcC5lZGl0YWJsZSA/IFNURVBfU1RBVEUuRURJVCA6IFNURVBfU1RBVEUuRE9ORTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRHdWlkZWxpbmVMb2dpYyhcbiAgICAgIHN0ZXA6IENka1N0ZXAsIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4sIHN0YXRlOiBTdGVwU3RhdGUgPSBTVEVQX1NUQVRFLk5VTUJFUik6IFN0ZXBTdGF0ZSB7XG4gICAgaWYgKHN0ZXAuX3Nob3dFcnJvciAmJiBzdGVwLmhhc0Vycm9yICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FUlJPUjtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuY29tcGxldGVkICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5ET05FO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5jb21wbGV0ZWQgJiYgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5lZGl0YWJsZSAmJiBpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FRElUO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaXNDdXJyZW50U3RlcChpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IGluZGV4O1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50bHktZm9jdXNlZCBzdGVwIGhlYWRlci4gKi9cbiAgX2dldEZvY3VzSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleU1hbmFnZXIgPyB0aGlzLl9rZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCA6IHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChuZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RlcHNBcnJheSA9IHRoaXMuc3RlcHMudG9BcnJheSgpO1xuICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQoe1xuICAgICAgc2VsZWN0ZWRJbmRleDogbmV3SW5kZXgsXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogdGhpcy5fc2VsZWN0ZWRJbmRleCxcbiAgICAgIHNlbGVjdGVkU3RlcDogc3RlcHNBcnJheVtuZXdJbmRleF0sXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBzdGVwc0FycmF5W3RoaXMuX3NlbGVjdGVkSW5kZXhdLFxuICAgIH0pO1xuXG4gICAgLy8gSWYgZm9jdXMgaXMgaW5zaWRlIHRoZSBzdGVwcGVyLCBtb3ZlIGl0IHRvIHRoZSBuZXh0IGhlYWRlciwgb3RoZXJ3aXNlIGl0IG1heSBiZWNvbWVcbiAgICAvLyBsb3N0IHdoZW4gdGhlIGFjdGl2ZSBzdGVwIGNvbnRlbnQgaXMgaGlkZGVuLiBXZSBjYW4ndCBiZSBtb3JlIGdyYW51bGFyIHdpdGggdGhlIGNoZWNrXG4gICAgLy8gKGUuZy4gY2hlY2tpbmcgd2hldGhlciBmb2N1cyBpcyBpbnNpZGUgdGhlIGFjdGl2ZSBzdGVwKSwgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGFcbiAgICAvLyByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnRzIHRoYXQgYXJlIHJlbmRlcmluZyBvdXQgdGhlIGNvbnRlbnQuXG4gICAgdGhpcy5fY29udGFpbnNGb2N1cygpID8gdGhpcy5fa2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKG5ld0luZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKG5ld0luZGV4KTtcblxuICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIF9vbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBoYXNNb2RpZmllciA9IGhhc01vZGlmaWVyS2V5KGV2ZW50KTtcbiAgICBjb25zdCBrZXlDb2RlID0gZXZlbnQua2V5Q29kZTtcbiAgICBjb25zdCBtYW5hZ2VyID0gdGhpcy5fa2V5TWFuYWdlcjtcblxuICAgIGlmIChtYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCAhPSBudWxsICYmICFoYXNNb2RpZmllciAmJlxuICAgICAgICAoa2V5Q29kZSA9PT0gU1BBQ0UgfHwga2V5Q29kZSA9PT0gRU5URVIpKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBtYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleDtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSBIT01FKSB7XG4gICAgICBtYW5hZ2VyLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IEVORCkge1xuICAgICAgbWFuYWdlci5zZXRMYXN0SXRlbUFjdGl2ZSgpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWFuYWdlci5vbktleWRvd24oZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FueUNvbnRyb2xzSW52YWxpZE9yUGVuZGluZyhpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3RlcHMgPSB0aGlzLnN0ZXBzLnRvQXJyYXkoKTtcblxuICAgIHN0ZXBzW3RoaXMuX3NlbGVjdGVkSW5kZXhdLmludGVyYWN0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuX2xpbmVhciAmJiBpbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gc3RlcHMuc2xpY2UoMCwgaW5kZXgpLnNvbWUoc3RlcCA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBzdGVwLnN0ZXBDb250cm9sO1xuICAgICAgICBjb25zdCBpc0luY29tcGxldGUgPVxuICAgICAgICAgICAgY29udHJvbCA/IChjb250cm9sLmludmFsaWQgfHwgY29udHJvbC5wZW5kaW5nIHx8ICFzdGVwLmludGVyYWN0ZWQpIDogIXN0ZXAuY29tcGxldGVkO1xuICAgICAgICByZXR1cm4gaXNJbmNvbXBsZXRlICYmICFzdGVwLm9wdGlvbmFsICYmICFzdGVwLl9jb21wbGV0ZWRPdmVycmlkZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX2xheW91dERpcmVjdGlvbigpOiBEaXJlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJyA/ICdydGwnIDogJ2x0cic7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIHN0ZXBwZXIgY29udGFpbnMgdGhlIGZvY3VzZWQgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY29udGFpbnNGb2N1cygpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX2RvY3VtZW50IHx8ICF0aGlzLl9lbGVtZW50UmVmKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RlcHBlckVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgZm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIHJldHVybiBzdGVwcGVyRWxlbWVudCA9PT0gZm9jdXNlZEVsZW1lbnQgfHwgc3RlcHBlckVsZW1lbnQuY29udGFpbnMoZm9jdXNlZEVsZW1lbnQpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2VkaXRhYmxlOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9vcHRpb25hbDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfY29tcGxldGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNFcnJvcjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbGluZWFyOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9zZWxlY3RlZEluZGV4OiBOdW1iZXJJbnB1dDtcbn1cblxuXG4vKipcbiAqIFNpbXBsaWZpZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gXCJBYnN0cmFjdENvbnRyb2xcIiBmcm9tIEBhbmd1bGFyL2Zvcm1zLlxuICogVXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gYnJpbmcgaW4gQGFuZ3VsYXIvZm9ybXMgZm9yIGEgc2luZ2xlIG9wdGlvbmFsIGludGVyZmFjZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIEFic3RyYWN0Q29udHJvbExpa2Uge1xuICBhc3luY1ZhbGlkYXRvcjogKChjb250cm9sOiBhbnkpID0+IGFueSkgfCBudWxsO1xuICBkaXJ0eTogYm9vbGVhbjtcbiAgZGlzYWJsZWQ6IGJvb2xlYW47XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsO1xuICBpbnZhbGlkOiBib29sZWFuO1xuICBwYXJlbnQ6IGFueTtcbiAgcGVuZGluZzogYm9vbGVhbjtcbiAgcHJpc3RpbmU6IGJvb2xlYW47XG4gIHJvb3Q6IEFic3RyYWN0Q29udHJvbExpa2U7XG4gIHN0YXR1czogc3RyaW5nO1xuICBzdGF0dXNDaGFuZ2VzOiBPYnNlcnZhYmxlPGFueT47XG4gIHRvdWNoZWQ6IGJvb2xlYW47XG4gIHVudG91Y2hlZDogYm9vbGVhbjtcbiAgdXBkYXRlT246IGFueTtcbiAgdmFsaWQ6IGJvb2xlYW47XG4gIHZhbGlkYXRvcjogKChjb250cm9sOiBhbnkpID0+IGFueSkgfCBudWxsO1xuICB2YWx1ZTogYW55O1xuICB2YWx1ZUNoYW5nZXM6IE9ic2VydmFibGU8YW55PjtcbiAgY2xlYXJBc3luY1ZhbGlkYXRvcnMoKTogdm9pZDtcbiAgY2xlYXJWYWxpZGF0b3JzKCk6IHZvaWQ7XG4gIGRpc2FibGUob3B0cz86IGFueSk6IHZvaWQ7XG4gIGVuYWJsZShvcHRzPzogYW55KTogdm9pZDtcbiAgZ2V0KHBhdGg6IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBBYnN0cmFjdENvbnRyb2xMaWtlIHwgbnVsbDtcbiAgZ2V0RXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogYW55O1xuICBoYXNFcnJvcihlcnJvckNvZGU6IHN0cmluZywgcGF0aD86IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBib29sZWFuO1xuICBtYXJrQWxsQXNUb3VjaGVkKCk6IHZvaWQ7XG4gIG1hcmtBc0RpcnR5KG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNQZW5kaW5nKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNQcmlzdGluZShvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzVG91Y2hlZChvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzVW50b3VjaGVkKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICByZXNldCh2YWx1ZT86IGFueSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG4gIHNldEFzeW5jVmFsaWRhdG9ycyhuZXdWYWxpZGF0b3I6IChjb250cm9sOiBhbnkpID0+IGFueSB8XG4gICAgKChjb250cm9sOiBhbnkpID0+IGFueSlbXSB8IG51bGwpOiB2b2lkO1xuICBzZXRFcnJvcnMoZXJyb3JzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsIG9wdHM/OiBhbnkpOiB2b2lkO1xuICBzZXRQYXJlbnQocGFyZW50OiBhbnkpOiB2b2lkO1xuICBzZXRWYWxpZGF0b3JzKG5ld1ZhbGlkYXRvcjogKGNvbnRyb2w6IGFueSkgPT4gYW55IHxcbiAgICAoKGNvbnRyb2w6IGFueSkgPT4gYW55KVtdIHwgbnVsbCk6IHZvaWQ7XG4gIHNldFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICB1cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdHM/OiBhbnkpOiB2b2lkO1xuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xuICByZXNldChmb3JtU3RhdGU/OiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbn1cbiJdfQ==