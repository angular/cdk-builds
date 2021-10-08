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
/**
 * A service for copying text to the clipboard.
 */
export class Clipboard {
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
Clipboard.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Clipboard, deps: [{ token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable });
Clipboard.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Clipboard, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: Clipboard, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jbGlwYm9hcmQvY2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7O0FBRzNDOztHQUVHO0FBRUgsTUFBTSxPQUFPLFNBQVM7SUFHcEIsWUFBOEIsUUFBYTtRQUN6QyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxJQUFJLENBQUMsSUFBWTtRQUNmLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUV0QixPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxTQUFTLENBQUMsSUFBWTtRQUNwQixPQUFPLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0MsQ0FBQzs7OEdBaENVLFNBQVMsa0JBR0EsUUFBUTtrSEFIakIsU0FBUyxjQURHLE1BQU07bUdBQ2xCLFNBQVM7a0JBRHJCLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOzswQkFJakIsTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BlbmRpbmdDb3B5fSBmcm9tICcuL3BlbmRpbmctY29weSc7XG5cblxuLyoqXG4gKiBBIHNlcnZpY2UgZm9yIGNvcHlpbmcgdGV4dCB0byB0aGUgY2xpcGJvYXJkLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDbGlwYm9hcmQge1xuICBwcml2YXRlIHJlYWRvbmx5IF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgZG9jdW1lbnQ6IGFueSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBwcm92aWRlZCB0ZXh0IGludG8gdGhlIHVzZXIncyBjbGlwYm9hcmQuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0IFRoZSBzdHJpbmcgdG8gY29weS5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgb3BlcmF0aW9uIHdhcyBzdWNjZXNzZnVsLlxuICAgKi9cbiAgY29weSh0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBwZW5kaW5nQ29weSA9IHRoaXMuYmVnaW5Db3B5KHRleHQpO1xuICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBwZW5kaW5nQ29weS5jb3B5KCk7XG4gICAgcGVuZGluZ0NvcHkuZGVzdHJveSgpO1xuXG4gICAgcmV0dXJuIHN1Y2Nlc3NmdWw7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGFyZXMgYSBzdHJpbmcgdG8gYmUgY29waWVkIGxhdGVyLiBUaGlzIGlzIHVzZWZ1bCBmb3IgbGFyZ2Ugc3RyaW5nc1xuICAgKiB3aGljaCB0YWtlIHRvbyBsb25nIHRvIHN1Y2Nlc3NmdWxseSByZW5kZXIgYW5kIGJlIGNvcGllZCBpbiB0aGUgc2FtZSB0aWNrLlxuICAgKlxuICAgKiBUaGUgY2FsbGVyIG11c3QgY2FsbCBgZGVzdHJveWAgb24gdGhlIHJldHVybmVkIGBQZW5kaW5nQ29weWAuXG4gICAqXG4gICAqIEBwYXJhbSB0ZXh0IFRoZSBzdHJpbmcgdG8gY29weS5cbiAgICogQHJldHVybnMgdGhlIHBlbmRpbmcgY29weSBvcGVyYXRpb24uXG4gICAqL1xuICBiZWdpbkNvcHkodGV4dDogc3RyaW5nKTogUGVuZGluZ0NvcHkge1xuICAgIHJldHVybiBuZXcgUGVuZGluZ0NvcHkodGV4dCwgdGhpcy5fZG9jdW1lbnQpO1xuICB9XG59XG4iXX0=