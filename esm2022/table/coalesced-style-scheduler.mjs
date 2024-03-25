/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EnvironmentInjector, Injectable, InjectionToken, NgZone, afterNextRender, inject, } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * @docs-private
 */
export class _Schedule {
    constructor() {
        this.tasks = [];
        this.endTasks = [];
    }
}
/** Injection token used to provide a coalesced style scheduler. */
export const _COALESCED_STYLE_SCHEDULER = new InjectionToken('_COALESCED_STYLE_SCHEDULER');
/**
 * Allows grouping up CSSDom mutations after the current execution context.
 * This can significantly improve performance when separate consecutive functions are
 * reading from the CSSDom and then mutating it.
 *
 * @docs-private
 */
export class _CoalescedStyleScheduler {
    constructor(_unusedNgZone) {
        this._currentSchedule = null;
        this._injector = inject(EnvironmentInjector);
    }
    /**
     * Schedules the specified task to run at the end of the current VM turn.
     */
    schedule(task) {
        this._createScheduleIfNeeded();
        this._currentSchedule.tasks.push(task);
    }
    /**
     * Schedules the specified task to run after other scheduled tasks at the end of the current
     * VM turn.
     */
    scheduleEnd(task) {
        this._createScheduleIfNeeded();
        this._currentSchedule.endTasks.push(task);
    }
    _createScheduleIfNeeded() {
        if (this._currentSchedule) {
            return;
        }
        this._currentSchedule = new _Schedule();
        afterNextRender(() => {
            while (this._currentSchedule.tasks.length || this._currentSchedule.endTasks.length) {
                const schedule = this._currentSchedule;
                // Capture new tasks scheduled by the current set of tasks.
                this._currentSchedule = new _Schedule();
                for (const task of schedule.tasks) {
                    task();
                }
                for (const task of schedule.endTasks) {
                    task();
                }
            }
            this._currentSchedule = null;
        }, { injector: this._injector });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.0.0-next.1", ngImport: i0, type: _CoalescedStyleScheduler, deps: [{ token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.0.0-next.1", ngImport: i0, type: _CoalescedStyleScheduler }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.0.0-next.1", ngImport: i0, type: _CoalescedStyleScheduler, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: i0.NgZone }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsbUJBQW1CLEVBQ25CLFVBQVUsRUFDVixjQUFjLEVBQ2QsTUFBTSxFQUNOLGVBQWUsRUFDZixNQUFNLEdBQ1AsTUFBTSxlQUFlLENBQUM7O0FBRXZCOztHQUVHO0FBQ0gsTUFBTSxPQUFPLFNBQVM7SUFBdEI7UUFDRSxVQUFLLEdBQXNCLEVBQUUsQ0FBQztRQUM5QixhQUFRLEdBQXNCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0NBQUE7QUFFRCxtRUFBbUU7QUFDbkUsTUFBTSxDQUFDLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxjQUFjLENBQzFELDRCQUE0QixDQUM3QixDQUFDO0FBRUY7Ozs7OztHQU1HO0FBRUgsTUFBTSxPQUFPLHdCQUF3QjtJQUluQyxZQUFZLGFBQXNCO1FBSDFCLHFCQUFnQixHQUFxQixJQUFJLENBQUM7UUFDMUMsY0FBUyxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBRVgsQ0FBQztJQUV0Qzs7T0FFRztJQUNILFFBQVEsQ0FBQyxJQUFtQjtRQUMxQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUUvQixJQUFJLENBQUMsZ0JBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsV0FBVyxDQUFDLElBQW1CO1FBQzdCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRS9CLElBQUksQ0FBQyxnQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTyx1QkFBdUI7UUFDN0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBRXhDLGVBQWUsQ0FDYixHQUFHLEVBQUU7WUFDSCxPQUFPLElBQUksQ0FBQyxnQkFBaUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxnQkFBaUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JGLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBaUIsQ0FBQztnQkFFeEMsMkRBQTJEO2dCQUMzRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFFeEMsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2xDLElBQUksRUFBRSxDQUFDO2dCQUNULENBQUM7Z0JBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3JDLElBQUksRUFBRSxDQUFDO2dCQUNULENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUMvQixDQUFDLEVBQ0QsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBQyxDQUMzQixDQUFDO0lBQ0osQ0FBQztxSEFyRFUsd0JBQXdCO3lIQUF4Qix3QkFBd0I7O2tHQUF4Qix3QkFBd0I7a0JBRHBDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRW52aXJvbm1lbnRJbmplY3RvcixcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIE5nWm9uZSxcbiAgYWZ0ZXJOZXh0UmVuZGVyLFxuICBpbmplY3QsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIF9TY2hlZHVsZSB7XG4gIHRhc2tzOiAoKCkgPT4gdW5rbm93bilbXSA9IFtdO1xuICBlbmRUYXNrczogKCgpID0+IHVua25vd24pW10gPSBbXTtcbn1cblxuLyoqIEluamVjdGlvbiB0b2tlbiB1c2VkIHRvIHByb3ZpZGUgYSBjb2FsZXNjZWQgc3R5bGUgc2NoZWR1bGVyLiAqL1xuZXhwb3J0IGNvbnN0IF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcj4oXG4gICdfQ09BTEVTQ0VEX1NUWUxFX1NDSEVEVUxFUicsXG4pO1xuXG4vKipcbiAqIEFsbG93cyBncm91cGluZyB1cCBDU1NEb20gbXV0YXRpb25zIGFmdGVyIHRoZSBjdXJyZW50IGV4ZWN1dGlvbiBjb250ZXh0LlxuICogVGhpcyBjYW4gc2lnbmlmaWNhbnRseSBpbXByb3ZlIHBlcmZvcm1hbmNlIHdoZW4gc2VwYXJhdGUgY29uc2VjdXRpdmUgZnVuY3Rpb25zIGFyZVxuICogcmVhZGluZyBmcm9tIHRoZSBDU1NEb20gYW5kIHRoZW4gbXV0YXRpbmcgaXQuXG4gKlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgX0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSBfY3VycmVudFNjaGVkdWxlOiBfU2NoZWR1bGUgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfaW5qZWN0b3IgPSBpbmplY3QoRW52aXJvbm1lbnRJbmplY3Rvcik7XG5cbiAgY29uc3RydWN0b3IoX3VudXNlZE5nWm9uZT86IE5nWm9uZSkge31cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBzcGVjaWZpZWQgdGFzayB0byBydW4gYXQgdGhlIGVuZCBvZiB0aGUgY3VycmVudCBWTSB0dXJuLlxuICAgKi9cbiAgc2NoZWR1bGUodGFzazogKCkgPT4gdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuX2NyZWF0ZVNjaGVkdWxlSWZOZWVkZWQoKTtcblxuICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEudGFza3MucHVzaCh0YXNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIHNwZWNpZmllZCB0YXNrIHRvIHJ1biBhZnRlciBvdGhlciBzY2hlZHVsZWQgdGFza3MgYXQgdGhlIGVuZCBvZiB0aGUgY3VycmVudFxuICAgKiBWTSB0dXJuLlxuICAgKi9cbiAgc2NoZWR1bGVFbmQodGFzazogKCkgPT4gdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuX2NyZWF0ZVNjaGVkdWxlSWZOZWVkZWQoKTtcblxuICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEuZW5kVGFza3MucHVzaCh0YXNrKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVNjaGVkdWxlSWZOZWVkZWQoKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRTY2hlZHVsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSA9IG5ldyBfU2NoZWR1bGUoKTtcblxuICAgIGFmdGVyTmV4dFJlbmRlcihcbiAgICAgICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEudGFza3MubGVuZ3RoIHx8IHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEuZW5kVGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3Qgc2NoZWR1bGUgPSB0aGlzLl9jdXJyZW50U2NoZWR1bGUhO1xuXG4gICAgICAgICAgLy8gQ2FwdHVyZSBuZXcgdGFza3Mgc2NoZWR1bGVkIGJ5IHRoZSBjdXJyZW50IHNldCBvZiB0YXNrcy5cbiAgICAgICAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUgPSBuZXcgX1NjaGVkdWxlKCk7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2Ygc2NoZWR1bGUudGFza3MpIHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2Ygc2NoZWR1bGUuZW5kVGFza3MpIHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUgPSBudWxsO1xuICAgICAgfSxcbiAgICAgIHtpbmplY3RvcjogdGhpcy5faW5qZWN0b3J9LFxuICAgICk7XG4gIH1cbn1cbiJdfQ==