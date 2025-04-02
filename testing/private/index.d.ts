import { M as ModifierKeys } from '../../test-element.d-7723af18.js';

/**
 * Template string function that can be used to dedent a given string
 * literal. The smallest common indentation will be omitted.
 */
declare function dedent(strings: TemplateStringsArray, ...values: any[]): string;

/**
 * Gets a RegExp used to detect an angular wrapped error message.
 * See https://github.com/angular/angular/issues/8348
 */
declare function wrappedErrorMessage(e: Error): RegExp;

/**
 * Utility to dispatch any event on a Node.
 * @docs-private
 */
declare function dispatchEvent<T extends Event>(node: Node | Window, event: T): T;
/**
 * Shorthand to dispatch a fake event on a specified node.
 * @docs-private
 */
declare function dispatchFakeEvent(node: Node | Window, type: string, bubbles?: boolean): Event;
/**
 * Shorthand to dispatch a keyboard event with a specified key code and
 * optional modifiers.
 * @docs-private
 */
declare function dispatchKeyboardEvent(node: Node, type: string, keyCode?: number, key?: string, modifiers?: ModifierKeys, code?: string): KeyboardEvent;
/**
 * Shorthand to dispatch a mouse event on the specified coordinates.
 * @docs-private
 */
declare function dispatchMouseEvent(node: Node, type: string, clientX?: number, clientY?: number, offsetX?: number, offsetY?: number, button?: number, modifiers?: ModifierKeys): MouseEvent;
/**
 * Shorthand to dispatch a pointer event on the specified coordinates.
 * @docs-private
 */
declare function dispatchPointerEvent(node: Node, type: string, clientX?: number, clientY?: number, offsetX?: number, offsetY?: number, options?: PointerEventInit): PointerEvent;
/**
 * Shorthand to dispatch a touch event on the specified coordinates.
 * @docs-private
 */
declare function dispatchTouchEvent(node: Node, type: string, pageX?: number, pageY?: number, clientX?: number, clientY?: number): UIEvent;

/**
 * Creates a browser MouseEvent with the specified options.
 * @docs-private
 */
declare function createMouseEvent(type: string, clientX?: number, clientY?: number, offsetX?: number, offsetY?: number, button?: number, modifiers?: ModifierKeys): MouseEvent;
/**
 * Creates a browser `PointerEvent` with the specified options. Pointer events
 * by default will appear as if they are the primary pointer of their type.
 * https://www.w3.org/TR/pointerevents2/#dom-pointerevent-isprimary.
 *
 * For example, if pointer events for a multi-touch interaction are created, the non-primary
 * pointer touches would need to be represented by non-primary pointer events.
 *
 * @docs-private
 */
declare function createPointerEvent(type: string, clientX?: number, clientY?: number, offsetX?: number, offsetY?: number, options?: PointerEventInit): PointerEvent;
/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 * @docs-private
 */
declare function createTouchEvent(type: string, pageX?: number, pageY?: number, clientX?: number, clientY?: number): UIEvent;
/**
 * Creates a keyboard event with the specified key and modifiers.
 * @docs-private
 */
declare function createKeyboardEvent(type: string, keyCode?: number, key?: string, modifiers?: ModifierKeys, code?: string): KeyboardEvent;
/**
 * Creates a fake event object with any desired event type.
 * @docs-private
 */
declare function createFakeEvent(type: string, bubbles?: boolean, cancelable?: boolean, composed?: boolean): Event;

/**
 * Patches an elements focus and blur methods to emit events consistently and predictably.
 * This is necessary, because some browsers can call the focus handlers asynchronously,
 * while others won't fire them at all if the browser window is not focused.
 * @docs-private
 */
declare function patchElementFocus(element: HTMLElement): void;
/** @docs-private */
declare function triggerFocus(element: HTMLElement): void;
/** @docs-private */
declare function triggerBlur(element: HTMLElement): void;

/**
 * Checks whether the given Element is a text input element.
 * @docs-private
 */
declare function isTextInput(element: Element): element is HTMLInputElement | HTMLTextAreaElement;
/**
 * If keys have been specified, focuses an input, sets its value and dispatches
 * the `input` event, simulating the user typing.
 * @param element Element onto which to set the value.
 * @param keys The keys to send to the element.
 * @docs-private
 */
declare function typeInElement(element: HTMLElement, ...keys: (string | {
    keyCode?: number;
    key?: string;
})[]): void;
/**
 * If keys have been specified, focuses an input, sets its value and dispatches
 * the `input` event, simulating the user typing.
 * @param element Element onto which to set the value.
 * @param modifiers Modifier keys that are held while typing.
 * @param keys The keys to send to the element.
 * @docs-private
 */
declare function typeInElement(element: HTMLElement, modifiers: ModifierKeys, ...keys: (string | {
    keyCode?: number;
    key?: string;
})[]): void;
/**
 * Clears the text in an input or textarea element.
 * @docs-private
 */
declare function clearElement(element: HTMLInputElement | HTMLTextAreaElement): void;

export { clearElement, createFakeEvent, createKeyboardEvent, createMouseEvent, createPointerEvent, createTouchEvent, dedent, dispatchEvent, dispatchFakeEvent, dispatchKeyboardEvent, dispatchMouseEvent, dispatchPointerEvent, dispatchTouchEvent, isTextInput, patchElementFocus, triggerBlur, triggerFocus, typeInElement, wrappedErrorMessage };
