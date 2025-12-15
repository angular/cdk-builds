import { BehaviorSubject } from 'rxjs';

const autoChangeDetectionSubject = new BehaviorSubject({
  isDisabled: false
});
let autoChangeDetectionSubscription;
function defaultAutoChangeDetectionHandler(status) {
  status.onDetectChangesNow?.();
}
function handleAutoChangeDetectionStatus(handler) {
  stopHandlingAutoChangeDetectionStatus();
  autoChangeDetectionSubscription = autoChangeDetectionSubject.subscribe(handler);
}
function stopHandlingAutoChangeDetectionStatus() {
  autoChangeDetectionSubscription?.unsubscribe();
  autoChangeDetectionSubscription = null;
}
async function batchChangeDetection(fn, triggerBeforeAndAfter) {
  if (autoChangeDetectionSubject.getValue().isDisabled) {
    return await fn();
  }
  if (!autoChangeDetectionSubscription) {
    handleAutoChangeDetectionStatus(defaultAutoChangeDetectionHandler);
  }
  if (triggerBeforeAndAfter) {
    await new Promise(resolve => autoChangeDetectionSubject.next({
      isDisabled: true,
      onDetectChangesNow: resolve
    }));
    try {
      return await fn();
    } finally {
      await new Promise(resolve => autoChangeDetectionSubject.next({
        isDisabled: false,
        onDetectChangesNow: resolve
      }));
    }
  } else {
    autoChangeDetectionSubject.next({
      isDisabled: true
    });
    try {
      return await fn();
    } finally {
      autoChangeDetectionSubject.next({
        isDisabled: false
      });
    }
  }
}
async function manualChangeDetection(fn) {
  return batchChangeDetection(fn, false);
}
async function parallel(values) {
  return batchChangeDetection(() => Promise.all(values()), true);
}

