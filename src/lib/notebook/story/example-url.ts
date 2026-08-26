export type ExampleUrlResult = { ok: true; url: string } | { ok: false; message: string };

export function validateExampleUrl(value: string): ExampleUrlResult {
	const candidate = value.trim();
	let parsed: URL;

	try {
		parsed = new URL(candidate);
	} catch {
		return { ok: false, message: '올바른 URL 형식으로 입력해 주세요.' };
	}

	if (parsed.protocol !== 'https:') {
		return { ok: false, message: 'HTTPS 주소만 사용할 수 있습니다.' };
	}

	if (!parsed.hostname.endsWith('.example')) {
		return { ok: false, message: '실제 서비스가 아닌 .example 주소만 사용할 수 있습니다.' };
	}

	if (parsed.username || parsed.password) {
		return { ok: false, message: '사용자 이름이나 비밀번호가 들어간 주소는 사용할 수 없습니다.' };
	}

	if (parsed.port) {
		return { ok: false, message: '이 예제에서는 별도 포트를 입력할 수 없습니다.' };
	}

	return { ok: true, url: candidate };
}
