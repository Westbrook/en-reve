export interface PreviewSettings {
  mode: 'auto' | 'light' | 'dark';
  density: 'comfortable' | 'compact' | 'spacious';
  accent: string;
  rhythm: number;
  direction: 'ltr' | 'rtl';
}

type Tool = { name: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute(input: unknown): unknown };
type ModelContext = { registerTool(tool: Tool, options: { signal: AbortSignal }): void | Promise<void> };

/** Optional browser integration; uses the exact same preview actions as the UI. */
export function registerPreviewTools(read: () => PreviewSettings, configure: (settings: Partial<PreviewSettings>) => Promise<unknown>, signal: AbortSignal) {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context?.registerTool) return;
  const properties = {
    mode: { type: 'string', enum: ['auto', 'light', 'dark'] },
    density: { type: 'string', enum: ['compact', 'comfortable', 'spacious'] },
    accent: { type: 'string', pattern: '^$|^#[0-9a-fA-F]{6}$', description: 'Hex accent seed, or empty string for the default.' },
    rhythm: { type: 'number', enum: [.125, .1875, .25, .3125, .375, .5] },
    direction: { type: 'string', enum: ['ltr', 'rtl'] },
  };
  function validate(input: unknown): Partial<PreviewSettings> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a preview-settings object.');
    const record = input as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (!(key in properties)) throw new Error(`Unknown preview setting: ${key}`);
      const rule = properties[key as keyof typeof properties];
      if (typeof value !== rule.type || ('enum' in rule && !(rule.enum as readonly unknown[]).includes(value))) throw new Error(`Invalid ${key}.`);
      if (key === 'accent' && !/^$|^#[0-9a-fA-F]{6}$/.test(value as string)) throw new Error('Invalid accent.');
    }
    return record as Partial<PreviewSettings>;
  }
  const tools: Tool[] = [
    { name: 'read_theme_preview', description: 'Read the current sticker-sheet theme preview settings.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute(input) { if (Object.keys(validate(input)).length) throw new Error('This tool accepts no settings.'); return { ...read() }; } },
    { name: 'configure_theme_preview', description: 'Change the visible local sticker-sheet preview. Does not submit or adopt a theme.', inputSchema: { type: 'object', properties, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: input => configure(validate(input)) },
  ];
  for (const tool of tools) {
    try { void Promise.resolve(context.registerTool(tool, { signal })).catch(error => console.warn('Optional preview tool registration failed.', error)); }
    catch (error) { console.warn('Optional preview tool registration failed.', error); }
  }
}
