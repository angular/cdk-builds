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
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { addAriaReferencedId, getAriaReferenceIds, removeAriaReferencedId } from './aria-reference';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
/**
 * Interface used to register message elements and keep a count of how many registrations have
 * the same message and the reference to the message element used for the `aria-describedby`.
 * @record
 */
export function RegisteredMessage() { }
if (false) {
    /**
     * The element containing the message.
     * @type {?}
     */
    RegisteredMessage.prototype.messageElement;
    /**
     * The number of elements that reference this message element via `aria-describedby`.
     * @type {?}
     */
    RegisteredMessage.prototype.referenceCount;
}
/**
 * ID used for the body container where all messages are appended.
 * @type {?}
 */
export const MESSAGES_CONTAINER_ID = 'cdk-describedby-message-container';
/**
 * ID prefix used for each created message element.
 * @type {?}
 */
export const CDK_DESCRIBEDBY_ID_PREFIX = 'cdk-describedby-message';
/**
 * Attribute given to each host element that is described by a message element.
 * @type {?}
 */
export const CDK_DESCRIBEDBY_HOST_ATTRIBUTE = 'cdk-describedby-host';
/**
 * Global incremental identifier for each registered message element.
 * @type {?}
 */
let nextId = 0;
/**
 * Global map of all registered message elements that have been placed into the document.
 * @type {?}
 */
const messageRegistry = new Map();
/**
 * Container for all registered messages.
 * @type {?}
 */
let messagesContainer = null;
/**
 * Utility that creates visually hidden elements with a message content. Useful for elements that
 * want to use aria-describedby to further describe themselves without adding additional visual
 * content.
 */
