import { describe, expect, it } from 'vitest';
import { previewScene, previewSize, type FlowPreviewKind } from './flow-preview';

const kinds: FlowPreviewKind[] = ['pipeline', 'ml', 'tls', 'claim', 'mpc'];

describe('notebook flow preview layouts', () => {
	for (const narrow of [false, true]) {
		for (const kind of kinds) {
			it(`${kind} keeps nodes inside its ${narrow ? 'narrow' : 'wide'} canvas`, () => {
				const scene = previewScene(kind, narrow);
				const { width, height } = previewSize(kind, narrow);
				for (const node of scene.nodes) {
					expect(node.x).toBeGreaterThanOrEqual(0);
					expect(node.y).toBeGreaterThanOrEqual(0);
					expect(node.x + node.width).toBeLessThanOrEqual(width);
					expect(node.y + 108).toBeLessThanOrEqual(height);
				}
				expect(new Set(scene.nodes.map((node) => node.id)).size).toBe(scene.nodes.length);
				expect(scene.title.length).toBeGreaterThan(0);
				expect(scene.description.length).toBeGreaterThan(0);
				expect(scene.caption.length).toBeGreaterThan(0);
			});
		}
	}

	for (const kind of ['pipeline', 'ml'] as const) {
		it(`${kind} preserves the same roles and directed paths on mobile`, () => {
			const wide = previewScene(kind, false);
			const mobile = previewScene(kind, true);
			expect(mobile.nodes.map(({ id, title, detail }) => ({ id, title, detail }))).toEqual(
				wide.nodes.map(({ id, title, detail }) => ({ id, title, detail }))
			);
			expect(mobile.connections.map(({ id, from, to }) => ({ id, from, to }))).toEqual(
				wide.connections.map(({ id, from, to }) => ({ id, from, to }))
			);
			for (const connection of wide.connections) {
				expect(wide.nodes.some((node) => node.id === connection.from)).toBe(true);
				expect(wide.nodes.some((node) => node.id === connection.to)).toBe(true);
			}
			for (const phase of wide.phases ?? []) {
				for (const id of phase.connections) {
					const edge = wide.connections.find((connection) => connection.id === id);
					expect(edge).toBeDefined();
					expect(phase.nodes).toEqual(expect.arrayContaining([edge?.from, edge?.to]));
				}
			}
		});
	}

	it('keeps GitOps declarations separate from the cluster image pull', () => {
		const scene = previewScene('pipeline', false);
		expect(scene.connections).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ from: 'build', to: 'config' }),
				expect.objectContaining({ from: 'config', to: 'reconcile' }),
				expect.objectContaining({ from: 'cluster', to: 'registry', dashed: true })
			])
		);
		expect(scene.connections.some((edge) => edge.from === 'build' && edge.to === 'cluster')).toBe(
			false
		);
	});

	it('separates model records, artifacts and deployment approval', () => {
		const scene = previewScene('ml', false);
		expect(scene.connections).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ from: 'training', to: 'tracking' }),
				expect.objectContaining({ from: 'training', to: 'artifacts' }),
				expect.objectContaining({ from: 'approval', to: 'serving' }),
				expect.objectContaining({ from: 'serving', to: 'knative', dashed: true })
			])
		);
		expect(
			scene.connections.some((edge) => edge.from === 'training' && edge.to === 'serving')
		).toBe(false);
	});

	it('uses distinct narrow coordinates without mutating the wider scene', () => {
		const firstWide = previewScene('pipeline', false);
		const narrow = previewScene('pipeline', true);
		const secondWide = previewScene('pipeline', false);
		expect(firstWide).toEqual(secondWide);
		expect(narrow.nodes).not.toEqual(firstWide.nodes);
	});
});