class ComponentHarness {
  locatorFactory;
  constructor(locatorFactory) {
    this.locatorFactory = locatorFactory;
  }
  async host() {
    return this.locatorFactory.rootElement;
  }
  documentRootLocatorFactory() {
    return this.locatorFactory.documentRootLocatorFactory();
  }
  locatorFor(...queries) {
    return this.locatorFactory.locatorFor(...queries);
  }
  locatorForOptional(...queries) {
    return this.locatorFactory.locatorForOptional(...queries);
  }
  locatorForAll(...queries) {
    return this.locatorFactory.locatorForAll(...queries);
  }
  async forceStabilize() {
    return this.locatorFactory.forceStabilize();
  }
  async waitForTasksOutsideAngular() {
    return this.locatorFactory.waitForTasksOutsideAngular();
  }
}
class ContentContainerComponentHarness extends ComponentHarness {
  async getChildLoader(selector) {
    return (await this.getRootHarnessLoader()).getChildLoader(selector);
  }
  async getAllChildLoaders(selector) {
    return (await this.getRootHarnessLoader()).getAllChildLoaders(selector);
  }
  async getHarness(query) {
    return (await this.getRootHarnessLoader()).getHarness(query);
  }
  async getHarnessOrNull(query) {
    return (await this.getRootHarnessLoader()).getHarnessOrNull(query);
  }
  async getHarnessAtIndex(query, index) {
    return (await this.getRootHarnessLoader()).getHarnessAtIndex(query, index);
  }
  async getAllHarnesses(query) {
    return (await this.getRootHarnessLoader()).getAllHarnesses(query);
  }
  async countHarnesses(query) {
    return (await this.getRootHarnessLoader()).countHarnesses(query);
  }
  async hasHarness(query) {
    return (await this.getRootHarnessLoader()).hasHarness(query);
  }
  async getRootHarnessLoader() {
    return this.locatorFactory.rootHarnessLoader();
  }
}
class HarnessPredicate {
  harnessType;
  _predicates = [];
  _descriptions = [];
  _ancestor;
  constructor(harnessType, options) {
    this.harnessType = harnessType;
    this._ancestor = options.ancestor || '';
    if (this._ancestor) {
      this._descriptions.push(`has ancestor matching selector "${this._ancestor}"`);
    }
    const selector = options.selector;
    if (selector !== undefined) {
      this.add(`host matches selector "${selector}"`, async item => {
        return (await item.host()).matchesSelector(selector);
      });
    }
  }
  static async stringMatches(value, pattern) {
    value = await value;
    if (pattern === null) {
      return value === null;
    } else if (value === null) {
      return false;
    }
    return typeof pattern === 'string' ? value === pattern : pattern.test(value);
  }
  add(description, predicate) {
    this._descriptions.push(description);
    this._predicates.push(predicate);
    return this;
  }
  addOption(name, option, predicate) {
    if (option !== undefined) {
      this.add(`${name} = ${_valueAsString(option)}`, item => predicate(item, option));
    }
    return this;
  }
  async filter(harnesses) {
    if (harnesses.length === 0) {
      return [];
    }
    const results = await parallel(() => harnesses.map(h => this.evaluate(h)));
    return harnesses.filter((_, i) => results[i]);
  }
  async evaluate(harness) {
    const results = await parallel(() => this._predicates.map(p => p(harness)));
    return results.reduce((combined, current) => combined && current, true);
  }
  getDescription() {
    return this._descriptions.join(', ');
  }
  getSelector() {
    if (!this._ancestor) {
      return (this.harnessType.hostSelector || '').trim();
    }
    const [ancestors, ancestorPlaceholders] = _splitAndEscapeSelector(this._ancestor);
    const [selectors, selectorPlaceholders] = _splitAndEscapeSelector(this.harnessType.hostSelector || '');
    const result = [];
    ancestors.forEach(escapedAncestor => {
      const ancestor = _restoreSelector(escapedAncestor, ancestorPlaceholders);
      return selectors.forEach(escapedSelector => result.push(`${ancestor} ${_restoreSelector(escapedSelector, selectorPlaceholders)}`));
    });
    return result.join(', ');
  }
}
function _valueAsString(value) {
  if (value === undefined) {
    return 'undefined';
  }
  try {
    const stringifiedValue = JSON.stringify(value, (_, v) => v instanceof RegExp ? `◬MAT_RE_ESCAPE◬${v.toString().replace(/"/g, '◬MAT_RE_ESCAPE◬')}◬MAT_RE_ESCAPE◬` : v);
    return stringifiedValue.replace(/"◬MAT_RE_ESCAPE◬|◬MAT_RE_ESCAPE◬"/g, '').replace(/◬MAT_RE_ESCAPE◬/g, '"');
  } catch {
    return '{...}';
  }
}
function _splitAndEscapeSelector(selector) {
  const placeholders = [];
  const result = selector.replace(/(["'][^["']*["'])/g, (_, keep) => {
    const replaceBy = `__cdkPlaceholder-${placeholders.length}__`;
    placeholders.push(keep);
    return replaceBy;
  });
  return [result.split(',').map(part => part.trim()), placeholders];
}
function _restoreSelector(selector, placeholders) {
  return selector.replace(/__cdkPlaceholder-(\d+)__/g, (_, index) => placeholders[+index]);
}

