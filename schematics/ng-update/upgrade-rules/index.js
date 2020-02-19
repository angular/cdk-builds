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
            const workspace = project_tsconfig_paths_1.getWorkspaceConfigGracefully(tree);
            if (workspace === null) {
                logger.error('Could not find workspace configuration file.');
                return;
            }
            // Keep track of all project source files which have been checked/migrated. This is
            // necessary because multiple TypeScript projects can contain the same source file and
            // we don't want to check these again, as this would result in duplicated failure messages.
            const analyzedFiles = new Set();
            const projectNames = Object.keys(workspace.projects);
            const rules = [...exports.cdkMigrationRules, ...extraRules];
            let hasRuleFailures = false;
            const runMigration = (project, tsconfigPath, isTestTarget) => {
                const result = update_tool_1.runMigrationRules(project, tree, context.logger, tsconfigPath, isTestTarget, targetVersion, rules, upgradeData, analyzedFiles);
                hasRuleFailures = hasRuleFailures || result.hasFailures;
            };
            for (const projectName of projectNames) {
                const project = workspace.projects[projectName];
                const buildTsconfigPath = project_tsconfig_paths_1.getTargetTsconfigPath(project, 'build');
                const testTsconfigPath = project_tsconfig_paths_1.getTargetTsconfigPath(project, 'test');
                if (!buildTsconfigPath && !testTsconfigPath) {
                    logger.warn(`Could not find TypeScript project for project: ${projectName}`);
                    continue;
                }
                if (buildTsconfigPath !== null) {
                    runMigration(project, buildTsconfigPath, false);
                }
                if (testTsconfigPath !== null) {
                    runMigration(project, testTsconfigPath, true);
                }
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCw0REFBd0U7SUFHeEUscUVBQXVFO0lBRXZFLGlHQUc0QztJQUc1Qyx1SEFBa0U7SUFDbEUsbUhBQThEO0lBQzlELHVHQUFrRDtJQUNsRCwySEFBc0U7SUFDdEUsMkdBQXNEO0lBQ3RELG1IQUE4RDtJQUM5RCx1R0FBa0Q7SUFDbEQsMkhBQXFFO0lBQ3JFLDJHQUFzRDtJQUN0RCx5R0FBb0Q7SUFDcEQsNkdBQXdEO0lBR3hELDREQUE0RDtJQUMvQyxRQUFBLGlCQUFpQixHQUF5QztRQUNyRSxpREFBc0I7UUFDdEIsNkNBQW9CO1FBQ3BCLGlDQUFjO1FBQ2QscURBQXdCO1FBQ3hCLHFDQUFnQjtRQUNoQiw2Q0FBb0I7UUFDcEIsaUNBQWM7UUFDZCxvREFBdUI7UUFDdkIscUNBQWdCO1FBQ2hCLG1DQUFlO1FBQ2YsdUNBQWlCO0tBQ2xCLENBQUM7SUFPRjs7O09BR0c7SUFDSCxTQUFnQixpQkFBaUIsQ0FDN0IsYUFBNEIsRUFBRSxVQUFtQyxFQUFFLFdBQTRCLEVBQy9GLHFCQUF1QztRQUN6QyxPQUFPLENBQU8sSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUNyRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlCLE1BQU0sU0FBUyxHQUFHLHFEQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJELElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtnQkFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO2dCQUM3RCxPQUFPO2FBQ1I7WUFFRCxtRkFBbUY7WUFDbkYsc0ZBQXNGO1lBQ3RGLDJGQUEyRjtZQUMzRixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBQ3hDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyx5QkFBaUIsRUFBRSxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQ3BELElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztZQUU1QixNQUFNLFlBQVksR0FDZCxDQUFDLE9BQXlCLEVBQUUsWUFBb0IsRUFBRSxZQUFxQixFQUFFLEVBQUU7Z0JBQ3pFLE1BQU0sTUFBTSxHQUFHLCtCQUFpQixDQUM1QixPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUMvRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ2hDLGVBQWUsR0FBRyxlQUFlLElBQUksTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUMxRCxDQUFDLENBQUM7WUFFTixLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRTtnQkFDdEMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxpQkFBaUIsR0FBRyw4Q0FBcUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sZ0JBQWdCLEdBQUcsOENBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVoRSxJQUFJLENBQUMsaUJBQWlCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDM0MsTUFBTSxDQUFDLElBQUksQ0FBQyxrREFBa0QsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDN0UsU0FBUztpQkFDVjtnQkFDRCxJQUFJLGlCQUFpQixLQUFLLElBQUksRUFBRTtvQkFDOUIsWUFBWSxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDakQ7Z0JBQ0QsSUFBSSxnQkFBZ0IsS0FBSyxJQUFJLEVBQUU7b0JBQzdCLFlBQVksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQy9DO2FBQ0Y7WUFFRCxJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUM5Qix3RUFBd0U7WUFDeEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLGlCQUFpQixHQUFHLGlCQUFpQixJQUFJLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztpQkFDekU7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILGtFQUFrRTtZQUNsRSxvRUFBb0U7WUFDcEUscUVBQXFFO1lBQ3JFLHVCQUF1QjtZQUN2QixJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksOEJBQXNCLENBQUMsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdEO1lBRUQsSUFBSSxxQkFBcUIsRUFBRTtnQkFDekIscUJBQXFCLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQzthQUNoRTtRQUNILENBQUMsQ0FBQSxDQUFDO0lBQ0osQ0FBQztJQWxFRCw4Q0FrRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge05vZGVQYWNrYWdlSW5zdGFsbFRhc2t9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzL3Rhc2tzJztcbmltcG9ydCB7V29ya3NwYWNlUHJvamVjdH0gZnJvbSAnQHNjaGVtYXRpY3MvYW5ndWxhci91dGlsaXR5L3dvcmtzcGFjZS1tb2RlbHMnO1xuXG5pbXBvcnQge01pZ3JhdGlvblJ1bGVUeXBlLCBydW5NaWdyYXRpb25SdWxlc30gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wnO1xuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge1xuICBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgsXG4gIGdldFdvcmtzcGFjZUNvbmZpZ0dyYWNlZnVsbHlcbn0gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdC10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQge1J1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuaW1wb3J0IHtBdHRyaWJ1dGVTZWxlY3RvcnNSdWxlfSBmcm9tICcuL2F0dHJpYnV0ZS1zZWxlY3RvcnMtcnVsZSc7XG5pbXBvcnQge0NsYXNzSW5oZXJpdGFuY2VSdWxlfSBmcm9tICcuL2NsYXNzLWluaGVyaXRhbmNlLXJ1bGUnO1xuaW1wb3J0IHtDbGFzc05hbWVzUnVsZX0gZnJvbSAnLi9jbGFzcy1uYW1lcy1ydWxlJztcbmltcG9ydCB7Q29uc3RydWN0b3JTaWduYXR1cmVSdWxlfSBmcm9tICcuL2NvbnN0cnVjdG9yLXNpZ25hdHVyZS1ydWxlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JzUnVsZX0gZnJvbSAnLi9jc3Mtc2VsZWN0b3JzLXJ1bGUnO1xuaW1wb3J0IHtFbGVtZW50U2VsZWN0b3JzUnVsZX0gZnJvbSAnLi9lbGVtZW50LXNlbGVjdG9ycy1ydWxlJztcbmltcG9ydCB7SW5wdXROYW1lc1J1bGV9IGZyb20gJy4vaW5wdXQtbmFtZXMtcnVsZSc7XG5pbXBvcnQge01ldGhvZENhbGxBcmd1bWVudHNSdWxlfSBmcm9tICcuL21ldGhvZC1jYWxsLWFyZ3VtZW50cy1ydWxlJztcbmltcG9ydCB7TWlzY1RlbXBsYXRlUnVsZX0gZnJvbSAnLi9taXNjLXRlbXBsYXRlLXJ1bGUnO1xuaW1wb3J0IHtPdXRwdXROYW1lc1J1bGV9IGZyb20gJy4vb3V0cHV0LW5hbWVzLXJ1bGUnO1xuaW1wb3J0IHtQcm9wZXJ0eU5hbWVzUnVsZX0gZnJvbSAnLi9wcm9wZXJ0eS1uYW1lcy1ydWxlJztcblxuXG4vKiogTGlzdCBvZiBtaWdyYXRpb24gcnVsZXMgd2hpY2ggcnVuIGZvciB0aGUgQ0RLIHVwZGF0ZS4gKi9cbmV4cG9ydCBjb25zdCBjZGtNaWdyYXRpb25SdWxlczogTWlncmF0aW9uUnVsZVR5cGU8UnVsZVVwZ3JhZGVEYXRhPltdID0gW1xuICBBdHRyaWJ1dGVTZWxlY3RvcnNSdWxlLFxuICBDbGFzc0luaGVyaXRhbmNlUnVsZSxcbiAgQ2xhc3NOYW1lc1J1bGUsXG4gIENvbnN0cnVjdG9yU2lnbmF0dXJlUnVsZSxcbiAgQ3NzU2VsZWN0b3JzUnVsZSxcbiAgRWxlbWVudFNlbGVjdG9yc1J1bGUsXG4gIElucHV0TmFtZXNSdWxlLFxuICBNZXRob2RDYWxsQXJndW1lbnRzUnVsZSxcbiAgTWlzY1RlbXBsYXRlUnVsZSxcbiAgT3V0cHV0TmFtZXNSdWxlLFxuICBQcm9wZXJ0eU5hbWVzUnVsZSxcbl07XG5cbnR5cGUgTnVsbGFibGVNaWdyYXRpb25SdWxlID0gTWlncmF0aW9uUnVsZVR5cGU8UnVsZVVwZ3JhZGVEYXRhfG51bGw+O1xuXG50eXBlIFBvc3RNaWdyYXRpb25GbiA9XG4gICAgKGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQsIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGhhc0ZhaWx1cmU6IGJvb2xlYW4pID0+IHZvaWQ7XG5cbi8qKlxuICogQ3JlYXRlcyBhIEFuZ3VsYXIgc2NoZW1hdGljIHJ1bGUgdGhhdCBydW5zIHRoZSB1cGdyYWRlIGZvciB0aGVcbiAqIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVVwZ3JhZGVSdWxlKFxuICAgIHRhcmdldFZlcnNpb246IFRhcmdldFZlcnNpb24sIGV4dHJhUnVsZXM6IE51bGxhYmxlTWlncmF0aW9uUnVsZVtdLCB1cGdyYWRlRGF0YTogUnVsZVVwZ3JhZGVEYXRhLFxuICAgIG9uTWlncmF0aW9uQ29tcGxldGVGbj86IFBvc3RNaWdyYXRpb25Gbik6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSBnZXRXb3Jrc3BhY2VDb25maWdHcmFjZWZ1bGx5KHRyZWUpO1xuXG4gICAgaWYgKHdvcmtzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgZmluZCB3b3Jrc3BhY2UgY29uZmlndXJhdGlvbiBmaWxlLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHByb2plY3Qgc291cmNlIGZpbGVzIHdoaWNoIGhhdmUgYmVlbiBjaGVja2VkL21pZ3JhdGVkLiBUaGlzIGlzXG4gICAgLy8gbmVjZXNzYXJ5IGJlY2F1c2UgbXVsdGlwbGUgVHlwZVNjcmlwdCBwcm9qZWN0cyBjYW4gY29udGFpbiB0aGUgc2FtZSBzb3VyY2UgZmlsZSBhbmRcbiAgICAvLyB3ZSBkb24ndCB3YW50IHRvIGNoZWNrIHRoZXNlIGFnYWluLCBhcyB0aGlzIHdvdWxkIHJlc3VsdCBpbiBkdXBsaWNhdGVkIGZhaWx1cmUgbWVzc2FnZXMuXG4gICAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHByb2plY3ROYW1lcyA9IE9iamVjdC5rZXlzKHdvcmtzcGFjZS5wcm9qZWN0cyk7XG4gICAgY29uc3QgcnVsZXMgPSBbLi4uY2RrTWlncmF0aW9uUnVsZXMsIC4uLmV4dHJhUnVsZXNdO1xuICAgIGxldCBoYXNSdWxlRmFpbHVyZXMgPSBmYWxzZTtcblxuICAgIGNvbnN0IHJ1bk1pZ3JhdGlvbiA9XG4gICAgICAgIChwcm9qZWN0OiBXb3Jrc3BhY2VQcm9qZWN0LCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgaXNUZXN0VGFyZ2V0OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gcnVuTWlncmF0aW9uUnVsZXMoXG4gICAgICAgICAgICAgIHByb2plY3QsIHRyZWUsIGNvbnRleHQubG9nZ2VyLCB0c2NvbmZpZ1BhdGgsIGlzVGVzdFRhcmdldCwgdGFyZ2V0VmVyc2lvbiwgcnVsZXMsXG4gICAgICAgICAgICAgIHVwZ3JhZGVEYXRhLCBhbmFseXplZEZpbGVzKTtcbiAgICAgICAgICBoYXNSdWxlRmFpbHVyZXMgPSBoYXNSdWxlRmFpbHVyZXMgfHwgcmVzdWx0Lmhhc0ZhaWx1cmVzO1xuICAgICAgICB9O1xuXG4gICAgZm9yIChjb25zdCBwcm9qZWN0TmFtZSBvZiBwcm9qZWN0TmFtZXMpIHtcbiAgICAgIGNvbnN0IHByb2plY3QgPSB3b3Jrc3BhY2UucHJvamVjdHNbcHJvamVjdE5hbWVdO1xuICAgICAgY29uc3QgYnVpbGRUc2NvbmZpZ1BhdGggPSBnZXRUYXJnZXRUc2NvbmZpZ1BhdGgocHJvamVjdCwgJ2J1aWxkJyk7XG4gICAgICBjb25zdCB0ZXN0VHNjb25maWdQYXRoID0gZ2V0VGFyZ2V0VHNjb25maWdQYXRoKHByb2plY3QsICd0ZXN0Jyk7XG5cbiAgICAgIGlmICghYnVpbGRUc2NvbmZpZ1BhdGggJiYgIXRlc3RUc2NvbmZpZ1BhdGgpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oYENvdWxkIG5vdCBmaW5kIFR5cGVTY3JpcHQgcHJvamVjdCBmb3IgcHJvamVjdDogJHtwcm9qZWN0TmFtZX1gKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoYnVpbGRUc2NvbmZpZ1BhdGggIT09IG51bGwpIHtcbiAgICAgICAgcnVuTWlncmF0aW9uKHByb2plY3QsIGJ1aWxkVHNjb25maWdQYXRoLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBpZiAodGVzdFRzY29uZmlnUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICBydW5NaWdyYXRpb24ocHJvamVjdCwgdGVzdFRzY29uZmlnUGF0aCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHJ1blBhY2thZ2VNYW5hZ2VyID0gZmFsc2U7XG4gICAgLy8gUnVuIHRoZSBnbG9iYWwgcG9zdCBtaWdyYXRpb24gc3RhdGljIG1lbWJlcnMgZm9yIGFsbCBtaWdyYXRpb24gcnVsZXMuXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IHtcbiAgICAgIGNvbnN0IGFjdGlvblJlc3VsdCA9IHJ1bGUuZ2xvYmFsUG9zdE1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KTtcbiAgICAgIGlmIChhY3Rpb25SZXN1bHQpIHtcbiAgICAgICAgcnVuUGFja2FnZU1hbmFnZXIgPSBydW5QYWNrYWdlTWFuYWdlciB8fCBhY3Rpb25SZXN1bHQucnVuUGFja2FnZU1hbmFnZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiBhIHJ1bGUgcmVxdWVzdGVkIHRoZSBwYWNrYWdlIG1hbmFnZXIgdG8gcnVuLCB3ZSBydW4gaXQgYXMgYW5cbiAgICAvLyBhc3luY2hyb25vdXMgcG9zdCBtaWdyYXRpb24gdGFzay4gV2UgY2Fubm90IHJ1biBpdCBzeW5jaHJvbm91c2x5LFxuICAgIC8vIGFzIGZpbGUgY2hhbmdlcyBmcm9tIHRoZSBjdXJyZW50IG1pZ3JhdGlvbiB0YXNrIGFyZSBub3QgYXBwbGllZCB0b1xuICAgIC8vIHRoZSBmaWxlIHN5c3RlbSB5ZXQuXG4gICAgaWYgKHJ1blBhY2thZ2VNYW5hZ2VyKSB7XG4gICAgICBjb250ZXh0LmFkZFRhc2sobmV3IE5vZGVQYWNrYWdlSW5zdGFsbFRhc2soe3F1aWV0OiBmYWxzZX0pKTtcbiAgICB9XG5cbiAgICBpZiAob25NaWdyYXRpb25Db21wbGV0ZUZuKSB7XG4gICAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlRm4oY29udGV4dCwgdGFyZ2V0VmVyc2lvbiwgaGFzUnVsZUZhaWx1cmVzKTtcbiAgICB9XG4gIH07XG59XG4iXX0=