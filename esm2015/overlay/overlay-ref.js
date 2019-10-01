/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable, Subject, merge, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { coerceCssPixelValue, coerceArray } from '@angular/cdk/coercion';
/**
 * Reference to an overlay that has been created with the Overlay service.
 * Used to manipulate or dispose of said overlay.
 */
export class OverlayRef {
    /**
     * @param {?} _portalOutlet
     * @param {?} _host
     * @param {?} _pane
     * @param {?} _config
     * @param {?} _ngZone
     * @param {?} _keyboardDispatcher
     * @param {?} _document
     * @param {?=} _location
     */
    constructor(_portalOutlet, _host, _pane, _config, _ngZone, _keyboardDispatcher, _document, _location) {
        this._portalOutlet = _portalOutlet;
        this._host = _host;
        this._pane = _pane;
        this._config = _config;
        this._ngZone = _ngZone;
        this._keyboardDispatcher = _keyboardDispatcher;
        this._document = _document;
        this._location = _location;
        this._backdropElement = null;
        this._backdropClick = new Subject();
        this._attachments = new Subject();
        this._detachments = new Subject();
        this._locationChanges = Subscription.EMPTY;
        this._backdropClickHandler = (/**
         * @param {?} event
         * @return {?}
         */
        (event) => this._backdropClick.next(event));
        this._keydownEventsObservable = new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => {
            /** @type {?} */
            const subscription = this._keydownEvents.subscribe(observer);
            this._keydownEventSubscriptions++;
            return (/**
             * @return {?}
             */
            () => {
                subscription.unsubscribe();
                this._keydownEventSubscriptions--;
            });
        }));
        /**
         * Stream of keydown events dispatched to this overlay.
         */
        this._keydownEvents = new Subject();
        /**
         * Amount of subscriptions to the keydown events.
         */
        this._keydownEventSubscriptions = 0;
        if (_config.scrollStrategy) {
            this._scrollStrategy = _config.scrollStrategy;
            this._scrollStrategy.attach(this);
        }
        this._positionStrategy = _config.positionStrategy;
    }
    /**
     * The overlay's HTML element
     * @return {?}
     */
    get overlayElement() {
        return this._pane;
    }
    /**
     * The overlay's backdrop HTML element.
     * @return {?}
     */
    get backdropElement() {
        return this._backdropElement;
    }
    /**
     * Wrapper around the panel element. Can be used for advanced
     * positioning where a wrapper with specific styling is
     * required around the overlay pane.
     * @return {?}
     */
    get hostElement() {
        return this._host;
    }
    /**
     * Attaches content, given via a Portal, to the overlay.
     * If the overlay is configured to have a backdrop, it will be created.
     *
     * @param {?} portal Portal instance to which to attach the overlay.
     * @return {?} The portal attachment result.
     */
    attach(portal) {
        /** @type {?} */
        let attachResult = this._portalOutlet.attach(portal);
        if (this._positionStrategy) {
            this._positionStrategy.attach(this);
        }
        // Update the pane element with the given configuration.
        if (!this._host.parentElement && this._previousHostParent) {
            this._previousHostParent.appendChild(this._host);
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
            .asObservable()
            .pipe(take(1))
            .subscribe((/**
         * @return {?}
         */
        () => {
            // The overlay could've been detached before the zone has stabilized.
            if (this.hasAttached()) {
                this.updatePosition();
            }
        }));
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
        // @breaking-change 8.0.0 remove the null check for `_location`
        // once the constructor parameter is made required.
        if (this._config.disposeOnNavigation && this._location) {
            this._locationChanges = this._location.subscribe((/**
             * @return {?}
             */
            () => this.dispose()));
        }
        return attachResult;
    }
    /**
     * Detaches an overlay from a portal.
     * @return {?} The portal detachment result.
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
        /** @type {?} */
        const detachmentResult = this._portalOutlet.detach();
        // Only emit after everything is detached.
        this._detachments.next();
        // Remove this overlay from keyboard dispatcher tracking.
        this._keyboardDispatcher.remove(this);
        // Keeping the host element in DOM the can cause scroll jank, because it still gets
        // rendered, even though it's transparent and unclickable which is why we remove it.
        this._detachContentWhenStable();
        // Stop listening for location changes.
        this._locationChanges.unsubscribe();
        return detachmentResult;
    }
    /**
     * Cleans up the overlay from the DOM.
     * @return {?}
     */
    dispose() {
        /** @type {?} */
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
        if (this._host && this._host.parentNode) {
            this._host.parentNode.removeChild(this._host);
            this._host = (/** @type {?} */ (null));
        }
        this._previousHostParent = this._pane = (/** @type {?} */ (null));
        if (isAttached) {
            this._detachments.next();
        }
        this._detachments.complete();
    }
    /**
     * Whether the overlay has attached content.
     * @return {?}
     */
    hasAttached() {
        return this._portalOutlet.hasAttached();
    }
    /**
     * Gets an observable that emits when the backdrop has been clicked.
     * @return {?}
     */
    backdropClick() {
        return this._backdropClick.asObservable();
    }
    /**
     * Gets an observable that emits when the overlay has been attached.
     * @return {?}
     */
    attachments() {
        return this._attachments.asObservable();
    }
    /**
     * Gets an observable that emits when the overlay has been detached.
     * @return {?}
     */
    detachments() {
        return this._detachments.asObservable();
    }
    /**
     * Gets an observable of keydown events targeted to this overlay.
     * @return {?}
     */
    keydownEvents() {
        return this._keydownEventsObservable;
    }
    /**
     * Gets the current overlay configuration, which is immutable.
     * @return {?}
     */
    getConfig() {
        return this._config;
    }
    /**
     * Updates the position of the overlay based on the position strategy.
     * @return {?}
     */
    updatePosition() {
        if (this._positionStrategy) {
            this._positionStrategy.apply();
        }
    }
    /**
     * Switches to a new position strategy and updates the overlay position.
     * @param {?} strategy
     * @return {?}
     */
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
    /**
     * Update the size properties of the overlay.
     * @param {?} sizeConfig
     * @return {?}
     */
    updateSize(sizeConfig) {
        this._config = Object.assign({}, this._config, sizeConfig);
        this._updateElementSize();
    }
    /**
     * Sets the LTR/RTL direction for the overlay.
     * @param {?} dir
     * @return {?}
     */
    setDirection(dir) {
        this._config = Object.assign({}, this._config, { direction: dir });
        this._updateElementDirection();
    }
    /**
     * Add a CSS class or an array of classes to the overlay pane.
     * @param {?} classes
     * @return {?}
     */
    addPanelClass(classes) {
        if (this._pane) {
            this._toggleClasses(this._pane, classes, true);
        }
    }
    /**
     * Remove a CSS class or an array of classes from the overlay pane.
     * @param {?} classes
     * @return {?}
     */
    removePanelClass(classes) {
        if (this._pane) {
            this._toggleClasses(this._pane, classes, false);
        }
    }
    /**
     * Returns the layout direction of the overlay panel.
     * @return {?}
     */
    getDirection() {
        /** @type {?} */
        const direction = this._config.direction;
        if (!direction) {
            return 'ltr';
        }
        return typeof direction === 'string' ? direction : direction.value;
    }
    /**
     * Switches to a new scroll strategy.
     * @param {?} strategy
     * @return {?}
     */
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
    /**
     * Updates the text direction of the overlay panel.
     * @private
     * @return {?}
     */
    _updateElementDirection() {
        this._host.setAttribute('dir', this.getDirection());
    }
    /**
     * Updates the size of the overlay element based on the overlay config.
     * @private
     * @return {?}
     */
    _updateElementSize() {
        if (!this._pane) {
            return;
        }
        /** @type {?} */
        const style = this._pane.style;
        style.width = coerceCssPixelValue(this._config.width);
        style.height = coerceCssPixelValue(this._config.height);
        style.minWidth = coerceCssPixelValue(this._config.minWidth);
        style.minHeight = coerceCssPixelValue(this._config.minHeight);
        style.maxWidth = coerceCssPixelValue(this._config.maxWidth);
        style.maxHeight = coerceCssPixelValue(this._config.maxHeight);
    }
    /**
     * Toggles the pointer events for the overlay pane element.
     * @private
     * @param {?} enablePointer
     * @return {?}
     */
    _togglePointerEvents(enablePointer) {
        this._pane.style.pointerEvents = enablePointer ? 'auto' : 'none';
    }
    /**
     * Attaches a backdrop for this overlay.
     * @private
     * @return {?}
     */
    _attachBackdrop() {
        /** @type {?} */
        const showingClass = 'cdk-overlay-backdrop-showing';
        this._backdropElement = this._document.createElement('div');
        this._backdropElement.classList.add('cdk-overlay-backdrop');
        if (this._config.backdropClass) {
            this._toggleClasses(this._backdropElement, this._config.backdropClass, true);
        }
        // Insert the backdrop before the pane in the DOM order,
        // in order to handle stacked overlays properly.
        (/** @type {?} */ (this._host.parentElement)).insertBefore(this._backdropElement, this._host);
        // Forward backdrop clicks such that the consumer of the overlay can perform whatever
        // action desired when such a click occurs (usually closing the overlay).
        this._backdropElement.addEventListener('click', this._backdropClickHandler);
        // Add class to fade-in the backdrop after one frame.
        if (typeof requestAnimationFrame !== 'undefined') {
            this._ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                requestAnimationFrame((/**
                 * @return {?}
                 */
                () => {
                    if (this._backdropElement) {
                        this._backdropElement.classList.add(showingClass);
                    }
                }));
            }));
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
     * @private
     * @return {?}
     */
    _updateStackingOrder() {
        if (this._host.nextSibling) {
            (/** @type {?} */ (this._host.parentNode)).appendChild(this._host);
        }
    }
    /**
     * Detaches the backdrop (if any) associated with the overlay.
     * @return {?}
     */
    detachBackdrop() {
        /** @type {?} */
        let backdropToDetach = this._backdropElement;
        if (!backdropToDetach) {
            return;
        }
        /** @type {?} */
        let timeoutId;
        /** @type {?} */
        let finishDetach = (/**
         * @return {?}
         */
        () => {
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
                this._toggleClasses((/** @type {?} */ (backdropToDetach)), this._config.backdropClass, false);
            }
            clearTimeout(timeoutId);
        });
        backdropToDetach.classList.remove('cdk-overlay-backdrop-showing');
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            (/** @type {?} */ (backdropToDetach)).addEventListener('transitionend', finishDetach);
        }));
        // If the backdrop doesn't have a transition, the `transitionend` event won't fire.
        // In this case we make it unclickable and we try to remove it after a delay.
        backdropToDetach.style.pointerEvents = 'none';
        // Run this outside the Angular zone because there's nothing that Angular cares about.
        // If it were to run inside the Angular zone, every test that used Overlay would have to be
        // either async or fakeAsync.
        timeoutId = this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => setTimeout(finishDetach, 500)));
    }
    /**
     * Toggles a single CSS class or an array of classes on an element.
     * @private
     * @param {?} element
     * @param {?} cssClasses
     * @param {?} isAdd
     * @return {?}
     */
    _toggleClasses(element, cssClasses, isAdd) {
        /** @type {?} */
        const classList = element.classList;
        coerceArray(cssClasses).forEach((/**
         * @param {?} cssClass
         * @return {?}
         */
        cssClass => {
            // We can't do a spread here, because IE doesn't support setting multiple classes.
            isAdd ? classList.add(cssClass) : classList.remove(cssClass);
        }));
    }
    /**
     * Detaches the overlay content next time the zone stabilizes.
     * @private
     * @return {?}
     */
    _detachContentWhenStable() {
        // Normally we wouldn't have to explicitly run this outside the `NgZone`, however
        // if the consumer is using `zone-patch-rxjs`, the `Subscription.unsubscribe` call will
        // be patched to run inside the zone, which will throw us into an infinite loop.
        this._ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            // We can't remove the host here immediately, because the overlay pane's content
            // might still be animating. This stream helps us avoid interrupting the animation
            // by waiting for the pane to become empty.
            /** @type {?} */
            const subscription = this._ngZone.onStable
                .asObservable()
                .pipe(takeUntil(merge(this._attachments, this._detachments)))
                .subscribe((/**
             * @return {?}
             */
            () => {
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
            }));
        }));
    }
    /**
     * Disposes of a scroll strategy.
     * @private
     * @return {?}
     */
    _disposeScrollStrategy() {
        /** @type {?} */
        const scrollStrategy = this._scrollStrategy;
        if (scrollStrategy) {
            scrollStrategy.disable();
            if (scrollStrategy.detach) {
                scrollStrategy.detach();
            }
        }
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._backdropElement;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._backdropClick;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._attachments;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._detachments;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._positionStrategy;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._scrollStrategy;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._locationChanges;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._backdropClickHandler;
    /**
     * Reference to the parent of the `_host` at the time it was detached. Used to restore
     * the `_host` to its original position in the DOM when it gets re-attached.
     * @type {?}
     * @private
     */
    OverlayRef.prototype._previousHostParent;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._keydownEventsObservable;
    /**
     * Stream of keydown events dispatched to this overlay.
     * @type {?}
     */
    OverlayRef.prototype._keydownEvents;
    /**
     * Amount of subscriptions to the keydown events.
     * @type {?}
     */
    OverlayRef.prototype._keydownEventSubscriptions;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._portalOutlet;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._host;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._pane;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._config;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._keyboardDispatcher;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._document;
    /**
     * @type {?}
     * @private
     */
    OverlayRef.prototype._location;
}
/**
 * Size properties for an overlay.
 * @record
 */
