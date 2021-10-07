/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Class to coordinate unique selection based on name.
 * Intended to be consumed as an Angular service.
 * This service is needed because native radio change events are only fired on the item currently
 * being selected, and we still need to uncheck the previous selection.
 *
 * This service does not *store* any IDs and names because they may change at any time, so it is
 * less error-prone if they are simply passed through when the events occur.
 */
export class UniqueSelectionDispatcher {
    constructor() {
        this._listeners = [];
    }
    /**
     * Notify other items that selection for the given name has been set.
     * @param id ID of the item.
     * @param name Name of the item.
     */
    notify(id, name) {
        for (let listener of this._listeners) {
            listener(id, name);
        }
    }
    /**
     * Listen for future changes to item selection.
     * @return Function used to deregister listener
     */
    listen(listener) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter((registered) => {
                return listener !== registered;
            });
        };
    }
    ngOnDestroy() {
        this._listeners = [];
    }
}
UniqueSelectionDispatcher.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: UniqueSelectionDispatcher, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
UniqueSelectionDispatcher.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: UniqueSelectionDispatcher, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: UniqueSelectionDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pcXVlLXNlbGVjdGlvbi1kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy91bmlxdWUtc2VsZWN0aW9uLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBWSxNQUFNLGVBQWUsQ0FBQzs7QUFNcEQ7Ozs7Ozs7O0dBUUc7QUFFSCxNQUFNLE9BQU8seUJBQXlCO0lBRHRDO1FBRVUsZUFBVSxHQUF3QyxFQUFFLENBQUM7S0E2QjlEO0lBM0JDOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsRUFBVSxFQUFFLElBQVk7UUFDN0IsS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDcEI7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxDQUFDLFFBQTJDO1FBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sR0FBRyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQTZDLEVBQUUsRUFBRTtnQkFDekYsT0FBTyxRQUFRLEtBQUssVUFBVSxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUN2QixDQUFDOzs4SEE3QlUseUJBQXlCO2tJQUF6Qix5QkFBeUIsY0FEYixNQUFNO21HQUNsQix5QkFBeUI7a0JBRHJDLFVBQVU7bUJBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vLyBVc2VycyBvZiB0aGUgRGlzcGF0Y2hlciBuZXZlciBuZWVkIHRvIHNlZSB0aGlzIHR5cGUsIGJ1dCBUeXBlU2NyaXB0IHJlcXVpcmVzIGl0IHRvIGJlIGV4cG9ydGVkLlxuZXhwb3J0IHR5cGUgVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlckxpc3RlbmVyID0gKGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT4gdm9pZDtcblxuLyoqXG4gKiBDbGFzcyB0byBjb29yZGluYXRlIHVuaXF1ZSBzZWxlY3Rpb24gYmFzZWQgb24gbmFtZS5cbiAqIEludGVuZGVkIHRvIGJlIGNvbnN1bWVkIGFzIGFuIEFuZ3VsYXIgc2VydmljZS5cbiAqIFRoaXMgc2VydmljZSBpcyBuZWVkZWQgYmVjYXVzZSBuYXRpdmUgcmFkaW8gY2hhbmdlIGV2ZW50cyBhcmUgb25seSBmaXJlZCBvbiB0aGUgaXRlbSBjdXJyZW50bHlcbiAqIGJlaW5nIHNlbGVjdGVkLCBhbmQgd2Ugc3RpbGwgbmVlZCB0byB1bmNoZWNrIHRoZSBwcmV2aW91cyBzZWxlY3Rpb24uXG4gKlxuICogVGhpcyBzZXJ2aWNlIGRvZXMgbm90ICpzdG9yZSogYW55IElEcyBhbmQgbmFtZXMgYmVjYXVzZSB0aGV5IG1heSBjaGFuZ2UgYXQgYW55IHRpbWUsIHNvIGl0IGlzXG4gKiBsZXNzIGVycm9yLXByb25lIGlmIHRoZXkgYXJlIHNpbXBseSBwYXNzZWQgdGhyb3VnaCB3aGVuIHRoZSBldmVudHMgb2NjdXIuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9saXN0ZW5lcnM6IFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJMaXN0ZW5lcltdID0gW107XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBvdGhlciBpdGVtcyB0aGF0IHNlbGVjdGlvbiBmb3IgdGhlIGdpdmVuIG5hbWUgaGFzIGJlZW4gc2V0LlxuICAgKiBAcGFyYW0gaWQgSUQgb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBub3RpZnkoaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICBsaXN0ZW5lcihpZCwgbmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RlbiBmb3IgZnV0dXJlIGNoYW5nZXMgdG8gaXRlbSBzZWxlY3Rpb24uXG4gICAqIEByZXR1cm4gRnVuY3Rpb24gdXNlZCB0byBkZXJlZ2lzdGVyIGxpc3RlbmVyXG4gICAqL1xuICBsaXN0ZW4obGlzdGVuZXI6IFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJMaXN0ZW5lcik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmZpbHRlcigocmVnaXN0ZXJlZDogVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlckxpc3RlbmVyKSA9PiB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lciAhPT0gcmVnaXN0ZXJlZDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSBbXTtcbiAgfVxufVxuIl19