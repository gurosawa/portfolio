import { balanceClaimStory } from '$lib/notebook/content/zktls/balance-claim';
import { tls13Story } from '$lib/notebook/content/zktls/tls13';
import { tlsnotaryStory } from '$lib/notebook/content/zktls/tlsnotary';
import type { StoryDocument, StorySlug } from './schema';

const stories: Partial<Record<StorySlug, StoryDocument>> = {
	'balance-claim': balanceClaimStory,
	tls13: tls13Story,
	tlsnotary: tlsnotaryStory
};

export const storySlugs = [
	'balance-claim',
	'tls13',
	'tlsnotary'
] as const satisfies readonly StorySlug[];

export function getStory(slug: string): StoryDocument {
	const story = stories[slug as StorySlug];
	if (!story) {
		throw new Error(`Unknown story: ${slug}`);
	}
	return story;
}

export { defineStory } from './schema';
export type { DeepDive, StoryAct, StoryBlock, StoryDocument, StorySlug } from './schema';
export { default as StoryPage } from './StoryPage.svelte';
