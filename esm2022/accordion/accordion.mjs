/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, InjectionToken, Input, booleanAttribute, } from '@angular/core';
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
        /** Whether the accordion should allow multiple expanded accordion items simultaneously. */
        this.multi = false;
    }
    /** Opens all enabled accordion items in an accordion where multi is enabled. */
    openAll() {
        if (this.multi) {
            this._openCloseAllActions.next(true);
        }
    }
    /** Closes all enabled accordion items. */
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkAccordion, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "17.0.4", type: CdkAccordion, selector: "cdk-accordion, [cdkAccordion]", inputs: { multi: ["multi", "multi", booleanAttribute] }, providers: [{ provide: CDK_ACCORDION, useExisting: CdkAccordion }], exportAs: ["cdkAccordion"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.4", ngImport: i0, type: CdkAccordion, decorators: [{
            type: Directive,
            args: [{
                    selector: 'cdk-accordion, [cdkAccordion]',
                    exportAs: 'cdkAccordion',
                    providers: [{ provide: CDK_ACCORDION, useExisting: CdkAccordion }],
                }]
        }], propDecorators: { multi: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hY2NvcmRpb24vYWNjb3JkaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxTQUFTLEVBQ1QsY0FBYyxFQUNkLEtBQUssRUFJTCxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQzs7QUFFN0IscURBQXFEO0FBQ3JELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsSUFBSSxjQUFjLENBQWUsY0FBYyxDQUFDLENBQUM7QUFFOUU7O0dBRUc7QUFNSCxNQUFNLE9BQU8sWUFBWTtJQUx6QjtRQU1FLG9EQUFvRDtRQUMzQyxrQkFBYSxHQUFHLElBQUksT0FBTyxFQUFpQixDQUFDO1FBRXRELHVFQUF1RTtRQUM5RCx5QkFBb0IsR0FBcUIsSUFBSSxPQUFPLEVBQVcsQ0FBQztRQUV6RSxvRUFBb0U7UUFDM0QsT0FBRSxHQUFXLGlCQUFpQixNQUFNLEVBQUUsRUFBRSxDQUFDO1FBRWxELDJGQUEyRjtRQUNyRCxVQUFLLEdBQVksS0FBSyxDQUFDO0tBc0I5RDtJQXBCQyxnRkFBZ0Y7SUFDaEYsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNkLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdEM7SUFDSCxDQUFDO0lBRUQsMENBQTBDO0lBQzFDLFFBQVE7UUFDTixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxXQUFXLENBQUMsT0FBc0I7UUFDaEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN2QyxDQUFDOzhHQWhDVSxZQUFZO2tHQUFaLFlBQVksaUZBV0osZ0JBQWdCLGdCQWJ4QixDQUFDLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFDLENBQUM7OzJGQUVyRCxZQUFZO2tCQUx4QixTQUFTO21CQUFDO29CQUNULFFBQVEsRUFBRSwrQkFBK0I7b0JBQ3pDLFFBQVEsRUFBRSxjQUFjO29CQUN4QixTQUFTLEVBQUUsQ0FBQyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsV0FBVyxjQUFjLEVBQUMsQ0FBQztpQkFDakU7OEJBWXVDLEtBQUs7c0JBQTFDLEtBQUs7dUJBQUMsRUFBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBib29sZWFuQXR0cmlidXRlLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbi8qKiBVc2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRCBmb3IgZWFjaCBhY2NvcmRpb24uICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byByZWZlcmVuY2UgaW5zdGFuY2VzIG9mIGBDZGtBY2NvcmRpb25gLiBJdCBzZXJ2ZXNcbiAqIGFzIGFsdGVybmF0aXZlIHRva2VuIHRvIHRoZSBhY3R1YWwgYENka0FjY29yZGlvbmAgY2xhc3Mgd2hpY2ggY291bGQgY2F1c2UgdW5uZWNlc3NhcnlcbiAqIHJldGVudGlvbiBvZiB0aGUgY2xhc3MgYW5kIGl0cyBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gKi9cbmV4cG9ydCBjb25zdCBDREtfQUNDT1JESU9OID0gbmV3IEluamVjdGlvblRva2VuPENka0FjY29yZGlvbj4oJ0Nka0FjY29yZGlvbicpO1xuXG4vKipcbiAqIERpcmVjdGl2ZSB3aG9zZSBwdXJwb3NlIGlzIHRvIG1hbmFnZSB0aGUgZXhwYW5kZWQgc3RhdGUgb2YgQ2RrQWNjb3JkaW9uSXRlbSBjaGlsZHJlbi5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWFjY29yZGlvbiwgW2Nka0FjY29yZGlvbl0nLFxuICBleHBvcnRBczogJ2Nka0FjY29yZGlvbicsXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBDREtfQUNDT1JESU9OLCB1c2VFeGlzdGluZzogQ2RrQWNjb3JkaW9ufV0sXG59KVxuZXhwb3J0IGNsYXNzIENka0FjY29yZGlvbiBpbXBsZW1lbnRzIE9uRGVzdHJveSwgT25DaGFuZ2VzIHtcbiAgLyoqIEVtaXRzIHdoZW4gdGhlIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gY2hhbmdlcyAqL1xuICByZWFkb25seSBfc3RhdGVDaGFuZ2VzID0gbmV3IFN1YmplY3Q8U2ltcGxlQ2hhbmdlcz4oKTtcblxuICAvKiogU3RyZWFtIHRoYXQgZW1pdHMgdHJ1ZS9mYWxzZSB3aGVuIG9wZW5BbGwvY2xvc2VBbGwgaXMgdHJpZ2dlcmVkLiAqL1xuICByZWFkb25seSBfb3BlbkNsb3NlQWxsQWN0aW9uczogU3ViamVjdDxib29sZWFuPiA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XG5cbiAgLyoqIEEgcmVhZG9ubHkgaWQgdmFsdWUgdG8gdXNlIGZvciB1bmlxdWUgc2VsZWN0aW9uIGNvb3JkaW5hdGlvbi4gKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZyA9IGBjZGstYWNjb3JkaW9uLSR7bmV4dElkKyt9YDtcblxuICAvKiogV2hldGhlciB0aGUgYWNjb3JkaW9uIHNob3VsZCBhbGxvdyBtdWx0aXBsZSBleHBhbmRlZCBhY2NvcmRpb24gaXRlbXMgc2ltdWx0YW5lb3VzbHkuICovXG4gIEBJbnB1dCh7dHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSkgbXVsdGk6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogT3BlbnMgYWxsIGVuYWJsZWQgYWNjb3JkaW9uIGl0ZW1zIGluIGFuIGFjY29yZGlvbiB3aGVyZSBtdWx0aSBpcyBlbmFibGVkLiAqL1xuICBvcGVuQWxsKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm11bHRpKSB7XG4gICAgICB0aGlzLl9vcGVuQ2xvc2VBbGxBY3Rpb25zLm5leHQodHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENsb3NlcyBhbGwgZW5hYmxlZCBhY2NvcmRpb24gaXRlbXMuICovXG4gIGNsb3NlQWxsKCk6IHZvaWQge1xuICAgIHRoaXMuX29wZW5DbG9zZUFsbEFjdGlvbnMubmV4dChmYWxzZSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgdGhpcy5fc3RhdGVDaGFuZ2VzLm5leHQoY2hhbmdlcyk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9zdGF0ZUNoYW5nZXMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vcGVuQ2xvc2VBbGxBY3Rpb25zLmNvbXBsZXRlKCk7XG4gIH1cbn1cbiJdfQ==