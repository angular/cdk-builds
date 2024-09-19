"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const schematics_1 = require("@angular-devkit/schematics");
const utils_1 = require("../../utils");
/** Scaffolds a new Angular component that uses the Drag and Drop module. */
function default_1(options) {
    return (0, schematics_1.chain)([
        (0, utils_1.buildComponent)({ ...options }, {
            template: './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.html.template',
            stylesheet: './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.__style__.template',
        }),
        options.skipImport ? (0, schematics_1.noop)() : addDragDropModulesToModule(options),
    ]);
}
/** Adds the required modules to the main module of the CLI project. */
function addDragDropModulesToModule(options) {
    return async (host) => {
        const isStandalone = await (0, utils_1.isStandaloneSchematic)(host, options);
        if (!isStandalone) {
            const modulePath = await (0, utils_1.findModuleFromOptions)(host, options);
            (0, utils_1.addModuleImportToModule)(host, modulePath, 'DragDropModule', '@angular/cdk/drag-drop');
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctZ2VuZXJhdGUvZHJhZy1kcm9wL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBWUgsNEJBYUM7QUF2QkQsMkRBQW1FO0FBQ25FLHVDQUtxQjtBQUdyQiw0RUFBNEU7QUFDNUUsbUJBQXlCLE9BQWU7SUFDdEMsT0FBTyxJQUFBLGtCQUFLLEVBQUM7UUFDWCxJQUFBLHNCQUFjLEVBQ1osRUFBQyxHQUFHLE9BQU8sRUFBQyxFQUNaO1lBQ0UsUUFBUSxFQUNOLGtGQUFrRjtZQUNwRixVQUFVLEVBQ1IsdUZBQXVGO1NBQzFGLENBQ0Y7UUFDRCxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEdBQUUsQ0FBQyxDQUFDLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDO0tBQ2xFLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCx1RUFBdUU7QUFDdkUsU0FBUywwQkFBMEIsQ0FBQyxPQUFlO0lBQ2pELE9BQU8sS0FBSyxFQUFFLElBQVUsRUFBRSxFQUFFO1FBQzFCLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSw2QkFBcUIsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSw2QkFBcUIsRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUQsSUFBQSwrQkFBdUIsRUFBQyxJQUFJLEVBQUUsVUFBVyxFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDekYsQ0FBQztJQUNILENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y2hhaW4sIG5vb3AsIFJ1bGUsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7XG4gIGFkZE1vZHVsZUltcG9ydFRvTW9kdWxlLFxuICBidWlsZENvbXBvbmVudCxcbiAgZmluZE1vZHVsZUZyb21PcHRpb25zLFxuICBpc1N0YW5kYWxvbmVTY2hlbWF0aWMsXG59IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7U2NoZW1hfSBmcm9tICcuL3NjaGVtYSc7XG5cbi8qKiBTY2FmZm9sZHMgYSBuZXcgQW5ndWxhciBjb21wb25lbnQgdGhhdCB1c2VzIHRoZSBEcmFnIGFuZCBEcm9wIG1vZHVsZS4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zOiBTY2hlbWEpOiBSdWxlIHtcbiAgcmV0dXJuIGNoYWluKFtcbiAgICBidWlsZENvbXBvbmVudChcbiAgICAgIHsuLi5vcHRpb25zfSxcbiAgICAgIHtcbiAgICAgICAgdGVtcGxhdGU6XG4gICAgICAgICAgJy4vX19wYXRoX18vX19uYW1lQGRhc2hlcml6ZUBpZi1mbGF0X18vX19uYW1lQGRhc2hlcml6ZV9fLmNvbXBvbmVudC5odG1sLnRlbXBsYXRlJyxcbiAgICAgICAgc3R5bGVzaGVldDpcbiAgICAgICAgICAnLi9fX3BhdGhfXy9fX25hbWVAZGFzaGVyaXplQGlmLWZsYXRfXy9fX25hbWVAZGFzaGVyaXplX18uY29tcG9uZW50Ll9fc3R5bGVfXy50ZW1wbGF0ZScsXG4gICAgICB9LFxuICAgICksXG4gICAgb3B0aW9ucy5za2lwSW1wb3J0ID8gbm9vcCgpIDogYWRkRHJhZ0Ryb3BNb2R1bGVzVG9Nb2R1bGUob3B0aW9ucyksXG4gIF0pO1xufVxuXG4vKiogQWRkcyB0aGUgcmVxdWlyZWQgbW9kdWxlcyB0byB0aGUgbWFpbiBtb2R1bGUgb2YgdGhlIENMSSBwcm9qZWN0LiAqL1xuZnVuY3Rpb24gYWRkRHJhZ0Ryb3BNb2R1bGVzVG9Nb2R1bGUob3B0aW9uczogU2NoZW1hKSB7XG4gIHJldHVybiBhc3luYyAoaG9zdDogVHJlZSkgPT4ge1xuICAgIGNvbnN0IGlzU3RhbmRhbG9uZSA9IGF3YWl0IGlzU3RhbmRhbG9uZVNjaGVtYXRpYyhob3N0LCBvcHRpb25zKTtcblxuICAgIGlmICghaXNTdGFuZGFsb25lKSB7XG4gICAgICBjb25zdCBtb2R1bGVQYXRoID0gYXdhaXQgZmluZE1vZHVsZUZyb21PcHRpb25zKGhvc3QsIG9wdGlvbnMpO1xuICAgICAgYWRkTW9kdWxlSW1wb3J0VG9Nb2R1bGUoaG9zdCwgbW9kdWxlUGF0aCEsICdEcmFnRHJvcE1vZHVsZScsICdAYW5ndWxhci9jZGsvZHJhZy1kcm9wJyk7XG4gICAgfVxuICB9O1xufVxuIl19