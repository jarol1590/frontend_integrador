export interface RegisterDto {
  email: string
  password: string
  rolId: number
  centroAcopioId?: number | null
  productorNombre: string
  documento: string
  telefono: string
  tipoDocumentoId: number
  fincaNombre?: string
  direccion?: string
  latitud?: number
  longitud?: number
  municipioId: number
}
