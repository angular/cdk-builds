/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/schematics/utils/version-agnostic-typescript", ["require", "exports", "typescript", "@angular-devkit/schematics"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This is just a type import and won't be generated in the release output.
     *
     * Note that we always need to adjust this type import based on the location of the Typescript
     * dependency that will be shipped with `@schematics/angular`.
     */
    const typescript = require("typescript");
    exports.typescript = typescript;
    const schematics_1 = require("@angular-devkit/schematics");
    /**
     * This is an agnostic re-export of TypeScript. Depending on the context, this module file will
     * return the TypeScript version that is being shipped within the `@schematics/angular` package,
     * or fall back to the TypeScript version that has been flattened in the node modules.
     *
     * This is necessary because we parse TypeScript files and pass the resolved AST to the
     * `@schematics/angular` package which might have a different TypeScript version installed.
     */
    let ts;
    exports.ts = ts;
    try {
        exports.ts = ts = require('@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript');
    }
    catch (_a) {
        // Fallback for CLI versions before v8.0.0. The TypeScript dependency has been dropped in
        // CLI version v8.0.0 but older CLI versions can still run the latest generation schematics.
        // See: https://github.com/angular/angular-cli/commit/bf1c069f73c8e3d4f0e8d584cbfb47c408c1730b
        try {
            exports.ts = ts = require('@schematics/angular/node_modules/typescript');
        }
        catch (_b) {
            try {
                exports.ts = ts = require('typescript');
            }
            catch (_c) {
                throw new schematics_1.SchematicsException('Error: Could not find a TypeScript version for the ' +
                    'schematics. Please report an issue on the Angular Material repository.');
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi1hZ25vc3RpYy10eXBlc2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL3ZlcnNpb24tYWdub3N0aWMtdHlwZXNjcmlwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVIOzs7OztPQUtHO0lBQ0gseUNBQTBDO0lBZ0M5QixnQ0FBVTtJQS9CdEIsMkRBQStEO0lBRS9EOzs7Ozs7O09BT0c7SUFDSCxJQUFJLEVBQXFCLENBQUM7SUFxQmxCLGdCQUFFO0lBbkJWLElBQUk7UUFDRixhQUFBLEVBQUUsR0FBRyxPQUFPLENBQUMsZ0ZBQWdGLENBQUMsQ0FBQztLQUNoRztJQUFDLFdBQU07UUFDTix5RkFBeUY7UUFDekYsNEZBQTRGO1FBQzVGLDhGQUE4RjtRQUM5RixJQUFJO1lBQ0YsYUFBQSxFQUFFLEdBQUcsT0FBTyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7U0FDN0Q7UUFBQyxXQUFNO1lBQ04sSUFBSTtnQkFDRixhQUFBLEVBQUUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDNUI7WUFBQyxXQUFNO2dCQUNOLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIscURBQXFEO29CQUNyRCx3RUFBd0UsQ0FBQyxDQUFDO2FBQy9FO1NBQ0Y7S0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoaXMgaXMganVzdCBhIHR5cGUgaW1wb3J0IGFuZCB3b24ndCBiZSBnZW5lcmF0ZWQgaW4gdGhlIHJlbGVhc2Ugb3V0cHV0LlxuICpcbiAqIE5vdGUgdGhhdCB3ZSBhbHdheXMgbmVlZCB0byBhZGp1c3QgdGhpcyB0eXBlIGltcG9ydCBiYXNlZCBvbiB0aGUgbG9jYXRpb24gb2YgdGhlIFR5cGVzY3JpcHRcbiAqIGRlcGVuZGVuY3kgdGhhdCB3aWxsIGJlIHNoaXBwZWQgd2l0aCBgQHNjaGVtYXRpY3MvYW5ndWxhcmAuXG4gKi9cbmltcG9ydCB0eXBlc2NyaXB0ID0gcmVxdWlyZSgndHlwZXNjcmlwdCcpO1xuaW1wb3J0IHtTY2hlbWF0aWNzRXhjZXB0aW9ufSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5cbi8qKlxuICogVGhpcyBpcyBhbiBhZ25vc3RpYyByZS1leHBvcnQgb2YgVHlwZVNjcmlwdC4gRGVwZW5kaW5nIG9uIHRoZSBjb250ZXh0LCB0aGlzIG1vZHVsZSBmaWxlIHdpbGxcbiAqIHJldHVybiB0aGUgVHlwZVNjcmlwdCB2ZXJzaW9uIHRoYXQgaXMgYmVpbmcgc2hpcHBlZCB3aXRoaW4gdGhlIGBAc2NoZW1hdGljcy9hbmd1bGFyYCBwYWNrYWdlLFxuICogb3IgZmFsbCBiYWNrIHRvIHRoZSBUeXBlU2NyaXB0IHZlcnNpb24gdGhhdCBoYXMgYmVlbiBmbGF0dGVuZWQgaW4gdGhlIG5vZGUgbW9kdWxlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHdlIHBhcnNlIFR5cGVTY3JpcHQgZmlsZXMgYW5kIHBhc3MgdGhlIHJlc29sdmVkIEFTVCB0byB0aGVcbiAqIGBAc2NoZW1hdGljcy9hbmd1bGFyYCBwYWNrYWdlIHdoaWNoIG1pZ2h0IGhhdmUgYSBkaWZmZXJlbnQgVHlwZVNjcmlwdCB2ZXJzaW9uIGluc3RhbGxlZC5cbiAqL1xubGV0IHRzOiB0eXBlb2YgdHlwZXNjcmlwdDtcblxudHJ5IHtcbiAgdHMgPSByZXF1aXJlKCdAc2NoZW1hdGljcy9hbmd1bGFyL3RoaXJkX3BhcnR5L2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvbGliL3R5cGVzY3JpcHQnKTtcbn0gY2F0Y2gge1xuICAvLyBGYWxsYmFjayBmb3IgQ0xJIHZlcnNpb25zIGJlZm9yZSB2OC4wLjAuIFRoZSBUeXBlU2NyaXB0IGRlcGVuZGVuY3kgaGFzIGJlZW4gZHJvcHBlZCBpblxuICAvLyBDTEkgdmVyc2lvbiB2OC4wLjAgYnV0IG9sZGVyIENMSSB2ZXJzaW9ucyBjYW4gc3RpbGwgcnVuIHRoZSBsYXRlc3QgZ2VuZXJhdGlvbiBzY2hlbWF0aWNzLlxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXItY2xpL2NvbW1pdC9iZjFjMDY5ZjczYzhlM2Q0ZjBlOGQ1ODRjYmZiNDdjNDA4YzE3MzBiXG4gIHRyeSB7XG4gICAgdHMgPSByZXF1aXJlKCdAc2NoZW1hdGljcy9hbmd1bGFyL25vZGVfbW9kdWxlcy90eXBlc2NyaXB0Jyk7XG4gIH0gY2F0Y2gge1xuICAgIHRyeSB7XG4gICAgICB0cyA9IHJlcXVpcmUoJ3R5cGVzY3JpcHQnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdFcnJvcjogQ291bGQgbm90IGZpbmQgYSBUeXBlU2NyaXB0IHZlcnNpb24gZm9yIHRoZSAnICtcbiAgICAgICAgICAnc2NoZW1hdGljcy4gUGxlYXNlIHJlcG9ydCBhbiBpc3N1ZSBvbiB0aGUgQW5ndWxhciBNYXRlcmlhbCByZXBvc2l0b3J5LicpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQge3RzLCB0eXBlc2NyaXB0fTtcbiJdfQ==