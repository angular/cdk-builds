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
import { Platform } from '@angular/cdk/platform';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/platform";
/** ID used for the body container where all messages are appended. */
export const MESSAGES_CONTAINER_ID = 'cdk-describedby-message-container';
/** ID prefix used for each created message element. */
export const CDK_DESCRIBEDBY_ID_PREFIX = 'cdk-describedby-message';
/** Attribute given to each host element that is described by a message element. */
export const CDK_DESCRIBEDBY_HOST_ATTRIBUTE = 'cdk-describedby-host';
/** Global incremental identifier for each registered message element. */
let nextId = 0;
/** Global map of all registered message elements that have been placed into the document. */
const messageRegistry = new Map();
/** Container for all registered messages. */
let messagesContainer = null;
/**
 * Utility that creates visually hidden elements with a message content. Useful for elements that
 * want to use aria-describedby to further describe themselves without adding additional visual
 * content.
 */
export class AriaDescriber {
    constructor(_document, 
    /**
     * @breaking-change 8.0.0 `_platform` parameter to be made required.
     */
    _platform) {
        this._platform = _platform;
        this._document = _document;
    }
    /**
     * Adds to the host element an aria-describedby reference to a hidden element that contains
     * the message. If the same message has already been registered, then it will reuse the created
     * message element.
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
    /** Removes the host element's aria-describedby reference to the message element. */
    removeDescription(hostElement, message) {
        if (!message || !this._isElementNode(hostElement)) {
            return;
        }
        if (this._isElementDescribedByMessage(hostElement, message)) {
            this._removeMessageReference(hostElement, message);
        }
        // If the message is a string, it means that it's one that we created for the
        // consumer so we can remove it safely, otherwise we should leave it in place.
        if (typeof message === 'string') {
            const registeredMessage = messageRegistry.get(message);
            if (registeredMessage && registeredMessage.referenceCount === 0) {
                this._deleteMessageElement(message);
            }
        }
        if (messagesContainer && messagesContainer.childNodes.length === 0) {
            this._deleteMessagesContainer();
        }
    }
    /** Unregisters all created message elements and removes the message container. */
    ngOnDestroy() {
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
     */
    _createMessageElement(message) {
        const messageElement = this._document.createElement('div');
        this._setMessageId(messageElement);
        messageElement.textContent = message;
        this._createMessagesContainer();
        messagesContainer.appendChild(messageElement);
        messageRegistry.set(message, { messageElement, referenceCount: 0 });
    }
    /** Assigns a unique ID to an element, if it doesn't have one already. */
    _setMessageId(element) {
        if (!element.id) {
            element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${nextId++}`;
        }
    }
    /** Deletes the message element from the global messages container. */
    _deleteMessageElement(message) {
        const registeredMessage = messageRegistry.get(message);
        const messageElement = registeredMessage && registeredMessage.messageElement;
        if (messagesContainer && messageElement) {
            messagesContainer.removeChild(messageElement);
        }
        messageRegistry.delete(message);
    }
    /** Creates the global container for all aria-describedby messages. */
    _createMessagesContainer() {
        if (!messagesContainer) {
            // @breaking-change 8.0.0 `_platform` null check can be removed once the parameter is required
            const canBeAriaHidden = !this._platform || (!this._platform.EDGE && !this._platform.TRIDENT);
            const preExistingContainer = this._document.getElementById(MESSAGES_CONTAINER_ID);
            // When going from the server to the client, we may end up in a situation where there's
            // already a container on the page, but we don't have a reference to it. Clear the
            // old container so we don't get duplicates. Doing this, instead of emptying the previous
            // container, should be slightly faster.
            if (preExistingContainer) {
                preExistingContainer.parentNode.removeChild(preExistingContainer);
            }
            messagesContainer = this._document.createElement('div');
            messagesContainer.id = MESSAGES_CONTAINER_ID;
            messagesContainer.classList.add('cdk-visually-hidden');
            // IE and Edge won't read out the messages if they're in an `aria-hidden` container.
            // We only disable `aria-hidden` for these platforms, because it comes with the
            // disadvantage that people might hit the messages when they've navigated past
            // the end of the document using the arrow keys.
            messagesContainer.setAttribute('aria-hidden', canBeAriaHidden + '');
            this._document.body.appendChild(messagesContainer);
        }
    }
    /** Deletes the global messages container. */
    _deleteMessagesContainer() {
        if (messagesContainer && messagesContainer.parentNode) {
            messagesContainer.parentNode.removeChild(messagesContainer);
            messagesContainer = null;
        }
    }
    /** Removes all cdk-describedby messages that are hosted through the element. */
    _removeCdkDescribedByReferenceIds(element) {
        // Remove all aria-describedby reference IDs that are prefixed by CDK_DESCRIBEDBY_ID_PREFIX
        const originalReferenceIds = getAriaReferenceIds(element, 'aria-describedby')
            .filter(id => id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0);
        element.setAttribute('aria-describedby', originalReferenceIds.join(' '));
    }
    /**
     * Adds a message reference to the element using aria-describedby and increments the registered
     * message's reference count.
     */
    _addMessageReference(element, message) {
        const registeredMessage = messageRegistry.get(message);
        // Add the aria-describedby reference and set the
        // describedby_host attribute to mark the element.
        addAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, '');
        registeredMessage.referenceCount++;
    }
    /**
     * Removes a message reference from the element using aria-describedby
     * and decrements the registered message's reference count.
     */
    _removeMessageReference(element, message) {
        const registeredMessage = messageRegistry.get(message);
        registeredMessage.referenceCount--;
        removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }
    /** Returns true if the element has been described by the provided message ID. */
    _isElementDescribedByMessage(element, message) {
        const referenceIds = getAriaReferenceIds(element, 'aria-describedby');
        const registeredMessage = messageRegistry.get(message);
        const messageId = registeredMessage && registeredMessage.messageElement.id;
        return !!messageId && referenceIds.indexOf(messageId) != -1;
    }
    /** Determines whether a message can be described on a particular element. */
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
        const trimmedMessage = message == null ? '' : `${message}`.trim();
        const ariaLabel = element.getAttribute('aria-label');
        // We shouldn't set descriptions if they're exactly the same as the `aria-label` of the
        // element, because screen readers will end up reading out the same text twice in a row.
        return trimmedMessage ? (!ariaLabel || ariaLabel.trim() !== trimmedMessage) : false;
    }
    /** Checks whether a node is an Element node. */
    _isElementNode(element) {
        return element.nodeType === this._document.ELEMENT_NODE;
    }
}
AriaDescriber.ɵprov = i0.ɵɵdefineInjectable({ factory: function AriaDescriber_Factory() { return new AriaDescriber(i0.ɵɵinject(i1.DOCUMENT), i0.ɵɵinject(i2.Platform)); }, token: AriaDescriber, providedIn: "root" });
AriaDescriber.decorators = [
    { type: Injectable, args: [{ providedIn: 'root' },] }
];
AriaDescriber.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: Platform }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1kZXNjcmliZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1kZXNjcmliZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xHLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7OztBQWUvQyxzRUFBc0U7QUFDdEUsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQUcsbUNBQW1DLENBQUM7QUFFekUsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxNQUFNLHlCQUF5QixHQUFHLHlCQUF5QixDQUFDO0FBRW5FLG1GQUFtRjtBQUNuRixNQUFNLENBQUMsTUFBTSw4QkFBOEIsR0FBRyxzQkFBc0IsQ0FBQztBQUVyRSx5RUFBeUU7QUFDekUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBRWYsNkZBQTZGO0FBQzdGLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUF5QyxDQUFDO0FBRXpFLDZDQUE2QztBQUM3QyxJQUFJLGlCQUFpQixHQUF1QixJQUFJLENBQUM7QUFFakQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxhQUFhO0lBR3hCLFlBQ29CLFNBQWM7SUFDaEM7O09BRUc7SUFDSyxTQUFvQjtRQUFwQixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsUUFBUSxDQUFDLFdBQW9CLEVBQUUsT0FBMkI7UUFDeEQs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QUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMxQywyRkFBMkY7WUFDM0YsMEZBQTBGO1lBQzFGLHdDQUF3QztZQUN4QyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxjQUFjLEdBQUcsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFckQsdUZBQXVGO1FBQ3ZGLHdGQUF3RjtRQUN4RixPQUFPLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUN0RixDQUFDO0lBRUQsZ0RBQWdEO0lBQ3hDLGNBQWMsQ0FBQyxPQUFhO1FBQ2xDLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztJQUMxRCxDQUFDOzs7O1lBck5GLFVBQVUsU0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7Ozs0Q0FLM0IsTUFBTSxTQUFDLFFBQVE7WUEzQ1osUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIE9uRGVzdHJveX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge2FkZEFyaWFSZWZlcmVuY2VkSWQsIGdldEFyaWFSZWZlcmVuY2VJZHMsIHJlbW92ZUFyaWFSZWZlcmVuY2VkSWR9IGZyb20gJy4vYXJpYS1yZWZlcmVuY2UnO1xuaW1wb3J0IHtQbGF0Zm9ybX0gZnJvbSAnQGFuZ3VsYXIvY2RrL3BsYXRmb3JtJztcblxuXG4vKipcbiAqIEludGVyZmFjZSB1c2VkIHRvIHJlZ2lzdGVyIG1lc3NhZ2UgZWxlbWVudHMgYW5kIGtlZXAgYSBjb3VudCBvZiBob3cgbWFueSByZWdpc3RyYXRpb25zIGhhdmVcbiAqIHRoZSBzYW1lIG1lc3NhZ2UgYW5kIHRoZSByZWZlcmVuY2UgdG8gdGhlIG1lc3NhZ2UgZWxlbWVudCB1c2VkIGZvciB0aGUgYGFyaWEtZGVzY3JpYmVkYnlgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlZ2lzdGVyZWRNZXNzYWdlIHtcbiAgLyoqIFRoZSBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIG1lc3NhZ2UuICovXG4gIG1lc3NhZ2VFbGVtZW50OiBFbGVtZW50O1xuXG4gIC8qKiBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgcmVmZXJlbmNlIHRoaXMgbWVzc2FnZSBlbGVtZW50IHZpYSBgYXJpYS1kZXNjcmliZWRieWAuICovXG4gIHJlZmVyZW5jZUNvdW50OiBudW1iZXI7XG59XG5cbi8qKiBJRCB1c2VkIGZvciB0aGUgYm9keSBjb250YWluZXIgd2hlcmUgYWxsIG1lc3NhZ2VzIGFyZSBhcHBlbmRlZC4gKi9cbmV4cG9ydCBjb25zdCBNRVNTQUdFU19DT05UQUlORVJfSUQgPSAnY2RrLWRlc2NyaWJlZGJ5LW1lc3NhZ2UtY29udGFpbmVyJztcblxuLyoqIElEIHByZWZpeCB1c2VkIGZvciBlYWNoIGNyZWF0ZWQgbWVzc2FnZSBlbGVtZW50LiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9JRF9QUkVGSVggPSAnY2RrLWRlc2NyaWJlZGJ5LW1lc3NhZ2UnO1xuXG4vKiogQXR0cmlidXRlIGdpdmVuIHRvIGVhY2ggaG9zdCBlbGVtZW50IHRoYXQgaXMgZGVzY3JpYmVkIGJ5IGEgbWVzc2FnZSBlbGVtZW50LiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURSA9ICdjZGstZGVzY3JpYmVkYnktaG9zdCc7XG5cbi8qKiBHbG9iYWwgaW5jcmVtZW50YWwgaWRlbnRpZmllciBmb3IgZWFjaCByZWdpc3RlcmVkIG1lc3NhZ2UgZWxlbWVudC4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKiogR2xvYmFsIG1hcCBvZiBhbGwgcmVnaXN0ZXJlZCBtZXNzYWdlIGVsZW1lbnRzIHRoYXQgaGF2ZSBiZWVuIHBsYWNlZCBpbnRvIHRoZSBkb2N1bWVudC4gKi9cbmNvbnN0IG1lc3NhZ2VSZWdpc3RyeSA9IG5ldyBNYXA8c3RyaW5nfEhUTUxFbGVtZW50LCBSZWdpc3RlcmVkTWVzc2FnZT4oKTtcblxuLyoqIENvbnRhaW5lciBmb3IgYWxsIHJlZ2lzdGVyZWQgbWVzc2FnZXMuICovXG5sZXQgbWVzc2FnZXNDb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogVXRpbGl0eSB0aGF0IGNyZWF0ZXMgdmlzdWFsbHkgaGlkZGVuIGVsZW1lbnRzIHdpdGggYSBtZXNzYWdlIGNvbnRlbnQuIFVzZWZ1bCBmb3IgZWxlbWVudHMgdGhhdFxuICogd2FudCB0byB1c2UgYXJpYS1kZXNjcmliZWRieSB0byBmdXJ0aGVyIGRlc2NyaWJlIHRoZW1zZWx2ZXMgd2l0aG91dCBhZGRpbmcgYWRkaXRpb25hbCB2aXN1YWxcbiAqIGNvbnRlbnQuXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEFyaWFEZXNjcmliZXIgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIF9kb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgLyoqXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBgX3BsYXRmb3JtYCBwYXJhbWV0ZXIgdG8gYmUgbWFkZSByZXF1aXJlZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIF9wbGF0Zm9ybT86IFBsYXRmb3JtKSB7XG4gICAgdGhpcy5fZG9jdW1lbnQgPSBfZG9jdW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0byB0aGUgaG9zdCBlbGVtZW50IGFuIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIHRvIGEgaGlkZGVuIGVsZW1lbnQgdGhhdCBjb250YWluc1xuICAgKiB0aGUgbWVzc2FnZS4gSWYgdGhlIHNhbWUgbWVzc2FnZSBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQsIHRoZW4gaXQgd2lsbCByZXVzZSB0aGUgY3JlYXRlZFxuICAgKiBtZXNzYWdlIGVsZW1lbnQuXG4gICAqL1xuICBkZXNjcmliZShob3N0RWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKCF0aGlzLl9jYW5CZURlc2NyaWJlZChob3N0RWxlbWVudCwgbWVzc2FnZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGhhcyBhbiBJRC5cbiAgICAgIHRoaXMuX3NldE1lc3NhZ2VJZChtZXNzYWdlKTtcbiAgICAgIG1lc3NhZ2VSZWdpc3RyeS5zZXQobWVzc2FnZSwge21lc3NhZ2VFbGVtZW50OiBtZXNzYWdlLCByZWZlcmVuY2VDb3VudDogMH0pO1xuICAgIH0gZWxzZSBpZiAoIW1lc3NhZ2VSZWdpc3RyeS5oYXMobWVzc2FnZSkpIHtcbiAgICAgIHRoaXMuX2NyZWF0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faXNFbGVtZW50RGVzY3JpYmVkQnlNZXNzYWdlKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgdGhpcy5fYWRkTWVzc2FnZVJlZmVyZW5jZShob3N0RWxlbWVudCwgbWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGhvc3QgZWxlbWVudCdzIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIHRvIHRoZSBtZXNzYWdlIGVsZW1lbnQuICovXG4gIHJlbW92ZURlc2NyaXB0aW9uKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQpIHtcbiAgICBpZiAoIW1lc3NhZ2UgfHwgIXRoaXMuX2lzRWxlbWVudE5vZGUoaG9zdEVsZW1lbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShob3N0RWxlbWVudCwgbWVzc2FnZSkpIHtcbiAgICAgIHRoaXMuX3JlbW92ZU1lc3NhZ2VSZWZlcmVuY2UoaG9zdEVsZW1lbnQsIG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBtZXNzYWdlIGlzIGEgc3RyaW5nLCBpdCBtZWFucyB0aGF0IGl0J3Mgb25lIHRoYXQgd2UgY3JlYXRlZCBmb3IgdGhlXG4gICAgLy8gY29uc3VtZXIgc28gd2UgY2FuIHJlbW92ZSBpdCBzYWZlbHksIG90aGVyd2lzZSB3ZSBzaG91bGQgbGVhdmUgaXQgaW4gcGxhY2UuXG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpO1xuICAgICAgaWYgKHJlZ2lzdGVyZWRNZXNzYWdlICYmIHJlZ2lzdGVyZWRNZXNzYWdlLnJlZmVyZW5jZUNvdW50ID09PSAwKSB7XG4gICAgICAgIHRoaXMuX2RlbGV0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtZXNzYWdlc0NvbnRhaW5lciAmJiBtZXNzYWdlc0NvbnRhaW5lci5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5fZGVsZXRlTWVzc2FnZXNDb250YWluZXIoKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5yZWdpc3RlcnMgYWxsIGNyZWF0ZWQgbWVzc2FnZSBlbGVtZW50cyBhbmQgcmVtb3ZlcyB0aGUgbWVzc2FnZSBjb250YWluZXIuICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNvbnN0IGRlc2NyaWJlZEVsZW1lbnRzID1cbiAgICAgICAgdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgWyR7Q0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFfV1gKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzY3JpYmVkRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX3JlbW92ZUNka0Rlc2NyaWJlZEJ5UmVmZXJlbmNlSWRzKGRlc2NyaWJlZEVsZW1lbnRzW2ldKTtcbiAgICAgIGRlc2NyaWJlZEVsZW1lbnRzW2ldLnJlbW92ZUF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUpO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlc0NvbnRhaW5lcikge1xuICAgICAgdGhpcy5fZGVsZXRlTWVzc2FnZXNDb250YWluZXIoKTtcbiAgICB9XG5cbiAgICBtZXNzYWdlUmVnaXN0cnkuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGVsZW1lbnQgaW4gdGhlIHZpc3VhbGx5IGhpZGRlbiBtZXNzYWdlIGNvbnRhaW5lciBlbGVtZW50IHdpdGggdGhlIG1lc3NhZ2VcbiAgICogYXMgaXRzIGNvbnRlbnQgYW5kIGFkZHMgaXQgdG8gdGhlIG1lc3NhZ2UgcmVnaXN0cnkuXG4gICAqL1xuICBwcml2YXRlIF9jcmVhdGVNZXNzYWdlRWxlbWVudChtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBtZXNzYWdlRWxlbWVudCA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX3NldE1lc3NhZ2VJZChtZXNzYWdlRWxlbWVudCk7XG4gICAgbWVzc2FnZUVsZW1lbnQudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuXG4gICAgdGhpcy5fY3JlYXRlTWVzc2FnZXNDb250YWluZXIoKTtcbiAgICBtZXNzYWdlc0NvbnRhaW5lciEuYXBwZW5kQ2hpbGQobWVzc2FnZUVsZW1lbnQpO1xuXG4gICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChtZXNzYWdlLCB7bWVzc2FnZUVsZW1lbnQsIHJlZmVyZW5jZUNvdW50OiAwfSk7XG4gIH1cblxuICAvKiogQXNzaWducyBhIHVuaXF1ZSBJRCB0byBhbiBlbGVtZW50LCBpZiBpdCBkb2Vzbid0IGhhdmUgb25lIGFscmVhZHkuICovXG4gIHByaXZhdGUgX3NldE1lc3NhZ2VJZChlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICAgIGlmICghZWxlbWVudC5pZCkge1xuICAgICAgZWxlbWVudC5pZCA9IGAke0NES19ERVNDUklCRURCWV9JRF9QUkVGSVh9LSR7bmV4dElkKyt9YDtcbiAgICB9XG4gIH1cblxuICAvKiogRGVsZXRlcyB0aGUgbWVzc2FnZSBlbGVtZW50IGZyb20gdGhlIGdsb2JhbCBtZXNzYWdlcyBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RlbGV0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2U6IHN0cmluZykge1xuICAgIGNvbnN0IHJlZ2lzdGVyZWRNZXNzYWdlID0gbWVzc2FnZVJlZ2lzdHJ5LmdldChtZXNzYWdlKTtcbiAgICBjb25zdCBtZXNzYWdlRWxlbWVudCA9IHJlZ2lzdGVyZWRNZXNzYWdlICYmIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50O1xuICAgIGlmIChtZXNzYWdlc0NvbnRhaW5lciAmJiBtZXNzYWdlRWxlbWVudCkge1xuICAgICAgbWVzc2FnZXNDb250YWluZXIucmVtb3ZlQ2hpbGQobWVzc2FnZUVsZW1lbnQpO1xuICAgIH1cbiAgICBtZXNzYWdlUmVnaXN0cnkuZGVsZXRlKG1lc3NhZ2UpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgdGhlIGdsb2JhbCBjb250YWluZXIgZm9yIGFsbCBhcmlhLWRlc2NyaWJlZGJ5IG1lc3NhZ2VzLiAqL1xuICBwcml2YXRlIF9jcmVhdGVNZXNzYWdlc0NvbnRhaW5lcigpIHtcbiAgICBpZiAoIW1lc3NhZ2VzQ29udGFpbmVyKSB7XG4gICAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDguMC4wIGBfcGxhdGZvcm1gIG51bGwgY2hlY2sgY2FuIGJlIHJlbW92ZWQgb25jZSB0aGUgcGFyYW1ldGVyIGlzIHJlcXVpcmVkXG4gICAgICBjb25zdCBjYW5CZUFyaWFIaWRkZW4gPSAhdGhpcy5fcGxhdGZvcm0gfHwgKCF0aGlzLl9wbGF0Zm9ybS5FREdFICYmICF0aGlzLl9wbGF0Zm9ybS5UUklERU5UKTtcbiAgICAgIGNvbnN0IHByZUV4aXN0aW5nQ29udGFpbmVyID0gdGhpcy5fZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoTUVTU0FHRVNfQ09OVEFJTkVSX0lEKTtcblxuICAgICAgLy8gV2hlbiBnb2luZyBmcm9tIHRoZSBzZXJ2ZXIgdG8gdGhlIGNsaWVudCwgd2UgbWF5IGVuZCB1cCBpbiBhIHNpdHVhdGlvbiB3aGVyZSB0aGVyZSdzXG4gICAgICAvLyBhbHJlYWR5IGEgY29udGFpbmVyIG9uIHRoZSBwYWdlLCBidXQgd2UgZG9uJ3QgaGF2ZSBhIHJlZmVyZW5jZSB0byBpdC4gQ2xlYXIgdGhlXG4gICAgICAvLyBvbGQgY29udGFpbmVyIHNvIHdlIGRvbid0IGdldCBkdXBsaWNhdGVzLiBEb2luZyB0aGlzLCBpbnN0ZWFkIG9mIGVtcHR5aW5nIHRoZSBwcmV2aW91c1xuICAgICAgLy8gY29udGFpbmVyLCBzaG91bGQgYmUgc2xpZ2h0bHkgZmFzdGVyLlxuICAgICAgaWYgKHByZUV4aXN0aW5nQ29udGFpbmVyKSB7XG4gICAgICAgIHByZUV4aXN0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKHByZUV4aXN0aW5nQ29udGFpbmVyKTtcbiAgICAgIH1cblxuICAgICAgbWVzc2FnZXNDb250YWluZXIgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyLmlkID0gTUVTU0FHRVNfQ09OVEFJTkVSX0lEO1xuICAgICAgbWVzc2FnZXNDb250YWluZXIuY2xhc3NMaXN0LmFkZCgnY2RrLXZpc3VhbGx5LWhpZGRlbicpO1xuXG4gICAgICAvLyBJRSBhbmQgRWRnZSB3b24ndCByZWFkIG91dCB0aGUgbWVzc2FnZXMgaWYgdGhleSdyZSBpbiBhbiBgYXJpYS1oaWRkZW5gIGNvbnRhaW5lci5cbiAgICAgIC8vIFdlIG9ubHkgZGlzYWJsZSBgYXJpYS1oaWRkZW5gIGZvciB0aGVzZSBwbGF0Zm9ybXMsIGJlY2F1c2UgaXQgY29tZXMgd2l0aCB0aGVcbiAgICAgIC8vIGRpc2FkdmFudGFnZSB0aGF0IHBlb3BsZSBtaWdodCBoaXQgdGhlIG1lc3NhZ2VzIHdoZW4gdGhleSd2ZSBuYXZpZ2F0ZWQgcGFzdFxuICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgZG9jdW1lbnQgdXNpbmcgdGhlIGFycm93IGtleXMuXG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgY2FuQmVBcmlhSGlkZGVuICsgJycpO1xuICAgICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZXNzYWdlc0NvbnRhaW5lcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIERlbGV0ZXMgdGhlIGdsb2JhbCBtZXNzYWdlcyBjb250YWluZXIuICovXG4gIHByaXZhdGUgX2RlbGV0ZU1lc3NhZ2VzQ29udGFpbmVyKCkge1xuICAgIGlmIChtZXNzYWdlc0NvbnRhaW5lciAmJiBtZXNzYWdlc0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG1lc3NhZ2VzQ29udGFpbmVyKTtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbGwgY2RrLWRlc2NyaWJlZGJ5IG1lc3NhZ2VzIHRoYXQgYXJlIGhvc3RlZCB0aHJvdWdoIHRoZSBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9yZW1vdmVDZGtEZXNjcmliZWRCeVJlZmVyZW5jZUlkcyhlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgLy8gUmVtb3ZlIGFsbCBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSBJRHMgdGhhdCBhcmUgcHJlZml4ZWQgYnkgQ0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWFxuICAgIGNvbnN0IG9yaWdpbmFsUmVmZXJlbmNlSWRzID0gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScpXG4gICAgICAgIC5maWx0ZXIoaWQgPT4gaWQuaW5kZXhPZihDREtfREVTQ1JJQkVEQllfSURfUFJFRklYKSAhPSAwKTtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScsIG9yaWdpbmFsUmVmZXJlbmNlSWRzLmpvaW4oJyAnKSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG1lc3NhZ2UgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnkgYW5kIGluY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWRcbiAgICogbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX2FkZE1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpITtcblxuICAgIC8vIEFkZCB0aGUgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgYW5kIHNldCB0aGVcbiAgICAvLyBkZXNjcmliZWRieV9ob3N0IGF0dHJpYnV0ZSB0byBtYXJrIHRoZSBlbGVtZW50LlxuICAgIGFkZEFyaWFSZWZlcmVuY2VkSWQoZWxlbWVudCwgJ2FyaWEtZGVzY3JpYmVkYnknLCByZWdpc3RlcmVkTWVzc2FnZS5tZXNzYWdlRWxlbWVudC5pZCk7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFLCAnJyk7XG5cbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBtZXNzYWdlIHJlZmVyZW5jZSBmcm9tIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnlcbiAgICogYW5kIGRlY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWQgbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX3JlbW92ZU1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nfEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpITtcbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudC0tO1xuXG4gICAgcmVtb3ZlQXJpYVJlZmVyZW5jZWRJZChlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkKTtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBoYXMgYmVlbiBkZXNjcmliZWQgYnkgdGhlIHByb3ZpZGVkIG1lc3NhZ2UgSUQuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWZlcmVuY2VJZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsZW1lbnQsICdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KG1lc3NhZ2UpO1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHJlZ2lzdGVyZWRNZXNzYWdlICYmIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkO1xuXG4gICAgcmV0dXJuICEhbWVzc2FnZUlkICYmIHJlZmVyZW5jZUlkcy5pbmRleE9mKG1lc3NhZ2VJZCkgIT0gLTE7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbWVzc2FnZSBjYW4gYmUgZGVzY3JpYmVkIG9uIGEgcGFydGljdWxhciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jYW5CZURlc2NyaWJlZChlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnR8dm9pZCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlICYmIHR5cGVvZiBtZXNzYWdlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2UnZCBoYXZlIHRvIG1ha2Ugc29tZSBhc3N1bXB0aW9ucyBhYm91dCB0aGUgZGVzY3JpcHRpb24gZWxlbWVudCdzIHRleHQsIGlmIHRoZSBjb25zdW1lclxuICAgICAgLy8gcGFzc2VkIGluIGFuIGVsZW1lbnQuIEFzc3VtZSB0aGF0IGlmIGFuIGVsZW1lbnQgaXMgcGFzc2VkIGluLCB0aGUgY29uc3VtZXIgaGFzIHZlcmlmaWVkXG4gICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGEgZGVzY3JpcHRpb24uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkTWVzc2FnZSA9IG1lc3NhZ2UgPT0gbnVsbCA/ICcnIDogYCR7bWVzc2FnZX1gLnRyaW0oKTtcbiAgICBjb25zdCBhcmlhTGFiZWwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpO1xuXG4gICAgLy8gV2Ugc2hvdWxkbid0IHNldCBkZXNjcmlwdGlvbnMgaWYgdGhleSdyZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBgYXJpYS1sYWJlbGAgb2YgdGhlXG4gICAgLy8gZWxlbWVudCwgYmVjYXVzZSBzY3JlZW4gcmVhZGVycyB3aWxsIGVuZCB1cCByZWFkaW5nIG91dCB0aGUgc2FtZSB0ZXh0IHR3aWNlIGluIGEgcm93LlxuICAgIHJldHVybiB0cmltbWVkTWVzc2FnZSA/ICghYXJpYUxhYmVsIHx8IGFyaWFMYWJlbC50cmltKCkgIT09IHRyaW1tZWRNZXNzYWdlKSA6IGZhbHNlO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyBhbiBFbGVtZW50IG5vZGUuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudE5vZGUoZWxlbWVudDogTm9kZSk6IGVsZW1lbnQgaXMgRWxlbWVudCB7XG4gICAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgPT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERTtcbiAgfVxufVxuIl19