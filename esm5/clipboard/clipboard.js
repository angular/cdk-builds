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
 *
 * Example usage:
 *
 * clipboard.copy("copy this text");
 */
var Clipboard = /** @class */ (function () {
    function Clipboard(document) {
        this._document = document;
    }
    /**
     * Copies the provided text into the user's clipboard.
     *
     * @param text The string to copy.
     * @returns Whether the operation was successful.
     */
    Clipboard.prototype.copy = function (text) {
        var pendingCopy = this.beginCopy(text);
        var successful = pendingCopy.copy();
        pendingCopy.destroy();
        return successful;
    };
    /**
     * Prepares a string to be copied later. This is useful for large strings
     * which take too long to successfully render and be copied in the same tick.
     *
     * The caller must call `destroy` on the returned `PendingCopy`.
     *
     * @param text The string to copy.
     * @returns the pending copy operation.
     */
    Clipboard.prototype.beginCopy = function (text) {
        return new PendingCopy(text, this._document);
    };
    Clipboard.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    Clipboard.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
    ]; };
    Clipboard.ɵprov = i0.ɵɵdefineInjectable({ factory: function Clipboard_Factory() { return new Clipboard(i0.ɵɵinject(i1.DOCUMENT)); }, token: Clipboard, providedIn: "root" });
    return Clipboard;
}());
export { Clipboard };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7OztBQUczQzs7Ozs7O0dBTUc7QUFDSDtJQUlFLG1CQUE4QixRQUFhO1FBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILHdCQUFJLEdBQUosVUFBSyxJQUFZO1FBQ2YsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXRCLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILDZCQUFTLEdBQVQsVUFBVSxJQUFZO1FBQ3BCLE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvQyxDQUFDOztnQkFqQ0YsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7OztnREFJakIsTUFBTSxTQUFDLFFBQVE7OztvQkF4QjlCO0NBc0RDLEFBbENELElBa0NDO1NBakNZLFNBQVMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7UGVuZGluZ0NvcHl9IGZyb20gJy4vcGVuZGluZy1jb3B5JztcblxuXG4vKipcbiAqIEEgc2VydmljZSBmb3IgY29weWluZyB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQuXG4gKlxuICogRXhhbXBsZSB1c2FnZTpcbiAqXG4gKiBjbGlwYm9hcmQuY29weShcImNvcHkgdGhpcyB0ZXh0XCIpO1xuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDbGlwYm9hcmQge1xuICBwcml2YXRlIHJlYWRvbmx5IF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBwcm92aWRlZCB0ZXh0IGludG8gdGhlIHVzZXIncyBjbGlwYm9hcmQuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0IFRoZSBzdHJpbmcgdG8gY29weS5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgb3BlcmF0aW9uIHdhcyBzdWNjZXNzZnVsLlxuICAgKi9cbiAgY29weSh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBwZW5kaW5nQ29weSA9IHRoaXMuYmVnaW5Db3B5KHRleHQpO1xuICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBwZW5kaW5nQ29weS5jb3B5KCk7XG4gICAgcGVuZGluZ0NvcHkuZGVzdHJveSgpO1xuXG4gICAgcmV0dXJuIHN1Y2Nlc3NmdWw7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGFyZXMgYSBzdHJpbmcgdG8gYmUgY29waWVkIGxhdGVyLiBUaGlzIGlzIHVzZWZ1bCBmb3IgbGFyZ2Ugc3RyaW5nc1xuICAgKiB3aGljaCB0YWtlIHRvbyBsb25nIHRvIHN1Y2Nlc3NmdWxseSByZW5kZXIgYW5kIGJlIGNvcGllZCBpbiB0aGUgc2FtZSB0aWNrLlxuICAgKlxuICAgKiBUaGUgY2FsbGVyIG11c3QgY2FsbCBgZGVzdHJveWAgb24gdGhlIHJldHVybmVkIGBQZW5kaW5nQ29weWAuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0IFRoZSBzdHJpbmcgdG8gY29weS5cbiAgICogQHJldHVybnMgdGhlIHBlbmRpbmcgY29weSBvcGVyYXRpb24uXG4gICAqL1xuICBiZWdpbkNvcHkodGV4dDogc3RyaW5nKTogUGVuZGluZ0NvcHkge1xuICAgIHJldHVybiBuZXcgUGVuZGluZ0NvcHkodGV4dCwgdGhpcy5fZG9jdW1lbnQpO1xuICB9XG59XG4iXX0=