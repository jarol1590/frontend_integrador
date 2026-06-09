export interface HttpResponse<T> {
  data: T
  status: number
}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.token) h['Authorization'] = `Bearer ${this.token}`
    return h
  }

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
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async post<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async put<T>(path: string, body: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async patch<T>(path: string, body?: unknown): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: body != null ? JSON.stringify(body) : undefined,
    })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }

  async delete<T>(path: string): Promise<HttpResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    })
    const data = await this.parseJson<T>(res)
    return { data, status: res.status }
  }
}
