import { syntheticBalanceFixture } from '$lib/notebook/content/zktls/fixture';

export const balanceFlowStages = [
	'condition',
	'request',
	'response',
	'proof',
	'verification',
	'decision',
	'failure'
] as const;

export type BalanceFlowStage = (typeof balanceFlowStages)[number];
export type BalanceVerification = 'not-started' | 'checking' | 'verified';
export type BalanceDecision = 'pending' | 'approved' | 'denied' | 'reproofRequired';

const balance = syntheticBalanceFixture.Data.Balance[0];

export const balanceFlowFixture = {
	amount: balance.Amount.Amount,
	currency: balance.Amount.Currency,
	account: balance.AccountId,
	amountLabel: '72,840,000원',
	threshold: '50000000.00',
	newThreshold: '70000000.00',
	challenge: 'challenge_demo_001',
	audience: 'premium.example',
	ageSeconds: 480,
	maxAgeSeconds: 300
} as const;

const stages: Record<
	BalanceFlowStage,
	{ label: string; from: string; to: string; travelling: string }
> = {
	condition: {
		label: '검사할 조건',
		from: 'premium.example',
		to: '잔액 조건',
		travelling: '5,000만 원 이상'
	},
	request: {
		label: '이번 요청의 식별값',
		from: 'Verifier',
		to: 'Prover',
		travelling: 'challenge'
	},
	response: {
		label: '원문을 해석한 잔액',
		from: 'api.bank.example',
		to: 'Prover',
		travelling: 'API 응답'
	},
	proof: {
		label: '금액 대신 제출하는 결과',
		from: 'Prover',
		to: 'Verifier',
		travelling: '제출 자료'
	},
	verification: {
		label: '제출 자료 검사',
		from: '제출 자료',
		to: 'Verifier',
		travelling: '같은 조건인지 검사'
	},
	decision: {
		label: '현재 정책 적용',
		from: 'Verifier',
		to: 'premium.example',
		travelling: 'verified'
	},
	failure: {
		label: '검증 성공 뒤의 다른 결정',
		from: 'Verifier',
		to: 'premium.example',
		travelling: '같은 verified'
	}
};

const clamp = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0);
const phase = (progress: number, start: number, end: number) =>
	clamp((progress - start) / (end - start));

/** Educational, deterministic scroll state. This does not verify or generate a proof. */
export function balanceFlowScene(stage: string, progress: number, staticMode = false) {
	const current: BalanceFlowStage = balanceFlowStages.includes(stage as BalanceFlowStage)
		? (stage as BalanceFlowStage)
		: 'condition';
	const index = balanceFlowStages.indexOf(current);
	const amount = staticMode ? 1 : clamp(progress);
	const verification: BalanceVerification =
		index > 4 || (current === 'verification' && amount >= 0.85)
			? 'verified'
			: current === 'verification'
				? 'checking'
				: 'not-started';
	const failureCase = current === 'failure' ? (amount < 0.5 ? 'freshness' : 'threshold') : null;
	const decision: BalanceDecision =
		current === 'failure'
			? failureCase === 'freshness'
				? 'denied'
				: 'reproofRequired'
			: current === 'decision' && amount >= 0.7
				? 'approved'
				: 'pending';
	const showClaim = index > 3 || (current === 'proof' && amount >= 0.35);
	const payload = showClaim
		? 'claim'
		: current === 'proof' || current === 'response'
			? 'response'
			: current === 'request'
				? 'request'
				: 'condition';
	const verificationChecks = [
		'원본 서버와 세션',
		'challenge와 사용 대상',
		'응답과 JSON 해석 규칙',
		'잔액 조건과 공개 결과'
	].map((label, i) => ({
		label,
		complete: verification === 'verified' || (current === 'verification' && amount >= (i + 1) * 0.2)
	}));
	const travel = current === 'proof' ? phase(amount, 0.35, 0.9) : phase(amount, 0.12, 0.82);
	const caption =
		current === 'condition'
			? 'KRW 가용 잔액 5,000만 원 이상을 검사합니다. Credit 상태이며 신용한도는 잔액에 합산하지 않습니다.'
			: current === 'request'
				? 'Verifier가 Prover에게 challenge를 발급합니다. 제출 자료를 이번 premium.example 요청에 연결합니다.'
				: current === 'response'
					? 'Prover가 은행 응답에서 72,840,000원이라는 잔액을 읽습니다. 응답 원문과 JSON 해석 규칙을 함께 묶습니다.'
					: current === 'proof'
						? 'Prover는 실제 잔액을 숨기고 premiumEligible: true를 제출합니다. TLS 기반 출처 확인과 별도의 ZKP 비교를 결합한 개념 모델입니다.'
						: current === 'verification'
							? 'Verifier가 서버, 요청, 응답 해석, 잔액 조건을 확인합니다. verified가 되어도 서비스 가입은 아직 결정하지 않았습니다.'
							: current === 'decision'
								? '서비스는 verified 결과에 현재 정책을 적용합니다. 필요한 정책 검사를 모두 통과하면 approved가 됩니다.'
								: '검증은 두 사례 모두 verified입니다. 자료 나이 480초가 허용 범위 300초를 넘으면 denied, 기준이 5,000만 원에서 7,000만 원으로 바뀌면 reproofRequired입니다. 위조나 잔액 부족을 뜻하지 않습니다.';

	return {
		stage: current,
		progress: amount,
		...stages[current],
		payload,
		showClaim,
		travel,
		verification,
		verificationChecks,
		decision,
		failureCase,
		caption,
		balanceDisclosedToVerifier: false,
		ownershipVerified: false,
		proofForged: false
	};
}
