export const tlsWireStages = ['hello', 'identity', 'finished', 'request'] as const;
export type TlsWireStage = (typeof tlsWireStages)[number];
export type TlsWireEndpoint = 'browser' | 'server';
export type TlsWireMessageState = 'pending' | 'active' | 'complete';
export type TlsRequestState = 'waiting' | 'wrapping' | 'sending' | 'received';

export const tlsWireEndpoints = {
	browser: { label: '브라우저', detail: 'Client' },
	server: { label: 'api.bank.example', detail: 'Server' }
} as const;

export type TlsWireMessage = {
	id: string;
	stage: TlsWireStage;
	label: string;
	detail: string;
	from: TlsWireEndpoint;
	to: TlsWireEndpoint;
	protection: 'plaintext' | 'handshake' | 'application';
};

/** Certificate-based TLS 1.3; no resumption, client certificate or 0-RTT. */
export const tlsWireMessages: readonly TlsWireMessage[] = [
	{
		id: 'client-hello',
		stage: 'hello',
		label: 'ClientHello',
		detail: '지원하는 TLS 설정과 key share를 보냅니다.',
		from: 'browser',
		to: 'server',
		protection: 'plaintext'
	},
	{
		id: 'server-hello',
		stage: 'hello',
		label: 'ServerHello',
		detail: '서버가 선택한 설정과 key share를 돌려줍니다.',
		from: 'server',
		to: 'browser',
		protection: 'plaintext'
	},
	{
		id: 'encrypted-extensions',
		stage: 'identity',
		label: 'EncryptedExtensions',
		detail: '협상한 나머지 설정을 암호화해서 보냅니다.',
		from: 'server',
		to: 'browser',
		protection: 'handshake'
	},
	{
		id: 'certificate',
		stage: 'identity',
		label: 'Certificate',
		detail: '브라우저가 인증서 체인과 서버 이름을 확인합니다.',
		from: 'server',
		to: 'browser',
		protection: 'handshake'
	},
	{
		id: 'certificate-verify',
		stage: 'identity',
		label: 'CertificateVerify',
		detail: '서버가 인증서의 개인키로 서명했는지 확인합니다.',
		from: 'server',
		to: 'browser',
		protection: 'handshake'
	},
	{
		id: 'server-finished',
		stage: 'finished',
		label: 'Finished',
		detail: '브라우저가 서버의 Finished를 확인합니다.',
		from: 'server',
		to: 'browser',
		protection: 'handshake'
	},
	{
		id: 'client-finished',
		stage: 'finished',
		label: 'Finished',
		detail: '클라이언트도 Finished를 보내 Handshake를 마칩니다.',
		from: 'browser',
		to: 'server',
		protection: 'handshake'
	},
	{
		id: 'application-data',
		stage: 'request',
		label: 'TLS application data',
		detail: '암호화된 HTTP 요청이 서버로 전송됩니다.',
		from: 'browser',
		to: 'server',
		protection: 'application'
	}
];

export type TlsWireRow = TlsWireMessage & {
	visible: boolean;
	focused: boolean;
	state: TlsWireMessageState;
	progress: number;
	position: number;
};

export type TlsWireScene = {
	stage: TlsWireStage;
	progress: number;
	rows: TlsWireRow[];
	focusId: string;
	focusDescription: string;
	requestState: TlsRequestState;
	requestPosition: number;
	encryptionProgress: number;
	serverAuthenticated: boolean;
	handshakeComplete: boolean;
	status: string;
};

export function clampTlsProgress(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** A reversible scroll model, not a timer, packet capture or cryptographic simulation. */
export function tlsWireScene(
	stage: TlsWireStage,
	inputProgress: number,
	staticMode = false
): TlsWireScene {
	const progress = staticMode ? 1 : clampTlsProgress(inputProgress);
	const stageIndex = tlsWireStages.indexOf(stage);
	const localMessages = tlsWireMessages.filter((message) => message.stage === stage);
	const interval = (index: number): [number, number] =>
		stage === 'request'
			? [0.45, 0.94]
			: [index / localMessages.length + 0.04, (index + 1) / localMessages.length - 0.04];
	const focus =
		localMessages.find((_, index) => progress < interval(index)[1]) ?? localMessages.at(-1)!;
	const rows = tlsWireMessages.map((message): TlsWireRow => {
		const rowStageIndex = tlsWireStages.indexOf(message.stage);
		const localIndex = localMessages.findIndex((localMessage) => localMessage.id === message.id);
		const [start, end] = interval(localIndex);
		const fraction =
			rowStageIndex < stageIndex
				? 1
				: rowStageIndex > stageIndex
					? 0
					: clampTlsProgress((progress - start) / (end - start));
		const state: TlsWireMessageState =
			fraction >= 1 ? 'complete' : fraction > 0 ? 'active' : 'pending';
		return {
			...message,
			visible: rowStageIndex <= stageIndex,
			focused: message.id === focus.id,
			state,
			progress: fraction,
			position: message.from === 'browser' ? fraction : 1 - fraction
		};
	});
	const serverAuthenticated =
		rows.find((row) => row.id === 'certificate-verify')!.state === 'complete';
	const handshakeComplete = rows.find((row) => row.id === 'client-finished')!.state === 'complete';
	const requestRow = rows.find((row) => row.id === 'application-data')!;
	const requestState: TlsRequestState =
		stage !== 'request'
			? 'waiting'
			: progress < 0.45
				? 'wrapping'
				: progress < 0.94
					? 'sending'
					: 'received';
	const status =
		requestState === 'received'
			? '서버에 암호화된 요청이 도착했습니다.'
			: requestState === 'sending'
				? 'HTTP 요청은 암호화된 상태로 이동합니다.'
				: requestState === 'wrapping'
					? 'Handshake 완료. HTTP 요청을 암호화합니다.'
					: handshakeComplete
						? 'Handshake 완료. 이제 HTTP 요청을 보낼 수 있습니다.'
						: serverAuthenticated
							? '서버 확인 완료. 아직 HTTP 요청은 보내지 않았습니다.'
							: rows.find((row) => row.id === 'server-hello')!.state === 'complete'
								? '키 합의는 끝났지만, 서버 확인은 아직입니다.'
								: 'HTTP 요청은 브라우저 안에서 기다립니다.';
	return {
		stage,
		progress,
		rows,
		focusId: focus.id,
		focusDescription: focus.detail,
		requestState,
		requestPosition: requestRow.progress,
		encryptionProgress: stage === 'request' ? clampTlsProgress(progress / 0.36) : 0,
		serverAuthenticated,
		handshakeComplete,
		status
	};
}
