import { OnDestroy, Provider } from '@angular/core';
/** Possible politeness levels. */
export declare type AriaLivePoliteness = 'off' | 'polite' | 'assertive';
export declare class LiveAnnouncer implements OnDestroy {
    private _document;
    private readonly _liveElement;
    constructor(elementToken: any, _document: Document);
    /**
     * Announces a message to screenreaders.
     * @param message Message to be announced to the screenreader
     * @param politeness The politeness of the announcer element
     * @returns Promise that will be resolved when the message is added to the DOM.
     */
    announce(message: string, politeness?: AriaLivePoliteness): Promise<void>;
    ngOnDestroy(): void;
    private _createLiveElement();
}
/** @docs-private @deprecated @deletion-target 7.0.0 */
export declare function LIVE_ANNOUNCER_PROVIDER_FACTORY(parentDispatcher: LiveAnnouncer, liveElement: any, _document: Document): LiveAnnouncer;
/** @docs-private @deprecated @deletion-target 7.0.0 */
export declare const LIVE_ANNOUNCER_PROVIDER: Provider;
