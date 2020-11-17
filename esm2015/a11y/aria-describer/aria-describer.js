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
    describe(hostElement, message, role) {
        if (!this._canBeDescribed(hostElement, message)) {
            return;
        }
        const key = getKey(message, role);
        if (typeof message !== 'string') {
            // We need to ensure that the element has an ID.
            setMessageId(message);
            messageRegistry.set(key, { messageElement: message, referenceCount: 0 });
        }
        else if (!messageRegistry.has(key)) {
            this._createMessageElement(message, role);
        }
        if (!this._isElementDescribedByMessage(hostElement, key)) {
            this._addMessageReference(hostElement, key);
        }
    }
    removeDescription(hostElement, message, role) {
        if (!message || !this._isElementNode(hostElement)) {
            return;
        }
        const key = getKey(message, role);
        if (this._isElementDescribedByMessage(hostElement, key)) {
            this._removeMessageReference(hostElement, key);
        }
        // If the message is a string, it means that it's one that we created for the
        // consumer so we can remove it safely, otherwise we should leave it in place.
        if (typeof message === 'string') {
            const registeredMessage = messageRegistry.get(key);
            if (registeredMessage && registeredMessage.referenceCount === 0) {
                this._deleteMessageElement(key);
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
    _createMessageElement(message, role) {
        const messageElement = this._document.createElement('div');
        setMessageId(messageElement);
        messageElement.textContent = message;
        if (role) {
            messageElement.setAttribute('role', role);
        }
        this._createMessagesContainer();
        messagesContainer.appendChild(messageElement);
        messageRegistry.set(getKey(message, role), { messageElement, referenceCount: 0 });
    }
    /** Deletes the message element from the global messages container. */
    _deleteMessageElement(key) {
        const registeredMessage = messageRegistry.get(key);
        const messageElement = registeredMessage && registeredMessage.messageElement;
        if (messagesContainer && messageElement) {
            messagesContainer.removeChild(messageElement);
        }
        messageRegistry.delete(key);
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
            if (preExistingContainer && preExistingContainer.parentNode) {
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
    _addMessageReference(element, key) {
        const registeredMessage = messageRegistry.get(key);
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
    _removeMessageReference(element, key) {
        const registeredMessage = messageRegistry.get(key);
        registeredMessage.referenceCount--;
        removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }
    /** Returns true if the element has been described by the provided message ID. */
    _isElementDescribedByMessage(element, key) {
        const referenceIds = getAriaReferenceIds(element, 'aria-describedby');
        const registeredMessage = messageRegistry.get(key);
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
/** Gets a key that can be used to look messages up in the registry. */
function getKey(message, role) {
    return typeof message === 'string' ? `${role || ''}/${message}` : message;
}
/** Assigns a unique ID to an element, if it doesn't have one already. */
function setMessageId(element) {
    if (!element.id) {
        element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${nextId++}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1kZXNjcmliZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1kZXNjcmliZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQzVELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xHLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7OztBQWUvQyxzRUFBc0U7QUFDdEUsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQUcsbUNBQW1DLENBQUM7QUFFekUsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxNQUFNLHlCQUF5QixHQUFHLHlCQUF5QixDQUFDO0FBRW5FLG1GQUFtRjtBQUNuRixNQUFNLENBQUMsTUFBTSw4QkFBOEIsR0FBRyxzQkFBc0IsQ0FBQztBQUVyRSx5RUFBeUU7QUFDekUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBRWYsNkZBQTZGO0FBQzdGLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFxQyxDQUFDO0FBRXJFLDZDQUE2QztBQUM3QyxJQUFJLGlCQUFpQixHQUF1QixJQUFJLENBQUM7QUFFakQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxhQUFhO0lBR3hCLFlBQ29CLFNBQWM7SUFDaEM7O09BRUc7SUFDSyxTQUFvQjtRQUFwQixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFjRCxRQUFRLENBQUMsV0FBb0IsRUFBRSxPQUEyQixFQUFFLElBQWE7UUFDdkUsSUFB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QUMsRUFBRSxFQUFFO1FBQ2YsT0FBTyxDQUFDLEVBQUUsR0FBRyxHQUFHLHlCQUF5QixJQUFJLE1BQU0sRUFBRSxFQUFFLENBQUM7S0FDekQ7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgT25EZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7YWRkQXJpYVJlZmVyZW5jZWRJZCwgZ2V0QXJpYVJlZmVyZW5jZUlkcywgcmVtb3ZlQXJpYVJlZmVyZW5jZWRJZH0gZnJvbSAnLi9hcmlhLXJlZmVyZW5jZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuXG5cbi8qKlxuICogSW50ZXJmYWNlIHVzZWQgdG8gcmVnaXN0ZXIgbWVzc2FnZSBlbGVtZW50cyBhbmQga2VlcCBhIGNvdW50IG9mIGhvdyBtYW55IHJlZ2lzdHJhdGlvbnMgaGF2ZVxuICogdGhlIHNhbWUgbWVzc2FnZSBhbmQgdGhlIHJlZmVyZW5jZSB0byB0aGUgbWVzc2FnZSBlbGVtZW50IHVzZWQgZm9yIHRoZSBgYXJpYS1kZXNjcmliZWRieWAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVnaXN0ZXJlZE1lc3NhZ2Uge1xuICAvKiogVGhlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgbWVzc2FnZS4gKi9cbiAgbWVzc2FnZUVsZW1lbnQ6IEVsZW1lbnQ7XG5cbiAgLyoqIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCByZWZlcmVuY2UgdGhpcyBtZXNzYWdlIGVsZW1lbnQgdmlhIGBhcmlhLWRlc2NyaWJlZGJ5YC4gKi9cbiAgcmVmZXJlbmNlQ291bnQ6IG51bWJlcjtcbn1cblxuLyoqIElEIHVzZWQgZm9yIHRoZSBib2R5IGNvbnRhaW5lciB3aGVyZSBhbGwgbWVzc2FnZXMgYXJlIGFwcGVuZGVkLiAqL1xuZXhwb3J0IGNvbnN0IE1FU1NBR0VTX0NPTlRBSU5FUl9JRCA9ICdjZGstZGVzY3JpYmVkYnktbWVzc2FnZS1jb250YWluZXInO1xuXG4vKiogSUQgcHJlZml4IHVzZWQgZm9yIGVhY2ggY3JlYXRlZCBtZXNzYWdlIGVsZW1lbnQuICovXG5leHBvcnQgY29uc3QgQ0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWCA9ICdjZGstZGVzY3JpYmVkYnktbWVzc2FnZSc7XG5cbi8qKiBBdHRyaWJ1dGUgZ2l2ZW4gdG8gZWFjaCBob3N0IGVsZW1lbnQgdGhhdCBpcyBkZXNjcmliZWQgYnkgYSBtZXNzYWdlIGVsZW1lbnQuICovXG5leHBvcnQgY29uc3QgQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFID0gJ2Nkay1kZXNjcmliZWRieS1ob3N0JztcblxuLyoqIEdsb2JhbCBpbmNyZW1lbnRhbCBpZGVudGlmaWVyIGZvciBlYWNoIHJlZ2lzdGVyZWQgbWVzc2FnZSBlbGVtZW50LiAqL1xubGV0IG5leHRJZCA9IDA7XG5cbi8qKiBHbG9iYWwgbWFwIG9mIGFsbCByZWdpc3RlcmVkIG1lc3NhZ2UgZWxlbWVudHMgdGhhdCBoYXZlIGJlZW4gcGxhY2VkIGludG8gdGhlIGRvY3VtZW50LiAqL1xuY29uc3QgbWVzc2FnZVJlZ2lzdHJ5ID0gbmV3IE1hcDxzdHJpbmd8RWxlbWVudCwgUmVnaXN0ZXJlZE1lc3NhZ2U+KCk7XG5cbi8qKiBDb250YWluZXIgZm9yIGFsbCByZWdpc3RlcmVkIG1lc3NhZ2VzLiAqL1xubGV0IG1lc3NhZ2VzQ29udGFpbmVyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFV0aWxpdHkgdGhhdCBjcmVhdGVzIHZpc3VhbGx5IGhpZGRlbiBlbGVtZW50cyB3aXRoIGEgbWVzc2FnZSBjb250ZW50LiBVc2VmdWwgZm9yIGVsZW1lbnRzIHRoYXRcbiAqIHdhbnQgdG8gdXNlIGFyaWEtZGVzY3JpYmVkYnkgdG8gZnVydGhlciBkZXNjcmliZSB0aGVtc2VsdmVzIHdpdGhvdXQgYWRkaW5nIGFkZGl0aW9uYWwgdmlzdWFsXG4gKiBjb250ZW50LlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBcmlhRGVzY3JpYmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55LFxuICAgIC8qKlxuICAgICAqIEBicmVha2luZy1jaGFuZ2UgOC4wLjAgYF9wbGF0Zm9ybWAgcGFyYW1ldGVyIHRvIGJlIG1hZGUgcmVxdWlyZWQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBfcGxhdGZvcm0/OiBQbGF0Zm9ybSkge1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdG8gdGhlIGhvc3QgZWxlbWVudCBhbiBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSB0byBhIGhpZGRlbiBlbGVtZW50IHRoYXQgY29udGFpbnNcbiAgICogdGhlIG1lc3NhZ2UuIElmIHRoZSBzYW1lIG1lc3NhZ2UgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCB0aGVuIGl0IHdpbGwgcmV1c2UgdGhlIGNyZWF0ZWRcbiAgICogbWVzc2FnZSBlbGVtZW50LlxuICAgKi9cbiAgZGVzY3JpYmUoaG9zdEVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZywgcm9sZT86IHN0cmluZyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFkZHMgdG8gdGhlIGhvc3QgZWxlbWVudCBhbiBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSB0byBhbiBhbHJlYWR5LWV4aXN0aW5nIG1lc3NzYWdlIGVsZW1lbnQuXG4gICAqL1xuICBkZXNjcmliZShob3N0RWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIGRlc2NyaWJlKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnQsIHJvbGU/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2NhbkJlRGVzY3JpYmVkKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGdldEtleShtZXNzYWdlLCByb2xlKTtcblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGFuIElELlxuICAgICAgc2V0TWVzc2FnZUlkKG1lc3NhZ2UpO1xuICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChrZXksIHttZXNzYWdlRWxlbWVudDogbWVzc2FnZSwgcmVmZXJlbmNlQ291bnQ6IDB9KTtcbiAgICB9IGVsc2UgaWYgKCFtZXNzYWdlUmVnaXN0cnkuaGFzKGtleSkpIHtcbiAgICAgIHRoaXMuX2NyZWF0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2UsIHJvbGUpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5faXNFbGVtZW50RGVzY3JpYmVkQnlNZXNzYWdlKGhvc3RFbGVtZW50LCBrZXkpKSB7XG4gICAgICB0aGlzLl9hZGRNZXNzYWdlUmVmZXJlbmNlKGhvc3RFbGVtZW50LCBrZXkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIHRoZSBob3N0IGVsZW1lbnQncyBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSB0byB0aGUgbWVzc2FnZS4gKi9cbiAgcmVtb3ZlRGVzY3JpcHRpb24oaG9zdEVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZywgcm9sZT86IHN0cmluZyk6IHZvaWQ7XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGhvc3QgZWxlbWVudCdzIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIHRvIHRoZSBtZXNzYWdlIGVsZW1lbnQuICovXG4gIHJlbW92ZURlc2NyaXB0aW9uKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgcmVtb3ZlRGVzY3JpcHRpb24oaG9zdEVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZ3xIVE1MRWxlbWVudCwgcm9sZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghbWVzc2FnZSB8fCAhdGhpcy5faXNFbGVtZW50Tm9kZShob3N0RWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBnZXRLZXkobWVzc2FnZSwgcm9sZSk7XG5cbiAgICBpZiAodGhpcy5faXNFbGVtZW50RGVzY3JpYmVkQnlNZXNzYWdlKGhvc3RFbGVtZW50LCBrZXkpKSB7XG4gICAgICB0aGlzLl9yZW1vdmVNZXNzYWdlUmVmZXJlbmNlKGhvc3RFbGVtZW50LCBrZXkpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBtZXNzYWdlIGlzIGEgc3RyaW5nLCBpdCBtZWFucyB0aGF0IGl0J3Mgb25lIHRoYXQgd2UgY3JlYXRlZCBmb3IgdGhlXG4gICAgLy8gY29uc3VtZXIgc28gd2UgY2FuIHJlbW92ZSBpdCBzYWZlbHksIG90aGVyd2lzZSB3ZSBzaG91bGQgbGVhdmUgaXQgaW4gcGxhY2UuXG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KGtleSk7XG4gICAgICBpZiAocmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UucmVmZXJlbmNlQ291bnQgPT09IDApIHtcbiAgICAgICAgdGhpcy5fZGVsZXRlTWVzc2FnZUVsZW1lbnQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWVzc2FnZXNDb250YWluZXIgJiYgbWVzc2FnZXNDb250YWluZXIuY2hpbGROb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX2RlbGV0ZU1lc3NhZ2VzQ29udGFpbmVyKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVucmVnaXN0ZXJzIGFsbCBjcmVhdGVkIG1lc3NhZ2UgZWxlbWVudHMgYW5kIHJlbW92ZXMgdGhlIG1lc3NhZ2UgY29udGFpbmVyLiAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBkZXNjcmliZWRFbGVtZW50cyA9XG4gICAgICAgIHRoaXMuX2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFske0NES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURX1dYCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NyaWJlZEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9yZW1vdmVDZGtEZXNjcmliZWRCeVJlZmVyZW5jZUlkcyhkZXNjcmliZWRFbGVtZW50c1tpXSk7XG4gICAgICBkZXNjcmliZWRFbGVtZW50c1tpXS5yZW1vdmVBdHRyaWJ1dGUoQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICBpZiAobWVzc2FnZXNDb250YWluZXIpIHtcbiAgICAgIHRoaXMuX2RlbGV0ZU1lc3NhZ2VzQ29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgbWVzc2FnZVJlZ2lzdHJ5LmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBlbGVtZW50IGluIHRoZSB2aXN1YWxseSBoaWRkZW4gbWVzc2FnZSBjb250YWluZXIgZWxlbWVudCB3aXRoIHRoZSBtZXNzYWdlXG4gICAqIGFzIGl0cyBjb250ZW50IGFuZCBhZGRzIGl0IHRvIHRoZSBtZXNzYWdlIHJlZ2lzdHJ5LlxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlTWVzc2FnZUVsZW1lbnQobWVzc2FnZTogc3RyaW5nLCByb2xlPzogc3RyaW5nKSB7XG4gICAgY29uc3QgbWVzc2FnZUVsZW1lbnQgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBzZXRNZXNzYWdlSWQobWVzc2FnZUVsZW1lbnQpO1xuICAgIG1lc3NhZ2VFbGVtZW50LnRleHRDb250ZW50ID0gbWVzc2FnZTtcblxuICAgIGlmIChyb2xlKSB7XG4gICAgICBtZXNzYWdlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCByb2xlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jcmVhdGVNZXNzYWdlc0NvbnRhaW5lcigpO1xuICAgIG1lc3NhZ2VzQ29udGFpbmVyIS5hcHBlbmRDaGlsZChtZXNzYWdlRWxlbWVudCk7XG4gICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChnZXRLZXkobWVzc2FnZSwgcm9sZSksIHttZXNzYWdlRWxlbWVudCwgcmVmZXJlbmNlQ291bnQ6IDB9KTtcbiAgfVxuXG4gIC8qKiBEZWxldGVzIHRoZSBtZXNzYWdlIGVsZW1lbnQgZnJvbSB0aGUgZ2xvYmFsIG1lc3NhZ2VzIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZGVsZXRlTWVzc2FnZUVsZW1lbnQoa2V5OiBzdHJpbmd8RWxlbWVudCkge1xuICAgIGNvbnN0IHJlZ2lzdGVyZWRNZXNzYWdlID0gbWVzc2FnZVJlZ2lzdHJ5LmdldChrZXkpO1xuICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gcmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UubWVzc2FnZUVsZW1lbnQ7XG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyICYmIG1lc3NhZ2VFbGVtZW50KSB7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5yZW1vdmVDaGlsZChtZXNzYWdlRWxlbWVudCk7XG4gICAgfVxuICAgIG1lc3NhZ2VSZWdpc3RyeS5kZWxldGUoa2V5KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIHRoZSBnbG9iYWwgY29udGFpbmVyIGZvciBhbGwgYXJpYS1kZXNjcmliZWRieSBtZXNzYWdlcy4gKi9cbiAgcHJpdmF0ZSBfY3JlYXRlTWVzc2FnZXNDb250YWluZXIoKSB7XG4gICAgaWYgKCFtZXNzYWdlc0NvbnRhaW5lcikge1xuICAgICAgLy8gQGJyZWFraW5nLWNoYW5nZSA4LjAuMCBgX3BsYXRmb3JtYCBudWxsIGNoZWNrIGNhbiBiZSByZW1vdmVkIG9uY2UgdGhlIHBhcmFtZXRlciBpcyByZXF1aXJlZFxuICAgICAgY29uc3QgY2FuQmVBcmlhSGlkZGVuID0gIXRoaXMuX3BsYXRmb3JtIHx8ICghdGhpcy5fcGxhdGZvcm0uRURHRSAmJiAhdGhpcy5fcGxhdGZvcm0uVFJJREVOVCk7XG4gICAgICBjb25zdCBwcmVFeGlzdGluZ0NvbnRhaW5lciA9IHRoaXMuX2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKE1FU1NBR0VTX0NPTlRBSU5FUl9JRCk7XG5cbiAgICAgIC8vIFdoZW4gZ29pbmcgZnJvbSB0aGUgc2VydmVyIHRvIHRoZSBjbGllbnQsIHdlIG1heSBlbmQgdXAgaW4gYSBzaXR1YXRpb24gd2hlcmUgdGhlcmUnc1xuICAgICAgLy8gYWxyZWFkeSBhIGNvbnRhaW5lciBvbiB0aGUgcGFnZSwgYnV0IHdlIGRvbid0IGhhdmUgYSByZWZlcmVuY2UgdG8gaXQuIENsZWFyIHRoZVxuICAgICAgLy8gb2xkIGNvbnRhaW5lciBzbyB3ZSBkb24ndCBnZXQgZHVwbGljYXRlcy4gRG9pbmcgdGhpcywgaW5zdGVhZCBvZiBlbXB0eWluZyB0aGUgcHJldmlvdXNcbiAgICAgIC8vIGNvbnRhaW5lciwgc2hvdWxkIGJlIHNsaWdodGx5IGZhc3Rlci5cbiAgICAgIGlmIChwcmVFeGlzdGluZ0NvbnRhaW5lciAmJiBwcmVFeGlzdGluZ0NvbnRhaW5lci5wYXJlbnROb2RlKSB7XG4gICAgICAgIHByZUV4aXN0aW5nQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocHJlRXhpc3RpbmdDb250YWluZXIpO1xuICAgICAgfVxuXG4gICAgICBtZXNzYWdlc0NvbnRhaW5lciA9IHRoaXMuX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbWVzc2FnZXNDb250YWluZXIuaWQgPSBNRVNTQUdFU19DT05UQUlORVJfSUQ7XG4gICAgICBtZXNzYWdlc0NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjZGstdmlzdWFsbHktaGlkZGVuJyk7XG5cbiAgICAgIC8vIElFIGFuZCBFZGdlIHdvbid0IHJlYWQgb3V0IHRoZSBtZXNzYWdlcyBpZiB0aGV5J3JlIGluIGFuIGBhcmlhLWhpZGRlbmAgY29udGFpbmVyLlxuICAgICAgLy8gV2Ugb25seSBkaXNhYmxlIGBhcmlhLWhpZGRlbmAgZm9yIHRoZXNlIHBsYXRmb3JtcywgYmVjYXVzZSBpdCBjb21lcyB3aXRoIHRoZVxuICAgICAgLy8gZGlzYWR2YW50YWdlIHRoYXQgcGVvcGxlIG1pZ2h0IGhpdCB0aGUgbWVzc2FnZXMgd2hlbiB0aGV5J3ZlIG5hdmlnYXRlZCBwYXN0XG4gICAgICAvLyB0aGUgZW5kIG9mIHRoZSBkb2N1bWVudCB1c2luZyB0aGUgYXJyb3cga2V5cy5cbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBjYW5CZUFyaWFIaWRkZW4gKyAnJyk7XG4gICAgICB0aGlzLl9kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lc3NhZ2VzQ29udGFpbmVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogRGVsZXRlcyB0aGUgZ2xvYmFsIG1lc3NhZ2VzIGNvbnRhaW5lci4gKi9cbiAgcHJpdmF0ZSBfZGVsZXRlTWVzc2FnZXNDb250YWluZXIoKSB7XG4gICAgaWYgKG1lc3NhZ2VzQ29udGFpbmVyICYmIG1lc3NhZ2VzQ29udGFpbmVyLnBhcmVudE5vZGUpIHtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobWVzc2FnZXNDb250YWluZXIpO1xuICAgICAgbWVzc2FnZXNDb250YWluZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGFsbCBjZGstZGVzY3JpYmVkYnkgbWVzc2FnZXMgdGhhdCBhcmUgaG9zdGVkIHRocm91Z2ggdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3JlbW92ZUNka0Rlc2NyaWJlZEJ5UmVmZXJlbmNlSWRzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICAvLyBSZW1vdmUgYWxsIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIElEcyB0aGF0IGFyZSBwcmVmaXhlZCBieSBDREtfREVTQ1JJQkVEQllfSURfUFJFRklYXG4gICAgY29uc3Qgb3JpZ2luYWxSZWZlcmVuY2VJZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsZW1lbnQsICdhcmlhLWRlc2NyaWJlZGJ5JylcbiAgICAgICAgLmZpbHRlcihpZCA9PiBpZC5pbmRleE9mKENES19ERVNDUklCRURCWV9JRF9QUkVGSVgpICE9IDApO1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5Jywgb3JpZ2luYWxSZWZlcmVuY2VJZHMuam9pbignICcpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbWVzc2FnZSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgdXNpbmcgYXJpYS1kZXNjcmliZWRieSBhbmQgaW5jcmVtZW50cyB0aGUgcmVnaXN0ZXJlZFxuICAgKiBtZXNzYWdlJ3MgcmVmZXJlbmNlIGNvdW50LlxuICAgKi9cbiAgcHJpdmF0ZSBfYWRkTWVzc2FnZVJlZmVyZW5jZShlbGVtZW50OiBFbGVtZW50LCBrZXk6IHN0cmluZ3xFbGVtZW50KSB7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSBtZXNzYWdlUmVnaXN0cnkuZ2V0KGtleSkhO1xuXG4gICAgLy8gQWRkIHRoZSBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSBhbmQgc2V0IHRoZVxuICAgIC8vIGRlc2NyaWJlZGJ5X2hvc3QgYXR0cmlidXRlIHRvIG1hcmsgdGhlIGVsZW1lbnQuXG4gICAgYWRkQXJpYVJlZmVyZW5jZWRJZChlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkKTtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUsICcnKTtcbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBtZXNzYWdlIHJlZmVyZW5jZSBmcm9tIHRoZSBlbGVtZW50IHVzaW5nIGFyaWEtZGVzY3JpYmVkYnlcbiAgICogYW5kIGRlY3JlbWVudHMgdGhlIHJlZ2lzdGVyZWQgbWVzc2FnZSdzIHJlZmVyZW5jZSBjb3VudC5cbiAgICovXG4gIHByaXZhdGUgX3JlbW92ZU1lc3NhZ2VSZWZlcmVuY2UoZWxlbWVudDogRWxlbWVudCwga2V5OiBzdHJpbmd8RWxlbWVudCkge1xuICAgIGNvbnN0IHJlZ2lzdGVyZWRNZXNzYWdlID0gbWVzc2FnZVJlZ2lzdHJ5LmdldChrZXkpITtcbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudC0tO1xuXG4gICAgcmVtb3ZlQXJpYVJlZmVyZW5jZWRJZChlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkKTtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBoYXMgYmVlbiBkZXNjcmliZWQgYnkgdGhlIHByb3ZpZGVkIG1lc3NhZ2UgSUQuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShlbGVtZW50OiBFbGVtZW50LCBrZXk6IHN0cmluZ3xFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmVmZXJlbmNlSWRzID0gZ2V0QXJpYVJlZmVyZW5jZUlkcyhlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScpO1xuICAgIGNvbnN0IHJlZ2lzdGVyZWRNZXNzYWdlID0gbWVzc2FnZVJlZ2lzdHJ5LmdldChrZXkpO1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHJlZ2lzdGVyZWRNZXNzYWdlICYmIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkO1xuXG4gICAgcmV0dXJuICEhbWVzc2FnZUlkICYmIHJlZmVyZW5jZUlkcy5pbmRleE9mKG1lc3NhZ2VJZCkgIT0gLTE7XG4gIH1cblxuICAvKiogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgbWVzc2FnZSBjYW4gYmUgZGVzY3JpYmVkIG9uIGEgcGFydGljdWxhciBlbGVtZW50LiAqL1xuICBwcml2YXRlIF9jYW5CZURlc2NyaWJlZChlbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmd8SFRNTEVsZW1lbnR8dm9pZCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlICYmIHR5cGVvZiBtZXNzYWdlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2UnZCBoYXZlIHRvIG1ha2Ugc29tZSBhc3N1bXB0aW9ucyBhYm91dCB0aGUgZGVzY3JpcHRpb24gZWxlbWVudCdzIHRleHQsIGlmIHRoZSBjb25zdW1lclxuICAgICAgLy8gcGFzc2VkIGluIGFuIGVsZW1lbnQuIEFzc3VtZSB0aGF0IGlmIGFuIGVsZW1lbnQgaXMgcGFzc2VkIGluLCB0aGUgY29uc3VtZXIgaGFzIHZlcmlmaWVkXG4gICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGEgZGVzY3JpcHRpb24uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkTWVzc2FnZSA9IG1lc3NhZ2UgPT0gbnVsbCA/ICcnIDogYCR7bWVzc2FnZX1gLnRyaW0oKTtcbiAgICBjb25zdCBhcmlhTGFiZWwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpO1xuXG4gICAgLy8gV2Ugc2hvdWxkbid0IHNldCBkZXNjcmlwdGlvbnMgaWYgdGhleSdyZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBgYXJpYS1sYWJlbGAgb2YgdGhlXG4gICAgLy8gZWxlbWVudCwgYmVjYXVzZSBzY3JlZW4gcmVhZGVycyB3aWxsIGVuZCB1cCByZWFkaW5nIG91dCB0aGUgc2FtZSB0ZXh0IHR3aWNlIGluIGEgcm93LlxuICAgIHJldHVybiB0cmltbWVkTWVzc2FnZSA/ICghYXJpYUxhYmVsIHx8IGFyaWFMYWJlbC50cmltKCkgIT09IHRyaW1tZWRNZXNzYWdlKSA6IGZhbHNlO1xuICB9XG5cbiAgLyoqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyBhbiBFbGVtZW50IG5vZGUuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudE5vZGUoZWxlbWVudDogTm9kZSk6IGVsZW1lbnQgaXMgRWxlbWVudCB7XG4gICAgcmV0dXJuIGVsZW1lbnQubm9kZVR5cGUgPT09IHRoaXMuX2RvY3VtZW50LkVMRU1FTlRfTk9ERTtcbiAgfVxufVxuXG4vKiogR2V0cyBhIGtleSB0aGF0IGNhbiBiZSB1c2VkIHRvIGxvb2sgbWVzc2FnZXMgdXAgaW4gdGhlIHJlZ2lzdHJ5LiAqL1xuZnVuY3Rpb24gZ2V0S2V5KG1lc3NhZ2U6IHN0cmluZ3xFbGVtZW50LCByb2xlPzogc3RyaW5nKTogc3RyaW5nfEVsZW1lbnQge1xuICByZXR1cm4gdHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnID8gYCR7cm9sZSB8fCAnJ30vJHttZXNzYWdlfWAgOiBtZXNzYWdlO1xufVxuXG4vKiogQXNzaWducyBhIHVuaXF1ZSBJRCB0byBhbiBlbGVtZW50LCBpZiBpdCBkb2Vzbid0IGhhdmUgb25lIGFscmVhZHkuICovXG5mdW5jdGlvbiBzZXRNZXNzYWdlSWQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50LmlkKSB7XG4gICAgZWxlbWVudC5pZCA9IGAke0NES19ERVNDUklCRURCWV9JRF9QUkVGSVh9LSR7bmV4dElkKyt9YDtcbiAgfVxufVxuIl19