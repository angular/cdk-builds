/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/schematics/ng-update/upgrade-rules/index", ["require", "exports", "@angular-devkit/schematics/tasks", "@angular/cdk/schematics/update-tool", "@angular/cdk/schematics/utils/project-tsconfig-paths", "@angular/cdk/schematics/ng-update/upgrade-rules/attribute-selectors-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/class-inheritance-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/class-names-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/constructor-signature-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/css-selectors-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/element-selectors-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/input-names-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/method-call-arguments-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/misc-template-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/output-names-rule", "@angular/cdk/schematics/ng-update/upgrade-rules/property-names-rule"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tasks_1 = require("@angular-devkit/schematics/tasks");
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
        return (tree, context) => __awaiter(this, void 0, void 0, function* () {
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
            const rules = [...exports.cdkMigrationRules, ...extraRules];
            let hasRuleFailures = false;
            const runMigration = (tsconfigPath, isTestTarget) => {
                const result = update_tool_1.runMigrationRules(tree, context.logger, tsconfigPath, isTestTarget, targetVersion, rules, upgradeData, analyzedFiles);
                hasRuleFailures = hasRuleFailures || result.hasFailures;
            };
            buildPaths.forEach(p => runMigration(p, false));
            testPaths.forEach(p => runMigration(p, true));
            let runPackageManager = false;
            // Run the global post migration static members for all migration rules.
            rules.forEach(rule => {
                const actionResult = rule.globalPostMigration(tree, context);
                if (actionResult) {
                    runPackageManager = runPackageManager || actionResult.runPackageManager;
                }
            });
            // If a rule requested the package manager to run, we run it as an
            // asynchronous post migration task. We cannot run it synchronously,
            // as file changes from the current migration task are not applied to
            // the file system yet.
            if (runPackageManager) {
                context.addTask(new tasks_1.NodePackageInstallTask({ quiet: false }));
            }
            if (onMigrationCompleteFn) {
                onMigrationCompleteFn(targetVersion, hasRuleFailures);
            }
        });
    }
    exports.createUpgradeRule = createUpgradeRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdILDREQUF3RTtJQUV4RSxxRUFBdUU7SUFFdkUsaUdBQTJFO0lBRzNFLHVIQUFrRTtJQUNsRSxtSEFBOEQ7SUFDOUQsdUdBQWtEO0lBQ2xELDJIQUFzRTtJQUN0RSwyR0FBc0Q7SUFDdEQsbUhBQThEO0lBQzlELHVHQUFrRDtJQUNsRCwySEFBcUU7SUFDckUsMkdBQXNEO0lBQ3RELHlHQUFvRDtJQUNwRCw2R0FBd0Q7SUFHeEQsNERBQTREO0lBQy9DLFFBQUEsaUJBQWlCLEdBQXlDO1FBQ3JFLGlEQUFzQjtRQUN0Qiw2Q0FBb0I7UUFDcEIsaUNBQWM7UUFDZCxxREFBd0I7UUFDeEIscUNBQWdCO1FBQ2hCLDZDQUFvQjtRQUNwQixpQ0FBYztRQUNkLG9EQUF1QjtRQUN2QixxQ0FBZ0I7UUFDaEIsbUNBQWU7UUFDZix1Q0FBaUI7S0FDbEIsQ0FBQztJQUlGOzs7T0FHRztJQUNILFNBQWdCLGlCQUFpQixDQUM3QixhQUE0QixFQUFFLFVBQW1DLEVBQUUsV0FBNEIsRUFDL0YscUJBQW9GO1FBQ3RGLE9BQU8sQ0FBTyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQ3JELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU5RCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLGlGQUFpRjtnQkFDakYsNERBQTREO2dCQUM1RCxNQUFNLENBQUMsS0FBSyxDQUFDLDJFQUEyRSxDQUFDLENBQUM7Z0JBQzFGLE9BQU87YUFDUjtZQUVELG1GQUFtRjtZQUNuRixzRkFBc0Y7WUFDdEYsMkZBQTJGO1lBQzNGLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFDeEMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLHlCQUFpQixFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFDcEQsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBRTVCLE1BQU0sWUFBWSxHQUFHLENBQUMsWUFBb0IsRUFBRSxZQUFxQixFQUFFLEVBQUU7Z0JBQ25FLE1BQU0sTUFBTSxHQUFHLCtCQUFpQixDQUM1QixJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFDL0QsS0FBSyxFQUFFLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFFdkMsZUFBZSxHQUFHLGVBQWUsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQzFELENBQUMsQ0FBQztZQUVGLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUU5QyxJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUU5Qix3RUFBd0U7WUFDeEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLGlCQUFpQixHQUFHLGlCQUFpQixJQUFJLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztpQkFDekU7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILGtFQUFrRTtZQUNsRSxvRUFBb0U7WUFDcEUscUVBQXFFO1lBQ3JFLHVCQUF1QjtZQUN2QixJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLENBQUMsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdEO1lBRUQsSUFBSSxxQkFBcUIsRUFBRTtnQkFDekIscUJBQXFCLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2FBQ3ZEO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBdERELDhDQXNEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7Tm9kZVBhY2thZ2VJbnN0YWxsVGFza30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MvdGFza3MnO1xuXG5pbXBvcnQge01pZ3JhdGlvblJ1bGVUeXBlLCBydW5NaWdyYXRpb25SdWxlc30gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wnO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0LXRzY29uZmlnLXBhdGhzJztcbmltcG9ydCB7UnVsZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG5pbXBvcnQge0F0dHJpYnV0ZVNlbGVjdG9yc1J1bGV9IGZyb20gJy4vYXR0cmlidXRlLXNlbGVjdG9ycy1ydWxlJztcbmltcG9ydCB7Q2xhc3NJbmhlcml0YW5jZVJ1bGV9IGZyb20gJy4vY2xhc3MtaW5oZXJpdGFuY2UtcnVsZSc7XG5pbXBvcnQge0NsYXNzTmFtZXNSdWxlfSBmcm9tICcuL2NsYXNzLW5hbWVzLXJ1bGUnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclNpZ25hdHVyZVJ1bGV9IGZyb20gJy4vY29uc3RydWN0b3Itc2lnbmF0dXJlLXJ1bGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvcnNSdWxlfSBmcm9tICcuL2Nzcy1zZWxlY3RvcnMtcnVsZSc7XG5pbXBvcnQge0VsZW1lbnRTZWxlY3RvcnNSdWxlfSBmcm9tICcuL2VsZW1lbnQtc2VsZWN0b3JzLXJ1bGUnO1xuaW1wb3J0IHtJbnB1dE5hbWVzUnVsZX0gZnJvbSAnLi9pbnB1dC1uYW1lcy1ydWxlJztcbmltcG9ydCB7TWV0aG9kQ2FsbEFyZ3VtZW50c1J1bGV9IGZyb20gJy4vbWV0aG9kLWNhbGwtYXJndW1lbnRzLXJ1bGUnO1xuaW1wb3J0IHtNaXNjVGVtcGxhdGVSdWxlfSBmcm9tICcuL21pc2MtdGVtcGxhdGUtcnVsZSc7XG5pbXBvcnQge091dHB1dE5hbWVzUnVsZX0gZnJvbSAnLi9vdXRwdXQtbmFtZXMtcnVsZSc7XG5pbXBvcnQge1Byb3BlcnR5TmFtZXNSdWxlfSBmcm9tICcuL3Byb3BlcnR5LW5hbWVzLXJ1bGUnO1xuXG5cbi8qKiBMaXN0IG9mIG1pZ3JhdGlvbiBydWxlcyB3aGljaCBydW4gZm9yIHRoZSBDREsgdXBkYXRlLiAqL1xuZXhwb3J0IGNvbnN0IGNka01pZ3JhdGlvblJ1bGVzOiBNaWdyYXRpb25SdWxlVHlwZTxSdWxlVXBncmFkZURhdGE+W10gPSBbXG4gIEF0dHJpYnV0ZVNlbGVjdG9yc1J1bGUsXG4gIENsYXNzSW5oZXJpdGFuY2VSdWxlLFxuICBDbGFzc05hbWVzUnVsZSxcbiAgQ29uc3RydWN0b3JTaWduYXR1cmVSdWxlLFxuICBDc3NTZWxlY3RvcnNSdWxlLFxuICBFbGVtZW50U2VsZWN0b3JzUnVsZSxcbiAgSW5wdXROYW1lc1J1bGUsXG4gIE1ldGhvZENhbGxBcmd1bWVudHNSdWxlLFxuICBNaXNjVGVtcGxhdGVSdWxlLFxuICBPdXRwdXROYW1lc1J1bGUsXG4gIFByb3BlcnR5TmFtZXNSdWxlLFxuXTtcblxudHlwZSBOdWxsYWJsZU1pZ3JhdGlvblJ1bGUgPSBNaWdyYXRpb25SdWxlVHlwZTxSdWxlVXBncmFkZURhdGF8bnVsbD47XG5cbi8qKlxuICogQ3JlYXRlcyBhIEFuZ3VsYXIgc2NoZW1hdGljIHJ1bGUgdGhhdCBydW5zIHRoZSB1cGdyYWRlIGZvciB0aGVcbiAqIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVwZ3JhZGVSdWxlKFxuICAgIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGV4dHJhUnVsZXM6IE51bGxhYmxlTWlncmF0aW9uUnVsZVtdLCB1cGdyYWRlRGF0YTogUnVsZVVwZ3JhZGVEYXRhLFxuICAgIG9uTWlncmF0aW9uQ29tcGxldGVGbj86ICh0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBoYXNGYWlsdXJlczogYm9vbGVhbikgPT4gdm9pZCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBoZXJlIGJlY2F1c2UgaXQgd291bGQgbWVhbiB0aGF0IG90aGVyIG1pZ3JhdGlvbnMgaW4gdGhlXG4gICAgICAvLyBwaXBlbGluZSBkb24ndCBydW4gZWl0aGVyLiBSYXRoZXIgcHJpbnQgYW4gZXJyb3IgbWVzc2FnZS5cbiAgICAgIGxvZ2dlci5lcnJvcignQ291bGQgbm90IGZpbmQgYW55IFR5cGVTY3JpcHQgcHJvamVjdCBpbiB0aGUgQ0xJIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHJ1bGVzID0gWy4uLmNka01pZ3JhdGlvblJ1bGVzLCAuLi5leHRyYVJ1bGVzXTtcbiAgICBsZXQgaGFzUnVsZUZhaWx1cmVzID0gZmFsc2U7XG5cbiAgICBjb25zdCBydW5NaWdyYXRpb24gPSAodHNjb25maWdQYXRoOiBzdHJpbmcsIGlzVGVzdFRhcmdldDogYm9vbGVhbikgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gcnVuTWlncmF0aW9uUnVsZXMoXG4gICAgICAgICAgdHJlZSwgY29udGV4dC5sb2dnZXIsIHRzY29uZmlnUGF0aCwgaXNUZXN0VGFyZ2V0LCB0YXJnZXRWZXJzaW9uLFxuICAgICAgICAgIHJ1bGVzLCB1cGdyYWRlRGF0YSwgYW5hbHl6ZWRGaWxlcyk7XG5cbiAgICAgIGhhc1J1bGVGYWlsdXJlcyA9IGhhc1J1bGVGYWlsdXJlcyB8fCByZXN1bHQuaGFzRmFpbHVyZXM7XG4gICAgfTtcblxuICAgIGJ1aWxkUGF0aHMuZm9yRWFjaChwID0+IHJ1bk1pZ3JhdGlvbihwLCBmYWxzZSkpO1xuICAgIHRlc3RQYXRocy5mb3JFYWNoKHAgPT4gcnVuTWlncmF0aW9uKHAsIHRydWUpKTtcblxuICAgIGxldCBydW5QYWNrYWdlTWFuYWdlciA9IGZhbHNlO1xuXG4gICAgLy8gUnVuIHRoZSBnbG9iYWwgcG9zdCBtaWdyYXRpb24gc3RhdGljIG1lbWJlcnMgZm9yIGFsbCBtaWdyYXRpb24gcnVsZXMuXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgIGNvbnN0IGFjdGlvblJlc3VsdCA9IHJ1bGUuZ2xvYmFsUG9zdE1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KTtcbiAgICAgIGlmIChhY3Rpb25SZXN1bHQpIHtcbiAgICAgICAgcnVuUGFja2FnZU1hbmFnZXIgPSBydW5QYWNrYWdlTWFuYWdlciB8fCBhY3Rpb25SZXN1bHQucnVuUGFja2FnZU1hbmFnZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiBhIHJ1bGUgcmVxdWVzdGVkIHRoZSBwYWNrYWdlIG1hbmFnZXIgdG8gcnVuLCB3ZSBydW4gaXQgYXMgYW5cbiAgICAvLyBhc3luY2hyb25vdXMgcG9zdCBtaWdyYXRpb24gdGFzay4gV2UgY2Fubm90IHJ1biBpdCBzeW5jaHJvbm91c2x5LFxuICAgIC8vIGFzIGZpbGUgY2hhbmdlcyBmcm9tIHRoZSBjdXJyZW50IG1pZ3JhdGlvbiB0YXNrIGFyZSBub3QgYXBwbGllZCB0b1xuICAgIC8vIHRoZSBmaWxlIHN5c3RlbSB5ZXQuXG4gICAgaWYgKHJ1blBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soe3F1aWV0OiBmYWxzZX0pKTtcbiAgICB9XG5cbiAgICBpZiAob25NaWdyYXRpb25Db21wbGV0ZUZuKSB7XG4gICAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4odGFyZ2V0VmVyc2lvbiwgaGFzUnVsZUZhaWx1cmVzKTtcbiAgICB9XG4gIH07XG59XG4iXX0=