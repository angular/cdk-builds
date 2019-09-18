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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/output-names-rule", ["require", "exports", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/html-parsing/angular", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const angular_1 = require("@angular/cdk/schematics/ng-update/html-parsing/angular");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Rule that walks through every inline or external HTML template and switches
     * changed output binding names to the proper new output name.
     */
    class OutputNamesRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'outputNames');
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.data.length !== 0;
        }
        visitTemplate(template) {
            this.data.forEach(name => {
                const whitelist = name.whitelist;
                const relativeOffsets = [];
                if (whitelist.attributes) {
                    relativeOffsets.push(...angular_1.findOutputsOnElementWithAttr(template.content, name.replace, whitelist.attributes));
                }
                if (whitelist.elements) {
                    relativeOffsets.push(...angular_1.findOutputsOnElementWithTag(template.content, name.replace, whitelist.elements));
                }
                relativeOffsets.map(offset => template.start + offset)
                    .forEach(start => this._replaceOutputName(template.filePath, start, name.replace.length, name.replaceWith));
            });
        }
        _replaceOutputName(filePath, start, width, newName) {
            const updateRecorder = this.getUpdateRecorder(filePath);
            updateRecorder.remove(start, width);
            updateRecorder.insertRight(start, newName);
        }
    }
    exports.OutputNamesRule = OutputNamesRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LW5hbWVzLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvb3V0cHV0LW5hbWVzLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCx1RkFBK0Q7SUFHL0Qsb0ZBR2lDO0lBQ2pDLGlGQUF1RTtJQUV2RTs7O09BR0c7SUFDSCxNQUFhLGVBQWdCLFNBQVEsOEJBQThCO1FBQW5FOztZQUNFLGlFQUFpRTtZQUNqRSxTQUFJLEdBQTRCLG9DQUFxQixDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztZQUUzRSwyREFBMkQ7WUFDM0QsZ0JBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUE2QnZDLENBQUM7UUEzQkMsYUFBYSxDQUFDLFFBQTBCO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNqQyxNQUFNLGVBQWUsR0FBYSxFQUFFLENBQUM7Z0JBRXJDLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtvQkFDeEIsZUFBZSxDQUFDLElBQUksQ0FDaEIsR0FBRyxzQ0FBNEIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7aUJBQzVGO2dCQUVELElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRTtvQkFDdEIsZUFBZSxDQUFDLElBQUksQ0FDaEIsR0FBRyxxQ0FBMkIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7aUJBQ3pGO2dCQUVELGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztxQkFDakQsT0FBTyxDQUNKLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUM1QixRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNoRixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxRQUFnQixFQUFFLEtBQWEsRUFBRSxLQUFhLEVBQUUsT0FBZTtZQUN4RixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsQ0FBQztLQUNGO0lBbENELDBDQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb25SdWxlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24tcnVsZSc7XG5cbmltcG9ydCB7T3V0cHV0TmFtZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhJztcbmltcG9ydCB7XG4gIGZpbmRPdXRwdXRzT25FbGVtZW50V2l0aEF0dHIsXG4gIGZpbmRPdXRwdXRzT25FbGVtZW50V2l0aFRhZyxcbn0gZnJvbSAnLi4vaHRtbC1wYXJzaW5nL2FuZ3VsYXInO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFJ1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBSdWxlIHRoYXQgd2Fsa3MgdGhyb3VnaCBldmVyeSBpbmxpbmUgb3IgZXh0ZXJuYWwgSFRNTCB0ZW1wbGF0ZSBhbmQgc3dpdGNoZXNcbiAqIGNoYW5nZWQgb3V0cHV0IGJpbmRpbmcgbmFtZXMgdG8gdGhlIHByb3BlciBuZXcgb3V0cHV0IG5hbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBPdXRwdXROYW1lc1J1bGUgZXh0ZW5kcyBNaWdyYXRpb25SdWxlPFJ1bGVVcGdyYWRlRGF0YT4ge1xuICAvKiogQ2hhbmdlIGRhdGEgdGhhdCB1cGdyYWRlcyB0byB0aGUgc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLiAqL1xuICBkYXRhOiBPdXRwdXROYW1lVXBncmFkZURhdGFbXSA9IGdldFZlcnNpb25VcGdyYWRlRGF0YSh0aGlzLCAnb3V0cHV0TmFtZXMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBydWxlRW5hYmxlZCA9IHRoaXMuZGF0YS5sZW5ndGggIT09IDA7XG5cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgY29uc3Qgd2hpdGVsaXN0ID0gbmFtZS53aGl0ZWxpc3Q7XG4gICAgICBjb25zdCByZWxhdGl2ZU9mZnNldHM6IG51bWJlcltdID0gW107XG5cbiAgICAgIGlmICh3aGl0ZWxpc3QuYXR0cmlidXRlcykge1xuICAgICAgICByZWxhdGl2ZU9mZnNldHMucHVzaChcbiAgICAgICAgICAgIC4uLmZpbmRPdXRwdXRzT25FbGVtZW50V2l0aEF0dHIodGVtcGxhdGUuY29udGVudCwgbmFtZS5yZXBsYWNlLCB3aGl0ZWxpc3QuYXR0cmlidXRlcykpO1xuICAgICAgfVxuXG4gICAgICBpZiAod2hpdGVsaXN0LmVsZW1lbnRzKSB7XG4gICAgICAgIHJlbGF0aXZlT2Zmc2V0cy5wdXNoKFxuICAgICAgICAgICAgLi4uZmluZE91dHB1dHNPbkVsZW1lbnRXaXRoVGFnKHRlbXBsYXRlLmNvbnRlbnQsIG5hbWUucmVwbGFjZSwgd2hpdGVsaXN0LmVsZW1lbnRzKSk7XG4gICAgICB9XG5cbiAgICAgIHJlbGF0aXZlT2Zmc2V0cy5tYXAob2Zmc2V0ID0+IHRlbXBsYXRlLnN0YXJ0ICsgb2Zmc2V0KVxuICAgICAgICAgIC5mb3JFYWNoKFxuICAgICAgICAgICAgICBzdGFydCA9PiB0aGlzLl9yZXBsYWNlT3V0cHV0TmFtZShcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLmZpbGVQYXRoLCBzdGFydCwgbmFtZS5yZXBsYWNlLmxlbmd0aCwgbmFtZS5yZXBsYWNlV2l0aCkpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVwbGFjZU91dHB1dE5hbWUoZmlsZVBhdGg6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgd2lkdGg6IG51bWJlciwgbmV3TmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdXBkYXRlUmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKGZpbGVQYXRoKTtcbiAgICB1cGRhdGVSZWNvcmRlci5yZW1vdmUoc3RhcnQsIHdpZHRoKTtcbiAgICB1cGRhdGVSZWNvcmRlci5pbnNlcnRSaWdodChzdGFydCwgbmV3TmFtZSk7XG4gIH1cbn1cbiJdfQ==