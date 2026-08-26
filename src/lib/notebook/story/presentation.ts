import type { StorySlug } from './schema';

export type PresentationLane = 'claim' | 'record' | 'actors';

export type PresentationFrame = {
	actIndex: number;
	actProgress: number;
	storyProgress: number;
	lane: PresentationLane;
};

const laneByStory: Record<StorySlug, PresentationLane> = {
	'balance-claim': 'claim',
	tls13: 'record',
	tlsnotary: 'actors'
};

export function getPresentationFrame(
	storySlug: StorySlug,
	actIndex: number,
	actProgress: number,
	motionOff: boolean
): PresentationFrame {
	const safeIndex = Math.max(0, Math.min(8, Math.trunc(actIndex)));
	const safeProgress = Math.max(0, Math.min(1, actProgress));
	const visibleProgress = motionOff ? (safeProgress >= 0.5 ? 1 : 0) : safeProgress;

	return {
		actIndex: safeIndex,
		actProgress: visibleProgress,
		storyProgress: (safeIndex + visibleProgress) / 9,
		lane: laneByStory[storySlug]
	};
}
