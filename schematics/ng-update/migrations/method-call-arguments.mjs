"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodCallArgumentsMigration = void 0;
const ts = require("typescript");
const migration_1 = require("../../update-tool/migration");
const upgrade_data_1 = require("../upgrade-data");
/**
 * Migration that visits every TypeScript method call expression and checks if the
 * argument count is invalid and needs to be *manually* updated.
 */
class MethodCallArgumentsMigration extends migration_1.Migration {
    /** Change data that upgrades to the specified target version. */
    data = (0, upgrade_data_1.getVersionUpgradeData)(this, 'methodCallChecks');
    // Only enable the migration rule if there is upgrade data.
    enabled = this.data.length !== 0;
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
        const failure = this.data
            .filter(data => data.method === methodName && data.className === hostTypeName)
            .map(data => data.invalidArgCounts.find(f => f.count === node.arguments.length))[0];
        if (!failure) {
            return;
        }
        this.createFailureAtNode(node, `Found call to "${hostTypeName + '.' + methodName}" ` +
            `with ${failure.count} arguments. Message: ${failure.message}`);
    }
}
exports.MethodCallArgumentsMigration = MethodCallArgumentsMigration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0aG9kLWNhbGwtYXJndW1lbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL25nLXVwZGF0ZS9taWdyYXRpb25zL21ldGhvZC1jYWxsLWFyZ3VtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxpQ0FBaUM7QUFDakMsMkRBQXNEO0FBR3RELGtEQUFtRTtBQUVuRTs7O0dBR0c7QUFDSCxNQUFhLDRCQUE2QixTQUFRLHFCQUFzQjtJQUN0RSxpRUFBaUU7SUFDakUsSUFBSSxHQUE0QixJQUFBLG9DQUFxQixFQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBRWhGLDJEQUEyRDtJQUMzRCxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO0lBRXhCLFNBQVMsQ0FBQyxJQUFhO1FBQzlCLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNoRixJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQztJQUNILENBQUM7SUFFTyw4QkFBOEIsQ0FBQyxJQUF1QjtRQUM1RCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsVUFBeUMsQ0FBQztRQUV0RSxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxQyxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDN0QsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFNUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xCLE9BQU87UUFDVCxDQUFDO1FBRUQsd0ZBQXdGO1FBQ3hGLHlGQUF5RjtRQUN6Rix1RkFBdUY7UUFDdkYsc0ZBQXNGO1FBQ3RGLHFGQUFxRjtRQUNyRix3RkFBd0Y7UUFDeEYsd0ZBQXdGO1FBQ3hGLHVGQUF1RjtRQUN2Rix5Q0FBeUM7UUFDekMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUk7YUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxVQUFVLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxZQUFZLENBQUM7YUFDN0UsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXRGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxDQUFDLG1CQUFtQixDQUN0QixJQUFJLEVBQ0osa0JBQWtCLFlBQVksR0FBRyxHQUFHLEdBQUcsVUFBVSxJQUFJO1lBQ25ELFFBQVEsT0FBTyxDQUFDLEtBQUssd0JBQXdCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FDakUsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQW5ERCxvRUFtREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtNaWdyYXRpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL21pZ3JhdGlvbic7XG5cbmltcG9ydCB7TWV0aG9kQ2FsbFVwZ3JhZGVEYXRhfSBmcm9tICcuLi9kYXRhJztcbmltcG9ydCB7Z2V0VmVyc2lvblVwZ3JhZGVEYXRhLCBVcGdyYWRlRGF0YX0gZnJvbSAnLi4vdXBncmFkZS1kYXRhJztcblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCB2aXNpdHMgZXZlcnkgVHlwZVNjcmlwdCBtZXRob2QgY2FsbCBleHByZXNzaW9uIGFuZCBjaGVja3MgaWYgdGhlXG4gKiBhcmd1bWVudCBjb3VudCBpcyBpbnZhbGlkIGFuZCBuZWVkcyB0byBiZSAqbWFudWFsbHkqIHVwZGF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXRob2RDYWxsQXJndW1lbnRzTWlncmF0aW9uIGV4dGVuZHMgTWlncmF0aW9uPFVwZ3JhZGVEYXRhPiB7XG4gIC8qKiBDaGFuZ2UgZGF0YSB0aGF0IHVwZ3JhZGVzIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0IHZlcnNpb24uICovXG4gIGRhdGE6IE1ldGhvZENhbGxVcGdyYWRlRGF0YVtdID0gZ2V0VmVyc2lvblVwZ3JhZGVEYXRhKHRoaXMsICdtZXRob2RDYWxsQ2hlY2tzJyk7XG5cbiAgLy8gT25seSBlbmFibGUgdGhlIG1pZ3JhdGlvbiBydWxlIGlmIHRoZXJlIGlzIHVwZ3JhZGUgZGF0YS5cbiAgZW5hYmxlZCA9IHRoaXMuZGF0YS5sZW5ndGggIT09IDA7XG5cbiAgb3ZlcnJpZGUgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpOiB2b2lkIHtcbiAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSAmJiB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pKSB7XG4gICAgICB0aGlzLl9jaGVja1Byb3BlcnR5QWNjZXNzTWV0aG9kQ2FsbChub2RlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jaGVja1Byb3BlcnR5QWNjZXNzTWV0aG9kQ2FsbChub2RlOiB0cy5DYWxsRXhwcmVzc2lvbikge1xuICAgIGNvbnN0IHByb3BlcnR5QWNjZXNzID0gbm9kZS5leHByZXNzaW9uIGFzIHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbjtcblxuICAgIGlmICghdHMuaXNJZGVudGlmaWVyKHByb3BlcnR5QWNjZXNzLm5hbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdFR5cGUgPSB0aGlzLnR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKHByb3BlcnR5QWNjZXNzLmV4cHJlc3Npb24pO1xuICAgIGNvbnN0IGhvc3RUeXBlTmFtZSA9IGhvc3RUeXBlLnN5bWJvbCAmJiBob3N0VHlwZS5zeW1ib2wubmFtZTtcbiAgICBjb25zdCBtZXRob2ROYW1lID0gcHJvcGVydHlBY2Nlc3MubmFtZS50ZXh0O1xuXG4gICAgaWYgKCFob3N0VHlwZU5hbWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPKGRldnZlcnNpb24pOiBSZXZpc2l0IHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIHVwZ3JhZGUgcnVsZS4gSXQgc2VlbXMgZGlmZmljdWx0XG4gICAgLy8gYW5kIGFtYmlndW91cyB0byBtYWludGFpbiB0aGUgZGF0YSBmb3IgdGhpcyBydWxlLiBlLmcuIGNvbnNpZGVyIGEgbWV0aG9kIHdoaWNoIGhhcyB0aGVcbiAgICAvLyBzYW1lIGFtb3VudCBvZiBhcmd1bWVudHMgYnV0IGp1c3QgaGFkIGEgdHlwZSBjaGFuZ2UuIEluIHRoYXQgY2FzZSB3ZSBjb3VsZCBzdGlsbCBhZGRcbiAgICAvLyBuZXcgZW50cmllcyB0byB0aGUgdXBncmFkZSBkYXRhIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgYXJndW1lbnQgbGVuZ3RoIHRvIGp1c3Qgc2hvd1xuICAgIC8vIGEgZmFpbHVyZSBtZXNzYWdlLCBidXQgYWRkaW5nIHRoYXQgZGF0YSBiZWNvbWVzIHBhaW5mdWwgaWYgdGhlIG1ldGhvZCBoYXMgb3B0aW9uYWxcbiAgICAvLyBwYXJhbWV0ZXJzIGFuZCBpdCB3b3VsZCBtZWFuIHRoYXQgdGhlIGVycm9yIG1lc3NhZ2Ugd291bGQgYWx3YXlzIHNob3cgdXAsIGV2ZW4gaWYgdGhlXG4gICAgLy8gYXJndW1lbnQgaXMgaW4gc29tZSBjYXNlcyBzdGlsbCBhc3NpZ25hYmxlIHRvIHRoZSBuZXcgcGFyYW1ldGVyIHR5cGUuIFdlIGNvdWxkIHJlLXVzZVxuICAgIC8vIHRoZSBsb2dpYyB3ZSBoYXZlIGluIHRoZSBjb25zdHJ1Y3Rvci1zaWduYXR1cmUgY2hlY2tzIHRvIGNoZWNrIGZvciBhc3NpZ25hYmlsaXR5IGFuZFxuICAgIC8vIHRvIG1ha2UgdGhlIHVwZ3JhZGUgZGF0YSBsZXNzIHZlcmJvc2UuXG4gICAgY29uc3QgZmFpbHVyZSA9IHRoaXMuZGF0YVxuICAgICAgLmZpbHRlcihkYXRhID0+IGRhdGEubWV0aG9kID09PSBtZXRob2ROYW1lICYmIGRhdGEuY2xhc3NOYW1lID09PSBob3N0VHlwZU5hbWUpXG4gICAgICAubWFwKGRhdGEgPT4gZGF0YS5pbnZhbGlkQXJnQ291bnRzLmZpbmQoZiA9PiBmLmNvdW50ID09PSBub2RlLmFyZ3VtZW50cy5sZW5ndGgpKVswXTtcblxuICAgIGlmICghZmFpbHVyZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY3JlYXRlRmFpbHVyZUF0Tm9kZShcbiAgICAgIG5vZGUsXG4gICAgICBgRm91bmQgY2FsbCB0byBcIiR7aG9zdFR5cGVOYW1lICsgJy4nICsgbWV0aG9kTmFtZX1cIiBgICtcbiAgICAgICAgYHdpdGggJHtmYWlsdXJlLmNvdW50fSBhcmd1bWVudHMuIE1lc3NhZ2U6ICR7ZmFpbHVyZS5tZXNzYWdlfWAsXG4gICAgKTtcbiAgfVxufVxuIl19