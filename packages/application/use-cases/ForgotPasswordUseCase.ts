import type { IAuthRepository } from '@proyectointegrador/domain'
import type { ForgotPasswordDto } from '../dtos/auth/ForgotPasswordDto'

export class ForgotPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    await this.authRepository.forgotPassword(dto.email)
  }
}
