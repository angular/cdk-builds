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
        define("@angular/cdk/testing/protractor/protractor-harness-environment", ["require", "exports", "tslib", "protractor", "@angular/cdk/testing/harness-environment", "@angular/cdk/testing/protractor/protractor-element"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var protractor_1 = require("protractor");
    var harness_environment_1 = require("@angular/cdk/testing/harness-environment");
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
    }(harness_environment_1.HarnessEnvironment));
    exports.ProtractorHarnessEnvironment = ProtractorHarnessEnvironment;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILHlDQUEyRTtJQUUzRSxnRkFBMEQ7SUFFMUQseUZBQXVEO0lBRXZELDREQUE0RDtJQUM1RDtRQUFrRCx3REFBaUM7UUFDakYsc0NBQXNCLGNBQTZCO21CQUNqRCxrQkFBTSxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVELDZEQUE2RDtRQUN0RCxtQ0FBTSxHQUFiO1lBQ0UsT0FBTyxJQUFJLDRCQUE0QixDQUFDLG9CQUFpQixDQUFDLGVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFUyxzREFBZSxHQUF6QjtZQUNFLE9BQU8sb0JBQWlCLENBQUMsZUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFUyx3REFBaUIsR0FBM0IsVUFBNEIsT0FBc0I7WUFDaEQsT0FBTyxJQUFJLHNDQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFUyx3REFBaUIsR0FBM0IsVUFBNEIsT0FBc0I7WUFDaEQsT0FBTyxJQUFJLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFZSx3REFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7Ozs0QkFDMUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsZUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUN0RCxxQkFBTSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBQTs7NEJBQXpDLE1BQU0sR0FBRyxTQUFnQzs0QkFDekMsUUFBUSxHQUFvQixFQUFFLENBQUM7NEJBQ3JDLEtBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dDQUMvQixRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzZCQUMxQzs0QkFDRCxzQkFBTyxRQUFRLEVBQUM7Ozs7U0FDakI7UUFDSCxtQ0FBQztJQUFELENBQUMsQUEvQkQsQ0FBa0Qsd0NBQWtCLEdBK0JuRTtJQS9CWSxvRUFBNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtieSwgZWxlbWVudCBhcyBwcm90cmFjdG9yRWxlbWVudCwgRWxlbWVudEZpbmRlcn0gZnJvbSAncHJvdHJhY3Rvcic7XG5pbXBvcnQge0hhcm5lc3NMb2FkZXJ9IGZyb20gJy4uL2NvbXBvbmVudC1oYXJuZXNzJztcbmltcG9ydCB7SGFybmVzc0Vudmlyb25tZW50fSBmcm9tICcuLi9oYXJuZXNzLWVudmlyb25tZW50JztcbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4uL3Rlc3QtZWxlbWVudCc7XG5pbXBvcnQge1Byb3RyYWN0b3JFbGVtZW50fSBmcm9tICcuL3Byb3RyYWN0b3ItZWxlbWVudCc7XG5cbi8qKiBBIGBIYXJuZXNzRW52aXJvbm1lbnRgIGltcGxlbWVudGF0aW9uIGZvciBQcm90cmFjdG9yLiAqL1xuZXhwb3J0IGNsYXNzIFByb3RyYWN0b3JIYXJuZXNzRW52aXJvbm1lbnQgZXh0ZW5kcyBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudEZpbmRlcj4ge1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IocmF3Um9vdEVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpIHtcbiAgICBzdXBlcihyYXdSb290RWxlbWVudCk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGRvY3VtZW50IHJvb3QuICovXG4gIHN0YXRpYyBsb2FkZXIoKTogSGFybmVzc0xvYWRlciB7XG4gICAgcmV0dXJuIG5ldyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50KHByb3RyYWN0b3JFbGVtZW50KGJ5LmNzcygnYm9keScpKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RG9jdW1lbnRSb290KCk6IEVsZW1lbnRGaW5kZXIge1xuICAgIHJldHVybiBwcm90cmFjdG9yRWxlbWVudChieS5jc3MoJ2JvZHknKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudEZpbmRlcik6IFRlc3RFbGVtZW50IHtcbiAgICByZXR1cm4gbmV3IFByb3RyYWN0b3JFbGVtZW50KGVsZW1lbnQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZUVudmlyb25tZW50KGVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpOiBIYXJuZXNzRW52aXJvbm1lbnQ8RWxlbWVudEZpbmRlcj4ge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3Rvckhhcm5lc3NFbnZpcm9ubWVudChlbGVtZW50KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxFbGVtZW50RmluZGVyW10+IHtcbiAgICBjb25zdCBlbGVtZW50RmluZGVyQXJyYXkgPSB0aGlzLnJhd1Jvb3RFbGVtZW50LmFsbChieS5jc3Moc2VsZWN0b3IpKTtcbiAgICBjb25zdCBsZW5ndGggPSBhd2FpdCBlbGVtZW50RmluZGVyQXJyYXkuY291bnQoKTtcbiAgICBjb25zdCBlbGVtZW50czogRWxlbWVudEZpbmRlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgZWxlbWVudHMucHVzaChlbGVtZW50RmluZGVyQXJyYXkuZ2V0KGkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnRzO1xuICB9XG59XG4iXX0=