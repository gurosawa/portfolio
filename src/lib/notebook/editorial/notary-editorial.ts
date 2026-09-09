import type { SecurityEditorial } from './schema';

export const notaryEditorial = {
	slug: 'tlsnotary',
	kicker: 'Security / TLSNotary',
	title: 'TLSNotary와 MPC-TLS의 역할과 데이터 흐름',
	intro:
		'은행 잔액을 숨긴 채 가입 조건을 제출한다면, 누가 무엇을 알아야 할까요? 은행 연결부터 나중에 제출할 자료까지 네 참여자의 역할을 따라갑니다.',
	overview: {
		label: '은행 연결과 제출 자료는 다른 경로를 따릅니다.',
		steps: [
			'Prover가 은행에 연결',
			'Notary와 TLS 공동 연산',
			'Notary 서명',
			'필요한 내용만 제출',
			'Verifier 검사'
		]
	},
	chapterTitle: '연결에 참여하는 사람과 자료를 받는 사람',
	chapterIntro:
		'도식의 네 역할은 자리를 옮기지 않습니다. 이동하는 자료와 각자 볼 수 있는 내용만 달라집니다.',
	scope: [
		'Notarization 구성을 설명하는 개념 모델이며, 현재 SDK의 실행 예제가 아닙니다.',
		'api.bank.example과 premium.example, 계좌와 잔액은 교육용 가상 데이터입니다.',
		'잔액을 숨긴 조건 판정에는 TLSNotary 선택 공개와 별도의 ZKP를 결합한다고 가정합니다.'
	],
	scenes: [
		{
			id: 'roles',
			actIds: ['who-sees-balance', 'participants'],
			title: '잔액을 읽는 역할은 둘입니다',
			lead: '은행 Server는 응답을 만들고, 가입 신청자의 Prover는 그 응답을 읽습니다. 나머지 두 역할까지 잔액을 알 필요는 없습니다.',
			paragraphs: [
				'Prover(제출자)는 api.bank.example에서 받은 자료로 가입 조건을 제출합니다. Notary(공증 역할)는 TLS 세션의 공동 계산에 참여하고 Verifier(검증자)는 나중에 제출 자료를 받습니다. 여기서는 premium.example의 검증 서비스가 Verifier입니다.',
				'본문은 세션 당시의 검사와 나중의 자료 검사를 분리하는 notarization 구성을 다룹니다. 별도 Notary 없이 애플리케이션 Verifier가 MPC-TLS에 직접 참여하는 구성도 있습니다.'
			],
			takeaway: '네 이름은 조직의 개수가 아니라 서로 다른 역할을 가리킵니다.',
			sourceLabel: '역할별 책임과 공개 범위'
		},
		{
			id: 'session',
			actIds: ['session-preparation'],
			title: '은행에 연결하기 전에 계산 범위를 정합니다',
			lead: 'Prover와 Notary는 보낼 데이터와 받을 데이터의 한도를 맞추고 공동 계산을 준비합니다.',
			paragraphs: [
				'MPC(다자간 연산)는 각자의 비밀 입력을 공개하지 않고 함께 계산하는 방식입니다. 필요한 계산량을 미리 준비하므로 세션의 데이터 크기와 record 수 같은 한도를 정합니다.',
				'로그인 자격 정보는 Prover에 남습니다. Notary는 은행 계정에 로그인하거나 잔액 조회를 대신하지 않습니다. Prover는 실제 연결 대상과 인증서 확인에 쓸 설정도 준비합니다.'
			],
			takeaway: '세션 설정을 공유해도 은행 로그인 정보를 공유하는 것은 아닙니다.',
			sourceLabel: '세션 설정 예제'
		},
		{
			id: 'mpc',
			actIds: ['mpc-tls-request', 'private-response'],
			title: '은행 연결과 공동 계산은 별개입니다',
			lead: 'Prover는 은행 Server와 TLS로 통신합니다. Notary와는 TLS 암호 연산을 함께 수행합니다.',
			paragraphs: [
				'연결 중에는 Prover와 Notary가 각각 키 지분을 보유합니다. 이렇게 키를 나누면 Prover가 전체 TLS 키를 혼자 확보해 서버 응답을 위조하지 못합니다. 요청은 평문을 비밀 입력으로 넣어 함께 암호화합니다. Notary가 평문을 받아 은행에 전달하는 구조가 아닙니다.',
				'응답은 연결 중 공동 연산으로 복호화하거나 암호문을 보관했다가 세션 인증과 종료 후 Notary의 키 지분을 받아 Prover가 복호화합니다. 응답을 받는 쪽에서는 Prover만 잔액 72,840,000원을 읽습니다.',
				'MPC-TLS는 Notary에게 평문과 서버 이름을 숨기도록 설계됩니다. 다만 세션 시간, 통신량, 왕복 횟수 같은 메타데이터까지 모두 숨기는 것은 아닙니다. 브라우저의 전송용 중계와 별도 proxy mode도 구분해야 합니다.'
			],
			takeaway: '실제 TLS 통신은 가로선, 공동 계산은 세로선으로 구분합니다.',
			sourceLabel: '응답 예제와 참여자별 공개 범위'
		},
		{
			id: 'attestation',
			actIds: ['notarization'],
			title: 'Notary는 잔액 원문에 서명하지 않습니다',
			lead: '서명이 묶는 대상은 공동으로 확인한 세션과 그 통신 기록의 commitment입니다.',
			paragraphs: [
				'commitment는 값을 바로 공개하지 않고 고정해 두는 암호학적 결과입니다. Prover는 TLS 통신 기록과 서버 식별 자료를 commitment로 묶고 Notary는 이를 담은 자료에 서명합니다. 공식 개념 문서는 이 자료를 Session Header라고 부릅니다.',
				'Notary는 서명할 때도 잔액 평문을 읽지 않습니다. 이 서명은 은행이 발급한 잔액 증명서나 가입 승인 서명이 아닙니다. 나중에 공개한 자료가 당시 세션에 묶여 있었는지 검사할 근거가 됩니다.'
			],
			takeaway: '은행 응답, Notary 서명, 서비스 가입 허용은 서로 다른 결과입니다.',
			sourceLabel: '서명 대상의 구성'
		},
		{
			id: 'disclosure',
			actIds: ['selective-disclosure'],
			title: '바이트 공개와 조건 증명을 나눕니다',
			lead: 'Prover는 presentation(제출 자료)에 서명과 공개 범위, opening(확인 자료)을 묶습니다.',
			paragraphs: [
				'selective disclosure(선택 공개)는 통신 기록에서 고른 바이트만 보여 주는 기능입니다. 예를 들어 HTTP 맥락은 공개하고 Authorization 헤더와 계좌번호는 가릴 수 있습니다. 공개한 값이 commitment에 맞는지는 opening으로 확인합니다.',
				'잔액까지 가린다고 “5,000만 원 이상”이라는 결과가 자동으로 생기지는 않습니다. 이 예제의 premiumEligible: true에는 같은 비공개 응답과 비교 조건을 묶는 별도의 영지식 증명(ZKP)이 필요합니다. 임의의 숫자로 만든 ZKP를 붙여서는 부족합니다.'
			],
			takeaway: '선택 공개는 바이트를 고르는 기능이고, 숨긴 값의 조건 판정은 추가 작업입니다.',
			sourceLabel: '선택 공개와 추가 ZKP의 차이'
		},
		{
			id: 'verification',
			actIds: ['application-verification'],
			title: 'Verifier는 받은 자료의 연결 관계를 검사합니다',
			lead: '서명이 맞는지뿐 아니라, 누가 서명했고 어느 서버의 어떤 자료에 관한 서명인지 확인합니다.',
			paragraphs: [
				'Verifier는 서비스가 허용한 Notary인지 확인하고 서명을 검증합니다. opening과 서버 식별 자료를 각각 commitment에 대조한 뒤, 확인된 서버 이름이 api.bank.example인지 검사합니다.',
				'공개한 바이트는 HTTP·JSON 해석 규칙으로 읽습니다. 추가 ZKP도 같은 응답과 가입 조건에 묶였는지 확인해야 합니다. 자료가 여기까지 통과하면 verified 상태입니다. 서비스는 현재 시간과 가입 기준을 적용해 가입 허용 여부를 따로 판단합니다.'
			],
			takeaway: '자료 검사에 성공했어도 서비스가 가입을 허용하지 않을 수 있습니다.',
			sourceLabel: '검사 순서와 가입 판단'
		},
		{
			id: 'failure',
			actIds: ['policy-visibility-matrix'],
			title: '세 실패는 서로 다른 검사에서 멈춥니다',
			lead: '모두 거절되더라도 이유가 같지는 않습니다. 어느 검사에서 멈췄는지 남겨야 합니다.',
			paragraphs: [
				'허용 목록 밖의 Notary라면 서명 계산은 맞아도 서비스가 받아들이지 않습니다. commitment와 opening이 다르면 암호학적 검사 자체가 실패합니다. 다른 서버의 진짜 응답이라면 그 서버 자료로는 유효하더라도 api.bank.example이라는 출처 조건을 충족하지 못합니다.',
				'Notary를 별도로 두는 구성에서는 Verifier가 그 Notary의 세션 검사와 운영을 받아들인다는 가정도 남습니다. 서명이 있다는 사실만으로 이 가정이 사라지지는 않습니다.'
			],
			takeaway: '거절이라는 한 상태로 묶지 말고 실패한 검사와 정책을 구분합니다.',
			sourceLabel: '전체 공개 범위와 실패 비교'
		}
	],
	closing: {
		title: '마지막에 남는 것은 역할별로 다른 자료입니다',
		paragraphs: [
			'은행과 Prover는 응답 원문을 압니다. Notary는 평문을 읽지 않고 공동 연산과 서명을 맡으며 Verifier는 선택 공개한 내용과 추가 조건 증명을 검사합니다.',
			'이 흐름을 이해했다면 “누가 잔액을 보나?”에 이어 “내가 지금 검사하는 자료를 누가 만들었고, 그 검사만으로 어디까지 판단할 수 있나?”를 함께 물으면 됩니다.'
		]
	}
} as const satisfies SecurityEditorial;
