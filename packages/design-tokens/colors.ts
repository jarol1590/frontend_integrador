export const colors = {
  primary:    '#534AB7',
  primaryDark:'#3C3489',
  secondary:  '#1D9E75',
  danger:     '#E24B4A',
  warning:    '#EF9F27',
  success:    '#1D9E75',
  info:       '#185FA5',

  text: {
    primary:   '#2C2C2A',
    secondary: '#5F5E5A',
    tertiary:  '#888780',
    inverse:   '#FFFFFF',
  },

  background: {
    primary:   '#FFFFFF',
    secondary: '#F1EFE8',
    tertiary:  '#E8E6DE',
  },

  border: {
    light:  '#D3D1C7',
    medium: '#B4B2A9',
  },
} as const

export type Colors = typeof colors
