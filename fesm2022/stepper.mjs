import * as i0 from '@angular/core';
import { inject, ElementRef, Directive, TemplateRef, InjectionToken, signal, EventEmitter, computed, booleanAttribute, Component, ViewEncapsulation, ChangeDetectionStrategy, ContentChild, ContentChildren, ViewChild, Input, Output, ChangeDetectorRef, QueryList, numberAttribute, NgModule } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { Directionality } from './_directionality-chunk.mjs';
import { _IdGenerator } from './_id-generator-chunk.mjs';
import { FocusKeyManager } from './_focus-key-manager-chunk.mjs';
import { hasModifierKey } from './keycodes.mjs';
import { SPACE, ENTER } from './_keycodes-chunk.mjs';
import { _getFocusedElementPierceShadowDom } from './_shadow-dom-chunk.mjs';
import { BidiModule } from './bidi.mjs';
import './_list-key-manager-chunk.mjs';
import './_typeahead-chunk.mjs';

class CdkStepHeader {
  _elementRef = inject(ElementRef);
  constructor() {}
  focus() {
    this._elementRef.nativeElement.focus();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepHeader,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkStepHeader,
    isStandalone: true,
    selector: "[cdkStepHeader]",
    host: {
      attributes: {
        "role": "tab"
      }
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStepHeader,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkStepHeader]',
      host: {
        'role': 'tab'
      }
    }]
  }],
  ctorParameters: () => []
});

class CdkStepLabel {
  template = inject(TemplateRef);
  constructor() {}
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepLabel,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkStepLabel,
    isStandalone: true,
    selector: "[cdkStepLabel]",
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStepLabel,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkStepLabel]'
    }]
  }],
  ctorParameters: () => []
});

