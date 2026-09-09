import type { StoryReference } from '../story/schema';
import type { SecurityStorySlug } from './schema';

/** New research is dated separately; the original article's references remain intact. */
export const editorialReferences: Record<SecurityStorySlug, readonly StoryReference[]> = {
	'balance-claim': [
		{
			actId: 'bind',
			href: 'https://www.rfc-editor.org/rfc/rfc8259.html',
			label: 'RFC 8259 - JSON',
			note: 'JSON 구조와 숫자 표현. 금융 API의 문자열 금액은 별도의 십진수 해석 규칙으로 비교합니다. 2026-09-09 확인.'
		},
		{
			actId: 'prove',
			href: 'https://tlsnotary.org/docs/faq/',
			label: 'TLSNotary FAQ - 비공개 데이터의 조건 증명',
			note: '통신 기록의 hash commitment를 일반 목적 ZK 시스템과 연결하는 방식. 선택 공개만으로 숨긴 잔액을 비교할 수 있다고 설명하지 않습니다. 2026-09-09 확인.'
		}
	],
	tlsnotary: [
		{
			actId: 'participants',
			href: 'https://tlsnotary.org/docs/faq/',
			label: 'TLSNotary FAQ - Notary 역할과 통신 경로',
			note: '별도 Notary의 선택적 역할, MPC-TLS 직접 연결과 브라우저 전송 중계의 차이, 노출될 수 있는 메타데이터. 2026-09-09 확인.'
		},
		{
			actId: 'session-preparation',
			href: 'https://github.com/tlsnotary/tlsn/releases/tag/v0.1.0-alpha.13',
			label: 'tlsnotary/tlsn v0.1.0-alpha.13 - 구현 범위 변경',
			note: 'notary-server/client 제거와 tlsn-attestation 유지보수 범위를 명시합니다. 본문의 Notarization 개념 모델을 현재 SDK 실행 절차와 구분한 근거입니다. 2026-09-09 확인.'
		},
		{
			actId: 'private-response',
			href: 'https://tlsnotary.org/docs/protocol/server_identity_privacy/',
			label: 'TLSNotary - Server Identity Privacy',
			note: 'MPC-TLS의 서버 이름 비공개와 proxy mode의 차이. 2026-09-09 확인.'
		},
		{
			actId: 'selective-disclosure',
			href: 'https://tlsnotary.org/docs/faq/#can-i-prove-statements-about-tls-data-in-zero-knowledge-with-tlsnotary-does-it-use-zksnarks',
			label: 'TLSNotary FAQ - 일반 목적 ZKP와의 결합',
			note: 'hash commitment와 별도의 ZK 시스템을 연결해 비공개 데이터의 조건을 검사하는 구성. 2026-09-09 확인.'
		}
	]
};
