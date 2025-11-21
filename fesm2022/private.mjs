export { _CdkPrivateStyleLoader } from './_style-loader-chunk.mjs';
export { _VisuallyHiddenLoader } from './_visually-hidden-chunk.mjs';
import '@angular/core';

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

export { trustedHTMLFromString };
//# sourceMappingURL=private.mjs.map
