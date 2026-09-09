export type NodeBox = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
};

type Edge = { id: string; from: string; to: string };
type Bounds = { width: number; height: number };
type Point = { x: number; y: number };
type Side = 'left' | 'right' | 'top' | 'bottom';
type Port = { boundary: Point; escape: Point; direction: number; penalty: number };

export type RoutedDiagramEdge = { id: string; path: string; x: number; y: number };

const EPSILON = 0.001;
const OBSTACLE_MARGIN = 5;
const BEND_COST = 18;

function inside(point: Point, box: NodeBox): boolean {
	return (
		point.x > box.x + EPSILON &&
		point.x < box.x + box.width - EPSILON &&
		point.y > box.y + EPSILON &&
		point.y < box.y + box.height - EPSILON
	);
}

function segmentClear(a: Point, b: Point, boxes: NodeBox[]): boolean {
	if (Math.abs(a.x - b.x) < EPSILON) {
		return !boxes.some(
			(box) =>
				a.x > box.x + EPSILON &&
				a.x < box.x + box.width - EPSILON &&
				Math.min(Math.max(a.y, b.y), box.y + box.height) - Math.max(Math.min(a.y, b.y), box.y) >
					EPSILON
		);
	}
	if (Math.abs(a.y - b.y) < EPSILON) {
		return !boxes.some(
			(box) =>
				a.y > box.y + EPSILON &&
				a.y < box.y + box.height - EPSILON &&
				Math.min(Math.max(a.x, b.x), box.x + box.width) - Math.max(Math.min(a.x, b.x), box.x) >
					EPSILON
		);
	}
	return false;
}

function inBounds(point: Point, bounds: Bounds): boolean {
	return point.x >= 0 && point.y >= 0 && point.x <= bounds.width && point.y <= bounds.height;
}

