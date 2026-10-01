import { createContext } from '@lit/context';
import type { EditorMessages } from './editor/messages.js';
import type { ColorPickerMessages } from './color-picker/messages.js';

/** Missing local fields inherit from the nearest provider, then built-in defaults. */
export const editorMessagesContext = createContext<EditorMessages | undefined>('@en-reve/editor-messages/v1');
export const colorMessagesContext = createContext<ColorPickerMessages | undefined>('@en-reve/color-messages/v1');

/** Merge only defined fields; empty strings remain intentional overrides. */
export function mergeMessageOverrides<T extends object>(context: T | undefined, local: T | undefined): T | undefined {
  if (!context) return local;
  if (!local) return context;
  const merged: Record<string, unknown> = { ...context } as Record<string, unknown>;
  for (const [key, value] of Object.entries(local)) {
    if (value === undefined || value === null) continue;
    merged[key] = typeof value === 'object' && !Array.isArray(value)
      ? mergeMessageOverrides(Reflect.get(context, key), value) : value;
  }
  return merged as T;
}
