"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectIndexFiles = void 0;
const project_targets_1 = require("./project-targets");
/** Gets the path of the index file in the given project. */
function getProjectIndexFiles(project) {
    const paths = (0, project_targets_1.getTargetsByBuilderName)(project, project_targets_1.defaultTargetBuilders.build)
        .filter(t => t.options?.['index'])
        .map(t => t.options['index']);
    // Use a set to remove duplicate index files referenced in multiple build targets of a project.
    return Array.from(new Set(paths));
}
exports.getProjectIndexFiles = getProjectIndexFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdC1pbmRleC1maWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9zY2hlbWF0aWNzL3V0aWxzL3Byb2plY3QtaW5kZXgtZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFHSCx1REFBaUY7QUFFakYsNERBQTREO0FBQzVELFNBQWdCLG9CQUFvQixDQUFDLE9BQXFDO0lBQ3hFLE1BQU0sS0FBSyxHQUFHLElBQUEseUNBQXVCLEVBQUMsT0FBTyxFQUFFLHVDQUFxQixDQUFDLEtBQUssQ0FBQztTQUN4RSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDakMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxPQUFPLENBQVMsQ0FBQyxDQUFDO0lBRXpDLCtGQUErRjtJQUMvRixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBUEQsb0RBT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQYXRoLCB3b3Jrc3BhY2VzfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge2RlZmF1bHRUYXJnZXRCdWlsZGVycywgZ2V0VGFyZ2V0c0J5QnVpbGRlck5hbWV9IGZyb20gJy4vcHJvamVjdC10YXJnZXRzJztcblxuLyoqIEdldHMgdGhlIHBhdGggb2YgdGhlIGluZGV4IGZpbGUgaW4gdGhlIGdpdmVuIHByb2plY3QuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEluZGV4RmlsZXMocHJvamVjdDogd29ya3NwYWNlcy5Qcm9qZWN0RGVmaW5pdGlvbik6IFBhdGhbXSB7XG4gIGNvbnN0IHBhdGhzID0gZ2V0VGFyZ2V0c0J5QnVpbGRlck5hbWUocHJvamVjdCwgZGVmYXVsdFRhcmdldEJ1aWxkZXJzLmJ1aWxkKVxuICAgIC5maWx0ZXIodCA9PiB0Lm9wdGlvbnM/LlsnaW5kZXgnXSlcbiAgICAubWFwKHQgPT4gdC5vcHRpb25zIVsnaW5kZXgnXSBhcyBQYXRoKTtcblxuICAvLyBVc2UgYSBzZXQgdG8gcmVtb3ZlIGR1cGxpY2F0ZSBpbmRleCBmaWxlcyByZWZlcmVuY2VkIGluIG11bHRpcGxlIGJ1aWxkIHRhcmdldHMgb2YgYSBwcm9qZWN0LlxuICByZXR1cm4gQXJyYXkuZnJvbShuZXcgU2V0KHBhdGhzKSk7XG59XG4iXX0=