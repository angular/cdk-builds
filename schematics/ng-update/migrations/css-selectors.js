"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssSelectorsMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const literal_1 = require("../typescript/literal");
const upgrade_data_1 = require("../upgrade-data");
/**
 * Migration that walks through every string literal, template and stylesheet in
 * order to migrate outdated CSS selectors to the new selector.
 */
class CssSelectorsMigration extends migration_1.Migration {
    /** Change data that upgrades to the specified target version. */
    data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'cssSelectors');
    // Only enable the migration rule if there is upgrade data.
    enabled = this.data.length !== 0;
    visitNode(node) {
        if (ts.isStringLiteralLike(node)) {
            this._visitStringLiteralLike(node);
        }
    }
    visitTemplate(template) {
        this.data.forEach(data => {
            if (data.replaceIn && !data.replaceIn.html) {
                return;
            }
            (0, literal_1.findAllSubstringIndices)(template.content, data.replace)
                .map(offset => template.start + offset)
                .forEach(start => this._replaceSelector(template.filePath, start, data));
        });
    }
    visitStylesheet(stylesheet) {
        this.data.forEach(data => {
            if (data.replaceIn && !data.replaceIn.stylesheet) {
                return;
            }
            (0, literal_1.findAllSubstringIndices)(stylesheet.content, data.replace)
                .map(offset => stylesheet.start + offset)
                .forEach(start => this._replaceSelector(stylesheet.filePath, start, data));
        });
    }
    _visitStringLiteralLike(node) {
        if (node.parent && node.parent.kind !== ts.SyntaxKind.CallExpression) {
            return;
        }
        const textContent = node.getText();
        const filePath = this.fileSystem.resolve(node.getSourceFile().fileName);
        this.data.forEach(data => {
            if (data.replaceIn && !data.replaceIn.tsStringLiterals) {
                return;
            }
            (0, literal_1.findAllSubstringIndices)(textContent, data.replace)
                .map(offset => node.getStart() + offset)
                .forEach(start => this._replaceSelector(filePath, start, data));
        });
    }
    _replaceSelector(filePath, start, data) {
        this.fileSystem
            .edit(filePath)
            .remove(start, data.replace.length)
            .insertRight(start, data.replaceWith);
    }
}
exports.CssSelectorsMigration = CssSelectorsMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLXNlbGVjdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy9jc3Mtc2VsZWN0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILGlDQUFpQztBQUdqQywyREFBc0Q7QUFFdEQsbURBQThEO0FBQzlELGtEQUFtRTtBQUVuRTs7O0dBR0c7QUFDSCxNQUFhLHFCQUFzQixTQUFRLHFCQUFzQjtJQUMvRCxpRUFBaUU7SUFDakUsSUFBSSxHQUE2QixJQUFBLG9DQUFxQixFQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUU3RSwyREFBMkQ7SUFDM0QsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztJQUV4QixTQUFTLENBQUMsSUFBYTtRQUM5QixJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO0lBQ0gsQ0FBQztJQUVRLGFBQWEsQ0FBQyxRQUEwQjtRQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMzQyxPQUFPO1lBQ1QsQ0FBQztZQUVELElBQUEsaUNBQXVCLEVBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDO2lCQUNwRCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztpQkFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRVEsZUFBZSxDQUFDLFVBQTRCO1FBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pELE9BQU87WUFDVCxDQUFDO1lBRUQsSUFBQSxpQ0FBdUIsRUFBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7aUJBQ3RELEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO2lCQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyx1QkFBdUIsQ0FBQyxJQUEwQjtRQUN4RCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNyRSxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFeEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN2RCxPQUFPO1lBQ1QsQ0FBQztZQUVELElBQUEsaUNBQXVCLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7aUJBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUM7aUJBQ3ZDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sZ0JBQWdCLENBQUMsUUFBdUIsRUFBRSxLQUFhLEVBQUUsSUFBNEI7UUFDM0YsSUFBSSxDQUFDLFVBQVU7YUFDWixJQUFJLENBQUMsUUFBUSxDQUFDO2FBQ2QsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQzthQUNsQyxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUE5REQsc0RBOERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7V29ya3NwYWNlUGF0aH0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtDc3NTZWxlY3RvclVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhL2Nzcy1zZWxlY3RvcnMnO1xuaW1wb3J0IHtmaW5kQWxsU3Vic3RyaW5nSW5kaWNlc30gZnJvbSAnLi4vdHlwZXNjcmlwdC9saXRlcmFsJztcbmltcG9ydCB7Z2V0VmVyc2lvblVwZ3JhZGVEYXRhLCBVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IHN0cmluZyBsaXRlcmFsLCB0ZW1wbGF0ZSBhbmQgc3R5bGVzaGVldCBpblxuICogb3JkZXIgdG8gbWlncmF0ZSBvdXRkYXRlZCBDU1Mgc2VsZWN0b3JzIHRvIHRoZSBuZXcgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBjbGFzcyBDc3NTZWxlY3RvcnNNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcbiAgLyoqIENoYW5nZSBkYXRhIHRoYXQgdXBncmFkZXMgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi4gKi9cbiAgZGF0YTogQ3NzU2VsZWN0b3JVcGdyYWRlRGF0YVtdID0gZ2V0VmVyc2lvblVwZ3JhZGVEYXRhKHRoaXMsICdjc3NTZWxlY3RvcnMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBlbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICBvdmVycmlkZSB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKG5vZGUpKSB7XG4gICAgICB0aGlzLl92aXNpdFN0cmluZ0xpdGVyYWxMaWtlKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChkYXRhID0+IHtcbiAgICAgIGlmIChkYXRhLnJlcGxhY2VJbiAmJiAhZGF0YS5yZXBsYWNlSW4uaHRtbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHRlbXBsYXRlLmNvbnRlbnQsIGRhdGEucmVwbGFjZSlcbiAgICAgICAgLm1hcChvZmZzZXQgPT4gdGVtcGxhdGUuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgIC5mb3JFYWNoKHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VTZWxlY3Rvcih0ZW1wbGF0ZS5maWxlUGF0aCwgc3RhcnQsIGRhdGEpKTtcbiAgICB9KTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goZGF0YSA9PiB7XG4gICAgICBpZiAoZGF0YS5yZXBsYWNlSW4gJiYgIWRhdGEucmVwbGFjZUluLnN0eWxlc2hlZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyhzdHlsZXNoZWV0LmNvbnRlbnQsIGRhdGEucmVwbGFjZSlcbiAgICAgICAgLm1hcChvZmZzZXQgPT4gc3R5bGVzaGVldC5zdGFydCArIG9mZnNldClcbiAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKHN0eWxlc2hlZXQuZmlsZVBhdGgsIHN0YXJ0LCBkYXRhKSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF92aXNpdFN0cmluZ0xpdGVyYWxMaWtlKG5vZGU6IHRzLlN0cmluZ0xpdGVyYWxMaWtlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50LmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0Q29udGVudCA9IG5vZGUuZ2V0VGV4dCgpO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGhpcy5maWxlU3lzdGVtLnJlc29sdmUobm9kZS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWUpO1xuXG4gICAgdGhpcy5kYXRhLmZvckVhY2goZGF0YSA9PiB7XG4gICAgICBpZiAoZGF0YS5yZXBsYWNlSW4gJiYgIWRhdGEucmVwbGFjZUluLnRzU3RyaW5nTGl0ZXJhbHMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyh0ZXh0Q29udGVudCwgZGF0YS5yZXBsYWNlKVxuICAgICAgICAubWFwKG9mZnNldCA9PiBub2RlLmdldFN0YXJ0KCkgKyBvZmZzZXQpXG4gICAgICAgIC5mb3JFYWNoKHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VTZWxlY3RvcihmaWxlUGF0aCwgc3RhcnQsIGRhdGEpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcGxhY2VTZWxlY3RvcihmaWxlUGF0aDogV29ya3NwYWNlUGF0aCwgc3RhcnQ6IG51bWJlciwgZGF0YTogQ3NzU2VsZWN0b3JVcGdyYWRlRGF0YSkge1xuICAgIHRoaXMuZmlsZVN5c3RlbVxuICAgICAgLmVkaXQoZmlsZVBhdGgpXG4gICAgICAucmVtb3ZlKHN0YXJ0LCBkYXRhLnJlcGxhY2UubGVuZ3RoKVxuICAgICAgLmluc2VydFJpZ2h0KHN0YXJ0LCBkYXRhLnJlcGxhY2VXaXRoKTtcbiAgfVxufVxuIl19