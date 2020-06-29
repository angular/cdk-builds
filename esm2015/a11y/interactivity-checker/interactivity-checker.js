/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/**
 * Configuration for the isFocusable method.
 */
export class IsFocusableConfig {
    constructor() {
        /**
         * Whether to count an element as focusable even if it is not currently visible.
         */
        this.ignoreVisibility = false;
    }
}
// The InteractivityChecker leans heavily on the ally.js accessibility utilities.
// Methods like `isTabbable` are only covering specific edge-cases for the browsers which are
// supported.
/**
 * Utility for checking the interactivity of an element, such as whether is is focusable or
 * tabbable.
 */
let InteractivityChecker = /** @class */ (() => {
    class InteractivityChecker {
        constructor(_platform) {
            this._platform = _platform;
        }
        /**
         * Gets whether an element is disabled.
         *
         * @param element Element to be checked.
         * @returns Whether the element is disabled.
         */
        isDisabled(element) {
            // This does not capture some cases, such as a non-form control with a disabled attribute or
            // a form control inside of a disabled form, but should capture the most common cases.
            return element.hasAttribute('disabled');
        }
        /**
         * Gets whether an element is visible for the purposes of interactivity.
         *
         * This will capture states like `display: none` and `visibility: hidden`, but not things like
         * being clipped by an `overflow: hidden` parent or being outside the viewport.
         *
         * @returns Whether the element is visible.
         */
        isVisible(element) {
            return hasGeometry(element) && getComputedStyle(element).visibility === 'visible';
        }
        /**
         * Gets whether an element can be reached via Tab key.
         * Assumes that the element has already been checked with isFocusable.
         *
         * @param element Element to be checked.
         * @returns Whether the element is tabbable.
         */
        isTabbable(element) {
            // Nothing is tabbable on the server 😎
            if (!this._platform.isBrowser) {
                return false;
            }
            const frameElement = getFrameElement(getWindow(element));
            if (frameElement) {
                const frameType = frameElement && frameElement.nodeName.toLowerCase();
                // Frame elements inherit their tabindex onto all child elements.
                if (getTabIndexValue(frameElement) === -1) {
                    return false;
                }
                // Webkit and Blink consider anything inside of an <object> element as non-tabbable.
                if ((this._platform.BLINK || this._platform.WEBKIT) && frameType === 'object') {
                    return false;
                }
                // Webkit and Blink disable tabbing to an element inside of an invisible frame.
                if ((this._platform.BLINK || this._platform.WEBKIT) && !this.isVisible(frameElement)) {
                    return false;
                }
            }
            let nodeName = element.nodeName.toLowerCase();
            let tabIndexValue = getTabIndexValue(element);
            if (element.hasAttribute('contenteditable')) {
                return tabIndexValue !== -1;
            }
            if (nodeName === 'iframe') {
                // The frames may be tabbable depending on content, but it's not possibly to reliably
                // investigate the content of the frames.
                return false;
            }
            if (nodeName === 'audio') {
                if (!element.hasAttribute('controls')) {
                    // By default an <audio> element without the controls enabled is not tabbable.
                    return false;
                }
                else if (this._platform.BLINK) {
                    // In Blink <audio controls> elements are always tabbable.
                    return true;
                }
            }
            if (nodeName === 'video') {
                if (!element.hasAttribute('controls') && this._platform.TRIDENT) {
                    // In Trident a <video> element without the controls enabled is not tabbable.
                    return false;
                }
                else if (this._platform.BLINK || this._platform.FIREFOX) {
                    // In Chrome and Firefox <video controls> elements are always tabbable.
                    return true;
                }
            }
            if (nodeName === 'object' && (this._platform.BLINK || this._platform.WEBKIT)) {
                // In all Blink and WebKit based browsers <object> elements are never tabbable.
                return false;
            }
            // In iOS the browser only considers some specific elements as tabbable.
            if (this._platform.WEBKIT && this._platform.IOS && !isPotentiallyTabbableIOS(element)) {
                return false;
            }
            return element.tabIndex >= 0;
        }
        /**
         * Gets whether an element can be focused by the user.
         *
         * @param element Element to be checked.
         * @param config The config object with options to customize this method's behavior
         * @returns Whether the element is focusable.
         */
        isFocusable(element, config) {
            // Perform checks in order of left to most expensive.
            // Again, naive approach that does not capture many edge cases and browser quirks.
            return isPotentiallyFocusable(element) && !this.isDisabled(element) &&
                ((config === null || config === void 0 ? void 0 : config.ignoreVisibility) || this.isVisible(element));
        }
    }
    InteractivityChecker.ɵprov = i0.ɵɵdefineInjectable({ factory: function InteractivityChecker_Factory() { return new InteractivityChecker(i0.ɵɵinject(i1.Platform)); }, token: InteractivityChecker, providedIn: "root" });
    InteractivityChecker.decorators = [
        { type: Injectable, args: [{ providedIn: 'root' },] }
    ];
    InteractivityChecker.ctorParameters = () => [
        { type: Platform }
    ];
    return InteractivityChecker;
})();
export { InteractivityChecker };
/**
 * Returns the frame element from a window object. Since browsers like MS Edge throw errors if
 * the frameElement property is being accessed from a different host address, this property
 * should be accessed carefully.
 */
