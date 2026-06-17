import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { DependencyProvider } from '../providers/DependencyProvider'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'

export default function RootLayout() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, any> | undefined
      if (data?.screen && data?.loteId) {
        router.push(`/${data.screen}?loteId=${data.loteId}` as any)
      }
    })
    return () => sub.remove()
  }, [])

  return (
    <SafeAreaProvider>
      <DependencyProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DependencyProvider>
    </SafeAreaProvider>
  )
}
