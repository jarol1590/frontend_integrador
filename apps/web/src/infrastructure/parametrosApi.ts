import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export interface ParametroCalidadDto {
    parametroId: number
    centroAcopioId: number | null
    nombre: string
    unidad: string | null
    valorMinimo: number | null
    valorMaximo: number | null
    descripcion: string | null
    orden: number
}

export interface CreateParametroDto {
    centroAcopioId: number | null
    nombre: string
    unidad: string | null
    valorMinimo: number | null
    valorMaximo: number | null
    descripcion: string | null
    orden: number
}

export interface UpdateParametroDto {
    nombre: string
    unidad: string | null
    valorMinimo: number | null
    valorMaximo: number | null
    descripcion: string | null
    orden: number
}

function authHttp(): HttpClient {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") ?? undefined : undefined
    return new HttpClient(API_URL, token)
}

export async function getParametrosByCentro(centroAcopioId: number): Promise<ParametroCalidadDto[]> {
    const res = await authHttp().get<any>(`/parametros-calidad/centro/${centroAcopioId}`)
    const raw = Array.isArray(res.data) ? res.data : res.data?.response ?? []
    return Array.isArray(raw) ? raw : []
}

export async function createParametro(dto: CreateParametroDto): Promise<ParametroCalidadDto> {
    const res = await authHttp().post<any>("/parametros-calidad", dto)
    return res.data?.response ?? res.data
}

export async function updateParametro(id: number, dto: UpdateParametroDto): Promise<void> {
    await authHttp().put(`/parametros-calidad/${id}`, dto)
}

export async function deleteParametro(id: number): Promise<void> {
    await authHttp().delete(`/parametros-calidad/${id}`)
}
