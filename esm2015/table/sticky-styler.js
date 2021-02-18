/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * List of all possible directions that can be used for sticky positioning.
 * @docs-private
 */
export const STICKY_DIRECTIONS = ['top', 'bottom', 'left', 'right'];
/**
 * Applies and removes sticky positioning styles to the `CdkTable` rows and columns cells.
 * @docs-private
 */
export class StickyStyler {
    /**
     * @param _isNativeHtmlTable Whether the sticky logic should be based on a table
     *     that uses the native `<table>` element.
     * @param _stickCellCss The CSS class that will be applied to every row/cell that has
     *     sticky positioning applied.
     * @param direction The directionality context of the table (ltr/rtl); affects column positioning
     *     by reversing left/right positions.
     * @param _isBrowser Whether the table is currently being rendered on the server or the client.
     * @param _needsPositionStickyOnElement Whether we need to specify position: sticky on cells
     *     using inline styles. If false, it is assumed that position: sticky is included in
     *     the component stylesheet for _stickCellCss.
     * @param _positionListener A listener that is notified of changes to sticky rows/columns
     *     and their dimensions.
     */
    constructor(_isNativeHtmlTable, _stickCellCss, direction, _coalescedStyleScheduler, _isBrowser = true, _needsPositionStickyOnElement = true, _positionListener) {
        this._isNativeHtmlTable = _isNativeHtmlTable;
        this._stickCellCss = _stickCellCss;
        this.direction = direction;
        this._coalescedStyleScheduler = _coalescedStyleScheduler;
        this._isBrowser = _isBrowser;
        this._needsPositionStickyOnElement = _needsPositionStickyOnElement;
        this._positionListener = _positionListener;
        this._cachedCellWidths = [];
        this._borderCellCss = {
            'top': `${_stickCellCss}-border-elem-top`,
            'bottom': `${_stickCellCss}-border-elem-bottom`,
            'left': `${_stickCellCss}-border-elem-left`,
            'right': `${_stickCellCss}-border-elem-right`,
        };
    }
    /**
     * Clears the sticky positioning styles from the row and its cells by resetting the `position`
     * style, setting the zIndex to 0, and unsetting each provided sticky direction.
     * @param rows The list of rows that should be cleared from sticking in the provided directions
     * @param stickyDirections The directions that should no longer be set as sticky on the rows.
     */
    clearStickyPositioning(rows, stickyDirections) {
        const elementsToClear = [];
        for (const row of rows) {
            // If the row isn't an element (e.g. if it's an `ng-container`),
            // it won't have inline styles or `children` so we skip it.
            if (row.nodeType !== row.ELEMENT_NODE) {
                continue;
            }
            elementsToClear.push(row);
            for (let i = 0; i < row.children.length; i++) {
                elementsToClear.push(row.children[i]);
            }
        }
        // Coalesce with sticky row/column updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            for (const element of elementsToClear) {
                this._removeStickyStyle(element, stickyDirections);
            }
        });
    }
    /**
     * Applies sticky left and right positions to the cells of each row according to the sticky
     * states of the rendered column definitions.
     * @param rows The rows that should have its set of cells stuck according to the sticky states.
     * @param stickyStartStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the start of the row.
     * @param stickyEndStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the end of the row.
     * @param recalculateCellWidths Whether the sticky styler should recalculate the width of each
     *     column cell. If `false` cached widths will be used instead.
     */
    updateStickyColumns(rows, stickyStartStates, stickyEndStates, recalculateCellWidths = true) {
        if (!rows.length || !this._isBrowser || !(stickyStartStates.some(state => state) ||
            stickyEndStates.some(state => state))) {
            if (this._positionListener) {
                this._positionListener.stickyColumnsUpdated({ sizes: [] });
                this._positionListener.stickyEndColumnsUpdated({ sizes: [] });
            }
            return;
        }
        const firstRow = rows[0];
        const numCells = firstRow.children.length;
        const cellWidths = this._getCellWidths(firstRow, recalculateCellWidths);
        const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
        const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
        const lastStickyStart = stickyStartStates.lastIndexOf(true);
        const firstStickyEnd = stickyEndStates.indexOf(true);
        // Coalesce with sticky row updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            const isRtl = this.direction === 'rtl';
            const start = isRtl ? 'right' : 'left';
            const end = isRtl ? 'left' : 'right';
            for (const row of rows) {
                for (let i = 0; i < numCells; i++) {
                    const cell = row.children[i];
                    if (stickyStartStates[i]) {
                        this._addStickyStyle(cell, start, startPositions[i], i === lastStickyStart);
                    }
                    if (stickyEndStates[i]) {
                        this._addStickyStyle(cell, end, endPositions[i], i === firstStickyEnd);
                    }
                }
            }
            if (this._positionListener) {
                this._positionListener.stickyColumnsUpdated({
                    sizes: lastStickyStart === -1 ?
                        [] :
                        cellWidths
                            .slice(0, lastStickyStart + 1)
                            .map((width, index) => stickyStartStates[index] ? width : null)
                });
                this._positionListener.stickyEndColumnsUpdated({
                    sizes: firstStickyEnd === -1 ?
                        [] :
                        cellWidths
                            .slice(firstStickyEnd)
                            .map((width, index) => stickyEndStates[index + firstStickyEnd] ? width : null)
                            .reverse()
                });
            }
        });
    }
    /**
     * Applies sticky positioning to the row's cells if using the native table layout, and to the
     * row itself otherwise.
     * @param rowsToStick The list of rows that should be stuck according to their corresponding
     *     sticky state and to the provided top or bottom position.
     * @param stickyStates A list of boolean states where each state represents whether the row
     *     should be stuck in the particular top or bottom position.
     * @param position The position direction in which the row should be stuck if that row should be
     *     sticky.
     *
     */
    stickRows(rowsToStick, stickyStates, position) {
        // Since we can't measure the rows on the server, we can't stick the rows properly.
        if (!this._isBrowser) {
            return;
        }
        // If positioning the rows to the bottom, reverse their order when evaluating the sticky
        // position such that the last row stuck will be "bottom: 0px" and so on. Note that the
        // sticky states need to be reversed as well.
        const rows = position === 'bottom' ? rowsToStick.slice().reverse() : rowsToStick;
        const states = position === 'bottom' ? stickyStates.slice().reverse() : stickyStates;
        // Measure row heights all at once before adding sticky styles to reduce layout thrashing.
        const stickyOffsets = [];
        const stickyCellHeights = [];
        const elementsToStick = [];
        for (let rowIndex = 0, stickyOffset = 0; rowIndex < rows.length; rowIndex++) {
            stickyOffsets[rowIndex] = stickyOffset;
            if (!states[rowIndex]) {
                continue;
            }
            const row = rows[rowIndex];
            elementsToStick[rowIndex] = this._isNativeHtmlTable ?
                Array.from(row.children) : [row];
            const height = row.getBoundingClientRect().height;
            stickyOffset += height;
            stickyCellHeights[rowIndex] = height;
        }
        const borderedRowIndex = states.lastIndexOf(true);
        // Coalesce with other sticky row updates (top/bottom), sticky columns updates
        // (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            var _a, _b;
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                if (!states[rowIndex]) {
                    continue;
                }
                const offset = stickyOffsets[rowIndex];
                const isBorderedRowIndex = rowIndex === borderedRowIndex;
                for (const element of elementsToStick[rowIndex]) {
                    this._addStickyStyle(element, position, offset, isBorderedRowIndex);
                }
            }
            if (position === 'top') {
                (_a = this._positionListener) === null || _a === void 0 ? void 0 : _a.stickyHeaderRowsUpdated({ sizes: stickyCellHeights, elements: elementsToStick });
            }
            else {
                (_b = this._positionListener) === null || _b === void 0 ? void 0 : _b.stickyFooterRowsUpdated({ sizes: stickyCellHeights, elements: elementsToStick });
            }
        });
    }
    /**
     * When using the native table in Safari, sticky footer cells do not stick. The only way to stick
     * footer rows is to apply sticky styling to the tfoot container. This should only be done if
     * all footer rows are sticky. If not all footer rows are sticky, remove sticky positioning from
     * the tfoot element.
     */
    updateStickyFooterContainer(tableElement, stickyStates) {
        if (!this._isNativeHtmlTable) {
            return;
        }
        const tfoot = tableElement.querySelector('tfoot');
        // Coalesce with other sticky updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.schedule(() => {
            if (stickyStates.some(state => !state)) {
                this._removeStickyStyle(tfoot, ['bottom']);
            }
            else {
                this._addStickyStyle(tfoot, 'bottom', 0, false);
            }
        });
    }
    /**
     * Removes the sticky style on the element by removing the sticky cell CSS class, re-evaluating
     * the zIndex, removing each of the provided sticky directions, and removing the
     * sticky position if there are no more directions.
     */
    _removeStickyStyle(element, stickyDirections) {
        for (const dir of stickyDirections) {
            element.style[dir] = '';
            element.classList.remove(this._borderCellCss[dir]);
        }
        // If the element no longer has any more sticky directions, remove sticky positioning and
        // the sticky CSS class.
        // Short-circuit checking element.style[dir] for stickyDirections as they
        // were already removed above.
        const hasDirection = STICKY_DIRECTIONS.some(dir => stickyDirections.indexOf(dir) === -1 && element.style[dir]);
        if (hasDirection) {
            element.style.zIndex = this._getCalculatedZIndex(element);
        }
        else {
            // When not hasDirection, _getCalculatedZIndex will always return ''.
            element.style.zIndex = '';
            if (this._needsPositionStickyOnElement) {
                element.style.position = '';
            }
            element.classList.remove(this._stickCellCss);
        }
    }
    /**
     * Adds the sticky styling to the element by adding the sticky style class, changing position
     * to be sticky (and -webkit-sticky), setting the appropriate zIndex, and adding a sticky
     * direction and value.
     */
    _addStickyStyle(element, dir, dirValue, isBorderElement) {
        element.classList.add(this._stickCellCss);
        if (isBorderElement) {
            element.classList.add(this._borderCellCss[dir]);
        }
        element.style[dir] = `${dirValue}px`;
        element.style.zIndex = this._getCalculatedZIndex(element);
        if (this._needsPositionStickyOnElement) {
            element.style.cssText += 'position: -webkit-sticky; position: sticky; ';
        }
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
     */
    _getCalculatedZIndex(element) {
        const zIndexIncrements = {
            top: 100,
            bottom: 10,
            left: 1,
            right: 1,
        };
        let zIndex = 0;
        // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
        // loses the array generic type in the `for of`. But we *also* have to use `Array` because
        // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
        for (const dir of STICKY_DIRECTIONS) {
            if (element.style[dir]) {
                zIndex += zIndexIncrements[dir];
            }
        }
        return zIndex ? `${zIndex}` : '';
    }
    /** Gets the widths for each cell in the provided row. */
    _getCellWidths(row, recalculateCellWidths = true) {
        if (!recalculateCellWidths && this._cachedCellWidths.length) {
            return this._cachedCellWidths;
        }
        const cellWidths = [];
        const firstRowCells = row.children;
        for (let i = 0; i < firstRowCells.length; i++) {
            let cell = firstRowCells[i];
            cellWidths.push(cell.getBoundingClientRect().width);
        }
        this._cachedCellWidths = cellWidths;
        return cellWidths;
    }
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     */
    _getStickyStartColumnPositions(widths, stickyStates) {
        const positions = [];
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
     */
    _getStickyEndColumnPositions(widths, stickyStates) {
        const positions = [];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFZSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUd2Rjs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUl2Qjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsWUFBb0Isa0JBQTJCLEVBQzNCLGFBQXFCLEVBQ3RCLFNBQW9CLEVBQ25CLHdCQUFrRCxFQUNsRCxhQUFhLElBQUksRUFDUixnQ0FBZ0MsSUFBSSxFQUNwQyxpQkFBNkM7UUFOdEQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1FBQzNCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDbkIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtRQUNsRCxlQUFVLEdBQVYsVUFBVSxDQUFPO1FBQ1Isa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFPO1FBQ3BDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBNEI7UUF2QmxFLHNCQUFpQixHQUFhLEVBQUUsQ0FBQztRQXdCdkMsSUFBSSxDQUFDLGNBQWMsR0FBRztZQUNwQixLQUFLLEVBQUUsR0FBRyxhQUFhLGtCQUFrQjtZQUN6QyxRQUFRLEVBQUUsR0FBRyxhQUFhLHFCQUFxQjtZQUMvQyxNQUFNLEVBQUUsR0FBRyxhQUFhLG1CQUFtQjtZQUMzQyxPQUFPLEVBQUUsR0FBRyxhQUFhLG9CQUFvQjtTQUM5QyxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsc0JBQXNCLENBQUMsSUFBbUIsRUFBRSxnQkFBbUM7UUFDN0UsTUFBTSxlQUFlLEdBQWtCLEVBQUUsQ0FB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LFVBQVUsQ0FBQztRQUNwQyxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILDhCQUE4QixDQUFDLE1BQWdCLEVBQUUsWUFBdUI7UUFDdEUsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBQy9CLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVyQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDNUIsWUFBWSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMzQjtTQUNGO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCw0QkFBNEIsQ0FBQyxNQUFnQixFQUFFLFlBQXVCO1FBQ3BFLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztRQUMvQixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFFckIsS0FBSyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7Z0JBQzVCLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0I7U0FDRjtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIERpcmVjdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB3aGVuIHNldHRpbmcgc3RpY2t5IHBvc2l0aW9uaW5nLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXJ9IGZyb20gJy4vY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlcic7XG5pbXBvcnQge1N0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXJ9IGZyb20gJy4vc3RpY2t5LXBvc2l0aW9uLWxpc3RlbmVyJztcblxuZXhwb3J0IHR5cGUgU3RpY2t5RGlyZWN0aW9uID0gJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCc7XG5cbi8qKlxuICogTGlzdCBvZiBhbGwgcG9zc2libGUgZGlyZWN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGlja3kgcG9zaXRpb25pbmcuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBTVElDS1lfRElSRUNUSU9OUzogU3RpY2t5RGlyZWN0aW9uW10gPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG5cbi8qKlxuICogQXBwbGllcyBhbmQgcmVtb3ZlcyBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIHRvIHRoZSBgQ2RrVGFibGVgIHJvd3MgYW5kIGNvbHVtbnMgY2VsbHMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGlja3lTdHlsZXIge1xuICBwcml2YXRlIF9jYWNoZWRDZWxsV2lkdGhzOiBudW1iZXJbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IF9ib3JkZXJDZWxsQ3NzOiBSZWFkb25seTx7W2QgaW4gU3RpY2t5RGlyZWN0aW9uXTogc3RyaW5nfT47XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBfaXNOYXRpdmVIdG1sVGFibGUgV2hldGhlciB0aGUgc3RpY2t5IGxvZ2ljIHNob3VsZCBiZSBiYXNlZCBvbiBhIHRhYmxlXG4gICAqICAgICB0aGF0IHVzZXMgdGhlIG5hdGl2ZSBgPHRhYmxlPmAgZWxlbWVudC5cbiAgICogQHBhcmFtIF9zdGlja0NlbGxDc3MgVGhlIENTUyBjbGFzcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byBldmVyeSByb3cvY2VsbCB0aGF0IGhhc1xuICAgKiAgICAgc3RpY2t5IHBvc2l0aW9uaW5nIGFwcGxpZWQuXG4gICAqIEBwYXJhbSBkaXJlY3Rpb24gVGhlIGRpcmVjdGlvbmFsaXR5IGNvbnRleHQgb2YgdGhlIHRhYmxlIChsdHIvcnRsKTsgYWZmZWN0cyBjb2x1bW4gcG9zaXRpb25pbmdcbiAgICogICAgIGJ5IHJldmVyc2luZyBsZWZ0L3JpZ2h0IHBvc2l0aW9ucy5cbiAgICogQHBhcmFtIF9pc0Jyb3dzZXIgV2hldGhlciB0aGUgdGFibGUgaXMgY3VycmVudGx5IGJlaW5nIHJlbmRlcmVkIG9uIHRoZSBzZXJ2ZXIgb3IgdGhlIGNsaWVudC5cbiAgICogQHBhcmFtIF9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50IFdoZXRoZXIgd2UgbmVlZCB0byBzcGVjaWZ5IHBvc2l0aW9uOiBzdGlja3kgb24gY2VsbHNcbiAgICogICAgIHVzaW5nIGlubGluZSBzdHlsZXMuIElmIGZhbHNlLCBpdCBpcyBhc3N1bWVkIHRoYXQgcG9zaXRpb246IHN0aWNreSBpcyBpbmNsdWRlZCBpblxuICAgKiAgICAgdGhlIGNvbXBvbmVudCBzdHlsZXNoZWV0IGZvciBfc3RpY2tDZWxsQ3NzLlxuICAgKiBAcGFyYW0gX3Bvc2l0aW9uTGlzdGVuZXIgQSBsaXN0ZW5lciB0aGF0IGlzIG5vdGlmaWVkIG9mIGNoYW5nZXMgdG8gc3RpY2t5IHJvd3MvY29sdW1uc1xuICAgKiAgICAgYW5kIHRoZWlyIGRpbWVuc2lvbnMuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pc05hdGl2ZUh0bWxUYWJsZTogYm9vbGVhbixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfc3RpY2tDZWxsQ3NzOiBzdHJpbmcsXG4gICAgICAgICAgICAgIHB1YmxpYyBkaXJlY3Rpb246IERpcmVjdGlvbixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfY29hbGVzY2VkU3R5bGVTY2hlZHVsZXI6IF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfaXNCcm93c2VyID0gdHJ1ZSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSByZWFkb25seSBfbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCA9IHRydWUsXG4gICAgICAgICAgICAgIHByaXZhdGUgcmVhZG9ubHkgX3Bvc2l0aW9uTGlzdGVuZXI/OiBTdGlja3lQb3NpdGlvbmluZ0xpc3RlbmVyKSB7XG4gICAgdGhpcy5fYm9yZGVyQ2VsbENzcyA9IHtcbiAgICAgICd0b3AnOiBgJHtfc3RpY2tDZWxsQ3NzfS1ib3JkZXItZWxlbS10b3BgLFxuICAgICAgJ2JvdHRvbSc6IGAke19zdGlja0NlbGxDc3N9LWJvcmRlci1lbGVtLWJvdHRvbWAsXG4gICAgICAnbGVmdCc6IGAke19zdGlja0NlbGxDc3N9LWJvcmRlci1lbGVtLWxlZnRgLFxuICAgICAgJ3JpZ2h0JzogYCR7X3N0aWNrQ2VsbENzc30tYm9yZGVyLWVsZW0tcmlnaHRgLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIGZyb20gdGhlIHJvdyBhbmQgaXRzIGNlbGxzIGJ5IHJlc2V0dGluZyB0aGUgYHBvc2l0aW9uYFxuICAgKiBzdHlsZSwgc2V0dGluZyB0aGUgekluZGV4IHRvIDAsIGFuZCB1bnNldHRpbmcgZWFjaCBwcm92aWRlZCBzdGlja3kgZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gcm93cyBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIGNsZWFyZWQgZnJvbSBzdGlja2luZyBpbiB0aGUgcHJvdmlkZWQgZGlyZWN0aW9uc1xuICAgKiBAcGFyYW0gc3RpY2t5RGlyZWN0aW9ucyBUaGUgZGlyZWN0aW9ucyB0aGF0IHNob3VsZCBubyBsb25nZXIgYmUgc2V0IGFzIHN0aWNreSBvbiB0aGUgcm93cy5cbiAgICovXG4gIGNsZWFyU3RpY2t5UG9zaXRpb25pbmcocm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5RGlyZWN0aW9uczogU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICBjb25zdCBlbGVtZW50c1RvQ2xlYXI6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAvLyBJZiB0aGUgcm93IGlzbid0IGFuIGVsZW1lbnQgKGUuZy4gaWYgaXQncyBhbiBgbmctY29udGFpbmVyYCksXG4gICAgICAvLyBpdCB3b24ndCBoYXZlIGlubGluZSBzdHlsZXMgb3IgYGNoaWxkcmVuYCBzbyB3ZSBza2lwIGl0LlxuICAgICAgaWYgKHJvdy5ub2RlVHlwZSAhPT0gcm93LkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZWxlbWVudHNUb0NsZWFyLnB1c2gocm93KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVsZW1lbnRzVG9DbGVhci5wdXNoKHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBzdGlja3kgcm93L2NvbHVtbiB1cGRhdGVzIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50c1RvQ2xlYXIpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudCwgc3RpY2t5RGlyZWN0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBzdGlja3kgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIHRvIHRoZSBjZWxscyBvZiBlYWNoIHJvdyBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreVxuICAgKiBzdGF0ZXMgb2YgdGhlIHJlbmRlcmVkIGNvbHVtbiBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIHJvd3MgVGhlIHJvd3MgdGhhdCBzaG91bGQgaGF2ZSBpdHMgc2V0IG9mIGNlbGxzIHN0dWNrIGFjY29yZGluZyB0byB0aGUgc3RpY2t5IHN0YXRlcy5cbiAgICogQHBhcmFtIHN0aWNreVN0YXJ0U3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb3cuXG4gICAqIEBwYXJhbSBzdGlja3lFbmRTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSBjZWxsXG4gICAqICAgICBpbiB0aGlzIGluZGV4IHBvc2l0aW9uIHNob3VsZCBiZSBzdHVjayB0byB0aGUgZW5kIG9mIHRoZSByb3cuXG4gICAqIEBwYXJhbSByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgV2hldGhlciB0aGUgc3RpY2t5IHN0eWxlciBzaG91bGQgcmVjYWxjdWxhdGUgdGhlIHdpZHRoIG9mIGVhY2hcbiAgICogICAgIGNvbHVtbiBjZWxsLiBJZiBgZmFsc2VgIGNhY2hlZCB3aWR0aHMgd2lsbCBiZSB1c2VkIGluc3RlYWQuXG4gICAqL1xuICB1cGRhdGVTdGlja3lDb2x1bW5zKFxuICAgICAgcm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5U3RhcnRTdGF0ZXM6IGJvb2xlYW5bXSwgc3RpY2t5RW5kU3RhdGVzOiBib29sZWFuW10sXG4gICAgICByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlKSB7XG4gICAgaWYgKCFyb3dzLmxlbmd0aCB8fCAhdGhpcy5faXNCcm93c2VyIHx8ICEoc3RpY2t5U3RhcnRTdGF0ZXMuc29tZShzdGF0ZSA9PiBzdGF0ZSkgfHxcbiAgICAgICAgc3RpY2t5RW5kU3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpKSkge1xuICAgICAgaWYgKHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lci5zdGlja3lDb2x1bW5zVXBkYXRlZCh7c2l6ZXM6IFtdfSk7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIuc3RpY2t5RW5kQ29sdW1uc1VwZGF0ZWQoe3NpemVzOiBbXX0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlyc3RSb3cgPSByb3dzWzBdO1xuICAgIGNvbnN0IG51bUNlbGxzID0gZmlyc3RSb3cuY2hpbGRyZW4ubGVuZ3RoO1xuICAgIGNvbnN0IGNlbGxXaWR0aHM6IG51bWJlcltdID0gdGhpcy5fZ2V0Q2VsbFdpZHRocyhmaXJzdFJvdywgcmVjYWxjdWxhdGVDZWxsV2lkdGhzKTtcblxuICAgIGNvbnN0IHN0YXJ0UG9zaXRpb25zID0gdGhpcy5fZ2V0U3RpY2t5U3RhcnRDb2x1bW5Qb3NpdGlvbnMoY2VsbFdpZHRocywgc3RpY2t5U3RhcnRTdGF0ZXMpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreUVuZENvbHVtblBvc2l0aW9ucyhjZWxsV2lkdGhzLCBzdGlja3lFbmRTdGF0ZXMpO1xuXG4gICAgY29uc3QgbGFzdFN0aWNreVN0YXJ0ID0gc3RpY2t5U3RhcnRTdGF0ZXMubGFzdEluZGV4T2YodHJ1ZSk7XG4gICAgY29uc3QgZmlyc3RTdGlja3lFbmQgPSBzdGlja3lFbmRTdGF0ZXMuaW5kZXhPZih0cnVlKTtcblxuICAgIC8vIENvYWxlc2NlIHdpdGggc3RpY2t5IHJvdyB1cGRhdGVzIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXJlY3Rpb24gPT09ICdydGwnO1xuICAgICAgY29uc3Qgc3RhcnQgPSBpc1J0bCA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICBjb25zdCBlbmQgPSBpc1J0bCA/ICdsZWZ0JyA6ICdyaWdodCc7XG5cbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DZWxsczsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY2VsbCA9IHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICBpZiAoc3RpY2t5U3RhcnRTdGF0ZXNbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGNlbGwsIHN0YXJ0LCBzdGFydFBvc2l0aW9uc1tpXSwgaSA9PT0gbGFzdFN0aWNreVN0YXJ0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc3RpY2t5RW5kU3RhdGVzW2ldKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShjZWxsLCBlbmQsIGVuZFBvc2l0aW9uc1tpXSwgaSA9PT0gZmlyc3RTdGlja3lFbmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fcG9zaXRpb25MaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyLnN0aWNreUNvbHVtbnNVcGRhdGVkKHtcbiAgICAgICAgICBzaXplczogbGFzdFN0aWNreVN0YXJ0ID09PSAtMSA/XG4gICAgICAgICAgICBbXSA6XG4gICAgICAgICAgICBjZWxsV2lkdGhzXG4gICAgICAgICAgICAgICAgLnNsaWNlKDAsIGxhc3RTdGlja3lTdGFydCArIDEpXG4gICAgICAgICAgICAgICAgLm1hcCgod2lkdGgsIGluZGV4KSA9PiBzdGlja3lTdGFydFN0YXRlc1tpbmRleF0gPyB3aWR0aCA6IG51bGwpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyLnN0aWNreUVuZENvbHVtbnNVcGRhdGVkKHtcbiAgICAgICAgICBzaXplczogZmlyc3RTdGlja3lFbmQgPT09IC0xID9cbiAgICAgICAgICAgIFtdIDpcbiAgICAgICAgICAgIGNlbGxXaWR0aHNcbiAgICAgICAgICAgICAgICAuc2xpY2UoZmlyc3RTdGlja3lFbmQpXG4gICAgICAgICAgICAgICAgLm1hcCgod2lkdGgsIGluZGV4KSA9PiBzdGlja3lFbmRTdGF0ZXNbaW5kZXggKyBmaXJzdFN0aWNreUVuZF0gPyB3aWR0aCA6IG51bGwpXG4gICAgICAgICAgICAgICAgLnJldmVyc2UoKVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHN0aWNreSBwb3NpdGlvbmluZyB0byB0aGUgcm93J3MgY2VsbHMgaWYgdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBsYXlvdXQsIGFuZCB0byB0aGVcbiAgICogcm93IGl0c2VsZiBvdGhlcndpc2UuXG4gICAqIEBwYXJhbSByb3dzVG9TdGljayBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIHN0dWNrIGFjY29yZGluZyB0byB0aGVpciBjb3JyZXNwb25kaW5nXG4gICAqICAgICBzdGlja3kgc3RhdGUgYW5kIHRvIHRoZSBwcm92aWRlZCB0b3Agb3IgYm90dG9tIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gc3RpY2t5U3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgcm93XG4gICAqICAgICBzaG91bGQgYmUgc3R1Y2sgaW4gdGhlIHBhcnRpY3VsYXIgdG9wIG9yIGJvdHRvbSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHJvdyBzaG91bGQgYmUgc3R1Y2sgaWYgdGhhdCByb3cgc2hvdWxkIGJlXG4gICAqICAgICBzdGlja3kuXG4gICAqXG4gICAqL1xuICBzdGlja1Jvd3Mocm93c1RvU3RpY2s6IEhUTUxFbGVtZW50W10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdLCBwb3NpdGlvbjogJ3RvcCcgfCAnYm90dG9tJykge1xuICAgIC8vIFNpbmNlIHdlIGNhbid0IG1lYXN1cmUgdGhlIHJvd3Mgb24gdGhlIHNlcnZlciwgd2UgY2FuJ3Qgc3RpY2sgdGhlIHJvd3MgcHJvcGVybHkuXG4gICAgaWYgKCF0aGlzLl9pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiBwb3NpdGlvbmluZyB0aGUgcm93cyB0byB0aGUgYm90dG9tLCByZXZlcnNlIHRoZWlyIG9yZGVyIHdoZW4gZXZhbHVhdGluZyB0aGUgc3RpY2t5XG4gICAgLy8gcG9zaXRpb24gc3VjaCB0aGF0IHRoZSBsYXN0IHJvdyBzdHVjayB3aWxsIGJlIFwiYm90dG9tOiAwcHhcIiBhbmQgc28gb24uIE5vdGUgdGhhdCB0aGVcbiAgICAvLyBzdGlja3kgc3RhdGVzIG5lZWQgdG8gYmUgcmV2ZXJzZWQgYXMgd2VsbC5cbiAgICBjb25zdCByb3dzID0gcG9zaXRpb24gPT09ICdib3R0b20nID8gcm93c1RvU3RpY2suc2xpY2UoKS5yZXZlcnNlKCkgOiByb3dzVG9TdGljaztcbiAgICBjb25zdCBzdGF0ZXMgPSBwb3NpdGlvbiA9PT0gJ2JvdHRvbScgPyBzdGlja3lTdGF0ZXMuc2xpY2UoKS5yZXZlcnNlKCkgOiBzdGlja3lTdGF0ZXM7XG5cbiAgICAvLyBNZWFzdXJlIHJvdyBoZWlnaHRzIGFsbCBhdCBvbmNlIGJlZm9yZSBhZGRpbmcgc3RpY2t5IHN0eWxlcyB0byByZWR1Y2UgbGF5b3V0IHRocmFzaGluZy5cbiAgICBjb25zdCBzdGlja3lPZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IHN0aWNreUNlbGxIZWlnaHRzOiAobnVtYmVyfHVuZGVmaW5lZClbXSA9IFtdO1xuICAgIGNvbnN0IGVsZW1lbnRzVG9TdGljazogSFRNTEVsZW1lbnRbXVtdID0gW107XG4gICAgZm9yIChsZXQgcm93SW5kZXggPSAwLCBzdGlja3lPZmZzZXQgPSAwOyByb3dJbmRleCA8IHJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICBzdGlja3lPZmZzZXRzW3Jvd0luZGV4XSA9IHN0aWNreU9mZnNldDtcblxuICAgICAgaWYgKCFzdGF0ZXNbcm93SW5kZXhdKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByb3cgPSByb3dzW3Jvd0luZGV4XTtcbiAgICAgIGVsZW1lbnRzVG9TdGlja1tyb3dJbmRleF0gPSB0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSA/XG4gICAgICAgICAgQXJyYXkuZnJvbShyb3cuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10gOiBbcm93XTtcblxuICAgICAgY29uc3QgaGVpZ2h0ID0gcm93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgIHN0aWNreU9mZnNldCArPSBoZWlnaHQ7XG4gICAgICBzdGlja3lDZWxsSGVpZ2h0c1tyb3dJbmRleF0gPSBoZWlnaHQ7XG4gICAgfVxuXG4gICAgY29uc3QgYm9yZGVyZWRSb3dJbmRleCA9IHN0YXRlcy5sYXN0SW5kZXhPZih0cnVlKTtcblxuICAgIC8vIENvYWxlc2NlIHdpdGggb3RoZXIgc3RpY2t5IHJvdyB1cGRhdGVzICh0b3AvYm90dG9tKSwgc3RpY2t5IGNvbHVtbnMgdXBkYXRlc1xuICAgIC8vIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgIGZvciAobGV0IHJvd0luZGV4ID0gMDsgcm93SW5kZXggPCByb3dzLmxlbmd0aDsgcm93SW5kZXgrKykge1xuICAgICAgICBpZiAoIXN0YXRlc1tyb3dJbmRleF0pIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHN0aWNreU9mZnNldHNbcm93SW5kZXhdO1xuICAgICAgICBjb25zdCBpc0JvcmRlcmVkUm93SW5kZXggPSByb3dJbmRleCA9PT0gYm9yZGVyZWRSb3dJbmRleDtcbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzVG9TdGlja1tyb3dJbmRleF0pIHtcbiAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShlbGVtZW50LCBwb3NpdGlvbiwgb2Zmc2V0LCBpc0JvcmRlcmVkUm93SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwb3NpdGlvbiA9PT0gJ3RvcCcpIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lcj8uc3RpY2t5SGVhZGVyUm93c1VwZGF0ZWQoXG4gICAgICAgICAgICB7c2l6ZXM6IHN0aWNreUNlbGxIZWlnaHRzLCBlbGVtZW50czogZWxlbWVudHNUb1N0aWNrfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyPy5zdGlja3lGb290ZXJSb3dzVXBkYXRlZChcbiAgICAgICAgICAgIHtzaXplczogc3RpY2t5Q2VsbEhlaWdodHMsIGVsZW1lbnRzOiBlbGVtZW50c1RvU3RpY2t9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIHVzaW5nIHRoZSBuYXRpdmUgdGFibGUgaW4gU2FmYXJpLCBzdGlja3kgZm9vdGVyIGNlbGxzIGRvIG5vdCBzdGljay4gVGhlIG9ubHkgd2F5IHRvIHN0aWNrXG4gICAqIGZvb3RlciByb3dzIGlzIHRvIGFwcGx5IHN0aWNreSBzdHlsaW5nIHRvIHRoZSB0Zm9vdCBjb250YWluZXIuIFRoaXMgc2hvdWxkIG9ubHkgYmUgZG9uZSBpZlxuICAgKiBhbGwgZm9vdGVyIHJvd3MgYXJlIHN0aWNreS4gSWYgbm90IGFsbCBmb290ZXIgcm93cyBhcmUgc3RpY2t5LCByZW1vdmUgc3RpY2t5IHBvc2l0aW9uaW5nIGZyb21cbiAgICogdGhlIHRmb290IGVsZW1lbnQuXG4gICAqL1xuICB1cGRhdGVTdGlja3lGb290ZXJDb250YWluZXIodGFibGVFbGVtZW50OiBFbGVtZW50LCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSkge1xuICAgIGlmICghdGhpcy5faXNOYXRpdmVIdG1sVGFibGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0Zm9vdCA9IHRhYmxlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCd0Zm9vdCcpITtcblxuICAgIC8vIENvYWxlc2NlIHdpdGggb3RoZXIgc3RpY2t5IHVwZGF0ZXMgKGFuZCBwb3RlbnRpYWxseSBvdGhlciBjaGFuZ2VzIGxpa2UgY29sdW1uIHJlc2l6ZSkuXG4gICAgdGhpcy5fY29hbGVzY2VkU3R5bGVTY2hlZHVsZXIuc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgaWYgKHN0aWNreVN0YXRlcy5zb21lKHN0YXRlID0+ICFzdGF0ZSkpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUodGZvb3QsIFsnYm90dG9tJ10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUodGZvb3QsICdib3R0b20nLCAwLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgc3RpY2t5IHN0eWxlIG9uIHRoZSBlbGVtZW50IGJ5IHJlbW92aW5nIHRoZSBzdGlja3kgY2VsbCBDU1MgY2xhc3MsIHJlLWV2YWx1YXRpbmdcbiAgICogdGhlIHpJbmRleCwgcmVtb3ZpbmcgZWFjaCBvZiB0aGUgcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbnMsIGFuZCByZW1vdmluZyB0aGVcbiAgICogc3RpY2t5IHBvc2l0aW9uIGlmIHRoZXJlIGFyZSBubyBtb3JlIGRpcmVjdGlvbnMuXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgZm9yIChjb25zdCBkaXIgb2Ygc3RpY2t5RGlyZWN0aW9ucykge1xuICAgICAgZWxlbWVudC5zdHlsZVtkaXJdID0gJyc7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fYm9yZGVyQ2VsbENzc1tkaXJdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBubyBsb25nZXIgaGFzIGFueSBtb3JlIHN0aWNreSBkaXJlY3Rpb25zLCByZW1vdmUgc3RpY2t5IHBvc2l0aW9uaW5nIGFuZFxuICAgIC8vIHRoZSBzdGlja3kgQ1NTIGNsYXNzLlxuICAgIC8vIFNob3J0LWNpcmN1aXQgY2hlY2tpbmcgZWxlbWVudC5zdHlsZVtkaXJdIGZvciBzdGlja3lEaXJlY3Rpb25zIGFzIHRoZXlcbiAgICAvLyB3ZXJlIGFscmVhZHkgcmVtb3ZlZCBhYm92ZS5cbiAgICBjb25zdCBoYXNEaXJlY3Rpb24gPSBTVElDS1lfRElSRUNUSU9OUy5zb21lKGRpciA9PlxuICAgICAgICBzdGlja3lEaXJlY3Rpb25zLmluZGV4T2YoZGlyKSA9PT0gLTEgJiYgZWxlbWVudC5zdHlsZVtkaXJdKTtcbiAgICBpZiAoaGFzRGlyZWN0aW9uKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdoZW4gbm90IGhhc0RpcmVjdGlvbiwgX2dldENhbGN1bGF0ZWRaSW5kZXggd2lsbCBhbHdheXMgcmV0dXJuICcnLlxuICAgICAgZWxlbWVudC5zdHlsZS56SW5kZXggPSAnJztcbiAgICAgIGlmICh0aGlzLl9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnJztcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9zdGlja0NlbGxDc3MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBzdGlja3kgc3R5bGluZyB0byB0aGUgZWxlbWVudCBieSBhZGRpbmcgdGhlIHN0aWNreSBzdHlsZSBjbGFzcywgY2hhbmdpbmcgcG9zaXRpb25cbiAgICogdG8gYmUgc3RpY2t5IChhbmQgLXdlYmtpdC1zdGlja3kpLCBzZXR0aW5nIHRoZSBhcHByb3ByaWF0ZSB6SW5kZXgsIGFuZCBhZGRpbmcgYSBzdGlja3lcbiAgICogZGlyZWN0aW9uIGFuZCB2YWx1ZS5cbiAgICovXG4gIF9hZGRTdGlja3lTdHlsZShlbGVtZW50OiBIVE1MRWxlbWVudCwgZGlyOiBTdGlja3lEaXJlY3Rpb24sIGRpclZhbHVlOiBudW1iZXIsXG4gICAgICBpc0JvcmRlckVsZW1lbnQ6IGJvb2xlYW4pIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5fc3RpY2tDZWxsQ3NzKTtcbiAgICBpZiAoaXNCb3JkZXJFbGVtZW50KSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5fYm9yZGVyQ2VsbENzc1tkaXJdKTtcbiAgICB9XG4gICAgZWxlbWVudC5zdHlsZVtkaXJdID0gYCR7ZGlyVmFsdWV9cHhgO1xuICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gdGhpcy5fZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50KTtcbiAgICBpZiAodGhpcy5fbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCkge1xuICAgICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ICs9ICdwb3NpdGlvbjogLXdlYmtpdC1zdGlja3k7IHBvc2l0aW9uOiBzdGlja3k7ICc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSB3aGF0IHRoZSB6LWluZGV4IHNob3VsZCBiZSBmb3IgdGhlIGVsZW1lbnQsIGRlcGVuZGluZyBvbiB3aGF0IGRpcmVjdGlvbnMgKHRvcCxcbiAgICogYm90dG9tLCBsZWZ0LCByaWdodCkgaGF2ZSBiZWVuIHNldC4gSXQgc2hvdWxkIGJlIHRydWUgdGhhdCBlbGVtZW50cyB3aXRoIGEgdG9wIGRpcmVjdGlvblxuICAgKiBzaG91bGQgaGF2ZSB0aGUgaGlnaGVzdCBpbmRleCBzaW5jZSB0aGVzZSBhcmUgZWxlbWVudHMgbGlrZSBhIHRhYmxlIGhlYWRlci4gSWYgYW55IG9mIHRob3NlXG4gICAqIGVsZW1lbnRzIGFyZSBhbHNvIHN0aWNreSBpbiBhbm90aGVyIGRpcmVjdGlvbiwgdGhlbiB0aGV5IHNob3VsZCBhcHBlYXIgYWJvdmUgb3RoZXIgZWxlbWVudHNcbiAgICogdGhhdCBhcmUgb25seSBzdGlja3kgdG9wIChlLmcuIGEgc3RpY2t5IGNvbHVtbiBvbiBhIHN0aWNreSBoZWFkZXIpLiBCb3R0b20tc3RpY2t5IGVsZW1lbnRzXG4gICAqIChlLmcuIGZvb3RlciByb3dzKSBzaG91bGQgdGhlbiBiZSBuZXh0IGluIHRoZSBvcmRlcmluZyBzdWNoIHRoYXQgdGhleSBhcmUgYmVsb3cgdGhlIGhlYWRlclxuICAgKiBidXQgYWJvdmUgYW55IG5vbi1zdGlja3kgZWxlbWVudHMuIEZpbmFsbHksIGxlZnQvcmlnaHQgc3RpY2t5IGVsZW1lbnRzIChlLmcuIHN0aWNreSBjb2x1bW5zKVxuICAgKiBzaG91bGQgbWluaW1hbGx5IGluY3JlbWVudCBzbyB0aGF0IHRoZXkgYXJlIGFib3ZlIG5vbi1zdGlja3kgZWxlbWVudHMgYnV0IGJlbG93IHRvcCBhbmQgYm90dG9tXG4gICAqIGVsZW1lbnRzLlxuICAgKi9cbiAgX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xuICAgIGNvbnN0IHpJbmRleEluY3JlbWVudHMgPSB7XG4gICAgICB0b3A6IDEwMCxcbiAgICAgIGJvdHRvbTogMTAsXG4gICAgICBsZWZ0OiAxLFxuICAgICAgcmlnaHQ6IDEsXG4gICAgfTtcblxuICAgIGxldCB6SW5kZXggPSAwO1xuICAgIC8vIFVzZSBgSXRlcmFibGVgIGluc3RlYWQgb2YgYEFycmF5YCBiZWNhdXNlIFR5cGVTY3JpcHQsIGFzIG9mIDMuNi4zLFxuICAgIC8vIGxvc2VzIHRoZSBhcnJheSBnZW5lcmljIHR5cGUgaW4gdGhlIGBmb3Igb2ZgLiBCdXQgd2UgKmFsc28qIGhhdmUgdG8gdXNlIGBBcnJheWAgYmVjYXVzZVxuICAgIC8vIHR5cGVzY3JpcHQgd29uJ3QgaXRlcmF0ZSBvdmVyIGFuIGBJdGVyYWJsZWAgdW5sZXNzIHlvdSBjb21waWxlIHdpdGggYC0tZG93bmxldmVsSXRlcmF0aW9uYFxuICAgIGZvciAoY29uc3QgZGlyIG9mIFNUSUNLWV9ESVJFQ1RJT05TIGFzIEl0ZXJhYmxlPFN0aWNreURpcmVjdGlvbj4gJiBTdGlja3lEaXJlY3Rpb25bXSkge1xuICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbZGlyXSkge1xuICAgICAgICB6SW5kZXggKz0gekluZGV4SW5jcmVtZW50c1tkaXJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB6SW5kZXggPyBgJHt6SW5kZXh9YCA6ICcnO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHdpZHRocyBmb3IgZWFjaCBjZWxsIGluIHRoZSBwcm92aWRlZCByb3cuICovXG4gIF9nZXRDZWxsV2lkdGhzKHJvdzogSFRNTEVsZW1lbnQsIHJlY2FsY3VsYXRlQ2VsbFdpZHRocyA9IHRydWUpOiBudW1iZXJbXSB7XG4gICAgaWYgKCFyZWNhbGN1bGF0ZUNlbGxXaWR0aHMgJiYgdGhpcy5fY2FjaGVkQ2VsbFdpZHRocy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jYWNoZWRDZWxsV2lkdGhzO1xuICAgIH1cblxuICAgIGNvbnN0IGNlbGxXaWR0aHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgZmlyc3RSb3dDZWxscyA9IHJvdy5jaGlsZHJlbjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0Um93Q2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBjZWxsOiBIVE1MRWxlbWVudCA9IGZpcnN0Um93Q2VsbHNbaV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBjZWxsV2lkdGhzLnB1c2goY2VsbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVkQ2VsbFdpZHRocyA9IGNlbGxXaWR0aHM7XG4gICAgcmV0dXJuIGNlbGxXaWR0aHM7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIG9mIGVhY2ggc3RpY2t5IGNvbHVtbiBjZWxsLCB3aGljaCB3aWxsIGJlIHRoZVxuICAgKiBhY2N1bXVsYXRpb24gb2YgYWxsIHN0aWNreSBjb2x1bW4gY2VsbCB3aWR0aHMgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0LCByZXNwZWN0aXZlbHkuXG4gICAqIE5vbi1zdGlja3kgY2VsbHMgZG8gbm90IG5lZWQgdG8gaGF2ZSBhIHZhbHVlIHNldCBzaW5jZSB0aGVpciBwb3NpdGlvbnMgd2lsbCBub3QgYmUgYXBwbGllZC5cbiAgICovXG4gIF9nZXRTdGlja3lTdGFydENvbHVtblBvc2l0aW9ucyh3aWR0aHM6IG51bWJlcltdLCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSk6IG51bWJlcltdIHtcbiAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IG5leHRQb3NpdGlvbiA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRocy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHN0aWNreVN0YXRlc1tpXSkge1xuICAgICAgICBwb3NpdGlvbnNbaV0gPSBuZXh0UG9zaXRpb247XG4gICAgICAgIG5leHRQb3NpdGlvbiArPSB3aWR0aHNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbnMgb2YgZWFjaCBzdGlja3kgY29sdW1uIGNlbGwsIHdoaWNoIHdpbGwgYmUgdGhlXG4gICAqIGFjY3VtdWxhdGlvbiBvZiBhbGwgc3RpY2t5IGNvbHVtbiBjZWxsIHdpZHRocyB0byB0aGUgbGVmdCBhbmQgcmlnaHQsIHJlc3BlY3RpdmVseS5cbiAgICogTm9uLXN0aWNreSBjZWxscyBkbyBub3QgbmVlZCB0byBoYXZlIGEgdmFsdWUgc2V0IHNpbmNlIHRoZWlyIHBvc2l0aW9ucyB3aWxsIG5vdCBiZSBhcHBsaWVkLlxuICAgKi9cbiAgX2dldFN0aWNreUVuZENvbHVtblBvc2l0aW9ucyh3aWR0aHM6IG51bWJlcltdLCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSk6IG51bWJlcltdIHtcbiAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IG5leHRQb3NpdGlvbiA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gd2lkdGhzLmxlbmd0aDsgaSA+IDA7IGktLSkge1xuICAgICAgaWYgKHN0aWNreVN0YXRlc1tpXSkge1xuICAgICAgICBwb3NpdGlvbnNbaV0gPSBuZXh0UG9zaXRpb247XG4gICAgICAgIG5leHRQb3NpdGlvbiArPSB3aWR0aHNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfVxufVxuIl19