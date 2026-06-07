import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IAuthRepository, AuthSession, RegisterRequest } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export class AuthRepositoryMobile implements IAuthRepository {
  private http = new HttpClient(API_URL)
  private tokenKey = 'token'
  private userKey = 'usuario'

  async register(data: RegisterRequest): Promise<void> {
    const response = await this.http.post<{
      message?: string
      status?: number
    }>('/usuarios', {
      email: data.email,
      password: data.password,
      estado: data.estado,
      rolId: data.rolId,
      centroAcopioId: data.centroAcopioId,
      productor: {
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
      },
    })

    if (response.status >= 400) {
      throw new Error(
        response.data.message ?? 'No se pudo completar el registro',
      )
    }
  }

  async forgotPassword(email: string): Promise<void> {
    // API siempre retorna 200 con { message }
    await this.http.post<{ message?: string }>('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await this.http.post<{
      message?: string
      title?: string
      errors?: string[]
    }>('/auth/reset-password', { token, newPassword })

    if (!response.data.message) {
      throw new Error(
        response.data.title ??
          response.data.errors?.[0] ??
          'No se pudo restablecer la contraseña',
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
