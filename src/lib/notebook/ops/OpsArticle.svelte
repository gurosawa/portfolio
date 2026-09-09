<script lang="ts">
	/* eslint-disable svelte/no-at-html-tags, svelte/no-navigation-without-resolve */
	import { onMount, tick } from 'svelte';
	import { opsArticlePath, opsProvenance } from './catalog';
	import type { OpsArticle } from './articles.server';
	import ArticleDiagram from './ArticleDiagram.svelte';
	import './reader.css';

	let { article }: { article: OpsArticle } = $props();
	let articleRoot: HTMLElement;
	let mounted = $state(false);
	let activeHeading = $state('');
	let tocOpen = $state(false);
	const canonical = $derived(
		`https://wonderful-water-044d9f700.7.azurestaticapps.net${opsArticlePath(article.slug)}`
	);

	onMount(() => {
		mounted = true;
	});

	$effect(() => {
		const slug = article.slug;
		if (!mounted || !articleRoot) return;
		activeHeading = '';
		tocOpen = false;
		let observer: IntersectionObserver | undefined;
		let disposed = false;
		let copyReset: ReturnType<typeof setTimeout> | undefined;
		const root = articleRoot;
		const copyCode = async (event: MouseEvent) => {
			const target =
				event.target instanceof Element
					? event.target.closest<HTMLButtonElement>('[data-copy-code]')
					: null;
			if (!target) return;
			const code = target.closest('.ops-code')?.querySelector('code')?.textContent;
			if (!code) return;
			try {
				await navigator.clipboard.writeText(code);
				target.textContent = '복사됨';
			} catch {
				target.textContent = '직접 선택해 복사';
			}
			clearTimeout(copyReset);
			copyReset = setTimeout(() => {
				target.textContent = '복사';
			}, 2000);
		};
		void tick().then(() => {
			if (disposed || article.slug !== slug) return;
			root.addEventListener('click', copyCode);
			observer = new IntersectionObserver(
				(entries) => {
					const visible = entries.filter((entry) => entry.isIntersecting);
					if (visible.length) activeHeading = visible[0].target.id;
				},
				{ rootMargin: '-100px 0px -60% 0px' }
			);
			root.querySelectorAll('h2, h3').forEach((heading) => observer!.observe(heading));
		});
		return () => {
			disposed = true;
			observer?.disconnect();
			root.removeEventListener('click', copyCode);
			clearTimeout(copyReset);
		};
	});
</script>

<svelte:head>
	<title>{article.title} — Systems Notebook</title>
	<meta name="description" content={article.description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={article.description} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content="ko_KR" />
</svelte:head>

<main id="notebook-main" class="ops-reader" lang="ko">
	<header class="ops-article-header">
		<a class="ops-back" href="/ko/notebook/?area=ops">← Systems Notebook <span>/ Ops</span></a>
		<div class="ops-article-kicker">
			<span>MLOps Notes</span><span>{String(article.order).padStart(2, '0')} / 15</span>
		</div>
		<h1>{article.title}</h1>
		<p class="ops-article-description">{article.description}</p>
		<div class="ops-article-meta">
			<span>{opsProvenance.label}</span><span>약 {article.readingMinutes}분</span><time
				datetime={article.updated}>{article.updated} 기준</time
			>
		</div>
		<div class="ops-provenance">
			<span>이 글의 배경</span>
			<p>{opsProvenance.description} 본문의 환경과 버전은 글 작성 당시를 기준으로 합니다.</p>
		</div>
		<div class="ops-article-tags">
			{#each article.tags as tag (tag)}<a href={`/ko/notebook/?q=${encodeURIComponent(tag)}`}
					>{tag}</a
				>{/each}
		</div>
	</header>

	<div class="ops-reading-layout">
		<aside class="ops-toc" class:ops-toc-open={tocOpen}>
			<button
				class="ops-toc-toggle"
				aria-expanded={tocOpen}
				aria-controls="ops-toc-links"
				onclick={() => (tocOpen = !tocOpen)}>이 글의 순서 <span>{tocOpen ? '−' : '+'}</span></button
			>
			<nav id="ops-toc-links" aria-label="글 목차">
				<p class="ops-toc-label">이 글의 순서</p>
				{#each article.headings as heading (heading.id)}
					<a
						href={`#${heading.id}`}
						class:ops-toc-active={activeHeading === heading.id}
						class:ops-toc-sub={heading.level === 3}
						aria-current={activeHeading === heading.id ? 'location' : undefined}
						onclick={() => (tocOpen = false)}>{heading.text}</a
					>
				{/each}
			</nav>
		</aside>
		<article class="ops-prose" bind:this={articleRoot} aria-label={article.title}>
			{#each article.blocks as block (block.id)}
				{#if block.kind === 'html'}
					{@html block.html}
				{:else}
					<ArticleDiagram diagram={block.diagram} number={block.number} />
				{/if}
			{/each}
			<footer class="ops-article-footer">
				<p class="ops-footer-label">이어서 읽기</p>
				<div class="ops-next-articles">
					{#if article.previous}<a href={opsArticlePath(article.previous.slug)}
							><span>← 이전 글</span><strong>{article.previous.title}</strong></a
						>{/if}
					{#if article.next}<a href={opsArticlePath(article.next.slug)}
							><span>다음 글 →</span><strong>{article.next.title}</strong></a
						>{/if}
				</div>
				<a class="ops-return" href="/ko/notebook/?area=ops">Ops 기록 전체 보기 ↗</a>
			</footer>
		</article>
	</div>
</main>
