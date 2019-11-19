/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
/**
 * Base class for component harnesses that all component harness authors should extend. This base
 * component harness provides the basic ability to locate element and sub-component harness. It
 * should be inherited when defining user's own harness.
 */
export class ComponentHarness {
    constructor(locatorFactory) {
        this.locatorFactory = locatorFactory;
    }
    /** Gets a `Promise` for the `TestElement` representing the host element of the component. */
    host() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.locatorFactory.rootElement;
        });
    }
    /**
     * Gets a `LocatorFactory` for the document root element. This factory can be used to create
     * locators for elements that a component creates outside of its own root element. (e.g. by
     * appending to document.body).
     */
    documentRootLocatorFactory() {
        return this.locatorFactory.documentRootLocatorFactory();
    }
    /**
     * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
     * or element under the host element of this `ComponentHarness`.
     * @param queries A list of queries specifying which harnesses and elements to search for:
     *   - A `string` searches for elements matching the CSS selector specified by the string.
     *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
     *     given class.
     *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
     *     predicate.
     * @return An asynchronous locator function that searches for and returns a `Promise` for the
     *   first element or harness matching the given search criteria. Matches are ordered first by
     *   order in the DOM, and second by order in the queries list. If no matches are found, the
     *   `Promise` rejects. The type that the `Promise` resolves to is a union of all result types for
     *   each query.
     *
     * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
     * `DivHarness.hostSelector === 'div'`:
     * - `await ch.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
     * - `await ch.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
     * - `await ch.locatorFor('span')()` throws because the `Promise` rejects.
     */
    locatorFor(...queries) {
        return this.locatorFactory.locatorFor(...queries);
    }
    /**
     * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
     * or element under the host element of this `ComponentHarness`.
     * @param queries A list of queries specifying which harnesses and elements to search for:
     *   - A `string` searches for elements matching the CSS selector specified by the string.
     *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
     *     given class.
     *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
     *     predicate.
     * @return An asynchronous locator function that searches for and returns a `Promise` for the
     *   first element or harness matching the given search criteria. Matches are ordered first by
     *   order in the DOM, and second by order in the queries list. If no matches are found, the
     *   `Promise` is resolved with `null`. The type that the `Promise` resolves to is a union of all
     *   result types for each query or null.
     *
     * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
     * `DivHarness.hostSelector === 'div'`:
     * - `await ch.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
     * - `await ch.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
     * - `await ch.locatorForOptional('span')()` gets `null`.
     */
    locatorForOptional(...queries) {
        return this.locatorFactory.locatorForOptional(...queries);
    }
    /**
     * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
     * or elements under the host element of this `ComponentHarness`.
     * @param queries A list of queries specifying which harnesses and elements to search for:
     *   - A `string` searches for elements matching the CSS selector specified by the string.
     *   - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
     *     given class.
     *   - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
     *     predicate.
     * @return An asynchronous locator function that searches for and returns a `Promise` for all
     *   elements and harnesses matching the given search criteria. Matches are ordered first by
     *   order in the DOM, and second by order in the queries list. If an element matches more than
     *   one `ComponentHarness` class, the locator gets an instance of each for the same element. If
     *   an element matches multiple `string` selectors, only one `TestElement` instance is returned
     *   for that element. The type that the `Promise` resolves to is an array where each element is
     *   the union of all result types for each query.
     *
     * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
     * `DivHarness.hostSelector === 'div'` and `IdIsD1Harness.hostSelector === '#d1'`:
     * - `await ch.locatorForAll(DivHarness, 'div')()` gets `[
     *     DivHarness, // for #d1
     *     TestElement, // for #d1
     *     DivHarness, // for #d2
     *     TestElement // for #d2
     *   ]`
     * - `await ch.locatorForAll('div', '#d1')()` gets `[
     *     TestElement, // for #d1
     *     TestElement // for #d2
     *   ]`
     * - `await ch.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
     *     DivHarness, // for #d1
     *     IdIsD1Harness, // for #d1
     *     DivHarness // for #d2
     *   ]`
     * - `await ch.locatorForAll('span')()` gets `[]`.
     */
    locatorForAll(...queries) {
        return this.locatorFactory.locatorForAll(...queries);
    }
    /**
     * Flushes change detection and async tasks in the Angular zone.
     * In most cases it should not be necessary to call this manually. However, there may be some edge
     * cases where it is needed to fully flush animation events.
     */
    forceStabilize() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.locatorFactory.forceStabilize();
        });
    }
    /**
     * Waits for all scheduled or running async tasks to complete. This allows harness
     * authors to wait for async tasks outside of the Angular zone.
     */
    waitForTasksOutsideAngular() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.locatorFactory.waitForTasksOutsideAngular();
        });
    }
}
/**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 */
export class HarnessPredicate {
    constructor(harnessType, options) {
        this.harnessType = harnessType;
        this._predicates = [];
        this._descriptions = [];
        this._addBaseOptions(options);
    }
    /**
     * Checks if a string matches the given pattern.
     * @param s The string to check, or a Promise for the string to check.
     * @param pattern The pattern the string is expected to match. If `pattern` is a string, `s` is
     *   expected to match exactly. If `pattern` is a regex, a partial match is allowed.
     * @return A Promise that resolves to whether the string matches the pattern.
     */
    static stringMatches(s, pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            s = yield s;
            return typeof pattern === 'string' ? s === pattern : pattern.test(s);
        });
    }
    /**
     * Adds a predicate function to be run against candidate harnesses.
     * @param description A description of this predicate that may be used in error messages.
     * @param predicate An async predicate function.
     * @return this (for method chaining).
     */
    add(description, predicate) {
        this._descriptions.push(description);
        this._predicates.push(predicate);
        return this;
    }
    /**
     * Adds a predicate function that depends on an option value to be run against candidate
     * harnesses. If the option value is undefined, the predicate will be ignored.
     * @param name The name of the option (may be used in error messages).
     * @param option The option value.
     * @param predicate The predicate function to run if the option value is not undefined.
     * @return this (for method chaining).
     */
    addOption(name, option, predicate) {
        if (option !== undefined) {
            this.add(`${name} = ${_valueAsString(option)}`, item => predicate(item, option));
        }
        return this;
    }
    /**
     * Filters a list of harnesses on this predicate.
     * @param harnesses The list of harnesses to filter.
     * @return A list of harnesses that satisfy this predicate.
     */
    filter(harnesses) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Promise.all(harnesses.map(h => this.evaluate(h)));
            return harnesses.filter((_, i) => results[i]);
        });
    }
    /**
     * Evaluates whether the given harness satisfies this predicate.
     * @param harness The harness to check
     * @return A promise that resolves to true if the harness satisfies this predicate,
     *   and resolves to false otherwise.
     */
    evaluate(harness) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Promise.all(this._predicates.map(p => p(harness)));
            return results.reduce((combined, current) => combined && current, true);
        });
    }
    /** Gets a description of this predicate for use in error messages. */
    getDescription() {
        return this._descriptions.join(', ');
    }
    /** Gets the selector used to find candidate elements. */
    getSelector() {
        return this._ancestor.split(',')
            .map(part => `${part.trim()} ${this.harnessType.hostSelector}`.trim())
            .join(',');
    }
    /** Adds base options common to all harness types. */
    _addBaseOptions(options) {
        this._ancestor = options.ancestor || '';
        if (this._ancestor) {
            this._descriptions.push(`has ancestor matching selector "${this._ancestor}"`);
        }
        const selector = options.selector;
        if (selector !== undefined) {
            this.add(`host matches selector "${selector}"`, (item) => __awaiter(this, void 0, void 0, function* () {
                return (yield item.host()).matchesSelector(selector);
            }));
        }
    }
}
/** Represent a value as a string for the purpose of logging. */
function _valueAsString(value) {
    if (value === undefined) {
        return 'undefined';
    }
    // `JSON.stringify` doesn't handle RegExp properly, so we need a custom replacer.
    try {
        return JSON.stringify(value, (_, v) => v instanceof RegExp ? `/${v.toString()}/` :
            typeof v === 'string' ? v.replace('/\//g', '\\/') : v).replace(/"\/\//g, '\\/').replace(/\/\/"/g, '\\/').replace(/\\\//g, '/');
    }
    catch (_a) {
        // `JSON.stringify` will throw if the object is cyclical,
        // in this case the best we can do is report the value as `{...}`.
        return '{...}';
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWhhcm5lc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvY29tcG9uZW50LWhhcm5lc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQTJPSDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFnQixnQkFBZ0I7SUFDcEMsWUFBK0IsY0FBOEI7UUFBOUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO0lBQUcsQ0FBQztJQUVqRSw2RkFBNkY7SUFDdkYsSUFBSTs7WUFDUixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDO1FBQ3pDLENBQUM7S0FBQTtJQUVEOzs7O09BSUc7SUFDTywwQkFBMEI7UUFDbEMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLDBCQUEwQixFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW9CRztJQUNPLFVBQVUsQ0FBMkMsR0FBRyxPQUFVO1FBRTFFLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bb0JHO0lBQ08sa0JBQWtCLENBQTJDLEdBQUcsT0FBVTtRQUVsRixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BbUNHO0lBQ08sYUFBYSxDQUEyQyxHQUFHLE9BQVU7UUFFN0UsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRDs7OztPQUlHO0lBQ2EsY0FBYzs7WUFDNUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FB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LENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDM0U7SUFBQyxXQUFNO1FBQ04seURBQXlEO1FBQ3pELGtFQUFrRTtRQUNsRSxPQUFPLE9BQU8sQ0FBQztLQUNoQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUZXN0RWxlbWVudH0gZnJvbSAnLi90ZXN0LWVsZW1lbnQnO1xuXG4vKiogQW4gYXN5bmMgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZSB3aGVuIGNhbGxlZC4gKi9cbmV4cG9ydCB0eXBlIEFzeW5jRmFjdG9yeUZuPFQ+ID0gKCkgPT4gUHJvbWlzZTxUPjtcblxuLyoqIEFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gaXRlbSBhbmQgcmV0dXJucyBhIGJvb2xlYW4gcHJvbWlzZSAqL1xuZXhwb3J0IHR5cGUgQXN5bmNQcmVkaWNhdGU8VD4gPSAoaXRlbTogVCkgPT4gUHJvbWlzZTxib29sZWFuPjtcblxuLyoqIEFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gaXRlbSBhbmQgYW4gb3B0aW9uIHZhbHVlIGFuZCByZXR1cm5zIGEgYm9vbGVhbiBwcm9taXNlLiAqL1xuZXhwb3J0IHR5cGUgQXN5bmNPcHRpb25QcmVkaWNhdGU8VCwgTz4gPSAoaXRlbTogVCwgb3B0aW9uOiBPKSA9PiBQcm9taXNlPGJvb2xlYW4+O1xuXG4vKipcbiAqIEEgcXVlcnkgZm9yIGEgYENvbXBvbmVudEhhcm5lc3NgLCB3aGljaCBpcyBleHByZXNzZWQgYXMgZWl0aGVyIGEgYENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcmAgb3JcbiAqIGEgYEhhcm5lc3NQcmVkaWNhdGVgLlxuICovXG5leHBvcnQgdHlwZSBIYXJuZXNzUXVlcnk8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+ID1cbiAgICBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+O1xuXG4vKipcbiAqIFRoZSByZXN1bHQgdHlwZSBvYnRhaW5lZCB3aGVuIHNlYXJjaGluZyB1c2luZyBhIHBhcnRpY3VsYXIgbGlzdCBvZiBxdWVyaWVzLiBUaGlzIHR5cGUgZGVwZW5kcyBvblxuICogdGhlIHBhcnRpY3VsYXIgaXRlbXMgYmVpbmcgcXVlcmllZC5cbiAqIC0gSWYgb25lIG9mIHRoZSBxdWVyaWVzIGlzIGZvciBhIGBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8QzE+YCwgaXQgbWVhbnMgdGhhdCB0aGUgcmVzdWx0XG4gKiAgIG1pZ2h0IGJlIGEgaGFybmVzcyBvZiB0eXBlIGBDMWBcbiAqIC0gSWYgb25lIG9mIHRoZSBxdWVyaWVzIGlzIGZvciBhIGBIYXJuZXNzUHJlZGljYXRlPEMyPmAsIGl0IG1lYW5zIHRoYXQgdGhlIHJlc3VsdCBtaWdodCBiZSBhXG4gKiAgIGhhcm5lc3Mgb2YgdHlwZSBgQzJgXG4gKiAtIElmIG9uZSBvZiB0aGUgcXVlcmllcyBpcyBmb3IgYSBgc3RyaW5nYCwgaXQgbWVhbnMgdGhhdCB0aGUgcmVzdWx0IG1pZ2h0IGJlIGEgYFRlc3RFbGVtZW50YC5cbiAqXG4gKiBTaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoaWNoIHF1ZXJ5IHdpbGwgbWF0Y2gsIHRoZSByZXN1bHQgdHlwZSBpZiB0aGUgdW5pb24gb2YgdGhlIHR5cGVzXG4gKiBmb3IgYWxsIHBvc3NpYmxlIHJlc3VsdHMuXG4gKlxuICogZS5nLlxuICogVGhlIHR5cGU6XG4gKiBgTG9jYXRvckZuUmVzdWx0Jmx0O1tcbiAqICAgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yJmx0O015SGFybmVzcyZndDssXG4gKiAgIEhhcm5lc3NQcmVkaWNhdGUmbHQ7TXlPdGhlckhhcm5lc3MmZ3Q7LFxuICogICBzdHJpbmdcbiAqIF0mZ3Q7YFxuICogaXMgZXF1aXZhbGVudCB0bzpcbiAqIGBNeUhhcm5lc3MgfCBNeU90aGVySGFybmVzcyB8IFRlc3RFbGVtZW50YC5cbiAqL1xuZXhwb3J0IHR5cGUgTG9jYXRvckZuUmVzdWx0PFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+ID0ge1xuICBbSSBpbiBrZXlvZiBUXTpcbiAgICAgIC8vIE1hcCBgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPEM+YCB0byBgQ2AuXG4gICAgICBUW0ldIGV4dGVuZHMgbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gaW5mZXIgQyA/IEMgOlxuICAgICAgLy8gTWFwIGBIYXJuZXNzUHJlZGljYXRlPEM+YCB0byBgQ2AuXG4gICAgICBUW0ldIGV4dGVuZHMgeyBoYXJuZXNzVHlwZTogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gaW5mZXIgQyB9ID8gQyA6XG4gICAgICAvLyBNYXAgYHN0cmluZ2AgdG8gYFRlc3RFbGVtZW50YC5cbiAgICAgIFRbSV0gZXh0ZW5kcyBzdHJpbmcgPyBUZXN0RWxlbWVudCA6XG4gICAgICAvLyBNYXAgZXZlcnl0aGluZyBlbHNlIHRvIGBuZXZlcmAgKHNob3VsZCBub3QgaGFwcGVuIGR1ZSB0byB0aGUgdHlwZSBjb25zdHJhaW50IG9uIGBUYCkuXG4gICAgICBuZXZlcjtcbn1bbnVtYmVyXTtcblxuXG4vKipcbiAqIEludGVyZmFjZSB1c2VkIHRvIGxvYWQgQ29tcG9uZW50SGFybmVzcyBvYmplY3RzLiBUaGlzIGludGVyZmFjZSBpcyB1c2VkIGJ5IHRlc3QgYXV0aG9ycyB0b1xuICogaW5zdGFudGlhdGUgYENvbXBvbmVudEhhcm5lc3NgZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSGFybmVzc0xvYWRlciB7XG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYW4gZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBzZWxlY3RvciB1bmRlciB0aGUgY3VycmVudCBpbnN0YW5jZXMncyByb290IGVsZW1lbnQsXG4gICAqIGFuZCByZXR1cm5zIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgbWF0Y2hpbmcgZWxlbWVudC4gSWYgbXVsdGlwbGUgZWxlbWVudHMgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yLCB0aGUgZmlyc3QgaXMgdXNlZC4gSWYgbm8gZWxlbWVudHMgbWF0Y2gsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGUgbmV3IGBIYXJuZXNzTG9hZGVyYFxuICAgKiBAcmV0dXJuIEEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IuXG4gICAqIEB0aHJvd3MgSWYgYSBtYXRjaGluZyBlbGVtZW50IGNhbid0IGJlIGZvdW5kLlxuICAgKi9cbiAgZ2V0Q2hpbGRMb2FkZXIoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj47XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhbGwgZWxlbWVudHMgd2l0aCB0aGUgZ2l2ZW4gc2VsZWN0b3IgdW5kZXIgdGhlIGN1cnJlbnQgaW5zdGFuY2VzJ3Mgcm9vdCBlbGVtZW50LFxuICAgKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBgSGFybmVzc0xvYWRlcmBzLCBvbmUgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudCwgcm9vdGVkIGF0IHRoYXRcbiAgICogZWxlbWVudC5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGUgbmV3IGBIYXJuZXNzTG9hZGVyYFxuICAgKiBAcmV0dXJuIEEgbGlzdCBvZiBgSGFybmVzc0xvYWRlcmBzLCBvbmUgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudCwgcm9vdGVkIGF0IHRoYXQgZWxlbWVudC5cbiAgICovXG4gIGdldEFsbENoaWxkTG9hZGVycyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyW10+O1xuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGNvbXBvbmVudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgdW5kZXIgdGhlXG4gICAqIGBIYXJuZXNzTG9hZGVyYCdzIHJvb3QgZWxlbWVudCwgYW5kIHJldHVybnMgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIHRoYXQgaW5zdGFuY2UuIElmIG11bHRpcGxlXG4gICAqIG1hdGNoaW5nIGNvbXBvbmVudHMgYXJlIGZvdW5kLCBhIGhhcm5lc3MgZm9yIHRoZSBmaXJzdCBvbmUgaXMgcmV0dXJuZWQuIElmIG5vIG1hdGNoaW5nXG4gICAqIGNvbXBvbmVudCBpcyBmb3VuZCwgYW4gZXJyb3IgaXMgdGhyb3duLlxuICAgKiBAcGFyYW0gcXVlcnkgQSBxdWVyeSBmb3IgYSBoYXJuZXNzIHRvIGNyZWF0ZVxuICAgKiBAcmV0dXJuIEFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGVcbiAgICogQHRocm93cyBJZiBhIG1hdGNoaW5nIGNvbXBvbmVudCBpbnN0YW5jZSBjYW4ndCBiZSBmb3VuZC5cbiAgICovXG4gIGdldEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KHF1ZXJ5OiBIYXJuZXNzUXVlcnk8VD4pOiBQcm9taXNlPFQ+O1xuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYWxsIGluc3RhbmNlcyBvZiB0aGUgY29tcG9uZW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSB1bmRlciB0aGVcbiAgICogYEhhcm5lc3NMb2FkZXJgJ3Mgcm9vdCBlbGVtZW50LCBhbmQgcmV0dXJucyBhIGxpc3QgYENvbXBvbmVudEhhcm5lc3NgIGZvciBlYWNoIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gcXVlcnkgQSBxdWVyeSBmb3IgYSBoYXJuZXNzIHRvIGNyZWF0ZVxuICAgKiBAcmV0dXJuIEEgbGlzdCBpbnN0YW5jZXMgb2YgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZS5cbiAgICovXG4gIGdldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ocXVlcnk6IEhhcm5lc3NRdWVyeTxUPik6IFByb21pc2U8VFtdPjtcbn1cblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byBjcmVhdGUgYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb25zIHVzZWQgZmluZCBlbGVtZW50cyBhbmQgY29tcG9uZW50XG4gKiBoYXJuZXNzZXMuIFRoaXMgaW50ZXJmYWNlIGlzIHVzZWQgYnkgYENvbXBvbmVudEhhcm5lc3NgIGF1dGhvcnMgdG8gY3JlYXRlIGxvY2F0b3IgZnVuY3Rpb25zIGZvclxuICogdGhlaXIgYENvbXBvbmVudEhhcm5lc3NgIHN1YmNsYXNzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvY2F0b3JGYWN0b3J5IHtcbiAgLyoqIEdldHMgYSBsb2NhdG9yIGZhY3Rvcnkgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBkb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpOiBMb2NhdG9yRmFjdG9yeTtcblxuICAvKiogVGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAgYXMgYSBgVGVzdEVsZW1lbnRgLiAqL1xuICByb290RWxlbWVudDogVGVzdEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGEgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlXG4gICAqIG9yIGVsZW1lbnQgdW5kZXIgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgdGhlXG4gICAqICAgZmlyc3QgZWxlbWVudCBvciBoYXJuZXNzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZWFyY2ggY3JpdGVyaWEuIE1hdGNoZXMgYXJlIG9yZGVyZWQgZmlyc3QgYnlcbiAgICogICBvcmRlciBpbiB0aGUgRE9NLCBhbmQgc2Vjb25kIGJ5IG9yZGVyIGluIHRoZSBxdWVyaWVzIGxpc3QuIElmIG5vIG1hdGNoZXMgYXJlIGZvdW5kLCB0aGVcbiAgICogICBgUHJvbWlzZWAgcmVqZWN0cy4gVGhlIHR5cGUgdGhhdCB0aGUgYFByb21pc2VgIHJlc29sdmVzIHRvIGlzIGEgdW5pb24gb2YgYWxsIHJlc3VsdCB0eXBlcyBmb3JcbiAgICogICBlYWNoIHF1ZXJ5LlxuICAgKlxuICAgKiBlLmcuIEdpdmVuIHRoZSBmb2xsb3dpbmcgRE9NOiBgPGRpdiBpZD1cImQxXCIgLz48ZGl2IGlkPVwiZDJcIiAvPmAsIGFuZCBhc3N1bWluZ1xuICAgKiBgRGl2SGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICdkaXYnYDpcbiAgICogLSBgYXdhaXQgbGYubG9jYXRvckZvcihEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBhIGBEaXZIYXJuZXNzYCBpbnN0YW5jZSBmb3IgYCNkMWBcbiAgICogLSBgYXdhaXQgbGYubG9jYXRvckZvcignZGl2JywgRGl2SGFybmVzcykoKWAgZ2V0cyBhIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3IoJ3NwYW4nKSgpYCB0aHJvd3MgYmVjYXVzZSB0aGUgYFByb21pc2VgIHJlamVjdHMuXG4gICAqL1xuICBsb2NhdG9yRm9yPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+PjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbmQgYSBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VcbiAgICogb3IgZWxlbWVudCB1bmRlciB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC5cbiAgICogQHBhcmFtIHF1ZXJpZXMgQSBsaXN0IG9mIHF1ZXJpZXMgc3BlY2lmeWluZyB3aGljaCBoYXJuZXNzZXMgYW5kIGVsZW1lbnRzIHRvIHNlYXJjaCBmb3I6XG4gICAqICAgLSBBIGBzdHJpbmdgIHNlYXJjaGVzIGZvciBlbGVtZW50cyBtYXRjaGluZyB0aGUgQ1NTIHNlbGVjdG9yIHNwZWNpZmllZCBieSB0aGUgc3RyaW5nLlxuICAgKiAgIC0gQSBgQ29tcG9uZW50SGFybmVzc2AgY29uc3RydWN0b3Igc2VhcmNoZXMgZm9yIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXMgbWF0Y2hpbmcgdGhlXG4gICAqICAgICBnaXZlbiBjbGFzcy5cbiAgICogICAtIEEgYEhhcm5lc3NQcmVkaWNhdGVgIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZSBnaXZlblxuICAgKiAgICAgcHJlZGljYXRlLlxuICAgKiBAcmV0dXJuIEFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgc2VhcmNoZXMgZm9yIGFuZCByZXR1cm5zIGEgYFByb21pc2VgIGZvciB0aGVcbiAgICogICBmaXJzdCBlbGVtZW50IG9yIGhhcm5lc3MgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlYXJjaCBjcml0ZXJpYS4gTWF0Y2hlcyBhcmUgb3JkZXJlZCBmaXJzdCBieVxuICAgKiAgIG9yZGVyIGluIHRoZSBET00sIGFuZCBzZWNvbmQgYnkgb3JkZXIgaW4gdGhlIHF1ZXJpZXMgbGlzdC4gSWYgbm8gbWF0Y2hlcyBhcmUgZm91bmQsIHRoZVxuICAgKiAgIGBQcm9taXNlYCBpcyByZXNvbHZlZCB3aXRoIGBudWxsYC4gVGhlIHR5cGUgdGhhdCB0aGUgYFByb21pc2VgIHJlc29sdmVzIHRvIGlzIGEgdW5pb24gb2YgYWxsXG4gICAqICAgcmVzdWx0IHR5cGVzIGZvciBlYWNoIHF1ZXJ5IG9yIG51bGwuXG4gICAqXG4gICAqIGUuZy4gR2l2ZW4gdGhlIGZvbGxvd2luZyBET006IGA8ZGl2IGlkPVwiZDFcIiAvPjxkaXYgaWQ9XCJkMlwiIC8+YCwgYW5kIGFzc3VtaW5nXG4gICAqIGBEaXZIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJ2RpdidgOlxuICAgKiAtIGBhd2FpdCBsZi5sb2NhdG9yRm9yT3B0aW9uYWwoRGl2SGFybmVzcywgJ2RpdicpKClgIGdldHMgYSBgRGl2SGFybmVzc2AgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3JPcHRpb25hbCgnZGl2JywgRGl2SGFybmVzcykoKWAgZ2V0cyBhIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3JPcHRpb25hbCgnc3BhbicpKClgIGdldHMgYG51bGxgLlxuICAgKi9cbiAgbG9jYXRvckZvck9wdGlvbmFsPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+IHwgbnVsbD47XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXNcbiAgICogb3IgZWxlbWVudHMgdW5kZXIgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgYWxsXG4gICAqICAgZWxlbWVudHMgYW5kIGhhcm5lc3NlcyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VhcmNoIGNyaXRlcmlhLiBNYXRjaGVzIGFyZSBvcmRlcmVkIGZpcnN0IGJ5XG4gICAqICAgb3JkZXIgaW4gdGhlIERPTSwgYW5kIHNlY29uZCBieSBvcmRlciBpbiB0aGUgcXVlcmllcyBsaXN0LiBJZiBhbiBlbGVtZW50IG1hdGNoZXMgbW9yZSB0aGFuXG4gICAqICAgb25lIGBDb21wb25lbnRIYXJuZXNzYCBjbGFzcywgdGhlIGxvY2F0b3IgZ2V0cyBhbiBpbnN0YW5jZSBvZiBlYWNoIGZvciB0aGUgc2FtZSBlbGVtZW50LiBJZlxuICAgKiAgIGFuIGVsZW1lbnQgbWF0Y2hlcyBtdWx0aXBsZSBgc3RyaW5nYCBzZWxlY3RvcnMsIG9ubHkgb25lIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgaXMgcmV0dXJuZWRcbiAgICogICBmb3IgdGhhdCBlbGVtZW50LiBUaGUgdHlwZSB0aGF0IHRoZSBgUHJvbWlzZWAgcmVzb2x2ZXMgdG8gaXMgYW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzXG4gICAqICAgdGhlIHVuaW9uIG9mIGFsbCByZXN1bHQgdHlwZXMgZm9yIGVhY2ggcXVlcnkuXG4gICAqXG4gICAqIGUuZy4gR2l2ZW4gdGhlIGZvbGxvd2luZyBET006IGA8ZGl2IGlkPVwiZDFcIiAvPjxkaXYgaWQ9XCJkMlwiIC8+YCwgYW5kIGFzc3VtaW5nXG4gICAqIGBEaXZIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJ2RpdidgIGFuZCBgSWRJc0QxSGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICcjZDEnYDpcbiAgICogLSBgYXdhaXQgbGYubG9jYXRvckZvckFsbChEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBgW1xuICAgKiAgICAgRGl2SGFybmVzcywgLy8gZm9yICNkMVxuICAgKiAgICAgVGVzdEVsZW1lbnQsIC8vIGZvciAjZDFcbiAgICogICAgIERpdkhhcm5lc3MsIC8vIGZvciAjZDJcbiAgICogICAgIFRlc3RFbGVtZW50IC8vIGZvciAjZDJcbiAgICogICBdYFxuICAgKiAtIGBhd2FpdCBsZi5sb2NhdG9yRm9yQWxsKCdkaXYnLCAnI2QxJykoKWAgZ2V0cyBgW1xuICAgKiAgICAgVGVzdEVsZW1lbnQsIC8vIGZvciAjZDFcbiAgICogICAgIFRlc3RFbGVtZW50IC8vIGZvciAjZDJcbiAgICogICBdYFxuICAgKiAtIGBhd2FpdCBsZi5sb2NhdG9yRm9yQWxsKERpdkhhcm5lc3MsIElkSXNEMUhhcm5lc3MpKClgIGdldHMgYFtcbiAgICogICAgIERpdkhhcm5lc3MsIC8vIGZvciAjZDFcbiAgICogICAgIElkSXNEMUhhcm5lc3MsIC8vIGZvciAjZDFcbiAgICogICAgIERpdkhhcm5lc3MgLy8gZm9yICNkMlxuICAgKiAgIF1gXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3JBbGwoJ3NwYW4nKSgpYCBnZXRzIGBbXWAuXG4gICAqL1xuICBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+W10+O1xuXG4gIC8qKlxuICAgKiBHZXRzIGEgYEhhcm5lc3NMb2FkZXJgIGluc3RhbmNlIGZvciBhbiBlbGVtZW50IHVuZGVyIHRoZSByb290IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIHJvb3QgZWxlbWVudC5cbiAgICogQHJldHVybiBBIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGZpcnN0IGVsZW1lbnQgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlbGVjdG9yLlxuICAgKiBAdGhyb3dzIElmIG5vIG1hdGNoaW5nIGVsZW1lbnQgaXMgZm91bmQgZm9yIHRoZSBnaXZlbiBzZWxlY3Rvci5cbiAgICovXG4gIGhhcm5lc3NMb2FkZXJGb3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj47XG5cbiAgLyoqXG4gICAqIEdldHMgYSBgSGFybmVzc0xvYWRlcmAgaW5zdGFuY2UgZm9yIGFuIGVsZW1lbnQgdW5kZXIgdGhlIHJvb3Qgb2YgdGhpcyBgTG9jYXRvckZhY3RvcnlgXG4gICAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgZm9yIHRoZSByb290IGVsZW1lbnQuXG4gICAqIEByZXR1cm4gQSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBmaXJzdCBlbGVtZW50IG1hdGNoaW5nIHRoZSBnaXZlbiBzZWxlY3Rvciwgb3IgbnVsbCBpZlxuICAgKiAgICAgbm8gbWF0Y2hpbmcgZWxlbWVudCBpcyBmb3VuZC5cbiAgICovXG4gIGhhcm5lc3NMb2FkZXJGb3JPcHRpb25hbChzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyIHwgbnVsbD47XG5cbiAgLyoqXG4gICAqIEdldHMgYSBsaXN0IG9mIGBIYXJuZXNzTG9hZGVyYCBpbnN0YW5jZXMsIG9uZSBmb3IgZWFjaCBtYXRjaGluZyBlbGVtZW50LlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgVGhlIHNlbGVjdG9yIGZvciB0aGUgcm9vdCBlbGVtZW50LlxuICAgKiBAcmV0dXJuIEEgbGlzdCBvZiBgSGFybmVzc0xvYWRlcmAsIG9uZSByb290ZWQgYXQgZWFjaCBlbGVtZW50IG1hdGNoaW5nIHRoZSBnaXZlbiBzZWxlY3Rvci5cbiAgICovXG4gIGhhcm5lc3NMb2FkZXJGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcltdPjtcblxuICAvKipcbiAgICogRmx1c2hlcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBhc3luYyB0YXNrcyBjYXB0dXJlZCBpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKiBJbiBtb3N0IGNhc2VzIGl0IHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBtYW51YWxseS4gSG93ZXZlciwgdGhlcmUgbWF5IGJlIHNvbWUgZWRnZVxuICAgKiBjYXNlcyB3aGVyZSBpdCBpcyBuZWVkZWQgdG8gZnVsbHkgZmx1c2ggYW5pbWF0aW9uIGV2ZW50cy5cbiAgICovXG4gIGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIFdhaXRzIGZvciBhbGwgc2NoZWR1bGVkIG9yIHJ1bm5pbmcgYXN5bmMgdGFza3MgdG8gY29tcGxldGUuIFRoaXMgYWxsb3dzIGhhcm5lc3NcbiAgICogYXV0aG9ycyB0byB3YWl0IGZvciBhc3luYyB0YXNrcyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqL1xuICB3YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGNvbXBvbmVudCBoYXJuZXNzZXMgdGhhdCBhbGwgY29tcG9uZW50IGhhcm5lc3MgYXV0aG9ycyBzaG91bGQgZXh0ZW5kLiBUaGlzIGJhc2VcbiAqIGNvbXBvbmVudCBoYXJuZXNzIHByb3ZpZGVzIHRoZSBiYXNpYyBhYmlsaXR5IHRvIGxvY2F0ZSBlbGVtZW50IGFuZCBzdWItY29tcG9uZW50IGhhcm5lc3MuIEl0XG4gKiBzaG91bGQgYmUgaW5oZXJpdGVkIHdoZW4gZGVmaW5pbmcgdXNlcidzIG93biBoYXJuZXNzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50SGFybmVzcyB7XG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCByZWFkb25seSBsb2NhdG9yRmFjdG9yeTogTG9jYXRvckZhY3RvcnkpIHt9XG5cbiAgLyoqIEdldHMgYSBgUHJvbWlzZWAgZm9yIHRoZSBgVGVzdEVsZW1lbnRgIHJlcHJlc2VudGluZyB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuICovXG4gIGFzeW5jIGhvc3QoKTogUHJvbWlzZTxUZXN0RWxlbWVudD4ge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LnJvb3RFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBgTG9jYXRvckZhY3RvcnlgIGZvciB0aGUgZG9jdW1lbnQgcm9vdCBlbGVtZW50LiBUaGlzIGZhY3RvcnkgY2FuIGJlIHVzZWQgdG8gY3JlYXRlXG4gICAqIGxvY2F0b3JzIGZvciBlbGVtZW50cyB0aGF0IGEgY29tcG9uZW50IGNyZWF0ZXMgb3V0c2lkZSBvZiBpdHMgb3duIHJvb3QgZWxlbWVudC4gKGUuZy4gYnlcbiAgICogYXBwZW5kaW5nIHRvIGRvY3VtZW50LmJvZHkpLlxuICAgKi9cbiAgcHJvdGVjdGVkIGRvY3VtZW50Um9vdExvY2F0b3JGYWN0b3J5KCk6IExvY2F0b3JGYWN0b3J5IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRmFjdG9yeS5kb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGEgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlXG4gICAqIG9yIGVsZW1lbnQgdW5kZXIgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGlzIGBDb21wb25lbnRIYXJuZXNzYC5cbiAgICogQHBhcmFtIHF1ZXJpZXMgQSBsaXN0IG9mIHF1ZXJpZXMgc3BlY2lmeWluZyB3aGljaCBoYXJuZXNzZXMgYW5kIGVsZW1lbnRzIHRvIHNlYXJjaCBmb3I6XG4gICAqICAgLSBBIGBzdHJpbmdgIHNlYXJjaGVzIGZvciBlbGVtZW50cyBtYXRjaGluZyB0aGUgQ1NTIHNlbGVjdG9yIHNwZWNpZmllZCBieSB0aGUgc3RyaW5nLlxuICAgKiAgIC0gQSBgQ29tcG9uZW50SGFybmVzc2AgY29uc3RydWN0b3Igc2VhcmNoZXMgZm9yIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXMgbWF0Y2hpbmcgdGhlXG4gICAqICAgICBnaXZlbiBjbGFzcy5cbiAgICogICAtIEEgYEhhcm5lc3NQcmVkaWNhdGVgIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZSBnaXZlblxuICAgKiAgICAgcHJlZGljYXRlLlxuICAgKiBAcmV0dXJuIEFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgc2VhcmNoZXMgZm9yIGFuZCByZXR1cm5zIGEgYFByb21pc2VgIGZvciB0aGVcbiAgICogICBmaXJzdCBlbGVtZW50IG9yIGhhcm5lc3MgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlYXJjaCBjcml0ZXJpYS4gTWF0Y2hlcyBhcmUgb3JkZXJlZCBmaXJzdCBieVxuICAgKiAgIG9yZGVyIGluIHRoZSBET00sIGFuZCBzZWNvbmQgYnkgb3JkZXIgaW4gdGhlIHF1ZXJpZXMgbGlzdC4gSWYgbm8gbWF0Y2hlcyBhcmUgZm91bmQsIHRoZVxuICAgKiAgIGBQcm9taXNlYCByZWplY3RzLiBUaGUgdHlwZSB0aGF0IHRoZSBgUHJvbWlzZWAgcmVzb2x2ZXMgdG8gaXMgYSB1bmlvbiBvZiBhbGwgcmVzdWx0IHR5cGVzIGZvclxuICAgKiAgIGVhY2ggcXVlcnkuXG4gICAqXG4gICAqIGUuZy4gR2l2ZW4gdGhlIGZvbGxvd2luZyBET006IGA8ZGl2IGlkPVwiZDFcIiAvPjxkaXYgaWQ9XCJkMlwiIC8+YCwgYW5kIGFzc3VtaW5nXG4gICAqIGBEaXZIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJ2RpdidgOlxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yKERpdkhhcm5lc3MsICdkaXYnKSgpYCBnZXRzIGEgYERpdkhhcm5lc3NgIGluc3RhbmNlIGZvciBgI2QxYFxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yKCdkaXYnLCBEaXZIYXJuZXNzKSgpYCBnZXRzIGEgYFRlc3RFbGVtZW50YCBpbnN0YW5jZSBmb3IgYCNkMWBcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvcignc3BhbicpKClgIHRocm93cyBiZWNhdXNlIHRoZSBgUHJvbWlzZWAgcmVqZWN0cy5cbiAgICovXG4gIHByb3RlY3RlZCBsb2NhdG9yRm9yPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkubG9jYXRvckZvciguLi5xdWVyaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZVxuICAgKiBvciBlbGVtZW50IHVuZGVyIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhpcyBgQ29tcG9uZW50SGFybmVzc2AuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgdGhlXG4gICAqICAgZmlyc3QgZWxlbWVudCBvciBoYXJuZXNzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZWFyY2ggY3JpdGVyaWEuIE1hdGNoZXMgYXJlIG9yZGVyZWQgZmlyc3QgYnlcbiAgICogICBvcmRlciBpbiB0aGUgRE9NLCBhbmQgc2Vjb25kIGJ5IG9yZGVyIGluIHRoZSBxdWVyaWVzIGxpc3QuIElmIG5vIG1hdGNoZXMgYXJlIGZvdW5kLCB0aGVcbiAgICogICBgUHJvbWlzZWAgaXMgcmVzb2x2ZWQgd2l0aCBgbnVsbGAuIFRoZSB0eXBlIHRoYXQgdGhlIGBQcm9taXNlYCByZXNvbHZlcyB0byBpcyBhIHVuaW9uIG9mIGFsbFxuICAgKiAgIHJlc3VsdCB0eXBlcyBmb3IgZWFjaCBxdWVyeSBvciBudWxsLlxuICAgKlxuICAgKiBlLmcuIEdpdmVuIHRoZSBmb2xsb3dpbmcgRE9NOiBgPGRpdiBpZD1cImQxXCIgLz48ZGl2IGlkPVwiZDJcIiAvPmAsIGFuZCBhc3N1bWluZ1xuICAgKiBgRGl2SGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICdkaXYnYDpcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvck9wdGlvbmFsKERpdkhhcm5lc3MsICdkaXYnKSgpYCBnZXRzIGEgYERpdkhhcm5lc3NgIGluc3RhbmNlIGZvciBgI2QxYFxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yT3B0aW9uYWwoJ2RpdicsIERpdkhhcm5lc3MpKClgIGdldHMgYSBgVGVzdEVsZW1lbnRgIGluc3RhbmNlIGZvciBgI2QxYFxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yT3B0aW9uYWwoJ3NwYW4nKSgpYCBnZXRzIGBudWxsYC5cbiAgICovXG4gIHByb3RlY3RlZCBsb2NhdG9yRm9yT3B0aW9uYWw8VCBleHRlbmRzIChIYXJuZXNzUXVlcnk8YW55PiB8IHN0cmluZylbXT4oLi4ucXVlcmllczogVCk6XG4gICAgICBBc3luY0ZhY3RvcnlGbjxMb2NhdG9yRm5SZXN1bHQ8VD4gfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkubG9jYXRvckZvck9wdGlvbmFsKC4uLnF1ZXJpZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXNcbiAgICogb3IgZWxlbWVudHMgdW5kZXIgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGlzIGBDb21wb25lbnRIYXJuZXNzYC5cbiAgICogQHBhcmFtIHF1ZXJpZXMgQSBsaXN0IG9mIHF1ZXJpZXMgc3BlY2lmeWluZyB3aGljaCBoYXJuZXNzZXMgYW5kIGVsZW1lbnRzIHRvIHNlYXJjaCBmb3I6XG4gICAqICAgLSBBIGBzdHJpbmdgIHNlYXJjaGVzIGZvciBlbGVtZW50cyBtYXRjaGluZyB0aGUgQ1NTIHNlbGVjdG9yIHNwZWNpZmllZCBieSB0aGUgc3RyaW5nLlxuICAgKiAgIC0gQSBgQ29tcG9uZW50SGFybmVzc2AgY29uc3RydWN0b3Igc2VhcmNoZXMgZm9yIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXMgbWF0Y2hpbmcgdGhlXG4gICAqICAgICBnaXZlbiBjbGFzcy5cbiAgICogICAtIEEgYEhhcm5lc3NQcmVkaWNhdGVgIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZSBnaXZlblxuICAgKiAgICAgcHJlZGljYXRlLlxuICAgKiBAcmV0dXJuIEFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgc2VhcmNoZXMgZm9yIGFuZCByZXR1cm5zIGEgYFByb21pc2VgIGZvciBhbGxcbiAgICogICBlbGVtZW50cyBhbmQgaGFybmVzc2VzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZWFyY2ggY3JpdGVyaWEuIE1hdGNoZXMgYXJlIG9yZGVyZWQgZmlyc3QgYnlcbiAgICogICBvcmRlciBpbiB0aGUgRE9NLCBhbmQgc2Vjb25kIGJ5IG9yZGVyIGluIHRoZSBxdWVyaWVzIGxpc3QuIElmIGFuIGVsZW1lbnQgbWF0Y2hlcyBtb3JlIHRoYW5cbiAgICogICBvbmUgYENvbXBvbmVudEhhcm5lc3NgIGNsYXNzLCB0aGUgbG9jYXRvciBnZXRzIGFuIGluc3RhbmNlIG9mIGVhY2ggZm9yIHRoZSBzYW1lIGVsZW1lbnQuIElmXG4gICAqICAgYW4gZWxlbWVudCBtYXRjaGVzIG11bHRpcGxlIGBzdHJpbmdgIHNlbGVjdG9ycywgb25seSBvbmUgYFRlc3RFbGVtZW50YCBpbnN0YW5jZSBpcyByZXR1cm5lZFxuICAgKiAgIGZvciB0aGF0IGVsZW1lbnQuIFRoZSB0eXBlIHRoYXQgdGhlIGBQcm9taXNlYCByZXNvbHZlcyB0byBpcyBhbiBhcnJheSB3aGVyZSBlYWNoIGVsZW1lbnQgaXNcbiAgICogICB0aGUgdW5pb24gb2YgYWxsIHJlc3VsdCB0eXBlcyBmb3IgZWFjaCBxdWVyeS5cbiAgICpcbiAgICogZS5nLiBHaXZlbiB0aGUgZm9sbG93aW5nIERPTTogYDxkaXYgaWQ9XCJkMVwiIC8+PGRpdiBpZD1cImQyXCIgLz5gLCBhbmQgYXNzdW1pbmdcbiAgICogYERpdkhhcm5lc3MuaG9zdFNlbGVjdG9yID09PSAnZGl2J2AgYW5kIGBJZElzRDFIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJyNkMSdgOlxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yQWxsKERpdkhhcm5lc3MsICdkaXYnKSgpYCBnZXRzIGBbXG4gICAqICAgICBEaXZIYXJuZXNzLCAvLyBmb3IgI2QxXG4gICAqICAgICBUZXN0RWxlbWVudCwgLy8gZm9yICNkMVxuICAgKiAgICAgRGl2SGFybmVzcywgLy8gZm9yICNkMlxuICAgKiAgICAgVGVzdEVsZW1lbnQgLy8gZm9yICNkMlxuICAgKiAgIF1gXG4gICAqIC0gYGF3YWl0IGNoLmxvY2F0b3JGb3JBbGwoJ2RpdicsICcjZDEnKSgpYCBnZXRzIGBbXG4gICAqICAgICBUZXN0RWxlbWVudCwgLy8gZm9yICNkMVxuICAgKiAgICAgVGVzdEVsZW1lbnQgLy8gZm9yICNkMlxuICAgKiAgIF1gXG4gICAqIC0gYGF3YWl0IGNoLmxvY2F0b3JGb3JBbGwoRGl2SGFybmVzcywgSWRJc0QxSGFybmVzcykoKWAgZ2V0cyBgW1xuICAgKiAgICAgRGl2SGFybmVzcywgLy8gZm9yICNkMVxuICAgKiAgICAgSWRJc0QxSGFybmVzcywgLy8gZm9yICNkMVxuICAgKiAgICAgRGl2SGFybmVzcyAvLyBmb3IgI2QyXG4gICAqICAgXWBcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvckFsbCgnc3BhbicpKClgIGdldHMgYFtdYC5cbiAgICovXG4gIHByb3RlY3RlZCBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+W10+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRmFjdG9yeS5sb2NhdG9yRm9yQWxsKC4uLnF1ZXJpZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZsdXNoZXMgY2hhbmdlIGRldGVjdGlvbiBhbmQgYXN5bmMgdGFza3MgaW4gdGhlIEFuZ3VsYXIgem9uZS5cbiAgICogSW4gbW9zdCBjYXNlcyBpdCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgbWFudWFsbHkuIEhvd2V2ZXIsIHRoZXJlIG1heSBiZSBzb21lIGVkZ2VcbiAgICogY2FzZXMgd2hlcmUgaXQgaXMgbmVlZGVkIHRvIGZ1bGx5IGZsdXNoIGFuaW1hdGlvbiBldmVudHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZm9yY2VTdGFiaWxpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkuZm9yY2VTdGFiaWxpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXYWl0cyBmb3IgYWxsIHNjaGVkdWxlZCBvciBydW5uaW5nIGFzeW5jIHRhc2tzIHRvIGNvbXBsZXRlLiBUaGlzIGFsbG93cyBoYXJuZXNzXG4gICAqIGF1dGhvcnMgdG8gd2FpdCBmb3IgYXN5bmMgdGFza3Mgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHdhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCkge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LndhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCk7XG4gIH1cbn1cblxuLyoqIENvbnN0cnVjdG9yIGZvciBhIENvbXBvbmVudEhhcm5lc3Mgc3ViY2xhc3MuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ge1xuICBuZXcobG9jYXRvckZhY3Rvcnk6IExvY2F0b3JGYWN0b3J5KTogVDtcblxuICAvKipcbiAgICogYENvbXBvbmVudEhhcm5lc3NgIHN1YmNsYXNzZXMgbXVzdCBzcGVjaWZ5IGEgc3RhdGljIGBob3N0U2VsZWN0b3JgIHByb3BlcnR5IHRoYXQgaXMgdXNlZCB0b1xuICAgKiBmaW5kIHRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBjb3JyZXNwb25kaW5nIGNvbXBvbmVudC4gVGhpcyBwcm9wZXJ0eSBzaG91bGQgbWF0Y2ggdGhlIHNlbGVjdG9yXG4gICAqIGZvciB0aGUgQW5ndWxhciBjb21wb25lbnQuXG4gICAqL1xuICBob3N0U2VsZWN0b3I6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCYXNlSGFybmVzc0ZpbHRlcnMge1xuICAvKiogT25seSBmaW5kIGNvbXBvbmVudCBpbnN0YW5jZXMgd2hvc2UgaG9zdCBlbGVtZW50IG1hdGNoZXMgdGhlIGdpdmVuIHNlbGVjdG9yLiAqL1xuICBzZWxlY3Rvcj86IHN0cmluZztcbiAgLyoqIE9ubHkgZmluZCBjb21wb25lbnQgaW5zdGFuY2VzIHRoYXQgYXJlIG5lc3RlZCB1bmRlciBhbiBlbGVtZW50IHdpdGggdGhlIGdpdmVuIHNlbGVjdG9yLiAqL1xuICBhbmNlc3Rvcj86IHN0cmluZztcbn1cblxuLyoqXG4gKiBBIGNsYXNzIHVzZWQgdG8gYXNzb2NpYXRlIGEgQ29tcG9uZW50SGFybmVzcyBjbGFzcyB3aXRoIHByZWRpY2F0ZXMgZnVuY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgdG9cbiAqIGZpbHRlciBpbnN0YW5jZXMgb2YgdGhlIGNsYXNzLlxuICovXG5leHBvcnQgY2xhc3MgSGFybmVzc1ByZWRpY2F0ZTxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ge1xuICBwcml2YXRlIF9wcmVkaWNhdGVzOiBBc3luY1ByZWRpY2F0ZTxUPltdID0gW107XG4gIHByaXZhdGUgX2Rlc2NyaXB0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBfYW5jZXN0b3I6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiwgb3B0aW9uczogQmFzZUhhcm5lc3NGaWx0ZXJzKSB7XG4gICAgdGhpcy5fYWRkQmFzZU9wdGlvbnMob3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgc3RyaW5nIG1hdGNoZXMgdGhlIGdpdmVuIHBhdHRlcm4uXG4gICAqIEBwYXJhbSBzIFRoZSBzdHJpbmcgdG8gY2hlY2ssIG9yIGEgUHJvbWlzZSBmb3IgdGhlIHN0cmluZyB0byBjaGVjay5cbiAgICogQHBhcmFtIHBhdHRlcm4gVGhlIHBhdHRlcm4gdGhlIHN0cmluZyBpcyBleHBlY3RlZCB0byBtYXRjaC4gSWYgYHBhdHRlcm5gIGlzIGEgc3RyaW5nLCBgc2AgaXNcbiAgICogICBleHBlY3RlZCB0byBtYXRjaCBleGFjdGx5LiBJZiBgcGF0dGVybmAgaXMgYSByZWdleCwgYSBwYXJ0aWFsIG1hdGNoIGlzIGFsbG93ZWQuXG4gICAqIEByZXR1cm4gQSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gd2hldGhlciB0aGUgc3RyaW5nIG1hdGNoZXMgdGhlIHBhdHRlcm4uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgc3RyaW5nTWF0Y2hlcyhzOiBzdHJpbmcgfCBQcm9taXNlPHN0cmluZz4sIHBhdHRlcm46IHN0cmluZyB8IFJlZ0V4cCk6XG4gICAgICBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBzID0gYXdhaXQgcztcbiAgICByZXR1cm4gdHlwZW9mIHBhdHRlcm4gPT09ICdzdHJpbmcnID8gcyA9PT0gcGF0dGVybiA6IHBhdHRlcm4udGVzdChzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRvIGJlIHJ1biBhZ2FpbnN0IGNhbmRpZGF0ZSBoYXJuZXNzZXMuXG4gICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBBIGRlc2NyaXB0aW9uIG9mIHRoaXMgcHJlZGljYXRlIHRoYXQgbWF5IGJlIHVzZWQgaW4gZXJyb3IgbWVzc2FnZXMuXG4gICAqIEBwYXJhbSBwcmVkaWNhdGUgQW4gYXN5bmMgcHJlZGljYXRlIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHRoaXMgKGZvciBtZXRob2QgY2hhaW5pbmcpLlxuICAgKi9cbiAgYWRkKGRlc2NyaXB0aW9uOiBzdHJpbmcsIHByZWRpY2F0ZTogQXN5bmNQcmVkaWNhdGU8VD4pIHtcbiAgICB0aGlzLl9kZXNjcmlwdGlvbnMucHVzaChkZXNjcmlwdGlvbik7XG4gICAgdGhpcy5fcHJlZGljYXRlcy5wdXNoKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGRlcGVuZHMgb24gYW4gb3B0aW9uIHZhbHVlIHRvIGJlIHJ1biBhZ2FpbnN0IGNhbmRpZGF0ZVxuICAgKiBoYXJuZXNzZXMuIElmIHRoZSBvcHRpb24gdmFsdWUgaXMgdW5kZWZpbmVkLCB0aGUgcHJlZGljYXRlIHdpbGwgYmUgaWdub3JlZC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIG9wdGlvbiAobWF5IGJlIHVzZWQgaW4gZXJyb3IgbWVzc2FnZXMpLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdmFsdWUuXG4gICAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHByZWRpY2F0ZSBmdW5jdGlvbiB0byBydW4gaWYgdGhlIG9wdGlvbiB2YWx1ZSBpcyBub3QgdW5kZWZpbmVkLlxuICAgKiBAcmV0dXJuIHRoaXMgKGZvciBtZXRob2QgY2hhaW5pbmcpLlxuICAgKi9cbiAgYWRkT3B0aW9uPE8+KG5hbWU6IHN0cmluZywgb3B0aW9uOiBPIHwgdW5kZWZpbmVkLCBwcmVkaWNhdGU6IEFzeW5jT3B0aW9uUHJlZGljYXRlPFQsIE8+KSB7XG4gICAgaWYgKG9wdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmFkZChgJHtuYW1lfSA9ICR7X3ZhbHVlQXNTdHJpbmcob3B0aW9uKX1gLCBpdGVtID0+IHByZWRpY2F0ZShpdGVtLCBvcHRpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVycyBhIGxpc3Qgb2YgaGFybmVzc2VzIG9uIHRoaXMgcHJlZGljYXRlLlxuICAgKiBAcGFyYW0gaGFybmVzc2VzIFRoZSBsaXN0IG9mIGhhcm5lc3NlcyB0byBmaWx0ZXIuXG4gICAqIEByZXR1cm4gQSBsaXN0IG9mIGhhcm5lc3NlcyB0aGF0IHNhdGlzZnkgdGhpcyBwcmVkaWNhdGUuXG4gICAqL1xuICBhc3luYyBmaWx0ZXIoaGFybmVzc2VzOiBUW10pOiBQcm9taXNlPFRbXT4ge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChoYXJuZXNzZXMubWFwKGggPT4gdGhpcy5ldmFsdWF0ZShoKSkpO1xuICAgIHJldHVybiBoYXJuZXNzZXMuZmlsdGVyKChfLCBpKSA9PiByZXN1bHRzW2ldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZXMgd2hldGhlciB0aGUgZ2l2ZW4gaGFybmVzcyBzYXRpc2ZpZXMgdGhpcyBwcmVkaWNhdGUuXG4gICAqIEBwYXJhbSBoYXJuZXNzIFRoZSBoYXJuZXNzIHRvIGNoZWNrXG4gICAqIEByZXR1cm4gQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdHJ1ZSBpZiB0aGUgaGFybmVzcyBzYXRpc2ZpZXMgdGhpcyBwcmVkaWNhdGUsXG4gICAqICAgYW5kIHJlc29sdmVzIHRvIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGFzeW5jIGV2YWx1YXRlKGhhcm5lc3M6IFQpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5fcHJlZGljYXRlcy5tYXAocCA9PiBwKGhhcm5lc3MpKSk7XG4gICAgcmV0dXJuIHJlc3VsdHMucmVkdWNlKChjb21iaW5lZCwgY3VycmVudCkgPT4gY29tYmluZWQgJiYgY3VycmVudCwgdHJ1ZSk7XG4gIH1cblxuICAvKiogR2V0cyBhIGRlc2NyaXB0aW9uIG9mIHRoaXMgcHJlZGljYXRlIGZvciB1c2UgaW4gZXJyb3IgbWVzc2FnZXMuICovXG4gIGdldERlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvbnMuam9pbignLCAnKTtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzZWxlY3RvciB1c2VkIHRvIGZpbmQgY2FuZGlkYXRlIGVsZW1lbnRzLiAqL1xuICBnZXRTZWxlY3RvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fYW5jZXN0b3Iuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHBhcnQgPT4gYCR7cGFydC50cmltKCl9ICR7dGhpcy5oYXJuZXNzVHlwZS5ob3N0U2VsZWN0b3J9YC50cmltKCkpXG4gICAgICAgIC5qb2luKCcsJyk7XG4gIH1cblxuICAvKiogQWRkcyBiYXNlIG9wdGlvbnMgY29tbW9uIHRvIGFsbCBoYXJuZXNzIHR5cGVzLiAqL1xuICBwcml2YXRlIF9hZGRCYXNlT3B0aW9ucyhvcHRpb25zOiBCYXNlSGFybmVzc0ZpbHRlcnMpIHtcbiAgICB0aGlzLl9hbmNlc3RvciA9IG9wdGlvbnMuYW5jZXN0b3IgfHwgJyc7XG4gICAgaWYgKHRoaXMuX2FuY2VzdG9yKSB7XG4gICAgICB0aGlzLl9kZXNjcmlwdGlvbnMucHVzaChgaGFzIGFuY2VzdG9yIG1hdGNoaW5nIHNlbGVjdG9yIFwiJHt0aGlzLl9hbmNlc3Rvcn1cImApO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RvciA9IG9wdGlvbnMuc2VsZWN0b3I7XG4gICAgaWYgKHNlbGVjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuYWRkKGBob3N0IG1hdGNoZXMgc2VsZWN0b3IgXCIke3NlbGVjdG9yfVwiYCwgYXN5bmMgaXRlbSA9PiB7XG4gICAgICAgIHJldHVybiAoYXdhaXQgaXRlbS5ob3N0KCkpLm1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlcHJlc2VudCBhIHZhbHVlIGFzIGEgc3RyaW5nIGZvciB0aGUgcHVycG9zZSBvZiBsb2dnaW5nLiAqL1xuZnVuY3Rpb24gX3ZhbHVlQXNTdHJpbmcodmFsdWU6IHVua25vd24pIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH1cbiAgLy8gYEpTT04uc3RyaW5naWZ5YCBkb2Vzbid0IGhhbmRsZSBSZWdFeHAgcHJvcGVybHksIHNvIHdlIG5lZWQgYSBjdXN0b20gcmVwbGFjZXIuXG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlLCAoXywgdikgPT5cbiAgICAgICAgdiBpbnN0YW5jZW9mIFJlZ0V4cCA/IGAvJHt2LnRvU3RyaW5nKCl9L2AgOlxuICAgICAgICAgICAgdHlwZW9mIHYgPT09ICdzdHJpbmcnID8gdi5yZXBsYWNlKCcvXFwvL2cnLCAnXFxcXC8nKSA6IHZcbiAgICApLnJlcGxhY2UoL1wiXFwvXFwvL2csICdcXFxcLycpLnJlcGxhY2UoL1xcL1xcL1wiL2csICdcXFxcLycpLnJlcGxhY2UoL1xcXFxcXC8vZywgJy8nKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gYEpTT04uc3RyaW5naWZ5YCB3aWxsIHRocm93IGlmIHRoZSBvYmplY3QgaXMgY3ljbGljYWwsXG4gICAgLy8gaW4gdGhpcyBjYXNlIHRoZSBiZXN0IHdlIGNhbiBkbyBpcyByZXBvcnQgdGhlIHZhbHVlIGFzIGB7Li4ufWAuXG4gICAgcmV0dXJuICd7Li4ufSc7XG4gIH1cbn1cbiJdfQ==