import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnActivityFeed} from '../activity-feed.js';
import {activityItemDefinition} from './activity-item.js';
import {buttonDefinition} from './button.js';

/** Registration metadata only; importing this module does not define elements. */
export const activityFeedDefinition = {
  tagName: 'en-activity-feed',
  elementClass: EnActivityFeed,
  dependencies: [activityItemDefinition, buttonDefinition],
} as const satisfies ElementDefinition;
