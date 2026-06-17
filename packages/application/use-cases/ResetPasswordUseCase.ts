import type { IAuthRepository } from '@proyectointegrador/domain'
import type { ResetPasswordDto } from '../dtos/auth/ResetPasswordDto'

export class ResetPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    await this.authRepository.resetPassword(dto.token, dto.newPassword)
  }
}
