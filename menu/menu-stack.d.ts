/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
/** The relative item in the inline menu to focus after closing all popup menus. */
export declare const enum FocusNext {
    nextItem = 0,
    previousItem = 1,
    currentItem = 2
}
/** A single item (menu) in the menu stack. */
export interface MenuStackItem {
    /** A reference to the menu stack this menu stack item belongs to. */
    menuStack?: MenuStack;
}
/** Injection token used for an implementation of MenuStack. */
export declare const MENU_STACK: InjectionToken<MenuStack>;
/** Provider that provides the parent menu stack, or a new menu stack if there is no parent one. */
export declare const PARENT_OR_NEW_MENU_STACK_PROVIDER: {
    provide: InjectionToken<MenuStack>;
    deps: Optional[][];
    useFactory: (parentMenuStack?: MenuStack | undefined) => MenuStack;
};
/** Provider that provides the parent menu stack, or a new inline menu stack if there is no parent one. */
export declare const PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER: (orientation: 'vertical' | 'horizontal') => {
    provide: InjectionToken<MenuStack>;
    deps: Optional[][];
    useFactory: (parentMenuStack?: MenuStack | undefined) => MenuStack;
};
/** Options that can be provided to the close or closeAll methods. */
export interface CloseOptions {
    /** The element to focus next if the close operation causes the menu stack to become empty. */
    focusNextOnEmpty?: FocusNext;
    /** Whether to focus the parent trigger after closing the menu. */
    focusParentTrigger?: boolean;
}
/** Event dispatched when a menu is closed. */
export interface MenuStackCloseEvent {
    /** The menu being closed. */
    item: MenuStackItem;
    /** Whether to focus the parent trigger after closing the menu. */
    focusParentTrigger?: boolean;
}
/**
 * MenuStack allows subscribers to listen for close events (when a MenuStackItem is popped off
 * of the stack) in order to perform closing actions. Upon the MenuStack being empty it emits
 * from the `empty` observable specifying the next focus action which the listener should perform
 * as requested by the closer.
 */
export declare class MenuStack {
    /** The ID of this menu stack. */
    readonly id: string;
    /** All MenuStackItems tracked by this MenuStack. */
    private readonly _elements;
    /** Emits the element which was popped off of the stack when requested by a closer. */
    private readonly _close;
    /** Emits once the MenuStack has become empty after popping off elements. */
    private readonly _empty;
    /** Emits whether any menu in the menu stack has focus. */
    private readonly _hasFocus;
    /** Observable which emits the MenuStackItem which has been requested to close. */
    readonly closed: Observable<MenuStackCloseEvent>;
    /** Observable which emits whether any menu in the menu stack has focus. */
    readonly hasFocus: Observable<boolean>;
    /**
     * Observable which emits when the MenuStack is empty after popping off the last element. It
     * emits a FocusNext event which specifies the action the closer has requested the listener
     * perform.
     */
    readonly emptied: Observable<FocusNext | undefined>;
    /**
     * Whether the inline menu associated with this menu stack is vertical or horizontal.
     * `null` indicates there is no inline menu associated with this menu stack.
     */
    private _inlineMenuOrientation;
    /** Creates a menu stack that originates from an inline menu. */
    static inline(orientation: 'vertical' | 'horizontal'): MenuStack;
    /**
     * Adds an item to the menu stack.
     * @param menu the MenuStackItem to put on the stack.
     */
    push(menu: MenuStackItem): void;
    /**
     * Pop items off of the stack up to and including `lastItem` and emit each on the close
     * observable. If the stack is empty or `lastItem` is not on the stack it does nothing.
     * @param lastItem the last item to pop off the stack.
     * @param options Options that configure behavior on close.
     */
    close(lastItem: MenuStackItem, options?: CloseOptions): void;
    /**
     * Pop items off of the stack up to but excluding `lastItem` and emit each on the close
     * observable. If the stack is empty or `lastItem` is not on the stack it does nothing.
     * @param lastItem the element which should be left on the stack
     * @return whether or not an item was removed from the stack
     */
    closeSubMenuOf(lastItem: MenuStackItem): boolean;
    /**
     * Pop off all MenuStackItems and emit each one on the `close` observable one by one.
     * @param options Options that configure behavior on close.
     */
    closeAll(options?: CloseOptions): void;
    /** Return true if this stack is empty. */
    isEmpty(): boolean;
    /** Return the length of the stack. */
    length(): number;
    /** Get the top most element on the stack. */
    peek(): MenuStackItem | undefined;
    /** Whether the menu stack is associated with an inline menu. */
    hasInlineMenu(): boolean;
    /** The orientation of the associated inline menu. */
    inlineMenuOrientation(): "vertical" | "horizontal" | null;
    /** Sets whether the menu stack contains the focused element. */
    setHasFocus(hasFocus: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MenuStack, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MenuStack>;
}
