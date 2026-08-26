import { describe, expect, it } from 'vitest';
import { balanceClaimStory } from './balance-claim';
import { syntheticBalanceFixture, syntheticBalanceUrl } from './fixture';
import { tls13Story } from './tls13';
import { tlsnotaryStory } from './tlsnotary';

describe('shared zkTLS synthetic fixture', () => {
	it('pins the Open Banking v4.0 semantics used by the three stories', () => {
		const balance = syntheticBalanceFixture.Data.Balance[0];

		expect(balance).toMatchObject({
			AccountId: 'acct_demo_7F21',
			Amount: { Amount: '72840000.00', Currency: 'KRW', SubType: 'BCUR' },
			CreditDebitIndicator: 'Credit',
			Type: 'ITAV',
			DateTime: '2026-08-25T10:14:32+09:00'
		});
		expect(balance.CreditLine[0].Included).toBe(false);
		expect(syntheticBalanceFixture.Links.Self).toBe(syntheticBalanceUrl);
	});

	it('keeps the same account and amount while separating the three sessions', () => {
		const documents = [balanceClaimStory, tls13Story, tlsnotaryStory].map((story) =>
			JSON.stringify(story)
		);

		for (const document of documents) {
			expect(document).toContain('acct_demo_7F21');
			expect(document).toContain('72840000.00');
		}

		expect(documents[0]).toContain('trace_zktls_001');
		expect(documents[1]).toContain('trace_tls13_001');
		expect(documents[2]).toContain('trace_tlsn12_001');
	});
});
