/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { Directive, ElementRef, InjectionToken, NgZone, Optional } from '@angular/core';
import { ScrollDispatcher } from './scroll-dispatcher';
import { CdkScrollable } from './scrollable';
import * as i0 from "@angular/core";
import * as i1 from "./scroll-dispatcher";
import * as i2 from "@angular/cdk/bidi";
export const VIRTUAL_SCROLLABLE = new InjectionToken('VIRTUAL_SCROLLABLE');
/**
 * Extending the {@link CdkScrollable} to be used as scrolling container for virtual scrolling.
 */
class CdkVirtualScrollable extends CdkScrollable {
    constructor(elementRef, scrollDispatcher, ngZone, dir) {
        super(elementRef, scrollDispatcher, ngZone, dir);
    }
    /**
     * Measure the viewport size for the provided orientation.
     *
     * @param orientation The orientation to measure the size from.
     */
    measureViewportSize(orientation) {
        const viewportEl = this.elementRef.nativeElement;
        return orientation === 'horizontal' ? viewportEl.clientWidth : viewportEl.clientHeight;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkVirtualScrollable, deps: [{ token: i0.ElementRef }, { token: i1.ScrollDispatcher }, { token: i0.NgZone }, { token: i2.Directionality, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkVirtualScrollable, usesInheritance: true, ngImport: i0 }); }
}
export { CdkVirtualScrollable };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkVirtualScrollable, decorators: [{
            type: Directive
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.ScrollDispatcher }, { type: i0.NgZone }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlydHVhbC1zY3JvbGxhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY3JvbGxpbmcvdmlydHVhbC1zY3JvbGxhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDOzs7O0FBRTNDLE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUFHLElBQUksY0FBYyxDQUF1QixvQkFBb0IsQ0FBQyxDQUFDO0FBRWpHOztHQUVHO0FBQ0gsTUFDc0Isb0JBQXFCLFNBQVEsYUFBYTtJQUM5RCxZQUNFLFVBQW1DLEVBQ25DLGdCQUFrQyxFQUNsQyxNQUFjLEVBQ0YsR0FBb0I7UUFFaEMsS0FBSyxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxtQkFBbUIsQ0FBQyxXQUFzQztRQUN4RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztRQUNqRCxPQUFPLFdBQVcsS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7SUFDekYsQ0FBQzs4R0FsQm1CLG9CQUFvQjtrR0FBcEIsb0JBQW9COztTQUFwQixvQkFBb0I7MkZBQXBCLG9CQUFvQjtrQkFEekMsU0FBUzs7MEJBTUwsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5qZWN0aW9uVG9rZW4sIE5nWm9uZSwgT3B0aW9uYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTY3JvbGxEaXNwYXRjaGVyfSBmcm9tICcuL3Njcm9sbC1kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2RrU2Nyb2xsYWJsZX0gZnJvbSAnLi9zY3JvbGxhYmxlJztcblxuZXhwb3J0IGNvbnN0IFZJUlRVQUxfU0NST0xMQUJMRSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtWaXJ0dWFsU2Nyb2xsYWJsZT4oJ1ZJUlRVQUxfU0NST0xMQUJMRScpO1xuXG4vKipcbiAqIEV4dGVuZGluZyB0aGUge0BsaW5rIENka1Njcm9sbGFibGV9IHRvIGJlIHVzZWQgYXMgc2Nyb2xsaW5nIGNvbnRhaW5lciBmb3IgdmlydHVhbCBzY3JvbGxpbmcuXG4gKi9cbkBEaXJlY3RpdmUoKVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENka1ZpcnR1YWxTY3JvbGxhYmxlIGV4dGVuZHMgQ2RrU2Nyb2xsYWJsZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIHNjcm9sbERpc3BhdGNoZXI6IFNjcm9sbERpc3BhdGNoZXIsXG4gICAgbmdab25lOiBOZ1pvbmUsXG4gICAgQE9wdGlvbmFsKCkgZGlyPzogRGlyZWN0aW9uYWxpdHksXG4gICkge1xuICAgIHN1cGVyKGVsZW1lbnRSZWYsIHNjcm9sbERpc3BhdGNoZXIsIG5nWm9uZSwgZGlyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSB2aWV3cG9ydCBzaXplIGZvciB0aGUgcHJvdmlkZWQgb3JpZW50YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBvcmllbnRhdGlvbiBUaGUgb3JpZW50YXRpb24gdG8gbWVhc3VyZSB0aGUgc2l6ZSBmcm9tLlxuICAgKi9cbiAgbWVhc3VyZVZpZXdwb3J0U2l6ZShvcmllbnRhdGlvbjogJ2hvcml6b250YWwnIHwgJ3ZlcnRpY2FsJykge1xuICAgIGNvbnN0IHZpZXdwb3J0RWwgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gb3JpZW50YXRpb24gPT09ICdob3Jpem9udGFsJyA/IHZpZXdwb3J0RWwuY2xpZW50V2lkdGggOiB2aWV3cG9ydEVsLmNsaWVudEhlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlIHRoZSBib3VuZGluZyBDbGllbnRSZWN0IHNpemUgaW5jbHVkaW5nIHRoZSBzY3JvbGwgb2Zmc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gZnJvbSBUaGUgZWRnZSB0byBtZWFzdXJlIGZyb20uXG4gICAqL1xuICBhYnN0cmFjdCBtZWFzdXJlQm91bmRpbmdDbGllbnRSZWN0V2l0aFNjcm9sbE9mZnNldChcbiAgICBmcm9tOiAnbGVmdCcgfCAndG9wJyB8ICdyaWdodCcgfCAnYm90dG9tJyxcbiAgKTogbnVtYmVyO1xufVxuIl19