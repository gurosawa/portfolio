<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import CustomCursor from '$lib/portfolio/components/CustomCursor.svelte';

	let { children } = $props();
	const isStoryRoute = $derived(page.url.pathname.includes('/notebook/zktls/'));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !isStoryRoute}<CustomCursor />{/if}
{@render children()}
