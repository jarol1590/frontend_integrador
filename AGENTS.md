# AGENTS.md — Proyecto Integrador

## Commands

```bash
npm install              # install everything from root (npm workspaces)
npm run dev:web          # next dev on apps/web
npm run dev:mobile       # expo start on apps/mobile
npm run build:web        # next build on apps/web
npm run lint             # npm run lint --workspaces --if-present
npm run test             # npm run test --workspaces --if-present
```

`lint` and `test` use `--if-present` — they won't error on packages without a matching script. Packages have no scripts; only apps do. Only mobile has tests (jest, jest-expo preset). Run mobile tests alone: `npm run test --workspace=apps/mobile`.

No typecheck script. Run `npx tsc --noEmit` per workspace.

## Architecture

Clean Architecture via npm workspaces (`apps/*`, `packages/*`). Dependency direction: `apps/* → application → domain` and `apps/* → shared-infra → domain`.

- **`packages/domain`** — zero deps. `User` entity, `Email` value object, `IUserRepository`, `IAuthRepository`.
- **`packages/application`** — only depends on `domain`. Use cases, DTOs, zod schemas, pure hooks (`useDebounce`, `usePagination`).
- **`packages/shared-infra`** — only depends on `domain`. `HttpClient`, validators.
- **`packages/design-tokens`** / **`packages/assets`** — leaf libraries, no internal deps.
- **`apps/web`** (Next.js 16, React 19, Tailwind 4) — `UserRepositoryWeb`, `AuthRepositoryWeb` in `src/infrastructure/`. No CSS or config files yet.
- **`apps/mobile`** (Expo 54, React Native 0.81, expo-router) — `UserRepositoryMobile`, `AuthRepositoryMobile`, plus geocode/ubicacion/colombia API clients in `src/infrastructure/`.

DI: each app has a React Context `DependencyProvider` (`src/providers/DependencyProvider.tsx`) that instantiates use cases with platform-specific repositories. Web's `layout.tsx` imports it (the provider has `'use client'`; the layout is a server component).

## Key setup

- **New packages**: must add path aliases in `tsconfig.base.json` **and** duplicate them in `apps/mobile/tsconfig.json` (mobile extends `expo/tsconfig.base`, **not** the root base). Also add to `next.config.ts` `transpilePackages`.
- `next.config.ts` must list all `@proyectointegrador/*` packages in `transpilePackages`.
- Mobile entrypoint: `expo-router/entry` (set in `package.json` `"main"`).
- Root `tsconfig.base.json` uses `moduleResolution: "bundler"`. Each app's `tsconfig.json` extends it (web) or expo's base (mobile) with local overrides.
- Env vars: web uses `NEXT_PUBLIC_API_URL`, mobile uses `EXPO_PUBLIC_API_URL`. Each app has its own `.env.example`. `.env` files are gitignored.
- Root `package.json` `overrides` pins `react` and `react-dom` to `19.1.0`.
- Web lint: `eslint src` with `eslint-config-next` (no local config file). Mobile lint: `expo lint` via `eslint.config.js` with `eslint-config-expo`.

## Riesgo Regional (Fase 1 — Heat map por tarjetas)

Backend endpoint `GET /api/centros-acopio/{id}/gemelo/riesgo-regional` devuelve `CentroAcopioRiesgoRegionalDto` con lista de fincas y score promedio.

Frontend:
- **Mobile**: `apps/mobile/src/app/riesgo-regional.tsx` — pantalla con tarjetas de fincas agrupadas por municipio, gradiente de color por score (rojo ≥ 60, amarillo ≥ 30, verde < 30), score bar + conteo alertas + temperatura. Tap en finca → navega a `/gemelo?fincaId=X`.
- **Mobile**: Botón "R. Regional" en bottom bar de `dashboard-centro.tsx`.
- **Web**: `apps/web/src/app/riesgo-regional/page.tsx` — misma funcionalidad con Tailwind.
- **Web**: Nav item "Riesgo Regional" en `AppLayout.tsx` para roles `centro_acopio` y `trabajador_centro_acopio`.

El `gemelo.tsx` (mobile) y `gemelo/page.tsx` (web) aceptan `fincaId` y `fincaNombre` como query params para drill-down desde riesgo-regional.

## Migration / codegen

None.
