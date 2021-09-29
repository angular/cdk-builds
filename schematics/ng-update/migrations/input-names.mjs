"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputNamesMigration = void 0;
const angular_1 = require("../html-parsing/angular");
const migration_1 = require("../../update-tool/migration");
const literal_1 = require("../typescript/literal");
const upgrade_data_1 = require("../upgrade-data");
/**
 * Migration that walks through every template or stylesheet and replaces outdated input
 * names to the new input name. Selectors in stylesheets could also target input
 * bindings declared as static attribute. See for example:
 *
 * e.g. `<my-component color="primary">` becomes `my-component[color]`
 */
class InputNamesMigration extends migration_1.Migration {
    constructor() {
        super(...arguments);
        /** Change data that upgrades to the specified target version. */
        this.data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'inputNames');
        // Only enable the migration rule if there is upgrade data.
        this.enabled = this.data.length !== 0;
    }
    visitStylesheet(stylesheet) {
        this.data.forEach(name => {
            const currentSelector = `[${name.replace}]`;
            const updatedSelector = `[${name.replaceWith}]`;
            (0, literal_1.findAllSubstringIndices)(stylesheet.content, currentSelector)
                .map(offset => stylesheet.start + offset)
                .forEach(start => this._replaceInputName(stylesheet.filePath, start, currentSelector.length, updatedSelector));
        });
    }
    visitTemplate(template) {
        this.data.forEach(name => {
            const limitedTo = name.limitedTo;
            const relativeOffsets = [];
            if (limitedTo.attributes) {
                relativeOffsets.push(...(0, angular_1.findInputsOnElementWithAttr)(template.content, name.replace, limitedTo.attributes));
            }
            if (limitedTo.elements) {
                relativeOffsets.push(...(0, angular_1.findInputsOnElementWithTag)(template.content, name.replace, limitedTo.elements));
            }
            relativeOffsets.map(offset => template.start + offset)
                .forEach(start => this._replaceInputName(template.filePath, start, name.replace.length, name.replaceWith));
        });
    }
    _replaceInputName(filePath, start, width, newName) {
        this.fileSystem.edit(filePath)
            .remove(start, width)
            .insertRight(start, newName);
    }
}
exports.InputNamesMigration = InputNamesMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtbmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL21pZ3JhdGlvbnMvaW5wdXQtbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBR0gscURBQWdHO0FBRWhHLDJEQUFzRDtBQUd0RCxtREFBOEQ7QUFDOUQsa0RBQW1FO0FBRW5FOzs7Ozs7R0FNRztBQUNILE1BQWEsbUJBQW9CLFNBQVEscUJBQXNCO0lBQS9EOztRQUNFLGlFQUFpRTtRQUNqRSxTQUFJLEdBQTJCLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXpFLDJEQUEyRDtRQUMzRCxZQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO0lBMkNuQyxDQUFDO0lBekNVLGVBQWUsQ0FBQyxVQUE0QjtRQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixNQUFNLGVBQWUsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQztZQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQztZQUVoRCxJQUFBLGlDQUF1QixFQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDO2lCQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztpQkFDeEMsT0FBTyxDQUNKLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUMzQixVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRVEsYUFBYSxDQUFDLFFBQTBCO1FBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDakMsTUFBTSxlQUFlLEdBQWEsRUFBRSxDQUFDO1lBRXJDLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtnQkFDeEIsZUFBZSxDQUFDLElBQUksQ0FDaEIsR0FBRyxJQUFBLHFDQUEyQixFQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzthQUMzRjtZQUVELElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRTtnQkFDdEIsZUFBZSxDQUFDLElBQUksQ0FDaEIsR0FBRyxJQUFBLG9DQUEwQixFQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUN4RjtZQUVELGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztpQkFDakQsT0FBTyxDQUNKLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUMzQixRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNoRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxRQUF1QixFQUFFLEtBQWEsRUFBRSxLQUFhLEVBQ3JELE9BQWU7UUFDdkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2FBQzNCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3BCLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBaERELGtEQWdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1dvcmtzcGFjZVBhdGh9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL2ZpbGUtc3lzdGVtJztcbmltcG9ydCB7ZmluZElucHV0c09uRWxlbWVudFdpdGhBdHRyLCBmaW5kSW5wdXRzT25FbGVtZW50V2l0aFRhZ30gZnJvbSAnLi4vaHRtbC1wYXJzaW5nL2FuZ3VsYXInO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuXG5pbXBvcnQge0lucHV0TmFtZVVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhJztcbmltcG9ydCB7ZmluZEFsbFN1YnN0cmluZ0luZGljZXN9IGZyb20gJy4uL3R5cGVzY3JpcHQvbGl0ZXJhbCc7XG5pbXBvcnQge2dldFZlcnNpb25VcGdyYWRlRGF0YSwgVXBncmFkZURhdGF9IGZyb20gJy4uL3VwZ3JhZGUtZGF0YSc7XG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgd2Fsa3MgdGhyb3VnaCBldmVyeSB0ZW1wbGF0ZSBvciBzdHlsZXNoZWV0IGFuZCByZXBsYWNlcyBvdXRkYXRlZCBpbnB1dFxuICogbmFtZXMgdG8gdGhlIG5ldyBpbnB1dCBuYW1lLiBTZWxlY3RvcnMgaW4gc3R5bGVzaGVldHMgY291bGQgYWxzbyB0YXJnZXQgaW5wdXRcbiAqIGJpbmRpbmdzIGRlY2xhcmVkIGFzIHN0YXRpYyBhdHRyaWJ1dGUuIFNlZSBmb3IgZXhhbXBsZTpcbiAqXG4gKiBlLmcuIGA8bXktY29tcG9uZW50IGNvbG9yPVwicHJpbWFyeVwiPmAgYmVjb21lcyBgbXktY29tcG9uZW50W2NvbG9yXWBcbiAqL1xuZXhwb3J0IGNsYXNzIElucHV0TmFtZXNNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcbiAgLyoqIENoYW5nZSBkYXRhIHRoYXQgdXBncmFkZXMgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi4gKi9cbiAgZGF0YTogSW5wdXROYW1lVXBncmFkZURhdGFbXSA9IGdldFZlcnNpb25VcGdyYWRlRGF0YSh0aGlzLCAnaW5wdXROYW1lcycpO1xuXG4gIC8vIE9ubHkgZW5hYmxlIHRoZSBtaWdyYXRpb24gcnVsZSBpZiB0aGVyZSBpcyB1cGdyYWRlIGRhdGEuXG4gIGVuYWJsZWQgPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIG92ZXJyaWRlIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50U2VsZWN0b3IgPSBgWyR7bmFtZS5yZXBsYWNlfV1gO1xuICAgICAgY29uc3QgdXBkYXRlZFNlbGVjdG9yID0gYFske25hbWUucmVwbGFjZVdpdGh9XWA7XG5cbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHN0eWxlc2hlZXQuY29udGVudCwgY3VycmVudFNlbGVjdG9yKVxuICAgICAgICAgIC5tYXAob2Zmc2V0ID0+IHN0eWxlc2hlZXQuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goXG4gICAgICAgICAgICAgIHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VJbnB1dE5hbWUoXG4gICAgICAgICAgICAgICAgICBzdHlsZXNoZWV0LmZpbGVQYXRoLCBzdGFydCwgY3VycmVudFNlbGVjdG9yLmxlbmd0aCwgdXBkYXRlZFNlbGVjdG9yKSk7XG4gICAgfSk7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICBjb25zdCBsaW1pdGVkVG8gPSBuYW1lLmxpbWl0ZWRUbztcbiAgICAgIGNvbnN0IHJlbGF0aXZlT2Zmc2V0czogbnVtYmVyW10gPSBbXTtcblxuICAgICAgaWYgKGxpbWl0ZWRUby5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJlbGF0aXZlT2Zmc2V0cy5wdXNoKFxuICAgICAgICAgICAgLi4uZmluZElucHV0c09uRWxlbWVudFdpdGhBdHRyKHRlbXBsYXRlLmNvbnRlbnQsIG5hbWUucmVwbGFjZSwgbGltaXRlZFRvLmF0dHJpYnV0ZXMpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpbWl0ZWRUby5lbGVtZW50cykge1xuICAgICAgICByZWxhdGl2ZU9mZnNldHMucHVzaChcbiAgICAgICAgICAgIC4uLmZpbmRJbnB1dHNPbkVsZW1lbnRXaXRoVGFnKHRlbXBsYXRlLmNvbnRlbnQsIG5hbWUucmVwbGFjZSwgbGltaXRlZFRvLmVsZW1lbnRzKSk7XG4gICAgICB9XG5cbiAgICAgIHJlbGF0aXZlT2Zmc2V0cy5tYXAob2Zmc2V0ID0+IHRlbXBsYXRlLnN0YXJ0ICsgb2Zmc2V0KVxuICAgICAgICAgIC5mb3JFYWNoKFxuICAgICAgICAgICAgICBzdGFydCA9PiB0aGlzLl9yZXBsYWNlSW5wdXROYW1lKFxuICAgICAgICAgICAgICAgICAgdGVtcGxhdGUuZmlsZVBhdGgsIHN0YXJ0LCBuYW1lLnJlcGxhY2UubGVuZ3RoLCBuYW1lLnJlcGxhY2VXaXRoKSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9yZXBsYWNlSW5wdXROYW1lKGZpbGVQYXRoOiBXb3Jrc3BhY2VQYXRoLCBzdGFydDogbnVtYmVyLCB3aWR0aDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld05hbWU6IHN0cmluZykge1xuICAgIHRoaXMuZmlsZVN5c3RlbS5lZGl0KGZpbGVQYXRoKVxuICAgICAgLnJlbW92ZShzdGFydCwgd2lkdGgpXG4gICAgICAuaW5zZXJ0UmlnaHQoc3RhcnQsIG5ld05hbWUpO1xuICB9XG59XG4iXX0=