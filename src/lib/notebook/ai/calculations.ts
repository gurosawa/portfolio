export const exampleModels = { A: [0.9, 0.9, 0, 0], B: [0.25, 0.25, 0.25, 0.25] };
export function expectedCoverage(probabilities: number[], attempts: number) {
	if (
		!probabilities.length ||
		!Number.isInteger(attempts) ||
		attempts < 1 ||
		probabilities.some((p) => p < 0 || p > 1 || !Number.isFinite(p))
	)
		throw new RangeError('Invalid probability example');
	return probabilities.reduce((sum, p) => sum + 1 - (1 - p) ** attempts, 0) / probabilities.length;
}
export function selectedSuccess(coverage: number, selection: number) {
	return coverage * selection;
}
export function routingCost(escalation: number) {
	return 1.5 + 10 * escalation;
}
export const percent = (value: number) => `${(value * 100).toFixed(2)}%`;
