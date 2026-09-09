<script lang="ts">
	import OpsArticle from '$lib/notebook/ops/OpsArticle.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<OpsArticle article={data.article} />
