<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { notebookPreferenceContext, type NotebookPreferences } from '$lib/notebook/notebook-ui';
	let { children } = $props();
	let motionOff = $state(false);
	const isStory = $derived(page.url.pathname.includes('/notebook/zktls/'));
	const locale = $derived(page.params.locale === 'en' ? 'en' : 'ko');
	function toggleMotion() {
		motionOff = !motionOff;
		try {
			localStorage.setItem('systems-notebook-motion', motionOff ? 'off' : 'on');
		} catch {
			/* Optional preference storage. */
		}
	}
	setContext<NotebookPreferences>(notebookPreferenceContext, {
		get motionOff() {
			return motionOff;
		},
		toggleMotion
	});
	onMount(() => {
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		const read = () => {
			let stored: string | null = null;
			try {
				stored = localStorage.getItem('systems-notebook-motion');
			} catch {
				/* Storage may be unavailable. */
			}
			motionOff = stored ? stored === 'off' : media.matches;
		};
		read();
		media.addEventListener('change', read);
		window.addEventListener('storage', read);
		window.addEventListener('story-motion-change', read);
		return () => {
			media.removeEventListener('change', read);
			window.removeEventListener('storage', read);
			window.removeEventListener('story-motion-change', read);
		};
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if isStory}
	{@render children()}
{:else}
	<div class="nb-shell" data-motion={motionOff ? 'off' : 'on'}>
		<a class="nb-skip" href="#notebook-main"
			>{locale === 'ko' ? '본문으로 건너뛰기' : 'Skip to content'}</a
		>
		<header class="nb-header">
			<div class="nb-header-inner">
				<a
					class="nb-brand"
					href={resolve('/[locale=locale]/notebook', { locale })}
					aria-label="Systems Notebook 홈"
				>
					<span class="nb-mark" aria-hidden="true">[<span>/</span>]</span>
					<span>Systems Notebook</span>
				</a>
				<nav aria-label="Notebook 메뉴">
					<a class="nb-portfolio" href={resolve('/[locale=locale]', { locale })}
						>홍범 <span aria-hidden="true">↗</span></a
					>
					<button class="nb-motion" type="button" aria-pressed={motionOff} onclick={toggleMotion}>
						<span class="motion-symbol" aria-hidden="true">{motionOff ? '▷' : 'Ⅱ'}</span>
						{locale === 'ko'
							? motionOff
								? '모션 켜기'
								: '모션 끄기'
							: motionOff
								? 'Enable motion'
								: 'Pause motion'}
					</button>
				</nav>
			</div>
		</header>
		{@render children()}
		<footer class="nb-footer">
			<a href={resolve('/[locale=locale]/notebook', { locale })}>Systems Notebook</a>
			<span>인프라와 보안을 공부하며 남기는 기록.</span>
			<a href={resolve('/[locale=locale]', { locale })}>홍범의 포트폴리오 ↗</a>
		</footer>
	</div>
{/if}

<style>
	.nb-shell {
		--nb-bg: #10110f;
		--nb-panel: #181a17;
		--nb-text: #eeeae2;
		--nb-muted: #aaa9a2;
		--nb-line: #33362f;
		--nb-accent: #ff5500;
		min-height: 100dvh;
		background: var(--nb-bg);
		color: var(--nb-text);
		font-family: var(--font-body);
	}
	.nb-shell :global(*) {
		box-sizing: border-box;
	}
	.nb-shell :global(a),
	.nb-shell :global(button),
	.nb-shell :global(input),
	.nb-shell :global(select) {
		-webkit-tap-highlight-color: transparent;
	}
	.nb-shell :global(:focus-visible) {
		outline: 2px solid var(--nb-accent);
		outline-offset: 5px;
	}
	.nb-header {
		border-bottom: 1px solid var(--nb-line);
		position: relative;
		z-index: 10;
		background: var(--nb-bg);
	}
	.nb-header-inner,
	.nb-footer {
		max-width: 1440px;
		padding-inline: clamp(22px, 5vw, 80px);
		margin: auto;
	}
	.nb-header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		height: 78px;
	}
	.nb-brand {
		display: flex;
		align-items: center;
		gap: 14px;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 17px;
		letter-spacing: -0.04em;
		text-decoration: none;
		color: var(--nb-text);
	}
	.nb-mark {
		color: var(--nb-muted);
		font: 25px var(--font-mono);
		letter-spacing: -5px;
		width: 30px;
	}
	.nb-mark span {
		color: var(--nb-accent);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 30px;
	}
	.nb-portfolio {
		font-size: 13px;
		color: var(--nb-muted);
		text-decoration: none;
	}
	.nb-portfolio span {
		margin-left: 7px;
	}
	.nb-motion {
		display: flex;
		align-items: center;
		gap: 9px;
		color: var(--nb-muted);
		padding: 9px 0;
		border: 0;
		background: none;
		font: 12px var(--font-body);
		cursor: pointer;
	}
	.nb-motion:hover,
	.nb-portfolio:hover {
		color: var(--nb-text);
	}
	.motion-symbol {
		color: var(--nb-accent);
		font-size: 15px;
		min-width: 15px;
	}
	.nb-footer {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		border-top: 1px solid var(--nb-line);
		padding-block: 32px;
		font-size: 12px;
		color: var(--nb-muted);
	}
	.nb-footer a {
		color: inherit;
		text-decoration: none;
	}
	.nb-footer a:first-child {
		color: var(--nb-text);
		font-family: var(--font-display);
	}
	.nb-skip {
		position: fixed;
		z-index: 100;
		top: 12px;
		left: 12px;
		transform: translateY(-200%);
		background: var(--nb-text);
		color: var(--nb-bg);
		padding: 12px 20px;
	}
	.nb-skip:focus {
		transform: translateY(0);
	}
	.nb-shell[data-motion='off'] :global(*),
	.nb-shell[data-motion='off'] :global(*::before),
	.nb-shell[data-motion='off'] :global(*::after) {
		animation: none !important;
		transition-duration: 0s !important;
		scroll-behavior: auto !important;
	}
	@media (max-width: 640px) {
		.nb-header-inner {
			height: 68px;
			gap: 10px;
		}
		.nb-brand {
			font-size: 15px;
			gap: 10px;
		}
		nav {
			gap: 14px;
		}
		.nb-portfolio {
			display: none;
		}
		.nb-footer {
			flex-wrap: wrap;
			gap: 14px;
		}
		.nb-footer span {
			width: 100%;
			order: 2;
		}
	}
</style>
