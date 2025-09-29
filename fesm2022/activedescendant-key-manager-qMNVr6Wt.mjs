import { ListKeyManager } from './list-key-manager-BdotFmaL.mjs';

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

export { ActiveDescendantKeyManager };
//# sourceMappingURL=activedescendant-key-manager-qMNVr6Wt.mjs.map
