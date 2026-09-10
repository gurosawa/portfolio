import { json } from '@sveltejs/kit';
import replay from '$lib/notebook/ai/release-replay-result.json';

export const prerender = true;

export function GET() {
	return json(replay);
}
