import { describe, expect, it } from 'vitest';
import { toCodeLines } from './code-lines';

describe('toCodeLines', () => {
	it('keeps blank lines and marks the requested one-based lines', () => {
		expect(toCodeLines('first\n\nthird', [2, 3])).toEqual([
			{ number: 1, text: 'first', highlighted: false },
			{ number: 2, text: '', highlighted: true },
			{ number: 3, text: 'third', highlighted: true }
		]);
	});

	it('ignores duplicate and out-of-range highlights', () => {
		expect(toCodeLines('only', [0, 1, 1, 2])).toEqual([
			{ number: 1, text: 'only', highlighted: true }
		]);
	});
});
