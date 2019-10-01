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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/input-names-rule", ["require", "exports", "@angular/cdk/schematics/ng-update/html-parsing/angular", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/literal", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const angular_1 = require("@angular/cdk/schematics/ng-update/html-parsing/angular");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const literal_1 = require("@angular/cdk/schematics/ng-update/typescript/literal");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Rule that walks through every template or stylesheet and replaces outdated input
     * names to the new input name. Selectors in stylesheets could also target input
     * bindings declared as static attribute. See for example:
     *
     * e.g. `<my-component color="primary">` becomes `my-component[color]`
     */
    class InputNamesRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'inputNames');
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.data.length !== 0;
        }
        visitStylesheet(stylesheet) {
            this.data.forEach(name => {
                const currentSelector = `[${name.replace}]`;
                const updatedSelector = `[${name.replaceWith}]`;
                literal_1.findAllSubstringIndices(stylesheet.content, currentSelector)
                    .map(offset => stylesheet.start + offset)
                    .forEach(start => this._replaceInputName(stylesheet.filePath, start, currentSelector.length, updatedSelector));
            });
        }
        visitTemplate(template) {
            this.data.forEach(name => {
                const whitelist = name.whitelist;
                const relativeOffsets = [];
                if (whitelist.attributes) {
                    relativeOffsets.push(...angular_1.findInputsOnElementWithAttr(template.content, name.replace, whitelist.attributes));
                }
                if (whitelist.elements) {
                    relativeOffsets.push(...angular_1.findInputsOnElementWithTag(template.content, name.replace, whitelist.elements));
                }
                relativeOffsets.map(offset => template.start + offset)
                    .forEach(start => this._replaceInputName(template.filePath, start, name.replace.length, name.replaceWith));
            });
        }
        _replaceInputName(filePath, start, width, newName) {
            const updateRecorder = this.getUpdateRecorder(filePath);
            updateRecorder.remove(start, width);
            updateRecorder.insertRight(start, newName);
        }
    }
    exports.InputNamesRule = InputNamesRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbmFtZXMtcnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvdXBncmFkZS1ydWxlcy9pbnB1dC1uYW1lcy1ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsb0ZBQWdHO0lBRWhHLHVGQUErRDtJQUcvRCxrRkFBOEQ7SUFDOUQsaUZBQXVFO0lBRXZFOzs7Ozs7T0FNRztJQUNILE1BQWEsY0FBZSxTQUFRLDhCQUE4QjtRQUFsRTs7WUFDRSxpRUFBaUU7WUFDakUsU0FBSSxHQUEyQixvQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFekUsMkRBQTJEO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBMEN2QyxDQUFDO1FBeENDLGVBQWUsQ0FBQyxVQUE0QjtZQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxlQUFlLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUM7Z0JBQzVDLE1BQU0sZUFBZSxHQUFHLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDO2dCQUVoRCxpQ0FBdUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQztxQkFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7cUJBQ3hDLE9BQU8sQ0FDSixLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FDM0IsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUEwQjtZQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDakMsTUFBTSxlQUFlLEdBQWEsRUFBRSxDQUFDO2dCQUVyQyxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7b0JBQ3hCLGVBQWUsQ0FBQyxJQUFJLENBQ2hCLEdBQUcscUNBQTJCLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2lCQUMzRjtnQkFFRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUU7b0JBQ3RCLGVBQWUsQ0FBQyxJQUFJLENBQ2hCLEdBQUcsb0NBQTBCLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2lCQUN4RjtnQkFFRCxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7cUJBQ2pELE9BQU8sQ0FDSixLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FDM0IsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8saUJBQWlCLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsS0FBYSxFQUFFLE9BQWU7WUFDdkYsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BDLGNBQWMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLENBQUM7S0FDRjtJQS9DRCx3Q0ErQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtmaW5kSW5wdXRzT25FbGVtZW50V2l0aEF0dHIsIGZpbmRJbnB1dHNPbkVsZW1lbnRXaXRoVGFnfSBmcm9tICcuLi9odG1sLXBhcnNpbmcvYW5ndWxhcic7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb25SdWxlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24tcnVsZSc7XG5cbmltcG9ydCB7SW5wdXROYW1lVXBncmFkZURhdGF9IGZyb20gJy4uL2RhdGEnO1xuaW1wb3J0IHtmaW5kQWxsU3Vic3RyaW5nSW5kaWNlc30gZnJvbSAnLi4vdHlwZXNjcmlwdC9saXRlcmFsJztcbmltcG9ydCB7Z2V0VmVyc2lvblVwZ3JhZGVEYXRhLCBSdWxlVXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKlxuICogUnVsZSB0aGF0IHdhbGtzIHRocm91Z2ggZXZlcnkgdGVtcGxhdGUgb3Igc3R5bGVzaGVldCBhbmQgcmVwbGFjZXMgb3V0ZGF0ZWQgaW5wdXRcbiAqIG5hbWVzIHRvIHRoZSBuZXcgaW5wdXQgbmFtZS4gU2VsZWN0b3JzIGluIHN0eWxlc2hlZXRzIGNvdWxkIGFsc28gdGFyZ2V0IGlucHV0XG4gKiBiaW5kaW5ncyBkZWNsYXJlZCBhcyBzdGF0aWMgYXR0cmlidXRlLiBTZWUgZm9yIGV4YW1wbGU6XG4gKlxuICogZS5nLiBgPG15LWNvbXBvbmVudCBjb2xvcj1cInByaW1hcnlcIj5gIGJlY29tZXMgYG15LWNvbXBvbmVudFtjb2xvcl1gXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnB1dE5hbWVzUnVsZSBleHRlbmRzIE1pZ3JhdGlvblJ1bGU8UnVsZVVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGE6IElucHV0TmFtZVVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ2lucHV0TmFtZXMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBydWxlRW5hYmxlZCA9IHRoaXMuZGF0YS5sZW5ndGggIT09IDA7XG5cbiAgdmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RvciA9IGBbJHtuYW1lLnJlcGxhY2V9XWA7XG4gICAgICBjb25zdCB1cGRhdGVkU2VsZWN0b3IgPSBgWyR7bmFtZS5yZXBsYWNlV2l0aH1dYDtcblxuICAgICAgZmluZEFsbFN1YnN0cmluZ0luZGljZXMoc3R5bGVzaGVldC5jb250ZW50LCBjdXJyZW50U2VsZWN0b3IpXG4gICAgICAgICAgLm1hcChvZmZzZXQgPT4gc3R5bGVzaGVldC5zdGFydCArIG9mZnNldClcbiAgICAgICAgICAuZm9yRWFjaChcbiAgICAgICAgICAgICAgc3RhcnQgPT4gdGhpcy5fcmVwbGFjZUlucHV0TmFtZShcbiAgICAgICAgICAgICAgICAgIHN0eWxlc2hlZXQuZmlsZVBhdGgsIHN0YXJ0LCBjdXJyZW50U2VsZWN0b3IubGVuZ3RoLCB1cGRhdGVkU2VsZWN0b3IpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGNvbnN0IHdoaXRlbGlzdCA9IG5hbWUud2hpdGVsaXN0O1xuICAgICAgY29uc3QgcmVsYXRpdmVPZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuXG4gICAgICBpZiAod2hpdGVsaXN0LmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgcmVsYXRpdmVPZmZzZXRzLnB1c2goXG4gICAgICAgICAgICAuLi5maW5kSW5wdXRzT25FbGVtZW50V2l0aEF0dHIodGVtcGxhdGUuY29udGVudCwgbmFtZS5yZXBsYWNlLCB3aGl0ZWxpc3QuYXR0cmlidXRlcykpO1xuICAgICAgfVxuXG4gICAgICBpZiAod2hpdGVsaXN0LmVsZW1lbnRzKSB7XG4gICAgICAgIHJlbGF0aXZlT2Zmc2V0cy5wdXNoKFxuICAgICAgICAgICAgLi4uZmluZElucHV0c09uRWxlbWVudFdpdGhUYWcodGVtcGxhdGUuY29udGVudCwgbmFtZS5yZXBsYWNlLCB3aGl0ZWxpc3QuZWxlbWVudHMpKTtcbiAgICAgIH1cblxuICAgICAgcmVsYXRpdmVPZmZzZXRzLm1hcChvZmZzZXQgPT4gdGVtcGxhdGUuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goXG4gICAgICAgICAgICAgIHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VJbnB1dE5hbWUoXG4gICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5maWxlUGF0aCwgc3RhcnQsIG5hbWUucmVwbGFjZS5sZW5ndGgsIG5hbWUucmVwbGFjZVdpdGgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcGxhY2VJbnB1dE5hbWUoZmlsZVBhdGg6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgd2lkdGg6IG51bWJlciwgbmV3TmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdXBkYXRlUmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKGZpbGVQYXRoKTtcbiAgICB1cGRhdGVSZWNvcmRlci5yZW1vdmUoc3RhcnQsIHdpZHRoKTtcbiAgICB1cGRhdGVSZWNvcmRlci5pbnNlcnRSaWdodChzdGFydCwgbmV3TmFtZSk7XG4gIH1cbn1cbiJdfQ==