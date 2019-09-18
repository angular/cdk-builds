import * as tslib_1 from "tslib";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ContentObserver } from '@angular/cdk/observers';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Inject, Injectable, Input, NgZone, Optional, SkipSelf, } from '@angular/core';
import { LIVE_ANNOUNCER_ELEMENT_TOKEN, LIVE_ANNOUNCER_DEFAULT_OPTIONS, } from './live-announcer-tokens';
import * as i0 from "@angular/core";
import * as i1 from "angular_material/src/cdk/a11y/live-announcer/live-announcer-tokens";
import * as i2 from "@angular/common";
var LiveAnnouncer = /** @class */ (function () {
    function LiveAnnouncer(elementToken, _ngZone, _document, _defaultOptions) {
        this._ngZone = _ngZone;
        this._defaultOptions = _defaultOptions;
        // We inject the live element and document as `any` because the constructor signature cannot
        // reference browser globals (HTMLElement, Document) on non-browser environments, since having
        // a class decorator causes TypeScript to preserve the constructor signature types.
        this._document = _document;
        this._liveElement = elementToken || this._createLiveElement();
    }
    LiveAnnouncer.prototype.announce = function (message) {
        var _a;
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var defaultOptions = this._defaultOptions;
        var politeness;
        var duration;
        if (args.length === 1 && typeof args[0] === 'number') {
            duration = args[0];
        }
        else {
            _a = tslib_1.__read(args, 2), politeness = _a[0], duration = _a[1];
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
        return this._ngZone.runOutsideAngular(function () {
            return new Promise(function (resolve) {
                clearTimeout(_this._previousTimeout);
                _this._previousTimeout = setTimeout(function () {
                    _this._liveElement.textContent = message;
                    resolve();
                    if (typeof duration === 'number') {
                        _this._previousTimeout = setTimeout(function () { return _this.clear(); }, duration);
                    }
                }, 100);
            });
        });
    };
    /**
     * Clears the current text from the announcer element. Can be used to prevent
     * screen readers from reading the text out again while the user is going
     * through the page landmarks.
     */
    LiveAnnouncer.prototype.clear = function () {
        if (this._liveElement) {
            this._liveElement.textContent = '';
        }
    };
    LiveAnnouncer.prototype.ngOnDestroy = function () {
        clearTimeout(this._previousTimeout);
        if (this._liveElement && this._liveElement.parentNode) {
            this._liveElement.parentNode.removeChild(this._liveElement);
            this._liveElement = null;
        }
    };
    LiveAnnouncer.prototype._createLiveElement = function () {
        var elementClass = 'cdk-live-announcer-element';
        var previousElements = this._document.getElementsByClassName(elementClass);
        var liveEl = this._document.createElement('div');
        // Remove any old containers. This can happen when coming in from a server-side-rendered page.
        for (var i = 0; i < previousElements.length; i++) {
            previousElements[i].parentNode.removeChild(previousElements[i]);
        }
        liveEl.classList.add(elementClass);
        liveEl.classList.add('cdk-visually-hidden');
        liveEl.setAttribute('aria-atomic', 'true');
        liveEl.setAttribute('aria-live', 'polite');
        this._document.body.appendChild(liveEl);
        return liveEl;
    };
    LiveAnnouncer.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    /** @nocollapse */
    LiveAnnouncer.ctorParameters = function () { return [
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [LIVE_ANNOUNCER_ELEMENT_TOKEN,] }] },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [LIVE_ANNOUNCER_DEFAULT_OPTIONS,] }] }
    ]; };
    LiveAnnouncer.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function LiveAnnouncer_Factory() { return new LiveAnnouncer(i0.ɵɵinject(i1.LIVE_ANNOUNCER_ELEMENT_TOKEN, 8), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i2.DOCUMENT), i0.ɵɵinject(i1.LIVE_ANNOUNCER_DEFAULT_OPTIONS, 8)); }, token: LiveAnnouncer, providedIn: "root" });
    return LiveAnnouncer;
}());
export { LiveAnnouncer };
/**
 * A directive that works similarly to aria-live, but uses the LiveAnnouncer to ensure compatibility
 * with a wider range of browsers and screen readers.
 */
