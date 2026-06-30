<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import CustomCursor from '$lib/portfolio/components/CustomCursor.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<CustomCursor />
{@render children()}
