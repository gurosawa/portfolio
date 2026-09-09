import type { Locale } from '$lib/portfolio/content';
import { getStory, storySlugs } from '$lib/notebook/story';
import { getOpsCatalog, opsArticlePath } from './ops/catalog';

export type NotebookArea = 'ops' | 'sec';
export type NotebookKind = 'concept' | 'reference' | 'experiment';
export type PreviewKind = 'pipeline' | 'tls' | 'claim' | 'mpc';
export type NotebookEntry = {
	id: string;
	slug: string;
	title: string;
	description: string;
	href: string;
	areas: NotebookArea[];
	kind: NotebookKind;
	series: string;
	format: 'story' | 'article';
	readingTime: string;
	date: string;
	authorLabel: string;
	tags: string[];
	preview: PreviewKind;
};
export const kindLabels: Record<NotebookKind, string> = {
	concept: '개념 설명',
	reference: '자료 정리',
	experiment: '직접 실험'
};
export type NotebookHome = {
	locale: Locale;
	comingSoon: boolean;
	meta: { title: string; description: string };
	entries: NotebookEntry[];
	featuredIds: string[];
};
export function notebookCanonicalPath(locale: Locale) {
	return `/${locale}/notebook/` as const;
}
const storySummaries = {
	'balance-claim': {
		description:
			'잔액을 공개하지 않고 가입 조건을 확인할 수 있을까? API 응답에서 시작해 제출 자료와 서비스의 최종 판단까지 따라갑니다.',
		tags: ['zkTLS', 'API', '선택 공개'],
		preview: 'claim'
	},
	tls13: {
		description:
			'ClientHello부터 암호화된 응답까지. HTTPS가 보호하는 것과 저장한 JSON만으로는 확인할 수 없는 것을 살펴봅니다.',
		tags: ['TLS 1.3', 'HTTPS', '네트워크'],
		preview: 'tls'
	},
	tlsnotary: {
		description:
			'Server, Prover, Notary, Verifier. 같은 세션에 참여해도 각자가 볼 수 있는 데이터와 맡은 역할은 다릅니다.',
		tags: ['TLSNotary', 'MPC-TLS', 'zkTLS'],
		preview: 'mpc'
	}
} as const;
export function getNotebookHome(locale: Locale): NotebookHome {
	const stories: NotebookEntry[] = storySlugs.map((slug) => {
		const story = getStory(slug);
		const summary = storySummaries[slug];
		return {
			id: `zktls-${slug}`,
			slug,
			title: story.meta.title,
			description: summary.description,
			href: story.meta.canonicalPath,
			areas: ['sec'],
			kind: 'concept',
			series: 'zkTLS',
			format: 'story',
			readingTime: story.meta.readingMinutes,
			date: story.meta.technicallyReviewedAt,
			authorLabel: '홍범',
			tags: [...summary.tags],
			preview: summary.preview
		};
	});
	const operations: NotebookEntry[] = getOpsCatalog().map((post) => ({
		id: `ops-${post.slug}`,
		slug: post.slug,
		title: post.title.replace(/ [—–] /g, ': '),
		description: post.description,
		href: opsArticlePath(post.slug),
		areas: /keycloak|cert-manager|oidc|rbac/i.test(post.slug) ? ['ops', 'sec'] : ['ops'],
		kind: 'reference',
		series: 'MLOps Notes',
		format: 'article',
		readingTime: `${post.readingMinutes}분`,
		date: post.updated,
		authorLabel: 'HPE 엔지니어 자료 기반',
		tags: post.tags,
		preview: /keycloak|cert-manager/.test(post.slug) ? 'tls' : 'pipeline'
	}));
	return {
		locale,
		comingSoon: locale === 'en',
		meta: {
			title: 'Systems Notebook / 홍범',
			description:
				'인프라 운영, 배포, TLS와 zkTLS. 자료를 정리하고 시스템의 동작 과정을 살펴보는 홍범의 기술 노트.'
		},
		entries: locale === 'ko' ? [...stories, ...operations] : [],
		featuredIds: ['ops-10-gitlab-harbor-argocd-end-to-end', 'zktls-tls13', 'zktls-balance-claim']
	};
}
