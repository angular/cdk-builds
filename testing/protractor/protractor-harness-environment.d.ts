/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HarnessEnvironment, HarnessLoader, TestElement } from '@angular/cdk/testing';
import { ElementFinder } from 'protractor';
/** A `HarnessEnvironment` implementation for Protractor. */
export declare class ProtractorHarnessEnvironment extends HarnessEnvironment<ElementFinder> {
    protected constructor(rawRootElement: ElementFinder);
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader(): HarnessLoader;
    forceStabilize(): Promise<void>;
    waitForTasksOutsideAngular(): Promise<void>;
    protected getDocumentRoot(): ElementFinder;
    protected createTestElement(element: ElementFinder): TestElement;
    protected createEnvironment(element: ElementFinder): HarnessEnvironment<ElementFinder>;
    protected getAllRawElements(selector: string): Promise<ElementFinder[]>;
}
