/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ContentObserver } from '@angular/cdk/observers';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Inject, Injectable, Input, NgZone, Optional, } from '@angular/core';
import { LIVE_ANNOUNCER_ELEMENT_TOKEN, LIVE_ANNOUNCER_DEFAULT_OPTIONS, } from './live-announcer-tokens';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/observers";
let uniqueIds = 0;
class LiveAnnouncer {
    constructor(elementToken, _ngZone, _document, _defaultOptions) {
        this._ngZone = _ngZone;
        this._defaultOptions = _defaultOptions;
        // We inject the live element and document as `any` because the constructor signature cannot
        // reference browser globals (HTMLElement, Document) on non-browser environments, since having
        // a class decorator causes TypeScript to preserve the constructor signature types.
        this._document = _document;
        this._liveElement = elementToken || this._createLiveElement();
    }
    announce(message, ...args) {
        const defaultOptions = this._defaultOptions;
        let politeness;
        let duration;
        if (args.length === 1 && typeof args[0] === 'number') {
            duration = args[0];
        }
        else {
            [politeness, duration] = args;
        }
        this.clear();
        clearTimeout(this._previousTimeout);
        if (!politeness) {
            politeness =
                defaultOptions && defaultOptions.politeness ? defaultOptions.politeness : 'polite';
        }
        if (duration == null && defaultOptions) {
            duration = defaultOptions.duration;
        }
        // TODO: ensure changing the politeness works on all environments we support.
        this._liveElement.setAttribute('aria-live', politeness);
        if (this._liveElement.id) {
            this._exposeAnnouncerToModals(this._liveElement.id);
        }
        // This 100ms timeout is necessary for some browser + screen-reader combinations:
        // - Both JAWS and NVDA over IE11 will not announce anything without a non-zero timeout.
        // - With Chrome and IE11 with NVDA or JAWS, a repeated (identical) message won't be read a
        //   second time without clearing and then using a non-zero delay.
        // (using JAWS 17 at time of this writing).
        return this._ngZone.runOutsideAngular(() => {
            if (!this._currentPromise) {
                this._currentPromise = new Promise(resolve => (this._currentResolve = resolve));
            }
            clearTimeout(this._previousTimeout);
            this._previousTimeout = setTimeout(() => {
                this._liveElement.textContent = message;
                if (typeof duration === 'number') {
                    this._previousTimeout = setTimeout(() => this.clear(), duration);
                }
                this._currentResolve();
                this._currentPromise = this._currentResolve = undefined;
            }, 100);
            return this._currentPromise;
        });
    }
    /**
     * Clears the current text from the announcer element. Can be used to prevent
     * screen readers from reading the text out again while the user is going
     * through the page landmarks.
     */
    clear() {
        if (this._liveElement) {
            this._liveElement.textContent = '';
        }
    }
    ngOnDestroy() {
        clearTimeout(this._previousTimeout);
        this._liveElement?.remove();
        this._liveElement = null;
        this._currentResolve?.();
        this._currentPromise = this._currentResolve = undefined;
    }
    _createLiveElement() {
        const elementClass = 'cdk-live-announcer-element';
        const previousElements = this._document.getElementsByClassName(elementClass);
        const liveEl = this._document.createElement('div');
        // Remove any old containers. This can happen when coming in from a server-side-rendered page.
        for (let i = 0; i < previousElements.length; i++) {
            previousElements[i].remove();
        }
        liveEl.classList.add(elementClass);
        liveEl.classList.add('cdk-visually-hidden');
        liveEl.setAttribute('aria-atomic', 'true');
        liveEl.setAttribute('aria-live', 'polite');
        liveEl.id = `cdk-live-announcer-${uniqueIds++}`;
        this._document.body.appendChild(liveEl);
        return liveEl;
    }
    /**
     * Some browsers won't expose the accessibility node of the live announcer element if there is an
     * `aria-modal` and the live announcer is outside of it. This method works around the issue by
     * pointing the `aria-owns` of all modals to the live announcer element.
     */
    _exposeAnnouncerToModals(id) {
        // Note that the selector here is limited to CDK overlays at the moment in order to reduce the
        // section of the DOM we need to look through. This should cover all the cases we support, but
        // the selector can be expanded if it turns out to be too narrow.
        const modals = this._document.querySelectorAll('body > .cdk-overlay-container [aria-modal="true"]');
        for (let i = 0; i < modals.length; i++) {
            const modal = modals[i];
            const ariaOwns = modal.getAttribute('aria-owns');
            if (!ariaOwns) {
                modal.setAttribute('aria-owns', id);
            }
            else if (ariaOwns.indexOf(id) === -1) {
                modal.setAttribute('aria-owns', ariaOwns + ' ' + id);
            }
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: LiveAnnouncer, deps: [{ token: LIVE_ANNOUNCER_ELEMENT_TOKEN, optional: true }, { token: i0.NgZone }, { token: DOCUMENT }, { token: LIVE_ANNOUNCER_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: LiveAnnouncer, providedIn: 'root' }); }
}
export { LiveAnnouncer };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: LiveAnnouncer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [LIVE_ANNOUNCER_ELEMENT_TOKEN]
                }] }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [LIVE_ANNOUNCER_DEFAULT_OPTIONS]
                }] }]; } });
