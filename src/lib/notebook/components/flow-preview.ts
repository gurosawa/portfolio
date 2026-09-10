import { detailedPreview } from './detailed-preview';

export type FlowPreviewKind = 'pipeline' | 'ml' | 'tls' | 'claim' | 'mpc' | 'inference';

export type PreviewNode = {
	id: string;
	x: number;
	y: number;
	width: number;
	title: string;
	detail: string;
	value?: string;
	shape: 'document' | 'process' | 'registry' | 'service' | 'actor';
	accent?: boolean;
};

export type PreviewConnection = {
	id?: string;
	from?: string;
	to?: string;
	path: string;
	label?: string;
	x?: number;
	y?: number;
	dashed?: boolean;
	bidirectional?: boolean;
};

export type PreviewScene = {
	title: string;
	description: string;
	caption: string;
	nodes: PreviewNode[];
	connections: PreviewConnection[];
	phases?: {
		id: string;
		label: string;
		title: string;
		description: string;
		nodes: string[];
		connections: string[];
	}[];
};

export function previewSize(kind: FlowPreviewKind, narrow: boolean) {
	if (kind === 'inference') return { width: narrow ? 360 : 640, height: narrow ? 570 : 510 };
	return {
		width: narrow ? 360 : 640,
		height:
			kind === 'ml'
				? narrow
					? 884
					: 594
				: kind === 'pipeline'
					? narrow
						? 704
						: 566
					: narrow
						? 480
						: 400
	};
}

const layouts: Record<'claim' | 'mpc', [number, number][]> = {
	claim: [
		[24, 60],
		[376, 60],
		[376, 264]
	],
	mpc: [
		[28, 48],
		[426, 48],
		[28, 270],
		[426, 270]
	]
};

const narrowLayouts: Record<'claim' | 'mpc', [number, number][]> = {
	claim: [
		[10, 40],
		[170, 200],
		[10, 360]
	],
	mpc: [
		[10, 50],
		[202, 50],
		[10, 330],
		[202, 330]
	]
};

