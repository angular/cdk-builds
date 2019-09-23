(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define('@angular/cdk/keycodes', ['exports'], factory) :
    (global = global || self, factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.keycodes = {})));
}(this, function (exports) { 'use strict';

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

    exports.MAC_ENTER = MAC_ENTER;
    exports.BACKSPACE = BACKSPACE;
    exports.TAB = TAB;
    exports.NUM_CENTER = NUM_CENTER;
    exports.ENTER = ENTER;
    exports.SHIFT = SHIFT;
    exports.CONTROL = CONTROL;
    exports.ALT = ALT;
    exports.PAUSE = PAUSE;
    exports.CAPS_LOCK = CAPS_LOCK;
    exports.ESCAPE = ESCAPE;
    exports.SPACE = SPACE;
    exports.PAGE_UP = PAGE_UP;
    exports.PAGE_DOWN = PAGE_DOWN;
    exports.END = END;
    exports.HOME = HOME;
    exports.LEFT_ARROW = LEFT_ARROW;
    exports.UP_ARROW = UP_ARROW;
    exports.RIGHT_ARROW = RIGHT_ARROW;
    exports.DOWN_ARROW = DOWN_ARROW;
    exports.PLUS_SIGN = PLUS_SIGN;
    exports.PRINT_SCREEN = PRINT_SCREEN;
    exports.INSERT = INSERT;
    exports.DELETE = DELETE;
    exports.ZERO = ZERO;
    exports.ONE = ONE;
    exports.TWO = TWO;
    exports.THREE = THREE;
    exports.FOUR = FOUR;
    exports.FIVE = FIVE;
    exports.SIX = SIX;
    exports.SEVEN = SEVEN;
    exports.EIGHT = EIGHT;
    exports.NINE = NINE;
    exports.FF_SEMICOLON = FF_SEMICOLON;
    exports.FF_EQUALS = FF_EQUALS;
    exports.QUESTION_MARK = QUESTION_MARK;
    exports.AT_SIGN = AT_SIGN;
    exports.A = A;
    exports.B = B;
    exports.C = C;
    exports.D = D;
    exports.E = E;
    exports.F = F;
    exports.G = G;
    exports.H = H;
    exports.I = I;
    exports.J = J;
    exports.K = K;
    exports.L = L;
    exports.M = M;
    exports.N = N;
    exports.O = O;
    exports.P = P;
    exports.Q = Q;
    exports.R = R;
    exports.S = S;
    exports.T = T;
    exports.U = U;
    exports.V = V;
    exports.W = W;
    exports.X = X;
    exports.Y = Y;
    exports.Z = Z;
    exports.META = META;
    exports.MAC_WK_CMD_LEFT = MAC_WK_CMD_LEFT;
    exports.MAC_WK_CMD_RIGHT = MAC_WK_CMD_RIGHT;
    exports.CONTEXT_MENU = CONTEXT_MENU;
    exports.NUMPAD_ZERO = NUMPAD_ZERO;
    exports.NUMPAD_ONE = NUMPAD_ONE;
    exports.NUMPAD_TWO = NUMPAD_TWO;
    exports.NUMPAD_THREE = NUMPAD_THREE;
    exports.NUMPAD_FOUR = NUMPAD_FOUR;
    exports.NUMPAD_FIVE = NUMPAD_FIVE;
    exports.NUMPAD_SIX = NUMPAD_SIX;
    exports.NUMPAD_SEVEN = NUMPAD_SEVEN;
    exports.NUMPAD_EIGHT = NUMPAD_EIGHT;
    exports.NUMPAD_NINE = NUMPAD_NINE;
    exports.NUMPAD_MULTIPLY = NUMPAD_MULTIPLY;
    exports.NUMPAD_PLUS = NUMPAD_PLUS;
    exports.NUMPAD_MINUS = NUMPAD_MINUS;
    exports.NUMPAD_PERIOD = NUMPAD_PERIOD;
    exports.NUMPAD_DIVIDE = NUMPAD_DIVIDE;
    exports.F1 = F1;
    exports.F2 = F2;
    exports.F3 = F3;
    exports.F4 = F4;
    exports.F5 = F5;
    exports.F6 = F6;
    exports.F7 = F7;
    exports.F8 = F8;
    exports.F9 = F9;
    exports.F10 = F10;
    exports.F11 = F11;
    exports.F12 = F12;
    exports.NUM_LOCK = NUM_LOCK;
    exports.SCROLL_LOCK = SCROLL_LOCK;
    exports.FIRST_MEDIA = FIRST_MEDIA;
    exports.FF_MINUS = FF_MINUS;
    exports.MUTE = MUTE;
    exports.VOLUME_DOWN = VOLUME_DOWN;
    exports.VOLUME_UP = VOLUME_UP;
    exports.FF_MUTE = FF_MUTE;
    exports.FF_VOLUME_DOWN = FF_VOLUME_DOWN;
    exports.LAST_MEDIA = LAST_MEDIA;
    exports.FF_VOLUME_UP = FF_VOLUME_UP;
    exports.SEMICOLON = SEMICOLON;
    exports.EQUALS = EQUALS;
    exports.COMMA = COMMA;
    exports.DASH = DASH;
    exports.SLASH = SLASH;
    exports.APOSTROPHE = APOSTROPHE;
    exports.TILDE = TILDE;
    exports.OPEN_SQUARE_BRACKET = OPEN_SQUARE_BRACKET;
    exports.BACKSLASH = BACKSLASH;
    exports.CLOSE_SQUARE_BRACKET = CLOSE_SQUARE_BRACKET;
    exports.SINGLE_QUOTE = SINGLE_QUOTE;
    exports.MAC_META = MAC_META;
    exports.hasModifierKey = hasModifierKey;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cdk-keycodes.umd.js.map
