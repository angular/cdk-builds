/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __values } from "tslib";
/**
 * List of all possible directions that can be used for sticky positioning.
 * @docs-private
 */
export var STICKY_DIRECTIONS = ['top', 'bottom', 'left', 'right'];
/**
 * Applies and removes sticky positioning styles to the `CdkTable` rows and columns cells.
 * @docs-private
 */
var StickyStyler = /** @class */ (function () {
    /**
     * @param _isNativeHtmlTable Whether the sticky logic should be based on a table
     *     that uses the native `<table>` element.
     * @param _stickCellCss The CSS class that will be applied to every row/cell that has
     *     sticky positioning applied.
     * @param direction The directionality context of the table (ltr/rtl); affects column positioning
     *     by reversing left/right positions.
     * @param _isBrowser Whether the table is currently being rendered on the server or the client.
     */
    function StickyStyler(_isNativeHtmlTable, _stickCellCss, direction, _isBrowser) {
        if (_isBrowser === void 0) { _isBrowser = true; }
        this._isNativeHtmlTable = _isNativeHtmlTable;
        this._stickCellCss = _stickCellCss;
        this.direction = direction;
        this._isBrowser = _isBrowser;
    }
    /**
     * Clears the sticky positioning styles from the row and its cells by resetting the `position`
     * style, setting the zIndex to 0, and unsetting each provided sticky direction.
     * @param rows The list of rows that should be cleared from sticking in the provided directions
     * @param stickyDirections The directions that should no longer be set as sticky on the rows.
     */
    StickyStyler.prototype.clearStickyPositioning = function (rows, stickyDirections) {
        var e_1, _a;
        try {
            for (var rows_1 = __values(rows), rows_1_1 = rows_1.next(); !rows_1_1.done; rows_1_1 = rows_1.next()) {
                var row = rows_1_1.value;
                // If the row isn't an element (e.g. if it's an `ng-container`),
                // it won't have inline styles or `children` so we skip it.
                if (row.nodeType !== row.ELEMENT_NODE) {
                    continue;
                }
                this._removeStickyStyle(row, stickyDirections);
                for (var i = 0; i < row.children.length; i++) {
                    var cell = row.children[i];
                    this._removeStickyStyle(cell, stickyDirections);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rows_1_1 && !rows_1_1.done && (_a = rows_1.return)) _a.call(rows_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * Applies sticky left and right positions to the cells of each row according to the sticky
     * states of the rendered column definitions.
     * @param rows The rows that should have its set of cells stuck according to the sticky states.
     * @param stickyStartStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the start of the row.
     * @param stickyEndStates A list of boolean states where each state represents whether the cell
     *     in this index position should be stuck to the end of the row.
     */
    StickyStyler.prototype.updateStickyColumns = function (rows, stickyStartStates, stickyEndStates) {
        var e_2, _a;
        var hasStickyColumns = stickyStartStates.some(function (state) { return state; }) || stickyEndStates.some(function (state) { return state; });
        if (!rows.length || !hasStickyColumns || !this._isBrowser) {
            return;
        }
        var firstRow = rows[0];
        var numCells = firstRow.children.length;
        var cellWidths = this._getCellWidths(firstRow);
        var startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
        var endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);
        var isRtl = this.direction === 'rtl';
        try {
            for (var rows_2 = __values(rows), rows_2_1 = rows_2.next(); !rows_2_1.done; rows_2_1 = rows_2.next()) {
                var row = rows_2_1.value;
                for (var i = 0; i < numCells; i++) {
                    var cell = row.children[i];
                    if (stickyStartStates[i]) {
                        this._addStickyStyle(cell, isRtl ? 'right' : 'left', startPositions[i]);
                    }
                    if (stickyEndStates[i]) {
                        this._addStickyStyle(cell, isRtl ? 'left' : 'right', endPositions[i]);
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (rows_2_1 && !rows_2_1.done && (_a = rows_2.return)) _a.call(rows_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
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
    StickyStyler.prototype.stickRows = function (rowsToStick, stickyStates, position) {
        // Since we can't measure the rows on the server, we can't stick the rows properly.
        if (!this._isBrowser) {
            return;
        }
        // If positioning the rows to the bottom, reverse their order when evaluating the sticky
        // position such that the last row stuck will be "bottom: 0px" and so on. Note that the
        // sticky states need to be reversed as well.
        var rows = position === 'bottom' ? rowsToStick.slice().reverse() : rowsToStick;
        var states = position === 'bottom' ? stickyStates.slice().reverse() : stickyStates;
        var stickyHeight = 0;
        for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            if (!states[rowIndex]) {
                continue;
            }
            var row = rows[rowIndex];
            if (this._isNativeHtmlTable) {
                for (var j = 0; j < row.children.length; j++) {
                    var cell = row.children[j];
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
    };
    /**
     * When using the native table in Safari, sticky footer cells do not stick. The only way to stick
     * footer rows is to apply sticky styling to the tfoot container. This should only be done if
     * all footer rows are sticky. If not all footer rows are sticky, remove sticky positioning from
     * the tfoot element.
     */
    StickyStyler.prototype.updateStickyFooterContainer = function (tableElement, stickyStates) {
        if (!this._isNativeHtmlTable) {
            return;
        }
        var tfoot = tableElement.querySelector('tfoot');
        if (stickyStates.some(function (state) { return !state; })) {
            this._removeStickyStyle(tfoot, ['bottom']);
        }
        else {
            this._addStickyStyle(tfoot, 'bottom', 0);
        }
    };
    /**
     * Removes the sticky style on the element by removing the sticky cell CSS class, re-evaluating
     * the zIndex, removing each of the provided sticky directions, and removing the
     * sticky position if there are no more directions.
     */
    StickyStyler.prototype._removeStickyStyle = function (element, stickyDirections) {
        var e_3, _a;
        try {
            for (var stickyDirections_1 = __values(stickyDirections), stickyDirections_1_1 = stickyDirections_1.next(); !stickyDirections_1_1.done; stickyDirections_1_1 = stickyDirections_1.next()) {
                var dir = stickyDirections_1_1.value;
                element.style[dir] = '';
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (stickyDirections_1_1 && !stickyDirections_1_1.done && (_a = stickyDirections_1.return)) _a.call(stickyDirections_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        element.style.zIndex = this._getCalculatedZIndex(element);
        // If the element no longer has any more sticky directions, remove sticky positioning and
        // the sticky CSS class.
        var hasDirection = STICKY_DIRECTIONS.some(function (dir) { return !!element.style[dir]; });
        if (!hasDirection) {
            element.style.position = '';
            element.classList.remove(this._stickCellCss);
        }
    };
    /**
     * Adds the sticky styling to the element by adding the sticky style class, changing position
     * to be sticky (and -webkit-sticky), setting the appropriate zIndex, and adding a sticky
     * direction and value.
     */
    StickyStyler.prototype._addStickyStyle = function (element, dir, dirValue) {
        element.classList.add(this._stickCellCss);
        element.style[dir] = dirValue + "px";
        element.style.cssText += 'position: -webkit-sticky; position: sticky; ';
        element.style.zIndex = this._getCalculatedZIndex(element);
    };
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
    StickyStyler.prototype._getCalculatedZIndex = function (element) {
        var e_4, _a;
        var zIndexIncrements = {
            top: 100,
            bottom: 10,
            left: 1,
            right: 1,
        };
        var zIndex = 0;
        try {
            // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
            // loses the array generic type in the `for of`. But we *also* have to use `Array` because
            // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
            for (var _b = __values(STICKY_DIRECTIONS), _c = _b.next(); !_c.done; _c = _b.next()) {
                var dir = _c.value;
                if (element.style[dir]) {
                    zIndex += zIndexIncrements[dir];
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return zIndex ? "" + zIndex : '';
    };
    /** Gets the widths for each cell in the provided row. */
    StickyStyler.prototype._getCellWidths = function (row) {
        var cellWidths = [];
        var firstRowCells = row.children;
        for (var i = 0; i < firstRowCells.length; i++) {
            var cell = firstRowCells[i];
            cellWidths.push(cell.getBoundingClientRect().width);
        }
        return cellWidths;
    };
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     */
    StickyStyler.prototype._getStickyStartColumnPositions = function (widths, stickyStates) {
        var positions = [];
        var nextPosition = 0;
        for (var i = 0; i < widths.length; i++) {
            if (stickyStates[i]) {
                positions[i] = nextPosition;
                nextPosition += widths[i];
            }
        }
        return positions;
    };
    /**
     * Determines the left and right positions of each sticky column cell, which will be the
     * accumulation of all sticky column cell widths to the left and right, respectively.
     * Non-sticky cells do not need to have a value set since their positions will not be applied.
     */
    StickyStyler.prototype._getStickyEndColumnPositions = function (widths, stickyStates) {
        var positions = [];
        var nextPosition = 0;
        for (var i = widths.length; i > 0; i--) {
            if (stickyStates[i]) {
                positions[i] = nextPosition;
                nextPosition += widths[i];
            }
        }
        return positions;
    };
    return StickyStyler;
}());
export { StickyStyler };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5LXN0eWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdGFibGUvc3RpY2t5LXN0eWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBVUg7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLElBQU0saUJBQWlCLEdBQXNCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFFdkY7OztHQUdHO0FBQ0g7SUFDRTs7Ozs7Ozs7T0FRRztJQUNILHNCQUFvQixrQkFBMkIsRUFDM0IsYUFBcUIsRUFDdEIsU0FBb0IsRUFDbkIsVUFBaUI7UUFBakIsMkJBQUEsRUFBQSxpQkFBaUI7UUFIakIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1FBQzNCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3RCLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDbkIsZUFBVSxHQUFWLFVBQVUsQ0FBTztJQUFJLENBQUM7SUFFMUM7Ozs7O09BS0c7SUFDSCw2Q0FBc0IsR0FBdEIsVUFBdUIsSUFBbUIsRUFBRSxnQkFBbUM7OztZQUM3RSxLQUFrQixJQUFBLFNBQUEsU0FBQSxJQUFJLENBQUEsMEJBQUEsNENBQUU7Z0JBQW5CLElBQU0sR0FBRyxpQkFBQTtnQkFDWixnRUFBZ0U7Z0JBQ2hFLDJEQUEyRDtnQkFDM0QsSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxZQUFZLEVBQUU7b0JBQ3JDLFNBQVM7aUJBQ1Y7Z0JBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUUvQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzVDLElBQU0sSUFBSSxHQUFHLEdBQUcs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QUFFLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckQ7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHFEQUE4QixHQUE5QixVQUErQixNQUFnQixFQUFFLFlBQXVCO1FBQ3RFLElBQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztRQUMvQixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFFckIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7Z0JBQzVCLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0I7U0FDRjtRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsbURBQTRCLEdBQTVCLFVBQTZCLE1BQWdCLEVBQUUsWUFBdUI7UUFDcEUsSUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBQy9CLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUVyQixLQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDNUIsWUFBWSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMzQjtTQUNGO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQWxRRCxJQWtRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIERpcmVjdGlvbnMgdGhhdCBjYW4gYmUgdXNlZCB3aGVuIHNldHRpbmcgc3RpY2t5IHBvc2l0aW9uaW5nLlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5pbXBvcnQge0RpcmVjdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuXG5leHBvcnQgdHlwZSBTdGlja3lEaXJlY3Rpb24gPSAndG9wJyB8ICdib3R0b20nIHwgJ2xlZnQnIHwgJ3JpZ2h0JztcblxuLyoqXG4gKiBMaXN0IG9mIGFsbCBwb3NzaWJsZSBkaXJlY3Rpb25zIHRoYXQgY2FuIGJlIHVzZWQgZm9yIHN0aWNreSBwb3NpdGlvbmluZy5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IFNUSUNLWV9ESVJFQ1RJT05TOiBTdGlja3lEaXJlY3Rpb25bXSA9IFsndG9wJywgJ2JvdHRvbScsICdsZWZ0JywgJ3JpZ2h0J107XG5cbi8qKlxuICogQXBwbGllcyBhbmQgcmVtb3ZlcyBzdGlja3kgcG9zaXRpb25pbmcgc3R5bGVzIHRvIHRoZSBgQ2RrVGFibGVgIHJvd3MgYW5kIGNvbHVtbnMgY2VsbHMuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGlja3lTdHlsZXIge1xuICAvKipcbiAgICogQHBhcmFtIF9pc05hdGl2ZUh0bWxUYWJsZSBXaGV0aGVyIHRoZSBzdGlja3kgbG9naWMgc2hvdWxkIGJlIGJhc2VkIG9uIGEgdGFibGVcbiAgICogICAgIHRoYXQgdXNlcyB0aGUgbmF0aXZlIGA8dGFibGU+YCBlbGVtZW50LlxuICAgKiBAcGFyYW0gX3N0aWNrQ2VsbENzcyBUaGUgQ1NTIGNsYXNzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIGV2ZXJ5IHJvdy9jZWxsIHRoYXQgaGFzXG4gICAqICAgICBzdGlja3kgcG9zaXRpb25pbmcgYXBwbGllZC5cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBUaGUgZGlyZWN0aW9uYWxpdHkgY29udGV4dCBvZiB0aGUgdGFibGUgKGx0ci9ydGwpOyBhZmZlY3RzIGNvbHVtbiBwb3NpdGlvbmluZ1xuICAgKiAgICAgYnkgcmV2ZXJzaW5nIGxlZnQvcmlnaHQgcG9zaXRpb25zLlxuICAgKiBAcGFyYW0gX2lzQnJvd3NlciBXaGV0aGVyIHRoZSB0YWJsZSBpcyBjdXJyZW50bHkgYmVpbmcgcmVuZGVyZWQgb24gdGhlIHNlcnZlciBvciB0aGUgY2xpZW50LlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaXNOYXRpdmVIdG1sVGFibGU6IGJvb2xlYW4sXG4gICAgICAgICAgICAgIHByaXZhdGUgX3N0aWNrQ2VsbENzczogc3RyaW5nLFxuICAgICAgICAgICAgICBwdWJsaWMgZGlyZWN0aW9uOiBEaXJlY3Rpb24sXG4gICAgICAgICAgICAgIHByaXZhdGUgX2lzQnJvd3NlciA9IHRydWUpIHsgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIHN0aWNreSBwb3NpdGlvbmluZyBzdHlsZXMgZnJvbSB0aGUgcm93IGFuZCBpdHMgY2VsbHMgYnkgcmVzZXR0aW5nIHRoZSBgcG9zaXRpb25gXG4gICAqIHN0eWxlLCBzZXR0aW5nIHRoZSB6SW5kZXggdG8gMCwgYW5kIHVuc2V0dGluZyBlYWNoIHByb3ZpZGVkIHN0aWNreSBkaXJlY3Rpb24uXG4gICAqIEBwYXJhbSByb3dzIFRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgY2xlYXJlZCBmcm9tIHN0aWNraW5nIGluIHRoZSBwcm92aWRlZCBkaXJlY3Rpb25zXG4gICAqIEBwYXJhbSBzdGlja3lEaXJlY3Rpb25zIFRoZSBkaXJlY3Rpb25zIHRoYXQgc2hvdWxkIG5vIGxvbmdlciBiZSBzZXQgYXMgc3RpY2t5IG9uIHRoZSByb3dzLlxuICAgKi9cbiAgY2xlYXJTdGlja3lQb3NpdGlvbmluZyhyb3dzOiBIVE1MRWxlbWVudFtdLCBzdGlja3lEaXJlY3Rpb25zOiBTdGlja3lEaXJlY3Rpb25bXSkge1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgIC8vIElmIHRoZSByb3cgaXNuJ3QgYW4gZWxlbWVudCAoZS5nLiBpZiBpdCdzIGFuIGBuZy1jb250YWluZXJgKSxcbiAgICAgIC8vIGl0IHdvbid0IGhhdmUgaW5saW5lIHN0eWxlcyBvciBgY2hpbGRyZW5gIHNvIHdlIHNraXAgaXQuXG4gICAgICBpZiAocm93Lm5vZGVUeXBlICE9PSByb3cuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9yZW1vdmVTdGlja3lTdHlsZShyb3csIHN0aWNreURpcmVjdGlvbnMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvdy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjZWxsID0gcm93LmNoaWxkcmVuW2ldIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3lTdHlsZShjZWxsLCBzdGlja3lEaXJlY3Rpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBzdGlja3kgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIHRvIHRoZSBjZWxscyBvZiBlYWNoIHJvdyBhY2NvcmRpbmcgdG8gdGhlIHN0aWNreVxuICAgKiBzdGF0ZXMgb2YgdGhlIHJlbmRlcmVkIGNvbHVtbiBkZWZpbml0aW9ucy5cbiAgICogQHBhcmFtIHJvd3MgVGhlIHJvd3MgdGhhdCBzaG91bGQgaGF2ZSBpdHMgc2V0IG9mIGNlbGxzIHN0dWNrIGFjY29yZGluZyB0byB0aGUgc3RpY2t5IHN0YXRlcy5cbiAgICogQHBhcmFtIHN0aWNreVN0YXJ0U3RhdGVzIEEgbGlzdCBvZiBib29sZWFuIHN0YXRlcyB3aGVyZSBlYWNoIHN0YXRlIHJlcHJlc2VudHMgd2hldGhlciB0aGUgY2VsbFxuICAgKiAgICAgaW4gdGhpcyBpbmRleCBwb3NpdGlvbiBzaG91bGQgYmUgc3R1Y2sgdG8gdGhlIHN0YXJ0IG9mIHRoZSByb3cuXG4gICAqIEBwYXJhbSBzdGlja3lFbmRTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSBjZWxsXG4gICAqICAgICBpbiB0aGlzIGluZGV4IHBvc2l0aW9uIHNob3VsZCBiZSBzdHVjayB0byB0aGUgZW5kIG9mIHRoZSByb3cuXG4gICAqL1xuICB1cGRhdGVTdGlja3lDb2x1bW5zKFxuICAgICAgcm93czogSFRNTEVsZW1lbnRbXSwgc3RpY2t5U3RhcnRTdGF0ZXM6IGJvb2xlYW5bXSwgc3RpY2t5RW5kU3RhdGVzOiBib29sZWFuW10pIHtcbiAgICBjb25zdCBoYXNTdGlja3lDb2x1bW5zID1cbiAgICAgICAgc3RpY2t5U3RhcnRTdGF0ZXMuc29tZShzdGF0ZSA9PiBzdGF0ZSkgfHwgc3RpY2t5RW5kU3RhdGVzLnNvbWUoc3RhdGUgPT4gc3RhdGUpO1xuICAgIGlmICghcm93cy5sZW5ndGggfHwgIWhhc1N0aWNreUNvbHVtbnMgfHwgIXRoaXMuX2lzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZpcnN0Um93ID0gcm93c1swXTtcbiAgICBjb25zdCBudW1DZWxscyA9IGZpcnN0Um93LmNoaWxkcmVuLmxlbmd0aDtcbiAgICBjb25zdCBjZWxsV2lkdGhzOiBudW1iZXJbXSA9IHRoaXMuX2dldENlbGxXaWR0aHMoZmlyc3RSb3cpO1xuXG4gICAgY29uc3Qgc3RhcnRQb3NpdGlvbnMgPSB0aGlzLl9nZXRTdGlja3lTdGFydENvbHVtblBvc2l0aW9ucyhjZWxsV2lkdGhzLCBzdGlja3lTdGFydFN0YXRlcyk7XG4gICAgY29uc3QgZW5kUG9zaXRpb25zID0gdGhpcy5fZ2V0U3RpY2t5RW5kQ29sdW1uUG9zaXRpb25zKGNlbGxXaWR0aHMsIHN0aWNreUVuZFN0YXRlcyk7XG4gICAgY29uc3QgaXNSdGwgPSB0aGlzLmRpcmVjdGlvbiA9PT0gJ3J0bCc7XG5cbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUNlbGxzOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHJvdy5jaGlsZHJlbltpXSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgaWYgKHN0aWNreVN0YXJ0U3RhdGVzW2ldKSB7XG4gICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgaXNSdGwgPyAncmlnaHQnIDogJ2xlZnQnLCBzdGFydFBvc2l0aW9uc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RpY2t5RW5kU3RhdGVzW2ldKSB7XG4gICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgaXNSdGwgPyAnbGVmdCcgOiAncmlnaHQnLCBlbmRQb3NpdGlvbnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgc3RpY2t5IHBvc2l0aW9uaW5nIHRvIHRoZSByb3cncyBjZWxscyBpZiB1c2luZyB0aGUgbmF0aXZlIHRhYmxlIGxheW91dCwgYW5kIHRvIHRoZVxuICAgKiByb3cgaXRzZWxmIG90aGVyd2lzZS5cbiAgICogQHBhcmFtIHJvd3NUb1N0aWNrIFRoZSBsaXN0IG9mIHJvd3MgdGhhdCBzaG91bGQgYmUgc3R1Y2sgYWNjb3JkaW5nIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmdcbiAgICogICAgIHN0aWNreSBzdGF0ZSBhbmQgdG8gdGhlIHByb3ZpZGVkIHRvcCBvciBib3R0b20gcG9zaXRpb24uXG4gICAqIEBwYXJhbSBzdGlja3lTdGF0ZXMgQSBsaXN0IG9mIGJvb2xlYW4gc3RhdGVzIHdoZXJlIGVhY2ggc3RhdGUgcmVwcmVzZW50cyB3aGV0aGVyIHRoZSByb3dcbiAgICogICAgIHNob3VsZCBiZSBzdHVjayBpbiB0aGUgcGFydGljdWxhciB0b3Agb3IgYm90dG9tIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gcG9zaXRpb24gVGhlIHBvc2l0aW9uIGRpcmVjdGlvbiBpbiB3aGljaCB0aGUgcm93IHNob3VsZCBiZSBzdHVjayBpZiB0aGF0IHJvdyBzaG91bGQgYmVcbiAgICogICAgIHN0aWNreS5cbiAgICpcbiAgICovXG4gIHN0aWNrUm93cyhyb3dzVG9TdGljazogSFRNTEVsZW1lbnRbXSwgc3RpY2t5U3RhdGVzOiBib29sZWFuW10sIHBvc2l0aW9uOiAndG9wJyB8ICdib3R0b20nKSB7XG4gICAgLy8gU2luY2Ugd2UgY2FuJ3QgbWVhc3VyZSB0aGUgcm93cyBvbiB0aGUgc2VydmVyLCB3ZSBjYW4ndCBzdGljayB0aGUgcm93cyBwcm9wZXJseS5cbiAgICBpZiAoIXRoaXMuX2lzQnJvd3Nlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHBvc2l0aW9uaW5nIHRoZSByb3dzIHRvIHRoZSBib3R0b20sIHJldmVyc2UgdGhlaXIgb3JkZXIgd2hlbiBldmFsdWF0aW5nIHRoZSBzdGlja3lcbiAgICAvLyBwb3NpdGlvbiBzdWNoIHRoYXQgdGhlIGxhc3Qgcm93IHN0dWNrIHdpbGwgYmUgXCJib3R0b206IDBweFwiIGFuZCBzbyBvbi4gTm90ZSB0aGF0IHRoZVxuICAgIC8vIHN0aWNreSBzdGF0ZXMgbmVlZCB0byBiZSByZXZlcnNlZCBhcyB3ZWxsLlxuICAgIGNvbnN0IHJvd3MgPSBwb3NpdGlvbiA9PT0gJ2JvdHRvbScgPyByb3dzVG9TdGljay5zbGljZSgpLnJldmVyc2UoKSA6IHJvd3NUb1N0aWNrO1xuICAgIGNvbnN0IHN0YXRlcyA9IHBvc2l0aW9uID09PSAnYm90dG9tJyA/IHN0aWNreVN0YXRlcy5zbGljZSgpLnJldmVyc2UoKSA6IHN0aWNreVN0YXRlcztcblxuICAgIGxldCBzdGlja3lIZWlnaHQgPSAwO1xuICAgIGZvciAobGV0IHJvd0luZGV4ID0gMDsgcm93SW5kZXggPCByb3dzLmxlbmd0aDsgcm93SW5kZXgrKykge1xuICAgICAgaWYgKCFzdGF0ZXNbcm93SW5kZXhdKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByb3cgPSByb3dzW3Jvd0luZGV4XTtcbiAgICAgIGlmICh0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJvdy5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGNlbGwgPSByb3cuY2hpbGRyZW5bal0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgdGhpcy5fYWRkU3RpY2t5U3R5bGUoY2VsbCwgcG9zaXRpb24sIHN0aWNreUhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZsZXggZG9lcyBub3QgcmVzcGVjdCB0aGUgc3RpY2sgcG9zaXRpb25pbmcgb24gdGhlIGNlbGxzLCBuZWVkcyB0byBiZSBhcHBsaWVkIHRvIHRoZSByb3cuXG4gICAgICAgIC8vIElmIHRoaXMgaXMgYXBwbGllZCBvbiBhIG5hdGl2ZSB0YWJsZSwgU2FmYXJpIGNhdXNlcyB0aGUgaGVhZGVyIHRvIGZseSBpbiB3cm9uZyBkaXJlY3Rpb24uXG4gICAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKHJvdywgcG9zaXRpb24sIHN0aWNreUhlaWdodCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb3dJbmRleCA9PT0gcm93cy5sZW5ndGggLSAxKSB7XG4gICAgICAgIC8vIHByZXZlbnQgdW5uZWNlc3NhcnkgcmVmbG93IGZyb20gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc3RpY2t5SGVpZ2h0ICs9IHJvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdXNpbmcgdGhlIG5hdGl2ZSB0YWJsZSBpbiBTYWZhcmksIHN0aWNreSBmb290ZXIgY2VsbHMgZG8gbm90IHN0aWNrLiBUaGUgb25seSB3YXkgdG8gc3RpY2tcbiAgICogZm9vdGVyIHJvd3MgaXMgdG8gYXBwbHkgc3RpY2t5IHN0eWxpbmcgdG8gdGhlIHRmb290IGNvbnRhaW5lci4gVGhpcyBzaG91bGQgb25seSBiZSBkb25lIGlmXG4gICAqIGFsbCBmb290ZXIgcm93cyBhcmUgc3RpY2t5LiBJZiBub3QgYWxsIGZvb3RlciByb3dzIGFyZSBzdGlja3ksIHJlbW92ZSBzdGlja3kgcG9zaXRpb25pbmcgZnJvbVxuICAgKiB0aGUgdGZvb3QgZWxlbWVudC5cbiAgICovXG4gIHVwZGF0ZVN0aWNreUZvb3RlckNvbnRhaW5lcih0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHN0aWNreVN0YXRlczogYm9vbGVhbltdKSB7XG4gICAgaWYgKCF0aGlzLl9pc05hdGl2ZUh0bWxUYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRmb290ID0gdGFibGVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3Rmb290JykhO1xuICAgIGlmIChzdGlja3lTdGF0ZXMuc29tZShzdGF0ZSA9PiAhc3RhdGUpKSB7XG4gICAgICB0aGlzLl9yZW1vdmVTdGlja3lTdHlsZSh0Zm9vdCwgWydib3R0b20nXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FkZFN0aWNreVN0eWxlKHRmb290LCAnYm90dG9tJywgMCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHN0aWNreSBzdHlsZSBvbiB0aGUgZWxlbWVudCBieSByZW1vdmluZyB0aGUgc3RpY2t5IGNlbGwgQ1NTIGNsYXNzLCByZS1ldmFsdWF0aW5nXG4gICAqIHRoZSB6SW5kZXgsIHJlbW92aW5nIGVhY2ggb2YgdGhlIHByb3ZpZGVkIHN0aWNreSBkaXJlY3Rpb25zLCBhbmQgcmVtb3ZpbmcgdGhlXG4gICAqIHN0aWNreSBwb3NpdGlvbiBpZiB0aGVyZSBhcmUgbm8gbW9yZSBkaXJlY3Rpb25zLlxuICAgKi9cbiAgX3JlbW92ZVN0aWNreVN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBzdGlja3lEaXJlY3Rpb25zOiBTdGlja3lEaXJlY3Rpb25bXSkge1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHN0aWNreURpcmVjdGlvbnMpIHtcbiAgICAgIGVsZW1lbnQuc3R5bGVbZGlyXSA9ICcnO1xuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG5cbiAgICAvLyBJZiB0aGUgZWxlbWVudCBubyBsb25nZXIgaGFzIGFueSBtb3JlIHN0aWNreSBkaXJlY3Rpb25zLCByZW1vdmUgc3RpY2t5IHBvc2l0aW9uaW5nIGFuZFxuICAgIC8vIHRoZSBzdGlja3kgQ1NTIGNsYXNzLlxuICAgIGNvbnN0IGhhc0RpcmVjdGlvbiA9IFNUSUNLWV9ESVJFQ1RJT05TLnNvbWUoZGlyID0+ICEhZWxlbWVudC5zdHlsZVtkaXJdKTtcbiAgICBpZiAoIWhhc0RpcmVjdGlvbikge1xuICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICcnO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX3N0aWNrQ2VsbENzcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIHN0aWNreSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IGJ5IGFkZGluZyB0aGUgc3RpY2t5IHN0eWxlIGNsYXNzLCBjaGFuZ2luZyBwb3NpdGlvblxuICAgKiB0byBiZSBzdGlja3kgKGFuZCAtd2Via2l0LXN0aWNreSksIHNldHRpbmcgdGhlIGFwcHJvcHJpYXRlIHpJbmRleCwgYW5kIGFkZGluZyBhIHN0aWNreVxuICAgKiBkaXJlY3Rpb24gYW5kIHZhbHVlLlxuICAgKi9cbiAgX2FkZFN0aWNreVN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkaXI6IFN0aWNreURpcmVjdGlvbiwgZGlyVmFsdWU6IG51bWJlcikge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLl9zdGlja0NlbGxDc3MpO1xuICAgIGVsZW1lbnQuc3R5bGVbZGlyXSA9IGAke2RpclZhbHVlfXB4YDtcbiAgICBlbGVtZW50LnN0eWxlLmNzc1RleHQgKz0gJ3Bvc2l0aW9uOiAtd2Via2l0LXN0aWNreTsgcG9zaXRpb246IHN0aWNreTsgJztcbiAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IHRoaXMuX2dldENhbGN1bGF0ZWRaSW5kZXgoZWxlbWVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIHdoYXQgdGhlIHotaW5kZXggc2hvdWxkIGJlIGZvciB0aGUgZWxlbWVudCwgZGVwZW5kaW5nIG9uIHdoYXQgZGlyZWN0aW9ucyAodG9wLFxuICAgKiBib3R0b20sIGxlZnQsIHJpZ2h0KSBoYXZlIGJlZW4gc2V0LiBJdCBzaG91bGQgYmUgdHJ1ZSB0aGF0IGVsZW1lbnRzIHdpdGggYSB0b3AgZGlyZWN0aW9uXG4gICAqIHNob3VsZCBoYXZlIHRoZSBoaWdoZXN0IGluZGV4IHNpbmNlIHRoZXNlIGFyZSBlbGVtZW50cyBsaWtlIGEgdGFibGUgaGVhZGVyLiBJZiBhbnkgb2YgdGhvc2VcbiAgICogZWxlbWVudHMgYXJlIGFsc28gc3RpY2t5IGluIGFub3RoZXIgZGlyZWN0aW9uLCB0aGVuIHRoZXkgc2hvdWxkIGFwcGVhciBhYm92ZSBvdGhlciBlbGVtZW50c1xuICAgKiB0aGF0IGFyZSBvbmx5IHN0aWNreSB0b3AgKGUuZy4gYSBzdGlja3kgY29sdW1uIG9uIGEgc3RpY2t5IGhlYWRlcikuIEJvdHRvbS1zdGlja3kgZWxlbWVudHNcbiAgICogKGUuZy4gZm9vdGVyIHJvd3MpIHNob3VsZCB0aGVuIGJlIG5leHQgaW4gdGhlIG9yZGVyaW5nIHN1Y2ggdGhhdCB0aGV5IGFyZSBiZWxvdyB0aGUgaGVhZGVyXG4gICAqIGJ1dCBhYm92ZSBhbnkgbm9uLXN0aWNreSBlbGVtZW50cy4gRmluYWxseSwgbGVmdC9yaWdodCBzdGlja3kgZWxlbWVudHMgKGUuZy4gc3RpY2t5IGNvbHVtbnMpXG4gICAqIHNob3VsZCBtaW5pbWFsbHkgaW5jcmVtZW50IHNvIHRoYXQgdGhleSBhcmUgYWJvdmUgbm9uLXN0aWNreSBlbGVtZW50cyBidXQgYmVsb3cgdG9wIGFuZCBib3R0b21cbiAgICogZWxlbWVudHMuXG4gICAqL1xuICBfZ2V0Q2FsY3VsYXRlZFpJbmRleChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHN0cmluZyB7XG4gICAgY29uc3QgekluZGV4SW5jcmVtZW50cyA9IHtcbiAgICAgIHRvcDogMTAwLFxuICAgICAgYm90dG9tOiAxMCxcbiAgICAgIGxlZnQ6IDEsXG4gICAgICByaWdodDogMSxcbiAgICB9O1xuXG4gICAgbGV0IHpJbmRleCA9IDA7XG4gICAgLy8gVXNlIGBJdGVyYWJsZWAgaW5zdGVhZCBvZiBgQXJyYXlgIGJlY2F1c2UgVHlwZVNjcmlwdCwgYXMgb2YgMy42LjMsXG4gICAgLy8gbG9zZXMgdGhlIGFycmF5IGdlbmVyaWMgdHlwZSBpbiB0aGUgYGZvciBvZmAuIEJ1dCB3ZSAqYWxzbyogaGF2ZSB0byB1c2UgYEFycmF5YCBiZWNhdXNlXG4gICAgLy8gdHlwZXNjcmlwdCB3b24ndCBpdGVyYXRlIG92ZXIgYW4gYEl0ZXJhYmxlYCB1bmxlc3MgeW91IGNvbXBpbGUgd2l0aCBgLS1kb3dubGV2ZWxJdGVyYXRpb25gXG4gICAgZm9yIChjb25zdCBkaXIgb2YgU1RJQ0tZX0RJUkVDVElPTlMgYXMgSXRlcmFibGU8U3RpY2t5RGlyZWN0aW9uPiAmIEFycmF5PFN0aWNreURpcmVjdGlvbj4pIHtcbiAgICAgIGlmIChlbGVtZW50LnN0eWxlW2Rpcl0pIHtcbiAgICAgICAgekluZGV4ICs9IHpJbmRleEluY3JlbWVudHNbZGlyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gekluZGV4ID8gYCR7ekluZGV4fWAgOiAnJztcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSB3aWR0aHMgZm9yIGVhY2ggY2VsbCBpbiB0aGUgcHJvdmlkZWQgcm93LiAqL1xuICBfZ2V0Q2VsbFdpZHRocyhyb3c6IEhUTUxFbGVtZW50KTogbnVtYmVyW10ge1xuICAgIGNvbnN0IGNlbGxXaWR0aHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgZmlyc3RSb3dDZWxscyA9IHJvdy5jaGlsZHJlbjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpcnN0Um93Q2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBjZWxsOiBIVE1MRWxlbWVudCA9IGZpcnN0Um93Q2VsbHNbaV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgICBjZWxsV2lkdGhzLnB1c2goY2VsbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNlbGxXaWR0aHM7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgbGVmdCBhbmQgcmlnaHQgcG9zaXRpb25zIG9mIGVhY2ggc3RpY2t5IGNvbHVtbiBjZWxsLCB3aGljaCB3aWxsIGJlIHRoZVxuICAgKiBhY2N1bXVsYXRpb24gb2YgYWxsIHN0aWNreSBjb2x1bW4gY2VsbCB3aWR0aHMgdG8gdGhlIGxlZnQgYW5kIHJpZ2h0LCByZXNwZWN0aXZlbHkuXG4gICAqIE5vbi1zdGlja3kgY2VsbHMgZG8gbm90IG5lZWQgdG8gaGF2ZSBhIHZhbHVlIHNldCBzaW5jZSB0aGVpciBwb3NpdGlvbnMgd2lsbCBub3QgYmUgYXBwbGllZC5cbiAgICovXG4gIF9nZXRTdGlja3lTdGFydENvbHVtblBvc2l0aW9ucyh3aWR0aHM6IG51bWJlcltdLCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSk6IG51bWJlcltdIHtcbiAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IG5leHRQb3NpdGlvbiA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRocy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHN0aWNreVN0YXRlc1tpXSkge1xuICAgICAgICBwb3NpdGlvbnNbaV0gPSBuZXh0UG9zaXRpb247XG4gICAgICAgIG5leHRQb3NpdGlvbiArPSB3aWR0aHNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBsZWZ0IGFuZCByaWdodCBwb3NpdGlvbnMgb2YgZWFjaCBzdGlja3kgY29sdW1uIGNlbGwsIHdoaWNoIHdpbGwgYmUgdGhlXG4gICAqIGFjY3VtdWxhdGlvbiBvZiBhbGwgc3RpY2t5IGNvbHVtbiBjZWxsIHdpZHRocyB0byB0aGUgbGVmdCBhbmQgcmlnaHQsIHJlc3BlY3RpdmVseS5cbiAgICogTm9uLXN0aWNreSBjZWxscyBkbyBub3QgbmVlZCB0byBoYXZlIGEgdmFsdWUgc2V0IHNpbmNlIHRoZWlyIHBvc2l0aW9ucyB3aWxsIG5vdCBiZSBhcHBsaWVkLlxuICAgKi9cbiAgX2dldFN0aWNreUVuZENvbHVtblBvc2l0aW9ucyh3aWR0aHM6IG51bWJlcltdLCBzdGlja3lTdGF0ZXM6IGJvb2xlYW5bXSk6IG51bWJlcltdIHtcbiAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdID0gW107XG4gICAgbGV0IG5leHRQb3NpdGlvbiA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gd2lkdGhzLmxlbmd0aDsgaSA+IDA7IGktLSkge1xuICAgICAgaWYgKHN0aWNreVN0YXRlc1tpXSkge1xuICAgICAgICBwb3NpdGlvbnNbaV0gPSBuZXh0UG9zaXRpb247XG4gICAgICAgIG5leHRQb3NpdGlvbiArPSB3aWR0aHNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfVxufVxuIl19