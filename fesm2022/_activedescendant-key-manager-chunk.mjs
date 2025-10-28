import { ListKeyManager } from './_list-key-manager-chunk.mjs';

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
//# sourceMappingURL=_activedescendant-key-manager-chunk.mjs.map
