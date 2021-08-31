/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { parallel } from './change-detection';
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
 * Base class for component harnesses that authors should extend if they anticipate that consumers
 * of the harness may want to access other harnesses within the `<ng-content>` of the component.
 */
export class ContentContainerComponentHarness extends ComponentHarness {
    getChildLoader(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getRootHarnessLoader()).getChildLoader(selector);
        });
    }
    getAllChildLoaders(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getRootHarnessLoader()).getAllChildLoaders(selector);
        });
    }
    getHarness(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getRootHarnessLoader()).getHarness(query);
        });
    }
    getAllHarnesses(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getRootHarnessLoader()).getAllHarnesses(query);
        });
    }
    /**
     * Gets the root harness loader from which to start
     * searching for content contained by this harness.
     */
    getRootHarnessLoader() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.locatorFactory.rootHarnessLoader();
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
     * Checks if the specified nullable string value matches the given pattern.
     * @param value The nullable string value to check, or a Promise resolving to the
     *   nullable string value.
     * @param pattern The pattern the value is expected to match. If `pattern` is a string,
     *   `value` is expected to match exactly. If `pattern` is a regex, a partial match is
     *   allowed. If `pattern` is `null`, the value is expected to be `null`.
     * @return Whether the value matches the pattern.
     */
    static stringMatches(value, pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            value = yield value;
            if (pattern === null) {
                return value === null;
            }
            else if (value === null) {
                return false;
            }
            return typeof pattern === 'string' ? value === pattern : pattern.test(value);
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
            if (harnesses.length === 0) {
                return [];
            }
            const results = yield parallel(() => harnesses.map(h => this.evaluate(h)));
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
            const results = yield parallel(() => this._predicates.map(p => p(harness)));
            return results.reduce((combined, current) => combined && current, true);
        });
    }
    /** Gets a description of this predicate for use in error messages. */
    getDescription() {
        return this._descriptions.join(', ');
    }
    /** Gets the selector used to find candidate elements. */
    getSelector() {
        // We don't have to go through the extra trouble if there are no ancestors.
        if (!this._ancestor) {
            return (this.harnessType.hostSelector || '').trim();
        }
        const [ancestors, ancestorPlaceholders] = _splitAndEscapeSelector(this._ancestor);
        const [selectors, selectorPlaceholders] = _splitAndEscapeSelector(this.harnessType.hostSelector || '');
        const result = [];
        // We have to add the ancestor to each part of the host compound selector, otherwise we can get
        // incorrect results. E.g. `.ancestor .a, .ancestor .b` vs `.ancestor .a, .b`.
        ancestors.forEach(escapedAncestor => {
            const ancestor = _restoreSelector(escapedAncestor, ancestorPlaceholders);
            return selectors.forEach(escapedSelector => result.push(`${ancestor} ${_restoreSelector(escapedSelector, selectorPlaceholders)}`));
        });
        return result.join(', ');
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
    try {
        // `JSON.stringify` doesn't handle RegExp properly, so we need a custom replacer.
        // Use a character that is unlikely to appear in real strings to denote the start and end of
        // the regex. This allows us to strip out the extra quotes around the value added by
        // `JSON.stringify`. Also do custom escaping on `"` characters to prevent `JSON.stringify`
        // from escaping them as if they were part of a string.
        const stringifiedValue = JSON.stringify(value, (_, v) => v instanceof RegExp ?
            `◬MAT_RE_ESCAPE◬${v.toString().replace(/"/g, '◬MAT_RE_ESCAPE◬')}◬MAT_RE_ESCAPE◬` : v);
        // Strip out the extra quotes around regexes and put back the manually escaped `"` characters.
        return stringifiedValue
            .replace(/"◬MAT_RE_ESCAPE◬|◬MAT_RE_ESCAPE◬"/g, '')
            .replace(/◬MAT_RE_ESCAPE◬/g, '"');
    }
    catch (_a) {
        // `JSON.stringify` will throw if the object is cyclical,
        // in this case the best we can do is report the value as `{...}`.
        return '{...}';
    }
}
/**
 * Splits up a compound selector into its parts and escapes any quoted content. The quoted content
 * has to be escaped, because it can contain commas which will throw throw us off when trying to
 * split it.
 * @param selector Selector to be split.
 * @returns The escaped string where any quoted content is replaced with a placeholder. E.g.
 * `[foo="bar"]` turns into `[foo=__cdkPlaceholder-0__]`. Use `_restoreSelector` to restore
 * the placeholders.
 */
