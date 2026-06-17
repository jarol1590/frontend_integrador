# Proyecto Integrador — Monorepo

Monorepo con arquitectura limpia para web (Next.js) y mobile (Expo).

## Estructura

```
proyectointegrador/
├── apps/
│   ├── web/          → Next.js (React)
│   └── mobile/       → Expo (React Native)
└── packages/
    ├── domain/        → Entidades, value objects, interfaces
    ├── application/   → Casos de uso, DTOs, hooks de lógica
    ├── shared-infra/  → HttpClient, validadores
    ├── design-tokens/ → Colores, espaciado, tipografía
    └── assets/        → Imágenes compartidas
```

## Comandos

```bash
# Instalar todo desde la raíz
npm install

# Correr web en desarrollo
npm run dev:web

# Correr mobile en desarrollo
npm run dev:mobile

# Build web para producción
npm run build:web

# Lint en todos los proyectos
npm run lint

# Tests en todos los proyectos
npm run test
```

## Regla de dependencias (Clean Architecture)

```
apps/*  →  application  →  domain
apps/*  →  shared-infra →  domain
```

- `domain` no depende de nada externo
- `application` solo depende de `domain`
- `apps/*` implementan las interfaces de `domain` y usan los casos de uso de `application`
