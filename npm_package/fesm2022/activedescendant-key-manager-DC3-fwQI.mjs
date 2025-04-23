import { L as ListKeyManager } from './list-key-manager-CyOIXo8P.mjs';

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
//# sourceMappingURL=activedescendant-key-manager-DC3-fwQI.mjs.map
