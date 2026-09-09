import { describe, expect, it } from 'vitest';
import { previewScene, type FlowPreviewKind } from './flow-preview';

const kinds: FlowPreviewKind[] = ['pipeline', 'tls', 'claim', 'mpc'];

describe('notebook flow preview layouts', () => {
	for (const narrow of [false, true]) {
		for (const kind of kinds) {
			it(`${kind} keeps nodes inside its ${narrow ? 'narrow' : 'wide'} canvas`, () => {
				const scene = previewScene(kind, narrow);
				const width = narrow ? 360 : 640;
				const height = narrow ? 480 : 400;
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

	it('uses distinct narrow coordinates without mutating the wider scene', () => {
		const firstWide = previewScene('pipeline', false);
		const narrow = previewScene('pipeline', true);
		const secondWide = previewScene('pipeline', false);
		expect(firstWide).toEqual(secondWide);
		expect(narrow.nodes).not.toEqual(firstWide.nodes);
	});
});
