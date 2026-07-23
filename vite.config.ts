import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({
				pages: 'build',
				assets: 'build',
				strict: true
			}),
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'base-uri': ['self'],
					'connect-src': ['self'],
					'font-src': ['self', 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
					'form-action': ['self'],
					'frame-src': ['none'],
					'img-src': ['self', 'data:'],
					'manifest-src': ['self'],
					'media-src': ['self'],
					'object-src': ['none'],
					'script-src': ['self'],
					'style-src-attr': ['unsafe-inline'],
					'style-src-elem': ['self', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
					'upgrade-insecure-requests': true
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
