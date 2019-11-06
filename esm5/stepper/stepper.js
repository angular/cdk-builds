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
var nextId = 0;
/** Change event emitted on selection changes. */
var StepperSelectionEvent = /** @class */ (function () {
    function StepperSelectionEvent() {
    }
    return StepperSelectionEvent;
}());
export { StepperSelectionEvent };
/** Enum to represent the different states of the steps. */
export var STEP_STATE = {
    NUMBER: 'number',
    EDIT: 'edit',
    DONE: 'done',
    ERROR: 'error'
};
/** InjectionToken that can be used to specify the global stepper options. */
export var STEPPER_GLOBAL_OPTIONS = new InjectionToken('STEPPER_GLOBAL_OPTIONS');
/**
 * InjectionToken that can be used to specify the global stepper options.
 * @deprecated Use `STEPPER_GLOBAL_OPTIONS` instead.
 * @breaking-change 8.0.0.
 */
export var MAT_STEPPER_GLOBAL_OPTIONS = STEPPER_GLOBAL_OPTIONS;
var CdkStep = /** @class */ (function () {
    /** @breaking-change 8.0.0 remove the `?` after `stepperOptions` */
    function CdkStep(_stepper, stepperOptions) {
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
    Object.defineProperty(CdkStep.prototype, "editable", {
        /** Whether the user can return to this step once it has been marked as completed. */
        get: function () {
            return this._editable;
        },
        set: function (value) {
            this._editable = coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkStep.prototype, "optional", {
        /** Whether the completion of step is optional. */
        get: function () {
            return this._optional;
        },
        set: function (value) {
            this._optional = coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkStep.prototype, "completed", {
        /** Whether step is marked as completed. */
        get: function () {
            return this._completedOverride == null ? this._getDefaultCompleted() : this._completedOverride;
        },
        set: function (value) {
            this._completedOverride = coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    CdkStep.prototype._getDefaultCompleted = function () {
        return this.stepControl ? this.stepControl.valid && this.interacted : this.interacted;
    };
    Object.defineProperty(CdkStep.prototype, "hasError", {
        /** Whether step has an error. */
        get: function () {
            return this._customError == null ? this._getDefaultError() : this._customError;
        },
        set: function (value) {
            this._customError = coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    CdkStep.prototype._getDefaultError = function () {
        return this.stepControl && this.stepControl.invalid && this.interacted;
    };
    /** Selects this step component. */
    CdkStep.prototype.select = function () {
        this._stepper.selected = this;
    };
    /** Resets the step to its initial state. Note that this includes resetting form data. */
    CdkStep.prototype.reset = function () {
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
    };
    CdkStep.prototype.ngOnChanges = function () {
        // Since basically all inputs of the MatStep get proxied through the view down to the
        // underlying MatStepHeader, we have to make sure that change detection runs correctly.
        this._stepper._stateChanged();
    };
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
    CdkStep.ctorParameters = function () { return [
        { type: CdkStepper, decorators: [{ type: Inject, args: [forwardRef(function () { return CdkStepper; }),] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [STEPPER_GLOBAL_OPTIONS,] }] }
    ]; };
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
}());
export { CdkStep };
var CdkStepper = /** @class */ (function () {
    function CdkStepper(_dir, _changeDetectorRef, 
    // @breaking-change 8.0.0 `_elementRef` and `_document` parameters to become required.
    _elementRef, _document) {
        this._dir = _dir;
        this._changeDetectorRef = _changeDetectorRef;
        this._elementRef = _elementRef;
        /** Emits when the component is destroyed. */
        this._destroyed = new Subject();
        /**
         * We need to store the steps in an Iterable due to strict template type checking with *ngFor and
         * https://github.com/angular/angular/issues/29842.
         */
        this._stepsArray = [];
        this._linear = false;
        this._selectedIndex = 0;
        /** Event emitted when the selected step has changed. */
        this.selectionChange = new EventEmitter();
        this._orientation = 'horizontal';
        this._groupId = nextId++;
        this._document = _document;
    }
    Object.defineProperty(CdkStepper.prototype, "steps", {
        /** The list of step components that the stepper is holding. */
        get: function () {
            return this._steps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkStepper.prototype, "linear", {
        /** Whether the validity of previous steps should be checked or not. */
        get: function () {
            return this._linear;
        },
        set: function (value) {
            this._linear = coerceBooleanProperty(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkStepper.prototype, "selectedIndex", {
        /** The index of the selected step. */
        get: function () {
            return this._selectedIndex;
        },
        set: function (index) {
            var newIndex = coerceNumberProperty(index);
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkStepper.prototype, "selected", {
        /** The step that is selected. */
        get: function () {
            // @breaking-change 8.0.0 Change return type to `CdkStep | undefined`.
            return this.steps ? this.steps.toArray()[this.selectedIndex] : undefined;
        },
        set: function (step) {
            this.selectedIndex = this.steps ? this.steps.toArray().indexOf(step) : -1;
        },
        enumerable: true,
        configurable: true
    });
    CdkStepper.prototype.ngAfterViewInit = function () {
        var _this = this;
        // Note that while the step headers are content children by default, any components that
        // extend this one might have them as view children. We initialize the keyboard handling in
        // AfterViewInit so we're guaranteed for both view and content children to be defined.
        this._keyManager = new FocusKeyManager(this._stepHeader)
            .withWrap()
            .withVerticalOrientation(this._orientation === 'vertical');
        (this._dir ? this._dir.change : observableOf())
            .pipe(startWith(this._layoutDirection()), takeUntil(this._destroyed))
            .subscribe(function (direction) { return _this._keyManager.withHorizontalOrientation(direction); });
        this._keyManager.updateActiveItem(this._selectedIndex);
        this.steps.changes.pipe(takeUntil(this._destroyed)).subscribe(function () {
            if (!_this.selected) {
                _this._selectedIndex = Math.max(_this._selectedIndex - 1, 0);
            }
        });
    };
    CdkStepper.prototype.ngOnDestroy = function () {
        this._destroyed.next();
        this._destroyed.complete();
    };
    /** Selects and focuses the next step in list. */
    CdkStepper.prototype.next = function () {
        this.selectedIndex = Math.min(this._selectedIndex + 1, this.steps.length - 1);
    };
    /** Selects and focuses the previous step in list. */
    CdkStepper.prototype.previous = function () {
        this.selectedIndex = Math.max(this._selectedIndex - 1, 0);
    };
    /** Resets the stepper to its initial state. Note that this includes clearing form data. */
    CdkStepper.prototype.reset = function () {
        this._updateSelectedItemIndex(0);
        this.steps.forEach(function (step) { return step.reset(); });
        this._stateChanged();
    };
    /** Returns a unique id for each step label element. */
    CdkStepper.prototype._getStepLabelId = function (i) {
        return "cdk-step-label-" + this._groupId + "-" + i;
    };
    /** Returns unique id for each step content element. */
    CdkStepper.prototype._getStepContentId = function (i) {
        return "cdk-step-content-" + this._groupId + "-" + i;
    };
    /** Marks the component to be change detected. */
    CdkStepper.prototype._stateChanged = function () {
        this._changeDetectorRef.markForCheck();
    };
    /** Returns position state of the step with the given index. */
    CdkStepper.prototype._getAnimationDirection = function (index) {
        var position = index - this._selectedIndex;
        if (position < 0) {
            return this._layoutDirection() === 'rtl' ? 'next' : 'previous';
        }
        else if (position > 0) {
            return this._layoutDirection() === 'rtl' ? 'previous' : 'next';
        }
        return 'current';
    };
    /** Returns the type of icon to be displayed. */
    CdkStepper.prototype._getIndicatorType = function (index, state) {
        if (state === void 0) { state = STEP_STATE.NUMBER; }
        var step = this.steps.toArray()[index];
        var isCurrentStep = this._isCurrentStep(index);
        return step._displayDefaultIndicatorType ? this._getDefaultIndicatorLogic(step, isCurrentStep) :
            this._getGuidelineLogic(step, isCurrentStep, state);
    };
    CdkStepper.prototype._getDefaultIndicatorLogic = function (step, isCurrentStep) {
        if (step._showError && step.hasError && !isCurrentStep) {
            return STEP_STATE.ERROR;
        }
        else if (!step.completed || isCurrentStep) {
            return STEP_STATE.NUMBER;
        }
        else {
            return step.editable ? STEP_STATE.EDIT : STEP_STATE.DONE;
        }
    };
    CdkStepper.prototype._getGuidelineLogic = function (step, isCurrentStep, state) {
        if (state === void 0) { state = STEP_STATE.NUMBER; }
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
    };
    CdkStepper.prototype._isCurrentStep = function (index) {
        return this._selectedIndex === index;
    };
    /** Returns the index of the currently-focused step header. */
    CdkStepper.prototype._getFocusIndex = function () {
        return this._keyManager ? this._keyManager.activeItemIndex : this._selectedIndex;
    };
    CdkStepper.prototype._updateSelectedItemIndex = function (newIndex) {
        var stepsArray = this.steps.toArray();
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
    };
    CdkStepper.prototype._onKeydown = function (event) {
        var hasModifier = hasModifierKey(event);
        var keyCode = event.keyCode;
        var manager = this._keyManager;
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
    };
    CdkStepper.prototype._anyControlsInvalidOrPending = function (index) {
        var steps = this.steps.toArray();
        steps[this._selectedIndex].interacted = true;
        if (this._linear && index >= 0) {
            return steps.slice(0, index).some(function (step) {
                var control = step.stepControl;
                var isIncomplete = control ? (control.invalid || control.pending || !step.interacted) : !step.completed;
                return isIncomplete && !step.optional && !step._completedOverride;
            });
        }
        return false;
    };
    CdkStepper.prototype._layoutDirection = function () {
        return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
    };
    /** Checks whether the stepper contains the focused element. */
    CdkStepper.prototype._containsFocus = function () {
        if (!this._document || !this._elementRef) {
            return false;
        }
        var stepperElement = this._elementRef.nativeElement;
        var focusedElement = this._document.activeElement;
        return stepperElement === focusedElement || stepperElement.contains(focusedElement);
    };
    CdkStepper.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkStepper]',
                    exportAs: 'cdkStepper',
                },] }
    ];
    /** @nocollapse */
    CdkStepper.ctorParameters = function () { return [
        { type: Directionality, decorators: [{ type: Optional }] },
        { type: ChangeDetectorRef },
        { type: ElementRef },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ]; };
    CdkStepper.propDecorators = {
        _steps: [{ type: ContentChildren, args: [CdkStep, { descendants: true },] }],
        _stepHeader: [{ type: ContentChildren, args: [CdkStepHeader, { descendants: true },] }],
        linear: [{ type: Input }],
        selectedIndex: [{ type: Input }],
        selected: [{ type: Input }],
        selectionChange: [{ type: Output }]
    };
    return CdkStepper;
}());
export { CdkStepper };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc3RlcHBlci9zdGVwcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBa0IsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFZLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFFTCx1QkFBdUIsRUFDdkIsaUJBQWlCLEVBQ2pCLFNBQVMsRUFDVCxZQUFZLEVBQ1osZUFBZSxFQUNmLFNBQVMsRUFDVCxVQUFVLEVBQ1YsWUFBWSxFQUNaLFVBQVUsRUFDVixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFHTCxRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxXQUFXLEVBQ1gsU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQWEsRUFBRSxJQUFJLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDN0QsT0FBTyxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVwRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFMUMsNkRBQTZEO0FBQzdELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQVdmLGlEQUFpRDtB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O0lBQ2hFLENBQUM7SUFFRCwrREFBK0Q7SUFDdkQsbUNBQWMsR0FBdEI7UUFDRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDeEMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQ3RELElBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO1FBQ3BELE9BQU8sY0FBYyxLQUFLLGNBQWMsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7O2dCQTdSRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGNBQWM7b0JBQ3hCLFFBQVEsRUFBRSxZQUFZO2lCQUN2Qjs7OztnQkF6T2tCLGNBQWMsdUJBc1UxQixRQUFRO2dCQS9UYixpQkFBaUI7Z0JBS2pCLFVBQVU7Z0RBNFQwQyxNQUFNLFNBQUMsUUFBUTs7O3lCQTVFbEUsZUFBZSxTQUFDLE9BQU8sRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUM7OEJBa0I1QyxlQUFlLFNBQUMsYUFBYSxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQzt5QkFHbEQsS0FBSztnQ0FVTCxLQUFLOzJCQXdCTCxLQUFLO2tDQVVMLE1BQU07O0lBOE1ULGlCQUFDO0NBQUEsQUFyU0QsSUFxU0M7U0FqU1ksVUFBVSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0ZvY3VzYWJsZU9wdGlvbiwgRm9jdXNLZXlNYW5hZ2VyfSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5LCBjb2VyY2VOdW1iZXJQcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7RU5ELCBFTlRFUiwgaGFzTW9kaWZpZXJLZXksIEhPTUUsIFNQQUNFfSBmcm9tICdAYW5ndWxhci9jZGsva2V5Y29kZXMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBDb250ZW50Q2hpbGQsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgUXVlcnlMaXN0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGUsIG9mIGFzIG9ic2VydmFibGVPZiwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3N0YXJ0V2l0aCwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q2RrU3RlcEhlYWRlcn0gZnJvbSAnLi9zdGVwLWhlYWRlcic7XG5pbXBvcnQge0Nka1N0ZXBMYWJlbH0gZnJvbSAnLi9zdGVwLWxhYmVsJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIHN0ZXBwZXIgY29tcG9uZW50LiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogUG9zaXRpb24gc3RhdGUgb2YgdGhlIGNvbnRlbnQgb2YgZWFjaCBzdGVwIGluIHN0ZXBwZXIgdGhhdCBpcyB1c2VkIGZvciB0cmFuc2l0aW9uaW5nXG4gKiB0aGUgY29udGVudCBpbnRvIGNvcnJlY3QgcG9zaXRpb24gdXBvbiBzdGVwIHNlbGVjdGlvbiBjaGFuZ2UuXG4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSA9ICdwcmV2aW91cyd8J2N1cnJlbnQnfCduZXh0JztcblxuLyoqIFBvc3NpYmxlIG9yaWVudGF0aW9uIG9mIGEgc3RlcHBlci4gKi9cbmV4cG9ydCB0eXBlIFN0ZXBwZXJPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJ3wndmVydGljYWwnO1xuXG4vKiogQ2hhbmdlIGV2ZW50IGVtaXR0ZWQgb24gc2VsZWN0aW9uIGNoYW5nZXMuICovXG5leHBvcnQgY2xhc3MgU3RlcHBlclNlbGVjdGlvbkV2ZW50IHtcbiAgLyoqIEluZGV4IG9mIHRoZSBzdGVwIG5vdyBzZWxlY3RlZC4gKi9cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgc3RlcCBwcmV2aW91c2x5IHNlbGVjdGVkLiAqL1xuICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3RlcCBpbnN0YW5jZSBub3cgc2VsZWN0ZWQuICovXG4gIHNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcblxuICAvKiogVGhlIHN0ZXAgaW5zdGFuY2UgcHJldmlvdXNseSBzZWxlY3RlZC4gKi9cbiAgcHJldmlvdXNseVNlbGVjdGVkU3RlcDogQ2RrU3RlcDtcbn1cblxuLyoqIFRoZSBzdGF0ZSBvZiBlYWNoIHN0ZXAuICovXG5leHBvcnQgdHlwZSBTdGVwU3RhdGUgPSAnbnVtYmVyJ3wnZWRpdCd8J2RvbmUnfCdlcnJvcid8c3RyaW5nO1xuXG4vKiogRW51bSB0byByZXByZXNlbnQgdGhlIGRpZmZlcmVudCBzdGF0ZXMgb2YgdGhlIHN0ZXBzLiAqL1xuZXhwb3J0IGNvbnN0IFNURVBfU1RBVEUgPSB7XG4gIE5VTUJFUjogJ251bWJlcicsXG4gIEVESVQ6ICdlZGl0JyxcbiAgRE9ORTogJ2RvbmUnLFxuICBFUlJPUjogJ2Vycm9yJ1xufTtcblxuLyoqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy4gKi9cbmV4cG9ydCBjb25zdCBTVEVQUEVSX0dMT0JBTF9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPFN0ZXBwZXJPcHRpb25zPignU1RFUFBFUl9HTE9CQUxfT1BUSU9OUycpO1xuXG4vKipcbiAqIEluamVjdGlvblRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3BlY2lmeSB0aGUgZ2xvYmFsIHN0ZXBwZXIgb3B0aW9ucy5cbiAqIEBkZXByZWNhdGVkIFVzZSBgU1RFUFBFUl9HTE9CQUxfT1BUSU9OU2AgaW5zdGVhZC5cbiAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjAuXG4gKi9cbmV4cG9ydCBjb25zdCBNQVRfU1RFUFBFUl9HTE9CQUxfT1BUSU9OUyA9IFNURVBQRVJfR0xPQkFMX09QVElPTlM7XG5cbi8qKiBDb25maWd1cmFibGUgb3B0aW9ucyBmb3Igc3RlcHBlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RlcHBlck9wdGlvbnMge1xuICAvKipcbiAgICogV2hldGhlciB0aGUgc3RlcHBlciBzaG91bGQgZGlzcGxheSBhbiBlcnJvciBzdGF0ZSBvciBub3QuXG4gICAqIERlZmF1bHQgYmVoYXZpb3IgaXMgYXNzdW1lZCB0byBiZSBmYWxzZS5cbiAgICovXG4gIHNob3dFcnJvcj86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHN0ZXBwZXIgc2hvdWxkIGRpc3BsYXkgdGhlIGRlZmF1bHQgaW5kaWNhdG9yIHR5cGVcbiAgICogb3Igbm90LlxuICAgKiBEZWZhdWx0IGJlaGF2aW9yIGlzIGFzc3VtZWQgdG8gYmUgdHJ1ZS5cbiAgICovXG4gIGRpc3BsYXlEZWZhdWx0SW5kaWNhdG9yVHlwZT86IGJvb2xlYW47XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2Nkay1zdGVwJyxcbiAgZXhwb3J0QXM6ICdjZGtTdGVwJyxcbiAgdGVtcGxhdGU6ICc8bmctdGVtcGxhdGU+PG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PjwvbmctdGVtcGxhdGU+JyxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXAgaW1wbGVtZW50cyBPbkNoYW5nZXMge1xuICBwcml2YXRlIF9zdGVwcGVyT3B0aW9uczogU3RlcHBlck9wdGlvbnM7XG4gIF9zaG93RXJyb3I6IGJvb2xlYW47XG4gIF9kaXNwbGF5RGVmYXVsdEluZGljYXRvclR5cGU6IGJvb2xlYW47XG5cbiAgLyoqIFRlbXBsYXRlIGZvciBzdGVwIGxhYmVsIGlmIGl0IGV4aXN0cy4gKi9cbiAgQENvbnRlbnRDaGlsZChDZGtTdGVwTGFiZWwpIHN0ZXBMYWJlbDogQ2RrU3RlcExhYmVsO1xuXG4gIC8qKiBUZW1wbGF0ZSBmb3Igc3RlcCBjb250ZW50LiAqL1xuICBAVmlld0NoaWxkKFRlbXBsYXRlUmVmLCB7c3RhdGljOiB0cnVlfSkgY29udGVudDogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKiogVGhlIHRvcCBsZXZlbCBhYnN0cmFjdCBjb250cm9sIG9mIHRoZSBzdGVwLiAqL1xuICBASW5wdXQoKSBzdGVwQ29udHJvbDogQWJzdHJhY3RDb250cm9sTGlrZTtcblxuICAvKiogV2hldGhlciB1c2VyIGhhcyBzZWVuIHRoZSBleHBhbmRlZCBzdGVwIGNvbnRlbnQgb3Igbm90LiAqL1xuICBpbnRlcmFjdGVkID0gZmFsc2U7XG5cbiAgLyoqIFBsYWluIHRleHQgbGFiZWwgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIGxhYmVsOiBzdHJpbmc7XG5cbiAgLyoqIEVycm9yIG1lc3NhZ2UgdG8gZGlzcGxheSB3aGVuIHRoZXJlJ3MgYW4gZXJyb3IuICovXG4gIEBJbnB1dCgpIGVycm9yTWVzc2FnZTogc3RyaW5nO1xuXG4gIC8qKiBBcmlhIGxhYmVsIGZvciB0aGUgdGFiLiAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWwnKSBhcmlhTGFiZWw6IHN0cmluZztcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHRoYXQgdGhlIHRhYiBpcyBsYWJlbGxlZCBieS5cbiAgICogV2lsbCBiZSBjbGVhcmVkIGlmIGBhcmlhLWxhYmVsYCBpcyBzZXQgYXQgdGhlIHNhbWUgdGltZS5cbiAgICovXG4gIEBJbnB1dCgnYXJpYS1sYWJlbGxlZGJ5JykgYXJpYUxhYmVsbGVkYnk6IHN0cmluZztcblxuICAvKiogU3RhdGUgb2YgdGhlIHN0ZXAuICovXG4gIEBJbnB1dCgpIHN0YXRlOiBTdGVwU3RhdGU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHVzZXIgY2FuIHJldHVybiB0byB0aGlzIHN0ZXAgb25jZSBpdCBoYXMgYmVlbiBtYXJrZWQgYXMgY29tcGxldGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZWRpdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2VkaXRhYmxlO1xuICB9XG4gIHNldCBlZGl0YWJsZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2VkaXRhYmxlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9lZGl0YWJsZSA9IHRydWU7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNvbXBsZXRpb24gb2Ygc3RlcCBpcyBvcHRpb25hbC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IG9wdGlvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25hbDtcbiAgfVxuICBzZXQgb3B0aW9uYWwodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9vcHRpb25hbCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfb3B0aW9uYWwgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciBzdGVwIGlzIG1hcmtlZCBhcyBjb21wbGV0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBjb21wbGV0ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID09IG51bGwgPyB0aGlzLl9nZXREZWZhdWx0Q29tcGxldGVkKCkgOiB0aGlzLl9jb21wbGV0ZWRPdmVycmlkZTtcbiAgfVxuICBzZXQgY29tcGxldGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fY29tcGxldGVkT3ZlcnJpZGUgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIF9jb21wbGV0ZWRPdmVycmlkZTogYm9vbGVhbnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9nZXREZWZhdWx0Q29tcGxldGVkKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sID8gdGhpcy5zdGVwQ29udHJvbC52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQgOiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogV2hldGhlciBzdGVwIGhhcyBhbiBlcnJvci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGhhc0Vycm9yKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jdXN0b21FcnJvciA9PSBudWxsID8gdGhpcy5fZ2V0RGVmYXVsdEVycm9yKCkgOiB0aGlzLl9jdXN0b21FcnJvcjtcbiAgfVxuICBzZXQgaGFzRXJyb3IodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9jdXN0b21FcnJvciA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfY3VzdG9tRXJyb3I6IGJvb2xlYW58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEVycm9yKCkge1xuICAgIHJldHVybiB0aGlzLnN0ZXBDb250cm9sICYmIHRoaXMuc3RlcENvbnRyb2wuaW52YWxpZCAmJiB0aGlzLmludGVyYWN0ZWQ7XG4gIH1cblxuICAvKiogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCByZW1vdmUgdGhlIGA/YCBhZnRlciBgc3RlcHBlck9wdGlvbnNgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQEluamVjdChmb3J3YXJkUmVmKCgpID0+IENka1N0ZXBwZXIpKSBwcml2YXRlIF9zdGVwcGVyOiBDZGtTdGVwcGVyLFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChTVEVQUEVSX0dMT0JBTF9PUFRJT05TKSBzdGVwcGVyT3B0aW9ucz86IFN0ZXBwZXJPcHRpb25zKSB7XG4gICAgdGhpcy5fc3RlcHBlck9wdGlvbnMgPSBzdGVwcGVyT3B0aW9ucyA/IHN0ZXBwZXJPcHRpb25zIDoge307XG4gICAgdGhpcy5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID0gdGhpcy5fc3RlcHBlck9wdGlvbnMuZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlICE9PSBmYWxzZTtcbiAgICB0aGlzLl9zaG93RXJyb3IgPSAhIXRoaXMuX3N0ZXBwZXJPcHRpb25zLnNob3dFcnJvcjtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIHRoaXMgc3RlcCBjb21wb25lbnQuICovXG4gIHNlbGVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdGVwcGVyLnNlbGVjdGVkID0gdGhpcztcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXAgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIHJlc2V0dGluZyBmb3JtIGRhdGEuICovXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuaW50ZXJhY3RlZCA9IGZhbHNlO1xuXG4gICAgaWYgKHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlZE92ZXJyaWRlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2N1c3RvbUVycm9yICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX2N1c3RvbUVycm9yID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RlcENvbnRyb2wpIHtcbiAgICAgIHRoaXMuc3RlcENvbnRyb2wucmVzZXQoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uQ2hhbmdlcygpIHtcbiAgICAvLyBTaW5jZSBiYXNpY2FsbHkgYWxsIGlucHV0cyBvZiB0aGUgTWF0U3RlcCBnZXQgcHJveGllZCB0aHJvdWdoIHRoZSB2aWV3IGRvd24gdG8gdGhlXG4gICAgLy8gdW5kZXJseWluZyBNYXRTdGVwSGVhZGVyLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gcnVucyBjb3JyZWN0bHkuXG4gICAgdGhpcy5fc3RlcHBlci5fc3RhdGVDaGFuZ2VkKCk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZWRpdGFibGU6IGJvb2xlYW4gfCBzdHJpbmc7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNFcnJvcjogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX29wdGlvbmFsOiBib29sZWFuIHwgc3RyaW5nO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfY29tcGxldGVkOiBib29sZWFuIHwgc3RyaW5nO1xufVxuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrU3RlcHBlcl0nLFxuICBleHBvcnRBczogJ2Nka1N0ZXBwZXInLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtTdGVwcGVyIGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBkZXN0cm95ZWQuICovXG4gIHByb3RlY3RlZCBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogVXNlZCBmb3IgbWFuYWdpbmcga2V5Ym9hcmQgZm9jdXMuICovXG4gIHByaXZhdGUgX2tleU1hbmFnZXI6IEZvY3VzS2V5TWFuYWdlcjxGb2N1c2FibGVPcHRpb24+O1xuXG4gIC8qKlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wIFJlbW92ZSBgfCB1bmRlZmluZWRgIG9uY2UgdGhlIGBfZG9jdW1lbnRgXG4gICAqIGNvbnN0cnVjdG9yIHBhcmFtIGlzIHJlcXVpcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50fHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2Ygc3RlcCBjb21wb25lbnRzIHRoYXQgdGhlIHN0ZXBwZXIgaXMgaG9sZGluZy5cbiAgICogQGRlcHJlY2F0ZWQgdXNlIGBzdGVwc2AgaW5zdGVhZFxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDkuMC4wIHJlbW92ZSB0aGlzIHByb3BlcnR5XG4gICAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1N0ZXAsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9zdGVwczogUXVlcnlMaXN0PENka1N0ZXA+O1xuXG4gIC8qKlxuICAgKiBXZSBuZWVkIHRvIHN0b3JlIHRoZSBzdGVwcyBpbiBhbiBJdGVyYWJsZSBkdWUgdG8gc3RyaWN0IHRlbXBsYXRlIHR5cGUgY2hlY2tpbmcgd2l0aCAqbmdGb3IgYW5kXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzI5ODQyLlxuICAgKi9cbiAgX3N0ZXBzQXJyYXk6IENka1N0ZXBbXSA9IFtdO1xuXG4gIC8qKiBUaGUgbGlzdCBvZiBzdGVwIGNvbXBvbmVudHMgdGhhdCB0aGUgc3RlcHBlciBpcyBob2xkaW5nLiAqL1xuICBnZXQgc3RlcHMoKTogUXVlcnlMaXN0PENka1N0ZXA+IHtcbiAgICByZXR1cm4gdGhpcy5fc3RlcHM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2Ygc3RlcCBoZWFkZXJzIG9mIHRoZSBzdGVwcyBpbiB0aGUgc3RlcHBlci5cbiAgICogQGRlcHJlY2F0ZWQgVHlwZSB0byBiZSBjaGFuZ2VkIHRvIGBRdWVyeUxpc3Q8Q2RrU3RlcEhlYWRlcj5gLlxuICAgKiBAYnJlYWtpbmctY2hhbmdlIDguMC4wXG4gICAqL1xuICBAQ29udGVudENoaWxkcmVuKENka1N0ZXBIZWFkZXIsIHtkZXNjZW5kYW50czogdHJ1ZX0pIF9zdGVwSGVhZGVyOiBRdWVyeUxpc3Q8Rm9jdXNhYmxlT3B0aW9uPjtcblxuICAvKiogV2hldGhlciB0aGUgdmFsaWRpdHkgb2YgcHJldmlvdXMgc3RlcHMgc2hvdWxkIGJlIGNoZWNrZWQgb3Igbm90LiAqL1xuICBASW5wdXQoKVxuICBnZXQgbGluZWFyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9saW5lYXI7XG4gIH1cbiAgc2V0IGxpbmVhcih2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX2xpbmVhciA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfbGluZWFyID0gZmFsc2U7XG5cbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgc2VsZWN0ZWQgc3RlcC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gIH1cbiAgc2V0IHNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gY29lcmNlTnVtYmVyUHJvcGVydHkoaW5kZXgpO1xuXG4gICAgaWYgKHRoaXMuc3RlcHMpIHtcbiAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBpbmRleCBjYW4ndCBiZSBvdXQgb2YgYm91bmRzLlxuICAgICAgaWYgKG5ld0luZGV4IDwgMCB8fCBuZXdJbmRleCA+IHRoaXMuc3RlcHMubGVuZ3RoIC0gMSkge1xuICAgICAgICB0aHJvdyBFcnJvcignY2RrU3RlcHBlcjogQ2Fubm90IGFzc2lnbiBvdXQtb2YtYm91bmRzIHZhbHVlIHRvIGBzZWxlY3RlZEluZGV4YC4nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggIT0gbmV3SW5kZXggJiYgIXRoaXMuX2FueUNvbnRyb2xzSW52YWxpZE9yUGVuZGluZyhuZXdJbmRleCkgJiZcbiAgICAgICAgICAobmV3SW5kZXggPj0gdGhpcy5fc2VsZWN0ZWRJbmRleCB8fCB0aGlzLnN0ZXBzLnRvQXJyYXkoKVtuZXdJbmRleF0uZWRpdGFibGUpKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkSXRlbUluZGV4KGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG5ld0luZGV4O1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9zZWxlY3RlZEluZGV4ID0gMDtcblxuICAvKiogVGhlIHN0ZXAgdGhhdCBpcyBzZWxlY3RlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IHNlbGVjdGVkKCk6IENka1N0ZXAge1xuICAgIC8vIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgQ2hhbmdlIHJldHVybiB0eXBlIHRvIGBDZGtTdGVwIHwgdW5kZWZpbmVkYC5cbiAgICByZXR1cm4gdGhpcy5zdGVwcyA/IHRoaXMuc3RlcHMudG9BcnJheSgpW3RoaXMuc2VsZWN0ZWRJbmRleF0gOiB1bmRlZmluZWQhO1xuICB9XG4gIHNldCBzZWxlY3RlZChzdGVwOiBDZGtTdGVwKSB7XG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5zdGVwcyA/IHRoaXMuc3RlcHMudG9BcnJheSgpLmluZGV4T2Yoc3RlcCkgOiAtMTtcbiAgfVxuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHNlbGVjdGVkIHN0ZXAgaGFzIGNoYW5nZWQuICovXG4gIEBPdXRwdXQoKVxuICBzZWxlY3Rpb25DaGFuZ2U6IEV2ZW50RW1pdHRlcjxTdGVwcGVyU2VsZWN0aW9uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxTdGVwcGVyU2VsZWN0aW9uRXZlbnQ+KCk7XG5cbiAgLyoqIFVzZWQgdG8gdHJhY2sgdW5pcXVlIElEIGZvciBlYWNoIHN0ZXBwZXIgY29tcG9uZW50LiAqL1xuICBfZ3JvdXBJZDogbnVtYmVyO1xuXG4gIHByb3RlY3RlZCBfb3JpZW50YXRpb246IFN0ZXBwZXJPcmllbnRhdGlvbiA9ICdob3Jpem9udGFsJztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHksIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgIC8vIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgYF9lbGVtZW50UmVmYCBhbmQgYF9kb2N1bWVudGAgcGFyYW1ldGVycyB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICBwcml2YXRlIF9lbGVtZW50UmVmPzogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudD86IGFueSkge1xuICAgIHRoaXMuX2dyb3VwSWQgPSBuZXh0SWQrKztcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICAvLyBOb3RlIHRoYXQgd2hpbGUgdGhlIHN0ZXAgaGVhZGVycyBhcmUgY29udGVudCBjaGlsZHJlbiBieSBkZWZhdWx0LCBhbnkgY29tcG9uZW50cyB0aGF0XG4gICAgLy8gZXh0ZW5kIHRoaXMgb25lIG1pZ2h0IGhhdmUgdGhlbSBhcyB2aWV3IGNoaWxkcmVuLiBXZSBpbml0aWFsaXplIHRoZSBrZXlib2FyZCBoYW5kbGluZyBpblxuICAgIC8vIEFmdGVyVmlld0luaXQgc28gd2UncmUgZ3VhcmFudGVlZCBmb3IgYm90aCB2aWV3IGFuZCBjb250ZW50IGNoaWxkcmVuIHRvIGJlIGRlZmluZWQuXG4gICAgdGhpcy5fa2V5TWFuYWdlciA9IG5ldyBGb2N1c0tleU1hbmFnZXI8Rm9jdXNhYmxlT3B0aW9uPih0aGlzLl9zdGVwSGVhZGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpdGhXcmFwKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aXRoVmVydGljYWxPcmllbnRhdGlvbih0aGlzLl9vcmllbnRhdGlvbiA9PT0gJ3ZlcnRpY2FsJyk7XG5cbiAgICAodGhpcy5fZGlyID8gKHRoaXMuX2Rpci5jaGFuZ2UgYXMgT2JzZXJ2YWJsZTxEaXJlY3Rpb24+KSA6IG9ic2VydmFibGVPZjxEaXJlY3Rpb24+KCkpXG4gICAgICAgIC5waXBlKHN0YXJ0V2l0aCh0aGlzLl9sYXlvdXREaXJlY3Rpb24oKSksIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpKVxuICAgICAgICAuc3Vic2NyaWJlKGRpcmVjdGlvbiA9PiB0aGlzLl9rZXlNYW5hZ2VyLndpdGhIb3Jpem9udGFsT3JpZW50YXRpb24oZGlyZWN0aW9uKSk7XG5cbiAgICB0aGlzLl9rZXlNYW5hZ2VyLnVwZGF0ZUFjdGl2ZUl0ZW0odGhpcy5fc2VsZWN0ZWRJbmRleCk7XG5cbiAgICB0aGlzLnN0ZXBzLmNoYW5nZXMucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zZWxlY3RlZCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gTWF0aC5tYXgodGhpcy5fc2VsZWN0ZWRJbmRleCAtIDEsIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIGFuZCBmb2N1c2VzIHRoZSBuZXh0IHN0ZXAgaW4gbGlzdC4gKi9cbiAgbmV4dCgpOiB2b2lkIHtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBNYXRoLm1pbih0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSwgdGhpcy5zdGVwcy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIC8qKiBTZWxlY3RzIGFuZCBmb2N1c2VzIHRoZSBwcmV2aW91cyBzdGVwIGluIGxpc3QuICovXG4gIHByZXZpb3VzKCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWF4KHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxLCAwKTtcbiAgfVxuXG4gIC8qKiBSZXNldHMgdGhlIHN0ZXBwZXIgdG8gaXRzIGluaXRpYWwgc3RhdGUuIE5vdGUgdGhhdCB0aGlzIGluY2x1ZGVzIGNsZWFyaW5nIGZvcm0gZGF0YS4gKi9cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRJdGVtSW5kZXgoMCk7XG4gICAgdGhpcy5zdGVwcy5mb3JFYWNoKHN0ZXAgPT4gc3RlcC5yZXNldCgpKTtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgdW5pcXVlIGlkIGZvciBlYWNoIHN0ZXAgbGFiZWwgZWxlbWVudC4gKi9cbiAgX2dldFN0ZXBMYWJlbElkKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBjZGstc3RlcC1sYWJlbC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdW5pcXVlIGlkIGZvciBlYWNoIHN0ZXAgY29udGVudCBlbGVtZW50LiAqL1xuICBfZ2V0U3RlcENvbnRlbnRJZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgY2RrLXN0ZXAtY29udGVudC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIE1hcmtzIHRoZSBjb21wb25lbnQgdG8gYmUgY2hhbmdlIGRldGVjdGVkLiAqL1xuICBfc3RhdGVDaGFuZ2VkKCkge1xuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgcG9zaXRpb24gc3RhdGUgb2YgdGhlIHN0ZXAgd2l0aCB0aGUgZ2l2ZW4gaW5kZXguICovXG4gIF9nZXRBbmltYXRpb25EaXJlY3Rpb24oaW5kZXg6IG51bWJlcik6IFN0ZXBDb250ZW50UG9zaXRpb25TdGF0ZSB7XG4gICAgY29uc3QgcG9zaXRpb24gPSBpbmRleCAtIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xheW91dERpcmVjdGlvbigpID09PSAncnRsJyA/ICduZXh0JyA6ICdwcmV2aW91cyc7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9sYXlvdXREaXJlY3Rpb24oKSA9PT0gJ3J0bCcgPyAncHJldmlvdXMnIDogJ25leHQnO1xuICAgIH1cbiAgICByZXR1cm4gJ2N1cnJlbnQnO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHR5cGUgb2YgaWNvbiB0byBiZSBkaXNwbGF5ZWQuICovXG4gIF9nZXRJbmRpY2F0b3JUeXBlKGluZGV4OiBudW1iZXIsIHN0YXRlOiBTdGVwU3RhdGUgPSBTVEVQX1NUQVRFLk5VTUJFUik6IFN0ZXBTdGF0ZSB7XG4gICAgY29uc3Qgc3RlcCA9IHRoaXMuc3RlcHMudG9BcnJheSgpW2luZGV4XTtcbiAgICBjb25zdCBpc0N1cnJlbnRTdGVwID0gdGhpcy5faXNDdXJyZW50U3RlcChpbmRleCk7XG5cbiAgICByZXR1cm4gc3RlcC5fZGlzcGxheURlZmF1bHRJbmRpY2F0b3JUeXBlID8gdGhpcy5fZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXAsIGlzQ3VycmVudFN0ZXApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2V0R3VpZGVsaW5lTG9naWMoc3RlcCwgaXNDdXJyZW50U3RlcCwgc3RhdGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RGVmYXVsdEluZGljYXRvckxvZ2ljKHN0ZXA6IENka1N0ZXAsIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4pOiBTdGVwU3RhdGUge1xuICAgIGlmIChzdGVwLl9zaG93RXJyb3IgJiYgc3RlcC5oYXNFcnJvciAmJiAhaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuRVJST1I7XG4gICAgfSBlbHNlIGlmICghc3RlcC5jb21wbGV0ZWQgfHwgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIFNURVBfU1RBVEUuTlVNQkVSO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RlcC5lZGl0YWJsZSA/IFNURVBfU1RBVEUuRURJVCA6IFNURVBfU1RBVEUuRE9ORTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRHdWlkZWxpbmVMb2dpYyhcbiAgICAgIHN0ZXA6IENka1N0ZXAsIGlzQ3VycmVudFN0ZXA6IGJvb2xlYW4sIHN0YXRlOiBTdGVwU3RhdGUgPSBTVEVQX1NUQVRFLk5VTUJFUik6IFN0ZXBTdGF0ZSB7XG4gICAgaWYgKHN0ZXAuX3Nob3dFcnJvciAmJiBzdGVwLmhhc0Vycm9yICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FUlJPUjtcbiAgICB9IGVsc2UgaWYgKHN0ZXAuY29tcGxldGVkICYmICFpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5ET05FO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5jb21wbGV0ZWQgJiYgaXNDdXJyZW50U3RlcCkge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0gZWxzZSBpZiAoc3RlcC5lZGl0YWJsZSAmJiBpc0N1cnJlbnRTdGVwKSB7XG4gICAgICByZXR1cm4gU1RFUF9TVEFURS5FRElUO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaXNDdXJyZW50U3RlcChpbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXggPT09IGluZGV4O1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50bHktZm9jdXNlZCBzdGVwIGhlYWRlci4gKi9cbiAgX2dldEZvY3VzSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleU1hbmFnZXIgPyB0aGlzLl9rZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCA6IHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVTZWxlY3RlZEl0ZW1JbmRleChuZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RlcHNBcnJheSA9IHRoaXMuc3RlcHMudG9BcnJheSgpO1xuICAgIHRoaXMuc2VsZWN0aW9uQ2hhbmdlLmVtaXQoe1xuICAgICAgc2VsZWN0ZWRJbmRleDogbmV3SW5kZXgsXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRJbmRleDogdGhpcy5fc2VsZWN0ZWRJbmRleCxcbiAgICAgIHNlbGVjdGVkU3RlcDogc3RlcHNBcnJheVtuZXdJbmRleF0sXG4gICAgICBwcmV2aW91c2x5U2VsZWN0ZWRTdGVwOiBzdGVwc0FycmF5W3RoaXMuX3NlbGVjdGVkSW5kZXhdLFxuICAgIH0pO1xuXG4gICAgLy8gSWYgZm9jdXMgaXMgaW5zaWRlIHRoZSBzdGVwcGVyLCBtb3ZlIGl0IHRvIHRoZSBuZXh0IGhlYWRlciwgb3RoZXJ3aXNlIGl0IG1heSBiZWNvbWVcbiAgICAvLyBsb3N0IHdoZW4gdGhlIGFjdGl2ZSBzdGVwIGNvbnRlbnQgaXMgaGlkZGVuLiBXZSBjYW4ndCBiZSBtb3JlIGdyYW51bGFyIHdpdGggdGhlIGNoZWNrXG4gICAgLy8gKGUuZy4gY2hlY2tpbmcgd2hldGhlciBmb2N1cyBpcyBpbnNpZGUgdGhlIGFjdGl2ZSBzdGVwKSwgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGFcbiAgICAvLyByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnRzIHRoYXQgYXJlIHJlbmRlcmluZyBvdXQgdGhlIGNvbnRlbnQuXG4gICAgdGhpcy5fY29udGFpbnNGb2N1cygpID8gdGhpcy5fa2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKG5ld0luZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5TWFuYWdlci51cGRhdGVBY3RpdmVJdGVtKG5ld0luZGV4KTtcblxuICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSBuZXdJbmRleDtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZWQoKTtcbiAgfVxuXG4gIF9vbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBjb25zdCBoYXNNb2RpZmllciA9IGhhc01vZGlmaWVyS2V5KGV2ZW50KTtcbiAgICBjb25zdCBrZXlDb2RlID0gZXZlbnQua2V5Q29kZTtcbiAgICBjb25zdCBtYW5hZ2VyID0gdGhpcy5fa2V5TWFuYWdlcjtcblxuICAgIGlmIChtYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCAhPSBudWxsICYmICFoYXNNb2RpZmllciAmJlxuICAgICAgICAoa2V5Q29kZSA9PT0gU1BBQ0UgfHwga2V5Q29kZSA9PT0gRU5URVIpKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBtYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleDtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSBIT01FKSB7XG4gICAgICBtYW5hZ2VyLnNldEZpcnN0SXRlbUFjdGl2ZSgpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IEVORCkge1xuICAgICAgbWFuYWdlci5zZXRMYXN0SXRlbUFjdGl2ZSgpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWFuYWdlci5vbktleWRvd24oZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FueUNvbnRyb2xzSW52YWxpZE9yUGVuZGluZyhpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3RlcHMgPSB0aGlzLnN0ZXBzLnRvQXJyYXkoKTtcblxuICAgIHN0ZXBzW3RoaXMuX3NlbGVjdGVkSW5kZXhdLmludGVyYWN0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuX2xpbmVhciAmJiBpbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gc3RlcHMuc2xpY2UoMCwgaW5kZXgpLnNvbWUoc3RlcCA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2wgPSBzdGVwLnN0ZXBDb250cm9sO1xuICAgICAgICBjb25zdCBpc0luY29tcGxldGUgPVxuICAgICAgICAgICAgY29udHJvbCA/IChjb250cm9sLmludmFsaWQgfHwgY29udHJvbC5wZW5kaW5nIHx8ICFzdGVwLmludGVyYWN0ZWQpIDogIXN0ZXAuY29tcGxldGVkO1xuICAgICAgICByZXR1cm4gaXNJbmNvbXBsZXRlICYmICFzdGVwLm9wdGlvbmFsICYmICFzdGVwLl9jb21wbGV0ZWRPdmVycmlkZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX2xheW91dERpcmVjdGlvbigpOiBEaXJlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9kaXIgJiYgdGhpcy5fZGlyLnZhbHVlID09PSAncnRsJyA/ICdydGwnIDogJ2x0cic7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIHN0ZXBwZXIgY29udGFpbnMgdGhlIGZvY3VzZWQgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfY29udGFpbnNGb2N1cygpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX2RvY3VtZW50IHx8ICF0aGlzLl9lbGVtZW50UmVmKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RlcHBlckVsZW1lbnQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgZm9jdXNlZEVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIHJldHVybiBzdGVwcGVyRWxlbWVudCA9PT0gZm9jdXNlZEVsZW1lbnQgfHwgc3RlcHBlckVsZW1lbnQuY29udGFpbnMoZm9jdXNlZEVsZW1lbnQpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2VkaXRhYmxlOiBib29sZWFuIHwgc3RyaW5nO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfb3B0aW9uYWw6IGJvb2xlYW4gfCBzdHJpbmc7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9jb21wbGV0ZWQ6IGJvb2xlYW4gfCBzdHJpbmc7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9oYXNFcnJvcjogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2xpbmVhcjogYm9vbGVhbiB8IHN0cmluZztcbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX3NlbGVjdGVkSW5kZXg6IG51bWJlciB8IHN0cmluZztcbn1cblxuXG4vKipcbiAqIFNpbXBsaWZpZWQgcmVwcmVzZW50YXRpb24gb2YgYW4gXCJBYnN0cmFjdENvbnRyb2xcIiBmcm9tIEBhbmd1bGFyL2Zvcm1zLlxuICogVXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gYnJpbmcgaW4gQGFuZ3VsYXIvZm9ybXMgZm9yIGEgc2luZ2xlIG9wdGlvbmFsIGludGVyZmFjZS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW50ZXJmYWNlIEFic3RyYWN0Q29udHJvbExpa2Uge1xuICBhc3luY1ZhbGlkYXRvcjogKChjb250cm9sOiBhbnkpID0+IGFueSkgfCBudWxsO1xuICBkaXJ0eTogYm9vbGVhbjtcbiAgZGlzYWJsZWQ6IGJvb2xlYW47XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGVycm9yczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsO1xuICBpbnZhbGlkOiBib29sZWFuO1xuICBwYXJlbnQ6IGFueTtcbiAgcGVuZGluZzogYm9vbGVhbjtcbiAgcHJpc3RpbmU6IGJvb2xlYW47XG4gIHJvb3Q6IEFic3RyYWN0Q29udHJvbExpa2U7XG4gIHN0YXR1czogc3RyaW5nO1xuICBzdGF0dXNDaGFuZ2VzOiBPYnNlcnZhYmxlPGFueT47XG4gIHRvdWNoZWQ6IGJvb2xlYW47XG4gIHVudG91Y2hlZDogYm9vbGVhbjtcbiAgdXBkYXRlT246IGFueTtcbiAgdmFsaWQ6IGJvb2xlYW47XG4gIHZhbGlkYXRvcjogKChjb250cm9sOiBhbnkpID0+IGFueSkgfCBudWxsO1xuICB2YWx1ZTogYW55O1xuICB2YWx1ZUNoYW5nZXM6IE9ic2VydmFibGU8YW55PjtcbiAgY2xlYXJBc3luY1ZhbGlkYXRvcnMoKTogdm9pZDtcbiAgY2xlYXJWYWxpZGF0b3JzKCk6IHZvaWQ7XG4gIGRpc2FibGUob3B0cz86IGFueSk6IHZvaWQ7XG4gIGVuYWJsZShvcHRzPzogYW55KTogdm9pZDtcbiAgZ2V0KHBhdGg6IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBBYnN0cmFjdENvbnRyb2xMaWtlIHwgbnVsbDtcbiAgZ2V0RXJyb3IoZXJyb3JDb2RlOiBzdHJpbmcsIHBhdGg/OiAoc3RyaW5nIHwgbnVtYmVyKVtdIHwgc3RyaW5nKTogYW55O1xuICBoYXNFcnJvcihlcnJvckNvZGU6IHN0cmluZywgcGF0aD86IChzdHJpbmcgfCBudW1iZXIpW10gfCBzdHJpbmcpOiBib29sZWFuO1xuICBtYXJrQWxsQXNUb3VjaGVkKCk6IHZvaWQ7XG4gIG1hcmtBc0RpcnR5KG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNQZW5kaW5nKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBtYXJrQXNQcmlzdGluZShvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzVG91Y2hlZChvcHRzPzogYW55KTogdm9pZDtcbiAgbWFya0FzVW50b3VjaGVkKG9wdHM/OiBhbnkpOiB2b2lkO1xuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICByZXNldCh2YWx1ZT86IGFueSwgb3B0aW9ucz86IE9iamVjdCk6IHZvaWQ7XG4gIHNldEFzeW5jVmFsaWRhdG9ycyhuZXdWYWxpZGF0b3I6IChjb250cm9sOiBhbnkpID0+IGFueSB8XG4gICAgKChjb250cm9sOiBhbnkpID0+IGFueSlbXSB8IG51bGwpOiB2b2lkO1xuICBzZXRFcnJvcnMoZXJyb3JzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsIG9wdHM/OiBhbnkpOiB2b2lkO1xuICBzZXRQYXJlbnQocGFyZW50OiBhbnkpOiB2b2lkO1xuICBzZXRWYWxpZGF0b3JzKG5ld1ZhbGlkYXRvcjogKGNvbnRyb2w6IGFueSkgPT4gYW55IHxcbiAgICAoKGNvbnRyb2w6IGFueSkgPT4gYW55KVtdIHwgbnVsbCk6IHZvaWQ7XG4gIHNldFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBPYmplY3QpOiB2b2lkO1xuICB1cGRhdGVWYWx1ZUFuZFZhbGlkaXR5KG9wdHM/OiBhbnkpOiB2b2lkO1xuICBwYXRjaFZhbHVlKHZhbHVlOiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xuICByZXNldChmb3JtU3RhdGU/OiBhbnksIG9wdGlvbnM/OiBhbnkpOiB2b2lkO1xuICBzZXRWYWx1ZSh2YWx1ZTogYW55LCBvcHRpb25zPzogYW55KTogdm9pZDtcbn1cbiJdfQ==