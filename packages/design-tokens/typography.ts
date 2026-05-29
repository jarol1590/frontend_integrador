export const typography = {
  fontSizes: {
    xs:  11,
    sm:  13,
    md:  16,
    lg:  20,
    xl:  24,
    xxl: 32,
  },
  fontWeights: {
    regular: '400',
    medium:  '500',
    bold:    '700',
  },
  lineHeights: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
} as const

export type Typography = typeof typography
