/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, Output, Input, EventEmitter } from '@angular/core';
import { Directionality, _resolveDirectionality } from './directionality';
import * as i0 from "@angular/core";
/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 */
class Dir {
    constructor() {
        /** Normalized direction that accounts for invalid/unsupported values. */
        this._dir = 'ltr';
        /** Whether the `value` has been set to its initial value. */
        this._isInitialized = false;
        /** Event emitted when the direction changes. */
        this.change = new EventEmitter();
    }
    /** @docs-private */
    get dir() {
        return this._dir;
    }
    set dir(value) {
        const previousValue = this._dir;
        // Note: `_resolveDirectionality` resolves the language based on the browser's language,
        // whereas the browser does it based on the content of the element. Since doing so based
        // on the content can be expensive, for now we're doing the simpler matching.
        this._dir = _resolveDirectionality(value);
        this._rawDir = value;
        if (previousValue !== this._dir && this._isInitialized) {
            this.change.emit(this._dir);
        }
    }
    /** Current layout direction of the element. */
    get value() {
        return this.dir;
    }
    /** Initialize once default value has been set. */
    ngAfterContentInit() {
        this._isInitialized = true;
    }
    ngOnDestroy() {
        this.change.complete();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: Dir, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: Dir, selector: "[dir]", inputs: { dir: "dir" }, outputs: { change: "dirChange" }, host: { properties: { "attr.dir": "_rawDir" } }, providers: [{ provide: Directionality, useExisting: Dir }], exportAs: ["dir"], ngImport: i0 }); }
}
export { Dir };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: Dir, decorators: [{
            type: Directive,
            args: [{
                    selector: '[dir]',
                    providers: [{ provide: Directionality, useExisting: Dir }],
                    host: { '[attr.dir]': '_rawDir' },
                    exportAs: 'dir',
                }]
        }], propDecorators: { change: [{
                type: Output,
                args: ['dirChange']
            }], dir: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9iaWRpL2Rpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUE4QixNQUFNLGVBQWUsQ0FBQztBQUVsRyxPQUFPLEVBQVksY0FBYyxFQUFFLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7O0FBRW5GOzs7OztHQUtHO0FBQ0gsTUFNYSxHQUFHO0lBTmhCO1FBT0UseUVBQXlFO1FBQ2pFLFNBQUksR0FBYyxLQUFLLENBQUM7UUFFaEMsNkRBQTZEO1FBQ3JELG1CQUFjLEdBQVksS0FBSyxDQUFDO1FBS3hDLGdEQUFnRDtRQUNsQixXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQWEsQ0FBQztLQWtDdEU7SUFoQ0Msb0JBQW9CO0lBQ3BCLElBQ0ksR0FBRztRQUNMLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBQ0QsSUFBSSxHQUFHLENBQUMsS0FBeUI7UUFDL0IsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUVoQyx3RkFBd0Y7UUFDeEYsd0ZBQXdGO1FBQ3hGLDZFQUE2RTtRQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRXJCLElBQUksYUFBYSxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUN0RCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRUQsK0NBQStDO0lBQy9DLElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNsQixDQUFDO0lBRUQsa0RBQWtEO0lBQ2xELGtCQUFrQjtRQUNoQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztJQUM3QixDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDekIsQ0FBQzs4R0E1Q1UsR0FBRztrR0FBSCxHQUFHLDJJQUpILENBQUMsRUFBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUMsQ0FBQzs7U0FJN0MsR0FBRzsyRkFBSCxHQUFHO2tCQU5mLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLE9BQU87b0JBQ2pCLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxXQUFXLEtBQUssRUFBQyxDQUFDO29CQUN4RCxJQUFJLEVBQUUsRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFDO29CQUMvQixRQUFRLEVBQUUsS0FBSztpQkFDaEI7OEJBWStCLE1BQU07c0JBQW5DLE1BQU07dUJBQUMsV0FBVztnQkFJZixHQUFHO3NCQUROLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3RpdmUsIE91dHB1dCwgSW5wdXQsIEV2ZW50RW1pdHRlciwgQWZ0ZXJDb250ZW50SW5pdCwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5LCBfcmVzb2x2ZURpcmVjdGlvbmFsaXR5fSBmcm9tICcuL2RpcmVjdGlvbmFsaXR5JztcblxuLyoqXG4gKiBEaXJlY3RpdmUgdG8gbGlzdGVuIGZvciBjaGFuZ2VzIG9mIGRpcmVjdGlvbiBvZiBwYXJ0IG9mIHRoZSBET00uXG4gKlxuICogUHJvdmlkZXMgaXRzZWxmIGFzIERpcmVjdGlvbmFsaXR5IHN1Y2ggdGhhdCBkZXNjZW5kYW50IGRpcmVjdGl2ZXMgb25seSBuZWVkIHRvIGV2ZXIgaW5qZWN0XG4gKiBEaXJlY3Rpb25hbGl0eSB0byBnZXQgdGhlIGNsb3Nlc3QgZGlyZWN0aW9uLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbZGlyXScsXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBEaXJlY3Rpb25hbGl0eSwgdXNlRXhpc3Rpbmc6IERpcn1dLFxuICBob3N0OiB7J1thdHRyLmRpcl0nOiAnX3Jhd0Rpcid9LFxuICBleHBvcnRBczogJ2RpcicsXG59KVxuZXhwb3J0IGNsYXNzIERpciBpbXBsZW1lbnRzIERpcmVjdGlvbmFsaXR5LCBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAvKiogTm9ybWFsaXplZCBkaXJlY3Rpb24gdGhhdCBhY2NvdW50cyBmb3IgaW52YWxpZC91bnN1cHBvcnRlZCB2YWx1ZXMuICovXG4gIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uID0gJ2x0cic7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGB2YWx1ZWAgaGFzIGJlZW4gc2V0IHRvIGl0cyBpbml0aWFsIHZhbHVlLiAqL1xuICBwcml2YXRlIF9pc0luaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIERpcmVjdGlvbiBhcyBwYXNzZWQgaW4gYnkgdGhlIGNvbnN1bWVyLiAqL1xuICBfcmF3RGlyOiBzdHJpbmc7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgZGlyZWN0aW9uIGNoYW5nZXMuICovXG4gIEBPdXRwdXQoJ2RpckNoYW5nZScpIHJlYWRvbmx5IGNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8RGlyZWN0aW9uPigpO1xuXG4gIC8qKiBAZG9jcy1wcml2YXRlICovXG4gIEBJbnB1dCgpXG4gIGdldCBkaXIoKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyO1xuICB9XG4gIHNldCBkaXIodmFsdWU6IERpcmVjdGlvbiB8ICdhdXRvJykge1xuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSB0aGlzLl9kaXI7XG5cbiAgICAvLyBOb3RlOiBgX3Jlc29sdmVEaXJlY3Rpb25hbGl0eWAgcmVzb2x2ZXMgdGhlIGxhbmd1YWdlIGJhc2VkIG9uIHRoZSBicm93c2VyJ3MgbGFuZ3VhZ2UsXG4gICAgLy8gd2hlcmVhcyB0aGUgYnJvd3NlciBkb2VzIGl0IGJhc2VkIG9uIHRoZSBjb250ZW50IG9mIHRoZSBlbGVtZW50LiBTaW5jZSBkb2luZyBzbyBiYXNlZFxuICAgIC8vIG9uIHRoZSBjb250ZW50IGNhbiBiZSBleHBlbnNpdmUsIGZvciBub3cgd2UncmUgZG9pbmcgdGhlIHNpbXBsZXIgbWF0Y2hpbmcuXG4gICAgdGhpcy5fZGlyID0gX3Jlc29sdmVEaXJlY3Rpb25hbGl0eSh2YWx1ZSk7XG4gICAgdGhpcy5fcmF3RGlyID0gdmFsdWU7XG5cbiAgICBpZiAocHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5fZGlyICYmIHRoaXMuX2lzSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRoaXMuY2hhbmdlLmVtaXQodGhpcy5fZGlyKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ3VycmVudCBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBlbGVtZW50LiAqL1xuICBnZXQgdmFsdWUoKTogRGlyZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5kaXI7XG4gIH1cblxuICAvKiogSW5pdGlhbGl6ZSBvbmNlIGRlZmF1bHQgdmFsdWUgaGFzIGJlZW4gc2V0LiAqL1xuICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNoYW5nZS5jb21wbGV0ZSgpO1xuICB9XG59XG4iXX0=