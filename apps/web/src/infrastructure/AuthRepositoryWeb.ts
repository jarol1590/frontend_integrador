import type { IAuthRepository, AuthSession, RegisterRequest } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export class AuthRepositoryWeb implements IAuthRepository {
  private http = new HttpClient(API_URL)
  private tokenKey = 'token'
  private userKey = 'usuario'

  async register(data: RegisterRequest): Promise<void> {
    const response = await this.http.post<{
      response?: unknown
      title?: string
      detail?: string
    }>('/usuarios', {
      email: data.email,
      password: data.password,
      estado: data.estado,
      centroAcopioId: data.centroAcopioId,
    })

    if (!response.data.response) {
      if (response.status === 409 || response.status === 500) {
        throw new Error('Este correo electrónico ya está registrado.')
      }
      throw new Error(
        response.data.title ??
          response.data.detail ??
          'No se pudo completar el registro',
      )
    }
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const response = await this.http.post<{
      response?: AuthSession
      message?: string
      errors?: string[]
    }>('/auth/login', { email, password })

    if (!response.data.response) {
      throw new Error(
        response.data.message ??
          response.data.errors?.[0] ??
          'Credenciales incorrectas',
      )
    }

    const session = response.data.response

    localStorage.setItem(this.tokenKey, session.accessToken)
    localStorage.setItem(this.userKey, JSON.stringify(session.usuario))

    return session
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
  }

  async getSession(): Promise<AuthSession | null> {
    const token = localStorage.getItem(this.tokenKey)
    const userJson = localStorage.getItem(this.userKey)
    if (!token || !userJson) return null
    return {
      accessToken: token,
      usuario: JSON.parse(userJson),
    }
  }
}
