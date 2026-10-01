import { EnElement } from '../internal/en-element.js';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { linkStyles } from '@en-reve/styles/links.js';
import { linkTemplate } from './template.js';

/**
 * A standalone native link. Consumers own destination validation and routing.
 * Use light-DOM native anchors in navigation, sidebar and breadcrumbs; this
 * component's private shadow anchor does not participate in those composites.
 * @tagname en-link
 * @slot - Descriptive link text.
 * @slot prefix - Decorative leading content.
 * @slot suffix - Decorative trailing content.
 * @csspart control - The native anchor.
 */
export class EnLink extends EnElement {
  static override properties = {
    href: { type: String },
    target: { type: String },
    rel: { type: String },
    download: { type: String },
  };
  static override styles = [foundationStyles, inlineHostStyles, linkStyles];

  /** Navigation destination. Without href the anchor is not interactive. */
  declare href: string | undefined;
  /** Native browsing-context target, for example _blank. */
  declare target: string | undefined;
  /** Native link relationship; _blank defaults to noopener. */
  declare rel: string;
  /** Optional download filename; an empty string requests browser naming. */
  declare download: string | undefined;

  constructor() {
    super();
    this.href = undefined;
    this.target = undefined;
    this.rel = '';
    this.download = undefined;
  }

  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLAnchorElement>('a')?.focus(options);
  }

  protected override render() {
    return linkTemplate(this);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-link': EnLink; } }
