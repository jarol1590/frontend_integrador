import type { IAuthRepository } from '@proyectointegrador/domain'

export class VerifyResetCodeUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(token: string): Promise<void> {
    await this.authRepository.verifyResetCode(token)
  }
}
