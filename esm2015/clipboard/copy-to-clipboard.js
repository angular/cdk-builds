/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata, __param } from "tslib";
import { Directive, EventEmitter, Input, Output, NgZone, InjectionToken, Inject, Optional, } from '@angular/core';
import { Clipboard } from './clipboard';
/** Injection token that can be used to provide the default options to `CdkCopyToClipboard`. */
export const CKD_COPY_TO_CLIPBOARD_CONFIG = new InjectionToken('CKD_COPY_TO_CLIPBOARD_CONFIG');
/**
 * Provides behavior for a button that when clicked copies content into user's
 * clipboard.
 */
let CdkCopyToClipboard = /** @class */ (() => {
    let CdkCopyToClipboard = class CdkCopyToClipboard {
        constructor(_clipboard, _ngZone, config) {
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
            /** Copies that are currently being attempted. */
            this._pending = new Set();
            if (config && config.attempts != null) {
                this.attempts = config.attempts;
            }
        }
        /** Copies the current text to the clipboard. */
        copy(attempts = this.attempts) {
            if (attempts > 1) {
                let remainingAttempts = attempts;
                const pending = this._clipboard.beginCopy(this.text);
                this._pending.add(pending);
                const attempt = () => {
                    const successful = pending.copy();
                    if (!successful && --remainingAttempts && !this._destroyed) {
                        // We use 1 for the timeout since it's more predictable when flushing in unit tests.
                        this._currentTimeout = this._ngZone.runOutsideAngular(() => setTimeout(attempt, 1));
                    }
                    else {
                        this._currentTimeout = null;
                        this._pending.delete(pending);
                        pending.destroy();
                        this.copied.emit(successful);
                    }
                };
                attempt();
            }
            else {
                this.copied.emit(this._clipboard.copy(this.text));
            }
        }
        ngOnDestroy() {
            if (this._currentTimeout) {
                clearTimeout(this._currentTimeout);
            }
            this._pending.forEach(copy => copy.destroy());
            this._pending.clear();
            this._destroyed = true;
        }
    };
    __decorate([
        Input('cdkCopyToClipboard'),
        __metadata("design:type", String)
    ], CdkCopyToClipboard.prototype, "text", void 0);
    __decorate([
        Input('cdkCopyToClipboardAttempts'),
        __metadata("design:type", Number)
    ], CdkCopyToClipboard.prototype, "attempts", void 0);
    __decorate([
        Output('cdkCopyToClipboardCopied'),
        __metadata("design:type", Object)
    ], CdkCopyToClipboard.prototype, "copied", void 0);
    CdkCopyToClipboard = __decorate([
        Directive({
            selector: '[cdkCopyToClipboard]',
            host: {
                '(click)': 'copy()',
            }
        }),
        __param(2, Optional()), __param(2, Inject(CKD_COPY_TO_CLIPBOARD_CONFIG)),
        __metadata("design:paramtypes", [Clipboard,
            NgZone, Object])
    ], CdkCopyToClipboard);
    return CdkCopyToClipboard;
})();
export { CdkCopyToClipboard };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS10by1jbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NsaXBib2FyZC9jb3B5LXRvLWNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUNMLFNBQVMsRUFDVCxZQUFZLEVBQ1osS0FBSyxFQUNMLE1BQU0sRUFDTixNQUFNLEVBQ04sY0FBYyxFQUNkLE1BQU0sRUFDTixRQUFRLEdBRVQsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQVN0QywrRkFBK0Y7QUFDL0YsTUFBTSxDQUFDLE1BQU0sNEJBQTRCLEdBQ3JDLElBQUksY0FBYyxDQUEyQiw4QkFBOEIsQ0FBQyxDQUFDO0FBRWpGOzs7R0FHRztBQU9IO0lBQUEsSUFBYSxrQkFBa0IsR0FBL0IsTUFBYSxrQkFBa0I7UUF5QjdCLFlBQ1UsVUFBcUIsRUFDckIsT0FBZSxFQUMyQixNQUFpQztZQUYzRSxlQUFVLEdBQVYsVUFBVSxDQUFXO1lBQ3JCLFlBQU8sR0FBUCxPQUFPLENBQVE7WUExQnpCLDRCQUE0QjtZQUNDLFNBQUksR0FBVyxFQUFFLENBQUM7WUFFL0M7OztlQUdHO1lBQ2tDLGFBQVEsR0FBVyxDQUFDLENBQUM7WUFFMUQ7OztlQUdHO1lBQ2lDLFdBQU0sR0FBRyxJQUFJLFlBQVksRUFBVyxDQUFDO1lBRXpFLGlEQUFpRDtZQUN6QyxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztZQWF4QyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxJQUFJLElBQUksRUFBRTtnQkFDckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO2FBQ2pDO1FBQ0gsQ0FBQztRQUVELGdEQUFnRDtRQUNoRCxJQUFJLENBQUMsV0FBbUIsSUFBSSxDQUFDLFFBQVE7WUFDbkMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFO2dCQUNoQixJQUFJLGlCQUFpQixHQUFHLFFBQVEsQ0FBQztnQkFDakMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFM0IsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFO29CQUNuQixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7d0JBQzFELG9GQUFvRjt3QkFDcEYsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDckY7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7d0JBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM5QixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUM5QjtnQkFDSCxDQUFDLENBQUM7Z0JBQ0YsT0FBTyxFQUFFLENBQUM7YUFDWDtpQkFBTTtnQkFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNuRDtRQUNILENBQUM7UUFFRCxXQUFXO1lBQ1QsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUN4QixZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2FBQ3BDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7S0FDRixDQUFBO0lBbkU4QjtRQUE1QixLQUFLLENBQUMsb0JBQW9CLENBQUM7O29EQUFtQjtJQU1WO1FBQXBDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQzs7d0RBQXNCO0lBTXRCO1FBQW5DLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQzs7c0RBQXNDO0lBZDlELGtCQUFrQjtRQU45QixTQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsc0JBQXNCO1lBQ2hDLElBQUksRUFBRTtnQkFDSixTQUFTLEVBQUUsUUFBUTthQUNwQjtTQUNGLENBQUM7UUE2QkcsV0FBQSxRQUFRLEVBQUUsQ0FBQSxFQUFFLFdBQUEsTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUE7eUNBRjdCLFNBQVM7WUFDWixNQUFNO09BM0JkLGtCQUFrQixDQXFFOUI7SUFBRCx5QkFBQztLQUFBO1NBckVZLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgTmdab25lLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5qZWN0LFxuICBPcHRpb25hbCxcbiAgT25EZXN0cm95LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2xpcGJvYXJkfSBmcm9tICcuL2NsaXBib2FyZCc7XG5pbXBvcnQge1BlbmRpbmdDb3B5fSBmcm9tICcuL3BlbmRpbmctY29weSc7XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGRlZmF1bHQgb3B0aW9ucyBmb3IgYENka0NvcHlUb0NsaXBib2FyZGAuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0NvcHlUb0NsaXBib2FyZENvbmZpZyB7XG4gIC8qKiBEZWZhdWx0IG51bWJlciBvZiBhdHRlbXB0cyB0byBtYWtlIHdoZW4gY29weWluZyB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQuICovXG4gIGF0dGVtcHRzPzogbnVtYmVyO1xufVxuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcHJvdmlkZSB0aGUgZGVmYXVsdCBvcHRpb25zIHRvIGBDZGtDb3B5VG9DbGlwYm9hcmRgLiAqL1xuZXhwb3J0IGNvbnN0IENLRF9DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxDZGtDb3B5VG9DbGlwYm9hcmRDb25maWc+KCdDS0RfQ09QWV9UT19DTElQQk9BUkRfQ09ORklHJyk7XG5cbi8qKlxuICogUHJvdmlkZXMgYmVoYXZpb3IgZm9yIGEgYnV0dG9uIHRoYXQgd2hlbiBjbGlja2VkIGNvcGllcyBjb250ZW50IGludG8gdXNlcidzXG4gKiBjbGlwYm9hcmQuXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1tjZGtDb3B5VG9DbGlwYm9hcmRdJyxcbiAgaG9zdDoge1xuICAgICcoY2xpY2spJzogJ2NvcHkoKScsXG4gIH1cbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29weVRvQ2xpcGJvYXJkIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIENvbnRlbnQgdG8gYmUgY29waWVkLiAqL1xuICBASW5wdXQoJ2Nka0NvcHlUb0NsaXBib2FyZCcpIHRleHQ6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBIb3cgbWFueSB0aW1lcyB0byBhdHRlbXB0IHRvIGNvcHkgdGhlIHRleHQuIFRoaXMgbWF5IGJlIG5lY2Vzc2FyeSBmb3IgbG9uZ2VyIHRleHQsIGJlY2F1c2VcbiAgICogdGhlIGJyb3dzZXIgbmVlZHMgdGltZSB0byBmaWxsIGFuIGludGVybWVkaWF0ZSB0ZXh0YXJlYSBlbGVtZW50IGFuZCBjb3B5IHRoZSBjb250ZW50LlxuICAgKi9cbiAgQElucHV0KCdjZGtDb3B5VG9DbGlwYm9hcmRBdHRlbXB0cycpIGF0dGVtcHRzOiBudW1iZXIgPSAxO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHNvbWUgdGV4dCBpcyBjb3BpZWQgdG8gdGhlIGNsaXBib2FyZC4gVGhlXG4gICAqIGVtaXR0ZWQgdmFsdWUgaW5kaWNhdGVzIHdoZXRoZXIgY29weWluZyB3YXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0NvcHlUb0NsaXBib2FyZENvcGllZCcpIGNvcGllZCA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICAvKiogQ29waWVzIHRoYXQgYXJlIGN1cnJlbnRseSBiZWluZyBhdHRlbXB0ZWQuICovXG4gIHByaXZhdGUgX3BlbmRpbmcgPSBuZXcgU2V0PFBlbmRpbmdDb3B5PigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBkaXJlY3RpdmUgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW47XG5cbiAgLyoqIFRpbWVvdXQgZm9yIHRoZSBjdXJyZW50IGNvcHkgYXR0ZW1wdC4gKi9cbiAgcHJpdmF0ZSBfY3VycmVudFRpbWVvdXQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9jbGlwYm9hcmQ6IENsaXBib2FyZCxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENLRF9DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcpIGNvbmZpZz86IENka0NvcHlUb0NsaXBib2FyZENvbmZpZykge1xuXG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcuYXR0ZW1wdHMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5hdHRlbXB0cyA9IGNvbmZpZy5hdHRlbXB0cztcbiAgICB9XG4gIH1cblxuICAvKiogQ29waWVzIHRoZSBjdXJyZW50IHRleHQgdG8gdGhlIGNsaXBib2FyZC4gKi9cbiAgY29weShhdHRlbXB0czogbnVtYmVyID0gdGhpcy5hdHRlbXB0cyk6IHZvaWQge1xuICAgIGlmIChhdHRlbXB0cyA+IDEpIHtcbiAgICAgIGxldCByZW1haW5pbmdBdHRlbXB0cyA9IGF0dGVtcHRzO1xuICAgICAgY29uc3QgcGVuZGluZyA9IHRoaXMuX2NsaXBib2FyZC5iZWdpbkNvcHkodGhpcy50ZXh0KTtcbiAgICAgIHRoaXMuX3BlbmRpbmcuYWRkKHBlbmRpbmcpO1xuXG4gICAgICBjb25zdCBhdHRlbXB0ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWNjZXNzZnVsID0gcGVuZGluZy5jb3B5KCk7XG4gICAgICAgIGlmICghc3VjY2Vzc2Z1bCAmJiAtLXJlbWFpbmluZ0F0dGVtcHRzICYmICF0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgICAgICAvLyBXZSB1c2UgMSBmb3IgdGhlIHRpbWVvdXQgc2luY2UgaXQncyBtb3JlIHByZWRpY3RhYmxlIHdoZW4gZmx1c2hpbmcgaW4gdW5pdCB0ZXN0cy5cbiAgICAgICAgICB0aGlzLl9jdXJyZW50VGltZW91dCA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBzZXRUaW1lb3V0KGF0dGVtcHQsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZy5kZWxldGUocGVuZGluZyk7XG4gICAgICAgICAgcGVuZGluZy5kZXN0cm95KCk7XG4gICAgICAgICAgdGhpcy5jb3BpZWQuZW1pdChzdWNjZXNzZnVsKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGF0dGVtcHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb3BpZWQuZW1pdCh0aGlzLl9jbGlwYm9hcmQuY29weSh0aGlzLnRleHQpKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9jdXJyZW50VGltZW91dCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcGVuZGluZy5mb3JFYWNoKGNvcHkgPT4gY29weS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX3BlbmRpbmcuY2xlYXIoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG59XG4iXX0=