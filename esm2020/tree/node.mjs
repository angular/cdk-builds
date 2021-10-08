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
}
CdkTreeNodeDef.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTreeNodeDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive });
CdkTreeNodeDef.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkTreeNodeDef, selector: "[cdkTreeNodeDef]", inputs: { when: ["cdkTreeNodeDefWhen", "when"] }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkTreeNodeDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTreeNodeDef]',
                    inputs: [
                        'when: cdkTreeNodeDefWhen'
                    ],
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUdyRCxtREFBbUQ7QUFDbkQsTUFBTSxPQUFPLHdCQUF3QjtJQWFuQyxZQUFZLElBQU87UUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBT0gsTUFBTSxPQUFPLGNBQWM7SUFVekIsb0JBQW9CO0lBQ3BCLFlBQW1CLFFBQTBCO1FBQTFCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQUcsQ0FBQzs7bUhBWHRDLGNBQWM7dUdBQWQsY0FBYzttR0FBZCxjQUFjO2tCQU4xQixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLE1BQU0sRUFBRTt3QkFDTiwwQkFBMEI7cUJBQzNCO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBUZW1wbGF0ZVJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuLyoqIENvbnRleHQgcHJvdmlkZWQgdG8gdGhlIHRyZWUgbm9kZSBjb21wb25lbnQuICovXG5leHBvcnQgY2xhc3MgQ2RrVHJlZU5vZGVPdXRsZXRDb250ZXh0PFQ+IHtcbiAgLyoqIERhdGEgZm9yIHRoZSBub2RlLiAqL1xuICAkaW1wbGljaXQ6IFQ7XG5cbiAgLyoqIERlcHRoIG9mIHRoZSBub2RlLiAqL1xuICBsZXZlbDogbnVtYmVyO1xuXG4gIC8qKiBJbmRleCBsb2NhdGlvbiBvZiB0aGUgbm9kZS4gKi9cbiAgaW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqIExlbmd0aCBvZiB0aGUgbnVtYmVyIG9mIHRvdGFsIGRhdGFOb2Rlcy4gKi9cbiAgY291bnQ/OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoZGF0YTogVCkge1xuICAgIHRoaXMuJGltcGxpY2l0ID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIERhdGEgbm9kZSBkZWZpbml0aW9uIGZvciB0aGUgQ2RrVHJlZS5cbiAqIENhcHR1cmVzIHRoZSBub2RlJ3MgdGVtcGxhdGUgYW5kIGEgd2hlbiBwcmVkaWNhdGUgdGhhdCBkZXNjcmliZXMgd2hlbiB0aGlzIG5vZGUgc2hvdWxkIGJlIHVzZWQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtUcmVlTm9kZURlZl0nLFxuICBpbnB1dHM6IFtcbiAgICAnd2hlbjogY2RrVHJlZU5vZGVEZWZXaGVuJ1xuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZURlZjxUPiB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gdHJ1ZSBpZiB0aGlzIG5vZGUgdGVtcGxhdGUgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBwcm92aWRlZCBub2RlXG4gICAqIGRhdGEgYW5kIGluZGV4LiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGhpcyBub2RlIHdpbGwgYmUgY29uc2lkZXJlZCB0aGUgZGVmYXVsdCBub2RlIHRlbXBsYXRlIHRvXG4gICAqIHVzZSB3aGVuIG5vIG90aGVyIHdoZW4gZnVuY3Rpb25zIHJldHVybiB0cnVlIGZvciB0aGUgZGF0YS5cbiAgICogRm9yIGV2ZXJ5IG5vZGUsIHRoZXJlIG11c3QgYmUgYXQgbGVhc3Qgb25lIHdoZW4gZnVuY3Rpb24gdGhhdCBwYXNzZXMgb3IgYW4gdW5kZWZpbmVkIHRvXG4gICAqIGRlZmF1bHQuXG4gICAqL1xuICB3aGVuOiAoaW5kZXg6IG51bWJlciwgbm9kZURhdGE6IFQpID0+IGJvb2xlYW47XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IocHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuIl19