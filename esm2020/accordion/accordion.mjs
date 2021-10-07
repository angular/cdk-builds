/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Directive, InjectionToken, Input } from '@angular/core';
import { Subject } from 'rxjs';
import * as i0 from "@angular/core";
/** Used to generate unique ID for each accordion. */
let nextId = 0;
/**
 * Injection token that can be used to reference instances of `CdkAccordion`. It serves
 * as alternative token to the actual `CdkAccordion` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_ACCORDION = new InjectionToken('CdkAccordion');
/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 */
export class CdkAccordion {
    constructor() {
        /** Emits when the state of the accordion changes */
        this._stateChanges = new Subject();
        /** Stream that emits true/false when openAll/closeAll is triggered. */
        this._openCloseAllActions = new Subject();
        /** A readonly id value to use for unique selection coordination. */
        this.id = `cdk-accordion-${nextId++}`;
        this._multi = false;
    }
    /** Whether the accordion should allow multiple expanded accordion items simultaneously. */
    get multi() { return this._multi; }
    set multi(multi) { this._multi = coerceBooleanProperty(multi); }
    /** Opens all enabled accordion items in an accordion where multi is enabled. */
    openAll() {
        if (this._multi) {
            this._openCloseAllActions.next(true);
        }
    }
    /** Closes all enabled accordion items in an accordion where multi is enabled. */
    closeAll() {
        this._openCloseAllActions.next(false);
    }
    ngOnChanges(changes) {
        this._stateChanges.next(changes);
    }
    ngOnDestroy() {
        this._stateChanges.complete();
        this._openCloseAllActions.complete();
    }
}
CdkAccordion.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkAccordion, deps: [], target: i0.ɵɵFactoryTarget.Directive });
CdkAccordion.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.0.0-next.15", type: CdkAccordion, selector: "cdk-accordion, [cdkAccordion]", inputs: { multi: "multi" }, providers: [{ provide: CDK_ACCORDION, useExisting: CdkAccordion }], exportAs: ["cdkAccordion"], usesOnChanges: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.0.0-next.15", ngImport: i0, type: CdkAccordion, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-accordion, [cdkAccordion]',
                    exportAs: 'cdkAccordion',
                    providers: [{ provide: CDK_ACCORDION, useExisting: CdkAccordion }],
                }]
        }], propDecorators: { multi: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hY2NvcmRpb24vYWNjb3JkaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBc0MsTUFBTSxlQUFlLENBQUM7QUFDcEcsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQzs7QUFFN0IscURBQXFEO0FBQ3JELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxjQUFjLENBQWUsY0FBYyxDQUFDLENBQUM7QUFFOUU7O0dBRUc7QUFNSCxNQUFNLE9BQU8sWUFBWTtJQUx6QjtRQU1FLG9EQUFvRDtRQUMzQyxrQkFBYSxHQUFHLElBQUksT0FBTyxFQUFpQixDQUFDO1FBRXRELHVFQUF1RTtRQUM5RCx5QkFBb0IsR0FBcUIsSUFBSSxPQUFPLEVBQVcsQ0FBQztRQUV6RSxvRUFBb0U7UUFDM0QsT0FBRSxHQUFHLGlCQUFpQixNQUFNLEVBQUUsRUFBRSxDQUFDO1FBTWxDLFdBQU0sR0FBWSxLQUFLLENBQUM7S0F3QmpDO0lBNUJDLDJGQUEyRjtJQUMzRixJQUNJLEtBQUssS0FBYyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzVDLElBQUksS0FBSyxDQUFDLEtBQWMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUd6RSxnRkFBZ0Y7SUFDaEYsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdEM7SUFDSCxDQUFDO0lBRUQsaUZBQWlGO0lBQ2pGLFFBQVE7UUFDTixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN2QyxDQUFDOztpSEFuQ1UsWUFBWTtxR0FBWixZQUFZLG9GQUZaLENBQUMsRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUMsQ0FBQzttR0FFckQsWUFBWTtrQkFMeEIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsK0JBQStCO29CQUN6QyxRQUFRLEVBQUUsY0FBYztvQkFDeEIsU0FBUyxFQUFFLENBQUMsRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLFdBQVcsY0FBYyxFQUFDLENBQUM7aUJBQ2pFOzhCQWFLLEtBQUs7c0JBRFIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jvb2xlYW5JbnB1dCwgY29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtEaXJlY3RpdmUsIEluamVjdGlvblRva2VuLCBJbnB1dCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIFNpbXBsZUNoYW5nZXN9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIGFjY29yZGlvbi4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIEluamVjdGlvbiB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlZmVyZW5jZSBpbnN0YW5jZXMgb2YgYENka0FjY29yZGlvbmAuIEl0IHNlcnZlc1xuICogYXMgYWx0ZXJuYXRpdmUgdG9rZW4gdG8gdGhlIGFjdHVhbCBgQ2RrQWNjb3JkaW9uYCBjbGFzcyB3aGljaCBjb3VsZCBjYXVzZSB1bm5lY2Vzc2FyeVxuICogcmV0ZW50aW9uIG9mIHRoZSBjbGFzcyBhbmQgaXRzIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAqL1xuZXhwb3J0IGNvbnN0IENES19BQ0NPUkRJT04gPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrQWNjb3JkaW9uPignQ2RrQWNjb3JkaW9uJyk7XG5cbi8qKlxuICogRGlyZWN0aXZlIHdob3NlIHB1cnBvc2UgaXMgdG8gbWFuYWdlIHRoZSBleHBhbmRlZCBzdGF0ZSBvZiBDZGtBY2NvcmRpb25JdGVtIGNoaWxkcmVuLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstYWNjb3JkaW9uLCBbY2RrQWNjb3JkaW9uXScsXG4gIGV4cG9ydEFzOiAnY2RrQWNjb3JkaW9uJyxcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IENES19BQ0NPUkRJT04sIHVzZUV4aXN0aW5nOiBDZGtBY2NvcmRpb259XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQWNjb3JkaW9uIGltcGxlbWVudHMgT25EZXN0cm95LCBPbkNoYW5nZXMge1xuICAvKiogRW1pdHMgd2hlbiB0aGUgc3RhdGUgb2YgdGhlIGFjY29yZGlvbiBjaGFuZ2VzICovXG4gIHJlYWRvbmx5IF9zdGF0ZUNoYW5nZXMgPSBuZXcgU3ViamVjdDxTaW1wbGVDaGFuZ2VzPigpO1xuXG4gIC8qKiBTdHJlYW0gdGhhdCBlbWl0cyB0cnVlL2ZhbHNlIHdoZW4gb3BlbkFsbC9jbG9zZUFsbCBpcyB0cmlnZ2VyZWQuICovXG4gIHJlYWRvbmx5IF9vcGVuQ2xvc2VBbGxBY3Rpb25zOiBTdWJqZWN0PGJvb2xlYW4+ID0gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKTtcblxuICAvKiogQSByZWFkb25seSBpZCB2YWx1ZSB0byB1c2UgZm9yIHVuaXF1ZSBzZWxlY3Rpb24gY29vcmRpbmF0aW9uLiAqL1xuICByZWFkb25seSBpZCA9IGBjZGstYWNjb3JkaW9uLSR7bmV4dElkKyt9YDtcblxuICAvKiogV2hldGhlciB0aGUgYWNjb3JkaW9uIHNob3VsZCBhbGxvdyBtdWx0aXBsZSBleHBhbmRlZCBhY2NvcmRpb24gaXRlbXMgc2ltdWx0YW5lb3VzbHkuICovXG4gIEBJbnB1dCgpXG4gIGdldCBtdWx0aSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX211bHRpOyB9XG4gIHNldCBtdWx0aShtdWx0aTogYm9vbGVhbikgeyB0aGlzLl9tdWx0aSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eShtdWx0aSk7IH1cbiAgcHJpdmF0ZSBfbXVsdGk6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogT3BlbnMgYWxsIGVuYWJsZWQgYWNjb3JkaW9uIGl0ZW1zIGluIGFuIGFjY29yZGlvbiB3aGVyZSBtdWx0aSBpcyBlbmFibGVkLiAqL1xuICBvcGVuQWxsKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9tdWx0aSkge1xuICAgICAgdGhpcy5fb3BlbkNsb3NlQWxsQWN0aW9ucy5uZXh0KHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDbG9zZXMgYWxsIGVuYWJsZWQgYWNjb3JkaW9uIGl0ZW1zIGluIGFuIGFjY29yZGlvbiB3aGVyZSBtdWx0aSBpcyBlbmFibGVkLiAqL1xuICBjbG9zZUFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLl9vcGVuQ2xvc2VBbGxBY3Rpb25zLm5leHQoZmFsc2UpO1xuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgIHRoaXMuX3N0YXRlQ2hhbmdlcy5uZXh0KGNoYW5nZXMpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb3BlbkNsb3NlQWxsQWN0aW9ucy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX211bHRpOiBCb29sZWFuSW5wdXQ7XG59XG4iXX0=