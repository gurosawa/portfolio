import { describe, it, expect } from 'vitest';
import { aiArticles, aiArticlePath } from './catalog';
import { getAiArticle, renderAiMarkdown, aiHref } from './articles.server';
import { expectedCoverage, exampleModels, selectedSuccess, routingCost } from './calculations';
import replay from './release-replay-result.json';
import { previewScene, previewSize } from '../components/flow-preview';

describe('published AI manuscripts', () => {
	it('publishes the complete manuscripts with stable headings, references and navigation', () => {
		for (const meta of aiArticles) {
			const article = getAiArticle(meta.slug)!;
			expect(article.sections).toHaveLength(meta.sections.length);
			expect(new Set(article.sections.map((section) => section.id)).size).toBe(
				meta.sections.length
			);
			const html = article.intro + article.sections.map((section) => section.html).join('');
			expect(html.length).toBeGreaterThan(10000);
			expect(html).not.toMatch(/본문 초안|편집 상태|통합 원고 ·|href="[^"\n]*\.md"/);
			expect(html).toContain('https://arxiv.org/');
			expect(html).toContain('rel="noopener noreferrer"');
			for (const other of [article.previous, article.next])
				if (other) expect(html).toContain(aiArticlePath(other.slug));
		}
		expect(getAiArticle('unpublished')).toBeUndefined();
	});
	it('preserves the new evaluation, review and rollback arguments', () => {
		expect(
			getAiArticle('learning-and-evaluation')!.sections.map((section) => section.id)
		).toContain('judge-the-judge');
		expect(
			getAiArticle('learning-and-evaluation')!.sections.map((section) => section.id)
		).toContain('regressions');
		expect(getAiArticle('data-that-teaches')!.sections.map((section) => section.id)).toContain(
			'independent-review'
		);
		expect(
			getAiArticle('compute-and-orchestration')!.sections.find(
				(section) => section.id === 'release-bundle'
			)!.html
		).toContain('/notebook/ai/release-replay.mjs');
	});
	it('escapes raw HTML and rejects executable or ambiguous links', () => {
		expect(renderAiMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
		for (const href of ['javascript:alert(1)', '//example.com', 'data:text/html,a', 'unknown.md'])
			expect(aiHref(href)).toBeNull();
		expect(aiHref(aiArticles[0].file)).toBe(aiArticlePath(aiArticles[0].slug));
		expect(renderAiMarkdown('[bad](javascript:alert)')).not.toContain('href=');
	});
});

describe('article calculations', () => {
	it('averages problem-level coverage and keeps selection loss separate', () => {
		expect(expectedCoverage(exampleModels.A, 4)).toBeCloseTo(0.49995, 8);
		expect(expectedCoverage(exampleModels.B, 4)).toBeCloseTo(0.68359375, 8);
		expect(selectedSuccess(expectedCoverage(exampleModels.B, 4), 0.6)).toBeCloseTo(0.41015625, 8);
		expect(selectedSuccess(0.9, 0)).toBe(0);
		expect(selectedSuccess(0.9, 1)).toBe(0.9);
		for (const k of [1, 2, 4])
			expect(expectedCoverage(exampleModels.B, k + 1)).toBeGreaterThan(
				expectedCoverage(exampleModels.B, k)
			);
		expect(() => expectedCoverage([], 4)).toThrow();
		expect(() => expectedCoverage([1.1], 4)).toThrow();
	});
	it('computes cost under the stated escalation assumptions', () => {
		expect(routingCost(0.2)).toBe(3.5);
		expect(routingCost(0.85)).toBe(10);
		expect(routingCost(0.9)).toBe(10.5);
	});
	it('keeps the executed release fixture scoped to context restoration', () => {
		const [baseline, , modelOnly, full] = replay.runs;
		expect(modelOnly.bundle.model).toBe(baseline.bundle.model);
		expect(modelOnly.contextDigest).not.toBe(baseline.contextDigest);
		expect(full.contextDigest).toBe(baseline.contextDigest);
		expect(full.bundleDigest).toBe(baseline.bundleDigest);
		expect(Object.values(replay.checks).every(Boolean)).toBe(true);
		expect(replay.kind).toBe('deterministic-context-replay');
	});
});

describe('AI request preview', () => {
	it('keeps the six roles and each phase consistent at both sizes', () => {
		for (const narrow of [false, true]) {
			const scene = previewScene('inference', narrow);
			const size = previewSize('inference', narrow);
			expect(scene.nodes).toHaveLength(6);
			const ids = scene.nodes.map((node) => node.id);
			for (const edge of scene.connections) {
				expect(ids).toContain(edge.from);
				expect(ids).toContain(edge.to);
			}
			for (const phase of scene.phases!) {
				for (const id of phase.nodes) expect(ids).toContain(id);
				for (const id of phase.connections)
					expect(scene.connections.some((edge) => edge.id === id)).toBe(true);
			}
			for (const node of scene.nodes) {
				expect(node.x + node.width).toBeLessThanOrEqual(size.width);
				expect(node.y + 108).toBeLessThan(size.height);
			}
		}
	});
});
