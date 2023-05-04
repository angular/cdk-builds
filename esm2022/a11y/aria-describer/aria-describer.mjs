/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, APP_ID, inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { addAriaReferencedId, getAriaReferenceIds, removeAriaReferencedId } from './aria-reference';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/platform";
/**
 * ID used for the body container where all messages are appended.
 * @deprecated No longer being used. To be removed.
 * @breaking-change 14.0.0
 */
export const MESSAGES_CONTAINER_ID = 'cdk-describedby-message-container';
/**
 * ID prefix used for each created message element.
 * @deprecated To be turned into a private variable.
 * @breaking-change 14.0.0
 */
export const CDK_DESCRIBEDBY_ID_PREFIX = 'cdk-describedby-message';
/**
 * Attribute given to each host element that is described by a message element.
 * @deprecated To be turned into a private variable.
 * @breaking-change 14.0.0
 */
export const CDK_DESCRIBEDBY_HOST_ATTRIBUTE = 'cdk-describedby-host';
/** Global incremental identifier for each registered message element. */
let nextId = 0;
/**
 * Utility that creates visually hidden elements with a message content. Useful for elements that
 * want to use aria-describedby to further describe themselves without adding additional visual
 * content.
 */
class AriaDescriber {
    constructor(_document, 
    /**
     * @deprecated To be turned into a required parameter.
     * @breaking-change 14.0.0
     */
    _platform) {
        this._platform = _platform;
        /** Map of all registered message elements that have been placed into the document. */
        this._messageRegistry = new Map();
        /** Container for all registered messages. */
        this._messagesContainer = null;
        /** Unique ID for the service. */
        this._id = `${nextId++}`;
        this._document = _document;
        this._id = inject(APP_ID) + '-' + nextId++;
    }
    describe(hostElement, message, role) {
        if (!this._canBeDescribed(hostElement, message)) {
            return;
        }
        const key = getKey(message, role);
        if (typeof message !== 'string') {
            // We need to ensure that the element has an ID.
            setMessageId(message, this._id);
            this._messageRegistry.set(key, { messageElement: message, referenceCount: 0 });
        }
        else if (!this._messageRegistry.has(key)) {
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
            const registeredMessage = this._messageRegistry.get(key);
            if (registeredMessage && registeredMessage.referenceCount === 0) {
                this._deleteMessageElement(key);
            }
        }
        if (this._messagesContainer?.childNodes.length === 0) {
            this._messagesContainer.remove();
            this._messagesContainer = null;
        }
    }
    /** Unregisters all created message elements and removes the message container. */
    ngOnDestroy() {
        const describedElements = this._document.querySelectorAll(`[${CDK_DESCRIBEDBY_HOST_ATTRIBUTE}="${this._id}"]`);
        for (let i = 0; i < describedElements.length; i++) {
            this._removeCdkDescribedByReferenceIds(describedElements[i]);
            describedElements[i].removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
        }
        this._messagesContainer?.remove();
        this._messagesContainer = null;
        this._messageRegistry.clear();
    }
    /**
     * Creates a new element in the visually hidden message container element with the message
     * as its content and adds it to the message registry.
     */
    _createMessageElement(message, role) {
        const messageElement = this._document.createElement('div');
        setMessageId(messageElement, this._id);
        messageElement.textContent = message;
        if (role) {
            messageElement.setAttribute('role', role);
        }
        this._createMessagesContainer();
        this._messagesContainer.appendChild(messageElement);
        this._messageRegistry.set(getKey(message, role), { messageElement, referenceCount: 0 });
    }
    /** Deletes the message element from the global messages container. */
    _deleteMessageElement(key) {
        this._messageRegistry.get(key)?.messageElement?.remove();
        this._messageRegistry.delete(key);
    }
    /** Creates the global container for all aria-describedby messages. */
    _createMessagesContainer() {
        if (this._messagesContainer) {
            return;
        }
        const containerClassName = 'cdk-describedby-message-container';
        const serverContainers = this._document.querySelectorAll(`.${containerClassName}[platform="server"]`);
        for (let i = 0; i < serverContainers.length; i++) {
            // When going from the server to the client, we may end up in a situation where there's
            // already a container on the page, but we don't have a reference to it. Clear the
            // old container so we don't get duplicates. Doing this, instead of emptying the previous
            // container, should be slightly faster.
            serverContainers[i].remove();
        }
        const messagesContainer = this._document.createElement('div');
        // We add `visibility: hidden` in order to prevent text in this container from
        // being searchable by the browser's Ctrl + F functionality.
        // Screen-readers will still read the description for elements with aria-describedby even
        // when the description element is not visible.
        messagesContainer.style.visibility = 'hidden';
        // Even though we use `visibility: hidden`, we still apply `cdk-visually-hidden` so that
        // the description element doesn't impact page layout.
        messagesContainer.classList.add(containerClassName);
        messagesContainer.classList.add('cdk-visually-hidden');
        // @breaking-change 14.0.0 Remove null check for `_platform`.
        if (this._platform && !this._platform.isBrowser) {
            messagesContainer.setAttribute('platform', 'server');
        }
        this._document.body.appendChild(messagesContainer);
        this._messagesContainer = messagesContainer;
    }
    /** Removes all cdk-describedby messages that are hosted through the element. */
    _removeCdkDescribedByReferenceIds(element) {
        // Remove all aria-describedby reference IDs that are prefixed by CDK_DESCRIBEDBY_ID_PREFIX
        const originalReferenceIds = getAriaReferenceIds(element, 'aria-describedby').filter(id => id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0);
        element.setAttribute('aria-describedby', originalReferenceIds.join(' '));
    }
    /**
     * Adds a message reference to the element using aria-describedby and increments the registered
     * message's reference count.
     */
    _addMessageReference(element, key) {
        const registeredMessage = this._messageRegistry.get(key);
        // Add the aria-describedby reference and set the
        // describedby_host attribute to mark the element.
        addAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, this._id);
        registeredMessage.referenceCount++;
    }
    /**
     * Removes a message reference from the element using aria-describedby
     * and decrements the registered message's reference count.
     */
    _removeMessageReference(element, key) {
        const registeredMessage = this._messageRegistry.get(key);
        registeredMessage.referenceCount--;
        removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
        element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }
    /** Returns true if the element has been described by the provided message ID. */
    _isElementDescribedByMessage(element, key) {
        const referenceIds = getAriaReferenceIds(element, 'aria-describedby');
        const registeredMessage = this._messageRegistry.get(key);
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
        return trimmedMessage ? !ariaLabel || ariaLabel.trim() !== trimmedMessage : false;
    }
    /** Checks whether a node is an Element node. */
    _isElementNode(element) {
        return element.nodeType === this._document.ELEMENT_NODE;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: AriaDescriber, deps: [{ token: DOCUMENT }, { token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: AriaDescriber, providedIn: 'root' }); }
}
export { AriaDescriber };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0", ngImport: i0, type: AriaDescriber, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Platform }]; } });
/** Gets a key that can be used to look messages up in the registry. */
function getKey(message, role) {
    return typeof message === 'string' ? `${role || ''}/${message}` : message;
}
/** Assigns a unique ID to an element, if it doesn't have one already. */
function setMessageId(element, serviceId) {
    if (!element.id) {
        element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${serviceId}-${nextId++}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJpYS1kZXNjcmliZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvYXJpYS1kZXNjcmliZXIvYXJpYS1kZXNjcmliZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFhLE1BQU0sRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDOzs7QUFjbEc7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLG1DQUFtQyxDQUFDO0FBRXpFOzs7O0dBSUc7QUFDSCxNQUFNLENBQUMsTUFBTSx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQztBQUVuRTs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sOEJBQThCLEdBQUcsc0JBQXNCLENBQUM7QUFFckUseUVBQXlFO0FBQ3pFLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7O0dBSUc7QUFDSCxNQUNhLGFBQWE7SUFZeEIsWUFDb0IsU0FBYztJQUNoQzs7O09BR0c7SUFDSyxTQUFvQjtRQUFwQixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBZjlCLHNGQUFzRjtRQUM5RSxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztRQUUxRSw2Q0FBNkM7UUFDckMsdUJBQWtCLEdBQXVCLElBQUksQ0FBQztRQUV0RCxpQ0FBaUM7UUFDaEIsUUFBRyxHQUFHLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQztRQVVuQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztR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LGFBQWE7MkZBQWIsYUFBYTtrQkFEekIsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7OzBCQWMzQixNQUFNOzJCQUFDLFFBQVE7O0FBa09wQix1RUFBdUU7QUFDdkUsU0FBUyxNQUFNLENBQUMsT0FBeUIsRUFBRSxJQUFhO0lBQ3RELE9BQU8sT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUM1RSxDQUFDO0FBRUQseUVBQXlFO0FBQ3pFLFNBQVMsWUFBWSxDQUFDLE9BQW9CLEVBQUUsU0FBaUI7SUFDM0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7UUFDZixPQUFPLENBQUMsRUFBRSxHQUFHLEdBQUcseUJBQXlCLElBQUksU0FBUyxJQUFJLE1BQU0sRUFBRSxFQUFFLENBQUM7S0FDdEU7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgT25EZXN0cm95LCBBUFBfSUQsIGluamVjdH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHthZGRBcmlhUmVmZXJlbmNlZElkLCBnZXRBcmlhUmVmZXJlbmNlSWRzLCByZW1vdmVBcmlhUmVmZXJlbmNlZElkfSBmcm9tICcuL2FyaWEtcmVmZXJlbmNlJztcblxuLyoqXG4gKiBJbnRlcmZhY2UgdXNlZCB0byByZWdpc3RlciBtZXNzYWdlIGVsZW1lbnRzIGFuZCBrZWVwIGEgY291bnQgb2YgaG93IG1hbnkgcmVnaXN0cmF0aW9ucyBoYXZlXG4gKiB0aGUgc2FtZSBtZXNzYWdlIGFuZCB0aGUgcmVmZXJlbmNlIHRvIHRoZSBtZXNzYWdlIGVsZW1lbnQgdXNlZCBmb3IgdGhlIGBhcmlhLWRlc2NyaWJlZGJ5YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZWdpc3RlcmVkTWVzc2FnZSB7XG4gIC8qKiBUaGUgZWxlbWVudCBjb250YWluaW5nIHRoZSBtZXNzYWdlLiAqL1xuICBtZXNzYWdlRWxlbWVudDogRWxlbWVudDtcblxuICAvKiogVGhlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IHJlZmVyZW5jZSB0aGlzIG1lc3NhZ2UgZWxlbWVudCB2aWEgYGFyaWEtZGVzY3JpYmVkYnlgLiAqL1xuICByZWZlcmVuY2VDb3VudDogbnVtYmVyO1xufVxuXG4vKipcbiAqIElEIHVzZWQgZm9yIHRoZSBib2R5IGNvbnRhaW5lciB3aGVyZSBhbGwgbWVzc2FnZXMgYXJlIGFwcGVuZGVkLlxuICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIHVzZWQuIFRvIGJlIHJlbW92ZWQuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMFxuICovXG5leHBvcnQgY29uc3QgTUVTU0FHRVNfQ09OVEFJTkVSX0lEID0gJ2Nkay1kZXNjcmliZWRieS1tZXNzYWdlLWNvbnRhaW5lcic7XG5cbi8qKlxuICogSUQgcHJlZml4IHVzZWQgZm9yIGVhY2ggY3JlYXRlZCBtZXNzYWdlIGVsZW1lbnQuXG4gKiBAZGVwcmVjYXRlZCBUbyBiZSB0dXJuZWQgaW50byBhIHByaXZhdGUgdmFyaWFibGUuXG4gKiBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMFxuICovXG5leHBvcnQgY29uc3QgQ0RLX0RFU0NSSUJFREJZX0lEX1BSRUZJWCA9ICdjZGstZGVzY3JpYmVkYnktbWVzc2FnZSc7XG5cbi8qKlxuICogQXR0cmlidXRlIGdpdmVuIHRvIGVhY2ggaG9zdCBlbGVtZW50IHRoYXQgaXMgZGVzY3JpYmVkIGJ5IGEgbWVzc2FnZSBlbGVtZW50LlxuICogQGRlcHJlY2F0ZWQgVG8gYmUgdHVybmVkIGludG8gYSBwcml2YXRlIHZhcmlhYmxlLlxuICogQGJyZWFraW5nLWNoYW5nZSAxNC4wLjBcbiAqL1xuZXhwb3J0IGNvbnN0IENES19ERVNDUklCRURCWV9IT1NUX0FUVFJJQlVURSA9ICdjZGstZGVzY3JpYmVkYnktaG9zdCc7XG5cbi8qKiBHbG9iYWwgaW5jcmVtZW50YWwgaWRlbnRpZmllciBmb3IgZWFjaCByZWdpc3RlcmVkIG1lc3NhZ2UgZWxlbWVudC4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIFV0aWxpdHkgdGhhdCBjcmVhdGVzIHZpc3VhbGx5IGhpZGRlbiBlbGVtZW50cyB3aXRoIGEgbWVzc2FnZSBjb250ZW50LiBVc2VmdWwgZm9yIGVsZW1lbnRzIHRoYXRcbiAqIHdhbnQgdG8gdXNlIGFyaWEtZGVzY3JpYmVkYnkgdG8gZnVydGhlciBkZXNjcmliZSB0aGVtc2VsdmVzIHdpdGhvdXQgYWRkaW5nIGFkZGl0aW9uYWwgdmlzdWFsXG4gKiBjb250ZW50LlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBcmlhRGVzY3JpYmVyIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKiBNYXAgb2YgYWxsIHJlZ2lzdGVyZWQgbWVzc2FnZSBlbGVtZW50cyB0aGF0IGhhdmUgYmVlbiBwbGFjZWQgaW50byB0aGUgZG9jdW1lbnQuICovXG4gIHByaXZhdGUgX21lc3NhZ2VSZWdpc3RyeSA9IG5ldyBNYXA8c3RyaW5nIHwgRWxlbWVudCwgUmVnaXN0ZXJlZE1lc3NhZ2U+KCk7XG5cbiAgLyoqIENvbnRhaW5lciBmb3IgYWxsIHJlZ2lzdGVyZWQgbWVzc2FnZXMuICovXG4gIHByaXZhdGUgX21lc3NhZ2VzQ29udGFpbmVyOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBVbmlxdWUgSUQgZm9yIHRoZSBzZXJ2aWNlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9pZCA9IGAke25leHRJZCsrfWA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChET0NVTUVOVCkgX2RvY3VtZW50OiBhbnksXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgVG8gYmUgdHVybmVkIGludG8gYSByZXF1aXJlZCBwYXJhbWV0ZXIuXG4gICAgICogQGJyZWFraW5nLWNoYW5nZSAxNC4wLjBcbiAgICAgKi9cbiAgICBwcml2YXRlIF9wbGF0Zm9ybT86IFBsYXRmb3JtLFxuICApIHtcbiAgICB0aGlzLl9kb2N1bWVudCA9IF9kb2N1bWVudDtcbiAgICB0aGlzLl9pZCA9IGluamVjdChBUFBfSUQpICsgJy0nICsgbmV4dElkKys7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0byB0aGUgaG9zdCBlbGVtZW50IGFuIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIHRvIGEgaGlkZGVuIGVsZW1lbnQgdGhhdCBjb250YWluc1xuICAgKiB0aGUgbWVzc2FnZS4gSWYgdGhlIHNhbWUgbWVzc2FnZSBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQsIHRoZW4gaXQgd2lsbCByZXVzZSB0aGUgY3JlYXRlZFxuICAgKiBtZXNzYWdlIGVsZW1lbnQuXG4gICAqL1xuICBkZXNjcmliZShob3N0RWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nLCByb2xlPzogc3RyaW5nKTogdm9pZDtcblxuICAvKipcbiAgICogQWRkcyB0byB0aGUgaG9zdCBlbGVtZW50IGFuIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIHRvIGFuIGFscmVhZHktZXhpc3RpbmcgbWVzc2FnZSBlbGVtZW50LlxuICAgKi9cbiAgZGVzY3JpYmUoaG9zdEVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICBkZXNjcmliZShob3N0RWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIHJvbGU/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2NhbkJlRGVzY3JpYmVkKGhvc3RFbGVtZW50LCBtZXNzYWdlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGdldEtleShtZXNzYWdlLCByb2xlKTtcblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIGVsZW1lbnQgaGFzIGFuIElELlxuICAgICAgc2V0TWVzc2FnZUlkKG1lc3NhZ2UsIHRoaXMuX2lkKTtcbiAgICAgIHRoaXMuX21lc3NhZ2VSZWdpc3RyeS5zZXQoa2V5LCB7bWVzc2FnZUVsZW1lbnQ6IG1lc3NhZ2UsIHJlZmVyZW5jZUNvdW50OiAwfSk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fbWVzc2FnZVJlZ2lzdHJ5LmhhcyhrZXkpKSB7XG4gICAgICB0aGlzLl9jcmVhdGVNZXNzYWdlRWxlbWVudChtZXNzYWdlLCByb2xlKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShob3N0RWxlbWVudCwga2V5KSkge1xuICAgICAgdGhpcy5fYWRkTWVzc2FnZVJlZmVyZW5jZShob3N0RWxlbWVudCwga2V5KTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVtb3ZlcyB0aGUgaG9zdCBlbGVtZW50J3MgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgdG8gdGhlIG1lc3NhZ2UuICovXG4gIHJlbW92ZURlc2NyaXB0aW9uKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmcsIHJvbGU/OiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8qKiBSZW1vdmVzIHRoZSBob3N0IGVsZW1lbnQncyBhcmlhLWRlc2NyaWJlZGJ5IHJlZmVyZW5jZSB0byB0aGUgbWVzc2FnZSBlbGVtZW50LiAqL1xuICByZW1vdmVEZXNjcmlwdGlvbihob3N0RWxlbWVudDogRWxlbWVudCwgbWVzc2FnZTogSFRNTEVsZW1lbnQpOiB2b2lkO1xuXG4gIHJlbW92ZURlc2NyaXB0aW9uKGhvc3RFbGVtZW50OiBFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmcgfCBIVE1MRWxlbWVudCwgcm9sZT86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghbWVzc2FnZSB8fCAhdGhpcy5faXNFbGVtZW50Tm9kZShob3N0RWxlbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBnZXRLZXkobWVzc2FnZSwgcm9sZSk7XG5cbiAgICBpZiAodGhpcy5faXNFbGVtZW50RGVzY3JpYmVkQnlNZXNzYWdlKGhvc3RFbGVtZW50LCBrZXkpKSB7XG4gICAgICB0aGlzLl9yZW1vdmVNZXNzYWdlUmVmZXJlbmNlKGhvc3RFbGVtZW50LCBrZXkpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBtZXNzYWdlIGlzIGEgc3RyaW5nLCBpdCBtZWFucyB0aGF0IGl0J3Mgb25lIHRoYXQgd2UgY3JlYXRlZCBmb3IgdGhlXG4gICAgLy8gY29uc3VtZXIgc28gd2UgY2FuIHJlbW92ZSBpdCBzYWZlbHksIG90aGVyd2lzZSB3ZSBzaG91bGQgbGVhdmUgaXQgaW4gcGxhY2UuXG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSB0aGlzLl9tZXNzYWdlUmVnaXN0cnkuZ2V0KGtleSk7XG4gICAgICBpZiAocmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UucmVmZXJlbmNlQ291bnQgPT09IDApIHtcbiAgICAgICAgdGhpcy5fZGVsZXRlTWVzc2FnZUVsZW1lbnQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbWVzc2FnZXNDb250YWluZXI/LmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLl9tZXNzYWdlc0NvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgIHRoaXMuX21lc3NhZ2VzQ29udGFpbmVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKiogVW5yZWdpc3RlcnMgYWxsIGNyZWF0ZWQgbWVzc2FnZSBlbGVtZW50cyBhbmQgcmVtb3ZlcyB0aGUgbWVzc2FnZSBjb250YWluZXIuICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNvbnN0IGRlc2NyaWJlZEVsZW1lbnRzID0gdGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgIGBbJHtDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEV9PVwiJHt0aGlzLl9pZH1cIl1gLFxuICAgICk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2NyaWJlZEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9yZW1vdmVDZGtEZXNjcmliZWRCeVJlZmVyZW5jZUlkcyhkZXNjcmliZWRFbGVtZW50c1tpXSk7XG4gICAgICBkZXNjcmliZWRFbGVtZW50c1tpXS5yZW1vdmVBdHRyaWJ1dGUoQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tZXNzYWdlc0NvbnRhaW5lcj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5fbWVzc2FnZXNDb250YWluZXIgPSBudWxsO1xuICAgIHRoaXMuX21lc3NhZ2VSZWdpc3RyeS5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgZWxlbWVudCBpbiB0aGUgdmlzdWFsbHkgaGlkZGVuIG1lc3NhZ2UgY29udGFpbmVyIGVsZW1lbnQgd2l0aCB0aGUgbWVzc2FnZVxuICAgKiBhcyBpdHMgY29udGVudCBhbmQgYWRkcyBpdCB0byB0aGUgbWVzc2FnZSByZWdpc3RyeS5cbiAgICovXG4gIHByaXZhdGUgX2NyZWF0ZU1lc3NhZ2VFbGVtZW50KG1lc3NhZ2U6IHN0cmluZywgcm9sZT86IHN0cmluZykge1xuICAgIGNvbnN0IG1lc3NhZ2VFbGVtZW50ID0gdGhpcy5fZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgc2V0TWVzc2FnZUlkKG1lc3NhZ2VFbGVtZW50LCB0aGlzLl9pZCk7XG4gICAgbWVzc2FnZUVsZW1lbnQudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuXG4gICAgaWYgKHJvbGUpIHtcbiAgICAgIG1lc3NhZ2VFbGVtZW50LnNldEF0dHJpYnV0ZSgncm9sZScsIHJvbGUpO1xuICAgIH1cblxuICAgIHRoaXMuX2NyZWF0ZU1lc3NhZ2VzQ29udGFpbmVyKCk7XG4gICAgdGhpcy5fbWVzc2FnZXNDb250YWluZXIhLmFwcGVuZENoaWxkKG1lc3NhZ2VFbGVtZW50KTtcbiAgICB0aGlzLl9tZXNzYWdlUmVnaXN0cnkuc2V0KGdldEtleShtZXNzYWdlLCByb2xlKSwge21lc3NhZ2VFbGVtZW50LCByZWZlcmVuY2VDb3VudDogMH0pO1xuICB9XG5cbiAgLyoqIERlbGV0ZXMgdGhlIG1lc3NhZ2UgZWxlbWVudCBmcm9tIHRoZSBnbG9iYWwgbWVzc2FnZXMgY29udGFpbmVyLiAqL1xuICBwcml2YXRlIF9kZWxldGVNZXNzYWdlRWxlbWVudChrZXk6IHN0cmluZyB8IEVsZW1lbnQpIHtcbiAgICB0aGlzLl9tZXNzYWdlUmVnaXN0cnkuZ2V0KGtleSk/Lm1lc3NhZ2VFbGVtZW50Py5yZW1vdmUoKTtcbiAgICB0aGlzLl9tZXNzYWdlUmVnaXN0cnkuZGVsZXRlKGtleSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyB0aGUgZ2xvYmFsIGNvbnRhaW5lciBmb3IgYWxsIGFyaWEtZGVzY3JpYmVkYnkgbWVzc2FnZXMuICovXG4gIHByaXZhdGUgX2NyZWF0ZU1lc3NhZ2VzQ29udGFpbmVyKCkge1xuICAgIGlmICh0aGlzLl9tZXNzYWdlc0NvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lckNsYXNzTmFtZSA9ICdjZGstZGVzY3JpYmVkYnktbWVzc2FnZS1jb250YWluZXInO1xuICAgIGNvbnN0IHNlcnZlckNvbnRhaW5lcnMgPSB0aGlzLl9kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFxuICAgICAgYC4ke2NvbnRhaW5lckNsYXNzTmFtZX1bcGxhdGZvcm09XCJzZXJ2ZXJcIl1gLFxuICAgICk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlcnZlckNvbnRhaW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFdoZW4gZ29pbmcgZnJvbSB0aGUgc2VydmVyIHRvIHRoZSBjbGllbnQsIHdlIG1heSBlbmQgdXAgaW4gYSBzaXR1YXRpb24gd2hlcmUgdGhlcmUnc1xuICAgICAgLy8gYWxyZWFkeSBhIGNvbnRhaW5lciBvbiB0aGUgcGFnZSwgYnV0IHdlIGRvbid0IGhhdmUgYSByZWZlcmVuY2UgdG8gaXQuIENsZWFyIHRoZVxuICAgICAgLy8gb2xkIGNvbnRhaW5lciBzbyB3ZSBkb24ndCBnZXQgZHVwbGljYXRlcy4gRG9pbmcgdGhpcywgaW5zdGVhZCBvZiBlbXB0eWluZyB0aGUgcHJldmlvdXNcbiAgICAgIC8vIGNvbnRhaW5lciwgc2hvdWxkIGJlIHNsaWdodGx5IGZhc3Rlci5cbiAgICAgIHNlcnZlckNvbnRhaW5lcnNbaV0ucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWVzc2FnZXNDb250YWluZXIgPSB0aGlzLl9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIC8vIFdlIGFkZCBgdmlzaWJpbGl0eTogaGlkZGVuYCBpbiBvcmRlciB0byBwcmV2ZW50IHRleHQgaW4gdGhpcyBjb250YWluZXIgZnJvbVxuICAgIC8vIGJlaW5nIHNlYXJjaGFibGUgYnkgdGhlIGJyb3dzZXIncyBDdHJsICsgRiBmdW5jdGlvbmFsaXR5LlxuICAgIC8vIFNjcmVlbi1yZWFkZXJzIHdpbGwgc3RpbGwgcmVhZCB0aGUgZGVzY3JpcHRpb24gZm9yIGVsZW1lbnRzIHdpdGggYXJpYS1kZXNjcmliZWRieSBldmVuXG4gICAgLy8gd2hlbiB0aGUgZGVzY3JpcHRpb24gZWxlbWVudCBpcyBub3QgdmlzaWJsZS5cbiAgICBtZXNzYWdlc0NvbnRhaW5lci5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgLy8gRXZlbiB0aG91Z2ggd2UgdXNlIGB2aXNpYmlsaXR5OiBoaWRkZW5gLCB3ZSBzdGlsbCBhcHBseSBgY2RrLXZpc3VhbGx5LWhpZGRlbmAgc28gdGhhdFxuICAgIC8vIHRoZSBkZXNjcmlwdGlvbiBlbGVtZW50IGRvZXNuJ3QgaW1wYWN0IHBhZ2UgbGF5b3V0LlxuICAgIG1lc3NhZ2VzQ29udGFpbmVyLmNsYXNzTGlzdC5hZGQoY29udGFpbmVyQ2xhc3NOYW1lKTtcbiAgICBtZXNzYWdlc0NvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjZGstdmlzdWFsbHktaGlkZGVuJyk7XG5cbiAgICAvLyBAYnJlYWtpbmctY2hhbmdlIDE0LjAuMCBSZW1vdmUgbnVsbCBjaGVjayBmb3IgYF9wbGF0Zm9ybWAuXG4gICAgaWYgKHRoaXMuX3BsYXRmb3JtICYmICF0aGlzLl9wbGF0Zm9ybS5pc0Jyb3dzZXIpIHtcbiAgICAgIG1lc3NhZ2VzQ29udGFpbmVyLnNldEF0dHJpYnV0ZSgncGxhdGZvcm0nLCAnc2VydmVyJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtZXNzYWdlc0NvbnRhaW5lcik7XG4gICAgdGhpcy5fbWVzc2FnZXNDb250YWluZXIgPSBtZXNzYWdlc0NvbnRhaW5lcjtcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGFsbCBjZGstZGVzY3JpYmVkYnkgbWVzc2FnZXMgdGhhdCBhcmUgaG9zdGVkIHRocm91Z2ggdGhlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX3JlbW92ZUNka0Rlc2NyaWJlZEJ5UmVmZXJlbmNlSWRzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICAvLyBSZW1vdmUgYWxsIGFyaWEtZGVzY3JpYmVkYnkgcmVmZXJlbmNlIElEcyB0aGF0IGFyZSBwcmVmaXhlZCBieSBDREtfREVTQ1JJQkVEQllfSURfUFJFRklYXG4gICAgY29uc3Qgb3JpZ2luYWxSZWZlcmVuY2VJZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsZW1lbnQsICdhcmlhLWRlc2NyaWJlZGJ5JykuZmlsdGVyKFxuICAgICAgaWQgPT4gaWQuaW5kZXhPZihDREtfREVTQ1JJQkVEQllfSURfUFJFRklYKSAhPSAwLFxuICAgICk7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknLCBvcmlnaW5hbFJlZmVyZW5jZUlkcy5qb2luKCcgJykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBtZXNzYWdlIHJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCB1c2luZyBhcmlhLWRlc2NyaWJlZGJ5IGFuZCBpbmNyZW1lbnRzIHRoZSByZWdpc3RlcmVkXG4gICAqIG1lc3NhZ2UncyByZWZlcmVuY2UgY291bnQuXG4gICAqL1xuICBwcml2YXRlIF9hZGRNZXNzYWdlUmVmZXJlbmNlKGVsZW1lbnQ6IEVsZW1lbnQsIGtleTogc3RyaW5nIHwgRWxlbWVudCkge1xuICAgIGNvbnN0IHJlZ2lzdGVyZWRNZXNzYWdlID0gdGhpcy5fbWVzc2FnZVJlZ2lzdHJ5LmdldChrZXkpITtcblxuICAgIC8vIEFkZCB0aGUgYXJpYS1kZXNjcmliZWRieSByZWZlcmVuY2UgYW5kIHNldCB0aGVcbiAgICAvLyBkZXNjcmliZWRieV9ob3N0IGF0dHJpYnV0ZSB0byBtYXJrIHRoZSBlbGVtZW50LlxuICAgIGFkZEFyaWFSZWZlcmVuY2VkSWQoZWxlbWVudCwgJ2FyaWEtZGVzY3JpYmVkYnknLCByZWdpc3RlcmVkTWVzc2FnZS5tZXNzYWdlRWxlbWVudC5pZCk7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoQ0RLX0RFU0NSSUJFREJZX0hPU1RfQVRUUklCVVRFLCB0aGlzLl9pZCk7XG4gICAgcmVnaXN0ZXJlZE1lc3NhZ2UucmVmZXJlbmNlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgbWVzc2FnZSByZWZlcmVuY2UgZnJvbSB0aGUgZWxlbWVudCB1c2luZyBhcmlhLWRlc2NyaWJlZGJ5XG4gICAqIGFuZCBkZWNyZW1lbnRzIHRoZSByZWdpc3RlcmVkIG1lc3NhZ2UncyByZWZlcmVuY2UgY291bnQuXG4gICAqL1xuICBwcml2YXRlIF9yZW1vdmVNZXNzYWdlUmVmZXJlbmNlKGVsZW1lbnQ6IEVsZW1lbnQsIGtleTogc3RyaW5nIHwgRWxlbWVudCkge1xuICAgIGNvbnN0IHJlZ2lzdGVyZWRNZXNzYWdlID0gdGhpcy5fbWVzc2FnZVJlZ2lzdHJ5LmdldChrZXkpITtcbiAgICByZWdpc3RlcmVkTWVzc2FnZS5yZWZlcmVuY2VDb3VudC0tO1xuXG4gICAgcmVtb3ZlQXJpYVJlZmVyZW5jZWRJZChlbGVtZW50LCAnYXJpYS1kZXNjcmliZWRieScsIHJlZ2lzdGVyZWRNZXNzYWdlLm1lc3NhZ2VFbGVtZW50LmlkKTtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShDREtfREVTQ1JJQkVEQllfSE9TVF9BVFRSSUJVVEUpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBoYXMgYmVlbiBkZXNjcmliZWQgYnkgdGhlIHByb3ZpZGVkIG1lc3NhZ2UgSUQuICovXG4gIHByaXZhdGUgX2lzRWxlbWVudERlc2NyaWJlZEJ5TWVzc2FnZShlbGVtZW50OiBFbGVtZW50LCBrZXk6IHN0cmluZyB8IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWZlcmVuY2VJZHMgPSBnZXRBcmlhUmVmZXJlbmNlSWRzKGVsZW1lbnQsICdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZE1lc3NhZ2UgPSB0aGlzLl9tZXNzYWdlUmVnaXN0cnkuZ2V0KGtleSk7XG4gICAgY29uc3QgbWVzc2FnZUlkID0gcmVnaXN0ZXJlZE1lc3NhZ2UgJiYgcmVnaXN0ZXJlZE1lc3NhZ2UubWVzc2FnZUVsZW1lbnQuaWQ7XG5cbiAgICByZXR1cm4gISFtZXNzYWdlSWQgJiYgcmVmZXJlbmNlSWRzLmluZGV4T2YobWVzc2FnZUlkKSAhPSAtMTtcbiAgfVxuXG4gIC8qKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBtZXNzYWdlIGNhbiBiZSBkZXNjcmliZWQgb24gYSBwYXJ0aWN1bGFyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2NhbkJlRGVzY3JpYmVkKGVsZW1lbnQ6IEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZyB8IEhUTUxFbGVtZW50IHwgdm9pZCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5faXNFbGVtZW50Tm9kZShlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlICYmIHR5cGVvZiBtZXNzYWdlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2UnZCBoYXZlIHRvIG1ha2Ugc29tZSBhc3N1bXB0aW9ucyBhYm91dCB0aGUgZGVzY3JpcHRpb24gZWxlbWVudCdzIHRleHQsIGlmIHRoZSBjb25zdW1lclxuICAgICAgLy8gcGFzc2VkIGluIGFuIGVsZW1lbnQuIEFzc3VtZSB0aGF0IGlmIGFuIGVsZW1lbnQgaXMgcGFzc2VkIGluLCB0aGUgY29uc3VtZXIgaGFzIHZlcmlmaWVkXG4gICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGEgZGVzY3JpcHRpb24uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkTWVzc2FnZSA9IG1lc3NhZ2UgPT0gbnVsbCA/ICcnIDogYCR7bWVzc2FnZX1gLnRyaW0oKTtcbiAgICBjb25zdCBhcmlhTGFiZWwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcpO1xuXG4gICAgLy8gV2Ugc2hvdWxkbid0IHNldCBkZXNjcmlwdGlvbnMgaWYgdGhleSdyZSBleGFjdGx5IHRoZSBzYW1lIGFzIHRoZSBgYXJpYS1sYWJlbGAgb2YgdGhlXG4gICAgLy8gZWxlbWVudCwgYmVjYXVzZSBzY3JlZW4gcmVhZGVycyB3aWxsIGVuZCB1cCByZWFkaW5nIG91dCB0aGUgc2FtZSB0ZXh0IHR3aWNlIGluIGEgcm93LlxuICAgIHJldHVybiB0cmltbWVkTWVzc2FnZSA/ICFhcmlhTGFiZWwgfHwgYXJpYUxhYmVsLnRyaW0oKSAhPT0gdHJpbW1lZE1lc3NhZ2UgOiBmYWxzZTtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgYW4gRWxlbWVudCBub2RlLiAqL1xuICBwcml2YXRlIF9pc0VsZW1lbnROb2RlKGVsZW1lbnQ6IE5vZGUpOiBlbGVtZW50IGlzIEVsZW1lbnQge1xuICAgIHJldHVybiBlbGVtZW50Lm5vZGVUeXBlID09PSB0aGlzLl9kb2N1bWVudC5FTEVNRU5UX05PREU7XG4gIH1cbn1cblxuLyoqIEdldHMgYSBrZXkgdGhhdCBjYW4gYmUgdXNlZCB0byBsb29rIG1lc3NhZ2VzIHVwIGluIHRoZSByZWdpc3RyeS4gKi9cbmZ1bmN0aW9uIGdldEtleShtZXNzYWdlOiBzdHJpbmcgfCBFbGVtZW50LCByb2xlPzogc3RyaW5nKTogc3RyaW5nIHwgRWxlbWVudCB7XG4gIHJldHVybiB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycgPyBgJHtyb2xlIHx8ICcnfS8ke21lc3NhZ2V9YCA6IG1lc3NhZ2U7XG59XG5cbi8qKiBBc3NpZ25zIGEgdW5pcXVlIElEIHRvIGFuIGVsZW1lbnQsIGlmIGl0IGRvZXNuJ3QgaGF2ZSBvbmUgYWxyZWFkeS4gKi9cbmZ1bmN0aW9uIHNldE1lc3NhZ2VJZChlbGVtZW50OiBIVE1MRWxlbWVudCwgc2VydmljZUlkOiBzdHJpbmcpIHtcbiAgaWYgKCFlbGVtZW50LmlkKSB7XG4gICAgZWxlbWVudC5pZCA9IGAke0NES19ERVNDUklCRURCWV9JRF9QUkVGSVh9LSR7c2VydmljZUlkfS0ke25leHRJZCsrfWA7XG4gIH1cbn1cbiJdfQ==