export const notaryFlowStages = [
	'roles',
	'session',
	'mpc',
	'attestation',
	'disclosure',
	'verification',
	'failure'
] as const;

export type NotaryFlowStage = (typeof notaryFlowStages)[number];
export type NotaryRole = 'prover' | 'server' | 'notary' | 'verifier';
export type NotaryCheck = 'notary' | 'signature' | 'opening' | 'server' | 'claim';
export type NotaryCheckState = 'pending' | 'checking' | 'passed' | 'rejected';

export const notaryRoles = [
	{ id: 'prover', label: 'Prover', detail: '가입 신청자', x: 100, y: 66 },
	{ id: 'server', label: 'Server', detail: 'api.bank.example', x: 500, y: 66 },
	{ id: 'notary', label: 'Notary', detail: '세션 검사와 서명', x: 100, y: 274 },
	{ id: 'verifier', label: 'Verifier', detail: 'premium.example', x: 500, y: 274 }
] as const;

export const notaryChecks: readonly { id: NotaryCheck; label: string }[] = [
	{ id: 'notary', label: '허용한 Notary' },
	{ id: 'signature', label: 'Notary 서명' },
	{ id: 'opening', label: 'commitment와 opening' },
	{ id: 'server', label: '서버 식별 자료와 이름' },
	{ id: 'claim', label: '응답 해석과 추가 ZKP' }
];

export const notaryFailures: readonly {
	id: string;
	label: string;
	check: NotaryCheck;
	reason: string;
}[] = [
	{
		id: 'untrusted-notary',
		label: '허용 목록 밖의 Notary',
		check: 'notary',
		reason: '서명은 맞아도 서비스가 받아들이지 않습니다.'
	},
	{
		id: 'opening-mismatch',
		label: 'opening 불일치',
		check: 'opening',
		reason: '공개 자료가 commitment와 맞지 않습니다.'
	},
	{
		id: 'wrong-server',
		label: '다른 서버의 응답',
		check: 'server',
		reason: '진짜 응답이어도 요구한 은행의 자료가 아닙니다.'
	}
];

export function clampNotaryProgress(value: number) {
	return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

const between = (value: number, start: number, end: number) =>
	clampNotaryProgress((value - start) / (end - start));

/** Conceptual, reversible narrative state. Does not run TLS, MPC or proof verification. */
export function notaryFlowScene(inputStage: string, inputProgress: number, staticMode = false) {
	const stage: NotaryFlowStage = notaryFlowStages.includes(inputStage as NotaryFlowStage)
		? (inputStage as NotaryFlowStage)
		: 'roles';
	const index = notaryFlowStages.indexOf(stage);
	const progress = staticMode ? 1 : clampNotaryProgress(inputProgress);
	const after = (candidate: NotaryFlowStage, threshold: number) =>
		index > notaryFlowStages.indexOf(candidate) || (stage === candidate && progress >= threshold);
	const responseReceived = after('mpc', 0.88);
	const signed = after('attestation', 0.82);
	const delivered = after('disclosure', 0.88);
	const verified = stage === 'verification' && progress >= 0.96;
	const failureIndex = Math.min(2, Math.floor(progress * 3));
	const failure = stage === 'failure' ? notaryFailures[failureIndex] : null;
	const checks = notaryChecks.map((check, checkIndex) => {
		let state: NotaryCheckState = 'pending';
		if (stage === 'verification') {
			const local = between(progress, checkIndex * 0.18 + 0.03, checkIndex * 0.18 + 0.2);
			state = local >= 1 ? 'passed' : local > 0 ? 'checking' : 'pending';
		}
		if (failure) {
			const failedIndex = notaryChecks.findIndex((item) => item.id === failure.check);
			state =
				checkIndex < failedIndex ? 'passed' : checkIndex === failedIndex ? 'rejected' : 'pending';
		}
		return { ...check, state };
	});
	const requestProgress = stage === 'mpc' ? between(progress, 0.12, 0.4) : index > 2 ? 1 : 0;
	const responseProgress = stage === 'mpc' ? between(progress, 0.51, 0.84) : index > 2 ? 1 : 0;
	const computeProgress =
		stage === 'session'
			? between(progress, 0.08, 0.9)
			: stage === 'mpc'
				? progress
				: index > 2
					? 1
					: 0;
	const signatureProgress =
		stage === 'attestation' ? between(progress, 0.14, 0.82) : index > 3 ? 1 : 0;
	const presentationProgress =
		stage === 'disclosure' ? between(progress, 0.3, 0.88) : index > 4 ? 1 : 0;
	const status = {
		roles: '네 역할을 구분합니다. 은행 연결은 아직 시작하지 않았습니다.',
		session: 'Prover와 Notary가 세션 한도와 공동 계산을 준비합니다.',
		mpc: responseReceived
			? 'Prover가 잔액을 읽습니다. Notary는 응답 평문을 읽지 않습니다.'
			: responseProgress > 0
				? '은행 응답은 TLS 암호문으로 Prover에게 돌아옵니다.'
				: 'TLS 요청은 은행으로, 공동 계산은 Notary와 진행합니다.',
		attestation: signed
			? 'Notary 서명을 받았습니다. 은행의 잔액 증명서가 아닙니다.'
			: '통신 기록과 서버 식별 자료의 commitment에 서명을 받습니다.',
		disclosure: delivered
			? '선택 공개한 자료와 추가 ZKP가 Verifier에게 도착했습니다.'
			: 'Prover가 선택 공개 자료와 별도의 조건 증명을 묶어 보냅니다.',
		verification: verified
			? '자료 검사 완료. 최종 가입 허용은 서비스 정책으로 판단합니다.'
			: '서명부터 서버 식별 자료, 추가 조건 증명까지 차례로 검사합니다.',
		failure: failure?.reason ?? ''
	}[stage];
	return {
		stage,
		progress,
		responseReceived,
		signed,
		delivered,
		verified,
		approved: false,
		requestProgress,
		responseProgress,
		computeProgress,
		signatureProgress,
		presentationProgress,
		checks,
		failure,
		status,
		visibility: {
			prover: responseReceived ? '잔액 72,840,000원' : '로그인 정보 보유',
			server: responseReceived ? '자신이 보낸 응답' : '일반 TLS 서버',
			notary: signed
				? 'commitment와 서명'
				: index >= 1
					? '키 지분과 계산 자료'
					: '응답 평문 미공개',
			verifier: delivered ? '공개 내용과 추가 ZKP' : '제출 자료 대기'
		},
		notarySeesPlaintext: false,
		verifierSeesBalance: false,
		claimRequiresAdditionalZkp: true
	};
}
