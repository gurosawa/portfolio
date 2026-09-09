import snapshot from './snapshot.json';
import { getOpsCatalog } from './catalog';
import { renderArticle } from './markdown';

export function getOpsArticle(slug: string) {
	const article = snapshot.posts.find((post) => post.slug === slug);
	if (!article) return undefined;
	const { body, ...metadata } = article;
	const catalog = getOpsCatalog();
	const index = catalog.findIndex((post) => post.slug === slug);
	return {
		...metadata,
		...renderArticle(body),
		previous: catalog[index - 1] ?? null,
		next: catalog[index + 1] ?? null
	};
}

export type OpsArticle = NonNullable<ReturnType<typeof getOpsArticle>>;
