/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, HostListener, Input } from '@angular/core';
import { CdkStepper } from './stepper';
import * as i0 from "@angular/core";
import * as i1 from "./stepper";
/** Button that moves to the next step in a stepper workflow. */
export class CdkStepperNext {
    constructor(_stepper) {
        this._stepper = _stepper;
        /** Type of the next button. Defaults to "submit" if not specified. */
        this.type = 'submit';
    }
    // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
    // In Ivy the `host` bindings will be merged when this class is extended, whereas in
    // ViewEngine they're overwritten.
    // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
    // tslint:disable-next-line:no-host-decorator-in-concrete
    _handleClick() {
        this._stepper.next();
    }
}
CdkStepperNext.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-rc.3", ngImport: i0, type: CdkStepperNext, deps: [{ token: i1.CdkStepper }], target: i0.ɵɵFactoryTarget.Directive });
CdkStepperNext.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-rc.3", type: CdkStepperNext, selector: "button[cdkStepperNext]", inputs: { type: "type" }, host: { listeners: { "click": "_handleClick()" }, properties: { "type": "type" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-rc.3", ngImport: i0, type: CdkStepperNext, decorators: [{
            type: Directive,
            args: [{
                    selector: 'button[cdkStepperNext]',
                    host: {
                        '[type]': 'type',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i1.CdkStepper }]; }, propDecorators: { type: [{
                type: Input
            }], _handleClick: [{
                type: HostListener,
                args: ['click']
            }] } });
