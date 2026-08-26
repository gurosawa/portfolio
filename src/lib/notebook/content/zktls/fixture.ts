export const syntheticBalanceUrl =
	'https://api.bank.example/open-banking/v4.0/aisp/accounts/acct_demo_7F21/balances';

export const syntheticBalanceFixture = {
	Data: {
		Balance: [
			{
				AccountId: 'acct_demo_7F21',
				Amount: {
					Amount: '72840000.00',
					Currency: 'KRW',
					SubType: 'BCUR'
				},
				CreditDebitIndicator: 'Credit',
				Type: 'ITAV',
				DateTime: '2026-08-25T10:14:32+09:00',
				CreditLine: [
					{
						Included: false,
						Amount: {
							Amount: '10000000.00',
							Currency: 'KRW',
							SubType: 'BCUR'
						},
						Type: 'Pre-Agreed'
					}
				]
			}
		]
	},
	Links: {
		Self: syntheticBalanceUrl
	},
	Meta: {
		TotalPages: 1
	}
} as const;

export const syntheticBalanceFixtureJson = JSON.stringify(syntheticBalanceFixture, null, 2);