class HarnessEnvironment {
  rawRootElement;
  get rootElement() {
    this._rootElement = this._rootElement || this.createTestElement(this.rawRootElement);
    return this._rootElement;
  }
  set rootElement(element) {
    this._rootElement = element;
  }
  _rootElement;
  constructor(rawRootElement) {
    this.rawRootElement = rawRootElement;
  }
  documentRootLocatorFactory() {
    return this.createEnvironment(this.getDocumentRoot());
  }
  locatorFor(...queries) {
    return () => _assertResultFound(this._getAllHarnessesAndTestElements(queries), _getDescriptionForLocatorForQueries(queries));
  }
  locatorForOptional(...queries) {
    return async () => (await this._getAllHarnessesAndTestElements(queries))[0] || null;
  }
  locatorForAll(...queries) {
    return () => this._getAllHarnessesAndTestElements(queries);
  }
  async rootHarnessLoader() {
    return this;
  }
  async harnessLoaderFor(selector) {
    return this.createEnvironment(await _assertResultFound(this.getAllRawElements(selector), [_getDescriptionForHarnessLoaderQuery(selector)]));
  }
  async harnessLoaderForOptional(selector) {
    const elements = await this.getAllRawElements(selector);
    return elements[0] ? this.createEnvironment(elements[0]) : null;
  }
  async harnessLoaderForAll(selector) {
    const elements = await this.getAllRawElements(selector);
    return elements.map(element => this.createEnvironment(element));
  }
  getHarness(query) {
    return this.locatorFor(query)();
  }
  getHarnessOrNull(query) {
    return this.locatorForOptional(query)();
  }
  async getHarnessAtIndex(query, offset) {
    if (offset < 0) {
      throw Error('Index must not be negative');
    }
    const harnesses = await this.locatorForAll(query)();
    if (offset >= harnesses.length) {
      throw Error(`No harness was located at index ${offset}`);
    }
    return harnesses[offset];
  }
  getAllHarnesses(query) {
    return this.locatorForAll(query)();
  }
  async countHarnesses(query) {
    return (await this.locatorForAll(query)()).length;
  }
  async hasHarness(query) {
    return (await this.locatorForOptional(query)()) !== null;
  }
  async getChildLoader(selector) {
    return this.createEnvironment(await _assertResultFound(this.getAllRawElements(selector), [_getDescriptionForHarnessLoaderQuery(selector)]));
  }
  async getAllChildLoaders(selector) {
    return (await this.getAllRawElements(selector)).map(e => this.createEnvironment(e));
  }
  createComponentHarness(harnessType, element) {
    return new harnessType(this.createEnvironment(element));
  }
  async _getAllHarnessesAndTestElements(queries) {
    if (!queries.length) {
      throw Error('CDK Component harness query must contain at least one element.');
    }
    const {
      allQueries,
      harnessQueries,
      elementQueries,
      harnessTypes
    } = _parseQueries(queries);
    const rawElements = await this.getAllRawElements([...elementQueries, ...harnessQueries.map(predicate => predicate.getSelector())].join(','));
    const skipSelectorCheck = elementQueries.length === 0 && harnessTypes.size === 1 || harnessQueries.length === 0;
    const perElementMatches = await parallel(() => rawElements.map(async rawElement => {
      const testElement = this.createTestElement(rawElement);
      const allResultsForElement = await parallel(() => allQueries.map(query => this._getQueryResultForElement(query, rawElement, testElement, skipSelectorCheck)));
      return _removeDuplicateQueryResults(allResultsForElement);
    }));
    return [].concat(...perElementMatches);
  }
  async _getQueryResultForElement(query, rawElement, testElement, skipSelectorCheck = false) {
    if (typeof query === 'string') {
      return skipSelectorCheck || (await testElement.matchesSelector(query)) ? testElement : null;
    }
    if (skipSelectorCheck || (await testElement.matchesSelector(query.getSelector()))) {
      const harness = this.createComponentHarness(query.harnessType, rawElement);
      return (await query.evaluate(harness)) ? harness : null;
    }
    return null;
  }
}
function _parseQueries(queries) {
  const allQueries = [];
  const harnessQueries = [];
  const elementQueries = [];
  const harnessTypes = new Set();
  for (const query of queries) {
    if (typeof query === 'string') {
      allQueries.push(query);
      elementQueries.push(query);
    } else {
      const predicate = query instanceof HarnessPredicate ? query : new HarnessPredicate(query, {});
      allQueries.push(predicate);
      harnessQueries.push(predicate);
      harnessTypes.add(predicate.harnessType);
    }
  }
  return {
    allQueries,
    harnessQueries,
    elementQueries,
    harnessTypes
  };
}
async function _removeDuplicateQueryResults(results) {
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
    } else if (!testElementMatched) {
      testElementMatched = true;
      dedupedMatches.push(result);
    }
  }
  return dedupedMatches;
}
async function _assertResultFound(results, queryDescriptions) {
  const result = (await results)[0];
  if (result == undefined) {
    throw Error(`Failed to find element matching one of the following queries:\n` + queryDescriptions.map(desc => `(${desc})`).join(',\n'));
  }
  return result;
}
function _getDescriptionForLocatorForQueries(queries) {
  return queries.map(query => typeof query === 'string' ? _getDescriptionForTestElementQuery(query) : _getDescriptionForComponentHarnessQuery(query));
}
function _getDescriptionForComponentHarnessQuery(query) {
  const harnessPredicate = query instanceof HarnessPredicate ? query : new HarnessPredicate(query, {});
  const {
    name,
    hostSelector
  } = harnessPredicate.harnessType;
  const description = `${name} with host element matching selector: "${hostSelector}"`;
  const constraints = harnessPredicate.getDescription();
  return description + (constraints ? ` satisfying the constraints: ${harnessPredicate.getDescription()}` : '');
}
function _getDescriptionForTestElementQuery(selector) {
  return `TestElement for element matching selector: "${selector}"`;
}
function _getDescriptionForHarnessLoaderQuery(selector) {
  return `HarnessLoader for element matching selector: "${selector}"`;
}

