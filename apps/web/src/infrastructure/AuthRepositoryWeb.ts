import type { IAuthRepository, AuthSession, RegisterRequest } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export class AuthRepositoryWeb implements IAuthRepository {
  private http = new HttpClient(API_URL)
  private tokenKey = 'token'
  private userKey = 'usuario'

  async register(data: RegisterRequest): Promise<void> {
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
    if (data.rolId === 2 && data.centroAcopio) {
      body.centroAcopio = {
        nombre: data.centroAcopio.nombre,
        direccion: data.centroAcopio.direccion,
        latitud: data.centroAcopio.latitud,
        longitud: data.centroAcopio.longitud,
        municipioId: data.centroAcopio.municipioId,
      }
    }
    if (data.rolId === 4 && data.trabajador) {
      body.trabajador = {
        nombre: data.trabajador.nombre,
        documento: data.trabajador.documento,
        telefono: data.trabajador.telefono,
        tipoDocumentoId: data.trabajador.tipoDocumentoId,
      }
    }

    const response = await this.http.post<{
      success?: boolean
      status?: number
      message?: string
      errors?: string | string[]
    }>('/usuarios', body)

    if (response.status >= 400 || (response.data && 'success' in response.data && !response.data.success)) {
      throw new Error(
        response.data?.message ??
          (Array.isArray(response.data?.errors) ? response.data.errors.join(', ') : response.data?.errors) ??
          'No se pudo completar el registro',
      )
    }
  }

  async forgotPassword(email: string): Promise<void> {
    // API siempre retorna 200 con { message }
    await this.http.post<{ message?: string }>('/auth/forgot-password', { email })
  }

  async verifyResetCode(email: string, code: string): Promise<{ token: string }> {
    const response = await this.http.post<{
      response?: { token?: string }
      message?: string
    }>('/auth/verify-reset-code', { email, code })

    const token = response.data.response?.token
    if (!token) {
      throw new Error(response.data.message ?? 'Código inválido')
    }
    return { token }
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
