export type CodeLine = {
	number: number;
	text: string;
	highlighted: boolean;
};

export function toCodeLines(value: string, highlightLines: readonly number[] = []): CodeLine[] {
	const highlighted = new Set(highlightLines.filter((line) => Number.isInteger(line) && line > 0));
	return value.split('\n').map((text, index) => ({
		number: index + 1,
		text,
		highlighted: highlighted.has(index + 1)
	}));
}
