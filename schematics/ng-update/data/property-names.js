/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/cdk/schematics/ng-update/data/property-names", ["require", "exports", "@angular/cdk/schematics/update-tool/target-version"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const target_version_1 = require("@angular/cdk/schematics/update-tool/target-version");
    exports.propertyNames = {
        [target_version_1.TargetVersion.V9]: [{
                pr: 'https://github.com/angular/components/pull/17084',
                changes: [{
                        replace: 'boundaryElementSelector',
                        replaceWith: 'boundaryElement',
                        whitelist: { classes: ['CdkDrag'] }
                    }]
            }],
        [target_version_1.TargetVersion.V8]: [],
        [target_version_1.TargetVersion.V7]: [
            {
                pr: 'https://github.com/angular/components/pull/8286',
                changes: [{ replace: 'onChange', replaceWith: 'changed', whitelist: { classes: ['SelectionModel'] } }]
            },
            {
                pr: 'https://github.com/angular/components/pull/12927',
                changes: [{
                        replace: 'flexibleDiemsions',
                        replaceWith: 'flexibleDimensions',
                        whitelist: { classes: ['CdkConnectedOverlay'] }
                    }]
            }
        ],
        [target_version_1.TargetVersion.V6]: [
            {
                pr: 'https://github.com/angular/components/pull/10161',
                changes: [
                    {
                        replace: '_deprecatedOrigin',
                        replaceWith: 'origin',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedPositions',
                        replaceWith: 'positions',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedOffsetX',
                        replaceWith: 'offsetX',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedOffsetY',
                        replaceWith: 'offsetY',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedWidth',
                        replaceWith: 'width',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedHeight',
                        replaceWith: 'height',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedMinWidth',
                        replaceWith: 'minWidth',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedMinHeight',
                        replaceWith: 'minHeight',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedBackdropClass',
                        replaceWith: 'backdropClass',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedScrollStrategy',
                        replaceWith: 'scrollStrategy',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedOpen',
                        replaceWith: 'open',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    },
                    {
                        replace: '_deprecatedHasBackdrop',
                        replaceWith: 'hasBackdrop',
                        whitelist: { classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective'] }
                    }
                ]
            },
            {
                pr: 'https://github.com/angular/components/pull/10257',
                changes: [
                    {
                        replace: '_deprecatedPortal',
                        replaceWith: 'portal',
                        whitelist: { classes: ['CdkPortalOutlet'] }
                    },
                    {
                        replace: '_deprecatedPortalHost',
                        replaceWith: 'portal',
                        whitelist: { classes: ['CdkPortalOutlet'] }
                    }
                ]
            },
        ]
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHktbmFtZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL3NjaGVtYXRpY3MvbmctdXBkYXRlL2RhdGEvcHJvcGVydHktbmFtZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCx1RkFBK0Q7SUFlbEQsUUFBQSxhQUFhLEdBQTRDO1FBQ3BFLENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNuQixFQUFFLEVBQUUsa0RBQWtEO2dCQUN0RCxPQUFPLEVBQUUsQ0FBQzt3QkFDUixPQUFPLEVBQUUseUJBQXlCO3dCQUNsQyxXQUFXLEVBQUUsaUJBQWlCO3dCQUM5QixTQUFTLEVBQUUsRUFBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBQztxQkFDbEMsQ0FBQzthQUNILENBQUM7UUFDRixDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QixDQUFDLDhCQUFhLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDbEI7Z0JBQ0UsRUFBRSxFQUFFLGlEQUFpRDtnQkFDckQsT0FBTyxFQUNILENBQUMsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUMsT0FBTyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBQyxFQUFDLENBQUM7YUFDOUY7WUFFRDtnQkFDRSxFQUFFLEVBQUUsa0RBQWtEO2dCQUN0RCxPQUFPLEVBQUUsQ0FBQzt3QkFDUixPQUFPLEVBQUUsbUJBQW1CO3dCQUM1QixXQUFXLEVBQUUsb0JBQW9CO3dCQUNqQyxTQUFTLEVBQUUsRUFBQyxPQUFPLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFDO3FCQUM5QyxDQUFDO2FBQ0g7U0FDRjtRQUVELENBQUMsOEJBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUNsQjtnQkFDRSxFQUFF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aUJBQ0Y7YUFDRjtTQUNGO0tBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RhcmdldFZlcnNpb259IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL3RhcmdldC12ZXJzaW9uJztcbmltcG9ydCB7VmVyc2lvbkNoYW5nZXN9IGZyb20gJy4uLy4uL3VwZGF0ZS10b29sL3ZlcnNpb24tY2hhbmdlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydHlOYW1lVXBncmFkZURhdGEge1xuICAvKiogVGhlIHByb3BlcnR5IG5hbWUgdG8gcmVwbGFjZS4gKi9cbiAgcmVwbGFjZTogc3RyaW5nO1xuICAvKiogVGhlIG5ldyBuYW1lIGZvciB0aGUgcHJvcGVydHkuICovXG4gIHJlcGxhY2VXaXRoOiBzdHJpbmc7XG4gIC8qKiBXaGl0ZWxpc3Qgd2hlcmUgdGhpcyByZXBsYWNlbWVudCBpcyBtYWRlLiBJZiBvbWl0dGVkIGl0IGlzIG1hZGUgZm9yIGFsbCBDbGFzc2VzLiAqL1xuICB3aGl0ZWxpc3Q6IHtcbiAgICAvKiogUmVwbGFjZSB0aGUgcHJvcGVydHkgb25seSB3aGVuIGl0cyB0eXBlIGlzIG9uZSBvZiB0aGUgZ2l2ZW4gQ2xhc3Nlcy4gKi9cbiAgICBjbGFzc2VzOiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHByb3BlcnR5TmFtZXM6IFZlcnNpb25DaGFuZ2VzPFByb3BlcnR5TmFtZVVwZ3JhZGVEYXRhPiA9IHtcbiAgW1RhcmdldFZlcnNpb24uVjldOiBbe1xuICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzE3MDg0JyxcbiAgICBjaGFuZ2VzOiBbe1xuICAgICAgcmVwbGFjZTogJ2JvdW5kYXJ5RWxlbWVudFNlbGVjdG9yJyxcbiAgICAgIHJlcGxhY2VXaXRoOiAnYm91bmRhcnlFbGVtZW50JyxcbiAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrRHJhZyddfVxuICAgIH1dXG4gIH1dLFxuICBbVGFyZ2V0VmVyc2lvbi5WOF06IFtdLFxuICBbVGFyZ2V0VmVyc2lvbi5WN106IFtcbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC84Mjg2JyxcbiAgICAgIGNoYW5nZXM6XG4gICAgICAgICAgW3tyZXBsYWNlOiAnb25DaGFuZ2UnLCByZXBsYWNlV2l0aDogJ2NoYW5nZWQnLCB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ1NlbGVjdGlvbk1vZGVsJ119fV1cbiAgICB9LFxuXG4gICAge1xuICAgICAgcHI6ICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9jb21wb25lbnRzL3B1bGwvMTI5MjcnLFxuICAgICAgY2hhbmdlczogW3tcbiAgICAgICAgcmVwbGFjZTogJ2ZsZXhpYmxlRGllbXNpb25zJyxcbiAgICAgICAgcmVwbGFjZVdpdGg6ICdmbGV4aWJsZURpbWVuc2lvbnMnLFxuICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknXX1cbiAgICAgIH1dXG4gICAgfVxuICBdLFxuXG4gIFtUYXJnZXRWZXJzaW9uLlY2XTogW1xuICAgIHtcbiAgICAgIHByOiAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvY29tcG9uZW50cy9wdWxsLzEwMTYxJyxcbiAgICAgIGNoYW5nZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHJlcGxhY2U6ICdfZGVwcmVjYXRlZE9yaWdpbicsXG4gICAgICAgICAgcmVwbGFjZVdpdGg6ICdvcmlnaW4nLFxuICAgICAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrQ29ubmVjdGVkT3ZlcmxheScsICdDb25uZWN0ZWRPdmVybGF5RGlyZWN0aXZlJ119XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByZXBsYWNlOiAnX2RlcHJlY2F0ZWRQb3NpdGlvbnMnLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAncG9zaXRpb25zJyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknLCAnQ29ubmVjdGVkT3ZlcmxheURpcmVjdGl2ZSddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkT2Zmc2V0WCcsXG4gICAgICAgICAgcmVwbGFjZVdpdGg6ICdvZmZzZXRYJyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknLCAnQ29ubmVjdGVkT3ZlcmxheURpcmVjdGl2ZSddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkT2Zmc2V0WScsXG4gICAgICAgICAgcmVwbGFjZVdpdGg6ICdvZmZzZXRZJyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknLCAnQ29ubmVjdGVkT3ZlcmxheURpcmVjdGl2ZSddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkV2lkdGgnLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAnd2lkdGgnLFxuICAgICAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrQ29ubmVjdGVkT3ZlcmxheScsICdDb25uZWN0ZWRPdmVybGF5RGlyZWN0aXZlJ119XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByZXBsYWNlOiAnX2RlcHJlY2F0ZWRIZWlnaHQnLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAnaGVpZ2h0JyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknLCAnQ29ubmVjdGVkT3ZlcmxheURpcmVjdGl2ZSddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkTWluV2lkdGgnLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAnbWluV2lkdGgnLFxuICAgICAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrQ29ubmVjdGVkT3ZlcmxheScsICdDb25uZWN0ZWRPdmVybGF5RGlyZWN0aXZlJ119XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByZXBsYWNlOiAnX2RlcHJlY2F0ZWRNaW5IZWlnaHQnLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAnbWluSGVpZ2h0JyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknLCAnQ29ubmVjdGVkT3ZlcmxheURpcmVjdGl2ZSddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkQmFja2Ryb3BDbGFzcycsXG4gICAgICAgICAgcmVwbGFjZVdpdGg6ICdiYWNrZHJvcENsYXNzJyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka0Nvbm5lY3RlZE92ZXJsYXknLCAnQ29ubmVjdGVkT3ZlcmxheURpcmVjdGl2ZSddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkU2Nyb2xsU3RyYXRlZ3knLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAnc2Nyb2xsU3RyYXRlZ3knLFxuICAgICAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrQ29ubmVjdGVkT3ZlcmxheScsICdDb25uZWN0ZWRPdmVybGF5RGlyZWN0aXZlJ119XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByZXBsYWNlOiAnX2RlcHJlY2F0ZWRPcGVuJyxcbiAgICAgICAgICByZXBsYWNlV2l0aDogJ29wZW4nLFxuICAgICAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrQ29ubmVjdGVkT3ZlcmxheScsICdDb25uZWN0ZWRPdmVybGF5RGlyZWN0aXZlJ119XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByZXBsYWNlOiAnX2RlcHJlY2F0ZWRIYXNCYWNrZHJvcCcsXG4gICAgICAgICAgcmVwbGFjZVdpdGg6ICdoYXNCYWNrZHJvcCcsXG4gICAgICAgICAgd2hpdGVsaXN0OiB7Y2xhc3NlczogWydDZGtDb25uZWN0ZWRPdmVybGF5JywgJ0Nvbm5lY3RlZE92ZXJsYXlEaXJlY3RpdmUnXX1cbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0sXG5cbiAgICB7XG4gICAgICBwcjogJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2NvbXBvbmVudHMvcHVsbC8xMDI1NycsXG4gICAgICBjaGFuZ2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByZXBsYWNlOiAnX2RlcHJlY2F0ZWRQb3J0YWwnLFxuICAgICAgICAgIHJlcGxhY2VXaXRoOiAncG9ydGFsJyxcbiAgICAgICAgICB3aGl0ZWxpc3Q6IHtjbGFzc2VzOiBbJ0Nka1BvcnRhbE91dGxldCddfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbGFjZTogJ19kZXByZWNhdGVkUG9ydGFsSG9zdCcsXG4gICAgICAgICAgcmVwbGFjZVdpdGg6ICdwb3J0YWwnLFxuICAgICAgICAgIHdoaXRlbGlzdDoge2NsYXNzZXM6IFsnQ2RrUG9ydGFsT3V0bGV0J119XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9LFxuICBdXG59O1xuIl19