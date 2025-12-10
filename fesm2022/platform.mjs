export { Platform } from './_platform-chunk.mjs';
import * as i0 from '@angular/core';
import { NgModule } from '@angular/core';
export { normalizePassiveListenerOptions, supportsPassiveEventListeners } from './_passive-listeners-chunk.mjs';
export { RtlScrollAxisType, getRtlScrollAxisType, supportsScrollBehavior } from './_scrolling-chunk.mjs';
export { _getEventTarget, _getFocusedElementPierceShadowDom, _getShadowRoot, _supportsShadowDom } from './_shadow-dom-chunk.mjs';
export { _isTestEnvironment } from './_test-environment-chunk.mjs';
import '@angular/common';

class PlatformModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: PlatformModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: PlatformModule
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: PlatformModule
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: PlatformModule,
  decorators: [{
    type: NgModule,
    args: [{}]
  }]
});

let supportedInputTypes;
const candidateInputTypes = ['color', 'button', 'checkbox', 'date', 'datetime-local', 'email', 'file', 'hidden', 'image', 'month', 'number', 'password', 'radio', 'range', 'reset', 'search', 'submit', 'tel', 'text', 'time', 'url', 'week'];
function getSupportedInputTypes() {
  if (supportedInputTypes) {
    return supportedInputTypes;
  }
  if (typeof document !== 'object' || !document) {
    supportedInputTypes = new Set(candidateInputTypes);
    return supportedInputTypes;
  }
  let featureTestInput = document.createElement('input');
  supportedInputTypes = new Set(candidateInputTypes.filter(value => {
    featureTestInput.setAttribute('type', value);
    return featureTestInput.type === value;
  }));
  return supportedInputTypes;
}

export { PlatformModule, getSupportedInputTypes };
//# sourceMappingURL=platform.mjs.map
