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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/misc-template-rule", ["require", "exports", "@angular/cdk/schematics/update-tool/target-version", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/literal"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const target_version_1 = require("@angular/cdk/schematics/update-tool/target-version");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const literal_1 = require("@angular/cdk/schematics/ng-update/typescript/literal");
    /**
     * Rule that walks through every template and reports if there are
     * instances of outdated Angular CDK API that can't be migrated automatically.
     */
    class MiscTemplateRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            // Only enable this rule if the migration targets version 6. The rule
            // currently only includes migrations for V6 deprecations.
            this.ruleEnabled = this.targetVersion === target_version_1.TargetVersion.V6;
        }
        visitTemplate(template) {
            // Migration for https://github.com/angular/components/pull/10325 (v6)
            literal_1.findAllSubstringIndices(template.content, 'cdk-focus-trap').forEach(offset => {
                this.failures.push({
                    filePath: template.filePath,
                    position: template.getCharacterAndLineOfPosition(template.start + offset),
                    message: `Found deprecated element selector "cdk-focus-trap" which has been ` +
                        `changed to an attribute selector "[cdkTrapFocus]".`
                });
            });
        }
    }
    exports.MiscTemplateRule = MiscTemplateRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzYy10ZW1wbGF0ZS1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS91cGdyYWRlLXJ1bGVzL21pc2MtdGVtcGxhdGUtcnVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILHVGQUErRDtJQUUvRCx1RkFBK0Q7SUFDL0Qsa0ZBQThEO0lBRzlEOzs7T0FHRztJQUNILE1BQWEsZ0JBQWlCLFNBQVEsOEJBQThCO1FBQXBFOztZQUVFLHFFQUFxRTtZQUNyRSwwREFBMEQ7WUFDMUQsZ0JBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxLQUFLLDhCQUFhLENBQUMsRUFBRSxDQUFDO1FBYXhELENBQUM7UUFYQyxhQUFhLENBQUMsUUFBMEI7WUFDdEMsc0VBQXNFO1lBQ3RFLGlDQUF1QixDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQzNFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO29CQUNqQixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7b0JBQzNCLFFBQVEsRUFBRSxRQUFRLENBQUMsNkJBQTZCLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7b0JBQ3pFLE9BQU8sRUFBRSxvRUFBb0U7d0JBQ3pFLG9EQUFvRDtpQkFDekQsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Y7SUFqQkQsNENBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7TWlncmF0aW9uUnVsZX0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtmaW5kQWxsU3Vic3RyaW5nSW5kaWNlc30gZnJvbSAnLi4vdHlwZXNjcmlwdC9saXRlcmFsJztcbmltcG9ydCB7UnVsZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKipcbiAqIFJ1bGUgdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IHRlbXBsYXRlIGFuZCByZXBvcnRzIGlmIHRoZXJlIGFyZVxuICogaW5zdGFuY2VzIG9mIG91dGRhdGVkIEFuZ3VsYXIgQ0RLIEFQSSB0aGF0IGNhbid0IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBNaXNjVGVtcGxhdGVSdWxlIGV4dGVuZHMgTWlncmF0aW9uUnVsZTxSdWxlVXBncmFkZURhdGE+IHtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGlzIHJ1bGUgaWYgdGhlIG1pZ3JhdGlvbiB0YXJnZXRzIHZlcnNpb24gNi4gVGhlIHJ1bGVcbiAgLy8gY3VycmVudGx5IG9ubHkgaW5jbHVkZXMgbWlncmF0aW9ucyBmb3IgVjYgZGVwcmVjYXRpb25zLlxuICBydWxlRW5hYmxlZCA9IHRoaXMudGFyZ2V0VmVyc2lvbiA9PT0gVGFyZ2V0VmVyc2lvbi5WNjtcblxuICB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgLy8gTWlncmF0aW9uIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMTAzMjUgKHY2KVxuICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHRlbXBsYXRlLmNvbnRlbnQsICdjZGstZm9jdXMtdHJhcCcpLmZvckVhY2gob2Zmc2V0ID0+IHtcbiAgICAgIHRoaXMuZmFpbHVyZXMucHVzaCh7XG4gICAgICAgIGZpbGVQYXRoOiB0ZW1wbGF0ZS5maWxlUGF0aCxcbiAgICAgICAgcG9zaXRpb246IHRlbXBsYXRlLmdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uKHRlbXBsYXRlLnN0YXJ0ICsgb2Zmc2V0KSxcbiAgICAgICAgbWVzc2FnZTogYEZvdW5kIGRlcHJlY2F0ZWQgZWxlbWVudCBzZWxlY3RvciBcImNkay1mb2N1cy10cmFwXCIgd2hpY2ggaGFzIGJlZW4gYCArXG4gICAgICAgICAgICBgY2hhbmdlZCB0byBhbiBhdHRyaWJ1dGUgc2VsZWN0b3IgXCJbY2RrVHJhcEZvY3VzXVwiLmBcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG4iXX0=