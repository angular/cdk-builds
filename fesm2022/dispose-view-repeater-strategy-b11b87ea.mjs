import { a as _ViewRepeaterOperation } from './recycle-view-repeater-strategy-c1712813.mjs';

/**
 * A repeater that destroys views when they are removed from a
 * {@link ViewContainerRef}. When new items are inserted into the container,
 * the repeater will always construct a new embedded view for each item.
 *
 * @template T The type for the embedded view's $implicit property.
 * @template R The type for the item in each IterableDiffer change record.
 * @template C The type for the context passed to each embedded view.
 */
class _DisposeViewRepeaterStrategy {
    applyChanges(changes, viewContainerRef, itemContextFactory, itemValueResolver, itemViewChanged) {
        changes.forEachOperation((record, adjustedPreviousIndex, currentIndex) => {
            let view;
            let operation;
            if (record.previousIndex == null) {
                const insertContext = itemContextFactory(record, adjustedPreviousIndex, currentIndex);
                view = viewContainerRef.createEmbeddedView(insertContext.templateRef, insertContext.context, insertContext.index);
                operation = _ViewRepeaterOperation.INSERTED;
            }
            else if (currentIndex == null) {
                viewContainerRef.remove(adjustedPreviousIndex);
                operation = _ViewRepeaterOperation.REMOVED;
            }
            else {
                view = viewContainerRef.get(adjustedPreviousIndex);
                viewContainerRef.move(view, currentIndex);
                operation = _ViewRepeaterOperation.MOVED;
            }
            if (itemViewChanged) {
                itemViewChanged({
                    context: view?.context,
                    operation,
                    record,
                });
            }
        });
    }
    detach() { }
}

export { _DisposeViewRepeaterStrategy as _ };
//# sourceMappingURL=dispose-view-repeater-strategy-b11b87ea.mjs.map
