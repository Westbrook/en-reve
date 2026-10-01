import {html} from 'lit';
import {EnActivityFeed,type ActivityRecord,type ActivityLoadDetail,type ActivityPage,EnCarousel,type CarouselItem} from '@en-reve/elements';
import type {ActivityRecord as SelectiveRecord} from '@en-reve/elements/activity-feed.js';
import type {CarouselItem as SelectiveSlide} from '@en-reve/elements/carousel.js';

const records:readonly SelectiveRecord[]=[{key:'update-1',author:'Mira',text:'Added a study',group:'Today'}];
const feed=new EnActivityFeed();
feed.items=records;
feed.renderItem=(record:ActivityRecord)=>html`${record.text}<a slot="actions" href="/activity">Review</a>`;
feed.mode='virtual';
feed.bufferItems([{key:'update-2',author:'Alex',text:'Shared a revision'}]);
const shown:boolean=feed.showUpdates();
const revealed:boolean=feed.scrollToKey('update-1',{behavior:'instant',block:'center',inline:'nearest',container:'nearest'});
feed.mode='paged';feed.pageSize=20;feed.goToPage(2);
feed.addEventListener('en-load',event=>{
 const request=(event as CustomEvent<ActivityLoadDetail>).detail;
 const signal:AbortSignal=request.signal;
 const result:ActivityPage={items:records,cursor:'older-2',hasMore:false};
 if(!signal.aborted)request.complete(result);
});
feed.requestOlder();feed.cancelLoad();feed.items=undefined;

const slides:readonly SelectiveSlide[]=[{key:'study-1',label:'Study one',thumbnail:'/study-thumb.jpg',caption:'A blue cover'}];
const carousel=new EnCarousel();carousel.items=slides;
carousel.renderItem=(slide:CarouselItem)=>html`<p>${slide.label}</p>`;
carousel.navigation='thumbnails';carousel.readingMode='list';carousel.pageSize=12;
const navigated:boolean=carousel.goToKey('study-1');
const key:string|undefined=carousel.currentKey;
carousel.items=undefined;
void [shown,revealed,navigated,key];