/**
 * A directive that works similarly to aria-live, but uses the LiveAnnouncer to ensure compatibility
 * with a wider range of browsers and screen readers.
 */
class CdkAriaLive {
    /** The aria-live politeness level to use when announcing messages. */
    get politeness() {
        return this._politeness;
    }
    set politeness(value) {
        this._politeness = value === 'off' || value === 'assertive' ? value : 'polite';
        if (this._politeness === 'off') {
            if (this._subscription) {
                this._subscription.unsubscribe();
                this._subscription = null;
            }
        }
        else if (!this._subscription) {
            this._subscription = this._ngZone.runOutsideAngular(() => {
                return this._contentObserver.observe(this._elementRef).subscribe(() => {
                    // Note that we use textContent here, rather than innerText, in order to avoid a reflow.
                    const elementText = this._elementRef.nativeElement.textContent;
                    // The `MutationObserver` fires also for attribute
                    // changes which we don't want to announce.
                    if (elementText !== this._previousAnnouncedText) {
                        this._liveAnnouncer.announce(elementText, this._politeness, this.duration);
                        this._previousAnnouncedText = elementText;
                    }
                });
            });
        }
    }
    constructor(_elementRef, _liveAnnouncer, _contentObserver, _ngZone) {
        this._elementRef = _elementRef;
        this._liveAnnouncer = _liveAnnouncer;
        this._contentObserver = _contentObserver;
        this._ngZone = _ngZone;
        this._politeness = 'polite';
    }
    ngOnDestroy() {
        if (this._subscription) {
            this._subscription.unsubscribe();
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkAriaLive, deps: [{ token: i0.ElementRef }, { token: LiveAnnouncer }, { token: i1.ContentObserver }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkAriaLive, selector: "[cdkAriaLive]", inputs: { politeness: ["cdkAriaLive", "politeness"], duration: ["cdkAriaLiveDuration", "duration"] }, exportAs: ["cdkAriaLive"], ngImport: i0 }); }
}
export { CdkAriaLive };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkAriaLive, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkAriaLive]',
                    exportAs: 'cdkAriaLive',
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: LiveAnnouncer }, { type: i1.ContentObserver }, { type: i0.NgZone }]; }, propDecorators: { politeness: [{
                type: Input,
                args: ['cdkAriaLive']
            }], duration: [{
                type: Input,
                args: ['cdkAriaLiveDuration']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1hbm5vdW5jZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvbGl2ZS1hbm5vdW5jZXIvbGl2ZS1hbm5vdW5jZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sVUFBVSxFQUNWLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFHTCw0QkFBNEIsRUFDNUIsOEJBQThCLEdBQy9CLE1BQU0seUJBQXlCLENBQUM7OztBQUVqQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFFbEIsTUFDYSxhQUFhO0lBT3hCLFlBQ29ELFlBQWlCLEVBQzNELE9BQWUsRUFDTCxTQUFjLEVBR3hCLGVBQTZDO1FBSjdDLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFJZixvQkFBZSxHQUFmLGVBQWUsQ0FBOEI7UUFFckQsNEZBQTRGO1FBQzVGLDhGQUE4RjtRQUM5RixtRkFBbUY7UUFDbkYsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDaEUsQ0FBQztJQXNDRCxRQUFRLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztRQUN0QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzVDLElBQUksVUFBMEMsQ0FBQztRQUMvQyxJQUFJLFFBQTRCLENBQUM7UUFFakMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxD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LEtBQUs7dUJBQUMsYUFBYTtnQkE4QlUsUUFBUTtzQkFBckMsS0FBSzt1QkFBQyxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb250ZW50T2JzZXJ2ZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9vYnNlcnZlcnMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIEFyaWFMaXZlUG9saXRlbmVzcyxcbiAgTGl2ZUFubm91bmNlckRlZmF1bHRPcHRpb25zLFxuICBMSVZFX0FOTk9VTkNFUl9FTEVNRU5UX1RPS0VOLFxuICBMSVZFX0FOTk9VTkNFUl9ERUZBVUxUX09QVElPTlMsXG59IGZyb20gJy4vbGl2ZS1hbm5vdW5jZXItdG9rZW5zJztcblxubGV0IHVuaXF1ZUlkcyA9IDA7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIExpdmVBbm5vdW5jZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9saXZlRWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcbiAgcHJpdmF0ZSBfcHJldmlvdXNUaW1lb3V0OiBudW1iZXI7XG4gIHByaXZhdGUgX2N1cnJlbnRQcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9jdXJyZW50UmVzb2x2ZTogKCgpID0+IHZvaWQpIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoTElWRV9BTk5PVU5DRVJfRUxFTUVOVF9UT0tFTikgZWxlbWVudFRva2VuOiBhbnksXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgQE9wdGlvbmFsKClcbiAgICBASW5qZWN0KExJVkVfQU5OT1VOQ0VSX0RFRkFVTFRfT1BUSU9OUylcbiAgICBwcml2YXRlIF9kZWZhdWx0T3B0aW9ucz86IExpdmVBbm5vdW5jZXJEZWZhdWx0T3B0aW9ucyxcbiAgKSB7XG4gICAgLy8gV2UgaW5qZWN0IHRoZSBsaXZlIGVsZW1lbnQgYW5kIGRvY3VtZW50IGFzIGBhbnlgIGJlY2F1c2UgdGhlIGNvbnN0cnVjdG9yIHNpZ25hdHVyZSBjYW5ub3RcbiAgICAvLyByZWZlcmVuY2UgYnJvd3NlciBnbG9iYWxzIChIVE1MRWxlbWVudCwgRG9jdW1lbnQpIG9uIG5vbi1icm93c2VyIGVudmlyb25tZW50cywgc2luY2UgaGF2aW5nXG4gICAgLy8gYSBjbGFzcyBkZWNvcmF0b3IgY2F1c2VzIFR5cGVTY3JpcHQgdG8gcHJlc2VydmUgdGhlIGNvbnN0cnVjdG9yIHNpZ25hdHVyZSB0eXBlcy5cbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLl9saXZlRWxlbWVudCA9IGVsZW1lbnRUb2tlbiB8fCB0aGlzLl9jcmVhdGVMaXZlRWxlbWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVuIHJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW4gcmVhZGVyLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbiByZWFkZXJzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGFubm91bmNlZCB0byB0aGUgc2NyZWVuIHJlYWRlci5cbiAgICogQHBhcmFtIHBvbGl0ZW5lc3MgVGhlIHBvbGl0ZW5lc3Mgb2YgdGhlIGFubm91bmNlciBlbGVtZW50LlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIHBvbGl0ZW5lc3M/OiBBcmlhTGl2ZVBvbGl0ZW5lc3MpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbiByZWFkZXJzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGFubm91bmNlZCB0byB0aGUgc2NyZWVuIHJlYWRlci5cbiAgICogQHBhcmFtIGR1cmF0aW9uIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRvIGNsZWFyIG91dCB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuIE5vdGVcbiAgICogICB0aGF0IHRoaXMgdGFrZXMgZWZmZWN0IGFmdGVyIHRoZSBtZXNzYWdlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBET00sIHdoaWNoIGNhbiBiZSB1cCB0b1xuICAgKiAgIDEwMG1zIGFmdGVyIGBhbm5vdW5jZWAgaGFzIGJlZW4gY2FsbGVkLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQW5ub3VuY2VzIGEgbWVzc2FnZSB0byBzY3JlZW4gcmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbiByZWFkZXIuXG4gICAqIEBwYXJhbSBwb2xpdGVuZXNzIFRoZSBwb2xpdGVuZXNzIG9mIHRoZSBhbm5vdW5jZXIgZWxlbWVudC5cbiAgICogQHBhcmFtIGR1cmF0aW9uIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRvIGNsZWFyIG91dCB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuIE5vdGVcbiAgICogICB0aGF0IHRoaXMgdGFrZXMgZWZmZWN0IGFmdGVyIHRoZSBtZXNzYWdlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBET00sIHdoaWNoIGNhbiBiZSB1cCB0b1xuICAgKiAgIDEwMG1zIGFmdGVyIGBhbm5vdW5jZWAgaGFzIGJlZW4gY2FsbGVkLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIHBvbGl0ZW5lc3M/OiBBcmlhTGl2ZVBvbGl0ZW5lc3MsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPjtcblxuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB0aGlzLl9kZWZhdWx0T3B0aW9ucztcbiAgICBsZXQgcG9saXRlbmVzczogQXJpYUxpdmVQb2xpdGVuZXNzIHwgdW5kZWZpbmVkO1xuICAgIGxldCBkdXJhdGlvbjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSAnbnVtYmVyJykge1xuICAgICAgZHVyYXRpb24gPSBhcmdzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBbcG9saXRlbmVzcywgZHVyYXRpb25dID0gYXJncztcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3ByZXZpb3VzVGltZW91dCk7XG5cbiAgICBpZiAoIXBvbGl0ZW5lc3MpIHtcbiAgICAgIHBvbGl0ZW5lc3MgPVxuICAgICAgICBkZWZhdWx0T3B0aW9ucyAmJiBkZWZhdWx0T3B0aW9ucy5wb2xpdGVuZXNzID8gZGVmYXVsdE9wdGlvbnMucG9saXRlbmVzcyA6ICdwb2xpdGUnO1xuICAgIH1cblxuICAgIGlmIChkdXJhdGlvbiA9PSBudWxsICYmIGRlZmF1bHRPcHRpb25zKSB7XG4gICAgICBkdXJhdGlvbiA9IGRlZmF1bHRPcHRpb25zLmR1cmF0aW9uO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGVuc3VyZSBjaGFuZ2luZyB0aGUgcG9saXRlbmVzcyB3b3JrcyBvbiBhbGwgZW52aXJvbm1lbnRzIHdlIHN1cHBvcnQuXG4gICAgdGhpcy5fbGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCBwb2xpdGVuZXNzKTtcblxuICAgIGlmICh0aGlzLl9saXZlRWxlbWVudC5pZCkge1xuICAgICAgdGhpcy5fZXhwb3NlQW5ub3VuY2VyVG9Nb2RhbHModGhpcy5fbGl2ZUVsZW1lbnQuaWQpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgMTAwbXMgdGltZW91dCBpcyBuZWNlc3NhcnkgZm9yIHNvbWUgYnJvd3NlciArIHNjcmVlbi1yZWFkZXIgY29tYmluYXRpb25zOlxuICAgIC8vIC0gQm90aCBKQVdTIGFuZCBOVkRBIG92ZXIgSUUxMSB3aWxsIG5vdCBhbm5vdW5jZSBhbnl0aGluZyB3aXRob3V0IGEgbm9uLXplcm8gdGltZW91dC5cbiAgICAvLyAtIFdpdGggQ2hyb21lIGFuZCBJRTExIHdpdGggTlZEQSBvciBKQVdTLCBhIHJlcGVhdGVkIChpZGVudGljYWwpIG1lc3NhZ2Ugd29uJ3QgYmUgcmVhZCBhXG4gICAgLy8gICBzZWNvbmQgdGltZSB3aXRob3V0IGNsZWFyaW5nIGFuZCB0aGVuIHVzaW5nIGEgbm9uLXplcm8gZGVsYXkuXG4gICAgLy8gKHVzaW5nIEpBV1MgMTcgYXQgdGltZSBvZiB0aGlzIHdyaXRpbmcpLlxuICAgIHJldHVybiB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9jdXJyZW50UHJvbWlzZSkge1xuICAgICAgICB0aGlzLl9jdXJyZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gKHRoaXMuX2N1cnJlbnRSZXNvbHZlID0gcmVzb2x2ZSkpO1xuICAgICAgfVxuXG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fcHJldmlvdXNUaW1lb3V0KTtcbiAgICAgIHRoaXMuX3ByZXZpb3VzVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLl9saXZlRWxlbWVudC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICB0aGlzLl9wcmV2aW91c1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2xlYXIoKSwgZHVyYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY3VycmVudFJlc29sdmUhKCk7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRQcm9taXNlID0gdGhpcy5fY3VycmVudFJlc29sdmUgPSB1bmRlZmluZWQ7XG4gICAgICB9LCAxMDApO1xuXG4gICAgICByZXR1cm4gdGhpcy5fY3VycmVudFByb21pc2U7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjdXJyZW50IHRleHQgZnJvbSB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuIENhbiBiZSB1c2VkIHRvIHByZXZlbnRcbiAgICogc2NyZWVuIHJlYWRlcnMgZnJvbSByZWFkaW5nIHRoZSB0ZXh0IG91dCBhZ2FpbiB3aGlsZSB0aGUgdXNlciBpcyBnb2luZ1xuICAgKiB0aHJvdWdoIHRoZSBwYWdlIGxhbmRtYXJrcy5cbiAgICovXG4gIGNsZWFyKCkge1xuICAgIGlmICh0aGlzLl9saXZlRWxlbWVudCkge1xuICAgICAgdGhpcy5fbGl2ZUVsZW1lbnQudGV4dENvbnRlbnQgPSAnJztcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fcHJldmlvdXNUaW1lb3V0KTtcbiAgICB0aGlzLl9saXZlRWxlbWVudD8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fbGl2ZUVsZW1lbnQgPSBudWxsITtcbiAgICB0aGlzLl9jdXJyZW50UmVzb2x2ZT8uKCk7XG4gICAgdGhpcy5fY3VycmVudFByb21pc2UgPSB0aGlzLl9jdXJyZW50UmVzb2x2ZSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZUxpdmVFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBlbGVtZW50Q2xhc3MgPSAnY2RrLWxpdmUtYW5ub3VuY2VyLWVsZW1lbnQnO1xuICAgIGNvbnN0IHByZXZpb3VzRWxlbWVudHMgPSB0aGlzLl9kb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGVsZW1lbnRDbGFzcyk7XG4gICAgY29uc3QgbGl2ZUVsID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAvLyBSZW1vdmUgYW55IG9sZCBjb250YWluZXJzLiBUaGlzIGNhbiBoYXBwZW4gd2hlbiBjb21pbmcgaW4gZnJvbSBhIHNlcnZlci1zaWRlLXJlbmRlcmVkIHBhZ2UuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2aW91c0VsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcmV2aW91c0VsZW1lbnRzW2ldLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGxpdmVFbC5jbGFzc0xpc3QuYWRkKGVsZW1lbnRDbGFzcyk7XG4gICAgbGl2ZUVsLmNsYXNzTGlzdC5hZGQoJ2Nkay12aXN1YWxseS1oaWRkZW4nKTtcblxuICAgIGxpdmVFbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtYXRvbWljJywgJ3RydWUnKTtcbiAgICBsaXZlRWwuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG4gICAgbGl2ZUVsLmlkID0gYGNkay1saXZlLWFubm91bmNlci0ke3VuaXF1ZUlkcysrfWA7XG5cbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpdmVFbCk7XG5cbiAgICByZXR1cm4gbGl2ZUVsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNvbWUgYnJvd3NlcnMgd29uJ3QgZXhwb3NlIHRoZSBhY2Nlc3NpYmlsaXR5IG5vZGUgb2YgdGhlIGxpdmUgYW5ub3VuY2VyIGVsZW1lbnQgaWYgdGhlcmUgaXMgYW5cbiAgICogYGFyaWEtbW9kYWxgIGFuZCB0aGUgbGl2ZSBhbm5vdW5jZXIgaXMgb3V0c2lkZSBvZiBpdC4gVGhpcyBtZXRob2Qgd29ya3MgYXJvdW5kIHRoZSBpc3N1ZSBieVxuICAgKiBwb2ludGluZyB0aGUgYGFyaWEtb3duc2Agb2YgYWxsIG1vZGFscyB0byB0aGUgbGl2ZSBhbm5vdW5jZXIgZWxlbWVudC5cbiAgICovXG4gIHByaXZhdGUgX2V4cG9zZUFubm91bmNlclRvTW9kYWxzKGlkOiBzdHJpbmcpIHtcbiAgICAvLyBOb3RlIHRoYXQgdGhlIHNlbGVjdG9yIGhlcmUgaXMgbGltaXRlZCB0byBDREsgb3ZlcmxheXMgYXQgdGhlIG1vbWVudCBpbiBvcmRlciB0byByZWR1Y2UgdGhlXG4gICAgLy8gc2VjdGlvbiBvZiB0aGUgRE9NIHdlIG5lZWQgdG8gbG9vayB0aHJvdWdoLiBUaGlzIHNob3VsZCBjb3ZlciBhbGwgdGhlIGNhc2VzIHdlIHN1cHBvcnQsIGJ1dFxuICAgIC8vIHRoZSBzZWxlY3RvciBjYW4gYmUgZXhwYW5kZWQgaWYgaXQgdHVybnMgb3V0IHRvIGJlIHRvbyBuYXJyb3cuXG4gICAgY29uc3QgbW9kYWxzID0gdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICdib2R5ID4gLmNkay1vdmVybGF5LWNvbnRhaW5lciBbYXJpYS1tb2RhbD1cInRydWVcIl0nLFxuICAgICk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZGFscy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW9kYWwgPSBtb2RhbHNbaV07XG4gICAgICBjb25zdCBhcmlhT3ducyA9IG1vZGFsLmdldEF0dHJpYnV0ZSgnYXJpYS1vd25zJyk7XG5cbiAgICAgIGlmICghYXJpYU93bnMpIHtcbiAgICAgICAgbW9kYWwuc2V0QXR0cmlidXRlKCdhcmlhLW93bnMnLCBpZCk7XG4gICAgICB9IGVsc2UgaWYgKGFyaWFPd25zLmluZGV4T2YoaWQpID09PSAtMSkge1xuICAgICAgICBtb2RhbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtb3ducycsIGFyaWFPd25zICsgJyAnICsgaWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHRoYXQgd29ya3Mgc2ltaWxhcmx5IHRvIGFyaWEtbGl2ZSwgYnV0IHVzZXMgdGhlIExpdmVBbm5vdW5jZXIgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHlcbiAqIHdpdGggYSB3aWRlciByYW5nZSBvZiBicm93c2VycyBhbmQgc2NyZWVuIHJlYWRlcnMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtBcmlhTGl2ZV0nLFxuICBleHBvcnRBczogJ2Nka0FyaWFMaXZlJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQXJpYUxpdmUgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGFyaWEtbGl2ZSBwb2xpdGVuZXNzIGxldmVsIHRvIHVzZSB3aGVuIGFubm91bmNpbmcgbWVzc2FnZXMuICovXG4gIEBJbnB1dCgnY2RrQXJpYUxpdmUnKVxuICBnZXQgcG9saXRlbmVzcygpOiBBcmlhTGl2ZVBvbGl0ZW5lc3Mge1xuICAgIHJldHVybiB0aGlzLl9wb2xpdGVuZXNzO1xuICB9XG4gIHNldCBwb2xpdGVuZXNzKHZhbHVlOiBBcmlhTGl2ZVBvbGl0ZW5lc3MpIHtcbiAgICB0aGlzLl9wb2xpdGVuZXNzID0gdmFsdWUgPT09ICdvZmYnIHx8IHZhbHVlID09PSAnYXNzZXJ0aXZlJyA/IHZhbHVlIDogJ3BvbGl0ZSc7XG4gICAgaWYgKHRoaXMuX3BvbGl0ZW5lc3MgPT09ICdvZmYnKSB7XG4gICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuX3N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRlbnRPYnNlcnZlci5vYnNlcnZlKHRoaXMuX2VsZW1lbnRSZWYpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgLy8gTm90ZSB0aGF0IHdlIHVzZSB0ZXh0Q29udGVudCBoZXJlLCByYXRoZXIgdGhhbiBpbm5lclRleHQsIGluIG9yZGVyIHRvIGF2b2lkIGEgcmVmbG93LlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRUZXh0ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRleHRDb250ZW50O1xuXG4gICAgICAgICAgLy8gVGhlIGBNdXRhdGlvbk9ic2VydmVyYCBmaXJlcyBhbHNvIGZvciBhdHRyaWJ1dGVcbiAgICAgICAgICAvLyBjaGFuZ2VzIHdoaWNoIHdlIGRvbid0IHdhbnQgdG8gYW5ub3VuY2UuXG4gICAgICAgICAgaWYgKGVsZW1lbnRUZXh0ICE9PSB0aGlzLl9wcmV2aW91c0Fubm91bmNlZFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuX2xpdmVBbm5vdW5jZXIuYW5ub3VuY2UoZWxlbWVudFRleHQsIHRoaXMuX3BvbGl0ZW5lc3MsIHRoaXMuZHVyYXRpb24pO1xuICAgICAgICAgICAgdGhpcy5fcHJldmlvdXNBbm5vdW5jZWRUZXh0ID0gZWxlbWVudFRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9wb2xpdGVuZXNzOiBBcmlhTGl2ZVBvbGl0ZW5lc3MgPSAncG9saXRlJztcblxuICAvKiogVGltZSBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgd2hpY2ggdG8gY2xlYXIgb3V0IHRoZSBhbm5vdW5jZXIgZWxlbWVudC4gKi9cbiAgQElucHV0KCdjZGtBcmlhTGl2ZUR1cmF0aW9uJykgZHVyYXRpb246IG51bWJlcjtcblxuICBwcml2YXRlIF9wcmV2aW91c0Fubm91bmNlZFRleHQ/OiBzdHJpbmc7XG4gIHByaXZhdGUgX3N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgX2xpdmVBbm5vdW5jZXI6IExpdmVBbm5vdW5jZXIsXG4gICAgcHJpdmF0ZSBfY29udGVudE9ic2VydmVyOiBDb250ZW50T2JzZXJ2ZXIsXG4gICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==