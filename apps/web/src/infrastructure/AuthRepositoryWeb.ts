import type { IAuthRepository, AuthSession } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export class AuthRepositoryWeb implements IAuthRepository {
  private http = new HttpClient(API_URL)
  private tokenKey = 'token'
  private userKey = 'usuario'

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
