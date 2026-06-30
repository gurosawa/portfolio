<script lang="ts">
	import { resolve } from '$app/paths';

	const defaultLocalePath = resolve('/ko/');
</script>

<svelte:head>
	<title>HONGBEOM JOO / Portfolio</title>
	<meta http-equiv="refresh" content={`0;url=${defaultLocalePath}`} />
	<link rel="canonical" href={defaultLocalePath} />
</svelte:head>

<main class="root-redirect" aria-labelledby="root-title">
	<h1 id="root-title">HONGBEOM JOO / Portfolio</h1>
	<a class="primary-link" href={defaultLocalePath}>Enter portfolio</a>
</main>
