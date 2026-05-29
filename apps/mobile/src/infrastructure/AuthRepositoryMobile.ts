import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IAuthRepository, AuthSession } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export class AuthRepositoryMobile implements IAuthRepository {
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

    await AsyncStorage.setItem(this.tokenKey, session.accessToken)
    await AsyncStorage.setItem(this.userKey, JSON.stringify(session.usuario))

    return session
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([this.tokenKey, this.userKey])
  }

  async getSession(): Promise<AuthSession | null> {
    const [token, userJson] = await AsyncStorage.multiGet([this.tokenKey, this.userKey])
    if (!token[1] || !userJson[1]) return null
    return {
      accessToken: token[1],
      usuario: JSON.parse(userJson[1]),
    }
  }
}
