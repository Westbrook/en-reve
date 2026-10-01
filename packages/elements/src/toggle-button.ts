import { patternStyles } from '@en-reve/styles/patterns.js';
import { EnButton } from './button/element.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
/** A persistent toggle action. Native click covers pointer, Enter and Space.
 * @tagname en-toggle-button
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean | 'mixed'>} en-change - Tentative pressed state; cancel to restore, author writes win.
 */
export class EnToggleButton extends EnButton<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean|'mixed'>}> {
    static override properties = {
        ...EnButton.properties,
        pressed: { noAccessor: true, reflect: true, converter: {
                fromAttribute: (value: string | null) => value === 'mixed' ? 'mixed' : value !== null && value !== 'false',
                toAttribute: (value: boolean | 'mixed') => String(value),
            } },
    };
    static override styles = [...EnButton.styles, patternStyles];
    private pressedValue: boolean | 'mixed' = false;
    private pressedRevision = 0;
    /** Persistent state. Mixed activates to true. Author assignments are silent. */
    get pressed(): boolean | 'mixed' { return this.pressedValue; }
    set pressed(value: boolean | 'mixed') {
        const previous = this.pressedValue;
        this.pressedValue = value === 'mixed' ? value : Boolean(value);
        this.pressedRevision++;
        this.requestUpdate('pressed', previous);
    }
    constructor() {
        super();
        this.variant = 'secondary';
        this.addEventListener('click', () => {
            if (this.disabled || this.loading || this.getAttribute('aria-disabled') === 'true')
                return;
            const previous = this.pressed;
            const stage = (value: boolean | 'mixed') => { this.pressedValue = value; this.requestUpdate('pressed', previous); };
            dispatchChange(this, { previous, proposed: this.pressed !== true, reason: 'toggle',
                getRevision: () => this.pressedRevision, stage, rollback: stage,
                canCommit: () => this.isConnected && !this.disabled && !this.loading && this.getAttribute('aria-disabled') !== 'true',
            });
        });
    }
    protected override get buttonPressed(): string { return String(this.pressed); }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-toggle-button': EnToggleButton;
    }
}
