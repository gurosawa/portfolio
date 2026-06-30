import { error } from '@sveltejs/kit';
import { getHomeContent, getWork, type Locale } from '$lib/portfolio/content';

export function load({ params }) {
	const locale = params.locale as Locale;
	const work = getWork(locale, params.slug);

	if (!work) {
		error(404, 'Work note not found');
	}

	return {
		locale,
		work,
		content: getHomeContent(locale)
	};
}
