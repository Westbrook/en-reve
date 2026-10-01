import type { SettingsState } from './model.js';

export type SettingsCommandAction = 'settings.save' | 'settings.restore-opacity' | 'settings.cancel-save' | 'settings.review-incoming';
export interface SettingsCommand {
  readonly action: SettingsCommandAction;
  readonly label: string;
  readonly keywords: readonly string[];
  readonly disabled: boolean;
}

/** Application capabilities, not component state or service callbacks. */
export function settingsCommands(state: SettingsState): readonly SettingsCommand[] {
  return [
    { action: 'settings.save', label: state.phase === 'failed' ? 'Retry save' : 'Save settings', keywords: ['share', 'snapshot', 'save'], disabled: state.phase === 'saving' || Boolean(state.incoming) },
    { action: 'settings.restore-opacity', label: 'Restore saved opacity', keywords: ['reset opacity', 'undo opacity', 'percentage'], disabled: false },
    { action: 'settings.cancel-save', label: 'Cancel save', keywords: ['stop waiting', 'pending'], disabled: state.phase !== 'saving' },
    { action: 'settings.review-incoming', label: 'Review incoming change', keywords: ['collaborator', 'updated opacity', 'conflict'], disabled: !state.incoming },
  ];
}

export function commandUnavailable(state: SettingsState, action: SettingsCommandAction): string {
  if (action === 'settings.save') return state.incoming ? 'Review the incoming opacity before saving.' : 'A save is already pending. Continue editing or cancel that save.';
  if (action === 'settings.cancel-save') return 'There is no pending save to cancel.';
  if (action === 'settings.review-incoming') return 'There is no incoming change to review.';
  return '';
}
