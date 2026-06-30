# Portfolio Homepage IA

## Purpose

Build a local-only homepage MVP for a bilingual interactive portfolio around the theme `BOUNDARIES IN MOTION.` The site presents Hongbeom Joo as a technical operator moving from traditional infrastructure operations into Infrastructure & AI Operations.

## Homepage Section Order

1. Header
2. Hero
3. Synthetic Terminal Identity
4. About
5. What I Do
6. Experience / History
7. Things I Learned the Hard Way
8. Motto
9. Contact

## Dual-Layer Interaction Rules

- Surface copy is visible by default.
- Inner copy is revealed on hover, focus, or tap.
- Click, Enter, and Space toggle a locked reveal state.
- Reveal regions use button semantics with `aria-expanded` and `aria-controls`.
- The CTA inside a work card is separate from the card body interaction.
- Text layers occupy the same grid cell to reduce layout shift.

## Mobile Interaction Model

- Mobile uses tap-to-toggle, not hover-only behavior.
- Touch targets should be at least 44px high where practical.
- The header can wrap compactly, but desktop navigation must remain one line.
- Work card CTAs stay separate so tapping body text does not trigger navigation.

## Bilingual Routing Strategy

- `/` redirects to `/ko`.
- `/ko` and `/en` render the localized homepage.
- `/ko/work/[slug]` and `/en/work/[slug]` render lightweight placeholder work pages.
- Work slugs stay English for both locales.
- Language links preserve the current route intent where possible.

## Content Model

- Locale-level homepage content contains header, hero, terminal rows, about copy, work cards, history, lessons, motto, and contact links.
- Work cards share stable slugs, status, tags, and CTA metadata across locales.
- Synthetic terminal content is authored text only. It must not read system status, logs, internal IPs, SSH hostnames, local model endpoints, or private infrastructure state.
- Korean copy is normalized from the brief because the pasted Korean source text was encoding-corrupted.

## Component Map

- `DualText`: accessible surface/inner reveal control.
- `SectionHeading`: consistent section title and optional intro.
- `WorkCard`: work summary with separate reveal body and CTA.
- `TimelineItem`: factual experience row.
- `HardLesson`: lesson reveal block.
- `ContactLink`: accessible contact action.
- `SyntheticTerminal`: fake identity terminal with safe authored rows.

## Implementation Scope

- Local SvelteKit + TypeScript + Tailwind homepage MVP.
- Reusable Svelte components and typed portfolio content.
- Route-based Korean and English pages.
- Placeholder work detail pages only.
- Basic unit tests for content integrity and routing assumptions.

## Local-Only Development Policy

- No deployment.
- No automatic git commit.
- No push or pull request.
- No Vercel initialization.
- No `.vercel` creation.
- No `.env` modification.
- No production service calls.
- Dependencies are installed only for local development.

## Future Vercel TODOs

- Decide whether `adapter-auto` remains sufficient.
- Add project-level environment variables only after deployment scope is approved.
- Configure Vercel project linkage in a separate deployment task.
- Add production metadata, Open Graph images, and analytics only after local MVP review.

## Non-Goals

- Production deployment.
- Full work case-study pages.
- CMS integration.
- External API calls from the app.
- Real terminal data or infrastructure telemetry.
- Heavy animation libraries.
- Exact recreation of any reference portfolio.
