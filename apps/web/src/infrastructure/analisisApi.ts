import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

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

function authHttp(): HttpClient {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") ?? undefined : undefined
    return new HttpClient(API_URL, token)
}

function unwrapResponse<T>(res: { data: any; status: number }): T {
    const d = res.data
    if (d?.success === false) {
        const msg = d.errors ?? d.response?.message ?? `Error del servidor (${d.status})`
        throw new Error(msg)
    }
    const raw = d?.response ?? d
    return (raw?.data ?? raw) as T
}

export async function getLotesByCentro(centroAcopioId: number): Promise<LoteDto[]> {
    const res = await authHttp().get<any>(`/lotes/por-centro/${centroAcopioId}`)
    const data = unwrapResponse<LoteDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function getMuestrasByLote(loteId: number): Promise<MuestraConEstadoDto[]> {
    const res = await authHttp().get<any>(`/muestras/por-lote/${loteId}`)
    const data = unwrapResponse<MuestraConEstadoDto[]>(res)
    return Array.isArray(data) ? data : []
}

export async function createMuestra(loteId: number, usuarioId: number): Promise<MuestraDto> {
    const res = await authHttp().post<any>("/muestras", {
        loteId, tecnicoPorUsuarioId: usuarioId, fechaHoraToma: new Date().toISOString(),
    })
    return unwrapResponse<MuestraDto>(res)
}

export async function createAnalisis(muestraId: number, observaciones: string): Promise<AnalisisCalidadDto> {
    const res = await authHttp().post<any>("/analisis-calidad", {
        muestraId, fechaHoraAnalisis: new Date().toISOString(), observaciones: observaciones || null,
    })
    return unwrapResponse<AnalisisCalidadDto>(res)
}

export async function createResultado(analisisId: number, parametroId: number, valorResultado: number, observacion: string | null): Promise<void> {
    const res = await authHttp().post<any>("/resultados-parametro", { analisisId, parametroId, valorResultado, observacion })
    unwrapResponse(res)
}
