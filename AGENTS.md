# AGENTS.md — Proyecto Integrador

## Commands

```bash
npm install              # install everything from root (npm workspaces)
npm run dev:web          # next dev on apps/web
npm run dev:mobile       # expo start on apps/mobile
npm run build:web        # next build on apps/web
npm run lint             # runs lint in all workspaces (--if-present)
npm run test             # runs test in all workspaces (--if-present)
```

No typecheck script exists. Run `npx tsc --noEmit` per workspace if needed.

## Architecture

Clean Architecture monorepo via npm workspaces (`apps/*`, `packages/*`).

```
apps/*  →  application  →  domain
apps/*  →  shared-infra →  domain
```

- **`packages/domain`** — zero external deps. Entities, value objects, repository interfaces.
- **`packages/application`** — use cases + DTOs + pure logic hooks. Depends only on `domain`.
- **`packages/shared-infra`** — `HttpClient` (thin `fetch` wrapper), validators. Depends only on `domain`.
- **`packages/design-tokens`** / **`packages/assets`** — leaf libraries, no internal deps.
- **`apps/web`** (Next.js 15, React 19, Tailwind 4) — `UserRepositoryWeb` calls API via `HttpClient`.
- **`apps/mobile`** (Expo 54, React Native 0.76, expo-router) — `UserRepositoryMobile` calls API + AsyncStorage cache fallback.

DI pattern: each app has a `DependencyProvider` that instantiates use cases with the platform-specific repository.

## Key setup details

- `next.config.ts` **must** list all `@proyectointegrador/*` packages in `transpilePackages`.
- `apps/mobile/metro.config.js` **must** add `watchFolders: [monorepoRoot]` and set `resolver.nodeModulesPaths` so Metro sees the monorepo packages. The mobile entrypoint is `expo-router/entry` (set in `package.json` `"main"`).
- TypeScript path aliases (`@proyectointegrador/*`) are defined in root `tsconfig.base.json` and extended by each app's `tsconfig.json`.
- Env vars: web uses `NEXT_PUBLIC_API_URL`, mobile uses `EXPO_PUBLIC_API_URL`. Each app has its own `.env.example`.

## Testing

- Mobile uses `jest` with `jest-expo` preset. Config is inline in `apps/mobile/package.json`.
- Web has no test framework configured (only ESLint).
- Run `npm run test` from root, or `npm run test --workspace=apps/mobile`.

## Migration / codegen

None. No DB migrations, no codegen, no build artifacts to regenerate.
