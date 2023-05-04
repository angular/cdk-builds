/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone, InjectionToken } from '@angular/core';
import { from, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
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
class _CoalescedStyleScheduler {
    constructor(_ngZone) {
        this._ngZone = _ngZone;
        this._currentSchedule = null;
        this._destroyed = new Subject();
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
    /** Prevent any further tasks from running. */
    ngOnDestroy() {
        this._destroyed.next();
        this._destroyed.complete();
    }
    _createScheduleIfNeeded() {
        if (this._currentSchedule) {
            return;
        }
        this._currentSchedule = new _Schedule();
        this._getScheduleObservable()
            .pipe(takeUntil(this._destroyed))
            .subscribe(() => {
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
        });
    }
    _getScheduleObservable() {
        // Use onStable when in the context of an ongoing change detection cycle so that we
        // do not accidentally trigger additional cycles.
        return this._ngZone.isStable
            ? from(Promise.resolve(undefined))
            : this._ngZone.onStable.pipe(take(1));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: _CoalescedStyleScheduler, deps: [{ token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: _CoalescedStyleScheduler }); }
}
export { _CoalescedStyleScheduler };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: _CoalescedStyleScheduler, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i0.NgZone }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBYSxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUUsT0FBTyxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbkMsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7QUFFL0M7O0dBRUc7QUFDSCxNQUFNLE9BQU8sU0FBUztJQUF0QjtRQUNFLFVBQUssR0FBc0IsRUFBRSxDQUFDO1FBQzlCLGFBQVEsR0FBc0IsRUFBRSxDQUFDO0lBQ25DLENBQUM7Q0FBQTtBQUVELG1FQUFtRTtBQUNuRSxNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLGNBQWMsQ0FDMUQsNEJBQTRCLENBQzdCLENBQUM7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUNhLHdCQUF3QjtJQUluQyxZQUE2QixPQUFlO1FBQWYsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUhwQyxxQkFBZ0IsR0FBcUIsSUFBSSxDQUFDO1FBQ2pDLGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO0lBRUgsQ0FBQztJQUVoRDs7T0FFRztJQUNILFFBQVEsQ0FBQyxJQUFtQjtRQUMxQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUUvQixJQUFJLENBQUMsZ0JBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsV0FBVyxDQUFDLElBQW1CO1FBQzdCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRS9CLElBQUksQ0FBQyxnQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMsV0FBVztRQUNULElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRU8sdUJBQXVCO1FBQzdCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ3pCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBRXhDLElBQUksQ0FBQyxzQkFBc0IsRUFBRTthQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNoQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUMsZ0JBQWlCLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWlCLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDcEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFpQixDQUFDO2dCQUV4QywyREFBMkQ7Z0JBQzNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUV4QyxLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUU7b0JBQ2pDLElBQUksRUFBRSxDQUFDO2lCQUNSO2dCQUVELEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRTtvQkFDcEMsSUFBSSxFQUFFLENBQUM7aUJBQ1I7YUFDRjtZQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sc0JBQXNCO1FBQzVCLG1GQUFtRjtRQUNuRixpREFBaUQ7UUFDakQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVE7WUFDMUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQzs4R0FsRVUsd0JBQXdCO2tIQUF4Qix3QkFBd0I7O1NBQXhCLHdCQUF3QjsyRkFBeEIsd0JBQXdCO2tCQURwQyxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgTmdab25lLCBPbkRlc3Ryb3ksIEluamVjdGlvblRva2VufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7ZnJvbSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2UsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKipcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIF9TY2hlZHVsZSB7XG4gIHRhc2tzOiAoKCkgPT4gdW5rbm93bilbXSA9IFtdO1xuICBlbmRUYXNrczogKCgpID0+IHVua25vd24pW10gPSBbXTtcbn1cblxuLyoqIEluamVjdGlvbiB0b2tlbiB1c2VkIHRvIHByb3ZpZGUgYSBjb2FsZXNjZWQgc3R5bGUgc2NoZWR1bGVyLiAqL1xuZXhwb3J0IGNvbnN0IF9DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcj4oXG4gICdfQ09BTEVTQ0VEX1NUWUxFX1NDSEVEVUxFUicsXG4pO1xuXG4vKipcbiAqIEFsbG93cyBncm91cGluZyB1cCBDU1NEb20gbXV0YXRpb25zIGFmdGVyIHRoZSBjdXJyZW50IGV4ZWN1dGlvbiBjb250ZXh0LlxuICogVGhpcyBjYW4gc2lnbmlmaWNhbnRseSBpbXByb3ZlIHBlcmZvcm1hbmNlIHdoZW4gc2VwYXJhdGUgY29uc2VjdXRpdmUgZnVuY3Rpb25zIGFyZVxuICogcmVhZGluZyBmcm9tIHRoZSBDU1NEb20gYW5kIHRoZW4gbXV0YXRpbmcgaXQuXG4gKlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgX0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfY3VycmVudFNjaGVkdWxlOiBfU2NoZWR1bGUgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9uZ1pvbmU6IE5nWm9uZSkge31cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBzcGVjaWZpZWQgdGFzayB0byBydW4gYXQgdGhlIGVuZCBvZiB0aGUgY3VycmVudCBWTSB0dXJuLlxuICAgKi9cbiAgc2NoZWR1bGUodGFzazogKCkgPT4gdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuX2NyZWF0ZVNjaGVkdWxlSWZOZWVkZWQoKTtcblxuICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEudGFza3MucHVzaCh0YXNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIHNwZWNpZmllZCB0YXNrIHRvIHJ1biBhZnRlciBvdGhlciBzY2hlZHVsZWQgdGFza3MgYXQgdGhlIGVuZCBvZiB0aGUgY3VycmVudFxuICAgKiBWTSB0dXJuLlxuICAgKi9cbiAgc2NoZWR1bGVFbmQodGFzazogKCkgPT4gdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuX2NyZWF0ZVNjaGVkdWxlSWZOZWVkZWQoKTtcblxuICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEuZW5kVGFza3MucHVzaCh0YXNrKTtcbiAgfVxuXG4gIC8qKiBQcmV2ZW50IGFueSBmdXJ0aGVyIHRhc2tzIGZyb20gcnVubmluZy4gKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVNjaGVkdWxlSWZOZWVkZWQoKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRTY2hlZHVsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSA9IG5ldyBfU2NoZWR1bGUoKTtcblxuICAgIHRoaXMuX2dldFNjaGVkdWxlT2JzZXJ2YWJsZSgpXG4gICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5fZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB3aGlsZSAodGhpcy5fY3VycmVudFNjaGVkdWxlIS50YXNrcy5sZW5ndGggfHwgdGhpcy5fY3VycmVudFNjaGVkdWxlIS5lbmRUYXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zdCBzY2hlZHVsZSA9IHRoaXMuX2N1cnJlbnRTY2hlZHVsZSE7XG5cbiAgICAgICAgICAvLyBDYXB0dXJlIG5ldyB0YXNrcyBzY2hlZHVsZWQgYnkgdGhlIGN1cnJlbnQgc2V0IG9mIHRhc2tzLlxuICAgICAgICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSA9IG5ldyBfU2NoZWR1bGUoKTtcblxuICAgICAgICAgIGZvciAoY29uc3QgdGFzayBvZiBzY2hlZHVsZS50YXNrcykge1xuICAgICAgICAgICAgdGFzaygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAoY29uc3QgdGFzayBvZiBzY2hlZHVsZS5lbmRUYXNrcykge1xuICAgICAgICAgICAgdGFzaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSA9IG51bGw7XG4gICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFNjaGVkdWxlT2JzZXJ2YWJsZSgpIHtcbiAgICAvLyBVc2Ugb25TdGFibGUgd2hlbiBpbiB0aGUgY29udGV4dCBvZiBhbiBvbmdvaW5nIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgc28gdGhhdCB3ZVxuICAgIC8vIGRvIG5vdCBhY2NpZGVudGFsbHkgdHJpZ2dlciBhZGRpdGlvbmFsIGN5Y2xlcy5cbiAgICByZXR1cm4gdGhpcy5fbmdab25lLmlzU3RhYmxlXG4gICAgICA/IGZyb20oUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpXG4gICAgICA6IHRoaXMuX25nWm9uZS5vblN0YWJsZS5waXBlKHRha2UoMSkpO1xuICB9XG59XG4iXX0=