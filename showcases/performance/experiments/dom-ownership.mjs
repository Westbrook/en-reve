// Supplemental structural attribution. Root ownership excludes consumer light DOM.
export function ownershipInPage({system}) {
 const root=document;const empty=()=>({nodes:0,elements:0,text:0,whitespaceText:0,comments:0,shadowRoots:0,slots:0,baseParts:0,instances:0});
 const byShadowHost={},dateZones={},slotUsage={},comments={};
 const dateRoot=['en-reve','web-awesome'].includes(system)?document.querySelector('#project-date'):[...document.querySelector('#showcase-project .pair').children].find(e=>e.textContent.includes('Review date'));
 const hiddenDateInput=system==='spectrum-react'?document.querySelector('#showcase-project .pair > [data-testid=hidden-dateinput-container]'):null;
 const bucketName=n=>n instanceof ShadowRoot?n.host.localName:n.getRootNode().host?.localName||'light-dom/document';
 function increment(b,n){b.nodes++;if(n.nodeType===1){b.elements++;if(n.localName==='slot')b.slots++;if(n.part?.contains('base'))b.baseParts++;}else if(n.nodeType===3){b.text++;if(!n.textContent.trim())b.whitespaceText++;}else if(n.nodeType===8)b.comments++;else if(n instanceof ShadowRoot){b.shadowRoots++;b.instances++;}}
 const elements=[];
 function visit(n,dateZone=null){
  if(n===dateRoot||n===hiddenDateInput)dateZone='field-shell';
  if(n.nodeType===1&&dateZone){if(n.localName==='en-dialog')dateZone='overlay-shell';if(n.localName==='en-calendar')dateZone='calendar';if(dateZone==='calendar'&&n.localName==='en-button')dateZone='calendar-navigation-button';if(dateZone?.startsWith('calendar')&&n.localName==='en-icon')dateZone='calendar-navigation-icon';}
  increment(byShadowHost[bucketName(n)]??=empty(),n);if(dateZone)increment(dateZones[dateZone]??=empty(),n);
  if(n.nodeType===1){elements.push(n);if(n.localName==='slot'){const owner=n.getRootNode().host?.localName||'light-dom';const b=slotUsage[owner]??={slots:0,assigned:0,unassigned:0,withFallbackElements:0};b.slots++;if(n.assignedNodes().length)b.assigned++;else b.unassigned++;if(n.children.length)b.withFallbackElements++;}}
  if(n.nodeType===8){const text=n.textContent.replace(/lit\$\d+\$/g,'lit$<id>$');comments[text]=(comments[text]||0)+1;}
  if(n.shadowRoot)visit(n.shadowRoot,dateZone);for(const c of n.childNodes)visit(c,dateZone);
 }
 visit(root);
 const samples={};for(const owner of ['en-card','en-button','en-date-picker','en-calendar']){const e=elements.find(e=>e.localName===owner);if(e)samples[owner]={host:e.outerHTML,shadow:e.shadowRoot?.innerHTML};}
 return{byShadowHost,dateZones,slotUsage,comments,templateSamples:samples};
}
