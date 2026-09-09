import { describe, expect, it } from 'vitest';
import { balanceClaimStory } from '../content/zktls/balance-claim';
import { tlsnotaryStory } from '../content/zktls/tlsnotary';
import { balanceEditorial } from './balance-editorial';
import { notaryEditorial } from './notary-editorial';
import { sceneActs, sceneDeepDives, sceneSources, validateEditorial } from './content';

describe.each([
	{ story: balanceClaimStory, editorial: balanceEditorial, deepCount: 9 },
	{ story: tlsnotaryStory, editorial: notaryEditorial, deepCount: 11 }
])('$editorial.slug editorial source preservation', ({ story, editorial, deepCount }) => {
	it('maps the original nine Acts to seven scenes exactly once', () => {
		expect(validateEditorial(story, editorial)).toBe(editorial);
		expect(editorial.scenes).toHaveLength(7);
		const acts = editorial.scenes.flatMap((scene) => sceneActs(story, scene));
		expect(acts).toHaveLength(9);
		expect(acts).toEqual(story.acts);
		expect(acts.map((act) => act.hash)).toEqual(story.acts.map((act) => act.hash));
	});

	it('retains every original code, table, list and form block without copying or rewriting it', () => {
		const originals = story.acts.flatMap((act) =>
			act.blocks.filter((block) => ['code', 'table', 'list', 'form'].includes(block.kind))
		);
		const retained = editorial.scenes.flatMap((scene) => sceneSources(story, scene));
		expect(retained.length).toBeGreaterThan(0);
		expect(retained).toEqual(originals);
		retained.forEach((block, index) => expect(block).toBe(originals[index]));
	});

	it('retains every detailed note exactly once', () => {
		const retained = editorial.scenes.flatMap((scene) => sceneDeepDives(story, scene));
		expect(retained).toHaveLength(deepCount);
		expect(new Set(retained.map((deep) => deep.id)).size).toBe(deepCount);
		expect(new Set(retained)).toEqual(new Set(story.deepDives));
	});
});

describe('editorial definition guards', () => {
	it('rejects a definition for another route', () => {
		expect(() => validateEditorial(balanceClaimStory, notaryEditorial)).toThrow('route');
	});
	it('rejects omitted or duplicated original Acts', () => {
		const duplicate = {
			...balanceEditorial,
			scenes: [...balanceEditorial.scenes, balanceEditorial.scenes[0]]
		};
		const missing = { ...balanceEditorial, scenes: balanceEditorial.scenes.slice(1) };
		expect(() => validateEditorial(balanceClaimStory, duplicate)).toThrow('exactly one scene');
		expect(() => validateEditorial(balanceClaimStory, missing)).toThrow('exactly one scene');
	});
	it('rejects duplicate scene anchors', () => {
		const scenes = balanceEditorial.scenes.map((scene) => ({ ...scene, id: 'same-anchor' }));
		expect(() => validateEditorial(balanceClaimStory, { ...balanceEditorial, scenes })).toThrow(
			'unique'
		);
	});
});
