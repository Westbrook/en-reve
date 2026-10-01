import {createElementActivation, type ElementActivationState} from '@en-reve/elements/activation.js';
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {elementLoaders} from '@en-reve/elements/lazy-manifest.js';
const scope=createElementScope({document});
const root=scope.createElement('section');
const activation=createElementActivation({scope,root,policy:'group',tags:['en-card'],loaders:elementLoaders,ready:async root=>{await (root.querySelector('en-card') as HTMLElement & {updateComplete:Promise<boolean>}).updateComplete;}});
const state:ElementActivationState=activation.state;void state;
await activation.load();await activation.activate({retry:true});activation.cancel();activation.dispose();
