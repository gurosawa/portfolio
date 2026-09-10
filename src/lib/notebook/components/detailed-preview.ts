import type { PreviewNode, PreviewScene } from './flow-preview';

export type DetailedPreviewKind = 'pipeline' | 'ml';

/** The roles and paths follow Ops articles 10 and 12; these are conceptual, not live status. */
export function detailedPreview(kind: DetailedPreviewKind, narrow: boolean): PreviewScene {
	const ml = kind === 'ml';
	const wide = ml
		? [
				[16, 62],
				[238, 62],
				[460, 62],
				[460, 266],
				[16, 266],
				[238, 266],
				[460, 466],
				[238, 466],
				[16, 466]
			]
		: [
				[16, 38],
				[238, 38],
				[460, 38],
				[460, 238],
				[16, 238],
				[238, 238],
				[238, 438],
				[460, 438]
			];
	const mobile = ml
		? [
				[10, 40],
				[202, 40],
				[202, 220],
				[202, 400],
				[10, 220],
				[10, 400],
				[202, 580],
				[10, 580],
				[10, 760]
			]
		: [
				[10, 38],
				[202, 38],
				[202, 218],
				[202, 398],
				[10, 218],
				[10, 398],
				[10, 578],
				[202, 578]
			];
	const positions = narrow ? mobile : wide;
	const width = narrow ? 148 : 164;
	const node = (
		index: number,
		id: string,
		title: string,
		detail: string,
		shape: PreviewNode['shape'],
		accent = false
	): PreviewNode => ({
		id,
		x: positions[index][0],
		y: positions[index][1],
		width,
		title,
		detail,
		shape,
		accent
	});
	const edge = (
		id: string,
		from: string,
		to: string,
		widePath: string,
		narrowPath: string,
		label: string,
		x: number,
		y: number,
		dashed = false
	) => ({
		id,
		from,
		to,
		path: narrow ? narrowPath : widePath,
		label: narrow ? undefined : label,
		x,
		y,
		dashed
	});
	if (!ml)
		return {
			title: 'GitLab CI에서 GitOps 배포와 응답 확인까지',
			description:
				'소스 commit에서 테스트와 Rootless BuildKit 빌드가 실행됩니다. 이미지는 Harbor에 저장하고, CI는 별도로 Chart 저장소의 이미지 태그를 갱신합니다. Argo CD가 배포 선언을 Kubernetes에 동기화하면 클러스터가 Harbor 이미지를 가져옵니다. 마지막으로 실제 HTTP 응답을 확인합니다.',
			caption:
				'Ops 10편의 개념도. 실선은 실행·선언의 전달, 점선은 클러스터의 이미지 pull 요청입니다.',
			nodes: [
				node(0, 'source', 'GitLab', '앱 소스 commit', 'document'),
				node(1, 'test', 'Test job', '코드·동작 검증', 'process'),
				node(2, 'build', 'BuildKit', 'rootless 빌드', 'process'),
				node(3, 'registry', 'Harbor', '이미지·SHA tag', 'registry'),
				node(4, 'config', 'Chart repo', 'values의 tag 갱신', 'document'),
				node(5, 'reconcile', 'Argo CD', 'Git 선언 동기화', 'process'),
				node(6, 'cluster', 'Kubernetes', 'Deployment·Pod', 'service', true),
				node(7, 'verify', 'HTTP 확인', '실제 응답 검증', 'actor')
			],
			connections: [
				edge('source-test', 'source', 'test', 'M 180 92 H 238', 'M 158 92 H 202', '', 0, 0),
				edge('test-build', 'test', 'build', 'M 402 92 H 460', 'M 276 146 V 218', '', 0, 0),
				edge(
					'build-push',
					'build',
					'registry',
					'M 542 146 V 238',
					'M 276 326 V 398',
					'image push',
					578,
					195
				),
				edge(
					'values-commit',
					'build',
					'config',
					'M 498 146 V 192 H 98 V 238',
					'M 202 272 H 158',
					'values commit',
					294,
					182
				),
				edge('git-sync', 'config', 'reconcile', 'M 180 292 H 238', 'M 84 326 V 398', '', 0, 0),
				edge(
					'apply',
					'reconcile',
					'cluster',
					'M 308 346 V 438',
					'M 84 506 V 578',
					'선언 반영',
					260,
					398
				),
				edge(
					'image-pull',
					'cluster',
					'registry',
					'M 368 438 V 392 H 542 V 346',
					'M 130 578 V 548 H 276 V 506',
					'image pull',
					482,
					384,
					true
				),
				edge('http-check', 'cluster', 'verify', 'M 402 492 H 460', 'M 158 632 H 202', '', 0, 0)
			],
			phases: [
				{
					id: 'build',
					label: 'CI 빌드',
					title: '코드를 검증하고 이미지를 만든다',
					description:
						'GitLab의 테스트가 통과하면 Rootless BuildKit으로 이미지를 빌드해 Harbor에 push합니다. 실행 파일인 이미지와 배포 선언은 서로 다른 저장소에 남습니다.',
					nodes: ['source', 'test', 'build', 'registry'],
					connections: ['source-test', 'test-build', 'build-push']
				},
				{
					id: 'gitops',
					label: 'GitOps 배포',
					title: 'Git에 남은 배포 선언을 따라간다',
					description:
						'CI는 Chart 저장소의 values에 이미지 태그를 기록합니다. Argo CD가 이를 읽어 클러스터를 맞추고, Kubernetes가 Harbor에서 이미지를 pull합니다. CI가 클러스터에 직접 배포하는 경로는 없습니다.',
					nodes: ['build', 'config', 'reconcile', 'cluster', 'registry'],
					connections: ['values-commit', 'git-sync', 'apply', 'image-pull']
				},
				{
					id: 'verify',
					label: '응답 확인',
					title: '배포 상태와 실제 응답을 함께 확인한다',
					description:
						'Pod가 실행됐는지 확인한 뒤 서비스 진입 경로의 HTTP 응답도 검사합니다. 이미지 digest, 배포 저장소 commit, Argo CD revision과 실행 중인 이미지를 연결해 추적합니다.',
					nodes: ['cluster', 'verify'],
					connections: ['http-check']
				}
			]
		};
	return {
		title: '학습 실행, 실험 기록, 모델 승인과 서빙의 역할',
		description:
			'학습 데이터는 Ray가 읽고, KubeRay는 RayJob의 실행 환경과 수명주기를 관리합니다. Ray의 학습 코드는 MLflow에 지표와 모델 버전을 기록하고 모델 파일은 S3 또는 MinIO에 보관합니다. 평가와 승인을 거친 모델 URI를 배포 선언에 반영하면 KServe가 그 파일을 읽어 추론 API로 제공합니다. Knative는 선택한 서빙 모드에서만 사용합니다.',
		caption:
			'Ops 12편의 역할을 나눈 개념도. 모델 파일과 실험 기록을 구분하며, Knative는 선택 사항입니다.',
		nodes: [
			node(0, 'data', 'Data', '고정한 학습 데이터', 'document'),
			node(1, 'kuberay', 'KubeRay', 'RayJob 수명 관리', 'process'),
			node(2, 'training', 'Ray', '학습 코드 실행', 'process'),
			node(3, 'tracking', 'MLflow', '지표·run·모델 버전', 'registry'),
			node(4, 'artifacts', 'S3 / MinIO', '모델 파일 보관', 'registry'),
			node(5, 'evaluation', '모델 평가', '기준·결과 비교', 'process'),
			node(6, 'approval', '배포 승인', '선택한 URI 선언', 'document'),
			node(7, 'serving', 'KServe', '모델 추론 API', 'service', true),
			node(8, 'knative', 'Knative', '선택: 요청 기반 확장', 'service')
		],
		connections: [
			edge(
				'training-data',
				'data',
				'training',
				'M 98 62 V 28 H 542 V 62',
				'M 158 94 H 180 V 274 H 202',
				'학습 데이터',
				306,
				20
			),
			edge('rayjob', 'kuberay', 'training', 'M 402 116 H 460', 'M 276 148 V 220', '', 0, 0),
			edge(
				'log-run',
				'training',
				'tracking',
				'M 572 170 V 224 H 542 V 266',
				'M 276 328 V 400',
				'실험 기록',
				578,
				244
			),
			edge(
				'save-model',
				'training',
				'artifacts',
				'M 508 170 V 206 H 98 V 266',
				'M 202 274 H 158',
				'모델 파일 저장',
				300,
				198
			),
			edge('compare', 'tracking', 'evaluation', 'M 460 320 H 402', 'M 202 454 H 158', '', 0, 0),
			edge(
				'approve',
				'evaluation',
				'approval',
				'M 320 374 V 414 H 542 V 466',
				'M 84 508 V 544 H 276 V 580',
				'기준 통과 후 승인',
				453,
				406
			),
			edge(
				'serve-model',
				'artifacts',
				'serving',
				'M 98 374 V 434 H 280 V 466',
				'M 10 274 H 2 V 634 H 10',
				'모델 파일 로드',
				166,
				426
			),
			edge('deploy', 'approval', 'serving', 'M 460 520 H 402', 'M 202 634 H 158', '', 0, 0),
			edge(
				'optional-runtime',
				'serving',
				'knative',
				'M 238 520 H 180',
				'M 84 688 V 760',
				'',
				0,
				0,
				true
			)
		],
		phases: [
			{
				id: 'training',
				label: '학습 실행',
				title: '실행 환경을 관리하는 쪽과 학습하는 쪽',
				description:
					'KubeRay가 RayJob과 Ray 클러스터의 수명주기를 관리합니다. 실제 학습 코드는 Ray에서 데이터를 읽어 실행하며, MLflow가 계산을 스케줄링하는 것은 아닙니다.',
				nodes: ['data', 'kuberay', 'training'],
				connections: ['training-data', 'rayjob']
			},
			{
				id: 'evaluation',
				label: '기록·평가',
				title: '실험 정보와 모델 파일을 연결한다',
				description:
					'학습 코드는 run과 지표를 MLflow에 기록하고 큰 모델 파일은 S3/MinIO에 보관합니다. 평가 결과와 모델 버전을 비교해 배포할 후보를 정합니다. 이 그림은 MLflow의 자동 승인 기능을 뜻하지 않습니다.',
				nodes: ['training', 'tracking', 'artifacts', 'evaluation'],
				connections: ['log-run', 'save-model', 'compare']
			},
			{
				id: 'serving',
				label: '승인·서빙',
				title: '승인된 모델을 추론 API로 제공한다',
				description:
					'선택한 모델 URI를 배포 선언에 반영한 뒤 KServe가 모델 파일을 읽습니다. 선언의 전달 과정은 생략했습니다. Knative는 해당 모드에서만 사용하며 학습 완료만으로 배포 승인이 이루어지지는 않습니다.',
				nodes: ['evaluation', 'approval', 'artifacts', 'serving', 'knative'],
				connections: ['approve', 'serve-model', 'deploy', 'optional-runtime']
			}
		]
	};
}
