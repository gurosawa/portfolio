import { describe, expect, it } from 'vitest';
import { getPresentationFrame } from './presentation';

describe('getPresentationFrame', () => {
	it('clamps scrub progress and keeps the current Act addressable', () => {
		expect(getPresentationFrame('balance-claim', 4, 1.8, false)).toMatchObject({
			actIndex: 4,
			actProgress: 1,
			lane: 'claim'
		});
	});

	it('turns continuous scrub into a stable snapshot when motion is off', () => {
		expect(getPresentationFrame('tls13', 2, 0.24, true).actProgress).toBe(0);
		expect(getPresentationFrame('tls13', 2, 0.76, true).actProgress).toBe(1);
	});

	it('uses a distinct visual lane for each story', () => {
		expect(getPresentationFrame('balance-claim', 0, 0, false).lane).toBe('claim');
		expect(getPresentationFrame('tls13', 0, 0, false).lane).toBe('record');
		expect(getPresentationFrame('tlsnotary', 0, 0, false).lane).toBe('actors');
	});
});