export class AriaDescriber {
    /**
     * @param {?} _document
     */
    constructor(_document) {
        this._document = _document;
    }
    /**
     * Adds to the host element an aria-describedby reference to a hidden element that contains
     * the message. If the same message has already been registered, then it will reuse the created
     * message element.
     * @param {?} hostElement
     * @param {?} message
     * @return {?}
     */
    describe(hostElement, message) {
        if (!this._canBeDescribed(hostElement, message)) {
            return;
        }
        if (typeof message !== 'string') {
            // We need to ensure that the element has an ID.
            this._setMessageId(message);
            messageRegistry.set(message, { messageElement: message, referenceCount: 0 });
        }
        else if (!messageRegistry.has(message)) {
            this._createMessageElement(message);
        }
        if (!this._isElementDescribedByMessage(hostElement, message)) {
            this._addMessageReference(hostElement, message);
        }
    }
    /**
     * Removes the host element's aria-describedby reference to the message element.
     * @param {?} hostElement
     * @param {?} message
     * @return {?}
     */
    removeDescription(hostElement, message) {
        if (!this._isElementNode(hostElement)) {
            return;
        }
        if (this._isElementDescribedByMessage(hostElement, message)) {
            this._removeMessageReference(hostElement, message);
        }
        // If the message is a string, it means that it's one that we created for the
        // consumer so we can remove it safely, otherwise we should leave it in place.
        if (typeof message === 'string') {
            /** @type {?} */
            const registeredMessage = messageRegistry.get(message);
            if (registeredMessage && registeredMessage.referenceCount === 0) {
                this._deleteMessageElement(message);
            }
        }
        if (messagesContainer && messagesContainer.childNodes.length === 0) {
            this._deleteMessagesContainer();
        }
    }
    /**
     * Unregisters all created message elements and removes the message container.
     * @return {?}
     */
    ngOnDestroy() {
        /** @type {?} */
        const describedElements = this._document.querySelectorAll(`[${CDK_DESCRIBEDBY_HOST_ATTRIBUTE}]`);
        for (let i = 0; i < describedElements.length; i++) {
            this._removeCdkDescribedByReferenceIds(describedElements[i]);
            describedElements[i].removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
        }
        if (messagesContainer) {
            this._deleteMessagesContainer();
        }
        messageRegistry.clear();
    }
    /**
     * Creates a new element in the visually hidden message container element with the message
     * as its content and adds it to the message registry.
     * @private
     * @param {?} message
     * @return {?}
     */
    _createMessageElement(message) {
        /** @type {?} */
        const messageElement = this._document.createElement('div');
        this._setMessageId(messageElement);
        messageElement.textContent = message;
        this._createMessagesContainer();
        (/** @type {?} */ (messagesContainer)).appendChild(messageElement);
        messageRegistry.set(message, { messageElement, referenceCount: 0 });
    }
    /**
     * Assigns a unique ID to an element, if it doesn't have one already.
     * @private
     * @param {?} element
     * @return {?}
     */
    _setMessageId(element) {
        if (!element.id) {
            element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${nextId++}`;
        }
    }
    /**
     * Deletes the message element from the global messages container.
     * @private
     * @param {?} message
     * @return {?}
     */
    _deleteMessageElement(message) {
        /** @type {?} */
        const registeredMessage = messageRegistry.get(message);
        /** @type {?} */
        const messageElement = registeredMessage && registeredMessage.messageElement;
        if (messagesContainer && messageElement) {
            messagesContainer.removeChild(messageElement);
        }
        messageRegistry.delete(message);
    }
    /**
     * Creates the global container for all aria-describedby messages.
     * @private
     * @return {?}
     */
    _createMessagesContainer() {
        if (!messagesContainer) {
            /** @type {?} */
            const preExistingContainer = this._document.getElementById(MESSAGES_CONTAINER_ID);
            // When going from the server to the client, we may end up in a situation where there's
            // already a container on the page, but we don't have a reference to it. Clear the
            // old container so we don't get duplicates. Doing this, instead of emptying the previous
            // container, should be slightly faster.
            if (preExistingContainer) {
                (/** @type {?} */ (preExistingContainer.parentNode)).removeChild(preExistingContainer);
            }
            messagesContainer = this._document.createElement('div');
            messagesContainer.id = MESSAGES_CONTAINER_ID;
            messagesContainer.setAttribute('aria-hidden', 'true');
            messagesContainer.style.display = 'none';
            this._document.body.appendChild(messagesContainer);
        }
    }
    /**
     * Deletes the global messages container.
     * @private
     * @return {?}
     */
    _deleteMessagesContainer() {
        if (messagesContainer && messagesContainer.parentNode) {
            messagesContainer.parentNode.removeChild(messagesContainer);
            messagesContainer = null;
        }
    }
    /**
     * Removes all cdk-describedby messages that are hosted through the element.
     * @private
     * @param {?} element
     * @return {?}
     */
    _removeCdkDescribedByReferenceIds(element) {
        // Remove all aria-describedby reference IDs that are prefixed by CDK_DESCRIBEDBY_ID_PREFIX
        /** @type {?} */
        const originalReferenceIds = getAriaReferenceIds(element, 'aria-describedby')
            .filter((/**
         * @param {?} id
         * @return {?}
         */
        id => id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0));
        element.setAttribute('aria-describedby', originalReferenceIds.join(' '));
    }
    /**
     * Adds a message reference to the element using aria-describedby and increments the registered
     * message's reference count.
     * @private
     * @param {?} element
     * @param {?} message
     * @return {?}
     */
    _addMessageReference(element, message) {
        /** @type {?} */
        const registeredMessage = (/** @type {?} */ (messageRegistry.get(message)));
        // Add the aria-describedby reference and set the
        // describedby_host attribute to mark the element.
        addAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, '');
        registeredMessage.referenceCount++;
    }
    /**
     * Removes a message reference from the element using aria-describedby
     * and decrements the registered message's reference count.
     * @private
     * @param {?} element
     * @param {?} message
     * @return {?}
     */
    _removeMessageReference(element, message) {
        /** @type {?} */
        const registeredMessage = (/** @type {?} */ (messageRegistry.get(message)));
        registeredMessage.referenceCount--;
        removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }
    /**
     * Returns true if the element has been described by the provided message ID.
     * @private
     * @param {?} element
     * @param {?} message
     * @return {?}
     */
    _isElementDescribedByMessage(element, message) {
        /** @type {?} */
        const referenceIds = getAriaReferenceIds(element, 'aria-describedby');
        /** @type {?} */
        const registeredMessage = messageRegistry.get(message);
        /** @type {?} */
        const messageId = registeredMessage && registeredMessage.messageElement.id;
        return !!messageId && referenceIds.indexOf(messageId) != -1;
    }
    /**
     * Determines whether a message can be described on a particular element.
     * @private
     * @param {?} element
     * @param {?} message
     * @return {?}
     */
    _canBeDescribed(element, message) {
        if (!this._isElementNode(element)) {
            return false;
        }
        if (message && typeof message === 'object') {
            // We'd have to make some assumptions about the description element's text, if the consumer
            // passed in an element. Assume that if an element is passed in, the consumer has verified
            // that it can be used as a description.
            return true;
        }
        /** @type {?} */
        const trimmedMessage = message == null ? '' : `${message}`.trim();
        /** @type {?} */
        const ariaLabel = element.getAttribute('aria-label');
        // We shouldn't set descriptions if they're exactly the same as the `aria-label` of the
        // element, because screen readers will end up reading out the same text twice in a row.
        return trimmedMessage ? (!ariaLabel || ariaLabel.trim() !== trimmedMessage) : false;
    }
    /**
     * Checks whether a node is an Element node.
     * @private
     * @param {?} element
     * @return {?}
     */
    _isElementNode(element) {
        return element.nodeType === this._document.ELEMENT_NODE;
    }
}
AriaDescriber.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
/** @nocollapse */
AriaDescriber.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
/** @nocollapse */ AriaDescriber.ɵprov = i0.ɵɵdefineInjectable({ factory: function AriaDescriber_Factory() { return new AriaDescriber(i0.ɵɵinject(i1.DOCUMENT)); }, token: AriaDescriber, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    AriaDescriber.prototype._document;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1kZXNjcmliZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1kZXNjcmliZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQVksTUFBTSxlQUFlLENBQUM7QUFDNUQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7Ozs7O0FBT2xHLHVDQU1DOzs7Ozs7SUFKQywyQ0FBd0I7Ozs7O0lBR3hCLDJDQUF1Qjs7Ozs7O0FBSXpCLE1BQU0sT0FBTyxxQkFBcUIsR0FBRyxtQ0FBbUM7Ozs7O0FBR3hFLE1BQU0sT0FBTyx5QkFBeUIsR0FBRyx5QkFBeUI7Ozs7O0FBR2xFLE1BQU0sT0FBTyw4QkFBOEIsR0FBRyxzQkFBc0I7Ozs7O0lBR2hFLE1BQU0sR0FBRyxDQUFDOzs7OztNQUdSLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBeUM7Ozs7O0lBR3BFLGlCQUFpQixHQUF1QixJQUFJOzs7Ozs7QUFRaEQsTUFBTSxPQUFPLGFBQWE7Ozs7SUFHeEIsWUFBOEIsU0FBYztRQUMxQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUM3QixDQUFDOzs7Ozs7Ozs7SUFPRCxRQUFRLENBQUMsV0FBb0IsRUFBRSxPQUEyQjtRQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDL0MsT0FBTztTQUNSO1FBRUQsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7WUFDL0IsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUIsZUFB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U0FBQyxRQUFROzs7Ozs7OztJQUY1QixrQ0FBNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtET0NVTUVOVH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBPbkRlc3Ryb3l9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHthZGRBcmlhUmVmZXJlbmNlZElkLCBnZXRBcmlhUmVmZXJlbmNlSWRzLCByZW1vdmVBcmlhUmVmZXJlbmNlZElkfSBmcm9tICcuL2FyaWEtcmVmZXJlbmNlJztcblxuXG4vKipcbiAqIEludGVyZmFjZSB1c2VkIHRvIHJlZ2lzdGVyIG1lc3NhZ2UgZWxlbWVudHMgYW5kIGtlZXAgYSBjb3VudCBvZiBob3cgbWFueSByZWdpc3RyYXRpb25zIGhhdmVcbiAqIHRoZSBzYW1lIG1lc3NhZ2UgYW5kIHRoZSByZWZlcmVuY2UgdG8gdGhlIG1lc3NhZ2UgZWxlbWVudCB1c2VkIGZvciB0aGUgYGFyaWEtZGVzY3JpYmVkYnlgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlZ2lzdGVyZWRNZXNzYWdlIHtcbiAgLyoqIFRoZSBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIG1lc3NhZ2UuICovXG4gIG1lc3NhZ2VFbGVtZW50OiBFbGVtZW50O1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgcmVmZXJlbmNlIHRoaXMgbWVzc2FnZSBlbGVtZW50IHZpYSBgYXJpYS1kZXNjcmliZWRieWAuICovXG4gIHJlZmVyZW5jZUNvdW50OiBudW1iZXI7XG59XG5cbi8qKiBJRCB1c2VkIGZvciB0aGUgYm9keSBjb250YWluZXIgd2hlcmUgYWxsIG1lc3NhZ2VzIGFyZSBhcHBlbmRlZC4gKi9cbmV4cG9ydCBjb25zdCBNRVNTQUdFU19DT05UQUlORVJfSUQgPSAnY2RrLWRlc2NyaWJlZGJ5LW1lc3NhZ2UtY29udGFpbmVyJztcblxuLyoqIElEIHByZWZpeCB1c2VkIGZvciBlYWNoIGNyZWF0ZWQgbWVzc2FnZSBlbGVtZW50LiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9JRF9QUkVGSVggPSAnY2RrLWRlc2NyaWJlZGJ5LW1lc3NhZ2UnO1xuXG4vKiogQXR0cmlidXRlIGdpdmVuIHRvIGVhY2ggaG9zdCBlbGVtZW50IHRoYXQgaXMgZGVzY3JpYmVkIGJ5IGEgbWVzc2FnZSBlbGVtZW50LiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURSA9ICdjZGstZGVzY3JpYmVkYnktaG9zdCc7XG5cbi8qKiBHbG9iYWwgaW5jcmVtZW50YWwgaWRlbnRpZmllciBmb3IgZWFjaCByZWdpc3RlcmVkIG1lc3NhZ2UgZWxlbWVudC4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKiogR2xvYmFsIG1hcCBvZiBhbGwgcmVnaXN0ZXJlZCBtZXNzYWdlIGVsZW1lbnRzIHRoYXQgaGF2ZSBiZWVuIHBsYWNlZCBpbnRvIHRoZSBkb2N1bWVudC4gKi9cbmNvbnN0IG1lc3NhZ2VSZWdpc3RyeSA9IG5ldyBNYXA8c3RyaW5nfEhUTUxFbGVtZW50LCBSZWdpc3RlcmVkTWVzc2FnZT4oKTtcblxuLyoqIENvbnRhaW5lciBmb3IgYWxsIHJlZ2lzdGVyZWQgbWVzc2FnZXMuICovXG5sZXQgbWVzc2FnZXNDb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogVXRpbGl0eSB0aGF0IGNyZWF0ZXMgdmlzdWFsbHkgaGlkZGVuIGVsZW1lbnRzIHdpdGggYSBtZXNzYWdlIGNvbnRlbnQuIFVzZWZ1bCBmb3IgZWxlbWVudHMgdGhhdFxuICogd2FudCB0byB1c2UgYXJpYS1kZXNjcmliZWRieSB0byBmdXJ0aGVyIGRlc2NyaWJlIHRoZW1zZWx2ZXMgd2l0aG91dCBhZGRpbmcgYWRkaXRpb25hbCB2aXN1YWxcbiAqIGNvbnRlbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEFyaWFEZXNjcmliZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRvIHRoZSBob3N0IGVsZW1lbnQgYW4gYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgdG8gYSBoaWRkZW4gZWxlbWVudCB0aGF0IGNvbnRhaW5zXG4gICAqIHRoZSBtZXNzYWdlLiBJZiB0aGUgc2FtZSBtZXNzYWdlIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgdGhlbiBpdCB3aWxsIHJldXNlIHRoZSBjcmVhdGVkXG4gICAqIG1lc3NhZ2UgZWxlbWVudC5cbiAgICovXG4gIGRlc2NyaWJlKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQpIHtcbiAgICBpZiAoIXRoaXMuX2NhbkJlRGVzY3JpYmVkKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGFuIElELlxuICAgICAgdGhpcy5fc2V0TWVzc2FnZUlkKG1lc3NhZ2UpO1xuICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChtZXNzYWdlLCB7bWVzc2FnZUVsZW1lbnQ6IG1lc3NhZ2UsIHJlZmVyZW5jZUNvdW50OiAwfSk7XG4gICAgfSBlbHNlIGlmICghbWVzc2FnZVJlZ2lzdHJ5LmhhcyhtZXNzYWdlKSkge1xuICAgICAgdGhpcy5fY3JlYXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9pc0VsZW1lbnREZXNjcmliZWRCeU1lc3NhZ2UoaG9zdEVsZW1lbnQsIG1lc3NhZ2UpKSB7XG4gICAgICB0aGlzLl9hZGRNZXNzYWdlUmVmZXJlbmNlKGhvc3RFbGVtZW50LCBtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgaG9zdCBlbGVtZW50J3MgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgdG8gdGhlIG1lc3NhZ2UgZWxlbWVudC4gKi9cbiAgcmVtb3ZlRGVzY3JpcHRpb24oaG9zdEVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZ3xIVE1MRWxlbWVudCkge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShob3N0RWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faXNFbGVtZW50RGVzY3JpYmVkQnlNZXNzYWdlKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgdGhpcy5fcmVtb3ZlTWVzc2FnZVJlZmVyZW5jZShob3N0RWxlbWVudCwgbWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG1lc3NhZ2UgaXMgYSBzdHJpbmcsIGl0IG1lYW5zIHRoYXQgaXQncyBvbmUgdGhhdCB3ZSBjcmVhdGVkIGZvciB0aGVcbiAgICAvLyBjb25zdW1lciBzbyB3ZSBjYW4gcmVtb3ZlIGl0IHNhZmVseSwgb3RoZXJ3aXNlIHdlIHNob3VsZCBsZWF2ZSBpdCBpbiBwbGFjZS5cbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCByZWdpc3RlcmVkTWVzc2FnZSA9IG1lc3NhZ2VSZWdpc3RyeS5nZXQobWVzc2FnZSk7XG4gICAgICBpZiAocmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UucmVmZXJlbmNlQ291bnQgPT09IDApIHtcbiAgICAgICAgdGhpcy5fZGVsZXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyICYmIG1lc3NhZ2VzQ29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9kZWxldGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVbnJlZ2lzdGVycyBhbGwgY3JlYXRlZCBtZXNzYWdlIGVsZW1lbnRzIGFuZCByZW1vdmVzIHRoZSBtZXNzYWdlIGNvbnRhaW5lci4gKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgZGVzY3JpYmVkRWxlbWVudHMgPVxuICAgICAgICB0aGlzLl9kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbJHtDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEV9XWApO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjcmliZWRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5fcmVtb3ZlQ2RrRGVzY3JpYmVkQnlSZWZlcmVuY2VJZHMoZGVzY3JpYmVkRWxlbWVudHNbaV0pO1xuICAgICAgZGVzY3JpYmVkRWxlbWVudHNbaV0ucmVtb3ZlQXR0cmlidXRlKENES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURSk7XG4gICAgfVxuXG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9kZWxldGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIG1lc3NhZ2VSZWdpc3RyeS5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgZWxlbWVudCBpbiB0aGUgdmlzdWFsbHkgaGlkZGVuIG1lc3NhZ2UgY29udGFpbmVyIGVsZW1lbnQgd2l0aCB0aGUgbWVzc2FnZVxuICAgKiBhcyBpdHMgY29udGVudCBhbmQgYWRkcyBpdCB0byB0aGUgbWVzc2FnZSByZWdpc3RyeS5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2U6IHN0cmluZykge1xuICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fc2V0TWVzc2FnZUlkKG1lc3NhZ2VFbGVtZW50KTtcbiAgICBtZXNzYWdlRWxlbWVudC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG5cbiAgICB0aGlzLl9jcmVhdGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIG1lc3NhZ2VzQ29udGFpbmVyIS5hcHBlbmRDaGlsZChtZXNzYWdlRWxlbWVudCk7XG5cbiAgICBtZXNzYWdlUmVnaXN0cnkuc2V0KG1lc3NhZ2UsIHttZXNzYWdlRWxlbWVudCwgcmVmZXJlbmNlQ291bnQ6IDB9KTtcbiAgfVxuXG4gIC8qKiBBc3NpZ25zIGEgdW5pcXVlIElEIHRvIGFuIGVsZW1lbnQsIGlmIGl0IGRvZXNuJ3QgaGF2ZSBvbmUgYWxyZWFkeS4gKi9cbiAgcHJpdmF0ZSBfc2V0TWVzc2FnZUlkKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50LmlkKSB7XG4gICAgICBlbGVtZW50LmlkID0gYCR7Q0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWH0tJHtuZXh0SWQrK31gO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZWxldGVzIHRoZSBtZXNzYWdlIGVsZW1lbnQgZnJvbSB0aGUgZ2xvYmFsIG1lc3NhZ2VzIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZGVsZXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpO1xuICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gcmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UubWVzc2FnZUVsZW1lbnQ7XG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyICYmIG1lc3NhZ2VFbGVtZW50KSB7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5yZW1vdmVDaGlsZChtZXNzYWdlRWxlbWVudCk7XG4gICAgfVxuICAgIG1lc3NhZ2VSZWdpc3RyeS5kZWxldGUobWVzc2FnZSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgZ2xvYmFsIGNvbnRhaW5lciBmb3IgYWxsIGFyaWEtZGVzY3JpYmVkYnkgbWVzc2FnZXMuICovXG4gIHByaXZhdGUgX2NyZWF0ZU1lc3NhZ2VzQ29udGFpbmVyKCkge1xuICAgIGlmICghbWVzc2FnZXNDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IHByZUV4aXN0aW5nQ29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoTUVTU0FHRVNfQ09OVEFJTkVSX0lEKTtcblxuICAgICAgLy8gV2hlbiBnb2luZyBmcm9tIHRoZSBzZXJ2ZXIgdG8gdGhlIGNsaWVudCwgd2UgbWF5IGVuZCB1cCBpbiBhIHNpdHVhdGlvbiB3aGVyZSB0aGVyZSdzXG4gICAgICAvLyBhbHJlYWR5IGEgY29udGFpbmVyIG9uIHRoZSBwYWdlLCBidXQgd2UgZG9uJ3QgaGF2ZSBhIHJlZmVyZW5jZSB0byBpdC4gQ2xlYXIgdGhlXG4gICAgICAvLyBvbGQgY29udGFpbmVyIHNvIHdlIGRvbid0IGdldCBkdXBsaWNhdGVzLiBEb2luZyB0aGlzLCBpbnN0ZWFkIG9mIGVtcHR5aW5nIHRoZSBwcmV2aW91c1xuICAgICAgLy8gY29udGFpbmVyLCBzaG91bGQgYmUgc2xpZ2h0bHkgZmFzdGVyLlxuICAgICAgaWYgKHByZUV4aXN0aW5nQ29udGFpbmVyKSB7XG4gICAgICAgIHByZUV4aXN0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHByZUV4aXN0aW5nQ29udGFpbmVyKTtcbiAgICAgIH1cblxuICAgICAgbWVzc2FnZXNDb250YWluZXIgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyLmlkID0gTUVTU0FHRVNfQ09OVEFJTkVSX0lEO1xuICAgICAgbWVzc2FnZXNDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZXNzYWdlc0NvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIERlbGV0ZXMgdGhlIGdsb2JhbCBtZXNzYWdlcyBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RlbGV0ZU1lc3NhZ2VzQ29udGFpbmVyKCkge1xuICAgIGlmIChtZXNzYWdlc0NvbnRhaW5lciAmJiBtZXNzYWdlc0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG1lc3NhZ2VzQ29udGFpbmVyKTtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbGwgY2RrLWRlc2NyaWJlZGJ5IG1lc3NhZ2VzIHRoYXQgYXJlIGhvc3RlZCB0aHJvdWdoIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9yZW1vdmVDZGtEZXNjcmliZWRCeVJlZmVyZW5jZUlkcyhlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgLy8gUmVtb3ZlIGFsbCBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSBJRHMgdGhhdCBhcmUgcHJlZml4ZWQgYnkgQ0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWFxuICAgIGNvbnN0IG9yaWdpbmFsUmVmZXJlbmNlSWRzID0gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScpXG4gICAgICAgIC5maWx0ZXIoaWQgPT4gaWQuaW5kZXhPZihDREtfREVTQ1JJQkVEQllfSURfUFJFRklYKSAhPSAwKTtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScsIG9yaWdpbmFsUmVmZXJlbmNlSWRzLmpvaW4oJyAnKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG1lc3NhZ2UgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnkgYW5kIGluY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWRcbiAgICogbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX2FkZE1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpITtcblxuICAgIC8vIEFkZCB0aGUgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgYW5kIHNldCB0aGVcbiAgICAvLyBkZXNjcmliZWRieV9ob3N0IGF0dHJpYnV0ZSB0byBtYXJrIHRoZSBlbGVtZW50LlxuICAgIGFkZEFyaWFSZWZlcmVuY2VkSWQoZWxlbWVudCwgJ2FyaWEtZGVzY3JpYmVkYnknLCByZWdpc3RlcmVkTWVzc2FnZS5tZXNzYWdlRWxlbWVudC5pZCk7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFLCAnJyk7XG5cbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBtZXNzYWdlIHJlZmVyZW5jZSBmcm9tIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnlcbiAgICogYW5kIGRlY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWQgbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX3JlbW92ZU1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpITtcbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudC0tO1xuXG4gICAgcmVtb3ZlQXJpYVJlZmVyZW5jZWRJZChlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkKTtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBoYXMgYmVlbiBkZXNjcmliZWQgYnkgdGhlIHByb3ZpZGVkIG1lc3NhZ2UgSUQuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWZlcmVuY2VJZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsZW1lbnQsICdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpO1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHJlZ2lzdGVyZWRNZXNzYWdlICYmIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkO1xuXG4gICAgcmV0dXJuICEhbWVzc2FnZUlkICYmIHJlZmVyZW5jZUlkcy5pbmRleE9mKG1lc3NhZ2VJZCkgIT0gLTE7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbWVzc2FnZSBjYW4gYmUgZGVzY3JpYmVkIG9uIGEgcGFydGljdWxhciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jYW5CZURlc2NyaWJlZChlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnR8dm9pZCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlICYmIHR5cGVvZiBtZXNzYWdlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2UnZCBoYXZlIHRvIG1ha2Ugc29tZSBhc3N1bXB0aW9ucyBhYm91dCB0aGUgZGVzY3JpcHRpb24gZWxlbWVudCdzIHRleHQsIGlmIHRoZSBjb25zdW1lclxuICAgICAgLy8gcGFzc2VkIGluIGFuIGVsZW1lbnQuIEFzc3VtZSB0aGF0IGlmIGFuIGVsZW1lbnQgaXMgcGFzc2VkIGluLCB0aGUgY29uc3VtZXIgaGFzIHZlcmlmaWVkXG4gICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGEgZGVzY3JpcHRpb24uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkTWVzc2FnZSA9IG1lc3NhZ2UgPT0gbnVsbCA/ICcnIDogYCR7bWVzc2FnZX1gLnRyaW0oKTtcbiAgICBjb25zdCBhcmlhTGFiZWwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpO1xuXG4gICAgLy8gV2Ugc2hvdWxkbid0IHNldCBkZXNjcmlwdGlvbnMgaWYgdGhleSdyZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBgYXJpYS1sYWJlbGAgb2YgdGhlXG4gICAgLy8gZWxlbWVudCwgYmVjYXVzZSBzY3JlZW4gcmVhZGVycyB3aWxsIGVuZCB1cCByZWFkaW5nIG91dCB0aGUgc2FtZSB0ZXh0IHR3aWNlIGluIGEgcm93LlxuICAgIHJldHVybiB0cmltbWVkTWVzc2FnZSA/ICghYXJpYUxhYmVsIHx8IGFyaWFMYWJlbC50cmltKCkgIT09IHRyaW1tZWRNZXNzYWdlKSA6IGZhbHNlO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyBhbiBFbGVtZW50IG5vZGUuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudE5vZGUoZWxlbWVudDogTm9kZSk6IGVsZW1lbnQgaXMgRWxlbWVudCB7XG4gICAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgPT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERTtcbiAgfVxufVxuIl19