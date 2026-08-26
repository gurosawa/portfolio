<script lang="ts">
	import type { StoryVisual } from './schema';

	type Props = {
		visual: StoryVisual;
		alt: string;
		caption: string;
	};

	let { visual, alt, caption }: Props = $props();
</script>

<figure class="story-figure" data-story-figure>
	<div class="story-figure__visual" role="img" aria-label={alt}>
		{#if visual.kind === 'flow'}
			<ol class="flow-diagram">
				{#each visual.nodes as node, index (node)}
					<li class:is-active={visual.active?.includes(node)}>
						<span class="flow-diagram__index">{String(index + 1).padStart(2, '0')}</span>
						<span>{node}</span>
					</li>
				{/each}
			</ol>
		{:else if visual.kind === 'state'}
			<div class={`state-card state-card--${visual.status}`}>
				<span>{visual.label}</span>
				<strong>{visual.value}</strong>
				<small>{visual.status}</small>
			</div>
		{:else if visual.kind === 'matrix'}
			<div class="matrix-wrap">
				<table>
					<thead>
						<tr>
							{#each visual.columns as column (column)}<th scope="col">{column}</th>{/each}
						</tr>
					</thead>
					<tbody>
						{#each visual.rows as row, rowIndex (rowIndex)}
							<tr
								>{#each row as cell, cellIndex (cellIndex)}<td>{cell}</td>{/each}</tr
							>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<ol class="trace-lines">
				{#each visual.lineIds as line, index (line)}
					<li><span>{String(index + 1).padStart(2, '0')}</span>{line}</li>
				{/each}
			</ol>
		{/if}
	</div>
	<figcaption>{caption}</figcaption>
</figure>

<style>
	.story-figure {
		min-width: 0;
		max-width: 100%;
		margin: 2rem 0 0;
	}

	.story-figure__visual {
		min-width: 0;
		max-width: 100%;
		border: 1px solid var(--story-line, #302c25);
		background: rgba(17, 16, 14, 0.82);
		padding: clamp(1rem, 2.5vw, 2rem);
	}

	.story-figure figcaption {
		margin-top: 0.75rem;
		color: var(--ink-soft);
		font-size: 0.78rem;
		line-height: 1.6;
	}

	.flow-diagram {
		display: flex;
		align-items: stretch;
		margin: 0;
		padding: 0;
		list-style: none;
		max-width: 100%;
		overflow-x: auto;
	}

	.flow-diagram li {
		position: relative;
		display: grid;
		min-width: 8rem;
		flex: 1;
		gap: 1rem;
		align-content: space-between;
		border-top: 1px solid var(--story-line, #302c25);
		padding: 1rem 1.25rem 1rem 0;
		color: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	.flow-diagram li:not(:last-child)::after {
		position: absolute;
		top: -0.3rem;
		right: 0.4rem;
		width: 0.55rem;
		height: 0.55rem;
		transform: rotate(45deg);
		border-top: 1px solid #ff5500;
		border-right: 1px solid #ff5500;
		content: '';
	}

	.flow-diagram li.is-active,
	.flow-diagram__index {
		color: #ff5500;
	}

	.state-card {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 1rem;
		max-width: 30rem;
		margin: 0 auto;
		border: 1px solid #ff5500;
		padding: clamp(1.25rem, 4vw, 2.5rem);
		font-family: var(--font-mono);
	}

	.state-card strong {
		color: #ff5500;
		font-size: clamp(1.8rem, 4vw, 3rem);
	}

	.state-card small {
		grid-column: 1 / -1;
		border-top: 1px solid var(--story-line, #302c25);
		padding-top: 1rem;
		color: var(--ink-soft);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.state-card--verified,
	.state-card--approved {
		background: rgba(255, 85, 0, 0.08);
	}

	.matrix-wrap {
		overflow-x: auto;
	}

	.matrix-wrap table {
		width: 100%;
		min-width: 34rem;
		border-collapse: collapse;
		font-size: 0.78rem;
	}

	.matrix-wrap th,
	.matrix-wrap td {
		border-bottom: 1px solid var(--story-line, #302c25);
		padding: 0.9rem;
		text-align: left;
		vertical-align: top;
	}

	.matrix-wrap th {
		color: #ff5500;
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.trace-lines {
		margin: 0;
		padding: 0;
		font-family: var(--font-mono);
		font-size: 0.76rem;
		list-style: none;
	}

	.trace-lines li {
		display: flex;
		gap: 1rem;
		border-bottom: 1px solid var(--story-line, #302c25);
		padding: 0.8rem 0;
	}

	.trace-lines span {
		color: #ff5500;
	}
</style>
