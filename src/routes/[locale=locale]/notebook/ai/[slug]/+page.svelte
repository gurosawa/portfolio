<script lang="ts">
	import AiArticle from '$lib/notebook/ai/AiArticle.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

{#key data.article.slug}<AiArticle article={data.article} />{/key}
