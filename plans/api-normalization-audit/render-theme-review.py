from pathlib import Path
import re,html
# Regenerate the retained review page after editing the theme audit Markdown.
# Run: python3 plans/api-normalization-audit/render-theme-review.py
root=Path(__file__).resolve().parent
names=['theme-overview','theme-decisions','theme-hierarchy','theme-scoping','theme-coverage','theme-functions','theme-readiness']
titles=['Theme customization','Decisions and cleanup','Hierarchy and feature groups','Scoping and runtime boundaries','Coverage and managed authoring','Functions and mixins','Three divergent themes']
def slug(s):return re.sub('[^a-z0-9]+','-',s.lower()).strip('-')
def inline(s):
 codes=[]
 def code(m):codes.append('<code>'+html.escape(m[1])+'</code>');return '\x00'+str(len(codes)-1)+'\x00'
 s=re.sub(r'`([^`]+)`',code,s);s=html.escape(s)
 def link(m):
  target=html.unescape(m[2]);label=m[1]
  if target.endswith('.md') and target[:-3] in names:return '<a href="#'+target[:-3]+'">'+label+'</a>'
  if target.endswith('.md') and target[:-3] in ['README','decisions','styles','tooling','forms','overlays','collections','editors','inventory']:target='/reviews/api-normalization.html?progress-report#'+target[:-3]
  if target=='theme-coverage.json':target='/reviews/theme-customization/theme-coverage.json'
  local_reviews={'http://127.0.0.1:47907/?progress-report','http://127.0.0.1:4508/theme-proof.html?progress-report'}
  if not(target in local_reviews or target.startswith(('https://','/reviews/','/theme-customization.html','/theme-states.html','/theme-authoring.html','/theme-composition.html','/theme-proof.html','#'))):return label+' <code>'+html.escape(target)+'</code>'
  return '<a href="'+html.escape(target,quote=True)+'">'+label+'</a>'
 s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,s);s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
 return re.sub(r'\x00(\d+)\x00',lambda m:codes[int(m[1])],s)
def cells(s):
 out=[];cur='';code=False
 for c in s.strip().strip('|'):
  if c=='`':code=not code
  if c=='|' and not code:out.append(cur.strip());cur=''
  else:cur+=c
 return out+[cur.strip()]
def render(text,prefix):
 lines=text.splitlines();out=[];i=0
 while i<len(lines):
  s=lines[i].strip()
  if not s:i+=1;continue
  if s.startswith('```'):
   block=[];i+=1
   while i<len(lines) and not lines[i].startswith('```'):block.append(lines[i]);i+=1
   out.append('<pre><code>'+html.escape('\n'.join(block))+'</code></pre>');i+=1;continue
  if s.startswith('|') and i+1<len(lines) and re.match(r'\|[ :|-]+\|',lines[i+1]):
   heads=cells(s);i+=2;rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):rows.append(cells(lines[i]));i+=1
   if prefix=='theme-decisions' and heads==['ID','Priority','Status','Proposal','Preferred direction','Alternatives to weigh','Primary evidence']:
    headers=''.join('<th scope="col" aria-sort="none"><button type="button" id="sort-priority" class="sort-priority" aria-label="Sort by priority, highest first">Priority <span aria-hidden="true">↕</span></button></th>' if c=='Priority' else '<th scope="col">'+inline(c)+'</th>' for c in heads)
    status_classes={'Partially published':'partially-published','Published':'published','Ready locally':'ready-locally','Active':'active','Not started':'not-started'}
    def status_cell(value):
     if value not in status_classes:raise ValueError('Unknown implementation status: '+value)
     return '<td><span class="implementation-status" data-status="'+status_classes[value]+'">'+inline(value)+'</span></td>'
    body=''.join('<tr data-priority="'+re.match(r'P(\d+)',row[1])[1]+'">'+''.join(status_cell(c) if index==2 else '<td>'+inline(c)+'</td>' for index,c in enumerate(row))+'</tr>' for row in rows)
    out.append('<div class="table-wrap" tabindex="0" role="region" aria-label="Theme proposal register, scroll for all columns"><table id="decision-register"><caption>Proposed theme customization changes</caption><thead><tr>'+headers+'</tr></thead><tbody>'+body+'</tbody></table></div><p id="priority-status" class="visually-hidden" role="status"></p>')
   else:
    out.append('<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable comparison table"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in heads)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>')
   continue
  h=re.match(r'^(#{1,6}) (.*)',s)
  if h:
   level=min(len(h[1])+1,6);out.append(f'<h{level} id="{prefix}-{slug(h[2])}">'+inline(h[2])+f'</h{level}>');i+=1;continue
  if re.match(r'^[-*] |^\d+\. ',s):
   ordered=bool(re.match(r'^\d+\. ',s));tag='ol' if ordered else 'ul';items=[]
   while i<len(lines) and re.match(r'^[-*] |^\d+\. ',lines[i].strip()):
    item=re.sub(r'^([-*]|\d+\.) ','',lines[i].strip());i+=1
    while i<len(lines) and lines[i].startswith('  ') and lines[i].strip():item+=' '+lines[i].strip();i+=1
    items.append('<li>'+inline(item)+'</li>')
   out.append('<'+tag+'>'+''.join(items)+'</'+tag+'>');continue
  para=[s];i+=1
  while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|[-*] |\d+\. )',lines[i].strip()):para.append(lines[i].strip());i+=1
  out.append('<p>'+inline(' '.join(para))+'</p>')
 return '\n'.join(out)
