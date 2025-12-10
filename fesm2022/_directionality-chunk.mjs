import * as i0 from '@angular/core';
import { InjectionToken, inject, DOCUMENT, signal, EventEmitter, Injectable } from '@angular/core';

const DIR_DOCUMENT = new InjectionToken('cdk-dir-doc', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT)
});

const RTL_LOCALE_PATTERN = /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;
function _resolveDirectionality(rawValue) {
  const value = rawValue?.toLowerCase() || '';
  if (value === 'auto' && typeof navigator !== 'undefined' && navigator?.language) {
    return RTL_LOCALE_PATTERN.test(navigator.language) ? 'rtl' : 'ltr';
  }
  return value === 'rtl' ? 'rtl' : 'ltr';
}
class Directionality {
  get value() {
    return this.valueSignal();
  }
  valueSignal = signal('ltr', ...(ngDevMode ? [{
    debugName: "valueSignal"
  }] : []));
  change = new EventEmitter();
  constructor() {
    const _document = inject(DIR_DOCUMENT, {
      optional: true
    });
    if (_document) {
      const bodyDir = _document.body ? _document.body.dir : null;
      const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
      this.valueSignal.set(_resolveDirectionality(bodyDir || htmlDir || 'ltr'));
    }
  }
  ngOnDestroy() {
    this.change.complete();
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Directionality,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Directionality,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: Directionality,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});

export { DIR_DOCUMENT, Directionality, _resolveDirectionality };
//# sourceMappingURL=_directionality-chunk.mjs.map
