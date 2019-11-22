/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter, __extends, __generator } from "tslib";
import { HarnessEnvironment } from '@angular/cdk/testing';
import { by, element as protractorElement } from 'protractor';
import { ProtractorElement } from './protractor-element';
/** A `HarnessEnvironment` implementation for Protractor. */
var ProtractorHarnessEnvironment = /** @class */ (function (_super) {
    __extends(ProtractorHarnessEnvironment, _super);
    function ProtractorHarnessEnvironment(rawRootElement) {
        return _super.call(this, rawRootElement) || this;
    }
    /** Creates a `HarnessLoader` rooted at the document root. */
    ProtractorHarnessEnvironment.loader = function () {
        return new ProtractorHarnessEnvironment(protractorElement(by.css('body')));
    };
    ProtractorHarnessEnvironment.prototype.forceStabilize = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    ProtractorHarnessEnvironment.prototype.waitForTasksOutsideAngular = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    ProtractorHarnessEnvironment.prototype.getDocumentRoot = function () {
        return protractorElement(by.css('body'));
    };
    ProtractorHarnessEnvironment.prototype.createTestElement = function (element) {
        return new ProtractorElement(element);
    };
    ProtractorHarnessEnvironment.prototype.createEnvironment = function (element) {
        return new ProtractorHarnessEnvironment(element);
    };
    ProtractorHarnessEnvironment.prototype.getAllRawElements = function (selector) {
        return __awaiter(this, void 0, void 0, function () {
            var elementFinderArray, length, elements, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        elementFinderArray = this.rawRootElement.all(by.css(selector));
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
}(HarnessEnvironment));
export { ProtractorHarnessEnvironment };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQTZCLE1BQU0sc0JBQXNCLENBQUM7QUFDcEYsT0FBTyxFQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksaUJBQWlCLEVBQWdCLE1BQU0sWUFBWSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRXZELDREQUE0RDtBQUM1RDtJQUFrRCxnREFBaUM7SUFDakYsc0NBQXNCLGNBQTZCO2VBQ2pELGtCQUFNLGNBQWMsQ0FBQztJQUN2QixDQUFDO0lBRUQsNkRBQTZEO0lBQ3RELG1DQUFNLEdBQWI7UUFDRSxPQUFPLElBQUksNEJBQTRCLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVLLHFEQUFjLEdBQXBCOzs7O0tBQXdDO0lBRWxDLGlFQUEwQixHQUFoQzs7Ozs7O0tBR0M7SUFFUyxzREFBZSxHQUF6QjtRQUNFLE9BQU8saUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFUyx3REFBaUIsR0FBM0IsVUFBNEIsT0FBc0I7UUFDaEQsT0FBTyxJQUFJLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFUyx3REFBaUIsR0FBM0IsVUFBNEIsT0FBc0I7UUFDaEQsT0FBTyxJQUFJLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFZSx3REFBaUIsR0FBakMsVUFBa0MsUUFBZ0I7Ozs7Ozt3QkFDMUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3dCQUN0RCxxQkFBTSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsRUFBQTs7d0JBQXpDLE1BQU0sR0FBRyxTQUFnQzt3QkFDekMsUUFBUSxHQUFvQixFQUFFLENBQUM7d0JBQ3JDLEtBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzRCQUMvQixRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUMxQzt3QkFDRCxzQkFBTyxRQUFRLEVBQUM7Ozs7S0FDakI7SUFDSCxtQ0FBQztBQUFELENBQUMsQUF0Q0QsQ0FBa0Qsa0JBQWtCLEdBc0NuRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0hhcm5lc3NFbnZpcm9ubWVudCwgSGFybmVzc0xvYWRlciwgVGVzdEVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnksIGVsZW1lbnQgYXMgcHJvdHJhY3RvckVsZW1lbnQsIEVsZW1lbnRGaW5kZXJ9IGZyb20gJ3Byb3RyYWN0b3InO1xuaW1wb3J0IHtQcm90cmFjdG9yRWxlbWVudH0gZnJvbSAnLi9wcm90cmFjdG9yLWVsZW1lbnQnO1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgUHJvdHJhY3Rvci4gKi9cbmV4cG9ydCBjbGFzcyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50IGV4dGVuZHMgSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnRGaW5kZXI+IHtcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50RmluZGVyKSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBzdGF0aWMgbG9hZGVyKCk6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3Rvckhhcm5lc3NFbnZpcm9ubWVudChwcm90cmFjdG9yRWxlbWVudChieS5jc3MoJ2JvZHknKSkpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gIGFzeW5jIHdhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHdlIGNhbiBkbyB0aGlzIGZvciB0aGUgcHJvdHJhY3RvciBlbnZpcm9ubWVudC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL2lzc3Vlcy8xNzQxMlxuICB9XG5cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiBFbGVtZW50RmluZGVyIHtcbiAgICByZXR1cm4gcHJvdHJhY3RvckVsZW1lbnQoYnkuY3NzKCdib2R5JykpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpOiBUZXN0RWxlbWVudCB7XG4gICAgcmV0dXJuIG5ldyBQcm90cmFjdG9yRWxlbWVudChlbGVtZW50KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFbGVtZW50RmluZGVyKTogSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnRGaW5kZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb3RyYWN0b3JIYXJuZXNzRW52aXJvbm1lbnQoZWxlbWVudCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RWxlbWVudEZpbmRlcltdPiB7XG4gICAgY29uc3QgZWxlbWVudEZpbmRlckFycmF5ID0gdGhpcy5yYXdSb290RWxlbWVudC5hbGwoYnkuY3NzKHNlbGVjdG9yKSk7XG4gICAgY29uc3QgbGVuZ3RoID0gYXdhaXQgZWxlbWVudEZpbmRlckFycmF5LmNvdW50KCk7XG4gICAgY29uc3QgZWxlbWVudHM6IEVsZW1lbnRGaW5kZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsZW1lbnRzLnB1c2goZWxlbWVudEZpbmRlckFycmF5LmdldChpKSk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50cztcbiAgfVxufVxuIl19