export type Locale = 'ko' | 'en';

export type DualCopy = {
	surface: string;
	inner: string;
};

export type NavItem = {
	label: string;
	href: string;
};

export type TerminalRow = {
	command: string;
	output: string;
};

export type WorkItem = DualCopy & {
	slug: string;
	title: string;
	status: string;
	tags: string[];
	cta: string;
	externalUrl?: string;
};

export type TimelineEntry = {
	period: string;
	title: string;
	context: string;
	description: string;
};

export type ContactLink = {
	label: string;
	href?: string;
	disabled?: boolean;
};

export type HomeContent = {
	locale: Locale;
	alternateLocale: Locale;
	meta: {
		title: string;
		description: string;
	};
	header: {
		name: string;
		nav: NavItem[];
		languageLabel: string;
	};
	hero: DualCopy & {
		kicker: string;
		title: string;
	};
	terminal: {
		label: string;
		rows: TerminalRow[];
	};
	about: DualCopy & {
		title: string;
	};
	workIntro: DualCopy & {
		title: string;
	};
	works: WorkItem[];
	history: {
		title: string;
		description: string;
		entries: TimelineEntry[];
	};
	lessons: {
		title: string;
		items: DualCopy[];
	};
	motto: DualCopy & {
		title: string;
	};
	contact: DualCopy & {
		title: string;
		links: ContactLink[];
	};
};

export const supportedLocales: Locale[] = ['ko', 'en'];

export const terminalSafetyPatterns = [
	/\b\d{1,3}(?:\.\d{1,3}){3}\b/,
	/\bssh\b/i,
	/internal\s+ip/i,
	/localhost:\d+/i,
	/127\.0\.0\.1/i,
	/\bvllm\b/i,
	/model\s+server/i,
	/private\s+infrastructure/i,
	/\btoken\b/i
];

const navByLocale: Record<Locale, NavItem[]> = {
	ko: [
		{ label: 'About', href: '#about' },
		{ label: 'What I Do', href: '#work' },
		{ label: 'History', href: '#history' },
		{ label: 'Notes', href: '#notes' },
		{ label: 'Contact', href: '#contact' }
	],
	en: [
		{ label: 'About', href: '#about' },
		{ label: 'What I Do', href: '#work' },
		{ label: 'History', href: '#history' },
		{ label: 'Notes', href: '#notes' },
		{ label: 'Contact', href: '#contact' }
	]
};

const sharedContacts: ContactLink[] = [
	{ label: 'Email', href: 'mailto:heterotopia@disroot.org' },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/rebewxam/' },
	{ label: 'Soram', href: 'https://soram.vercel.app/' },
	{ label: 'GitHub', disabled: true }
];

const koWorks: WorkItem[] = [
	{
		title: 'Soram',
		slug: 'soram',
		status: 'prototype',
		surface: '언어 장벽을 허무는 실시간 글로벌 통번역 솔루션.',
		inner: '여행지에서 만난 사람과 말이 안 통해서 만들어버린 웹앱.',
		tags: ['translation', 'web app', 'product'],
		externalUrl: 'https://soram.vercel.app/',
		cta: 'Open demo'
	},
	{
		title: 'ZERO DOWNTIME',
		slug: 'infra-troubleshooting',
		status: 'notes',
		surface: '엔터프라이즈 환경의 무중단 인프라 유지보수와 장애 대응 플레이북 구축 경험.',
		inner: '새벽 3시 서버 다운의 공포 속에서 안 잘리려고 몰래 수집한 생존형 스킬 모음집.',
		tags: ['infrastructure', 'troubleshooting', 'operations'],
		cta: 'Coming soon'
	},
	{
		title: 'UNPACKING ZKTLS',
		slug: 'zktls-research',
		status: 'research',
		surface: '차세대 프라이버시 보호를 위한 보안 전송 계층과 증명 가능한 신뢰 구조 탐구.',
		inner: '멋져 보여서 시작했는데 아직 코드 한 줄 못 짠 완전 쌩초보.',
		tags: ['privacy', 'security', 'research'],
		cta: 'Coming soon'
	},
	{
		title: 'AI ON-PREMISE',
		slug: 'local-ai-ops-notes',
		status: 'running experiment',
		surface: '외부 API에 의존하지 않고 로컬 환경에서 AI 에이전트를 구성해본 운영 기록.',
		inner:
			'챗봇 하나 붙여보려던 건데, 어느새 네트워크와 모델 서빙을 보고 있다. AI도 결국 인프라였다.',
		tags: ['local ai', 'vllm', 'llmops', 'infrastructure'],
		cta: 'Coming soon'
	}
];

