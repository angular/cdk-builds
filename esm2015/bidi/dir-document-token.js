/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';
/**
 * Injection token used to inject the document into Directionality.
 * This is used so that the value can be faked in tests.
 *
 * We can't use the real document in tests because changing the real `dir` causes geometry-based
 * tests in Safari to fail.
 *
 * We also can't re-provide the DOCUMENT token from platform-brower because the unit tests
 * themselves use things like `querySelector` in test code.
 *
 * This token is defined in a separate file from Directionality as a workaround for
 * https://github.com/angular/angular/issues/22559
 *
 * \@docs-private
 * @type {?}
 */
export const DIR_DOCUMENT = new InjectionToken('cdk-dir-doc', {
    providedIn: 'root',
    factory: DIR_DOCUMENT_FACTORY,
});
/**
 * \@docs-private
 * @return {?}
 */
export function DIR_DOCUMENT_FACTORY() {
    return inject(DOCUMENT);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyLWRvY3VtZW50LXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9iaWRpL2Rpci1kb2N1bWVudC10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQnJELE1BQU0sT0FBTyxZQUFZLEdBQUcsSUFBSSxjQUFjLENBQVcsYUFBYSxFQUFFO0lBQ3RFLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxvQkFBb0I7Q0FDOUIsQ0FBQzs7Ozs7QUFHRixNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7aW5qZWN0LCBJbmplY3Rpb25Ub2tlbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdXNlZCB0byBpbmplY3QgdGhlIGRvY3VtZW50IGludG8gRGlyZWN0aW9uYWxpdHkuXG4gKiBUaGlzIGlzIHVzZWQgc28gdGhhdCB0aGUgdmFsdWUgY2FuIGJlIGZha2VkIGluIHRlc3RzLlxuICpcbiAqIFdlIGNhbid0IHVzZSB0aGUgcmVhbCBkb2N1bWVudCBpbiB0ZXN0cyBiZWNhdXNlIGNoYW5naW5nIHRoZSByZWFsIGBkaXJgIGNhdXNlcyBnZW9tZXRyeS1iYXNlZFxuICogdGVzdHMgaW4gU2FmYXJpIHRvIGZhaWwuXG4gKlxuICogV2UgYWxzbyBjYW4ndCByZS1wcm92aWRlIHRoZSBET0NVTUVOVCB0b2tlbiBmcm9tIHBsYXRmb3JtLWJyb3dlciBiZWNhdXNlIHRoZSB1bml0IHRlc3RzXG4gKiB0aGVtc2VsdmVzIHVzZSB0aGluZ3MgbGlrZSBgcXVlcnlTZWxlY3RvcmAgaW4gdGVzdCBjb2RlLlxuICpcbiAqIFRoaXMgdG9rZW4gaXMgZGVmaW5lZCBpbiBhIHNlcGFyYXRlIGZpbGUgZnJvbSBEaXJlY3Rpb25hbGl0eSBhcyBhIHdvcmthcm91bmQgZm9yXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8yMjU1OVxuICpcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IERJUl9ET0NVTUVOVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxEb2N1bWVudD4oJ2Nkay1kaXItZG9jJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6IERJUl9ET0NVTUVOVF9GQUNUT1JZLFxufSk7XG5cbi8qKiBAZG9jcy1wcml2YXRlICovXG5leHBvcnQgZnVuY3Rpb24gRElSX0RPQ1VNRU5UX0ZBQ1RPUlkoKTogRG9jdW1lbnQge1xuICByZXR1cm4gaW5qZWN0KERPQ1VNRU5UKTtcbn1cbiJdfQ==