class StepperSelectionEvent {
  selectedIndex;
  previouslySelectedIndex;
  selectedStep;
  previouslySelectedStep;
}
const STEP_STATE = {
  NUMBER: 'number',
  EDIT: 'edit',
  DONE: 'done',
  ERROR: 'error'
};
const STEPPER_GLOBAL_OPTIONS = new InjectionToken('STEPPER_GLOBAL_OPTIONS');
class CdkStep {
  _stepperOptions;
  _stepper = inject(CdkStepper);
  _displayDefaultIndicatorType;
  stepLabel;
  _childForms;
  content;
  stepControl;
  get interacted() {
    return this._interacted();
  }
  set interacted(value) {
    this._interacted.set(value);
  }
  _interacted = signal(false, ...(ngDevMode ? [{
    debugName: "_interacted"
  }] : []));
  interactedStream = new EventEmitter();
  label;
  errorMessage;
  ariaLabel;
  ariaLabelledby;
  get state() {
    return this._state();
  }
  set state(value) {
    this._state.set(value);
  }
  _state = signal(undefined, ...(ngDevMode ? [{
    debugName: "_state"
  }] : []));
  get editable() {
    return this._editable();
  }
  set editable(value) {
    this._editable.set(value);
  }
  _editable = signal(true, ...(ngDevMode ? [{
    debugName: "_editable"
  }] : []));
  optional = false;
  get completed() {
    const override = this._completedOverride();
    const interacted = this._interacted();
    if (override != null) {
      return override;
    }
    return interacted && (!this.stepControl || this.stepControl.valid);
  }
  set completed(value) {
    this._completedOverride.set(value);
  }
  _completedOverride = signal(null, ...(ngDevMode ? [{
    debugName: "_completedOverride"
  }] : []));
  index = signal(-1, ...(ngDevMode ? [{
    debugName: "index"
  }] : []));
  isSelected = computed(() => this._stepper.selectedIndex === this.index(), ...(ngDevMode ? [{
    debugName: "isSelected"
  }] : []));
  indicatorType = computed(() => {
    const selected = this.isSelected();
    const completed = this.completed;
    const defaultState = this._state() ?? STEP_STATE.NUMBER;
    const editable = this._editable();
    if (this._showError() && this.hasError && !selected) {
      return STEP_STATE.ERROR;
    }
    if (this._displayDefaultIndicatorType) {
      if (!completed || selected) {
        return STEP_STATE.NUMBER;
      }
      return editable ? STEP_STATE.EDIT : STEP_STATE.DONE;
    } else {
      if (completed && !selected) {
        return STEP_STATE.DONE;
      } else if (completed && selected) {
        return defaultState;
      }
      return editable && selected ? STEP_STATE.EDIT : defaultState;
    }
  }, ...(ngDevMode ? [{
    debugName: "indicatorType"
  }] : []));
  isNavigable = computed(() => {
    const isSelected = this.isSelected();
    const isCompleted = this.completed;
    return isCompleted || isSelected || !this._stepper.linear;
  }, ...(ngDevMode ? [{
    debugName: "isNavigable"
  }] : []));
  get hasError() {
    const customError = this._customError();
    return customError == null ? this._getDefaultError() : customError;
  }
  set hasError(value) {
    this._customError.set(value);
  }
  _customError = signal(null, ...(ngDevMode ? [{
    debugName: "_customError"
  }] : []));
  _getDefaultError() {
    return this.interacted && !!this.stepControl?.invalid;
  }
  constructor() {
    const stepperOptions = inject(STEPPER_GLOBAL_OPTIONS, {
      optional: true
    });
    this._stepperOptions = stepperOptions ? stepperOptions : {};
    this._displayDefaultIndicatorType = this._stepperOptions.displayDefaultIndicatorType !== false;
  }
  select() {
    this._stepper.selected = this;
  }
  reset() {
    this._interacted.set(false);
    if (this._completedOverride() != null) {
      this._completedOverride.set(false);
    }
    if (this._customError() != null) {
      this._customError.set(false);
    }
    if (this.stepControl) {
      this._childForms?.forEach(form => form.resetForm?.());
      this.stepControl.reset();
    }
  }
  ngOnChanges() {
    this._stepper._stateChanged();
  }
  _markAsInteracted() {
    if (!this._interacted()) {
      this._interacted.set(true);
      this.interactedStream.emit(this);
    }
  }
  _showError() {
    return this._stepperOptions.showError ?? this._customError() != null;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStep,
    deps: [],
    target: i0.ɵɵFactoryTarget.Component
  });
  static ɵcmp = i0.ɵɵngDeclareComponent({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkStep,
    isStandalone: true,
    selector: "cdk-step",
    inputs: {
      stepControl: "stepControl",
      label: "label",
      errorMessage: "errorMessage",
      ariaLabel: ["aria-label", "ariaLabel"],
      ariaLabelledby: ["aria-labelledby", "ariaLabelledby"],
      state: "state",
      editable: ["editable", "editable", booleanAttribute],
      optional: ["optional", "optional", booleanAttribute],
      completed: ["completed", "completed", booleanAttribute],
      hasError: ["hasError", "hasError", booleanAttribute]
    },
    outputs: {
      interactedStream: "interacted"
    },
    queries: [{
      propertyName: "stepLabel",
      first: true,
      predicate: CdkStepLabel,
      descendants: true
    }, {
      propertyName: "_childForms",
      predicate: ControlContainer,
      descendants: true
    }],
    viewQueries: [{
      propertyName: "content",
      first: true,
      predicate: TemplateRef,
      descendants: true,
      static: true
    }],
    exportAs: ["cdkStep"],
    usesOnChanges: true,
    ngImport: i0,
    template: '<ng-template><ng-content/></ng-template>',
    isInline: true,
    changeDetection: i0.ChangeDetectionStrategy.OnPush,
    encapsulation: i0.ViewEncapsulation.None
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStep,
  decorators: [{
    type: Component,
    args: [{
      selector: 'cdk-step',
      exportAs: 'cdkStep',
      template: '<ng-template><ng-content/></ng-template>',
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    stepLabel: [{
      type: ContentChild,
      args: [CdkStepLabel]
    }],
    _childForms: [{
      type: ContentChildren,
      args: [ControlContainer, {
        descendants: true
      }]
    }],
    content: [{
      type: ViewChild,
      args: [TemplateRef, {
        static: true
      }]
    }],
    stepControl: [{
      type: Input
    }],
    interactedStream: [{
      type: Output,
      args: ['interacted']
    }],
    label: [{
      type: Input
    }],
    errorMessage: [{
      type: Input
    }],
    ariaLabel: [{
      type: Input,
      args: ['aria-label']
    }],
    ariaLabelledby: [{
      type: Input,
      args: ['aria-labelledby']
    }],
    state: [{
      type: Input
    }],
    editable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    optional: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    completed: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    hasError: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }]
  }
});
class CdkStepper {
  _dir = inject(Directionality, {
    optional: true
  });
  _changeDetectorRef = inject(ChangeDetectorRef);
  _elementRef = inject(ElementRef);
  _destroyed = new Subject();
  _keyManager;
  _steps;
  steps = new QueryList();
  _stepHeader;
  _sortedHeaders = new QueryList();
  linear = false;
  get selectedIndex() {
    return this._selectedIndex();
  }
  set selectedIndex(index) {
    if (this._steps) {
      if (!this._isValidIndex(index) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error('cdkStepper: Cannot assign out-of-bounds value to `selectedIndex`.');
      }
      if (this.selectedIndex !== index) {
        this.selected?._markAsInteracted();
        if (!this._anyControlsInvalidOrPending(index) && (index >= this.selectedIndex || this.steps.toArray()[index].editable)) {
          this._updateSelectedItemIndex(index);
        }
      }
    } else {
      this._selectedIndex.set(index);
    }
  }
  _selectedIndex = signal(0, ...(ngDevMode ? [{
    debugName: "_selectedIndex"
  }] : []));
  get selected() {
    return this.steps ? this.steps.toArray()[this.selectedIndex] : undefined;
  }
  set selected(step) {
    this.selectedIndex = step && this.steps ? this.steps.toArray().indexOf(step) : -1;
  }
  selectionChange = new EventEmitter();
  selectedIndexChange = new EventEmitter();
  _groupId = inject(_IdGenerator).getId('cdk-stepper-');
  get orientation() {
    return this._orientation;
  }
  set orientation(value) {
    this._orientation = value;
    if (this._keyManager) {
      this._keyManager.withVerticalOrientation(value === 'vertical');
    }
  }
  _orientation = 'horizontal';
  constructor() {}
  ngAfterContentInit() {
    this._steps.changes.pipe(startWith(this._steps), takeUntil(this._destroyed)).subscribe(steps => {
      this.steps.reset(steps.filter(step => step._stepper === this));
      this.steps.forEach((step, index) => step.index.set(index));
      this.steps.notifyOnChanges();
    });
  }
  ngAfterViewInit() {
    this._stepHeader.changes.pipe(startWith(this._stepHeader), takeUntil(this._destroyed)).subscribe(headers => {
      this._sortedHeaders.reset(headers.toArray().sort((a, b) => {
        const documentPosition = a._elementRef.nativeElement.compareDocumentPosition(b._elementRef.nativeElement);
        return documentPosition & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      }));
      this._sortedHeaders.notifyOnChanges();
    });
    this._keyManager = new FocusKeyManager(this._sortedHeaders).withWrap().withHomeAndEnd().withVerticalOrientation(this._orientation === 'vertical');
    this._keyManager.updateActiveItem(this.selectedIndex);
    (this._dir ? this._dir.change : of()).pipe(startWith(this._layoutDirection()), takeUntil(this._destroyed)).subscribe(direction => this._keyManager?.withHorizontalOrientation(direction));
    this._keyManager.updateActiveItem(this.selectedIndex);
    this.steps.changes.subscribe(() => {
      if (!this.selected) {
        this._selectedIndex.set(Math.max(this.selectedIndex - 1, 0));
      }
    });
    if (!this._isValidIndex(this.selectedIndex)) {
      this._selectedIndex.set(0);
    }
    if (this.linear && this.selectedIndex > 0) {
      const visitedSteps = this.steps.toArray().slice(0, this._selectedIndex());
      for (const step of visitedSteps) {
        step._markAsInteracted();
      }
    }
  }
  ngOnDestroy() {
    this._keyManager?.destroy();
    this.steps.destroy();
    this._sortedHeaders.destroy();
    this._destroyed.next();
    this._destroyed.complete();
  }
  next() {
    this.selectedIndex = Math.min(this._selectedIndex() + 1, this.steps.length - 1);
  }
  previous() {
    this.selectedIndex = Math.max(this._selectedIndex() - 1, 0);
  }
  reset() {
    this._updateSelectedItemIndex(0);
    this.steps.forEach(step => step.reset());
    this._stateChanged();
  }
  _getStepLabelId(i) {
    return `${this._groupId}-label-${i}`;
  }
  _getStepContentId(i) {
    return `${this._groupId}-content-${i}`;
  }
  _stateChanged() {
    this._changeDetectorRef.markForCheck();
  }
  _getAnimationDirection(index) {
    const position = index - this._selectedIndex();
    if (position < 0) {
      return this._layoutDirection() === 'rtl' ? 'next' : 'previous';
    } else if (position > 0) {
      return this._layoutDirection() === 'rtl' ? 'previous' : 'next';
    }
    return 'current';
  }
  _getFocusIndex() {
    return this._keyManager ? this._keyManager.activeItemIndex : this._selectedIndex();
  }
  _updateSelectedItemIndex(newIndex) {
    const stepsArray = this.steps.toArray();
    const selectedIndex = this._selectedIndex();
    this.selectionChange.emit({
      selectedIndex: newIndex,
      previouslySelectedIndex: selectedIndex,
      selectedStep: stepsArray[newIndex],
      previouslySelectedStep: stepsArray[selectedIndex]
    });
    if (this._keyManager) {
      this._containsFocus() ? this._keyManager.setActiveItem(newIndex) : this._keyManager.updateActiveItem(newIndex);
    }
    this._selectedIndex.set(newIndex);
    this.selectedIndexChange.emit(newIndex);
    this._stateChanged();
  }
  _onKeydown(event) {
    const hasModifier = hasModifierKey(event);
    const keyCode = event.keyCode;
    const manager = this._keyManager;
    if (manager?.activeItemIndex != null && !hasModifier && (keyCode === SPACE || keyCode === ENTER)) {
      this.selectedIndex = manager.activeItemIndex;
      event.preventDefault();
    } else {
      manager?.setFocusOrigin('keyboard').onKeydown(event);
    }
  }
  _anyControlsInvalidOrPending(index) {
    if (this.linear && index >= 0) {
      return this.steps.toArray().slice(0, index).some(step => {
        const control = step.stepControl;
        const isIncomplete = control ? control.invalid || control.pending || !step.interacted : !step.completed;
        return isIncomplete && !step.optional && !step._completedOverride();
      });
    }
    return false;
  }
  _layoutDirection() {
    return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
  }
  _containsFocus() {
    const stepperElement = this._elementRef.nativeElement;
    const focusedElement = _getFocusedElementPierceShadowDom();
    return stepperElement === focusedElement || stepperElement.contains(focusedElement);
  }
  _isValidIndex(index) {
    return index > -1 && (!this.steps || index < this.steps.length);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepper,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkStepper,
    isStandalone: true,
    selector: "[cdkStepper]",
    inputs: {
      linear: ["linear", "linear", booleanAttribute],
      selectedIndex: ["selectedIndex", "selectedIndex", numberAttribute],
      selected: "selected",
      orientation: "orientation"
    },
    outputs: {
      selectionChange: "selectionChange",
      selectedIndexChange: "selectedIndexChange"
    },
    queries: [{
      propertyName: "_steps",
      predicate: CdkStep,
      descendants: true
    }, {
      propertyName: "_stepHeader",
      predicate: CdkStepHeader,
      descendants: true
    }],
    exportAs: ["cdkStepper"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStepper,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkStepper]',
      exportAs: 'cdkStepper'
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    _steps: [{
      type: ContentChildren,
      args: [CdkStep, {
        descendants: true
      }]
    }],
    _stepHeader: [{
      type: ContentChildren,
      args: [CdkStepHeader, {
        descendants: true
      }]
    }],
    linear: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    selectedIndex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    selected: [{
      type: Input
    }],
    selectionChange: [{
      type: Output
    }],
    selectedIndexChange: [{
      type: Output
    }],
    orientation: [{
      type: Input
    }]
  }
});

