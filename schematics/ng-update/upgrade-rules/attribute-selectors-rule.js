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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/attribute-selectors-rule", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/typescript/literal", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const literal_1 = require("@angular/cdk/schematics/ng-update/typescript/literal");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Migration rule that walks through every string literal, template and stylesheet
     * in order to switch deprecated attribute selectors to the updated selector.
     */
    class AttributeSelectorsRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /** Required upgrade changes for specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'attributeSelectors');
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
                const currentSelector = `[${selector.replace}]`;
                const updatedSelector = `[${selector.replaceWith}]`;
                literal_1.findAllSubstringIndices(stylesheet.content, currentSelector)
                    .map(offset => stylesheet.start + offset)
                    .forEach(start => this._replaceSelector(stylesheet.filePath, start, { replace: currentSelector, replaceWith: updatedSelector }));
            });
        }
        _visitStringLiteralLike(literal) {
            if (literal.parent && literal.parent.kind !== ts.SyntaxKind.CallExpression) {
                return;
            }
            const literalText = literal.getText();
            const filePath = literal.getSourceFile().fileName;
            this.data.forEach(selector => {
                literal_1.findAllSubstringIndices(literalText, selector.replace)
                    .map(offset => literal.getStart() + offset)
                    .forEach(start => this._replaceSelector(filePath, start, selector));
            });
        }
        _replaceSelector(filePath, start, data) {
            const updateRecorder = this.getUpdateRecorder(filePath);
            updateRecorder.remove(start, data.replace.length);
            updateRecorder.insertRight(start, data.replaceWith);
        }
    }
    exports.AttributeSelectorsRule = AttributeSelectorsRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cmlidXRlLXNlbGVjdG9ycy1ydWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS91cGdyYWRlLXJ1bGVzL2F0dHJpYnV0ZS1zZWxlY3RvcnMtcnVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQyx1RkFBK0Q7SUFFL0Qsa0ZBQThEO0lBQzlELGlGQUF1RTtJQUV2RTs7O09BR0c7SUFDSCxNQUFhLHNCQUF1QixTQUFRLDhCQUE4QjtRQUExRTs7WUFDRSw2REFBNkQ7WUFDN0QsU0FBSSxHQUFHLG9DQUFxQixDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRXpELDJEQUEyRDtZQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztRQWtEdkMsQ0FBQztRQWhEQyxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BDO1FBQ0gsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUEwQjtZQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0IsaUNBQXVCLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDO3FCQUN0RCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztxQkFDdEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbkYsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsZUFBZSxDQUFDLFVBQTRCO1lBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzQixNQUFNLGVBQWUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEdBQUcsQ0FBQztnQkFDaEQsTUFBTSxlQUFlLEdBQUcsSUFBSSxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUM7Z0JBRXBELGlDQUF1QixDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDO3FCQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztxQkFDeEMsT0FBTyxDQUNKLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUMxQixVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssRUFDMUIsRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekUsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sdUJBQXVCLENBQUMsT0FBNkI7WUFDM0QsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFO2dCQUMxRSxPQUFPO2FBQ1I7WUFFRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQztZQUVsRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0IsaUNBQXVCLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUM7cUJBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUM7cUJBQzFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsSUFBa0M7WUFDMUYsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEQsY0FBYyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RELENBQUM7S0FDRjtJQXZERCx3REF1REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge1Jlc29sdmVkUmVzb3VyY2V9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL2NvbXBvbmVudC1yZXNvdXJjZS1jb2xsZWN0b3InO1xuaW1wb3J0IHtNaWdyYXRpb25SdWxlfSBmcm9tICcuLi8uLi91cGRhdGUtdG9vbC9taWdyYXRpb24tcnVsZSc7XG5pbXBvcnQge0F0dHJpYnV0ZVNlbGVjdG9yVXBncmFkZURhdGF9IGZyb20gJy4uL2RhdGEvYXR0cmlidXRlLXNlbGVjdG9ycyc7XG5pbXBvcnQge2ZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzfSBmcm9tICcuLi90eXBlc2NyaXB0L2xpdGVyYWwnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFJ1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gcnVsZSB0aGF0IHdhbGtzIHRocm91Z2ggZXZlcnkgc3RyaW5nIGxpdGVyYWwsIHRlbXBsYXRlIGFuZCBzdHlsZXNoZWV0XG4gKiBpbiBvcmRlciB0byBzd2l0Y2ggZGVwcmVjYXRlZCBhdHRyaWJ1dGUgc2VsZWN0b3JzIHRvIHRoZSB1cGRhdGVkIHNlbGVjdG9yLlxuICovXG5leHBvcnQgY2xhc3MgQXR0cmlidXRlU2VsZWN0b3JzUnVsZSBleHRlbmRzIE1pZ3JhdGlvblJ1bGU8UnVsZVVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBSZXF1aXJlZCB1cGdyYWRlIGNoYW5nZXMgZm9yIHNwZWNpZmllZCB0YXJnZXQgdmVyc2lvbi4gKi9cbiAgZGF0YSA9IGdldFZlcnNpb25VcGdyYWRlRGF0YSh0aGlzLCAnYXR0cmlidXRlU2VsZWN0b3JzJyk7XG5cbiAgLy8gT25seSBlbmFibGUgdGhlIG1pZ3JhdGlvbiBydWxlIGlmIHRoZXJlIGlzIHVwZ3JhZGUgZGF0YS5cbiAgcnVsZUVuYWJsZWQgPSB0aGlzLmRhdGEubGVuZ3RoICE9PSAwO1xuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzU3RyaW5nTGl0ZXJhbExpa2Uobm9kZSkpIHtcbiAgICAgIHRoaXMuX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2Uobm9kZSk7XG4gICAgfVxuICB9XG5cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRSZXNvdXJjZSkge1xuICAgIHRoaXMuZGF0YS5mb3JFYWNoKHNlbGVjdG9yID0+IHtcbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHRlbXBsYXRlLmNvbnRlbnQsIHNlbGVjdG9yLnJlcGxhY2UpXG4gICAgICAgICAgLm1hcChvZmZzZXQgPT4gdGVtcGxhdGUuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goc3RhcnQgPT4gdGhpcy5fcmVwbGFjZVNlbGVjdG9yKHRlbXBsYXRlLmZpbGVQYXRoLCBzdGFydCwgc2VsZWN0b3IpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHZpc2l0U3R5bGVzaGVldChzdHlsZXNoZWV0OiBSZXNvbHZlZFJlc291cmNlKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhLmZvckVhY2goc2VsZWN0b3IgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFNlbGVjdG9yID0gYFske3NlbGVjdG9yLnJlcGxhY2V9XWA7XG4gICAgICBjb25zdCB1cGRhdGVkU2VsZWN0b3IgPSBgWyR7c2VsZWN0b3IucmVwbGFjZVdpdGh9XWA7XG5cbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKHN0eWxlc2hlZXQuY29udGVudCwgY3VycmVudFNlbGVjdG9yKVxuICAgICAgICAgIC5tYXAob2Zmc2V0ID0+IHN0eWxlc2hlZXQuc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgICAgLmZvckVhY2goXG4gICAgICAgICAgICAgIHN0YXJ0ID0+IHRoaXMuX3JlcGxhY2VTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgIHN0eWxlc2hlZXQuZmlsZVBhdGgsIHN0YXJ0LFxuICAgICAgICAgICAgICAgICAge3JlcGxhY2U6IGN1cnJlbnRTZWxlY3RvciwgcmVwbGFjZVdpdGg6IHVwZGF0ZWRTZWxlY3Rvcn0pKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0U3RyaW5nTGl0ZXJhbExpa2UobGl0ZXJhbDogdHMuU3RyaW5nTGl0ZXJhbExpa2UpIHtcbiAgICBpZiAobGl0ZXJhbC5wYXJlbnQgJiYgbGl0ZXJhbC5wYXJlbnQua2luZCAhPT0gdHMuU3ludGF4S2luZC5DYWxsRXhwcmVzc2lvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxpdGVyYWxUZXh0ID0gbGl0ZXJhbC5nZXRUZXh0KCk7XG4gICAgY29uc3QgZmlsZVBhdGggPSBsaXRlcmFsLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZTtcblxuICAgIHRoaXMuZGF0YS5mb3JFYWNoKHNlbGVjdG9yID0+IHtcbiAgICAgIGZpbmRBbGxTdWJzdHJpbmdJbmRpY2VzKGxpdGVyYWxUZXh0LCBzZWxlY3Rvci5yZXBsYWNlKVxuICAgICAgICAgIC5tYXAob2Zmc2V0ID0+IGxpdGVyYWwuZ2V0U3RhcnQoKSArIG9mZnNldClcbiAgICAgICAgICAuZm9yRWFjaChzdGFydCA9PiB0aGlzLl9yZXBsYWNlU2VsZWN0b3IoZmlsZVBhdGgsIHN0YXJ0LCBzZWxlY3RvcikpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVwbGFjZVNlbGVjdG9yKGZpbGVQYXRoOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGRhdGE6IEF0dHJpYnV0ZVNlbGVjdG9yVXBncmFkZURhdGEpIHtcbiAgICBjb25zdCB1cGRhdGVSZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIoZmlsZVBhdGgpO1xuICAgIHVwZGF0ZVJlY29yZGVyLnJlbW92ZShzdGFydCwgZGF0YS5yZXBsYWNlLmxlbmd0aCk7XG4gICAgdXBkYXRlUmVjb3JkZXIuaW5zZXJ0UmlnaHQoc3RhcnQsIGRhdGEucmVwbGFjZVdpdGgpO1xuICB9XG59XG4iXX0=