function centre(box: NodeBox): Point {
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function shiftedMiddle(min: number, max: number, offset: number): number {
	const inset = Math.min(8, (max - min) / 4);
	return clamp((min + max) / 2 + offset, min + inset, max - inset);
}

function straightRoute(
	from: NodeBox,
	to: NodeBox,
	boxes: NodeBox[],
	offset: number
): Point[] | undefined {
	const a = centre(from);
	const b = centre(to);
	const sharedTop = Math.max(from.y, to.y);
	const sharedBottom = Math.min(from.y + from.height, to.y + to.height);
	if ((Math.abs(from.y - to.y) < 1 || Math.abs(a.y - b.y) < 1) && sharedBottom > sharedTop) {
		const y = shiftedMiddle(sharedTop, sharedBottom, offset);
		const points = [
			{ x: a.x < b.x ? from.x + from.width : from.x, y },
			{ x: a.x < b.x ? to.x : to.x + to.width, y }
		];
		if (segmentClear(points[0], points[1], boxes)) return points;
	}
	const sharedLeft = Math.max(from.x, to.x);
	const sharedRight = Math.min(from.x + from.width, to.x + to.width);
	if ((Math.abs(from.x - to.x) < 1 || Math.abs(a.x - b.x) < 1) && sharedRight > sharedLeft) {
		const x = shiftedMiddle(sharedLeft, sharedRight, offset);
		const points = [
			{ x, y: a.y < b.y ? from.y + from.height : from.y },
			{ x, y: a.y < b.y ? to.y : to.y + to.height }
		];
		if (segmentClear(points[0], points[1], boxes)) return points;
	}
	return undefined;
}

function makePorts(
	box: NodeBox,
	toward: NodeBox,
	boxes: NodeBox[],
	bounds: Bounds,
	offset: number,
	clearance: number
): Port[] {
	const middle = centre(box);
	const other = centre(toward);
	const dx = other.x - middle.x;
	const dy = other.y - middle.y;
	const distance = Math.hypot(dx, dy) || 1;
	const x = shiftedMiddle(box.x, box.x + box.width, offset);
	const y = shiftedMiddle(box.y, box.y + box.height, offset);
	const sides: { side: Side; boundary: Point; vx: number; vy: number }[] = [
		{ side: 'right', boundary: { x: box.x + box.width, y }, vx: 1, vy: 0 },
		{ side: 'bottom', boundary: { x, y: box.y + box.height }, vx: 0, vy: 1 },
		{ side: 'left', boundary: { x: box.x, y }, vx: -1, vy: 0 },
		{ side: 'top', boundary: { x, y: box.y }, vx: 0, vy: -1 }
	];
	return sides.flatMap(({ boundary, vx, vy }) => {
		const escape = { x: boundary.x + vx * clearance, y: boundary.y + vy * clearance };
		if (!inBounds(escape, bounds) || !segmentClear(boundary, escape, boxes)) return [];
		return [
			{
				boundary,
				escape,
				direction: vx ? 1 : 2,
				penalty: (1 - (dx * vx + dy * vy) / distance) * 16
			}
		];
	});
}

type QueueEntry = { state: number; cost: number };

class MinQueue {
	private entries: QueueEntry[] = [];

	push(entry: QueueEntry): void {
		this.entries.push(entry);
		let index = this.entries.length - 1;
		while (index > 0) {
			const parent = Math.floor((index - 1) / 2);
			if (this.entries[parent].cost <= entry.cost) break;
			this.entries[index] = this.entries[parent];
			index = parent;
		}
		this.entries[index] = entry;
	}

	pop(): QueueEntry | undefined {
		const first = this.entries[0];
		const last = this.entries.pop();
		if (!this.entries.length || !last) return first;
		let index = 0;
		while (index * 2 + 1 < this.entries.length) {
			let child = index * 2 + 1;
			if (
				child + 1 < this.entries.length &&
				this.entries[child + 1].cost < this.entries[child].cost
			) {
				child += 1;
			}
			if (last.cost <= this.entries[child].cost) break;
			this.entries[index] = this.entries[child];
			index = child;
		}
		this.entries[index] = last;
		return first;
	}
}

function uniqueCoordinates(values: number[], limit: number): number[] {
	return [...new Set(values.filter((value) => value >= 0 && value <= limit))].sort((a, b) => a - b);
}

function detourRoute(
	from: NodeBox,
	to: NodeBox,
	boxes: NodeBox[],
	bounds: Bounds,
	offset: number,
	clearance: number
): Point[] | undefined {
	const starts = makePorts(from, to, boxes, bounds, offset, clearance);
	const finishes = makePorts(to, from, boxes, bounds, offset, clearance);
	if (!starts.length || !finishes.length) return undefined;
	const obstacles = boxes.map((box) => ({
		...box,
		x: box.x - OBSTACLE_MARGIN,
		y: box.y - OBSTACLE_MARGIN,
		width: box.width + OBSTACLE_MARGIN * 2,
		height: box.height + OBSTACLE_MARGIN * 2
	}));
	const ports = [...starts, ...finishes];
	const xs = uniqueCoordinates(
		[
			8,
			bounds.width - 8,
			...boxes.flatMap((box) => [box.x - clearance, box.x + box.width + clearance]),
			...ports.map((port) => port.escape.x)
		],
		bounds.width
	);
	const ys = uniqueCoordinates(
		[
			8,
			bounds.height - 8,
			...boxes.flatMap((box) => [box.y - clearance, box.y + box.height + clearance]),
			...ports.map((port) => port.escape.y)
		],
		bounds.height
	);
	const points = ys.flatMap((y) => xs.map((x) => ({ x, y })));
	const valid = points.map((point) => !obstacles.some((box) => inside(point, box)));
	const indexOf = (point: Point) => ys.indexOf(point.y) * xs.length + xs.indexOf(point.x);
	const neighbours = points.map((point, index) => {
		if (!valid[index]) return [];
		const column = index % xs.length;
		return [
			column > 0 ? index - 1 : -1,
			column + 1 < xs.length ? index + 1 : -1,
			index - xs.length,
			index + xs.length
		].filter(
			(next) =>
				next >= 0 &&
				next < points.length &&
				valid[next] &&
				segmentClear(point, points[next], obstacles)
		);
	});
	const distances = new Float64Array(points.length * 3).fill(Infinity);
	const previous = new Int32Array(points.length * 3).fill(-1);
	const origin = new Int32Array(points.length * 3).fill(-1);
	const queue = new MinQueue();
	starts.forEach((port, index) => {
		const gridIndex = indexOf(port.escape);
		if (!valid[gridIndex]) return;
		const state = gridIndex * 3 + port.direction;
		const cost = port.penalty + clearance;
		if (cost >= distances[state]) return;
		distances[state] = cost;
		origin[state] = index;
		queue.push({ state, cost });
	});
	const goals = finishes.map((port) => indexOf(port.escape));
	let bestCost = Infinity;
	let bestState = -1;
	let bestFinish = -1;
	for (let current = queue.pop(); current; current = queue.pop()) {
		if (current.cost > distances[current.state] || current.cost >= bestCost) continue;
		const gridIndex = Math.floor(current.state / 3);
		const direction = current.state % 3;
		finishes.forEach((port, finishIndex) => {
			if (goals[finishIndex] !== gridIndex) return;
			const cost =
				current.cost + port.penalty + clearance + (direction === port.direction ? 0 : BEND_COST);
			if (cost < bestCost) {
				bestCost = cost;
				bestState = current.state;
				bestFinish = finishIndex;
			}
		});
		for (const next of neighbours[gridIndex]) {
			const nextDirection = Math.abs(points[gridIndex].y - points[next].y) < EPSILON ? 1 : 2;
			const distance =
				Math.abs(points[gridIndex].x - points[next].x) +
				Math.abs(points[gridIndex].y - points[next].y);
			const cost = current.cost + distance + (direction === nextDirection ? 0 : BEND_COST);
			const state = next * 3 + nextDirection;
			if (cost >= distances[state]) continue;
			distances[state] = cost;
			previous[state] = current.state;
			origin[state] = origin[current.state];
			queue.push({ state, cost });
		}
	}
	if (bestState < 0) return undefined;
	const route: Point[] = [];
	for (let state = bestState; state >= 0; state = previous[state]) {
		route.push(points[Math.floor(state / 3)]);
	}
	route.reverse();
	return [starts[origin[bestState]].boundary, ...route, finishes[bestFinish].boundary];
}

function selfRoute(
	box: NodeBox,
	boxes: NodeBox[],
	bounds: Bounds,
	offset: number
): Point[] | undefined {
	const half = Math.min(12, box.height / 4);
	const y = clamp(box.y + box.height / 2 + offset, box.y + half, box.y + box.height - half);
	for (const direction of [1, -1]) {
		const x = direction > 0 ? box.x + box.width : box.x;
		const outside = x + direction * 20;
		const points = [
			{ x, y: y - half },
			{ x: outside, y: y - half },
			{ x: outside, y: y + half },
			{ x, y: y + half }
		];
		if (
			points.every((point) => inBounds(point, bounds)) &&
			points.slice(1).every((point, index) => segmentClear(points[index], point, boxes))
		) {
			return points;
		}
	}
	return undefined;
}

function simplify(points: Point[]): Point[] {
	const result: Point[] = [];
	for (const point of points) {
		const last = result.at(-1);
		if (last && Math.abs(last.x - point.x) < EPSILON && Math.abs(last.y - point.y) < EPSILON) {
			continue;
		}
		const before = result.at(-2);
		if (
			before &&
			last &&
			((Math.abs(before.x - last.x) < EPSILON && Math.abs(last.x - point.x) < EPSILON) ||
				(Math.abs(before.y - last.y) < EPSILON && Math.abs(last.y - point.y) < EPSILON))
		) {
			result.pop();
		}
		result.push(point);
	}
	return result;
}

function pointAlong(points: Point[], fraction: number): Point {
	const lengths = points.slice(1).map((point, index) => {
		return Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y);
	});
	let remaining = lengths.reduce((sum, length) => sum + length, 0) * fraction;
	for (let index = 0; index < lengths.length; index += 1) {
		if (remaining <= lengths[index]) {
			const ratio = lengths[index] ? remaining / lengths[index] : 0;
			return {
				x: points[index].x + (points[index + 1].x - points[index].x) * ratio,
				y: points[index].y + (points[index + 1].y - points[index].y) * ratio
			};
		}
		remaining -= lengths[index];
	}
	return points[0];
}

