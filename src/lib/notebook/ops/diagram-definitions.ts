// Curated reading stages for the preserved manuscript diagrams.
// Import runtime data from server-side Markdown only; client components use type-only imports.
export type DiagramNode = { id: string; label: string; detail: string };
export type DiagramEdge = {
	id: string;
	from: string;
	to: string;
	label: string;
	kind: 'flow' | 'relation' | 'return' | 'bidirectional';
};
export type DiagramStage = {
	title: string;
	description: string;
	nodes: { id: string; col: number; row: number }[];
	edges: string[];
};
export type ArticleDiagramDefinition = {
	id: string;
	title: string;
	mode: 'flow' | 'sequence' | 'relation';
	source: string;
	nodes: DiagramNode[];
	edges: DiagramEdge[];
	stages: DiagramStage[];
};

export const diagramDefinitions: ArticleDiagramDefinition[] = [
	{
		id: '01-rke2-kubernetes-foundation-1',
		title: 'Kubespray와 RKE2의 운영 방식',
		mode: 'relation',
		source:
			'flowchart LR\n  subgraph K["Kubespray: 구성요소를 조립"]\n    A["Ansible inventory와 변수"] --> B["kubeadm·kubelet·런타임"]\n    A --> C["CNI·DNS·애드온"]\n  end\n  subgraph R["RKE2: 배포판을 운영"]\n    D["config.yaml"] --> E["rke2-server / rke2-agent"]\n    E --> F["containerd·etcd·control plane·CNI"]\n  end',
		nodes: [
			{
				id: 'A',
				label: 'Ansible 설정',
				detail: 'Kubespray · inventory와 변수'
			},
			{
				id: 'B',
				label: 'Kubernetes 구성요소',
				detail: 'kubeadm·kubelet·런타임'
			},
			{
				id: 'C',
				label: '네트워크·애드온',
				detail: 'CNI·DNS·애드온'
			},
			{
				id: 'D',
				label: 'config.yaml',
				detail: 'RKE2 설정'
			},
			{
				id: 'E',
				label: 'RKE2 서비스',
				detail: 'rke2-server / rke2-agent'
			},
			{
				id: 'F',
				label: '배포판 구성요소',
				detail: 'containerd·etcd·control plane·CNI'
			}
		],
		edges: [
			{
				id: 'A-B',
				from: 'A',
				to: 'B',
				label: '구성요소 조립',
				kind: 'relation'
			},
			{
				id: 'A-C',
				from: 'A',
				to: 'C',
				label: '애드온 구성',
				kind: 'relation'
			},
			{
				id: 'D-E',
				from: 'D',
				to: 'E',
				label: '서비스 설정',
				kind: 'relation'
			},
			{
				id: 'E-F',
				from: 'E',
				to: 'F',
				label: '배포판 운영',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: 'Kubespray의 설정',
				description: 'Kubespray는 Ansible inventory와 변수로 구성요소를 조립합니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'B',
						col: 1,
						row: 1
					}
				],
				edges: ['A-B']
			},
			{
				title: '애드온도 같은 설정에서',
				description:
					'런타임과 애드온은 서로 다른 구성 대상입니다. 이 두 갈래는 설치 순서를 뜻하지 않습니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'B',
						col: 1,
						row: 0
					},
					{
						id: 'C',
						col: 1,
						row: 2
					}
				],
				edges: ['A-B', 'A-C']
			},
			{
				title: 'RKE2의 운영 단위',
				description: 'RKE2는 config.yaml로 서비스를 설정하고 배포판에 묶인 구성요소를 운영합니다.',
				nodes: [
					{
						id: 'D',
						col: 0,
						row: 1
					},
					{
						id: 'E',
						col: 1,
						row: 1
					},
					{
						id: 'F',
						col: 2,
						row: 1
					}
				],
				edges: ['D-E', 'E-F']
			}
		]
	},
	{
		id: '02-kubernetes-traffic-kube-vip-metallb-gateway-api-1',
		title: '관리 요청과 애플리케이션 트래픽',
		mode: 'flow',
		source:
			'flowchart TB\n  ADMIN["kubectl·RKE2 agent"] -->|"API 6443 / 등록 9345"| CPVIP["kube-vip\\nCONTROL_PLANE_VIP"]\n  CPVIP --> CP1["RKE2 server 1"]\n  CPVIP -. "장애 시 VIP 이동" .-> CP2["RKE2 server 2"]\n  CPVIP -. "장애 시 VIP 이동" .-> CP3["RKE2 server 3"]\n\n  USER["외부 사용자"] -->|"HTTP/HTTPS"| LBIP["MetalLB가 할당한 외부 IP"]\n  LBIP --> NGF["NGINX Gateway Fabric 데이터 플레인"]\n  NGF -->|"Gateway + HTTPRoute"| SVC["Kubernetes Service"]\n  SVC --> POD["Application Pods"]',
		nodes: [
			{
				id: 'ADMIN',
				label: '관리 클라이언트',
				detail: 'kubectl·RKE2 agent'
			},
			{
				id: 'CPVIP',
				label: 'kube-vip',
				detail: 'CONTROL_PLANE_VIP'
			},
			{
				id: 'CP1',
				label: 'RKE2 server 1',
				detail: '현재 VIP 소유 노드'
			},
			{
				id: 'CP2',
				label: 'RKE2 server 2',
				detail: '장애 시 VIP 이동 대상'
			},
			{
				id: 'CP3',
				label: 'RKE2 server 3',
				detail: '장애 시 VIP 이동 대상'
			},
			{
				id: 'USER',
				label: '외부 사용자',
				detail: 'HTTP/HTTPS 접속'
			},
			{
				id: 'LBIP',
				label: '앱의 외부 IP',
				detail: 'MetalLB가 할당한 외부 IP'
			},
			{
				id: 'NGF',
				label: 'Gateway 데이터 플레인',
				detail: 'NGINX Gateway Fabric'
			},
			{
				id: 'SVC',
				label: 'Kubernetes Service',
				detail: '앱으로 라우팅'
			},
			{
				id: 'POD',
				label: 'Application Pods',
				detail: '실제 요청 처리'
			}
		],
		edges: [
			{
				id: 'ADMIN-CPVIP',
				from: 'ADMIN',
				to: 'CPVIP',
				label: 'API 6443 / 등록 9345',
				kind: 'flow'
			},
			{
				id: 'CPVIP-CP1',
				from: 'CPVIP',
				to: 'CP1',
				label: '현재 VIP 경로',
				kind: 'flow'
			},
			{
				id: 'CPVIP-CP2',
				from: 'CPVIP',
				to: 'CP2',
				label: '장애 시 VIP 이동',
				kind: 'relation'
			},
			{
				id: 'CPVIP-CP3',
				from: 'CPVIP',
				to: 'CP3',
				label: '장애 시 VIP 이동',
				kind: 'relation'
			},
			{
				id: 'USER-LBIP',
				from: 'USER',
				to: 'LBIP',
				label: 'HTTP/HTTPS',
				kind: 'flow'
			},
			{
				id: 'LBIP-NGF',
				from: 'LBIP',
				to: 'NGF',
				label: '요청 전달',
				kind: 'flow'
			},
			{
				id: 'NGF-SVC',
				from: 'NGF',
				to: 'SVC',
				label: 'Gateway + HTTPRoute',
				kind: 'flow'
			},
			{
				id: 'SVC-POD',
				from: 'SVC',
				to: 'POD',
				label: '앱 요청',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '관리 요청의 진입점',
				description:
					'kubectl과 RKE2 agent는 관리용 VIP를 사용합니다. API는 6443, 노드 등록은 9345 포트입니다.',
				nodes: [
					{
						id: 'ADMIN',
						col: 0,
						row: 1
					},
					{
						id: 'CPVIP',
						col: 1,
						row: 1
					},
					{
						id: 'CP1',
						col: 2,
						row: 1
					}
				],
				edges: ['ADMIN-CPVIP', 'CPVIP-CP1']
			},
			{
				title: 'VIP 소유 노드가 바뀌면',
				description:
					'현재 리더가 멈추면 다른 노드가 VIP를 이어받습니다. server 2와 3은 순차 경유지가 아니라 대안입니다.',
				nodes: [
					{
						id: 'CPVIP',
						col: 0,
						row: 1
					},
					{
						id: 'CP1',
						col: 1,
						row: 0
					},
					{
						id: 'CP2',
						col: 1,
						row: 1
					},
					{
						id: 'CP3',
						col: 1,
						row: 2
					}
				],
				edges: ['CPVIP-CP1', 'CPVIP-CP2', 'CPVIP-CP3']
			},
			{
				title: '앱 요청은 다른 IP로',
				description:
					'외부 사용자는 MetalLB가 할당한 앱의 외부 IP로 접속합니다. 관리용 VIP와는 별개입니다.',
				nodes: [
					{
						id: 'USER',
						col: 0,
						row: 1
					},
					{
						id: 'LBIP',
						col: 1,
						row: 1
					},
					{
						id: 'NGF',
						col: 2,
						row: 1
					}
				],
				edges: ['USER-LBIP', 'LBIP-NGF']
			},
			{
				title: 'HTTPRoute로 앱 선택',
				description:
					'Gateway 데이터 플레인이 Gateway와 HTTPRoute 설정에 따라 Service를 선택하고 Pod로 요청을 전달합니다.',
				nodes: [
					{
						id: 'NGF',
						col: 0,
						row: 1
					},
					{
						id: 'SVC',
						col: 1,
						row: 1
					},
					{
						id: 'POD',
						col: 2,
						row: 1
					}
				],
				edges: ['NGF-SVC', 'SVC-POD']
			}
		]
	},
	{
		id: '03-kubernetes-storage-nfs-csi-1',
		title: 'PVC 요청에서 NFS 마운트까지',
		mode: 'flow',
		source:
			'flowchart LR\n  APP["Pod: /shared가 필요"] --> PVC["PVC: RWX 1Gi 요청"]\n  PVC --> SC["StorageClass: nfs-csi"]\n  SC --> DRIVER["CSI Driver: nfs.csi.k8s.io"]\n  DRIVER --> NFS["NFS export 아래 subdirectory 생성"]\n  DRIVER --> PV["PV 객체 생성"]\n  PV --> PVC\n  PV --> MOUNT["각 노드 kubelet이 NFS mount"]\n  MOUNT --> APP',
		nodes: [
			{
				id: 'APP',
				label: 'Pod',
				detail: '/shared가 필요'
			},
			{
				id: 'PVC',
				label: 'PVC',
				detail: 'RWX 1Gi 요청'
			},
			{
				id: 'SC',
				label: 'StorageClass',
				detail: 'nfs-csi'
			},
			{
				id: 'DRIVER',
				label: 'NFS CSI Driver',
				detail: 'nfs.csi.k8s.io'
			},
			{
				id: 'NFS',
				label: '기존 NFS export',
				detail: '아래에 subdirectory 생성'
			},
			{
				id: 'PV',
				label: 'PV 객체',
				detail: '실제 볼륨과 PVC의 연결'
			},
			{
				id: 'MOUNT',
				label: '노드에서 NFS mount',
				detail: '각 노드의 kubelet'
			}
		],
		edges: [
			{
				id: 'APP-PVC',
				from: 'APP',
				to: 'PVC',
				label: '볼륨 요구',
				kind: 'relation'
			},
			{
				id: 'PVC-SC',
				from: 'PVC',
				to: 'SC',
				label: 'StorageClass 선택',
				kind: 'relation'
			},
			{
				id: 'SC-DRIVER',
				from: 'SC',
				to: 'DRIVER',
				label: 'provisioner 지정',
				kind: 'relation'
			},
			{
				id: 'DRIVER-NFS',
				from: 'DRIVER',
				to: 'NFS',
				label: '하위 디렉터리 생성',
				kind: 'flow'
			},
			{
				id: 'DRIVER-PV',
				from: 'DRIVER',
				to: 'PV',
				label: 'PV 생성',
				kind: 'flow'
			},
			{
				id: 'PV-PVC',
				from: 'PV',
				to: 'PVC',
				label: '바인딩',
				kind: 'relation'
			},
			{
				id: 'PV-MOUNT',
				from: 'PV',
				to: 'MOUNT',
				label: '마운트할 볼륨',
				kind: 'relation'
			},
			{
				id: 'MOUNT-APP',
				from: 'MOUNT',
				to: 'APP',
				label: '볼륨 마운트',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '앱이 필요한 볼륨 요청',
				description: 'Pod는 /shared에 연결할 PVC를 참조합니다. PVC에는 RWX와 1Gi 요구를 적습니다.',
				nodes: [
					{
						id: 'APP',
						col: 0,
						row: 1
					},
					{
						id: 'PVC',
						col: 1,
						row: 1
					}
				],
				edges: ['APP-PVC']
			},
			{
				title: '제공 정책과 Driver 선택',
				description: 'nfs-csi StorageClass는 nfs.csi.k8s.io Driver와 NFS 설정을 지정합니다.',
				nodes: [
					{
						id: 'PVC',
						col: 0,
						row: 1
					},
					{
						id: 'SC',
						col: 1,
						row: 1
					},
					{
						id: 'DRIVER',
						col: 2,
						row: 1
					}
				],
				edges: ['PVC-SC', 'SC-DRIVER']
			},
			{
				title: '기존 NFS에 공간 마련',
				description:
					'Driver는 준비된 NFS export 아래에 PVC별 하위 디렉터리를 만듭니다. NFS 서버 자체를 새로 설치하는 단계는 아닙니다.',
				nodes: [
					{
						id: 'DRIVER',
						col: 0,
						row: 1
					},
					{
						id: 'NFS',
						col: 1,
						row: 1
					}
				],
				edges: ['DRIVER-NFS']
			},
			{
				title: 'PV와 PVC 연결',
				description: '생성된 볼륨은 PV 객체로 등록되고 PVC에 바인딩됩니다.',
				nodes: [
					{
						id: 'DRIVER',
						col: 0,
						row: 1
					},
					{
						id: 'PV',
						col: 1,
						row: 1
					},
					{
						id: 'PVC',
						col: 2,
						row: 1
					}
				],
				edges: ['DRIVER-PV', 'PV-PVC']
			},
			{
				title: '노드에서 마운트',
				description:
					'각 노드의 kubelet이 NFS 볼륨을 마운트하면 Pod가 /shared로 접근할 수 있습니다.',
				nodes: [
					{
						id: 'PV',
						col: 0,
						row: 1
					},
					{
						id: 'MOUNT',
						col: 1,
						row: 1
					},
					{
						id: 'APP',
						col: 2,
						row: 1
					}
				],
				edges: ['PV-MOUNT', 'MOUNT-APP']
			}
		]
	},
	{
		id: '04-keycloak-oidc-saml-sso-1',
		title: '중앙 인증과 서비스별 권한',
		mode: 'relation',
		source:
			'flowchart LR\n  U["사용자 브라우저"]\n  KC["Keycloak<br/>중앙 인증과 SSO 세션"]\n  A["Argo CD<br/>자체 RBAC"]\n  G["Grafana<br/>자체 권한"]\n  H["Harbor<br/>자체 권한"]\n\n  U <-->|"로그인·MFA"| KC\n  U --> A\n  U --> G\n  U --> H\n  A <-->|"OIDC"| KC\n  G <-->|"OIDC"| KC\n  H <-->|"OIDC"| KC',
		nodes: [
			{
				id: 'U',
				label: '사용자 브라우저',
				detail: '각 서비스에 접속'
			},
			{
				id: 'KC',
				label: 'Keycloak',
				detail: '중앙 인증과 SSO 세션'
			},
			{
				id: 'A',
				label: 'Argo CD',
				detail: '자체 RBAC'
			},
			{
				id: 'G',
				label: 'Grafana',
				detail: '자체 권한'
			},
			{
				id: 'H',
				label: 'Harbor',
				detail: '자체 권한'
			}
		],
		edges: [
			{
				id: 'U-KC',
				from: 'U',
				to: 'KC',
				label: '로그인·MFA',
				kind: 'bidirectional'
			},
			{
				id: 'U-A',
				from: 'U',
				to: 'A',
				label: '서비스 접속',
				kind: 'flow'
			},
			{
				id: 'U-G',
				from: 'U',
				to: 'G',
				label: '서비스 접속',
				kind: 'flow'
			},
			{
				id: 'U-H',
				from: 'U',
				to: 'H',
				label: '서비스 접속',
				kind: 'flow'
			},
			{
				id: 'A-KC',
				from: 'A',
				to: 'KC',
				label: 'OIDC',
				kind: 'bidirectional'
			},
			{
				id: 'G-KC',
				from: 'G',
				to: 'KC',
				label: 'OIDC',
				kind: 'bidirectional'
			},
			{
				id: 'H-KC',
				from: 'H',
				to: 'KC',
				label: 'OIDC',
				kind: 'bidirectional'
			}
		],
		stages: [
			{
				title: '로그인은 중앙에서',
				description:
					'Keycloak은 사용자 인증과 SSO 세션을 담당합니다. 서비스끼리 비밀번호를 공유하는 구조가 아닙니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 1
					},
					{
						id: 'KC',
						col: 1,
						row: 1
					}
				],
				edges: ['U-KC']
			},
			{
				title: 'Argo CD의 권한은 Argo CD가',
				description:
					'Argo CD는 OIDC 인증 결과를 확인한 뒤 자체 RBAC 정책으로 허용할 행동을 결정합니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 1
					},
					{
						id: 'A',
						col: 1,
						row: 1
					},
					{
						id: 'KC',
						col: 2,
						row: 1
					}
				],
				edges: ['U-A', 'A-KC']
			},
			{
				title: 'Grafana도 자체 권한 확인',
				description: '같은 Keycloak을 사용해도 Grafana의 권한은 Grafana에서 정합니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 1
					},
					{
						id: 'G',
						col: 1,
						row: 1
					},
					{
						id: 'KC',
						col: 2,
						row: 1
					}
				],
				edges: ['U-G', 'G-KC']
			},
			{
				title: 'Harbor도 같은 책임 분리',
				description: 'Harbor도 중앙 인증을 이용하지만 저장소 접근 권한은 자체 정책에 따릅니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 1
					},
					{
						id: 'H',
						col: 1,
						row: 1
					},
					{
						id: 'KC',
						col: 2,
						row: 1
					}
				],
				edges: ['U-H', 'H-KC']
			}
		]
	},
	{
		id: '04-keycloak-oidc-saml-sso-2',
		title: 'Keycloak 객체와 Realm',
		mode: 'relation',
		source:
			'flowchart TD\n  I["Keycloak 인스턴스"] --> M["master Realm<br/>서버 관리 전용"]\n  I --> R["mlops Realm<br/>서비스 사용자 경계"]\n  R --> C["Clients<br/>Argo CD·Grafana 등"]\n  R --> U["Users"]\n  R --> G["Groups"]\n  R --> RO["Realm / Client Roles"]\n  R --> S["Client Scopes"]\n  S --> PM["Protocol Mappers<br/>토큰 클레임 생성"]\n  R --> F["User Federation<br/>LDAP 디렉터리 연결"]\n  R --> P["Identity Providers<br/>외부 인증 위임"]',
		nodes: [
			{
				id: 'I',
				label: 'Keycloak 인스턴스',
				detail: 'Realm을 운영하는 서버'
			},
			{
				id: 'M',
				label: 'master Realm',
				detail: '서버 관리 전용'
			},
			{
				id: 'R',
				label: 'mlops Realm',
				detail: '서비스 사용자 경계'
			},
			{
				id: 'C',
				label: 'Clients',
				detail: 'Argo CD·Grafana 등'
			},
			{
				id: 'U',
				label: 'Users',
				detail: 'Realm의 사용자'
			},
			{
				id: 'G',
				label: 'Groups',
				detail: '사용자 그룹'
			},
			{
				id: 'RO',
				label: 'Roles',
				detail: 'Realm / Client Roles'
			},
			{
				id: 'S',
				label: 'Client Scopes',
				detail: '토큰에 포함할 정보 범위'
			},
			{
				id: 'PM',
				label: 'Protocol Mappers',
				detail: '토큰 클레임 생성'
			},
			{
				id: 'F',
				label: 'User Federation',
				detail: 'LDAP 디렉터리 연결'
			},
			{
				id: 'P',
				label: 'Identity Providers',
				detail: '외부 인증 위임'
			}
		],
		edges: [
			{
				id: 'I-M',
				from: 'I',
				to: 'M',
				label: '관리 Realm',
				kind: 'relation'
			},
			{
				id: 'I-R',
				from: 'I',
				to: 'R',
				label: '서비스 Realm',
				kind: 'relation'
			},
			{
				id: 'R-C',
				from: 'R',
				to: 'C',
				label: '앱 등록',
				kind: 'relation'
			},
			{
				id: 'R-U',
				from: 'R',
				to: 'U',
				label: '사용자 관리',
				kind: 'relation'
			},
			{
				id: 'R-G',
				from: 'R',
				to: 'G',
				label: '그룹 관리',
				kind: 'relation'
			},
			{
				id: 'R-RO',
				from: 'R',
				to: 'RO',
				label: '역할 관리',
				kind: 'relation'
			},
			{
				id: 'R-S',
				from: 'R',
				to: 'S',
				label: '범위 설정',
				kind: 'relation'
			},
			{
				id: 'S-PM',
				from: 'S',
				to: 'PM',
				label: '클레임 구성',
				kind: 'relation'
			},
			{
				id: 'R-F',
				from: 'R',
				to: 'F',
				label: '디렉터리 연결',
				kind: 'relation'
			},
			{
				id: 'R-P',
				from: 'R',
				to: 'P',
				label: '인증 위임',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: '관리와 서비스 영역 분리',
				description:
					'master Realm은 서버 관리에 사용하고, 서비스 사용자는 별도의 mlops Realm에 둡니다.',
				nodes: [
					{
						id: 'I',
						col: 0,
						row: 1
					},
					{
						id: 'M',
						col: 1,
						row: 0
					},
					{
						id: 'R',
						col: 1,
						row: 2
					}
				],
				edges: ['I-M', 'I-R']
			},
			{
				title: '앱과 사용자 등록',
				description:
					'Clients는 인증을 사용하는 앱이고 Users는 이 Realm의 사용자입니다. 화살표는 포함 관계를 뜻합니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'C',
						col: 1,
						row: 0
					},
					{
						id: 'U',
						col: 1,
						row: 2
					}
				],
				edges: ['R-C', 'R-U']
			},
			{
				title: '그룹과 역할 구성',
				description: 'Groups와 Realm / Client Roles로 사용자 분류와 역할을 구성합니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'G',
						col: 1,
						row: 0
					},
					{
						id: 'RO',
						col: 1,
						row: 2
					}
				],
				edges: ['R-G', 'R-RO']
			},
			{
				title: '토큰에 담을 정보',
				description: 'Client Scopes와 Protocol Mappers가 토큰에 포함할 클레임을 구성합니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'S',
						col: 1,
						row: 1
					},
					{
						id: 'PM',
						col: 2,
						row: 1
					}
				],
				edges: ['R-S', 'S-PM']
			},
			{
				title: '외부 계정·인증 연결',
				description:
					'User Federation은 LDAP 디렉터리를 연결하고, Identity Providers는 외부 인증에 위임합니다. 서로 다른 연계 방식입니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'F',
						col: 1,
						row: 0
					},
					{
						id: 'P',
						col: 1,
						row: 2
					}
				],
				edges: ['R-F', 'R-P']
			}
		]
	},
	{
		id: '04-keycloak-oidc-saml-sso-3',
		title: 'OIDC Authorization Code와 PKCE',
		mode: 'sequence',
		source:
			'sequenceDiagram\n  participant U as 사용자 브라우저\n  participant C as Client\n  participant K as Keycloak\n\n  C->>C: code_verifier 생성\n  C->>C: SHA-256 → code_challenge\n  C->>U: authorize URL 열기\n  U->>K: client_id, redirect_uri, state, challenge\n  K->>U: 로그인·MFA\n  K-->>U: authorization code와 state\n  U-->>C: 정확히 등록된 callback으로 이동\n  C->>K: code + code_verifier로 토큰 요청\n  K->>K: challenge와 verifier 검증\n  K-->>C: ID Token + Access Token\n  C->>C: issuer·audience·서명·만료·nonce 검증',
		nodes: [
			{
				id: 'U',
				label: '사용자 브라우저',
				detail: '로그인 화면과 callback 이동'
			},
			{
				id: 'C',
				label: 'Client',
				detail: 'PKCE 준비·토큰 검증'
			},
			{
				id: 'K',
				label: 'Keycloak',
				detail: '로그인·코드 교환 처리'
			}
		],
		edges: [
			{
				id: 'verifier',
				from: 'C',
				to: 'C',
				label: 'code_verifier 생성',
				kind: 'flow'
			},
			{
				id: 'challenge',
				from: 'C',
				to: 'C',
				label: 'code_challenge 계산',
				kind: 'flow'
			},
			{
				id: 'authorize',
				from: 'C',
				to: 'U',
				label: 'authorize URL 열기',
				kind: 'flow'
			},
			{
				id: 'request',
				from: 'U',
				to: 'K',
				label: '인증 파라미터',
				kind: 'flow'
			},
			{
				id: 'login',
				from: 'K',
				to: 'U',
				label: '로그인·MFA',
				kind: 'flow'
			},
			{
				id: 'code',
				from: 'K',
				to: 'U',
				label: 'authorization code + state',
				kind: 'return'
			},
			{
				id: 'callback',
				from: 'U',
				to: 'C',
				label: '등록된 callback으로 이동',
				kind: 'return'
			},
			{
				id: 'exchange',
				from: 'C',
				to: 'K',
				label: 'code + code_verifier',
				kind: 'flow'
			},
			{
				id: 'pkce-check',
				from: 'K',
				to: 'K',
				label: 'PKCE 검증',
				kind: 'flow'
			},
			{
				id: 'tokens',
				from: 'K',
				to: 'C',
				label: 'ID Token + Access Token',
				kind: 'return'
			},
			{
				id: 'token-check',
				from: 'C',
				to: 'C',
				label: '토큰 검증',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: 'PKCE 값 준비',
				description: 'Client가 code_verifier를 만들고 SHA-256으로 code_challenge를 계산합니다.',
				nodes: [
					{
						id: 'C',
						col: 1,
						row: 1
					}
				],
				edges: ['verifier', 'challenge']
			},
			{
				title: '인증 요청 보내기',
				description:
					'Client가 브라우저에서 authorize URL을 엽니다. 요청에는 client_id, redirect_uri, state, challenge가 포함됩니다.',
				nodes: [
					{
						id: 'C',
						col: 0,
						row: 1
					},
					{
						id: 'U',
						col: 1,
						row: 1
					},
					{
						id: 'K',
						col: 2,
						row: 1
					}
				],
				edges: ['authorize', 'request']
			},
			{
				title: '로그인 후 인증 코드 수신',
				description:
					'Keycloak에서 로그인·MFA를 마치면 브라우저가 authorization code와 state를 받습니다.',
				nodes: [
					{
						id: 'K',
						col: 0,
						row: 1
					},
					{
						id: 'U',
						col: 1,
						row: 1
					}
				],
				edges: ['login', 'code']
			},
			{
				title: '등록된 callback으로 복귀',
				description:
					'브라우저는 정확히 등록된 callback으로 Client에 돌아갑니다. 인증 코드는 아직 Access Token이 아닙니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 1
					},
					{
						id: 'C',
						col: 1,
						row: 1
					}
				],
				edges: ['callback']
			},
			{
				title: '코드를 토큰으로 교환',
				description:
					'Client가 code와 code_verifier를 제출하면 Keycloak이 challenge와 verifier를 검증합니다.',
				nodes: [
					{
						id: 'C',
						col: 0,
						row: 1
					},
					{
						id: 'K',
						col: 1,
						row: 1
					}
				],
				edges: ['exchange', 'pkce-check']
			},
			{
				title: '토큰을 받은 뒤에도 검증',
				description:
					'Client는 ID Token과 Access Token을 받은 뒤 issuer·audience·서명·만료·nonce 등 필요한 검증을 수행합니다.',
				nodes: [
					{
						id: 'K',
						col: 0,
						row: 1
					},
					{
						id: 'C',
						col: 1,
						row: 1
					}
				],
				edges: ['tokens', 'token-check']
			}
		]
	},
	{
		id: '04-keycloak-oidc-saml-sso-4',
		title: 'SAML 로그인과 응답 검증',
		mode: 'sequence',
		source:
			'sequenceDiagram\n  participant U as 브라우저\n  participant S as Service Provider\n  participant K as Keycloak IdP\n  U->>S: 보호된 페이지 요청\n  S-->>U: SAML AuthnRequest로 리다이렉트\n  U->>K: AuthnRequest 전달\n  K->>U: 로그인\n  K-->>U: 서명된 SAML Response\n  U->>S: ACS에 HTTP POST\n  S->>S: issuer·서명·audience·시간 조건 검증',
		nodes: [
			{
				id: 'U',
				label: '브라우저',
				detail: '인증 요청과 응답 전달'
			},
			{
				id: 'S',
				label: 'Service Provider',
				detail: '보호된 서비스·ACS'
			},
			{
				id: 'K',
				label: 'Keycloak IdP',
				detail: '사용자 인증·SAML Response'
			}
		],
		edges: [
			{
				id: 'page',
				from: 'U',
				to: 'S',
				label: '보호된 페이지 요청',
				kind: 'flow'
			},
			{
				id: 'redirect',
				from: 'S',
				to: 'U',
				label: 'SAML AuthnRequest 리다이렉트',
				kind: 'return'
			},
			{
				id: 'request',
				from: 'U',
				to: 'K',
				label: 'AuthnRequest 전달',
				kind: 'flow'
			},
			{
				id: 'login',
				from: 'K',
				to: 'U',
				label: '로그인',
				kind: 'flow'
			},
			{
				id: 'response',
				from: 'K',
				to: 'U',
				label: '서명된 SAML Response',
				kind: 'return'
			},
			{
				id: 'post',
				from: 'U',
				to: 'S',
				label: 'ACS에 HTTP POST',
				kind: 'flow'
			},
			{
				id: 'verify',
				from: 'S',
				to: 'S',
				label: 'SAML 응답 검증',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '보호된 서비스에 접근',
				description: '브라우저가 Service Provider의 보호된 페이지를 요청합니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 1
					},
					{
						id: 'S',
						col: 1,
						row: 1
					}
				],
				edges: ['page']
			},
			{
				title: '인증 요청을 IdP로 전달',
				description:
					'서비스가 SAML AuthnRequest로 리다이렉트하면 브라우저가 Keycloak IdP로 전달합니다.',
				nodes: [
					{
						id: 'S',
						col: 0,
						row: 1
					},
					{
						id: 'U',
						col: 1,
						row: 1
					},
					{
						id: 'K',
						col: 2,
						row: 1
					}
				],
				edges: ['redirect', 'request']
			},
			{
				title: 'Keycloak에서 로그인',
				description: '사용자는 Keycloak의 로그인 절차를 거칩니다.',
				nodes: [
					{
						id: 'K',
						col: 0,
						row: 1
					},
					{
						id: 'U',
						col: 1,
						row: 1
					}
				],
				edges: ['login']
			},
			{
				title: '브라우저가 SAML 응답 전달',
				description:
					'Keycloak의 서명된 SAML Response는 브라우저를 거쳐 서비스의 ACS에 HTTP POST로 전달됩니다.',
				nodes: [
					{
						id: 'K',
						col: 0,
						row: 1
					},
					{
						id: 'U',
						col: 1,
						row: 1
					},
					{
						id: 'S',
						col: 2,
						row: 1
					}
				],
				edges: ['response', 'post']
			},
			{
				title: '서비스가 응답 검증',
				description:
					'Service Provider는 issuer·서명·audience·시간 조건을 확인합니다. 응답을 받았다는 사실만으로 접근을 허용하지 않습니다.',
				nodes: [
					{
						id: 'S',
						col: 1,
						row: 1
					}
				],
				edges: ['verify']
			}
		]
	},
	{
		id: '05-keycloak-argocd-rbac-1',
		title: 'Keycloak 그룹에서 Argo CD 권한까지',
		mode: 'relation',
		source:
			'flowchart LR\n  U["사용자"] --> K["Keycloak<br/>로그인·MFA"]\n  D["선택: LDAP 디렉터리"] -.->|"사용자 검증·동기화"| K\n  K -->|"ID Token<br/>groups: argocd-web"| A["Argo CD OIDC"]\n  A --> R["argocd-rbac-cm<br/>그룹 → 역할"]\n  R --> P["AppProject web"]\n  P --> S["허용된 Git 저장소"]\n  P --> N["허용된 클러스터·Namespace"]',
		nodes: [
			{
				id: 'U',
				label: '사용자',
				detail: '로그인 요청'
			},
			{
				id: 'K',
				label: 'Keycloak',
				detail: '로그인·MFA'
			},
			{
				id: 'D',
				label: '선택: LDAP',
				detail: '사용자 검증·동기화'
			},
			{
				id: 'A',
				label: 'Argo CD OIDC',
				detail: 'ID Token 확인'
			},
			{
				id: 'R',
				label: 'argocd-rbac-cm',
				detail: '그룹 → 역할'
			},
			{
				id: 'P',
				label: 'AppProject web',
				detail: '프로젝트의 허용 범위'
			},
			{
				id: 'S',
				label: '허용된 Git 저장소',
				detail: '사용할 수 있는 source'
			},
			{
				id: 'N',
				label: '허용된 배포 대상',
				detail: '클러스터·Namespace'
			}
		],
		edges: [
			{
				id: 'U-K',
				from: 'U',
				to: 'K',
				label: '로그인',
				kind: 'flow'
			},
			{
				id: 'D-K',
				from: 'D',
				to: 'K',
				label: '선택: 사용자 검증·동기화',
				kind: 'relation'
			},
			{
				id: 'K-A',
				from: 'K',
				to: 'A',
				label: 'ID Token · groups: argocd-web',
				kind: 'flow'
			},
			{
				id: 'A-R',
				from: 'A',
				to: 'R',
				label: '그룹을 역할에 연결',
				kind: 'relation'
			},
			{
				id: 'R-P',
				from: 'R',
				to: 'P',
				label: '프로젝트 권한 확인',
				kind: 'relation'
			},
			{
				id: 'P-S',
				from: 'P',
				to: 'S',
				label: '허용 source',
				kind: 'relation'
			},
			{
				id: 'P-N',
				from: 'P',
				to: 'N',
				label: '허용 destination',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: '먼저 사용자 인증',
				description:
					'Keycloak이 로그인·MFA를 처리합니다. LDAP는 선택적으로 연결하는 사용자 디렉터리입니다.',
				nodes: [
					{
						id: 'U',
						col: 0,
						row: 0
					},
					{
						id: 'D',
						col: 0,
						row: 2
					},
					{
						id: 'K',
						col: 1,
						row: 1
					}
				],
				edges: ['U-K', 'D-K']
			},
			{
				title: '그룹 정보를 토큰에 담기',
				description: 'Argo CD가 받는 ID Token에는 groups: argocd-web 같은 그룹 정보가 포함됩니다.',
				nodes: [
					{
						id: 'K',
						col: 0,
						row: 1
					},
					{
						id: 'A',
						col: 1,
						row: 1
					}
				],
				edges: ['K-A']
			},
			{
				title: '그룹을 역할에 연결',
				description:
					'argocd-rbac-cm의 규칙이 그룹과 역할을 연결하고 AppProject web의 권한을 확인합니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'R',
						col: 1,
						row: 1
					},
					{
						id: 'P',
						col: 2,
						row: 1
					}
				],
				edges: ['A-R', 'R-P']
			},
			{
				title: '허용된 저장소와 대상 확인',
				description:
					'AppProject는 사용할 Git 저장소와 배포할 클러스터·Namespace의 범위를 정합니다. 선은 권한 관계이지 배포 트래픽이 아닙니다.',
				nodes: [
					{
						id: 'P',
						col: 0,
						row: 1
					},
					{
						id: 'S',
						col: 1,
						row: 0
					},
					{
						id: 'N',
						col: 1,
						row: 2
					}
				],
				edges: ['P-S', 'P-N']
			}
		]
	},
	{
		id: '06-kubernetes-observability-1',
		title: 'Trace에서 느린 호출 찾기',
		mode: 'relation',
		source:
			'flowchart LR\n  G["gateway<br/>12 ms"] --> A["auth<br/>18 ms"]\n  G --> S["order-service<br/>840 ms"]\n  S --> D["database<br/>790 ms"]',
		nodes: [
			{
				id: 'G',
				label: 'gateway',
				detail: '12 ms'
			},
			{
				id: 'A',
				label: 'auth',
				detail: '18 ms'
			},
			{
				id: 'S',
				label: 'order-service',
				detail: '840 ms'
			},
			{
				id: 'D',
				label: 'database',
				detail: '790 ms'
			}
		],
		edges: [
			{
				id: 'G-A',
				from: 'G',
				to: 'A',
				label: '인증 호출',
				kind: 'relation'
			},
			{
				id: 'G-S',
				from: 'G',
				to: 'S',
				label: '주문 호출',
				kind: 'relation'
			},
			{
				id: 'S-D',
				from: 'S',
				to: 'D',
				label: 'DB 호출',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: '호출 관계부터 보기',
				description:
					'gateway는 auth와 order-service를 호출합니다. 이 그림은 호출 관계와 각 구간의 예시 시간을 보여줍니다.',
				nodes: [
					{
						id: 'G',
						col: 0,
						row: 1
					},
					{
						id: 'A',
						col: 1,
						row: 0
					},
					{
						id: 'S',
						col: 1,
						row: 2
					}
				],
				edges: ['G-A', 'G-S']
			},
			{
				title: '인증 구간 확인',
				description:
					'auth의 예시 시간은 18 ms입니다. 다른 호출 구간과 비교할 때도 원본의 시간을 그대로 봅니다.',
				nodes: [
					{
						id: 'G',
						col: 0,
						row: 1
					},
					{
						id: 'A',
						col: 1,
						row: 1
					}
				],
				edges: ['G-A']
			},
			{
				title: '주문 처리와 DB 구간 비교',
				description:
					'order-service는 840 ms, 연결된 database는 790 ms입니다. 중첩될 수 있는 구간이므로 숫자를 모두 더해 전체 지연시간으로 삼지 않습니다.',
				nodes: [
					{
						id: 'G',
						col: 0,
						row: 1
					},
					{
						id: 'S',
						col: 1,
						row: 1
					},
					{
						id: 'D',
						col: 2,
						row: 1
					}
				],
				edges: ['G-S', 'S-D']
			}
		]
	},
	{
		id: '06-kubernetes-observability-2',
		title: '메트릭·로그·트레이스의 수집 경로',
		mode: 'flow',
		source:
			'flowchart LR\n  subgraph S["신호 소스"]\n    N["노드·Kubernetes 상태"]\n    A["애플리케이션"]\n  end\n  subgraph C["수집·처리"]\n    P["Prometheus scrape"]\n    F["Fluent Bit"]\n    O["OpenTelemetry Collector"]\n  end\n  subgraph B["저장·질의"]\n    M["Prometheus / 장기 메트릭 저장소"]\n    L["Loki 또는 검색 엔진"]\n    T["Tempo / Jaeger"]\n  end\n  subgraph V["사용"]\n    G["Grafana"]\n    R["규칙 평가"]\n    AM["Alertmanager"]\n  end\n\n  N --> P --> M\n  A --> P\n  A --> F --> L\n  A --> O\n  O --> M\n  O --> L\n  O --> T\n  M --> G\n  L --> G\n  T --> G\n  M --> R --> AM',
		nodes: [
			{
				id: 'N',
				label: '노드·Kubernetes',
				detail: '상태 메트릭'
			},
			{
				id: 'A',
				label: '애플리케이션',
				detail: '메트릭·로그·트레이스'
			},
			{
				id: 'P',
				label: 'Prometheus scrape',
				detail: '메트릭 수집'
			},
			{
				id: 'F',
				label: 'Fluent Bit',
				detail: '로그 수집'
			},
			{
				id: 'O',
				label: 'OTel Collector',
				detail: 'OpenTelemetry 수집·처리'
			},
			{
				id: 'M',
				label: '메트릭 저장소',
				detail: 'Prometheus / 장기 메트릭 저장소'
			},
			{
				id: 'L',
				label: '로그 저장소',
				detail: 'Loki 또는 검색 엔진'
			},
			{
				id: 'T',
				label: '트레이스 저장소',
				detail: 'Tempo / Jaeger'
			},
			{
				id: 'G',
				label: 'Grafana',
				detail: '신호 조회·시각화'
			},
			{
				id: 'R',
				label: '규칙 평가',
				detail: '메트릭 기반 조건 확인'
			},
			{
				id: 'AM',
				label: 'Alertmanager',
				detail: '경보 처리'
			}
		],
		edges: [
			{
				id: 'N-P',
				from: 'N',
				to: 'P',
				label: '메트릭 수집',
				kind: 'flow'
			},
			{
				id: 'A-P',
				from: 'A',
				to: 'P',
				label: '메트릭 수집',
				kind: 'flow'
			},
			{
				id: 'P-M',
				from: 'P',
				to: 'M',
				label: '메트릭 저장',
				kind: 'flow'
			},
			{
				id: 'A-F',
				from: 'A',
				to: 'F',
				label: '로그 수집',
				kind: 'flow'
			},
			{
				id: 'F-L',
				from: 'F',
				to: 'L',
				label: '로그 저장',
				kind: 'flow'
			},
			{
				id: 'A-O',
				from: 'A',
				to: 'O',
				label: '관측 신호',
				kind: 'flow'
			},
			{
				id: 'O-M',
				from: 'O',
				to: 'M',
				label: '메트릭',
				kind: 'flow'
			},
			{
				id: 'O-L',
				from: 'O',
				to: 'L',
				label: '로그',
				kind: 'flow'
			},
			{
				id: 'O-T',
				from: 'O',
				to: 'T',
				label: '트레이스',
				kind: 'flow'
			},
			{
				id: 'M-G',
				from: 'M',
				to: 'G',
				label: '메트릭 조회',
				kind: 'relation'
			},
			{
				id: 'L-G',
				from: 'L',
				to: 'G',
				label: '로그 조회',
				kind: 'relation'
			},
			{
				id: 'T-G',
				from: 'T',
				to: 'G',
				label: '트레이스 조회',
				kind: 'relation'
			},
			{
				id: 'M-R',
				from: 'M',
				to: 'R',
				label: '조건 평가',
				kind: 'relation'
			},
			{
				id: 'R-AM',
				from: 'R',
				to: 'AM',
				label: '경보 전달',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: 'Prometheus의 메트릭 수집',
				description:
					'노드·Kubernetes 상태와 애플리케이션 메트릭을 수집해 저장합니다. 이동 표시는 수집된 데이터 방향이며 scrape 요청 방향은 아닙니다.',
				nodes: [
					{
						id: 'N',
						col: 0,
						row: 0
					},
					{
						id: 'A',
						col: 0,
						row: 2
					},
					{
						id: 'P',
						col: 1,
						row: 1
					},
					{
						id: 'M',
						col: 2,
						row: 1
					}
				],
				edges: ['N-P', 'A-P', 'P-M']
			},
			{
				title: 'Fluent Bit의 로그 경로',
				description: '애플리케이션 로그는 Fluent Bit을 거쳐 Loki 또는 검색 엔진에 저장됩니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'F',
						col: 1,
						row: 1
					},
					{
						id: 'L',
						col: 2,
						row: 1
					}
				],
				edges: ['A-F', 'F-L']
			},
			{
				title: 'OpenTelemetry 수집',
				description: '애플리케이션의 관측 신호를 OpenTelemetry Collector가 수집·처리합니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'O',
						col: 1,
						row: 1
					}
				],
				edges: ['A-O']
			},
			{
				title: '신호 종류별 저장소',
				description:
					'Collector는 메트릭·로그·트레이스를 각각의 저장소로 보낼 수 있습니다. 세 저장소는 서로 이어지는 직렬 단계가 아닙니다.',
				nodes: [
					{
						id: 'O',
						col: 0,
						row: 1
					},
					{
						id: 'M',
						col: 1,
						row: 0
					},
					{
						id: 'L',
						col: 1,
						row: 1
					},
					{
						id: 'T',
						col: 1,
						row: 2
					}
				],
				edges: ['O-M', 'O-L', 'O-T']
			},
			{
				title: 'Grafana에서 함께 조회',
				description: 'Grafana는 각 저장소를 조회합니다. 이 연결선은 조회 관계를 나타냅니다.',
				nodes: [
					{
						id: 'M',
						col: 0,
						row: 0
					},
					{
						id: 'L',
						col: 0,
						row: 1
					},
					{
						id: 'T',
						col: 0,
						row: 2
					},
					{
						id: 'G',
						col: 1,
						row: 1
					}
				],
				edges: ['M-G', 'L-G', 'T-G']
			},
			{
				title: '조건을 평가해 경보 전달',
				description:
					'메트릭에 대한 규칙 평가 결과는 Alertmanager로 이어집니다. 화면 조회와는 별개의 경로입니다.',
				nodes: [
					{
						id: 'M',
						col: 0,
						row: 1
					},
					{
						id: 'R',
						col: 1,
						row: 1
					},
					{
						id: 'AM',
						col: 2,
						row: 1
					}
				],
				edges: ['M-R', 'R-AM']
			}
		]
	},
	{
		id: '07-prometheus-grafana-loki-fluent-bit-1',
		title: '컨테이너 로그에서 Grafana Explore까지',
		mode: 'flow',
		source:
			'flowchart LR\n  subgraph N["각 Kubernetes 노드"]\n    P["Pod stdout/stderr"] --> C["CRI 로그 파일"]\n    C --> F["Fluent Bit Collector<br/>DaemonSet"]\n  end\n  F -->|"push + 안정적 labels"| L["Loki"]\n  L --> G["Grafana Explore<br/>LogQL"]\n  M["Prometheus"] --> G',
		nodes: [
			{
				id: 'P',
				label: 'Pod stdout/stderr',
				detail: '컨테이너가 남긴 로그'
			},
			{
				id: 'C',
				label: 'CRI 로그 파일',
				detail: '각 Kubernetes 노드'
			},
			{
				id: 'F',
				label: 'Fluent Bit Collector',
				detail: '노드별 DaemonSet'
			},
			{
				id: 'L',
				label: 'Loki',
				detail: '로그 저장·조회'
			},
			{
				id: 'G',
				label: 'Grafana Explore',
				detail: 'LogQL'
			},
			{
				id: 'M',
				label: 'Prometheus',
				detail: '메트릭 조회 대상'
			}
		],
		edges: [
			{
				id: 'P-C',
				from: 'P',
				to: 'C',
				label: '로그 파일 기록',
				kind: 'flow'
			},
			{
				id: 'C-F',
				from: 'C',
				to: 'F',
				label: '노드 로그 수집',
				kind: 'flow'
			},
			{
				id: 'F-L',
				from: 'F',
				to: 'L',
				label: 'push + 안정적 labels',
				kind: 'flow'
			},
			{
				id: 'L-G',
				from: 'L',
				to: 'G',
				label: 'LogQL 조회',
				kind: 'relation'
			},
			{
				id: 'M-G',
				from: 'M',
				to: 'G',
				label: '메트릭 조회',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: '컨테이너 로그가 파일로',
				description: 'Pod의 stdout/stderr는 노드의 CRI 로그 파일에 기록됩니다.',
				nodes: [
					{
						id: 'P',
						col: 0,
						row: 1
					},
					{
						id: 'C',
						col: 1,
						row: 1
					}
				],
				edges: ['P-C']
			},
			{
				title: '노드마다 Collector 배치',
				description: 'DaemonSet으로 실행되는 Fluent Bit Collector가 노드의 로그 파일을 수집합니다.',
				nodes: [
					{
						id: 'C',
						col: 0,
						row: 1
					},
					{
						id: 'F',
						col: 1,
						row: 1
					}
				],
				edges: ['C-F']
			},
			{
				title: 'Loki에 로그 전송',
				description: 'Fluent Bit은 안정적인 labels와 함께 Loki에 로그를 push합니다.',
				nodes: [
					{
						id: 'F',
						col: 0,
						row: 1
					},
					{
						id: 'L',
						col: 1,
						row: 1
					}
				],
				edges: ['F-L']
			},
			{
				title: '로그와 메트릭 함께 조회',
				description:
					'Grafana Explore에서 LogQL로 Loki 로그를 조회하고 Prometheus 메트릭과 함께 살펴봅니다. 저장소가 Grafana로 계속 push한다는 뜻은 아닙니다.',
				nodes: [
					{
						id: 'L',
						col: 0,
						row: 0
					},
					{
						id: 'M',
						col: 0,
						row: 2
					},
					{
						id: 'G',
						col: 1,
						row: 1
					}
				],
				edges: ['L-G', 'M-G']
			}
		]
	},
	{
		id: '08-cicd-to-gitops-gitlab-1',
		title: 'GitLab CI와 Runner의 실행 순서',
		mode: 'sequence',
		source:
			'sequenceDiagram\n    participant D as 개발자\n    participant G as GitLab\n    participant R as GitLab Runner\n    participant E as 실행 환경\n    D->>G: commit push 또는 Merge Request\n    G->>G: workflow와 rules 평가\n    G->>G: Pipeline과 Job 생성\n    R->>G: 실행 가능한 Job 요청\n    G-->>R: Job 명세와 단기 Job Token\n    R->>E: 실행 환경 준비·소스 checkout\n    E->>E: script 실행\n    E-->>R: 로그·종료 코드·아티팩트\n    R-->>G: Job 결과 업로드',
		nodes: [
			{
				id: 'D',
				label: '개발자',
				detail: 'commit push 또는 Merge Request'
			},
			{
				id: 'G',
				label: 'GitLab',
				detail: 'Pipeline·Job 관리'
			},
			{
				id: 'R',
				label: 'GitLab Runner',
				detail: 'Job 요청·실행 준비'
			},
			{
				id: 'E',
				label: '실행 환경',
				detail: 'script 실행'
			}
		],
		edges: [
			{
				id: 'push',
				from: 'D',
				to: 'G',
				label: 'push / Merge Request',
				kind: 'flow'
			},
			{
				id: 'rules',
				from: 'G',
				to: 'G',
				label: 'workflow·rules 평가',
				kind: 'flow'
			},
			{
				id: 'jobs',
				from: 'G',
				to: 'G',
				label: 'Pipeline·Job 생성',
				kind: 'flow'
			},
			{
				id: 'poll',
				from: 'R',
				to: 'G',
				label: '실행할 Job 요청',
				kind: 'flow'
			},
			{
				id: 'job',
				from: 'G',
				to: 'R',
				label: 'Job 명세·단기 Token',
				kind: 'return'
			},
			{
				id: 'prepare',
				from: 'R',
				to: 'E',
				label: '환경 준비·checkout',
				kind: 'flow'
			},
			{
				id: 'script',
				from: 'E',
				to: 'E',
				label: 'script 실행',
				kind: 'flow'
			},
			{
				id: 'result',
				from: 'E',
				to: 'R',
				label: '로그·종료 코드·아티팩트',
				kind: 'return'
			},
			{
				id: 'upload',
				from: 'R',
				to: 'G',
				label: 'Job 결과 업로드',
				kind: 'return'
			}
		],
		stages: [
			{
				title: '코드 변경이 시작점',
				description:
					'개발자가 commit을 push하거나 Merge Request를 만들면 GitLab이 pipeline 조건을 확인합니다.',
				nodes: [
					{
						id: 'D',
						col: 0,
						row: 1
					},
					{
						id: 'G',
						col: 1,
						row: 1
					}
				],
				edges: ['push']
			},
			{
				title: '실행할 Job 결정',
				description: 'GitLab은 workflow와 rules를 평가하고 Pipeline과 Job을 생성합니다.',
				nodes: [
					{
						id: 'G',
						col: 1,
						row: 1
					}
				],
				edges: ['rules', 'jobs']
			},
			{
				title: 'Runner가 Job을 요청',
				description:
					'Runner가 실행 가능한 Job을 먼저 요청합니다. GitLab은 Job 명세와 단기 Job Token을 반환합니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'G',
						col: 1,
						row: 1
					}
				],
				edges: ['poll', 'job']
			},
			{
				title: '환경을 준비하고 실행',
				description:
					'Runner가 실행 환경과 소스 checkout을 준비하면 그 환경에서 script가 실행됩니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'E',
						col: 1,
						row: 1
					}
				],
				edges: ['prepare', 'script']
			},
			{
				title: '결과를 GitLab에 기록',
				description:
					'실행 환경의 로그·종료 코드·아티팩트가 Runner로 돌아오고, Runner가 Job 결과를 GitLab에 업로드합니다.',
				nodes: [
					{
						id: 'E',
						col: 0,
						row: 1
					},
					{
						id: 'R',
						col: 1,
						row: 1
					},
					{
						id: 'G',
						col: 2,
						row: 1
					}
				],
				edges: ['result', 'upload']
			}
		]
	},
	{
		id: '08-cicd-to-gitops-gitlab-2',
		title: 'CI와 GitOps가 맡는 일',
		mode: 'flow',
		source:
			'flowchart LR\n    dev["개발자"] -->|push / MR| source["GitLab 앱 소스 저장소"]\n    source --> ci["GitLab CI<br/>테스트·Rootless BuildKit"]\n    ci -->|이미지 push| harbor["Harbor<br/>검증된 컨테이너 이미지"]\n    ci -->|image tag 갱신 commit| config["GitLab Helm Chart 저장소<br/>원하는 상태"]\n    config -->|pull·diff| argo["Argo CD"]\n    argo -->|reconcile| cluster["Kubernetes"]\n    cluster -. image pull .-> harbor',
		nodes: [
			{
				id: 'dev',
				label: '개발자',
				detail: 'push / Merge Request'
			},
			{
				id: 'source',
				label: '앱 소스 저장소',
				detail: 'GitLab'
			},
			{
				id: 'ci',
				label: 'GitLab CI',
				detail: '테스트·Rootless BuildKit'
			},
			{
				id: 'harbor',
				label: 'Harbor',
				detail: '검증된 컨테이너 이미지'
			},
			{
				id: 'config',
				label: 'Helm Chart 저장소',
				detail: 'GitLab · 원하는 상태'
			},
			{
				id: 'argo',
				label: 'Argo CD',
				detail: 'Git과 클러스터 비교'
			},
			{
				id: 'cluster',
				label: 'Kubernetes',
				detail: '워크로드 실행'
			}
		],
		edges: [
			{
				id: 'dev-source',
				from: 'dev',
				to: 'source',
				label: 'push / MR',
				kind: 'flow'
			},
			{
				id: 'source-ci',
				from: 'source',
				to: 'ci',
				label: 'CI 실행',
				kind: 'flow'
			},
			{
				id: 'ci-harbor',
				from: 'ci',
				to: 'harbor',
				label: '이미지 push',
				kind: 'flow'
			},
			{
				id: 'ci-config',
				from: 'ci',
				to: 'config',
				label: 'image tag 갱신 commit',
				kind: 'flow'
			},
			{
				id: 'config-argo',
				from: 'config',
				to: 'argo',
				label: 'pull·diff',
				kind: 'relation'
			},
			{
				id: 'argo-cluster',
				from: 'argo',
				to: 'cluster',
				label: 'reconcile',
				kind: 'flow'
			},
			{
				id: 'cluster-harbor',
				from: 'cluster',
				to: 'harbor',
				label: 'image pull 요청',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '소스 변경과 검증',
				description: '앱 소스 저장소의 변경으로 CI가 테스트와 이미지 빌드를 실행합니다.',
				nodes: [
					{
						id: 'dev',
						col: 0,
						row: 1
					},
					{
						id: 'source',
						col: 1,
						row: 1
					},
					{
						id: 'ci',
						col: 2,
						row: 1
					}
				],
				edges: ['dev-source', 'source-ci']
			},
			{
				title: '실행 이미지 저장',
				description: 'CI가 만든 컨테이너 이미지는 Harbor에 push합니다.',
				nodes: [
					{
						id: 'ci',
						col: 0,
						row: 1
					},
					{
						id: 'harbor',
						col: 1,
						row: 1
					}
				],
				edges: ['ci-harbor']
			},
			{
				title: '배포 선언을 Git에 기록',
				description: 'CI는 Helm Chart 저장소의 image tag를 갱신해 원하는 상태를 commit합니다.',
				nodes: [
					{
						id: 'ci',
						col: 0,
						row: 1
					},
					{
						id: 'config',
						col: 1,
						row: 1
					}
				],
				edges: ['ci-config']
			},
			{
				title: 'Argo CD가 상태를 맞추기',
				description:
					'Argo CD는 저장소를 pull하고 차이를 확인해 Kubernetes를 조정합니다. CI가 클러스터를 직접 배포하는 경로가 아닙니다.',
				nodes: [
					{
						id: 'config',
						col: 0,
						row: 1
					},
					{
						id: 'argo',
						col: 1,
						row: 1
					},
					{
						id: 'cluster',
						col: 2,
						row: 1
					}
				],
				edges: ['config-argo', 'argo-cluster']
			},
			{
				title: '클러스터가 이미지 가져오기',
				description:
					'Kubernetes가 Harbor에 image pull을 요청합니다. 이미지 데이터의 반환 방향은 이 요청 화살표와 반대입니다.',
				nodes: [
					{
						id: 'cluster',
						col: 0,
						row: 1
					},
					{
						id: 'harbor',
						col: 1,
						row: 1
					}
				],
				edges: ['cluster-harbor']
			}
		]
	},
	{
		id: '09-container-artifacts-harbor-helm-repository-1',
		title: '이미지와 Helm Chart의 저장 경로',
		mode: 'flow',
		source:
			'flowchart LR\n    src["GitLab 앱 소스"] --> ci["GitLab CI"]\n    ci -->|rootless build·push| harbor["Harbor<br/>image: commit SHA"]\n    ci -->|values의 image tag 갱신| gitChart["GitLab Git Chart 저장소<br/>운영 권장"]\n    ci -. 선택: helm package .-> pkg["GitLab Helm Package Registry"]\n    gitChart -->|Git + Helm 렌더| argo["Argo CD"]\n    pkg -. package source 대안 .-> argo\n    argo --> cluster["Kubernetes"]\n    cluster -. pull .-> harbor',
		nodes: [
			{
				id: 'src',
				label: '앱 소스',
				detail: 'GitLab'
			},
			{
				id: 'ci',
				label: 'GitLab CI',
				detail: '빌드와 배포 선언 갱신'
			},
			{
				id: 'harbor',
				label: 'Harbor',
				detail: 'image: commit SHA'
			},
			{
				id: 'gitChart',
				label: 'Git Chart 저장소',
				detail: 'GitLab · 운영 권장'
			},
			{
				id: 'pkg',
				label: 'Helm Package Registry',
				detail: 'GitLab · 선택 가능한 대안'
			},
			{
				id: 'argo',
				label: 'Argo CD',
				detail: '선택한 소스로 Helm 렌더'
			},
			{
				id: 'cluster',
				label: 'Kubernetes',
				detail: '워크로드 실행'
			}
		],
		edges: [
			{
				id: 'src-ci',
				from: 'src',
				to: 'ci',
				label: 'CI 실행',
				kind: 'flow'
			},
			{
				id: 'ci-harbor',
				from: 'ci',
				to: 'harbor',
				label: 'rootless build·push',
				kind: 'flow'
			},
			{
				id: 'ci-gitChart',
				from: 'ci',
				to: 'gitChart',
				label: 'values의 image tag 갱신',
				kind: 'flow'
			},
			{
				id: 'ci-pkg',
				from: 'ci',
				to: 'pkg',
				label: '선택: helm package',
				kind: 'relation'
			},
			{
				id: 'gitChart-argo',
				from: 'gitChart',
				to: 'argo',
				label: 'Git + Helm 렌더',
				kind: 'relation'
			},
			{
				id: 'pkg-argo',
				from: 'pkg',
				to: 'argo',
				label: 'package source 대안',
				kind: 'relation'
			},
			{
				id: 'argo-cluster',
				from: 'argo',
				to: 'cluster',
				label: '선언 동기화',
				kind: 'flow'
			},
			{
				id: 'cluster-harbor',
				from: 'cluster',
				to: 'harbor',
				label: '이미지 pull 요청',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '이미지 생성과 보관',
				description:
					'GitLab CI는 rootless 방식으로 이미지를 빌드하고 commit SHA로 식별해 Harbor에 push합니다.',
				nodes: [
					{
						id: 'src',
						col: 0,
						row: 1
					},
					{
						id: 'ci',
						col: 1,
						row: 1
					},
					{
						id: 'harbor',
						col: 2,
						row: 1
					}
				],
				edges: ['src-ci', 'ci-harbor']
			},
			{
				title: '권장 경로는 Git Chart',
				description: 'CI가 GitLab Git Chart 저장소의 values에 image tag를 갱신합니다.',
				nodes: [
					{
						id: 'ci',
						col: 0,
						row: 1
					},
					{
						id: 'gitChart',
						col: 1,
						row: 1
					}
				],
				edges: ['ci-gitChart']
			},
			{
				title: 'Package Registry는 대안',
				description:
					'helm package로 Helm Package Registry를 사용할 수도 있습니다. Git Chart와 반드시 함께 거쳐야 하는 단계는 아닙니다.',
				nodes: [
					{
						id: 'ci',
						col: 0,
						row: 1
					},
					{
						id: 'pkg',
						col: 1,
						row: 1
					},
					{
						id: 'argo',
						col: 2,
						row: 1
					}
				],
				edges: ['ci-pkg', 'pkg-argo']
			},
			{
				title: '선언을 렌더하고 동기화',
				description:
					'권장 Git Chart 경로에서 Argo CD가 Git을 읽고 Helm을 렌더해 Kubernetes에 반영합니다.',
				nodes: [
					{
						id: 'gitChart',
						col: 0,
						row: 1
					},
					{
						id: 'argo',
						col: 1,
						row: 1
					},
					{
						id: 'cluster',
						col: 2,
						row: 1
					}
				],
				edges: ['gitChart-argo', 'argo-cluster']
			},
			{
				title: '이미지는 Harbor에서 pull',
				description:
					'클러스터가 필요한 이미지를 Harbor에 요청합니다. Chart 소스와 실행 이미지의 저장 위치는 서로 다릅니다.',
				nodes: [
					{
						id: 'cluster',
						col: 0,
						row: 1
					},
					{
						id: 'harbor',
						col: 1,
						row: 1
					}
				],
				edges: ['cluster-harbor']
			}
		]
	},
	{
		id: '10-gitlab-harbor-argocd-end-to-end-1',
		title: '코드 변경에서 웹 서비스 접속까지',
		mode: 'flow',
		source:
			'flowchart LR\n    developer["개발자"] -->|push| code["GitLab<br/>student-01-web-code"]\n    code --> test["test Job"]\n    test --> build["Rootless BuildKit"]\n    build -->|commit SHA tag| harbor["Harbor<br/>mlops-training/student-01-web"]\n    build --> update["update-deploy-repo Job"]\n    update -->|values-dev.yaml commit| deploy["GitLab<br/>student-01-web-deploy"]\n    deploy -->|pull·render·diff| argo["Argo CD"]\n    argo -->|auto sync| k8s["Kubernetes<br/>student-01 namespace"]\n    k8s -. image pull .-> harbor\n    client["브라우저/curl"] -->|web-dev.lab.example.com| route["Gateway API"]\n    route --> k8s',
		nodes: [
			{
				id: 'developer',
				label: '개발자',
				detail: '소스 변경과 push'
			},
			{
				id: 'code',
				label: 'GitLab 앱 소스',
				detail: 'student-01-web-code'
			},
			{
				id: 'test',
				label: 'test Job',
				detail: '앱 검증'
			},
			{
				id: 'build',
				label: 'Rootless BuildKit',
				detail: '컨테이너 이미지 빌드'
			},
			{
				id: 'harbor',
				label: 'Harbor',
				detail: 'mlops-training/student-01-web'
			},
			{
				id: 'update',
				label: '배포 저장소 갱신 Job',
				detail: 'update-deploy-repo Job'
			},
			{
				id: 'deploy',
				label: 'GitLab 배포 저장소',
				detail: 'student-01-web-deploy'
			},
			{
				id: 'argo',
				label: 'Argo CD',
				detail: 'pull·render·diff'
			},
			{
				id: 'k8s',
				label: 'Kubernetes',
				detail: 'student-01 namespace'
			},
			{
				id: 'client',
				label: '브라우저 / curl',
				detail: '웹 서비스 접속'
			},
			{
				id: 'route',
				label: 'Gateway API',
				detail: 'web-dev.lab.example.com'
			}
		],
		edges: [
			{
				id: 'developer-code',
				from: 'developer',
				to: 'code',
				label: 'push',
				kind: 'flow'
			},
			{
				id: 'code-test',
				from: 'code',
				to: 'test',
				label: 'test 실행',
				kind: 'flow'
			},
			{
				id: 'test-build',
				from: 'test',
				to: 'build',
				label: '검증 후 빌드',
				kind: 'flow'
			},
			{
				id: 'build-harbor',
				from: 'build',
				to: 'harbor',
				label: 'commit SHA tag',
				kind: 'flow'
			},
			{
				id: 'build-update',
				from: 'build',
				to: 'update',
				label: '배포 정보 갱신',
				kind: 'flow'
			},
			{
				id: 'update-deploy',
				from: 'update',
				to: 'deploy',
				label: 'values-dev.yaml commit',
				kind: 'flow'
			},
			{
				id: 'deploy-argo',
				from: 'deploy',
				to: 'argo',
				label: 'pull·render·diff',
				kind: 'relation'
			},
			{
				id: 'argo-k8s',
				from: 'argo',
				to: 'k8s',
				label: 'auto sync',
				kind: 'flow'
			},
			{
				id: 'k8s-harbor',
				from: 'k8s',
				to: 'harbor',
				label: 'image pull 요청',
				kind: 'flow'
			},
			{
				id: 'client-route',
				from: 'client',
				to: 'route',
				label: 'HTTPS 접속',
				kind: 'flow'
			},
			{
				id: 'route-k8s',
				from: 'route',
				to: 'k8s',
				label: '앱 요청 전달',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '소스 변경과 테스트',
				description: 'student-01-web-code 저장소에 push하면 test Job이 앱을 검증합니다.',
				nodes: [
					{
						id: 'developer',
						col: 0,
						row: 1
					},
					{
						id: 'code',
						col: 1,
						row: 1
					},
					{
						id: 'test',
						col: 2,
						row: 1
					}
				],
				edges: ['developer-code', 'code-test']
			},
			{
				title: 'commit으로 식별할 이미지 생성',
				description:
					'테스트 뒤 Rootless BuildKit이 이미지를 빌드합니다. Harbor의 mlops-training/student-01-web에 commit SHA tag로 저장합니다.',
				nodes: [
					{
						id: 'test',
						col: 0,
						row: 1
					},
					{
						id: 'build',
						col: 1,
						row: 1
					},
					{
						id: 'harbor',
						col: 2,
						row: 1
					}
				],
				edges: ['test-build', 'build-harbor']
			},
			{
				title: '배포 저장소에 새 이미지 기록',
				description:
					'update-deploy-repo Job이 student-01-web-deploy의 values-dev.yaml을 갱신해 commit합니다.',
				nodes: [
					{
						id: 'build',
						col: 0,
						row: 1
					},
					{
						id: 'update',
						col: 1,
						row: 1
					},
					{
						id: 'deploy',
						col: 2,
						row: 1
					}
				],
				edges: ['build-update', 'update-deploy']
			},
			{
				title: 'Argo CD가 변경 반영',
				description:
					'Argo CD가 배포 저장소를 pull·render·diff하고 student-01 namespace에 auto sync합니다.',
				nodes: [
					{
						id: 'deploy',
						col: 0,
						row: 1
					},
					{
						id: 'argo',
						col: 1,
						row: 1
					},
					{
						id: 'k8s',
						col: 2,
						row: 1
					}
				],
				edges: ['deploy-argo', 'argo-k8s']
			},
			{
				title: '클러스터가 이미지 요청',
				description:
					'Kubernetes가 Harbor에 image pull을 요청합니다. 실제 이미지 데이터는 Harbor에서 클러스터로 반환됩니다.',
				nodes: [
					{
						id: 'k8s',
						col: 0,
						row: 1
					},
					{
						id: 'harbor',
						col: 1,
						row: 1
					}
				],
				edges: ['k8s-harbor']
			},
			{
				title: '브라우저에서 결과 확인',
				description:
					'브라우저나 curl로 web-dev.lab.example.com에 접속하면 Gateway API 경로를 거쳐 앱에 도달합니다.',
				nodes: [
					{
						id: 'client',
						col: 0,
						row: 1
					},
					{
						id: 'route',
						col: 1,
						row: 1
					},
					{
						id: 'k8s',
						col: 2,
						row: 1
					}
				],
				edges: ['client-route', 'route-k8s']
			}
		]
	},
	{
		id: '11-multicluster-gitops-promotion-1',
		title: '환경별 배포와 동일 이미지 사용',
		mode: 'relation',
		source:
			'flowchart TD\n    git["GitLab 배포 저장소<br/>values-dev/stg/prod"] --> appset["ApplicationSet<br/>환경별 Application 생성"]\n    appset --> argo["중앙 Argo CD"]\n    argo --> dev["dev cluster"]\n    argo --> stg["stg cluster"]\n    argo --> prod["prod cluster"]\n    harbor["Harbor<br/>동일 image tag/digest"] -. pull .-> dev\n    harbor -. pull .-> stg\n    harbor -. pull .-> prod',
		nodes: [
			{
				id: 'git',
				label: 'GitLab 배포 저장소',
				detail: 'values-dev/stg/prod'
			},
			{
				id: 'appset',
				label: 'ApplicationSet',
				detail: '환경별 Application 생성'
			},
			{
				id: 'argo',
				label: '중앙 Argo CD',
				detail: '대상별 선언 동기화'
			},
			{
				id: 'dev',
				label: 'dev cluster',
				detail: '개발 환경'
			},
			{
				id: 'stg',
				label: 'stg cluster',
				detail: '검증 환경'
			},
			{
				id: 'prod',
				label: 'prod cluster',
				detail: '운영 환경'
			},
			{
				id: 'harbor',
				label: 'Harbor',
				detail: '동일 image tag/digest'
			}
		],
		edges: [
			{
				id: 'git-appset',
				from: 'git',
				to: 'appset',
				label: '환경별 원하는 상태',
				kind: 'relation'
			},
			{
				id: 'appset-argo',
				from: 'appset',
				to: 'argo',
				label: 'Application 생성',
				kind: 'relation'
			},
			{
				id: 'argo-dev',
				from: 'argo',
				to: 'dev',
				label: 'dev 동기화',
				kind: 'flow'
			},
			{
				id: 'argo-stg',
				from: 'argo',
				to: 'stg',
				label: 'stg 동기화',
				kind: 'flow'
			},
			{
				id: 'argo-prod',
				from: 'argo',
				to: 'prod',
				label: 'prod 동기화',
				kind: 'flow'
			},
			{
				id: 'harbor-dev',
				from: 'harbor',
				to: 'dev',
				label: '동일 이미지 사용',
				kind: 'relation'
			},
			{
				id: 'harbor-stg',
				from: 'harbor',
				to: 'stg',
				label: '동일 이미지 사용',
				kind: 'relation'
			},
			{
				id: 'harbor-prod',
				from: 'harbor',
				to: 'prod',
				label: '동일 이미지 사용',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: '환경별 원하는 상태 기록',
				description:
					'values-dev/stg/prod는 각 환경의 배포 선언입니다. 환경별 변경과 승인은 Git에 남깁니다.',
				nodes: [
					{
						id: 'git',
						col: 0,
						row: 1
					},
					{
						id: 'appset',
						col: 1,
						row: 1
					}
				],
				edges: ['git-appset']
			},
			{
				title: '환경별 Application 생성',
				description: 'ApplicationSet이 환경별 Application을 만들고 중앙 Argo CD가 관리합니다.',
				nodes: [
					{
						id: 'git',
						col: 0,
						row: 1
					},
					{
						id: 'appset',
						col: 1,
						row: 1
					},
					{
						id: 'argo',
						col: 2,
						row: 1
					}
				],
				edges: ['git-appset', 'appset-argo']
			},
			{
				title: '각 클러스터로 동기화',
				description:
					'Argo CD는 각 대상 클러스터를 동기화합니다. dev에서 stg, prod로 패킷이 순차 이동하는 경로는 아닙니다.',
				nodes: [
					{
						id: 'argo',
						col: 0,
						row: 1
					},
					{
						id: 'dev',
						col: 1,
						row: 0
					},
					{
						id: 'stg',
						col: 1,
						row: 1
					},
					{
						id: 'prod',
						col: 1,
						row: 2
					}
				],
				edges: ['argo-dev', 'argo-stg', 'argo-prod']
			},
			{
				title: '같은 artifact를 사용',
				description:
					'각 클러스터가 Harbor에서 동일한 image tag/digest를 pull합니다. 원본의 Harbor→클러스터 선은 이미지 사용 관계로 표시하며 pull 요청 방향을 뜻하지 않습니다.',
				nodes: [
					{
						id: 'harbor',
						col: 0,
						row: 1
					},
					{
						id: 'dev',
						col: 1,
						row: 0
					},
					{
						id: 'stg',
						col: 1,
						row: 1
					},
					{
						id: 'prod',
						col: 1,
						row: 2
					}
				],
				edges: ['harbor-dev', 'harbor-stg', 'harbor-prod']
			}
		]
	},
	{
		id: '12-mlops-mlflow-ray-kserve-knative-1',
		title: '학습 실행과 모델 서빙의 연결',
		mode: 'flow',
		source:
			'flowchart LR\n  DEV["개발자\\n학습 코드"] --> CI["GitLab CI\\n검증·이미지 빌드"]\n  CI --> H["Harbor\\n학습 이미지"]\n  CI --> G["GitLab Chart Repo\\n원하는 상태"]\n  G --> A["Argo CD\\n동기화"]\n  A --> RJ["KubeRay RayJob\\n학습 실행"]\n  RJ --> R["Ray\\n분산 계산"]\n  R --> M["MLflow\\n파라미터·메트릭·모델"]\n  M --> O["S3/MinIO\\n모델 아티팩트"]\n  G --> A2["Argo CD\\n서빙 선언 동기화"]\n  A2 --> KS["KServe InferenceService"]\n  O --> KS\n  KS --> KN["Knative Serving\\n선택 사항: scale-to-zero"]',
		nodes: [
			{
				id: 'DEV',
				label: '개발자',
				detail: '학습 코드'
			},
			{
				id: 'CI',
				label: 'GitLab CI',
				detail: '검증·이미지 빌드'
			},
			{
				id: 'H',
				label: 'Harbor',
				detail: '학습 이미지'
			},
			{
				id: 'G',
				label: 'GitLab Chart Repo',
				detail: '원하는 상태'
			},
			{
				id: 'A',
				label: 'Argo CD',
				detail: '학습 선언 동기화'
			},
			{
				id: 'RJ',
				label: 'KubeRay RayJob',
				detail: '학습 실행'
			},
			{
				id: 'R',
				label: 'Ray',
				detail: '분산 계산'
			},
			{
				id: 'M',
				label: 'MLflow',
				detail: '파라미터·메트릭·모델'
			},
			{
				id: 'O',
				label: 'S3 / MinIO',
				detail: '모델 아티팩트'
			},
			{
				id: 'A2',
				label: 'Argo CD',
				detail: '서빙 선언 동기화'
			},
			{
				id: 'KS',
				label: 'KServe',
				detail: 'InferenceService'
			},
			{
				id: 'KN',
				label: 'Knative Serving',
				detail: '선택 사항: scale-to-zero'
			}
		],
		edges: [
			{
				id: 'DEV-CI',
				from: 'DEV',
				to: 'CI',
				label: '코드 검증',
				kind: 'flow'
			},
			{
				id: 'CI-H',
				from: 'CI',
				to: 'H',
				label: '학습 이미지 저장',
				kind: 'flow'
			},
			{
				id: 'CI-G',
				from: 'CI',
				to: 'G',
				label: '원하는 상태 기록',
				kind: 'flow'
			},
			{
				id: 'G-A',
				from: 'G',
				to: 'A',
				label: '학습 선언 읽기',
				kind: 'relation'
			},
			{
				id: 'A-RJ',
				from: 'A',
				to: 'RJ',
				label: 'RayJob 동기화',
				kind: 'flow'
			},
			{
				id: 'RJ-R',
				from: 'RJ',
				to: 'R',
				label: '학습 계산',
				kind: 'flow'
			},
			{
				id: 'R-M',
				from: 'R',
				to: 'M',
				label: '실험·모델 기록',
				kind: 'flow'
			},
			{
				id: 'M-O',
				from: 'M',
				to: 'O',
				label: '모델 아티팩트',
				kind: 'flow'
			},
			{
				id: 'G-A2',
				from: 'G',
				to: 'A2',
				label: '서빙 선언 읽기',
				kind: 'relation'
			},
			{
				id: 'A2-KS',
				from: 'A2',
				to: 'KS',
				label: 'InferenceService 동기화',
				kind: 'flow'
			},
			{
				id: 'O-KS',
				from: 'O',
				to: 'KS',
				label: '모델 아티팩트 로드',
				kind: 'flow'
			},
			{
				id: 'KS-KN',
				from: 'KS',
				to: 'KN',
				label: '선택한 서빙 모드',
				kind: 'relation'
			}
		],
		stages: [
			{
				title: '코드를 학습 이미지로',
				description: 'GitLab CI가 학습 코드를 검증하고 만든 이미지를 Harbor에 저장합니다.',
				nodes: [
					{
						id: 'DEV',
						col: 0,
						row: 1
					},
					{
						id: 'CI',
						col: 1,
						row: 1
					},
					{
						id: 'H',
						col: 2,
						row: 1
					}
				],
				edges: ['DEV-CI', 'CI-H']
			},
			{
				title: '학습 선언을 Git에 기록',
				description: 'CI가 Chart Repo에 원하는 상태를 기록하면 Argo CD가 그 선언을 읽습니다.',
				nodes: [
					{
						id: 'CI',
						col: 0,
						row: 1
					},
					{
						id: 'G',
						col: 1,
						row: 1
					},
					{
						id: 'A',
						col: 2,
						row: 1
					}
				],
				edges: ['CI-G', 'G-A']
			},
			{
				title: 'RayJob으로 계산 실행',
				description: 'Argo CD가 RayJob 선언을 동기화하고, KubeRay / Ray가 학습 계산을 실행합니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'RJ',
						col: 1,
						row: 1
					},
					{
						id: 'R',
						col: 2,
						row: 1
					}
				],
				edges: ['A-RJ', 'RJ-R']
			},
			{
				title: '실험 기록과 모델 파일',
				description:
					'MLflow는 파라미터·메트릭·모델 정보를 기록하고 모델 아티팩트는 S3/MinIO에 보관합니다.',
				nodes: [
					{
						id: 'R',
						col: 0,
						row: 1
					},
					{
						id: 'M',
						col: 1,
						row: 1
					},
					{
						id: 'O',
						col: 2,
						row: 1
					}
				],
				edges: ['R-M', 'M-O']
			},
			{
				title: '서빙 선언과 모델 연결',
				description:
					'KServe에는 Git의 서빙 선언과 저장소의 모델 아티팩트가 함께 필요합니다. 학습 성공만으로 모든 모델을 곧바로 운영에 올린다는 뜻은 아닙니다.',
				nodes: [
					{
						id: 'G',
						col: 0,
						row: 0
					},
					{
						id: 'A2',
						col: 1,
						row: 0
					},
					{
						id: 'O',
						col: 1,
						row: 2
					},
					{
						id: 'KS',
						col: 2,
						row: 1
					}
				],
				edges: ['G-A2', 'A2-KS', 'O-KS']
			},
			{
				title: 'Knative는 선택 사항',
				description:
					'Knative 모드에서는 scale-to-zero를 사용할 수 있습니다. 모든 KServe 배포에 필수인 다음 단계는 아닙니다.',
				nodes: [
					{
						id: 'KS',
						col: 0,
						row: 1
					},
					{
						id: 'KN',
						col: 1,
						row: 1
					}
				],
				edges: ['KS-KN']
			}
		]
	},
	{
		id: '14-gitops-meets-ml-pipeline-1',
		title: '학습 배포와 모델 승격: 두 번의 Git 변경',
		mode: 'sequence',
		source:
			'sequenceDiagram\n  actor Dev as 개발자\n  participant Code as GitLab Code Repo\n  participant CI as GitLab CI\n  participant Harbor\n  participant GitOps as GitLab Chart Repo\n  participant Argo as Argo CD\n  participant Ray as KubeRay / RayJob\n  participant MLflow\n  participant Serve as KServe\n\n  Dev->>Code: src/train.py 변경\n  Code->>CI: pipeline 시작\n  CI->>CI: test + rootless image build\n  CI->>Harbor: commit SHA 이미지 push\n  CI->>GitOps: RayJob image/runId write-back\n  GitOps-->>Argo: 변경 감지(pull/webhook)\n  Argo->>Ray: RayJob 선언 동기화\n  Ray->>MLflow: 메트릭·모델·계보 기록\n  Note over MLflow,GitOps: 평가와 승인 게이트\n  MLflow->>CI: 승인 대상 run/model version\n  CI->>GitOps: 불변 model storageUri write-back\n  GitOps-->>Argo: 변경 감지\n  Argo->>Serve: InferenceService 갱신',
		nodes: [
			{
				id: 'Dev',
				label: '개발자',
				detail: 'src/train.py 변경'
			},
			{
				id: 'Code',
				label: 'GitLab Code Repo',
				detail: '학습 소스'
			},
			{
				id: 'CI',
				label: 'GitLab CI',
				detail: '테스트·이미지·Git write-back'
			},
			{
				id: 'Harbor',
				label: 'Harbor',
				detail: 'commit SHA 이미지'
			},
			{
				id: 'GitOps',
				label: 'GitLab Chart Repo',
				detail: 'RayJob·모델 storageUri'
			},
			{
				id: 'Argo',
				label: 'Argo CD',
				detail: '변경 감지·선언 동기화'
			},
			{
				id: 'Ray',
				label: 'KubeRay / RayJob',
				detail: '학습 실행'
			},
			{
				id: 'MLflow',
				label: 'MLflow',
				detail: '메트릭·모델·계보'
			},
			{
				id: 'Serve',
				label: 'KServe',
				detail: 'InferenceService'
			}
		],
		edges: [
			{
				id: 'code',
				from: 'Dev',
				to: 'Code',
				label: 'src/train.py 변경',
				kind: 'flow'
			},
			{
				id: 'pipeline',
				from: 'Code',
				to: 'CI',
				label: 'pipeline 시작',
				kind: 'flow'
			},
			{
				id: 'build',
				from: 'CI',
				to: 'CI',
				label: 'test + rootless build',
				kind: 'flow'
			},
			{
				id: 'image',
				from: 'CI',
				to: 'Harbor',
				label: 'commit SHA 이미지 push',
				kind: 'flow'
			},
			{
				id: 'training-git',
				from: 'CI',
				to: 'GitOps',
				label: 'image/runId write-back',
				kind: 'flow'
			},
			{
				id: 'training-detect',
				from: 'GitOps',
				to: 'Argo',
				label: '변경 감지',
				kind: 'relation'
			},
			{
				id: 'training-sync',
				from: 'Argo',
				to: 'Ray',
				label: 'RayJob 선언 동기화',
				kind: 'flow'
			},
			{
				id: 'record',
				from: 'Ray',
				to: 'MLflow',
				label: '메트릭·모델·계보 기록',
				kind: 'flow'
			},
			{
				id: 'approved',
				from: 'MLflow',
				to: 'CI',
				label: '승인 대상 run/model version',
				kind: 'flow'
			},
			{
				id: 'serving-git',
				from: 'CI',
				to: 'GitOps',
				label: '불변 storageUri write-back',
				kind: 'flow'
			},
			{
				id: 'serving-detect',
				from: 'GitOps',
				to: 'Argo',
				label: '변경 감지',
				kind: 'relation'
			},
			{
				id: 'serving-sync',
				from: 'Argo',
				to: 'Serve',
				label: 'InferenceService 갱신',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '코드 변경과 이미지 검증',
				description:
					'src/train.py 변경으로 pipeline이 시작됩니다. CI는 테스트와 rootless 이미지 빌드를 수행합니다.',
				nodes: [
					{
						id: 'Dev',
						col: 0,
						row: 1
					},
					{
						id: 'Code',
						col: 1,
						row: 1
					},
					{
						id: 'CI',
						col: 2,
						row: 1
					}
				],
				edges: ['code', 'pipeline', 'build']
			},
			{
				title: '첫 번째 Git 변경: 학습 실행',
				description:
					'CI가 Harbor에 commit SHA 이미지를 push하고 Chart Repo에 RayJob의 image/runId를 write-back합니다.',
				nodes: [
					{
						id: 'CI',
						col: 0,
						row: 1
					},
					{
						id: 'Harbor',
						col: 1,
						row: 0
					},
					{
						id: 'GitOps',
						col: 1,
						row: 2
					}
				],
				edges: ['image', 'training-git']
			},
			{
				title: '학습 실행과 결과 기록',
				description:
					'Argo CD가 pull/webhook으로 변경을 감지해 RayJob 선언을 동기화합니다. 학습 결과의 메트릭·모델·계보는 MLflow에 기록됩니다.',
				nodes: [
					{
						id: 'GitOps',
						col: 0,
						row: 0
					},
					{
						id: 'Argo',
						col: 1,
						row: 0
					},
					{
						id: 'Ray',
						col: 1,
						row: 2
					},
					{
						id: 'MLflow',
						col: 2,
						row: 2
					}
				],
				edges: ['training-detect', 'training-sync', 'record']
			},
			{
				title: '평가와 승인 게이트',
				description:
					'여기서 학습 실행과 모델 승격을 분리합니다. 평가·승인한 run/model version을 CI에 전달하며, 학습 성공 자체가 배포 승인은 아닙니다.',
				nodes: [
					{
						id: 'MLflow',
						col: 0,
						row: 1
					},
					{
						id: 'CI',
						col: 1,
						row: 1
					}
				],
				edges: ['approved']
			},
			{
				title: '두 번째 Git 변경: 모델 승격',
				description: 'CI가 승인된 모델의 불변 storageUri를 Chart Repo에 write-back합니다.',
				nodes: [
					{
						id: 'CI',
						col: 0,
						row: 1
					},
					{
						id: 'GitOps',
						col: 1,
						row: 1
					}
				],
				edges: ['serving-git']
			},
			{
				title: '승인 모델을 서빙에 반영',
				description: 'Argo CD가 두 번째 Git 변경을 감지하면 InferenceService를 갱신합니다.',
				nodes: [
					{
						id: 'GitOps',
						col: 0,
						row: 1
					},
					{
						id: 'Argo',
						col: 1,
						row: 1
					},
					{
						id: 'Serve',
						col: 2,
						row: 1
					}
				],
				edges: ['serving-detect', 'serving-sync']
			}
		]
	},
	{
		id: '15-rayjob-mlflow-kserve-capstone-1',
		title: '학습 코드에서 승인 모델의 서빙까지',
		mode: 'flow',
		source:
			'flowchart LR\n  A["src/train.py 변경"] --> B["GitLab CI\\n테스트"]\n  B --> C["rootless BuildKit\\n학습 이미지"]\n  C --> D["Harbor\\ncommit SHA tag"]\n  D --> E["GitLab Chart Repo\\nvalues write-back"]\n  E --> F["Argo CD"]\n  F --> G["KubeRay RayJob"]\n  G --> H["MLflow\\nrun·metric·model version"]\n  G --> I["MinIO\\n불변 모델 URI"]\n  I --> J["승인·Git write-back"]\n  J --> F\n  F --> K["KServe\\nInferenceService"]',
		nodes: [
			{
				id: 'A',
				label: 'src/train.py 변경',
				detail: '학습 소스'
			},
			{
				id: 'B',
				label: 'GitLab CI',
				detail: '테스트'
			},
			{
				id: 'C',
				label: 'rootless BuildKit',
				detail: '학습 이미지'
			},
			{
				id: 'D',
				label: 'Harbor',
				detail: 'commit SHA tag'
			},
			{
				id: 'E',
				label: 'GitLab Chart Repo',
				detail: 'values write-back'
			},
			{
				id: 'F',
				label: 'Argo CD',
				detail: 'Git 선언 동기화'
			},
			{
				id: 'G',
				label: 'KubeRay RayJob',
				detail: '학습 실행'
			},
			{
				id: 'H',
				label: 'MLflow',
				detail: 'run·metric·model version'
			},
			{
				id: 'I',
				label: 'MinIO',
				detail: '불변 모델 URI'
			},
			{
				id: 'J',
				label: '승인·Git write-back',
				detail: '승인한 모델 URI를 Git에 기록'
			},
			{
				id: 'K',
				label: 'KServe',
				detail: 'InferenceService'
			}
		],
		edges: [
			{
				id: 'A-B',
				from: 'A',
				to: 'B',
				label: '학습 코드 테스트',
				kind: 'flow'
			},
			{
				id: 'B-C',
				from: 'B',
				to: 'C',
				label: '검증 후 빌드',
				kind: 'flow'
			},
			{
				id: 'C-D',
				from: 'C',
				to: 'D',
				label: 'commit SHA 이미지 저장',
				kind: 'flow'
			},
			{
				id: 'D-E',
				from: 'D',
				to: 'E',
				label: '이미지 식별자 반영',
				kind: 'relation'
			},
			{
				id: 'E-F',
				from: 'E',
				to: 'F',
				label: '학습 선언 읽기',
				kind: 'relation'
			},
			{
				id: 'F-G',
				from: 'F',
				to: 'G',
				label: 'RayJob 동기화',
				kind: 'flow'
			},
			{
				id: 'G-H',
				from: 'G',
				to: 'H',
				label: '실험·모델 기록',
				kind: 'flow'
			},
			{
				id: 'G-I',
				from: 'G',
				to: 'I',
				label: '모델 아티팩트 저장',
				kind: 'flow'
			},
			{
				id: 'I-J',
				from: 'I',
				to: 'J',
				label: '모델 승인 대상',
				kind: 'relation'
			},
			{
				id: 'J-F',
				from: 'J',
				to: 'F',
				label: '승인한 Git 변경',
				kind: 'relation'
			},
			{
				id: 'F-K',
				from: 'F',
				to: 'K',
				label: 'InferenceService 동기화',
				kind: 'flow'
			}
		],
		stages: [
			{
				title: '변경한 학습 코드 테스트',
				description: 'src/train.py 변경으로 CI가 테스트를 실행합니다.',
				nodes: [
					{
						id: 'A',
						col: 0,
						row: 1
					},
					{
						id: 'B',
						col: 1,
						row: 1
					}
				],
				edges: ['A-B']
			},
			{
				title: '실행할 학습 이미지 저장',
				description: 'rootless BuildKit이 이미지를 빌드하고 Harbor에 commit SHA tag로 저장합니다.',
				nodes: [
					{
						id: 'B',
						col: 0,
						row: 1
					},
					{
						id: 'C',
						col: 1,
						row: 1
					},
					{
						id: 'D',
						col: 2,
						row: 1
					}
				],
				edges: ['B-C', 'C-D']
			},
			{
				title: 'CI가 학습 선언 갱신',
				description:
					'CI가 이미지 식별자를 Chart Repo의 values에 write-back하고 Argo CD가 읽습니다. 원본의 Harbor→Git 선은 단계 관계이며 Harbor가 Git에 commit한다는 뜻이 아닙니다.',
				nodes: [
					{
						id: 'D',
						col: 0,
						row: 1
					},
					{
						id: 'E',
						col: 1,
						row: 1
					},
					{
						id: 'F',
						col: 2,
						row: 1
					}
				],
				edges: ['D-E', 'E-F']
			},
			{
				title: '학습 실행과 결과 보관',
				description:
					'RayJob이 학습을 실행합니다. MLflow에는 run·metric·model version을, MinIO에는 불변 URI의 모델 아티팩트를 남깁니다.',
				nodes: [
					{
						id: 'F',
						col: 0,
						row: 1
					},
					{
						id: 'G',
						col: 1,
						row: 1
					},
					{
						id: 'H',
						col: 2,
						row: 0
					},
					{
						id: 'I',
						col: 2,
						row: 2
					}
				],
				edges: ['F-G', 'G-H', 'G-I']
			},
			{
				title: '승인한 모델을 Git에 반영',
				description:
					'평가·승인한 모델 URI를 Git에 write-back하면 Argo CD가 새 선언을 읽습니다. 학습 성공과 모델 운영 반영은 별도 판단입니다.',
				nodes: [
					{
						id: 'I',
						col: 0,
						row: 1
					},
					{
						id: 'J',
						col: 1,
						row: 1
					},
					{
						id: 'F',
						col: 2,
						row: 1
					}
				],
				edges: ['I-J', 'J-F']
			},
			{
				title: '서빙 선언 동기화',
				description: 'Argo CD가 승인된 선언에 따라 KServe InferenceService를 동기화합니다.',
				nodes: [
					{
						id: 'F',
						col: 0,
						row: 1
					},
					{
						id: 'K',
						col: 1,
						row: 1
					}
				],
				edges: ['F-K']
			}
		]
	}
];
