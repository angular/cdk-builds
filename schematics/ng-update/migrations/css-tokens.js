"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssTokensMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const literal_1 = require("../typescript/literal");
const upgrade_data_1 = require("../upgrade-data");
/** Characters that can be part of a valid token name. */
const TOKEN_CHARACTER = /[-_a-z0-9]/i;
/**
 * Migration that walks through every string literal, template and stylesheet in
 * order to migrate outdated CSS tokens to their new name.
 */
class CssTokensMigration extends migration_1.Migration {
    /** Change data that upgrades to the specified target version. */
    data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'cssTokens');
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
                // Filter out matches that are followed by a valid token character, so that we don't match
                // partial token names.
                .filter(start => !TOKEN_CHARACTER.test(template.content[start + data.replace.length] || ''))
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
                // Filter out matches that are followed by a valid token character, so that we don't match
                // partial token names.
                .filter(start => !TOKEN_CHARACTER.test(stylesheet.content[start + data.replace.length] || ''))
                .forEach(start => this._replaceSelector(stylesheet.filePath, start, data));
        });
    }
    _visitStringLiteralLike(node) {
        const textContent = node.getText();
        const filePath = this.fileSystem.resolve(node.getSourceFile().fileName);
        this.data.forEach(data => {
            if (data.replaceIn && !data.replaceIn.tsStringLiterals) {
                return;
            }
            (0, literal_1.findAllSubstringIndices)(textContent, data.replace)
                .map(offset => node.getStart() + offset)
                // Filter out matches that are followed by a valid token character, so that we don't match
                // partial token names.
                .filter(start => !TOKEN_CHARACTER.test(textContent[start + data.replace.length] || ''))
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
exports.CssTokensMigration = CssTokensMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLXRva2Vucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy9jc3MtdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILGlDQUFpQztBQUdqQywyREFBc0Q7QUFFdEQsbURBQThEO0FBQzlELGtEQUFtRTtBQUVuRSx5REFBeUQ7QUFDekQsTUFBTSxlQUFlLEdBQUcsYUFBYSxDQUFDO0FBRXRDOzs7R0FHRztBQUNILE1BQWEsa0JBQW1CLFNBQVEscUJBQXNCO0lBQzVELGlFQUFpRTtJQUNqRSxJQUFJLEdBQTBCLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRXZFLDJEQUEyRDtJQUMzRCxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO0lBRXhCLFNBQVMsQ0FBQyxJQUFhO1FBQzlCLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7SUFDSCxDQUFDO0lBRVEsYUFBYSxDQUFDLFFBQTBCO1FBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzNDLE9BQU87WUFDVCxDQUFDO1lBRUQsSUFBQSxpQ0FBdUIsRUFBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7aUJBQ3BELEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO2dCQUN2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SUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FDRjtBQXJFRCxnREFxRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7V29ya3NwYWNlUGF0aH0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvZmlsZS1zeXN0ZW0nO1xuaW1wb3J0IHtNaWdyYXRpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5pbXBvcnQge0Nzc1Rva2VuVXBncmFkZURhdGF9IGZyb20gJy4uL2RhdGEvY3NzLXRva2Vucyc7XG5pbXBvcnQge2ZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzfSBmcm9tICcuLi90eXBlc2NyaXB0L2xpdGVyYWwnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKiogQ2hhcmFjdGVycyB0aGF0IGNhbiBiZSBwYXJ0IG9mIGEgdmFsaWQgdG9rZW4gbmFtZS4gKi9cbmNvbnN0IFRPS0VOX0NIQVJBQ1RFUiA9IC9bLV9hLXowLTldL2k7XG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgd2Fsa3MgdGhyb3VnaCBldmVyeSBzdHJpbmcgbGl0ZXJhbCwgdGVtcGxhdGUgYW5kIHN0eWxlc2hlZXQgaW5cbiAqIG9yZGVyIHRvIG1pZ3JhdGUgb3V0ZGF0ZWQgQ1NTIHRva2VucyB0byB0aGVpciBuZXcgbmFtZS5cbiAqL1xuZXhwb3J0IGNsYXNzIENzc1Rva2Vuc01pZ3JhdGlvbiBleHRlbmRzIE1pZ3JhdGlvbjxVcGdyYWRlRGF0YT4ge1xuICAvKiogQ2hhbmdlIGRhdGEgdGhhdCB1cGdyYWRlcyB0byB0aGUgc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLiAqL1xuICBkYXRhOiBDc3NUb2tlblVwZ3JhZGVEYXRhW10gPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ2Nzc1Rva2VucycpO1xuXG4gIC8vIE9ubHkgZW5hYmxlIHRoZSBtaWdyYXRpb24gcnVsZSBpZiB0aGVyZSBpcyB1cGdyYWRlIGRhdGEuXG4gIGVuYWJsZWQgPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIG92ZXJyaWRlIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKTogdm9pZCB7XG4gICAgaWYgKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2Uobm9kZSkpIHtcbiAgICAgIHRoaXMuX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2Uobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKGRhdGEgPT4ge1xuICAgICAgaWYgKGRhdGEucmVwbGFjZUluICYmICFkYXRhLnJlcGxhY2VJbi5odG1sKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZmluZEFsbFN1YnN0cmluZ0luZGljZXModGVtcGxhdGUuY29udGVudCwgZGF0YS5yZXBsYWNlKVxuICAgICAgICAubWFwKG9mZnNldCA9PiB0ZW1wbGF0ZS5zdGFydCArIG9mZnNldClcbiAgICAgICAgLy8gRmlsdGVyIG91dCBtYXRjaGVzIHRoYXQgYXJlIGZvbGxvd2VkIGJ5IGEgdmFsaWQgdG9rZW4gY2hhcmFjdGVyLCBzbyB0aGF0IHdlIGRvbid0IG1hdGNoXG4gICAgICAgIC8vIHBhcnRpYWwgdG9rZW4gbmFtZXMuXG4gICAgICAgIC5maWx0ZXIoc3RhcnQgPT4gIVRPS0VOX0NIQVJBQ1RFUi50ZXN0KHRlbXBsYXRlLmNvbnRlbnRbc3RhcnQgKyBkYXRhLnJlcGxhY2UubGVuZ3RoXSB8fCAnJykpXG4gICAgICAgIC5mb3JFYWNoKHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VTZWxlY3Rvcih0ZW1wbGF0ZS5maWxlUGF0aCwgc3RhcnQsIGRhdGEpKTtcbiAgICB9KTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goZGF0YSA9PiB7XG4gICAgICBpZiAoZGF0YS5yZXBsYWNlSW4gJiYgIWRhdGEucmVwbGFjZUluLnN0eWxlc2hlZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyhzdHlsZXNoZWV0LmNvbnRlbnQsIGRhdGEucmVwbGFjZSlcbiAgICAgICAgLm1hcChvZmZzZXQgPT4gc3R5bGVzaGVldC5zdGFydCArIG9mZnNldClcbiAgICAgICAgLy8gRmlsdGVyIG91dCBtYXRjaGVzIHRoYXQgYXJlIGZvbGxvd2VkIGJ5IGEgdmFsaWQgdG9rZW4gY2hhcmFjdGVyLCBzbyB0aGF0IHdlIGRvbid0IG1hdGNoXG4gICAgICAgIC8vIHBhcnRpYWwgdG9rZW4gbmFtZXMuXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgc3RhcnQgPT4gIVRPS0VOX0NIQVJBQ1RFUi50ZXN0KHN0eWxlc2hlZXQuY29udGVudFtzdGFydCArIGRhdGEucmVwbGFjZS5sZW5ndGhdIHx8ICcnKSxcbiAgICAgICAgKVxuICAgICAgICAuZm9yRWFjaChzdGFydCA9PiB0aGlzLl9yZXBsYWNlU2VsZWN0b3Ioc3R5bGVzaGVldC5maWxlUGF0aCwgc3RhcnQsIGRhdGEpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2Uobm9kZTogdHMuU3RyaW5nTGl0ZXJhbExpa2UpIHtcbiAgICBjb25zdCB0ZXh0Q29udGVudCA9IG5vZGUuZ2V0VGV4dCgpO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGhpcy5maWxlU3lzdGVtLnJlc29sdmUobm9kZS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWUpO1xuXG4gICAgdGhpcy5kYXRhLmZvckVhY2goZGF0YSA9PiB7XG4gICAgICBpZiAoZGF0YS5yZXBsYWNlSW4gJiYgIWRhdGEucmVwbGFjZUluLnRzU3RyaW5nTGl0ZXJhbHMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyh0ZXh0Q29udGVudCwgZGF0YS5yZXBsYWNlKVxuICAgICAgICAubWFwKG9mZnNldCA9PiBub2RlLmdldFN0YXJ0KCkgKyBvZmZzZXQpXG4gICAgICAgIC8vIEZpbHRlciBvdXQgbWF0Y2hlcyB0aGF0IGFyZSBmb2xsb3dlZCBieSBhIHZhbGlkIHRva2VuIGNoYXJhY3Rlciwgc28gdGhhdCB3ZSBkb24ndCBtYXRjaFxuICAgICAgICAvLyBwYXJ0aWFsIHRva2VuIG5hbWVzLlxuICAgICAgICAuZmlsdGVyKHN0YXJ0ID0+ICFUT0tFTl9DSEFSQUNURVIudGVzdCh0ZXh0Q29udGVudFtzdGFydCArIGRhdGEucmVwbGFjZS5sZW5ndGhdIHx8ICcnKSlcbiAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKGZpbGVQYXRoLCBzdGFydCwgZGF0YSkpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVwbGFjZVNlbGVjdG9yKGZpbGVQYXRoOiBXb3Jrc3BhY2VQYXRoLCBzdGFydDogbnVtYmVyLCBkYXRhOiBDc3NUb2tlblVwZ3JhZGVEYXRhKSB7XG4gICAgdGhpcy5maWxlU3lzdGVtXG4gICAgICAuZWRpdChmaWxlUGF0aClcbiAgICAgIC5yZW1vdmUoc3RhcnQsIGRhdGEucmVwbGFjZS5sZW5ndGgpXG4gICAgICAuaW5zZXJ0UmlnaHQoc3RhcnQsIGRhdGEucmVwbGFjZVdpdGgpO1xuICB9XG59XG4iXX0=