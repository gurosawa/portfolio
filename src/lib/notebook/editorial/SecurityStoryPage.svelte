<script lang="ts">
	/* eslint-disable svelte/no-at-html-tags, svelte/no-navigation-without-resolve */
	import { getContext, onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { notebookPreferenceContext, type NotebookPreferences } from '../notebook-ui';
	import StoryBlock from '../story/StoryBlock.svelte';
	import type { StoryDocument } from '../story/schema';
	import type { SecurityEditorial } from './schema';
	import { sceneActs, sceneSources, sceneDeepDives, validateEditorial } from './content';
	import { editorialReferences } from './references';
	import BalanceFlow from './BalanceFlow.svelte';
	import NotaryFlow from './NotaryFlow.svelte';

	let { story, definition }: { story: StoryDocument; definition: SecurityEditorial } = $props();
	const editorial = $derived(validateEditorial(story, definition));
	const references = $derived([...story.references, ...editorialReferences[editorial.slug]]);
	const preferences = getContext<NotebookPreferences>(notebookPreferenceContext);
	const hubHref = resolve('/[locale=locale]/notebook', { locale: 'ko' });
	const canonical = $derived(
		`https://wonderful-water-044d9f700.7.azurestaticapps.net${story.meta.canonicalPath}`
	);
	const isBalance = $derived(story.meta.slug === 'balance-claim');
	let root: HTMLElement;
	let journey: HTMLElement;
	let desktop = $state(false);
	let reduced = $state(false);
	let activeScene = $state('');
	let progress = $state(0);
	let scrollModule = $state<typeof import('gsap/ScrollTrigger') | null>(null);
	const motionOff = $derived(preferences.motionOff || reduced);
	const enhanced = $derived(desktop && !motionOff && scrollModule !== null);
	const displayedScene = $derived(activeScene || editorial.scenes[0].id);
	const activeTitle = $derived(
		editorial.scenes.find((scene) => scene.id === displayedScene)?.title ?? ''
	);
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

	function refreshLayout() {
		void tick().then(() => scrollModule?.ScrollTrigger.refresh());
	}
	function syncDeepLink() {
		const id = new URL(location.href).searchParams.get('deep');
		if (!id || !root) return false;
		const detail = root.querySelector<HTMLDetailsElement>(`[data-deep-id="${CSS.escape(id)}"]`);
		if (!detail) return false;
		detail.open = true;
		void tick().then(() => {
			if (!detail.isConnected) return;
			detail.scrollIntoView();
			detail.querySelector('summary')?.focus({ preventScroll: true });
		});
		return true;
	}
	async function toggleMotion() {
		const section = [...root.querySelectorAll<HTMLElement>('[data-editorial-scene]')].find(
			(node) =>
				node.getBoundingClientRect().bottom > 150 && node.getBoundingClientRect().top < innerHeight
		);
		const offset = section?.getBoundingClientRect().top;
		preferences.toggleMotion();
		await tick();
		await new Promise<void>((done) => requestAnimationFrame(() => done()));
		scrollModule?.ScrollTrigger.refresh();
		if (section && offset !== undefined)
			window.scrollBy({ top: section.getBoundingClientRect().top - offset, behavior: 'instant' });
		scrollModule?.ScrollTrigger.update();
	}

	onMount(() => {
		document.documentElement.classList.add('security-editorial-route');
		let disposed = false;
		let interacted = false;
		const entryUrl = location.href;
		const markInteraction = () => {
			interacted = true;
		};
		const stopWatching = () => {
			window.removeEventListener('wheel', markInteraction);
			window.removeEventListener('pointerdown', markInteraction);
			window.removeEventListener('keydown', markInteraction);
		};
		window.addEventListener('wheel', markInteraction, { passive: true });
		window.addEventListener('pointerdown', markInteraction, { passive: true });
		window.addEventListener('keydown', markInteraction);
		const size = matchMedia('(min-width: 1050px) and (min-height: 680px)');
		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			desktop = size.matches;
			reduced = motion.matches;
		};
		sync();
		size.addEventListener('change', sync);
		motion.addEventListener('change', sync);
		window.addEventListener('popstate', syncDeepLink);
		syncDeepLink();
		const restoreEntry = async () => {
			await tick();
			stopWatching();
			if (disposed || interacted || location.href !== entryUrl) return;
			if (!syncDeepLink()) {
				try {
					document
						.getElementById(decodeURIComponent(new URL(entryUrl).hash.slice(1)))
						?.scrollIntoView();
				} catch {
					/* Malformed fragments do not affect the reading layout. */
				}
			}
			scrollModule?.ScrollTrigger.refresh();
		};
		void Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
			.then(([{ gsap }, module]) => {
				if (disposed) return;
				gsap.registerPlugin(module.ScrollTrigger);
				scrollModule = module;
				void restoreEntry();
			})
			.catch(() => {
				void restoreEntry();
			});
		return () => {
			disposed = true;
			document.documentElement.classList.remove('security-editorial-route');
			stopWatching();
			size.removeEventListener('change', sync);
			motion.removeEventListener('change', sync);
			window.removeEventListener('popstate', syncDeepLink);
		};
	});

	$effect(() => {
		if (!enhanced || !scrollModule || !journey) return;
		const { ScrollTrigger } = scrollModule;
		const triggers = [...journey.querySelectorAll<HTMLElement>('[data-editorial-scene]')].map(
			(section) => {
				const update = (value: number) => {
					activeScene = section.dataset.editorialScene!;
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
			}
		);
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
		content={`https://wonderful-water-044d9f700.7.azurestaticapps.net/og/zktls-${story.meta.slug}.svg`}
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="article:published_time" content={story.meta.publishedAt} />
	<meta property="article:modified_time" content="2026-09-09" />
	<link rel="canonical" href={canonical} />
	{@html jsonLd}
</svelte:head>

{#snippet diagram(stage: string, value: number, staticMode = false)}
	{#if isBalance}<BalanceFlow {stage} progress={value} {staticMode} />
	{:else}<NotaryFlow {stage} progress={value} {staticMode} />{/if}
{/snippet}

<div
	bind:this={root}
	class="security-reader"
	class:is-enhanced={enhanced}
	data-security-editorial={story.meta.slug}
	data-motion={motionOff ? 'off' : 'on'}
	lang="ko"
>
	<a class="skip-link" href="#story-main">본문으로 건너뛰기</a>
	<header class="reader-header">
		<a class="notebook-brand" href={hubHref}><span aria-hidden="true">[/]</span> Systems Notebook</a
		>
		<nav aria-label="글 목차">
			<a href={story.acts[0].hash}>개요</a>
			<a href={`#scene-${editorial.scenes[0].id}`}>{isBalance ? '응답과 조건' : '참여자와 통신'}</a>
			<a href="#scene-verification">검증과 판단</a>
		</nav>
		<button
			type="button"
			class="motion-button"
			aria-pressed={motionOff}
			disabled={reduced}
			onclick={toggleMotion}
			>{reduced ? '기기 설정: 모션 끔' : motionOff ? '모션 켜기' : '모션 끄기'}</button
		>
	</header>
	<main id="story-main">
		<section
			class="intro page-width"
			id={story.acts[0].hash.slice(1)}
			aria-labelledby="story-title"
		>
			<div class="intro-copy">
				<p class="eyebrow">{editorial.kicker}</p>
				<h1 id="story-title">{editorial.title}</h1>
				<p class="intro-lead">{editorial.intro}</p>
				<a class="begin-link" href={`#scene-${editorial.scenes[0].id}`}
					>흐름 살펴보기 <span aria-hidden="true">↘</span></a
				>
			</div>
			<figure class="overview" aria-labelledby="overview-caption">
				<figcaption id="overview-caption">{editorial.overview.label}</figcaption>
				<div class="opening-result">
					<span>{story.opening.claim.label}</span>
					<code>premiumEligible: <b>true</b></code>
					<p>
						{isBalance ? '잔액 대신 제출할 조건 결과' : '추가 ZKP로 만들 조건 결과'}<br />아직
						검증하지 않은 교육용 예시입니다.
					</p>
				</div>
				<ol aria-label="전체 설명 흐름">
					{#each editorial.overview.steps as step (step)}<li>{step}</li>{/each}
				</ol>
			</figure>
		</section>
		<div class="scope-strip page-width">
			{#each editorial.scope as scope (scope)}<p>{scope}</p>{/each}
		</div>
		<section class="story-body page-width" aria-labelledby="chapter-title">
			<div class="chapter-intro">
				<h2 id="chapter-title">{editorial.chapterTitle}</h2>
				<p>{editorial.chapterIntro}</p>
			</div>
			<div class="journey" bind:this={journey}>
				<div class="journey-copy">
					{#each editorial.scenes as scene (scene.id)}
						{@const sources = sceneSources(story, scene)}
						<section
							class="scene-copy"
							id={`scene-${scene.id}`}
							data-editorial-scene={scene.id}
							aria-labelledby={`title-${scene.id}`}
						>
							{#each sceneActs(story, scene).filter((act) => act.index !== 0) as act (act.id)}<span
									class="legacy-anchor"
									id={act.hash.slice(1)}
									aria-hidden="true"
								></span>{/each}
							<h3 id={`title-${scene.id}`}>{scene.title}</h3>
							<p class="scene-lead">{scene.lead}</p>
							{#each scene.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
							<p class="takeaway">{scene.takeaway}</p>
							{#if !enhanced}<div class="static-scene">
									{@render diagram(scene.id, 1, true)}
								</div>{/if}
							{#if sources.length}
								<details class="source-notes" ontoggle={refreshLayout} data-source-scene={scene.id}>
									<summary
										><span>{scene.sourceLabel}</span><span class="expand-symbol" aria-hidden="true"
											>+</span
										></summary
									>
									<div class="detail-content">
										{#each sources as block (block.id)}<div data-source-block={block.id}>
												<StoryBlock {block} />
											</div>{/each}
									</div>
								</details>
							{/if}
							<div class="deep-notes">
								{#each sceneDeepDives(story, scene) as deep (deep.id)}
									<details id={`deep-${deep.id}`} data-deep-id={deep.id} ontoggle={refreshLayout}>
										<summary
											><span>{deep.title}</span><span class="expand-symbol" aria-hidden="true"
												>+</span
											></summary
										>
										<div class="detail-content">
											{#if deep.id === 'version-boundary'}
												<p class="version-note">
													2026-09-09 확인: alpha.13에서 notary-server/client가 제거됐으며
													tlsn-attestation은 유지보수 대상으로 남았습니다. 본문은 Notarization 개념
													모델로, 현재 SDK의 실행 절차가 아닙니다. 관련 릴리스는 글 끝 기술 출처에
													정리했습니다.
												</p>
												<p class="version-note">
													아래는 기존 원고의 2026-08-25 확인 기록입니다. “최신”이라는 표현도 당시
													시점을 뜻합니다.
												</p>
											{/if}
											<p class="deep-summary">{deep.summary}</p>
											{#each deep.blocks as block (block.id)}<StoryBlock {block} />{/each}
										</div>
									</details>
								{/each}
							</div>
						</section>
					{/each}
				</div>
				{#if enhanced}
					<aside
						class="journey-visual"
						aria-label={isBalance ? '현재 제출 자료와 서비스 판단' : '현재 참여자와 자료 이동'}
					>
						<div class="visual-sticky">
							<p class="visual-heading">{activeTitle}</p>
							{@render diagram(displayedScene, progress)}
							<p class="visual-caption">
								{isBalance
									? '상태가 바뀌는 순서를 설명합니다. 실제 은행 조회나 proof 생성은 실행하지 않습니다.'
									: '연결과 자료의 이동을 설명합니다. 선의 길이는 실제 시간이나 데이터 크기를 뜻하지 않습니다.'}
							</p>
						</div>
					</aside>
				{/if}
			</div>
		</section>
		<section class="closing reading-width" id="epilogue" aria-labelledby="closing-title">
			<h2 id="closing-title">{editorial.closing.title}</h2>
			{#each editorial.closing.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
		</section>
		<section class="references reading-width" id="references" aria-labelledby="references-title">
			<h2 id="references-title">기술 출처</h2>
			<p>
				기존 Act별 출처와 확인 날짜를 유지하고, 이번 개정에서 확인한 자료를 덧붙였습니다. 구현
				세부사항은 각 문서의 버전과 함께 읽어주세요.
			</p>
			{#each story.acts.filter( (act) => references.some((ref) => ref.actId === act.id) ) as act (act.id)}
				<div class="reference-group" id={`references-${act.id}`}>
					<h3>Act {act.index} · {act.title}</h3>
					<ul>
						{#each references.filter((ref) => ref.actId === act.id) as reference (reference.href)}<li
							>
								<a href={reference.href} target="_blank" rel="noreferrer"
									>{reference.label.replaceAll('—', '-').replaceAll('–', '-')} ↗</a
								>
								<p>{reference.note}</p>
							</li>{/each}
					</ul>
				</div>
			{/each}
		</section>
		<nav class="next-reading page-width" aria-label="시리즈 이동">
			<div>
				<p>{story.navigation.next ? '연결해서 읽기' : '다른 주제도 살펴보기'}</p>
				<a href={story.navigation.next?.href ?? hubHref}
					>{story.navigation.next?.title ?? 'Systems Notebook'} <span aria-hidden="true">↗</span></a
				>
			</div>
			{#if story.navigation.previous}<a class="previous-link" href={story.navigation.previous.href}
					>이전 글: {story.navigation.previous.title}</a
				>{/if}
		</nav>
	</main>
	<footer class="reader-footer page-width">
		<a href={hubHref}>Systems Notebook</a><span>{editorial.kicker}</span>
	</footer>
</div>

<style>
	:global(html.security-editorial-route) {
		scroll-behavior: auto;
		overflow-anchor: none;
	}
	/* Editorial 6 / 4 / 3. Existing Notebook identity; semantic diagrams, not decorative imagery. */
	.security-reader {
		--story-body: #c4c5bd;
		--story-line: #343730;
		--ink-strong: #eeeae2;
		--ink-soft: #aaa9a2;
		background: #10110f;
		color: #eeeae2;
		font-family: var(--font-body);
		min-height: 100dvh;
	}
	.security-reader :global(*) {
		box-sizing: border-box;
	}
	.security-reader :global([id]) {
		scroll-margin-top: 110px;
	}
	.security-reader :global(a) {
		color: inherit;
		text-decoration: none;
	}
	.security-reader :global(button) {
		font-family: inherit;
	}
	.security-reader :global(:focus-visible) {
		outline: 2px solid #ff5500;
		outline-offset: 5px;
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
		white-space: nowrap;
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
	.reader-header nav a,
	.motion-button {
		white-space: nowrap;
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
	}
	.motion-button:active {
		transform: translateY(1px);
	}
	.motion-button:disabled {
		cursor: default;
		color: #aaa9a2;
	}
	.intro {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		gap: clamp(40px, 6vw, 90px);
		align-items: center;
		padding-block: 68px 60px;
	}
	.intro-copy {
		min-width: 0;
	}
	.eyebrow {
		margin: 0 0 24px;
		color: #c8c9be;
		font: 12px var(--font-mono);
	}
	h1 {
		margin: 0;
		font: 650 clamp(32px, 3.6vw, 48px)/1.2 var(--font-display);
		letter-spacing: -0.04em;
		word-break: keep-all;
	}
	.intro-lead {
		max-width: 490px;
		margin: 24px 0 0;
		color: #c4c5bd;
		font-size: 17px;
		line-height: 1.8;
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
	.overview {
		min-width: 0;
		margin: 0;
	}
	.overview > figcaption {
		color: #bdc3b5;
		font-size: 13px;
		margin-bottom: 20px;
	}
	.opening-result {
		border-left: 2px solid #ff5500;
		background: #1a1d16;
		padding: 24px 28px;
	}
	.opening-result > span {
		color: #bec6b3;
		font-size: 12px;
	}
	.opening-result code {
		display: block;
		margin-top: 22px;
		font: clamp(18px, 1.9vw, 25px) var(--font-mono);
	}
	.opening-result b {
		color: #ff7834;
		font-weight: 500;
	}
	.opening-result p {
		color: #aeb9a1;
		font-size: 12px;
		line-height: 1.7;
		margin: 20px 0 0;
	}
	.overview ol {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 0;
		list-style: none;
		padding: 0;
		margin: 22px 0 0;
		font-size: 12px;
		color: #b9c2ad;
	}
	.overview li:not(:last-child)::after {
		content: '→';
		margin-inline: 12px;
		color: #8b957f;
	}
	.scope-strip {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 22px 54px;
		border-block: 1px solid #30332c;
		padding-block: 22px;
	}
	.scope-strip p {
		margin: 0;
		color: #afb7a5;
		font-size: 12px;
		line-height: 1.7;
		word-break: keep-all;
	}
	.chapter-intro {
		padding-block: 76px 14px;
	}
	h2 {
		margin: 0;
		font: 600 clamp(28px, 3vw, 38px)/1.3 var(--font-display);
		letter-spacing: -0.035em;
		word-break: keep-all;
	}
	.chapter-intro > p {
		max-width: 620px;
		margin-top: 22px;
		color: #bac1ae;
		font-size: 16px;
		line-height: 1.85;
		word-break: keep-all;
	}
	.journey-copy {
		min-width: 0;
	}
	.scene-copy {
		position: relative;
		min-width: 0;
		max-width: 740px;
		margin-inline: auto;
		padding-block: 50px;
	}
	.legacy-anchor {
		position: absolute;
		top: 0;
		left: 0;
	}
	.scene-copy h3 {
		margin: 0;
		font: 600 29px/1.4 var(--font-display);
		letter-spacing: -0.035em;
		word-break: keep-all;
	}
	.scene-copy > p,
	.closing > p {
		margin: 22px 0 0;
		color: #c4c5bd;
		font-size: 17px;
		line-height: 1.85;
		word-break: keep-all;
		overflow-wrap: anywhere;
	}
	.scene-copy > .scene-lead {
		color: #eeeae2;
		font-size: 20px;
		line-height: 1.7;
	}
	.scene-copy > .takeaway {
		padding-left: 16px;
		border-left: 2px solid #ff5500;
		margin-top: 30px;
		color: #d1dac5;
		font-size: 14px;
		line-height: 1.8;
	}
	.static-scene {
		margin-top: 30px;
	}
	.is-enhanced .journey {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: clamp(44px, 6vw, 86px);
	}
	.is-enhanced .scene-copy {
		min-height: max(92dvh, 720px);
		padding-block: 70px;
	}
	.journey-visual {
		min-width: 0;
	}
	.visual-sticky {
		position: sticky;
		top: 100px;
		padding-top: 8px;
	}
	.visual-heading {
		margin: 0 0 16px;
		color: #c9d1bf;
		font-size: 13px;
		line-height: 1.6;
	}
	.visual-caption {
		margin: 14px 0 0;
		color: #aab59b;
		font-size: 11px;
		line-height: 1.7;
		word-break: keep-all;
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
		color: #cbd4bf;
		font-size: 13px;
		line-height: 1.6;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		color: #eeeae2;
	}
	.expand-symbol {
		color: #aeb89f;
		flex-shrink: 0;
	}
	details[open] > summary .expand-symbol {
		transform: rotate(45deg);
	}
	.source-notes,
	.deep-notes {
		margin-top: 28px;
		border-top: 1px solid #34382e;
	}
	.source-notes + .deep-notes {
		margin-top: 0;
	}
	.deep-notes:empty {
		display: none;
	}
	.deep-notes details + details {
		border-top: 1px solid #2b3024;
	}
	.detail-content {
		padding-bottom: 26px;
	}
	.deep-summary {
		color: #c4c5bd;
		font-size: 16px;
		line-height: 1.85;
		word-break: keep-all;
	}
	.version-note {
		color: #e4be8b;
		font-size: 14px;
		line-height: 1.8;
	}
	.closing {
		padding-block: 72px;
		border-top: 1px solid #34382e;
	}
	.references {
		padding-block: 30px 80px;
	}
	.references h2 {
		font-size: 26px;
	}
	.references > p {
		color: #aeb99e;
		font-size: 13px;
		line-height: 1.8;
		margin-top: 18px;
	}
	.reference-group {
		margin-top: 34px;
	}
	.reference-group h3 {
		margin: 0 0 12px;
		font-size: 13px;
		font-weight: 500;
		color: #cbd4bf;
	}
	.references ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 18px;
	}
	.references li a {
		font-size: 14px;
		line-height: 1.65;
		overflow-wrap: anywhere;
	}
	.references li p {
		margin: 6px 0 0;
		color: #aab79a;
		font-size: 12px;
		line-height: 1.8;
	}
	.next-reading {
		border-top: 1px solid #474e3e;
		padding-block: 58px;
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 36px;
	}
	.next-reading > div {
		max-width: 760px;
	}
	.next-reading p {
		margin: 0 0 16px;
		font-size: 14px;
		color: #adb69e;
	}
	.next-reading div a {
		font: 500 clamp(24px, 3vw, 36px)/1.4 var(--font-display);
		letter-spacing: -0.03em;
		word-break: keep-all;
	}
	.next-reading div a span {
		color: #ff7834;
	}
	.previous-link {
		max-width: 340px;
		color: #b9c0ab !important;
		font-size: 13px;
		line-height: 1.8;
		word-break: keep-all;
	}
	.reader-footer {
		display: flex;
		justify-content: space-between;
		border-top: 1px solid #30332a;
		padding-block: 28px;
		color: #a5ae97;
		font-size: 12px;
	}
	@media (max-width: 1049px), (max-height: 679px) {
		.page-width {
			width: min(900px, calc(100% - 48px));
		}
		.intro {
			gap: 40px;
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
			padding-block: 42px;
			gap: 40px;
		}
		h1 {
			font-size: 32px;
		}
		.intro-lead {
			font-size: 16px;
		}
		.scope-strip {
			grid-template-columns: 1fr;
			gap: 16px;
		}
		.opening-result {
			padding: 22px;
		}
		.opening-result code {
			font-size: 20px;
		}
		.chapter-intro {
			padding-block: 44px 0;
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
		.scene-copy > p,
		.closing > p {
			font-size: 16px;
		}
		.static-scene {
			display: none;
		}
		.closing {
			padding-block: 45px;
		}
		.references {
			padding-bottom: 48px;
		}
		.next-reading {
			flex-direction: column;
			align-items: start;
			padding-block: 38px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.security-reader :global(*) {
			animation: none !important;
			transition: none !important;
			scroll-behavior: auto !important;
		}
	}
	@media print {
		.reader-header,
		.journey-visual,
		.static-scene,
		.begin-link {
			display: none !important;
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