function getFrameElement(window) {
    try {
        return window.frameElement;
    }
    catch (_a) {
        return null;
    }
}
/** Checks whether the specified element has any geometry / rectangles. */
function hasGeometry(element) {
    // Use logic from jQuery to check for an invisible element.
    // See https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js#L12
    return !!(element.offsetWidth || element.offsetHeight ||
        (typeof element.getClientRects === 'function' && element.getClientRects().length));
}
/** Gets whether an element's  */
function isNativeFormElement(element) {
    let nodeName = element.nodeName.toLowerCase();
    return nodeName === 'input' ||
        nodeName === 'select' ||
        nodeName === 'button' ||
        nodeName === 'textarea';
}
/** Gets whether an element is an `<input type="hidden">`. */
function isHiddenInput(element) {
    return isInputElement(element) && element.type == 'hidden';
}
/** Gets whether an element is an anchor that has an href attribute. */
function isAnchorWithHref(element) {
    return isAnchorElement(element) && element.hasAttribute('href');
}
/** Gets whether an element is an input element. */
function isInputElement(element) {
    return element.nodeName.toLowerCase() == 'input';
}
/** Gets whether an element is an anchor element. */
function isAnchorElement(element) {
    return element.nodeName.toLowerCase() == 'a';
}
/** Gets whether an element has a valid tabindex. */
function hasValidTabIndex(element) {
    if (!element.hasAttribute('tabindex') || element.tabIndex === undefined) {
        return false;
    }
    let tabIndex = element.getAttribute('tabindex');
    // IE11 parses tabindex="" as the value "-32768"
    if (tabIndex == '-32768') {
        return false;
    }
    return !!(tabIndex && !isNaN(parseInt(tabIndex, 10)));
}
/**
 * Returns the parsed tabindex from the element attributes instead of returning the
 * evaluated tabindex from the browsers defaults.
 */
function getTabIndexValue(element) {
    if (!hasValidTabIndex(element)) {
        return null;
    }
    // See browser issue in Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
    const tabIndex = parseInt(element.getAttribute('tabindex') || '', 10);
    return isNaN(tabIndex) ? -1 : tabIndex;
}
/** Checks whether the specified element is potentially tabbable on iOS */
function isPotentiallyTabbableIOS(element) {
    let nodeName = element.nodeName.toLowerCase();
    let inputType = nodeName === 'input' && element.type;
    return inputType === 'text'
        || inputType === 'password'
        || nodeName === 'select'
        || nodeName === 'textarea';
}
/**
 * Gets whether an element is potentially focusable without taking current visible/disabled state
 * into account.
 */
