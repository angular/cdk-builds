import { OverlayReference } from '../overlay-reference';
import { BaseOverlayDispatcher } from './base-overlay-dispatcher';
import * as i0 from "@angular/core";
/**
 * Service for dispatching keyboard events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 */
export declare class OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
    constructor(document: any);
    /** Add a new overlay to the list of attached overlay refs. */
    add(overlayRef: OverlayReference): void;
    /** Detaches the global keyboard event listener. */
    protected detach(): void;
    /** Keyboard event listener that will be attached to the body. */
    private _keydownListener;
    static ɵfac: i0.ɵɵFactoryDeclaration<OverlayKeyboardDispatcher, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OverlayKeyboardDispatcher>;
}
