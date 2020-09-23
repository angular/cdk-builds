/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { parallel } from './change-detection';
import { ComponentHarness, HarnessPredicate, } from './component-harness';
/**
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 */
export class HarnessEnvironment {
    constructor(rawRootElement) {
        this.rawRootElement = rawRootElement;
        this.rootElement = this.createTestElement(rawRootElement);
    }
    // Implemented as part of the `LocatorFactory` interface.
    documentRootLocatorFactory() {
        return this.createEnvironment(this.getDocumentRoot());
    }
    // Implemented as part of the `LocatorFactory` interface.
    locatorFor(...queries) {
        return () => _assertResultFound(this._getAllHarnessesAndTestElements(queries), _getDescriptionForLocatorForQueries(queries));
    }
    // Implemented as part of the `LocatorFactory` interface.
    locatorForOptional(...queries) {
        return () => __awaiter(this, void 0, void 0, function* () { return (yield this._getAllHarnessesAndTestElements(queries))[0] || null; });
    }
    // Implemented as part of the `LocatorFactory` interface.
    locatorForAll(...queries) {
        return () => this._getAllHarnessesAndTestElements(queries);
    }
    // Implemented as part of the `LocatorFactory` interface.
    rootHarnessLoader() {
        return __awaiter(this, void 0, void 0, function* () {
            return this;
        });
    }
    // Implemented as part of the `LocatorFactory` interface.
    harnessLoaderFor(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createEnvironment(yield _assertResultFound(this.getAllRawElements(selector), [_getDescriptionForHarnessLoaderQuery(selector)]));
        });
    }
    // Implemented as part of the `LocatorFactory` interface.
    harnessLoaderForOptional(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const elements = yield this.getAllRawElements(selector);
            return elements[0] ? this.createEnvironment(elements[0]) : null;
        });
    }
    // Implemented as part of the `LocatorFactory` interface.
    harnessLoaderForAll(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const elements = yield this.getAllRawElements(selector);
            return elements.map(element => this.createEnvironment(element));
        });
    }
    // Implemented as part of the `HarnessLoader` interface.
    getHarness(query) {
        return this.locatorFor(query)();
    }
    // Implemented as part of the `HarnessLoader` interface.
    getAllHarnesses(query) {
        return this.locatorForAll(query)();
    }
    // Implemented as part of the `HarnessLoader` interface.
    getChildLoader(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createEnvironment(yield _assertResultFound(this.getAllRawElements(selector), [_getDescriptionForHarnessLoaderQuery(selector)]));
        });
    }
    // Implemented as part of the `HarnessLoader` interface.
    getAllChildLoaders(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getAllRawElements(selector)).map(e => this.createEnvironment(e));
        });
    }
    /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
    createComponentHarness(harnessType, element) {
        return new harnessType(this.createEnvironment(element));
    }
    /**
     * Matches the given raw elements with the given list of element and harness queries to produce a
     * list of matched harnesses and test elements.
     */
    _getAllHarnessesAndTestElements(queries) {
        return __awaiter(this, void 0, void 0, function* () {
            const { allQueries, harnessQueries, elementQueries, harnessTypes } = _parseQueries(queries);
            // Combine all of the queries into one large comma-delimited selector and use it to get all raw
            // elements matching any of the individual queries.
            const rawElements = yield this.getAllRawElements([...elementQueries, ...harnessQueries.map(predicate => predicate.getSelector())].join(','));
            // If every query is searching for the same harness subclass, we know every result corresponds
            // to an instance of that subclass. Likewise, if every query is for a `TestElement`, we know
            // every result corresponds to a `TestElement`. Otherwise we need to verify which result was
            // found by which selector so it can be matched to the appropriate instance.
            const skipSelectorCheck = (elementQueries.length === 0 && harnessTypes.size === 1) ||
                harnessQueries.length === 0;
            const perElementMatches = yield parallel(() => rawElements.map((rawElement) => __awaiter(this, void 0, void 0, function* () {
                const testElement = this.createTestElement(rawElement);
                const allResultsForElement = yield Promise.all(
                // For each query, get `null` if it doesn't match, or a `TestElement` or
                // `ComponentHarness` as appropriate if it does match. This gives us everything that
                // matches the current raw element, but it may contain duplicate entries (e.g.
                // multiple `TestElement` or multiple `ComponentHarness` of the same type).
                allQueries.map(query => this._getQueryResultForElement(query, rawElement, testElement, skipSelectorCheck)));
                return _removeDuplicateQueryResults(allResultsForElement);
            })));
            return [].concat(...perElementMatches);
        });
    }
    /**
     * Check whether the given query matches the given element, if it does return the matched
     * `TestElement` or `ComponentHarness`, if it does not, return null. In cases where the caller
     * knows for sure that the query matches the element's selector, `skipSelectorCheck` can be used
     * to skip verification and optimize performance.
     */
    _getQueryResultForElement(query, rawElement, testElement, skipSelectorCheck = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof query === 'string') {
                return ((skipSelectorCheck || (yield testElement.matchesSelector(query))) ? testElement : null);
            }
            if (skipSelectorCheck || (yield testElement.matchesSelector(query.getSelector()))) {
                const harness = this.createComponentHarness(query.harnessType, rawElement);
                return (yield query.evaluate(harness)) ? harness : null;
            }
            return null;
        });
    }
}
/**
 * Parses a list of queries in the format accepted by the `locatorFor*` methods into an easier to
 * work with format.
 */
