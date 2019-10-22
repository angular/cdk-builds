/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Injectable, NgZone } from '@angular/core';
/**
 * Mock synchronous NgZone implementation that can be used
 * to flush out `onStable` subscriptions in tests.
 *
 * via: https://github.com/angular/angular/blob/master/packages/core/testing/src/ng_zone_mock.ts
 * @docs-private
 */
export class MockNgZone extends NgZone {
    constructor() {
        super({ enableLongStackTrace: false });
        this.onStable = new EventEmitter(false);
    }
    run(fn) {
        return fn();
    }
    runOutsideAngular(fn) {
        return fn();
    }
    simulateZoneExit() {
        this.onStable.emit(null);
    }
}
MockNgZone.decorators = [
    { type: Injectable },
];
/** @nocollapse */
MockNgZone.ctorParameters = () => [];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay1uZy16b25lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3ByaXZhdGUvbW9jay1uZy16b25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUcvRDs7Ozs7O0dBTUc7QUFFSCxNQUFNLE9BQU8sVUFBVyxTQUFRLE1BQU07SUFHcEM7UUFDRSxLQUFLLENBQUMsRUFBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBSHZDLGFBQVEsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7SUFJdEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxFQUFZO1FBQ2QsT0FBTyxFQUFFLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxFQUFZO1FBQzVCLE9BQU8sRUFBRSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQzs7O1lBbEJGLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFdmVudEVtaXR0ZXIsIEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuLyoqXG4gKiBNb2NrIHN5bmNocm9ub3VzIE5nWm9uZSBpbXBsZW1lbnRhdGlvbiB0aGF0IGNhbiBiZSB1c2VkXG4gKiB0byBmbHVzaCBvdXQgYG9uU3RhYmxlYCBzdWJzY3JpcHRpb25zIGluIHRlc3RzLlxuICpcbiAqIHZpYTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iL21hc3Rlci9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL25nX3pvbmVfbW9jay50c1xuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTW9ja05nWm9uZSBleHRlbmRzIE5nWm9uZSB7XG4gIG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHtlbmFibGVMb25nU3RhY2tUcmFjZTogZmFsc2V9KTtcbiAgfVxuXG4gIHJ1bihmbjogRnVuY3Rpb24pOiBhbnkge1xuICAgIHJldHVybiBmbigpO1xuICB9XG5cbiAgcnVuT3V0c2lkZUFuZ3VsYXIoZm46IEZ1bmN0aW9uKTogYW55IHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfVxuXG4gIHNpbXVsYXRlWm9uZUV4aXQoKTogdm9pZCB7XG4gICAgdGhpcy5vblN0YWJsZS5lbWl0KG51bGwpO1xuICB9XG59XG4iXX0=