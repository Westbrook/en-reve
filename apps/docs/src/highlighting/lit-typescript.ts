import typescript from 'microlighter/grammars/typescript.js';
import markup from 'microlighter/grammars/html.js';

/** Project grammar composed from Microlighter's public grammar modules. */
type Rule = {
	include?: string;
	match?: string;
	begin?: string;
	end?: string;
	name?: string;
	patterns?: Rule[];
	captures?: Record<number, { name: string }>;
	beginCaptures?: Record<number, { name: string }>;
	endCaptures?: Record<number, { name: string }>;
};

const punctuation = { name: 'punctuation.definition.template' };
const interpolation: Rule = {
	begin: '\\$\\{',
	end: '\\}',
	beginCaptures: { 0: punctuation },
	endCaptures: { 0: punctuation },
	patterns: [{ include: '#balanced-braces' }, { include: '$self' }],
};

const quotedAttribute = (quote: '"' | "'"): Rule => ({
	begin: `\\s+([.?@]?[a-zA-Z_:][\\w:.-]*)(\\s*=\\s*)(${quote})`,
	end: quote,
	beginCaptures: {
		1: { name: 'entity.other.attribute-name' },
		2: { name: 'keyword.operator' },
		3: punctuation,
	},
	endCaptures: { 0: punctuation },
	patterns: [
		{ include: '#interpolation' },
		{ include: '#escape' },
		{ include: '#entities' },
		{ match: `[^${quote}\\\\$&]+|\\$(?!\\{)|&`, name: 'string.quoted.attribute-value' },
	],
});

export default {
	...typescript,
	dependencies: ['javascript'],
	patterns: (typescript.patterns as Rule[]).flatMap(rule => rule.include === 'source.js#template'
		? [{ include: '#lit-template' }, { include: '#plain-template' }]
		: [rule]),
	repository: {
		...typescript.repository,
		interpolation,
		'balanced-braces': {
			begin: '\\{', end: '\\}',
			patterns: [{ include: '#balanced-braces' }, { include: '$self' }],
		},
		escape: { match: '\\\\[\\s\\S]', name: 'constant.character.escape' },
		'lit-template': {
			begin: '(?<![\\w$.])(html|svg)\\s*(`)',
			end: '`',
			beginCaptures: { 1: { name: 'entity.name.function' }, 2: punctuation },
			endCaptures: { 0: punctuation },
			patterns: [
				{ include: '#escape' },
				{ include: '#interpolation' },
				{ include: '#comments' },
				{ include: '#doctype' },
				{ include: '#raw-text' },
				{ include: '#tags' },
				{ include: '#entities' },
			],
		},
		'plain-template': {
			begin: '`', end: '`',
			beginCaptures: { 0: punctuation },
			endCaptures: { 0: punctuation },
			patterns: [
				{ include: '#escape' },
				{ include: '#interpolation' },
				{ match: '[^`\\\\$]+|\\$(?!\\{)', name: 'string.quoted.template' },
			],
		},
		// Reuse the markup rules that do not contain external language includes.
		comments: { ...markup.repository.comments, patterns: [{ include: '#interpolation' }] },
		doctype: markup.repository.doctype,
		entities: markup.repository.entities,
		'raw-text': {
			begin: '<(textarea|title)\\b[^>]*>',
			end: '</\\1\\s*>',
			beginCaptures: { 1: { name: 'entity.name.tag' } },
			patterns: [{ include: '#interpolation' }, { include: '#entities' }],
		},
		tags: {
			begin: '<(/?)([a-zA-Z][\\w:.-]*)', end: '/?>',
			beginCaptures: { 2: { name: 'entity.name.tag' } },
			patterns: [
				{ include: '#interpolation' },
				quotedAttribute('"'),
				quotedAttribute("'"),
				{
					begin: '\\s+([.?@]?[a-zA-Z_:][\\w:.-]*)(\\s*=\\s*)',
					end: '(?=\\s|/?>)',
					beginCaptures: { 1: { name: 'entity.other.attribute-name' }, 2: { name: 'keyword.operator' } },
					patterns: [
						{ include: '#interpolation' },
						{ include: '#entities' },
						{ match: '[^\\s$<>`]+|\\$(?!\\{)', name: 'string.unquoted.attribute-value' },
					],
				},
				{ match: '\\s+([.?@]?[a-zA-Z_:][\\w:.-]*)', captures: { 1: { name: 'entity.other.attribute-name' } } },
			],
		},
	},
};
