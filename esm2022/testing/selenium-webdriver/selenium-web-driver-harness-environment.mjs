/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HarnessEnvironment } from '@angular/cdk/testing';
import * as webdriver from 'selenium-webdriver';
import { SeleniumWebDriverElement } from './selenium-web-driver-element';
/** The default environment options. */
const defaultEnvironmentOptions = {
    queryFn: async (selector, root) => root().findElements(webdriver.By.css(selector)),
};
/**
 * This function is meant to be executed in the browser. It taps into the hooks exposed by Angular
 * and invokes the specified `callback` when the application is stable (no more pending tasks).
 */
function whenStable(callback) {
    Promise.all(window.frameworkStabilizers.map(stabilizer => new Promise(stabilizer))).then(callback);
}
/**
 * This function is meant to be executed in the browser. It checks whether the Angular framework has
 * bootstrapped yet.
 */
function isBootstrapped() {
    return !!window.frameworkStabilizers;
}
/** Waits for angular to be ready after the page load. */
export async function waitForAngularReady(wd) {
    await wd.wait(() => wd.executeScript(isBootstrapped));
    await wd.executeAsyncScript(whenStable);
}
/** A `HarnessEnvironment` implementation for WebDriver. */
export class SeleniumWebDriverHarnessEnvironment extends HarnessEnvironment {
    constructor(rawRootElement, options) {
        super(rawRootElement);
        this._options = { ...defaultEnvironmentOptions, ...options };
        this._stabilizeCallback = () => this.forceStabilize();
    }
    /** Gets the ElementFinder corresponding to the given TestElement. */
    static getNativeElement(el) {
        if (el instanceof SeleniumWebDriverElement) {
            return el.element();
        }
        throw Error('This TestElement was not created by the WebDriverHarnessEnvironment');
    }
    /** Creates a `HarnessLoader` rooted at the document root. */
    static loader(driver, options) {
        return new SeleniumWebDriverHarnessEnvironment(() => driver.findElement(webdriver.By.css('body')), options);
    }
    /**
     * Flushes change detection and async tasks captured in the Angular zone.
     * In most cases it should not be necessary to call this manually. However, there may be some edge
     * cases where it is needed to fully flush animation events.
     */
    async forceStabilize() {
        await this.rawRootElement().getDriver().executeAsyncScript(whenStable);
    }
    /** @docs-private */
    async waitForTasksOutsideAngular() {
        // TODO: figure out how we can do this for the webdriver environment.
        //  https://github.com/angular/components/issues/17412
    }
    /** Gets the root element for the document. */
    getDocumentRoot() {
        return () => this.rawRootElement().getDriver().findElement(webdriver.By.css('body'));
    }
    /** Creates a `TestElement` from a raw element. */
    createTestElement(element) {
        return new SeleniumWebDriverElement(element, this._stabilizeCallback);
    }
    /** Creates a `HarnessLoader` rooted at the given raw element. */
    createEnvironment(element) {
        return new SeleniumWebDriverHarnessEnvironment(element, this._options);
    }
    // Note: This seems to be working, though we may need to re-evaluate if we encounter issues with
    // stale element references. `() => Promise<webdriver.WebElement[]>` seems like a more correct
    // return type, though supporting it would require changes to the public harness API.
    /**
     * Gets a list of all elements matching the given selector under this environment's root element.
     */
    async getAllRawElements(selector) {
        const els = await this._options.queryFn(selector, this.rawRootElement);
        return els.map((x) => () => x);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZW5pdW0td2ViLWRyaXZlci1oYXJuZXNzLWVudmlyb25tZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay90ZXN0aW5nL3NlbGVuaXVtLXdlYmRyaXZlci9zZWxlbml1bS13ZWItZHJpdmVyLWhhcm5lc3MtZW52aXJvbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGtCQUFrQixFQUE2QixNQUFNLHNCQUFzQixDQUFDO0FBQ3BGLE9BQU8sS0FBSyxTQUFTLE1BQU0sb0JBQW9CLENBQUM7QUFDaEQsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUE2QnZFLHVDQUF1QztBQUN2QyxNQUFNLHlCQUF5QixHQUF1QztJQUNwRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQWdCLEVBQUUsSUFBZ0MsRUFBRSxFQUFFLENBQ3BFLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztDQUNsRCxDQUFDO0FBRUY7OztHQUdHO0FBQ0gsU0FBUyxVQUFVLENBQUMsUUFBc0M7SUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDdEYsUUFBUSxDQUNULENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjO0lBQ3JCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztBQUN2QyxDQUFDO0FBRUQseURBQXlEO0FBQ3pELE1BQU0sQ0FBQyxLQUFLLFVBQVUsbUJBQW1CLENBQUMsRUFBdUI7SUFDL0QsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUN0RCxNQUFNLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBRUQsMkRBQTJEO0FBQzNELE1BQU0sT0FBTyxtQ0FBb0MsU0FBUSxrQkFFeEQ7SUFPQyxZQUNFLGNBQTBDLEVBQzFDLE9BQTRDO1FBRTVDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUMsR0FBRyx5QkFBeUIsRUFBRSxHQUFHLE9BQU8sRUFBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDeEQsQ0FBQztJQUVELHFFQUFxRTtJQUNyRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsRUFBZTtRQUNyQyxJQUFJLEVBQUUsWUFBWSx3QkFBd0IsRUFBRSxDQUFDO1lBQzNDLE9BQU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxNQUFNLEtBQUssQ0FBQyxxRUFBcUUsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7SUFFRCw2REFBNkQ7SUFDN0QsTUFBTSxDQUFDLE1BQU0sQ0FDWCxNQUEyQixFQUMzQixPQUE0QztRQUU1QyxPQUFPLElBQUksbUNBQW1DLENBQzVDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFDbEQsT0FBTyxDQUNSLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxjQUFjO1FBQ2xCLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxvQkFBb0I7SUFDcEIsS0FBSyxDQUFDLDBCQUEwQjtRQUM5QixxRUFBcUU7UUFDckUsc0RBQXNEO0lBQ3hELENBQUM7SUFFRCw4Q0FBOEM7SUFDcEMsZUFBZTtRQUN2QixPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsa0RBQWtEO0lBQ3hDLGlCQUFpQixDQUFDLE9BQW1DO1FBQzdELE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELGlFQUFpRTtJQUN2RCxpQkFBaUIsQ0FDekIsT0FBbUM7UUFFbkMsT0FBTyxJQUFJLG1DQUFtQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELGdHQUFnRztJQUNoRyw4RkFBOEY7SUFDOUYscUZBQXFGO0lBQ3JGOztPQUVHO0lBQ08sS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQWdCO1FBQ2hELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN2RSxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUF1QixFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtIYXJuZXNzRW52aXJvbm1lbnQsIEhhcm5lc3NMb2FkZXIsIFRlc3RFbGVtZW50fSBmcm9tICdAYW5ndWxhci9jZGsvdGVzdGluZyc7XG5pbXBvcnQgKiBhcyB3ZWJkcml2ZXIgZnJvbSAnc2VsZW5pdW0td2ViZHJpdmVyJztcbmltcG9ydCB7U2VsZW5pdW1XZWJEcml2ZXJFbGVtZW50fSBmcm9tICcuL3NlbGVuaXVtLXdlYi1kcml2ZXItZWxlbWVudCc7XG5cbi8qKlxuICogQW4gQW5ndWxhciBmcmFtZXdvcmsgc3RhYmlsaXplciBmdW5jdGlvbiB0aGF0IHRha2VzIGEgY2FsbGJhY2sgYW5kIGNhbGxzIGl0IHdoZW4gdGhlIGFwcGxpY2F0aW9uXG4gKiBpcyBzdGFibGUsIHBhc3NpbmcgYSBib29sZWFuIGluZGljYXRpbmcgaWYgYW55IHdvcmsgd2FzIGRvbmUuXG4gKi9cbmRlY2xhcmUgaW50ZXJmYWNlIEZyYW1ld29ya1N0YWJpbGl6ZXIge1xuICAoY2FsbGJhY2s6IChkaWRXb3JrOiBib29sZWFuKSA9PiB2b2lkKTogdm9pZDtcbn1cblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICAvKipcbiAgICAgKiBUaGVzZSBob29rcyBhcmUgZXhwb3NlZCBieSBBbmd1bGFyIHRvIHJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHdoZW4gdGhlIGFwcGxpY2F0aW9uIGlzIHN0YWJsZVxuICAgICAqIChubyBtb3JlIHBlbmRpbmcgdGFza3MpLlxuICAgICAqXG4gICAgICogRm9yIHRoZSBpbXBsZW1lbnRhdGlvbiwgc2VlOiBodHRwczovL2dpdGh1Yi5jb20vXG4gICAgICogIGFuZ3VsYXIvYW5ndWxhci9ibG9iL21haW4vcGFja2FnZXMvcGxhdGZvcm0tYnJvd3Nlci9zcmMvYnJvd3Nlci90ZXN0YWJpbGl0eS50cyNMMzAtTDQ5XG4gICAgICovXG4gICAgZnJhbWV3b3JrU3RhYmlsaXplcnM6IEZyYW1ld29ya1N0YWJpbGl6ZXJbXTtcbiAgfVxufVxuXG4vKiogT3B0aW9ucyB0byBjb25maWd1cmUgdGhlIGVudmlyb25tZW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBXZWJEcml2ZXJIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zIHtcbiAgLyoqIFRoZSBxdWVyeSBmdW5jdGlvbiB1c2VkIHRvIGZpbmQgRE9NIGVsZW1lbnRzLiAqL1xuICBxdWVyeUZuOiAoc2VsZWN0b3I6IHN0cmluZywgcm9vdDogKCkgPT4gd2ViZHJpdmVyLldlYkVsZW1lbnQpID0+IFByb21pc2U8d2ViZHJpdmVyLldlYkVsZW1lbnRbXT47XG59XG5cbi8qKiBUaGUgZGVmYXVsdCBlbnZpcm9ubWVudCBvcHRpb25zLiAqL1xuY29uc3QgZGVmYXVsdEVudmlyb25tZW50T3B0aW9uczogV2ViRHJpdmVySGFybmVzc0Vudmlyb25tZW50T3B0aW9ucyA9IHtcbiAgcXVlcnlGbjogYXN5bmMgKHNlbGVjdG9yOiBzdHJpbmcsIHJvb3Q6ICgpID0+IHdlYmRyaXZlci5XZWJFbGVtZW50KSA9PlxuICAgIHJvb3QoKS5maW5kRWxlbWVudHMod2ViZHJpdmVyLkJ5LmNzcyhzZWxlY3RvcikpLFxufTtcblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGJlIGV4ZWN1dGVkIGluIHRoZSBicm93c2VyLiBJdCB0YXBzIGludG8gdGhlIGhvb2tzIGV4cG9zZWQgYnkgQW5ndWxhclxuICogYW5kIGludm9rZXMgdGhlIHNwZWNpZmllZCBgY2FsbGJhY2tgIHdoZW4gdGhlIGFwcGxpY2F0aW9uIGlzIHN0YWJsZSAobm8gbW9yZSBwZW5kaW5nIHRhc2tzKS5cbiAqL1xuZnVuY3Rpb24gd2hlblN0YWJsZShjYWxsYmFjazogKGRpZFdvcms6IGJvb2xlYW5bXSkgPT4gdm9pZCk6IHZvaWQge1xuICBQcm9taXNlLmFsbCh3aW5kb3cuZnJhbWV3b3JrU3RhYmlsaXplcnMubWFwKHN0YWJpbGl6ZXIgPT4gbmV3IFByb21pc2Uoc3RhYmlsaXplcikpKS50aGVuKFxuICAgIGNhbGxiYWNrLFxuICApO1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbWVhbnQgdG8gYmUgZXhlY3V0ZWQgaW4gdGhlIGJyb3dzZXIuIEl0IGNoZWNrcyB3aGV0aGVyIHRoZSBBbmd1bGFyIGZyYW1ld29yayBoYXNcbiAqIGJvb3RzdHJhcHBlZCB5ZXQuXG4gKi9cbmZ1bmN0aW9uIGlzQm9vdHN0cmFwcGVkKCkge1xuICByZXR1cm4gISF3aW5kb3cuZnJhbWV3b3JrU3RhYmlsaXplcnM7XG59XG5cbi8qKiBXYWl0cyBmb3IgYW5ndWxhciB0byBiZSByZWFkeSBhZnRlciB0aGUgcGFnZSBsb2FkLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhaXRGb3JBbmd1bGFyUmVhZHkod2Q6IHdlYmRyaXZlci5XZWJEcml2ZXIpIHtcbiAgYXdhaXQgd2Qud2FpdCgoKSA9PiB3ZC5leGVjdXRlU2NyaXB0KGlzQm9vdHN0cmFwcGVkKSk7XG4gIGF3YWl0IHdkLmV4ZWN1dGVBc3luY1NjcmlwdCh3aGVuU3RhYmxlKTtcbn1cblxuLyoqIEEgYEhhcm5lc3NFbnZpcm9ubWVudGAgaW1wbGVtZW50YXRpb24gZm9yIFdlYkRyaXZlci4gKi9cbmV4cG9ydCBjbGFzcyBTZWxlbml1bVdlYkRyaXZlckhhcm5lc3NFbnZpcm9ubWVudCBleHRlbmRzIEhhcm5lc3NFbnZpcm9ubWVudDxcbiAgKCkgPT4gd2ViZHJpdmVyLldlYkVsZW1lbnRcbj4ge1xuICAvKiogVGhlIG9wdGlvbnMgZm9yIHRoaXMgZW52aXJvbm1lbnQuICovXG4gIHByaXZhdGUgX29wdGlvbnM6IFdlYkRyaXZlckhhcm5lc3NFbnZpcm9ubWVudE9wdGlvbnM7XG5cbiAgLyoqIEVudmlyb25tZW50IHN0YWJpbGl6YXRpb24gY2FsbGJhY2sgcGFzc2VkIHRvIHRoZSBjcmVhdGVkIHRlc3QgZWxlbWVudHMuICovXG4gIHByaXZhdGUgX3N0YWJpbGl6ZUNhbGxiYWNrOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihcbiAgICByYXdSb290RWxlbWVudDogKCkgPT4gd2ViZHJpdmVyLldlYkVsZW1lbnQsXG4gICAgb3B0aW9ucz86IFdlYkRyaXZlckhhcm5lc3NFbnZpcm9ubWVudE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKHJhd1Jvb3RFbGVtZW50KTtcbiAgICB0aGlzLl9vcHRpb25zID0gey4uLmRlZmF1bHRFbnZpcm9ubWVudE9wdGlvbnMsIC4uLm9wdGlvbnN9O1xuICAgIHRoaXMuX3N0YWJpbGl6ZUNhbGxiYWNrID0gKCkgPT4gdGhpcy5mb3JjZVN0YWJpbGl6ZSgpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIEVsZW1lbnRGaW5kZXIgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gVGVzdEVsZW1lbnQuICovXG4gIHN0YXRpYyBnZXROYXRpdmVFbGVtZW50KGVsOiBUZXN0RWxlbWVudCk6IHdlYmRyaXZlci5XZWJFbGVtZW50IHtcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBTZWxlbml1bVdlYkRyaXZlckVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBlbC5lbGVtZW50KCk7XG4gICAgfVxuICAgIHRocm93IEVycm9yKCdUaGlzIFRlc3RFbGVtZW50IHdhcyBub3QgY3JlYXRlZCBieSB0aGUgV2ViRHJpdmVySGFybmVzc0Vudmlyb25tZW50Jyk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGRvY3VtZW50IHJvb3QuICovXG4gIHN0YXRpYyBsb2FkZXIoXG4gICAgZHJpdmVyOiB3ZWJkcml2ZXIuV2ViRHJpdmVyLFxuICAgIG9wdGlvbnM/OiBXZWJEcml2ZXJIYXJuZXNzRW52aXJvbm1lbnRPcHRpb25zLFxuICApOiBIYXJuZXNzTG9hZGVyIHtcbiAgICByZXR1cm4gbmV3IFNlbGVuaXVtV2ViRHJpdmVySGFybmVzc0Vudmlyb25tZW50KFxuICAgICAgKCkgPT4gZHJpdmVyLmZpbmRFbGVtZW50KHdlYmRyaXZlci5CeS5jc3MoJ2JvZHknKSksXG4gICAgICBvcHRpb25zLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRmx1c2hlcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBhc3luYyB0YXNrcyBjYXB0dXJlZCBpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKiBJbiBtb3N0IGNhc2VzIGl0IHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBtYW51YWxseS4gSG93ZXZlciwgdGhlcmUgbWF5IGJlIHNvbWUgZWRnZVxuICAgKiBjYXNlcyB3aGVyZSBpdCBpcyBuZWVkZWQgdG8gZnVsbHkgZmx1c2ggYW5pbWF0aW9uIGV2ZW50cy5cbiAgICovXG4gIGFzeW5jIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMucmF3Um9vdEVsZW1lbnQoKS5nZXREcml2ZXIoKS5leGVjdXRlQXN5bmNTY3JpcHQod2hlblN0YWJsZSk7XG4gIH1cblxuICAvKiogQGRvY3MtcHJpdmF0ZSAqL1xuICBhc3luYyB3YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBUT0RPOiBmaWd1cmUgb3V0IGhvdyB3ZSBjYW4gZG8gdGhpcyBmb3IgdGhlIHdlYmRyaXZlciBlbnZpcm9ubWVudC5cbiAgICAvLyAgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9pc3N1ZXMvMTc0MTJcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSByb290IGVsZW1lbnQgZm9yIHRoZSBkb2N1bWVudC4gKi9cbiAgcHJvdGVjdGVkIGdldERvY3VtZW50Um9vdCgpOiAoKSA9PiB3ZWJkcml2ZXIuV2ViRWxlbWVudCB7XG4gICAgcmV0dXJuICgpID0+IHRoaXMucmF3Um9vdEVsZW1lbnQoKS5nZXREcml2ZXIoKS5maW5kRWxlbWVudCh3ZWJkcml2ZXIuQnkuY3NzKCdib2R5JykpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgVGVzdEVsZW1lbnRgIGZyb20gYSByYXcgZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQ6ICgpID0+IHdlYmRyaXZlci5XZWJFbGVtZW50KTogVGVzdEVsZW1lbnQge1xuICAgIHJldHVybiBuZXcgU2VsZW5pdW1XZWJEcml2ZXJFbGVtZW50KGVsZW1lbnQsIHRoaXMuX3N0YWJpbGl6ZUNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZ2l2ZW4gcmF3IGVsZW1lbnQuICovXG4gIHByb3RlY3RlZCBjcmVhdGVFbnZpcm9ubWVudChcbiAgICBlbGVtZW50OiAoKSA9PiB3ZWJkcml2ZXIuV2ViRWxlbWVudCxcbiAgKTogSGFybmVzc0Vudmlyb25tZW50PCgpID0+IHdlYmRyaXZlci5XZWJFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBTZWxlbml1bVdlYkRyaXZlckhhcm5lc3NFbnZpcm9ubWVudChlbGVtZW50LCB0aGlzLl9vcHRpb25zKTtcbiAgfVxuXG4gIC8vIE5vdGU6IFRoaXMgc2VlbXMgdG8gYmUgd29ya2luZywgdGhvdWdoIHdlIG1heSBuZWVkIHRvIHJlLWV2YWx1YXRlIGlmIHdlIGVuY291bnRlciBpc3N1ZXMgd2l0aFxuICAvLyBzdGFsZSBlbGVtZW50IHJlZmVyZW5jZXMuIGAoKSA9PiBQcm9taXNlPHdlYmRyaXZlci5XZWJFbGVtZW50W10+YCBzZWVtcyBsaWtlIGEgbW9yZSBjb3JyZWN0XG4gIC8vIHJldHVybiB0eXBlLCB0aG91Z2ggc3VwcG9ydGluZyBpdCB3b3VsZCByZXF1aXJlIGNoYW5nZXMgdG8gdGhlIHB1YmxpYyBoYXJuZXNzIEFQSS5cbiAgLyoqXG4gICAqIEdldHMgYSBsaXN0IG9mIGFsbCBlbGVtZW50cyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IgdW5kZXIgdGhpcyBlbnZpcm9ubWVudCdzIHJvb3QgZWxlbWVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTwoKCkgPT4gd2ViZHJpdmVyLldlYkVsZW1lbnQpW10+IHtcbiAgICBjb25zdCBlbHMgPSBhd2FpdCB0aGlzLl9vcHRpb25zLnF1ZXJ5Rm4oc2VsZWN0b3IsIHRoaXMucmF3Um9vdEVsZW1lbnQpO1xuICAgIHJldHVybiBlbHMubWFwKCh4OiB3ZWJkcml2ZXIuV2ViRWxlbWVudCkgPT4gKCkgPT4geCk7XG4gIH1cbn1cbiJdfQ==