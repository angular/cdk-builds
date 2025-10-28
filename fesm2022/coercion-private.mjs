import { isObservable, of } from 'rxjs';

function coerceObservable(data) {
  if (!isObservable(data)) {
    return of(data);
  }
  return data;
}

export { coerceObservable };
//# sourceMappingURL=coercion-private.mjs.map
