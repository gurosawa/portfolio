import { describe, expect, it } from 'vitest';
import { getNotebookHome, notebookCanonicalPath } from './notebook';

describe('Systems Notebook public catalog', () => {
	it('features all three Korean zkTLS stories and keeps CI/CD as an external archive', () => {
		const notebook = getNotebookHome('ko');

		expect(notebook.series.items.map((item) => item.href)).toEqual([
			'/ko/notebook/zktls/balance-claim/',
			'/ko/notebook/zktls/tls13/',
			'/ko/notebook/zktls/tlsnotary/'
		]);
		expect(notebook.series.status).toBe('세 편 모두 공개');
		expect(notebook.archive.label).toBe('External Archive');
		expect(notebook.archive.href).toBe('https://brave-hill-0cb321b00.7.azurestaticapps.net/#home');
	});

	it('keeps the English notebook intentionally small for the first release', () => {
		const notebook = getNotebookHome('en');

		expect(notebook.comingSoon).toBe(true);
		expect(notebook.series.items).toHaveLength(0);
	});

	it('builds an origin-relative canonical path instead of an asset-relative route', () => {
		expect(notebookCanonicalPath('ko')).toBe('/ko/notebook/');
		expect(notebookCanonicalPath('en')).toBe('/en/notebook/');
	});
});
