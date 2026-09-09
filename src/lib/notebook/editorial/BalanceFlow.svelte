<script lang="ts">
	import { balanceFlowFixture as fixture, balanceFlowScene } from './balance-flow';

	let {
		stage,
		progress,
		staticMode = false
	}: { stage: string; progress: number; staticMode?: boolean } = $props();
	const id = $props.id();
	const scene = $derived(balanceFlowScene(stage, progress, staticMode));
</script>

<figure
	class="balance-flow"
	data-balance-flow
	data-stage={scene.stage}
	data-verification={scene.verification}
	data-decision={scene.decision}
	data-payload={scene.payload}
	data-balance-disclosed={scene.balanceDisclosedToVerifier}
	data-static={staticMode}
	aria-labelledby={`${id}-caption`}
>
	<div class="drawing" aria-hidden="true">
		<div class="flow-heading"><strong>{scene.label}</strong><span>교육용</span></div>
		<div class="transport">
			<div class="endpoints"><span>{scene.from}</span><span>{scene.to}</span></div>
			<svg viewBox="0 0 600 42" preserveAspectRatio="none" focusable="false">
				<path class="route" d="M 12 21 H 588 M 580 15 L 588 21 L 580 27" />
				<g transform={`translate(${12 + scene.travel * 576}, 21)`}>
					<rect class="traveller" x="-9" y="-5" width="18" height="10" />
				</g>
			</svg>
			<p class="transport-label">{scene.travelling}</p>
		</div>

		<div class="payload" class:payload--claim={scene.payload === 'claim'}>
			{#if scene.payload === 'condition'}
				<div class="payload-title">
					<span>가입에 필요한 잔액 조건</span><strong>5,000만 원 이상</strong>
				</div>
				<dl>
					<div>
						<dt>잔액 종류</dt>
						<dd>ITAV / 가용 잔액</dd>
					</div>
					<div>
						<dt>통화·부호</dt>
						<dd>KRW / Credit</dd>
					</div>
					<div>
						<dt>신용한도</dt>
						<dd>잔액에 합산하지 않음</dd>
					</div>
				</dl>
			{:else if scene.payload === 'request'}
				<div class="payload-title">
					<span>검증 요청값</span><strong class="identifier">{fixture.challenge}</strong>
				</div>
				<dl>
					<div>
						<dt>audience</dt>
						<dd>{fixture.audience}</dd>
					</div>
					<div>
						<dt>만료 시각</dt>
						<dd>10:29:20 +09:00</dd>
					</div>
					<div>
						<dt>요청·서비스 결합</dt>
						<dd>제출 자료와 함께 검사</dd>
					</div>
				</dl>
			{:else if scene.payload === 'response'}
				<div class="payload-title">
					<span>Prover가 읽은 잔액</span><strong>{fixture.amountLabel}</strong>
				</div>
				<dl>
					<div>
						<dt>Amount.Amount</dt>
						<dd class="identifier">"{fixture.amount}"</dd>
					</div>
					<div>
						<dt>Amount.Currency</dt>
						<dd>KRW</dd>
					</div>
					<div>
						<dt>같이 고정할 규칙</dt>
						<dd>JSON 경로 + 십진수 비교</dd>
					</div>
				</dl>
			{:else}
				<div class="payload-title">
					<span>Verifier에게 제출하는 결과</span><strong class="claim-value"
						>premiumEligible: true</strong
					>
				</div>
				<dl>
					<div>
						<dt>검사한 조건</dt>
						<dd>KRW 5,000만 원 이상</dd>
					</div>
					<div>
						<dt>실제 잔액</dt>
						<dd class="private-value">비공개</dd>
					</div>
					<div>
						<dt>함께 묶은 맥락</dt>
						<dd>challenge + audience</dd>
					</div>
				</dl>
			{/if}
			<p class="payload-note">
				{#if scene.stage === 'proof'}TLS 기반 출처 확인 + 별도 ZKP 비교
				{:else if scene.stage === 'response'}Data.Balance에서 대상 계좌·ITAV 항목 선택
				{:else if scene.stage === 'verification'}true라는 값만 읽는 것이 아닙니다.
				{:else if scene.stage === 'failure'}금액을 숨겼으므로 새 기준 충족 여부는 아직 모릅니다.
				{:else if scene.stage === 'decision'}서비스는 현재의 시간·금액·검증 방식 정책을 적용합니다.
				{:else}실제 계좌 조회나 증명 생성은 실행하지 않습니다.{/if}
			</p>
		</div>

		{#if scene.stage === 'verification'}
			<div class="checks">
				{#each scene.verificationChecks as check (check.label)}
					<div class:checked={check.complete}>
						<span>{check.label}</span><b>{check.complete ? '확인' : '대기'}</b>
					</div>
				{/each}
			</div>
		{:else if scene.stage === 'failure'}
			<div class="failures">
				<div class:active-case={scene.failureCase === 'freshness' || staticMode}>
					<span>자료 나이 <b>480초 &gt; 300초</b></span><strong>denied</strong>
				</div>
				<div class:active-case={scene.failureCase === 'threshold' || staticMode}>
					<span>가입 기준 <b>5,000만 → 7,000만 원</b></span><strong>reproofRequired</strong>
				</div>
			</div>
		{:else}
			<p class="context-note">
				{scene.stage === 'proof'
					? '선택 공개만으로 숨긴 금액을 비교할 수는 없습니다.'
					: scene.stage === 'decision'
						? '검증과 가입 결정은 별도의 단계입니다.'
						: 'AccountId만으로 계좌 소유권까지 확인되지는 않습니다.'}
			</p>
		{/if}

		<div class="outcomes">
			<div class:complete={scene.verification === 'verified'}>
				<span>제출 자료 검사</span>
				<strong
					>{scene.verification === 'verified'
						? 'verified'
						: scene.verification === 'checking'
							? '검사 중'
							: '검사 전'}</strong
				>
			</div>
			<div class:complete={scene.decision !== 'pending'}>
				<span>서비스 가입 결정</span>
				<strong>{scene.decision === 'pending' ? '아직 판단 안 함' : scene.decision}</strong>
			</div>
		</div>
	</div>
	<figcaption id={`${id}-caption`}>{scene.caption}</figcaption>
</figure>

<style>
	.balance-flow {
		--flow-accent: #ff5500;
		--flow-line: #3e4039;
		margin: 0;
		min-width: 0;
		color: #eeeae2;
		container-type: inline-size;
	}
	.drawing {
		padding: 20px 24px;
		background: #171914;
		border: 1px solid var(--flow-line);
	}
	.flow-heading {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: baseline;
	}
	.flow-heading strong {
		font-size: 16px;
		font-weight: 550;
	}
	.flow-heading > span {
		font-size: 11px;
		color: #a7aaa0;
	}
	.transport {
		margin: 18px 0 13px;
	}
	.endpoints {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		font: 12px/1.5 var(--font-mono, Consolas, monospace);
		color: #c4c5bd;
	}
	.transport svg {
		display: block;
		width: 100%;
		height: 30px;
		overflow: visible;
	}
	.route {
		fill: none;
		stroke: #65685e;
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.traveller {
		fill: var(--flow-accent);
	}
	.transport-label {
		margin: -2px 0 0;
		text-align: center;
		font-size: 11px;
		color: #c4c5bd;
	}
	.payload {
		border-left: 2px solid #65685e;
		padding: 0 0 0 16px;
	}
	.payload--claim {
		border-left-color: var(--flow-accent);
	}
	.payload-title {
		display: grid;
		gap: 5px;
	}
	.payload-title > span {
		font-size: 12px;
		color: #b4b6ac;
	}
	.payload-title > strong {
		font-size: clamp(20px, 4.5cqw, 29px);
		line-height: 1.35;
		font-weight: 500;
		letter-spacing: -0.04em;
	}
	.payload-title > .identifier,
	.payload-title > .claim-value {
		font-family: var(--font-mono, Consolas, monospace);
		font-size: clamp(15px, 3.9cqw, 22px);
		letter-spacing: -0.055em;
		overflow-wrap: anywhere;
	}
	dl {
		margin: 13px 0 0;
		display: grid;
		gap: 7px;
	}
	dl > div {
		display: grid;
		grid-template-columns: 130px minmax(0, 1fr);
		gap: 12px;
		font-size: 12px;
		line-height: 1.5;
	}
	dt {
		color: #a7aaa0;
	}
	dd {
		margin: 0;
		color: #eeeae2;
		overflow-wrap: anywhere;
	}
	.identifier {
		font-family: var(--font-mono, Consolas, monospace);
	}
	.private-value {
		color: #eeeae2;
	}
	.payload-note {
		min-height: 18px;
		margin: 14px 0 0;
		font-size: 11px;
		line-height: 1.55;
		color: #b4b6ac;
	}
	.context-note {
		min-height: 42px;
		display: flex;
		align-items: center;
		margin: 13px 0 0;
		font-size: 12px;
		line-height: 1.65;
		color: #b4b6ac;
	}
	.checks {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px 16px;
		margin: 19px 0 17px;
		font-size: 11px;
	}
	.checks > div {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		color: #a7aaa0;
	}
	.checks b {
		font-weight: 400;
	}
	.checks .checked {
		color: #eeeae2;
	}
	.checks .checked b {
		color: var(--flow-accent);
	}
	.failures {
		display: grid;
		gap: 6px;
		margin: 15px 0 16px;
		font-size: 11px;
	}
	.failures > div {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		border-left: 2px solid transparent;
		padding: 2px 0 2px 9px;
		color: #a7aaa0;
	}
	.failures .active-case {
		border-left-color: var(--flow-accent);
		color: #eeeae2;
	}
	.failures b {
		font-weight: 400;
		margin-left: 5px;
	}
	.failures strong {
		font: 11px/1.5 var(--font-mono, Consolas, monospace);
	}
	.outcomes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		margin-top: 12px;
		padding-top: 15px;
		border-top: 1px solid var(--flow-line);
	}
	.outcomes > div {
		min-width: 0;
		display: grid;
		gap: 5px;
	}
	.outcomes span {
		font-size: 11px;
		color: #a7aaa0;
	}
	.outcomes strong {
		color: #c4c5bd;
		font-size: clamp(13px, 3.3cqw, 18px);
		line-height: 1.5;
		font-weight: 450;
		overflow-wrap: anywhere;
	}
	.outcomes .complete strong {
		color: #eeeae2;
	}
	figcaption {
		margin-top: 12px;
		font-size: 11px;
		line-height: 1.65;
		color: #b4b6ac;
	}
	@container (max-width: 430px) {
		.drawing {
			padding: 20px 16px;
		}
		dl > div {
			grid-template-columns: 105px minmax(0, 1fr);
			gap: 7px;
		}
		.checks {
			grid-template-columns: 1fr;
		}
		.failures > div {
			flex-direction: column;
			gap: 2px;
		}
		.outcomes {
			gap: 15px;
		}
	}
</style>
