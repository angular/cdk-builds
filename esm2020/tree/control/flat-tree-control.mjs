/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseTreeControl } from './base-tree-control';
/** Flat tree control. Able to expand/collapse a subtree recursively for flattened tree. */
export class FlatTreeControl extends BaseTreeControl {
    /** Construct with flat tree data node functions getLevel and isExpandable. */
    constructor(getLevel, isExpandable, options) {
        super();
        this.getLevel = getLevel;
        this.isExpandable = isExpandable;
        this.options = options;
        if (this.options) {
            this.trackBy = this.options.trackBy;
        }
    }
    /**
     * Gets a list of the data node's subtree of descendent data nodes.
     *
     * To make this working, the `dataNodes` of the TreeControl must be flattened tree nodes
     * with correct levels.
     */
    getDescendants(dataNode) {
        const startIndex = this.dataNodes.indexOf(dataNode);
        const results = [];
        // Goes through flattened tree nodes in the `dataNodes` array, and get all descendants.
        // The level of descendants of a tree node must be greater than the level of the given
        // tree node.
        // If we reach a node whose level is equal to the level of the tree node, we hit a sibling.
        // If we reach a node whose level is greater than the level of the tree node, we hit a
        // sibling of an ancestor.
        for (let i = startIndex + 1; i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]); i++) {
            results.push(this.dataNodes[i]);
        }
        return results;
    }
    /**
     * Expands all data nodes in the tree.
     *
     * To make this working, the `dataNodes` variable of the TreeControl must be set to all flattened
     * data nodes of the tree.
     */
    expandAll() {
        this.expansionModel.select(...this.dataNodes.map(node => this._trackByValue(node)));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhdC10cmVlLWNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3RyZWUvY29udHJvbC9mbGF0LXRyZWUtY29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFPcEQsMkZBQTJGO0FBQzNGLE1BQU0sT0FBTyxlQUEwQixTQUFRLGVBQXFCO0lBRWxFLDhFQUE4RTtJQUM5RSxZQUNvQixRQUFpQyxFQUNqQyxZQUFzQyxFQUMvQyxPQUFzQztRQUMvQyxLQUFLLEVBQUUsQ0FBQztRQUhVLGFBQVEsR0FBUixRQUFRLENBQXlCO1FBQ2pDLGlCQUFZLEdBQVosWUFBWSxDQUEwQjtRQUMvQyxZQUFPLEdBQVAsT0FBTyxDQUErQjtRQUcvQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUNyQztJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGNBQWMsQ0FBQyxRQUFXO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sT0FBTyxHQUFRLEVBQUUsQ0FBQztRQUV4Qix1RkFBdUY7UUFDdkYsc0ZBQXNGO1FBQ3RGLGFBQWE7UUFDYiwyRkFBMkY7UUFDM0Ysc0ZBQXNGO1FBQ3RGLDBCQUEwQjtRQUMxQixLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsR0FBRyxDQUFDLEVBQ3ZCLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN2RixDQUFDLEVBQUUsRUFBRTtZQUNQLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBUztRQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCYXNlVHJlZUNvbnRyb2x9IGZyb20gJy4vYmFzZS10cmVlLWNvbnRyb2wnO1xuXG4vKiogT3B0aW9uYWwgc2V0IG9mIGNvbmZpZ3VyYXRpb24gdGhhdCBjYW4gYmUgcHJvdmlkZWQgdG8gdGhlIEZsYXRUcmVlQ29udHJvbC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmxhdFRyZWVDb250cm9sT3B0aW9uczxULCBLPiB7XG4gIHRyYWNrQnk/OiAoZGF0YU5vZGU6IFQpID0+IEs7XG59XG5cbi8qKiBGbGF0IHRyZWUgY29udHJvbC4gQWJsZSB0byBleHBhbmQvY29sbGFwc2UgYSBzdWJ0cmVlIHJlY3Vyc2l2ZWx5IGZvciBmbGF0dGVuZWQgdHJlZS4gKi9cbmV4cG9ydCBjbGFzcyBGbGF0VHJlZUNvbnRyb2w8VCwgSyA9IFQ+IGV4dGVuZHMgQmFzZVRyZWVDb250cm9sPFQsIEs+IHtcblxuICAvKiogQ29uc3RydWN0IHdpdGggZmxhdCB0cmVlIGRhdGEgbm9kZSBmdW5jdGlvbnMgZ2V0TGV2ZWwgYW5kIGlzRXhwYW5kYWJsZS4gKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgb3ZlcnJpZGUgZ2V0TGV2ZWw6IChkYXRhTm9kZTogVCkgPT4gbnVtYmVyLFxuICAgICAgcHVibGljIG92ZXJyaWRlIGlzRXhwYW5kYWJsZTogKGRhdGFOb2RlOiBUKSA9PiBib29sZWFuLFxuICAgICAgcHVibGljIG9wdGlvbnM/OiBGbGF0VHJlZUNvbnRyb2xPcHRpb25zPFQsIEs+KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHRoaXMudHJhY2tCeSA9IHRoaXMub3B0aW9ucy50cmFja0J5O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgbGlzdCBvZiB0aGUgZGF0YSBub2RlJ3Mgc3VidHJlZSBvZiBkZXNjZW5kZW50IGRhdGEgbm9kZXMuXG4gICAqXG4gICAqIFRvIG1ha2UgdGhpcyB3b3JraW5nLCB0aGUgYGRhdGFOb2Rlc2Agb2YgdGhlIFRyZWVDb250cm9sIG11c3QgYmUgZmxhdHRlbmVkIHRyZWUgbm9kZXNcbiAgICogd2l0aCBjb3JyZWN0IGxldmVscy5cbiAgICovXG4gIGdldERlc2NlbmRhbnRzKGRhdGFOb2RlOiBUKTogVFtdIHtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gdGhpcy5kYXRhTm9kZXMuaW5kZXhPZihkYXRhTm9kZSk7XG4gICAgY29uc3QgcmVzdWx0czogVFtdID0gW107XG5cbiAgICAvLyBHb2VzIHRocm91Z2ggZmxhdHRlbmVkIHRyZWUgbm9kZXMgaW4gdGhlIGBkYXRhTm9kZXNgIGFycmF5LCBhbmQgZ2V0IGFsbCBkZXNjZW5kYW50cy5cbiAgICAvLyBUaGUgbGV2ZWwgb2YgZGVzY2VuZGFudHMgb2YgYSB0cmVlIG5vZGUgbXVzdCBiZSBncmVhdGVyIHRoYW4gdGhlIGxldmVsIG9mIHRoZSBnaXZlblxuICAgIC8vIHRyZWUgbm9kZS5cbiAgICAvLyBJZiB3ZSByZWFjaCBhIG5vZGUgd2hvc2UgbGV2ZWwgaXMgZXF1YWwgdG8gdGhlIGxldmVsIG9mIHRoZSB0cmVlIG5vZGUsIHdlIGhpdCBhIHNpYmxpbmcuXG4gICAgLy8gSWYgd2UgcmVhY2ggYSBub2RlIHdob3NlIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiB0aGUgbGV2ZWwgb2YgdGhlIHRyZWUgbm9kZSwgd2UgaGl0IGFcbiAgICAvLyBzaWJsaW5nIG9mIGFuIGFuY2VzdG9yLlxuICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4ICsgMTtcbiAgICAgICAgaSA8IHRoaXMuZGF0YU5vZGVzLmxlbmd0aCAmJiB0aGlzLmdldExldmVsKGRhdGFOb2RlKSA8IHRoaXMuZ2V0TGV2ZWwodGhpcy5kYXRhTm9kZXNbaV0pO1xuICAgICAgICBpKyspIHtcbiAgICAgIHJlc3VsdHMucHVzaCh0aGlzLmRhdGFOb2Rlc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgYWxsIGRhdGEgbm9kZXMgaW4gdGhlIHRyZWUuXG4gICAqXG4gICAqIFRvIG1ha2UgdGhpcyB3b3JraW5nLCB0aGUgYGRhdGFOb2Rlc2AgdmFyaWFibGUgb2YgdGhlIFRyZWVDb250cm9sIG11c3QgYmUgc2V0IHRvIGFsbCBmbGF0dGVuZWRcbiAgICogZGF0YSBub2RlcyBvZiB0aGUgdHJlZS5cbiAgICovXG4gIGV4cGFuZEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLmV4cGFuc2lvbk1vZGVsLnNlbGVjdCguLi50aGlzLmRhdGFOb2Rlcy5tYXAobm9kZSA9PiB0aGlzLl90cmFja0J5VmFsdWUobm9kZSkpKTtcbiAgfVxufVxuIl19