import { createRequire } from 'node:module';
import { join } from 'node:path';

// A trusted Lit SSR island remains opaque to the framework. The adjacent client
// consumer deliberately exercises property and event interoperability instead.
const appSource = `
function App({ islandHtml }) {
  const [checked, setChecked] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const checkbox = React.useRef(null);
  React.useEffect(() => {
    const element = checkbox.current;
    if (!element) return;
    const handleChange = (event) => {
      const mode = window.fixture.getMode();
      if (mode === 'reject') { event.preventDefault(); return; }
      if (mode === 'supersede') {
        event.preventDefault();
        element.checked = event.detail.previous;
        setChecked(event.detail.previous);
        return;
      }
      setChecked(element.checked);
    };
    element.addEventListener('en-change', handleChange);
    return () => element.removeEventListener('en-change', handleChange);
  }, [mounted]);
  React.useEffect(() => { if (checkbox.current) checkbox.current.checked = checked; }, [checked, mounted]);
  return React.createElement('section', null,
    React.createElement('h1', null, 'React component consumption'),
    React.createElement('div', { className: 'fixture-actions' },
      ...['accept', 'reject', 'supersede'].map(mode => React.createElement('button', {
        id: mode + '-mode', key: mode, type: 'button', onClick: () => window.fixture.setMode(mode)
      }, mode)),
      React.createElement('button', { id: 'add-option', type: 'button', onClick: () => window.fixture.addOption() }, 'Add option'),
      React.createElement('button', { id: 'remove-option', type: 'button', onClick: () => window.fixture.removeOption() }, 'Remove option')),
    React.createElement('output', { id: 'framework-state' }, 'React shell'),
    React.createElement('div', { id: 'component-island', dangerouslySetInnerHTML: { __html: islandHtml } }),
    React.createElement('section', { id: 'client-consumer' },
      React.createElement('h2', null, 'Framework owned choice'),
      mounted ? React.createElement('en-checkbox', { id: 'client-checkbox', ref: checkbox }, 'Framework owned choice') : null,
      React.createElement('button', { id: 'client-toggle', type: 'button', onClick: () => setChecked(value => !value) }, 'Toggle framework choice'),
      React.createElement('output', { id: 'client-state' }, checked ? 'checked' : 'unchecked')));
}
`;

export async function render({ environment, islandHtml }) {
  const require = createRequire(join(environment, 'package.json'));
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const App = new Function('React', `${appSource}; return App;`)(React);
  return {
    html: renderToString(React.createElement(App, { islandHtml })),
    clientSource: `import * as React from 'react';\nimport { hydrateRoot } from 'react-dom/client';\n${appSource}\nexport function start() {\n const islandHtml = document.querySelector('#component-island').innerHTML;\n return hydrateRoot(document.querySelector('#framework-root'), React.createElement(App, { islandHtml }));\n}\n`,
  };
}
