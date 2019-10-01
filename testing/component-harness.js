/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/testing/component-harness", ["require", "exports", "tslib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * Base class for component harnesses that all component harness authors should extend. This base
     * component harness provides the basic ability to locate element and sub-component harness. It
     * should be inherited when defining user's own harness.
     */
    var ComponentHarness = /** @class */ (function () {
        function ComponentHarness(locatorFactory) {
            this.locatorFactory = locatorFactory;
        }
        /** Gets a `Promise` for the `TestElement` representing the host element of the component. */
        ComponentHarness.prototype.host = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.rootElement];
                });
            });
        };
        /**
         * Gets a `LocatorFactory` for the document root element. This factory can be used to create
         * locators for elements that a component creates outside of its own root element. (e.g. by
         * appending to document.body).
         */
        ComponentHarness.prototype.documentRootLocatorFactory = function () {
            return this.locatorFactory.documentRootLocatorFactory();
        };
        ComponentHarness.prototype.locatorFor = function (arg) {
            return this.locatorFactory.locatorFor(arg);
        };
        ComponentHarness.prototype.locatorForOptional = function (arg) {
            return this.locatorFactory.locatorForOptional(arg);
        };
        ComponentHarness.prototype.locatorForAll = function (arg) {
            return this.locatorFactory.locatorForAll(arg);
        };
        /**
         * Flushes change detection and async tasks.
         * In most cases it should not be necessary to call this manually. However, there may be some edge
         * cases where it is needed to fully flush animation events.
         */
        ComponentHarness.prototype.forceStabilize = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    return [2 /*return*/, this.locatorFactory.forceStabilize()];
                });
            });
        };
        return ComponentHarness;
    }());
    exports.ComponentHarness = ComponentHarness;
    /**
     * A class used to associate a ComponentHarness class with predicates functions that can be used to
     * filter instances of the class.
     */
    var HarnessPredicate = /** @class */ (function () {
        function HarnessPredicate(harnessType, options) {
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
        HarnessPredicate.stringMatches = function (s, pattern) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, s];
                        case 1:
                            s = _a.sent();
                            return [2 /*return*/, typeof pattern === 'string' ? s === pattern : pattern.test(s)];
                    }
                });
            });
        };
        /**
         * Adds a predicate function to be run against candidate harnesses.
         * @param description A description of this predicate that may be used in error messages.
         * @param predicate An async predicate function.
         * @return this (for method chaining).
         */
        HarnessPredicate.prototype.add = function (description, predicate) {
            this._descriptions.push(description);
            this._predicates.push(predicate);
            return this;
        };
        /**
         * Adds a predicate function that depends on an option value to be run against candidate
         * harnesses. If the option value is undefined, the predicate will be ignored.
         * @param name The name of the option (may be used in error messages).
         * @param option The option value.
         * @param predicate The predicate function to run if the option value is not undefined.
         * @return this (for method chaining).
         */
        HarnessPredicate.prototype.addOption = function (name, option, predicate) {
            // Add quotes around strings to differentiate them from other values
            var value = typeof option === 'string' ? "\"" + option + "\"" : "" + option;
            if (option !== undefined) {
                this.add(name + " = " + value, function (item) { return predicate(item, option); });
            }
            return this;
        };
        /**
         * Filters a list of harnesses on this predicate.
         * @param harnesses The list of harnesses to filter.
         * @return A list of harnesses that satisfy this predicate.
         */
        HarnessPredicate.prototype.filter = function (harnesses) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var results;
                var _this = this;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(harnesses.map(function (h) { return _this.evaluate(h); }))];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, harnesses.filter(function (_, i) { return results[i]; })];
                    }
                });
            });
        };
        /**
         * Evaluates whether the given harness satisfies this predicate.
         * @param harness The harness to check
         * @return A promise that resolves to true if the harness satisfies this predicate,
         *   and resolves to false otherwise.
         */
        HarnessPredicate.prototype.evaluate = function (harness) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var results;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.all(this._predicates.map(function (p) { return p(harness); }))];
                        case 1:
                            results = _a.sent();
                            return [2 /*return*/, results.reduce(function (combined, current) { return combined && current; }, true)];
                    }
                });
            });
        };
        /** Gets a description of this predicate for use in error messages. */
        HarnessPredicate.prototype.getDescription = function () {
            return this._descriptions.join(', ');
        };
        /** Gets the selector used to find candidate elements. */
        HarnessPredicate.prototype.getSelector = function () {
            var _this = this;
            return this._ancestor.split(',')
                .map(function (part) { return (part.trim() + " " + _this.harnessType.hostSelector).trim(); })
                .join(',');
        };
        /** Adds base options common to all harness types. */
        HarnessPredicate.prototype._addBaseOptions = function (options) {
            var _this = this;
            this._ancestor = options.ancestor || '';
            if (this._ancestor) {
                this._descriptions.push("has ancestor matching selector \"" + this._ancestor + "\"");
            }
            var selector = options.selector;
            if (selector !== undefined) {
                this.add("host matches selector \"" + selector + "\"", function (item) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, item.host()];
                            case 1: return [2 /*return*/, (_a.sent()).matchesSelector(selector)];
                        }
                    });
                }); });
            }
        };
        return HarnessPredicate;
    }());
    exports.HarnessPredicate = HarnessPredicate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LWhhcm5lc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3Rlc3RpbmcvY29tcG9uZW50LWhhcm5lc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBbUpIOzs7O09BSUc7SUFDSDtRQUNFLDBCQUE2QixjQUE4QjtZQUE5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFBRyxDQUFDO1FBRS9ELDZGQUE2RjtRQUN2RiwrQkFBSSxHQUFWOzs7b0JBQ0Usc0JBQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUM7OztTQUN4QztRQUVEOzs7O1dBSUc7UUFDTyxxREFBMEIsR0FBcEM7WUFDRSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUMxRCxDQUFDO1FBeUJTLHFDQUFVLEdBQXBCLFVBQXFCLEdBQVE7WUFDM0IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBeUJTLDZDQUFrQixHQUE1QixVQUE2QixHQUFRO1lBQ25DLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBd0JTLHdDQUFhLEdBQXZCLFVBQXdCLEdBQVE7WUFDOUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQ7Ozs7V0FJRztRQUNhLHlDQUFjLEdBQTlCOzs7b0JBQ0Usc0JBQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsRUFBQzs7O1NBQzdDO1FBQ0gsdUJBQUM7SUFBRCxDQUFDLEFBekdELElBeUdDO0lBekdxQiw0Q0FBZ0I7SUE4SHRDOzs7T0FHRztJQUNIO1FBS0UsMEJBQW1CLFdBQTJDLEVBQUUsT0FBMkI7WUFB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Q0FBQyxZQUFjLENBQUEsQ0FBQyxJQUFJLEVBQUUsRUFBeEQsQ0FBd0QsQ0FBQztpQkFDckUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxxREFBcUQ7UUFDN0MsMENBQWUsR0FBdkIsVUFBd0IsT0FBMkI7WUFBbkQsaUJBV0M7WUFWQyxJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1lBQ3hDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDbEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsc0NBQW1DLElBQUksQ0FBQyxTQUFTLE9BQUcsQ0FBQyxDQUFDO2FBQy9FO1lBQ0QsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztZQUNsQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7Z0JBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsNkJBQTBCLFFBQVEsT0FBRyxFQUFFLFVBQU0sSUFBSTs7O29DQUNoRCxxQkFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUE7b0NBQXpCLHNCQUFPLENBQUMsU0FBaUIsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBQzs7O3FCQUN0RCxDQUFDLENBQUM7YUFDSjtRQUNILENBQUM7UUFDSCx1QkFBQztJQUFELENBQUMsQUFqR0QsSUFpR0M7SUFqR1ksNENBQWdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VGVzdEVsZW1lbnR9IGZyb20gJy4vdGVzdC1lbGVtZW50JztcblxuLyoqIEFuIGFzeW5jIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2Ugd2hlbiBjYWxsZWQuICovXG5leHBvcnQgdHlwZSBBc3luY0ZhY3RvcnlGbjxUPiA9ICgpID0+IFByb21pc2U8VD47XG5cbi8qKiBBbiBhc3luYyBmdW5jdGlvbiB0aGF0IHRha2VzIGFuIGl0ZW0gYW5kIHJldHVybnMgYSBib29sZWFuIHByb21pc2UgKi9cbmV4cG9ydCB0eXBlIEFzeW5jUHJlZGljYXRlPFQ+ID0gKGl0ZW06IFQpID0+IFByb21pc2U8Ym9vbGVhbj47XG5cbi8qKiBBbiBhc3luYyBmdW5jdGlvbiB0aGF0IHRha2VzIGFuIGl0ZW0gYW5kIGFuIG9wdGlvbiB2YWx1ZSBhbmQgcmV0dXJucyBhIGJvb2xlYW4gcHJvbWlzZS4gKi9cbmV4cG9ydCB0eXBlIEFzeW5jT3B0aW9uUHJlZGljYXRlPFQsIE8+ID0gKGl0ZW06IFQsIG9wdGlvbjogTykgPT4gUHJvbWlzZTxib29sZWFuPjtcblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byBsb2FkIENvbXBvbmVudEhhcm5lc3Mgb2JqZWN0cy4gVGhpcyBpbnRlcmZhY2UgaXMgdXNlZCBieSB0ZXN0IGF1dGhvcnMgdG9cbiAqIGluc3RhbnRpYXRlIGBDb21wb25lbnRIYXJuZXNzYGVzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEhhcm5lc3NMb2FkZXIge1xuICAvKipcbiAgICogU2VhcmNoZXMgZm9yIGFuIGVsZW1lbnQgd2l0aCB0aGUgZ2l2ZW4gc2VsZWN0b3IgdW5kZXIgdGhlIGN1cnJlbnQgaW5zdGFuY2VzJ3Mgcm9vdCBlbGVtZW50LFxuICAgKiBhbmQgcmV0dXJucyBhIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIG1hdGNoaW5nIGVsZW1lbnQuIElmIG11bHRpcGxlIGVsZW1lbnRzIG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciwgdGhlIGZpcnN0IGlzIHVzZWQuIElmIG5vIGVsZW1lbnRzIG1hdGNoLCBhbiBlcnJvciBpcyB0aHJvd24uXG4gICAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgZm9yIHRoZSByb290IGVsZW1lbnQgb2YgdGhlIG5ldyBgSGFybmVzc0xvYWRlcmBcbiAgICogQHJldHVybiBBIGBIYXJuZXNzTG9hZGVyYCByb290ZWQgYXQgdGhlIGVsZW1lbnQgbWF0Y2hpbmcgdGhlIGdpdmVuIHNlbGVjdG9yLlxuICAgKiBAdGhyb3dzIElmIGEgbWF0Y2hpbmcgZWxlbWVudCBjYW4ndCBiZSBmb3VuZC5cbiAgICovXG4gIGdldENoaWxkTG9hZGVyKHNlbGVjdG9yOiBzdHJpbmcpOiBQcm9taXNlPEhhcm5lc3NMb2FkZXI+O1xuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYWxsIGVsZW1lbnRzIHdpdGggdGhlIGdpdmVuIHNlbGVjdG9yIHVuZGVyIHRoZSBjdXJyZW50IGluc3RhbmNlcydzIHJvb3QgZWxlbWVudCxcbiAgICogYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgYEhhcm5lc3NMb2FkZXJgcywgb25lIGZvciBlYWNoIG1hdGNoaW5nIGVsZW1lbnQsIHJvb3RlZCBhdCB0aGF0XG4gICAqIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgZm9yIHRoZSByb290IGVsZW1lbnQgb2YgdGhlIG5ldyBgSGFybmVzc0xvYWRlcmBcbiAgICogQHJldHVybiBBIGxpc3Qgb2YgYEhhcm5lc3NMb2FkZXJgcywgb25lIGZvciBlYWNoIG1hdGNoaW5nIGVsZW1lbnQsIHJvb3RlZCBhdCB0aGF0IGVsZW1lbnQuXG4gICAqL1xuICBnZXRBbGxDaGlsZExvYWRlcnMoc2VsZWN0b3I6IHN0cmluZyk6IFByb21pc2U8SGFybmVzc0xvYWRlcltdPjtcblxuICAvKipcbiAgICogU2VhcmNoZXMgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBjb21wb25lbnQgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlIHVuZGVyIHRoZVxuICAgKiBgSGFybmVzc0xvYWRlcmAncyByb290IGVsZW1lbnQsIGFuZCByZXR1cm5zIGEgYENvbXBvbmVudEhhcm5lc3NgIGZvciB0aGF0IGluc3RhbmNlLiBJZiBtdWx0aXBsZVxuICAgKiBtYXRjaGluZyBjb21wb25lbnRzIGFyZSBmb3VuZCwgYSBoYXJuZXNzIGZvciB0aGUgZmlyc3Qgb25lIGlzIHJldHVybmVkLiBJZiBubyBtYXRjaGluZ1xuICAgKiBjb21wb25lbnQgaXMgZm91bmQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIGhhcm5lc3NUeXBlIFRoZSB0eXBlIG9mIGhhcm5lc3MgdG8gY3JlYXRlXG4gICAqIEByZXR1cm4gQW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZVxuICAgKiBAdGhyb3dzIElmIGEgbWF0Y2hpbmcgY29tcG9uZW50IGluc3RhbmNlIGNhbid0IGJlIGZvdW5kLlxuICAgKi9cbiAgZ2V0SGFybmVzczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VD47XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhbGwgaW5zdGFuY2VzIG9mIHRoZSBjb21wb25lbnQgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gaGFybmVzcyB0eXBlIHVuZGVyIHRoZVxuICAgKiBgSGFybmVzc0xvYWRlcmAncyByb290IGVsZW1lbnQsIGFuZCByZXR1cm5zIGEgbGlzdCBgQ29tcG9uZW50SGFybmVzc2AgZm9yIGVhY2ggaW5zdGFuY2UuXG4gICAqIEBwYXJhbSBoYXJuZXNzVHlwZSBUaGUgdHlwZSBvZiBoYXJuZXNzIHRvIGNyZWF0ZVxuICAgKiBAcmV0dXJuIEEgbGlzdCBpbnN0YW5jZXMgb2YgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZS5cbiAgICovXG4gIGdldEFsbEhhcm5lc3NlczxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IFByb21pc2U8VFtdPjtcbn1cblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byBjcmVhdGUgYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb25zIHVzZWQgZmluZCBlbGVtZW50cyBhbmQgY29tcG9uZW50XG4gKiBoYXJuZXNzZXMuIFRoaXMgaW50ZXJmYWNlIGlzIHVzZWQgYnkgYENvbXBvbmVudEhhcm5lc3NgIGF1dGhvcnMgdG8gY3JlYXRlIGxvY2F0b3IgZnVuY3Rpb25zIGZvclxuICogdGhlaXIgYENvbXBvbmVudEhhcmVuc3NgIHN1YmNsYXNzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvY2F0b3JGYWN0b3J5IHtcbiAgLyoqIEdldHMgYSBsb2NhdG9yIGZhY3Rvcnkgcm9vdGVkIGF0IHRoZSBkb2N1bWVudCByb290LiAqL1xuICBkb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpOiBMb2NhdG9yRmFjdG9yeTtcblxuICAvKiogVGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAgYXMgYSBgVGVzdEVsZW1lbnRgLiAqL1xuICByb290RWxlbWVudDogVGVzdEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBzZWFyY2ggZm9yIGVsZW1lbnRzIHdpdGggdGhlIGdpdmVuXG4gICAqIHNlbGVjdG9yIHVuZGVyIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBgTG9jYXRvckZhY3RvcnlgLiBXaGVuIHRoZSByZXN1bHRpbmcgbG9jYXRvciBmdW5jdGlvblxuICAgKiBpcyBpbnZva2VkLCBpZiBtdWx0aXBsZSBtYXRjaGluZyBlbGVtZW50cyBhcmUgZm91bmQsIHRoZSBmaXJzdCBlbGVtZW50IGlzIHJldHVybmVkLiBJZiBub1xuICAgKiBlbGVtZW50cyBhcmUgZm91bmQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnQgdGhhdCB0aGUgbG9jYXRvciBmdW5jdGlvbiBzaG91bGQgc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBlbGVtZW50cyB3aXRoIHRoZSBnaXZlbiBzZWxlY3RvcixcbiAgICogICAgIGFuZCBlaXRoZXIgZmluZHMgb25lIG9yIHRocm93cyBhbiBlcnJvclxuICAgKi9cbiAgbG9jYXRvckZvcihzZWxlY3Rvcjogc3RyaW5nKTogQXN5bmNGYWN0b3J5Rm48VGVzdEVsZW1lbnQ+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgYVxuICAgKiBjb21wb25lbnQgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSB1bmRlciB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC5cbiAgICogV2hlbiB0aGUgcmVzdWx0aW5nIGxvY2F0b3IgZnVuY3Rpb24gaXMgaW52b2tlZCwgaWYgbXVsdGlwbGUgbWF0Y2hpbmcgY29tcG9uZW50cyBhcmUgZm91bmQsIGFcbiAgICogaGFybmVzcyBmb3IgdGhlIGZpcnN0IG9uZSBpcyByZXR1cm5lZC4gSWYgbm8gY29tcG9uZW50cyBhcmUgZm91bmQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIGhhcm5lc3NUeXBlIFRoZSB0eXBlIG9mIGhhcm5lc3MgdG8gc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGNvbXBvbmVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3NcbiAgICogICAgIHR5cGUsIGFuZCBlaXRoZXIgcmV0dXJucyBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgdGhlIGNvbXBvbmVudCwgb3IgdGhyb3dzIGFuIGVycm9yLlxuICAgKi9cbiAgbG9jYXRvckZvcjxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFQ+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2VhcmNoIGZvciBlbGVtZW50cyB3aXRoIHRoZSBnaXZlblxuICAgKiBzZWxlY3RvciB1bmRlciB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC4gV2hlbiB0aGUgcmVzdWx0aW5nIGxvY2F0b3IgZnVuY3Rpb25cbiAgICogaXMgaW52b2tlZCwgaWYgbXVsdGlwbGUgbWF0Y2hpbmcgZWxlbWVudHMgYXJlIGZvdW5kLCB0aGUgZmlyc3QgZWxlbWVudCBpcyByZXR1cm5lZC4gSWYgbm9cbiAgICogZWxlbWVudHMgYXJlIGZvdW5kLCBudWxsIGlzIHJldHVybmVkLlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgVGhlIHNlbGVjdG9yIGZvciB0aGUgZWxlbWVudCB0aGF0IHRoZSBsb2NhdG9yIGZ1bmN0aW9uIHNob3VsZCBzZWFyY2ggZm9yLlxuICAgKiBAcmV0dXJuIEFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgc2VhcmNoZXMgZm9yIGVsZW1lbnRzIHdpdGggdGhlIGdpdmVuIHNlbGVjdG9yLFxuICAgKiAgICAgYW5kIGVpdGhlciBmaW5kcyBvbmUgb3IgcmV0dXJucyBudWxsLlxuICAgKi9cbiAgbG9jYXRvckZvck9wdGlvbmFsKHNlbGVjdG9yOiBzdHJpbmcpOiBBc3luY0ZhY3RvcnlGbjxUZXN0RWxlbWVudCB8IG51bGw+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgYVxuICAgKiBjb21wb25lbnQgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSB1bmRlciB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgYExvY2F0b3JGYWN0b3J5YC5cbiAgICogV2hlbiB0aGUgcmVzdWx0aW5nIGxvY2F0b3IgZnVuY3Rpb24gaXMgaW52b2tlZCwgaWYgbXVsdGlwbGUgbWF0Y2hpbmcgY29tcG9uZW50cyBhcmUgZm91bmQsIGFcbiAgICogaGFybmVzcyBmb3IgdGhlIGZpcnN0IG9uZSBpcyByZXR1cm5lZC4gSWYgbm8gY29tcG9uZW50cyBhcmUgZm91bmQsIG51bGwgaXMgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBoYXJuZXNzVHlwZSBUaGUgdHlwZSBvZiBoYXJuZXNzIHRvIHNlYXJjaCBmb3IuXG4gICAqIEByZXR1cm4gQW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBzZWFyY2hlcyBjb21wb25lbnRzIG1hdGNoaW5nIHRoZSBnaXZlbiBoYXJuZXNzXG4gICAqICAgICB0eXBlLCBhbmQgZWl0aGVyIHJldHVybnMgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIHRoZSBjb21wb25lbnQsIG9yIG51bGwgaWYgbm9uZSBpcyBmb3VuZC5cbiAgICovXG4gIGxvY2F0b3JGb3JPcHRpb25hbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFQgfCBudWxsPjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHNlYXJjaCBmb3IgYSBsaXN0IG9mIGVsZW1lbnRzIHdpdGhcbiAgICogdGhlIGdpdmVuIHNlbGVjdG9yIHVuZGVyIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBgTG9jYXRvckZhY3RvcnlgLiBXaGVuIHRoZSByZXN1bHRpbmcgbG9jYXRvclxuICAgKiBmdW5jdGlvbiBpcyBpbnZva2VkLCBhIGxpc3Qgb2YgbWF0Y2hpbmcgZWxlbWVudHMgaXMgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgZm9yIHRoZSBlbGVtZW50IHRoYXQgdGhlIGxvY2F0b3IgZnVuY3Rpb24gc2hvdWxkIHNlYXJjaCBmb3IuXG4gICAqIEByZXR1cm4gQW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgd2l0aCB0aGUgZ2l2ZW4gc2VsZWN0b3IsXG4gICAqICAgICBhbmQgZWl0aGVyIGZpbmRzIG9uZSBvciB0aHJvd3MgYW4gZXJyb3JcbiAgICovXG4gIGxvY2F0b3JGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50W10+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGxpc3Qgb2ZcbiAgICogYENvbXBvbmVudEhhcm5lc3NgZXMgZm9yIGFsbCBjb21wb25lbnRzIG1hdGNoaW5nIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgdW5kZXIgdGhlIHJvb3QgZWxlbWVudFxuICAgKiBvZiB0aGlzIGBMb2NhdG9yRmFjdG9yeWAuIFdoZW4gdGhlIHJlc3VsdGluZyBsb2NhdG9yIGZ1bmN0aW9uIGlzIGludm9rZWQsIGEgbGlzdCBvZlxuICAgKiBgQ29tcG9uZW50SGFybmVzc2BlcyBmb3IgdGhlIG1hdGNoaW5nIGNvbXBvbmVudHMgaXMgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBoYXJuZXNzVHlwZSBUaGUgdHlwZSBvZiBoYXJuZXNzIHRvIHNlYXJjaCBmb3IuXG4gICAqIEByZXR1cm4gQW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBzZWFyY2hlcyBjb21wb25lbnRzIG1hdGNoaW5nIHRoZSBnaXZlbiBoYXJuZXNzXG4gICAqICAgICB0eXBlLCBhbmQgcmV0dXJucyBhIGxpc3Qgb2YgYENvbXBvbmVudEhhcm5lc3NgZXMuXG4gICAqL1xuICBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogQXN5bmNGYWN0b3J5Rm48VFtdPjtcblxuICAvKipcbiAgICogRmx1c2hlcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBhc3luYyB0YXNrcy5cbiAgICogSW4gbW9zdCBjYXNlcyBpdCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgbWFudWFsbHkuIEhvd2V2ZXIsIHRoZXJlIG1heSBiZSBzb21lIGVkZ2VcbiAgICogY2FzZXMgd2hlcmUgaXQgaXMgbmVlZGVkIHRvIGZ1bGx5IGZsdXNoIGFuaW1hdGlvbiBldmVudHMuXG4gICAqL1xuICBmb3JjZVN0YWJpbGl6ZSgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGNvbXBvbmVudCBoYXJuZXNzZXMgdGhhdCBhbGwgY29tcG9uZW50IGhhcm5lc3MgYXV0aG9ycyBzaG91bGQgZXh0ZW5kLiBUaGlzIGJhc2VcbiAqIGNvbXBvbmVudCBoYXJuZXNzIHByb3ZpZGVzIHRoZSBiYXNpYyBhYmlsaXR5IHRvIGxvY2F0ZSBlbGVtZW50IGFuZCBzdWItY29tcG9uZW50IGhhcm5lc3MuIEl0XG4gKiBzaG91bGQgYmUgaW5oZXJpdGVkIHdoZW4gZGVmaW5pbmcgdXNlcidzIG93biBoYXJuZXNzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50SGFybmVzcyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbG9jYXRvckZhY3Rvcnk6IExvY2F0b3JGYWN0b3J5KSB7fVxuXG4gIC8qKiBHZXRzIGEgYFByb21pc2VgIGZvciB0aGUgYFRlc3RFbGVtZW50YCByZXByZXNlbnRpbmcgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LiAqL1xuICBhc3luYyBob3N0KCk6IFByb21pc2U8VGVzdEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRmFjdG9yeS5yb290RWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgYExvY2F0b3JGYWN0b3J5YCBmb3IgdGhlIGRvY3VtZW50IHJvb3QgZWxlbWVudC4gVGhpcyBmYWN0b3J5IGNhbiBiZSB1c2VkIHRvIGNyZWF0ZVxuICAgKiBsb2NhdG9ycyBmb3IgZWxlbWVudHMgdGhhdCBhIGNvbXBvbmVudCBjcmVhdGVzIG91dHNpZGUgb2YgaXRzIG93biByb290IGVsZW1lbnQuIChlLmcuIGJ5XG4gICAqIGFwcGVuZGluZyB0byBkb2N1bWVudC5ib2R5KS5cbiAgICovXG4gIHByb3RlY3RlZCBkb2N1bWVudFJvb3RMb2NhdG9yRmFjdG9yeSgpOiBMb2NhdG9yRmFjdG9yeSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkuZG9jdW1lbnRSb290TG9jYXRvckZhY3RvcnkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2VhcmNoIGZvciBlbGVtZW50cyB3aXRoIHRoZSBnaXZlblxuICAgKiBzZWxlY3RvciB1bmRlciB0aGUgaG9zdCBlbGVtZW50IG9mIHRoaXMgYENvbXBvbmVudEhhcm5lc3NgLiBXaGVuIHRoZSByZXN1bHRpbmcgbG9jYXRvciBmdW5jdGlvblxuICAgKiBpcyBpbnZva2VkLCBpZiBtdWx0aXBsZSBtYXRjaGluZyBlbGVtZW50cyBhcmUgZm91bmQsIHRoZSBmaXJzdCBlbGVtZW50IGlzIHJldHVybmVkLiBJZiBub1xuICAgKiBlbGVtZW50cyBhcmUgZm91bmQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnQgdGhhdCB0aGUgbG9jYXRvciBmdW5jdGlvbiBzaG91bGQgc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBlbGVtZW50cyB3aXRoIHRoZSBnaXZlbiBzZWxlY3RvcixcbiAgICogICAgIGFuZCBlaXRoZXIgZmluZHMgb25lIG9yIHRocm93cyBhbiBlcnJvclxuICAgKi9cbiAgcHJvdGVjdGVkIGxvY2F0b3JGb3Ioc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50PjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGZpbmQgYSBgQ29tcG9uZW50SGFybmVzc2AgZm9yIGFcbiAgICogY29tcG9uZW50IG1hdGNoaW5nIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgdW5kZXIgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGlzIGBDb21wb25lbnRIYXJuZXNzYC5cbiAgICogV2hlbiB0aGUgcmVzdWx0aW5nIGxvY2F0b3IgZnVuY3Rpb24gaXMgaW52b2tlZCwgaWYgbXVsdGlwbGUgbWF0Y2hpbmcgY29tcG9uZW50cyBhcmUgZm91bmQsIGFcbiAgICogaGFybmVzcyBmb3IgdGhlIGZpcnN0IG9uZSBpcyByZXR1cm5lZC4gSWYgbm8gY29tcG9uZW50cyBhcmUgZm91bmQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogQHBhcmFtIGhhcm5lc3NUeXBlIFRoZSB0eXBlIG9mIGhhcm5lc3MgdG8gc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGNvbXBvbmVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3NcbiAgICogICAgIHR5cGUsIGFuZCBlaXRoZXIgcmV0dXJucyBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgdGhlIGNvbXBvbmVudCwgb3IgdGhyb3dzIGFuIGVycm9yLlxuICAgKi9cbiAgcHJvdGVjdGVkIGxvY2F0b3JGb3I8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+KFxuICAgICAgaGFybmVzc1R5cGU6IENvbXBvbmVudEhhcm5lc3NDb25zdHJ1Y3RvcjxUPiB8IEhhcm5lc3NQcmVkaWNhdGU8VD4pOiBBc3luY0ZhY3RvcnlGbjxUPjtcblxuICBwcm90ZWN0ZWQgbG9jYXRvckZvcihhcmc6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LmxvY2F0b3JGb3IoYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gc2VhcmNoIGZvciBlbGVtZW50cyB3aXRoIHRoZSBnaXZlblxuICAgKiBzZWxlY3RvciB1bmRlciB0aGUgaG9zdCBlbGVtZW50IG9mIHRoaXMgYENvbXBvbmVudEhhcm5lc3NgLiBXaGVuIHRoZSByZXN1bHRpbmcgbG9jYXRvciBmdW5jdGlvblxuICAgKiBpcyBpbnZva2VkLCBpZiBtdWx0aXBsZSBtYXRjaGluZyBlbGVtZW50cyBhcmUgZm91bmQsIHRoZSBmaXJzdCBlbGVtZW50IGlzIHJldHVybmVkLiBJZiBub1xuICAgKiBlbGVtZW50cyBhcmUgZm91bmQsIG51bGwgaXMgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgZm9yIHRoZSBlbGVtZW50IHRoYXQgdGhlIGxvY2F0b3IgZnVuY3Rpb24gc2hvdWxkIHNlYXJjaCBmb3IuXG4gICAqIEByZXR1cm4gQW4gYXN5bmNocm9ub3VzIGxvY2F0b3IgZnVuY3Rpb24gdGhhdCBzZWFyY2hlcyBmb3IgZWxlbWVudHMgd2l0aCB0aGUgZ2l2ZW4gc2VsZWN0b3IsXG4gICAqICAgICBhbmQgZWl0aGVyIGZpbmRzIG9uZSBvciByZXR1cm5zIG51bGwuXG4gICAqL1xuICBwcm90ZWN0ZWQgbG9jYXRvckZvck9wdGlvbmFsKHNlbGVjdG9yOiBzdHJpbmcpOiBBc3luY0ZhY3RvcnlGbjxUZXN0RWxlbWVudCB8IG51bGw+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgYVxuICAgKiBjb21wb25lbnQgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3MgdHlwZSB1bmRlciB0aGUgaG9zdCBlbGVtZW50IG9mIHRoaXMgYENvbXBvbmVudEhhcm5lc3NgLlxuICAgKiBXaGVuIHRoZSByZXN1bHRpbmcgbG9jYXRvciBmdW5jdGlvbiBpcyBpbnZva2VkLCBpZiBtdWx0aXBsZSBtYXRjaGluZyBjb21wb25lbnRzIGFyZSBmb3VuZCwgYVxuICAgKiBoYXJuZXNzIGZvciB0aGUgZmlyc3Qgb25lIGlzIHJldHVybmVkLiBJZiBubyBjb21wb25lbnRzIGFyZSBmb3VuZCwgbnVsbCBpcyByZXR1cm5lZC5cbiAgICogQHBhcmFtIGhhcm5lc3NUeXBlIFRoZSB0eXBlIG9mIGhhcm5lc3MgdG8gc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGNvbXBvbmVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3NcbiAgICogICAgIHR5cGUsIGFuZCBlaXRoZXIgcmV0dXJucyBhIGBDb21wb25lbnRIYXJuZXNzYCBmb3IgdGhlIGNvbXBvbmVudCwgb3IgbnVsbCBpZiBub25lIGlzIGZvdW5kLlxuICAgKi9cbiAgcHJvdGVjdGVkIGxvY2F0b3JGb3JPcHRpb25hbDxUIGV4dGVuZHMgQ29tcG9uZW50SGFybmVzcz4oXG4gICAgICBoYXJuZXNzVHlwZTogQ29tcG9uZW50SGFybmVzc0NvbnN0cnVjdG9yPFQ+IHwgSGFybmVzc1ByZWRpY2F0ZTxUPik6IEFzeW5jRmFjdG9yeUZuPFQgfCBudWxsPjtcblxuICBwcm90ZWN0ZWQgbG9jYXRvckZvck9wdGlvbmFsKGFyZzogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYXRvckZhY3RvcnkubG9jYXRvckZvck9wdGlvbmFsKGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHNlYXJjaCBmb3IgYSBsaXN0IG9mIGVsZW1lbnRzIHdpdGhcbiAgICogdGhlIGdpdmVuIHNlbGVjdG9yIHVuZGVyIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhpcyBgQ29tcG9uZW50SGFybmVzc2AuIFdoZW4gdGhlIHJlc3VsdGluZ1xuICAgKiBsb2NhdG9yIGZ1bmN0aW9uIGlzIGludm9rZWQsIGEgbGlzdCBvZiBtYXRjaGluZyBlbGVtZW50cyBpcyByZXR1cm5lZC5cbiAgICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnQgdGhhdCB0aGUgbG9jYXRvciBmdW5jdGlvbiBzaG91bGQgc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGZvciBlbGVtZW50cyB3aXRoIHRoZSBnaXZlbiBzZWxlY3RvcixcbiAgICogICAgIGFuZCBlaXRoZXIgZmluZHMgb25lIG9yIHRocm93cyBhbiBlcnJvclxuICAgKi9cbiAgcHJvdGVjdGVkIGxvY2F0b3JGb3JBbGwoc2VsZWN0b3I6IHN0cmluZyk6IEFzeW5jRmFjdG9yeUZuPFRlc3RFbGVtZW50W10+O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFzeW5jaHJvbm91cyBsb2NhdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZmluZCBhIGxpc3Qgb2ZcbiAgICogYENvbXBvbmVudEhhcm5lc3NgZXMgZm9yIGFsbCBjb21wb25lbnRzIG1hdGNoaW5nIHRoZSBnaXZlbiBoYXJuZXNzIHR5cGUgdW5kZXIgdGhlIGhvc3QgZWxlbWVudFxuICAgKiBvZiB0aGlzIGBDb21wb25lbnRIYXJuZXNzYC4gV2hlbiB0aGUgcmVzdWx0aW5nIGxvY2F0b3IgZnVuY3Rpb24gaXMgaW52b2tlZCwgYSBsaXN0IG9mXG4gICAqIGBDb21wb25lbnRIYXJuZXNzYGVzIGZvciB0aGUgbWF0Y2hpbmcgY29tcG9uZW50cyBpcyByZXR1cm5lZC5cbiAgICogQHBhcmFtIGhhcm5lc3NUeXBlIFRoZSB0eXBlIG9mIGhhcm5lc3MgdG8gc2VhcmNoIGZvci5cbiAgICogQHJldHVybiBBbiBhc3luY2hyb25vdXMgbG9jYXRvciBmdW5jdGlvbiB0aGF0IHNlYXJjaGVzIGNvbXBvbmVudHMgbWF0Y2hpbmcgdGhlIGdpdmVuIGhhcm5lc3NcbiAgICogICAgIHR5cGUsIGFuZCByZXR1cm5zIGEgbGlzdCBvZiBgQ29tcG9uZW50SGFybmVzc2Blcy5cbiAgICovXG4gIHByb3RlY3RlZCBsb2NhdG9yRm9yQWxsPFQgZXh0ZW5kcyBDb21wb25lbnRIYXJuZXNzPihcbiAgICAgIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4gfCBIYXJuZXNzUHJlZGljYXRlPFQ+KTogQXN5bmNGYWN0b3J5Rm48VFtdPjtcblxuICBwcm90ZWN0ZWQgbG9jYXRvckZvckFsbChhcmc6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmxvY2F0b3JGYWN0b3J5LmxvY2F0b3JGb3JBbGwoYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbHVzaGVzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGFzeW5jIHRhc2tzLlxuICAgKiBJbiBtb3N0IGNhc2VzIGl0IHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBtYW51YWxseS4gSG93ZXZlciwgdGhlcmUgbWF5IGJlIHNvbWUgZWRnZVxuICAgKiBjYXNlcyB3aGVyZSBpdCBpcyBuZWVkZWQgdG8gZnVsbHkgZmx1c2ggYW5pbWF0aW9uIGV2ZW50cy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBmb3JjZVN0YWJpbGl6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhdG9yRmFjdG9yeS5mb3JjZVN0YWJpbGl6ZSgpO1xuICB9XG59XG5cbi8qKiBDb25zdHJ1Y3RvciBmb3IgYSBDb21wb25lbnRIYXJuZXNzIHN1YmNsYXNzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+IHtcbiAgbmV3KGxvY2F0b3JGYWN0b3J5OiBMb2NhdG9yRmFjdG9yeSk6IFQ7XG5cbiAgLyoqXG4gICAqIGBDb21wb25lbnRIYXJuZXNzYCBzdWJjbGFzc2VzIG11c3Qgc3BlY2lmeSBhIHN0YXRpYyBgaG9zdFNlbGVjdG9yYCBwcm9wZXJ0eSB0aGF0IGlzIHVzZWQgdG9cbiAgICogZmluZCB0aGUgaG9zdCBlbGVtZW50IGZvciB0aGUgY29ycmVzcG9uZGluZyBjb21wb25lbnQuIFRoaXMgcHJvcGVydHkgc2hvdWxkIG1hdGNoIHRoZSBzZWxlY3RvclxuICAgKiBmb3IgdGhlIEFuZ3VsYXIgY29tcG9uZW50LlxuICAgKi9cbiAgaG9zdFNlbGVjdG9yOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZUhhcm5lc3NGaWx0ZXJzIHtcbiAgLyoqIE9ubHkgZmluZCBjb21wb25lbnQgaW5zdGFuY2VzIHdob3NlIGhvc3QgZWxlbWVudCBtYXRjaGVzIHRoZSBnaXZlbiBzZWxlY3Rvci4gKi9cbiAgc2VsZWN0b3I/OiBzdHJpbmc7XG4gIC8qKiBPbmx5IGZpbmQgY29tcG9uZW50IGluc3RhbmNlcyB0aGF0IGFyZSBuZXN0ZWQgdW5kZXIgYW4gZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBzZWxlY3Rvci4gKi9cbiAgYW5jZXN0b3I/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSBjbGFzcyB1c2VkIHRvIGFzc29jaWF0ZSBhIENvbXBvbmVudEhhcm5lc3MgY2xhc3Mgd2l0aCBwcmVkaWNhdGVzIGZ1bmN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvXG4gKiBmaWx0ZXIgaW5zdGFuY2VzIG9mIHRoZSBjbGFzcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEhhcm5lc3NQcmVkaWNhdGU8VCBleHRlbmRzIENvbXBvbmVudEhhcm5lc3M+IHtcbiAgcHJpdmF0ZSBfcHJlZGljYXRlczogQXN5bmNQcmVkaWNhdGU8VD5bXSA9IFtdO1xuICBwcml2YXRlIF9kZXNjcmlwdGlvbnM6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgX2FuY2VzdG9yOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGhhcm5lc3NUeXBlOiBDb21wb25lbnRIYXJuZXNzQ29uc3RydWN0b3I8VD4sIG9wdGlvbnM6IEJhc2VIYXJuZXNzRmlsdGVycykge1xuICAgIHRoaXMuX2FkZEJhc2VPcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHN0cmluZyBtYXRjaGVzIHRoZSBnaXZlbiBwYXR0ZXJuLlxuICAgKiBAcGFyYW0gcyBUaGUgc3RyaW5nIHRvIGNoZWNrLCBvciBhIFByb21pc2UgZm9yIHRoZSBzdHJpbmcgdG8gY2hlY2suXG4gICAqIEBwYXJhbSBwYXR0ZXJuIFRoZSBwYXR0ZXJuIHRoZSBzdHJpbmcgaXMgZXhwZWN0ZWQgdG8gbWF0Y2guIElmIGBwYXR0ZXJuYCBpcyBhIHN0cmluZywgYHNgIGlzXG4gICAqICAgZXhwZWN0ZWQgdG8gbWF0Y2ggZXhhY3RseS4gSWYgYHBhdHRlcm5gIGlzIGEgcmVnZXgsIGEgcGFydGlhbCBtYXRjaCBpcyBhbGxvd2VkLlxuICAgKiBAcmV0dXJuIEEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHdoZXRoZXIgdGhlIHN0cmluZyBtYXRjaGVzIHRoZSBwYXR0ZXJuLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHN0cmluZ01hdGNoZXMoczogc3RyaW5nIHwgUHJvbWlzZTxzdHJpbmc+LCBwYXR0ZXJuOiBzdHJpbmcgfCBSZWdFeHApOlxuICAgICAgUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcyA9IGF3YWl0IHM7XG4gICAgcmV0dXJuIHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJyA/IHMgPT09IHBhdHRlcm4gOiBwYXR0ZXJuLnRlc3Qocyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0byBiZSBydW4gYWdhaW5zdCBjYW5kaWRhdGUgaGFybmVzc2VzLlxuICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gQSBkZXNjcmlwdGlvbiBvZiB0aGlzIHByZWRpY2F0ZSB0aGF0IG1heSBiZSB1c2VkIGluIGVycm9yIG1lc3NhZ2VzLlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIEFuIGFzeW5jIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAgICogQHJldHVybiB0aGlzIChmb3IgbWV0aG9kIGNoYWluaW5nKS5cbiAgICovXG4gIGFkZChkZXNjcmlwdGlvbjogc3RyaW5nLCBwcmVkaWNhdGU6IEFzeW5jUHJlZGljYXRlPFQ+KSB7XG4gICAgdGhpcy5fZGVzY3JpcHRpb25zLnB1c2goZGVzY3JpcHRpb24pO1xuICAgIHRoaXMuX3ByZWRpY2F0ZXMucHVzaChwcmVkaWNhdGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBkZXBlbmRzIG9uIGFuIG9wdGlvbiB2YWx1ZSB0byBiZSBydW4gYWdhaW5zdCBjYW5kaWRhdGVcbiAgICogaGFybmVzc2VzLiBJZiB0aGUgb3B0aW9uIHZhbHVlIGlzIHVuZGVmaW5lZCwgdGhlIHByZWRpY2F0ZSB3aWxsIGJlIGlnbm9yZWQuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBvcHRpb24gKG1heSBiZSB1c2VkIGluIGVycm9yIG1lc3NhZ2VzKS5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHZhbHVlLlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gdG8gcnVuIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgbm90IHVuZGVmaW5lZC5cbiAgICogQHJldHVybiB0aGlzIChmb3IgbWV0aG9kIGNoYWluaW5nKS5cbiAgICovXG4gIGFkZE9wdGlvbjxPPihuYW1lOiBzdHJpbmcsIG9wdGlvbjogTyB8IHVuZGVmaW5lZCwgcHJlZGljYXRlOiBBc3luY09wdGlvblByZWRpY2F0ZTxULCBPPikge1xuICAgIC8vIEFkZCBxdW90ZXMgYXJvdW5kIHN0cmluZ3MgdG8gZGlmZmVyZW50aWF0ZSB0aGVtIGZyb20gb3RoZXIgdmFsdWVzXG4gICAgY29uc3QgdmFsdWUgPSB0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJyA/IGBcIiR7b3B0aW9ufVwiYCA6IGAke29wdGlvbn1gO1xuICAgIGlmIChvcHRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5hZGQoYCR7bmFtZX0gPSAke3ZhbHVlfWAsIGl0ZW0gPT4gcHJlZGljYXRlKGl0ZW0sIG9wdGlvbikpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIGEgbGlzdCBvZiBoYXJuZXNzZXMgb24gdGhpcyBwcmVkaWNhdGUuXG4gICAqIEBwYXJhbSBoYXJuZXNzZXMgVGhlIGxpc3Qgb2YgaGFybmVzc2VzIHRvIGZpbHRlci5cbiAgICogQHJldHVybiBBIGxpc3Qgb2YgaGFybmVzc2VzIHRoYXQgc2F0aXNmeSB0aGlzIHByZWRpY2F0ZS5cbiAgICovXG4gIGFzeW5jIGZpbHRlcihoYXJuZXNzZXM6IFRbXSk6IFByb21pc2U8VFtdPiB7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKGhhcm5lc3Nlcy5tYXAoaCA9PiB0aGlzLmV2YWx1YXRlKGgpKSk7XG4gICAgcmV0dXJuIGhhcm5lc3Nlcy5maWx0ZXIoKF8sIGkpID0+IHJlc3VsdHNbaV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlcyB3aGV0aGVyIHRoZSBnaXZlbiBoYXJuZXNzIHNhdGlzZmllcyB0aGlzIHByZWRpY2F0ZS5cbiAgICogQHBhcmFtIGhhcm5lc3MgVGhlIGhhcm5lc3MgdG8gY2hlY2tcbiAgICogQHJldHVybiBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0cnVlIGlmIHRoZSBoYXJuZXNzIHNhdGlzZmllcyB0aGlzIHByZWRpY2F0ZSxcbiAgICogICBhbmQgcmVzb2x2ZXMgdG8gZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgYXN5bmMgZXZhbHVhdGUoaGFybmVzczogVCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLl9wcmVkaWNhdGVzLm1hcChwID0+IHAoaGFybmVzcykpKTtcbiAgICByZXR1cm4gcmVzdWx0cy5yZWR1Y2UoKGNvbWJpbmVkLCBjdXJyZW50KSA9PiBjb21iaW5lZCAmJiBjdXJyZW50LCB0cnVlKTtcbiAgfVxuXG4gIC8qKiBHZXRzIGEgZGVzY3JpcHRpb24gb2YgdGhpcyBwcmVkaWNhdGUgZm9yIHVzZSBpbiBlcnJvciBtZXNzYWdlcy4gKi9cbiAgZ2V0RGVzY3JpcHRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Rlc2NyaXB0aW9ucy5qb2luKCcsICcpO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHNlbGVjdG9yIHVzZWQgdG8gZmluZCBjYW5kaWRhdGUgZWxlbWVudHMuICovXG4gIGdldFNlbGVjdG9yKCkge1xuICAgIHJldHVybiB0aGlzLl9hbmNlc3Rvci5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAocGFydCA9PiBgJHtwYXJ0LnRyaW0oKX0gJHt0aGlzLmhhcm5lc3NUeXBlLmhvc3RTZWxlY3Rvcn1gLnRyaW0oKSlcbiAgICAgICAgLmpvaW4oJywnKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGJhc2Ugb3B0aW9ucyBjb21tb24gdG8gYWxsIGhhcm5lc3MgdHlwZXMuICovXG4gIHByaXZhdGUgX2FkZEJhc2VPcHRpb25zKG9wdGlvbnM6IEJhc2VIYXJuZXNzRmlsdGVycykge1xuICAgIHRoaXMuX2FuY2VzdG9yID0gb3B0aW9ucy5hbmNlc3RvciB8fCAnJztcbiAgICBpZiAodGhpcy5fYW5jZXN0b3IpIHtcbiAgICAgIHRoaXMuX2Rlc2NyaXB0aW9ucy5wdXNoKGBoYXMgYW5jZXN0b3IgbWF0Y2hpbmcgc2VsZWN0b3IgXCIke3RoaXMuX2FuY2VzdG9yfVwiYCk7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdG9yID0gb3B0aW9ucy5zZWxlY3RvcjtcbiAgICBpZiAoc2VsZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5hZGQoYGhvc3QgbWF0Y2hlcyBzZWxlY3RvciBcIiR7c2VsZWN0b3J9XCJgLCBhc3luYyBpdGVtID0+IHtcbiAgICAgICAgcmV0dXJuIChhd2FpdCBpdGVtLmhvc3QoKSkubWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuIl19