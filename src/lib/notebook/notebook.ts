import type { Locale } from '$lib/portfolio/content';
import { getStory, storySlugs } from '$lib/notebook/story';

export type NotebookStoryCard = {
	index: string;
	slug: string;
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
		return {
			index: String(index + 1).padStart(2, '0'),
			slug,
			title: story.meta.title,
			description: story.meta.description,
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
			title: '시스템이 무엇을 보호하고, 어디서 판단을 넘기는지 기록한다.',
			description:
				'한 API 응답을 세 번 들여다본다. claim이 되는 과정, TLS 1.3 연결의 보호 범위, TLSNotary에서 참여자마다 달라지는 가시성을 차례로 따라간다.'
		},
		series: {
			label: 'Featured Interactive Series',
			status: '세 편 모두 공개',
			title: 'zkTLS Stories',
			description:
				'세 글은 같은 가상 계좌와 잔액 조건을 공유한다. 각각 독립적으로 읽을 수 있지만 01에서 03으로 읽으면 데이터가 바뀌는 모습과 보호 범위가 자연스럽게 이어진다.',
			items
		},
		archive: {
			label: 'External Archive',
			title: 'CI/CD & Operations Notes',
			description:
				'무중단 운영과 배포 실패, 복구 판단을 정리한 기존 기록은 내용을 바꾸지 않고 외부 아카이브로 연결한다.',
			href: externalArchive,
			cta: '외부 아카이브 열기'
		}
	};
}
