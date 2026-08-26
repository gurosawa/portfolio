export type StorySlug = 'balance-claim' | 'tls13' | 'tlsnotary';

export type StorySceneKind =
	| 'claim-path'
	| 'tls-record'
	| 'actor-visibility'
	| 'failure-replay'
	| 'epilogue-replay';

export type StoryVisual =
	| {
			kind: 'flow';
			nodes: readonly string[];
			active?: readonly string[];
	  }
	| {
			kind: 'state';
			label: string;
			value: string;
			status: 'unverified' | 'verified' | 'approved' | 'denied' | 'reproofRequired';
	  }
	| {
			kind: 'matrix';
			columns: readonly string[];
			rows: readonly (readonly string[])[];
	  }
	| {
			kind: 'code-trace';
			lineIds: readonly string[];
	  };

export type StoryBlock =
	| { id: string; kind: 'paragraph'; text: string }
	| { id: string; kind: 'list'; items: readonly string[] }
	| {
			id: string;
			kind: 'code';
			language: 'http' | 'json' | 'text';
			value: string;
			highlightLines?: readonly number[];
	  }
	| {
			id: string;
			kind: 'table';
			caption: string;
			headers: readonly string[];
			rows: readonly (readonly string[])[];
	  }
	| {
			id: string;
			kind: 'callout';
			tone: 'note' | 'decision' | 'failure';
			title: string;
			text: string;
	  }
	| {
			id: string;
			kind: 'form';
			label: string;
			description: string;
			examples: readonly string[];
			submitLabel: string;
	  }
	| {
			id: string;
			kind: 'figure';
			alt: string;
			caption: string;
			visual: StoryVisual;
	  };

export type DeepDive = {
	id: string;
	actId: string;
	title: string;
	summary: string;
	blocks: readonly StoryBlock[];
};

export type StoryReference = {
	actId: string;
	label: string;
	href: string;
	note: string;
};

export type StoryActSource = {
	id: string;
	kicker: string;
	title: string;
	lead: string;
	blocks: readonly StoryBlock[];
	deepDiveIds?: readonly string[];
	scene: {
		kind: StorySceneKind;
		focus: string;
	};
};

export type StoryAct = StoryActSource & {
	index: number;
	hash: `#act-${number}-${string}`;
};

export type StorySource = {
	meta: {
		slug: StorySlug;
		locale: 'ko';
		title: string;
		description: string;
		canonicalPath: `/ko/notebook/zktls/${StorySlug}/`;
		publishedAt: string;
		technicallyReviewedAt: string;
		readingMinutes: string;
	};
	opening: {
		question: string;
		claim: {
			label: string;
			fields: Readonly<Record<string, string | number | boolean>>;
			status: 'unverified';
		};
	};
	mobileOverview: {
		alt: string;
		nodes: readonly string[];
	};
	acts: readonly StoryActSource[];
	deepDives: readonly DeepDive[];
	references: readonly StoryReference[];
	navigation: {
		previous?: { title: string; href: string };
		next?: { title: string; href: string };
	};
};

export type StoryDocument = Omit<StorySource, 'acts'> & {
	acts: readonly StoryAct[];
};

const safeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function defineStory(source: StorySource): StoryDocument {
	if (source.acts.length !== 9) {
		throw new Error(`${source.meta.slug}: interactive stories require exactly nine Acts`);
	}

	const actIds = new Set<string>();
	const blockIds = new Set<string>();

	for (const act of source.acts) {
		assertSafeUniqueId(act.id, actIds, `${source.meta.slug}: Act`);

		for (const block of act.blocks) {
			assertSafeUniqueId(block.id, blockIds, `${source.meta.slug}: block`);

			if (block.kind === 'figure' && block.alt.trim().length === 0) {
				throw new Error(`${source.meta.slug}: figure ${block.id} requires alt text`);
			}
		}
	}

	const deepIds = new Set<string>();
	for (const deepDive of source.deepDives) {
		assertSafeUniqueId(deepDive.id, deepIds, `${source.meta.slug}: Deep dive`);
		if (!actIds.has(deepDive.actId)) {
			throw new Error(`${source.meta.slug}: Deep dive ${deepDive.id} points to an unknown Act`);
		}

		for (const block of deepDive.blocks) {
			assertSafeUniqueId(block.id, blockIds, `${source.meta.slug}: block`);

			if (block.kind === 'figure' && block.alt.trim().length === 0) {
				throw new Error(`${source.meta.slug}: figure ${block.id} requires alt text`);
			}
		}
	}

	for (const act of source.acts) {
		for (const deepId of act.deepDiveIds ?? []) {
			const deepDive = source.deepDives.find((candidate) => candidate.id === deepId);
			if (!deepDive || deepDive.actId !== act.id) {
				throw new Error(`${source.meta.slug}: Act ${act.id} has a broken Deep dive reference`);
			}
		}
	}

	return Object.freeze({
		...source,
		acts: source.acts.map((act, index) =>
			Object.freeze({
				...act,
				index,
				hash: `#act-${index}-${act.id}` as const
			})
		)
	});
}

function assertSafeUniqueId(id: string, seen: Set<string>, label: string) {
	if (!safeId.test(id)) {
		throw new Error(`${label} ID must be URL-safe kebab-case: ${id}`);
	}
	if (seen.has(id)) {
		throw new Error(`${label} ID must be unique: ${id}`);
	}
	seen.add(id);
}
