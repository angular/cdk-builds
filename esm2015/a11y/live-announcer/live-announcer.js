/**
 * @fileoverview added by tsickle
 * Generated from: src/cdk/a11y/live-announcer/live-announcer.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
import * as i1 from "./live-announcer-tokens";
import * as i2 from "@angular/common";
let LiveAnnouncer = /** @class */ (() => {
    class LiveAnnouncer {
        /**
         * @param {?} elementToken
         * @param {?} _ngZone
         * @param {?} _document
         * @param {?=} _defaultOptions
         */
        constructor(elementToken, _ngZone, _document, _defaultOptions) {
            this._ngZone = _ngZone;
            this._defaultOptions = _defaultOptions;
            // We inject the live element and document as `any` because the constructor signature cannot
            // reference browser globals (HTMLElement, Document) on non-browser environments, since having
            // a class decorator causes TypeScript to preserve the constructor signature types.
            this._document = _document;
            this._liveElement = elementToken || this._createLiveElement();
        }
        /**
         * @param {?} message
         * @param {...?} args
         * @return {?}
         */
        announce(message, ...args) {
            /** @type {?} */
            const defaultOptions = this._defaultOptions;
            /** @type {?} */
            let politeness;
            /** @type {?} */
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
                    (defaultOptions && defaultOptions.politeness) ? defaultOptions.politeness : 'polite';
            }
            if (duration == null && defaultOptions) {
                duration = defaultOptions.duration;
            }
            // TODO: ensure changing the politeness works on all environments we support.
            this._liveElement.setAttribute('aria-live', politeness);
            // This 100ms timeout is necessary for some browser + screen-reader combinations:
            // - Both JAWS and NVDA over IE11 will not announce anything without a non-zero timeout.
            // - With Chrome and IE11 with NVDA or JAWS, a repeated (identical) message won't be read a
            //   second time without clearing and then using a non-zero delay.
            // (using JAWS 17 at time of this writing).
            return this._ngZone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                return new Promise((/**
                 * @param {?} resolve
                 * @return {?}
                 */
                resolve => {
                    clearTimeout(this._previousTimeout);
                    this._previousTimeout = setTimeout((/**
                     * @return {?}
                     */
                    () => {
                        this._liveElement.textContent = message;
                        resolve();
                        if (typeof duration === 'number') {
                            this._previousTimeout = setTimeout((/**
                             * @return {?}
                             */
                            () => this.clear()), duration);
                        }
                    }), 100);
                }));
            }));
        }
        /**
         * Clears the current text from the announcer element. Can be used to prevent
         * screen readers from reading the text out again while the user is going
         * through the page landmarks.
         * @return {?}
         */
        clear() {
            if (this._liveElement) {
                this._liveElement.textContent = '';
            }
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            clearTimeout(this._previousTimeout);
            if (this._liveElement && this._liveElement.parentNode) {
                this._liveElement.parentNode.removeChild(this._liveElement);
                this._liveElement = (/** @type {?} */ (null));
            }
        }
        /**
         * @private
         * @return {?}
         */
        _createLiveElement() {
            /** @type {?} */
            const elementClass = 'cdk-live-announcer-element';
            /** @type {?} */
            const previousElements = this._document.getElementsByClassName(elementClass);
            /** @type {?} */
            const liveEl = this._document.createElement('div');
            // Remove any old containers. This can happen when coming in from a server-side-rendered page.
            for (let i = 0; i < previousElements.length; i++) {
                (/** @type {?} */ (previousElements[i].parentNode)).removeChild(previousElements[i]);
            }
            liveEl.classList.add(elementClass);
            liveEl.classList.add('cdk-visually-hidden');
            liveEl.setAttribute('aria-atomic', 'true');
            liveEl.setAttribute('aria-live', 'polite');
            this._document.body.appendChild(liveEl);
            return liveEl;
        }
    }
    LiveAnnouncer.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    LiveAnnouncer.ctorParameters = () => [
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [LIVE_ANNOUNCER_ELEMENT_TOKEN,] }] },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [LIVE_ANNOUNCER_DEFAULT_OPTIONS,] }] }
    ];
    /** @nocollapse */ LiveAnnouncer.ɵprov = i0.ɵɵdefineInjectable({ factory: function LiveAnnouncer_Factory() { return new LiveAnnouncer(i0.ɵɵinject(i1.LIVE_ANNOUNCER_ELEMENT_TOKEN, 8), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT), i0.ɵɵinject(i1.LIVE_ANNOUNCER_DEFAULT_OPTIONS, 8)); }, token: LiveAnnouncer, providedIn: "root" });
    return LiveAnnouncer;
})();
export { LiveAnnouncer };
if (false) {
    /**
     * @type {?}
     * @private
     */
    LiveAnnouncer.prototype._liveElement;
    /**
     * @type {?}
     * @private
     */
    LiveAnnouncer.prototype._document;
    /**
     * @type {?}
     * @private
     */
    LiveAnnouncer.prototype._previousTimeout;
    /**
     * @type {?}
     * @private
     */
    LiveAnnouncer.prototype._ngZone;
    /**
     * @type {?}
     * @private
     */
    LiveAnnouncer.prototype._defaultOptions;
}
/**
 * A directive that works similarly to aria-live, but uses the LiveAnnouncer to ensure compatibility
 * with a wider range of browsers and screen readers.
 */
