<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { notebookPreferenceContext, type NotebookPreferences } from '../notebook-ui';
	import type { ArticleDiagramDefinition } from './diagram-definitions';
	import { routeDiagramEdges, type NodeBox } from './diagram-layout';

	let { diagram, number }: { diagram: ArticleDiagramDefinition; number: number } = $props();
	const instance = $props.id();
	const preferences = getContext<NotebookPreferences | undefined>(notebookPreferenceContext);
	let canvas: HTMLDivElement;
	let mounted = $state(false);
	let active = $state(0);
	let autoplay = $state(true);
	let visible = $state(false);
	let documentVisible = $state(true);
	let reducedMotion = $state(true);
	let routes = $state<ReturnType<typeof routeDiagramEdges>>([]);
	let measuredStage = $state(-1);
	let size = $state({ width: 1, height: 1 });
	let frame = 0;
	const stage = $derived(diagram.stages[active]);
	const motionOff = $derived(reducedMotion || Boolean(preferences?.motionOff));
	const running = $derived(mounted && autoplay && visible && documentVisible && !motionOff);
	const stageEdges = $derived(
		stage.edges.map((id) => diagram.edges.find((edge) => edge.id === id)!)
	);
	const nodeById = $derived(new Map(diagram.nodes.map((node) => [node.id, node])));
	const modeLabel = $derived(diagram.mode === 'relation' ? '구조 살펴보기' : '단계별 흐름');

	function select(index: number) {
		autoplay = false;
		active = index;
	}

	function togglePlayback() {
		if (autoplay) autoplay = false;
		else {
			if (active === diagram.stages.length - 1) active = 0;
			autoplay = true;
		}
	}

	function measure() {
		if (!canvas) return;
		const outer = canvas.getBoundingClientRect();
		const nodes: NodeBox[] = Array.from(
			canvas.querySelectorAll<HTMLElement>('[data-active="true"] [data-node]')
		).map((element) => {
			const box = element.getBoundingClientRect();
			return {
				id: element.dataset.node!,
				x: box.left - outer.left,
				y: box.top - outer.top,
				width: box.width,
				height: box.height
			};
		});
		size = { width: outer.width, height: outer.height };
		routes = routeDiagramEdges(nodes, stageEdges, size);
		measuredStage = active;
	}

	function queueMeasure() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(measure);
	}

	onMount(() => {
		mounted = true;
		const query = matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => (reducedMotion = query.matches);
		const syncVisibility = () => (documentVisible = document.visibilityState === 'visible');
		syncMotion();
		syncVisibility();
		query.addEventListener('change', syncMotion);
		document.addEventListener('visibilitychange', syncVisibility);
		const intersection = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
			threshold: 0.15
		});
		intersection.observe(canvas);
		const resize = new ResizeObserver(queueMeasure);
		resize.observe(canvas);
		canvas.querySelectorAll('[data-node]').forEach((node) => resize.observe(node));
		queueMeasure();
		return () => {
			intersection.disconnect();
			resize.disconnect();
			query.removeEventListener('change', syncMotion);
			document.removeEventListener('visibilitychange', syncVisibility);
			cancelAnimationFrame(frame);
		};
	});

	$effect(() => {
		void active;
		if (!mounted) return;
		let disposed = false;
		void tick().then(() => {
			if (!disposed) queueMeasure();
		});
		return () => {
			disposed = true;
		};
	});

	$effect(() => {
		if (!running) return;
		const index = active;
		const timer = setTimeout(() => {
			if (index < diagram.stages.length - 1) active = index + 1;
			else autoplay = false;
		}, 8500);
		return () => clearTimeout(timer);
	});
</script>

<figure
	class="article-diagram"
	data-diagram={diagram.id}
	data-step={active + 1}
	data-motion={running ? 'running' : 'paused'}
	class:motion-off={motionOff}
	style:--ad-play={running ? 'running' : 'paused'}
