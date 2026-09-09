export type FlowPreviewKind = 'pipeline' | 'tls' | 'claim' | 'mpc';

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
};

const layouts: Record<Exclude<FlowPreviewKind, 'tls'>, [number, number][]> = {
	pipeline: [
		[28, 62],
		[252, 62],
		[462, 62],
		[356, 264]
	],
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

const narrowLayouts: Record<Exclude<FlowPreviewKind, 'tls'>, [number, number][]> = {
	pipeline: [
		[10, 58],
		[202, 58],
		[202, 314],
		[10, 314]
	],
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

	if (kind === 'pipeline') {
		return {
			title: '코드가 실행되기까지',
			description:
				'Git commit에서 시작해 CI가 이미지를 빌드합니다. Registry에 저장된 이미지를 배포 환경으로 가져와 실행합니다.',
			caption:
				'Commit부터 실행까지의 개념적 흐름입니다. 특정 실습 환경의 실제 배포 상태가 아닙니다.',
			nodes: [
				node(0, 'commit', 'Git commit', '코드 변경', 'document'),
				node(1, 'build', 'CI build', '이미지 빌드', 'process'),
				node(2, 'registry', 'Registry', '이미지 저장', 'registry'),
				node(3, 'deploy', 'Deploy', '가져와서 실행', 'service', { width: 210, accent: true })
			],
			connections: narrow
				? [
						{ path: 'M 158 112 H 202' },
						{ path: 'M 276 166 V 314', label: 'image', x: 276, y: 248 },
						{ path: 'M 202 368 H 158' }
					]
				: [
						{ path: 'M 200 116 H 252' },
						{ path: 'M 424 116 H 462' },
						{
							path: 'M 548 170 V 220 Q 548 236 532 236 H 461 V 264',
							label: 'container image',
							x: 374,
							y: 226
						}
					]
		};
	}

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
