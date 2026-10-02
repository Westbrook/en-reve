import{t as e}from"./rolldown-runtime-B0lUwjiP.js";var t;function n(){return(n=e((()=>{t=`import '@en-reve/elements/define/activity-feed.js';
import '@en-reve/elements/define/activity-item.js';
import '@en-reve/elements/define/avatar.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/presence.js';
import '@en-reve/elements/define/presence-group.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/skeleton.js';
import {html,nothing} from 'lit';
import {AsyncDirective,directive} from 'lit/async-directive.js';
import {repeat} from 'lit/directives/repeat.js';
import {ref as historyRef} from 'lit/directives/ref.js';
import {guard} from 'lit/directives/guard.js';

type Entry={id:number;author:string;text:string;time:string;attachment?:boolean};
const initial:Entry[]=[{id:2,author:'Mira Chen',text:'Added the quieter cover image for review.',time:'10:15',attachment:true},{id:1,author:'Jules Martin',text:'Updated the project brief. Please review the revised direction.',time:'09:40'}];
/** Application-owned finite history. No connection or real collaborator presence is implied. */
class PresenceActivityDemo extends AsyncDirective {
 private key:unknown;
 private people=['Mira Chen','Jules Martin','Sam Rivera','Alex Kim','Taylor Lee'];
 private away=false;
 private entries=[...initial];
 private buffered:Entry[]=[];
 private older:Entry[]=[];
 private nextId=3;
 private loading=false;
 private failed=false;
 private announcement='';
 private olderAnnouncement='';
 private refresh(){if(this.isConnected)this.setValue(this.render(this.key));}
 private incoming(){this.buffered.unshift({id:this.nextId++,author:'Sam Rivera',text:'Left a new comment on the cover study.',time:'10:30'});this.announcement=\`\${this.buffered.length} new update\${this.buffered.length===1?'':'s'} available. Choose Show updates when ready.\`;this.refresh();}
 private request=(event:CustomEvent<{action:string}>)=>{
  // Wait until every consuming listener has had the opportunity to cancel.
  queueMicrotask(()=>{
   if(!this.isConnected||event.defaultPrevented)return;
   if(event.detail.action==='show-updates'){
    const count=this.buffered.length;this.entries=[...this.buffered,...this.entries];this.buffered=[];this.announcement=\`Showing \${count} new update\${count===1?'':'s'}.\`;this.refresh();
   }else if(event.detail.action==='load-more'&&!this.loading){this.loading=true;this.failed=false;this.olderAnnouncement='Loading one older update.';this.refresh();}
  });
 };
 private settle(success:boolean){if(!this.loading)return;this.loading=false;this.failed=!success;if(success){this.older=[...this.older,{id:this.nextId++,author:'Alex Kim',text:'Created the first cover study.',time:'16:20'}];this.olderAnnouncement='Loaded one older update.';}else this.olderAnnouncement='Older activity could not be loaded. Existing entries are unchanged. Use Retry older activity.';this.refresh();}
 private piece(content:unknown,loading:boolean,shape='text'){return html\`<span class="activity-piece" ?data-placeholder=\${loading}><span class="activity-piece-content">\${content}</span>\${loading?html\`<en-skeleton shape=\${shape}></en-skeleton>\`:nothing}</span>\`;}
 private item=(entry:Entry)=>this.activity(entry,false);
 private activity(entry:Entry,loading:boolean){return html\`<en-activity-item ?data-activity-placeholder=\${loading} ?inert=\${loading} aria-hidden=\${loading?'true':nothing} data-entry=\${entry.id} author=\${entry.author} label=\${\`\${entry.author}: \${entry.text}\`} datetime=\${\`\${this.older.includes(entry)?'2026-09-14':'2026-09-15'}T\${entry.time}:00\`} time-label=\${entry.time}>
  <span slot="avatar">\${this.piece(html\`<en-avatar name=\${entry.author} size="small"></en-avatar>\`,loading,'circle')}</span>
  <span slot="author">\${this.piece(entry.author,loading)}</span><span slot="metadata">\${this.piece(entry.time,loading)}</span>
  \${this.piece(entry.text,loading)}
  \${entry.attachment?html\`<figure slot="attachments"><svg role="img" aria-label="Blue cover study with a soft diagonal accent" viewBox="0 0 320 120"><rect width="320" height="120" fill="#243657"></rect><path d="M0 120 170 0h150v120Z" fill="#5577cc"></path><circle cx="250" cy="38" r="24" fill="#aac1ff"></circle></svg><figcaption>Cover study · revision 2</figcaption></figure>\`:nothing}
  <span slot="actions">\${this.piece(html\`<en-button variant="ghost" @click=\${()=>{this.announcement=\`Reviewing \${entry.author}’s update from \${entry.time}. This demo keeps the original context in place.\`;this.refresh();}}>Review update<span class="collaboration-sr"> by \${entry.author} at \${entry.time}</span></en-button>\`,loading,'rectangle')}</span>
 </en-activity-item>\`;}
 override render(key?:unknown){this.key=key;return html\`<section data-presence-activity-demo aria-label="Presence and activity simulation">
 <style>
 [data-presence-activity-demo]{display:grid;gap:var(--en-space-panel);min-inline-size:0;}
 [data-presence-activity-demo] h3,[data-presence-activity-demo] h4,[data-presence-activity-demo] p{margin-block:0;}
 [data-presence-activity-demo] .collaboration-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
 [data-presence-activity-demo] .collaboration-controls{display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2);}
 [data-presence-activity-demo] .collaboration-section{display:grid;gap:var(--en-space-3);}
 [data-presence-activity-demo] figure{margin:0;max-inline-size:20rem;}
 [data-presence-activity-demo] svg{display:block;inline-size:100%;border-radius:var(--en-radius-control);}
 [data-presence-activity-demo] figcaption{font-size:.875em;margin-block-start:var(--en-space-2);color:var(--en-color-text-muted);}
 [data-presence-activity-demo] en-activity-feed::part(updates),[data-presence-activity-demo] en-activity-feed::part(load-more){justify-self:start;}
 [data-presence-activity-demo] en-activity-item>[slot="actions"]{display:block;}
 [data-presence-activity-demo] .activity-piece{display:inline-grid;position:relative;max-inline-size:100%;vertical-align:middle;}
 [data-presence-activity-demo] .activity-piece[data-placeholder]>.activity-piece-content{visibility:hidden;}
 [data-presence-activity-demo] .activity-piece>en-skeleton{position:absolute;inset:0;--en-skeleton-size:100%;}
 [data-presence-activity-demo] .activity-piece>en-skeleton::part(base){inline-size:100%;block-size:100%;}
 [data-presence-activity-demo] #activity-feed-example::part(loading){display:none;}
 [data-presence-activity-demo] .older-activity{display:grid;gap:var(--en-space-3);}
 [data-presence-activity-demo] .older-status{color:var(--en-color-text-muted);}
 [data-presence-activity-demo] .older-activity en-activity-feed::part(announcement){display:none;}
 </style>
 <h3>Cover study collaboration</h3><p>Simulated collaborators and project history. Nothing is connected to a service or saved outside this page.</p>
 <div class="collaboration-section"><h4>People in this project</h4>
 <en-presence-group id="presence-group-example" label="Cover study collaborators" max="3">
 \${repeat(this.people,name=>name,(name,index)=>html\`<en-presence id=\${index===0?'presence-example':''} name=\${name} status=\${index===0?(this.away?'away':'online'):index===1?'busy':index===2?'away':'offline'}></en-presence>\`)}
 </en-presence-group>
 <div class="collaboration-controls"><en-button variant="secondary" @click=\${()=>{this.away=!this.away;this.refresh();}}>Toggle Mira’s availability</en-button><en-button variant="secondary" @click=\${()=>{this.people=this.people.includes('Casey Patel')?this.people.filter(name=>name!=='Casey Patel'):[...this.people,'Casey Patel'];this.refresh();}}>Toggle Casey’s membership</en-button></div></div>
 <div class="collaboration-section" id="presence-actions-example"><h4>Presence as a project link</h4>
 <p>Activate Mira’s identity to view her projects. The entire surface is one link; this example opens the Asset Browser as a sample project destination.</p>
 <div class="collaboration-controls"><en-presence name="Mira Chen" status="online" href="/workflows/assets?progress-report"></en-presence></div>
 </div>
 <div class="collaboration-section"><h4>Project activity</h4>
 <div class="collaboration-controls"><en-button variant="secondary" @click=\${()=>this.incoming()}>Simulate incoming update</en-button><en-button variant="secondary" @click=\${()=>{this.entries=this.entries.length?[]:[...initial];this.older=[];this.loading=false;this.failed=false;this.olderAnnouncement='';this.announcement=this.entries.length?'Sample activity restored.':'Activity cleared for the empty-state example.';this.refresh();}}>Toggle empty state</en-button></div>
 <en-activity-feed id="activity-feed-example" label="September 15 project activity" updates has-more .pending=\${this.buffered.length} .loading=\${this.loading} .empty=\${!this.entries.length} .moreLabel=\${this.failed?'Retry older activity':'Load older activity'} .announcement=\${this.announcement} @en-action=\${this.request}>
 <h4 slot="header">September 15, 2026</h4>
 \${repeat(this.entries,entry=>entry.id,this.item)}
 <p slot="empty">No activity for this date. Restore the samples or receive a new update.</p>
 <span slot="loading"></span>
 </en-activity-feed>
 <div class="older-activity" role="group" aria-label="Older project activity">
 \${this.older.length||this.loading?html\`<en-activity-feed label="September 14 project activity" .loading=\${this.loading} .empty=\${!this.older.length}><h4 slot="header">September 14, 2026</h4>\${repeat(this.older,entry=>entry.id,this.item)}
 <div slot="loading">\${this.loading?this.activity({id:this.nextId,author:'Alex Kim',text:'Created the first cover study.',time:'16:20'},true):nothing}</div>
 </en-activity-feed>\`:nothing}
 <p class="older-status" role="status" aria-atomic="true">\${this.olderAnnouncement||nothing}</p>
 </div>
 <details open><summary>Load simulation controls</summary><p>Loading waits for your choice, so focus, reading position and error recovery can be inspected.</p><div class="collaboration-controls"><en-button variant="secondary" aria-disabled=\${String(!this.loading)} @click=\${()=>this.settle(true)}>Complete load</en-button><en-button variant="secondary" aria-disabled=\${String(!this.loading)} @click=\${()=>this.settle(false)}>Fail load</en-button></div></details>
 </div></section>\`;}
}
const presenceActivity=directive(PresenceActivityDemo);
export function presenceActivityExample(key?:unknown){return html\`\${presenceActivity(key)}\${activityHistory()}\`;}

/** Larger, data-driven history. A real app supplies records/transport, never a hidden fetch in the component. */
class ActivityHistoryDemo extends AsyncDirective {
 private feed?:import('@en-reve/elements/activity-feed.js').EnActivityFeed;
 private readonly initialHistory=this.records(0,160);
 private request?:import('@en-reve/elements/activity-feed.js').ActivityLoadDetail;
 private newCount=0;
 private mode:'virtual'|'paged'|'list'='virtual';
 private status='160 loaded updates. Choose paginated reading for a complete, stable accessibility tree on each page.';
 private records(start:number,count:number):import('@en-reve/elements/activity-feed.js').ActivityRecord[]{return Array.from({length:count},(_,offset)=>{
  const index=start+offset,day=17-Math.floor(index/20),date=new Date(Date.UTC(2026,8,day));
  return {key:\`history-\${index}\`,author:['Mira Chen','Jules Martin','Sam Rivera'][index%3]!,text:\`Activity \${String(index+1).padStart(3,'0')}: \${index%4===0?'Added a new visual study with notes about contrast, composition and the next round of project review.':'Updated the project brief for review.'}\`,datetime:date.toISOString(),timeLabel:\`\${String(17-index%12).padStart(2,'0')}:30\`,group:new Intl.DateTimeFormat('en',{dateStyle:'long',timeZone:'UTC'}).format(date)};
 });}
 private refresh(){if(this.isConnected)this.setValue(this.render());}
 private loaded=(event:CustomEvent<import('@en-reve/elements/activity-feed.js').ActivityLoadDetail>)=>{
  queueMicrotask(()=>{if(event.defaultPrevented||event.detail.signal.aborted)return;this.request=event.detail;this.status='Loading 40 older updates. Complete, fail or cancel this local simulation.';if(this.feed)this.feed.announcement=this.status;
   event.detail.signal.addEventListener('abort',()=>{if(this.request===event.detail){this.request=undefined;this.status='Loading canceled. Previously loaded history is unchanged.';if(this.feed)this.feed.announcement=this.status;this.refresh();}},{once:true});this.refresh();});
 };
 private finish(success:boolean){const request=this.request;if(!request)return;this.request=undefined;if(success){const start=Number(request.cursor)||160;request.complete({items:this.records(start,40),cursor:String(start+40),hasMore:start+40<320});this.status='40 older updates loaded. Existing entries and reading position are retained.';}else{request.fail('Could not load older activity. Your loaded history is unchanged.');this.status='Older activity failed. Use Retry older activity.';}if(this.feed)this.feed.announcement=this.status;this.refresh();}
 private loadingPiece(content:unknown,shape='text'){return html\`<span class="history-placeholder-piece"><span>\${content}</span><en-skeleton shape=\${shape}></en-skeleton></span>\`;}
 private loadingPreview(){const item=this.records(Number(this.feed?.cursor)||160,1)[0]!;return html\`<en-activity-item class="history-placeholder" .embedded=\${true} aria-hidden="true" inert><span slot="avatar">\${this.loadingPiece(html\`<en-avatar name=\${item.author} size="small"></en-avatar>\`,'circle')}</span><span slot="author">\${this.loadingPiece(item.author)}</span><span slot="metadata">\${this.loadingPiece(item.timeLabel)}</span>\${this.loadingPiece(item.text)}<span slot="actions">\${this.loadingPiece(html\`<en-button variant="ghost">Review update</en-button>\`,'rectangle')}</span></en-activity-item>\`;}
 private renderRecord=(item:import('@en-reve/elements/activity-feed.js').ActivityRecord)=>html\`<en-avatar slot="avatar" name=\${item.author} size="small"></en-avatar>\${item.text}<en-button slot="actions" variant="ghost" @click=\${()=>{this.status=\`Reviewing \${item.key}. This action leaves the history in place.\`;if(this.feed)this.feed.announcement=this.status;this.refresh();}}>Review update<span class="history-sr"> \${item.key}</span></en-button>\`;
 override render(){return html\`<section id="activity-history-example" data-activity-history-demo aria-labelledby="activity-history-title">
 <style>
 [data-activity-history-demo]{display:grid;gap:var(--en-space-3);min-inline-size:0;margin-block-start:var(--en-space-panel)}
 [data-activity-history-demo] h3,[data-activity-history-demo] p{margin-block:0}
 [data-activity-history-demo] .history-tools{display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-2)}
 [data-activity-history-demo] en-select{min-inline-size:min(16rem,100%)}
 [data-activity-history-demo] en-activity-feed{--en-activity-viewport-size:30rem}
 [data-activity-history-demo] en-activity-feed::part(updates),[data-activity-history-demo] en-activity-feed::part(load-more),[data-activity-history-demo] en-activity-feed::part(cancel-load){justify-self:start}
 [data-activity-history-demo] .history-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
 [data-activity-history-demo] .history-placeholder-piece{display:inline-grid;position:relative;max-inline-size:100%;vertical-align:middle}
 [data-activity-history-demo] .history-placeholder-piece>span{visibility:hidden}
 [data-activity-history-demo] .history-placeholder-piece>en-skeleton{position:absolute;inset:0;--en-skeleton-size:100%}
 [data-activity-history-demo] .history-placeholder-piece>en-skeleton::part(base){inline-size:100%;block-size:100%}
 [data-activity-history-demo] pre{white-space:pre-wrap;overflow-wrap:anywhere}
 </style>
 <h3 id="activity-history-title">Large activity history</h3><p>A measured virtual list and a full-page reading alternative share the same keyed records. Buffer arrivals while reading, load earlier dates, and inspect cancellation or retry. No network service is connected.</p>
 <div class="history-tools"><en-select label="History display" .value=\${this.mode} .items=\${[{value:'virtual',label:'Virtual scrolling'},{value:'paged',label:'Paginated reading'},{value:'list',label:'All loaded entries'}]} @en-change=\${(event:Event)=>{const select=event.currentTarget as HTMLElement&{value:'virtual'|'paged'|'list'};queueMicrotask(()=>{if(!event.defaultPrevented){this.mode=select.value;this.refresh();}});}}></en-select>
 <en-button variant="secondary" @click=\${()=>{const number=++this.newCount;this.feed?.bufferItems([{key:\`incoming-\${number}\`,author:'Mira Chen',text:\`New arrival \${number}: Added a fresh review note.\`,group:'September 18, 2026',datetime:'2026-09-18T10:30:00Z',timeLabel:'10:30'}]);this.status=\`\${this.feed?.pendingCount??0} new updates buffered. Reading position is unchanged until you choose to navigate.\`;if(this.feed)this.feed.announcement=this.status;this.refresh();}}>Buffer new activity</en-button>
 <en-button variant="secondary" @click=\${()=>{const key=this.feed?.items?.[0]?.key;if(key)this.feed?.scrollToKey(key,{block:'start',behavior:'instant',container:'nearest'});}}>Jump to newest</en-button>
 <en-button variant="secondary" @click=\${()=>this.feed?.scrollToKey('history-119',{block:'center',behavior:'instant',container:'nearest'})}>Reveal activity 120</en-button></div>
 <en-activity-feed \${historyRef((element)=>{this.feed=element as typeof this.feed;})} id="large-activity-history" label="Project activity history" updates has-more cursor="160" .mode=\${this.mode} page-size="20" .items=\${guard([],()=>this.initialHistory)} .renderItem=\${this.renderRecord} @en-load=\${this.loaded}>
 <p slot="empty">No activity has been loaded.</p><div slot="loading">\${this.loadingPreview()}</div>
 </en-activity-feed>
 <details open><summary>Older-page simulation</summary><p>Requests wait for your choice. Cancel aborts the request; late responses are ignored. Loading and errors leave all existing entries readable.</p><div class="history-tools"><en-button variant="secondary" aria-disabled=\${String(!this.request)} @click=\${()=>this.finish(true)}>Complete older page</en-button><en-button variant="secondary" aria-disabled=\${String(!this.request)} @click=\${()=>this.finish(false)}>Fail older page</en-button></div></details>
 <p>\${this.status}</p>
 <details><summary>Keyed activity history source</summary><pre><code>\${\`import {html} from 'lit';
import {guard} from 'lit/directives/guard.js';
import '@en-reve/elements/define/activity-feed.js';
import type { ActivityLoadRequestEvent } from '@en-reve/elements/activity-feed.js';

html\\\`<en-activity-feed .items=\\\${guard([records], () => records)} mode="virtual" updates has-more
  .renderItem=\\\${item => html\\\`\\\${item.text}
    <en-button slot="actions">Review update</en-button>\\\`}
  @en-load-request=\\\${loadOlder}></en-activity-feed>\\\`;
// records: [{key:'update-1', author:'Mira', text:'Added a study',
//   group:'September 17, 2026', datetime:'2026-09-17T10:30:00Z', timeLabel:'10:30'}]
function loadOlder(event: ActivityLoadRequestEvent): void {
  const {cursor, signal} = event.detail;
  event.respondWith(Promise.resolve().then(() => {
    signal.throwIfAborted();
    return application.loadHistory({cursor, signal});
  }));
}
feed.bufferItems(newestFirstArrivals); // does not shift the visible history
feed.showUpdates();                  // merges keys; virtual anchor stays stable
feed.scrollToKey('update-1', {block:'start', container:'nearest'});
feed.mode = 'paged';                  // no virtualization within a reading page
feed.pageSize = 20;
feed.goToPage(2);                     // cancelable en-page-change
feed.cancelLoad();                   // aborts the current request lease
// Keep concise loading/outcome announcements in feed.announcement.
// Never assign role="feed" without implementing the separate ARIA feed contract.\`}</code></pre></details>
 </section>\`;}
}
const activityHistory=directive(ActivityHistoryDemo);`})))()}n();export{t as default};
//# sourceMappingURL=presence-activity-source-BTIKOe16.js.map