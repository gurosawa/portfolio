<script lang="ts">
	/* eslint-disable svelte/no-at-html-tags, svelte/no-navigation-without-resolve */
	import { getContext, onMount } from 'svelte';
	import FlowPreview from '../components/FlowPreview.svelte';
	import { notebookPreferenceContext, type NotebookPreferences } from '../notebook-ui';
	import type { AiArticle } from './articles.server';
	import { aiArticles, aiArticlePath } from './catalog';
	import ArticleExample from './ArticleExample.svelte';
	import './reader.css';
	let { article }: { article: AiArticle } = $props();
	const preferences = getContext<NotebookPreferences>(notebookPreferenceContext);
	let root: HTMLElement;
	let active = $state('');
	let tocOpen = $state(false);
	const canonical = $derived(
		`https://wonderful-water-044d9f700.7.azurestaticapps.net${aiArticlePath(article.slug)}`
	);
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((entry) => entry.isIntersecting);
				if (visible.length) active = visible[0].target.id;
			},
			{ rootMargin: '-40px 0px -65% 0px' }
		);
		root.querySelectorAll('section[id]').forEach((section) => observer.observe(section));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>{article.title} / Systems Notebook</title>
	<meta name="description" content={article.description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={article.description} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content="ko_KR" />
	<meta property="article:author" content="홍범" />
	<meta property="article:published_time" content={article.reviewedAt} />
</svelte:head>

<main
	id="notebook-main"
	class="ai-reader"
	data-ai-article={article.slug}
	lang="ko"
	bind:this={root}
>
	<header class="ai-title-block">
		<a class="ai-back" href="/ko/notebook/?area=ai">← Systems Notebook <span>/ AI</span></a>
		<div class="ai-eyebrow">
			<span>{article.label}</span><span>{String(article.order).padStart(2, '0')} / 03</span>
		</div>
		<h1>{article.title}</h1>
		<p class="ai-deck">{article.description}</p>
		<div class="ai-meta">
			<span>홍범</span><span>연구 기반 해설</span><span>약 {article.readingMinutes}분</span><time
				datetime={article.reviewedAt}>{article.reviewedAt}</time
			>
		</div>
		<div class="ai-topic-links">
			{#each article.areas as area (area)}<a href={`/ko/notebook/?area=${area}`}
					>{area.toUpperCase()}</a
				>{/each}
		</div>
	</header>
	<div class="ai-layout">
		<aside class="ai-toc" class:open={tocOpen} aria-label="이 글의 목차">
			<button
				class="ai-toc-toggle"
				aria-expanded={tocOpen}
				aria-controls="ai-toc-links"
				onclick={() => (tocOpen = !tocOpen)}>이 글의 흐름 <span>{tocOpen ? '−' : '+'}</span></button
			>
			<p class="ai-toc-label">이 글의 흐름</p>
			<nav id="ai-toc-links">
				{#each article.sections as section, index (section.id)}<a
						href={`#${section.id}`}
						aria-current={active === section.id ? 'location' : undefined}
						onclick={() => (tocOpen = false)}
						><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a
					>{/each}
			</nav>
			<a class="ai-toc-top" href="#notebook-main">처음으로 ↑</a>
		</aside>
		<article class="ai-body">
			<div class="ai-prose ai-opening">{@html article.intro}</div>
			{#each article.sections as section, index (section.id)}
				<section id={section.id} aria-labelledby={`${section.id}-title`}>
					<div class="ai-section-index" aria-hidden="true">
						{String(index + 1).padStart(2, '0')}
					</div>
					<h2 id={`${section.id}-title`}><a href={`#${section.id}`}>{section.title}</a></h2>
					<div class="ai-prose">{@html section.html}</div>
					{#if section.diagram}
						<FlowPreview kind={section.diagram} paused={preferences.motionOff} />
					{/if}
					{#if section.widget}<ArticleExample kind={section.widget} />{/if}
				</section>
			{/each}
			<footer class="ai-endnote">
				<span>자료와 예제</span>
				<p>
					<a
						href="https://astg.vercel.app/education/#/260903-choi-yejin"
						target="_blank"
						rel="noopener noreferrer">교육 자료 페이지</a
					>와 본문에 연결한 논문을 바탕으로 작성했습니다. 계산과 사례의 가정은 본문에 표시했습니다.
					연구 결과와 직접 실행한 검증의 범위를 구분해 읽어주세요.
				</p>
			</footer>
		</article>
	</div>
	<nav class="ai-series" aria-label="AI 원고 함께 읽기">
		<div>
			<span>AI / Systems Notebook</span>
			<h2>같은 문제를 다른 단계에서</h2>
		</div>
		{#each aiArticles as related (related.slug)}<a
				class:current={related.slug === article.slug}
				href={aiArticlePath(related.slug)}
				aria-current={related.slug === article.slug ? 'page' : undefined}
				><span>0{related.order} / {related.label}</span><strong>{related.title}</strong><b
					aria-hidden="true">{related.slug === article.slug ? '읽는 중' : '↗'}</b
				></a
			>{/each}
	</nav>
</main>
