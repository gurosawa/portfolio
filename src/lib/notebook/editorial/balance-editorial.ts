import type { SecurityEditorial } from './schema';

export const balanceEditorial: SecurityEditorial = {
	slug: 'balance-claim',
	kicker: 'zkTLS / API 응답과 서비스 판단',
	title: 'zkTLS로 API 응답의 잔액 조건을 증명하는 과정',
	intro: '잔액을 공개하지 않고 5,000만 원 이상임을 확인받는다면, 서비스 가입까지 허용될까요?',
	overview: {
		label: 'API 응답에서 가입 결정까지',
		steps: ['조건 정의', '요청 연결', '응답 해석', '증명 생성', '자료 검증', '가입 결정']
	},
	chapterTitle: '같은 잔액, 서로 다른 두 판단',
	chapterIntro:
		'은행 응답 하나를 끝까지 따라갑니다. 자료가 검사를 통과한 뒤에도 서비스가 가입을 거절하는 이유를 살펴봅니다.',
	scope: [
		'bank.example과 premium.example, 계좌와 잔액은 모두 교육용 가상 데이터입니다.',
		'UK Open Banking v4.0의 잔액 구조를 참고합니다. 실제 은행 조회나 proof 생성은 실행하지 않습니다.',
		'TLS 기반 출처 확인에 별도의 비공개 비교를 결합한 개념 모델입니다. 특정 zkTLS 구현의 기본 기능을 뜻하지 않습니다.'
	],
	scenes: [
		{
			id: 'condition',
			actIds: ['membership-condition', 'specify'],
			title: '5,000만 원의 의미부터 정합니다',
			lead: 'premium.example은 사용 가능한 잔액이 5,000만 원 이상인 사람에게 프리미엄 가입을 허용한다고 가정합니다.',
			paragraphs: [
				'하지만 응답에서 큰 숫자 하나를 찾는 것만으로는 충분하지 않습니다. 어떤 계좌의 어떤 잔액인지, 통화는 무엇인지, 신용한도를 합산한 값인지부터 정해야 합니다.',
				'이 예시는 acct_demo_7F21의 ITAV(지정 시점의 가용 잔액)를 고릅니다. CreditDebitIndicator가 Credit이고 통화가 KRW이며 금액이 50000000.00 이상이어야 합니다. CreditLine은 없거나 모든 Included 값이 false여야 합니다.',
				'이 조건이 참이라는 주장을 claim이라고 부릅니다. premiumEligible: true는 여기서 정한 잔액 조건을 만족했다는 뜻입니다. 가입 승인은 아직 남아 있습니다.'
			],
			takeaway: '금액뿐 아니라 통화, 잔액 종류, 신용한도 포함 여부까지 같은 조건으로 검사합니다.',
			sourceLabel: '잔액 조건 원문'
		},
		{
			id: 'request',
			actIds: ['challenge'],
			title: '이번 가입 요청에 연결합니다',
			lead: 'Verifier(검증자)는 이번 요청을 식별하는 challenge(검증 요청값)를 발급합니다.',
			paragraphs: [
				'제출 자료에는 challenge와 audience(사용 대상)인 premium.example을 함께 묶습니다. 다른 요청에서 받은 자료나 다른 서비스용 자료를 그대로 가져오지 못하도록, 검증할 때 이 값들도 확인합니다.',
				'challenge의 만료와 잔액 자료의 유효 시간은 별개입니다. 요청값이 아직 유효하더라도 잔액이 관측된 시점이 너무 오래됐다면 현재 가입 정책을 통과하지 못할 수 있습니다.'
			],
			takeaway: '무슨 조건인지에 더해, 누가 어떤 요청에 사용할 자료인지도 정합니다.',
			sourceLabel: '검증 요청 예제'
		},
		{
			id: 'response',
			actIds: ['fetch', 'bind'],
			title: '응답의 숫자를 같은 규칙으로 읽습니다',
			lead: 'Prover(제출자)가 api.bank.example에서 받은 잔액은 72,840,000원입니다.',
			paragraphs: [
				'로그인 자격 정보는 원본 서버에만 보냅니다. 응답의 Data.Balance 배열에서 대상 계좌와 ITAV 항목을 고르고 Amount.Amount의 문자열 72840000.00을 Amount.Currency의 KRW와 함께 읽습니다.',
				'parser(해석기)의 규칙도 검사 대상입니다. 화면에서 숫자를 검색하는 방식으로는 부족합니다. 응답 원문을 어떤 JSON 필드 경로로 읽었는지, 어느 항목을 골랐는지, 정확한 십진수로 비교했는지까지 묶어야 같은 값으로 판정합니다.',
				'CreditLine.Included가 false이면 그 한도를 잔액에 합산하지 않은 것입니다. 신용한도나 부채의 유무와는 별개입니다. 이 잔액은 해당 시점의 값이며 총자산이나 순자산도 아닙니다.'
			],
			takeaway: '72840000.00이라는 문자열뿐 아니라 그 값의 위치와 해석 규칙을 확인합니다.',
			sourceLabel: 'API 응답 원문'
		},
		{
			id: 'proof',
			actIds: ['prove'],
			title: '잔액은 남겨 두고 조건의 결과를 보냅니다',
			lead: 'Verifier에게는 실제 잔액 대신 premiumEligible: true와 검증에 필요한 자료를 제출합니다.',
			paragraphs: [
				'여기에는 서로 다른 두 작업이 필요합니다. 먼저 데이터가 지정한 서버의 통신에서 왔음을 확인할 근거가 있어야 합니다. 이어서 그 데이터의 금액이 5,000만 원 이상임을, 금액을 공개하지 않고 보여야 합니다.',
				'selective disclosure(선택 공개)는 응답의 일부 바이트만 보여 주는 기능입니다. 금액을 가리기만 해서는 숨긴 금액이 기준 이상이라는 결론을 얻을 수 없습니다. 이 글의 비공개 비교에는 별도의 영지식 증명(ZKP)이 필요합니다.',
				'그 비교 결과도 앞에서 정한 응답, 해석 규칙, 조건, challenge와 연결돼야 합니다. true라는 문자열 하나를 보내는 것만으로는 검증할 수 없습니다.'
			],
			takeaway: '공개하지 않는 것과, 숨긴 값의 조건을 증명하는 것은 서로 다른 기능입니다.',
			sourceLabel: '제출 자료의 공개 범위'
		},
		{
			id: 'verification',
			actIds: ['verify'],
			title: '검사를 통과해도 아직 가입 전입니다',
			lead: 'Verifier는 제출 자료를 검사하고 verified 결과를 냅니다.',
			paragraphs: [
				'기대한 서버와 세션에서 나온 자료인지, 이번 challenge와 사용 대상에 맞는지 확인합니다. 응답과 JSON 해석 규칙이 연결됐는지, 정해진 조건과 공개 결과가 일치하는지도 검사합니다.',
				'모두 통과하면 자료 검증이 끝납니다. 제출자의 신원이나 계좌 소유권은 별도로 확인해야 합니다. AccountId는 API가 계좌를 식별하는 값이므로, 그 계좌가 제출자의 것임을 확인하는 절차가 따로 필요합니다.'
			],
			takeaway: 'verified가 답하는 질문은 “이 자료가 정해진 검사를 통과했는가?”입니다.',
			sourceLabel: '검증 결과 원문'
		},
		{
			id: 'decision',
			actIds: ['rely'],
			title: '가입 허용은 서비스가 결정합니다',
			lead: 'premium.example은 검증 결과에 현재의 가입 정책을 적용합니다.',
			paragraphs: [
				'자료가 충분히 최근인지, 증명한 금액 조건이 현재 기준과 같은지, 서비스가 받아들이는 검증 방식인지 확인합니다. 이 예시에서는 필요한 정책 검사를 모두 통과한 경우에만 approved, 즉 가입 허용으로 넘어갑니다.',
				'검증 결과와 가입 결정을 따로 남기면 나중에도 이유를 설명할 수 있습니다. 어떤 자료를 검사했고 어떤 정책을 언제 적용했는지 함께 남깁니다.'
			],
			takeaway: 'verified는 자료 검사 결과이고 approved는 현재 정책에 따른 가입 결정입니다.',
			sourceLabel: '검증과 가입 판단 비교'
		},
		{
			id: 'failure',
			actIds: ['failure-replay'],
			title: '자료는 그대로인데 결정이 달라집니다',
			lead: '같은 verified 자료를 두 가지 다른 상황에 놓아 봅니다.',
			paragraphs: [
				'첫째, 잔액 자료가 만들어진 지 480초가 지났는데 서비스는 300초 이내의 자료만 받습니다. 자료 검사는 통과해도 최신성 정책에서 denied, 즉 가입 거절이 됩니다. 이 사례에서는 challenge 자체는 아직 유효하다고 가정합니다.',
				'둘째, 가입 기준이 5,000만 원에서 7,000만 원으로 바뀝니다. 기존 자료로 확인한 조건은 5,000만 원 이상입니다. 새 조건으로 다시 제출해야 하는 reproofRequired가 됩니다.',
				'실제 예시 잔액인 72,840,000원은 새 기준보다도 높습니다. 하지만 Verifier에게 금액을 숨겼으므로 기존 결과만으로는 이를 알 수 없습니다. 잔액 부족을 발견한 것도, 기존 proof가 위조됐다는 뜻도 아닙니다.'
			],
			takeaway: '시간이나 정책이 바뀌어도, 유효한 자료가 위조된 자료로 바뀌는 것은 아닙니다.',
			sourceLabel: '두 실패 사례 비교'
		}
	],
	closing: {
		title: '검증이 끝나면 서비스가 판단합니다',
		paragraphs: [
			'은행 응답에서 필요한 조건을 정해 이번 요청에 연결하고 잔액을 숨긴 제출 자료를 만들었습니다. Verifier는 그 자료에 담긴 주장을 확인했습니다.',
			'서비스는 그 결과를 지금 사용할 수 있는지 판단합니다. 이 두 단계를 구분해야 시간 만료나 정책 변경을 암호학적 검증 실패와 혼동하지 않습니다.'
		]
	}
};
