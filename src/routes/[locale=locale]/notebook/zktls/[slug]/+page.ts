import { error } from '@sveltejs/kit';
import { getStory, storySlugs } from '$lib/notebook/story';

export const entries = () => storySlugs.map((slug) => ({ locale: 'ko', slug }));

export function load({ params }) {
	if (params.locale !== 'ko') {
		error(404, 'English edition coming soon');
	}

	try {
		return { story: getStory(params.slug) };
	} catch {
		error(404, 'Story not found');
	}
}
