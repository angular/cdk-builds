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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxpQkFBaUIsRUFBZ0IsTUFBTSxZQUFZLENBQUM7QUFHM0UsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQsNERBQTREO0FBQzVEO0lBQWtELGdEQUFpQztJQUNqRixzQ0FBc0IsY0FBNkI7ZUFDakQsa0JBQU0sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCw2REFBNkQ7SUFDdEQsbUNBQU0sR0FBYjtRQUNFLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUsscURBQWMsR0FBcEI7Ozs7S0FBd0M7SUFFbEMsaUVBQTBCLEdBQWhDOzs7Ozs7S0FHQztJQUVTLHNEQUFlLEdBQXpCO1FBQ0UsT0FBTyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVTLHdEQUFpQixHQUEzQixVQUE0QixPQUFzQjtRQUNoRCxPQUFPLElBQUksaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVTLHdEQUFpQixHQUEzQixVQUE0QixPQUFzQjtRQUNoRCxPQUFPLElBQUksNEJBQTRCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVlLHdEQUFpQixHQUFqQyxVQUFrQyxRQUFnQjs7Ozs7O3dCQUMxQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7d0JBQ3RELHFCQUFNLGtCQUFrQixDQUFDLEtBQUssRUFBRSxFQUFBOzt3QkFBekMsTUFBTSxHQUFHLFNBQWdDO3dCQUN6QyxRQUFRLEdBQW9CLEVBQUUsQ0FBQzt3QkFDckMsS0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQy9CLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQzFDO3dCQUNELHNCQUFPLFFBQVEsRUFBQzs7OztLQUNqQjtJQUNILG1DQUFDO0FBQUQsQ0FBQyxBQXRDRCxDQUFrRCxrQkFBa0IsR0FzQ25FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SGFybmVzc0Vudmlyb25tZW50fSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQge2J5LCBlbGVtZW50IGFzIHByb3RyYWN0b3JFbGVtZW50LCBFbGVtZW50RmluZGVyfSBmcm9tICdwcm90cmFjdG9yJztcbmltcG9ydCB7SGFybmVzc0xvYWRlcn0gZnJvbSAnLi4vY29tcG9uZW50LWhhcm5lc3MnO1xuaW1wb3J0IHtUZXN0RWxlbWVudH0gZnJvbSAnLi4vdGVzdC1lbGVtZW50JztcbmltcG9ydCB7UHJvdHJhY3RvckVsZW1lbnR9IGZyb20gJy4vcHJvdHJhY3Rvci1lbGVtZW50JztcblxuLyoqIEEgYEhhcm5lc3NFbnZpcm9ubWVudGAgaW1wbGVtZW50YXRpb24gZm9yIFByb3RyYWN0b3IuICovXG5leHBvcnQgY2xhc3MgUHJvdHJhY3Rvckhhcm5lc3NFbnZpcm9ubWVudCBleHRlbmRzIEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50RmluZGVyPiB7XG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihyYXdSb290RWxlbWVudDogRWxlbWVudEZpbmRlcikge1xuICAgIHN1cGVyKHJhd1Jvb3RFbGVtZW50KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZG9jdW1lbnQgcm9vdC4gKi9cbiAgc3RhdGljIGxvYWRlcigpOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFByb3RyYWN0b3JIYXJuZXNzRW52aXJvbm1lbnQocHJvdHJhY3RvckVsZW1lbnQoYnkuY3NzKCdib2R5JykpKTtcbiAgfVxuXG4gIGFzeW5jIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD4ge31cblxuICBhc3luYyB3YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IGhvdyB3ZSBjYW4gZG8gdGhpcyBmb3IgdGhlIHByb3RyYWN0b3IgZW52aXJvbm1lbnQuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMTc0MTJcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudEZpbmRlciB7XG4gICAgcmV0dXJuIHByb3RyYWN0b3JFbGVtZW50KGJ5LmNzcygnYm9keScpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50RmluZGVyKTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3RvckVsZW1lbnQoZWxlbWVudCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudEZpbmRlcik6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50RmluZGVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRGaW5kZXJbXT4ge1xuICAgIGNvbnN0IGVsZW1lbnRGaW5kZXJBcnJheSA9IHRoaXMucmF3Um9vdEVsZW1lbnQuYWxsKGJ5LmNzcyhzZWxlY3RvcikpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGF3YWl0IGVsZW1lbnRGaW5kZXJBcnJheS5jb3VudCgpO1xuICAgIGNvbnN0IGVsZW1lbnRzOiBFbGVtZW50RmluZGVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnRGaW5kZXJBcnJheS5nZXQoaSkpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudHM7XG4gIH1cbn1cbiJdfQ==