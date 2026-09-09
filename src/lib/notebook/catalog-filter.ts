import type { NotebookArea, NotebookEntry, NotebookKind } from './notebook';

export type CatalogFilter = {
	area?: NotebookArea | 'all';
	kind?: NotebookKind | 'all';
	query?: string;
};

export function filterNotebook(entries: NotebookEntry[], filter: CatalogFilter) {
	const words = (filter.query ?? '')
		.normalize('NFKC')
		.trim()
		.toLocaleLowerCase()
		.split(/\s+/)
		.filter(Boolean);
	return entries.filter((entry) => {
		if (filter.area && filter.area !== 'all' && !entry.areas.includes(filter.area)) return false;
		if (filter.kind && filter.kind !== 'all' && entry.kind !== filter.kind) return false;
		const searchable = [
			entry.title,
			entry.description,
			entry.series,
			entry.authorLabel,
			...entry.tags
		]
			.join(' ')
			.normalize('NFKC')
			.toLocaleLowerCase();
		return words.every((word) => searchable.includes(word));
	});
}
