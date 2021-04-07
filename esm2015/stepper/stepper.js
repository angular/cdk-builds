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
import { ENTER, hasModifierKey, SPACE } from '@angular/cdk/keycodes';
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
export class CdkStep {
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
    constructor(_dir, _changeDetectorRef, _elementRef, _document) {
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
        /**
         * @deprecated To be turned into a private property. Use `orientation` instead.
         * @breaking-change 13.0.0
         */
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
            if (!this._isValidIndex(index) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw Error('cdkStepper: Cannot assign out-of-bounds value to `selectedIndex`.');
            }
            const selectedStep = this.selected;
            if (selectedStep) {
                // TODO: this should really be called something like `visited` instead. Just because
                // the user has seen the step doesn't guarantee that they've interacted with it.
                selectedStep.interacted = true;
            }
            if (this._selectedIndex !== newIndex && !this._anyControlsInvalidOrPending(newIndex) &&
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
        return this.steps ? this.steps.toArray()[this.selectedIndex] : undefined;
    }
    set selected(step) {
        this.selectedIndex = (step && this.steps) ? this.steps.toArray().indexOf(step) : -1;
    }
    /** Orientation of the stepper. */
    get orientation() { return this._orientation; }
    set orientation(value) {
        // This is a protected method so that `MatSteppter` can hook into it.
        this._orientation = value;
        if (this._keyManager) {
            this._keyManager.withVerticalOrientation(value === 'vertical');
        }
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
            .withHomeAndEnd()
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
        // The logic which asserts that the selected index is within bounds doesn't run before the
        // steps are initialized, because we don't how many steps there are yet so we may have an
        // invalid index on init. If that's the case, auto-correct to the default so we don't throw.
        if (!this._isValidIndex(this._selectedIndex)) {
            this._selectedIndex = 0;
        }
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
        else {
            manager.onKeydown(event);
        }
    }
    _anyControlsInvalidOrPending(index) {
        if (this._linear && index >= 0) {
            return this.steps.toArray().slice(0, index).some(step => {
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
        const stepperElement = this._elementRef.nativeElement;
        const focusedElement = this._document.activeElement;
        return stepperElement === focusedElement || stepperElement.contains(focusedElement);
    }
    /** Checks whether the passed-in index is a valid step index. */
    _isValidIndex(index) {
        return index > -1 && (!this.steps || index < this.steps.length);
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
    selectionChange: [{ type: Output }],
    orientation: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFZLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBRXJCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbkUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFHTCxRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxXQUFXLEVBQ1gsU0FBUyxFQUNULGlCQUFpQixHQUVsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVwRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFMUMsNkRBQTZEO0FBQzdELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQVdmLGlEQUFpRDtBQUNqRCxNQUFNLE9BQU8scUJBQXFCO0NBWWpDO0FB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bGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Rm9jdXNhYmxlT3B0aW9uLCBGb2N1c0tleU1hbmFnZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQm9vbGVhbklucHV0LFxuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBOdW1iZXJJbnB1dFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtFTlRFUiwgaGFzTW9kaWZpZXJLZXksIFNQQUNFfSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q2RrU3RlcEhlYWRlcn0gZnJvbSAnLi9zdGVwLWhlYWRlcic7XG5pbXBvcnQge0Nka1N0ZXBMYWJlbH0gZnJvbSAnLi9zdGVwLWxhYmVsJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIHN0ZXBwZXIgY29tcG9uZW50LiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogUG9zaXRpb24gc3RhdGUgb2YgdGhlIGNvbnRlbnQgb2YgZWFjaCBzdGVwIGluIHN0ZXBwZXIgdGhhdCBpcyB1c2VkIGZvciB0cmFuc2l0aW9uaW5nXG4gKiB0aGUgY29udGVudCBpbnRvIGNvcnJlY3QgcG9zaXRpb24gdXBvbiBzdGVwIHNlbGVjdGlvbiBjaGFuZ2UuXG4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSA9ICdwcmV2aW91cyd8J2N1cnJlbnQnfCduZXh0JztcblxuLyoqIFBvc3NpYmxlIG9yaWVudGF0aW9uIG9mIGEgc3RlcHBlci4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBwZXJPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJ3wndmVydGljYWwnO1xuXG4vKiogQ2hhbmdlIGV2ZW50IGVtaXR0ZWQgb24gc2VsZWN0aW9uIGNoYW5nZXMuICovXG5leHBvcnQgY2xhc3MgU3RlcHBlclNlbGVjdGlvbkV2ZW50IHtcbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgc3RlcCBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBub3cgc2VsZWN0ZWQuICovXG4gIHNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcblxuICAvKiogVGhlIHN0ZXAgaW5zdGFuY2UgcHJldmlvdXNseSBzZWxlY3RlZC4gKi9cbiAgcHJldmlvdXNseVNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcbn1cblxuLyoqIFRoZSBzdGF0ZSBvZiBlYWNoIHN0ZXAuICovXG5leHBvcnQgdHlwZSBTdGVwU3RhdGUgPSAnbnVtYmVyJ3wnZWRpdCd8J2RvbmUnfCdlcnJvcid8c3RyaW5nO1xuXG4vKiogRW51bSB0byByZXByZXNlbnQgdGhlIGRpZmZlcmVudCBzdGF0ZXMgb2YgdGhlIHN0ZXBzLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBfU1RBVEUgPSB7XG4gIE5VTUJFUjogJ251bWJlcicsXG4gIEVESVQ6ICdlZGl0JyxcbiAgRE9ORTogJ2RvbmUnLFxuICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuLyoqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBTVEVQUEVSX0dMT0JBTF9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPFN0ZXBwZXJPcHRpb25zPignU1RFUFBFUl9HTE9CQUxfT1BUSU9OUycpO1xuXG4vKiogQ29uZmlndXJhYmxlIG9wdGlvbnMgZm9yIHN0ZXBwZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0ZXBwZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0ZXBwZXIgc2hvdWxkIGRpc3BsYXkgYW4gZXJyb3Igc3RhdGUgb3Igbm90LlxuICAgKiBEZWZhdWx0IGJlaGF2aW9yIGlzIGFzc3VtZWQgdG8gYmUgZmFsc2UuXG4gICAqL1xuICBzaG93RXJyb3I/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBzdGVwcGVyIHNob3VsZCBkaXNwbGF5IHRoZSBkZWZhdWx0IGluZGljYXRvciB0eXBlXG4gICAqIG9yIG5vdC5cbiAgICogRGVmYXVsdCBiZWhhdmlvciBpcyBhc3N1bWVkIHRvIGJlIHRydWUuXG4gICAqL1xuICBkaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGU/OiBib29sZWFuO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdjZGstc3RlcCcsXG4gIGV4cG9ydEFzOiAnY2RrU3RlcCcsXG4gIHRlbXBsYXRlOiAnPG5nLXRlbXBsYXRlPjxuZy1jb250ZW50PjwvbmctY29udGVudD48L25nLXRlbXBsYXRlPicsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtTdGVwIGltcGxlbWVudHMgT25DaGFuZ2VzIHtcbiAgcHJpdmF0ZSBfc3RlcHBlck9wdGlvbnM6IFN0ZXBwZXJPcHRpb25zO1xuICBfc2hvd0Vycm9yOiBib29sZWFuO1xuICBfZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlOiBib29sZWFuO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3Igc3RlcCBsYWJlbCBpZiBpdCBleGlzdHMuICovXG4gIEBDb250ZW50Q2hpbGQoQ2RrU3RlcExhYmVsKSBzdGVwTGFiZWw6IENka1N0ZXBMYWJlbDtcblxuICAvKiogVGVtcGxhdGUgZm9yIHN0ZXAgY29udGVudC4gKi9cbiAgQFZpZXdDaGlsZChUZW1wbGF0ZVJlZiwge3N0YXRpYzogdHJ1ZX0pIGNvbnRlbnQ6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgLyoqIFRoZSB0b3AgbGV2ZWwgYWJzdHJhY3QgY29udHJvbCBvZiB0aGUgc3RlcC4gKi9cbiAgQElucHV0KCkgc3RlcENvbnRyb2w6IEFic3RyYWN0Q29udHJvbExpa2U7XG5cbiAgLyoqIFdoZXRoZXIgdXNlciBoYXMgc2VlbiB0aGUgZXhwYW5kZWQgc3RlcCBjb250ZW50IG9yIG5vdC4gKi9cbiAgaW50ZXJhY3RlZCA9IGZhbHNlO1xuXG4gIC8qKiBQbGFpbiB0ZXh0IGxhYmVsIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBsYWJlbDogc3RyaW5nO1xuXG4gIC8qKiBFcnJvciBtZXNzYWdlIHRvIGRpc3BsYXkgd2hlbiB0aGVyZSdzIGFuIGVycm9yLiAqL1xuICBASW5wdXQoKSBlcnJvck1lc3NhZ2U6IHN0cmluZztcblxuICAvKiogQXJpYSBsYWJlbCBmb3IgdGhlIHRhYi4gKi9cbiAgQElucHV0KCdhcmlhLWxhYmVsJykgYXJpYUxhYmVsOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCB0aGF0IHRoZSB0YWIgaXMgbGFiZWxsZWQgYnkuXG4gICAqIFdpbGwgYmUgY2xlYXJlZCBpZiBgYXJpYS1sYWJlbGAgaXMgc2V0IGF0IHRoZSBzYW1lIHRpbWUuXG4gICAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWxsZWRieScpIGFyaWFMYWJlbGxlZGJ5OiBzdHJpbmc7XG5cbiAgLyoqIFN0YXRlIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBzdGF0ZTogU3RlcFN0YXRlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIGNhbiByZXR1cm4gdG8gdGhpcyBzdGVwIG9uY2UgaXQgaGFzIGJlZW4gbWFya2VkIGFzIGNvbXBsZXRlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGVkaXRhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9lZGl0YWJsZTtcbiAgfVxuICBzZXQgZWRpdGFibGUodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9lZGl0YWJsZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZWRpdGFibGUgPSB0cnVlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjb21wbGV0aW9uIG9mIHN0ZXAgaXMgb3B0aW9uYWwuICovXG4gIEBJbnB1dCgpXG4gIGdldCBvcHRpb25hbCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fb3B0aW9uYWw7XG4gIH1cbiAgc2V0IG9wdGlvbmFsKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fb3B0aW9uYWwgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX29wdGlvbmFsID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgc3RlcCBpcyBtYXJrZWQgYXMgY29tcGxldGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgY29tcGxldGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZSA9PSBudWxsID8gdGhpcy5fZ2V0RGVmYXVsdENvbXBsZXRlZCgpIDogdGhpcy5fY29tcGxldGVkT3ZlcnJpZGU7XG4gIH1cbiAgc2V0IGNvbXBsZXRlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBfY29tcGxldGVkT3ZlcnJpZGU6IGJvb2xlYW58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdENvbXBsZXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwQ29udHJvbCA/IHRoaXMuc3RlcENvbnRyb2wudmFsaWQgJiYgdGhpcy5pbnRlcmFjdGVkIDogdGhpcy5pbnRlcmFjdGVkO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgc3RlcCBoYXMgYW4gZXJyb3IuICovXG4gIEBJbnB1dCgpXG4gIGdldCBoYXNFcnJvcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY3VzdG9tRXJyb3IgPT0gbnVsbCA/IHRoaXMuX2dldERlZmF1bHRFcnJvcigpIDogdGhpcy5fY3VzdG9tRXJyb3I7XG4gIH1cbiAgc2V0IGhhc0Vycm9yKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fY3VzdG9tRXJyb3IgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2N1c3RvbUVycm9yOiBib29sZWFufG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgX2dldERlZmF1bHRFcnJvcigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwQ29udHJvbCAmJiB0aGlzLnN0ZXBDb250cm9sLmludmFsaWQgJiYgdGhpcy5pbnRlcmFjdGVkO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBASW5qZWN0KGZvcndhcmRSZWYoKCkgPT4gQ2RrU3RlcHBlcikpIHB1YmxpYyBfc3RlcHBlcjogQ2RrU3RlcHBlcixcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoU1RFUFBFUl9HTE9CQUxfT1BUSU9OUykgc3RlcHBlck9wdGlvbnM/OiBTdGVwcGVyT3B0aW9ucykge1xuICAgIHRoaXMuX3N0ZXBwZXJPcHRpb25zID0gc3RlcHBlck9wdGlvbnMgPyBzdGVwcGVyT3B0aW9ucyA6IHt9O1xuICAgIHRoaXMuX2Rpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZSA9IHRoaXMuX3N0ZXBwZXJPcHRpb25zLmRpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZSAhPT0gZmFsc2U7XG4gICAgdGhpcy5fc2hvd0Vycm9yID0gISF0aGlzLl9zdGVwcGVyT3B0aW9ucy5zaG93RXJyb3I7XG4gIH1cblxuICAvKiogU2VsZWN0cyB0aGlzIHN0ZXAgY29tcG9uZW50LiAqL1xuICBzZWxlY3QoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RlcHBlci5zZWxlY3RlZCA9IHRoaXM7XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSBzdGVwIHRvIGl0cyBpbml0aWFsIHN0YXRlLiBOb3RlIHRoYXQgdGhpcyBpbmNsdWRlcyByZXNldHRpbmcgZm9ybSBkYXRhLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLmludGVyYWN0ZWQgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9jb21wbGV0ZWRPdmVycmlkZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jdXN0b21FcnJvciAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9jdXN0b21FcnJvciA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0ZXBDb250cm9sKSB7XG4gICAgICB0aGlzLnN0ZXBDb250cm9sLnJlc2V0KCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoKSB7XG4gICAgLy8gU2luY2UgYmFzaWNhbGx5IGFsbCBpbnB1dHMgb2YgdGhlIE1hdFN0ZXAgZ2V0IHByb3hpZWQgdGhyb3VnaCB0aGUgdmlldyBkb3duIHRvIHRoZVxuICAgIC8vIHVuZGVybHlpbmcgTWF0U3RlcEhlYWRlciwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgY29ycmVjdGx5LlxuICAgIHRoaXMuX3N0ZXBwZXIuX3N0YXRlQ2hhbmdlZCgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2VkaXRhYmxlOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNFcnJvcjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfb3B0aW9uYWw6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2NvbXBsZXRlZDogQm9vbGVhbklucHV0O1xufVxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrU3RlcHBlcl0nLFxuICBleHBvcnRBczogJ2Nka1N0ZXBwZXInLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtTdGVwcGVyIGltcGxlbWVudHMgQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogVXNlZCBmb3IgbWFuYWdpbmcga2V5Ym9hcmQgZm9jdXMuICovXG4gIHByaXZhdGUgX2tleU1hbmFnZXI6IEZvY3VzS2V5TWFuYWdlcjxGb2N1c2FibGVPcHRpb24+O1xuXG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICAvKiogRnVsbCBsaXN0IG9mIHN0ZXBzIGluc2lkZSB0aGUgc3RlcHBlciwgaW5jbHVkaW5nIGluc2lkZSBuZXN0ZWQgc3RlcHBlcnMuICovXG4gIEBDb250ZW50Q2hpbGRyZW4oQ2RrU3RlcCwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX3N0ZXBzOiBRdWVyeUxpc3Q8Q2RrU3RlcD47XG5cbiAgLyoqIFN0ZXBzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50IHN0ZXBwZXIsIGV4Y2x1ZGluZyBvbmVzIGZyb20gbmVzdGVkIHN0ZXBwZXJzLiAqL1xuICByZWFkb25seSBzdGVwczogUXVlcnlMaXN0PENka1N0ZXA+ID0gbmV3IFF1ZXJ5TGlzdDxDZGtTdGVwPigpO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBzdGVwIGhlYWRlcnMgb2YgdGhlIHN0ZXBzIGluIHRoZSBzdGVwcGVyLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1N0ZXBIZWFkZXIsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9zdGVwSGVhZGVyOiBRdWVyeUxpc3Q8Q2RrU3RlcEhlYWRlcj47XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHZhbGlkaXR5IG9mIHByZXZpb3VzIHN0ZXBzIHNob3VsZCBiZSBjaGVja2VkIG9yIG5vdC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGxpbmVhcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fbGluZWFyO1xuICB9XG4gIHNldCBsaW5lYXIodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9saW5lYXIgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2xpbmVhciA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIHNlbGVjdGVkIHN0ZXAuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZEluZGV4KCkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICB9XG4gIHNldCBzZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IGNvZXJjZU51bWJlclByb3BlcnR5KGluZGV4KTtcblxuICAgIGlmICh0aGlzLnN0ZXBzICYmIHRoaXMuX3N0ZXBzKSB7XG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgaW5kZXggY2FuJ3QgYmUgb3V0IG9mIGJvdW5kcy5cbiAgICAgIGlmICghdGhpcy5faXNWYWxpZEluZGV4KGluZGV4KSAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgICB0aHJvdyBFcnJvcignY2RrU3RlcHBlcjogQ2Fubm90IGFzc2lnbiBvdXQtb2YtYm91bmRzIHZhbHVlIHRvIGBzZWxlY3RlZEluZGV4YC4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZWN0ZWRTdGVwID0gdGhpcy5zZWxlY3RlZDtcblxuICAgICAgaWYgKHNlbGVjdGVkU3RlcCkge1xuICAgICAgICAvLyBUT0RPOiB0aGlzIHNob3VsZCByZWFsbHkgYmUgY2FsbGVkIHNvbWV0aGluZyBsaWtlIGB2aXNpdGVkYCBpbnN0ZWFkLiBKdXN0IGJlY2F1c2VcbiAgICAgICAgLy8gdGhlIHVzZXIgaGFzIHNlZW4gdGhlIHN0ZXAgZG9lc24ndCBndWFyYW50ZWUgdGhhdCB0aGV5J3ZlIGludGVyYWN0ZWQgd2l0aCBpdC5cbiAgICAgICAgc2VsZWN0ZWRTdGVwLmludGVyYWN0ZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXggJiYgIXRoaXMuX2FueUNvbnRyb2xzSW52YWxpZE9yUGVuZGluZyhuZXdJbmRleCkgJiZcbiAgICAgICAgICAobmV3SW5kZXggPj0gdGhpcy5fc2VsZWN0ZWRJbmRleCB8fCB0aGlzLnN0ZXBzLnRvQXJyYXkoKVtuZXdJbmRleF0uZWRpdGFibGUpKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbUluZGV4KGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG5ld0luZGV4O1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9zZWxlY3RlZEluZGV4ID0gMDtcblxuICAvKiogVGhlIHN0ZXAgdGhhdCBpcyBzZWxlY3RlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IHNlbGVjdGVkKCk6IENka1N0ZXAgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnN0ZXBzID8gdGhpcy5zdGVwcy50b0FycmF5KClbdGhpcy5zZWxlY3RlZEluZGV4XSA6IHVuZGVmaW5lZDtcbiAgfVxuICBzZXQgc2VsZWN0ZWQoc3RlcDogQ2RrU3RlcCB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IChzdGVwICYmIHRoaXMuc3RlcHMpID8gdGhpcy5zdGVwcy50b0FycmF5KCkuaW5kZXhPZihzdGVwKSA6IC0xO1xuICB9XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgc2VsZWN0ZWQgc3RlcCBoYXMgY2hhbmdlZC4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IHNlbGVjdGlvbkNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8U3RlcHBlclNlbGVjdGlvbkV2ZW50PigpO1xuXG4gIC8qKiBVc2VkIHRvIHRyYWNrIHVuaXF1ZSBJRCBmb3IgZWFjaCBzdGVwcGVyIGNvbXBvbmVudC4gKi9cbiAgX2dyb3VwSWQ6IG51bWJlcjtcblxuICAvKiogT3JpZW50YXRpb24gb2YgdGhlIHN0ZXBwZXIuICovXG4gIEBJbnB1dCgpXG4gIGdldCBvcmllbnRhdGlvbigpOiBTdGVwcGVyT3JpZW50YXRpb24geyByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247IH1cbiAgc2V0IG9yaWVudGF0aW9uKHZhbHVlOiBTdGVwcGVyT3JpZW50YXRpb24pIHtcbiAgICAvLyBUaGlzIGlzIGEgcHJvdGVjdGVkIG1ldGhvZCBzbyB0aGF0IGBNYXRTdGVwcHRlcmAgY2FuIGhvb2sgaW50byBpdC5cbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IHZhbHVlO1xuXG4gICAgaWYgKHRoaXMuX2tleU1hbmFnZXIpIHtcbiAgICAgIHRoaXMuX2tleU1hbmFnZXIud2l0aFZlcnRpY2FsT3JpZW50YXRpb24odmFsdWUgPT09ICd2ZXJ0aWNhbCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBUbyBiZSB0dXJuZWQgaW50byBhIHByaXZhdGUgcHJvcGVydHkuIFVzZSBgb3JpZW50YXRpb25gIGluc3RlYWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTMuMC4wXG4gICAqL1xuICBwcm90ZWN0ZWQgX29yaWVudGF0aW9uOiBTdGVwcGVyT3JpZW50YXRpb24gPSAnaG9yaXpvbnRhbCc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBwcml2YXRlIF9kaXI6IERpcmVjdGlvbmFsaXR5LCBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PiwgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9ncm91cElkID0gbmV4dElkKys7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5fc3RlcHMuY2hhbmdlc1xuICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX3N0ZXBzKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKChzdGVwczogUXVlcnlMaXN0PENka1N0ZXA+KSA9PiB7XG4gICAgICAgIHRoaXMuc3RlcHMucmVzZXQoc3RlcHMuZmlsdGVyKHN0ZXAgPT4gc3RlcC5fc3RlcHBlciA9PT0gdGhpcykpO1xuICAgICAgICB0aGlzLnN0ZXBzLm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgICAgfSk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gTm90ZSB0aGF0IHdoaWxlIHRoZSBzdGVwIGhlYWRlcnMgYXJlIGNvbnRlbnQgY2hpbGRyZW4gYnkgZGVmYXVsdCwgYW55IGNvbXBvbmVudHMgdGhhdFxuICAgIC8vIGV4dGVuZCB0aGlzIG9uZSBtaWdodCBoYXZlIHRoZW0gYXMgdmlldyBjaGlsZHJlbi4gV2UgaW5pdGlhbGl6ZSB0aGUga2V5Ym9hcmQgaGFuZGxpbmcgaW5cbiAgICAvLyBBZnRlclZpZXdJbml0IHNvIHdlJ3JlIGd1YXJhbnRlZWQgZm9yIGJvdGggdmlldyBhbmQgY29udGVudCBjaGlsZHJlbiB0byBiZSBkZWZpbmVkLlxuICAgIHRoaXMuX2tleU1hbmFnZXIgPSBuZXcgRm9jdXNLZXlNYW5hZ2VyPEZvY3VzYWJsZU9wdGlvbj4odGhpcy5fc3RlcEhlYWRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aXRoV3JhcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAud2l0aEhvbWVBbmRFbmQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpdGhWZXJ0aWNhbE9yaWVudGF0aW9uKHRoaXMuX29yaWVudGF0aW9uID09PSAndmVydGljYWwnKTtcblxuICAgICh0aGlzLl9kaXIgPyAodGhpcy5fZGlyLmNoYW5nZSBhcyBPYnNlcnZhYmxlPERpcmVjdGlvbj4pIDogb2JzZXJ2YWJsZU9mPERpcmVjdGlvbj4oKSlcbiAgICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2xheW91dERpcmVjdGlvbigpKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAgIC5zdWJzY3JpYmUoZGlyZWN0aW9uID0+IHRoaXMuX2tleU1hbmFnZXIud2l0aEhvcml6b250YWxPcmllbnRhdGlvbihkaXJlY3Rpb24pKTtcblxuICAgIHRoaXMuX2tleU1hbmFnZXIudXBkYXRlQWN0aXZlSXRlbSh0aGlzLl9zZWxlY3RlZEluZGV4KTtcblxuICAgIC8vIE5vIG5lZWQgdG8gYHRha2VVbnRpbGAgaGVyZSwgYmVjYXVzZSB3ZSdyZSB0aGUgb25lcyBkZXN0cm95aW5nIGBzdGVwc2AuXG4gICAgdGhpcy5zdGVwcy5jaGFuZ2VzLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxLCAwKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFRoZSBsb2dpYyB3aGljaCBhc3NlcnRzIHRoYXQgdGhlIHNlbGVjdGVkIGluZGV4IGlzIHdpdGhpbiBib3VuZHMgZG9lc24ndCBydW4gYmVmb3JlIHRoZVxuICAgIC8vIHN0ZXBzIGFyZSBpbml0aWFsaXplZCwgYmVjYXVzZSB3ZSBkb24ndCBob3cgbWFueSBzdGVwcyB0aGVyZSBhcmUgeWV0IHNvIHdlIG1heSBoYXZlIGFuXG4gICAgLy8gaW52YWxpZCBpbmRleCBvbiBpbml0LiBJZiB0aGF0J3MgdGhlIGNhc2UsIGF1dG8tY29ycmVjdCB0byB0aGUgZGVmYXVsdCBzbyB3ZSBkb24ndCB0aHJvdy5cbiAgICBpZiAoIXRoaXMuX2lzVmFsaWRJbmRleCh0aGlzLl9zZWxlY3RlZEluZGV4KSkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdGVwcy5kZXN0cm95KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIGFuZCBmb2N1c2VzIHRoZSBuZXh0IHN0ZXAgaW4gbGlzdC4gKi9cbiAgbmV4dCgpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBNYXRoLm1pbih0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSwgdGhpcy5zdGVwcy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIGFuZCBmb2N1c2VzIHRoZSBwcmV2aW91cyBzdGVwIGluIGxpc3QuICovXG4gIHByZXZpb3VzKCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxLCAwKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXBwZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIGNsZWFyaW5nIGZvcm0gZGF0YS4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRJdGVtSW5kZXgoMCk7XG4gICAgdGhpcy5zdGVwcy5mb3JFYWNoKHN0ZXAgPT4gc3RlcC5yZXNldCgpKTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgdW5pcXVlIGlkIGZvciBlYWNoIHN0ZXAgbGFiZWwgZWxlbWVudC4gKi9cbiAgX2dldFN0ZXBMYWJlbElkKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBjZGstc3RlcC1sYWJlbC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdW5pcXVlIGlkIGZvciBlYWNoIHN0ZXAgY29udGVudCBlbGVtZW50LiAqL1xuICBfZ2V0U3RlcENvbnRlbnRJZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgY2RrLXN0ZXAtY29udGVudC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIE1hcmtzIHRoZSBjb21wb25lbnQgdG8gYmUgY2hhbmdlIGRldGVjdGVkLiAqL1xuICBfc3RhdGVDaGFuZ2VkKCkge1xuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgcG9zaXRpb24gc3RhdGUgb2YgdGhlIHN0ZXAgd2l0aCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIF9nZXRBbmltYXRpb25EaXJlY3Rpb24oaW5kZXg6IG51bWJlcik6IFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSBpbmRleCAtIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xheW91dERpcmVjdGlvbigpID09PSAncnRsJyA/ICduZXh0JyA6ICdwcmV2aW91cyc7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXlvdXREaXJlY3Rpb24oKSA9PT0gJ3J0bCcgPyAncHJldmlvdXMnIDogJ25leHQnO1xuICAgIH1cbiAgICByZXR1cm4gJ2N1cnJlbnQnO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHR5cGUgb2YgaWNvbiB0byBiZSBkaXNwbGF5ZWQuICovXG4gIF9nZXRJbmRpY2F0b3JUeXBlKGluZGV4OiBudW1iZXIsIHN0YXRlOiBTdGVwU3RhdGUgPSBTVEVQX1NUQVRFLk5VTUJFUik6IFN0ZXBTdGF0ZSB7XG4gICAgY29uc3Qgc3RlcCA9IHRoaXMuc3RlcHMudG9BcnJheSgpW2luZGV4XTtcbiAgICBjb25zdCBpc0N1cnJlbnRTdGVwID0gdGhpcy5faXNDdXJyZW50U3RlcChpbmRleCk7XG5cbiAgICByZXR1cm4gc3RlcC5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID8gdGhpcy5fZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0R3VpZGVsaW5lTG9naWMoc3RlcCwgaXNDdXJyZW50U3RlcCwgc3RhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXA6IENka1N0ZXAsIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4pOiBTdGVwU3RhdGUge1xuICAgIGlmIChzdGVwLl9zaG93RXJyb3IgJiYgc3RlcC5oYXNFcnJvciAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRVJST1I7XG4gICAgfSBlbHNlIGlmICghc3RlcC5jb21wbGV0ZWQgfHwgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuTlVNQkVSO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RlcC5lZGl0YWJsZSA/IFNURVBfU1RBVEUuRURJVCA6IFNURVBfU1RBVEUuRE9ORTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRHdWlkZWxpbmVMb2dpYyhcbiAgICAgIHN0ZXA6IENka1N0ZXAsIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4sIHN0YXRlOiBTdGVwU3RhdGUgPSBTVEVQX1NUQVRFLk5VTUJFUik6IFN0ZXBTdGF0ZSB7XG4gICAgaWYgKHN0ZXAuX3Nob3dFcnJvciAmJiBzdGVwLmhhc0Vycm9yICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FUlJPUjtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuY29tcGxldGVkICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5ET05FO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5jb21wbGV0ZWQgJiYgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5lZGl0YWJsZSAmJiBpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FRElUO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaXNDdXJyZW50U3RlcChpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IGluZGV4O1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50bHktZm9jdXNlZCBzdGVwIGhlYWRlci4gKi9cbiAgX2dldEZvY3VzSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleU1hbmFnZXIgPyB0aGlzLl9rZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCA6IHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChuZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RlcHNBcnJheSA9IHRoaXMuc3RlcHMudG9BcnJheSgpO1xuICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQoe1xuICAgICAgc2VsZWN0ZWRJbmRleDogbmV3SW5kZXgsXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogdGhpcy5fc2VsZWN0ZWRJbmRleCxcbiAgICAgIHNlbGVjdGVkU3RlcDogc3RlcHNBcnJheVtuZXdJbmRleF0sXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBzdGVwc0FycmF5W3RoaXMuX3NlbGVjdGVkSW5kZXhdLFxuICAgIH0pO1xuXG4gICAgLy8gSWYgZm9jdXMgaXMgaW5zaWRlIHRoZSBzdGVwcGVyLCBtb3ZlIGl0IHRvIHRoZSBuZXh0IGhlYWRlciwgb3RoZXJ3aXNlIGl0IG1heSBiZWNvbWVcbiAgICAvLyBsb3N0IHdoZW4gdGhlIGFjdGl2ZSBzdGVwIGNvbnRlbnQgaXMgaGlkZGVuLiBXZSBjYW4ndCBiZSBtb3JlIGdyYW51bGFyIHdpdGggdGhlIGNoZWNrXG4gICAgLy8gKGUuZy4gY2hlY2tpbmcgd2hldGhlciBmb2N1cyBpcyBpbnNpZGUgdGhlIGFjdGl2ZSBzdGVwKSwgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGFcbiAgICAvLyByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnRzIHRoYXQgYXJlIHJlbmRlcmluZyBvdXQgdGhlIGNvbnRlbnQuXG4gICAgdGhpcy5fY29udGFpbnNGb2N1cygpID8gdGhpcy5fa2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKG5ld0luZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKG5ld0luZGV4KTtcblxuICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIF9vbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBoYXNNb2RpZmllciA9IGhhc01vZGlmaWVyS2V5KGV2ZW50KTtcbiAgICBjb25zdCBrZXlDb2RlID0gZXZlbnQua2V5Q29kZTtcbiAgICBjb25zdCBtYW5hZ2VyID0gdGhpcy5fa2V5TWFuYWdlcjtcblxuICAgIGlmIChtYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCAhPSBudWxsICYmICFoYXNNb2RpZmllciAmJlxuICAgICAgICAoa2V5Q29kZSA9PT0gU1BBQ0UgfHwga2V5Q29kZSA9PT0gRU5URVIpKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBtYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleDtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hbmFnZXIub25LZXlkb3duKGV2ZW50KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hbnlDb250cm9sc0ludmFsaWRPclBlbmRpbmcoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9saW5lYXIgJiYgaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RlcHMudG9BcnJheSgpLnNsaWNlKDAsIGluZGV4KS5zb21lKHN0ZXAgPT4ge1xuICAgICAgICBjb25zdCBjb250cm9sID0gc3RlcC5zdGVwQ29udHJvbDtcbiAgICAgICAgY29uc3QgaXNJbmNvbXBsZXRlID1cbiAgICAgICAgICAgIGNvbnRyb2wgPyAoY29udHJvbC5pbnZhbGlkIHx8IGNvbnRyb2wucGVuZGluZyB8fCAhc3RlcC5pbnRlcmFjdGVkKSA6ICFzdGVwLmNvbXBsZXRlZDtcbiAgICAgICAgcmV0dXJuIGlzSW5jb21wbGV0ZSAmJiAhc3RlcC5vcHRpb25hbCAmJiAhc3RlcC5fY29tcGxldGVkT3ZlcnJpZGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9sYXlvdXREaXJlY3Rpb24oKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyICYmIHRoaXMuX2Rpci52YWx1ZSA9PT0gJ3J0bCcgPyAncnRsJyA6ICdsdHInO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBzdGVwcGVyIGNvbnRhaW5zIHRoZSBmb2N1c2VkIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NvbnRhaW5zRm9jdXMoKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3RlcHBlckVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgZm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIHJldHVybiBzdGVwcGVyRWxlbWVudCA9PT0gZm9jdXNlZEVsZW1lbnQgfHwgc3RlcHBlckVsZW1lbnQuY29udGFpbnMoZm9jdXNlZEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBwYXNzZWQtaW4gaW5kZXggaXMgYSB2YWxpZCBzdGVwIGluZGV4LiAqL1xuICBwcml2YXRlIF9pc1ZhbGlkSW5kZXgoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpbmRleCA+IC0xICYmICghdGhpcy5zdGVwcyB8fCBpbmRleCA8IHRoaXMuc3RlcHMubGVuZ3RoKTtcbiAgfVxuXG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9lZGl0YWJsZTogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfb3B0aW9uYWw6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2NvbXBsZXRlZDogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfaGFzRXJyb3I6IEJvb2xlYW5JbnB1dDtcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2xpbmVhcjogQm9vbGVhbklucHV0O1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfc2VsZWN0ZWRJbmRleDogTnVtYmVySW5wdXQ7XG59XG5cblxuLyoqXG4gKiBTaW1wbGlmaWVkIHJlcHJlc2VudGF0aW9uIG9mIGFuIFwiQWJzdHJhY3RDb250cm9sXCIgZnJvbSBAYW5ndWxhci9mb3Jtcy5cbiAqIFVzZWQgdG8gYXZvaWQgaGF2aW5nIHRvIGJyaW5nIGluIEBhbmd1bGFyL2Zvcm1zIGZvciBhIHNpbmdsZSBvcHRpb25hbCBpbnRlcmZhY2UuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmludGVyZmFjZSBBYnN0cmFjdENvbnRyb2xMaWtlIHtcbiAgYXN5bmNWYWxpZGF0b3I6ICgoY29udHJvbDogYW55KSA9PiBhbnkpIHwgbnVsbDtcbiAgZGlydHk6IGJvb2xlYW47XG4gIGRpc2FibGVkOiBib29sZWFuO1xuICBlbmFibGVkOiBib29sZWFuO1xuICBlcnJvcnM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbDtcbiAgaW52YWxpZDogYm9vbGVhbjtcbiAgcGFyZW50OiBhbnk7XG4gIHBlbmRpbmc6IGJvb2xlYW47XG4gIHByaXN0aW5lOiBib29sZWFuO1xuICByb290OiBBYnN0cmFjdENvbnRyb2xMaWtlO1xuICBzdGF0dXM6IHN0cmluZztcbiAgcmVhZG9ubHkgc3RhdHVzQ2hhbmdlczogT2JzZXJ2YWJsZTxhbnk+O1xuICB0b3VjaGVkOiBib29sZWFuO1xuICB1bnRvdWNoZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZU9uOiBhbnk7XG4gIHZhbGlkOiBib29sZWFuO1xuICB2YWxpZGF0b3I6ICgoY29udHJvbDogYW55KSA9PiBhbnkpIHwgbnVsbDtcbiAgdmFsdWU6IGFueTtcbiAgcmVhZG9ubHkgdmFsdWVDaGFuZ2VzOiBPYnNlcnZhYmxlPGFueT47XG4gIGNsZWFyQXN5bmNWYWxpZGF0b3JzKCk6IHZvaWQ7XG4gIGNsZWFyVmFsaWRhdG9ycygpOiB2b2lkO1xuICBkaXNhYmxlKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBlbmFibGUob3B0cz86IGFueSk6IHZvaWQ7XG4gIGdldChwYXRoOiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogQWJzdHJhY3RDb250cm9sTGlrZSB8IG51bGw7XG4gIGdldEVycm9yKGVycm9yQ29kZTogc3RyaW5nLCBwYXRoPzogKHN0cmluZyB8IG51bWJlcilbXSB8IHN0cmluZyk6IGFueTtcbiAgaGFzRXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogYm9vbGVhbjtcbiAgbWFya0FsbEFzVG91Y2hlZCgpOiB2b2lkO1xuICBtYXJrQXNEaXJ0eShvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzUGVuZGluZyhvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzUHJpc3RpbmUob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1RvdWNoZWQob3B0cz86IGFueSk6IHZvaWQ7XG4gIG1hcmtBc1VudG91Y2hlZChvcHRzPzogYW55KTogdm9pZDtcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogT2JqZWN0KTogdm9pZDtcbiAgcmVzZXQodmFsdWU/OiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICBzZXRBc3luY1ZhbGlkYXRvcnMobmV3VmFsaWRhdG9yOiAoY29udHJvbDogYW55KSA9PiBhbnkgfFxuICAgICgoY29udHJvbDogYW55KSA9PiBhbnkpW10gfCBudWxsKTogdm9pZDtcbiAgc2V0RXJyb3JzKGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLCBvcHRzPzogYW55KTogdm9pZDtcbiAgc2V0UGFyZW50KHBhcmVudDogYW55KTogdm9pZDtcbiAgc2V0VmFsaWRhdG9ycyhuZXdWYWxpZGF0b3I6IChjb250cm9sOiBhbnkpID0+IGFueSB8XG4gICAgKChjb250cm9sOiBhbnkpID0+IGFueSlbXSB8IG51bGwpOiB2b2lkO1xuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogT2JqZWN0KTogdm9pZDtcbiAgdXBkYXRlVmFsdWVBbmRWYWxpZGl0eShvcHRzPzogYW55KTogdm9pZDtcbiAgcGF0Y2hWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbiAgcmVzZXQoZm9ybVN0YXRlPzogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IGFueSk6IHZvaWQ7XG59XG4iXX0=