<script lang="ts">
	import type { DualCopy } from '$lib/portfolio/content';
	import DualText from './DualText.svelte';

	type Props = {
		lesson: DualCopy;
		index: number;
	};

	let { lesson, index }: Props = $props();
</script>

<article data-hover="true" class="flex gap-4 md:gap-8 group">
	<span class="font-mono text-sm text-ink-soft/40 tracking-widest mt-1">
		{String(index + 1).padStart(2, '0')}
	</span>
	<DualText
		id={`lesson-${index}`}
		surface={lesson.surface}
		inner={lesson.inner}
		class="text-2xl md:text-4xl lg:text-[3.5rem] font-display font-medium text-ink-strong break-keep leading-[1.1] tracking-tight"
	/>
</article>
