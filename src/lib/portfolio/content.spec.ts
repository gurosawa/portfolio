import { describe, expect, it } from 'vitest';
import {
	getHomeContent,
	getWork,
	supportedLocales,
	terminalSafetyPatterns,
	workSlugs
} from './content';

describe('portfolio content model', () => {
	it('defines route-based Korean and English locales', () => {
		expect(supportedLocales).toEqual(['ko', 'en']);
	});

	it('links the shared contact footer to Credly while preserving the Soram project', () => {
		for (const locale of supportedLocales) {
			const content = getHomeContent(locale);

			expect(content.contact.links).toContainEqual({
				label: 'Credly',
				href: 'https://www.credly.com/users/hongbeom-joo.427c3409'
			});
			expect(content.contact.links.some((link) => link.label === 'Soram')).toBe(false);
			expect(getWork(locale, 'soram')).toMatchObject({
				title: 'Soram',
				externalUrl: 'https://soram.vercel.app/'
			});
		}
	});

	it('keeps shared English work slugs stable across locales', () => {
		const ko = getHomeContent('ko');
		const en = getHomeContent('en');

		expect(ko.works.map((work) => work.slug)).toEqual(workSlugs);
		expect(en.works.map((work) => work.slug)).toEqual(workSlugs);
		expect(workSlugs).toEqual(['soram', 'systems-notebook']);
	});

	it('keeps synthetic terminal copy free of real infrastructure details', () => {
		const rows = supportedLocales.flatMap((locale) => getHomeContent(locale).terminal.rows);
		const terminalText = rows.map((row) => `${row.command} ${row.output}`).join('\n');

		for (const pattern of terminalSafetyPatterns) {
			expect(terminalText).not.toMatch(pattern);
		}
	});

	it('does not ship encoding-corrupted or em-dash copy', () => {
		const serialized = JSON.stringify(supportedLocales.map((locale) => getHomeContent(locale)));

		expect(serialized).not.toMatch(/[�]|[—–]|[洹吏]/);
		expect(serialized).not.toContain('?셲');
		expect(serialized).not.toContain('?띾');
	});

	it('consolidates AI into the notebook entry across locales', () => {
		for (const locale of supportedLocales) {
			expect(getWork(locale, 'local-ai-ops-notes')).toBeUndefined();
			expect(getWork(locale, 'systems-notebook')?.destination).toBe('notebook');
		}
	});

	it('merges the operations and zkTLS entries into the local Systems Notebook', () => {
		const work = getWork('ko', 'systems-notebook');

		expect(work?.externalUrl).toBeUndefined();
		expect(work?.status).toBe('notebook');
		expect(work?.tags).toEqual(['security', 'systems', 'operations']);
		expect(getWork('ko', 'infra-troubleshooting')).toBeUndefined();
		expect(getWork('ko', 'zktls-research')).toBeUndefined();
	});
});
