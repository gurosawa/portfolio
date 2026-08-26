import { describe, expect, it } from 'vitest';
import { defineStory, type StorySource } from './schema';

function storyWithDeepBlocks(blocks: StorySource['deepDives'][number]['blocks']): StorySource {
	return {
		meta: {
			slug: 'balance-claim',
			locale: 'ko',
			title: 'test',
			description: 'test',
			canonicalPath: '/ko/notebook/zktls/balance-claim/',
			publishedAt: '2026-08-26',
			technicallyReviewedAt: '2026-08-26',
			readingMinutes: '1분'
		},
		opening: {
			question: 'test?',
			claim: { label: 'test', fields: { ok: true }, status: 'unverified' }
		},
		mobileOverview: { alt: 'test', nodes: ['test'] },
		acts: Array.from({ length: 9 }, (_, index) => ({
			id: `act${index}`,
			kicker: `Act ${index}`,
			title: `Act ${index}`,
			lead: 'test',
			blocks: [],
			deepDiveIds: index === 0 ? ['details'] : [],
			scene: { kind: 'claim-path' as const, focus: 'test' }
		})),
		deepDives: [{ id: 'details', actId: 'act0', title: 'test', summary: 'test', blocks }],
		references: [],
		navigation: {}
	};
}

describe('defineStory deep content contracts', () => {
	it('rejects duplicate block IDs inside Deep dives', () => {
		expect(() =>
			defineStory(
				storyWithDeepBlocks([
					{ id: 'same-id', kind: 'paragraph', text: 'first' },
					{ id: 'same-id', kind: 'paragraph', text: 'second' }
				])
			)
		).toThrow(/block ID must be unique/);
	});

	it('requires alternative text for Deep dive figures too', () => {
		expect(() =>
			defineStory(
				storyWithDeepBlocks([
					{
						id: 'deep-figure',
						kind: 'figure',
						alt: ' ',
						caption: 'test',
						visual: { kind: 'flow', nodes: ['one'] }
					}
				])
			)
		).toThrow(/requires alt text/);
	});
});
