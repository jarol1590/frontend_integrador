import { createContext, useContext, type ReactNode } from 'react'
import {
  GetUserUseCase,
  GetAllUsersUseCase,
  LoginUseCase,
} from '@proyectointegrador/application'
import { UserRepositoryMobile } from '../infrastructure/UserRepositoryMobile'
import { AuthRepositoryMobile } from '../infrastructure/AuthRepositoryMobile'

const userRepository = new UserRepositoryMobile()
const authRepository = new AuthRepositoryMobile()

interface Dependencies {
  getUserUseCase:     GetUserUseCase
  getAllUsersUseCase: GetAllUsersUseCase
  loginUseCase:       LoginUseCase
}

const DependencyContext = createContext<Dependencies | null>(null)

export function DependencyProvider({ children }: { children: ReactNode }) {
  const deps: Dependencies = {
    getUserUseCase:     new GetUserUseCase(userRepository),
    getAllUsersUseCase: new GetAllUsersUseCase(userRepository),
    loginUseCase:       new LoginUseCase(authRepository),
  }

  return (
    <DependencyContext.Provider value={deps}>
      {children}
    </DependencyContext.Provider>
  )
}

export function useDependencies(): Dependencies {
  const ctx = useContext(DependencyContext)
  if (!ctx) throw new Error('useDependencies debe usarse dentro de DependencyProvider')
  return ctx
}
