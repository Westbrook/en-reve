// An absolute project-site <base> changes native fragment resolution. Preserve
// same-document navigation for anchors created after hydration, including links
// inside composed controls. Leave native activation, focus, modifiers and history
// to the browser. Static HTML anchors are bound during build finalization.
function localFragment(event: Event) {
  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLAnchorElement)) continue;
    const href = target.getAttribute('href');
    if (href?.startsWith('#')) target.href = new URL(href, location.href).href;
    break;
  }
}
for (const name of ['click', 'auxclick', 'contextmenu']) document.addEventListener(name, localFragment, {capture:true});
