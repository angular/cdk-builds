export { o as clearElement, k as createFakeEvent, j as createKeyboardEvent, g as createMouseEvent, h as createPointerEvent, i as createTouchEvent, d as dispatchEvent, a as dispatchFakeEvent, b as dispatchKeyboardEvent, c as dispatchMouseEvent, e as dispatchPointerEvent, f as dispatchTouchEvent, m as isTextInput, p as patchElementFocus, l as triggerBlur, t as triggerFocus, n as typeInElement } from '../type-in-element-de7fd3bb.mjs';
import '../test-element-errors-83375db9.mjs';
import '../keycodes-0e4398c6.mjs';

/**
 * Template string function that can be used to dedent a given string
 * literal. The smallest common indentation will be omitted.
 */
function dedent(strings, ...values) {
    let joinedString = '';
    for (let i = 0; i < values.length; i++) {
        joinedString += `${strings[i]}${values[i]}`;
    }
    joinedString += strings[strings.length - 1];
    const matches = joinedString.match(/^[ \t]*(?=\S)/gm);
    if (matches === null) {
        return joinedString;
    }
    const minLineIndent = Math.min(...matches.map(el => el.length));
    const omitMinIndentRegex = new RegExp(`^[ \\t]{${minLineIndent}}`, 'gm');
    return minLineIndent > 0 ? joinedString.replace(omitMinIndentRegex, '') : joinedString;
}

/**
 * Gets a RegExp used to detect an angular wrapped error message.
 * See https://github.com/angular/angular/issues/8348
 */
function wrappedErrorMessage(e) {
    const escapedMessage = e.message.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    return new RegExp(escapedMessage);
}

export { dedent, wrappedErrorMessage };
//# sourceMappingURL=private.mjs.map
