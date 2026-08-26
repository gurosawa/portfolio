<script lang="ts">
	import { validateExampleUrl } from './example-url';

	type Props = {
		id: string;
		label: string;
		description: string;
		examples: readonly string[];
		submitLabel: string;
	};

	let { id, label, description, examples, submitLabel }: Props = $props();
	let value = $state('');
	let message = $state('');
	let phase = $state<'idle' | 'error' | 'submitted'>('idle');
	let formElement: HTMLFormElement;

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const result = validateExampleUrl(value);

		if (!result.ok) {
			phase = 'error';
			message = result.message;
			return;
		}

		phase = 'submitted';
		message = `${result.url}의 교육용 연결 흐름을 시작했습니다. 실제 요청은 보내지 않았습니다.`;
		value = '';
		formElement.dispatchEvent(
			new CustomEvent('story-form-submit', {
				bubbles: true,
				detail: { url: result.url }
			})
		);

		window.setTimeout(() => {
			if (phase === 'submitted') phase = 'idle';
		}, 850);
	}

	function chooseExample(example: string) {
		value = example;
		phase = 'idle';
		message = '';
	}

	function submitOnEnter(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		formElement.requestSubmit();
	}
</script>

<form
	bind:this={formElement}
	class:is-error={phase === 'error'}
	class:is-submitted={phase === 'submitted'}
	class="example-form"
	onsubmit={submit}
	data-example-url-form
>
	<div class="example-form__heading">
		<label for={`${id}-input`}>{label}</label>
		<p id={`${id}-description`}>{description}</p>
	</div>

	<div class="example-form__control">
		<input
			id={`${id}-input`}
			bind:value
			type="url"
			inputmode="url"
			autocomplete="off"
			spellcheck="false"
			aria-describedby={`${id}-description ${id}-message`}
			placeholder="https://service.example/path"
			onkeydown={submitOnEnter}
		/>
		<button type="submit">{submitLabel}</button>
	</div>

	<div class="example-form__examples" aria-label="예문 입력">
		{#each examples as example, index (example)}
			<button type="button" onclick={() => chooseExample(example)}>
				예문 {index + 1}
			</button>
		{/each}
	</div>

	<p id={`${id}-message`} class="example-form__message" aria-live="polite">{message}</p>
</form>

<style>
	.example-form {
		position: relative;
		border: 1px solid var(--story-line, #302c25);
		background: rgba(13, 13, 12, 0.9);
		padding: clamp(1.1rem, 2vw, 1.6rem);
		overflow: hidden;
	}

	.example-form::after {
		position: absolute;
		inset: -20%;
		transform: translateX(-120%) skewX(-18deg);
		background: linear-gradient(90deg, transparent, rgba(255, 85, 0, 0.2), transparent);
		content: '';
		pointer-events: none;
	}

	.example-form.is-submitted::after {
		animation: submit-distortion 680ms cubic-bezier(0.2, 0.75, 0.25, 1);
	}

	.example-form__heading label {
		color: var(--ink-strong);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.11em;
		text-transform: uppercase;
	}

	.example-form__heading p,
	.example-form__message {
		margin: 0.55rem 0 0;
		color: var(--ink-soft);
		font-size: 0.82rem;
		line-height: 1.6;
	}

	.example-form__control {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.example-form input {
		min-width: 0;
		border: 1px solid var(--story-line, #302c25);
		border-radius: 0;
		outline: none;
		background: #11100e;
		padding: 0.85rem 1rem;
		color: var(--ink-strong);
		font-family: var(--font-mono);
		font-size: 0.78rem;
		transition:
			border-color 160ms ease,
			box-shadow 160ms ease,
			transform 160ms ease;
	}

	.example-form input:focus {
		transform: translateY(-1px);
		border-color: #ff5500;
		box-shadow:
			0 0 0 3px rgba(255, 85, 0, 0.12),
			inset 0 0 2rem rgba(255, 85, 0, 0.04);
	}

	.example-form button {
		border: 1px solid #ff5500;
		border-radius: 0;
		background: transparent;
		padding: 0.75rem 1rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
	}

	.example-form button:hover,
	.example-form button:focus-visible {
		background: #ff5500;
		color: #11100e;
		outline: none;
	}

	.example-form__examples {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.example-form__examples button {
		border-color: var(--story-line, #302c25);
		padding: 0.45rem 0.65rem;
		color: var(--ink-soft);
	}

	.example-form.is-error input {
		border-color: #ff7a61;
	}

	.example-form.is-error .example-form__message {
		color: #ff947f;
	}

	.example-form.is-submitted input {
		animation: glyph-dissolve 520ms ease both;
	}

	@keyframes submit-distortion {
		0% {
			transform: translateX(-120%) skewX(-18deg);
		}
		55% {
			transform: translateX(10%) skewX(-18deg) scaleY(1.12);
		}
		100% {
			transform: translateX(120%) skewX(-18deg);
		}
	}

	@keyframes glyph-dissolve {
		0% {
			filter: blur(0);
			opacity: 1;
		}
		45% {
			filter: blur(5px);
			opacity: 0.25;
		}
		100% {
			filter: blur(0);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.example-form,
		.example-form input {
			transition: none;
		}

		.example-form.is-submitted::after,
		.example-form.is-submitted input {
			animation: none;
		}
	}

	:global(.story-shell--motion-off) .example-form,
	:global(.story-shell--motion-off) .example-form input {
		transition: none;
	}

	:global(.story-shell--motion-off) .example-form.is-submitted::after,
	:global(.story-shell--motion-off) .example-form.is-submitted input {
		animation: none;
	}

	@media (max-width: 640px) {
		.example-form__control {
			grid-template-columns: 1fr;
		}
	}
</style>
