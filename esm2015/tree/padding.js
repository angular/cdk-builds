/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Directive, ElementRef, Input, Optional, Renderer2 } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CdkTree, CdkTreeNode } from './tree';
/** Regex used to split a string on its CSS units. */
const cssUnitPattern = /([A-Za-z%]+)$/;
/**
 * Indent for the children tree dataNodes.
 * This directive will add left-padding to the node to show hierarchy.
 */
let CdkTreeNodePadding = /** @class */ (() => {
    class CdkTreeNodePadding {
        constructor(_treeNode, _tree, 
        /**
         * @deprecated _renderer parameter no longer being used. To be removed.
         * @breaking-change 11.0.0
         */
        _renderer, _element, _dir) {
            this._treeNode = _treeNode;
            this._tree = _tree;
            this._element = _element;
            this._dir = _dir;
            /** Subject that emits when the component has been destroyed. */
            this._destroyed = new Subject();
            /** CSS units used for the indentation value. */
            this.indentUnits = 'px';
            this._indent = 40;
            this._setPadding();
            if (_dir) {
                _dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => this._setPadding(true));
            }
            // In Ivy the indentation binding might be set before the tree node's data has been added,
            // which means that we'll miss the first render. We have to subscribe to changes in the
            // data to ensure that everything is up to date.
            _treeNode._dataChanges.subscribe(() => this._setPadding());
        }
        /** The level of depth of the tree node. The padding will be `level * indent` pixels. */
        get level() { return this._level; }
        set level(value) {
            // Set to null as the fallback value so that _setPadding can fall back to the node level if the
            // consumer set the directive as `cdkTreeNodePadding=""`. We still want to take this value if
            // they set 0 explicitly.
            this._level = coerceNumberProperty(value, null);
            this._setPadding();
        }
        /**
         * The indent for each level. Can be a number or a CSS string.
         * Default number 40px from material design menu sub-menu spec.
         */
        get indent() { return this._indent; }
        set indent(indent) {
            let value = indent;
            let units = 'px';
            if (typeof indent === 'string') {
                const parts = indent.split(cssUnitPattern);
                value = parts[0];
                units = parts[1] || units;
            }
            this.indentUnits = units;
            this._indent = coerceNumberProperty(value);
            this._setPadding();
        }
        ngOnDestroy() {
            this._destroyed.next();
            this._destroyed.complete();
        }
        /** The padding indent value for the tree node. Returns a string with px numbers if not null. */
        _paddingIndent() {
            const nodeLevel = (this._treeNode.data && this._tree.treeControl.getLevel)
                ? this._tree.treeControl.getLevel(this._treeNode.data)
                : null;
            const level = this._level == null ? nodeLevel : this._level;
            return typeof level === 'number' ? `${level * this._indent}${this.indentUnits}` : null;
        }
        _setPadding(forceChange = false) {
            const padding = this._paddingIndent();
            if (padding !== this._currentPadding || forceChange) {
                const element = this._element.nativeElement;
                const paddingProp = this._dir && this._dir.value === 'rtl' ? 'paddingRight' : 'paddingLeft';
                const resetProp = paddingProp === 'paddingLeft' ? 'paddingRight' : 'paddingLeft';
                element.style[paddingProp] = padding || '';
                element.style[resetProp] = '';
                this._currentPadding = padding;
            }
        }
    }
    CdkTreeNodePadding.decorators = [
        { type: Directive, args: [{
                    selector: '[cdkTreeNodePadding]',
                },] }
    ];
    /** @nocollapse */
    CdkTreeNodePadding.ctorParameters = () => [
        { type: CdkTreeNode },
        { type: CdkTree },
        { type: Renderer2 },
        { type: ElementRef },
        { type: Directionality, decorators: [{ type: Optional }] }
    ];
    CdkTreeNodePadding.propDecorators = {
        level: [{ type: Input, args: ['cdkTreeNodePadding',] }],
        indent: [{ type: Input, args: ['cdkTreeNodePaddingIndent',] }]
    };
    return CdkTreeNodePadding;
})();
export { CdkTreeNodePadding };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFkZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvdHJlZS9wYWRkaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQWMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQWEsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUU1QyxxREFBcUQ7QUFDckQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBRXZDOzs7R0FHRztBQUNIO0lBQUEsTUFHYSxrQkFBa0I7UUE0QzdCLFlBQW9CLFNBQXlCLEVBQ3pCLEtBQWlCO1FBQ3pCOzs7V0FHRztRQUNILFNBQW9CLEVBQ1osUUFBaUMsRUFDckIsSUFBb0I7WUFSaEMsY0FBUyxHQUFULFNBQVMsQ0FBZ0I7WUFDekIsVUFBSyxHQUFMLEtBQUssQ0FBWTtZQU1qQixhQUFRLEdBQVIsUUFBUSxDQUF5QjtZQUNyQixTQUFJLEdBQUosSUFBSSxDQUFnQjtZQWhEcEQsZ0VBQWdFO1lBQ3hELGVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1lBRXpDLGdEQUFnRDtZQUNoRCxnQkFBVyxHQUFHLElBQUksQ0FBQztZQWtDbkIsWUFBTyxHQUFXLEVBQUUsQ0FBQztZQVduQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsSUFBSSxJQUFJLEVBQUU7Z0JBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDdEY7WUFFRCwwRkFBMEY7WUFDMUYsdUZBQXVGO1lBQ3ZGLGdEQUFnRDtZQUNoRCxTQUFTLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBcERELHdGQUF3RjtRQUN4RixJQUNJLEtBQUssS0FBYSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzNDLElBQUksS0FBSyxDQUFDLEtBQWE7WUFDckIsK0ZBQStGO1lBQy9GLDZGQUE2RjtZQUM3Rix5QkFBeUI7WUFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFHRDs7O1dBR0c7UUFDSCxJQUNJLE1BQU0sS0FBc0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLE1BQU0sQ0FBQyxNQUF1QjtZQUNoQyxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUM7WUFDbkIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBRWpCLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO2dCQUM5QixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUMzQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQzthQUMzQjtZQUVELElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUF1QkQsV0FBVztZQUNULElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsZ0dBQWdHO1FBQ2hHLGNBQWM7WUFDWixNQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztnQkFDeEUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDdEQsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNULE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDNUQsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDekYsQ0FBQztRQUVELFdBQVcsQ0FBQyxXQUFXLEdBQUcsS0FBSztZQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFdEMsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLGVBQWUsSUFBSSxXQUFXLEVBQUU7Z0JBQ25ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO2dCQUM1QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7Z0JBQzVGLE1BQU0sU0FBUyxHQUFHLFdBQVcsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO2dCQUNqRixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQzNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sQ0FBQzthQUNoQztRQUNILENBQUM7OztnQkE1RkYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxzQkFBc0I7aUJBQ2pDOzs7O2dCQVhnQixXQUFXO2dCQUFwQixPQUFPO2dCQUg0QyxTQUFTO2dCQUFqRCxVQUFVO2dCQUZyQixjQUFjLHVCQXFFUCxRQUFROzs7d0JBekNwQixLQUFLLFNBQUMsb0JBQW9CO3lCQWUxQixLQUFLLFNBQUMsMEJBQTBCOztJQWtFbkMseUJBQUM7S0FBQTtTQTVGWSxrQkFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtEaXJlY3Rpb25hbGl0eX0gZnJvbSAnQGFuZ3VsYXIvY2RrL2JpZGknO1xuaW1wb3J0IHtjb2VyY2VOdW1iZXJQcm9wZXJ0eSwgTnVtYmVySW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge0RpcmVjdGl2ZSwgRWxlbWVudFJlZiwgSW5wdXQsIE9uRGVzdHJveSwgT3B0aW9uYWwsIFJlbmRlcmVyMn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge3Rha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHtTdWJqZWN0fSBmcm9tICdyeGpzJztcbmltcG9ydCB7Q2RrVHJlZSwgQ2RrVHJlZU5vZGV9IGZyb20gJy4vdHJlZSc7XG5cbi8qKiBSZWdleCB1c2VkIHRvIHNwbGl0IGEgc3RyaW5nIG9uIGl0cyBDU1MgdW5pdHMuICovXG5jb25zdCBjc3NVbml0UGF0dGVybiA9IC8oW0EtWmEteiVdKykkLztcblxuLyoqXG4gKiBJbmRlbnQgZm9yIHRoZSBjaGlsZHJlbiB0cmVlIGRhdGFOb2Rlcy5cbiAqIFRoaXMgZGlyZWN0aXZlIHdpbGwgYWRkIGxlZnQtcGFkZGluZyB0byB0aGUgbm9kZSB0byBzaG93IGhpZXJhcmNoeS5cbiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka1RyZWVOb2RlUGFkZGluZ10nLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtUcmVlTm9kZVBhZGRpbmc8VD4gaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvKiogQ3VycmVudCBwYWRkaW5nIHZhbHVlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuIFVzZWQgdG8gYXZvaWQgdW5uZWNlc3NhcmlseSBoaXR0aW5nIHRoZSBET00uICovXG4gIHByaXZhdGUgX2N1cnJlbnRQYWRkaW5nOiBzdHJpbmd8bnVsbDtcblxuICAvKiogU3ViamVjdCB0aGF0IGVtaXRzIHdoZW4gdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQuICovXG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIENTUyB1bml0cyB1c2VkIGZvciB0aGUgaW5kZW50YXRpb24gdmFsdWUuICovXG4gIGluZGVudFVuaXRzID0gJ3B4JztcblxuICAvKiogVGhlIGxldmVsIG9mIGRlcHRoIG9mIHRoZSB0cmVlIG5vZGUuIFRoZSBwYWRkaW5nIHdpbGwgYmUgYGxldmVsICogaW5kZW50YCBwaXhlbHMuICovXG4gIEBJbnB1dCgnY2RrVHJlZU5vZGVQYWRkaW5nJylcbiAgZ2V0IGxldmVsKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9sZXZlbDsgfVxuICBzZXQgbGV2ZWwodmFsdWU6IG51bWJlcikge1xuICAgIC8vIFNldCB0byBudWxsIGFzIHRoZSBmYWxsYmFjayB2YWx1ZSBzbyB0aGF0IF9zZXRQYWRkaW5nIGNhbiBmYWxsIGJhY2sgdG8gdGhlIG5vZGUgbGV2ZWwgaWYgdGhlXG4gICAgLy8gY29uc3VtZXIgc2V0IHRoZSBkaXJlY3RpdmUgYXMgYGNka1RyZWVOb2RlUGFkZGluZz1cIlwiYC4gV2Ugc3RpbGwgd2FudCB0byB0YWtlIHRoaXMgdmFsdWUgaWZcbiAgICAvLyB0aGV5IHNldCAwIGV4cGxpY2l0bHkuXG4gICAgdGhpcy5fbGV2ZWwgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSwgbnVsbCkhO1xuICAgIHRoaXMuX3NldFBhZGRpbmcoKTtcbiAgfVxuICBfbGV2ZWw6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGVudCBmb3IgZWFjaCBsZXZlbC4gQ2FuIGJlIGEgbnVtYmVyIG9yIGEgQ1NTIHN0cmluZy5cbiAgICogRGVmYXVsdCBudW1iZXIgNDBweCBmcm9tIG1hdGVyaWFsIGRlc2lnbiBtZW51IHN1Yi1tZW51IHNwZWMuXG4gICAqL1xuICBASW5wdXQoJ2Nka1RyZWVOb2RlUGFkZGluZ0luZGVudCcpXG4gIGdldCBpbmRlbnQoKTogbnVtYmVyIHwgc3RyaW5nIHsgcmV0dXJuIHRoaXMuX2luZGVudDsgfVxuICBzZXQgaW5kZW50KGluZGVudDogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IHZhbHVlID0gaW5kZW50O1xuICAgIGxldCB1bml0cyA9ICdweCc7XG5cbiAgICBpZiAodHlwZW9mIGluZGVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHBhcnRzID0gaW5kZW50LnNwbGl0KGNzc1VuaXRQYXR0ZXJuKTtcbiAgICAgIHZhbHVlID0gcGFydHNbMF07XG4gICAgICB1bml0cyA9IHBhcnRzWzFdIHx8IHVuaXRzO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZW50VW5pdHMgPSB1bml0cztcbiAgICB0aGlzLl9pbmRlbnQgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSk7XG4gICAgdGhpcy5fc2V0UGFkZGluZygpO1xuICB9XG4gIF9pbmRlbnQ6IG51bWJlciA9IDQwO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3RyZWVOb2RlOiBDZGtUcmVlTm9kZTxUPixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfdHJlZTogQ2RrVHJlZTxUPixcbiAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAqIEBkZXByZWNhdGVkIF9yZW5kZXJlciBwYXJhbWV0ZXIgbm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgICAqIEBicmVha2luZy1jaGFuZ2UgMTEuMC4wXG4gICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICBfcmVuZGVyZXI6IFJlbmRlcmVyMixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBfZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgICAgICAgICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHkpIHtcbiAgICB0aGlzLl9zZXRQYWRkaW5nKCk7XG4gICAgaWYgKF9kaXIpIHtcbiAgICAgIF9kaXIuY2hhbmdlLnBpcGUodGFrZVVudGlsKHRoaXMuX2Rlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zZXRQYWRkaW5nKHRydWUpKTtcbiAgICB9XG5cbiAgICAvLyBJbiBJdnkgdGhlIGluZGVudGF0aW9uIGJpbmRpbmcgbWlnaHQgYmUgc2V0IGJlZm9yZSB0aGUgdHJlZSBub2RlJ3MgZGF0YSBoYXMgYmVlbiBhZGRlZCxcbiAgICAvLyB3aGljaCBtZWFucyB0aGF0IHdlJ2xsIG1pc3MgdGhlIGZpcnN0IHJlbmRlci4gV2UgaGF2ZSB0byBzdWJzY3JpYmUgdG8gY2hhbmdlcyBpbiB0aGVcbiAgICAvLyBkYXRhIHRvIGVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgdXAgdG8gZGF0ZS5cbiAgICBfdHJlZU5vZGUuX2RhdGFDaGFuZ2VzLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9zZXRQYWRkaW5nKCkpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKiBUaGUgcGFkZGluZyBpbmRlbnQgdmFsdWUgZm9yIHRoZSB0cmVlIG5vZGUuIFJldHVybnMgYSBzdHJpbmcgd2l0aCBweCBudW1iZXJzIGlmIG5vdCBudWxsLiAqL1xuICBfcGFkZGluZ0luZGVudCgpOiBzdHJpbmd8bnVsbCB7XG4gICAgY29uc3Qgbm9kZUxldmVsID0gKHRoaXMuX3RyZWVOb2RlLmRhdGEgJiYgdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRMZXZlbClcbiAgICAgID8gdGhpcy5fdHJlZS50cmVlQ29udHJvbC5nZXRMZXZlbCh0aGlzLl90cmVlTm9kZS5kYXRhKVxuICAgICAgOiBudWxsO1xuICAgIGNvbnN0IGxldmVsID0gdGhpcy5fbGV2ZWwgPT0gbnVsbCA/IG5vZGVMZXZlbCA6IHRoaXMuX2xldmVsO1xuICAgIHJldHVybiB0eXBlb2YgbGV2ZWwgPT09ICdudW1iZXInID8gYCR7bGV2ZWwgKiB0aGlzLl9pbmRlbnR9JHt0aGlzLmluZGVudFVuaXRzfWAgOiBudWxsO1xuICB9XG5cbiAgX3NldFBhZGRpbmcoZm9yY2VDaGFuZ2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IHBhZGRpbmcgPSB0aGlzLl9wYWRkaW5nSW5kZW50KCk7XG5cbiAgICBpZiAocGFkZGluZyAhPT0gdGhpcy5fY3VycmVudFBhZGRpbmcgfHwgZm9yY2VDaGFuZ2UpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBjb25zdCBwYWRkaW5nUHJvcCA9IHRoaXMuX2RpciAmJiB0aGlzLl9kaXIudmFsdWUgPT09ICdydGwnID8gJ3BhZGRpbmdSaWdodCcgOiAncGFkZGluZ0xlZnQnO1xuICAgICAgY29uc3QgcmVzZXRQcm9wID0gcGFkZGluZ1Byb3AgPT09ICdwYWRkaW5nTGVmdCcgPyAncGFkZGluZ1JpZ2h0JyA6ICdwYWRkaW5nTGVmdCc7XG4gICAgICBlbGVtZW50LnN0eWxlW3BhZGRpbmdQcm9wXSA9IHBhZGRpbmcgfHwgJyc7XG4gICAgICBlbGVtZW50LnN0eWxlW3Jlc2V0UHJvcF0gPSAnJztcbiAgICAgIHRoaXMuX2N1cnJlbnRQYWRkaW5nID0gcGFkZGluZztcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdBY2NlcHRJbnB1dFR5cGVfbGV2ZWw6IE51bWJlcklucHV0O1xufVxuIl19