// Synthetic release-bundle experiment. No model, API, network, or customer data.
// Run with Node.js: node release-replay.mjs
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const documents = {
	'docs-v1': { id: 'example-observation-v1', observationMinutes: 5 },
	'docs-v2': { id: 'example-observation-v2', observationMinutes: 10 }
};
const prompts = {
	'prompt-v1': '자료에 적힌 관찰 시간을 단위와 함께 설명한다.',
	'prompt-v2': '관찰 시간과 해당 자료의 식별자를 함께 설명한다.'
};
const baseline = {
	model: 'example-model-A', prompt: 'prompt-v1', index: 'docs-v1',
	toolSchema: 'schema-v1', policy: 'internal-only-v1', evaluator: 'rubric-v1'
};
const changed = {
	...baseline, model: 'example-model-B', prompt: 'prompt-v2', index: 'docs-v2'
};
const cases = [
	{ id: 'baseline', label: '기준 구성', bundle: baseline },
	{ id: 'changed', label: '변경 구성', bundle: changed },
	{ id: 'model-only', label: '모델 ID만 복원', bundle: { ...changed, model: baseline.model } },
	{ id: 'full-restore', label: '전체 구성 복원', bundle: { ...baseline } }
];
const digest = value => createHash('sha256').update(value).digest('hex');
const runs = cases.map(({ id, label, bundle }) => {
	const doc = documents[bundle.index];
	const context = `${prompts[bundle.prompt]}\n질문: 예제 절차의 관찰 시간은?\n자료: ${doc.id}\n관찰 시간: ${doc.observationMinutes}분`;
	return { id, label, bundle, retrievedMinutes: doc.observationMinutes,
		context, contextDigest: digest(context), bundleDigest: digest(JSON.stringify(bundle)) };
});
const checks = {
	modelIdRestored: runs[2].bundle.model === runs[0].bundle.model,
	modelOnlyContextDiffers: runs[2].contextDigest !== runs[0].contextDigest,
	fullContextRestored: runs[3].contextDigest === runs[0].contextDigest,
	fullBundleRestored: runs[3].bundleDigest === runs[0].bundleDigest
};
Object.values(checks).forEach(value => assert.equal(value, true));
console.log(JSON.stringify({
	schemaVersion: 1,
	kind: 'deterministic-context-replay',
	scope: '합성 자료와 구성 ID로 입력을 조립한 실행 결과. 실제 모델을 호출하거나 가중치를 복원하지 않음.',
	runtime: process.version,
	runs, checks
}, null, 2));
