/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, QueryList } from '@angular/core';
import { Observable } from 'rxjs';
/** Item to track for mouse focus events. */
export interface FocusableElement {
    /** A reference to the element to be tracked. */
    _elementRef: ElementRef<HTMLElement>;
}
/**
 * PointerFocusTracker keeps track of the currently active item under mouse focus. It also has
 * observables which emit when the users mouse enters and leaves a tracked element.
 */
export declare class PointerFocusTracker<T extends FocusableElement> {
    /** The list of items being tracked. */
    private readonly _items;
    /** Emits when an element is moused into. */
    readonly entered: Observable<T>;
    /** Emits when an element is moused out. */
    readonly exited: Observable<T>;
    /** The element currently under mouse focus. */
    activeElement?: T;
    /** The element previously under mouse focus. */
    previousElement?: T;
    /** Emits when this is destroyed. */
    private readonly _destroyed;
    constructor(
    /** The list of items being tracked. */
    _items: QueryList<T>);
    /** Stop the managers listeners. */
    destroy(): void;
    /**
     * Gets a stream of pointer (mouse) entries into the given items.
     * This should typically run outside the Angular zone.
     */
    private _getItemPointerEntries;
    /**
     * Gets a stream of pointer (mouse) exits out of the given items.
     * This should typically run outside the Angular zone.
     */
    private _getItemPointerExits;
}
