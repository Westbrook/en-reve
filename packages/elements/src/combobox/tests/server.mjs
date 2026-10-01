import {fileURLToPath} from 'node:url';
import {startFixtureServer} from '../../../../../tooling/browser/fixture-server.mjs';
await startFixtureServer({root:fileURLToPath(new URL('../../../../../',import.meta.url)),fixtureRoot:fileURLToPath(new URL('.',import.meta.url)),port:Number(process.env.EN_COMBOBOX_TEST_PORT??4405),label:'combobox'});
