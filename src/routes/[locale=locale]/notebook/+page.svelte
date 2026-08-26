<script lang="ts">
	import { resolve } from '$app/paths';
	import { notebookCanonicalPath } from '$lib/notebook/notebook';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const notebook = $derived(data.notebook);
	const locale = $derived(data.locale);
	const homeHref = $derived(resolve('/[locale=locale]', { locale }));
	const koNotebookHref = resolve('/[locale=locale]/notebook', { locale: 'ko' });
	const productionOrigin = 'https://wonderful-water-044d9f700.7.azurestaticapps.net';
	const canonicalUrl = $derived(`${productionOrigin}${notebookCanonicalPath(locale)}`);

	function notebookHref(nextLocale: 'ko' | 'en') {
		return resolve('/[locale=locale]/notebook', { locale: nextLocale });
	}

	function storyHref(slug: string) {
		return resolve('/[locale=locale]/notebook/zktls/[slug]', { locale: 'ko', slug });
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
	<title>{notebook.meta.title}</title>
	<meta name="description" content={notebook.meta.description} />
	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<div class="notebook-shell" lang={locale}>
	<a class="skip-link" href="#notebook-main">
		{locale === 'ko' ? '본문으로 건너뛰기' : 'Skip to main content'}
	</a>

	<header class="notebook-header">
		<a class="notebook-back" href={homeHref}>
			<span aria-hidden="true">←</span>
			<span>{locale === 'ko' ? '포트폴리오' : 'Portfolio'}</span>
		</a>

		<nav class="locale-switch" aria-label={locale === 'ko' ? '언어 선택' : 'Select language'}>
			<a href={notebookHref('ko')} aria-current={locale === 'ko' ? 'page' : undefined}>KO</a>
			<span aria-hidden="true">/</span>
			<a href={notebookHref('en')} aria-current={locale === 'en' ? 'page' : undefined}>EN</a>
		</nav>
	</header>

	<main id="notebook-main">
		<section class="notebook-hero" aria-labelledby="notebook-title">
			<div class="hero-index" aria-hidden="true">N/01</div>
			<div class="hero-copy">
				<p class="eyebrow">{notebook.hero.eyebrow}</p>
				<h1 id="notebook-title">{notebook.hero.title}</h1>
				<p class="hero-description">{notebook.hero.description}</p>
			</div>
			<div class="hero-path" aria-hidden="true">
				<span></span><span></span><span></span><span></span>
			</div>
		</section>

		{#if notebook.comingSoon}
			<section class="coming-soon" aria-labelledby="coming-soon-title">
				<p class="section-label">Edition status</p>
				<h2 id="coming-soon-title">English edition coming soon.</h2>
				<p>
					The Korean edition is available now. Article translation will follow after the first
					technical review cycle.
				</p>
				<a href={koNotebookHref}>Read the Korean edition <span aria-hidden="true">↗</span></a>
			</section>
		{:else}
			<section class="series" aria-labelledby="series-title">
				<div class="series-heading">
					<div>
						<p class="section-label">{notebook.series.label}</p>
						<h2 id="series-title">{notebook.series.title}</h2>
					</div>
					<p class="series-status"><span></span>{notebook.series.status}</p>
				</div>

				<p class="series-description">{notebook.series.description}</p>

				<div class="story-grid">
					{#each notebook.series.items as item, index (item.slug)}
						<a
							class:story-card--wide={index === 0 || index === 2}
							class:story-card--tall={index === 1}
							class="story-card"
							href={storyHref(item.slug)}
							aria-labelledby={`story-title-${item.slug}`}
						>
							<div class="story-card__top">
								<span>{item.index}</span>
								<span>{item.actCount} Acts · {item.readingTime}</span>
							</div>
							<div class="story-card__signal" aria-hidden="true">
								{#if index === 0}
									<span class="signal-claim">premiumEligible</span>
									<span class="signal-value">true</span>
								{:else if index === 1}
									<span class="signal-record">TLS 1.3</span>
									<span class="signal-lock">RECORD</span>
								{:else}
									<span class="signal-actor">P</span>
									<span class="signal-actor">N</span>
									<span class="signal-actor">V</span>
								{/if}
							</div>
							<div class="story-card__copy">
								<h3 id={`story-title-${item.slug}`}>{item.title}</h3>
								<p>{item.description}</p>
							</div>
							<span class="story-card__cta">글 읽기 <span aria-hidden="true">↗</span></span>
						</a>
					{/each}
				</div>
			</section>

			<section class="archive" aria-labelledby="archive-title">
				<div>
					<p class="section-label">{notebook.archive.label}</p>
					<h2 id="archive-title">{notebook.archive.title}</h2>
				</div>
				<p>{notebook.archive.description}</p>
				<a href={notebook.archive.href} target="_blank" rel="noreferrer">
					{notebook.archive.cta} <span aria-hidden="true">↗</span>
				</a>
			</section>
		{/if}
	</main>

	<footer class="notebook-footer">
		<span>HONGBEOM JOO</span>
		<span>Systems / Security / Operations</span>
	</footer>
</div>

<style>
	:global(body) {
		background: #0d0d0c;
	}

	.notebook-shell {
		min-height: 100dvh;
		background:
			linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px) 0 0 / 7.5rem 7.5rem,
			#0d0d0c;
		color: var(--ink);
		font-family: var(--font-body);
	}

	.skip-link {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 100;
		transform: translateY(-200%);
		border: 1px solid var(--accent);
		background: var(--surface);
		padding: 0.75rem 1rem;
		color: var(--accent);
	}

	.skip-link:focus {
		transform: translateY(0);
	}

	.notebook-header {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--line);
		padding: 1.25rem clamp(1.25rem, 4vw, 4rem);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.notebook-back,
	.locale-switch a {
		color: var(--ink-soft);
		text-decoration: none;
	}

	.notebook-back {
		display: inline-flex;
		gap: 0.65rem;
	}

	.notebook-back:hover,
	.notebook-back:focus-visible,
	.locale-switch a:hover,
	.locale-switch a:focus-visible,
	.locale-switch a[aria-current='page'] {
		color: #ff5500;
	}

	.locale-switch {
		display: flex;
		gap: 0.5rem;
	}

	main {
		width: min(100%, 96rem);
		margin: 0 auto;
	}

	.notebook-hero {
		position: relative;
		display: grid;
		min-height: min(86dvh, 58rem);
		grid-template-columns: minmax(4rem, 0.32fr) minmax(0, 1.5fr) minmax(13rem, 0.55fr);
		align-items: end;
		border-bottom: 1px solid var(--line);
		padding: clamp(5rem, 10vw, 9rem) clamp(1.25rem, 4vw, 4rem) clamp(4rem, 8vw, 7rem);
		overflow: hidden;
	}

	.hero-index {
		align-self: start;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.16em;
	}

	.hero-copy {
		position: relative;
		z-index: 2;
		max-width: 66rem;
	}

	.eyebrow,
	.section-label {
		margin: 0 0 1.5rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.notebook-hero h1 {
		max-width: 14ch;
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(3.15rem, 7.5vw, 7.8rem);
		font-weight: 900;
		line-height: 0.95;
		letter-spacing: -0.055em;
		word-break: keep-all;
	}

	.hero-description {
		max-width: 50rem;
		margin: 2.25rem 0 0;
		color: var(--ink-soft);
		font-size: clamp(1rem, 1.5vw, 1.25rem);
		line-height: 1.8;
		word-break: keep-all;
	}

	.hero-path {
		position: relative;
		align-self: stretch;
		min-height: 22rem;
	}

	.hero-path::before {
		position: absolute;
		top: 8%;
		bottom: -9rem;
		left: 50%;
		width: 1px;
		background: linear-gradient(180deg, transparent, #ff5500 35%, #ff5500 70%, transparent);
		content: '';
	}

	.hero-path span {
		position: absolute;
		left: 50%;
		width: 0.72rem;
		height: 0.72rem;
		transform: translateX(-50%) rotate(45deg);
		border: 1px solid #ff5500;
		background: #0d0d0c;
	}

	.hero-path span:nth-child(1) {
		top: 13%;
	}
	.hero-path span:nth-child(2) {
		top: 37%;
	}
	.hero-path span:nth-child(3) {
		top: 61%;
		background: #ff5500;
	}
	.hero-path span:nth-child(4) {
		top: 85%;
	}

	.series {
		padding: clamp(5rem, 10vw, 9rem) clamp(1.25rem, 4vw, 4rem);
	}

	.series-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
	}

	.series-heading h2,
	.archive h2,
	.coming-soon h2 {
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 5vw, 5rem);
		line-height: 0.95;
		letter-spacing: -0.045em;
	}

	.series-status {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin: 0 0 0.35rem;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
	}

	.series-status span {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: #ff5500;
	}

	.series-description {
		max-width: 55rem;
		margin: 2rem 0 4rem min(18vw, 13rem);
		color: var(--ink-soft);
		font-size: 1.05rem;
		line-height: 1.8;
		word-break: keep-all;
	}

	.story-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(17rem, 0.55fr);
		gap: 1px;
		background: var(--line);
		border: 1px solid var(--line);
	}

	.story-card {
		position: relative;
		display: flex;
		min-height: 31rem;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(1.5rem, 3vw, 3rem);
		overflow: hidden;
		background: #0d0d0c;
		color: inherit;
		text-decoration: none;
	}

	.story-card--wide:first-child {
		grid-row: span 2;
		min-height: 48rem;
	}

	.story-card--wide:last-child {
		grid-column: 1 / -1;
		min-height: 34rem;
	}

	.story-card::after {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, transparent 45%, rgba(255, 85, 0, 0.08));
		opacity: 0;
		content: '';
		transition: opacity 220ms ease;
	}

	.story-card:hover::after,
	.story-card:focus-visible::after {
		opacity: 1;
	}

	.story-card:focus-visible {
		outline: 2px solid #ff5500;
		outline-offset: -2px;
	}

	.story-card__top,
	.story-card__cta {
		position: relative;
		z-index: 2;
		display: flex;
		justify-content: space-between;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.story-card__signal {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		min-height: 10rem;
		color: #ff5500;
		font-family: var(--font-mono);
	}

	.signal-claim,
	.signal-record {
		border: 1px solid #ff5500;
		padding: 0.8rem 1rem;
	}

	.signal-value,
	.signal-lock {
		background: #ff5500;
		padding: 0.8rem 1rem;
		color: #0d0d0c;
	}

	.signal-actor {
		display: grid;
		width: clamp(3.5rem, 7vw, 6rem);
		aspect-ratio: 1;
		place-items: center;
		border: 1px solid #ff5500;
		font-size: clamp(1.2rem, 3vw, 2rem);
	}

	.signal-actor:nth-child(2) {
		transform: translateY(-2rem);
		background: #ff5500;
		color: #0d0d0c;
	}

	.story-card__copy {
		position: relative;
		z-index: 2;
		max-width: 60rem;
	}

	.story-card h3 {
		max-width: 16ch;
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(1.8rem, 3.7vw, 4.15rem);
		line-height: 1.05;
		letter-spacing: -0.04em;
		word-break: keep-all;
	}

	.story-card--tall h3 {
		font-size: clamp(1.7rem, 2.4vw, 2.7rem);
	}

	.story-card__copy p {
		max-width: 44rem;
		margin: 1.4rem 0 0;
		color: var(--ink-soft);
		line-height: 1.75;
		word-break: keep-all;
	}

	.story-card__cta {
		margin-top: 2rem;
		justify-content: flex-end;
		color: #ff5500;
	}

	.archive {
		display: grid;
		grid-template-columns: 1.1fr 1fr auto;
		align-items: end;
		gap: clamp(2rem, 6vw, 6rem);
		border-top: 1px solid var(--line);
		padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 4vw, 4rem);
	}

	.archive h2 {
		font-size: clamp(2rem, 4vw, 4rem);
	}

	.archive > p,
	.coming-soon > p {
		margin: 0;
		color: var(--ink-soft);
		line-height: 1.8;
		word-break: keep-all;
	}

	.archive > a,
	.coming-soon > a {
		border-bottom: 1px solid #ff5500;
		padding-bottom: 0.4rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-decoration: none;
		white-space: nowrap;
	}

	.coming-soon {
		display: grid;
		min-height: 50dvh;
		gap: 2rem;
		align-content: center;
		padding: clamp(4rem, 9vw, 9rem) clamp(1.25rem, 4vw, 4rem);
	}

	.coming-soon h2 {
		max-width: 15ch;
	}

	.coming-soon p {
		max-width: 44rem;
	}

	.coming-soon a {
		width: fit-content;
	}

	.notebook-footer {
		display: flex;
		justify-content: space-between;
		border-top: 1px solid var(--line);
		padding: 2rem clamp(1.25rem, 4vw, 4rem);
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	@media (max-width: 760px) {
		.notebook-hero {
			min-height: auto;
			grid-template-columns: 1fr;
			align-items: start;
			gap: 3rem;
			padding-top: 6rem;
		}

		.hero-index {
			order: -1;
		}

		.hero-path {
			display: none;
		}

		.notebook-hero h1 {
			font-size: clamp(2.8rem, 14vw, 4.5rem);
		}

		.series-heading,
		.archive,
		.notebook-footer {
			align-items: start;
			flex-direction: column;
		}

		.series-heading {
			display: flex;
		}

		.series-description {
			margin-left: 0;
		}

		.story-grid {
			grid-template-columns: 1fr;
		}

		.story-card,
		.story-card--wide:first-child,
		.story-card--wide:last-child {
			grid-column: auto;
			grid-row: auto;
			min-height: 34rem;
		}

		.archive {
			display: flex;
		}

		.notebook-footer {
			gap: 0.7rem;
		}
	}
</style>
