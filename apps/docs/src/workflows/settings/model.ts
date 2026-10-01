export interface CreativeSettings {
  readonly opacity: number;
  readonly format: 'png' | 'svg';
  readonly layout: 'portrait' | 'landscape';
  readonly background: boolean;
}

export interface SettingsSnapshot {
  readonly revision: number;
  readonly settings: CreativeSettings;
}

export interface SettingsState {
  readonly local: CreativeSettings;
  readonly saved: SettingsSnapshot;
  readonly incoming?: SettingsSnapshot;
  readonly phase: 'idle' | 'saving' | 'saved' | 'failed';
  readonly status: string;
  readonly saveOutcome: 'success' | 'failure';
  readonly delivery: 'delayed' | 'held';
  readonly incomingPending: boolean;
  readonly shortcutEnabled: boolean;
}

export const initialSettings: Readonly<CreativeSettings> = Object.freeze({
  opacity: 64, format: 'png', layout: 'portrait', background: true,
});

export function copySettings(settings: CreativeSettings): CreativeSettings { return { ...settings }; }
export function copySnapshot(snapshot: SettingsSnapshot): SettingsSnapshot {
  return { revision: snapshot.revision, settings: copySettings(snapshot.settings) };
}
export function sameSettings(left: CreativeSettings, right: CreativeSettings): boolean {
  return left.opacity === right.opacity && left.format === right.format
    && left.layout === right.layout && left.background === right.background;
}
export function createSettingsState(): SettingsState {
  return { local: copySettings(initialSettings), saved: { revision: 1, settings: copySettings(initialSettings) },
    phase: 'idle', status: '', saveOutcome: 'success', delivery: 'delayed', incomingPending: false, shortcutEnabled: false };
}
export function settingsSummary(settings: CreativeSettings): string {
  return `${settings.opacity}% opacity · ${settings.format.toUpperCase()} · ${settings.layout === 'portrait' ? 'Portrait' : 'Landscape'} · ${settings.background ? 'Background included' : 'Transparent background'}`;
}
