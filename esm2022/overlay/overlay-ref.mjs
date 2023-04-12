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
    constructor(_portalOutlet, _host, _pane, _config, _ngZone, _keyboardDispatcher, _document, _location, _outsideClickDispatcher, _animationsDisabled = false) {
        this._portalOutlet = _portalOutlet;
        this._host = _host;
        this._pane = _pane;
        this._config = _config;
        this._ngZone = _ngZone;
        this._keyboardDispatcher = _keyboardDispatcher;
        this._document = _document;
        this._location = _location;
        this._outsideClickDispatcher = _outsideClickDispatcher;
        this._animationsDisabled = _animationsDisabled;
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
        // Insert the host into the DOM before attaching the portal, otherwise
        // the animations module will skip animations on repeat attachments.
        if (!this._host.parentElement && this._previousHostParent) {
            this._previousHostParent.appendChild(this._host);
        }
        const attachResult = this._portalOutlet.attach(portal);
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
        // TODO(crisbeto): the null check is here, because the portal outlet returns `any`.
        // We should be guaranteed for the result to be `ComponentRef | EmbeddedViewRef`, but
        // `instanceof EmbeddedViewRef` doesn't appear to work at the moment.
        if (typeof attachResult?.onDestroy === 'function') {
            // In most cases we control the portal and we know when it is being detached so that
            // we can finish the disposal process. The exception is if the user passes in a custom
            // `ViewContainerRef` that isn't destroyed through the overlay API. Note that we use
            // `detach` here instead of `dispose`, because we don't know if the user intends to
            // reattach the overlay at a later point. It also has the advantage of waiting for animations.
            attachResult.onDestroy(() => {
                if (this.hasAttached()) {
                    // We have to delay the `detach` call, because detaching immediately prevents
                    // other destroy hooks from running. This is likely a framework bug similar to
                    // https://github.com/angular/angular/issues/46119
                    this._ngZone.runOutsideAngular(() => Promise.resolve().then(() => this.detach()));
                }
            });
        }
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
        if (this._animationsDisabled) {
            this._backdropElement.classList.add('cdk-overlay-backdrop-noop-animation');
        }
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
        if (!this._animationsDisabled && typeof requestAnimationFrame !== 'undefined') {
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
        if (this._animationsDisabled) {
            this._disposeBackdrop(backdropToDetach);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheS1yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL292ZXJsYXkvb3ZlcmxheS1yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBTUgsT0FBTyxFQUFhLE9BQU8sRUFBRSxLQUFLLEVBQW9CLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNoRixPQUFPLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSS9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQVV2RTs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sVUFBVTtJQTBCckIsWUFDVSxhQUEyQixFQUMzQixLQUFrQixFQUNsQixLQUFrQixFQUNsQixPQUF1QyxFQUN2QyxPQUFlLEVBQ2YsbUJBQThDLEVBQzlDLFNBQW1CLEVBQ25CLFNBQW1CLEVBQ25CLHVCQUFzRCxFQUN0RCxzQkFBc0IsS0FBSztRQVQzQixrQkFBYSxHQUFiLGFBQWEsQ0FBYztRQUMzQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBQ2xCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0M7UUFDdkMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMkI7UUFDOUMsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQUNuQixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBQ25CLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBK0I7UUFDdEQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFRO1FBbkM3QixxQkFBZ0IsR0FBdUIsSUFBSSxDQUFDO1FBRW5DLG1CQUFjLEdBQUcsSUFBSSxPQUFPLEVBQWMsQ0FBQztRQUMzQyxpQkFBWSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFDbkMsaUJBQVksR0FBRyxJQUFJLE9BQU8sRUFB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O1NBQ25DO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlyZWN0aW9uLCBEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtDb21wb25lbnRQb3J0YWwsIFBvcnRhbCwgUG9ydGFsT3V0bGV0LCBUZW1wbGF0ZVBvcnRhbH0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BvcnRhbCc7XG5pbXBvcnQge0NvbXBvbmVudFJlZiwgRW1iZWRkZWRWaWV3UmVmLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtMb2NhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgbWVyZ2UsIFN1YnNjcmlwdGlvbkxpa2UsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3Rha2UsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtPdmVybGF5S2V5Ym9hcmREaXNwYXRjaGVyfSBmcm9tICcuL2Rpc3BhdGNoZXJzL292ZXJsYXkta2V5Ym9hcmQtZGlzcGF0Y2hlcic7XG5pbXBvcnQge092ZXJsYXlPdXRzaWRlQ2xpY2tEaXNwYXRjaGVyfSBmcm9tICcuL2Rpc3BhdGNoZXJzL292ZXJsYXktb3V0c2lkZS1jbGljay1kaXNwYXRjaGVyJztcbmltcG9ydCB7T3ZlcmxheUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LWNvbmZpZyc7XG5pbXBvcnQge2NvZXJjZUNzc1BpeGVsVmFsdWUsIGNvZXJjZUFycmF5fSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtPdmVybGF5UmVmZXJlbmNlfSBmcm9tICcuL292ZXJsYXktcmVmZXJlbmNlJztcbmltcG9ydCB7UG9zaXRpb25TdHJhdGVneX0gZnJvbSAnLi9wb3NpdGlvbi9wb3NpdGlvbi1zdHJhdGVneSc7XG5pbXBvcnQge1Njcm9sbFN0cmF0ZWd5fSBmcm9tICcuL3Njcm9sbCc7XG5cbi8qKiBBbiBvYmplY3Qgd2hlcmUgYWxsIG9mIGl0cyBwcm9wZXJ0aWVzIGNhbm5vdCBiZSB3cml0dGVuLiAqL1xuZXhwb3J0IHR5cGUgSW1tdXRhYmxlT2JqZWN0PFQ+ID0ge1xuICByZWFkb25seSBbUCBpbiBrZXlvZiBUXTogVFtQXTtcbn07XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGFuIG92ZXJsYXkgdGhhdCBoYXMgYmVlbiBjcmVhdGVkIHdpdGggdGhlIE92ZXJsYXkgc2VydmljZS5cbiAqIFVzZWQgdG8gbWFuaXB1bGF0ZSBvciBkaXNwb3NlIG9mIHNhaWQgb3ZlcmxheS5cbiAqL1xuZXhwb3J0IGNsYXNzIE92ZXJsYXlSZWYgaW1wbGVtZW50cyBQb3J0YWxPdXRsZXQsIE92ZXJsYXlSZWZlcmVuY2Uge1xuICBwcml2YXRlIF9iYWNrZHJvcEVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2JhY2tkcm9wVGltZW91dDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHJlYWRvbmx5IF9iYWNrZHJvcENsaWNrID0gbmV3IFN1YmplY3Q8TW91c2VFdmVudD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYXR0YWNobWVudHMgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZXRhY2htZW50cyA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIHByaXZhdGUgX3Bvc2l0aW9uU3RyYXRlZ3k6IFBvc2l0aW9uU3RyYXRlZ3kgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX3Njcm9sbFN0cmF0ZWd5OiBTY3JvbGxTdHJhdGVneSB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfbG9jYXRpb25DaGFuZ2VzOiBTdWJzY3JpcHRpb25MaWtlID0gU3Vic2NyaXB0aW9uLkVNUFRZO1xuICBwcml2YXRlIF9iYWNrZHJvcENsaWNrSGFuZGxlciA9IChldmVudDogTW91c2VFdmVudCkgPT4gdGhpcy5fYmFja2Ryb3BDbGljay5uZXh0KGV2ZW50KTtcbiAgcHJpdmF0ZSBfYmFja2Ryb3BUcmFuc2l0aW9uZW5kSGFuZGxlciA9IChldmVudDogVHJhbnNpdGlvbkV2ZW50KSA9PiB7XG4gICAgdGhpcy5fZGlzcG9zZUJhY2tkcm9wKGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGwpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdGhlIHBhcmVudCBvZiB0aGUgYF9ob3N0YCBhdCB0aGUgdGltZSBpdCB3YXMgZGV0YWNoZWQuIFVzZWQgdG8gcmVzdG9yZVxuICAgKiB0aGUgYF9ob3N0YCB0byBpdHMgb3JpZ2luYWwgcG9zaXRpb24gaW4gdGhlIERPTSB3aGVuIGl0IGdldHMgcmUtYXR0YWNoZWQuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c0hvc3RQYXJlbnQ6IEhUTUxFbGVtZW50O1xuXG4gIC8qKiBTdHJlYW0gb2Yga2V5ZG93biBldmVudHMgZGlzcGF0Y2hlZCB0byB0aGlzIG92ZXJsYXkuICovXG4gIHJlYWRvbmx5IF9rZXlkb3duRXZlbnRzID0gbmV3IFN1YmplY3Q8S2V5Ym9hcmRFdmVudD4oKTtcblxuICAvKiogU3RyZWFtIG9mIG1vdXNlIG91dHNpZGUgZXZlbnRzIGRpc3BhdGNoZWQgdG8gdGhpcyBvdmVybGF5LiAqL1xuICByZWFkb25seSBfb3V0c2lkZVBvaW50ZXJFdmVudHMgPSBuZXcgU3ViamVjdDxNb3VzZUV2ZW50PigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX3BvcnRhbE91dGxldDogUG9ydGFsT3V0bGV0LFxuICAgIHByaXZhdGUgX2hvc3Q6IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX3BhbmU6IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgX2NvbmZpZzogSW1tdXRhYmxlT2JqZWN0PE92ZXJsYXlDb25maWc+LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgX2tleWJvYXJkRGlzcGF0Y2hlcjogT3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcixcbiAgICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQsXG4gICAgcHJpdmF0ZSBfbG9jYXRpb246IExvY2F0aW9uLFxuICAgIHByaXZhdGUgX291dHNpZGVDbGlja0Rpc3BhdGNoZXI6IE92ZXJsYXlPdXRzaWRlQ2xpY2tEaXNwYXRjaGVyLFxuICAgIHByaXZhdGUgX2FuaW1hdGlvbnNEaXNhYmxlZCA9IGZhbHNlLFxuICApIHtcbiAgICBpZiAoX2NvbmZpZy5zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kgPSBfY29uZmlnLnNjcm9sbFN0cmF0ZWd5O1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuYXR0YWNoKHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kgPSBfY29uZmlnLnBvc2l0aW9uU3RyYXRlZ3k7XG4gIH1cblxuICAvKiogVGhlIG92ZXJsYXkncyBIVE1MIGVsZW1lbnQgKi9cbiAgZ2V0IG92ZXJsYXlFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5fcGFuZTtcbiAgfVxuXG4gIC8qKiBUaGUgb3ZlcmxheSdzIGJhY2tkcm9wIEhUTUwgZWxlbWVudC4gKi9cbiAgZ2V0IGJhY2tkcm9wRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLl9iYWNrZHJvcEVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgdGhlIHBhbmVsIGVsZW1lbnQuIENhbiBiZSB1c2VkIGZvciBhZHZhbmNlZFxuICAgKiBwb3NpdGlvbmluZyB3aGVyZSBhIHdyYXBwZXIgd2l0aCBzcGVjaWZpYyBzdHlsaW5nIGlzXG4gICAqIHJlcXVpcmVkIGFyb3VuZCB0aGUgb3ZlcmxheSBwYW5lLlxuICAgKi9cbiAgZ2V0IGhvc3RFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5faG9zdDtcbiAgfVxuXG4gIGF0dGFjaDxUPihwb3J0YWw6IENvbXBvbmVudFBvcnRhbDxUPik6IENvbXBvbmVudFJlZjxUPjtcbiAgYXR0YWNoPFQ+KHBvcnRhbDogVGVtcGxhdGVQb3J0YWw8VD4pOiBFbWJlZGRlZFZpZXdSZWY8VD47XG4gIGF0dGFjaChwb3J0YWw6IGFueSk6IGFueTtcblxuICAvKipcbiAgICogQXR0YWNoZXMgY29udGVudCwgZ2l2ZW4gdmlhIGEgUG9ydGFsLCB0byB0aGUgb3ZlcmxheS5cbiAgICogSWYgdGhlIG92ZXJsYXkgaXMgY29uZmlndXJlZCB0byBoYXZlIGEgYmFja2Ryb3AsIGl0IHdpbGwgYmUgY3JlYXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHBvcnRhbCBQb3J0YWwgaW5zdGFuY2UgdG8gd2hpY2ggdG8gYXR0YWNoIHRoZSBvdmVybGF5LlxuICAgKiBAcmV0dXJucyBUaGUgcG9ydGFsIGF0dGFjaG1lbnQgcmVzdWx0LlxuICAgKi9cbiAgYXR0YWNoKHBvcnRhbDogUG9ydGFsPGFueT4pOiBhbnkge1xuICAgIC8vIEluc2VydCB0aGUgaG9zdCBpbnRvIHRoZSBET00gYmVmb3JlIGF0dGFjaGluZyB0aGUgcG9ydGFsLCBvdGhlcndpc2VcbiAgICAvLyB0aGUgYW5pbWF0aW9ucyBtb2R1bGUgd2lsbCBza2lwIGFuaW1hdGlvbnMgb24gcmVwZWF0IGF0dGFjaG1lbnRzLlxuICAgIGlmICghdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50ICYmIHRoaXMuX3ByZXZpb3VzSG9zdFBhcmVudCkge1xuICAgICAgdGhpcy5fcHJldmlvdXNIb3N0UGFyZW50LmFwcGVuZENoaWxkKHRoaXMuX2hvc3QpO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dGFjaFJlc3VsdCA9IHRoaXMuX3BvcnRhbE91dGxldC5hdHRhY2gocG9ydGFsKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVTdGFja2luZ09yZGVyKCk7XG4gICAgdGhpcy5fdXBkYXRlRWxlbWVudFNpemUoKTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50RGlyZWN0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5fc2Nyb2xsU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5LmVuYWJsZSgpO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgcG9zaXRpb24gb25jZSB0aGUgem9uZSBpcyBzdGFibGUgc28gdGhhdCB0aGUgb3ZlcmxheSB3aWxsIGJlIGZ1bGx5IHJlbmRlcmVkXG4gICAgLy8gYmVmb3JlIGF0dGVtcHRpbmcgdG8gcG9zaXRpb24gaXQsIGFzIHRoZSBwb3NpdGlvbiBtYXkgZGVwZW5kIG9uIHRoZSBzaXplIG9mIHRoZSByZW5kZXJlZFxuICAgIC8vIGNvbnRlbnQuXG4gICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLnBpcGUodGFrZSgxKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIC8vIFRoZSBvdmVybGF5IGNvdWxkJ3ZlIGJlZW4gZGV0YWNoZWQgYmVmb3JlIHRoZSB6b25lIGhhcyBzdGFiaWxpemVkLlxuICAgICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBFbmFibGUgcG9pbnRlciBldmVudHMgZm9yIHRoZSBvdmVybGF5IHBhbmUgZWxlbWVudC5cbiAgICB0aGlzLl90b2dnbGVQb2ludGVyRXZlbnRzKHRydWUpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5oYXNCYWNrZHJvcCkge1xuICAgICAgdGhpcy5fYXR0YWNoQmFja2Ryb3AoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fcGFuZSwgdGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIE9ubHkgZW1pdCB0aGUgYGF0dGFjaG1lbnRzYCBldmVudCBvbmNlIGFsbCBvdGhlciBzZXR1cCBpcyBkb25lLlxuICAgIHRoaXMuX2F0dGFjaG1lbnRzLm5leHQoKTtcblxuICAgIC8vIFRyYWNrIHRoaXMgb3ZlcmxheSBieSB0aGUga2V5Ym9hcmQgZGlzcGF0Y2hlclxuICAgIHRoaXMuX2tleWJvYXJkRGlzcGF0Y2hlci5hZGQodGhpcyk7XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLmRpc3Bvc2VPbk5hdmlnYXRpb24pIHtcbiAgICAgIHRoaXMuX2xvY2F0aW9uQ2hhbmdlcyA9IHRoaXMuX2xvY2F0aW9uLnN1YnNjcmliZSgoKSA9PiB0aGlzLmRpc3Bvc2UoKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlci5hZGQodGhpcyk7XG5cbiAgICAvLyBUT0RPKGNyaXNiZXRvKTogdGhlIG51bGwgY2hlY2sgaXMgaGVyZSwgYmVjYXVzZSB0aGUgcG9ydGFsIG91dGxldCByZXR1cm5zIGBhbnlgLlxuICAgIC8vIFdlIHNob3VsZCBiZSBndWFyYW50ZWVkIGZvciB0aGUgcmVzdWx0IHRvIGJlIGBDb21wb25lbnRSZWYgfCBFbWJlZGRlZFZpZXdSZWZgLCBidXRcbiAgICAvLyBgaW5zdGFuY2VvZiBFbWJlZGRlZFZpZXdSZWZgIGRvZXNuJ3QgYXBwZWFyIHRvIHdvcmsgYXQgdGhlIG1vbWVudC5cbiAgICBpZiAodHlwZW9mIGF0dGFjaFJlc3VsdD8ub25EZXN0cm95ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBJbiBtb3N0IGNhc2VzIHdlIGNvbnRyb2wgdGhlIHBvcnRhbCBhbmQgd2Uga25vdyB3aGVuIGl0IGlzIGJlaW5nIGRldGFjaGVkIHNvIHRoYXRcbiAgICAgIC8vIHdlIGNhbiBmaW5pc2ggdGhlIGRpc3Bvc2FsIHByb2Nlc3MuIFRoZSBleGNlcHRpb24gaXMgaWYgdGhlIHVzZXIgcGFzc2VzIGluIGEgY3VzdG9tXG4gICAgICAvLyBgVmlld0NvbnRhaW5lclJlZmAgdGhhdCBpc24ndCBkZXN0cm95ZWQgdGhyb3VnaCB0aGUgb3ZlcmxheSBBUEkuIE5vdGUgdGhhdCB3ZSB1c2VcbiAgICAgIC8vIGBkZXRhY2hgIGhlcmUgaW5zdGVhZCBvZiBgZGlzcG9zZWAsIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiB0aGUgdXNlciBpbnRlbmRzIHRvXG4gICAgICAvLyByZWF0dGFjaCB0aGUgb3ZlcmxheSBhdCBhIGxhdGVyIHBvaW50LiBJdCBhbHNvIGhhcyB0aGUgYWR2YW50YWdlIG9mIHdhaXRpbmcgZm9yIGFuaW1hdGlvbnMuXG4gICAgICBhdHRhY2hSZXN1bHQub25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0YWNoZWQoKSkge1xuICAgICAgICAgIC8vIFdlIGhhdmUgdG8gZGVsYXkgdGhlIGBkZXRhY2hgIGNhbGwsIGJlY2F1c2UgZGV0YWNoaW5nIGltbWVkaWF0ZWx5IHByZXZlbnRzXG4gICAgICAgICAgLy8gb3RoZXIgZGVzdHJveSBob29rcyBmcm9tIHJ1bm5pbmcuIFRoaXMgaXMgbGlrZWx5IGEgZnJhbWV3b3JrIGJ1ZyBzaW1pbGFyIHRvXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvNDYxMTlcbiAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLmRldGFjaCgpKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhdHRhY2hSZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgYW4gb3ZlcmxheSBmcm9tIGEgcG9ydGFsLlxuICAgKiBAcmV0dXJucyBUaGUgcG9ydGFsIGRldGFjaG1lbnQgcmVzdWx0LlxuICAgKi9cbiAgZGV0YWNoKCk6IGFueSB7XG4gICAgaWYgKCF0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRldGFjaEJhY2tkcm9wKCk7XG5cbiAgICAvLyBXaGVuIHRoZSBvdmVybGF5IGlzIGRldGFjaGVkLCB0aGUgcGFuZSBlbGVtZW50IHNob3VsZCBkaXNhYmxlIHBvaW50ZXIgZXZlbnRzLlxuICAgIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb3RoZXJ3aXNlIHRoZSBwYW5lIGVsZW1lbnQgd2lsbCBjb3ZlciB0aGUgcGFnZSBhbmQgZGlzYWJsZVxuICAgIC8vIHBvaW50ZXIgZXZlbnRzIHRoZXJlZm9yZS4gRGVwZW5kcyBvbiB0aGUgcG9zaXRpb24gc3RyYXRlZ3kgYW5kIHRoZSBhcHBsaWVkIHBhbmUgYm91bmRhcmllcy5cbiAgICB0aGlzLl90b2dnbGVQb2ludGVyRXZlbnRzKGZhbHNlKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5ICYmIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGV0YWNoKSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRldGFjaCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgdGhpcy5fc2Nyb2xsU3RyYXRlZ3kuZGlzYWJsZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRldGFjaG1lbnRSZXN1bHQgPSB0aGlzLl9wb3J0YWxPdXRsZXQuZGV0YWNoKCk7XG5cbiAgICAvLyBPbmx5IGVtaXQgYWZ0ZXIgZXZlcnl0aGluZyBpcyBkZXRhY2hlZC5cbiAgICB0aGlzLl9kZXRhY2htZW50cy5uZXh0KCk7XG5cbiAgICAvLyBSZW1vdmUgdGhpcyBvdmVybGF5IGZyb20ga2V5Ym9hcmQgZGlzcGF0Y2hlciB0cmFja2luZy5cbiAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuXG4gICAgLy8gS2VlcGluZyB0aGUgaG9zdCBlbGVtZW50IGluIHRoZSBET00gY2FuIGNhdXNlIHNjcm9sbCBqYW5rLCBiZWNhdXNlIGl0IHN0aWxsIGdldHNcbiAgICAvLyByZW5kZXJlZCwgZXZlbiB0aG91Z2ggaXQncyB0cmFuc3BhcmVudCBhbmQgdW5jbGlja2FibGUgd2hpY2ggaXMgd2h5IHdlIHJlbW92ZSBpdC5cbiAgICB0aGlzLl9kZXRhY2hDb250ZW50V2hlblN0YWJsZSgpO1xuICAgIHRoaXMuX2xvY2F0aW9uQ2hhbmdlcy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX291dHNpZGVDbGlja0Rpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuICAgIHJldHVybiBkZXRhY2htZW50UmVzdWx0O1xuICB9XG5cbiAgLyoqIENsZWFucyB1cCB0aGUgb3ZlcmxheSBmcm9tIHRoZSBET00uICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgY29uc3QgaXNBdHRhY2hlZCA9IHRoaXMuaGFzQXR0YWNoZWQoKTtcblxuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kaXNwb3NlU2Nyb2xsU3RyYXRlZ3koKTtcbiAgICB0aGlzLl9kaXNwb3NlQmFja2Ryb3AodGhpcy5fYmFja2Ryb3BFbGVtZW50KTtcbiAgICB0aGlzLl9sb2NhdGlvbkNoYW5nZXMudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLl9rZXlib2FyZERpc3BhdGNoZXIucmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuX3BvcnRhbE91dGxldC5kaXNwb3NlKCk7XG4gICAgdGhpcy5fYXR0YWNobWVudHMuY29tcGxldGUoKTtcbiAgICB0aGlzLl9iYWNrZHJvcENsaWNrLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fa2V5ZG93bkV2ZW50cy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuX291dHNpZGVQb2ludGVyRXZlbnRzLmNvbXBsZXRlKCk7XG4gICAgdGhpcy5fb3V0c2lkZUNsaWNrRGlzcGF0Y2hlci5yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5faG9zdD8ucmVtb3ZlKCk7XG5cbiAgICB0aGlzLl9wcmV2aW91c0hvc3RQYXJlbnQgPSB0aGlzLl9wYW5lID0gdGhpcy5faG9zdCA9IG51bGwhO1xuXG4gICAgaWYgKGlzQXR0YWNoZWQpIHtcbiAgICAgIHRoaXMuX2RldGFjaG1lbnRzLm5leHQoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXRhY2htZW50cy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIG92ZXJsYXkgaGFzIGF0dGFjaGVkIGNvbnRlbnQuICovXG4gIGhhc0F0dGFjaGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9wb3J0YWxPdXRsZXQuaGFzQXR0YWNoZWQoKTtcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBiYWNrZHJvcCBoYXMgYmVlbiBjbGlja2VkLiAqL1xuICBiYWNrZHJvcENsaWNrKCk6IE9ic2VydmFibGU8TW91c2VFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9iYWNrZHJvcENsaWNrO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gb2JzZXJ2YWJsZSB0aGF0IGVtaXRzIHdoZW4gdGhlIG92ZXJsYXkgaGFzIGJlZW4gYXR0YWNoZWQuICovXG4gIGF0dGFjaG1lbnRzKCk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2htZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgdGhhdCBlbWl0cyB3aGVuIHRoZSBvdmVybGF5IGhhcyBiZWVuIGRldGFjaGVkLiAqL1xuICBkZXRhY2htZW50cygpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fZGV0YWNobWVudHM7XG4gIH1cblxuICAvKiogR2V0cyBhbiBvYnNlcnZhYmxlIG9mIGtleWRvd24gZXZlbnRzIHRhcmdldGVkIHRvIHRoaXMgb3ZlcmxheS4gKi9cbiAga2V5ZG93bkV2ZW50cygpOiBPYnNlcnZhYmxlPEtleWJvYXJkRXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fa2V5ZG93bkV2ZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIGFuIG9ic2VydmFibGUgb2YgcG9pbnRlciBldmVudHMgdGFyZ2V0ZWQgb3V0c2lkZSB0aGlzIG92ZXJsYXkuICovXG4gIG91dHNpZGVQb2ludGVyRXZlbnRzKCk6IE9ic2VydmFibGU8TW91c2VFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLl9vdXRzaWRlUG9pbnRlckV2ZW50cztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBjdXJyZW50IG92ZXJsYXkgY29uZmlndXJhdGlvbiwgd2hpY2ggaXMgaW1tdXRhYmxlLiAqL1xuICBnZXRDb25maWcoKTogT3ZlcmxheUNvbmZpZyB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheSBiYXNlZCBvbiB0aGUgcG9zaXRpb24gc3RyYXRlZ3kuICovXG4gIHVwZGF0ZVBvc2l0aW9uKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5LmFwcGx5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFN3aXRjaGVzIHRvIGEgbmV3IHBvc2l0aW9uIHN0cmF0ZWd5IGFuZCB1cGRhdGVzIHRoZSBvdmVybGF5IHBvc2l0aW9uLiAqL1xuICB1cGRhdGVQb3NpdGlvblN0cmF0ZWd5KHN0cmF0ZWd5OiBQb3NpdGlvblN0cmF0ZWd5KTogdm9pZCB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSB0aGlzLl9wb3NpdGlvblN0cmF0ZWd5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3Bvc2l0aW9uU3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICAgIGlmICh0aGlzLmhhc0F0dGFjaGVkKCkpIHtcbiAgICAgIHN0cmF0ZWd5LmF0dGFjaCh0aGlzKTtcbiAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBzaXplIHByb3BlcnRpZXMgb2YgdGhlIG92ZXJsYXkuICovXG4gIHVwZGF0ZVNpemUoc2l6ZUNvbmZpZzogT3ZlcmxheVNpemVDb25maWcpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25maWcgPSB7Li4udGhpcy5fY29uZmlnLCAuLi5zaXplQ29uZmlnfTtcbiAgICB0aGlzLl91cGRhdGVFbGVtZW50U2l6ZSgpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIExUUi9SVEwgZGlyZWN0aW9uIGZvciB0aGUgb3ZlcmxheS4gKi9cbiAgc2V0RGlyZWN0aW9uKGRpcjogRGlyZWN0aW9uIHwgRGlyZWN0aW9uYWxpdHkpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25maWcgPSB7Li4udGhpcy5fY29uZmlnLCBkaXJlY3Rpb246IGRpcn07XG4gICAgdGhpcy5fdXBkYXRlRWxlbWVudERpcmVjdGlvbigpO1xuICB9XG5cbiAgLyoqIEFkZCBhIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIHRvIHRoZSBvdmVybGF5IHBhbmUuICovXG4gIGFkZFBhbmVsQ2xhc3MoY2xhc3Nlczogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcGFuZSkge1xuICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCBjbGFzc2VzLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlIGEgQ1NTIGNsYXNzIG9yIGFuIGFycmF5IG9mIGNsYXNzZXMgZnJvbSB0aGUgb3ZlcmxheSBwYW5lLiAqL1xuICByZW1vdmVQYW5lbENsYXNzKGNsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3BhbmUpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZUNsYXNzZXModGhpcy5fcGFuZSwgY2xhc3NlcywgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBvdmVybGF5IHBhbmVsLlxuICAgKi9cbiAgZ2V0RGlyZWN0aW9uKCk6IERpcmVjdGlvbiB7XG4gICAgY29uc3QgZGlyZWN0aW9uID0gdGhpcy5fY29uZmlnLmRpcmVjdGlvbjtcblxuICAgIGlmICghZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gJ2x0cic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHR5cGVvZiBkaXJlY3Rpb24gPT09ICdzdHJpbmcnID8gZGlyZWN0aW9uIDogZGlyZWN0aW9uLnZhbHVlO1xuICB9XG5cbiAgLyoqIFN3aXRjaGVzIHRvIGEgbmV3IHNjcm9sbCBzdHJhdGVneS4gKi9cbiAgdXBkYXRlU2Nyb2xsU3RyYXRlZ3koc3RyYXRlZ3k6IFNjcm9sbFN0cmF0ZWd5KTogdm9pZCB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSB0aGlzLl9zY3JvbGxTdHJhdGVneSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2Rpc3Bvc2VTY3JvbGxTdHJhdGVneSgpO1xuICAgIHRoaXMuX3Njcm9sbFN0cmF0ZWd5ID0gc3RyYXRlZ3k7XG5cbiAgICBpZiAodGhpcy5oYXNBdHRhY2hlZCgpKSB7XG4gICAgICBzdHJhdGVneS5hdHRhY2godGhpcyk7XG4gICAgICBzdHJhdGVneS5lbmFibGUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogVXBkYXRlcyB0aGUgdGV4dCBkaXJlY3Rpb24gb2YgdGhlIG92ZXJsYXkgcGFuZWwuICovXG4gIHByaXZhdGUgX3VwZGF0ZUVsZW1lbnREaXJlY3Rpb24oKSB7XG4gICAgdGhpcy5faG9zdC5zZXRBdHRyaWJ1dGUoJ2RpcicsIHRoaXMuZ2V0RGlyZWN0aW9uKCkpO1xuICB9XG5cbiAgLyoqIFVwZGF0ZXMgdGhlIHNpemUgb2YgdGhlIG92ZXJsYXkgZWxlbWVudCBiYXNlZCBvbiB0aGUgb3ZlcmxheSBjb25maWcuICovXG4gIHByaXZhdGUgX3VwZGF0ZUVsZW1lbnRTaXplKCkge1xuICAgIGlmICghdGhpcy5fcGFuZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0eWxlID0gdGhpcy5fcGFuZS5zdHlsZTtcblxuICAgIHN0eWxlLndpZHRoID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcud2lkdGgpO1xuICAgIHN0eWxlLmhlaWdodCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLmhlaWdodCk7XG4gICAgc3R5bGUubWluV2lkdGggPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5taW5XaWR0aCk7XG4gICAgc3R5bGUubWluSGVpZ2h0ID0gY29lcmNlQ3NzUGl4ZWxWYWx1ZSh0aGlzLl9jb25maWcubWluSGVpZ2h0KTtcbiAgICBzdHlsZS5tYXhXaWR0aCA9IGNvZXJjZUNzc1BpeGVsVmFsdWUodGhpcy5fY29uZmlnLm1heFdpZHRoKTtcbiAgICBzdHlsZS5tYXhIZWlnaHQgPSBjb2VyY2VDc3NQaXhlbFZhbHVlKHRoaXMuX2NvbmZpZy5tYXhIZWlnaHQpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIHBvaW50ZXIgZXZlbnRzIGZvciB0aGUgb3ZlcmxheSBwYW5lIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3RvZ2dsZVBvaW50ZXJFdmVudHMoZW5hYmxlUG9pbnRlcjogYm9vbGVhbikge1xuICAgIHRoaXMuX3BhbmUuc3R5bGUucG9pbnRlckV2ZW50cyA9IGVuYWJsZVBvaW50ZXIgPyAnJyA6ICdub25lJztcbiAgfVxuXG4gIC8qKiBBdHRhY2hlcyBhIGJhY2tkcm9wIGZvciB0aGlzIG92ZXJsYXkuICovXG4gIHByaXZhdGUgX2F0dGFjaEJhY2tkcm9wKCkge1xuICAgIGNvbnN0IHNob3dpbmdDbGFzcyA9ICdjZGstb3ZlcmxheS1iYWNrZHJvcC1zaG93aW5nJztcblxuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX2JhY2tkcm9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjZGstb3ZlcmxheS1iYWNrZHJvcCcpO1xuXG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbnNEaXNhYmxlZCkge1xuICAgICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2Nkay1vdmVybGF5LWJhY2tkcm9wLW5vb3AtYW5pbWF0aW9uJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5iYWNrZHJvcENsYXNzKSB7XG4gICAgICB0aGlzLl90b2dnbGVDbGFzc2VzKHRoaXMuX2JhY2tkcm9wRWxlbWVudCwgdGhpcy5fY29uZmlnLmJhY2tkcm9wQ2xhc3MsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIEluc2VydCB0aGUgYmFja2Ryb3AgYmVmb3JlIHRoZSBwYW5lIGluIHRoZSBET00gb3JkZXIsXG4gICAgLy8gaW4gb3JkZXIgdG8gaGFuZGxlIHN0YWNrZWQgb3ZlcmxheXMgcHJvcGVybHkuXG4gICAgdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50IS5pbnNlcnRCZWZvcmUodGhpcy5fYmFja2Ryb3BFbGVtZW50LCB0aGlzLl9ob3N0KTtcblxuICAgIC8vIEZvcndhcmQgYmFja2Ryb3AgY2xpY2tzIHN1Y2ggdGhhdCB0aGUgY29uc3VtZXIgb2YgdGhlIG92ZXJsYXkgY2FuIHBlcmZvcm0gd2hhdGV2ZXJcbiAgICAvLyBhY3Rpb24gZGVzaXJlZCB3aGVuIHN1Y2ggYSBjbGljayBvY2N1cnMgKHVzdWFsbHkgY2xvc2luZyB0aGUgb3ZlcmxheSkuXG4gICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fYmFja2Ryb3BDbGlja0hhbmRsZXIpO1xuXG4gICAgLy8gQWRkIGNsYXNzIHRvIGZhZGUtaW4gdGhlIGJhY2tkcm9wIGFmdGVyIG9uZSBmcmFtZS5cbiAgICBpZiAoIXRoaXMuX2FuaW1hdGlvbnNEaXNhYmxlZCAmJiB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5fYmFja2Ryb3BFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQuY2xhc3NMaXN0LmFkZChzaG93aW5nQ2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYmFja2Ryb3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoc2hvd2luZ0NsYXNzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgc3RhY2tpbmcgb3JkZXIgb2YgdGhlIGVsZW1lbnQsIG1vdmluZyBpdCB0byB0aGUgdG9wIGlmIG5lY2Vzc2FyeS5cbiAgICogVGhpcyBpcyByZXF1aXJlZCBpbiBjYXNlcyB3aGVyZSBvbmUgb3ZlcmxheSB3YXMgZGV0YWNoZWQsIHdoaWxlIGFub3RoZXIgb25lLFxuICAgKiB0aGF0IHNob3VsZCBiZSBiZWhpbmQgaXQsIHdhcyBkZXN0cm95ZWQuIFRoZSBuZXh0IHRpbWUgYm90aCBvZiB0aGVtIGFyZSBvcGVuZWQsXG4gICAqIHRoZSBzdGFja2luZyB3aWxsIGJlIHdyb25nLCBiZWNhdXNlIHRoZSBkZXRhY2hlZCBlbGVtZW50J3MgcGFuZSB3aWxsIHN0aWxsIGJlXG4gICAqIGluIGl0cyBvcmlnaW5hbCBET00gcG9zaXRpb24uXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVTdGFja2luZ09yZGVyKCkge1xuICAgIGlmICh0aGlzLl9ob3N0Lm5leHRTaWJsaW5nKSB7XG4gICAgICB0aGlzLl9ob3N0LnBhcmVudE5vZGUhLmFwcGVuZENoaWxkKHRoaXMuX2hvc3QpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZXRhY2hlcyB0aGUgYmFja2Ryb3AgKGlmIGFueSkgYXNzb2NpYXRlZCB3aXRoIHRoZSBvdmVybGF5LiAqL1xuICBkZXRhY2hCYWNrZHJvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBiYWNrZHJvcFRvRGV0YWNoID0gdGhpcy5fYmFja2Ryb3BFbGVtZW50O1xuXG4gICAgaWYgKCFiYWNrZHJvcFRvRGV0YWNoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbnNEaXNhYmxlZCkge1xuICAgICAgdGhpcy5fZGlzcG9zZUJhY2tkcm9wKGJhY2tkcm9wVG9EZXRhY2gpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGJhY2tkcm9wVG9EZXRhY2guY2xhc3NMaXN0LnJlbW92ZSgnY2RrLW92ZXJsYXktYmFja2Ryb3Atc2hvd2luZycpO1xuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGJhY2tkcm9wVG9EZXRhY2ghLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLl9iYWNrZHJvcFRyYW5zaXRpb25lbmRIYW5kbGVyKTtcbiAgICB9KTtcblxuICAgIC8vIElmIHRoZSBiYWNrZHJvcCBkb2Vzbid0IGhhdmUgYSB0cmFuc2l0aW9uLCB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50IHdvbid0IGZpcmUuXG4gICAgLy8gSW4gdGhpcyBjYXNlIHdlIG1ha2UgaXQgdW5jbGlja2FibGUgYW5kIHdlIHRyeSB0byByZW1vdmUgaXQgYWZ0ZXIgYSBkZWxheS5cbiAgICBiYWNrZHJvcFRvRGV0YWNoLnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XG5cbiAgICAvLyBSdW4gdGhpcyBvdXRzaWRlIHRoZSBBbmd1bGFyIHpvbmUgYmVjYXVzZSB0aGVyZSdzIG5vdGhpbmcgdGhhdCBBbmd1bGFyIGNhcmVzIGFib3V0LlxuICAgIC8vIElmIGl0IHdlcmUgdG8gcnVuIGluc2lkZSB0aGUgQW5ndWxhciB6b25lLCBldmVyeSB0ZXN0IHRoYXQgdXNlZCBPdmVybGF5IHdvdWxkIGhhdmUgdG8gYmVcbiAgICAvLyBlaXRoZXIgYXN5bmMgb3IgZmFrZUFzeW5jLlxuICAgIHRoaXMuX2JhY2tkcm9wVGltZW91dCA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2VCYWNrZHJvcChiYWNrZHJvcFRvRGV0YWNoKTtcbiAgICAgIH0sIDUwMCksXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBUb2dnbGVzIGEgc2luZ2xlIENTUyBjbGFzcyBvciBhbiBhcnJheSBvZiBjbGFzc2VzIG9uIGFuIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3RvZ2dsZUNsYXNzZXMoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNzc0NsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdLCBpc0FkZDogYm9vbGVhbikge1xuICAgIGNvbnN0IGNsYXNzZXMgPSBjb2VyY2VBcnJheShjc3NDbGFzc2VzIHx8IFtdKS5maWx0ZXIoYyA9PiAhIWMpO1xuXG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICBpc0FkZCA/IGVsZW1lbnQuY2xhc3NMaXN0LmFkZCguLi5jbGFzc2VzKSA6IGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSguLi5jbGFzc2VzKTtcbiAgICB9XG4gIH1cblxuICAvKiogRGV0YWNoZXMgdGhlIG92ZXJsYXkgY29udGVudCBuZXh0IHRpbWUgdGhlIHpvbmUgc3RhYmlsaXplcy4gKi9cbiAgcHJpdmF0ZSBfZGV0YWNoQ29udGVudFdoZW5TdGFibGUoKSB7XG4gICAgLy8gTm9ybWFsbHkgd2Ugd291bGRuJ3QgaGF2ZSB0byBleHBsaWNpdGx5IHJ1biB0aGlzIG91dHNpZGUgdGhlIGBOZ1pvbmVgLCBob3dldmVyXG4gICAgLy8gaWYgdGhlIGNvbnN1bWVyIGlzIHVzaW5nIGB6b25lLXBhdGNoLXJ4anNgLCB0aGUgYFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZWAgY2FsbCB3aWxsXG4gICAgLy8gYmUgcGF0Y2hlZCB0byBydW4gaW5zaWRlIHRoZSB6b25lLCB3aGljaCB3aWxsIHRocm93IHVzIGludG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgLy8gV2UgY2FuJ3QgcmVtb3ZlIHRoZSBob3N0IGhlcmUgaW1tZWRpYXRlbHksIGJlY2F1c2UgdGhlIG92ZXJsYXkgcGFuZSdzIGNvbnRlbnRcbiAgICAgIC8vIG1pZ2h0IHN0aWxsIGJlIGFuaW1hdGluZy4gVGhpcyBzdHJlYW0gaGVscHMgdXMgYXZvaWQgaW50ZXJydXB0aW5nIHRoZSBhbmltYXRpb25cbiAgICAgIC8vIGJ5IHdhaXRpbmcgZm9yIHRoZSBwYW5lIHRvIGJlY29tZSBlbXB0eS5cbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHRoaXMuX25nWm9uZS5vblN0YWJsZVxuICAgICAgICAucGlwZSh0YWtlVW50aWwobWVyZ2UodGhpcy5fYXR0YWNobWVudHMsIHRoaXMuX2RldGFjaG1lbnRzKSkpXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIC8vIE5lZWRzIGEgY291cGxlIG9mIGNoZWNrcyBmb3IgdGhlIHBhbmUgYW5kIGhvc3QsIGJlY2F1c2VcbiAgICAgICAgICAvLyB0aGV5IG1heSBoYXZlIGJlZW4gcmVtb3ZlZCBieSB0aGUgdGltZSB0aGUgem9uZSBzdGFiaWxpemVzLlxuICAgICAgICAgIGlmICghdGhpcy5fcGFuZSB8fCAhdGhpcy5faG9zdCB8fCB0aGlzLl9wYW5lLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BhbmUgJiYgdGhpcy5fY29uZmlnLnBhbmVsQ2xhc3MpIHtcbiAgICAgICAgICAgICAgdGhpcy5fdG9nZ2xlQ2xhc3Nlcyh0aGlzLl9wYW5lLCB0aGlzLl9jb25maWcucGFuZWxDbGFzcywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5faG9zdCAmJiB0aGlzLl9ob3N0LnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgdGhpcy5fcHJldmlvdXNIb3N0UGFyZW50ID0gdGhpcy5faG9zdC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICB0aGlzLl9ob3N0LnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIERpc3Bvc2VzIG9mIGEgc2Nyb2xsIHN0cmF0ZWd5LiAqL1xuICBwcml2YXRlIF9kaXNwb3NlU2Nyb2xsU3RyYXRlZ3koKSB7XG4gICAgY29uc3Qgc2Nyb2xsU3RyYXRlZ3kgPSB0aGlzLl9zY3JvbGxTdHJhdGVneTtcblxuICAgIGlmIChzY3JvbGxTdHJhdGVneSkge1xuICAgICAgc2Nyb2xsU3RyYXRlZ3kuZGlzYWJsZSgpO1xuXG4gICAgICBpZiAoc2Nyb2xsU3RyYXRlZ3kuZGV0YWNoKSB7XG4gICAgICAgIHNjcm9sbFN0cmF0ZWd5LmRldGFjaCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGEgYmFja2Ryb3AgZWxlbWVudCBmcm9tIHRoZSBET00uICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VCYWNrZHJvcChiYWNrZHJvcDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XG4gICAgaWYgKGJhY2tkcm9wKSB7XG4gICAgICBiYWNrZHJvcC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2JhY2tkcm9wQ2xpY2tIYW5kbGVyKTtcbiAgICAgIGJhY2tkcm9wLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLl9iYWNrZHJvcFRyYW5zaXRpb25lbmRIYW5kbGVyKTtcbiAgICAgIGJhY2tkcm9wLnJlbW92ZSgpO1xuXG4gICAgICAvLyBJdCBpcyBwb3NzaWJsZSB0aGF0IGEgbmV3IHBvcnRhbCBoYXMgYmVlbiBhdHRhY2hlZCB0byB0aGlzIG92ZXJsYXkgc2luY2Ugd2Ugc3RhcnRlZFxuICAgICAgLy8gcmVtb3ZpbmcgdGhlIGJhY2tkcm9wLiBJZiB0aGF0IGlzIHRoZSBjYXNlLCBvbmx5IGNsZWFyIHRoZSBiYWNrZHJvcCByZWZlcmVuY2UgaWYgaXRcbiAgICAgIC8vIGlzIHN0aWxsIHRoZSBzYW1lIGluc3RhbmNlIHRoYXQgd2Ugc3RhcnRlZCB0byByZW1vdmUuXG4gICAgICBpZiAodGhpcy5fYmFja2Ryb3BFbGVtZW50ID09PSBiYWNrZHJvcCkge1xuICAgICAgICB0aGlzLl9iYWNrZHJvcEVsZW1lbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9iYWNrZHJvcFRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9iYWNrZHJvcFRpbWVvdXQpO1xuICAgICAgdGhpcy5fYmFja2Ryb3BUaW1lb3V0ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxufVxuXG4vKiogU2l6ZSBwcm9wZXJ0aWVzIGZvciBhbiBvdmVybGF5LiAqL1xuZXhwb3J0IGludGVyZmFjZSBPdmVybGF5U2l6ZUNvbmZpZyB7XG4gIHdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBoZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1pbldpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBtaW5IZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG4gIG1heFdpZHRoPzogbnVtYmVyIHwgc3RyaW5nO1xuICBtYXhIZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmc7XG59XG4iXX0=