function _parseQueries(queries) {
    const allQueries = [];
    const harnessQueries = [];
    const elementQueries = [];
    const harnessTypes = new Set();
    for (const query of queries) {
        if (typeof query === 'string') {
            allQueries.push(query);
            elementQueries.push(query);
        }
        else {
            const predicate = query instanceof HarnessPredicate ? query : new HarnessPredicate(query, {});
            allQueries.push(predicate);
            harnessQueries.push(predicate);
            harnessTypes.add(predicate.harnessType);
        }
    }
    return { allQueries, harnessQueries, elementQueries, harnessTypes };
}
/**
 * Removes duplicate query results for a particular element. (e.g. multiple `TestElement`
 * instances or multiple instances of the same `ComponentHarness` class.
 */
function _removeDuplicateQueryResults(results) {
    return __awaiter(this, void 0, void 0, function* () {
        let testElementMatched = false;
        let matchedHarnessTypes = new Set();
        const dedupedMatches = [];
        for (const result of results) {
            if (!result) {
                continue;
            }
            if (result instanceof ComponentHarness) {
                if (!matchedHarnessTypes.has(result.constructor)) {
                    matchedHarnessTypes.add(result.constructor);
                    dedupedMatches.push(result);
                }
            }
            else if (!testElementMatched) {
                testElementMatched = true;
                dedupedMatches.push(result);
            }
        }
        return dedupedMatches;
    });
}
/** Verifies that there is at least one result in an array. */
function _assertResultFound(results, queryDescriptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = (yield results)[0];
        if (result == undefined) {
            throw Error(`Failed to find element matching one of the following queries:\n` +
                queryDescriptions.map(desc => `(${desc})`).join(',\n'));
        }
        return result;
    });
}
/** Gets a list of description strings from a list of queries. */
function _getDescriptionForLocatorForQueries(queries) {
    return queries.map(query => typeof query === 'string' ?
        _getDescriptionForTestElementQuery(query) : _getDescriptionForComponentHarnessQuery(query));
}
/** Gets a description string for a `ComponentHarness` query. */
function _getDescriptionForComponentHarnessQuery(query) {
    const harnessPredicate = query instanceof HarnessPredicate ? query : new HarnessPredicate(query, {});
    const { name, hostSelector } = harnessPredicate.harnessType;
    const description = `${name} with host element matching selector: "${hostSelector}"`;
    const constraints = harnessPredicate.getDescription();
    return description + (constraints ?
        ` satisfying the constraints: ${harnessPredicate.getDescription()}` : '');
}
/** Gets a description string for a `TestElement` query. */
function _getDescriptionForTestElementQuery(selector) {
    return `TestElement for element matching selector: "${selector}"`;
}
/** Gets a description string for a `HarnessLoader` query. */
function _getDescriptionForHarnessLoaderQuery(selector) {
    return `HarnessLoader for element matching selector: "${selector}"`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFybmVzcy1lbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUMsT0FBTyxFQUVMLGdCQUFnQixFQUdoQixnQkFBZ0IsR0FJakIsTUFBTSxxQkFBcUIsQ0FBQztBQXFCN0I7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQWdCLGtCQUFrQjtJQUl0QyxZQUFnQyxjQUFpQjtRQUFqQixtQkFBYyxHQUFkLGNBQWMsQ0FBRztRQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELDBCQUEwQjtRQUN4QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELFVBQVUsQ0FBMkMsR0FBRyxPQUFVO1FBRWhFLE9BQU8sR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQzNCLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxPQUFPLENBQUMsRUFDN0MsbUNBQW1DLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELGtCQUFrQixDQUEyQyxHQUFHLE9BQVU7UUFFeEUsT0FBTyxHQUFTLEVBQUUsZ0RBQUMsT0FBQSxDQUFDLE1BQU0sSUFBSSxDQUFDLCtCQUErQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFBLEdBQUEsQ0FBQztJQUN0RixDQUFDO0lBRUQseURBQXlEO0lBQ3pELGFBQWEsQ0FBMkMsR0FBRyxPQUFVO1FB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UUFBUSxHQUFHLENBQUM7QUFDdEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3BhcmFsbGVsfSBmcm9tICcuL2NoYW5nZS1kZXRlY3Rpb24nO1xuaW1wb3J0IHtcbiAgQXN5bmNGYWN0b3J5Rm4sXG4gIENvbXBvbmVudEhhcm5lc3MsXG4gIENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcixcbiAgSGFybmVzc0xvYWRlcixcbiAgSGFybmVzc1ByZWRpY2F0ZSxcbiAgSGFybmVzc1F1ZXJ5LFxuICBMb2NhdG9yRmFjdG9yeSxcbiAgTG9jYXRvckZuUmVzdWx0LFxufSBmcm9tICcuL2NvbXBvbmVudC1oYXJuZXNzJztcbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4vdGVzdC1lbGVtZW50JztcblxuLyoqIFBhcnNlZCBmb3JtIG9mIHRoZSBxdWVyaWVzIHBhc3NlZCB0byB0aGUgYGxvY2F0b3JGb3IqYCBtZXRob2RzLiAqL1xudHlwZSBQYXJzZWRRdWVyaWVzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPiA9IHtcbiAgLyoqIFRoZSBmdWxsIGxpc3Qgb2YgcXVlcmllcywgaW4gdGhlaXIgb3JpZ2luYWwgb3JkZXIuICovXG4gIGFsbFF1ZXJpZXM6IChzdHJpbmcgfCBIYXJuZXNzUHJlZGljYXRlPFQ+KVtdLFxuICAvKipcbiAgICogQSBmaWx0ZXJlZCB2aWV3IG9mIGBhbGxRdWVyaWVzYCBjb250YWluaW5nIG9ubHkgdGhlIHF1ZXJpZXMgdGhhdCBhcmUgbG9va2luZyBmb3IgYVxuICAgKiBgQ29tcG9uZW50SGFybmVzc2BcbiAgICovXG4gIGhhcm5lc3NRdWVyaWVzOiBIYXJuZXNzUHJlZGljYXRlPFQ+W10sXG4gIC8qKlxuICAgKiBBIGZpbHRlcmVkIHZpZXcgb2YgYGFsbFF1ZXJpZXNgIGNvbnRhaW5pbmcgb25seSB0aGUgcXVlcmllcyB0aGF0IGFyZSBsb29raW5nIGZvciBhXG4gICAqIGBUZXN0RWxlbWVudGBcbiAgICovXG4gIGVsZW1lbnRRdWVyaWVzOiBzdHJpbmdbXSxcbiAgLyoqIFRoZSBzZXQgb2YgYWxsIGBDb21wb25lbnRIYXJuZXNzYCBzdWJjbGFzc2VzIHJlcHJlc2VudGVkIGluIHRoZSBvcmlnaW5hbCBxdWVyeSBsaXN0LiAqL1xuICBoYXJuZXNzVHlwZXM6IFNldDxDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4+LFxufTtcblxuLyoqXG4gKiBCYXNlIGhhcm5lc3MgZW52aXJvbm1lbnQgY2xhc3MgdGhhdCBjYW4gYmUgZXh0ZW5kZWQgdG8gYWxsb3cgYENvbXBvbmVudEhhcm5lc3NgZXMgdG8gYmUgdXNlZCBpblxuICogZGlmZmVyZW50IHRlc3QgZW52aXJvbm1lbnRzIChlLmcuIHRlc3RiZWQsIHByb3RyYWN0b3IsIGV0Yy4pLiBUaGlzIGNsYXNzIGltcGxlbWVudHMgdGhlXG4gKiBmdW5jdGlvbmFsaXR5IG9mIGJvdGggYSBgSGFybmVzc0xvYWRlcmAgYW5kIGBMb2NhdG9yRmFjdG9yeWAuIFRoaXMgY2xhc3MgaXMgZ2VuZXJpYyBvbiB0aGUgcmF3XG4gKiBlbGVtZW50IHR5cGUsIGBFYCwgdXNlZCBieSB0aGUgcGFydGljdWxhciB0ZXN0IGVudmlyb25tZW50LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFybmVzc0Vudmlyb25tZW50PEU+IGltcGxlbWVudHMgSGFybmVzc0xvYWRlciwgTG9jYXRvckZhY3Rvcnkge1xuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgcm9vdEVsZW1lbnQ6IFRlc3RFbGVtZW50O1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcmF3Um9vdEVsZW1lbnQ6IEUpIHtcbiAgICB0aGlzLnJvb3RFbGVtZW50ID0gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChyYXdSb290RWxlbWVudCk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgZG9jdW1lbnRSb290TG9jYXRvckZhY3RvcnkoKTogTG9jYXRvckZhY3Rvcnkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KHRoaXMuZ2V0RG9jdW1lbnRSb290KCkpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGxvY2F0b3JGb3I8VCBleHRlbmRzIChIYXJuZXNzUXVlcnk8YW55PiB8IHN0cmluZylbXT4oLi4ucXVlcmllczogVCk6XG4gICAgICBBc3luY0ZhY3RvcnlGbjxMb2NhdG9yRm5SZXN1bHQ8VD4+IHtcbiAgICByZXR1cm4gKCkgPT4gX2Fzc2VydFJlc3VsdEZvdW5kKFxuICAgICAgICB0aGlzLl9nZXRBbGxIYXJuZXNzZXNBbmRUZXN0RWxlbWVudHMocXVlcmllcyksXG4gICAgICAgIF9nZXREZXNjcmlwdGlvbkZvckxvY2F0b3JGb3JRdWVyaWVzKHF1ZXJpZXMpKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBsb2NhdG9yRm9yT3B0aW9uYWw8VCBleHRlbmRzIChIYXJuZXNzUXVlcnk8YW55PiB8IHN0cmluZylbXT4oLi4ucXVlcmllczogVCk6XG4gICAgICBBc3luY0ZhY3RvcnlGbjxMb2NhdG9yRm5SZXN1bHQ8VD4gfCBudWxsPiB7XG4gICAgcmV0dXJuIGFzeW5jICgpID0+IChhd2FpdCB0aGlzLl9nZXRBbGxIYXJuZXNzZXNBbmRUZXN0RWxlbWVudHMocXVlcmllcykpWzBdIHx8IG51bGw7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgbG9jYXRvckZvckFsbDxUIGV4dGVuZHMgKEhhcm5lc3NRdWVyeTxhbnk+IHwgc3RyaW5nKVtdPiguLi5xdWVyaWVzOiBUKTpcbiAgICAgIEFzeW5jRmFjdG9yeUZuPExvY2F0b3JGblJlc3VsdDxUPltdPiB7XG4gICAgcmV0dXJuICgpID0+IHRoaXMuX2dldEFsbEhhcm5lc3Nlc0FuZFRlc3RFbGVtZW50cyhxdWVyaWVzKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBhc3luYyByb290SGFybmVzc0xvYWRlcigpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXI+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBMb2NhdG9yRmFjdG9yeWAgaW50ZXJmYWNlLlxuICBhc3luYyBoYXJuZXNzTG9hZGVyRm9yKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChhd2FpdCBfYXNzZXJ0UmVzdWx0Rm91bmQodGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3RvciksXG4gICAgICAgIFtfZ2V0RGVzY3JpcHRpb25Gb3JIYXJuZXNzTG9hZGVyUXVlcnkoc2VsZWN0b3IpXSkpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGFzeW5jIGhhcm5lc3NMb2FkZXJGb3JPcHRpb25hbChzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyIHwgbnVsbD4ge1xuICAgIGNvbnN0IGVsZW1lbnRzID0gYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcik7XG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdID8gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50c1swXSkgOiBudWxsO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGFzeW5jIGhhcm5lc3NMb2FkZXJGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcltdPiB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gZWxlbWVudHMubWFwKGVsZW1lbnQgPT4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50KSk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgSGFybmVzc0xvYWRlcmAgaW50ZXJmYWNlLlxuICBnZXRIYXJuZXNzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihxdWVyeTogSGFybmVzc1F1ZXJ5PFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZvcihxdWVyeSkoKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGdldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4ocXVlcnk6IEhhcm5lc3NRdWVyeTxUPik6IFByb21pc2U8VFtdPiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZvckFsbChxdWVyeSkoKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGFzeW5jIGdldENoaWxkTG9hZGVyKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChhd2FpdCBfYXNzZXJ0UmVzdWx0Rm91bmQodGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3RvciksXG4gICAgICAgIFtfZ2V0RGVzY3JpcHRpb25Gb3JIYXJuZXNzTG9hZGVyUXVlcnkoc2VsZWN0b3IpXSkpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYEhhcm5lc3NMb2FkZXJgIGludGVyZmFjZS5cbiAgYXN5bmMgZ2V0QWxsQ2hpbGRMb2FkZXJzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXJbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3RvcikpLm1hcChlID0+IHRoaXMuY3JlYXRlRW52aXJvbm1lbnQoZSkpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gcmF3IGhvc3QgZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIGNyZWF0ZUNvbXBvbmVudEhhcm5lc3M8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiwgZWxlbWVudDogRSk6IFQge1xuICAgIHJldHVybiBuZXcgaGFybmVzc1R5cGUodGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50KSk7XG4gIH1cblxuICAvLyBQYXJ0IG9mIExvY2F0b3JGYWN0b3J5IGludGVyZmFjZSwgc3ViY2xhc3NlcyB3aWxsIGltcGxlbWVudC5cbiAgYWJzdHJhY3QgZm9yY2VTdGFiaWxpemUoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvLyBQYXJ0IG9mIExvY2F0b3JGYWN0b3J5IGludGVyZmFjZSwgc3ViY2xhc3NlcyB3aWxsIGltcGxlbWVudC5cbiAgYWJzdHJhY3Qgd2FpdEZvclRhc2tzT3V0c2lkZUFuZ3VsYXIoKTogUHJvbWlzZTx2b2lkPjtcblxuICAvKiogR2V0cyB0aGUgcm9vdCBlbGVtZW50IGZvciB0aGUgZG9jdW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBnZXREb2N1bWVudFJvb3QoKTogRTtcblxuICAvKiogQ3JlYXRlcyBhIGBUZXN0RWxlbWVudGAgZnJvbSBhIHJhdyBlbGVtZW50LiAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgY3JlYXRlVGVzdEVsZW1lbnQoZWxlbWVudDogRSk6IFRlc3RFbGVtZW50O1xuXG4gIC8qKiBDcmVhdGVzIGEgYEhhcm5lc3NMb2FkZXJgIHJvb3RlZCBhdCB0aGUgZ2l2ZW4gcmF3IGVsZW1lbnQuICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBjcmVhdGVFbnZpcm9ubWVudChlbGVtZW50OiBFKTogSGFybmVzc0Vudmlyb25tZW50PEU+O1xuXG4gIC8qKlxuICAgKiBHZXRzIGEgbGlzdCBvZiBhbGwgZWxlbWVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlbGVjdG9yIHVuZGVyIHRoaXMgZW52aXJvbm1lbnQncyByb290IGVsZW1lbnQuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RVtdPjtcblxuICAvKipcbiAgICogTWF0Y2hlcyB0aGUgZ2l2ZW4gcmF3IGVsZW1lbnRzIHdpdGggdGhlIGdpdmVuIGxpc3Qgb2YgZWxlbWVudCBhbmQgaGFybmVzcyBxdWVyaWVzIHRvIHByb2R1Y2UgYVxuICAgKiBsaXN0IG9mIG1hdGNoZWQgaGFybmVzc2VzIGFuZCB0ZXN0IGVsZW1lbnRzLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfZ2V0QWxsSGFybmVzc2VzQW5kVGVzdEVsZW1lbnRzPFQgZXh0ZW5kcyAoSGFybmVzc1F1ZXJ5PGFueT4gfCBzdHJpbmcpW10+KFxuICAgICAgcXVlcmllczogVCk6IFByb21pc2U8TG9jYXRvckZuUmVzdWx0PFQ+W10+IHtcbiAgICBjb25zdCB7YWxsUXVlcmllcywgaGFybmVzc1F1ZXJpZXMsIGVsZW1lbnRRdWVyaWVzLCBoYXJuZXNzVHlwZXN9ID0gX3BhcnNlUXVlcmllcyhxdWVyaWVzKTtcblxuICAgIC8vIENvbWJpbmUgYWxsIG9mIHRoZSBxdWVyaWVzIGludG8gb25lIGxhcmdlIGNvbW1hLWRlbGltaXRlZCBzZWxlY3RvciBhbmQgdXNlIGl0IHRvIGdldCBhbGwgcmF3XG4gICAgLy8gZWxlbWVudHMgbWF0Y2hpbmcgYW55IG9mIHRoZSBpbmRpdmlkdWFsIHF1ZXJpZXMuXG4gICAgY29uc3QgcmF3RWxlbWVudHMgPSBhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKFxuICAgICAgICBbLi4uZWxlbWVudFF1ZXJpZXMsIC4uLmhhcm5lc3NRdWVyaWVzLm1hcChwcmVkaWNhdGUgPT4gcHJlZGljYXRlLmdldFNlbGVjdG9yKCkpXS5qb2luKCcsJykpO1xuXG4gICAgLy8gSWYgZXZlcnkgcXVlcnkgaXMgc2VhcmNoaW5nIGZvciB0aGUgc2FtZSBoYXJuZXNzIHN1YmNsYXNzLCB3ZSBrbm93IGV2ZXJ5IHJlc3VsdCBjb3JyZXNwb25kc1xuICAgIC8vIHRvIGFuIGluc3RhbmNlIG9mIHRoYXQgc3ViY2xhc3MuIExpa2V3aXNlLCBpZiBldmVyeSBxdWVyeSBpcyBmb3IgYSBgVGVzdEVsZW1lbnRgLCB3ZSBrbm93XG4gICAgLy8gZXZlcnkgcmVzdWx0IGNvcnJlc3BvbmRzIHRvIGEgYFRlc3RFbGVtZW50YC4gT3RoZXJ3aXNlIHdlIG5lZWQgdG8gdmVyaWZ5IHdoaWNoIHJlc3VsdCB3YXNcbiAgICAvLyBmb3VuZCBieSB3aGljaCBzZWxlY3RvciBzbyBpdCBjYW4gYmUgbWF0Y2hlZCB0byB0aGUgYXBwcm9wcmlhdGUgaW5zdGFuY2UuXG4gICAgY29uc3Qgc2tpcFNlbGVjdG9yQ2hlY2sgPSAoZWxlbWVudFF1ZXJpZXMubGVuZ3RoID09PSAwICYmIGhhcm5lc3NUeXBlcy5zaXplID09PSAxKSB8fFxuICAgICAgICBoYXJuZXNzUXVlcmllcy5sZW5ndGggPT09IDA7XG5cbiAgICBjb25zdCBwZXJFbGVtZW50TWF0Y2hlcyA9IGF3YWl0IHBhcmFsbGVsKCgpID0+IHJhd0VsZW1lbnRzLm1hcChhc3luYyByYXdFbGVtZW50ID0+IHtcbiAgICAgIGNvbnN0IHRlc3RFbGVtZW50ID0gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChyYXdFbGVtZW50KTtcbiAgICAgIGNvbnN0IGFsbFJlc3VsdHNGb3JFbGVtZW50ID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgLy8gRm9yIGVhY2ggcXVlcnksIGdldCBgbnVsbGAgaWYgaXQgZG9lc24ndCBtYXRjaCwgb3IgYSBgVGVzdEVsZW1lbnRgIG9yXG4gICAgICAgICAgLy8gYENvbXBvbmVudEhhcm5lc3NgIGFzIGFwcHJvcHJpYXRlIGlmIGl0IGRvZXMgbWF0Y2guIFRoaXMgZ2l2ZXMgdXMgZXZlcnl0aGluZyB0aGF0XG4gICAgICAgICAgLy8gbWF0Y2hlcyB0aGUgY3VycmVudCByYXcgZWxlbWVudCwgYnV0IGl0IG1heSBjb250YWluIGR1cGxpY2F0ZSBlbnRyaWVzIChlLmcuXG4gICAgICAgICAgLy8gbXVsdGlwbGUgYFRlc3RFbGVtZW50YCBvciBtdWx0aXBsZSBgQ29tcG9uZW50SGFybmVzc2Agb2YgdGhlIHNhbWUgdHlwZSkuXG4gICAgICAgICAgYWxsUXVlcmllcy5tYXAocXVlcnkgPT4gdGhpcy5fZ2V0UXVlcnlSZXN1bHRGb3JFbGVtZW50KFxuICAgICAgICAgICAgICBxdWVyeSwgcmF3RWxlbWVudCwgdGVzdEVsZW1lbnQsIHNraXBTZWxlY3RvckNoZWNrKSkpO1xuICAgICAgcmV0dXJuIF9yZW1vdmVEdXBsaWNhdGVRdWVyeVJlc3VsdHMoYWxsUmVzdWx0c0ZvckVsZW1lbnQpO1xuICAgIH0pKTtcbiAgICByZXR1cm4gKFtdIGFzIGFueSkuY29uY2F0KC4uLnBlckVsZW1lbnRNYXRjaGVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiBxdWVyeSBtYXRjaGVzIHRoZSBnaXZlbiBlbGVtZW50LCBpZiBpdCBkb2VzIHJldHVybiB0aGUgbWF0Y2hlZFxuICAgKiBgVGVzdEVsZW1lbnRgIG9yIGBDb21wb25lbnRIYXJuZXNzYCwgaWYgaXQgZG9lcyBub3QsIHJldHVybiBudWxsLiBJbiBjYXNlcyB3aGVyZSB0aGUgY2FsbGVyXG4gICAqIGtub3dzIGZvciBzdXJlIHRoYXQgdGhlIHF1ZXJ5IG1hdGNoZXMgdGhlIGVsZW1lbnQncyBzZWxlY3RvciwgYHNraXBTZWxlY3RvckNoZWNrYCBjYW4gYmUgdXNlZFxuICAgKiB0byBza2lwIHZlcmlmaWNhdGlvbiBhbmQgb3B0aW1pemUgcGVyZm9ybWFuY2UuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIF9nZXRRdWVyeVJlc3VsdEZvckVsZW1lbnQ8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgcXVlcnk6IHN0cmluZyB8IEhhcm5lc3NQcmVkaWNhdGU8VD4sIHJhd0VsZW1lbnQ6IEUsIHRlc3RFbGVtZW50OiBUZXN0RWxlbWVudCxcbiAgICAgIHNraXBTZWxlY3RvckNoZWNrOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFQgfCBUZXN0RWxlbWVudCB8IG51bGw+IHtcbiAgICBpZiAodHlwZW9mIHF1ZXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuICgoc2tpcFNlbGVjdG9yQ2hlY2sgfHwgYXdhaXQgdGVzdEVsZW1lbnQubWF0Y2hlc1NlbGVjdG9yKHF1ZXJ5KSkgPyB0ZXN0RWxlbWVudCA6IG51bGwpO1xuICAgIH1cbiAgICBpZiAoc2tpcFNlbGVjdG9yQ2hlY2sgfHwgYXdhaXQgdGVzdEVsZW1lbnQubWF0Y2hlc1NlbGVjdG9yKHF1ZXJ5LmdldFNlbGVjdG9yKCkpKSB7XG4gICAgICBjb25zdCBoYXJuZXNzID0gdGhpcy5jcmVhdGVDb21wb25lbnRIYXJuZXNzKHF1ZXJ5Lmhhcm5lc3NUeXBlLCByYXdFbGVtZW50KTtcbiAgICAgIHJldHVybiAoYXdhaXQgcXVlcnkuZXZhbHVhdGUoaGFybmVzcykpID8gaGFybmVzcyA6IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogUGFyc2VzIGEgbGlzdCBvZiBxdWVyaWVzIGluIHRoZSBmb3JtYXQgYWNjZXB0ZWQgYnkgdGhlIGBsb2NhdG9yRm9yKmAgbWV0aG9kcyBpbnRvIGFuIGVhc2llciB0b1xuICogd29yayB3aXRoIGZvcm1hdC5cbiAqL1xuZnVuY3Rpb24gX3BhcnNlUXVlcmllczxUIGV4dGVuZHMgKEhhcm5lc3NRdWVyeTxhbnk+IHwgc3RyaW5nKVtdPihxdWVyaWVzOiBUKTpcbiAgICBQYXJzZWRRdWVyaWVzPExvY2F0b3JGblJlc3VsdDxUPiAmIENvbXBvbmVudEhhcm5lc3M+IHtcbiAgY29uc3QgYWxsUXVlcmllcyA9IFtdO1xuICBjb25zdCBoYXJuZXNzUXVlcmllcyA9IFtdO1xuICBjb25zdCBlbGVtZW50UXVlcmllcyA9IFtdO1xuICBjb25zdCBoYXJuZXNzVHlwZXMgPVxuICAgICAgbmV3IFNldDxDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8TG9jYXRvckZuUmVzdWx0PFQ+ICYgQ29tcG9uZW50SGFybmVzcz4+KCk7XG5cbiAgZm9yIChjb25zdCBxdWVyeSBvZiBxdWVyaWVzKSB7XG4gICAgaWYgKHR5cGVvZiBxdWVyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFsbFF1ZXJpZXMucHVzaChxdWVyeSk7XG4gICAgICBlbGVtZW50UXVlcmllcy5wdXNoKHF1ZXJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlZGljYXRlID0gcXVlcnkgaW5zdGFuY2VvZiBIYXJuZXNzUHJlZGljYXRlID8gcXVlcnkgOiBuZXcgSGFybmVzc1ByZWRpY2F0ZShxdWVyeSwge30pO1xuICAgICAgYWxsUXVlcmllcy5wdXNoKHByZWRpY2F0ZSk7XG4gICAgICBoYXJuZXNzUXVlcmllcy5wdXNoKHByZWRpY2F0ZSk7XG4gICAgICBoYXJuZXNzVHlwZXMuYWRkKHByZWRpY2F0ZS5oYXJuZXNzVHlwZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHthbGxRdWVyaWVzLCBoYXJuZXNzUXVlcmllcywgZWxlbWVudFF1ZXJpZXMsIGhhcm5lc3NUeXBlc307XG59XG5cbi8qKlxuICogUmVtb3ZlcyBkdXBsaWNhdGUgcXVlcnkgcmVzdWx0cyBmb3IgYSBwYXJ0aWN1bGFyIGVsZW1lbnQuIChlLmcuIG11bHRpcGxlIGBUZXN0RWxlbWVudGBcbiAqIGluc3RhbmNlcyBvciBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgYENvbXBvbmVudEhhcm5lc3NgIGNsYXNzLlxuICovXG5hc3luYyBmdW5jdGlvbiBfcmVtb3ZlRHVwbGljYXRlUXVlcnlSZXN1bHRzPFQgZXh0ZW5kcyAoQ29tcG9uZW50SGFybmVzcyB8IFRlc3RFbGVtZW50IHwgbnVsbClbXT4oXG4gICAgcmVzdWx0czogVCk6IFByb21pc2U8VD4ge1xuICBsZXQgdGVzdEVsZW1lbnRNYXRjaGVkID0gZmFsc2U7XG4gIGxldCBtYXRjaGVkSGFybmVzc1R5cGVzID0gbmV3IFNldCgpO1xuICBjb25zdCBkZWR1cGVkTWF0Y2hlcyA9IFtdO1xuICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgQ29tcG9uZW50SGFybmVzcykge1xuICAgICAgaWYgKCFtYXRjaGVkSGFybmVzc1R5cGVzLmhhcyhyZXN1bHQuY29uc3RydWN0b3IpKSB7XG4gICAgICAgIG1hdGNoZWRIYXJuZXNzVHlwZXMuYWRkKHJlc3VsdC5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIGRlZHVwZWRNYXRjaGVzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCF0ZXN0RWxlbWVudE1hdGNoZWQpIHtcbiAgICAgIHRlc3RFbGVtZW50TWF0Y2hlZCA9IHRydWU7XG4gICAgICBkZWR1cGVkTWF0Y2hlcy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWR1cGVkTWF0Y2hlcyBhcyBUO1xufVxuXG4vKiogVmVyaWZpZXMgdGhhdCB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgcmVzdWx0IGluIGFuIGFycmF5LiAqL1xuYXN5bmMgZnVuY3Rpb24gX2Fzc2VydFJlc3VsdEZvdW5kPFQ+KHJlc3VsdHM6IFByb21pc2U8VFtdPiwgcXVlcnlEZXNjcmlwdGlvbnM6IHN0cmluZ1tdKTpcbiAgICBQcm9taXNlPFQ+IHtcbiAgY29uc3QgcmVzdWx0ID0gKGF3YWl0IHJlc3VsdHMpWzBdO1xuICBpZiAocmVzdWx0ID09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IEVycm9yKGBGYWlsZWQgdG8gZmluZCBlbGVtZW50IG1hdGNoaW5nIG9uZSBvZiB0aGUgZm9sbG93aW5nIHF1ZXJpZXM6XFxuYCArXG4gICAgICAgIHF1ZXJ5RGVzY3JpcHRpb25zLm1hcChkZXNjID0+IGAoJHtkZXNjfSlgKS5qb2luKCcsXFxuJykpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBHZXRzIGEgbGlzdCBvZiBkZXNjcmlwdGlvbiBzdHJpbmdzIGZyb20gYSBsaXN0IG9mIHF1ZXJpZXMuICovXG5mdW5jdGlvbiBfZ2V0RGVzY3JpcHRpb25Gb3JMb2NhdG9yRm9yUXVlcmllcyhxdWVyaWVzOiAoc3RyaW5nIHwgSGFybmVzc1F1ZXJ5PGFueT4pW10pIHtcbiAgcmV0dXJuIHF1ZXJpZXMubWFwKHF1ZXJ5ID0+IHR5cGVvZiBxdWVyeSA9PT0gJ3N0cmluZycgP1xuICAgICAgX2dldERlc2NyaXB0aW9uRm9yVGVzdEVsZW1lbnRRdWVyeShxdWVyeSkgOiBfZ2V0RGVzY3JpcHRpb25Gb3JDb21wb25lbnRIYXJuZXNzUXVlcnkocXVlcnkpKTtcbn1cblxuLyoqIEdldHMgYSBkZXNjcmlwdGlvbiBzdHJpbmcgZm9yIGEgYENvbXBvbmVudEhhcm5lc3NgIHF1ZXJ5LiAqL1xuZnVuY3Rpb24gX2dldERlc2NyaXB0aW9uRm9yQ29tcG9uZW50SGFybmVzc1F1ZXJ5KHF1ZXJ5OiBIYXJuZXNzUXVlcnk8YW55Pikge1xuICBjb25zdCBoYXJuZXNzUHJlZGljYXRlID1cbiAgICAgIHF1ZXJ5IGluc3RhbmNlb2YgSGFybmVzc1ByZWRpY2F0ZSA/IHF1ZXJ5IDogbmV3IEhhcm5lc3NQcmVkaWNhdGUocXVlcnksIHt9KTtcbiAgY29uc3Qge25hbWUsIGhvc3RTZWxlY3Rvcn0gPSBoYXJuZXNzUHJlZGljYXRlLmhhcm5lc3NUeXBlO1xuICBjb25zdCBkZXNjcmlwdGlvbiA9IGAke25hbWV9IHdpdGggaG9zdCBlbGVtZW50IG1hdGNoaW5nIHNlbGVjdG9yOiBcIiR7aG9zdFNlbGVjdG9yfVwiYDtcbiAgY29uc3QgY29uc3RyYWludHMgPSBoYXJuZXNzUHJlZGljYXRlLmdldERlc2NyaXB0aW9uKCk7XG4gIHJldHVybiBkZXNjcmlwdGlvbiArIChjb25zdHJhaW50cyA/XG4gICAgICBgIHNhdGlzZnlpbmcgdGhlIGNvbnN0cmFpbnRzOiAke2hhcm5lc3NQcmVkaWNhdGUuZ2V0RGVzY3JpcHRpb24oKX1gIDogJycpO1xufVxuXG4vKiogR2V0cyBhIGRlc2NyaXB0aW9uIHN0cmluZyBmb3IgYSBgVGVzdEVsZW1lbnRgIHF1ZXJ5LiAqL1xuZnVuY3Rpb24gX2dldERlc2NyaXB0aW9uRm9yVGVzdEVsZW1lbnRRdWVyeShzZWxlY3Rvcjogc3RyaW5nKSB7XG4gIHJldHVybiBgVGVzdEVsZW1lbnQgZm9yIGVsZW1lbnQgbWF0Y2hpbmcgc2VsZWN0b3I6IFwiJHtzZWxlY3Rvcn1cImA7XG59XG5cbi8qKiBHZXRzIGEgZGVzY3JpcHRpb24gc3RyaW5nIGZvciBhIGBIYXJuZXNzTG9hZGVyYCBxdWVyeS4gKi9cbmZ1bmN0aW9uIF9nZXREZXNjcmlwdGlvbkZvckhhcm5lc3NMb2FkZXJRdWVyeShzZWxlY3Rvcjogc3RyaW5nKSB7XG4gIHJldHVybiBgSGFybmVzc0xvYWRlciBmb3IgZWxlbWVudCBtYXRjaGluZyBzZWxlY3RvcjogXCIke3NlbGVjdG9yfVwiYDtcbn1cbiJdfQ==