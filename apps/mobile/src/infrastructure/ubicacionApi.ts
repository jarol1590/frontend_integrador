const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

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
  // Busca primero response.data (POST success), luego response, luego data, luego body plano
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
  console.log('[DEBUG] fetchDepartamentos raw:', JSON.stringify(body).slice(0, 300))
  return extraerArray<DepartamentoData>(body)
}

export async function fetchMunicipiosPorDepartamento(departamentoId: number): Promise<MunicipioData[]> {
  const res = await fetch(`${API_URL}/municipios?departamentoId=${departamentoId}`)
  if (!res.ok) throw new Error('Error al cargar municipios')
  const body = await res.json()
  console.log('[DEBUG] fetchMunicipios raw:', JSON.stringify(body).slice(0, 300))
  return extraerArray<MunicipioData>(body)
}

export async function findOrCreateDepartamento(nombre: string): Promise<number> {
  console.log('[DEBUG] findOrCreateDepartamento buscando:', nombre)
  const res = await fetch(`${API_URL}/departamentos`)
  if (!res.ok) throw new Error('Error al consultar departamentos')
  const body = await res.json()
  console.log('[DEBUG] GET /departamentos raw:', JSON.stringify(body).slice(0, 500))
  const lista = extraerArray<DepartamentoData>(body)
  console.log('[DEBUG] deptos extraídos:', JSON.stringify(lista).slice(0, 500))
  const existente = lista.find((d) => d.nombre.toLowerCase() === nombre.toLowerCase())
  console.log('[DEBUG] encontrado?', existente)
  if (existente) return existente.departamentoId

  console.log('[DEBUG] No encontrado, creando departamento:', nombre)
  const createRes = await fetch(`${API_URL}/departamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  })
  const createBody = await createRes.json()
  console.log('[DEBUG] POST /departamentos response:', JSON.stringify(createBody))
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
  console.log('[DEBUG] findOrCreateMunicipio buscando:', nombre, 'en deptoId:', departamentoId)
  const res = await fetch(`${API_URL}/municipios?departamentoId=${departamentoId}`)
  if (!res.ok) throw new Error('Error al consultar municipios')
  const body = await res.json()
  console.log('[DEBUG] GET /municipios raw:', JSON.stringify(body).slice(0, 500))
  const lista = extraerArray<MunicipioData>(body)
  console.log('[DEBUG] municipios extraídos:', JSON.stringify(lista).slice(0, 500))
  const existente = lista.find((m) => m.nombre.toLowerCase() === nombre.toLowerCase())
  console.log('[DEBUG] municipio encontrado?', existente)
  if (existente) return existente.municipioId

  console.log('[DEBUG] No encontrado, creando municipio:', nombre, 'deptoId:', departamentoId)
  const createRes = await fetch(`${API_URL}/municipios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, departamentoId }),
  })
  const createBody = await createRes.json()
  console.log('[DEBUG] POST /municipios response:', JSON.stringify(createBody))
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
