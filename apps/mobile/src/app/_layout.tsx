import { Stack } from 'expo-router'
import { DependencyProvider } from '../providers/DependencyProvider'

export default function RootLayout() {
  return (
    <DependencyProvider>
      <Stack />
    </DependencyProvider>
  )
}
