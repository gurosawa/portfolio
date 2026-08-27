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
		<div class="notebook-header__inner">
			<a class="notebook-brand" href={homeHref}>HONG BEOM JOO</a>
			<span class="notebook-context" lang="en">Systems Notebook</span>

			<nav class="notebook-nav" aria-label={locale === 'ko' ? 'Notebook 메뉴' : 'Notebook menu'}>
				<a class="portfolio-link" href={homeHref}>Portfolio</a>
				<span class="nav-separator" aria-hidden="true"></span>
				<div
					class="locale-switch"
					role="group"
					aria-label={locale === 'ko' ? '언어 선택' : 'Select language'}
				>
					<a
						href={notebookHref('ko')}
						aria-label={locale === 'ko' ? '한국어' : 'Korean'}
						aria-current={locale === 'ko' ? 'page' : undefined}>KO</a
					>
					<span aria-hidden="true">/</span>
					<a
						href={notebookHref('en')}
						aria-label="English"
						aria-current={locale === 'en' ? 'page' : undefined}>EN</a
					>
				</div>
			</nav>
		</div>
	</header>

	<main id="notebook-main" tabindex="-1">
		<section class="notebook-hero" aria-labelledby="notebook-title">
			<p class="hero-kicker" lang="en">{notebook.hero.eyebrow}</p>
			<h1 id="notebook-title">{notebook.hero.title}</h1>
			<div class="hero-footer">
				<p>{notebook.hero.description}</p>
				{#if !notebook.comingSoon}
					<a href="#zktls-stories">세 글 살펴보기</a>
				{/if}
			</div>
		</section>

		{#if notebook.comingSoon}
			<section class="coming-soon" aria-labelledby="coming-soon-title">
				<h2 id="coming-soon-title">The Korean edition is available now.</h2>
				<p>Article translation will follow after the first technical review cycle.</p>
				<a href={koNotebookHref}>Read the Korean edition</a>
			</section>
		{:else}
			<section class="series" id="zktls-stories" aria-labelledby="series-title">
				<div class="series-intro">
					<div>
						<h2 id="series-title">{notebook.series.title}</h2>
						<p>{notebook.series.description}</p>
					</div>
					<p class="series-count">{notebook.series.items.length}편 / 글마다 9개 Act</p>
				</div>

				<div class="story-list">
					{#each notebook.series.items as item, index (item.slug)}
						<a
							class="story-row"
							href={storyHref(item.slug)}
							aria-labelledby={`story-title-${item.slug}`}
							aria-describedby={`story-description-${item.slug} story-meta-${item.slug}`}
						>
							<span class="story-index" aria-hidden="true">{item.index}</span>
							<div class="story-copy">
								<p class="story-topic">
									{item.topic}
									{#if index === 0}<span> / 권장 시작점</span>{/if}
								</p>
								<h3 id={`story-title-${item.slug}`}>{item.title}</h3>
								<p class="story-description" id={`story-description-${item.slug}`}>
									{item.description}
								</p>
							</div>
							<div class="story-meta" id={`story-meta-${item.slug}`}>
								<span>{item.actCount}개 Act</span>
								<span>{item.readingTime}</span>
								<span class="story-read">글 읽기</span>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<section class="archive" aria-labelledby="archive-title">
				<div>
					<p class="archive-label">{notebook.archive.label}</p>
					<h2 id="archive-title">{notebook.archive.title}</h2>
				</div>
				<div class="archive-copy">
					<p>{notebook.archive.description}</p>
					<a href={notebook.archive.href} target="_blank" rel="noopener noreferrer">
						{notebook.archive.cta}<span class="sr-only">, 새 창에서 열림</span>
					</a>
				</div>
			</section>
		{/if}
	</main>

	<footer class="notebook-footer">
		<div class="notebook-footer__inner">
			<span>HONG BEOM JOO</span>
			<span>Systems / Security / Operations</span>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		background: var(--surface);
	}

	.notebook-shell {
		--accent: #ff5500;
		min-height: 100dvh;
		background: var(--surface);
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
		text-decoration: none;
	}

	.skip-link:focus {
		transform: translateY(0);
	}

	.notebook-header {
		position: sticky;
		top: 0;
		z-index: 30;
		border-bottom: 1px solid color-mix(in srgb, var(--line) 72%, transparent);
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		backdrop-filter: blur(12px);
	}

	.notebook-header__inner,
	main,
	.notebook-footer__inner {
		box-sizing: border-box;
		width: min(100%, 78rem);
		margin: 0 auto;
		padding-inline: clamp(1.5rem, 4.5vw, 4rem);
	}

	.notebook-header__inner {
		display: grid;
		min-height: 4.5rem;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1.5rem;
	}

	.notebook-brand,
	.notebook-context,
	.notebook-nav,
	.locale-switch {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.notebook-brand {
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-decoration: none;
	}

	.notebook-context {
		border-left: 1px solid var(--line);
		padding-left: 1.5rem;
		color: var(--ink-soft);
	}

	.notebook-nav,
	.locale-switch {
		display: flex;
		align-items: center;
	}

	.notebook-nav {
		gap: 1.25rem;
	}

	.locale-switch {
		gap: 0.5rem;
	}

	.notebook-nav a {
		color: var(--ink-soft);
		text-decoration: none;
		transition: color 160ms ease;
	}

	.notebook-nav a:hover,
	.notebook-nav a:focus-visible,
	.notebook-nav a[aria-current='page'] {
		color: var(--accent);
	}

	.nav-separator {
		width: 1px;
		height: 1rem;
		background: var(--line);
	}

	main:focus {
		outline: none;
	}

	.notebook-hero {
		display: flex;
		min-height: clamp(32rem, 64vh, 38rem);
		box-sizing: border-box;
		flex-direction: column;
		justify-content: space-between;
		border-bottom: 1px solid var(--line);
		padding-block: clamp(5rem, 9vw, 8rem) clamp(4rem, 7vw, 6rem);
	}

	.hero-kicker,
	.story-topic,
	.series-count,
	.archive-label {
		margin: 0;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.notebook-hero h1 {
		max-width: 15ch;
		margin: 4rem 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(3.25rem, 5.2vw, 4.75rem);
		font-weight: 800;
		line-height: 1.02;
		letter-spacing: -0.045em;
		white-space: pre-line;
		text-wrap: balance;
		word-break: keep-all;
	}

	.hero-footer {
		display: grid;
		grid-template-columns: minmax(0, 44rem) auto;
		align-items: end;
		justify-content: space-between;
		gap: 3rem;
	}

	.hero-footer p,
	.series-intro > div > p,
	.story-description,
	.archive-copy > p,
	.coming-soon > p {
		color: var(--ink-soft);
		line-height: 1.75;
		word-break: keep-all;
	}

	.hero-footer p {
		margin: 0;
		font-size: clamp(1rem, 1.4vw, 1.125rem);
	}

	.hero-footer a,
	.archive-copy a,
	.coming-soon a {
		width: fit-content;
		border-bottom: 1px solid var(--accent);
		padding-bottom: 0.3rem;
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-decoration: none;
		white-space: nowrap;
	}

	.series {
		scroll-margin-top: 5rem;
		padding-block: clamp(5rem, 8vw, 7rem) clamp(6rem, 10vw, 9rem);
	}

	.series-intro {
		display: grid;
		grid-template-columns: minmax(0, 44rem) auto;
		align-items: end;
		justify-content: space-between;
		gap: 3rem;
		margin-bottom: clamp(3rem, 6vw, 5rem);
	}

	.series-intro h2,
	.archive h2,
	.coming-soon h2 {
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(2.4rem, 4vw, 3.5rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}

	.series-intro > div > p {
		max-width: 42rem;
		margin: 1.5rem 0 0;
	}

	.series-count {
		padding-bottom: 0.35rem;
		color: var(--ink-soft);
		white-space: nowrap;
	}

	.story-list {
		border-top: 1px solid var(--line);
	}

	.story-row {
		display: grid;
		min-height: 13rem;
		box-sizing: border-box;
		grid-template-columns: 4.5rem minmax(0, 1fr) 10rem;
		align-items: start;
		gap: clamp(1.5rem, 3vw, 3rem);
		border-bottom: 1px solid var(--line);
		padding-block: clamp(2rem, 4vw, 2.75rem);
		color: inherit;
		text-decoration: none;
		transition:
			border-color 180ms ease,
			background-color 180ms ease;
	}

	.story-row:hover,
	.story-row:focus-visible {
		border-bottom-color: var(--accent);
		background: color-mix(in srgb, var(--surface-raised) 38%, transparent);
	}

	.story-row:focus-visible,
	.hero-footer a:focus-visible,
	.archive-copy a:focus-visible,
	.coming-soon a:focus-visible,
	.notebook-brand:focus-visible,
	.notebook-nav a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 5px;
	}

	.story-index {
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.82rem;
		letter-spacing: 0.08em;
		transition: color 180ms ease;
	}

	.story-row:hover .story-index,
	.story-row:focus-visible .story-index,
	.story-row:hover .story-read,
	.story-row:focus-visible .story-read {
		color: var(--accent);
	}

	.story-topic {
		color: var(--ink-soft);
	}

	.story-topic span {
		color: var(--accent);
	}

	.story-copy h3 {
		max-width: 28ch;
		margin: 1rem 0 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: clamp(1.8rem, 3.1vw, 2.55rem);
		font-weight: 700;
		line-height: 1.12;
		letter-spacing: -0.035em;
		text-wrap: balance;
		word-break: keep-all;
	}

	.story-description {
		max-width: 48rem;
		margin: 1.25rem 0 0;
		font-size: 0.98rem;
	}

	.story-meta {
		display: flex;
		min-height: 100%;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.45rem;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}

	.story-read {
		margin-top: auto;
		color: var(--ink-strong);
		transition: color 180ms ease;
	}

	.archive {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(19rem, 0.9fr);
		gap: clamp(3rem, 8vw, 7rem);
		border-top: 1px solid var(--line);
		padding-block: clamp(4rem, 7vw, 6rem);
	}

	.archive-label {
		margin-bottom: 1rem;
		color: var(--accent);
	}

	.archive h2 {
		max-width: 16ch;
		font-size: clamp(2rem, 3.5vw, 3rem);
	}

	.archive-copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
	}

	.archive-copy > p {
		margin: 0;
	}

	.coming-soon {
		display: grid;
		min-height: 34rem;
		gap: 2rem;
		align-content: center;
		border-bottom: 1px solid var(--line);
	}

	.coming-soon h2,
	.coming-soon p {
		max-width: 42rem;
		margin: 0;
	}

	.notebook-footer {
		border-top: 1px solid var(--line);
	}

	.notebook-footer__inner {
		display: flex;
		min-height: 5rem;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	@media (max-width: 760px) {
		.notebook-header__inner {
			grid-template-columns: 1fr auto;
			gap: 1rem;
		}

		.notebook-context,
		.portfolio-link,
		.nav-separator {
			display: none;
		}

		.notebook-hero {
			min-height: 30rem;
			padding-block: 4.5rem 3.5rem;
		}

		.notebook-hero h1 {
			max-width: 13ch;
			margin-block: 3rem;
			font-size: clamp(2.6rem, 10.5vw, 3.25rem);
			line-height: 1.04;
		}

		.hero-footer,
		.series-intro,
		.archive {
			grid-template-columns: 1fr;
		}

		.hero-footer {
			align-items: start;
			gap: 2rem;
		}

		.series {
			padding-block: 4.5rem 6rem;
		}

		.series-intro {
			align-items: start;
			gap: 1.5rem;
			margin-bottom: 3rem;
		}

		.series-count {
			padding: 0;
		}

		.story-row {
			min-height: 0;
			grid-template-columns: 2.25rem minmax(0, 1fr);
			gap: 1rem;
			padding-block: 2rem;
		}

		.story-copy h3 {
			margin-top: 0.75rem;
			font-size: clamp(1.65rem, 7vw, 2rem);
		}

		.story-description {
			font-size: 0.94rem;
		}

		.story-meta {
			grid-column: 2;
			min-height: 0;
			flex-direction: row;
			align-items: center;
			gap: 0.75rem;
			margin-top: 0.25rem;
		}

		.story-read {
			margin: 0 0 0 auto;
		}

		.archive {
			gap: 2rem;
			padding-block: 4rem;
		}

		.notebook-footer__inner {
			min-height: 6rem;
			flex-direction: column;
			align-items: flex-start;
			justify-content: center;
			gap: 0.45rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(html) {
			scroll-behavior: auto;
		}

		.story-row,
		.story-index,
		.story-read,
		.notebook-nav a {
			transition: none;
		}
	}
</style>
