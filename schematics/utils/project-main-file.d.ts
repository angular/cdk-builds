/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { Path } from '@angular-devkit/core';
import { ProjectDefinition } from '@schematics/angular/utility';
/** Looks for the main TypeScript file in the given project and returns its path. */
export declare function getProjectMainFile(project: ProjectDefinition): Path;
