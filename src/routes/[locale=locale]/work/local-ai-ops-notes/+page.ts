import { supportedLocales } from '$lib/portfolio/content';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () => supportedLocales.map((locale) => ({ locale }));
