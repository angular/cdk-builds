/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { PendingCopy } from './pending-copy';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * A service for copying text to the clipboard.
 */
let Clipboard = /** @class */ (() => {
    class Clipboard {
        constructor(document) {
            this._document = document;
        }
        /**
         * Copies the provided text into the user's clipboard.
         *
         * @param text The string to copy.
         * @returns Whether the operation was successful.
         */
        copy(text) {
            const pendingCopy = this.beginCopy(text);
            const successful = pendingCopy.copy();
            pendingCopy.destroy();
            return successful;
        }
        /**
         * Prepares a string to be copied later. This is useful for large strings
         * which take too long to successfully render and be copied in the same tick.
         *
         * The caller must call `destroy` on the returned `PendingCopy`.
         *
         * @param text The string to copy.
         * @returns the pending copy operation.
         */
        beginCopy(text) {
            return new PendingCopy(text, this._document);
        }
    }
    Clipboard.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    Clipboard.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ];
    Clipboard.ɵprov = i0.ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(i0.ɵɵinject(i1.DOCUMENT)); }, token: Clipboard, providedIn: "root" });
    return Clipboard;
})();
export { Clipboard };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7OztBQUczQzs7R0FFRztBQUNIO0lBQUEsTUFDYSxTQUFTO1FBR3BCLFlBQThCLFFBQWE7WUFDekMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDNUIsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsSUFBSSxDQUFDLElBQVk7WUFDZixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdEIsT0FBTyxVQUFVLENBQUM7UUFDcEIsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsU0FBUyxDQUFDLElBQVk7WUFDcEIsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLENBQUM7OztnQkFqQ0YsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnREFJakIsTUFBTSxTQUFDLFFBQVE7OztvQkFwQjlCO0tBa0RDO1NBakNZLFNBQVMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGVuZGluZ0NvcHl9IGZyb20gJy4vcGVuZGluZy1jb3B5JztcblxuXG4vKipcbiAqIEEgc2VydmljZSBmb3IgY29weWluZyB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENsaXBib2FyZCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RvY3VtZW50OiBEb2N1bWVudDtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KERPQ1VNRU5UKSBkb2N1bWVudDogYW55KSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIHByb3ZpZGVkIHRleHQgaW50byB0aGUgdXNlcidzIGNsaXBib2FyZC5cbiAgICpcbiAgICogQHBhcmFtIHRleHQgVGhlIHN0cmluZyB0byBjb3B5LlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBvcGVyYXRpb24gd2FzIHN1Y2Nlc3NmdWwuXG4gICAqL1xuICBjb3B5KHRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHBlbmRpbmdDb3B5ID0gdGhpcy5iZWdpbkNvcHkodGV4dCk7XG4gICAgY29uc3Qgc3VjY2Vzc2Z1bCA9IHBlbmRpbmdDb3B5LmNvcHkoKTtcbiAgICBwZW5kaW5nQ29weS5kZXN0cm95KCk7XG5cbiAgICByZXR1cm4gc3VjY2Vzc2Z1bDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwYXJlcyBhIHN0cmluZyB0byBiZSBjb3BpZWQgbGF0ZXIuIFRoaXMgaXMgdXNlZnVsIGZvciBsYXJnZSBzdHJpbmdzXG4gICAqIHdoaWNoIHRha2UgdG9vIGxvbmcgdG8gc3VjY2Vzc2Z1bGx5IHJlbmRlciBhbmQgYmUgY29waWVkIGluIHRoZSBzYW1lIHRpY2suXG4gICAqXG4gICAqIFRoZSBjYWxsZXIgbXVzdCBjYWxsIGBkZXN0cm95YCBvbiB0aGUgcmV0dXJuZWQgYFBlbmRpbmdDb3B5YC5cbiAgICpcbiAgICogQHBhcmFtIHRleHQgVGhlIHN0cmluZyB0byBjb3B5LlxuICAgKiBAcmV0dXJucyB0aGUgcGVuZGluZyBjb3B5IG9wZXJhdGlvbi5cbiAgICovXG4gIGJlZ2luQ29weSh0ZXh0OiBzdHJpbmcpOiBQZW5kaW5nQ29weSB7XG4gICAgcmV0dXJuIG5ldyBQZW5kaW5nQ29weSh0ZXh0LCB0aGlzLl9kb2N1bWVudCk7XG4gIH1cbn1cbiJdfQ==