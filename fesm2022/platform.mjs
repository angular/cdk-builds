export { P as Platform } from './platform-BWwIqQ_X.mjs';
import * as i0 from '@angular/core';
import { NgModule } from '@angular/core';
export { n as normalizePassiveListenerOptions, s as supportsPassiveEventListeners } from './passive-listeners-esHZRgIN.mjs';
export { R as RtlScrollAxisType, g as getRtlScrollAxisType, s as supportsScrollBehavior } from './scrolling-BkvA05C8.mjs';
export { _ as _getEventTarget, c as _getFocusedElementPierceShadowDom, a as _getShadowRoot, b as _supportsShadowDom } from './shadow-dom-B0oHn41l.mjs';
export { _ as _isTestEnvironment } from './test-environment-CT0XxPyp.mjs';
import '@angular/common';

class PlatformModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.2.0-next.1", ngImport: i0, type: PlatformModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "20.2.0-next.1", ngImport: i0, type: PlatformModule });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "20.2.0-next.1", ngImport: i0, type: PlatformModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.2.0-next.1", ngImport: i0, type: PlatformModule, decorators: [{
            type: NgModule,
            args: [{}]
        }] });

/** Cached result Set of input types support by the current browser. */
let supportedInputTypes;
/** Types of `<input>` that *might* be supported. */
const candidateInputTypes = [
    // `color` must come first. Chrome 56 shows a warning if we change the type to `color` after
    // first changing it to something else:
    // The specified value "" does not conform to the required format.
    // The format is "#rrggbb" where rr, gg, bb are two-digit hexadecimal numbers.
    'color',
    'button',
    'checkbox',
    'date',
    'datetime-local',
    'email',
    'file',
    'hidden',
    'image',
    'month',
    'number',
    'password',
    'radio',
    'range',
    'reset',
    'search',
    'submit',
    'tel',
    'text',
    'time',
    'url',
    'week',
];
/** @returns The input types supported by this browser. */
function getSupportedInputTypes() {
    // Result is cached.
    if (supportedInputTypes) {
        return supportedInputTypes;
    }
    // We can't check if an input type is not supported until we're on the browser, so say that
    // everything is supported when not on the browser. We don't use `Platform` here since it's
    // just a helper function and can't inject it.
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
