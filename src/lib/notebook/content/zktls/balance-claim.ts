import { defineStory } from '$lib/notebook/story/schema';
import { syntheticBalanceFixtureJson } from './fixture';

export const balanceClaimStory = defineStory({
	meta: {
		slug: 'balance-claim',
		locale: 'ko',
		title: 'zkTLS로 API 응답의 잔액 조건을 증명하는 과정',
		description:
			'API 응답을 검증할 주장으로 구성하고, 제출 자료 검증과 서비스 가입 결정이 왜 별개인지 살펴본다.',
		canonicalPath: '/ko/notebook/zktls/balance-claim/',
		publishedAt: '2026-08-26',
		technicallyReviewedAt: '2026-08-26',
		readingMinutes: '10–15분'
	},
	opening: {
		question: '잔액을 공개하지 않고도 5,000만 원 이상이라는 조건만 확인하게 할 수 있을까?',
		claim: {
			label: 'premium.example 가입 조건',
			fields: { premiumEligible: true },
			status: 'unverified'
		}
	},
	mobileOverview: {
		alt: 'API 응답에서 프리미엄 서비스의 최종 가입 판정까지 이어지는 일곱 단계',
		nodes: ['조건 정의', '요청 연결', '응답 수신', '데이터 결합', '증명 생성', '검증', '가입 결정']
	},
	acts: [
		{
			id: 'membership-condition',
			kicker: 'Prologue',
			title: '가입 조건',
			lead: 'premium.example은 사용 가능한 잔액이 5,000만 원 이상인 이용자에게 프리미엄 가입을 허용한다.',
			blocks: [
				{
					id: 'opening-state',
					kind: 'figure',
					alt: '검사 전 상태인 premiumEligible 주장 카드',
					caption: '아직 제출 자료를 검사하지 않은 상태다.',
					visual: {
						kind: 'state',
						label: 'premiumEligible',
						value: 'true',
						status: 'unverified'
					}
				}
			],
			deepDiveIds: ['claim-and-policy'],
			scene: { kind: 'claim-path', focus: 'claim-card' }
		},
		{
			id: 'specify',
			kicker: 'Act 1 · Specify',
			title: '검사 조건을 먼저 정한다',
			lead: '응답을 받기 전에 어떤 필드와 조건을 검사할지 먼저 고정한다.',
			blocks: [
				{
					id: 'predicate-summary',
					kind: 'list',
					items: [
						'Type은 ITAV',
						'Credit 상태',
						'KRW 50,000,000.00 이상',
						'CreditLine은 합산하지 않음'
					]
				}
			],
			deepDiveIds: ['predicate-boundary'],
			scene: { kind: 'claim-path', focus: 'policy' }
		},
		{
			id: 'challenge',
			kicker: 'Act 2 · Challenge',
			title: '이번 가입 요청에 묶는다',
			lead: 'Verifier(검증자)는 제출 자료를 이번 가입 요청에 묶을 challenge(검증 요청값)와 유효 시간을 발급한다.',
			blocks: [
				{
					id: 'challenge-values',
					kind: 'code',
					language: 'json',
					value: `{"sessionId":"trace_zktls_001","challenge":"challenge_demo_001","audience":"premium.example","issuedAt":"2026-08-25T10:14:20+09:00","expiresAt":"2026-08-25T10:29:20+09:00"}`
				}
			],
			deepDiveIds: ['freshness-window'],
			scene: { kind: 'claim-path', focus: 'challenge' }
		},
		{
			id: 'fetch',
			kicker: 'Act 3 · Fetch',
			title: '은행 응답을 받는다',
			lead: 'Prover(제출자)는 로그인 자격 정보를 원본 서버인 api.bank.example에만 보내고 잔액 응답을 받는다.',
			blocks: [
				{
					id: 'balance-response',
					kind: 'code',
					language: 'json',
					value: syntheticBalanceFixtureJson,
					highlightLines: [8, 9, 11, 12, 13, 16]
				}
			],
			deepDiveIds: ['open-banking-fixture'],
			scene: { kind: 'claim-path', focus: 'response' }
		},
		{
			id: 'bind',
			kicker: 'Act 4 · Bind',
			title: '응답과 판정 규칙을 묶는다',
			lead: '출처, 응답 바이트, JSON 경로, 판정 조건을 같은 주장에 묶는다.',
			blocks: [
				{
					id: 'binding-flow',
					kind: 'figure',
					alt: 'API 응답 바이트가 JSON 해석 규칙과 필드 경로를 지나 잔액 조건에 결합되는 흐름',
					caption: '화면에 보이는 문자열이 아니라 원문 바이트와 해석 규칙을 함께 고정한다.',
					visual: {
						kind: 'flow',
						nodes: ['응답 바이트', 'JSON 해석기', 'Balance[0]', '판정 조건', '주장']
					}
				}
			],
			deepDiveIds: ['parser-binding'],
			scene: { kind: 'claim-path', focus: 'field-path' }
		},
		{
			id: 'prove',
			kicker: 'Act 5 · Prove',
			title: '잔액 대신 조건을 증명한다',
			lead: 'Prover는 실제 잔액 대신 정해 둔 조건이 참이라는 제출 자료를 만든다.',
			blocks: [
				{
					id: 'presentation-summary',
					kind: 'callout',
					tone: 'note',
					title: '검증자에게 보이는 값',
					text: 'premiumEligible: true와 이번 요청을 식별할 최소 맥락만 공개한다. 72,840,000원이라는 실제 잔액은 공개하지 않는다.'
				}
			],
			deepDiveIds: ['selective-disclosure'],
			scene: { kind: 'claim-path', focus: 'presentation' }
		},
		{
			id: 'verify',
			kicker: 'Act 6 · Verify',
			title: '제출 자료를 검사한다',
			lead: '검증자는 출처와 데이터 결합, challenge, 공개된 조건을 검사하고 검증 완료(verified) 결과를 낸다.',
			blocks: [
				{
					id: 'verification-state',
					kind: 'figure',
					alt: '제출 자료 검사를 통과해 verified가 된 주장 카드',
					caption: 'verified는 자료 검사가 통과했다는 뜻이며 가입 허용과는 다르다.',
					visual: {
						kind: 'state',
						label: 'premiumEligible',
						value: 'true',
						status: 'verified'
					}
				}
			],
			deepDiveIds: ['verification-checks'],
			scene: { kind: 'claim-path', focus: 'verified' }
		},
		{
			id: 'rely',
			kicker: 'Act 7 · Rely',
			title: '서비스가 가입을 결정한다',
			lead: 'premium.example은 검증 결과와 현재 가입 정책을 함께 보고 최종 허용 여부를 정한다.',
			blocks: [
				{
					id: 'reliance-gates',
					kind: 'table',
					caption: '검증과 최종 가입 결정은 서로 다른 단계다.',
					headers: ['단계', '묻는 질문', '결과'],
					rows: [
						['Verify', '제출 자료가 유효한가?', 'verified'],
						['Rely', '현재 서비스 정책으로 허용할 것인가?', 'approved 또는 denied']
					]
				}
			],
			deepDiveIds: ['reliance-policy'],
			scene: { kind: 'claim-path', focus: 'approved' }
		},
		{
			id: 'failure-replay',
			kicker: 'Act 8 · Failure replay',
			title: '실패 경로를 되감는다',
			lead: '제출 자료가 검사를 통과해도 시간이나 가입 기준이 달라지면 서비스의 결정은 바뀐다.',
			blocks: [
				{
					id: 'failure-cases',
					kind: 'table',
					caption: '같은 verified 결과가 서로 다른 최종 상태로 이어지는 두 사례',
					headers: ['변경', '검증', '최종 판정'],
					rows: [
						['자료 나이 480초, 허용 범위 300초', '통과', 'denied'],
						['가입 기준 5,000만 원 → 7,000만 원', '기존 조건은 통과', 'reproofRequired']
					]
				}
			],
			deepDiveIds: ['negative-test-classification'],
			scene: { kind: 'failure-replay', focus: 'policy-change' }
		}
	],
	deepDives: [
		{
			id: 'claim-and-policy',
			actId: 'membership-condition',
			title: '주장과 서비스 정책을 나누는 이유',
			summary:
				'제출 자료가 말하는 내용과 서비스가 실제로 가입을 허용하는 조건은 같은 판단이 아니다.',
			blocks: [
				{
					id: 'claim-policy-meaning',
					kind: 'paragraph',
					text: 'claim(검증할 주장)은 정해진 응답과 판정 조건에서 premiumEligible이 true였다는 진술이다. 이 자료가 검증 완료(verified) 상태가 되어도 premium.example이 가입을 허용했다는 뜻은 아니다.'
				},
				{
					id: 'claim-policy-owners',
					kind: 'table',
					caption: '검증할 주장과 서비스 정책은 주체도 변경 시점도 다르다.',
					headers: ['구분', '누가 정하는가', '무엇을 답하는가'],
					rows: [
						[
							'검증할 주장',
							'Prover와 Verifier가 합의한 형식',
							'제출 자료가 지정한 조건을 만족하는가?'
						],
						['서비스 정책', 'premium.example', '지금 이 가입 요청을 받아들일 것인가?']
					]
				},
				{
					id: 'claim-policy-version',
					kind: 'paragraph',
					text: '서비스는 허용하는 자료의 나이, 가입 기준 금액, 사용 대상, 받아들일 증명 방식을 바꿀 수 있다. 최종 가입 결정을 재현하려면 검증 결과와 당시의 정책 버전을 함께 봐야 한다.'
				}
			]
		},
		{
			id: 'predicate-boundary',
			actId: 'specify',
			title: '잔액 조건에 포함되는 값과 제외되는 값',
			summary: 'ITAV 잔액과 CreditLine을 섞으면 같은 숫자라도 다른 뜻이 된다.',
			blocks: [
				{
					id: 'predicate-entry-selection',
					kind: 'paragraph',
					text: 'Data.Balance는 배열이므로 먼저 어느 항목을 판정할지 골라야 한다. 이 예시는 AccountId가 acct_demo_7F21이고 Type이 ITAV인 항목을 사용한다. AccountId는 API 안의 계좌 식별자일 뿐, 그 자체로 제출자의 계좌 소유권까지 증명하지 않는다.'
				},
				{
					id: 'predicate-expression',
					kind: 'code',
					language: 'text',
					value: `Type == ITAV
AND CreditDebitIndicator == Credit
AND Amount.Currency == KRW
AND decimal(Amount.Amount) >= 50000000.00
AND (CreditLine is absent OR every CreditLine.Included == false)`
				},
				{
					id: 'predicate-credit-line',
					kind: 'paragraph',
					text: 'CreditLine.Included가 false라는 값은 표시된 잔액에 그 신용한도를 합산하지 않았다는 뜻이다. 신용한도가 없거나 부채가 없다는 뜻은 아니다. 72,840,000원 역시 이 응답 시점의 가용 잔액이지 총자산이나 순자산이 아니다.'
				}
			]
		},
		{
			id: 'freshness-window',
			actId: 'challenge',
			title: '검증 요청 만료와 서비스 최신성',
			summary: 'challenge의 만료 시각과 서비스가 요구하는 응답 최신성은 따로 검사한다.',
			blocks: [
				{
					id: 'freshness-two-clocks',
					kind: 'paragraph',
					text: 'challenge(검증 요청값)는 제출 자료를 이번 가입 요청과 premium.example에 묶는다. expiresAt은 그 요청값을 언제까지 받을지 정한다. 잔액이 언제 관측됐는지는 API 응답의 DateTime이 따로 알려 준다.'
				},
				{
					id: 'freshness-clock-table',
					kind: 'table',
					caption: '서로 다른 시간값이 맡는 역할',
					headers: ['시간값', '이 예시의 값', '검사'],
					rows: [
						['challenge.issuedAt', '2026-08-25T10:14:20+09:00', '이번 검증 요청이 시작된 시각'],
						[
							'challenge.expiresAt',
							'2026-08-25T10:29:20+09:00',
							'요청값을 받아들일 수 있는 마지막 시각'
						],
						['Balance.DateTime', '2026-08-25T10:14:32+09:00', '잔액이 관측된 시각']
					]
				},
				{
					id: 'freshness-policy-rule',
					kind: 'paragraph',
					text: 'challenge가 아직 유효해도 잔액 자료의 나이가 서비스 허용 범위를 넘을 수 있다. 반대로 잔액이 충분히 최근이어도 만료된 challenge를 다시 쓰면 이번 가입 요청에 맞는 제출 자료로 받아들이지 않는다.'
				}
			]
		},
		{
			id: 'open-banking-fixture',
			actId: 'fetch',
			title: 'UK Open Banking v4.0을 참고한 테스트 응답',
			summary: '필드 구조만 공개 표준을 참고했으며 주소와 계좌, 통화, 잔액은 모두 교육용이다.',
			blocks: [
				{
					id: 'fixture-scope',
					kind: 'paragraph',
					text: '합성 테스트 응답의 뼈대는 UK Open Banking Read/Write API v4.0의 OBReadBalance1을 참고했다. Data.Balance가 배열이고 각 항목에 Amount, CreditDebitIndicator, Type, DateTime이 놓이는 구조를 따른다.'
				},
				{
					id: 'fixture-field-meanings',
					kind: 'table',
					caption: '이 글이 판정에 사용하는 필드',
					headers: ['필드', '이 예시의 값', '읽는 법'],
					rows: [
						['Type', 'ITAV', '업무일 중 지정 시점의 가용 잔액'],
						['CreditDebitIndicator', 'Credit', '잔액의 부호 방향'],
						['Amount', '72840000.00 KRW', '통화와 금액 문자열을 함께 해석'],
						['CreditLine[0].Included', 'false', '표시된 잔액에 해당 한도를 합산하지 않음']
					]
				},
				{
					id: 'fixture-disclaimer',
					kind: 'callout',
					tone: 'note',
					title: '실제 은행 응답이 아니다',
					text: 'bank.example, acct_demo_7F21, KRW, 72,840,000원은 설명을 위해 만든 값이다. 이 글은 v4.0 구조에 맞춰 만든 합성 테스트 응답을 쓰며, 조사일 현재 저장소의 최신 릴리스인 v4.0.1 전체 구현을 재현한다고 주장하지 않는다.'
				}
			]
		},
		{
			id: 'parser-binding',
			actId: 'bind',
			title: '응답 바이트를 주장에 묶는 JSON 해석 규칙',
			summary: '필드 경로나 숫자 해석이 달라지면 같은 응답도 다른 주장이 될 수 있다.',
			blocks: [
				{
					id: 'parser-not-search',
					kind: 'paragraph',
					text: 'parser(해석기)는 화면에서 72840000.00이라는 문자열만 찾지 않는다. 응답 원문을 JSON으로 읽고 Data.Balance 배열에서 대상 항목을 고른 뒤 Amount.Amount와 Amount.Currency를 정해 둔 규칙으로 해석한다.'
				},
				{
					id: 'parser-decimal-rule',
					kind: 'paragraph',
					text: '금액은 JSON 문자열이므로 십진수 규칙을 명시해야 한다. 부동소수점으로 바꾸면서 반올림하거나 천 단위를 잘못 처리하면 경계값 판정이 달라질 수 있다. 이 예시는 50000000.00과 정확한 십진수로 비교한다.'
				},
				{
					id: 'parser-binding-flow',
					kind: 'figure',
					alt: '응답 원문, JSON 해석 규칙, 필드 경로, 십진수 비교가 하나의 검증할 주장에 묶이는 흐름',
					caption:
						'검증 절차도 응답 바이트가 정해 둔 구조와 십진수 규칙으로 해석됐음을 확인해야 같은 판정을 낸다.',
					visual: {
						kind: 'flow',
						nodes: [
							'response bytes',
							'JSON 규칙',
							'Balance 항목 선택',
							'decimal 비교',
							'premiumEligible'
						]
					}
				}
			]
		},
		{
			id: 'selective-disclosure',
			actId: 'prove',
			title: '선택 공개와 영지식 증명은 무엇이 다른가',
			summary: '바이트 일부를 공개하는 방식과 숨긴 값의 조건을 증명하는 방식은 구분해야 한다.',
			blocks: [
				{
					id: 'disclosure-zkp-distinction',
					kind: 'paragraph',
					text: 'selective disclosure(선택 공개)는 TLS 통신 기록 가운데 고른 바이트를 보여 주고 나머지를 가린다. 금액 필드를 공개하면 Verifier가 직접 72,840,000원을 읽을 수 있지만, 실제 잔액을 숨긴 채 5,000만 원 이상이라는 결과만 내는 기능은 아니다.'
				},
				{
					id: 'disclosure-zkp-table',
					kind: 'table',
					caption: '공개 범위에 따라 필요한 기법이 달라진다.',
					headers: ['방식', 'Verifier가 보는 것', '이 예시에서의 결과'],
					rows: [
						['선택 공개', '선택한 응답 바이트', 'Amount를 열면 실제 잔액도 보임'],
						['영지식 증명', '정해진 명제와 증명', '잔액은 숨기고 5,000만 원 이상만 확인']
					]
				},
				{
					id: 'disclosure-zkp-boundary',
					kind: 'callout',
					tone: 'decision',
					title: '이 장면의 구현 경계',
					text: '본문의 premiumEligible: true는 TLS 기반 출처 확인과 비공개 비교를 결합한 개념 모델이다. 특정 zkTLS 구현이 이 비교를 자동으로 제공한다고 가정하지 않는다.'
				}
			]
		},
		{
			id: 'verification-checks',
			actId: 'verify',
			title: 'Verifier가 확인하는 항목',
			summary: '출처, 세션 결합, challenge, 공개 범위, 판정 조건을 각각 검사한다.',
			blocks: [
				{
					id: 'verification-separate-checks',
					kind: 'paragraph',
					text: '검증자는 proofValid 같은 플래그 하나만 읽지 않는다. 제출 자료가 기대한 원본 서버, 이번 challenge, 정해 둔 JSON 해석 규칙과 판정 조건에 묶였는지 각각 검사해야 한다.'
				},
				{
					id: 'verification-check-table',
					kind: 'table',
					caption: 'verified에 이르기 전의 주요 검사',
					headers: ['검사', '실패하면 알 수 없는 것'],
					rows: [
						['원본 서버와 세션', '어느 서버 통신에서 나온 자료인가'],
						['challenge와 사용 대상', '이번 premium.example 요청에 낸 자료인가'],
						['응답·parser·필드 경로', '어떤 원문 값을 판정했는가'],
						['판정 조건과 공개 결과', 'premiumEligible: true가 무엇을 뜻하는가']
					]
				},
				{
					id: 'verification-output-boundary',
					kind: 'paragraph',
					text: '모든 검사를 통과하면 결과는 verified다. 이는 제출 자료가 정해 둔 구조와 암호학적 검사를 통과했다는 뜻일 뿐, 제출자의 신원이나 계좌 소유권, 가입 허용을 보장하지 않는다.'
				}
			]
		},
		{
			id: 'reliance-policy',
			actId: 'rely',
			title: '검증 이후에도 남는 서비스 판단',
			summary: '가입 가능 여부에는 서비스의 현재 기준 금액, 대상, 시간 정책이 반영된다.',
			blocks: [
				{
					id: 'reliance-current-policy',
					kind: 'paragraph',
					text: 'premium.example은 verified 결과를 입력으로 받되, 그 결과만으로 가입을 확정하지 않는다. 현재 기준 금액, 자료의 유효 시간, 허용한 검증 방식, 가입 대상과 같은 서비스 정책을 이어서 적용한다.'
				},
				{
					id: 'reliance-decision-table',
					kind: 'table',
					caption: '검증 성공 뒤에도 가능한 최종 상태',
					headers: ['검증 결과', '현재 정책 검사', '최종 상태'],
					rows: [
						['verified', '모두 통과', 'approved'],
						['verified', '자료가 너무 오래됨', 'denied'],
						['verified', '기준 금액이 변경됨', 'reproofRequired']
					]
				},
				{
					id: 'reliance-audit-context',
					kind: 'paragraph',
					text: '나중에 결정을 설명하려면 어떤 제출 자료를 검사했는지뿐 아니라 당시의 정책 버전과 판정 시각도 남겨야 한다. verified와 approved를 한 상태값으로 합치면 정책 변경으로 생긴 거절을 증명 실패처럼 잘못 읽게 된다.'
				}
			]
		},
		{
			id: 'negative-test-classification',
			actId: 'failure-replay',
			title: '거절, 탐지, 사각지대로 실패를 나누기',
			summary:
				'어느 단계가 실패를 막는지, 이상을 알아채기만 하는지, 아예 보지 못하는지를 구분한다.',
			blocks: [
				{
					id: 'negative-classes',
					kind: 'paragraph',
					text: '거절(reject)은 해당 단계가 입력을 받아들이지 않고 흐름을 멈춘 경우다. 탐지(detect)는 이상을 알아냈지만 별도 정책이 후속 행동을 정하는 경우다. 사각지대(blind spot)는 현재 제출 자료와 검사만으로 판단할 수 없는 범위다.'
				},
				{
					id: 'negative-classification-table',
					kind: 'table',
					caption: '실패를 발견하는 지점과 실제 조치',
					headers: ['사례', '분류', '판정 지점'],
					rows: [
						['challenge 값 또는 결합이 맞지 않음', 'reject', '제출 자료 검증'],
						['자료 나이 480초, 허용 범위 300초', 'detect → denied', '서비스 최신성 정책'],
						['가입 기준 5,000만 원 → 7,000만 원', 'detect → reproofRequired', '현재 가입 정책'],
						['AccountId만으로 실제 계좌 소유자 확인', 'blind spot', '별도의 사용자–계좌 결합 필요']
					]
				},
				{
					id: 'negative-proof-boundary',
					kind: 'callout',
					tone: 'failure',
					title: '암호학적으로 유효한 제출 자료가 오래된 정책을 되살리지는 않는다',
					text: '기존 5,000만 원 조건에 맞춘 자료가 암호학적으로 유효해도 현재 7,000만 원 기준을 답하지는 못한다. 이 경우 기존 제출 자료를 무효로 취급하는 대신 새 조건으로 다시 제출하도록 요구한다.'
				}
			]
		}
	],
	references: [
		{
			actId: 'fetch',
			label: 'UK Open Banking Read/Write API v4.0 — Balances',
			href: 'https://openbankinguk.github.io/read-write-api-site3/v4.0/resources-and-data-models/aisp/Balances.html',
			note: 'OBReadBalance1, Data.Balance 배열과 잔액 필드의 공식 데이터 사전. 2026-08-25 확인.'
		},
		{
			actId: 'fetch',
			label: 'Open Banking UK — Account Information OpenAPI v4.0',
			href: 'https://github.com/OpenBankingUK/read-write-api-specs/blob/v4.0/dist/openapi/account-info-openapi.yaml',
			note: '계좌 잔액 endpoint와 응답 schema의 공식 v4.0 OpenAPI 원문. 2026-08-25 확인.'
		},
		{
			actId: 'specify',
			label: 'Open Banking UK — External and Internal Code Sets',
			href: 'https://github.com/OpenBankingUK/External_Internal_CodeSets/blob/main/ISO_External_Codeset.csv#L36',
			note: 'ITAV를 InterimAvailable로 정의한 공식 코드셋. 2026-08-25 확인.'
		},
		{
			actId: 'fetch',
			label: 'Open Banking Read/Write API Specifications v4.0.1',
			href: 'https://github.com/OpenBankingUK/read-write-api-specs/releases/tag/v4.0.1',
			note: '합성 테스트 응답이 참고한 v4.0과 구분하기 위한 조사일 현재 저장소 최신 릴리스. 2026-08-25 확인.'
		}
	],
	navigation: {
		next: {
			title: 'TLS 1.3 Handshake와 Record Protocol',
			href: '/ko/notebook/zktls/tls13/'
		}
	}
});
