import { L as ListKeyManager } from './list-key-manager-C7tp3RbG.mjs';

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
//# sourceMappingURL=activedescendant-key-manager-CZAE5aFC.mjs.map
