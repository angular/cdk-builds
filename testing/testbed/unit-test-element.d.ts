/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/testing/testbed/unit-test-element" />
import { ModifierKeys } from '@angular/cdk/testing';
import { TestElement, TestKey } from '../test-element';
import { ElementDimensions } from '../element-dimensions';
/** A `TestElement` implementation for unit tests. */
export declare class UnitTestElement implements TestElement {
    readonly element: Element;
    private _stabilize;
    constructor(element: Element, _stabilize: () => Promise<void>);
    blur(): Promise<void>;
    clear(): Promise<void>;
    click(relativeX?: number, relativeY?: number): Promise<void>;
    focus(): Promise<void>;
    getCssValue(property: string): Promise<string>;
    hover(): Promise<void>;
    sendKeys(...keys: (string | TestKey)[]): Promise<void>;
    sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>;
    text(): Promise<string>;
    getAttribute(name: string): Promise<string | null>;
    hasClass(name: string): Promise<boolean>;
    getDimensions(): Promise<ElementDimensions>;
    getProperty(name: string): Promise<any>;
    matchesSelector(selector: string): Promise<boolean>;
    forceStabilize(): Promise<void>;
}
