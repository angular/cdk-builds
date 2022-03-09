/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subject, merge, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { coerceCssPixelValue, coerceArray } from '@angular/cdk/coercion';
/**
 * Reference to an overlay that has been created with the Overlay service.
 * Used to manipulate or dispose of said overlay.
 */
export class OverlayRef {
    constructor(_portalOutlet, _host, _pane, _config, _ngZone, _keyboardDispatcher, _document, _location, _outsideClickDispatcher) {
        this._portalOutlet = _portalOutlet;
        this._host = _host;
        this._pane = _pane;
        this._config = _config;
        this._ngZone = _ngZone;
        this._keyboardDispatcher = _keyboardDispatcher;
        this._document = _document;
        this._location = _location;
        this._outsideClickDispatcher = _outsideClickDispatcher;
        this._backdropElement = null;
        this._backdropClick = new Subject();
        this._attachments = new Subject();
        this._detachments = new Subject();
        this._locationChanges = Subscription.EMPTY;
        this._backdropClickHandler = (event) => this._backdropClick.next(event);
        this._backdropTransitionendHandler = (event) => {
            this._disposeBackdrop(event.target);
        };
        /** Stream of keydown events dispatched to this overlay. */
        this._keydownEvents = new Subject();
        /** Stream of mouse outside events dispatched to this overlay. */
        this._outsidePointerEvents = new Subject();
        if (_config.scrollStrategy) {
            this._scrollStrategy = _config.scrollStrategy;
            this._scrollStrategy.attach(this);
        }
        this._positionStrategy = _config.positionStrategy;
    }
    /** The overlay's HTML element */
    get overlayElement() {
        return this._pane;
    }
    /** The overlay's backdrop HTML element. */
    get backdropElement() {
        return this._backdropElement;
    }
    /**
     * Wrapper around the panel element. Can be used for advanced
     * positioning where a wrapper with specific styling is
     * required around the overlay pane.
     */
    get hostElement() {
        return this._host;
    }
    /**
     * Attaches content, given via a Portal, to the overlay.
     * If the overlay is configured to have a backdrop, it will be created.
     *
     * @param portal Portal instance to which to attach the overlay.
     * @returns The portal attachment result.
     */
    attach(portal) {
        let attachResult = this._portalOutlet.attach(portal);
        // Update the pane element with the given configuration.
        if (!this._host.parentElement && this._previousHostParent) {
            this._previousHostParent.appendChild(this._host);
        }
        if (this._positionStrategy) {
            this._positionStrategy.attach(this);
        }
        this._updateStackingOrder();
        this._updateElementSize();
        this._updateElementDirection();
        if (this._scrollStrategy) {
            this._scrollStrategy.enable();
        }
        // Update the position once the zone is stable so that the overlay will be fully rendered
        // before attempting to position it, as the position may depend on the size of the rendered
        // content.
        this._ngZone.onStable.pipe(take(1)).subscribe(() => {
            // The overlay could've been detached before the zone has stabilized.
            if (this.hasAttached()) {
                this.updatePosition();
            }
        });
        // Enable pointer events for the overlay pane element.
        this._togglePointerEvents(true);
        if (this._config.hasBackdrop) {
            this._attachBackdrop();
        }
        if (this._config.panelClass) {
            this._toggleClasses(this._pane, this._config.panelClass, true);
        }
        // Only emit the `attachments` event once all other setup is done.
        this._attachments.next();
        // Track this overlay by the keyboard dispatcher
        this._keyboardDispatcher.add(this);
        if (this._config.disposeOnNavigation) {
            this._locationChanges = this._location.subscribe(() => this.dispose());
        }
        this._outsideClickDispatcher.add(this);
        return attachResult;
    }
    /**
     * Detaches an overlay from a portal.
     * @returns The portal detachment result.
     */
    detach() {
        if (!this.hasAttached()) {
            return;
        }
        this.detachBackdrop();
        // When the overlay is detached, the pane element should disable pointer events.
        // This is necessary because otherwise the pane element will cover the page and disable
        // pointer events therefore. Depends on the position strategy and the applied pane boundaries.
        this._togglePointerEvents(false);
        if (this._positionStrategy && this._positionStrategy.detach) {
            this._positionStrategy.detach();
        }
        if (this._scrollStrategy) {
            this._scrollStrategy.disable();
        }
        const detachmentResult = this._portalOutlet.detach();
        // Only emit after everything is detached.
        this._detachments.next();
        // Remove this overlay from keyboard dispatcher tracking.
        this._keyboardDispatcher.remove(this);
        // Keeping the host element in the DOM can cause scroll jank, because it still gets
        // rendered, even though it's transparent and unclickable which is why we remove it.
        this._detachContentWhenStable();
        this._locationChanges.unsubscribe();
        this._outsideClickDispatcher.remove(this);
        return detachmentResult;
    }
    /** Cleans up the overlay from the DOM. */
    dispose() {
        const isAttached = this.hasAttached();
        if (this._positionStrategy) {
            this._positionStrategy.dispose();
        }
        this._disposeScrollStrategy();
        this._disposeBackdrop(this._backdropElement);
        this._locationChanges.unsubscribe();
        this._keyboardDispatcher.remove(this);
        this._portalOutlet.dispose();
        this._attachments.complete();
        this._backdropClick.complete();
        this._keydownEvents.complete();
        this._outsidePointerEvents.complete();
        this._outsideClickDispatcher.remove(this);
        this._host?.remove();
        this._previousHostParent = this._pane = this._host = null;
        if (isAttached) {
            this._detachments.next();
        }
        this._detachments.complete();
    }
    /** Whether the overlay has attached content. */
    hasAttached() {
        return this._portalOutlet.hasAttached();
    }
    /** Gets an observable that emits when the backdrop has been clicked. */
    backdropClick() {
        return this._backdropClick;
    }
    /** Gets an observable that emits when the overlay has been attached. */
    attachments() {
        return this._attachments;
    }
    /** Gets an observable that emits when the overlay has been detached. */
    detachments() {
        return this._detachments;
    }
    /** Gets an observable of keydown events targeted to this overlay. */
    keydownEvents() {
        return this._keydownEvents;
    }
    /** Gets an observable of pointer events targeted outside this overlay. */
    outsidePointerEvents() {
        return this._outsidePointerEvents;
    }
    /** Gets the current overlay configuration, which is immutable. */
    getConfig() {
        return this._config;
    }
    /** Updates the position of the overlay based on the position strategy. */
    updatePosition() {
        if (this._positionStrategy) {
            this._positionStrategy.apply();
        }
    }
    /** Switches to a new position strategy and updates the overlay position. */
    updatePositionStrategy(strategy) {
        if (strategy === this._positionStrategy) {
            return;
        }
        if (this._positionStrategy) {
            this._positionStrategy.dispose();
        }
        this._positionStrategy = strategy;
        if (this.hasAttached()) {
            strategy.attach(this);
            this.updatePosition();
        }
    }
    /** Update the size properties of the overlay. */
    updateSize(sizeConfig) {
        this._config = { ...this._config, ...sizeConfig };
        this._updateElementSize();
    }
    /** Sets the LTR/RTL direction for the overlay. */
    setDirection(dir) {
        this._config = { ...this._config, direction: dir };
        this._updateElementDirection();
    }
    /** Add a CSS class or an array of classes to the overlay pane. */
    addPanelClass(classes) {
        if (this._pane) {
            this._toggleClasses(this._pane, classes, true);
        }
    }
    /** Remove a CSS class or an array of classes from the overlay pane. */
    removePanelClass(classes) {
        if (this._pane) {
            this._toggleClasses(this._pane, classes, false);
        }
    }
    /**
     * Returns the layout direction of the overlay panel.
     */
    getDirection() {
        const direction = this._config.direction;
        if (!direction) {
            return 'ltr';
        }
        return typeof direction === 'string' ? direction : direction.value;
    }
    /** Switches to a new scroll strategy. */
    updateScrollStrategy(strategy) {
        if (strategy === this._scrollStrategy) {
            return;
        }
        this._disposeScrollStrategy();
        this._scrollStrategy = strategy;
        if (this.hasAttached()) {
            strategy.attach(this);
            strategy.enable();
        }
    }
    /** Updates the text direction of the overlay panel. */
    _updateElementDirection() {
        this._host.setAttribute('dir', this.getDirection());
    }
    /** Updates the size of the overlay element based on the overlay config. */
    _updateElementSize() {
        if (!this._pane) {
            return;
        }
        const style = this._pane.style;
        style.width = coerceCssPixelValue(this._config.width);
        style.height = coerceCssPixelValue(this._config.height);
        style.minWidth = coerceCssPixelValue(this._config.minWidth);
        style.minHeight = coerceCssPixelValue(this._config.minHeight);
        style.maxWidth = coerceCssPixelValue(this._config.maxWidth);
        style.maxHeight = coerceCssPixelValue(this._config.maxHeight);
    }
    /** Toggles the pointer events for the overlay pane element. */
    _togglePointerEvents(enablePointer) {
        this._pane.style.pointerEvents = enablePointer ? '' : 'none';
    }
    /** Attaches a backdrop for this overlay. */
    _attachBackdrop() {
        const showingClass = 'cdk-overlay-backdrop-showing';
        this._backdropElement = this._document.createElement('div');
        this._backdropElement.classList.add('cdk-overlay-backdrop');
        if (this._config.backdropClass) {
            this._toggleClasses(this._backdropElement, this._config.backdropClass, true);
        }
        // Insert the backdrop before the pane in the DOM order,
        // in order to handle stacked overlays properly.
        this._host.parentElement.insertBefore(this._backdropElement, this._host);
        // Forward backdrop clicks such that the consumer of the overlay can perform whatever
        // action desired when such a click occurs (usually closing the overlay).
        this._backdropElement.addEventListener('click', this._backdropClickHandler);
        // Add class to fade-in the backdrop after one frame.
        if (typeof requestAnimationFrame !== 'undefined') {
            this._ngZone.runOutsideAngular(() => {
                requestAnimationFrame(() => {
                    if (this._backdropElement) {
                        this._backdropElement.classList.add(showingClass);
                    }
                });
            });
        }
        else {
            this._backdropElement.classList.add(showingClass);
        }
    }
    /**
     * Updates the stacking order of the element, moving it to the top if necessary.
     * This is required in cases where one overlay was detached, while another one,
     * that should be behind it, was destroyed. The next time both of them are opened,
     * the stacking will be wrong, because the detached element's pane will still be
     * in its original DOM position.
     */
    _updateStackingOrder() {
        if (this._host.nextSibling) {
            this._host.parentNode.appendChild(this._host);
        }
    }
    /** Detaches the backdrop (if any) associated with the overlay. */
    detachBackdrop() {
        const backdropToDetach = this._backdropElement;
        if (!backdropToDetach) {
            return;
        }
        backdropToDetach.classList.remove('cdk-overlay-backdrop-showing');
        this._ngZone.runOutsideAngular(() => {
            backdropToDetach.addEventListener('transitionend', this._backdropTransitionendHandler);
        });
        // If the backdrop doesn't have a transition, the `transitionend` event won't fire.
        // In this case we make it unclickable and we try to remove it after a delay.
        backdropToDetach.style.pointerEvents = 'none';
        // Run this outside the Angular zone because there's nothing that Angular cares about.
        // If it were to run inside the Angular zone, every test that used Overlay would have to be
        // either async or fakeAsync.
        this._backdropTimeout = this._ngZone.runOutsideAngular(() => setTimeout(() => {
            console.log('fallback');
            this._disposeBackdrop(backdropToDetach);
        }, 500));
    }
    /** Toggles a single CSS class or an array of classes on an element. */
    _toggleClasses(element, cssClasses, isAdd) {
        const classes = coerceArray(cssClasses || []).filter(c => !!c);
        if (classes.length) {
            isAdd ? element.classList.add(...classes) : element.classList.remove(...classes);
        }
    }
    /** Detaches the overlay content next time the zone stabilizes. */
    _detachContentWhenStable() {
        // Normally we wouldn't have to explicitly run this outside the `NgZone`, however
        // if the consumer is using `zone-patch-rxjs`, the `Subscription.unsubscribe` call will
        // be patched to run inside the zone, which will throw us into an infinite loop.
        this._ngZone.runOutsideAngular(() => {
            // We can't remove the host here immediately, because the overlay pane's content
            // might still be animating. This stream helps us avoid interrupting the animation
            // by waiting for the pane to become empty.
            const subscription = this._ngZone.onStable
                .pipe(takeUntil(merge(this._attachments, this._detachments)))
                .subscribe(() => {
                // Needs a couple of checks for the pane and host, because
                // they may have been removed by the time the zone stabilizes.
                if (!this._pane || !this._host || this._pane.children.length === 0) {
                    if (this._pane && this._config.panelClass) {
                        this._toggleClasses(this._pane, this._config.panelClass, false);
                    }
                    if (this._host && this._host.parentElement) {
                        this._previousHostParent = this._host.parentElement;
                        this._host.remove();
                    }
                    subscription.unsubscribe();
                }
            });
        });
    }
    /** Disposes of a scroll strategy. */
    _disposeScrollStrategy() {
        const scrollStrategy = this._scrollStrategy;
        if (scrollStrategy) {
            scrollStrategy.disable();
            if (scrollStrategy.detach) {
                scrollStrategy.detach();
            }
        }
    }
    /** Removes a backdrop element from the DOM. */
    _disposeBackdrop(backdrop) {
        if (backdrop) {
            backdrop.removeEventListener('click', this._backdropClickHandler);
            backdrop.removeEventListener('transitionend', this._backdropTransitionendHandler);
            backdrop.remove();
            // It is possible that a new portal has been attached to this overlay since we started
            // removing the backdrop. If that is the case, only clear the backdrop reference if it
            // is still the same instance that we started to remove.
            if (this._backdropElement === backdrop) {
                this._backdropElement = null;
            }
        }
        if (this._backdropTimeout) {
            clearTimeout(this._backdropTimeout);
            this._backdropTimeout = undefined;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBTUgsT0FBTyxFQUFhLE9BQU8sRUFBRSxLQUFLLEVBQW9CLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoRixPQUFPLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSS9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQVV2RTs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sVUFBVTtJQTBCckIsWUFDVSxhQUEyQixFQUMzQixLQUFrQixFQUNsQixLQUFrQixFQUNsQixPQUF1QyxFQUN2QyxPQUFlLEVBQ2YsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLFNBQW1CLEVBQ25CLHVCQUFzRDtRQVJ0RCxrQkFBYSxHQUFiLGFBQWEsQ0FBYztRQUMzQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBQ2xCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0M7UUFDdkMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMkI7UUFDOUMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBK0I7UUFsQ3hELHFCQUFnQixHQUF1QixJQUFJLENBQUM7UUFFbkMsbUJBQWMsR0FBRyxJQUFJLE9BQU8sRUFBYyxDQUFDO1FBQzNDLGlCQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUNuQyxpQkFBWSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFHNUMscUJBQWdCLEdBQXFCLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFD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c0Y7WUFDdEYsd0RBQXdEO1lBQ3hELElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLFFBQVEsRUFBRTtnQkFDdEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQzthQUM5QjtTQUNGO1FBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDekIsWUFBWSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7U0FDbkM7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0NvbXBvbmVudFBvcnRhbCwgUG9ydGFsLCBQb3J0YWxPdXRsZXQsIFRlbXBsYXRlUG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7Q29tcG9uZW50UmVmLCBFbWJlZGRlZFZpZXdSZWYsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0xvY2F0aW9ufSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBtZXJnZSwgU3Vic2NyaXB0aW9uTGlrZSwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZSwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge092ZXJsYXlLZXlib2FyZERpc3BhdGNoZXJ9IGZyb20gJy4vZGlzcGF0Y2hlcnMvb3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheU91dHNpZGVDbGlja0Rpc3BhdGNoZXJ9IGZyb20gJy4vZGlzcGF0Y2hlcnMvb3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtPdmVybGF5Q29uZmlnfSBmcm9tICcuL292ZXJsYXktY29uZmlnJztcbmltcG9ydCB7Y29lcmNlQ3NzUGl4ZWxWYWx1ZSwgY29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4vb3ZlcmxheS1yZWZlcmVuY2UnO1xuaW1wb3J0IHtQb3NpdGlvblN0cmF0ZWd5fSBmcm9tICcuL3Bvc2l0aW9uL3Bvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7U2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vc2Nyb2xsJztcblxuLyoqIEFuIG9iamVjdCB3aGVyZSBhbGwgb2YgaXRzIHByb3BlcnRpZXMgY2Fubm90IGJlIHdyaXR0ZW4uICovXG5leHBvcnQgdHlwZSBJbW11dGFibGVPYmplY3Q8VD4gPSB7XG4gIHJlYWRvbmx5IFtQIGluIGtleW9mIFRdOiBUW1BdO1xufTtcblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYW4gb3ZlcmxheSB0aGF0IGhhcyBiZWVuIGNyZWF0ZWQgd2l0aCB0aGUgT3ZlcmxheSBzZXJ2aWNlLlxuICogVXNlZCB0byBtYW5pcHVsYXRlIG9yIGRpc3Bvc2Ugb2Ygc2FpZCBvdmVybGF5LlxuICovXG5leHBvcnQgY2xhc3MgT3ZlcmxheVJlZiBpbXBsZW1lbnRzIFBvcnRhbE91dGxldCwgT3ZlcmxheVJlZmVyZW5jZSB7XG4gIHByaXZhdGUgX2JhY2tkcm9wRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BUaW1lb3V0OiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2JhY2tkcm9wQ2xpY2sgPSBuZXcgU3ViamVjdDxNb3VzZUV2ZW50PigpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9hdHRhY2htZW50cyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RldGFjaG1lbnRzID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSBfcG9zaXRpb25TdHJhdGVneTogUG9zaXRpb25TdHJhdGVneSB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfc2Nyb2xsU3RyYXRlZ3k6IFNjcm9sbFN0cmF0ZWd5IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9sb2NhdGlvbkNoYW5nZXM6IFN1YnNjcmlwdGlvbkxpa2UgPSBTdWJzY3JpcHRpb24uRU1QVFk7XG4gIHByaXZhdGUgX2JhY2tkcm9wQ2xpY2tIYW5kbGVyID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB0aGlzLl9iYWNrZHJvcENsaWNrLm5leHQoZXZlbnQpO1xuICBwcml2YXRlIF9iYWNrZHJvcFRyYW5zaXRpb25lbmRIYW5kbGVyID0gKGV2ZW50OiBUcmFuc2l0aW9uRXZlbnQpID0+IHtcbiAgICB0aGlzLl9kaXNwb3NlQmFja2Ryb3AoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlZmVyZW5jZSB0byB0aGUgcGFyZW50IG9mIHRoZSBgX2hvc3RgIGF0IHRoZSB0aW1lIGl0IHdhcyBkZXRhY2hlZC4gVXNlZCB0byByZXN0b3JlXG4gICAqIHRoZSBgX2hvc3RgIHRvIGl0cyBvcmlnaW5hbCBwb3NpdGlvbiBpbiB0aGUgRE9NIHdoZW4gaXQgZ2V0cyByZS1hdHRhY2hlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzSG9zdFBhcmVudDogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqIFN0cmVhbSBvZiBrZXlkb3duIGV2ZW50cyBkaXNwYXRjaGVkIHRvIHRoaXMgb3ZlcmxheS4gKi9cbiAgcmVhZG9ubHkgX2tleWRvd25FdmVudHMgPSBuZXcgU3ViamVjdDxLZXlib2FyZEV2ZW50PigpO1xuXG4gIC8qKiBTdHJlYW0gb2YgbW91c2Ugb3V0c2lkZSBldmVudHMgZGlzcGF0Y2hlZCB0byB0aGlzIG92ZXJsYXkuICovXG4gIHJlYWRvbmx5IF9vdXRzaWRlUG9pbnRlckV2ZW50cyA9IG5ldyBTdWJqZWN0PE1vdXNlRXZlbnQ+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfcG9ydGFsT3V0bGV0OiBQb3J0YWxPdXRsZXQsXG4gICAgcHJpdmF0ZSBfaG9zdDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfcGFuZTogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBfY29uZmlnOiBJbW11dGFibGVPYmplY3Q8T3ZlcmxheUNvbmZpZz4sXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBfa2V5Ym9hcmREaXNwYXRjaGVyOiBPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyLFxuICAgIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudCxcbiAgICBwcml2YXRlIF9sb2NhdGlvbjogTG9jYXRpb24sXG4gICAgcHJpdmF0ZSBfb3V0c2lkZUNsaWNrRGlzcGF0Y2hlcjogT3ZlcmxheU91dHNpZGVDbGlja0Rpc3BhdGNoZXIsXG4gICkge1xuICAgIGlmIChfY29uZmlnLnNjcm9sbFN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneSA9IF9jb25maWcuc2Nyb2xsU3RyYXRlZ3k7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneSA9IF9jb25maWcucG9zaXRpb25TdHJhdGVneTtcbiAgfVxuXG4gIC8qKiBUaGUgb3ZlcmxheSdzIEhUTUwgZWxlbWVudCAqL1xuICBnZXQgb3ZlcmxheUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wYW5lO1xuICB9XG5cbiAgLyoqIFRoZSBvdmVybGF5J3MgYmFja2Ryb3AgSFRNTCBlbGVtZW50LiAqL1xuICBnZXQgYmFja2Ryb3BFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tkcm9wRWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCB0aGUgcGFuZWwgZWxlbWVudC4gQ2FuIGJlIHVzZWQgZm9yIGFkdmFuY2VkXG4gICAqIHBvc2l0aW9uaW5nIHdoZXJlIGEgd3JhcHBlciB3aXRoIHNwZWNpZmljIHN0eWxpbmcgaXNcbiAgICogcmVxdWlyZWQgYXJvdW5kIHRoZSBvdmVybGF5IHBhbmUuXG4gICAqL1xuICBnZXQgaG9zdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9ob3N0O1xuICB9XG5cbiAgYXR0YWNoPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+O1xuICBhdHRhY2g8VD4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxUPik6IEVtYmVkZGVkVmlld1JlZjxUPjtcbiAgYXR0YWNoKHBvcnRhbDogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBjb250ZW50LCBnaXZlbiB2aWEgYSBQb3J0YWwsIHRvIHRoZSBvdmVybGF5LlxuICAgKiBJZiB0aGUgb3ZlcmxheSBpcyBjb25maWd1cmVkIHRvIGhhdmUgYSBiYWNrZHJvcCwgaXQgd2lsbCBiZSBjcmVhdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCBpbnN0YW5jZSB0byB3aGljaCB0byBhdHRhY2ggdGhlIG92ZXJsYXkuXG4gICAqIEByZXR1cm5zIFRoZSBwb3J0YWwgYXR0YWNobWVudCByZXN1bHQuXG4gICAqL1xuICBhdHRhY2gocG9ydGFsOiBQb3J0YWw8YW55Pik6IGFueSB7XG4gICAgbGV0IGF0dGFjaFJlc3VsdCA9IHRoaXMuX3BvcnRhbE91dGxldC5hdHRhY2gocG9ydGFsKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgcGFuZSBlbGVtZW50IHdpdGggdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb24uXG4gICAgaWYgKCF0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQgJiYgdGhpcy5fcHJldmlvdXNIb3N0UGFyZW50KSB7XG4gICAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQuYXBwZW5kQ2hpbGQodGhpcy5faG9zdCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZVN0YWNraW5nT3JkZXIoKTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50U2l6ZSgpO1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnREaXJlY3Rpb24oKTtcblxuICAgIGlmICh0aGlzLl9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuZW5hYmxlKCk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbiBvbmNlIHRoZSB6b25lIGlzIHN0YWJsZSBzbyB0aGF0IHRoZSBvdmVybGF5IHdpbGwgYmUgZnVsbHkgcmVuZGVyZWRcbiAgICAvLyBiZWZvcmUgYXR0ZW1wdGluZyB0byBwb3NpdGlvbiBpdCwgYXMgdGhlIHBvc2l0aW9uIG1heSBkZXBlbmQgb24gdGhlIHNpemUgb2YgdGhlIHJlbmRlcmVkXG4gICAgLy8gY29udGVudC5cbiAgICB0aGlzLl9uZ1pvbmUub25TdGFibGUucGlwZSh0YWtlKDEpKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgLy8gVGhlIG92ZXJsYXkgY291bGQndmUgYmVlbiBkZXRhY2hlZCBiZWZvcmUgdGhlIHpvbmUgaGFzIHN0YWJpbGl6ZWQuXG4gICAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEVuYWJsZSBwb2ludGVyIGV2ZW50cyBmb3IgdGhlIG92ZXJsYXkgcGFuZSBlbGVtZW50LlxuICAgIHRoaXMuX3RvZ2dsZVBvaW50ZXJFdmVudHModHJ1ZSk7XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLmhhc0JhY2tkcm9wKSB7XG4gICAgICB0aGlzLl9hdHRhY2hCYWNrZHJvcCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jb25maWcucGFuZWxDbGFzcykge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCB0aGlzLl9jb25maWcucGFuZWxDbGFzcywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8gT25seSBlbWl0IHRoZSBgYXR0YWNobWVudHNgIGV2ZW50IG9uY2UgYWxsIG90aGVyIHNldHVwIGlzIGRvbmUuXG4gICAgdGhpcy5fYXR0YWNobWVudHMubmV4dCgpO1xuXG4gICAgLy8gVHJhY2sgdGhpcyBvdmVybGF5IGJ5IHRoZSBrZXlib2FyZCBkaXNwYXRjaGVyXG4gICAgdGhpcy5fa2V5Ym9hcmREaXNwYXRjaGVyLmFkZCh0aGlzKTtcblxuICAgIGlmICh0aGlzLl9jb25maWcuZGlzcG9zZU9uTmF2aWdhdGlvbikge1xuICAgICAgdGhpcy5fbG9jYXRpb25DaGFuZ2VzID0gdGhpcy5fbG9jYXRpb24uc3Vic2NyaWJlKCgpID0+IHRoaXMuZGlzcG9zZSgpKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyLmFkZCh0aGlzKTtcbiAgICByZXR1cm4gYXR0YWNoUmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGFuIG92ZXJsYXkgZnJvbSBhIHBvcnRhbC5cbiAgICogQHJldHVybnMgVGhlIHBvcnRhbCBkZXRhY2htZW50IHJlc3VsdC5cbiAgICovXG4gIGRldGFjaCgpOiBhbnkge1xuICAgIGlmICghdGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kZXRhY2hCYWNrZHJvcCgpO1xuXG4gICAgLy8gV2hlbiB0aGUgb3ZlcmxheSBpcyBkZXRhY2hlZCwgdGhlIHBhbmUgZWxlbWVudCBzaG91bGQgZGlzYWJsZSBwb2ludGVyIGV2ZW50cy5cbiAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIG90aGVyd2lzZSB0aGUgcGFuZSBlbGVtZW50IHdpbGwgY292ZXIgdGhlIHBhZ2UgYW5kIGRpc2FibGVcbiAgICAvLyBwb2ludGVyIGV2ZW50cyB0aGVyZWZvcmUuIERlcGVuZHMgb24gdGhlIHBvc2l0aW9uIHN0cmF0ZWd5IGFuZCB0aGUgYXBwbGllZCBwYW5lIGJvdW5kYXJpZXMuXG4gICAgdGhpcy5fdG9nZ2xlUG9pbnRlckV2ZW50cyhmYWxzZSk7XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSAmJiB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRldGFjaCkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5kZXRhY2goKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmRpc2FibGUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXRhY2htZW50UmVzdWx0ID0gdGhpcy5fcG9ydGFsT3V0bGV0LmRldGFjaCgpO1xuXG4gICAgLy8gT25seSBlbWl0IGFmdGVyIGV2ZXJ5dGhpbmcgaXMgZGV0YWNoZWQuXG4gICAgdGhpcy5fZGV0YWNobWVudHMubmV4dCgpO1xuXG4gICAgLy8gUmVtb3ZlIHRoaXMgb3ZlcmxheSBmcm9tIGtleWJvYXJkIGRpc3BhdGNoZXIgdHJhY2tpbmcuXG4gICAgdGhpcy5fa2V5Ym9hcmREaXNwYXRjaGVyLnJlbW92ZSh0aGlzKTtcblxuICAgIC8vIEtlZXBpbmcgdGhlIGhvc3QgZWxlbWVudCBpbiB0aGUgRE9NIGNhbiBjYXVzZSBzY3JvbGwgamFuaywgYmVjYXVzZSBpdCBzdGlsbCBnZXRzXG4gICAgLy8gcmVuZGVyZWQsIGV2ZW4gdGhvdWdoIGl0J3MgdHJhbnNwYXJlbnQgYW5kIHVuY2xpY2thYmxlIHdoaWNoIGlzIHdoeSB3ZSByZW1vdmUgaXQuXG4gICAgdGhpcy5fZGV0YWNoQ29udGVudFdoZW5TdGFibGUoKTtcbiAgICB0aGlzLl9sb2NhdGlvbkNoYW5nZXMudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyLnJlbW92ZSh0aGlzKTtcbiAgICByZXR1cm4gZGV0YWNobWVudFJlc3VsdDtcbiAgfVxuXG4gIC8qKiBDbGVhbnMgdXAgdGhlIG92ZXJsYXkgZnJvbSB0aGUgRE9NLiAqL1xuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGNvbnN0IGlzQXR0YWNoZWQgPSB0aGlzLmhhc0F0dGFjaGVkKCk7XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGlzcG9zZVNjcm9sbFN0cmF0ZWd5KCk7XG4gICAgdGhpcy5fZGlzcG9zZUJhY2tkcm9wKHRoaXMuX2JhY2tkcm9wRWxlbWVudCk7XG4gICAgdGhpcy5fbG9jYXRpb25DaGFuZ2VzLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fa2V5Ym9hcmREaXNwYXRjaGVyLnJlbW92ZSh0aGlzKTtcbiAgICB0aGlzLl9wb3J0YWxPdXRsZXQuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2F0dGFjaG1lbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYmFja2Ryb3BDbGljay5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2tleWRvd25FdmVudHMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9vdXRzaWRlUG9pbnRlckV2ZW50cy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX291dHNpZGVDbGlja0Rpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuX2hvc3Q/LnJlbW92ZSgpO1xuXG4gICAgdGhpcy5fcHJldmlvdXNIb3N0UGFyZW50ID0gdGhpcy5fcGFuZSA9IHRoaXMuX2hvc3QgPSBudWxsITtcblxuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICB0aGlzLl9kZXRhY2htZW50cy5uZXh0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGV0YWNobWVudHMuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGhhcyBhdHRhY2hlZCBjb250ZW50LiAqL1xuICBoYXNBdHRhY2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcG9ydGFsT3V0bGV0Lmhhc0F0dGFjaGVkKCk7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgYmFja2Ryb3AgaGFzIGJlZW4gY2xpY2tlZC4gKi9cbiAgYmFja2Ryb3BDbGljaygpOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fYmFja2Ryb3BDbGljaztcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGF0dGFjaGVkLiAqL1xuICBhdHRhY2htZW50cygpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNobWVudHM7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBkZXRhY2hlZC4gKi9cbiAgZGV0YWNobWVudHMoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RldGFjaG1lbnRzO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSBvZiBrZXlkb3duIGV2ZW50cyB0YXJnZXRlZCB0byB0aGlzIG92ZXJsYXkuICovXG4gIGtleWRvd25FdmVudHMoKTogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2tleWRvd25FdmVudHM7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIG9mIHBvaW50ZXIgZXZlbnRzIHRhcmdldGVkIG91dHNpZGUgdGhpcyBvdmVybGF5LiAqL1xuICBvdXRzaWRlUG9pbnRlckV2ZW50cygpOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fb3V0c2lkZVBvaW50ZXJFdmVudHM7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgY3VycmVudCBvdmVybGF5IGNvbmZpZ3VyYXRpb24sIHdoaWNoIGlzIGltbXV0YWJsZS4gKi9cbiAgZ2V0Q29uZmlnKCk6IE92ZXJsYXlDb25maWcge1xuICAgIHJldHVybiB0aGlzLl9jb25maWc7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgcG9zaXRpb24gb2YgdGhlIG92ZXJsYXkgYmFzZWQgb24gdGhlIHBvc2l0aW9uIHN0cmF0ZWd5LiAqL1xuICB1cGRhdGVQb3NpdGlvbigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5hcHBseSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTd2l0Y2hlcyB0byBhIG5ldyBwb3NpdGlvbiBzdHJhdGVneSBhbmQgdXBkYXRlcyB0aGUgb3ZlcmxheSBwb3NpdGlvbi4gKi9cbiAgdXBkYXRlUG9zaXRpb25TdHJhdGVneShzdHJhdGVneTogUG9zaXRpb25TdHJhdGVneSk6IHZvaWQge1xuICAgIGlmIChzdHJhdGVneSA9PT0gdGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5ID0gc3RyYXRlZ3k7XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICBzdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgc2l6ZSBwcm9wZXJ0aWVzIG9mIHRoZSBvdmVybGF5LiAqL1xuICB1cGRhdGVTaXplKHNpemVDb25maWc6IE92ZXJsYXlTaXplQ29uZmlnKTogdm9pZCB7XG4gICAgdGhpcy5fY29uZmlnID0gey4uLnRoaXMuX2NvbmZpZywgLi4uc2l6ZUNvbmZpZ307XG4gICAgdGhpcy5fdXBkYXRlRWxlbWVudFNpemUoKTtcbiAgfVxuXG4gIC8qKiBTZXRzIHRoZSBMVFIvUlRMIGRpcmVjdGlvbiBmb3IgdGhlIG92ZXJsYXkuICovXG4gIHNldERpcmVjdGlvbihkaXI6IERpcmVjdGlvbiB8IERpcmVjdGlvbmFsaXR5KTogdm9pZCB7XG4gICAgdGhpcy5fY29uZmlnID0gey4uLnRoaXMuX2NvbmZpZywgZGlyZWN0aW9uOiBkaXJ9O1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnREaXJlY3Rpb24oKTtcbiAgfVxuXG4gIC8qKiBBZGQgYSBDU1MgY2xhc3Mgb3IgYW4gYXJyYXkgb2YgY2xhc3NlcyB0byB0aGUgb3ZlcmxheSBwYW5lLiAqL1xuICBhZGRQYW5lbENsYXNzKGNsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fcGFuZSwgY2xhc3NlcywgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZSBhIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIGZyb20gdGhlIG92ZXJsYXkgcGFuZS4gKi9cbiAgcmVtb3ZlUGFuZWxDbGFzcyhjbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIGNsYXNzZXMsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGF5b3V0IGRpcmVjdGlvbiBvZiB0aGUgb3ZlcmxheSBwYW5lbC5cbiAgICovXG4gIGdldERpcmVjdGlvbigpOiBEaXJlY3Rpb24ge1xuICAgIGNvbnN0IGRpcmVjdGlvbiA9IHRoaXMuX2NvbmZpZy5kaXJlY3Rpb247XG5cbiAgICBpZiAoIWRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuICdsdHInO1xuICAgIH1cblxuICAgIHJldHVybiB0eXBlb2YgZGlyZWN0aW9uID09PSAnc3RyaW5nJyA/IGRpcmVjdGlvbiA6IGRpcmVjdGlvbi52YWx1ZTtcbiAgfVxuXG4gIC8qKiBTd2l0Y2hlcyB0byBhIG5ldyBzY3JvbGwgc3RyYXRlZ3kuICovXG4gIHVwZGF0ZVNjcm9sbFN0cmF0ZWd5KHN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneSk6IHZvaWQge1xuICAgIGlmIChzdHJhdGVneSA9PT0gdGhpcy5fc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9kaXNwb3NlU2Nyb2xsU3RyYXRlZ3koKTtcbiAgICB0aGlzLl9zY3JvbGxTdHJhdGVneSA9IHN0cmF0ZWd5O1xuXG4gICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgc3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuICAgICAgc3RyYXRlZ3kuZW5hYmxlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHRleHQgZGlyZWN0aW9uIG9mIHRoZSBvdmVybGF5IHBhbmVsLiAqL1xuICBwcml2YXRlIF91cGRhdGVFbGVtZW50RGlyZWN0aW9uKCkge1xuICAgIHRoaXMuX2hvc3Quc2V0QXR0cmlidXRlKCdkaXInLCB0aGlzLmdldERpcmVjdGlvbigpKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBzaXplIG9mIHRoZSBvdmVybGF5IGVsZW1lbnQgYmFzZWQgb24gdGhlIG92ZXJsYXkgY29uZmlnLiAqL1xuICBwcml2YXRlIF91cGRhdGVFbGVtZW50U2l6ZSgpIHtcbiAgICBpZiAoIXRoaXMuX3BhbmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdHlsZSA9IHRoaXMuX3BhbmUuc3R5bGU7XG5cbiAgICBzdHlsZS53aWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLndpZHRoKTtcbiAgICBzdHlsZS5oZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5oZWlnaHQpO1xuICAgIHN0eWxlLm1pbldpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcubWluV2lkdGgpO1xuICAgIHN0eWxlLm1pbkhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1pbkhlaWdodCk7XG4gICAgc3R5bGUubWF4V2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5tYXhXaWR0aCk7XG4gICAgc3R5bGUubWF4SGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcubWF4SGVpZ2h0KTtcbiAgfVxuXG4gIC8qKiBUb2dnbGVzIHRoZSBwb2ludGVyIGV2ZW50cyBmb3IgdGhlIG92ZXJsYXkgcGFuZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF90b2dnbGVQb2ludGVyRXZlbnRzKGVuYWJsZVBvaW50ZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9wYW5lLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBlbmFibGVQb2ludGVyID8gJycgOiAnbm9uZSc7XG4gIH1cblxuICAvKiogQXR0YWNoZXMgYSBiYWNrZHJvcCBmb3IgdGhpcyBvdmVybGF5LiAqL1xuICBwcml2YXRlIF9hdHRhY2hCYWNrZHJvcCgpIHtcbiAgICBjb25zdCBzaG93aW5nQ2xhc3MgPSAnY2RrLW92ZXJsYXktYmFja2Ryb3Atc2hvd2luZyc7XG5cbiAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY2RrLW92ZXJsYXktYmFja2Ryb3AnKTtcblxuICAgIGlmICh0aGlzLl9jb25maWcuYmFja2Ryb3BDbGFzcykge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9iYWNrZHJvcEVsZW1lbnQsIHRoaXMuX2NvbmZpZy5iYWNrZHJvcENsYXNzLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBJbnNlcnQgdGhlIGJhY2tkcm9wIGJlZm9yZSB0aGUgcGFuZSBpbiB0aGUgRE9NIG9yZGVyLFxuICAgIC8vIGluIG9yZGVyIHRvIGhhbmRsZSBzdGFja2VkIG92ZXJsYXlzIHByb3Blcmx5LlxuICAgIHRoaXMuX2hvc3QucGFyZW50RWxlbWVudCEuaW5zZXJ0QmVmb3JlKHRoaXMuX2JhY2tkcm9wRWxlbWVudCwgdGhpcy5faG9zdCk7XG5cbiAgICAvLyBGb3J3YXJkIGJhY2tkcm9wIGNsaWNrcyBzdWNoIHRoYXQgdGhlIGNvbnN1bWVyIG9mIHRoZSBvdmVybGF5IGNhbiBwZXJmb3JtIHdoYXRldmVyXG4gICAgLy8gYWN0aW9uIGRlc2lyZWQgd2hlbiBzdWNoIGEgY2xpY2sgb2NjdXJzICh1c3VhbGx5IGNsb3NpbmcgdGhlIG92ZXJsYXkpLlxuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2JhY2tkcm9wQ2xpY2tIYW5kbGVyKTtcblxuICAgIC8vIEFkZCBjbGFzcyB0byBmYWRlLWluIHRoZSBiYWNrZHJvcCBhZnRlciBvbmUgZnJhbWUuXG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLl9iYWNrZHJvcEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKHNob3dpbmdDbGFzcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChzaG93aW5nQ2xhc3MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBzdGFja2luZyBvcmRlciBvZiB0aGUgZWxlbWVudCwgbW92aW5nIGl0IHRvIHRoZSB0b3AgaWYgbmVjZXNzYXJ5LlxuICAgKiBUaGlzIGlzIHJlcXVpcmVkIGluIGNhc2VzIHdoZXJlIG9uZSBvdmVybGF5IHdhcyBkZXRhY2hlZCwgd2hpbGUgYW5vdGhlciBvbmUsXG4gICAqIHRoYXQgc2hvdWxkIGJlIGJlaGluZCBpdCwgd2FzIGRlc3Ryb3llZC4gVGhlIG5leHQgdGltZSBib3RoIG9mIHRoZW0gYXJlIG9wZW5lZCxcbiAgICogdGhlIHN0YWNraW5nIHdpbGwgYmUgd3JvbmcsIGJlY2F1c2UgdGhlIGRldGFjaGVkIGVsZW1lbnQncyBwYW5lIHdpbGwgc3RpbGwgYmVcbiAgICogaW4gaXRzIG9yaWdpbmFsIERPTSBwb3NpdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZVN0YWNraW5nT3JkZXIoKSB7XG4gICAgaWYgKHRoaXMuX2hvc3QubmV4dFNpYmxpbmcpIHtcbiAgICAgIHRoaXMuX2hvc3QucGFyZW50Tm9kZSEuYXBwZW5kQ2hpbGQodGhpcy5faG9zdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBiYWNrZHJvcCAoaWYgYW55KSBhc3NvY2lhdGVkIHdpdGggdGhlIG92ZXJsYXkuICovXG4gIGRldGFjaEJhY2tkcm9wKCk6IHZvaWQge1xuICAgIGNvbnN0IGJhY2tkcm9wVG9EZXRhY2ggPSB0aGlzLl9iYWNrZHJvcEVsZW1lbnQ7XG5cbiAgICBpZiAoIWJhY2tkcm9wVG9EZXRhY2gpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBiYWNrZHJvcFRvRGV0YWNoLmNsYXNzTGlzdC5yZW1vdmUoJ2Nkay1vdmVybGF5LWJhY2tkcm9wLXNob3dpbmcnKTtcblxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBiYWNrZHJvcFRvRGV0YWNoIS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdGhpcy5fYmFja2Ryb3BUcmFuc2l0aW9uZW5kSGFuZGxlcik7XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGUgYmFja2Ryb3AgZG9lc24ndCBoYXZlIGEgdHJhbnNpdGlvbiwgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB3b24ndCBmaXJlLlxuICAgIC8vIEluIHRoaXMgY2FzZSB3ZSBtYWtlIGl0IHVuY2xpY2thYmxlIGFuZCB3ZSB0cnkgdG8gcmVtb3ZlIGl0IGFmdGVyIGEgZGVsYXkuXG4gICAgYmFja2Ryb3BUb0RldGFjaC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuXG4gICAgLy8gUnVuIHRoaXMgb3V0c2lkZSB0aGUgQW5ndWxhciB6b25lIGJlY2F1c2UgdGhlcmUncyBub3RoaW5nIHRoYXQgQW5ndWxhciBjYXJlcyBhYm91dC5cbiAgICAvLyBJZiBpdCB3ZXJlIHRvIHJ1biBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZSwgZXZlcnkgdGVzdCB0aGF0IHVzZWQgT3ZlcmxheSB3b3VsZCBoYXZlIHRvIGJlXG4gICAgLy8gZWl0aGVyIGFzeW5jIG9yIGZha2VBc3luYy5cbiAgICB0aGlzLl9iYWNrZHJvcFRpbWVvdXQgPSB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnZmFsbGJhY2snKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zZUJhY2tkcm9wKGJhY2tkcm9wVG9EZXRhY2gpO1xuICAgICAgfSwgNTAwKSxcbiAgICApO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgYSBzaW5nbGUgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgb24gYW4gZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY3NzQ2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10sIGlzQWRkOiBib29sZWFuKSB7XG4gICAgY29uc3QgY2xhc3NlcyA9IGNvZXJjZUFycmF5KGNzc0NsYXNzZXMgfHwgW10pLmZpbHRlcihjID0+ICEhYyk7XG5cbiAgICBpZiAoY2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgIGlzQWRkID8gZWxlbWVudC5jbGFzc0xpc3QuYWRkKC4uLmNsYXNzZXMpIDogZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKC4uLmNsYXNzZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgb3ZlcmxheSBjb250ZW50IG5leHQgdGltZSB0aGUgem9uZSBzdGFiaWxpemVzLiAqL1xuICBwcml2YXRlIF9kZXRhY2hDb250ZW50V2hlblN0YWJsZSgpIHtcbiAgICAvLyBOb3JtYWxseSB3ZSB3b3VsZG4ndCBoYXZlIHRvIGV4cGxpY2l0bHkgcnVuIHRoaXMgb3V0c2lkZSB0aGUgYE5nWm9uZWAsIGhvd2V2ZXJcbiAgICAvLyBpZiB0aGUgY29uc3VtZXIgaXMgdXNpbmcgYHpvbmUtcGF0Y2gtcnhqc2AsIHRoZSBgU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlYCBjYWxsIHdpbGxcbiAgICAvLyBiZSBwYXRjaGVkIHRvIHJ1biBpbnNpZGUgdGhlIHpvbmUsIHdoaWNoIHdpbGwgdGhyb3cgdXMgaW50byBhbiBpbmZpbml0ZSBsb29wLlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAvLyBXZSBjYW4ndCByZW1vdmUgdGhlIGhvc3QgaGVyZSBpbW1lZGlhdGVseSwgYmVjYXVzZSB0aGUgb3ZlcmxheSBwYW5lJ3MgY29udGVudFxuICAgICAgLy8gbWlnaHQgc3RpbGwgYmUgYW5pbWF0aW5nLiBUaGlzIHN0cmVhbSBoZWxwcyB1cyBhdm9pZCBpbnRlcnJ1cHRpbmcgdGhlIGFuaW1hdGlvblxuICAgICAgLy8gYnkgd2FpdGluZyBmb3IgdGhlIHBhbmUgdG8gYmVjb21lIGVtcHR5LlxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdGhpcy5fbmdab25lLm9uU3RhYmxlXG4gICAgICAgIC5waXBlKHRha2VVbnRpbChtZXJnZSh0aGlzLl9hdHRhY2htZW50cywgdGhpcy5fZGV0YWNobWVudHMpKSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgLy8gTmVlZHMgYSBjb3VwbGUgb2YgY2hlY2tzIGZvciB0aGUgcGFuZSBhbmQgaG9zdCwgYmVjYXVzZVxuICAgICAgICAgIC8vIHRoZXkgbWF5IGhhdmUgYmVlbiByZW1vdmVkIGJ5IHRoZSB0aW1lIHRoZSB6b25lIHN0YWJpbGl6ZXMuXG4gICAgICAgICAgaWYgKCF0aGlzLl9wYW5lIHx8ICF0aGlzLl9ob3N0IHx8IHRoaXMuX3BhbmUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcGFuZSAmJiB0aGlzLl9jb25maWcucGFuZWxDbGFzcykge1xuICAgICAgICAgICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIHRoaXMuX2NvbmZpZy5wYW5lbENsYXNzLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ob3N0ICYmIHRoaXMuX2hvc3QucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQgPSB0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgIHRoaXMuX2hvc3QucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGlzcG9zZXMgb2YgYSBzY3JvbGwgc3RyYXRlZ3kuICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VTY3JvbGxTdHJhdGVneSgpIHtcbiAgICBjb25zdCBzY3JvbGxTdHJhdGVneSA9IHRoaXMuX3Njcm9sbFN0cmF0ZWd5O1xuXG4gICAgaWYgKHNjcm9sbFN0cmF0ZWd5KSB7XG4gICAgICBzY3JvbGxTdHJhdGVneS5kaXNhYmxlKCk7XG5cbiAgICAgIGlmIChzY3JvbGxTdHJhdGVneS5kZXRhY2gpIHtcbiAgICAgICAgc2Nyb2xsU3RyYXRlZ3kuZGV0YWNoKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBiYWNrZHJvcCBlbGVtZW50IGZyb20gdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfZGlzcG9zZUJhY2tkcm9wKGJhY2tkcm9wOiBIVE1MRWxlbWVudCB8IG51bGwpIHtcbiAgICBpZiAoYmFja2Ryb3ApIHtcbiAgICAgIGJhY2tkcm9wLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fYmFja2Ryb3BDbGlja0hhbmRsZXIpO1xuICAgICAgYmFja2Ryb3AucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMuX2JhY2tkcm9wVHJhbnNpdGlvbmVuZEhhbmRsZXIpO1xuICAgICAgYmFja2Ryb3AucmVtb3ZlKCk7XG5cbiAgICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgYSBuZXcgcG9ydGFsIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoaXMgb3ZlcmxheSBzaW5jZSB3ZSBzdGFydGVkXG4gICAgICAvLyByZW1vdmluZyB0aGUgYmFja2Ryb3AuIElmIHRoYXQgaXMgdGhlIGNhc2UsIG9ubHkgY2xlYXIgdGhlIGJhY2tkcm9wIHJlZmVyZW5jZSBpZiBpdFxuICAgICAgLy8gaXMgc3RpbGwgdGhlIHNhbWUgaW5zdGFuY2UgdGhhdCB3ZSBzdGFydGVkIHRvIHJlbW92ZS5cbiAgICAgIGlmICh0aGlzLl9iYWNrZHJvcEVsZW1lbnQgPT09IGJhY2tkcm9wKSB7XG4gICAgICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2JhY2tkcm9wVGltZW91dCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2JhY2tkcm9wVGltZW91dCk7XG4gICAgICB0aGlzLl9iYWNrZHJvcFRpbWVvdXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG59XG5cbi8qKiBTaXplIHByb3BlcnRpZXMgZm9yIGFuIG92ZXJsYXkuICovXG5leHBvcnQgaW50ZXJmYWNlIE92ZXJsYXlTaXplQ29uZmlnIHtcbiAgd2lkdGg/OiBudW1iZXIgfCBzdHJpbmc7XG4gIGhlaWdodD86IG51bWJlciB8IHN0cmluZztcbiAgbWluV2lkdGg/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1pbkhlaWdodD86IG51bWJlciB8IHN0cmluZztcbiAgbWF4V2lkdGg/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1heEhlaWdodD86IG51bWJlciB8IHN0cmluZztcbn1cbiJdfQ==