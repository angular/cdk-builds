/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty, coerceNumberProperty, } from '@angular/cdk/coercion';
import { ENTER, hasModifierKey, SPACE } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, ElementRef, EventEmitter, forwardRef, Inject, InjectionToken, Input, Optional, Output, QueryList, TemplateRef, ViewChild, ViewEncapsulation, } from '@angular/core';
import { _getFocusedElementPierceShadowDom } from '@angular/cdk/platform';
import { of as observableOf, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { CdkStepHeader } from './step-header';
import { CdkStepLabel } from './step-label';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/bidi";
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
    ERROR: 'error',
};
/** InjectionToken that can be used to specify the global stepper options. */
export const STEPPER_GLOBAL_OPTIONS = new InjectionToken('STEPPER_GLOBAL_OPTIONS');
export class CdkStep {
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
    constructor(_stepper, stepperOptions) {
        this._stepper = _stepper;
        /** Whether user has attempted to move away from the step. */
        this.interacted = false;
        /** Emits when the user has attempted to move away from the step. */
        this.interactedStream = new EventEmitter();
        this._editable = true;
        this._optional = false;
        this._completedOverride = null;
        this._customError = null;
        this._stepperOptions = stepperOptions ? stepperOptions : {};
        this._displayDefaultIndicatorType = this._stepperOptions.displayDefaultIndicatorType !== false;
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
    _markAsInteracted() {
        if (!this.interacted) {
            this.interacted = true;
            this.interactedStream.emit(this);
        }
    }
    /** Determines whether the error state can be shown. */
    _showError() {
        // We want to show the error state either if the user opted into/out of it using the
        // global options, or if they've explicitly set it through the `hasError` input.
        return this._stepperOptions.showError ?? this._customError != null;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkStep, deps: [{ token: forwardRef(() => CdkStepper) }, { token: STEPPER_GLOBAL_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "16.1.1", type: CdkStep, selector: "cdk-step", inputs: { stepControl: "stepControl", label: "label", errorMessage: "errorMessage", ariaLabel: ["aria-label", "ariaLabel"], ariaLabelledby: ["aria-labelledby", "ariaLabelledby"], state: "state", editable: "editable", optional: "optional", completed: "completed", hasError: "hasError" }, outputs: { interactedStream: "interacted" }, queries: [{ propertyName: "stepLabel", first: true, predicate: CdkStepLabel, descendants: true }], viewQueries: [{ propertyName: "content", first: true, predicate: TemplateRef, descendants: true, static: true }], exportAs: ["cdkStep"], usesOnChanges: true, ngImport: i0, template: '<ng-template><ng-content></ng-content></ng-template>', isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkStep, decorators: [{
            type: Component,
            args: [{
                    selector: 'cdk-step',
                    exportAs: 'cdkStep',
                    template: '<ng-template><ng-content></ng-content></ng-template>',
                    encapsulation: ViewEncapsulation.None,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                }]
        }], ctorParameters: function () { return [{ type: CdkStepper, decorators: [{
                    type: Inject,
                    args: [forwardRef(() => CdkStepper)]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [STEPPER_GLOBAL_OPTIONS]
                }] }]; }, propDecorators: { stepLabel: [{
                type: ContentChild,
                args: [CdkStepLabel]
            }], content: [{
                type: ViewChild,
                args: [TemplateRef, { static: true }]
            }], stepControl: [{
                type: Input
            }], interactedStream: [{
                type: Output,
                args: ['interacted']
            }], label: [{
                type: Input
            }], errorMessage: [{
                type: Input
            }], ariaLabel: [{
                type: Input,
                args: ['aria-label']
            }], ariaLabelledby: [{
                type: Input,
                args: ['aria-labelledby']
            }], state: [{
                type: Input
            }], editable: [{
                type: Input
            }], optional: [{
                type: Input
            }], completed: [{
                type: Input
            }], hasError: [{
                type: Input
            }] } });
export class CdkStepper {
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
            if (!this._isValidIndex(newIndex) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
                throw Error('cdkStepper: Cannot assign out-of-bounds value to `selectedIndex`.');
            }
            this.selected?._markAsInteracted();
            if (this._selectedIndex !== newIndex &&
                !this._anyControlsInvalidOrPending(newIndex) &&
                (newIndex >= this._selectedIndex || this.steps.toArray()[newIndex].editable)) {
                this._updateSelectedItemIndex(newIndex);
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
        this.selectedIndex = step && this.steps ? this.steps.toArray().indexOf(step) : -1;
    }
    /** Orientation of the stepper. */
    get orientation() {
        return this._orientation;
    }
    set orientation(value) {
        // This is a protected method so that `MatStepper` can hook into it.
        this._orientation = value;
        if (this._keyManager) {
            this._keyManager.withVerticalOrientation(value === 'vertical');
        }
    }
    constructor(_dir, _changeDetectorRef, _elementRef) {
        this._dir = _dir;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        /** Emits when the component is destroyed. */
        this._destroyed = new Subject();
        /** Steps that belong to the current stepper, excluding ones from nested steppers. */
        this.steps = new QueryList();
        /** List of step headers sorted based on their DOM order. */
        this._sortedHeaders = new QueryList();
        this._linear = false;
        this._selectedIndex = 0;
        /** Event emitted when the selected step has changed. */
        this.selectionChange = new EventEmitter();
        /** Output to support two-way binding on `[(selectedIndex)]` */
        this.selectedIndexChange = new EventEmitter();
        this._orientation = 'horizontal';
        this._groupId = nextId++;
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
        // If the step headers are defined outside of the `ngFor` that renders the steps, like in the
        // Material stepper, they won't appear in the `QueryList` in the same order as they're
        // rendered in the DOM which will lead to incorrect keyboard navigation. We need to sort
        // them manually to ensure that they're correct. Alternatively, we can change the Material
        // template to inline the headers in the `ngFor`, but that'll result in a lot of
        // code duplication. See #23539.
        this._stepHeader.changes
            .pipe(startWith(this._stepHeader), takeUntil(this._destroyed))
            .subscribe((headers) => {
            this._sortedHeaders.reset(headers.toArray().sort((a, b) => {
                const documentPosition = a._elementRef.nativeElement.compareDocumentPosition(b._elementRef.nativeElement);
                // `compareDocumentPosition` returns a bitmask so we have to use a bitwise operator.
                // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
                // tslint:disable-next-line:no-bitwise
                return documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            }));
            this._sortedHeaders.notifyOnChanges();
        });
        // Note that while the step headers are content children by default, any components that
        // extend this one might have them as view children. We initialize the keyboard handling in
        // AfterViewInit so we're guaranteed for both view and content children to be defined.
        this._keyManager = new FocusKeyManager(this._sortedHeaders)
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
        this._keyManager?.destroy();
        this.steps.destroy();
        this._sortedHeaders.destroy();
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
        return step._displayDefaultIndicatorType
            ? this._getDefaultIndicatorLogic(step, isCurrentStep)
            : this._getGuidelineLogic(step, isCurrentStep, state);
    }
    _getDefaultIndicatorLogic(step, isCurrentStep) {
        if (step._showError() && step.hasError && !isCurrentStep) {
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
        if (step._showError() && step.hasError && !isCurrentStep) {
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
        this._containsFocus()
            ? this._keyManager.setActiveItem(newIndex)
            : this._keyManager.updateActiveItem(newIndex);
        this._selectedIndex = newIndex;
        this.selectedIndexChange.emit(this._selectedIndex);
        this._stateChanged();
    }
    _onKeydown(event) {
        const hasModifier = hasModifierKey(event);
        const keyCode = event.keyCode;
        const manager = this._keyManager;
        if (manager.activeItemIndex != null &&
            !hasModifier &&
            (keyCode === SPACE || keyCode === ENTER)) {
            this.selectedIndex = manager.activeItemIndex;
            event.preventDefault();
        }
        else {
            manager.setFocusOrigin('keyboard').onKeydown(event);
        }
    }
    _anyControlsInvalidOrPending(index) {
        if (this._linear && index >= 0) {
            return this.steps
                .toArray()
                .slice(0, index)
                .some(step => {
                const control = step.stepControl;
                const isIncomplete = control
                    ? control.invalid || control.pending || !step.interacted
                    : !step.completed;
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
        const focusedElement = _getFocusedElementPierceShadowDom();
        return stepperElement === focusedElement || stepperElement.contains(focusedElement);
    }
    /** Checks whether the passed-in index is a valid step index. */
    _isValidIndex(index) {
        return index > -1 && (!this.steps || index < this.steps.length);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkStepper, deps: [{ token: i1.Directionality, optional: true }, { token: i0.ChangeDetectorRef }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.1.1", type: CdkStepper, selector: "[cdkStepper]", inputs: { linear: "linear", selectedIndex: "selectedIndex", selected: "selected", orientation: "orientation" }, outputs: { selectionChange: "selectionChange", selectedIndexChange: "selectedIndexChange" }, queries: [{ propertyName: "_steps", predicate: CdkStep, descendants: true }, { propertyName: "_stepHeader", predicate: CdkStepHeader, descendants: true }], exportAs: ["cdkStepper"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.1.1", ngImport: i0, type: CdkStepper, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkStepper]',
                    exportAs: 'cdkStepper',
                }]
        }], ctorParameters: function () { return [{ type: i1.Directionality, decorators: [{
                    type: Optional
                }] }, { type: i0.ChangeDetectorRef }, { type: i0.ElementRef }]; }, propDecorators: { _steps: [{
                type: ContentChildren,
                args: [CdkStep, { descendants: true }]
            }], _stepHeader: [{
                type: ContentChildren,
                args: [CdkStepHeader, { descendants: true }]
            }], linear: [{
                type: Input
            }], selectedIndex: [{
                type: Input
            }], selected: [{
                type: Input
            }], selectionChange: [{
                type: Output
            }], selectedIndexChange: [{
                type: Output
            }], orientation: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFZLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFFTCxxQkFBcUIsRUFDckIsb0JBQW9CLEdBRXJCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbkUsT0FBTyxFQUVMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFlBQVksRUFDWixlQUFlLEVBQ2YsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLE1BQU0sRUFDTixjQUFjLEVBQ2QsS0FBSyxFQUdMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFdBQVcsRUFDWCxTQUFTLEVBQ1QsaUJBQWlCLEdBRWxCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyxpQ0FBaUMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3hFLE9BQU8sRUFBYSxFQUFFLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3RCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXBELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQzs7O0FBRTFDLDZEQUE2RDtBQUM3RCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFXZixpREFBaUQ7QUFDakQsTUFBTSxPQUFPLHFCQUFxQjtDQVlq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R0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsRSxDQUFDOzhHQTFVVSxVQUFVO2tHQUFWLFVBQVUsd1JBUUosT0FBTyxpRUFNUCxhQUFhOzsyRkFkbkIsVUFBVTtrQkFKdEIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsY0FBYztvQkFDeEIsUUFBUSxFQUFFLFlBQVk7aUJBQ3ZCOzswQkE2RkksUUFBUTtxR0FwRm9DLE1BQU07c0JBQXBELGVBQWU7dUJBQUMsT0FBTyxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQztnQkFNUSxXQUFXO3NCQUEvRCxlQUFlO3VCQUFDLGFBQWEsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7Z0JBTy9DLE1BQU07c0JBRFQsS0FBSztnQkFXRixhQUFhO3NCQURoQixLQUFLO2dCQThCRixRQUFRO3NCQURYLEtBQUs7Z0JBU2EsZUFBZTtzQkFBakMsTUFBTTtnQkFHWSxtQkFBbUI7c0JBQXJDLE1BQU07Z0JBT0gsV0FBVztzQkFEZCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Rm9jdXNhYmxlT3B0aW9uLCBGb2N1c0tleU1hbmFnZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtcbiAgQm9vbGVhbklucHV0LFxuICBjb2VyY2VCb29sZWFuUHJvcGVydHksXG4gIGNvZXJjZU51bWJlclByb3BlcnR5LFxuICBOdW1iZXJJbnB1dCxcbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RU5URVIsIGhhc01vZGlmaWVyS2V5LCBTUEFDRX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2tleWNvZGVzJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge19nZXRGb2N1c2VkRWxlbWVudFBpZXJjZVNoYWRvd0RvbX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgb2YgYXMgb2JzZXJ2YWJsZU9mLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7c3RhcnRXaXRoLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtDZGtTdGVwSGVhZGVyfSBmcm9tICcuL3N0ZXAtaGVhZGVyJztcbmltcG9ydCB7Q2RrU3RlcExhYmVsfSBmcm9tICcuL3N0ZXAtbGFiZWwnO1xuXG4vKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSUQgZm9yIGVhY2ggc3RlcHBlciBjb21wb25lbnQuICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBQb3NpdGlvbiBzdGF0ZSBvZiB0aGUgY29udGVudCBvZiBlYWNoIHN0ZXAgaW4gc3RlcHBlciB0aGF0IGlzIHVzZWQgZm9yIHRyYW5zaXRpb25pbmdcbiAqIHRoZSBjb250ZW50IGludG8gY29ycmVjdCBwb3NpdGlvbiB1cG9uIHN0ZXAgc2VsZWN0aW9uIGNoYW5nZS5cbiAqL1xuZXhwb3J0IHR5cGUgU3RlcENvbnRlbnRQb3NpdGlvblN0YXRlID0gJ3ByZXZpb3VzJyB8ICdjdXJyZW50JyB8ICduZXh0JztcblxuLyoqIFBvc3NpYmxlIG9yaWVudGF0aW9uIG9mIGEgc3RlcHBlci4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBwZXJPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCc7XG5cbi8qKiBDaGFuZ2UgZXZlbnQgZW1pdHRlZCBvbiBzZWxlY3Rpb24gY2hhbmdlcy4gKi9cbmV4cG9ydCBjbGFzcyBTdGVwcGVyU2VsZWN0aW9uRXZlbnQge1xuICAvKiogSW5kZXggb2YgdGhlIHN0ZXAgbm93IHNlbGVjdGVkLiAqL1xuICBzZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIHByZXZpb3VzbHkgc2VsZWN0ZWQuICovXG4gIHByZXZpb3VzbHlTZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBzdGVwIGluc3RhbmNlIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRTdGVwOiBDZGtTdGVwO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBDZGtTdGVwO1xufVxuXG4vKiogVGhlIHN0YXRlIG9mIGVhY2ggc3RlcC4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBTdGF0ZSA9ICdudW1iZXInIHwgJ2VkaXQnIHwgJ2RvbmUnIHwgJ2Vycm9yJyB8IHN0cmluZztcblxuLyoqIEVudW0gdG8gcmVwcmVzZW50IHRoZSBkaWZmZXJlbnQgc3RhdGVzIG9mIHRoZSBzdGVwcy4gKi9cbmV4cG9ydCBjb25zdCBTVEVQX1NUQVRFID0ge1xuICBOVU1CRVI6ICdudW1iZXInLFxuICBFRElUOiAnZWRpdCcsXG4gIERPTkU6ICdkb25lJyxcbiAgRVJST1I6ICdlcnJvcicsXG59O1xuXG4vKiogSW5qZWN0aW9uVG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5IHRoZSBnbG9iYWwgc3RlcHBlciBvcHRpb25zLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBQRVJfR0xPQkFMX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48U3RlcHBlck9wdGlvbnM+KCdTVEVQUEVSX0dMT0JBTF9PUFRJT05TJyk7XG5cbi8qKiBDb25maWd1cmFibGUgb3B0aW9ucyBmb3Igc3RlcHBlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcHBlck9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RlcHBlciBzaG91bGQgZGlzcGxheSBhbiBlcnJvciBzdGF0ZSBvciBub3QuXG4gICAqIERlZmF1bHQgYmVoYXZpb3IgaXMgYXNzdW1lZCB0byBiZSBmYWxzZS5cbiAgICovXG4gIHNob3dFcnJvcj86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0ZXBwZXIgc2hvdWxkIGRpc3BsYXkgdGhlIGRlZmF1bHQgaW5kaWNhdG9yIHR5cGVcbiAgICogb3Igbm90LlxuICAgKiBEZWZhdWx0IGJlaGF2aW9yIGlzIGFzc3VtZWQgdG8gYmUgdHJ1ZS5cbiAgICovXG4gIGRpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZT86IGJvb2xlYW47XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1zdGVwJyxcbiAgZXhwb3J0QXM6ICdjZGtTdGVwJyxcbiAgdGVtcGxhdGU6ICc8bmctdGVtcGxhdGU+PG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PjwvbmctdGVtcGxhdGU+JyxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXAgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICBwcml2YXRlIF9zdGVwcGVyT3B0aW9uczogU3RlcHBlck9wdGlvbnM7XG4gIF9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGU6IGJvb2xlYW47XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBzdGVwIGxhYmVsIGlmIGl0IGV4aXN0cy4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtTdGVwTGFiZWwpIHN0ZXBMYWJlbDogQ2RrU3RlcExhYmVsO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3Igc3RlcCBjb250ZW50LiAqL1xuICBAVmlld0NoaWxkKFRlbXBsYXRlUmVmLCB7c3RhdGljOiB0cnVlfSkgY29udGVudDogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKiogVGhlIHRvcCBsZXZlbCBhYnN0cmFjdCBjb250cm9sIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBzdGVwQ29udHJvbDogQWJzdHJhY3RDb250cm9sTGlrZTtcblxuICAvKiogV2hldGhlciB1c2VyIGhhcyBhdHRlbXB0ZWQgdG8gbW92ZSBhd2F5IGZyb20gdGhlIHN0ZXAuICovXG4gIGludGVyYWN0ZWQgPSBmYWxzZTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgdXNlciBoYXMgYXR0ZW1wdGVkIHRvIG1vdmUgYXdheSBmcm9tIHRoZSBzdGVwLiAqL1xuICBAT3V0cHV0KCdpbnRlcmFjdGVkJylcbiAgcmVhZG9ubHkgaW50ZXJhY3RlZFN0cmVhbTogRXZlbnRFbWl0dGVyPENka1N0ZXA+ID0gbmV3IEV2ZW50RW1pdHRlcjxDZGtTdGVwPigpO1xuXG4gIC8qKiBQbGFpbiB0ZXh0IGxhYmVsIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBsYWJlbDogc3RyaW5nO1xuXG4gIC8qKiBFcnJvciBtZXNzYWdlIHRvIGRpc3BsYXkgd2hlbiB0aGVyZSdzIGFuIGVycm9yLiAqL1xuICBASW5wdXQoKSBlcnJvck1lc3NhZ2U6IHN0cmluZztcblxuICAvKiogQXJpYSBsYWJlbCBmb3IgdGhlIHRhYi4gKi9cbiAgQElucHV0KCdhcmlhLWxhYmVsJykgYXJpYUxhYmVsOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCB0aGF0IHRoZSB0YWIgaXMgbGFiZWxsZWQgYnkuXG4gICAqIFdpbGwgYmUgY2xlYXJlZCBpZiBgYXJpYS1sYWJlbGAgaXMgc2V0IGF0IHRoZSBzYW1lIHRpbWUuXG4gICAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWxsZWRieScpIGFyaWFMYWJlbGxlZGJ5OiBzdHJpbmc7XG5cbiAgLyoqIFN0YXRlIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBzdGF0ZTogU3RlcFN0YXRlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB1c2VyIGNhbiByZXR1cm4gdG8gdGhpcyBzdGVwIG9uY2UgaXQgaGFzIGJlZW4gbWFya2VkIGFzIGNvbXBsZXRlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGVkaXRhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9lZGl0YWJsZTtcbiAgfVxuICBzZXQgZWRpdGFibGUodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2VkaXRhYmxlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9lZGl0YWJsZSA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNvbXBsZXRpb24gb2Ygc3RlcCBpcyBvcHRpb25hbC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9wdGlvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25hbDtcbiAgfVxuICBzZXQgb3B0aW9uYWwodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX29wdGlvbmFsID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9vcHRpb25hbCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHN0ZXAgaXMgbWFya2VkIGFzIGNvbXBsZXRlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGNvbXBsZXRlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPT0gbnVsbCA/IHRoaXMuX2dldERlZmF1bHRDb21wbGV0ZWQoKSA6IHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlO1xuICB9XG4gIHNldCBjb21wbGV0ZWQodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBfY29tcGxldGVkT3ZlcnJpZGU6IGJvb2xlYW4gfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9nZXREZWZhdWx0Q29tcGxldGVkKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sID8gdGhpcy5zdGVwQ29udHJvbC52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQgOiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogV2hldGhlciBzdGVwIGhhcyBhbiBlcnJvci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGhhc0Vycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jdXN0b21FcnJvciA9PSBudWxsID8gdGhpcy5fZ2V0RGVmYXVsdEVycm9yKCkgOiB0aGlzLl9jdXN0b21FcnJvcjtcbiAgfVxuICBzZXQgaGFzRXJyb3IodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2N1c3RvbUVycm9yID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9jdXN0b21FcnJvcjogYm9vbGVhbiB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgX2dldERlZmF1bHRFcnJvcigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGVwQ29udHJvbCAmJiB0aGlzLnN0ZXBDb250cm9sLmludmFsaWQgJiYgdGhpcy5pbnRlcmFjdGVkO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChmb3J3YXJkUmVmKCgpID0+IENka1N0ZXBwZXIpKSBwdWJsaWMgX3N0ZXBwZXI6IENka1N0ZXBwZXIsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChTVEVQUEVSX0dMT0JBTF9PUFRJT05TKSBzdGVwcGVyT3B0aW9ucz86IFN0ZXBwZXJPcHRpb25zLFxuICApIHtcbiAgICB0aGlzLl9zdGVwcGVyT3B0aW9ucyA9IHN0ZXBwZXJPcHRpb25zID8gc3RlcHBlck9wdGlvbnMgOiB7fTtcbiAgICB0aGlzLl9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGUgPSB0aGlzLl9zdGVwcGVyT3B0aW9ucy5kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGUgIT09IGZhbHNlO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgdGhpcyBzdGVwIGNvbXBvbmVudC4gKi9cbiAgc2VsZWN0KCk6IHZvaWQge1xuICAgIHRoaXMuX3N0ZXBwZXIuc2VsZWN0ZWQgPSB0aGlzO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3RlcCB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gTm90ZSB0aGF0IHRoaXMgaW5jbHVkZXMgcmVzZXR0aW5nIGZvcm0gZGF0YS4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5pbnRlcmFjdGVkID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY3VzdG9tRXJyb3IgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fY3VzdG9tRXJyb3IgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGVwQ29udHJvbCkge1xuICAgICAgdGhpcy5zdGVwQ29udHJvbC5yZXNldCgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25DaGFuZ2VzKCkge1xuICAgIC8vIFNpbmNlIGJhc2ljYWxseSBhbGwgaW5wdXRzIG9mIHRoZSBNYXRTdGVwIGdldCBwcm94aWVkIHRocm91Z2ggdGhlIHZpZXcgZG93biB0byB0aGVcbiAgICAvLyB1bmRlcmx5aW5nIE1hdFN0ZXBIZWFkZXIsIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBydW5zIGNvcnJlY3RseS5cbiAgICB0aGlzLl9zdGVwcGVyLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIF9tYXJrQXNJbnRlcmFjdGVkKCkge1xuICAgIGlmICghdGhpcy5pbnRlcmFjdGVkKSB7XG4gICAgICB0aGlzLmludGVyYWN0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5pbnRlcmFjdGVkU3RyZWFtLmVtaXQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIERldGVybWluZXMgd2hldGhlciB0aGUgZXJyb3Igc3RhdGUgY2FuIGJlIHNob3duLiAqL1xuICBfc2hvd0Vycm9yKCk6IGJvb2xlYW4ge1xuICAgIC8vIFdlIHdhbnQgdG8gc2hvdyB0aGUgZXJyb3Igc3RhdGUgZWl0aGVyIGlmIHRoZSB1c2VyIG9wdGVkIGludG8vb3V0IG9mIGl0IHVzaW5nIHRoZVxuICAgIC8vIGdsb2JhbCBvcHRpb25zLCBvciBpZiB0aGV5J3ZlIGV4cGxpY2l0bHkgc2V0IGl0IHRocm91Z2ggdGhlIGBoYXNFcnJvcmAgaW5wdXQuXG4gICAgcmV0dXJuIHRoaXMuX3N0ZXBwZXJPcHRpb25zLnNob3dFcnJvciA/PyB0aGlzLl9jdXN0b21FcnJvciAhPSBudWxsO1xuICB9XG59XG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtTdGVwcGVyXScsXG4gIGV4cG9ydEFzOiAnY2RrU3RlcHBlcicsXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXBwZXIgaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgY29tcG9uZW50IGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIC8qKiBVc2VkIGZvciBtYW5hZ2luZyBrZXlib2FyZCBmb2N1cy4gKi9cbiAgcHJpdmF0ZSBfa2V5TWFuYWdlcjogRm9jdXNLZXlNYW5hZ2VyPEZvY3VzYWJsZU9wdGlvbj47XG5cbiAgLyoqIEZ1bGwgbGlzdCBvZiBzdGVwcyBpbnNpZGUgdGhlIHN0ZXBwZXIsIGluY2x1ZGluZyBpbnNpZGUgbmVzdGVkIHN0ZXBwZXJzLiAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1N0ZXAsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9zdGVwczogUXVlcnlMaXN0PENka1N0ZXA+O1xuXG4gIC8qKiBTdGVwcyB0aGF0IGJlbG9uZyB0byB0aGUgY3VycmVudCBzdGVwcGVyLCBleGNsdWRpbmcgb25lcyBmcm9tIG5lc3RlZCBzdGVwcGVycy4gKi9cbiAgcmVhZG9ubHkgc3RlcHM6IFF1ZXJ5TGlzdDxDZGtTdGVwPiA9IG5ldyBRdWVyeUxpc3Q8Q2RrU3RlcD4oKTtcblxuICAvKiogVGhlIGxpc3Qgb2Ygc3RlcCBoZWFkZXJzIG9mIHRoZSBzdGVwcyBpbiB0aGUgc3RlcHBlci4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtTdGVwSGVhZGVyLCB7ZGVzY2VuZGFudHM6IHRydWV9KSBfc3RlcEhlYWRlcjogUXVlcnlMaXN0PENka1N0ZXBIZWFkZXI+O1xuXG4gIC8qKiBMaXN0IG9mIHN0ZXAgaGVhZGVycyBzb3J0ZWQgYmFzZWQgb24gdGhlaXIgRE9NIG9yZGVyLiAqL1xuICBwcml2YXRlIF9zb3J0ZWRIZWFkZXJzID0gbmV3IFF1ZXJ5TGlzdDxDZGtTdGVwSGVhZGVyPigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSB2YWxpZGl0eSBvZiBwcmV2aW91cyBzdGVwcyBzaG91bGQgYmUgY2hlY2tlZCBvciBub3QuICovXG4gIEBJbnB1dCgpXG4gIGdldCBsaW5lYXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpbmVhcjtcbiAgfVxuICBzZXQgbGluZWFyKHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9saW5lYXIgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2xpbmVhciA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIHNlbGVjdGVkIHN0ZXAuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZEluZGV4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gIH1cbiAgc2V0IHNlbGVjdGVkSW5kZXgoaW5kZXg6IE51bWJlcklucHV0KSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eShpbmRleCk7XG5cbiAgICBpZiAodGhpcy5zdGVwcyAmJiB0aGlzLl9zdGVwcykge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGluZGV4IGNhbid0IGJlIG91dCBvZiBib3VuZHMuXG4gICAgICBpZiAoIXRoaXMuX2lzVmFsaWRJbmRleChuZXdJbmRleCkgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2Nka1N0ZXBwZXI6IENhbm5vdCBhc3NpZ24gb3V0LW9mLWJvdW5kcyB2YWx1ZSB0byBgc2VsZWN0ZWRJbmRleGAuJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2VsZWN0ZWQ/Ll9tYXJrQXNJbnRlcmFjdGVkKCk7XG5cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXggJiZcbiAgICAgICAgIXRoaXMuX2FueUNvbnRyb2xzSW52YWxpZE9yUGVuZGluZyhuZXdJbmRleCkgJiZcbiAgICAgICAgKG5ld0luZGV4ID49IHRoaXMuX3NlbGVjdGVkSW5kZXggfHwgdGhpcy5zdGVwcy50b0FycmF5KClbbmV3SW5kZXhdLmVkaXRhYmxlKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbUluZGV4KG5ld0luZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG5ld0luZGV4O1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9zZWxlY3RlZEluZGV4ID0gMDtcblxuICAvKiogVGhlIHN0ZXAgdGhhdCBpcyBzZWxlY3RlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IHNlbGVjdGVkKCk6IENka1N0ZXAgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnN0ZXBzID8gdGhpcy5zdGVwcy50b0FycmF5KClbdGhpcy5zZWxlY3RlZEluZGV4XSA6IHVuZGVmaW5lZDtcbiAgfVxuICBzZXQgc2VsZWN0ZWQoc3RlcDogQ2RrU3RlcCB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHN0ZXAgJiYgdGhpcy5zdGVwcyA/IHRoaXMuc3RlcHMudG9BcnJheSgpLmluZGV4T2Yoc3RlcCkgOiAtMTtcbiAgfVxuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHNlbGVjdGVkIHN0ZXAgaGFzIGNoYW5nZWQuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBzZWxlY3Rpb25DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPFN0ZXBwZXJTZWxlY3Rpb25FdmVudD4oKTtcblxuICAvKiogT3V0cHV0IHRvIHN1cHBvcnQgdHdvLXdheSBiaW5kaW5nIG9uIGBbKHNlbGVjdGVkSW5kZXgpXWAgKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IHNlbGVjdGVkSW5kZXhDaGFuZ2U6IEV2ZW50RW1pdHRlcjxudW1iZXI+ID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG5cbiAgLyoqIFVzZWQgdG8gdHJhY2sgdW5pcXVlIElEIGZvciBlYWNoIHN0ZXBwZXIgY29tcG9uZW50LiAqL1xuICBfZ3JvdXBJZDogbnVtYmVyO1xuXG4gIC8qKiBPcmllbnRhdGlvbiBvZiB0aGUgc3RlcHBlci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9yaWVudGF0aW9uKCk6IFN0ZXBwZXJPcmllbnRhdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX29yaWVudGF0aW9uO1xuICB9XG4gIHNldCBvcmllbnRhdGlvbih2YWx1ZTogU3RlcHBlck9yaWVudGF0aW9uKSB7XG4gICAgLy8gVGhpcyBpcyBhIHByb3RlY3RlZCBtZXRob2Qgc28gdGhhdCBgTWF0U3RlcHBlcmAgY2FuIGhvb2sgaW50byBpdC5cbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IHZhbHVlO1xuXG4gICAgaWYgKHRoaXMuX2tleU1hbmFnZXIpIHtcbiAgICAgIHRoaXMuX2tleU1hbmFnZXIud2l0aFZlcnRpY2FsT3JpZW50YXRpb24odmFsdWUgPT09ICd2ZXJ0aWNhbCcpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9vcmllbnRhdGlvbjogU3RlcHBlck9yaWVudGF0aW9uID0gJ2hvcml6b250YWwnO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICApIHtcbiAgICB0aGlzLl9ncm91cElkID0gbmV4dElkKys7XG4gIH1cblxuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5fc3RlcHMuY2hhbmdlc1xuICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX3N0ZXBzKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKChzdGVwczogUXVlcnlMaXN0PENka1N0ZXA+KSA9PiB7XG4gICAgICAgIHRoaXMuc3RlcHMucmVzZXQoc3RlcHMuZmlsdGVyKHN0ZXAgPT4gc3RlcC5fc3RlcHBlciA9PT0gdGhpcykpO1xuICAgICAgICB0aGlzLnN0ZXBzLm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgICAgfSk7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgLy8gSWYgdGhlIHN0ZXAgaGVhZGVycyBhcmUgZGVmaW5lZCBvdXRzaWRlIG9mIHRoZSBgbmdGb3JgIHRoYXQgcmVuZGVycyB0aGUgc3RlcHMsIGxpa2UgaW4gdGhlXG4gICAgLy8gTWF0ZXJpYWwgc3RlcHBlciwgdGhleSB3b24ndCBhcHBlYXIgaW4gdGhlIGBRdWVyeUxpc3RgIGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkncmVcbiAgICAvLyByZW5kZXJlZCBpbiB0aGUgRE9NIHdoaWNoIHdpbGwgbGVhZCB0byBpbmNvcnJlY3Qga2V5Ym9hcmQgbmF2aWdhdGlvbi4gV2UgbmVlZCB0byBzb3J0XG4gICAgLy8gdGhlbSBtYW51YWxseSB0byBlbnN1cmUgdGhhdCB0aGV5J3JlIGNvcnJlY3QuIEFsdGVybmF0aXZlbHksIHdlIGNhbiBjaGFuZ2UgdGhlIE1hdGVyaWFsXG4gICAgLy8gdGVtcGxhdGUgdG8gaW5saW5lIHRoZSBoZWFkZXJzIGluIHRoZSBgbmdGb3JgLCBidXQgdGhhdCdsbCByZXN1bHQgaW4gYSBsb3Qgb2ZcbiAgICAvLyBjb2RlIGR1cGxpY2F0aW9uLiBTZWUgIzIzNTM5LlxuICAgIHRoaXMuX3N0ZXBIZWFkZXIuY2hhbmdlc1xuICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX3N0ZXBIZWFkZXIpLCB0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKGhlYWRlcnM6IFF1ZXJ5TGlzdDxDZGtTdGVwSGVhZGVyPikgPT4ge1xuICAgICAgICB0aGlzLl9zb3J0ZWRIZWFkZXJzLnJlc2V0KFxuICAgICAgICAgIGhlYWRlcnMudG9BcnJheSgpLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50UG9zaXRpb24gPSBhLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY29tcGFyZURvY3VtZW50UG9zaXRpb24oXG4gICAgICAgICAgICAgIGIuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vIGBjb21wYXJlRG9jdW1lbnRQb3NpdGlvbmAgcmV0dXJucyBhIGJpdG1hc2sgc28gd2UgaGF2ZSB0byB1c2UgYSBiaXR3aXNlIG9wZXJhdG9yLlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvY29tcGFyZURvY3VtZW50UG9zaXRpb25cbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1iaXR3aXNlXG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnRQb3NpdGlvbiAmIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRk9MTE9XSU5HID8gLTEgOiAxO1xuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLl9zb3J0ZWRIZWFkZXJzLm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgd2hpbGUgdGhlIHN0ZXAgaGVhZGVycyBhcmUgY29udGVudCBjaGlsZHJlbiBieSBkZWZhdWx0LCBhbnkgY29tcG9uZW50cyB0aGF0XG4gICAgLy8gZXh0ZW5kIHRoaXMgb25lIG1pZ2h0IGhhdmUgdGhlbSBhcyB2aWV3IGNoaWxkcmVuLiBXZSBpbml0aWFsaXplIHRoZSBrZXlib2FyZCBoYW5kbGluZyBpblxuICAgIC8vIEFmdGVyVmlld0luaXQgc28gd2UncmUgZ3VhcmFudGVlZCBmb3IgYm90aCB2aWV3IGFuZCBjb250ZW50IGNoaWxkcmVuIHRvIGJlIGRlZmluZWQuXG4gICAgdGhpcy5fa2V5TWFuYWdlciA9IG5ldyBGb2N1c0tleU1hbmFnZXI8Rm9jdXNhYmxlT3B0aW9uPih0aGlzLl9zb3J0ZWRIZWFkZXJzKVxuICAgICAgLndpdGhXcmFwKClcbiAgICAgIC53aXRoSG9tZUFuZEVuZCgpXG4gICAgICAud2l0aFZlcnRpY2FsT3JpZW50YXRpb24odGhpcy5fb3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpO1xuXG4gICAgKHRoaXMuX2RpciA/ICh0aGlzLl9kaXIuY2hhbmdlIGFzIE9ic2VydmFibGU8RGlyZWN0aW9uPikgOiBvYnNlcnZhYmxlT2Y8RGlyZWN0aW9uPigpKVxuICAgICAgLnBpcGUoc3RhcnRXaXRoKHRoaXMuX2xheW91dERpcmVjdGlvbigpKSwgdGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKGRpcmVjdGlvbiA9PiB0aGlzLl9rZXlNYW5hZ2VyLndpdGhIb3Jpem9udGFsT3JpZW50YXRpb24oZGlyZWN0aW9uKSk7XG5cbiAgICB0aGlzLl9rZXlNYW5hZ2VyLnVwZGF0ZUFjdGl2ZUl0ZW0odGhpcy5fc2VsZWN0ZWRJbmRleCk7XG5cbiAgICAvLyBObyBuZWVkIHRvIGB0YWtlVW50aWxgIGhlcmUsIGJlY2F1c2Ugd2UncmUgdGhlIG9uZXMgZGVzdHJveWluZyBgc3RlcHNgLlxuICAgIHRoaXMuc3RlcHMuY2hhbmdlcy5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBNYXRoLm1heCh0aGlzLl9zZWxlY3RlZEluZGV4IC0gMSwgMCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBUaGUgbG9naWMgd2hpY2ggYXNzZXJ0cyB0aGF0IHRoZSBzZWxlY3RlZCBpbmRleCBpcyB3aXRoaW4gYm91bmRzIGRvZXNuJ3QgcnVuIGJlZm9yZSB0aGVcbiAgICAvLyBzdGVwcyBhcmUgaW5pdGlhbGl6ZWQsIGJlY2F1c2Ugd2UgZG9uJ3QgaG93IG1hbnkgc3RlcHMgdGhlcmUgYXJlIHlldCBzbyB3ZSBtYXkgaGF2ZSBhblxuICAgIC8vIGludmFsaWQgaW5kZXggb24gaW5pdC4gSWYgdGhhdCdzIHRoZSBjYXNlLCBhdXRvLWNvcnJlY3QgdG8gdGhlIGRlZmF1bHQgc28gd2UgZG9uJ3QgdGhyb3cuXG4gICAgaWYgKCF0aGlzLl9pc1ZhbGlkSW5kZXgodGhpcy5fc2VsZWN0ZWRJbmRleCkpIHtcbiAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2tleU1hbmFnZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLnN0ZXBzLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9zb3J0ZWRIZWFkZXJzLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgYW5kIGZvY3VzZXMgdGhlIG5leHQgc3RlcCBpbiBsaXN0LiAqL1xuICBuZXh0KCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWluKHRoaXMuX3NlbGVjdGVkSW5kZXggKyAxLCB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLyoqIFNlbGVjdHMgYW5kIGZvY3VzZXMgdGhlIHByZXZpb3VzIHN0ZXAgaW4gbGlzdC4gKi9cbiAgcHJldmlvdXMoKTogdm9pZCB7XG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gTWF0aC5tYXgodGhpcy5fc2VsZWN0ZWRJbmRleCAtIDEsIDApO1xuICB9XG5cbiAgLyoqIFJlc2V0cyB0aGUgc3RlcHBlciB0byBpdHMgaW5pdGlhbCBzdGF0ZS4gTm90ZSB0aGF0IHRoaXMgaW5jbHVkZXMgY2xlYXJpbmcgZm9ybSBkYXRhLiAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleCgwKTtcbiAgICB0aGlzLnN0ZXBzLmZvckVhY2goc3RlcCA9PiBzdGVwLnJlc2V0KCkpO1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlZCgpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSB1bmlxdWUgaWQgZm9yIGVhY2ggc3RlcCBsYWJlbCBlbGVtZW50LiAqL1xuICBfZ2V0U3RlcExhYmVsSWQoaTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYGNkay1zdGVwLWxhYmVsLSR7dGhpcy5fZ3JvdXBJZH0tJHtpfWA7XG4gIH1cblxuICAvKiogUmV0dXJucyB1bmlxdWUgaWQgZm9yIGVhY2ggc3RlcCBjb250ZW50IGVsZW1lbnQuICovXG4gIF9nZXRTdGVwQ29udGVudElkKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBjZGstc3RlcC1jb250ZW50LSR7dGhpcy5fZ3JvdXBJZH0tJHtpfWA7XG4gIH1cblxuICAvKiogTWFya3MgdGhlIGNvbXBvbmVudCB0byBiZSBjaGFuZ2UgZGV0ZWN0ZWQuICovXG4gIF9zdGF0ZUNoYW5nZWQoKSB7XG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogUmV0dXJucyBwb3NpdGlvbiBzdGF0ZSBvZiB0aGUgc3RlcCB3aXRoIHRoZSBnaXZlbiBpbmRleC4gKi9cbiAgX2dldEFuaW1hdGlvbkRpcmVjdGlvbihpbmRleDogbnVtYmVyKTogU3RlcENvbnRlbnRQb3NpdGlvblN0YXRlIHtcbiAgICBjb25zdCBwb3NpdGlvbiA9IGluZGV4IC0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgICBpZiAocG9zaXRpb24gPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGF5b3V0RGlyZWN0aW9uKCkgPT09ICdydGwnID8gJ25leHQnIDogJ3ByZXZpb3VzJztcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xheW91dERpcmVjdGlvbigpID09PSAncnRsJyA/ICdwcmV2aW91cycgOiAnbmV4dCc7XG4gICAgfVxuICAgIHJldHVybiAnY3VycmVudCc7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgdHlwZSBvZiBpY29uIHRvIGJlIGRpc3BsYXllZC4gKi9cbiAgX2dldEluZGljYXRvclR5cGUoaW5kZXg6IG51bWJlciwgc3RhdGU6IFN0ZXBTdGF0ZSA9IFNURVBfU1RBVEUuTlVNQkVSKTogU3RlcFN0YXRlIHtcbiAgICBjb25zdCBzdGVwID0gdGhpcy5zdGVwcy50b0FycmF5KClbaW5kZXhdO1xuICAgIGNvbnN0IGlzQ3VycmVudFN0ZXAgPSB0aGlzLl9pc0N1cnJlbnRTdGVwKGluZGV4KTtcblxuICAgIHJldHVybiBzdGVwLl9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGVcbiAgICAgID8gdGhpcy5fZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXApXG4gICAgICA6IHRoaXMuX2dldEd1aWRlbGluZUxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXAsIHN0YXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldERlZmF1bHRJbmRpY2F0b3JMb2dpYyhzdGVwOiBDZGtTdGVwLCBpc0N1cnJlbnRTdGVwOiBib29sZWFuKTogU3RlcFN0YXRlIHtcbiAgICBpZiAoc3RlcC5fc2hvd0Vycm9yKCkgJiYgc3RlcC5oYXNFcnJvciAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRVJST1I7XG4gICAgfSBlbHNlIGlmICghc3RlcC5jb21wbGV0ZWQgfHwgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuTlVNQkVSO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RlcC5lZGl0YWJsZSA/IFNURVBfU1RBVEUuRURJVCA6IFNURVBfU1RBVEUuRE9ORTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRHdWlkZWxpbmVMb2dpYyhcbiAgICBzdGVwOiBDZGtTdGVwLFxuICAgIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4sXG4gICAgc3RhdGU6IFN0ZXBTdGF0ZSA9IFNURVBfU1RBVEUuTlVNQkVSLFxuICApOiBTdGVwU3RhdGUge1xuICAgIGlmIChzdGVwLl9zaG93RXJyb3IoKSAmJiBzdGVwLmhhc0Vycm9yICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FUlJPUjtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuY29tcGxldGVkICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5ET05FO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5jb21wbGV0ZWQgJiYgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5lZGl0YWJsZSAmJiBpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FRElUO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaXNDdXJyZW50U3RlcChpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IGluZGV4O1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50bHktZm9jdXNlZCBzdGVwIGhlYWRlci4gKi9cbiAgX2dldEZvY3VzSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleU1hbmFnZXIgPyB0aGlzLl9rZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCA6IHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChuZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RlcHNBcnJheSA9IHRoaXMuc3RlcHMudG9BcnJheSgpO1xuICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQoe1xuICAgICAgc2VsZWN0ZWRJbmRleDogbmV3SW5kZXgsXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogdGhpcy5fc2VsZWN0ZWRJbmRleCxcbiAgICAgIHNlbGVjdGVkU3RlcDogc3RlcHNBcnJheVtuZXdJbmRleF0sXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBzdGVwc0FycmF5W3RoaXMuX3NlbGVjdGVkSW5kZXhdLFxuICAgIH0pO1xuXG4gICAgLy8gSWYgZm9jdXMgaXMgaW5zaWRlIHRoZSBzdGVwcGVyLCBtb3ZlIGl0IHRvIHRoZSBuZXh0IGhlYWRlciwgb3RoZXJ3aXNlIGl0IG1heSBiZWNvbWVcbiAgICAvLyBsb3N0IHdoZW4gdGhlIGFjdGl2ZSBzdGVwIGNvbnRlbnQgaXMgaGlkZGVuLiBXZSBjYW4ndCBiZSBtb3JlIGdyYW51bGFyIHdpdGggdGhlIGNoZWNrXG4gICAgLy8gKGUuZy4gY2hlY2tpbmcgd2hldGhlciBmb2N1cyBpcyBpbnNpZGUgdGhlIGFjdGl2ZSBzdGVwKSwgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGFcbiAgICAvLyByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnRzIHRoYXQgYXJlIHJlbmRlcmluZyBvdXQgdGhlIGNvbnRlbnQuXG4gICAgdGhpcy5fY29udGFpbnNGb2N1cygpXG4gICAgICA/IHRoaXMuX2tleU1hbmFnZXIuc2V0QWN0aXZlSXRlbShuZXdJbmRleClcbiAgICAgIDogdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKG5ld0luZGV4KTtcblxuICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXhDaGFuZ2UuZW1pdCh0aGlzLl9zZWxlY3RlZEluZGV4KTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIF9vbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBoYXNNb2RpZmllciA9IGhhc01vZGlmaWVyS2V5KGV2ZW50KTtcbiAgICBjb25zdCBrZXlDb2RlID0gZXZlbnQua2V5Q29kZTtcbiAgICBjb25zdCBtYW5hZ2VyID0gdGhpcy5fa2V5TWFuYWdlcjtcblxuICAgIGlmIChcbiAgICAgIG1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ICE9IG51bGwgJiZcbiAgICAgICFoYXNNb2RpZmllciAmJlxuICAgICAgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKVxuICAgICkge1xuICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gbWFuYWdlci5hY3RpdmVJdGVtSW5kZXg7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYW5hZ2VyLnNldEZvY3VzT3JpZ2luKCdrZXlib2FyZCcpLm9uS2V5ZG93bihldmVudCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYW55Q29udHJvbHNJbnZhbGlkT3JQZW5kaW5nKGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fbGluZWFyICYmIGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLnN0ZXBzXG4gICAgICAgIC50b0FycmF5KClcbiAgICAgICAgLnNsaWNlKDAsIGluZGV4KVxuICAgICAgICAuc29tZShzdGVwID0+IHtcbiAgICAgICAgICBjb25zdCBjb250cm9sID0gc3RlcC5zdGVwQ29udHJvbDtcbiAgICAgICAgICBjb25zdCBpc0luY29tcGxldGUgPSBjb250cm9sXG4gICAgICAgICAgICA/IGNvbnRyb2wuaW52YWxpZCB8fCBjb250cm9sLnBlbmRpbmcgfHwgIXN0ZXAuaW50ZXJhY3RlZFxuICAgICAgICAgICAgOiAhc3RlcC5jb21wbGV0ZWQ7XG4gICAgICAgICAgcmV0dXJuIGlzSW5jb21wbGV0ZSAmJiAhc3RlcC5vcHRpb25hbCAmJiAhc3RlcC5fY29tcGxldGVkT3ZlcnJpZGU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX2xheW91dERpcmVjdGlvbigpOiBEaXJlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJyA/ICdydGwnIDogJ2x0cic7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIHN0ZXBwZXIgY29udGFpbnMgdGhlIGZvY3VzZWQgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY29udGFpbnNGb2N1cygpOiBib29sZWFuIHtcbiAgICBjb25zdCBzdGVwcGVyRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCBmb2N1c2VkRWxlbWVudCA9IF9nZXRGb2N1c2VkRWxlbWVudFBpZXJjZVNoYWRvd0RvbSgpO1xuICAgIHJldHVybiBzdGVwcGVyRWxlbWVudCA9PT0gZm9jdXNlZEVsZW1lbnQgfHwgc3RlcHBlckVsZW1lbnQuY29udGFpbnMoZm9jdXNlZEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBwYXNzZWQtaW4gaW5kZXggaXMgYSB2YWxpZCBzdGVwIGluZGV4LiAqL1xuICBwcml2YXRlIF9pc1ZhbGlkSW5kZXgoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpbmRleCA+IC0xICYmICghdGhpcy5zdGVwcyB8fCBpbmRleCA8IHRoaXMuc3RlcHMubGVuZ3RoKTtcbiAgfVxufVxuXG4vKipcbiAqIFNpbXBsaWZpZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gXCJBYnN0cmFjdENvbnRyb2xcIiBmcm9tIEBhbmd1bGFyL2Zvcm1zLlxuICogVXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gYnJpbmcgaW4gQGFuZ3VsYXIvZm9ybXMgZm9yIGEgc2luZ2xlIG9wdGlvbmFsIGludGVyZmFjZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIEFic3RyYWN0Q29udHJvbExpa2Uge1xuICBhc3luY1ZhbGlkYXRvcjogKChjb250cm9sOiBhbnkpID0+IGFueSkgfCBudWxsO1xuICBkaXJ0eTogYm9vbGVhbjtcbiAgZGlzYWJsZWQ6IGJvb2xlYW47XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsO1xuICBpbnZhbGlkOiBib29sZWFuO1xuICBwYXJlbnQ6IGFueTtcbiAgcGVuZGluZzogYm9vbGVhbjtcbiAgcHJpc3RpbmU6IGJvb2xlYW47XG4gIHJvb3Q6IEFic3RyYWN0Q29udHJvbExpa2U7XG4gIHN0YXR1czogc3RyaW5nO1xuICByZWFkb25seSBzdGF0dXNDaGFuZ2VzOiBPYnNlcnZhYmxlPGFueT47XG4gIHRvdWNoZWQ6IGJvb2xlYW47XG4gIHVudG91Y2hlZDogYm9vbGVhbjtcbiAgdXBkYXRlT246IGFueTtcbiAgdmFsaWQ6IGJvb2xlYW47XG4gIHZhbGlkYXRvcjogKChjb250cm9sOiBhbnkpID0+IGFueSkgfCBudWxsO1xuICB2YWx1ZTogYW55O1xuICByZWFkb25seSB2YWx1ZUNoYW5nZXM6IE9ic2VydmFibGU8YW55PjtcbiAgY2xlYXJBc3luY1ZhbGlkYXRvcnMoKTogdm9pZDtcbiAgY2xlYXJWYWxpZGF0b3JzKCk6IHZvaWQ7XG4gIGRpc2FibGUob3B0cz86IGFueSk6IHZvaWQ7XG4gIGVuYWJsZShvcHRzPzogYW55KTogdm9pZDtcbiAgZ2V0KHBhdGg6IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBBYnN0cmFjdENvbnRyb2xMaWtlIHwgbnVsbDtcbiAgZ2V0RXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogYW55O1xuICBoYXNFcnJvcihlcnJvckNvZGU6IHN0cmluZywgcGF0aD86IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBib29sZWFuO1xuICBtYXJrQWxsQXNUb3VjaGVkKCk6IHZvaWQ7XG4gIG1hcmtBc0RpcnR5KG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNQZW5kaW5nKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNQcmlzdGluZShvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzVG91Y2hlZChvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzVW50b3VjaGVkKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICByZXNldCh2YWx1ZT86IGFueSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG4gIHNldEFzeW5jVmFsaWRhdG9ycyhuZXdWYWxpZGF0b3I6IChjb250cm9sOiBhbnkpID0+IGFueSB8ICgoY29udHJvbDogYW55KSA9PiBhbnkpW10gfCBudWxsKTogdm9pZDtcbiAgc2V0RXJyb3JzKGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLCBvcHRzPzogYW55KTogdm9pZDtcbiAgc2V0UGFyZW50KHBhcmVudDogYW55KTogdm9pZDtcbiAgc2V0VmFsaWRhdG9ycyhuZXdWYWxpZGF0b3I6IChjb250cm9sOiBhbnkpID0+IGFueSB8ICgoY29udHJvbDogYW55KSA9PiBhbnkpW10gfCBudWxsKTogdm9pZDtcbiAgc2V0VmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG4gIHVwZGF0ZVZhbHVlQW5kVmFsaWRpdHkob3B0cz86IGFueSk6IHZvaWQ7XG4gIHBhdGNoVmFsdWUodmFsdWU6IGFueSwgb3B0aW9ucz86IGFueSk6IHZvaWQ7XG4gIHJlc2V0KGZvcm1TdGF0ZT86IGFueSwgb3B0aW9ucz86IGFueSk6IHZvaWQ7XG4gIHNldFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xufVxuIl19