<script lang="ts">
	import { StoryPage } from '$lib/notebook/story';
	import Tls13Page from '$lib/notebook/tls/Tls13Page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.story.meta.slug === 'tls13'}
	<Tls13Page story={data.story} />
{:else}
	<StoryPage story={data.story} />
{/if}
