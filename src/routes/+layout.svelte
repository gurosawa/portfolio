<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import CustomCursor from '$lib/portfolio/components/CustomCursor.svelte';

	let { children } = $props();
	const isNotebookRoute = $derived(page.url.pathname.includes('/notebook'));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !isNotebookRoute}<CustomCursor />{/if}
{@render children()}
