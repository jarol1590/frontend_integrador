# @proyectointegrador/assets

Imágenes compartidas entre web y mobile.

## Uso en Web (Next.js)
```ts
import logo from '@proyectointegrador/assets/images/logo.png'
```

## Uso en Mobile (Expo)
```ts
const logo = require('@proyectointegrador/assets/images/logo.png')
```

## Agregar imágenes
Coloca los archivos en `images/`. Nombra las versiones mobile con sufijos de densidad:
- `logo.png` (base)
- `logo@2x.png` (retina)
- `logo@3x.png` (retina HD)
