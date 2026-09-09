import { Marked, Renderer, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import xml from 'highlight.js/lib/languages/xml';
import ini from 'highlight.js/lib/languages/ini';
import { getOpsCatalog, opsArticlePath } from './catalog';
import { diagramDefinitions, type ArticleDiagramDefinition } from './diagram-definitions';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('toml', ini);

export type ArticleHeading = { id: string; text: string; level: number };
export type ArticleBlock =
	| { id: string; kind: 'html'; html: string }
	| { id: string; kind: 'diagram'; diagram: ArticleDiagramDefinition; number: number };

export function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, (character) => {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!;
	});
}

export function articleHref(href: string): string | null {
	const markdownLink = href.match(/^(?:\.\/)?([^/#]+)\.md(#.*)?$/i);
	if (markdownLink) {
		const [, slug, fragment = ''] = markdownLink;
		if (slug === '00-index') return '/ko/notebook/?area=ops';
		return getOpsCatalog().some((post) => post.slug === slug)
			? `${opsArticlePath(slug)}${fragment}`
			: null;
	}
	if (/^(https?:\/\/|mailto:|#)/i.test(href)) return href;
	if (/^\/(?!\/)/.test(href)) return href;
	return null;
}

export function renderArticle(markdown: string) {
	const headings: ArticleHeading[] = [];
	const ids = new Map<string, number>();
	let diagramCount = 0;
	const diagrams: ArticleDiagramDefinition[] = [];
	const renderer = new Renderer();

	// The source is editorial Markdown, not executable HTML. Escape raw tags on both server and client.
	renderer.html = ({ text }) => escapeHtml(text);
	renderer.link = function ({ href, title, tokens }: Tokens.Link) {
		const label = this.parser.parseInline(tokens);
		const safeHref = articleHref(href);
		if (!safeHref) return label;
		const external = /^https?:\/\//i.test(safeHref);
		return `<a href="${escapeHtml(safeHref)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
	};
	renderer.image = ({ href, text, title }) => {
		const safeHref = articleHref(href);
		if (!safeHref || !/^https?:\/\//i.test(safeHref)) return escapeHtml(text);
		return `<img src="${escapeHtml(safeHref)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" />`;
	};
	renderer.heading = function ({ depth, tokens, text }) {
		const plainText = text.replace(/[`*_]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
		const base =
			plainText
				.toLowerCase()
				.replace(/[^\p{L}\p{N}\s-]/gu, '')
				.trim()
				.replace(/\s+/g, '-') || 'section';
		const repeated = ids.get(base) ?? 0;
		ids.set(base, repeated + 1);
		const id = repeated ? `${base}-${repeated + 1}` : base;
		if (depth === 2 || depth === 3) headings.push({ id, text: plainText, level: depth });
		return `<h${depth} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
	};
	renderer.code = ({ text, lang = '' }) => {
		const language = lang.split(/\s/)[0];
		if (language === 'mermaid') {
			diagramCount += 1;
			const diagram = diagramDefinitions.find((entry) => entry.source === text);
			if (!diagram)
				throw new Error(
					'A Mermaid source changed. Update its reviewed animation definition before publishing.'
				);
			diagrams.push(diagram);
			return `<!--OPS-DIAGRAM:${diagramCount - 1}-->`;
		}
		const highlighted = hljs.getLanguage(language)
			? hljs.highlight(text, { language, ignoreIllegals: true }).value
			: escapeHtml(text);
		return `<div class="ops-code"><div class="ops-code-bar"><span>${escapeHtml(language || 'text')}</span><button type="button" data-copy-code>복사</button></div><pre tabindex="0"><code>${highlighted}</code></pre></div>\n`;
	};
	const defaultTable = Renderer.prototype.table;
	renderer.table = function (token) {
		return `<div class="ops-table" role="region" aria-label="가로로 스크롤할 수 있는 표" tabindex="0">${defaultTable.call(this, token)}</div>`;
	};
	const marked = new Marked({ gfm: true, breaks: false, renderer, async: false });
	const html = marked.parse(markdown) as string;
	// Only renderer-generated markers are recognized: authored raw HTML is escaped above.
	// The imported diagrams are top-level Markdown blocks; surrounding prose is left untouched.
	const blocks: ArticleBlock[] = html.split(/(<!--OPS-DIAGRAM:\d+-->)/).flatMap((part, index) => {
		const marker = part.match(/^<!--OPS-DIAGRAM:(\d+)-->$/);
		if (marker) {
			const number = Number(marker[1]);
			return [
				{
					id: diagrams[number].id,
					kind: 'diagram',
					diagram: diagrams[number],
					number: number + 1
				} as ArticleBlock
			];
		}
		return part.trim() ? [{ id: `prose-${index}`, kind: 'html', html: part } as ArticleBlock] : [];
	});
	return { blocks, headings, diagramCount };
}
