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
        define("@angular/cdk/schematics/ng-update/migrations/css-selectors", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration", "@angular/cdk/schematics/ng-update/typescript/literal", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_1 = require("@angular/cdk/schematics/update-tool/migration");
    const literal_1 = require("@angular/cdk/schematics/ng-update/typescript/literal");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Migration that walks through every string literal, template and stylesheet in
     * order to migrate outdated CSS selectors to the new selector.
     */
    class CssSelectorsMigration extends migration_1.Migration {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'cssSelectors');
            // Only enable the migration rule if there is upgrade data.
            this.enabled = this.data.length !== 0;
        }
        visitNode(node) {
            if (ts.isStringLiteralLike(node)) {
                this._visitStringLiteralLike(node);
            }
        }
        visitTemplate(template) {
            this.data.forEach(data => {
                if (data.whitelist && !data.whitelist.html) {
                    return;
                }
                literal_1.findAllSubstringIndices(template.content, data.replace)
                    .map(offset => template.start + offset)
                    .forEach(start => this._replaceSelector(template.filePath, start, data));
            });
        }
        visitStylesheet(stylesheet) {
            this.data.forEach(data => {
                if (data.whitelist && !data.whitelist.stylesheet) {
                    return;
                }
                literal_1.findAllSubstringIndices(stylesheet.content, data.replace)
                    .map(offset => stylesheet.start + offset)
                    .forEach(start => this._replaceSelector(stylesheet.filePath, start, data));
            });
        }
        _visitStringLiteralLike(node) {
            if (node.parent && node.parent.kind !== ts.SyntaxKind.CallExpression) {
                return;
            }
            const textContent = node.getText();
            const filePath = node.getSourceFile().fileName;
            this.data.forEach(data => {
                if (data.whitelist && !data.whitelist.strings) {
                    return;
                }
                literal_1.findAllSubstringIndices(textContent, data.replace)
                    .map(offset => node.getStart() + offset)
                    .forEach(start => this._replaceSelector(this.fileSystem.resolve(filePath), start, data));
            });
        }
        _replaceSelector(filePath, start, data) {
            this.fileSystem.edit(filePath)
                .remove(start, data.replace.length)
                .insertRight(start, data.replaceWith);
        }
    }
    exports.CssSelectorsMigration = CssSelectorsMigration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLXNlbGVjdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvbWlncmF0aW9ucy9jc3Mtc2VsZWN0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBR2pDLDZFQUFzRDtJQUV0RCxrRkFBOEQ7SUFDOUQsaUZBQW1FO0lBRW5FOzs7T0FHRztJQUNILE1BQWEscUJBQXNCLFNBQVEscUJBQXNCO1FBQWpFOztZQUNFLGlFQUFpRTtZQUNqRSxTQUFJLEdBQUcsb0NBQXFCLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRW5ELDJEQUEyRDtZQUMzRCxZQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBd0RuQyxDQUFDO1FBdERDLFNBQVMsQ0FBQyxJQUFhO1lBQ3JCLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNoQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEM7UUFDSCxDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQTBCO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRTtvQkFDMUMsT0FBTztpQkFDUjtnQkFFRCxpQ0FBdUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUM7cUJBQ2xELEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO3FCQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxlQUFlLENBQUMsVUFBNEI7WUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFO29CQUNoRCxPQUFPO2lCQUNSO2dCQUVELGlDQUF1QixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQztxQkFDcEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7cUJBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLHVCQUF1QixDQUFDLElBQTBCO1lBQ3hELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRTtnQkFDcEUsT0FBTzthQUNSO1lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFFL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO29CQUM3QyxPQUFPO2lCQUNSO2dCQUVELGlDQUF1QixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDO3FCQUM3QyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsTUFBTSxDQUFDO3FCQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDL0YsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsUUFBdUIsRUFBRSxLQUFhLEVBQUUsSUFBNEI7WUFDM0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2lCQUMzQixNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO2lCQUNsQyxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxQyxDQUFDO0tBQ0Y7SUE3REQsc0RBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtXb3Jrc3BhY2VQYXRofSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9maWxlLXN5c3RlbSc7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5pbXBvcnQge0Nzc1NlbGVjdG9yVXBncmFkZURhdGF9IGZyb20gJy4uL2RhdGEvY3NzLXNlbGVjdG9ycyc7XG5pbXBvcnQge2ZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzfSBmcm9tICcuLi90eXBlc2NyaXB0L2xpdGVyYWwnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFVwZ3JhZGVEYXRhfSBmcm9tICcuLi91cGdyYWRlLWRhdGEnO1xuXG4vKipcbiAqIE1pZ3JhdGlvbiB0aGF0IHdhbGtzIHRocm91Z2ggZXZlcnkgc3RyaW5nIGxpdGVyYWwsIHRlbXBsYXRlIGFuZCBzdHlsZXNoZWV0IGluXG4gKiBvcmRlciB0byBtaWdyYXRlIG91dGRhdGVkIENTUyBzZWxlY3RvcnMgdG8gdGhlIG5ldyBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGNsYXNzIENzc1NlbGVjdG9yc01pZ3JhdGlvbiBleHRlbmRzIE1pZ3JhdGlvbjxVcGdyYWRlRGF0YT4ge1xuICAvKiogQ2hhbmdlIGRhdGEgdGhhdCB1cGdyYWRlcyB0byB0aGUgc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLiAqL1xuICBkYXRhID0gZ2V0VmVyc2lvblVwZ3JhZGVEYXRhKHRoaXMsICdjc3NTZWxlY3RvcnMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBlbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKG5vZGUpKSB7XG4gICAgICB0aGlzLl92aXNpdFN0cmluZ0xpdGVyYWxMaWtlKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChkYXRhID0+IHtcbiAgICAgIGlmIChkYXRhLndoaXRlbGlzdCAmJiAhZGF0YS53aGl0ZWxpc3QuaHRtbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHRlbXBsYXRlLmNvbnRlbnQsIGRhdGEucmVwbGFjZSlcbiAgICAgICAgICAubWFwKG9mZnNldCA9PiB0ZW1wbGF0ZS5zdGFydCArIG9mZnNldClcbiAgICAgICAgICAuZm9yRWFjaChzdGFydCA9PiB0aGlzLl9yZXBsYWNlU2VsZWN0b3IodGVtcGxhdGUuZmlsZVBhdGgsIHN0YXJ0LCBkYXRhKSk7XG4gICAgfSk7XG4gIH1cblxuICB2aXNpdFN0eWxlc2hlZXQoc3R5bGVzaGVldDogUmVzb2x2ZWRSZXNvdXJjZSk6IHZvaWQge1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKGRhdGEgPT4ge1xuICAgICAgaWYgKGRhdGEud2hpdGVsaXN0ICYmICFkYXRhLndoaXRlbGlzdC5zdHlsZXNoZWV0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZmluZEFsbFN1YnN0cmluZ0luZGljZXMoc3R5bGVzaGVldC5jb250ZW50LCBkYXRhLnJlcGxhY2UpXG4gICAgICAgICAgLm1hcChvZmZzZXQgPT4gc3R5bGVzaGVldC5zdGFydCArIG9mZnNldClcbiAgICAgICAgICAuZm9yRWFjaChzdGFydCA9PiB0aGlzLl9yZXBsYWNlU2VsZWN0b3Ioc3R5bGVzaGVldC5maWxlUGF0aCwgc3RhcnQsIGRhdGEpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2Uobm9kZTogdHMuU3RyaW5nTGl0ZXJhbExpa2UpIHtcbiAgICBpZiAobm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQua2luZCAhPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHRDb250ZW50ID0gbm9kZS5nZXRUZXh0KCk7XG4gICAgY29uc3QgZmlsZVBhdGggPSBub2RlLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZTtcblxuICAgIHRoaXMuZGF0YS5mb3JFYWNoKGRhdGEgPT4ge1xuICAgICAgaWYgKGRhdGEud2hpdGVsaXN0ICYmICFkYXRhLndoaXRlbGlzdC5zdHJpbmdzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZmluZEFsbFN1YnN0cmluZ0luZGljZXModGV4dENvbnRlbnQsIGRhdGEucmVwbGFjZSlcbiAgICAgICAgICAubWFwKG9mZnNldCA9PiBub2RlLmdldFN0YXJ0KCkgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKHRoaXMuZmlsZVN5c3RlbS5yZXNvbHZlKGZpbGVQYXRoKSwgc3RhcnQsIGRhdGEpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcGxhY2VTZWxlY3RvcihmaWxlUGF0aDogV29ya3NwYWNlUGF0aCwgc3RhcnQ6IG51bWJlciwgZGF0YTogQ3NzU2VsZWN0b3JVcGdyYWRlRGF0YSkge1xuICAgIHRoaXMuZmlsZVN5c3RlbS5lZGl0KGZpbGVQYXRoKVxuICAgICAgLnJlbW92ZShzdGFydCwgZGF0YS5yZXBsYWNlLmxlbmd0aClcbiAgICAgIC5pbnNlcnRSaWdodChzdGFydCwgZGF0YS5yZXBsYWNlV2l0aCk7XG4gIH1cbn1cbiJdfQ==