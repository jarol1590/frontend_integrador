import type { IAuthRepository } from '@proyectointegrador/domain'

export class VerifyResetCodeUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string, code: string): Promise<string> {
    const { token } = await this.authRepository.verifyResetCode(email, code)
    return token
  }
}
