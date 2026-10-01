import type { Plugin } from 'vite';
export type TemplateSourceRule = string | URL | RegExp | ((id: string) => boolean);
/** Use identical options for the client and server render builds. */
export declare function minifyLitTemplates(options: {
  include: TemplateSourceRule | TemplateSourceRule[];
  exclude?: TemplateSourceRule | TemplateSourceRule[];
}): Plugin;
