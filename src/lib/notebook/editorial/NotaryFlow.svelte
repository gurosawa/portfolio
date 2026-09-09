<script lang="ts">
	import { onMount } from 'svelte';
	import { notaryFlowScene, notaryRoles, notaryFailures, type NotaryRole } from './notary-flow';

	let {
		stage,
		progress,
		staticMode = false
	}: {
		stage: string;
		progress: number;
		staticMode?: boolean;
	} = $props();
	const id = $props.id();
	let systemReduced = $state(true);
	const scene = $derived(notaryFlowScene(stage, progress, staticMode || systemReduced));
	const complete = $derived(staticMode || systemReduced);
	const activeRoles = $derived<readonly NotaryRole[]>(
		stage === 'mpc'
			? ['prover', 'server', 'notary']
			: stage === 'session' || stage === 'attestation'
				? ['prover', 'notary']
				: stage === 'disclosure'
					? ['prover', 'verifier']
					: stage === 'verification' || stage === 'failure'
						? ['verifier']
						: []
	);
	const isChecking = $derived(stage === 'verification' || stage === 'failure');
	const stateLabels = {
		pending: '대기',
		checking: '검사 중',
		passed: '통과',
		rejected: '거절'
	} as const;

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (systemReduced = preference.matches);
		sync();
		preference.addEventListener('change', sync);
		return () => preference.removeEventListener('change', sync);
	});
</script>

<!-- Educational role diagram, not a packet capture or a rendering of an SDK interface. -->
<figure
	class="notary-flow"
	data-notary-flow
	data-stage={scene.stage}
	data-static={complete}
	data-response-received={scene.responseReceived}
	data-signed={scene.signed}
	data-presentation-delivered={scene.delivered}
	data-verified={scene.verified}
	data-approved={scene.approved}
	data-notary-sees-plaintext={scene.notarySeesPlaintext}
	data-verifier-sees-balance={scene.verifierSeesBalance}
	data-failure={scene.failure?.id ?? 'none'}
	aria-labelledby={`${id}-caption`}
