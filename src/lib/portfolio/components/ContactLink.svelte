<script lang="ts">
	import type { ContactLink } from '$lib/portfolio/content';

	type Props = {
		link: ContactLink;
	};

	let { link }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if link.disabled || !link.href}
	<span
		class="inline-block border border-line/50 text-ink-soft/40 px-6 py-3 rounded text-sm font-mono uppercase tracking-widest cursor-not-allowed"
		aria-disabled="true"
	>
		{link.label} placeholder
	</span>
{:else}
	<a
		class="inline-block border border-line text-ink-strong px-6 py-3 rounded text-sm font-mono uppercase tracking-widest hover:text-accent hover:border-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
		href={link.href}
		target={link.href.startsWith('http') ? '_blank' : undefined}
		rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
	>
		{link.label}
	</a>
{/if}
