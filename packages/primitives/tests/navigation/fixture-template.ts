import { html } from 'lit';
import { sectionNavigationTemplate, breadcrumbTemplate, skipLinkTemplate } from '@en-reve/primitives/templates/navigation.js';

export function navigationTemplate(id: string, mode: string) {
  return sectionNavigationTemplate({ label: `${id === 'primary' ? 'Primary' : 'Secondary'} sections`, sticky: true, items: [
    { href: `#${id}-one`, label: 'First section' },
    { href: `#${id}-two`, label: 'Second section' },
    { href: `#${id}-three`, label: 'Third section with a longer translated label' },
    { href: `#${id}-two`, label: 'Open second in new tab', target: '_blank' },
    { href: `#${id}-cancelled`, label: 'Canceled navigation' },
    { href: `?mode=${mode}&copy=other#${id}-two`, label: 'Different query document' },
  ] });
}
function content(id: string) {
  return ['one', 'two', 'three', 'cancelled'].map((name, index) => html`
    <section id=${`${id}-${name}`} class="en-navigation-target" data-section tabindex="-1" aria-labelledby=${`${id}-${name}-heading`}>
      <h2 id=${`${id}-${name}-heading`}>${id} section ${index + 1}</h2>
      <button type="button">${id} action ${index + 1}</button>
      <p>Native document content remains available before enhancement.</p>
    </section>
  `);
}
export function fixtureTemplate(mode = 'single') {
  return html`
    ${skipLinkTemplate({ href: '#primary-main', label: 'Skip to main content' })}
    <header>
      <h1>Navigation fixture</h1>
      ${breadcrumbTemplate({ label: 'Breadcrumb', items: [
        { href: '/fixture', label: 'Home' }, { label: 'Navigation', current: 'page' },
      ] })}
    </header>
    <div data-mode=${mode}>
      <div id="primary" data-scope>
        ${navigationTemplate('primary', mode)}
        <main id="primary-main" class="en-navigation-target" tabindex="-1">${content('primary')}</main>
      </div>
      ${mode === 'two' ? html`
        <div id="secondary" data-scope>
          ${navigationTemplate('secondary', mode)}
          <section aria-label="Secondary content">${content('secondary')}</section>
        </div>
      ` : ''}
    </div>
  `;
}
