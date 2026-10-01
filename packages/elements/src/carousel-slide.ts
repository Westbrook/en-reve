import { ScopedContext } from './internal/context-consumer.js';
import { html, nothing } from 'lit';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { carouselSlideStyles } from '@en-reve/styles/carousel.js';
import { carouselContext, type CarouselSlideContext } from './internal/carousel-context.js';
/**
 * Authored carousel content, retained rather than cloned or reconstructed.
 * @tagname en-carousel-slide
 * @slot - Slide content; links, fields and buttons keep native behavior.
 * @csspart base - Named slide group and themed surface.
 */
export class EnCarouselSlide extends EnElement {
    static override properties = { label: { reflect: true }, thumbnail: { reflect: true }, context: { state: true } };
    static override styles = [foundationStyles, blockHostStyles, carouselSlideStyles];
    /** Optional descriptive slide name, paired with its position in the set. */ declare label: string;
    /** Optional decorative thumbnail URL used by the parent thumbnail picker; no slide content is copied. */ declare thumbnail: string;
    private declare context: CarouselSlideContext;
    private releasePresentation?: () => void;
    private presentationGeneration = 0;
    private readonly carousel = new ScopedContext(this, carouselContext, service => {
        const generation = ++this.presentationGeneration;
        this.releasePresentation?.();
        this.releasePresentation = undefined;
        this.context = null;
        if (service) this.releasePresentation = service.subscribe(this, context => {
            if (!this.isConnected || generation !== this.presentationGeneration) return;
            if (JSON.stringify(context) !== JSON.stringify(this.context)) this.context = context;
        });
    });
    constructor() {
        super();
        this.label = '';
        this.thumbnail = '';
        this.context = null;

    }
    protected override render() {
        return html `<div class="slide" part="base" role="group" aria-roledescription=${this.context?.description ?? 'slide'} aria-label=${[this.label, this.context?.position].filter(Boolean).join(', ') || nothing} ?inert=${this.context?.visible === false} aria-hidden=${this.context?.visible === false ? 'true' : nothing}><slot></slot></div>`;
    }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-carousel-slide': EnCarouselSlide;
    }
}
