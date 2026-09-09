<script lang="ts">
	import { onMount } from 'svelte';
	import { tlsWireEndpoints, tlsWireScene, type TlsWireStage } from './tls-wire';

	let {
		stage,
		progress,
		staticMode = false
	}: { stage: TlsWireStage; progress: number; staticMode?: boolean } = $props();
	let systemReduced = $state(true);
	const id = $props.id();
	const scene = $derived(tlsWireScene(stage, progress, staticMode || systemReduced));
	const protectedMessages = $derived(stage !== 'hello');

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (systemReduced = preference.matches);
		sync();
		preference.addEventListener('change', sync);
		return () => preference.removeEventListener('change', sync);
	});
</script>

<figure
	class="tls-wire"
	data-stage={stage}
	data-request-state={scene.requestState}
	data-handshake-complete={scene.handshakeComplete}
	data-server-authenticated={scene.serverAuthenticated}
	data-static={staticMode || systemReduced}
	aria-labelledby={`${id}-caption`}
>
	<div class="wire-desktop" aria-hidden="true">
		<div class="wire-endpoints">
			<div class="wire-endpoint" data-endpoint="browser">
				<strong>{tlsWireEndpoints.browser.label}</strong>
				<span>{tlsWireEndpoints.browser.detail}</span>
			</div>
			<div class="wire-endpoint wire-endpoint--server" data-endpoint="server">
				<strong>{tlsWireEndpoints.server.label}</strong>
				<span>{tlsWireEndpoints.server.detail}</span>
			</div>
		</div>

		<div class="wire-sequence">
			<div class="wire-lane wire-lane--client"></div>
			<div class="wire-lane wire-lane--server"></div>
			{#each scene.rows as row (row.id)}
				<div
					class="wire-message"
					class:wire-message--focused={row.focused}
					class:wire-message--future={!row.visible}
					class:wire-message--complete={row.state === 'complete'}
					data-message-id={row.id}
					data-message-state={row.state}
					data-from={row.from}
					data-to={row.to}
					data-protection={row.protection}
				>
					<div class="wire-message__name">
						<span>{row.label}</span>
						{#if row.id === 'server-finished' || row.id === 'client-finished'}
							<small>{row.from === 'server' ? 'Server' : 'Client'}</small>
						{/if}
					</div>
					<svg viewBox="0 0 1000 40" preserveAspectRatio="none" focusable="false">
						<path class="wire-route" d="M 80 31 H 920" />
						{#if row.state !== 'pending'}
							<path
								class="wire-travel"
								pathLength="1"
								d={row.from === 'browser' ? 'M 80 31 H 920' : 'M 920 31 H 80'}
								stroke-dasharray="1"
								stroke-dashoffset={1 - row.progress}
							/>
						{/if}
						{#if row.state === 'active'}
							<g class="wire-packet" transform={`translate(${80 + row.position * 840}, 31)`}>
								<rect x="-11" y="-4" width="22" height="8" />
							</g>
						{:else if row.state === 'complete'}
							<path
								class="wire-arrow"
								d={row.from === 'browser'
									? 'M 909 27 L 920 31 L 909 35'
									: 'M 91 27 L 80 31 L 91 35'}
							/>
						{/if}
					</svg>
				</div>
			{/each}
		</div>

		<div
			class="wire-request"
			class:wire-request--sent={scene.requestState === 'sending' ||
				scene.requestState === 'received'}
		>
			<div class="wire-request__object" data-request-payload>
				{#if scene.encryptionProgress < 0.5}
					<code>GET /…/balances</code>
					<span>HTTP 요청 · 대기 중</span>
				{:else if scene.requestState === 'wrapping'}
					<code class="wire-request__cipher">TLS application data</code>
					<span>HTTP 요청을 담은 암호문</span>
				{:else}
					<code class="wire-request__cipher">TLS application data</code>
					<span>{scene.requestState === 'received' ? '서버 도착' : '서버로 전송 중'}</span>
				{/if}
			</div>
			<p class="wire-protection">
				{#if protectedMessages}
					ServerHello 이후의<br />Handshake 메시지는 암호화됩니다.
				{:else}
					먼저 TLS 설정과<br />키 합의에 필요한 값을 교환합니다.
				{/if}
			</p>
		</div>
	</div>

	<ol class="wire-summary" aria-label="현재 단계까지의 메시지 순서">
		{#each scene.rows.filter((row) => row.visible) as row (row.id)}
			<li class:wire-summary--current={row.stage === stage}>
				<span>{row.from === 'browser' ? '브라우저 → 서버' : '서버 → 브라우저'}</span>
				<strong>{row.label}</strong>
			</li>
		{/each}
	</ol>
	<figcaption id={`${id}-caption`}>{scene.status}</figcaption>
</figure>

<style>
	.tls-wire {
		--wire-bg: #10110f;
		--wire-ink: #eeeae2;
		--wire-muted: #a7a79f;
		--wire-accent: #ff5500;
		container-type: inline-size;
		width: 100%;
		min-width: 0;
		margin: 0;
		padding: 18px 18px 14px;
		border: 1px solid #373930;
		background: var(--wire-bg);
		color: var(--wire-ink);
		box-sizing: border-box;
	}
	.wire-endpoints {
		display: flex;
		justify-content: space-between;
		min-height: 50px;
		gap: 24px;
	}
	.wire-endpoint {
		display: grid;
		align-content: start;
		gap: 3px;
	}
	.wire-endpoint--server {
		text-align: right;
	}
	.wire-endpoint strong {
		font-size: 16px;
		font-weight: 550;
		letter-spacing: -0.02em;
	}
	.wire-endpoint span {
		font-size: 11px;
		color: var(--wire-muted);
	}
	.wire-sequence {
		position: relative;
	}
	.wire-lane {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: #363830;
	}
	.wire-lane--client {
		left: 8%;
	}
	.wire-lane--server {
		right: 8%;
	}
	.wire-message {
		position: relative;
		height: 38px;
	}
	.wire-message--future {
		visibility: hidden;
	}
	.wire-message--focused {
		background: #ff550014;
	}
	.wire-message--focused::before {
		position: absolute;
		inset: 0 auto 0 0;
		width: 2px;
		background: var(--wire-accent);
		content: '';
	}
	.wire-message__name {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 8px;
		padding-top: 1px;
		font-family: var(--font-mono, 'SFMono-Regular', Consolas, monospace);
		font-size: 12px;
		line-height: 20px;
		color: var(--wire-muted);
	}
	.wire-message--focused .wire-message__name {
		color: var(--wire-ink);
		font-size: 14px;
	}
	.wire-message__name small {
		font: inherit;
		font-size: 10px;
		color: var(--wire-muted);
	}
	.wire-message svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 38px;
		overflow: visible;
	}
	.wire-route {
		fill: none;
		stroke: #383a32;
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.wire-travel,
	.wire-arrow {
		fill: none;
		stroke: #96998a;
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.wire-message--focused .wire-travel,
	.wire-message--focused .wire-arrow {
		stroke: var(--wire-accent);
		stroke-width: 1.5;
	}
	.wire-packet {
		fill: var(--wire-accent);
	}
	.wire-request {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		align-items: center;
		min-height: 72px;
		padding: 10px 0 8px;
	}
	.wire-request__object {
		display: grid;
		gap: 5px;
		padding-left: 12px;
		border-left: 2px solid var(--wire-accent);
	}
	.wire-request__object code {
		font-size: 13px;
		line-height: 1.3;
		overflow-wrap: anywhere;
	}
	.wire-request__object span {
		color: var(--wire-muted);
		font-size: 11px;
	}
	.wire-request__cipher {
		color: var(--wire-accent);
	}
	.wire-protection {
		margin: 0;
		color: var(--wire-muted);
		text-align: right;
		font-size: 11px;
		line-height: 1.6;
		word-break: keep-all;
	}
	figcaption {
		min-height: 20px;
		margin: 0;
		padding-top: 8px;
		border-top: 1px solid #373930;
		font-size: 12px;
		line-height: 1.5;
		color: var(--wire-ink);
		word-break: keep-all;
	}
	.wire-summary {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		padding: 0;
		margin: -1px;
	}
	@container (max-width: 380px) {
		.wire-desktop {
			display: none;
		}
		.wire-summary {
			position: static;
			width: auto;
			height: auto;
			clip-path: none;
			white-space: normal;
			padding: 0;
			margin: 0 0 16px;
			list-style: none;
		}
		.wire-summary li {
			display: grid;
			gap: 4px;
			padding: 7px 0;
		}
		.wire-summary li span {
			color: var(--wire-muted);
			font-size: 11px;
		}
		.wire-summary li strong {
			color: var(--wire-muted);
			font-size: 14px;
			overflow-wrap: anywhere;
			font-weight: 500;
		}
		.wire-summary li.wire-summary--current strong {
			color: var(--wire-ink);
		}
		.wire-summary li.wire-summary--current {
			border-left: 2px solid var(--wire-accent);
			padding-left: 12px;
		}
	}
</style>
