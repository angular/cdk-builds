/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directive, EventEmitter, Input, Output, NgZone, InjectionToken, Inject, Optional, } from '@angular/core';
import { Clipboard } from './clipboard';
import * as i0 from "@angular/core";
import * as i1 from "./clipboard";
/** Injection token that can be used to provide the default options to `CdkCopyToClipboard`. */
export const CDK_COPY_TO_CLIPBOARD_CONFIG = new InjectionToken('CDK_COPY_TO_CLIPBOARD_CONFIG');
/**
 * Provides behavior for a button that when clicked copies content into user's
 * clipboard.
 */
class CdkCopyToClipboard {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkCopyToClipboard, deps: [{ token: i1.Clipboard }, { token: i0.NgZone }, { token: CDK_COPY_TO_CLIPBOARD_CONFIG, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.0", type: CdkCopyToClipboard, selector: "[cdkCopyToClipboard]", inputs: { text: ["cdkCopyToClipboard", "text"], attempts: ["cdkCopyToClipboardAttempts", "attempts"] }, outputs: { copied: "cdkCopyToClipboardCopied" }, host: { listeners: { "click": "copy()" } }, ngImport: i0 }); }
}
export { CdkCopyToClipboard };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: CdkCopyToClipboard, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkCopyToClipboard]',
                    host: {
                        '(click)': 'copy()',
                    },
                }]
        }], ctorParameters: function () { return [{ type: i1.Clipboard }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [CDK_COPY_TO_CLIPBOARD_CONFIG]
                }] }]; }, propDecorators: { text: [{
                type: Input,
                args: ['cdkCopyToClipboard']
            }], attempts: [{
                type: Input,
                args: ['cdkCopyToClipboardAttempts']
            }], copied: [{
                type: Output,
                args: ['cdkCopyToClipboardCopied']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS10by1jbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2NsaXBib2FyZC9jb3B5LXRvLWNsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsU0FBUyxFQUNULFlBQVksRUFDWixLQUFLLEVBQ0wsTUFBTSxFQUNOLE1BQU0sRUFDTixjQUFjLEVBQ2QsTUFBTSxFQUNOLFFBQVEsR0FFVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sYUFBYSxDQUFDOzs7QUFTdEMsK0ZBQStGO0FBQy9GLE1BQU0sQ0FBQyxNQUFNLDRCQUE0QixHQUFHLElBQUksY0FBYyxDQUM1RCw4QkFBOEIsQ0FDL0IsQ0FBQztBQUVGOzs7R0FHRztBQUNILE1BTWEsa0JBQWtCO0lBeUI3QixZQUNVLFVBQXFCLEVBQ3JCLE9BQWUsRUFDMkIsTUFBaUM7UUFGM0UsZUFBVSxHQUFWLFVBQVUsQ0FBVztRQUNyQixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBMUJ6Qiw0QkFBNEI7UUFDQyxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBRS9DOzs7V0FHRztRQUNrQyxhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBRTFEOzs7V0FHRztRQUMwQyxXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQVcsQ0FBQztRQUVsRixpREFBaUQ7UUFDekMsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7UUFheEMsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxJQUFJLENBQUMsV0FBbUIsSUFBSSxDQUFDLFFBQVE7UUFDbkMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFO1lBQ2hCLElBQUksaUJBQWlCLEdBQUcsUUFBUSxDQUFDO1lBQ2pDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUzQixNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7Z0JBQ25CLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFLGlCQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDMUQsb0ZBQW9GO29CQUNwRixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNyRjtxQkFBTTtvQkFDTCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztvQkFDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzlCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzlCO1lBQ0gsQ0FBQyxDQUFDO1lBQ0YsT0FBTyxFQUFFLENBQUM7U0FDWDthQUFNO1lBQ0wsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDbkQ7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN4QixZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ3BDO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7OEdBcEVVLGtCQUFrQixpRUE0QlAsNEJBQTRCO2tHQTVCdkMsa0JBQWtCOztTQUFsQixrQkFBa0I7MkZBQWxCLGtCQUFrQjtrQkFOOUIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsc0JBQXNCO29CQUNoQyxJQUFJLEVBQUU7d0JBQ0osU0FBUyxFQUFFLFFBQVE7cUJBQ3BCO2lCQUNGOzswQkE2QkksUUFBUTs7MEJBQUksTUFBTTsyQkFBQyw0QkFBNEI7NENBMUJyQixJQUFJO3NCQUFoQyxLQUFLO3VCQUFDLG9CQUFvQjtnQkFNVSxRQUFRO3NCQUE1QyxLQUFLO3VCQUFDLDRCQUE0QjtnQkFNVSxNQUFNO3NCQUFsRCxNQUFNO3VCQUFDLDBCQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgTmdab25lLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5qZWN0LFxuICBPcHRpb25hbCxcbiAgT25EZXN0cm95LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q2xpcGJvYXJkfSBmcm9tICcuL2NsaXBib2FyZCc7XG5pbXBvcnQge1BlbmRpbmdDb3B5fSBmcm9tICcuL3BlbmRpbmctY29weSc7XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byBjb25maWd1cmUgdGhlIGRlZmF1bHQgb3B0aW9ucyBmb3IgYENka0NvcHlUb0NsaXBib2FyZGAuICovXG5leHBvcnQgaW50ZXJmYWNlIENka0NvcHlUb0NsaXBib2FyZENvbmZpZyB7XG4gIC8qKiBEZWZhdWx0IG51bWJlciBvZiBhdHRlbXB0cyB0byBtYWtlIHdoZW4gY29weWluZyB0ZXh0IHRvIHRoZSBjbGlwYm9hcmQuICovXG4gIGF0dGVtcHRzPzogbnVtYmVyO1xufVxuXG4vKiogSW5qZWN0aW9uIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgdG8gcHJvdmlkZSB0aGUgZGVmYXVsdCBvcHRpb25zIHRvIGBDZGtDb3B5VG9DbGlwYm9hcmRgLiAqL1xuZXhwb3J0IGNvbnN0IENES19DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q2RrQ29weVRvQ2xpcGJvYXJkQ29uZmlnPihcbiAgJ0NES19DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcnLFxuKTtcblxuLyoqXG4gKiBQcm92aWRlcyBiZWhhdmlvciBmb3IgYSBidXR0b24gdGhhdCB3aGVuIGNsaWNrZWQgY29waWVzIGNvbnRlbnQgaW50byB1c2VyJ3NcbiAqIGNsaXBib2FyZC5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0NvcHlUb0NsaXBib2FyZF0nLFxuICBob3N0OiB7XG4gICAgJyhjbGljayknOiAnY29weSgpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrQ29weVRvQ2xpcGJvYXJkIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLyoqIENvbnRlbnQgdG8gYmUgY29waWVkLiAqL1xuICBASW5wdXQoJ2Nka0NvcHlUb0NsaXBib2FyZCcpIHRleHQ6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBIb3cgbWFueSB0aW1lcyB0byBhdHRlbXB0IHRvIGNvcHkgdGhlIHRleHQuIFRoaXMgbWF5IGJlIG5lY2Vzc2FyeSBmb3IgbG9uZ2VyIHRleHQsIGJlY2F1c2VcbiAgICogdGhlIGJyb3dzZXIgbmVlZHMgdGltZSB0byBmaWxsIGFuIGludGVybWVkaWF0ZSB0ZXh0YXJlYSBlbGVtZW50IGFuZCBjb3B5IHRoZSBjb250ZW50LlxuICAgKi9cbiAgQElucHV0KCdjZGtDb3B5VG9DbGlwYm9hcmRBdHRlbXB0cycpIGF0dGVtcHRzOiBudW1iZXIgPSAxO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHNvbWUgdGV4dCBpcyBjb3BpZWQgdG8gdGhlIGNsaXBib2FyZC4gVGhlXG4gICAqIGVtaXR0ZWQgdmFsdWUgaW5kaWNhdGVzIHdoZXRoZXIgY29weWluZyB3YXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIEBPdXRwdXQoJ2Nka0NvcHlUb0NsaXBib2FyZENvcGllZCcpIHJlYWRvbmx5IGNvcGllZCA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4oKTtcblxuICAvKiogQ29waWVzIHRoYXQgYXJlIGN1cnJlbnRseSBiZWluZyBhdHRlbXB0ZWQuICovXG4gIHByaXZhdGUgX3BlbmRpbmcgPSBuZXcgU2V0PFBlbmRpbmdDb3B5PigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBkaXJlY3RpdmUgaGFzIGJlZW4gZGVzdHJveWVkLiAqL1xuICBwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW47XG5cbiAgLyoqIFRpbWVvdXQgZm9yIHRoZSBjdXJyZW50IGNvcHkgYXR0ZW1wdC4gKi9cbiAgcHJpdmF0ZSBfY3VycmVudFRpbWVvdXQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9jbGlwYm9hcmQ6IENsaXBib2FyZCxcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBAT3B0aW9uYWwoKSBASW5qZWN0KENES19DT1BZX1RPX0NMSVBCT0FSRF9DT05GSUcpIGNvbmZpZz86IENka0NvcHlUb0NsaXBib2FyZENvbmZpZyxcbiAgKSB7XG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcuYXR0ZW1wdHMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5hdHRlbXB0cyA9IGNvbmZpZy5hdHRlbXB0cztcbiAgICB9XG4gIH1cblxuICAvKiogQ29waWVzIHRoZSBjdXJyZW50IHRleHQgdG8gdGhlIGNsaXBib2FyZC4gKi9cbiAgY29weShhdHRlbXB0czogbnVtYmVyID0gdGhpcy5hdHRlbXB0cyk6IHZvaWQge1xuICAgIGlmIChhdHRlbXB0cyA+IDEpIHtcbiAgICAgIGxldCByZW1haW5pbmdBdHRlbXB0cyA9IGF0dGVtcHRzO1xuICAgICAgY29uc3QgcGVuZGluZyA9IHRoaXMuX2NsaXBib2FyZC5iZWdpbkNvcHkodGhpcy50ZXh0KTtcbiAgICAgIHRoaXMuX3BlbmRpbmcuYWRkKHBlbmRpbmcpO1xuXG4gICAgICBjb25zdCBhdHRlbXB0ID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWNjZXNzZnVsID0gcGVuZGluZy5jb3B5KCk7XG4gICAgICAgIGlmICghc3VjY2Vzc2Z1bCAmJiAtLXJlbWFpbmluZ0F0dGVtcHRzICYmICF0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgICAgICAvLyBXZSB1c2UgMSBmb3IgdGhlIHRpbWVvdXQgc2luY2UgaXQncyBtb3JlIHByZWRpY3RhYmxlIHdoZW4gZmx1c2hpbmcgaW4gdW5pdCB0ZXN0cy5cbiAgICAgICAgICB0aGlzLl9jdXJyZW50VGltZW91dCA9IHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBzZXRUaW1lb3V0KGF0dGVtcHQsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZy5kZWxldGUocGVuZGluZyk7XG4gICAgICAgICAgcGVuZGluZy5kZXN0cm95KCk7XG4gICAgICAgICAgdGhpcy5jb3BpZWQuZW1pdChzdWNjZXNzZnVsKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGF0dGVtcHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb3BpZWQuZW1pdCh0aGlzLl9jbGlwYm9hcmQuY29weSh0aGlzLnRleHQpKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9jdXJyZW50VGltZW91dCk7XG4gICAgfVxuXG4gICAgdGhpcy5fcGVuZGluZy5mb3JFYWNoKGNvcHkgPT4gY29weS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX3BlbmRpbmcuY2xlYXIoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG59XG4iXX0=