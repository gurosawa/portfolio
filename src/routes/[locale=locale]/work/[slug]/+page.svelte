<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const locale = $derived(data.locale);
	const work = $derived(data.work);
	const content = $derived(data.content);
	const homeHref = $derived(resolve('/[locale=locale]', { locale }));
	const workListHref = $derived(`${homeHref}#work`);
	const currentHref = $derived(
		resolve('/[locale=locale]/work/[slug]', { locale, slug: work.slug })
	);
	const alternateHref = $derived(
		resolve('/[locale=locale]/work/[slug]', {
			locale: content.alternateLocale,
			slug: work.slug
		})
	);
	const backLabel = $derived(locale === 'ko' ? '홈으로 돌아가기' : 'Back to homepage');
	const placeholder = $derived(
		locale === 'ko'
			? '이 작업 페이지는 로컬 MVP용 placeholder입니다. 상세 케이스 스터디는 이후 범위에서 작성합니다.'
			: 'This work page is a local MVP placeholder. The full case study belongs in a later scope.'
	);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
	<title>{work.title} / {content.meta.title}</title>
	<meta name="description" content={work.surface} />
</svelte:head>

<div class="site-shell work-page" lang={locale}>
	<header class="site-header">
		<a class="brand-link" href={homeHref}>{content.header.name}</a>

		<div class="locale-switch" aria-label={content.header.languageLabel}>
			<a
				href={locale === 'ko' ? currentHref : alternateHref}
				aria-current={locale === 'ko' ? 'page' : undefined}>KO</a
			>
			<span>/</span>
			<a
				href={locale === 'en' ? currentHref : alternateHref}
				aria-current={locale === 'en' ? 'page' : undefined}>EN</a
			>
		</div>
	</header>

	<main class="work-placeholder">
		<p class="work-placeholder__status">{work.status}</p>
		<h1>{work.title}</h1>
		<p class="work-placeholder__surface">{work.surface}</p>
		<p>{work.inner}</p>

		<div class="tag-list">
			{#each work.tags as tag (tag)}
				<span>{tag}</span>
			{/each}
		</div>

		<p class="placeholder-note">{placeholder}</p>

		<div class="work-placeholder__actions">
			<a class="primary-link" href={workListHref}>{backLabel}</a>
			{#if work.externalUrl}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="text-link" href={work.externalUrl} target="_blank" rel="noreferrer">{work.cta}</a>
			{/if}
		</div>
	</main>
</div>
