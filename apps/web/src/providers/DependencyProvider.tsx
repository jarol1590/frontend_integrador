'use client'
import { createContext, useContext, type ReactNode } from 'react'
import {
  GetUserUseCase,
  GetAllUsersUseCase,
  LoginUseCase,
  RegisterUseCase,
} from '@proyectointegrador/application'
import { UserRepositoryWeb } from '../infrastructure/UserRepositoryWeb'
import { AuthRepositoryWeb } from '../infrastructure/AuthRepositoryWeb'

const userRepository = new UserRepositoryWeb()
const authRepository = new AuthRepositoryWeb()

interface Dependencies {
  getUserUseCase:     GetUserUseCase
  getAllUsersUseCase: GetAllUsersUseCase
  loginUseCase:       LoginUseCase
  registerUseCase:    RegisterUseCase
}

const DependencyContext = createContext<Dependencies | null>(null)

export function DependencyProvider({ children }: { children: ReactNode }) {
  const deps: Dependencies = {
    getUserUseCase:     new GetUserUseCase(userRepository),
    getAllUsersUseCase: new GetAllUsersUseCase(userRepository),
    loginUseCase:       new LoginUseCase(authRepository),
    registerUseCase:    new RegisterUseCase(authRepository),
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
