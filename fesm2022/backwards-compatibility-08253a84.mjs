import { VERSION } from '@angular/core';

// TODO(crisbeto): remove this function when making breaking changes for v20.
/**
 * Binds an event listener with specific options in a backwards-compatible way.
 * This function is necessary, because `Renderer2.listen` only supports listener options
 * after 19.1 and during the v19 period we support any 19.x version.
 * @docs-private
 */
function _bindEventWithOptions(renderer, target, eventName, callback, options) {
    const major = parseInt(VERSION.major);
    const minor = parseInt(VERSION.minor);
    // Event options in `listen` are only supported in 19.1 and beyond.
    // We also allow 0.0.x, because that indicates a build at HEAD.
    if (major > 19 || (major === 19 && minor > 0) || (major === 0 && minor === 0)) {
        return renderer.listen(target, eventName, callback, options);
    }
    target.addEventListener(eventName, callback, options);
    return () => {
        target.removeEventListener(eventName, callback, options);
    };
}

export { _bindEventWithOptions as _ };
//# sourceMappingURL=backwards-compatibility-08253a84.mjs.map
