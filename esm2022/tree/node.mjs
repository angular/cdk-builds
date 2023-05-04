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
class CdkTreeNodeDef {
    /** @docs-private */
    constructor(template) {
        this.template = template;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTreeNodeDef, deps: [{ token: i0.TemplateRef }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkTreeNodeDef, selector: "[cdkTreeNodeDef]", inputs: { when: ["cdkTreeNodeDefWhen", "when"] }, ngImport: i0 }); }
}
export { CdkTreeNodeDef };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkTreeNodeDef, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkTreeNodeDef]',
                    inputs: ['when: cdkTreeNodeDefWhen'],
                }]
        }], ctorParameters: function () { return [{ type: i0.TemplateRef }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUUsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUVyRCxtREFBbUQ7QUFDbkQsTUFBTSxPQUFPLHdCQUF3QjtJQWFuQyxZQUFZLElBQU87UUFDakIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFJYSxjQUFjO0lBVXpCLG9CQUFvQjtJQUNwQixZQUFtQixRQUEwQjtRQUExQixhQUFRLEdBQVIsUUFBUSxDQUFrQjtJQUFHLENBQUM7OEdBWHRDLGNBQWM7a0dBQWQsY0FBYzs7U0FBZCxjQUFjOzJGQUFkLGNBQWM7a0JBSjFCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsTUFBTSxFQUFFLENBQUMsMEJBQTBCLENBQUM7aUJBQ3JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBUZW1wbGF0ZVJlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKiBDb250ZXh0IHByb3ZpZGVkIHRvIHRoZSB0cmVlIG5vZGUgY29tcG9uZW50LiAqL1xuZXhwb3J0IGNsYXNzIENka1RyZWVOb2RlT3V0bGV0Q29udGV4dDxUPiB7XG4gIC8qKiBEYXRhIGZvciB0aGUgbm9kZS4gKi9cbiAgJGltcGxpY2l0OiBUO1xuXG4gIC8qKiBEZXB0aCBvZiB0aGUgbm9kZS4gKi9cbiAgbGV2ZWw6IG51bWJlcjtcblxuICAvKiogSW5kZXggbG9jYXRpb24gb2YgdGhlIG5vZGUuICovXG4gIGluZGV4PzogbnVtYmVyO1xuXG4gIC8qKiBMZW5ndGggb2YgdGhlIG51bWJlciBvZiB0b3RhbCBkYXRhTm9kZXMuICovXG4gIGNvdW50PzogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGRhdGE6IFQpIHtcbiAgICB0aGlzLiRpbXBsaWNpdCA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBEYXRhIG5vZGUgZGVmaW5pdGlvbiBmb3IgdGhlIENka1RyZWUuXG4gKiBDYXB0dXJlcyB0aGUgbm9kZSdzIHRlbXBsYXRlIGFuZCBhIHdoZW4gcHJlZGljYXRlIHRoYXQgZGVzY3JpYmVzIHdoZW4gdGhpcyBub2RlIHNob3VsZCBiZSB1c2VkLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrVHJlZU5vZGVEZWZdJyxcbiAgaW5wdXRzOiBbJ3doZW46IGNka1RyZWVOb2RlRGVmV2hlbiddLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZURlZjxUPiB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gdHJ1ZSBpZiB0aGlzIG5vZGUgdGVtcGxhdGUgc2hvdWxkIGJlIHVzZWQgZm9yIHRoZSBwcm92aWRlZCBub2RlXG4gICAqIGRhdGEgYW5kIGluZGV4LiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGhpcyBub2RlIHdpbGwgYmUgY29uc2lkZXJlZCB0aGUgZGVmYXVsdCBub2RlIHRlbXBsYXRlIHRvXG4gICAqIHVzZSB3aGVuIG5vIG90aGVyIHdoZW4gZnVuY3Rpb25zIHJldHVybiB0cnVlIGZvciB0aGUgZGF0YS5cbiAgICogRm9yIGV2ZXJ5IG5vZGUsIHRoZXJlIG11c3QgYmUgYXQgbGVhc3Qgb25lIHdoZW4gZnVuY3Rpb24gdGhhdCBwYXNzZXMgb3IgYW4gdW5kZWZpbmVkIHRvXG4gICAqIGRlZmF1bHQuXG4gICAqL1xuICB3aGVuOiAoaW5kZXg6IG51bWJlciwgbm9kZURhdGE6IFQpID0+IGJvb2xlYW47XG5cbiAgLyoqIEBkb2NzLXByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IocHVibGljIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+KSB7fVxufVxuIl19