'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { GetUserUseCase, GetAllUsersUseCase } from '@proyectointegrador/application'
import { UserRepositoryWeb } from '../infrastructure/UserRepositoryWeb'

const userRepository = new UserRepositoryWeb()

interface Dependencies {
  getUserUseCase:     GetUserUseCase
  getAllUsersUseCase: GetAllUsersUseCase
}

const DependencyContext = createContext<Dependencies | null>(null)

export function DependencyProvider({ children }: { children: ReactNode }) {
  const deps: Dependencies = {
    getUserUseCase:     new GetUserUseCase(userRepository),
    getAllUsersUseCase: new GetAllUsersUseCase(userRepository),
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
