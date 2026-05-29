export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isNotEmpty = (value: string): boolean =>
  value.trim().length > 0

export const hasMinLength = (value: string, min: number): boolean =>
  value.length >= min
