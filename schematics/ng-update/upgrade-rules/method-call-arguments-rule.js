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
        define("@angular/cdk/schematics/ng-update/upgrade-rules/method-call-arguments-rule", ["require", "exports", "typescript", "@angular/cdk/schematics/update-tool/migration-rule", "@angular/cdk/schematics/ng-update/upgrade-data"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const migration_rule_1 = require("@angular/cdk/schematics/update-tool/migration-rule");
    const upgrade_data_1 = require("@angular/cdk/schematics/ng-update/upgrade-data");
    /**
     * Rule that visits every TypeScript method call expression and checks if the
     * argument count is invalid and needs to be *manually* updated.
     */
    class MethodCallArgumentsRule extends migration_rule_1.MigrationRule {
        constructor() {
            super(...arguments);
            /** Change data that upgrades to the specified target version. */
            this.data = upgrade_data_1.getVersionUpgradeData(this, 'methodCallChecks');
            // Only enable the migration rule if there is upgrade data.
            this.ruleEnabled = this.data.length !== 0;
        }
        visitNode(node) {
            if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
                this._checkPropertyAccessMethodCall(node);
            }
        }
        _checkPropertyAccessMethodCall(node) {
            const propertyAccess = node.expression;
            if (!ts.isIdentifier(propertyAccess.name)) {
                return;
            }
            const hostType = this.typeChecker.getTypeAtLocation(propertyAccess.expression);
            const hostTypeName = hostType.symbol && hostType.symbol.name;
            const methodName = propertyAccess.name.text;
            if (!hostTypeName) {
                return;
            }
            // TODO(devversion): Revisit the implementation of this upgrade rule. It seems difficult
            // and ambiguous to maintain the data for this rule. e.g. consider a method which has the
            // same amount of arguments but just had a type change. In that case we could still add
            // new entries to the upgrade data that match the current argument length to just show
            // a failure message, but adding that data becomes painful if the method has optional
            // parameters and it would mean that the error message would always show up, even if the
            // argument is in some cases still assignable to the new parameter type. We could re-use
            // the logic we have in the constructor-signature checks to check for assignability and
            // to make the upgrade data less verbose.
            const failure = this.data.filter(data => data.method === methodName && data.className === hostTypeName)
                .map(data => data.invalidArgCounts.find(f => f.count === node.arguments.length))[0];
            if (!failure) {
                return;
            }
            this.createFailureAtNode(node, `Found call to "${hostTypeName + '.' + methodName}" ` +
                `with ${failure.count} arguments. Message: ${failure.message}`);
        }
    }
    exports.MethodCallArgumentsRule = MethodCallArgumentsRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0aG9kLWNhbGwtYXJndW1lbnRzLXJ1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL3VwZ3JhZGUtcnVsZXMvbWV0aG9kLWNhbGwtYXJndW1lbnRzLXJ1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsdUZBQStEO0lBRy9ELGlGQUF1RTtJQUV2RTs7O09BR0c7SUFDSCxNQUFhLHVCQUF3QixTQUFRLDhCQUE4QjtRQUEzRTs7WUFDRSxpRUFBaUU7WUFDakUsU0FBSSxHQUE0QixvQ0FBcUIsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUVoRiwyREFBMkQ7WUFDM0QsZ0JBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUE2Q3ZDLENBQUM7UUEzQ0MsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDL0UsSUFBSSxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzNDO1FBQ0gsQ0FBQztRQUVPLDhCQUE4QixDQUFDLElBQXVCO1lBQzVELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxVQUF5QyxDQUFDO1lBRXRFLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekMsT0FBTzthQUNSO1lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0UsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUM3RCxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUU1QyxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNqQixPQUFPO2FBQ1I7WUFFRCx3RkFBd0Y7WUFDeEYseUZBQXlGO1lBQ3pGLHVGQUF1RjtZQUN2RixzRkFBc0Y7WUFDdEYscUZBQXFGO1lBQ3JGLHdGQUF3RjtZQUN4Rix3RkFBd0Y7WUFDeEYsdUZBQXVGO1lBQ3ZGLHlDQUF5QztZQUN6QyxNQUFNLE9BQU8sR0FDVCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssWUFBWSxDQUFDO2lCQUNsRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUYsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWixPQUFPO2FBQ1I7WUFFRCxJQUFJLENBQUMsbUJBQW1CLENBQ3BCLElBQUksRUFDSixrQkFBa0IsWUFBWSxHQUFHLEdBQUcsR0FBRyxVQUFVLElBQUk7Z0JBQ2pELFFBQVEsT0FBTyxDQUFDLEtBQUssd0JBQXdCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLENBQUM7S0FDRjtJQWxERCwwREFrREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge01pZ3JhdGlvblJ1bGV9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbi1ydWxlJztcblxuaW1wb3J0IHtNZXRob2RDYWxsVXBncmFkZURhdGF9IGZyb20gJy4uL2RhdGEnO1xuaW1wb3J0IHtnZXRWZXJzaW9uVXBncmFkZURhdGEsIFJ1bGVVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBSdWxlIHRoYXQgdmlzaXRzIGV2ZXJ5IFR5cGVTY3JpcHQgbWV0aG9kIGNhbGwgZXhwcmVzc2lvbiBhbmQgY2hlY2tzIGlmIHRoZVxuICogYXJndW1lbnQgY291bnQgaXMgaW52YWxpZCBhbmQgbmVlZHMgdG8gYmUgKm1hbnVhbGx5KiB1cGRhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgTWV0aG9kQ2FsbEFyZ3VtZW50c1J1bGUgZXh0ZW5kcyBNaWdyYXRpb25SdWxlPFJ1bGVVcGdyYWRlRGF0YT4ge1xuICAvKiogQ2hhbmdlIGRhdGEgdGhhdCB1cGdyYWRlcyB0byB0aGUgc3BlY2lmaWVkIHRhcmdldCB2ZXJzaW9uLiAqL1xuICBkYXRhOiBNZXRob2RDYWxsVXBncmFkZURhdGFbXSA9IGdldFZlcnNpb25VcGdyYWRlRGF0YSh0aGlzLCAnbWV0aG9kQ2FsbENoZWNrcycpO1xuXG4gIC8vIE9ubHkgZW5hYmxlIHRoZSBtaWdyYXRpb24gcnVsZSBpZiB0aGVyZSBpcyB1cGdyYWRlIGRhdGEuXG4gIHJ1bGVFbmFibGVkID0gdGhpcy5kYXRhLmxlbmd0aCAhPT0gMDtcblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSk6IHZvaWQge1xuICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikpIHtcbiAgICAgIHRoaXMuX2NoZWNrUHJvcGVydHlBY2Nlc3NNZXRob2RDYWxsKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NoZWNrUHJvcGVydHlBY2Nlc3NNZXRob2RDYWxsKG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgcHJvcGVydHlBY2Nlc3MgPSBub2RlLmV4cHJlc3Npb24gYXMgdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uO1xuXG4gICAgaWYgKCF0cy5pc0lkZW50aWZpZXIocHJvcGVydHlBY2Nlc3MubmFtZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBob3N0VHlwZSA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24ocHJvcGVydHlBY2Nlc3MuZXhwcmVzc2lvbik7XG4gICAgY29uc3QgaG9zdFR5cGVOYW1lID0gaG9zdFR5cGUuc3ltYm9sICYmIGhvc3RUeXBlLnN5bWJvbC5uYW1lO1xuICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBwcm9wZXJ0eUFjY2Vzcy5uYW1lLnRleHQ7XG5cbiAgICBpZiAoIWhvc3RUeXBlTmFtZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE8oZGV2dmVyc2lvbik6IFJldmlzaXQgdGhlIGltcGxlbWVudGF0aW9uIG9mIHRoaXMgdXBncmFkZSBydWxlLiBJdCBzZWVtcyBkaWZmaWN1bHRcbiAgICAvLyBhbmQgYW1iaWd1b3VzIHRvIG1haW50YWluIHRoZSBkYXRhIGZvciB0aGlzIHJ1bGUuIGUuZy4gY29uc2lkZXIgYSBtZXRob2Qgd2hpY2ggaGFzIHRoZVxuICAgIC8vIHNhbWUgYW1vdW50IG9mIGFyZ3VtZW50cyBidXQganVzdCBoYWQgYSB0eXBlIGNoYW5nZS4gSW4gdGhhdCBjYXNlIHdlIGNvdWxkIHN0aWxsIGFkZFxuICAgIC8vIG5ldyBlbnRyaWVzIHRvIHRoZSB1cGdyYWRlIGRhdGEgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBhcmd1bWVudCBsZW5ndGggdG8ganVzdCBzaG93XG4gICAgLy8gYSBmYWlsdXJlIG1lc3NhZ2UsIGJ1dCBhZGRpbmcgdGhhdCBkYXRhIGJlY29tZXMgcGFpbmZ1bCBpZiB0aGUgbWV0aG9kIGhhcyBvcHRpb25hbFxuICAgIC8vIHBhcmFtZXRlcnMgYW5kIGl0IHdvdWxkIG1lYW4gdGhhdCB0aGUgZXJyb3IgbWVzc2FnZSB3b3VsZCBhbHdheXMgc2hvdyB1cCwgZXZlbiBpZiB0aGVcbiAgICAvLyBhcmd1bWVudCBpcyBpbiBzb21lIGNhc2VzIHN0aWxsIGFzc2lnbmFibGUgdG8gdGhlIG5ldyBwYXJhbWV0ZXIgdHlwZS4gV2UgY291bGQgcmUtdXNlXG4gICAgLy8gdGhlIGxvZ2ljIHdlIGhhdmUgaW4gdGhlIGNvbnN0cnVjdG9yLXNpZ25hdHVyZSBjaGVja3MgdG8gY2hlY2sgZm9yIGFzc2lnbmFiaWxpdHkgYW5kXG4gICAgLy8gdG8gbWFrZSB0aGUgdXBncmFkZSBkYXRhIGxlc3MgdmVyYm9zZS5cbiAgICBjb25zdCBmYWlsdXJlID1cbiAgICAgICAgdGhpcy5kYXRhLmZpbHRlcihkYXRhID0+IGRhdGEubWV0aG9kID09PSBtZXRob2ROYW1lICYmIGRhdGEuY2xhc3NOYW1lID09PSBob3N0VHlwZU5hbWUpXG4gICAgICAgICAgICAubWFwKGRhdGEgPT4gZGF0YS5pbnZhbGlkQXJnQ291bnRzLmZpbmQoZiA9PiBmLmNvdW50ID09PSBub2RlLmFyZ3VtZW50cy5sZW5ndGgpKVswXTtcblxuICAgIGlmICghZmFpbHVyZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY3JlYXRlRmFpbHVyZUF0Tm9kZShcbiAgICAgICAgbm9kZSxcbiAgICAgICAgYEZvdW5kIGNhbGwgdG8gXCIke2hvc3RUeXBlTmFtZSArICcuJyArIG1ldGhvZE5hbWV9XCIgYCArXG4gICAgICAgICAgICBgd2l0aCAke2ZhaWx1cmUuY291bnR9IGFyZ3VtZW50cy4gTWVzc2FnZTogJHtmYWlsdXJlLm1lc3NhZ2V9YCk7XG4gIH1cbn1cbiJdfQ==