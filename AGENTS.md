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

No typecheck script. Each app has its own `tsconfig.json`. Run `npx tsc --noEmit` per workspace.

## Architecture

Clean Architecture monorepo via npm workspaces (`apps/*`, `packages/*`). Source code lives under `src/` in both apps.

```
apps/*  →  application  →  domain
apps/*  →  shared-infra →  domain
```

- **`packages/domain`** — zero deps. `User` entity, `Email` value object, `IUserRepository` interface.
- **`packages/application`** — depends only on `domain`. `GetUserUseCase`, `GetAllUsersUseCase`, `UserDTO`, `useDebounce`, `usePagination`.
- **`packages/shared-infra`** — `HttpClient` (thin `fetch` wrapper), validators (`isValidEmail`, `isNotEmpty`, `hasMinLength`). Depends only on `domain`.
- **`packages/design-tokens`** / **`packages/assets`** — leaf libraries, no internal deps.
- **`apps/web`** (Next.js 16, React 19, Tailwind 4) — `UserRepositoryWeb` calls API via `HttpClient`.
- **`apps/mobile`** (Expo 54, React Native 0.81, expo-router) — `UserRepositoryMobile` calls API + `AsyncStorage` cache fallback.

DI: each app has a React Context `DependencyProvider` (`src/providers/DependencyProvider.tsx`) that instantiates use cases with the platform-specific repository. Web layout uses `'use client'` (Next.js client component).

## Key setup details

- `next.config.ts` **must** list all `@proyectointegrador/*` packages in `transpilePackages`.
- Mobile entrypoint is `expo-router/entry` (set in `package.json` `"main"`).
- TypeScript path aliases (`@proyectointegrador/*`) defined in root `tsconfig.base.json` and extended by each app's `tsconfig.json`. Each package's `package.json` has `"types"` pointing to `./index.ts`.
- Env vars: web uses `NEXT_PUBLIC_API_URL`, mobile uses `EXPO_PUBLIC_API_URL`. Each app has its own `.env.example`.
- Root `package.json` `overrides` pins `react` and `react-dom` to `19.1.0`.
- ESLint: web runs `eslint src` with `eslint-config-next` (no local config file); mobile uses `expo lint` via `eslint.config.js` with `eslint-config-expo`.

## Testing

- Only mobile has tests: `jest` with `jest-expo` preset, config inline in `apps/mobile/package.json`, setup file at `jest.setup.js`.
- Web has no test framework (only ESLint).
- Filter: `npm run test --workspace=apps/mobile` or `npm run test -- --workspace=apps/mobile`.

## Migration / codegen

None. No DB migrations, no codegen, no build artifacts.