let CdkAriaLive = /** @class */ (() => {
    /**
     * A directive that works similarly to aria-live, but uses the LiveAnnouncer to ensure compatibility
     * with a wider range of browsers and screen readers.
     */
    class CdkAriaLive {
        /**
         * @param {?} _elementRef
         * @param {?} _liveAnnouncer
         * @param {?} _contentObserver
         * @param {?} _ngZone
         */
        constructor(_elementRef, _liveAnnouncer, _contentObserver, _ngZone) {
            this._elementRef = _elementRef;
            this._liveAnnouncer = _liveAnnouncer;
            this._contentObserver = _contentObserver;
            this._ngZone = _ngZone;
            this._politeness = 'off';
        }
        /**
         * The aria-live politeness level to use when announcing messages.
         * @return {?}
         */
        get politeness() { return this._politeness; }
        /**
         * @param {?} value
         * @return {?}
         */
        set politeness(value) {
            this._politeness = value === 'polite' || value === 'assertive' ? value : 'off';
            if (this._politeness === 'off') {
                if (this._subscription) {
                    this._subscription.unsubscribe();
                    this._subscription = null;
                }
            }
            else if (!this._subscription) {
                this._subscription = this._ngZone.runOutsideAngular((/**
                 * @return {?}
                 */
                () => {
                    return this._contentObserver
                        .observe(this._elementRef)
                        .subscribe((/**
                     * @return {?}
                     */
                    () => {
                        // Note that we use textContent here, rather than innerText, in order to avoid a reflow.
                        /** @type {?} */
                        const elementText = this._elementRef.nativeElement.textContent;
                        // The `MutationObserver` fires also for attribute
                        // changes which we don't want to announce.
                        if (elementText !== this._previousAnnouncedText) {
                            this._liveAnnouncer.announce(elementText, this._politeness);
                            this._previousAnnouncedText = elementText;
                        }
                    }));
                }));
            }
        }
        /**
         * @return {?}
         */
        ngOnDestroy() {
            if (this._subscription) {
                this._subscription.unsubscribe();
            }
        }
    }
    CdkAriaLive.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkAriaLive]',
                    exportAs: 'cdkAriaLive',
                },] }
    ];
    /** @nocollapse */
    CdkAriaLive.ctorParameters = () => [
        { type: ElementRef },
        { type: LiveAnnouncer },
        { type: ContentObserver },
        { type: NgZone }
    ];
    CdkAriaLive.propDecorators = {
        politeness: [{ type: Input, args: ['cdkAriaLive',] }]
    };
    return CdkAriaLive;
})();
export { CdkAriaLive };
if (false) {
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._politeness;
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._previousAnnouncedText;
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._subscription;
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._elementRef;
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._liveAnnouncer;
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._contentObserver;
    /**
     * @type {?}
     * @private
     */
    CdkAriaLive.prototype._ngZone;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1hbm5vdW5jZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvbGl2ZS1hbm5vdW5jZXIvbGl2ZS1hbm5vdW5jZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sVUFBVSxFQUNWLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFHTCw0QkFBNEIsRUFDNUIsOEJBQThCLEdBQy9CLE1BQU0seUJBQXlCLENBQUM7Ozs7QUFHakM7SUFBQSxNQUNhLGFBQWE7Ozs7Ozs7UUFLeEIsWUFDc0QsWUFBaUIsRUFDM0QsT0FBZSxFQUNMLFNBQWMsRUFFeEIsZUFBNkM7WUFIN0MsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUdmLG9CQUFlLEdBQWYsZUFBZSxDQUE4QjtZQUV2RCw0RkFBNEY7WUFDNUYsOEZBQThGO1lBQzlGLG1GQUFtRjtZQUNuRixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNoRSxDQUFDOzs7Ozs7UUFzQ0QsUUFBUSxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVc7O2tCQUNoQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWU7O2dCQUN2QyxVQUEwQzs7Z0JBQzFDLFFBQTRCO1lBRWhDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUNwRCxRQUFRLEdBQUcs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RSxlQUFlO2dCQVFyQixNQUFNOzs7NkJBeUtMLEtBQUssU0FBQyxhQUFhOztJQXdDdEIsa0JBQUM7S0FBQTtTQTFDWSxXQUFXOzs7Ozs7SUE2QnRCLGtDQUFnRDs7Ozs7SUFFaEQsNkNBQXdDOzs7OztJQUN4QyxvQ0FBMkM7Ozs7O0lBRS9CLGtDQUErQjs7Ozs7SUFBRSxxQ0FBcUM7Ozs7O0lBQ3RFLHVDQUF5Qzs7Ozs7SUFBRSw4QkFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb250ZW50T2JzZXJ2ZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9vYnNlcnZlcnMnO1xuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbnB1dCxcbiAgTmdab25lLFxuICBPbkRlc3Ryb3ksXG4gIE9wdGlvbmFsLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIEFyaWFMaXZlUG9saXRlbmVzcyxcbiAgTGl2ZUFubm91bmNlckRlZmF1bHRPcHRpb25zLFxuICBMSVZFX0FOTk9VTkNFUl9FTEVNRU5UX1RPS0VOLFxuICBMSVZFX0FOTk9VTkNFUl9ERUZBVUxUX09QVElPTlMsXG59IGZyb20gJy4vbGl2ZS1hbm5vdW5jZXItdG9rZW5zJztcblxuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBMaXZlQW5ub3VuY2VyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbGl2ZUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG4gIHByaXZhdGUgX3ByZXZpb3VzVGltZW91dD86IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoTElWRV9BTk5PVU5DRVJfRUxFTUVOVF9UT0tFTikgZWxlbWVudFRva2VuOiBhbnksXG4gICAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55LFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChMSVZFX0FOTk9VTkNFUl9ERUZBVUxUX09QVElPTlMpXG4gICAgICBwcml2YXRlIF9kZWZhdWx0T3B0aW9ucz86IExpdmVBbm5vdW5jZXJEZWZhdWx0T3B0aW9ucykge1xuXG4gICAgLy8gV2UgaW5qZWN0IHRoZSBsaXZlIGVsZW1lbnQgYW5kIGRvY3VtZW50IGFzIGBhbnlgIGJlY2F1c2UgdGhlIGNvbnN0cnVjdG9yIHNpZ25hdHVyZSBjYW5ub3RcbiAgICAvLyByZWZlcmVuY2UgYnJvd3NlciBnbG9iYWxzIChIVE1MRWxlbWVudCwgRG9jdW1lbnQpIG9uIG5vbi1icm93c2VyIGVudmlyb25tZW50cywgc2luY2UgaGF2aW5nXG4gICAgLy8gYSBjbGFzcyBkZWNvcmF0b3IgY2F1c2VzIFR5cGVTY3JpcHQgdG8gcHJlc2VydmUgdGhlIGNvbnN0cnVjdG9yIHNpZ25hdHVyZSB0eXBlcy5cbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLl9saXZlRWxlbWVudCA9IGVsZW1lbnRUb2tlbiB8fCB0aGlzLl9jcmVhdGVMaXZlRWxlbWVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVucmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbnJlYWRlci5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2hlbiB0aGUgbWVzc2FnZSBpcyBhZGRlZCB0byB0aGUgRE9NLlxuICAgKi9cbiAgYW5ub3VuY2UobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQW5ub3VuY2VzIGEgbWVzc2FnZSB0byBzY3JlZW5yZWFkZXJzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGFubm91bmNlZCB0byB0aGUgc2NyZWVucmVhZGVyLlxuICAgKiBAcGFyYW0gcG9saXRlbmVzcyBUaGUgcG9saXRlbmVzcyBvZiB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gdGhlIERPTS5cbiAgICovXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZywgcG9saXRlbmVzcz86IEFyaWFMaXZlUG9saXRlbmVzcyk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVucmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbnJlYWRlci5cbiAgICogQHBhcmFtIGR1cmF0aW9uIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRvIGNsZWFyIG91dCB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuIE5vdGVcbiAgICogICB0aGF0IHRoaXMgdGFrZXMgZWZmZWN0IGFmdGVyIHRoZSBtZXNzYWdlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBET00sIHdoaWNoIGNhbiBiZSB1cCB0b1xuICAgKiAgIDEwMG1zIGFmdGVyIGBhbm5vdW5jZWAgaGFzIGJlZW4gY2FsbGVkLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQW5ub3VuY2VzIGEgbWVzc2FnZSB0byBzY3JlZW5yZWFkZXJzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGFubm91bmNlZCB0byB0aGUgc2NyZWVucmVhZGVyLlxuICAgKiBAcGFyYW0gcG9saXRlbmVzcyBUaGUgcG9saXRlbmVzcyBvZiB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBkdXJhdGlvbiBUaW1lIGluIG1pbGxpc2Vjb25kcyBhZnRlciB3aGljaCB0byBjbGVhciBvdXQgdGhlIGFubm91bmNlciBlbGVtZW50LiBOb3RlXG4gICAqICAgdGhhdCB0aGlzIHRha2VzIGVmZmVjdCBhZnRlciB0aGUgbWVzc2FnZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRE9NLCB3aGljaCBjYW4gYmUgdXAgdG9cbiAgICogICAxMDBtcyBhZnRlciBgYW5ub3VuY2VgIGhhcyBiZWVuIGNhbGxlZC5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2hlbiB0aGUgbWVzc2FnZSBpcyBhZGRlZCB0byB0aGUgRE9NLlxuICAgKi9cbiAgYW5ub3VuY2UobWVzc2FnZTogc3RyaW5nLCBwb2xpdGVuZXNzPzogQXJpYUxpdmVQb2xpdGVuZXNzLCBkdXJhdGlvbj86IG51bWJlcik6IFByb21pc2U8dm9pZD47XG5cbiAgYW5ub3VuY2UobWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0gdGhpcy5fZGVmYXVsdE9wdGlvbnM7XG4gICAgbGV0IHBvbGl0ZW5lc3M6IEFyaWFMaXZlUG9saXRlbmVzcyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZHVyYXRpb246IG51bWJlciB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgYXJnc1swXSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGR1cmF0aW9uID0gYXJnc1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgW3BvbGl0ZW5lc3MsIGR1cmF0aW9uXSA9IGFyZ3M7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhcigpO1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9wcmV2aW91c1RpbWVvdXQpO1xuXG4gICAgaWYgKCFwb2xpdGVuZXNzKSB7XG4gICAgICBwb2xpdGVuZXNzID1cbiAgICAgICAgICAoZGVmYXVsdE9wdGlvbnMgJiYgZGVmYXVsdE9wdGlvbnMucG9saXRlbmVzcykgPyBkZWZhdWx0T3B0aW9ucy5wb2xpdGVuZXNzIDogJ3BvbGl0ZSc7XG4gICAgfVxuXG4gICAgaWYgKGR1cmF0aW9uID09IG51bGwgJiYgZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgIGR1cmF0aW9uID0gZGVmYXVsdE9wdGlvbnMuZHVyYXRpb247XG4gICAgfVxuXG4gICAgLy8gVE9ETzogZW5zdXJlIGNoYW5naW5nIHRoZSBwb2xpdGVuZXNzIHdvcmtzIG9uIGFsbCBlbnZpcm9ubWVudHMgd2Ugc3VwcG9ydC5cbiAgICB0aGlzLl9saXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsIHBvbGl0ZW5lc3MpO1xuXG4gICAgLy8gVGhpcyAxMDBtcyB0aW1lb3V0IGlzIG5lY2Vzc2FyeSBmb3Igc29tZSBicm93c2VyICsgc2NyZWVuLXJlYWRlciBjb21iaW5hdGlvbnM6XG4gICAgLy8gLSBCb3RoIEpBV1MgYW5kIE5WREEgb3ZlciBJRTExIHdpbGwgbm90IGFubm91bmNlIGFueXRoaW5nIHdpdGhvdXQgYSBub24temVybyB0aW1lb3V0LlxuICAgIC8vIC0gV2l0aCBDaHJvbWUgYW5kIElFMTEgd2l0aCBOVkRBIG9yIEpBV1MsIGEgcmVwZWF0ZWQgKGlkZW50aWNhbCkgbWVzc2FnZSB3b24ndCBiZSByZWFkIGFcbiAgICAvLyAgIHNlY29uZCB0aW1lIHdpdGhvdXQgY2xlYXJpbmcgYW5kIHRoZW4gdXNpbmcgYSBub24temVybyBkZWxheS5cbiAgICAvLyAodXNpbmcgSkFXUyAxNyBhdCB0aW1lIG9mIHRoaXMgd3JpdGluZykuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9wcmV2aW91c1RpbWVvdXQpO1xuICAgICAgICB0aGlzLl9wcmV2aW91c1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9saXZlRWxlbWVudC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5jbGVhcigpLCBkdXJhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAxMDApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjdXJyZW50IHRleHQgZnJvbSB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuIENhbiBiZSB1c2VkIHRvIHByZXZlbnRcbiAgICogc2NyZWVuIHJlYWRlcnMgZnJvbSByZWFkaW5nIHRoZSB0ZXh0IG91dCBhZ2FpbiB3aGlsZSB0aGUgdXNlciBpcyBnb2luZ1xuICAgKiB0aHJvdWdoIHRoZSBwYWdlIGxhbmRtYXJrcy5cbiAgICovXG4gIGNsZWFyKCkge1xuICAgIGlmICh0aGlzLl9saXZlRWxlbWVudCkge1xuICAgICAgdGhpcy5fbGl2ZUVsZW1lbnQudGV4dENvbnRlbnQgPSAnJztcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fcHJldmlvdXNUaW1lb3V0KTtcblxuICAgIGlmICh0aGlzLl9saXZlRWxlbWVudCAmJiB0aGlzLl9saXZlRWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLl9saXZlRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2xpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuX2xpdmVFbGVtZW50ID0gbnVsbCE7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlTGl2ZUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGVsZW1lbnRDbGFzcyA9ICdjZGstbGl2ZS1hbm5vdW5jZXItZWxlbWVudCc7XG4gICAgY29uc3QgcHJldmlvdXNFbGVtZW50cyA9IHRoaXMuX2RvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoZWxlbWVudENsYXNzKTtcbiAgICBjb25zdCBsaXZlRWwgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIC8vIFJlbW92ZSBhbnkgb2xkIGNvbnRhaW5lcnMuIFRoaXMgY2FuIGhhcHBlbiB3aGVuIGNvbWluZyBpbiBmcm9tIGEgc2VydmVyLXNpZGUtcmVuZGVyZWQgcGFnZS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZXZpb3VzRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByZXZpb3VzRWxlbWVudHNbaV0ucGFyZW50Tm9kZSEucmVtb3ZlQ2hpbGQocHJldmlvdXNFbGVtZW50c1tpXSk7XG4gICAgfVxuXG4gICAgbGl2ZUVsLmNsYXNzTGlzdC5hZGQoZWxlbWVudENsYXNzKTtcbiAgICBsaXZlRWwuY2xhc3NMaXN0LmFkZCgnY2RrLXZpc3VhbGx5LWhpZGRlbicpO1xuXG4gICAgbGl2ZUVsLnNldEF0dHJpYnV0ZSgnYXJpYS1hdG9taWMnLCAndHJ1ZScpO1xuICAgIGxpdmVFbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcblxuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGl2ZUVsKTtcblxuICAgIHJldHVybiBsaXZlRWw7XG4gIH1cblxufVxuXG5cbi8qKlxuICogQSBkaXJlY3RpdmUgdGhhdCB3b3JrcyBzaW1pbGFybHkgdG8gYXJpYS1saXZlLCBidXQgdXNlcyB0aGUgTGl2ZUFubm91bmNlciB0byBlbnN1cmUgY29tcGF0aWJpbGl0eVxuICogd2l0aCBhIHdpZGVyIHJhbmdlIG9mIGJyb3dzZXJzIGFuZCBzY3JlZW4gcmVhZGVycy5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0FyaWFMaXZlXScsXG4gIGV4cG9ydEFzOiAnY2RrQXJpYUxpdmUnLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtBcmlhTGl2ZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8qKiBUaGUgYXJpYS1saXZlIHBvbGl0ZW5lc3MgbGV2ZWwgdG8gdXNlIHdoZW4gYW5ub3VuY2luZyBtZXNzYWdlcy4gKi9cbiAgQElucHV0KCdjZGtBcmlhTGl2ZScpXG4gIGdldCBwb2xpdGVuZXNzKCk6IEFyaWFMaXZlUG9saXRlbmVzcyB7IHJldHVybiB0aGlzLl9wb2xpdGVuZXNzOyB9XG4gIHNldCBwb2xpdGVuZXNzKHZhbHVlOiBBcmlhTGl2ZVBvbGl0ZW5lc3MpIHtcbiAgICB0aGlzLl9wb2xpdGVuZXNzID0gdmFsdWUgPT09ICdwb2xpdGUnIHx8IHZhbHVlID09PSAnYXNzZXJ0aXZlJyA/IHZhbHVlIDogJ29mZic7XG4gICAgaWYgKHRoaXMuX3BvbGl0ZW5lc3MgPT09ICdvZmYnKSB7XG4gICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXRoaXMuX3N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRlbnRPYnNlcnZlclxuICAgICAgICAgIC5vYnNlcnZlKHRoaXMuX2VsZW1lbnRSZWYpXG4gICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAvLyBOb3RlIHRoYXQgd2UgdXNlIHRleHRDb250ZW50IGhlcmUsIHJhdGhlciB0aGFuIGlubmVyVGV4dCwgaW4gb3JkZXIgdG8gYXZvaWQgYSByZWZsb3cuXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50VGV4dCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50ZXh0Q29udGVudDtcblxuICAgICAgICAgICAgLy8gVGhlIGBNdXRhdGlvbk9ic2VydmVyYCBmaXJlcyBhbHNvIGZvciBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vIGNoYW5nZXMgd2hpY2ggd2UgZG9uJ3Qgd2FudCB0byBhbm5vdW5jZS5cbiAgICAgICAgICAgIGlmIChlbGVtZW50VGV4dCAhPT0gdGhpcy5fcHJldmlvdXNBbm5vdW5jZWRUZXh0KSB7XG4gICAgICAgICAgICAgIHRoaXMuX2xpdmVBbm5vdW5jZXIuYW5ub3VuY2UoZWxlbWVudFRleHQsIHRoaXMuX3BvbGl0ZW5lc3MpO1xuICAgICAgICAgICAgICB0aGlzLl9wcmV2aW91c0Fubm91bmNlZFRleHQgPSBlbGVtZW50VGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9wb2xpdGVuZXNzOiBBcmlhTGl2ZVBvbGl0ZW5lc3MgPSAnb2ZmJztcblxuICBwcml2YXRlIF9wcmV2aW91c0Fubm91bmNlZFRleHQ/OiBzdHJpbmc7XG4gIHByaXZhdGUgX3N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9lbGVtZW50UmVmOiBFbGVtZW50UmVmLCBwcml2YXRlIF9saXZlQW5ub3VuY2VyOiBMaXZlQW5ub3VuY2VyLFxuICAgICAgICAgICAgICBwcml2YXRlIF9jb250ZW50T2JzZXJ2ZXI6IENvbnRlbnRPYnNlcnZlciwgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG4iXX0=