/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { HarnessEnvironment } from '@angular/cdk/testing';
import { by, element as protractorElement } from 'protractor';
import { ProtractorElement } from './protractor-element';
/** A `HarnessEnvironment` implementation for Protractor. */
export class ProtractorHarnessEnvironment extends HarnessEnvironment {
    constructor(rawRootElement) {
        super(rawRootElement);
    }
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader() {
        return new ProtractorHarnessEnvironment(protractorElement(by.css('body')));
    }
    forceStabilize() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    waitForTasksOutsideAngular() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: figure out how we can do this for the protractor environment.
            // https://github.com/angular/components/issues/17412
        });
    }
    getDocumentRoot() {
        return protractorElement(by.css('body'));
    }
    createTestElement(element) {
        return new ProtractorElement(element);
    }
    createEnvironment(element) {
        return new ProtractorHarnessEnvironment(element);
    }
    getAllRawElements(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const elementFinderArray = this.rawRootElement.all(by.css(selector));
            const length = yield elementFinderArray.count();
            const elements = [];
            for (let i = 0; i < length; i++) {
                elements.push(elementFinderArray.get(i));
            }
            return elements;
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQTZCLE1BQU0sc0JBQXNCLENBQUM7QUFDcEYsT0FBTyxFQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksaUJBQWlCLEVBQWdCLE1BQU0sWUFBWSxDQUFDO0FBQzNFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRXZELDREQUE0RDtBQUM1RCxNQUFNLE9BQU8sNEJBQTZCLFNBQVEsa0JBQWlDO0lBQ2pGLFlBQXNCLGNBQTZCO1FBQ2pELEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsNkRBQTZEO0lBQzdELE1BQU0sQ0FBQyxNQUFNO1FBQ1gsT0FBTyxJQUFJLDRCQUE0QixDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFSyxjQUFjOzhEQUFtQixDQUFDO0tBQUE7SUFFbEMsMEJBQTBCOztZQUM5QixzRUFBc0U7WUFDdEUscURBQXFEO1FBQ3ZELENBQUM7S0FBQTtJQUVTLGVBQWU7UUFDdkIsT0FBTyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVTLGlCQUFpQixDQUFDLE9BQXNCO1FBQ2hELE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMsaUJBQWlCLENBQUMsT0FBc0I7UUFDaEQsT0FBTyxJQUFJLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFZSxpQkFBaUIsQ0FBQyxRQUFnQjs7WUFDaEQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxNQUFNLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoRCxNQUFNLFFBQVEsR0FBb0IsRUFBRSxDQUFDO1lBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9CLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDMUM7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDO0tBQUE7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0hhcm5lc3NFbnZpcm9ubWVudCwgSGFybmVzc0xvYWRlciwgVGVzdEVsZW1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnksIGVsZW1lbnQgYXMgcHJvdHJhY3RvckVsZW1lbnQsIEVsZW1lbnRGaW5kZXJ9IGZyb20gJ3Byb3RyYWN0b3InO1xuaW1wb3J0IHtQcm90cmFjdG9yRWxlbWVudH0gZnJvbSAnLi9wcm90cmFjdG9yLWVsZW1lbnQnO1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgUHJvdHJhY3Rvci4gKi9cbmV4cG9ydCBjbGFzcyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50IGV4dGVuZHMgSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnRGaW5kZXI+IHtcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50RmluZGVyKSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBzdGF0aWMgbG9hZGVyKCk6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3Rvckhhcm5lc3NFbnZpcm9ubWVudChwcm90cmFjdG9yRWxlbWVudChieS5jc3MoJ2JvZHknKSkpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gIGFzeW5jIHdhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFRPRE86IGZpZ3VyZSBvdXQgaG93IHdlIGNhbiBkbyB0aGlzIGZvciB0aGUgcHJvdHJhY3RvciBlbnZpcm9ubWVudC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL2lzc3Vlcy8xNzQxMlxuICB9XG5cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiBFbGVtZW50RmluZGVyIHtcbiAgICByZXR1cm4gcHJvdHJhY3RvckVsZW1lbnQoYnkuY3NzKCdib2R5JykpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnRGaW5kZXIpOiBUZXN0RWxlbWVudCB7XG4gICAgcmV0dXJuIG5ldyBQcm90cmFjdG9yRWxlbWVudChlbGVtZW50KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFbGVtZW50RmluZGVyKTogSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnRGaW5kZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb3RyYWN0b3JIYXJuZXNzRW52aXJvbm1lbnQoZWxlbWVudCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RWxlbWVudEZpbmRlcltdPiB7XG4gICAgY29uc3QgZWxlbWVudEZpbmRlckFycmF5ID0gdGhpcy5yYXdSb290RWxlbWVudC5hbGwoYnkuY3NzKHNlbGVjdG9yKSk7XG4gICAgY29uc3QgbGVuZ3RoID0gYXdhaXQgZWxlbWVudEZpbmRlckFycmF5LmNvdW50KCk7XG4gICAgY29uc3QgZWxlbWVudHM6IEVsZW1lbnRGaW5kZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGVsZW1lbnRzLnB1c2goZWxlbWVudEZpbmRlckFycmF5LmdldChpKSk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50cztcbiAgfVxufVxuIl19