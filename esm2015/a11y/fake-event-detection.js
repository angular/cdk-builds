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
    // themselves, but that is unlikely to contain interaction elements. Historially we used to check
    // `event.buttons === 0`, however that no longer works on recent versions of NVDA.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFrZS1ldmVudC1kZXRlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2ExMXkvZmFrZS1ldmVudC1kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsOEZBQThGO0FBQzlGLE1BQU0sVUFBVSwrQkFBK0IsQ0FBQyxLQUFpQjtJQUMvRCw2RkFBNkY7SUFDN0YsNkZBQTZGO0lBQzdGLDZGQUE2RjtJQUM3RixpR0FBaUc7SUFDakcsa0ZBQWtGO0lBQ2xGLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVELCtGQUErRjtBQUMvRixNQUFNLFVBQVUsZ0NBQWdDLENBQUMsS0FBaUI7SUFDaEUsTUFBTSxLQUFLLEdBQXNCLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUMsS0FBSyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbkYsMEZBQTBGO0lBQzFGLDRGQUE0RjtJQUM1RiwrRkFBK0Y7SUFDL0YsK0VBQStFO0lBQy9FLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUM7UUFDcEYsQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIEdldHMgd2hldGhlciBhbiBldmVudCBjb3VsZCBiZSBhIGZha2VkIGBtb3VzZWRvd25gIGV2ZW50IGRpc3BhdGNoZWQgYnkgYSBzY3JlZW4gcmVhZGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRmFrZU1vdXNlZG93bkZyb21TY3JlZW5SZWFkZXIoZXZlbnQ6IE1vdXNlRXZlbnQpOiBib29sZWFuIHtcbiAgLy8gU29tZSBzY3JlZW4gcmVhZGVycyB3aWxsIGRpc3BhdGNoIGEgZmFrZSBgbW91c2Vkb3duYCBldmVudCB3aGVuIHByZXNzaW5nIGVudGVyIG9yIHNwYWNlIG9uXG4gIC8vIGEgY2xpY2thYmxlIGVsZW1lbnQuIFdlIGNhbiBkaXN0aW5ndWlzaCB0aGVzZSBldmVudHMgd2hlbiBib3RoIGBvZmZzZXRYYCBhbmQgYG9mZnNldFlgIGFyZVxuICAvLyB6ZXJvLiBOb3RlIHRoYXQgdGhlcmUncyBhbiBlZGdlIGNhc2Ugd2hlcmUgdGhlIHVzZXIgY291bGQgY2xpY2sgdGhlIDB4MCBzcG90IG9mIHRoZSBzY3JlZW5cbiAgLy8gdGhlbXNlbHZlcywgYnV0IHRoYXQgaXMgdW5saWtlbHkgdG8gY29udGFpbiBpbnRlcmFjdGlvbiBlbGVtZW50cy4gSGlzdG9yaWFsbHkgd2UgdXNlZCB0byBjaGVja1xuICAvLyBgZXZlbnQuYnV0dG9ucyA9PT0gMGAsIGhvd2V2ZXIgdGhhdCBubyBsb25nZXIgd29ya3Mgb24gcmVjZW50IHZlcnNpb25zIG9mIE5WREEuXG4gIHJldHVybiBldmVudC5vZmZzZXRYID09PSAwICYmIGV2ZW50Lm9mZnNldFkgPT09IDA7XG59XG5cbi8qKiBHZXRzIHdoZXRoZXIgYW4gZXZlbnQgY291bGQgYmUgYSBmYWtlZCBgdG91Y2hzdGFydGAgZXZlbnQgZGlzcGF0Y2hlZCBieSBhIHNjcmVlbiByZWFkZXIuICovXG5leHBvcnQgZnVuY3Rpb24gaXNGYWtlVG91Y2hzdGFydEZyb21TY3JlZW5SZWFkZXIoZXZlbnQ6IFRvdWNoRXZlbnQpOiBib29sZWFuIHtcbiAgY29uc3QgdG91Y2g6IFRvdWNoIHwgdW5kZWZpbmVkID0gKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlc1swXSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdKTtcblxuICAvLyBBIGZha2UgYHRvdWNoc3RhcnRgIGNhbiBiZSBkaXN0aW5ndWlzaGVkIGZyb20gYSByZWFsIG9uZSBieSBsb29raW5nIGF0IHRoZSBgaWRlbnRpZmllcmBcbiAgLy8gd2hpY2ggaXMgdHlwaWNhbGx5ID49IDAgb24gYSByZWFsIGRldmljZSB2ZXJzdXMgLTEgZnJvbSBhIHNjcmVlbiByZWFkZXIuIEp1c3QgdG8gYmUgc2FmZSxcbiAgLy8gd2UgY2FuIGFsc28gbG9vayBhdCBgcmFkaXVzWGAgYW5kIGByYWRpdXNZYC4gVGhpcyBiZWhhdmlvciB3YXMgb2JzZXJ2ZWQgYWdhaW5zdCBhIFdpbmRvd3MgMTBcbiAgLy8gZGV2aWNlIHdpdGggYSB0b3VjaCBzY3JlZW4gcnVubmluZyBOVkRBIHYyMDIwLjQgYW5kIEZpcmVmb3ggODUgb3IgQ2hyb21lIDg4LlxuICByZXR1cm4gISF0b3VjaCAmJiB0b3VjaC5pZGVudGlmaWVyID09PSAtMSAmJiAodG91Y2gucmFkaXVzWCA9PSBudWxsIHx8IHRvdWNoLnJhZGl1c1ggPT09IDEpICYmXG4gICAgICAgICAodG91Y2gucmFkaXVzWSA9PSBudWxsIHx8IHRvdWNoLnJhZGl1c1kgPT09IDEpO1xufVxuIl19