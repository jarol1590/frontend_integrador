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

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
}
