import AsyncStorage from "@react-native-async-storage/async-storage"
import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

export interface ClimaActualDto {
    fecha: string
    tempMedia: number
    humedadMedia: number | null
    thiMax: number | null
    diasConsecutivosCalor: number
}

export interface FincaGemeloEstadoDto {
    fincaId: number
    fincaNombre: string
    ultimaSyncUtc: string | null
    versionMotor: string
    fuenteClima: string
    estadoSync: string
    scoreRiesgoGlobal: number
    climaActual: ClimaActualDto | null
    alertasActivas: number
}

export interface LecturaClimaticaDto {
    fecha: string
    tempMin: number
    tempMax: number
    tempMedia: number
    humedadMedia: number | null
    precipitacionMm: number | null
    thiMax: number | null
    diasConsecutivosCalor: number
    fuente: string
}

export interface PrediccionGemeloDto {
    tipoPrediccion: string
    horizonteDias: number
    valor: number
    confianza: number
    unidad: string | null
    generadaUtc: string
    detalleJson: string | null
}

export interface AlertaGemeloDto {
    alertaId: number
    fincaId: number
    tipoAlerta: string
    severidad: string
    titulo: string
    mensaje: string
    recomendacion: string | null
    creadaUtc: string
    expiraUtc: string | null
    leida: boolean
}

export interface SincronizarGemeloResultDto {
    fincaId: number
    syncUtc: string
    estadoSync: string
    lecturasActualizadas: number
    prediccionesGeneradas: number
    alertasNuevas: number
    scoreRiesgoGlobal: number
}

async function authHttp(): Promise<HttpClient> {
    const token = await AsyncStorage.getItem("token")
    return new HttpClient(API_URL, token ?? undefined)
}

function unwrapResponse<T>(res: { data: any; status: number }): T {
    const d = res.data
    if (d?.success === false) {
        const msg = d.errors
            ?? d.response?.message
            ?? `Error del servidor (${d.status})`
        throw new Error(msg)
    }
    const raw = d?.response ?? d
    return (raw?.data ?? raw) as T
}

export async function getGemeloEstado(fincaId: number): Promise<FincaGemeloEstadoDto> {
    const http = await authHttp()
    const res = await http.get<any>(`/fincas/${fincaId}/gemelo/estado`)
    return unwrapResponse<FincaGemeloEstadoDto>(res)
}

export async function getClima(
    fincaId: number,
    desde: string,
    hasta: string
): Promise<LecturaClimaticaDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/fincas/${fincaId}/gemelo/clima?desde=${desde}&hasta=${hasta}`)
    const data = unwrapResponse<LecturaClimaticaDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function getPredicciones(
    fincaId: number,
    horizonteDias: number = 7
): Promise<PrediccionGemeloDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/fincas/${fincaId}/gemelo/predicciones?horizonteDias=${horizonteDias}`)
    const data = unwrapResponse<PrediccionGemeloDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function getAlertas(
    fincaId: number,
    activas: boolean = true
): Promise<AlertaGemeloDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/fincas/${fincaId}/gemelo/alertas?activas=${activas}`)
    const data = unwrapResponse<AlertaGemeloDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function sincronizarGemelo(fincaId: number): Promise<SincronizarGemeloResultDto> {
    const http = await authHttp()
    const res = await http.post<any>(`/fincas/${fincaId}/gemelo/sincronizar`, {})
    return unwrapResponse<SincronizarGemeloResultDto>(res)
}

export async function marcarAlertaLeida(fincaId: number, alertaId: number): Promise<void> {
    const http = await authHttp()
    const res = await http.patch<any>(`/fincas/${fincaId}/gemelo/alertas/${alertaId}/leida`)
    unwrapResponse(res)
}
