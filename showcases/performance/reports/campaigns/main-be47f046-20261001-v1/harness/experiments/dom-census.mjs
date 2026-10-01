// Physical connected tree, visiting light children and open shadow roots once.
// Slotted children are not traversed again; template.content and closed/UA roots are excluded.
export function censusInPage({system}) {
  const dateRoot=['en-reve','web-awesome'].includes(system)
    ? document.querySelector('#project-date')
    : [...document.querySelector('#showcase-project .pair').children].find(e=>e.textContent.includes('Review date'));
  if(!dateRoot || !(dateRoot.textContent.includes('Review date') || dateRoot.getAttribute('label')==='Review date')) throw new Error('Date field boundary missing: '+system);
  const hiddenDateInput=system==='spectrum-react'?document.querySelector('#showcase-project .pair > [data-testid=hidden-dateinput-container]'):null;
  if(system==='spectrum-react'&&!hiddenDateInput)throw new Error('Missing owned hidden date input');
  const dateRoots=[dateRoot,hiddenDateInput,...(window.__domReviewDatePortals||[])].filter(e=>e?.isConnected);
  const empty=()=>({nodes:0,elements:0,text:0,whitespaceText:0,comments:0,shadowRoots:0,other:0,customElements:0,slots:0,svgElements:0,baseParts:0,maxDepth:0});
  const total=empty(),date=empty(),withoutDate=empty(),byCard={},byCardWithoutDate={},byOwner={},baseOwners={},tags={},comments={};
  const records=[];
  function add(b,n,depth){
    b.nodes++;b.maxDepth=Math.max(b.maxDepth,depth);
    if(n.nodeType===1){b.elements++;if(n.localName.includes('-'))b.customElements++;if(n.localName==='slot')b.slots++;if(n.namespaceURI==='http://www.w3.org/2000/svg')b.svgElements++;if(n.part?.contains('base'))b.baseParts++;}
    else if(n.nodeType===3){b.text++;if(!n.textContent.trim())b.whitespaceText++;}
    else if(n.nodeType===8)b.comments++;
    else if(n instanceof ShadowRoot)b.shadowRoots++;
    else b.other++;
  }
  function walk(n,depth=0,card='outside-cards',owner='document/app',inDate=false){
    if(!n.isConnected)throw new Error('Disconnected traversal');
    if(n.nodeType===1){
      if(n.matches('.showcase-card'))card=n.id;
      if(n.localName.includes('-'))owner=n.localName;
      inDate ||= dateRoots.includes(n);
      if(n.localName==='input'&&n.type==='date'&&!inDate)throw new Error('Native date input outside exclusion boundary');
      tags[n.localName]=(tags[n.localName]||0)+1;
    }
    add(total,n,depth);add(inDate?date:withoutDate,n,depth);
    add(byCard[card]??=empty(),n,depth);if(!inDate)add(byCardWithoutDate[card]??=empty(),n,depth);
    const own=byOwner[owner]??={all:empty(),withoutDate:empty()};add(own.all,n,depth);if(!inDate)add(own.withoutDate,n,depth);
    if(n.nodeType===8){const type=/^\?lit\$/.test(n.textContent)?'lit-expression-marker':n.textContent===''?'empty-comment':n.textContent==='?'?'question-marker':'other-comment';comments[type]=(comments[type]||0)+1;}
    if(n.nodeType===1 && n.part?.contains('base')){
      const host=n.getRootNode().host;
      const key=(host?.localName||'light-dom')+' / '+n.localName;
      const b=baseOwners[key]??={owner:host?.localName||'light-dom',tag:n.localName,count:0,withoutDate:0,roles:[],displays:[]};b.count++;if(!inDate)b.withoutDate++;
      const style=getComputedStyle(n);const role=n.getAttribute('role');if(role&&!b.roles.includes(role))b.roles.push(role);if(!b.displays.includes(style.display))b.displays.push(style.display);
      records.push({owner:b.owner,tag:n.localName,card,inDate,role,tabindex:n.getAttribute('tabindex'),id:n.id||null,parts:n.getAttribute('part'),children:n.childElementCount,display:style.display,position:style.position,overflow:style.overflow,hostDisplay:host?getComputedStyle(host).display:null});
    }
    if(n.shadowRoot)walk(n.shadowRoot,depth+1,card,owner,inDate);
    for(const child of n.childNodes)walk(child,depth+1,card,owner,inDate);
  }
  walk(document);
  if(total.nodes!==total.elements+total.text+total.comments+total.shadowRoots+total.other)throw new Error('Type partition failed');
  if(total.nodes!==date.nodes+withoutDate.nodes)throw new Error('Date partition failed');
  const cardTotal=Object.values(byCard).reduce((n,b)=>n+b.nodes,0);if(cardTotal!==total.nodes)throw new Error('Card partition failed');
  const ownedTotal=Object.values(byOwner).reduce((n,b)=>n+b.all.nodes,0);if(ownedTotal!==total.nodes)throw new Error('Owner partition failed');
  return {total,date,withoutDate,byCard,byCardWithoutDate,byOwner,baseOwners,baseInstances:records,elementsByTag:tags,commentKinds:comments,dateBoundaries:dateRoots.map(e=>({tag:e.localName,id:e.id,role:e.getAttribute('role'),label:e.getAttribute('label')||e.getAttribute('aria-label'),parentTag:e.parentElement?.localName,testId:e.dataset.testid})),dateInputValue:dateRoot.value??dateRoot.querySelector('input')?.value,cardCount:Object.keys(byCard).filter(k=>k!=='outside-cards').length};
}
