import { describe, expect, it } from 'vitest';
import { getNotebookHome, notebookCanonicalPath } from './notebook';
import { filterNotebook } from './catalog-filter';

describe('Systems Notebook shared catalog', () => {
	const notebook = getNotebookHome('ko');
	it('combines fifteen source-based Ops articles and three interactive Sec stories', () => {
		expect(notebook.entries).toHaveLength(18);
		expect(notebook.entries.filter((entry) => entry.format === 'article')).toHaveLength(15);
		expect(
			notebook.entries.filter((entry) => entry.format === 'story').map((entry) => entry.href)
		).toEqual([
			'/ko/notebook/zktls/balance-claim/',
			'/ko/notebook/zktls/tls13/',
			'/ko/notebook/zktls/tlsnotary/'
		]);
		expect(notebook.entries.every((entry) => entry.href.startsWith('/ko/notebook/'))).toBe(true);
		expect(new Set(notebook.entries.map((entry) => entry.id)).size).toBe(18);
		expect(
			notebook.featuredIds.every((id) => notebook.entries.some((entry) => entry.id === id))
		).toBe(true);
	});
	it('does not pass source summaries off as personal experiments', () => {
		const ops = notebook.entries.filter((entry) => entry.format === 'article');
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
		expect(filterNotebook(notebook.entries, { area: 'ops', kind: 'concept' })).toEqual([]);
		expect(filterNotebook(notebook.entries, { query: 'missing-notebook-result' })).toEqual([]);
		expect(filterNotebook(notebook.entries, { query: '   ' })).toHaveLength(18);
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
