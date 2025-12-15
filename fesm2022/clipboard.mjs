import * as i0 from '@angular/core';
import { inject, DOCUMENT, Injectable, InjectionToken, NgZone, EventEmitter, Directive, Input, Output, NgModule } from '@angular/core';

class PendingCopy {
  _document;
  _textarea;
  constructor(text, _document) {
    this._document = _document;
    const textarea = this._textarea = this._document.createElement('textarea');
    const styles = textarea.style;
    styles.position = 'fixed';
    styles.top = styles.opacity = '0';
    styles.left = '-999em';
    textarea.setAttribute('aria-hidden', 'true');
    textarea.value = text;
    textarea.readOnly = true;
    (this._document.fullscreenElement || this._document.body).appendChild(textarea);
  }
  copy() {
    const textarea = this._textarea;
    let successful = false;
    try {
      if (textarea) {
        const currentFocus = this._document.activeElement;
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        successful = this._document.execCommand('copy');
        if (currentFocus) {
          currentFocus.focus();
        }
      }
    } catch {}
    return successful;
  }
  destroy() {
    const textarea = this._textarea;
    if (textarea) {
      textarea.remove();
      this._textarea = undefined;
    }
  }
}

class Clipboard {
  _document = inject(DOCUMENT);
  constructor() {}
  copy(text) {
    const pendingCopy = this.beginCopy(text);
    const successful = pendingCopy.copy();
    pendingCopy.destroy();
    return successful;
  }
  beginCopy(text) {
    return new PendingCopy(text, this._document);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Clipboard,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: Clipboard,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: Clipboard,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }],
  ctorParameters: () => []
});

const CDK_COPY_TO_CLIPBOARD_CONFIG = new InjectionToken('CDK_COPY_TO_CLIPBOARD_CONFIG');
class CdkCopyToClipboard {
  _clipboard = inject(Clipboard);
  _ngZone = inject(NgZone);
  text = '';
  attempts = 1;
  copied = new EventEmitter();
  _pending = new Set();
  _destroyed = false;
  _currentTimeout;
  constructor() {
    const config = inject(CDK_COPY_TO_CLIPBOARD_CONFIG, {
      optional: true
    });
    if (config && config.attempts != null) {
      this.attempts = config.attempts;
    }
  }
  copy(attempts = this.attempts) {
    if (attempts > 1) {
      let remainingAttempts = attempts;
      const pending = this._clipboard.beginCopy(this.text);
      this._pending.add(pending);
      const attempt = () => {
        const successful = pending.copy();
        if (!successful && --remainingAttempts && !this._destroyed) {
          this._currentTimeout = this._ngZone.runOutsideAngular(() => setTimeout(attempt, 1));
        } else {
          this._currentTimeout = null;
          this._pending.delete(pending);
          pending.destroy();
          this.copied.emit(successful);
        }
      };
      attempt();
    } else {
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
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: CdkCopyToClipboard,
    deps: [],
    target: i0.ɵɵFactoryTarget.Directive
  });
  static ɵdir = i0.ɵɵngDeclareDirective({
    minVersion: "14.0.0",
    version: "21.0.3",
    type: CdkCopyToClipboard,
    isStandalone: true,
    selector: "[cdkCopyToClipboard]",
    inputs: {
      text: ["cdkCopyToClipboard", "text"],
      attempts: ["cdkCopyToClipboardAttempts", "attempts"]
    },
    outputs: {
      copied: "cdkCopyToClipboardCopied"
    },
    host: {
      listeners: {
        "click": "copy()"
      }
    },
    ngImport: i0
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: CdkCopyToClipboard,
  decorators: [{
    type: Directive,
    args: [{
      selector: '[cdkCopyToClipboard]',
      host: {
        '(click)': 'copy()'
      }
    }]
  }],
  ctorParameters: () => [],
  propDecorators: {
    text: [{
      type: Input,
      args: ['cdkCopyToClipboard']
    }],
    attempts: [{
      type: Input,
      args: ['cdkCopyToClipboardAttempts']
    }],
    copied: [{
      type: Output,
      args: ['cdkCopyToClipboardCopied']
    }]
  }
});

class ClipboardModule {
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: ClipboardModule,
    deps: [],
    target: i0.ɵɵFactoryTarget.NgModule
  });
  static ɵmod = i0.ɵɵngDeclareNgModule({
    minVersion: "14.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: ClipboardModule,
    imports: [CdkCopyToClipboard],
    exports: [CdkCopyToClipboard]
  });
  static ɵinj = i0.ɵɵngDeclareInjector({
    minVersion: "12.0.0",
    version: "21.0.3",
    ngImport: i0,
    type: ClipboardModule
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "21.0.3",
  ngImport: i0,
  type: ClipboardModule,
  decorators: [{
    type: NgModule,
    args: [{
      imports: [CdkCopyToClipboard],
      exports: [CdkCopyToClipboard]
    }]
  }]
});

export { CDK_COPY_TO_CLIPBOARD_CONFIG, CdkCopyToClipboard, Clipboard, ClipboardModule, PendingCopy };
//# sourceMappingURL=clipboard.mjs.map