finding=re.compile(r'^#{2,3} ((?:THEME-|HIER-|SCOPE-|COVER-|FUNC-)\d+)(?:[. —].*)?$',re.M)
sections=[];total=0
for name,title in zip(names,titles):
 text=(root/(name+'.md')).read_text();text='\n'.join(text.splitlines()[1:]);content=[];buf=[];opened=False
 for line in text.splitlines():
  m=finding.match(line)
  if m or (opened and line.startswith('## ')):
   content.append(render('\n'.join(buf),name));buf=[]
   if opened:content.append('</details>');opened=False
   if m:
    ident=m[1];summary=re.sub(r'^#+ ','',line);content.append(f'<details class="finding" id="{ident}"><summary>'+inline(summary)+'</summary>');opened=True;total+=1;continue
  buf.append(line)
 content.append(render('\n'.join(buf),name))
 if opened:content.append('</details>')
 sections.append(f'<section id="{name}"><div class="section-heading"><h2>{title}</h2><a href="/reviews/theme-customization/{name}.md">Markdown</a></div>'+ '\n'.join(content)+'</section>')
nav=''.join(f'<a href="#{name}">{title}</a>' for name,title in zip(names,titles))
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Theme customization audit · En Rêve</title><link rel="stylesheet" href="/styles/tokens.css"><style>
:root{color-scheme:light dark;font:16px/1.6 system-ui,sans-serif;background:var(--en-color-canvas,#13171a);color:var(--en-color-text,#f3f4f6)}*{box-sizing:border-box}body{margin:0;overflow-wrap:anywhere}a{color:var(--en-color-link,#adc0ff);text-underline-offset:.18em}header{padding:2.5rem max(1rem,calc((100vw - 88rem)/2));border-bottom:1px solid var(--en-color-line,#3a4654)}header h1{font-size:clamp(2rem,5vw,3rem);line-height:1.15;margin:.4rem 0}header p{max-width:70ch}.eyebrow{letter-spacing:.1em;text-transform:uppercase;font-size:.78rem;font-weight:700}.layout{max-width:90rem;margin:auto;padding:2rem 1rem;display:grid;grid-template-columns:14rem minmax(0,1fr);gap:2rem}nav{position:sticky;top:1rem;align-self:start;display:grid;gap:.55rem}nav a{text-decoration:none;padding:.25rem .5rem;border-inline-start:2px solid var(--en-color-line,#3a4654)}main{min-width:0}section{scroll-margin-top:1rem;padding-block:0 2rem;margin-bottom:2rem;border-bottom:1px solid var(--en-color-line,#3a4654)}h2{line-height:1.25}h3,h4{line-height:1.4}.section-heading{display:flex;align-items:baseline;flex-wrap:wrap;gap:1rem;justify-content:space-between}.section-heading h2{font-size:1.6rem}.section-heading a{font-size:.875rem}p,li{max-width:90ch}li{margin-block:.4rem}code{font: .88em/1.5 ui-monospace,monospace;overflow-wrap:anywhere}pre{padding:1rem;overflow:auto;background:var(--en-color-surface,#1c2128);border-radius:.5rem}pre code{white-space:pre}.table-wrap{max-width:100%;overflow:auto;margin:1rem 0;border:1px solid var(--en-color-line,#3a4654);border-radius:.6rem}table{width:100%;border-collapse:collapse;font-size:.875rem}th,td{padding:.8rem;vertical-align:top;text-align:start;border-bottom:1px solid var(--en-color-line,#3a4654);min-width:8rem}th{background:var(--en-color-surface,#1c2128)}td:first-child,th:first-child{min-width:10rem}details.finding{margin:.8rem 0;padding:1rem;border:1px solid var(--en-color-line,#3a4654);border-radius:.65rem;background:var(--en-color-surface,#1c2128)}summary{cursor:pointer;font-weight:650;line-height:1.4}details[open] summary{margin-bottom:1rem}button{font:inherit;padding:.6rem .9rem;border:1px solid var(--en-color-line,#748295);border-radius:.45rem;background:var(--en-color-surface,#232b34);color:inherit;cursor:pointer}a:focus-visible,button:focus-visible,summary:focus-visible,.table-wrap:focus-visible{outline:2px solid var(--en-color-link,#adc0ff);outline-offset:3px}.actions{display:flex;gap:.7rem;flex-wrap:wrap;align-items:center}.return{position:fixed;bottom:max(1rem,env(safe-area-inset-bottom));right:1rem;padding:.65rem 1rem;border-radius:.5rem;background:var(--en-color-surface,#232b34);border:1px solid var(--en-color-line,#748295);z-index:2}footer{padding:1rem 1rem 6rem;text-align:center}@media(hover:hover){summary:hover,a:hover{text-decoration:underline}}@media(max-width:800px){.layout{grid-template-columns:1fr;gap:1rem}nav{position:static;grid-template-columns:repeat(2,minmax(0,1fr));font-size:.9rem}header{padding:1.4rem 1rem}th,td{padding:.6rem}details.finding{padding:.8rem}h3{font-size:1.2rem}}
.visually-hidden{position:absolute;inline-size:1px;block-size:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}#decision-register caption{text-align:start;padding:.8rem;font-weight:650}#decision-register th:first-child,#decision-register td:first-child{min-width:7rem;white-space:nowrap}#decision-register th:nth-child(2),#decision-register td:nth-child(2){min-width:8rem;white-space:nowrap}#decision-register th:nth-child(3),#decision-register td:nth-child(3){min-width:9rem;white-space:nowrap}.implementation-status{display:inline-block;border:1px solid currentColor;border-radius:999px;padding:.2rem .65rem;font-weight:600;font-size:.82rem}.implementation-status[data-status="published"]{color:var(--en-color-text);background:var(--en-color-canvas)}.implementation-status[data-status="active"]{color:var(--en-color-link)}.implementation-status[data-status="not-started"]{color:var(--en-color-text-muted,#b5beca)}#decision-register td:last-child{min-width:13rem}#decision-register td:last-child a{display:inline-block;white-space:nowrap;scroll-margin-inline:1rem}.sort-priority{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .5rem;margin:-.4rem -.5rem;min-block-size:2.75rem;white-space:nowrap}details.finding{scroll-margin-top:1rem}@media(hover:hover){.sort-priority:hover{text-decoration:underline}}
</style></head><body><header><div class="eyebrow">En Rêve · source audit · September 18, 2026</div><h1>One system. Many visual languages.</h1><p>Design tokens and CSS customization: system themes, feature groups, visual concepts and local scopes. Eight implemented decisions support three divergent themes. Current follow-up work and historical evidence are distinguished below.</p><p><strong>Implementation and follow-up review.</strong> THEME-01–08 are published; bounded follow-up work is authorized. Current implementation status is recorded in the decision register below. Publication does not imply review approval.</p><div class="actions"><button id="expand" type="button">Expand findings</button><button id="collapse" type="button">Collapse findings</button><a href="/reviews/theme-customization/theme-coverage.json">Download coverage inventory</a><a href="/reviews/api-normalization.html?progress-report">API audit</a></div></header><div class="layout"><nav aria-label="Audit sections">'''+nav+'''</nav><main>'''+ '\n'.join(sections)+'''</main></div><footer>Source references identify the audited repository revision. Counts describe metadata coverage, not defect totals.</footer><script>
const findings=[...document.querySelectorAll('details.finding')];document.querySelector('#expand').addEventListener('click',()=>findings.forEach(x=>x.open=true));document.querySelector('#collapse').addEventListener('click',()=>findings.forEach(x=>x.open=false));function reveal(){const id=decodeURIComponent(location.hash.slice(1));const el=document.getElementById(id);if(el?.tagName==='DETAILS')el.open=true;}addEventListener('hashchange',reveal);reveal();
const decisionTable=document.querySelector('#decision-register');
const priorityButton=document.querySelector('#sort-priority');
priorityButton.addEventListener('click',()=>{
 const header=priorityButton.closest('th');
 const ascending=header.getAttribute('aria-sort')!=='ascending';
 const rows=[...decisionTable.tBodies[0].rows];
 rows.sort((a,b)=>(Number(a.dataset.priority)-Number(b.dataset.priority))*(ascending?1:-1)||a.cells[0].textContent.localeCompare(b.cells[0].textContent));
 decisionTable.tBodies[0].append(...rows);
 header.setAttribute('aria-sort',ascending?'ascending':'descending');
 priorityButton.querySelector('span').textContent=ascending?'↑':'↓';
 priorityButton.setAttribute('aria-label',`Priority: ${ascending?'highest':'lowest'} first. Sort ${ascending?'lowest':'highest'} first.`);
 document.querySelector('#priority-status').textContent=`Proposals sorted by priority, ${ascending?'highest':'lowest'} first. Equal priorities are ordered by proposal ID.`;
});
decisionTable.addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');
 if(!link)return;
 const target=document.getElementById(link.hash.slice(1));
 if(target?.tagName!=='DETAILS')return;
 target.open=true;
 requestAnimationFrame(()=>{target.scrollIntoView({block:'start'});target.querySelector('summary')?.focus({preventScroll:true});});
});
if(new URLSearchParams(location.search).has('progress-report')){const a=document.createElement('a');a.className='return';a.href='http://127.0.0.1:4177/#review-theme-customization-review';a.textContent='Progress Report';document.body.append(a);}
</script></body></html>'''
(root/'theme-review.html').write_text(page)
print('Rendered',total,'review entries; HTML bytes',len(page.encode()))
