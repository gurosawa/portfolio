<script lang="ts">
	import { onMount } from 'svelte';
	import { previewScene, previewSize, type FlowPreviewKind } from './flow-preview';

	let {
		kind,
		paused = false,
		compact = false
	}: { kind: FlowPreviewKind; paused?: boolean; compact?: boolean } = $props();

	let host: HTMLElement;
	const instanceId = $props.id();
	const arrowId = `${instanceId}-arrow`;
	let narrow = $state(false);
	let visible = $state(false);
	let documentVisible = $state(true);
	let reducedMotion = $state(true);
	const running = $derived(visible && documentVisible && !reducedMotion && !paused);
	const scene = $derived(previewScene(kind, narrow));
	let selection = $state<{ kind: FlowPreviewKind; phase: string }>();
	const phase = $derived(
		selection?.kind === kind
			? scene.phases?.find((item) => item.id === selection?.phase)
			: undefined
	);
	const size = $derived(previewSize(kind, narrow));
	const width = $derived(size.width);
	const height = $derived(size.height);
	const wideSize = $derived(previewSize(kind, false));
	const narrowSize = $derived(previewSize(kind, true));
	const left = $derived(narrow ? 42 : 82);
	const right = $derived(narrow ? 318 : 558);

	onMount(() => {
		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => (reducedMotion = motionPreference.matches);
		const syncVisibility = () => (documentVisible = document.visibilityState === 'visible');
		const syncWidth = () => (narrow = host.getBoundingClientRect().width < 440);
		syncMotion();
		syncVisibility();
		syncWidth();
		motionPreference.addEventListener('change', syncMotion);
		document.addEventListener('visibilitychange', syncVisibility);
		const intersection = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
			threshold: 0.08
		});
		const resize = new ResizeObserver(syncWidth);
		intersection.observe(host);
		resize.observe(host);
		return () => {
			intersection.disconnect();
			resize.disconnect();
			motionPreference.removeEventListener('change', syncMotion);
			document.removeEventListener('visibilitychange', syncVisibility);
		};
	});
</script>

<figure
	bind:this={host}
	class="flow-preview"
	class:compact
	class:reduced-motion={reducedMotion}
	data-flow={kind}
	data-motion={running ? 'running' : 'paused'}
	style:--flow-play={running ? 'running' : 'paused'}
	style:--flow-wide-aspect={`${wideSize.width} / ${wideSize.height}`}
	style:--flow-narrow-aspect={`${narrowSize.width} / ${narrowSize.height}`}
