export interface RegisterDto {
  email: string
  password: string
  nombres: string
  apellidos: string
  telefono: string
  tipoIdentificacion: string
  numeroIdentificacion: string
  rol: 'productor' | 'acopio' | 'trabajador'
  nombreLugar?: string
  departamento?: string
  municipio?: string
  centroAcopioId?: number | null
  direccion?: string
  latitud?: number
  longitud?: number
}
