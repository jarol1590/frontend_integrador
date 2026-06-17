import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IUserRepository, User } from '@proyectointegrador/domain'
import { HttpClient } from '@proyectointegrador/shared-infra'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

export class UserRepositoryMobile implements IUserRepository {
  private http = new HttpClient(API_URL)
  private cacheKey = 'users_cache'

  async findById(id: string): Promise<User | null> {
    try {
      const { data } = await this.http.get<User>(`/users/${id}`)
      return data
    } catch {
      return null
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const { data } = await this.http.get<User[]>('/users')
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(data))
      return data
    } catch {
      // Fallback a caché local si no hay red
      const cached = await AsyncStorage.getItem(this.cacheKey)
      return cached ? JSON.parse(cached) : []
    }
  }

  async save(user: User): Promise<void> {
    await this.http.post('/users', user)
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(`/users/${id}`)
  }
}
