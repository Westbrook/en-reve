import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { mediaStyles } from '@en-reve/styles/feedback.js';
import { avatarTemplate } from './template.js';

/**
 * An identity image with an initials fallback. Omit name for a decorative avatar.
 * @tagname en-avatar
 * @cssprop --en-avatar-size - Avatar size.
 * @cssprop --en-avatar-radius - Avatar corner radius.
 * @csspart base - The image frame.
 * @csspart image - The loaded image.
 * @csspart fallback - The initials shown when no image is available.
 */
export class EnAvatar extends EnElement {
  static override properties = {
    name: { type: String },
    src: { type: String },
    initials: { type: String },
    failed: { state: true },
  };
  static override styles = [foundationStyles, inlineHostStyles, mediaStyles];

  /** Accessible identity. An empty name makes the avatar decorative. */
  declare name: string;
  /** Optional image URL. */
  declare src: string;
  /** Optional initials override, useful for scripts with different naming conventions. */
  declare initials: string;
  private declare failed: boolean;

  constructor() {
    super();
    this.name = '';
    this.src = '';
    this.initials = '';
    this.failed = false;
  }

  protected override willUpdate(changes: PropertyValues<this>): void {
    if (changes.has('src')) this.failed = false;
  }

  private readonly onError = () => {
    this.failed = true;
  };

  private get fallbackInitials(): string {
    if (this.initials) return this.initials;
    const words = (this.name || '').trim().split(/\s+/u).filter(Boolean);
    if (words.length === 0) return '';
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const first = (word: string) => segmenter.segment(word)[Symbol.iterator]().next().value?.segment ?? '';
    return `${first(words[0]!)}${words.length > 1 ? first(words[words.length - 1]!) : ''}`;
  }

  protected override render() {
    return avatarTemplate({
      name: this.name,
      src: this.src,
      initials: this.fallbackInitials,
      size: this.size,
      failed: this.failed,
      onError: this.onError,
    });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-avatar': EnAvatar; } }
