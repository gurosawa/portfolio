import catalog from './catalog.json';

export type OpsCatalogEntry = (typeof catalog)[number];

export const opsProvenance = {
	label: '자료 정리',
	description:
		'HPE 엔지니어의 작업 자료를 바탕으로 정리한 글입니다. 개인 실험 기록이나 HPE 공식 문서와는 구분합니다.'
};

export function getOpsCatalog(): OpsCatalogEntry[] {
	return catalog;
}

export function opsArticlePath(slug: string) {
	return `/ko/notebook/ops/${slug}/`;
}
