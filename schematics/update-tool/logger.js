"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = void 0;
exports.defaultLogger = {
    debug: m => console.debug(m),
    error: m => console.error(m),
    fatal: m => console.error(m),
    info: m => console.info(m),
    warn: m => console.warn(m),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3VwZGF0ZS10b29sL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFVVSxRQUFBLGFBQWEsR0FBaUI7SUFDekMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDNUIsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDNUIsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDNUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBVcGRhdGVMb2dnZXIge1xuICBkZWJ1ZyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICBlcnJvcihtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICBmYXRhbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICBpbmZvKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQ7XG4gIHdhcm4obWVzc2FnZTogc3RyaW5nKTogdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRMb2dnZXI6IFVwZGF0ZUxvZ2dlciA9IHtcbiAgZGVidWc6IG0gPT4gY29uc29sZS5kZWJ1ZyhtKSxcbiAgZXJyb3I6IG0gPT4gY29uc29sZS5lcnJvcihtKSxcbiAgZmF0YWw6IG0gPT4gY29uc29sZS5lcnJvcihtKSxcbiAgaW5mbzogbSA9PiBjb25zb2xlLmluZm8obSksXG4gIHdhcm46IG0gPT4gY29uc29sZS53YXJuKG0pLFxufTtcbiJdfQ==