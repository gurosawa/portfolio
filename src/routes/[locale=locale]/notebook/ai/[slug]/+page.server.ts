import { error } from '@sveltejs/kit';
import { aiArticles } from '$lib/notebook/ai/catalog';
import { getAiArticle } from '$lib/notebook/ai/articles.server';
import type { PageServerLoad } from './$types';

export const entries = () => aiArticles.map(({ slug }) => ({ locale: 'ko', slug }));
export const load: PageServerLoad = ({ params }) => {
	if (params.locale !== 'ko') error(404, '한국어 원고만 발행되어 있습니다.');
	const article = getAiArticle(params.slug);
	if (!article) error(404, '글을 찾을 수 없습니다.');
	return { article };
};
