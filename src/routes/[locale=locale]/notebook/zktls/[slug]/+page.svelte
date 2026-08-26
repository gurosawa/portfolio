<script lang="ts">
	import { StoryPage } from '$lib/notebook/story';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<StoryPage story={data.story} />
