<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import FlowPreview from '$lib/notebook/components/FlowPreview.svelte';
	import { filterNotebook } from '$lib/notebook/catalog-filter';
	import type { NotebookArea, NotebookKind } from '$lib/notebook/notebook';
	import { notebookPreferenceContext, type NotebookPreferences } from '$lib/notebook/notebook-ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const preferences = getContext<NotebookPreferences>(notebookPreferenceContext);
	const notebook = $derived(data.notebook);
	let area = $state<NotebookArea | 'all'>('all');
	let kind = $state<NotebookKind | 'all'>('all');
	let query = $state('');
	let selectedId = $state('');
	const labels = { concept: '개념 설명', reference: '자료 정리', experiment: '직접 실험' };
	const areas = [
		{ id: 'all', label: '전체' },
		{ id: 'ops', label: 'OPS', detail: '인프라와 운영' },
		{ id: 'sec', label: 'SEC', detail: '보안과 인증' },
		{ id: 'ai', label: 'AI', detail: '모델과 데이터' }
	] as const;
	const results = $derived(filterNotebook(notebook.entries, { area, kind, query }));
	const featuredEntries = $derived(
		notebook.features.flatMap((feature) => {
			const entry = notebook.entries.find((item) => item.id === feature.entryId);
			return entry && (area === 'all' || feature.area === area)
				? [{ ...entry, featureArea: feature.area, featureTitle: feature.title }]
				: [];
		})
	);
	const featured = $derived(
		featuredEntries.find((item) => item.id === selectedId) ?? featuredEntries[0]
	);
	const availableKinds = $derived(
		(['concept', 'reference', 'experiment'] as const).filter((value) =>
			notebook.entries.some((entry) => entry.kind === value)
		)
	);
	const series = $derived(
		area === 'ops'
			? '운영과 배포를 살펴보는 기록'
			: area === 'sec'
				? '연결과 데이터의 보안을 살펴보는 기록'
				: area === 'ai'
					? '모델과 데이터, 학습과 활용을 살펴보는 기록'
					: '구성과 원리를 함께 살펴보는 기록'
	);

	function syncFromUrl() {
		const params = new URL(window.location.href).searchParams;
		const nextArea = params.get('area');
		const nextKind = params.get('kind');
		area = nextArea === 'ops' || nextArea === 'sec' || nextArea === 'ai' ? nextArea : 'all';
		kind =
			nextKind === 'reference' || nextKind === 'concept' || nextKind === 'experiment'
				? nextKind
				: 'all';
		query = params.get('q') ?? '';
	}
	function saveFilters() {
		const url = new URL(window.location.href);
		if (area === 'all') url.searchParams.delete('area');
		else url.searchParams.set('area', area);
		if (kind === 'all') url.searchParams.delete('kind');
		else url.searchParams.set('kind', kind);
		if (query.trim()) url.searchParams.set('q', query);
		else url.searchParams.delete('q');
		// This is the current resolved URL; only its search parameters change.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, page.state);
	}
	function chooseArea(value: typeof area) {
		area = value;
		selectedId = '';
		saveFilters();
	}
	function reset() {
		area = 'all';
		kind = 'all';
		query = '';
		saveFilters();
	}
	onMount(syncFromUrl);
	afterNavigate(syncFromUrl);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<svelte:head>
	<title>{notebook.meta.title}</title>
	<meta name="description" content={notebook.meta.description} />
	<link
		rel="canonical"
		href={`https://wonderful-water-044d9f700.7.azurestaticapps.net/${data.locale}/notebook/`}
	/>
</svelte:head>

