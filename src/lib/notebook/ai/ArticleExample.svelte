<script lang="ts">
	import type { AiWidget } from './catalog';
	import {
		exampleModels,
		expectedCoverage,
		selectedSuccess,
		routingCost,
		percent
	} from './calculations';
	import replay from '../../../../static/notebook/ai/release-replay-result.json';
	let { kind }: { kind: AiWidget } = $props();
	let attempts = $state(4);
	let selection = $state(60);
	let question = $state(0);
	let escalation = $state(0.2);
	let release = $state('model-only');
	const coverage = $derived(expectedCoverage(exampleModels.B, attempts));
	const finalSuccess = $derived(selectedSuccess(coverage, selection / 100));
	const selectedRun = $derived(replay.runs.find((run) => run.id === release)!);
	const answers = [
		'A는 120개, B는 70개입니다. 2월 판매량은 A가 더 큽니다.',
		'A와 B 모두 20개 증가했습니다. 증가량은 같습니다.',
		'A는 20%, B는 40% 증가했습니다. 증가율은 B가 더 큽니다.',
		'B의 1월 값이 없으므로 B의 증가율을 계산하거나 두 상품의 증가율을 비교할 수 없습니다.'
	];
</script>

<figure class="ai-example" data-ai-example={kind}>
	{#if kind === 'evaluation'}
		<figcaption>
			<span>계산해 보기</span>
			<h3>정답 후보가 최종 답이 되기까지</h3>
			<p>본문의 가상 모델 B. 같은 분포에서 독립 생성하며, 선택기는 후보 중 하나를 고릅니다.</p>
		</figcaption>
		<div class="example-controls" role="group" aria-label="문제당 생성 횟수">
			<span>생성 횟수 k</span>
			{#each [1, 2, 4, 8] as count (count)}<button
					type="button"
					aria-pressed={attempts === count}
					onclick={() => (attempts = count)}>{count}회</button
				>{/each}
		</div>
		<label class="example-range" for="selection-rate"
			><span>정답이 있는 묶음에서 제대로 고르는 비율 <strong>{selection}%</strong></span><input
				id="selection-rate"
				type="range"
				min="0"
				max="100"
				step="5"
				bind:value={selection}
			/></label
		>
		<div class="example-bars" aria-hidden="true">
			<div>
				<span>정답 포함</span><i style:width={percent(coverage)}></i><b>{percent(coverage)}</b>
			</div>
			<div>
				<span>최종 정답</span><i style:width={percent(finalSuccess)}></i><b
					>{percent(finalSuccess)}</b
				>
			</div>
		</div>
		<p class="example-result" role="status">
			{attempts}회 생성: 정답 포함 {percent(coverage)} × 선택 성공 {selection}% = 최종 성공
			<strong>{percent(finalSuccess)}</strong>. A의 한 번 응답은 45.00%입니다.
		</p>
		<p class="example-note">
			k가 바뀌어도 선택 성공률을 유지한다고 가정한 계산입니다. 실제 모델·선택기의 성능 예측은
			아닙니다.
		</p>
		<button
			class="example-reset"
			type="button"
			onclick={() => {
				attempts = 4;
				selection = 60;
			}}>본문 값으로 초기화</button
		>
	{:else if kind === 'data'}
		<figcaption>
			<span>같은 자료, 다른 판단</span>
			<h3>어떤 질문을 연습시키는가</h3>
			<p>자료를 읽는 것, 차이를 계산하는 것, 기준값을 구분하는 것은 서로 다른 과제입니다.</p>
		</figcaption>
		<div class="example-controls" role="group" aria-label="판매 자료의 질문">
			{#each ['판매량', '증가량', '증가율', '기준값 누락'] as label, i (label)}<button
					type="button"
					aria-pressed={question === i}
					onclick={() => (question = i)}>{label}</button
				>{/each}
		</div>
		<table class="example-sales">
			<caption>작성자가 만든 판매량 자료, 단위: 개</caption><thead
				><tr><th scope="col">상품</th><th scope="col">1월</th><th scope="col">2월</th></tr></thead
			><tbody
				><tr><th scope="row">A</th><td>100</td><td>120</td></tr><tr
					><th scope="row">B</th><td>{question === 3 ? '자료 없음' : '50'}</td><td>70</td></tr
				></tbody
			>
		</table>
		<p class="example-result" role="status">{answers[question]}</p>
		<button class="example-reset" type="button" onclick={() => (question = 0)}>원표로 초기화</button
		>
	{:else if kind === 'routing'}
		<figcaption>
			<span>가정의 손익분기점</span>
			<h3>얼마나 자주 큰 모델로 다시 보내는가</h3>
			<p>
				공통 검색·계산 비용을 뺀 가상 비용입니다. 첫 경로 1.5단위, 추가 전달 10단위로 계산합니다.
			</p>
		</figcaption>
		<div class="example-controls" role="group" aria-label="큰 모델로 추가 전달하는 비율">
			{#each [0.2, 0.6, 0.9] as value (value)}<button
					type="button"
					aria-pressed={escalation === value}
					onclick={() => (escalation = value)}>{Math.round(value * 100)}%</button
				>{/each}
		</div>
		<div class="example-comparison">
			<div><span>항상 큰 모델</span><strong>10<small>단위</small></strong></div>
			<div>
				<span>단계적 처리</span><strong
					>{routingCost(escalation).toFixed(1)}<small>단위</small></strong
				>
			</div>
		</div>
		<p class="example-result" role="status">
			1.5 + 10 × {escalation} = {routingCost(escalation).toFixed(1)}단위. 이 가정에서 기준보다 {routingCost(
				escalation
			) < 10
				? '저렴합니다'
				: '비쌉니다'}.
		</p>
		<p class="example-note">
			품질과 시간은 본문의 별도 예제로 비교합니다. 이 비율만 바꿔 정확도나 지연 시간을 예측할 수는
			없습니다.
		</p>
		<button class="example-reset" type="button" onclick={() => (escalation = 0.2)}
			>20%로 초기화</button
		>
	{:else}
		<figcaption>
			<span>실행 기록 살펴보기</span>
			<h3>어디까지 복원해야 입력이 같아지는가</h3>
			<p>
				합성 자료로 실행한 입력 조립 결과입니다. 모델 ID는 메타데이터이며 실제 모델 호출은 없습니다.
			</p>
		</figcaption>
		<div class="example-controls" role="group" aria-label="입력 복원 구성">
			{#each replay.runs as run (run.id)}<button
					type="button"
					aria-pressed={release === run.id}
					onclick={() => (release = run.id)}>{run.label}</button
				>{/each}
		</div>
		<dl class="release-fields">
			<div>
				<dt>모델 ID</dt>
				<dd>{selectedRun.bundle.model}</dd>
			</div>
			<div>
				<dt>프롬프트</dt>
				<dd>{selectedRun.bundle.prompt}</dd>
			</div>
			<div>
				<dt>검색 자료</dt>
				<dd>{selectedRun.bundle.index}</dd>
			</div>
		</dl>
		<p class="example-result" role="status">
			입력 자료의 관찰 시간은 <strong>{selectedRun.retrievedMinutes}분</strong>. 기준 입력과 {selectedRun.contextDigest ===
			replay.runs[0].contextDigest
				? '같습니다'
				: '다릅니다'}.
		</p>
		<pre class="replay-context">{selectedRun.context}</pre>
		<p class="example-note">
			실행 환경: Node.js {replay.runtime}. 입력의 동등성을 확인한 결과이며 모델 응답 재현성 검증은
			아닙니다.
		</p>
	{/if}
</figure>

<style>
	.ai-example {
		margin: 36px 0 10px;
		padding: clamp(22px, 4vw, 36px);
		border: 1px solid var(--nb-line);
		border-top: 2px solid var(--nb-accent);
		background: var(--nb-panel);
		min-width: 0;
	}
	figcaption > span {
		color: var(--nb-accent);
		font-size: 11px;
		letter-spacing: 0.05em;
	}
	h3 {
		margin: 10px 0 14px;
		font-size: 22px;
		line-height: 1.45;
		letter-spacing: -0.035em;
		word-break: keep-all;
	}
	figcaption p,
	.example-note {
		color: var(--nb-muted);
		font-size: 13px;
		line-height: 1.85;
	}
	.example-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin: 24px 0;
	}
	.example-controls > span {
		font-size: 12px;
		width: 100%;
		color: var(--nb-muted);
		margin-bottom: 4px;
	}
	button {
		border: 1px solid var(--nb-line);
		padding: 10px 14px;
		background: none;
		color: var(--nb-text);
		font: 13px var(--font-body);
		cursor: pointer;
		min-height: 42px;
	}
	button[aria-pressed='true'] {
		color: var(--nb-text);
		border-color: var(--nb-accent);
		background: #ff550018;
	}
	button:hover {
		border-color: var(--nb-text);
	}
	.example-range {
		display: grid;
		gap: 16px;
		font-size: 13px;
		line-height: 1.8;
	}
	.example-range strong {
		color: var(--nb-text);
		margin-left: 8px;
	}
	input {
		width: 100%;
		accent-color: var(--nb-accent);
		cursor: pointer;
		height: 24px;
	}
	.example-bars {
		display: grid;
		gap: 14px;
		margin: 24px 0;
	}
	.example-bars > div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
	}
	.example-bars span {
		font-size: 12px;
		color: var(--nb-muted);
	}
	.example-bars b {
		font: 13px var(--font-mono);
		grid-column: 2;
		grid-row: 1;
	}
	.example-bars i {
		display: block;
		grid-column: 1 / -1;
		height: 5px;
		background: var(--nb-accent);
	}
	.example-result {
		font-size: 15px;
		line-height: 1.9;
		margin: 24px 0 12px;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.example-result strong {
		font-weight: 650;
	}
	.example-reset {
		border: 0;
		border-bottom: 1px solid var(--nb-line);
		padding: 6px 0;
		color: var(--nb-muted);
		font-size: 12px;
	}
	.example-sales {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		margin: 24px 0;
	}
	.example-sales caption {
		text-align: left;
		font-size: 11px;
		color: var(--nb-muted);
		padding-bottom: 12px;
	}
	.example-sales th,
	.example-sales td {
		text-align: right;
		padding: 12px 6px;
		border-bottom: 1px solid var(--nb-line);
	}
	.example-sales th:first-child {
		text-align: left;
	}
	.example-comparison {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin: 28px 0;
	}
	.example-comparison > div {
		display: grid;
		gap: 14px;
	}
	.example-comparison span {
		font-size: 12px;
		color: var(--nb-muted);
	}
	.example-comparison strong {
		font: 42px var(--font-display);
	}
	.example-comparison small {
		font: 12px var(--font-body);
		color: var(--nb-muted);
		margin-left: 7px;
	}
	.release-fields {
		display: grid;
		gap: 10px;
		font-size: 12px;
	}
	.release-fields > div {
		display: flex;
		gap: 16px;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	dt {
		color: var(--nb-muted);
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.replay-context {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font: 12px/1.9 var(--font-mono);
		border-top: 1px solid var(--nb-line);
		padding-top: 16px;
	}
	@media (max-width: 640px) {
		.ai-example {
			padding: 22px 18px;
		}
		h3 {
			font-size: 20px;
		}
		button {
			padding: 9px 11px;
		}
		.example-comparison {
			gap: 14px;
		}
		.example-comparison strong {
			font-size: 34px;
		}
	}
</style>
