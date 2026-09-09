import { describe, expect, it } from 'vitest';
import { routeDiagramEdges, type NodeBox, type RoutedDiagramEdge } from './diagram-layout';

type Point = { x: number; y: number };
type Edge = { id: string; from: string; to: string };
const epsilon = 0.02;

function pointsOf(path: string): Point[] {
	return [...path.matchAll(/[ML]\s+(-?[\d.]+)\s+(-?[\d.]+)/g)].map((match) => ({
		x: Number(match[1]),
		y: Number(match[2])
	}));
}

function isBoundary(point: Point, box: NodeBox): boolean {
	const withinX = point.x >= box.x - epsilon && point.x <= box.x + box.width + epsilon;
	const withinY = point.y >= box.y - epsilon && point.y <= box.y + box.height + epsilon;
	return (
		(withinX &&
			(Math.abs(point.y - box.y) < epsilon || Math.abs(point.y - box.y - box.height) < epsilon)) ||
		(withinY &&
			(Math.abs(point.x - box.x) < epsilon || Math.abs(point.x - box.x - box.width) < epsilon))
	);
}

function assertRoutesClear(
	nodes: NodeBox[],
	edges: Edge[],
	bounds: { width: number; height: number },
	routes: RoutedDiagramEdge[] = routeDiagramEdges(nodes, edges, bounds)
): void {
	expect(routes.map((route) => route.id)).toEqual(edges.map((edge) => edge.id));
	for (const route of routes) {
		const points = pointsOf(route.path);
		const edge = edges.find((edge) => edge.id === route.id)!;
		const from = nodes.find((node) => node.id === edge.from)!;
		const to = nodes.find((node) => node.id === edge.to)!;
		expect(points.length).toBeGreaterThanOrEqual(2);
		expect(isBoundary(points[0], from), `${route.id}: source boundary`).toBe(true);
		expect(isBoundary(points.at(-1)!, to), `${route.id}: target boundary`).toBe(true);
		for (const point of [...points, { x: route.x, y: route.y }]) {
			expect(point.x).toBeGreaterThanOrEqual(-epsilon);
			expect(point.x).toBeLessThanOrEqual(bounds.width + epsilon);
			expect(point.y).toBeGreaterThanOrEqual(-epsilon);
			expect(point.y).toBeLessThanOrEqual(bounds.height + epsilon);
		}
		for (let index = 1; index < points.length; index += 1) {
			const a = points[index - 1];
			const b = points[index];
			const vertical = Math.abs(a.x - b.x) < epsilon;
			const horizontal = Math.abs(a.y - b.y) < epsilon;
			expect(vertical || horizontal, `${route.id}: orthogonal segment`).toBe(true);
			for (const box of nodes) {
				const crosses = vertical
					? a.x > box.x + epsilon &&
						a.x < box.x + box.width - epsilon &&
						Math.min(Math.max(a.y, b.y), box.y + box.height) - Math.max(Math.min(a.y, b.y), box.y) >
							epsilon
					: a.y > box.y + epsilon &&
						a.y < box.y + box.height - epsilon &&
						Math.min(Math.max(a.x, b.x), box.x + box.width) - Math.max(Math.min(a.x, b.x), box.x) >
							epsilon;
				expect(crosses, `${route.id}: ${route.path} crosses ${box.id}`).toBe(false);
			}
		}
	}
}

