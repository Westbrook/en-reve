/** Context Protocol composition; importing this module registers no custom elements. */
export { ContextRoot, createContext } from '@lit/context';
export { ContextProvider } from './internal/context-provider.js';
export { editorExtensionContext, richEditorCommandContext, type RichEditorCommandHost } from './editor/context.js';
export { editorMessagesContext, colorMessagesContext } from './messages-context.js';
export { carouselContext, type CarouselPresentationService, type CarouselSlideContext } from './internal/carousel-context.js';