const enWorks: WorkItem[] = [
	{
		title: 'Soram',
		slug: 'soram',
		status: 'prototype',
		surface: 'A real-time translation service for crossing language barriers.',
		inner:
			'I met someone while traveling, couldn’t talk properly, and apparently decided to build a web app about it.',
		tags: ['translation', 'web app', 'product'],
		externalUrl: 'https://soram.vercel.app/',
		cta: 'Open demo'
	},
	{
		title: 'ZERO DOWNTIME',
		slug: 'infra-troubleshooting',
		status: 'notes',
		surface:
			'High-availability infrastructure maintenance and incident-response playbook notes in an enterprise environment.',
		inner: 'A survival kit quietly assembled under the fear of 3 a.m. server alerts.',
		tags: ['infrastructure', 'troubleshooting', 'operations'],
		cta: 'Coming soon'
	},
	{
		title: 'UNPACKING ZKTLS',
		slug: 'zktls-research',
		status: 'research',
		surface: 'Research notes on privacy-preserving transport layers and verifiable trust.',
		inner:
			'I started because it looked cool. I still haven’t written a proper line of code for it.',
		tags: ['privacy', 'security', 'research'],
		cta: 'Coming soon'
	},
	{
		title: 'AI ON-PREMISE',
		slug: 'local-ai-ops-notes',
		status: 'running experiment',
		surface:
			'Operational notes from building a local AI agent setup without relying on external APIs.',
		inner:
			'I tried to connect a chatbot and ended up debugging networking, model serving, and agent permissions. AI was infrastructure all along.',
		tags: ['local ai', 'vllm', 'llmops', 'infrastructure'],
		cta: 'Coming soon'
	}
];

export const workSlugs = koWorks.map((work) => work.slug);

