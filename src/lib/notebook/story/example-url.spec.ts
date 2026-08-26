import { describe, expect, it } from 'vitest';
import { validateExampleUrl } from './example-url';

describe('educational URL input', () => {
	it('accepts only HTTPS URLs below the reserved .example namespace', () => {
		for (const value of [
			'https://api.bank.example/open-banking/v4.0/aisp/accounts/acct_demo_7F21/balances',
			'https://premium.example/eligibility',
			'https://notary.example/session/trace_tlsn12_001'
		]) {
			expect(validateExampleUrl(value)).toEqual({ ok: true, url: value });
		}
	});

	it('rejects real origins, credentials, IP literals and non-HTTPS schemes', () => {
		for (const value of [
			'https://example.com/account',
			'https://user:password@bank.example/account',
			'https://127.0.0.1/account',
			'http://api.bank.example/account',
			'https://api.bank.example:8443/account',
			'not a url'
		]) {
			expect(validateExampleUrl(value).ok).toBe(false);
		}
	});
});
