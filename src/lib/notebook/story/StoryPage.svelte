<script lang="ts">
	/* eslint-disable svelte/no-at-html-tags, svelte/no-navigation-without-resolve, svelte/prefer-svelte-reactivity */
	import { onMount, tick } from 'svelte';
	import { afterNavigate, pushState, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import StoryBlock from './StoryBlock.svelte';
	import StoryCanvas from './StoryCanvas.svelte';
	import StoryFigure from './StoryFigure.svelte';
	import type { DeepDive, StoryDocument } from './schema';

	let { story }: { story: StoryDocument } = $props();
	let rootElement: HTMLElement;
	let storyContent: HTMLElement;
	let activeActIndex = $state(0);
	let activeActProgress = $state(0);
	let activeDeepId = $state<string | null>(null);
	let motionOff = $state(false);
	let returnFocus: HTMLElement | null = null;
	let lockedScrollY = 0;
	let pageLocked = false;
	let drawerOwnsHistoryEntry = false;
	let pendingDrawerHistoryClose = false;
	let bodyStyleSnapshot: Record<string, string> | null = null;
	const drawerScrollByDeepId = new Map<string, number>();
	const drawerTriggerByDeepId = new Map<string, HTMLElement>();

	const activeAct = $derived(story.acts[activeActIndex]);
	const hubHref = resolve('/[locale=locale]/notebook', { locale: 'ko' });
	const productionOrigin = 'https://wonderful-water-044d9f700.7.azurestaticapps.net';
	const canonicalUrl = $derived(`${productionOrigin}${story.meta.canonicalPath}`);
	const ogImageUrl = $derived(`${productionOrigin}/og/zktls-${story.meta.slug}.svg`);
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: story.meta.title,
			description: story.meta.description,
			inLanguage: 'ko',
			datePublished: story.meta.publishedAt,
			dateModified: story.meta.technicallyReviewedAt,
			mainEntityOfPage: canonicalUrl,
			author: { '@type': 'Person', name: 'Hongbeom Joo' }
		})
	);
	const jsonLdTag = $derived(
		`<script type="application/ld+json">${jsonLd.replaceAll('<', '\\u003c')}</scr` + 'ipt>'
	);

	function finishPendingDrawerHistoryClose() {
		if (!pendingDrawerHistoryClose) return;
		pendingDrawerHistoryClose = false;
		drawerOwnsHistoryEntry = false;
		const restoreY = lockedScrollY;
		const restoreIndex = activeActIndex;
		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.delete('deep');
		nextUrl.hash = story.acts[restoreIndex].hash;
		replaceState(nextUrl, { storyAct: restoreIndex });
		closeDeepUi();
		requestAnimationFrame(() => window.scrollTo(0, restoreY));
	}

	afterNavigate(finishPendingDrawerHistoryClose);

	function deepDivesForAct(actId: string) {
		return story.deepDives.filter((deepDive) => deepDive.actId === actId);
	}

	function referencesForAct(actId: string) {
		return story.references.filter((reference) => reference.actId === actId);
	}

	function openDeep(deepDive: DeepDive, trigger: HTMLElement | null, push = true) {
		const ownerIndex = story.acts.findIndex((act) => act.id === deepDive.actId);
		if (ownerIndex >= 0) activeActIndex = ownerIndex;
		if (trigger) drawerTriggerByDeepId.set(deepDive.id, trigger);
		returnFocus = trigger ?? drawerTriggerByDeepId.get(deepDive.id) ?? null;
		drawerScrollByDeepId.set(deepDive.id, window.scrollY);
		activeDeepId = deepDive.id;
		lockPage();

		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.set('deep', deepDive.id);
		if (ownerIndex >= 0) nextUrl.hash = story.acts[ownerIndex].hash;
		const state = { storyAct: ownerIndex, storyDeep: deepDive.id };
		if (push) {
			pushState(nextUrl, state);
			drawerOwnsHistoryEntry = true;
		} else {
			replaceState(nextUrl, state);
		}

		void focusActiveDrawer();
	}

	function changeDeep(deepDive: DeepDive) {
		activeDeepId = deepDive.id;
		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.set('deep', deepDive.id);
		replaceState(nextUrl, { storyAct: activeActIndex, storyDeep: deepDive.id });
		void focusActiveDrawer();
	}

	function requestCloseDeep() {
		if (drawerOwnsHistoryEntry) {
			history.back();
			return;
		}

		closeDeepAndNormalizeUrl();
	}

	function closeDeepAndNormalizeUrl() {
		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.delete('deep');
		replaceState(nextUrl, { storyAct: activeActIndex });
		drawerOwnsHistoryEntry = false;
		closeDeepUi();
	}

	function closeDeepUi() {
		if (!activeDeepId && !pageLocked) return;
		activeDeepId = null;
		unlockPage();
		const target = returnFocus;
		returnFocus = null;
		void tick().then(() => {
			const focusTarget =
				target ?? document.getElementById(`${story.acts[activeActIndex].hash.slice(1)}-title`);
			focusTarget?.focus({ preventScroll: true });
		});
	}

	function lockPage() {
		if (pageLocked) return;
		pageLocked = true;
		lockedScrollY = window.scrollY;
		bodyStyleSnapshot = {
			position: document.body.style.position,
			top: document.body.style.top,
			width: document.body.style.width,
			overflowY: document.body.style.overflowY
		};
		document.body.style.position = 'fixed';
		document.body.style.top = `-${lockedScrollY}px`;
		document.body.style.width = '100%';
		document.body.style.overflowY = 'scroll';
		storyContent.inert = true;
	}

	function unlockPage() {
		if (!pageLocked) return;
		pageLocked = false;
		storyContent.inert = false;
		if (bodyStyleSnapshot) {
			document.body.style.position = bodyStyleSnapshot.position;
			document.body.style.top = bodyStyleSnapshot.top;
			document.body.style.width = bodyStyleSnapshot.width;
			document.body.style.overflowY = bodyStyleSnapshot.overflowY;
		}
		window.scrollTo(0, lockedScrollY);
		bodyStyleSnapshot = null;
	}

	async function focusActiveDrawer() {
		await tick();
		const panel = rootElement.querySelector<HTMLElement>(
			`[data-deep-panel="${activeDeepId}"]:not([hidden])`
		);
		panel?.querySelector<HTMLElement>('[data-deep-title]')?.focus();
	}

	function handleDrawerKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			requestCloseDeep();
			return;
		}

		if (event.key !== 'Tab') return;
		const panel = rootElement.querySelector<HTMLElement>(
			`[data-deep-panel="${activeDeepId}"]:not([hidden])`
		);
		if (!panel) return;
		const focusable = Array.from(
			panel.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('hidden'));
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const current = document.activeElement;
		const currentIsInTabOrder = focusable.includes(current as HTMLElement);
		if (event.shiftKey && (!currentIsInTabOrder || current === first)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (!currentIsInTabOrder || current === last)) {
			event.preventDefault();
			first.focus();
		}
	}

	function railNavigate(event: MouseEvent, index: number) {
		event.preventDefault();
		const act = story.acts[index];
		const target = document.getElementById(act.hash.slice(1));
		if (!target) return;
		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.delete('deep');
		nextUrl.hash = act.hash;
		pushState(nextUrl, { storyAct: index });
		window.scrollTo(0, target.offsetTop);
		target.querySelector<HTMLElement>('h2, h1')?.focus({ preventScroll: true });
	}

	function toggleMotion() {
		motionOff = !motionOff;
		localStorage.setItem('systems-notebook-motion', motionOff ? 'off' : 'on');
		rootElement.dispatchEvent(
			new CustomEvent('story-motion-change', {
				bubbles: true,
				detail: { motionOff }
			})
		);
	}

	onMount(() => {
		const abortController = new AbortController();
		let frame = 0;
		let initialFrame = 0;
		let destroyed = false;
		let userMotionPreference = localStorage.getItem('systems-notebook-motion');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		motionOff = userMotionPreference ? userMotionPreference === 'off' : reducedMotion.matches;
		document.documentElement.classList.add('story-route-active');
		document.body.classList.add('story-route-active');

		const scheduleSample = () => {
			if (frame || activeDeepId || destroyed) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				if (activeDeepId || destroyed) return;
				const sections = Array.from(rootElement.querySelectorAll<HTMLElement>('[data-story-act]'));
				if (sections.length === 0) return;
				const anchor = window.innerHeight * 0.5;
				let nextIndex = 0;
				let nextProgress = 0;
				let bestDistance = Number.POSITIVE_INFINITY;

				for (const [index, section] of sections.entries()) {
					const rect = section.getBoundingClientRect();
					const distance = Math.abs(rect.top - anchor);
					if (rect.top <= anchor && rect.bottom >= anchor) {
						nextIndex = index;
						nextProgress = Math.max(0, Math.min(1, (anchor - rect.top) / Math.max(rect.height, 1)));
						break;
					}
					if (distance < bestDistance) {
						bestDistance = distance;
						nextIndex = index;
						nextProgress = rect.bottom < anchor ? 1 : 0;
					}
				}

				activeActIndex = nextIndex;
				activeActProgress = motionOff ? (nextProgress >= 0.5 ? 1 : 0) : nextProgress;
				rootElement.style.setProperty('--story-act-progress', String(activeActProgress));
				rootElement.style.setProperty('--story-progress', String((nextIndex + nextProgress) / 9));
				rootElement.dispatchEvent(
					new CustomEvent('story-frame', {
						bubbles: true,
						detail: {
							actIndex: nextIndex,
							actProgress: activeActProgress,
							motionOff
						}
					})
				);

				const expectedHash = story.acts[nextIndex].hash;
				if (!activeDeepId && window.location.hash !== expectedHash) {
					const nextUrl = new URL(window.location.href);
					nextUrl.hash = expectedHash;
					replaceState(nextUrl, { storyAct: nextIndex });
				}
			});
		};

		const syncFromLocation = (initial = false) => {
			const current = new URL(window.location.href);
			const wasDrawerOpen = activeDeepId !== null || pageLocked;
			const deepId = current.searchParams.get('deep');
			const deepDive = deepId
				? story.deepDives.find((candidate) => candidate.id === deepId)
				: undefined;
			const hashIndex = story.acts.findIndex((act) => act.hash === current.hash);

			if (deepDive) {
				const ownerIndex = story.acts.findIndex((act) => act.id === deepDive.actId);
				if (initial) {
					const deepUrl = new URL(current);
					const baseUrl = new URL(current);
					baseUrl.searchParams.delete('deep');
					replaceState(baseUrl, { storyAct: ownerIndex });
					pushState(deepUrl, { storyAct: ownerIndex, storyDeep: deepDive.id });
				}
				drawerOwnsHistoryEntry = true;
				activeActIndex = ownerIndex;
				requestAnimationFrame(() => {
					const owner = document.getElementById(story.acts[ownerIndex].hash.slice(1));
					const savedScrollY = drawerScrollByDeepId.get(deepDive.id);
					if (savedScrollY !== undefined) window.scrollTo(0, savedScrollY);
					else if (initial && owner) window.scrollTo(0, owner.offsetTop);
					openDeep(deepDive, null, false);
				});
				return;
			}

			if (deepId) {
				current.searchParams.delete('deep');
				replaceState(current, { storyAct: hashIndex >= 0 ? hashIndex : 0 });
			}

			if (wasDrawerOpen) {
				pendingDrawerHistoryClose = true;
				window.setTimeout(finishPendingDrawerHistoryClose, 80);
				return;
			}

			drawerOwnsHistoryEntry = false;
			const targetIndex = hashIndex >= 0 ? hashIndex : 0;
			activeActIndex = targetIndex;
			requestAnimationFrame(() => {
				const target = document.getElementById(story.acts[targetIndex].hash.slice(1));
				if (target && (initial || hashIndex >= 0)) window.scrollTo(0, target.offsetTop);
				scheduleSample();
			});
		};

		const handleMotionPreference = (event: MediaQueryListEvent) => {
			userMotionPreference = localStorage.getItem('systems-notebook-motion');
			if (!userMotionPreference) motionOff = event.matches;
		};

		window.addEventListener('scroll', scheduleSample, {
			passive: true,
			signal: abortController.signal
		});
		window.addEventListener('resize', scheduleSample, {
			passive: true,
			signal: abortController.signal
		});
		window.addEventListener('popstate', () => syncFromLocation(false), {
			signal: abortController.signal
		});
		reducedMotion.addEventListener('change', handleMotionPreference, {
			signal: abortController.signal
		});
		initialFrame = requestAnimationFrame(() => {
			initialFrame = 0;
			syncFromLocation(true);
			scheduleSample();
		});

		return () => {
			destroyed = true;
			abortController.abort();
			if (frame) cancelAnimationFrame(frame);
			if (initialFrame) cancelAnimationFrame(initialFrame);
			unlockPage();
			document.documentElement.classList.remove('story-route-active');
			document.body.classList.remove('story-route-active');
		};
	});
