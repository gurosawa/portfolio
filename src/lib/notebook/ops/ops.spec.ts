import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Marked, type Tokens } from 'marked';
import { describe, expect, it } from 'vitest';
import snapshot from './snapshot.json';
import audit from './source-audit.json';
import { getOpsCatalog, opsArticlePath } from './catalog';
import { diagramDefinitions } from './diagram-definitions';
import { articleHref, renderArticle, type ArticleBlock } from './markdown';
import { getOpsArticle } from './articles.server';

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const marked = new Marked({ gfm: true });
const isDiagram = (token: Tokens.Generic): token is Tokens.Code =>
	token.type === 'code' && token.lang?.split(/\s/)[0] === 'mermaid';
const originalDiagrams = snapshot.posts.flatMap((post) =>
	marked
		.lexer(post.body)
		.filter(isDiagram)
		.map((token, index) => ({ slug: post.slug, number: index + 1, source: token.text }))
);
const prose = (article: { blocks: ArticleBlock[] }) =>
	article.blocks.flatMap((block) => (block.kind === 'html' ? [block.html] : [])).join('');

function definitionFor(slugPrefix: string, number = 1) {
	const original = originalDiagrams.find(
		(diagram) => diagram.slug.startsWith(slugPrefix) && diagram.number === number
	);
	if (!original) throw new Error(`No published diagram: ${slugPrefix}/${number}`);
	const definition = diagramDefinitions.find((diagram) => diagram.source === original.source);
	if (!definition) throw new Error(`No animation definition: ${slugPrefix}/${number}`);
	return definition;
}

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

	it('renders every article with all 19 reviewed diagrams in the original order', () => {
		let totalDiagrams = 0;
		for (const post of getOpsCatalog()) {
			const article = getOpsArticle(post.slug)!;
			const html = prose(article);
			const diagrams = article.blocks.filter((block) => block.kind === 'diagram');
			const originals = originalDiagrams.filter((diagram) => diagram.slug === post.slug);
			expect(article.headings.length).toBeGreaterThan(0);
			expect(html).not.toMatch(/href="(?:\.\/)?[^"/:]+\.md(?:#.*?)?"/);
			expect(html).toContain('공식 참고자료');
			expect(html).not.toContain('OPS-DIAGRAM:');
			expect(diagrams.map((block) => block.diagram.source)).toEqual(
				originals.map((diagram) => diagram.source)
			);
			expect(diagrams.map((block) => block.number)).toEqual(
				originals.map((diagram) => diagram.number)
			);
			expect(article.diagramCount).toBe(diagrams.length);
			expect(new Set(article.blocks.map((block) => block.id)).size).toBe(article.blocks.length);
			totalDiagrams += article.diagramCount;
		}
		expect(totalDiagrams).toBe(19);
		expect(snapshot.series.architecture).toContain('flowchart');
		expect(getOpsArticle('unknown')).toBeUndefined();
	});

	it('matches the complete animation inventory one-to-one to the unchanged Mermaid sources', () => {
		expect(originalDiagrams).toHaveLength(19);
		expect(diagramDefinitions).toHaveLength(19);
		expect(new Set(diagramDefinitions.map((diagram) => diagram.id)).size).toBe(19);
		expect(new Set(diagramDefinitions.map((diagram) => diagram.source)).size).toBe(19);
		expect(diagramDefinitions.map((diagram) => diagram.source).sort()).toEqual(
			originalDiagrams.map((diagram) => diagram.source).sort()
		);
	});

	it('links adjacent series entries without inventing missing articles', () => {
		const posts = getOpsCatalog();
		expect(getOpsArticle(posts[0].slug)?.previous).toBeNull();
		expect(getOpsArticle(posts[0].slug)?.next?.slug).toBe(posts[1].slug);
		expect(getOpsArticle(posts[14].slug)?.next).toBeNull();
	});

	it('keeps every source paragraph, heading and code block when diagrams become separate blocks', () => {
		for (const post of snapshot.posts) {
			const withoutDiagrams = marked
				.lexer(post.body)
				.map((token) => (isDiagram(token) ? '\n\n' : token.raw))
				.join('');
			const expected = renderArticle(withoutDiagrams);
			const article = renderArticle(post.body);
			expect(prose(article), post.slug).toBe(prose(expected));
			expect(article.headings, post.slug).toEqual(expected.headings);
			expect(expected.diagramCount).toBe(0);
		}
	});
});

