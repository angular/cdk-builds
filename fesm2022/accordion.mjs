import * as i0 from '@angular/core';
import { InjectionToken, inject, booleanAttribute, Directive, Input, ChangeDetectorRef, EventEmitter, signal, Output, NgModule } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { _IdGenerator } from './_id-generator-chunk.mjs';
import { UniqueSelectionDispatcher } from './_unique-selection-dispatcher-chunk.mjs';

const CDK_ACCORDION = new InjectionToken('CdkAccordion');
class CdkAccordion {
  _stateChanges = new Subject();
  _openCloseAllActions = new Subject();
  id = inject(_IdGenerator).getId('cdk-accordion-');
  multi = false;
  openAll() {
    if (this.multi) {
      this._openCloseAllActions.next(true);
    }
  }
  closeAll() {
    this._openCloseAllActions.next(false);
  }
  ngOnChanges(changes) {
    this._stateChanges.next(changes);
  }
  ngOnDestroy() {
    this._stateChanges.complete();
    this._openCloseAllActions.complete();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkAccordion,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkAccordion,
    isStandalone: true,
    selector: "cdk-accordion, [cdkAccordion]",
    inputs: {
      multi: ["multi", "multi", booleanAttribute]
    },
    providers: [{
      provide: CDK_ACCORDION,
      useExisting: CdkAccordion
    }],
    exportAs: ["cdkAccordion"],
    usesOnChanges: true,
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkAccordion,
  decorators: [{
    type: Directive,
    args: [{
      selector: 'cdk-accordion, [cdkAccordion]',
      exportAs: 'cdkAccordion',
      providers: [{
        provide: CDK_ACCORDION,
        useExisting: CdkAccordion
      }]
    }]
  }],
  propDecorators: {
    multi: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }]
  }
});

class CdkAccordionItem {
  accordion = inject(CDK_ACCORDION, {
    optional: true,
    skipSelf: true
  });
  _changeDetectorRef = inject(ChangeDetectorRef);
  _expansionDispatcher = inject(UniqueSelectionDispatcher);
  _openCloseAllSubscription = Subscription.EMPTY;
  closed = new EventEmitter();
  opened = new EventEmitter();
  destroyed = new EventEmitter();
  expandedChange = new EventEmitter();
  id = inject(_IdGenerator).getId('cdk-accordion-child-');
  get expanded() {
    return this._expanded;
  }
  set expanded(expanded) {
    if (this._expanded !== expanded) {
      this._expanded = expanded;
      this.expandedChange.emit(expanded);
      if (expanded) {
        this.opened.emit();
        const accordionId = this.accordion ? this.accordion.id : this.id;
        this._expansionDispatcher.notify(this.id, accordionId);
      } else {
        this.closed.emit();
      }
      this._changeDetectorRef.markForCheck();
    }
  }
  _expanded = false;
  get disabled() {
    return this._disabled();
  }
  set disabled(value) {
    this._disabled.set(value);
  }
  _disabled = signal(false, ...(ngDevMode ? [{
    debugName: "_disabled"
  }] : []));
  _removeUniqueSelectionListener = () => {};
  constructor() {}
  ngOnInit() {
    this._removeUniqueSelectionListener = this._expansionDispatcher.listen((id, accordionId) => {
      if (this.accordion && !this.accordion.multi && this.accordion.id === accordionId && this.id !== id) {
        this.expanded = false;
      }
    });
    if (this.accordion) {
      this._openCloseAllSubscription = this._subscribeToOpenCloseAllActions();
    }
  }
  ngOnDestroy() {
    this.opened.complete();
    this.closed.complete();
    this.destroyed.emit();
    this.destroyed.complete();
    this._removeUniqueSelectionListener();
    this._openCloseAllSubscription.unsubscribe();
  }
  toggle() {
    if (!this.disabled) {
      this.expanded = !this.expanded;
    }
  }
  close() {
    if (!this.disabled) {
      this.expanded = false;
    }
  }
  open() {
    if (!this.disabled) {
      this.expanded = true;
    }
  }
  _subscribeToOpenCloseAllActions() {
    return this.accordion._openCloseAllActions.subscribe(expanded => {
      if (!this.disabled) {
        this.expanded = expanded;
      }
    });
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkAccordionItem,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "16.1.0",
    version: "21.0.3",
    type: CdkAccordionItem,
    isStandalone: true,
    selector: "cdk-accordion-item, [cdkAccordionItem]",
    inputs: {
      expanded: ["expanded", "expanded", booleanAttribute],
      disabled: ["disabled", "disabled", booleanAttribute]
    },
    outputs: {
      closed: "closed",
      opened: "opened",
      destroyed: "destroyed",
      expandedChange: "expandedChange"
    },
    providers: [{
      provide: CDK_ACCORDION,
      useValue: undefined
    }],
    exportAs: ["cdkAccordionItem"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkAccordionItem,
  decorators: [{
    type: Directive,
    args: [{
      selector: 'cdk-accordion-item, [cdkAccordionItem]',
      exportAs: 'cdkAccordionItem',
      providers: [{
        provide: CDK_ACCORDION,
        useValue: undefined
      }]
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    closed: [{
      type: Output
    }],
    opened: [{
      type: Output
    }],
    destroyed: [{
      type: Output
    }],
    expandedChange: [{
      type: Output
    }],
    expanded: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }]
  }
});

class CdkAccordionModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkAccordionModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkAccordionModule,
    imports: [CdkAccordion, CdkAccordionItem],
    exports: [CdkAccordion, CdkAccordionItem]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkAccordionModule
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkAccordionModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [CdkAccordion, CdkAccordionItem],
      exports: [CdkAccordion, CdkAccordionItem]
    }]
  }]
});

export { CDK_ACCORDION, CdkAccordion, CdkAccordionItem, CdkAccordionModule };
//# sourceMappingURL=accordion.mjs.map
