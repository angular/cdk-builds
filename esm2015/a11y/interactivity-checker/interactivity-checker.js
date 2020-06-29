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
export class InteractivityChecker {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpdml0eS1jaGVja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9hMTF5L2ludGVyYWN0aXZpdHktY2hlY2tlci9pbnRlcmFjdGl2aXR5LWNoZWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7OztBQUV6Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxpQkFBaUI7SUFBOUI7UUFDRTs7V0FFRztRQUNILHFCQUFnQixHQUFZLEtBQUssQ0FBQztJQUNwQyxDQUFDO0NBQUE7QUFFRCxpRkFBaUY7QUFDakYsNkZBQTZGO0FBQzdGLGFBQWE7QUFFYjs7O0dBR0c7QUFFSCxNQUFNLE9BQU8sb0JBQW9CO0lBRS9CLFlBQW9CLFNBQW1CO1FBQW5CLGNBQVMsR0FBVCxTQUFTLENBQVU7SUFBRyxDQUFDO0lBRTNDOzs7OztPQUtHO0lBQ0gsVUFBVSxDQUFDLE9BQW9CO1FBQzdCLDRGQUE0RjtRQUM1RixzRkFBc0Y7UUFDdEYsT0FBTyxPQUFPLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsU0FBUyxDQUFDLE9BQW9CO1FBQzVCLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUM7SUFDcEYsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFVBQVUsQ0FBQyxPQUFvQjtRQUM3Qix1Q0FBdUM7UUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQzdCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMs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QUN6QyxDQUFDO0FBRUQsMEVBQTBFO0FBQzFFLFNBQVMsd0JBQXdCLENBQUMsT0FBb0I7SUFDcEQsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM5QyxJQUFJLFNBQVMsR0FBRyxRQUFRLEtBQUssT0FBTyxJQUFLLE9BQTRCLENBQUMsSUFBSSxDQUFDO0lBRTNFLE9BQU8sU0FBUyxLQUFLLE1BQU07V0FDcEIsU0FBUyxLQUFLLFVBQVU7V0FDeEIsUUFBUSxLQUFLLFFBQVE7V0FDckIsUUFBUSxLQUFLLFVBQVUsQ0FBQztBQUNqQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxPQUFvQjtJQUNsRCxtRUFBbUU7SUFDbkUsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDMUIsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sbUJBQW1CLENBQUMsT0FBTyxDQUFDO1FBQy9CLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztRQUN6QixPQUFPLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDO1FBQ3ZDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFFRCxzRkFBc0Y7QUFDdEYsU0FBUyxTQUFTLENBQUMsSUFBaUI7SUFDbEMsMERBQTBEO0lBQzFELE9BQU8sSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUM7QUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGZvciB0aGUgaXNGb2N1c2FibGUgbWV0aG9kLlxuICovXG5leHBvcnQgY2xhc3MgSXNGb2N1c2FibGVDb25maWcge1xuICAvKipcbiAgICogV2hldGhlciB0byBjb3VudCBhbiBlbGVtZW50IGFzIGZvY3VzYWJsZSBldmVuIGlmIGl0IGlzIG5vdCBjdXJyZW50bHkgdmlzaWJsZS5cbiAgICovXG4gIGlnbm9yZVZpc2liaWxpdHk6IGJvb2xlYW4gPSBmYWxzZTtcbn1cblxuLy8gVGhlIEludGVyYWN0aXZpdHlDaGVja2VyIGxlYW5zIGhlYXZpbHkgb24gdGhlIGFsbHkuanMgYWNjZXNzaWJpbGl0eSB1dGlsaXRpZXMuXG4vLyBNZXRob2RzIGxpa2UgYGlzVGFiYmFibGVgIGFyZSBvbmx5IGNvdmVyaW5nIHNwZWNpZmljIGVkZ2UtY2FzZXMgZm9yIHRoZSBicm93c2VycyB3aGljaCBhcmVcbi8vIHN1cHBvcnRlZC5cblxuLyoqXG4gKiBVdGlsaXR5IGZvciBjaGVja2luZyB0aGUgaW50ZXJhY3Rpdml0eSBvZiBhbiBlbGVtZW50LCBzdWNoIGFzIHdoZXRoZXIgaXMgaXMgZm9jdXNhYmxlIG9yXG4gKiB0YWJiYWJsZS5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgSW50ZXJhY3Rpdml0eUNoZWNrZXIge1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybSkge31cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaXMgZGlzYWJsZWQuXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZWxlbWVudCBpcyBkaXNhYmxlZC5cbiAgICovXG4gIGlzRGlzYWJsZWQoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAvLyBUaGlzIGRvZXMgbm90IGNhcHR1cmUgc29tZSBjYXNlcywgc3VjaCBhcyBhIG5vbi1mb3JtIGNvbnRyb2wgd2l0aCBhIGRpc2FibGVkIGF0dHJpYnV0ZSBvclxuICAgIC8vIGEgZm9ybSBjb250cm9sIGluc2lkZSBvZiBhIGRpc2FibGVkIGZvcm0sIGJ1dCBzaG91bGQgY2FwdHVyZSB0aGUgbW9zdCBjb21tb24gY2FzZXMuXG4gICAgcmV0dXJuIGVsZW1lbnQuaGFzQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGlzIHZpc2libGUgZm9yIHRoZSBwdXJwb3NlcyBvZiBpbnRlcmFjdGl2aXR5LlxuICAgKlxuICAgKiBUaGlzIHdpbGwgY2FwdHVyZSBzdGF0ZXMgbGlrZSBgZGlzcGxheTogbm9uZWAgYW5kIGB2aXNpYmlsaXR5OiBoaWRkZW5gLCBidXQgbm90IHRoaW5ncyBsaWtlXG4gICAqIGJlaW5nIGNsaXBwZWQgYnkgYW4gYG92ZXJmbG93OiBoaWRkZW5gIHBhcmVudCBvciBiZWluZyBvdXRzaWRlIHRoZSB2aWV3cG9ydC5cbiAgICpcbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZWxlbWVudCBpcyB2aXNpYmxlLlxuICAgKi9cbiAgaXNWaXNpYmxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGhhc0dlb21ldHJ5KGVsZW1lbnQpICYmIGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkudmlzaWJpbGl0eSA9PT0gJ3Zpc2libGUnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGNhbiBiZSByZWFjaGVkIHZpYSBUYWIga2V5LlxuICAgKiBBc3N1bWVzIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGFscmVhZHkgYmVlbiBjaGVja2VkIHdpdGggaXNGb2N1c2FibGUuXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZWxlbWVudCBpcyB0YWJiYWJsZS5cbiAgICovXG4gIGlzVGFiYmFibGUoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICAvLyBOb3RoaW5nIGlzIHRhYmJhYmxlIG9uIHRoZSBzZXJ2ZXIg8J+YjlxuICAgIGlmICghdGhpcy5fcGxhdGZvcm0uaXNCcm93c2VyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgZnJhbWVFbGVtZW50ID0gZ2V0RnJhbWVFbGVtZW50KGdldFdpbmRvdyhlbGVtZW50KSk7XG5cbiAgICBpZiAoZnJhbWVFbGVtZW50KSB7XG4gICAgICBjb25zdCBmcmFtZVR5cGUgPSBmcmFtZUVsZW1lbnQgJiYgZnJhbWVFbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIC8vIEZyYW1lIGVsZW1lbnRzIGluaGVyaXQgdGhlaXIgdGFiaW5kZXggb250byBhbGwgY2hpbGQgZWxlbWVudHMuXG4gICAgICBpZiAoZ2V0VGFiSW5kZXhWYWx1ZShmcmFtZUVsZW1lbnQpID09PSAtMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlYmtpdCBhbmQgQmxpbmsgY29uc2lkZXIgYW55dGhpbmcgaW5zaWRlIG9mIGFuIDxvYmplY3Q+IGVsZW1lbnQgYXMgbm9uLXRhYmJhYmxlLlxuICAgICAgaWYgKCh0aGlzLl9wbGF0Zm9ybS5CTElOSyB8fCB0aGlzLl9wbGF0Zm9ybS5XRUJLSVQpICYmIGZyYW1lVHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBXZWJraXQgYW5kIEJsaW5rIGRpc2FibGUgdGFiYmluZyB0byBhbiBlbGVtZW50IGluc2lkZSBvZiBhbiBpbnZpc2libGUgZnJhbWUuXG4gICAgICBpZiAoKHRoaXMuX3BsYXRmb3JtLkJMSU5LIHx8IHRoaXMuX3BsYXRmb3JtLldFQktJVCkgJiYgIXRoaXMuaXNWaXNpYmxlKGZyYW1lRWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgbGV0IG5vZGVOYW1lID0gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGxldCB0YWJJbmRleFZhbHVlID0gZ2V0VGFiSW5kZXhWYWx1ZShlbGVtZW50KTtcblxuICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY29udGVudGVkaXRhYmxlJykpIHtcbiAgICAgIHJldHVybiB0YWJJbmRleFZhbHVlICE9PSAtMTtcbiAgICB9XG5cbiAgICBpZiAobm9kZU5hbWUgPT09ICdpZnJhbWUnKSB7XG4gICAgICAvLyBUaGUgZnJhbWVzIG1heSBiZSB0YWJiYWJsZSBkZXBlbmRpbmcgb24gY29udGVudCwgYnV0IGl0J3Mgbm90IHBvc3NpYmx5IHRvIHJlbGlhYmx5XG4gICAgICAvLyBpbnZlc3RpZ2F0ZSB0aGUgY29udGVudCBvZiB0aGUgZnJhbWVzLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChub2RlTmFtZSA9PT0gJ2F1ZGlvJykge1xuICAgICAgaWYgKCFlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY29udHJvbHMnKSkge1xuICAgICAgICAvLyBCeSBkZWZhdWx0IGFuIDxhdWRpbz4gZWxlbWVudCB3aXRob3V0IHRoZSBjb250cm9scyBlbmFibGVkIGlzIG5vdCB0YWJiYWJsZS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9wbGF0Zm9ybS5CTElOSykge1xuICAgICAgICAvLyBJbiBCbGluayA8YXVkaW8gY29udHJvbHM+IGVsZW1lbnRzIGFyZSBhbHdheXMgdGFiYmFibGUuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChub2RlTmFtZSA9PT0gJ3ZpZGVvJykge1xuICAgICAgaWYgKCFlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnY29udHJvbHMnKSAmJiB0aGlzLl9wbGF0Zm9ybS5UUklERU5UKSB7XG4gICAgICAgIC8vIEluIFRyaWRlbnQgYSA8dmlkZW8+IGVsZW1lbnQgd2l0aG91dCB0aGUgY29udHJvbHMgZW5hYmxlZCBpcyBub3QgdGFiYmFibGUuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fcGxhdGZvcm0uQkxJTksgfHwgdGhpcy5fcGxhdGZvcm0uRklSRUZPWCkge1xuICAgICAgICAvLyBJbiBDaHJvbWUgYW5kIEZpcmVmb3ggPHZpZGVvIGNvbnRyb2xzPiBlbGVtZW50cyBhcmUgYWx3YXlzIHRhYmJhYmxlLlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobm9kZU5hbWUgPT09ICdvYmplY3QnICYmICh0aGlzLl9wbGF0Zm9ybS5CTElOSyB8fCB0aGlzLl9wbGF0Zm9ybS5XRUJLSVQpKSB7XG4gICAgICAvLyBJbiBhbGwgQmxpbmsgYW5kIFdlYktpdCBiYXNlZCBicm93c2VycyA8b2JqZWN0PiBlbGVtZW50cyBhcmUgbmV2ZXIgdGFiYmFibGUuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSW4gaU9TIHRoZSBicm93c2VyIG9ubHkgY29uc2lkZXJzIHNvbWUgc3BlY2lmaWMgZWxlbWVudHMgYXMgdGFiYmFibGUuXG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtLldFQktJVCAmJiB0aGlzLl9wbGF0Zm9ybS5JT1MgJiYgIWlzUG90ZW50aWFsbHlUYWJiYWJsZUlPUyhlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50LnRhYkluZGV4ID49IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgY2FuIGJlIGZvY3VzZWQgYnkgdGhlIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cbiAgICogQHBhcmFtIGNvbmZpZyBUaGUgY29uZmlnIG9iamVjdCB3aXRoIG9wdGlvbnMgdG8gY3VzdG9taXplIHRoaXMgbWV0aG9kJ3MgYmVoYXZpb3JcbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgZWxlbWVudCBpcyBmb2N1c2FibGUuXG4gICAqL1xuICBpc0ZvY3VzYWJsZShlbGVtZW50OiBIVE1MRWxlbWVudCwgY29uZmlnPzogSXNGb2N1c2FibGVDb25maWcpOiBib29sZWFuIHtcbiAgICAvLyBQZXJmb3JtIGNoZWNrcyBpbiBvcmRlciBvZiBsZWZ0IHRvIG1vc3QgZXhwZW5zaXZlLlxuICAgIC8vIEFnYWluLCBuYWl2ZSBhcHByb2FjaCB0aGF0IGRvZXMgbm90IGNhcHR1cmUgbWFueSBlZGdlIGNhc2VzIGFuZCBicm93c2VyIHF1aXJrcy5cbiAgICByZXR1cm4gaXNQb3RlbnRpYWxseUZvY3VzYWJsZShlbGVtZW50KSAmJiAhdGhpcy5pc0Rpc2FibGVkKGVsZW1lbnQpICYmXG4gICAgICAoY29uZmlnPy5pZ25vcmVWaXNpYmlsaXR5IHx8IHRoaXMuaXNWaXNpYmxlKGVsZW1lbnQpKTtcbiAgfVxuXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZnJhbWUgZWxlbWVudCBmcm9tIGEgd2luZG93IG9iamVjdC4gU2luY2UgYnJvd3NlcnMgbGlrZSBNUyBFZGdlIHRocm93IGVycm9ycyBpZlxuICogdGhlIGZyYW1lRWxlbWVudCBwcm9wZXJ0eSBpcyBiZWluZyBhY2Nlc3NlZCBmcm9tIGEgZGlmZmVyZW50IGhvc3QgYWRkcmVzcywgdGhpcyBwcm9wZXJ0eVxuICogc2hvdWxkIGJlIGFjY2Vzc2VkIGNhcmVmdWxseS5cbiAqL1xuZnVuY3Rpb24gZ2V0RnJhbWVFbGVtZW50KHdpbmRvdzogV2luZG93KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdpbmRvdy5mcmFtZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciB0aGUgc3BlY2lmaWVkIGVsZW1lbnQgaGFzIGFueSBnZW9tZXRyeSAvIHJlY3RhbmdsZXMuICovXG5mdW5jdGlvbiBoYXNHZW9tZXRyeShlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBVc2UgbG9naWMgZnJvbSBqUXVlcnkgdG8gY2hlY2sgZm9yIGFuIGludmlzaWJsZSBlbGVtZW50LlxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnkvYmxvYi9tYXN0ZXIvc3JjL2Nzcy9oaWRkZW5WaXNpYmxlU2VsZWN0b3JzLmpzI0wxMlxuICByZXR1cm4gISEoZWxlbWVudC5vZmZzZXRXaWR0aCB8fCBlbGVtZW50Lm9mZnNldEhlaWdodCB8fFxuICAgICAgKHR5cGVvZiBlbGVtZW50LmdldENsaWVudFJlY3RzID09PSAnZnVuY3Rpb24nICYmIGVsZW1lbnQuZ2V0Q2xpZW50UmVjdHMoKS5sZW5ndGgpKTtcbn1cblxuLyoqIEdldHMgd2hldGhlciBhbiBlbGVtZW50J3MgICovXG5mdW5jdGlvbiBpc05hdGl2ZUZvcm1FbGVtZW50KGVsZW1lbnQ6IE5vZGUpIHtcbiAgbGV0IG5vZGVOYW1lID0gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gbm9kZU5hbWUgPT09ICdpbnB1dCcgfHxcbiAgICAgIG5vZGVOYW1lID09PSAnc2VsZWN0JyB8fFxuICAgICAgbm9kZU5hbWUgPT09ICdidXR0b24nIHx8XG4gICAgICBub2RlTmFtZSA9PT0gJ3RleHRhcmVhJztcbn1cblxuLyoqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGlzIGFuIGA8aW5wdXQgdHlwZT1cImhpZGRlblwiPmAuICovXG5mdW5jdGlvbiBpc0hpZGRlbklucHV0KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0lucHV0RWxlbWVudChlbGVtZW50KSAmJiBlbGVtZW50LnR5cGUgPT0gJ2hpZGRlbic7XG59XG5cbi8qKiBHZXRzIHdoZXRoZXIgYW4gZWxlbWVudCBpcyBhbiBhbmNob3IgdGhhdCBoYXMgYW4gaHJlZiBhdHRyaWJ1dGUuICovXG5mdW5jdGlvbiBpc0FuY2hvcldpdGhIcmVmKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0FuY2hvckVsZW1lbnQoZWxlbWVudCkgJiYgZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2hyZWYnKTtcbn1cblxuLyoqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGlzIGFuIGlucHV0IGVsZW1lbnQuICovXG5mdW5jdGlvbiBpc0lucHV0RWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGVsZW1lbnQgaXMgSFRNTElucHV0RWxlbWVudCB7XG4gIHJldHVybiBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2lucHV0Jztcbn1cblxuLyoqIEdldHMgd2hldGhlciBhbiBlbGVtZW50IGlzIGFuIGFuY2hvciBlbGVtZW50LiAqL1xuZnVuY3Rpb24gaXNBbmNob3JFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogZWxlbWVudCBpcyBIVE1MQW5jaG9yRWxlbWVudCB7XG4gIHJldHVybiBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ2EnO1xufVxuXG4vKiogR2V0cyB3aGV0aGVyIGFuIGVsZW1lbnQgaGFzIGEgdmFsaWQgdGFiaW5kZXguICovXG5mdW5jdGlvbiBoYXNWYWxpZFRhYkluZGV4KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIGlmICghZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ3RhYmluZGV4JykgfHwgZWxlbWVudC50YWJJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGV0IHRhYkluZGV4ID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG5cbiAgLy8gSUUxMSBwYXJzZXMgdGFiaW5kZXg9XCJcIiBhcyB0aGUgdmFsdWUgXCItMzI3NjhcIlxuICBpZiAodGFiSW5kZXggPT0gJy0zMjc2OCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gISEodGFiSW5kZXggJiYgIWlzTmFOKHBhcnNlSW50KHRhYkluZGV4LCAxMCkpKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwYXJzZWQgdGFiaW5kZXggZnJvbSB0aGUgZWxlbWVudCBhdHRyaWJ1dGVzIGluc3RlYWQgb2YgcmV0dXJuaW5nIHRoZVxuICogZXZhbHVhdGVkIHRhYmluZGV4IGZyb20gdGhlIGJyb3dzZXJzIGRlZmF1bHRzLlxuICovXG5mdW5jdGlvbiBnZXRUYWJJbmRleFZhbHVlKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogbnVtYmVyIHwgbnVsbCB7XG4gIGlmICghaGFzVmFsaWRUYWJJbmRleChlbGVtZW50KSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gU2VlIGJyb3dzZXIgaXNzdWUgaW4gR2Vja28gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTEyODA1NFxuICBjb25zdCB0YWJJbmRleCA9IHBhcnNlSW50KGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpIHx8ICcnLCAxMCk7XG5cbiAgcmV0dXJuIGlzTmFOKHRhYkluZGV4KSA/IC0xIDogdGFiSW5kZXg7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciB0aGUgc3BlY2lmaWVkIGVsZW1lbnQgaXMgcG90ZW50aWFsbHkgdGFiYmFibGUgb24gaU9TICovXG5mdW5jdGlvbiBpc1BvdGVudGlhbGx5VGFiYmFibGVJT1MoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgbGV0IG5vZGVOYW1lID0gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICBsZXQgaW5wdXRUeXBlID0gbm9kZU5hbWUgPT09ICdpbnB1dCcgJiYgKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZTtcblxuICByZXR1cm4gaW5wdXRUeXBlID09PSAndGV4dCdcbiAgICAgIHx8IGlucHV0VHlwZSA9PT0gJ3Bhc3N3b3JkJ1xuICAgICAgfHwgbm9kZU5hbWUgPT09ICdzZWxlY3QnXG4gICAgICB8fCBub2RlTmFtZSA9PT0gJ3RleHRhcmVhJztcbn1cblxuLyoqXG4gKiBHZXRzIHdoZXRoZXIgYW4gZWxlbWVudCBpcyBwb3RlbnRpYWxseSBmb2N1c2FibGUgd2l0aG91dCB0YWtpbmcgY3VycmVudCB2aXNpYmxlL2Rpc2FibGVkIHN0YXRlXG4gKiBpbnRvIGFjY291bnQuXG4gKi9cbmZ1bmN0aW9uIGlzUG90ZW50aWFsbHlGb2N1c2FibGUoZWxlbWVudDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgLy8gSW5wdXRzIGFyZSBwb3RlbnRpYWxseSBmb2N1c2FibGUgKnVubGVzcyogdGhleSdyZSB0eXBlPVwiaGlkZGVuXCIuXG4gIGlmIChpc0hpZGRlbklucHV0KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGlzTmF0aXZlRm9ybUVsZW1lbnQoZWxlbWVudCkgfHxcbiAgICAgIGlzQW5jaG9yV2l0aEhyZWYoZWxlbWVudCkgfHxcbiAgICAgIGVsZW1lbnQuaGFzQXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnKSB8fFxuICAgICAgaGFzVmFsaWRUYWJJbmRleChlbGVtZW50KTtcbn1cblxuLyoqIEdldHMgdGhlIHBhcmVudCB3aW5kb3cgb2YgYSBET00gbm9kZSB3aXRoIHJlZ2FyZHMgb2YgYmVpbmcgaW5zaWRlIG9mIGFuIGlmcmFtZS4gKi9cbmZ1bmN0aW9uIGdldFdpbmRvdyhub2RlOiBIVE1MRWxlbWVudCk6IFdpbmRvdyB7XG4gIC8vIG93bmVyRG9jdW1lbnQgaXMgbnVsbCBpZiBgbm9kZWAgaXRzZWxmICppcyogYSBkb2N1bWVudC5cbiAgcmV0dXJuIG5vZGUub3duZXJEb2N1bWVudCAmJiBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xufVxuIl19