'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Car, MessageCircle } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import ResponseModal from '../../components/ResponseModal'

export default function DashboardCentro() {
    const router = useRouter()
    const [userName, setUserName] = useState('')
    const [userRole, setUserRole] = useState('')
    const [centroNombre, setCentroNombre] = useState('')
    const [centroDireccion, setCentroDireccion] = useState('')
    const [chatVisible, setChatVisible] = useState(false)
    const [respModal, setRespModal] = useState({ visible: false, type: 'success' as 'success' | 'error', title: '', message: '' })

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userJson = localStorage.getItem('usuario')
                const token = localStorage.getItem('token')
                if (!userJson) return
                const user = JSON.parse(userJson)
                setUserName(user.email ?? '')
                setUserRole(user.rolNombre ?? '')

                // Obtener nombre real según el rol
                if (user.usuarioId && token) {
                    try {
                        const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/usuarios/public/${user.usuarioId}`,
                            { headers: { Authorization: `Bearer ${token}` } },
                        )
                        const json = await res.json()
                        const data = json.response ?? json
                        if (data?.trabajador?.nombre) {
                            setUserName(data.trabajador.nombre)
                        } else if (data?.centroAcopio?.nombre) {
                            setUserName(data.centroAcopio.nombre)
                        } else if (data?.productor?.nombre) {
                            setUserName(data.productor.nombre)
                        }
                    } catch { /* fallback a email */ }
                }

                if (user.centroAcopioId && token) {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/centros-acopio/${user.centroAcopioId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    const json = await res.json()
                    const centro = json.response ?? json
                    setCentroNombre(centro?.nombre ?? 'Centro de acopio')
                    setCentroDireccion(centro?.direccion ?? '')
                }
            } catch {
                // silent
            }
        }
        loadUser()
    }, [])

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-lg">{userRole === 'Trabajador Centro de acopio' ? '🔧' : '🏢'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{userRole === 'Trabajador Centro de acopio' ? 'Trabajador' : 'Centro de acopio'}</p>
                            <p className="text-sm font-bold text-gray-800">{userName}</p>
                        </div>
                    </div>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); window.location.href = '/login' }}
                        className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors">
                        <span className="text-red-500 text-lg">✕</span>
                    </button>
                </div>

                {/* Centro info */}
                {centroNombre && (
                    <div className="bg-white/97 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-lg font-bold">C</span>
                        </div>
                        <div>
                            <p className="text-base font-bold text-gray-800">{centroNombre}</p>
                            {centroDireccion && <p className="text-xs text-gray-400">{centroDireccion}</p>}
                        </div>
                    </div>
                )}

                {/* Gestión */}
                <p className="text-sm font-bold text-gray-700 -mb-3">Gestión</p>

                {userRole !== 'Trabajador Centro de acopio' && (
                    <button onClick={() => router.push('/parametros')} className="w-full bg-white/97 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                        <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center">
                            <FlaskConical size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Parámetros de calidad</p>
                            <p className="text-xs text-gray-400">Agregar, editar o quitar campos del formulario</p>
                        </div>
                        <span className="text-gray-300 text-lg">›</span>
                    </button>
                )}

                <button onClick={() => router.push('/analisis')} className="w-full bg-white/97 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                    <div className="w-11 h-11 bg-green-50 rounded-full flex items-center justify-center">
                        <FlaskConical size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Nuevo análisis</p>
                        <p className="text-xs text-gray-400">Registrar valores de calidad para un lote</p>
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                </button>

                <button onClick={() => router.push('/transportes')} className="w-full bg-white/97 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                    <div className="w-11 h-11 bg-orange-50 rounded-full flex items-center justify-center">
                        <Car size={20} className="text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Transportes</p>
                        <p className="text-xs text-gray-400">Ver transportes abiertos y completados</p>
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                </button>

                {/* Calendario placeholder */}
                <p className="text-sm font-bold text-gray-700 -mb-3">Calendario</p>
                <div className="bg-white/97 rounded-2xl p-6 flex flex-col items-center gap-2">
                    <span className="text-gray-300 text-2xl">📅</span>
                    <p className="text-xs text-gray-400 text-center">Calendario de actividades próximamente</p>
                </div>

                {/* Chat FAB */}
                <button onClick={() => setChatVisible(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-30">
                    <MessageCircle size={24} className="text-white" />
                </button>
            </div>

            <ResponseModal
                visible={respModal.visible}
                type={respModal.type}
                title={respModal.title}
                message={respModal.message}
                onClose={() => setRespModal(prev => ({ ...prev, visible: false }))}
            />
        </AppLayout>
    )
}
