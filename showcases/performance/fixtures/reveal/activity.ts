import {presenceActivityExample} from '../../../../apps/docs/src/presence-activity-demo.js';
import '@en-reve/elements/define/activity-feed.js';
import '@en-reve/elements/define/avatar.js';
import '@en-reve/elements/define/presence-group.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/skeleton.js';
import {installRevealFixture} from './core.js';

installRevealFixture({workload:'activity',template:()=>presenceActivityExample(),selector:'#large-activity-history',count:160,targetKey:'history-119',startKey:'history-0',farKey:'history-79'});
