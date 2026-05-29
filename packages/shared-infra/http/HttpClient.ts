export interface HttpResponse<T> {
  data: T
  status: number
}

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  private async parseJson<T>(res: Response): Promise<T> {
    const text = await res.text()
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(
        `El servidor respondió con HTTP ${res.status} en lugar de JSON. ` +
          `URL: ${res.url}. Respuesta: ${text.slice(0, 200)}`,
      )
    }
  }

  async get<T>(path: string): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`)
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async post<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async put<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async delete<T>(path: string): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE' })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }
}
