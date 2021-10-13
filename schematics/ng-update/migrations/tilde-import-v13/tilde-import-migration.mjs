"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TildeImportMigration = void 0;
const core_1 = require("@angular-devkit/core");
const target_version_1 = require("../../../update-tool/target-version");
const devkit_migration_1 = require("../../devkit-migration");
/** Migration that removes tilde symbols from imports. */
class TildeImportMigration extends devkit_migration_1.DevkitMigration {
    constructor() {
        super(...arguments);
        this.enabled = this.targetVersion === target_version_1.TargetVersion.V13;
    }
    visitStylesheet(stylesheet) {
        const extension = (0, core_1.extname)(stylesheet.filePath);
        if (extension === '.scss' || extension === '.css') {
            const content = stylesheet.content;
            const migratedContent = content.replace(/@(?:import|use) +['"]~@angular\/.*['"].*;?/g, (match) => {
                const index = match.indexOf('~@angular');
                return match.slice(0, index) + match.slice(index + 1);
            });
            if (migratedContent && migratedContent !== content) {
                this.fileSystem.edit(stylesheet.filePath)
                    .remove(0, stylesheet.content.length)
                    .insertLeft(0, migratedContent);
            }
        }
    }
}
exports.TildeImportMigration = TildeImportMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGlsZGUtaW1wb3J0LW1pZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy90aWxkZS1pbXBvcnQtdjEzL3RpbGRlLWltcG9ydC1taWdyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQTZDO0FBRTdDLHdFQUFrRTtBQUNsRSw2REFBdUQ7QUFFdkQseURBQXlEO0FBQ3pELE1BQWEsb0JBQXFCLFNBQVEsa0NBQXFCO0lBQS9EOztRQUNFLFlBQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxLQUFLLDhCQUFhLENBQUMsR0FBRyxDQUFDO0lBb0JyRCxDQUFDO0lBbEJVLGVBQWUsQ0FBQyxVQUE0QjtRQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFBLGNBQU8sRUFBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFL0MsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFJLFNBQVMsS0FBSyxNQUFNLEVBQUU7WUFDakQsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQztZQUNuQyxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLDZDQUE2QyxFQUNuRixDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNSLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLENBQUM7WUFFTCxJQUFJLGVBQWUsSUFBSSxlQUFlLEtBQUssT0FBTyxFQUFFO2dCQUNsRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO3FCQUN0QyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO3FCQUNwQyxVQUFVLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2FBQ25DO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUFyQkQsb0RBcUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ZXh0bmFtZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7VGFyZ2V0VmVyc2lvbn0gZnJvbSAnLi4vLi4vLi4vdXBkYXRlLXRvb2wvdGFyZ2V0LXZlcnNpb24nO1xuaW1wb3J0IHtEZXZraXRNaWdyYXRpb259IGZyb20gJy4uLy4uL2RldmtpdC1taWdyYXRpb24nO1xuXG4vKiogTWlncmF0aW9uIHRoYXQgcmVtb3ZlcyB0aWxkZSBzeW1ib2xzIGZyb20gaW1wb3J0cy4gKi9cbmV4cG9ydCBjbGFzcyBUaWxkZUltcG9ydE1pZ3JhdGlvbiBleHRlbmRzIERldmtpdE1pZ3JhdGlvbjxudWxsPiB7XG4gIGVuYWJsZWQgPSB0aGlzLnRhcmdldFZlcnNpb24gPT09IFRhcmdldFZlcnNpb24uVjEzO1xuXG4gIG92ZXJyaWRlIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZXh0bmFtZShzdHlsZXNoZWV0LmZpbGVQYXRoKTtcblxuICAgIGlmIChleHRlbnNpb24gPT09ICcuc2NzcycgfHwgZXh0ZW5zaW9uID09PSAnLmNzcycpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBzdHlsZXNoZWV0LmNvbnRlbnQ7XG4gICAgICBjb25zdCBtaWdyYXRlZENvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL0AoPzppbXBvcnR8dXNlKSArWydcIl1+QGFuZ3VsYXJcXC8uKlsnXCJdLio7Py9nLFxuICAgICAgICAobWF0Y2gpID0+IHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IG1hdGNoLmluZGV4T2YoJ35AYW5ndWxhcicpO1xuICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCBpbmRleCkgKyBtYXRjaC5zbGljZShpbmRleCArIDEpO1xuICAgICAgICB9KTtcblxuICAgICAgaWYgKG1pZ3JhdGVkQ29udGVudCAmJiBtaWdyYXRlZENvbnRlbnQgIT09IGNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5maWxlU3lzdGVtLmVkaXQoc3R5bGVzaGVldC5maWxlUGF0aClcbiAgICAgICAgICAucmVtb3ZlKDAsIHN0eWxlc2hlZXQuY29udGVudC5sZW5ndGgpXG4gICAgICAgICAgLmluc2VydExlZnQoMCwgbWlncmF0ZWRDb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==