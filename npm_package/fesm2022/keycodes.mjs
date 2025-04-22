export { A, d as ALT, aX as APOSTROPHE, a1 as AT_SIGN, a2 as B, a_ as BACKSLASH, B as BACKSPACE, a3 as C, y as CAPS_LOCK, a$ as CLOSE_SQUARE_BRACKET, u as COMMA, as as CONTEXT_MENU, C as CONTROL, a4 as D, aV as DASH, i as DELETE, D as DOWN_ARROW, a5 as E, Y as EIGHT, E as END, c as ENTER, aU as EQUALS, g as ESCAPE, a6 as F, F as F1, r as F10, s as F11, t as F12, j as F2, k as F3, l as F4, m as F5, n as F6, o as F7, p as F8, q as F9, $ as FF_EQUALS, aL as FF_MINUS, aP as FF_MUTE, _ as FF_SEMICOLON, aQ as FF_VOLUME_DOWN, aS as FF_VOLUME_UP, aK as FIRST_MEDIA, V as FIVE, Q as FOUR, a7 as G, a8 as H, H as HOME, a9 as I, I as INSERT, aa as J, ab as K, ac as L, aR as LAST_MEDIA, L as LEFT_ARROW, ad as M, v as MAC_ENTER, M as MAC_META, aq as MAC_WK_CMD_LEFT, ar as MAC_WK_CMD_RIGHT, e as META, aM as MUTE, ae as N, N as NINE, aH as NUMPAD_DIVIDE, aB as NUMPAD_EIGHT, ay as NUMPAD_FIVE, ax as NUMPAD_FOUR, aF as NUMPAD_MINUS, aD as NUMPAD_MULTIPLY, aC as NUMPAD_NINE, au as NUMPAD_ONE, aG as NUMPAD_PERIOD, aE as NUMPAD_PLUS, aA as NUMPAD_SEVEN, az as NUMPAD_SIX, aw as NUMPAD_THREE, av as NUMPAD_TWO, at as NUMPAD_ZERO, w as NUM_CENTER, aI as NUM_LOCK, af as O, O as ONE, aZ as OPEN_SQUARE_BRACKET, ag as P, P as PAGE_DOWN, a as PAGE_UP, x as PAUSE, h as PERIOD, z as PLUS_SIGN, G as PRINT_SCREEN, ah as Q, a0 as QUESTION_MARK, ai as R, R as RIGHT_ARROW, aj as S, aJ as SCROLL_LOCK, aT as SEMICOLON, X as SEVEN, f as SHIFT, b0 as SINGLE_QUOTE, W as SIX, aW as SLASH, S as SPACE, ak as T, T as TAB, K as THREE, aY as TILDE, J as TWO, al as U, U as UP_ARROW, am as V, aN as VOLUME_DOWN, aO as VOLUME_UP, an as W, ao as X, ap as Y, Z, b as ZERO } from './keycodes-CpHkExLC.mjs';

/**
 * Checks whether a modifier key is pressed.
 * @param event Event to be checked.
 */
function hasModifierKey(event, ...modifiers) {
    if (modifiers.length) {
        return modifiers.some(modifier => event[modifier]);
    }
    return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
}

export { hasModifierKey };
//# sourceMappingURL=keycodes.mjs.map