export function OverlaySizeConfig() { }
if (false) {
    /** @type {?|undefined} */
    OverlaySizeConfig.prototype.width;
    /** @type {?|undefined} */
    OverlaySizeConfig.prototype.height;
    /** @type {?|undefined} */
    OverlaySizeConfig.prototype.minWidth;
    /** @type {?|undefined} */
    OverlaySizeConfig.prototype.minHeight;
    /** @type {?|undefined} */
    OverlaySizeConfig.prototype.maxWidth;
    /** @type {?|undefined} */
    OverlaySizeConfig.prototype.maxHeight;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQW9CLFlBQVksRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUMxRixPQUFPLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRy9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7QUFldkUsTUFBTSxPQUFPLFVBQVU7Ozs7Ozs7Ozs7O0lBaUNyQixZQUNZLGFBQTJCLEVBQzNCLEtBQWtCLEVBQ2xCLEtBQWtCLEVBQ2xCLE9BQXVDLEVBQ3ZDLE9BQWUsRUFDZixtQkFBOEMsRUFDOUMsU0FBbUIsRUFFbkIsU0FBb0I7UUFScEIsa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDM0IsVUFBSyxHQUFMLEtBQUssQ0FBYTtRQUNsQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBQ2xCLFlBQU8sR0FBUCxPQUFPLENBQWdDO1FBQ3ZDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTJCO1FBQzlDLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFFbkIsY0FBUyxHQUFULFNBQVMsQ0FBVztRQXpDeEIscUJBQWdCLEdBQXVCLElBQUksQ0FBQztRQUM1QyxtQkFBYyxHQUF3QixJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3BELGlCQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUNuQyxpQkFBWSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFHbkMscUJBQWdCLEdBQXFCLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFDeEQsMEJBQXFCOzs7O1FBQUcsQ0FBQyxLQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQztRQVEvRSw2QkFBd0IsR0FDNUIsSUFBSSxVQUFVOzs7O1FBQUMsQ0FBQyxRQUFpQyxFQUFFLEVBQUU7O2tCQUM3QyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQzVELElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBRWxDOzs7WUFBTyxHQUFHLEVBQUU7Z0JBQ1YsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNwQyxDQUFDLEVBQUM7UUFDSixDQUFDLEVBQUMsQ0FBQzs7OztRQUdQLG1CQUFjLEdBQUcsSUFBSSxPQUFPLEVBQWlCLENBQUM7Ozs7UUFHOUMsK0JBQTBCLEdBQUcsQ0FBQyxDQUFDO1FBYTdCLElBQUksT0FBTyxDQUFDLGNBQWMsRUFBRTtZQUMxQixJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDbkM7UUFFRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0lBQ3BELENBQUM7Ozs7O0lBR0QsSUFBSSxjQUFjO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDOzs7OztJQUdELElBQUksZUFBZTtRQUNqQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDOzs7Ozs7O0lBT0QsSUFBSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Ozs7Ozs7O0lBYUQsTUFBTSxDQUFDLE1BQW1COztZQUNwQixZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRXBELElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckM7UUFFRCx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUN6RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsRDtRQUVELElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBRS9CLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN4QixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQy9CO1FBRUQseUZBQXlGO1FBQ3pGLDJGQUEyRjtRQUMzRixXQUFXO1FBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRO2FBQ2xCLFlBQVksRUFBRTthQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDYixTQUFTOzs7UUFBQyxHQUFHLEVBQUU7WUFDZCxxRUFBcUU7WUFDckUsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzthQUN2QjtRQUNILENBQUMsRUFBQyxDQUFDO1FBRUwsc0RBQXNEO1FBQ3RELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVoQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO1lBQzVCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztTQUN4QjtRQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDM0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hFO1FBRUQsa0VBQWtFO1FBQ2xFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFekIsZ0RBQWdEO1FBQ2hELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkMsK0RBQStEO1FBQy9ELG1EQUFtRDtRQUNuRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUN0RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTOzs7WUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUMsQ0FBQztTQUN4RTtRQUVELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7Ozs7O0lBTUQsTUFBTTtRQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDdkIsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXRCLGdGQUFnRjtRQUNoRix1RkFBdUY7UUFDdkYsOEZBQThGO1FBQzlGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFO1lBQzNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNqQztRQUVELElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN4QixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2hDOztjQUVLLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1FBRXBELDBDQUEwQztRQUMxQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXpCLHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXRDLG1GQUFtRjtRQUNuRixvRkFBb0Y7UUFDcEYsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFFaEMsdUNBQXVDO1FBQ3ZDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVwQyxPQUFPLGdCQUFnQixDQUFDO0lBQzFCLENBQUM7Ozs7O0lBR0QsT0FBTzs7Y0FDQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUVyQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbEM7UUFFRCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUUvQixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLG1CQUFBLElBQUksRUFBQyxDQUFDO1NBQ3BCO1FBRUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsbUJBQUEsSUFBSSxFQUFDLENBQUM7UUFFOUMsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQzFCO1FBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMvQixDQUFDOzs7OztJQUdELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDMUMsQ0FBQzs7Ozs7SUFHRCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQzVDLENBQUM7Ozs7O0lBR0QsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUMxQyxDQUFDOzs7OztJQUdELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDMUMsQ0FBQzs7Ozs7SUFHRCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUM7SUFDdkMsQ0FBQzs7Ozs7SUFHRCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7Ozs7O0lBR0QsY0FBYztRQUNaLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNoQztJQUNILENBQUM7Ozs7OztJQUdELHNCQUFzQixDQUFDLFFBQTBCO1FBQy9DLElBQUksUUFBUSxLQUFLLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUN2QyxPQUFPO1NBQ1I7UUFFRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbEM7UUFFRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDO1FBRWxDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQzs7Ozs7O0lBR0QsVUFBVSxDQUFDLFVBQTZCO1FBQ3RDLElBQUksQ0FBQyxPQUFPLHFCQUFPLElBQUksQ0FBQyxPQUFPLEVBQUssVUFBVSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDNUIsQ0FBQzs7Ozs7O0lBR0QsWUFBWSxDQUFDLEdBQStCO1FBQzFDLElBQUksQ0FBQyxPQUFPLHFCQUFPLElBQUksQ0FBQyxPQUFPLElBQUUsU0FBUyxFQUFFLEdBQUcsR0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ2pDLENBQUM7Ozs7OztJQUdELGFBQWEsQ0FBQyxPQUEwQjtRQUN0QyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hEO0lBQ0gsQ0FBQzs7Ozs7O0lBR0QsZ0JBQWdCLENBQUMsT0FBMEI7UUFDekMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNqRDtJQUNILENBQUM7Ozs7O0lBS0QsWUFBWTs7Y0FDSixTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTO1FBRXhDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsT0FBTyxPQUFPLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztJQUNyRSxDQUFDOzs7Ozs7SUFHRCxvQkFBb0IsQ0FBQyxRQUF3QjtRQUMzQyxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3JDLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO1FBRWhDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ25CO0lBQ0gsQ0FBQzs7Ozs7O0lBR08sdUJBQXVCO1FBQzdCLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUN0RCxDQUFDOzs7Ozs7SUFHTyxrQkFBa0I7UUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZixPQUFPO1NBQ1I7O2NBRUssS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztRQUU5QixLQUFLLENBQUMsS0FBSyxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEQsS0FBSyxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hELEtBQUssQ0FBQyxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RCxLQUFLLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUQsS0FBSyxDQUFDLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVELEtBQUssQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNoRSxDQUFDOzs7Ozs7O0lBR08sb0JBQW9CLENBQUMsYUFBc0I7UUFDakQsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDbkUsQ0FBQzs7Ozs7O0lBR08sZUFBZTs7Y0FDZixZQUFZLEdBQUcsOEJBQThCO1FBRW5ELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBRTVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDOUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDOUU7UUFFRCx3REFBd0Q7UUFDeEQsZ0RBQWdEO1FBQ2hELG1CQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUUscUZBQXFGO1FBQ3JGLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBRTVFLHFEQUFxRDtRQUNyRCxJQUFJLE9BQU8scUJBQXFCLEtBQUssV0FBVyxFQUFFO1lBQ2hELElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7WUFBQyxHQUFHLEVBQUU7Z0JBQ2xDLHFCQUFxQjs7O2dCQUFDLEdBQUcsRUFBRTtvQkFDekIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7d0JBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUNuRDtnQkFDSCxDQUFDLEVBQUMsQ0FBQztZQUNMLENBQUMsRUFBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ25EO0lBQ0gsQ0FBQzs7Ozs7Ozs7OztJQVNPLG9CQUFvQjtRQUMxQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQzFCLG1CQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUM7Ozs7O0lBR0QsY0FBYzs7WUFDUixnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCO1FBRTVDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUNyQixPQUFPO1NBQ1I7O1lBRUcsU0FBaUI7O1lBQ2pCLFlBQVk7OztRQUFHLEdBQUcsRUFBRTtZQUN0Qix5RUFBeUU7WUFDekUsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDcEIsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUMxRSxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBRXBFLElBQUksZ0JBQWdCLENBQUMsVUFBVSxFQUFFO29CQUMvQixnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7aUJBQzNEO2FBQ0Y7WUFFRCxzRkFBc0Y7WUFDdEYsc0ZBQXNGO1lBQ3RGLHdEQUF3RDtZQUN4RCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDN0MsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQzthQUM5QjtZQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQUEsZ0JBQWdCLEVBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUMzRTtZQUVELFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUE7UUFFRCxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFFbEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUI7OztRQUFDLEdBQUcsRUFBRTtZQUNsQyxtQkFBQSxnQkFBZ0IsRUFBQyxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNwRSxDQUFDLEVBQUMsQ0FBQztRQUVILG1GQUFtRjtRQUNuRiw2RUFBNkU7UUFDN0UsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFFOUMsc0ZBQXNGO1FBQ3RGLDJGQUEyRjtRQUMzRiw2QkFBNkI7UUFDN0IsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7UUFBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7SUFDbEYsQ0FBQzs7Ozs7Ozs7O0lBR08sY0FBYyxDQUFDLE9BQW9CLEVBQUUsVUFBNkIsRUFBRSxLQUFjOztjQUNsRixTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVM7UUFFbkMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU87Ozs7UUFBQyxRQUFRLENBQUMsRUFBRTtZQUN6QyxrRkFBa0Y7WUFDbEYsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9ELENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7O0lBR08sd0JBQXdCO1FBQzlCLGlGQUFpRjtRQUNqRix1RkFBdUY7UUFDdkYsZ0ZBQWdGO1FBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCOzs7UUFBQyxHQUFHLEVBQUU7Ozs7O2tCQUk1QixZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRO2lCQUN2QyxZQUFZLEVBQUU7aUJBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztpQkFDNUQsU0FBUzs7O1lBQUMsR0FBRyxFQUFFO2dCQUNkLDBEQUEwRDtnQkFDMUQsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDbEUsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO3dCQUN6QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7cUJBQ2pFO29CQUVELElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRTt3QkFDMUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO3dCQUNwRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDbEQ7b0JBRUQsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO2lCQUM1QjtZQUNILENBQUMsRUFBQztRQUNOLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7O0lBR08sc0JBQXNCOztjQUN0QixjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWU7UUFFM0MsSUFBSSxjQUFjLEVBQUU7WUFDbEIsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXpCLElBQUksY0FBYyxDQUFDLE1BQU0sRUFBRTtnQkFDekIsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ3pCO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7Ozs7OztJQWpmQyxzQ0FBb0Q7Ozs7O0lBQ3BELG9DQUE0RDs7Ozs7SUFDNUQsa0NBQTJDOzs7OztJQUMzQyxrQ0FBMkM7Ozs7O0lBQzNDLHVDQUF3RDs7Ozs7SUFDeEQscUNBQW9EOzs7OztJQUNwRCxzQ0FBZ0U7Ozs7O0lBQ2hFLDJDQUF1Rjs7Ozs7OztJQU12Rix5Q0FBeUM7Ozs7O0lBRXpDLDhDQVNPOzs7OztJQUdQLG9DQUE4Qzs7Ozs7SUFHOUMsZ0RBQStCOzs7OztJQUczQixtQ0FBbUM7Ozs7O0lBQ25DLDJCQUEwQjs7Ozs7SUFDMUIsMkJBQTBCOzs7OztJQUMxQiw2QkFBK0M7Ozs7O0lBQy9DLDZCQUF1Qjs7Ozs7SUFDdkIseUNBQXNEOzs7OztJQUN0RCwrQkFBMkI7Ozs7O0lBRTNCLCtCQUE0Qjs7Ozs7O0FBNGNsQyx1Q0FPQzs7O0lBTkMsa0NBQXdCOztJQUN4QixtQ0FBeUI7O0lBQ3pCLHFDQUEyQjs7SUFDM0Isc0NBQTRCOztJQUM1QixxQ0FBMkI7O0lBQzNCLHNDQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RpcmVjdGlvbiwgRGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Q29tcG9uZW50UG9ydGFsLCBQb3J0YWwsIFBvcnRhbE91dGxldCwgVGVtcGxhdGVQb3J0YWx9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wb3J0YWwnO1xuaW1wb3J0IHtDb21wb25lbnRSZWYsIEVtYmVkZGVkVmlld1JlZiwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7TG9jYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIG1lcmdlLCBTdWJzY3JpcHRpb25MaWtlLCBTdWJzY3JpcHRpb24sIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZSwgdGFrZVVudGlsfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge092ZXJsYXlLZXlib2FyZERpc3BhdGNoZXJ9IGZyb20gJy4va2V5Ym9hcmQvb3ZlcmxheS1rZXlib2FyZC1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge2NvZXJjZUNzc1BpeGVsVmFsdWUsIGNvZXJjZUFycmF5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtPdmVybGF5UmVmZXJlbmNlfSBmcm9tICcuL292ZXJsYXktcmVmZXJlbmNlJztcbmltcG9ydCB7UG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9wb3NpdGlvbi9wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3Njcm9sbCc7XG5cblxuLyoqIEFuIG9iamVjdCB3aGVyZSBhbGwgb2YgaXRzIHByb3BlcnRpZXMgY2Fubm90IGJlIHdyaXR0ZW4uICovXG5leHBvcnQgdHlwZSBJbW11dGFibGVPYmplY3Q8VD4gPSB7XG4gIHJlYWRvbmx5IFtQIGluIGtleW9mIFRdOiBUW1BdO1xufTtcblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYW4gb3ZlcmxheSB0aGF0IGhhcyBiZWVuIGNyZWF0ZWQgd2l0aCB0aGUgT3ZlcmxheSBzZXJ2aWNlLlxuICogVXNlZCB0byBtYW5pcHVsYXRlIG9yIGRpc3Bvc2Ugb2Ygc2FpZCBvdmVybGF5LlxuICovXG5leHBvcnQgY2xhc3MgT3ZlcmxheVJlZiBpbXBsZW1lbnRzIFBvcnRhbE91dGxldCwgT3ZlcmxheVJlZmVyZW5jZSB7XG4gIHByaXZhdGUgX2JhY2tkcm9wRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BDbGljazogU3ViamVjdDxNb3VzZUV2ZW50PiA9IG5ldyBTdWJqZWN0KCk7XG4gIHByaXZhdGUgX2F0dGFjaG1lbnRzID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSBfZGV0YWNobWVudHMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICBwcml2YXRlIF9wb3NpdGlvblN0cmF0ZWd5OiBQb3NpdGlvblN0cmF0ZWd5IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9zY3JvbGxTdHJhdGVneTogU2Nyb2xsU3RyYXRlZ3kgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2xvY2F0aW9uQ2hhbmdlczogU3Vic2NyaXB0aW9uTGlrZSA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BDbGlja0hhbmRsZXIgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHRoaXMuX2JhY2tkcm9wQ2xpY2submV4dChldmVudCk7XG5cbiAgLyoqXG4gICAqIFJlZmVyZW5jZSB0byB0aGUgcGFyZW50IG9mIHRoZSBgX2hvc3RgIGF0IHRoZSB0aW1lIGl0IHdhcyBkZXRhY2hlZC4gVXNlZCB0byByZXN0b3JlXG4gICAqIHRoZSBgX2hvc3RgIHRvIGl0cyBvcmlnaW5hbCBwb3NpdGlvbiBpbiB0aGUgRE9NIHdoZW4gaXQgZ2V0cyByZS1hdHRhY2hlZC5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzSG9zdFBhcmVudDogSFRNTEVsZW1lbnQ7XG5cbiAgcHJpdmF0ZSBfa2V5ZG93bkV2ZW50c09ic2VydmFibGU6IE9ic2VydmFibGU8S2V5Ym9hcmRFdmVudD4gPVxuICAgICAgbmV3IE9ic2VydmFibGUoKG9ic2VydmVyOiBPYnNlcnZlcjxLZXlib2FyZEV2ZW50PikgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9rZXlkb3duRXZlbnRzLnN1YnNjcmliZShvYnNlcnZlcik7XG4gICAgICAgIHRoaXMuX2tleWRvd25FdmVudFN1YnNjcmlwdGlvbnMrKztcblxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIHRoaXMuX2tleWRvd25FdmVudFN1YnNjcmlwdGlvbnMtLTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gIC8qKiBTdHJlYW0gb2Yga2V5ZG93biBldmVudHMgZGlzcGF0Y2hlZCB0byB0aGlzIG92ZXJsYXkuICovXG4gIF9rZXlkb3duRXZlbnRzID0gbmV3IFN1YmplY3Q8S2V5Ym9hcmRFdmVudD4oKTtcblxuICAvKiogQW1vdW50IG9mIHN1YnNjcmlwdGlvbnMgdG8gdGhlIGtleWRvd24gZXZlbnRzLiAqL1xuICBfa2V5ZG93bkV2ZW50U3Vic2NyaXB0aW9ucyA9IDA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9wb3J0YWxPdXRsZXQ6IFBvcnRhbE91dGxldCxcbiAgICAgIHByaXZhdGUgX2hvc3Q6IEhUTUxFbGVtZW50LFxuICAgICAgcHJpdmF0ZSBfcGFuZTogSFRNTEVsZW1lbnQsXG4gICAgICBwcml2YXRlIF9jb25maWc6IEltbXV0YWJsZU9iamVjdDxPdmVybGF5Q29uZmlnPixcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfa2V5Ym9hcmREaXNwYXRjaGVyOiBPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyLFxuICAgICAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50LFxuICAgICAgLy8gQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBgX2xvY2F0aW9uYCBwYXJhbWV0ZXIgdG8gYmUgbWFkZSByZXF1aXJlZC5cbiAgICAgIHByaXZhdGUgX2xvY2F0aW9uPzogTG9jYXRpb24pIHtcblxuICAgIGlmIChfY29uZmlnLnNjcm9sbFN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneSA9IF9jb25maWcuc2Nyb2xsU3RyYXRlZ3k7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneSA9IF9jb25maWcucG9zaXRpb25TdHJhdGVneTtcbiAgfVxuXG4gIC8qKiBUaGUgb3ZlcmxheSdzIEhUTUwgZWxlbWVudCAqL1xuICBnZXQgb3ZlcmxheUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9wYW5lO1xuICB9XG5cbiAgLyoqIFRoZSBvdmVybGF5J3MgYmFja2Ryb3AgSFRNTCBlbGVtZW50LiAqL1xuICBnZXQgYmFja2Ryb3BFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tkcm9wRWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCB0aGUgcGFuZWwgZWxlbWVudC4gQ2FuIGJlIHVzZWQgZm9yIGFkdmFuY2VkXG4gICAqIHBvc2l0aW9uaW5nIHdoZXJlIGEgd3JhcHBlciB3aXRoIHNwZWNpZmljIHN0eWxpbmcgaXNcbiAgICogcmVxdWlyZWQgYXJvdW5kIHRoZSBvdmVybGF5IHBhbmUuXG4gICAqL1xuICBnZXQgaG9zdEVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9ob3N0O1xuICB9XG5cbiAgYXR0YWNoPFQ+KHBvcnRhbDogQ29tcG9uZW50UG9ydGFsPFQ+KTogQ29tcG9uZW50UmVmPFQ+O1xuICBhdHRhY2g8VD4ocG9ydGFsOiBUZW1wbGF0ZVBvcnRhbDxUPik6IEVtYmVkZGVkVmlld1JlZjxUPjtcbiAgYXR0YWNoKHBvcnRhbDogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBjb250ZW50LCBnaXZlbiB2aWEgYSBQb3J0YWwsIHRvIHRoZSBvdmVybGF5LlxuICAgKiBJZiB0aGUgb3ZlcmxheSBpcyBjb25maWd1cmVkIHRvIGhhdmUgYSBiYWNrZHJvcCwgaXQgd2lsbCBiZSBjcmVhdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gcG9ydGFsIFBvcnRhbCBpbnN0YW5jZSB0byB3aGljaCB0byBhdHRhY2ggdGhlIG92ZXJsYXkuXG4gICAqIEByZXR1cm5zIFRoZSBwb3J0YWwgYXR0YWNobWVudCByZXN1bHQuXG4gICAqL1xuICBhdHRhY2gocG9ydGFsOiBQb3J0YWw8YW55Pik6IGFueSB7XG4gICAgbGV0IGF0dGFjaFJlc3VsdCA9IHRoaXMuX3BvcnRhbE91dGxldC5hdHRhY2gocG9ydGFsKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHBhbmUgZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBjb25maWd1cmF0aW9uLlxuICAgIGlmICghdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50ICYmIHRoaXMuX3ByZXZpb3VzSG9zdFBhcmVudCkge1xuICAgICAgdGhpcy5fcHJldmlvdXNIb3N0UGFyZW50LmFwcGVuZENoaWxkKHRoaXMuX2hvc3QpO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZVN0YWNraW5nT3JkZXIoKTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50U2l6ZSgpO1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnREaXJlY3Rpb24oKTtcblxuICAgIGlmICh0aGlzLl9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuZW5hYmxlKCk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbiBvbmNlIHRoZSB6b25lIGlzIHN0YWJsZSBzbyB0aGF0IHRoZSBvdmVybGF5IHdpbGwgYmUgZnVsbHkgcmVuZGVyZWRcbiAgICAvLyBiZWZvcmUgYXR0ZW1wdGluZyB0byBwb3NpdGlvbiBpdCwgYXMgdGhlIHBvc2l0aW9uIG1heSBkZXBlbmQgb24gdGhlIHNpemUgb2YgdGhlIHJlbmRlcmVkXG4gICAgLy8gY29udGVudC5cbiAgICB0aGlzLl9uZ1pvbmUub25TdGFibGVcbiAgICAgIC5hc09ic2VydmFibGUoKVxuICAgICAgLnBpcGUodGFrZSgxKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBUaGUgb3ZlcmxheSBjb3VsZCd2ZSBiZWVuIGRldGFjaGVkIGJlZm9yZSB0aGUgem9uZSBoYXMgc3RhYmlsaXplZC5cbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAvLyBFbmFibGUgcG9pbnRlciBldmVudHMgZm9yIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC5cbiAgICB0aGlzLl90b2dnbGVQb2ludGVyRXZlbnRzKHRydWUpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5oYXNCYWNrZHJvcCkge1xuICAgICAgdGhpcy5fYXR0YWNoQmFja2Ryb3AoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fcGFuZSwgdGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZW1pdCB0aGUgYGF0dGFjaG1lbnRzYCBldmVudCBvbmNlIGFsbCBvdGhlciBzZXR1cCBpcyBkb25lLlxuICAgIHRoaXMuX2F0dGFjaG1lbnRzLm5leHQoKTtcblxuICAgIC8vIFRyYWNrIHRoaXMgb3ZlcmxheSBieSB0aGUga2V5Ym9hcmQgZGlzcGF0Y2hlclxuICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlci5hZGQodGhpcyk7XG5cbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIHJlbW92ZSB0aGUgbnVsbCBjaGVjayBmb3IgYF9sb2NhdGlvbmBcbiAgICAvLyBvbmNlIHRoZSBjb25zdHJ1Y3RvciBwYXJhbWV0ZXIgaXMgbWFkZSByZXF1aXJlZC5cbiAgICBpZiAodGhpcy5fY29uZmlnLmRpc3Bvc2VPbk5hdmlnYXRpb24gJiYgdGhpcy5fbG9jYXRpb24pIHtcbiAgICAgIHRoaXMuX2xvY2F0aW9uQ2hhbmdlcyA9IHRoaXMuX2xvY2F0aW9uLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRpc3Bvc2UoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dGFjaFJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhbiBvdmVybGF5IGZyb20gYSBwb3J0YWwuXG4gICAqIEByZXR1cm5zIFRoZSBwb3J0YWwgZGV0YWNobWVudCByZXN1bHQuXG4gICAqL1xuICBkZXRhY2goKTogYW55IHtcbiAgICBpZiAoIXRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZGV0YWNoQmFja2Ryb3AoKTtcblxuICAgIC8vIFdoZW4gdGhlIG92ZXJsYXkgaXMgZGV0YWNoZWQsIHRoZSBwYW5lIGVsZW1lbnQgc2hvdWxkIGRpc2FibGUgcG9pbnRlciBldmVudHMuXG4gICAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBvdGhlcndpc2UgdGhlIHBhbmUgZWxlbWVudCB3aWxsIGNvdmVyIHRoZSBwYWdlIGFuZCBkaXNhYmxlXG4gICAgLy8gcG9pbnRlciBldmVudHMgdGhlcmVmb3JlLiBEZXBlbmRzIG9uIHRoZSBwb3NpdGlvbiBzdHJhdGVneSBhbmQgdGhlIGFwcGxpZWQgcGFuZSBib3VuZGFyaWVzLlxuICAgIHRoaXMuX3RvZ2dsZVBvaW50ZXJFdmVudHMoZmFsc2UpO1xuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kgJiYgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5kZXRhY2gpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGV0YWNoKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Njcm9sbFN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9zY3JvbGxTdHJhdGVneS5kaXNhYmxlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGV0YWNobWVudFJlc3VsdCA9IHRoaXMuX3BvcnRhbE91dGxldC5kZXRhY2goKTtcblxuICAgIC8vIE9ubHkgZW1pdCBhZnRlciBldmVyeXRoaW5nIGlzIGRldGFjaGVkLlxuICAgIHRoaXMuX2RldGFjaG1lbnRzLm5leHQoKTtcblxuICAgIC8vIFJlbW92ZSB0aGlzIG92ZXJsYXkgZnJvbSBrZXlib2FyZCBkaXNwYXRjaGVyIHRyYWNraW5nLlxuICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlci5yZW1vdmUodGhpcyk7XG5cbiAgICAvLyBLZWVwaW5nIHRoZSBob3N0IGVsZW1lbnQgaW4gRE9NIHRoZSBjYW4gY2F1c2Ugc2Nyb2xsIGphbmssIGJlY2F1c2UgaXQgc3RpbGwgZ2V0c1xuICAgIC8vIHJlbmRlcmVkLCBldmVuIHRob3VnaCBpdCdzIHRyYW5zcGFyZW50IGFuZCB1bmNsaWNrYWJsZSB3aGljaCBpcyB3aHkgd2UgcmVtb3ZlIGl0LlxuICAgIHRoaXMuX2RldGFjaENvbnRlbnRXaGVuU3RhYmxlKCk7XG5cbiAgICAvLyBTdG9wIGxpc3RlbmluZyBmb3IgbG9jYXRpb24gY2hhbmdlcy5cbiAgICB0aGlzLl9sb2NhdGlvbkNoYW5nZXMudW5zdWJzY3JpYmUoKTtcblxuICAgIHJldHVybiBkZXRhY2htZW50UmVzdWx0O1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgb3ZlcmxheSBmcm9tIHRoZSBET00uICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgY29uc3QgaXNBdHRhY2hlZCA9IHRoaXMuaGFzQXR0YWNoZWQoKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kaXNwb3NlU2Nyb2xsU3RyYXRlZ3koKTtcbiAgICB0aGlzLmRldGFjaEJhY2tkcm9wKCk7XG4gICAgdGhpcy5fbG9jYXRpb25DaGFuZ2VzLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5fa2V5Ym9hcmREaXNwYXRjaGVyLnJlbW92ZSh0aGlzKTtcbiAgICB0aGlzLl9wb3J0YWxPdXRsZXQuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2F0dGFjaG1lbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fYmFja2Ryb3BDbGljay5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX2tleWRvd25FdmVudHMuY29tcGxldGUoKTtcblxuICAgIGlmICh0aGlzLl9ob3N0ICYmIHRoaXMuX2hvc3QucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5faG9zdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2hvc3QpO1xuICAgICAgdGhpcy5faG9zdCA9IG51bGwhO1xuICAgIH1cblxuICAgIHRoaXMuX3ByZXZpb3VzSG9zdFBhcmVudCA9IHRoaXMuX3BhbmUgPSBudWxsITtcblxuICAgIGlmIChpc0F0dGFjaGVkKSB7XG4gICAgICB0aGlzLl9kZXRhY2htZW50cy5uZXh0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGV0YWNobWVudHMuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBvdmVybGF5IGhhcyBhdHRhY2hlZCBjb250ZW50LiAqL1xuICBoYXNBdHRhY2hlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcG9ydGFsT3V0bGV0Lmhhc0F0dGFjaGVkKCk7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgYmFja2Ryb3AgaGFzIGJlZW4gY2xpY2tlZC4gKi9cbiAgYmFja2Ryb3BDbGljaygpOiBPYnNlcnZhYmxlPE1vdXNlRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fYmFja2Ryb3BDbGljay5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGF0dGFjaGVkLiAqL1xuICBhdHRhY2htZW50cygpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNobWVudHMuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIHRoYXQgZW1pdHMgd2hlbiB0aGUgb3ZlcmxheSBoYXMgYmVlbiBkZXRhY2hlZC4gKi9cbiAgZGV0YWNobWVudHMoKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX2RldGFjaG1lbnRzLmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSBvZiBrZXlkb3duIGV2ZW50cyB0YXJnZXRlZCB0byB0aGlzIG92ZXJsYXkuICovXG4gIGtleWRvd25FdmVudHMoKTogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMuX2tleWRvd25FdmVudHNPYnNlcnZhYmxlO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIGN1cnJlbnQgb3ZlcmxheSBjb25maWd1cmF0aW9uLCB3aGljaCBpcyBpbW11dGFibGUuICovXG4gIGdldENvbmZpZygpOiBPdmVybGF5Q29uZmlnIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBvdmVybGF5IGJhc2VkIG9uIHRoZSBwb3NpdGlvbiBzdHJhdGVneS4gKi9cbiAgdXBkYXRlUG9zaXRpb24oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuYXBwbHkoKTtcbiAgICB9XG4gIH1cblxuICAvKiogU3dpdGNoZXMgdG8gYSBuZXcgcG9zaXRpb24gc3RyYXRlZ3kgYW5kIHVwZGF0ZXMgdGhlIG92ZXJsYXkgcG9zaXRpb24uICovXG4gIHVwZGF0ZVBvc2l0aW9uU3RyYXRlZ3koc3RyYXRlZ3k6IFBvc2l0aW9uU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcG9zaXRpb25TdHJhdGVneSkge1xuICAgICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcG9zaXRpb25TdHJhdGVneSA9IHN0cmF0ZWd5O1xuXG4gICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgc3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuICAgICAgdGhpcy51cGRhdGVQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIHNpemUgcHJvcGVydGllcyBvZiB0aGUgb3ZlcmxheS4gKi9cbiAgdXBkYXRlU2l6ZShzaXplQ29uZmlnOiBPdmVybGF5U2l6ZUNvbmZpZyk6IHZvaWQge1xuICAgIHRoaXMuX2NvbmZpZyA9IHsuLi50aGlzLl9jb25maWcsIC4uLnNpemVDb25maWd9O1xuICAgIHRoaXMuX3VwZGF0ZUVsZW1lbnRTaXplKCk7XG4gIH1cblxuICAvKiogU2V0cyB0aGUgTFRSL1JUTCBkaXJlY3Rpb24gZm9yIHRoZSBvdmVybGF5LiAqL1xuICBzZXREaXJlY3Rpb24oZGlyOiBEaXJlY3Rpb24gfCBEaXJlY3Rpb25hbGl0eSk6IHZvaWQge1xuICAgIHRoaXMuX2NvbmZpZyA9IHsuLi50aGlzLl9jb25maWcsIGRpcmVjdGlvbjogZGlyfTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50RGlyZWN0aW9uKCk7XG4gIH1cblxuICAvKiogQWRkIGEgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgdG8gdGhlIG92ZXJsYXkgcGFuZS4gKi9cbiAgYWRkUGFuZWxDbGFzcyhjbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wYW5lKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIGNsYXNzZXMsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmUgYSBDU1MgY2xhc3Mgb3IgYW4gYXJyYXkgb2YgY2xhc3NlcyBmcm9tIHRoZSBvdmVybGF5IHBhbmUuICovXG4gIHJlbW92ZVBhbmVsQ2xhc3MoY2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCBjbGFzc2VzLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxheW91dCBkaXJlY3Rpb24gb2YgdGhlIG92ZXJsYXkgcGFuZWwuXG4gICAqL1xuICBnZXREaXJlY3Rpb24oKTogRGlyZWN0aW9uIHtcbiAgICBjb25zdCBkaXJlY3Rpb24gPSB0aGlzLl9jb25maWcuZGlyZWN0aW9uO1xuXG4gICAgaWYgKCFkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiAnbHRyJztcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGRpcmVjdGlvbiA9PT0gJ3N0cmluZycgPyBkaXJlY3Rpb24gOiBkaXJlY3Rpb24udmFsdWU7XG4gIH1cblxuICAvKiogU3dpdGNoZXMgdG8gYSBuZXcgc2Nyb2xsIHN0cmF0ZWd5LiAqL1xuICB1cGRhdGVTY3JvbGxTdHJhdGVneShzdHJhdGVneTogU2Nyb2xsU3RyYXRlZ3kpOiB2b2lkIHtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IHRoaXMuX3Njcm9sbFN0cmF0ZWd5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fZGlzcG9zZVNjcm9sbFN0cmF0ZWd5KCk7XG4gICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICAgIHN0cmF0ZWd5LmVuYWJsZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSB0ZXh0IGRpcmVjdGlvbiBvZiB0aGUgb3ZlcmxheSBwYW5lbC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlRWxlbWVudERpcmVjdGlvbigpIHtcbiAgICB0aGlzLl9ob3N0LnNldEF0dHJpYnV0ZSgnZGlyJywgdGhpcy5nZXREaXJlY3Rpb24oKSk7XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgc2l6ZSBvZiB0aGUgb3ZlcmxheSBlbGVtZW50IGJhc2VkIG9uIHRoZSBvdmVybGF5IGNvbmZpZy4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlRWxlbWVudFNpemUoKSB7XG4gICAgaWYgKCF0aGlzLl9wYW5lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3R5bGUgPSB0aGlzLl9wYW5lLnN0eWxlO1xuXG4gICAgc3R5bGUud2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy53aWR0aCk7XG4gICAgc3R5bGUuaGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcuaGVpZ2h0KTtcbiAgICBzdHlsZS5taW5XaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1pbldpZHRoKTtcbiAgICBzdHlsZS5taW5IZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5taW5IZWlnaHQpO1xuICAgIHN0eWxlLm1heFdpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcubWF4V2lkdGgpO1xuICAgIHN0eWxlLm1heEhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1heEhlaWdodCk7XG4gIH1cblxuICAvKiogVG9nZ2xlcyB0aGUgcG9pbnRlciBldmVudHMgZm9yIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC4gKi9cbiAgcHJpdmF0ZSBfdG9nZ2xlUG9pbnRlckV2ZW50cyhlbmFibGVQb2ludGVyOiBib29sZWFuKSB7XG4gICAgdGhpcy5fcGFuZS5zdHlsZS5wb2ludGVyRXZlbnRzID0gZW5hYmxlUG9pbnRlciA/ICdhdXRvJyA6ICdub25lJztcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyBhIGJhY2tkcm9wIGZvciB0aGlzIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2F0dGFjaEJhY2tkcm9wKCkge1xuICAgIGNvbnN0IHNob3dpbmdDbGFzcyA9ICdjZGstb3ZlcmxheS1iYWNrZHJvcC1zaG93aW5nJztcblxuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjZGstb3ZlcmxheS1iYWNrZHJvcCcpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5iYWNrZHJvcENsYXNzKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX2JhY2tkcm9wRWxlbWVudCwgdGhpcy5fY29uZmlnLmJhY2tkcm9wQ2xhc3MsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIEluc2VydCB0aGUgYmFja2Ryb3AgYmVmb3JlIHRoZSBwYW5lIGluIHRoZSBET00gb3JkZXIsXG4gICAgLy8gaW4gb3JkZXIgdG8gaGFuZGxlIHN0YWNrZWQgb3ZlcmxheXMgcHJvcGVybHkuXG4gICAgdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUodGhpcy5fYmFja2Ryb3BFbGVtZW50LCB0aGlzLl9ob3N0KTtcblxuICAgIC8vIEZvcndhcmQgYmFja2Ryb3AgY2xpY2tzIHN1Y2ggdGhhdCB0aGUgY29uc3VtZXIgb2YgdGhlIG92ZXJsYXkgY2FuIHBlcmZvcm0gd2hhdGV2ZXJcbiAgICAvLyBhY3Rpb24gZGVzaXJlZCB3aGVuIHN1Y2ggYSBjbGljayBvY2N1cnMgKHVzdWFsbHkgY2xvc2luZyB0aGUgb3ZlcmxheSkuXG4gICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fYmFja2Ryb3BDbGlja0hhbmRsZXIpO1xuXG4gICAgLy8gQWRkIGNsYXNzIHRvIGZhZGUtaW4gdGhlIGJhY2tkcm9wIGFmdGVyIG9uZSBmcmFtZS5cbiAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuX2JhY2tkcm9wRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoc2hvd2luZ0NsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKHNob3dpbmdDbGFzcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHN0YWNraW5nIG9yZGVyIG9mIHRoZSBlbGVtZW50LCBtb3ZpbmcgaXQgdG8gdGhlIHRvcCBpZiBuZWNlc3NhcnkuXG4gICAqIFRoaXMgaXMgcmVxdWlyZWQgaW4gY2FzZXMgd2hlcmUgb25lIG92ZXJsYXkgd2FzIGRldGFjaGVkLCB3aGlsZSBhbm90aGVyIG9uZSxcbiAgICogdGhhdCBzaG91bGQgYmUgYmVoaW5kIGl0LCB3YXMgZGVzdHJveWVkLiBUaGUgbmV4dCB0aW1lIGJvdGggb2YgdGhlbSBhcmUgb3BlbmVkLFxuICAgKiB0aGUgc3RhY2tpbmcgd2lsbCBiZSB3cm9uZywgYmVjYXVzZSB0aGUgZGV0YWNoZWQgZWxlbWVudCdzIHBhbmUgd2lsbCBzdGlsbCBiZVxuICAgKiBpbiBpdHMgb3JpZ2luYWwgRE9NIHBvc2l0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlU3RhY2tpbmdPcmRlcigpIHtcbiAgICBpZiAodGhpcy5faG9zdC5uZXh0U2libGluZykge1xuICAgICAgdGhpcy5faG9zdC5wYXJlbnROb2RlIS5hcHBlbmRDaGlsZCh0aGlzLl9ob3N0KTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIGJhY2tkcm9wIChpZiBhbnkpIGFzc29jaWF0ZWQgd2l0aCB0aGUgb3ZlcmxheS4gKi9cbiAgZGV0YWNoQmFja2Ryb3AoKTogdm9pZCB7XG4gICAgbGV0IGJhY2tkcm9wVG9EZXRhY2ggPSB0aGlzLl9iYWNrZHJvcEVsZW1lbnQ7XG5cbiAgICBpZiAoIWJhY2tkcm9wVG9EZXRhY2gpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dElkOiBudW1iZXI7XG4gICAgbGV0IGZpbmlzaERldGFjaCA9ICgpID0+IHtcbiAgICAgIC8vIEl0IG1heSBub3QgYmUgYXR0YWNoZWQgdG8gYW55dGhpbmcgaW4gY2VydGFpbiBjYXNlcyAoZS5nLiB1bml0IHRlc3RzKS5cbiAgICAgIGlmIChiYWNrZHJvcFRvRGV0YWNoKSB7XG4gICAgICAgIGJhY2tkcm9wVG9EZXRhY2gucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9iYWNrZHJvcENsaWNrSGFuZGxlcik7XG4gICAgICAgIGJhY2tkcm9wVG9EZXRhY2gucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZpbmlzaERldGFjaCk7XG5cbiAgICAgICAgaWYgKGJhY2tkcm9wVG9EZXRhY2gucGFyZW50Tm9kZSkge1xuICAgICAgICAgIGJhY2tkcm9wVG9EZXRhY2gucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiYWNrZHJvcFRvRGV0YWNoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJdCBpcyBwb3NzaWJsZSB0aGF0IGEgbmV3IHBvcnRhbCBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGlzIG92ZXJsYXkgc2luY2Ugd2Ugc3RhcnRlZFxuICAgICAgLy8gcmVtb3ZpbmcgdGhlIGJhY2tkcm9wLiBJZiB0aGF0IGlzIHRoZSBjYXNlLCBvbmx5IGNsZWFyIHRoZSBiYWNrZHJvcCByZWZlcmVuY2UgaWYgaXRcbiAgICAgIC8vIGlzIHN0aWxsIHRoZSBzYW1lIGluc3RhbmNlIHRoYXQgd2Ugc3RhcnRlZCB0byByZW1vdmUuXG4gICAgICBpZiAodGhpcy5fYmFja2Ryb3BFbGVtZW50ID09IGJhY2tkcm9wVG9EZXRhY2gpIHtcbiAgICAgICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2NvbmZpZy5iYWNrZHJvcENsYXNzKSB7XG4gICAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXMoYmFja2Ryb3BUb0RldGFjaCEsIHRoaXMuX2NvbmZpZy5iYWNrZHJvcENsYXNzLCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH07XG5cbiAgICBiYWNrZHJvcFRvRGV0YWNoLmNsYXNzTGlzdC5yZW1vdmUoJ2Nkay1vdmVybGF5LWJhY2tkcm9wLXNob3dpbmcnKTtcblxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBiYWNrZHJvcFRvRGV0YWNoIS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZmluaXNoRGV0YWNoKTtcbiAgICB9KTtcblxuICAgIC8vIElmIHRoZSBiYWNrZHJvcCBkb2Vzbid0IGhhdmUgYSB0cmFuc2l0aW9uLCB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50IHdvbid0IGZpcmUuXG4gICAgLy8gSW4gdGhpcyBjYXNlIHdlIG1ha2UgaXQgdW5jbGlja2FibGUgYW5kIHdlIHRyeSB0byByZW1vdmUgaXQgYWZ0ZXIgYSBkZWxheS5cbiAgICBiYWNrZHJvcFRvRGV0YWNoLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG5cbiAgICAvLyBSdW4gdGhpcyBvdXRzaWRlIHRoZSBBbmd1bGFyIHpvbmUgYmVjYXVzZSB0aGVyZSdzIG5vdGhpbmcgdGhhdCBBbmd1bGFyIGNhcmVzIGFib3V0LlxuICAgIC8vIElmIGl0IHdlcmUgdG8gcnVuIGluc2lkZSB0aGUgQW5ndWxhciB6b25lLCBldmVyeSB0ZXN0IHRoYXQgdXNlZCBPdmVybGF5IHdvdWxkIGhhdmUgdG8gYmVcbiAgICAvLyBlaXRoZXIgYXN5bmMgb3IgZmFrZUFzeW5jLlxuICAgIHRpbWVvdXRJZCA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBzZXRUaW1lb3V0KGZpbmlzaERldGFjaCwgNTAwKSk7XG4gIH1cblxuICAvKiogVG9nZ2xlcyBhIHNpbmdsZSBDU1MgY2xhc3Mgb3IgYW4gYXJyYXkgb2YgY2xhc3NlcyBvbiBhbiBlbGVtZW50LiAqL1xuICBwcml2YXRlIF90b2dnbGVDbGFzc2VzKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjc3NDbGFzc2VzOiBzdHJpbmcgfCBzdHJpbmdbXSwgaXNBZGQ6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBjbGFzc0xpc3QgPSBlbGVtZW50LmNsYXNzTGlzdDtcblxuICAgIGNvZXJjZUFycmF5KGNzc0NsYXNzZXMpLmZvckVhY2goY3NzQ2xhc3MgPT4ge1xuICAgICAgLy8gV2UgY2FuJ3QgZG8gYSBzcHJlYWQgaGVyZSwgYmVjYXVzZSBJRSBkb2Vzbid0IHN1cHBvcnQgc2V0dGluZyBtdWx0aXBsZSBjbGFzc2VzLlxuICAgICAgaXNBZGQgPyBjbGFzc0xpc3QuYWRkKGNzc0NsYXNzKSA6IGNsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIERldGFjaGVzIHRoZSBvdmVybGF5IGNvbnRlbnQgbmV4dCB0aW1lIHRoZSB6b25lIHN0YWJpbGl6ZXMuICovXG4gIHByaXZhdGUgX2RldGFjaENvbnRlbnRXaGVuU3RhYmxlKCkge1xuICAgIC8vIE5vcm1hbGx5IHdlIHdvdWxkbid0IGhhdmUgdG8gZXhwbGljaXRseSBydW4gdGhpcyBvdXRzaWRlIHRoZSBgTmdab25lYCwgaG93ZXZlclxuICAgIC8vIGlmIHRoZSBjb25zdW1lciBpcyB1c2luZyBgem9uZS1wYXRjaC1yeGpzYCwgdGhlIGBTdWJzY3JpcHRpb24udW5zdWJzY3JpYmVgIGNhbGwgd2lsbFxuICAgIC8vIGJlIHBhdGNoZWQgdG8gcnVuIGluc2lkZSB0aGUgem9uZSwgd2hpY2ggd2lsbCB0aHJvdyB1cyBpbnRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIC8vIFdlIGNhbid0IHJlbW92ZSB0aGUgaG9zdCBoZXJlIGltbWVkaWF0ZWx5LCBiZWNhdXNlIHRoZSBvdmVybGF5IHBhbmUncyBjb250ZW50XG4gICAgICAvLyBtaWdodCBzdGlsbCBiZSBhbmltYXRpbmcuIFRoaXMgc3RyZWFtIGhlbHBzIHVzIGF2b2lkIGludGVycnVwdGluZyB0aGUgYW5pbWF0aW9uXG4gICAgICAvLyBieSB3YWl0aW5nIGZvciB0aGUgcGFuZSB0byBiZWNvbWUgZW1wdHkuXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSB0aGlzLl9uZ1pvbmUub25TdGFibGVcbiAgICAgICAgLmFzT2JzZXJ2YWJsZSgpXG4gICAgICAgIC5waXBlKHRha2VVbnRpbChtZXJnZSh0aGlzLl9hdHRhY2htZW50cywgdGhpcy5fZGV0YWNobWVudHMpKSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgLy8gTmVlZHMgYSBjb3VwbGUgb2YgY2hlY2tzIGZvciB0aGUgcGFuZSBhbmQgaG9zdCwgYmVjYXVzZVxuICAgICAgICAgIC8vIHRoZXkgbWF5IGhhdmUgYmVlbiByZW1vdmVkIGJ5IHRoZSB0aW1lIHRoZSB6b25lIHN0YWJpbGl6ZXMuXG4gICAgICAgICAgaWYgKCF0aGlzLl9wYW5lIHx8ICF0aGlzLl9ob3N0IHx8IHRoaXMuX3BhbmUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcGFuZSAmJiB0aGlzLl9jb25maWcucGFuZWxDbGFzcykge1xuICAgICAgICAgICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX3BhbmUsIHRoaXMuX2NvbmZpZy5wYW5lbENsYXNzLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ob3N0ICYmIHRoaXMuX2hvc3QucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQgPSB0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzSG9zdFBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLl9ob3N0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBEaXNwb3NlcyBvZiBhIHNjcm9sbCBzdHJhdGVneS4gKi9cbiAgcHJpdmF0ZSBfZGlzcG9zZVNjcm9sbFN0cmF0ZWd5KCkge1xuICAgIGNvbnN0IHNjcm9sbFN0cmF0ZWd5ID0gdGhpcy5fc2Nyb2xsU3RyYXRlZ3k7XG5cbiAgICBpZiAoc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHNjcm9sbFN0cmF0ZWd5LmRpc2FibGUoKTtcblxuICAgICAgaWYgKHNjcm9sbFN0cmF0ZWd5LmRldGFjaCkge1xuICAgICAgICBzY3JvbGxTdHJhdGVneS5kZXRhY2goKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKiogU2l6ZSBwcm9wZXJ0aWVzIGZvciBhbiBvdmVybGF5LiAqL1xuZXhwb3J0IGludGVyZmFjZSBPdmVybGF5U2l6ZUNvbmZpZyB7XG4gIHdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBoZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1pbldpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBtaW5IZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1heFdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBtYXhIZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG59XG4iXX0=