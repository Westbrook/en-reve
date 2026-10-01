export {version,definitions,ready} from './one.mjs';
import {template as render} from './one.mjs';
export async function template(snapshot){await new Promise(resolve=>setTimeout(resolve,10000));return render(snapshot);}
