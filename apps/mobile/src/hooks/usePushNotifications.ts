import { useEffect } from "react"
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { registrarTokenPush } from "../infrastructure/notificacionesApi"

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
})

export function usePushNotifications(usuarioId: number | null) {
    useEffect(() => {
        if (Platform.OS === "android") {
            Notifications.setNotificationChannelAsync("default", {
                name: "Notificaciones",
                importance: Notifications.AndroidImportance.HIGH,
            })
        }
    }, [])

    useEffect(() => {
        if (!usuarioId) return
        registerForPushAsync(usuarioId)
    }, [usuarioId])

    async function registerForPushAsync(userId: number) {
        if (!Device.isDevice) return

        const { status: existing } = await Notifications.getPermissionsAsync()
        let finalStatus = existing
        if (existing !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }
        if (finalStatus !== "granted") return

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync()
            const token = tokenData.data
            await AsyncStorage.setItem("expoPushToken", token)
            await registrarTokenPush(userId, token, Platform.OS)
        } catch {
            // Silently fail — push is best-effort
        }
    }
}