>
	<div class="diagram" aria-hidden="true">
		<svg viewBox="0 0 600 334" role="presentation" focusable="false">
			<g class="tls-route" data-path="prover-server" data-kind="direct-tls">
				<path class="route" d="M 188 54 H 412" />
				<path class="route" d="M 412 84 H 188" />
				<path class="arrow" d="m 404 50 8 4 -8 4 M 196 80 l -8 4 8 4" />
				<text class="route-label" x="300" y="39" text-anchor="middle">TLS 요청</text>
				<text class="route-label" x="300" y="105" text-anchor="middle">TLS 응답</text>
				{#if scene.requestProgress > 0}
					<path
						class="travel"
						d="M 188 54 H 412"
						pathLength="1"
						stroke-dasharray="1"
						stroke-dashoffset={1 - scene.requestProgress}
					/>
				{/if}
				{#if stage === 'mpc' && scene.requestProgress > 0 && scene.requestProgress < 1}
					<g class="packet" transform={`translate(${188 + 224 * scene.requestProgress}, 54)`}>
						<rect x="-9" y="-4" width="18" height="8" />
					</g>
				{/if}
				{#if scene.responseProgress > 0}
					<path
						class="travel"
						d="M 412 84 H 188"
						pathLength="1"
						stroke-dasharray="1"
						stroke-dashoffset={1 - scene.responseProgress}
					/>
				{/if}
				{#if stage === 'mpc' && scene.responseProgress > 0 && scene.responseProgress < 1}
					<g class="packet" transform={`translate(${412 - 224 * scene.responseProgress}, 84)`}>
						<rect x="-9" y="-4" width="18" height="8" />
					</g>
				{/if}
			</g>

			<g data-path="prover-notary" data-kind="mpc-computation">
				<path class="route computation" d="M 100 112 V 234" />
				<path class="arrow" d="m 96 120 4 -8 4 8 M 96 226 l 4 8 4 -8" />
				{#if scene.computeProgress > 0 && stage !== 'attestation'}
					<path
						class="travel computation"
						class:past={stage !== 'session' && stage !== 'mpc'}
						d="M 100 112 V 234"
						pathLength="1"
						stroke-dasharray="0.06 0.03"
						opacity={scene.computeProgress}
					/>
				{/if}
				<text class="route-label" x="121" y="161">MPC 공동 연산</text>
				<text class="route-detail" x="121" y="181">평문 중계가 아닙니다</text>
				{#if stage === 'session' || stage === 'mpc'}
					<g class="packet" transform={`translate(100, ${112 + 122 * scene.computeProgress})`}>
						<rect x="-4" y="-6" width="8" height="12" />
					</g>
				{/if}
			</g>

			{#if stage === 'attestation' || scene.signed}
				<g data-path="notary-prover" data-kind="signed-attestation">
					<path class="route" d="M 68 234 V 112" />
					<path
						class="travel"
						class:past={stage !== 'attestation'}
						d="M 68 234 V 112"
						pathLength="1"
						stroke-dasharray="1"
						stroke-dashoffset={1 - scene.signatureProgress}
					/>
					{#if stage === 'attestation'}
						<g class="packet" transform={`translate(68, ${234 - 122 * scene.signatureProgress})`}>
							<rect x="-9" y="-6" width="18" height="12" />
						</g>
					{/if}
					<text class="route-detail" x="121" y="208">Notary 서명 → Prover</text>
				</g>
			{/if}

			{#if stage === 'disclosure' || scene.delivered}
				<g data-path="prover-verifier" data-kind="presentation">
					<path class="route" d="M 188 112 L 412 234" />
					<path
						class="travel"
						class:past={isChecking}
						d="M 188 112 L 412 234"
						pathLength="1"
						stroke-dasharray="1"
						stroke-dashoffset={1 - scene.presentationProgress}
					/>
					<g
						class="packet"
						transform={`translate(${188 + 224 * scene.presentationProgress}, ${112 + 122 * scene.presentationProgress})`}
					>
						<rect x="-10" y="-6" width="20" height="12" />
					</g>
					<text class="route-label" x="360" y="148" text-anchor="middle">제출 자료</text>
				</g>
			{/if}

			{#each notaryRoles as actor (actor.id)}
				<g class="actor" class:active={activeRoles.includes(actor.id)} data-role={actor.id}>
					<rect x={actor.x - 88} y={actor.y - 40} width="176" height="86" />
					<text class="actor-name" x={actor.x} y={actor.y - 14} text-anchor="middle"
						>{actor.label}</text
					>
					<text class="actor-detail" x={actor.x} y={actor.y + 5} text-anchor="middle"
						>{actor.detail}</text
					>
					<text class="actor-visibility" x={actor.x} y={actor.y + 27} text-anchor="middle"
						>{scene.visibility[actor.id]}</text
					>
				</g>
			{/each}
		</svg>
	</div>

	<div class="flow-inspector">
		{#if stage === 'failure'}
			<p class="inspector-label">독립적인 실패 사례</p>
			<ul class="failure-list">
				{#each notaryFailures as failure (failure.id)}
					<li
						class:focused={complete || scene.failure?.id === failure.id}
						data-failure-case={failure.id}
					>
						<strong>{failure.label}</strong>
						<span>{failure.reason}</span>
					</li>
				{/each}
			</ul>
		{:else if stage === 'verification'}
			<p class="inspector-label">Verifier의 제출 자료 검사</p>
			<ol class="check-list">
				{#each scene.checks as check (check.id)}
					<li data-check={check.id} data-check-state={check.state}>
						<span>{check.label}</span><strong>{stateLabels[check.state]}</strong>
					</li>
				{/each}
			</ol>
		{:else if stage === 'disclosure'}
			<p class="inspector-label">Verifier에게 보낼 내용</p>
			<dl class="payload">
				<div>
					<dt>선택 공개</dt>
					<dd>HTTP 맥락 + 서명 + opening</dd>
				</div>
				<div>
					<dt>추가 ZKP</dt>
					<dd><code>premiumEligible: true</code></dd>
				</div>
				<div>
					<dt>잔액 원문</dt>
					<dd>공개하지 않음</dd>
				</div>
			</dl>
		{:else if stage === 'attestation'}
			<p class="inspector-label">Session Header</p>
			<dl class="payload">
				<div>
					<dt>고정한 자료</dt>
					<dd>통신 기록 + 서버 식별 자료</dd>
				</div>
				<div>
					<dt>서명자</dt>
					<dd>Notary</dd>
				</div>
				<div>
					<dt>상태</dt>
					<dd>{scene.signed ? '서명 받음' : 'commitment에 서명 요청'}</dd>
				</div>
			</dl>
		{:else if stage === 'mpc'}
			<p class="inspector-label">같은 응답, 다른 공개 범위</p>
			<dl class="payload">
				<div>
					<dt>Prover</dt>
					<dd>{scene.responseReceived ? '72,840,000원' : '응답 수신과 복호화 대기'}</dd>
				</div>
				<div>
					<dt>Notary</dt>
					<dd>평문과 서버 이름은 숨김</dd>
				</div>
				<div>
					<dt>메타데이터</dt>
					<dd>세션 시간과 통신량 등은 보일 수 있음</dd>
				</div>
			</dl>
		{:else if stage === 'session'}
			<p class="inspector-label">은행 연결 전 준비</p>
			<dl class="payload">
				<div>
					<dt>세션</dt>
					<dd><code>trace_tlsn12_001</code></dd>
				</div>
				<div>
					<dt>함께 준비</dt>
					<dd>데이터 한도와 공동 계산 자원</dd>
				</div>
				<div>
					<dt>Prover에 남음</dt>
					<dd>은행 로그인 정보</dd>
				</div>
			</dl>
		{:else}
			<p class="inspector-label">두 연결을 구분해서 읽습니다</p>
			<dl class="payload">
				<div>
					<dt>Prover ↔ Server</dt>
					<dd>실제 TLS 요청과 응답</dd>
				</div>
				<div>
					<dt>Prover ↔ Notary</dt>
					<dd>암호 연산을 함께 수행</dd>
				</div>
				<div>
					<dt>Verifier</dt>
					<dd>나중에 별도로 제출 자료 검사</dd>
				</div>
			</dl>
		{/if}
	</div>
	<p class="sr-only">
		Prover와 Server가 직접 TLS로 통신하고, Prover와 Notary는 별도로 공동 연산을 합니다. Notary는
		응답 평문을 읽지 않습니다. Prover는 Notary 서명과 선택 공개 자료, 추가 ZKP를 Verifier에게
		보냅니다. Verifier의 자료 검사와 서비스 가입 허용은 별개입니다.
	</p>
	<figcaption id={`${id}-caption`}>{scene.status}</figcaption>
</figure>

<style>
	.notary-flow {
		margin: 0;
		width: 100%;
		max-width: 650px;
		color: #eeeae2;
	}
	.diagram {
		width: 100%;
		display: flex;
		justify-content: center;
	}
	svg {
		display: block;
		width: 100%;
		max-width: 560px;
		height: auto;
		overflow: visible;
		font-family: var(--font-body, sans-serif);
	}
	.route,
	.arrow {
		fill: none;
		stroke: #71766a;
		stroke-width: 1;
	}
	.computation {
		stroke-dasharray: 5 5;
	}
	.travel {
		fill: none;
		stroke: #ff5500;
		stroke-width: 2;
	}
	.travel.past {
		stroke: #a7ad9b;
		stroke-width: 1.1;
	}
	.packet {
		fill: #ff5500;
	}
	.route-label {
		fill: #c4c5bd;
		font-size: 13px;
	}
	.route-detail {
		fill: #a7ad9b;
		font-size: 12px;
	}
	.actor rect {
		fill: #151610;
		stroke: #55594e;
		stroke-width: 1;
	}
	.actor.active rect {
		fill: #1d1e17;
		stroke: #ff5500;
		stroke-width: 1.3;
	}
	.actor-name {
		fill: #eeeae2;
		font-size: 19px;
		font-weight: 600;
	}
	.actor-detail {
		fill: #c4c5bd;
		font-size: 12px;
	}
	.actor-visibility {
		fill: #c4c5bd;
		font-size: 12px;
	}
	.actor.active .actor-visibility {
		fill: #eeeae2;
	}
	.flow-inspector {
		padding: 16px 0 0;
		border-top: 1px solid #3a3d33;
		min-height: 110px;
	}
	.inspector-label {
		margin: 0 0 12px;
		color: #eeeae2;
		font-size: 14px;
		font-weight: 600;
		line-height: 1.5;
	}
	.payload {
		margin: 0;
		display: grid;
		gap: 7px;
		font-size: 13px;
		line-height: 1.55;
	}
	.payload > div {
		display: grid;
		grid-template-columns: minmax(120px, 0.75fr) minmax(0, 1.5fr);
		gap: 12px;
	}
	dt {
		color: #a7ad9b;
	}
	dd {
		margin: 0;
		color: #c4c5bd;
		overflow-wrap: anywhere;
	}
	code {
		font-family: var(--font-mono, monospace);
		font-size: 12px;
	}
	.check-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px 20px;
	}
	.check-list li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 12px;
		color: #c4c5bd;
	}
	.check-list strong {
		flex-shrink: 0;
		font-size: 11px;
		font-weight: 400;
		color: #a7ad9b;
	}
	.check-list [data-check-state='checking'] strong {
		color: #ff7b3c;
	}
	.check-list [data-check-state='passed'] strong {
		color: #eeeae2;
	}
	.failure-list {
		display: grid;
		gap: 9px;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.failure-list li {
		display: grid;
		grid-template-columns: minmax(140px, 0.8fr) minmax(0, 1.5fr);
		gap: 12px;
		border-left: 2px solid #55594e;
		padding-left: 10px;
		font-size: 12px;
		line-height: 1.45;
		color: #a7ad9b;
	}
	.failure-list li.focused {
		border-left-color: #ff5500;
		color: #eeeae2;
	}
	.failure-list strong {
		font-weight: 500;
	}
	.failure-list span {
		color: #c4c5bd;
	}
	figcaption {
		min-height: 44px;
		margin: 16px 0 0;
		max-width: 60ch;
		font-size: 13px;
		line-height: 1.65;
		color: #c4c5bd;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (max-width: 767px) {
		.flow-inspector {
			min-height: 0;
		}
		.payload > div {
			grid-template-columns: minmax(95px, 0.7fr) minmax(0, 1.4fr);
		}
		.check-list {
			grid-template-columns: 1fr;
		}
		.failure-list li {
			grid-template-columns: 1fr;
			gap: 2px;
		}
	}
</style>