<main id="notebook-main" class="notebook-main" tabindex="-1">
	{#if notebook.comingSoon}
		<section class="edition">
			<h1>Systems Notebook<span>.</span></h1>
			<p>The Korean edition is available now. English articles will follow.</p>
			<a class="read-link" href={resolve('/[locale=locale]/notebook', { locale: 'ko' })}
				>한국어 글 읽기 <span aria-hidden="true">↗</span></a
			>
		</section>
	{:else}
		<section class="intro" aria-labelledby="notebook-title">
			<h1 id="notebook-title">Systems Notebook<span>.</span></h1>
			<p>
				인프라를 운영하고 원리를 살펴보고.<br class="mobile-break" /> 그 과정을 남기는 기술 노트.
			</p>
		</section>

		<div class="explore-bar">
			<nav class="area-filters" aria-label="글 분야">
				{#each areas as item (item.id)}
					<button
						type="button"
						class:active={area === item.id}
						aria-pressed={area === item.id}
						onclick={() => chooseArea(item.id)}
					>
						<span>{item.label}</span>
						{#if 'detail' in item}<span class="area-detail">{item.detail}</span>{/if}
						<span class="area-count"
							>{item.id === 'all'
								? notebook.entries.length
								: notebook.entries.filter((entry) => entry.areas.includes(item.id as NotebookArea))
										.length}</span
						>
					</button>
				{/each}
			</nav>
			<div class="search">
				<label for="notebook-search">검색</label>
				<input
					id="notebook-search"
					type="search"
					value={query}
					oninput={(event) => {
						query = event.currentTarget.value;
						saveFilters();
					}}
					placeholder="제목, 기술 이름으로 찾기"
					autocomplete="off"
				/>
			</div>
		</div>

		{#if !query.trim() && kind === 'all' && featured}
			<section class="featured" aria-labelledby="featured-title">
				<div class="feature-heading">
					<h2 id="featured-title">먼저 읽어볼 글</h2>
					<span>{series}</span>
				</div>
				<div class="feature-stage">
					<div class="feature-copy" data-kind={featured.preview}>
						<div class="feature-meta">
							<span class="feature-area">{featured.featureArea.toUpperCase()}</span><span
								>{labels[featured.kind]}</span
							><span>{featured.readingTime}</span>
						</div>
						{#key featured.id}
							<div class="copy-transition">
								<h3><a href={featured.href}>{featured.title}</a></h3>
								<p class="feature-description">{featured.description}</p>
								<p class="feature-author">{featured.authorLabel}</p>
								<a class="read-link" href={featured.href} aria-label={`${featured.title} 읽기`}
									>글 읽기 <span aria-hidden="true">↗</span></a
								>
							</div>
						{/key}
					</div>
					<div class="feature-visual">
						<FlowPreview kind={featured.preview} paused={preferences.motionOff} />
					</div>
				</div>
				<div
					class="feature-choices"
					style={`--choice-count: ${featuredEntries.length}`}
					aria-label="대표 글 미리보기"
				>
					{#each featuredEntries as entry (entry.id)}
						<a
							href={entry.href}
							class:selected={entry.id === featured.id}
							onmouseenter={() => (selectedId = entry.id)}
							onfocus={() => (selectedId = entry.id)}
						>
							<span class="choice-domain">{entry.featureArea.toUpperCase()}</span>
							<span class="choice-title">{entry.featureTitle}</span>
							<span class="choice-arrow" aria-hidden="true">↗</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<section class="archive" aria-labelledby="archive-title">
			<div class="archive-heading">
				<h2 id="archive-title">
					{query.trim() ? '검색 결과' : '전체 기록'} <span>{results.length}</span>
				</h2>
				<div class="kind-filters" role="group" aria-label="글의 성격">
					<button
						type="button"
						class:active={kind === 'all'}
						aria-pressed={kind === 'all'}
						onclick={() => {
							kind = 'all';
							saveFilters();
						}}>모든 글</button
					>
					{#each availableKinds as value (value)}
						<button
							type="button"
							class:active={kind === value}
							aria-pressed={kind === value}
							onclick={() => {
								kind = value;
								saveFilters();
							}}>{labels[value]}</button
						>
					{/each}
				</div>
			</div>
			<p class="results-announcement" role="status" aria-live="polite">
				{results.length}개의 글이 있습니다.
			</p>
			{#if results.length}
				<div class="entry-grid">
					{#each results as entry (entry.id)}
						<article class="entry" data-entry-id={entry.id}>
							<div class="entry-meta">
								<span class="entry-area"
									>{entry.areas.map((value) => value.toUpperCase()).join(' / ')}</span
								>
								<span>{labels[entry.kind]}</span>
								{#if entry.format === 'story'}<span class="format-indicator">인터랙티브</span>{/if}
								<span class="entry-time">{entry.readingTime}</span>
							</div>
							<h3>
								<a href={entry.href}
									>{entry.title}<span class="entry-arrow" aria-hidden="true">↗</span></a
								>
							</h3>
							<p>{entry.description}</p>
							<div class="entry-footer">
								<span>{entry.authorLabel}</span><span>{entry.series}</span>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<h3>
						{kind === 'experiment'
							? '아직 공개한 직접 실험 기록이 없습니다.'
							: '조건에 맞는 글이 없습니다.'}
					</h3>
					<p>다른 기술 이름으로 검색하거나 선택한 분류를 해제해 보세요.</p>
					<button type="button" onclick={reset}
						>전체 글 보기 <span aria-hidden="true">↗</span></button
					>
				</div>
			{/if}
			<p class="provenance-note">
				<span>자료 정리</span> 표시는 외부 자료를 바탕으로 정리한 글입니다. 바탕이 된 자료는 각 글에 표시하며,
				직접 수행한 실험과 구분해 기록합니다.
			</p>
		</section>
	{/if}
</main>

<style>
	.notebook-main {
		max-width: 1440px;
		margin: auto;
		padding: 0 clamp(22px, 5vw, 80px);
		outline: none;
	}
	.intro {
		padding: 68px 0 46px;
	}
	h1 {
		color: var(--nb-text);
		font-family: var(--font-display);
		font-size: clamp(38px, 5.2vw, 74px);
		line-height: 1.1;
		letter-spacing: -0.065em;
		font-weight: 500;
		margin: 0;
	}
	h1 > span {
		color: var(--nb-accent);
	}
	.intro > p {
		margin: 23px 0 0;
		color: var(--nb-muted);
		font-size: clamp(15px, 1.4vw, 18px);
		line-height: 1.7;
		letter-spacing: -0.025em;
	}
	.mobile-break {
		display: none;
	}
	.explore-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 22px;
		border-block: 1px solid var(--nb-line);
		min-height: 66px;
	}
	.area-filters {
		display: flex;
		gap: 28px;
		align-self: stretch;
	}
	.area-filters button {
		display: flex;
		align-items: center;
		gap: 9px;
		position: relative;
		border: 0;
		padding: 0;
		background: transparent;
		color: var(--nb-muted);
		font: 15px var(--font-body);
		cursor: pointer;
	}
	.area-filters button.active {
		color: var(--nb-text);
	}
	.area-filters button::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		width: 100%;
		height: 2px;
		background: var(--nb-accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 240ms ease;
	}
	.area-filters button.active::after {
		transform: scaleX(1);
	}
	.area-detail {
		font-size: 12px;
	}
	.area-count {
		font: 10px var(--font-mono);
		align-self: center;
		margin-left: 0;
		color: var(--nb-muted);
	}
	.active .area-count {
		color: var(--nb-accent);
	}
	.search {
		display: flex;
		align-items: center;
		gap: 13px;
		min-width: 220px;
		max-width: 280px;
		border-bottom: 1px solid transparent;
	}
	.search:focus-within {
		border-color: var(--nb-accent);
	}
	.search label {
		font-size: 12px;
		color: var(--nb-muted);
		white-space: nowrap;
	}
	.search input {
		background: none;
		border: 0;
		min-width: 0;
		width: 100%;
		color: var(--nb-text);
		font: 13px var(--font-body);
		padding: 12px 0;
	}
	.search input:focus-visible {
		outline: 0;
	}
	.search input::placeholder {
		color: var(--nb-muted);
		opacity: 0.9;
	}
	.featured {
		padding-top: 35px;
	}
	.feature-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 15px;
	}
	.feature-heading h2 {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--nb-muted);
	}
	.feature-heading > span {
		font-size: 12px;
		color: var(--nb-muted);
	}
	.feature-stage {
		display: grid;
		grid-template-columns: 0.95fr 1.18fr;
		gap: 46px;
		align-items: center;
		min-height: 386px;
		padding-block: 22px;
	}
	.feature-meta {
		display: flex;
		align-items: center;
		gap: 15px;
		color: var(--nb-muted);
		font-size: 12px;
		margin-bottom: 20px;
	}
	.feature-area {
		color: var(--nb-accent);
		font: 12px var(--font-mono);
	}
	.feature-copy h3 {
		margin: 0;
		max-width: 22ch;
		font-size: clamp(26px, 2.6vw, 36px);
		line-height: 1.35;
		font-weight: 600;
		letter-spacing: -0.045em;
		word-break: keep-all;
	}
	.feature-copy h3 a {
		color: var(--nb-text);
		text-decoration: none;
	}
	.feature-description {
		font-size: 15px;
		line-height: 1.85;
		margin: 20px 0 0;
		color: var(--nb-muted);
		max-width: 48ch;
		word-break: keep-all;
	}
	.feature-author {
		font-size: 12px;
		color: var(--nb-muted);
		margin: 17px 0 25px;
	}
	.read-link {
		display: inline-flex;
		align-items: center;
		gap: 35px;
		font-size: 13px;
		font-weight: 600;
		padding: 10px 0;
		border-bottom: 1px solid var(--nb-accent);
		color: var(--nb-accent);
		text-decoration: none;
	}
	.read-link > span {
		font-size: 20px;
		transition: transform 200ms;
	}
	.read-link:hover > span {
		transform: translate(3px, -3px);
	}
	.feature-visual {
		min-width: 0;
		width: 100%;
	}
	.feature-choices {
		display: grid;
		grid-template-columns: repeat(var(--choice-count, 3), minmax(0, 1fr));
		gap: 1px;
		border-block: 1px solid var(--nb-line);
	}
	.feature-choices a {
		text-decoration: none;
		position: relative;
		display: flex;
		align-items: center;
		gap: 13px;
		min-height: 74px;
		background: none;
		border: 0;
		padding: 16px 23px;
		text-align: left;
		cursor: pointer;
		color: var(--nb-muted);
		transition:
			background 240ms,
			color 240ms;
	}
	.feature-choices a:first-child {
		padding-left: 0;
	}
	.feature-choices a + a {
		border-left: 1px solid var(--nb-line);
	}
	.feature-choices a::before {
		position: absolute;
		content: '';
		top: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--nb-accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 300ms;
	}
	.feature-choices a.selected::before {
		transform: scaleX(1);
	}
	.feature-choices a.selected {
		color: var(--nb-text);
	}
	.feature-choices a:hover {
		background: color-mix(in srgb, var(--nb-text) 3%, transparent);
	}
	.choice-domain {
		font: 10px var(--font-mono);
		color: var(--nb-muted);
	}
	.selected .choice-domain {
		color: var(--nb-accent);
	}
	.choice-title {
		font-size: 13px;
		word-break: keep-all;
	}
	.choice-arrow {
		margin-left: auto;
	}
	.archive {
		padding: 64px 0 70px;
		scroll-margin-top: 30px;
	}
	.archive-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 23px;
	}
	.archive-heading h2 {
		display: flex;
		gap: 12px;
		align-items: baseline;
		margin: 0;
		font-size: 21px;
		font-weight: 500;
		letter-spacing: -0.035em;
	}
	.archive-heading h2 span {
		color: var(--nb-muted);
		font: 12px var(--font-mono);
	}
	.kind-filters {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.kind-filters button {
		border: 1px solid transparent;
		border-radius: 3px;
		padding: 7px 10px;
		background: transparent;
		color: var(--nb-muted);
		font: 12px var(--font-body);
		cursor: pointer;
	}
	.kind-filters .active {
		border-color: var(--nb-line);
		color: var(--nb-text);
		background: var(--nb-panel);
	}
	.results-announcement {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.entry-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
	}
	.entry {
		min-width: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--nb-line);
		border-radius: 4px;
		padding: 26px 28px 23px;
		background: var(--nb-bg);
		transition:
			border-color 220ms,
			background 220ms,
			transform 220ms;
	}
	.entry:hover,
	.entry:focus-within {
		border-color: color-mix(in srgb, var(--nb-accent) 60%, var(--nb-line));
		background: var(--nb-panel);
		transform: translateY(-3px);
	}
	.entry-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 13px;
		align-items: center;
		color: var(--nb-muted);
		font-size: 11px;
	}
	.entry-area {
		font-family: var(--font-mono);
		color: var(--nb-accent);
	}
	.entry-time {
		margin-left: auto;
	}
	.format-indicator {
		color: var(--nb-muted);
	}
	.entry h3 {
		font-size: 20px;
		line-height: 1.5;
		font-weight: 500;
		margin: 18px 0 0;
		letter-spacing: -0.035em;
		word-break: keep-all;
	}
	.entry h3 a {
		color: var(--nb-text);
		text-decoration: none;
		display: flex;
		gap: 17px;
		justify-content: space-between;
		align-items: start;
	}
	.entry-arrow {
		font-size: 18px;
		flex: 0 0 auto;
		color: var(--nb-muted);
		transition:
			transform 220ms,
			color 220ms;
	}
	.entry:hover .entry-arrow {
		color: var(--nb-accent);
		transform: translate(2px, -2px);
	}
	.entry > p {
		color: var(--nb-muted);
		font-size: 13px;
		line-height: 1.85;
		margin: 12px 25px 24px 0;
		word-break: keep-all;
	}
	.entry-footer {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
		gap: 14px;
		color: var(--nb-muted);
		font-size: 11px;
	}
	.provenance-note {
		color: var(--nb-muted);
		font-size: 12px;
		line-height: 1.9;
		max-width: 70ch;
		margin: 30px 0 0;
	}
	.provenance-note span {
		color: var(--nb-text);
	}
	.empty-state {
		padding: 65px 20px;
		border-block: 1px solid var(--nb-line);
		text-align: center;
	}
	.empty-state h3 {
		font-size: 21px;
		font-weight: 500;
	}
	.empty-state p {
		color: var(--nb-muted);
		font-size: 14px;
		margin: 12px 0 25px;
	}
	.empty-state button {
		border: 0;
		background: none;
		color: var(--nb-accent);
		cursor: pointer;
		font: 14px var(--font-body);
	}
	.edition {
		min-height: 65dvh;
		padding: 100px 0;
	}
	.edition p {
		color: var(--nb-muted);
		margin: 28px 0;
	}
	@media (prefers-reduced-motion: no-preference) {
		.copy-transition {
			animation: copy-in 350ms cubic-bezier(0.16, 1, 0.3, 1);
		}
		@keyframes copy-in {
			from {
				opacity: 0.35;
				transform: translateY(8px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
	@media (min-width: 1500px) {
		.feature-stage {
			min-height: 414px;
		}
	}
	@media (max-width: 1050px) {
		.area-detail {
			display: none;
		}
		.area-filters {
			gap: 25px;
		}
		.feature-stage {
			gap: 24px;
			grid-template-columns: 1fr 1.1fr;
		}
		.feature-copy h3 {
			font-size: 28px;
		}
		.feature-choices a {
			padding-inline: 15px;
			gap: 9px;
		}
		.choice-title {
			font-size: 12px;
		}
	}
	@media (max-width: 760px) {
		.intro {
			padding: 43px 0 32px;
		}
		h1 {
			font-size: clamp(32px, 7.5vw, 49px);
			letter-spacing: -0.055em;
		}
		.intro > p {
			font-size: 14px;
			margin-top: 17px;
		}
		.explore-bar {
			flex-wrap: wrap;
			gap: 0;
			padding-top: 3px;
		}
		.area-filters {
			width: 100%;
			height: 53px;
			gap: 28px;
		}
		.area-detail {
			display: none;
		}
		.search {
			width: 100%;
			max-width: none;
			border-top: 1px solid var(--nb-line);
			padding-block: 3px;
		}
		.featured {
			padding-top: 25px;
		}
		.feature-heading > span {
			display: none;
		}
		.feature-stage {
			grid-template-columns: 1fr;
			gap: 3px;
			padding-block: 25px 17px;
			min-height: auto;
		}
		.feature-copy h3 {
			font-size: 26px;
			max-width: 100%;
		}
		.feature-meta {
			margin-bottom: 14px;
		}
		.feature-description {
			font-size: 14px;
			margin-top: 15px;
			max-width: none;
		}
		.feature-author {
			margin: 12px 0 15px;
		}
		.feature-visual {
			max-width: 550px;
			margin: auto;
		}
		.feature-choices {
			grid-template-columns: 1fr;
		}
		.feature-choices a {
			min-height: 55px;
			padding: 12px 0;
		}
		.feature-choices a + a {
			border-left: 0;
			border-top: 1px solid var(--nb-line);
		}
		.choice-title {
			font-size: 13px;
		}
		.archive {
			padding: 43px 0 45px;
		}
		.archive-heading {
			align-items: start;
			flex-wrap: wrap;
		}
		.archive-heading h2 {
			font-size: 20px;
		}
		.entry-grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.entry {
			padding: 23px 22px;
		}
		.entry h3 {
			font-size: 19px;
		}
		.entry > p {
			margin-right: 0;
		}
		.kind-filters {
			gap: 0;
		}
		.kind-filters button {
			padding: 6px 8px;
		}
		.provenance-note {
			font-size: 11px;
		}
	}
	@media (max-width: 400px) {
		.mobile-break {
			display: initial;
		}
		.area-filters {
			gap: 20px;
		}
		.area-detail {
			display: none;
		}
		.feature-copy h3 {
			font-size: 24px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.entry,
		.entry-arrow,
		.read-link > span,
		.area-filters button::after,
		.feature-choices a,
		.feature-choices a::before {
			transition: none;
		}
		.entry:hover,
		.entry:focus-within {
			transform: none;
		}
	}
</style>
