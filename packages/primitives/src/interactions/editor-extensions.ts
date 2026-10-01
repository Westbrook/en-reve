/** Editor-independent trigger matching and registration. No document offsets escape this layer. */
export interface EditorTriggerDefinition {
  id: string;
  trigger: string;
  match?(textBeforeCaret: string): { from: number; query: string } | undefined;
}
export class EditorExtensionRegistry<T extends EditorTriggerDefinition> {
  private entries = new Map<string, {extension:T}>();
  constructor(private changed: (previous: T | undefined) => void = () => {}) {}
  register(extension: T): () => void {
    if (!extension.id || !extension.trigger) throw new TypeError('Extension requires id and trigger');
    const previous = this.entries.get(extension.id);
    const registration={extension};
    this.entries.set(extension.id, registration); this.changed(previous?.extension);
    return () => {
      if (this.entries.get(extension.id) !== registration) return;
      this.entries.delete(extension.id); this.changed(extension);
    };
  }
  get(id: string) { return this.entries.get(id)?.extension; }
  has(id: string) { return this.entries.has(id); }
  match(before: string): { extension: T; from: number; query: string } | undefined {
    for (const {extension} of this.entries.values()) {
      let match = extension.match?.(before);
      if (!extension.match) {
        const from = before.lastIndexOf(extension.trigger);
        if (from >= 0 && (from === 0 || /\s/u.test(before[from - 1])) && !/\s/u.test(before.slice(from + extension.trigger.length)))
          match = { from, query: before.slice(from + extension.trigger.length) };
      }
      if (match && Number.isInteger(match.from) && match.from >= 0 && match.from <= before.length && typeof match.query === 'string')
        return { extension, ...match };
    }
  }
}

/** One cancellable provider operation per editor. Late results and rejections are ignored. */
export class EditorQueryTask {
  private controller?: AbortController;
  start<T>(query: string, provide: (context: {query: string; signal: AbortSignal}) => T | Promise<T>,
    accept: (value: T) => void, reject: () => void, controller = new AbortController()): AbortController {
    this.cancel(); this.controller = controller;
    void Promise.resolve().then(() => controller.signal.aborted ? undefined : provide({query, signal: controller.signal}))
      .then(value => { if (this.controller === controller && !controller.signal.aborted) accept(value as T); },
        () => { if (this.controller === controller && !controller.signal.aborted) reject(); });
    return controller;
  }
  cancel() { this.controller?.abort(); this.controller = undefined; }
}

/** Opaque revision-bound editor selection. The backend retains its actual selection data. */
export interface EditorBookmark { readonly revision: number; }
export class EditorBookmarks<T> {
  private selections = new WeakMap<EditorBookmark, T>();
  capture(revision: number, selection: T): EditorBookmark {
    const bookmark = Object.freeze({revision}); this.selections.set(bookmark, selection); return bookmark;
  }
  resolve(bookmark: EditorBookmark, revision: number): T | undefined {
    return bookmark.revision === revision ? this.selections.get(bookmark) : undefined;
  }
}

/** Picker matcher for known multiword command aliases. Literal paths, URLs and escaped sigils stay text. */
export function createEditorCommandMatcher(aliases:readonly string[],trigger='/'):(before:string)=>{from:number;query:string}|undefined {
 const commands=[...new Set(aliases)].sort((a,b)=>b.length-a.length);
 if(!trigger||/[\s\w]/u.test(trigger)||commands.some(value=>!value||value!==value.trim()||/[\r\n]/u.test(value)))throw new TypeError('Nonempty single-line command aliases required');
 return before=>{
  const from=before.lastIndexOf(trigger);if(from<0||from>0&&!/\s/u.test(before[from-1]))return;
  const query=before.slice(from+trigger.length);
  if(commands.some(command=>command.toLowerCase().startsWith(query.toLowerCase())))return {from,query};
 };
}
