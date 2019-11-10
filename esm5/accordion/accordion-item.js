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
var nextId = 0;
var ɵ0 = undefined;
/**
 * An basic directive expected to be extended and decorated as a component.  Sets up all
 * events and attributes needed to be managed by a CdkAccordion parent.
 */
var CdkAccordionItem = /** @class */ (function () {
    function CdkAccordionItem(accordion, _changeDetectorRef, _expansionDispatcher) {
        var _this = this;
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
        this.id = "cdk-accordion-child-" + nextId++;
        this._expanded = false;
        this._disabled = false;
        /** Unregister function for _expansionDispatcher. */
        this._removeUniqueSelectionListener = function () { };
        this._removeUniqueSelectionListener =
            _expansionDispatcher.listen(function (id, accordionId) {
                if (_this.accordion && !_this.accordion.multi &&
                    _this.accordion.id === accordionId && _this.id !== id) {
                    _this.expanded = false;
                }
            });
        // When an accordion item is hosted in an accordion, subscribe to open/close events.
        if (this.accordion) {
            this._openCloseAllSubscription = this._subscribeToOpenCloseAllActions();
        }
    }
    Object.defineProperty(CdkAccordionItem.prototype, "expanded", {
        /** Whether the AccordionItem is expanded. */
        get: function () { return this._expanded; },
        set: function (expanded) {
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
                    var accordionId = this.accordion ? this.accordion.id : this.id;
                    this._expansionDispatcher.notify(this.id, accordionId);
                }
                else {
                    this.closed.emit();
                }
                // Ensures that the animation will run when the value is set outside of an `@Input`.
                // This includes cases like the open, close and toggle methods.
                this._changeDetectorRef.markForCheck();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CdkAccordionItem.prototype, "disabled", {
        /** Whether the AccordionItem is disabled. */
        get: function () { return this._disabled; },
        set: function (disabled) { this._disabled = coerceBooleanProperty(disabled); },
        enumerable: true,
        configurable: true
    });
    /** Emits an event for the accordion item being destroyed. */
    CdkAccordionItem.prototype.ngOnDestroy = function () {
        this.opened.complete();
        this.closed.complete();
        this.destroyed.emit();
        this.destroyed.complete();
        this._removeUniqueSelectionListener();
        this._openCloseAllSubscription.unsubscribe();
    };
    /** Toggles the expanded state of the accordion item. */
    CdkAccordionItem.prototype.toggle = function () {
        if (!this.disabled) {
            this.expanded = !this.expanded;
        }
    };
    /** Sets the expanded state of the accordion item to false. */
    CdkAccordionItem.prototype.close = function () {
        if (!this.disabled) {
            this.expanded = false;
        }
    };
    /** Sets the expanded state of the accordion item to true. */
    CdkAccordionItem.prototype.open = function () {
        if (!this.disabled) {
            this.expanded = true;
        }
    };
    CdkAccordionItem.prototype._subscribeToOpenCloseAllActions = function () {
        var _this = this;
        return this.accordion._openCloseAllActions.subscribe(function (expanded) {
            // Only change expanded state if item is enabled
            if (!_this.disabled) {
                _this.expanded = expanded;
            }
        });
    };
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
    CdkAccordionItem.ctorParameters = function () { return [
        { type: CdkAccordion, decorators: [{ type: Optional }, { type: SkipSelf }] },
        { type: ChangeDetectorRef },
        { type: UniqueSelectionDispatcher }
    ]; };
    CdkAccordionItem.propDecorators = {
        closed: [{ type: Output }],
        opened: [{ type: Output }],
        destroyed: [{ type: Output }],
        expandedChange: [{ type: Output }],
        expanded: [{ type: Input }],
        disabled: [{ type: Input }]
    };
    return CdkAccordionItem;
}());
export { CdkAccordionItem };
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3JkaW9uLWl0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2FjY29yZGlvbi9hY2NvcmRpb24taXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsTUFBTSxFQUNOLFNBQVMsRUFDVCxZQUFZLEVBQ1osS0FBSyxFQUVMLFFBQVEsRUFDUixpQkFBaUIsRUFDakIsUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDekMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVsQywwREFBMEQ7QUFDMUQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBWXVCLFNBQVM7QUFWL0M7OztHQUdHO0FBQ0g7SUFvRUUsMEJBQTJDLFNBQXVCLEVBQzlDLGtCQUFxQyxFQUNuQyxvQkFBK0M7UUFGckUsaUJBZUM7UUFmMEMsY0FBUyxHQUFULFNBQVMsQ0FBYztRQUM5Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW1CO1FBQ25DLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7UUE1RHJFLCtDQUErQztRQUN2Qyw4QkFBeUIsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQ3ZELDREQUE0RDtRQUNsRCxXQUFNLEdBQXVCLElBQUksWUFBWSxFQUFRLENBQUM7UUFDaEUsNERBQTREO1FBQ2xELFdBQU0sR0FBdUIsSUFBSSxZQUFZLEVBQVEsQ0FBQztRQUNoRSx5REFBeUQ7UUFDL0MsY0FBUyxHQUF1QixJQUFJLFlBQVksRUFBUSxDQUFDO1FBRW5FOzs7O1dBSUc7UUFDTyxtQkFBYyxHQUEw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SUFBSSxDQUFDLFFBQVEsQ0FBQztTQUNoQztJQUNILENBQUM7SUFFRCw4REFBOEQ7SUFDOUQsZ0NBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztJQUVELDZEQUE2RDtJQUM3RCwrQkFBSSxHQUFKO1FBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDdEI7SUFDSCxDQUFDO0lBRU8sMERBQStCLEdBQXZDO1FBQUEsaUJBT0M7UUFOQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLFVBQUEsUUFBUTtZQUMzRCxnREFBZ0Q7WUFDaEQsSUFBSSxDQUFDLEtBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xCLEtBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2FBQzFCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDOztnQkEzSEYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSx3Q0FBd0M7b0JBQ2xELFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFNBQVMsRUFBRTt3QkFDVCx1RkFBdUY7d0JBQ3ZGLHlCQUF5Qjt3QkFDekIsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsSUFBVyxFQUFDO3FCQUM3QztpQkFDRjs7OztnQkFuQk8sWUFBWSx1QkErRUwsUUFBUSxZQUFJLFFBQVE7Z0JBbkZqQyxpQkFBaUI7Z0JBR1gseUJBQXlCOzs7eUJBeUI5QixNQUFNO3lCQUVOLE1BQU07NEJBRU4sTUFBTTtpQ0FPTixNQUFNOzJCQU1OLEtBQUs7MkJBOEJMLEtBQUs7O0lBbUVSLHVCQUFDO0NBQUEsQUEvSEQsSUErSEM7U0F0SFksZ0JBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIE91dHB1dCxcbiAgRGlyZWN0aXZlLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgU2tpcFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtVbmlxdWVTZWxlY3Rpb25EaXNwYXRjaGVyfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtDZGtBY2NvcmRpb259IGZyb20gJy4vYWNjb3JkaW9uJztcbmltcG9ydCB7Y29lcmNlQm9vbGVhblByb3BlcnR5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG4vKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSUQgZm9yIGVhY2ggYWNjb3JkaW9uIGl0ZW0uICovXG5sZXQgbmV4dElkID0gMDtcblxuLyoqXG4gKiBBbiBiYXNpYyBkaXJlY3RpdmUgZXhwZWN0ZWQgdG8gYmUgZXh0ZW5kZWQgYW5kIGRlY29yYXRlZCBhcyBhIGNvbXBvbmVudC4gIFNldHMgdXAgYWxsXG4gKiBldmVudHMgYW5kIGF0dHJpYnV0ZXMgbmVlZGVkIHRvIGJlIG1hbmFnZWQgYnkgYSBDZGtBY2NvcmRpb24gcGFyZW50LlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdjZGstYWNjb3JkaW9uLWl0ZW0sIFtjZGtBY2NvcmRpb25JdGVtXScsXG4gIGV4cG9ydEFzOiAnY2RrQWNjb3JkaW9uSXRlbScsXG4gIHByb3ZpZGVyczogW1xuICAgIC8vIFByb3ZpZGUgQ2RrQWNjb3JkaW9uIGFzIHVuZGVmaW5lZCB0byBwcmV2ZW50IG5lc3RlZCBhY2NvcmRpb24gaXRlbXMgZnJvbSByZWdpc3RlcmluZ1xuICAgIC8vIHRvIHRoZSBzYW1lIGFjY29yZGlvbi5cbiAgICB7cHJvdmlkZTogQ2RrQWNjb3JkaW9uLCB1c2VWYWx1ZTogdW5kZWZpbmVkfSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQWNjb3JkaW9uSXRlbSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBTdWJzY3JpcHRpb24gdG8gb3BlbkFsbC9jbG9zZUFsbCBldmVudHMuICovXG4gIHByaXZhdGUgX29wZW5DbG9zZUFsbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgLyoqIEV2ZW50IGVtaXR0ZWQgZXZlcnkgdGltZSB0aGUgQWNjb3JkaW9uSXRlbSBpcyBjbG9zZWQuICovXG4gIEBPdXRwdXQoKSBjbG9zZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcbiAgLyoqIEV2ZW50IGVtaXR0ZWQgZXZlcnkgdGltZSB0aGUgQWNjb3JkaW9uSXRlbSBpcyBvcGVuZWQuICovXG4gIEBPdXRwdXQoKSBvcGVuZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgQWNjb3JkaW9uSXRlbSBpcyBkZXN0cm95ZWQuICovXG4gIEBPdXRwdXQoKSBkZXN0cm95ZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuICAvKipcbiAgICogRW1pdHMgd2hlbmV2ZXIgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gY2hhbmdlcy5cbiAgICogUHJpbWFyaWx5IHVzZWQgdG8gZmFjaWxpdGF0ZSB0d28td2F5IGJpbmRpbmcuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIEBPdXRwdXQoKSBleHBhbmRlZENoYW5nZTogRXZlbnRFbWl0dGVyPGJvb2xlYW4+ID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPigpO1xuXG4gIC8qKiBUaGUgdW5pcXVlIEFjY29yZGlvbkl0ZW0gaWQuICovXG4gIHJlYWRvbmx5IGlkOiBzdHJpbmcgPSBgY2RrLWFjY29yZGlvbi1jaGlsZC0ke25leHRJZCsrfWA7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIEFjY29yZGlvbkl0ZW0gaXMgZXhwYW5kZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBleHBhbmRlZCgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZXhwYW5kZWQ7IH1cbiAgc2V0IGV4cGFuZGVkKGV4cGFuZGVkOiBhbnkpIHtcbiAgICBleHBhbmRlZCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eShleHBhbmRlZCk7XG5cbiAgICAvLyBPbmx5IGVtaXQgZXZlbnRzIGFuZCB1cGRhdGUgdGhlIGludGVybmFsIHZhbHVlIGlmIHRoZSB2YWx1ZSBjaGFuZ2VzLlxuICAgIGlmICh0aGlzLl9leHBhbmRlZCAhPT0gZXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuX2V4cGFuZGVkID0gZXhwYW5kZWQ7XG4gICAgICB0aGlzLmV4cGFuZGVkQ2hhbmdlLmVtaXQoZXhwYW5kZWQpO1xuXG4gICAgICBpZiAoZXhwYW5kZWQpIHtcbiAgICAgICAgdGhpcy5vcGVuZWQuZW1pdCgpO1xuICAgICAgICAvKipcbiAgICAgICAgICogSW4gdGhlIHVuaXF1ZSBzZWxlY3Rpb24gZGlzcGF0Y2hlciwgdGhlIGlkIHBhcmFtZXRlciBpcyB0aGUgaWQgb2YgdGhlIENka0FjY29yZGlvbkl0ZW0sXG4gICAgICAgICAqIHRoZSBuYW1lIHZhbHVlIGlzIHRoZSBpZCBvZiB0aGUgYWNjb3JkaW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgYWNjb3JkaW9uSWQgPSB0aGlzLmFjY29yZGlvbiA/IHRoaXMuYWNjb3JkaW9uLmlkIDogdGhpcy5pZDtcbiAgICAgICAgdGhpcy5fZXhwYW5zaW9uRGlzcGF0Y2hlci5ub3RpZnkodGhpcy5pZCwgYWNjb3JkaW9uSWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jbG9zZWQuZW1pdCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBFbnN1cmVzIHRoYXQgdGhlIGFuaW1hdGlvbiB3aWxsIHJ1biB3aGVuIHRoZSB2YWx1ZSBpcyBzZXQgb3V0c2lkZSBvZiBhbiBgQElucHV0YC5cbiAgICAgIC8vIFRoaXMgaW5jbHVkZXMgY2FzZXMgbGlrZSB0aGUgb3BlbiwgY2xvc2UgYW5kIHRvZ2dsZSBtZXRob2RzLlxuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2V4cGFuZGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIEFjY29yZGlvbkl0ZW0gaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBkaXNhYmxlZCgpIHsgcmV0dXJuIHRoaXMuX2Rpc2FibGVkOyB9XG4gIHNldCBkaXNhYmxlZChkaXNhYmxlZDogYW55KSB7IHRoaXMuX2Rpc2FibGVkID0gY29lcmNlQm9vbGVhblByb3BlcnR5KGRpc2FibGVkKTsgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBVbnJlZ2lzdGVyIGZ1bmN0aW9uIGZvciBfZXhwYW5zaW9uRGlzcGF0Y2hlci4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlVW5pcXVlU2VsZWN0aW9uTGlzdGVuZXI6ICgpID0+IHZvaWQgPSAoKSA9PiB7fTtcblxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBAU2tpcFNlbGYoKSBwdWJsaWMgYWNjb3JkaW9uOiBDZGtBY2NvcmRpb24sXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICAgICAgICAgICAgcHJvdGVjdGVkIF9leHBhbnNpb25EaXNwYXRjaGVyOiBVbmlxdWVTZWxlY3Rpb25EaXNwYXRjaGVyKSB7XG4gICAgdGhpcy5fcmVtb3ZlVW5pcXVlU2VsZWN0aW9uTGlzdGVuZXIgPVxuICAgICAgX2V4cGFuc2lvbkRpc3BhdGNoZXIubGlzdGVuKChpZDogc3RyaW5nLCBhY2NvcmRpb25JZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmFjY29yZGlvbiAmJiAhdGhpcy5hY2NvcmRpb24ubXVsdGkgJiZcbiAgICAgICAgICAgIHRoaXMuYWNjb3JkaW9uLmlkID09PSBhY2NvcmRpb25JZCAmJiB0aGlzLmlkICE9PSBpZCkge1xuICAgICAgICAgIHRoaXMuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAvLyBXaGVuIGFuIGFjY29yZGlvbiBpdGVtIGlzIGhvc3RlZCBpbiBhbiBhY2NvcmRpb24sIHN1YnNjcmliZSB0byBvcGVuL2Nsb3NlIGV2ZW50cy5cbiAgICBpZiAodGhpcy5hY2NvcmRpb24pIHtcbiAgICAgIHRoaXMuX29wZW5DbG9zZUFsbFN1YnNjcmlwdGlvbiA9IHRoaXMuX3N1YnNjcmliZVRvT3BlbkNsb3NlQWxsQWN0aW9ucygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFbWl0cyBhbiBldmVudCBmb3IgdGhlIGFjY29yZGlvbiBpdGVtIGJlaW5nIGRlc3Ryb3llZC4gKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5vcGVuZWQuY29tcGxldGUoKTtcbiAgICB0aGlzLmNsb3NlZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmVtaXQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX3JlbW92ZVVuaXF1ZVNlbGVjdGlvbkxpc3RlbmVyKCk7XG4gICAgdGhpcy5fb3BlbkNsb3NlQWxsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogVG9nZ2xlcyB0aGUgZXhwYW5kZWQgc3RhdGUgb2YgdGhlIGFjY29yZGlvbiBpdGVtLiAqL1xuICB0b2dnbGUoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLmV4cGFuZGVkID0gIXRoaXMuZXhwYW5kZWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gaXRlbSB0byBmYWxzZS4gKi9cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLmV4cGFuZGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqIFNldHMgdGhlIGV4cGFuZGVkIHN0YXRlIG9mIHRoZSBhY2NvcmRpb24gaXRlbSB0byB0cnVlLiAqL1xuICBvcGVuKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5leHBhbmRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9PcGVuQ2xvc2VBbGxBY3Rpb25zKCk6IFN1YnNjcmlwdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuYWNjb3JkaW9uLl9vcGVuQ2xvc2VBbGxBY3Rpb25zLnN1YnNjcmliZShleHBhbmRlZCA9PiB7XG4gICAgICAvLyBPbmx5IGNoYW5nZSBleHBhbmRlZCBzdGF0ZSBpZiBpdGVtIGlzIGVuYWJsZWRcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLmV4cGFuZGVkID0gZXhwYW5kZWQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZXhwYW5kZWQ6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfZGlzYWJsZWQ6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xufVxuIl19