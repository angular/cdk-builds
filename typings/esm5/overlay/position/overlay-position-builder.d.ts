/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewportRuler } from '@angular/cdk/scrolling';
import { ElementRef } from '@angular/core';
import { OriginConnectionPosition, OverlayConnectionPosition } from './connected-position';
import { ConnectedPositionStrategy } from './connected-position-strategy';
import { FlexibleConnectedPositionStrategy } from './flexible-connected-position-strategy';
import { GlobalPositionStrategy } from './global-position-strategy';
/** Builder for overlay position strategy. */
export declare class OverlayPositionBuilder {
    private _viewportRuler;
    private _document;
    constructor(_viewportRuler: ViewportRuler, _document: Document);
    /**
     * Creates a global position strategy.
     */
    global(): GlobalPositionStrategy;
    /**
     * Creates a relative position strategy.
     * @param elementRef
     * @param originPos
     * @param overlayPos
     * @deprecated Use `flexibleConnectedTo` instead.
     * @deletion-target 7.0.0
     */
    connectedTo(elementRef: ElementRef, originPos: OriginConnectionPosition, overlayPos: OverlayConnectionPosition): ConnectedPositionStrategy;
    /**
     * Creates a flexible position strategy.
     * @param elementRef
     */
    flexibleConnectedTo(elementRef: ElementRef): FlexibleConnectedPositionStrategy;
}
