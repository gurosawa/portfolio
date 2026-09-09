import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Marked } from 'marked';

// Optional authoring tool. Production builds consume checked-in SVGs and need no browser.
// Usage: node render-static-diagrams.mjs <path-to-playwright-core/index.mjs> [browser-channel]
const playwrightEntry = process.argv[2];
if (!playwrightEntry) throw new Error('Provide an installed playwright-core module path.');
const { chromium } = await import(pathToFileURL(path.resolve(playwrightEntry)).href);
const directory = path.dirname(fileURLToPath(import.meta.url));
const mermaidDirectory = path.resolve(directory, '../../../../node_modules/mermaid/dist');
/** @type {{posts: Array<{slug: string; body: string}>}} */
const snapshot = JSON.parse(await readFile(path.join(directory, 'snapshot.json'), 'utf8'));
/** @type {Array<{slug: string; source: string}>} */
const sources = [];
const parser = new Marked();
for (const post of snapshot.posts) {
	parser.walkTokens(parser.lexer(post.body), (token) => {
		if (token.type === 'code' && token.lang === 'mermaid') {
			sources.push({ slug: post.slug, source: token.text });
		}
	});
}
if (sources.length !== 19) throw new Error(`Expected 19 diagrams, found ${sources.length}.`);

const server = createServer(async (request, response) => {
	try {
		const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
		if (pathname === '/') {
			response.setHeader('Content-Type', 'text/html');
			response.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
			return;
		}
		const file = path.resolve(mermaidDirectory, `.${decodeURIComponent(pathname)}`);
		if (!file.startsWith(mermaidDirectory + path.sep)) throw new Error('Invalid asset path.');
		response.setHeader('Content-Type', 'text/javascript');
		response.end(await readFile(file));
	} catch {
		response.statusCode = 404;
		response.end('Not found');
	}
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
const address = server.address();
if (!address || typeof address === 'string')
	throw new Error('Local renderer server did not start.');
let browser;
try {
	browser = await chromium.launch({ channel: process.argv[3] ?? 'msedge', headless: true });
	const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
	await page.goto(`http://127.0.0.1:${address.port}/`);
	const rendered = await page.evaluate(
		/** @param {Array<{slug: string; source: string}>} entries */
		async (entries) => {
			const moduleUrl = '/mermaid.esm.min.mjs';
			const { default: mermaid } = await import(moduleUrl);
			mermaid.initialize({
				startOnLoad: false,
				securityLevel: 'strict',
				htmlLabels: false,
				suppressErrorRendering: true,
				theme: 'base',
				fontFamily: 'Arial, Malgun Gothic, sans-serif',
				flowchart: { htmlLabels: false, useMaxWidth: true },
				sequence: { useMaxWidth: true, wrap: true },
				themeVariables: {
					background: '#181a17',
					primaryColor: '#20241f',
					primaryTextColor: '#eeeae2',
					primaryBorderColor: '#787d70',
					lineColor: '#aaa9a2',
					secondaryColor: '#252a21',
					tertiaryColor: '#181a17',
					fontSize: '16px'
				}
			});
			const results = [];
			for (const [index, entry] of entries.entries()) {
				const { svg } = await mermaid.render(`ops-static-${index + 1}`, entry.source);
				const parsed = new DOMParser().parseFromString(
					svg.replace(/<br>/g, '<br/>'),
					'image/svg+xml'
				);
				if (parsed.querySelector('parsererror'))
					throw new Error(
						`Invalid SVG: ${entry.slug}: ${parsed.querySelector('parsererror')?.textContent}`
					);
				parsed.querySelectorAll('style, script, foreignObject').forEach((node) => node.remove());
				parsed.querySelectorAll('a').forEach((node) => node.replaceWith(...node.childNodes));
				const root = parsed.documentElement;
				root.removeAttribute('style');
				results.push({ ...entry, svg: new XMLSerializer().serializeToString(root) });
			}
			return results;
		},
		sources
	);
	await writeFile(
		path.join(directory, 'diagram-svgs.json'),
		JSON.stringify(rendered, null, '\t') + '\n'
	);
	console.log(
		`Rendered ${rendered.length} static SVGs. No runtime Mermaid or inline stylesheet required.`
	);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(() => resolve(undefined)));
}
