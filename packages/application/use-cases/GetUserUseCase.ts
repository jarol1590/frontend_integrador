import type { IUserRepository } from '@proyectointegrador/domain'
import type { UserDTO } from '../dtos/UserDTO'

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(id)
    if (!user) return null
    return { id: user.id, name: user.name, email: user.email }
  }
}
