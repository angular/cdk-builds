"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributeSelectorsMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const literal_1 = require("../typescript/literal");
const upgrade_data_1 = require("../upgrade-data");
/**
 * Migration that walks through every string literal, template and stylesheet
 * in order to switch deprecated attribute selectors to the updated selector.
 */
class AttributeSelectorsMigration extends migration_1.Migration {
    constructor() {
        super(...arguments);
        /** Required upgrade changes for specified target version. */
        this.data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'attributeSelectors');
        // Only enable the migration rule if there is upgrade data.
        this.enabled = this.data.length !== 0;
    }
    visitNode(node) {
        if (ts.isStringLiteralLike(node)) {
            this._visitStringLiteralLike(node);
        }
    }
    visitTemplate(template) {
        this.data.forEach(selector => {
            (0, literal_1.findAllSubstringIndices)(template.content, selector.replace)
                .map(offset => template.start + offset)
                .forEach(start => this._replaceSelector(template.filePath, start, selector));
        });
    }
    visitStylesheet(stylesheet) {
        this.data.forEach(selector => {
            const currentSelector = `[${selector.replace}]`;
            const updatedSelector = `[${selector.replaceWith}]`;
            (0, literal_1.findAllSubstringIndices)(stylesheet.content, currentSelector)
                .map(offset => stylesheet.start + offset)
                .forEach(start => this._replaceSelector(stylesheet.filePath, start, { replace: currentSelector, replaceWith: updatedSelector }));
        });
    }
    _visitStringLiteralLike(literal) {
        if (literal.parent && literal.parent.kind !== ts.SyntaxKind.CallExpression) {
            return;
        }
        const literalText = literal.getText();
        const filePath = this.fileSystem.resolve(literal.getSourceFile().fileName);
        this.data.forEach(selector => {
            (0, literal_1.findAllSubstringIndices)(literalText, selector.replace)
                .map(offset => literal.getStart() + offset)
                .forEach(start => this._replaceSelector(filePath, start, selector));
        });
    }
    _replaceSelector(filePath, start, data) {
        this.fileSystem.edit(filePath)
            .remove(start, data.replace.length)
            .insertRight(start, data.replaceWith);
    }
}
exports.AttributeSelectorsMigration = AttributeSelectorsMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cmlidXRlLXNlbGVjdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy9hdHRyaWJ1dGUtc2VsZWN0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILGlDQUFpQztBQUdqQywyREFBc0Q7QUFFdEQsbURBQThEO0FBQzlELGtEQUFtRTtBQUVuRTs7O0dBR0c7QUFDSCxNQUFhLDJCQUE0QixTQUFRLHFCQUFzQjtJQUF2RTs7UUFDRSw2REFBNkQ7UUFDN0QsU0FBSSxHQUFHLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFFekQsMkRBQTJEO1FBQzNELFlBQU8sR0FBWSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7SUFtRDVDLENBQUM7SUFqRFUsU0FBUyxDQUFDLElBQWE7UUFDOUIsSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BDO0lBQ0gsQ0FBQztJQUVRLGFBQWEsQ0FBQyxRQUEwQjtRQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMzQixJQUFBLGlDQUF1QixFQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQztpQkFDdEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7aUJBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ25GLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVRLGVBQWUsQ0FBQyxVQUE0QjtRQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMzQixNQUFNLGVBQWUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUNoRCxNQUFNLGVBQWUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEdBQUcsQ0FBQztZQUVwRCxJQUFBLGlDQUF1QixFQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDO2lCQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztpQkFDeEMsT0FBTyxDQUNKLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUMxQixVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssRUFDMUIsRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sdUJBQXVCLENBQUMsT0FBNkI7UUFDM0QsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFO1lBQzFFLE9BQU87U0FDUjtRQUVELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFM0UsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDM0IsSUFBQSxpQ0FBdUIsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQztpQkFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLE1BQU0sQ0FBQztpQkFDMUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxnQkFBZ0IsQ0FBQyxRQUF1QixFQUFFLEtBQWEsRUFDdEMsSUFBa0M7UUFDekQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2FBQzNCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7YUFDbEMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBeERELGtFQXdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7V29ya3NwYWNlUGF0aH0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtBdHRyaWJ1dGVTZWxlY3RvclVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhL2F0dHJpYnV0ZS1zZWxlY3RvcnMnO1xuaW1wb3J0IHtmaW5kQWxsU3Vic3RyaW5nSW5kaWNlc30gZnJvbSAnLi4vdHlwZXNjcmlwdC9saXRlcmFsJztcbmltcG9ydCB7Z2V0VmVyc2lvblVwZ3JhZGVEYXRhLCBVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IHN0cmluZyBsaXRlcmFsLCB0ZW1wbGF0ZSBhbmQgc3R5bGVzaGVldFxuICogaW4gb3JkZXIgdG8gc3dpdGNoIGRlcHJlY2F0ZWQgYXR0cmlidXRlIHNlbGVjdG9ycyB0byB0aGUgdXBkYXRlZCBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZVNlbGVjdG9yc01pZ3JhdGlvbiBleHRlbmRzIE1pZ3JhdGlvbjxVcGdyYWRlRGF0YT4ge1xuICAvKiogUmVxdWlyZWQgdXBncmFkZSBjaGFuZ2VzIGZvciBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGEgPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ2F0dHJpYnV0ZVNlbGVjdG9ycycpO1xuXG4gIC8vIE9ubHkgZW5hYmxlIHRoZSBtaWdyYXRpb24gcnVsZSBpZiB0aGVyZSBpcyB1cGdyYWRlIGRhdGEuXG4gIGVuYWJsZWQ6IGJvb2xlYW4gPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIG92ZXJyaWRlIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2Uobm9kZSkpIHtcbiAgICAgIHRoaXMuX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2Uobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSkge1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKHNlbGVjdG9yID0+IHtcbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHRlbXBsYXRlLmNvbnRlbnQsIHNlbGVjdG9yLnJlcGxhY2UpXG4gICAgICAgICAgLm1hcChvZmZzZXQgPT4gdGVtcGxhdGUuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKHRlbXBsYXRlLmZpbGVQYXRoLCBzdGFydCwgc2VsZWN0b3IpKTtcbiAgICB9KTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goc2VsZWN0b3IgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFNlbGVjdG9yID0gYFske3NlbGVjdG9yLnJlcGxhY2V9XWA7XG4gICAgICBjb25zdCB1cGRhdGVkU2VsZWN0b3IgPSBgWyR7c2VsZWN0b3IucmVwbGFjZVdpdGh9XWA7XG5cbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHN0eWxlc2hlZXQuY29udGVudCwgY3VycmVudFNlbGVjdG9yKVxuICAgICAgICAgIC5tYXAob2Zmc2V0ID0+IHN0eWxlc2hlZXQuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goXG4gICAgICAgICAgICAgIHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgIHN0eWxlc2hlZXQuZmlsZVBhdGgsIHN0YXJ0LFxuICAgICAgICAgICAgICAgICAge3JlcGxhY2U6IGN1cnJlbnRTZWxlY3RvciwgcmVwbGFjZVdpdGg6IHVwZGF0ZWRTZWxlY3Rvcn0pKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2UobGl0ZXJhbDogdHMuU3RyaW5nTGl0ZXJhbExpa2UpIHtcbiAgICBpZiAobGl0ZXJhbC5wYXJlbnQgJiYgbGl0ZXJhbC5wYXJlbnQua2luZCAhPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxpdGVyYWxUZXh0ID0gbGl0ZXJhbC5nZXRUZXh0KCk7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0aGlzLmZpbGVTeXN0ZW0ucmVzb2x2ZShsaXRlcmFsLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZSk7XG5cbiAgICB0aGlzLmRhdGEuZm9yRWFjaChzZWxlY3RvciA9PiB7XG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyhsaXRlcmFsVGV4dCwgc2VsZWN0b3IucmVwbGFjZSlcbiAgICAgICAgICAubWFwKG9mZnNldCA9PiBsaXRlcmFsLmdldFN0YXJ0KCkgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKGZpbGVQYXRoLCBzdGFydCwgc2VsZWN0b3IpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcGxhY2VTZWxlY3RvcihmaWxlUGF0aDogV29ya3NwYWNlUGF0aCwgc3RhcnQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IEF0dHJpYnV0ZVNlbGVjdG9yVXBncmFkZURhdGEpIHtcbiAgICB0aGlzLmZpbGVTeXN0ZW0uZWRpdChmaWxlUGF0aClcbiAgICAgIC5yZW1vdmUoc3RhcnQsIGRhdGEucmVwbGFjZS5sZW5ndGgpXG4gICAgICAuaW5zZXJ0UmlnaHQoc3RhcnQsIGRhdGEucmVwbGFjZVdpdGgpO1xuICB9XG59XG4iXX0=