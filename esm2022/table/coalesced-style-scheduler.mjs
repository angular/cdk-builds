/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone, InjectionToken, afterRender, AfterRenderPhase, } from '@angular/core';
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
export class _CoalescedStyleScheduler {
    constructor(_ngZone) {
        this._ngZone = _ngZone;
        this._currentSchedule = null;
        this._destroyed = new Subject();
        this._earlyReadTasks = [];
        this._writeTasks = [];
        this._readTasks = [];
        afterRender(() => flushTasks(this._earlyReadTasks), { phase: AfterRenderPhase.EarlyRead });
        afterRender(() => flushTasks(this._writeTasks), { phase: AfterRenderPhase.Write });
        afterRender(() => flushTasks(this._readTasks), { phase: AfterRenderPhase.Read });
    }
    /**
     * Like afterNextRender(fn, AfterRenderPhase.EarlyRead), but can be called
     * outside of injection context. Runs after current/next CD.
     */
    scheduleEarlyRead(task) {
        this._earlyReadTasks.push(task);
    }
    /**
     * Like afterNextRender(fn, AfterRenderPhase.Write), but can be called
     * outside of injection context. Runs after current/next CD.
     */
    scheduleWrite(task) {
        this._writeTasks.push(task);
    }
    /**
     * Like afterNextRender(fn, AfterRenderPhase.Read), but can be called
     * outside of injection context. Runs after current/next CD.
     */
    scheduleRead(task) {
        this._readTasks.push(task);
    }
    /** Greedily triggers pending EarlyRead, Write, and Read tasks, in that order. */
    flushAfterRender() {
        flushTasks(this._earlyReadTasks);
        flushTasks(this._writeTasks);
        flushTasks(this._readTasks);
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: _CoalescedStyleScheduler, deps: [{ token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: _CoalescedStyleScheduler }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.1.0-next.5", ngImport: i0, type: _CoalescedStyleScheduler, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: i0.NgZone }] });
/**
 * Runs and removes tasks from the passed array in order.
 * Tasks appended mid-flight will also be flushed.
 */
function flushTasks(tasks) {
    let task;
    while ((task = tasks.shift())) {
        task();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsVUFBVSxFQUNWLE1BQU0sRUFFTixjQUFjLEVBQ2QsV0FBVyxFQUNYLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNuQyxPQUFPLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDOztBQUUvQzs7R0FFRztBQUNILE1BQU0sT0FBTyxTQUFTO0lBQXRCO1FBQ0UsVUFBSyxHQUFzQixFQUFFLENBQUM7UUFDOUIsYUFBUSxHQUFzQixFQUFFLENBQUM7SUFDbkMsQ0FBQztDQUFBO0FBRUQsbUVBQW1FO0FBQ25FLE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUFHLElBQUksY0FBYyxDQUMxRCw0QkFBNEIsQ0FDN0IsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUVILE1BQU0sT0FBTyx3QkFBd0I7SUFRbkMsWUFBNkIsT0FBZTtRQUFmLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFQcEMscUJBQWdCLEdBQXFCLElBQUksQ0FBQztRQUNqQyxlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUVqQyxvQkFBZSxHQUFzQixFQUFFLENBQUM7UUFDeEMsZ0JBQVcsR0FBc0IsRUFBRSxDQUFDO1FBQ3BDLGVBQVUsR0FBc0IsRUFBRSxDQUFDO1FBR2xELFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLFNBQVMsRUFBQyxDQUFDLENBQUM7UUFDekYs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Q0FBQyxPQUFPLENBQUMsUUFBUTtZQUMxQixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO3FIQXpHVSx3QkFBd0I7eUhBQXhCLHdCQUF3Qjs7a0dBQXhCLHdCQUF3QjtrQkFEcEMsVUFBVTs7QUE2R1g7OztHQUdHO0FBQ0gsU0FBUyxVQUFVLENBQUMsS0FBd0I7SUFDMUMsSUFBSSxJQUFpQyxDQUFDO0lBQ3RDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM5QixJQUFJLEVBQUUsQ0FBQztJQUNULENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEluamVjdGFibGUsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBJbmplY3Rpb25Ub2tlbixcbiAgYWZ0ZXJSZW5kZXIsXG4gIEFmdGVyUmVuZGVyUGhhc2UsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtmcm9tLCBTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZSwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbi8qKlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgX1NjaGVkdWxlIHtcbiAgdGFza3M6ICgoKSA9PiB1bmtub3duKVtdID0gW107XG4gIGVuZFRhc2tzOiAoKCkgPT4gdW5rbm93bilbXSA9IFtdO1xufVxuXG4vKiogSW5qZWN0aW9uIHRva2VuIHVzZWQgdG8gcHJvdmlkZSBhIGNvYWxlc2NlZCBzdHlsZSBzY2hlZHVsZXIuICovXG5leHBvcnQgY29uc3QgX0NPQUxFU0NFRF9TVFlMRV9TQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48X0NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyPihcbiAgJ19DT0FMRVNDRURfU1RZTEVfU0NIRURVTEVSJyxcbik7XG5cbi8qKlxuICogQWxsb3dzIGdyb3VwaW5nIHVwIENTU0RvbSBtdXRhdGlvbnMgYWZ0ZXIgdGhlIGN1cnJlbnQgZXhlY3V0aW9uIGNvbnRleHQuXG4gKiBUaGlzIGNhbiBzaWduaWZpY2FudGx5IGltcHJvdmUgcGVyZm9ybWFuY2Ugd2hlbiBzZXBhcmF0ZSBjb25zZWN1dGl2ZSBmdW5jdGlvbnMgYXJlXG4gKiByZWFkaW5nIGZyb20gdGhlIENTU0RvbSBhbmQgdGhlbiBtdXRhdGluZyBpdC5cbiAqXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9jdXJyZW50U2NoZWR1bGU6IF9TY2hlZHVsZSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2Vhcmx5UmVhZFRhc2tzOiAoKCkgPT4gdW5rbm93bilbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IF93cml0ZVRhc2tzOiAoKCkgPT4gdW5rbm93bilbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IF9yZWFkVGFza3M6ICgoKSA9PiB1bmtub3duKVtdID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfbmdab25lOiBOZ1pvbmUpIHtcbiAgICBhZnRlclJlbmRlcigoKSA9PiBmbHVzaFRhc2tzKHRoaXMuX2Vhcmx5UmVhZFRhc2tzKSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZH0pO1xuICAgIGFmdGVyUmVuZGVyKCgpID0+IGZsdXNoVGFza3ModGhpcy5fd3JpdGVUYXNrcyksIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZX0pO1xuICAgIGFmdGVyUmVuZGVyKCgpID0+IGZsdXNoVGFza3ModGhpcy5fcmVhZFRhc2tzKSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLlJlYWR9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaWtlIGFmdGVyTmV4dFJlbmRlcihmbiwgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWQpLCBidXQgY2FuIGJlIGNhbGxlZFxuICAgKiBvdXRzaWRlIG9mIGluamVjdGlvbiBjb250ZXh0LiBSdW5zIGFmdGVyIGN1cnJlbnQvbmV4dCBDRC5cbiAgICovXG4gIHNjaGVkdWxlRWFybHlSZWFkKHRhc2s6ICgpID0+IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLl9lYXJseVJlYWRUYXNrcy5wdXNoKHRhc2spO1xuICB9XG5cbiAgLyoqXG4gICAqIExpa2UgYWZ0ZXJOZXh0UmVuZGVyKGZuLCBBZnRlclJlbmRlclBoYXNlLldyaXRlKSwgYnV0IGNhbiBiZSBjYWxsZWRcbiAgICogb3V0c2lkZSBvZiBpbmplY3Rpb24gY29udGV4dC4gUnVucyBhZnRlciBjdXJyZW50L25leHQgQ0QuXG4gICAqL1xuICBzY2hlZHVsZVdyaXRlKHRhc2s6ICgpID0+IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLl93cml0ZVRhc2tzLnB1c2godGFzayk7XG4gIH1cblxuICAvKipcbiAgICogTGlrZSBhZnRlck5leHRSZW5kZXIoZm4sIEFmdGVyUmVuZGVyUGhhc2UuUmVhZCksIGJ1dCBjYW4gYmUgY2FsbGVkXG4gICAqIG91dHNpZGUgb2YgaW5qZWN0aW9uIGNvbnRleHQuIFJ1bnMgYWZ0ZXIgY3VycmVudC9uZXh0IENELlxuICAgKi9cbiAgc2NoZWR1bGVSZWFkKHRhc2s6ICgpID0+IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLl9yZWFkVGFza3MucHVzaCh0YXNrKTtcbiAgfVxuXG4gIC8qKiBHcmVlZGlseSB0cmlnZ2VycyBwZW5kaW5nIEVhcmx5UmVhZCwgV3JpdGUsIGFuZCBSZWFkIHRhc2tzLCBpbiB0aGF0IG9yZGVyLiAqL1xuICBmbHVzaEFmdGVyUmVuZGVyKCkge1xuICAgIGZsdXNoVGFza3ModGhpcy5fZWFybHlSZWFkVGFza3MpO1xuICAgIGZsdXNoVGFza3ModGhpcy5fd3JpdGVUYXNrcyk7XG4gICAgZmx1c2hUYXNrcyh0aGlzLl9yZWFkVGFza3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgc3BlY2lmaWVkIHRhc2sgdG8gcnVuIGF0IHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgVk0gdHVybi5cbiAgICovXG4gIHNjaGVkdWxlKHRhc2s6ICgpID0+IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLl9jcmVhdGVTY2hlZHVsZUlmTmVlZGVkKCk7XG5cbiAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUhLnRhc2tzLnB1c2godGFzayk7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIHRoZSBzcGVjaWZpZWQgdGFzayB0byBydW4gYWZ0ZXIgb3RoZXIgc2NoZWR1bGVkIHRhc2tzIGF0IHRoZSBlbmQgb2YgdGhlIGN1cnJlbnRcbiAgICogVk0gdHVybi5cbiAgICovXG4gIHNjaGVkdWxlRW5kKHRhc2s6ICgpID0+IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLl9jcmVhdGVTY2hlZHVsZUlmTmVlZGVkKCk7XG5cbiAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUhLmVuZFRhc2tzLnB1c2godGFzayk7XG4gIH1cblxuICAvKiogUHJldmVudCBhbnkgZnVydGhlciB0YXNrcyBmcm9tIHJ1bm5pbmcuICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5uZXh0KCk7XG4gICAgdGhpcy5fZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVTY2hlZHVsZUlmTmVlZGVkKCkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50U2NoZWR1bGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUgPSBuZXcgX1NjaGVkdWxlKCk7XG5cbiAgICB0aGlzLl9nZXRTY2hlZHVsZU9ic2VydmFibGUoKVxuICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEudGFza3MubGVuZ3RoIHx8IHRoaXMuX2N1cnJlbnRTY2hlZHVsZSEuZW5kVGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgY29uc3Qgc2NoZWR1bGUgPSB0aGlzLl9jdXJyZW50U2NoZWR1bGUhO1xuXG4gICAgICAgICAgLy8gQ2FwdHVyZSBuZXcgdGFza3Mgc2NoZWR1bGVkIGJ5IHRoZSBjdXJyZW50IHNldCBvZiB0YXNrcy5cbiAgICAgICAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUgPSBuZXcgX1NjaGVkdWxlKCk7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2Ygc2NoZWR1bGUudGFza3MpIHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHRhc2sgb2Ygc2NoZWR1bGUuZW5kVGFza3MpIHtcbiAgICAgICAgICAgIHRhc2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jdXJyZW50U2NoZWR1bGUgPSBudWxsO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRTY2hlZHVsZU9ic2VydmFibGUoKSB7XG4gICAgLy8gVXNlIG9uU3RhYmxlIHdoZW4gaW4gdGhlIGNvbnRleHQgb2YgYW4gb25nb2luZyBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIHNvIHRoYXQgd2VcbiAgICAvLyBkbyBub3QgYWNjaWRlbnRhbGx5IHRyaWdnZXIgYWRkaXRpb25hbCBjeWNsZXMuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5pc1N0YWJsZVxuICAgICAgPyBmcm9tKFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKVxuICAgICAgOiB0aGlzLl9uZ1pvbmUub25TdGFibGUucGlwZSh0YWtlKDEpKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYW5kIHJlbW92ZXMgdGFza3MgZnJvbSB0aGUgcGFzc2VkIGFycmF5IGluIG9yZGVyLlxuICogVGFza3MgYXBwZW5kZWQgbWlkLWZsaWdodCB3aWxsIGFsc28gYmUgZmx1c2hlZC5cbiAqL1xuZnVuY3Rpb24gZmx1c2hUYXNrcyh0YXNrczogKCgpID0+IHVua25vd24pW10pIHtcbiAgbGV0IHRhc2s6ICgoKSA9PiB1bmtub3duKSB8IHVuZGVmaW5lZDtcbiAgd2hpbGUgKCh0YXNrID0gdGFza3Muc2hpZnQoKSkpIHtcbiAgICB0YXNrKCk7XG4gIH1cbn1cbiJdfQ==