export { _isNumberValue, coerceElement, coerceNumberProperty } from './_element-chunk.mjs';
export { coerceArray } from './_array-chunk.mjs';
export { coerceCssPixelValue } from './_css-pixel-value-chunk.mjs';
import '@angular/core';

function coerceBooleanProperty(value) {
  return value != null && `${value}` !== 'false';
}

function coerceStringArray(value, separator = /\s+/) {
  const result = [];
  if (value != null) {
    const sourceValues = Array.isArray(value) ? value : `${value}`.split(separator);
    for (const sourceValue of sourceValues) {
      const trimmedString = `${sourceValue}`.trim();
      if (trimmedString) {
        result.push(trimmedString);
      }
    }
  }
  return result;
}

export { coerceBooleanProperty, coerceStringArray };
//# sourceMappingURL=coercion.mjs.map
