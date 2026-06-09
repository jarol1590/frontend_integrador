import AsyncStorage from "@react-native-async-storage/async-storage"
import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

export interface LoteDto {
    loteId: number
    codigo?: string
    ordenoId: number
    centroAcopioId: number | null
    volumenCapturadoLitros: number
    transporteId: number | null
    transporteFechaHoraEntrada: string | null
    fincaNombre?: string
}

export interface MuestraDto {
    muestraId: number
    loteId: number
    tecnicoPorUsuarioId: number
    fechaHoraToma: string
}

export interface MuestraConEstadoDto extends MuestraDto {
    tieneAnalisis: boolean
}

export interface AnalisisCalidadDto {
    analisisId: number
    muestraId: number
    fechaHoraAnalisis: string
    observaciones: string | null
}

export interface ResultadoParametroDto {
    analisisId: number
    parametroId: number
    valorResultado: number
    observacion: string | null
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

export async function getLotesByCentro(centroAcopioId: number): Promise<LoteDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/lotes/por-centro/${centroAcopioId}`)
    const data = unwrapResponse<LoteDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function getMuestrasByLote(loteId: number): Promise<MuestraConEstadoDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/muestras/por-lote/${loteId}`)
    const data = unwrapResponse<MuestraConEstadoDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function createMuestra(loteId: number, usuarioId: number): Promise<MuestraDto> {
    const http = await authHttp()
    const res = await http.post<any>("/muestras", {
        loteId,
        tecnicoPorUsuarioId: usuarioId,
        fechaHoraToma: new Date().toISOString(),
    })
    return unwrapResponse<MuestraDto>(res)
}

export async function createAnalisis(muestraId: number, observaciones: string): Promise<AnalisisCalidadDto> {
    const http = await authHttp()
    const res = await http.post<any>("/analisis-calidad", {
        muestraId,
        fechaHoraAnalisis: new Date().toISOString(),
        observaciones: observaciones || null,
    })
    return unwrapResponse<AnalisisCalidadDto>(res)
}

export async function createResultado(analisisId: number, parametroId: number, valorResultado: number, observacion: string | null): Promise<void> {
    const http = await authHttp()
    const res = await http.post<any>("/resultados-parametro", {
        analisisId,
        parametroId,
        valorResultado,
        observacion,
    })
    unwrapResponse(res)
}
