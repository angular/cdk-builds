"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateToV20 = updateToV20;
const target_version_1 = require("../update-tool/target-version");
const upgrade_data_1 = require("./upgrade-data");
const devkit_migration_rule_1 = require("./devkit-migration-rule");
const cdkMigrations = [];
/** Entry point for the migration schematics with target of Angular CDK 20.0.0 */
function updateToV20() {
    return (0, devkit_migration_rule_1.createMigrationSchematicRule)(target_version_1.TargetVersion.V20, cdkMigrations, upgrade_data_1.cdkUpgradeData, onMigrationComplete);
}
/** Function that will be called when the migration completed. */
function onMigrationComplete(context, targetVersion, hasFailures) {
    context.logger.info('');
    context.logger.info(`  ✓  Updated Angular CDK to ${targetVersion}`);
    context.logger.info('');
    if (hasFailures) {
        context.logger.warn('  ⚠  Some issues were detected but could not be fixed automatically. Please check the ' +
            'output above and fix these issues manually.');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBVUgsa0NBT0M7QUFkRCxrRUFBNEQ7QUFDNUQsaURBQThDO0FBQzlDLG1FQUE4RjtBQUU5RixNQUFNLGFBQWEsR0FBOEIsRUFBRSxDQUFDO0FBRXBELGlGQUFpRjtBQUNqRixTQUFnQixXQUFXO0lBQ3pCLE9BQU8sSUFBQSxvREFBNEIsRUFDakMsOEJBQWEsQ0FBQyxHQUFHLEVBQ2pCLGFBQWEsRUFDYiw2QkFBYyxFQUNkLG1CQUFtQixDQUNwQixDQUFDO0FBQ0osQ0FBQztBQUVELGlFQUFpRTtBQUNqRSxTQUFTLG1CQUFtQixDQUMxQixPQUF5QixFQUN6QixhQUE0QixFQUM1QixXQUFvQjtJQUVwQixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN4QixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywrQkFBK0IsYUFBYSxFQUFFLENBQUMsQ0FBQztJQUNwRSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUV4QixJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNqQix3RkFBd0Y7WUFDdEYsNkNBQTZDLENBQ2hELENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0fSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4uL3VwZGF0ZS10b29sL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7Y2RrVXBncmFkZURhdGF9IGZyb20gJy4vdXBncmFkZS1kYXRhJztcbmltcG9ydCB7Y3JlYXRlTWlncmF0aW9uU2NoZW1hdGljUnVsZSwgTnVsbGFibGVEZXZraXRNaWdyYXRpb259IGZyb20gJy4vZGV2a2l0LW1pZ3JhdGlvbi1ydWxlJztcblxuY29uc3QgY2RrTWlncmF0aW9uczogTnVsbGFibGVEZXZraXRNaWdyYXRpb25bXSA9IFtdO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBtaWdyYXRpb24gc2NoZW1hdGljcyB3aXRoIHRhcmdldCBvZiBBbmd1bGFyIENESyAyMC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVUb1YyMCgpOiBSdWxlIHtcbiAgcmV0dXJuIGNyZWF0ZU1pZ3JhdGlvblNjaGVtYXRpY1J1bGUoXG4gICAgVGFyZ2V0VmVyc2lvbi5WMjAsXG4gICAgY2RrTWlncmF0aW9ucyxcbiAgICBjZGtVcGdyYWRlRGF0YSxcbiAgICBvbk1pZ3JhdGlvbkNvbXBsZXRlLFxuICApO1xufVxuXG4vKiogRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBtaWdyYXRpb24gY29tcGxldGVkLiAqL1xuZnVuY3Rpb24gb25NaWdyYXRpb25Db21wbGV0ZShcbiAgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCxcbiAgdGFyZ2V0VmVyc2lvbjogVGFyZ2V0VmVyc2lvbixcbiAgaGFzRmFpbHVyZXM6IGJvb2xlYW4sXG4pIHtcbiAgY29udGV4dC5sb2dnZXIuaW5mbygnJyk7XG4gIGNvbnRleHQubG9nZ2VyLmluZm8oYCAg4pyTICBVcGRhdGVkIEFuZ3VsYXIgQ0RLIHRvICR7dGFyZ2V0VmVyc2lvbn1gKTtcbiAgY29udGV4dC5sb2dnZXIuaW5mbygnJyk7XG5cbiAgaWYgKGhhc0ZhaWx1cmVzKSB7XG4gICAgY29udGV4dC5sb2dnZXIud2FybihcbiAgICAgICcgIOKaoCAgU29tZSBpc3N1ZXMgd2VyZSBkZXRlY3RlZCBidXQgY291bGQgbm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSBjaGVjayB0aGUgJyArXG4gICAgICAgICdvdXRwdXQgYWJvdmUgYW5kIGZpeCB0aGVzZSBpc3N1ZXMgbWFudWFsbHkuJyxcbiAgICApO1xuICB9XG59XG4iXX0=