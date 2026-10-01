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
      </section>
    </section>`,
    clientSource: `export function start() {
      for (const mode of ['accept', 'reject', 'supersede']) {
        document.querySelector('#' + mode + '-mode').addEventListener('click', () => window.fixture.setMode(mode));
      }
      document.querySelector('#add-option').addEventListener('click', () => window.fixture.addOption());
      document.querySelector('#remove-option').addEventListener('click', () => window.fixture.removeOption());
      const checkbox = document.createElement('en-checkbox');
      checkbox.id = 'client-checkbox';
      checkbox.textContent = 'Framework owned choice';
      document.querySelector('#client-consumer').insertBefore(checkbox, document.querySelector('#client-toggle'));
      const state = document.querySelector('#client-state');
      let checked = false;
      const update = (value) => { checked = value; checkbox.checked = value; state.textContent = value ? 'checked' : 'unchecked'; };
      document.querySelector('#client-toggle').addEventListener('click', () => update(!checked));
      checkbox.addEventListener('en-change', (event) => {
        const mode = window.fixture.getMode();
        if (mode === 'reject') { event.preventDefault(); return; }
        if (mode === 'supersede') { event.preventDefault(); update(event.detail.previous); return; }
        update(checkbox.checked);
      });
    }`,
  };
}
