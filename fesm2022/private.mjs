import * as i0 from '@angular/core';
import { Component, ViewEncapsulation, ChangeDetectionStrategy, SecurityContext } from '@angular/core';
export { _CdkPrivateStyleLoader } from './_style-loader-chunk.mjs';

class _VisuallyHiddenLoader {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: _VisuallyHiddenLoader,
    deps: [],
    target: i0.ɵɵFactoryTarget.Component
  });
  static ɵcmp = i0.ɵɵngDeclareComponent({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: _VisuallyHiddenLoader,
    isStandalone: true,
    selector: "ng-component",
    exportAs: ["cdkVisuallyHidden"],
    ngImport: i0,
    template: '',
    isInline: true,
    styles: [".cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}\n"],
    changeDetection: i0.ChangeDetectionStrategy.OnPush,
    encapsulation: i0.ViewEncapsulation.None
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: _VisuallyHiddenLoader,
  decorators: [{
    type: Component,
    args: [{
      exportAs: 'cdkVisuallyHidden',
      encapsulation: ViewEncapsulation.None,
      template: '',
      changeDetection: ChangeDetectionStrategy.OnPush,
      styles: [".cdk-visually-hidden{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;outline:0;-webkit-appearance:none;-moz-appearance:none;left:0}[dir=rtl] .cdk-visually-hidden{left:auto;right:0}\n"]
    }]
  }]
});

let policy;
function getPolicy() {
  if (policy === undefined) {
    policy = null;
    if (typeof window !== 'undefined') {
      const ttWindow = window;
      if (ttWindow.trustedTypes !== undefined) {
        policy = ttWindow.trustedTypes.createPolicy('angular#components', {
          createHTML: s => s
        });
      }
    }
  }
  return policy;
}
function trustedHTMLFromString(html) {
  return getPolicy()?.createHTML(html) || html;
}

function _setInnerHtml(element, html, sanitizer) {
  const cleanHtml = sanitizer.sanitize(SecurityContext.HTML, html);
  if (cleanHtml === null && (typeof ngDevMode === 'undefined' || ngDevMode)) {
    throw new Error(`Could not sanitize HTML: ${html}`);
  }
  element.innerHTML = trustedHTMLFromString(cleanHtml || '');
}

export { _VisuallyHiddenLoader, _setInnerHtml, trustedHTMLFromString };
//# sourceMappingURL=private.mjs.map
