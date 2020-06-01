/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Output, Directive, EventEmitter, Input, Optional, ChangeDetectorRef, SkipSelf, } from '@angular/core';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { CdkAccordion } from './accordion';
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
                        // Provide CdkAccordion as undefined to prevent nested accordion items from registering
                        // to the same accordion.
                        { provide: CdkAccordion, useValue: ɵ0 },
                    ],
                },] }
    ];
    /** @nocollapse */
    CdkAccordionItem.ctorParameters = () => [
        { type: CdkAccordion, decorators: [{ type: Optional }, { type: SkipSelf }] },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLWl0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2FjY29yZGlvbi9hY2NvcmRpb24taXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsTUFBTSxFQUNOLFNBQVMsRUFDVCxZQUFZLEVBQ1osS0FBSyxFQUVMLFFBQVEsRUFDUixpQkFBaUIsRUFDakIsUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDekMsT0FBTyxFQUFlLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVsQywwREFBMEQ7QUFDMUQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1dBWXVCLFNBQVM7QUFWL0M7OztHQUdHO0FBQ0g7SUFBQSxNQVNhLGdCQUFnQjtRQTJEM0IsWUFBMkMsU0FBdUIsRUFDOUMsa0JBQXFDLEVBQ25DLG9CQUErQztZQUYxQixjQUFTLEdBQVQsU0FBUyxDQUFjO1lBQzlDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7WUFDbkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQTVEckUsK0NBQStDO1lBQ3ZDLDhCQUF5QixHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFDdkQsNERBQTREO1lBQ2xELFdBQU0sR0FBdUIsSUFBSSxZQUFZLEVBQVEsQ0FBQztZQUNoRSw0REFBNEQ7WUFDbEQsV0FBTSxHQUF1QixJQUFJLFlBQVksRUFBUSxDQUFDO1lBQ2hFLHlEQUF5RDtZQUMvQyxjQUFTLEdBQXVCLElBQUksWUFBWSxFQUFRLENBQUM7WUFFbkU7Ozs7ZUFJRztZQUNPLG1CQUFjLEdBQTBCLElBQUks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Q0FBQyxRQUFRLENBQUM7YUFDaEM7UUFDSCxDQUFDO1FBRUQsOERBQThEO1FBQzlELEtBQUs7WUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7YUFDdkI7UUFDSCxDQUFDO1FBRUQsNkRBQTZEO1FBQzdELElBQUk7WUFDRixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7YUFDdEI7UUFDSCxDQUFDO1FBRU8sK0JBQStCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzlELGdEQUFnRDtnQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2lCQUMxQjtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzs7O2dCQTNIRixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLHdDQUF3QztvQkFDbEQsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsU0FBUyxFQUFFO3dCQUNULHVGQUF1Rjt3QkFDdkYseUJBQXlCO3dCQUN6QixFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxJQUFXLEVBQUM7cUJBQzdDO2lCQUNGOzs7O2dCQW5CTyxZQUFZLHVCQStFTCxRQUFRLFlBQUksUUFBUTtnQkFuRmpDLGlCQUFpQjtnQkFHWCx5QkFBeUI7Ozt5QkF5QjlCLE1BQU07eUJBRU4sTUFBTTs0QkFFTixNQUFNO2lDQU9OLE1BQU07MkJBTU4sS0FBSzsyQkE4QkwsS0FBSzs7SUFtRVIsdUJBQUM7S0FBQTtTQXRIWSxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgT3V0cHV0LFxuICBEaXJlY3RpdmUsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBTa2lwU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1VuaXF1ZVNlbGVjdGlvbkRpc3BhdGNoZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2xsZWN0aW9ucyc7XG5pbXBvcnQge0Nka0FjY29yZGlvbn0gZnJvbSAnLi9hY2NvcmRpb24nO1xuaW1wb3J0IHtCb29sZWFuSW5wdXQsIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuLyoqIFVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEIGZvciBlYWNoIGFjY29yZGlvbiBpdGVtLiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKlxuICogQW4gYmFzaWMgZGlyZWN0aXZlIGV4cGVjdGVkIHRvIGJlIGV4dGVuZGVkIGFuZCBkZWNvcmF0ZWQgYXMgYSBjb21wb25lbnQuICBTZXRzIHVwIGFsbFxuICogZXZlbnRzIGFuZCBhdHRyaWJ1dGVzIG5lZWRlZCB0byBiZSBtYW5hZ2VkIGJ5IGEgQ2RrQWNjb3JkaW9uIHBhcmVudC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnY2RrLWFjY29yZGlvbi1pdGVtLCBbY2RrQWNjb3JkaW9uSXRlbV0nLFxuICBleHBvcnRBczogJ2Nka0FjY29yZGlvbkl0ZW0nLFxuICBwcm92aWRlcnM6IFtcbiAgICAvLyBQcm92aWRlIENka0FjY29yZGlvbiBhcyB1bmRlZmluZWQgdG8gcHJldmVudCBuZXN0ZWQgYWNjb3JkaW9uIGl0ZW1zIGZyb20gcmVnaXN0ZXJpbmdcbiAgICAvLyB0byB0aGUgc2FtZSBhY2NvcmRpb24uXG4gICAge3Byb3ZpZGU6IENka0FjY29yZGlvbiwgdXNlVmFsdWU6IHVuZGVmaW5lZH0sXG4gIF0sXG59KVxuZXhwb3J0IGNsYXNzIENka0FjY29yZGlvbkl0ZW0gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogU3Vic2NyaXB0aW9uIHRvIG9wZW5BbGwvY2xvc2VBbGwgZXZlbnRzLiAqL1xuICBwcml2YXRlIF9vcGVuQ2xvc2VBbGxTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIC8qKiBFdmVudCBlbWl0dGVkIGV2ZXJ5IHRpbWUgdGhlIEFjY29yZGlvbkl0ZW0gaXMgY2xvc2VkLiAqL1xuICBAT3V0cHV0KCkgY2xvc2VkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG4gIC8qKiBFdmVudCBlbWl0dGVkIGV2ZXJ5IHRpbWUgdGhlIEFjY29yZGlvbkl0ZW0gaXMgb3BlbmVkLiAqL1xuICBAT3V0cHV0KCkgb3BlbmVkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIEFjY29yZGlvbkl0ZW0gaXMgZGVzdHJveWVkLiAqL1xuICBAT3V0cHV0KCkgZGVzdHJveWVkOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW5ldmVyIHRoZSBleHBhbmRlZCBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGNoYW5nZXMuXG4gICAqIFByaW1hcmlseSB1c2VkIHRvIGZhY2lsaXRhdGUgdHdvLXdheSBiaW5kaW5nLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBAT3V0cHV0KCkgZXhwYW5kZWRDaGFuZ2U6IEV2ZW50RW1pdHRlcjxib29sZWFuPiA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICAvKiogVGhlIHVuaXF1ZSBBY2NvcmRpb25JdGVtIGlkLiAqL1xuICByZWFkb25seSBpZDogc3RyaW5nID0gYGNkay1hY2NvcmRpb24tY2hpbGQtJHtuZXh0SWQrK31gO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBBY2NvcmRpb25JdGVtIGlzIGV4cGFuZGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZXhwYW5kZWQoKTogYW55IHsgcmV0dXJuIHRoaXMuX2V4cGFuZGVkOyB9XG4gIHNldCBleHBhbmRlZChleHBhbmRlZDogYW55KSB7XG4gICAgZXhwYW5kZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkoZXhwYW5kZWQpO1xuXG4gICAgLy8gT25seSBlbWl0IGV2ZW50cyBhbmQgdXBkYXRlIHRoZSBpbnRlcm5hbCB2YWx1ZSBpZiB0aGUgdmFsdWUgY2hhbmdlcy5cbiAgICBpZiAodGhpcy5fZXhwYW5kZWQgIT09IGV4cGFuZGVkKSB7XG4gICAgICB0aGlzLl9leHBhbmRlZCA9IGV4cGFuZGVkO1xuICAgICAgdGhpcy5leHBhbmRlZENoYW5nZS5lbWl0KGV4cGFuZGVkKTtcblxuICAgICAgaWYgKGV4cGFuZGVkKSB7XG4gICAgICAgIHRoaXMub3BlbmVkLmVtaXQoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluIHRoZSB1bmlxdWUgc2VsZWN0aW9uIGRpc3BhdGNoZXIsIHRoZSBpZCBwYXJhbWV0ZXIgaXMgdGhlIGlkIG9mIHRoZSBDZGtBY2NvcmRpb25JdGVtLFxuICAgICAgICAgKiB0aGUgbmFtZSB2YWx1ZSBpcyB0aGUgaWQgb2YgdGhlIGFjY29yZGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGFjY29yZGlvbklkID0gdGhpcy5hY2NvcmRpb24gPyB0aGlzLmFjY29yZGlvbi5pZCA6IHRoaXMuaWQ7XG4gICAgICAgIHRoaXMuX2V4cGFuc2lvbkRpc3BhdGNoZXIubm90aWZ5KHRoaXMuaWQsIGFjY29yZGlvbklkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2xvc2VkLmVtaXQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRW5zdXJlcyB0aGF0IHRoZSBhbmltYXRpb24gd2lsbCBydW4gd2hlbiB0aGUgdmFsdWUgaXMgc2V0IG91dHNpZGUgb2YgYW4gYEBJbnB1dGAuXG4gICAgICAvLyBUaGlzIGluY2x1ZGVzIGNhc2VzIGxpa2UgdGhlIG9wZW4sIGNsb3NlIGFuZCB0b2dnbGUgbWV0aG9kcy5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9leHBhbmRlZCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBBY2NvcmRpb25JdGVtIGlzIGRpc2FibGVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZGlzYWJsZWQoKSB7IHJldHVybiB0aGlzLl9kaXNhYmxlZDsgfVxuICBzZXQgZGlzYWJsZWQoZGlzYWJsZWQ6IGFueSkgeyB0aGlzLl9kaXNhYmxlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eShkaXNhYmxlZCk7IH1cbiAgcHJpdmF0ZSBfZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogVW5yZWdpc3RlciBmdW5jdGlvbiBmb3IgX2V4cGFuc2lvbkRpc3BhdGNoZXIuICovXG4gIHByaXZhdGUgX3JlbW92ZVVuaXF1ZVNlbGVjdGlvbkxpc3RlbmVyOiAoKSA9PiB2b2lkID0gKCkgPT4ge307XG5cbiAgY29uc3RydWN0b3IoQE9wdGlvbmFsKCkgQFNraXBTZWxmKCkgcHVibGljIGFjY29yZGlvbjogQ2RrQWNjb3JkaW9uLFxuICAgICAgICAgICAgICBwcml2YXRlIF9jaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgICAgICAgICAgIHByb3RlY3RlZCBfZXhwYW5zaW9uRGlzcGF0Y2hlcjogVW5pcXVlU2VsZWN0aW9uRGlzcGF0Y2hlcikge1xuICAgIHRoaXMuX3JlbW92ZVVuaXF1ZVNlbGVjdGlvbkxpc3RlbmVyID1cbiAgICAgIF9leHBhbnNpb25EaXNwYXRjaGVyLmxpc3RlbigoaWQ6IHN0cmluZywgYWNjb3JkaW9uSWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAodGhpcy5hY2NvcmRpb24gJiYgIXRoaXMuYWNjb3JkaW9uLm11bHRpICYmXG4gICAgICAgICAgICB0aGlzLmFjY29yZGlvbi5pZCA9PT0gYWNjb3JkaW9uSWQgJiYgdGhpcy5pZCAhPT0gaWQpIHtcbiAgICAgICAgICB0aGlzLmV4cGFuZGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgLy8gV2hlbiBhbiBhY2NvcmRpb24gaXRlbSBpcyBob3N0ZWQgaW4gYW4gYWNjb3JkaW9uLCBzdWJzY3JpYmUgdG8gb3Blbi9jbG9zZSBldmVudHMuXG4gICAgaWYgKHRoaXMuYWNjb3JkaW9uKSB7XG4gICAgICB0aGlzLl9vcGVuQ2xvc2VBbGxTdWJzY3JpcHRpb24gPSB0aGlzLl9zdWJzY3JpYmVUb09wZW5DbG9zZUFsbEFjdGlvbnMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogRW1pdHMgYW4gZXZlbnQgZm9yIHRoZSBhY2NvcmRpb24gaXRlbSBiZWluZyBkZXN0cm95ZWQuICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMub3BlbmVkLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5jbG9zZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5lbWl0KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLl9yZW1vdmVVbmlxdWVTZWxlY3Rpb25MaXN0ZW5lcigpO1xuICAgIHRoaXMuX29wZW5DbG9zZUFsbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gaXRlbS4gKi9cbiAgdG9nZ2xlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5leHBhbmRlZCA9ICF0aGlzLmV4cGFuZGVkO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBleHBhbmRlZCBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGl0ZW0gdG8gZmFsc2UuICovXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5leHBhbmRlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBleHBhbmRlZCBzdGF0ZSBvZiB0aGUgYWNjb3JkaW9uIGl0ZW0gdG8gdHJ1ZS4gKi9cbiAgb3BlbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuZXhwYW5kZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvT3BlbkNsb3NlQWxsQWN0aW9ucygpOiBTdWJzY3JpcHRpb24ge1xuICAgIHJldHVybiB0aGlzLmFjY29yZGlvbi5fb3BlbkNsb3NlQWxsQWN0aW9ucy5zdWJzY3JpYmUoZXhwYW5kZWQgPT4ge1xuICAgICAgLy8gT25seSBjaGFuZ2UgZXhwYW5kZWQgc3RhdGUgaWYgaXRlbSBpcyBlbmFibGVkXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5leHBhbmRlZCA9IGV4cGFuZGVkO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG5nQWNjZXB0SW5wdXRUeXBlX2V4cGFuZGVkOiBCb29sZWFuSW5wdXQ7XG4gIHN0YXRpYyBuZ0FjY2VwdElucHV0VHlwZV9kaXNhYmxlZDogQm9vbGVhbklucHV0O1xufVxuIl19