/** A conceptual preview, not a live deployment or a protocol transcript. */
export function previewScene(kind: FlowPreviewKind, narrow: boolean): PreviewScene {
	if (kind === 'inference') {
		const positions = narrow
			? [
					[10, 40],
					[202, 40],
					[202, 220],
					[10, 220],
					[10, 400],
					[202, 400]
				]
			: [
					[16, 50],
					[238, 50],
					[460, 50],
					[460, 326],
					[238, 326],
					[16, 326]
				];
		const roles = [
			['request', 'Request', '질문·목적 확인'],
			['scope', 'Scope', '기간·단위·권한'],
			['search', 'Search', '근거·자료 확보'],
			['calculate', 'Calculate', '증가량·비율'],
			['verify', 'Verify', '주장·근거 대조'],
			['response', 'Response', '답과 판단 한계']
		];
		const paths = narrow
			? [
					'M 158 94 H 202',
					'M 276 148 V 220',
					'M 202 274 H 158',
					'M 84 328 V 400',
					'M 158 454 H 202'
				]
			: [
					'M 180 104 H 238',
					'M 402 104 H 460',
					'M 542 158 V 326',
					'M 460 380 H 402',
					'M 238 380 H 180'
				];
		return {
			title: '요청에서 검증한 응답까지',
			description:
				'질문의 목적과 허용 범위를 확인하고, 근거를 찾고, 값을 계산한 뒤 주장과 자료를 대조합니다. 확보하지 못한 근거는 최종 응답의 한계로 남깁니다.',
			caption: '판매 분석 요청의 개념도. 실제 모델 호출이나 처리 시간을 나타내지 않습니다.',
			nodes: roles.map(([id, title, detail], index) => ({
				id,
				title,
				detail,
				x: positions[index][0],
				y: positions[index][1],
				width: narrow ? 148 : 164,
				shape: index === 0 ? 'document' : 'process',
				accent: index === 5
			})),
			connections: paths.map((path, index) => ({
				id: `inference-${index}`,
				from: roles[index][0],
				to: roles[index + 1][0],
				path
			})),
			phases: [
				{
					id: 'input',
					label: '요청과 범위',
					title: '무엇을 답할 수 있는가',
					description:
						'기간·단위·접근 범위를 먼저 정합니다. 허용되지 않은 도구로 경로를 바꾸지 않습니다.',
					nodes: ['request', 'scope'],
					connections: ['inference-0']
				},
				{
					id: 'evidence',
					label: '검색과 계산',
					title: '필요한 근거와 값을 얻기',
					description:
						'자료를 확보하고 계산합니다. 자료 없음과 형식 오류는 다른 다음 행동으로 이어집니다.',
					nodes: ['search', 'calculate'],
					connections: ['inference-2']
				},
				{
					id: 'answer',
					label: '검증과 응답',
					title: '계산된 값과 해석을 대조하기',
					description: '확인한 판매 증가와 아직 입증하지 못한 원인을 구분해 전달합니다.',
					nodes: ['verify', 'response'],
					connections: ['inference-4']
				}
			]
		};
	}
	if (kind === 'pipeline' || kind === 'ml') return detailedPreview(kind, narrow);
	if (kind === 'tls') {
		return {
			title: 'Client에서 Server까지',
			description:
				'ClientHello는 Client에서 Server로, ServerHello는 Server에서 Client로 전달됩니다. 인증과 키 확인 등 나머지 핸드셰이크를 마친 뒤 암호화된 Record로 데이터를 주고받습니다.',
			caption: '핸드셰이크의 일부 메시지와 이후의 데이터 전송을 보여주는 개념도입니다.',
			nodes: [],
			connections: []
		};
	}

	const positions = (narrow ? narrowLayouts : layouts)[kind];
	const node = (
		index: number,
		id: string,
		title: string,
		detail: string,
		shape: PreviewNode['shape'],
		options: { width?: number; value?: string; accent?: boolean } = {}
	): PreviewNode => ({
		id,
		x: positions[index][0],
		y: positions[index][1],
		width: narrow ? 148 : 172,
		title,
		detail,
		shape,
		...options,
		...(narrow ? { width: kind === 'claim' ? 180 : 148 } : {})
	});

	if (kind === 'claim') {
		return {
			title: '응답에서 가입 조건까지',
			description:
				'가상의 은행 API 응답에서 잔액이 5,000만 원 이상이라는 조건을 확인합니다. 정확한 잔액을 공개하지 않는 추가 증명 절차를 거쳐도, 서비스의 가입 허용 여부는 별도로 판단합니다.',
			caption:
				'가상 금융 API 예시입니다. 잔액을 숨긴 조건 검사는 별도 ZKP 등을 전제로 하며 실제 계산은 실행하지 않습니다.',
			nodes: [
				node(0, 'response', 'API 응답', 'bank.example', 'document', {
					width: 228,
					value: '잔액은 비공개'
				}),
				node(1, 'condition', '조건 확인', '5,000만 원 이상', 'process', {
					width: 228,
					value: 'true',
					accent: true
				}),
				node(2, 'policy', '서비스 정책', '가입 허용은 별도 판단', 'service', { width: 228 })
			],
			connections: narrow
				? [{ path: 'M 100 148 V 170 H 260 V 200' }, { path: 'M 260 308 V 334 H 100 V 360' }]
				: [
						{ path: 'M 252 114 H 376', label: '조건만 공개', x: 314, y: 96 },
						{ path: 'M 490 168 V 264', label: '검사 결과', x: 545, y: 224 }
					]
		};
	}

	return {
		title: '누가 무엇을 보는가',
		description:
			'Server는 응답을 제공하고 Prover는 응답 평문을 읽습니다. Notary는 응답 평문을 읽지 않고 Prover와 TLS 계산을 함께 수행합니다. Verifier는 이후 선택 공개된 자료와 Notary의 서명 등을 검사합니다.',
		caption:
			'Notary가 평문을 중계하는 구조가 아닙니다. 잔액을 숨긴 조건 결과에는 선택 공개와 별도의 증명 절차가 필요합니다.',
		nodes: [
			node(0, 'server', 'Server', '응답 제공', 'actor'),
			node(1, 'prover', 'Prover', '평문 응답을 읽음', 'actor', { accent: true }),
			node(2, 'notary', 'Notary', '응답 평문은 비공개', 'actor'),
			node(3, 'verifier', 'Verifier', '선택 공개 자료 검사', 'actor')
		],
		connections: narrow
			? [
					{ path: 'M 158 104 H 202' },
					{
						path: 'M 276 158 V 216 H 84 V 330',
						dashed: true,
						bidirectional: true,
						label: '공동 TLS 계산',
						x: 180,
						y: 204
					},
					{ path: 'M 276 158 V 330', label: '제출 자료', x: 276, y: 276 }
				]
			: [
					{ path: 'M 200 102 H 426', label: 'TLS 응답', x: 313, y: 84 },
					{
						path: 'M 464 156 V 202 H 114 V 270',
						dashed: true,
						bidirectional: true,
						label: '공동 TLS 계산',
						x: 273,
						y: 190
					},
					{ path: 'M 550 156 V 270', label: '제출 자료', x: 592, y: 220 }
				]
	};
}
