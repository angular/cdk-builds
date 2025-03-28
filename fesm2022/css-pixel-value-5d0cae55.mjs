/** Coerces a value to a CSS pixel value. */
function coerceCssPixelValue(value) {
    if (value == null) {
        return '';
    }
    return typeof value === 'string' ? value : `${value}px`;
}

export { coerceCssPixelValue as c };
//# sourceMappingURL=css-pixel-value-5d0cae55.mjs.map
