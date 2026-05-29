import type { IAuthRepository } from '@proyectointegrador/domain'
import type { LoginDto, AuthResponseDto } from '../dtos/auth/AuthResponseDto'

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const session = await this.authRepository.login(dto.email, dto.password)
    return {
      accessToken: session.accessToken,
      usuario: session.usuario,
    }
  }
}
