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
        define("@angular/cdk/schematics/utils/version-agnostic-typescript", ["require", "exports", "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript", "@angular-devkit/schematics"], factory);
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
    const typescript = require("@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi1hZ25vc3RpYy10eXBlc2NyaXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL3ZlcnNpb24tYWdub3N0aWMtdHlwZXNjcmlwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVIOzs7OztPQUtHO0lBQ0gsNkdBQzRGO0lBZ0NoRixnQ0FBVTtJQS9CdEIsMkRBQStEO0lBRS9EOzs7Ozs7O09BT0c7SUFDSCxJQUFJLEVBQXFCLENBQUM7SUFxQmxCLGdCQUFFO0lBbkJWLElBQUk7UUFDRixhQUFBLEVBQUUsR0FBRyxPQUFPLENBQUMsZ0ZBQWdGLENBQUMsQ0FBQztLQUNoRztJQUFDLFdBQU07UUFDTix5RkFBeUY7UUFDekYsNEZBQTRGO1FBQzVGLDhGQUE4RjtRQUM5RixJQUFJO1lBQ0YsYUFBQSxFQUFFLEdBQUcsT0FBTyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7U0FDN0Q7UUFBQyxXQUFNO1lBQ04sSUFBSTtnQkFDRixhQUFBLEVBQUUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDNUI7WUFBQyxXQUFNO2dCQUNOLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIscURBQXFEO29CQUNyRCx3RUFBd0UsQ0FBQyxDQUFDO2FBQy9FO1NBQ0Y7S0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoaXMgaXMganVzdCBhIHR5cGUgaW1wb3J0IGFuZCB3b24ndCBiZSBnZW5lcmF0ZWQgaW4gdGhlIHJlbGVhc2Ugb3V0cHV0LlxuICpcbiAqIE5vdGUgdGhhdCB3ZSBhbHdheXMgbmVlZCB0byBhZGp1c3QgdGhpcyB0eXBlIGltcG9ydCBiYXNlZCBvbiB0aGUgbG9jYXRpb24gb2YgdGhlIFR5cGVzY3JpcHRcbiAqIGRlcGVuZGVuY3kgdGhhdCB3aWxsIGJlIHNoaXBwZWQgd2l0aCBgQHNjaGVtYXRpY3MvYW5ndWxhcmAuXG4gKi9cbmltcG9ydCB0eXBlc2NyaXB0ID1cbiAgcmVxdWlyZSgnQHNjaGVtYXRpY3MvYW5ndWxhci90aGlyZF9wYXJ0eS9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2xpYi90eXBlc2NyaXB0Jyk7XG5pbXBvcnQge1NjaGVtYXRpY3NFeGNlcHRpb259IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuLyoqXG4gKiBUaGlzIGlzIGFuIGFnbm9zdGljIHJlLWV4cG9ydCBvZiBUeXBlU2NyaXB0LiBEZXBlbmRpbmcgb24gdGhlIGNvbnRleHQsIHRoaXMgbW9kdWxlIGZpbGUgd2lsbFxuICogcmV0dXJuIHRoZSBUeXBlU2NyaXB0IHZlcnNpb24gdGhhdCBpcyBiZWluZyBzaGlwcGVkIHdpdGhpbiB0aGUgYEBzY2hlbWF0aWNzL2FuZ3VsYXJgIHBhY2thZ2UsXG4gKiBvciBmYWxsIGJhY2sgdG8gdGhlIFR5cGVTY3JpcHQgdmVyc2lvbiB0aGF0IGhhcyBiZWVuIGZsYXR0ZW5lZCBpbiB0aGUgbm9kZSBtb2R1bGVzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugd2UgcGFyc2UgVHlwZVNjcmlwdCBmaWxlcyBhbmQgcGFzcyB0aGUgcmVzb2x2ZWQgQVNUIHRvIHRoZVxuICogYEBzY2hlbWF0aWNzL2FuZ3VsYXJgIHBhY2thZ2Ugd2hpY2ggbWlnaHQgaGF2ZSBhIGRpZmZlcmVudCBUeXBlU2NyaXB0IHZlcnNpb24gaW5zdGFsbGVkLlxuICovXG5sZXQgdHM6IHR5cGVvZiB0eXBlc2NyaXB0O1xuXG50cnkge1xuICB0cyA9IHJlcXVpcmUoJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvdGhpcmRfcGFydHkvZ2l0aHViLmNvbS9NaWNyb3NvZnQvVHlwZVNjcmlwdC9saWIvdHlwZXNjcmlwdCcpO1xufSBjYXRjaCB7XG4gIC8vIEZhbGxiYWNrIGZvciBDTEkgdmVyc2lvbnMgYmVmb3JlIHY4LjAuMC4gVGhlIFR5cGVTY3JpcHQgZGVwZW5kZW5jeSBoYXMgYmVlbiBkcm9wcGVkIGluXG4gIC8vIENMSSB2ZXJzaW9uIHY4LjAuMCBidXQgb2xkZXIgQ0xJIHZlcnNpb25zIGNhbiBzdGlsbCBydW4gdGhlIGxhdGVzdCBnZW5lcmF0aW9uIHNjaGVtYXRpY3MuXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci1jbGkvY29tbWl0L2JmMWMwNjlmNzNjOGUzZDRmMGU4ZDU4NGNiZmI0N2M0MDhjMTczMGJcbiAgdHJ5IHtcbiAgICB0cyA9IHJlcXVpcmUoJ0BzY2hlbWF0aWNzL2FuZ3VsYXIvbm9kZV9tb2R1bGVzL3R5cGVzY3JpcHQnKTtcbiAgfSBjYXRjaCB7XG4gICAgdHJ5IHtcbiAgICAgIHRzID0gcmVxdWlyZSgndHlwZXNjcmlwdCcpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0Vycm9yOiBDb3VsZCBub3QgZmluZCBhIFR5cGVTY3JpcHQgdmVyc2lvbiBmb3IgdGhlICcgK1xuICAgICAgICAgICdzY2hlbWF0aWNzLiBQbGVhc2UgcmVwb3J0IGFuIGlzc3VlIG9uIHRoZSBBbmd1bGFyIE1hdGVyaWFsIHJlcG9zaXRvcnkuJyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7dHMsIHR5cGVzY3JpcHR9O1xuIl19