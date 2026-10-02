export function documentHTML(body,{mode='single',dir='ltr',styles='',stylesheet='/packages/styles/dist/navigation.css',scriptURL='/packages/primitives/tests/navigation/fixture.ts'}={}) { return `<!doctype html><html lang="en" dir="${dir}"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Native navigation fixture</title>
      ${stylesheet ? `<link rel="stylesheet" href="${stylesheet}">` : ''}
      <style>${styles}
        html { scroll-behavior: auto; }
        body { margin: 0; color: #172026; background: white; font-family: system-ui; }
        header, [data-scope] { padding-inline: 20px; }
        header { padding-block: 12px; }
        h1 { font-size: 1.5rem; }
        [data-section] { min-block-size: 720px; padding-block: 12px; }
        [data-section] h2 { margin-block-start: 0; }
        [data-scope] { min-inline-size: 0; }
        [data-mode="two"] { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        [data-mode="nested"] [data-scope] { block-size: 420px; overflow: auto; margin: 120px 16px 900px; border: 2px solid; }
        [data-mode="nested"] [data-section] { min-block-size: 620px; }
        button { font: inherit; }
      </style>
    </head><body data-mode="${mode}">${body}
      <script type="module" src="${scriptURL}"></script>
    </body></html>`; }
