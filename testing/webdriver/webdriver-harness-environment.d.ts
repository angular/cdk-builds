/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HarnessEnvironment, HarnessLoader, TestElement } from '@angular/cdk/testing';
import * as webdriver from 'selenium-webdriver';
/**
 * An Angular framework stabilizer function that takes a callback and calls it when the application
 * is stable, passing a boolean indicating if any work was done.
 */
declare interface FrameworkStabilizer {
    (callback: (didWork: boolean) => void): void;
}
declare global {
    interface Window {
        /**
         * These hooks are exposed by Angular to register a callback for when the application is stable
         * (no more pending tasks).
         *
         * For the implementation, see: https://github.com/
         *  angular/angular/blob/master/packages/platform-browser/src/browser/testability.ts#L30-L49
         */
        frameworkStabilizers: FrameworkStabilizer[];
    }
}
/** Options to configure the environment. */
export interface WebDriverHarnessEnvironmentOptions {
    /** The query function used to find DOM elements. */
    queryFn: (selector: string, root: () => webdriver.WebElement) => Promise<webdriver.WebElement[]>;
}
/** Waits for angular to be ready after the page load. */
export declare function waitForAngularReady(wd: webdriver.WebDriver): Promise<void>;
/** A `HarnessEnvironment` implementation for WebDriver. */
export declare class WebDriverHarnessEnvironment extends HarnessEnvironment<() => webdriver.WebElement> {
    /** The options for this environment. */
    private _options;
    protected constructor(rawRootElement: () => webdriver.WebElement, options?: WebDriverHarnessEnvironmentOptions);
    /** Gets the ElementFinder corresponding to the given TestElement. */
    static getNativeElement(el: TestElement): webdriver.WebElement;
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader(driver: webdriver.WebDriver, options?: WebDriverHarnessEnvironmentOptions): HarnessLoader;
    forceStabilize(): Promise<void>;
    waitForTasksOutsideAngular(): Promise<void>;
    protected getDocumentRoot(): () => webdriver.WebElement;
    protected createTestElement(element: () => webdriver.WebElement): TestElement;
    protected createEnvironment(element: () => webdriver.WebElement): HarnessEnvironment<() => webdriver.WebElement>;
    protected getAllRawElements(selector: string): Promise<(() => webdriver.WebElement)[]>;
}
export {};
