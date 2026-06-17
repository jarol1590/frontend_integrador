'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader2 } from 'lucide-react'
import { sendChatMessage } from '../infrastructure/chatApi'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface Props {
    visible: boolean
    onClose: () => void
}

export default function ChatModal({ visible, onClose }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?' },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const sessionId = useRef(`web_${Date.now()}`)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (visible) {
            setMessages([{ role: 'assistant', content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?' }])
            sessionId.current = `web_${Date.now()}`
        }
    }, [visible])

    const handleSend = async () => {
        if (!input.trim() || loading) return
        const question = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: question }])
        setLoading(true)
        try {
            const res = await sendChatMessage(question, sessionId.current)
            setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }])
        } finally {
            setLoading(false)
        }
    }

    if (!visible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[80vh] sm:max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Bot size={22} className="text-blue-500" />
                        <span className="font-bold text-gray-800">Asistente Virtual</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                            {m.role === 'assistant' && (
                                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} className="text-blue-600" />
                                </div>
                            )}
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role === 'user'
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}>
                                {m.content}
                            </div>
                            {m.role === 'user' && (
                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={14} className="text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                <Bot size={14} className="text-blue-600" />
                            </div>
                            <div className="bg-gray-100 rounded-xl px-3 py-2">
                                <Loader2 size={16} className="animate-spin text-gray-400" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-3 flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu mensaje..."
                        className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()}
                        className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
