/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () { });
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3Byb3RyYWN0b3IvcHJvdHJhY3Rvci1oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxpQkFBaUIsRUFBZ0IsTUFBTSxZQUFZLENBQUM7QUFHM0UsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQsNERBQTREO0FBQzVELE1BQU0sT0FBTyw0QkFBNkIsU0FBUSxrQkFBaUM7SUFDakYsWUFBc0IsY0FBNkI7UUFDakQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCw2REFBNkQ7SUFDN0QsTUFBTSxDQUFDLE1BQU07UUFDWCxPQUFPLElBQUksNEJBQTRCLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVLLGNBQWM7c0VBQW1CLENBQUM7S0FBQTtJQUU5QixlQUFlO1FBQ3ZCLE9BQU8saUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFUyxpQkFBaUIsQ0FBQyxPQUFzQjtRQUNoRCxPQUFPLElBQUksaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVTLGlCQUFpQixDQUFDLE9BQXNCO1FBQ2hELE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRWUsaUJBQWlCLENBQUMsUUFBZ0I7O1lBQ2hELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sTUFBTSxHQUFHLE1BQU0sa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDaEQsTUFBTSxRQUFRLEdBQW9CLEVBQUUsQ0FBQztZQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMvQixRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztLQUFBO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtIYXJuZXNzRW52aXJvbm1lbnR9IGZyb20gJ0Bhbmd1bGFyL2Nkay90ZXN0aW5nJztcbmltcG9ydCB7YnksIGVsZW1lbnQgYXMgcHJvdHJhY3RvckVsZW1lbnQsIEVsZW1lbnRGaW5kZXJ9IGZyb20gJ3Byb3RyYWN0b3InO1xuaW1wb3J0IHtIYXJuZXNzTG9hZGVyfSBmcm9tICcuLi9jb21wb25lbnQtaGFybmVzcyc7XG5pbXBvcnQge1Rlc3RFbGVtZW50fSBmcm9tICcuLi90ZXN0LWVsZW1lbnQnO1xuaW1wb3J0IHtQcm90cmFjdG9yRWxlbWVudH0gZnJvbSAnLi9wcm90cmFjdG9yLWVsZW1lbnQnO1xuXG4vKiogQSBgSGFybmVzc0Vudmlyb25tZW50YCBpbXBsZW1lbnRhdGlvbiBmb3IgUHJvdHJhY3Rvci4gKi9cbmV4cG9ydCBjbGFzcyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50IGV4dGVuZHMgSGFybmVzc0Vudmlyb25tZW50PEVsZW1lbnRGaW5kZXI+IHtcbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKHJhd1Jvb3RFbGVtZW50OiBFbGVtZW50RmluZGVyKSB7XG4gICAgc3VwZXIocmF3Um9vdEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBzdGF0aWMgbG9hZGVyKCk6IEhhcm5lc3NMb2FkZXIge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3Rvckhhcm5lc3NFbnZpcm9ubWVudChwcm90cmFjdG9yRWxlbWVudChieS5jc3MoJ2JvZHknKSkpO1xuICB9XG5cbiAgYXN5bmMgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gIHByb3RlY3RlZCBnZXREb2N1bWVudFJvb3QoKTogRWxlbWVudEZpbmRlciB7XG4gICAgcmV0dXJuIHByb3RyYWN0b3JFbGVtZW50KGJ5LmNzcygnYm9keScpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjcmVhdGVUZXN0RWxlbWVudChlbGVtZW50OiBFbGVtZW50RmluZGVyKTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgUHJvdHJhY3RvckVsZW1lbnQoZWxlbWVudCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRWxlbWVudEZpbmRlcik6IEhhcm5lc3NFbnZpcm9ubWVudDxFbGVtZW50RmluZGVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm90cmFjdG9ySGFybmVzc0Vudmlyb25tZW50KGVsZW1lbnQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVsZW1lbnRGaW5kZXJbXT4ge1xuICAgIGNvbnN0IGVsZW1lbnRGaW5kZXJBcnJheSA9IHRoaXMucmF3Um9vdEVsZW1lbnQuYWxsKGJ5LmNzcyhzZWxlY3RvcikpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGF3YWl0IGVsZW1lbnRGaW5kZXJBcnJheS5jb3VudCgpO1xuICAgIGNvbnN0IGVsZW1lbnRzOiBFbGVtZW50RmluZGVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBlbGVtZW50cy5wdXNoKGVsZW1lbnRGaW5kZXJBcnJheS5nZXQoaSkpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudHM7XG4gIH1cbn1cbiJdfQ==