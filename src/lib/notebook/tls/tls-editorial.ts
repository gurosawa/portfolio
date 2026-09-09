export const tlsEditorial = {
	introQuestion: '브라우저가 받은 JSON을 다른 서비스에 그대로 제출해도 될까요?',
	introLead:
		'은행에서 받은 잔액 JSON에는 어떤 확인을 거쳤다는 정보가 남을까요? 응답을 받기 전으로 돌아가, 아직 보내지 않은 잔액 조회 요청부터 따라가겠습니다.',
	preludeTitle: '요청은 준비됐지만, 아직 보내지 않습니다',
	preludeBody:
		'가상 은행 api.bank.example의 잔액 조회 API를 호출하려고 합니다. 브라우저는 URL에서 서버 이름과 요청 경로를 읽고, DNS로 IP 주소를 찾고, TCP 연결을 준비합니다. 요청을 보내려면 상대가 은행 서버인지 확인하고 암호화에 쓸 키도 마련해야 합니다. 이 연결 준비 절차가 TLS Handshake입니다. 여기서는 0-RTT와 클라이언트 인증서를 사용하지 않는, TCP 위의 인증서 기반 TLS 1.3 연결을 다룹니다.',
	scenes: [
		{
			id: 'hello',
			title: '연결 조건부터 맞춥니다',
			lead: '잔액 조회 요청을 보내기 전에, 브라우저와 서버는 이번 연결에 쓸 TLS 버전과 암호화 방식을 정합니다.',
			paragraphs: [
				'브라우저는 ClientHello에 지원하는 조건과 key_share를 담아 보내고, 서버는 선택한 조건과 자신의 key_share를 ServerHello로 돌려줍니다. 이때 교환하는 것은 키 합의에 쓸 공개 값이지, 완성된 암호화 키가 아닙니다.',
				'양쪽은 각자 보관한 비밀값과 받은 공개 값으로 공유 비밀값을 계산하고, Handshake 메시지를 암호화할 키를 따로 만듭니다. 아직 상대가 은행인지는 확인하지 않았습니다.'
			],
			takeaway:
				'HTTP 요청은 브라우저에 남아 있습니다. 먼저 오간 것은 연결 조건과 키 합의에 쓸 값입니다.',
			actIds: ['clienthello', 'serverhello']
		},
		{
			id: 'identity',
			title: '지금 연결한 곳이 은행인지 확인합니다',
			lead: '암호화 준비를 마쳤으니, 상대가 api.bank.example의 서버인지 확인합니다.',
			paragraphs: [
				'서버는 EncryptedExtensions로 추가 연결 설정을 알리고 Certificate로 인증서 체인을 보냅니다. 이 메시지들과 뒤이은 CertificateVerify는 이미 Handshake용 키로 암호화합니다.',
				'브라우저는 인증서 체인과 유효 기간, 요청한 서버 이름을 검사하고 CertificateVerify의 서명도 확인합니다. 현재까지의 Handshake 기록과 인증서 공개키로 서명을 검사해, 상대가 대응하는 개인키를 보유하는지 확인합니다.'
			],
			takeaway:
				'인증서에 적힌 이름이 요청한 서버와 맞지 않으면 여기서 연결을 중단합니다. 잔액 조회 요청은 보내지 않습니다.',
			actIds: ['certificate-certificateverify']
		},
		{
			id: 'finished',
			title: '주고받은 기록과 키를 확인합니다',
			lead: '서버 인증을 통과했다면, 이제 Handshake 기록과 계산한 키가 맞는지 확인할 차례입니다.',
			paragraphs: [
				'서버가 먼저 Finished를 보내면 브라우저는 자신이 기록한 Handshake 메시지와 파생 키로 확인 값을 다시 계산해 비교합니다. 값이 맞으면 브라우저도 자신의 Finished를 보내고, 서버가 같은 방식으로 검사합니다.',
				'계산한 값과 받은 값이 다르면 연결을 중단합니다. Finished는 그 시점까지의 Handshake 기록을 검사합니다. 앞으로 받을 잔액 JSON은 검사 대상이 아닙니다.'
			],
			takeaway:
				'브라우저는 서버의 Finished를 확인하고 자신의 Finished를 보낸 뒤 HTTP 요청을 전송합니다.',
			actIds: ['finished']
		},
		{
			id: 'request',
			title: '이제 잔액 조회 요청이 전송됩니다',
			lead: '브라우저 안에 남아 있던 HTTP 요청이 TLS 연결을 따라 서버로 이동합니다.',
			paragraphs: [
				'TLS는 HTTP 데이터를 record 단위로 나누어 암호화하고 변조를 탐지할 인증 태그를 붙입니다. 앞서 쓴 Handshake용 키와는 별도로 application traffic key를 사용하며, 보내는 방향과 받는 방향의 키도 구분합니다.',
				'서버는 record를 검사하고 복호화한 뒤 HTTP 요청을 읽습니다. 하나의 HTTP 메시지와 TLS record, 네트워크 패킷이 각각 일대일로 대응하지는 않습니다.'
			],
			takeaway:
				'요청 경로와 Authorization 헤더는 암호화된 record 안에 있습니다. 화면의 화살표 하나가 실제 패킷 하나를 뜻하지는 않습니다.',
			actIds: ['record-protocol']
		}
	],
	closingTitle: '응답이 파일이 되면, 무엇이 남을까요?',
	closingLead:
		'서버의 잔액 응답도 TLS record로 돌아오고, 브라우저가 검사와 복호화를 마치면 JSON을 읽습니다. 다만 그 JSON을 저장한다고 은행 서버의 서명이 자동으로 붙지는 않습니다. 이제 응답을 받은 브라우저와 파일만 전달받은 서비스가 각각 무엇을 확인할 수 있는지 비교해 보겠습니다.'
} as const;
