"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscTemplateMigration = void 0;
const target_version_1 = require("../../update-tool/target-version");
const migration_1 = require("../../update-tool/migration");
const literal_1 = require("../typescript/literal");
/**
 * Migration that walks through every template and reports if there are
 * instances of outdated Angular CDK API that can't be migrated automatically.
 */
class MiscTemplateMigration extends migration_1.Migration {
    constructor() {
        super(...arguments);
        // Only enable this rule if the migration targets version 6. The rule
        // currently only includes migrations for V6 deprecations.
        this.enabled = this.targetVersion === target_version_1.TargetVersion.V6;
    }
    visitTemplate(template) {
        // Migration for https://github.com/angular/components/pull/10325 (v6)
        (0, literal_1.findAllSubstringIndices)(template.content, 'cdk-focus-trap').forEach(offset => {
            this.failures.push({
                filePath: template.filePath,
                position: template.getCharacterAndLineOfPosition(template.start + offset),
                message: `Found deprecated element selector "cdk-focus-trap" which has been ` +
                    `changed to an attribute selector "[cdkTrapFocus]".`
            });
        });
    }
}
exports.MiscTemplateMigration = MiscTemplateMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzYy10ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy9taXNjLXRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILHFFQUErRDtBQUUvRCwyREFBc0Q7QUFDdEQsbURBQThEO0FBRzlEOzs7R0FHRztBQUNILE1BQWEscUJBQXNCLFNBQVEscUJBQXNCO0lBQWpFOztRQUVFLHFFQUFxRTtRQUNyRSwwREFBMEQ7UUFDMUQsWUFBTyxHQUFHLElBQUksQ0FBQyxhQUFhLEtBQUssOEJBQWEsQ0FBQyxFQUFFLENBQUM7SUFhcEQsQ0FBQztJQVhVLGFBQWEsQ0FBQyxRQUEwQjtRQUMvQyxzRUFBc0U7UUFDdEUsSUFBQSxpQ0FBdUIsRUFBQyxRQUFRLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzNFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUNqQixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7Z0JBQzNCLFFBQVEsRUFBRSxRQUFRLENBQUMsNkJBQTZCLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7Z0JBQ3pFLE9BQU8sRUFBRSxvRUFBb0U7b0JBQ3pFLG9EQUFvRDthQUN6RCxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWpCRCxzREFpQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUYXJnZXRWZXJzaW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC90YXJnZXQtdmVyc2lvbic7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5pbXBvcnQge2ZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzfSBmcm9tICcuLi90eXBlc2NyaXB0L2xpdGVyYWwnO1xuaW1wb3J0IHtVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IHRlbXBsYXRlIGFuZCByZXBvcnRzIGlmIHRoZXJlIGFyZVxuICogaW5zdGFuY2VzIG9mIG91dGRhdGVkIEFuZ3VsYXIgQ0RLIEFQSSB0aGF0IGNhbid0IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBNaXNjVGVtcGxhdGVNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGlzIHJ1bGUgaWYgdGhlIG1pZ3JhdGlvbiB0YXJnZXRzIHZlcnNpb24gNi4gVGhlIHJ1bGVcbiAgLy8gY3VycmVudGx5IG9ubHkgaW5jbHVkZXMgbWlncmF0aW9ucyBmb3IgVjYgZGVwcmVjYXRpb25zLlxuICBlbmFibGVkID0gdGhpcy50YXJnZXRWZXJzaW9uID09PSBUYXJnZXRWZXJzaW9uLlY2O1xuXG4gIG92ZXJyaWRlIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHtcbiAgICAvLyBNaWdyYXRpb24gZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xMDMyNSAodjYpXG4gICAgZmluZEFsbFN1YnN0cmluZ0luZGljZXModGVtcGxhdGUuY29udGVudCwgJ2Nkay1mb2N1cy10cmFwJykuZm9yRWFjaChvZmZzZXQgPT4ge1xuICAgICAgdGhpcy5mYWlsdXJlcy5wdXNoKHtcbiAgICAgICAgZmlsZVBhdGg6IHRlbXBsYXRlLmZpbGVQYXRoLFxuICAgICAgICBwb3NpdGlvbjogdGVtcGxhdGUuZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb24odGVtcGxhdGUuc3RhcnQgKyBvZmZzZXQpLFxuICAgICAgICBtZXNzYWdlOiBgRm91bmQgZGVwcmVjYXRlZCBlbGVtZW50IHNlbGVjdG9yIFwiY2RrLWZvY3VzLXRyYXBcIiB3aGljaCBoYXMgYmVlbiBgICtcbiAgICAgICAgICAgIGBjaGFuZ2VkIHRvIGFuIGF0dHJpYnV0ZSBzZWxlY3RvciBcIltjZGtUcmFwRm9jdXNdXCIuYFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==