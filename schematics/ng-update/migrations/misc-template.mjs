"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscTemplateMigration = void 0;
const migration_1 = require("../../update-tool/migration");
/**
 * Migration that walks through every template and reports if there are
 * instances of outdated Angular CDK API that can't be migrated automatically.
 */
class MiscTemplateMigration extends migration_1.Migration {
    // There are currently no migrations for V19 deprecations.
    enabled = false;
    visitTemplate(template) { }
}
exports.MiscTemplateMigration = MiscTemplateMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzYy10ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy9taXNjLXRlbXBsYXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILDJEQUFzRDtBQUd0RDs7O0dBR0c7QUFDSCxNQUFhLHFCQUFzQixTQUFRLHFCQUFzQjtJQUMvRCwwREFBMEQ7SUFDMUQsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUVQLGFBQWEsQ0FBQyxRQUEwQixJQUFTLENBQUM7Q0FDNUQ7QUFMRCxzREFLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7TWlncmF0aW9ufSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24nO1xuaW1wb3J0IHtVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCB3YWxrcyB0aHJvdWdoIGV2ZXJ5IHRlbXBsYXRlIGFuZCByZXBvcnRzIGlmIHRoZXJlIGFyZVxuICogaW5zdGFuY2VzIG9mIG91dGRhdGVkIEFuZ3VsYXIgQ0RLIEFQSSB0aGF0IGNhbid0IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBNaXNjVGVtcGxhdGVNaWdyYXRpb24gZXh0ZW5kcyBNaWdyYXRpb248VXBncmFkZURhdGE+IHtcbiAgLy8gVGhlcmUgYXJlIGN1cnJlbnRseSBubyBtaWdyYXRpb25zIGZvciBWMTkgZGVwcmVjYXRpb25zLlxuICBlbmFibGVkID0gZmFsc2U7XG5cbiAgb3ZlcnJpZGUgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge31cbn1cbiJdfQ==