>
	{#key kind}
		{#if scene.phases}
			<div class="flow-phases" role="group" aria-label="도식 단계 선택">
				<button
					type="button"
					aria-pressed={!phase}
					onclick={() => (selection = { kind, phase: 'all' })}>전체 흐름</button
				>
				{#each scene.phases as item (item.id)}
					<button
						type="button"
						aria-pressed={phase?.id === item.id}
						onclick={() => (selection = { kind, phase: item.id })}>{item.label}</button
					>
				{/each}
			</div>
		{/if}
		<div class="flow-preview__scene">
			<svg
				viewBox={`0 0 ${width} ${height}`}
				role="img"
				aria-labelledby={`${instanceId}-title`}
				aria-describedby={`${instanceId}-description`}
				class="flow-preview__canvas"
				class:narrow
			>
				<title id={`${instanceId}-title`}>{scene.title}</title>
				<desc id={`${instanceId}-description`}>{scene.description}</desc>
				<defs>
					<marker
						id={arrowId}
						viewBox="0 0 8 8"
						refX="7"
						refY="4"
						markerWidth="7"
						markerHeight="7"
						orient="auto-start-reverse"
					>
						<path class="arrowhead" d="M 1 1 L 7 4 L 1 7" />
					</marker>
				</defs>
				{#if kind === 'tls'}
					<g class="tls-actors">
						<text x={left} y="42" text-anchor="middle" class="node-title">Client</text>
						<text x={right} y="42" text-anchor="middle" class="node-title">Server</text>
						<path class="lifeline" d={`M ${left} 65 V ${height - 34}`} />
						<path class="lifeline" d={`M ${right} 65 V ${height - 34}`} />
					</g>
					{#each [{ y: 105, label: 'ClientHello', reverse: false }, { y: 182, label: 'ServerHello', reverse: true }, { y: height - 73, label: '암호화된 Record', reverse: false }] as message, i (message.label)}
						{@const start = message.reverse ? right : left}
						{@const end = message.reverse ? left : right}
						<g class="tls-message" style:--flow-delay={`${i * 0.22}s`}>
							<text x={width / 2} y={message.y - 15} text-anchor="middle" class="connection-label">
								{message.label}
							</text>
							<path class="connection" d={`M ${start} ${message.y} H ${end}`} />
							<path
								class="connection-arrow"
								d={message.reverse
									? `M ${end + 7} ${message.y - 5} L ${end} ${message.y} L ${end + 7} ${message.y + 5}`
									: `M ${end - 7} ${message.y - 5} L ${end} ${message.y} L ${end - 7} ${message.y + 5}`}
							/>
							<path
								class="signal"
								pathLength="100"
								d={`M ${start} ${message.y} H ${end}`}
								style:--signal-delay={`${i * -1.45}s`}
							/>
						</g>
					{/each}
					<g class="handshake-note">
						<rect x={width / 2 - 106} y={narrow ? 253 : 221} width="212" height="39" rx="2" />
						<text x={width / 2} y={narrow ? 278 : 246} text-anchor="middle"
							>인증·키 확인 후 통신</text
						>
					</g>
				{:else}
					<g class="connections">
						{#each scene.connections as connection, i (connection.path)}
							{@const selected = !phase || phase.connections.includes(connection.id ?? '')}
							<path
								class="connection"
								class:connection-selected={!!phase && selected}
								class:muted={!selected}
								class:dashed={connection.dashed}
								d={connection.path}
								marker-end={`url(#${arrowId})`}
								marker-start={connection.bidirectional ? `url(#${arrowId})` : undefined}
							/>
							<path
								class="signal"
								class:inactive={!selected}
								pathLength="100"
								d={connection.path}
								style:--signal-delay={`${i * -1.3}s`}
							/>
							{#if connection.label}
								<text
									x={connection.x}
									y={connection.y}
									text-anchor="middle"
									class="connection-label">{connection.label}</text
								>
							{/if}
						{/each}
					</g>
					{#each scene.nodes as node, i (node.id)}
						<g
							transform={`translate(${node.x} ${node.y})`}
							class:focused={phase?.nodes.includes(node.id)}
						>
							<g class="flow-node" class:accent={node.accent} style:--flow-delay={`${i * 0.08}s`}>
								{#if node.shape === 'document'}
									<path
										class="node-shell"
										d={`M 0 0 H ${node.width - 22} L ${node.width} 22 V 108 H 0 Z`}
									/>
									<path class="document-fold" d={`M ${node.width - 22} 0 V 22 H ${node.width}`} />
								{:else if node.shape === 'registry'}
									<rect
										class="registry-back"
										x="-6"
										y="-12"
										width={node.width}
										height="108"
										rx="2"
									/>
									<rect
										class="registry-back"
										x="-3"
										y="-6"
										width={node.width}
										height="108"
										rx="2"
									/>
									<rect class="node-shell" width={node.width} height="108" rx="2" />
								{:else}
									<rect class="node-shell" width={node.width} height="108" rx="2" />
								{/if}
								<text x="16" y="34" class="node-title">{node.title}</text>
								<text x="16" y="60" class="node-detail">{node.detail}</text>
								{#if node.value}
									<text x="16" y="88" class="node-value">{node.value}</text>
								{:else if node.shape === 'service'}
									<path class="service-state" d={`M 16 84 H ${node.width - 16}`} />
								{:else if node.shape === 'process'}
									<g class="build-steps" aria-hidden="true">
										<rect x="16" y="80" width="18" height="8" />
										<rect x="40" y="80" width="18" height="8" />
										<rect x="64" y="80" width="18" height="8" />
									</g>
								{/if}
							</g>
						</g>
					{/each}
				{/if}
			</svg>
		</div>
		{#if scene.phases}
			<div class="phase-explanation" aria-live="polite" aria-atomic="true">
				<strong>{phase?.title ?? '단계를 선택해 역할과 전달 경로를 살펴보세요.'}</strong>
				<p>{phase?.description ?? scene.description}</p>
			</div>
		{/if}
		<figcaption>{scene.caption}</figcaption>
	{/key}
</figure>

<style>
	.flow-preview {
		container-type: inline-size;
		--flow-ink: var(--nb-text, #eeeae2);
		--flow-muted: var(--nb-muted, #aaa9a2);
		--flow-accent: var(--nb-accent, #ff5500);
		--flow-line: var(--nb-line, #33362f);
		--flow-surface: var(--nb-panel, #181a17);
		margin: 0;
		min-width: 0;
		color: var(--flow-ink);
	}

	.flow-preview__scene {
		animation: scene-enter 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-play-state: var(--flow-play);
	}

	.flow-phases {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 14px;
	}
	.flow-phases button {
		padding: 7px 10px;
		min-height: 36px;
		border: 1px solid var(--flow-line);
		background: transparent;
		color: var(--flow-muted);
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	.flow-phases button[aria-pressed='true'] {
		color: var(--flow-ink);
		border-color: var(--flow-accent);
	}
	.flow-phases button:focus-visible {
		outline: 2px solid var(--flow-accent);
		outline-offset: 3px;
	}
	.phase-explanation {
		border-left: 2px solid var(--flow-accent);
		padding-left: 14px;
		margin: 16px 0 14px;
	}
	.phase-explanation strong {
		font-size: 14px;
		font-weight: 500;
	}
	.phase-explanation p {
		margin: 7px 0 0;
		font-size: 13px;
		line-height: 1.8;
		color: var(--flow-muted);
		word-break: keep-all;
	}
	.focused .node-shell {
		stroke: var(--flow-accent);
		stroke-opacity: 1;
	}
	.connection.connection-selected {
		stroke: var(--flow-accent);
		stroke-opacity: 0.9;
	}
	.connection.muted {
		stroke-opacity: 0.25;
	}
	.signal.inactive {
		display: none;
	}

	.flow-preview__canvas {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: var(--flow-wide-aspect);
		overflow: visible;
	}

	/* Reserve the responsive height before hydration to keep article anchors stable. */
	@container (width < 440px) {
		.flow-preview__canvas {
			aspect-ratio: var(--flow-narrow-aspect);
		}
	}

	.flow-node,
	.tls-message {
		animation: node-enter 480ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-delay: var(--flow-delay, 0s);
		animation-play-state: var(--flow-play);
	}

	.node-shell {
		fill: var(--flow-surface);
		stroke: var(--flow-muted);
		stroke-opacity: 0.66;
		stroke-width: 1.2;
	}

	.accent .node-shell {
		stroke: var(--flow-accent);
		stroke-opacity: 1;
	}

	.node-title {
		fill: var(--flow-ink);
		font-family: inherit;
		font-size: 21px;
		font-weight: 500;
		letter-spacing: -0.035em;
	}

	.node-detail,
	.connection-label,
	.handshake-note text {
		fill: var(--flow-muted);
		font-family: inherit;
		font-size: 16px;
		letter-spacing: -0.02em;
	}

	.narrow .node-detail {
		font-size: 14px;
	}

	.node-value {
		fill: var(--flow-ink);
		font-family: inherit;
		font-size: 16px;
	}

	.accent .node-value {
		fill: var(--flow-accent);
	}

	.connection,
	.connection-arrow,
	.arrowhead,
	.lifeline,
	.document-fold,
	.service-state {
		fill: none;
		stroke: var(--flow-muted);
		stroke-opacity: 0.65;
		stroke-width: 1.2;
	}

	.connection.dashed {
		stroke-dasharray: 5 5;
	}

	.lifeline {
		stroke: var(--flow-line);
		stroke-opacity: 1;
	}

	.connection-label {
		paint-order: stroke;
		stroke: var(--nb-bg, #10110f);
		stroke-width: 7px;
		stroke-linejoin: round;
	}

	.signal {
		fill: none;
		stroke: var(--flow-accent);
		stroke-width: 3;
		stroke-linecap: square;
		stroke-dasharray: 7 93;
		stroke-dashoffset: 100;
		animation: packet-travel 4.8s linear infinite;
		animation-delay: var(--signal-delay, 0s);
		animation-play-state: var(--flow-play);
	}

	.registry-back {
		fill: var(--flow-surface);
		stroke: var(--flow-muted);
		stroke-opacity: 0.4;
	}

	.service-state {
		stroke: var(--flow-accent);
		stroke-opacity: 1;
	}

	.build-steps rect {
		fill: var(--flow-muted);
		fill-opacity: 0.6;
	}

	.handshake-note rect {
		fill: var(--flow-surface);
		stroke: var(--flow-line);
	}

	figcaption {
		max-width: 48ch;
		margin: 6px 0 0;
		color: var(--flow-muted);
		font-size: 0.8125rem;
		line-height: 1.65;
		word-break: keep-all;
	}

	.compact figcaption {
		margin-top: 0;
	}

	.reduced-motion .flow-preview__scene,
	.reduced-motion .flow-node,
	.reduced-motion .tls-message,
	.flow-preview[data-motion='paused'] .flow-preview__scene,
	.flow-preview[data-motion='paused'] .flow-node,
	.flow-preview[data-motion='paused'] .tls-message {
		animation: none;
	}

	.reduced-motion .signal {
		display: none;
	}

	@keyframes scene-enter {
		from {
			opacity: 0.7;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes node-enter {
		from {
			opacity: 0.75;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes packet-travel {
		0% {
			stroke-dashoffset: 107;
			opacity: 0;
		}
		12% {
			opacity: 1;
		}
		82% {
			opacity: 1;
		}
		100% {
			stroke-dashoffset: 0;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flow-preview__scene,
		.flow-node,
		.tls-message,
		.signal {
			animation: none;
		}

		.signal {
			display: none;
		}
	}
</style>
