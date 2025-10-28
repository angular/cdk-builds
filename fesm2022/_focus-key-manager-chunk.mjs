import { ListKeyManager } from './_list-key-manager-chunk.mjs';

class FocusKeyManager extends ListKeyManager {
  _origin = 'program';
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

export { FocusKeyManager };
//# sourceMappingURL=_focus-key-manager-chunk.mjs.map
