import type { IAuthRepository } from '@proyectointegrador/domain'
import type { RegisterDto } from '../dtos/auth/RegisterDto'

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: RegisterDto): Promise<void> {
    await this.authRepository.register({
      email: dto.email,
      password: dto.password,
      estado: 'activo',
      centroAcopioId: dto.centroAcopioId ?? null,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      telefono: dto.telefono,
      tipoIdentificacion: dto.tipoIdentificacion,
      numeroIdentificacion: dto.numeroIdentificacion,
      rol: dto.rol,
      nombreLugar: dto.nombreLugar,
      departamento: dto.departamento,
      municipio: dto.municipio,
      direccion: dto.direccion,
      latitud: dto.latitud,
      longitud: dto.longitud,
    })
  }
}
