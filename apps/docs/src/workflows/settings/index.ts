import type { EnToastRegion } from '@en-reve/elements/toast-region.js';
import { afterAcceptedChange } from '../../change-consumption.js';
import { createRef } from 'lit/directives/ref.js';
import { createRequestLane } from '../shared/request-lane.js';
import type { FixtureDelivery } from '../shared/fixture-scheduler.js';
import { copySettings, copySnapshot, createSettingsState, sameSettings, type CreativeSettings } from './model.js';
import { createSettingsService } from './service.js';
import { getSettingsScenario, type SettingsScenarioId } from './scenarios.js';
import { commandUnavailable, settingsCommands, type SettingsCommandAction } from './commands.js';
import { settingsTemplate, type SettingsActions, type SettingsRefs, type ValueField, type CommandSurface } from './template.js';
export { settingsStyles } from './styles.js';
export { settingsScenarios, getSettingsScenario, type SettingsScenario, type SettingsScenarioId } from './scenarios.js';

export interface SettingsWorkflowOptions {
  requestUpdate: () => void;
  scenario?: SettingsScenarioId;
  /** Import and register the command family against this workflow's owning registry. */
  preparePalette?: (options: {retry: boolean}) => Promise<void>;
  /** Fetch/evaluate optional code on intent without registering or upgrading hosts. */
  preloadPalette?: (options: {retry: boolean}) => Promise<void>;
}

