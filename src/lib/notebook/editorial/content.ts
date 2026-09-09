import type { StoryDocument } from '../story/schema';
import type { EditorialScene, SecurityEditorial } from './schema';

export function sceneActs(story: StoryDocument, scene: EditorialScene) {
	return story.acts.filter((act) => scene.actIds.includes(act.id));
}

export function sceneSources(story: StoryDocument, scene: EditorialScene) {
	return sceneActs(story, scene).flatMap((act) =>
		act.blocks.filter((block) => ['code', 'table', 'list', 'form'].includes(block.kind))
	);
}

export function sceneDeepDives(story: StoryDocument, scene: EditorialScene) {
	return story.deepDives.filter((deep) => scene.actIds.includes(deep.actId));
}

export function validateEditorial(story: StoryDocument, editorial: SecurityEditorial) {
	if (story.meta.slug !== editorial.slug)
		throw new Error('Editorial route does not match its source');
	const ids = editorial.scenes.flatMap((scene) => scene.actIds);
	const unique = new Set(ids);
	if (
		unique.size !== ids.length ||
		unique.size !== story.acts.length ||
		story.acts.some((act) => !unique.has(act.id))
	) {
		throw new Error(`${editorial.slug}: every original Act must belong to exactly one scene`);
	}
	if (new Set(editorial.scenes.map((scene) => scene.id)).size !== editorial.scenes.length) {
		throw new Error(`${editorial.slug}: scene IDs must be unique`);
	}
	return editorial;
}
