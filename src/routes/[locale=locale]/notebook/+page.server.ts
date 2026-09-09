import { getNotebookHome } from '$lib/notebook/notebook';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ params }) => {
	const locale = params.locale === 'en' ? 'en' : 'ko';
	return { locale, notebook: getNotebookHome(locale) };
};
