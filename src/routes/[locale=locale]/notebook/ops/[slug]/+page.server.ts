import { error, redirect } from '@sveltejs/kit';
import { getOpsCatalog, opsArticlePath } from '$lib/notebook/ops/catalog';
import { getOpsArticle } from '$lib/notebook/ops/articles.server';
import type { PageServerLoad } from './$types';

export const entries = () =>
	getOpsCatalog().flatMap(({ slug }) => [
		{ locale: 'ko', slug },
		{ locale: 'en', slug }
	]);

export const load: PageServerLoad = ({ params }) => {
	const article = getOpsArticle(params.slug);
	if (!article) error(404, '글을 찾을 수 없습니다.');
	if (params.locale !== 'ko') redirect(307, opsArticlePath(params.slug));
	return { article };
};
