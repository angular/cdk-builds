/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Output, Directive, EventEmitter, Input, Optional, ChangeDetectorRef, SkipSelf, Inject, } from '@angular/core';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { CDK_ACCORDION, CdkAccordion } from './accordion';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subscription } from 'rxjs';
/** Used to generate unique ID for each accordion item. */
let nextId = 0;
const ɵ0 = undefined;
/**
 * An basic directive expected to be extended and decorated as a component.  Sets up all
 * events and attributes needed to be managed by a CdkAccordion parent.
 */
let CdkAccordionItem = /** @class */ (() => {
    class CdkAccordionItem {
        constructor(accordion, _changeDetectorRef, _expansionDispatcher) {
            this.accordion = accordion;
            this._changeDetectorRef = _changeDetectorRef;
            this._expansionDispatcher = _expansionDispatcher;
            /** Subscription to openAll/closeAll events. */
            this._openCloseAllSubscription = Subscription.EMPTY;
            /** Event emitted every time the AccordionItem is closed. */
            this.closed = new EventEmitter();
            /** Event emitted every time the AccordionItem is opened. */
            this.opened = new EventEmitter();
            /** Event emitted when the AccordionItem is destroyed. */
            this.destroyed = new EventEmitter();
            /**
             * Emits whenever the expanded state of the accordion changes.
             * Primarily used to facilitate two-way binding.
             * @docs-private
             */
            this.expandedChange = new EventEmitter();
            /** The unique AccordionItem id. */
            this.id = `cdk-accordion-child-${nextId++}`;
            this._expanded = false;
            this._disabled = false;
            /** Unregister function for _expansionDispatcher. */
            this._removeUniqueSelectionListener = () => { };
            this._removeUniqueSelectionListener =
                _expansionDispatcher.listen((id, accordionId) => {
                    if (this.accordion && !this.accordion.multi &&
                        this.accordion.id === accordionId && this.id !== id) {
                        this.expanded = false;
                    }
                });
            // When an accordion item is hosted in an accordion, subscribe to open/close events.
            if (this.accordion) {
                this._openCloseAllSubscription = this._subscribeToOpenCloseAllActions();
            }
        }
        /** Whether the AccordionItem is expanded. */
        get expanded() { return this._expanded; }
        set expanded(expanded) {
            expanded = coerceBooleanProperty(expanded);
            // Only emit events and update the internal value if the value changes.
            if (this._expanded !== expanded) {
                this._expanded = expanded;
                this.expandedChange.emit(expanded);
                if (expanded) {
                    this.opened.emit();
                    /**
                     * In the unique selection dispatcher, the id parameter is the id of the CdkAccordionItem,
                     * the name value is the id of the accordion.
                     */
                    const accordionId = this.accordion ? this.accordion.id : this.id;
                    this._expansionDispatcher.notify(this.id, accordionId);
                }
                else {
                    this.closed.emit();
                }
                // Ensures that the animation will run when the value is set outside of an `@Input`.
                // This includes cases like the open, close and toggle methods.
                this._changeDetectorRef.markForCheck();
            }
        }
        /** Whether the AccordionItem is disabled. */
        get disabled() { return this._disabled; }
        set disabled(disabled) { this._disabled = coerceBooleanProperty(disabled); }
        /** Emits an event for the accordion item being destroyed. */
        ngOnDestroy() {
            this.opened.complete();
            this.closed.complete();
            this.destroyed.emit();
            this.destroyed.complete();
            this._removeUniqueSelectionListener();
            this._openCloseAllSubscription.unsubscribe();
        }
        /** Toggles the expanded state of the accordion item. */
        toggle() {
            if (!this.disabled) {
                this.expanded = !this.expanded;
            }
        }
        /** Sets the expanded state of the accordion item to false. */
        close() {
            if (!this.disabled) {
                this.expanded = false;
            }
        }
        /** Sets the expanded state of the accordion item to true. */
        open() {
            if (!this.disabled) {
                this.expanded = true;
            }
        }
        _subscribeToOpenCloseAllActions() {
            return this.accordion._openCloseAllActions.subscribe(expanded => {
                // Only change expanded state if item is enabled
                if (!this.disabled) {
                    this.expanded = expanded;
                }
            });
        }
    }
    CdkAccordionItem.decorators = [
        { type: Directive, args: [{
                    selector: 'cdk-accordion-item, [cdkAccordionItem]',
                    exportAs: 'cdkAccordionItem',
                    providers: [
                        // Provide `CDK_ACCORDION` as undefined to prevent nested accordion items from
                        // registering to the same accordion.
                        { provide: CDK_ACCORDION, useValue: ɵ0 },
                    ],
                },] }
    ];
    CdkAccordionItem.ctorParameters = () => [
        { type: CdkAccordion, decorators: [{ type: Optional }, { type: Inject, args: [CDK_ACCORDION,] }, { type: SkipSelf }] },
        { type: ChangeDetectorRef },
        { type: UniqueSelectionDispatcher }
    ];
    CdkAccordionItem.propDecorators = {
        closed: [{ type: Output }],
        opened: [{ type: Output }],
        destroyed: [{ type: Output }],
        expandedChange: [{ type: Output }],
        expanded: [{ type: Input }],
        disabled: [{ type: Input }]
    };
    return CdkAccordionItem;
})();
export { CdkAccordionItem };
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLWl0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2FjY29yZGlvbi9hY2NvcmRpb24taXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsTUFBTSxFQUNOLFNBQVMsRUFDVCxZQUFZLEVBQ1osS0FBSyxFQUVMLFFBQVEsRUFDUixpQkFBaUIsRUFDakIsUUFBUSxFQUNSLE1BQU0sR0FDUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRSxPQUFPLEVBQUMsYUFBYSxFQUFFLFlBQVksRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN4RCxPQUFPLEVBQWUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLDBEQUEwRDtBQUMxRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7V0FZd0IsU0FBUztBQVZoRDs7O0dBR0c7QUFDSDtJQUFBLE1BU2EsZ0JBQWdCO1FBMkQzQixZQUFrRSxTQUF1QixFQUNyRSxrQkFBcUMsRUFDbkMsb0JBQStDO1lBRkgsY0FBUyxHQUFULFNBQVMsQ0FBYztZQUNyRSx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1lBQ25DLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUE1RHJFLCtDQUErQztZQUN2Qyw4QkFBeUIsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBQ3ZELDREQUE0RDtZQUNsRCxXQUFNLEdBQXVCLElBQUksWUFBWSxFQUFRLENBQUM7WUFDaEUsNERBQTREO1lBQ2xELFdBQU0sR0FBdUIsSUFBSSxZQUFZLEVBQVEsQ0FBQztZQUNoRSx5REFBeUQ7WUFDL0MsY0FBUyxHQUF1QixJQUFJLFlBQVksRUFBUSxDQUFDO1lBRW5FOzs7O2VBSUc7WUFD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IFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIE91dHB1dCxcbiAgRGlyZWN0aXZlLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG4gIEluamVjdCxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1VuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge0NES19BQ0NPUkRJT04sIENka0FjY29yZGlvbn0gZnJvbSAnLi9hY2NvcmRpb24nO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIGFjY29yZGlvbiBpdGVtLiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogQW4gYmFzaWMgZGlyZWN0aXZlIGV4cGVjdGVkIHRvIGJlIGV4dGVuZGVkIGFuZCBkZWNvcmF0ZWQgYXMgYSBjb21wb25lbnQuICBTZXRzIHVwIGFsbFxuICogZXZlbnRzIGFuZCBhdHRyaWJ1dGVzIG5lZWRlZCB0byBiZSBtYW5hZ2VkIGJ5IGEgQ2RrQWNjb3JkaW9uIHBhcmVudC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWFjY29yZGlvbi1pdGVtLCBbY2RrQWNjb3JkaW9uSXRlbV0nLFxuICBleHBvcnRBczogJ2Nka0FjY29yZGlvbkl0ZW0nLFxuICBwcm92aWRlcnM6IFtcbiAgICAvLyBQcm92aWRlIGBDREtfQUNDT1JESU9OYCBhcyB1bmRlZmluZWQgdG8gcHJldmVudCBuZXN0ZWQgYWNjb3JkaW9uIGl0ZW1zIGZyb21cbiAgICAvLyByZWdpc3RlcmluZyB0byB0aGUgc2FtZSBhY2NvcmRpb24uXG4gICAge3Byb3ZpZGU6IENES19BQ0NPUkRJT04sIHVzZVZhbHVlOiB1bmRlZmluZWR9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtBY2NvcmRpb25JdGVtIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFN1YnNjcmlwdGlvbiB0byBvcGVuQWxsL2Nsb3NlQWxsIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBfb3BlbkNsb3NlQWxsU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICAvKiogRXZlbnQgZW1pdHRlZCBldmVyeSB0aW1lIHRoZSBBY2NvcmRpb25JdGVtIGlzIGNsb3NlZC4gKi9cbiAgQE91dHB1dCgpIGNsb3NlZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuICAvKiogRXZlbnQgZW1pdHRlZCBldmVyeSB0aW1lIHRoZSBBY2NvcmRpb25JdGVtIGlzIG9wZW5lZC4gKi9cbiAgQE91dHB1dCgpIG9wZW5lZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBBY2NvcmRpb25JdGVtIGlzIGRlc3Ryb3llZC4gKi9cbiAgQE91dHB1dCgpIGRlc3Ryb3llZDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuZXZlciB0aGUgZXhwYW5kZWQgc3RhdGUgb2YgdGhlIGFjY29yZGlvbiBjaGFuZ2VzLlxuICAgKiBQcmltYXJpbHkgdXNlZCB0byBmYWNpbGl0YXRlIHR3by13YXkgYmluZGluZy5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgQE91dHB1dCgpIGV4cGFuZGVkQ2hhbmdlOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4gPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgLyoqIFRoZSB1bmlxdWUgQWNjb3JkaW9uSXRlbSBpZC4gKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZyA9IGBjZGstYWNjb3JkaW9uLWNoaWxkLSR7bmV4dElkKyt9YDtcblxuICAvKiogV2hldGhlciB0aGUgQWNjb3JkaW9uSXRlbSBpcyBleHBhbmRlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGV4cGFuZGVkKCk6IGFueSB7IHJldHVybiB0aGlzLl9leHBhbmRlZDsgfVxuICBzZXQgZXhwYW5kZWQoZXhwYW5kZWQ6IGFueSkge1xuICAgIGV4cGFuZGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KGV4cGFuZGVkKTtcblxuICAgIC8vIE9ubHkgZW1pdCBldmVudHMgYW5kIHVwZGF0ZSB0aGUgaW50ZXJuYWwgdmFsdWUgaWYgdGhlIHZhbHVlIGNoYW5nZXMuXG4gICAgaWYgKHRoaXMuX2V4cGFuZGVkICE9PSBleHBhbmRlZCkge1xuICAgICAgdGhpcy5fZXhwYW5kZWQgPSBleHBhbmRlZDtcbiAgICAgIHRoaXMuZXhwYW5kZWRDaGFuZ2UuZW1pdChleHBhbmRlZCk7XG5cbiAgICAgIGlmIChleHBhbmRlZCkge1xuICAgICAgICB0aGlzLm9wZW5lZC5lbWl0KCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbiB0aGUgdW5pcXVlIHNlbGVjdGlvbiBkaXNwYXRjaGVyLCB0aGUgaWQgcGFyYW1ldGVyIGlzIHRoZSBpZCBvZiB0aGUgQ2RrQWNjb3JkaW9uSXRlbSxcbiAgICAgICAgICogdGhlIG5hbWUgdmFsdWUgaXMgdGhlIGlkIG9mIHRoZSBhY2NvcmRpb24uXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBhY2NvcmRpb25JZCA9IHRoaXMuYWNjb3JkaW9uID8gdGhpcy5hY2NvcmRpb24uaWQgOiB0aGlzLmlkO1xuICAgICAgICB0aGlzLl9leHBhbnNpb25EaXNwYXRjaGVyLm5vdGlmeSh0aGlzLmlkLCBhY2NvcmRpb25JZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNsb3NlZC5lbWl0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEVuc3VyZXMgdGhhdCB0aGUgYW5pbWF0aW9uIHdpbGwgcnVuIHdoZW4gdGhlIHZhbHVlIGlzIHNldCBvdXRzaWRlIG9mIGFuIGBASW5wdXRgLlxuICAgICAgLy8gVGhpcyBpbmNsdWRlcyBjYXNlcyBsaWtlIHRoZSBvcGVuLCBjbG9zZSBhbmQgdG9nZ2xlIG1ldGhvZHMuXG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfZXhwYW5kZWQgPSBmYWxzZTtcblxuICAvKiogV2hldGhlciB0aGUgQWNjb3JkaW9uSXRlbSBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGRpc2FibGVkKCkgeyByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7IH1cbiAgc2V0IGRpc2FibGVkKGRpc2FibGVkOiBhbnkpIHsgdGhpcy5fZGlzYWJsZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkoZGlzYWJsZWQpOyB9XG4gIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIFVucmVnaXN0ZXIgZnVuY3Rpb24gZm9yIF9leHBhbnNpb25EaXNwYXRjaGVyLiAqL1xuICBwcml2YXRlIF9yZW1vdmVVbmlxdWVTZWxlY3Rpb25MaXN0ZW5lcjogKCkgPT4gdm9pZCA9ICgpID0+IHt9O1xuXG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIEBJbmplY3QoQ0RLX0FDQ09SRElPTikgQFNraXBTZWxmKCkgcHVibGljIGFjY29yZGlvbjogQ2RrQWNjb3JkaW9uLFxuICAgICAgICAgICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBfZXhwYW5zaW9uRGlzcGF0Y2hlcjogVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlcikge1xuICAgIHRoaXMuX3JlbW92ZVVuaXF1ZVNlbGVjdGlvbkxpc3RlbmVyID1cbiAgICAgIF9leHBhbnNpb25EaXNwYXRjaGVyLmxpc3RlbigoaWQ6IHN0cmluZywgYWNjb3JkaW9uSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY2NvcmRpb24gJiYgIXRoaXMuYWNjb3JkaW9uLm11bHRpICYmXG4gICAgICAgICAgICB0aGlzLmFjY29yZGlvbi5pZCA9PT0gYWNjb3JkaW9uSWQgJiYgdGhpcy5pZCAhPT0gaWQpIHtcbiAgICAgICAgICB0aGlzLmV4cGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgLy8gV2hlbiBhbiBhY2NvcmRpb24gaXRlbSBpcyBob3N0ZWQgaW4gYW4gYWNjb3JkaW9uLCBzdWJzY3JpYmUgdG8gb3Blbi9jbG9zZSBldmVudHMuXG4gICAgaWYgKHRoaXMuYWNjb3JkaW9uKSB7XG4gICAgICB0aGlzLl9vcGVuQ2xvc2VBbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9zdWJzY3JpYmVUb09wZW5DbG9zZUFsbEFjdGlvbnMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogRW1pdHMgYW4gZXZlbnQgZm9yIHRoZSBhY2NvcmRpb24gaXRlbSBiZWluZyBkZXN0cm95ZWQuICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMub3BlbmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5jbG9zZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5lbWl0KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9yZW1vdmVVbmlxdWVTZWxlY3Rpb25MaXN0ZW5lcigpO1xuICAgIHRoaXMuX29wZW5DbG9zZUFsbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gaXRlbS4gKi9cbiAgdG9nZ2xlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5leHBhbmRlZCA9ICF0aGlzLmV4cGFuZGVkO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBleHBhbmRlZCBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGl0ZW0gdG8gZmFsc2UuICovXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5leHBhbmRlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBleHBhbmRlZCBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGl0ZW0gdG8gdHJ1ZS4gKi9cbiAgb3BlbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvT3BlbkNsb3NlQWxsQWN0aW9ucygpOiBTdWJzY3JpcHRpb24ge1xuICAgIHJldHVybiB0aGlzLmFjY29yZGlvbi5fb3BlbkNsb3NlQWxsQWN0aW9ucy5zdWJzY3JpYmUoZXhwYW5kZWQgPT4ge1xuICAgICAgLy8gT25seSBjaGFuZ2UgZXhwYW5kZWQgc3RhdGUgaWYgaXRlbSBpcyBlbmFibGVkXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5leHBhbmRlZCA9IGV4cGFuZGVkO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2V4cGFuZGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xufVxuIl19