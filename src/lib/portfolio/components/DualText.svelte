<script lang="ts">
	type Props = {
		id: string;
		surface: string;
		inner: string;
		class?: string;
	};

	let { id, surface, inner, class: className = '' }: Props = $props();

	let locked = $state(false);
	let preview = $state(false);
	let focused = $state(false);
	const expanded = $derived(locked || preview || focused);
	const innerId = $derived(`${id}-inner`);

	function toggle() {
		locked = !locked;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}
</script>

<!-- eslint-disable svelte/no-at-html-tags -->

<button
	type="button"
	class={`group relative block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-colors ${expanded ? 'text-accent' : 'text-current'} ${className}`}
	aria-expanded={expanded}
	aria-controls={innerId}
	onmouseenter={() => (preview = true)}
	onmouseleave={() => (preview = false)}
	onfocus={() => (focused = true)}
	onblur={() => (focused = false)}
	onclick={toggle}
	onkeydown={handleKeydown}
>
	<span
		class="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
		style="grid-template-rows: {expanded ? '0fr 1fr' : '1fr 0fr'};"
	>
		<span class="overflow-hidden">
			<span
				class="block min-h-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[opacity,transform,filter]"
				class:opacity-0={expanded}
				class:-translate-y-2={expanded}
				class:blur-sm={expanded}
				class:pointer-events-none={expanded}
				aria-hidden={expanded}
			>
				{#each surface.split('\n') as line, i (`surface-${id}-${i}-${line}`)}
					{#if i > 0}<br />{/if}{@html line}
				{/each}
			</span>
		</span>
		<span class="overflow-hidden">
			<span
				id={innerId}
				class="block min-h-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[opacity,transform,filter]"
				class:opacity-0={!expanded}
				class:translate-y-2={!expanded}
				class:blur-sm={!expanded}
				class:pointer-events-none={!expanded}
				aria-hidden={!expanded}
			>
				{#each inner.split('\n') as line, i (`inner-${id}-${i}-${line}`)}
					{#if i > 0}<br />{/if}{@html line}
				{/each}
			</span>
		</span>
	</span>
</button>
