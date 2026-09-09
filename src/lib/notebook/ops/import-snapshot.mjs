import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mechanical import: preserve the published bodies and verify them against their Markdown sources.
const [publishedFile, sourceDirectory] = process.argv.slice(2);
if (!publishedFile || !sourceDirectory) {
	throw new Error('Provide the published posts.json path and its Markdown source directory.');
}
const destination = path.dirname(fileURLToPath(import.meta.url));
const publishedBytes = await readFile(publishedFile);
/** @type {{ posts: Array<{ slug: string; sourceFile: string; body: string; [key: string]: unknown }> }} */
const snapshot = JSON.parse(publishedBytes.toString('utf8'));
/** @param {string | Uint8Array} value */
const digest = (value) => createHash('sha256').update(value).digest('hex');
const audit = [];
for (const post of snapshot.posts) {
	const markdownBytes = await readFile(path.join(sourceDirectory, post.sourceFile));
	const markdown = markdownBytes.toString('utf8');
	const matched = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
	const body = matched?.[1]
		.trim()
		.replace(/^#\s+[^\r\n]+\r?\n+/, '')
		.trim();
	if (body !== post.body) throw new Error(`Published body differs from source: ${post.slug}`);
	audit.push({
		slug: post.slug,
		sourceFile: post.sourceFile,
		markdownSha256: digest(markdownBytes),
		bodySha256: digest(post.body)
	});
}
if (snapshot.posts.length !== 15) throw new Error('Expected the original 15-post collection.');
await writeFile(path.join(destination, 'snapshot.json'), publishedBytes);
await writeFile(
	path.join(destination, 'catalog.json'),
	JSON.stringify(
		snapshot.posts.map((post) => {
			const { body, ...metadata } = post;
			if (typeof body !== 'string') throw new Error('Expected a Markdown body.');
			return metadata;
		}),
		null,
		2
	) + '\n'
);
await writeFile(
	path.join(destination, 'source-audit.json'),
	JSON.stringify({ publishedPayloadSha256: digest(publishedBytes), posts: audit }, null, 2) + '\n'
);
console.log(`Imported ${audit.length} posts. Every body matches its original Markdown source.`);
