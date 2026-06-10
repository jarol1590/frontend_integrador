const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface DepartamentoData {
    departamentoId: number
    nombre: string
}

export interface MunicipioData {
    municipioId: number
    nombre: string
    departamentoId: number
}

function extraerArray<T>(body: unknown): T[] {
    if (Array.isArray(body)) return body
    if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>
        if ('response' in obj && Array.isArray(obj.response)) return obj.response as T[]
        if ('data' in obj && Array.isArray(obj.data)) return obj.data as T[]
    }
    return []
}

function extraerObjeto(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined
    const obj = body as Record<string, unknown>
    if ('response' in obj && obj.response && typeof obj.response === 'object') {
        const resp = obj.response as Record<string, unknown>
        if ('data' in resp && resp.data && typeof resp.data === 'object')
            return resp.data as Record<string, unknown>
        return resp
    }
    if ('data' in obj && obj.data && typeof obj.data === 'object')
        return obj.data as Record<string, unknown>
    return obj
}

export async function fetchDepartamentos(): Promise<DepartamentoData[]> {
    const res = await fetch(`${API_URL}/departamentos`)
    if (!res.ok) throw new Error('Error al cargar departamentos')
    const body = await res.json()
    return extraerArray<DepartamentoData>(body)
}

export async function fetchMunicipiosPorDepartamento(departamentoId: number): Promise<MunicipioData[]> {
    const res = await fetch(`${API_URL}/municipios?departamentoId=${departamentoId}`)
    if (!res.ok) throw new Error('Error al cargar municipios')
    const body = await res.json()
    return extraerArray<MunicipioData>(body)
}

export async function findOrCreateDepartamento(nombre: string): Promise<number> {
    const res = await fetch(`${API_URL}/departamentos`)
    if (!res.ok) throw new Error('Error al consultar departamentos')
    const body = await res.json()
    const lista = extraerArray<DepartamentoData>(body)
    const existente = lista.find((d) => d.nombre.toLowerCase() === nombre.toLowerCase())
    if (existente) return existente.departamentoId

    const createRes = await fetch(`${API_URL}/departamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
    })
    const createBody = await createRes.json()
    if (!createRes.ok) {
        const obj = extraerObjeto(createBody)
        const msg = obj?.message ?? obj?.status ?? 'Error al crear departamento'
        throw new Error(String(msg))
    }
    const obj = extraerObjeto(createBody)
    const id = obj?.departamentoId ?? obj?.id
    if (!id || typeof id !== 'number') throw new Error('No se obtuvo el ID del departamento')
    return id
}

export async function findOrCreateMunicipio(nombre: string, departamentoId: number): Promise<number> {
    const res = await fetch(`${API_URL}/municipios?departamentoId=${departamentoId}`)
    if (!res.ok) throw new Error('Error al consultar municipios')
    const body = await res.json()
    const lista = extraerArray<MunicipioData>(body)
    const existente = lista.find((m) => m.nombre.toLowerCase() === nombre.toLowerCase())
    if (existente) return existente.municipioId

    const createRes = await fetch(`${API_URL}/municipios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, departamentoId }),
    })
    const createBody = await createRes.json()
    if (!createRes.ok) {
        const obj = extraerObjeto(createBody)
        const msg = obj?.message ?? obj?.status ?? 'Error al crear municipio'
        throw new Error(String(msg))
    }
    const obj = extraerObjeto(createBody)
    const id = obj?.municipioId ?? obj?.id
    if (!id || typeof id !== 'number') throw new Error('No se obtuvo el ID del municipio')
    return id
}
