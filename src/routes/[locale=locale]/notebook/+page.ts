import { getNotebookHome } from '$lib/notebook/notebook';
import type { Locale } from '$lib/portfolio/content';

export function load({ params }) {
	const locale = params.locale as Locale;

	return {
		locale,
		notebook: getNotebookHome(locale)
	};
}
