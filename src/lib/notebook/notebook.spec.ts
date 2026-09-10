import { describe, expect, it } from 'vitest';
import { getNotebookHome, notebookCanonicalPath } from './notebook';
import { filterNotebook } from './catalog-filter';

describe('Systems Notebook shared catalog', () => {
	const notebook = getNotebookHome('ko');
	it('combines existing Ops and Sec content with three substantial AI articles', () => {
		expect(notebook.entries).toHaveLength(21);
		expect(notebook.entries.filter((entry) => entry.format === 'article')).toHaveLength(18);
		expect(
			notebook.entries.filter((entry) => entry.format === 'story').map((entry) => entry.href)
		).toEqual([
			'/ko/notebook/zktls/balance-claim/',
			'/ko/notebook/zktls/tls13/',
			'/ko/notebook/zktls/tlsnotary/'
		]);
		expect(notebook.entries.every((entry) => entry.href.startsWith('/ko/notebook/'))).toBe(true);
		expect(new Set(notebook.entries.map((entry) => entry.id)).size).toBe(21);
		expect(
			notebook.features.every((feature) =>
				notebook.entries.some(
					(entry) => entry.id === feature.entryId && entry.areas.includes(feature.area)
				)
			)
		).toBe(true);
		expect(new Set(notebook.features.map((feature) => feature.area))).toEqual(
			new Set(['ops', 'sec', 'ai'])
		);
	});
	it('does not pass source summaries off as personal experiments', () => {
		const ops = notebook.entries.filter((entry) => entry.id.startsWith('ops-'));
		expect(
			ops.every(
				(entry) => entry.kind === 'reference' && entry.authorLabel === 'HPE 엔지니어 자료 기반'
			)
		).toBe(true);
		expect(notebook.entries.some((entry) => entry.kind === 'experiment')).toBe(false);
	});
	it('allows authentication articles to appear under both areas', () => {
		const shared = notebook.entries.filter(
			(entry) => entry.areas.includes('ops') && entry.areas.includes('sec')
		);
		expect(shared.length).toBeGreaterThan(0);
		expect(
			shared.every(
				(entry) =>
					filterNotebook(notebook.entries, { area: 'ops' }).includes(entry) &&
					filterNotebook(notebook.entries, { area: 'sec' }).includes(entry)
			)
		).toBe(true);
	});
	it('filters by area, content kind, and all normalized query words together', () => {
		const result = filterNotebook(notebook.entries, {
			area: 'ops',
			kind: 'reference',
			query: '  ＧＩＴＬＡＢ   harbor '
		});
		expect(result.length).toBeGreaterThan(0);
		expect(result.some((entry) => entry.id === 'ops-10-gitlab-harbor-argocd-end-to-end')).toBe(
			true
		);
		expect(
			filterNotebook(notebook.entries, { area: 'ops', kind: 'concept' }).map((entry) => entry.id)
		).toEqual(['ai-compute-and-orchestration']);
		expect(filterNotebook(notebook.entries, { query: 'missing-notebook-result' })).toEqual([]);
		expect(filterNotebook(notebook.entries, { query: '   ' })).toHaveLength(21);
	});
	it('finds four existing MLOps articles in AI without duplicating or republishing them', () => {
		const ai = filterNotebook(notebook.entries, { area: 'ai', kind: 'reference' });
		expect(ai.map((entry) => entry.slug)).toEqual([
			'12-mlops-mlflow-ray-kserve-knative',
			'13-reproducible-ml-storage-versioning',
			'14-gitops-meets-ml-pipeline',
			'15-rayjob-mlflow-kserve-capstone'
		]);
		expect(ai.every((entry) => entry.areas.includes('ops') && entry.href.includes('/ops/'))).toBe(
			true
		);
		expect(filterNotebook(notebook.entries, { area: 'ai', query: 'MLflow' })).toHaveLength(4);
		expect(filterNotebook(notebook.entries, { area: 'ai', kind: 'experiment' })).toEqual([]);
		expect(notebook.entries).toHaveLength(21);
		expect(filterNotebook(notebook.entries, { area: 'ai' })).toHaveLength(7);
		expect(filterNotebook(notebook.entries, { area: 'ai', kind: 'concept' })).toHaveLength(3);
	});
	it('keeps English explicitly unpublished without translating source articles', () => {
		expect(getNotebookHome('en').comingSoon).toBe(true);
		expect(getNotebookHome('en').entries).toEqual([]);
	});
	it('retains origin-relative canonical routes', () => {
		expect(notebookCanonicalPath('ko')).toBe('/ko/notebook/');
		expect(notebookCanonicalPath('en')).toBe('/en/notebook/');
	});
});
