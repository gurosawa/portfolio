<script lang="ts">
	import type { TimelineEntry } from '$lib/portfolio/content';

	type Props = {
		entry: TimelineEntry;
	};

	let { entry }: Props = $props();
</script>

<article
	data-hover="true"
	class="flex flex-col md:grid md:grid-cols-[1fr_3fr] gap-4 md:gap-8 pt-6 border-t border-line/50 hover:border-[#FF5500] transition-colors duration-300 group"
>
	<p class="font-mono text-sm tracking-widest text-ink-soft uppercase">{entry.period}</p>
	<div class="flex flex-col gap-2">
		<h3 class="text-xl font-bold font-display text-ink-strong">{entry.title}</h3>
		<p class="font-mono text-xs text-accent uppercase tracking-widest mb-2">{entry.context}</p>
		<p class="text-ink-soft leading-relaxed break-keep">{entry.description}</p>
	</div>
</article>
