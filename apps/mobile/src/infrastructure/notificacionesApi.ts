import AsyncStorage from "@react-native-async-storage/async-storage"
import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

export async function registrarTokenPush(usuarioId: number, token: string, platform: string) {
    const httpToken = await AsyncStorage.getItem("token")
    const http = new HttpClient(API_URL, httpToken ?? undefined)
    await http.post("/notificaciones/registrar-token", { usuarioId, token, platform })
}

export async function eliminarTokenPush(token: string) {
    const httpToken = await AsyncStorage.getItem("token")
    const http = new HttpClient(API_URL, httpToken ?? undefined)
    await http.delete(`/notificaciones/token?token=${encodeURIComponent(token)}`)
}
