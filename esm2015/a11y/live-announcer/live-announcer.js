import { __decorate, __metadata, __param } from "tslib";
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
    let LiveAnnouncer = class LiveAnnouncer {
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
            return this._ngZone.runOutsideAngular(() => {
                return new Promise(resolve => {
                    clearTimeout(this._previousTimeout);
                    this._previousTimeout = setTimeout(() => {
                        this._liveElement.textContent = message;
                        resolve();
                        if (typeof duration === 'number') {
                            this._previousTimeout = setTimeout(() => this.clear(), duration);
                        }
                    }, 100);
                });
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
            if (this._liveElement && this._liveElement.parentNode) {
                this._liveElement.parentNode.removeChild(this._liveElement);
                this._liveElement = null;
            }
        }
        _createLiveElement() {
            const elementClass = 'cdk-live-announcer-element';
            const previousElements = this._document.getElementsByClassName(elementClass);
            const liveEl = this._document.createElement('div');
            // Remove any old containers. This can happen when coming in from a server-side-rendered page.
            for (let i = 0; i < previousElements.length; i++) {
                previousElements[i].parentNode.removeChild(previousElements[i]);
            }
            liveEl.classList.add(elementClass);
            liveEl.classList.add('cdk-visually-hidden');
            liveEl.setAttribute('aria-atomic', 'true');
            liveEl.setAttribute('aria-live', 'polite');
            this._document.body.appendChild(liveEl);
            return liveEl;
        }
    };
    LiveAnnouncer.ɵprov = i0.ɵɵdefineInjectable({ factory: function LiveAnnouncer_Factory() { return new LiveAnnouncer(i0.ɵɵinject(i1.LIVE_ANNOUNCER_ELEMENT_TOKEN, 8), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT), i0.ɵɵinject(i1.LIVE_ANNOUNCER_DEFAULT_OPTIONS, 8)); }, token: LiveAnnouncer, providedIn: "root" });
    LiveAnnouncer = __decorate([
        Injectable({ providedIn: 'root' }),
        __param(0, Optional()), __param(0, Inject(LIVE_ANNOUNCER_ELEMENT_TOKEN)),
        __param(2, Inject(DOCUMENT)),
        __param(3, Optional()), __param(3, Inject(LIVE_ANNOUNCER_DEFAULT_OPTIONS)),
        __metadata("design:paramtypes", [Object, NgZone, Object, Object])
    ], LiveAnnouncer);
    return LiveAnnouncer;
})();
export { LiveAnnouncer };
/**
 * A directive that works similarly to aria-live, but uses the LiveAnnouncer to ensure compatibility
 * with a wider range of browsers and screen readers.
 */
