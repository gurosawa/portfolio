import { Marked, Renderer, type Tokens } from 'marked';
import learning from '../../../../docs/notebook/manuscripts/01-learning-and-evaluation.md?raw';
import data from '../../../../docs/notebook/manuscripts/02-data-that-teaches.md?raw';
import compute from '../../../../docs/notebook/manuscripts/03-compute-and-orchestration.md?raw';
import { aiArticles, aiArticlePath, aiReviewedAt, type AiSlug } from './catalog';

const sources: Record<AiSlug, string> = {
	'learning-and-evaluation': learning,
	'data-that-teaches': data,
	'compute-and-orchestration': compute
};
const escape = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(character) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			})[character]!
	);

export function aiHref(href: string): string | null {
	const linked = aiArticles.find((article) => article.file === href);
	if (linked) return aiArticlePath(linked.slug);
	if (/^(https?:\/\/|#)/i.test(href) || /^\/(?!\/)/.test(href)) return href;
	return null;
}

export function renderAiMarkdown(markdown: string) {
	const renderer = new Renderer();
	renderer.html = ({ text }) => escape(text);
	renderer.image = ({ text }) => escape(text);
	renderer.link = function ({ href, tokens }: Tokens.Link) {
		const safe = aiHref(href);
		const label = this.parser.parseInline(tokens);
		return safe
			? `<a href="${escape(safe)}"${/^https?:/.test(safe) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
			: label;
	};
	renderer.table = function (token) {
		return `<div class="ai-table" role="region" aria-label="본문 비교 표" tabindex="0">${Renderer.prototype.table.call(this, token)}</div>`;
	};
	renderer.code = ({ text }) => `<pre tabindex="0"><code>${escape(text)}</code></pre>`;
	return new Marked({ renderer, gfm: true, async: false }).parse(markdown) as string;
}

export function getAiArticle(slug: string) {
	const meta = aiArticles.find((article) => article.slug === slug);
	if (!meta) return undefined;
	// These are reviewed, committed manuscripts. Only this renderer can emit HTML.
	const raw = sources[meta.slug];
	const body = raw.replace(/^# .+\r?\n\r?\n[^\r\n]+\r?\n\r?\n/, '');
	const chunks = body.split(/^## /m);
	const intro = renderAiMarkdown(chunks.shift()!);
	if (chunks.length !== meta.sections.length)
		throw new Error(`AI section map needs review: ${slug}`);
	const sections = chunks.map((chunk, index) => {
		const end = chunk.indexOf('\n');
		return {
			...meta.sections[index],
			title: chunk.slice(0, end).trim(),
			html: renderAiMarkdown(chunk.slice(end + 1))
		};
	});
	return {
		...meta,
		reviewedAt: aiReviewedAt,
		intro,
		sections,
		previous: aiArticles[meta.order - 2] ?? null,
		next: aiArticles[meta.order] ?? null
	};
}
export type AiArticle = NonNullable<ReturnType<typeof getAiArticle>>;
