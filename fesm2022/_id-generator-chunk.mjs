import * as i0 from '@angular/core';
import { inject, APP_ID, Service } from '@angular/core';

const counters = {};
class _IdGenerator {
  _appId = inject(APP_ID);
  static _infix = `a${Math.floor(Math.random() * 100000).toString()}`;
  getId(prefix, randomize = false) {
    if (this._appId !== 'ng') {
      prefix += this._appId;
    }
    if (!counters.hasOwnProperty(prefix)) {
      counters[prefix] = 0;
    }
    return `${prefix}${randomize ? _IdGenerator._infix + '-' : ''}${counters[prefix]++}`;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "22.0.0-rc.2",
    ngImport: i0,
    type: _IdGenerator,
    deps: [],
    target: i0.ɵɵFactoryTarget.Service
  });
  static ɵprov = i0.ɵɵngDeclareService({
    minVersion: "22.0.0",
    version: "22.0.0-rc.2",
    ngImport: i0,
    type: _IdGenerator
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "22.0.0-rc.2",
  ngImport: i0,
  type: _IdGenerator,
  decorators: [{
    type: Service
  }]
});

export { _IdGenerator };
//# sourceMappingURL=_id-generator-chunk.mjs.map
