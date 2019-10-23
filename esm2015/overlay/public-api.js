/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export { OverlayConfig } from './overlay-config';
export { validateVerticalPosition, validateHorizontalPosition, ConnectionPositionPair, ScrollingVisibility, ConnectedOverlayPositionChange } from './position/connected-position';
export { CdkScrollable, ScrollDispatcher, ScrollStrategyOptions, RepositionScrollStrategy, CloseScrollStrategy, NoopScrollStrategy, BlockScrollStrategy } from './scroll/index';
export { OverlayModule, OVERLAY_PROVIDERS } from './overlay-module';
export { Overlay } from './overlay';
export { OverlayContainer } from './overlay-container';
export { CdkOverlayOrigin, CdkConnectedOverlay } from './overlay-directives';
export { FullscreenOverlayContainer } from './fullscreen-overlay-container';
export { OverlayRef } from './overlay-ref';
export { ViewportRuler } from '@angular/cdk/scrolling';
export { OverlayKeyboardDispatcher } from './keyboard/overlay-keyboard-dispatcher';
export { OverlayPositionBuilder } from './position/overlay-position-builder';
export { GlobalPositionStrategy } from './position/global-position-strategy';
export { ConnectedPositionStrategy } from './position/connected-position-strategy';
export { FlexibleConnectedPositionStrategy, } from './position/flexible-connected-position-strategy';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGljLWFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvb3ZlcmxheS9wdWJsaWMtYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsOEJBQWMsa0JBQWtCLENBQUM7QUFDakMsa0pBQWMsK0JBQStCLENBQUM7QUFDOUMsK0pBQWMsZ0JBQWdCLENBQUM7QUFDL0IsaURBQWMsa0JBQWtCLENBQUM7QUFDakMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMxRSxPQUFPLEVBQUMsVUFBVSxFQUFvQixNQUFNLGVBQWUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFckQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sd0NBQXdDLENBQUM7QUFDakYsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFJM0UsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDM0UsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sd0NBQXdDLENBQUM7QUFDakYsT0FBTyxFQUVMLGlDQUFpQyxHQUVsQyxNQUFNLGlEQUFpRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vb3ZlcmxheS1jb25maWcnO1xuZXhwb3J0ICogZnJvbSAnLi9wb3NpdGlvbi9jb25uZWN0ZWQtcG9zaXRpb24nO1xuZXhwb3J0ICogZnJvbSAnLi9zY3JvbGwvaW5kZXgnO1xuZXhwb3J0ICogZnJvbSAnLi9vdmVybGF5LW1vZHVsZSc7XG5leHBvcnQge092ZXJsYXl9IGZyb20gJy4vb3ZlcmxheSc7XG5leHBvcnQge092ZXJsYXlDb250YWluZXJ9IGZyb20gJy4vb3ZlcmxheS1jb250YWluZXInO1xuZXhwb3J0IHtDZGtPdmVybGF5T3JpZ2luLCBDZGtDb25uZWN0ZWRPdmVybGF5fSBmcm9tICcuL292ZXJsYXktZGlyZWN0aXZlcyc7XG5leHBvcnQge0Z1bGxzY3JlZW5PdmVybGF5Q29udGFpbmVyfSBmcm9tICcuL2Z1bGxzY3JlZW4tb3ZlcmxheS1jb250YWluZXInO1xuZXhwb3J0IHtPdmVybGF5UmVmLCBPdmVybGF5U2l6ZUNvbmZpZ30gZnJvbSAnLi9vdmVybGF5LXJlZic7XG5leHBvcnQge1ZpZXdwb3J0UnVsZXJ9IGZyb20gJ0Bhbmd1bGFyL2Nkay9zY3JvbGxpbmcnO1xuZXhwb3J0IHtDb21wb25lbnRUeXBlfSBmcm9tICdAYW5ndWxhci9jZGsvcG9ydGFsJztcbmV4cG9ydCB7T3ZlcmxheUtleWJvYXJkRGlzcGF0Y2hlcn0gZnJvbSAnLi9rZXlib2FyZC9vdmVybGF5LWtleWJvYXJkLWRpc3BhdGNoZXInO1xuZXhwb3J0IHtPdmVybGF5UG9zaXRpb25CdWlsZGVyfSBmcm9tICcuL3Bvc2l0aW9uL292ZXJsYXktcG9zaXRpb24tYnVpbGRlcic7XG5cbi8vIEV4cG9ydCBwcmUtZGVmaW5lZCBwb3NpdGlvbiBzdHJhdGVnaWVzIGFuZCBpbnRlcmZhY2UgdG8gYnVpbGQgY3VzdG9tIG9uZXMuXG5leHBvcnQge1Bvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vcG9zaXRpb24vcG9zaXRpb24tc3RyYXRlZ3knO1xuZXhwb3J0IHtHbG9iYWxQb3NpdGlvblN0cmF0ZWd5fSBmcm9tICcuL3Bvc2l0aW9uL2dsb2JhbC1wb3NpdGlvbi1zdHJhdGVneSc7XG5leHBvcnQge0Nvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3l9IGZyb20gJy4vcG9zaXRpb24vY29ubmVjdGVkLXBvc2l0aW9uLXN0cmF0ZWd5JztcbmV4cG9ydCB7XG4gIENvbm5lY3RlZFBvc2l0aW9uLFxuICBGbGV4aWJsZUNvbm5lY3RlZFBvc2l0aW9uU3RyYXRlZ3ksXG4gIEZsZXhpYmxlQ29ubmVjdGVkUG9zaXRpb25TdHJhdGVneU9yaWdpbixcbn0gZnJvbSAnLi9wb3NpdGlvbi9mbGV4aWJsZS1jb25uZWN0ZWQtcG9zaXRpb24tc3RyYXRlZ3knO1xuIl19