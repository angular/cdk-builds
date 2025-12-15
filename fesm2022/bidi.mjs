import { _resolveDirectionality, Directionality } from './_directionality-chunk.mjs';
export { DIR_DOCUMENT } from './_directionality-chunk.mjs';
import * as i0 from '@angular/core';
import { EventEmitter, signal, Directive, Output, Input, NgModule } from '@angular/core';

class Dir {
  _isInitialized = false;
  _rawDir = '';
  change = new EventEmitter();
  get dir() {
    return this.valueSignal();
  }
  set dir(value) {
    const previousValue = this.valueSignal();
    this.valueSignal.set(_resolveDirectionality(value));
    this._rawDir = value;
    if (previousValue !== this.valueSignal() && this._isInitialized) {
      this.change.emit(this.valueSignal());
    }
  }
  get value() {
    return this.dir;
  }
  valueSignal = signal('ltr', ...(ngDevMode ? [{
    debugName: "valueSignal"
  }] : []));
  ngAfterContentInit() {
    this._isInitialized = true;
  }
  ngOnDestroy() {
    this.change.complete();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Dir,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: Dir,
    isStandalone: true,
    selector: "[dir]",
    inputs: {
      dir: "dir"
    },
    outputs: {
      change: "dirChange"
    },
    host: {
      properties: {
        "attr.dir": "_rawDir"
      }
    },
    providers: [{
      provide: Directionality,
      useExisting: Dir
    }],
    exportAs: ["dir"],
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: Dir,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[dir]',
      providers: [{
        provide: Directionality,
        useExisting: Dir
      }],
      host: {
        '[attr.dir]': '_rawDir'
      },
      exportAs: 'dir'
    }]
  }],
  propDecorators: {
    change: [{
      type: Output,
      args: ['dirChange']
    }],
    dir: [{
      type: Input
    }]
  }
});

class BidiModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: BidiModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: BidiModule,
    imports: [Dir],
    exports: [Dir]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: BidiModule
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: BidiModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [Dir],
      exports: [Dir]
    }]
  }]
});

export { BidiModule, Dir, Directionality };
//# sourceMappingURL=bidi.mjs.map
