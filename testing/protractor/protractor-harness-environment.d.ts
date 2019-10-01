/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/testing/protractor/protractor-harness-environment" />
import { ElementFinder } from 'protractor';
import { HarnessLoader } from '../component-harness';
import { HarnessEnvironment } from '../harness-environment';
import { TestElement } from '../test-element';
/** A `HarnessEnvironment` implementation for Protractor. */
export declare class ProtractorHarnessEnvironment extends HarnessEnvironment<ElementFinder> {
    protected constructor(rawRootElement: ElementFinder);
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader(): HarnessLoader;
    protected getDocumentRoot(): ElementFinder;
    protected createTestElement(element: ElementFinder): TestElement;
    protected createEnvironment(element: ElementFinder): HarnessEnvironment<ElementFinder>;
    protected getAllRawElements(selector: string): Promise<ElementFinder[]>;
}
