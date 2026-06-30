import { getHomeContent, type Locale } from '$lib/portfolio/content';

export function load({ params }) {
	const locale = params.locale as Locale;

	return {
		locale,
		content: getHomeContent(locale)
	};
}
