import {html} from 'lit';
import '../../../../apps/docs/src/document-scroll-demo.js';
import {installRevealFixture} from './core.js';

installRevealFixture({workload:'document',template:()=>html`<section id="before"><h1>Document collection</h1><p>500 native rows with 48px/24px sticky insets.</p></section><document-scroll-demo></document-scroll-demo><section id="after">End of collection</section>`,selector:'document-scroll-demo',count:500,targetKey:'row-150',startKey:'row-0',farKey:'row-350'});
