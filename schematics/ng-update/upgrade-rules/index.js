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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/index", ["require", "exports", "@angular/cdk/schematics/update-tool", "@angular/cdk/schematics/utils/project-tsconfig-paths", "@angular/cdk/schematics/ng-update/upgrade-rules/attribute-selectors-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/class-inheritance-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/class-names-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/constructor-signature-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/css-selectors-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/element-selectors-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/input-names-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/method-call-arguments-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/misc-template-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/output-names-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/property-names-rule"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const update_tool_1 = require("@angular/cdk/schematics/update-tool");
    const project_tsconfig_paths_1 = require("@angular/cdk/schematics/utils/project-tsconfig-paths");
    const attribute_selectors_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/attribute-selectors-rule");
    const class_inheritance_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/class-inheritance-rule");
    const class_names_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/class-names-rule");
    const constructor_signature_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/constructor-signature-rule");
    const css_selectors_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/css-selectors-rule");
    const element_selectors_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/element-selectors-rule");
    const input_names_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/input-names-rule");
    const method_call_arguments_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/method-call-arguments-rule");
    const misc_template_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/misc-template-rule");
    const output_names_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/output-names-rule");
    const property_names_rule_1 = require("@angular/cdk/schematics/ng-update/upgrade-rules/property-names-rule");
    /** List of migration rules which run for the CDK update. */
    exports.cdkMigrationRules = [
        attribute_selectors_rule_1.AttributeSelectorsRule,
        class_inheritance_rule_1.ClassInheritanceRule,
        class_names_rule_1.ClassNamesRule,
        constructor_signature_rule_1.ConstructorSignatureRule,
        css_selectors_rule_1.CssSelectorsRule,
        element_selectors_rule_1.ElementSelectorsRule,
        input_names_rule_1.InputNamesRule,
        method_call_arguments_rule_1.MethodCallArgumentsRule,
        misc_template_rule_1.MiscTemplateRule,
        output_names_rule_1.OutputNamesRule,
        property_names_rule_1.PropertyNamesRule,
    ];
    /**
     * Creates a Angular schematic rule that runs the upgrade for the
     * specified target version.
     */
    function createUpgradeRule(targetVersion, extraRules, upgradeData, onMigrationCompleteFn) {
        return (tree, context) => {
            const logger = context.logger;
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            if (!buildPaths.length && !testPaths.length) {
                // We don't want to throw here because it would mean that other migrations in the
                // pipeline don't run either. Rather print an error message.
                logger.error('Could not find any TypeScript project in the CLI workspace configuration.');
                return;
            }
            // Keep track of all project source files which have been checked/migrated. This is
            // necessary because multiple TypeScript projects can contain the same source file and
            // we don't want to check these again, as this would result in duplicated failure messages.
            const analyzedFiles = new Set();
            let hasRuleFailures = false;
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                hasRuleFailures = hasRuleFailures || update_tool_1.runMigrationRules(tree, context.logger, tsconfigPath, targetVersion, [...exports.cdkMigrationRules, ...extraRules], upgradeData, analyzedFiles);
            }
            if (onMigrationCompleteFn) {
                onMigrationCompleteFn(targetVersion, hasRuleFailures);
            }
        };
    }
    exports.createUpgradeRule = createUpgradeRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFJSCxxRUFBaUU7SUFHakUsaUdBQTJFO0lBRzNFLHVIQUFrRTtJQUNsRSxtSEFBOEQ7SUFDOUQsdUdBQWtEO0lBQ2xELDJIQUFzRTtJQUN0RSwyR0FBc0Q7SUFDdEQsbUhBQThEO0lBQzlELHVHQUFrRDtJQUNsRCwySEFBcUU7SUFDckUsMkdBQXNEO0lBQ3RELHlHQUFvRDtJQUNwRCw2R0FBd0Q7SUFHeEQsNERBQTREO0lBQy9DLFFBQUEsaUJBQWlCLEdBQWtEO1FBQzlFLGlEQUFzQjtRQUN0Qiw2Q0FBb0I7UUFDcEIsaUNBQWM7UUFDZCxxREFBd0I7UUFDeEIscUNBQWdCO1FBQ2hCLDZDQUFvQjtRQUNwQixpQ0FBYztRQUNkLG9EQUF1QjtRQUN2QixxQ0FBZ0I7UUFDaEIsbUNBQWU7UUFDZix1Q0FBaUI7S0FDbEIsQ0FBQztJQUlGOzs7T0FHRztJQUNILFNBQWdCLGlCQUFpQixDQUM3QixhQUE0QixFQUFFLFVBQW1DLEVBQUUsV0FBNEIsRUFDL0YscUJBQW9GO1FBQ3RGLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLGlGQUFpRjtnQkFDakYsNERBQTREO2dCQUM1RCxNQUFNLENBQUMsS0FBSyxDQUFDLDJFQUEyRSxDQUFDLENBQUM7Z0JBQzFGLE9BQU87YUFDUjtZQUVELG1GQUFtRjtZQUNuRixzRkFBc0Y7WUFDdEYsMkZBQTJGO1lBQzNGLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFDeEMsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBRTVCLEtBQUssTUFBTSxZQUFZLElBQUksQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFO2dCQUN4RCxlQUFlLEdBQUcsZUFBZSxJQUFJLCtCQUFpQixDQUNsRCxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLENBQUMsR0FBRyx5QkFBaUIsRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUN4RixXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDakM7WUFFRCxJQUFJLHFCQUFxQixFQUFFO2dCQUN6QixxQkFBcUIsQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDdkQ7UUFDSCxDQUFDLENBQUM7SUFDSixDQUFDO0lBOUJELDhDQThCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuaW1wb3J0IHtDb25zdHJ1Y3RvciwgcnVuTWlncmF0aW9uUnVsZXN9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sJztcbmltcG9ydCB7TWlncmF0aW9uUnVsZX0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0LXRzY29uZmlnLXBhdGhzJztcbmltcG9ydCB7UnVsZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG5pbXBvcnQge0F0dHJpYnV0ZVNlbGVjdG9yc1J1bGV9IGZyb20gJy4vYXR0cmlidXRlLXNlbGVjdG9ycy1ydWxlJztcbmltcG9ydCB7Q2xhc3NJbmhlcml0YW5jZVJ1bGV9IGZyb20gJy4vY2xhc3MtaW5oZXJpdGFuY2UtcnVsZSc7XG5pbXBvcnQge0NsYXNzTmFtZXNSdWxlfSBmcm9tICcuL2NsYXNzLW5hbWVzLXJ1bGUnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclNpZ25hdHVyZVJ1bGV9IGZyb20gJy4vY29uc3RydWN0b3Itc2lnbmF0dXJlLXJ1bGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvcnNSdWxlfSBmcm9tICcuL2Nzcy1zZWxlY3RvcnMtcnVsZSc7XG5pbXBvcnQge0VsZW1lbnRTZWxlY3RvcnNSdWxlfSBmcm9tICcuL2VsZW1lbnQtc2VsZWN0b3JzLXJ1bGUnO1xuaW1wb3J0IHtJbnB1dE5hbWVzUnVsZX0gZnJvbSAnLi9pbnB1dC1uYW1lcy1ydWxlJztcbmltcG9ydCB7TWV0aG9kQ2FsbEFyZ3VtZW50c1J1bGV9IGZyb20gJy4vbWV0aG9kLWNhbGwtYXJndW1lbnRzLXJ1bGUnO1xuaW1wb3J0IHtNaXNjVGVtcGxhdGVSdWxlfSBmcm9tICcuL21pc2MtdGVtcGxhdGUtcnVsZSc7XG5pbXBvcnQge091dHB1dE5hbWVzUnVsZX0gZnJvbSAnLi9vdXRwdXQtbmFtZXMtcnVsZSc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZXNSdWxlfSBmcm9tICcuL3Byb3BlcnR5LW5hbWVzLXJ1bGUnO1xuXG5cbi8qKiBMaXN0IG9mIG1pZ3JhdGlvbiBydWxlcyB3aGljaCBydW4gZm9yIHRoZSBDREsgdXBkYXRlLiAqL1xuZXhwb3J0IGNvbnN0IGNka01pZ3JhdGlvblJ1bGVzOiBDb25zdHJ1Y3RvcjxNaWdyYXRpb25SdWxlPFJ1bGVVcGdyYWRlRGF0YT4+W10gPSBbXG4gIEF0dHJpYnV0ZVNlbGVjdG9yc1J1bGUsXG4gIENsYXNzSW5oZXJpdGFuY2VSdWxlLFxuICBDbGFzc05hbWVzUnVsZSxcbiAgQ29uc3RydWN0b3JTaWduYXR1cmVSdWxlLFxuICBDc3NTZWxlY3RvcnNSdWxlLFxuICBFbGVtZW50U2VsZWN0b3JzUnVsZSxcbiAgSW5wdXROYW1lc1J1bGUsXG4gIE1ldGhvZENhbGxBcmd1bWVudHNSdWxlLFxuICBNaXNjVGVtcGxhdGVSdWxlLFxuICBPdXRwdXROYW1lc1J1bGUsXG4gIFByb3BlcnR5TmFtZXNSdWxlLFxuXTtcblxudHlwZSBOdWxsYWJsZU1pZ3JhdGlvblJ1bGUgPSBDb25zdHJ1Y3RvcjxNaWdyYXRpb25SdWxlPFJ1bGVVcGdyYWRlRGF0YXxudWxsPj47XG5cbi8qKlxuICogQ3JlYXRlcyBhIEFuZ3VsYXIgc2NoZW1hdGljIHJ1bGUgdGhhdCBydW5zIHRoZSB1cGdyYWRlIGZvciB0aGVcbiAqIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVwZ3JhZGVSdWxlKFxuICAgIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGV4dHJhUnVsZXM6IE51bGxhYmxlTWlncmF0aW9uUnVsZVtdLCB1cGdyYWRlRGF0YTogUnVsZVVwZ3JhZGVEYXRhLFxuICAgIG9uTWlncmF0aW9uQ29tcGxldGVGbj86ICh0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBoYXNGYWlsdXJlczogYm9vbGVhbikgPT4gdm9pZCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBoZXJlIGJlY2F1c2UgaXQgd291bGQgbWVhbiB0aGF0IG90aGVyIG1pZ3JhdGlvbnMgaW4gdGhlXG4gICAgICAvLyBwaXBlbGluZSBkb24ndCBydW4gZWl0aGVyLiBSYXRoZXIgcHJpbnQgYW4gZXJyb3IgbWVzc2FnZS5cbiAgICAgIGxvZ2dlci5lcnJvcignQ291bGQgbm90IGZpbmQgYW55IFR5cGVTY3JpcHQgcHJvamVjdCBpbiB0aGUgQ0xJIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGxldCBoYXNSdWxlRmFpbHVyZXMgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBoYXNSdWxlRmFpbHVyZXMgPSBoYXNSdWxlRmFpbHVyZXMgfHwgcnVuTWlncmF0aW9uUnVsZXMoXG4gICAgICAgICAgdHJlZSwgY29udGV4dC5sb2dnZXIsIHRzY29uZmlnUGF0aCwgdGFyZ2V0VmVyc2lvbiwgWy4uLmNka01pZ3JhdGlvblJ1bGVzLCAuLi5leHRyYVJ1bGVzXSxcbiAgICAgICAgICB1cGdyYWRlRGF0YSwgYW5hbHl6ZWRGaWxlcyk7XG4gICAgfVxuXG4gICAgaWYgKG9uTWlncmF0aW9uQ29tcGxldGVGbikge1xuICAgICAgb25NaWdyYXRpb25Db21wbGV0ZUZuKHRhcmdldFZlcnNpb24sIGhhc1J1bGVGYWlsdXJlcyk7XG4gICAgfVxuICB9O1xufVxuIl19