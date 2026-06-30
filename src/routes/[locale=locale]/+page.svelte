<script lang="ts">
	import { resolve } from '$app/paths';
	import SyntheticTerminal from '$lib/portfolio/components/SyntheticTerminal.svelte';
	import TimelineItem from '$lib/portfolio/components/TimelineItem.svelte';
	import HardLesson from '$lib/portfolio/components/HardLesson.svelte';
	import SectionHeading from '$lib/portfolio/components/SectionHeading.svelte';
	import WorkGallery from '$lib/portfolio/components/WorkGallery.svelte';
	import ContactLink from '$lib/portfolio/components/ContactLink.svelte';
	import DualText from '$lib/portfolio/components/DualText.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const content = $derived(data.content);
	const locale = $derived(data.locale);
	const homeHref = $derived(resolve('/[locale=locale]', { locale }));
	const workHref = $derived(`${homeHref}#work`);

	function localeHref(nextLocale: 'ko' | 'en') {
		return resolve('/[locale=locale]', { locale: nextLocale });
	}

	function sectionHref(anchor: string) {
		return `${homeHref}${anchor}`;
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:head>
	<title>{content.meta.title}</title>
	<meta name="description" content={content.meta.description} />
</svelte:head>

<div
	class="min-h-dvh w-full px-6 pb-24 md:px-12 lg:px-24 bg-surface text-ink font-body"
	lang={locale}
>
	<a
		class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-surface focus:text-accent focus:border focus:border-accent"
		href="#main">Skip to content</a
	>

	<header
		data-no-hover="true"
		class="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-6 md:px-12 lg:px-24 bg-surface/90 backdrop-blur-sm border-b border-line/20 hover:border-[#FF5500] transition-colors duration-500"
	>
		<a
			class="font-display font-bold text-ink-strong tracking-wide hover:text-accent transition-colors"
			href={homeHref}>{content.header.name}</a
		>

		<nav
			class="hidden md:flex items-center gap-6 text-xs font-mono tracking-widest uppercase text-ink-soft"
			aria-label="Primary"
		>
			{#each content.header.nav as item (item.href)}
				<a class="hover:text-ink-strong transition-colors" href={sectionHref(item.href)}
					>{item.label}</a
				>
			{/each}
		</nav>

		<div
			class="flex items-center gap-2 text-xs font-mono tracking-widest text-ink-soft"
			aria-label={content.header.languageLabel}
		>
			<a
				class="hover:text-ink-strong transition-colors"
				href={localeHref('ko')}
				aria-current={locale === 'ko' ? 'page' : undefined}
				class:text-ink-strong={locale === 'ko'}
				class:font-bold={locale === 'ko'}>KO</a
			>
			<span class="opacity-30">/</span>
			<a
				class="hover:text-ink-strong transition-colors"
				href={localeHref('en')}
				aria-current={locale === 'en' ? 'page' : undefined}
				class:text-ink-strong={locale === 'en'}
				class:font-bold={locale === 'en'}>EN</a
			>
		</div>
	</header>

	<main id="main" class="pt-32 md:pt-48 max-w-5xl mx-auto flex flex-col gap-32">
		<!-- HERO -->
		<section class="flex flex-col gap-6" aria-labelledby="hero-title">
			<div class="flex flex-col gap-8">
				<p class="font-mono text-xs uppercase tracking-widest text-ink-soft/60">
					{content.hero.kicker}
				</p>
				<h1
					id="hero-title"
					class="font-display text-4xl md:text-6xl lg:text-7xl font-black text-ink-strong tracking-tight leading-[1.1]"
				>
					{content.hero.title}
				</h1>
				<DualText
					id="hero-statement"
					surface={content.hero.surface}
					inner={content.hero.inner}
					class="text-3xl md:text-5xl lg:text-[4.5rem] font-display font-medium text-ink-strong leading-[1.1] tracking-tight break-keep max-w-[95vw]"
				/>
				<div class="mt-4">
					<a
						class="inline-block border border-line px-6 py-3 rounded text-sm font-mono uppercase tracking-widest text-ink-strong hover:border-[#FF5500] hover:text-[#FF5500] transition-colors duration-300"
						href={workHref}>View work</a
					>
				</div>
			</div>
		</section>

		<!-- TERMINAL -->
		<div class="w-full flex justify-start">
			<SyntheticTerminal label={content.terminal.label} rows={content.terminal.rows} />
		</div>

		<!-- ABOUT -->
		<section class="flex flex-col gap-8" id="about" aria-labelledby="about-title">
			<SectionHeading id="about-title" title={content.about.title} />
			<DualText
				id="about-copy"
				surface={content.about.surface}
				inner={content.about.inner}
				class="text-3xl md:text-5xl lg:text-[4.5rem] font-display font-medium text-ink-strong leading-[1.1] tracking-tight break-keep max-w-[95vw]"
			/>
		</section>

		<!-- WORK -->
		<section class="flex flex-col gap-16" id="work" aria-labelledby="work-title">
			<h2 id="work-title" class="sr-only">Work</h2>
			<WorkGallery works={content.works} locale={data.locale} />
		</section>

		<!-- HISTORY -->
		<section class="flex flex-col gap-12" id="history" aria-labelledby="history-title">
			<SectionHeading
				id="history-title"
				title={content.history.title}
				description={content.history.description}
			/>

			<div class="flex flex-col gap-8">
				{#each content.history.entries as entry (entry.period)}
					<TimelineItem {entry} />
				{/each}
			</div>
		</section>

		<!-- LESSONS -->
		<section class="flex flex-col gap-12" id="notes" aria-labelledby="notes-title">
			<SectionHeading id="notes-title" title={content.lessons.title} />

			<div class="flex flex-col gap-8">
				{#each content.lessons.items as lesson, index (lesson.surface)}
					<HardLesson {lesson} {index} />
				{/each}
			</div>
		</section>

		<!-- MOTTO -->
		<section
			data-hover="true"
			class="flex flex-col gap-6 py-24 border-y border-line/50 hover:border-[#FF5500] transition-colors duration-500"
			aria-labelledby="motto-title"
		>
			<h2 id="motto-title" class="sr-only">{content.motto.title}</h2>
			<DualText
				id="motto-copy"
				surface={content.motto.surface}
				inner={content.motto.inner}
				class="text-4xl md:text-6xl lg:text-[5.5rem] font-display font-bold text-center text-ink-strong leading-[1.1] tracking-tight break-keep"
			/>
		</section>

		<!-- CONTACT -->
		<section class="flex flex-col gap-8" id="contact" aria-labelledby="contact-title">
			<SectionHeading id="contact-title" title={content.contact.title} />
			<DualText
				id="contact-copy"
				surface={content.contact.surface}
				inner={content.contact.inner}
				class="text-3xl md:text-5xl lg:text-[4.5rem] font-display font-medium text-ink-strong leading-[1.1] tracking-tight break-keep max-w-[95vw]"
			/>

			<div data-no-hover="true" class="flex flex-col md:flex-row gap-4 mt-8">
				{#each content.contact.links as link (link.label)}
					<ContactLink {link} />
				{/each}
			</div>
		</section>
	</main>
</div>
