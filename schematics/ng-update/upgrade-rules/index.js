/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
                onMigrationCompleteFn(context, targetVersion, hasRuleFailures);
            }
        });
    }
    exports.createUpgradeRule = createUpgradeRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCw0REFBd0U7SUFFeEUscUVBQXVFO0lBRXZFLGlHQUEyRTtJQUczRSx1SEFBa0U7SUFDbEUsbUhBQThEO0lBQzlELHVHQUFrRDtJQUNsRCwySEFBc0U7SUFDdEUsMkdBQXNEO0lBQ3RELG1IQUE4RDtJQUM5RCx1R0FBa0Q7SUFDbEQsMkhBQXFFO0lBQ3JFLDJHQUFzRDtJQUN0RCx5R0FBb0Q7SUFDcEQsNkdBQXdEO0lBR3hELDREQUE0RDtJQUMvQyxRQUFBLGlCQUFpQixHQUF5QztRQUNyRSxpREFBc0I7UUFDdEIsNkNBQW9CO1FBQ3BCLGlDQUFjO1FBQ2QscURBQXdCO1FBQ3hCLHFDQUFnQjtRQUNoQiw2Q0FBb0I7UUFDcEIsaUNBQWM7UUFDZCxvREFBdUI7UUFDdkIscUNBQWdCO1FBQ2hCLG1DQUFlO1FBQ2YsdUNBQWlCO0tBQ2xCLENBQUM7SUFPRjs7O09BR0c7SUFDSCxTQUFnQixpQkFBaUIsQ0FDN0IsYUFBNEIsRUFBRSxVQUFtQyxFQUFFLFdBQTRCLEVBQy9GLHFCQUF1QztRQUN6QyxPQUFPLENBQU8sSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUNyRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFOUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxpRkFBaUY7Z0JBQ2pGLDREQUE0RDtnQkFDNUQsTUFBTSxDQUFDLEtBQUssQ0FBQywyRUFBMkUsQ0FBQyxDQUFDO2dCQUMxRixPQUFPO2FBQ1I7WUFFRCxtRkFBbUY7WUFDbkYsc0ZBQXNGO1lBQ3RGLDJGQUEyRjtZQUMzRixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBQ3hDLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyx5QkFBaUIsRUFBRSxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQ3BELElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztZQUU1QixNQUFNLFlBQVksR0FBRyxDQUFDLFlBQW9CLEVBQUUsWUFBcUIsRUFBRSxFQUFFO2dCQUNuRSxNQUFNLE1BQU0sR0FBRywrQkFBaUIsQ0FDNUIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQy9ELEtBQUssRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRXZDLGVBQWUsR0FBRyxlQUFlLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUMxRCxDQUFDLENBQUM7WUFFRixVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hELFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFOUMsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFFOUIsd0VBQXdFO1lBQ3hFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ25CLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzdELElBQUksWUFBWSxFQUFFO29CQUNoQixpQkFBaUIsR0FBRyxpQkFBaUIsSUFBSSxZQUFZLENBQUMsaUJBQWlCLENBQUM7aUJBQ3pFO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxrRUFBa0U7WUFDbEUsb0VBQW9FO1lBQ3BFLHFFQUFxRTtZQUNyRSx1QkFBdUI7WUFDdkIsSUFBSSxpQkFBaUIsRUFBRTtnQkFDckIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLDhCQUFzQixDQUFDLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsQ0FBQzthQUM3RDtZQUVELElBQUkscUJBQXFCLEVBQUU7Z0JBQ3pCLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDaEU7UUFDSCxDQUFDLENBQUEsQ0FBQztJQUNKLENBQUM7SUF0REQsOENBc0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtOb2RlUGFja2FnZUluc3RhbGxUYXNrfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcy90YXNrcyc7XG5cbmltcG9ydCB7TWlncmF0aW9uUnVsZVR5cGUsIHJ1bk1pZ3JhdGlvblJ1bGVzfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbCc7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3QtdHNjb25maWctcGF0aHMnO1xuaW1wb3J0IHtSdWxlVXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbmltcG9ydCB7QXR0cmlidXRlU2VsZWN0b3JzUnVsZX0gZnJvbSAnLi9hdHRyaWJ1dGUtc2VsZWN0b3JzLXJ1bGUnO1xuaW1wb3J0IHtDbGFzc0luaGVyaXRhbmNlUnVsZX0gZnJvbSAnLi9jbGFzcy1pbmhlcml0YW5jZS1ydWxlJztcbmltcG9ydCB7Q2xhc3NOYW1lc1J1bGV9IGZyb20gJy4vY2xhc3MtbmFtZXMtcnVsZSc7XG5pbXBvcnQge0NvbnN0cnVjdG9yU2lnbmF0dXJlUnVsZX0gZnJvbSAnLi9jb25zdHJ1Y3Rvci1zaWduYXR1cmUtcnVsZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yc1J1bGV9IGZyb20gJy4vY3NzLXNlbGVjdG9ycy1ydWxlJztcbmltcG9ydCB7RWxlbWVudFNlbGVjdG9yc1J1bGV9IGZyb20gJy4vZWxlbWVudC1zZWxlY3RvcnMtcnVsZSc7XG5pbXBvcnQge0lucHV0TmFtZXNSdWxlfSBmcm9tICcuL2lucHV0LW5hbWVzLXJ1bGUnO1xuaW1wb3J0IHtNZXRob2RDYWxsQXJndW1lbnRzUnVsZX0gZnJvbSAnLi9tZXRob2QtY2FsbC1hcmd1bWVudHMtcnVsZSc7XG5pbXBvcnQge01pc2NUZW1wbGF0ZVJ1bGV9IGZyb20gJy4vbWlzYy10ZW1wbGF0ZS1ydWxlJztcbmltcG9ydCB7T3V0cHV0TmFtZXNSdWxlfSBmcm9tICcuL291dHB1dC1uYW1lcy1ydWxlJztcbmltcG9ydCB7UHJvcGVydHlOYW1lc1J1bGV9IGZyb20gJy4vcHJvcGVydHktbmFtZXMtcnVsZSc7XG5cblxuLyoqIExpc3Qgb2YgbWlncmF0aW9uIHJ1bGVzIHdoaWNoIHJ1biBmb3IgdGhlIENESyB1cGRhdGUuICovXG5leHBvcnQgY29uc3QgY2RrTWlncmF0aW9uUnVsZXM6IE1pZ3JhdGlvblJ1bGVUeXBlPFJ1bGVVcGdyYWRlRGF0YT5bXSA9IFtcbiAgQXR0cmlidXRlU2VsZWN0b3JzUnVsZSxcbiAgQ2xhc3NJbmhlcml0YW5jZVJ1bGUsXG4gIENsYXNzTmFtZXNSdWxlLFxuICBDb25zdHJ1Y3RvclNpZ25hdHVyZVJ1bGUsXG4gIENzc1NlbGVjdG9yc1J1bGUsXG4gIEVsZW1lbnRTZWxlY3RvcnNSdWxlLFxuICBJbnB1dE5hbWVzUnVsZSxcbiAgTWV0aG9kQ2FsbEFyZ3VtZW50c1J1bGUsXG4gIE1pc2NUZW1wbGF0ZVJ1bGUsXG4gIE91dHB1dE5hbWVzUnVsZSxcbiAgUHJvcGVydHlOYW1lc1J1bGUsXG5dO1xuXG50eXBlIE51bGxhYmxlTWlncmF0aW9uUnVsZSA9IE1pZ3JhdGlvblJ1bGVUeXBlPFJ1bGVVcGdyYWRlRGF0YXxudWxsPjtcblxudHlwZSBQb3N0TWlncmF0aW9uRm4gPSAoY29udGV4dDogU2NoZW1hdGljQ29udGV4dCwgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc0ZhaWx1cmU6IGJvb2xlYW4pID0+IHZvaWQ7XG5cbi8qKlxuICogQ3JlYXRlcyBhIEFuZ3VsYXIgc2NoZW1hdGljIHJ1bGUgdGhhdCBydW5zIHRoZSB1cGdyYWRlIGZvciB0aGVcbiAqIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVwZ3JhZGVSdWxlKFxuICAgIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGV4dHJhUnVsZXM6IE51bGxhYmxlTWlncmF0aW9uUnVsZVtdLCB1cGdyYWRlRGF0YTogUnVsZVVwZ3JhZGVEYXRhLFxuICAgIG9uTWlncmF0aW9uQ29tcGxldGVGbj86IFBvc3RNaWdyYXRpb25Gbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBoZXJlIGJlY2F1c2UgaXQgd291bGQgbWVhbiB0aGF0IG90aGVyIG1pZ3JhdGlvbnMgaW4gdGhlXG4gICAgICAvLyBwaXBlbGluZSBkb24ndCBydW4gZWl0aGVyLiBSYXRoZXIgcHJpbnQgYW4gZXJyb3IgbWVzc2FnZS5cbiAgICAgIGxvZ2dlci5lcnJvcignQ291bGQgbm90IGZpbmQgYW55IFR5cGVTY3JpcHQgcHJvamVjdCBpbiB0aGUgQ0xJIHdvcmtzcGFjZSBjb25maWd1cmF0aW9uLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHJ1bGVzID0gWy4uLmNka01pZ3JhdGlvblJ1bGVzLCAuLi5leHRyYVJ1bGVzXTtcbiAgICBsZXQgaGFzUnVsZUZhaWx1cmVzID0gZmFsc2U7XG5cbiAgICBjb25zdCBydW5NaWdyYXRpb24gPSAodHNjb25maWdQYXRoOiBzdHJpbmcsIGlzVGVzdFRhcmdldDogYm9vbGVhbikgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gcnVuTWlncmF0aW9uUnVsZXMoXG4gICAgICAgICAgdHJlZSwgY29udGV4dC5sb2dnZXIsIHRzY29uZmlnUGF0aCwgaXNUZXN0VGFyZ2V0LCB0YXJnZXRWZXJzaW9uLFxuICAgICAgICAgIHJ1bGVzLCB1cGdyYWRlRGF0YSwgYW5hbHl6ZWRGaWxlcyk7XG5cbiAgICAgIGhhc1J1bGVGYWlsdXJlcyA9IGhhc1J1bGVGYWlsdXJlcyB8fCByZXN1bHQuaGFzRmFpbHVyZXM7XG4gICAgfTtcblxuICAgIGJ1aWxkUGF0aHMuZm9yRWFjaChwID0+IHJ1bk1pZ3JhdGlvbihwLCBmYWxzZSkpO1xuICAgIHRlc3RQYXRocy5mb3JFYWNoKHAgPT4gcnVuTWlncmF0aW9uKHAsIHRydWUpKTtcblxuICAgIGxldCBydW5QYWNrYWdlTWFuYWdlciA9IGZhbHNlO1xuXG4gICAgLy8gUnVuIHRoZSBnbG9iYWwgcG9zdCBtaWdyYXRpb24gc3RhdGljIG1lbWJlcnMgZm9yIGFsbCBtaWdyYXRpb24gcnVsZXMuXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgIGNvbnN0IGFjdGlvblJlc3VsdCA9IHJ1bGUuZ2xvYmFsUG9zdE1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KTtcbiAgICAgIGlmIChhY3Rpb25SZXN1bHQpIHtcbiAgICAgICAgcnVuUGFja2FnZU1hbmFnZXIgPSBydW5QYWNrYWdlTWFuYWdlciB8fCBhY3Rpb25SZXN1bHQucnVuUGFja2FnZU1hbmFnZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiBhIHJ1bGUgcmVxdWVzdGVkIHRoZSBwYWNrYWdlIG1hbmFnZXIgdG8gcnVuLCB3ZSBydW4gaXQgYXMgYW5cbiAgICAvLyBhc3luY2hyb25vdXMgcG9zdCBtaWdyYXRpb24gdGFzay4gV2UgY2Fubm90IHJ1biBpdCBzeW5jaHJvbm91c2x5LFxuICAgIC8vIGFzIGZpbGUgY2hhbmdlcyBmcm9tIHRoZSBjdXJyZW50IG1pZ3JhdGlvbiB0YXNrIGFyZSBub3QgYXBwbGllZCB0b1xuICAgIC8vIHRoZSBmaWxlIHN5c3RlbSB5ZXQuXG4gICAgaWYgKHJ1blBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soe3F1aWV0OiBmYWxzZX0pKTtcbiAgICB9XG5cbiAgICBpZiAob25NaWdyYXRpb25Db21wbGV0ZUZuKSB7XG4gICAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4oY29udGV4dCwgdGFyZ2V0VmVyc2lvbiwgaGFzUnVsZUZhaWx1cmVzKTtcbiAgICB9XG4gIH07XG59XG4iXX0=