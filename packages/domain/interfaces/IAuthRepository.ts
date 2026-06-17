export interface AuthUser {
  usuarioId: number
  email: string
  estado: string
  fechaCreacion: string
  tipoUsuario: string
  rolNombre: string
  rolId?: number
  centroAcopioId?: number | null
  centroAcopio?: string
}

export interface AuthSession {
  accessToken: string
  usuario: AuthUser
}

export interface RegisterRequest {
  email: string
  password: string
  estado: string
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
  centroAcopio?: CentroAcopioProvision | null
  trabajador?: TrabajadorProvision | null
}

export interface CentroAcopioProvision {
  nombre: string
  direccion?: string | null
  latitud?: number | null
  longitud?: number | null
  municipioId: number
}

export interface TrabajadorProvision {
  nombre: string
  documento: string
  telefono?: string | null
  tipoDocumentoId: number
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  register(data: RegisterRequest): Promise<void>
  forgotPassword(email: string): Promise<void>
  verifyResetCode(email: string, code: string): Promise<{ token: string }>
  resetPassword(token: string, newPassword: string): Promise<void>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
}
