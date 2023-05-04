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
class UniqueSelectionDispatcher {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: UniqueSelectionDispatcher, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: UniqueSelectionDispatcher, providedIn: 'root' }); }
}
export { UniqueSelectionDispatcher };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: UniqueSelectionDispatcher, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5pcXVlLXNlbGVjdGlvbi1kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9jb2xsZWN0aW9ucy91bmlxdWUtc2VsZWN0aW9uLWRpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBWSxNQUFNLGVBQWUsQ0FBQzs7QUFLcEQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUNhLHlCQUF5QjtJQUR0QztRQUVVLGVBQVUsR0FBd0MsRUFBRSxDQUFDO0tBNkI5RDtJQTNCQzs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLEVBQVUsRUFBRSxJQUFZO1FBQzdCLEtBQUssSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQyxRQUFRLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3BCO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxRQUEyQztRQUNoRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixPQUFPLEdBQUcsRUFBRTtZQUNWLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUE2QyxFQUFFLEVBQUU7Z0JBQ3pGLE9BQU8sUUFBUSxLQUFLLFVBQVUsQ0FBQztZQUNqQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFDdkIsQ0FBQzs4R0E3QlUseUJBQXlCO2tIQUF6Qix5QkFBeUIsY0FEYixNQUFNOztTQUNsQix5QkFBeUI7MkZBQXpCLHlCQUF5QjtrQkFEckMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vLyBVc2VycyBvZiB0aGUgRGlzcGF0Y2hlciBuZXZlciBuZWVkIHRvIHNlZSB0aGlzIHR5cGUsIGJ1dCBUeXBlU2NyaXB0IHJlcXVpcmVzIGl0IHRvIGJlIGV4cG9ydGVkLlxuZXhwb3J0IHR5cGUgVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlckxpc3RlbmVyID0gKGlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT4gdm9pZDtcblxuLyoqXG4gKiBDbGFzcyB0byBjb29yZGluYXRlIHVuaXF1ZSBzZWxlY3Rpb24gYmFzZWQgb24gbmFtZS5cbiAqIEludGVuZGVkIHRvIGJlIGNvbnN1bWVkIGFzIGFuIEFuZ3VsYXIgc2VydmljZS5cbiAqIFRoaXMgc2VydmljZSBpcyBuZWVkZWQgYmVjYXVzZSBuYXRpdmUgcmFkaW8gY2hhbmdlIGV2ZW50cyBhcmUgb25seSBmaXJlZCBvbiB0aGUgaXRlbSBjdXJyZW50bHlcbiAqIGJlaW5nIHNlbGVjdGVkLCBhbmQgd2Ugc3RpbGwgbmVlZCB0byB1bmNoZWNrIHRoZSBwcmV2aW91cyBzZWxlY3Rpb24uXG4gKlxuICogVGhpcyBzZXJ2aWNlIGRvZXMgbm90ICpzdG9yZSogYW55IElEcyBhbmQgbmFtZXMgYmVjYXVzZSB0aGV5IG1heSBjaGFuZ2UgYXQgYW55IHRpbWUsIHNvIGl0IGlzXG4gKiBsZXNzIGVycm9yLXByb25lIGlmIHRoZXkgYXJlIHNpbXBseSBwYXNzZWQgdGhyb3VnaCB3aGVuIHRoZSBldmVudHMgb2NjdXIuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9saXN0ZW5lcnM6IFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJMaXN0ZW5lcltdID0gW107XG5cbiAgLyoqXG4gICAqIE5vdGlmeSBvdGhlciBpdGVtcyB0aGF0IHNlbGVjdGlvbiBmb3IgdGhlIGdpdmVuIG5hbWUgaGFzIGJlZW4gc2V0LlxuICAgKiBAcGFyYW0gaWQgSUQgb2YgdGhlIGl0ZW0uXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGl0ZW0uXG4gICAqL1xuICBub3RpZnkoaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICBsaXN0ZW5lcihpZCwgbmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RlbiBmb3IgZnV0dXJlIGNoYW5nZXMgdG8gaXRlbSBzZWxlY3Rpb24uXG4gICAqIEByZXR1cm4gRnVuY3Rpb24gdXNlZCB0byBkZXJlZ2lzdGVyIGxpc3RlbmVyXG4gICAqL1xuICBsaXN0ZW4obGlzdGVuZXI6IFVuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJMaXN0ZW5lcik6ICgpID0+IHZvaWQge1xuICAgIHRoaXMuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzLmZpbHRlcigocmVnaXN0ZXJlZDogVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlckxpc3RlbmVyKSA9PiB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lciAhPT0gcmVnaXN0ZXJlZDtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSBbXTtcbiAgfVxufVxuIl19