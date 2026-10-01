declare module 'microlighter' {
  export function highlightAll(options?: { root?: Element | Document; selector?: string; languageAliases?: Record<string, string> }): Promise<HTMLElement[]>;
}
declare module 'microlighter/grammars/typescript.js' {
  const grammar: { scopeName: string; patterns: { include: string }[]; repository: Record<string, unknown> };
  export default grammar;
}
declare module 'microlighter/grammars/html.js' {
  const grammar: { repository: Record<string, object> };
  export default grammar;
}
