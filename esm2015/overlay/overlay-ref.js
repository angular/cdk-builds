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
        this._ngZone.onStable
            .pipe(take(1))
            .subscribe(() => {
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
        this.detachBackdrop();
        this._locationChanges.unsubscribe();
        this._keyboardDispatcher.remove(this);
        this._portalOutlet.dispose();
        this._attachments.complete();
        this._backdropClick.complete();
        this._keydownEvents.complete();
        this._outsidePointerEvents.complete();
        this._outsideClickDispatcher.remove(this);
        if (this._host && this._host.parentNode) {
            this._host.parentNode.removeChild(this._host);
            this._host = null;
        }
        this._previousHostParent = this._pane = null;
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
        this._config = Object.assign(Object.assign({}, this._config), sizeConfig);
        this._updateElementSize();
    }
    /** Sets the LTR/RTL direction for the overlay. */
    setDirection(dir) {
        this._config = Object.assign(Object.assign({}, this._config), { direction: dir });
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
        let backdropToDetach = this._backdropElement;
        if (!backdropToDetach) {
            return;
        }
        let timeoutId;
        let finishDetach = () => {
            // It may not be attached to anything in certain cases (e.g. unit tests).
            if (backdropToDetach) {
                backdropToDetach.removeEventListener('click', this._backdropClickHandler);
                backdropToDetach.removeEventListener('transitionend', finishDetach);
                if (backdropToDetach.parentNode) {
                    backdropToDetach.parentNode.removeChild(backdropToDetach);
                }
            }
            // It is possible that a new portal has been attached to this overlay since we started
            // removing the backdrop. If that is the case, only clear the backdrop reference if it
            // is still the same instance that we started to remove.
            if (this._backdropElement == backdropToDetach) {
                this._backdropElement = null;
            }
            if (this._config.backdropClass) {
                this._toggleClasses(backdropToDetach, this._config.backdropClass, false);
            }
            clearTimeout(timeoutId);
        };
        backdropToDetach.classList.remove('cdk-overlay-backdrop-showing');
        this._ngZone.runOutsideAngular(() => {
            backdropToDetach.addEventListener('transitionend', finishDetach);
        });
        // If the backdrop doesn't have a transition, the `transitionend` event won't fire.
        // In this case we make it unclickable and we try to remove it after a delay.
        backdropToDetach.style.pointerEvents = 'none';
        // Run this outside the Angular zone because there's nothing that Angular cares about.
        // If it were to run inside the Angular zone, every test that used Overlay would have to be
        // either async or fakeAsync.
        timeoutId = this._ngZone.runOutsideAngular(() => setTimeout(finishDetach, 500));
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
                        this._previousHostParent.removeChild(this._host);
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBTUgsT0FBTyxFQUFhLE9BQU8sRUFBRSxLQUFLLEVBQW9CLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoRixPQUFPLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSS9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQVd2RTs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sVUFBVTtJQXNCckIsWUFDWSxhQUEyQixFQUMzQixLQUFrQixFQUNsQixLQUFrQixFQUNsQixPQUF1QyxFQUN2QyxPQUFlLEVBQ2YsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLFNBQW1CLEVBQ25CLHVCQUFzRDtRQVJ0RCxrQkFBYSxHQUFiLGFBQWEsQ0FBYztRQUMzQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBQ2xCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0M7UUFDdkMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMkI7UUFDOUMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBK0I7UUE5QjFELHFCQUFnQixHQUF1QixJQUFJLENBQUM7UUFDbkMsbUJBQWMsR0FBRyxJQUFJLE9BQU8sRUFBYyxDQUFDO1FBQzNDLGlCQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUNuQyxpQkFBWSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFHNUMscUJBQWdCLEdBQXFCLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFD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UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxxQ0FBcUM7SUFDN0Isc0JBQXNCO1FBQzVCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7UUFFNUMsSUFBSSxjQUFjLEVBQUU7WUFDbEIsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXpCLElBQUksY0FBYyxDQUFDLE1BQU0sRUFBRTtnQkFDekIsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ3pCO1NBQ0Y7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb24sIERpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge0NvbXBvbmVudFBvcnRhbCwgUG9ydGFsLCBQb3J0YWxPdXRsZXQsIFRlbXBsYXRlUG9ydGFsfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmltcG9ydCB7Q29tcG9uZW50UmVmLCBFbWJlZGRlZFZpZXdSZWYsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0xvY2F0aW9ufSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBtZXJnZSwgU3Vic2NyaXB0aW9uTGlrZSwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZSwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge092ZXJsYXlLZXlib2FyZERpc3BhdGNoZXJ9IGZyb20gJy4vZGlzcGF0Y2hlcnMvb3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheU91dHNpZGVDbGlja0Rpc3BhdGNoZXJ9IGZyb20gJy4vZGlzcGF0Y2hlcnMvb3ZlcmxheS1vdXRzaWRlLWNsaWNrLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtPdmVybGF5Q29uZmlnfSBmcm9tICcuL292ZXJsYXktY29uZmlnJztcbmltcG9ydCB7Y29lcmNlQ3NzUGl4ZWxWYWx1ZSwgY29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge092ZXJsYXlSZWZlcmVuY2V9IGZyb20gJy4vb3ZlcmxheS1yZWZlcmVuY2UnO1xuaW1wb3J0IHtQb3NpdGlvblN0cmF0ZWd5fSBmcm9tICcuL3Bvc2l0aW9uL3Bvc2l0aW9uLXN0cmF0ZWd5JztcbmltcG9ydCB7U2Nyb2xsU3RyYXRlZ3l9IGZyb20gJy4vc2Nyb2xsJztcblxuXG4vKiogQW4gb2JqZWN0IHdoZXJlIGFsbCBvZiBpdHMgcHJvcGVydGllcyBjYW5ub3QgYmUgd3JpdHRlbi4gKi9cbmV4cG9ydCB0eXBlIEltbXV0YWJsZU9iamVjdDxUPiA9IHtcbiAgcmVhZG9ubHkgW1AgaW4ga2V5b2YgVF06IFRbUF07XG59O1xuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhbiBvdmVybGF5IHRoYXQgaGFzIGJlZW4gY3JlYXRlZCB3aXRoIHRoZSBPdmVybGF5IHNlcnZpY2UuXG4gKiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiBzYWlkIG92ZXJsYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBPdmVybGF5UmVmIGltcGxlbWVudHMgUG9ydGFsT3V0bGV0LCBPdmVybGF5UmVmZXJlbmNlIHtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IF9iYWNrZHJvcENsaWNrID0gbmV3IFN1YmplY3Q8TW91c2VFdmVudD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYXR0YWNobWVudHMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXRhY2htZW50cyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIHByaXZhdGUgX3Bvc2l0aW9uU3RyYXRlZ3k6IFBvc2l0aW9uU3RyYXRlZ3kgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneSB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfbG9jYXRpb25DaGFuZ2VzOiBTdWJzY3JpcHRpb25MaWtlID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9iYWNrZHJvcENsaWNrSGFuZGxlciA9IChldmVudDogTW91c2VFdmVudCkgPT4gdGhpcy5fYmFja2Ryb3BDbGljay5uZXh0KGV2ZW50KTtcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGBfaG9zdGAgYXQgdGhlIHRpbWUgaXQgd2FzIGRldGFjaGVkLiBVc2VkIHRvIHJlc3RvcmVcbiAgICogdGhlIGBfaG9zdGAgdG8gaXRzIG9yaWdpbmFsIHBvc2l0aW9uIGluIHRoZSBET00gd2hlbiBpdCBnZXRzIHJlLWF0dGFjaGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNIb3N0UGFyZW50OiBIVE1MRWxlbWVudDtcblxuICAvKiogU3RyZWFtIG9mIGtleWRvd24gZXZlbnRzIGRpc3BhdGNoZWQgdG8gdGhpcyBvdmVybGF5LiAqL1xuICByZWFkb25seSBfa2V5ZG93bkV2ZW50cyA9IG5ldyBTdWJqZWN0PEtleWJvYXJkRXZlbnQ+KCk7XG5cbiAgLyoqIFN0cmVhbSBvZiBtb3VzZSBvdXRzaWRlIGV2ZW50cyBkaXNwYXRjaGVkIHRvIHRoaXMgb3ZlcmxheS4gKi9cbiAgcmVhZG9ubHkgX291dHNpZGVQb2ludGVyRXZlbnRzID0gbmV3IFN1YmplY3Q8TW91c2VFdmVudD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3BvcnRhbE91dGxldDogUG9ydGFsT3V0bGV0LFxuICAgICAgcHJpdmF0ZSBfaG9zdDogSFRNTEVsZW1lbnQsXG4gICAgICBwcml2YXRlIF9wYW5lOiBIVE1MRWxlbWVudCxcbiAgICAgIHByaXZhdGUgX2NvbmZpZzogSW1tdXRhYmxlT2JqZWN0PE92ZXJsYXlDb25maWc+LFxuICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBwcml2YXRlIF9rZXlib2FyZERpc3BhdGNoZXI6IE92ZXJsYXlLZXlib2FyZERpc3BhdGNoZXIsXG4gICAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgICBwcml2YXRlIF9sb2NhdGlvbjogTG9jYXRpb24sXG4gICAgICBwcml2YXRlIF9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyOiBPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlcikge1xuXG4gICAgaWYgKF9jb25maWcuc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5ID0gX2NvbmZpZy5zY3JvbGxTdHJhdGVneTtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5ID0gX2NvbmZpZy5wb3NpdGlvblN0cmF0ZWd5O1xuICB9XG5cbiAgLyoqIFRoZSBvdmVybGF5J3MgSFRNTCBlbGVtZW50ICovXG4gIGdldCBvdmVybGF5RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3BhbmU7XG4gIH1cblxuICAvKiogVGhlIG92ZXJsYXkncyBiYWNrZHJvcCBIVE1MIGVsZW1lbnQuICovXG4gIGdldCBiYWNrZHJvcEVsZW1lbnQoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja2Ryb3BFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIHRoZSBwYW5lbCBlbGVtZW50LiBDYW4gYmUgdXNlZCBmb3IgYWR2YW5jZWRcbiAgICogcG9zaXRpb25pbmcgd2hlcmUgYSB3cmFwcGVyIHdpdGggc3BlY2lmaWMgc3R5bGluZyBpc1xuICAgKiByZXF1aXJlZCBhcm91bmQgdGhlIG92ZXJsYXkgcGFuZS5cbiAgICovXG4gIGdldCBob3N0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3Q7XG4gIH1cblxuICBhdHRhY2g8VD4ocG9ydGFsOiBDb21wb25lbnRQb3J0YWw8VD4pOiBDb21wb25lbnRSZWY8VD47XG4gIGF0dGFjaDxUPihwb3J0YWw6IFRlbXBsYXRlUG9ydGFsPFQ+KTogRW1iZWRkZWRWaWV3UmVmPFQ+O1xuICBhdHRhY2gocG9ydGFsOiBhbnkpOiBhbnk7XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGNvbnRlbnQsIGdpdmVuIHZpYSBhIFBvcnRhbCwgdG8gdGhlIG92ZXJsYXkuXG4gICAqIElmIHRoZSBvdmVybGF5IGlzIGNvbmZpZ3VyZWQgdG8gaGF2ZSBhIGJhY2tkcm9wLCBpdCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIGluc3RhbmNlIHRvIHdoaWNoIHRvIGF0dGFjaCB0aGUgb3ZlcmxheS5cbiAgICogQHJldHVybnMgVGhlIHBvcnRhbCBhdHRhY2htZW50IHJlc3VsdC5cbiAgICovXG4gIGF0dGFjaChwb3J0YWw6IFBvcnRhbDxhbnk+KTogYW55IHtcbiAgICBsZXQgYXR0YWNoUmVzdWx0ID0gdGhpcy5fcG9ydGFsT3V0bGV0LmF0dGFjaChwb3J0YWwpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBwYW5lIGVsZW1lbnQgd2l0aCB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICBpZiAoIXRoaXMuX2hvc3QucGFyZW50RWxlbWVudCAmJiB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQpIHtcbiAgICAgIHRoaXMuX3ByZXZpb3VzSG9zdFBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLl9ob3N0KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlU3RhY2tpbmdPcmRlcigpO1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnRTaXplKCk7XG4gICAgdGhpcy5fdXBkYXRlRWxlbWVudERpcmVjdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuX3Njcm9sbFN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHBvc2l0aW9uIG9uY2UgdGhlIHpvbmUgaXMgc3RhYmxlIHNvIHRoYXQgdGhlIG92ZXJsYXkgd2lsbCBiZSBmdWxseSByZW5kZXJlZFxuICAgIC8vIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHBvc2l0aW9uIGl0LCBhcyB0aGUgcG9zaXRpb24gbWF5IGRlcGVuZCBvbiB0aGUgc2l6ZSBvZiB0aGUgcmVuZGVyZWRcbiAgICAvLyBjb250ZW50LlxuICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZVxuICAgICAgLnBpcGUodGFrZSgxKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBUaGUgb3ZlcmxheSBjb3VsZCd2ZSBiZWVuIGRldGFjaGVkIGJlZm9yZSB0aGUgem9uZSBoYXMgc3RhYmlsaXplZC5cbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAvLyBFbmFibGUgcG9pbnRlciBldmVudHMgZm9yIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC5cbiAgICB0aGlzLl90b2dnbGVQb2ludGVyRXZlbnRzKHRydWUpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5oYXNCYWNrZHJvcCkge1xuICAgICAgdGhpcy5fYXR0YWNoQmFja2Ryb3AoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fcGFuZSwgdGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZW1pdCB0aGUgYGF0dGFjaG1lbnRzYCBldmVudCBvbmNlIGFsbCBvdGhlciBzZXR1cCBpcyBkb25lLlxuICAgIHRoaXMuX2F0dGFjaG1lbnRzLm5leHQoKTtcblxuICAgIC8vIFRyYWNrIHRoaXMgb3ZlcmxheSBieSB0aGUga2V5Ym9hcmQgZGlzcGF0Y2hlclxuICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlci5hZGQodGhpcyk7XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLmRpc3Bvc2VPbk5hdmlnYXRpb24pIHtcbiAgICAgIHRoaXMuX2xvY2F0aW9uQ2hhbmdlcyA9IHRoaXMuX2xvY2F0aW9uLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRpc3Bvc2UoKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlci5hZGQodGhpcyk7XG4gICAgcmV0dXJuIGF0dGFjaFJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhbiBvdmVybGF5IGZyb20gYSBwb3J0YWwuXG4gICAqIEByZXR1cm5zIFRoZSBwb3J0YWwgZGV0YWNobWVudCByZXN1bHQuXG4gICAqL1xuICBkZXRhY2goKTogYW55IHtcbiAgICBpZiAoIXRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZGV0YWNoQmFja2Ryb3AoKTtcblxuICAgIC8vIFdoZW4gdGhlIG92ZXJsYXkgaXMgZGV0YWNoZWQsIHRoZSBwYW5lIGVsZW1lbnQgc2hvdWxkIGRpc2FibGUgcG9pbnRlciBldmVudHMuXG4gICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBvdGhlcndpc2UgdGhlIHBhbmUgZWxlbWVudCB3aWxsIGNvdmVyIHRoZSBwYWdlIGFuZCBkaXNhYmxlXG4gICAgLy8gcG9pbnRlciBldmVudHMgdGhlcmVmb3JlLiBEZXBlbmRzIG9uIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBhbmQgdGhlIGFwcGxpZWQgcGFuZSBib3VuZGFyaWVzLlxuICAgIHRoaXMuX3RvZ2dsZVBvaW50ZXJFdmVudHMoZmFsc2UpO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kgJiYgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5kZXRhY2gpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGV0YWNoKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Njcm9sbFN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5kaXNhYmxlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGV0YWNobWVudFJlc3VsdCA9IHRoaXMuX3BvcnRhbE91dGxldC5kZXRhY2goKTtcblxuICAgIC8vIE9ubHkgZW1pdCBhZnRlciBldmVyeXRoaW5nIGlzIGRldGFjaGVkLlxuICAgIHRoaXMuX2RldGFjaG1lbnRzLm5leHQoKTtcblxuICAgIC8vIFJlbW92ZSB0aGlzIG92ZXJsYXkgZnJvbSBrZXlib2FyZCBkaXNwYXRjaGVyIHRyYWNraW5nLlxuICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlci5yZW1vdmUodGhpcyk7XG5cbiAgICAvLyBLZWVwaW5nIHRoZSBob3N0IGVsZW1lbnQgaW4gdGhlIERPTSBjYW4gY2F1c2Ugc2Nyb2xsIGphbmssIGJlY2F1c2UgaXQgc3RpbGwgZ2V0c1xuICAgIC8vIHJlbmRlcmVkLCBldmVuIHRob3VnaCBpdCdzIHRyYW5zcGFyZW50IGFuZCB1bmNsaWNrYWJsZSB3aGljaCBpcyB3aHkgd2UgcmVtb3ZlIGl0LlxuICAgIHRoaXMuX2RldGFjaENvbnRlbnRXaGVuU3RhYmxlKCk7XG4gICAgdGhpcy5fbG9jYXRpb25DaGFuZ2VzLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlci5yZW1vdmUodGhpcyk7XG4gICAgcmV0dXJuIGRldGFjaG1lbnRSZXN1bHQ7XG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBvdmVybGF5IGZyb20gdGhlIERPTS4gKi9cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICBjb25zdCBpc0F0dGFjaGVkID0gdGhpcy5oYXNBdHRhY2hlZCgpO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX2Rpc3Bvc2VTY3JvbGxTdHJhdGVneSgpO1xuICAgIHRoaXMuZGV0YWNoQmFja2Ryb3AoKTtcbiAgICB0aGlzLl9sb2NhdGlvbkNoYW5nZXMudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuX3BvcnRhbE91dGxldC5kaXNwb3NlKCk7XG4gICAgdGhpcy5fYXR0YWNobWVudHMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9iYWNrZHJvcENsaWNrLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fa2V5ZG93bkV2ZW50cy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX291dHNpZGVQb2ludGVyRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlci5yZW1vdmUodGhpcyk7XG5cbiAgICBpZiAodGhpcy5faG9zdCAmJiB0aGlzLl9ob3N0LnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMuX2hvc3QucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9ob3N0KTtcbiAgICAgIHRoaXMuX2hvc3QgPSBudWxsITtcbiAgICB9XG5cbiAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQgPSB0aGlzLl9wYW5lID0gbnVsbCE7XG5cbiAgICBpZiAoaXNBdHRhY2hlZCkge1xuICAgICAgdGhpcy5fZGV0YWNobWVudHMubmV4dCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2RldGFjaG1lbnRzLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgb3ZlcmxheSBoYXMgYXR0YWNoZWQgY29udGVudC4gKi9cbiAgaGFzQXR0YWNoZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3BvcnRhbE91dGxldC5oYXNBdHRhY2hlZCgpO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIGJhY2tkcm9wIGhhcyBiZWVuIGNsaWNrZWQuICovXG4gIGJhY2tkcm9wQ2xpY2soKTogT2JzZXJ2YWJsZTxNb3VzZUV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tkcm9wQ2xpY2s7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBhdHRhY2hlZC4gKi9cbiAgYXR0YWNobWVudHMoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaG1lbnRzO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gZGV0YWNoZWQuICovXG4gIGRldGFjaG1lbnRzKCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLl9kZXRhY2htZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgb2Yga2V5ZG93biBldmVudHMgdGFyZ2V0ZWQgdG8gdGhpcyBvdmVybGF5LiAqL1xuICBrZXlkb3duRXZlbnRzKCk6IE9ic2VydmFibGU8S2V5Ym9hcmRFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9rZXlkb3duRXZlbnRzO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSBvZiBwb2ludGVyIGV2ZW50cyB0YXJnZXRlZCBvdXRzaWRlIHRoaXMgb3ZlcmxheS4gKi9cbiAgb3V0c2lkZVBvaW50ZXJFdmVudHMoKTogT2JzZXJ2YWJsZTxNb3VzZUV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX291dHNpZGVQb2ludGVyRXZlbnRzO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGN1cnJlbnQgb3ZlcmxheSBjb25maWd1cmF0aW9uLCB3aGljaCBpcyBpbW11dGFibGUuICovXG4gIGdldENvbmZpZygpOiBPdmVybGF5Q29uZmlnIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBvdmVybGF5IGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBzdHJhdGVneS4gKi9cbiAgdXBkYXRlUG9zaXRpb24oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuYXBwbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKiogU3dpdGNoZXMgdG8gYSBuZXcgcG9zaXRpb24gc3RyYXRlZ3kgYW5kIHVwZGF0ZXMgdGhlIG92ZXJsYXkgcG9zaXRpb24uICovXG4gIHVwZGF0ZVBvc2l0aW9uU3RyYXRlZ3koc3RyYXRlZ3k6IFBvc2l0aW9uU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneSA9IHN0cmF0ZWd5O1xuXG4gICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgc3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIHNpemUgcHJvcGVydGllcyBvZiB0aGUgb3ZlcmxheS4gKi9cbiAgdXBkYXRlU2l6ZShzaXplQ29uZmlnOiBPdmVybGF5U2l6ZUNvbmZpZyk6IHZvaWQge1xuICAgIHRoaXMuX2NvbmZpZyA9IHsuLi50aGlzLl9jb25maWcsIC4uLnNpemVDb25maWd9O1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnRTaXplKCk7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgTFRSL1JUTCBkaXJlY3Rpb24gZm9yIHRoZSBvdmVybGF5LiAqL1xuICBzZXREaXJlY3Rpb24oZGlyOiBEaXJlY3Rpb24gfCBEaXJlY3Rpb25hbGl0eSk6IHZvaWQge1xuICAgIHRoaXMuX2NvbmZpZyA9IHsuLi50aGlzLl9jb25maWcsIGRpcmVjdGlvbjogZGlyfTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50RGlyZWN0aW9uKCk7XG4gIH1cblxuICAvKiogQWRkIGEgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgdG8gdGhlIG92ZXJsYXkgcGFuZS4gKi9cbiAgYWRkUGFuZWxDbGFzcyhjbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIGNsYXNzZXMsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmUgYSBDU1MgY2xhc3Mgb3IgYW4gYXJyYXkgb2YgY2xhc3NlcyBmcm9tIHRoZSBvdmVybGF5IHBhbmUuICovXG4gIHJlbW92ZVBhbmVsQ2xhc3MoY2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCBjbGFzc2VzLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIG92ZXJsYXkgcGFuZWwuXG4gICAqL1xuICBnZXREaXJlY3Rpb24oKTogRGlyZWN0aW9uIHtcbiAgICBjb25zdCBkaXJlY3Rpb24gPSB0aGlzLl9jb25maWcuZGlyZWN0aW9uO1xuXG4gICAgaWYgKCFkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAnbHRyJztcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGRpcmVjdGlvbiA9PT0gJ3N0cmluZycgPyBkaXJlY3Rpb24gOiBkaXJlY3Rpb24udmFsdWU7XG4gIH1cblxuICAvKiogU3dpdGNoZXMgdG8gYSBuZXcgc2Nyb2xsIHN0cmF0ZWd5LiAqL1xuICB1cGRhdGVTY3JvbGxTdHJhdGVneShzdHJhdGVneTogU2Nyb2xsU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IHRoaXMuX3Njcm9sbFN0cmF0ZWd5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fZGlzcG9zZVNjcm9sbFN0cmF0ZWd5KCk7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICAgIHN0cmF0ZWd5LmVuYWJsZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSB0ZXh0IGRpcmVjdGlvbiBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlRWxlbWVudERpcmVjdGlvbigpIHtcbiAgICB0aGlzLl9ob3N0LnNldEF0dHJpYnV0ZSgnZGlyJywgdGhpcy5nZXREaXJlY3Rpb24oKSk7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgc2l6ZSBvZiB0aGUgb3ZlcmxheSBlbGVtZW50IGJhc2VkIG9uIHRoZSBvdmVybGF5IGNvbmZpZy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlRWxlbWVudFNpemUoKSB7XG4gICAgaWYgKCF0aGlzLl9wYW5lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3R5bGUgPSB0aGlzLl9wYW5lLnN0eWxlO1xuXG4gICAgc3R5bGUud2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy53aWR0aCk7XG4gICAgc3R5bGUuaGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcuaGVpZ2h0KTtcbiAgICBzdHlsZS5taW5XaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1pbldpZHRoKTtcbiAgICBzdHlsZS5taW5IZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5taW5IZWlnaHQpO1xuICAgIHN0eWxlLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcubWF4V2lkdGgpO1xuICAgIHN0eWxlLm1heEhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1heEhlaWdodCk7XG4gIH1cblxuICAvKiogVG9nZ2xlcyB0aGUgcG9pbnRlciBldmVudHMgZm9yIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfdG9nZ2xlUG9pbnRlckV2ZW50cyhlbmFibGVQb2ludGVyOiBib29sZWFuKSB7XG4gICAgdGhpcy5fcGFuZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gZW5hYmxlUG9pbnRlciA/ICcnIDogJ25vbmUnO1xuICB9XG5cbiAgLyoqIEF0dGFjaGVzIGEgYmFja2Ryb3AgZm9yIHRoaXMgb3ZlcmxheS4gKi9cbiAgcHJpdmF0ZSBfYXR0YWNoQmFja2Ryb3AoKSB7XG4gICAgY29uc3Qgc2hvd2luZ0NsYXNzID0gJ2Nkay1vdmVybGF5LWJhY2tkcm9wLXNob3dpbmcnO1xuXG4gICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2Nkay1vdmVybGF5LWJhY2tkcm9wJyk7XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLmJhY2tkcm9wQ2xhc3MpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fYmFja2Ryb3BFbGVtZW50LCB0aGlzLl9jb25maWcuYmFja2Ryb3BDbGFzcywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8gSW5zZXJ0IHRoZSBiYWNrZHJvcCBiZWZvcmUgdGhlIHBhbmUgaW4gdGhlIERPTSBvcmRlcixcbiAgICAvLyBpbiBvcmRlciB0byBoYW5kbGUgc3RhY2tlZCBvdmVybGF5cyBwcm9wZXJseS5cbiAgICB0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQhLmluc2VydEJlZm9yZSh0aGlzLl9iYWNrZHJvcEVsZW1lbnQsIHRoaXMuX2hvc3QpO1xuXG4gICAgLy8gRm9yd2FyZCBiYWNrZHJvcCBjbGlja3Mgc3VjaCB0aGF0IHRoZSBjb25zdW1lciBvZiB0aGUgb3ZlcmxheSBjYW4gcGVyZm9ybSB3aGF0ZXZlclxuICAgIC8vIGFjdGlvbiBkZXNpcmVkIHdoZW4gc3VjaCBhIGNsaWNrIG9jY3VycyAodXN1YWxseSBjbG9zaW5nIHRoZSBvdmVybGF5KS5cbiAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9iYWNrZHJvcENsaWNrSGFuZGxlcik7XG5cbiAgICAvLyBBZGQgY2xhc3MgdG8gZmFkZS1pbiB0aGUgYmFja2Ryb3AgYWZ0ZXIgb25lIGZyYW1lLlxuICAgIGlmICh0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5fYmFja2Ryb3BFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChzaG93aW5nQ2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoc2hvd2luZ0NsYXNzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgc3RhY2tpbmcgb3JkZXIgb2YgdGhlIGVsZW1lbnQsIG1vdmluZyBpdCB0byB0aGUgdG9wIGlmIG5lY2Vzc2FyeS5cbiAgICogVGhpcyBpcyByZXF1aXJlZCBpbiBjYXNlcyB3aGVyZSBvbmUgb3ZlcmxheSB3YXMgZGV0YWNoZWQsIHdoaWxlIGFub3RoZXIgb25lLFxuICAgKiB0aGF0IHNob3VsZCBiZSBiZWhpbmQgaXQsIHdhcyBkZXN0cm95ZWQuIFRoZSBuZXh0IHRpbWUgYm90aCBvZiB0aGVtIGFyZSBvcGVuZWQsXG4gICAqIHRoZSBzdGFja2luZyB3aWxsIGJlIHdyb25nLCBiZWNhdXNlIHRoZSBkZXRhY2hlZCBlbGVtZW50J3MgcGFuZSB3aWxsIHN0aWxsIGJlXG4gICAqIGluIGl0cyBvcmlnaW5hbCBET00gcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVTdGFja2luZ09yZGVyKCkge1xuICAgIGlmICh0aGlzLl9ob3N0Lm5leHRTaWJsaW5nKSB7XG4gICAgICB0aGlzLl9ob3N0LnBhcmVudE5vZGUhLmFwcGVuZENoaWxkKHRoaXMuX2hvc3QpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgYmFja2Ryb3AgKGlmIGFueSkgYXNzb2NpYXRlZCB3aXRoIHRoZSBvdmVybGF5LiAqL1xuICBkZXRhY2hCYWNrZHJvcCgpOiB2b2lkIHtcbiAgICBsZXQgYmFja2Ryb3BUb0RldGFjaCA9IHRoaXMuX2JhY2tkcm9wRWxlbWVudDtcblxuICAgIGlmICghYmFja2Ryb3BUb0RldGFjaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0SWQ6IG51bWJlcjtcbiAgICBsZXQgZmluaXNoRGV0YWNoID0gKCkgPT4ge1xuICAgICAgLy8gSXQgbWF5IG5vdCBiZSBhdHRhY2hlZCB0byBhbnl0aGluZyBpbiBjZXJ0YWluIGNhc2VzIChlLmcuIHVuaXQgdGVzdHMpLlxuICAgICAgaWYgKGJhY2tkcm9wVG9EZXRhY2gpIHtcbiAgICAgICAgYmFja2Ryb3BUb0RldGFjaC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2JhY2tkcm9wQ2xpY2tIYW5kbGVyKTtcbiAgICAgICAgYmFja2Ryb3BUb0RldGFjaC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZmluaXNoRGV0YWNoKTtcblxuICAgICAgICBpZiAoYmFja2Ryb3BUb0RldGFjaC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgYmFja2Ryb3BUb0RldGFjaC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJhY2tkcm9wVG9EZXRhY2gpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgYSBuZXcgcG9ydGFsIGhhcyBiZWVuIGF0dGFjaGVkIHRvIHRoaXMgb3ZlcmxheSBzaW5jZSB3ZSBzdGFydGVkXG4gICAgICAvLyByZW1vdmluZyB0aGUgYmFja2Ryb3AuIElmIHRoYXQgaXMgdGhlIGNhc2UsIG9ubHkgY2xlYXIgdGhlIGJhY2tkcm9wIHJlZmVyZW5jZSBpZiBpdFxuICAgICAgLy8gaXMgc3RpbGwgdGhlIHNhbWUgaW5zdGFuY2UgdGhhdCB3ZSBzdGFydGVkIHRvIHJlbW92ZS5cbiAgICAgIGlmICh0aGlzLl9iYWNrZHJvcEVsZW1lbnQgPT0gYmFja2Ryb3BUb0RldGFjaCkge1xuICAgICAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fY29uZmlnLmJhY2tkcm9wQ2xhc3MpIHtcbiAgICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3NlcyhiYWNrZHJvcFRvRGV0YWNoISwgdGhpcy5fY29uZmlnLmJhY2tkcm9wQ2xhc3MsIGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfTtcblxuICAgIGJhY2tkcm9wVG9EZXRhY2guY2xhc3NMaXN0LnJlbW92ZSgnY2RrLW92ZXJsYXktYmFja2Ryb3Atc2hvd2luZycpO1xuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGJhY2tkcm9wVG9EZXRhY2ghLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmaW5pc2hEZXRhY2gpO1xuICAgIH0pO1xuXG4gICAgLy8gSWYgdGhlIGJhY2tkcm9wIGRvZXNuJ3QgaGF2ZSBhIHRyYW5zaXRpb24sIHRoZSBgdHJhbnNpdGlvbmVuZGAgZXZlbnQgd29uJ3QgZmlyZS5cbiAgICAvLyBJbiB0aGlzIGNhc2Ugd2UgbWFrZSBpdCB1bmNsaWNrYWJsZSBhbmQgd2UgdHJ5IHRvIHJlbW92ZSBpdCBhZnRlciBhIGRlbGF5LlxuICAgIGJhY2tkcm9wVG9EZXRhY2guc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcblxuICAgIC8vIFJ1biB0aGlzIG91dHNpZGUgdGhlIEFuZ3VsYXIgem9uZSBiZWNhdXNlIHRoZXJlJ3Mgbm90aGluZyB0aGF0IEFuZ3VsYXIgY2FyZXMgYWJvdXQuXG4gICAgLy8gSWYgaXQgd2VyZSB0byBydW4gaW5zaWRlIHRoZSBBbmd1bGFyIHpvbmUsIGV2ZXJ5IHRlc3QgdGhhdCB1c2VkIE92ZXJsYXkgd291bGQgaGF2ZSB0byBiZVxuICAgIC8vIGVpdGhlciBhc3luYyBvciBmYWtlQXN5bmMuXG4gICAgdGltZW91dElkID0gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHNldFRpbWVvdXQoZmluaXNoRGV0YWNoLCA1MDApKTtcbiAgfVxuXG4gIC8qKiBUb2dnbGVzIGEgc2luZ2xlIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIG9uIGFuIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3RvZ2dsZUNsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNzc0NsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdLCBpc0FkZDogYm9vbGVhbikge1xuICAgIGNvbnN0IGNsYXNzZXMgPSBjb2VyY2VBcnJheShjc3NDbGFzc2VzIHx8IFtdKS5maWx0ZXIoYyA9PiAhIWMpO1xuXG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICBpc0FkZCA/IGVsZW1lbnQuY2xhc3NMaXN0LmFkZCguLi5jbGFzc2VzKSA6IGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSguLi5jbGFzc2VzKTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIG92ZXJsYXkgY29udGVudCBuZXh0IHRpbWUgdGhlIHpvbmUgc3RhYmlsaXplcy4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoQ29udGVudFdoZW5TdGFibGUoKSB7XG4gICAgLy8gTm9ybWFsbHkgd2Ugd291bGRuJ3QgaGF2ZSB0byBleHBsaWNpdGx5IHJ1biB0aGlzIG91dHNpZGUgdGhlIGBOZ1pvbmVgLCBob3dldmVyXG4gICAgLy8gaWYgdGhlIGNvbnN1bWVyIGlzIHVzaW5nIGB6b25lLXBhdGNoLXJ4anNgLCB0aGUgYFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZWAgY2FsbCB3aWxsXG4gICAgLy8gYmUgcGF0Y2hlZCB0byBydW4gaW5zaWRlIHRoZSB6b25lLCB3aGljaCB3aWxsIHRocm93IHVzIGludG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgLy8gV2UgY2FuJ3QgcmVtb3ZlIHRoZSBob3N0IGhlcmUgaW1tZWRpYXRlbHksIGJlY2F1c2UgdGhlIG92ZXJsYXkgcGFuZSdzIGNvbnRlbnRcbiAgICAgIC8vIG1pZ2h0IHN0aWxsIGJlIGFuaW1hdGluZy4gVGhpcyBzdHJlYW0gaGVscHMgdXMgYXZvaWQgaW50ZXJydXB0aW5nIHRoZSBhbmltYXRpb25cbiAgICAgIC8vIGJ5IHdhaXRpbmcgZm9yIHRoZSBwYW5lIHRvIGJlY29tZSBlbXB0eS5cbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHRoaXMuX25nWm9uZS5vblN0YWJsZVxuICAgICAgICAucGlwZSh0YWtlVW50aWwobWVyZ2UodGhpcy5fYXR0YWNobWVudHMsIHRoaXMuX2RldGFjaG1lbnRzKSkpXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIC8vIE5lZWRzIGEgY291cGxlIG9mIGNoZWNrcyBmb3IgdGhlIHBhbmUgYW5kIGhvc3QsIGJlY2F1c2VcbiAgICAgICAgICAvLyB0aGV5IG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBieSB0aGUgdGltZSB0aGUgem9uZSBzdGFiaWxpemVzLlxuICAgICAgICAgIGlmICghdGhpcy5fcGFuZSB8fCAhdGhpcy5faG9zdCB8fCB0aGlzLl9wYW5lLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BhbmUgJiYgdGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MpIHtcbiAgICAgICAgICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCB0aGlzLl9jb25maWcucGFuZWxDbGFzcywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5faG9zdCAmJiB0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgdGhpcy5fcHJldmlvdXNIb3N0UGFyZW50ID0gdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5faG9zdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGlzcG9zZXMgb2YgYSBzY3JvbGwgc3RyYXRlZ3kuICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VTY3JvbGxTdHJhdGVneSgpIHtcbiAgICBjb25zdCBzY3JvbGxTdHJhdGVneSA9IHRoaXMuX3Njcm9sbFN0cmF0ZWd5O1xuXG4gICAgaWYgKHNjcm9sbFN0cmF0ZWd5KSB7XG4gICAgICBzY3JvbGxTdHJhdGVneS5kaXNhYmxlKCk7XG5cbiAgICAgIGlmIChzY3JvbGxTdHJhdGVneS5kZXRhY2gpIHtcbiAgICAgICAgc2Nyb2xsU3RyYXRlZ3kuZGV0YWNoKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqIFNpemUgcHJvcGVydGllcyBmb3IgYW4gb3ZlcmxheS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3ZlcmxheVNpemVDb25maWcge1xuICB3aWR0aD86IG51bWJlciB8IHN0cmluZztcbiAgaGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nO1xuICBtaW5XaWR0aD86IG51bWJlciB8IHN0cmluZztcbiAgbWluSGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nO1xuICBtYXhXaWR0aD86IG51bWJlciB8IHN0cmluZztcbiAgbWF4SGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nO1xufVxuIl19