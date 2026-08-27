import type { Locale } from '$lib/portfolio/content';
import { getStory, storySlugs } from '$lib/notebook/story';

export type NotebookStoryCard = {
	index: string;
	slug: string;
	topic: string;
	title: string;
	description: string;
	href: string;
	readingTime: string;
	actCount: number;
};

export type NotebookHome = {
	locale: Locale;
	comingSoon: boolean;
	meta: {
		title: string;
		description: string;
	};
	hero: {
		eyebrow: string;
		title: string;
		description: string;
	};
	series: {
		label: string;
		status: string;
		title: string;
		description: string;
		items: NotebookStoryCard[];
	};
	archive: {
		label: string;
		title: string;
		description: string;
		href: string;
		cta: string;
	};
};

const externalArchive = 'https://brave-hill-0cb321b00.7.azurestaticapps.net/#home';

const storyCatalogCopy = {
	'balance-claim': {
		topic: 'API 응답 / 조건 증명',
		description:
			'잔액은 숨기고 5,000만 원 이상이라는 조건만 제출한다. 제출 자료가 유효해도 가입 여부는 서비스 정책이 따로 결정한다.'
	},
	tls13: {
		topic: 'TLS 1.3 / 보호 범위',
		description:
			'Handshake와 Record Protocol이 전송 중 연결을 보호하는 과정을 따라간다. 저장한 JSON 사본만으로 응답 출처를 확인할 수 없는 이유도 짚는다.'
	},
	tlsnotary: {
		topic: 'MPC-TLS / 참여자 역할',
		description:
			'Server, Prover, Notary, Verifier가 한 세션에서 무엇을 보고 만들고 검사하는지 구분한다.'
	}
} as const;

export function notebookCanonicalPath(locale: Locale) {
	return `/${locale}/notebook/` as const;
}

export function getNotebookHome(locale: Locale): NotebookHome {
	if (locale === 'en') {
		return {
			locale,
			comingSoon: true,
			meta: {
				title: 'Systems Notebook / English edition coming soon',
				description: 'The English edition of Systems Notebook is being prepared.'
			},
			hero: {
				eyebrow: 'Systems Notebook',
				title: 'English edition coming soon.',
				description: 'The Korean edition is available now. The English articles will follow.'
			},
			series: {
				label: 'Featured Interactive Series',
				status: 'Preparing translation',
				title: 'zkTLS Stories',
				description: '',
				items: []
			},
			archive: {
				label: 'External Archive',
				title: 'CI/CD & Operations Notes',
				description: 'Existing field notes remain in their original archive.',
				href: externalArchive,
				cta: 'Open external archive'
			}
		};
	}

	const items = storySlugs.map((slug, index) => {
		const story = getStory(slug);
		const catalogCopy = storyCatalogCopy[slug];
		return {
			index: String(index + 1).padStart(2, '0'),
			slug,
			topic: catalogCopy.topic,
			title: story.meta.title,
			description: catalogCopy.description,
			href: story.meta.canonicalPath,
			readingTime: story.meta.readingMinutes,
			actCount: story.acts.length
		};
	});

	return {
		locale,
		comingSoon: false,
		meta: {
			title: 'Systems Notebook / 홍범',
			description:
				'zkTLS의 데이터 출처와 선택 공개를 스크롤 서사로 풀고, 운영 현장의 CI/CD 기록으로 연결하는 Systems Notebook.'
		},
		hero: {
			eyebrow: 'Systems Notebook',
			title: '보호는 어디까지고,\n판단은 어디서 시작되는가.',
			description:
				'같은 은행 API 응답을 세 번 따라간다. 조건을 증명하는 과정, TLS 1.3의 보호 범위, TLSNotary 참여자의 역할을 차례로 살핀다.'
		},
		series: {
			label: 'zkTLS 연재',
			status: '세 편 모두 공개',
			title: 'zkTLS 글 3편',
			description:
				'각 글은 독립적으로 읽을 수 있다. 01부터 읽으면 같은 응답이 TLS 연결을 거쳐 제출 자료가 되고, 서비스 판단으로 이어지는 흐름을 한 번에 볼 수 있다.',
			items
		},
		archive: {
			label: '기존 운영 기록',
			title: 'CI/CD & Operations Notes',
			description:
				'배포 실패와 복구 판단을 정리한 기존 운영 기록은 원문 그대로 외부 아카이브에서 읽을 수 있다.',
			href: externalArchive,
			cta: '운영 기록 열기'
		}
	};
}
