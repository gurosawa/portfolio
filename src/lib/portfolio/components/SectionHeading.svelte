<script lang="ts">
	type Props = {
		id: string;
		title: string;
		description?: string;
	};

	let { id, title, description }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	<h2 {id} class="text-sm font-mono font-bold tracking-widest uppercase text-ink-strong">
		{title}
	</h2>
	{#if description}
		<p class="text-sm text-ink-soft">{description}</p>
	{/if}
</div>
