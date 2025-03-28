import { L as ListKeyManager } from './list-key-manager-f9c3e90c.mjs';

class FocusKeyManager extends ListKeyManager {
    _origin = 'program';
    /**
     * Sets the focus origin that will be passed in to the items for any subsequent `focus` calls.
     * @param origin Focus origin to be used when focusing items.
     */
    setFocusOrigin(origin) {
        this._origin = origin;
        return this;
    }
    setActiveItem(item) {
        super.setActiveItem(item);
        if (this.activeItem) {
            this.activeItem.focus(this._origin);
        }
    }
}

export { FocusKeyManager as F };
//# sourceMappingURL=focus-key-manager-ff488563.mjs.map
