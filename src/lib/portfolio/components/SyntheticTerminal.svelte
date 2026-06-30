<script lang="ts">
	import { onMount } from 'svelte';
	import type { TerminalRow } from '$lib/portfolio/content';

	type Props = {
		label: string;
		rows: TerminalRow[];
	};

	let { label, rows }: Props = $props();

	let containerNode: HTMLElement;
	let status: 'idle' | 'typing' | 'complete' = $state('idle');
	let visibleRows: number = $state(0);
	let currentCommandText: string = $state('');
	let currentOutputText: string = $state('');
	let showOutput: boolean = $state(false);

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && status === 'idle') {
					startTyping();
					observer.disconnect();
				}
			},
			{ threshold: 0.2 }
		);

		if (containerNode) observer.observe(containerNode);

		return () => observer.disconnect();
	});

	async function startTyping() {
		status = 'typing';
		for (let i = 0; i < rows.length; i++) {
			visibleRows = i;
			const row = rows[i];

			currentCommandText = '';
			currentOutputText = '';
			showOutput = false;

			for (let char of row.command) {
				currentCommandText += char;
				await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
			}

			await new Promise((r) => setTimeout(r, 200));
			showOutput = true;

			for (let char of row.output) {
				currentOutputText += char;
				// Output can be typed slightly faster than the command
				await new Promise((r) => setTimeout(r, 10 + Math.random() * 20));
			}

			await new Promise((r) => setTimeout(r, 500));
		}
		status = 'complete';
		visibleRows = rows.length;
	}
</script>

<section
	bind:this={containerNode}
	class="w-full max-w-2xl font-mono text-sm border border-line rounded bg-surface-raised overflow-hidden shadow-sm"
	aria-label={label}
>
	<div
		class="flex items-center px-4 py-2 border-b border-line/50 bg-surface text-ink-soft text-[0.7rem] uppercase tracking-widest"
	>
		{label}
	</div>

	<div
		class="p-5 sm:p-6 flex flex-col gap-5 text-ink"
		aria-live={status === 'typing' ? 'polite' : 'off'}
	>
		<div class="sr-only">
			{#each rows as row (`reader-${row.command}-${row.output}`)}
				<p>{row.command}</p>
				<p>{row.output}</p>
			{/each}
		</div>

		<div aria-hidden="true" class="flex flex-col gap-5">
			{#each rows as row, i (`terminal-${row.command}-${row.output}`)}
				{#if status === 'complete' || i < visibleRows}
					<div class="flex flex-col gap-1.5">
						<span class="text-ink-soft">{row.command}</span>
						<span class="text-ink-strong">{row.output}</span>
					</div>
				{:else if status === 'typing' && i === visibleRows}
					<div class="flex flex-col gap-1.5">
						<span class="text-ink-soft">{currentCommandText}{!showOutput ? '█' : ''}</span>
						{#if showOutput}
							<span class="text-ink-strong"
								>{currentOutputText}{currentOutputText.length < row.output.length ? '█' : ''}</span
							>
						{/if}
					</div>
				{/if}
			{/each}

			{#if status === 'complete'}
				<div class="flex items-center mt-2">
					<span class="text-ink-soft opacity-50">█</span>
				</div>
			{/if}
		</div>
	</div>
</section>
