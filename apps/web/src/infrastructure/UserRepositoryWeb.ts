import type { IUserRepository, User } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

export class UserRepositoryWeb implements IUserRepository {
  private http = new HttpClient(process.env.NEXT_PUBLIC_API_URL ?? '')

  async findById(id: string): Promise<User | null> {
    try {
      const { data } = await this.http.get<User>(`/users/${id}`)
      return data
    } catch {
      return null
    }
  }

  async findAll(): Promise<User[]> {
    const { data } = await this.http.get<User[]>('/users')
    return data
  }

  async save(user: User): Promise<void> {
    await this.http.post('/users', user)
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/users/${id}`)
  }
}
