import AsyncStorage from "@react-native-async-storage/async-storage"
import { HttpClient } from "@proyectointegrador/shared-infra"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

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

async function authHttp(): Promise<HttpClient> {
    const token = await AsyncStorage.getItem("token")
    return new HttpClient(API_URL, token ?? undefined)
}

export async function getParametrosByCentro(centroAcopioId: number): Promise<ParametroCalidadDto[]> {
    const http = await authHttp()
    const res = await http.get<any>(`/parametros-calidad/centro/${centroAcopioId}`)
    const raw = Array.isArray(res.data) ? res.data : res.data?.response ?? []
    return Array.isArray(raw) ? raw : []
}

export async function createParametro(dto: CreateParametroDto): Promise<ParametroCalidadDto> {
    const http = await authHttp()
    const res = await http.post<any>("/parametros-calidad", dto)
    return res.data?.response ?? res.data
}

export async function updateParametro(id: number, dto: UpdateParametroDto): Promise<void> {
    const http = await authHttp()
    await http.put(`/parametros-calidad/${id}`, dto)
}

export async function deleteParametro(id: number): Promise<void> {
    const http = await authHttp()
    await http.delete(`/parametros-calidad/${id}`)
}
