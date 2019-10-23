/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { HarnessPredicate } from './component-harness';
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
    locatorFor(arg) {
        return () => __awaiter(this, void 0, void 0, function* () {
            if (typeof arg === 'string') {
                return this.createTestElement(yield this._assertElementFound(arg));
            }
            else {
                return this._assertHarnessFound(arg);
            }
        });
    }
    locatorForOptional(arg) {
        return () => __awaiter(this, void 0, void 0, function* () {
            if (typeof arg === 'string') {
                const element = (yield this.getAllRawElements(arg))[0];
                return element ? this.createTestElement(element) : null;
            }
            else {
                const candidates = yield this._getAllHarnesses(arg);
                return candidates[0] || null;
            }
        });
    }
    locatorForAll(arg) {
        return () => __awaiter(this, void 0, void 0, function* () {
            if (typeof arg === 'string') {
                return (yield this.getAllRawElements(arg)).map(e => this.createTestElement(e));
            }
            else {
                return this._getAllHarnesses(arg);
            }
        });
    }
    // Implemented as part of the `LocatorFactory` interface.
    harnessLoaderFor(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createEnvironment(yield this._assertElementFound(selector));
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
    getHarness(harnessType) {
        return this.locatorFor(harnessType)();
    }
    // Implemented as part of the `HarnessLoader` interface.
    getAllHarnesses(harnessType) {
        return this.locatorForAll(harnessType)();
    }
    // Implemented as part of the `HarnessLoader` interface.
    getChildLoader(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createEnvironment(yield this._assertElementFound(selector));
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
    _getAllHarnesses(harnessType) {
        return __awaiter(this, void 0, void 0, function* () {
            const harnessPredicate = harnessType instanceof HarnessPredicate ?
                harnessType : new HarnessPredicate(harnessType, {});
            const elements = yield this.getAllRawElements(harnessPredicate.getSelector());
            return harnessPredicate.filter(elements.map(element => this.createComponentHarness(harnessPredicate.harnessType, element)));
        });
    }
    _assertElementFound(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            const element = (yield this.getAllRawElements(selector))[0];
            if (!element) {
                throw Error(`Expected to find element matching selector: "${selector}", but none was found`);
            }
            return element;
        });
    }
    _assertHarnessFound(harnessType) {
        return __awaiter(this, void 0, void 0, function* () {
            const harness = (yield this._getAllHarnesses(harnessType))[0];
            if (!harness) {
                throw _getErrorForMissingHarness(harnessType);
            }
            return harness;
        });
    }
}
function _getErrorForMissingHarness(harnessType) {
    const harnessPredicate = harnessType instanceof HarnessPredicate ? harnessType : new HarnessPredicate(harnessType, {});
    const { name, hostSelector } = harnessPredicate.harnessType;
    let restrictions = harnessPredicate.getDescription();
    let message = `Expected to find element for ${name} matching selector: "${hostSelector}"`;
    if (restrictions) {
        message += ` (with restrictions: ${restrictions})`;
    }
    message += ', but none was found';
    return Error(message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFybmVzcy1lbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGVzdGluZy9oYXJuZXNzLWVudmlyb25tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBS0wsZ0JBQWdCLEVBRWpCLE1BQU0scUJBQXFCLENBQUM7QUFHN0I7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQWdCLGtCQUFrQjtJQUl0QyxZQUFnQyxjQUFpQjtRQUFqQixtQkFBYyxHQUFkLGNBQWMsQ0FBRztRQUMvQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELDBCQUEwQjtRQUN4QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBTUQsVUFBVSxDQUNOLEdBQWtFO1FBQ3BFLE9BQU8sR0FBUyxFQUFFO1lBQ2hCLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO2dCQUMzQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3BFO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3RDO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBTUQsa0JBQWtCLENBQ2QsR0FBa0U7UUFDcEUsT0FBTyxHQUFTLEVBQUU7WUFDaEIsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7Z0JBQzNCLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFD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QUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbEcsTUFBTSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUM7SUFDMUQsSUFBSSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDckQsSUFBSSxPQUFPLEdBQUcsZ0NBQWdDLElBQUksd0JBQXdCLFlBQVksR0FBRyxDQUFDO0lBQzFGLElBQUksWUFBWSxFQUFFO1FBQ2hCLE9BQU8sSUFBSSx3QkFBd0IsWUFBWSxHQUFHLENBQUM7S0FDcEQ7SUFDRCxPQUFPLElBQUksc0JBQXNCLENBQUM7SUFDbEMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBc3luY0ZhY3RvcnlGbixcbiAgQ29tcG9uZW50SGFybmVzcyxcbiAgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yLFxuICBIYXJuZXNzTG9hZGVyLFxuICBIYXJuZXNzUHJlZGljYXRlLFxuICBMb2NhdG9yRmFjdG9yeVxufSBmcm9tICcuL2NvbXBvbmVudC1oYXJuZXNzJztcbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4vdGVzdC1lbGVtZW50JztcblxuLyoqXG4gKiBCYXNlIGhhcm5lc3MgZW52aXJvbm1lbnQgY2xhc3MgdGhhdCBjYW4gYmUgZXh0ZW5kZWQgdG8gYWxsb3cgYENvbXBvbmVudEhhcm5lc3NgZXMgdG8gYmUgdXNlZCBpblxuICogZGlmZmVyZW50IHRlc3QgZW52aXJvbm1lbnRzIChlLmcuIHRlc3RiZWQsIHByb3RyYWN0b3IsIGV0Yy4pLiBUaGlzIGNsYXNzIGltcGxlbWVudHMgdGhlXG4gKiBmdW5jdGlvbmFsaXR5IG9mIGJvdGggYSBgSGFybmVzc0xvYWRlcmAgYW5kIGBMb2NhdG9yRmFjdG9yeWAuIFRoaXMgY2xhc3MgaXMgZ2VuZXJpYyBvbiB0aGUgcmF3XG4gKiBlbGVtZW50IHR5cGUsIGBFYCwgdXNlZCBieSB0aGUgcGFydGljdWxhciB0ZXN0IGVudmlyb25tZW50LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFybmVzc0Vudmlyb25tZW50PEU+IGltcGxlbWVudHMgSGFybmVzc0xvYWRlciwgTG9jYXRvckZhY3Rvcnkge1xuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgcm9vdEVsZW1lbnQ6IFRlc3RFbGVtZW50O1xuXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcmF3Um9vdEVsZW1lbnQ6IEUpIHtcbiAgICB0aGlzLnJvb3RFbGVtZW50ID0gdGhpcy5jcmVhdGVUZXN0RWxlbWVudChyYXdSb290RWxlbWVudCk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgZG9jdW1lbnRSb290TG9jYXRvckZhY3RvcnkoKTogTG9jYXRvckZhY3Rvcnkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KHRoaXMuZ2V0RG9jdW1lbnRSb290KCkpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGxvY2F0b3JGb3Ioc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50PjtcbiAgbG9jYXRvckZvcjxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFQ+O1xuICBsb2NhdG9yRm9yPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGFyZzogc3RyaW5nIHwgQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPikge1xuICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlVGVzdEVsZW1lbnQoYXdhaXQgdGhpcy5fYXNzZXJ0RWxlbWVudEZvdW5kKGFyZykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Fzc2VydEhhcm5lc3NGb3VuZChhcmcpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgTG9jYXRvckZhY3RvcnlgIGludGVyZmFjZS5cbiAgbG9jYXRvckZvck9wdGlvbmFsKHNlbGVjdG9yOiBzdHJpbmcpOiBBc3luY0ZhY3RvcnlGbjxUZXN0RWxlbWVudCB8IG51bGw+O1xuICBsb2NhdG9yRm9yT3B0aW9uYWw8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBBc3luY0ZhY3RvcnlGbjxUIHwgbnVsbD47XG4gIGxvY2F0b3JGb3JPcHRpb25hbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBhcmc6IHN0cmluZyB8IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pIHtcbiAgICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhhcmcpKVswXTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgPyB0aGlzLmNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQpIDogbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBhd2FpdCB0aGlzLl9nZXRBbGxIYXJuZXNzZXMoYXJnKTtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZXNbMF0gfHwgbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGxvY2F0b3JGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50W10+O1xuICBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogQXN5bmNGYWN0b3J5Rm48VFtdPjtcbiAgbG9jYXRvckZvckFsbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBhcmc6IHN0cmluZyB8IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pIHtcbiAgICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhhcmcpKS5tYXAoZSA9PiB0aGlzLmNyZWF0ZVRlc3RFbGVtZW50KGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRBbGxIYXJuZXNzZXMoYXJnKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGFzeW5jIGhhcm5lc3NMb2FkZXJGb3Ioc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcj4ge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KGF3YWl0IHRoaXMuX2Fzc2VydEVsZW1lbnRGb3VuZChzZWxlY3RvcikpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGFzeW5jIGhhcm5lc3NMb2FkZXJGb3JPcHRpb25hbChzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyIHwgbnVsbD4ge1xuICAgIGNvbnN0IGVsZW1lbnRzID0gYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3Rvcik7XG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdID8gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50c1swXSkgOiBudWxsO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiB0aGUgYExvY2F0b3JGYWN0b3J5YCBpbnRlcmZhY2UuXG4gIGFzeW5jIGhhcm5lc3NMb2FkZXJGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcltdPiB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBhd2FpdCB0aGlzLmdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yKTtcbiAgICByZXR1cm4gZWxlbWVudHMubWFwKGVsZW1lbnQgPT4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChlbGVtZW50KSk7XG4gIH1cblxuICAvLyBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIHRoZSBgSGFybmVzc0xvYWRlcmAgaW50ZXJmYWNlLlxuICBnZXRIYXJuZXNzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZvcihoYXJuZXNzVHlwZSkoKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGdldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VFtdPiB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZvckFsbChoYXJuZXNzVHlwZSkoKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGFzeW5jIGdldENoaWxkTG9hZGVyKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFbnZpcm9ubWVudChhd2FpdCB0aGlzLl9hc3NlcnRFbGVtZW50Rm91bmQoc2VsZWN0b3IpKTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgdGhlIGBIYXJuZXNzTG9hZGVyYCBpbnRlcmZhY2UuXG4gIGFzeW5jIGdldEFsbENoaWxkTG9hZGVycyhzZWxlY3Rvcjogc3RyaW5nKTogUHJvbWlzZTxIYXJuZXNzTG9hZGVyW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QWxsUmF3RWxlbWVudHMoc2VsZWN0b3IpKS5tYXAoZSA9PiB0aGlzLmNyZWF0ZUVudmlyb25tZW50KGUpKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgYENvbXBvbmVudEhhcm5lc3NgIGZvciB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlIHdpdGggdGhlIGdpdmVuIHJhdyBob3N0IGVsZW1lbnQuICovXG4gIHByb3RlY3RlZCBjcmVhdGVDb21wb25lbnRIYXJuZXNzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4sIGVsZW1lbnQ6IEUpOiBUIHtcbiAgICByZXR1cm4gbmV3IGhhcm5lc3NUeXBlKHRoaXMuY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudCkpO1xuICB9XG5cbiAgLy8gUGFydCBvZiBMb2NhdG9yRmFjdG9yeSBpbnRlcmZhY2UsIHN1YmNsYXNzZXMgd2lsbCBpbXBsZW1lbnQuXG4gIGFic3RyYWN0IGZvcmNlU3RhYmlsaXplKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLy8gUGFydCBvZiBMb2NhdG9yRmFjdG9yeSBpbnRlcmZhY2UsIHN1YmNsYXNzZXMgd2lsbCBpbXBsZW1lbnQuXG4gIGFic3RyYWN0IHdhaXRGb3JUYXNrc091dHNpZGVBbmd1bGFyKCk6IFByb21pc2U8dm9pZD47XG5cbiAgLyoqIEdldHMgdGhlIHJvb3QgZWxlbWVudCBmb3IgdGhlIGRvY3VtZW50LiAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgZ2V0RG9jdW1lbnRSb290KCk6IEU7XG5cbiAgLyoqIENyZWF0ZXMgYSBgVGVzdEVsZW1lbnRgIGZyb20gYSByYXcgZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGNyZWF0ZVRlc3RFbGVtZW50KGVsZW1lbnQ6IEUpOiBUZXN0RWxlbWVudDtcblxuICAvKiogQ3JlYXRlcyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGdpdmVuIHJhdyBlbGVtZW50LiAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3QgY3JlYXRlRW52aXJvbm1lbnQoZWxlbWVudDogRSk6IEhhcm5lc3NFbnZpcm9ubWVudDxFPjtcblxuICAvKipcbiAgICogR2V0cyBhIGxpc3Qgb2YgYWxsIGVsZW1lbnRzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZWxlY3RvciB1bmRlciB0aGlzIGVudmlyb25tZW50J3Mgcm9vdCBlbGVtZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IGdldEFsbFJhd0VsZW1lbnRzKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEVbXT47XG5cbiAgcHJpdmF0ZSBhc3luYyBfZ2V0QWxsSGFybmVzc2VzPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogUHJvbWlzZTxUW10+IHtcbiAgICBjb25zdCBoYXJuZXNzUHJlZGljYXRlID0gaGFybmVzc1R5cGUgaW5zdGFuY2VvZiBIYXJuZXNzUHJlZGljYXRlID9cbiAgICAgICAgaGFybmVzc1R5cGUgOiBuZXcgSGFybmVzc1ByZWRpY2F0ZShoYXJuZXNzVHlwZSwge30pO1xuICAgIGNvbnN0IGVsZW1lbnRzID0gYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhoYXJuZXNzUHJlZGljYXRlLmdldFNlbGVjdG9yKCkpO1xuICAgIHJldHVybiBoYXJuZXNzUHJlZGljYXRlLmZpbHRlcihlbGVtZW50cy5tYXAoXG4gICAgICAgIGVsZW1lbnQgPT4gdGhpcy5jcmVhdGVDb21wb25lbnRIYXJuZXNzKGhhcm5lc3NQcmVkaWNhdGUuaGFybmVzc1R5cGUsIGVsZW1lbnQpKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9hc3NlcnRFbGVtZW50Rm91bmQoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8RT4ge1xuICAgIGNvbnN0IGVsZW1lbnQgPSAoYXdhaXQgdGhpcy5nZXRBbGxSYXdFbGVtZW50cyhzZWxlY3RvcikpWzBdO1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgdGhyb3cgRXJyb3IoYEV4cGVjdGVkIHRvIGZpbmQgZWxlbWVudCBtYXRjaGluZyBzZWxlY3RvcjogXCIke3NlbGVjdG9yfVwiLCBidXQgbm9uZSB3YXMgZm91bmRgKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF9hc3NlcnRIYXJuZXNzRm91bmQ8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCBoYXJuZXNzID0gKGF3YWl0IHRoaXMuX2dldEFsbEhhcm5lc3NlcyhoYXJuZXNzVHlwZSkpWzBdO1xuICAgIGlmICghaGFybmVzcykge1xuICAgICAgdGhyb3cgX2dldEVycm9yRm9yTWlzc2luZ0hhcm5lc3MoaGFybmVzc1R5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gaGFybmVzcztcbiAgfVxufVxuXG5mdW5jdGlvbiBfZ2V0RXJyb3JGb3JNaXNzaW5nSGFybmVzczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBFcnJvciB7XG4gIGNvbnN0IGhhcm5lc3NQcmVkaWNhdGUgPVxuICAgICAgaGFybmVzc1R5cGUgaW5zdGFuY2VvZiBIYXJuZXNzUHJlZGljYXRlID8gaGFybmVzc1R5cGUgOiBuZXcgSGFybmVzc1ByZWRpY2F0ZShoYXJuZXNzVHlwZSwge30pO1xuICBjb25zdCB7bmFtZSwgaG9zdFNlbGVjdG9yfSA9IGhhcm5lc3NQcmVkaWNhdGUuaGFybmVzc1R5cGU7XG4gIGxldCByZXN0cmljdGlvbnMgPSBoYXJuZXNzUHJlZGljYXRlLmdldERlc2NyaXB0aW9uKCk7XG4gIGxldCBtZXNzYWdlID0gYEV4cGVjdGVkIHRvIGZpbmQgZWxlbWVudCBmb3IgJHtuYW1lfSBtYXRjaGluZyBzZWxlY3RvcjogXCIke2hvc3RTZWxlY3Rvcn1cImA7XG4gIGlmIChyZXN0cmljdGlvbnMpIHtcbiAgICBtZXNzYWdlICs9IGAgKHdpdGggcmVzdHJpY3Rpb25zOiAke3Jlc3RyaWN0aW9uc30pYDtcbiAgfVxuICBtZXNzYWdlICs9ICcsIGJ1dCBub25lIHdhcyBmb3VuZCc7XG4gIHJldHVybiBFcnJvcihtZXNzYWdlKTtcbn1cbiJdfQ==