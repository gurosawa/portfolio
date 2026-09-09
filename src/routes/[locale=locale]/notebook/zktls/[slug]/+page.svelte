<script lang="ts">
	import Tls13Page from '$lib/notebook/tls/Tls13Page.svelte';
	import SecurityStoryPage from '$lib/notebook/editorial/SecurityStoryPage.svelte';
	import { balanceEditorial } from '$lib/notebook/editorial/balance-editorial';
	import { notaryEditorial } from '$lib/notebook/editorial/notary-editorial';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

{#if data.story.meta.slug === 'tls13'}
	<Tls13Page story={data.story} />
{:else}
	{#key data.story.meta.slug}
		<SecurityStoryPage
			story={data.story}
			definition={data.story.meta.slug === 'balance-claim' ? balanceEditorial : notaryEditorial}
		/>
	{/key}
{/if}