const content: Record<Locale, HomeContent> = {
	ko: {
		locale: 'ko',
		alternateLocale: 'en',
		meta: {
			title: '홍범 / HONGBEOM JOO',
			description: '전통적인 인프라와 새로운 AI 레이어의 접점, 그 경계에서 무작정 빌드해 보는 기록.'
		},
		header: {
			name: '홍범 / HONGBEOM JOO',
			nav: navByLocale.ko,
			languageLabel: 'KO / EN'
		},
		hero: {
			kicker: 'local-only portfolio MVP',
			title: 'BOUNDARIES IN MOTION.',
			surface:
				'전통적인 인프라와 새로운 <span class="text-[#FF5500]">AI 레이어의 접점</span>,\n그 경계에서 무작정 빌드해 보는 기록.',
			inner:
				'아직 내가 뭘 하는 사람인지 완전히 모르겠어서,\n일단 <span class="text-[#FF5500]">신경 쓰이는 것들</span>을 만들고 있습니다.'
		},
		terminal: {
			label: 'synthetic identity terminal',
			rows: [
				{
					command: '$ whoami',
					output: 'boundary-first builder'
				},
				{
					command: '$ status',
					output: 'building at the edge of infra and local ai'
				},
				{
					command: '$ current_focus',
					output: 'portfolio systems, troubleshooting notes, local agents'
				},
				{
					command: '$ warning',
					output: 'do not reboot first'
				}
			]
		},
		about: {
			title: 'DETERMINISTIC SYSTEMS, PROBABILISTIC FUTURES.',
			surface:
				'금융권 인프라에서 <span class="text-[#FF5500]">무중단 안정성</span>을 지켰고,\n이제는 AI 접점에서 <span class="text-[#FF5500]">예측 불가능성</span>을 다룹니다.',
			inner:
				'떨어뜨리면 발등 찍히는 정직한 하드웨어가 참 좋았는데,\n요즘은 <span class="text-[#FF5500]">말귀 못 알아듣는 AI</span>한테 일 좀 하라고 사정하는 중입니다.'
		},
		workIntro: {
			title: 'SELECTED COMMITS.',
			surface:
				'현재의 <span class="text-[#FF5500]">기술적 관심사</span>와 <span class="text-[#FF5500]">아키텍처적 실험</span>을 대변하는 네 개의 작업물.',
			inner:
				'솔직히 제가 지금 인프라맨인지 AI 개발자인지 저도 잘 모르겠습니다.\n하나로 깔끔하게 정리하려다가 포기했고 이미 제 이성 또한 함께 로그아웃한 지 오래입니다.'
		},
		works: koWorks,
		history: {
			title: 'History',
			description: 'This section is a factual anchor. Do not force inner-monologue copy here.',
			entries: [
				{
					period: '2023-2025',
					title: 'Infrastructure Field Engineer',
					context: 'HPE hardware partner environment',
					description:
						'Server provisioning, hardware delivery, and physical infrastructure maintenance for financial institutions.'
				},
				{
					period: '2025-Now',
					title: 'Infrastructure & AI Operations',
					context: 'Internal AI enablement',
					description: 'Internal AI enablement, local AI operations, and workflow experimentation.'
				}
			]
		},
		lessons: {
			title: 'Things I learned the hard way',
			items: [
				{
					surface:
						'장애 대응은 빠른 복구보다 <span class="text-[#FF5500]">정확한 관찰</span>에서 시작됩니다.',
					inner:
						'가장 먼저 해야 할 일은 <span class="text-[#FF5500]">재부팅하고 싶은 충동</span>을 참는 것입니다.'
				},
				{
					surface:
						'AI 에이전트도 <span class="text-[#FF5500]">권한과 경계</span>가 설계되어야 합니다.',
					inner:
						'모델이 무서운 게 아닙니다. 모델에게 <span class="text-[#FF5500]">"알아서 해"</span>라고 하는 게 무서운 겁니다.'
				},
				{
					surface:
						'기술의 지속 가능성을 위해 <span class="text-[#FF5500]">지속적인 학습</span>과 스택 업데이트가 필수적입니다.',
					inner:
						'어제의 정답이 오늘은 <span class="text-[#FF5500]">레거시</span>가 되는 세상이니까요.'
				}
			]
		},
		motto: {
			title: 'Motto',
			surface: 'Good systems are <span class="text-[#FF5500]">understandable</span>.',
			inner: '적어도 <span class="text-[#FF5500]">새벽 3시</span>에는 그래야만 합니다.'
		},
		contact: {
			title: 'Contact',
			surface: 'Email / GitHub / LinkedIn',
			inner: '이상한 아이디어일수록 답장이 빠를 수 있습니다.',
			links: sharedContacts
		}
	},
	en: {
		locale: 'en',
		alternateLocale: 'ko',
		meta: {
			title: 'HONGBEOM JOO / BOUNDARIES IN MOTION',
			description:
				'A record of building at the edge between traditional infrastructure and the new AI layer.'
		},
		header: {
			name: '홍범 / HONGBEOM JOO',
			nav: navByLocale.en,
			languageLabel: 'KO / EN'
		},
		hero: {
			kicker: 'local-only portfolio MVP',
			title: 'BOUNDARIES IN MOTION.',
			surface:
				'The intersection of traditional infrastructure and the new <span class="text-[#FF5500]">AI layer</span>,\nbuilding blindly at that boundary.',
			inner:
				'I still don’t fully know what I am yet,\nso I’m just building <span class="text-[#FF5500]">things that bother me</span>.'
		},
		terminal: {
			label: 'synthetic identity terminal',
			rows: [
				{
					command: '$ whoami',
					output: 'boundary-first builder'
				},
				{
					command: '$ status',
					output: 'building at the edge of infra and local ai'
				},
				{
					command: '$ current_focus',
					output: 'portfolio systems, troubleshooting notes, local agents'
				},
				{
					command: '$ warning',
					output: 'do not reboot first'
				}
			]
		},
		about: {
			title: 'DETERMINISTIC SYSTEMS, PROBABILISTIC FUTURES.',
			surface:
				'Built <span class="text-[#FF5500]">high-availability</span> in financial infra.\nNow navigating <span class="text-[#FF5500]">unpredictability</span> at the AI edge.',
			inner:
				'I miss honest hardware that just crushed your foot if dropped.\nNow I’m begging <span class="text-[#FF5500]">stubborn AI models</span> to just do their job.'
		},
		workIntro: {
			title: 'SELECTED COMMITS.',
			surface:
				'Four works that represent my current <span class="text-[#FF5500]">technical interests</span> and <span class="text-[#FF5500]">architectural experiments</span>.',
			inner:
				'Honestly, I’m not sure whether I’m an infrastructure person or an AI developer right now.\nI tried to summarize it cleanly, failed, and my sanity has been logged out for a while.'
		},
		works: enWorks,
		history: {
			title: 'History',
			description: 'This section is a factual.',
			entries: [
				{
					period: '2023-2025',
					title: 'Infrastructure Field Engineer',
					context: 'HPE hardware partner environment',
					description:
						'Server provisioning, hardware delivery, and physical infrastructure maintenance for financial institutions.'
				},
				{
					period: '2025-Now',
					title: 'Infrastructure & AI Operations',
					context: 'Internal AI enablement',
					description: 'Internal AI enablement, local AI operations, and workflow experimentation.'
				}
			]
		},
		lessons: {
			title: 'Things I learned the hard way',
			items: [
				{
					surface:
						'Incident response starts with <span class="text-[#FF5500]">accurate observation</span>, not just fast recovery.',
					inner:
						'The first skill is resisting the <span class="text-[#FF5500]">urge to reboot</span> everything.'
				},
				{
					surface:
						'AI agents also need <span class="text-[#FF5500]">permissions and boundaries</span>.',
					inner:
						'The model is not the scary part. The scary part is telling it, <span class="text-[#FF5500]">"just do it."</span>'
				},
				{
					surface:
						'Continuous learning is essential for <span class="text-[#FF5500]">technical sustainability</span>.',
					inner:
						'Because yesterday’s answer becomes today’s <span class="text-[#FF5500]">legacy</span>.'
				}
			]
		},
		motto: {
			title: 'Motto',
			surface: 'Good systems are <span class="text-[#FF5500]">understandable</span>.',
			inner: 'Ultimately, what matters is <span class="text-[#FF5500]">controllability</span>.'
		},
		contact: {
			title: 'Contact',
			surface: 'Email / GitHub / LinkedIn',
			inner: 'The stranger the idea, the faster I might reply.',
			links: sharedContacts
		}
	}
};

export function getHomeContent(locale: Locale) {
	return content[locale];
}

export function getWork(locale: Locale, slug: string) {
	return content[locale].works.find((work) => work.slug === slug);
}
