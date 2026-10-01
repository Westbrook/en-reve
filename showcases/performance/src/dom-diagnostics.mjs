export async function domDiagnostics(page) {
  return page.evaluate(() => {
    const tags = {},
      sheets = new Set(),
      result = {
        connectedNodes: 0,
        connectedElements: 0,
        openShadowRoots: 0,
        styleElements: 0,
        stylesheetAdoptions: 0,
        uniqueAdoptedStylesheets: 0,
        note: "Connected DOM including accessible open shadow roots. Closed roots are not inspected. CDP DOM counters additionally include retained/detached nodes and are not equivalent.",
      };
    function visit(node) {
      result.connectedNodes++;
      if (node instanceof Element) {
        result.connectedElements++;
        tags[node.localName] = (tags[node.localName] || 0) + 1;
        if (node.localName === "style") result.styleElements++;
      }
      if (node.shadowRoot) {
        result.openShadowRoots++;
        visit(node.shadowRoot);
      }
      if (node.adoptedStyleSheets)
        for (const sheet of node.adoptedStyleSheets) {
          result.stylesheetAdoptions++;
          sheets.add(sheet);
        }
      for (const child of node.childNodes) visit(child);
    }
    visit(document);
    result.uniqueAdoptedStylesheets = sheets.size;
    result.elementsByTag = Object.fromEntries(
      Object.entries(tags).sort((a, b) => b[1] - a[1]),
    );
    return result;
  });
}
