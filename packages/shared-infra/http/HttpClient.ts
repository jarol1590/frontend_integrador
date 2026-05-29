export interface HttpResponse<T> {
  data: T
  status: number
}

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`)
    const data = await res.json()
    return { data, status: res.status }
  }

  async post<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return { data, status: res.status }
  }

  async put<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return { data, status: res.status }
  }

  async delete<T>(path: string): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE' })
    const data = await res.json()
    return { data, status: res.status }
  }
}