function isPotentiallyFocusable(element) {
    // Inputs are potentially focusable *unless* they're type="hidden".
    if (isHiddenInput(element)) {
        return false;
    }
    return isNativeFormElement(element) ||
        isAnchorWithHref(element) ||
        element.hasAttribute('contenteditable') ||
        hasValidTabIndex(element);
}
/** Gets the parent window of a DOM node with regards of being inside of an iframe. */
function getWindow(node) {
    // ownerDocument is null if `node` itself *is* a document.
    return node.ownerDocument && node.ownerDocument.defaultView || window;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpdml0eS1jaGVja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2ludGVyYWN0aXZpdHktY2hlY2tlci9pbnRlcmFjdGl2aXR5LWNoZWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7OztBQUV6Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxpQkFBaUI7SUFBOUI7UUFDRTs7V0FFRztRQUNILHFCQUFnQixHQUFZLEtBQUssQ0FBQztJQUNwQyxDQUFDO0NBQUE7QUFFRCxpRkFBaUY7QUFDakYsNkZBQTZGO0FBQzdGLGFBQWE7QUFFYjs7O0dBR0c7QUFDSDtJQUFBLE1BQ2Esb0JBQW9CO1FBRS9CLFlBQW9CLFNBQW1CO1lBQW5CLGNBQVMsR0FBVCxTQUFTLENBQVU7UUFBRyxDQUFDO1FBRTNDOzs7OztXQUtHO1FBQ0gsVUFBVSxDQUFDLE9BQW9CO1lBQzdCLDRGQUE0RjtZQUM1RixzRkFBc0Y7WUFDdEYsT0FBTyxPQUFPLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsU0FBUyxDQUFDLE9BQW9CO1lBQzVCLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUM7UUFDcEYsQ0FBQztRQUVEOzs7Ozs7V0FNRztRQUNILFVBQVUsQ0FBQyxPQUFvQjtZQUM3Qix1Q0FBdUM7WUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO2dCQUM3QixPQUFPLEtBQUssQ0FBQzthQUNkO1lBRUQsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFD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QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ3pDLENBQUM7QUFFRCwwRUFBMEU7QUFDMUUsU0FBUyx3QkFBd0IsQ0FBQyxPQUFvQjtJQUNwRCxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzlDLElBQUksU0FBUyxHQUFHLFFBQVEsS0FBSyxPQUFPLElBQUssT0FBNEIsQ0FBQyxJQUFJLENBQUM7SUFFM0UsT0FBTyxTQUFTLEtBQUssTUFBTTtXQUNwQixTQUFTLEtBQUssVUFBVTtXQUN4QixRQUFRLEtBQUssUUFBUTtXQUNyQixRQUFRLEtBQUssVUFBVSxDQUFDO0FBQ2pDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLE9BQW9CO0lBQ2xELG1FQUFtRTtJQUNuRSxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUMxQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxtQkFBbUIsQ0FBQyxPQUFPLENBQUM7UUFDL0IsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO1FBQ3pCLE9BQU8sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUM7UUFDdkMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUVELHNGQUFzRjtBQUN0RixTQUFTLFNBQVMsQ0FBQyxJQUFpQjtJQUNsQywwREFBMEQ7SUFDMUQsT0FBTyxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQztBQUN4RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGxhdGZvcm19IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBpc0ZvY3VzYWJsZSBtZXRob2QuXG4gKi9cbmV4cG9ydCBjbGFzcyBJc0ZvY3VzYWJsZUNvbmZpZyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGNvdW50IGFuIGVsZW1lbnQgYXMgZm9jdXNhYmxlIGV2ZW4gaWYgaXQgaXMgbm90IGN1cnJlbnRseSB2aXNpYmxlLlxuICAgKi9cbiAgaWdub3JlVmlzaWJpbGl0eTogYm9vbGVhbiA9IGZhbHNlO1xufVxuXG4vLyBUaGUgSW50ZXJhY3Rpdml0eUNoZWNrZXIgbGVhbnMgaGVhdmlseSBvbiB0aGUgYWxseS5qcyBhY2Nlc3NpYmlsaXR5IHV0aWxpdGllcy5cbi8vIE1ldGhvZHMgbGlrZSBgaXNUYWJiYWJsZWAgYXJlIG9ubHkgY292ZXJpbmcgc3BlY2lmaWMgZWRnZS1jYXNlcyBmb3IgdGhlIGJyb3dzZXJzIHdoaWNoIGFyZVxuLy8gc3VwcG9ydGVkLlxuXG4vKipcbiAqIFV0aWxpdHkgZm9yIGNoZWNraW5nIHRoZSBpbnRlcmFjdGl2aXR5IG9mIGFuIGVsZW1lbnQsIHN1Y2ggYXMgd2hldGhlciBpcyBpcyBmb2N1c2FibGUgb3JcbiAqIHRhYmJhYmxlLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGl2aXR5Q2hlY2tlciB7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfcGxhdGZvcm06IFBsYXRmb3JtKSB7fVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgYW4gZWxlbWVudCBpcyBkaXNhYmxlZC5cbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBiZSBjaGVja2VkLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIGRpc2FibGVkLlxuICAgKi9cbiAgaXNEaXNhYmxlZChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIC8vIFRoaXMgZG9lcyBub3QgY2FwdHVyZSBzb21lIGNhc2VzLCBzdWNoIGFzIGEgbm9uLWZvcm0gY29udHJvbCB3aXRoIGEgZGlzYWJsZWQgYXR0cmlidXRlIG9yXG4gICAgLy8gYSBmb3JtIGNvbnRyb2wgaW5zaWRlIG9mIGEgZGlzYWJsZWQgZm9ybSwgYnV0IHNob3VsZCBjYXB0dXJlIHRoZSBtb3N0IGNvbW1vbiBjYXNlcy5cbiAgICByZXR1cm4gZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgdmlzaWJsZSBmb3IgdGhlIHB1cnBvc2VzIG9mIGludGVyYWN0aXZpdHkuXG4gICAqXG4gICAqIFRoaXMgd2lsbCBjYXB0dXJlIHN0YXRlcyBsaWtlIGBkaXNwbGF5OiBub25lYCBhbmQgYHZpc2liaWxpdHk6IGhpZGRlbmAsIGJ1dCBub3QgdGhpbmdzIGxpa2VcbiAgICogYmVpbmcgY2xpcHBlZCBieSBhbiBgb3ZlcmZsb3c6IGhpZGRlbmAgcGFyZW50IG9yIGJlaW5nIG91dHNpZGUgdGhlIHZpZXdwb3J0LlxuICAgKlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIHZpc2libGUuXG4gICAqL1xuICBpc1Zpc2libGUoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gaGFzR2VvbWV0cnkoZWxlbWVudCkgJiYgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS52aXNpYmlsaXR5ID09PSAndmlzaWJsZSc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgY2FuIGJlIHJlYWNoZWQgdmlhIFRhYiBrZXkuXG4gICAqIEFzc3VtZXMgdGhhdCB0aGUgZWxlbWVudCBoYXMgYWxyZWFkeSBiZWVuIGNoZWNrZWQgd2l0aCBpc0ZvY3VzYWJsZS5cbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBiZSBjaGVja2VkLlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIHRhYmJhYmxlLlxuICAgKi9cbiAgaXNUYWJiYWJsZShlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIC8vIE5vdGhpbmcgaXMgdGFiYmFibGUgb24gdGhlIHNlcnZlciDwn5iOXG4gICAgaWYgKCF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBmcmFtZUVsZW1lbnQgPSBnZXRGcmFtZUVsZW1lbnQoZ2V0V2luZG93KGVsZW1lbnQpKTtcblxuICAgIGlmIChmcmFtZUVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGZyYW1lVHlwZSA9IGZyYW1lRWxlbWVudCAmJiBmcmFtZUVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgLy8gRnJhbWUgZWxlbWVudHMgaW5oZXJpdCB0aGVpciB0YWJpbmRleCBvbnRvIGFsbCBjaGlsZCBlbGVtZW50cy5cbiAgICAgIGlmIChnZXRUYWJJbmRleFZhbHVlKGZyYW1lRWxlbWVudCkgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gV2Via2l0IGFuZCBCbGluayBjb25zaWRlciBhbnl0aGluZyBpbnNpZGUgb2YgYW4gPG9iamVjdD4gZWxlbWVudCBhcyBub24tdGFiYmFibGUuXG4gICAgICBpZiAoKHRoaXMuX3BsYXRmb3JtLkJMSU5LIHx8IHRoaXMuX3BsYXRmb3JtLldFQktJVCkgJiYgZnJhbWVUeXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlYmtpdCBhbmQgQmxpbmsgZGlzYWJsZSB0YWJiaW5nIHRvIGFuIGVsZW1lbnQgaW5zaWRlIG9mIGFuIGludmlzaWJsZSBmcmFtZS5cbiAgICAgIGlmICgodGhpcy5fcGxhdGZvcm0uQkxJTksgfHwgdGhpcy5fcGxhdGZvcm0uV0VCS0lUKSAmJiAhdGhpcy5pc1Zpc2libGUoZnJhbWVFbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBsZXQgbm9kZU5hbWUgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgbGV0IHRhYkluZGV4VmFsdWUgPSBnZXRUYWJJbmRleFZhbHVlKGVsZW1lbnQpO1xuXG4gICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnKSkge1xuICAgICAgcmV0dXJuIHRhYkluZGV4VmFsdWUgIT09IC0xO1xuICAgIH1cblxuICAgIGlmIChub2RlTmFtZSA9PT0gJ2lmcmFtZScpIHtcbiAgICAgIC8vIFRoZSBmcmFtZXMgbWF5IGJlIHRhYmJhYmxlIGRlcGVuZGluZyBvbiBjb250ZW50LCBidXQgaXQncyBub3QgcG9zc2libHkgdG8gcmVsaWFibHlcbiAgICAgIC8vIGludmVzdGlnYXRlIHRoZSBjb250ZW50IG9mIHRoZSBmcmFtZXMuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKG5vZGVOYW1lID09PSAnYXVkaW8nKSB7XG4gICAgICBpZiAoIWVsZW1lbnQuaGFzQXR0cmlidXRlKCdjb250cm9scycpKSB7XG4gICAgICAgIC8vIEJ5IGRlZmF1bHQgYW4gPGF1ZGlvPiBlbGVtZW50IHdpdGhvdXQgdGhlIGNvbnRyb2xzIGVuYWJsZWQgaXMgbm90IHRhYmJhYmxlLlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3BsYXRmb3JtLkJMSU5LKSB7XG4gICAgICAgIC8vIEluIEJsaW5rIDxhdWRpbyBjb250cm9scz4gZWxlbWVudHMgYXJlIGFsd2F5cyB0YWJiYWJsZS5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5vZGVOYW1lID09PSAndmlkZW8nKSB7XG4gICAgICBpZiAoIWVsZW1lbnQuaGFzQXR0cmlidXRlKCdjb250cm9scycpICYmIHRoaXMuX3BsYXRmb3JtLlRSSURFTlQpIHtcbiAgICAgICAgLy8gSW4gVHJpZGVudCBhIDx2aWRlbz4gZWxlbWVudCB3aXRob3V0IHRoZSBjb250cm9scyBlbmFibGVkIGlzIG5vdCB0YWJiYWJsZS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9wbGF0Zm9ybS5CTElOSyB8fCB0aGlzLl9wbGF0Zm9ybS5GSVJFRk9YKSB7XG4gICAgICAgIC8vIEluIENocm9tZSBhbmQgRmlyZWZveCA8dmlkZW8gY29udHJvbHM+IGVsZW1lbnRzIGFyZSBhbHdheXMgdGFiYmFibGUuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub2RlTmFtZSA9PT0gJ29iamVjdCcgJiYgKHRoaXMuX3BsYXRmb3JtLkJMSU5LIHx8IHRoaXMuX3BsYXRmb3JtLldFQktJVCkpIHtcbiAgICAgIC8vIEluIGFsbCBCbGluayBhbmQgV2ViS2l0IGJhc2VkIGJyb3dzZXJzIDxvYmplY3Q+IGVsZW1lbnRzIGFyZSBuZXZlciB0YWJiYWJsZS5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJbiBpT1MgdGhlIGJyb3dzZXIgb25seSBjb25zaWRlcnMgc29tZSBzcGVjaWZpYyBlbGVtZW50cyBhcyB0YWJiYWJsZS5cbiAgICBpZiAodGhpcy5fcGxhdGZvcm0uV0VCS0lUICYmIHRoaXMuX3BsYXRmb3JtLklPUyAmJiAhaXNQb3RlbnRpYWxseVRhYmJhYmxlSU9TKGVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnQudGFiSW5kZXggPj0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgYW4gZWxlbWVudCBjYW4gYmUgZm9jdXNlZCBieSB0aGUgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBiZSBjaGVja2VkLlxuICAgKiBAcGFyYW0gY29uZmlnIFRoZSBjb25maWcgb2JqZWN0IHdpdGggb3B0aW9ucyB0byBjdXN0b21pemUgdGhpcyBtZXRob2QncyBiZWhhdmlvclxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIGZvY3VzYWJsZS5cbiAgICovXG4gIGlzRm9jdXNhYmxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb25maWc/OiBJc0ZvY3VzYWJsZUNvbmZpZyk6IGJvb2xlYW4ge1xuICAgIC8vIFBlcmZvcm0gY2hlY2tzIGluIG9yZGVyIG9mIGxlZnQgdG8gbW9zdCBleHBlbnNpdmUuXG4gICAgLy8gQWdhaW4sIG5haXZlIGFwcHJvYWNoIHRoYXQgZG9lcyBub3QgY2FwdHVyZSBtYW55IGVkZ2UgY2FzZXMgYW5kIGJyb3dzZXIgcXVpcmtzLlxuICAgIHJldHVybiBpc1BvdGVudGlhbGx5Rm9jdXNhYmxlKGVsZW1lbnQpICYmICF0aGlzLmlzRGlzYWJsZWQoZWxlbWVudCkgJiZcbiAgICAgIChjb25maWc/Lmlnbm9yZVZpc2liaWxpdHkgfHwgdGhpcy5pc1Zpc2libGUoZWxlbWVudCkpO1xuICB9XG5cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmcmFtZSBlbGVtZW50IGZyb20gYSB3aW5kb3cgb2JqZWN0LiBTaW5jZSBicm93c2VycyBsaWtlIE1TIEVkZ2UgdGhyb3cgZXJyb3JzIGlmXG4gKiB0aGUgZnJhbWVFbGVtZW50IHByb3BlcnR5IGlzIGJlaW5nIGFjY2Vzc2VkIGZyb20gYSBkaWZmZXJlbnQgaG9zdCBhZGRyZXNzLCB0aGlzIHByb3BlcnR5XG4gKiBzaG91bGQgYmUgYWNjZXNzZWQgY2FyZWZ1bGx5LlxuICovXG5mdW5jdGlvbiBnZXRGcmFtZUVsZW1lbnQod2luZG93OiBXaW5kb3cpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmZyYW1lRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgZWxlbWVudCBoYXMgYW55IGdlb21ldHJ5IC8gcmVjdGFuZ2xlcy4gKi9cbmZ1bmN0aW9uIGhhc0dlb21ldHJ5KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIC8vIFVzZSBsb2dpYyBmcm9tIGpRdWVyeSB0byBjaGVjayBmb3IgYW4gaW52aXNpYmxlIGVsZW1lbnQuXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L2pxdWVyeS9ibG9iL21hc3Rlci9zcmMvY3NzL2hpZGRlblZpc2libGVTZWxlY3RvcnMuanMjTDEyXG4gIHJldHVybiAhIShlbGVtZW50Lm9mZnNldFdpZHRoIHx8IGVsZW1lbnQub2Zmc2V0SGVpZ2h0IHx8XG4gICAgICAodHlwZW9mIGVsZW1lbnQuZ2V0Q2xpZW50UmVjdHMgPT09ICdmdW5jdGlvbicgJiYgZWxlbWVudC5nZXRDbGllbnRSZWN0cygpLmxlbmd0aCkpO1xufVxuXG4vKiogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQncyAgKi9cbmZ1bmN0aW9uIGlzTmF0aXZlRm9ybUVsZW1lbnQoZWxlbWVudDogTm9kZSkge1xuICBsZXQgbm9kZU5hbWUgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBub2RlTmFtZSA9PT0gJ2lucHV0JyB8fFxuICAgICAgbm9kZU5hbWUgPT09ICdzZWxlY3QnIHx8XG4gICAgICBub2RlTmFtZSA9PT0gJ2J1dHRvbicgfHxcbiAgICAgIG5vZGVOYW1lID09PSAndGV4dGFyZWEnO1xufVxuXG4vKiogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgYW4gYDxpbnB1dCB0eXBlPVwiaGlkZGVuXCI+YC4gKi9cbmZ1bmN0aW9uIGlzSGlkZGVuSW5wdXQoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSW5wdXRFbGVtZW50KGVsZW1lbnQpICYmIGVsZW1lbnQudHlwZSA9PSAnaGlkZGVuJztcbn1cblxuLyoqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGlzIGFuIGFuY2hvciB0aGF0IGhhcyBhbiBocmVmIGF0dHJpYnV0ZS4gKi9cbmZ1bmN0aW9uIGlzQW5jaG9yV2l0aEhyZWYoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzQW5jaG9yRWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnaHJlZicpO1xufVxuXG4vKiogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgYW4gaW5wdXQgZWxlbWVudC4gKi9cbmZ1bmN0aW9uIGlzSW5wdXRFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogZWxlbWVudCBpcyBIVE1MSW5wdXRFbGVtZW50IHtcbiAgcmV0dXJuIGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW5wdXQnO1xufVxuXG4vKiogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgYW4gYW5jaG9yIGVsZW1lbnQuICovXG5mdW5jdGlvbiBpc0FuY2hvckVsZW1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBlbGVtZW50IGlzIEhUTUxBbmNob3JFbGVtZW50IHtcbiAgcmV0dXJuIGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnYSc7XG59XG5cbi8qKiBHZXRzIHdoZXRoZXIgYW4gZWxlbWVudCBoYXMgYSB2YWxpZCB0YWJpbmRleC4gKi9cbmZ1bmN0aW9uIGhhc1ZhbGlkVGFiSW5kZXgoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgaWYgKCFlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSB8fCBlbGVtZW50LnRhYkluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgdGFiSW5kZXggPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcblxuICAvLyBJRTExIHBhcnNlcyB0YWJpbmRleD1cIlwiIGFzIHRoZSB2YWx1ZSBcIi0zMjc2OFwiXG4gIGlmICh0YWJJbmRleCA9PSAnLTMyNzY4Jykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiAhISh0YWJJbmRleCAmJiAhaXNOYU4ocGFyc2VJbnQodGFiSW5kZXgsIDEwKSkpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHBhcnNlZCB0YWJpbmRleCBmcm9tIHRoZSBlbGVtZW50IGF0dHJpYnV0ZXMgaW5zdGVhZCBvZiByZXR1cm5pbmcgdGhlXG4gKiBldmFsdWF0ZWQgdGFiaW5kZXggZnJvbSB0aGUgYnJvd3NlcnMgZGVmYXVsdHMuXG4gKi9cbmZ1bmN0aW9uIGdldFRhYkluZGV4VmFsdWUoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBudW1iZXIgfCBudWxsIHtcbiAgaWYgKCFoYXNWYWxpZFRhYkluZGV4KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBTZWUgYnJvd3NlciBpc3N1ZSBpbiBHZWNrbyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0xMTI4MDU0XG4gIGNvbnN0IHRhYkluZGV4ID0gcGFyc2VJbnQoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JykgfHwgJycsIDEwKTtcblxuICByZXR1cm4gaXNOYU4odGFiSW5kZXgpID8gLTEgOiB0YWJJbmRleDtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgZWxlbWVudCBpcyBwb3RlbnRpYWxseSB0YWJiYWJsZSBvbiBpT1MgKi9cbmZ1bmN0aW9uIGlzUG90ZW50aWFsbHlUYWJiYWJsZUlPUyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICBsZXQgbm9kZU5hbWUgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gIGxldCBpbnB1dFR5cGUgPSBub2RlTmFtZSA9PT0gJ2lucHV0JyAmJiAoZWxlbWVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlO1xuXG4gIHJldHVybiBpbnB1dFR5cGUgPT09ICd0ZXh0J1xuICAgICAgfHwgaW5wdXRUeXBlID09PSAncGFzc3dvcmQnXG4gICAgICB8fCBub2RlTmFtZSA9PT0gJ3NlbGVjdCdcbiAgICAgIHx8IG5vZGVOYW1lID09PSAndGV4dGFyZWEnO1xufVxuXG4vKipcbiAqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGlzIHBvdGVudGlhbGx5IGZvY3VzYWJsZSB3aXRob3V0IHRha2luZyBjdXJyZW50IHZpc2libGUvZGlzYWJsZWQgc3RhdGVcbiAqIGludG8gYWNjb3VudC5cbiAqL1xuZnVuY3Rpb24gaXNQb3RlbnRpYWxseUZvY3VzYWJsZShlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBJbnB1dHMgYXJlIHBvdGVudGlhbGx5IGZvY3VzYWJsZSAqdW5sZXNzKiB0aGV5J3JlIHR5cGU9XCJoaWRkZW5cIi5cbiAgaWYgKGlzSGlkZGVuSW5wdXQoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gaXNOYXRpdmVGb3JtRWxlbWVudChlbGVtZW50KSB8fFxuICAgICAgaXNBbmNob3JXaXRoSHJlZihlbGVtZW50KSB8fFxuICAgICAgZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2NvbnRlbnRlZGl0YWJsZScpIHx8XG4gICAgICBoYXNWYWxpZFRhYkluZGV4KGVsZW1lbnQpO1xufVxuXG4vKiogR2V0cyB0aGUgcGFyZW50IHdpbmRvdyBvZiBhIERPTSBub2RlIHdpdGggcmVnYXJkcyBvZiBiZWluZyBpbnNpZGUgb2YgYW4gaWZyYW1lLiAqL1xuZnVuY3Rpb24gZ2V0V2luZG93KG5vZGU6IEhUTUxFbGVtZW50KTogV2luZG93IHtcbiAgLy8gb3duZXJEb2N1bWVudCBpcyBudWxsIGlmIGBub2RlYCBpdHNlbGYgKmlzKiBhIGRvY3VtZW50LlxuICByZXR1cm4gbm9kZS5vd25lckRvY3VtZW50ICYmIG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG59XG4iXX0=