/** Button that moves to the previous step in a stepper workflow. */
export class CdkStepperPrevious {
    constructor(_stepper) {
        this._stepper = _stepper;
        /** Type of the previous button. Defaults to "button" if not specified. */
        this.type = 'button';
    }
    // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
    // In Ivy the `host` bindings will be merged when this class is extended, whereas in
    // ViewEngine they're overwritten.
    // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
    // tslint:disable-next-line:no-host-decorator-in-concrete
    _handleClick() {
        this._stepper.previous();
    }
}
CdkStepperPrevious.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-rc.3", ngImport: i0, type: CdkStepperPrevious, deps: [{ token: i1.CdkStepper }], target: i0.ɵɵFactoryTarget.Directive });
CdkStepperPrevious.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-rc.3", type: CdkStepperPrevious, selector: "button[cdkStepperPrevious]", inputs: { type: "type" }, host: { listeners: { "click": "_handleClick()" }, properties: { "type": "type" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-rc.3", ngImport: i0, type: CdkStepperPrevious, decorators: [{
            type: Directive,
            args: [{
                    selector: 'button[cdkStepperPrevious]',
                    host: {
                        '[type]': 'type',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i1.CdkStepper }]; }, propDecorators: { type: [{
                type: Input
            }], _handleClick: [{
                type: HostListener,
                args: ['click']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RlcHBlci1idXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3N0ZXBwZXIvc3RlcHBlci1idXR0b24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTdELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxXQUFXLENBQUM7OztBQUVyQyxnRUFBZ0U7QUFPaEUsTUFBTSxPQUFPLGNBQWM7SUFJekIsWUFBbUIsUUFBb0I7UUFBcEIsYUFBUSxHQUFSLFFBQVEsQ0FBWTtRQUh2QyxzRUFBc0U7UUFDN0QsU0FBSSxHQUFXLFFBQVEsQ0FBQztJQUVTLENBQUM7SUFFM0Msb0ZBQW9GO0lBQ3BGLG9GQUFvRjtJQUNwRixrQ0FBa0M7SUFDbEMsa0ZBQWtGO0lBQ2xGLHlEQUF5RDtJQUV6RCxZQUFZO1FBQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN2QixDQUFDOztnSEFkVSxjQUFjO29HQUFkLGNBQWM7Z0dBQWQsY0FBYztrQkFOMUIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsd0JBQXdCO29CQUNsQyxJQUFJLEVBQUU7d0JBQ0osUUFBUSxFQUFFLE1BQU07cUJBQ2pCO2lCQUNGO2lHQUdVLElBQUk7c0JBQVosS0FBSztnQkFVTixZQUFZO3NCQURYLFlBQVk7dUJBQUMsT0FBTzs7QUFNdkIsb0VBQW9FO0FBT3BFLE1BQU0sT0FBTyxrQkFBa0I7SUFJN0IsWUFBbUIsUUFBb0I7UUFBcEIsYUFBUSxHQUFSLFFBQVEsQ0FBWTtRQUh2QywwRUFBMEU7UUFDakUsU0FBSSxHQUFXLFFBQVEsQ0FBQztJQUVTLENBQUM7SUFFM0Msb0ZBQW9GO0lBQ3BGLG9GQUFvRjtJQUNwRixrQ0FBa0M7SUFDbEMsa0ZBQWtGO0lBQ2xGLHlEQUF5RDtJQUV6RCxZQUFZO1FBQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQixDQUFDOztvSEFkVSxrQkFBa0I7d0dBQWxCLGtCQUFrQjtnR0FBbEIsa0JBQWtCO2tCQU45QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSw0QkFBNEI7b0JBQ3RDLElBQUksRUFBRTt3QkFDSixRQUFRLEVBQUUsTUFBTTtxQkFDakI7aUJBQ0Y7aUdBR1UsSUFBSTtzQkFBWixLQUFLO2dCQVVOLFlBQVk7c0JBRFgsWUFBWTt1QkFBQyxPQUFPIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aXZlLCBIb3N0TGlzdGVuZXIsIElucHV0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDZGtTdGVwcGVyfSBmcm9tICcuL3N0ZXBwZXInO1xuXG4vKiogQnV0dG9uIHRoYXQgbW92ZXMgdG8gdGhlIG5leHQgc3RlcCBpbiBhIHN0ZXBwZXIgd29ya2Zsb3cuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdidXR0b25bY2RrU3RlcHBlck5leHRdJyxcbiAgaG9zdDoge1xuICAgICdbdHlwZV0nOiAndHlwZScsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXBwZXJOZXh0IHtcbiAgLyoqIFR5cGUgb2YgdGhlIG5leHQgYnV0dG9uLiBEZWZhdWx0cyB0byBcInN1Ym1pdFwiIGlmIG5vdCBzcGVjaWZpZWQuICovXG4gIEBJbnB1dCgpIHR5cGU6IHN0cmluZyA9ICdzdWJtaXQnO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBfc3RlcHBlcjogQ2RrU3RlcHBlcikge31cblxuICAvLyBXZSBoYXZlIHRvIHVzZSBhIGBIb3N0TGlzdGVuZXJgIGhlcmUgaW4gb3JkZXIgdG8gc3VwcG9ydCBib3RoIEl2eSBhbmQgVmlld0VuZ2luZS5cbiAgLy8gSW4gSXZ5IHRoZSBgaG9zdGAgYmluZGluZ3Mgd2lsbCBiZSBtZXJnZWQgd2hlbiB0aGlzIGNsYXNzIGlzIGV4dGVuZGVkLCB3aGVyZWFzIGluXG4gIC8vIFZpZXdFbmdpbmUgdGhleSdyZSBvdmVyd3JpdHRlbi5cbiAgLy8gVE9ETyhjcmlzYmV0byk6IHdlIG1vdmUgdGhpcyBiYWNrIGludG8gYGhvc3RgIG9uY2UgSXZ5IGlzIHR1cm5lZCBvbiBieSBkZWZhdWx0LlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8taG9zdC1kZWNvcmF0b3ItaW4tY29uY3JldGVcbiAgQEhvc3RMaXN0ZW5lcignY2xpY2snKVxuICBfaGFuZGxlQ2xpY2soKSB7XG4gICAgdGhpcy5fc3RlcHBlci5uZXh0KCk7XG4gIH1cbn1cblxuLyoqIEJ1dHRvbiB0aGF0IG1vdmVzIHRvIHRoZSBwcmV2aW91cyBzdGVwIGluIGEgc3RlcHBlciB3b3JrZmxvdy4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ2J1dHRvbltjZGtTdGVwcGVyUHJldmlvdXNdJyxcbiAgaG9zdDoge1xuICAgICdbdHlwZV0nOiAndHlwZScsXG4gIH0sXG59KVxuZXhwb3J0IGNsYXNzIENka1N0ZXBwZXJQcmV2aW91cyB7XG4gIC8qKiBUeXBlIG9mIHRoZSBwcmV2aW91cyBidXR0b24uIERlZmF1bHRzIHRvIFwiYnV0dG9uXCIgaWYgbm90IHNwZWNpZmllZC4gKi9cbiAgQElucHV0KCkgdHlwZTogc3RyaW5nID0gJ2J1dHRvbic7XG5cbiAgY29uc3RydWN0b3IocHVibGljIF9zdGVwcGVyOiBDZGtTdGVwcGVyKSB7fVxuXG4gIC8vIFdlIGhhdmUgdG8gdXNlIGEgYEhvc3RMaXN0ZW5lcmAgaGVyZSBpbiBvcmRlciB0byBzdXBwb3J0IGJvdGggSXZ5IGFuZCBWaWV3RW5naW5lLlxuICAvLyBJbiBJdnkgdGhlIGBob3N0YCBiaW5kaW5ncyB3aWxsIGJlIG1lcmdlZCB3aGVuIHRoaXMgY2xhc3MgaXMgZXh0ZW5kZWQsIHdoZXJlYXMgaW5cbiAgLy8gVmlld0VuZ2luZSB0aGV5J3JlIG92ZXJ3cml0dGVuLlxuICAvLyBUT0RPKGNyaXNiZXRvKTogd2UgbW92ZSB0aGlzIGJhY2sgaW50byBgaG9zdGAgb25jZSBJdnkgaXMgdHVybmVkIG9uIGJ5IGRlZmF1bHQuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1ob3N0LWRlY29yYXRvci1pbi1jb25jcmV0ZVxuICBASG9zdExpc3RlbmVyKCdjbGljaycpXG4gIF9oYW5kbGVDbGljaygpIHtcbiAgICB0aGlzLl9zdGVwcGVyLnByZXZpb3VzKCk7XG4gIH1cbn1cbiJdfQ==