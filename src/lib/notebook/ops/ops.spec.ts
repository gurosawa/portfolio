import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import snapshot from './snapshot.json';
import audit from './source-audit.json';
import diagrams from './diagram-svgs.json';
import { getOpsCatalog, opsArticlePath } from './catalog';
import { articleHref, renderArticle } from './markdown';
import { getOpsArticle } from './articles.server';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

describe('imported MLOps collection', () => {
	it('preserves the complete published snapshot and each verified source body', () => {
		const raw = readFileSync(new URL('./snapshot.json', import.meta.url));
		expect(sha256(raw)).toBe(audit.publishedPayloadSha256);
		expect(snapshot.posts).toHaveLength(15);
		for (const post of snapshot.posts) {
			expect(sha256(post.body)).toBe(
				audit.posts.find((entry) => entry.slug === post.slug)?.bodySha256
			);
		}
	});

	it('exposes metadata without loading article bodies into the catalog', () => {
		const posts = getOpsCatalog();
		expect(posts.map((post) => post.order)).toEqual(
			Array.from({ length: 15 }, (_, index) => index + 1)
		);
		expect(posts.every((post) => !('body' in post))).toBe(true);
		expect(new Set(posts.map((post) => opsArticlePath(post.slug))).size).toBe(15);
	});

	it('renders every article with all 19 static diagrams and readable diagram sources', () => {
		let totalDiagrams = 0;
		for (const post of getOpsCatalog()) {
			const article = getOpsArticle(post.slug)!;
			expect(article.headings.length).toBeGreaterThan(0);
			expect(article.html).not.toMatch(/href="(?:\.\/)?[^"/:]+\.md(?:#.*?)?"/);
			expect(article.html).toContain('공식 참고자료');
			totalDiagrams += article.diagramCount;
		}
		expect(totalDiagrams).toBe(19);
		expect(snapshot.series.architecture).toContain('flowchart');
		expect(getOpsArticle('unknown')).toBeUndefined();
	});

	it('ships static, stylesheet-free SVGs and refuses stale diagram sources', () => {
		expect(diagrams).toHaveLength(19);
		for (const diagram of diagrams) {
			expect(diagram.svg).toContain('<svg');
			expect(diagram.svg).toContain('<text');
			expect(diagram.svg).not.toMatch(/<(?:style|script|foreignObject|a)(?:\s|>)/);
			expect(diagram.svg).not.toMatch(/\son\w+=/);
		}
		expect(() => renderArticle('```mermaid\nflowchart LR\n A-->B\n```')).toThrow('Regenerate');
	});

	it('links adjacent series entries without inventing missing articles', () => {
		const posts = getOpsCatalog();
		expect(getOpsArticle(posts[0].slug)?.previous).toBeNull();
		expect(getOpsArticle(posts[0].slug)?.next?.slug).toBe(posts[1].slug);
		expect(getOpsArticle(posts[14].slug)?.next).toBeNull();
	});

	it('preserves each diagram’s text scale and offers keyboard-accessible horizontal scrolling', () => {
		for (const diagram of diagrams) {
			const viewBox = diagram.svg
				.match(/\bviewBox="([^"]+)"/)![1]
				.split(/\s+/)
				.map(Number);
			const html = renderArticle(`\`\`\`mermaid\n${diagram.source}\n\`\`\``).html;
			const minimumWidth = Number(html.match(/--diagram-min-width: (\d+)px/)![1]);
			expect(minimumWidth).toBeGreaterThanOrEqual(viewBox[2] * 0.9);
			expect(html).toContain('role="region" tabindex="0"');
			expect(html).toContain('좌우로 스크롤해 읽을 수 있습니다.');
		}
	});
});

describe('article rendering safety and navigation', () => {
	it('escapes raw HTML and rejects executable or protocol-relative URLs', () => {
		const rendered = renderArticle(
			'<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n<img src=x onerror=alert(1)>'
		);
		expect(rendered.html).not.toContain('<script>');
		expect(rendered.html).not.toContain('<img');
		expect(rendered.html).not.toContain('href="javascript:');
		expect(rendered.html).toContain('&lt;script&gt;');
		expect(articleHref('//untrusted.example')).toBeNull();
		expect(articleHref('data:text/html,test')).toBeNull();
		expect(articleHref('java&#x73;cript:alert(1)')).toBeNull();
	});

	it('rewrites valid Markdown links locally and keeps section fragments', () => {
		const slug = getOpsCatalog()[0].slug;
		expect(articleHref(`./${slug}.md#section`)).toBe(`${opsArticlePath(slug)}#section`);
		expect(articleHref('./00-index.md')).toBe('/ko/notebook/?area=ops');
		expect(articleHref('./missing.md')).toBeNull();
		expect(articleHref('https://docs.rke2.io/')).toBe('https://docs.rke2.io/');
	});

	it('preserves code content safely, and generates unique readable heading anchors', () => {
		const result = renderArticle(
			'## 같은 제목\n\n## 같은 제목\n\n```html\n<script>alert(1)</script>\n```'
		);
		expect(result.headings.map((heading) => heading.id)).toEqual(['같은-제목', '같은-제목-2']);
		expect(result.html).not.toContain('<script>');
		expect(result.html).toContain('data-copy-code');
	});
});
