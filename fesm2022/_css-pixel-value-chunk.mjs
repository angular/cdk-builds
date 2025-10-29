function coerceCssPixelValue(value) {
  if (value == null) {
    return '';
  }
  return typeof value === 'string' ? value : `${value}px`;
}

export { coerceCssPixelValue };
//# sourceMappingURL=_css-pixel-value-chunk.mjs.map
