import { describe, expect, it } from 'vitest';
import { balanceEditorial } from './balance-editorial';
import { balanceFlowFixture, balanceFlowScene, balanceFlowStages } from './balance-flow';

describe('balance claim editorial model', () => {
	it('preserves every original Act exactly once in the seven narrative scenes', () => {
		expect(balanceEditorial.scenes.map((scene) => scene.id)).toEqual(balanceFlowStages);
		expect(balanceEditorial.scenes.flatMap((scene) => scene.actIds)).toEqual([
			'membership-condition',
			'specify',
			'challenge',
			'fetch',
			'bind',
			'prove',
			'verify',
			'rely',
			'failure-replay'
		]);
	});

	it('uses the existing synthetic fixture and unchanged threshold values', () => {
		expect(balanceFlowFixture.amount).toBe('72840000.00');
		expect(balanceFlowFixture.currency).toBe('KRW');
		expect(balanceFlowFixture.threshold).toBe('50000000.00');
		expect(balanceFlowFixture.newThreshold).toBe('70000000.00');
		expect(Number(balanceFlowFixture.amount)).toBeGreaterThan(
			Number(balanceFlowFixture.newThreshold)
		);
	});

	it('starts before verification without claiming service approval', () => {
		for (const stage of ['condition', 'request', 'response', 'proof']) {
			const scene = balanceFlowScene(stage, 1);
			expect(scene.verification).toBe('not-started');
			expect(scene.decision).toBe('pending');
		}
	});

	it('replaces the private response before submission begins travelling', () => {
		expect(balanceFlowScene('proof', 0.2).payload).toBe('response');
		expect(balanceFlowScene('proof', 0.2).travel).toBe(0);
		expect(balanceFlowScene('proof', 0.35).payload).toBe('claim');
		expect(balanceFlowScene('proof', 0.8).payload).toBe('claim');
		expect(balanceFlowScene('proof', 0.8).travel).toBeGreaterThan(0);
	});

	it('finishes verification independently of the service decision', () => {
		expect(balanceFlowScene('verification', 0.5).verification).toBe('checking');
		const scene = balanceFlowScene('verification', 1);
		expect(scene.verification).toBe('verified');
		expect(scene.verificationChecks.every((check) => check.complete)).toBe(true);
		expect(scene.decision).toBe('pending');
	});

	it('only approves after the separate service policy stage', () => {
		expect(balanceFlowScene('decision', 0.2).decision).toBe('pending');
		expect(balanceFlowScene('decision', 0.8).decision).toBe('approved');
		expect(balanceFlowScene('decision', 0.8).verification).toBe('verified');
	});

	it('keeps valid verification when freshness causes denial', () => {
		const scene = balanceFlowScene('failure', 0.25);
		expect(balanceFlowFixture.ageSeconds).toBeGreaterThan(balanceFlowFixture.maxAgeSeconds);
		expect(scene.failureCase).toBe('freshness');
		expect(scene.verification).toBe('verified');
		expect(scene.decision).toBe('denied');
		expect(scene.proofForged).toBe(false);
	});

	it('requests a new proof, not insufficient funds or forgery, when the threshold changes', () => {
		const scene = balanceFlowScene('failure', 0.75);
		expect(scene.failureCase).toBe('threshold');
		expect(scene.verification).toBe('verified');
		expect(scene.decision).toBe('reproofRequired');
		expect(scene.proofForged).toBe(false);
		expect(scene.balanceDisclosedToVerifier).toBe(false);
	});

	it('never implies ownership verification or disclosure of the balance to the Verifier', () => {
		for (const stage of balanceFlowStages) {
			for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
				const scene = balanceFlowScene(stage, progress);
				expect(scene.ownershipVerified).toBe(false);
				expect(scene.balanceDisclosedToVerifier).toBe(false);
			}
		}
	});

	it('reverses without carrying approval or proof data back into an earlier scene', () => {
		const before = balanceFlowScene('request', 0.3);
		balanceFlowScene('decision', 1);
		balanceFlowScene('failure', 1);
		expect(balanceFlowScene('request', 0.3)).toEqual(before);
		expect(balanceFlowScene('verification', 0).verification).toBe('checking');
	});

	it('renders a complete stage in static mode and clamps invalid progress', () => {
		for (const stage of balanceFlowStages) {
			expect(balanceFlowScene(stage, 0.1, true)).toEqual(balanceFlowScene(stage, 1));
		}
		expect(balanceFlowScene('unknown', Number.NaN).stage).toBe('condition');
		expect(balanceFlowScene('response', -5).progress).toBe(0);
		expect(balanceFlowScene('response', 7).progress).toBe(1);
		expect(balanceFlowScene('response', Number.POSITIVE_INFINITY).travel).toBe(0);
	});
});
