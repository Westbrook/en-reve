# Lit source highlighting

The sticker sheet uses Microlighter **2.1.0** and a small project grammar for TypeScript containing Lit `html` and `svg` tagged templates. Microlighter includes TypeScript, TSX, and HTML languages, but its TypeScript/TSX template rule treats template contents as strings. Changing the language to TSX does not enable Lit markup.

The public `highlightAll()` API accepts aliases for bundled languages; it does not accept a grammar object. Our Vite plugin redirects **only** the grammar loader's TypeScript import to `apps/docs/src/highlighting/lit-typescript.ts`. That module imports the original exported TypeScript and HTML grammar modules normally, without changing their objects or the installed dependency. The project-only `language-lit-typescript` name aliases to this TypeScript grammar. Normal TypeScript still works.

The unchanged Microlighter tokenizer handles the recursive `begin`/`end` rules. The local rules add:

- Tag names, quoted/unquoted attribute values, attributes, entities, and comments inside `html`/`svg` templates.
- Lit `.property`, `?boolean`, and `@event` attribute names, including multiline attributes.
- TypeScript expressions in `${…}`, nested object braces, nested templates, strings, comments, and regular expressions, using upstream TypeScript/JavaScript rules.
- Plain template strings that remain strings; HTML-looking text in ordinary strings, comments, and `<textarea>`/`<title>` contents remains text.

Source remains one escaped `Text` node. Microlighter adds CSS Highlight ranges, never token markup or executable source. The highlighter and grammar modules load on the first code disclosure, not on initial SSR/hydration. Opening additional disclosures refreshes all open code blocks so earlier ranges remain registered.

The documentation CSS target preserves native `light-dark()` (Chrome 123, Firefox 120, Safari 17.5 feature floors, all older than the project's current-minus-one support policy). Otherwise the CSS optimizer can replace it with its own OS-preference flags that do not follow the sheet's explicit light/dark selection. The theme container inherits the selected page color scheme, and comment colors use the design system's muted text token to retain readable contrast.

This is highlighting, not a full JavaScript/TypeScript parser. It recognizes the identifiers `html` and `svg`, not aliased imports or expressions such as `lit.html`. It does not parse CSS or JavaScript embedded in `<style>`/`<script>` within a Lit template, dynamic tag names, or every malformed/incomplete source fragment. It inherits upstream grammar limitations for ambiguous JavaScript syntax. Those cases remain readable text. The library does not need these rules at runtime; they are isolated to documentation tooling.

## Verification

With the Vite documentation server running:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright \
EN_REVE_PREVIEW_URL=http://127.0.0.1:4284/ \
node tooling/highlighting/verify.mjs
```

Repeat against the generated, statically served SSR build to verify the production dynamic import path:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright \
EN_REVE_PREVIEW_URL=http://127.0.0.1:4196/ \
EN_REVE_HIGHLIGHT_MODE=production \
node tooling/highlighting/verify.mjs
```

The tests use real Chromium, Firefox, and WebKit code disclosures. They inspect actual registered `Range` objects for the authored tabs/event example and a focused nested-expression fixture, retain the original source node, reject accidental source execution, and verify multiple open disclosures and repeated highlighting. They also verify lazy grammar loading, selected light/dark code backgrounds and token colors, and at least 4.5:1 contrast for the tabs example's computed token colors and the fixture's actual comment text. Results and source-pane screenshots are written to `results/`; production results include the tested SSR HTML artifact hash.

When upgrading Microlighter, verify its grammar module exports, TypeScript pattern includes, HTML repository entries, and loader import path. Both dev and production tests must pass: Vite's development import-glob resolution and production dynamic-import transform do not necessarily present the same import identifier to plugins. If Microlighter adds a public grammar registration API or a Lit grammar, replace the resolver seam with that supported API.

Official references: [Microlighter usage and language list](https://github.com/davatron5000/microlighter#readme), [adding grammars](https://github.com/davatron5000/microlighter/blob/main/CONTRIBUTING.md#adding-a-grammar), and [tokenizer source](https://github.com/davatron5000/microlighter/blob/main/src/highlight.js).
