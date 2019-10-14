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
            // Run the global post migration static members for all migration rules.
            rules.forEach(r => r.globalPostMigration(tree, context));
            // Execute all asynchronous tasks and await them here. We want to run
            // the "onMigrationCompleteFn" after all work is done.
            yield context.engine.executePostTasks().toPromise();
            if (onMigrationCompleteFn) {
                onMigrationCompleteFn(targetVersion, hasRuleFailures);
            }
        });
    }
    exports.createUpgradeRule = createUpgradeRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlILHFFQUF1RTtJQUV2RSxpR0FBMkU7SUFHM0UsdUhBQWtFO0lBQ2xFLG1IQUE4RDtJQUM5RCx1R0FBa0Q7SUFDbEQsMkhBQXNFO0lBQ3RFLDJHQUFzRDtJQUN0RCxtSEFBOEQ7SUFDOUQsdUdBQWtEO0lBQ2xELDJIQUFxRTtJQUNyRSwyR0FBc0Q7SUFDdEQseUdBQW9EO0lBQ3BELDZHQUF3RDtJQUd4RCw0REFBNEQ7SUFDL0MsUUFBQSxpQkFBaUIsR0FBeUM7UUFDckUsaURBQXNCO1FBQ3RCLDZDQUFvQjtRQUNwQixpQ0FBYztRQUNkLHFEQUF3QjtRQUN4QixxQ0FBZ0I7UUFDaEIsNkNBQW9CO1FBQ3BCLGlDQUFjO1FBQ2Qsb0RBQXVCO1FBQ3ZCLHFDQUFnQjtRQUNoQixtQ0FBZTtRQUNmLHVDQUFpQjtLQUNsQixDQUFDO0lBSUY7OztPQUdHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQzdCLGFBQTRCLEVBQUUsVUFBbUMsRUFBRSxXQUE0QixFQUMvRixxQkFBb0Y7UUFDdEYsT0FBTyxDQUFPLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDckQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixNQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxHQUFHLGdEQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTlELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsaUZBQWlGO2dCQUNqRiw0REFBNEQ7Z0JBQzVELE1BQU0sQ0FBQyxLQUFLLENBQUMsMkVBQTJFLENBQUMsQ0FBQztnQkFDMUYsT0FBTzthQUNSO1lBRUQsbUZBQW1GO1lBQ25GLHNGQUFzRjtZQUN0RiwyRkFBMkY7WUFDM0YsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUN4QyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcseUJBQWlCLEVBQUUsR0FBRyxVQUFVLENBQUMsQ0FBQztZQUNwRCxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFFNUIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxZQUFvQixFQUFFLFlBQXFCLEVBQUUsRUFBRTtnQkFDbkUsTUFBTSxNQUFNLEdBQUcsK0JBQWlCLENBQzVCLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUMvRCxLQUFLLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUV2QyxlQUFlLEdBQUcsZUFBZSxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDMUQsQ0FBQyxDQUFDO1lBRUYsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoRCxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRTlDLHdFQUF3RTtZQUN4RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRXpELHFFQUFxRTtZQUNyRSxzREFBc0Q7WUFDdEQsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsU0FBUyxFQUFFLENBQUM7WUFFcEQsSUFBSSxxQkFBcUIsRUFBRTtnQkFDekIscUJBQXFCLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2FBQ3ZEO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBM0NELDhDQTJDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuaW1wb3J0IHtNaWdyYXRpb25SdWxlVHlwZSwgcnVuTWlncmF0aW9uUnVsZXN9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdC10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQge1J1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuaW1wb3J0IHtBdHRyaWJ1dGVTZWxlY3RvcnNSdWxlfSBmcm9tICcuL2F0dHJpYnV0ZS1zZWxlY3RvcnMtcnVsZSc7XG5pbXBvcnQge0NsYXNzSW5oZXJpdGFuY2VSdWxlfSBmcm9tICcuL2NsYXNzLWluaGVyaXRhbmNlLXJ1bGUnO1xuaW1wb3J0IHtDbGFzc05hbWVzUnVsZX0gZnJvbSAnLi9jbGFzcy1uYW1lcy1ydWxlJztcbmltcG9ydCB7Q29uc3RydWN0b3JTaWduYXR1cmVSdWxlfSBmcm9tICcuL2NvbnN0cnVjdG9yLXNpZ25hdHVyZS1ydWxlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JzUnVsZX0gZnJvbSAnLi9jc3Mtc2VsZWN0b3JzLXJ1bGUnO1xuaW1wb3J0IHtFbGVtZW50U2VsZWN0b3JzUnVsZX0gZnJvbSAnLi9lbGVtZW50LXNlbGVjdG9ycy1ydWxlJztcbmltcG9ydCB7SW5wdXROYW1lc1J1bGV9IGZyb20gJy4vaW5wdXQtbmFtZXMtcnVsZSc7XG5pbXBvcnQge01ldGhvZENhbGxBcmd1bWVudHNSdWxlfSBmcm9tICcuL21ldGhvZC1jYWxsLWFyZ3VtZW50cy1ydWxlJztcbmltcG9ydCB7TWlzY1RlbXBsYXRlUnVsZX0gZnJvbSAnLi9taXNjLXRlbXBsYXRlLXJ1bGUnO1xuaW1wb3J0IHtPdXRwdXROYW1lc1J1bGV9IGZyb20gJy4vb3V0cHV0LW5hbWVzLXJ1bGUnO1xuaW1wb3J0IHtQcm9wZXJ0eU5hbWVzUnVsZX0gZnJvbSAnLi9wcm9wZXJ0eS1uYW1lcy1ydWxlJztcblxuXG4vKiogTGlzdCBvZiBtaWdyYXRpb24gcnVsZXMgd2hpY2ggcnVuIGZvciB0aGUgQ0RLIHVwZGF0ZS4gKi9cbmV4cG9ydCBjb25zdCBjZGtNaWdyYXRpb25SdWxlczogTWlncmF0aW9uUnVsZVR5cGU8UnVsZVVwZ3JhZGVEYXRhPltdID0gW1xuICBBdHRyaWJ1dGVTZWxlY3RvcnNSdWxlLFxuICBDbGFzc0luaGVyaXRhbmNlUnVsZSxcbiAgQ2xhc3NOYW1lc1J1bGUsXG4gIENvbnN0cnVjdG9yU2lnbmF0dXJlUnVsZSxcbiAgQ3NzU2VsZWN0b3JzUnVsZSxcbiAgRWxlbWVudFNlbGVjdG9yc1J1bGUsXG4gIElucHV0TmFtZXNSdWxlLFxuICBNZXRob2RDYWxsQXJndW1lbnRzUnVsZSxcbiAgTWlzY1RlbXBsYXRlUnVsZSxcbiAgT3V0cHV0TmFtZXNSdWxlLFxuICBQcm9wZXJ0eU5hbWVzUnVsZSxcbl07XG5cbnR5cGUgTnVsbGFibGVNaWdyYXRpb25SdWxlID0gTWlncmF0aW9uUnVsZVR5cGU8UnVsZVVwZ3JhZGVEYXRhfG51bGw+O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBBbmd1bGFyIHNjaGVtYXRpYyBydWxlIHRoYXQgcnVucyB0aGUgdXBncmFkZSBmb3IgdGhlXG4gKiBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVcGdyYWRlUnVsZShcbiAgICB0YXJnZXRWZXJzaW9uOiBUYXJnZXRWZXJzaW9uLCBleHRyYVJ1bGVzOiBOdWxsYWJsZU1pZ3JhdGlvblJ1bGVbXSwgdXBncmFkZURhdGE6IFJ1bGVVcGdyYWRlRGF0YSxcbiAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4/OiAodGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbiwgaGFzRmFpbHVyZXM6IGJvb2xlYW4pID0+IHZvaWQpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcblxuICAgIGlmICghYnVpbGRQYXRocy5sZW5ndGggJiYgIXRlc3RQYXRocy5sZW5ndGgpIHtcbiAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gdGhyb3cgaGVyZSBiZWNhdXNlIGl0IHdvdWxkIG1lYW4gdGhhdCBvdGhlciBtaWdyYXRpb25zIGluIHRoZVxuICAgICAgLy8gcGlwZWxpbmUgZG9uJ3QgcnVuIGVpdGhlci4gUmF0aGVyIHByaW50IGFuIGVycm9yIG1lc3NhZ2UuXG4gICAgICBsb2dnZXIuZXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGFueSBUeXBlU2NyaXB0IHByb2plY3QgaW4gdGhlIENMSSB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbi4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBwcm9qZWN0IHNvdXJjZSBmaWxlcyB3aGljaCBoYXZlIGJlZW4gY2hlY2tlZC9taWdyYXRlZC4gVGhpcyBpc1xuICAgIC8vIG5lY2Vzc2FyeSBiZWNhdXNlIG11bHRpcGxlIFR5cGVTY3JpcHQgcHJvamVjdHMgY2FuIGNvbnRhaW4gdGhlIHNhbWUgc291cmNlIGZpbGUgYW5kXG4gICAgLy8gd2UgZG9uJ3Qgd2FudCB0byBjaGVjayB0aGVzZSBhZ2FpbiwgYXMgdGhpcyB3b3VsZCByZXN1bHQgaW4gZHVwbGljYXRlZCBmYWlsdXJlIG1lc3NhZ2VzLlxuICAgIGNvbnN0IGFuYWx5emVkRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCBydWxlcyA9IFsuLi5jZGtNaWdyYXRpb25SdWxlcywgLi4uZXh0cmFSdWxlc107XG4gICAgbGV0IGhhc1J1bGVGYWlsdXJlcyA9IGZhbHNlO1xuXG4gICAgY29uc3QgcnVuTWlncmF0aW9uID0gKHRzY29uZmlnUGF0aDogc3RyaW5nLCBpc1Rlc3RUYXJnZXQ6IGJvb2xlYW4pID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHJ1bk1pZ3JhdGlvblJ1bGVzKFxuICAgICAgICAgIHRyZWUsIGNvbnRleHQubG9nZ2VyLCB0c2NvbmZpZ1BhdGgsIGlzVGVzdFRhcmdldCwgdGFyZ2V0VmVyc2lvbixcbiAgICAgICAgICBydWxlcywgdXBncmFkZURhdGEsIGFuYWx5emVkRmlsZXMpO1xuXG4gICAgICBoYXNSdWxlRmFpbHVyZXMgPSBoYXNSdWxlRmFpbHVyZXMgfHwgcmVzdWx0Lmhhc0ZhaWx1cmVzO1xuICAgIH07XG5cbiAgICBidWlsZFBhdGhzLmZvckVhY2gocCA9PiBydW5NaWdyYXRpb24ocCwgZmFsc2UpKTtcbiAgICB0ZXN0UGF0aHMuZm9yRWFjaChwID0+IHJ1bk1pZ3JhdGlvbihwLCB0cnVlKSk7XG5cbiAgICAvLyBSdW4gdGhlIGdsb2JhbCBwb3N0IG1pZ3JhdGlvbiBzdGF0aWMgbWVtYmVycyBmb3IgYWxsIG1pZ3JhdGlvbiBydWxlcy5cbiAgICBydWxlcy5mb3JFYWNoKHIgPT4gci5nbG9iYWxQb3N0TWlncmF0aW9uKHRyZWUsIGNvbnRleHQpKTtcblxuICAgIC8vIEV4ZWN1dGUgYWxsIGFzeW5jaHJvbm91cyB0YXNrcyBhbmQgYXdhaXQgdGhlbSBoZXJlLiBXZSB3YW50IHRvIHJ1blxuICAgIC8vIHRoZSBcIm9uTWlncmF0aW9uQ29tcGxldGVGblwiIGFmdGVyIGFsbCB3b3JrIGlzIGRvbmUuXG4gICAgYXdhaXQgY29udGV4dC5lbmdpbmUuZXhlY3V0ZVBvc3RUYXNrcygpLnRvUHJvbWlzZSgpO1xuXG4gICAgaWYgKG9uTWlncmF0aW9uQ29tcGxldGVGbikge1xuICAgICAgb25NaWdyYXRpb25Db21wbGV0ZUZuKHRhcmdldFZlcnNpb24sIGhhc1J1bGVGYWlsdXJlcyk7XG4gICAgfVxuICB9O1xufVxuIl19