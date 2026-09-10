import type { NotebookArea } from '../notebook';

export type AiSlug = 'learning-and-evaluation' | 'data-that-teaches' | 'compute-and-orchestration';
export type AiWidget = 'evaluation' | 'data' | 'routing' | 'release';
export type AiArticleMeta = {
	slug: AiSlug;
	file: string;
	order: number;
	title: string;
	description: string;
	label: string;
	areas: NotebookArea[];
	tags: string[];
	readingMinutes: number;
	sections: { id: string; widget?: AiWidget; diagram?: 'inference' }[];
};

export const aiReviewedAt = '2026-09-10';
export const aiArticlePath = (slug: string) => `/ko/notebook/ai/${slug}/`;
export const aiArticles: AiArticleMeta[] = [
	{
		slug: 'learning-and-evaluation',
		file: '01-learning-and-evaluation.md',
		order: 1,
		title: '모델이 좋아졌다는 말에는 빠진 조건이 있다',
		description:
			'학습할 문제를 고르는 일부터 pass@k, 정답 선택, 평가기의 오류와 회귀까지. 새 모델로 바꿀 근거를 따져봅니다.',
		label: '학습과 평가',
		areas: ['ai'],
		tags: ['평가', 'pass@k', 'SFT', 'RLVR', '증류', 'RAG'],
		readingMinutes: 22,
		sections: [
			{ id: 'before-training' },
			{ id: 'answer-distribution' },
			{ id: 'selection', widget: 'evaluation' },
			{ id: 'learning-signals' },
			{ id: 'research-results' },
			{ id: 'judge-the-judge' },
			{ id: 'regressions' },
			{ id: 'evaluation-records' }
		]
	},
	{
		slug: 'data-that-teaches',
		file: '02-data-that-teaches.md',
		order: 2,
		title: '모델이 배울 만한 데이터를 만드는 과정',
		description:
			'문서에서 문제를 만들고 정답을 검수한 뒤, 교사와 학생의 차이·다양성·분리된 평가를 하나의 제작 과정으로 연결합니다.',
		label: '데이터 설계',
		areas: ['ai'],
		tags: ['학습 데이터', 'Golden Goose', 'DeltaPrompts', 'Vendi', '검수'],
		readingMinutes: 21,
		sections: [
			{ id: 'different-decisions', widget: 'data' },
			{ id: 'make-tasks' },
			{ id: 'independent-review' },
			{ id: 'teacher-student-gap' },
			{ id: 'diversity' },
			{ id: 'controlled-evaluation' },
			{ id: 'data-version' }
		]
	},
	{
		slug: 'compute-and-orchestration',
		file: '03-compute-and-orchestration.md',
		order: 3,
		title: 'AI에 계산을 더 쓰기 전에 정해야 할 것',
		description:
			'요청을 나누고 도구와 모델을 고르는 과정. 비용·정확도·p95를 비교하고, 탐색·학습·구성 복원의 조건까지 살펴봅니다.',
		label: '추론 시스템',
		areas: ['ai', 'ops', 'sec'],
		tags: ['오케스트레이션', 'ToolOrchestra', 'TTT', '비용', '지연', '롤백'],
		readingMinutes: 22,
		sections: [
			{ id: 'one-request', diagram: 'inference' },
			{ id: 'tool-contracts' },
			{ id: 'orchestrator' },
			{ id: 'routing-cost', widget: 'routing' },
			{ id: 'latency' },
			{ id: 'test-time-learning' },
			{ id: 'release-bundle', widget: 'release' },
			{ id: 'execution-boundary' }
		]
	}
];
