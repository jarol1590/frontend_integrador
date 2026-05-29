import type { IUserRepository } from '@proyectointegrador/domain'
import type { UserDTO } from '../dtos/UserDTO'

export class GetAllUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserDTO[]> {
    const users = await this.userRepository.findAll()
    return users.map(u => ({ id: u.id, name: u.name, email: u.email }))
  }
}
