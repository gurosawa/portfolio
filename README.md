# Portfolio

Bilingual interactive portfolio prepared for Azure Static Web Apps.

## Stack

- SvelteKit
- TypeScript
- Tailwind CSS
- Vitest
- ESLint and Prettier

## Local Development

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173/ko` or `http://127.0.0.1:5173/en`.

## Verification

```sh
npm run check
npm run test
npm run lint
npm run build
```

## Azure Static Web Apps

This project builds as a static SvelteKit site.

Recommended Azure portal settings:

- Service: Azure Static Web Apps
- Resource group: `resume`
- Plan: `Free`
- Region: `Korea Central` if available, otherwise `East Asia`
- Source: GitHub
- Branch: `main`
- App location: `/`
- API location: leave empty
- Output location: `build`

Root requests redirect to `/ko/` through `static/staticwebapp.config.json`.
