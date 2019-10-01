/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional, SkipSelf, } from '@angular/core';
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
/** @nocollapse */ AriaDescriber.ngInjectableDef = i0.ɵɵdefineInjectable({ factory: function AriaDescriber_Factory() { return new AriaDescriber(i0.ɵɵinject(i1.DOCUMENT)); }, token: AriaDescriber, providedIn: "root" });
if (false) {
    /**
     * @type {?}
     * @private
     */
    AriaDescriber.prototype._document;
}
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @param {?} parentDispatcher
 * @param {?} _document
 * @return {?}
 */
export function ARIA_DESCRIBER_PROVIDER_FACTORY(parentDispatcher, _document) {
    return parentDispatcher || new AriaDescriber(_document);
}
/**
 * \@docs-private \@deprecated \@breaking-change 8.0.0
 * @type {?}
 */
export const ARIA_DESCRIBER_PROVIDER = {
    // If there is already an AriaDescriber available, use that. Otherwise, provide a new one.
    provide: AriaDescriber,
    deps: [
        [new Optional(), new SkipSelf(), AriaDescriber],
        (/** @type {?} */ (DOCUMENT))
    ],
    useFactory: ARIA_DESCRIBER_PROVIDER_FACTORY
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1kZXNjcmliZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1kZXNjcmliZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUNMLE1BQU0sRUFDTixVQUFVLEVBR1YsUUFBUSxFQUNSLFFBQVEsR0FDVCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQzs7Ozs7Ozs7QUFPbEcsdUNBTUM7Ozs7OztJQUpDLDJDQUF3Qjs7Ozs7SUFHeEIsMkNBQXVCOzs7Ozs7QUFJekIsTUFBTSxPQUFPLHFCQUFxQixHQUFHLG1DQUFtQzs7Ozs7QUFHeEUsTUFBTSxPQUFPLHlCQUF5QixHQUFHLHlCQUF5Qjs7Ozs7QUFHbEUsTUFBTSxPQUFPLDhCQUE4QixHQUFHLHNCQUFzQjs7Ozs7SUFHaEUsTUFBTSxHQUFHLENBQUM7Ozs7O01BR1IsZUFBZSxHQUFHLElBQUksR0FBRyxFQUF5Qzs7Ozs7SUFHcEUsaUJBQWlCLEdBQXVCLElBQUk7Ozs7OztBQVFoRCxNQUFNLE9BQU8sYUFBYTs7OztJQUd4QixZQUE4QixTQUFjO1FBQzFDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7Ozs7Ozs7OztJQU9ELFFBQVEsQ0FBQyxXQUFvQixFQUFFLE9BQTJCO1FBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUMvQyxPQUFPO1NBQ1I7UUFFRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixnREFBZ0Q7WUFDaEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFP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RUFBQzs7Ozs0Q0FJakIsTUFBTSxTQUFDLFFBQVE7Ozs7Ozs7O0lBRjVCLGtDQUE0Qjs7Ozs7Ozs7QUE0TTlCLE1BQU0sVUFBVSwrQkFBK0IsQ0FBQyxnQkFBK0IsRUFBRSxTQUFjO0lBQzdGLE9BQU8sZ0JBQWdCLElBQUksSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDMUQsQ0FBQzs7Ozs7QUFHRCxNQUFNLE9BQU8sdUJBQXVCLEdBQUc7O0lBRXJDLE9BQU8sRUFBRSxhQUFhO0lBQ3RCLElBQUksRUFBRTtRQUNKLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLGFBQWEsQ0FBQztRQUMvQyxtQkFBQSxRQUFRLEVBQXVCO0tBQ2hDO0lBQ0QsVUFBVSxFQUFFLCtCQUErQjtDQUM1QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgSW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgU2tpcFNlbGYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHthZGRBcmlhUmVmZXJlbmNlZElkLCBnZXRBcmlhUmVmZXJlbmNlSWRzLCByZW1vdmVBcmlhUmVmZXJlbmNlZElkfSBmcm9tICcuL2FyaWEtcmVmZXJlbmNlJztcblxuXG4vKipcbiAqIEludGVyZmFjZSB1c2VkIHRvIHJlZ2lzdGVyIG1lc3NhZ2UgZWxlbWVudHMgYW5kIGtlZXAgYSBjb3VudCBvZiBob3cgbWFueSByZWdpc3RyYXRpb25zIGhhdmVcbiAqIHRoZSBzYW1lIG1lc3NhZ2UgYW5kIHRoZSByZWZlcmVuY2UgdG8gdGhlIG1lc3NhZ2UgZWxlbWVudCB1c2VkIGZvciB0aGUgYGFyaWEtZGVzY3JpYmVkYnlgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlZ2lzdGVyZWRNZXNzYWdlIHtcbiAgLyoqIFRoZSBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIG1lc3NhZ2UuICovXG4gIG1lc3NhZ2VFbGVtZW50OiBFbGVtZW50O1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgcmVmZXJlbmNlIHRoaXMgbWVzc2FnZSBlbGVtZW50IHZpYSBgYXJpYS1kZXNjcmliZWRieWAuICovXG4gIHJlZmVyZW5jZUNvdW50OiBudW1iZXI7XG59XG5cbi8qKiBJRCB1c2VkIGZvciB0aGUgYm9keSBjb250YWluZXIgd2hlcmUgYWxsIG1lc3NhZ2VzIGFyZSBhcHBlbmRlZC4gKi9cbmV4cG9ydCBjb25zdCBNRVNTQUdFU19DT05UQUlORVJfSUQgPSAnY2RrLWRlc2NyaWJlZGJ5LW1lc3NhZ2UtY29udGFpbmVyJztcblxuLyoqIElEIHByZWZpeCB1c2VkIGZvciBlYWNoIGNyZWF0ZWQgbWVzc2FnZSBlbGVtZW50LiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9JRF9QUkVGSVggPSAnY2RrLWRlc2NyaWJlZGJ5LW1lc3NhZ2UnO1xuXG4vKiogQXR0cmlidXRlIGdpdmVuIHRvIGVhY2ggaG9zdCBlbGVtZW50IHRoYXQgaXMgZGVzY3JpYmVkIGJ5IGEgbWVzc2FnZSBlbGVtZW50LiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURSA9ICdjZGstZGVzY3JpYmVkYnktaG9zdCc7XG5cbi8qKiBHbG9iYWwgaW5jcmVtZW50YWwgaWRlbnRpZmllciBmb3IgZWFjaCByZWdpc3RlcmVkIG1lc3NhZ2UgZWxlbWVudC4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKiogR2xvYmFsIG1hcCBvZiBhbGwgcmVnaXN0ZXJlZCBtZXNzYWdlIGVsZW1lbnRzIHRoYXQgaGF2ZSBiZWVuIHBsYWNlZCBpbnRvIHRoZSBkb2N1bWVudC4gKi9cbmNvbnN0IG1lc3NhZ2VSZWdpc3RyeSA9IG5ldyBNYXA8c3RyaW5nfEhUTUxFbGVtZW50LCBSZWdpc3RlcmVkTWVzc2FnZT4oKTtcblxuLyoqIENvbnRhaW5lciBmb3IgYWxsIHJlZ2lzdGVyZWQgbWVzc2FnZXMuICovXG5sZXQgbWVzc2FnZXNDb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogVXRpbGl0eSB0aGF0IGNyZWF0ZXMgdmlzdWFsbHkgaGlkZGVuIGVsZW1lbnRzIHdpdGggYSBtZXNzYWdlIGNvbnRlbnQuIFVzZWZ1bCBmb3IgZWxlbWVudHMgdGhhdFxuICogd2FudCB0byB1c2UgYXJpYS1kZXNjcmliZWRieSB0byBmdXJ0aGVyIGRlc2NyaWJlIHRoZW1zZWx2ZXMgd2l0aG91dCBhZGRpbmcgYWRkaXRpb25hbCB2aXN1YWxcbiAqIGNvbnRlbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEFyaWFEZXNjcmliZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnkpIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRvIHRoZSBob3N0IGVsZW1lbnQgYW4gYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgdG8gYSBoaWRkZW4gZWxlbWVudCB0aGF0IGNvbnRhaW5zXG4gICAqIHRoZSBtZXNzYWdlLiBJZiB0aGUgc2FtZSBtZXNzYWdlIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgdGhlbiBpdCB3aWxsIHJldXNlIHRoZSBjcmVhdGVkXG4gICAqIG1lc3NhZ2UgZWxlbWVudC5cbiAgICovXG4gIGRlc2NyaWJlKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQpIHtcbiAgICBpZiAoIXRoaXMuX2NhbkJlRGVzY3JpYmVkKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGFuIElELlxuICAgICAgdGhpcy5fc2V0TWVzc2FnZUlkKG1lc3NhZ2UpO1xuICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChtZXNzYWdlLCB7bWVzc2FnZUVsZW1lbnQ6IG1lc3NhZ2UsIHJlZmVyZW5jZUNvdW50OiAwfSk7XG4gICAgfSBlbHNlIGlmICghbWVzc2FnZVJlZ2lzdHJ5LmhhcyhtZXNzYWdlKSkge1xuICAgICAgdGhpcy5fY3JlYXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9pc0VsZW1lbnREZXNjcmliZWRCeU1lc3NhZ2UoaG9zdEVsZW1lbnQsIG1lc3NhZ2UpKSB7XG4gICAgICB0aGlzLl9hZGRNZXNzYWdlUmVmZXJlbmNlKGhvc3RFbGVtZW50LCBtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgaG9zdCBlbGVtZW50J3MgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgdG8gdGhlIG1lc3NhZ2UgZWxlbWVudC4gKi9cbiAgcmVtb3ZlRGVzY3JpcHRpb24oaG9zdEVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZ3xIVE1MRWxlbWVudCkge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShob3N0RWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5faXNFbGVtZW50RGVzY3JpYmVkQnlNZXNzYWdlKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgdGhpcy5fcmVtb3ZlTWVzc2FnZVJlZmVyZW5jZShob3N0RWxlbWVudCwgbWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG1lc3NhZ2UgaXMgYSBzdHJpbmcsIGl0IG1lYW5zIHRoYXQgaXQncyBvbmUgdGhhdCB3ZSBjcmVhdGVkIGZvciB0aGVcbiAgICAvLyBjb25zdW1lciBzbyB3ZSBjYW4gcmVtb3ZlIGl0IHNhZmVseSwgb3RoZXJ3aXNlIHdlIHNob3VsZCBsZWF2ZSBpdCBpbiBwbGFjZS5cbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCByZWdpc3RlcmVkTWVzc2FnZSA9IG1lc3NhZ2VSZWdpc3RyeS5nZXQobWVzc2FnZSk7XG4gICAgICBpZiAocmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UucmVmZXJlbmNlQ291bnQgPT09IDApIHtcbiAgICAgICAgdGhpcy5fZGVsZXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyICYmIG1lc3NhZ2VzQ29udGFpbmVyLmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9kZWxldGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBVbnJlZ2lzdGVycyBhbGwgY3JlYXRlZCBtZXNzYWdlIGVsZW1lbnRzIGFuZCByZW1vdmVzIHRoZSBtZXNzYWdlIGNvbnRhaW5lci4gKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgY29uc3QgZGVzY3JpYmVkRWxlbWVudHMgPVxuICAgICAgICB0aGlzLl9kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbJHtDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEV9XWApO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjcmliZWRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5fcmVtb3ZlQ2RrRGVzY3JpYmVkQnlSZWZlcmVuY2VJZHMoZGVzY3JpYmVkRWxlbWVudHNbaV0pO1xuICAgICAgZGVzY3JpYmVkRWxlbWVudHNbaV0ucmVtb3ZlQXR0cmlidXRlKENES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURSk7XG4gICAgfVxuXG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyKSB7XG4gICAgICB0aGlzLl9kZWxldGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIG1lc3NhZ2VSZWdpc3RyeS5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgZWxlbWVudCBpbiB0aGUgdmlzdWFsbHkgaGlkZGVuIG1lc3NhZ2UgY29udGFpbmVyIGVsZW1lbnQgd2l0aCB0aGUgbWVzc2FnZVxuICAgKiBhcyBpdHMgY29udGVudCBhbmQgYWRkcyBpdCB0byB0aGUgbWVzc2FnZSByZWdpc3RyeS5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2U6IHN0cmluZykge1xuICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fc2V0TWVzc2FnZUlkKG1lc3NhZ2VFbGVtZW50KTtcbiAgICBtZXNzYWdlRWxlbWVudC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG5cbiAgICB0aGlzLl9jcmVhdGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIG1lc3NhZ2VzQ29udGFpbmVyIS5hcHBlbmRDaGlsZChtZXNzYWdlRWxlbWVudCk7XG5cbiAgICBtZXNzYWdlUmVnaXN0cnkuc2V0KG1lc3NhZ2UsIHttZXNzYWdlRWxlbWVudCwgcmVmZXJlbmNlQ291bnQ6IDB9KTtcbiAgfVxuXG4gIC8qKiBBc3NpZ25zIGEgdW5pcXVlIElEIHRvIGFuIGVsZW1lbnQsIGlmIGl0IGRvZXNuJ3QgaGF2ZSBvbmUgYWxyZWFkeS4gKi9cbiAgcHJpdmF0ZSBfc2V0TWVzc2FnZUlkKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKCFlbGVtZW50LmlkKSB7XG4gICAgICBlbGVtZW50LmlkID0gYCR7Q0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWH0tJHtuZXh0SWQrK31gO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBEZWxldGVzIHRoZSBtZXNzYWdlIGVsZW1lbnQgZnJvbSB0aGUgZ2xvYmFsIG1lc3NhZ2VzIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZGVsZXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpO1xuICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gcmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UubWVzc2FnZUVsZW1lbnQ7XG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyICYmIG1lc3NhZ2VFbGVtZW50KSB7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5yZW1vdmVDaGlsZChtZXNzYWdlRWxlbWVudCk7XG4gICAgfVxuICAgIG1lc3NhZ2VSZWdpc3RyeS5kZWxldGUobWVzc2FnZSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgZ2xvYmFsIGNvbnRhaW5lciBmb3IgYWxsIGFyaWEtZGVzY3JpYmVkYnkgbWVzc2FnZXMuICovXG4gIHByaXZhdGUgX2NyZWF0ZU1lc3NhZ2VzQ29udGFpbmVyKCkge1xuICAgIGlmICghbWVzc2FnZXNDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IHByZUV4aXN0aW5nQ29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoTUVTU0FHRVNfQ09OVEFJTkVSX0lEKTtcblxuICAgICAgLy8gV2hlbiBnb2luZyBmcm9tIHRoZSBzZXJ2ZXIgdG8gdGhlIGNsaWVudCwgd2UgbWF5IGVuZCB1cCBpbiBhIHNpdHVhdGlvbiB3aGVyZSB0aGVyZSdzXG4gICAgICAvLyBhbHJlYWR5IGEgY29udGFpbmVyIG9uIHRoZSBwYWdlLCBidXQgd2UgZG9uJ3QgaGF2ZSBhIHJlZmVyZW5jZSB0byBpdC4gQ2xlYXIgdGhlXG4gICAgICAvLyBvbGQgY29udGFpbmVyIHNvIHdlIGRvbid0IGdldCBkdXBsaWNhdGVzLiBEb2luZyB0aGlzLCBpbnN0ZWFkIG9mIGVtcHR5aW5nIHRoZSBwcmV2aW91c1xuICAgICAgLy8gY29udGFpbmVyLCBzaG91bGQgYmUgc2xpZ2h0bHkgZmFzdGVyLlxuICAgICAgaWYgKHByZUV4aXN0aW5nQ29udGFpbmVyKSB7XG4gICAgICAgIHByZUV4aXN0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHByZUV4aXN0aW5nQ29udGFpbmVyKTtcbiAgICAgIH1cblxuICAgICAgbWVzc2FnZXNDb250YWluZXIgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyLmlkID0gTUVTU0FHRVNfQ09OVEFJTkVSX0lEO1xuICAgICAgbWVzc2FnZXNDb250YWluZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZXNzYWdlc0NvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIERlbGV0ZXMgdGhlIGdsb2JhbCBtZXNzYWdlcyBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RlbGV0ZU1lc3NhZ2VzQ29udGFpbmVyKCkge1xuICAgIGlmIChtZXNzYWdlc0NvbnRhaW5lciAmJiBtZXNzYWdlc0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG1lc3NhZ2VzQ29udGFpbmVyKTtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbGwgY2RrLWRlc2NyaWJlZGJ5IG1lc3NhZ2VzIHRoYXQgYXJlIGhvc3RlZCB0aHJvdWdoIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9yZW1vdmVDZGtEZXNjcmliZWRCeVJlZmVyZW5jZUlkcyhlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgLy8gUmVtb3ZlIGFsbCBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSBJRHMgdGhhdCBhcmUgcHJlZml4ZWQgYnkgQ0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWFxuICAgIGNvbnN0IG9yaWdpbmFsUmVmZXJlbmNlSWRzID0gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScpXG4gICAgICAgIC5maWx0ZXIoaWQgPT4gaWQuaW5kZXhPZihDREtfREVTQ1JJQkVEQllfSURfUFJFRklYKSAhPSAwKTtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScsIG9yaWdpbmFsUmVmZXJlbmNlSWRzLmpvaW4oJyAnKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG1lc3NhZ2UgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnkgYW5kIGluY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWRcbiAgICogbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX2FkZE1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpITtcblxuICAgIC8vIEFkZCB0aGUgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgYW5kIHNldCB0aGVcbiAgICAvLyBkZXNjcmliZWRieV9ob3N0IGF0dHJpYnV0ZSB0byBtYXJrIHRoZSBlbGVtZW50LlxuICAgIGFkZEFyaWFSZWZlcmVuY2VkSWQoZWxlbWVudCwgJ2FyaWEtZGVzY3JpYmVkYnknLCByZWdpc3RlcmVkTWVzc2FnZS5tZXNzYWdlRWxlbWVudC5pZCk7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFLCAnJyk7XG5cbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBtZXNzYWdlIHJlZmVyZW5jZSBmcm9tIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnlcbiAgICogYW5kIGRlY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWQgbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX3JlbW92ZU1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpITtcbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudC0tO1xuXG4gICAgcmVtb3ZlQXJpYVJlZmVyZW5jZWRJZChlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkKTtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBoYXMgYmVlbiBkZXNjcmliZWQgYnkgdGhlIHByb3ZpZGVkIG1lc3NhZ2UgSUQuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWZlcmVuY2VJZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsZW1lbnQsICdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpO1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHJlZ2lzdGVyZWRNZXNzYWdlICYmIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkO1xuXG4gICAgcmV0dXJuICEhbWVzc2FnZUlkICYmIHJlZmVyZW5jZUlkcy5pbmRleE9mKG1lc3NhZ2VJZCkgIT0gLTE7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbWVzc2FnZSBjYW4gYmUgZGVzY3JpYmVkIG9uIGEgcGFydGljdWxhciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jYW5CZURlc2NyaWJlZChlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnR8dm9pZCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlICYmIHR5cGVvZiBtZXNzYWdlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2UnZCBoYXZlIHRvIG1ha2Ugc29tZSBhc3N1bXB0aW9ucyBhYm91dCB0aGUgZGVzY3JpcHRpb24gZWxlbWVudCdzIHRleHQsIGlmIHRoZSBjb25zdW1lclxuICAgICAgLy8gcGFzc2VkIGluIGFuIGVsZW1lbnQuIEFzc3VtZSB0aGF0IGlmIGFuIGVsZW1lbnQgaXMgcGFzc2VkIGluLCB0aGUgY29uc3VtZXIgaGFzIHZlcmlmaWVkXG4gICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGEgZGVzY3JpcHRpb24uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkTWVzc2FnZSA9IG1lc3NhZ2UgPT0gbnVsbCA/ICcnIDogYCR7bWVzc2FnZX1gLnRyaW0oKTtcbiAgICBjb25zdCBhcmlhTGFiZWwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpO1xuXG4gICAgLy8gV2Ugc2hvdWxkbid0IHNldCBkZXNjcmlwdGlvbnMgaWYgdGhleSdyZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBgYXJpYS1sYWJlbGAgb2YgdGhlXG4gICAgLy8gZWxlbWVudCwgYmVjYXVzZSBzY3JlZW4gcmVhZGVycyB3aWxsIGVuZCB1cCByZWFkaW5nIG91dCB0aGUgc2FtZSB0ZXh0IHR3aWNlIGluIGEgcm93LlxuICAgIHJldHVybiB0cmltbWVkTWVzc2FnZSA/ICghYXJpYUxhYmVsIHx8IGFyaWFMYWJlbC50cmltKCkgIT09IHRyaW1tZWRNZXNzYWdlKSA6IGZhbHNlO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyBhbiBFbGVtZW50IG5vZGUuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudE5vZGUoZWxlbWVudDogTm9kZSk6IGVsZW1lbnQgaXMgRWxlbWVudCB7XG4gICAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgPT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERTtcbiAgfVxufVxuXG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBmdW5jdGlvbiBBUklBX0RFU0NSSUJFUl9QUk9WSURFUl9GQUNUT1JZKHBhcmVudERpc3BhdGNoZXI6IEFyaWFEZXNjcmliZXIsIF9kb2N1bWVudDogYW55KSB7XG4gIHJldHVybiBwYXJlbnREaXNwYXRjaGVyIHx8IG5ldyBBcmlhRGVzY3JpYmVyKF9kb2N1bWVudCk7XG59XG5cbi8qKiBAZG9jcy1wcml2YXRlIEBkZXByZWNhdGVkIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgKi9cbmV4cG9ydCBjb25zdCBBUklBX0RFU0NSSUJFUl9QUk9WSURFUiA9IHtcbiAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhbiBBcmlhRGVzY3JpYmVyIGF2YWlsYWJsZSwgdXNlIHRoYXQuIE90aGVyd2lzZSwgcHJvdmlkZSBhIG5ldyBvbmUuXG4gIHByb3ZpZGU6IEFyaWFEZXNjcmliZXIsXG4gIGRlcHM6IFtcbiAgICBbbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpLCBBcmlhRGVzY3JpYmVyXSxcbiAgICBET0NVTUVOVCBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+XG4gIF0sXG4gIHVzZUZhY3Rvcnk6IEFSSUFfREVTQ1JJQkVSX1BST1ZJREVSX0ZBQ1RPUllcbn07XG4iXX0=