</script>

<svelte:head>
	<title>{story.meta.title} / Systems Notebook</title>
	<meta name="description" content={story.meta.description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={story.meta.title} />
	<meta property="og:description" content={story.meta.description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="article:published_time" content={story.meta.publishedAt} />
	<meta property="article:modified_time" content={story.meta.technicallyReviewedAt} />
	<link rel="canonical" href={canonicalUrl} />
	{@html jsonLdTag}
</svelte:head>

<article
	bind:this={rootElement}
	class:story-shell--drawer-open={activeDeepId !== null}
	class:story-shell--motion-off={motionOff}
	class={`story-shell story-shell--${story.meta.slug}`}
	lang="ko"
	data-story-root
	data-story-slug={story.meta.slug}
>
	<div class="story-canvas-host" data-story-canvas-host aria-hidden="true">
		<StoryCanvas {story} {activeActIndex} {activeActProgress} {motionOff} />
	</div>

	<div bind:this={storyContent} class="story-content-layer">
		<header class="story-header">
			<a class="story-back" href={hubHref}>← Systems Notebook</a>
			<div class="story-status" aria-live="polite">
				<span>{String(activeActIndex).padStart(2, '0')} / 08</span>
				<span>{activeAct.title}</span>
			</div>
			<button class="motion-toggle" type="button" aria-pressed={motionOff} onclick={toggleMotion}>
				{motionOff ? '모션 켜기' : '모션 끄기'}
			</button>
		</header>

		<nav class="act-rail" aria-label="Act 이동">
			{#each story.acts as act, index (act.id)}
				<a
					href={act.hash}
					aria-current={activeActIndex === index ? 'step' : undefined}
					onclick={(event) => railNavigate(event, index)}
				>
					<span>{String(index).padStart(2, '0')}</span>
					<strong>{act.title}</strong>
				</a>
			{/each}
		</nav>

		<main class="story-main">
			<div class="mobile-overview">
				<p class="story-eyebrow">전체 흐름</p>
				<StoryFigure
					visual={{ kind: 'flow', nodes: story.mobileOverview.nodes }}
					alt={story.mobileOverview.alt}
					caption="모바일에서는 이 전체 흐름도와 본문을 정적으로 제공한다."
				/>
			</div>

			{#each story.acts as act, index (act.id)}
				<section
					id={act.hash.slice(1)}
					class:story-act--opening={index === 0}
					class:story-act--active={activeActIndex === index}
					class="story-act"
					data-story-act
					data-act-index={index}
					aria-labelledby={`${act.hash.slice(1)}-title`}
				>
					<div class="act-index" aria-hidden="true">{String(index).padStart(2, '0')}</div>
					<div class="act-copy" data-story-projection-source>
						<p class="story-eyebrow">{act.kicker}</p>
						{#if index === 0}
							<h1 id={`${act.hash.slice(1)}-title`} tabindex="-1">{story.opening.question}</h1>
							<div class="opening-claim" data-claim-card>
								<div>
									<span>{story.opening.claim.label}</span>
									<strong>{Object.keys(story.opening.claim.fields)[0]}</strong>
								</div>
								<code>{JSON.stringify(story.opening.claim.fields)}</code>
								<small>{story.opening.claim.status} · 제출 자료를 아직 검사하지 않음</small>
							</div>
						{:else}
							<h2 id={`${act.hash.slice(1)}-title`} tabindex="-1">{act.title}</h2>
						{/if}

						<p class="act-lead">{act.lead}</p>

						{#each act.blocks as block (block.id)}
							<StoryBlock {block} />
						{/each}

						{#if deepDivesForAct(act.id).length > 0}
							<div class="deep-triggers" aria-label={`${act.title} Deep dive`}>
								<p>Deep dive</p>
								{#each deepDivesForAct(act.id) as deepDive (deepDive.id)}
									<button
										id={`deep-trigger-${deepDive.id}`}
										type="button"
										data-deep-trigger={deepDive.id}
										onclick={(event) => openDeep(deepDive, event.currentTarget)}
									>
										<span>{deepDive.title}</span><span aria-hidden="true">↗</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/each}

			<section class="epilogue" aria-labelledby="epilogue-title">
				<div>
					<p class="story-eyebrow">Epilogue</p>
					<h2 id="epilogue-title">처음부터 끝까지, 같은 대상을 다시 본다.</h2>
					<p>주황색 경로는 글마다 다른 장면을 지나지만 끝까지 같은 API 응답과 주장을 추적한다.</p>
				</div>
				<StoryFigure
					visual={{
						kind: 'flow',
						nodes: story.mobileOverview.nodes,
						active: story.mobileOverview.nodes
					}}
					alt={story.mobileOverview.alt}
					caption="전체 경로 요약"
				/>
			</section>

			<section class="references" aria-labelledby="references-title">
				<p class="story-eyebrow">References</p>
				<h2 id="references-title">기술 출처</h2>
				{#each story.acts as act (act.id)}
					{#if referencesForAct(act.id).length > 0}
						<section class="reference-group" aria-labelledby={`references-${act.id}`}>
							<h3 id={`references-${act.id}`}>Act {act.index} · {act.title}</h3>
							<ol>
								{#each referencesForAct(act.id) as reference (reference.href)}
									<li>
										<a href={reference.href} target="_blank" rel="noreferrer">{reference.label}</a>
										<p>{reference.note}</p>
									</li>
								{/each}
							</ol>
						</section>
					{/if}
				{/each}
			</section>

			<nav class="story-navigation" aria-label="시리즈 이동">
				{#if story.navigation.previous}
					<a href={story.navigation.previous.href} rel="prev">
						<span>이전 글</span><strong>{story.navigation.previous.title}</strong>
					</a>
				{:else}<span></span>{/if}
				{#if story.navigation.next}
					<a href={story.navigation.next.href} rel="next">
						<span>다음 글</span><strong>{story.navigation.next.title}</strong>
					</a>
				{:else}<a href={hubHref}><span>시리즈 끝</span><strong>Systems Notebook으로</strong></a
					>{/if}
			</nav>
		</main>
	</div>

	<div class="drawer-backdrop" aria-hidden="true" onclick={requestCloseDeep}></div>
	<aside class="deep-drawer" aria-hidden={activeDeepId === null} onkeydown={handleDrawerKeydown}>
		{#each story.deepDives as deepDive (deepDive.id)}
			<div
				hidden={activeDeepId !== deepDive.id}
				data-deep-panel={deepDive.id}
				role="dialog"
				aria-modal="true"
				aria-labelledby={`deep-title-${deepDive.id}`}
			>
				<header class="deep-drawer__header">
					<div>
						<p>Deep dive · {story.acts.find((act) => act.id === deepDive.actId)?.title}</p>
						<h2 id={`deep-title-${deepDive.id}`} tabindex="-1" data-deep-title>{deepDive.title}</h2>
					</div>
					<button type="button" aria-label="Deep dive 닫기" onclick={requestCloseDeep}>×</button>
				</header>

				<p class="deep-summary">{deepDive.summary}</p>
				<div class="deep-drawer__body">
					{#each deepDive.blocks as block (block.id)}<StoryBlock {block} />{/each}
				</div>

				{#if deepDivesForAct(deepDive.actId).length > 1}
					<nav class="deep-tabs" aria-label="현재 Act의 Deep dive">
						{#each deepDivesForAct(deepDive.actId) as sibling, siblingIndex (sibling.id)}
							<button
								type="button"
								aria-current={sibling.id === activeDeepId ? 'page' : undefined}
								onclick={() => changeDeep(sibling)}
							>
								{siblingIndex + 1}
							</button>
						{/each}
					</nav>
				{/if}
			</div>
		{/each}
	</aside>
</article>

<style>
	:global(html.story-route-active) {
		scroll-behavior: auto !important;
	}

	:global(body.story-route-active) {
		background: #0b0b0a;
	}

	.story-shell {
		--story-surface: #0b0b0a;
		--story-panel: #11100e;
		--story-line: #302c25;
		--story-body: #c8bda8;
		position: relative;
		min-height: 100dvh;
		overflow-x: clip;
		background:
			linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px) 0 0 / 8rem 8rem,
			var(--story-surface);
		color: var(--story-body);
		font-family: var(--font-body);
	}

	.story-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 45;
		display: grid;
		grid-template-columns: 1fr minmax(12rem, auto) 1fr;
		align-items: center;
		gap: 1rem;
		border-bottom: 1px solid rgba(48, 44, 37, 0.72);
		background: rgba(11, 11, 10, 0.88);
		padding: 0.85rem clamp(1rem, 2.5vw, 2.5rem);
		backdrop-filter: blur(12px);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.story-back {
		width: fit-content;
		color: var(--ink-soft);
		text-decoration: none;
	}

	.story-back:hover,
	.story-back:focus-visible {
		color: #ff5500;
	}

	.story-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: var(--ink-soft);
	}

	.story-status span:first-child {
		color: #ff5500;
	}

	.motion-toggle {
		justify-self: end;
		border: 1px solid var(--story-line);
		border-radius: 0;
		background: transparent;
		padding: 0.55rem 0.7rem;
		color: var(--ink-soft);
		font: inherit;
		cursor: pointer;
	}

	.motion-toggle:hover,
	.motion-toggle:focus-visible,
	.motion-toggle[aria-pressed='true'] {
		border-color: #ff5500;
		color: #ff5500;
		outline: none;
	}

	.story-canvas-host {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.story-content-layer {
		position: relative;
		z-index: 1;
		min-width: 0;
	}

	.act-rail {
		position: fixed;
		top: 50%;
		right: clamp(0.75rem, 2vw, 2rem);
		z-index: 40;
		display: grid;
		gap: 0.25rem;
		transform: translateY(-50%);
	}

	.act-rail a {
		display: grid;
		grid-template-columns: 1.4rem 0fr;
		align-items: center;
		gap: 0.45rem;
		border-right: 1px solid var(--story-line);
		padding: 0.35rem 0.55rem 0.35rem 0;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.6rem;
		text-decoration: none;
		transition:
			grid-template-columns 180ms ease,
			color 180ms ease,
			border-color 180ms ease;
	}

	.act-rail strong {
		overflow: hidden;
		font-weight: 400;
		white-space: nowrap;
	}

	.act-rail a:hover,
	.act-rail a:focus-visible,
	.act-rail a[aria-current='step'] {
		grid-template-columns: 1.4rem 8.5rem;
		border-color: #ff5500;
		color: #ff5500;
		outline: none;
	}

	.story-main {
		position: relative;
		z-index: 2;
		min-width: 0;
	}

	.mobile-overview {
		display: none;
	}

	.story-act {
		position: relative;
		display: grid;
		min-height: 145dvh;
		grid-template-columns: minmax(3rem, 0.45fr) minmax(0, 42rem) minmax(18rem, 0.8fr);
		align-items: center;
		gap: clamp(1rem, 4vw, 4rem);
		border-bottom: 1px solid var(--story-line);
		padding: 8rem clamp(1rem, 5vw, 5rem);
	}

	.story-act--opening {
		min-height: 115dvh;
		grid-template-columns: minmax(3rem, 0.28fr) minmax(0, 62rem) minmax(8rem, 0.35fr);
	}

	.act-index {
		align-self: start;
		padding-top: 1rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
	}

	.act-copy {
		grid-column: 2;
		min-width: 0;
		padding: clamp(1rem, 3vw, 2rem) 0;
	}

	.story-eyebrow {
		margin: 0 0 1.25rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.story-act h1,
	.story-act h2,
	.epilogue h2,
	.references > h2 {
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-weight: 900;
		letter-spacing: -0.045em;
		word-break: keep-all;
	}

	.story-act h1 {
		max-width: 14ch;
		font-size: clamp(3.1rem, 7.4vw, 7.4rem);
		line-height: 0.95;
	}

	.story-act h2 {
		font-size: clamp(2.7rem, 5vw, 5.2rem);
		line-height: 0.98;
	}

	.story-act h1:focus,
	.story-act h2:focus {
		outline: none;
	}

	.act-lead {
		max-width: 44rem;
		margin: 1.75rem 0 0;
		color: var(--ink-strong);
		font-size: clamp(1.15rem, 1.7vw, 1.42rem);
		line-height: 1.75;
		word-break: keep-all;
	}

	.opening-claim {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1.5rem;
		max-width: 38rem;
		margin-top: 3rem;
		border: 1px solid #ff5500;
		background: rgba(255, 85, 0, 0.035);
		padding: clamp(1.25rem, 3vw, 2.25rem);
		font-family: var(--font-mono);
	}

	.opening-claim div {
		display: grid;
		gap: 0.7rem;
	}

	.opening-claim span,
	.opening-claim small {
		color: var(--ink-soft);
		font-size: 0.68rem;
	}

	.opening-claim strong {
		color: var(--ink-strong);
		font-size: 0.85rem;
	}

	.opening-claim code {
		align-self: center;
		color: #ff5500;
		font-size: clamp(0.8rem, 1.7vw, 1.1rem);
	}

	.opening-claim small {
		grid-column: 1 / -1;
		border-top: 1px solid var(--story-line);
		padding-top: 1rem;
	}

	.deep-triggers {
		display: grid;
		gap: 0.5rem;
		margin-top: 2rem;
		border-top: 1px solid var(--story-line);
		padding-top: 1rem;
	}

	.deep-triggers > p {
		margin: 0 0 0.25rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.deep-triggers button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border: 0;
		border-bottom: 1px solid var(--story-line);
		background: transparent;
		padding: 0.8rem 0;
		color: var(--ink-soft);
		font-family: inherit;
		font-size: 0.85rem;
		text-align: left;
		cursor: pointer;
	}

	.deep-triggers button:hover,
	.deep-triggers button:focus-visible {
		border-color: #ff5500;
		color: #ff5500;
		outline: none;
	}

	.epilogue,
	.references,
	.story-navigation {
		width: min(100% - 2rem, 76rem);
		margin: 0 auto;
	}

	.epilogue {
		display: grid;
		min-height: 100dvh;
		grid-template-columns: 0.8fr 1.2fr;
		align-items: center;
		gap: clamp(2rem, 6vw, 6rem);
		padding: 7rem 0;
	}

	.epilogue h2,
	.references > h2 {
		font-size: clamp(2.5rem, 5vw, 5rem);
		line-height: 1;
	}

	.epilogue > div > p:last-child {
		color: var(--ink-soft);
		line-height: 1.8;
		word-break: keep-all;
	}

	.references {
		border-top: 1px solid var(--story-line);
		padding: 7rem 0;
	}

	.reference-group {
		display: grid;
		grid-template-columns: minmax(10rem, 0.45fr) 1fr;
		gap: 2rem;
		border-top: 1px solid var(--story-line);
		padding: 1.5rem 0;
	}

	.reference-group:first-of-type {
		margin-top: 3rem;
	}

	.reference-group h3 {
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 400;
	}

	.reference-group ol {
		display: grid;
		gap: 1.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.reference-group a {
		color: #ff5500;
		font-size: 0.9rem;
		text-underline-offset: 0.25rem;
	}

	.reference-group p {
		margin: 0.4rem 0 0;
		color: var(--ink-soft);
		font-size: 0.78rem;
		line-height: 1.6;
	}

	.story-navigation {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1px;
		background: var(--story-line);
		border: 1px solid var(--story-line);
		margin-bottom: 4rem;
	}

	.story-navigation a {
		display: grid;
		gap: 1rem;
		background: var(--story-surface);
		padding: clamp(1.5rem, 3vw, 2.5rem);
		color: inherit;
		text-decoration: none;
	}

	.story-navigation a:last-child {
		text-align: right;
	}

	.story-navigation span {
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.story-navigation strong {
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(1rem, 2vw, 1.35rem);
		line-height: 1.35;
		word-break: keep-all;
	}

	.story-navigation a:hover strong,
	.story-navigation a:focus-visible strong {
		color: #ff5500;
	}

	.drawer-backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
		background: rgba(4, 4, 3, 0.72);
		opacity: 0;
		pointer-events: none;
		transition: opacity 180ms ease;
	}

	.deep-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 80;
		width: min(47rem, 90vw);
		transform: translateX(105%);
		border-left: 1px solid #ff5500;
		background: #11100e;
		overflow-y: auto;
		transition: transform 220ms cubic-bezier(0.2, 0.72, 0.2, 1);
	}

	.story-shell--drawer-open .drawer-backdrop {
		opacity: 1;
		pointer-events: auto;
	}

	.story-shell--drawer-open .act-rail {
		display: none;
	}

	.story-shell--drawer-open .deep-drawer {
		transform: translateX(0);
	}

	.deep-drawer section {
		min-height: 100%;
		padding: clamp(1.25rem, 4vw, 4rem);
	}

	.deep-drawer__header {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
		border-bottom: 1px solid var(--story-line);
		padding-bottom: 1.5rem;
	}

	.deep-drawer__header p {
		margin: 0 0 0.7rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.deep-drawer__header h2 {
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(2rem, 4vw, 3.5rem);
		line-height: 1;
		letter-spacing: -0.04em;
		word-break: keep-all;
	}

	.deep-drawer__header h2:focus {
		outline: none;
	}

	.deep-drawer__header > button {
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--story-line);
		border-radius: 0;
		background: transparent;
		color: var(--ink-soft);
		font-size: 1.4rem;
		cursor: pointer;
	}

	.deep-drawer__header > button:hover,
	.deep-drawer__header > button:focus-visible {
		border-color: #ff5500;
		color: #ff5500;
		outline: none;
	}

	.deep-summary {
		margin: 2rem 0 0;
		color: var(--ink-strong);
		font-size: 1.08rem;
		line-height: 1.8;
		word-break: keep-all;
	}

	.deep-drawer__body {
		margin-top: 2rem;
	}

	.deep-tabs {
		display: flex;
		gap: 0.45rem;
		margin-top: 3rem;
		border-top: 1px solid var(--story-line);
		padding-top: 1rem;
	}

	.deep-tabs button {
		display: grid;
		width: 2.2rem;
		height: 2.2rem;
		place-items: center;
		border: 1px solid var(--story-line);
		border-radius: 0;
		background: transparent;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		cursor: pointer;
	}

	.deep-tabs button[aria-current='page'],
	.deep-tabs button:hover,
	.deep-tabs button:focus-visible {
		border-color: #ff5500;
		background: #ff5500;
		color: #11100e;
		outline: none;
	}

	.story-shell--motion-off *,
	.story-shell--motion-off *::before,
	.story-shell--motion-off *::after {
		scroll-behavior: auto !important;
		animation-duration: 0.001ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.001ms !important;
	}

	@media (max-width: 900px) {
		.story-header {
			grid-template-columns: 1fr auto;
		}

		.story-status,
		.act-rail,
		.story-canvas-host {
			display: none;
		}

		.mobile-overview {
			display: block;
			border-bottom: 1px solid var(--story-line);
			padding: 7rem 1rem 3rem;
		}

		.story-act :global([data-story-figure]),
		.epilogue :global([data-story-figure]) {
			display: none;
		}

		.story-act,
		.story-act--opening {
			min-height: auto;
			grid-template-columns: 2rem minmax(0, 1fr);
			align-items: start;
			gap: 1rem;
			padding: 5rem 1rem;
		}

		.act-copy {
			grid-column: 2;
		}

		.story-act h1 {
			font-size: clamp(2.8rem, 13vw, 4.7rem);
		}

		.story-act h2 {
			font-size: clamp(2.5rem, 11vw, 4rem);
		}

		.epilogue {
			min-height: auto;
			grid-template-columns: 1fr;
			padding: 5rem 0;
		}

		.reference-group {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	@media (max-width: 640px) {
		.story-header {
			padding: 0.75rem 1rem;
		}

		.story-back {
			font-size: 0.58rem;
		}

		.motion-toggle {
			padding: 0.45rem 0.55rem;
		}

		.opening-claim {
			grid-template-columns: 1fr;
		}

		.opening-claim small {
			grid-column: 1;
		}

		.story-navigation {
			grid-template-columns: 1fr;
		}

		.story-navigation a:last-child {
			text-align: left;
		}

		.deep-drawer {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drawer-backdrop,
		.deep-drawer,
		.act-rail a {
			transition: none;
		}
	}
</style>
