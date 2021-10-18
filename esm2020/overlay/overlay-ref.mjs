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
        let timeoutId;
        const finishDetach = () => {
            // It may not be attached to anything in certain cases (e.g. unit tests).
            if (backdropToDetach) {
                backdropToDetach.removeEventListener('click', this._backdropClickHandler);
                backdropToDetach.removeEventListener('transitionend', finishDetach);
                this._disposeBackdrop(backdropToDetach);
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
            backdrop.remove();
            // It is possible that a new portal has been attached to this overlay since we started
            // removing the backdrop. If that is the case, only clear the backdrop reference if it
            // is still the same instance that we started to remove.
            if (this._backdropElement === backdrop) {
                this._backdropElement = null;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBTUgsT0FBTyxFQUFhLE9BQU8sRUFBRSxLQUFLLEVBQW9CLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoRixPQUFPLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSS9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQVV2RTs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sVUFBVTtJQXNCckIsWUFDVSxhQUEyQixFQUMzQixLQUFrQixFQUNsQixLQUFrQixFQUNsQixPQUF1QyxFQUN2QyxPQUFlLEVBQ2YsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLFNBQW1CLEVBQ25CLHVCQUFzRDtRQVJ0RCxrQkFBYSxHQUFiLGFBQWEsQ0FBYztRQUMzQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBQ2xCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0M7UUFDdkMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMkI7UUFDOUMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBK0I7UUE5QnhELHFCQUFnQixHQUF1QixJQUFJLENBQUM7UUFDbkMsbUJBQWMsR0FBRyxJQUFJLE9BQU8sRUFBYyxDQUFDO1FBQzNDLGlCQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUNuQyxpQkFBWSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFHNUMscUJBQWdCLEdBQXFCLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFDeEQsMEJBQXFCLEdBQUcsQ0FBQyxLQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQVF2RiwyREFBMkQ7UUFDbEQsbUJBQWMsR0FBRyxJQUFJLE9BQU8sRUFBaUIsQ0FBQztRQUV2RCxpRUFBaUU7UUFDeEQsMEJBQXFCLEdBQUcsSUFBSSxPQUFPLEVBQWMsQ0FBQztRQWF6RCxJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUU7WUFDMUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1lBQzlDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ25DO1FBRUQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztJQUNwRCxDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksY0FBYztRQUNoQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELDJDQUEyQztJQUMzQyxJQUFJLGVBQWU7UUFDakIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLFdBQVc7UUFDYixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQU1EOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxNQUFtQjtRQUN4QixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVyRCx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN6RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsRDtRQUVELElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckM7UUFFRCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUUvQixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDeEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUMvQjtRQUVELHlGQUF5RjtRQUN6RiwyRkFBMkY7UUFDM0YsV0FBVztRQUNYLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQ2pELHFFQUFxRTtZQUNyRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2FBQ3ZCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7WUFDNUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQ3hCO1FBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUMzQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDaEU7UUFFRCxrRUFBa0U7UUFDbEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUV6QixnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUU7WUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1NBQ3hFO1FBRUQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTTtRQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDdkIsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXRCLGdGQUFnRjtRQUNoRix1RkFBdUY7UUFDdkYsOEZBQThGO1FBQzlGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFO1lBQzNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNqQztRQUVELElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN4QixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2hDO1FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRXJELDBDQUEwQztRQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXpCLHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXRDLG1GQUFtRjtRQUNuRixvRkFBb0Y7UUFDcEYsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsT0FBTyxnQkFBZ0IsQ0FBQztJQUMxQixDQUFDO0lBRUQsMENBQTBDO0lBQzFDLE9BQU87UUFDTCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFdEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDMUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2xDO1FBRUQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNwQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUVyQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUssQ0FBQztRQUUzRCxJQUFJLFVBQVUsRUFBRTtZQUNkLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDMUI7UUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxnREFBZ0Q7SUFDaEQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsd0VBQXdFO0lBQ3hFLGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDN0IsQ0FBQztJQUVELHdFQUF3RTtJQUN4RSxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQzNCLENBQUM7SUFFRCx3RUFBd0U7SUFDeEUsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBRUQscUVBQXFFO0lBQ3JFLGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDN0IsQ0FBQztJQUVELDBFQUEwRTtJQUMxRSxvQkFBb0I7UUFDbEIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUM7SUFDcEMsQ0FBQztJQUVELGtFQUFrRTtJQUNsRSxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRCwwRUFBMEU7SUFDMUUsY0FBYztRQUNaLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNoQztJQUNILENBQUM7SUFFRCw0RUFBNEU7SUFDNUUsc0JBQXNCLENBQUMsUUFBMEI7UUFDL0MsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ3ZDLE9BQU87U0FDUjtRQUVELElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNsQztRQUVELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxRQUFRLENBQUM7UUFFbEMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDdEIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDdkI7SUFDSCxDQUFDO0lBRUQsaURBQWlEO0lBQ2pELFVBQVUsQ0FBQyxVQUE2QjtRQUN0QyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsVUFBVSxFQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELGtEQUFrRDtJQUNsRCxZQUFZLENBQUMsR0FBK0I7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVELGtFQUFrRTtJQUNsRSxhQUFhLENBQUMsT0FBMEI7UUFDdEMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUM7SUFFRCx1RUFBdUU7SUFDdkUsZ0JBQWdCLENBQUMsT0FBMEI7UUFDekMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNqRDtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILFlBQVk7UUFDVixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUV6QyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE9BQU8sT0FBTyxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDckUsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxvQkFBb0IsQ0FBQyxRQUF3QjtRQUMzQyxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3JDLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO1FBRWhDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ25CO0lBQ0gsQ0FBQztJQUVELHVEQUF1RDtJQUMvQyx1QkFBdUI7UUFDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCwyRUFBMkU7SUFDbkUsa0JBQWtCO1FBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2YsT0FBTztTQUNSO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFFL0IsS0FBSyxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RELEtBQUssQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxLQUFLLENBQUMsUUFBUSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUQsS0FBSyxDQUFDLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlELEtBQUssQ0FBQyxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RCxLQUFLLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELCtEQUErRDtJQUN2RCxvQkFBb0IsQ0FBQyxhQUFzQjtRQUNqRCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMvRCxDQUFDO0lBRUQsNENBQTRDO0lBQ3BDLGVBQWU7UUFDckIsTUFBTSxZQUFZLEdBQUcsOEJBQThCLENBQUM7UUFFcEQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFNUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUM5QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUM5RTtRQUVELHdEQUF3RDtRQUN4RCxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFjLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUUscUZBQXFGO1FBQ3JGLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBRTVFLHFEQUFxRDtRQUNyRCxJQUFJLE9BQU8scUJBQXFCLEtBQUssV0FBVyxFQUFFO1lBQ2hELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUNsQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUU7b0JBQ3pCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO3dCQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDbkQ7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztTQUNKO2FBQU07WUFDTCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNuRDtJQUNILENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSyxvQkFBb0I7UUFDMUIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2hEO0lBQ0gsQ0FBQztJQUVELGtFQUFrRTtJQUNsRSxjQUFjO1FBQ1osTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFFL0MsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ3JCLE9BQU87U0FDUjtRQUVELElBQUksU0FBYyxDQUFDO1FBQ25CLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtZQUN4Qix5RUFBeUU7WUFDekUsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDcEIsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUMxRSxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3BFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2FBQ3pDO1lBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBaUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUMzRTtZQUVELFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUM7UUFFRixnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFFbEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDbEMsZ0JBQWlCLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3BFLENBQUMsQ0FBQyxDQUFDO1FBRUgsbUZBQW1GO1FBQ25GLDZFQUE2RTtRQUM3RSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztRQUU5QyxzRkFBc0Y7UUFDdEYsMkZBQTJGO1FBQzNGLDZCQUE2QjtRQUM3QixTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELHVFQUF1RTtJQUMvRCxjQUFjLENBQUMsT0FBb0IsRUFBRSxVQUE2QixFQUFFLEtBQWM7UUFDeEYsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFL0QsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQ2xCLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztTQUNsRjtJQUNILENBQUM7SUFFRCxrRUFBa0U7SUFDMUQsd0JBQXdCO1FBQzlCLGlGQUFpRjtRQUNqRix1RkFBdUY7UUFDdkYsZ0ZBQWdGO1FBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO1lBQ2xDLGdGQUFnRjtZQUNoRixrRkFBa0Y7WUFDbEYsMkNBQTJDO1lBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtpQkFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztpQkFDNUQsU0FBUyxDQUFDLEdBQUcsRUFBRTtnQkFDZCwwREFBMEQ7Z0JBQzFELDhEQUE4RDtnQkFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQ2xFLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTt3QkFDekMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO3FCQUNqRTtvQkFFRCxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUU7d0JBQzFDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQzt3QkFDcEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztxQkFDckI7b0JBRUQsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2lCQUM1QjtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQscUNBQXFDO0lBQzdCLHNCQUFzQjtRQUM1QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBRTVDLElBQUksY0FBYyxFQUFFO1lBQ2xCLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUV6QixJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3pCLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUN6QjtTQUNGO0lBQ0gsQ0FBQztJQUVELCtDQUErQztJQUN2QyxnQkFBZ0IsQ0FBQyxRQUE0QjtRQUNuRCxJQUFJLFFBQVEsRUFBRTtZQUNaLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUVsQixzRkFBc0Y7WUFDdEYsc0ZBQXNGO1lBQ3RGLHdEQUF3RDtZQUN4RCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxRQUFRLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7YUFDOUI7U0FDRjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Q29tcG9uZW50UG9ydGFsLCBQb3J0YWwsIFBvcnRhbE91dGxldCwgVGVtcGxhdGVQb3J0YWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtDb21wb25lbnRSZWYsIEVtYmVkZGVkVmlld1JlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7TG9jYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIG1lcmdlLCBTdWJzY3JpcHRpb25MaWtlLCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHt0YWtlLCB0YWtlVW50aWx9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7T3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcn0gZnJvbSAnLi9kaXNwYXRjaGVycy9vdmVybGF5LWtleWJvYXJkLWRpc3BhdGNoZXInO1xuaW1wb3J0IHtPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlcn0gZnJvbSAnLi9kaXNwYXRjaGVycy9vdmVybGF5LW91dHNpZGUtY2xpY2stZGlzcGF0Y2hlcic7XG5pbXBvcnQge092ZXJsYXlDb25maWd9IGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuaW1wb3J0IHtjb2VyY2VDc3NQaXhlbFZhbHVlLCBjb2VyY2VBcnJheX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2NvZXJjaW9uJztcbmltcG9ydCB7T3ZlcmxheVJlZmVyZW5jZX0gZnJvbSAnLi9vdmVybGF5LXJlZmVyZW5jZSc7XG5pbXBvcnQge1Bvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vcG9zaXRpb24vcG9zaXRpb24tc3RyYXRlZ3knO1xuaW1wb3J0IHtTY3JvbGxTdHJhdGVneX0gZnJvbSAnLi9zY3JvbGwnO1xuXG4vKiogQW4gb2JqZWN0IHdoZXJlIGFsbCBvZiBpdHMgcHJvcGVydGllcyBjYW5ub3QgYmUgd3JpdHRlbi4gKi9cbmV4cG9ydCB0eXBlIEltbXV0YWJsZU9iamVjdDxUPiA9IHtcbiAgcmVhZG9ubHkgW1AgaW4ga2V5b2YgVF06IFRbUF07XG59O1xuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhbiBvdmVybGF5IHRoYXQgaGFzIGJlZW4gY3JlYXRlZCB3aXRoIHRoZSBPdmVybGF5IHNlcnZpY2UuXG4gKiBVc2VkIHRvIG1hbmlwdWxhdGUgb3IgZGlzcG9zZSBvZiBzYWlkIG92ZXJsYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBPdmVybGF5UmVmIGltcGxlbWVudHMgUG9ydGFsT3V0bGV0LCBPdmVybGF5UmVmZXJlbmNlIHtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IF9iYWNrZHJvcENsaWNrID0gbmV3IFN1YmplY3Q8TW91c2VFdmVudD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYXR0YWNobWVudHMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXRhY2htZW50cyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIHByaXZhdGUgX3Bvc2l0aW9uU3RyYXRlZ3k6IFBvc2l0aW9uU3RyYXRlZ3kgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneSB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfbG9jYXRpb25DaGFuZ2VzOiBTdWJzY3JpcHRpb25MaWtlID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9iYWNrZHJvcENsaWNrSGFuZGxlciA9IChldmVudDogTW91c2VFdmVudCkgPT4gdGhpcy5fYmFja2Ryb3BDbGljay5uZXh0KGV2ZW50KTtcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBwYXJlbnQgb2YgdGhlIGBfaG9zdGAgYXQgdGhlIHRpbWUgaXQgd2FzIGRldGFjaGVkLiBVc2VkIHRvIHJlc3RvcmVcbiAgICogdGhlIGBfaG9zdGAgdG8gaXRzIG9yaWdpbmFsIHBvc2l0aW9uIGluIHRoZSBET00gd2hlbiBpdCBnZXRzIHJlLWF0dGFjaGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNIb3N0UGFyZW50OiBIVE1MRWxlbWVudDtcblxuICAvKiogU3RyZWFtIG9mIGtleWRvd24gZXZlbnRzIGRpc3BhdGNoZWQgdG8gdGhpcyBvdmVybGF5LiAqL1xuICByZWFkb25seSBfa2V5ZG93bkV2ZW50cyA9IG5ldyBTdWJqZWN0PEtleWJvYXJkRXZlbnQ+KCk7XG5cbiAgLyoqIFN0cmVhbSBvZiBtb3VzZSBvdXRzaWRlIGV2ZW50cyBkaXNwYXRjaGVkIHRvIHRoaXMgb3ZlcmxheS4gKi9cbiAgcmVhZG9ubHkgX291dHNpZGVQb2ludGVyRXZlbnRzID0gbmV3IFN1YmplY3Q8TW91c2VFdmVudD4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9wb3J0YWxPdXRsZXQ6IFBvcnRhbE91dGxldCxcbiAgICBwcml2YXRlIF9ob3N0OiBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9wYW5lOiBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIF9jb25maWc6IEltbXV0YWJsZU9iamVjdDxPdmVybGF5Q29uZmlnPixcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIF9rZXlib2FyZERpc3BhdGNoZXI6IE92ZXJsYXlLZXlib2FyZERpc3BhdGNoZXIsXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgIHByaXZhdGUgX2xvY2F0aW9uOiBMb2NhdGlvbixcbiAgICBwcml2YXRlIF9vdXRzaWRlQ2xpY2tEaXNwYXRjaGVyOiBPdmVybGF5T3V0c2lkZUNsaWNrRGlzcGF0Y2hlcixcbiAgKSB7XG4gICAgaWYgKF9jb25maWcuc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5ID0gX2NvbmZpZy5zY3JvbGxTdHJhdGVneTtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5ID0gX2NvbmZpZy5wb3NpdGlvblN0cmF0ZWd5O1xuICB9XG5cbiAgLyoqIFRoZSBvdmVybGF5J3MgSFRNTCBlbGVtZW50ICovXG4gIGdldCBvdmVybGF5RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3BhbmU7XG4gIH1cblxuICAvKiogVGhlIG92ZXJsYXkncyBiYWNrZHJvcCBIVE1MIGVsZW1lbnQuICovXG4gIGdldCBiYWNrZHJvcEVsZW1lbnQoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja2Ryb3BFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIHRoZSBwYW5lbCBlbGVtZW50LiBDYW4gYmUgdXNlZCBmb3IgYWR2YW5jZWRcbiAgICogcG9zaXRpb25pbmcgd2hlcmUgYSB3cmFwcGVyIHdpdGggc3BlY2lmaWMgc3R5bGluZyBpc1xuICAgKiByZXF1aXJlZCBhcm91bmQgdGhlIG92ZXJsYXkgcGFuZS5cbiAgICovXG4gIGdldCBob3N0RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3Q7XG4gIH1cblxuICBhdHRhY2g8VD4ocG9ydGFsOiBDb21wb25lbnRQb3J0YWw8VD4pOiBDb21wb25lbnRSZWY8VD47XG4gIGF0dGFjaDxUPihwb3J0YWw6IFRlbXBsYXRlUG9ydGFsPFQ+KTogRW1iZWRkZWRWaWV3UmVmPFQ+O1xuICBhdHRhY2gocG9ydGFsOiBhbnkpOiBhbnk7XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGNvbnRlbnQsIGdpdmVuIHZpYSBhIFBvcnRhbCwgdG8gdGhlIG92ZXJsYXkuXG4gICAqIElmIHRoZSBvdmVybGF5IGlzIGNvbmZpZ3VyZWQgdG8gaGF2ZSBhIGJhY2tkcm9wLCBpdCB3aWxsIGJlIGNyZWF0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBwb3J0YWwgUG9ydGFsIGluc3RhbmNlIHRvIHdoaWNoIHRvIGF0dGFjaCB0aGUgb3ZlcmxheS5cbiAgICogQHJldHVybnMgVGhlIHBvcnRhbCBhdHRhY2htZW50IHJlc3VsdC5cbiAgICovXG4gIGF0dGFjaChwb3J0YWw6IFBvcnRhbDxhbnk+KTogYW55IHtcbiAgICBsZXQgYXR0YWNoUmVzdWx0ID0gdGhpcy5fcG9ydGFsT3V0bGV0LmF0dGFjaChwb3J0YWwpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBwYW5lIGVsZW1lbnQgd2l0aCB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICBpZiAoIXRoaXMuX2hvc3QucGFyZW50RWxlbWVudCAmJiB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQpIHtcbiAgICAgIHRoaXMuX3ByZXZpb3VzSG9zdFBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLl9ob3N0KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlU3RhY2tpbmdPcmRlcigpO1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnRTaXplKCk7XG4gICAgdGhpcy5fdXBkYXRlRWxlbWVudERpcmVjdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuX3Njcm9sbFN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5lbmFibGUoKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHBvc2l0aW9uIG9uY2UgdGhlIHpvbmUgaXMgc3RhYmxlIHNvIHRoYXQgdGhlIG92ZXJsYXkgd2lsbCBiZSBmdWxseSByZW5kZXJlZFxuICAgIC8vIGJlZm9yZSBhdHRlbXB0aW5nIHRvIHBvc2l0aW9uIGl0LCBhcyB0aGUgcG9zaXRpb24gbWF5IGRlcGVuZCBvbiB0aGUgc2l6ZSBvZiB0aGUgcmVuZGVyZWRcbiAgICAvLyBjb250ZW50LlxuICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5waXBlKHRha2UoMSkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAvLyBUaGUgb3ZlcmxheSBjb3VsZCd2ZSBiZWVuIGRldGFjaGVkIGJlZm9yZSB0aGUgem9uZSBoYXMgc3RhYmlsaXplZC5cbiAgICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRW5hYmxlIHBvaW50ZXIgZXZlbnRzIGZvciB0aGUgb3ZlcmxheSBwYW5lIGVsZW1lbnQuXG4gICAgdGhpcy5fdG9nZ2xlUG9pbnRlckV2ZW50cyh0cnVlKTtcblxuICAgIGlmICh0aGlzLl9jb25maWcuaGFzQmFja2Ryb3ApIHtcbiAgICAgIHRoaXMuX2F0dGFjaEJhY2tkcm9wKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5wYW5lbENsYXNzKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIHRoaXMuX2NvbmZpZy5wYW5lbENsYXNzLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGVtaXQgdGhlIGBhdHRhY2htZW50c2AgZXZlbnQgb25jZSBhbGwgb3RoZXIgc2V0dXAgaXMgZG9uZS5cbiAgICB0aGlzLl9hdHRhY2htZW50cy5uZXh0KCk7XG5cbiAgICAvLyBUcmFjayB0aGlzIG92ZXJsYXkgYnkgdGhlIGtleWJvYXJkIGRpc3BhdGNoZXJcbiAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIuYWRkKHRoaXMpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5kaXNwb3NlT25OYXZpZ2F0aW9uKSB7XG4gICAgICB0aGlzLl9sb2NhdGlvbkNoYW5nZXMgPSB0aGlzLl9sb2NhdGlvbi5zdWJzY3JpYmUoKCkgPT4gdGhpcy5kaXNwb3NlKCkpO1xuICAgIH1cblxuICAgIHRoaXMuX291dHNpZGVDbGlja0Rpc3BhdGNoZXIuYWRkKHRoaXMpO1xuICAgIHJldHVybiBhdHRhY2hSZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgYW4gb3ZlcmxheSBmcm9tIGEgcG9ydGFsLlxuICAgKiBAcmV0dXJucyBUaGUgcG9ydGFsIGRldGFjaG1lbnQgcmVzdWx0LlxuICAgKi9cbiAgZGV0YWNoKCk6IGFueSB7XG4gICAgaWYgKCF0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRldGFjaEJhY2tkcm9wKCk7XG5cbiAgICAvLyBXaGVuIHRoZSBvdmVybGF5IGlzIGRldGFjaGVkLCB0aGUgcGFuZSBlbGVtZW50IHNob3VsZCBkaXNhYmxlIHBvaW50ZXIgZXZlbnRzLlxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb3RoZXJ3aXNlIHRoZSBwYW5lIGVsZW1lbnQgd2lsbCBjb3ZlciB0aGUgcGFnZSBhbmQgZGlzYWJsZVxuICAgIC8vIHBvaW50ZXIgZXZlbnRzIHRoZXJlZm9yZS4gRGVwZW5kcyBvbiB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgYW5kIHRoZSBhcHBsaWVkIHBhbmUgYm91bmRhcmllcy5cbiAgICB0aGlzLl90b2dnbGVQb2ludGVyRXZlbnRzKGZhbHNlKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5ICYmIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGV0YWNoKSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRldGFjaCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuZGlzYWJsZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRldGFjaG1lbnRSZXN1bHQgPSB0aGlzLl9wb3J0YWxPdXRsZXQuZGV0YWNoKCk7XG5cbiAgICAvLyBPbmx5IGVtaXQgYWZ0ZXIgZXZlcnl0aGluZyBpcyBkZXRhY2hlZC5cbiAgICB0aGlzLl9kZXRhY2htZW50cy5uZXh0KCk7XG5cbiAgICAvLyBSZW1vdmUgdGhpcyBvdmVybGF5IGZyb20ga2V5Ym9hcmQgZGlzcGF0Y2hlciB0cmFja2luZy5cbiAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuXG4gICAgLy8gS2VlcGluZyB0aGUgaG9zdCBlbGVtZW50IGluIHRoZSBET00gY2FuIGNhdXNlIHNjcm9sbCBqYW5rLCBiZWNhdXNlIGl0IHN0aWxsIGdldHNcbiAgICAvLyByZW5kZXJlZCwgZXZlbiB0aG91Z2ggaXQncyB0cmFuc3BhcmVudCBhbmQgdW5jbGlja2FibGUgd2hpY2ggaXMgd2h5IHdlIHJlbW92ZSBpdC5cbiAgICB0aGlzLl9kZXRhY2hDb250ZW50V2hlblN0YWJsZSgpO1xuICAgIHRoaXMuX2xvY2F0aW9uQ2hhbmdlcy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX291dHNpZGVDbGlja0Rpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuICAgIHJldHVybiBkZXRhY2htZW50UmVzdWx0O1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgb3ZlcmxheSBmcm9tIHRoZSBET00uICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgY29uc3QgaXNBdHRhY2hlZCA9IHRoaXMuaGFzQXR0YWNoZWQoKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kaXNwb3NlU2Nyb2xsU3RyYXRlZ3koKTtcbiAgICB0aGlzLl9kaXNwb3NlQmFja2Ryb3AodGhpcy5fYmFja2Ryb3BFbGVtZW50KTtcbiAgICB0aGlzLl9sb2NhdGlvbkNoYW5nZXMudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuX3BvcnRhbE91dGxldC5kaXNwb3NlKCk7XG4gICAgdGhpcy5fYXR0YWNobWVudHMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9iYWNrZHJvcENsaWNrLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fa2V5ZG93bkV2ZW50cy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX291dHNpZGVQb2ludGVyRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlci5yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5faG9zdD8ucmVtb3ZlKCk7XG5cbiAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQgPSB0aGlzLl9wYW5lID0gdGhpcy5faG9zdCA9IG51bGwhO1xuXG4gICAgaWYgKGlzQXR0YWNoZWQpIHtcbiAgICAgIHRoaXMuX2RldGFjaG1lbnRzLm5leHQoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXRhY2htZW50cy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgaGFzIGF0dGFjaGVkIGNvbnRlbnQuICovXG4gIGhhc0F0dGFjaGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9wb3J0YWxPdXRsZXQuaGFzQXR0YWNoZWQoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBiYWNrZHJvcCBoYXMgYmVlbiBjbGlja2VkLiAqL1xuICBiYWNrZHJvcENsaWNrKCk6IE9ic2VydmFibGU8TW91c2VFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9iYWNrZHJvcENsaWNrO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gYXR0YWNoZWQuICovXG4gIGF0dGFjaG1lbnRzKCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2htZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGRldGFjaGVkLiAqL1xuICBkZXRhY2htZW50cygpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fZGV0YWNobWVudHM7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIG9mIGtleWRvd24gZXZlbnRzIHRhcmdldGVkIHRvIHRoaXMgb3ZlcmxheS4gKi9cbiAga2V5ZG93bkV2ZW50cygpOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fa2V5ZG93bkV2ZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgb2YgcG9pbnRlciBldmVudHMgdGFyZ2V0ZWQgb3V0c2lkZSB0aGlzIG92ZXJsYXkuICovXG4gIG91dHNpZGVQb2ludGVyRXZlbnRzKCk6IE9ic2VydmFibGU8TW91c2VFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9vdXRzaWRlUG9pbnRlckV2ZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjdXJyZW50IG92ZXJsYXkgY29uZmlndXJhdGlvbiwgd2hpY2ggaXMgaW1tdXRhYmxlLiAqL1xuICBnZXRDb25maWcoKTogT3ZlcmxheUNvbmZpZyB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheSBiYXNlZCBvbiB0aGUgcG9zaXRpb24gc3RyYXRlZ3kuICovXG4gIHVwZGF0ZVBvc2l0aW9uKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmFwcGx5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN3aXRjaGVzIHRvIGEgbmV3IHBvc2l0aW9uIHN0cmF0ZWd5IGFuZCB1cGRhdGVzIHRoZSBvdmVybGF5IHBvc2l0aW9uLiAqL1xuICB1cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHN0cmF0ZWd5OiBQb3NpdGlvblN0cmF0ZWd5KTogdm9pZCB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBzaXplIHByb3BlcnRpZXMgb2YgdGhlIG92ZXJsYXkuICovXG4gIHVwZGF0ZVNpemUoc2l6ZUNvbmZpZzogT3ZlcmxheVNpemVDb25maWcpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25maWcgPSB7Li4udGhpcy5fY29uZmlnLCAuLi5zaXplQ29uZmlnfTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50U2l6ZSgpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIExUUi9SVEwgZGlyZWN0aW9uIGZvciB0aGUgb3ZlcmxheS4gKi9cbiAgc2V0RGlyZWN0aW9uKGRpcjogRGlyZWN0aW9uIHwgRGlyZWN0aW9uYWxpdHkpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25maWcgPSB7Li4udGhpcy5fY29uZmlnLCBkaXJlY3Rpb246IGRpcn07XG4gICAgdGhpcy5fdXBkYXRlRWxlbWVudERpcmVjdGlvbigpO1xuICB9XG5cbiAgLyoqIEFkZCBhIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIHRvIHRoZSBvdmVybGF5IHBhbmUuICovXG4gIGFkZFBhbmVsQ2xhc3MoY2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCBjbGFzc2VzLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlIGEgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgZnJvbSB0aGUgb3ZlcmxheSBwYW5lLiAqL1xuICByZW1vdmVQYW5lbENsYXNzKGNsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fcGFuZSwgY2xhc3NlcywgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBvdmVybGF5IHBhbmVsLlxuICAgKi9cbiAgZ2V0RGlyZWN0aW9uKCk6IERpcmVjdGlvbiB7XG4gICAgY29uc3QgZGlyZWN0aW9uID0gdGhpcy5fY29uZmlnLmRpcmVjdGlvbjtcblxuICAgIGlmICghZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gJ2x0cic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBkaXJlY3Rpb24gPT09ICdzdHJpbmcnID8gZGlyZWN0aW9uIDogZGlyZWN0aW9uLnZhbHVlO1xuICB9XG5cbiAgLyoqIFN3aXRjaGVzIHRvIGEgbmV3IHNjcm9sbCBzdHJhdGVneS4gKi9cbiAgdXBkYXRlU2Nyb2xsU3RyYXRlZ3koc3RyYXRlZ3k6IFNjcm9sbFN0cmF0ZWd5KTogdm9pZCB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSB0aGlzLl9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2Rpc3Bvc2VTY3JvbGxTdHJhdGVneSgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5ID0gc3RyYXRlZ3k7XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICBzdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgICBzdHJhdGVneS5lbmFibGUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgdGV4dCBkaXJlY3Rpb24gb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX3VwZGF0ZUVsZW1lbnREaXJlY3Rpb24oKSB7XG4gICAgdGhpcy5faG9zdC5zZXRBdHRyaWJ1dGUoJ2RpcicsIHRoaXMuZ2V0RGlyZWN0aW9uKCkpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHNpemUgb2YgdGhlIG92ZXJsYXkgZWxlbWVudCBiYXNlZCBvbiB0aGUgb3ZlcmxheSBjb25maWcuICovXG4gIHByaXZhdGUgX3VwZGF0ZUVsZW1lbnRTaXplKCkge1xuICAgIGlmICghdGhpcy5fcGFuZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlID0gdGhpcy5fcGFuZS5zdHlsZTtcblxuICAgIHN0eWxlLndpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcud2lkdGgpO1xuICAgIHN0eWxlLmhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLmhlaWdodCk7XG4gICAgc3R5bGUubWluV2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5taW5XaWR0aCk7XG4gICAgc3R5bGUubWluSGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcubWluSGVpZ2h0KTtcbiAgICBzdHlsZS5tYXhXaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1heFdpZHRoKTtcbiAgICBzdHlsZS5tYXhIZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5tYXhIZWlnaHQpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIHBvaW50ZXIgZXZlbnRzIGZvciB0aGUgb3ZlcmxheSBwYW5lIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3RvZ2dsZVBvaW50ZXJFdmVudHMoZW5hYmxlUG9pbnRlcjogYm9vbGVhbikge1xuICAgIHRoaXMuX3BhbmUuc3R5bGUucG9pbnRlckV2ZW50cyA9IGVuYWJsZVBvaW50ZXIgPyAnJyA6ICdub25lJztcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyBhIGJhY2tkcm9wIGZvciB0aGlzIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2F0dGFjaEJhY2tkcm9wKCkge1xuICAgIGNvbnN0IHNob3dpbmdDbGFzcyA9ICdjZGstb3ZlcmxheS1iYWNrZHJvcC1zaG93aW5nJztcblxuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjZGstb3ZlcmxheS1iYWNrZHJvcCcpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5iYWNrZHJvcENsYXNzKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX2JhY2tkcm9wRWxlbWVudCwgdGhpcy5fY29uZmlnLmJhY2tkcm9wQ2xhc3MsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIEluc2VydCB0aGUgYmFja2Ryb3AgYmVmb3JlIHRoZSBwYW5lIGluIHRoZSBET00gb3JkZXIsXG4gICAgLy8gaW4gb3JkZXIgdG8gaGFuZGxlIHN0YWNrZWQgb3ZlcmxheXMgcHJvcGVybHkuXG4gICAgdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUodGhpcy5fYmFja2Ryb3BFbGVtZW50LCB0aGlzLl9ob3N0KTtcblxuICAgIC8vIEZvcndhcmQgYmFja2Ryb3AgY2xpY2tzIHN1Y2ggdGhhdCB0aGUgY29uc3VtZXIgb2YgdGhlIG92ZXJsYXkgY2FuIHBlcmZvcm0gd2hhdGV2ZXJcbiAgICAvLyBhY3Rpb24gZGVzaXJlZCB3aGVuIHN1Y2ggYSBjbGljayBvY2N1cnMgKHVzdWFsbHkgY2xvc2luZyB0aGUgb3ZlcmxheSkuXG4gICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fYmFja2Ryb3BDbGlja0hhbmRsZXIpO1xuXG4gICAgLy8gQWRkIGNsYXNzIHRvIGZhZGUtaW4gdGhlIGJhY2tkcm9wIGFmdGVyIG9uZSBmcmFtZS5cbiAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuX2JhY2tkcm9wRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoc2hvd2luZ0NsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKHNob3dpbmdDbGFzcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHN0YWNraW5nIG9yZGVyIG9mIHRoZSBlbGVtZW50LCBtb3ZpbmcgaXQgdG8gdGhlIHRvcCBpZiBuZWNlc3NhcnkuXG4gICAqIFRoaXMgaXMgcmVxdWlyZWQgaW4gY2FzZXMgd2hlcmUgb25lIG92ZXJsYXkgd2FzIGRldGFjaGVkLCB3aGlsZSBhbm90aGVyIG9uZSxcbiAgICogdGhhdCBzaG91bGQgYmUgYmVoaW5kIGl0LCB3YXMgZGVzdHJveWVkLiBUaGUgbmV4dCB0aW1lIGJvdGggb2YgdGhlbSBhcmUgb3BlbmVkLFxuICAgKiB0aGUgc3RhY2tpbmcgd2lsbCBiZSB3cm9uZywgYmVjYXVzZSB0aGUgZGV0YWNoZWQgZWxlbWVudCdzIHBhbmUgd2lsbCBzdGlsbCBiZVxuICAgKiBpbiBpdHMgb3JpZ2luYWwgRE9NIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlU3RhY2tpbmdPcmRlcigpIHtcbiAgICBpZiAodGhpcy5faG9zdC5uZXh0U2libGluZykge1xuICAgICAgdGhpcy5faG9zdC5wYXJlbnROb2RlIS5hcHBlbmRDaGlsZCh0aGlzLl9ob3N0KTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGJhY2tkcm9wIChpZiBhbnkpIGFzc29jaWF0ZWQgd2l0aCB0aGUgb3ZlcmxheS4gKi9cbiAgZGV0YWNoQmFja2Ryb3AoKTogdm9pZCB7XG4gICAgY29uc3QgYmFja2Ryb3BUb0RldGFjaCA9IHRoaXMuX2JhY2tkcm9wRWxlbWVudDtcblxuICAgIGlmICghYmFja2Ryb3BUb0RldGFjaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB0aW1lb3V0SWQ6IGFueTtcbiAgICBjb25zdCBmaW5pc2hEZXRhY2ggPSAoKSA9PiB7XG4gICAgICAvLyBJdCBtYXkgbm90IGJlIGF0dGFjaGVkIHRvIGFueXRoaW5nIGluIGNlcnRhaW4gY2FzZXMgKGUuZy4gdW5pdCB0ZXN0cykuXG4gICAgICBpZiAoYmFja2Ryb3BUb0RldGFjaCkge1xuICAgICAgICBiYWNrZHJvcFRvRGV0YWNoLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fYmFja2Ryb3BDbGlja0hhbmRsZXIpO1xuICAgICAgICBiYWNrZHJvcFRvRGV0YWNoLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmaW5pc2hEZXRhY2gpO1xuICAgICAgICB0aGlzLl9kaXNwb3NlQmFja2Ryb3AoYmFja2Ryb3BUb0RldGFjaCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9jb25maWcuYmFja2Ryb3BDbGFzcykge1xuICAgICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKGJhY2tkcm9wVG9EZXRhY2ghLCB0aGlzLl9jb25maWcuYmFja2Ryb3BDbGFzcywgZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9O1xuXG4gICAgYmFja2Ryb3BUb0RldGFjaC5jbGFzc0xpc3QucmVtb3ZlKCdjZGstb3ZlcmxheS1iYWNrZHJvcC1zaG93aW5nJyk7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgYmFja2Ryb3BUb0RldGFjaCEuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZpbmlzaERldGFjaCk7XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGUgYmFja2Ryb3AgZG9lc24ndCBoYXZlIGEgdHJhbnNpdGlvbiwgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB3b24ndCBmaXJlLlxuICAgIC8vIEluIHRoaXMgY2FzZSB3ZSBtYWtlIGl0IHVuY2xpY2thYmxlIGFuZCB3ZSB0cnkgdG8gcmVtb3ZlIGl0IGFmdGVyIGEgZGVsYXkuXG4gICAgYmFja2Ryb3BUb0RldGFjaC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuXG4gICAgLy8gUnVuIHRoaXMgb3V0c2lkZSB0aGUgQW5ndWxhciB6b25lIGJlY2F1c2UgdGhlcmUncyBub3RoaW5nIHRoYXQgQW5ndWxhciBjYXJlcyBhYm91dC5cbiAgICAvLyBJZiBpdCB3ZXJlIHRvIHJ1biBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZSwgZXZlcnkgdGVzdCB0aGF0IHVzZWQgT3ZlcmxheSB3b3VsZCBoYXZlIHRvIGJlXG4gICAgLy8gZWl0aGVyIGFzeW5jIG9yIGZha2VBc3luYy5cbiAgICB0aW1lb3V0SWQgPSB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gc2V0VGltZW91dChmaW5pc2hEZXRhY2gsIDUwMCkpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgYSBzaW5nbGUgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgb24gYW4gZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfdG9nZ2xlQ2xhc3NlcyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY3NzQ2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10sIGlzQWRkOiBib29sZWFuKSB7XG4gICAgY29uc3QgY2xhc3NlcyA9IGNvZXJjZUFycmF5KGNzc0NsYXNzZXMgfHwgW10pLmZpbHRlcihjID0+ICEhYyk7XG5cbiAgICBpZiAoY2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgIGlzQWRkID8gZWxlbWVudC5jbGFzc0xpc3QuYWRkKC4uLmNsYXNzZXMpIDogZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKC4uLmNsYXNzZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgb3ZlcmxheSBjb250ZW50IG5leHQgdGltZSB0aGUgem9uZSBzdGFiaWxpemVzLiAqL1xuICBwcml2YXRlIF9kZXRhY2hDb250ZW50V2hlblN0YWJsZSgpIHtcbiAgICAvLyBOb3JtYWxseSB3ZSB3b3VsZG4ndCBoYXZlIHRvIGV4cGxpY2l0bHkgcnVuIHRoaXMgb3V0c2lkZSB0aGUgYE5nWm9uZWAsIGhvd2V2ZXJcbiAgICAvLyBpZiB0aGUgY29uc3VtZXIgaXMgdXNpbmcgYHpvbmUtcGF0Y2gtcnhqc2AsIHRoZSBgU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlYCBjYWxsIHdpbGxcbiAgICAvLyBiZSBwYXRjaGVkIHRvIHJ1biBpbnNpZGUgdGhlIHpvbmUsIHdoaWNoIHdpbGwgdGhyb3cgdXMgaW50byBhbiBpbmZpbml0ZSBsb29wLlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAvLyBXZSBjYW4ndCByZW1vdmUgdGhlIGhvc3QgaGVyZSBpbW1lZGlhdGVseSwgYmVjYXVzZSB0aGUgb3ZlcmxheSBwYW5lJ3MgY29udGVudFxuICAgICAgLy8gbWlnaHQgc3RpbGwgYmUgYW5pbWF0aW5nLiBUaGlzIHN0cmVhbSBoZWxwcyB1cyBhdm9pZCBpbnRlcnJ1cHRpbmcgdGhlIGFuaW1hdGlvblxuICAgICAgLy8gYnkgd2FpdGluZyBmb3IgdGhlIHBhbmUgdG8gYmVjb21lIGVtcHR5LlxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gdGhpcy5fbmdab25lLm9uU3RhYmxlXG4gICAgICAgIC5waXBlKHRha2VVbnRpbChtZXJnZSh0aGlzLl9hdHRhY2htZW50cywgdGhpcy5fZGV0YWNobWVudHMpKSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgLy8gTmVlZHMgYSBjb3VwbGUgb2YgY2hlY2tzIGZvciB0aGUgcGFuZSBhbmQgaG9zdCwgYmVjYXVzZVxuICAgICAgICAgIC8vIHRoZXkgbWF5IGhhdmUgYmVlbiByZW1vdmVkIGJ5IHRoZSB0aW1lIHRoZSB6b25lIHN0YWJpbGl6ZXMuXG4gICAgICAgICAgaWYgKCF0aGlzLl9wYW5lIHx8ICF0aGlzLl9ob3N0IHx8IHRoaXMuX3BhbmUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcGFuZSAmJiB0aGlzLl9jb25maWcucGFuZWxDbGFzcykge1xuICAgICAgICAgICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIHRoaXMuX2NvbmZpZy5wYW5lbENsYXNzLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ob3N0ICYmIHRoaXMuX2hvc3QucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQgPSB0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgIHRoaXMuX2hvc3QucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogRGlzcG9zZXMgb2YgYSBzY3JvbGwgc3RyYXRlZ3kuICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VTY3JvbGxTdHJhdGVneSgpIHtcbiAgICBjb25zdCBzY3JvbGxTdHJhdGVneSA9IHRoaXMuX3Njcm9sbFN0cmF0ZWd5O1xuXG4gICAgaWYgKHNjcm9sbFN0cmF0ZWd5KSB7XG4gICAgICBzY3JvbGxTdHJhdGVneS5kaXNhYmxlKCk7XG5cbiAgICAgIGlmIChzY3JvbGxTdHJhdGVneS5kZXRhY2gpIHtcbiAgICAgICAgc2Nyb2xsU3RyYXRlZ3kuZGV0YWNoKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgYSBiYWNrZHJvcCBlbGVtZW50IGZyb20gdGhlIERPTS4gKi9cbiAgcHJpdmF0ZSBfZGlzcG9zZUJhY2tkcm9wKGJhY2tkcm9wOiBIVE1MRWxlbWVudCB8IG51bGwpIHtcbiAgICBpZiAoYmFja2Ryb3ApIHtcbiAgICAgIGJhY2tkcm9wLnJlbW92ZSgpO1xuXG4gICAgICAvLyBJdCBpcyBwb3NzaWJsZSB0aGF0IGEgbmV3IHBvcnRhbCBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGlzIG92ZXJsYXkgc2luY2Ugd2Ugc3RhcnRlZFxuICAgICAgLy8gcmVtb3ZpbmcgdGhlIGJhY2tkcm9wLiBJZiB0aGF0IGlzIHRoZSBjYXNlLCBvbmx5IGNsZWFyIHRoZSBiYWNrZHJvcCByZWZlcmVuY2UgaWYgaXRcbiAgICAgIC8vIGlzIHN0aWxsIHRoZSBzYW1lIGluc3RhbmNlIHRoYXQgd2Ugc3RhcnRlZCB0byByZW1vdmUuXG4gICAgICBpZiAodGhpcy5fYmFja2Ryb3BFbGVtZW50ID09PSBiYWNrZHJvcCkge1xuICAgICAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogU2l6ZSBwcm9wZXJ0aWVzIGZvciBhbiBvdmVybGF5LiAqL1xuZXhwb3J0IGludGVyZmFjZSBPdmVybGF5U2l6ZUNvbmZpZyB7XG4gIHdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBoZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1pbldpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBtaW5IZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1heFdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBtYXhIZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG59XG4iXX0=