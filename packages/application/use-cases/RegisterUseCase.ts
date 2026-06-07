import type { IAuthRepository } from '@proyectointegrador/domain'
import type { RegisterDto } from '../dtos/auth/RegisterDto'

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: RegisterDto): Promise<void> {
    await this.authRepository.register({
      email: dto.email,
      password: dto.password,
      estado: 'activo',
      rolId: dto.rolId,
      centroAcopioId: dto.centroAcopioId ?? null,
      productorNombre: dto.productorNombre,
      documento: dto.documento,
      telefono: dto.telefono,
      tipoDocumentoId: dto.tipoDocumentoId,
      fincaNombre: dto.fincaNombre,
      direccion: dto.direccion,
      latitud: dto.latitud,
      longitud: dto.longitud,
      municipioId: dto.municipioId,
    })
  }
}
