import { L as ListKeyManager } from './list-key-manager-f9c3e90c.mjs';

class ActiveDescendantKeyManager extends ListKeyManager {
    setActiveItem(index) {
        if (this.activeItem) {
            this.activeItem.setInactiveStyles();
        }
        super.setActiveItem(index);
        if (this.activeItem) {
            this.activeItem.setActiveStyles();
        }
    }
}

export { ActiveDescendantKeyManager as A };
//# sourceMappingURL=activedescendant-key-manager-f0c079ca.mjs.map
