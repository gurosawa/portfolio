<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Locale, WorkItem } from '$lib/portfolio/content';
	import DualText from './DualText.svelte';

	type Props = {
		works: WorkItem[];
		locale: Locale;
	};

	let { works, locale }: Props = $props();

	function hrefFor(work: WorkItem) {
		return (
			work.externalUrl ??
			resolve('/[locale=locale]/work/[slug]', {
				locale,
				slug: work.slug
			})
		);
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="flex flex-col w-full border-t border-line/20 mt-10 group/gallery">
	{#each works as work, index (work.slug)}
		<a
			href={hrefFor(work)}
			target={work.externalUrl ? '_blank' : '_self'}
			rel={work.externalUrl ? 'noreferrer' : ''}
			class="group relative block border-b border-[#1DB954]/40 hover:border-[#FF5500] py-10 md:py-16 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-500 hover:bg-surface-raised/10"
			class:cursor-default={!work.externalUrl}
			aria-labelledby={`work-title-${work.slug}`}
		>
			<!-- Spotlight Background on Hover -->
			<div
				class="absolute right-[10%] top-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF5500]/15 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"
			></div>

			<div
				class="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 px-4 md:px-8"
			>
				<!-- Number & Status -->
				<div
					class="flex md:flex-col gap-4 md:gap-2 text-xs font-mono text-[#1DB954] md:opacity-50 group-hover:opacity-100 group-hover:text-[#FF5500] transition-all duration-500"
				>
					<span>{String(index + 1).padStart(2, '0')}</span>
					<span class="uppercase tracking-widest">{work.status}</span>
				</div>

				<!-- Massive Title -->
				<div class="flex-1 overflow-hidden relative z-20">
					<h3
						id={`work-title-${work.slug}`}
						class="text-4xl sm:text-5xl md:text-[4rem] lg:text-[5.5rem] font-black uppercase leading-[0.85] tracking-tighter transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
							text-white
							group-hover:text-[#FF5500] group-focus-visible:text-[#FF5500]
							whitespace-nowrap truncate"
					>
						{work.title}
					</h3>
				</div>
			</div>

			<!-- Hover Reveal Content (Desktop: hides until hover, Mobile: always shows softly) -->
			<div
				class="mt-8 md:mt-12 px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 relative z-10"
			>
				<div class="md:col-start-4 md:col-span-8 lg:col-start-5 lg:col-span-7">
					<DualText
						id={`work-${work.slug}`}
						surface={work.surface}
						inner={work.inner}
						class="text-base md:text-lg text-ink-soft break-keep"
					/>

					<div class="flex flex-wrap gap-2 mt-6" aria-label={`${work.title} tags`}>
						{#each work.tags as tag (tag)}
							<span
								class="px-2 py-1 bg-surface text-ink-soft text-[0.7rem] font-mono uppercase tracking-widest rounded border border-line/50"
							>
								{tag}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Background Hover Overlay (Creates a subtle highlight band) -->
			<div
				class="absolute inset-0 bg-gradient-to-r from-transparent via-surface-raised/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0 transform -translate-x-full group-hover:translate-x-0"
			></div>
		</a>
	{/each}
</div>

<style>
	/* Make hovered text scale up slightly for extra dynamic feel, just like Minh Pham */
	a:hover h3 {
		transform: scale(1.02);
		transform-origin: left bottom;
	}
	@media (max-width: 768px) {
		a:hover h3 {
			transform: none;
		}
	}
</style>