/** Route measured cards without assuming fixed text lengths or equal card heights. */
export function routeDiagramEdges(
	nodes: NodeBox[],
	edges: Edge[],
	bounds: Bounds
): RoutedDiagramEdge[] {
	if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return [];
	if (bounds.width <= 0 || bounds.height <= 0) return [];
	const boxes = nodes.filter(
		(box) =>
			[box.x, box.y, box.width, box.height].every(Number.isFinite) &&
			box.width > 0 &&
			box.height > 0 &&
			inBounds({ x: box.x, y: box.y }, bounds) &&
			inBounds({ x: box.x + box.width, y: box.y + box.height }, bounds)
	);
	const byId = new Map(boxes.map((box) => [box.id, box]));
	return edges.flatMap((edge) => {
		const from = byId.get(edge.from);
		const to = byId.get(edge.to);
		if (!from || !to) return [];
		const siblings = edges.filter(
			(other) =>
				(other.from === edge.from && other.to === edge.to) ||
				(other.from === edge.to && other.to === edge.from)
		);
		const lane = siblings.indexOf(edge);
		const offset = clamp((lane - (siblings.length - 1) / 2) * 12, -18, 18);
		const clearance = Math.min(24, 12 + lane * 4);
		const points =
			from.id === to.id
				? selfRoute(from, boxes, bounds, offset)
				: (straightRoute(from, to, boxes, offset) ??
					detourRoute(from, to, boxes, bounds, offset, clearance));
		if (!points || points.length < 2) return [];
		const route = simplify(points);
		// Opposite arrows need separate badge positions as well as separate lanes.
		const canonicalFraction = lane % 2 ? 0.7 : 0.3;
		const fraction =
			siblings.length === 1 ? 0.5 : from.id < to.id ? canonicalFraction : 1 - canonicalFraction;
		const badge = pointAlong(route, fraction);
		const value = (number: number) => Number(number.toFixed(2));
		return [
			{
				id: edge.id,
				path: route
					.map((point, index) => `${index ? 'L' : 'M'} ${value(point.x)} ${value(point.y)}`)
					.join(' '),
				x: value(badge.x),
				y: value(badge.y)
			}
		];
	});
}
