import { describe, expect, it } from 'vitest';
import { notaryFlowScene, notaryFlowStages, notaryFailures } from './notary-flow';
import { notaryEditorial } from './notary-editorial';

describe('TLSNotary editorial narrative', () => {
	it('covers all original act anchors exactly once in seven scenes', () => {
		expect(notaryEditorial.scenes.map((scene) => scene.id)).toEqual(notaryFlowStages);
		expect(notaryEditorial.scenes.flatMap((scene) => [...scene.actIds])).toEqual([
			'who-sees-balance',
			'participants',
			'session-preparation',
			'mpc-tls-request',
			'private-response',
			'notarization',
			'selective-disclosure',
			'application-verification',
			'policy-visibility-matrix'
		]);
	});

	it('does not show the response before the return and decryption stage', () => {
		expect(notaryFlowScene('session', 1).responseReceived).toBe(false);
		expect(notaryFlowScene('mpc', 0.3).requestProgress).toBeGreaterThan(0);
		expect(notaryFlowScene('mpc', 0.3).responseProgress).toBe(0);
		expect(notaryFlowScene('mpc', 0.7).responseReceived).toBe(false);
		expect(notaryFlowScene('mpc', 0.9).responseReceived).toBe(true);
	});

	it('issues a signature before the presentation can be delivered', () => {
		expect(notaryFlowScene('mpc', 1).signed).toBe(false);
		expect(notaryFlowScene('attestation', 0.4).signed).toBe(false);
		expect(notaryFlowScene('attestation', 1).signed).toBe(true);
		expect(notaryFlowScene('attestation', 1).delivered).toBe(false);
		expect(notaryFlowScene('disclosure', 0.9)).toMatchObject({ signed: true, delivered: true });
	});

	it('keeps plaintext and the hidden predicate distinction at every stage', () => {
		for (const stage of notaryFlowStages) {
			for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
				expect(notaryFlowScene(stage, progress)).toMatchObject({
					notarySeesPlaintext: false,
					verifierSeesBalance: false,
					claimRequiresAdditionalZkp: true,
					approved: false
				});
			}
		}
	});

	it('runs application checks only after delivery and does not approve membership', () => {
		expect(
			notaryFlowScene('disclosure', 1).checks.every((check) => check.state === 'pending')
		).toBe(true);
		expect(notaryFlowScene('verification', 0.2).checks[0].state).toBe('passed');
		expect(notaryFlowScene('verification', 1)).toMatchObject({
			delivered: true,
			verified: true,
			approved: false
		});
	});

	it('rejects the three independent failure examples at distinct checks', () => {
		[0.1, 0.5, 0.9].forEach((progress, index) => {
			const scene = notaryFlowScene('failure', progress);
			expect(scene.failure?.id).toBe(notaryFailures[index].id);
			expect(
				scene.checks.filter((check) => check.state === 'rejected').map((check) => check.id)
			).toEqual([notaryFailures[index].check]);
			expect(scene.verified).toBe(false);
		});
	});

	it('is reversible and resets unknown or invalid progress safely', () => {
		const before = notaryFlowScene('mpc', 0.2);
		notaryFlowScene('failure', 1);
		expect(notaryFlowScene('mpc', 0.2)).toEqual(before);
		expect(notaryFlowScene('unknown', Number.NaN)).toMatchObject({ stage: 'roles', progress: 0 });
		expect(notaryFlowScene('roles', -2).progress).toBe(0);
		expect(notaryFlowScene('roles', 4).progress).toBe(1);
	});

	it('renders each reduced-motion scene at its complete state', () => {
		for (const stage of notaryFlowStages) {
			expect(notaryFlowScene(stage, 0, true)).toEqual(notaryFlowScene(stage, 1));
		}
	});
});