describe('reviewed diagram definitions', () => {
	it('has readable stages with valid references, unique cells, and complete node and edge coverage', () => {
		for (const diagram of diagramDefinitions) {
			const nodeIds = new Set(diagram.nodes.map((node) => node.id));
			const edgeIds = new Set(diagram.edges.map((edge) => edge.id));
			const seenNodes = new Set<string>();
			const seenEdges = new Set<string>();
			expect(diagram.title.trim().length, diagram.id).toBeGreaterThan(0);
			expect(['flow', 'sequence', 'relation']).toContain(diagram.mode);
			expect(nodeIds.size, diagram.id).toBe(diagram.nodes.length);
			expect(edgeIds.size, diagram.id).toBe(diagram.edges.length);
			expect(diagram.stages.length, diagram.id).toBeGreaterThan(0);
			for (const node of diagram.nodes) {
				expect(node.label.trim().length, `${diagram.id}/${node.id}`).toBeGreaterThan(0);
				expect(node.detail.trim().length, `${diagram.id}/${node.id}`).toBeGreaterThan(0);
			}
			for (const edge of diagram.edges) {
				expect(nodeIds.has(edge.from), `${diagram.id}/${edge.id}: from`).toBe(true);
				expect(nodeIds.has(edge.to), `${diagram.id}/${edge.id}: to`).toBe(true);
				expect(['flow', 'relation', 'return', 'bidirectional']).toContain(edge.kind);
				expect(edge.label.trim().length, `${diagram.id}/${edge.id}`).toBeGreaterThan(1);
				expect(edge.label.trim(), `${diagram.id}/${edge.id}`).not.toMatch(
					/^(?:연결|관계|흐름|flow|relation|return|bidirectional|step\s*\d+)$/i
				);
			}
			for (const stage of diagram.stages) {
				const context = `${diagram.id}/${stage.title}`;
				const stageNodes = new Set(stage.nodes.map((node) => node.id));
				expect(stage.title.trim().length, context).toBeGreaterThan(0);
				expect(stage.description.trim().length, context).toBeGreaterThan(0);
				expect(stage.nodes.length, context).toBeGreaterThan(0);
				expect(stage.nodes.length, context).toBeLessThanOrEqual(5);
				expect(stageNodes.size, context).toBe(stage.nodes.length);
				expect(new Set(stage.nodes.map((node) => `${node.col}:${node.row}`)).size, context).toBe(
					stage.nodes.length
				);
				expect(new Set(stage.edges).size, context).toBe(stage.edges.length);
				for (const node of stage.nodes) {
					expect(nodeIds.has(node.id), `${context}/${node.id}`).toBe(true);
					expect(Number.isInteger(node.col) && node.col >= 0, context).toBe(true);
					expect(Number.isInteger(node.row) && node.row >= 0, context).toBe(true);
					seenNodes.add(node.id);
				}
				for (const id of stage.edges) {
					expect(edgeIds.has(id), `${context}/${id}`).toBe(true);
					const edge = diagram.edges.find((candidate) => candidate.id === id)!;
					expect(stageNodes.has(edge.from), `${context}/${id}: from`).toBe(true);
					expect(stageNodes.has(edge.to), `${context}/${id}: to`).toBe(true);
					seenEdges.add(id);
				}
			}
			expect([...seenNodes].sort(), diagram.id).toEqual([...nodeIds].sort());
			expect([...seenEdges].sort(), diagram.id).toEqual([...edgeIds].sort());
		}
	});

	it('preserves raw sources as data and refuses an unreviewed or edited diagram', () => {
		for (const diagram of diagramDefinitions) {
			const result = renderArticle(`\`\`\`mermaid\n${diagram.source}\n\`\`\``);
			expect(result.blocks).toHaveLength(1);
			expect(result.blocks[0]).toMatchObject({
				kind: 'diagram',
				number: 1,
				diagram: { id: diagram.id, source: diagram.source }
			});
			expect(prose(result)).toBe('');
			expect(() =>
				renderArticle(`\`\`\`mermaid\n${diagram.source}\n%% not reviewed\n\`\`\``)
			).toThrow('reviewed animation');
		}
		expect(() => renderArticle('```mermaid\nflowchart LR\n A-->B\n```')).toThrow(
			'reviewed animation'
		);
	});

	it('keeps Runner job requests and Kubernetes image pulls in their source direction', () => {
		const runner = definitionFor('08-', 1);
		expect(runner.edges).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					from: 'R',
					to: 'G',
					kind: 'flow',
					label: expect.stringMatching(/Job.*요청/i)
				})
			])
		);
		const deployment = definitionFor('10-');
		expect(deployment.edges).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					from: 'k8s',
					to: 'harbor',
					kind: 'flow',
					label: expect.stringMatching(/pull/i)
				})
			])
		);
	});

	it('does not animate source relationship arrows as Harbor-initiated transfers', () => {
		const multicluster = definitionFor('11-');
		for (const cluster of ['dev', 'stg', 'prod']) {
			expect(multicluster.edges).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ from: 'harbor', to: cluster, kind: 'relation' })
				])
			);
		}
		const capstone = definitionFor('15-');
		expect(capstone.edges).toEqual(
			expect.arrayContaining([expect.objectContaining({ from: 'D', to: 'E', kind: 'relation' })])
		);
	});
});

