export interface AuthUser {
  usuarioId: string
  email: string
  estado: string
  fechaCreacion: string
  centroAcopio: string
}

export interface AuthSession {
  accessToken: string
  usuario: AuthUser
}

export interface RegisterRequest {
  email: string
  password: string
  estado: string
  centroAcopioId?: number | null
  nombres: string
  apellidos: string
  telefono: string
  tipoIdentificacion: string
  numeroIdentificacion: string
  rol: 'productor' | 'acopio' | 'trabajador'
  nombreLugar?: string
  departamento?: string
  municipio?: string
  direccion?: string
  latitud?: number
  longitud?: number
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  register(data: RegisterRequest): Promise<void>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
}
