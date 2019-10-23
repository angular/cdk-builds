/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * List of all possible directions that can be used for sticky positioning.
 * \@docs-private
 * @type {?}
 */
export const STICKY_DIRECTIONS = ['top', 'bottom', 'left', 'right'];
/**
 * Applies and removes sticky positioning styles to the `CdkTable` rows and columns cells.
 * \@docs-private
 */
export class StickyStyler {
    /**
     * @param {?} _isNativeHtmlTable Whether the sticky logic should be based on a table
     *     that uses the native `<table>` element.
     * @param {?} _stickCellCss The CSS class that will be applied to every row/cell that has
     *     sticky positioning applied.
     * @param {?} direction The directionality context of the table (ltr/rtl); affects column positioning
     *     by reversing left/right positions.
     * @param {?=} _isBrowser Whether the table is currently being rendered on the server or the client.
     */
    constructor(_isNativeHtmlTable, _stickCellCss, direction, _isBrowser = true) {
        this._isNativeHtmlTable = _isNativeHtmlTable;
        this._stickCellCss = _stickCellCss;
        this.direction = direction;
        this._isBrowser = _isBrowser;
    }
    /**
     * Clears the sticky positioning styles from the row and its cells by resetting the `position`
     * style, setting the zIndex to 0, and unsetting each provided sticky direction.
     * @param {?} rows The list of rows that should be cleared from sticking in the provided directions
     * @param {?} stickyDirections The directions that should no longer be set as sticky on the rows.
     * @return {?}
     */
    clearStickyPositioning(rows, stickyDirections) {
        for (const row of rows) {
            // If the row isn't an element (e.g. if it's an `ng-container`),
            // it won't have inline styles or `children` so we skip it.
            if (row.nodeType !== row.ELEMENT_NODE) {
                continue;
            }
            this._removeStickyStyle(row, stickyDirections);
            for (let i = 0; i < row.children.length; i++) {
                /** @type {?} */
                const cell = (/** @type {?} */ (row.children[i]));
                this._removeStickyStyle(cell, stickyDirections);
            }
        }
    }
    /**
     * Applies sticky left and right positions to the cells of each row according to the sticky
     * states of the rendered column definitions.
     * @param {?} rows The rows that should have its set of cells stuck according to the sticky states.
     * @param {?} stickyStartStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the start of the row.
     * @param {?} stickyEndStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the end of the row.
     * @return {?}
     */
    updateStickyColumns(rows, stickyStartStates, stickyEndStates) {
        /** @type {?} */
        const hasStickyColumns = stickyStartStates.some((/**
         * @param {?} state
         * @return {?}
         */
        state => state)) || stickyEndStates.some((/**
         * @param {?} state
         * @return {?}
         */
        state => state));
        if (!rows.length || !hasStickyColumns || !this._isBrowser) {
            return;
        }
        /** @type {?} */
        const firstRow = rows[0];
        /** @type {?} */
        const numCells = firstRow.children.length;
        /** @type {?} */
        const cellWidths = this._getCellWidths(firstRow);
        /** @type {?} */
        const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
        /** @type {?} */
        const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
        /** @type {?} */
        const isRtl = this.direction === 'rtl';
        for (const row of rows) {
            for (let i = 0; i < numCells; i++) {
                /** @type {?} */
                const cell = (/** @type {?} */ (row.children[i]));
                if (stickyStartStates[i]) {
                    this._addStickyStyle(cell, isRtl ? 'right' : 'left', startPositions[i]);
                }
                if (stickyEndStates[i]) {
                    this._addStickyStyle(cell, isRtl ? 'left' : 'right', endPositions[i]);
                }
            }
        }
    }
    /**
     * Applies sticky positioning to the row's cells if using the native table layout, and to the
     * row itself otherwise.
     * @param {?} rowsToStick The list of rows that should be stuck according to their corresponding
     *     sticky state and to the provided top or bottom position.
     * @param {?} stickyStates A list of boolean states where each state represents whether the row
     *     should be stuck in the particular top or bottom position.
     * @param {?} position The position direction in which the row should be stuck if that row should be
     *     sticky.
     *
     * @return {?}
     */
    stickRows(rowsToStick, stickyStates, position) {
        // Since we can't measure the rows on the server, we can't stick the rows properly.
        if (!this._isBrowser) {
            return;
        }
        // If positioning the rows to the bottom, reverse their order when evaluating the sticky
        // position such that the last row stuck will be "bottom: 0px" and so on.
        /** @type {?} */
        const rows = position === 'bottom' ? rowsToStick.reverse() : rowsToStick;
        /** @type {?} */
        let stickyHeight = 0;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            if (!stickyStates[rowIndex]) {
                continue;
            }
            /** @type {?} */
            const row = rows[rowIndex];
            if (this._isNativeHtmlTable) {
                for (let j = 0; j < row.children.length; j++) {
                    /** @type {?} */
                    const cell = (/** @type {?} */ (row.children[j]));
                    this._addStickyStyle(cell, position, stickyHeight);
                }
            }
            else {
                // Flex does not respect the stick positioning on the cells, needs to be applied to the row.
                // If this is applied on a native table, Safari causes the header to fly in wrong direction.
                this._addStickyStyle(row, position, stickyHeight);
            }
            if (rowIndex === rows.length - 1) {
                // prevent unnecessary reflow from getBoundingClientRect()
                return;
            }
            stickyHeight += row.getBoundingClientRect().height;
        }
    }
    /**
     * When using the native table in Safari, sticky footer cells do not stick. The only way to stick
     * footer rows is to apply sticky styling to the tfoot container. This should only be done if
     * all footer rows are sticky. If not all footer rows are sticky, remove sticky positioning from
     * the tfoot element.
     * @param {?} tableElement
     * @param {?} stickyStates
     * @return {?}
     */
    updateStickyFooterContainer(tableElement, stickyStates) {
        if (!this._isNativeHtmlTable) {
            return;
        }
        /** @type {?} */
        const tfoot = (/** @type {?} */ (tableElement.querySelector('tfoot')));
        if (stickyStates.some((/**
         * @param {?} state
         * @return {?}
         */
        state => !state))) {
            this._removeStickyStyle(tfoot, ['bottom']);
        }
        else {
            this._addStickyStyle(tfoot, 'bottom', 0);
        }
    }
    /**
     * Removes the sticky style on the element by removing the sticky cell CSS class, re-evaluating
     * the zIndex, removing each of the provided sticky directions, and removing the
     * sticky position if there are no more directions.
     * @param {?} element
     * @param {?} stickyDirections
     * @return {?}
     */
    _removeStickyStyle(element, stickyDirections) {
        for (const dir of stickyDirections) {
            element.style[dir] = '';
        }
        element.style.zIndex = this._getCalculatedZIndex(element);
        // If the element no longer has any more sticky directions, remove sticky positioning and
        // the sticky CSS class.
        /** @type {?} */
        const hasDirection = STICKY_DIRECTIONS.some((/**
         * @param {?} dir
         * @return {?}
         */
        dir => !!element.style[dir]));
        if (!hasDirection) {
            element.style.position = '';
            element.classList.remove(this._stickCellCss);
        }
    }
    /**
     * Adds the sticky styling to the element by adding the sticky style class, changing position
     * to be sticky (and -webkit-sticky), setting the appropriate zIndex, and adding a sticky
     * direction and value.
     * @param {?} element
     * @param {?} dir
     * @param {?} dirValue
     * @return {?}
     */
    _addStickyStyle(element, dir, dirValue) {
        element.classList.add(this._stickCellCss);
        element.style[dir] = `${dirValue}px`;
        element.style.cssText += 'position: -webkit-sticky; position: sticky; ';
        element.style.zIndex = this._getCalculatedZIndex(element);
    }
    /**
     * Calculate what the z-index should be for the element, depending on what directions (top,
     * bottom, left, right) have been set. It should be true that elements with a top direction
     * should have the highest index since these are elements like a table header. If any of those
     * elements are also sticky in another direction, then they should appear above other elements
     * that are only sticky top (e.g. a sticky column on a sticky header). Bottom-sticky elements
     * (e.g. footer rows) should then be next in the ordering such that they are below the header
     * but above any non-sticky elements. Finally, left/right sticky elements (e.g. sticky columns)
     * should minimally increment so that they are above non-sticky elements but below top and bottom
     * elements.
     * @param {?} element
     * @return {?}
     */
    _getCalculatedZIndex(element) {
        /** @type {?} */
        const zIndexIncrements = {
            top: 100,
            bottom: 10,
            left: 1,
            right: 1,
        };
        /** @type {?} */
        let zIndex = 0;
        // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
        // loses the array generic type in the `for of`. But we *also* have to use `Array` because
        // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
        for (const dir of (/** @type {?} */ (STICKY_DIRECTIONS))) {
            if (element.style[dir]) {
                zIndex += zIndexIncrements[dir];
            }
        }
        return zIndex ? `${zIndex}` : '';
    }
    /**
     * Gets the widths for each cell in the provided row.
     * @param {?} row
     * @return {?}
     */
    _getCellWidths(row) {
        /** @type {?} */
        const cellWidths = [];
        /** @type {?} */
        const firstRowCells = row.children;
        for (let i = 0; i < firstRowCells.length; i++) {
            /** @type {?} */
            let cell = (/** @type {?} */ (firstRowCells[i]));
            cellWidths.push(cell.getBoundingClientRect().width);
        }
        return cellWidths;
    }
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     * @param {?} widths
     * @param {?} stickyStates
     * @return {?}
     */
    _getStickyStartColumnPositions(widths, stickyStates) {
        /** @type {?} */
        const positions = [];
        /** @type {?} */
        let nextPosition = 0;
        for (let i = 0; i < widths.length; i++) {
            if (stickyStates[i]) {
                positions[i] = nextPosition;
                nextPosition += widths[i];
            }
        }
        return positions;
    }
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     * @param {?} widths
     * @param {?} stickyStates
     * @return {?}
     */
    _getStickyEndColumnPositions(widths, stickyStates) {
        /** @type {?} */
        const positions = [];
        /** @type {?} */
        let nextPosition = 0;
        for (let i = widths.length; i > 0; i--) {
            if (stickyStates[i]) {
                positions[i] = nextPosition;
                nextPosition += widths[i];
            }
        }
        return positions;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    StickyStyler.prototype._isNativeHtmlTable;
    /**
     * @type {?}
     * @private
     */
    StickyStyler.prototype._stickCellCss;
    /** @type {?} */
    StickyStyler.prototype.direction;
    /**
     * @type {?}
     * @private
     */
    StickyStyler.prototype._isBrowser;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLE1BQU0sT0FBTyxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUM7Ozs7O0FBTXRGLE1BQU0sT0FBTyxZQUFZOzs7Ozs7Ozs7O0lBVXZCLFlBQW9CLGtCQUEyQixFQUMzQixhQUFxQixFQUN0QixTQUFvQixFQUNuQixhQUFhLElBQUk7UUFIakIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1FBQzNCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDbkIsZUFBVSxHQUFWLFVBQVUsQ0FBTztJQUFJLENBQUM7Ozs7Ozs7O0lBUTFDLHNCQUFzQixDQUFDLElBQW1CLEVBQUUsZ0JBQW1DO1FBQzdFLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ3RCLGdFQUFnRTtZQUNoRSwyREFBMkQ7WUFDM0QsSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxZQUFZLEVBQUU7Z0JBQ3JDLFNBQVM7YUFDVjtZQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUUvQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O3NCQUN0QyxJQUFJLEdBQUcsbUJBQUEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBZTtnQkFDM0MsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2FBQ2pEO1NBQ0Y7SUFDSCxDQUFDOzs7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QyxDQUFDO2FBQzNCO1NBQ0Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQ0Y7Ozs7OztJQXRQYSwwQ0FBbUM7Ozs7O0lBQ25DLHFDQUE2Qjs7SUFDN0IsaUNBQTJCOzs7OztJQUMzQixrQ0FBeUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBEaXJlY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBzZXR0aW5nIHN0aWNreSBwb3NpdGlvbmluZy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuaW1wb3J0IHtEaXJlY3Rpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcblxuZXhwb3J0IHR5cGUgU3RpY2t5RGlyZWN0aW9uID0gJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCc7XG5cbi8qKlxuICogTGlzdCBvZiBhbGwgcG9zc2libGUgZGlyZWN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGlja3kgcG9zaXRpb25pbmcuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBTVElDS1lfRElSRUNUSU9OUzogU3RpY2t5RGlyZWN0aW9uW10gPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG4vKipcbiAqIEFwcGxpZXMgYW5kIHJlbW92ZXMgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyB0byB0aGUgYENka1RhYmxlYCByb3dzIGFuZCBjb2x1bW5zIGNlbGxzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgU3RpY2t5U3R5bGVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBfaXNOYXRpdmVIdG1sVGFibGUgV2hldGhlciB0aGUgc3RpY2t5IGxvZ2ljIHNob3VsZCBiZSBiYXNlZCBvbiBhIHRhYmxlXG4gICAqICAgICB0aGF0IHVzZXMgdGhlIG5hdGl2ZSBgPHRhYmxlPmAgZWxlbWVudC5cbiAgICogQHBhcmFtIF9zdGlja0NlbGxDc3MgVGhlIENTUyBjbGFzcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byBldmVyeSByb3cvY2VsbCB0aGF0IGhhc1xuICAgKiAgICAgc3RpY2t5IHBvc2l0aW9uaW5nIGFwcGxpZWQuXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbmFsaXR5IGNvbnRleHQgb2YgdGhlIHRhYmxlIChsdHIvcnRsKTsgYWZmZWN0cyBjb2x1bW4gcG9zaXRpb25pbmdcbiAgICogICAgIGJ5IHJldmVyc2luZyBsZWZ0L3JpZ2h0IHBvc2l0aW9ucy5cbiAgICogQHBhcmFtIF9pc0Jyb3dzZXIgV2hldGhlciB0aGUgdGFibGUgaXMgY3VycmVudGx5IGJlaW5nIHJlbmRlcmVkIG9uIHRoZSBzZXJ2ZXIgb3IgdGhlIGNsaWVudC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2lzTmF0aXZlSHRtbFRhYmxlOiBib29sZWFuLFxuICAgICAgICAgICAgICBwcml2YXRlIF9zdGlja0NlbGxDc3M6IHN0cmluZyxcbiAgICAgICAgICAgICAgcHVibGljIGRpcmVjdGlvbjogRGlyZWN0aW9uLFxuICAgICAgICAgICAgICBwcml2YXRlIF9pc0Jyb3dzZXIgPSB0cnVlKSB7IH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIGZyb20gdGhlIHJvdyBhbmQgaXRzIGNlbGxzIGJ5IHJlc2V0dGluZyB0aGUgYHBvc2l0aW9uYFxuICAgKiBzdHlsZSwgc2V0dGluZyB0aGUgekluZGV4IHRvIDAsIGFuZCB1bnNldHRpbmcgZWFjaCBwcm92aWRlZCBzdGlja3kgZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gcm93cyBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIGNsZWFyZWQgZnJvbSBzdGlja2luZyBpbiB0aGUgcHJvdmlkZWQgZGlyZWN0aW9uc1xuICAgKiBAcGFyYW0gc3RpY2t5RGlyZWN0aW9ucyBUaGUgZGlyZWN0aW9ucyB0aGF0IHNob3VsZCBubyBsb25nZXIgYmUgc2V0IGFzIHN0aWNreSBvbiB0aGUgcm93cy5cbiAgICovXG4gIGNsZWFyU3RpY2t5UG9zaXRpb25pbmcocm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5RGlyZWN0aW9uczogU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAvLyBJZiB0aGUgcm93IGlzbid0IGFuIGVsZW1lbnQgKGUuZy4gaWYgaXQncyBhbiBgbmctY29udGFpbmVyYCksXG4gICAgICAvLyBpdCB3b24ndCBoYXZlIGlubGluZSBzdHlsZXMgb3IgYGNoaWxkcmVuYCBzbyB3ZSBza2lwIGl0LlxuICAgICAgaWYgKHJvdy5ub2RlVHlwZSAhPT0gcm93LkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUocm93LCBzdGlja3lEaXJlY3Rpb25zKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3cuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUoY2VsbCwgc3RpY2t5RGlyZWN0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyB0byB0aGUgY2VsbHMgb2YgZWFjaCByb3cgYWNjb3JkaW5nIHRvIHRoZSBzdGlja3lcbiAgICogc3RhdGVzIG9mIHRoZSByZW5kZXJlZCBjb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSByb3dzIFRoZSByb3dzIHRoYXQgc2hvdWxkIGhhdmUgaXRzIHNldCBvZiBjZWxscyBzdHVjayBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreSBzdGF0ZXMuXG4gICAqIEBwYXJhbSBzdGlja3lTdGFydFN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIGNlbGxcbiAgICogICAgIGluIHRoaXMgaW5kZXggcG9zaXRpb24gc2hvdWxkIGJlIHN0dWNrIHRvIHRoZSBzdGFydCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gc3RpY2t5RW5kU3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIGVuZCBvZiB0aGUgcm93LlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1ucyhcbiAgICAgIHJvd3M6IEhUTUxFbGVtZW50W10sIHN0aWNreVN0YXJ0U3RhdGVzOiBib29sZWFuW10sIHN0aWNreUVuZFN0YXRlczogYm9vbGVhbltdKSB7XG4gICAgY29uc3QgaGFzU3RpY2t5Q29sdW1ucyA9XG4gICAgICAgIHN0aWNreVN0YXJ0U3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpIHx8IHN0aWNreUVuZFN0YXRlcy5zb21lKHN0YXRlID0+IHN0YXRlKTtcbiAgICBpZiAoIXJvd3MubGVuZ3RoIHx8ICFoYXNTdGlja3lDb2x1bW5zIHx8ICF0aGlzLl9pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaXJzdFJvdyA9IHJvd3NbMF07XG4gICAgY29uc3QgbnVtQ2VsbHMgPSBmaXJzdFJvdy5jaGlsZHJlbi5sZW5ndGg7XG4gICAgY29uc3QgY2VsbFdpZHRoczogbnVtYmVyW10gPSB0aGlzLl9nZXRDZWxsV2lkdGhzKGZpcnN0Um93KTtcblxuICAgIGNvbnN0IHN0YXJ0UG9zaXRpb25zID0gdGhpcy5fZ2V0U3RpY2t5U3RhcnRDb2x1bW5Qb3NpdGlvbnMoY2VsbFdpZHRocywgc3RpY2t5U3RhcnRTdGF0ZXMpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreUVuZENvbHVtblBvc2l0aW9ucyhjZWxsV2lkdGhzLCBzdGlja3lFbmRTdGF0ZXMpO1xuICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXJlY3Rpb24gPT09ICdydGwnO1xuXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DZWxsczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNlbGwgPSByb3cuY2hpbGRyZW5baV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIGlmIChzdGlja3lTdGFydFN0YXRlc1tpXSkge1xuICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGNlbGwsIGlzUnRsID8gJ3JpZ2h0JyA6ICdsZWZ0Jywgc3RhcnRQb3NpdGlvbnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0aWNreUVuZFN0YXRlc1tpXSkge1xuICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGNlbGwsIGlzUnRsID8gJ2xlZnQnIDogJ3JpZ2h0JywgZW5kUG9zaXRpb25zW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHN0aWNreSBwb3NpdGlvbmluZyB0byB0aGUgcm93J3MgY2VsbHMgaWYgdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBsYXlvdXQsIGFuZCB0byB0aGVcbiAgICogcm93IGl0c2VsZiBvdGhlcndpc2UuXG4gICAqIEBwYXJhbSByb3dzVG9TdGljayBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIHN0dWNrIGFjY29yZGluZyB0byB0aGVpciBjb3JyZXNwb25kaW5nXG4gICAqICAgICBzdGlja3kgc3RhdGUgYW5kIHRvIHRoZSBwcm92aWRlZCB0b3Agb3IgYm90dG9tIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gc3RpY2t5U3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgcm93XG4gICAqICAgICBzaG91bGQgYmUgc3R1Y2sgaW4gdGhlIHBhcnRpY3VsYXIgdG9wIG9yIGJvdHRvbSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHJvdyBzaG91bGQgYmUgc3R1Y2sgaWYgdGhhdCByb3cgc2hvdWxkIGJlXG4gICAqICAgICBzdGlja3kuXG4gICAqXG4gICAqL1xuICBzdGlja1Jvd3Mocm93c1RvU3RpY2s6IEhUTUxFbGVtZW50W10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdLCBwb3NpdGlvbjogJ3RvcCcgfCAnYm90dG9tJykge1xuICAgIC8vIFNpbmNlIHdlIGNhbid0IG1lYXN1cmUgdGhlIHJvd3Mgb24gdGhlIHNlcnZlciwgd2UgY2FuJ3Qgc3RpY2sgdGhlIHJvd3MgcHJvcGVybHkuXG4gICAgaWYgKCF0aGlzLl9pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiBwb3NpdGlvbmluZyB0aGUgcm93cyB0byB0aGUgYm90dG9tLCByZXZlcnNlIHRoZWlyIG9yZGVyIHdoZW4gZXZhbHVhdGluZyB0aGUgc3RpY2t5XG4gICAgLy8gcG9zaXRpb24gc3VjaCB0aGF0IHRoZSBsYXN0IHJvdyBzdHVjayB3aWxsIGJlIFwiYm90dG9tOiAwcHhcIiBhbmQgc28gb24uXG4gICAgY29uc3Qgcm93cyA9IHBvc2l0aW9uID09PSAnYm90dG9tJyA/IHJvd3NUb1N0aWNrLnJldmVyc2UoKSA6IHJvd3NUb1N0aWNrO1xuXG4gICAgbGV0IHN0aWNreUhlaWdodCA9IDA7XG4gICAgZm9yIChsZXQgcm93SW5kZXggPSAwOyByb3dJbmRleCA8IHJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICBpZiAoIXN0aWNreVN0YXRlc1tyb3dJbmRleF0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJvdyA9IHJvd3Nbcm93SW5kZXhdO1xuICAgICAgaWYgKHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcm93LmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IHJvdy5jaGlsZHJlbltqXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShjZWxsLCBwb3NpdGlvbiwgc3RpY2t5SGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmxleCBkb2VzIG5vdCByZXNwZWN0IHRoZSBzdGljayBwb3NpdGlvbmluZyBvbiB0aGUgY2VsbHMsIG5lZWRzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIHJvdy5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhcHBsaWVkIG9uIGEgbmF0aXZlIHRhYmxlLCBTYWZhcmkgY2F1c2VzIHRoZSBoZWFkZXIgdG8gZmx5IGluIHdyb25nIGRpcmVjdGlvbi5cbiAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUocm93LCBwb3NpdGlvbiwgc3RpY2t5SGVpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJvd0luZGV4ID09PSByb3dzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgLy8gcHJldmVudCB1bm5lY2Vzc2FyeSByZWZsb3cgZnJvbSBnZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzdGlja3lIZWlnaHQgKz0gcm93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGluIFNhZmFyaSwgc3RpY2t5IGZvb3RlciBjZWxscyBkbyBub3Qgc3RpY2suIFRoZSBvbmx5IHdheSB0byBzdGlja1xuICAgKiBmb290ZXIgcm93cyBpcyB0byBhcHBseSBzdGlja3kgc3R5bGluZyB0byB0aGUgdGZvb3QgY29udGFpbmVyLiBUaGlzIHNob3VsZCBvbmx5IGJlIGRvbmUgaWZcbiAgICogYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3kuIElmIG5vdCBhbGwgZm9vdGVyIHJvd3MgYXJlIHN0aWNreSwgcmVtb3ZlIHN0aWNreSBwb3NpdGlvbmluZyBmcm9tXG4gICAqIHRoZSB0Zm9vdCBlbGVtZW50LlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Rm9vdGVyQ29udGFpbmVyKHRhYmxlRWxlbWVudDogRWxlbWVudCwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pIHtcbiAgICBpZiAoIXRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGZvb3QgPSB0YWJsZUVsZW1lbnQucXVlcnlTZWxlY3RvcigndGZvb3QnKSE7XG4gICAgaWYgKHN0aWNreVN0YXRlcy5zb21lKHN0YXRlID0+ICFzdGF0ZSkpIHtcbiAgICAgIHRoaXMuX3JlbW92ZVN0aWNreVN0eWxlKHRmb290LCBbJ2JvdHRvbSddKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUodGZvb3QsICdib3R0b20nLCAwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgc3RpY2t5IHN0eWxlIG9uIHRoZSBlbGVtZW50IGJ5IHJlbW92aW5nIHRoZSBzdGlja3kgY2VsbCBDU1MgY2xhc3MsIHJlLWV2YWx1YXRpbmdcbiAgICogdGhlIHpJbmRleCwgcmVtb3ZpbmcgZWFjaCBvZiB0aGUgcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbnMsIGFuZCByZW1vdmluZyB0aGVcbiAgICogc3RpY2t5IHBvc2l0aW9uIGlmIHRoZXJlIGFyZSBubyBtb3JlIGRpcmVjdGlvbnMuXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgZm9yIChjb25zdCBkaXIgb2Ygc3RpY2t5RGlyZWN0aW9ucykge1xuICAgICAgZWxlbWVudC5zdHlsZVtkaXJdID0gJyc7XG4gICAgfVxuICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gdGhpcy5fZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50KTtcblxuICAgIC8vIElmIHRoZSBlbGVtZW50IG5vIGxvbmdlciBoYXMgYW55IG1vcmUgc3RpY2t5IGRpcmVjdGlvbnMsIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgYW5kXG4gICAgLy8gdGhlIHN0aWNreSBDU1MgY2xhc3MuXG4gICAgY29uc3QgaGFzRGlyZWN0aW9uID0gU1RJQ0tZX0RJUkVDVElPTlMuc29tZShkaXIgPT4gISFlbGVtZW50LnN0eWxlW2Rpcl0pO1xuICAgIGlmICghaGFzRGlyZWN0aW9uKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJyc7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fc3RpY2tDZWxsQ3NzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgc3RpY2t5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQgYnkgYWRkaW5nIHRoZSBzdGlja3kgc3R5bGUgY2xhc3MsIGNoYW5naW5nIHBvc2l0aW9uXG4gICAqIHRvIGJlIHN0aWNreSAoYW5kIC13ZWJraXQtc3RpY2t5KSwgc2V0dGluZyB0aGUgYXBwcm9wcmlhdGUgekluZGV4LCBhbmQgYWRkaW5nIGEgc3RpY2t5XG4gICAqIGRpcmVjdGlvbiBhbmQgdmFsdWUuXG4gICAqL1xuICBfYWRkU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIGRpcjogU3RpY2t5RGlyZWN0aW9uLCBkaXJWYWx1ZTogbnVtYmVyKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgZWxlbWVudC5zdHlsZVtkaXJdID0gYCR7ZGlyVmFsdWV9cHhgO1xuICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCArPSAncG9zaXRpb246IC13ZWJraXQtc3RpY2t5OyBwb3NpdGlvbjogc3RpY2t5OyAnO1xuICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gdGhpcy5fZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgd2hhdCB0aGUgei1pbmRleCBzaG91bGQgYmUgZm9yIHRoZSBlbGVtZW50LCBkZXBlbmRpbmcgb24gd2hhdCBkaXJlY3Rpb25zICh0b3AsXG4gICAqIGJvdHRvbSwgbGVmdCwgcmlnaHQpIGhhdmUgYmVlbiBzZXQuIEl0IHNob3VsZCBiZSB0cnVlIHRoYXQgZWxlbWVudHMgd2l0aCBhIHRvcCBkaXJlY3Rpb25cbiAgICogc2hvdWxkIGhhdmUgdGhlIGhpZ2hlc3QgaW5kZXggc2luY2UgdGhlc2UgYXJlIGVsZW1lbnRzIGxpa2UgYSB0YWJsZSBoZWFkZXIuIElmIGFueSBvZiB0aG9zZVxuICAgKiBlbGVtZW50cyBhcmUgYWxzbyBzdGlja3kgaW4gYW5vdGhlciBkaXJlY3Rpb24sIHRoZW4gdGhleSBzaG91bGQgYXBwZWFyIGFib3ZlIG90aGVyIGVsZW1lbnRzXG4gICAqIHRoYXQgYXJlIG9ubHkgc3RpY2t5IHRvcCAoZS5nLiBhIHN0aWNreSBjb2x1bW4gb24gYSBzdGlja3kgaGVhZGVyKS4gQm90dG9tLXN0aWNreSBlbGVtZW50c1xuICAgKiAoZS5nLiBmb290ZXIgcm93cykgc2hvdWxkIHRoZW4gYmUgbmV4dCBpbiB0aGUgb3JkZXJpbmcgc3VjaCB0aGF0IHRoZXkgYXJlIGJlbG93IHRoZSBoZWFkZXJcbiAgICogYnV0IGFib3ZlIGFueSBub24tc3RpY2t5IGVsZW1lbnRzLiBGaW5hbGx5LCBsZWZ0L3JpZ2h0IHN0aWNreSBlbGVtZW50cyAoZS5nLiBzdGlja3kgY29sdW1ucylcbiAgICogc2hvdWxkIG1pbmltYWxseSBpbmNyZW1lbnQgc28gdGhhdCB0aGV5IGFyZSBhYm92ZSBub24tc3RpY2t5IGVsZW1lbnRzIGJ1dCBiZWxvdyB0b3AgYW5kIGJvdHRvbVxuICAgKiBlbGVtZW50cy5cbiAgICovXG4gIF9nZXRDYWxjdWxhdGVkWkluZGV4KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCB6SW5kZXhJbmNyZW1lbnRzID0ge1xuICAgICAgdG9wOiAxMDAsXG4gICAgICBib3R0b206IDEwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIHJpZ2h0OiAxLFxuICAgIH07XG5cbiAgICBsZXQgekluZGV4ID0gMDtcbiAgICAvLyBVc2UgYEl0ZXJhYmxlYCBpbnN0ZWFkIG9mIGBBcnJheWAgYmVjYXVzZSBUeXBlU2NyaXB0LCBhcyBvZiAzLjYuMyxcbiAgICAvLyBsb3NlcyB0aGUgYXJyYXkgZ2VuZXJpYyB0eXBlIGluIHRoZSBgZm9yIG9mYC4gQnV0IHdlICphbHNvKiBoYXZlIHRvIHVzZSBgQXJyYXlgIGJlY2F1c2VcbiAgICAvLyB0eXBlc2NyaXB0IHdvbid0IGl0ZXJhdGUgb3ZlciBhbiBgSXRlcmFibGVgIHVubGVzcyB5b3UgY29tcGlsZSB3aXRoIGAtLWRvd25sZXZlbEl0ZXJhdGlvbmBcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBTVElDS1lfRElSRUNUSU9OUyBhcyBJdGVyYWJsZTxTdGlja3lEaXJlY3Rpb24+ICYgQXJyYXk8U3RpY2t5RGlyZWN0aW9uPikge1xuICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbZGlyXSkge1xuICAgICAgICB6SW5kZXggKz0gekluZGV4SW5jcmVtZW50c1tkaXJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB6SW5kZXggPyBgJHt6SW5kZXh9YCA6ICcnO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHdpZHRocyBmb3IgZWFjaCBjZWxsIGluIHRoZSBwcm92aWRlZCByb3cuICovXG4gIF9nZXRDZWxsV2lkdGhzKHJvdzogSFRNTEVsZW1lbnQpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgY2VsbFdpZHRoczogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBmaXJzdFJvd0NlbGxzID0gcm93LmNoaWxkcmVuO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3RSb3dDZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGNlbGw6IEhUTUxFbGVtZW50ID0gZmlyc3RSb3dDZWxsc1tpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNlbGxXaWR0aHMucHVzaChjZWxsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2VsbFdpZHRocztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbnMgb2YgZWFjaCBzdGlja3kgY29sdW1uIGNlbGwsIHdoaWNoIHdpbGwgYmUgdGhlXG4gICAqIGFjY3VtdWxhdGlvbiBvZiBhbGwgc3RpY2t5IGNvbHVtbiBjZWxsIHdpZHRocyB0byB0aGUgbGVmdCBhbmQgcmlnaHQsIHJlc3BlY3RpdmVseS5cbiAgICogTm9uLXN0aWNreSBjZWxscyBkbyBub3QgbmVlZCB0byBoYXZlIGEgdmFsdWUgc2V0IHNpbmNlIHRoZWlyIHBvc2l0aW9ucyB3aWxsIG5vdCBiZSBhcHBsaWVkLlxuICAgKi9cbiAgX2dldFN0aWNreVN0YXJ0Q29sdW1uUG9zaXRpb25zKHdpZHRoczogbnVtYmVyW10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2lkdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzW2ldKSB7XG4gICAgICAgIHBvc2l0aW9uc1tpXSA9IG5leHRQb3NpdGlvbjtcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHdpZHRoc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyBvZiBlYWNoIHN0aWNreSBjb2x1bW4gY2VsbCwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICogYWNjdW11bGF0aW9uIG9mIGFsbCBzdGlja3kgY29sdW1uIGNlbGwgd2lkdGhzIHRvIHRoZSBsZWZ0IGFuZCByaWdodCwgcmVzcGVjdGl2ZWx5LlxuICAgKiBOb24tc3RpY2t5IGNlbGxzIGRvIG5vdCBuZWVkIHRvIGhhdmUgYSB2YWx1ZSBzZXQgc2luY2UgdGhlaXIgcG9zaXRpb25zIHdpbGwgbm90IGJlIGFwcGxpZWQuXG4gICAqL1xuICBfZ2V0U3RpY2t5RW5kQ29sdW1uUG9zaXRpb25zKHdpZHRoczogbnVtYmVyW10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gMDtcblxuICAgIGZvciAobGV0IGkgPSB3aWR0aHMubGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzW2ldKSB7XG4gICAgICAgIHBvc2l0aW9uc1tpXSA9IG5leHRQb3NpdGlvbjtcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHdpZHRoc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9XG59XG4iXX0=