function _splitAndEscapeSelector(selector) {
    const placeholders = [];
    // Note that the regex doesn't account for nested quotes so something like `"ab'cd'e"` will be
    // considered as two blocks. It's a bit of an edge case, but if we find that it's a problem,
    // we can make it a bit smarter using a loop. Use this for now since it's more readable and
    // compact. More complete implementation:
    // https://github.com/angular/angular/blob/bd34bc9e89f18a/packages/compiler/src/shadow_css.ts#L655
    const result = selector.replace(/(["'][^["']*["'])/g, (_, keep) => {
        const replaceBy = `__cdkPlaceholder-${placeholders.length}__`;
        placeholders.push(keep);
        return replaceBy;
    });
    return [result.split(',').map(part => part.trim()), placeholders];
}
/** Restores a selector whose content was escaped in `_splitAndEscapeSelector`. */
function _restoreSelector(selector, placeholders) {
    return selector.replace(/__cdkPlaceholder-(\d+)__/g, (_, index) => placeholders[+index]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWhhcm5lc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvY29tcG9uZW50LWhhcm5lc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQTZPNUM7Ozs7R0FJRztBQUNILE1BQU0sT0FBZ0IsZ0JBQWdCO0lBQ3BDLFlBQStCLGNBQThCO1FBQTlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtJQUFHLENBQUM7SUFFakUsNkZBQTZGO0lBQ3ZGLElBQUk7O1lBQ1IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQztRQUN6QyxDQUFDO0tBQUE7SUFFRDs7OztPQUlHO0lBQ08sMEJBQTBCO1FBQ2xDLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO0lBQzFELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FvQkc7SUFDTyxVQUFVLENBQTJDLEdBQUcsT0FBVTtRQUUxRSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW9CRztJQUNPLGtCQUFrQixDQUEyQyxHQUFHLE9BQVU7UUFFbEYsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW1DRztJQUNPLGFBQWEsQ0FBMkMsR0FBRyxPQUFVO1FBRTdFLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNhLGNBQWM7O1lBQzVC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WUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRCxrRkFBa0Y7QUFDbEYsU0FBUyxnQkFBZ0IsQ0FBQyxRQUFnQixFQUFFLFlBQXNCO0lBQ2hFLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDM0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3BhcmFsbGVsfSBmcm9tICcuL2NoYW5nZS1kZXRlY3Rpb24nO1xuaW1wb3J0IHtUZXN0RWxlbWVudH0gZnJvbSAnLi90ZXN0LWVsZW1lbnQnO1xuXG4vKiogQW4gYXN5bmMgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZSB3aGVuIGNhbGxlZC4gKi9cbmV4cG9ydCB0eXBlIEFzeW5jRmFjdG9yeUZuPFQ+ID0gKCkgPT4gUHJvbWlzZTxUPjtcblxuLyoqIEFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gaXRlbSBhbmQgcmV0dXJucyBhIGJvb2xlYW4gcHJvbWlzZSAqL1xuZXhwb3J0IHR5cGUgQXN5bmNQcmVkaWNhdGU8VD4gPSAoaXRlbTogVCkgPT4gUHJvbWlzZTxib29sZWFuPjtcblxuLyoqIEFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gaXRlbSBhbmQgYW4gb3B0aW9uIHZhbHVlIGFuZCByZXR1cm5zIGEgYm9vbGVhbiBwcm9taXNlLiAqL1xuZXhwb3J0IHR5cGUgQXN5bmNPcHRpb25QcmVkaWNhdGU8VCwgTz4gPSAoaXRlbTogVCwgb3B0aW9uOiBPKSA9PiBQcm9taXNlPGJvb2xlYW4+O1xuXG4vKipcbiAqIEEgcXVlcnkgZm9yIGEgYENvbXBvbmVudEhhcm5lc3NgLCB3aGljaCBpcyBleHByZXNzZWQgYXMgZWl0aGVyIGEgYENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcmAgb3JcbiAqIGEgYEhhcm5lc3NQcmVkaWNhdGVgLlxuICovXG5leHBvcnQgdHlwZSBIYXJuZXNzUXVlcnk8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+ID1cbiAgICBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+O1xuXG4vKipcbiAqIFRoZSByZXN1bHQgdHlwZSBvYnRhaW5lZCB3aGVuIHNlYXJjaGluZyB1c2luZyBhIHBhcnRpY3VsYXIgbGlzdCBvZiBxdWVyaWVzLiBUaGlzIHR5cGUgZGVwZW5kcyBvblxuICogdGhlIHBhcnRpY3VsYXIgaXRlbXMgYmVpbmcgcXVlcmllZC5cbiAqIC0gSWYgb25lIG9mIHRoZSBxdWVyaWVzIGlzIGZvciBhIGBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8QzE+YCwgaXQgbWVhbnMgdGhhdCB0aGUgcmVzdWx0XG4gKiAgIG1pZ2h0IGJlIGEgaGFybmVzcyBvZiB0eXBlIGBDMWBcbiAqIC0gSWYgb25lIG9mIHRoZSBxdWVyaWVzIGlzIGZvciBhIGBIYXJuZXNzUHJlZGljYXRlPEMyPmAsIGl0IG1lYW5zIHRoYXQgdGhlIHJlc3VsdCBtaWdodCBiZSBhXG4gKiAgIGhhcm5lc3Mgb2YgdHlwZSBgQzJgXG4gKiAtIElmIG9uZSBvZiB0aGUgcXVlcmllcyBpcyBmb3IgYSBgc3RyaW5nYCwgaXQgbWVhbnMgdGhhdCB0aGUgcmVzdWx0IG1pZ2h0IGJlIGEgYFRlc3RFbGVtZW50YC5cbiAqXG4gKiBTaW5jZSB3ZSBkb24ndCBrbm93IGZvciBzdXJlIHdoaWNoIHF1ZXJ5IHdpbGwgbWF0Y2gsIHRoZSByZXN1bHQgdHlwZSBpZiB0aGUgdW5pb24gb2YgdGhlIHR5cGVzXG4gKiBmb3IgYWxsIHBvc3NpYmxlIHJlc3VsdHMuXG4gKlxuICogZS5nLlxuICogVGhlIHR5cGU6XG4gKiBgTG9jYXRvckZuUmVzdWx0Jmx0O1tcbiAqICAgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yJmx0O015SGFybmVzcyZndDssXG4gKiAgIEhhcm5lc3NQcmVkaWNhdGUmbHQ7TXlPdGhlckhhcm5lc3MmZ3Q7LFxuICogICBzdHJpbmdcbiAqIF0mZ3Q7YFxuICogaXMgZXF1aXZhbGVudCB0bzpcbiAqIGBNeUhhcm5lc3MgfCBNeU90aGVySGFybmVzcyB8IFRlc3RFbGVtZW50YC5cbiAqL1xuZXhwb3J0IHR5cGUgTG9jYXRvckZuUmVzdWx0PFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+ID0ge1xuICBbSSBpbiBrZXlvZiBUXTpcbiAgICAgIC8vIE1hcCBgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPEM+YCB0byBgQ2AuXG4gICAgICBUW0ldIGV4dGVuZHMgbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gaW5mZXIgQyA/IEMgOlxuICAgICAgLy8gTWFwIGBIYXJuZXNzUHJlZGljYXRlPEM+YCB0byBgQ2AuXG4gICAgICBUW0ldIGV4dGVuZHMgeyBoYXJuZXNzVHlwZTogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gaW5mZXIgQyB9ID8gQyA6XG4gICAgICAvLyBNYXAgYHN0cmluZ2AgdG8gYFRlc3RFbGVtZW50YC5cbiAgICAgIFRbSV0gZXh0ZW5kcyBzdHJpbmcgPyBUZXN0RWxlbWVudCA6XG4gICAgICAvLyBNYXAgZXZlcnl0aGluZyBlbHNlIHRvIGBuZXZlcmAgKHNob3VsZCBub3QgaGFwcGVuIGR1ZSB0byB0aGUgdHlwZSBjb25zdHJhaW50IG9uIGBUYCkuXG4gICAgICBuZXZlcjtcbn1bbnVtYmVyXTtcblxuXG4vKipcbiAqIEludGVyZmFjZSB1c2VkIHRvIGxvYWQgQ29tcG9uZW50SGFybmVzcyBvYmplY3RzLiBUaGlzIGludGVyZmFjZSBpcyB1c2VkIGJ5IHRlc3QgYXV0aG9ycyB0b1xuICogaW5zdGFudGlhdGUgYENvbXBvbmVudEhhcm5lc3NgZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSGFybmVzc0xvYWRlciB7XG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYW4gZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBzZWxlY3RvciB1bmRlciB0aGUgY3VycmVudCBpbnN0YW5jZXMncyByb290IGVsZW1lbnQsXG4gICAqIGFuZCByZXR1cm5zIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgbWF0Y2hpbmcgZWxlbWVudC4gSWYgbXVsdGlwbGUgZWxlbWVudHMgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yLCB0aGUgZmlyc3QgaXMgdXNlZC4gSWYgbm8gZWxlbWVudHMgbWF0Y2gsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGUgbmV3IGBIYXJuZXNzTG9hZGVyYFxuICAgKiBAcmV0dXJuIEEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IuXG4gICAqIEB0aHJvd3MgSWYgYSBtYXRjaGluZyBlbGVtZW50IGNhbid0IGJlIGZvdW5kLlxuICAgKi9cbiAgZ2V0Q2hpbGRMb2FkZXIoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj47XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhbGwgZWxlbWVudHMgd2l0aCB0aGUgZ2l2ZW4gc2VsZWN0b3IgdW5kZXIgdGhlIGN1cnJlbnQgaW5zdGFuY2VzJ3Mgcm9vdCBlbGVtZW50LFxuICAgKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBgSGFybmVzc0xvYWRlcmBzLCBvbmUgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudCwgcm9vdGVkIGF0IHRoYXRcbiAgICogZWxlbWVudC5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGUgbmV3IGBIYXJuZXNzTG9hZGVyYFxuICAgKiBAcmV0dXJuIEEgbGlzdCBvZiBgSGFybmVzc0xvYWRlcmBzLCBvbmUgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudCwgcm9vdGVkIGF0IHRoYXQgZWxlbWVudC5cbiAgICovXG4gIGdldEFsbENoaWxkTG9hZGVycyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyW10+O1xuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGNvbXBvbmVudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgdW5kZXIgdGhlXG4gICAqIGBIYXJuZXNzTG9hZGVyYCdzIHJvb3QgZWxlbWVudCwgYW5kIHJldHVybnMgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIHRoYXQgaW5zdGFuY2UuIElmIG11bHRpcGxlXG4gICAqIG1hdGNoaW5nIGNvbXBvbmVudHMgYXJlIGZvdW5kLCBhIGhhcm5lc3MgZm9yIHRoZSBmaXJzdCBvbmUgaXMgcmV0dXJuZWQuIElmIG5vIG1hdGNoaW5nXG4gICAqIGNvbXBvbmVudCBpcyBmb3VuZCwgYW4gZXJyb3IgaXMgdGhyb3duLlxuICAgKiBAcGFyYW0gcXVlcnkgQSBxdWVyeSBmb3IgYSBoYXJuZXNzIHRvIGNyZWF0ZVxuICAgKiBAcmV0dXJuIEFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGVcbiAgICogQHRocm93cyBJZiBhIG1hdGNoaW5nIGNvbXBvbmVudCBpbnN0YW5jZSBjYW4ndCBiZSBmb3VuZC5cbiAgICovXG4gIGdldEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KHF1ZXJ5OiBIYXJuZXNzUXVlcnk8VD4pOiBQcm9taXNlPFQ+O1xuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYWxsIGluc3RhbmNlcyBvZiB0aGUgY29tcG9uZW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSB1bmRlciB0aGVcbiAgICogYEhhcm5lc3NMb2FkZXJgJ3Mgcm9vdCBlbGVtZW50LCBhbmQgcmV0dXJucyBhIGxpc3QgYENvbXBvbmVudEhhcm5lc3NgIGZvciBlYWNoIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gcXVlcnkgQSBxdWVyeSBmb3IgYSBoYXJuZXNzIHRvIGNyZWF0ZVxuICAgKiBAcmV0dXJuIEEgbGlzdCBpbnN0YW5jZXMgb2YgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZS5cbiAgICovXG4gIGdldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ocXVlcnk6IEhhcm5lc3NRdWVyeTxUPik6IFByb21pc2U8VFtdPjtcbn1cblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byBjcmVhdGUgYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb25zIHVzZWQgZmluZCBlbGVtZW50cyBhbmQgY29tcG9uZW50XG4gKiBoYXJuZXNzZXMuIFRoaXMgaW50ZXJmYWNlIGlzIHVzZWQgYnkgYENvbXBvbmVudEhhcm5lc3NgIGF1dGhvcnMgdG8gY3JlYXRlIGxvY2F0b3IgZnVuY3Rpb25zIGZvclxuICogdGhlaXIgYENvbXBvbmVudEhhcm5lc3NgIHN1YmNsYXNzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvY2F0b3JGYWN0b3J5IHtcbiAgLyoqIEdldHMgYSBsb2NhdG9yIGZhY3Rvcnkgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBkb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpOiBMb2NhdG9yRmFjdG9yeTtcblxuICAvKiogVGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAgYXMgYSBgVGVzdEVsZW1lbnRgLiAqL1xuICByb290RWxlbWVudDogVGVzdEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGEgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlXG4gICAqIG9yIGVsZW1lbnQgdW5kZXIgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgdGhlXG4gICAqICAgZmlyc3QgZWxlbWVudCBvciBoYXJuZXNzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZWFyY2ggY3JpdGVyaWEuIE1hdGNoZXMgYXJlIG9yZGVyZWQgZmlyc3QgYnlcbiAgICogICBvcmRlciBpbiB0aGUgRE9NLCBhbmQgc2Vjb25kIGJ5IG9yZGVyIGluIHRoZSBxdWVyaWVzIGxpc3QuIElmIG5vIG1hdGNoZXMgYXJlIGZvdW5kLCB0aGVcbiAgICogICBgUHJvbWlzZWAgcmVqZWN0cy4gVGhlIHR5cGUgdGhhdCB0aGUgYFByb21pc2VgIHJlc29sdmVzIHRvIGlzIGEgdW5pb24gb2YgYWxsIHJlc3VsdCB0eXBlcyBmb3JcbiAgICogICBlYWNoIHF1ZXJ5LlxuICAgKlxuICAgKiBlLmcuIEdpdmVuIHRoZSBmb2xsb3dpbmcgRE9NOiBgPGRpdiBpZD1cImQxXCIgLz48ZGl2IGlkPVwiZDJcIiAvPmAsIGFuZCBhc3N1bWluZ1xuICAgKiBgRGl2SGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICdkaXYnYDpcbiAgICogLSBgYXdhaXQgbGYubG9jYXRvckZvcihEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBhIGBEaXZIYXJuZXNzYCBpbnN0YW5jZSBmb3IgYCNkMWBcbiAgICogLSBgYXdhaXQgbGYubG9jYXRvckZvcignZGl2JywgRGl2SGFybmVzcykoKWAgZ2V0cyBhIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3IoJ3NwYW4nKSgpYCB0aHJvd3MgYmVjYXVzZSB0aGUgYFByb21pc2VgIHJlamVjdHMuXG4gICAqL1xuICBsb2NhdG9yRm9yPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+PjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbmQgYSBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VcbiAgICogb3IgZWxlbWVudCB1bmRlciB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC5cbiAgICogQHBhcmFtIHF1ZXJpZXMgQSBsaXN0IG9mIHF1ZXJpZXMgc3BlY2lmeWluZyB3aGljaCBoYXJuZXNzZXMgYW5kIGVsZW1lbnRzIHRvIHNlYXJjaCBmb3I6XG4gICAqICAgLSBBIGBzdHJpbmdgIHNlYXJjaGVzIGZvciBlbGVtZW50cyBtYXRjaGluZyB0aGUgQ1NTIHNlbGVjdG9yIHNwZWNpZmllZCBieSB0aGUgc3RyaW5nLlxuICAgKiAgIC0gQSBgQ29tcG9uZW50SGFybmVzc2AgY29uc3RydWN0b3Igc2VhcmNoZXMgZm9yIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXMgbWF0Y2hpbmcgdGhlXG4gICAqICAgICBnaXZlbiBjbGFzcy5cbiAgICogICAtIEEgYEhhcm5lc3NQcmVkaWNhdGVgIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZSBnaXZlblxuICAgKiAgICAgcHJlZGljYXRlLlxuICAgKiBAcmV0dXJuIEFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgc2VhcmNoZXMgZm9yIGFuZCByZXR1cm5zIGEgYFByb21pc2VgIGZvciB0aGVcbiAgICogICBmaXJzdCBlbGVtZW50IG9yIGhhcm5lc3MgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlYXJjaCBjcml0ZXJpYS4gTWF0Y2hlcyBhcmUgb3JkZXJlZCBmaXJzdCBieVxuICAgKiAgIG9yZGVyIGluIHRoZSBET00sIGFuZCBzZWNvbmQgYnkgb3JkZXIgaW4gdGhlIHF1ZXJpZXMgbGlzdC4gSWYgbm8gbWF0Y2hlcyBhcmUgZm91bmQsIHRoZVxuICAgKiAgIGBQcm9taXNlYCBpcyByZXNvbHZlZCB3aXRoIGBudWxsYC4gVGhlIHR5cGUgdGhhdCB0aGUgYFByb21pc2VgIHJlc29sdmVzIHRvIGlzIGEgdW5pb24gb2YgYWxsXG4gICAqICAgcmVzdWx0IHR5cGVzIGZvciBlYWNoIHF1ZXJ5IG9yIG51bGwuXG4gICAqXG4gICAqIGUuZy4gR2l2ZW4gdGhlIGZvbGxvd2luZyBET006IGA8ZGl2IGlkPVwiZDFcIiAvPjxkaXYgaWQ9XCJkMlwiIC8+YCwgYW5kIGFzc3VtaW5nXG4gICAqIGBEaXZIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJ2RpdidgOlxuICAgKiAtIGBhd2FpdCBsZi5sb2NhdG9yRm9yT3B0aW9uYWwoRGl2SGFybmVzcywgJ2RpdicpKClgIGdldHMgYSBgRGl2SGFybmVzc2AgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3JPcHRpb25hbCgnZGl2JywgRGl2SGFybmVzcykoKWAgZ2V0cyBhIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3JPcHRpb25hbCgnc3BhbicpKClgIGdldHMgYG51bGxgLlxuICAgKi9cbiAgbG9jYXRvckZvck9wdGlvbmFsPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+IHwgbnVsbD47XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBmaW5kIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXNcbiAgICogb3IgZWxlbWVudHMgdW5kZXIgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgYWxsXG4gICAqICAgZWxlbWVudHMgYW5kIGhhcm5lc3NlcyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VhcmNoIGNyaXRlcmlhLiBNYXRjaGVzIGFyZSBvcmRlcmVkIGZpcnN0IGJ5XG4gICAqICAgb3JkZXIgaW4gdGhlIERPTSwgYW5kIHNlY29uZCBieSBvcmRlciBpbiB0aGUgcXVlcmllcyBsaXN0LiBJZiBhbiBlbGVtZW50IG1hdGNoZXMgbW9yZSB0aGFuXG4gICAqICAgb25lIGBDb21wb25lbnRIYXJuZXNzYCBjbGFzcywgdGhlIGxvY2F0b3IgZ2V0cyBhbiBpbnN0YW5jZSBvZiBlYWNoIGZvciB0aGUgc2FtZSBlbGVtZW50LiBJZlxuICAgKiAgIGFuIGVsZW1lbnQgbWF0Y2hlcyBtdWx0aXBsZSBgc3RyaW5nYCBzZWxlY3RvcnMsIG9ubHkgb25lIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgaXMgcmV0dXJuZWRcbiAgICogICBmb3IgdGhhdCBlbGVtZW50LiBUaGUgdHlwZSB0aGF0IHRoZSBgUHJvbWlzZWAgcmVzb2x2ZXMgdG8gaXMgYW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzXG4gICAqICAgdGhlIHVuaW9uIG9mIGFsbCByZXN1bHQgdHlwZXMgZm9yIGVhY2ggcXVlcnkuXG4gICAqXG4gICAqIGUuZy4gR2l2ZW4gdGhlIGZvbGxvd2luZyBET006IGA8ZGl2IGlkPVwiZDFcIiAvPjxkaXYgaWQ9XCJkMlwiIC8+YCwgYW5kIGFzc3VtaW5nXG4gICAqIGBEaXZIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJ2RpdidgIGFuZCBgSWRJc0QxSGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICcjZDEnYDpcbiAgICogLSBgYXdhaXQgbGYubG9jYXRvckZvckFsbChEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBgW1xuICAgKiAgICAgRGl2SGFybmVzcywgLy8gZm9yICNkMVxuICAgKiAgICAgVGVzdEVsZW1lbnQsIC8vIGZvciAjZDFcbiAgICogICAgIERpdkhhcm5lc3MsIC8vIGZvciAjZDJcbiAgICogICAgIFRlc3RFbGVtZW50IC8vIGZvciAjZDJcbiAgICogICBdYFxuICAgKiAtIGBhd2FpdCBsZi5sb2NhdG9yRm9yQWxsKCdkaXYnLCAnI2QxJykoKWAgZ2V0cyBgW1xuICAgKiAgICAgVGVzdEVsZW1lbnQsIC8vIGZvciAjZDFcbiAgICogICAgIFRlc3RFbGVtZW50IC8vIGZvciAjZDJcbiAgICogICBdYFxuICAgKiAtIGBhd2FpdCBsZi5sb2NhdG9yRm9yQWxsKERpdkhhcm5lc3MsIElkSXNEMUhhcm5lc3MpKClgIGdldHMgYFtcbiAgICogICAgIERpdkhhcm5lc3MsIC8vIGZvciAjZDFcbiAgICogICAgIElkSXNEMUhhcm5lc3MsIC8vIGZvciAjZDFcbiAgICogICAgIERpdkhhcm5lc3MgLy8gZm9yICNkMlxuICAgKiAgIF1gXG4gICAqIC0gYGF3YWl0IGxmLmxvY2F0b3JGb3JBbGwoJ3NwYW4nKSgpYCBnZXRzIGBbXWAuXG4gICAqL1xuICBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+W10+O1xuXG4gIC8qKiBAcmV0dXJuIEEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC4gKi9cbiAgcm9vdEhhcm5lc3NMb2FkZXIoKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyPjtcblxuICAvKipcbiAgICogR2V0cyBhIGBIYXJuZXNzTG9hZGVyYCBpbnN0YW5jZSBmb3IgYW4gZWxlbWVudCB1bmRlciB0aGUgcm9vdCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAuXG4gICAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgZm9yIHRoZSByb290IGVsZW1lbnQuXG4gICAqIEByZXR1cm4gQSBgSGFybmVzc0xvYWRlcmAgcm9vdGVkIGF0IHRoZSBmaXJzdCBlbGVtZW50IG1hdGNoaW5nIHRoZSBnaXZlbiBzZWxlY3Rvci5cbiAgICogQHRocm93cyBJZiBubyBtYXRjaGluZyBlbGVtZW50IGlzIGZvdW5kIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3IuXG4gICAqL1xuICBoYXJuZXNzTG9hZGVyRm9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXI+O1xuXG4gIC8qKlxuICAgKiBHZXRzIGEgYEhhcm5lc3NMb2FkZXJgIGluc3RhbmNlIGZvciBhbiBlbGVtZW50IHVuZGVyIHRoZSByb290IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YFxuICAgKiBAcGFyYW0gc2VsZWN0b3IgVGhlIHNlbGVjdG9yIGZvciB0aGUgcm9vdCBlbGVtZW50LlxuICAgKiBAcmV0dXJuIEEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZmlyc3QgZWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IsIG9yIG51bGwgaWZcbiAgICogICAgIG5vIG1hdGNoaW5nIGVsZW1lbnQgaXMgZm91bmQuXG4gICAqL1xuICBoYXJuZXNzTG9hZGVyRm9yT3B0aW9uYWwoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlciB8IG51bGw+O1xuXG4gIC8qKlxuICAgKiBHZXRzIGEgbGlzdCBvZiBgSGFybmVzc0xvYWRlcmAgaW5zdGFuY2VzLCBvbmUgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudC5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIHJvb3QgZWxlbWVudC5cbiAgICogQHJldHVybiBBIGxpc3Qgb2YgYEhhcm5lc3NMb2FkZXJgLCBvbmUgcm9vdGVkIGF0IGVhY2ggZWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IuXG4gICAqL1xuICBoYXJuZXNzTG9hZGVyRm9yQWxsKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXJbXT47XG5cbiAgLyoqXG4gICAqIEZsdXNoZXMgY2hhbmdlIGRldGVjdGlvbiBhbmQgYXN5bmMgdGFza3MgY2FwdHVyZWQgaW4gdGhlIEFuZ3VsYXIgem9uZS5cbiAgICogSW4gbW9zdCBjYXNlcyBpdCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgbWFudWFsbHkuIEhvd2V2ZXIsIHRoZXJlIG1heSBiZSBzb21lIGVkZ2VcbiAgICogY2FzZXMgd2hlcmUgaXQgaXMgbmVlZGVkIHRvIGZ1bGx5IGZsdXNoIGFuaW1hdGlvbiBldmVudHMuXG4gICAqL1xuICBmb3JjZVN0YWJpbGl6ZSgpOiBQcm9taXNlPHZvaWQ+O1xuXG4gIC8qKlxuICAgKiBXYWl0cyBmb3IgYWxsIHNjaGVkdWxlZCBvciBydW5uaW5nIGFzeW5jIHRhc2tzIHRvIGNvbXBsZXRlLiBUaGlzIGFsbG93cyBoYXJuZXNzXG4gICAqIGF1dGhvcnMgdG8gd2FpdCBmb3IgYXN5bmMgdGFza3Mgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgKi9cbiAgd2FpdEZvclRhc2tzT3V0c2lkZUFuZ3VsYXIoKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBjb21wb25lbnQgaGFybmVzc2VzIHRoYXQgYWxsIGNvbXBvbmVudCBoYXJuZXNzIGF1dGhvcnMgc2hvdWxkIGV4dGVuZC4gVGhpcyBiYXNlXG4gKiBjb21wb25lbnQgaGFybmVzcyBwcm92aWRlcyB0aGUgYmFzaWMgYWJpbGl0eSB0byBsb2NhdGUgZWxlbWVudCBhbmQgc3ViLWNvbXBvbmVudCBoYXJuZXNzLiBJdFxuICogc2hvdWxkIGJlIGluaGVyaXRlZCB3aGVuIGRlZmluaW5nIHVzZXIncyBvd24gaGFybmVzcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudEhhcm5lc3Mge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcmVhZG9ubHkgbG9jYXRvckZhY3Rvcnk6IExvY2F0b3JGYWN0b3J5KSB7fVxuXG4gIC8qKiBHZXRzIGEgYFByb21pc2VgIGZvciB0aGUgYFRlc3RFbGVtZW50YCByZXByZXNlbnRpbmcgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LiAqL1xuICBhc3luYyBob3N0KCk6IFByb21pc2U8VGVzdEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRmFjdG9yeS5yb290RWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgYExvY2F0b3JGYWN0b3J5YCBmb3IgdGhlIGRvY3VtZW50IHJvb3QgZWxlbWVudC4gVGhpcyBmYWN0b3J5IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZVxuICAgKiBsb2NhdG9ycyBmb3IgZWxlbWVudHMgdGhhdCBhIGNvbXBvbmVudCBjcmVhdGVzIG91dHNpZGUgb2YgaXRzIG93biByb290IGVsZW1lbnQuIChlLmcuIGJ5XG4gICAqIGFwcGVuZGluZyB0byBkb2N1bWVudC5ib2R5KS5cbiAgICovXG4gIHByb3RlY3RlZCBkb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpOiBMb2NhdG9yRmFjdG9yeSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkuZG9jdW1lbnRSb290TG9jYXRvckZhY3RvcnkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZVxuICAgKiBvciBlbGVtZW50IHVuZGVyIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhpcyBgQ29tcG9uZW50SGFybmVzc2AuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgdGhlXG4gICAqICAgZmlyc3QgZWxlbWVudCBvciBoYXJuZXNzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZWFyY2ggY3JpdGVyaWEuIE1hdGNoZXMgYXJlIG9yZGVyZWQgZmlyc3QgYnlcbiAgICogICBvcmRlciBpbiB0aGUgRE9NLCBhbmQgc2Vjb25kIGJ5IG9yZGVyIGluIHRoZSBxdWVyaWVzIGxpc3QuIElmIG5vIG1hdGNoZXMgYXJlIGZvdW5kLCB0aGVcbiAgICogICBgUHJvbWlzZWAgcmVqZWN0cy4gVGhlIHR5cGUgdGhhdCB0aGUgYFByb21pc2VgIHJlc29sdmVzIHRvIGlzIGEgdW5pb24gb2YgYWxsIHJlc3VsdCB0eXBlcyBmb3JcbiAgICogICBlYWNoIHF1ZXJ5LlxuICAgKlxuICAgKiBlLmcuIEdpdmVuIHRoZSBmb2xsb3dpbmcgRE9NOiBgPGRpdiBpZD1cImQxXCIgLz48ZGl2IGlkPVwiZDJcIiAvPmAsIGFuZCBhc3N1bWluZ1xuICAgKiBgRGl2SGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICdkaXYnYDpcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvcihEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBhIGBEaXZIYXJuZXNzYCBpbnN0YW5jZSBmb3IgYCNkMWBcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvcignZGl2JywgRGl2SGFybmVzcykoKWAgZ2V0cyBhIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgZm9yIGAjZDFgXG4gICAqIC0gYGF3YWl0IGNoLmxvY2F0b3JGb3IoJ3NwYW4nKSgpYCB0aHJvd3MgYmVjYXVzZSB0aGUgYFByb21pc2VgIHJlamVjdHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgbG9jYXRvckZvcjxUIGV4dGVuZHMgKEhhcm5lc3NRdWVyeTxhbnk+IHwgc3RyaW5nKVtdPiguLi5xdWVyaWVzOiBUKTpcbiAgICAgIEFzeW5jRmFjdG9yeUZuPExvY2F0b3JGblJlc3VsdDxUPj4ge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LmxvY2F0b3JGb3IoLi4ucXVlcmllcyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbmQgYSBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VcbiAgICogb3IgZWxlbWVudCB1bmRlciB0aGUgaG9zdCBlbGVtZW50IG9mIHRoaXMgYENvbXBvbmVudEhhcm5lc3NgLlxuICAgKiBAcGFyYW0gcXVlcmllcyBBIGxpc3Qgb2YgcXVlcmllcyBzcGVjaWZ5aW5nIHdoaWNoIGhhcm5lc3NlcyBhbmQgZWxlbWVudHMgdG8gc2VhcmNoIGZvcjpcbiAgICogICAtIEEgYHN0cmluZ2Agc2VhcmNoZXMgZm9yIGVsZW1lbnRzIG1hdGNoaW5nIHRoZSBDU1Mgc2VsZWN0b3Igc3BlY2lmaWVkIGJ5IHRoZSBzdHJpbmcuXG4gICAqICAgLSBBIGBDb21wb25lbnRIYXJuZXNzYCBjb25zdHJ1Y3RvciBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGVcbiAgICogICAgIGdpdmVuIGNsYXNzLlxuICAgKiAgIC0gQSBgSGFybmVzc1ByZWRpY2F0ZWAgc2VhcmNoZXMgZm9yIGBDb21wb25lbnRIYXJuZXNzYCBpbnN0YW5jZXMgbWF0Y2hpbmcgdGhlIGdpdmVuXG4gICAqICAgICBwcmVkaWNhdGUuXG4gICAqIEByZXR1cm4gQW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBzZWFyY2hlcyBmb3IgYW5kIHJldHVybnMgYSBgUHJvbWlzZWAgZm9yIHRoZVxuICAgKiAgIGZpcnN0IGVsZW1lbnQgb3IgaGFybmVzcyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VhcmNoIGNyaXRlcmlhLiBNYXRjaGVzIGFyZSBvcmRlcmVkIGZpcnN0IGJ5XG4gICAqICAgb3JkZXIgaW4gdGhlIERPTSwgYW5kIHNlY29uZCBieSBvcmRlciBpbiB0aGUgcXVlcmllcyBsaXN0LiBJZiBubyBtYXRjaGVzIGFyZSBmb3VuZCwgdGhlXG4gICAqICAgYFByb21pc2VgIGlzIHJlc29sdmVkIHdpdGggYG51bGxgLiBUaGUgdHlwZSB0aGF0IHRoZSBgUHJvbWlzZWAgcmVzb2x2ZXMgdG8gaXMgYSB1bmlvbiBvZiBhbGxcbiAgICogICByZXN1bHQgdHlwZXMgZm9yIGVhY2ggcXVlcnkgb3IgbnVsbC5cbiAgICpcbiAgICogZS5nLiBHaXZlbiB0aGUgZm9sbG93aW5nIERPTTogYDxkaXYgaWQ9XCJkMVwiIC8+PGRpdiBpZD1cImQyXCIgLz5gLCBhbmQgYXNzdW1pbmdcbiAgICogYERpdkhhcm5lc3MuaG9zdFNlbGVjdG9yID09PSAnZGl2J2A6XG4gICAqIC0gYGF3YWl0IGNoLmxvY2F0b3JGb3JPcHRpb25hbChEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBhIGBEaXZIYXJuZXNzYCBpbnN0YW5jZSBmb3IgYCNkMWBcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvck9wdGlvbmFsKCdkaXYnLCBEaXZIYXJuZXNzKSgpYCBnZXRzIGEgYFRlc3RFbGVtZW50YCBpbnN0YW5jZSBmb3IgYCNkMWBcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvck9wdGlvbmFsKCdzcGFuJykoKWAgZ2V0cyBgbnVsbGAuXG4gICAqL1xuICBwcm90ZWN0ZWQgbG9jYXRvckZvck9wdGlvbmFsPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KC4uLnF1ZXJpZXM6IFQpOlxuICAgICAgQXN5bmNGYWN0b3J5Rm48TG9jYXRvckZuUmVzdWx0PFQ+IHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LmxvY2F0b3JGb3JPcHRpb25hbCguLi5xdWVyaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzXG4gICAqIG9yIGVsZW1lbnRzIHVuZGVyIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhpcyBgQ29tcG9uZW50SGFybmVzc2AuXG4gICAqIEBwYXJhbSBxdWVyaWVzIEEgbGlzdCBvZiBxdWVyaWVzIHNwZWNpZnlpbmcgd2hpY2ggaGFybmVzc2VzIGFuZCBlbGVtZW50cyB0byBzZWFyY2ggZm9yOlxuICAgKiAgIC0gQSBgc3RyaW5nYCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIENTUyBzZWxlY3RvciBzcGVjaWZpZWQgYnkgdGhlIHN0cmluZy5cbiAgICogICAtIEEgYENvbXBvbmVudEhhcm5lc3NgIGNvbnN0cnVjdG9yIHNlYXJjaGVzIGZvciBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzIG1hdGNoaW5nIHRoZVxuICAgKiAgICAgZ2l2ZW4gY2xhc3MuXG4gICAqICAgLSBBIGBIYXJuZXNzUHJlZGljYXRlYCBzZWFyY2hlcyBmb3IgYENvbXBvbmVudEhhcm5lc3NgIGluc3RhbmNlcyBtYXRjaGluZyB0aGUgZ2l2ZW5cbiAgICogICAgIHByZWRpY2F0ZS5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBhbmQgcmV0dXJucyBhIGBQcm9taXNlYCBmb3IgYWxsXG4gICAqICAgZWxlbWVudHMgYW5kIGhhcm5lc3NlcyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VhcmNoIGNyaXRlcmlhLiBNYXRjaGVzIGFyZSBvcmRlcmVkIGZpcnN0IGJ5XG4gICAqICAgb3JkZXIgaW4gdGhlIERPTSwgYW5kIHNlY29uZCBieSBvcmRlciBpbiB0aGUgcXVlcmllcyBsaXN0LiBJZiBhbiBlbGVtZW50IG1hdGNoZXMgbW9yZSB0aGFuXG4gICAqICAgb25lIGBDb21wb25lbnRIYXJuZXNzYCBjbGFzcywgdGhlIGxvY2F0b3IgZ2V0cyBhbiBpbnN0YW5jZSBvZiBlYWNoIGZvciB0aGUgc2FtZSBlbGVtZW50LiBJZlxuICAgKiAgIGFuIGVsZW1lbnQgbWF0Y2hlcyBtdWx0aXBsZSBgc3RyaW5nYCBzZWxlY3RvcnMsIG9ubHkgb25lIGBUZXN0RWxlbWVudGAgaW5zdGFuY2UgaXMgcmV0dXJuZWRcbiAgICogICBmb3IgdGhhdCBlbGVtZW50LiBUaGUgdHlwZSB0aGF0IHRoZSBgUHJvbWlzZWAgcmVzb2x2ZXMgdG8gaXMgYW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzXG4gICAqICAgdGhlIHVuaW9uIG9mIGFsbCByZXN1bHQgdHlwZXMgZm9yIGVhY2ggcXVlcnkuXG4gICAqXG4gICAqIGUuZy4gR2l2ZW4gdGhlIGZvbGxvd2luZyBET006IGA8ZGl2IGlkPVwiZDFcIiAvPjxkaXYgaWQ9XCJkMlwiIC8+YCwgYW5kIGFzc3VtaW5nXG4gICAqIGBEaXZIYXJuZXNzLmhvc3RTZWxlY3RvciA9PT0gJ2RpdidgIGFuZCBgSWRJc0QxSGFybmVzcy5ob3N0U2VsZWN0b3IgPT09ICcjZDEnYDpcbiAgICogLSBgYXdhaXQgY2gubG9jYXRvckZvckFsbChEaXZIYXJuZXNzLCAnZGl2JykoKWAgZ2V0cyBgW1xuICAgKiAgICAgRGl2SGFybmVzcywgLy8gZm9yICNkMVxuICAgKiAgICAgVGVzdEVsZW1lbnQsIC8vIGZvciAjZDFcbiAgICogICAgIERpdkhhcm5lc3MsIC8vIGZvciAjZDJcbiAgICogICAgIFRlc3RFbGVtZW50IC8vIGZvciAjZDJcbiAgICogICBdYFxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yQWxsKCdkaXYnLCAnI2QxJykoKWAgZ2V0cyBgW1xuICAgKiAgICAgVGVzdEVsZW1lbnQsIC8vIGZvciAjZDFcbiAgICogICAgIFRlc3RFbGVtZW50IC8vIGZvciAjZDJcbiAgICogICBdYFxuICAgKiAtIGBhd2FpdCBjaC5sb2NhdG9yRm9yQWxsKERpdkhhcm5lc3MsIElkSXNEMUhhcm5lc3MpKClgIGdldHMgYFtcbiAgICogICAgIERpdkhhcm5lc3MsIC8vIGZvciAjZDFcbiAgICogICAgIElkSXNEMUhhcm5lc3MsIC8vIGZvciAjZDFcbiAgICogICAgIERpdkhhcm5lc3MgLy8gZm9yICNkMlxuICAgKiAgIF1gXG4gICAqIC0gYGF3YWl0IGNoLmxvY2F0b3JGb3JBbGwoJ3NwYW4nKSgpYCBnZXRzIGBbXWAuXG4gICAqL1xuICBwcm90ZWN0ZWQgbG9jYXRvckZvckFsbDxUIGV4dGVuZHMgKEhhcm5lc3NRdWVyeTxhbnk+IHwgc3RyaW5nKVtdPiguLi5xdWVyaWVzOiBUKTpcbiAgICAgIEFzeW5jRmFjdG9yeUZuPExvY2F0b3JGblJlc3VsdDxUPltdPiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkubG9jYXRvckZvckFsbCguLi5xdWVyaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbHVzaGVzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFzeW5jIHRhc2tzIGluIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqIEluIG1vc3QgY2FzZXMgaXQgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnkgdG8gY2FsbCB0aGlzIG1hbnVhbGx5LiBIb3dldmVyLCB0aGVyZSBtYXkgYmUgc29tZSBlZGdlXG4gICAqIGNhc2VzIHdoZXJlIGl0IGlzIG5lZWRlZCB0byBmdWxseSBmbHVzaCBhbmltYXRpb24gZXZlbnRzLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGZvcmNlU3RhYmlsaXplKCkge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LmZvcmNlU3RhYmlsaXplKCk7XG4gIH1cblxuICAvKipcbiAgICogV2FpdHMgZm9yIGFsbCBzY2hlZHVsZWQgb3IgcnVubmluZyBhc3luYyB0YXNrcyB0byBjb21wbGV0ZS4gVGhpcyBhbGxvd3MgaGFybmVzc1xuICAgKiBhdXRob3JzIHRvIHdhaXQgZm9yIGFzeW5jIHRhc2tzIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyB3YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRmFjdG9yeS53YWl0Rm9yVGFza3NPdXRzaWRlQW5ndWxhcigpO1xuICB9XG59XG5cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBjb21wb25lbnQgaGFybmVzc2VzIHRoYXQgYXV0aG9ycyBzaG91bGQgZXh0ZW5kIGlmIHRoZXkgYW50aWNpcGF0ZSB0aGF0IGNvbnN1bWVyc1xuICogb2YgdGhlIGhhcm5lc3MgbWF5IHdhbnQgdG8gYWNjZXNzIG90aGVyIGhhcm5lc3NlcyB3aXRoaW4gdGhlIGA8bmctY29udGVudD5gIG9mIHRoZSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb250ZW50Q29udGFpbmVyQ29tcG9uZW50SGFybmVzczxTIGV4dGVuZHMgc3RyaW5nID0gc3RyaW5nPlxuICBleHRlbmRzIENvbXBvbmVudEhhcm5lc3MgaW1wbGVtZW50cyBIYXJuZXNzTG9hZGVyIHtcblxuICBhc3luYyBnZXRDaGlsZExvYWRlcihzZWxlY3RvcjogUyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRSb290SGFybmVzc0xvYWRlcigpKS5nZXRDaGlsZExvYWRlcihzZWxlY3Rvcik7XG4gIH1cblxuICBhc3luYyBnZXRBbGxDaGlsZExvYWRlcnMoc2VsZWN0b3I6IFMpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXJbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRSb290SGFybmVzc0xvYWRlcigpKS5nZXRBbGxDaGlsZExvYWRlcnMoc2VsZWN0b3IpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SGFybmVzczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ocXVlcnk6IEhhcm5lc3NRdWVyeTxUPik6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRSb290SGFybmVzc0xvYWRlcigpKS5nZXRIYXJuZXNzKHF1ZXJ5KTtcbiAgfVxuXG4gIGFzeW5jIGdldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ocXVlcnk6IEhhcm5lc3NRdWVyeTxUPik6IFByb21pc2U8VFtdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFJvb3RIYXJuZXNzTG9hZGVyKCkpLmdldEFsbEhhcm5lc3NlcyhxdWVyeSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcm9vdCBoYXJuZXNzIGxvYWRlciBmcm9tIHdoaWNoIHRvIHN0YXJ0XG4gICAqIHNlYXJjaGluZyBmb3IgY29udGVudCBjb250YWluZWQgYnkgdGhpcyBoYXJuZXNzLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldFJvb3RIYXJuZXNzTG9hZGVyKCk6IFByb21pc2U8SGFybmVzc0xvYWRlcj4ge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LnJvb3RIYXJuZXNzTG9hZGVyKCk7XG4gIH1cbn1cblxuLyoqIENvbnN0cnVjdG9yIGZvciBhIENvbXBvbmVudEhhcm5lc3Mgc3ViY2xhc3MuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ge1xuICBuZXcobG9jYXRvckZhY3Rvcnk6IExvY2F0b3JGYWN0b3J5KTogVDtcblxuICAvKipcbiAgICogYENvbXBvbmVudEhhcm5lc3NgIHN1YmNsYXNzZXMgbXVzdCBzcGVjaWZ5IGEgc3RhdGljIGBob3N0U2VsZWN0b3JgIHByb3BlcnR5IHRoYXQgaXMgdXNlZCB0b1xuICAgKiBmaW5kIHRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBjb3JyZXNwb25kaW5nIGNvbXBvbmVudC4gVGhpcyBwcm9wZXJ0eSBzaG91bGQgbWF0Y2ggdGhlIHNlbGVjdG9yXG4gICAqIGZvciB0aGUgQW5ndWxhciBjb21wb25lbnQuXG4gICAqL1xuICBob3N0U2VsZWN0b3I6IHN0cmluZztcbn1cblxuLyoqIEEgc2V0IG9mIGNyaXRlcmlhIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmlsdGVyIGEgbGlzdCBvZiBgQ29tcG9uZW50SGFybmVzc2AgaW5zdGFuY2VzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBCYXNlSGFybmVzc0ZpbHRlcnMge1xuICAvKiogT25seSBmaW5kIGluc3RhbmNlcyB3aG9zZSBob3N0IGVsZW1lbnQgbWF0Y2hlcyB0aGUgZ2l2ZW4gc2VsZWN0b3IuICovXG4gIHNlbGVjdG9yPzogc3RyaW5nO1xuICAvKiogT25seSBmaW5kIGluc3RhbmNlcyB0aGF0IGFyZSBuZXN0ZWQgdW5kZXIgYW4gZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBzZWxlY3Rvci4gKi9cbiAgYW5jZXN0b3I/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSBjbGFzcyB1c2VkIHRvIGFzc29jaWF0ZSBhIENvbXBvbmVudEhhcm5lc3MgY2xhc3Mgd2l0aCBwcmVkaWNhdGVzIGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvXG4gKiBmaWx0ZXIgaW5zdGFuY2VzIG9mIHRoZSBjbGFzcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEhhcm5lc3NQcmVkaWNhdGU8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+IHtcbiAgcHJpdmF0ZSBfcHJlZGljYXRlczogQXN5bmNQcmVkaWNhdGU8VD5bXSA9IFtdO1xuICBwcml2YXRlIF9kZXNjcmlwdGlvbnM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgX2FuY2VzdG9yOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4sIG9wdGlvbnM6IEJhc2VIYXJuZXNzRmlsdGVycykge1xuICAgIHRoaXMuX2FkZEJhc2VPcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc3BlY2lmaWVkIG51bGxhYmxlIHN0cmluZyB2YWx1ZSBtYXRjaGVzIHRoZSBnaXZlbiBwYXR0ZXJuLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG51bGxhYmxlIHN0cmluZyB2YWx1ZSB0byBjaGVjaywgb3IgYSBQcm9taXNlIHJlc29sdmluZyB0byB0aGVcbiAgICogICBudWxsYWJsZSBzdHJpbmcgdmFsdWUuXG4gICAqIEBwYXJhbSBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRoZSB2YWx1ZSBpcyBleHBlY3RlZCB0byBtYXRjaC4gSWYgYHBhdHRlcm5gIGlzIGEgc3RyaW5nLFxuICAgKiAgIGB2YWx1ZWAgaXMgZXhwZWN0ZWQgdG8gbWF0Y2ggZXhhY3RseS4gSWYgYHBhdHRlcm5gIGlzIGEgcmVnZXgsIGEgcGFydGlhbCBtYXRjaCBpc1xuICAgKiAgIGFsbG93ZWQuIElmIGBwYXR0ZXJuYCBpcyBgbnVsbGAsIHRoZSB2YWx1ZSBpcyBleHBlY3RlZCB0byBiZSBgbnVsbGAuXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgdmFsdWUgbWF0Y2hlcyB0aGUgcGF0dGVybi5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBzdHJpbmdNYXRjaGVzKHZhbHVlOiBzdHJpbmcgfCBudWxsIHwgUHJvbWlzZTxzdHJpbmcgfCBudWxsPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjogc3RyaW5nIHwgUmVnRXhwIHwgbnVsbCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHZhbHVlID0gYXdhaXQgdmFsdWU7XG4gICAgaWYgKHBhdHRlcm4gPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycgPyB2YWx1ZSA9PT0gcGF0dGVybiA6IHBhdHRlcm4udGVzdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0byBiZSBydW4gYWdhaW5zdCBjYW5kaWRhdGUgaGFybmVzc2VzLlxuICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gQSBkZXNjcmlwdGlvbiBvZiB0aGlzIHByZWRpY2F0ZSB0aGF0IG1heSBiZSB1c2VkIGluIGVycm9yIG1lc3NhZ2VzLlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIEFuIGFzeW5jIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiB0aGlzIChmb3IgbWV0aG9kIGNoYWluaW5nKS5cbiAgICovXG4gIGFkZChkZXNjcmlwdGlvbjogc3RyaW5nLCBwcmVkaWNhdGU6IEFzeW5jUHJlZGljYXRlPFQ+KSB7XG4gICAgdGhpcy5fZGVzY3JpcHRpb25zLnB1c2goZGVzY3JpcHRpb24pO1xuICAgIHRoaXMuX3ByZWRpY2F0ZXMucHVzaChwcmVkaWNhdGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBkZXBlbmRzIG9uIGFuIG9wdGlvbiB2YWx1ZSB0byBiZSBydW4gYWdhaW5zdCBjYW5kaWRhdGVcbiAgICogaGFybmVzc2VzLiBJZiB0aGUgb3B0aW9uIHZhbHVlIGlzIHVuZGVmaW5lZCwgdGhlIHByZWRpY2F0ZSB3aWxsIGJlIGlnbm9yZWQuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBvcHRpb24gKG1heSBiZSB1c2VkIGluIGVycm9yIG1lc3NhZ2VzKS5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHZhbHVlLlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gdG8gcnVuIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgbm90IHVuZGVmaW5lZC5cbiAgICogQHJldHVybiB0aGlzIChmb3IgbWV0aG9kIGNoYWluaW5nKS5cbiAgICovXG4gIGFkZE9wdGlvbjxPPihuYW1lOiBzdHJpbmcsIG9wdGlvbjogTyB8IHVuZGVmaW5lZCwgcHJlZGljYXRlOiBBc3luY09wdGlvblByZWRpY2F0ZTxULCBPPikge1xuICAgIGlmIChvcHRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5hZGQoYCR7bmFtZX0gPSAke192YWx1ZUFzU3RyaW5nKG9wdGlvbil9YCwgaXRlbSA9PiBwcmVkaWNhdGUoaXRlbSwgb3B0aW9uKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbHRlcnMgYSBsaXN0IG9mIGhhcm5lc3NlcyBvbiB0aGlzIHByZWRpY2F0ZS5cbiAgICogQHBhcmFtIGhhcm5lc3NlcyBUaGUgbGlzdCBvZiBoYXJuZXNzZXMgdG8gZmlsdGVyLlxuICAgKiBAcmV0dXJuIEEgbGlzdCBvZiBoYXJuZXNzZXMgdGhhdCBzYXRpc2Z5IHRoaXMgcHJlZGljYXRlLlxuICAgKi9cbiAgYXN5bmMgZmlsdGVyKGhhcm5lc3NlczogVFtdKTogUHJvbWlzZTxUW10+IHtcbiAgICBpZiAoaGFybmVzc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgcGFyYWxsZWwoKCkgPT4gaGFybmVzc2VzLm1hcChoID0+IHRoaXMuZXZhbHVhdGUoaCkpKTtcbiAgICByZXR1cm4gaGFybmVzc2VzLmZpbHRlcigoXywgaSkgPT4gcmVzdWx0c1tpXSk7XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGVzIHdoZXRoZXIgdGhlIGdpdmVuIGhhcm5lc3Mgc2F0aXNmaWVzIHRoaXMgcHJlZGljYXRlLlxuICAgKiBAcGFyYW0gaGFybmVzcyBUaGUgaGFybmVzcyB0byBjaGVja1xuICAgKiBAcmV0dXJuIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRydWUgaWYgdGhlIGhhcm5lc3Mgc2F0aXNmaWVzIHRoaXMgcHJlZGljYXRlLFxuICAgKiAgIGFuZCByZXNvbHZlcyB0byBmYWxzZSBvdGhlcndpc2UuXG4gICAqL1xuICBhc3luYyBldmFsdWF0ZShoYXJuZXNzOiBUKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHBhcmFsbGVsKCgpID0+IHRoaXMuX3ByZWRpY2F0ZXMubWFwKHAgPT4gcChoYXJuZXNzKSkpO1xuICAgIHJldHVybiByZXN1bHRzLnJlZHVjZSgoY29tYmluZWQsIGN1cnJlbnQpID0+IGNvbWJpbmVkICYmIGN1cnJlbnQsIHRydWUpO1xuICB9XG5cbiAgLyoqIEdldHMgYSBkZXNjcmlwdGlvbiBvZiB0aGlzIHByZWRpY2F0ZSBmb3IgdXNlIGluIGVycm9yIG1lc3NhZ2VzLiAqL1xuICBnZXREZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzY3JpcHRpb25zLmpvaW4oJywgJyk7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc2VsZWN0b3IgdXNlZCB0byBmaW5kIGNhbmRpZGF0ZSBlbGVtZW50cy4gKi9cbiAgZ2V0U2VsZWN0b3IoKSB7XG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSB0byBnbyB0aHJvdWdoIHRoZSBleHRyYSB0cm91YmxlIGlmIHRoZXJlIGFyZSBubyBhbmNlc3RvcnMuXG4gICAgaWYgKCF0aGlzLl9hbmNlc3Rvcikge1xuICAgICAgcmV0dXJuICh0aGlzLmhhcm5lc3NUeXBlLmhvc3RTZWxlY3RvciB8fCAnJykudHJpbSgpO1xuICAgIH1cblxuICAgIGNvbnN0IFthbmNlc3RvcnMsIGFuY2VzdG9yUGxhY2Vob2xkZXJzXSA9IF9zcGxpdEFuZEVzY2FwZVNlbGVjdG9yKHRoaXMuX2FuY2VzdG9yKTtcbiAgICBjb25zdCBbc2VsZWN0b3JzLCBzZWxlY3RvclBsYWNlaG9sZGVyc10gPVxuICAgICAgX3NwbGl0QW5kRXNjYXBlU2VsZWN0b3IodGhpcy5oYXJuZXNzVHlwZS5ob3N0U2VsZWN0b3IgfHwgJycpO1xuICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIFdlIGhhdmUgdG8gYWRkIHRoZSBhbmNlc3RvciB0byBlYWNoIHBhcnQgb2YgdGhlIGhvc3QgY29tcG91bmQgc2VsZWN0b3IsIG90aGVyd2lzZSB3ZSBjYW4gZ2V0XG4gICAgLy8gaW5jb3JyZWN0IHJlc3VsdHMuIEUuZy4gYC5hbmNlc3RvciAuYSwgLmFuY2VzdG9yIC5iYCB2cyBgLmFuY2VzdG9yIC5hLCAuYmAuXG4gICAgYW5jZXN0b3JzLmZvckVhY2goZXNjYXBlZEFuY2VzdG9yID0+IHtcbiAgICAgIGNvbnN0IGFuY2VzdG9yID0gX3Jlc3RvcmVTZWxlY3Rvcihlc2NhcGVkQW5jZXN0b3IsIGFuY2VzdG9yUGxhY2Vob2xkZXJzKTtcbiAgICAgIHJldHVybiBzZWxlY3RvcnMuZm9yRWFjaChlc2NhcGVkU2VsZWN0b3IgPT5cbiAgICAgICAgcmVzdWx0LnB1c2goYCR7YW5jZXN0b3J9ICR7X3Jlc3RvcmVTZWxlY3Rvcihlc2NhcGVkU2VsZWN0b3IsIHNlbGVjdG9yUGxhY2Vob2xkZXJzKX1gKSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJywgJyk7XG4gIH1cblxuICAvKiogQWRkcyBiYXNlIG9wdGlvbnMgY29tbW9uIHRvIGFsbCBoYXJuZXNzIHR5cGVzLiAqL1xuICBwcml2YXRlIF9hZGRCYXNlT3B0aW9ucyhvcHRpb25zOiBCYXNlSGFybmVzc0ZpbHRlcnMpIHtcbiAgICB0aGlzLl9hbmNlc3RvciA9IG9wdGlvbnMuYW5jZXN0b3IgfHwgJyc7XG4gICAgaWYgKHRoaXMuX2FuY2VzdG9yKSB7XG4gICAgICB0aGlzLl9kZXNjcmlwdGlvbnMucHVzaChgaGFzIGFuY2VzdG9yIG1hdGNoaW5nIHNlbGVjdG9yIFwiJHt0aGlzLl9hbmNlc3Rvcn1cImApO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RvciA9IG9wdGlvbnMuc2VsZWN0b3I7XG4gICAgaWYgKHNlbGVjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuYWRkKGBob3N0IG1hdGNoZXMgc2VsZWN0b3IgXCIke3NlbGVjdG9yfVwiYCwgYXN5bmMgaXRlbSA9PiB7XG4gICAgICAgIHJldHVybiAoYXdhaXQgaXRlbS5ob3N0KCkpLm1hdGNoZXNTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlcHJlc2VudCBhIHZhbHVlIGFzIGEgc3RyaW5nIGZvciB0aGUgcHVycG9zZSBvZiBsb2dnaW5nLiAqL1xuZnVuY3Rpb24gX3ZhbHVlQXNTdHJpbmcodmFsdWU6IHVua25vd24pIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH1cbiAgdHJ5IHtcbiAgICAvLyBgSlNPTi5zdHJpbmdpZnlgIGRvZXNuJ3QgaGFuZGxlIFJlZ0V4cCBwcm9wZXJseSwgc28gd2UgbmVlZCBhIGN1c3RvbSByZXBsYWNlci5cbiAgICAvLyBVc2UgYSBjaGFyYWN0ZXIgdGhhdCBpcyB1bmxpa2VseSB0byBhcHBlYXIgaW4gcmVhbCBzdHJpbmdzIHRvIGRlbm90ZSB0aGUgc3RhcnQgYW5kIGVuZCBvZlxuICAgIC8vIHRoZSByZWdleC4gVGhpcyBhbGxvd3MgdXMgdG8gc3RyaXAgb3V0IHRoZSBleHRyYSBxdW90ZXMgYXJvdW5kIHRoZSB2YWx1ZSBhZGRlZCBieVxuICAgIC8vIGBKU09OLnN0cmluZ2lmeWAuIEFsc28gZG8gY3VzdG9tIGVzY2FwaW5nIG9uIGBcImAgY2hhcmFjdGVycyB0byBwcmV2ZW50IGBKU09OLnN0cmluZ2lmeWBcbiAgICAvLyBmcm9tIGVzY2FwaW5nIHRoZW0gYXMgaWYgdGhleSB3ZXJlIHBhcnQgb2YgYSBzdHJpbmcuXG4gICAgY29uc3Qgc3RyaW5naWZpZWRWYWx1ZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlLCAoXywgdikgPT4gdiBpbnN0YW5jZW9mIFJlZ0V4cCA/XG4gICAgICAgIGDil6xNQVRfUkVfRVNDQVBF4pesJHt2LnRvU3RyaW5nKCkucmVwbGFjZSgvXCIvZywgJ+KXrE1BVF9SRV9FU0NBUEXil6wnKX3il6xNQVRfUkVfRVNDQVBF4pesYCA6IHYpO1xuICAgIC8vIFN0cmlwIG91dCB0aGUgZXh0cmEgcXVvdGVzIGFyb3VuZCByZWdleGVzIGFuZCBwdXQgYmFjayB0aGUgbWFudWFsbHkgZXNjYXBlZCBgXCJgIGNoYXJhY3RlcnMuXG4gICAgcmV0dXJuIHN0cmluZ2lmaWVkVmFsdWVcbiAgICAgICAgLnJlcGxhY2UoL1wi4pesTUFUX1JFX0VTQ0FQReKXrHzil6xNQVRfUkVfRVNDQVBF4pesXCIvZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC/il6xNQVRfUkVfRVNDQVBF4pesL2csICdcIicpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBgSlNPTi5zdHJpbmdpZnlgIHdpbGwgdGhyb3cgaWYgdGhlIG9iamVjdCBpcyBjeWNsaWNhbCxcbiAgICAvLyBpbiB0aGlzIGNhc2UgdGhlIGJlc3Qgd2UgY2FuIGRvIGlzIHJlcG9ydCB0aGUgdmFsdWUgYXMgYHsuLi59YC5cbiAgICByZXR1cm4gJ3suLi59JztcbiAgfVxufVxuXG4vKipcbiAqIFNwbGl0cyB1cCBhIGNvbXBvdW5kIHNlbGVjdG9yIGludG8gaXRzIHBhcnRzIGFuZCBlc2NhcGVzIGFueSBxdW90ZWQgY29udGVudC4gVGhlIHF1b3RlZCBjb250ZW50XG4gKiBoYXMgdG8gYmUgZXNjYXBlZCwgYmVjYXVzZSBpdCBjYW4gY29udGFpbiBjb21tYXMgd2hpY2ggd2lsbCB0aHJvdyB0aHJvdyB1cyBvZmYgd2hlbiB0cnlpbmcgdG9cbiAqIHNwbGl0IGl0LlxuICogQHBhcmFtIHNlbGVjdG9yIFNlbGVjdG9yIHRvIGJlIHNwbGl0LlxuICogQHJldHVybnMgVGhlIGVzY2FwZWQgc3RyaW5nIHdoZXJlIGFueSBxdW90ZWQgY29udGVudCBpcyByZXBsYWNlZCB3aXRoIGEgcGxhY2Vob2xkZXIuIEUuZy5cbiAqIGBbZm9vPVwiYmFyXCJdYCB0dXJucyBpbnRvIGBbZm9vPV9fY2RrUGxhY2Vob2xkZXItMF9fXWAuIFVzZSBgX3Jlc3RvcmVTZWxlY3RvcmAgdG8gcmVzdG9yZVxuICogdGhlIHBsYWNlaG9sZGVycy5cbiAqL1xuZnVuY3Rpb24gX3NwbGl0QW5kRXNjYXBlU2VsZWN0b3Ioc2VsZWN0b3I6IHN0cmluZyk6IFtwYXJ0czogc3RyaW5nW10sIHBsYWNlaG9sZGVyczogc3RyaW5nW11dIHtcbiAgY29uc3QgcGxhY2Vob2xkZXJzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIE5vdGUgdGhhdCB0aGUgcmVnZXggZG9lc24ndCBhY2NvdW50IGZvciBuZXN0ZWQgcXVvdGVzIHNvIHNvbWV0aGluZyBsaWtlIGBcImFiJ2NkJ2VcImAgd2lsbCBiZVxuICAvLyBjb25zaWRlcmVkIGFzIHR3byBibG9ja3MuIEl0J3MgYSBiaXQgb2YgYW4gZWRnZSBjYXNlLCBidXQgaWYgd2UgZmluZCB0aGF0IGl0J3MgYSBwcm9ibGVtLFxuICAvLyB3ZSBjYW4gbWFrZSBpdCBhIGJpdCBzbWFydGVyIHVzaW5nIGEgbG9vcC4gVXNlIHRoaXMgZm9yIG5vdyBzaW5jZSBpdCdzIG1vcmUgcmVhZGFibGUgYW5kXG4gIC8vIGNvbXBhY3QuIE1vcmUgY29tcGxldGUgaW1wbGVtZW50YXRpb246XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi9iZDM0YmM5ZTg5ZjE4YS9wYWNrYWdlcy9jb21waWxlci9zcmMvc2hhZG93X2Nzcy50cyNMNjU1XG4gIGNvbnN0IHJlc3VsdCA9IHNlbGVjdG9yLnJlcGxhY2UoLyhbXCInXVteW1wiJ10qW1wiJ10pL2csIChfLCBrZWVwKSA9PiB7XG4gICAgY29uc3QgcmVwbGFjZUJ5ID0gYF9fY2RrUGxhY2Vob2xkZXItJHtwbGFjZWhvbGRlcnMubGVuZ3RofV9fYDtcbiAgICBwbGFjZWhvbGRlcnMucHVzaChrZWVwKTtcbiAgICByZXR1cm4gcmVwbGFjZUJ5O1xuICB9KTtcblxuICByZXR1cm4gW3Jlc3VsdC5zcGxpdCgnLCcpLm1hcChwYXJ0ID0+IHBhcnQudHJpbSgpKSwgcGxhY2Vob2xkZXJzXTtcbn1cblxuLyoqIFJlc3RvcmVzIGEgc2VsZWN0b3Igd2hvc2UgY29udGVudCB3YXMgZXNjYXBlZCBpbiBgX3NwbGl0QW5kRXNjYXBlU2VsZWN0b3JgLiAqL1xuZnVuY3Rpb24gX3Jlc3RvcmVTZWxlY3RvcihzZWxlY3Rvcjogc3RyaW5nLCBwbGFjZWhvbGRlcnM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2UoL19fY2RrUGxhY2Vob2xkZXItKFxcZCspX18vZywgKF8sIGluZGV4KSA9PiBwbGFjZWhvbGRlcnNbK2luZGV4XSk7XG59XG4iXX0=