<script lang="ts">
	import { onMount } from 'svelte';
	import { getPresentationFrame, type PresentationFrame } from './presentation';
	import type { StoryAct, StoryDocument, StorySceneKind } from './schema';

	type Props = {
		story: StoryDocument;
		activeActIndex: number;
		activeActProgress: number;
		motionOff: boolean;
	};

	type HtmlTextureRecord = {
		element: HTMLElement;
		texture: import('three').Texture;
	};

	let { story, activeActIndex, activeActProgress, motionOff }: Props = $props();
	let canvas: HTMLCanvasElement;
	let projectionBody: HTMLDivElement;
	let projectionRail: HTMLDivElement;
	let mode = $state<'pending' | 'native' | 'polyfill' | 'dom'>('pending');
	let present: ((frame: PresentationFrame) => void) | null = null;

	function enableLayoutSubtree(node: HTMLCanvasElement) {
		node.setAttribute('layoutsubtree', '');
		return {
			destroy() {
				node.removeAttribute('layoutsubtree');
			}
		};
	}

	const activeAct = $derived(story.acts[activeActIndex] ?? story.acts[0]);
	const projectionSnippets = $derived(getProjectionSnippets(activeAct));
	const sceneLabels = $derived(getSceneLabels(activeAct.scene.kind));

	$effect(() => {
		present?.(getPresentationFrame(story.meta.slug, activeActIndex, activeActProgress, motionOff));
	});

	onMount(() => {
		const desktop = window.matchMedia('(min-width: 901px)');
		if (!desktop.matches) {
			mode = 'dom';
			return;
		}

		let disposed = false;
		let cleanup = () => {};

		void initialize().then((disposeRuntime) => {
			if (disposed) {
				disposeRuntime();
				return;
			}
			cleanup = disposeRuntime;
		});

		return () => {
			disposed = true;
			present = null;
			cleanup();
		};
	});

	async function initialize() {
		let installedPolyfill = false;
		let frameHandle = 0;
		let followUpFrame = 0;
		let effectHandle = 0;
		const abortController = new AbortController();

		try {
			const [THREE, htmlInCanvas] = await Promise.all([
				import('three'),
				import('three-html-render/polyfill')
			]);

			const hasNativeApi =
				'drawElementImage' in CanvasRenderingContext2D.prototype &&
				'requestPaint' in HTMLCanvasElement.prototype;
			if (!hasNativeApi) {
				htmlInCanvas.installHtmlInCanvasPolyfill();
				installedPolyfill = true;
			}
			mode = hasNativeApi ? 'native' : 'polyfill';

			const renderer = new THREE.WebGLRenderer({
				canvas,
				alpha: true,
				antialias: true,
				preserveDrawingBuffer: true,
				powerPreference: 'low-power'
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
			renderer.setClearColor(0x0b0b0a, 0);

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
			camera.position.set(0, 0, 8.5);

			const root = new THREE.Group();
			scene.add(root);

			const orange = new THREE.Color('#ff5500');
			const warm = new THREE.Color('#c8bda8');
			const dim = new THREE.Color('#443b31');
			const laneMaterial = new THREE.LineBasicMaterial({
				color: dim,
				transparent: true,
				opacity: 0.5
			});
			const activeMaterial = new THREE.MeshBasicMaterial({ color: orange });
			const nodeMaterial = new THREE.MeshBasicMaterial({
				color: warm,
				wireframe: true,
				transparent: true,
				opacity: 0.24
			});

			const nodeGeometry = new THREE.BoxGeometry(0.32, 0.32, 0.32);
			const activeGeometry = new THREE.OctahedronGeometry(0.16, 0);
			const positions = createPositions(THREE, story.meta.slug);
			const lineGeometry = new THREE.BufferGeometry().setFromPoints(positions);
			const line = new THREE.Line(lineGeometry, laneMaterial);
			root.add(line);

			for (const [index, position] of positions.entries()) {
				const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
				node.position.copy(position);
				node.rotation.set(index * 0.14, index * 0.21, 0);
				root.add(node);
			}

			const marker = new THREE.Mesh(activeGeometry, activeMaterial);
			root.add(marker);

			const textureRecords: HtmlTextureRecord[] = [];
			const createHtmlTexture = (element: HTMLElement) => {
				const texture = hasNativeApi
					? new THREE.HTMLTexture(element)
					: new THREE.CanvasTexture(document.createElement('canvas'));
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.minFilter = THREE.LinearFilter;
				texture.magFilter = THREE.LinearFilter;
				texture.generateMipmaps = false;
				textureRecords.push({ element, texture });
				return texture;
			};

			const bodyTexture = createHtmlTexture(projectionBody);
			const bodyMaterial = new THREE.ShaderMaterial({
				transparent: true,
				side: THREE.DoubleSide,
				uniforms: {
					uMap: { value: bodyTexture },
					uDistortion: { value: 0 },
					uTime: { value: 0 },
					uOpacity: { value: 0.72 }
				},
				vertexShader: `
					varying vec2 vUv;
					void main() {
						vUv = uv;
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					}
				`,
				fragmentShader: `
					uniform sampler2D uMap;
					uniform float uDistortion;
					uniform float uTime;
					uniform float uOpacity;
					varying vec2 vUv;
					void main() {
						vec2 uv = vUv;
						float wave = sin((uv.y * 15.0) + (uTime * 0.018));
						float envelope = 1.0 - abs((uv.y - 0.5) * 1.7);
						uv.x += wave * max(envelope, 0.0) * 0.035 * uDistortion;
						vec4 color = texture2D(uMap, uv);
						gl_FragColor = vec4(color.rgb, color.a * uOpacity);
					}
				`
			});
			const bodyGeometry = new THREE.PlaneGeometry(3.05, 1.93, 16, 10);
			const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(2.18, 0.05, -0.35);
			body.rotation.set(-0.035, -0.12, -0.01);
			root.add(body);

			const railTexture = createHtmlTexture(projectionRail);
			const railMaterial = new THREE.MeshBasicMaterial({
				map: railTexture,
				transparent: true,
				opacity: 0.48,
				side: THREE.DoubleSide
			});
			const railGeometry = new THREE.PlaneGeometry(0.78, 2.78);
			const rail = new THREE.Mesh(railGeometry, railMaterial);
			rail.position.set(3.82, 0, -0.6);
			rail.rotation.y = -0.2;
			root.add(rail);

			let runtimeDisposed = false;
			const resizeObserver = new ResizeObserver(resize);

			function resize() {
				if (runtimeDisposed) return;
				const width = Math.max(1, canvas.clientWidth);
				const height = Math.max(1, canvas.clientHeight);
				renderer.setSize(width, height, false);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
				invalidate();
			}

			function render() {
				if (runtimeDisposed || mode === 'dom') return;
				renderer.render(scene, camera);
			}

			function captureHtmlTextures() {
				const hicCanvas = canvas as HTMLCanvasElement & {
					captureElementImage?: (element: HTMLElement) => HTMLCanvasElement;
				};
				for (const record of textureRecords) {
					if (!hasNativeApi) {
						const snapshot = hicCanvas.captureElementImage?.(record.element);
						if (snapshot) record.texture.image = snapshot;
					}
					record.texture.needsUpdate = true;
				}
			}

			function invalidate() {
				if (runtimeDisposed) return;
				const hicCanvas = canvas as HTMLCanvasElement & { requestPaint?: () => void };
				hicCanvas.requestPaint?.();
				if (frameHandle) cancelAnimationFrame(frameHandle);
				if (followUpFrame) cancelAnimationFrame(followUpFrame);
				frameHandle = requestAnimationFrame(() => {
					frameHandle = 0;
					try {
						captureHtmlTextures();
					} catch {
						// The polyfill can need one layout frame before its first snapshot.
					}
					render();
					followUpFrame = requestAnimationFrame(() => {
						followUpFrame = 0;
						try {
							captureHtmlTextures();
						} catch {
							// Semantic DOM remains the presentation fallback.
						}
						render();
					});
				});
			}

			present = (nextFrame) => {
				if (runtimeDisposed) return;
				const current = positions[nextFrame.actIndex];
				const following = positions[Math.min(nextFrame.actIndex + 1, positions.length - 1)];
				const sceneKind = story.acts[nextFrame.actIndex].scene.kind;
				marker.position.copy(current).lerp(following, nextFrame.actProgress);
				marker.rotation.y = nextFrame.storyProgress * Math.PI * 4;
				root.rotation.y = (nextFrame.storyProgress - 0.5) * 0.16;
				root.rotation.x = (nextFrame.actProgress - 0.5) * 0.05;
				body.position.y = 0.05 + Math.sin(nextFrame.storyProgress * Math.PI) * 0.08;
				body.rotation.y = sceneKind === 'actor-visibility' ? -0.18 : -0.12;
				laneMaterial.opacity = sceneKind === 'failure-replay' ? 0.24 : 0.5;
				railMaterial.opacity = sceneKind === 'failure-replay' ? 0.3 : 0.48;
				invalidate();
			};

			function playSubmitEffect() {
				if (motionOff || effectHandle || runtimeDisposed) {
					invalidate();
					return;
				}
				const startedAt = performance.now();
				canvas.dataset.distortion = 'active';
				const tick = (now: number) => {
					if (runtimeDisposed) return;
					const progress = Math.min(1, (now - startedAt) / 560);
					const wave = Math.sin(progress * Math.PI);
					bodyMaterial.uniforms.uDistortion.value = wave;
					bodyMaterial.uniforms.uTime.value = now;
					body.scale.setScalar(1 + wave * 0.025);
					render();
					if (progress < 1) effectHandle = requestAnimationFrame(tick);
					else {
						effectHandle = 0;
						bodyMaterial.uniforms.uDistortion.value = 0;
						body.scale.setScalar(1);
						delete canvas.dataset.distortion;
						render();
					}
				};
				effectHandle = requestAnimationFrame(tick);
			}

			function disposeRuntime(forceContextLoss = true) {
				if (runtimeDisposed) return;
				runtimeDisposed = true;
				present = null;
				abortController.abort();
				resizeObserver.disconnect();
				if (frameHandle) cancelAnimationFrame(frameHandle);
				if (followUpFrame) cancelAnimationFrame(followUpFrame);
				if (effectHandle) cancelAnimationFrame(effectHandle);
				delete canvas.dataset.distortion;
				for (const record of textureRecords) record.texture.dispose();
				bodyGeometry.dispose();
				bodyMaterial.dispose();
				railGeometry.dispose();
				railMaterial.dispose();
				nodeGeometry.dispose();
				activeGeometry.dispose();
				lineGeometry.dispose();
				laneMaterial.dispose();
				activeMaterial.dispose();
				nodeMaterial.dispose();
				renderer.dispose();
				if (forceContextLoss) renderer.forceContextLoss();
				if (installedPolyfill) htmlInCanvas.uninstallHtmlInCanvasPolyfill();
			}

			resizeObserver.observe(canvas);
			window.addEventListener('story-form-submit', playSubmitEffect, {
				signal: abortController.signal
			});
			canvas.addEventListener(
				'webglcontextlost',
				(event) => {
					event.preventDefault();
					disposeRuntime(false);
					mode = 'dom';
				},
				{ signal: abortController.signal }
			);

			resize();
			present(getPresentationFrame(story.meta.slug, activeActIndex, activeActProgress, motionOff));
			return disposeRuntime;
		} catch (error) {
			mode = 'dom';
			present = null;
			console.info('[Systems Notebook] Canvas presentation fell back to semantic DOM.', error);
			return () => {
				abortController.abort();
				if (installedPolyfill) {
					void import('three-html-render/polyfill').then(({ uninstallHtmlInCanvasPolyfill }) =>
						uninstallHtmlInCanvasPolyfill()
					);
				}
			};
		}
	}

	function getProjectionSnippets(act: StoryAct): string[] {
		const snippets: string[] = [];
		for (const block of act.blocks) {
			let value = '';
			if (block.kind === 'paragraph') value = block.text;
			else if (block.kind === 'list') value = block.items[0] ?? '';
			else if (block.kind === 'callout') value = `${block.title} — ${block.text}`;
			else if (block.kind === 'code')
				value = block.value.split('\n').find((line) => line.trim().length > 0) ?? '';
			else if (block.kind === 'table') value = block.caption;
			else if (block.kind === 'figure') value = block.caption;
			else if (block.kind === 'form') value = block.description;
			if (value) snippets.push(value.length > 96 ? `${value.slice(0, 94)}…` : value);
			if (snippets.length === 2) break;
		}
		return snippets;
	}

	function getSceneLabels(kind: StorySceneKind): readonly string[] {
		if (kind === 'claim-path') return ['응답', '해석', '주장', '검증', '정책'];
		if (kind === 'tls-record') return ['Client', 'Handshake', 'Record', 'Server'];
		if (kind === 'actor-visibility') return ['Prover', 'Notary', 'Server', 'Verifier'];
		if (kind === 'failure-replay') return ['입력', '검사', '실패', '재요청'];
		return ['Fetch', 'Commit', 'Prove', 'Verify'];
	}

	function createPositions(
		THREE: typeof import('three'),
		slug: StoryDocument['meta']['slug']
	): import('three').Vector3[] {
		return Array.from({ length: 9 }, (_, index) => {
			const t = index / 8;
			if (slug === 'balance-claim') {
				return new THREE.Vector3(
					1.15 + t * 1.65,
					2.15 - t * 4.3,
					-0.9 + Math.sin(t * Math.PI) * 0.5
				);
			}
			if (slug === 'tls13') {
				return new THREE.Vector3(1.05 + t * 1.8, Math.sin(t * Math.PI * 2) * 1.55, -0.8 + t * 0.45);
			}
			const column = index % 2;
			const row = Math.floor(index / 2);
			return new THREE.Vector3(1.1 + column * 1.25, 2.1 - row * 1.05, -0.75 + column * 0.25);
		});
	}
</script>

<canvas
	bind:this={canvas}
	use:enableLayoutSubtree
	class:story-canvas--hidden={mode === 'dom'}
	class="story-canvas"
	aria-hidden="true"
	data-presentation-mode={mode}
>
	<div
		bind:this={projectionBody}
		class={`projection-body projection-body--${activeAct.scene.kind}`}
		aria-hidden="true"
		inert
	>
		<div class="projection-body__topline">
			<span>{String(activeActIndex).padStart(2, '0')} / 08</span>
			<span>{story.meta.slug}</span>
		</div>
		<p>{activeAct.kicker}</p>
		<strong>{activeAct.title}</strong>
		<small>{activeAct.lead}</small>
		<div class="projection-scene" data-scene-kind={activeAct.scene.kind}>
			{#each sceneLabels as label, index (label)}
				<span class:projection-scene__active={index === activeActIndex % sceneLabels.length}>
					<i></i>{label}
				</span>
			{/each}
		</div>
		<ul>
			{#each projectionSnippets as snippet (snippet)}<li>{snippet}</li>{/each}
		</ul>
		<div class="projection-body__progress">
			<i style={`--projected-progress: ${(activeActIndex + activeActProgress) / 9}`}></i>
		</div>
	</div>

	<div bind:this={projectionRail} class="projection-rail" aria-hidden="true" inert>
		<p>ACT TRACE</p>
		{#each story.acts as act, index (act.id)}
			<div class:projection-rail__active={activeActIndex === index}>
				<span>{String(index).padStart(2, '0')}</span><strong>{act.title}</strong>
			</div>
		{/each}
	</div>
</canvas>

<style>
	.story-canvas {
		display: block;
		width: 100%;
		height: 100%;
		opacity: 0.82;
		transition: opacity 180ms ease;
	}

	.story-canvas--hidden {
		opacity: 0;
	}

	.projection-body,
	.projection-rail {
		position: relative;
		box-sizing: border-box;
		background: #11100e;
		color: #c8bda8;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	}

	.projection-body {
		display: grid;
		width: 760px;
		height: 480px;
		align-content: start;
		border: 1px solid #ff5500;
		padding: 34px;
	}

	.projection-body--failure-replay {
		border-color: #ff947f;
	}

	.projection-body__topline {
		display: flex;
		justify-content: space-between;
		border-bottom: 1px solid #302c25;
		padding-bottom: 14px;
		color: #ff5500;
		font-size: 13px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.projection-body > p {
		margin: 24px 0 8px;
		color: #ff5500;
		font-size: 12px;
		letter-spacing: 0.08em;
	}

	.projection-body > strong {
		max-width: 18ch;
		color: #f0e8d9;
		font-family: Arial, sans-serif;
		font-size: 35px;
		line-height: 1.04;
		letter-spacing: -0.04em;
		word-break: keep-all;
	}

	.projection-body > small {
		max-width: 64ch;
		margin-top: 14px;
		color: #9b917f;
		font-size: 12px;
		line-height: 1.55;
		word-break: keep-all;
	}

	.projection-scene {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 18px;
	}

	.projection-scene span {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #71695e;
		font-size: 10px;
		text-transform: uppercase;
	}

	.projection-scene span:not(:last-child)::after {
		width: 18px;
		height: 1px;
		margin-left: 4px;
		background: #443b31;
		content: '';
	}

	.projection-scene i {
		display: block;
		width: 7px;
		height: 7px;
		transform: rotate(45deg);
		border: 1px solid currentColor;
	}

	.projection-scene .projection-scene__active {
		color: #ff5500;
	}

	.projection-body > ul {
		display: grid;
		gap: 6px;
		margin: 16px 0 0;
		padding: 0;
		color: #8d8373;
		font-size: 10px;
		line-height: 1.4;
		list-style: none;
	}

	.projection-body > ul li {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.projection-body__progress {
		position: absolute;
		right: 34px;
		bottom: 26px;
		left: 34px;
		height: 2px;
		background: #302c25;
	}

	.projection-body__progress i {
		display: block;
		width: calc(var(--projected-progress) * 100%);
		height: 100%;
		background: #ff5500;
	}

	.projection-rail {
		display: grid;
		width: 280px;
		height: 760px;
		align-content: center;
		gap: 10px;
		border: 1px solid #302c25;
		padding: 28px;
	}

	.projection-rail > p {
		margin: 0 0 12px;
		color: #ff5500;
		font-size: 11px;
		letter-spacing: 0.15em;
	}

	.projection-rail > div {
		display: grid;
		grid-template-columns: 28px 1fr;
		gap: 9px;
		border-right: 1px solid #443b31;
		padding: 6px 8px 6px 0;
		color: #71695e;
		font-size: 10px;
	}

	.projection-rail strong {
		overflow: hidden;
		font-weight: 400;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.projection-rail .projection-rail__active {
		border-color: #ff5500;
		color: #ff5500;
	}

	@media (prefers-reduced-motion: reduce) {
		.story-canvas {
			transition: none;
		}
	}
</style>
