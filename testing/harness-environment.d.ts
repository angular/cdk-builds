/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AsyncFactoryFn, ComponentHarness, ComponentHarnessConstructor, HarnessLoader, HarnessPredicate, LocatorFactory } from './component-harness';
import { TestElement } from './test-element';
/**
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 */
export declare abstract class HarnessEnvironment<E> implements HarnessLoader, LocatorFactory {
    protected rawRootElement: E;
    rootElement: TestElement;
    protected constructor(rawRootElement: E);
    documentRootLocatorFactory(): LocatorFactory;
    locatorFor(selector: string): AsyncFactoryFn<TestElement>;
    locatorFor<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): AsyncFactoryFn<T>;
    locatorForOptional(selector: string): AsyncFactoryFn<TestElement | null>;
    locatorForOptional<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): AsyncFactoryFn<T | null>;
    locatorForAll(selector: string): AsyncFactoryFn<TestElement[]>;
    locatorForAll<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): AsyncFactoryFn<T[]>;
    getHarness<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): Promise<T>;
    getAllHarnesses<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): Promise<T[]>;
    getChildLoader(selector: string): Promise<HarnessLoader>;
    getAllChildLoaders(selector: string): Promise<HarnessLoader[]>;
    /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
    protected createComponentHarness<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>, element: E): T;
    abstract forceStabilize(): Promise<void>;
    /** Gets the root element for the document. */
    protected abstract getDocumentRoot(): E;
    /** Creates a `TestElement` from a raw element. */
    protected abstract createTestElement(element: E): TestElement;
    /** Creates a `HarnessLoader` rooted at the given raw element. */
    protected abstract createEnvironment(element: E): HarnessEnvironment<E>;
    /**
     * Gets a list of all elements matching the given selector under this environment's root element.
     */
    protected abstract getAllRawElements(selector: string): Promise<E[]>;
    private _getAllHarnesses;
    private _assertElementFound;
    private _assertHarnessFound;
}
