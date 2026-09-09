import { describe, expect, it } from 'vitest';
import { clampTlsProgress, tlsWireMessages, tlsWireScene, tlsWireStages } from './tls-wire';

describe('TLS explanatory wire model', () => {
	it('preserves certificate-based TLS 1.3 message order and protection', () => {
		expect(tlsWireMessages.map((row) => row.id)).toEqual([
			'client-hello',
			'server-hello',
			'encrypted-extensions',
			'certificate',
			'certificate-verify',
			'server-finished',
			'client-finished',
			'application-data'
		]);
		expect(tlsWireMessages.slice(0, 2).every((row) => row.protection === 'plaintext')).toBe(true);
		expect(tlsWireMessages.slice(2, 7).every((row) => row.protection === 'handshake')).toBe(true);
	});

	it('never sends HTTP before both Finished messages complete', () => {
		for (const stage of tlsWireStages) {
			for (const progress of [0, 0.1, 0.3, 0.5, 0.8, 0.96, 1]) {
				const scene = tlsWireScene(stage, progress);
				if (stage !== 'request') {
					expect(scene.requestState).toBe('waiting');
					expect(scene.requestPosition).toBe(0);
				} else {
					expect(scene.handshakeComplete).toBe(true);
					expect(scene.serverAuthenticated).toBe(true);
				}
			}
		}
	});

	it('does not equate key agreement with server authentication', () => {
		const hello = tlsWireScene('hello', 1);
		expect(hello.serverAuthenticated).toBe(false);
		expect(hello.handshakeComplete).toBe(false);
		expect(hello.status).toContain('서버 확인은 아직');
		expect(tlsWireScene('identity', 1).serverAuthenticated).toBe(true);
		expect(tlsWireScene('identity', 1).handshakeComplete).toBe(false);
		expect(tlsWireScene('finished', 1).handshakeComplete).toBe(true);
	});

	it('highlights the actual stage message and never has two in flight', () => {
		for (const stage of tlsWireStages) {
			for (let progress = 0; progress <= 1; progress += 0.01) {
				const scene = tlsWireScene(stage, progress);
				const focused = scene.rows.filter((row) => row.focused);
				expect(focused).toHaveLength(1);
				expect(focused[0].stage).toBe(stage);
				expect(scene.rows.filter((row) => row.state === 'active').length).toBeLessThanOrEqual(1);
				for (const row of scene.rows) {
					expect(row.position).toBeGreaterThanOrEqual(0);
					expect(row.position).toBeLessThanOrEqual(1);
				}
			}
		}
	});

	it('reverses reply endpoints and clamps scroll values', () => {
		expect(clampTlsProgress(-1)).toBe(0);
		expect(clampTlsProgress(2)).toBe(1);
		expect(clampTlsProgress(NaN)).toBe(0);
		expect(clampTlsProgress(Infinity)).toBe(0);
		const initial = tlsWireScene('hello', -1);
		const final = tlsWireScene('hello', 2);
		expect(initial.rows[0].position).toBe(0);
		expect(initial.rows[1].position).toBe(1);
		expect(final.rows[0].position).toBe(1);
		expect(final.rows[1].position).toBe(0);
	});

	it('wraps the HTTP request before moving any application data', () => {
		const wrapping = tlsWireScene('request', 0.3);
		expect(wrapping.requestState).toBe('wrapping');
		expect(wrapping.encryptionProgress).toBeGreaterThan(0);
		expect(wrapping.requestPosition).toBe(0);
		const sending = tlsWireScene('request', 0.7);
		expect(sending.requestState).toBe('sending');
		expect(sending.encryptionProgress).toBe(1);
		expect(sending.requestPosition).toBeGreaterThan(0);
		expect(tlsWireScene('request', 1).requestState).toBe('received');
	});

	it('is stateless on reverse scrolling and complete in static mode', () => {
		const before = tlsWireScene('hello', 0.2);
		tlsWireScene('request', 1);
		expect(tlsWireScene('hello', 0.2)).toEqual(before);
		for (const stage of tlsWireStages) {
			const scene = tlsWireScene(stage, 0, true);
			expect(scene.rows.filter((row) => row.visible).every((row) => row.state === 'complete')).toBe(
				true
			);
			expect(scene.rows.some((row) => row.state === 'active')).toBe(false);
		}
	});
});
