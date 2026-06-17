import { z } from 'zod'

export const registerSchema = z
  .object({
    nombres: z.string().min(1, 'Los nombres son obligatorios'),
    apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
    telefono: z.string().min(1, 'El teléfono es obligatorio'),
    correo: z
      .string()
      .min(1, 'El correo es obligatorio')
      .email('Correo inválido'),
    idType: z.enum(['CC', 'Pasaporte', 'NIT'], {
      message: 'Selecciona un tipo de identificación',
    }),
    idNumber: z
      .string()
      .min(8, 'El número de identificación debe tener minimo 8 números')
      .max(10, "El número de identificación debe tener máximo 10 números"),
    role: z.enum(['productor', 'acopio', 'trabajador'], {
      message: 'Selecciona un tipo de registro',
    }),
    nombreLugar: z.string().optional(),
    departamento: z.string().nullable().optional(),
    municipio: z.string().nullable().optional(),
    centroSeleccionado: z.string().nullable().optional(),
    direccion: z.string().optional(),
    latitud: z.string().optional(),
    longitud: z.string().optional(),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })

export type RegisterFormData = z.infer<typeof registerSchema>
