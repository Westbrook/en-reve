import { createFixtureScheduler } from '../shared/fixture-scheduler.js';
import type { ServiceContext } from '../shared/workflow.js';
import type { Asset, AssetReceipt } from './model.js';

/** A local fixture, with no transport or persistent project side effect. */
export function createAssetService() {
	const scheduler = createFixtureScheduler();
	let sequence = 0;
	return {
		insert(asset: Asset, context: ServiceContext): Promise<AssetReceipt> {
			return scheduler.respond(() => ({ sequence: ++sequence, assetId: asset.id, name: asset.name }), {
				action: 'asset.insert', signal: context.signal, delivery: { kind: 'delayed', milliseconds: 750 },
			});
		},
		reset() { scheduler.reset(); sequence = 0; },
		dispose() { scheduler.dispose(); },
	};
}
