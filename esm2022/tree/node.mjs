/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, TemplateRef } from '@angular/core';
import * as i0 from "@angular/core";
/** Context provided to the tree node component. */
export class CdkTreeNodeOutletContext {
    constructor(data) {
        this.$implicit = data;
    }
}
/**
 * Data node definition for the CdkTree.
 * Captures the node's template and a when predicate that describes when this node should be used.
 */
export class CdkTreeNodeDef {
    /** @docs-private */
    constructor(template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: CdkTreeNodeDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.2.0", type: CdkTreeNodeDef, isStandalone: true, selector: "[cdkTreeNodeDef]", inputs: { when: ["cdkTreeNodeDefWhen", "when"] }, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.0", ngImport: i0, type: CdkTreeNodeDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTreeNodeDef]',
                    inputs: ['when: cdkTreeNodeDefWhen'],
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.TemplateRef }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUVyRCxtREFBbUQ7QUFDbkQsTUFBTSxPQUFPLHdCQUF3QjtJQWFuQyxZQUFZLElBQU87UUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBTUgsTUFBTSxPQUFPLGNBQWM7SUFVekIsb0JBQW9CO0lBQ3BCLFlBQW1CLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQzs4R0FYdEMsY0FBYztrR0FBZCxjQUFjOzsyRkFBZCxjQUFjO2tCQUwxQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLE1BQU0sRUFBRSxDQUFDLDBCQUEwQixDQUFDO29CQUNwQyxVQUFVLEVBQUUsSUFBSTtpQkFDakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIFRlbXBsYXRlUmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqIENvbnRleHQgcHJvdmlkZWQgdG8gdGhlIHRyZWUgbm9kZSBjb21wb25lbnQuICovXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGVPdXRsZXRDb250ZXh0PFQ+IHtcbiAgLyoqIERhdGEgZm9yIHRoZSBub2RlLiAqL1xuICAkaW1wbGljaXQ6IFQ7XG5cbiAgLyoqIERlcHRoIG9mIHRoZSBub2RlLiAqL1xuICBsZXZlbDogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBsb2NhdGlvbiBvZiB0aGUgbm9kZS4gKi9cbiAgaW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIExlbmd0aCBvZiB0aGUgbnVtYmVyIG9mIHRvdGFsIGRhdGFOb2Rlcy4gKi9cbiAgY291bnQ/OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoZGF0YTogVCkge1xuICAgIHRoaXMuJGltcGxpY2l0ID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIERhdGEgbm9kZSBkZWZpbml0aW9uIGZvciB0aGUgQ2RrVHJlZS5cbiAqIENhcHR1cmVzIHRoZSBub2RlJ3MgdGVtcGxhdGUgYW5kIGEgd2hlbiBwcmVkaWNhdGUgdGhhdCBkZXNjcmliZXMgd2hlbiB0aGlzIG5vZGUgc2hvdWxkIGJlIHVzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtUcmVlTm9kZURlZl0nLFxuICBpbnB1dHM6IFsnd2hlbjogY2RrVHJlZU5vZGVEZWZXaGVuJ10sXG4gIHN0YW5kYWxvbmU6IHRydWUsXG59KVxuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJldHVybiB0cnVlIGlmIHRoaXMgbm9kZSB0ZW1wbGF0ZSBzaG91bGQgYmUgdXNlZCBmb3IgdGhlIHByb3ZpZGVkIG5vZGVcbiAgICogZGF0YSBhbmQgaW5kZXguIElmIGxlZnQgdW5kZWZpbmVkLCB0aGlzIG5vZGUgd2lsbCBiZSBjb25zaWRlcmVkIHRoZSBkZWZhdWx0IG5vZGUgdGVtcGxhdGUgdG9cbiAgICogdXNlIHdoZW4gbm8gb3RoZXIgd2hlbiBmdW5jdGlvbnMgcmV0dXJuIHRydWUgZm9yIHRoZSBkYXRhLlxuICAgKiBGb3IgZXZlcnkgbm9kZSwgdGhlcmUgbXVzdCBiZSBhdCBsZWFzdCBvbmUgd2hlbiBmdW5jdGlvbiB0aGF0IHBhc3NlcyBvciBhbiB1bmRlZmluZWQgdG9cbiAgICogZGVmYXVsdC5cbiAgICovXG4gIHdoZW46IChpbmRleDogbnVtYmVyLCBub2RlRGF0YTogVCkgPT4gYm9vbGVhbjtcblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT4pIHt9XG59XG4iXX0=