import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IAuthRepository, AuthSession, RegisterRequest } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export class AuthRepositoryMobile implements IAuthRepository {
  private http = new HttpClient(API_URL)
  private tokenKey = 'token'
  private userKey = 'usuario'

  async register(data: RegisterRequest): Promise<void> {
    console.log('[DEBUG AUTH REPO] register called with:', JSON.stringify(data, null, 2))

    const body: Record<string, any> = {
      email: data.email,
      password: data.password,
      estado: data.estado,
      rolId: data.rolId,
      centroAcopioId: data.centroAcopioId,
    }
    if (data.rolId === 3) {
      body.productor = {
        nombre: data.productorNombre,
        documento: data.documento,
        telefono: data.telefono,
        tipoDocumentoId: data.tipoDocumentoId,
        fincaInicial: {
          nombre: data.fincaNombre ?? '',
          direccion: data.direccion ?? '',
          latitud: data.latitud ?? 0,
          longitud: data.longitud ?? 0,
          municipioId: data.municipioId,
        },
      }
    }
    console.log('[DEBUG AUTH REPO] POST /usuarios body:', JSON.stringify(body, null, 2))

    const response = await this.http.post<{
      message?: string
      status?: number
    }>('/usuarios', body)

    console.log('[DEBUG AUTH REPO] POST /usuarios response status:', response.status, 'data:', JSON.stringify(response.data, null, 2))

    if (response.status >= 400) {
      console.log('[DEBUG AUTH REPO] Error response:', JSON.stringify(response.data, null, 2))
      throw new Error(
        response.data.message ?? 'No se pudo completar el registro',
      )
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await this.http.post<{ message?: string }>('/auth/forgot-password', { email })
  }

  async verifyResetCode(token: string): Promise<void> {
    const response = await this.http.post<{
      success: boolean
      status: number
      method: string
      errors: string | null
      response: { message?: string } | null
    }>('/auth/verify-reset-code', { token })

    if (!response.data.success) {
      throw new Error(
        response.data.errors ?? 'Código inválido',
      )
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await this.http.post<{
      success: boolean
      status: number
      method: string
      errors: string | null
      response: { message?: string } | null
    }>('/auth/reset-password', { token, newPassword })

    if (!response.data.success) {
      throw new Error(
        response.data.errors ?? 'No se pudo restablecer la contraseña',
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
