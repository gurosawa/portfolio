<script lang="ts">
	import { resolve } from '$app/paths';

	// A static refresh keeps the AI filter without asking the prerenderer to emit a query URL.
	// AI articles are currently available in Korean, as with the existing Ops series.
	const notebookHref = `${resolve('/[locale=locale]/notebook', { locale: 'ko' })}/?area=ai`;
</script>

<svelte:head>
	<title>AI / Systems Notebook</title>
	<meta http-equiv="refresh" content={`0;url=${notebookHref}`} />
</svelte:head>

<main>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a href={notebookHref}>Systems Notebook · AI →</a>
</main>
