const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ""

function chatBaseUrl(): string {
  try {
    const url = new URL(API_URL)
    url.port = "8000"
    return url.toString().replace(/\/+$/, "").replace(/\/api$/, "")
  } catch {
    return "http://localhost:8000"
  }
}

export interface ChatRequest {
  question: string
  session_id: string
}

export interface ChatSource {
  source: string
  section: string
  page: number
  preview: string
}

export interface ChatResponse {
  answer: string
  blocked: boolean
  reason: string
  sources: ChatSource[]
  scores: number[]
  session_id: string
}

export async function sendChatMessage(
  question: string,
  sessionId: string,
): Promise<ChatResponse> {
  const res = await fetch(`${chatBaseUrl()}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, session_id: sessionId } satisfies ChatRequest),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Error al comunicarse con el asistente")
  }
  return res.json()
}