/** Pure construction and initial rendering; all asynchronous work starts with an explicit action. */
export function createSettingsWorkflow({ requestUpdate, scenario = 'explore', preparePalette, preloadPalette }: SettingsWorkflowOptions) {
  const reviewScenario = getSettingsScenario(scenario);
  const initialState = () => ({ ...createSettingsState(), ...reviewScenario.preset });
  let state = initialState();
  let disposed = false;
  let commandGeneration = 0;
  let shortcutListener: AbortController | undefined;
  let loadingListener: AbortController | undefined;
  let commandLoading = false;
  let commandFailed = false;
  let commandStatus = '';
  let preparation: Promise<void> | undefined;
  // These two native feedback nodes have no dynamic Lit bindings. Updating them
  // must not rerender the settings form, navigation or an open command catalog.
  const syncCommandFeedback = () => {
    if (disposed) return;
    const busy = String(commandLoading);
    const trigger = refs.commandTrigger.value;
    const status = refs.commandStatus.value;
    if (trigger && trigger.getAttribute('aria-busy') !== busy) trigger.setAttribute('aria-busy', busy);
    if (status && status.textContent !== commandStatus) status.textContent = commandStatus;
  };
  const cancelCommandLoad = () => {
    loadingListener?.abort(); loadingListener = undefined;
    commandLoading = false; commandStatus = '';
    syncCommandFeedback();
  };
  const saveLane = createRequestLane();
  const incomingLane = createRequestLane();
  const service = createSettingsService();
  const refs: SettingsRefs = {
    root: createRef<HTMLElement>(), menu: createRef<CommandSurface>(), palette: createRef<CommandSurface>(),
    commandTrigger: createRef<HTMLElement>(), commandStatus: createRef<HTMLElement>(),
    form: createRef<HTMLFormElement>(), save: createRef<HTMLElement>(), heading: createRef<HTMLHeadingElement>(), incomingHeading: createRef<HTMLHeadingElement>(),
    opacity: createRef<ValueField>(), format: createRef<ValueField>(), layout: createRef<ValueField>(), background: createRef<ValueField>(),
  };
  const update = () => { if (!disposed) requestUpdate(); };
  const delivery = (): FixtureDelivery => state.delivery === 'held' ? { kind: 'held' } : { kind: 'delayed', milliseconds: 1200 };
  const change = (patch: Partial<CreativeSettings>): void => {
    if (disposed) return;
    state = { ...state, local: { ...state.local, ...patch },
      phase: state.phase === 'saving' || state.phase === 'failed' ? state.phase : 'idle',
      status: state.phase === 'saving' || state.phase === 'failed' || state.incoming ? state.status : '' };
    update();
  };
  // Use only public setters. Explicit reset authoritatively replaces every native draft, even for equal values.
  const reconcileAll = (): void => {
    if (refs.opacity.value) refs.opacity.value.value = state.local.opacity;
    if (refs.format.value) refs.format.value.value = state.local.format;
    if (refs.layout.value) refs.layout.value.value = state.local.layout;
    if (refs.background.value) refs.background.value.checked = state.local.background;
  };
  const reset = (): void => {
    if (disposed) return;
    ++commandGeneration; cancelCommandLoad(); shortcutListener?.abort(); shortcutListener = undefined;
    if (refs.menu.value) refs.menu.value.open = false;
    if (refs.palette.value) refs.palette.value.open = false;
    saveLane.cancel(); incomingLane.cancel(); service.reset();
    refs.root.value?.querySelectorAll('[data-settings-notifications] > en-toast').forEach(toast=>toast.remove());
    state = { ...initialState(), status: 'Settings demo reset to revision 1.' };
    reconcileAll(); update();
  };

  const save = async (): Promise<void> => {
    if (disposed || saveLane.pending) return;
    if (state.incoming) {
      refs.incomingHeading.value?.focus();
      return;
    }
    // Opacity is first in form order. Its public reporter correctly focuses the invalid exact editor.
    // Native aggregate reporting alone can fail to focus that shadow control in Firefox.
    if (!refs.opacity.value?.reportValidity()) return;
    if (!refs.form.value?.reportValidity()) return;
    const request = saveLane.begin();
    if (!request) return;
    const submitted = copySettings(state.local);
    const baseRevision = state.saved.revision;
    const fail = state.saveOutcome === 'failure';
    const responseDelivery = delivery();
    state = { ...state, phase: 'saving', saveOutcome: 'success', status: 'Saving this settings snapshot. You can continue editing.' };
    update();
    try {
      const result = await service.save(submitted, baseRevision, { signal: request.signal, delivery: responseDelivery, fail });
      if (!request.isCurrent() || disposed || state.saved.revision !== baseRevision) return;
      if (result.ok) {
        state = { ...state, saved: copySnapshot(result.value), phase: 'saved',
          status: `Saved revision ${result.value.revision}.${sameSettings(state.local, submitted) ? '' : ' Newer local changes are still unsaved.'}` };
        // The existing persistent status owns the announcement; the toast adds a dismissible visual receipt.
        refs.root.value?.querySelector<EnToastRegion>('[data-settings-notifications]')?.notify({message:state.status,variant:'success',priority:'off'});
      } else if (result.problem.kind === 'conflict') {
        state = { ...state, incoming: copySnapshot(result.problem.incoming), phase: 'idle',
          status: 'A collaborator changed opacity before this save completed. Review the incoming value; your local work is unchanged.' };
      } else {
        state = { ...state, phase: 'failed', status: 'The simulated save failed. Your local settings are intact. Retry save when ready.' };
      }
      update();
    } catch {
      if (!request.isCurrent() || disposed) return;
      state = { ...state, phase: 'failed', status: 'The simulated save failed. Your local settings are intact. Retry save when ready.' }; update();
    } finally {
      const current = request.isCurrent(); request.finish(); if (current) update();
    }
  };

  const queueIncoming = async (): Promise<void> => {
    if (disposed || incomingLane.pending) return;
    if (state.incoming) {
      state = { ...state, status: 'Review the current incoming opacity before queuing another update.' }; update(); return;
    }
    const request = incomingLane.begin();
    if (!request) return;
    state = { ...state, incomingPending: true, status: 'Collaborator update queued. Continue editing while it is delivered.' };
    update();
    try {
      const incoming = await service.incoming(request.signal, delivery());
      if (!request.isCurrent() || disposed) return;
      saveLane.cancel();
      state = { ...state, incoming: copySnapshot(incoming), incomingPending: false, phase: 'idle',
        status: 'A collaborator changed opacity to 82%. Your local settings and unfinished entry are unchanged. Review the update when ready.' };
      // Do not assign any field value or move focus on arrival.
      update();
    } catch {
      if (!request.isCurrent() || disposed) return;
      state = { ...state, incomingPending: false, status: 'The simulated collaborator update was not delivered. Queue it again to retry.' }; update();
    } finally {
      const current = request.isCurrent(); request.finish(); if (current) update();
    }
  };

  const resolveIncoming = (useIncoming: boolean, event: Event): void => {
    if (disposed || !state.incoming) return;
    const moveFocus = (event.currentTarget as HTMLElement | null)?.matches(':focus-within');
    const incoming = copySnapshot(state.incoming);
    const local = useIncoming ? { ...state.local, opacity: incoming.settings.opacity } : state.local;
    state = { ...state, saved: incoming, local, incoming: undefined, phase: 'idle',
      status: useIncoming ? 'Incoming opacity applied. Your other local settings are unchanged.' : 'Your opacity and unfinished entry were kept. Save when you want to share your local settings.' };
    if (useIncoming && refs.opacity.value) refs.opacity.value.value = local.opacity;
    update();
    if (moveFocus) refs.heading.value?.focus();
  };

  const executeCommand = (action: string, origin?: HTMLElement): void => {
    if (disposed) return;
    // Re-read capabilities after dispatch/closure. The rendered menu may be stale.
    const command = settingsCommands(state).find(command => command.action === action);
    if (!command) return;
    if (command.disabled) {
      if (action === 'settings.save' && state.incoming) refs.incomingHeading.value?.focus();
      else { state = { ...state, status: commandUnavailable(state, command.action) }; update(); }
      return;
    }
    if (action === 'settings.save') { void save(); return; }
    if (action === 'settings.restore-opacity') {
      const opacity = state.saved.settings.opacity;
      change({ opacity });
      if (refs.opacity.value) refs.opacity.value.value = opacity;
      state = { ...state, status: 'Saved opacity restored. Your other local settings were kept.' }; update();
    } else if (action === 'settings.cancel-save') {
      if (!saveLane.pending) return;
      const moveFocus = origin?.matches(':focus-within');
      saveLane.cancel();
      state = { ...state, phase: 'idle', status: 'Stopped waiting for this save. Your local settings are unchanged.' }; update();
      if (moveFocus) refs.save.value?.focus();
    } else if (action === 'settings.review-incoming') refs.incomingHeading.value?.focus();
  };
  const clickCommand = (action: SettingsCommandAction, event: Event): void => {
    const origin = event.currentTarget as HTMLElement;
    const generation = commandGeneration;
    queueMicrotask(() => {
      if (!event.defaultPrevented && origin.isConnected && generation === commandGeneration) executeCommand(action, origin);
    });
  };
  const surfaceCommand = (event: Event): void => {
    const surface = event.currentTarget as CommandSurface;
    const origin = event.composedPath()[0] as HTMLElement | undefined;
    const directOrigin = surface === refs.menu.value
      ? origin?.localName === 'en-menu-item' && origin.parentElement === surface
      : surface === refs.palette.value && origin === surface;
    if (!directOrigin || !event.cancelable || event.defaultPrevented) return;
    const action = (event as CustomEvent<{ action: string }>).detail.action;
    if (!settingsCommands(state).some(command => command.action === action)) { event.preventDefault(); return; }
    const generation = commandGeneration;
    queueMicrotask(async () => {
      if (disposed || event.defaultPrevented || !surface.isConnected || generation !== commandGeneration) return;
      try {
        // The component requests its default close after full en-action dispatch.
        // Wait for focus restitution before validation or a task-specific focus move.
        await surface.updateComplete;
        if (disposed || event.defaultPrevented || !surface.isConnected || surface.open || generation !== commandGeneration) return;
        executeCommand(action);
      } catch {
        if (!disposed && generation === commandGeneration) {
          state = { ...state, status: 'The command was not run. Close the command surface and try again.' }; update();
        }
      }
    });
  };
  const activeControl = (document: Document): Element | null => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  };
  const preloadCommands = (event: Event): void => {
    if (disposed || preparation || !preloadPalette || commandLoading || !refs.palette.value || 'updateComplete' in refs.palette.value) return;
    if ('pointerType' in event && event.pointerType === 'touch') return;
    // Intent prepares code only. Never register global definitions speculatively.
    preparation = Promise.resolve().then(() => { if (!disposed) return preloadPalette({retry: commandFailed}); }).then(() => {
      if (!disposed) commandFailed = false;
    }, () => {
      // Keep the workflow quiet and usable. Explicit activation owns error/retry UI.
      if (!disposed) commandFailed = true;
    });
  };
  const openPalette = async (): Promise<void> => {
    const palette = refs.palette.value;
    if (disposed || commandLoading || !palette) return;
    if (!preparePalette) { palette.open = true; return; }
    const generation = commandGeneration;
    const document = palette.ownerDocument;
    const focus = activeControl(document);
    commandLoading = true; commandStatus = 'Loading command search…'; syncCommandFeedback();
    const Abort = document.defaultView?.AbortController ?? globalThis.AbortController;
    loadingListener = new Abort();
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { ++commandGeneration; cancelCommandLoad(); }
    }, {signal: loadingListener.signal});
    try {
      await preparePalette({retry: commandFailed});
      commandFailed = false;
      if (disposed || generation !== commandGeneration || !palette.isConnected) return;
      await palette.updateComplete;
      // Never steal focus after the user moved on while a chunk was loading.
      if (disposed || generation !== commandGeneration || !palette.isConnected || activeControl(document) !== focus) return;
      palette.open = true;
      await palette.updateComplete;
    } catch {
      if (!disposed && generation === commandGeneration) {
        commandFailed = true;
        commandStatus = 'Command search could not load. Activate Search commands to retry. Settings remain available.';
      }
    } finally {
      if (!disposed && generation === commandGeneration) {
        loadingListener?.abort(); loadingListener = undefined; commandLoading = false;
        if (!commandFailed) commandStatus = '';
        syncCommandFeedback();
      }
    }
  };
  const enableShortcut = (enabled: boolean, document: Document): void => {
    shortcutListener?.abort(); shortcutListener = undefined;
    state = { ...state, shortcutEnabled: enabled };
    if (enabled) {
      const Abort = document.defaultView?.AbortController ?? globalThis.AbortController;
      shortcutListener = new Abort();
      document.addEventListener('keydown', event => {
        const root = refs.root.value, palette = refs.palette.value;
        if (disposed || !root || !palette || !event.composedPath().includes(root) || palette.open
          || event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat
          || event.altKey || event.shiftKey || event.ctrlKey === event.metaKey || event.key.toLowerCase() !== 'k') return;
        event.preventDefault();
        void openPalette(); // Explicit app-owned shortcut; no fabricated user event.
      }, { signal: shortcutListener.signal });
    }
    update();
  };

  const actions: SettingsActions = {
    opacity: event => afterAcceptedChange(event, (field: ValueField) => field.value, value => change({ opacity: Number(value) })),
    format: event => afterAcceptedChange(event, (field: ValueField) => field.value, value => change({ format: value as CreativeSettings['format'] })),
    layout: event => afterAcceptedChange(event, (field: ValueField) => field.value, value => change({ layout: value as CreativeSettings['layout'] })),
    background: event => afterAcceptedChange(event, (field: ValueField) => field.checked, checked => change({ background: checked })),
    menuLayout: event => {
      const field = event.currentTarget as HTMLElement & { checked: boolean };
      afterAcceptedChange(event, (item: typeof field) => item.checked, checked => {
        const layout = field.dataset.layout;
        if (checked && (layout === 'portrait' || layout === 'landscape')) change({ layout });
      });
    },
    submit: event => { event.preventDefault(); executeCommand('settings.save'); },
    save: event => clickCommand('settings.save', event),
    cancelSave: event => clickCommand('settings.cancel-save', event),
    surfaceCommand,
    preloadCommands,
    openCommands: () => {
      // Once upgraded, the component's external-trigger controller owns clicks.
      if (preparePalette && refs.palette.value && !('updateComplete' in refs.palette.value)) void openPalette();
    },
    shortcut: event => {
      const document = (event.currentTarget as HTMLElement).ownerDocument;
      afterAcceptedChange(event, (field: ValueField) => field.checked, enabled => {
        if (!disposed) enableShortcut(enabled, document);
      });
    },
    keepLocal: event => resolveIncoming(false, event),
    useIncoming: event => resolveIncoming(true, event),
    reset,
    restoreOpacity: event => clickCommand('settings.restore-opacity', event),
    restoreOutput: () => change({ format: state.saved.settings.format, background: state.saved.settings.background }),
    saveOutcome: event => afterAcceptedChange(event, (field: ValueField) => field.value, value => {
      if (disposed) return;
      state = { ...state, saveOutcome: value === 'failure' ? 'failure' : 'success' }; update();
    }),
    delivery: event => afterAcceptedChange(event, (field: ValueField) => field.value, value => {
      if (disposed) return;
      state = { ...state, delivery: value === 'held' ? 'held' : 'delayed' }; update();
    }),
    queueIncoming: () => { void queueIncoming(); },
    release: () => { service.release(); update(); },
  };
  return {
    render: () => settingsTemplate(state, refs, actions, service.pending, reviewScenario),
    reset,
    dispose() { disposed = true; ++commandGeneration; cancelCommandLoad(); shortcutListener?.abort(); shortcutListener = undefined; saveLane.dispose(); incomingLane.dispose(); service.dispose(); },
  };
}
