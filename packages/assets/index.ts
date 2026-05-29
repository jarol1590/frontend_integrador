// Exporta las rutas de assets como constantes
// Cada app las consume con su propio mecanismo (require / import)
export const assetPaths = {
  images: {
    logo:          './images/logo.png',
    bannerHome:    './images/banner-home.jpg',
    avatarDefault: './images/avatar-default.png',
  },
} as const
