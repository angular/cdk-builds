/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/testing/event-objects" />
/** Modifier keys that may be held while typing. */
export interface ModifierKeys {
    control?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}
/**
 * Creates a browser MouseEvent with the specified options.
 * @docs-private
 */
export declare function createMouseEvent(type: string, x?: number, y?: number, button?: number): MouseEvent;
/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 * @docs-private
 */
export declare function createTouchEvent(type: string, pageX?: number, pageY?: number): UIEvent;
/**
 * Dispatches a keydown event from an element.
 * @docs-private
 */
export declare function createKeyboardEvent(type: string, keyCode?: number, key?: string, target?: Element, modifiers?: ModifierKeys): any;
/**
 * Creates a fake event object with any desired event type.
 * @docs-private
 */
export declare function createFakeEvent(type: string, canBubble?: boolean, cancelable?: boolean): Event;
