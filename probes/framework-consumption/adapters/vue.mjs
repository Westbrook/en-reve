import { createRequire } from 'node:module';
import { join } from 'node:path';

function componentSource(major, server = false) {
  const vue2 = major === 2;
  const attrs = (content) => vue2 ? `{ attrs: { ${content} } }` : `{ ${content} }`;
  const button = (id, action, label) => `h('button', ${vue2 ? `{ attrs: { id: '${id}', type: 'button' }, on: { click: ${action} } }` : `{ id: '${id}', type: 'button', onClick: ${action} }`}, '${label}')`;
  return `
const component = {
  data() { return { checked: false, mountedClient: false }; },
  mounted() { this.mountedClient = true; },
  methods: {
    changed(event) {
      const mode = window.fixture.getMode();
      if (mode === 'reject') { event.preventDefault(); return; }
      if (mode === 'supersede') {
        event.preventDefault();
        event.currentTarget.checked = event.detail.previous;
        this.checked = event.detail.previous;
        return;
      }
      this.checked = event.currentTarget.checked;
    }
  },
  render(${vue2 ? 'h' : ''}) {
    return h('section', null, [
      h('h1', null, 'Vue ${major} component consumption'),
      h('div', null, [
        ${['accept','reject','supersede'].map(mode => button(`${mode}-mode`, `() => window.fixture.setMode('${mode}')`, mode)).join(',\n')},
        ${button('add-option', '() => window.fixture.addOption()', 'Add option')},
        ${button('remove-option', '() => window.fixture.removeOption()', 'Remove option')}
      ]),
      h('output', ${attrs("id: 'framework-state'")}, 'Vue shell'),
      h('div', ${vue2 ? (server ? "{ attrs: { id: 'component-island' }, domProps: { innerHTML: islandHtml } }" : "{ attrs: { id: 'component-island' } }") : "{ id: 'component-island', innerHTML: islandHtml }"}),
      h('section', ${attrs("id: 'client-consumer'")}, [
        h('h2', null, 'Framework owned choice'),
        this.mountedClient ? h('en-checkbox', ${vue2 ? "{ attrs: { id: 'client-checkbox' }, domProps: { checked: this.checked }, on: { 'en-change': this.changed } }" : "{ id: 'client-checkbox', '.checked': this.checked, 'onEn-change': this.changed }"}, 'Framework owned choice') : null,
        ${button('client-toggle', '() => { this.checked = !this.checked; }', 'Toggle framework choice')},
        h('output', ${attrs("id: 'client-state'")}, this.checked ? 'checked' : 'unchecked')
      ])
    ]);
  }
};`;
}

export async function render({ environment, islandHtml }) {
  const require = createRequire(join(environment, 'package.json'));
  const Vue = require('vue');
  const major = Number(Vue.version.split('.')[0]);
  const source = componentSource(major);
  // Vue 2 invokes domProps create hooks even during hydration. Passing
  // innerHTML on the client would replace already parsed shadow-root hosts.
  // Its client vnode deliberately owns only the island container attributes:
  // no children or innerHTML patch operation, including subsequent updates.
  const serverSource = componentSource(major, true);
  const component = new Function('h', 'islandHtml', `${serverSource}; return component;`)(Vue.h, islandHtml);
  const html = major === 2
    ? await require('vue-server-renderer').createRenderer().renderToString(new Vue(component))
    : await require('@vue/server-renderer').renderToString(Vue.createSSRApp(component));
  const clientSource = major === 2
    ? `import Vue from 'vue';\nexport function start() {\n const islandHtml = document.querySelector('#component-island').innerHTML;\n ${source}\n return new Vue(component).$mount(document.querySelector('#framework-root').firstElementChild, true);\n}\n`
    : `import { createSSRApp, h } from 'vue';\nexport function start() {\n const islandHtml = document.querySelector('#component-island').innerHTML;\n ${source}\n return createSSRApp(component).mount('#framework-root');\n}\n`;
  return { html, clientSource };
}