var CdkAriaLive = /** @class */ (function () {
    function CdkAriaLive(_elementRef, _liveAnnouncer, _contentObserver, _ngZone) {
        this._elementRef = _elementRef;
        this._liveAnnouncer = _liveAnnouncer;
        this._contentObserver = _contentObserver;
        this._ngZone = _ngZone;
        this._politeness = 'off';
    }
    Object.defineProperty(CdkAriaLive.prototype, "politeness", {
        /** The aria-live politeness level to use when announcing messages. */
        get: function () { return this._politeness; },
        set: function (value) {
            var _this = this;
            this._politeness = value === 'polite' || value === 'assertive' ? value : 'off';
            if (this._politeness === 'off') {
                if (this._subscription) {
                    this._subscription.unsubscribe();
                    this._subscription = null;
                }
            }
            else if (!this._subscription) {
                this._subscription = this._ngZone.runOutsideAngular(function () {
                    return _this._contentObserver
                        .observe(_this._elementRef)
                        .subscribe(function () {
                        // Note that we use textContent here, rather than innerText, in order to avoid a reflow.
                        var elementText = _this._elementRef.nativeElement.textContent;
                        // The `MutationObserver` fires also for attribute
                        // changes which we don't want to announce.
                        if (elementText !== _this._previousAnnouncedText) {
                            _this._liveAnnouncer.announce(elementText, _this._politeness);
                            _this._previousAnnouncedText = elementText;
                        }
                    });
                });
            }
        },
        enumerable: true,
        configurable: true
    });
    CdkAriaLive.prototype.ngOnDestroy = function () {
        if (this._subscription) {
            this._subscription.unsubscribe();
        }
    };
    CdkAriaLive.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkAriaLive]',
                    exportAs: 'cdkAriaLive',
                },] }
    ];
    /** @nocollapse */
    CdkAriaLive.ctorParameters = function () { return [
        { type: ElementRef },
        { type: LiveAnnouncer },
        { type: ContentObserver },
        { type: NgZone }
    ]; };
    CdkAriaLive.propDecorators = {
        politeness: [{ type: Input, args: ['cdkAriaLive',] }]
    };
    return CdkAriaLive;
}());
export { CdkAriaLive };
/** @docs-private @deprecated @breaking-change 8.0.0 */
export function LIVE_ANNOUNCER_PROVIDER_FACTORY(parentAnnouncer, liveElement, _document, ngZone) {
    return parentAnnouncer || new LiveAnnouncer(liveElement, ngZone, _document);
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export var LIVE_ANNOUNCER_PROVIDER = {
    // If there is already a LiveAnnouncer available, use that. Otherwise, provide a new one.
    provide: LiveAnnouncer,
    deps: [
        [new Optional(), new SkipSelf(), LiveAnnouncer],
        [new Optional(), new Inject(LIVE_ANNOUNCER_ELEMENT_TOKEN)],
        DOCUMENT,
        NgZone,
    ],
    useFactory: LIVE_ANNOUNCER_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl2ZS1hbm5vdW5jZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvbGl2ZS1hbm5vdW5jZXIvbGl2ZS1hbm5vdW5jZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUNMLFNBQVMsRUFDVCxVQUFVLEVBQ1YsTUFBTSxFQUNOLFVBQVUsRUFDVixLQUFLLEVBQ0wsTUFBTSxFQUVOLFFBQVEsRUFFUixRQUFRLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUdMLDRCQUE0QixFQUM1Qiw4QkFBOEIsR0FDL0IsTUFBTSx5QkFBeUIsQ0FBQzs7OztBQUdqQztJQU1FLHVCQUNzRCxZQUFpQixFQUMzRCxPQUFlLEVBQ0wsU0FBYyxFQUV4QixlQUE2QztRQUg3QyxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBR2Ysb0JBQWUsR0FBZixlQUFlLENBQThCO1FBRXZELDRGQUE0RjtRQUM1Riw4RkFBOEY7UUFDOUYsbUZBQW1GO1FBQ25GLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQ2hFLENBQUM7SUFzQ0QsZ0NBQVEsR0FBUixVQUFTLE9BQWU7O1FBQXhCLGlCQTRDQztRQTVDeUIsY0FBYzthQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7WUFBZCw2QkFBYzs7UUFDdEMsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM1QyxJQUFJLFVBQTBDLENBQUM7UUFDL0MsSUFBSSxRQUE0QixDQUFDO1FBRWpDLElBQUksSUFB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QUFNOzs7NkJBMktMLEtBQUssU0FBQyxhQUFhOztJQXdDdEIsa0JBQUM7Q0FBQSxBQTlDRCxJQThDQztTQTFDWSxXQUFXO0FBNkN4Qix1REFBdUQ7QUFDdkQsTUFBTSxVQUFVLCtCQUErQixDQUMzQyxlQUE4QixFQUFFLFdBQWdCLEVBQUUsU0FBYyxFQUFFLE1BQWM7SUFDbEYsT0FBTyxlQUFlLElBQUksSUFBSSxhQUFhLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBR0QsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxJQUFNLHVCQUF1QixHQUFhO0lBQy9DLHlGQUF5RjtJQUN6RixPQUFPLEVBQUUsYUFBYTtJQUN0QixJQUFJLEVBQUU7UUFDSixDQUFDLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxhQUFhLENBQUM7UUFDL0MsQ0FBQyxJQUFJLFFBQVEsRUFBRSxFQUFFLElBQUksTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDMUQsUUFBUTtRQUNSLE1BQU07S0FDUDtJQUNELFVBQVUsRUFBRSwrQkFBK0I7Q0FDNUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnRlbnRPYnNlcnZlcn0gZnJvbSAnQGFuZ3VsYXIvY2RrL29ic2VydmVycyc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBJbmplY3QsXG4gIEluamVjdGFibGUsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIFByb3ZpZGVyLFxuICBTa2lwU2VsZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1xuICBBcmlhTGl2ZVBvbGl0ZW5lc3MsXG4gIExpdmVBbm5vdW5jZXJEZWZhdWx0T3B0aW9ucyxcbiAgTElWRV9BTk5PVU5DRVJfRUxFTUVOVF9UT0tFTixcbiAgTElWRV9BTk5PVU5DRVJfREVGQVVMVF9PUFRJT05TLFxufSBmcm9tICcuL2xpdmUtYW5ub3VuY2VyLXRva2Vucyc7XG5cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTGl2ZUFubm91bmNlciBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgX2xpdmVFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuICBwcml2YXRlIF9wcmV2aW91c1RpbWVvdXQ/OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBAT3B0aW9uYWwoKSBASW5qZWN0KExJVkVfQU5OT1VOQ0VSX0VMRU1FTlRfVE9LRU4pIGVsZW1lbnRUb2tlbjogYW55LFxuICAgICAgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUsXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBfZG9jdW1lbnQ6IGFueSxcbiAgICAgIEBPcHRpb25hbCgpIEBJbmplY3QoTElWRV9BTk5PVU5DRVJfREVGQVVMVF9PUFRJT05TKVxuICAgICAgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM/OiBMaXZlQW5ub3VuY2VyRGVmYXVsdE9wdGlvbnMpIHtcblxuICAgIC8vIFdlIGluamVjdCB0aGUgbGl2ZSBlbGVtZW50IGFuZCBkb2N1bWVudCBhcyBgYW55YCBiZWNhdXNlIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgY2Fubm90XG4gICAgLy8gcmVmZXJlbmNlIGJyb3dzZXIgZ2xvYmFscyAoSFRNTEVsZW1lbnQsIERvY3VtZW50KSBvbiBub24tYnJvd3NlciBlbnZpcm9ubWVudHMsIHNpbmNlIGhhdmluZ1xuICAgIC8vIGEgY2xhc3MgZGVjb3JhdG9yIGNhdXNlcyBUeXBlU2NyaXB0IHRvIHByZXNlcnZlIHRoZSBjb25zdHJ1Y3RvciBzaWduYXR1cmUgdHlwZXMuXG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gICAgdGhpcy5fbGl2ZUVsZW1lbnQgPSBlbGVtZW50VG9rZW4gfHwgdGhpcy5fY3JlYXRlTGl2ZUVsZW1lbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbnJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW5yZWFkZXIuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gdGhlIERPTS5cbiAgICovXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVucmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbnJlYWRlci5cbiAgICogQHBhcmFtIHBvbGl0ZW5lc3MgVGhlIHBvbGl0ZW5lc3Mgb2YgdGhlIGFubm91bmNlciBlbGVtZW50LlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBtZXNzYWdlIGlzIGFkZGVkIHRvIHRoZSBET00uXG4gICAqL1xuICBhbm5vdW5jZShtZXNzYWdlOiBzdHJpbmcsIHBvbGl0ZW5lc3M/OiBBcmlhTGl2ZVBvbGl0ZW5lc3MpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBBbm5vdW5jZXMgYSBtZXNzYWdlIHRvIHNjcmVlbnJlYWRlcnMuXG4gICAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gYmUgYW5ub3VuY2VkIHRvIHRoZSBzY3JlZW5yZWFkZXIuXG4gICAqIEBwYXJhbSBkdXJhdGlvbiBUaW1lIGluIG1pbGxpc2Vjb25kcyBhZnRlciB3aGljaCB0byBjbGVhciBvdXQgdGhlIGFubm91bmNlciBlbGVtZW50LiBOb3RlXG4gICAqICAgdGhhdCB0aGlzIHRha2VzIGVmZmVjdCBhZnRlciB0aGUgbWVzc2FnZSBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRE9NLCB3aGljaCBjYW4gYmUgdXAgdG9cbiAgICogICAxMDBtcyBhZnRlciBgYW5ub3VuY2VgIGhhcyBiZWVuIGNhbGxlZC5cbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2hlbiB0aGUgbWVzc2FnZSBpcyBhZGRlZCB0byB0aGUgRE9NLlxuICAgKi9cbiAgYW5ub3VuY2UobWVzc2FnZTogc3RyaW5nLCBkdXJhdGlvbj86IG51bWJlcik6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIEFubm91bmNlcyBhIG1lc3NhZ2UgdG8gc2NyZWVucmVhZGVycy5cbiAgICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBhbm5vdW5jZWQgdG8gdGhlIHNjcmVlbnJlYWRlci5cbiAgICogQHBhcmFtIHBvbGl0ZW5lc3MgVGhlIHBvbGl0ZW5lc3Mgb2YgdGhlIGFubm91bmNlciBlbGVtZW50LlxuICAgKiBAcGFyYW0gZHVyYXRpb24gVGltZSBpbiBtaWxsaXNlY29uZHMgYWZ0ZXIgd2hpY2ggdG8gY2xlYXIgb3V0IHRoZSBhbm5vdW5jZXIgZWxlbWVudC4gTm90ZVxuICAgKiAgIHRoYXQgdGhpcyB0YWtlcyBlZmZlY3QgYWZ0ZXIgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIERPTSwgd2hpY2ggY2FuIGJlIHVwIHRvXG4gICAqICAgMTAwbXMgYWZ0ZXIgYGFubm91bmNlYCBoYXMgYmVlbiBjYWxsZWQuXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgYWRkZWQgdG8gdGhlIERPTS5cbiAgICovXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZywgcG9saXRlbmVzcz86IEFyaWFMaXZlUG9saXRlbmVzcywgZHVyYXRpb24/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIGFubm91bmNlKG1lc3NhZ2U6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHRoaXMuX2RlZmF1bHRPcHRpb25zO1xuICAgIGxldCBwb2xpdGVuZXNzOiBBcmlhTGl2ZVBvbGl0ZW5lc3MgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGR1cmF0aW9uOiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGFyZ3NbMF0gPT09ICdudW1iZXInKSB7XG4gICAgICBkdXJhdGlvbiA9IGFyZ3NbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIFtwb2xpdGVuZXNzLCBkdXJhdGlvbl0gPSBhcmdzO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXIoKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fcHJldmlvdXNUaW1lb3V0KTtcblxuICAgIGlmICghcG9saXRlbmVzcykge1xuICAgICAgcG9saXRlbmVzcyA9XG4gICAgICAgICAgKGRlZmF1bHRPcHRpb25zICYmIGRlZmF1bHRPcHRpb25zLnBvbGl0ZW5lc3MpID8gZGVmYXVsdE9wdGlvbnMucG9saXRlbmVzcyA6ICdwb2xpdGUnO1xuICAgIH1cblxuICAgIGlmIChkdXJhdGlvbiA9PSBudWxsICYmIGRlZmF1bHRPcHRpb25zKSB7XG4gICAgICBkdXJhdGlvbiA9IGRlZmF1bHRPcHRpb25zLmR1cmF0aW9uO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGVuc3VyZSBjaGFuZ2luZyB0aGUgcG9saXRlbmVzcyB3b3JrcyBvbiBhbGwgZW52aXJvbm1lbnRzIHdlIHN1cHBvcnQuXG4gICAgdGhpcy5fbGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCBwb2xpdGVuZXNzKTtcblxuICAgIC8vIFRoaXMgMTAwbXMgdGltZW91dCBpcyBuZWNlc3NhcnkgZm9yIHNvbWUgYnJvd3NlciArIHNjcmVlbi1yZWFkZXIgY29tYmluYXRpb25zOlxuICAgIC8vIC0gQm90aCBKQVdTIGFuZCBOVkRBIG92ZXIgSUUxMSB3aWxsIG5vdCBhbm5vdW5jZSBhbnl0aGluZyB3aXRob3V0IGEgbm9uLXplcm8gdGltZW91dC5cbiAgICAvLyAtIFdpdGggQ2hyb21lIGFuZCBJRTExIHdpdGggTlZEQSBvciBKQVdTLCBhIHJlcGVhdGVkIChpZGVudGljYWwpIG1lc3NhZ2Ugd29uJ3QgYmUgcmVhZCBhXG4gICAgLy8gICBzZWNvbmQgdGltZSB3aXRob3V0IGNsZWFyaW5nIGFuZCB0aGVuIHVzaW5nIGEgbm9uLXplcm8gZGVsYXkuXG4gICAgLy8gKHVzaW5nIEpBV1MgMTcgYXQgdGltZSBvZiB0aGlzIHdyaXRpbmcpLlxuICAgIHJldHVybiB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fcHJldmlvdXNUaW1lb3V0KTtcbiAgICAgICAgdGhpcy5fcHJldmlvdXNUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbGl2ZUVsZW1lbnQudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuICAgICAgICAgIHJlc29sdmUoKTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmV2aW91c1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY2xlYXIoKSwgZHVyYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgY3VycmVudCB0ZXh0IGZyb20gdGhlIGFubm91bmNlciBlbGVtZW50LiBDYW4gYmUgdXNlZCB0byBwcmV2ZW50XG4gICAqIHNjcmVlbiByZWFkZXJzIGZyb20gcmVhZGluZyB0aGUgdGV4dCBvdXQgYWdhaW4gd2hpbGUgdGhlIHVzZXIgaXMgZ29pbmdcbiAgICogdGhyb3VnaCB0aGUgcGFnZSBsYW5kbWFya3MuXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICBpZiAodGhpcy5fbGl2ZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2xpdmVFbGVtZW50LnRleHRDb250ZW50ID0gJyc7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3ByZXZpb3VzVGltZW91dCk7XG5cbiAgICBpZiAodGhpcy5fbGl2ZUVsZW1lbnQgJiYgdGhpcy5fbGl2ZUVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5fbGl2ZUVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9saXZlRWxlbWVudCk7XG4gICAgICB0aGlzLl9saXZlRWxlbWVudCA9IG51bGwhO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZUxpdmVFbGVtZW50KCk6IEhUTUxFbGVtZW50IHtcbiAgICBjb25zdCBlbGVtZW50Q2xhc3MgPSAnY2RrLWxpdmUtYW5ub3VuY2VyLWVsZW1lbnQnO1xuICAgIGNvbnN0IHByZXZpb3VzRWxlbWVudHMgPSB0aGlzLl9kb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGVsZW1lbnRDbGFzcyk7XG4gICAgY29uc3QgbGl2ZUVsID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAvLyBSZW1vdmUgYW55IG9sZCBjb250YWluZXJzLiBUaGlzIGNhbiBoYXBwZW4gd2hlbiBjb21pbmcgaW4gZnJvbSBhIHNlcnZlci1zaWRlLXJlbmRlcmVkIHBhZ2UuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmV2aW91c0VsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcmV2aW91c0VsZW1lbnRzW2ldLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHByZXZpb3VzRWxlbWVudHNbaV0pO1xuICAgIH1cblxuICAgIGxpdmVFbC5jbGFzc0xpc3QuYWRkKGVsZW1lbnRDbGFzcyk7XG4gICAgbGl2ZUVsLmNsYXNzTGlzdC5hZGQoJ2Nkay12aXN1YWxseS1oaWRkZW4nKTtcblxuICAgIGxpdmVFbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtYXRvbWljJywgJ3RydWUnKTtcbiAgICBsaXZlRWwuc2V0QXR0cmlidXRlKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG5cbiAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpdmVFbCk7XG5cbiAgICByZXR1cm4gbGl2ZUVsO1xuICB9XG5cbn1cblxuXG4vKipcbiAqIEEgZGlyZWN0aXZlIHRoYXQgd29ya3Mgc2ltaWxhcmx5IHRvIGFyaWEtbGl2ZSwgYnV0IHVzZXMgdGhlIExpdmVBbm5vdW5jZXIgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHlcbiAqIHdpdGggYSB3aWRlciByYW5nZSBvZiBicm93c2VycyBhbmQgc2NyZWVuIHJlYWRlcnMuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtBcmlhTGl2ZV0nLFxuICBleHBvcnRBczogJ2Nka0FyaWFMaXZlJyxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQXJpYUxpdmUgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogVGhlIGFyaWEtbGl2ZSBwb2xpdGVuZXNzIGxldmVsIHRvIHVzZSB3aGVuIGFubm91bmNpbmcgbWVzc2FnZXMuICovXG4gIEBJbnB1dCgnY2RrQXJpYUxpdmUnKVxuICBnZXQgcG9saXRlbmVzcygpOiBBcmlhTGl2ZVBvbGl0ZW5lc3MgeyByZXR1cm4gdGhpcy5fcG9saXRlbmVzczsgfVxuICBzZXQgcG9saXRlbmVzcyh2YWx1ZTogQXJpYUxpdmVQb2xpdGVuZXNzKSB7XG4gICAgdGhpcy5fcG9saXRlbmVzcyA9IHZhbHVlID09PSAncG9saXRlJyB8fCB2YWx1ZSA9PT0gJ2Fzc2VydGl2ZScgPyB2YWx1ZSA6ICdvZmYnO1xuICAgIGlmICh0aGlzLl9wb2xpdGVuZXNzID09PSAnb2ZmJykge1xuICAgICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9zdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbiA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZW50T2JzZXJ2ZXJcbiAgICAgICAgICAub2JzZXJ2ZSh0aGlzLl9lbGVtZW50UmVmKVxuICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHdlIHVzZSB0ZXh0Q29udGVudCBoZXJlLCByYXRoZXIgdGhhbiBpbm5lclRleHQsIGluIG9yZGVyIHRvIGF2b2lkIGEgcmVmbG93LlxuICAgICAgICAgICAgY29uc3QgZWxlbWVudFRleHQgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudGV4dENvbnRlbnQ7XG5cbiAgICAgICAgICAgIC8vIFRoZSBgTXV0YXRpb25PYnNlcnZlcmAgZmlyZXMgYWxzbyBmb3IgYXR0cmlidXRlXG4gICAgICAgICAgICAvLyBjaGFuZ2VzIHdoaWNoIHdlIGRvbid0IHdhbnQgdG8gYW5ub3VuY2UuXG4gICAgICAgICAgICBpZiAoZWxlbWVudFRleHQgIT09IHRoaXMuX3ByZXZpb3VzQW5ub3VuY2VkVGV4dCkge1xuICAgICAgICAgICAgICB0aGlzLl9saXZlQW5ub3VuY2VyLmFubm91bmNlKGVsZW1lbnRUZXh0LCB0aGlzLl9wb2xpdGVuZXNzKTtcbiAgICAgICAgICAgICAgdGhpcy5fcHJldmlvdXNBbm5vdW5jZWRUZXh0ID0gZWxlbWVudFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfcG9saXRlbmVzczogQXJpYUxpdmVQb2xpdGVuZXNzID0gJ29mZic7XG5cbiAgcHJpdmF0ZSBfcHJldmlvdXNBbm5vdW5jZWRUZXh0Pzogc3RyaW5nO1xuICBwcml2YXRlIF9zdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbiB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZiwgcHJpdmF0ZSBfbGl2ZUFubm91bmNlcjogTGl2ZUFubm91bmNlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY29udGVudE9ic2VydmVyOiBDb250ZW50T2JzZXJ2ZXIsIHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7fVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiBMSVZFX0FOTk9VTkNFUl9QUk9WSURFUl9GQUNUT1JZKFxuICAgIHBhcmVudEFubm91bmNlcjogTGl2ZUFubm91bmNlciwgbGl2ZUVsZW1lbnQ6IGFueSwgX2RvY3VtZW50OiBhbnksIG5nWm9uZTogTmdab25lKSB7XG4gIHJldHVybiBwYXJlbnRBbm5vdW5jZXIgfHwgbmV3IExpdmVBbm5vdW5jZXIobGl2ZUVsZW1lbnQsIG5nWm9uZSwgX2RvY3VtZW50KTtcbn1cblxuXG4vKiogQGRvY3MtcHJpdmF0ZSBAZGVwcmVjYXRlZCBAYnJlYWtpbmctY2hhbmdlIDguMC4wICovXG5leHBvcnQgY29uc3QgTElWRV9BTk5PVU5DRVJfUFJPVklERVI6IFByb3ZpZGVyID0ge1xuICAvLyBJZiB0aGVyZSBpcyBhbHJlYWR5IGEgTGl2ZUFubm91bmNlciBhdmFpbGFibGUsIHVzZSB0aGF0LiBPdGhlcndpc2UsIHByb3ZpZGUgYSBuZXcgb25lLlxuICBwcm92aWRlOiBMaXZlQW5ub3VuY2VyLFxuICBkZXBzOiBbXG4gICAgW25ldyBPcHRpb25hbCgpLCBuZXcgU2tpcFNlbGYoKSwgTGl2ZUFubm91bmNlcl0sXG4gICAgW25ldyBPcHRpb25hbCgpLCBuZXcgSW5qZWN0KExJVkVfQU5OT1VOQ0VSX0VMRU1FTlRfVE9LRU4pXSxcbiAgICBET0NVTUVOVCxcbiAgICBOZ1pvbmUsXG4gIF0sXG4gIHVzZUZhY3Rvcnk6IExJVkVfQU5OT1VOQ0VSX1BST1ZJREVSX0ZBQ1RPUllcbn07XG4iXX0=