let CdkAriaLive = /** @class */ (() => {
    let CdkAriaLive = class CdkAriaLive {
        constructor(_elementRef, _liveAnnouncer, _contentObserver, _ngZone) {
            this._elementRef = _elementRef;
            this._liveAnnouncer = _liveAnnouncer;
            this._contentObserver = _contentObserver;
            this._ngZone = _ngZone;
            this._politeness = 'off';
        }
        /** The aria-live politeness level to use when announcing messages. */
        get politeness() { return this._politeness; }
        set politeness(value) {
            this._politeness = value === 'polite' || value === 'assertive' ? value : 'off';
            if (this._politeness === 'off') {
                if (this._subscription) {
                    this._subscription.unsubscribe();
                    this._subscription = null;
                }
            }
            else if (!this._subscription) {
                this._subscription = this._ngZone.runOutsideAngular(() => {
                    return this._contentObserver
                        .observe(this._elementRef)
                        .subscribe(() => {
                        // Note that we use textContent here, rather than innerText, in order to avoid a reflow.
                        const elementText = this._elementRef.nativeElement.textContent;
                        // The `MutationObserver` fires also for attribute
                        // changes which we don't want to announce.
                        if (elementText !== this._previousAnnouncedText) {
                            this._liveAnnouncer.announce(elementText, this._politeness);
                            this._previousAnnouncedText = elementText;
                        }
                    });
                });
            }
        }
        ngOnDestroy() {
            if (this._subscription) {
                this._subscription.unsubscribe();
            }
        }
    };
    __decorate([
        Input('cdkAriaLive'),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [String])
    ], CdkAriaLive.prototype, "politeness", null);
    CdkAriaLive = __decorate([
        Directive({
            selector: '[cdkAriaLive]',
            exportAs: 'cdkAriaLive',
        }),
        __metadata("design:paramtypes", [ElementRef, LiveAnnouncer,
            ContentObserver, NgZone])
    ], CdkAriaLive);
    return CdkAriaLive;
})();
export { CdkAriaLive };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1hbm5vdW5jZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvbGl2ZS1hbm5vdW5jZXIvbGl2ZS1hbm5vdW5jZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLFVBQVUsRUFDVixLQUFLLEVBQ0wsTUFBTSxFQUVOLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBR0wsNEJBQTRCLEVBQzVCLDhCQUE4QixHQUMvQixNQUFNLHlCQUF5QixDQUFDOzs7O0FBSWpDO0lBQUEsSUFBYSxhQUFhLEdBQTFCLE1BQWEsYUFBYTtRQUt4QixZQUNzRCxZQUFpQixFQUMzRCxPQUFlLEVBQ0wsU0FBYyxFQUV4QixlQUE2QztZQUg3QyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBR2Ysb0JBQWUsR0FBZixlQUFlLENBQThCO1lBRXZELDRGQUE0RjtZQUM1Riw4RkFBOEY7WUFDOUYsbUZBQW1GO1lBQ25GLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ2hFLENBQUM7UUFzQ0QsUUFBUSxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVc7WUFDdEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUM1QyxJQUFJLFVBQTBDLENBQUM7WUFDL0MsSUFBSSxRQUE0QixDQUFDO1lBRWpDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFD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QUFDLGFBQWEsQ0FBQzs7O2lEQUM0QztJQUh0RCxXQUFXO1FBSnZCLFNBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxlQUFlO1lBQ3pCLFFBQVEsRUFBRSxhQUFhO1NBQ3hCLENBQUM7eUNBbUNpQyxVQUFVLEVBQTBCLGFBQWE7WUFDNUMsZUFBZSxFQUFtQixNQUFNO09BbkNuRSxXQUFXLENBMEN2QjtJQUFELGtCQUFDO0tBQUE7U0ExQ1ksV0FBVyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnRlbnRPYnNlcnZlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL29ic2VydmVycyc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgQXJpYUxpdmVQb2xpdGVuZXNzLFxuICBMaXZlQW5ub3VuY2VyRGVmYXVsdE9wdGlvbnMsXG4gIExJVkVfQU5OT1VOQ0VSX0VMRU1FTlRfVE9LRU4sXG4gIExJVkVfQU5OT1VOQ0VSX0RFRkFVTFRfT1BUSU9OUyxcbn0gZnJvbSAnLi9saXZlLWFubm91bmNlci10b2tlbnMnO1xuXG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIExpdmVBbm5vdW5jZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9saXZlRWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgX2RvY3VtZW50OiBEb2N1bWVudDtcbiAgcHJpdmF0ZSBfcHJldmlvdXNUaW1lb3V0PzogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQE9wdGlvbmFsKCkgQEluamVjdChMSVZFX0FOTk9VTkNFUl9FTEVNRU5UX1RPS0VOKSBlbGVtZW50VG9rZW46IGFueSxcbiAgICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KExJVkVfQU5OT1VOQ0VSX0RFRkFVTFRfT1BUSU9OUylcbiAgICAgIHByaXZhdGUgX2RlZmF1bHRPcHRpb25zPzogTGl2ZUFubm91bmNlckRlZmF1bHRPcHRpb25zKSB7XG5cbiAgICAvLyBXZSBpbmplY3QgdGhlIGxpdmUgZWxlbWVudCBhbmQgZG9jdW1lbnQgYXMgYGFueWAgYmVjYXVzZSB0aGUgY29uc3RydWN0b3Igc2lnbmF0dXJlIGNhbm5vdFxuICAgIC8vIHJlZmVyZW5jZSBicm93c2VyIGdsb2JhbHMgKEhUTUxFbGVtZW50LCBEb2N1bWVudCkgb24gbm9uLWJyb3dzZXIgZW52aXJvbm1lbnRzLCBzaW5jZSBoYXZpbmdcbiAgICAvLyBhIGNsYXNzIGRlY29yYXRvciBjYXVzZXMgVHlwZVNjcmlwdCB0byBwcmVzZXJ2ZSB0aGUgY29uc3RydWN0b3Igc2lnbmF0dXJlIHR5cGVzLlxuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMuX2xpdmVFbGVtZW50ID0gZWxlbWVudFRva2VuIHx8IHRoaXMuX2NyZWF0ZUxpdmVFbGVtZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogQW5ub3VuY2VzIGEgbWVzc2FnZSB0byBzY3JlZW5yZWFkZXJzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGFubm91bmNlZCB0byB0aGUgc2NyZWVucmVhZGVyLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbnJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW5yZWFkZXIuXG4gICAqIEBwYXJhbSBwb2xpdGVuZXNzIFRoZSBwb2xpdGVuZXNzIG9mIHRoZSBhbm5vdW5jZXIgZWxlbWVudC5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2hlbiB0aGUgbWVzc2FnZSBpcyBhZGRlZCB0byB0aGUgRE9NLlxuICAgKi9cbiAgYW5ub3VuY2UobWVzc2FnZTogc3RyaW5nLCBwb2xpdGVuZXNzPzogQXJpYUxpdmVQb2xpdGVuZXNzKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKipcbiAgICogQW5ub3VuY2VzIGEgbWVzc2FnZSB0byBzY3JlZW5yZWFkZXJzLlxuICAgKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGJlIGFubm91bmNlZCB0byB0aGUgc2NyZWVucmVhZGVyLlxuICAgKiBAcGFyYW0gZHVyYXRpb24gVGltZSBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgd2hpY2ggdG8gY2xlYXIgb3V0IHRoZSBhbm5vdW5jZXIgZWxlbWVudC4gTm90ZVxuICAgKiAgIHRoYXQgdGhpcyB0YWtlcyBlZmZlY3QgYWZ0ZXIgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIERPTSwgd2hpY2ggY2FuIGJlIHVwIHRvXG4gICAqICAgMTAwbXMgYWZ0ZXIgYGFubm91bmNlYCBoYXMgYmVlbiBjYWxsZWQuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gdGhlIERPTS5cbiAgICovXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZywgZHVyYXRpb24/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbnJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW5yZWFkZXIuXG4gICAqIEBwYXJhbSBwb2xpdGVuZXNzIFRoZSBwb2xpdGVuZXNzIG9mIHRoZSBhbm5vdW5jZXIgZWxlbWVudC5cbiAgICogQHBhcmFtIGR1cmF0aW9uIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRvIGNsZWFyIG91dCB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuIE5vdGVcbiAgICogICB0aGF0IHRoaXMgdGFrZXMgZWZmZWN0IGFmdGVyIHRoZSBtZXNzYWdlIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBET00sIHdoaWNoIGNhbiBiZSB1cCB0b1xuICAgKiAgIDEwMG1zIGFmdGVyIGBhbm5vdW5jZWAgaGFzIGJlZW4gY2FsbGVkLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIHBvbGl0ZW5lc3M/OiBBcmlhTGl2ZVBvbGl0ZW5lc3MsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPjtcblxuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB0aGlzLl9kZWZhdWx0T3B0aW9ucztcbiAgICBsZXQgcG9saXRlbmVzczogQXJpYUxpdmVQb2xpdGVuZXNzIHwgdW5kZWZpbmVkO1xuICAgIGxldCBkdXJhdGlvbjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSAnbnVtYmVyJykge1xuICAgICAgZHVyYXRpb24gPSBhcmdzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICBbcG9saXRlbmVzcywgZHVyYXRpb25dID0gYXJncztcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3ByZXZpb3VzVGltZW91dCk7XG5cbiAgICBpZiAoIXBvbGl0ZW5lc3MpIHtcbiAgICAgIHBvbGl0ZW5lc3MgPVxuICAgICAgICAgIChkZWZhdWx0T3B0aW9ucyAmJiBkZWZhdWx0T3B0aW9ucy5wb2xpdGVuZXNzKSA/IGRlZmF1bHRPcHRpb25zLnBvbGl0ZW5lc3MgOiAncG9saXRlJztcbiAgICB9XG5cbiAgICBpZiAoZHVyYXRpb24gPT0gbnVsbCAmJiBkZWZhdWx0T3B0aW9ucykge1xuICAgICAgZHVyYXRpb24gPSBkZWZhdWx0T3B0aW9ucy5kdXJhdGlvbjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBlbnN1cmUgY2hhbmdpbmcgdGhlIHBvbGl0ZW5lc3Mgd29ya3Mgb24gYWxsIGVudmlyb25tZW50cyB3ZSBzdXBwb3J0LlxuICAgIHRoaXMuX2xpdmVFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1saXZlJywgcG9saXRlbmVzcyk7XG5cbiAgICAvLyBUaGlzIDEwMG1zIHRpbWVvdXQgaXMgbmVjZXNzYXJ5IGZvciBzb21lIGJyb3dzZXIgKyBzY3JlZW4tcmVhZGVyIGNvbWJpbmF0aW9uczpcbiAgICAvLyAtIEJvdGggSkFXUyBhbmQgTlZEQSBvdmVyIElFMTEgd2lsbCBub3QgYW5ub3VuY2UgYW55dGhpbmcgd2l0aG91dCBhIG5vbi16ZXJvIHRpbWVvdXQuXG4gICAgLy8gLSBXaXRoIENocm9tZSBhbmQgSUUxMSB3aXRoIE5WREEgb3IgSkFXUywgYSByZXBlYXRlZCAoaWRlbnRpY2FsKSBtZXNzYWdlIHdvbid0IGJlIHJlYWQgYVxuICAgIC8vICAgc2Vjb25kIHRpbWUgd2l0aG91dCBjbGVhcmluZyBhbmQgdGhlbiB1c2luZyBhIG5vbi16ZXJvIGRlbGF5LlxuICAgIC8vICh1c2luZyBKQVdTIDE3IGF0IHRpbWUgb2YgdGhpcyB3cml0aW5nKS5cbiAgICByZXR1cm4gdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3ByZXZpb3VzVGltZW91dCk7XG4gICAgICAgIHRoaXMuX3ByZXZpb3VzVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX2xpdmVFbGVtZW50LnRleHRDb250ZW50ID0gbWVzc2FnZTtcbiAgICAgICAgICByZXNvbHZlKCk7XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhpcy5fcHJldmlvdXNUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmNsZWFyKCksIGR1cmF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGN1cnJlbnQgdGV4dCBmcm9tIHRoZSBhbm5vdW5jZXIgZWxlbWVudC4gQ2FuIGJlIHVzZWQgdG8gcHJldmVudFxuICAgKiBzY3JlZW4gcmVhZGVycyBmcm9tIHJlYWRpbmcgdGhlIHRleHQgb3V0IGFnYWluIHdoaWxlIHRoZSB1c2VyIGlzIGdvaW5nXG4gICAqIHRocm91Z2ggdGhlIHBhZ2UgbGFuZG1hcmtzLlxuICAgKi9cbiAgY2xlYXIoKSB7XG4gICAgaWYgKHRoaXMuX2xpdmVFbGVtZW50KSB7XG4gICAgICB0aGlzLl9saXZlRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9wcmV2aW91c1RpbWVvdXQpO1xuXG4gICAgaWYgKHRoaXMuX2xpdmVFbGVtZW50ICYmIHRoaXMuX2xpdmVFbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMuX2xpdmVFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fbGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5fbGl2ZUVsZW1lbnQgPSBudWxsITtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVMaXZlRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgZWxlbWVudENsYXNzID0gJ2Nkay1saXZlLWFubm91bmNlci1lbGVtZW50JztcbiAgICBjb25zdCBwcmV2aW91c0VsZW1lbnRzID0gdGhpcy5fZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShlbGVtZW50Q2xhc3MpO1xuICAgIGNvbnN0IGxpdmVFbCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgLy8gUmVtb3ZlIGFueSBvbGQgY29udGFpbmVycy4gVGhpcyBjYW4gaGFwcGVuIHdoZW4gY29taW5nIGluIGZyb20gYSBzZXJ2ZXItc2lkZS1yZW5kZXJlZCBwYWdlLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJldmlvdXNFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJldmlvdXNFbGVtZW50c1tpXS5wYXJlbnROb2RlIS5yZW1vdmVDaGlsZChwcmV2aW91c0VsZW1lbnRzW2ldKTtcbiAgICB9XG5cbiAgICBsaXZlRWwuY2xhc3NMaXN0LmFkZChlbGVtZW50Q2xhc3MpO1xuICAgIGxpdmVFbC5jbGFzc0xpc3QuYWRkKCdjZGstdmlzdWFsbHktaGlkZGVuJyk7XG5cbiAgICBsaXZlRWwuc2V0QXR0cmlidXRlKCdhcmlhLWF0b21pYycsICd0cnVlJyk7XG4gICAgbGl2ZUVsLnNldEF0dHJpYnV0ZSgnYXJpYS1saXZlJywgJ3BvbGl0ZScpO1xuXG4gICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaXZlRWwpO1xuXG4gICAgcmV0dXJuIGxpdmVFbDtcbiAgfVxuXG59XG5cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IHdvcmtzIHNpbWlsYXJseSB0byBhcmlhLWxpdmUsIGJ1dCB1c2VzIHRoZSBMaXZlQW5ub3VuY2VyIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5XG4gKiB3aXRoIGEgd2lkZXIgcmFuZ2Ugb2YgYnJvd3NlcnMgYW5kIHNjcmVlbiByZWFkZXJzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQXJpYUxpdmVdJyxcbiAgZXhwb3J0QXM6ICdjZGtBcmlhTGl2ZScsXG59KVxuZXhwb3J0IGNsYXNzIENka0FyaWFMaXZlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBhcmlhLWxpdmUgcG9saXRlbmVzcyBsZXZlbCB0byB1c2Ugd2hlbiBhbm5vdW5jaW5nIG1lc3NhZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0FyaWFMaXZlJylcbiAgZ2V0IHBvbGl0ZW5lc3MoKTogQXJpYUxpdmVQb2xpdGVuZXNzIHsgcmV0dXJuIHRoaXMuX3BvbGl0ZW5lc3M7IH1cbiAgc2V0IHBvbGl0ZW5lc3ModmFsdWU6IEFyaWFMaXZlUG9saXRlbmVzcykge1xuICAgIHRoaXMuX3BvbGl0ZW5lc3MgPSB2YWx1ZSA9PT0gJ3BvbGl0ZScgfHwgdmFsdWUgPT09ICdhc3NlcnRpdmUnID8gdmFsdWUgOiAnb2ZmJztcbiAgICBpZiAodGhpcy5fcG9saXRlbmVzcyA9PT0gJ29mZicpIHtcbiAgICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghdGhpcy5fc3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb24gPSB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGVudE9ic2VydmVyXG4gICAgICAgICAgLm9ic2VydmUodGhpcy5fZWxlbWVudFJlZilcbiAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCB3ZSB1c2UgdGV4dENvbnRlbnQgaGVyZSwgcmF0aGVyIHRoYW4gaW5uZXJUZXh0LCBpbiBvcmRlciB0byBhdm9pZCBhIHJlZmxvdy5cbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRUZXh0ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnRleHRDb250ZW50O1xuXG4gICAgICAgICAgICAvLyBUaGUgYE11dGF0aW9uT2JzZXJ2ZXJgIGZpcmVzIGFsc28gZm9yIGF0dHJpYnV0ZVxuICAgICAgICAgICAgLy8gY2hhbmdlcyB3aGljaCB3ZSBkb24ndCB3YW50IHRvIGFubm91bmNlLlxuICAgICAgICAgICAgaWYgKGVsZW1lbnRUZXh0ICE9PSB0aGlzLl9wcmV2aW91c0Fubm91bmNlZFRleHQpIHtcbiAgICAgICAgICAgICAgdGhpcy5fbGl2ZUFubm91bmNlci5hbm5vdW5jZShlbGVtZW50VGV4dCwgdGhpcy5fcG9saXRlbmVzcyk7XG4gICAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzQW5ub3VuY2VkVGV4dCA9IGVsZW1lbnRUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX3BvbGl0ZW5lc3M6IEFyaWFMaXZlUG9saXRlbmVzcyA9ICdvZmYnO1xuXG4gIHByaXZhdGUgX3ByZXZpb3VzQW5ub3VuY2VkVGV4dD86IHN0cmluZztcbiAgcHJpdmF0ZSBfc3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWYsIHByaXZhdGUgX2xpdmVBbm5vdW5jZXI6IExpdmVBbm5vdW5jZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgX2NvbnRlbnRPYnNlcnZlcjogQ29udGVudE9ic2VydmVyLCBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge31cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==