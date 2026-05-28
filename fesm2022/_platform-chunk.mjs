import * as i0 from '@angular/core';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

let hasV8BreakIterator;
try {
  hasV8BreakIterator = typeof Intl !== 'undefined' && Intl.v8BreakIterator;
} catch {
  hasV8BreakIterator = false;
}
class Platform {
  _platformId = inject(PLATFORM_ID);
  isBrowser = this._platformId ? isPlatformBrowser(this._platformId) : typeof document === 'object' && !!document;
  EDGE = this.isBrowser && /(edge)/i.test(navigator.userAgent);
  TRIDENT = this.isBrowser && /(msie|trident)/i.test(navigator.userAgent);
  BLINK = this.isBrowser && !!(window.chrome || hasV8BreakIterator) && typeof CSS !== 'undefined' && !this.EDGE && !this.TRIDENT;
  WEBKIT = this.isBrowser && /AppleWebKit/i.test(navigator.userAgent) && !this.BLINK && !this.EDGE && !this.TRIDENT;
  IOS = this.isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  FIREFOX = this.isBrowser && /(firefox|minefield)/i.test(navigator.userAgent);
  ANDROID = this.isBrowser && /android/i.test(navigator.userAgent) && !this.TRIDENT;
  SAFARI = this.isBrowser && /safari/i.test(navigator.userAgent) && this.WEBKIT;
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "22.0.0-rc.2",
    ngImport: i0,
    type: Platform,
    deps: [],
    target: i0.ɵɵFactoryTarget.Service
  });
  static ɵprov = i0.ɵɵngDeclareService({
    minVersion: "22.0.0",
    version: "22.0.0-rc.2",
    ngImport: i0,
    type: Platform
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "22.0.0-rc.2",
  ngImport: i0,
  type: Platform,
  decorators: [{
    type: Service
  }]
});

export { Platform };
//# sourceMappingURL=_platform-chunk.mjs.map
