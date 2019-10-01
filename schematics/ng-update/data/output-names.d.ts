/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/cdk/schematics/ng-update/data/output-names" />
import { VersionChanges } from '../../update-tool/version-changes';
export interface OutputNameUpgradeData {
    /** The @Output() name to replace. */
    replace: string;
    /** The new name for the @Output(). */
    replaceWith: string;
    /** Whitelist where this replacement is made. If omitted it is made in all HTML & CSS */
    whitelist: {
        /** Limit to elements with any of these element tags. */
        elements?: string[];
        /** Limit to elements with any of these attributes. */
        attributes?: string[];
    };
}
export declare const outputNames: VersionChanges<OutputNameUpgradeData>;
