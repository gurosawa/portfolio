import { defineStory } from '$lib/notebook/story/schema';

export const tlsnotaryStory = defineStory({
	meta: {
		slug: 'tlsnotary',
		locale: 'ko',
		title: 'TLSNotary와 MPC-TLS: Prover·Verifier·Notary의 역할과 데이터 흐름',
		description:
			'한 TLS 세션에서 은행 서버(Server), Prover, Notary, 애플리케이션 Verifier가 각각 무엇을 보고 만들고 검사하는지 살펴본다.',
		canonicalPath: '/ko/notebook/zktls/tlsnotary/',
		publishedAt: '2026-08-26',
		technicallyReviewedAt: '2026-08-26',
		readingMinutes: '10–15분'
	},
	opening: {
		question: '은행 잔액은 숨긴 채 조건만 증명할 때, 네 참여자 가운데 누가 실제 숫자를 보게 될까?',
		claim: {
			label: 'premium.example 제출 자료',
			fields: { premiumEligible: true, disclosedBalance: false },
			status: 'unverified'
		}
	},
	mobileOverview: {
		alt: 'Server에서 Prover와 Notary의 MPC-TLS 세션을 거쳐 애플리케이션 Verifier의 판정으로 이어지는 전체 흐름',
		nodes: ['Server', 'Prover', 'Notary', 'Session Header', '제출 자료', 'Verifier']
	},
	acts: [
		{
			id: 'who-sees-balance',
			kicker: 'Prologue',
			title: '누가 잔액을 보는가',
			lead: '목표는 72,840,000원이라는 숫자를 전달하는 일이 아니다. api.bank.example의 응답에 그 값이 있었고 정해 둔 5,000만 원 조건을 넘는다는 주장을 출처 확인 근거와 함께 제출하는 일이다.',
			blocks: [
				{
					id: 'visibility-question',
					kind: 'paragraph',
					text: 'Prover(제출자)는 자신의 은행 응답을 읽는다. Notary(공증 역할)는 TLS 세션 검증을 위한 공동 계산에 참여하지만 평문 응답과 서버 이름을 알지 않도록 설계된다. 나중에 자료를 받는 Verifier(검증자)는 Prover가 선택 공개한 범위와 별도로 증명한 조건만 본다.'
				},
				{
					id: 'hidden-balance-state',
					kind: 'figure',
					alt: 'Prover의 화면에는 실제 잔액이 있고 Notary와 Verifier의 화면에는 가려진 값과 premiumEligible만 있는 장면',
					caption: '같은 세션에 참여해도 모든 참여자가 같은 데이터를 보는 것은 아니다.',
					visual: {
						kind: 'matrix',
						columns: ['자료', 'Prover', 'Notary', 'Verifier'],
						rows: [
							['실제 잔액', '봄', '보지 않음', '보지 않음'],
							['premiumEligible', '만듦', '내용을 알지 않음', '검사함']
						]
					}
				}
			],
			deepDiveIds: ['plain-text-visibility'],
			scene: { kind: 'actor-visibility', focus: 'balance' }
		},
		{
			id: 'participants',
			kicker: 'Act 1',
			title: 'Server, Prover, Verifier, Notary',
			lead: '각 이름은 사람이 아니라 프로토콜에서 맡는 역할이다. 같은 조직이 여러 역할을 운영할 수도 있지만, 어떤 검사를 누가 맡는지는 분리해서 읽어야 한다.',
			blocks: [
				{
					id: 'actor-roles',
					kind: 'table',
					caption: '본문에서 사용하는 네 역할',
					headers: ['역할', '하는 일', '이 사례의 대상'],
					rows: [
						['Server', 'TLS 응답을 제공', 'api.bank.example'],
						['Prover', '응답을 받고 제출 자료를 만듦', '프리미엄 가입 신청자'],
						['Notary', 'MPC-TLS에 참여하고 Session Header에 서명', '일반 목적 공증 역할'],
						[
							'Verifier',
							'서명과 공개 내용을 검사하고 검증 결과를 서비스 정책 판단에 넘김',
							'premium.example 검증 서비스'
						]
					]
				},
				{
					id: 'role-separation-note',
					kind: 'paragraph',
					text: '직접 검증 방식에서는 애플리케이션 Verifier가 MPC-TLS에도 참여할 수 있다. 본편은 세션 검증을 일반 목적 Notary에 맡기고, 별도의 애플리케이션 Verifier가 나중에 presentation(제출 자료)을 받는 흐름을 따른다.'
				}
			],
			deepDiveIds: ['direct-verifier-mode'],
			scene: { kind: 'actor-visibility', focus: 'roles' }
		},
		{
			id: 'session-preparation',
			kicker: 'Act 2',
			title: '세션 준비',
			lead: 'Prover와 Notary는 `trace_tlsn12_001` 세션의 한도와 검증 조건을 준비한다. 로그인 자격 정보와 API 응답은 아직 Notary에게 전달되지 않는다.',
			blocks: [
				{
					id: 'session-limits',
					kind: 'paragraph',
					text: 'MPC 계산 자원을 미리 할당해야 하므로 보낼 데이터와 받을 데이터의 최대 크기, record 수 같은 범위를 정한다. Notary는 허용된 세션인지 확인하고, Prover는 api.bank.example의 서버 인증서를 검증할 신뢰 저장소(root store)와 요청을 준비한다.'
				},
				{
					id: 'session-config',
					kind: 'code',
					language: 'json',
					value: `{
  "sessionId": "trace_tlsn12_001",
  "mode": "mpc",
  "tlsVersion": "1.2",
  "serverName": "api.bank.example",
  "sentLimit": 4096,
  "receivedLimit": 32768
}`
				}
			],
			deepDiveIds: ['version-boundary', 'resource-limits'],
			scene: { kind: 'actor-visibility', focus: 'session-config' }
		},
		{
			id: 'mpc-tls-request',
			kicker: 'Act 3',
			title: 'MPC-TLS 요청',
			lead: 'Prover는 Server와 실제 네트워크 연결을 맺고, TLS의 암호 연산은 Notary와 나눠 수행한다.',
			blocks: [
				{
					id: 'key-share-flow',
					kind: 'paragraph',
					text: 'Prover와 Notary는 TLS 세션 키(session key) 전체를 한쪽이 단독으로 갖지 않도록 각자의 키 지분(share)을 계산한다. 둘은 공동 연산으로 암호화된 요청을 만든다. 응답은 설정에 따라 연결 중 MPC로 인증·복호화하거나, 암호문을 버퍼에 저장했다가 연결이 인증되고 닫힌 뒤 Notary의 키 지분을 받은 Prover가 로컬에서 복호화한다. 어느 방식이든 응답 평문은 Prover에게만 공개되며 Server 쪽에서는 일반 TLS 연결처럼 보인다.'
				},
				{
					id: 'mpc-request-path',
					kind: 'figure',
					alt: 'Prover가 Server와 연결하고 Notary와 키 지분 및 공동 TLS 연산을 수행하는 구조',
					caption: 'Notary가 네트워크 중간에서 평문을 받아 전달하는 구조가 아니다.',
					visual: { kind: 'flow', nodes: ['Prover', 'MPC 키 지분', '암호화된 TLS', 'Server'] }
				}
			],
			deepDiveIds: ['mpc-message-roles', 'proxy-mode'],
			scene: { kind: 'actor-visibility', focus: 'mpc-tls' }
		},
		{
			id: 'private-response',
			kicker: 'Act 4',
			title: '비공개 응답',
			lead: '온라인 또는 지연 복호화가 끝나면 Prover는 은행 응답 평문을 얻는다. Notary는 그 내용을 직접 읽지 않는다.',
			blocks: [
				{
					id: 'private-response-explanation',
					kind: 'paragraph',
					text: 'Notary는 세션 검증에 필요한 공동 계산에 참여하지만 계좌번호와 잔액, Authorization 헤더 같은 민감한 평문은 보지 않는다.'
				},
				{
					id: 'private-balance-snapshot',
					kind: 'code',
					language: 'json',
					value: `{
  "AccountId": "acct_demo_7F21",
  "Amount": { "Amount": "72840000.00", "Currency": "KRW", "SubType": "BCUR" },
  "Type": "ITAV",
  "DateTime": "2026-08-25T10:14:32+09:00"
}`
				},
				{
					id: 'response-visibility',
					kind: 'table',
					caption: '응답을 받은 직후 각 참여자에게 보이는 것',
					headers: ['자료', 'Server', 'Prover', 'Notary'],
					rows: [
						['요청·응답 평문', '자신이 처리함', '봄', '보지 않음'],
						['MPC 내부 TLS 키 지분', '모름', '일부', '일부'],
						['서버 이름', '자신의 이름', '앎', '숨겨짐']
					]
				}
			],
			deepDiveIds: ['server-name-privacy'],
			scene: { kind: 'actor-visibility', focus: 'private-response' }
		},
		{
			id: 'notarization',
			kicker: 'Act 5 · Notarization',
			title: 'Session Header에 Notary 서명을 받는다',
			lead: 'Prover는 TLS 통신 기록과 서버 식별 자료에 대한 commitment(값을 숨긴 채 고정한 결과)를 만들고, Notary는 이를 담은 Session Header에 서명한다.',
			blocks: [
				{
					id: 'session-header-explanation',
					kind: 'paragraph',
					text: 'Notary의 서명은 평문을 읽고 그 내용을 보증했다는 뜻이 아니다. 공동으로 검증한 TLS 세션과 연결된 commitment가 Session Header에 담겼음을 확인하게 해 준다.'
				},
				{
					id: 'session-header-flow',
					kind: 'figure',
					alt: 'TLS 통신 기록 commitment와 서버 식별 자료 commitment가 Session Header로 모여 Notary 서명을 받는 흐름',
					caption: '서명된 Session Header는 나중에 다른 Verifier에게 제출할 수 있는 자료가 된다.',
					visual: {
						kind: 'flow',
						nodes: ['통신 기록 commitment', '서버 자료 commitment', 'Session Header', 'Notary 서명']
					}
				}
			],
			deepDiveIds: ['session-header-details'],
			scene: { kind: 'actor-visibility', focus: 'session-header' }
		},
		{
			id: 'selective-disclosure',
			kicker: 'Act 6',
			title: '선택 공개',
			lead: 'Prover는 presentation을 만들 때 공개할 바이트 범위를 고른다. 숨긴 부분은 Verifier에게 가려진 채로 남는다.',
			blocks: [
				{
					id: 'disclosure-vs-zkp',
					kind: 'paragraph',
					text: 'TLSNotary의 선택 공개는 고른 TLS 통신 기록 바이트를 commitment에 맞춰 보여 주는 기능이다. 72,840,000원을 숨긴 채 “5,000만 원 이상”이라는 비교 결과가 자동으로 생기지는 않는다. 본 사례처럼 실제 잔액을 숨기고 premiumEligible만 공개하려면, 숨긴 응답과 비교 조건을 연결해 검증하는 별도의 영지식 증명(ZKP) 등이 필요하다.'
				},
				{
					id: 'disclosure-layers',
					kind: 'table',
					caption: '서로 다른 두 기능',
					headers: ['기능', 'Verifier가 얻는 것', '이 사례에서의 역할'],
					rows: [
						[
							'TLSNotary 선택 공개',
							'선택한 TLS 통신 기록 바이트와 출처 확인 자료',
							'필요한 HTTP 맥락 공개'
						],
						['추가 ZKP', '숨긴 값에 대한 조건 결과', 'premiumEligible: true']
					]
				}
			],
			deepDiveIds: ['additional-zkp'],
			scene: { kind: 'actor-visibility', focus: 'presentation' }
		},
		{
			id: 'application-verification',
			kicker: 'Act 7',
			title: '애플리케이션 검증',
			lead: 'premium.example의 Verifier는 허용한 Notary인지 확인하고 서명을 검증한 뒤, commitment를 여는 확인 자료(opening), 서버 식별 자료, 공개된 내용을 순서대로 검사한다.',
			blocks: [
				{
					id: 'verification-order',
					kind: 'list',
					items: [
						'Notary가 서비스의 허용 목록에 있는지 확인',
						'Session Header의 Notary 서명을 검증',
						'opening이 commitment에 맞는지 검사',
						'서버 식별 자료가 commitment와 맞는지 검사',
						'서버 이름을 식별 자료와 대조',
						'공개 HTTP·JSON과 추가 판정 조건 증명을 애플리케이션 규칙으로 검사'
					]
				},
				{
					id: 'verified-not-approved',
					kind: 'callout',
					tone: 'decision',
					title: '여기서도 verified와 approved는 다르다',
					text: '제출 자료가 암호학적 검사를 통과해도 challenge가 만료됐거나 현재 가입 기준이 바뀌면 서비스는 가입을 허용하지 않을 수 있다.'
				}
			],
			deepDiveIds: ['presentation-verification'],
			scene: { kind: 'actor-visibility', focus: 'verifier' }
		},
		{
			id: 'policy-visibility-matrix',
			kicker: 'Act 8 · 참여자별 가시성',
			title: '누가 무엇을 보고 검사하는가',
			lead: '암호학적 검증이 성공해도 판단은 끝나지 않는다. 어떤 실패를 어느 검사가 막고, 누구를 운영상 신뢰하는지까지 확인해야 한다.',
			blocks: [
				{
					id: 'visibility-matrix',
					kind: 'table',
					caption: '참여자별로 보는 것, 만드는 것, 검사하는 것',
					headers: ['역할', '보는 것', '만드는 것', '검사하는 것'],
					rows: [
						['Server', '요청과 자신의 응답', 'TLS 응답', '일반 TLS 요청'],
						[
							'Prover',
							'전체 평문과 자신의 비밀',
							'commitment, presentation, 추가 ZKP',
							'Notary가 올바르게 참여했는지'
						],
						[
							'Notary',
							'MPC 내부 TLS 키 지분과 commitment',
							'서명된 Session Header',
							'TLS 세션의 공동 계산'
						],
						[
							'Verifier',
							'선택 공개 내용과 premiumEligible',
							'검증 결과',
							'서명, opening, 서버 이름, 조건'
						]
					]
				},
				{
					id: 'failure-comparison',
					kind: 'table',
					caption: '세 실패가 멈추는 지점',
					headers: ['실패', '제출 자료 검사', '정책 판단', '결과'],
					rows: [
						[
							'신뢰 목록 밖의 Notary',
							'서명 계산은 맞을 수 있음',
							'운영상 신뢰하지 않음',
							'정책 거절'
						],
						['commitment와 opening 불일치', '검사 실패', '진입하지 않음', '암호 검사 거절'],
						[
							'서버 이름이 api.bank.example이 아님',
							'api.bank.example의 자료라고 확인할 수 없음',
							'출처 조건 불충족',
							'서버 출처 검사 거절'
						]
					]
				}
			],
			deepDiveIds: ['trust-assumption-replay'],
			scene: { kind: 'failure-replay', focus: 'visibility-matrix' }
		}
	],
	deepDives: [
		{
			id: 'plain-text-visibility',
			actId: 'who-sees-balance',
			title: 'Notary가 평문과 서버 이름을 보지 않는 방식',
			summary:
				'Notary는 TLS 계산에 참여하지만 commitment에 담긴 평문과 서버 식별 정보를 직접 알지 않도록 설계된다.',
			blocks: [
				{
					id: 'plain-text-visibility-p1',
					kind: 'paragraph',
					text: '온라인 복호화에서는 Prover와 Notary가 각자의 키 지분으로 record 인증과 복호화 연산을 함께 수행한다. 지연 복호화에서는 연결이 인증되고 닫힌 뒤 Notary가 키 지분을 공개하고, Prover가 저장한 응답 암호문을 로컬에서 복호화한다. 연결 중에는 어느 한쪽의 키 지분만으로 전체 세션 키를 얻을 수 없다.'
				},
				{
					id: 'plain-text-visibility-p2',
					kind: 'paragraph',
					text: 'Notarization 단계에서도 Notary는 평문을 받아 읽고 서명하지 않는다. Prover가 만든 평문 commitment와 서버 식별 자료 commitment를 담은 Session Header에 서명한다.'
				},
				{
					id: 'plain-text-visibility-table',
					kind: 'table',
					caption: 'Notary가 받는 자료와 알지 못하는 내용',
					headers: ['받는 자료', '직접 알 수 없는 내용'],
					rows: [['MPC 키 지분, commitment', 'Authorization 헤더, 잔액 평문, 서버 이름']]
				}
			]
		},
		{
			id: 'direct-verifier-mode',
			actId: 'participants',
			title: '애플리케이션 Verifier가 세션에 직접 참여하는 방식',
			summary:
				'별도 Notary 없이 최종 Verifier가 Prover와 MPC-TLS를 수행하고 곧바로 공개 내용을 검사할 수 있다.',
			blocks: [
				{
					id: 'direct-verifier-p1',
					kind: 'paragraph',
					text: '직접 방식에서는 세션 당시의 Verifier와 나중에 자료를 검사하는 Verifier가 같다. 일반 목적 Notary의 서명을 신뢰 목록과 대조하는 단계가 줄어든다.'
				},
				{
					id: 'direct-verifier-p2',
					kind: 'paragraph',
					text: '대신 그 Verifier가 세션 시간에 온라인이어야 한다. 제출 자료를 다른 서비스로 옮겨 쓰기도 본편의 notarization 흐름보다 어렵다.'
				},
				{
					id: 'direct-verifier-flow',
					kind: 'figure',
					alt: 'Prover와 애플리케이션 Verifier가 직접 MPC-TLS를 수행한 뒤 같은 Verifier가 공개 자료를 검사하는 흐름',
					caption: '별도 Notary 없이 애플리케이션 Verifier가 MPC-TLS 세션 검증에도 직접 참여한다.',
					visual: { kind: 'flow', nodes: ['Prover', '직접 참여 Verifier', 'Server', '검증'] }
				}
			]
		},
		{
			id: 'version-boundary',
			actId: 'session-preparation',
			title: '확인 날짜와 릴리스에 따라 달라지는 구현 정보',
			summary:
				'2026-08-25 공식 문서는 TLS 1.2 지원을 명시하고 TLS 1.3은 로드맵으로 둔다. 최신 GitHub 릴리스는 사전 릴리스(pre-release)인 v0.1.0-alpha.15다.',
			blocks: [
				{
					id: 'version-boundary-p1',
					kind: 'paragraph',
					text: '앞 글이 설명한 TLS 1.3 메시지 흐름과 이 글의 TLSNotary 실행 예시는 같은 버전이 아니다. 그래서 세션 ID도 trace_tlsn12_001로 구분했다.'
				},
				{
					id: 'version-boundary-p2',
					kind: 'paragraph',
					text: '알파 릴리스의 자료 형식과 API는 바뀔 수 있다. 본문은 참여자와 데이터 흐름처럼 안정적인 개념만 다루고, 릴리스와 지원 버전은 이 심화 설명과 참고문헌에 확인 날짜를 함께 남긴다.'
				},
				{
					id: 'version-boundary-table',
					kind: 'table',
					caption: '2026-08-25 확인 상태',
					headers: ['항목', '상태'],
					rows: [
						['TLS 지원', 'TLS 1.2'],
						['TLS 1.3', '로드맵'],
						['GitHub 릴리스', 'v0.1.0-alpha.15 (사전 릴리스)']
					]
				}
			]
		},
		{
			id: 'resource-limits',
			actId: 'session-preparation',
			title: 'MPC 세션의 데이터 한도를 미리 잡는 이유',
			summary:
				'MPC 모드는 계산 자원을 미리 준비하므로 보내고 받을 데이터와 record의 최대치를 설정한다.',
			blocks: [
				{
					id: 'resource-limits-p1',
					kind: 'paragraph',
					text: '한도는 애플리케이션 정책이 아니라 실행 자원 계획이다. 응답이 예상보다 커지면 데이터가 거짓인 것이 아니라 준비한 세션 범위를 넘은 것이다.'
				},
				{
					id: 'resource-limits-p2',
					kind: 'paragraph',
					text: '예제의 4 KiB 전송, 32 KiB 수신 값은 교육용 예시값이다. 실제 배포 값은 대상 API 응답과 성능 측정을 보고 정한다.'
				},
				{
					id: 'resource-limits-table',
					kind: 'table',
					caption: '한도 초과와 잔액 조건 불충족의 구분',
					headers: ['상태', '의미'],
					rows: [
						['세션 한도 초과', '실행 준비 범위 부족'],
						['판정 조건이 거짓', '정해 둔 잔액 조건 불충족']
					]
				}
			]
		},
		{
			id: 'mpc-message-roles',
			actId: 'mpc-tls-request',
			title: 'MPC-TLS에서 메시지가 맡는 역할',
			summary: '세부 암호식 대신 키 지분 준비, 암호화 요청 생성, 응답 인증과 복호화의 순서를 본다.',
			blocks: [
				{
					id: 'mpc-message-roles-p1',
					kind: 'paragraph',
					text: 'Prover가 Server와 실제 소켓을 유지한다. Notary는 그 소켓으로 들어온 TLS 메시지에 필요한 암호 연산을 Prover와 공동으로 수행한다.'
				},
				{
					id: 'mpc-message-roles-p2',
					kind: 'paragraph',
					text: '둘 중 한쪽이 가진 키 지분만으로는 전체 세션 키를 얻지 못한다. 키 지분 분리와 공동 record 인증은 Prover가 임의 응답을 끼워 넣는 일과 Notary가 평문을 읽는 일을 각각 제한한다.'
				},
				{
					id: 'mpc-message-roles-flow',
					kind: 'figure',
					alt: '키 지분 준비, 암호화 요청 공동 생성, Server 응답, 공동 인증과 복호화 순서',
					caption: '메시지 역할만 표시한 교육용 흐름이다.',
					visual: { kind: 'flow', nodes: ['키 지분', '요청 암호화', '서버 응답', '인증', '복호화'] }
				}
			]
		},
		{
			id: 'proxy-mode',
			actId: 'mpc-tls-request',
			title: 'Proxy mode가 바꾸는 경로와 가정',
			summary:
				'Proxy mode에서는 Verifier가 암호화된 TLS 트래픽을 전달하고, 이후 ZKP로 관찰한 트래픽이 정상 TLS 세션에서 나온 것인지 검증한다.',
			blocks: [
				{
					id: 'proxy-mode-p1',
					kind: 'paragraph',
					text: 'Verifier는 Prover와 Server 사이의 네트워크 proxy로서 암호화된 패킷을 전달하고 기록한다. 평문을 직접 읽지는 않지만 Server로 가는 경로에 놓인다.'
				},
				{
					id: 'proxy-mode-p2',
					kind: 'paragraph',
					text: 'MPC-TLS보다 대역폭과 검증 지연을 줄이는 대신 Verifier에서 Server까지의 네트워크 경로가 올바르다는 가정이 추가된다. 공식 문서도 MPC-TLS를 기본 모드로 둔다.'
				},
				{
					id: 'proxy-mode-table',
					kind: 'table',
					caption: 'MPC-TLS와 Proxy mode의 핵심 차이',
					headers: ['항목', 'MPC-TLS', 'Proxy mode'],
					rows: [
						['온라인 역할', '공동 TLS 암호 연산', '암호화 트래픽 전달·기록'],
						['추가 가정', 'MPC 보안', 'Verifier–Server 네트워크 경로'],
						['공식 위치', '기본·권장', '대안 모드']
					]
				}
			]
		},
		{
			id: 'server-name-privacy',
			actId: 'private-response',
			title: '서버 이름도 Notary에게 숨기는 이유',
			summary:
				'일반 목적 Notary가 어느 서비스에서 자료를 가져왔는지까지 알 필요가 없도록 서버 식별 정보(Server identity)도 commitment로 다룬다.',
			blocks: [
				{
					id: 'server-name-privacy-p1',
					kind: 'paragraph',
					text: '은행 응답 본문을 숨겨도 접속한 도메인이 드러나면 민감한 서비스 이용 사실이 노출될 수 있다. TLSNotary의 notarization 흐름은 이 이름도 Notary에게 숨긴다.'
				},
				{
					id: 'server-name-privacy-p2',
					kind: 'paragraph',
					text: '나중의 애플리케이션 Verifier에게는 서버 식별 정보와 이를 확인할 TLS 전용 자료(TLS-specific data)를 열어 출처를 검사하게 할 수 있다. 숨김 대상은 참여자마다 다르다.'
				},
				{
					id: 'server-name-privacy-flow',
					kind: 'figure',
					alt: 'api.bank.example 이름이 commitment로 Notary에게 숨겨지고 나중에 Verifier에게 확인 자료와 함께 공개되는 흐름',
					caption: 'Notary와 최종 Verifier의 가시성이 다르다.',
					visual: {
						kind: 'flow',
						nodes: ['서버 이름', 'commitment', 'Notary 서명', 'Verifier opening']
					}
				}
			]
		},
		{
			id: 'session-header-details',
			actId: 'notarization',
			title: 'Session Header에 무엇이 묶이는가',
			summary:
				'평문 commitment와 TLS-specific data commitment, Notary 서명이 이후 presentation의 기준점이 된다.',
			blocks: [
				{
					id: 'session-header-details-p1',
					kind: 'paragraph',
					text: 'Session Header는 HTTP header가 아니라 TLSNotary가 정의한 자료 구조 이름이다. Prover가 저장했다가 나중에 애플리케이션 Verifier에게 presentation의 일부로 보낸다.'
				},
				{
					id: 'session-header-details-p2',
					kind: 'paragraph',
					text: 'Verifier는 허용한 Notary인지 확인하는 정책 검사와 Session Header 서명 검증을 따로 수행한다. 이어서 opening과 TLS-specific data가 Session Header 안의 commitment에 맞는지 검사한다.'
				},
				{
					id: 'session-header-details-table',
					kind: 'table',
					caption: 'Session Header 관련 자료의 역할',
					headers: ['자료', '역할'],
					rows: [
						['commitment', '세션 당시 값을 숨긴 채 고정'],
						['Notary signature', 'Notary가 Session Header에 서명했는지 확인'],
						['opening', '나중에 선택한 범위가 commitment에 맞는지 확인할 자료']
					]
				}
			]
		},
		{
			id: 'additional-zkp',
			actId: 'selective-disclosure',
			title: 'premiumEligible를 만들 때 추가되는 ZKP',
			summary:
				'정확한 잔액을 열지 않고 비교 결과만 보이려면 TLS 통신 기록의 출처와 판정 조건 계산을 연결하는 별도 회로나 검증 절차가 필요하다.',
			blocks: [
				{
					id: 'additional-zkp-p1',
					kind: 'paragraph',
					text: 'ZKP의 비공개 입력에는 원문 응답의 잔액과 이를 출처 commitment에 연결하는 증인값(witness)이 들어갈 수 있다. 공개 입력에는 기준 금액, 통화, 잔액 유형(balance type), challenge 같은 맥락을 둘 수 있다.'
				},
				{
					id: 'additional-zkp-p2',
					kind: 'paragraph',
					text: '이 글은 실제 회로나 증명을 실행하지 않는다. UI에서 premiumEligible가 만들어지는 장면은 어떤 관계를 추가로 증명해야 하는지 설명하는 교육용 모델이다.'
				},
				{
					id: 'additional-zkp-table',
					kind: 'table',
					caption: '개념적 공개·비공개 입력',
					headers: ['구분', '예시'],
					rows: [
						['비공개', '72,840,000.00, 응답 바이트'],
						['공개', '50,000,000.00, KRW, ITAV, challenge_demo_001'],
						['결과', 'premiumEligible: true']
					]
				}
			]
		},
		{
			id: 'presentation-verification',
			actId: 'application-verification',
			title: 'presentation을 어떤 순서로 검사하는가',
			summary:
				'허용한 Notary 정책, 서명, opening, 서버 식별 정보, JSON 해석, 판정 조건을 각각 다른 실패 원인으로 처리한다.',
			blocks: [
				{
					id: 'presentation-verification-p1',
					kind: 'paragraph',
					text: 'Notary가 허용 목록에 있어도 서명이 틀리면 Session Header를 받아들이지 않는다. 서명이 맞아도 opening이 commitment와 다르면 공개된 값은 세션에 묶이지 않는다. opening이 맞아도 서버 식별 정보가 기대한 api.bank.example과 다르면 기대한 출처의 자료라고 확인할 수 없다.'
				},
				{
					id: 'presentation-verification-p2',
					kind: 'paragraph',
					text: '암호 검사를 모두 통과한 뒤에야 HTTP와 JSON을 해석하고 premiumEligible를 서비스 정책에 넣는다. 그래야 오류를 한 덩어리의 “검증 실패”로 숨기지 않는다.'
				},
				{
					id: 'presentation-verification-flow',
					kind: 'figure',
					alt: 'Notary 신뢰, 서명, opening, 서버 식별 정보, JSON 해석, 판정 조건 순서로 이어지는 검증 단계',
					caption: '각 단계는 다른 질문에 답한다.',
					visual: {
						kind: 'flow',
						nodes: ['허용한 Notary', '서명', 'opening', '서버 식별 정보', 'JSON 해석', '판정 조건']
					}
				}
			]
		},
		{
			id: 'trust-assumption-replay',
			actId: 'policy-visibility-matrix',
			title: '세 가지 실패를 참여자별 표에서 다시 보기',
			summary:
				'서명 계산, commitment 결합, 서버 식별 정보, 서비스 신뢰 목록이 서로 다른 검사임을 짧게 비교한다.',
			blocks: [
				{
					id: 'trust-assumption-replay-p1',
					kind: 'paragraph',
					text: 'Notary가 허용 목록 밖에 있어도 서명 계산 자체는 맞을 수 있다. 서명 검증과 별개로 premium.example이 그 운영자를 세션 검증자로 받아들이지 않는다는 정책 결정이다.'
				},
				{
					id: 'trust-assumption-replay-p2',
					kind: 'paragraph',
					text: 'commitment 불일치와 잘못된 서버 식별 정보는 제출 자료가 해당 세션·출처에 결합됐음을 확인할 수 없게 한다. 같은 거절 화면을 보여 주더라도 내부 원인은 구분해서 기록해야 한다.'
				},
				{
					id: 'trust-assumption-replay-table',
					kind: 'table',
					caption: '실패 원인과 판정 주체',
					headers: ['원인', '먼저 판단하는 주체', '분류'],
					rows: [
						['Notary가 허용 목록 밖', '서비스 정책', '정책 거절'],
						['opening 불일치', '암호 검증기', '암호 검사 거절'],
						['서버 식별 정보 불일치', '출처 검사', '서버 출처 검사 거절']
					]
				}
			]
		}
	],
	references: [
		{
			actId: 'who-sees-balance',
			label: 'TLSNotary Documentation — Introduction',
			href: 'https://tlsnotary.org/docs/intro/',
			note: 'MPC-TLS, 선택 공개, 일반 목적 Notary, Proxy mode, TLS 지원 범위. 2026-08-25 확인.'
		},
		{
			actId: 'participants',
			label: 'TLSNotary Documentation — Quick Start',
			href: 'https://tlsnotary.org/docs/quick_start/',
			note: 'direct Verifier, Proxy Verifier, Notary attestation 예제 구분. 2026-08-25 확인.'
		},
		{
			actId: 'session-preparation',
			label: 'TLSNotary Documentation — Configuration',
			href: 'https://tlsnotary.org/docs/protocol/configuration/',
			note: 'MPC mode의 TlsClientConfig, VerifierConfig, ProveConfig와 데이터 한도. 2026-08-25 확인.'
		},
		{
			actId: 'mpc-tls-request',
			label: 'TLSNotary Documentation — MPC-TLS Handshake',
			href: 'https://tlsnotary.org/docs/protocol/mpc-tls/handshake/',
			note: 'Prover–Verifier 공동 TLS 연산과 key share, 평문 비공개. 2026-08-25 확인.'
		},
		{
			actId: 'mpc-tls-request',
			label: 'TLSNotary Documentation — Proxy Mode',
			href: 'https://tlsnotary.org/docs/protocol/proxy-mode/',
			note: 'Proxy mode 단계, 네트워크 경로 가정, MPC-TLS와의 절충점. 2026-08-25 확인.'
		},
		{
			actId: 'notarization',
			label: 'TLSNotary Documentation — Notarization',
			href: 'https://tlsnotary.org/docs/protocol/notarization/',
			note: 'Session Header, 평문과 TLS-specific data commitment, Notary 서명. 2026-08-25 확인.'
		},
		{
			actId: 'application-verification',
			label: 'TLSNotary Documentation — Verification',
			href: 'https://tlsnotary.org/docs/protocol/verification/',
			note: '서명, opening, TLS-specific data, Server identity, 해석기 검증 단계. 2026-08-25 확인.'
		},
		{
			actId: 'session-preparation',
			label: 'tlsnotary/tlsn v0.1.0-alpha.15',
			href: 'https://github.com/tlsnotary/tlsn/releases/tag/v0.1.0-alpha.15',
			note: '최신 공개 사전 릴리스 및 Proxy-TLS commitment 프로토콜. 2026-08-25 확인.'
		}
	],
	navigation: {
		previous: {
			title: 'TLS 1.3 Handshake와 Record Protocol',
			href: '/ko/notebook/zktls/tls13/'
		}
	}
});
