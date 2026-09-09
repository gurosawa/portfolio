export type SecurityStorySlug = 'balance-claim' | 'tlsnotary';

export type EditorialScene = {
	id: string;
	actIds: readonly string[];
	title: string;
	lead: string;
	paragraphs: readonly string[];
	takeaway: string;
	sourceLabel: string;
};

export type SecurityEditorial = {
	slug: SecurityStorySlug;
	kicker: string;
	title: string;
	intro: string;
	overview: { label: string; steps: readonly string[] };
	chapterTitle: string;
	chapterIntro: string;
	scope: readonly string[];
	scenes: readonly EditorialScene[];
	closing: { title: string; paragraphs: readonly string[] };
};
