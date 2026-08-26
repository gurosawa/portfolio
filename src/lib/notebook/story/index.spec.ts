import { describe, expect, it } from 'vitest';
import { getStory, storySlugs } from './index';

describe('interactive story public model', () => {
	it('publishes the balance claim story through its final URL and nine stable Act hashes', () => {
		expect(storySlugs).toContain('balance-claim');

		const story = getStory('balance-claim');

		expect(story.meta.canonicalPath).toBe('/ko/notebook/zktls/balance-claim/');
		expect(story.meta.title).toBe('zkTLS로 API 응답의 잔액 조건을 증명하는 과정');
		expect(story.acts).toHaveLength(9);
		expect(story.acts.map((act) => act.hash)).toEqual([
			'#act-0-membership-condition',
			'#act-1-specify',
			'#act-2-challenge',
			'#act-3-fetch',
			'#act-4-bind',
			'#act-5-prove',
			'#act-6-verify',
			'#act-7-rely',
			'#act-8-failure-replay'
		]);
		expect(story.opening.claim.fields).toEqual({ premiumEligible: true });
		expect(story.deepDives.length).toBeGreaterThan(0);
	});

	it('publishes the TLS 1.3 story as a complete nine-Act article', () => {
		const story = getStory('tls13');

		expect(story.meta.canonicalPath).toBe('/ko/notebook/zktls/tls13/');
		expect(story.acts.map((act) => act.title)).toEqual([
			'HTTPS 응답에 남는 질문',
			'URL, DNS, TCP',
			'ClientHello',
			'ServerHello',
			'Certificate와 CertificateVerify',
			'Finished',
			'Record Protocol',
			'브라우저가 JSON을 읽는 순간',
			'저장한 사본의 빈칸'
		]);
		expect(story.acts[8].blocks.some((block) => block.kind === 'code')).toBe(true);
	});

	it('publishes the TLSNotary story with a role-and-visibility conclusion', () => {
		const story = getStory('tlsnotary');

		expect(story.meta.canonicalPath).toBe('/ko/notebook/zktls/tlsnotary/');
		expect(story.acts).toHaveLength(9);
		expect(story.acts[8].blocks).toEqual(
			expect.arrayContaining([expect.objectContaining({ kind: 'table', id: 'visibility-matrix' })])
		);
		expect(story.deepDives.map((deepDive) => deepDive.id)).toEqual(
			expect.arrayContaining(['direct-verifier-mode', 'proxy-mode', 'version-boundary'])
		);
	});
});