>
	<figcaption class="ad-heading">
		<div>
			<span class="ad-eyebrow">{modeLabel} / {String(number).padStart(2, '0')}</span><strong
				>{diagram.title}</strong
			>
		</div>
		<button
			type="button"
			class="ad-play"
			onclick={togglePlayback}
			disabled={!mounted || motionOff}
			aria-label={motionOff
				? '모션 꺼짐'
				: autoplay
					? '애니메이션 일시 정지'
					: active === diagram.stages.length - 1
						? '애니메이션 다시 재생'
						: '애니메이션 재생'}
		>
			<span aria-hidden="true">{!motionOff && autoplay ? 'Ⅱ' : '▷'}</span>
			{motionOff
				? '모션 꺼짐'
				: autoplay
					? '정지'
					: active === diagram.stages.length - 1
						? '다시 재생'
						: '재생'}
		</button>
	</figcaption>
	<div class="ad-canvas" bind:this={canvas}>
		<svg class="ad-wires" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
			<defs
				><marker
					id={`${instance}-arrow`}
					viewBox="0 0 8 8"
					refX="7"
					refY="4"
					markerWidth="6"
					markerHeight="6"
					orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" /></marker
				></defs
			>
			{#each measuredStage === active ? routes : [] as route, index (route.id)}
				{@const edge = diagram.edges.find((item) => item.id === route.id)!}
				<path
					class="ad-wire"
					class:ad-relation={edge.kind === 'relation' || edge.kind === 'bidirectional'}
					class:ad-return={edge.kind === 'return'}
					d={route.path}
					marker-end={`url(#${instance}-arrow)`}
					marker-start={edge.kind === 'bidirectional' ? `url(#${instance}-arrow)` : undefined}
				/>
				{#if edge.kind === 'flow' || edge.kind === 'return'}
					<path
						class="ad-signal"
						d={route.path}
						pathLength="100"
						style:--ad-delay={`${index * -0.7}s`}
					/>
				{/if}
				<g class="ad-edge-number" transform={`translate(${route.x} ${route.y})`}
					><circle r="10" /><text text-anchor="middle" dominant-baseline="central">{index + 1}</text
					></g
				>
			{/each}
		</svg>
		{#each diagram.stages as scene, index (index)}
			{@const firstCol = Math.min(...scene.nodes.map((node) => node.col))}
			{@const firstRow = Math.min(...scene.nodes.map((node) => node.row))}
			<div
				class="ad-stage"
				data-active={active === index}
				aria-hidden={active !== index}
				style:--ad-cols={Math.max(...scene.nodes.map((node) => node.col)) - firstCol + 1}
				style:--ad-rows={Math.max(...scene.nodes.map((node) => node.row)) - firstRow + 1}
			>
				{#each scene.nodes as placement, position (placement.id)}
					{@const node = nodeById.get(placement.id)!}
					<div
						class="ad-node"
						data-node={node.id}
						style:grid-column={placement.col - firstCol + 1}
						style:grid-row={placement.row - firstRow + 1}
					>
						<span class="ad-node-mark" aria-hidden="true"><i></i><i></i><i></i></span>
						<strong>{node.label}</strong><span class="ad-node-detail">{node.detail}</span>
						<span class="ad-node-order" aria-hidden="true"
							>{String(position + 1).padStart(2, '0')}</span
						>
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<div class="ad-reading" aria-live={running ? 'off' : 'polite'} aria-atomic="true">
		{#each diagram.stages as scene, index (index)}
			<div class="ad-caption" data-active={active === index} aria-hidden={active !== index}>
				<span class="ad-step-count"
					>{String(index + 1).padStart(2, '0')}
					<span>/ {String(diagram.stages.length).padStart(2, '0')}</span></span
				>
				<div>
					<strong>{scene.title}</strong>
					<p>{scene.description}</p>
				</div>
			</div>
		{/each}
	</div>
	<div class="ad-connection-pages" aria-label="현재 단계의 연결">
		{#each diagram.stages as scene, sceneIndex (sceneIndex)}
			<div
				class="ad-connections"
				data-active={active === sceneIndex}
				aria-hidden={active !== sceneIndex}
			>
				{#each scene.edges as edgeId, index (edgeId)}
					{@const edge = diagram.edges.find((item) => item.id === edgeId)!}
					<div>
						<span class="ad-connection-number">{index + 1}</span>
						<p>
							<span
								>{nodeById.get(edge.from)!.label}
								{edge.kind === 'bidirectional' ? '↔' : '→'}
								{nodeById.get(edge.to)!.label}</span
							><strong>{edge.label}</strong>
						</p>
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<nav class="ad-steps" aria-label={`${diagram.title} 단계 선택`}>
		{#each diagram.stages as scene, index (index)}
			<button
				type="button"
				disabled={!mounted}
				class:ad-selected={active === index}
				aria-current={active === index ? 'step' : undefined}
				aria-controls={`${instance}-step-description`}
				onclick={() => select(index)}
				><span>{String(index + 1).padStart(2, '0')}</span>{scene.title}</button
			>
		{/each}
	</nav>
	<p id={`${instance}-step-description`} class="ad-hint">
		{diagram.mode === 'relation'
			? '구성 관계를 차례로 강조합니다. 단계는 실제 실행 순서가 아닙니다.'
			: '단계를 선택하면 자동 재생이 멈춥니다. 선의 번호와 아래 설명을 함께 읽어 주세요.'}
	</p>
	<details class="ad-transcript" open={!mounted}>
		<summary>전체 단계 한눈에 읽기</summary>
		<ol>
			{#each diagram.stages as scene, index (index)}<li>
					<strong>{scene.title}</strong>
					<p>{scene.description}</p>
					<ul>
						{#each scene.edges as edgeId (edgeId)}{@const edge = diagram.edges.find(
								(item) => item.id === edgeId
							)!}
							<li>
								{nodeById.get(edge.from)!.label}
								{edge.kind === 'bidirectional' ? '↔' : '→'}
								{nodeById.get(edge.to)!.label}: {edge.label}
							</li>{/each}
					</ul>
				</li>{/each}
		</ol>
	</details>
	<details class="ad-source">
		<summary>도식 원문</summary>
		<pre><code>{diagram.source}</code></pre>
	</details>
</figure>

<style>
	.article-diagram {
		--ad-orange: var(--nb-accent, #ff5500);
		position: relative;
		margin: 36px 0;
		border: 1px solid var(--nb-line, #33362f);
		background: #141713;
		color: var(--nb-text, #eeeae2);
		line-height: 1.6;
		word-break: keep-all;
		overflow-wrap: anywhere;
		container-type: inline-size;
	}
	.ad-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 22px 24px;
		border-bottom: 1px solid var(--nb-line, #33362f);
	}
	.ad-eyebrow {
		display: block;
		margin-bottom: 6px;
		font: 10px var(--font-mono);
		letter-spacing: 0.04em;
		color: var(--ad-orange);
	}
	.ad-heading strong {
		display: block;
		font-size: 15px;
		font-weight: 550;
	}
	.ad-play {
		display: flex;
		flex-shrink: 0;
		gap: 8px;
		align-items: center;
		min-height: 40px;
		padding: 8px 12px;
		border: 1px solid #464b40;
		background: transparent;
		color: #d4d5ce;
		font: 11px var(--font-body);
		cursor: pointer;
	}
	.ad-play > span {
		color: var(--ad-orange);
		font-size: 16px;
	}
	.ad-play:disabled {
		cursor: default;
		opacity: 0.65;
	}
	.ad-canvas {
		position: relative;
		display: grid;
		padding: 38px 32px;
		min-height: 280px;
		background-image: radial-gradient(#394034 0.65px, transparent 0.65px);
		background-size: 20px 20px;
	}
	.ad-wires {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.ad-wires marker path {
		fill: none;
		stroke: #bd754e;
		stroke-width: 1.3;
	}
	.ad-wire {
		fill: none;
		stroke: #767d6e;
		stroke-width: 1.3;
	}
	.ad-relation {
		stroke: #8d917e;
		stroke-dasharray: 3 4;
	}
	.ad-return {
		stroke-dasharray: 5 3;
	}
	.ad-signal {
		fill: none;
		stroke: var(--ad-orange);
		stroke-width: 2.5;
		stroke-dasharray: 9 91;
		stroke-linecap: round;
		animation: ad-travel 3s linear infinite;
		animation-delay: var(--ad-delay);
		animation-play-state: var(--ad-play);
	}
	.ad-edge-number circle {
		fill: #20271d;
		stroke: #858b7c;
		stroke-width: 1;
	}
	.ad-edge-number text {
		fill: #e4e6dc;
		font: 10px var(--font-mono);
	}
	.ad-stage {
		grid-area: 1 / 1;
		display: grid;
		grid-template-columns: repeat(var(--ad-cols), minmax(0, 1fr));
		grid-template-rows: repeat(var(--ad-rows), 1fr);
		gap: 48px;
		align-items: center;
		visibility: hidden;
		pointer-events: none;
	}
	.ad-stage[data-active='true'] {
		visibility: visible;
		pointer-events: auto;
	}
	.ad-stage[data-active='true'] .ad-node {
		animation: ad-reveal 350ms ease-out both;
	}
	.ad-node {
		position: relative;
		min-width: 0;
		min-height: 110px;
		padding: 18px 14px 16px;
		border: 1px solid #626d57;
		background: #20261d;
		box-shadow: 0 6px 0 -2px #10130f;
	}
	.ad-node strong {
		display: block;
		margin: 15px 0 6px;
		font-size: 15px;
		font-weight: 550;
		line-height: 1.4;
	}
	.ad-node-detail {
		display: block;
		color: #b6bcac;
		font: 11px / 1.65 var(--font-mono);
		overflow-wrap: anywhere;
		word-break: normal;
	}
	.ad-node-mark {
		display: flex;
		gap: 3px;
		height: 10px;
		align-items: end;
	}
	.ad-node-mark i {
		display: block;
		width: 3px;
		height: 7px;
		background: var(--ad-orange);
	}
	.ad-node-mark i:nth-child(2) {
		height: 10px;
	}
	.ad-node-order {
		position: absolute;
		top: 14px;
		right: 14px;
		color: #858f7a;
		font: 9px var(--font-mono);
	}
	.ad-reading {
		display: grid;
		padding: 22px 24px 0;
		border-top: 1px solid var(--nb-line, #33362f);
	}
	.ad-caption {
		display: grid;
		grid-template-columns: 50px 1fr;
		gap: 18px;
		grid-area: 1 / 1;
		visibility: hidden;
	}
	.ad-caption[data-active='true'] {
		visibility: visible;
	}
	.ad-step-count {
		color: var(--ad-orange);
		font: 19px var(--font-mono);
		padding-top: 3px;
	}
	.ad-step-count > span {
		display: block;
		color: #737d69;
		font-size: 10px;
		margin-top: 5px;
	}
	.ad-caption strong {
		display: block;
		font-size: 17px;
		font-weight: 550;
	}
	.article-diagram .ad-caption p {
		margin: 8px 0 0;
		font-size: 13px;
		color: #b7bcae;
		line-height: 1.85;
	}
	.ad-connection-pages {
		display: grid;
	}
	.ad-connections {
		grid-area: 1 / 1;
		visibility: hidden;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px 18px;
		padding: 20px 24px;
		min-height: 100px;
		align-content: start;
	}
	.ad-connections[data-active='true'] {
		visibility: visible;
	}
	.ad-connections > div {
		display: flex;
		gap: 9px;
		align-items: start;
	}
	.ad-connection-number {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 19px;
		height: 19px;
		border: 1px solid #737b68;
		border-radius: 50%;
		color: #d4d5ce;
		font: 10px var(--font-mono);
	}
	.article-diagram .ad-connections p {
		margin: 0;
		font-size: 11px;
		line-height: 1.7;
	}
	.ad-connections p > span {
		color: #919a86;
		display: block;
	}
	.ad-connections p > strong {
		display: block;
		font-weight: 450;
		font-size: 12px;
	}
	.ad-steps {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1px;
		margin: 0 24px;
		border: 1px solid #363d30;
		background: #363d30;
	}
	.ad-steps button {
		display: flex;
		gap: 10px;
		padding: 12px;
		min-height: 46px;
		border: 0;
		background: #181d15;
		color: #a7b09b;
		font: 11px / 1.55 var(--font-body);
		text-align: left;
		cursor: pointer;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.ad-steps button > span {
		flex-shrink: 0;
		padding-top: 1px;
		font-family: var(--font-mono);
	}
	.ad-steps button.ad-selected {
		background: #2b281c;
		color: #eeeae2;
		box-shadow: inset 2px 0 var(--ad-orange);
	}
	.ad-steps button.ad-selected > span {
		color: var(--ad-orange);
	}
	.ad-steps button:hover {
		background: #293021;
		color: #eeeae2;
	}
	.article-diagram .ad-hint {
		margin: 14px 24px 22px;
		color: #959f89;
		font-size: 10px;
	}
	.ad-transcript,
	.ad-source {
		border-top: 1px solid var(--nb-line, #33362f);
		padding: 12px 24px;
	}
	.ad-transcript summary,
	.ad-source summary {
		color: #b2b9a8;
		cursor: pointer;
		font-size: 11px;
		min-height: 26px;
		padding: 3px 0;
	}
	.article-diagram .ad-transcript ol {
		margin: 18px 0;
		padding-left: 22px;
		font-size: 13px;
	}
	.article-diagram .ad-transcript p {
		margin: 6px 0;
		color: #b7bcae;
	}
	.article-diagram .ad-transcript ul {
		font-size: 11px;
		margin: 8px 0 20px;
		padding-left: 16px;
		color: #a2ad96;
	}
	.article-diagram .ad-source pre {
		padding: 16px 0;
		font-size: 11px;
	}
	.motion-off .ad-signal {
		display: none;
	}
	.motion-off .ad-node {
		animation: none;
	}
	@keyframes ad-reveal {
		from {
			opacity: 0.3;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes ad-travel {
		from {
			stroke-dashoffset: 100;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
	@container (max-width: 520px) {
		.ad-heading {
			padding: 18px;
			align-items: start;
		}
		.ad-heading strong {
			font-size: 14px;
		}
		.ad-play {
			padding: 7px 9px;
			font-size: 10px;
		}
		.ad-canvas {
			padding: 32px 36px 32px 24px;
		}
		.ad-stage {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: none;
			gap: 48px;
		}
		.ad-node {
			grid-column: 1 !important;
			grid-row: auto !important;
			min-height: 96px;
			padding: 14px 16px;
		}
		.ad-node strong {
			margin-top: 10px;
			font-size: 16px;
		}
		.ad-node-detail {
			font-size: 12px;
		}
		.ad-reading {
			padding: 20px 18px 0;
		}
		.ad-caption {
			grid-template-columns: 32px 1fr;
			gap: 14px;
		}
		.ad-caption strong {
			font-size: 16px;
		}
		.ad-connections {
			grid-template-columns: 1fr;
			padding: 18px;
		}
		.ad-steps {
			margin: 0 18px;
		}
		.ad-steps button {
			padding: 10px;
			font-size: 11px;
		}
		.article-diagram .ad-hint {
			margin: 14px 18px 20px;
		}
		.ad-transcript,
		.ad-source {
			padding: 12px 18px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ad-signal {
			display: none;
		}
	}
</style>
