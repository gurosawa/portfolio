<script lang="ts">
	import type { StoryBlock } from './schema';
	import { toCodeLines } from './code-lines';
	import ExampleUrlForm from './ExampleUrlForm.svelte';
	import StoryFigure from './StoryFigure.svelte';

	let { block }: { block: StoryBlock } = $props();
	const codeLines = $derived(
		block.kind === 'code' ? toCodeLines(block.value, block.highlightLines) : []
	);
	const codeLineBreak = '\n';
</script>

{#if block.kind === 'paragraph'}
	<p class="story-paragraph">{block.text}</p>
{:else if block.kind === 'list'}
	<ul class="story-list">
		{#each block.items as item (item)}<li>{item}</li>{/each}
	</ul>
{:else if block.kind === 'code'}
	<div class="code-block" data-code-block={block.id}>
		<div class="code-block__header">
			<span>{block.language}</span>
			<span>교육용 예시값</span>
		</div>
		<pre><code
				>{#each codeLines as line, index (line.number)}<span
						class:code-line--highlighted={line.highlighted}
						data-line={line.number}>{line.text}</span
					>{#if index < codeLines.length - 1}{codeLineBreak}{/if}{/each}</code
			></pre>
	</div>
{:else if block.kind === 'table'}
	<div class="story-table-wrap">
		<table>
			<caption>{block.caption}</caption>
			<thead>
				<tr
					>{#each block.headers as header (header)}<th scope="col">{header}</th>{/each}</tr
				>
			</thead>
			<tbody>
				{#each block.rows as row, rowIndex (rowIndex)}
					<tr
						>{#each row as cell, cellIndex (cellIndex)}<td>{cell}</td>{/each}</tr
					>
				{/each}
			</tbody>
		</table>
	</div>
{:else if block.kind === 'callout'}
	<aside class={`story-callout story-callout--${block.tone}`}>
		<p class="story-callout__label">{block.tone}</p>
		<h4>{block.title}</h4>
		<p>{block.text}</p>
	</aside>
{:else if block.kind === 'form'}
	<ExampleUrlForm
		id={block.id}
		label={block.label}
		description={block.description}
		examples={block.examples}
		submitLabel={block.submitLabel}
	/>
{:else}
	<StoryFigure visual={block.visual} alt={block.alt} caption={block.caption} />
{/if}

<style>
	.story-paragraph,
	.story-list {
		color: var(--story-body, #c8bda8);
		font-size: clamp(1rem, 1.2vw, 1.12rem);
		line-height: 1.85;
		word-break: keep-all;
	}

	.story-paragraph {
		margin: 1.4rem 0 0;
	}

	.story-list {
		display: grid;
		gap: 0.85rem;
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	.story-list li {
		position: relative;
		border-bottom: 1px solid var(--story-line, #302c25);
		padding: 0 0 0.85rem 1.4rem;
	}

	.story-list li::before {
		position: absolute;
		top: 0.72rem;
		left: 0;
		width: 0.45rem;
		height: 0.45rem;
		transform: rotate(45deg);
		background: #ff5500;
		content: '';
	}

	.code-block {
		min-width: 0;
		max-width: 100%;
		margin-top: 1.75rem;
		border: 1px solid var(--story-line, #302c25);
		background: #11100e;
	}

	.code-block__header {
		display: flex;
		justify-content: space-between;
		border-bottom: 1px solid var(--story-line, #302c25);
		padding: 0.65rem 0.85rem;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}

	.code-block pre {
		max-width: 100%;
		margin: 0;
		padding: 1.25rem;
		overflow: auto;
		color: #d7cbbb;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		line-height: 1.7;
		tab-size: 2;
	}

	.code-block pre:focus-visible {
		outline: 2px solid #ff5500;
		outline-offset: -2px;
	}

	.code-block code > span {
		display: inline-block;
		box-sizing: border-box;
		width: 100%;
		min-height: 1.7em;
	}

	.code-block code > .code-line--highlighted {
		border-left: 2px solid #ff5500;
		background: rgba(255, 85, 0, 0.1);
		padding-left: 0.75rem;
		color: #fff1df;
	}

	.story-table-wrap {
		max-width: 100%;
		margin-top: 1.75rem;
		overflow-x: auto;
	}

	.story-table-wrap table {
		width: 100%;
		min-width: 34rem;
		border-collapse: collapse;
		font-size: 0.86rem;
		line-height: 1.65;
	}

	.story-table-wrap caption {
		border-top: 1px solid #ff5500;
		padding: 0.75rem 0;
		color: var(--ink-soft);
		font-size: 0.78rem;
		text-align: left;
	}

	.story-table-wrap th,
	.story-table-wrap td {
		border-bottom: 1px solid var(--story-line, #302c25);
		padding: 0.9rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}

	.story-table-wrap th {
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.story-callout {
		margin-top: 1.75rem;
		border-left: 2px solid #ff5500;
		background: rgba(255, 85, 0, 0.055);
		padding: 1.2rem 1.4rem;
	}

	.story-callout--failure {
		border-color: #ff947f;
		background: rgba(255, 122, 97, 0.05);
	}

	.story-callout__label {
		margin: 0 0 0.55rem;
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.story-callout h4 {
		margin: 0;
		color: var(--ink-strong);
		font-family: var(--font-display);
		font-size: 1.05rem;
	}

	.story-callout > p:last-child {
		margin: 0.75rem 0 0;
		color: var(--story-body, #c8bda8);
		line-height: 1.75;
		word-break: keep-all;
	}
</style>
