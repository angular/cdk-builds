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
export class LiveAnnouncer {
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
        this._document.body.appendChild(liveEl);
        return liveEl;
    }
}
LiveAnnouncer.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: LiveAnnouncer, deps: [{ token: LIVE_ANNOUNCER_ELEMENT_TOKEN, optional: true }, { token: i0.NgZone }, { token: DOCUMENT }, { token: LIVE_ANNOUNCER_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
LiveAnnouncer.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: LiveAnnouncer, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: LiveAnnouncer, decorators: [{
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
export class CdkAriaLive {
    constructor(_elementRef, _liveAnnouncer, _contentObserver, _ngZone) {
        this._elementRef = _elementRef;
        this._liveAnnouncer = _liveAnnouncer;
        this._contentObserver = _contentObserver;
        this._ngZone = _ngZone;
        this._politeness = 'polite';
    }
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
    ngOnDestroy() {
        if (this._subscription) {
            this._subscription.unsubscribe();
        }
    }
}
CdkAriaLive.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkAriaLive, deps: [{ token: i0.ElementRef }, { token: LiveAnnouncer }, { token: i1.ContentObserver }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive });
CdkAriaLive.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.0.0-rc.1", type: CdkAriaLive, selector: "[cdkAriaLive]", inputs: { politeness: ["cdkAriaLive", "politeness"], duration: ["cdkAriaLiveDuration", "duration"] }, exportAs: ["cdkAriaLive"], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.0.0-rc.1", ngImport: i0, type: CdkAriaLive, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1hbm5vdW5jZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvbGl2ZS1hbm5vdW5jZXIvbGl2ZS1hbm5vdW5jZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQ0wsU0FBUyxFQUNULFVBQVUsRUFDVixNQUFNLEVBQ04sVUFBVSxFQUNWLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxHQUNULE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFHTCw0QkFBNEIsRUFDNUIsOEJBQThCLEdBQy9CLE1BQU0seUJBQXlCLENBQUM7OztBQUdqQyxNQUFNLE9BQU8sYUFBYTtJQU94QixZQUNvRCxZQUFpQixFQUMzRCxPQUFlLEVBQ0wsU0FBYyxFQUd4QixlQUE2QztRQUo3QyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBSWYsb0JBQWUsR0FBZixlQUFlLENBQThCO1FBRXJELDRGQUE0RjtRQUM1Riw4RkFBOEY7UUFDOUYsbUZBQW1GO1FBQ25GLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQ2hFLENBQUM7SUFzQ0QsUUFBUSxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVc7UUFDdEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM1QyxJQUFJLFVBQTBDLENBQUM7UUFDL0MsSUFBSSxRQUE0QixDQUFDO1FBRWpDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO1lB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U0FDbEM7SUFDSCxDQUFDOzs2R0FoRFUsV0FBVyw0Q0F1Q0ksYUFBYTtpR0F2QzVCLFdBQVc7Z0dBQVgsV0FBVztrQkFKdkIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsZUFBZTtvQkFDekIsUUFBUSxFQUFFLGFBQWE7aUJBQ3hCO21GQXdDMkIsYUFBYSw2RUFwQ25DLFVBQVU7c0JBRGIsS0FBSzt1QkFBQyxhQUFhO2dCQThCVSxRQUFRO3NCQUFyQyxLQUFLO3VCQUFDLHFCQUFxQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnRlbnRPYnNlcnZlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL29ic2VydmVycyc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgQXJpYUxpdmVQb2xpdGVuZXNzLFxuICBMaXZlQW5ub3VuY2VyRGVmYXVsdE9wdGlvbnMsXG4gIExJVkVfQU5OT1VOQ0VSX0VMRU1FTlRfVE9LRU4sXG4gIExJVkVfQU5OT1VOQ0VSX0RFRkFVTFRfT1BUSU9OUyxcbn0gZnJvbSAnLi9saXZlLWFubm91bmNlci10b2tlbnMnO1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBMaXZlQW5ub3VuY2VyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfbGl2ZUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG4gIHByaXZhdGUgX3ByZXZpb3VzVGltZW91dDogbnVtYmVyO1xuICBwcml2YXRlIF9jdXJyZW50UHJvbWlzZTogUHJvbWlzZTx2b2lkPiB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfY3VycmVudFJlc29sdmU6ICgoKSA9PiB2b2lkKSB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KExJVkVfQU5OT1VOQ0VSX0VMRU1FTlRfVE9LRU4pIGVsZW1lbnRUb2tlbjogYW55LFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55LFxuICAgIEBPcHRpb25hbCgpXG4gICAgQEluamVjdChMSVZFX0FOTk9VTkNFUl9ERUZBVUxUX09QVElPTlMpXG4gICAgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM/OiBMaXZlQW5ub3VuY2VyRGVmYXVsdE9wdGlvbnMsXG4gICkge1xuICAgIC8vIFdlIGluamVjdCB0aGUgbGl2ZSBlbGVtZW50IGFuZCBkb2N1bWVudCBhcyBgYW55YCBiZWNhdXNlIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgY2Fubm90XG4gICAgLy8gcmVmZXJlbmNlIGJyb3dzZXIgZ2xvYmFscyAoSFRNTEVsZW1lbnQsIERvY3VtZW50KSBvbiBub24tYnJvd3NlciBlbnZpcm9ubWVudHMsIHNpbmNlIGhhdmluZ1xuICAgIC8vIGEgY2xhc3MgZGVjb3JhdG9yIGNhdXNlcyBUeXBlU2NyaXB0IHRvIHByZXNlcnZlIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgdHlwZXMuXG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy5fbGl2ZUVsZW1lbnQgPSBlbGVtZW50VG9rZW4gfHwgdGhpcy5fY3JlYXRlTGl2ZUVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbnJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW5yZWFkZXIuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gdGhlIERPTS5cbiAgICovXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVucmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbnJlYWRlci5cbiAgICogQHBhcmFtIHBvbGl0ZW5lc3MgVGhlIHBvbGl0ZW5lc3Mgb2YgdGhlIGFubm91bmNlciBlbGVtZW50LlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIHBvbGl0ZW5lc3M/OiBBcmlhTGl2ZVBvbGl0ZW5lc3MpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbnJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW5yZWFkZXIuXG4gICAqIEBwYXJhbSBkdXJhdGlvbiBUaW1lIGluIG1pbGxpc2Vjb25kcyBhZnRlciB3aGljaCB0byBjbGVhciBvdXQgdGhlIGFubm91bmNlciBlbGVtZW50LiBOb3RlXG4gICAqICAgdGhhdCB0aGlzIHRha2VzIGVmZmVjdCBhZnRlciB0aGUgbWVzc2FnZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRE9NLCB3aGljaCBjYW4gYmUgdXAgdG9cbiAgICogICAxMDBtcyBhZnRlciBgYW5ub3VuY2VgIGhhcyBiZWVuIGNhbGxlZC5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2hlbiB0aGUgbWVzc2FnZSBpcyBhZGRlZCB0byB0aGUgRE9NLlxuICAgKi9cbiAgYW5ub3VuY2UobWVzc2FnZTogc3RyaW5nLCBkdXJhdGlvbj86IG51bWJlcik6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVucmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbnJlYWRlci5cbiAgICogQHBhcmFtIHBvbGl0ZW5lc3MgVGhlIHBvbGl0ZW5lc3Mgb2YgdGhlIGFubm91bmNlciBlbGVtZW50LlxuICAgKiBAcGFyYW0gZHVyYXRpb24gVGltZSBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgd2hpY2ggdG8gY2xlYXIgb3V0IHRoZSBhbm5vdW5jZXIgZWxlbWVudC4gTm90ZVxuICAgKiAgIHRoYXQgdGhpcyB0YWtlcyBlZmZlY3QgYWZ0ZXIgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIERPTSwgd2hpY2ggY2FuIGJlIHVwIHRvXG4gICAqICAgMTAwbXMgYWZ0ZXIgYGFubm91bmNlYCBoYXMgYmVlbiBjYWxsZWQuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gdGhlIERPTS5cbiAgICovXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZywgcG9saXRlbmVzcz86IEFyaWFMaXZlUG9saXRlbmVzcywgZHVyYXRpb24/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHRoaXMuX2RlZmF1bHRPcHRpb25zO1xuICAgIGxldCBwb2xpdGVuZXNzOiBBcmlhTGl2ZVBvbGl0ZW5lc3MgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGR1cmF0aW9uOiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGFyZ3NbMF0gPT09ICdudW1iZXInKSB7XG4gICAgICBkdXJhdGlvbiA9IGFyZ3NbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIFtwb2xpdGVuZXNzLCBkdXJhdGlvbl0gPSBhcmdzO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXIoKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fcHJldmlvdXNUaW1lb3V0KTtcblxuICAgIGlmICghcG9saXRlbmVzcykge1xuICAgICAgcG9saXRlbmVzcyA9XG4gICAgICAgIGRlZmF1bHRPcHRpb25zICYmIGRlZmF1bHRPcHRpb25zLnBvbGl0ZW5lc3MgPyBkZWZhdWx0T3B0aW9ucy5wb2xpdGVuZXNzIDogJ3BvbGl0ZSc7XG4gICAgfVxuXG4gICAgaWYgKGR1cmF0aW9uID09IG51bGwgJiYgZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgIGR1cmF0aW9uID0gZGVmYXVsdE9wdGlvbnMuZHVyYXRpb247XG4gICAgfVxuXG4gICAgLy8gVE9ETzogZW5zdXJlIGNoYW5naW5nIHRoZSBwb2xpdGVuZXNzIHdvcmtzIG9uIGFsbCBlbnZpcm9ubWVudHMgd2Ugc3VwcG9ydC5cbiAgICB0aGlzLl9saXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsIHBvbGl0ZW5lc3MpO1xuXG4gICAgLy8gVGhpcyAxMDBtcyB0aW1lb3V0IGlzIG5lY2Vzc2FyeSBmb3Igc29tZSBicm93c2VyICsgc2NyZWVuLXJlYWRlciBjb21iaW5hdGlvbnM6XG4gICAgLy8gLSBCb3RoIEpBV1MgYW5kIE5WREEgb3ZlciBJRTExIHdpbGwgbm90IGFubm91bmNlIGFueXRoaW5nIHdpdGhvdXQgYSBub24temVybyB0aW1lb3V0LlxuICAgIC8vIC0gV2l0aCBDaHJvbWUgYW5kIElFMTEgd2l0aCBOVkRBIG9yIEpBV1MsIGEgcmVwZWF0ZWQgKGlkZW50aWNhbCkgbWVzc2FnZSB3b24ndCBiZSByZWFkIGFcbiAgICAvLyAgIHNlY29uZCB0aW1lIHdpdGhvdXQgY2xlYXJpbmcgYW5kIHRoZW4gdXNpbmcgYSBub24temVybyBkZWxheS5cbiAgICAvLyAodXNpbmcgSkFXUyAxNyBhdCB0aW1lIG9mIHRoaXMgd3JpdGluZykuXG4gICAgcmV0dXJuIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuX2N1cnJlbnRQcm9taXNlKSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiAodGhpcy5fY3VycmVudFJlc29sdmUgPSByZXNvbHZlKSk7XG4gICAgICB9XG5cbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9wcmV2aW91c1RpbWVvdXQpO1xuICAgICAgdGhpcy5fcHJldmlvdXNUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2xpdmVFbGVtZW50LnRleHRDb250ZW50ID0gbWVzc2FnZTtcblxuICAgICAgICBpZiAodHlwZW9mIGR1cmF0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHRoaXMuX3ByZXZpb3VzVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5jbGVhcigpLCBkdXJhdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jdXJyZW50UmVzb2x2ZSEoKTtcbiAgICAgICAgdGhpcy5fY3VycmVudFByb21pc2UgPSB0aGlzLl9jdXJyZW50UmVzb2x2ZSA9IHVuZGVmaW5lZDtcbiAgICAgIH0sIDEwMCk7XG5cbiAgICAgIHJldHVybiB0aGlzLl9jdXJyZW50UHJvbWlzZTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGN1cnJlbnQgdGV4dCBmcm9tIHRoZSBhbm5vdW5jZXIgZWxlbWVudC4gQ2FuIGJlIHVzZWQgdG8gcHJldmVudFxuICAgKiBzY3JlZW4gcmVhZGVycyBmcm9tIHJlYWRpbmcgdGhlIHRleHQgb3V0IGFnYWluIHdoaWxlIHRoZSB1c2VyIGlzIGdvaW5nXG4gICAqIHRocm91Z2ggdGhlIHBhZ2UgbGFuZG1hcmtzLlxuICAgKi9cbiAgY2xlYXIoKSB7XG4gICAgaWYgKHRoaXMuX2xpdmVFbGVtZW50KSB7XG4gICAgICB0aGlzLl9saXZlRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9wcmV2aW91c1RpbWVvdXQpO1xuICAgIHRoaXMuX2xpdmVFbGVtZW50Py5yZW1vdmUoKTtcbiAgICB0aGlzLl9saXZlRWxlbWVudCA9IG51bGwhO1xuICAgIHRoaXMuX2N1cnJlbnRSZXNvbHZlPy4oKTtcbiAgICB0aGlzLl9jdXJyZW50UHJvbWlzZSA9IHRoaXMuX2N1cnJlbnRSZXNvbHZlID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlTGl2ZUVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGVsZW1lbnRDbGFzcyA9ICdjZGstbGl2ZS1hbm5vdW5jZXItZWxlbWVudCc7XG4gICAgY29uc3QgcHJldmlvdXNFbGVtZW50cyA9IHRoaXMuX2RvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoZWxlbWVudENsYXNzKTtcbiAgICBjb25zdCBsaXZlRWwgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIC8vIFJlbW92ZSBhbnkgb2xkIGNvbnRhaW5lcnMuIFRoaXMgY2FuIGhhcHBlbiB3aGVuIGNvbWluZyBpbiBmcm9tIGEgc2VydmVyLXNpZGUtcmVuZGVyZWQgcGFnZS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZXZpb3VzRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHByZXZpb3VzRWxlbWVudHNbaV0ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgbGl2ZUVsLmNsYXNzTGlzdC5hZGQoZWxlbWVudENsYXNzKTtcbiAgICBsaXZlRWwuY2xhc3NMaXN0LmFkZCgnY2RrLXZpc3VhbGx5LWhpZGRlbicpO1xuXG4gICAgbGl2ZUVsLnNldEF0dHJpYnV0ZSgnYXJpYS1hdG9taWMnLCAndHJ1ZScpO1xuICAgIGxpdmVFbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcblxuICAgIHRoaXMuX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGl2ZUVsKTtcblxuICAgIHJldHVybiBsaXZlRWw7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGRpcmVjdGl2ZSB0aGF0IHdvcmtzIHNpbWlsYXJseSB0byBhcmlhLWxpdmUsIGJ1dCB1c2VzIHRoZSBMaXZlQW5ub3VuY2VyIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5XG4gKiB3aXRoIGEgd2lkZXIgcmFuZ2Ugb2YgYnJvd3NlcnMgYW5kIHNjcmVlbiByZWFkZXJzLlxuICovXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbY2RrQXJpYUxpdmVdJyxcbiAgZXhwb3J0QXM6ICdjZGtBcmlhTGl2ZScsXG59KVxuZXhwb3J0IGNsYXNzIENka0FyaWFMaXZlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIFRoZSBhcmlhLWxpdmUgcG9saXRlbmVzcyBsZXZlbCB0byB1c2Ugd2hlbiBhbm5vdW5jaW5nIG1lc3NhZ2VzLiAqL1xuICBASW5wdXQoJ2Nka0FyaWFMaXZlJylcbiAgZ2V0IHBvbGl0ZW5lc3MoKTogQXJpYUxpdmVQb2xpdGVuZXNzIHtcbiAgICByZXR1cm4gdGhpcy5fcG9saXRlbmVzcztcbiAgfVxuICBzZXQgcG9saXRlbmVzcyh2YWx1ZTogQXJpYUxpdmVQb2xpdGVuZXNzKSB7XG4gICAgdGhpcy5fcG9saXRlbmVzcyA9IHZhbHVlID09PSAnb2ZmJyB8fCB2YWx1ZSA9PT0gJ2Fzc2VydGl2ZScgPyB2YWx1ZSA6ICdwb2xpdGUnO1xuICAgIGlmICh0aGlzLl9wb2xpdGVuZXNzID09PSAnb2ZmJykge1xuICAgICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9zdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZW50T2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLl9lbGVtZW50UmVmKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIC8vIE5vdGUgdGhhdCB3ZSB1c2UgdGV4dENvbnRlbnQgaGVyZSwgcmF0aGVyIHRoYW4gaW5uZXJUZXh0LCBpbiBvcmRlciB0byBhdm9pZCBhIHJlZmxvdy5cbiAgICAgICAgICBjb25zdCBlbGVtZW50VGV4dCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50ZXh0Q29udGVudDtcblxuICAgICAgICAgIC8vIFRoZSBgTXV0YXRpb25PYnNlcnZlcmAgZmlyZXMgYWxzbyBmb3IgYXR0cmlidXRlXG4gICAgICAgICAgLy8gY2hhbmdlcyB3aGljaCB3ZSBkb24ndCB3YW50IHRvIGFubm91bmNlLlxuICAgICAgICAgIGlmIChlbGVtZW50VGV4dCAhPT0gdGhpcy5fcHJldmlvdXNBbm5vdW5jZWRUZXh0KSB7XG4gICAgICAgICAgICB0aGlzLl9saXZlQW5ub3VuY2VyLmFubm91bmNlKGVsZW1lbnRUZXh0LCB0aGlzLl9wb2xpdGVuZXNzLCB0aGlzLmR1cmF0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzQW5ub3VuY2VkVGV4dCA9IGVsZW1lbnRUZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfcG9saXRlbmVzczogQXJpYUxpdmVQb2xpdGVuZXNzID0gJ3BvbGl0ZSc7XG5cbiAgLyoqIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRvIGNsZWFyIG91dCB0aGUgYW5ub3VuY2VyIGVsZW1lbnQuICovXG4gIEBJbnB1dCgnY2RrQXJpYUxpdmVEdXJhdGlvbicpIGR1cmF0aW9uOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBfcHJldmlvdXNBbm5vdW5jZWRUZXh0Pzogc3RyaW5nO1xuICBwcml2YXRlIF9zdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIF9saXZlQW5ub3VuY2VyOiBMaXZlQW5ub3VuY2VyLFxuICAgIHByaXZhdGUgX2NvbnRlbnRPYnNlcnZlcjogQ29udGVudE9ic2VydmVyLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICApIHt9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG59XG4iXX0=