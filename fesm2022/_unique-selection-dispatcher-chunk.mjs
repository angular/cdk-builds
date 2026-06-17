import * as i0 from '@angular/core';
import { Service } from '@angular/core';

class UniqueSelectionDispatcher {
  _listeners = [];
  notify(id, name) {
    for (let listener of this._listeners) {
      listener(id, name);
    }
  }
  listen(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(registered => {
        return listener !== registered;
      });
    };
  }
  ngOnDestroy() {
    this._listeners = [];
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "22.0.2",
    ngImport: i0,
    type: UniqueSelectionDispatcher,
    deps: [],
    target: i0.ɵɵFactoryTarget.Service
  });
  static ɵprov = i0.ɵɵngDeclareService({
    minVersion: "22.0.0",
    version: "22.0.2",
    ngImport: i0,
    type: UniqueSelectionDispatcher
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "22.0.2",
  ngImport: i0,
  type: UniqueSelectionDispatcher,
  decorators: [{
    type: Service
  }]
});

export { UniqueSelectionDispatcher };
//# sourceMappingURL=_unique-selection-dispatcher-chunk.mjs.map
