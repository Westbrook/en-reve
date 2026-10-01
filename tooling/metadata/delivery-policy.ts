/** Authored delivery capabilities; canonical membership/dependencies come from the definition graph. */
export const deliveryPolicy = {
  schemaVersion: 1,
  profiles: [
    {id: 'en-reve/eager', version: '1', entryOverrides: {}, initialProperties: [], featureIds: ['en-reve/en-command-palette/root']},
    {id: 'en-reve/date-picker-single-deferred', version: '1', entryOverrides: {'en-date-picker': '@en-reve/elements/date-picker-shell.js'}, initialProperties: [{tag: 'en-date-picker', properties: {calendarLoading: 'deferred', selection: 'single'}}], featureIds: ['en-reve/en-date-picker/calendar', 'en-reve/en-command-palette/root']},
  ],
  features: [
    {id: 'en-reve/en-date-picker/calendar', version: '1', disposition: 'implemented', owner: 'element', deferredCosts: ['optional-code', 'registration', 'construction'], definitionTags: ['en-calendar'], fallback: 'The essential single native date editor remains available; hydrate its shell promptly for form participation.', prerequisites: ['Select the date-picker shell profile before loading definitions.', 'Set calendarLoading to deferred and selection to single before the first update.', 'The date picker owns construction, readiness, focus and cancellation.']},
    {id: 'en-reve/en-command-palette/root', version: '1', disposition: 'implemented', owner: 'application', deferredCosts: ['component-loading', 'registration', 'construction'], definitionTags: ['en-command-palette'], fallback: 'A native launcher, loading/error text and essential navigation remain outside the application-owned activation root.', prerequisites: ['Use createElementActivation with an explicit scope, template or dormant root and actual readiness callback.', 'The application owns cancellation and disposal; definition preparation does not open the palette.']},
  ],
} as const;
