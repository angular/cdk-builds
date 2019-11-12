/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, EventEmitter, Input, Output, NgZone, InjectionToken, Inject, Optional, } from '@angular/core';
import { Clipboard } from './clipboard';
/** Injection token that can be used to provide the default options to `CdkCopyToClipboard`. */
export var CKD_COPY_TO_CLIPBOARD_CONFIG = new InjectionToken('CKD_COPY_TO_CLIPBOARD_CONFIG');
/**
 * Provides behavior for a button that when clicked copies content into user's
 * clipboard.
 */
var CdkCopyToClipboard = /** @class */ (function () {
    function CdkCopyToClipboard(_clipboard, 
    /**
     * @deprecated _ngZone parameter to become required.
     * @breaking-change 10.0.0
     */
    _ngZone, config) {
        this._clipboard = _clipboard;
        this._ngZone = _ngZone;
        /** Content to be copied. */
        this.text = '';
        /**
         * How many times to attempt to copy the text. This may be necessary for longer text, because
         * the browser needs time to fill an intermediate textarea element and copy the content.
         */
        this.attempts = 1;
        /**
         * Emits when some text is copied to the clipboard. The
         * emitted value indicates whether copying was successful.
         */
        this.copied = new EventEmitter();
        /**
         * Emits when some text is copied to the clipboard. The
         * emitted value indicates whether copying was successful.
         * @deprecated Use `cdkCopyToClipboardCopied` instead.
         * @breaking-change 10.0.0
         */
        this._deprecatedCopied = this.copied;
        if (config && config.attempts != null) {
            this.attempts = config.attempts;
        }
    }
    /** Copies the current text to the clipboard. */
    CdkCopyToClipboard.prototype.copy = function (attempts) {
        var _this = this;
        if (attempts === void 0) { attempts = this.attempts; }
        if (attempts > 1) {
            var remainingAttempts_1 = attempts;
            var pending_1 = this._clipboard.beginCopy(this.text);
            var attempt_1 = function () {
                var successful = pending_1.copy();
                if (!successful && --remainingAttempts_1) {
                    // @breaking-change 10.0.0 Remove null check for `_ngZone`.
                    if (_this._ngZone) {
                        _this._ngZone.runOutsideAngular(function () { return setTimeout(attempt_1); });
                    }
                    else {
                        setTimeout(attempt_1);
                    }
                }
                else {
                    pending_1.destroy();
                    _this.copied.emit(successful);
                }
            };
            attempt_1();
        }
        else {
            this.copied.emit(this._clipboard.copy(this.text));
        }
    };
    CdkCopyToClipboard.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkCopyToClipboard]',
                    host: {
                        '(click)': 'copy()',
                    }
                },] }
    ];
    /** @nocollapse */
    CdkCopyToClipboard.ctorParameters = function () { return [
        { type: Clipboard },
        { type: NgZone },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [CKD_COPY_TO_CLIPBOARD_CONFIG,] }] }
    ]; };
    CdkCopyToClipboard.propDecorators = {
        text: [{ type: Input, args: ['cdkCopyToClipboard',] }],
        attempts: [{ type: Input, args: ['cdkCopyToClipboardAttempts',] }],
        copied: [{ type: Output, args: ['cdkCopyToClipboardCopied',] }],
        _deprecatedCopied: [{ type: Output, args: ['copied',] }]
    };
    return CdkCopyToClipboard;
}());
export { CdkCopyToClipboard };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS10by1jbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NsaXBib2FyZC9jb3B5LXRvLWNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsU0FBUyxFQUNULFlBQVksRUFDWixLQUFLLEVBQ0wsTUFBTSxFQUNOLE1BQU0sRUFDTixjQUFjLEVBQ2QsTUFBTSxFQUNOLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBUXRDLCtGQUErRjtBQUMvRixNQUFNLENBQUMsSUFBTSw0QkFBNEIsR0FDckMsSUFBSSxjQUFjLENBQTJCLDhCQUE4QixDQUFDLENBQUM7QUFFakY7OztHQUdHO0FBQ0g7SUE4QkUsNEJBQ1UsVUFBcUI7SUFDN0I7OztPQUdHO0lBQ0ssT0FBZ0IsRUFDMEIsTUFBaUM7UUFOM0UsZUFBVSxHQUFWLFVBQVUsQ0FBVztRQUtyQixZQUFPLEdBQVAsT0FBTyxDQUFTO1FBN0IxQiw0QkFBNEI7UUFDQyxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBRS9DOzs7V0FHRztRQUNrQyxhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBRTFEOzs7V0FHRztRQUNpQyxXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQVcsQ0FBQztRQUV6RTs7Ozs7V0FLRztRQUNlLHNCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFXaEQsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxpQ0FBSSxHQUFKLFVBQUssUUFBZ0M7UUFBckMsaUJBc0JDO1FBdEJJLHlCQUFBLEVBQUEsV0FBbUIsSUFBSSxDQUFDLFFBQVE7UUFDbkMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFO1lBQ2hCLElBQUksbUJBQWlCLEdBQUcsUUFBUSxDQUFDO1lBQ2pDLElBQU0sU0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRCxJQUFNLFNBQU8sR0FBRztnQkFDZCxJQUFNLFVBQVUsR0FBRyxTQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxtQkFBaUIsRUFBRTtvQkFDdEMsMkRBQTJEO29CQUMzRCxJQUFJLEtBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ2hCLEtBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsY0FBTSxPQUFBLFVBQVUsQ0FBQyxTQUFPLENBQUMsRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO3FCQUMzRDt5QkFBTTt3QkFDTCxVQUFVLENBQUMsU0FBTyxDQUFDLENBQUM7cUJBQ3JCO2lCQUNGO3FCQUFNO29CQUNMLFNBQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbEIsS0FBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzlCO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YsU0FBTyxFQUFFLENBQUM7U0FDWDthQUFNO1lBQ0wsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDbkQ7SUFDSCxDQUFDOztnQkFuRUYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxzQkFBc0I7b0JBQ2hDLElBQUksRUFBRTt3QkFDSixTQUFTLEVBQUUsUUFBUTtxQkFDcEI7aUJBQ0Y7Ozs7Z0JBckJPLFNBQVM7Z0JBTGYsTUFBTTtnREEwREgsUUFBUSxZQUFJLE1BQU0sU0FBQyw0QkFBNEI7Ozt1QkE3QmpELEtBQUssU0FBQyxvQkFBb0I7MkJBTTFCLEtBQUssU0FBQyw0QkFBNEI7eUJBTWxDLE1BQU0sU0FBQywwQkFBMEI7b0NBUWpDLE1BQU0sU0FBQyxRQUFROztJQXdDbEIseUJBQUM7Q0FBQSxBQXBFRCxJQW9FQztTQTlEWSxrQkFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPdXRwdXQsXG4gIE5nWm9uZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIEluamVjdCxcbiAgT3B0aW9uYWwsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDbGlwYm9hcmR9IGZyb20gJy4vY2xpcGJvYXJkJztcblxuLyoqIE9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgZGVmYXVsdCBvcHRpb25zIGZvciBgQ2RrQ29weVRvQ2xpcGJvYXJkYC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2RrQ29weVRvQ2xpcGJvYXJkQ29uZmlnIHtcbiAgLyoqIERlZmF1bHQgbnVtYmVyIG9mIGF0dGVtcHRzIHRvIG1ha2Ugd2hlbiBjb3B5aW5nIHRleHQgdG8gdGhlIGNsaXBib2FyZC4gKi9cbiAgYXR0ZW1wdHM/OiBudW1iZXI7XG59XG5cbi8qKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjYW4gYmUgdXNlZCB0byBwcm92aWRlIHRoZSBkZWZhdWx0IG9wdGlvbnMgdG8gYENka0NvcHlUb0NsaXBib2FyZGAuICovXG5leHBvcnQgY29uc3QgQ0tEX0NPUFlfVE9fQ0xJUEJPQVJEX0NPTkZJRyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPENka0NvcHlUb0NsaXBib2FyZENvbmZpZz4oJ0NLRF9DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcnKTtcblxuLyoqXG4gKiBQcm92aWRlcyBiZWhhdmlvciBmb3IgYSBidXR0b24gdGhhdCB3aGVuIGNsaWNrZWQgY29waWVzIGNvbnRlbnQgaW50byB1c2VyJ3NcbiAqIGNsaXBib2FyZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0NvcHlUb0NsaXBib2FyZF0nLFxuICBob3N0OiB7XG4gICAgJyhjbGljayknOiAnY29weSgpJyxcbiAgfVxufSlcbmV4cG9ydCBjbGFzcyBDZGtDb3B5VG9DbGlwYm9hcmQge1xuICAvKiogQ29udGVudCB0byBiZSBjb3BpZWQuICovXG4gIEBJbnB1dCgnY2RrQ29weVRvQ2xpcGJvYXJkJykgdGV4dDogc3RyaW5nID0gJyc7XG5cbiAgLyoqXG4gICAqIEhvdyBtYW55IHRpbWVzIHRvIGF0dGVtcHQgdG8gY29weSB0aGUgdGV4dC4gVGhpcyBtYXkgYmUgbmVjZXNzYXJ5IGZvciBsb25nZXIgdGV4dCwgYmVjYXVzZVxuICAgKiB0aGUgYnJvd3NlciBuZWVkcyB0aW1lIHRvIGZpbGwgYW4gaW50ZXJtZWRpYXRlIHRleHRhcmVhIGVsZW1lbnQgYW5kIGNvcHkgdGhlIGNvbnRlbnQuXG4gICAqL1xuICBASW5wdXQoJ2Nka0NvcHlUb0NsaXBib2FyZEF0dGVtcHRzJykgYXR0ZW1wdHM6IG51bWJlciA9IDE7XG5cbiAgLyoqXG4gICAqIEVtaXRzIHdoZW4gc29tZSB0ZXh0IGlzIGNvcGllZCB0byB0aGUgY2xpcGJvYXJkLiBUaGVcbiAgICogZW1pdHRlZCB2YWx1ZSBpbmRpY2F0ZXMgd2hldGhlciBjb3B5aW5nIHdhcyBzdWNjZXNzZnVsLlxuICAgKi9cbiAgQE91dHB1dCgnY2RrQ29weVRvQ2xpcGJvYXJkQ29waWVkJykgY29waWVkID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHNvbWUgdGV4dCBpcyBjb3BpZWQgdG8gdGhlIGNsaXBib2FyZC4gVGhlXG4gICAqIGVtaXR0ZWQgdmFsdWUgaW5kaWNhdGVzIHdoZXRoZXIgY29weWluZyB3YXMgc3VjY2Vzc2Z1bC5cbiAgICogQGRlcHJlY2F0ZWQgVXNlIGBjZGtDb3B5VG9DbGlwYm9hcmRDb3BpZWRgIGluc3RlYWQuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTAuMC4wXG4gICAqL1xuICBAT3V0cHV0KCdjb3BpZWQnKSBfZGVwcmVjYXRlZENvcGllZCA9IHRoaXMuY29waWVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX2NsaXBib2FyZDogQ2xpcGJvYXJkLFxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIF9uZ1pvbmUgcGFyYW1ldGVyIHRvIGJlY29tZSByZXF1aXJlZC5cbiAgICAgKiBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMFxuICAgICAqL1xuICAgIHByaXZhdGUgX25nWm9uZT86IE5nWm9uZSxcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENLRF9DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcpIGNvbmZpZz86IENka0NvcHlUb0NsaXBib2FyZENvbmZpZykge1xuXG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcuYXR0ZW1wdHMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5hdHRlbXB0cyA9IGNvbmZpZy5hdHRlbXB0cztcbiAgICB9XG4gIH1cblxuICAvKiogQ29waWVzIHRoZSBjdXJyZW50IHRleHQgdG8gdGhlIGNsaXBib2FyZC4gKi9cbiAgY29weShhdHRlbXB0czogbnVtYmVyID0gdGhpcy5hdHRlbXB0cyk6IHZvaWQge1xuICAgIGlmIChhdHRlbXB0cyA+IDEpIHtcbiAgICAgIGxldCByZW1haW5pbmdBdHRlbXB0cyA9IGF0dGVtcHRzO1xuICAgICAgY29uc3QgcGVuZGluZyA9IHRoaXMuX2NsaXBib2FyZC5iZWdpbkNvcHkodGhpcy50ZXh0KTtcbiAgICAgIGNvbnN0IGF0dGVtcHQgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBwZW5kaW5nLmNvcHkoKTtcbiAgICAgICAgaWYgKCFzdWNjZXNzZnVsICYmIC0tcmVtYWluaW5nQXR0ZW1wdHMpIHtcbiAgICAgICAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDEwLjAuMCBSZW1vdmUgbnVsbCBjaGVjayBmb3IgYF9uZ1pvbmVgLlxuICAgICAgICAgIGlmICh0aGlzLl9uZ1pvbmUpIHtcbiAgICAgICAgICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBzZXRUaW1lb3V0KGF0dGVtcHQpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChhdHRlbXB0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVuZGluZy5kZXN0cm95KCk7XG4gICAgICAgICAgdGhpcy5jb3BpZWQuZW1pdChzdWNjZXNzZnVsKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGF0dGVtcHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb3BpZWQuZW1pdCh0aGlzLl9jbGlwYm9hcmQuY29weSh0aGlzLnRleHQpKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==