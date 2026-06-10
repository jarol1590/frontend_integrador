import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export interface ResultadoVisual {
    parametroNombre: string
    unidad: string | null
    valorResultado: number
    valorMinimo: number | null
    valorMaximo: number | null
    dentroDeRango: boolean
}

export interface AnalisisPorFinca {
    analisisId: number
    loteId: number
    fincaNombre: string
    fechaAnalisis: string
    resultados: ResultadoVisual[]
}

export interface FincaResumen {
    fincaId: number
    nombre: string
    municipioId: number
}

export interface ProductorPerfil {
    usuarioId: number
    email: string
    estado: string
    fechaCreacion: string
    tipoUsuario: string
    rol: { rolId: number; nombre: string; descripcion: string | null }
    productor: {
        productorId: number
        nombre: string
        documento: string
        telefono: string | null
        tipoDocumentoId: number
    }
    fincas: FincaResumen[]
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

export async function getMiPerfil(): Promise<ProductorPerfil> {
    const res = await authHttp().get<any>("/usuarios/me")
    return unwrapResponse<ProductorPerfil>(res)
}

export async function getAnalisisPorFinca(fincaId: number): Promise<AnalisisPorFinca[]> {
    const res = await authHttp().get<any>(`/analisis-calidad/por-finca/${fincaId}`)
    const data = unwrapResponse<AnalisisPorFinca[]>(res)
    return Array.isArray(data) ? data : []
}
