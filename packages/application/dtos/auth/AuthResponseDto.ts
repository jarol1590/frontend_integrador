export interface UsuarioDto {
  usuarioId: string
  email: string
  estado: string
  fechaCreacion: string
  centroAcopio: string
}

export interface AuthResponseDto {
  accessToken: string
  usuario: UsuarioDto
}

export interface LoginDto {
  email: string
  password: string
}
