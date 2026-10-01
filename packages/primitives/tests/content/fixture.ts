import { render } from 'lit';
import '../../../elements/src/define/skeleton.js';
import { hydrate } from '@lit-labs/ssr-client';
import { fixtureTemplate, initialState } from './fixture-template.js';
let state = { ...initialState(), loading: new URL(location.href).searchParams.has('loading') };
const root = document.querySelector('main')!;
const update = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; render(fixtureTemplate(state, update), root); };
(window as any).contentFixture = { update, hydrate: () => {
	hydrate(fixtureTemplate(state, update), root);
	document.body.dataset.ready = 'true';
} };
if (!new URL(location.href).searchParams.has('defer')) (window as any).contentFixture.hydrate();
