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
        for (const element of elementsToClear) {
            this._removeStickyStyle(element, stickyDirections);
        }
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
        if (!rows.length ||
            !this._isBrowser ||
            !(stickyStartStates.some(state => state) || stickyEndStates.some(state => state))) {
            if (this._positionListener) {
                this._coalescedStyleScheduler.scheduleWrite(() => {
                    this._positionListener.stickyColumnsUpdated({ sizes: [] });
                    this._positionListener.stickyEndColumnsUpdated({ sizes: [] });
                });
            }
            return;
        }
        this._coalescedStyleScheduler.scheduleEarlyRead(() => {
            const firstRow = rows[0];
            const numCells = firstRow.children.length;
            const lastStickyStart = stickyStartStates.lastIndexOf(true);
            const firstStickyEnd = stickyEndStates.indexOf(true);
            const cellWidths = this._getCellWidths(firstRow, recalculateCellWidths);
            const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
            const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
            this._coalescedStyleScheduler.scheduleWrite(() => {
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
                        sizes: lastStickyStart === -1
                            ? []
                            : cellWidths
                                .slice(0, lastStickyStart + 1)
                                .map((width, index) => (stickyStartStates[index] ? width : null)),
                    });
                    this._positionListener.stickyEndColumnsUpdated({
                        sizes: firstStickyEnd === -1
                            ? []
                            : cellWidths
                                .slice(firstStickyEnd)
                                .map((width, index) => (stickyEndStates[index + firstStickyEnd] ? width : null))
                                .reverse(),
                    });
                }
            });
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
        this._coalescedStyleScheduler.scheduleEarlyRead(() => {
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
                if (!states[rowIndex]) {
                    continue;
                }
                stickyOffsets[rowIndex] = stickyOffset;
                const row = rows[rowIndex];
                elementsToStick[rowIndex] = this._isNativeHtmlTable
                    ? Array.from(row.children)
                    : [row];
                const height = row.getBoundingClientRect().height;
                stickyOffset += height;
                stickyCellHeights[rowIndex] = height;
            }
            const borderedRowIndex = states.lastIndexOf(true);
            this._coalescedStyleScheduler.scheduleWrite(() => {
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
                    this._positionListener?.stickyHeaderRowsUpdated({
                        sizes: stickyCellHeights,
                        offsets: stickyOffsets,
                        elements: elementsToStick,
                    });
                }
                else {
                    this._positionListener?.stickyFooterRowsUpdated({
                        sizes: stickyCellHeights,
                        offsets: stickyOffsets,
                        elements: elementsToStick,
                    });
                }
            });
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
        // Coalesce with other sticky updates (and potentially other changes like column resize).
        this._coalescedStyleScheduler.scheduleWrite(() => {
            const tfoot = tableElement.querySelector('tfoot');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFZSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUV2Rjs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUl2Qjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsWUFDVSxrQkFBMkIsRUFDM0IsYUFBcUIsRUFDdEIsU0FBb0IsRUFDbkIsd0JBQWtELEVBQ2xELGFBQWEsSUFBSSxFQUNSLGdDQUFnQyxJQUFJLEVBQ3BDLGlCQUE2QztRQU50RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQVM7UUFDM0Isa0JBQWEsR0FBYixhQUFhLENBQVE7UUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUNuQiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1FBQ2xELGVBQVUsR0FBVixVQUFVLENBQU87UUFDUixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQU87UUFDcEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE0QjtRQXhCeEQsc0JBQWlCLEdBQWEsRUFBRSxDQUFDO1FBMEJ2QyxJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ3BCLEtBQUssRUFBRSxHQUFHLGFBQWEsa0JBQWtCO1lBQ3pDLFFBQVEsRUFBRSxHQUFHLGFBQWEscUJBQXFCO1lBQy9DLE1BQU0sRUFBRSxHQUFHLGFBQWEsbUJBQW1CO1lBQzNDLE9BQU8sRUFBRSxHQUFHLGFBQWEsb0JBQW9CO1NBQzlDLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxzQkFBc0IsQ0FBQyxJQUFtQixFQUFFLGdCQUFtQztRQUM3RSxNQUFNLGVBQWUsR0FBa0IsRUFBRSxDQUFD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UyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsNEJBQTRCLENBQUMsTUFBZ0IsRUFBRSxZQUF1QjtRQUNwRSxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7UUFDL0IsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBRXJCLEtBQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDNUIsWUFBWSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIERpcmVjdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB3aGVuIHNldHRpbmcgc3RpY2t5IHBvc2l0aW9uaW5nLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXJ9IGZyb20gJy4vY29hbGVzY2VkLXN0eWxlLXNjaGVkdWxlcic7XG5pbXBvcnQge1N0aWNreVBvc2l0aW9uaW5nTGlzdGVuZXJ9IGZyb20gJy4vc3RpY2t5LXBvc2l0aW9uLWxpc3RlbmVyJztcblxuZXhwb3J0IHR5cGUgU3RpY2t5RGlyZWN0aW9uID0gJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCc7XG5cbi8qKlxuICogTGlzdCBvZiBhbGwgcG9zc2libGUgZGlyZWN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGlja3kgcG9zaXRpb25pbmcuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBTVElDS1lfRElSRUNUSU9OUzogU3RpY2t5RGlyZWN0aW9uW10gPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG4vKipcbiAqIEFwcGxpZXMgYW5kIHJlbW92ZXMgc3RpY2t5IHBvc2l0aW9uaW5nIHN0eWxlcyB0byB0aGUgYENka1RhYmxlYCByb3dzIGFuZCBjb2x1bW5zIGNlbGxzLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgU3RpY2t5U3R5bGVyIHtcbiAgcHJpdmF0ZSBfY2FjaGVkQ2VsbFdpZHRoczogbnVtYmVyW10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYm9yZGVyQ2VsbENzczogUmVhZG9ubHk8e1tkIGluIFN0aWNreURpcmVjdGlvbl06IHN0cmluZ30+O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gX2lzTmF0aXZlSHRtbFRhYmxlIFdoZXRoZXIgdGhlIHN0aWNreSBsb2dpYyBzaG91bGQgYmUgYmFzZWQgb24gYSB0YWJsZVxuICAgKiAgICAgdGhhdCB1c2VzIHRoZSBuYXRpdmUgYDx0YWJsZT5gIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBfc3RpY2tDZWxsQ3NzIFRoZSBDU1MgY2xhc3MgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gZXZlcnkgcm93L2NlbGwgdGhhdCBoYXNcbiAgICogICAgIHN0aWNreSBwb3NpdGlvbmluZyBhcHBsaWVkLlxuICAgKiBAcGFyYW0gZGlyZWN0aW9uIFRoZSBkaXJlY3Rpb25hbGl0eSBjb250ZXh0IG9mIHRoZSB0YWJsZSAobHRyL3J0bCk7IGFmZmVjdHMgY29sdW1uIHBvc2l0aW9uaW5nXG4gICAqICAgICBieSByZXZlcnNpbmcgbGVmdC9yaWdodCBwb3NpdGlvbnMuXG4gICAqIEBwYXJhbSBfaXNCcm93c2VyIFdoZXRoZXIgdGhlIHRhYmxlIGlzIGN1cnJlbnRseSBiZWluZyByZW5kZXJlZCBvbiB0aGUgc2VydmVyIG9yIHRoZSBjbGllbnQuXG4gICAqIEBwYXJhbSBfbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCBXaGV0aGVyIHdlIG5lZWQgdG8gc3BlY2lmeSBwb3NpdGlvbjogc3RpY2t5IG9uIGNlbGxzXG4gICAqICAgICB1c2luZyBpbmxpbmUgc3R5bGVzLiBJZiBmYWxzZSwgaXQgaXMgYXNzdW1lZCB0aGF0IHBvc2l0aW9uOiBzdGlja3kgaXMgaW5jbHVkZWQgaW5cbiAgICogICAgIHRoZSBjb21wb25lbnQgc3R5bGVzaGVldCBmb3IgX3N0aWNrQ2VsbENzcy5cbiAgICogQHBhcmFtIF9wb3NpdGlvbkxpc3RlbmVyIEEgbGlzdGVuZXIgdGhhdCBpcyBub3RpZmllZCBvZiBjaGFuZ2VzIHRvIHN0aWNreSByb3dzL2NvbHVtbnNcbiAgICogICAgIGFuZCB0aGVpciBkaW1lbnNpb25zLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfaXNOYXRpdmVIdG1sVGFibGU6IGJvb2xlYW4sXG4gICAgcHJpdmF0ZSBfc3RpY2tDZWxsQ3NzOiBzdHJpbmcsXG4gICAgcHVibGljIGRpcmVjdGlvbjogRGlyZWN0aW9uLFxuICAgIHByaXZhdGUgX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyOiBfQ29hbGVzY2VkU3R5bGVTY2hlZHVsZXIsXG4gICAgcHJpdmF0ZSBfaXNCcm93c2VyID0gdHJ1ZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50ID0gdHJ1ZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9wb3NpdGlvbkxpc3RlbmVyPzogU3RpY2t5UG9zaXRpb25pbmdMaXN0ZW5lcixcbiAgKSB7XG4gICAgdGhpcy5fYm9yZGVyQ2VsbENzcyA9IHtcbiAgICAgICd0b3AnOiBgJHtfc3RpY2tDZWxsQ3NzfS1ib3JkZXItZWxlbS10b3BgLFxuICAgICAgJ2JvdHRvbSc6IGAke19zdGlja0NlbGxDc3N9LWJvcmRlci1lbGVtLWJvdHRvbWAsXG4gICAgICAnbGVmdCc6IGAke19zdGlja0NlbGxDc3N9LWJvcmRlci1lbGVtLWxlZnRgLFxuICAgICAgJ3JpZ2h0JzogYCR7X3N0aWNrQ2VsbENzc30tYm9yZGVyLWVsZW0tcmlnaHRgLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIGZyb20gdGhlIHJvdyBhbmQgaXRzIGNlbGxzIGJ5IHJlc2V0dGluZyB0aGUgYHBvc2l0aW9uYFxuICAgKiBzdHlsZSwgc2V0dGluZyB0aGUgekluZGV4IHRvIDAsIGFuZCB1bnNldHRpbmcgZWFjaCBwcm92aWRlZCBzdGlja3kgZGlyZWN0aW9uLlxuICAgKiBAcGFyYW0gcm93cyBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIGNsZWFyZWQgZnJvbSBzdGlja2luZyBpbiB0aGUgcHJvdmlkZWQgZGlyZWN0aW9uc1xuICAgKiBAcGFyYW0gc3RpY2t5RGlyZWN0aW9ucyBUaGUgZGlyZWN0aW9ucyB0aGF0IHNob3VsZCBubyBsb25nZXIgYmUgc2V0IGFzIHN0aWNreSBvbiB0aGUgcm93cy5cbiAgICovXG4gIGNsZWFyU3RpY2t5UG9zaXRpb25pbmcocm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5RGlyZWN0aW9uczogU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICBjb25zdCBlbGVtZW50c1RvQ2xlYXI6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAvLyBJZiB0aGUgcm93IGlzbid0IGFuIGVsZW1lbnQgKGUuZy4gaWYgaXQncyBhbiBgbmctY29udGFpbmVyYCksXG4gICAgICAvLyBpdCB3b24ndCBoYXZlIGlubGluZSBzdHlsZXMgb3IgYGNoaWxkcmVuYCBzbyB3ZSBza2lwIGl0LlxuICAgICAgaWYgKHJvdy5ub2RlVHlwZSAhPT0gcm93LkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgZWxlbWVudHNUb0NsZWFyLnB1c2gocm93KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVsZW1lbnRzVG9DbGVhci5wdXNoKHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzVG9DbGVhcikge1xuICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudCwgc3RpY2t5RGlyZWN0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyB0byB0aGUgY2VsbHMgb2YgZWFjaCByb3cgYWNjb3JkaW5nIHRvIHRoZSBzdGlja3lcbiAgICogc3RhdGVzIG9mIHRoZSByZW5kZXJlZCBjb2x1bW4gZGVmaW5pdGlvbnMuXG4gICAqIEBwYXJhbSByb3dzIFRoZSByb3dzIHRoYXQgc2hvdWxkIGhhdmUgaXRzIHNldCBvZiBjZWxscyBzdHVjayBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreSBzdGF0ZXMuXG4gICAqIEBwYXJhbSBzdGlja3lTdGFydFN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIGNlbGxcbiAgICogICAgIGluIHRoaXMgaW5kZXggcG9zaXRpb24gc2hvdWxkIGJlIHN0dWNrIHRvIHRoZSBzdGFydCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gc3RpY2t5RW5kU3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIGVuZCBvZiB0aGUgcm93LlxuICAgKiBAcGFyYW0gcmVjYWxjdWxhdGVDZWxsV2lkdGhzIFdoZXRoZXIgdGhlIHN0aWNreSBzdHlsZXIgc2hvdWxkIHJlY2FsY3VsYXRlIHRoZSB3aWR0aCBvZiBlYWNoXG4gICAqICAgICBjb2x1bW4gY2VsbC4gSWYgYGZhbHNlYCBjYWNoZWQgd2lkdGhzIHdpbGwgYmUgdXNlZCBpbnN0ZWFkLlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Q29sdW1ucyhcbiAgICByb3dzOiBIVE1MRWxlbWVudFtdLFxuICAgIHN0aWNreVN0YXJ0U3RhdGVzOiBib29sZWFuW10sXG4gICAgc3RpY2t5RW5kU3RhdGVzOiBib29sZWFuW10sXG4gICAgcmVjYWxjdWxhdGVDZWxsV2lkdGhzID0gdHJ1ZSxcbiAgKSB7XG4gICAgaWYgKFxuICAgICAgIXJvd3MubGVuZ3RoIHx8XG4gICAgICAhdGhpcy5faXNCcm93c2VyIHx8XG4gICAgICAhKHN0aWNreVN0YXJ0U3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpIHx8IHN0aWNreUVuZFN0YXRlcy5zb21lKHN0YXRlID0+IHN0YXRlKSlcbiAgICApIHtcbiAgICAgIGlmICh0aGlzLl9wb3NpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlV3JpdGUoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIhLnN0aWNreUNvbHVtbnNVcGRhdGVkKHtzaXplczogW119KTtcbiAgICAgICAgICB0aGlzLl9wb3NpdGlvbkxpc3RlbmVyIS5zdGlja3lFbmRDb2x1bW5zVXBkYXRlZCh7c2l6ZXM6IFtdfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY29hbGVzY2VkU3R5bGVTY2hlZHVsZXIuc2NoZWR1bGVFYXJseVJlYWQoKCkgPT4ge1xuICAgICAgY29uc3QgZmlyc3RSb3cgPSByb3dzWzBdO1xuICAgICAgY29uc3QgbnVtQ2VsbHMgPSBmaXJzdFJvdy5jaGlsZHJlbi5sZW5ndGg7XG4gICAgICBjb25zdCBsYXN0U3RpY2t5U3RhcnQgPSBzdGlja3lTdGFydFN0YXRlcy5sYXN0SW5kZXhPZih0cnVlKTtcbiAgICAgIGNvbnN0IGZpcnN0U3RpY2t5RW5kID0gc3RpY2t5RW5kU3RhdGVzLmluZGV4T2YodHJ1ZSk7XG5cbiAgICAgIGNvbnN0IGNlbGxXaWR0aHMgPSB0aGlzLl9nZXRDZWxsV2lkdGhzKGZpcnN0Um93LCByZWNhbGN1bGF0ZUNlbGxXaWR0aHMpO1xuICAgICAgY29uc3Qgc3RhcnRQb3NpdGlvbnMgPSB0aGlzLl9nZXRTdGlja3lTdGFydENvbHVtblBvc2l0aW9ucyhjZWxsV2lkdGhzLCBzdGlja3lTdGFydFN0YXRlcyk7XG4gICAgICBjb25zdCBlbmRQb3NpdGlvbnMgPSB0aGlzLl9nZXRTdGlja3lFbmRDb2x1bW5Qb3NpdGlvbnMoY2VsbFdpZHRocywgc3RpY2t5RW5kU3RhdGVzKTtcblxuICAgICAgdGhpcy5fY29hbGVzY2VkU3R5bGVTY2hlZHVsZXIuc2NoZWR1bGVXcml0ZSgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGlzUnRsID0gdGhpcy5kaXJlY3Rpb24gPT09ICdydGwnO1xuICAgICAgICBjb25zdCBzdGFydCA9IGlzUnRsID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgY29uc3QgZW5kID0gaXNSdGwgPyAnbGVmdCcgOiAncmlnaHQnO1xuXG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNlbGxzOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNlbGwgPSByb3cuY2hpbGRyZW5baV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoc3RpY2t5U3RhcnRTdGF0ZXNbaV0pIHtcbiAgICAgICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgc3RhcnQsIHN0YXJ0UG9zaXRpb25zIVtpXSwgaSA9PT0gbGFzdFN0aWNreVN0YXJ0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0aWNreUVuZFN0YXRlc1tpXSkge1xuICAgICAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShjZWxsLCBlbmQsIGVuZFBvc2l0aW9ucyFbaV0sIGkgPT09IGZpcnN0U3RpY2t5RW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fcG9zaXRpb25MaXN0ZW5lcikge1xuICAgICAgICAgIHRoaXMuX3Bvc2l0aW9uTGlzdGVuZXIuc3RpY2t5Q29sdW1uc1VwZGF0ZWQoe1xuICAgICAgICAgICAgc2l6ZXM6XG4gICAgICAgICAgICAgIGxhc3RTdGlja3lTdGFydCA9PT0gLTFcbiAgICAgICAgICAgICAgICA/IFtdXG4gICAgICAgICAgICAgICAgOiBjZWxsV2lkdGhzIVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgbGFzdFN0aWNreVN0YXJ0ICsgMSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgod2lkdGgsIGluZGV4KSA9PiAoc3RpY2t5U3RhcnRTdGF0ZXNbaW5kZXhdID8gd2lkdGggOiBudWxsKSksXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lci5zdGlja3lFbmRDb2x1bW5zVXBkYXRlZCh7XG4gICAgICAgICAgICBzaXplczpcbiAgICAgICAgICAgICAgZmlyc3RTdGlja3lFbmQgPT09IC0xXG4gICAgICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgICAgIDogY2VsbFdpZHRocyFcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGZpcnN0U3RpY2t5RW5kKVxuICAgICAgICAgICAgICAgICAgICAubWFwKCh3aWR0aCwgaW5kZXgpID0+IChzdGlja3lFbmRTdGF0ZXNbaW5kZXggKyBmaXJzdFN0aWNreUVuZF0gPyB3aWR0aCA6IG51bGwpKVxuICAgICAgICAgICAgICAgICAgICAucmV2ZXJzZSgpLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHN0aWNreSBwb3NpdGlvbmluZyB0byB0aGUgcm93J3MgY2VsbHMgaWYgdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBsYXlvdXQsIGFuZCB0byB0aGVcbiAgICogcm93IGl0c2VsZiBvdGhlcndpc2UuXG4gICAqIEBwYXJhbSByb3dzVG9TdGljayBUaGUgbGlzdCBvZiByb3dzIHRoYXQgc2hvdWxkIGJlIHN0dWNrIGFjY29yZGluZyB0byB0aGVpciBjb3JyZXNwb25kaW5nXG4gICAqICAgICBzdGlja3kgc3RhdGUgYW5kIHRvIHRoZSBwcm92aWRlZCB0b3Agb3IgYm90dG9tIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gc3RpY2t5U3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgcm93XG4gICAqICAgICBzaG91bGQgYmUgc3R1Y2sgaW4gdGhlIHBhcnRpY3VsYXIgdG9wIG9yIGJvdHRvbSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHBvc2l0aW9uIFRoZSBwb3NpdGlvbiBkaXJlY3Rpb24gaW4gd2hpY2ggdGhlIHJvdyBzaG91bGQgYmUgc3R1Y2sgaWYgdGhhdCByb3cgc2hvdWxkIGJlXG4gICAqICAgICBzdGlja3kuXG4gICAqXG4gICAqL1xuICBzdGlja1Jvd3Mocm93c1RvU3RpY2s6IEhUTUxFbGVtZW50W10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdLCBwb3NpdGlvbjogJ3RvcCcgfCAnYm90dG9tJykge1xuICAgIC8vIFNpbmNlIHdlIGNhbid0IG1lYXN1cmUgdGhlIHJvd3Mgb24gdGhlIHNlcnZlciwgd2UgY2FuJ3Qgc3RpY2sgdGhlIHJvd3MgcHJvcGVybHkuXG4gICAgaWYgKCF0aGlzLl9pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZUVhcmx5UmVhZCgoKSA9PiB7XG4gICAgICAvLyBJZiBwb3NpdGlvbmluZyB0aGUgcm93cyB0byB0aGUgYm90dG9tLCByZXZlcnNlIHRoZWlyIG9yZGVyIHdoZW4gZXZhbHVhdGluZyB0aGUgc3RpY2t5XG4gICAgICAvLyBwb3NpdGlvbiBzdWNoIHRoYXQgdGhlIGxhc3Qgcm93IHN0dWNrIHdpbGwgYmUgXCJib3R0b206IDBweFwiIGFuZCBzbyBvbi4gTm90ZSB0aGF0IHRoZVxuICAgICAgLy8gc3RpY2t5IHN0YXRlcyBuZWVkIHRvIGJlIHJldmVyc2VkIGFzIHdlbGwuXG4gICAgICBjb25zdCByb3dzID0gcG9zaXRpb24gPT09ICdib3R0b20nID8gcm93c1RvU3RpY2suc2xpY2UoKS5yZXZlcnNlKCkgOiByb3dzVG9TdGljaztcbiAgICAgIGNvbnN0IHN0YXRlcyA9IHBvc2l0aW9uID09PSAnYm90dG9tJyA/IHN0aWNreVN0YXRlcy5zbGljZSgpLnJldmVyc2UoKSA6IHN0aWNreVN0YXRlcztcblxuICAgICAgLy8gTWVhc3VyZSByb3cgaGVpZ2h0cyBhbGwgYXQgb25jZSBiZWZvcmUgYWRkaW5nIHN0aWNreSBzdHlsZXMgdG8gcmVkdWNlIGxheW91dCB0aHJhc2hpbmcuXG4gICAgICBjb25zdCBzdGlja3lPZmZzZXRzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgY29uc3Qgc3RpY2t5Q2VsbEhlaWdodHM6IChudW1iZXIgfCB1bmRlZmluZWQpW10gPSBbXTtcbiAgICAgIGNvbnN0IGVsZW1lbnRzVG9TdGljazogSFRNTEVsZW1lbnRbXVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IHJvd0luZGV4ID0gMCwgc3RpY2t5T2Zmc2V0ID0gMDsgcm93SW5kZXggPCByb3dzLmxlbmd0aDsgcm93SW5kZXgrKykge1xuICAgICAgICBpZiAoIXN0YXRlc1tyb3dJbmRleF0pIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0aWNreU9mZnNldHNbcm93SW5kZXhdID0gc3RpY2t5T2Zmc2V0O1xuICAgICAgICBjb25zdCByb3cgPSByb3dzW3Jvd0luZGV4XTtcbiAgICAgICAgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSA9IHRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlXG4gICAgICAgICAgPyAoQXJyYXkuZnJvbShyb3cuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10pXG4gICAgICAgICAgOiBbcm93XTtcblxuICAgICAgICBjb25zdCBoZWlnaHQgPSByb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgICAgICBzdGlja3lPZmZzZXQgKz0gaGVpZ2h0O1xuICAgICAgICBzdGlja3lDZWxsSGVpZ2h0c1tyb3dJbmRleF0gPSBoZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGJvcmRlcmVkUm93SW5kZXggPSBzdGF0ZXMubGFzdEluZGV4T2YodHJ1ZSk7XG4gICAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZVdyaXRlKCgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgcm93SW5kZXggPSAwOyByb3dJbmRleCA8IHJvd3MubGVuZ3RoOyByb3dJbmRleCsrKSB7XG4gICAgICAgICAgaWYgKCFzdGF0ZXNbcm93SW5kZXhdKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSBzdGlja3lPZmZzZXRzW3Jvd0luZGV4XTtcbiAgICAgICAgICBjb25zdCBpc0JvcmRlcmVkUm93SW5kZXggPSByb3dJbmRleCA9PT0gYm9yZGVyZWRSb3dJbmRleDtcbiAgICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoZWxlbWVudCwgcG9zaXRpb24sIG9mZnNldCwgaXNCb3JkZXJlZFJvd0luZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9zaXRpb24gPT09ICd0b3AnKSB7XG4gICAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lcj8uc3RpY2t5SGVhZGVyUm93c1VwZGF0ZWQoe1xuICAgICAgICAgICAgc2l6ZXM6IHN0aWNreUNlbGxIZWlnaHRzLFxuICAgICAgICAgICAgb2Zmc2V0czogc3RpY2t5T2Zmc2V0cyxcbiAgICAgICAgICAgIGVsZW1lbnRzOiBlbGVtZW50c1RvU3RpY2ssXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fcG9zaXRpb25MaXN0ZW5lcj8uc3RpY2t5Rm9vdGVyUm93c1VwZGF0ZWQoe1xuICAgICAgICAgICAgc2l6ZXM6IHN0aWNreUNlbGxIZWlnaHRzLFxuICAgICAgICAgICAgb2Zmc2V0czogc3RpY2t5T2Zmc2V0cyxcbiAgICAgICAgICAgIGVsZW1lbnRzOiBlbGVtZW50c1RvU3RpY2ssXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBpbiBTYWZhcmksIHN0aWNreSBmb290ZXIgY2VsbHMgZG8gbm90IHN0aWNrLiBUaGUgb25seSB3YXkgdG8gc3RpY2tcbiAgICogZm9vdGVyIHJvd3MgaXMgdG8gYXBwbHkgc3RpY2t5IHN0eWxpbmcgdG8gdGhlIHRmb290IGNvbnRhaW5lci4gVGhpcyBzaG91bGQgb25seSBiZSBkb25lIGlmXG4gICAqIGFsbCBmb290ZXIgcm93cyBhcmUgc3RpY2t5LiBJZiBub3QgYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3ksIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgZnJvbVxuICAgKiB0aGUgdGZvb3QgZWxlbWVudC5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlckNvbnRhaW5lcih0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHN0aWNreVN0YXRlczogYm9vbGVhbltdKSB7XG4gICAgaWYgKCF0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENvYWxlc2NlIHdpdGggb3RoZXIgc3RpY2t5IHVwZGF0ZXMgKGFuZCBwb3RlbnRpYWxseSBvdGhlciBjaGFuZ2VzIGxpa2UgY29sdW1uIHJlc2l6ZSkuXG4gICAgdGhpcy5fY29hbGVzY2VkU3R5bGVTY2hlZHVsZXIuc2NoZWR1bGVXcml0ZSgoKSA9PiB7XG4gICAgICBjb25zdCB0Zm9vdCA9IHRhYmxlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCd0Zm9vdCcpITtcblxuICAgICAgaWYgKHN0aWNreVN0YXRlcy5zb21lKHN0YXRlID0+ICFzdGF0ZSkpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5U3R5bGUodGZvb3QsIFsnYm90dG9tJ10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUodGZvb3QsICdib3R0b20nLCAwLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgc3RpY2t5IHN0eWxlIG9uIHRoZSBlbGVtZW50IGJ5IHJlbW92aW5nIHRoZSBzdGlja3kgY2VsbCBDU1MgY2xhc3MsIHJlLWV2YWx1YXRpbmdcbiAgICogdGhlIHpJbmRleCwgcmVtb3ZpbmcgZWFjaCBvZiB0aGUgcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbnMsIGFuZCByZW1vdmluZyB0aGVcbiAgICogc3RpY2t5IHBvc2l0aW9uIGlmIHRoZXJlIGFyZSBubyBtb3JlIGRpcmVjdGlvbnMuXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgZm9yIChjb25zdCBkaXIgb2Ygc3RpY2t5RGlyZWN0aW9ucykge1xuICAgICAgZWxlbWVudC5zdHlsZVtkaXJdID0gJyc7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fYm9yZGVyQ2VsbENzc1tkaXJdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBubyBsb25nZXIgaGFzIGFueSBtb3JlIHN0aWNreSBkaXJlY3Rpb25zLCByZW1vdmUgc3RpY2t5IHBvc2l0aW9uaW5nIGFuZFxuICAgIC8vIHRoZSBzdGlja3kgQ1NTIGNsYXNzLlxuICAgIC8vIFNob3J0LWNpcmN1aXQgY2hlY2tpbmcgZWxlbWVudC5zdHlsZVtkaXJdIGZvciBzdGlja3lEaXJlY3Rpb25zIGFzIHRoZXlcbiAgICAvLyB3ZXJlIGFscmVhZHkgcmVtb3ZlZCBhYm92ZS5cbiAgICBjb25zdCBoYXNEaXJlY3Rpb24gPSBTVElDS1lfRElSRUNUSU9OUy5zb21lKFxuICAgICAgZGlyID0+IHN0aWNreURpcmVjdGlvbnMuaW5kZXhPZihkaXIpID09PSAtMSAmJiBlbGVtZW50LnN0eWxlW2Rpcl0sXG4gICAgKTtcbiAgICBpZiAoaGFzRGlyZWN0aW9uKSB7XG4gICAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdoZW4gbm90IGhhc0RpcmVjdGlvbiwgX2dldENhbGN1bGF0ZWRaSW5kZXggd2lsbCBhbHdheXMgcmV0dXJuICcnLlxuICAgICAgZWxlbWVudC5zdHlsZS56SW5kZXggPSAnJztcbiAgICAgIGlmICh0aGlzLl9uZWVkc1Bvc2l0aW9uU3RpY2t5T25FbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnJztcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9zdGlja0NlbGxDc3MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBzdGlja3kgc3R5bGluZyB0byB0aGUgZWxlbWVudCBieSBhZGRpbmcgdGhlIHN0aWNreSBzdHlsZSBjbGFzcywgY2hhbmdpbmcgcG9zaXRpb25cbiAgICogdG8gYmUgc3RpY2t5IChhbmQgLXdlYmtpdC1zdGlja3kpLCBzZXR0aW5nIHRoZSBhcHByb3ByaWF0ZSB6SW5kZXgsIGFuZCBhZGRpbmcgYSBzdGlja3lcbiAgICogZGlyZWN0aW9uIGFuZCB2YWx1ZS5cbiAgICovXG4gIF9hZGRTdGlja3lTdHlsZShcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBkaXI6IFN0aWNreURpcmVjdGlvbixcbiAgICBkaXJWYWx1ZTogbnVtYmVyLFxuICAgIGlzQm9yZGVyRWxlbWVudDogYm9vbGVhbixcbiAgKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgaWYgKGlzQm9yZGVyRWxlbWVudCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX2JvcmRlckNlbGxDc3NbZGlyXSk7XG4gICAgfVxuICAgIGVsZW1lbnQuc3R5bGVbZGlyXSA9IGAke2RpclZhbHVlfXB4YDtcbiAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gICAgaWYgKHRoaXMuX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCArPSAncG9zaXRpb246IC13ZWJraXQtc3RpY2t5OyBwb3NpdGlvbjogc3RpY2t5OyAnO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgd2hhdCB0aGUgei1pbmRleCBzaG91bGQgYmUgZm9yIHRoZSBlbGVtZW50LCBkZXBlbmRpbmcgb24gd2hhdCBkaXJlY3Rpb25zICh0b3AsXG4gICAqIGJvdHRvbSwgbGVmdCwgcmlnaHQpIGhhdmUgYmVlbiBzZXQuIEl0IHNob3VsZCBiZSB0cnVlIHRoYXQgZWxlbWVudHMgd2l0aCBhIHRvcCBkaXJlY3Rpb25cbiAgICogc2hvdWxkIGhhdmUgdGhlIGhpZ2hlc3QgaW5kZXggc2luY2UgdGhlc2UgYXJlIGVsZW1lbnRzIGxpa2UgYSB0YWJsZSBoZWFkZXIuIElmIGFueSBvZiB0aG9zZVxuICAgKiBlbGVtZW50cyBhcmUgYWxzbyBzdGlja3kgaW4gYW5vdGhlciBkaXJlY3Rpb24sIHRoZW4gdGhleSBzaG91bGQgYXBwZWFyIGFib3ZlIG90aGVyIGVsZW1lbnRzXG4gICAqIHRoYXQgYXJlIG9ubHkgc3RpY2t5IHRvcCAoZS5nLiBhIHN0aWNreSBjb2x1bW4gb24gYSBzdGlja3kgaGVhZGVyKS4gQm90dG9tLXN0aWNreSBlbGVtZW50c1xuICAgKiAoZS5nLiBmb290ZXIgcm93cykgc2hvdWxkIHRoZW4gYmUgbmV4dCBpbiB0aGUgb3JkZXJpbmcgc3VjaCB0aGF0IHRoZXkgYXJlIGJlbG93IHRoZSBoZWFkZXJcbiAgICogYnV0IGFib3ZlIGFueSBub24tc3RpY2t5IGVsZW1lbnRzLiBGaW5hbGx5LCBsZWZ0L3JpZ2h0IHN0aWNreSBlbGVtZW50cyAoZS5nLiBzdGlja3kgY29sdW1ucylcbiAgICogc2hvdWxkIG1pbmltYWxseSBpbmNyZW1lbnQgc28gdGhhdCB0aGV5IGFyZSBhYm92ZSBub24tc3RpY2t5IGVsZW1lbnRzIGJ1dCBiZWxvdyB0b3AgYW5kIGJvdHRvbVxuICAgKiBlbGVtZW50cy5cbiAgICovXG4gIF9nZXRDYWxjdWxhdGVkWkluZGV4KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgICBjb25zdCB6SW5kZXhJbmNyZW1lbnRzID0ge1xuICAgICAgdG9wOiAxMDAsXG4gICAgICBib3R0b206IDEwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIHJpZ2h0OiAxLFxuICAgIH07XG5cbiAgICBsZXQgekluZGV4ID0gMDtcbiAgICAvLyBVc2UgYEl0ZXJhYmxlYCBpbnN0ZWFkIG9mIGBBcnJheWAgYmVjYXVzZSBUeXBlU2NyaXB0LCBhcyBvZiAzLjYuMyxcbiAgICAvLyBsb3NlcyB0aGUgYXJyYXkgZ2VuZXJpYyB0eXBlIGluIHRoZSBgZm9yIG9mYC4gQnV0IHdlICphbHNvKiBoYXZlIHRvIHVzZSBgQXJyYXlgIGJlY2F1c2VcbiAgICAvLyB0eXBlc2NyaXB0IHdvbid0IGl0ZXJhdGUgb3ZlciBhbiBgSXRlcmFibGVgIHVubGVzcyB5b3UgY29tcGlsZSB3aXRoIGAtLWRvd25sZXZlbEl0ZXJhdGlvbmBcbiAgICBmb3IgKGNvbnN0IGRpciBvZiBTVElDS1lfRElSRUNUSU9OUyBhcyBJdGVyYWJsZTxTdGlja3lEaXJlY3Rpb24+ICYgU3RpY2t5RGlyZWN0aW9uW10pIHtcbiAgICAgIGlmIChlbGVtZW50LnN0eWxlW2Rpcl0pIHtcbiAgICAgICAgekluZGV4ICs9IHpJbmRleEluY3JlbWVudHNbZGlyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gekluZGV4ID8gYCR7ekluZGV4fWAgOiAnJztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB3aWR0aHMgZm9yIGVhY2ggY2VsbCBpbiB0aGUgcHJvdmlkZWQgcm93LiAqL1xuICBfZ2V0Q2VsbFdpZHRocyhyb3c6IEhUTUxFbGVtZW50LCByZWNhbGN1bGF0ZUNlbGxXaWR0aHMgPSB0cnVlKTogbnVtYmVyW10ge1xuICAgIGlmICghcmVjYWxjdWxhdGVDZWxsV2lkdGhzICYmIHRoaXMuX2NhY2hlZENlbGxXaWR0aHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVkQ2VsbFdpZHRocztcbiAgICB9XG5cbiAgICBjb25zdCBjZWxsV2lkdGhzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGZpcnN0Um93Q2VsbHMgPSByb3cuY2hpbGRyZW47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaXJzdFJvd0NlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgY2VsbDogSFRNTEVsZW1lbnQgPSBmaXJzdFJvd0NlbGxzW2ldIGFzIEhUTUxFbGVtZW50O1xuICAgICAgY2VsbFdpZHRocy5wdXNoKGNlbGwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgpO1xuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlZENlbGxXaWR0aHMgPSBjZWxsV2lkdGhzO1xuICAgIHJldHVybiBjZWxsV2lkdGhzO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyBvZiBlYWNoIHN0aWNreSBjb2x1bW4gY2VsbCwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICogYWNjdW11bGF0aW9uIG9mIGFsbCBzdGlja3kgY29sdW1uIGNlbGwgd2lkdGhzIHRvIHRoZSBsZWZ0IGFuZCByaWdodCwgcmVzcGVjdGl2ZWx5LlxuICAgKiBOb24tc3RpY2t5IGNlbGxzIGRvIG5vdCBuZWVkIHRvIGhhdmUgYSB2YWx1ZSBzZXQgc2luY2UgdGhlaXIgcG9zaXRpb25zIHdpbGwgbm90IGJlIGFwcGxpZWQuXG4gICAqL1xuICBfZ2V0U3RpY2t5U3RhcnRDb2x1bW5Qb3NpdGlvbnMod2lkdGhzOiBudW1iZXJbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBuZXh0UG9zaXRpb24gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXNbaV0pIHtcbiAgICAgICAgcG9zaXRpb25zW2ldID0gbmV4dFBvc2l0aW9uO1xuICAgICAgICBuZXh0UG9zaXRpb24gKz0gd2lkdGhzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIG9mIGVhY2ggc3RpY2t5IGNvbHVtbiBjZWxsLCB3aGljaCB3aWxsIGJlIHRoZVxuICAgKiBhY2N1bXVsYXRpb24gb2YgYWxsIHN0aWNreSBjb2x1bW4gY2VsbCB3aWR0aHMgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0LCByZXNwZWN0aXZlbHkuXG4gICAqIE5vbi1zdGlja3kgY2VsbHMgZG8gbm90IG5lZWQgdG8gaGF2ZSBhIHZhbHVlIHNldCBzaW5jZSB0aGVpciBwb3NpdGlvbnMgd2lsbCBub3QgYmUgYXBwbGllZC5cbiAgICovXG4gIF9nZXRTdGlja3lFbmRDb2x1bW5Qb3NpdGlvbnMod2lkdGhzOiBudW1iZXJbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pOiBudW1iZXJbXSB7XG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBuZXh0UG9zaXRpb24gPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IHdpZHRocy5sZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXNbaV0pIHtcbiAgICAgICAgcG9zaXRpb25zW2ldID0gbmV4dFBvc2l0aW9uO1xuICAgICAgICBuZXh0UG9zaXRpb24gKz0gd2lkdGhzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH1cbn1cbiJdfQ==