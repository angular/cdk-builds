/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
/**
 * @docs-private
 */
export class _Schedule {
    constructor() {
        this.tasks = [];
        this.endTasks = [];
    }
}
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
        this._ngZone.onStable.pipe(take(1), takeUntil(this._destroyed)).subscribe(() => {
            const schedule = this._currentSchedule;
            this._currentSchedule = null;
            for (const task of schedule.tasks) {
                task();
            }
            for (const task of schedule.endTasks) {
                task();
            }
        });
    }
}
_CoalescedStyleScheduler.decorators = [
    { type: Injectable }
];
_CoalescedStyleScheduler.ctorParameters = () => [
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBWSxNQUFNLGVBQWUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE9BQU8sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFL0M7O0dBRUc7QUFDSCxNQUFNLE9BQU8sU0FBUztJQUF0QjtRQUNFLFVBQUssR0FBc0IsRUFBRSxDQUFDO1FBQzlCLGFBQVEsR0FBc0IsRUFBRSxDQUFDO0lBQ25DLENBQUM7Q0FBQTtBQUVEOzs7Ozs7R0FNRztBQUVILE1BQU0sT0FBTyx3QkFBd0I7SUFJbkMsWUFBNkIsT0FBZTtRQUFmLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFIcEMscUJBQWdCLEdBQW1CLElBQUksQ0FBQztRQUMvQixlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztJQUVILENBQUM7SUFFaEQ7O09BRUc7SUFDSCxRQUFRLENBQUMsSUFBbUI7UUFDMUIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFL0IsSUFBSSxDQUFDLGdCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7T0FHRztJQUNILFdBQVcsQ0FBQyxJQUFtQjtRQUM3QixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUUvQixJQUFJLENBQUMsZ0JBQWlCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsOENBQThDO0lBQzlDLFdBQVc7UUFDVCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVPLHVCQUF1QjtRQUM3QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUFFLE9BQU87U0FBRTtRQUV0QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUV4QyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQ3RCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDUCxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUM3QixDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDZixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWlCLENBQUM7WUFDeEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUU3QixLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2pDLElBQUksRUFBRSxDQUFDO2FBQ1I7WUFDRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3BDLElBQUksRUFBRSxDQUFDO2FBQ1I7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7OztZQW5ERixVQUFVOzs7WUFuQlMsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGUsIE5nWm9uZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2UsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKipcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIF9TY2hlZHVsZSB7XG4gIHRhc2tzOiAoKCkgPT4gdW5rbm93bilbXSA9IFtdO1xuICBlbmRUYXNrczogKCgpID0+IHVua25vd24pW10gPSBbXTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgZ3JvdXBpbmcgdXAgQ1NTRG9tIG11dGF0aW9ucyBhZnRlciB0aGUgY3VycmVudCBleGVjdXRpb24gY29udGV4dC5cbiAqIFRoaXMgY2FuIHNpZ25pZmljYW50bHkgaW1wcm92ZSBwZXJmb3JtYW5jZSB3aGVuIHNlcGFyYXRlIGNvbnNlY3V0aXZlIGZ1bmN0aW9ucyBhcmVcbiAqIHJlYWRpbmcgZnJvbSB0aGUgQ1NTRG9tIGFuZCB0aGVuIG11dGF0aW5nIGl0LlxuICpcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2N1cnJlbnRTY2hlZHVsZTogX1NjaGVkdWxlfG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXN0cm95ZWQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX25nWm9uZTogTmdab25lKSB7fVxuXG4gIC8qKlxuICAgKiBTY2hlZHVsZXMgdGhlIHNwZWNpZmllZCB0YXNrIHRvIHJ1biBhdCB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IFZNIHR1cm4uXG4gICAqL1xuICBzY2hlZHVsZSh0YXNrOiAoKSA9PiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5fY3JlYXRlU2NoZWR1bGVJZk5lZWRlZCgpO1xuXG4gICAgdGhpcy5fY3VycmVudFNjaGVkdWxlIS50YXNrcy5wdXNoKHRhc2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyB0aGUgc3BlY2lmaWVkIHRhc2sgdG8gcnVuIGFmdGVyIG90aGVyIHNjaGVkdWxlZCB0YXNrcyBhdCB0aGUgZW5kIG9mIHRoZSBjdXJyZW50XG4gICAqIFZNIHR1cm4uXG4gICAqL1xuICBzY2hlZHVsZUVuZCh0YXNrOiAoKSA9PiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5fY3JlYXRlU2NoZWR1bGVJZk5lZWRlZCgpO1xuXG4gICAgdGhpcy5fY3VycmVudFNjaGVkdWxlIS5lbmRUYXNrcy5wdXNoKHRhc2spO1xuICB9XG5cbiAgLyoqIFByZXZlbnQgYW55IGZ1cnRoZXIgdGFza3MgZnJvbSBydW5uaW5nLiAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlU2NoZWR1bGVJZk5lZWRlZCgpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFNjaGVkdWxlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fY3VycmVudFNjaGVkdWxlID0gbmV3IF9TY2hlZHVsZSgpO1xuXG4gICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLnBpcGUoXG4gICAgICAgIHRha2UoMSksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLl9kZXN0cm95ZWQpLFxuICAgICkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVkdWxlID0gdGhpcy5fY3VycmVudFNjaGVkdWxlITtcbiAgICAgIHRoaXMuX2N1cnJlbnRTY2hlZHVsZSA9IG51bGw7XG5cbiAgICAgIGZvciAoY29uc3QgdGFzayBvZiBzY2hlZHVsZS50YXNrcykge1xuICAgICAgICB0YXNrKCk7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHRhc2sgb2Ygc2NoZWR1bGUuZW5kVGFza3MpIHtcbiAgICAgICAgdGFzaygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=