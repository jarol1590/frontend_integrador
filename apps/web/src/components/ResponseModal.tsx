'use client'
import { X } from 'lucide-react'

interface Props {
    visible: boolean
    type: 'success' | 'error'
    title: string
    message: string
    onClose: () => void
}

export default function ResponseModal({ visible, type, title, message, onClose }: Props) {
    if (!visible) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3">
                    <h3 className={`font-bold text-lg ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {type === 'success' ? '✓' : '✕'} {title}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-gray-700 text-sm">{message}</p>
            </div>
        </div>
    )
}
