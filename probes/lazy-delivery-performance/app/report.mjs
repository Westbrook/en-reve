import '@en-reve/elements/define/table.js';
for (const section of document.querySelectorAll('[data-comparison]')) {
  const body = section.querySelector('tbody'), rows = [...body.rows];
  const search = section.querySelector('input[type=search]'), status = section.querySelector('[role=status]');
  search.addEventListener('input', () => {
    const needle = search.value.toLowerCase(); let visible = 0;
    for (const row of rows) {row.hidden = !row.textContent.toLowerCase().includes(needle); if (!row.hidden) visible++;}
    status.textContent = `${visible} of ${rows.length} rows`;
  });
  for (const button of section.querySelectorAll('th button')) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index), numeric = button.dataset.type === 'number', ascending = button.closest('th').getAttribute('aria-sort') !== 'ascending';
      for (const cell of section.querySelectorAll('th')) cell.removeAttribute('aria-sort');
      button.closest('th').setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      rows.sort((a, b) => {
        const aa = a.cells[index].dataset.value, bb = b.cells[index].dataset.value;
        if (aa === '') return bb === '' ? 0 : 1; if (bb === '') return -1;
        const order = numeric ? Number(aa) - Number(bb) : aa.localeCompare(bb);
        return (ascending ? order : -order) || Number(a.dataset.order) - Number(b.dataset.order);
      });
      body.append(...rows); status.textContent = `Sorted by ${button.textContent}, ${ascending ? 'ascending' : 'descending'}`;
    });
  }
}
