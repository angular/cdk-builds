/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var MAC_ENTER = 3;
var BACKSPACE = 8;
var TAB = 9;
var NUM_CENTER = 12;
var ENTER = 13;
var SHIFT = 16;
var CONTROL = 17;
var ALT = 18;
var PAUSE = 19;
var CAPS_LOCK = 20;
var ESCAPE = 27;
var SPACE = 32;
var PAGE_UP = 33;
var PAGE_DOWN = 34;
var END = 35;
var HOME = 36;
var LEFT_ARROW = 37;
var UP_ARROW = 38;
var RIGHT_ARROW = 39;
var DOWN_ARROW = 40;
var PLUS_SIGN = 43;
var PRINT_SCREEN = 44;
var INSERT = 45;
var DELETE = 46;
var ZERO = 48;
var ONE = 49;
var TWO = 50;
var THREE = 51;
var FOUR = 52;
var FIVE = 53;
var SIX = 54;
var SEVEN = 55;
var EIGHT = 56;
var NINE = 57;
var FF_SEMICOLON = 59; // Firefox (Gecko) fires this for semicolon instead of 186
var FF_EQUALS = 61; // Firefox (Gecko) fires this for equals instead of 187
var QUESTION_MARK = 63;
var AT_SIGN = 64;
var A = 65;
var B = 66;
var C = 67;
var D = 68;
var E = 69;
var F = 70;
var G = 71;
var H = 72;
var I = 73;
var J = 74;
var K = 75;
var L = 76;
var M = 77;
var N = 78;
var O = 79;
var P = 80;
var Q = 81;
var R = 82;
var S = 83;
var T = 84;
var U = 85;
var V = 86;
var W = 87;
var X = 88;
var Y = 89;
var Z = 90;
var META = 91; // WIN_KEY_LEFT
var MAC_WK_CMD_LEFT = 91;
var MAC_WK_CMD_RIGHT = 93;
var CONTEXT_MENU = 93;
var NUMPAD_ZERO = 96;
var NUMPAD_ONE = 97;
var NUMPAD_TWO = 98;
var NUMPAD_THREE = 99;
var NUMPAD_FOUR = 100;
var NUMPAD_FIVE = 101;
var NUMPAD_SIX = 102;
var NUMPAD_SEVEN = 103;
var NUMPAD_EIGHT = 104;
var NUMPAD_NINE = 105;
var NUMPAD_MULTIPLY = 106;
var NUMPAD_PLUS = 107;
var NUMPAD_MINUS = 109;
var NUMPAD_PERIOD = 110;
var NUMPAD_DIVIDE = 111;
var F1 = 112;
var F2 = 113;
var F3 = 114;
var F4 = 115;
var F5 = 116;
var F6 = 117;
var F7 = 118;
var F8 = 119;
var F9 = 120;
var F10 = 121;
var F11 = 122;
var F12 = 123;
var NUM_LOCK = 144;
var SCROLL_LOCK = 145;
var FIRST_MEDIA = 166;
var FF_MINUS = 173;
var MUTE = 173; // Firefox (Gecko) fires 181 for MUTE
var VOLUME_DOWN = 174; // Firefox (Gecko) fires 182 for VOLUME_DOWN
var VOLUME_UP = 175; // Firefox (Gecko) fires 183 for VOLUME_UP
var FF_MUTE = 181;
var FF_VOLUME_DOWN = 182;
var LAST_MEDIA = 183;
var FF_VOLUME_UP = 183;
var SEMICOLON = 186; // Firefox (Gecko) fires 59 for SEMICOLON
var EQUALS = 187; // Firefox (Gecko) fires 61 for EQUALS
var COMMA = 188;
var DASH = 189; // Firefox (Gecko) fires 173 for DASH/MINUS
var SLASH = 191;
var APOSTROPHE = 192;
var TILDE = 192;
var OPEN_SQUARE_BRACKET = 219;
var BACKSLASH = 220;
var CLOSE_SQUARE_BRACKET = 221;
var SINGLE_QUOTE = 222;
var MAC_META = 224;

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Checks whether a modifier key is pressed.
 * @param event Event to be checked.
 */
function hasModifierKey(event) {
    var modifiers = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        modifiers[_i - 1] = arguments[_i];
    }
    if (modifiers.length) {
        return modifiers.some(function (modifier) { return event[modifier]; });
    }
    return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export { MAC_ENTER, BACKSPACE, TAB, NUM_CENTER, ENTER, SHIFT, CONTROL, ALT, PAUSE, CAPS_LOCK, ESCAPE, SPACE, PAGE_UP, PAGE_DOWN, END, HOME, LEFT_ARROW, UP_ARROW, RIGHT_ARROW, DOWN_ARROW, PLUS_SIGN, PRINT_SCREEN, INSERT, DELETE, ZERO, ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, FF_SEMICOLON, FF_EQUALS, QUESTION_MARK, AT_SIGN, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, META, MAC_WK_CMD_LEFT, MAC_WK_CMD_RIGHT, CONTEXT_MENU, NUMPAD_ZERO, NUMPAD_ONE, NUMPAD_TWO, NUMPAD_THREE, NUMPAD_FOUR, NUMPAD_FIVE, NUMPAD_SIX, NUMPAD_SEVEN, NUMPAD_EIGHT, NUMPAD_NINE, NUMPAD_MULTIPLY, NUMPAD_PLUS, NUMPAD_MINUS, NUMPAD_PERIOD, NUMPAD_DIVIDE, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, NUM_LOCK, SCROLL_LOCK, FIRST_MEDIA, FF_MINUS, MUTE, VOLUME_DOWN, VOLUME_UP, FF_MUTE, FF_VOLUME_DOWN, LAST_MEDIA, FF_VOLUME_UP, SEMICOLON, EQUALS, COMMA, DASH, SLASH, APOSTROPHE, TILDE, OPEN_SQUARE_BRACKET, BACKSLASH, CLOSE_SQUARE_BRACKET, SINGLE_QUOTE, MAC_META, hasModifierKey };
//# sourceMappingURL=keycodes.js.map
