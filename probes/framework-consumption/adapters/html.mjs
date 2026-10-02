export async function render({ islandHtml }) {
  return {
    html: `<section>
      <h1>HTML component consumption</h1>
      <div class="fixture-actions">
        <button id="accept-mode" type="button">accept</button>
        <button id="reject-mode" type="button">reject</button>
        <button id="supersede-mode" type="button">supersede</button>
        <button id="add-option" type="button">Add option</button>
        <button id="remove-option" type="button">Remove option</button>
      </div>
      <output id="framework-state">HTML shell</output>
      <div id="component-island">${islandHtml}</div>
      <section id="client-consumer">
        <h2>Framework owned choice</h2>
        <button id="client-toggle" type="button">Toggle framework choice</button>
        <output id="client-state">unchecked</output>
        <button id="client-update" type="button">Update properties</button>
        <button id="client-mount" type="button">Mount or unmount controls</button>
        <div id="property-consumer"></div>
        <output id="client-tree-state"></output>
      </section>
    </section>`,
    clientSource: `export function start() {
      for (const mode of ['accept', 'reject', 'supersede']) {
        document.querySelector('#' + mode + '-mode').addEventListener('click', () => window.fixture.setMode(mode));
      }
      document.querySelector('#add-option').addEventListener('click', () => window.fixture.addOption());
      document.querySelector('#remove-option').addEventListener('click', () => window.fixture.removeOption());
      let checkbox; const createCheckbox = () => { checkbox = document.createElement('en-checkbox');
      checkbox.id = 'client-checkbox';
      checkbox.textContent = 'Framework owned choice';
      document.querySelector('#client-consumer').insertBefore(checkbox, document.querySelector('#client-toggle'));
      }; createCheckbox();
      const state = document.querySelector('#client-state');
      let checked = false;
      const update = (value) => { checked = value; checkbox.checked = value; state.textContent = value ? 'checked' : 'unchecked'; };
      document.querySelector('#client-toggle').addEventListener('click', () => update(!checked));
      const change = (event) => {
        const mode = window.fixture.getMode();
        if (mode === 'reject') { event.preventDefault(); return; }
        if (mode === 'supersede') { event.preventDefault(); update(event.detail.previous); return; }
        update(checkbox.checked);
      };
      checkbox.addEventListener('en-change', change);
      let tree, field, mounted = true, revised = false;
      const selected = event => { window.fixture.clientEvents.push(event.detail.proposed.selectedKey); document.querySelector('#client-tree-state').textContent = event.detail.proposed.selectedKey; };
      const properties = () => { tree.items = [{key: revised ? 'export' : 'project', label: revised ? 'Export artwork' : 'Project artwork'}]; field.label = 'Project title'; field.value = revised ? 'Revised brief' : 'Initial brief'; };
      const create = () => { tree = document.createElement('en-tree'); tree.id = 'client-tree'; field = document.createElement('en-text-field'); field.id = 'client-field'; const help = document.createElement('span'); help.slot = 'description'; help.textContent = 'Framework supplied description'; field.append(help); properties(); tree.addEventListener('en-change', selected); document.querySelector('#property-consumer').append(field, tree); }; create();
      document.querySelector('#client-update').addEventListener('click', () => { revised = true; properties(); });
      document.querySelector('#client-mount').addEventListener('click', () => { mounted = !mounted; if (!mounted) { tree.removeEventListener('en-change', selected); checkbox.removeEventListener('en-change', change); tree.remove(); field.remove(); checkbox.remove(); } else { createCheckbox(); checkbox.checked = checked; checkbox.addEventListener('en-change', change); create(); } });
    }`,
  };
}
