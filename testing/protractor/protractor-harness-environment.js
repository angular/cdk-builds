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
        define("@angular/cdk/testing/protractor/protractor-harness-environment", ["require", "exports", "tslib", "@angular/cdk/testing", "protractor", "@angular/cdk/testing/protractor/protractor-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var testing_1 = require("@angular/cdk/testing");
    var protractor_1 = require("protractor");
    var protractor_element_1 = require("@angular/cdk/testing/protractor/protractor-element");
    /** A `HarnessEnvironment` implementation for Protractor. */
    var ProtractorHarnessEnvironment = /** @class */ (function (_super) {
        tslib_1.__extends(ProtractorHarnessEnvironment, _super);
        function ProtractorHarnessEnvironment(rawRootElement) {
            return _super.call(this, rawRootElement) || this;
        }
        /** Creates a `HarnessLoader` rooted at the document root. */
        ProtractorHarnessEnvironment.loader = function () {
            return new ProtractorHarnessEnvironment(protractor_1.element(protractor_1.by.css('body')));
        };
        ProtractorHarnessEnvironment.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            }); });
        };
        ProtractorHarnessEnvironment.prototype.getDocumentRoot = function () {
            return protractor_1.element(protractor_1.by.css('body'));
        };
        ProtractorHarnessEnvironment.prototype.createTestElement = function (element) {
            return new protractor_element_1.ProtractorElement(element);
        };
        ProtractorHarnessEnvironment.prototype.createEnvironment = function (element) {
            return new ProtractorHarnessEnvironment(element);
        };
        ProtractorHarnessEnvironment.prototype.getAllRawElements = function (selector) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var elementFinderArray, length, elements, i;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            elementFinderArray = this.rawRootElement.all(protractor_1.by.css(selector));
                            return [4 /*yield*/, elementFinderArray.count()];
                        case 1:
                            length = _a.sent();
                            elements = [];
                            for (i = 0; i < length; i++) {
                                elements.push(elementFinderArray.get(i));
                            }
                            return [2 /*return*/, elements];
                    }
                });
            });
        };
        return ProtractorHarnessEnvironment;
    }(testing_1.HarnessEnvironment));
    exports.ProtractorHarnessEnvironment = ProtractorHarnessEnvironment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUF3RDtJQUN4RCx5Q0FBMkU7SUFHM0UseUZBQXVEO0lBRXZELDREQUE0RDtJQUM1RDtRQUFrRCx3REFBaUM7UUFDakYsc0NBQXNCLGNBQTZCO21CQUNqRCxrQkFBTSxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVELDZEQUE2RDtRQUN0RCxtQ0FBTSxHQUFiO1lBQ0UsT0FBTyxJQUFJLDRCQUE0QixDQUFDLG9CQUFpQixDQUFDLGVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFSyxxREFBYyxHQUFwQjs7OztTQUF3QztRQUU5QixzREFBZSxHQUF6QjtZQUNFLE9BQU8sb0JBQWlCLENBQUMsZUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFUyx3REFBaUIsR0FBM0IsVUFBNEIsT0FBc0I7WUFDaEQsT0FBTyxJQUFJLHNDQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFUyx3REFBaUIsR0FBM0IsVUFBNEIsT0FBc0I7WUFDaEQsT0FBTyxJQUFJLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFZSx3REFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7Ozs0QkFDMUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsZUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUN0RCxxQkFBTSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBQTs7NEJBQXpDLE1BQU0sR0FBRyxTQUFnQzs0QkFDekMsUUFBUSxHQUFvQixFQUFFLENBQUM7NEJBQ3JDLEtBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dDQUMvQixRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzZCQUMxQzs0QkFDRCxzQkFBTyxRQUFRLEVBQUM7Ozs7U0FDakI7UUFDSCxtQ0FBQztJQUFELENBQUMsQUFqQ0QsQ0FBa0QsNEJBQWtCLEdBaUNuRTtJQWpDWSxvRUFBNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtIYXJuZXNzRW52aXJvbm1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnksIGVsZW1lbnQgYXMgcHJvdHJhY3RvckVsZW1lbnQsIEVsZW1lbnRGaW5kZXJ9IGZyb20gJ3Byb3RyYWN0b3InO1xuaW1wb3J0IHtIYXJuZXNzTG9hZGVyfSBmcm9tICcuLi9jb21wb25lbnQtaGFybmVzcyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtQcm90cmFjdG9yRWxlbWVudH0gZnJvbSAnLi9wcm90cmFjdG9yLWVsZW1lbnQnO1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgUHJvdHJhY3Rvci4gKi9cbmV4cG9ydCBjbGFzcyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50IGV4dGVuZHMgSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnRGaW5kZXI+IHtcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50RmluZGVyKSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBzdGF0aWMgbG9hZGVyKCk6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3Rvckhhcm5lc3NFbnZpcm9ubWVudChwcm90cmFjdG9yRWxlbWVudChieS5jc3MoJ2JvZHknKSkpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudEZpbmRlciB7XG4gICAgcmV0dXJuIHByb3RyYWN0b3JFbGVtZW50KGJ5LmNzcygnYm9keScpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50RmluZGVyKTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3RvckVsZW1lbnQoZWxlbWVudCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudEZpbmRlcik6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50RmluZGVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRGaW5kZXJbXT4ge1xuICAgIGNvbnN0IGVsZW1lbnRGaW5kZXJBcnJheSA9IHRoaXMucmF3Um9vdEVsZW1lbnQuYWxsKGJ5LmNzcyhzZWxlY3RvcikpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGF3YWl0IGVsZW1lbnRGaW5kZXJBcnJheS5jb3VudCgpO1xuICAgIGNvbnN0IGVsZW1lbnRzOiBFbGVtZW50RmluZGVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnRGaW5kZXJBcnJheS5nZXQoaSkpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudHM7XG4gIH1cbn1cbiJdfQ==