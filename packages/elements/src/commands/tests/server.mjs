import {fileURLToPath} from 'node:url';
import {startFixtureServer} from '../../../../../tooling/browser/fixture-server.mjs';
await startFixtureServer({root:fileURLToPath(new URL('../../../../../',import.meta.url)),fixtureRoot:fileURLToPath(new URL('.',import.meta.url)),port:Number(process.env.EN_COMMANDS_TEST_PORT??4419),label:'commands'});