var TestKey;
(function (TestKey) {
  TestKey[TestKey["BACKSPACE"] = 0] = "BACKSPACE";
  TestKey[TestKey["TAB"] = 1] = "TAB";
  TestKey[TestKey["ENTER"] = 2] = "ENTER";
  TestKey[TestKey["SHIFT"] = 3] = "SHIFT";
  TestKey[TestKey["CONTROL"] = 4] = "CONTROL";
  TestKey[TestKey["ALT"] = 5] = "ALT";
  TestKey[TestKey["ESCAPE"] = 6] = "ESCAPE";
  TestKey[TestKey["PAGE_UP"] = 7] = "PAGE_UP";
  TestKey[TestKey["PAGE_DOWN"] = 8] = "PAGE_DOWN";
  TestKey[TestKey["END"] = 9] = "END";
  TestKey[TestKey["HOME"] = 10] = "HOME";
  TestKey[TestKey["LEFT_ARROW"] = 11] = "LEFT_ARROW";
  TestKey[TestKey["UP_ARROW"] = 12] = "UP_ARROW";
  TestKey[TestKey["RIGHT_ARROW"] = 13] = "RIGHT_ARROW";
  TestKey[TestKey["DOWN_ARROW"] = 14] = "DOWN_ARROW";
  TestKey[TestKey["INSERT"] = 15] = "INSERT";
  TestKey[TestKey["DELETE"] = 16] = "DELETE";
  TestKey[TestKey["F1"] = 17] = "F1";
  TestKey[TestKey["F2"] = 18] = "F2";
  TestKey[TestKey["F3"] = 19] = "F3";
  TestKey[TestKey["F4"] = 20] = "F4";
  TestKey[TestKey["F5"] = 21] = "F5";
  TestKey[TestKey["F6"] = 22] = "F6";
  TestKey[TestKey["F7"] = 23] = "F7";
  TestKey[TestKey["F8"] = 24] = "F8";
  TestKey[TestKey["F9"] = 25] = "F9";
  TestKey[TestKey["F10"] = 26] = "F10";
  TestKey[TestKey["F11"] = 27] = "F11";
  TestKey[TestKey["F12"] = 28] = "F12";
  TestKey[TestKey["META"] = 29] = "META";
  TestKey[TestKey["COMMA"] = 30] = "COMMA";
})(TestKey || (TestKey = {}));

function getNoKeysSpecifiedError() {
  return Error('No keys have been specified.');
}

function _getTextWithExcludedElements(element, excludeSelector) {
  const clone = element.cloneNode(true);
  const exclusions = clone.querySelectorAll(excludeSelector);
  for (let i = 0; i < exclusions.length; i++) {
    exclusions[i].remove();
  }
  return (clone.textContent || '').trim();
}

export { ComponentHarness, ContentContainerComponentHarness, HarnessEnvironment, HarnessPredicate, TestKey, _getTextWithExcludedElements, getNoKeysSpecifiedError, handleAutoChangeDetectionStatus, manualChangeDetection, parallel, stopHandlingAutoChangeDetectionStatus };
//# sourceMappingURL=testing.mjs.map
