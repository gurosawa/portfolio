import { error } from '@sveltejs/kit';
import {
	getHomeContent,
	getWork,
	supportedLocales,
	workSlugs,
	type Locale
} from '$lib/portfolio/content';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	supportedLocales.flatMap((locale) => workSlugs.map((slug) => ({ locale, slug })));

export const load: PageLoad = ({ params }) => {
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
};
