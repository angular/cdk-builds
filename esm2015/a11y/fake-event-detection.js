/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Gets whether an event could be a faked `mousedown` event dispatched by a screen reader. */
export function isFakeMousedownFromScreenReader(event) {
    // Some screen readers will dispatch a fake `mousedown` event when pressing enter or space on
    // a clickable element. We can distinguish these events when both `offsetX` and `offsetY` are
    // zero. Note that there's an edge case where the user could click the 0x0 spot of the screen
    // themselves, but that is unlikely to contain interaction elements. Historically we used to
    // check `event.buttons === 0`, however that no longer works on recent versions of NVDA.
    return event.offsetX === 0 && event.offsetY === 0;
}
/** Gets whether an event could be a faked `touchstart` event dispatched by a screen reader. */
export function isFakeTouchstartFromScreenReader(event) {
    const touch = (event.touches && event.touches[0]) ||
        (event.changedTouches && event.changedTouches[0]);
    // A fake `touchstart` can be distinguished from a real one by looking at the `identifier`
    // which is typically >= 0 on a real device versus -1 from a screen reader. Just to be safe,
    // we can also look at `radiusX` and `radiusY`. This behavior was observed against a Windows 10
    // device with a touch screen running NVDA v2020.4 and Firefox 85 or Chrome 88.
    return !!touch && touch.identifier === -1 && (touch.radiusX == null || touch.radiusX === 1) &&
        (touch.radiusY == null || touch.radiusY === 1);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFrZS1ldmVudC1kZXRlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvZmFrZS1ldmVudC1kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsOEZBQThGO0FBQzlGLE1BQU0sVUFBVSwrQkFBK0IsQ0FBQyxLQUFpQjtJQUMvRCw2RkFBNkY7SUFDN0YsNkZBQTZGO0lBQzdGLDZGQUE2RjtJQUM3Riw0RkFBNEY7SUFDNUYsd0ZBQXdGO0lBQ3hGLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVELCtGQUErRjtBQUMvRixNQUFNLFVBQVUsZ0NBQWdDLENBQUMsS0FBaUI7SUFDaEUsTUFBTSxLQUFLLEdBQXNCLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUMsS0FBSyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbkYsMEZBQTBGO0lBQzFGLDRGQUE0RjtJQUM1RiwrRkFBK0Y7SUFDL0YsK0VBQStFO0lBQy9FLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUM7UUFDcEYsQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIEdldHMgd2hldGhlciBhbiBldmVudCBjb3VsZCBiZSBhIGZha2VkIGBtb3VzZWRvd25gIGV2ZW50IGRpc3BhdGNoZWQgYnkgYSBzY3JlZW4gcmVhZGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQ6IE1vdXNlRXZlbnQpOiBib29sZWFuIHtcbiAgLy8gU29tZSBzY3JlZW4gcmVhZGVycyB3aWxsIGRpc3BhdGNoIGEgZmFrZSBgbW91c2Vkb3duYCBldmVudCB3aGVuIHByZXNzaW5nIGVudGVyIG9yIHNwYWNlIG9uXG4gIC8vIGEgY2xpY2thYmxlIGVsZW1lbnQuIFdlIGNhbiBkaXN0aW5ndWlzaCB0aGVzZSBldmVudHMgd2hlbiBib3RoIGBvZmZzZXRYYCBhbmQgYG9mZnNldFlgIGFyZVxuICAvLyB6ZXJvLiBOb3RlIHRoYXQgdGhlcmUncyBhbiBlZGdlIGNhc2Ugd2hlcmUgdGhlIHVzZXIgY291bGQgY2xpY2sgdGhlIDB4MCBzcG90IG9mIHRoZSBzY3JlZW5cbiAgLy8gdGhlbXNlbHZlcywgYnV0IHRoYXQgaXMgdW5saWtlbHkgdG8gY29udGFpbiBpbnRlcmFjdGlvbiBlbGVtZW50cy4gSGlzdG9yaWNhbGx5IHdlIHVzZWQgdG9cbiAgLy8gY2hlY2sgYGV2ZW50LmJ1dHRvbnMgPT09IDBgLCBob3dldmVyIHRoYXQgbm8gbG9uZ2VyIHdvcmtzIG9uIHJlY2VudCB2ZXJzaW9ucyBvZiBOVkRBLlxuICByZXR1cm4gZXZlbnQub2Zmc2V0WCA9PT0gMCAmJiBldmVudC5vZmZzZXRZID09PSAwO1xufVxuXG4vKiogR2V0cyB3aGV0aGVyIGFuIGV2ZW50IGNvdWxkIGJlIGEgZmFrZWQgYHRvdWNoc3RhcnRgIGV2ZW50IGRpc3BhdGNoZWQgYnkgYSBzY3JlZW4gcmVhZGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRmFrZVRvdWNoc3RhcnRGcm9tU2NyZWVuUmVhZGVyKGV2ZW50OiBUb3VjaEV2ZW50KTogYm9vbGVhbiB7XG4gIGNvbnN0IHRvdWNoOiBUb3VjaCB8IHVuZGVmaW5lZCA9IChldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXNbMF0pIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChldmVudC5jaGFuZ2VkVG91Y2hlcyAmJiBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSk7XG5cbiAgLy8gQSBmYWtlIGB0b3VjaHN0YXJ0YCBjYW4gYmUgZGlzdGluZ3Vpc2hlZCBmcm9tIGEgcmVhbCBvbmUgYnkgbG9va2luZyBhdCB0aGUgYGlkZW50aWZpZXJgXG4gIC8vIHdoaWNoIGlzIHR5cGljYWxseSA+PSAwIG9uIGEgcmVhbCBkZXZpY2UgdmVyc3VzIC0xIGZyb20gYSBzY3JlZW4gcmVhZGVyLiBKdXN0IHRvIGJlIHNhZmUsXG4gIC8vIHdlIGNhbiBhbHNvIGxvb2sgYXQgYHJhZGl1c1hgIGFuZCBgcmFkaXVzWWAuIFRoaXMgYmVoYXZpb3Igd2FzIG9ic2VydmVkIGFnYWluc3QgYSBXaW5kb3dzIDEwXG4gIC8vIGRldmljZSB3aXRoIGEgdG91Y2ggc2NyZWVuIHJ1bm5pbmcgTlZEQSB2MjAyMC40IGFuZCBGaXJlZm94IDg1IG9yIENocm9tZSA4OC5cbiAgcmV0dXJuICEhdG91Y2ggJiYgdG91Y2guaWRlbnRpZmllciA9PT0gLTEgJiYgKHRvdWNoLnJhZGl1c1ggPT0gbnVsbCB8fCB0b3VjaC5yYWRpdXNYID09PSAxKSAmJlxuICAgICAgICAgKHRvdWNoLnJhZGl1c1kgPT0gbnVsbCB8fCB0b3VjaC5yYWRpdXNZID09PSAxKTtcbn1cbiJdfQ==