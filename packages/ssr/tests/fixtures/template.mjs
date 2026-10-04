import { html } from 'lit';

export const initial = Object.freeze({ title: 'Server project', notes: '\nFirst line\nA second line & details', format: 'svg' });

export function fixtureTemplate(snapshot = initial) {
  return html`<form id="project-form">
    <en-text-field label="Project name" description="Shared with collaborators" name="title" value=${snapshot.title}></en-text-field>
    <en-textarea label="Project notes" name="notes" value=${snapshot.notes}></en-textarea>
    <en-textarea label="Controlled notes" name="controlled-notes" value="Accepted notes" @en-change=${event => event.preventDefault()}></en-textarea>
    <en-select label="Export format" name="format" value=${snapshot.format} .items=${[{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' }]}></en-select>
    <en-checkbox name="notifications" checked>Notify the team</en-checkbox>
    <button type="submit">Save project</button>
  </form>
  <section aria-label="External overlay triggers">
    <div><en-button id="ssr-share">Share project</en-button><en-button id="ssr-history">Project history</en-button></div>
    <en-popover for="ssr-share" label="Sharing options"><en-text-field label="Invite collaborator"></en-text-field></en-popover>
    <en-tooltip for="ssr-history"><span slot="content">Browse previous revisions</span></en-tooltip>
  </section>
  <section aria-label="Shared modal close hydration">
    <button id="ssr-open-dialog" @click=${() => document.getElementById('ssr-dialog').show()}>Open server dialog</button>
    <en-dialog id="ssr-dialog" label="Server dialog" close-label="Fermer"><p>Server dialog content</p></en-dialog>
    <button id="ssr-open-drawer" @click=${() => document.getElementById('ssr-drawer').show()}>Open server drawer</button>
    <en-drawer id="ssr-drawer" label="Server drawer" close-label="Fermer"><p>Server drawer content</p></en-drawer>
    <button id="ssr-open-command-palette" @click=${() => document.getElementById('ssr-command-palette').show()}>Open server commands</button>
    <en-command-palette id="ssr-command-palette" label="Server commands" close-label="Fermer"></en-command-palette>
  </section>
  <section aria-label="Composed color picker">
    <en-swatch id="ssr-accent-swatch" color="#336699" label="Choose server accent"></en-swatch>
    <en-color-field for="ssr-accent-swatch" label="Server accent" value="#336699"></en-color-field>
  </section>
  <section aria-label="Combobox space feedback hydration">
    <en-combobox id="ssr-space-feedback" label="SSR asset" description="Choose a catalog asset." value="forest" form="project-form"
      .items=${[{ value: 'forest', label: 'Forest canvas' }, { value: 'fjord', label: 'Fjord study' }]}></en-combobox>
  </section>
  <section aria-label="Description slot hydration" id="description-fixture">
    <h2>Description slots</h2>
    <en-text-field id="ssr-description-field" value="Server description draft">
      <span slot="label">SSR project name</span>
      <span slot="description">Shared with collaborators. <a href="#ssr-description-guide">Naming guidance</a></span>
    </en-text-field>
    <en-text-field id="ssr-description-absent" label="No supporting text" value="No trailing help row"></en-text-field>
    <en-text-field id="ssr-description-empty" label="Intentionally empty help" description="This fallback must be suppressed."><span slot="description"></span></en-text-field>
    <en-text-field id="ssr-description-hidden" label="Hidden supporting text" description="This fallback must also be suppressed."><span slot="description" hidden>Hidden help.</span></en-text-field>
    <en-checkbox id="ssr-description-choice" label="SSR notifications"><span slot="description">Send updates to your team.</span></en-checkbox>
    <en-slider id="ssr-description-slider" label="SSR opacity" editable value="64"><span slot="description">The exact percentage is optional.</span></en-slider>
    <en-rating id="ssr-description-rating" label="SSR usefulness"><span slot="description">Rate this version, not the whole project.</span></en-rating>
    <h3 id="ssr-description-guide">Project naming guidance</h3>
  </section>
  <section aria-label="Button availability hydration">
    <en-button id=${'ssr-disabled-action'} disabled>Initially unavailable action</en-button>
    <en-button id=${'ssr-enabled-action'}>Initially available action</en-button>
  </section>`;
}