class CdkStepperNext {
  _stepper = inject(CdkStepper);
  type = 'submit';
  constructor() {}
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepperNext,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkStepperNext,
    isStandalone: true,
    selector: "button[cdkStepperNext]",
    inputs: {
      type: "type"
    },
    host: {
      listeners: {
        "click": "_stepper.next()"
      },
      properties: {
        "type": "type"
      }
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStepperNext,
  decorators: [{
    type: Directive,
    args: [{
      selector: 'button[cdkStepperNext]',
      host: {
        '[type]': 'type',
        '(click)': '_stepper.next()'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    type: [{
      type: Input
    }]
  }
});
class CdkStepperPrevious {
  _stepper = inject(CdkStepper);
  type = 'button';
  constructor() {}
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepperPrevious,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkStepperPrevious,
    isStandalone: true,
    selector: "button[cdkStepperPrevious]",
    inputs: {
      type: "type"
    },
    host: {
      listeners: {
        "click": "_stepper.previous()"
      },
      properties: {
        "type": "type"
      }
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStepperPrevious,
  decorators: [{
    type: Directive,
    args: [{
      selector: 'button[cdkStepperPrevious]',
      host: {
        '[type]': 'type',
        '(click)': '_stepper.previous()'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    type: [{
      type: Input
    }]
  }
});

class CdkStepperModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepperModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepperModule,
    imports: [BidiModule, CdkStep, CdkStepper, CdkStepHeader, CdkStepLabel, CdkStepperNext, CdkStepperPrevious],
    exports: [CdkStep, CdkStepper, CdkStepHeader, CdkStepLabel, CdkStepperNext, CdkStepperPrevious]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkStepperModule,
    imports: [BidiModule]
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkStepperModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [BidiModule, CdkStep, CdkStepper, CdkStepHeader, CdkStepLabel, CdkStepperNext, CdkStepperPrevious],
      exports: [CdkStep, CdkStepper, CdkStepHeader, CdkStepLabel, CdkStepperNext, CdkStepperPrevious]
    }]
  }]
});

export { CdkStep, CdkStepHeader, CdkStepLabel, CdkStepper, CdkStepperModule, CdkStepperNext, CdkStepperPrevious, STEPPER_GLOBAL_OPTIONS, STEP_STATE, StepperSelectionEvent };
//# sourceMappingURL=stepper.mjs.map
