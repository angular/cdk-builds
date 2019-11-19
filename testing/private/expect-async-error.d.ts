/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Expects the asynchronous function to throw an error that matches
 * the specified expectation.
 */
export declare function expectAsyncError(fn: () => Promise<any>, expectation: RegExp | string): Promise<void>;
