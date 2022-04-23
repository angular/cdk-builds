import { CdkMenuItemSelectable } from './menu-item-selectable';
import * as i0 from "@angular/core";
/**
 * A directive providing behavior for the "menuitemcheckbox" ARIA role, which behaves similarly to a
 * conventional checkbox.
 */
export declare class CdkMenuItemCheckbox extends CdkMenuItemSelectable {
    /**
     * Toggle the checked state of the checkbox.
     * @param options Options the configure how the item is triggered
     *   - keepOpen: specifies that the menu should be kept open after triggering the item.
     */
    trigger(options?: {
        keepOpen: boolean;
    }): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItemCheckbox, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItemCheckbox, "[cdkMenuItemCheckbox]", ["cdkMenuItemCheckbox"], {}, {}, never, never, false>;
}
