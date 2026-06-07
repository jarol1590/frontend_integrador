export interface AuthUser {
  usuarioId: number
  email: string
  estado: string
  fechaCreacion: string
  tipoUsuario: string
  rolNombre: string
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
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  register(data: RegisterRequest): Promise<void>
  forgotPassword(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
}
