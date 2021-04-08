/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementDimensions, EventData, ModifierKeys, TestElement, TestKey, TextOptions } from '@angular/cdk/testing';
import * as webdriver from 'selenium-webdriver';
/** A `TestElement` implementation for WebDriver. */
export declare class WebDriverElement implements TestElement {
    readonly element: () => webdriver.WebElement;
    private _stabilize;
    constructor(element: () => webdriver.WebElement, _stabilize: () => Promise<void>);
    blur(): Promise<void>;
    clear(): Promise<void>;
    click(...args: [ModifierKeys?] | ['center', ModifierKeys?] | [
        number,
        number,
        ModifierKeys?
    ]): Promise<void>;
    rightClick(...args: [ModifierKeys?] | ['center', ModifierKeys?] | [
        number,
        number,
        ModifierKeys?
    ]): Promise<void>;
    focus(): Promise<void>;
    getCssValue(property: string): Promise<string>;
    hover(): Promise<void>;
    mouseAway(): Promise<void>;
    sendKeys(...keys: (string | TestKey)[]): Promise<void>;
    sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>;
    text(options?: TextOptions): Promise<string>;
    getAttribute(name: string): Promise<string | null>;
    hasClass(name: string): Promise<boolean>;
    getDimensions(): Promise<ElementDimensions>;
    getProperty(name: string): Promise<any>;
    setInputValue(newValue: string): Promise<void>;
    selectOptions(...optionIndexes: number[]): Promise<void>;
    matchesSelector(selector: string): Promise<boolean>;
    isFocused(): Promise<boolean>;
    dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void>;
    /** Gets the webdriver action sequence. */
    private _actions;
    /** Executes a function in the browser. */
    private _executeScript;
    /** Dispatches all the events that are part of a click event sequence. */
    private _dispatchClickEventSequence;
}
