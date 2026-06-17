import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
