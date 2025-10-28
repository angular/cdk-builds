import { ConnectableObservable } from 'rxjs';

class DataSource {}
function isDataSource(value) {
  return value && typeof value.connect === 'function' && !(value instanceof ConnectableObservable);
}

export { DataSource, isDataSource };
//# sourceMappingURL=_data-source-chunk.mjs.map
