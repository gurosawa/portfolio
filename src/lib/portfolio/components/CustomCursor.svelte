<script lang="ts">
	import { onMount } from 'svelte';

	let mouseX = $state(0);
	let mouseY = $state(0);
	let isHovering = $state(false);
	let isVisible = $state(false);

	let dotX = 0;
	let dotY = 0;

	// Use requestAnimationFrame for smooth lag-free tracking
	let rafId: number;

	function updateCursor() {
		// Smooth follow (easing)
		// For the dot, we want it to follow instantly, but let's add a tiny bit of easing for a premium feel
		dotX += (mouseX - dotX) * 0.3;
		dotY += (mouseY - dotY) * 0.3;

		// We use standard CSS variables so the style block can react instantly
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty('--cursor-x', `${dotX}px`);
			document.documentElement.style.setProperty('--cursor-y', `${dotY}px`);
		}

		rafId = requestAnimationFrame(updateCursor);
	}

	onMount(() => {
		// Only show custom cursor if it's a device with a fine pointer (mouse)
		if (window.matchMedia('(pointer: fine)').matches) {
			isVisible = true;
			document.body.classList.add('custom-cursor-enabled');
		}

		const handleMouseMove = (e: MouseEvent) => {
			mouseX = e.clientX;
			mouseY = e.clientY;

			const target = e.target as HTMLElement;
			if (target) {
				const interactiveAncestor = target.closest(
					'a, button, [role="button"], input, textarea, [data-hover="true"]'
				);
				const noHoverAncestor = target.closest('[data-no-hover="true"]');

				if (noHoverAncestor) {
					isHovering = false;
				} else {
					isHovering = !!interactiveAncestor;
				}
			}
		};

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		rafId = requestAnimationFrame(updateCursor);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(rafId);
			document.body.classList.remove('custom-cursor-enabled');
		};
	});
</script>

{#if isVisible}
	<div class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
		<!-- Cursor Ring -->
		<div
			class="absolute left-0 top-0 rounded-full transition-all duration-300 ease-out flex items-center justify-center -translate-x-1/2 -translate-y-1/2 {isHovering
				? 'w-16 h-16 border border-[#FF5500] bg-transparent'
				: 'w-3 h-3 bg-[#FF5500]'}"
			style="transform: translate(var(--cursor-x, -100px), var(--cursor-y, -100px)) translate(-50%, -50%);"
		></div>
	</div>
{/if}

<style lang="postcss">
	:global(.custom-cursor-enabled *) {
		cursor: none !important;
	}
</style>