describe('article rendering safety and navigation', () => {
	it('escapes raw HTML and rejects executable or protocol-relative URLs', () => {
		const rendered = renderArticle(
			'<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n<img src=x onerror=alert(1)>'
		);
		expect(prose(rendered)).not.toContain('<script>');
		expect(prose(rendered)).not.toContain('<img');
		expect(prose(rendered)).not.toContain('href="javascript:');
		expect(prose(rendered)).toContain('&lt;script&gt;');
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
		expect(prose(result)).not.toContain('<script>');
		expect(prose(result)).toContain('data-copy-code');
	});

	it('keeps source order and duplicate heading anchors across diagram boundaries', () => {
		const [first, second] = originalDiagrams;
		const result = renderArticle(
			[
				'## 같은 제목',
				'첫 번째 문단입니다.',
				`\`\`\`mermaid\n${first.source}\n\`\`\``,
				'## 같은 제목',
				'```text\n<script>literal code</script>\nOPS-DIAGRAM:0\n```',
				`\`\`\`mermaid\n${second.source}\n\`\`\``,
				'마지막 문단입니다.'
			].join('\n\n')
		);
		expect(result.blocks.map((block) => block.kind)).toEqual([
			'html',
			'diagram',
			'html',
			'diagram',
			'html'
		]);
		expect(result.headings.map((heading) => heading.id)).toEqual(['같은-제목', '같은-제목-2']);
		expect(result.diagramCount).toBe(2);
		expect(result.blocks[0]).toMatchObject({
			kind: 'html',
			html: expect.stringContaining('첫 번째 문단입니다.')
		});
		expect(result.blocks[2]).toMatchObject({
			kind: 'html',
			html: expect.stringContaining('&lt;script&gt;literal code&lt;/script&gt;\nOPS-DIAGRAM:0')
		});
		expect(result.blocks[4]).toMatchObject({
			kind: 'html',
			html: expect.stringContaining('마지막 문단입니다.')
		});
	});
});
