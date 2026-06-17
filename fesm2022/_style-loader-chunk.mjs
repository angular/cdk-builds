import * as i0 from '@angular/core';
import { inject, Injector, EnvironmentInjector, ApplicationRef, createComponent, Service } from '@angular/core';

const appsWithLoaders = new WeakMap();
class _CdkPrivateStyleLoader {
  _appRef;
  _injector = inject(Injector);
  _environmentInjector = inject(EnvironmentInjector);
  load(loader) {
    const appRef = this._appRef = this._appRef || this._injector.get(ApplicationRef);
    let data = appsWithLoaders.get(appRef);
    if (!data) {
      data = {
        loaders: new Set(),
        refs: []
      };
      appsWithLoaders.set(appRef, data);
      appRef.onDestroy(() => {
        appsWithLoaders.get(appRef)?.refs.forEach(ref => ref.destroy());
        appsWithLoaders.delete(appRef);
      });
    }
    if (!data.loaders.has(loader)) {
      data.loaders.add(loader);
      data.refs.push(createComponent(loader, {
        environmentInjector: this._environmentInjector
      }));
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "22.0.2",
    ngImport: i0,
    type: _CdkPrivateStyleLoader,
    deps: [],
    target: i0.ɵɵFactoryTarget.Service
  });
  static ɵprov = i0.ɵɵngDeclareService({
    minVersion: "22.0.0",
    version: "22.0.2",
    ngImport: i0,
    type: _CdkPrivateStyleLoader
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "22.0.2",
  ngImport: i0,
  type: _CdkPrivateStyleLoader,
  decorators: [{
    type: Service
  }]
});

export { _CdkPrivateStyleLoader };
//# sourceMappingURL=_style-loader-chunk.mjs.map
