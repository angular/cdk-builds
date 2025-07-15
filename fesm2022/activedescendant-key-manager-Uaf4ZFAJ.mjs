import { L as ListKeyManager } from './list-key-manager-BPo6sXWX.mjs';

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
//# sourceMappingURL=activedescendant-key-manager-Uaf4ZFAJ.mjs.map
