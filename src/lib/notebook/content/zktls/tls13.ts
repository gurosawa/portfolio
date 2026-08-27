import { defineStory } from '$lib/notebook/story/schema';
import { syntheticBalanceFixtureJson, syntheticBalanceUrl } from './fixture';

const requestFixture = `GET /open-banking/v4.0/aisp/accounts/acct_demo_7F21/balances HTTP/1.1
Host: api.bank.example
Authorization: Bearer <redacted>
X-FAPI-Interaction-ID: trace_tls13_001
Accept: application/json`;

const responseFixture = `HTTP/1.1 200 OK
Content-Type: application/json
X-FAPI-Interaction-ID: trace_tls13_001

${syntheticBalanceFixtureJson}`;

export const tls13Story = defineStory({
	meta: {
		slug: 'tls13',
		locale: 'ko',
		title: 'TLS 1.3 Handshake와 Record Protocol',
		description:
			'이 글은 0-RTT를 사용하지 않는 인증서 기반 TLS 1.3 full handshake를 예로 들어, URL 입력부터 record 보호와 JSON 사본 저장까지 한 요청을 따라간다.',
		canonicalPath: '/ko/notebook/zktls/tls13/',
		publishedAt: '2026-08-26',
		technicallyReviewedAt: '2026-08-26',
		readingMinutes: '10~15분'
	},
	opening: {
		question: 'HTTPS로 받은 이 JSON을 저장하면, 제3자도 원본 서버의 응답이라고 확인할 수 있을까?',
		claim: {
			label: '저장된 API 응답',
			fields: { connectionProtected: true, savedCopyVerifiable: false },
			status: 'unverified'
		}
	},
	mobileOverview: {
		alt: 'URL 입력에서 DNS와 TCP, TLS 1.3 handshake, record 보호, JSON 복호화와 저장 사본까지 이어지는 전체 흐름',
		nodes: ['URL', 'DNS', 'TCP', '연결 설정', 'TLS record', 'JSON', '저장 사본']
	},
	acts: [
		{
			id: 'response-question',
			kicker: 'Prologue',
			title: 'HTTPS 응답에 남는 질문',
			lead: '브라우저 주소창의 연결 보안 표시는 현재 서버와 맺은 TLS 연결을 설명한다. JSON을 저장한 뒤의 사본까지 보증하지는 않는다.',
			blocks: [
				{
					id: 'transport-vs-copy',
					kind: 'table',
					caption: 'HTTPS 연결과 저장 사본이 답하는 질문은 다르다.',
					headers: ['대상', '확인할 수 있는 것', '남는 질문'],
					rows: [
						[
							'진행 중인 TLS 연결',
							'상대 서버 인증, 전송 중 기밀성·무결성',
							'브라우저 밖으로 나온 뒤의 변경'
						],
						['저장한 JSON 파일', '현재 파일의 내용', '어느 TLS 세션에서 왔는가']
					]
				}
			],
			deepDiveIds: ['transport-protection-boundary'],
			scene: { kind: 'tls-record', focus: 'question' }
		},
		{
			id: 'url-dns-tcp',
			kicker: 'Act 1',
			title: 'URL, DNS, TCP',
			lead: 'TLS 메시지가 오가기 전에 브라우저는 요청할 이름과 경로를 읽고, 연결할 주소를 찾고, 전송 연결을 준비한다.',
			blocks: [
				{
					id: 'example-url-form',
					kind: 'form',
					label: '교육용 URL',
					description: '.example 도메인만 받으며 실제 네트워크 요청은 보내지 않는다.',
					examples: [
						syntheticBalanceUrl,
						'https://premium.example/eligibility',
						'https://notary.example/session/trace_tlsn12_001'
					],
					submitLabel: '흐름 시작'
				},
				{
					id: 'pre-tls-flow',
					kind: 'figure',
					alt: 'URL에서 api.bank.example 이름을 꺼내 DNS 조회와 TCP 연결로 넘기는 흐름',
					caption: '여기까지는 아직 API 응답 본문을 보호하는 TLS record가 없다.',
					visual: { kind: 'flow', nodes: ['URL', 'api.bank.example', 'DNS', 'IP 주소', 'TCP'] }
				}
			],
			deepDiveIds: ['name-and-transport'],
			scene: { kind: 'tls-record', focus: 'preflight' }
		},
		{
			id: 'clienthello',
			kicker: 'Act 2',
			title: 'ClientHello',
			lead: 'ClientHello는 클라이언트가 지원하는 TLS 조건과 키 합의에 쓸 key_share를 제안한다. 이 글은 0-RTT를 제외한 full handshake를 다루므로 아직 애플리케이션 요청을 보내지 않는다.',
			blocks: [
				{
					id: 'clienthello-role',
					kind: 'list',
					items: [
						'지원 TLS 버전',
						'사용 가능한 암호군',
						'key_share',
						'서버 이름과 같은 필요한 확장'
					]
				},
				{
					id: 'clienthello-boundary',
					kind: 'callout',
					tone: 'note',
					title: '메타데이터와 본문은 같은 것이 아니다',
					text: '네트워크 관찰자가 연결 메타데이터 일부를 볼 수 있다는 사실과, 보호된 HTTP 경로·헤더·JSON을 읽을 수 있다는 주장은 구분해야 한다.'
				}
			],
			deepDiveIds: ['clienthello-message'],
			scene: { kind: 'tls-record', focus: 'clienthello' }
		},
		{
			id: 'serverhello',
			kicker: 'Act 3',
			title: 'ServerHello',
			lead: 'ServerHello는 서버가 선택한 조건과 key_share를 돌려준다. 양쪽은 이 교환 결과와 handshake 기록을 바탕으로 handshake 보호에 쓸 비밀값을 파생한다.',
			blocks: [
				{
					id: 'serverhello-flow',
					kind: 'figure',
					alt: 'ClientHello와 ServerHello의 키 합의 재료 교환 뒤 handshake 보호 키가 준비되는 흐름',
					caption: '이 장면은 메시지의 역할만 보여 주며 키 계산식은 생략한다.',
					visual: {
						kind: 'flow',
						nodes: ['ClientHello + key_share', 'ServerHello + key_share', 'handshake 비밀값']
					}
				}
			],
			deepDiveIds: ['key-schedule-roles'],
			scene: { kind: 'tls-record', focus: 'serverhello' }
		},
		{
			id: 'certificate-certificateverify',
			kicker: 'Act 4',
			title: 'Certificate와 CertificateVerify',
			lead: 'Certificate는 인증서 체인을 전달한다. CertificateVerify는 서버가 인증서 공개키에 대응하는 개인키로 현재까지의 handshake 기록에 서명했음을 확인한다.',
			blocks: [
				{
					id: 'server-auth-roles',
					kind: 'table',
					caption: '서버 인증 단계에서 나뉘는 역할',
					headers: ['검사', '묻는 질문'],
					rows: [
						['인증서 경로와 이름', '이 인증서를 api.bank.example에 받아들일 수 있는가?'],
						['CertificateVerify', '서명이 인증서 공개키와 현재 handshake 기록에 맞는가?']
					]
				},
				{
					id: 'hostname-failure',
					kind: 'callout',
					tone: 'failure',
					title: '짧은 실패 분기: 이름이 다르다',
					text: '요청 이름은 api.bank.example인데 제시된 인증서가 다른 이름만 식별하면, 클라이언트는 그 인증서를 이 서비스의 신원 근거로 받아들이지 않는다.'
				}
			],
			deepDiveIds: ['service-identity-check'],
			scene: { kind: 'tls-record', focus: 'certificate' }
		},
		{
			id: 'finished',
			kicker: 'Act 5',
			title: 'Finished',
			lead: 'Finished는 그 시점까지의 handshake 기록과 파생 키로 계산한 verify_data를 확인한다. 메시지가 바뀌었거나 양쪽이 다른 키를 계산했다면 검증에 실패한다.',
			blocks: [
				{
					id: 'finished-purpose',
					kind: 'list',
					items: [
						'handshake 기록 무결성',
						'handshake 비밀값 보유 확인',
						'인증 메시지를 포함한 기록과 키의 결합'
					]
				},
				{
					id: 'finished-failure',
					kind: 'callout',
					tone: 'failure',
					title: '짧은 실패 분기: Finished가 맞지 않는다',
					text: '계산한 verify_data가 수신값과 다르면 handshake를 계속하지 않는다. 보호된 API 요청도 이 연결로 보내지 않는다.'
				}
			],
			deepDiveIds: ['finished-check'],
			scene: { kind: 'tls-record', focus: 'finished' }
		},
		{
			id: 'record-protocol',
			kicker: 'Act 6',
			title: 'Record Protocol',
			lead: 'handshake에서 만든 traffic key(통신 데이터 보호 키)는 애플리케이션 데이터를 여러 TLS record로 나누어 각각 암호화하고 인증한다.',
			blocks: [
				{
					id: 'http-request',
					kind: 'code',
					language: 'http',
					value: requestFixture,
					highlightLines: [1, 2, 4]
				},
				{
					id: 'record-envelope',
					kind: 'figure',
					alt: 'HTTP 요청이 여러 TLS record 안에 들어가 암호화와 변조 탐지 보호를 받는 모습',
					caption: 'TLS record의 경계와 IP 패킷의 경계는 같다고 가정하지 않는다.',
					visual: { kind: 'flow', nodes: ['HTTP 바이트', 'TLS record 1', 'TLS record 2', '서버'] }
				}
			],
			deepDiveIds: ['record-vs-packet', 'in-transit-tampering'],
			scene: { kind: 'tls-record', focus: 'records' }
		},
		{
			id: 'browser-json',
			kicker: 'Act 7',
			title: '브라우저가 JSON을 읽는 순간',
			lead: '브라우저가 서버의 record 인증을 검증하고 복호화하면 애플리케이션은 원래 HTTP 응답과 JSON을 읽을 수 있다.',
			blocks: [
				{
					id: 'http-response',
					kind: 'code',
					language: 'http',
					value: responseFixture,
					highlightLines: [1, 3, 11, 12, 14, 15, 16, 19]
				},
				{
					id: 'endpoint-boundary',
					kind: 'callout',
					tone: 'decision',
					title: 'TLS 연결 보호가 끝나는 지점',
					text: '이 시점까지의 보호는 서버와 브라우저 사이의 TLS 연결 안에서 작동했다. 애플리케이션이 JSON을 파일이나 문자열로 복사하면 TLS 연결과 떨어진 별도 사본이 된다.'
				}
			],
			deepDiveIds: ['endpoint-and-copy'],
			scene: { kind: 'tls-record', focus: 'plaintext-json' }
		},
		{
			id: 'saved-copy-gap',
			kicker: 'Act 8',
			title: '저장한 사본의 빈칸',
			lead: '저장된 JSON에는 TLS record의 인증 상태와 서버 인증서, handshake 기록이 자동으로 따라오지 않는다.',
			blocks: [
				{
					id: 'mutated-copy',
					kind: 'code',
					language: 'json',
					value: `{
  "AccountId": "acct_demo_7F21",
  "Amount": { "Amount": "92840000.00", "Currency": "KRW" },
  "CreditDebitIndicator": "Credit",
  "Type": "ITAV"
}`,
					highlightLines: [3]
				},
				{
					id: 'copy-conclusion',
					kind: 'callout',
					tone: 'failure',
					title: '연결의 무결성과 사본의 출처는 다르다',
					text: 'TLS는 전송 중 변조를 탐지하지만, 제3자는 원본과 수정된 두 파일 가운데 어느 쪽이 그 TLS 세션에서 나온 응답인지 파일만 보고 결정할 수 없다.'
				}
			],
			deepDiveIds: ['stored-copy-replay'],
			scene: { kind: 'failure-replay', focus: 'mutated-copy' }
		}
	],
	deepDives: [
		{
			id: 'transport-protection-boundary',
			actId: 'response-question',
			title: 'HTTPS가 보장하는 범위를 문장으로 자르기',
			summary:
				'TLS는 통신 당사자 사이의 연결을 보호한다. 파일이 그 연결에서 나왔음을 제3자에게 보일 증명 형식까지 RFC 9846이 제공하지는 않는다.',
			blocks: [
				{
					id: 'transport-peers',
					kind: 'paragraph',
					text: 'TLS 1.3은 클라이언트와 서버가 통신하는 동안 상대 서버를 인증하고 record의 기밀성과 무결성을 지킨다. 브라우저는 이 연결의 키와 상태를 바탕으로 받은 데이터를 검사한다.'
				},
				{
					id: 'transport-copy-table',
					kind: 'table',
					caption: '같은 JSON이라도 놓인 위치에 따라 확인 근거가 다르다.',
					headers: ['위치', '남아 있는 확인 근거', '제3자가 파일만 받았을 때'],
					rows: [
						['진행 중인 TLS 연결', 'handshake 상태와 트래픽 키', '연결 당사자가 아님'],
						[
							'브라우저가 복호화한 뒤',
							'애플리케이션이 읽는 평문',
							'TLS session과 자동 결합되지 않음'
						],
						[
							'저장한 JSON 파일',
							'파일 내용과 별도로 붙인 metadata',
							'원본 서버 출처를 파일만으로 판정할 수 없음'
						]
					]
				},
				{
					id: 'transport-not-vulnerability',
					kind: 'callout',
					tone: 'note',
					title: 'TLS의 결함이 아니라 적용 범위의 끝이다',
					text: '저장 사본에 제3자용 출처 확인 근거가 남지 않는다는 사실은 TLS가 깨졌다는 뜻이 아니다. TLS record 보호와 제3자에게 제출할 수 있는 출처 증명은 서로 다른 문제다.'
				}
			]
		},
		{
			id: 'name-and-transport',
			actId: 'url-dns-tcp',
			title: 'DNS 결과와 TLS 서버 이름은 같은 검사가 아니다',
			summary:
				'DNS는 연결할 주소를 찾고, TLS의 인증서 이름 검사는 연결 상대를 요청한 서비스 이름과 대조한다.',
			blocks: [
				{
					id: 'name-stages',
					kind: 'paragraph',
					text: '브라우저는 URL에서 api.bank.example이라는 서비스 이름을 읽는다. DNS는 그 이름으로 연결할 IP 주소를 찾고, TCP는 해당 주소와 바이트를 주고받을 연결을 만든다. 두 단계만으로 상대가 기대한 서비스인지는 확정되지 않는다.'
				},
				{
					id: 'name-stage-table',
					kind: 'table',
					caption: '연결 준비와 서버 신원 확인은 맡은 질문이 다르다.',
					headers: ['단계', '답하는 질문', '답하지 않는 질문'],
					rows: [
						['DNS', '어느 주소로 연결할 것인가?', '그 주소의 서버가 api.bank.example인가?'],
						['TCP', '그 주소와 전송 연결이 열렸는가?', '서버가 제시할 인증서를 받아들여도 되는가?'],
						[
							'TLS 서비스 이름 검사',
							'인증서 식별자가 요청한 이름과 맞는가?',
							'저장 파일이 이후 수정되지 않았는가?'
						]
					]
				},
				{
					id: 'name-reference-identifier',
					kind: 'paragraph',
					text: 'TLS 클라이언트는 URL에서 얻은 api.bank.example을 기준 식별자로 삼고 인증서에 제시된 식별자와 대조한다. DNS가 돌려준 IP 주소와 인증서 이름을 같은 값처럼 비교하는 절차가 아니다.'
				}
			]
		},
		{
			id: 'clienthello-message',
			actId: 'clienthello',
			title: 'ClientHello에 들어가는 메시지 이름과 역할',
			summary:
				'지원 버전, 암호군, key_share와 확장이 어떤 선택을 준비하는지 메시지 단위로 설명한다.',
			blocks: [
				{
					id: 'clienthello-purpose',
					kind: 'paragraph',
					text: 'ClientHello는 클라이언트가 연결 조건을 먼저 제안하는 메시지다. 서버가 고를 수 있는 TLS 버전과 암호군을 알리고, 키 합의에 필요한 key_share와 연결에 필요한 확장을 싣는다.'
				},
				{
					id: 'clienthello-fields',
					kind: 'table',
					caption: '이 글에서 살펴보는 ClientHello 항목',
					headers: ['항목', '역할'],
					rows: [
						['supported_versions', '클라이언트가 지원하는 TLS 버전 제안'],
						['cipher_suites', '사용할 수 있는 AEAD와 hash 조합 제안'],
						['key_share', '서버와 공유 secret을 만들 공개 키 재료 전달'],
						['server_name', '연결하려는 서비스 이름 전달']
					]
				},
				{
					id: 'clienthello-http-boundary',
					kind: 'paragraph',
					text: 'GET 경로, Authorization 헤더, JSON 본문은 이 메시지의 항목이 아니다. ClientHello를 관찰할 수 있다는 사실만으로 보호될 HTTP 요청과 응답까지 읽을 수 있다고 넓혀 말하면 안 된다.'
				}
			]
		},
		{
			id: 'key-schedule-roles',
			actId: 'serverhello',
			title: 'TLS 1.3 키 파생 절차를 식 없이 읽기',
			summary:
				'키 파생 절차(key schedule)가 handshake와 애플리케이션 데이터를 보호할 비밀값을 단계별로 나누는 역할만 다룬다.',
			blocks: [
				{
					id: 'key-schedule-shared-secret',
					kind: 'paragraph',
					text: 'ServerHello가 서버의 선택과 key_share를 돌려주면 양쪽은 같은 공유 비밀값(shared secret)을 계산할 재료를 갖는다. TLS 1.3 key schedule은 이 재료와 handshake 기록을 섞어 단계별 비밀값을 파생한다.'
				},
				{
					id: 'key-schedule-flow',
					kind: 'figure',
					alt: 'ClientHello와 ServerHello의 key_share에서 handshake용 비밀값과 애플리케이션 데이터용 비밀값이 단계별로 파생되는 흐름',
					caption: '하나의 고정 키를 연결 전체에 그대로 쓰지 않는다.',
					visual: {
						kind: 'flow',
						nodes: [
							'key_share',
							'공유 비밀값',
							'handshake 트래픽 비밀값',
							'Finished',
							'애플리케이션 트래픽 비밀값'
						]
					}
				},
				{
					id: 'key-schedule-directions',
					kind: 'paragraph',
					text: 'handshake 메시지와 애플리케이션 데이터는 서로 다른 단계의 비밀값으로 보호된다. 보내는 방향과 받는 방향의 트래픽 비밀값(traffic secret)도 나뉜다. 그래서 record의 단계와 방향에 맞는 키만 쓴다.'
				}
			]
		},
		{
			id: 'service-identity-check',
			actId: 'certificate-certificateverify',
			title: '인증서 경로와 서비스 이름 확인',
			summary:
				'유효한 인증서 체인이라는 사실만으로 요청한 api.bank.example의 인증서가 되지는 않는다.',
			blocks: [
				{
					id: 'identity-three-checks',
					kind: 'paragraph',
					text: '서버 인증에는 서로 다른 검사가 이어진다. 인증서 체인을 신뢰할 수 있는지, 인증서의 유효 기간과 용도가 맞는지, 제시된 식별자가 api.bank.example과 맞는지를 확인한다.'
				},
				{
					id: 'identity-certificate-verify',
					kind: 'paragraph',
					text: '인증서 체인과 이름이 유효한지 검사하는 것과, 인증서의 개인키를 실제로 가진 상대가 이번 연결에 참여했는지 검사하는 것은 별개다. CertificateVerify는 서버가 해당 개인키로 현재까지의 handshake 기록에 서명했는지 확인한다.'
				},
				{
					id: 'identity-check-table',
					kind: 'table',
					caption: '하나만 통과해서는 서버 인증이 끝나지 않는다.',
					headers: ['검사', '통과해도 아직 남는 질문'],
					rows: [
						['인증서 경로', '이 인증서가 api.bank.example용인가?'],
						['서비스 이름', '상대가 인증서의 개인키를 갖고 있는가?'],
						['CertificateVerify', 'Finished 검증으로 handshake 무결성과 키 확인까지 끝났는가?']
					]
				}
			]
		},
		{
			id: 'finished-check',
			actId: 'finished',
			title: 'Finished가 묶는 handshake 기록',
			summary:
				'Finished는 전체 애플리케이션 응답이 아니라 그 시점까지의 handshake 기록을 입력으로 삼는다.',
			blocks: [
				{
					id: 'finished-input',
					kind: 'paragraph',
					text: 'Finished의 verify_data는 finished_key와 그 시점까지 쌓인 handshake 기록으로 계산한다. 수신자는 자신이 본 기록으로 값을 다시 계산해 받은 값과 비교한다.'
				},
				{
					id: 'finished-results',
					kind: 'table',
					caption: 'Finished가 확인하는 것과 범위 밖의 것',
					headers: ['확인하는 것', '확인하지 않는 것'],
					rows: [
						['양쪽이 같은 handshake 기록을 보았는가', '앞으로 받을 HTTP 응답의 내용'],
						['해당 단계의 handshake 비밀값을 보유하는가', '저장한 JSON 파일의 이후 변경'],
						[
							'인증 메시지를 포함한 기록과 파생 키가 같은 handshake에 묶였는가',
							'제3자가 사본의 출처를 검증할 수 있는가'
						]
					]
				},
				{
					id: 'finished-mismatch',
					kind: 'paragraph',
					text: 'handshake 메시지가 중간에서 바뀌었거나 양쪽이 다른 키를 계산했다면 verify_data가 맞지 않는다. 클라이언트는 이 연결로 보호된 API 요청을 보내기 전에 handshake를 실패로 처리한다.'
				}
			]
		},
		{
			id: 'record-vs-packet',
			actId: 'record-protocol',
			title: 'TLS record와 네트워크 패킷을 구분하기',
			summary:
				'handshake 메시지와 애플리케이션 데이터의 경계는 TLS record, TCP 세그먼트, IP 패킷 경계와 일치하지 않을 수 있다.',
			blocks: [
				{
					id: 'record-framing',
					kind: 'paragraph',
					text: 'TCP는 순서 있는 바이트 흐름을 제공할 뿐 메시지 경계를 보존하지 않는다. TLS record 경계는 TCP 세그먼트나 IP 패킷 경계와 독립적이다.'
				},
				{
					id: 'record-packet-flow',
					kind: 'figure',
					alt: '하나의 HTTP 요청이 TLS record로 나뉘고 다시 여러 TCP segment와 IP packet에 걸쳐 전송되는 흐름',
					caption: '수신 측은 TCP 바이트 흐름을 다시 모은 뒤 TLS record 경계를 읽는다.',
					visual: {
						kind: 'flow',
						nodes: [
							'HTTP 바이트',
							'TLS record A + B',
							'TCP 바이트 흐름',
							'IP 패킷',
							'다시 모은 record'
						]
					}
				},
				{
					id: 'record-packet-ratios',
					kind: 'paragraph',
					text: '큰 record 하나가 여러 패킷에 나뉠 수 있고, 작은 record 여러 개가 같은 전송 구간에 실릴 수도 있다. 패킷 캡처의 한 줄을 곧바로 하나의 TLS record나 HTTP 메시지로 읽으면 경계를 잘못 잡게 된다.'
				}
			]
		},
		{
			id: 'in-transit-tampering',
			actId: 'record-protocol',
			title: '전송 중 변조가 탐지되는 지점',
			summary:
				'record 보호 검사가 실패하면 수신자는 그 데이터를 정상 애플리케이션 데이터로 넘기지 않는다.',
			blocks: [
				{
					id: 'aead-record-check',
					kind: 'paragraph',
					text: 'TLS 1.3은 AEAD로 record 내용을 암호화하고, record header를 추가 인증 데이터로 포함해 authentication tag(인증 태그)를 계산한다. 수신자는 방향과 순서에 맞는 traffic key와 nonce로 인증 태그를 검증한 뒤 record를 복호화한다.'
				},
				{
					id: 'tampering-cases',
					kind: 'table',
					caption: '변경 시점에 따라 TLS가 관여하는지가 달라진다.',
					headers: ['변경', 'TLS record 검사', '결과'],
					rows: [
						[
							'전송 중 암호문(ciphertext)이나 인증 태그(authentication tag) 변경',
							'실패',
							'애플리케이션에 넘기지 않고 연결 오류 처리'
						],
						[
							'정상 복호화 뒤 브라우저 메모리에서 변경',
							'이미 완료',
							'애플리케이션 보안 영역에서 다룸'
						],
						[
							'저장한 JSON 파일을 나중에 변경',
							'적용되지 않음',
							'파일만으로 원본 여부를 판정할 수 없음'
						]
					]
				},
				{
					id: 'tampering-authentication-boundary',
					kind: 'paragraph',
					text: '수신자는 인증에 실패한 record를 폐기해 변조된 데이터를 애플리케이션에 넘기지 않는다. 전송 중 무결성은 이 인증 검사로 확인한다.'
				}
			]
		},
		{
			id: 'endpoint-and-copy',
			actId: 'browser-json',
			title: '복호화 뒤 보호 경계가 바뀌는 순간',
			summary:
				'브라우저 메모리와 저장소에서 누가 데이터를 바꿀 수 있는지는 TLS record와 다른 운영 문제다.',
			blocks: [
				{
					id: 'endpoint-plaintext',
					kind: 'paragraph',
					text: 'record 인증과 복호화가 끝나면 브라우저는 HTTP 상태줄, 헤더, 본문을 평문(plaintext)으로 애플리케이션에 넘긴다. fetch 응답, 개발자 도구, 로그, 캐시, 다운로드 파일은 이 시점부터 브라우저와 애플리케이션의 권한 아래 놓인다.'
				},
				{
					id: 'endpoint-boundary-table',
					kind: 'table',
					caption: '평문이 도착한 뒤에는 다른 통제가 필요하다.',
					headers: ['위험', 'TLS가 계속 막는가', '다루는 곳'],
					rows: [
						['네트워크에서 record 변조', '예', 'TLS record 인증'],
						[
							'브라우저 확장이나 스크립트의 평문 접근',
							'아니요',
							'브라우저 권한과 애플리케이션 보안'
						],
						['다운로드 뒤 파일 수정', '아니요', '별도 서명·저장소 무결성·출처 확인 방식']
					]
				},
				{
					id: 'endpoint-extra-artifact',
					kind: 'paragraph',
					text: '저장 사본을 다른 사람에게 제출하려면 원본 서버와 응답 바이트를 함께 확인할 별도 자료가 필요하다. TLS 연결이 성공했다는 브라우저 화면이나 파일 해시(hash)만으로는 어느 서버 세션에서 온 내용인지까지 이어지지 않는다.'
				}
			]
		},
		{
			id: 'stored-copy-replay',
			actId: 'saved-copy-gap',
			title: '원본과 수정 사본을 나란히 재생하기',
			summary: '전송 중 변조와 저장 뒤 수정이 각각 어느 검사에서 드러나는지 비교한다.',
			blocks: [
				{
					id: 'copy-replay-sequence',
					kind: 'paragraph',
					text: '첫 번째 경로에서는 공격자가 전송 중인 암호문(ciphertext)을 바꾼다. record 인증이 실패하므로 브라우저는 수정된 내용을 JSON으로 내놓지 않는다. 두 번째 경로에서는 브라우저가 72,840,000원을 정상 수신한 뒤 저장 파일의 값을 92,840,000원으로 고친다.'
				},
				{
					id: 'copy-replay-matrix',
					kind: 'table',
					caption: 'TLS 검사가 보는 변경과 보지 못하는 변경',
					headers: ['사례', '발생 시점', 'TLS 결과', '파일만 받은 제3자'],
					rows: [
						['ciphertext 변조', 'record 수신 전', '인증 실패', '수정된 JSON이 만들어지지 않음'],
						[
							'72,840,000원 → 92,840,000원',
							'정상 복호화 후',
							'이미 성공',
							'원본과 수정본을 구분할 TLS 상태가 없음'
						],
						[
							'정상 JSON 그대로 복사',
							'정상 복호화 후',
							'이미 성공',
							'내용이 맞아도 서버 출처를 파일만으로 재검증할 수 없음'
						]
					]
				},
				{
					id: 'copy-replay-conclusion',
					kind: 'callout',
					tone: 'decision',
					title: '다음 글에서 채울 빈칸',
					text: '제3자가 검증하려면 원본 서버, TLS 통신 기록, 공개할 응답 범위를 함께 묶은 추가 자료가 필요하다. 일반 HTTPS 다운로드만으로 이런 자료가 생기지는 않는다.'
				}
			]
		}
	],
	references: [
		{
			actId: 'response-question',
			label: 'RFC 9846 — The Transport Layer Security (TLS) Protocol Version 1.3',
			href: 'https://www.rfc-editor.org/rfc/rfc9846.html#section-1',
			note: 'RFC 8446을 대체한 현행 TLS 1.3 규격. 연결 보호의 범위. 2026-08-25 확인.'
		},
		{
			actId: 'clienthello',
			label: 'RFC 9846 §4.2.2 — Client Hello',
			href: 'https://www.rfc-editor.org/rfc/rfc9846.html#section-4.2.2',
			note: 'ClientHello 메시지와 확장, key_share의 역할. 2026-08-25 확인.'
		},
		{
			actId: 'serverhello',
			label: 'RFC 9846 §2 — Protocol Overview',
			href: 'https://www.rfc-editor.org/rfc/rfc9846.html#section-2',
			note: 'TLS 1.3 full handshake 메시지 흐름. 2026-08-25 확인.'
		},
		{
			actId: 'certificate-certificateverify',
			label: 'RFC 9846 §4.5 — Authentication Messages',
			href: 'https://www.rfc-editor.org/rfc/rfc9846.html#section-4.5',
			note: 'Certificate, CertificateVerify, Finished의 역할. 2026-08-25 확인.'
		},
		{
			actId: 'certificate-certificateverify',
			label: 'RFC 9525 — Service Identity in TLS',
			href: 'https://www.rfc-editor.org/rfc/rfc9525.html',
			note: '서비스 이름과 인증서 식별자 확인 지침. 2026-08-25 확인.'
		},
		{
			actId: 'finished',
			label: 'RFC 9846 §4.5.3 — Finished',
			href: 'https://www.rfc-editor.org/rfc/rfc9846.html#section-4.5.3',
			note: 'Finished verify_data와 handshake transcript 결합. 2026-08-25 확인.'
		},
		{
			actId: 'record-protocol',
			label: 'RFC 9846 §5 — Record Protocol',
			href: 'https://www.rfc-editor.org/rfc/rfc9846.html#section-5',
			note: 'record 단위의 authenticated encryption과 nonce. 2026-08-25 확인.'
		},
		{
			actId: 'response-question',
			label: 'RFC 8446 — Original TLS 1.3 specification',
			href: 'https://www.rfc-editor.org/rfc/rfc8446.html',
			note: '2018년 원 규격. RFC 9846으로 대체됨. 2026-08-25 확인.'
		}
	],
	navigation: {
		previous: {
			title: 'zkTLS로 API 응답의 잔액 조건을 증명하는 과정',
			href: '/ko/notebook/zktls/balance-claim/'
		},
		next: {
			title: 'TLSNotary와 MPC-TLS: Prover·Verifier·Notary의 역할과 데이터 흐름',
			href: '/ko/notebook/zktls/tlsnotary/'
		}
	}
});
