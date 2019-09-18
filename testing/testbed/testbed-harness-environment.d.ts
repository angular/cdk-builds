/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/testing/testbed/testbed-harness-environment" />
import { ComponentFixture } from '@angular/core/testing';
import { ComponentHarness, ComponentHarnessConstructor, HarnessLoader } from '../component-harness';
import { HarnessEnvironment } from '../harness-environment';
import { TestElement } from '../test-element';
/** A `HarnessEnvironment` implementation for Angular's Testbed. */
export declare class TestbedHarnessEnvironment extends HarnessEnvironment<Element> {
    private _fixture;
    private _destroyed;
    protected constructor(rawRootElement: Element, _fixture: ComponentFixture<unknown>);
    /** Creates a `HarnessLoader` rooted at the given fixture's root element. */
    static loader(fixture: ComponentFixture<unknown>): HarnessLoader;
    /**
     * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
     * located outside of a fixture (e.g. overlays appended to the document body).
     */
    static documentRootLoader(fixture: ComponentFixture<unknown>): HarnessLoader;
    /**
     * Creates an instance of the given harness type, using the fixture's root element as the
     * harness's host element. This method should be used when creating a harness for the root element
     * of a fixture, as components do not have the correct selector when they are created as the root
     * of the fixture.
     */
    static harnessForFixture<T extends ComponentHarness>(fixture: ComponentFixture<unknown>, harnessType: ComponentHarnessConstructor<T>): Promise<T>;
    protected getDocumentRoot(): Element;
    protected createTestElement(element: Element): TestElement;
    protected createEnvironment(element: Element): HarnessEnvironment<Element>;
    protected getAllRawElements(selector: string): Promise<Element[]>;
    private _stabilize;
}
