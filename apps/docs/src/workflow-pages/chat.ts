import '../composable-chat-demo.js';
import { WorkflowsApp } from '../workflows-app.js';
import type { WorkflowDefinition } from './definition.js';
import { createChatWorkflow, chatStyles } from '../workflows/chat/index.js';
import source from '../generated/workflow-chat.js';

export class ChatWorkflowApp extends WorkflowsApp {
	static definition: WorkflowDefinition = {
		id: 'chat',
		pageTitle: 'Chat-to-action workflow',
		heading: 'Chat to action',
		description: 'Bring the next useful control into the conversation, with clear ownership of each change.',
		sourceTitle: 'chat workflow',
		fixtureNote: 'Assistant replies, image changes, and collaborator updates use local fixtures in this tab. Use the review scenarios to explore suggestions and recovery; reset the workflow to try again.',
		styles: chatStyles,
		source,
		create: createChatWorkflow,
	};
}
