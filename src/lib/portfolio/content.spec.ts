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

	it('keeps shared English work slugs stable across locales', () => {
		const ko = getHomeContent('ko');
		const en = getHomeContent('en');

		expect(ko.works.map((work) => work.slug)).toEqual(workSlugs);
		expect(en.works.map((work) => work.slug)).toEqual(workSlugs);
		expect(workSlugs).toEqual(['soram', 'systems-notebook', 'local-ai-ops-notes']);
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

	it('returns localized work placeholders by slug', () => {
		const work = getWork('en', 'local-ai-ops-notes');

		expect(work?.slug).toBe('local-ai-ops-notes');
		expect(work?.status).toBe('running experiment');
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
