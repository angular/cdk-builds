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
     */
    constructor(_isNativeHtmlTable, _stickCellCss, direction, 
    /**
     * @deprecated `_coalescedStyleScheduler` parameter to become required.
     * @breaking-change 11.0.0
     */
    _coalescedStyleScheduler, _isBrowser = true, _needsPositionStickyOnElement = true) {
        this._isNativeHtmlTable = _isNativeHtmlTable;
        this._stickCellCss = _stickCellCss;
        this.direction = direction;
        this._coalescedStyleScheduler = _coalescedStyleScheduler;
        this._isBrowser = _isBrowser;
        this._needsPositionStickyOnElement = _needsPositionStickyOnElement;
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
        this._scheduleStyleChanges(() => {
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
     */
    updateStickyColumns(rows, stickyStartStates, stickyEndStates) {
        if (!rows.length || !this._isBrowser || !(stickyStartStates.some(state => state) ||
            stickyEndStates.some(state => state))) {
            return;
        }
        const firstRow = rows[0];
        const numCells = firstRow.children.length;
        const cellWidths = this._getCellWidths(firstRow);
        const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
        const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
        // Coalesce with sticky row updates (and potentially other changes like column resize).
        this._scheduleStyleChanges(() => {
            const isRtl = this.direction === 'rtl';
            const start = isRtl ? 'right' : 'left';
            const end = isRtl ? 'left' : 'right';
            for (const row of rows) {
                for (let i = 0; i < numCells; i++) {
                    const cell = row.children[i];
                    if (stickyStartStates[i]) {
                        this._addStickyStyle(cell, start, startPositions[i]);
                    }
                    if (stickyEndStates[i]) {
                        this._addStickyStyle(cell, end, endPositions[i]);
                    }
                }
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
        const stickyHeights = [];
        const elementsToStick = [];
        for (let rowIndex = 0, stickyHeight = 0; rowIndex < rows.length; rowIndex++) {
            stickyHeights[rowIndex] = stickyHeight;
            if (!states[rowIndex]) {
                continue;
            }
            const row = rows[rowIndex];
            elementsToStick[rowIndex] = this._isNativeHtmlTable ?
                Array.from(row.children) : [row];
            if (rowIndex !== rows.length - 1) {
                stickyHeight += row.getBoundingClientRect().height;
            }
        }
        // Coalesce with other sticky row updates (top/bottom), sticky columns updates
        // (and potentially other changes like column resize).
        this._scheduleStyleChanges(() => {
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                if (!states[rowIndex]) {
                    continue;
                }
                const height = stickyHeights[rowIndex];
                for (const element of elementsToStick[rowIndex]) {
                    this._addStickyStyle(element, position, height);
                }
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
        this._scheduleStyleChanges(() => {
            if (stickyStates.some(state => !state)) {
                this._removeStickyStyle(tfoot, ['bottom']);
            }
            else {
                this._addStickyStyle(tfoot, 'bottom', 0);
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
    _addStickyStyle(element, dir, dirValue) {
        element.classList.add(this._stickCellCss);
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
    _getCellWidths(row) {
        const cellWidths = [];
        const firstRowCells = row.children;
        for (let i = 0; i < firstRowCells.length; i++) {
            let cell = firstRowCells[i];
            cellWidths.push(cell.getBoundingClientRect().width);
        }
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
    /**
     * Schedules styles to be applied when the style scheduler deems appropriate.
     * @breaking-change 11.0.0 This method can be removed in favor of calling
     * `CoalescedStyleScheduler.schedule` directly once the scheduler is a required parameter.
     */
    _scheduleStyleChanges(changes) {
        if (this._coalescedStyleScheduler) {
            this._coalescedStyleScheduler.schedule(changes);
        }
        else {
            changes();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFXSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBc0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUd2Rjs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUN2Qjs7Ozs7Ozs7Ozs7T0FXRztJQUNILFlBQW9CLGtCQUEyQixFQUMzQixhQUFxQixFQUN0QixTQUFvQjtJQUMzQjs7O09BR0c7SUFDSyx3QkFBbUQsRUFDbkQsYUFBYSxJQUFJLEVBQ1IsZ0NBQWdDLElBQUk7UUFUN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1FBQzNCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFLbkIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtRQUNuRCxlQUFVLEdBQVYsVUFBVSxDQUFPO1FBQ1Isa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFPO0lBQUksQ0FBQztJQUV0RTs7Ozs7T0FLRztJQUNILHNCQUFzQixDQUFDLElBQW1CLEVBQUUsZ0JBQW1DO1FBQzdFLE1BQU0sZUFBZSxHQUFrQixFQUFFLENBQUM7UUFDMUMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDdEIsZ0VBQWdFO1lBQ2hFLDJEQUEyRDtZQUMzRCxJQUFJLEdBQUcsQ0FBQyxRQUFRLEtBQUssR0FBRyxDQUFDLFlBQVksRUFBRTtnQkFDckMsU0FBUzthQUNWO1lBRUQsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEs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QixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDO2dCQUM1QixZQUFZLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzNCO1NBQ0Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILDRCQUE0QixDQUFDLE1BQWdCLEVBQUUsWUFBdUI7UUFDcEUsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBQy9CLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVyQixLQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDNUIsWUFBWSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMzQjtTQUNGO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyxxQkFBcUIsQ0FBQyxPQUFtQjtRQUMvQyxJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUNqQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pEO2FBQU07WUFDTCxPQUFPLEVBQUUsQ0FBQztTQUNYO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogRGlyZWN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gc2V0dGluZyBzdGlja3kgcG9zaXRpb25pbmcuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmltcG9ydCB7RGlyZWN0aW9ufSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge19Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcn0gZnJvbSAnLi9jb2FsZXNjZWQtc3R5bGUtc2NoZWR1bGVyJztcblxuZXhwb3J0IHR5cGUgU3RpY2t5RGlyZWN0aW9uID0gJ3RvcCcgfCAnYm90dG9tJyB8ICdsZWZ0JyB8ICdyaWdodCc7XG5cbi8qKlxuICogTGlzdCBvZiBhbGwgcG9zc2libGUgZGlyZWN0aW9ucyB0aGF0IGNhbiBiZSB1c2VkIGZvciBzdGlja3kgcG9zaXRpb25pbmcuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBTVElDS1lfRElSRUNUSU9OUzogU3RpY2t5RGlyZWN0aW9uW10gPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddO1xuXG5cbi8qKlxuICogQXBwbGllcyBhbmQgcmVtb3ZlcyBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIHRvIHRoZSBgQ2RrVGFibGVgIHJvd3MgYW5kIGNvbHVtbnMgY2VsbHMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGlja3lTdHlsZXIge1xuICAvKipcbiAgICogQHBhcmFtIF9pc05hdGl2ZUh0bWxUYWJsZSBXaGV0aGVyIHRoZSBzdGlja3kgbG9naWMgc2hvdWxkIGJlIGJhc2VkIG9uIGEgdGFibGVcbiAgICogICAgIHRoYXQgdXNlcyB0aGUgbmF0aXZlIGA8dGFibGU+YCBlbGVtZW50LlxuICAgKiBAcGFyYW0gX3N0aWNrQ2VsbENzcyBUaGUgQ1NTIGNsYXNzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIGV2ZXJ5IHJvdy9jZWxsIHRoYXQgaGFzXG4gICAqICAgICBzdGlja3kgcG9zaXRpb25pbmcgYXBwbGllZC5cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBUaGUgZGlyZWN0aW9uYWxpdHkgY29udGV4dCBvZiB0aGUgdGFibGUgKGx0ci9ydGwpOyBhZmZlY3RzIGNvbHVtbiBwb3NpdGlvbmluZ1xuICAgKiAgICAgYnkgcmV2ZXJzaW5nIGxlZnQvcmlnaHQgcG9zaXRpb25zLlxuICAgKiBAcGFyYW0gX2lzQnJvd3NlciBXaGV0aGVyIHRoZSB0YWJsZSBpcyBjdXJyZW50bHkgYmVpbmcgcmVuZGVyZWQgb24gdGhlIHNlcnZlciBvciB0aGUgY2xpZW50LlxuICAgKiBAcGFyYW0gX25lZWRzUG9zaXRpb25TdGlja3lPbkVsZW1lbnQgV2hldGhlciB3ZSBuZWVkIHRvIHNwZWNpZnkgcG9zaXRpb246IHN0aWNreSBvbiBjZWxsc1xuICAgKiAgICAgdXNpbmcgaW5saW5lIHN0eWxlcy4gSWYgZmFsc2UsIGl0IGlzIGFzc3VtZWQgdGhhdCBwb3NpdGlvbjogc3RpY2t5IGlzIGluY2x1ZGVkIGluXG4gICAqICAgICB0aGUgY29tcG9uZW50IHN0eWxlc2hlZXQgZm9yIF9zdGlja0NlbGxDc3MuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pc05hdGl2ZUh0bWxUYWJsZTogYm9vbGVhbixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfc3RpY2tDZWxsQ3NzOiBzdHJpbmcsXG4gICAgICAgICAgICAgIHB1YmxpYyBkaXJlY3Rpb246IERpcmVjdGlvbixcbiAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAqIEBkZXByZWNhdGVkIGBfY29hbGVzY2VkU3R5bGVTY2hlZHVsZXJgIHBhcmFtZXRlciB0byBiZWNvbWUgcmVxdWlyZWQuXG4gICAgICAgICAgICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wXG4gICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICBwcml2YXRlIF9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlcj86IF9Db2FsZXNjZWRTdHlsZVNjaGVkdWxlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfaXNCcm93c2VyID0gdHJ1ZSxcbiAgICAgICAgICAgICAgcHJpdmF0ZSByZWFkb25seSBfbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCA9IHRydWUpIHsgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIHN0aWNreSBwb3NpdGlvbmluZyBzdHlsZXMgZnJvbSB0aGUgcm93IGFuZCBpdHMgY2VsbHMgYnkgcmVzZXR0aW5nIHRoZSBgcG9zaXRpb25gXG4gICAqIHN0eWxlLCBzZXR0aW5nIHRoZSB6SW5kZXggdG8gMCwgYW5kIHVuc2V0dGluZyBlYWNoIHByb3ZpZGVkIHN0aWNreSBkaXJlY3Rpb24uXG4gICAqIEBwYXJhbSByb3dzIFRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgY2xlYXJlZCBmcm9tIHN0aWNraW5nIGluIHRoZSBwcm92aWRlZCBkaXJlY3Rpb25zXG4gICAqIEBwYXJhbSBzdGlja3lEaXJlY3Rpb25zIFRoZSBkaXJlY3Rpb25zIHRoYXQgc2hvdWxkIG5vIGxvbmdlciBiZSBzZXQgYXMgc3RpY2t5IG9uIHRoZSByb3dzLlxuICAgKi9cbiAgY2xlYXJTdGlja3lQb3NpdGlvbmluZyhyb3dzOiBIVE1MRWxlbWVudFtdLCBzdGlja3lEaXJlY3Rpb25zOiBTdGlja3lEaXJlY3Rpb25bXSkge1xuICAgIGNvbnN0IGVsZW1lbnRzVG9DbGVhcjogSFRNTEVsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgIC8vIElmIHRoZSByb3cgaXNuJ3QgYW4gZWxlbWVudCAoZS5nLiBpZiBpdCdzIGFuIGBuZy1jb250YWluZXJgKSxcbiAgICAgIC8vIGl0IHdvbid0IGhhdmUgaW5saW5lIHN0eWxlcyBvciBgY2hpbGRyZW5gIHNvIHdlIHNraXAgaXQuXG4gICAgICBpZiAocm93Lm5vZGVUeXBlICE9PSByb3cuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBlbGVtZW50c1RvQ2xlYXIucHVzaChyb3cpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3cuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZWxlbWVudHNUb0NsZWFyLnB1c2gocm93LmNoaWxkcmVuW2ldIGFzIEhUTUxFbGVtZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb2FsZXNjZSB3aXRoIHN0aWNreSByb3cvY29sdW1uIHVwZGF0ZXMgKGFuZCBwb3RlbnRpYWxseSBvdGhlciBjaGFuZ2VzIGxpa2UgY29sdW1uIHJlc2l6ZSkuXG4gICAgdGhpcy5fc2NoZWR1bGVTdHlsZUNoYW5nZXMoKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzVG9DbGVhcikge1xuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3lTdHlsZShlbGVtZW50LCBzdGlja3lEaXJlY3Rpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHN0aWNreSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbnMgdG8gdGhlIGNlbGxzIG9mIGVhY2ggcm93IGFjY29yZGluZyB0byB0aGUgc3RpY2t5XG4gICAqIHN0YXRlcyBvZiB0aGUgcmVuZGVyZWQgY29sdW1uIGRlZmluaXRpb25zLlxuICAgKiBAcGFyYW0gcm93cyBUaGUgcm93cyB0aGF0IHNob3VsZCBoYXZlIGl0cyBzZXQgb2YgY2VsbHMgc3R1Y2sgYWNjb3JkaW5nIHRvIHRoZSBzdGlja3kgc3RhdGVzLlxuICAgKiBAcGFyYW0gc3RpY2t5U3RhcnRTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSBjZWxsXG4gICAqICAgICBpbiB0aGlzIGluZGV4IHBvc2l0aW9uIHNob3VsZCBiZSBzdHVjayB0byB0aGUgc3RhcnQgb2YgdGhlIHJvdy5cbiAgICogQHBhcmFtIHN0aWNreUVuZFN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIGNlbGxcbiAgICogICAgIGluIHRoaXMgaW5kZXggcG9zaXRpb24gc2hvdWxkIGJlIHN0dWNrIHRvIHRoZSBlbmQgb2YgdGhlIHJvdy5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUNvbHVtbnMoXG4gICAgICByb3dzOiBIVE1MRWxlbWVudFtdLCBzdGlja3lTdGFydFN0YXRlczogYm9vbGVhbltdLCBzdGlja3lFbmRTdGF0ZXM6IGJvb2xlYW5bXSkge1xuICAgIGlmICghcm93cy5sZW5ndGggfHwgIXRoaXMuX2lzQnJvd3NlciB8fCAhKHN0aWNreVN0YXJ0U3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpIHx8XG4gICAgICAgIHN0aWNreUVuZFN0YXRlcy5zb21lKHN0YXRlID0+IHN0YXRlKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmaXJzdFJvdyA9IHJvd3NbMF07XG4gICAgY29uc3QgbnVtQ2VsbHMgPSBmaXJzdFJvdy5jaGlsZHJlbi5sZW5ndGg7XG4gICAgY29uc3QgY2VsbFdpZHRoczogbnVtYmVyW10gPSB0aGlzLl9nZXRDZWxsV2lkdGhzKGZpcnN0Um93KTtcblxuICAgIGNvbnN0IHN0YXJ0UG9zaXRpb25zID0gdGhpcy5fZ2V0U3RpY2t5U3RhcnRDb2x1bW5Qb3NpdGlvbnMoY2VsbFdpZHRocywgc3RpY2t5U3RhcnRTdGF0ZXMpO1xuICAgIGNvbnN0IGVuZFBvc2l0aW9ucyA9IHRoaXMuX2dldFN0aWNreUVuZENvbHVtblBvc2l0aW9ucyhjZWxsV2lkdGhzLCBzdGlja3lFbmRTdGF0ZXMpO1xuXG4gICAgLy8gQ29hbGVzY2Ugd2l0aCBzdGlja3kgcm93IHVwZGF0ZXMgKGFuZCBwb3RlbnRpYWxseSBvdGhlciBjaGFuZ2VzIGxpa2UgY29sdW1uIHJlc2l6ZSkuXG4gICAgdGhpcy5fc2NoZWR1bGVTdHlsZUNoYW5nZXMoKCkgPT4ge1xuICAgICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpcmVjdGlvbiA9PT0gJ3J0bCc7XG4gICAgICBjb25zdCBzdGFydCA9IGlzUnRsID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgIGNvbnN0IGVuZCA9IGlzUnRsID8gJ2xlZnQnIDogJ3JpZ2h0JztcblxuICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNlbGxzOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNoaWxkcmVuW2ldIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgIGlmIChzdGlja3lTdGFydFN0YXRlc1tpXSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgc3RhcnQsIHN0YXJ0UG9zaXRpb25zW2ldKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc3RpY2t5RW5kU3RhdGVzW2ldKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRTdGlja3lTdHlsZShjZWxsLCBlbmQsIGVuZFBvc2l0aW9uc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBzdGlja3kgcG9zaXRpb25pbmcgdG8gdGhlIHJvdydzIGNlbGxzIGlmIHVzaW5nIHRoZSBuYXRpdmUgdGFibGUgbGF5b3V0LCBhbmQgdG8gdGhlXG4gICAqIHJvdyBpdHNlbGYgb3RoZXJ3aXNlLlxuICAgKiBAcGFyYW0gcm93c1RvU3RpY2sgVGhlIGxpc3Qgb2Ygcm93cyB0aGF0IHNob3VsZCBiZSBzdHVjayBhY2NvcmRpbmcgdG8gdGhlaXIgY29ycmVzcG9uZGluZ1xuICAgKiAgICAgc3RpY2t5IHN0YXRlIGFuZCB0byB0aGUgcHJvdmlkZWQgdG9wIG9yIGJvdHRvbSBwb3NpdGlvbi5cbiAgICogQHBhcmFtIHN0aWNreVN0YXRlcyBBIGxpc3Qgb2YgYm9vbGVhbiBzdGF0ZXMgd2hlcmUgZWFjaCBzdGF0ZSByZXByZXNlbnRzIHdoZXRoZXIgdGhlIHJvd1xuICAgKiAgICAgc2hvdWxkIGJlIHN0dWNrIGluIHRoZSBwYXJ0aWN1bGFyIHRvcCBvciBib3R0b20gcG9zaXRpb24uXG4gICAqIEBwYXJhbSBwb3NpdGlvbiBUaGUgcG9zaXRpb24gZGlyZWN0aW9uIGluIHdoaWNoIHRoZSByb3cgc2hvdWxkIGJlIHN0dWNrIGlmIHRoYXQgcm93IHNob3VsZCBiZVxuICAgKiAgICAgc3RpY2t5LlxuICAgKlxuICAgKi9cbiAgc3RpY2tSb3dzKHJvd3NUb1N0aWNrOiBIVE1MRWxlbWVudFtdLCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSwgcG9zaXRpb246ICd0b3AnIHwgJ2JvdHRvbScpIHtcbiAgICAvLyBTaW5jZSB3ZSBjYW4ndCBtZWFzdXJlIHRoZSByb3dzIG9uIHRoZSBzZXJ2ZXIsIHdlIGNhbid0IHN0aWNrIHRoZSByb3dzIHByb3Blcmx5LlxuICAgIGlmICghdGhpcy5faXNCcm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgcG9zaXRpb25pbmcgdGhlIHJvd3MgdG8gdGhlIGJvdHRvbSwgcmV2ZXJzZSB0aGVpciBvcmRlciB3aGVuIGV2YWx1YXRpbmcgdGhlIHN0aWNreVxuICAgIC8vIHBvc2l0aW9uIHN1Y2ggdGhhdCB0aGUgbGFzdCByb3cgc3R1Y2sgd2lsbCBiZSBcImJvdHRvbTogMHB4XCIgYW5kIHNvIG9uLiBOb3RlIHRoYXQgdGhlXG4gICAgLy8gc3RpY2t5IHN0YXRlcyBuZWVkIHRvIGJlIHJldmVyc2VkIGFzIHdlbGwuXG4gICAgY29uc3Qgcm93cyA9IHBvc2l0aW9uID09PSAnYm90dG9tJyA/IHJvd3NUb1N0aWNrLnNsaWNlKCkucmV2ZXJzZSgpIDogcm93c1RvU3RpY2s7XG4gICAgY29uc3Qgc3RhdGVzID0gcG9zaXRpb24gPT09ICdib3R0b20nID8gc3RpY2t5U3RhdGVzLnNsaWNlKCkucmV2ZXJzZSgpIDogc3RpY2t5U3RhdGVzO1xuXG4gICAgLy8gTWVhc3VyZSByb3cgaGVpZ2h0cyBhbGwgYXQgb25jZSBiZWZvcmUgYWRkaW5nIHN0aWNreSBzdHlsZXMgdG8gcmVkdWNlIGxheW91dCB0aHJhc2hpbmcuXG4gICAgY29uc3Qgc3RpY2t5SGVpZ2h0czogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBlbGVtZW50c1RvU3RpY2s6IEhUTUxFbGVtZW50W11bXSA9IFtdO1xuICAgIGZvciAobGV0IHJvd0luZGV4ID0gMCwgc3RpY2t5SGVpZ2h0ID0gMDsgcm93SW5kZXggPCByb3dzLmxlbmd0aDsgcm93SW5kZXgrKykge1xuICAgICAgc3RpY2t5SGVpZ2h0c1tyb3dJbmRleF0gPSBzdGlja3lIZWlnaHQ7XG5cbiAgICAgIGlmICghc3RhdGVzW3Jvd0luZGV4XSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgcm93ID0gcm93c1tyb3dJbmRleF07XG4gICAgICBlbGVtZW50c1RvU3RpY2tbcm93SW5kZXhdID0gdGhpcy5faXNOYXRpdmVIdG1sVGFibGUgP1xuICAgICAgICAgIEFycmF5LmZyb20ocm93LmNoaWxkcmVuKSBhcyBIVE1MRWxlbWVudFtdIDogW3Jvd107XG5cbiAgICAgIGlmIChyb3dJbmRleCAhPT0gcm93cy5sZW5ndGggLSAxKSB7XG4gICAgICAgIHN0aWNreUhlaWdodCArPSByb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvYWxlc2NlIHdpdGggb3RoZXIgc3RpY2t5IHJvdyB1cGRhdGVzICh0b3AvYm90dG9tKSwgc3RpY2t5IGNvbHVtbnMgdXBkYXRlc1xuICAgIC8vIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX3NjaGVkdWxlU3R5bGVDaGFuZ2VzKCgpID0+IHtcbiAgICAgIGZvciAobGV0IHJvd0luZGV4ID0gMDsgcm93SW5kZXggPCByb3dzLmxlbmd0aDsgcm93SW5kZXgrKykge1xuICAgICAgICBpZiAoIXN0YXRlc1tyb3dJbmRleF0pIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhlaWdodCA9IHN0aWNreUhlaWdodHNbcm93SW5kZXhdO1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHNUb1N0aWNrW3Jvd0luZGV4XSkge1xuICAgICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKGVsZW1lbnQsIHBvc2l0aW9uLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGluIFNhZmFyaSwgc3RpY2t5IGZvb3RlciBjZWxscyBkbyBub3Qgc3RpY2suIFRoZSBvbmx5IHdheSB0byBzdGlja1xuICAgKiBmb290ZXIgcm93cyBpcyB0byBhcHBseSBzdGlja3kgc3R5bGluZyB0byB0aGUgdGZvb3QgY29udGFpbmVyLiBUaGlzIHNob3VsZCBvbmx5IGJlIGRvbmUgaWZcbiAgICogYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3kuIElmIG5vdCBhbGwgZm9vdGVyIHJvd3MgYXJlIHN0aWNreSwgcmVtb3ZlIHN0aWNreSBwb3NpdGlvbmluZyBmcm9tXG4gICAqIHRoZSB0Zm9vdCBlbGVtZW50LlxuICAgKi9cbiAgdXBkYXRlU3RpY2t5Rm9vdGVyQ29udGFpbmVyKHRhYmxlRWxlbWVudDogRWxlbWVudCwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10pIHtcbiAgICBpZiAoIXRoaXMuX2lzTmF0aXZlSHRtbFRhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGZvb3QgPSB0YWJsZUVsZW1lbnQucXVlcnlTZWxlY3RvcigndGZvb3QnKSE7XG5cbiAgICAvLyBDb2FsZXNjZSB3aXRoIG90aGVyIHN0aWNreSB1cGRhdGVzIChhbmQgcG90ZW50aWFsbHkgb3RoZXIgY2hhbmdlcyBsaWtlIGNvbHVtbiByZXNpemUpLlxuICAgIHRoaXMuX3NjaGVkdWxlU3R5bGVDaGFuZ2VzKCgpID0+IHtcbiAgICAgIGlmIChzdGlja3lTdGF0ZXMuc29tZShzdGF0ZSA9PiAhc3RhdGUpKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreVN0eWxlKHRmb290LCBbJ2JvdHRvbSddKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKHRmb290LCAnYm90dG9tJywgMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgc3RpY2t5IHN0eWxlIG9uIHRoZSBlbGVtZW50IGJ5IHJlbW92aW5nIHRoZSBzdGlja3kgY2VsbCBDU1MgY2xhc3MsIHJlLWV2YWx1YXRpbmdcbiAgICogdGhlIHpJbmRleCwgcmVtb3ZpbmcgZWFjaCBvZiB0aGUgcHJvdmlkZWQgc3RpY2t5IGRpcmVjdGlvbnMsIGFuZCByZW1vdmluZyB0aGVcbiAgICogc3RpY2t5IHBvc2l0aW9uIGlmIHRoZXJlIGFyZSBubyBtb3JlIGRpcmVjdGlvbnMuXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIHN0aWNreURpcmVjdGlvbnM6IFN0aWNreURpcmVjdGlvbltdKSB7XG4gICAgZm9yIChjb25zdCBkaXIgb2Ygc3RpY2t5RGlyZWN0aW9ucykge1xuICAgICAgZWxlbWVudC5zdHlsZVtkaXJdID0gJyc7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGVsZW1lbnQgbm8gbG9uZ2VyIGhhcyBhbnkgbW9yZSBzdGlja3kgZGlyZWN0aW9ucywgcmVtb3ZlIHN0aWNreSBwb3NpdGlvbmluZyBhbmRcbiAgICAvLyB0aGUgc3RpY2t5IENTUyBjbGFzcy5cbiAgICAvLyBTaG9ydC1jaXJjdWl0IGNoZWNraW5nIGVsZW1lbnQuc3R5bGVbZGlyXSBmb3Igc3RpY2t5RGlyZWN0aW9ucyBhcyB0aGV5XG4gICAgLy8gd2VyZSBhbHJlYWR5IHJlbW92ZWQgYWJvdmUuXG4gICAgY29uc3QgaGFzRGlyZWN0aW9uID0gU1RJQ0tZX0RJUkVDVElPTlMuc29tZShkaXIgPT5cbiAgICAgICAgc3RpY2t5RGlyZWN0aW9ucy5pbmRleE9mKGRpcikgPT09IC0xICYmIGVsZW1lbnQuc3R5bGVbZGlyXSk7XG4gICAgaWYgKGhhc0RpcmVjdGlvbikge1xuICAgICAgZWxlbWVudC5zdHlsZS56SW5kZXggPSB0aGlzLl9nZXRDYWxjdWxhdGVkWkluZGV4KGVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaGVuIG5vdCBoYXNEaXJlY3Rpb24sIF9nZXRDYWxjdWxhdGVkWkluZGV4IHdpbGwgYWx3YXlzIHJldHVybiAnJy5cbiAgICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gJyc7XG4gICAgICBpZiAodGhpcy5fbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCkge1xuICAgICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJyc7XG4gICAgICB9XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fc3RpY2tDZWxsQ3NzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgc3RpY2t5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQgYnkgYWRkaW5nIHRoZSBzdGlja3kgc3R5bGUgY2xhc3MsIGNoYW5naW5nIHBvc2l0aW9uXG4gICAqIHRvIGJlIHN0aWNreSAoYW5kIC13ZWJraXQtc3RpY2t5KSwgc2V0dGluZyB0aGUgYXBwcm9wcmlhdGUgekluZGV4LCBhbmQgYWRkaW5nIGEgc3RpY2t5XG4gICAqIGRpcmVjdGlvbiBhbmQgdmFsdWUuXG4gICAqL1xuICBfYWRkU3RpY2t5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIGRpcjogU3RpY2t5RGlyZWN0aW9uLCBkaXJWYWx1ZTogbnVtYmVyKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgZWxlbWVudC5zdHlsZVtkaXJdID0gYCR7ZGlyVmFsdWV9cHhgO1xuICAgIGVsZW1lbnQuc3R5bGUuekluZGV4ID0gdGhpcy5fZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50KTtcbiAgICBpZiAodGhpcy5fbmVlZHNQb3NpdGlvblN0aWNreU9uRWxlbWVudCkge1xuICAgICAgZWxlbWVudC5zdHlsZS5jc3NUZXh0ICs9ICdwb3NpdGlvbjogLXdlYmtpdC1zdGlja3k7IHBvc2l0aW9uOiBzdGlja3k7ICc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSB3aGF0IHRoZSB6LWluZGV4IHNob3VsZCBiZSBmb3IgdGhlIGVsZW1lbnQsIGRlcGVuZGluZyBvbiB3aGF0IGRpcmVjdGlvbnMgKHRvcCxcbiAgICogYm90dG9tLCBsZWZ0LCByaWdodCkgaGF2ZSBiZWVuIHNldC4gSXQgc2hvdWxkIGJlIHRydWUgdGhhdCBlbGVtZW50cyB3aXRoIGEgdG9wIGRpcmVjdGlvblxuICAgKiBzaG91bGQgaGF2ZSB0aGUgaGlnaGVzdCBpbmRleCBzaW5jZSB0aGVzZSBhcmUgZWxlbWVudHMgbGlrZSBhIHRhYmxlIGhlYWRlci4gSWYgYW55IG9mIHRob3NlXG4gICAqIGVsZW1lbnRzIGFyZSBhbHNvIHN0aWNreSBpbiBhbm90aGVyIGRpcmVjdGlvbiwgdGhlbiB0aGV5IHNob3VsZCBhcHBlYXIgYWJvdmUgb3RoZXIgZWxlbWVudHNcbiAgICogdGhhdCBhcmUgb25seSBzdGlja3kgdG9wIChlLmcuIGEgc3RpY2t5IGNvbHVtbiBvbiBhIHN0aWNreSBoZWFkZXIpLiBCb3R0b20tc3RpY2t5IGVsZW1lbnRzXG4gICAqIChlLmcuIGZvb3RlciByb3dzKSBzaG91bGQgdGhlbiBiZSBuZXh0IGluIHRoZSBvcmRlcmluZyBzdWNoIHRoYXQgdGhleSBhcmUgYmVsb3cgdGhlIGhlYWRlclxuICAgKiBidXQgYWJvdmUgYW55IG5vbi1zdGlja3kgZWxlbWVudHMuIEZpbmFsbHksIGxlZnQvcmlnaHQgc3RpY2t5IGVsZW1lbnRzIChlLmcuIHN0aWNreSBjb2x1bW5zKVxuICAgKiBzaG91bGQgbWluaW1hbGx5IGluY3JlbWVudCBzbyB0aGF0IHRoZXkgYXJlIGFib3ZlIG5vbi1zdGlja3kgZWxlbWVudHMgYnV0IGJlbG93IHRvcCBhbmQgYm90dG9tXG4gICAqIGVsZW1lbnRzLlxuICAgKi9cbiAgX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xuICAgIGNvbnN0IHpJbmRleEluY3JlbWVudHMgPSB7XG4gICAgICB0b3A6IDEwMCxcbiAgICAgIGJvdHRvbTogMTAsXG4gICAgICBsZWZ0OiAxLFxuICAgICAgcmlnaHQ6IDEsXG4gICAgfTtcblxuICAgIGxldCB6SW5kZXggPSAwO1xuICAgIC8vIFVzZSBgSXRlcmFibGVgIGluc3RlYWQgb2YgYEFycmF5YCBiZWNhdXNlIFR5cGVTY3JpcHQsIGFzIG9mIDMuNi4zLFxuICAgIC8vIGxvc2VzIHRoZSBhcnJheSBnZW5lcmljIHR5cGUgaW4gdGhlIGBmb3Igb2ZgLiBCdXQgd2UgKmFsc28qIGhhdmUgdG8gdXNlIGBBcnJheWAgYmVjYXVzZVxuICAgIC8vIHR5cGVzY3JpcHQgd29uJ3QgaXRlcmF0ZSBvdmVyIGFuIGBJdGVyYWJsZWAgdW5sZXNzIHlvdSBjb21waWxlIHdpdGggYC0tZG93bmxldmVsSXRlcmF0aW9uYFxuICAgIGZvciAoY29uc3QgZGlyIG9mIFNUSUNLWV9ESVJFQ1RJT05TIGFzIEl0ZXJhYmxlPFN0aWNreURpcmVjdGlvbj4gJiBTdGlja3lEaXJlY3Rpb25bXSkge1xuICAgICAgaWYgKGVsZW1lbnQuc3R5bGVbZGlyXSkge1xuICAgICAgICB6SW5kZXggKz0gekluZGV4SW5jcmVtZW50c1tkaXJdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB6SW5kZXggPyBgJHt6SW5kZXh9YCA6ICcnO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHdpZHRocyBmb3IgZWFjaCBjZWxsIGluIHRoZSBwcm92aWRlZCByb3cuICovXG4gIF9nZXRDZWxsV2lkdGhzKHJvdzogSFRNTEVsZW1lbnQpOiBudW1iZXJbXSB7XG4gICAgY29uc3QgY2VsbFdpZHRoczogbnVtYmVyW10gPSBbXTtcbiAgICBjb25zdCBmaXJzdFJvd0NlbGxzID0gcm93LmNoaWxkcmVuO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlyc3RSb3dDZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGNlbGw6IEhUTUxFbGVtZW50ID0gZmlyc3RSb3dDZWxsc1tpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgIGNlbGxXaWR0aHMucHVzaChjZWxsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2VsbFdpZHRocztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbnMgb2YgZWFjaCBzdGlja3kgY29sdW1uIGNlbGwsIHdoaWNoIHdpbGwgYmUgdGhlXG4gICAqIGFjY3VtdWxhdGlvbiBvZiBhbGwgc3RpY2t5IGNvbHVtbiBjZWxsIHdpZHRocyB0byB0aGUgbGVmdCBhbmQgcmlnaHQsIHJlc3BlY3RpdmVseS5cbiAgICogTm9uLXN0aWNreSBjZWxscyBkbyBub3QgbmVlZCB0byBoYXZlIGEgdmFsdWUgc2V0IHNpbmNlIHRoZWlyIHBvc2l0aW9ucyB3aWxsIG5vdCBiZSBhcHBsaWVkLlxuICAgKi9cbiAgX2dldFN0aWNreVN0YXJ0Q29sdW1uUG9zaXRpb25zKHdpZHRoczogbnVtYmVyW10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gMDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2lkdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzW2ldKSB7XG4gICAgICAgIHBvc2l0aW9uc1tpXSA9IG5leHRQb3NpdGlvbjtcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHdpZHRoc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGxlZnQgYW5kIHJpZ2h0IHBvc2l0aW9ucyBvZiBlYWNoIHN0aWNreSBjb2x1bW4gY2VsbCwgd2hpY2ggd2lsbCBiZSB0aGVcbiAgICogYWNjdW11bGF0aW9uIG9mIGFsbCBzdGlja3kgY29sdW1uIGNlbGwgd2lkdGhzIHRvIHRoZSBsZWZ0IGFuZCByaWdodCwgcmVzcGVjdGl2ZWx5LlxuICAgKiBOb24tc3RpY2t5IGNlbGxzIGRvIG5vdCBuZWVkIHRvIGhhdmUgYSB2YWx1ZSBzZXQgc2luY2UgdGhlaXIgcG9zaXRpb25zIHdpbGwgbm90IGJlIGFwcGxpZWQuXG4gICAqL1xuICBfZ2V0U3RpY2t5RW5kQ29sdW1uUG9zaXRpb25zKHdpZHRoczogbnVtYmVyW10sIHN0aWNreVN0YXRlczogYm9vbGVhbltdKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgbmV4dFBvc2l0aW9uID0gMDtcblxuICAgIGZvciAobGV0IGkgPSB3aWR0aHMubGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICBpZiAoc3RpY2t5U3RhdGVzW2ldKSB7XG4gICAgICAgIHBvc2l0aW9uc1tpXSA9IG5leHRQb3NpdGlvbjtcbiAgICAgICAgbmV4dFBvc2l0aW9uICs9IHdpZHRoc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBzdHlsZXMgdG8gYmUgYXBwbGllZCB3aGVuIHRoZSBzdHlsZSBzY2hlZHVsZXIgZGVlbXMgYXBwcm9wcmlhdGUuXG4gICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wIFRoaXMgbWV0aG9kIGNhbiBiZSByZW1vdmVkIGluIGZhdm9yIG9mIGNhbGxpbmdcbiAgICogYENvYWxlc2NlZFN0eWxlU2NoZWR1bGVyLnNjaGVkdWxlYCBkaXJlY3RseSBvbmNlIHRoZSBzY2hlZHVsZXIgaXMgYSByZXF1aXJlZCBwYXJhbWV0ZXIuXG4gICAqL1xuICBwcml2YXRlIF9zY2hlZHVsZVN0eWxlQ2hhbmdlcyhjaGFuZ2VzOiAoKSA9PiB2b2lkKSB7XG4gICAgaWYgKHRoaXMuX2NvYWxlc2NlZFN0eWxlU2NoZWR1bGVyKSB7XG4gICAgICB0aGlzLl9jb2FsZXNjZWRTdHlsZVNjaGVkdWxlci5zY2hlZHVsZShjaGFuZ2VzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hhbmdlcygpO1xuICAgIH1cbiAgfVxufVxuIl19