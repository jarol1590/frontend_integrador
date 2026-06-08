export interface UsuarioDto {
  usuarioId: number
  email: string
  estado: string
  fechaCreacion: string
  tipoUsuario: string
  rolNombre: string
  rolId?: number
  centroAcopio?: string
}

export interface AuthResponseDto {
  accessToken: string
  usuario: UsuarioDto
}

export interface LoginDto {
  email: string
  password: string
}
