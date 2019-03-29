/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { IOptions, RuleFailure, Rules } from 'tslint';
import * as ts from 'typescript';
import { AttributeSelectorUpgradeData } from '../../data';
import { ExternalResource } from '../../tslint/component-file';
import { ComponentWalker } from '../../tslint/component-walker';
/**
 * Rule that walks through every stylesheet in the application and updates outdated
 * attribute selectors to the updated selector.
 */
export declare class Rule extends Rules.AbstractRule {
    apply(sourceFile: ts.SourceFile): RuleFailure[];
}
export declare class Walker extends ComponentWalker {
    /** Change data that upgrades to the specified target version. */
    data: AttributeSelectorUpgradeData[];
    constructor(sourceFile: ts.SourceFile, options: IOptions);
    visitInlineStylesheet(literal: ts.StringLiteralLike): void;
    visitExternalStylesheet(node: ExternalResource): void;
    /**
     * Searches for outdated attribute selectors in the specified content and creates replacements
     * with the according messages that can be added to a rule failure.
     */
    private _createReplacementsForContent;
}
