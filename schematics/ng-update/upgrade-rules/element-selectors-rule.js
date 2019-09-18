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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/element-selectors-rule", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/literal", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const literal_1 = require("@angular/cdk/schematics/ng-update/typescript/literal");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Rule that walks through every string literal, template and stylesheet in order
     * to migrate outdated element selectors to the new one.
     */
    class ElementSelectorsRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'elementSelectors');
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.data.length !== 0;
        }
        visitNode(node) {
            if (ts.isStringLiteralLike(node)) {
                this._visitStringLiteralLike(node);
            }
        }
        visitTemplate(template) {
            this.data.forEach(selector => {
                literal_1.findAllSubstringIndices(template.content, selector.replace)
                    .map(offset => template.start + offset)
                    .forEach(start => this._replaceSelector(template.filePath, start, selector));
            });
        }
        visitStylesheet(stylesheet) {
            this.data.forEach(selector => {
                literal_1.findAllSubstringIndices(stylesheet.content, selector.replace)
                    .map(offset => stylesheet.start + offset)
                    .forEach(start => this._replaceSelector(stylesheet.filePath, start, selector));
            });
        }
        _visitStringLiteralLike(node) {
            if (node.parent && node.parent.kind !== ts.SyntaxKind.CallExpression) {
                return;
            }
            const textContent = node.getText();
            const filePath = node.getSourceFile().fileName;
            this.data.forEach(selector => {
                literal_1.findAllSubstringIndices(textContent, selector.replace)
                    .map(offset => node.getStart() + offset)
                    .forEach(start => this._replaceSelector(filePath, start, selector));
            });
        }
        _replaceSelector(filePath, start, data) {
            const updateRecorder = this.getUpdateRecorder(filePath);
            updateRecorder.remove(start, data.replace.length);
            updateRecorder.insertRight(start, data.replaceWith);
        }
    }
    exports.ElementSelectorsRule = ElementSelectorsRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC1zZWxlY3RvcnMtcnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvc2NoZW1hdGljcy9uZy11cGRhdGUvdXBncmFkZS1ydWxlcy9lbGVtZW50LXNlbGVjdG9ycy1ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLHVGQUErRDtJQUUvRCxrRkFBOEQ7SUFDOUQsaUZBQXVFO0lBRXZFOzs7T0FHRztJQUNILE1BQWEsb0JBQXFCLFNBQVEsOEJBQThCO1FBQXhFOztZQUNFLGlFQUFpRTtZQUNqRSxTQUFJLEdBQUcsb0NBQXFCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFFdkQsMkRBQTJEO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBNEN2QyxDQUFDO1FBMUNDLFNBQVMsQ0FBQyxJQUFhO1lBQ3JCLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNoQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEM7UUFDSCxDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQTBCO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzQixpQ0FBdUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUM7cUJBQ3RELEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO3FCQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNuRixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxlQUFlLENBQUMsVUFBNEI7WUFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNCLGlDQUF1QixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQztxQkFDeEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7cUJBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLHVCQUF1QixDQUFDLElBQTBCO1lBQ3hELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRTtnQkFDcEUsT0FBTzthQUNSO1lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFFL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNCLGlDQUF1QixDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDO3FCQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsTUFBTSxDQUFDO3FCQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGdCQUFnQixDQUFDLFFBQWdCLEVBQUUsS0FBYSxFQUFFLElBQWdDO1lBQ3hGLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELGNBQWMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RCxDQUFDO0tBQ0Y7SUFqREQsb0RBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtSZXNvbHZlZFJlc291cmNlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9jb21wb25lbnQtcmVzb3VyY2UtY29sbGVjdG9yJztcbmltcG9ydCB7TWlncmF0aW9uUnVsZX0gZnJvbSAnLi4vLi4vdXBkYXRlLXRvb2wvbWlncmF0aW9uLXJ1bGUnO1xuaW1wb3J0IHtFbGVtZW50U2VsZWN0b3JVcGdyYWRlRGF0YX0gZnJvbSAnLi4vZGF0YS9lbGVtZW50LXNlbGVjdG9ycyc7XG5pbXBvcnQge2ZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzfSBmcm9tICcuLi90eXBlc2NyaXB0L2xpdGVyYWwnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFJ1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBSdWxlIHRoYXQgd2Fsa3MgdGhyb3VnaCBldmVyeSBzdHJpbmcgbGl0ZXJhbCwgdGVtcGxhdGUgYW5kIHN0eWxlc2hlZXQgaW4gb3JkZXJcbiAqIHRvIG1pZ3JhdGUgb3V0ZGF0ZWQgZWxlbWVudCBzZWxlY3RvcnMgdG8gdGhlIG5ldyBvbmUuXG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50U2VsZWN0b3JzUnVsZSBleHRlbmRzIE1pZ3JhdGlvblJ1bGU8UnVsZVVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGEgPSBnZXRWZXJzaW9uVXBncmFkZURhdGEodGhpcywgJ2VsZW1lbnRTZWxlY3RvcnMnKTtcblxuICAvLyBPbmx5IGVuYWJsZSB0aGUgbWlncmF0aW9uIHJ1bGUgaWYgdGhlcmUgaXMgdXBncmFkZSBkYXRhLlxuICBydWxlRW5hYmxlZCA9IHRoaXMuZGF0YS5sZW5ndGggIT09IDA7XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpOiB2b2lkIHtcbiAgICBpZiAodHMuaXNTdHJpbmdMaXRlcmFsTGlrZShub2RlKSkge1xuICAgICAgdGhpcy5fdmlzaXRTdHJpbmdMaXRlcmFsTGlrZShub2RlKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goc2VsZWN0b3IgPT4ge1xuICAgICAgZmluZEFsbFN1YnN0cmluZ0luZGljZXModGVtcGxhdGUuY29udGVudCwgc2VsZWN0b3IucmVwbGFjZSlcbiAgICAgICAgICAubWFwKG9mZnNldCA9PiB0ZW1wbGF0ZS5zdGFydCArIG9mZnNldClcbiAgICAgICAgICAuZm9yRWFjaChzdGFydCA9PiB0aGlzLl9yZXBsYWNlU2VsZWN0b3IodGVtcGxhdGUuZmlsZVBhdGgsIHN0YXJ0LCBzZWxlY3RvcikpO1xuICAgIH0pO1xuICB9XG5cbiAgdmlzaXRTdHlsZXNoZWV0KHN0eWxlc2hlZXQ6IFJlc29sdmVkUmVzb3VyY2UpOiB2b2lkIHtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChzZWxlY3RvciA9PiB7XG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyhzdHlsZXNoZWV0LmNvbnRlbnQsIHNlbGVjdG9yLnJlcGxhY2UpXG4gICAgICAgICAgLm1hcChvZmZzZXQgPT4gc3R5bGVzaGVldC5zdGFydCArIG9mZnNldClcbiAgICAgICAgICAuZm9yRWFjaChzdGFydCA9PiB0aGlzLl9yZXBsYWNlU2VsZWN0b3Ioc3R5bGVzaGVldC5maWxlUGF0aCwgc3RhcnQsIHNlbGVjdG9yKSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF92aXNpdFN0cmluZ0xpdGVyYWxMaWtlKG5vZGU6IHRzLlN0cmluZ0xpdGVyYWxMaWtlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50LmtpbmQgIT09IHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0Q29udGVudCA9IG5vZGUuZ2V0VGV4dCgpO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gbm9kZS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG5cbiAgICB0aGlzLmRhdGEuZm9yRWFjaChzZWxlY3RvciA9PiB7XG4gICAgICBmaW5kQWxsU3Vic3RyaW5nSW5kaWNlcyh0ZXh0Q29udGVudCwgc2VsZWN0b3IucmVwbGFjZSlcbiAgICAgICAgICAubWFwKG9mZnNldCA9PiBub2RlLmdldFN0YXJ0KCkgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKGZpbGVQYXRoLCBzdGFydCwgc2VsZWN0b3IpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlcGxhY2VTZWxlY3RvcihmaWxlUGF0aDogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBkYXRhOiBFbGVtZW50U2VsZWN0b3JVcGdyYWRlRGF0YSkge1xuICAgIGNvbnN0IHVwZGF0ZVJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihmaWxlUGF0aCk7XG4gICAgdXBkYXRlUmVjb3JkZXIucmVtb3ZlKHN0YXJ0LCBkYXRhLnJlcGxhY2UubGVuZ3RoKTtcbiAgICB1cGRhdGVSZWNvcmRlci5pbnNlcnRSaWdodChzdGFydCwgZGF0YS5yZXBsYWNlV2l0aCk7XG4gIH1cbn1cbiJdfQ==