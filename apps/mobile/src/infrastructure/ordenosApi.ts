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

export interface OrdenoDto {
    ordenoId: number
    codigo?: string
    fechaHoraInicio: string
    fechaHoraFin: string | null
    volumenLitros: number
    fincaId: number
}

export interface TransporteDto {
    transporteId: number
    placaVehiculo: string
    fechaHoraSalida: string
    fechaHoraEntrada: string | null
    temperaturaInicio: number | null
}

export interface FincaDto {
    fincaId: number
    nombre: string
    direccion: string | null
    latitud: number | null
    longitud: number | null
    productorId: number
    municipioId: number
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

export async function createOrdeno(fincaId: number, volumenLitros: number): Promise<OrdenoDto> {
    const http = await authHttp()
    const res = await http.post<any>("/ordenos", {
        fechaHoraInicio: new Date().toISOString(),
        fechaHoraFin: null,
        volumenLitros,
        fincaId,
    })
    return unwrapResponse<OrdenoDto>(res)
}

export async function createLote(ordenoId: number, volumenCapturadoLitros: number): Promise<LoteDto> {
    const http = await authHttp()
    const res = await http.post<any>("/lotes", {
        ordenoId,
        centroAcopioId: null,
        volumenCapturadoLitros,
        transporteId: null,
    })
    return unwrapResponse<LoteDto>(res)
}

export async function getLote(loteId: number): Promise<LoteDto> {
    const http = await authHttp()
    const res = await http.get<any>(`/lotes/${loteId}`)
    return unwrapResponse<LoteDto>(res)
}

export async function updateLote(loteId: number, data: { ordenoId: number; centroAcopioId: number | null; volumenCapturadoLitros: number; transporteId: number | null; }): Promise<LoteDto> {
    const http = await authHttp()
    const res = await http.put<any>(`/lotes/${loteId}`, data)
    return unwrapResponse<LoteDto>(res)
}

export async function getLotesByFinca(fincaId: number): Promise<LoteDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/lotes/por-finca/${fincaId}`)
    const data = unwrapResponse<LoteDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function getLotesByCentro(centroAcopioId: number): Promise<LoteDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/lotes/por-centro/${centroAcopioId}`)
    const data = unwrapResponse<LoteDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function getFinca(fincaId: number): Promise<FincaDto> {
    const http = await authHttp()
    const res = await http.get<any>(`/fincas/${fincaId}`)
    return unwrapResponse<FincaDto>(res)
}

export async function createTransporte(placaVehiculo: string, temperaturaInicio: number | null): Promise<TransporteDto> {
    const http = await authHttp()
    const res = await http.post<any>("/transportes", {
        placaVehiculo,
        fechaHoraSalida: new Date().toISOString(),
        fechaHoraEntrada: null,
        temperaturaInicio,
    })
    return unwrapResponse<TransporteDto>(res)
}

export async function getTransportesByCentro(centroAcopioId: number): Promise<TransporteDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/transportes/por-centro/${centroAcopioId}`)
    const data = unwrapResponse<TransporteDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function completarTransporte(transporteId: number): Promise<TransporteDto> {
    const http = await authHttp()
    const res = await http.post<any>(`/transportes/${transporteId}/completar`, {})
    return unwrapResponse<TransporteDto>(res)
}

export async function getOrdenosByFinca(fincaId: number): Promise<OrdenoDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/ordenos/por-finca/${fincaId}`)
    const data = unwrapResponse<OrdenoDto[]>(res)
    return Array.isArray(data) ? data : []
}
