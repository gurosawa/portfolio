<script lang="ts">
	/* eslint-disable svelte/no-at-html-tags, svelte/no-navigation-without-resolve */
	import { getContext, onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { notebookPreferenceContext, type NotebookPreferences } from '../notebook-ui';
	import StoryBlock from '../story/StoryBlock.svelte';
	import type { StoryDocument, DeepDive } from '../story/schema';
	import TlsWire from './TlsWire.svelte';
	import { tlsEditorial } from './tls-editorial';
	import type { TlsWireStage } from './tls-wire';

	let { story }: { story: StoryDocument } = $props();
	const preferences = getContext<NotebookPreferences>(notebookPreferenceContext);
	let root: HTMLElement;
	let journey: HTMLElement;
	let desktop = $state(false);
	let systemReduced = $state(false);
	let activeStage = $state<TlsWireStage>('hello');
	let progress = $state(0);
	let scrollModule = $state<typeof import('gsap/ScrollTrigger') | null>(null);
	const motionOff = $derived(preferences.motionOff || systemReduced);
	const enhanced = $derived(desktop && !motionOff && scrollModule !== null);
	const hubHref = resolve('/[locale=locale]/notebook', { locale: 'ko' });
	const canonical =
		'https://wonderful-water-044d9f700.7.azurestaticapps.net/ko/notebook/zktls/tls13/';
	const jsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: story.meta.title,
			description: story.meta.description,
			inLanguage: 'ko',
			datePublished: story.meta.publishedAt,
			dateModified: '2026-09-09',
			mainEntityOfPage: canonical,
			author: { '@type': 'Person', name: 'Hongbeom Joo' }
		}).replaceAll('<', '\\u003c')}</scr` + 'ipt>'
	);
	const sceneNames: Record<TlsWireStage, string> = {
		hello: '조건 교환',
		identity: '서버 확인',
		finished: 'Handshake 확인',
		request: 'HTTP 전송'
	};
	const references = [
		{
			title: '도입과 전체 흐름',
			href: 'https://www.rfc-editor.org/rfc/rfc8446.html#section-2',
			label: 'RFC 8446 §2. Protocol Overview'
		},
		{
			title: 'ClientHello와 ServerHello',
			href: 'https://www.rfc-editor.org/rfc/rfc8446.html#section-4.1',
			label: 'RFC 8446 §4.1. Key Exchange Messages'
		},
		{
			title: '인증서와 Finished',
			href: 'https://www.rfc-editor.org/rfc/rfc8446.html#section-4.4',
			label: 'RFC 8446 §4.4. Authentication Messages'
		},
		{
			title: '서비스 이름 확인',
			href: 'https://www.rfc-editor.org/rfc/rfc9525.html',
			label: 'RFC 9525. Service Identity in TLS'
		},
		{
			title: 'HTTP 데이터와 TLS record',
			href: 'https://www.rfc-editor.org/rfc/rfc8446.html#section-5',
			label: 'RFC 8446 §5. Record Protocol'
		},
		{
			title: 'Handshake 키와 application 키',
			href: 'https://www.rfc-editor.org/rfc/rfc8446.html#section-7.1',
			label: 'RFC 8446 §7.1. Key Schedule'
		}
	];

	function deepFor(actIds: readonly string[]) {
		return story.deepDives.filter((deep) => actIds.includes(deep.actId));
	}
	function refreshLayout() {
		void tick().then(() => scrollModule?.ScrollTrigger.refresh());
	}
	function syncDeepLink() {
		const id = new URL(window.location.href).searchParams.get('deep');
		if (!id) return;
		const detail = root.querySelector<HTMLDetailsElement>(`[data-deep-id="${CSS.escape(id)}"]`);
		if (detail) {
			detail.open = true;
			void tick().then(() => {
				detail.scrollIntoView();
				detail.querySelector('summary')?.focus();
			});
		}
	}

	onMount(() => {
		let disposed = false;
		const size = matchMedia('(min-width: 1050px) and (min-height: 650px)');
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			desktop = size.matches;
			systemReduced = reduced.matches;
		};
		sync();
		size.addEventListener('change', sync);
		reduced.addEventListener('change', sync);
		window.addEventListener('popstate', syncDeepLink);
		document.documentElement.classList.add('tls-editorial-route');
		syncDeepLink();
		void Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
			.then(([{ gsap }, module]) => {
				if (disposed) return;
				gsap.registerPlugin(module.ScrollTrigger);
				scrollModule = module;
			})
			.catch(() => {
				/* The complete reading layout remains available without animation. */
			});
		return () => {
			disposed = true;
			size.removeEventListener('change', sync);
			reduced.removeEventListener('change', sync);
			window.removeEventListener('popstate', syncDeepLink);
			document.documentElement.classList.remove('tls-editorial-route');
		};
	});

	$effect(() => {
		if (!enhanced || !scrollModule || !journey) return;
		const { ScrollTrigger } = scrollModule;
		const sections = [...journey.querySelectorAll<HTMLElement>('[data-tls-scene]')];
		const triggers = sections.map((section) => {
			const stage = section.dataset.tlsScene as TlsWireStage;
			const update = (value: number) => {
				activeStage = stage;
				progress = value;
			};
			return ScrollTrigger.create({
				trigger: section,
				start: 'top 38%',
				end: 'bottom 38%',
				onEnter: (self) => update(self.progress),
				onEnterBack: (self) => update(self.progress),
				onUpdate: (self) => {
					if (self.isActive) update(self.progress);
				},
				onLeave: () => update(1),
				onLeaveBack: () => update(0),
				onRefresh: (self) => {
					if (self.isActive) update(self.progress);
				}
			});
		});
		// Details can change the next scene's position without changing the viewport.
		const resize = new ResizeObserver(() => ScrollTrigger.refresh());
		resize.observe(journey);
		let canceled = false;
		void tick().then(() => {
			if (!canceled) ScrollTrigger.refresh();
		});
		return () => {
			canceled = true;
			resize.disconnect();
			triggers.forEach((trigger) => trigger.kill());
		};
	});
</script>

<svelte:head>
	<title>{story.meta.title} / Systems Notebook</title>
	<meta name="description" content={story.meta.description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={story.meta.title} />
	<meta property="og:description" content={story.meta.description} />
	<meta property="og:url" content={canonical} />
	<meta
		property="og:image"
		content="https://wonderful-water-044d9f700.7.azurestaticapps.net/og/zktls-tls13.svg"
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="article:published_time" content={story.meta.publishedAt} />
	<meta property="article:modified_time" content="2026-09-09" />
	<link rel="canonical" href={canonical} />
	{@html jsonLd}
</svelte:head>

{#snippet deepNotes(notes: readonly DeepDive[])}
	{#if notes.length}
		<div class="deep-notes">
			{#each notes as deep (deep.id)}
				<details data-deep-id={deep.id} id={`deep-${deep.id}`} ontoggle={refreshLayout}>
					<summary
						><span>{deep.title}</span><span class="expand-symbol" aria-hidden="true">+</span
						></summary
					>
					<div class="detail-content">
						{#each deep.blocks as block (block.id)}<StoryBlock {block} />{/each}
					</div>
				</details>
			{/each}
		</div>
	{/if}
{/snippet}

<div
	bind:this={root}
	class="tls-page"
	class:is-enhanced={enhanced}
	data-tls-editorial
	data-motion={motionOff ? 'off' : 'on'}
	lang="ko"
>
	<a class="skip-link" href="#tls-main">본문으로 건너뛰기</a>
	<header class="reader-header">
		<a class="notebook-brand" href={hubHref}><span aria-hidden="true">[/]</span> Systems Notebook</a
		>
		<nav aria-label="글 목차">
			<a href="#act-0-response-question">개요</a>
			<a href="#act-2-clienthello">Handshake</a>
			<a href="#act-7-browser-json">응답과 사본</a>
		</nav>
		<button
			type="button"
			class="motion-button"
			aria-pressed={motionOff}
			disabled={systemReduced}
			onclick={preferences.toggleMotion}
		>
			{systemReduced ? '기기 설정: 모션 끔' : motionOff ? '모션 켜기' : '모션 끄기'}
		</button>
	</header>

	<main id="tls-main">
		<section class="intro page-width" id="act-0-response-question" aria-labelledby="tls-title">
			<div class="intro-copy">
				<p class="eyebrow">Sec / TLS</p>
				<h1 id="tls-title">TLS 1.3 Handshake와<br />Record Protocol</h1>
				<p class="intro-question">{tlsEditorial.introQuestion}</p>
				<p class="intro-lead">{tlsEditorial.introLead}</p>
				<a class="begin-link" href="#act-2-clienthello"
					>요청이 출발하기까지 <span aria-hidden="true">↘</span></a
				>
			</div>
			<figure
				class="intro-figure"
				aria-label="브라우저에서 대기 중인 HTTP 요청과 은행 API 사이에 준비할 TLS 연결"
			>
				<div class="intro-endpoints"><span>Browser</span><span>api.bank.example</span></div>
				<div class="intro-connection"><span>TLS 1.3</span></div>
				<div class="request-preview">
					<span class="request-label">아직 보내지 않은 요청</span>
					<code><b>GET</b> /…/balances</code>
					<span class="request-note">은행에 잔액을 조회합니다.</span>
				</div>
				<figcaption>요청을 보내기 전에, 연결부터 준비합니다.</figcaption>
			</figure>
		</section>

		<div class="scope-strip page-width">
			<p>인증서 기반 TLS 1.3 <span>0-RTT와 세션 재개는 제외합니다.</span></p>
			<p>가상 금융 API <span>실제 요청이나 암호 계산은 실행하지 않습니다.</span></p>
		</div>

		<section class="prelude reading-width" id="act-1-url-dns-tcp" aria-labelledby="prelude-title">
			<h2 id="prelude-title">{tlsEditorial.preludeTitle}</h2>
			<p>{tlsEditorial.preludeBody}</p>
			<ol class="connection-steps" aria-label="TLS 이전의 연결 준비">
				<li><strong>URL</strong><span>요청할 이름과 경로</span></li>
				<li><strong>DNS</strong><span>연결할 IP 주소</span></li>
				<li><strong>TCP</strong><span>바이트를 주고받을 연결</span></li>
			</ol>
			<details class="prelude-details" ontoggle={refreshLayout}>
				<summary>예시 URL 살펴보기 <span aria-hidden="true">+</span></summary>
				{#each story.acts[1].blocks.filter((block) => block.kind === 'form') as block (block.id)}<StoryBlock
						{block}
					/>{/each}
			</details>
			{@render deepNotes(deepFor(['url-dns-tcp']))}
		</section>

		<section class="handshake page-width" aria-labelledby="handshake-title">
			<div class="chapter-intro">
				<h2 id="handshake-title">연결을 준비하고,<br /><span>첫 요청을 보냅니다.</span></h2>
				<p>주황색 메시지를 따라가면, 어떤 준비가 끝났고 무엇이 아직 남았는지 보입니다.</p>
			</div>
			<div class="journey" bind:this={journey}>
				<div class="journey-copy">
					{#each tlsEditorial.scenes as scene (scene.id)}
						<section
							class="scene-copy"
							data-tls-scene={scene.id}
							id={story.acts.find((act) => act.id === scene.actIds[0])?.hash.slice(1)}
							aria-labelledby={`scene-title-${scene.id}`}
						>
							<h3 id={`scene-title-${scene.id}`}>{scene.title}</h3>
							<p class="scene-lead">{scene.lead}</p>
							{#each scene.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
							{#if scene.id === 'hello'}<span class="anchor-alias" id="act-3-serverhello"
								></span>{/if}
							<p class="takeaway">{scene.takeaway}</p>
							<div class="static-scene">
								<TlsWire stage={scene.id} progress={1} staticMode={true} />
							</div>
							{#if scene.id === 'request'}
								<details class="request-source" ontoggle={refreshLayout}>
									<summary>HTTP 요청 원문 <span aria-hidden="true">+</span></summary>
									{#each story.acts[6].blocks.filter((block) => block.kind === 'code') as block (block.id)}<StoryBlock
											{block}
										/>{/each}
								</details>
							{/if}
							{#if scene.id === 'identity' || scene.id === 'finished'}
								{@const failure = story.acts
									.find((act) => act.id === scene.actIds[0])
									?.blocks.find((block) => block.kind === 'callout')}
								{#if failure?.kind === 'callout'}
									<details class="failure-note" ontoggle={refreshLayout}>
										<summary
											>{scene.id === 'identity'
												? '인증서의 이름이 다르면?'
												: 'Finished가 일치하지 않으면?'} <span aria-hidden="true">+</span></summary
										>
										<p>{failure.text}</p>
										<p class="failure-outcome">연결 중단. HTTP 요청은 보내지 않습니다.</p>
									</details>
								{/if}
							{/if}
							{@render deepNotes(deepFor(scene.actIds))}
						</section>
					{/each}
				</div>
				<aside class="journey-visual" aria-label="현재 TLS 메시지의 이동">
					<div class="wire-sticky">
						<div class="wire-heading">
							<span>TLS 1.3</span><span>{sceneNames[activeStage]}</span>
						</div>
						<TlsWire stage={activeStage} {progress} />
						<p class="wire-caption">
							메시지의 순서를 설명하는 도식입니다. 간격은 실제 소요 시간이나 패킷 크기를 나타내지
							않습니다.
						</p>
					</div>
				</aside>
			</div>
		</section>

		<section
			class="response reading-width"
			id="act-7-browser-json"
			aria-labelledby="response-title"
		>
			<h2 id="response-title">{story.acts[7].title}</h2>
			<p>{story.acts[7].lead}</p>
			{#each story.acts[7].blocks as block (block.id)}<StoryBlock {block} />{/each}
			{@render deepNotes(deepFor(['browser-json']))}
		</section>
		<section
			class="copy-gap reading-width"
			id="act-8-saved-copy-gap"
			aria-labelledby="copy-gap-title"
		>
			<h2 id="copy-gap-title">{tlsEditorial.closingTitle}</h2>
			<p>{tlsEditorial.closingLead}</p>
			{#each story.acts[8].blocks as block (block.id)}<StoryBlock {block} />{/each}
			{@render deepNotes(deepFor(['saved-copy-gap', 'response-question']))}
		</section>
		<section class="references reading-width" id="references" aria-labelledby="references-title">
			<h2 id="references-title">기술 출처</h2>
			<p>Handshake 메시지의 순서와 역할은 아래 규격을 기준으로 설명합니다.</p>
			<ul>
				{#each references as reference (reference.href)}<li>
						<span>{reference.title}</span><a href={reference.href} target="_blank" rel="noreferrer"
							>{reference.label} ↗</a
						>
					</li>{/each}
			</ul>
		</section>
		<nav class="next-reading page-width" aria-label="연결해서 읽기">
			<div>
				<p>이 연결 밖에서도 응답을 확인하려면?</p>
				<a href={story.navigation.next?.href}
					>TLSNotary와 MPC-TLS <span aria-hidden="true">↗</span></a
				>
			</div>
			<a class="previous-link" href={story.navigation.previous?.href}
				>이전 글: API 응답의 잔액 조건</a
			>
		</nav>
	</main>
	<footer class="reader-footer page-width">
		<a href={hubHref}>Systems Notebook</a><span>Sec / TLS</span>
	</footer>
</div>

<style>
	:global(html.tls-editorial-route) {
		scroll-behavior: auto;
	}
	.tls-page {
		--story-body: #c4c5bd;
		--story-line: #343730;
		--ink-strong: #eeeae2;
		--ink-soft: #aaa9a2;
		background: #10110f;
		color: #eeeae2;
		font-family: var(--font-body);
		min-height: 100dvh;
	}
	.tls-page :global(*) {
		box-sizing: border-box;
	}
	.tls-page :global([id]) {
		scroll-margin-top: 110px;
	}
	.tls-page :global(a),
	.tls-page :global(button),
	.tls-page :global(summary) {
		-webkit-tap-highlight-color: transparent;
	}
	.tls-page :global(:focus-visible) {
		outline: 2px solid #ff5500;
		outline-offset: 5px;
	}
	.tls-page :global(a) {
		color: inherit;
		text-decoration: none;
	}
	.tls-page :global(button) {
		font-family: inherit;
	}
	.page-width {
		width: min(1320px, calc(100% - 112px));
		margin-inline: auto;
	}
	.reading-width {
		width: min(740px, calc(100% - 48px));
		margin-inline: auto;
	}
	.skip-link {
		position: fixed;
		top: -100px;
		left: 20px;
		z-index: 4;
		background: #eeeae2;
		color: #10110f !important;
		padding: 12px 20px;
	}
	.skip-link:focus {
		top: 16px;
	}
	.reader-header {
		position: sticky;
		top: 0;
		z-index: 3;
		height: 74px;
		padding-inline: 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		border-bottom: 1px solid #30332c;
		background: #10110f;
	}
	.notebook-brand {
		display: flex;
		align-items: center;
		gap: 12px;
		font: 14px var(--font-display);
	}
	.notebook-brand > span {
		color: #ff5500;
		font: 23px var(--font-mono);
	}
	.reader-header nav {
		display: flex;
		gap: 26px;
		font-size: 12px;
		color: #b6b8ae;
	}
	.reader-header nav a:hover,
	.begin-link:hover,
	.references a:hover {
		color: #ff7834;
	}
	.motion-button {
		border: 1px solid #4c5045;
		background: transparent;
		color: #d9dbd2;
		padding: 9px 12px;
		font-size: 12px;
		cursor: pointer;
		white-space: nowrap;
	}
	.motion-button:disabled {
		cursor: default;
		color: #aaa9a2;
	}
	.intro {
		display: grid;
		grid-template-columns: 1.25fr 1fr;
		gap: 64px;
		align-items: center;
		padding-block: 72px 64px;
	}
	.eyebrow {
		margin: 0 0 24px;
		color: #c8c9be;
		font: 12px var(--font-mono);
	}
	h1 {
		margin: 0;
		font: 650 clamp(32px, 3.8vw, 54px)/1.1 var(--font-display);
		letter-spacing: -0.045em;
	}
	.intro-question {
		max-width: 490px;
		margin: 26px 0 0;
		font-size: 21px;
		line-height: 1.5;
		letter-spacing: -0.02em;
		word-break: keep-all;
	}
	.intro-lead {
		max-width: 490px;
		margin: 14px 0 0;
		color: #b9bcb2;
		font-size: 15px;
		line-height: 1.75;
		word-break: keep-all;
	}
	.begin-link {
		display: inline-flex;
		align-items: center;
		gap: 24px;
		margin-top: 28px;
		padding-block: 10px;
		border-bottom: 1px solid #ff5500;
		font-size: 14px;
	}
	.begin-link > span {
		color: #ff5500;
		font-size: 23px;
	}
	.intro-figure {
		min-width: 0;
		margin: 0;
		padding: 20px 0 0;
	}
	.intro-endpoints {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		font: 13px var(--font-mono);
		color: #e5e6dd;
	}
	.intro-connection {
		position: relative;
		display: grid;
		place-items: center;
		height: 90px;
		margin-inline: 14px;
	}
	.intro-connection::before {
		content: '';
		position: absolute;
		inset: 15px 0 38px;
		border: 1px solid #55594c;
		border-top: 0;
	}
	.intro-connection span {
		position: relative;
		background: #10110f;
		padding: 8px 20px;
		color: #ff7834;
		font: 16px var(--font-mono);
	}
	.request-preview {
		display: flex;
		flex-direction: column;
		gap: 20px;
		border-left: 2px solid #ff5500;
		background: #1b1d17;
		padding: 26px 30px;
	}
	.request-label {
		font-size: 13px;
		color: #bdc0b4;
	}
	.request-preview code {
		font: 22px var(--font-mono);
	}
	.request-preview b {
		color: #ff7834;
		font-weight: 500;
	}
	.request-note {
		font-size: 14px;
		color: #bcc0b3;
	}
	.intro-figure figcaption {
		margin-top: 20px;
		color: #a7ad9d;
		font-size: 13px;
	}
	.scope-strip {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		border-block: 1px solid #30332c;
		padding-block: 21px;
	}
	.scope-strip p {
		margin: 0;
		font-size: 12px;
		color: #d1d4c8;
	}
	.scope-strip span {
		display: block;
		margin-top: 6px;
		color: #a8ae9d;
	}
	.prelude {
		padding-block: 100px 80px;
	}
	h2 {
		margin: 0;
		font: 600 clamp(26px, 3vw, 36px)/1.25 var(--font-display);
		letter-spacing: -0.035em;
		word-break: keep-all;
	}
	.reading-width > p,
	.scene-copy > p {
		margin: 22px 0 0;
		color: #c4c5bd;
		font-size: 17px;
		line-height: 1.85;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.connection-steps {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin: 34px 0 24px;
		padding: 0;
		list-style: none;
		gap: 22px;
	}
	.connection-steps li {
		position: relative;
		padding-top: 18px;
		border-top: 1px solid #555a4a;
	}
	.connection-steps li:not(:last-child)::after {
		position: absolute;
		right: -16px;
		top: 15px;
		content: '→';
		color: #858d79;
	}
	.connection-steps strong {
		display: block;
		font: 16px var(--font-mono);
	}
	.connection-steps span {
		display: block;
		margin-top: 12px;
		color: #aeb4a3;
		font-size: 12px;
	}
	details {
		min-width: 0;
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding-block: 16px;
		list-style: none;
		cursor: pointer;
		color: #ced2c5;
		font-size: 13px;
		line-height: 1.6;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		color: #f2eee4;
	}
	summary > span:last-child {
		flex-shrink: 0;
		color: #aeb89f;
	}
	details[open] > summary .expand-symbol {
		transform: rotate(45deg);
	}
	.prelude-details,
	.deep-notes {
		border-top: 1px solid #34382e;
	}
	.deep-notes {
		margin-top: 28px;
	}
	.deep-notes details + details {
		border-top: 1px solid #292d24;
	}
	.detail-content {
		padding-bottom: 30px;
	}
	.chapter-intro {
		border-top: 1px solid #34382e;
		padding-top: 64px;
	}
	.chapter-intro h2 {
		font-size: clamp(34px, 4vw, 50px);
	}
	.chapter-intro h2 span {
		color: #a5ad97;
	}
	.chapter-intro > p {
		max-width: 530px;
		margin-top: 24px;
		color: #b5bba9;
		font-size: 15px;
		line-height: 1.8;
		word-break: keep-all;
	}
	.journey {
		display: block;
	}
	.journey-copy {
		min-width: 0;
	}
	.scene-copy {
		min-width: 0;
		padding-block: 60px;
	}
	.scene-copy h3 {
		margin: 0;
		font: 600 30px/1.35 var(--font-display);
		letter-spacing: -0.035em;
		word-break: keep-all;
	}
	.scene-copy > .scene-lead {
		color: #eeeae2;
		font-size: 20px;
		line-height: 1.65;
	}
	.scene-copy > .takeaway {
		margin-top: 32px;
		padding-left: 16px;
		border-left: 2px solid #ff5500;
		color: #d9ddcf;
		font-size: 14px;
		line-height: 1.7;
	}
	.anchor-alias {
		display: block;
	}
	.static-scene {
		max-width: 670px;
		margin-top: 32px;
	}
	.journey-visual {
		display: none;
	}
	.is-enhanced .journey {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
		gap: clamp(44px, 6vw, 96px);
	}
	.is-enhanced .scene-copy {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		padding-block: 85px;
	}
	.is-enhanced .static-scene {
		display: none;
	}
	.is-enhanced .journey-visual {
		display: block;
		min-width: 0;
	}
	.wire-sticky {
		position: sticky;
		top: 98px;
		padding-block: 10px 0;
	}
	.wire-heading {
		display: flex;
		justify-content: space-between;
		padding-block: 0 14px;
		border-bottom: 1px solid #363c2e;
		color: #b5bfaa;
		font: 12px var(--font-mono);
	}
	.wire-heading > span:last-child {
		font-family: var(--font-body);
		color: #d1d6c7;
	}
	.wire-caption {
		margin: 12px 0 0;
		color: #a4ad97;
		font-size: 11px;
		line-height: 1.7;
		word-break: keep-all;
	}
	.failure-note {
		margin-top: 26px;
		border-top: 1px solid #605444;
	}
	.request-source {
		margin-top: 26px;
		border-top: 1px solid #34382e;
	}
	.failure-note > p {
		color: #c4c5bd;
		font-size: 14px;
		line-height: 1.8;
		word-break: keep-all;
	}
	.failure-note > .failure-outcome {
		color: #f6aa75;
	}
	.response,
	.copy-gap {
		padding-block: 90px 36px;
	}
	.response {
		border-top: 1px solid #34382e;
	}
	.references {
		padding-block: 80px;
	}
	.references h2 {
		font-size: 24px;
	}
	.references > p {
		font-size: 14px;
	}
	.references ul {
		margin: 28px 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 22px;
	}
	.references li span {
		display: block;
		font-size: 12px;
		color: #aeb4a3;
		margin-bottom: 7px;
	}
	.references li a {
		font-size: 14px;
	}
	.next-reading {
		border-top: 1px solid #474e3e;
		padding-block: 60px;
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 32px;
	}
	.next-reading p {
		margin: 0 0 16px;
		font-size: 16px;
		color: #adb69e;
	}
	.next-reading div a {
		font: 500 clamp(24px, 3vw, 38px)/1.3 var(--font-display);
		letter-spacing: -0.03em;
	}
	.next-reading div a span {
		color: #ff7834;
	}
	.previous-link {
		color: #b9c0ab !important;
		font-size: 13px;
	}
	.reader-footer {
		display: flex;
		justify-content: space-between;
		border-top: 1px solid #30332a;
		padding-block: 28px;
		color: #a5ae97;
		font-size: 12px;
	}
	@media (max-width: 1049px), (max-height: 649px) {
		.page-width {
			width: min(900px, calc(100% - 48px));
		}
		.intro {
			gap: 34px;
		}
		.scene-copy {
			max-width: 740px;
			margin-inline: auto;
		}
		.chapter-intro h2 br {
			display: none;
		}
	}
	@media (max-width: 767px) {
		.reader-header {
			height: 66px;
			padding-inline: 20px;
			gap: 12px;
		}
		.notebook-brand {
			font-size: 12px;
			gap: 8px;
		}
		.notebook-brand > span {
			font-size: 20px;
		}
		.reader-header nav {
			display: none;
		}
		.motion-button {
			font-size: 11px;
			padding: 8px;
		}
		.page-width,
		.reading-width {
			width: calc(100% - 40px);
		}
		.intro {
			grid-template-columns: minmax(0, 1fr);
			padding-block: 44px 40px;
			gap: 40px;
		}
		h1 {
			font-size: clamp(29px, 6.7vw, 43px);
		}
		.intro-question {
			font-size: 19px;
			margin-top: 22px;
		}
		.intro-lead {
			font-size: 15px;
		}
		.intro-figure {
			padding-top: 0;
		}
		.request-preview {
			padding: 22px;
			gap: 14px;
		}
		.request-preview code {
			font-size: 20px;
		}
		.scope-strip {
			flex-direction: column;
			padding-block: 22px;
			gap: 18px;
		}
		.prelude {
			padding-block: 56px 46px;
		}
		.chapter-intro {
			padding-top: 42px;
		}
		.chapter-intro h2 {
			font-size: 32px;
		}
		.scene-copy {
			padding-block: 40px;
		}
		.scene-copy h3 {
			font-size: 26px;
		}
		.scene-copy > .scene-lead {
			font-size: 19px;
		}
		.reading-width > p,
		.scene-copy > p {
			font-size: 16px;
		}
		.static-scene {
			display: none;
		}
		.connection-steps {
			gap: 18px;
		}
		.connection-steps span {
			font-size: 11px;
			line-height: 1.65;
			word-break: keep-all;
		}
		.response,
		.copy-gap {
			padding-block: 50px 20px;
		}
		.references {
			padding-block: 50px;
		}
		.next-reading {
			flex-direction: column;
			align-items: start;
			padding-block: 40px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tls-page :global(*) {
			animation: none !important;
			transition: none !important;
			scroll-behavior: auto !important;
		}
	}
	@media print {
		.reader-header,
		.intro-figure,
		.journey-visual,
		.static-scene,
		.motion-button,
		.begin-link {
			display: none !important;
		}
		.tls-page {
			background: white;
			color: black;
		}
		.journey,
		.intro {
			display: block !important;
		}
		.scene-copy {
			min-height: 0 !important;
			padding-block: 20px !important;
		}
	}
</style>
