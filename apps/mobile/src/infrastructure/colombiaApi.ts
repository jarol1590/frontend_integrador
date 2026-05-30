const BASE_URL = 'https://api-colombia.com/api/v1'

export interface DepartmentData {
  id: number
  name: string
}

export interface CityData {
  id: number
  name: string
}

export async function fetchDepartments(): Promise<DepartmentData[]> {
  const res = await fetch(`${BASE_URL}/Department`)
  if (!res.ok) throw new Error('Error al cargar departamentos')
  return res.json()
}

export async function fetchCitiesByDepartment(departmentId: number): Promise<CityData[]> {
  const res = await fetch(`${BASE_URL}/Department/${departmentId}/cities`)
  if (!res.ok) throw new Error('Error al cargar municipios')
  return res.json()
}