describe('measured article diagram routes', () => {
	it('connects a three-card desktop chain with boundary-to-boundary straight lines', () => {
		const nodes: NodeBox[] = [0, 1, 2].map((column) => ({
			id: `n${column}`,
			x: 32 + column * 228,
			y: 32,
			width: 180,
			height: 96
		}));
		const edges = [
			{ id: 'commit', from: 'n0', to: 'n1' },
			{ id: 'deploy', from: 'n1', to: 'n2' }
		];
		const bounds = { width: 700, height: 160 };
		const routes = routeDiagramEdges(nodes, edges, bounds);
		expect(routes.map((route) => route.path)).toEqual(['M 212 80 L 260 80', 'M 440 80 L 488 80']);
		expect(routes[0]).toMatchObject({ x: 236, y: 80 });
		assertRoutesClear(nodes, edges, bounds, routes);
	});

	it('routes a five-card fan-out around the actual card sizes', () => {
		const nodes: NodeBox[] = [
			{ id: 'source', x: 32, y: 32, width: 180, height: 110 },
			{ id: 'build', x: 260, y: 32, width: 180, height: 140 },
			{ id: 'registry', x: 488, y: 32, width: 180, height: 120 },
			{ id: 'gitops', x: 32, y: 220, width: 180, height: 96 },
			{ id: 'cluster', x: 260, y: 220, width: 180, height: 136 }
		];
		const edges = [
			{ id: 'build', from: 'source', to: 'build' },
			{ id: 'push', from: 'build', to: 'registry' },
			{ id: 'watch', from: 'source', to: 'gitops' },
			{ id: 'sync', from: 'gitops', to: 'cluster' },
			{ id: 'pull', from: 'cluster', to: 'registry' },
			{ id: 'bypass', from: 'source', to: 'registry' }
		];
		const bounds = { width: 700, height: 388 };
		const routes = routeDiagramEdges(nodes, edges, bounds);
		expect(pointsOf(routes.find((route) => route.id === 'bypass')!.path).length).toBeGreaterThan(2);
		assertRoutesClear(nodes, edges, bounds, routes);
	});

	it('separates opposite messages and keeps a self-loop outside its card', () => {
		const nodes: NodeBox[] = [
			{ id: 'client', x: 32, y: 32, width: 180, height: 100 },
			{ id: 'server', x: 260, y: 32, width: 180, height: 100 }
		];
		const edges = [
			{ id: 'request', from: 'client', to: 'server' },
			{ id: 'response', from: 'server', to: 'client' },
			{ id: 'refresh', from: 'server', to: 'server' }
		];
		const bounds = { width: 472, height: 164 };
		const routes = routeDiagramEdges(nodes, edges, bounds);
		expect(pointsOf(routes[0].path)[0].y).not.toBe(pointsOf(routes[1].path)[0].y);
		expect(Math.hypot(routes[0].x - routes[1].x, routes[0].y - routes[1].y)).toBeGreaterThan(20);
		expect(pointsOf(routes[2].path)[1].x).toBeGreaterThan(440);
		assertRoutesClear(nodes, edges, bounds, routes);
	});

	it('detours non-adjacent mobile cards through the side padding', () => {
		const nodes: NodeBox[] = [0, 1, 2, 3].map((row) => ({
			id: `n${row}`,
			x: 24,
			y: 32 + row * 152,
			width: 260,
			height: 100
		}));
		const edges = [
			{ id: 'adjacent', from: 'n0', to: 'n1' },
			{ id: 'skip', from: 'n0', to: 'n3' },
			{ id: 'return', from: 'n3', to: 'n0' },
			{ id: 'middle', from: 'n1', to: 'n3' }
		];
		const bounds = { width: 320, height: 620 };
		const routes = routeDiagramEdges(nodes, edges, bounds);
		expect(pointsOf(routes[0].path)).toHaveLength(2);
		const skip = pointsOf(routes[1].path);
		expect(skip.some((point) => point.x < 24 || point.x > 284)).toBe(true);
		expect(routes[1].path).not.toBe(routes[2].path);
		assertRoutesClear(nodes, edges, bounds, routes);
	});

	it('keeps every connection in a full three-by-three grid clear of unrelated cards', () => {
		const nodes: NodeBox[] = Array.from({ length: 9 }, (_, index) => ({
			id: `n${index}`,
			x: 32 + (index % 3) * 228,
			y: 32 + Math.floor(index / 3) * 168,
			width: 180,
			height: 120
		}));
		const edges = nodes.flatMap((from) =>
			nodes.map((to) => ({ id: `${from.id}-${to.id}`, from: from.id, to: to.id }))
		);
		assertRoutesClear(nodes, edges, { width: 700, height: 520 });
	});

	it('uses measured fractional coordinates without cutting through unequal cards', () => {
		const nodes: NodeBox[] = [
			{ id: 'a', x: 32.3, y: 32.4, width: 185.7, height: 100.8 },
			{ id: 'b', x: 266.1, y: 32.4, width: 185.7, height: 162.3 },
			{ id: 'c', x: 32.3, y: 242.7, width: 185.7, height: 131.8 },
			{ id: 'd', x: 266.1, y: 242.7, width: 185.7, height: 118.2 }
		];
		const edges = [
			{ id: 'a-d', from: 'a', to: 'd' },
			{ id: 'b-c', from: 'b', to: 'c' },
			{ id: 'b-d', from: 'b', to: 'd' }
		];
		assertRoutesClear(nodes, edges, { width: 484, height: 408 });
	});

	it('does not mutate measurements and produces deterministic routes', () => {
		const nodes = [
			{ id: 'a', x: 32, y: 32, width: 180, height: 100 },
			{ id: 'b', x: 260, y: 180, width: 180, height: 100 }
		];
		const edges = [{ id: 'a-b', from: 'a', to: 'b' }];
		const initial = structuredClone({ nodes, edges });
		const bounds = { width: 472, height: 312 };
		expect(routeDiagramEdges(nodes, edges, bounds)).toEqual(
			routeDiagramEdges(nodes, edges, bounds)
		);
		expect({ nodes, edges }).toEqual(initial);
	});

	it('ignores unmeasured nodes and safely handles an unmounted or hidden diagram', () => {
		const nodes = [{ id: 'a', x: 32, y: 32, width: 180, height: 100 }];
		expect(
			routeDiagramEdges(nodes, [{ id: 'missing', from: 'a', to: 'missing' }], {
				width: 300,
				height: 200
			})
		).toEqual([]);
		expect(routeDiagramEdges(nodes, [], { width: 0, height: 0 })).toEqual([]);
		expect(routeDiagramEdges(nodes, [], { width: NaN, height: 200 })).toEqual([]);
	});
});
