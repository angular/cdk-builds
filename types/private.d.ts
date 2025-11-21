export { _CdkPrivateStyleLoader } from './_style-loader-chunk.js';
import * as i0 from '@angular/core';

/**
 * Component used to load the .cdk-visually-hidden styles.
 * @docs-private
 */
declare class _VisuallyHiddenLoader {
    static ɵfac: i0.ɵɵFactoryDeclaration<_VisuallyHiddenLoader, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<_VisuallyHiddenLoader, "ng-component", ["cdkVisuallyHidden"], {}, {}, never, never, true, never>;
}

interface TrustedHTML {
    __brand__: 'TrustedHTML';
}
/**
 * Unsafely promote a string to a TrustedHTML, falling back to strings when
 * Trusted Types are not available.
 *
 * Important!!! This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will be interpreted as HTML by a browser, e.g. when assigning to
 * element.innerHTML.
 */
declare function trustedHTMLFromString(html: string): TrustedHTML;

export { _VisuallyHiddenLoader, trustedHTMLFromString };
export type { TrustedHTML };
